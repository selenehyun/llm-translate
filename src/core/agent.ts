import type {
  TranslationRequest,
  TranslationResult,
  ResolvedGlossary,
  QualityEvaluation,
  MQMEvaluation,
  MQMError,
  PreTranslationAnalysis,
  TranslationMode,
} from "../types/index.js";
import {
  parseMQMResponse,
  formatMQMErrorsForPrompt,
} from "../types/mqm.js";
import {
  parseAnalysisResponse,
  formatAnalysisForPrompt,
  createEmptyAnalysis,
} from "../types/analysis.js";
import { getModeConfig } from "../types/modes.js";
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

/**
 * Build MQM evaluation prompt (TEaR-style)
 * Based on https://arxiv.org/abs/2402.16379
 */
function buildMQMEvaluationPrompt(
  sourceText: string,
  translatedText: string,
  sourceLang: string,
  targetLang: string,
  glossaryText: string
): string {
  return `Evaluate this translation using MQM (Multidimensional Quality Metrics) framework.

## Source (${sourceLang}):
${sourceText}

## Translation (${targetLang}):
${translatedText}

## Glossary Terms (must be applied exactly):
${glossaryText || "No glossary provided."}

## MQM Error Categories:
- accuracy/mistranslation: Incorrect meaning
- accuracy/omission: Missing content from source
- accuracy/addition: Extra content not in source
- accuracy/untranslated: Source text left unchanged
- fluency/grammar: Grammatical errors
- fluency/spelling: Spelling/typos
- fluency/register: Inappropriate formality
- fluency/inconsistency: Inconsistent terminology
- style/awkward: Unnatural phrasing
- style/unidiomatic: Non-native expressions

## Severity Weights:
- "minor" (1 point): Noticeable but doesn't affect understanding
- "major" (5 points): Affects understanding or usability
- "critical" (25 points): Completely wrong or unusable

## Instructions:
1. Identify all translation errors
2. Classify each by type and severity
3. Provide the span and suggested fix
4. Calculate score: 100 - sum(weights)

Respond with only a JSON object:
{
  "errors": [
    {"type": "accuracy/mistranslation", "severity": "major", "span": "affected text", "suggestion": "corrected text", "explanation": "reason"}
  ],
  "score": <100 - sum of weights>,
  "summary": "brief overall assessment"
}`;
}

/**
 * Build MQM-based refinement prompt
 * Uses specific error annotations to guide improvements
 */
function buildMQMRefinementPrompt(
  sourceText: string,
  currentTranslation: string,
  errors: MQMError[],
  glossaryText: string
): string {
  const errorList = formatMQMErrorsForPrompt(errors);

  return `Fix the following translation errors.

## Source Text:
${sourceText}

## Current Translation:
${currentTranslation}

## Errors to Fix:
${errorList}

## Glossary (MUST apply):
${glossaryText || "No glossary provided."}

Apply ONLY the fixes listed above. Do not make other changes.
Provide ONLY the corrected translation, with no additional commentary:`;
}

/**
 * Build pre-translation analysis prompt (MAPS-style)
 * Based on https://github.com/zwhe99/MAPS-mt
 */
function buildPreAnalysisPrompt(
  sourceText: string,
  sourceLang: string,
  targetLang: string,
  glossaryText: string
): string {
  return `Analyze this ${sourceLang} text before translating to ${targetLang}.

## Source Text:
${sourceText}

## Available Glossary Terms:
${glossaryText || "No glossary provided."}

## Analyze and extract:
1. **Key Terms**: Important domain-specific terms needing careful translation
2. **Ambiguous Phrases**: Phrases with multiple possible interpretations
3. **Preserve Exact**: Code, URLs, names that should NOT be translated
4. **Challenges**: Specific difficulties for ${sourceLang}→${targetLang}

Respond with only a JSON object:
{
  "keyTerms": [{"term": "...", "context": "...", "suggestedTranslation": "...", "fromGlossary": true/false}],
  "ambiguousPhrases": [{"phrase": "...", "interpretations": ["..."], "recommendation": "..."}],
  "preserveExact": ["code snippets", "URLs", "names"],
  "challenges": ["challenge 1", "challenge 2"],
  "domain": "technical|marketing|legal|medical|general",
  "registerRecommendation": "formal|informal|neutral"
}`;
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
  /** Translation mode: fast, balanced, quality (default: balanced) */
  mode?: TranslationMode;
  /** Enable pre-translation analysis (MAPS-style) - overrides mode setting */
  enableAnalysis?: boolean;
  /** Use MQM-based evaluation - overrides mode setting */
  useMQMEvaluation?: boolean;
}

