import type {
  TranslationRequest,
  TranslationResult,
  ResolvedGlossary,
  QualityEvaluation,
} from "../types/index.js";
import type {
  LLMProvider,
  ChatMessage,
  CacheableTextPart,
} from "../providers/interface.js";
import { createGlossaryLookup } from "../services/glossary.js";
import { logger, createTimer } from "../utils/logger.js";
import { TranslationError, ErrorCode } from "../errors.js";

// ============================================================================
// Prompt Templates (from RFC.md Section 7.2)
// ============================================================================

/**
 * Build cacheable system instructions for translation
 * This part is static and can be cached across multiple requests
 */
function buildSystemInstructions(
  sourceLang: string,
  targetLang: string
): string {
  return `You are a professional translator specializing in ${sourceLang} to ${targetLang} translation.

## Rules:
1. Apply glossary terms exactly as specified
2. Preserve all formatting (markdown, HTML tags, code blocks)
3. Maintain the same tone and style
4. Do not translate content inside code blocks
5. Keep URLs, file paths, and technical identifiers unchanged
6. Keep placeholders like __CODE_BLOCK_0__ unchanged`;
}

/**
 * Build cacheable glossary section
 * This can be cached as it's reused across multiple chunks
 */
function buildGlossarySection(glossaryText: string): string {
  return `## Glossary (MUST use these exact translations):
${glossaryText || "No glossary provided."}`;
}

/**
 * Build the dynamic part of the translation prompt (not cached)
 */
function buildTranslationContent(
  sourceText: string,
  context?: { documentPurpose?: string; styleInstruction?: string; previousContext?: string }
): string {
  const styleSection = context?.styleInstruction
    ? `Style: ${context.styleInstruction}\n`
    : "";

  return `## Document Context:
Purpose: ${context?.documentPurpose ?? "General translation"}
${styleSection}Previous content: ${context?.previousContext ?? "None"}

## Source Text:
${sourceText}

Provide ONLY the translated text below, with no additional commentary or headers:`;
}

/**
 * Build message with cacheable parts for initial translation
 * Uses prompt caching for system instructions and glossary
 */
function buildCacheableTranslationMessage(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  glossaryText: string,
  context?: { documentPurpose?: string; styleInstruction?: string; previousContext?: string }
): ChatMessage {
  const systemInstructions = buildSystemInstructions(sourceLang, targetLang);
  const glossarySection = buildGlossarySection(glossaryText);
  const translationContent = buildTranslationContent(sourceText, context);

  // Structure content parts with cache control
  // System instructions + glossary are cached (static across chunks)
  // Translation content is dynamic (changes per chunk)
  const contentParts: CacheableTextPart[] = [
    {
      type: "text",
      text: systemInstructions,
      cacheControl: { type: "ephemeral" },
    },
    {
      type: "text",
      text: glossarySection,
      cacheControl: { type: "ephemeral" },
    },
    {
      type: "text",
      text: translationContent,
      // No cache control - this is dynamic per request
    },
  ];

  return {
    role: "user",
    content: contentParts,
  };
}

function buildInitialTranslationPrompt(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  glossaryText: string,
  context?: { documentPurpose?: string; styleInstruction?: string; previousContext?: string }
): string {
  const styleSection = context?.styleInstruction
    ? `Style: ${context.styleInstruction}\n`
    : "";

  return `You are a professional translator. Translate the following ${sourceLang} text to ${targetLang}.

## Glossary (MUST use these exact translations):
${glossaryText || "No glossary provided."}

## Document Context:
Purpose: ${context?.documentPurpose ?? "General translation"}
${styleSection}Previous content: ${context?.previousContext ?? "None"}

## Rules:
1. Apply glossary terms exactly as specified
2. Preserve all formatting (markdown, HTML tags, code blocks)
3. Maintain the same tone and style
4. Do not translate content inside code blocks
5. Keep URLs, file paths, and technical identifiers unchanged
6. Keep placeholders like __CODE_BLOCK_0__ unchanged

## Source Text:
${sourceText}

Provide ONLY the translated text below, with no additional commentary or headers:`;
}

