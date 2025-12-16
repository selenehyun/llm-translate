# llm-translate file

::: info 翻訳について
英語以外のドキュメントはすべてClaude Sonnet 4を使用して自動翻訳されています。
:::

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
|`--source-lang `,`-s`| 必須 | ソース言語コード |
|`--target-lang `,`-t`| 必須 | ターゲット言語コード |
|`--glossary `,`-g`| なし | 用語集ファイルのパス |

### 品質オプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`--quality`| 85 | 品質しきい値（0-100） |
|`--max-iterations`| 4 | 最大改良反復回数 |
|`--strict-quality`| false | しきい値を満たさない場合に失敗 |
|`--strict-glossary`| false | 用語集の用語が適用されない場合に失敗 |

### プロバイダーオプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`--provider `,`-p`| claude | プロバイダー名 |
|`--model `,`-m`| 可変 | モデル識別子 |

### 出力オプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`--output `,`-o`| auto | 出力ファイルパス |
|`--format `,`-f`| auto | 出力フォーマットを強制（md\|html\|txt） |
|`--dry-run`| false | 実行される内容を表示 |
|`--json`| false | 結果をJSONで出力 |
|`--verbose `,`-v`| false | 詳細ログを有効化 |
|`--quiet `,`-q`| false | エラー以外の出力を抑制 |

### 高度なオプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`--no-cache`| false | 翻訳キャッシュを無効化 |
|`--chunk-size`| 1024 | チャンクあたりの最大トークン数 |
|`--context`| なし | 翻訳のための追加コンテキスト |

## 例

### 基本的な使用方法

```bash
# Translate to Korean
llm-translate file README.md -o README.ko.md -s en -t ko

# With explicit output path
llm-translate file README.md --output README.ko.md --source-lang en --target-lang ko

# Specify source and target languages
llm-translate file doc.md -o doc.ja.md --source-lang en --target-lang ja
```

### 用語集を使用

```bash
# Use glossary for consistent terminology
llm-translate file api-docs.md -o api-docs.ko.md \
  -s en -t ko \
  --glossary glossary.json
```

### 品質管理

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

### プロバイダー選択

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

### stdinから

```bash
# Pipe content (uses stdin mode when no TTY)
cat doc.md | llm-translate -s en -t ko > doc.ko.md

# Use with other tools
curl https://example.com/doc.md | llm-translate -s en -t ko
```

## 出力フォーマット

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
$ llm-translate file missing.md -s en -t ko
Error: Could not read file 'missing.md'
Exit code: 3
```

### 品質が満たされない（厳格モード）

```bash
$ llm-translate file doc.md -o doc.ko.md -s en -t ko --quality 99 --strict-quality
Error: Quality threshold not met: 94/99
Exit code: 4
```

### APIエラー

```bash
$ llm-translate file doc.md --target ko
Error: Provider error: Rate limit exceeded
Exit code: 5
```
