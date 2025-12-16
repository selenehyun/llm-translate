# Providers

::: info Translations
All non-English documentation is automatically translated using Claude Sonnet 4.
:::

llm-translate supports multiple LLM providers. Each has different strengths and trade-offs.

## Supported Providers

| Provider | Caching | Best For | Setup Complexity |
|----------|---------|----------|------------------|
| Claude | Full | Quality + Cost | Easy |
| OpenAI | Automatic | Ecosystem | Easy |
| Ollama | None | Privacy/Offline | Medium |

## Claude (Recommended)

### Why Claude?

- **Prompt caching**: Up to 90% cost reduction
- **High quality**: Excellent translation accuracy
- **Long context**: 200K token context window
- **Multiple tiers**: Haiku (fast), Sonnet (balanced), Opus (best)

### Setup

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### Model Selection

```bash
# Fast and cheap (default)
llm-translate file doc.md --target ko --model claude-haiku-4-5-20251001

# Balanced quality/cost
llm-translate file doc.md --target ko --model claude-sonnet-4-5-20250929

# Highest quality
llm-translate file doc.md --target ko --model claude-opus-4-5-20251101
```

### When to Use Each Model

| Model | Use Case |
|-------|----------|
| Haiku | README files, simple docs, high volume |
| Sonnet | Technical documentation, API references |
| Opus | Legal, marketing, nuanced content |

## OpenAI

### Setup

```bash
export OPENAI_API_KEY=sk-xxxxx
```

### Usage

```bash
llm-translate file doc.md --target ko --provider openai --model gpt-4o
```

### Available Models

| Model | Speed | Quality | Cost |
|-------|-------|---------|------|
| gpt-4o-mini | Fast | Good | Very Low |
| gpt-4o | Medium | Excellent | Medium |
| gpt-4-turbo | Medium | Excellent | High |

### When to Use

- Already using OpenAI for other services
- Need specific OpenAI features
- Prefer Azure OpenAI (set custom baseUrl)

## Ollama

Local, self-hosted LLMs for privacy or offline use. No API keys required.

::: warning Quality Varies by Model
Ollama translation quality is **highly dependent on model selection**. For reliable translation results:

- **Minimum**: 14B+ parameter models (e.g., `qwen2.5:14b`, `llama3.1:14b`)
- **Recommended**: 32B+ models (e.g., `qwen2.5:32b`, `llama3.3:70b`)
- **Not recommended**: Models under 7B produce inconsistent and often unusable translations

Smaller models (3B, 7B) may work for simple content but frequently fail on technical documentation, produce incomplete outputs, or ignore formatting instructions.
:::

### Quick Setup

```bash
# 1. Install (macOS)
brew install ollama

# 2. Pull qwen2.5:14b (recommended)
ollama pull qwen2.5:14b

# 3. Translate
llm-translate file doc.md -s en -t ko --provider ollama --model qwen2.5:14b
```

### Recommended Models

| Model | RAM | Quality | Best For |
|-------|-----|---------|----------|
| `qwen2.5:14b` | 16GB | Very Good | **Best balance (recommended)** |
| `qwen2.5:32b` | 32GB | Excellent | Higher quality |
| `llama3.1:8b` | 8GB | Good | Lighter weight |
| `llama3.2` | 4GB | Fair | Simple content only |

### When to Use

- Sensitive/private documents
- Offline environments
- Cost optimization (no API fees)
- Simple to moderate complexity content

::: tip Full Guide
See [Local Translation with Ollama](./ollama) for complete setup instructions, GPU optimization, troubleshooting, and advanced configuration.
:::

## Provider Comparison

### Quality

```
Opus > Sonnet ≈ GPT-4o > Haiku ≈ GPT-4o-mini > Qwen2.5:32b > Qwen2.5:14b
```

### Cost (per 1M tokens)

```
Ollama ($0) < GPT-4o-mini ($0.15) < Haiku ($1) < GPT-4o ($2.5) < Sonnet ($3) < Opus ($15)
```

### Speed

```
Haiku ≈ GPT-4o-mini > Sonnet ≈ GPT-4o > Opus > Ollama (varies with hardware)
```

## Switching Providers

### CLI

```bash
# Different providers
llm-translate file doc.md -s en -t ko --provider claude
llm-translate file doc.md -s en -t ko --provider openai
llm-translate file doc.md -s en -t ko --provider ollama
```

### Config File

```json
{
  "provider": {
    "name": "openai",
    "model": "gpt-4o"
  }
}
```

### Programmatic

```typescript
import {
  createClaudeProvider,
  createOpenAIProvider,
  createOllamaProvider,
  TranslationEngine,
} from '@llm-translate/cli';

// Switch providers easily
const providers = {
  claude: createClaudeProvider(),
  openai: createOpenAIProvider(),
  ollama: createOllamaProvider(),
};

const engine = new TranslationEngine({
  provider: providers[selectedProvider],
});
```

## Fallback Configuration

Configure fallback providers for reliability:

```json
{
  "provider": {
    "name": "claude",
    "model": "claude-haiku-4-5-20251001",
    "fallback": [
      { "name": "openai", "model": "gpt-4o-mini" },
      { "name": "ollama", "model": "llama3.1" }
    ]
  }
}
```

## Custom Endpoints

### Azure OpenAI

```json
{
  "provider": {
    "name": "openai",
    "baseUrl": "https://your-resource.openai.azure.com",
    "apiKey": "your-azure-key"
  }
}
```

### Self-Hosted

```json
{
  "provider": {
    "name": "ollama",
    "baseUrl": "https://your-server.com:11434"
  }
}
```
