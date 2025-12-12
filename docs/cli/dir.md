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

### File Selection

| Option | Default | Description |
|--------|---------|-------------|
| `--pattern` | `**/*.md` | Glob pattern for files |
| `--exclude` | none | Patterns to exclude |
| `--recursive`, `-r` | true | Process subdirectories |

### Translation Options

| Option | Default | Description |
|--------|---------|-------------|
| `--source`, `-s` | auto-detect | Source language code |
| `--target`, `-t` | required | Target language code |
| `--glossary`, `-g` | none | Path to glossary file |

### Quality Options

| Option | Default | Description |
|--------|---------|-------------|
| `--quality`, `-q` | 85 | Quality threshold (0-100) |
| `--max-iterations` | 4 | Maximum refinement iterations |
| `--strict` | false | Fail if any file doesn't meet threshold |

### Processing Options

| Option | Default | Description |
|--------|---------|-------------|
| `--concurrency`, `-c` | 3 | Parallel file processing |
| `--continue-on-error` | false | Skip failed files |

### Output Options

| Option | Default | Description |
|--------|---------|-------------|
| `--overwrite` | false | Overwrite existing files |
| `--dry-run` | false | Show what would be done |
| `--preserve-structure` | true | Maintain directory structure |

## Examples

### Basic Usage

```bash
# Translate all markdown files
llm-translate dir ./docs ./docs-ko --target ko

# With glossary
llm-translate dir ./docs ./docs-ko --target ko --glossary glossary.json
```

### File Selection

```bash
# Only markdown files
llm-translate dir ./docs ./docs-ko --target ko --pattern "**/*.md"

# Markdown and HTML
llm-translate dir ./docs ./docs-ko --target ko --pattern "**/*.{md,html}"

# Exclude certain directories
llm-translate dir ./docs ./docs-ko --target ko \
  --exclude "**/node_modules/**" \
  --exclude "**/dist/**"
```

### Parallel Processing

```bash
# Process 5 files in parallel
llm-translate dir ./docs ./docs-ko --target ko --concurrency 5

# Sequential (for rate limit sensitive APIs)
llm-translate dir ./docs ./docs-ko --target ko --concurrency 1
```

### Error Handling

```bash
# Continue even if some files fail
llm-translate dir ./docs ./docs-ko --target ko --continue-on-error

# Strict mode: fail on any quality issue
llm-translate dir ./docs ./docs-ko --target ko --strict
```

### Preview Mode

```bash
# Show what would be translated
llm-translate dir ./docs ./docs-ko --target ko --dry-run
```

Output:
```
Dry run - no files will be modified

Files to translate:
  docs/getting-started.md → docs-ko/getting-started.md
  docs/guide/setup.md → docs-ko/guide/setup.md
  docs/api/reference.md → docs-ko/api/reference.md

Total: 3 files
Estimated cost: $0.15 - $0.25
```

## Output Structure

### Default (Preserve Structure)

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

### Flat Structure

```bash
llm-translate dir ./docs ./docs-ko --target ko --no-preserve-structure
```

```
Input:                     Output:
docs/                      docs-ko/
├── getting-started.md     ├── getting-started.md
├── guide/                 ├── guide-setup.md
│   └── setup.md           └── api-reference.md
└── api/
    └── reference.md
```

## Progress Reporting

### Normal Mode

```
Translating docs → docs-ko (ko)
[1/5] docs/getting-started.md ✓ (92/85)
[2/5] docs/guide/setup.md ✓ (88/85)
[3/5] docs/guide/advanced.md ✓ (91/85)
[4/5] docs/api/reference.md ✓ (87/85)
[5/5] docs/api/types.md ✓ (90/85)

✓ Completed 5/5 files
  Average quality: 89.6
  Total time: 45s
  Total cost: ~$0.18
```

### With Errors

```
Translating docs → docs-ko (ko)
[1/5] docs/getting-started.md ✓ (92/85)
[2/5] docs/guide/setup.md ✗ API rate limit
[3/5] docs/guide/advanced.md ✓ (91/85)
[4/5] docs/api/reference.md ✓ (87/85)
[5/5] docs/api/types.md ✓ (90/85)

⚠ Completed 4/5 files (1 failed)
  Failed:
    - docs/guide/setup.md: API rate limit
```

## Best Practices

### 1. Estimate First

```bash
llm-translate dir ./docs ./docs-ko --target ko --dry-run
```

### 2. Use Appropriate Concurrency

- Rate-limited APIs: `--concurrency 1-2`
- High limits: `--concurrency 5-10`
- Local (Ollama): `--concurrency 1` (model limited)

### 3. Handle Large Projects

```bash
# Split by subdirectory
llm-translate dir ./docs/guide ./docs-ko/guide --target ko
llm-translate dir ./docs/api ./docs-ko/api --target ko
```

### 4. Incremental Updates

Cache allows skipping unchanged files:

```bash
# First run: translates all
llm-translate dir ./docs ./docs-ko --target ko

# Second run: only new/changed files
llm-translate dir ./docs ./docs-ko --target ko
```

### 5. Quality by Directory

```bash
# High quality for user-facing docs
llm-translate dir ./docs/public ./docs-ko/public --target ko --quality 95

# Standard quality for internal docs
llm-translate dir ./docs/internal ./docs-ko/internal --target ko --quality 80
```
