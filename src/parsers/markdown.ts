import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';
import type { Root, RootContent, Text, Code, InlineCode } from 'mdast';
import { visit } from 'unist-util-visit';

// ============================================================================
// Types
// ============================================================================

export interface ParsedDocument {
  /** Original markdown content */
  original: string;
  /** AST representation */
  ast: Root;
  /** Extracted text nodes for translation */
  textNodes: TextNode[];
}

export interface TextNode {
  /** Unique identifier for this node */
  id: string;
  /** Text content to translate */
  content: string;
  /** Node type in AST */
  type: string;
  /** Position in source document */
  position?: {
    start: { line: number; column: number; offset?: number };
    end: { line: number; column: number; offset?: number };
  };
  /** Path to node in AST (for restoration) */
  path: number[];
  /** Whether this node should be translated */
  translatable: boolean;
}

export interface TranslationMap {
  [nodeId: string]: string;
}

// ============================================================================
// Parser Implementation
// ============================================================================

/**
 * Parse markdown content and extract translatable text nodes
 */
export async function parseMarkdown(content: string): Promise<ParsedDocument> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm);

  const ast = processor.parse(content) as Root;
  const textNodes = extractTextNodes(ast);

  return {
    original: content,
    ast,
    textNodes,
  };
}

/**
 * Apply translations to AST and stringify back to markdown
 */
export async function applyTranslations(
  document: ParsedDocument,
  translations: TranslationMap
): Promise<string> {
  // Clone the AST to avoid mutating original
  const ast = structuredClone(document.ast);

  // Apply translations to each text node
  for (const textNode of document.textNodes) {
    if (!textNode.translatable) continue;

    const translation = translations[textNode.id];
    if (!translation) continue;

    // Navigate to the node in AST and update its value
    const node = getNodeAtPath(ast, textNode.path);
    if (node && 'value' in node) {
      (node as Text).value = translation;
    }
  }

  // Stringify back to markdown
  const processor = unified()
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: '-',
      emphasis: '*',
      strong: '*',
      fence: '`',
      fences: true,
      listItemIndent: 'one',
    });

  const result = processor.stringify(ast);
  return String(result);
}

// ============================================================================
// Text Node Extraction
// ============================================================================

function extractTextNodes(ast: Root): TextNode[] {
  const textNodes: TextNode[] = [];
  let nodeId = 0;

  visit(ast, (node, index, parent) => {
    // Skip code blocks - they should not be translated
    if (node.type === 'code' || node.type === 'inlineCode') {
      textNodes.push({
        id: `node-${nodeId++}`,
        content: (node as Code | InlineCode).value,
        type: node.type,
        position: node.position,
        path: getNodePath(ast, node, index, parent),
        translatable: false,
      });
      return;
    }

    // Extract text nodes
    if (node.type === 'text') {
      const textContent = (node as Text).value;

      // Skip empty or whitespace-only text
      if (!textContent.trim()) return;

      textNodes.push({
        id: `node-${nodeId++}`,
        content: textContent,
        type: node.type,
        position: node.position,
        path: getNodePath(ast, node, index, parent),
        translatable: true,
      });
    }
  });

  return textNodes;
}

// ============================================================================
// AST Navigation Helpers
// ============================================================================

function getNodePath(
  _root: Root,
  _node: unknown,
  index: number | undefined,
  parent: unknown
): number[] {
  const path: number[] = [];

  // Build path by traversing up to root
  let currentParent = parent as { children?: unknown[] } | null;
  let currentIndex = index;

  while (currentParent && currentIndex !== undefined) {
    path.unshift(currentIndex);
    // Note: This is a simplified path - for full implementation,
    // we'd need to track parent references during traversal
    break;
  }

  if (index !== undefined) {
    path.push(index);
  }

  return path;
}

function getNodeAtPath(ast: Root, path: number[]): RootContent | null {
  let current: Root | RootContent = ast;

  for (const index of path) {
    if ('children' in current && Array.isArray(current.children)) {
      const child: RootContent | undefined = current.children[index];
      if (!child) return null;
      current = child;
    } else {
      return null;
    }
  }

  return current as RootContent;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get only translatable text from a parsed document
 */
export function getTranslatableText(document: ParsedDocument): string[] {
  return document.textNodes
    .filter((node) => node.translatable)
    .map((node) => node.content);
}

/**
 * Create a translation map from an array of translations
 * (in same order as getTranslatableText output)
 */
export function createTranslationMap(
  document: ParsedDocument,
  translations: string[]
): TranslationMap {
  const translatableNodes = document.textNodes.filter((node) => node.translatable);
  const map: TranslationMap = {};

  for (let i = 0; i < translatableNodes.length && i < translations.length; i++) {
    const node = translatableNodes[i];
    if (node) {
      map[node.id] = translations[i] ?? node.content;
    }
  }

  return map;
}

/**
 * Extract full text content for translation (preserving structure markers)
 */
export function extractTextForTranslation(content: string): {
  text: string;
  preservedSections: Map<string, string>;
} {
  const preservedSections = new Map<string, string>();
  let placeholderIndex = 0;

  // Replace code blocks with placeholders
  let text = content.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `__CODE_BLOCK_${placeholderIndex++}__`;
    preservedSections.set(placeholder, match);
    return placeholder;
  });

  // Replace inline code with placeholders
  text = text.replace(/`[^`]+`/g, (match) => {
    const placeholder = `__INLINE_CODE_${placeholderIndex++}__`;
    preservedSections.set(placeholder, match);
    return placeholder;
  });

  // Replace URLs in links with placeholders
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText, url) => {
    const placeholder = `__LINK_URL_${placeholderIndex++}__`;
    preservedSections.set(placeholder, url as string);
    return `[${linkText}](${placeholder})`;
  });

  return { text, preservedSections };
}

/**
 * Restore preserved sections after translation
 */
export function restorePreservedSections(
  translatedText: string,
  preservedSections: Map<string, string>
): string {
  let result = translatedText;

  for (const [placeholder, original] of preservedSections) {
    result = result.replace(placeholder, original);
  }

  return result;
}

/**
 * Simple markdown translation that preserves structure
 * This is the main function to use for translating markdown content
 */
export async function translateMarkdownContent(
  content: string,
  translateFn: (text: string) => Promise<string>
): Promise<string> {
  // Extract text for translation with preserved sections
  const { text, preservedSections } = extractTextForTranslation(content);

  // Translate the text
  const translatedText = await translateFn(text);

  // Restore preserved sections
  return restorePreservedSections(translatedText, preservedSections);
}
