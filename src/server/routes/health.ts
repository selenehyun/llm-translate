import { Hono } from 'hono';
import type { HealthResponse } from '../types.js';
import {
  getAvailableProviders,
  getProviderConfigFromEnv,
} from '../../providers/registry.js';
import type { ProviderName } from '../../types/index.js';

// ============================================================================
// Health Router
// ============================================================================

const healthRouter = new Hono();

// Track server start time for uptime calculation
const startTime = Date.now();

/**
 * GET /health - Comprehensive health check endpoint
 * Suitable for k8s liveness/readiness probes
 */
healthRouter.get('/', async (c) => {
  const providers = getAvailableProviders();

  const providerStatus = providers.map((name: ProviderName) => {
    const config = getProviderConfigFromEnv(name);

    // Check if provider has required configuration
    let available = false;
    if (name === 'ollama') {
      // Ollama doesn't require API key, just assumes server is running
      available = true;
    } else {
      available = !!config.apiKey;
    }

    return { name, available };
  });

  const anyProviderAvailable = providerStatus.some((p) => p.available);

  const response: HealthResponse = {
    status: anyProviderAvailable ? 'healthy' : 'degraded',
    version: process.env['npm_package_version'] ?? '0.1.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    providers: providerStatus,
  };

  // Return 503 if no providers available (for k8s readiness probe)
  const status = anyProviderAvailable ? 200 : 503;

  return c.json(response, status);
});

/**
 * GET /health/live - Simple liveness probe
 * Returns 200 as long as the server is running
 */
healthRouter.get('/live', (c) => {
  return c.json({ status: 'ok' });
});

/**
 * GET /health/ready - Readiness probe
 * Returns 200 if the server is ready to accept requests
 */
healthRouter.get('/ready', async (c) => {
  const providers = getAvailableProviders();

  // Check if at least one provider is configured
  const hasConfiguredProvider = providers.some((name: ProviderName) => {
    if (name === 'ollama') return true;
    const config = getProviderConfigFromEnv(name);
    return !!config.apiKey;
  });

  if (hasConfiguredProvider) {
    return c.json({ status: 'ready' });
  }

  return c.json({ status: 'not_ready', reason: 'No providers configured' }, 503);
});

export { healthRouter };
