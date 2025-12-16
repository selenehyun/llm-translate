# Prompt Caching

::: info Translations
All non-English documentation is automatically translated using Claude Sonnet 4.
:::

Prompt caching is a cost optimization feature that reduces API costs by up to 90% for repeated content.

## How It Works

When translating documents, certain parts of the prompt remain constant:

- **System instructions**: Translation rules and guidelines
- **Glossary**: Domain-specific terminology

These are cached and reused across multiple chunks, saving significant costs.

```
Request 1 (First Chunk):
┌─────────────────────────────────┐
│ System Instructions (CACHED)    │ ◀─ Written to cache
├─────────────────────────────────┤
│ Glossary (CACHED)              │ ◀─ Written to cache
├─────────────────────────────────┤
│ Source Text (NOT cached)       │
└─────────────────────────────────┘

Request 2+ (Subsequent Chunks):
┌─────────────────────────────────┐
│ System Instructions (CACHED)    │ ◀─ Read from cache (90% off)
├─────────────────────────────────┤
│ Glossary (CACHED)              │ ◀─ Read from cache (90% off)
├─────────────────────────────────┤
│ Source Text (NOT cached)       │
└─────────────────────────────────┘
```

## Cost Impact

### Pricing (Claude)

| Token Type | Cost Multiplier |
|------------|-----------------|
| Regular input | 1.0x |
| Cache write | 1.25x (first use) |
| Cache read | 0.1x (subsequent) |
| Output | 1.0x |

### Example Calculation

For a 10-chunk document with 500-token glossary:

**Without caching:**
```
10 chunks × 500 glossary tokens = 5,000 tokens
```

**With caching:**
```
First chunk: 500 × 1.25 = 625 tokens (cache write)
9 chunks: 500 × 0.1 × 9 = 450 tokens (cache read)
Total: 1,075 tokens (78% savings)
```

## Requirements

### Minimum Token Thresholds

Prompt caching requires minimum content length:

| Model | Minimum Tokens |
|-------|---------------|
| Claude Haiku 4.5 | 4,096 |
| Claude Haiku 3.5 | 2,048 |
| Claude Sonnet | 1,024 |
| Claude Opus | 1,024 |

Content below these thresholds won't be cached.

### Provider Support

| Provider | Caching Support |
|----------|-----------------|
| Claude | ✅ Full support |
| OpenAI | ✅ Automatic |
| Ollama | ❌ Not available |

## Configuration

Caching is enabled by default for Claude. To disable:

```bash
llm-translate file doc.md -o doc.ko.md --target ko --no-cache
```

Or in config:

```json
{
  "provider": {
    "name": "claude",
    "caching": false
  }
}
```

## Monitoring Cache Performance

### CLI Output

```
✓ Translation complete
  Cache: 890 read / 234 written (78% hit rate)
```

### Verbose Mode

```bash
llm-translate file doc.md -o doc.ko.md --target ko --verbose
```

Shows per-chunk cache statistics:

```
[Chunk 1/10] Cache: 0 read / 890 written
[Chunk 2/10] Cache: 890 read / 0 written
[Chunk 3/10] Cache: 890 read / 0 written
...
```

### Programmatic Access

```typescript
const result = await engine.translateFile({
  input: 'doc.md',
  output: 'doc.ko.md',
  targetLang: 'ko',
});

console.log(result.metadata.tokensUsed);
// {
//   input: 5000,
//   output: 6000,
//   cacheRead: 8000,
//   cacheWrite: 1000
// }
```

## Maximizing Cache Efficiency

### 1. Use Consistent Glossaries

Same glossary content = same cache key

```bash
# Good: Same glossary for all files
llm-translate dir ./docs ./docs-ko --target ko --glossary glossary.json

# Less efficient: Different glossary per file
llm-translate file a.md --glossary a-glossary.json
llm-translate file b.md --glossary b-glossary.json
```

### 2. Batch Process Related Files

Cache persists for ~5 minutes. Process files together:

```bash
# Efficient: Sequential processing shares cache
llm-translate dir ./docs ./docs-ko --target ko
```

### 3. Order Files by Size

Start with larger files to warm the cache:

```bash
# Cache is populated by first file, reused by rest
llm-translate file large-doc.md ...
llm-translate file small-doc.md ...
```

### 4. Use Larger Glossaries Strategically

Larger glossaries benefit more from caching:

| Glossary Size | Cache Savings |
|---------------|---------------|
| 100 tokens | ~70% |
| 500 tokens | ~78% |
| 1000+ tokens | ~80%+ |

## Troubleshooting

### Cache Not Working

**Symptoms:** No `cacheRead` tokens reported

**Causes:**
1. Content below minimum threshold
2. Content changed between requests
3. Cache TTL expired (5 minutes)

**Solutions:**
- Ensure glossary + system prompt > minimum tokens
- Process files in quick succession
- Use verbose mode to debug

### High Cache Write Costs

**Symptoms:** More `cacheWrite` than expected

**Causes:**
1. Many unique glossaries
2. Files processed too far apart
3. Cache invalidation between runs

**Solutions:**
- Consolidate glossaries
- Use batch processing
- Process within 5-minute windows
