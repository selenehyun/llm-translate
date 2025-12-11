// ============================================================================
// llm-translate - LLM-powered CLI Translation Tool
// ============================================================================

// Types
export type {
  TranslateConfig,
  ProviderName,
  Glossary,
  GlossaryTerm,
  ResolvedGlossary,
  ResolvedGlossaryTerm,
  TranslationRequest,
  TranslationResult,
  DocumentResult,
  ChunkResult,
  Chunk,
  ChunkingConfig,
  QualityEvaluation,
  DocumentFormat,
} from './types/index.js';

// Provider Interface
export type {
  LLMProvider,
  ProviderConfig,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ModelInfo,
} from './providers/interface.js';

// Errors
export {
  TranslationError,
  ErrorCode,
  ExitCode,
  isTranslationError,
  isErrorCode,
  getExitCode,
} from './errors.js';

// Services
export { loadConfig, mergeConfig } from './services/config.js';
export {
  loadGlossary,
  resolveGlossary,
  createGlossaryLookup,
  checkGlossaryCompliance,
} from './services/glossary.js';

// Provider Registry
export {
  registerProvider,
  getProvider,
  hasProvider,
  getAvailableProviders,
  getProviderConfigFromEnv,
  createProviderWithFallback,
} from './providers/registry.js';

// Claude Provider
export { ClaudeProvider, createClaudeProvider } from './providers/claude.js';

// Core - Chunker
export {
  chunkContent,
  reassembleChunks,
  getChunkStats,
} from './core/chunker.js';

// Core - Translation Agent
export {
  TranslationAgent,
  createTranslationAgent,
} from './core/agent.js';

// Core - Translation Engine
export {
  TranslationEngine,
  createTranslationEngine,
  translateText,
} from './core/engine.js';

// Parsers
export {
  parseMarkdown,
  applyTranslations,
  getTranslatableText,
  createTranslationMap,
  extractTextForTranslation,
  restorePreservedSections,
  translateMarkdownContent,
} from './parsers/markdown.js';

// Utilities
export { estimateTokens, exceedsTokenLimit, truncateToTokenLimit } from './utils/tokens.js';
export { logger, configureLogger, createTimer } from './utils/logger.js';
