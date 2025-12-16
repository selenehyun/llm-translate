# llm-translate init

::: info 翻訳について
英語以外のドキュメントはすべてClaude Sonnet 4を使用して自動翻訳されています。
:::

プロジェクト用の設定ファイルを初期化します。

## 概要

```bash
llm-translate init [options]
```

## オプション

| オプション | デフォルト | 説明 |
|--------|---------|-------------|
|`--provider `,`-p`| claude | デフォルトプロバイダー |
|`--model `,`-m`| 可変 | デフォルトモデル |
|`--quality`| 85 | デフォルト品質しきい値 |
|`--glossary`| なし | 用語集テンプレートを作成 |
|`--force `,`-f`| false | 既存の設定を上書き |

## 例

### 基本的な初期化

```bash
llm-translate init
```

`.translaterc.json` を作成します：

```json
{
  "provider": {
    "name": "claude",
    "model": "claude-haiku-4-5-20251001"
  },
  "translation": {
    "qualityThreshold": 85,
    "maxIterations": 4
  },
  "paths": {}
}
```

### プロバイダーを指定

```bash
llm-translate init --provider openai --model gpt-4o
```

### 用語集テンプレートと一緒に

```bash
llm-translate init --glossary
```

`glossary.json` も作成します：

```json
{
  "sourceLanguage": "en",
  "version": "1.0.0",
  "terms": [
    {
      "source": "example",
      "targets": {
        "ko": "예시"
      },
      "context": "Replace with your terms"
    }
  ]
}
```

### カスタム品質設定

```bash
llm-translate init --quality 95
```

## インタラクティブモード

オプションなしで実行すると、initはインタラクティブに動作します：

```
$ llm-translate init

llm-translate Configuration Setup

? Select provider: (Use arrow keys)
❯ claude
  openai
  ollama

? Select model: (Use arrow keys)
❯ claude-haiku-4-5-20251001 (fast, cost-effective)
  claude-sonnet-4-5-20250929 (balanced)
  claude-opus-4-5-20251101 (highest quality)

? Quality threshold: (85)
? Create glossary template? (y/N)

✓ Created .translaterc.json
```

## 出力ファイル

### .translaterc.json

```json
{
  "$schema": "https://llm-translate.dev/schema.json",
  "provider": {
    "name": "claude",
    "model": "claude-haiku-4-5-20251001"
  },
  "translation": {
    "qualityThreshold": 85,
    "maxIterations": 4,
    "preserveFormatting": true
  },
  "chunking": {
    "maxTokens": 1024,
    "overlapTokens": 150
  },
  "paths": {
    "glossary": "./glossary.json",
    "cache": "./.translate-cache"
  }
}
```

### glossary.json (--glossaryオプション使用時)

```json
{
  "$schema": "https://llm-translate.dev/glossary-schema.json",
  "sourceLanguage": "en",
  "version": "1.0.0",
  "description": "Project glossary",
  "terms": []
}
```

## 既存設定の上書き

```bash
# Will fail if config exists
llm-translate init
# Error: .translaterc.json already exists. Use --force to overwrite.

# Force overwrite
llm-translate init --force
```
