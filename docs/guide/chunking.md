# Chunking Strategy

Large documents are split into chunks for translation. Understanding chunking helps optimize quality and cost.

## Why Chunking?

LLMs have context limits and perform better on focused content:

- **Context limits**: Models have maximum input sizes
- **Quality**: Smaller chunks get more focused attention
- **Cost**: Allows caching of repeated content
- **Progress**: Enables progress tracking and resumption

## Default Configuration

```json
{
  "chunking": {
    "maxTokens": 1024,
    "overlapTokens": 150
  }
}
```

## Chunk Size

### maxTokens

Maximum tokens per chunk (excluding prompt overhead).

| Size | Pros | Cons |
|------|------|------|
| 512 | Higher quality per chunk | More API calls |
| 1024 | Balanced (default) | Good trade-off |
| 2048 | Fewer API calls | May reduce quality |

### overlapTokens

Context from previous chunk for continuity.

```
Chunk 1: [Content A]
Chunk 2: [Last 150 tokens of A] + [Content B]
Chunk 3: [Last 150 tokens of B] + [Content C]
```

## Markdown-Aware Chunking

llm-translate uses AST-based chunking that respects document structure:

### Preserved Boundaries

1. **Headers**: Never split in the middle of a section
2. **Code blocks**: Keep code blocks intact
3. **Lists**: Keep list items together when possible
4. **Tables**: Keep tables intact
5. **Paragraphs**: Split at paragraph boundaries

### Example

Input:
```markdown
# Introduction

This is the introduction paragraph that explains
the purpose of the document.

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
npm install llm-translate
```
```

Chunks:
```
Chunk 1:
# Introduction
This is the introduction paragraph...

Chunk 2:
## Getting Started
### Prerequisites
- Node.js 20+
- npm or yarn

Chunk 3:
### Installation
```bash
npm install llm-translate
```
```

## Configuration

### CLI

```bash
llm-translate file doc.md --target ko --chunk-size 2048
```

### Config File

```json
{
  "chunking": {
    "maxTokens": 2048,
    "overlapTokens": 200,
    "preservePatterns": [
      "```[\\s\\S]*?```",
      "\\|[^\\n]+\\|"
    ]
  }
}
```

### Programmatic

```typescript
import { chunkMarkdown } from 'llm-translate';

const chunks = chunkMarkdown(content, {
  maxTokens: 1024,
  overlapTokens: 150,
  preserveCodeBlocks: true,
  preserveTables: true,
});
```

## Optimization Strategies

### For Quality

Smaller chunks with more overlap:

```json
{
  "chunking": {
    "maxTokens": 512,
    "overlapTokens": 100
  }
}
```

### For Cost

Larger chunks with minimal overlap:

```json
{
  "chunking": {
    "maxTokens": 2048,
    "overlapTokens": 50
  }
}
```

### For Long Documents

Balance chunk size with Self-Refine overhead:

```json
{
  "chunking": {
    "maxTokens": 1500,
    "overlapTokens": 150
  },
  "translation": {
    "maxIterations": 3
  }
}
```

## Special Content Handling

### Code Blocks

Code blocks are protected from translation:

```markdown
Here's an example:

```javascript
// This code is NOT translated
const greeting = "Hello, World!";
console.log(greeting);
```

The code above shows...
```

### Inline Code

Inline `code` is also preserved.

### Links

Links are preserved but link text may be translated:

```markdown
[Getting Started](./getting-started.md)
→ [시작하기](./getting-started.md)
```

### Tables

Tables are kept intact within a single chunk when possible:

```markdown
| Feature | Support |
|---------|---------|
| Markdown | ✓ |
| HTML | ✓ |
```

## Debugging Chunks

### Preview Chunks

```bash
llm-translate file doc.md --target ko --dry-run --verbose
```

Output:
```
Document Analysis:
  Total tokens: ~5,200
  Chunks: 6
  Average chunk size: ~867 tokens

Chunk breakdown:
  [1] Lines 1-45 (Introduction) - 823 tokens
  [2] Lines 46-89 (Getting Started) - 912 tokens
  [3] Lines 90-134 (Configuration) - 878 tokens
  [4] Lines 135-180 (Usage) - 901 tokens
  [5] Lines 181-220 (API) - 845 tokens
  [6] Lines 221-250 (Troubleshooting) - 841 tokens
```

### Programmatic Inspection

```typescript
import { chunkMarkdown } from 'llm-translate';

const chunks = chunkMarkdown(content, { maxTokens: 1024 });

chunks.forEach((chunk, i) => {
  console.log(`Chunk ${i + 1}:`);
  console.log(`  Tokens: ${chunk.tokenCount}`);
  console.log(`  Lines: ${chunk.startLine}-${chunk.endLine}`);
  console.log(`  Preview: ${chunk.content.slice(0, 100)}...`);
});
```

## Troubleshooting

### Chunks Too Small

**Symptom**: Many small chunks, high API calls

**Solution**: Increase maxTokens

```json
{ "chunking": { "maxTokens": 2048 } }
```

### Lost Context Between Chunks

**Symptom**: Inconsistent terminology across sections

**Solution**: Increase overlap or use larger chunks

```json
{ "chunking": { "overlapTokens": 300 } }
```

### Code Blocks Being Split

**Symptom**: Syntax errors in translated code

**Solution**: Code blocks should never be split. Check your content:

```bash
# Find large code blocks
grep -n '```' doc.md
```

### Tables Being Mangled

**Symptom**: Broken table formatting

**Solution**: Tables should be kept intact. For very large tables, consider simplifying.