function buildReflectionPrompt(
  sourceText: string,
  translatedText: string,
  sourceLang: string,
  targetLang: string,
  glossaryText: string
): string {
  return `Review this translation and provide specific improvement suggestions.

## Source (${sourceLang}):
${sourceText}

## Translation (${targetLang}):
${translatedText}

## Glossary Requirements:
${glossaryText || "No glossary provided."}

## Evaluate and suggest improvements for:
1. **Accuracy**: Does the translation convey the exact meaning?
2. **Glossary Compliance**: Are all glossary terms applied correctly?
3. **Fluency**: Does it read naturally in ${targetLang}?
4. **Formatting**: Is the structure preserved?
5. **Consistency**: Are terms translated consistently?

Provide a numbered list of specific, actionable suggestions:`;
}

function buildImprovementPrompt(
  sourceText: string,
  currentTranslation: string,
  suggestions: string,
  glossaryText: string
): string {
  return `Improve this translation based on the following suggestions.

## Source Text:
${sourceText}

## Current Translation:
${currentTranslation}

## Improvement Suggestions:
${suggestions}

## Glossary (MUST apply):
${glossaryText || "No glossary provided."}

Provide ONLY the improved translation below, with no additional commentary or headers:`;
}

function buildQualityEvaluationPrompt(
  sourceText: string,
  translatedText: string,
  sourceLang: string,
  targetLang: string
): string {
  return `Rate this translation's quality from 0 to 100.

## Source (${sourceLang}):
${sourceText}

## Translation (${targetLang}):
${translatedText}

## Evaluation Criteria:
- Semantic accuracy (40 points)
- Fluency and naturalness (25 points)
- Glossary compliance (20 points)
- Format preservation (15 points)

Respond with only a JSON object:
{"score": <number>, "breakdown": {"accuracy": <n>, "fluency": <n>, "glossary": <n>, "format": <n>}, "issues": ["issue1", "issue2"]}`;
}

// ============================================================================
// Translation Agent
// ============================================================================

export interface TranslationAgentOptions {
  provider: LLMProvider;
  qualityThreshold?: number;
  maxIterations?: number;
  verbose?: boolean;
  /** If true, throw error when quality threshold is not met after max iterations */
  strictQuality?: boolean;
  /** Enable prompt caching for Claude provider (default: true) */
  enableCaching?: boolean;
}

export class TranslationAgent {
  private provider: LLMProvider;
  private qualityThreshold: number;
  private maxIterations: number;
  private verbose: boolean;
  private strictQuality: boolean;
  private enableCaching: boolean;

  constructor(options: TranslationAgentOptions) {
    this.provider = options.provider;
    this.qualityThreshold = options.qualityThreshold ?? 85;
    this.maxIterations = options.maxIterations ?? 4;
    this.verbose = options.verbose ?? false;
    this.strictQuality = options.strictQuality ?? false;
    // Enable caching by default for Claude provider
    this.enableCaching =
      options.enableCaching ?? options.provider.name === "claude";
  }

  /**
   * Translate content using Self-Refine loop
   */
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const timer = createTimer();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCacheReadTokens = 0;
    let totalCacheWriteTokens = 0;
    let iterations = 0;

    // Prepare glossary text for prompts
    const glossaryText = request.glossary
      ? createGlossaryLookup(
          request.glossary as ResolvedGlossary
        ).formatForPrompt()
      : "";

    // Step 1: Initial Translation
    if (this.verbose) {
      logger.info("Starting initial translation...");
    }

    const initialResult = await this.generateInitialTranslation(
      request.content,
      request.sourceLang,
      request.targetLang,
      glossaryText,
      request.context
    );
    let currentTranslation = initialResult.content;
    iterations++;

