import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  CacheManager,
  createCacheManager,
  createNullCacheManager,
  hashContent,
  generateCacheKey,
  GlossaryChangePolicy,
  TTLPolicy,
  ProviderChangePolicy,
  QualityThresholdPolicy,
  CompositePolicy,
  createDefaultPolicies,
  createStrictPolicies,
  createMinimalPolicies,
  type CacheKey,
} from '../../src/services/cache.js';

// ============================================================================
// Test Setup
// ============================================================================

const TEST_CACHE_DIR = join(process.cwd(), '.test-cache');

function cleanupTestCache() {
  if (existsSync(TEST_CACHE_DIR)) {
    rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
  }
}

function createTestCacheKey(overrides?: Partial<CacheKey>): CacheKey {
  return {
    content: 'Test content',
    sourceLang: 'en',
    targetLang: 'ko',
    provider: 'claude',
    model: 'test-model',
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('hashContent', () => {
  it('should generate consistent hash for same content', () => {
    const hash1 = hashContent('test content');
    const hash2 = hashContent('test content');
    expect(hash1).toBe(hash2);
  });

  it('should generate different hash for different content', () => {
    const hash1 = hashContent('content 1');
    const hash2 = hashContent('content 2');
    expect(hash1).not.toBe(hash2);
  });

  it('should return 16-character hex string', () => {
    const hash = hashContent('test');
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('generateCacheKey', () => {
  it('should generate unique key for different content', () => {
    const key1 = generateCacheKey(createTestCacheKey({ content: 'content 1' }));
    const key2 = generateCacheKey(createTestCacheKey({ content: 'content 2' }));
    expect(key1).not.toBe(key2);
  });

  it('should generate unique key for different target languages', () => {
    const key1 = generateCacheKey(createTestCacheKey({ targetLang: 'ko' }));
    const key2 = generateCacheKey(createTestCacheKey({ targetLang: 'ja' }));
    expect(key1).not.toBe(key2);
  });

  it('should generate unique key for different providers', () => {
    const key1 = generateCacheKey(createTestCacheKey({ provider: 'claude' }));
    const key2 = generateCacheKey(createTestCacheKey({ provider: 'openai' }));
    expect(key1).not.toBe(key2);
  });

  it('should include glossary hash when provided', () => {
    const key1 = generateCacheKey(createTestCacheKey({ glossary: 'glossary1' }));
    const key2 = generateCacheKey(createTestCacheKey({ glossary: 'glossary2' }));
    expect(key1).not.toBe(key2);
  });

  it('should use "none" for missing glossary', () => {
    const key = generateCacheKey(createTestCacheKey({ glossary: undefined }));
    expect(key).toContain('_none_');
  });
});

describe('CacheManager', () => {
  beforeEach(() => {
    cleanupTestCache();
  });

  afterEach(() => {
    cleanupTestCache();
  });

  describe('initialization', () => {
    it('should create cache directory if not exists', () => {
      const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });
      cache.getStats(); // Trigger initialization
      expect(existsSync(TEST_CACHE_DIR)).toBe(true);
    });

    it('should load existing index on initialization', () => {
      const cache1 = createCacheManager({ cacheDir: TEST_CACHE_DIR });
      const key = createTestCacheKey();
      cache1.set(key, 'translation', 90);

      const cache2 = createCacheManager({ cacheDir: TEST_CACHE_DIR });
      const result = cache2.get(key);
      expect(result.hit).toBe(true);
    });
  });

  describe('get/set operations', () => {
    it('should store and retrieve cache entry', () => {
      const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });
      const key = createTestCacheKey();

      cache.set(key, 'translated content', 95);
      const result = cache.get(key);

      expect(result.hit).toBe(true);
      expect(result.entry?.translation).toBe('translated content');
      expect(result.entry?.qualityScore).toBe(95);
    });

    it('should return miss for non-existent key', () => {
      const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });
      const key = createTestCacheKey();

      const result = cache.get(key);

      expect(result.hit).toBe(false);
      expect(result.entry).toBeUndefined();
    });

    it('should store entry metadata', () => {
      const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });
      const key = createTestCacheKey();

      cache.set(key, 'translation', 90);
      const result = cache.get(key);

      expect(result.entry?.sourceLang).toBe('en');
      expect(result.entry?.targetLang).toBe('ko');
      expect(result.entry?.provider).toBe('claude');
      expect(result.entry?.model).toBe('test-model');
      expect(result.entry?.createdAt).toBeDefined();
    });
  });

  describe('has operation', () => {
    it('should return true for existing entry', () => {
      const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });
      const key = createTestCacheKey();

      cache.set(key, 'translation', 90);

      expect(cache.has(key)).toBe(true);
    });

    it('should return false for non-existent entry', () => {
      const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });
      const key = createTestCacheKey();

      expect(cache.has(key)).toBe(false);
    });
  });

  describe('delete operation', () => {
    it('should delete existing entry', () => {
      const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });
      const key = createTestCacheKey();

      cache.set(key, 'translation', 90);
      const deleted = cache.delete(key);

      expect(deleted).toBe(true);
      expect(cache.has(key)).toBe(false);
    });

    it('should return false when deleting non-existent entry', () => {
      const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });
      const key = createTestCacheKey();

      const deleted = cache.delete(key);

      expect(deleted).toBe(false);
    });
  });

  describe('clear operation', () => {
    it('should clear all entries', () => {
      const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });

      cache.set(createTestCacheKey({ content: 'content1' }), 'translation1', 90);
      cache.set(createTestCacheKey({ content: 'content2' }), 'translation2', 85);

      cache.clear();

      expect(cache.getStats().entries).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct entry count', () => {
      const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });

      cache.set(createTestCacheKey({ content: 'c1' }), 't1', 90);
      cache.set(createTestCacheKey({ content: 'c2' }), 't2', 85);
      cache.set(createTestCacheKey({ content: 'c3' }), 't3', 80);

      const stats = cache.getStats();

      expect(stats.entries).toBe(3);
      expect(stats.version).toBeDefined();
    });

    it('should return size in bytes', () => {
      const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });
      cache.set(createTestCacheKey(), 'translation', 90);

      const stats = cache.getStats();

      expect(stats.sizeBytes).toBeGreaterThan(0);
    });
  });

  describe('metadata operations', () => {
    it('should store and retrieve metadata', () => {
      const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });

      cache.updateMetadata({
        glossaryHash: 'abc123',
        provider: 'claude',
        model: 'test-model',
      });

      const metadata = cache.getMetadata();

      expect(metadata.glossaryHash).toBe('abc123');
      expect(metadata.provider).toBe('claude');
    });

    it('should persist metadata across instances', () => {
      const cache1 = createCacheManager({ cacheDir: TEST_CACHE_DIR });
      cache1.updateMetadata({ glossaryHash: 'hash123' });

      const cache2 = createCacheManager({ cacheDir: TEST_CACHE_DIR });
      const metadata = cache2.getMetadata();

      expect(metadata.glossaryHash).toBe('hash123');
    });
  });

  describe('getAllEntries', () => {
    it('should return all cached entries', () => {
      const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });

      cache.set(createTestCacheKey({ content: 'c1' }), 't1', 90);
      cache.set(createTestCacheKey({ content: 'c2' }), 't2', 85);

      const entries = cache.getAllEntries();

      expect(Object.keys(entries).length).toBe(2);
    });
  });
});

