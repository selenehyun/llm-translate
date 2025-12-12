# Cost Optimization

This guide covers strategies to minimize API costs while maintaining translation quality.

## Cost Structure

### Token Pricing (as of 2024)

| Model | Input (1K) | Output (1K) | Cache Read | Cache Write |
|-------|-----------|-------------|------------|-------------|
| Claude Haiku 4.5 | $0.001 | $0.005 | $0.0001 | $0.00125 |
| Claude Sonnet 4.5 | $0.003 | $0.015 | $0.0003 | $0.00375 |
| Claude Opus 4.5 | $0.015 | $0.075 | $0.0015 | $0.01875 |
| GPT-4o-mini | $0.00015 | $0.0006 | Auto | Auto |
| GPT-4o | $0.0025 | $0.01 | Auto | Auto |

### Cost Factors

1. **Input tokens**: Source text + glossary + prompts
2. **Output tokens**: Translated text
3. **Iterations**: Quality refinement cycles (multiply by iterations)
4. **Cache efficiency**: Savings from prompt caching

## Optimization Strategies

### 1. Choose the Right Model

```bash
# Most cost-effective for standard docs
llm-translate file doc.md --model claude-haiku-4-5-20251001

# Better quality when needed
llm-translate file important.md --model claude-sonnet-4-5-20250929
```

**Model selection guide:**

| Content Type | Recommended Model |
|--------------|-------------------|
| README, guides | Haiku |
| API reference | Haiku |
| User-facing docs | Sonnet |
| Marketing content | Sonnet/Opus |
| Legal/compliance | Opus |

### 2. Optimize Quality Settings

Lower threshold = fewer iterations = lower cost

```bash
# Draft quality (faster, cheaper)
llm-translate file doc.md --quality 70 --max-iterations 2

# Standard quality
llm-translate file doc.md --quality 85 --max-iterations 4

# High quality (slower, more expensive)
llm-translate file doc.md --quality 95 --max-iterations 6
```

**Cost impact:**

| Setting | Avg Iterations | Relative Cost |
|---------|---------------|---------------|
| quality=70, iter=2 | 1.5 | 0.5x |
| quality=85, iter=4 | 2.5 | 1.0x |
| quality=95, iter=6 | 4.0 | 1.6x |

### 3. Maximize Prompt Caching

Enable caching and process files in batches:

```bash
# Process all files together to share cache
llm-translate dir ./docs ./docs-ko --target ko

# Not: Process one file at a time
```

See [Prompt Caching](/guide/prompt-caching) for details.

### 4. Optimize Glossary Size

Large glossaries increase costs. Keep only necessary terms:

```bash
# Check glossary token count
llm-translate glossary stats --glossary glossary.json
```

**Best practices:**
- Remove unused terms regularly
- Use `doNotTranslate` sparingly
- Split large glossaries by domain

### 5. Chunk Size Optimization

Larger chunks = fewer API calls = lower overhead

```json
{
  "chunking": {
    "maxTokens": 2048,
    "overlapTokens": 200
  }
}
```

**Trade-offs:**

| Chunk Size | API Calls | Quality | Cost |
|------------|-----------|---------|------|
| 512 tokens | Many | Higher | Higher |
| 1024 tokens | Medium | Good | Medium |
| 2048 tokens | Fewer | Acceptable | Lower |

### 6. Use Translation Cache

Cache translated chunks to avoid re-translating:

```json
{
  "paths": {
    "cache": "./.translate-cache"
  }
}
```

Benefits:
- Skip unchanged content on re-runs
- Reduce costs for incremental updates
- Faster subsequent translations

## Cost Estimation

### Before Translation

```bash
llm-translate estimate doc.md --target ko --glossary glossary.json
```

Output:
```
Estimated costs for doc.md:
  Chunks: 15
  Input tokens: ~18,000
  Output tokens: ~20,000 (estimated)
  Iterations: 2-3 (estimated)

  Model: claude-haiku-4-5-20251001
  Without caching: $0.12 - $0.18
  With caching: $0.05 - $0.08 (55-60% savings)
```

### After Translation

```bash
llm-translate file doc.md -o doc.ko.md --target ko --verbose
```

Output:
```
✓ Translation complete
  Tokens: 18,234 input / 21,456 output
  Cache: 12,000 read / 3,000 written
  Cost: $0.067 (estimated)
```

## Batch Processing Economics

### Single File vs Batch

| Approach | Cache Efficiency | Total Cost |
|----------|-----------------|------------|
| 10 files sequentially | 0% | $1.00 |
| 10 files with caching | 80% | $0.35 |
| Batch directory | 85% | $0.30 |

### Optimal Batch Size

```bash
# Process in batches of 20-50 files for best cache utilization
llm-translate dir ./docs ./docs-ko --target ko --concurrency 5
```

## Cost Monitoring

### Per-Project Tracking

Create a cost log:

```bash
llm-translate file doc.md --cost-log ./costs.json
```

### Cost Alerts

Set budget limits:

```json
{
  "budget": {
    "maxCostPerFile": 0.50,
    "maxCostPerRun": 10.00,
    "warnAt": 0.80
  }
}
```

## Cost Comparison by Language

Output varies by target language:

| Target | Relative Output Tokens |
|--------|----------------------|
| Korean | 0.9-1.1x source |
| Japanese | 0.8-1.0x source |
| Chinese | 0.7-0.9x source |
| German | 1.1-1.3x source |
| Spanish | 1.1-1.2x source |

Factor this into cost estimates.

## Summary: Quick Cost Reduction Checklist

- [ ] Use Haiku for standard documentation
- [ ] Set quality threshold appropriately (not higher than needed)
- [ ] Enable and maximize prompt caching
- [ ] Process files in batches
- [ ] Keep glossary lean
- [ ] Use translation cache for incremental updates
- [ ] Monitor costs with verbose output
- [ ] Estimate before large jobs