    totalInputTokens += initialResult.usage.inputTokens;
    totalOutputTokens += initialResult.usage.outputTokens;
    totalCacheReadTokens += initialResult.usage.cacheReadTokens ?? 0;
    totalCacheWriteTokens += initialResult.usage.cacheWriteTokens ?? 0;

    // Step 2: Evaluate and Refine Loop
    let qualityScore = 0;
    let lastEvaluation: QualityEvaluation | null = null;

    while (iterations < this.maxIterations) {
      // Evaluate quality
      if (this.verbose) {
        logger.info(
          `Evaluating translation quality (iteration ${iterations})...`
        );
      }

      lastEvaluation = await this.evaluateQuality(
        request.content,
        currentTranslation,
        request.sourceLang,
        request.targetLang
      );
      qualityScore = lastEvaluation.score;

      if (this.verbose) {
        logger.info(`Quality score: ${qualityScore}/${this.qualityThreshold}`);
      }

      // Check if quality threshold is met
      if (qualityScore >= this.qualityThreshold) {
        if (this.verbose) {
          logger.success(
            `Quality threshold met after ${iterations} iterations`
          );
        }
        break;
      }

      // Step 3: Reflect and get suggestions
      if (this.verbose) {
        logger.info("Generating improvement suggestions...");
      }

      const suggestions = await this.generateReflection(
        request.content,
        currentTranslation,
        request.sourceLang,
        request.targetLang,
        glossaryText
      );

      // Step 4: Improve translation
      if (this.verbose) {
        logger.info("Applying improvements...");
      }

      const improveResult = await this.improveTranslation(
        request.content,
        currentTranslation,
        suggestions,
        glossaryText
      );
      currentTranslation = improveResult.content;

      iterations++;
      totalInputTokens += improveResult.usage.inputTokens;
      totalOutputTokens += improveResult.usage.outputTokens;
      totalCacheReadTokens += improveResult.usage.cacheReadTokens ?? 0;
      totalCacheWriteTokens += improveResult.usage.cacheWriteTokens ?? 0;
    }

    // Final evaluation if not done
    if (!lastEvaluation || iterations === this.maxIterations) {
      lastEvaluation = await this.evaluateQuality(
        request.content,
        currentTranslation,
        request.sourceLang,
        request.targetLang
      );
      qualityScore = lastEvaluation.score;
    }

    // Check if quality threshold was met
    const thresholdMet = qualityScore >= this.qualityThreshold;

    if (!thresholdMet && this.strictQuality) {
      throw new TranslationError(ErrorCode.QUALITY_THRESHOLD_NOT_MET, {
        score: qualityScore,
        threshold: this.qualityThreshold,
        iterations,
        maxIterations: this.maxIterations,
        issues: lastEvaluation?.issues ?? [],
      });
    }

    if (!thresholdMet && this.verbose) {
      logger.warn(
        `Quality threshold not met: ${qualityScore}/${this.qualityThreshold} after ${iterations} iterations`
      );
    }

    // Log cache efficiency if verbose and caching was used
    if (this.verbose && (totalCacheReadTokens > 0 || totalCacheWriteTokens > 0)) {
      const cacheHitRate =
        totalCacheReadTokens > 0
          ? ((totalCacheReadTokens / (totalCacheReadTokens + totalInputTokens)) * 100).toFixed(1)
          : "0";
      logger.info(
        `Cache stats: ${totalCacheReadTokens} read, ${totalCacheWriteTokens} written (${cacheHitRate}% hit rate)`
      );
    }

