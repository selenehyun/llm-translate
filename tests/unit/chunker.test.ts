import { describe, it, expect } from "vitest";
import {
  chunkContent,
  reassembleChunks,
  getChunkStats,
} from "../../src/core/chunker.js";

describe("chunkContent", () => {
  it("should return single chunk for small content", () => {
    const content = "This is a small piece of text.";
    const chunks = chunkContent(content, { maxTokens: 1000 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.type).toBe("translatable");
    expect(chunks[0]?.content).toBe(content);
  });

  it("should preserve code blocks as separate chunks", () => {
    const content = `# Title

Some text before code.

\`\`\`javascript
const x = 1;
console.log(x);
\`\`\`

Some text after code.`;

    const chunks = chunkContent(content, { maxTokens: 1000 });

    // Should have at least one preserved chunk (code block)
    const preservedChunks = chunks.filter((c) => c.type === "preserve");
    expect(preservedChunks.length).toBeGreaterThanOrEqual(1);

    // Code block should contain the JS code
    const codeChunk = preservedChunks.find((c) =>
      c.content.includes("const x = 1")
    );
    expect(codeChunk).toBeDefined();
  });

  it("should split large content into multiple chunks", () => {
    // Create content that exceeds token limit
    const paragraph =
      "This is a paragraph with enough words to make it substantial. ".repeat(
        50
      );
    const content = `${paragraph}\n\n${paragraph}\n\n${paragraph}`;

    const chunks = chunkContent(content, { maxTokens: 100 });

    expect(chunks.length).toBeGreaterThan(1);
  });

  it("should extract header hierarchy metadata", () => {
    const content = `# Main Title

Introduction text.

## Section One

Content in section one.

### Subsection 1.1

More detailed content.

## Section Two

Content in section two.`;

    const chunks = chunkContent(content, { maxTokens: 1000 });

    // Find chunk containing "More detailed content"
    const detailChunk = chunks.find((c) =>
      c.content.includes("More detailed content")
    );
    expect(detailChunk?.metadata?.headerHierarchy).toBeDefined();

    // Should have headers in hierarchy
    if (detailChunk?.metadata?.headerHierarchy) {
      expect(detailChunk.metadata.headerHierarchy.length).toBeGreaterThan(0);
    }
  });

  it("should include previousContext for subsequent chunks", () => {
    const paragraph =
      "This is the first paragraph with important context. ".repeat(30);
    const content = `${paragraph}\n\nThis is the second paragraph that should have previous context.`;

    const chunks = chunkContent(content, { maxTokens: 100 });

    // If there are multiple chunks, later ones should have previousContext
    if (chunks.length > 1) {
      const laterChunk = chunks[chunks.length - 1];
      expect(laterChunk?.metadata?.previousContext).toBeDefined();
    }
  });

  it("should handle empty content", () => {
    const chunks = chunkContent("", { maxTokens: 1000 });
    expect(chunks).toHaveLength(0);
  });

  it("should handle content with only code blocks", () => {
    const content = `\`\`\`python
print("Hello")
\`\`\``;

    const chunks = chunkContent(content, { maxTokens: 1000 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.type).toBe("preserve");
  });
});

describe("reassembleChunks", () => {
  it("should reassemble chunks in correct order", () => {
    const content = "First part. Second part. Third part.";
    const chunks = chunkContent(content, { maxTokens: 1000 });
    const reassembled = reassembleChunks(chunks);

    expect(reassembled).toBe(content);
  });

  it("should handle multiple chunks correctly", () => {
    const content = `# Title

First paragraph.

\`\`\`code
block
\`\`\`

Second paragraph.`;

    const chunks = chunkContent(content, { maxTokens: 1000 });
    const reassembled = reassembleChunks(chunks);

    expect(reassembled).toContain("# Title");
    expect(reassembled).toContain("First paragraph");
    expect(reassembled).toContain("```code");
    expect(reassembled).toContain("Second paragraph");
  });

  it("should preserve line breaks between code blocks and text", () => {
    const content = `\`\`\`yaml
key: value
\`\`\`

::: info Note
Some info here
:::`;

    const chunks = chunkContent(content, { maxTokens: 1000 });
    const reassembled = reassembleChunks(chunks);

    // Should preserve the empty line between code block and info block
    expect(reassembled).toBe(content);
    expect(reassembled).toContain("```\n\n:::");
  });

  it("should preserve whitespace-only segments between preserved sections", () => {
    const content = `\`\`\`js
code1
\`\`\`

\`\`\`js
code2
\`\`\``;

    const chunks = chunkContent(content, { maxTokens: 1000 });
    const reassembled = reassembleChunks(chunks);

    // Should preserve the empty lines between code blocks
    expect(reassembled).toBe(content);
  });

  it("should preserve exact line breaks between code block and following text (issue #187)", () => {
    // This is the exact pattern from lynq-installation.md line 187
    const content = `\`\`\`yaml
patches:
- path: manager_webhook_patch.yaml
\`\`\`

::: info cert-manager responsibilities
- Issue TLS certificates
:::`;

    const chunks = chunkContent(content, { maxTokens: 1000 });
    const reassembled = reassembleChunks(chunks);

    // The reassembled content must be exactly equal to original
    expect(reassembled).toBe(content);
    // Specifically verify the line break between code block and info block
    expect(reassembled).toContain("```\n\n:::");
    expect(reassembled).not.toContain("```:::"); // No missing line break
  });
});

describe("getChunkStats", () => {
  it("should return correct statistics", () => {
    const content = `Some text before.

\`\`\`js
code block
\`\`\`

Some text after.`;

    const chunks = chunkContent(content, { maxTokens: 1000 });
    const stats = getChunkStats(chunks);

    expect(stats.totalChunks).toBe(chunks.length);
    expect(stats.preservedChunks).toBeGreaterThanOrEqual(1);
    expect(stats.translatableChunks).toBeGreaterThanOrEqual(1);
    expect(stats.totalTokens).toBeGreaterThan(0);
  });

  it("should handle empty chunk array", () => {
    const stats = getChunkStats([]);

    expect(stats.totalChunks).toBe(0);
    expect(stats.preservedChunks).toBe(0);
    expect(stats.translatableChunks).toBe(0);
    expect(stats.averageTokens).toBe(0);
  });
});
