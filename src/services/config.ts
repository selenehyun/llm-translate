import { cosmiconfig } from 'cosmiconfig';
import { z } from 'zod';
import type { TranslateConfig, ProviderName } from '../types/index.js';
import { TranslationError, ErrorCode } from '../errors.js';

// ============================================================================
// Zod Schema for Config Validation
// ============================================================================

const providerNameSchema = z.enum(['claude', 'openai', 'ollama', 'custom']);

const configSchema = z.object({
  version: z.string(),
  project: z
    .object({
      name: z.string(),
      description: z.string(),
      purpose: z.string(),
    })
    .optional(),
  languages: z.object({
    source: z.string(),
    targets: z.array(z.string()),
    styles: z.record(z.string(), z.string()).optional(),
  }),
  provider: z.object({
    default: providerNameSchema,
    model: z.string().optional(),
    fallback: z.array(providerNameSchema).optional(),
    apiKeys: z.record(providerNameSchema, z.string()).optional(),
  }),
  quality: z.object({
    threshold: z.number().min(0).max(100),
    maxIterations: z.number().min(1).max(10),
    evaluationMethod: z.enum(['llm', 'embedding', 'hybrid']),
  }),
  chunking: z.object({
    maxTokens: z.number().min(100).max(8000),
    overlapTokens: z.number().min(0),
    preserveStructure: z.boolean(),
  }),
  glossary: z
    .object({
      path: z.string(),
      strict: z.boolean(),
    })
    .optional(),
  paths: z.object({
    output: z.string(),
    cache: z.string().optional(),
  }),
  ignore: z.array(z.string()).optional(),
});

// ============================================================================
// Default Configuration
// ============================================================================

const defaultConfig: TranslateConfig = {
  version: '1.0',
  languages: {
    source: 'en',
    targets: [],
  },
  provider: {
    default: 'claude',
  },
  quality: {
    threshold: 85,
    maxIterations: 4,
    evaluationMethod: 'llm',
  },
  chunking: {
    maxTokens: 1024,
    overlapTokens: 150,
    preserveStructure: true,
  },
  paths: {
    output: './{lang}',
  },
};

// ============================================================================
// Config Loader
// ============================================================================

const explorer = cosmiconfig('translate', {
  searchPlaces: [
    '.translaterc',
    '.translaterc.json',
    '.translaterc.yaml',
    '.translaterc.yml',
    'translate.config.js',
    'translate.config.mjs',
  ],
});

export interface LoadConfigOptions {
  configPath?: string;
  cwd?: string;
}

export async function loadConfig(
  options: LoadConfigOptions = {}
): Promise<TranslateConfig> {
  const { configPath, cwd = process.cwd() } = options;

  let result;

  try {
    if (configPath) {
      result = await explorer.load(configPath);
    } else {
      result = await explorer.search(cwd);
    }
  } catch (error) {
    throw new TranslationError(ErrorCode.CONFIG_NOT_FOUND, {
      path: configPath ?? cwd,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (!result || result.isEmpty) {
    // Return default config if no config file found
    return defaultConfig;
  }

  // Validate config
  const parseResult = configSchema.safeParse(result.config);

  if (!parseResult.success) {
    throw new TranslationError(ErrorCode.CONFIG_INVALID, {
      path: result.filepath,
      errors: parseResult.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  return parseResult.data as TranslateConfig;
}

// ============================================================================
// Config Merger (CLI options override config file)
// ============================================================================

export interface CLIOverrides {
  sourceLang?: string;
  targetLang?: string;
  provider?: ProviderName;
  model?: string;
  quality?: number;
  maxIterations?: number;
  chunkSize?: number;
  glossary?: string;
  output?: string;
  noCache?: boolean;
}

export function mergeConfig(
  config: TranslateConfig,
  overrides: CLIOverrides
): TranslateConfig {
  const merged = { ...config };

  if (overrides.sourceLang) {
    merged.languages = { ...merged.languages, source: overrides.sourceLang };
  }

  if (overrides.targetLang) {
    merged.languages = {
      ...merged.languages,
      targets: [overrides.targetLang],
    };
  }

  if (overrides.provider) {
    merged.provider = { ...merged.provider, default: overrides.provider };
  }

  if (overrides.model) {
    merged.provider = { ...merged.provider, model: overrides.model };
  }

  if (overrides.quality !== undefined) {
    merged.quality = { ...merged.quality, threshold: overrides.quality };
  }

  if (overrides.maxIterations !== undefined) {
    merged.quality = {
      ...merged.quality,
      maxIterations: overrides.maxIterations,
    };
  }

  if (overrides.chunkSize !== undefined) {
    merged.chunking = { ...merged.chunking, maxTokens: overrides.chunkSize };
  }

  if (overrides.glossary) {
    merged.glossary = {
      path: overrides.glossary,
      strict: merged.glossary?.strict ?? false,
    };
  }

  if (overrides.output) {
    merged.paths = { ...merged.paths, output: overrides.output };
  }

  if (overrides.noCache) {
    merged.paths = { ...merged.paths, cache: undefined };
  }

  return merged;
}
