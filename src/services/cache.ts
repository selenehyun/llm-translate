/**
 * Translation Cache Service
 *
 * File-based caching using content hashes to avoid re-translating unchanged content.
 * Cache entries are indexed by a composite key of content hash, target language,
 * glossary hash, provider, and model.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { CacheEntry, CacheIndex } from '../types/index.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// Constants
// ============================================================================

const CACHE_VERSION = '1.0';
const INDEX_FILE = 'index.json';
const ENTRIES_DIR = 'entries';

// ============================================================================
// Invalidation Policy Types
// ============================================================================

/**
 * Context provided to invalidation policies for evaluation
 */
export interface InvalidationContext {
  /** Current glossary hash (if glossary is used) */
  glossaryHash?: string;
  /** Previous glossary hash (stored in cache metadata) */
  previousGlossaryHash?: string;
  /** Provider name */
  provider?: string;
  /** Model name */
  model?: string;
  /** Cache entry creation timestamp */
  entryCreatedAt?: string;
  /** Current timestamp */
  currentTime?: Date;
  /** Custom metadata for policy-specific checks */
  metadata?: Record<string, unknown>;
}

/**
 * Result of an invalidation check
 */
export interface InvalidationResult {
  /** Whether invalidation should occur */
  shouldInvalidate: boolean;
  /** Reason for invalidation (for logging) */
  reason?: string;
  /** Scope of invalidation */
  scope: 'all' | 'matching' | 'none';
  /** Filter function for 'matching' scope - returns true if entry should be invalidated */
  filter?: (entry: CacheEntry, key: string) => boolean;
}

/**
 * Abstract invalidation policy interface
 */
export interface InvalidationPolicy {
  /** Policy name for logging */
  readonly name: string;
  /** Check if cache should be invalidated */
  check(context: InvalidationContext): InvalidationResult;
}

// ============================================================================
// Built-in Invalidation Policies
// ============================================================================

/**
 * Invalidates all cache entries when glossary changes
 */
export class GlossaryChangePolicy implements InvalidationPolicy {
  readonly name = 'GlossaryChangePolicy';

  private readonly mode: 'all' | 'matching';

  /**
   * @param mode - 'all' invalidates entire cache, 'matching' only entries with old glossary hash
   */
  constructor(mode: 'all' | 'matching' = 'all') {
    this.mode = mode;
  }

  check(context: InvalidationContext): InvalidationResult {
    const { glossaryHash, previousGlossaryHash } = context;

    // No glossary or no previous hash - no invalidation needed
    if (!glossaryHash || !previousGlossaryHash) {
      return { shouldInvalidate: false, scope: 'none' };
    }

    // Glossary hasn't changed
    if (glossaryHash === previousGlossaryHash) {
      return { shouldInvalidate: false, scope: 'none' };
    }

    // Glossary changed
    if (this.mode === 'all') {
      return {
        shouldInvalidate: true,
        reason: `Glossary changed (${previousGlossaryHash.slice(0, 8)} → ${glossaryHash.slice(0, 8)})`,
        scope: 'all',
      };
    }

    // Matching mode - only invalidate entries with old glossary hash
    return {
      shouldInvalidate: true,
      reason: `Glossary changed, invalidating matching entries`,
      scope: 'matching',
      filter: (entry) => entry.glossaryHash === previousGlossaryHash,
    };
  }
}

/**
 * Invalidates cache entries older than specified TTL
 */
export class TTLPolicy implements InvalidationPolicy {
  readonly name = 'TTLPolicy';

  private readonly ttlMs: number;

  /**
   * @param ttlMs - Time-to-live in milliseconds
   */
  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  /**
   * Create policy with TTL in hours
   */
  static hours(hours: number): TTLPolicy {
    return new TTLPolicy(hours * 60 * 60 * 1000);
  }

  /**
   * Create policy with TTL in days
   */
  static days(days: number): TTLPolicy {
    return new TTLPolicy(days * 24 * 60 * 60 * 1000);
  }

  check(context: InvalidationContext): InvalidationResult {
    const currentTime = context.currentTime ?? new Date();
    const ttlMs = this.ttlMs;

    return {
      shouldInvalidate: true,
      reason: `TTL check (${this.ttlMs}ms)`,
      scope: 'matching',
      filter: (entry) => {
        const createdAt = new Date(entry.createdAt);
        const age = currentTime.getTime() - createdAt.getTime();
        return age > ttlMs;
      },
    };
  }
}

