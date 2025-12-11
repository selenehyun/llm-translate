import { describe, it, expect } from 'vitest';
import {
  resolveGlossary,
  createGlossaryLookup,
  checkGlossaryCompliance,
} from '../../src/services/glossary.js';
import type { Glossary } from '../../src/types/index.js';

const testGlossary: Glossary = {
  metadata: {
    name: 'Test Glossary',
    sourceLang: 'en',
    targetLangs: ['ko', 'ja'],
    version: '1.0.0',
  },
  terms: [
    {
      source: 'machine learning',
      targets: { ko: '머신러닝', ja: '機械学習' },
    },
    {
      source: 'API',
      targets: {},
      doNotTranslate: true,
    },
    {
      source: 'neural network',
      targets: { ko: '신경망', ja: 'ニューラルネットワーク' },
      caseSensitive: false,
    },
    {
      source: 'SDK',
      targets: { ko: 'SDK', ja: 'SDK' },
      doNotTranslateFor: ['ko', 'ja'],
    },
  ],
};

describe('resolveGlossary', () => {
  it('should resolve glossary for Korean target language', () => {
    const resolved = resolveGlossary(testGlossary, 'ko');

    expect(resolved.metadata.targetLang).toBe('ko');
    expect(resolved.terms).toHaveLength(4);

    const mlTerm = resolved.terms.find((t) => t.source === 'machine learning');
    expect(mlTerm?.target).toBe('머신러닝');
  });

  it('should handle doNotTranslate terms', () => {
    const resolved = resolveGlossary(testGlossary, 'ko');

    const apiTerm = resolved.terms.find((t) => t.source === 'API');
    expect(apiTerm?.target).toBe('API');
    expect(apiTerm?.doNotTranslate).toBe(true);
  });

  it('should handle doNotTranslateFor specific languages', () => {
    const resolved = resolveGlossary(testGlossary, 'ko');

    const sdkTerm = resolved.terms.find((t) => t.source === 'SDK');
    expect(sdkTerm?.target).toBe('SDK');
    expect(sdkTerm?.doNotTranslate).toBe(true);
  });
});

describe('createGlossaryLookup', () => {
  it('should find exact term matches', () => {
    const resolved = resolveGlossary(testGlossary, 'ko');
    const lookup = createGlossaryLookup(resolved);

    const term = lookup.find('machine learning');
    expect(term?.source).toBe('machine learning');
    expect(term?.target).toBe('머신러닝');
  });

  it('should handle case-insensitive lookup', () => {
    const resolved = resolveGlossary(testGlossary, 'ko');
    const lookup = createGlossaryLookup(resolved);

    const term = lookup.find('Neural Network');
    expect(term?.source).toBe('neural network');
    expect(term?.target).toBe('신경망');
  });

  it('should find all matching terms in text', () => {
    const resolved = resolveGlossary(testGlossary, 'ko');
    const lookup = createGlossaryLookup(resolved);

    const text = 'Learn about machine learning and neural network using our API.';
    const matches = lookup.findAll(text);

    expect(matches).toHaveLength(3);
    expect(matches.map((m) => m.source)).toContain('machine learning');
    expect(matches.map((m) => m.source)).toContain('neural network');
    expect(matches.map((m) => m.source)).toContain('API');
  });

  it('should format glossary for prompt injection', () => {
    const resolved = resolveGlossary(testGlossary, 'ko');
    const lookup = createGlossaryLookup(resolved);

    const formatted = lookup.formatForPrompt();

    expect(formatted).toContain('"machine learning" → "머신러닝"');
    expect(formatted).toContain('[DO NOT TRANSLATE, keep as-is]');
  });
});

describe('checkGlossaryCompliance', () => {
  it('should detect applied glossary terms', () => {
    const resolved = resolveGlossary(testGlossary, 'ko');

    const source = 'Machine learning is a field of artificial intelligence.';
    const translation = '머신러닝은 인공지능의 한 분야입니다.';

    const result = checkGlossaryCompliance(source, translation, resolved);

    expect(result.applied).toContain('machine learning');
    expect(result.score).toBe(100);
  });

  it('should detect missed glossary terms', () => {
    const resolved = resolveGlossary(testGlossary, 'ko');

    const source = 'Machine learning uses neural networks.';
    const translation = '기계 학습은 뉴럴 네트워크를 사용합니다.'; // Wrong translations

    const result = checkGlossaryCompliance(source, translation, resolved);

    expect(result.missed).toContain('machine learning');
    expect(result.missed).toContain('neural network');
    expect(result.score).toBe(0);
  });

  it('should return 100% for text without glossary terms', () => {
    const resolved = resolveGlossary(testGlossary, 'ko');

    const source = 'Hello world!';
    const translation = '안녕하세요!';

    const result = checkGlossaryCompliance(source, translation, resolved);

    expect(result.score).toBe(100);
  });
});
