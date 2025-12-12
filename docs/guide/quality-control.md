# Quality Control

llm-translate uses a Self-Refine algorithm to ensure translation quality meets your requirements.

## How Self-Refine Works

```
┌─────────────────┐
│ Initial Translate│
└────────┬────────┘
         ▼
┌─────────────────┐
│ Evaluate Quality │◀──────────────┐
└────────┬────────┘               │
         ▼                        │
    Score >= Threshold?           │
         │                        │
    No   │   Yes                  │
         │    │                   │
         ▼    ▼                   │
┌─────────┐ ┌──────┐              │
│ Reflect │ │ Done │              │
└────┬────┘ └──────┘              │
     ▼                            │
┌─────────────────┐               │
│    Improve      │───────────────┘
└─────────────────┘
```

### 1. Initial Translation

The first translation is generated with:
- Full glossary context
- Document structure information
- Previous chunk context (for continuity)

### 2. Quality Evaluation

Each translation is scored on four criteria:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Semantic Accuracy | 40% | Does it convey the correct meaning? |
| Fluency | 25% | Does it read naturally in target language? |
| Glossary Compliance | 20% | Are all glossary terms applied correctly? |
| Format Preservation | 15% | Is markdown/HTML structure maintained? |

### 3. Reflection

If quality is below threshold, the LLM analyzes:
- What specific issues exist
- Which glossary terms were missed
- Where fluency can be improved

### 4. Improvement

Targeted fixes are applied based on reflection feedback, then the cycle repeats.

## Configuration

### Quality Threshold

```bash
# CLI
llm-translate file doc.md -o doc.ko.md --target ko --quality 90

# Config file
{
  "translation": {
    "qualityThreshold": 90
  }
}
```

### Maximum Iterations

```bash
# CLI
llm-translate file doc.md -o doc.ko.md --target ko --max-iterations 6

# Config file
{
  "translation": {
    "maxIterations": 6
  }
}
```

### Strict Mode

Fail if quality threshold is not met:

```bash
llm-translate file doc.md -o doc.ko.md --target ko --strict
```

Exit codes:
- `0` - Success
- `4` - Quality threshold not met (strict mode)

## Quality Score Interpretation

| Score | Quality Level | Description |
|-------|--------------|-------------|
| 95-100 | Excellent | Publication-ready |
| 85-94 | Good | Minor issues, acceptable for most uses |
| 75-84 | Fair | Noticeable issues, may need review |
| 60-74 | Poor | Significant issues, needs manual review |
| < 60 | Unacceptable | Major problems, consider re-translation |

## Understanding the Output

```
✓ Translation complete
  Quality: 92/85 (threshold met)
  Breakdown:
    - Accuracy: 38/40
    - Fluency: 24/25
    - Glossary: 18/20
    - Format: 12/15
  Iterations: 2
```

### Breakdown Analysis

- **Accuracy (38/40)**: Translation is semantically correct
- **Fluency (24/25)**: Reads naturally in target language
- **Glossary (18/20)**: Most terms applied, some variations
- **Format (12/15)**: Minor formatting adjustments needed

## Tuning Quality

### For Higher Quality

1. **Increase threshold**: `--quality 95`
2. **Allow more iterations**: `--max-iterations 6`
3. **Use better model**: `--model claude-sonnet-4-5-20250929`
4. **Provide more context**: Add document purpose in config

### For Faster Processing

1. **Lower threshold**: `--quality 75`
2. **Reduce iterations**: `--max-iterations 2`
3. **Use faster model**: `--model claude-haiku-4-5-20251001`

### Cost vs Quality Trade-offs

| Setting | Cost | Time | Quality |
|---------|------|------|---------|
| threshold=70, iterations=2 | Low | Fast | Draft |
| threshold=85, iterations=4 | Medium | Moderate | Standard |
| threshold=95, iterations=6 | High | Slow | Premium |

## Quality Issues and Fixes

### Low Accuracy Score

**Causes:**
- Ambiguous source text
- Missing context
- Complex technical content

**Fixes:**
- Add context to glossary terms
- Use a more capable model
- Break complex sentences into simpler ones

### Low Fluency Score

**Causes:**
- Literal translation
- Unnatural phrasing
- Wrong register (formal/informal)

**Fixes:**
- Increase max iterations
- Use native-quality model (Sonnet/GPT-4)
- Review source text for clarity

### Low Glossary Compliance

**Causes:**
- Terms not in glossary
- Case sensitivity mismatch
- Term appears in different form

**Fixes:**
- Add missing terms to glossary
- Check `caseSensitive` setting
- Add term variations

### Low Format Score

**Causes:**
- Complex nested structures
- Code blocks with comments
- Tables with formatting

**Fixes:**
- Ensure chunking respects structure
- Review markdown source
- Consider pre-processing complex content