/**
 * Invalidates cache entries when provider or model changes
 */
export class ProviderChangePolicy implements InvalidationPolicy {
  readonly name = 'ProviderChangePolicy';

  private readonly checkModel: boolean;

  /**
   * @param checkModel - If true, also invalidate when model changes within same provider
   */
  constructor(checkModel: boolean = true) {
    this.checkModel = checkModel;
  }

  check(context: InvalidationContext): InvalidationResult {
    const { provider, model } = context;

    if (!provider) {
      return { shouldInvalidate: false, scope: 'none' };
    }

    return {
      shouldInvalidate: true,
      reason: `Provider/model mismatch check`,
      scope: 'matching',
      filter: (entry) => {
        if (entry.provider !== provider) return true;
        if (this.checkModel && model && entry.model !== model) return true;
        return false;
      },
    };
  }
}

/**
 * Invalidates cache entries below a quality threshold
 */
export class QualityThresholdPolicy implements InvalidationPolicy {
  readonly name = 'QualityThresholdPolicy';

  private readonly threshold: number;

  /**
   * @param threshold - Minimum quality score (0-100)
   */
  constructor(threshold: number) {
    this.threshold = threshold;
  }

  check(_context: InvalidationContext): InvalidationResult {
    const threshold = this.threshold;

    return {
      shouldInvalidate: true,
      reason: `Quality below threshold (${threshold})`,
      scope: 'matching',
      filter: (entry) => entry.qualityScore < threshold,
    };
  }
}

/**
 * Combines multiple policies - invalidates if ANY policy triggers
 */
export class CompositePolicy implements InvalidationPolicy {
  readonly name = 'CompositePolicy';

  private readonly policies: InvalidationPolicy[];
  private readonly mode: 'any' | 'all';

  /**
   * @param policies - Array of policies to combine
   * @param mode - 'any' triggers if any policy matches, 'all' requires all policies to match
   */
  constructor(policies: InvalidationPolicy[], mode: 'any' | 'all' = 'any') {
    this.policies = policies;
    this.mode = mode;
  }

  check(context: InvalidationContext): InvalidationResult {
    const results = this.policies.map((p) => ({
      policy: p,
      result: p.check(context),
    }));

    // Collect all filters that want to invalidate
    const activeResults = results.filter((r) => r.result.shouldInvalidate);

    if (activeResults.length === 0) {
      return { shouldInvalidate: false, scope: 'none' };
    }

    // Check for 'all' scope - takes priority
    const allScope = activeResults.find((r) => r.result.scope === 'all');
    if (allScope) {
      return {
        shouldInvalidate: true,
        reason: `${allScope.policy.name}: ${allScope.result.reason}`,
        scope: 'all',
      };
    }

    // Combine matching filters
    const filters = activeResults
      .filter((r) => r.result.filter)
      .map((r) => r.result.filter!);

    if (filters.length === 0) {
      return { shouldInvalidate: false, scope: 'none' };
    }

    const reasons = activeResults.map((r) => `${r.policy.name}`).join(', ');

    if (this.mode === 'any') {
      return {
        shouldInvalidate: true,
        reason: `Composite (any): ${reasons}`,
        scope: 'matching',
        filter: (entry, key) => filters.some((f) => f(entry, key)),
      };
    } else {
      return {
        shouldInvalidate: true,
        reason: `Composite (all): ${reasons}`,
        scope: 'matching',
        filter: (entry, key) => filters.every((f) => f(entry, key)),
      };
    }
  }
}

// ============================================================================
// Types
// ============================================================================

export interface CacheOptions {
  /** Cache directory path */
  cacheDir: string;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Invalidation policies to apply */
  invalidationPolicies?: InvalidationPolicy[];
}

export interface CacheKey {
  /** Source content (will be hashed) */
  content: string;
  /** Source language */
  sourceLang: string;
  /** Target language */
  targetLang: string;
  /** Glossary content or hash (will be hashed if string) */
  glossary?: string;
  /** Provider name */
  provider: string;
  /** Model name */
  model: string;
}

export interface CacheStats {
  /** Total number of cached entries */
  entries: number;
  /** Total cache size in bytes */
  sizeBytes: number;
  /** Cache version */
  version: string;
  /** Number of entries invalidated by policies */
  invalidated?: number;
}

/**
 * Cache metadata stored separately for tracking state across sessions
 */