export class TranslationAgent {
  private provider: LLMProvider;
  private qualityThreshold: number;
  private maxIterations: number;
  private verbose: boolean;
  private strictQuality: boolean;
  private enableCaching: boolean;
  private enableAnalysis: boolean;
  private useMQMEvaluation: boolean;

  constructor(options: TranslationAgentOptions) {
    this.provider = options.provider;
    this.verbose = options.verbose ?? false;
    this.strictQuality = options.strictQuality ?? false;

    // Get mode configuration
    const modeConfig = getModeConfig(options.mode ?? "balanced");

    // Apply mode settings, allowing explicit overrides
    this.qualityThreshold = options.qualityThreshold ?? modeConfig.qualityThreshold;
    this.maxIterations = options.maxIterations ?? modeConfig.maxIterations;
    this.enableAnalysis = options.enableAnalysis ?? modeConfig.enableAnalysis;
    this.useMQMEvaluation = options.useMQMEvaluation ?? modeConfig.useMQMEvaluation;

    // Enable caching by default for Claude provider
    this.enableCaching =
      options.enableCaching ?? options.provider.name === "claude";

    if (this.verbose) {
      logger.info(`Translation mode: ${options.mode ?? "balanced"}`);
      logger.info(`  - Analysis: ${this.enableAnalysis ? "enabled" : "disabled"}`);
      logger.info(`  - MQM evaluation: ${this.useMQMEvaluation ? "enabled" : "disabled"}`);
      logger.info(`  - Quality threshold: ${this.qualityThreshold}`);
      logger.info(`  - Max iterations: ${this.maxIterations}`);
    }
  }

