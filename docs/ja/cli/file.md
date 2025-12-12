# llm-translate file

単一ファイルを翻訳します。

## 概要

```bash
llm-translate file <input> [output] [options]
```

## 引数

| 引数 | 説明 |
|----------|-------------|
|`<input>`| 入力ファイルパス（必須） |
|`[output]`| 出力ファイルパス（オプション、デフォルトはstdout） |

## オプション

### 翻訳オプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`--source `,`-s`| 自動検出 | ソース言語コード |
|`--target `,`-t`| 必須 | ターゲット言語コード |
|`--glossary `,`-g`| なし | 用語集ファイルのパス |

### 品質オプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`--quality `,`-q`| 85 | 品質しきい値（0-100） |
|`--max-iterations`| 4 | 最大改善反復回数 |
|`--strict`| false | しきい値に達しない場合は失敗 |

### プロバイダーオプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`--provider `,`-p`| claude | プロバイダー名 |
|`--model `,`-m`| 異なる | モデル識別子 |

### 出力オプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`--output `,`-o`| stdout | 出力ファイルパス |
|`--overwrite`| false | 既存の出力を上書き |
|`--dry-run`| false | 実行内容を表示 |

### 高度なオプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`--no-cache`| false | プロンプトキャッシングを無効化 |
|`--chunk-size`| 1024 | チャンクあたりの最大トークン数 |

## 例

### 基本的な使用方法

```bash
# Translate to Korean, output to stdout
llm-translate file README.md --target ko

# Translate to file
llm-translate file README.md -o README.ko.md --target ko

# Specify source language
llm-translate file doc.md -o doc.ja.md --source en --target ja
```

### 用語集を使用する場合

```bash
# Use glossary for consistent terminology
llm-translate file api-docs.md -o api-docs.ko.md \
  --target ko \
  --glossary glossary.json
```

### 品質管理

```bash
# Higher quality threshold
llm-translate file important.md -o important.ko.md \
  --target ko \
  --quality 95 \
  --max-iterations 6

# Strict mode (fail if not met)
llm-translate file legal.md -o legal.ko.md \
  --target ko \
  --quality 95 \
  --strict
```

### プロバイダーの選択

```bash
# Use Claude Sonnet
llm-translate file doc.md -o doc.ko.md \
  --target ko \
  --provider claude \
  --model claude-sonnet-4-5-20250929

# Use OpenAI
llm-translate file doc.md -o doc.ko.md \
  --target ko \
  --provider openai \
  --model gpt-4o
```

### stdinから入力

```bash
# Pipe content
cat doc.md | llm-translate file - --target ko > doc.ko.md

# Use with other tools
curl https://example.com/doc.md | llm-translate file - --target ko
```

## 出力形式

### 通常モード

```
✓ Translated README.md → README.ko.md
  Quality: 92/85 (threshold met)
  Duration: 3.2s
```

### 詳細モード

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

## 言語コード

一般的な言語コード：

| コード | 言語 |
|------|----------|
|`en`| 英語 |
|`ko`| 韓国語 |
|`ja`| 日本語 |
|`zh`| 中国語（簡体字） |
|`zh-TW`| 中国語（繁体字） |
|`es`| スペイン語 |
|`fr`| フランス語 |
|`de`| ドイツ語 |

## エラーハンドリング

### ファイルが見つからない

```bash
$ llm-translate file missing.md --target ko
Error: File not found: missing.md
Exit code: 3
```

### 品質が満たされていない（厳密モード）

```bash
$ llm-translate file doc.md -o doc.ko.md --target ko --quality 99 --strict
Error: Quality threshold not met: 94/99
Exit code: 4
```

### APIエラー

```bash
$ llm-translate file doc.md --target ko
Error: Provider error: Rate limit exceeded
Exit code: 5
```
