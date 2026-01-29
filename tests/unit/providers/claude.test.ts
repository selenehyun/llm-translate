import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClaudeProvider, createClaudeProvider } from '../../../src/providers/claude.js';
import { TranslationError, ErrorCode } from '../../../src/errors.js';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock the @ai-sdk/anthropic module
vi.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: vi.fn(() => vi.fn()),
}));

// Mock the ai module
vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
}));

// Import after mocking
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';

// ============================================================================
// Tests
// ============================================================================

describe('ClaudeProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create provider with API key from env', () => {
      const provider = new ClaudeProvider();

      expect(provider.name).toBe('claude');
      expect(provider.defaultModel).toBe('claude-haiku-4-5-20251001');
      expect(createAnthropic).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        baseURL: undefined,
      });
    });

    it('should create provider with explicit API key', () => {
      const provider = new ClaudeProvider({ apiKey: 'explicit-key' });

      expect(createAnthropic).toHaveBeenCalledWith({
        apiKey: 'explicit-key',
        baseURL: undefined,
      });
    });

    it('should use custom base URL', () => {
      const provider = new ClaudeProvider({
        apiKey: 'key',
        baseUrl: 'https://custom.api.com',
      });

      expect(createAnthropic).toHaveBeenCalledWith({
        apiKey: 'key',
        baseURL: 'https://custom.api.com',
      });
    });

    it('should use custom default model', () => {
      const provider = new ClaudeProvider({
        apiKey: 'key',
        defaultModel: 'claude-sonnet-4-20250514',
      });

      expect(provider.defaultModel).toBe('claude-sonnet-4-20250514');
    });

    it('should throw error when API key is missing', () => {
      delete process.env['ANTHROPIC_API_KEY'];

      expect(() => new ClaudeProvider()).toThrow(TranslationError);
      expect(() => new ClaudeProvider()).toThrow(/API key/i);
    });
  });

  describe('chat', () => {
    it('should call generateText with correct parameters', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'Translated text',
        usage: { promptTokens: 100, completionTokens: 50 },
        finishReason: 'stop',
        providerMetadata: {},
      } as unknown as Awaited<ReturnType<typeof generateText>>);

      const provider = new ClaudeProvider({ apiKey: 'key' });
      const result = await provider.chat({
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(result.content).toBe('Translated text');
      expect(result.usage.inputTokens).toBe(100);
      expect(result.usage.outputTokens).toBe(50);
      expect(result.finishReason).toBe('stop');
    });

    it('should use specified model', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'Response',
        usage: { promptTokens: 10, completionTokens: 10 },
        finishReason: 'stop',
        providerMetadata: {},
      } as unknown as Awaited<ReturnType<typeof generateText>>);

      const provider = new ClaudeProvider({ apiKey: 'key' });
      await provider.chat({
        messages: [{ role: 'user', content: 'Test' }],
        model: 'claude-sonnet-4-20250514',
      });

      expect(generateText).toHaveBeenCalled();
    });

    it('should handle cache token metadata', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'Response',
        usage: { promptTokens: 100, completionTokens: 50 },
        finishReason: 'stop',
        providerMetadata: {
          anthropic: {
            cacheReadInputTokens: 500,
            cacheCreationInputTokens: 200,
          },
        },
      } as unknown as Awaited<ReturnType<typeof generateText>>);

      const provider = new ClaudeProvider({ apiKey: 'key' });
      const result = await provider.chat({
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(result.usage.cacheReadTokens).toBe(500);
      expect(result.usage.cacheWriteTokens).toBe(200);
    });

    it('should convert messages with cache control', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'Response',
        usage: { promptTokens: 10, completionTokens: 10 },
        finishReason: 'stop',
        providerMetadata: {},
      } as unknown as Awaited<ReturnType<typeof generateText>>);

      const provider = new ClaudeProvider({ apiKey: 'key' });
      await provider.chat({
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Cached content', cacheControl: { type: 'ephemeral' } },
            { type: 'text', text: 'Dynamic content' },
          ],
        }],
      });

      expect(generateText).toHaveBeenCalled();
    });

    it('should handle rate limit errors', async () => {
      vi.mocked(generateText).mockRejectedValue(new Error('rate_limit exceeded'));

      const provider = new ClaudeProvider({ apiKey: 'key' });

      await expect(provider.chat({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow(TranslationError);
    });

    it('should handle auth errors', async () => {
      vi.mocked(generateText).mockRejectedValue(new Error('invalid_api_key'));

      const provider = new ClaudeProvider({ apiKey: 'key' });

      await expect(provider.chat({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow(TranslationError);
    });
  });

  describe('stream', () => {
    it('should yield text chunks', async () => {
      const mockTextStream = {
        async *[Symbol.asyncIterator]() {
          yield 'Hello ';
          yield 'World';
        },
      };

      vi.mocked(streamText).mockReturnValue({
        textStream: mockTextStream,
      } as unknown as ReturnType<typeof streamText>);

      const provider = new ClaudeProvider({ apiKey: 'key' });
      const chunks: string[] = [];

      for await (const chunk of provider.stream({
        messages: [{ role: 'user', content: 'Test' }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello ', 'World']);
    });
  });

  describe('countTokens', () => {
    it('should return estimated token count', () => {
      const provider = new ClaudeProvider({ apiKey: 'key' });
      const count = provider.countTokens('This is a test sentence.');

      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });
  });

  describe('getModelInfo', () => {
    it('should return model info for known model', () => {
      const provider = new ClaudeProvider({ apiKey: 'key' });
      const info = provider.getModelInfo('claude-sonnet-4-20250514');

      expect(info.maxContextTokens).toBe(200000);
      expect(info.supportsStreaming).toBe(true);
    });

    it('should return default info for unknown model', () => {
      const provider = new ClaudeProvider({ apiKey: 'key' });
      const info = provider.getModelInfo('unknown-model');

      expect(info.maxContextTokens).toBe(200000);
      expect(info.supportsStreaming).toBe(true);
    });

    it('should return info for default model when no model specified', () => {
      const provider = new ClaudeProvider({ apiKey: 'key' });
      const info = provider.getModelInfo();

      expect(info).toBeDefined();
      expect(info.maxContextTokens).toBeGreaterThan(0);
    });
  });
});

describe('createClaudeProvider', () => {
  beforeEach(() => {
    process.env['ANTHROPIC_API_KEY'] = 'test-key';
  });

  it('should create provider instance', () => {
    const provider = createClaudeProvider({ apiKey: 'key' });

    expect(provider).toBeInstanceOf(ClaudeProvider);
    expect(provider.name).toBe('claude');
  });
});
