# llm-translate file

::: info Translations
All non-English documentation is automatically translated using Claude Sonnet 4.
:::

Translate a single file.

## Synopsis

```bash
llm-translate file <input> [output] [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `<input>` | Input file path (required) |
| `[output]` | Output file path (optional, defaults to stdout) |

## Options

### Translation Options

| Option | Default | Description |
|--------|---------|-------------|
| `--source-lang`, `-s` | required | Source language code |
| `--target-lang`, `-t` | required | Target language code |
| `--glossary`, `-g` | none | Path to glossary file |

### Quality Options

| Option | Default | Description |
|--------|---------|-------------|
| `--quality` | 85 | Quality threshold (0-100) |
| `--max-iterations` | 4 | Maximum refinement iterations |
| `--strict-quality` | false | Fail if threshold not met |
| `--strict-glossary` | false | Fail if glossary terms not applied |

### Provider Options

| Option | Default | Description |
|--------|---------|-------------|
| `--provider`, `-p` | claude | Provider name |
| `--model`, `-m` | varies | Model identifier |

### Output Options

| Option | Default | Description |
|--------|---------|-------------|
| `--output`, `-o` | auto | Output file path |
| `--format`, `-f` | auto | Force output format (md\|html\|txt) |
| `--dry-run` | false | Show what would be done |
| `--json` | false | Output results as JSON |
| `--verbose`, `-v` | false | Enable verbose logging |
| `--quiet`, `-q` | false | Suppress non-error output |

### Advanced Options

| Option | Default | Description |
|--------|---------|-------------|
| `--no-cache` | false | Disable translation cache |
| `--chunk-size` | 1024 | Max tokens per chunk |
| `--context` | none | Additional context for translation |

## Examples

### Basic Usage

```bash
# Translate to Korean
llm-translate file README.md -o README.ko.md -s en -t ko

# With explicit output path
llm-translate file README.md --output README.ko.md --source-lang en --target-lang ko

# Specify source and target languages
llm-translate file doc.md -o doc.ja.md --source-lang en --target-lang ja
```

### With Glossary

```bash
# Use glossary for consistent terminology
llm-translate file api-docs.md -o api-docs.ko.md \
  -s en -t ko \
  --glossary glossary.json
```

### Quality Control

```bash
# Higher quality threshold
llm-translate file important.md -o important.ko.md \
  -s en -t ko \
  --quality 95 \
  --max-iterations 6

# Strict mode (fail if not met)
llm-translate file legal.md -o legal.ko.md \
  --source-lang en \
  --target-lang ko \
  --quality 95 \
  --strict-quality
```

### Provider Selection

```bash
# Use Claude Sonnet
llm-translate file doc.md -o doc.ko.md \
  -s en -t ko \
  --provider claude \
  --model claude-sonnet-4-5-20250929

# Use OpenAI
llm-translate file doc.md -o doc.ko.md \
  -s en -t ko \
  --provider openai \
  --model gpt-4o
```

### From stdin

```bash
# Pipe content (uses stdin mode when no TTY)
cat doc.md | llm-translate -s en -t ko > doc.ko.md

# Use with other tools
curl https://example.com/doc.md | llm-translate -s en -t ko
```

## Output Format

### Normal Mode

```
✓ Translated README.md → README.ko.md
  Quality: 92/85 (threshold met)
  Duration: 3.2s
```

### Verbose Mode

```bash
llm-translate file doc.md -o doc.ko.md --target ko --verbose
```

```
ℹ Loading configuration...
ℹ Provider: claude (claude-haiku-4-5-20251001)
ℹ Parsing document...
ℹ Chunks: 5
ℹ Starting translation...

[Chunk 1/5] Starting initial translation...
[Chunk 1/5] Quality: 78/85
[Chunk 1/5] Generating improvements...
[Chunk 1/5] Quality: 91/85 ✓

[Chunk 2/5] Starting initial translation...
[Chunk 2/5] Quality: 88/85 ✓
...

✓ Translation complete
  Quality: 89/85 (threshold met)
  Iterations: avg 1.8
  Tokens: 5,234 input / 6,456 output
  Cache: 3,200 read / 800 written
  Duration: 8.4s
```

## Language Codes

Common language codes:

| Code | Language |
|------|----------|
| `en` | English |
| `ko` | Korean |
| `ja` | Japanese |
| `zh` | Chinese (Simplified) |
| `zh-TW` | Chinese (Traditional) |
| `es` | Spanish |
| `fr` | French |
| `de` | German |

## Error Handling

### File Not Found

```bash
$ llm-translate file missing.md -s en -t ko
Error: Could not read file 'missing.md'
Exit code: 3
```

### Quality Not Met (Strict Mode)

```bash
$ llm-translate file doc.md -o doc.ko.md -s en -t ko --quality 99 --strict-quality
Error: Quality threshold not met: 94/99
Exit code: 4
```

### API Error

```bash
$ llm-translate file doc.md --target ko
Error: Provider error: Rate limit exceeded
Exit code: 5
```
