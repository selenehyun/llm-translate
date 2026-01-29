import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TranslationAgent, createTranslationAgent } from '../../src/core/agent.js';
import type { LLMProvider, ChatResponse } from '../../src/providers/interface.js';
import type { TranslationRequest, ResolvedGlossary } from '../../src/types/index.js';
import { TranslationError, ErrorCode } from '../../src/errors.js';

// ============================================================================
// Mock Provider Factory
// ============================================================================

function createMockProvider(responses?: ChatResponse[]): LLMProvider {
  const defaultResponse: ChatResponse = {
    content: 'Translated content',
    usage: { inputTokens: 100, outputTokens: 50 },
    model: 'mock-model',
    finishReason: 'stop',
  };

  let callIndex = 0;
  const mockChat = vi.fn().mockImplementation(() => {
    const response = responses?.[callIndex] ?? defaultResponse;
    callIndex++;
    return Promise.resolve(response);
  });

  return {
    name: 'claude',
    defaultModel: 'mock-model',
    chat: mockChat,
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
// Test Fixtures
// ============================================================================

function createTestRequest(overrides?: Partial<TranslationRequest>): TranslationRequest {
  return {
    content: 'Hello world',
    sourceLang: 'en',
    targetLang: 'ko',
    format: 'text',
    ...overrides,
  };
}

function createTestGlossary(): ResolvedGlossary {
  return {
    terms: [
      { source: 'Kubernetes', target: 'Kubernetes', caseSensitive: true },
      { source: 'cluster', target: '클러스터', caseSensitive: false },
    ],
    sourceLang: 'en',
    targetLang: 'ko',
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('TranslationAgent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create agent with default options', () => {
      const provider = createMockProvider();
      const agent = new TranslationAgent({ provider });

      expect(agent).toBeDefined();
    });

    it('should accept custom quality threshold', () => {
      const provider = createMockProvider();
      const agent = new TranslationAgent({
        provider,
        qualityThreshold: 90,
      });

      expect(agent).toBeDefined();
    });

    it('should accept custom max iterations', () => {
      const provider = createMockProvider();
      const agent = new TranslationAgent({
        provider,
        maxIterations: 5,
      });

      expect(agent).toBeDefined();
    });

    it('should configure translation mode', () => {
      const provider = createMockProvider();
      const agent = new TranslationAgent({
        provider,
        mode: 'quality',
      });

      expect(agent).toBeDefined();
    });
  });

  describe('translate - fast mode', () => {
    it('should skip evaluation in fast mode', async () => {
      const provider = createMockProvider([
        {
          content: '번역된 내용',
          usage: { inputTokens: 100, outputTokens: 50 },
          model: 'mock-model',
          finishReason: 'stop',
        },
      ]);

      const agent = createTranslationAgent({
        provider,
        mode: 'fast',
      });

      const result = await agent.translate(createTestRequest());

      expect(result.content).toBe('번역된 내용');
      expect(result.metadata.iterations).toBe(1);
      // Fast mode only calls chat once (no evaluation)
      expect(provider.chat).toHaveBeenCalledTimes(1);
    });

    it('should return zero quality score in fast mode', async () => {
      const provider = createMockProvider();
      const agent = createTranslationAgent({
        provider,
        mode: 'fast',
      });

      const result = await agent.translate(createTestRequest());

      expect(result.metadata.qualityScore).toBe(0);
      expect(result.metadata.thresholdMet).toBe(true);
    });
  });

  describe('translate - balanced mode', () => {
    it('should evaluate translation quality', async () => {
      const responses: ChatResponse[] = [
        // Initial translation
        {
          content: '번역된 내용',
          usage: { inputTokens: 100, outputTokens: 50 },
          model: 'mock-model',
          finishReason: 'stop',
        },
        // MQM evaluation
        {
          content: JSON.stringify({
            errors: [],
            score: 90,
            summary: 'Good translation',
          }),
          usage: { inputTokens: 50, outputTokens: 30 },
          model: 'mock-model',
          finishReason: 'stop',
        },
      ];

      const provider = createMockProvider(responses);
      const agent = createTranslationAgent({
        provider,
        mode: 'balanced',
        qualityThreshold: 75,
      });

      const result = await agent.translate(createTestRequest());

      expect(result.content).toBe('번역된 내용');
      expect(result.metadata.qualityScore).toBe(90);
      expect(result.metadata.thresholdMet).toBe(true);
    });
  });

  describe('translate - with glossary', () => {
    it('should check glossary compliance', async () => {
      const responses: ChatResponse[] = [
        {
          content: 'Kubernetes 클러스터를 설정합니다.',
          usage: { inputTokens: 100, outputTokens: 50 },
          model: 'mock-model',
          finishReason: 'stop',
        },
      ];

      const provider = createMockProvider(responses);
      const agent = createTranslationAgent({
        provider,
        mode: 'fast',
      });

      const request = createTestRequest({
        content: 'Set up a Kubernetes cluster.',
        glossary: createTestGlossary(),
      });

      const result = await agent.translate(request);

      expect(result.glossaryCompliance).toBeDefined();
      expect(result.glossaryCompliance?.applied).toContain('Kubernetes');
      expect(result.glossaryCompliance?.applied).toContain('cluster');
    });

    it('should detect missed glossary terms', async () => {
      const responses: ChatResponse[] = [
        {
          content: '쿠버네티스 그룹을 설정합니다.',
          usage: { inputTokens: 100, outputTokens: 50 },
          model: 'mock-model',
          finishReason: 'stop',
        },
      ];

      const provider = createMockProvider(responses);
      const agent = createTranslationAgent({
        provider,
        mode: 'fast',
      });

      const request = createTestRequest({
        content: 'Set up a Kubernetes cluster.',
        glossary: createTestGlossary(),
      });

      const result = await agent.translate(request);

      expect(result.glossaryCompliance?.missed).toContain('Kubernetes');
      expect(result.glossaryCompliance?.missed).toContain('cluster');
    });
  });

  describe('translate - self-refine loop', () => {
    it('should refine translation when quality is below threshold', async () => {
      const responses: ChatResponse[] = [
        // Initial translation
        {
          content: '번역 초안',
          usage: { inputTokens: 100, outputTokens: 50 },
          model: 'mock-model',
          finishReason: 'stop',
        },
        // First MQM evaluation (low score)
        {
          content: JSON.stringify({
            errors: [
              { type: 'accuracy/mistranslation', severity: 'major', span: '번역', suggestion: '번역된', explanation: 'Incomplete translation' },
            ],
            score: 60,
            summary: 'Needs improvement',
          }),
          usage: { inputTokens: 50, outputTokens: 30 },
          model: 'mock-model',
          finishReason: 'stop',
        },
        // Refinement
        {
          content: '개선된 번역',
          usage: { inputTokens: 100, outputTokens: 50 },
          model: 'mock-model',
          finishReason: 'stop',
        },
        // Second MQM evaluation (good score)
        {
          content: JSON.stringify({
            errors: [],
            score: 90,
            summary: 'Good translation',
          }),
          usage: { inputTokens: 50, outputTokens: 30 },
          model: 'mock-model',
          finishReason: 'stop',
        },
      ];

      const provider = createMockProvider(responses);
      const agent = createTranslationAgent({
        provider,
        qualityThreshold: 75,
        maxIterations: 3,
        useMQMEvaluation: true,
      });

      const result = await agent.translate(createTestRequest());

      expect(result.content).toBe('개선된 번역');
      expect(result.metadata.iterations).toBeGreaterThan(1);
      expect(result.metadata.qualityScore).toBe(90);
    });

    it('should stop at max iterations even if threshold not met', async () => {
      const lowScoreEvaluation = JSON.stringify({
        errors: [{ type: 'accuracy/mistranslation', severity: 'major', span: 'text', suggestion: 'fix', explanation: 'error' }],
        score: 50,
        summary: 'Needs work',
      });

      const responses: ChatResponse[] = [
        // Initial translation
        { content: '번역1', usage: { inputTokens: 100, outputTokens: 50 }, model: 'mock', finishReason: 'stop' },
        // Evaluation 1
        { content: lowScoreEvaluation, usage: { inputTokens: 50, outputTokens: 30 }, model: 'mock', finishReason: 'stop' },
        // Refinement 1
        { content: '번역2', usage: { inputTokens: 100, outputTokens: 50 }, model: 'mock', finishReason: 'stop' },
        // Evaluation 2 - still low
        { content: lowScoreEvaluation, usage: { inputTokens: 50, outputTokens: 30 }, model: 'mock', finishReason: 'stop' },
      ];

      const provider = createMockProvider(responses);
      const agent = createTranslationAgent({
        provider,
        qualityThreshold: 90,
        maxIterations: 2,
        useMQMEvaluation: true,
      });

      const result = await agent.translate(createTestRequest());

      expect(result.metadata.iterations).toBeLessThanOrEqual(2);
      expect(result.metadata.thresholdMet).toBe(false);
    });
  });

  describe('translate - strict quality mode', () => {
    it('should throw error when quality threshold not met in strict mode', async () => {
      const responses: ChatResponse[] = [
        { content: '번역', usage: { inputTokens: 100, outputTokens: 50 }, model: 'mock', finishReason: 'stop' },
        {
          content: JSON.stringify({ errors: [], score: 60, summary: 'Low quality' }),
          usage: { inputTokens: 50, outputTokens: 30 },
          model: 'mock',
          finishReason: 'stop',
        },
      ];

      const provider = createMockProvider(responses);
      const agent = createTranslationAgent({
        provider,
        qualityThreshold: 90,
        maxIterations: 1,
        strictQuality: true,
        useMQMEvaluation: true,
      });

      await expect(agent.translate(createTestRequest())).rejects.toThrow(TranslationError);
    });
  });

  describe('translate - with analysis (quality mode)', () => {
    it('should perform pre-translation analysis', async () => {
      const responses: ChatResponse[] = [
        // Analysis response
        {
          content: JSON.stringify({
            keyTerms: [{ term: 'world', context: 'greeting', suggestedTranslation: '세계', fromGlossary: false }],
            ambiguousPhrases: [],
            preserveExact: [],
            challenges: ['Cultural greeting differences'],
            domain: 'general',
            registerRecommendation: 'neutral',
          }),
          usage: { inputTokens: 50, outputTokens: 30 },
          model: 'mock',
          finishReason: 'stop',
        },
        // Translation
        { content: '안녕 세계', usage: { inputTokens: 100, outputTokens: 50 }, model: 'mock', finishReason: 'stop' },
        // Evaluation
        {
          content: JSON.stringify({ errors: [], score: 95, summary: 'Excellent' }),
          usage: { inputTokens: 50, outputTokens: 30 },
          model: 'mock',
          finishReason: 'stop',
        },
      ];

      const provider = createMockProvider(responses);
      const agent = createTranslationAgent({
        provider,
        mode: 'quality',
        qualityThreshold: 85,
      });

      const result = await agent.translate(createTestRequest());

      expect(result.content).toBe('안녕 세계');
      // Should have called analysis, translation, and evaluation
      expect(provider.chat).toHaveBeenCalledTimes(3);
    });
  });

  describe('translate - token tracking', () => {
    it('should track total tokens used', async () => {
      const responses: ChatResponse[] = [
        { content: '번역', usage: { inputTokens: 100, outputTokens: 50 }, model: 'mock', finishReason: 'stop' },
      ];

      const provider = createMockProvider(responses);
      const agent = createTranslationAgent({
        provider,
        mode: 'fast',
      });

      const result = await agent.translate(createTestRequest());

      expect(result.metadata.tokensUsed.input).toBe(100);
      expect(result.metadata.tokensUsed.output).toBe(50);
    });

    it('should track cache tokens when available', async () => {
      const responses: ChatResponse[] = [
        {
          content: '번역',
          usage: {
            inputTokens: 100,
            outputTokens: 50,
            cacheReadTokens: 500,
            cacheWriteTokens: 200,
          },
          model: 'mock',
          finishReason: 'stop',
        },
      ];

      const provider = createMockProvider(responses);
      const agent = createTranslationAgent({
        provider,
        mode: 'fast',
      });

      const result = await agent.translate(createTestRequest());

      expect(result.metadata.tokensUsed.cacheRead).toBe(500);
      expect(result.metadata.tokensUsed.cacheWrite).toBe(200);
    });
  });

  describe('translate - output cleaning', () => {
    it('should clean trailing prompt artifacts from output', async () => {
      const responses: ChatResponse[] = [
        {
          content: '번역된 내용\n\n## Evaluation Criteria:',
          usage: { inputTokens: 100, outputTokens: 50 },
          model: 'mock',
          finishReason: 'stop',
        },
      ];

      const provider = createMockProvider(responses);
      const agent = createTranslationAgent({
        provider,
        mode: 'fast',
      });

      const result = await agent.translate(createTestRequest());

      expect(result.content).not.toContain('## Evaluation Criteria');
    });

    it('should preserve whitespace from source', async () => {
      const responses: ChatResponse[] = [
        { content: '번역된 내용', usage: { inputTokens: 100, outputTokens: 50 }, model: 'mock', finishReason: 'stop' },
      ];

      const provider = createMockProvider(responses);
      const agent = createTranslationAgent({
        provider,
        mode: 'fast',
      });

      const request = createTestRequest({
        content: '\n\nHello world\n\n',
      });

      const result = await agent.translate(request);

      expect(result.content.startsWith('\n\n')).toBe(true);
      expect(result.content.endsWith('\n\n')).toBe(true);
    });
  });

  describe('translate - context handling', () => {
    it('should include document context in request', async () => {
      const provider = createMockProvider();
      const agent = createTranslationAgent({
        provider,
        mode: 'fast',
      });

      const request = createTestRequest({
        context: {
          documentPurpose: 'Technical documentation',
          styleInstruction: '경어체',
        },
      });

      await agent.translate(request);

      // Verify chat was called with context included
      expect(provider.chat).toHaveBeenCalled();
      const chatCall = (provider.chat as ReturnType<typeof vi.fn>).mock.calls[0];
      const messages = chatCall?.[0]?.messages;
      expect(messages).toBeDefined();
    });
  });
});

describe('createTranslationAgent', () => {
  it('should create agent instance', () => {
    const provider = createMockProvider();
    const agent = createTranslationAgent({ provider });

    expect(agent).toBeInstanceOf(TranslationAgent);
  });
});
