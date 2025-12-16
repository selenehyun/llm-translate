# llm-translate init

::: info Translations
All non-English documentation is automatically translated using Claude Sonnet 4.
:::

Initialize configuration file for your project.

## Synopsis

```bash
llm-translate init [options]
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--provider`, `-p` | claude | Default provider |
| `--model`, `-m` | varies | Default model |
| `--quality` | 85 | Default quality threshold |
| `--glossary` | none | Create glossary template |
| `--force`, `-f` | false | Overwrite existing config |

## Examples

### Basic Initialization

```bash
llm-translate init
```

Creates `.translaterc.json`:

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
  "paths": {}
}
```

### With Provider

```bash
llm-translate init --provider openai --model gpt-4o
```

### With Glossary Template

```bash
llm-translate init --glossary
```

Also creates `glossary.json`:

```json
{
  "sourceLanguage": "en",
  "version": "1.0.0",
  "terms": [
    {
      "source": "example",
      "targets": {
        "ko": "예시"
      },
      "context": "Replace with your terms"
    }
  ]
}
```

### Custom Quality

```bash
llm-translate init --quality 95
```

## Interactive Mode

Without options, init runs interactively:

```
$ llm-translate init

llm-translate Configuration Setup

? Select provider: (Use arrow keys)
❯ claude
  openai
  ollama

? Select model: (Use arrow keys)
❯ claude-haiku-4-5-20251001 (fast, cost-effective)
  claude-sonnet-4-5-20250929 (balanced)
  claude-opus-4-5-20251101 (highest quality)

? Quality threshold: (85)
? Create glossary template? (y/N)

✓ Created .translaterc.json
```

## Output Files

### .translaterc.json

```json
{
  "$schema": "https://llm-translate.dev/schema.json",
  "provider": {
    "name": "claude",
    "model": "claude-haiku-4-5-20251001"
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

### glossary.json (with --glossary)

```json
{
  "$schema": "https://llm-translate.dev/glossary-schema.json",
  "sourceLanguage": "en",
  "version": "1.0.0",
  "description": "Project glossary",
  "terms": []
}
```

## Overwriting Existing Config

```bash
# Will fail if config exists
llm-translate init
# Error: .translaterc.json already exists. Use --force to overwrite.

# Force overwrite
llm-translate init --force
```