    return {
      content: currentTranslation,
      metadata: {
        qualityScore,
        qualityThreshold: this.qualityThreshold,
        thresholdMet,
        iterations,
        tokensUsed: {
          input: totalInputTokens,
          output: totalOutputTokens,
          cacheRead: totalCacheReadTokens,
          cacheWrite: totalCacheWriteTokens,
        },
        duration: timer.elapsed(),
        provider: this.provider.name,
        model: "default", // Could be made configurable
      },
      glossaryCompliance: request.glossary
        ? this.checkGlossaryCompliance(
            request.content,
            currentTranslation,
            request.glossary as ResolvedGlossary
          )
        : undefined,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async generateInitialTranslation(
    sourceText: string,
    sourceLang: string,
    targetLang: string,
    glossaryText: string,
    context?: {
      documentPurpose?: string;
      styleInstruction?: string;
      previousChunks?: string[];
      documentSummary?: string;
    }
  ): Promise<{
    content: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens?: number;
      cacheWriteTokens?: number;
    };
  }> {
    let messages: ChatMessage[];

    if (this.enableCaching) {
      // Use cacheable message format for Claude
      messages = [
        buildCacheableTranslationMessage(sourceText, sourceLang, targetLang, glossaryText, {
          documentPurpose: context?.documentPurpose,
          styleInstruction: context?.styleInstruction,
          previousContext: context?.previousChunks?.slice(-2).join("\n"),
        }),
      ];
    } else {
      // Fallback to simple string format for other providers
      const prompt = buildInitialTranslationPrompt(
        sourceText,
        sourceLang,
        targetLang,
        glossaryText,
        {
          documentPurpose: context?.documentPurpose,
          styleInstruction: context?.styleInstruction,
          previousContext: context?.previousChunks?.slice(-2).join("\n"),
        }
      );
      messages = [{ role: "user", content: prompt }];
    }

    const response = await this.provider.chat({ messages });
    const cleanedContent = this.cleanTranslationOutput(response.content);

    return {
      content: this.preserveWhitespace(sourceText, cleanedContent),
      usage: {
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        cacheReadTokens: response.usage.cacheReadTokens,
        cacheWriteTokens: response.usage.cacheWriteTokens,
      },
    };
  }

  private async generateReflection(
    sourceText: string,
    translatedText: string,
    sourceLang: string,
    targetLang: string,
    glossaryText: string
  ): Promise<string> {
    const prompt = buildReflectionPrompt(
      sourceText,
      translatedText,
      sourceLang,
      targetLang,
      glossaryText
    );

    const messages: ChatMessage[] = [{ role: "user", content: prompt }];

    const response = await this.provider.chat({ messages });
    return response.content.trim();
  }

