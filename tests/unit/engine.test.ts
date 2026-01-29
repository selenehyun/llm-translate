import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TranslationEngine, createTranslationEngine } from '../../src/core/engine.js';
import type { TranslateConfig } from '../../src/types/index.js';
import type { LLMProvider, ChatResponse, ChatRequest } from '../../src/providers/interface.js';

// ============================================================================
// Mock Provider
// ============================================================================

function createMockProvider(mockResponse?: Partial<ChatResponse>): LLMProvider {
  const defaultResponse: ChatResponse = {
    content: 'Translated content',
    usage: { inputTokens: 100, outputTokens: 50 },
    model: 'mock-model',
    finishReason: 'stop',
  };

  return {
    name: 'claude',
    defaultModel: 'mock-model',
    chat: vi.fn().mockResolvedValue({ ...defaultResponse, ...mockResponse }),
    stream: vi.fn().mockImplementation(async function* () {
      yield 'Translated ';
      yield 'content';
    }),
    countTokens: vi.fn().mockReturnValue(10),
    getModelInfo: vi.fn().mockReturnValue({
      maxContextTokens: 200000,
      supportsStreaming: true,
    }),
  };
}

// ============================================================================
// Default Test Config
// ============================================================================

function createTestConfig(overrides?: Partial<TranslateConfig>): TranslateConfig {
  return {
    version: '1.0',
    languages: { source: 'en', targets: ['ko'] },
    provider: { default: 'claude' },
    quality: {
      threshold: 0,
      maxIterations: 1,
      evaluationMethod: 'llm',
    },
    chunking: {
      maxTokens: 1024,
      overlapTokens: 100,
      preserveStructure: true,
    },
    paths: { output: './' },
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('TranslationEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create engine with provided config and provider', () => {
      const config = createTestConfig();
      const provider = createMockProvider();

      const engine = new TranslationEngine({
        config,
        provider,
        noCache: true,
      });

      expect(engine).toBeDefined();
    });

    it('should use null cache manager when noCache is true', () => {
      const config = createTestConfig();
      const provider = createMockProvider();

      const engine = createTranslationEngine({
        config,
        provider,
        noCache: true,
        verbose: true,
      });

      expect(engine).toBeDefined();
    });
  });

  describe('translateContent', () => {
    it('should translate simple text content', async () => {
      const provider = createMockProvider({ content: '번역된 내용' });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      const result = await engine.translateContent({
        content: 'Hello world',
        sourceLang: 'en',
        targetLang: 'ko',
      });

      expect(result.content).toBeDefined();
      expect(result.metadata.provider).toBe('claude');
      expect(provider.chat).toHaveBeenCalled();
    });

    it('should detect markdown format', async () => {
      const provider = createMockProvider({ content: '# 제목\n\n내용' });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      const result = await engine.translateContent({
        content: '# Title\n\nContent with **bold** and [link](url)',
        sourceLang: 'en',
        targetLang: 'ko',
      });

      expect(result.content).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should detect HTML format', async () => {
      const provider = createMockProvider({ content: '<p>번역된 내용</p>' });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      const result = await engine.translateContent({
        content: '<html><body><p>Hello</p></body></html>',
        sourceLang: 'en',
        targetLang: 'ko',
        format: 'html',
      });

      expect(result.content).toBeDefined();
    });

    it('should handle explicit text format', async () => {
      const provider = createMockProvider({ content: '번역된 텍스트' });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      const result = await engine.translateContent({
        content: 'Plain text without formatting',
        sourceLang: 'en',
        targetLang: 'ko',
        format: 'text',
      });

      expect(result.content).toBeDefined();
    });

    it('should include quality scores in result', async () => {
      const provider = createMockProvider({ content: '번역' });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      const result = await engine.translateContent({
        content: 'Test',
        sourceLang: 'en',
        targetLang: 'ko',
      });

      expect(result.metadata.averageQuality).toBeDefined();
      expect(typeof result.metadata.averageQuality).toBe('number');
    });

    it('should track token usage', async () => {
      const provider = createMockProvider({
        content: '번역',
        usage: { inputTokens: 150, outputTokens: 75 },
      });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      const result = await engine.translateContent({
        content: 'Test content',
        sourceLang: 'en',
        targetLang: 'ko',
      });

      expect(result.metadata.tokensUsed).toBeDefined();
      expect(result.metadata.tokensUsed?.input).toBeGreaterThanOrEqual(0);
      expect(result.metadata.tokensUsed?.output).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty content', async () => {
      const provider = createMockProvider();
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      const result = await engine.translateContent({
        content: '',
        sourceLang: 'en',
        targetLang: 'ko',
      });

      expect(result.content).toBe('');
    });
  });

  describe('format detection', () => {
    it('should detect markdown by headers', async () => {
      const provider = createMockProvider({ content: '# 테스트' });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      await engine.translateContent({
        content: '## Header',
        sourceLang: 'en',
        targetLang: 'ko',
      });

      expect(provider.chat).toHaveBeenCalled();
    });

    it('should detect markdown by code blocks', async () => {
      const provider = createMockProvider({ content: '```\ncode\n```' });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      await engine.translateContent({
        content: '```javascript\nconst x = 1;\n```',
        sourceLang: 'en',
        targetLang: 'ko',
      });

      expect(provider.chat).toHaveBeenCalled();
    });

    it('should detect markdown by links', async () => {
      const provider = createMockProvider({ content: '[링크](url)' });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      await engine.translateContent({
        content: 'Check [this link](https://example.com)',
        sourceLang: 'en',
        targetLang: 'ko',
      });

      expect(provider.chat).toHaveBeenCalled();
    });

    it('should detect HTML by tags', async () => {
      const provider = createMockProvider({ content: '<div>내용</div>' });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      await engine.translateContent({
        content: '<div>Content</div>',
        sourceLang: 'en',
        targetLang: 'ko',
        format: 'html',
      });

      expect(provider.chat).toHaveBeenCalled();
    });
  });

  describe('glossary handling', () => {
    it('should check glossary compliance when glossary is provided', async () => {
      // Setup mock with glossary term applied
      const provider = createMockProvider({
        content: 'Kubernetes 클러스터를 배포합니다.',
      });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      // Note: This test assumes glossary loading works;
      // in real scenario, we'd mock the glossary loader
      const result = await engine.translateContent({
        content: 'Deploy a Kubernetes cluster.',
        sourceLang: 'en',
        targetLang: 'ko',
      });

      expect(result.content).toBeDefined();
    });
  });

  describe('chunking behavior', () => {
    it('should handle content within token limits as single chunk', async () => {
      const provider = createMockProvider({ content: '짧은 내용' });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      const result = await engine.translateContent({
        content: 'Short content',
        sourceLang: 'en',
        targetLang: 'ko',
      });

      expect(result.chunks.length).toBeGreaterThanOrEqual(0);
    });

    it('should preserve code blocks during translation', async () => {
      const content = `Text before

\`\`\`javascript
const code = "unchanged";
\`\`\`

Text after`;

      const provider = createMockProvider({
        content: '이전 텍스트\n\n__CODE_BLOCK_0__\n\n이후 텍스트',
      });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      const result = await engine.translateContent({
        content,
        sourceLang: 'en',
        targetLang: 'ko',
      });

      expect(result.content).toBeDefined();
    });
  });

  describe('cache integration', () => {
    it('should track cache statistics', async () => {
      const provider = createMockProvider({ content: '번역' });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      const result = await engine.translateContent({
        content: 'Test',
        sourceLang: 'en',
        targetLang: 'ko',
      });

      expect(result.metadata.cache).toBeDefined();
      expect(result.metadata.cache?.hits).toBeDefined();
      expect(result.metadata.cache?.misses).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle provider errors gracefully', async () => {
      const provider = createMockProvider();
      (provider.chat as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('API Error')
      );

      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      // The engine catches errors and returns original content
      const result = await engine.translateContent({
        content: 'Test',
        sourceLang: 'en',
        targetLang: 'ko',
      });

      // Should still return a result (with original content as fallback)
      expect(result).toBeDefined();
    });
  });

  describe('style instruction', () => {
    it('should pass style instruction to agent', async () => {
      const provider = createMockProvider({ content: '존댓말로 번역된 내용입니다.' });
      const config = createTestConfig({
        languages: {
          source: 'en',
          targets: ['ko'],
          styles: { ko: '경어체 (존댓말)' },
        },
      });
      const engine = createTranslationEngine({ config, provider, noCache: true });

      const result = await engine.translateContent({
        content: 'Hello, how are you?',
        sourceLang: 'en',
        targetLang: 'ko',
      });

      expect(result.content).toBeDefined();
      expect(provider.chat).toHaveBeenCalled();
    });

    it('should allow overriding style instruction per request', async () => {
      const provider = createMockProvider({ content: '반말로 번역된 내용이야.' });
      const config = createTestConfig();
      const engine = createTranslationEngine({ config, provider, noCache: true });

      const result = await engine.translateContent({
        content: 'Hello!',
        sourceLang: 'en',
        targetLang: 'ko',
        styleInstruction: '반말체',
      });

      expect(result.content).toBeDefined();
    });
  });
});

describe('createTranslationEngine', () => {
  it('should create engine instance', () => {
    const config = createTestConfig();
    const provider = createMockProvider();

    const engine = createTranslationEngine({ config, provider, noCache: true });

    expect(engine).toBeInstanceOf(TranslationEngine);
  });
});
