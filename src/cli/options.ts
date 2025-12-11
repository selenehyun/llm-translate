import type { ProviderName, DocumentFormat } from '../types/index.js';

// ============================================================================
// CLI Option Types
// ============================================================================

export interface GlobalOptions {
  sourceLang: string;
  targetLang: string;
  config?: string;
  verbose?: boolean;
  quiet?: boolean;
}

export interface TranslationOptions extends GlobalOptions {
  glossary?: string;
  provider?: ProviderName;
  model?: string;
  quality?: string;  // Commander returns strings, parsed to number in handler
  maxIterations?: string;  // Commander returns strings, parsed to number in handler
}

export interface OutputOptions {
  output?: string;
  format?: DocumentFormat;
  dryRun?: boolean;
  json?: boolean;
}

export interface AdvancedOptions {
  chunkSize?: string;  // Commander returns strings, parsed to number in handler
  parallel?: number;
  noCache?: boolean;
  context?: string;
  strictQuality?: boolean;
  strictGlossary?: boolean;
}

export interface FileCommandOptions
  extends TranslationOptions,
    OutputOptions,
    AdvancedOptions {}

export interface DirCommandOptions
  extends TranslationOptions,
    OutputOptions,
    AdvancedOptions {}

// ============================================================================
// Default Values
// ============================================================================

export const defaults = {
  quality: 85,
  maxIterations: 4,
  chunkSize: 1024,
  parallel: 3,
  provider: 'claude' as ProviderName,
} as const;