  /**
   * Translate content using Self-Refine loop with optional MAPS analysis and MQM evaluation
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

    // Step 1: Pre-Translation Analysis (MAPS-style, optional)
    let analysis: PreTranslationAnalysis | null = null;
    if (this.enableAnalysis) {
      if (this.verbose) {
        logger.info("Analyzing source text (MAPS)...");
      }
      analysis = await this.analyzeSource(
        request.content,
        request.sourceLang,
        request.targetLang,
        glossaryText
      );
      if (this.verbose && analysis) {
        logger.info(`  - Domain: ${analysis.domain}`);
        logger.info(`  - Key terms: ${analysis.keyTerms.length}`);
        logger.info(`  - Challenges: ${analysis.challenges.length}`);
      }
    }

    // Step 2: Initial Translation
    if (this.verbose) {
      logger.info("Starting initial translation...");
    }

    const initialResult = await this.generateInitialTranslation(
      request.content,
      request.sourceLang,
      request.targetLang,
      glossaryText,
      request.context,
      analysis
    );
    let currentTranslation = initialResult.content;
    iterations++;

    totalInputTokens += initialResult.usage.inputTokens;
    totalOutputTokens += initialResult.usage.outputTokens;
    totalCacheReadTokens += initialResult.usage.cacheReadTokens ?? 0;
    totalCacheWriteTokens += initialResult.usage.cacheWriteTokens ?? 0;

    // Fast mode: Skip evaluation and refinement
    if (this.maxIterations <= 1 && this.qualityThreshold <= 0) {
      if (this.verbose) {
        logger.info("Fast mode: Skipping evaluation and refinement");
      }
      return {
        content: currentTranslation,
        metadata: {
          qualityScore: 0,
          qualityThreshold: 0,
          thresholdMet: true,
          iterations,
          tokensUsed: {
            input: totalInputTokens,
            output: totalOutputTokens,
            cacheRead: totalCacheReadTokens,
            cacheWrite: totalCacheWriteTokens,
          },
          duration: timer.elapsed(),
          provider: this.provider.name,
          model: "default",
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

    // Step 3: Evaluate and Refine Loop
    let qualityScore = 0;
    let lastEvaluation: QualityEvaluation | null = null;
    let lastMQMEvaluation: MQMEvaluation | null = null;

    while (iterations < this.maxIterations) {
      // Evaluate quality (MQM or simple)
      if (this.verbose) {
        logger.info(
          `Evaluating translation quality (iteration ${iterations})...`
        );
      }

      if (this.useMQMEvaluation) {
        // MQM-based evaluation
        lastMQMEvaluation = await this.evaluateQualityMQM(
          request.content,
          currentTranslation,
          request.sourceLang,
          request.targetLang,
          glossaryText
        );
        qualityScore = lastMQMEvaluation.score;

        if (this.verbose) {
          logger.info(`MQM score: ${qualityScore}/${this.qualityThreshold}`);
          if (lastMQMEvaluation.errors.length > 0) {
            logger.info(`  - Errors: ${lastMQMEvaluation.errors.length} (${lastMQMEvaluation.breakdown.accuracy} accuracy, ${lastMQMEvaluation.breakdown.fluency} fluency, ${lastMQMEvaluation.breakdown.style} style)`);
          }
        }
      } else {
        // Simple evaluation
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

      // Step 4: Refine translation
      if (this.verbose) {
        logger.info("Refining translation...");
      }

      let improveResult: {
        content: string;
        usage: { inputTokens: number; outputTokens: number; cacheReadTokens?: number; cacheWriteTokens?: number };
      };

      if (this.useMQMEvaluation && lastMQMEvaluation && lastMQMEvaluation.errors.length > 0) {
        // MQM-based refinement: Apply specific error fixes
        improveResult = await this.refineWithMQM(
          request.content,
          currentTranslation,
          lastMQMEvaluation.errors,
          glossaryText
        );
      } else {
        // Legacy refinement: Generate suggestions then apply
        const suggestions = await this.generateReflection(
          request.content,
          currentTranslation,
          request.sourceLang,
          request.targetLang,
          glossaryText
        );

        improveResult = await this.improveTranslation(
          request.content,
          currentTranslation,
          suggestions,
          glossaryText
        );
      }

      currentTranslation = improveResult.content;
      iterations++;
      totalInputTokens += improveResult.usage.inputTokens;
      totalOutputTokens += improveResult.usage.outputTokens;
      totalCacheReadTokens += improveResult.usage.cacheReadTokens ?? 0;
      totalCacheWriteTokens += improveResult.usage.cacheWriteTokens ?? 0;
    }

    // Final evaluation if not done
    if (this.useMQMEvaluation) {
      if (!lastMQMEvaluation || iterations === this.maxIterations) {
        lastMQMEvaluation = await this.evaluateQualityMQM(
          request.content,
          currentTranslation,
          request.sourceLang,
          request.targetLang,
          glossaryText
        );
        qualityScore = lastMQMEvaluation.score;
      }
    } else {
      if (!lastEvaluation || iterations === this.maxIterations) {
        lastEvaluation = await this.evaluateQuality(
          request.content,
          currentTranslation,
          request.sourceLang,
          request.targetLang
        );
        qualityScore = lastEvaluation.score;
      }
    }

    // Check if quality threshold was met
    const thresholdMet = qualityScore >= this.qualityThreshold;

    if (!thresholdMet && this.strictQuality) {
      throw new TranslationError(ErrorCode.QUALITY_THRESHOLD_NOT_MET, {
        score: qualityScore,
        threshold: this.qualityThreshold,
        iterations,
        maxIterations: this.maxIterations,
        issues: lastEvaluation?.issues ?? lastMQMEvaluation?.errors.map(e => `${e.type}: ${e.span}`) ?? [],
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
        model: "default",
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
    },
    analysis?: PreTranslationAnalysis | null
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

    // Build analysis context if available
    const analysisContext = analysis ? formatAnalysisForPrompt(analysis) : "";
    const enrichedContext = {
      documentPurpose: context?.documentPurpose,
      styleInstruction: context?.styleInstruction,
      previousContext: context?.previousChunks?.slice(-2).join("\n"),
    };

    if (this.enableCaching) {
      // Use cacheable message format for Claude
      const baseMessage = buildCacheableTranslationMessage(
        sourceText,
        sourceLang,
        targetLang,
        glossaryText,
        enrichedContext
      );

      // Add analysis context if available
      if (analysisContext && Array.isArray(baseMessage.content)) {
        const contentParts = baseMessage.content as CacheableTextPart[];
        // Insert analysis after glossary, before translation content
        contentParts.splice(2, 0, {
          type: "text",
          text: `\n## Pre-Translation Analysis:\n${analysisContext}\n`,
        });
      }

      messages = [baseMessage];
    } else {
      // Fallback to simple string format for other providers
      let prompt = buildInitialTranslationPrompt(
        sourceText,
        sourceLang,
        targetLang,
        glossaryText,
        enrichedContext
      );

      // Inject analysis into prompt if available
      if (analysisContext) {
        prompt = prompt.replace(
          "## Source Text:",
          `## Pre-Translation Analysis:\n${analysisContext}\n\n## Source Text:`
        );
      }

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
   * Pre-translation analysis using MAPS-style approach
   * Identifies key terms, ambiguous phrases, and translation challenges
   */
  private async analyzeSource(
    sourceText: string,
    sourceLang: string,
    targetLang: string,
    glossaryText: string
  ): Promise<PreTranslationAnalysis | null> {
    const prompt = buildPreAnalysisPrompt(
      sourceText,
      sourceLang,
      targetLang,
      glossaryText
    );

    const messages: ChatMessage[] = [{ role: "user", content: prompt }];

    try {
      const response = await this.provider.chat({ messages });
      return parseAnalysisResponse(response.content);
    } catch (error) {
      if (this.verbose) {
        logger.warn(`Pre-analysis failed: ${error}`);
      }
      return createEmptyAnalysis();
    }
  }

