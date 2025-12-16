# llm-translate glossary

::: info Translations
All non-English documentation is automatically translated using Claude Sonnet 4.
:::

Manage glossary files for consistent terminology.

## Synopsis

```bash
llm-translate glossary <subcommand> [options]
```

## Subcommands

### list

List all terms in a glossary.

```bash
llm-translate glossary list --glossary glossary.json
```

Options:
| Option | Description |
|--------|-------------|
| `--glossary`, `-g` | Path to glossary file (required) |
| `--target`, `-t` | Filter by target language |
| `--format` | Output format: `table`, `json` |

Examples:

```bash
# List all terms
llm-translate glossary list -g glossary.json

# Filter by target language
llm-translate glossary list -g glossary.json --target ko

# JSON output
llm-translate glossary list -g glossary.json --format json
```

Output:
```
Glossary: glossary.json (15 terms)

Source          | Korean (ko)      | Japanese (ja)    | Flags
----------------|------------------|------------------|-------
component       | 컴포넌트         | コンポーネント    |
prop            | 프롭             | プロップ          |
state           | 상태             | ステート          |
TypeScript      | -                | -                | DNT
API             | -                | -                | DNT, CS

DNT = Do Not Translate, CS = Case Sensitive
```

### validate

Validate glossary file structure and content.

```bash
llm-translate glossary validate --glossary glossary.json
```

Options:
| Option | Description |
|--------|-------------|
| `--glossary`, `-g` | Path to glossary file (required) |
| `--strict` | Fail on warnings |

Examples:

```bash
# Basic validation
llm-translate glossary validate -g glossary.json

# Strict mode
llm-translate glossary validate -g glossary.json --strict
```

Output:
```
Validating glossary.json...

✓ Valid JSON structure
✓ Required fields present
✓ 15 terms found

Warnings:
  - Term "component" has no context
  - Term "hook" missing Japanese translation

✓ Validation passed (2 warnings)
```

### add

Add a new term to the glossary.

```bash
llm-translate glossary add <source> [options]
```

Options:
| Option | Description |
|--------|-------------|
| `--glossary`, `-g` | Path to glossary file (required) |
| `--target` | Target translation (format: `lang=value`) |
| `--context` | Context for the term |
| `--dnt` | Mark as "do not translate" |
| `--case-sensitive` | Mark as case sensitive |

Examples:

```bash
# Add with translations
llm-translate glossary add "container" \
  -g glossary.json \
  --target ko="컨테이너" \
  --target ja="コンテナ"

# Add do-not-translate term
llm-translate glossary add "Kubernetes" \
  -g glossary.json \
  --dnt

# Add with context
llm-translate glossary add "instance" \
  -g glossary.json \
  --target ko="인스턴스" \
  --context "Cloud computing instance"
```

### remove

Remove a term from the glossary.

```bash
llm-translate glossary remove <source> --glossary glossary.json
```

Examples:

```bash
llm-translate glossary remove "deprecated-term" -g glossary.json
```

### update

Update an existing term.

```bash
llm-translate glossary update <source> [options]
```

Options:
| Option | Description |
|--------|-------------|
| `--glossary`, `-g` | Path to glossary file (required) |
| `--target` | Update target translation |
| `--context` | Update context |
| `--dnt` | Set/unset do not translate |

Examples:

```bash
# Update translation
llm-translate glossary update "component" \
  -g glossary.json \
  --target ko="컴포넌트 요소"

# Add context
llm-translate glossary update "state" \
  -g glossary.json \
  --context "React component state"
```

### stats

Show glossary statistics.

```bash
llm-translate glossary stats --glossary glossary.json
```

Output:
```
Glossary Statistics: glossary.json

Terms: 15
  - With translations: 12
  - Do not translate: 3

Languages:
  - Korean (ko): 12 terms
  - Japanese (ja): 10 terms
  - Chinese (zh): 8 terms

Token estimate: ~450 tokens
```

### merge

Merge multiple glossaries.

```bash
llm-translate glossary merge \
  --input glossary-a.json \
  --input glossary-b.json \
  --output merged.json
```

Options:
| Option | Description |
|--------|-------------|
| `--input`, `-i` | Input glossary files (multiple) |
| `--output`, `-o` | Output merged glossary |
| `--strategy` | Conflict resolution: `first`, `last`, `error` |

### export

Export glossary to different formats.

```bash
llm-translate glossary export --glossary glossary.json --format csv
```

Options:
| Option | Description |
|--------|-------------|
| `--format` | Export format: `csv`, `tsv`, `xlsx` |
| `--output`, `-o` | Output file path |

## Best Practices

### Organizing Large Glossaries

```bash
# Split by domain
glossaries/
├── common.json      # Shared terms
├── frontend.json    # UI terminology
├── backend.json     # Server terminology
└── devops.json      # Infrastructure terms

# Merge for use
llm-translate glossary merge \
  -i glossaries/common.json \
  -i glossaries/frontend.json \
  -o project-glossary.json
```

### Version Control

Include glossary in version control:

```bash
git add glossary.json
git commit -m "Add project glossary"
```

### Regular Maintenance

```bash
# Validate before commits
llm-translate glossary validate -g glossary.json --strict

# Review stats periodically
llm-translate glossary stats -g glossary.json
```
