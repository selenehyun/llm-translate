import type {
  TranslationRequest,
  TranslationResult,
  ResolvedGlossary,
  QualityEvaluation,
} from "../types/index.js";
import type { LLMProvider, ChatMessage } from "../providers/interface.js";
import { createGlossaryLookup } from "../services/glossary.js";
import { logger, createTimer } from "../utils/logger.js";
import { TranslationError, ErrorCode } from "../errors.js";

// ============================================================================
// Prompt Templates (from RFC.md Section 7.2)
// ============================================================================

function buildInitialTranslationPrompt(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  glossaryText: string,
  context?: { documentPurpose?: string; previousContext?: string }
): string {
  return `You are a professional translator. Translate the following ${sourceLang} text to ${targetLang}.

## Glossary (MUST use these exact translations):
${glossaryText || "No glossary provided."}

## Document Context:
Purpose: ${context?.documentPurpose ?? "General translation"}
Previous content: ${context?.previousContext ?? "None"}

## Rules:
1. Apply glossary terms exactly as specified
2. Preserve all formatting (markdown, HTML tags, code blocks)
3. Maintain the same tone and style
4. Do not translate content inside code blocks
5. Keep URLs, file paths, and technical identifiers unchanged
6. Keep placeholders like __CODE_BLOCK_0__ unchanged

## Source Text:
${sourceText}

## Translation:`;
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

Provide only the improved translation, nothing else:`;
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
}

export class TranslationAgent {
  private provider: LLMProvider;
  private qualityThreshold: number;
  private maxIterations: number;
  private verbose: boolean;
  private strictQuality: boolean;

  constructor(options: TranslationAgentOptions) {
    this.provider = options.provider;
    this.qualityThreshold = options.qualityThreshold ?? 85;
    this.maxIterations = options.maxIterations ?? 4;
    this.verbose = options.verbose ?? false;
    this.strictQuality = options.strictQuality ?? false;
  }

  /**
   * Translate content using Self-Refine loop
   */
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const timer = createTimer();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
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

    let currentTranslation = await this.generateInitialTranslation(
      request.content,
      request.sourceLang,
      request.targetLang,
      glossaryText,
      request.context
    );
    iterations++;

    totalInputTokens += this.provider.countTokens(request.content);
    totalOutputTokens += this.provider.countTokens(currentTranslation);

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

      currentTranslation = await this.improveTranslation(
        request.content,
        currentTranslation,
        suggestions,
        glossaryText
      );

      iterations++;
      totalInputTokens += this.provider.countTokens(request.content) * 2; // rough estimate
      totalOutputTokens += this.provider.countTokens(currentTranslation);
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
      previousChunks?: string[];
      documentSummary?: string;
    }
  ): Promise<string> {
    const prompt = buildInitialTranslationPrompt(
      sourceText,
      sourceLang,
      targetLang,
      glossaryText,
      {
        documentPurpose: context?.documentPurpose,
        previousContext: context?.previousChunks?.slice(-2).join("\n"),
      }
    );

    const messages: ChatMessage[] = [{ role: "user", content: prompt }];

    const response = await this.provider.chat({ messages });
    // Preserve leading/trailing whitespace from source to maintain document structure
    return this.preserveWhitespace(sourceText, response.content.trim());
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
  ): Promise<string> {
    const prompt = buildImprovementPrompt(
      sourceText,
      currentTranslation,
      suggestions,
      glossaryText
    );

    const messages: ChatMessage[] = [{ role: "user", content: prompt }];

    const response = await this.provider.chat({ messages });
    // Preserve leading/trailing whitespace from source to maintain document structure
    return this.preserveWhitespace(sourceText, response.content.trim());
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
