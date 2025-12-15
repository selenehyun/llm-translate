import type {
  TranslateConfig,
  TranslationRequest,
  DocumentResult,
  ChunkResult,
  Chunk,
  DocumentFormat,
  ResolvedGlossary,
} from '../types/index.js';
import type { LLMProvider } from '../providers/interface.js';
import { TranslationAgent, createTranslationAgent } from './agent.js';
import { chunkContent, getChunkStats } from './chunker.js';
import {
  extractTextForTranslation,
  restorePreservedSections,
} from '../parsers/markdown.js';
import { loadGlossary, resolveGlossary } from '../services/glossary.js';
import { getProvider, getProviderConfigFromEnv } from '../providers/registry.js';
import { logger, createTimer } from '../utils/logger.js';
import { TranslationError, ErrorCode } from '../errors.js';
import {
  CacheManager,
  createCacheManager,
  createNullCacheManager,
  type CacheKey,
} from '../services/cache.js';

// ============================================================================
// Engine Options
// ============================================================================

export interface TranslationEngineOptions {
  config: TranslateConfig;
  provider?: LLMProvider;
  verbose?: boolean;
  /** Disable caching (--no-cache mode) */
  noCache?: boolean;
}

export interface TranslateFileOptions {
  content: string;
  sourceLang: string;
  targetLang: string;
  format?: DocumentFormat;
  glossaryPath?: string;
  qualityThreshold?: number;
  maxIterations?: number;
  context?: string;
  /** Per-language style instruction (e.g., "경어체", "です・ます調"). Falls back to config.languages.styles[targetLang] if not specified. */
  styleInstruction?: string;
  /** If true, throw error when quality threshold is not met */
  strictQuality?: boolean;
  /** If true, throw error when glossary terms are missed */
  strictGlossary?: boolean;
}

// ============================================================================
// Translation Engine
// ============================================================================

export class TranslationEngine {
  private config: TranslateConfig;
  private provider: LLMProvider;
  private verbose: boolean;
  private cache: CacheManager;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(options: TranslationEngineOptions) {
    this.config = options.config;
    this.verbose = options.verbose ?? false;

    // Initialize provider
    if (options.provider) {
      this.provider = options.provider;
    } else {
      const providerConfig = getProviderConfigFromEnv(this.config.provider.default);
      // Use model from config if specified (CLI --model option)
      if (this.config.provider.model) {
        providerConfig.defaultModel = this.config.provider.model;
      }
      this.provider = getProvider(this.config.provider.default, providerConfig);
    }

    // Initialize cache
    const cacheDisabled = options.noCache || !this.config.paths?.cache;
    if (cacheDisabled) {
      this.cache = createNullCacheManager();
      if (this.verbose && options.noCache) {
        logger.info('Cache disabled (--no-cache)');
      }
    } else {
      this.cache = createCacheManager({
        cacheDir: this.config.paths.cache!,
        verbose: this.verbose,
      });
      if (this.verbose) {
        const stats = this.cache.getStats();
        logger.info(`Cache initialized: ${stats.entries} entries`);
      }
    }
  }