  private async improveTranslation(
    sourceText: string,
    currentTranslation: string,
    suggestions: string,
    glossaryText: string
  ): Promise<{
    content: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens?: number;
      cacheWriteTokens?: number;
    };
  }> {
    let messages: ChatMessage[];

    if (this.enableCaching) {
      // Use cacheable format - glossary is cached
      const contentParts: CacheableTextPart[] = [
        {
          type: "text",
          text: `Improve this translation based on the following suggestions.

## Glossary (MUST apply):
${glossaryText || "No glossary provided."}`,
          cacheControl: { type: "ephemeral" },
        },
        {
          type: "text",
          text: `## Source Text:
${sourceText}

## Current Translation:
${currentTranslation}

## Improvement Suggestions:
${suggestions}

Provide ONLY the improved translation below, with no additional commentary or headers:`,
        },
      ];
      messages = [{ role: "user", content: contentParts }];
    } else {
      const prompt = buildImprovementPrompt(
        sourceText,
        currentTranslation,
        suggestions,
        glossaryText
      );
      messages = [{ role: "user", content: prompt }];
    }

    const response = await this.provider.chat({ messages });
    const cleanedContent = this.cleanTranslationOutput(response.content);

    return {
      content: this.preserveWhitespace(sourceText, cleanedContent),
      usage: {
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        cacheReadTokens: response.usage.cacheReadTokens,
        cacheWriteTokens: response.usage.cacheWriteTokens,
      },
    };
  }

  private async evaluateQuality(
    sourceText: string,
    translatedText: string,
    sourceLang: string,
    targetLang: string
  ): Promise<QualityEvaluation> {
    const prompt = buildQualityEvaluationPrompt(
      sourceText,
      translatedText,
      sourceLang,
      targetLang
    );

    const messages: ChatMessage[] = [{ role: "user", content: prompt }];

    const response = await this.provider.chat({ messages });

    try {
      // Extract JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const evaluation = JSON.parse(jsonMatch[0]) as {
        score: number;
        breakdown: {
          accuracy: number;
          fluency: number;
          glossary: number;
          format: number;
        };
        issues: string[];
      };

      return {
        score: evaluation.score,
        breakdown: evaluation.breakdown,
        issues: evaluation.issues,
      };
    } catch {
      // Fallback if parsing fails
      return {
        score: 75, // Default score
        breakdown: {
          accuracy: 30,
          fluency: 20,
          glossary: 15,
          format: 10,
        },
        issues: ["Failed to parse quality evaluation response"],
      };
    }
  }

  /**
   * Clean up translation output by removing prompt artifacts
   * Uses guardrails to detect and remove any trailing prompt-like content
   */
  private cleanTranslationOutput(text: string): string {
    let cleaned = text.trim();

    // Guardrail 1: Remove trailing markdown headers that look like prompt sections
    // These are likely prompt artifacts, not actual translation content
    const trailingHeaderPattern = /\n+##\s+[A-Z][^:\n]*:\s*$/;
    cleaned = cleaned.replace(trailingHeaderPattern, '');

    // Guardrail 2: If the text ends with a colon followed by optional whitespace,
    // it's likely an incomplete prompt artifact
    const incompletePromptPattern = /:\s*$/;
    if (incompletePromptPattern.test(cleaned)) {
      // Find the last complete line/paragraph
      const lines = cleaned.split('\n');
      while (lines.length > 0 && incompletePromptPattern.test(lines[lines.length - 1]?.trim() ?? '')) {
        lines.pop();
      }
      cleaned = lines.join('\n');
    }

    // Guardrail 3: Remove any trailing numbered list items that look like evaluation criteria
    // (typically starts with "1. **" pattern for bold evaluation headers)
    const evaluationListPattern = /\n+\d+\.\s*\*\*[^*]+\*\*[\s\S]*$/;
    if (evaluationListPattern.test(cleaned)) {
      cleaned = cleaned.replace(evaluationListPattern, '');
    }

    return cleaned.trim();
  }

  /**
   * Preserve leading/trailing whitespace from source text in translated text
   * This ensures document structure (line breaks between sections) is maintained
   */
  private preserveWhitespace(
    sourceText: string,
    translatedText: string
  ): string {
    // Extract leading whitespace from source
    const leadingMatch = sourceText.match(/^(\s*)/);
    const leadingWhitespace = leadingMatch ? leadingMatch[1] : "";

    // Extract trailing whitespace from source
    const trailingMatch = sourceText.match(/(\s*)$/);
    const trailingWhitespace = trailingMatch ? trailingMatch[1] : "";

    return leadingWhitespace + translatedText + trailingWhitespace;
  }

  private checkGlossaryCompliance(
    sourceText: string,
    translatedText: string,
    glossary: ResolvedGlossary
  ): { applied: string[]; missed: string[] } {
    const lookup = createGlossaryLookup(glossary);
    const sourceTerms = lookup.findAll(sourceText);

    const applied: string[] = [];
    const missed: string[] = [];

    for (const term of sourceTerms) {
      const targetInTranslation = term.caseSensitive
        ? translatedText.includes(term.target)
        : translatedText.toLowerCase().includes(term.target.toLowerCase());

      if (targetInTranslation) {
        applied.push(term.source);
      } else {
        missed.push(term.source);
      }
    }

    return { applied, missed };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createTranslationAgent(
  options: TranslationAgentOptions
): TranslationAgent {
  return new TranslationAgent(options);
}