describe('NullCacheManager', () => {
  it('should always return cache miss', () => {
    const cache = createNullCacheManager();
    const key = createTestCacheKey();

    cache.set(key, 'translation', 90);
    const result = cache.get(key);

    expect(result.hit).toBe(false);
  });

  it('should return false for has', () => {
    const cache = createNullCacheManager();
    expect(cache.has(createTestCacheKey())).toBe(false);
  });

  it('should return empty stats', () => {
    const cache = createNullCacheManager();
    const stats = cache.getStats();

    expect(stats.entries).toBe(0);
    expect(stats.sizeBytes).toBe(0);
  });

  it('should have isNull flag', () => {
    const cache = createNullCacheManager();
    expect(cache.isNull).toBe(true);
  });
});

describe('Invalidation Policies', () => {
  describe('GlossaryChangePolicy', () => {
    it('should invalidate all when glossary changes (all mode)', () => {
      const policy = new GlossaryChangePolicy('all');

      const result = policy.check({
        glossaryHash: 'new-hash',
        previousGlossaryHash: 'old-hash',
      });

      expect(result.shouldInvalidate).toBe(true);
      expect(result.scope).toBe('all');
    });

    it('should not invalidate when glossary unchanged', () => {
      const policy = new GlossaryChangePolicy('all');

      const result = policy.check({
        glossaryHash: 'same-hash',
        previousGlossaryHash: 'same-hash',
      });

      expect(result.shouldInvalidate).toBe(false);
    });

    it('should invalidate matching entries only (matching mode)', () => {
      const policy = new GlossaryChangePolicy('matching');

      const result = policy.check({
        glossaryHash: 'new-hash',
        previousGlossaryHash: 'old-hash',
      });

      expect(result.shouldInvalidate).toBe(true);
      expect(result.scope).toBe('matching');
      expect(result.filter).toBeDefined();
    });
  });

  describe('TTLPolicy', () => {
    it('should create policy with hours', () => {
      const policy = TTLPolicy.hours(24);
      expect(policy.name).toBe('TTLPolicy');
    });

    it('should create policy with days', () => {
      const policy = TTLPolicy.days(7);
      expect(policy.name).toBe('TTLPolicy');
    });

    it('should invalidate old entries', () => {
      const policy = TTLPolicy.hours(1);
      const now = new Date();

      const result = policy.check({ currentTime: now });

      expect(result.shouldInvalidate).toBe(true);
      expect(result.filter).toBeDefined();

      // Test filter with old entry
      const oldEntry = {
        sourceHash: 'hash',
        sourceLang: 'en',
        targetLang: 'ko',
        glossaryHash: '',
        translation: 'test',
        qualityScore: 90,
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        provider: 'claude',
        model: 'test',
      };

      expect(result.filter?.(oldEntry, 'key')).toBe(true);
    });

    it('should not invalidate recent entries', () => {
      const policy = TTLPolicy.hours(1);
      const now = new Date();

      const result = policy.check({ currentTime: now });

      const recentEntry = {
        sourceHash: 'hash',
        sourceLang: 'en',
        targetLang: 'ko',
        glossaryHash: '',
        translation: 'test',
        qualityScore: 90,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        provider: 'claude',
        model: 'test',
      };

      expect(result.filter?.(recentEntry, 'key')).toBe(false);
    });
  });

  describe('ProviderChangePolicy', () => {
    it('should invalidate entries with different provider', () => {
      const policy = new ProviderChangePolicy(true);

      const result = policy.check({ provider: 'claude', model: 'test' });

      expect(result.shouldInvalidate).toBe(true);

      const entry = {
        sourceHash: 'hash',
        sourceLang: 'en',
        targetLang: 'ko',
        glossaryHash: '',
        translation: 'test',
        qualityScore: 90,
        createdAt: new Date().toISOString(),
        provider: 'openai',
        model: 'gpt-4',
      };

      expect(result.filter?.(entry, 'key')).toBe(true);
    });

    it('should not invalidate entries with same provider', () => {
      const policy = new ProviderChangePolicy(false);

      const result = policy.check({ provider: 'claude' });

      const entry = {
        sourceHash: 'hash',
        sourceLang: 'en',
        targetLang: 'ko',
        glossaryHash: '',
        translation: 'test',
        qualityScore: 90,
        createdAt: new Date().toISOString(),
        provider: 'claude',
        model: 'test',
      };

      expect(result.filter?.(entry, 'key')).toBe(false);
    });
  });

  describe('QualityThresholdPolicy', () => {
    it('should invalidate entries below threshold', () => {
      const policy = new QualityThresholdPolicy(80);

      const result = policy.check({});

      expect(result.shouldInvalidate).toBe(true);

      const lowQualityEntry = {
        sourceHash: 'hash',
        sourceLang: 'en',
        targetLang: 'ko',
        glossaryHash: '',
        translation: 'test',
        qualityScore: 70,
        createdAt: new Date().toISOString(),
        provider: 'claude',
        model: 'test',
      };

      expect(result.filter?.(lowQualityEntry, 'key')).toBe(true);
    });

    it('should not invalidate entries above threshold', () => {
      const policy = new QualityThresholdPolicy(80);

      const result = policy.check({});

      const highQualityEntry = {
        sourceHash: 'hash',
        sourceLang: 'en',
        targetLang: 'ko',
        glossaryHash: '',
        translation: 'test',
        qualityScore: 90,
        createdAt: new Date().toISOString(),
        provider: 'claude',
        model: 'test',
      };

      expect(result.filter?.(highQualityEntry, 'key')).toBe(false);
    });
  });

  describe('CompositePolicy', () => {
    it('should combine multiple policies (any mode)', () => {
      const policy = new CompositePolicy(
        [new QualityThresholdPolicy(80), TTLPolicy.days(30)],
        'any'
      );

      const result = policy.check({});

      expect(result.shouldInvalidate).toBe(true);
      expect(result.scope).toBe('matching');
    });

    it('should handle all scope taking priority', () => {
      const policy = new CompositePolicy(
        [new GlossaryChangePolicy('all'), new QualityThresholdPolicy(80)],
        'any'
      );

      const result = policy.check({
        glossaryHash: 'new',
        previousGlossaryHash: 'old',
      });

      expect(result.scope).toBe('all');
    });
  });
});

