# Chunking Strategy

Large documents are split into chunks for translation. Understanding chunking helps optimize quality and cost.

## Why Chunking?

LLMs have context limits and perform better on focused content:

| Reason | Description |
|--------|-------------|
| **Context limits** | Models have maximum input sizes |
| **Quality** | Smaller chunks get more focused attention |
| **Cost** | Allows caching of repeated content |
| **Progress** | Enables progress tracking and resumption |

## Default Configuration

```json
{
  "chunking": {
    "maxTokens": 1024,
    "overlapTokens": 150
  }
}
```

## Chunk Size Options

### maxTokens

Maximum tokens per chunk (excluding prompt overhead).

| Size | Best For | Trade-off |
|------|----------|-----------|
| 512 | High quality requirements | More API calls |
| **1024** | General use (default) | Balanced |
| 2048 | Cost optimization | May reduce quality |

### overlapTokens

Context from previous chunk ensures continuity across boundaries.

```
Chunk 1: [Content A                    ]
Chunk 2:            [overlap][Content B                    ]
Chunk 3:                              [overlap][Content C  ]
```

::: tip Recommended Overlap
Use 10-15% of your `maxTokens` value. For 1024 tokens, 100-150 overlap tokens work well.
:::

## Markdown-Aware Chunking

llm-translate uses AST-based chunking that respects document structure.

### Preserved Boundaries

The chunker never splits these elements:

| Element | Behavior |
|---------|----------|
| Headers | Section boundaries preserved |
| Code blocks | Always kept intact |
| Lists | Items grouped when possible |
| Tables | Never split across chunks |
| Paragraphs | Split at natural boundaries |

### Example

::: details Click to see chunking example

**Input document:**

```markdown
# Introduction

This is the introduction paragraph that explains
the purpose of the document.

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

npm install @llm-translate/cli
```

**Result:**

```
Chunk 1: # Introduction + paragraph
Chunk 2: ## Getting Started + ### Prerequisites + list
Chunk 3: ### Installation + code block
```

:::

## Configuration

::: code-group

```bash [CLI]
llm-translate file doc.md --target ko --chunk-size 2048
```

```json [.translaterc.json]
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

```typescript [Programmatic]
import { chunkContent } from '@llm-translate/cli';

const chunks = chunkContent(content, {
  maxTokens: 1024,
  overlapTokens: 150,
});
```

:::

## Optimization Presets

Choose based on your priority:

::: code-group

```json [Quality Focus]
{
  "chunking": {
    "maxTokens": 512,
    "overlapTokens": 100
  }
}
```

```json [Cost Focus]
{
  "chunking": {
    "maxTokens": 2048,
    "overlapTokens": 50
  }
}
```

```json [Long Documents]
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

:::

::: info When to use each preset
- **Quality Focus**: Technical documentation, legal content
- **Cost Focus**: Blog posts, general content
- **Long Documents**: Books, comprehensive guides
:::

## Content Preservation

### What Gets Protected

llm-translate automatically protects certain content from translation:

| Content Type | Example | Behavior |
|--------------|---------|----------|
| Code blocks | ` ```js ... ``` ` | Never translated |
| Inline code | `` `variable` `` | Preserved |
| URLs | `https://...` | Preserved |
| File paths | `./path/to/file` | Preserved |

### Link Handling

Link URLs are preserved, but link text is translated:

```markdown
[Getting Started](./getting-started.md)
↓
[시작하기](./getting-started.md)
```

## Debugging

### Preview Chunks

Use `--dry-run` to see how your document will be chunked:

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
  ...
```

### Programmatic Inspection

```typescript
import { chunkContent, getChunkStats } from '@llm-translate/cli';

const chunks = chunkContent(content, { maxTokens: 1024 });
const stats = getChunkStats(chunks);

console.log(`Total chunks: ${stats.count}`);
console.log(`Average size: ${stats.avgTokens} tokens`);
```

## Troubleshooting

::: warning Chunks Too Small
**Symptom**: Many small chunks, excessive API calls

**Solution**: Increase `maxTokens`
```json
{ "chunking": { "maxTokens": 2048 } }
```
:::

::: warning Lost Context Between Chunks
**Symptom**: Inconsistent terminology across sections

**Solution**: Increase overlap or use glossary
```json
{ "chunking": { "overlapTokens": 300 } }
```
:::

::: danger Code Blocks Being Split
**Symptom**: Syntax errors in output

**Cause**: This should never happen. If it does, please [report an issue](https://github.com/selenehyun/llm-translate/issues).
:::

::: warning Tables Being Mangled
**Symptom**: Broken table formatting

**Solution**: Tables should be kept intact automatically. For very large tables (100+ rows), consider splitting them manually.
:::
