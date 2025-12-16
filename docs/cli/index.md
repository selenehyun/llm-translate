# CLI Reference

::: info Translations
All non-English documentation is automatically translated using Claude Sonnet 4.
:::

llm-translate provides a command-line interface for translating documents.

## Installation

```bash
npm install -g @llm-translate/cli
```

## Global Options

These options are available for all commands:

| Option | Description |
|--------|-------------|
| `--help`, `-h` | Show help |
| `--version`, `-V` | Show version |
| `--verbose`, `-v` | Enable verbose output |
| `--quiet`, `-q` | Suppress non-essential output |
| `--config` | Path to config file |

## Commands

### [file](./file)

Translate a single file.

```bash
llm-translate file <input> [output] [options]
```

### [dir](./dir)

Translate all files in a directory.

```bash
llm-translate dir <input> <output> [options]
```

### [init](./init)

Initialize configuration file.

```bash
llm-translate init [options]
```

### [glossary](./glossary)

Manage glossary files.

```bash
llm-translate glossary <subcommand> [options]
```

## Quick Examples

```bash
# Translate a file to Korean
llm-translate file README.md -o README.ko.md -s en -t ko

# Translate with glossary
llm-translate file docs/guide.md -o docs/guide.ja.md \
  -s en -t ja --glossary glossary.json

# Batch translate a directory
llm-translate dir ./docs ./docs-ko -s en -t ko

# Initialize config
llm-translate init --provider claude

# Validate glossary
llm-translate glossary validate glossary.json
```

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | File not found |
| 4 | Quality threshold not met (strict mode) |
| 5 | Provider/API error |
| 6 | Glossary validation failed |

## Environment Variables

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
OLLAMA_BASE_URL=http://localhost:11434
```

## Configuration Priority

Settings are applied in this order (later overrides earlier):

1. Built-in defaults
2. Config file (`.translaterc.json`)
3. Environment variables
4. CLI arguments

See [Configuration](../guide/configuration) for details.
