import { describe, it, expect } from 'vitest';
import {
  parseHTML,
  chunkHTMLSections,
  parseTranslatedChunk,
  applyHTMLTranslations,
  getHTMLStats,
  translateHTMLContent,
} from '../../src/parsers/html.js';

describe('parseHTML', () => {
  it('should parse simple HTML and extract text sections', () => {
    const html = '<div><p>Hello World</p><p>Goodbye World</p></div>';
    const document = parseHTML(html);

    expect(document.sections.length).toBe(2);
    expect(document.sections[0]?.content).toBe('Hello World');
    expect(document.sections[1]?.content).toBe('Goodbye World');
  });

  it('should skip script and style tags', () => {
    const html = `
      <div>
        <script>console.log("ignored")</script>
        <style>.ignored { color: red; }</style>
        <p>Translatable text</p>
      </div>
    `;
    const document = parseHTML(html);

    const translatableContent = document.sections
      .filter((s) => s.translatable)
      .map((s) => s.content.trim());

    expect(translatableContent).not.toContain('console.log("ignored")');
    expect(translatableContent).toContain('Translatable text');
  });

  it('should skip code and pre tags', () => {
    const html = `
      <div>
        <code>const x = 1;</code>
        <pre>function foo() {}</pre>
        <p>Translatable text</p>
      </div>
    `;
    const document = parseHTML(html);

    const translatableContent = document.sections
      .filter((s) => s.translatable)
      .map((s) => s.content.trim());

    expect(translatableContent).not.toContain('const x = 1;');
    expect(translatableContent).not.toContain('function foo() {}');
    expect(translatableContent).toContain('Translatable text');
  });

  it('should extract translatable attributes (alt, title, placeholder)', () => {
    const html = `
      <div>
        <img src="image.png" alt="An image description" title="Image title">
        <input placeholder="Enter your name">
      </div>
    `;
    const document = parseHTML(html);

    const attributeSections = document.sections.filter((s) => s.isAttribute);
    expect(attributeSections.length).toBe(3);

    const altSection = attributeSections.find((s) => s.attributeName === 'alt');
    expect(altSection?.content).toBe('An image description');

    const titleSection = attributeSections.find((s) => s.attributeName === 'title');
    expect(titleSection?.content).toBe('Image title');

    const placeholderSection = attributeSections.find(
      (s) => s.attributeName === 'placeholder'
    );
    expect(placeholderSection?.content).toBe('Enter your name');
  });

  it('should handle full HTML document with html and body tags', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <h1>Heading</h1>
          <p>Paragraph</p>
        </body>
      </html>
    `;
    const document = parseHTML(html);

    expect(document.isFullDocument).toBe(true);
    expect(document.sections.length).toBeGreaterThan(0);
  });

  it('should handle HTML fragments', () => {
    const html = '<p>Just a paragraph</p>';
    const document = parseHTML(html);

    expect(document.isFullDocument).toBe(false);
    expect(document.sections[0]?.content).toBe('Just a paragraph');
  });

  it('should handle nested inline elements', () => {
    const html = '<p>This is <strong>bold</strong> and <em>italic</em> text</p>';
    const document = parseHTML(html);

    // Should capture all text nodes
    expect(document.sections.length).toBeGreaterThan(0);
    const allText = document.sections.map((s) => s.content).join('');
    expect(allText).toContain('This is');
    expect(allText).toContain('bold');
    expect(allText).toContain('italic');
    expect(allText).toContain('text');
  });
});

describe('chunkHTMLSections', () => {
  it('should chunk sections based on token limit', () => {
    const html = `
      <div>
        ${'<p>This is a paragraph with some text. </p>'.repeat(50)}
      </div>
    `;
    const document = parseHTML(html);
    const chunks = chunkHTMLSections(document.sections, { maxTokens: 200 });

    expect(chunks.length).toBeGreaterThan(1);
  });

  it('should include section markers in chunk content', () => {
    const html = '<div><p>First paragraph</p><p>Second paragraph</p></div>';
    const document = parseHTML(html);
    const chunks = chunkHTMLSections(document.sections);

    expect(chunks.length).toBe(1);
    expect(chunks[0]?.content).toContain('[section-0]');
    expect(chunks[0]?.content).toContain('First paragraph');
  });

  it('should return empty array for no translatable sections', () => {
    const html = '<script>console.log("only code")</script>';
    const document = parseHTML(html);
    const chunks = chunkHTMLSections(document.sections);

    expect(chunks.length).toBe(0);
  });
});

describe('parseTranslatedChunk', () => {
  it('should parse translated content back into section translations', () => {
    const html = '<div><p>Hello</p><p>World</p></div>';
    const document = parseHTML(html);
    const chunks = chunkHTMLSections(document.sections);

    const translatedContent = `
[section-0] 안녕하세요

[section-1] 세계
    `;

    const translations = parseTranslatedChunk(chunks[0]!, translatedContent);

    expect(translations['section-0']).toBe('안녕하세요');
    expect(translations['section-1']).toBe('세계');
  });

  it('should handle attribute markers', () => {
    const html = '<img alt="An image" title="Title">';
    const document = parseHTML(html);
    const chunks = chunkHTMLSections(document.sections);

    const translatedContent = `
[section-0:alt] 이미지

[section-1:title] 제목
    `;

    const translations = parseTranslatedChunk(chunks[0]!, translatedContent);

    expect(translations['section-0']).toBe('이미지');
    expect(translations['section-1']).toBe('제목');
  });
});

describe('applyHTMLTranslations', () => {
  it('should apply translations to text nodes', () => {
    const html = '<div><p>Hello</p><p>World</p></div>';
    const document = parseHTML(html);

    const translations = {
      'section-0': '안녕하세요',
      'section-1': '세계',
    };

    const result = applyHTMLTranslations(document, translations);

    expect(result).toContain('안녕하세요');
    expect(result).toContain('세계');
    expect(result).not.toContain('Hello');
    expect(result).not.toContain('World');
  });

  it('should apply translations to attributes', () => {
    const html = '<img src="img.png" alt="An image">';
    const document = parseHTML(html);

    // Find the alt attribute section
    const altSection = document.sections.find(
      (s) => s.isAttribute && s.attributeName === 'alt'
    );

    const translations = {
      [altSection!.id]: '이미지',
    };

    const result = applyHTMLTranslations(document, translations);

    expect(result).toContain('alt="이미지"');
    expect(result).not.toContain('alt="An image"');
  });

  it('should preserve HTML structure', () => {
    const html = '<div class="container"><p id="test">Hello</p></div>';
    const document = parseHTML(html);

    const translations = {
      'section-0': '안녕하세요',
    };

    const result = applyHTMLTranslations(document, translations);

    expect(result).toContain('class="container"');
    expect(result).toContain('id="test"');
    expect(result).toContain('<div');
    expect(result).toContain('<p');
  });
});

describe('getHTMLStats', () => {
  it('should return correct statistics', () => {
    const html = `
      <div>
        <p>Text 1</p>
        <p>Text 2</p>
        <img alt="Image alt">
        <script>ignored</script>
      </div>
    `;
    const document = parseHTML(html);
    const stats = getHTMLStats(document);

    expect(stats.totalSections).toBe(3); // 2 text + 1 alt
    expect(stats.translatableSections).toBe(3);
    expect(stats.attributeSections).toBe(1);
    expect(stats.totalTokens).toBeGreaterThan(0);
  });
});

describe('translateHTMLContent', () => {
  it('should translate HTML content using provided function', async () => {
    const html = '<div><p>Hello World</p></div>';

    const mockTranslate = async (text: string): Promise<string> => {
      // Simple mock that replaces section content
      return text.replace('Hello World', '안녕하세요 세계');
    };

    const result = await translateHTMLContent(html, mockTranslate);

    expect(result).toContain('안녕하세요 세계');
  });

  it('should handle empty HTML', async () => {
    const html = '';
    const mockTranslate = async (text: string): Promise<string> => text;

    const result = await translateHTMLContent(html, mockTranslate);

    expect(result).toBe('');
  });

  it('should preserve script tags', async () => {
    const html = '<div><script>var x = 1;</script><p>Text</p></div>';

    const mockTranslate = async (text: string): Promise<string> => {
      return text.replace('Text', '텍스트');
    };

    const result = await translateHTMLContent(html, mockTranslate);

    expect(result).toContain('var x = 1;');
    expect(result).toContain('<script>');
  });
});

describe('Large HTML document handling', () => {
  it('should handle large HTML with many elements', () => {
    // Generate a large HTML document
    const paragraphs = Array.from(
      { length: 100 },
      (_, i) => `<p>Paragraph ${i + 1} with some content that needs translation.</p>`
    ).join('\n');

    const html = `<div>${paragraphs}</div>`;
    const document = parseHTML(html);

    expect(document.sections.length).toBe(100);

    // Chunk with small token limit to force multiple chunks
    const chunks = chunkHTMLSections(document.sections, { maxTokens: 500 });

    expect(chunks.length).toBeGreaterThan(1);
  });

  it('should handle deeply nested HTML', () => {
    let html = '<p>Deep text</p>';
    for (let i = 0; i < 20; i++) {
      html = `<div>${html}</div>`;
    }

    const document = parseHTML(html);

    expect(document.sections.length).toBe(1);
    expect(document.sections[0]?.content).toBe('Deep text');
  });

  it('should handle HTML with many attributes', () => {
    const items = Array.from(
      { length: 50 },
      (_, i) =>
        `<img src="img${i}.png" alt="Image ${i}" title="Title ${i}" aria-label="Label ${i}">`
    ).join('\n');

    const html = `<div>${items}</div>`;
    const document = parseHTML(html);

    // 50 images * 3 translatable attributes each = 150
    const attributeSections = document.sections.filter((s) => s.isAttribute);
    expect(attributeSections.length).toBe(150);
  });
});

describe('Edge cases', () => {
  it('should handle HTML entities', () => {
    const html = '<p>&lt;Hello&gt; &amp; World</p>';
    const document = parseHTML(html);

    // Cheerio should decode entities
    expect(document.sections[0]?.content).toContain('&');
  });

  it('should handle self-closing tags', () => {
    const html = '<div><br/><hr/><p>Text</p></div>';
    const document = parseHTML(html);

    expect(document.sections.length).toBe(1);
    expect(document.sections[0]?.content).toBe('Text');
  });

  it('should handle comments', () => {
    const html = '<div><!-- This is a comment --><p>Text</p></div>';
    const document = parseHTML(html);

    expect(document.sections.length).toBe(1);
    expect(document.sections[0]?.content).toBe('Text');
  });

  it('should handle whitespace-only text nodes', () => {
    const html = '<div>  \n  <p>Text</p>  \n  </div>';
    const document = parseHTML(html);

    // Should only have one translatable section (not whitespace)
    const translatableSections = document.sections.filter(
      (s) => s.translatable && s.content.trim()
    );
    expect(translatableSections.length).toBe(1);
  });
});
