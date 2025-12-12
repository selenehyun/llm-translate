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

Local, self-hosted LLMs for privacy or offline use.

### Setup

1. Install Ollama:

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

2. Pull a model:

```bash
ollama pull llama3.1
```

3. Start the server:

```bash
ollama serve
```

### Usage

```bash
export OLLAMA_BASE_URL=http://localhost:11434

llm-translate file doc.md --target ko --provider ollama --model llama3.1
```

### Recommended Models

| Model | Parameters | Quality | Speed |
|-------|-----------|---------|-------|
| llama3.1 | 8B | Good | Fast |
| llama3.1:70b | 70B | Excellent | Slow |
| mistral | 7B | Good | Fast |
| mixtral | 8x7B | Very Good | Medium |

### Limitations

- No prompt caching (higher costs for large docs)
- Quality depends on model
- Requires local GPU for good performance
- Limited language support in some models

### When to Use

- Sensitive/private documents
- Offline environments
- Cost optimization (no API fees)
- Experimentation

## Provider Comparison

### Quality

```
Opus > Sonnet ≈ GPT-4o > Haiku ≈ GPT-4o-mini > Llama3.1
```

### Cost (per 1M tokens)

```
Ollama ($0) < Haiku ($1) < GPT-4o-mini ($0.15) < Sonnet ($3) < GPT-4o ($2.5) < Opus ($15)
```

### Speed

```
Haiku ≈ GPT-4o-mini > Sonnet ≈ GPT-4o > Opus > Ollama (varies)
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
} from 'llm-translate';

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