  /**
   * Evaluate translation quality using MQM framework
   * Returns structured error annotations for targeted refinement
   */
  private async evaluateQualityMQM(
    sourceText: string,
    translatedText: string,
    sourceLang: string,
    targetLang: string,
    glossaryText: string
  ): Promise<MQMEvaluation> {
    const prompt = buildMQMEvaluationPrompt(
      sourceText,
      translatedText,
      sourceLang,
      targetLang,
      glossaryText
    );

    const messages: ChatMessage[] = [{ role: "user", content: prompt }];

    try {
      const response = await this.provider.chat({ messages });
      const evaluation = parseMQMResponse(response.content);

      if (evaluation) {
        return evaluation;
      }

      // Fallback if parsing fails
      return {
        errors: [],
        score: 75,
        summary: "Failed to parse MQM evaluation",
        breakdown: { accuracy: 0, fluency: 0, style: 0 },
      };
    } catch {
      return {
        errors: [],
        score: 75,
        summary: "MQM evaluation failed",
        breakdown: { accuracy: 0, fluency: 0, style: 0 },
      };
    }
  }

  /**
   * Refine translation based on MQM error annotations
   * Applies targeted fixes for identified errors
   */
  private async refineWithMQM(
    sourceText: string,
    currentTranslation: string,
    errors: MQMError[],
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
    const prompt = buildMQMRefinementPrompt(
      sourceText,
      currentTranslation,
      errors,
      glossaryText
    );

    const messages: ChatMessage[] = [{ role: "user", content: prompt }];
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