export interface CacheMetadata {
  /** Last known glossary hash */
  glossaryHash?: string;
  /** Last known provider */
  provider?: string;
  /** Last known model */
  model?: string;
  /** Last invalidation timestamp */
  lastInvalidation?: string;
  /** Custom metadata */
  custom?: Record<string, unknown>;
}

export interface CacheResult {
  /** Whether the entry was found in cache */
  hit: boolean;
  /** The cached entry if found */
  entry?: CacheEntry;
}

// ============================================================================
// Hash Utilities
// ============================================================================

/**
 * Generate SHA-256 hash of content
 */
export function hashContent(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 16);
}

/**
 * Generate cache key from components
 */
export function generateCacheKey(key: CacheKey): string {
  const contentHash = hashContent(key.content);
  const glossaryHash = key.glossary ? hashContent(key.glossary) : 'none';

  // Create composite key: content_source_target_glossary_provider_model
  return `${contentHash}_${key.sourceLang}_${key.targetLang}_${glossaryHash}_${key.provider}_${key.model}`;
}

// ============================================================================
// Cache Manager
// ============================================================================

export class CacheManager {
  private cacheDir: string;
  private indexPath: string;
  private entriesDir: string;
  private metadataPath: string;
  private verbose: boolean;
  private index: CacheIndex | null = null;
  private policies: InvalidationPolicy[];
  private metadata: CacheMetadata | null = null;

  constructor(options: CacheOptions) {
    this.cacheDir = options.cacheDir;
    this.indexPath = join(this.cacheDir, INDEX_FILE);
    this.entriesDir = join(this.cacheDir, ENTRIES_DIR);
    this.metadataPath = join(this.cacheDir, 'metadata.json');
    this.verbose = options.verbose ?? false;
    this.policies = options.invalidationPolicies ?? [];
  }

  /**
   * Initialize cache directory and load index
   */
  private ensureInitialized(): void {
    if (this.index !== null) return;

    // Create cache directories if needed
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
    if (!existsSync(this.entriesDir)) {
      mkdirSync(this.entriesDir, { recursive: true });
    }

    // Load or create index
    if (existsSync(this.indexPath)) {
      try {
        const data = readFileSync(this.indexPath, 'utf-8');
        this.index = JSON.parse(data) as CacheIndex;

        // Check version compatibility
        if (this.index.version !== CACHE_VERSION) {
          if (this.verbose) {
            logger.warn(`Cache version mismatch (${this.index.version} vs ${CACHE_VERSION}), clearing cache`);
          }
          this.clearSync();
          this.index = { version: CACHE_VERSION, entries: {} };
        }
      } catch {
        if (this.verbose) {
          logger.warn('Failed to load cache index, creating new one');
        }
        this.index = { version: CACHE_VERSION, entries: {} };
      }
    } else {
      this.index = { version: CACHE_VERSION, entries: {} };
    }

    // Load metadata
    this.loadMetadata();
  }

  /**
   * Load cache metadata from disk
   */
  private loadMetadata(): void {
    if (existsSync(this.metadataPath)) {
      try {
        const data = readFileSync(this.metadataPath, 'utf-8');
        this.metadata = JSON.parse(data) as CacheMetadata;
      } catch {
        this.metadata = {};
      }
    } else {
      this.metadata = {};
    }
  }

  /**
   * Save cache metadata to disk
   */
  private saveMetadata(): void {
    if (!this.metadata) return;

    try {
      writeFileSync(this.metadataPath, JSON.stringify(this.metadata, null, 2), 'utf-8');
    } catch (error) {
      if (this.verbose) {
        logger.error(`Failed to save cache metadata: ${error}`);
      }
    }
  }

  /**
   * Update cache metadata
   */
  updateMetadata(updates: Partial<CacheMetadata>): void {
    this.ensureInitialized();
    this.metadata = { ...this.metadata, ...updates };
    this.saveMetadata();
  }

  /**
   * Get current cache metadata
   */
  getMetadata(): CacheMetadata {
    this.ensureInitialized();
    return { ...this.metadata! };
  }

