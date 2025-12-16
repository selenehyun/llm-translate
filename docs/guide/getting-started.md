# Getting Started

::: info Translations
All non-English documentation is automatically translated using Claude Sonnet 4.
:::

## Installation

### npm (Recommended)

```bash
npm install -g @llm-translate/cli
```

### From Source

```bash
git clone https://github.com/selenehyun/llm-translate.git
cd llm-translate
npm install
npm run build
npm link
```

## Prerequisites

- Node.js 24 or higher
- API key for at least one LLM provider:
  - Anthropic (Claude)
  - OpenAI
  - Ollama (local, no API key needed)

## Configuration

### 1. Set API Key

```bash
# For Claude (recommended)
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# For OpenAI
export OPENAI_API_KEY=sk-xxxxx

# For Ollama (no key needed, just ensure server is running)
# See the Ollama guide for setup: ./ollama
export OLLAMA_BASE_URL=http://localhost:11434
```

### 2. Initialize Configuration (Optional)

```bash
llm-translate init
```

This creates a `.translaterc.json` file with default settings:

```json
{
  "provider": {
    "name": "claude",
    "model": "claude-haiku-4-5-20251001"
  },
  "translation": {
    "qualityThreshold": 85,
    "maxIterations": 4
  },
  "paths": {
    "glossary": "./glossary.json"
  }
}
```

## Your First Translation

### Basic Usage

```bash
# Translate a markdown file to Korean
llm-translate file README.md -o README.ko.md -s en -t ko

# Using long option names
llm-translate file docs/guide.md -o docs/guide.ja.md --source-lang en --target-lang ja
```

### Using a Glossary

1. Create a `glossary.json` file:

```json
{
  "sourceLanguage": "en",
  "terms": [
    {
      "source": "component",
      "targets": { "ko": "컴포넌트" },
      "context": "UI component"
    },
    {
      "source": "prop",
      "targets": { "ko": "프롭" },
      "context": "React prop"
    },
    {
      "source": "TypeScript",
      "doNotTranslate": true
    }
  ]
}
```

2. Translate with glossary:

```bash
llm-translate file README.md -o README.ko.md -s en -t ko --glossary glossary.json
```

### Batch Translation

Translate an entire directory:

```bash
llm-translate dir ./docs ./docs-ko -s en -t ko --glossary glossary.json
```

## Understanding the Output

After translation, you'll see:

```
✓ Translation complete
  Quality: 92/85 (threshold met)
  Iterations: 2
  Tokens: 1,234 input / 1,456 output
  Cache: 890 read / 234 written (78% hit rate)
  Duration: 3.2s
```

- **Quality**: Final score vs threshold
- **Iterations**: Number of refinement cycles
- **Tokens**: API token usage
- **Cache**: Prompt caching statistics (Claude only)
- **Duration**: Total processing time

## Next Steps

- [Configure your project](./configuration) for optimal settings
- [Set up a glossary](./glossary) for consistent terminology
- [Understand quality control](./quality-control) and tuning
- [Optimize costs](./cost-optimization) for large projects
- [Run locally with Ollama](./ollama) for private, offline translation
