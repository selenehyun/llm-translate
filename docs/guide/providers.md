# Providers

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

### Quick Setup

```bash
# 1. Install (macOS)
brew install ollama

# 2. Pull GPT-OSS 20B (recommended)
ollama pull gpt-oss:20b

# 3. Translate
llm-translate file doc.md --target ko --provider ollama
```

### Recommended Models

| Model | RAM | Quality | Best For |
|-------|-----|---------|----------|
| `gpt-oss:20b` | 16GB | Excellent | **Best quality (recommended)** |
| `qwen2.5:3b` | 3GB | Good | Lightweight + 29 languages |
| `qwen2.5:7b` | 6GB | Very Good | Multilingual priority |
| `llama3.2` | 4GB | Good | English-centric docs |

### When to Use

- Sensitive/private documents
- Offline environments
- Cost optimization (no API fees)
- Need chain-of-thought visibility (GPT-OSS)

::: tip Full Guide
See [Local Translation with Ollama](./ollama) for complete setup instructions, GPU optimization, troubleshooting, and advanced configuration.
:::

## Provider Comparison

### Quality

```
Opus > Sonnet ≈ GPT-4o ≈ GPT-OSS-20B > Haiku ≈ GPT-4o-mini > Qwen2.5
```

### Cost (per 1M tokens)

```
Ollama/GPT-OSS ($0) < GPT-4o-mini ($0.15) < Haiku ($1) < GPT-4o ($2.5) < Sonnet ($3) < Opus ($15)
```

### Speed

```
Haiku ≈ GPT-4o-mini > Sonnet ≈ GPT-4o > Opus > GPT-OSS-20B (with GPU)
```

## Switching Providers

### CLI

```bash
# Different providers
llm-translate file doc.md --target ko --provider claude
llm-translate file doc.md --target ko --provider openai
llm-translate file doc.md --target ko --provider ollama
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