  /**
   * Apply all configured invalidation policies
   * @returns Number of entries invalidated
   */
  applyPolicies(context: InvalidationContext): number {
    this.ensureInitialized();

    if (this.policies.length === 0) {
      return 0;
    }

    let totalInvalidated = 0;

    for (const policy of this.policies) {
      const result = policy.check({
        ...context,
        previousGlossaryHash: this.metadata?.glossaryHash,
        currentTime: context.currentTime ?? new Date(),
      });

      if (!result.shouldInvalidate) {
        continue;
      }

      if (this.verbose) {
        logger.info(`Applying ${policy.name}: ${result.reason}`);
      }

      if (result.scope === 'all') {
        const count = Object.keys(this.index!.entries).length;
        this.clear();
        totalInvalidated += count;
        break; // No need to check other policies after full clear
      }

      if (result.scope === 'matching' && result.filter) {
        const invalidated = this.invalidateMatching(result.filter);
        totalInvalidated += invalidated;
      }
    }

    // Update metadata after applying policies
    if (context.glossaryHash) {
      this.metadata!.glossaryHash = context.glossaryHash;
    }
    if (context.provider) {
      this.metadata!.provider = context.provider;
    }
    if (context.model) {
      this.metadata!.model = context.model;
    }
    if (totalInvalidated > 0) {
      this.metadata!.lastInvalidation = new Date().toISOString();
    }
    this.saveMetadata();

    return totalInvalidated;
  }

