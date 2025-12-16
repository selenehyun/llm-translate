# Configuration

::: info Translations
All non-English documentation is automatically translated using Claude Sonnet 4.
:::

llm-translate uses a layered configuration system. Settings are applied in this order (later overrides earlier):

1. Built-in defaults
2. Configuration file (`.translaterc.json`)
3. Environment variables
4. CLI arguments

## Configuration File

Create `.translaterc.json` in your project root:

```json
{
  "provider": {
    "name": "claude",
    "model": "claude-haiku-4-5-20251001",
    "apiKey": null
  },
  "translation": {
    "qualityThreshold": 85,
    "maxIterations": 4,
    "preserveFormatting": true
  },
  "chunking": {
    "maxTokens": 1024,
    "overlapTokens": 150
  },
  "paths": {
    "glossary": "./glossary.json",
    "cache": "./.translate-cache"
  }
}
```

### Provider Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | `"claude"` | Provider name: `claude`, `openai`, `ollama` |
| `model` | string | varies | Model identifier |
| `apiKey` | string | null | API key (prefer env var) |
| `baseUrl` | string | null | Custom API endpoint |

### Translation Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `qualityThreshold` | number | `85` | Minimum quality score (0-100) |
| `maxIterations` | number | `4` | Maximum refinement iterations |
| `preserveFormatting` | boolean | `true` | Preserve markdown/HTML structure |

### Chunking Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxTokens` | number | `1024` | Maximum tokens per chunk |
| `overlapTokens` | number | `150` | Context overlap between chunks |

### Path Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `glossary` | string | null | Path to glossary file |
| `cache` | string | null | Path to translation cache |

## Environment Variables

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
OLLAMA_BASE_URL=http://localhost:11434

# Default Settings
LLM_TRANSLATE_PROVIDER=claude
LLM_TRANSLATE_MODEL=claude-haiku-4-5-20251001
LLM_TRANSLATE_QUALITY_THRESHOLD=85
```

## CLI Override Examples

```bash
# Override provider
llm-translate file doc.md -o doc.ko.md --target ko --provider openai

# Override model
llm-translate file doc.md -o doc.ko.md --target ko --model claude-sonnet-4-5-20250929

# Override quality threshold
llm-translate file doc.md -o doc.ko.md --target ko --quality 90

# Override max iterations
llm-translate file doc.md -o doc.ko.md --target ko --max-iterations 6
```

## Per-Project Configuration

For monorepos or multi-project setups, place `.translaterc.json` in each project directory:

```
my-monorepo/
├── packages/
│   ├── frontend/
│   │   ├── .translaterc.json  # Frontend-specific terms
│   │   └── docs/
│   └── backend/
│       ├── .translaterc.json  # Backend-specific terms
│       └── docs/
└── .translaterc.json          # Shared defaults
```

llm-translate searches for config files from the current directory upward.

## Model Selection Guide

| Model | Speed | Quality | Cost | Best For |
|-------|-------|---------|------|----------|
| `claude-haiku-4-5-20251001` | Fast | Good | Low | General docs, high volume |
| `claude-sonnet-4-5-20250929` | Medium | Excellent | Medium | Technical docs, quality-critical |
| `claude-opus-4-5-20251101` | Slow | Best | High | Complex content, nuanced text |
| `gpt-4o-mini` | Fast | Good | Low | Alternative to Haiku |
| `gpt-4o` | Medium | Excellent | Medium | Alternative to Sonnet |

## Quality Threshold Guidelines

| Threshold | Use Case |
|-----------|----------|
| 70-75 | Draft translations, internal docs |
| 80-85 | Standard documentation (default) |
| 90-95 | Public-facing, marketing content |
| 95+ | Legal, medical, regulated content |

Higher thresholds require more iterations and cost more.
