# llm-translate

CLI-based document translation tool powered by Large Language Models with glossary enforcement and quality-aware refinement.

## Features

- **Glossary-enforced consistency**: Domain-specific terminology is translated consistently across documents
- **Quality-aware refinement**: Iterative improvement loop until target quality threshold is met
- **Provider-agnostic**: Supports Claude, OpenAI, Ollama, and custom providers
- **Structure preservation**: AST-based processing maintains document formatting integrity
- **Unix-friendly**: Supports stdin/stdout for pipeline integration

## Installation

```bash
npm install -g llm-translate
```

## Quick Start

```bash
# Initialize project configuration
llm-translate init

# Set your API key
export ANTHROPIC_API_KEY=your-api-key

# Translate a single file
llm-translate file README.md -s en -t ko -o README.ko.md

# Stdin/stdout pipeline
cat doc.md | llm-translate -s en -t ja > doc.ja.md

# Batch translate a directory
llm-translate dir ./docs ./docs/ko -s en -t ko --glossary ./glossary.json
```

## CLI Commands

### `llm-translate file <input> [output]`

Translate a single file.

```bash
llm-translate file guide.md -s en -t ko -o guide.ko.md
```

### `llm-translate dir <input> <output>`

Translate all files in a directory.

```bash
llm-translate dir ./docs ./docs/ko -s en -t ko --parallel 5
```

### `llm-translate init`

Initialize project configuration.

```bash
llm-translate init
```

### `llm-translate glossary <subcommand>`

Manage glossary files.

```bash
# List terms
llm-translate glossary list ./glossary.json

# Validate glossary
llm-translate glossary validate ./glossary.json

# Add a term
llm-translate glossary add ./glossary.json "machine learning" --target ko:머신러닝

# Remove a term
llm-translate glossary remove ./glossary.json "machine learning"
```

## Configuration

Create a `.translaterc.json` file in your project root:

```json
{
  "version": "1.0",
  "languages": {
    "source": "en",
    "targets": ["ko", "ja"]
  },
  "provider": {
    "default": "claude",
    "model": "claude-sonnet-4-20250514"
  },
  "quality": {
    "threshold": 85,
    "maxIterations": 4
  },
  "glossary": {
    "path": "./glossary.json",
    "strict": false
  }
}
```

## Glossary Format

```json
{
  "metadata": {
    "name": "My Glossary",
    "sourceLang": "en",
    "targetLangs": ["ko", "ja"],
    "version": "1.0.0"
  },
  "terms": [
    {
      "source": "machine learning",
      "targets": {
        "ko": "머신러닝",
        "ja": "機械学習"
      }
    },
    {
      "source": "API",
      "targets": {},
      "doNotTranslate": true
    }
  ]
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `OLLAMA_BASE_URL` | Ollama server URL (default: http://localhost:11434) |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck
```

## License

MIT
