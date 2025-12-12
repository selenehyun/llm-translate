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
  CacheEntry,
  CacheIndex,
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
export {
  CacheManager,
  createCacheManager,
  createNullCacheManager,
  hashContent,
  generateCacheKey,
  // Invalidation Policies
  GlossaryChangePolicy,
  TTLPolicy,
  ProviderChangePolicy,
  QualityThresholdPolicy,
  CompositePolicy,
  // Preset Policy Configurations
  createDefaultPolicies,
  createStrictPolicies,
  createMinimalPolicies,
} from './services/cache.js';
export type {
  CacheOptions,
  CacheKey,
  CacheStats,
  CacheResult,
  CacheMetadata,
  // Invalidation Policy Types
  InvalidationPolicy,
  InvalidationContext,
  InvalidationResult,
} from './services/cache.js';

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

// VitePress Integration
export {
  generateLocaleConfig,
  generateLocale,
  generateSidebarConfig,
  detectLocales,
  detectSidebarDirs,
} from './integrations/vitepress.js';
export type {
  LocaleConfig,
  ThemeConfig,
  NavItem,
  NavItemWithLink,
  NavItemWithChildren,
  SidebarItem,
  GenerateOptions,
  LocaleTranslations,
} from './integrations/vitepress.js';
