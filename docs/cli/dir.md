# llm-translate dir

Translate all files in a directory.

## Synopsis

```bash
llm-translate dir <input> <output> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `<input>` | Input directory path (required) |
| `<output>` | Output directory path (required) |

## Options

### Language Options

| Option | Default | Description |
|--------|---------|-------------|
| `-s, --source-lang <lang>` | auto-detect | Source language code |
| `-t, --target-lang <lang>` | required | Target language code |

### Translation Options

| Option | Default | Description |
|--------|---------|-------------|
| `-g, --glossary <path>` | none | Path to glossary file |
| `-p, --provider <name>` | `claude` | LLM provider (claude\|openai\|ollama) |
| `-m, --model <name>` | provider default | Model name |
| `--context <text>` | none | Additional context for translation |

### Quality Options

| Option | Default | Description |
|--------|---------|-------------|
| `--quality <0-100>` | 85 | Quality threshold |
| `--max-iterations <n>` | 4 | Maximum refinement iterations |

### File Selection

| Option | Default | Description |
|--------|---------|-------------|
| `--include <patterns>` | `*.md,*.markdown` | File patterns to include (comma-separated) |
| `--exclude <patterns>` | none | File patterns to exclude (comma-separated) |

### Processing Options

| Option | Default | Description |
|--------|---------|-------------|
| `--parallel <n>` | 3 | Parallel file processing |
| `--chunk-size <tokens>` | 1024 | Max tokens per chunk |
| `--no-cache` | false | Disable translation cache |

### Output Options

| Option | Default | Description |
|--------|---------|-------------|
| `-f, --format <fmt>` | auto | Force output format (md\|html\|txt) |
| `--dry-run` | false | Show what would be translated |
| `--json` | false | Output results as JSON |
| `-v, --verbose` | false | Enable verbose logging |
| `-q, --quiet` | false | Suppress non-error output |

## Examples

### Basic Usage

```bash
# Translate all markdown files
llm-translate dir ./docs ./docs-ko -t ko

# With glossary
llm-translate dir ./docs ./docs-ko -t ko -g glossary.json
```

### File Selection

```bash
# Custom include pattern
llm-translate dir ./docs ./docs-ko -t ko --include "**/*.md"

# Multiple patterns
llm-translate dir ./docs ./docs-ko -t ko --include "*.md,*.markdown,*.mdx"

# Exclude certain directories
llm-translate dir ./docs ./docs-ko -t ko \
  --exclude "node_modules/**,dist/**,drafts/**"
```

### Parallel Processing

```bash
# Process 5 files in parallel
llm-translate dir ./docs ./docs-ko -t ko --parallel 5

# Sequential processing (for rate-limited APIs)
llm-translate dir ./docs ./docs-ko -t ko --parallel 1
```

### Quality Settings

```bash
# High quality for important docs
llm-translate dir ./docs ./docs-ko -t ko --quality 95 --max-iterations 6

# Faster processing with lower threshold
llm-translate dir ./docs ./docs-ko -t ko --quality 70 --max-iterations 2
```

### Preview Mode

```bash
# Show what would be translated
llm-translate dir ./docs ./docs-ko -t ko --dry-run
```

Output:
```
Dry run mode - no translation will be performed

Files to translate:
  getting-started.md → docs-ko/getting-started.md
  guide/setup.md → docs-ko/guide/setup.md
  api/reference.md → docs-ko/api/reference.md

Total: 3 file(s)
```

## Output Structure

Directory structure is preserved by default:

```
Input:                     Output:
docs/                      docs-ko/
├── getting-started.md     ├── getting-started.md
├── guide/                 ├── guide/
│   ├── setup.md           │   ├── setup.md
│   └── advanced.md        │   └── advanced.md
└── api/                   └── api/
    └── reference.md           └── reference.md
```

## Progress Reporting

### Normal Mode

```
ℹ Found 5 file(s) to translate
ℹ Input: ./docs
ℹ Output: ./docs-ko
ℹ Target language: ko
ℹ Parallel processing: 3 file(s) at a time
[1/5] getting-started.md ✓
[2/5] guide/setup.md ✓
[3/5] guide/advanced.md ✓
[4/5] api/reference.md ✓
[5/5] api/types.md ✓

────────────────────────────────────────────────────────
  Translation Summary
────────────────────────────────────────────────────────
  Files:      5 succeeded, 0 failed
  Duration:   45.2s
  Tokens:     12,450 input / 8,320 output
  Cache:      5,200 read / 2,100 write
────────────────────────────────────────────────────────
```

### JSON Output

```bash
llm-translate dir ./docs ./docs-ko -t ko --json
```

```json
{
  "success": true,
  "totalFiles": 5,
  "successCount": 5,
  "failCount": 0,
  "totalDuration": 45234,
  "tokensUsed": {
    "input": 12450,
    "output": 8320,
    "cacheRead": 5200,
    "cacheWrite": 2100
  },
  "files": [...]
}
```

## Best Practices

### 1. Preview First

```bash
llm-translate dir ./docs ./docs-ko -t ko --dry-run
```

### 2. Use Appropriate Parallelism

- Rate-limited APIs: `--parallel 1-2`
- High limits: `--parallel 5-10`
- Local (Ollama): `--parallel 1` (model limited)

### 3. Handle Large Projects

```bash
# Split by subdirectory for better control
llm-translate dir ./docs/guide ./docs-ko/guide -t ko
llm-translate dir ./docs/api ./docs-ko/api -t ko
```

### 4. Leverage Caching

Cache allows skipping unchanged content:

```bash
# First run: translates all
llm-translate dir ./docs ./docs-ko -t ko

# Second run: uses cache for unchanged content
llm-translate dir ./docs ./docs-ko -t ko
```

### 5. Quality by Content Type

```bash
# High quality for user-facing docs
llm-translate dir ./docs/public ./docs-ko/public -t ko --quality 95

# Standard quality for internal docs
llm-translate dir ./docs/internal ./docs-ko/internal -t ko --quality 80
```
