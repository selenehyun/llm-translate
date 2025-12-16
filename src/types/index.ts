// ============================================================================
// Configuration Types
// ============================================================================

export type ProviderName = 'claude' | 'openai' | 'ollama' | 'custom';

export interface TranslateConfig {
  version: string;
  project?: {
    name: string;
    description: string;
    purpose: string;
  };
  languages: {
    source: string;
    targets: string[];
    /** Per-language style instructions (e.g., { "ko": "경어체", "ja": "です・ます調" }) */
    styles?: Record<string, string>;
  };
  provider: {
    default: ProviderName;
    model?: string;
    fallback?: ProviderName[];
    apiKeys?: Record<ProviderName, string>;
  };
  quality: {
    threshold: number;
    maxIterations: number;
    evaluationMethod: 'llm' | 'embedding' | 'hybrid';
  };
  chunking: {
    maxTokens: number;
    overlapTokens: number;
    preserveStructure: boolean;
  };
  glossary?: {
    path: string;
    strict: boolean;
  };
  paths: {
    output: string;
    cache?: string;
  };
  ignore?: string[];
}

// ============================================================================
// Glossary Types
// ============================================================================

export interface Glossary {
  metadata: {
    name: string;
    sourceLang: string;
    targetLangs: string[];
    version: string;
    domain?: string;
  };
  terms: GlossaryTerm[];
}

export interface GlossaryTerm {
  source: string;
  targets: Record<string, string>;
  context?: string;
  caseSensitive?: boolean;
  doNotTranslate?: boolean;
  doNotTranslateFor?: string[];
  partOfSpeech?: 'noun' | 'verb' | 'adjective' | 'other';
  notes?: string;
}

export interface ResolvedGlossary {
  metadata: {
    name: string;
    sourceLang: string;
    targetLang: string;
    version: string;
    domain?: string;
  };
  terms: ResolvedGlossaryTerm[];
}

export interface ResolvedGlossaryTerm {
  source: string;
  target: string;
  context?: string;
  caseSensitive: boolean;
  doNotTranslate: boolean;
}

// ============================================================================
// Translation Types
// ============================================================================

export type DocumentFormat = 'markdown' | 'html' | 'text';

export interface TranslationRequest {
  content: string;
  sourceLang: string;
  targetLang: string;
  format: DocumentFormat;
  glossary?: ResolvedGlossary;
  context?: {
    documentPurpose?: string;
    /** Per-language style instruction (e.g., "경어체", "です・ます調") */
    styleInstruction?: string;
    previousChunks?: string[];
    documentSummary?: string;
  };
  options?: {
    qualityThreshold?: number;
    maxIterations?: number;
    preserveFormatting?: boolean;
  };
}

export interface TranslationResult {
  content: string;
  metadata: {
    qualityScore: number;
    qualityThreshold: number;
    thresholdMet: boolean;
    iterations: number;
    tokensUsed: {
      input: number;
      output: number;
      /** Tokens read from cache (90% cost reduction) */
      cacheRead?: number;
      /** Tokens written to cache (25% cost increase for first write) */
      cacheWrite?: number;
    };
    duration: number;
    provider: string;
    model: string;
  };
  glossaryCompliance?: {
    applied: string[];
    missed: string[];
  };
}

export interface ChunkResult {
  original: string;
  translated: string;
  startOffset: number;
  endOffset: number;
  qualityScore: number;
  iterations?: number;
  tokensUsed?: {
    input: number;
    output: number;
    /** Number of cache hits for this chunk */
    cacheRead?: number;
  };
  /** Whether this chunk was retrieved from cache */
  cached?: boolean;
}

export interface DocumentResult {
  content: string;
  chunks: ChunkResult[];
  metadata: {
    totalTokensUsed: number;
    totalDuration: number;
    averageQuality: number;
    provider: string;
    model: string;
    totalIterations: number;
    tokensUsed: {
      input: number;
      output: number;
      /** Tokens read from cache (90% cost reduction) */
      cacheRead?: number;
      /** Tokens written to cache (25% cost increase for first write) */
      cacheWrite?: number;
    };
    /** Cache statistics */
    cache?: {
      hits: number;
      misses: number;
    };
  };
  glossaryCompliance?: {
    applied: string[];
    missed: string[];
    compliant: boolean;
  };
}

// ============================================================================
// Chunking Types
// ============================================================================

export interface Chunk {
  id: string;
  content: string;
  type: 'translatable' | 'preserve';
  startOffset: number;
  endOffset: number;
  metadata?: {
    headerHierarchy?: string[];
    previousContext?: string;
  };
}

export interface ChunkingConfig {
  maxTokens: number;
  overlapTokens: number;
  separators: string[];
  preservePatterns: RegExp[];
}

// ============================================================================
// Quality Evaluation Types
// ============================================================================

/**
 * Legacy simple quality evaluation (for fast mode or fallback)
 */
export interface SimpleQualityEvaluation {
  score: number;
  breakdown: {
    accuracy: number;
    fluency: number;
    glossary: number;
    format: number;
  };
  issues: string[];
}

// Re-export MQM types
export * from './mqm.js';

// Re-export analysis types
export * from './analysis.js';

// Re-export mode types
export * from './modes.js';

/**
 * Combined quality evaluation type (supports both MQM and simple)
 */
export type QualityEvaluation = SimpleQualityEvaluation;

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry {
  sourceHash: string;
  sourceLang: string;
  targetLang: string;
  glossaryHash: string;
  translation: string;
  qualityScore: number;
  createdAt: string;
  provider: string;
  model: string;
}

export interface CacheIndex {
  version: string;
  entries: Record<string, CacheEntry>;
}