describe('Policy Presets', () => {
  it('should create default policies', () => {
    const policies = createDefaultPolicies();
    expect(policies.length).toBe(2);
  });

  it('should create strict policies', () => {
    const policies = createStrictPolicies(90);
    expect(policies.length).toBe(4);
  });

  it('should create minimal policies', () => {
    const policies = createMinimalPolicies();
    expect(policies.length).toBe(1);
  });
});

describe('CacheManager with policies', () => {
  beforeEach(() => {
    cleanupTestCache();
  });

  afterEach(() => {
    cleanupTestCache();
  });

  it('should apply policies on applyPolicies call', () => {
    const cache = createCacheManager({
      cacheDir: TEST_CACHE_DIR,
      invalidationPolicies: [new QualityThresholdPolicy(80)],
    });

    cache.set(createTestCacheKey({ content: 'c1' }), 't1', 70); // Below threshold
    cache.set(createTestCacheKey({ content: 'c2' }), 't2', 90); // Above threshold

    const invalidated = cache.applyPolicies({});

    expect(invalidated).toBe(1);
    expect(cache.getStats().entries).toBe(1);
  });

  it('should allow adding policies at runtime', () => {
    const cache = createCacheManager({ cacheDir: TEST_CACHE_DIR });

    cache.addPolicy(new QualityThresholdPolicy(80));
    const policies = cache.getPolicies();

    expect(policies.length).toBe(1);
  });

  it('should allow removing policies by name', () => {
    const cache = createCacheManager({
      cacheDir: TEST_CACHE_DIR,
      invalidationPolicies: [new QualityThresholdPolicy(80)],
    });

    const removed = cache.removePolicy('QualityThresholdPolicy');

    expect(removed).toBe(true);
    expect(cache.getPolicies().length).toBe(0);
  });
});
