import { Hono, type Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  TranslateRequestSchema,
  MODE_PRESETS,
  type TranslateResponse,
  type ErrorResponse,
  type InlineGlossaryTerm,
  type HonoVariables,
} from '../types.js';
import { createTranslationEngine } from '../../core/engine.js';
import { loadConfig } from '../../services/config.js';
import { TranslationError, ErrorCode } from '../../errors.js';
import type { ResolvedGlossary, ResolvedGlossaryTerm } from '../../types/index.js';

// ============================================================================
// Translate Router
// ============================================================================

const translateRouter = new Hono<{ Variables: HonoVariables }>();

/**
 * POST /translate - Main translation endpoint
 */
translateRouter.post(
  '/',
  zValidator('json', TranslateRequestSchema, (result, c) => {
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      return c.json<ErrorResponse>(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { errors },
        },
        400
      );
    }
    // Validation successful - continue to handler
    return undefined;
  }),
  async (c) => {
    const body = c.req.valid('json');
    const requestId = c.get('requestId') ?? 'unknown';
    const startTime = Date.now();

    try {
      // Load base config
      const baseConfig = await loadConfig();

      // Get mode presets
      const modeConfig = MODE_PRESETS[body.mode ?? 'balanced'];

      // Build config with overrides
      const config = {
        ...baseConfig,
        languages: {
          ...baseConfig.languages,
          source: body.sourceLang,
          targets: [body.targetLang],
        },
        provider: {
          ...baseConfig.provider,
          default: body.provider ?? baseConfig.provider.default,
          model: body.model ?? baseConfig.provider.model,
        },
        quality: {
          ...baseConfig.quality,
          threshold: body.qualityThreshold ?? modeConfig.qualityThreshold,
          maxIterations: body.maxIterations ?? modeConfig.maxIterations,
        },
      };

      // Create engine (API mode doesn't use file cache)
      const engine = createTranslationEngine({
        config,
        verbose: false,
        noCache: true,
      });

      // Convert inline glossary to resolved format if provided
      // Note: glossary support via inline terms will be implemented
      // when TranslationEngine supports passing glossary directly
      if (body.glossary && body.glossary.length > 0) {
        // TODO: Pass glossary to engine when supported
        convertInlineGlossary(body.glossary, body.sourceLang, body.targetLang);
      }

      // Translate content
      const result = await engine.translateContent({
        content: body.content,
        sourceLang: body.sourceLang,
        targetLang: body.targetLang,
        format: body.format,
        qualityThreshold: config.quality.threshold,
        maxIterations: config.quality.maxIterations,
        context: body.context,
      });

      const duration = Date.now() - startTime;

      const response: TranslateResponse = {
        translated: result.content,
        quality: result.metadata.averageQuality,
        iterations: result.metadata.totalIterations,
        tokensUsed: {
          input: result.metadata.tokensUsed.input,
          output: result.metadata.tokensUsed.output,
        },
        glossaryCompliance: result.glossaryCompliance
          ? {
              applied: result.glossaryCompliance.applied,
              missed: result.glossaryCompliance.missed,
            }
          : undefined,
        duration,
        provider: result.metadata.provider,
        model: result.metadata.model,
      };

      return c.json(response, 200);
    } catch (error) {
      return handleTranslationError(c, error, requestId);
    }
  }
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert inline glossary terms to resolved glossary format
 */
function convertInlineGlossary(
  terms: InlineGlossaryTerm[],
  sourceLang: string,
  targetLang: string
): ResolvedGlossary {
  return {
    metadata: {
      name: 'inline',
      sourceLang,
      targetLang,
      version: '1.0',
    },
    terms: terms.map(
      (term): ResolvedGlossaryTerm => ({
        source: term.source,
        target: term.doNotTranslate ? term.source : term.target,
        context: term.context,
        caseSensitive: term.caseSensitive ?? false,
        doNotTranslate: term.doNotTranslate ?? false,
      })
    ),
  };
}

/**
 * Handle translation errors and return appropriate HTTP response
 */
type StatusCode = 200 | 400 | 401 | 422 | 429 | 500 | 502;

function handleTranslationError(
  c: Context<{ Variables: HonoVariables }>,
  error: unknown,
  requestId: string
): Response {
  if (error instanceof TranslationError) {
    const statusMap: Record<string, StatusCode> = {
      [ErrorCode.PROVIDER_AUTH_FAILED]: 401,
      [ErrorCode.PROVIDER_RATE_LIMITED]: 429,
      [ErrorCode.PROVIDER_ERROR]: 502,
      [ErrorCode.PROVIDER_NOT_FOUND]: 400,
      [ErrorCode.QUALITY_THRESHOLD_NOT_MET]: 422,
      [ErrorCode.GLOSSARY_INVALID]: 400,
      [ErrorCode.GLOSSARY_NOT_FOUND]: 400,
      [ErrorCode.CONFIG_INVALID]: 400,
      [ErrorCode.UNSUPPORTED_FORMAT]: 400,
    };

    const status: StatusCode = statusMap[error.code] ?? 500;

    return c.json<ErrorResponse>(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      status
    );
  }

  // Unknown error
  console.error(`[${requestId}] Translation error:`, error);

  return c.json<ErrorResponse>(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    500
  );
}

export { translateRouter };
