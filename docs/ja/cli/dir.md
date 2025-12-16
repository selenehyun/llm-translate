# llm-translate dir

::: info 翻訳について
英語以外のドキュメントはすべてClaude Sonnet 4を使用して自動翻訳されています。
:::

ディレクトリ内のすべてのファイルを翻訳します。

## 概要

```bash
llm-translate dir <input> <output> [options]
```

## 引数

| 引数 | 説明 |
|----------|-------------|
|`<input>`| 入力ディレクトリパス（必須） |
|`<output>`| 出力ディレクトリパス（必須） |

## オプション

### 言語オプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`-s, --source-lang <lang>`| 設定のデフォルト | ソース言語コード |
|`-t, --target-lang <lang>`| 必須 | ターゲット言語コード |

### 翻訳オプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`-g, --glossary <path>`| なし | 用語集ファイルのパス |
|`-p, --provider <name>`|` claude`| LLMプロバイダー (claude\|openai\|ollama) |
|`-m, --model <name>`| プロバイダーのデフォルト | モデル名 |
|`--context <text>`| なし | 翻訳のための追加コンテキスト |

### 品質オプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`--quality <0-100>`| 85 | 品質しきい値 |
|`--max-iterations <n>`| 4 | 最大改良反復回数 |

### ファイル選択

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`--include <patterns>`|`*.md,*.markdown`| 含めるファイルパターン（カンマ区切り） |
|`--exclude <patterns>`| なし | 除外するファイルパターン（カンマ区切り） |

### 処理オプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`--parallel <n>`| 3 | 並列ファイル処理 |
|`--chunk-size <tokens>`| 1024 | チャンクあたりの最大トークン数 |
|`--no-cache`| false | 翻訳キャッシュを無効化 |

### 出力オプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`-f, --format <fmt>`| auto | 出力フォーマットを強制 (md\|html\|txt) |
|`--dry-run`| false | 翻訳される内容を表示 |
|`--json`| false | 結果をJSONで出力 |
|`-v, --verbose`| false | 詳細ログを有効化 |
|`-q, --quiet`| false | エラー以外の出力を抑制 |

## 例

### 基本的な使用方法

```bash
# Translate all markdown files
llm-translate dir ./docs ./docs-ko -s en -t ko

# With glossary
llm-translate dir ./docs ./docs-ko -s en -t ko -g glossary.json
```

### ファイル選択

```bash
# Custom include pattern
llm-translate dir ./docs ./docs-ko -s en -t ko --include "**/*.md"

# Multiple patterns
llm-translate dir ./docs ./docs-ko -s en -t ko --include "*.md,*.markdown,*.mdx"

# Exclude certain directories
llm-translate dir ./docs ./docs-ko -s en -t ko \
  --exclude "node_modules/**,dist/**,drafts/**"
```

### 並列処理

```bash
# Process 5 files in parallel
llm-translate dir ./docs ./docs-ko -s en -t ko --parallel 5

# Sequential processing (for rate-limited APIs)
llm-translate dir ./docs ./docs-ko -s en -t ko --parallel 1
```

### 品質設定

```bash
# High quality for important docs
llm-translate dir ./docs ./docs-ko -s en -t ko --quality 95 --max-iterations 6

# Faster processing with lower threshold
llm-translate dir ./docs ./docs-ko -s en -t ko --quality 70 --max-iterations 2
```

### プレビューモード

```bash
# Show what would be translated
llm-translate dir ./docs ./docs-ko -s en -t ko --dry-run
```

出力:
```
Dry run mode - no translation will be performed

Files to translate:
  getting-started.md → docs-ko/getting-started.md
  guide/setup.md → docs-ko/guide/setup.md
  api/reference.md → docs-ko/api/reference.md

Total: 3 file(s)
```

## 出力構造

ディレクトリ構造はデフォルトで保持されます：

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

## 進捗レポート

### 通常モード

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

### JSON出力

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

## ベストプラクティス

### 1. まずプレビューを実行

```bash
llm-translate dir ./docs ./docs-ko -s en -t ko --dry-run
```

### 2. 適切な並列度を使用

- レート制限のあるAPI:`--parallel 1-2`
- 高い制限:`--parallel 5-10`
- ローカル (Ollama):`--parallel 1`(モデル制限あり)

### 3. 大規模プロジェクトの処理

```bash
# Split by subdirectory for better control
llm-translate dir ./docs/guide ./docs-ko/guide -s en -t ko
llm-translate dir ./docs/api ./docs-ko/api -s en -t ko
```

### 4. キャッシングの活用

キャッシュにより変更されていないコンテンツをスキップできます：

```bash
# First run: translates all
llm-translate dir ./docs ./docs-ko -s en -t ko

# Second run: uses cache for unchanged content
llm-translate dir ./docs ./docs-ko -s en -t ko
```

### 5. コンテンツタイプ別の品質設定

```bash
# High quality for user-facing docs
llm-translate dir ./docs/public ./docs-ko/public -s en -t ko --quality 95

# Standard quality for internal docs
llm-translate dir ./docs/internal ./docs-ko/internal -s en -t ko --quality 80
```
