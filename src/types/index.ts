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
  };
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

export interface QualityEvaluation {
  score: number;
  breakdown: {
    accuracy: number;
    fluency: number;
    glossary: number;
    format: number;
  };
  issues: string[];
}

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
