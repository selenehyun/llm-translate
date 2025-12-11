import type { ProviderName } from '../types/index.js';
import type { LLMProvider, ProviderConfig, ProviderFactory } from './interface.js';
import { TranslationError, ErrorCode } from '../errors.js';
import { createClaudeProvider } from './claude.js';

// ============================================================================
// Provider Registry
// ============================================================================

const providers = new Map<ProviderName, ProviderFactory>();

export function registerProvider(
  name: ProviderName,
  factory: ProviderFactory
): void {
  providers.set(name, factory);
}

export function getProvider(
  name: ProviderName,
  config: ProviderConfig = {}
): LLMProvider {
  const factory = providers.get(name);

  if (!factory) {
    throw new TranslationError(ErrorCode.PROVIDER_NOT_FOUND, {
      provider: name,
      available: Array.from(providers.keys()),
    });
  }

  return factory(config);
}

export function hasProvider(name: ProviderName): boolean {
  return providers.has(name);
}

export function getAvailableProviders(): ProviderName[] {
  return Array.from(providers.keys());
}

// ============================================================================
// Provider Configuration from Environment
// ============================================================================

export function getProviderConfigFromEnv(name: ProviderName): ProviderConfig {
  switch (name) {
    case 'claude':
      return {
        apiKey: process.env['ANTHROPIC_API_KEY'],
        // defaultModel is handled by the provider itself
      };

    case 'openai':
      return {
        apiKey: process.env['OPENAI_API_KEY'],
        defaultModel: 'gpt-4o',
      };

    case 'ollama':
      return {
        baseUrl: process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434',
        defaultModel: 'llama2',
      };

    case 'custom':
      return {
        apiKey: process.env['LLM_API_KEY'],
        baseUrl: process.env['LLM_BASE_URL'],
      };

    default:
      return {};
  }
}

// ============================================================================
// Create Provider with Fallback
// ============================================================================

export interface CreateProviderOptions {
  primary: ProviderName;
  fallback?: ProviderName[];
  config?: Partial<Record<ProviderName, ProviderConfig>>;
}

// ============================================================================
// Auto-register Built-in Providers
// ============================================================================

registerProvider('claude', createClaudeProvider);

// ============================================================================
// Create Provider with Fallback
// ============================================================================

export function createProviderWithFallback(
  options: CreateProviderOptions
): LLMProvider {
  const { primary, fallback = [], config = {} } = options;

  // Try primary provider
  const primaryConfig = {
    ...getProviderConfigFromEnv(primary),
    ...config[primary],
  };

  if (hasProvider(primary) && primaryConfig.apiKey) {
    return getProvider(primary, primaryConfig);
  }

  // Try fallback providers
  for (const fallbackName of fallback) {
    const fallbackConfig = {
      ...getProviderConfigFromEnv(fallbackName),
      ...config[fallbackName],
    };

    if (hasProvider(fallbackName) && fallbackConfig.apiKey) {
      return getProvider(fallbackName, fallbackConfig);
    }
  }

  // No provider available
  throw new TranslationError(ErrorCode.PROVIDER_AUTH_FAILED, {
    primary,
    fallback,
    message: 'No API key found for any configured provider',
  });
}
