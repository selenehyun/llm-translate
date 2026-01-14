import { z } from 'zod';

// ============================================================================
// Request Validation Schemas
// ============================================================================

/**
 * Translation mode enum
 */
export const TranslationModeSchema = z.enum(['fast', 'balanced', 'quality']);
export type TranslationMode = z.infer<typeof TranslationModeSchema>;

/**
 * Inline glossary term schema (simplified for API)
 */
export const InlineGlossaryTermSchema = z.object({
  source: z.string().min(1, 'Source term is required'),
  target: z.string().min(1, 'Target term is required'),
  context: z.string().optional(),
  caseSensitive: z.boolean().optional(),
  doNotTranslate: z.boolean().optional(),
});

export type InlineGlossaryTerm = z.infer<typeof InlineGlossaryTermSchema>;

/**
 * POST /translate request body schema
 */
export const TranslateRequestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  sourceLang: z
    .string()
    .min(2, 'Source language code must be at least 2 characters')
    .max(10, 'Source language code must be at most 10 characters'),
  targetLang: z
    .string()
    .min(2, 'Target language code must be at least 2 characters')
    .max(10, 'Target language code must be at most 10 characters'),
  format: z.enum(['markdown', 'html', 'text']).optional().default('text'),
  glossary: z.array(InlineGlossaryTermSchema).optional(),
  provider: z.enum(['claude', 'openai', 'ollama']).optional(),
  model: z.string().optional(),
  mode: TranslationModeSchema.optional().default('balanced'),
  qualityThreshold: z.number().min(0).max(100).optional(),
  maxIterations: z.number().min(1).max(10).optional(),
  context: z.string().optional(),
});

export type TranslateRequest = z.infer<typeof TranslateRequestSchema>;

// ============================================================================
// Response Types
// ============================================================================

/**
 * POST /translate response
 */
export interface TranslateResponse {
  translated: string;
  quality: number;
  iterations: number;
  tokensUsed: {
    input: number;
    output: number;
  };
  glossaryCompliance?: {
    applied: string[];
    missed: string[];
  };
  duration: number;
  provider: string;
  model: string;
}

/**
 * GET /health response
 */
export interface HealthResponse {
  status: 'healthy' | 'degraded';
  version: string;
  uptime: number;
  providers: {
    name: string;
    available: boolean;
  }[];
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Server Configuration
// ============================================================================

/**
 * Server configuration options
 */
export interface ServerConfig {
  port: number;
  host: string;
  enableAuth: boolean;
  enableCors: boolean;
  apiKey?: string;
  jsonLogging?: boolean;
}

// ============================================================================
// Hono Context Variables
// ============================================================================

/**
 * Custom variables stored in Hono context
 */
export interface HonoVariables {
  requestId: string;
}

// ============================================================================
// Mode Presets
// ============================================================================

/**
 * Mode configuration presets
 */
export const MODE_PRESETS: Record<
  TranslationMode,
  { qualityThreshold: number; maxIterations: number }
> = {
  fast: { qualityThreshold: 0, maxIterations: 1 },
  balanced: { qualityThreshold: 75, maxIterations: 2 },
  quality: { qualityThreshold: 85, maxIterations: 4 },
};
