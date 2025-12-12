import { describe, it, expect } from 'vitest';
import {
  parseMarkdown,
  applyTranslations,
  getTranslatableText,
  createTranslationMap,
  extractTextForTranslation,
  restorePreservedSections,
} from '../../src/parsers/markdown.js';

describe('parseMarkdown', () => {
  it('should parse simple markdown content', async () => {
    const content = '# Hello World\n\nThis is a paragraph.';
    const doc = await parseMarkdown(content);

    expect(doc.original).toBe(content);
    expect(doc.ast).toBeDefined();
    expect(doc.textNodes.length).toBeGreaterThan(0);
  });

  it('should identify text nodes as translatable', async () => {
    const content = 'This is translatable text.';
    const doc = await parseMarkdown(content);

    const translatableNodes = doc.textNodes.filter(n => n.translatable);
    expect(translatableNodes.length).toBeGreaterThan(0);
  });

  it('should mark code blocks as non-translatable', async () => {
    const content = '```javascript\nconst x = 1;\n```';
    const doc = await parseMarkdown(content);

    const codeNodes = doc.textNodes.filter(n => n.type === 'code');
    expect(codeNodes.every(n => !n.translatable)).toBe(true);
  });

  it('should mark inline code as non-translatable', async () => {
    const content = 'Use the `console.log()` function.';
    const doc = await parseMarkdown(content);

    const inlineCodeNodes = doc.textNodes.filter(n => n.type === 'inlineCode');
    expect(inlineCodeNodes.every(n => !n.translatable)).toBe(true);
  });
});

describe('getTranslatableText', () => {
  it('should return only translatable text', async () => {
    const content = '# Title\n\nSome text.\n\n```code\nblock\n```\n\nMore text.';
    const doc = await parseMarkdown(content);
    const texts = getTranslatableText(doc);

    expect(texts.length).toBeGreaterThan(0);
    expect(texts.some(t => t.includes('Title'))).toBe(true);
    expect(texts.some(t => t.includes('Some text'))).toBe(true);
  });
});

describe('createTranslationMap', () => {
  it('should create map from translations array', async () => {
    const content = 'Hello. World.';
    const doc = await parseMarkdown(content);
    const translatableTexts = getTranslatableText(doc);
    const translations = translatableTexts.map(t => `[TRANSLATED] ${t}`);

    const map = createTranslationMap(doc, translations);

    expect(Object.keys(map).length).toBe(translatableTexts.length);
  });
});

describe('applyTranslations', () => {
  it('should apply translations to document', async () => {
    const content = 'Hello World';
    const doc = await parseMarkdown(content);

    const translatableNodes = doc.textNodes.filter(n => n.translatable);
    const map: Record<string, string> = {};
    for (const node of translatableNodes) {
      map[node.id] = '안녕하세요 세계';
    }

    const result = await applyTranslations(doc, map);
    expect(result).toContain('안녕하세요');
  });
});

describe('extractTextForTranslation', () => {
  it('should preserve code blocks with placeholders', () => {
    const content = 'Before code\n\n```js\nconst x = 1;\n```\n\nAfter code';
    const { text, preservedSections } = extractTextForTranslation(content);

    expect(text).toContain('Before code');
    expect(text).toContain('After code');
    expect(text).toContain('__CODE_BLOCK_');
    expect(text).not.toContain('const x = 1');
    expect(preservedSections.size).toBeGreaterThan(0);
  });

  it('should preserve inline code with placeholders', () => {
    const content = 'Use `npm install` to install.';
    const { text, preservedSections } = extractTextForTranslation(content);

    expect(text).toContain('Use');
    expect(text).toContain('to install');
    expect(text).toContain('__INLINE_CODE_');
    expect(text).not.toContain('`npm install`');
    expect(preservedSections.size).toBe(1);
  });

  it('should preserve URLs in links with placeholders', () => {
    const content = 'Visit [our site](https://example.com) for more.';
    const { text, preservedSections } = extractTextForTranslation(content);

    expect(text).toContain('[our site]');
    expect(text).toContain('__LINK_URL_');
    expect(text).not.toContain('https://example.com');

    // URL should be in preserved sections
    const urls = Array.from(preservedSections.values());
    expect(urls.some(u => u.includes('example.com'))).toBe(true);
  });

  it('should handle multiple code blocks', () => {
    const content = `\`\`\`python
print("hello")
\`\`\`

Some text

\`\`\`javascript
console.log("world");
\`\`\``;

    const { text, preservedSections } = extractTextForTranslation(content);

    expect(text).toContain('Some text');
    expect(preservedSections.size).toBe(2);
  });
});

describe('restorePreservedSections', () => {
  it('should restore code blocks from placeholders', () => {
    const content = 'Text with ```js\ncode\n```';
    const { text, preservedSections } = extractTextForTranslation(content);

    // Simulate translation (keep placeholders)
    const translated = text.replace('Text with', '텍스트와 함께');
    const restored = restorePreservedSections(translated, preservedSections);

    expect(restored).toContain('텍스트와 함께');
    expect(restored).toContain('```js');
    expect(restored).toContain('code');
  });

  it('should restore URLs in links', () => {
    const content = 'Check [this link](https://test.com).';
    const { text, preservedSections } = extractTextForTranslation(content);

    const translated = text.replace('Check', '확인하세요').replace('this link', '이 링크');
    const restored = restorePreservedSections(translated, preservedSections);

    expect(restored).toContain('확인하세요');
    expect(restored).toContain('[이 링크]');
    expect(restored).toContain('https://test.com');
  });

  it('should handle empty preserved sections', () => {
    const text = 'Simple text without code';
    const preserved = new Map<string, string>();

    const result = restorePreservedSections(text, preserved);
    expect(result).toBe(text);
  });

  it('should ensure proper spacing around inline code after restoration', () => {
    // Simulate a case where LLM removed spaces around placeholder
    const content = '1. Scan your `./docs` directory';
    const { text, preservedSections } = extractTextForTranslation(content);

    // Simulate LLM translation that removes spaces around placeholder
    // Original: "1. Scan your __INLINE_CODE_0__ directory"
    // LLM might produce: "1.__INLINE_CODE_0__디렉토리를 스캔합니다"
    const translatedWithoutSpaces = text
      .replace('1. Scan your ', '1.')
      .replace(' directory', '디렉토리를 스캔합니다');

    const restored = restorePreservedSections(translatedWithoutSpaces, preservedSections);

    // Should have proper spacing around inline code
    expect(restored).toContain('1. `./docs`');  // Space before backtick
    expect(restored).toContain('`./docs` 디렉토리');  // Space after backtick
  });

  it('should add space between Korean text and inline code', () => {
    const preserved = new Map<string, string>();
    preserved.set('__INLINE_CODE_0__', '`code`');

    // Korean text directly touching placeholder
    const translated = '스캔합니다__INLINE_CODE_0__디렉토리';
    const restored = restorePreservedSections(translated, preserved);

    // Should have spaces around inline code
    expect(restored).toBe('스캔합니다 `code` 디렉토리');
  });
});