  /**
   * Translate a single file/content
   */
  async translateContent(options: TranslateFileOptions): Promise<DocumentResult> {
    const timer = createTimer();
    const format = options.format ?? this.detectFormat(options.content);

    if (this.verbose) {
      logger.info(`Translating content (${format} format)`);
      logger.info(`Source: ${options.sourceLang} → Target: ${options.targetLang}`);
    }

    // Load glossary if provided
    let glossary: ResolvedGlossary | undefined;
    if (options.glossaryPath) {
      try {
        const rawGlossary = await loadGlossary(options.glossaryPath);
        glossary = resolveGlossary(rawGlossary, options.targetLang);
        if (this.verbose) {
          logger.info(`Loaded glossary: ${glossary.terms.length} terms`);
        }
      } catch (error) {
        if (this.verbose) {
          logger.warn(`Failed to load glossary: ${error}`);
        }
      }
    } else if (this.config.glossary?.path) {
      try {
        const rawGlossary = await loadGlossary(this.config.glossary.path);
        glossary = resolveGlossary(rawGlossary, options.targetLang);
        if (this.verbose) {
          logger.info(`Loaded glossary from config: ${glossary.terms.length} terms`);
        }
      } catch {
        // Glossary is optional
      }
    }

    // Process based on format
    let result: DocumentResult;

    switch (format) {
      case 'markdown':
        result = await this.translateMarkdown(options, glossary);
        break;
      case 'html':
        // For now, treat HTML as plain text (Phase 2 will add proper HTML support)
        result = await this.translatePlainText(options, glossary);
        break;
      case 'text':
      default:
        result = await this.translatePlainText(options, glossary);
        break;
    }

    result.metadata.totalDuration = timer.elapsed();

    // Check glossary compliance if glossary is provided
    if (glossary && glossary.terms.length > 0) {
      const compliance = this.checkDocumentGlossaryCompliance(
        options.content,
        result.content,
        glossary
      );
      result.glossaryCompliance = compliance;

      if (this.verbose) {
        logger.info(`Glossary compliance: ${compliance.applied.length}/${compliance.applied.length + compliance.missed.length} terms applied`);
        if (compliance.missed.length > 0) {
          logger.warn(`Missed glossary terms: ${compliance.missed.join(', ')}`);
        }
      }

      // Strict glossary mode - fail if any terms are missed
      if (options.strictGlossary && !compliance.compliant) {
        throw new TranslationError(ErrorCode.GLOSSARY_COMPLIANCE_FAILED, {
          missed: compliance.missed.join(', '),
          applied: compliance.applied,
          total: glossary.terms.length,
        });
      }
    }

    if (this.verbose) {
      logger.success(`Translation complete in ${timer.format()}`);
      logger.info(`Average quality: ${result.metadata.averageQuality.toFixed(1)}/100`);
    }

    return result;
  }

  /**
   * Check glossary compliance for the entire document
   */
  private checkDocumentGlossaryCompliance(
    sourceContent: string,
    translatedContent: string,
    glossary: ResolvedGlossary
  ): { applied: string[]; missed: string[]; compliant: boolean } {
    const applied: string[] = [];
    const missed: string[] = [];
    const sourceLower = sourceContent.toLowerCase();
    const translatedLower = translatedContent.toLowerCase();

    for (const term of glossary.terms) {
      // Check if source term exists in original content
      const sourceInContent = term.caseSensitive
        ? sourceContent.includes(term.source)
        : sourceLower.includes(term.source.toLowerCase());

      if (!sourceInContent) {
        // Term not in source, skip
        continue;
      }

      // Check if target term exists in translated content
      const targetInTranslation = term.caseSensitive
        ? translatedContent.includes(term.target)
        : translatedLower.includes(term.target.toLowerCase());

      if (targetInTranslation) {
        applied.push(term.source);
      } else {
        missed.push(term.source);
      }
    }

    return {
      applied,
      missed,
      compliant: missed.length === 0,
    };
  }

  // ============================================================================
  // Format-Specific Translation
  // ============================================================================

  private async translateMarkdown(
    options: TranslateFileOptions,
    glossary?: ResolvedGlossary
  ): Promise<DocumentResult> {
    // Extract text for translation, preserving code blocks etc.
    const { text, preservedSections } = extractTextForTranslation(options.content);

    // Chunk the content
    const chunks = chunkContent(text, {
      maxTokens: this.config.chunking.maxTokens,
      overlapTokens: this.config.chunking.overlapTokens,
    });

    if (this.verbose) {
      const stats = getChunkStats(chunks);
      logger.info(`Chunked into ${stats.translatableChunks} translatable sections`);
    }

    // Create translation agent
    const agent = createTranslationAgent({
      provider: this.provider,
      qualityThreshold: options.qualityThreshold ?? this.config.quality.threshold,
      maxIterations: options.maxIterations ?? this.config.quality.maxIterations,
      verbose: this.verbose,
      strictQuality: options.strictQuality,
    });

    // Translate each chunk
    const chunkResults: ChunkResult[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalIterations = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk) continue;

      if (chunk.type === 'preserve') {
        // Keep preserved content as-is
        chunkResults.push({
          original: chunk.content,
          translated: chunk.content,
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
          qualityScore: 100,
        });
        continue;
      }

      if (this.verbose) {
        logger.info(`Translating chunk ${i + 1}/${chunks.length}...`);
      }

      const result = await this.translateChunk(chunk, options, glossary, agent);
      chunkResults.push(result);

      // Accumulate token and iteration counts
      if (result.tokensUsed) {
        totalInputTokens += result.tokensUsed.input;
        totalOutputTokens += result.tokensUsed.output;
      }
      if (result.iterations) {
        totalIterations += result.iterations;
      }
    }

