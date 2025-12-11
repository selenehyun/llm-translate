import { describe, it, expect } from 'vitest';
import {
  estimateTokens,
  exceedsTokenLimit,
  truncateToTokenLimit,
} from '../../src/utils/tokens.js';

describe('estimateTokens', () => {
  it('should return 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('should estimate tokens for English text', () => {
    const text = 'Hello world, this is a test sentence for token estimation.';
    const tokens = estimateTokens(text);

    // ~60 characters, ~4 chars/token = ~15 tokens
    expect(tokens).toBeGreaterThan(10);
    expect(tokens).toBeLessThan(25);
  });

  it('should estimate tokens for Korean text', () => {
    const text = '안녕하세요. 이것은 토큰 추정을 위한 테스트 문장입니다.';
    const tokens = estimateTokens(text);

    // CJK characters are ~1.5 chars/token, so higher token count
    expect(tokens).toBeGreaterThan(15);
  });

  it('should estimate tokens for mixed text', () => {
    const text = 'Hello 세계! This is 테스트입니다.';
    const tokens = estimateTokens(text);

    expect(tokens).toBeGreaterThan(5);
  });

  it('should handle code snippets', () => {
    const code = `function hello() {
  console.log("Hello, World!");
}`;
    const tokens = estimateTokens(code);

    expect(tokens).toBeGreaterThan(10);
    expect(tokens).toBeLessThan(50);
  });
});

describe('exceedsTokenLimit', () => {
  it('should return false when under limit', () => {
    const text = 'Short text';
    expect(exceedsTokenLimit(text, 100)).toBe(false);
  });

  it('should return true when over limit', () => {
    const text = 'a'.repeat(1000); // ~250 tokens
    expect(exceedsTokenLimit(text, 100)).toBe(true);
  });
});

describe('truncateToTokenLimit', () => {
  it('should return original text when under limit', () => {
    const text = 'Short text';
    expect(truncateToTokenLimit(text, 100)).toBe(text);
  });

  it('should truncate text when over limit', () => {
    const text = 'a'.repeat(1000); // ~250 tokens
    const truncated = truncateToTokenLimit(text, 50);

    expect(truncated.length).toBeLessThan(text.length);
    expect(truncated.endsWith('...')).toBe(true);
  });

  it('should preserve approximately the requested token count', () => {
    const text = 'This is a longer piece of text that should be truncated to fit within the token limit.';
    const truncated = truncateToTokenLimit(text, 10);

    const estimatedTokens = estimateTokens(truncated);
    expect(estimatedTokens).toBeLessThanOrEqual(15); // Some margin for the ellipsis
  });
});
