import { Command } from 'commander';
import { startServer } from '../../server/index.js';

// ============================================================================
// Types
// ============================================================================

export interface ServeCommandOptions {
  port?: string;
  host?: string;
  auth?: boolean; // Commander's --no-auth sets this to false
  cors?: boolean | string; // boolean when flag only, string when origins specified
  json?: boolean;
  cacheDir?: string;
}

// ============================================================================
// Serve Command
// ============================================================================

export const serveCommand = new Command('serve')
  .description('Start the translation API server')
  .option(
    '-p, --port <number>',
    'Server port (env: TRANSLATE_PORT)',
    process.env['TRANSLATE_PORT'] ?? '3000'
  )
  .option('-H, --host <string>', 'Host to bind', '0.0.0.0')
  .option('--no-auth', 'Disable API key authentication')
  .option('--cors [origins]', 'Enable CORS (optionally specify allowed origins, comma-separated)')
  .option('--json', 'Use JSON logging format (for containers)')
  .option(
    '--cache-dir <path>',
    'Cache directory path (env: TRANSLATE_CACHE_DIR)',
    process.env['TRANSLATE_CACHE_DIR']
  )
  .action((options: ServeCommandOptions) => {
    const port = parseInt(options.port ?? '3000', 10);
    const host = options.host ?? '0.0.0.0';

    // Validate port
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error('Error: Invalid port number. Must be between 1 and 65535.');
      process.exit(2);
    }

    // Check for API key if auth is enabled
    const enableAuth = options.auth !== false;
    if (enableAuth && !process.env['TRANSLATE_API_KEY']) {
      console.warn(
        'Warning: TRANSLATE_API_KEY not set. API key authentication is disabled.'
      );
      console.warn(
        'Set TRANSLATE_API_KEY environment variable to enable authentication.\n'
      );
    }

    // Parse CORS options
    const enableCors = options.cors !== undefined && options.cors !== false;
    let corsOrigins: string | string[] | undefined;
    if (typeof options.cors === 'string') {
      // Parse comma-separated origins
      corsOrigins = options.cors.includes(',')
        ? options.cors.split(',').map((o) => o.trim())
        : options.cors;
    }

    startServer({
      port,
      host,
      enableAuth,
      enableCors,
      corsOrigins,
      apiKey: process.env['TRANSLATE_API_KEY'],
      jsonLogging: options.json ?? false,
      cachePath: options.cacheDir,
    });
  });
