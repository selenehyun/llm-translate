import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { Context, Next } from 'hono';

// ============================================================================
// Types
// ============================================================================

export interface AuthConfig {
  enabled: boolean;
  apiKey?: string;
}

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * API Key authentication middleware
 * Supports both X-API-Key header and Authorization: Bearer token
 */
export function createAuthMiddleware(config: AuthConfig) {
  return createMiddleware(async (c: Context, next: Next) => {
    // Skip auth if disabled
    if (!config.enabled) {
      return next();
    }

    // Get API key from config or environment
    const expectedKey = config.apiKey ?? process.env.TRANSLATE_API_KEY;

    if (!expectedKey) {
      // No API key configured, skip auth (warning should be logged at startup)
      return next();
    }

    // Check X-API-Key header first
    let providedKey = c.req.header('X-API-Key');

    // Fall back to Authorization: Bearer <token>
    if (!providedKey) {
      const authHeader = c.req.header('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        providedKey = authHeader.slice(7);
      }
    }

    if (!providedKey) {
      throw new HTTPException(401, {
        message:
          'API key required. Provide via X-API-Key header or Authorization: Bearer <token>',
      });
    }

    // Constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(providedKey, expectedKey)) {
      throw new HTTPException(401, {
        message: 'Invalid API key',
      });
    }

    return next();
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Timing-safe string comparison to prevent timing attacks
 * @param a First string
 * @param b Second string
 * @returns true if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still perform comparison to maintain constant time
    // even when lengths differ
    let result = 1;
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      result |= (a.charCodeAt(i % a.length) || 0) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
