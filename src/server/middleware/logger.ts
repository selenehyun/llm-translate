import { createMiddleware } from 'hono/factory';
import type { Context, Next } from 'hono';

// ============================================================================
// Types
// ============================================================================

export interface LoggerConfig {
  json: boolean;
}

interface LogEntry {
  timestamp: string;
  requestId: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  userAgent?: string;
}

// ============================================================================
// Logger Middleware
// ============================================================================

/**
 * Request logging middleware with structured JSON output for containers
 */
export function createLoggerMiddleware(config: LoggerConfig) {
  return createMiddleware(async (c: Context, next: Next) => {
    const start = Date.now();
    const requestId = generateRequestId();

    // Store request ID for correlation in other middleware/handlers
    c.set('requestId', requestId);

    const method = c.req.method;
    const path = c.req.path;

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    if (config.json) {
      // Structured JSON logging for container environments
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        requestId,
        method,
        path,
        status,
        duration,
        userAgent: c.req.header('User-Agent'),
      };
      console.log(JSON.stringify(entry));
    } else {
      // Human-readable logging for development
      const statusColor = getStatusColor(status);
      console.log(`${statusColor}${status}\x1b[0m ${method} ${path} - ${duration}ms`);
    }
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a short unique request ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Get ANSI color code based on HTTP status
 */
function getStatusColor(status: number): string {
  if (status >= 500) {
    return '\x1b[31m'; // Red for server errors
  }
  if (status >= 400) {
    return '\x1b[33m'; // Yellow for client errors
  }
  if (status >= 300) {
    return '\x1b[36m'; // Cyan for redirects
  }
  return '\x1b[32m'; // Green for success
}