    // Reassemble translated content
    const translatedText = chunkResults.map((r) => r.translated).join('');

    // Restore preserved sections
    const finalContent = restorePreservedSections(translatedText, preservedSections);

    // Calculate average quality
    const qualityScores = chunkResults
      .filter((r) => r.qualityScore > 0)
      .map((r) => r.qualityScore);
    const averageQuality =
      qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : 0;

    // Calculate cache statistics from chunk results
    const cacheHits = chunkResults.filter((r) => r.cached).length;
    const cacheMisses = chunkResults.filter((r) => !r.cached && r.qualityScore > 0).length;

    return {
      content: finalContent,
      chunks: chunkResults,
      metadata: {
        totalTokensUsed: totalInputTokens + totalOutputTokens,
        totalDuration: 0, // Will be set by caller
        averageQuality,
        provider: this.provider.name,
        model: this.config.provider.model ?? this.provider.defaultModel,
        totalIterations,
        tokensUsed: {
          input: totalInputTokens,
          output: totalOutputTokens,
        },
        cache: {
          hits: cacheHits,
          misses: cacheMisses,
        },
      },
    };
  }

  private async translatePlainText(
    options: TranslateFileOptions,
    glossary?: ResolvedGlossary
  ): Promise<DocumentResult> {
    // Chunk the content
    const chunks = chunkContent(options.content, {
      maxTokens: this.config.chunking.maxTokens,
      overlapTokens: this.config.chunking.overlapTokens,
    });

    // Create translation agent
    const agent = createTranslationAgent({
      provider: this.provider,
      qualityThreshold: options.qualityThreshold ?? this.config.quality.threshold,
      maxIterations: options.maxIterations ?? this.config.quality.maxIterations,
      verbose: this.verbose,
      strictQuality: options.strictQuality,
    });

    // Translate each chunk
    const chunkResults: ChunkResult[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalIterations = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk) continue;

      if (chunk.type === 'preserve') {
        chunkResults.push({
          original: chunk.content,
          translated: chunk.content,
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
          qualityScore: 100,
        });
        continue;
      }

      if (this.verbose) {
        logger.info(`Translating chunk ${i + 1}/${chunks.length}...`);
      }

      const result = await this.translateChunk(chunk, options, glossary, agent);
      chunkResults.push(result);

      // Accumulate token and iteration counts
      if (result.tokensUsed) {
        totalInputTokens += result.tokensUsed.input;
        totalOutputTokens += result.tokensUsed.output;
      }
      if (result.iterations) {
        totalIterations += result.iterations;
      }
    }

    // Reassemble
    const translatedContent = chunkResults.map((r) => r.translated).join('');

    // Calculate average quality
    const qualityScores = chunkResults
      .filter((r) => r.qualityScore > 0)
      .map((r) => r.qualityScore);
    const averageQuality =
      qualityScores.length > 0
        ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
        : 0;

    // Calculate cache statistics from chunk results
    const cacheHits = chunkResults.filter((r) => r.cached).length;
    const cacheMisses = chunkResults.filter((r) => !r.cached && r.qualityScore > 0).length;

    return {
      content: translatedContent,
      chunks: chunkResults,
      metadata: {
        totalTokensUsed: totalInputTokens + totalOutputTokens,
        totalDuration: 0,
        averageQuality,
        provider: this.provider.name,
        model: this.config.provider.model ?? this.provider.defaultModel,
        totalIterations,
        tokensUsed: {
          input: totalInputTokens,
          output: totalOutputTokens,
        },
        cache: {
          hits: cacheHits,
          misses: cacheMisses,
        },
      },
    };
  }

  private async translateChunk(
    chunk: Chunk,
    options: TranslateFileOptions,
    glossary: ResolvedGlossary | undefined,
    agent: TranslationAgent
  ): Promise<ChunkResult> {
    // Build cache key
    const glossaryString = glossary
      ? JSON.stringify(glossary.terms.map((t) => ({ s: t.source, t: t.target })))
      : undefined;

    const cacheKey: CacheKey = {
      content: chunk.content,
      sourceLang: options.sourceLang,
      targetLang: options.targetLang,
      glossary: glossaryString,
      provider: this.provider.name,
      model: this.config.provider.model ?? this.provider.defaultModel,
    };

    // Check cache first
    const cacheResult = this.cache.get(cacheKey);
    if (cacheResult.hit && cacheResult.entry) {
      this.cacheHits++;
      if (this.verbose) {
        logger.info(`  ↳ Cache hit (quality: ${cacheResult.entry.qualityScore})`);
      }
      return {
        original: chunk.content,
        translated: cacheResult.entry.translation,
        startOffset: chunk.startOffset,
        endOffset: chunk.endOffset,
        qualityScore: cacheResult.entry.qualityScore,
        iterations: 0,
        tokensUsed: { input: 0, output: 0, cacheRead: 1 },
        cached: true,
      };
    }

    this.cacheMisses++;

    // Build context from chunk metadata and options
    // Resolve style instruction: CLI option > config.languages.styles[targetLang]
    const resolvedStyleInstruction =
      options.styleInstruction ?? this.config.languages.styles?.[options.targetLang];

    const context: TranslationRequest['context'] = {
      documentPurpose: options.context,
      styleInstruction: resolvedStyleInstruction,
    };

    // Add header hierarchy context if available
    if (chunk.metadata?.headerHierarchy && chunk.metadata.headerHierarchy.length > 0) {
      context.documentSummary = `Current section: ${chunk.metadata.headerHierarchy.join(' > ')}`;
    }

    // Add previous context if available
    if (chunk.metadata?.previousContext) {
      context.previousChunks = [chunk.metadata.previousContext];
    }

    const request: TranslationRequest = {
      content: chunk.content,
      sourceLang: options.sourceLang,
      targetLang: options.targetLang,
      format: options.format ?? 'text',
      glossary,
      context,
    };

    try {
      const result = await agent.translate(request);

      // Store in cache
      this.cache.set(cacheKey, result.content, result.metadata.qualityScore);

      return {
        original: chunk.content,
        translated: result.content,
        startOffset: chunk.startOffset,
        endOffset: chunk.endOffset,
        qualityScore: result.metadata.qualityScore,
        iterations: result.metadata.iterations,
        tokensUsed: result.metadata.tokensUsed,
      };
    } catch (error) {
      // Log error but continue with original content
      logger.error(`Failed to translate chunk: ${error}`);

      return {
        original: chunk.content,
        translated: chunk.content, // Fallback to original
        startOffset: chunk.startOffset,
        endOffset: chunk.endOffset,
        qualityScore: 0,
        iterations: 0,
        tokensUsed: { input: 0, output: 0 },
      };
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private detectFormat(content: string): DocumentFormat {
    // Check for markdown indicators
    if (
      content.includes('# ') ||
      content.includes('## ') ||
      content.includes('```') ||
      content.includes('- ') ||
      content.match(/\[.+\]\(.+\)/)
    ) {
      return 'markdown';
    }

    // Check for HTML indicators
    if (
      content.includes('<html') ||
      content.includes('<body') ||
      content.includes('<div') ||
      content.includes('<p>')
    ) {
      return 'html';
    }

    return 'text';
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createTranslationEngine(
  options: TranslationEngineOptions
): TranslationEngine {
  return new TranslationEngine(options);
}

// ============================================================================
// Simple Translation Function (for direct use)
// ============================================================================

export async function translateText(
  content: string,
  sourceLang: string,
  targetLang: string,
  options?: {
    provider?: LLMProvider;
    glossaryPath?: string;
    qualityThreshold?: number;
    maxIterations?: number;
    verbose?: boolean;
  }
): Promise<string> {
  const defaultConfig: TranslateConfig = {
    version: '1.0',
    languages: { source: sourceLang, targets: [targetLang] },
    provider: { default: 'claude' },
    quality: {
      threshold: options?.qualityThreshold ?? 85,
      maxIterations: options?.maxIterations ?? 4,
      evaluationMethod: 'llm',
    },
    chunking: {
      maxTokens: 1024,
      overlapTokens: 150,
      preserveStructure: true,
    },
    paths: { output: './' },
  };

  const engine = createTranslationEngine({
    config: defaultConfig,
    provider: options?.provider,
    verbose: options?.verbose,
  });

  const result = await engine.translateContent({
    content,
    sourceLang,
    targetLang,
    glossaryPath: options?.glossaryPath,
    qualityThreshold: options?.qualityThreshold,
    maxIterations: options?.maxIterations,
  });

  return result.content;
}
