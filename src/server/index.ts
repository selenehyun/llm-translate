import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve, type ServerType } from '@hono/node-server';
import { HTTPException } from 'hono/http-exception';

import { createAuthMiddleware } from './middleware/auth.js';
import { createLoggerMiddleware } from './middleware/logger.js';
import { healthRouter } from './routes/health.js';
import { translateRouter } from './routes/translate.js';
import type { ServerConfig, ErrorResponse, HonoVariables } from './types.js';

// ============================================================================
// Server Factory
// ============================================================================

/**
 * Create and configure the Hono application
 */
export function createApp(options: ServerConfig) {
  const app = new Hono<{ Variables: HonoVariables }>();

  // Request logging (first middleware)
  app.use('*', createLoggerMiddleware({
    json: options.jsonLogging ?? false,
  }));

  // CORS middleware (before auth)
  if (options.enableCors) {
    app.use('*', cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      exposeHeaders: ['X-Request-Id'],
      maxAge: 86400,
    }));
  }

  // Health endpoints (no auth required)
  app.route('/health', healthRouter);

  // Authentication middleware for /translate
  app.use('/translate/*', createAuthMiddleware({
    enabled: options.enableAuth,
    apiKey: options.apiKey,
  }));

  // Also apply auth to the base /translate endpoint
  app.use('/translate', createAuthMiddleware({
    enabled: options.enableAuth,
    apiKey: options.apiKey,
  }));

  // Translation endpoint
  app.route('/translate', translateRouter);

  // Global error handler
  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return c.json<ErrorResponse>(
        {
          error: error.message,
          code: 'HTTP_ERROR',
        },
        error.status
      );
    }

    console.error('Unhandled error:', error);

    return c.json<ErrorResponse>(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      500
    );
  });

  // 404 handler
  app.notFound((c) => {
    return c.json<ErrorResponse>(
      {
        error: 'Not found',
        code: 'NOT_FOUND',
      },
      404
    );
  });

  return app;
}

// ============================================================================
// Server Startup
// ============================================================================

/**
 * Start the HTTP server with graceful shutdown
 */
export function startServer(options: ServerConfig): ServerType {
  const app = createApp(options);

  const server = serve({
    fetch: app.fetch,
    port: options.port,
    hostname: options.host,
  });

  // Log startup information
  console.log(`\nllm-translate server started`);
  console.log(`  - Address: http://${options.host}:${options.port}`);
  console.log(`  - Health: http://${options.host}:${options.port}/health`);
  console.log(`  - Translate: http://${options.host}:${options.port}/translate`);
  console.log(`  - Auth: ${options.enableAuth ? 'enabled' : 'disabled'}`);
  console.log(`  - CORS: ${options.enableCors ? 'enabled' : 'disabled'}`);
  console.log('');

  // Graceful shutdown handlers
  const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);

    server.close((err) => {
      if (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
      console.log('Server closed');
      process.exit(0);
    });

    // Force exit after timeout
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
}

// ============================================================================
// Exports
// ============================================================================

export type { ServerConfig } from './types.js';
export { createAuthMiddleware } from './middleware/auth.js';
export { createLoggerMiddleware } from './middleware/logger.js';
export { healthRouter } from './routes/health.js';
export { translateRouter } from './routes/translate.js';