  /**
   * Invalidate entries matching a filter function
   * @returns Number of entries invalidated
   */
  invalidateMatching(filter: (entry: CacheEntry, key: string) => boolean): number {
    this.ensureInitialized();

    const keysToDelete: string[] = [];

    for (const [key, entry] of Object.entries(this.index!.entries)) {
      if (filter(entry, key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      // Remove entry file
      const entryPath = join(this.entriesDir, `${key}.json`);
      try {
        if (existsSync(entryPath)) {
          rmSync(entryPath);
        }
      } catch {
        // Ignore file deletion errors
      }

      // Remove from index
      delete this.index!.entries[key];
    }

    if (keysToDelete.length > 0) {
      this.saveIndex();
      if (this.verbose) {
        logger.info(`Invalidated ${keysToDelete.length} cache entries`);
      }
    }

    return keysToDelete.length;
  }

  /**
   * Add an invalidation policy at runtime
   */
  addPolicy(policy: InvalidationPolicy): void {
    this.policies.push(policy);
  }

  /**
   * Remove an invalidation policy by name
   */
  removePolicy(name: string): boolean {
    const index = this.policies.findIndex((p) => p.name === name);
    if (index !== -1) {
      this.policies.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all configured policies
   */
  getPolicies(): InvalidationPolicy[] {
    return [...this.policies];
  }

  /**
   * Save index to disk
   */
  private saveIndex(): void {
    if (!this.index) return;

    try {
      const dir = dirname(this.indexPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2), 'utf-8');
    } catch (error) {
      if (this.verbose) {
        logger.error(`Failed to save cache index: ${error}`);
      }
    }
  }

  /**
   * Get cached translation if available
   */
  get(key: CacheKey): CacheResult {
    this.ensureInitialized();

    const cacheKey = generateCacheKey(key);
    const entry = this.index!.entries[cacheKey];

    if (entry) {
      // Verify the entry file exists
      const entryPath = join(this.entriesDir, `${cacheKey}.json`);
      if (existsSync(entryPath)) {
        if (this.verbose) {
          logger.info(`Cache hit: ${cacheKey.slice(0, 20)}...`);
        }
        return { hit: true, entry };
      } else {
        // Entry in index but file missing, remove from index
        delete this.index!.entries[cacheKey];
        this.saveIndex();
      }
    }

    if (this.verbose) {
      logger.debug(`Cache miss: ${cacheKey.slice(0, 20)}...`);
    }
    return { hit: false };
  }

  /**
   * Store translation in cache
   */
  set(key: CacheKey, translation: string, qualityScore: number): void {
    this.ensureInitialized();

    const cacheKey = generateCacheKey(key);
    const contentHash = hashContent(key.content);
    const glossaryHash = key.glossary ? hashContent(key.glossary) : '';

    const entry: CacheEntry = {
      sourceHash: contentHash,
      sourceLang: key.sourceLang,
      targetLang: key.targetLang,
      glossaryHash,
      translation,
      qualityScore,
      createdAt: new Date().toISOString(),
      provider: key.provider,
      model: key.model,
    };

    // Save entry file
    const entryPath = join(this.entriesDir, `${cacheKey}.json`);
    try {
      writeFileSync(entryPath, JSON.stringify(entry, null, 2), 'utf-8');

      // Update index
      this.index!.entries[cacheKey] = entry;
      this.saveIndex();

      if (this.verbose) {
        logger.info(`Cached: ${cacheKey.slice(0, 20)}...`);
      }
    } catch (error) {
      if (this.verbose) {
        logger.error(`Failed to cache entry: ${error}`);
      }
    }
  }

  /**
   * Check if entry exists in cache
   */
  has(key: CacheKey): boolean {
    return this.get(key).hit;
  }

  /**
   * Remove entry from cache
   */
  delete(key: CacheKey): boolean {
    this.ensureInitialized();

    const cacheKey = generateCacheKey(key);

    if (this.index!.entries[cacheKey]) {
      // Remove entry file
      const entryPath = join(this.entriesDir, `${cacheKey}.json`);
      try {
        if (existsSync(entryPath)) {
          rmSync(entryPath);
        }
      } catch {
        // Ignore file deletion errors
      }

      // Remove from index
      delete this.index!.entries[cacheKey];
      this.saveIndex();

      return true;
    }

    return false;
  }

  /**
   * Clear entire cache (synchronous)
   */
  private clearSync(): void {
    try {
      if (existsSync(this.entriesDir)) {
        rmSync(this.entriesDir, { recursive: true, force: true });
      }
      if (existsSync(this.indexPath)) {
        rmSync(this.indexPath);
      }
      mkdirSync(this.entriesDir, { recursive: true });
    } catch {
      // Ignore errors during clear
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.clearSync();
    this.index = { version: CACHE_VERSION, entries: {} };
    this.saveIndex();

    if (this.verbose) {
      logger.info('Cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.ensureInitialized();

    let sizeBytes = 0;

    // Calculate size of all entry files
    if (existsSync(this.entriesDir)) {
      try {
        const files = readdirSync(this.entriesDir);
        for (const file of files) {
          const filePath = join(this.entriesDir, file);
          try {
            const stat = statSync(filePath);
            sizeBytes += stat.size;
          } catch {
            // Ignore stat errors
          }
        }
      } catch {
        // Ignore read errors
      }
    }

    // Add index file size
    if (existsSync(this.indexPath)) {
      try {
        const stat = statSync(this.indexPath);
        sizeBytes += stat.size;
      } catch {
        // Ignore stat errors
      }
    }

    return {
      entries: Object.keys(this.index?.entries ?? {}).length,
      sizeBytes,
      version: CACHE_VERSION,
    };
  }

  /**
   * Get all cached entries (for debugging)
   */
  getAllEntries(): Record<string, CacheEntry> {
    this.ensureInitialized();
    return { ...this.index!.entries };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a cache manager instance
 */
export function createCacheManager(options: CacheOptions): CacheManager {
  return new CacheManager(options);
}

/**
 * Create a no-op cache manager that never caches (for --no-cache mode)
 */
export function createNullCacheManager(): CacheManager & { isNull: true } {
  const nullManager = {
    isNull: true as const,
    get: () => ({ hit: false }),
    set: () => {},
    has: () => false,
    delete: () => false,
    clear: () => {},
    getStats: () => ({ entries: 0, sizeBytes: 0, version: CACHE_VERSION }),
    getAllEntries: () => ({}),
    updateMetadata: () => {},
    getMetadata: () => ({}),
    applyPolicies: () => 0,
    invalidateMatching: () => 0,
    addPolicy: () => {},
    removePolicy: () => false,
    getPolicies: () => [],
  };

  return nullManager as unknown as CacheManager & { isNull: true };
}

// ============================================================================
// Preset Policy Configurations
// ============================================================================

/**
 * Create default invalidation policies for typical translation workflow
 */
export function createDefaultPolicies(): InvalidationPolicy[] {
  return [
    new GlossaryChangePolicy('all'),
    TTLPolicy.days(30),
  ];
}

/**
 * Create strict invalidation policies (more aggressive invalidation)
 */
export function createStrictPolicies(qualityThreshold: number = 85): InvalidationPolicy[] {
  return [
    new GlossaryChangePolicy('all'),
    new ProviderChangePolicy(true),
    new QualityThresholdPolicy(qualityThreshold),
    TTLPolicy.days(7),
  ];
}

/**
 * Create minimal invalidation policies (only glossary changes)
 */
export function createMinimalPolicies(): InvalidationPolicy[] {
  return [
    new GlossaryChangePolicy('matching'),
  ];
}
