# llm-translate 用語集

一貫した用語の管理のための用語集ファイルを管理します。

## 概要

```bash
llm-translate glossary <subcommand> [options]
```

## サブコマンド

### list

用語集内のすべての用語を一覧表示します。

```bash
llm-translate glossary list --glossary glossary.json
```

オプション:
| オプション | 説明 |
|--------|-------------|
|`--glossary `,`-g`| 用語集ファイルへのパス（必須） |
|`--target `,`-t`| ターゲット言語でフィルタリング |
|`--format `| 出力形式:` table `,` json`|

例:

```bash
# List all terms
llm-translate glossary list -g glossary.json

# Filter by target language
llm-translate glossary list -g glossary.json --target ko

# JSON output
llm-translate glossary list -g glossary.json --format json
```

出力:
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

用語集ファイルの構造とコンテンツを検証します。

```bash
llm-translate glossary validate --glossary glossary.json
```

オプション:
| オプション | 説明 |
|--------|-------------|
|`--glossary `,`-g`| 用語集ファイルへのパス（必須） |
|`--strict`| 警告で失敗 |

例:

```bash
# Basic validation
llm-translate glossary validate -g glossary.json

# Strict mode
llm-translate glossary validate -g glossary.json --strict
```

出力:
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

用語集に新しい用語を追加します。

```bash
llm-translate glossary add <source> [options]
```

オプション:
| オプション | 説明 |
|--------|-------------|
|`--glossary `,`-g`| 用語集ファイルへのパス（必須） |
|`--target `| ターゲット翻訳（形式:` lang=value`） |
|`--context`| 用語のコンテキスト |
|`--dnt`| 「翻訳しない」としてマーク |
|`--case-sensitive`| 大文字小文字を区別するとしてマーク |

例:

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

用語集から用語を削除します。

```bash
llm-translate glossary remove <source> --glossary glossary.json
```

例:

```bash
llm-translate glossary remove "deprecated-term" -g glossary.json
```

### update

既存の用語を更新します。

```bash
llm-translate glossary update <source> [options]
```

オプション:
| オプション | 説明 |
|--------|-------------|
|`--glossary `,`-g`| 用語集ファイルへのパス（必須） |
|`--target`| ターゲット翻訳を更新 |
|`--context`| コンテキストを更新 |
|`--dnt`| 翻訳しないを設定/解除 |

例:

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

用語集の統計情報を表示します。

```bash
llm-translate glossary stats --glossary glossary.json
```

出力:
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

複数の用語集をマージします。

```bash
llm-translate glossary merge \
  --input glossary-a.json \
  --input glossary-b.json \
  --output merged.json
```

オプション:
| オプション | 説明 |
|--------|-------------|
|`--input `,`-i`| 入力用語集ファイル（複数） |
|`--output `,`-o`| マージされた用語集の出力 |
|`--strategy `| 競合解決:` first `,` last `,` error`|

### export

用語集を異なる形式にエクスポートします。

```bash
llm-translate glossary export --glossary glossary.json --format csv
```

オプション:
| オプション | 説明 |
|--------|-------------|
|`--format `| エクスポート形式:` csv `,` tsv `,` xlsx`|
|`--output `,`-o`| 出力ファイルパス |

## ベストプラクティス

### 大規模な用語集の整理

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

### バージョン管理

用語集をバージョン管理に含めます:

```bash
git add glossary.json
git commit -m "Add project glossary"
```

### 定期的なメンテナンス

```bash
# Validate before commits
llm-translate glossary validate -g glossary.json --strict

# Review stats periodically
llm-translate glossary stats -g glossary.json
```
