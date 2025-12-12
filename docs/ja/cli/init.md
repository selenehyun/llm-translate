# llm-translate init

プロジェクトの設定ファイルを初期化します。

## Synopsis

```bash
llm-translate init [options]
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
|`--provider `,`-p`| claude | デフォルトプロバイダー |
|`--model `,`-m`| varies | デフォルトモデル |
|`--quality`| 85 | デフォルト品質しきい値 |
|`--glossary`| none | 用語集テンプレートを作成 |
|`--force `,`-f`| false | 既存の設定を上書き |

## Examples

### Basic Initialization

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

### With Provider

```bash
llm-translate init --provider openai --model gpt-4o
```

### With Glossary Template

```bash
llm-translate init --glossary
```

また、 `glossary.json` も作成します：

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

### Custom Quality

```bash
llm-translate init --quality 95
```

## Interactive Mode

オプションなしで実行すると、initは対話モードで実行されます：

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

## Output Files

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

### glossary.json (with --glossary)

```json
{
  "$schema": "https://llm-translate.dev/glossary-schema.json",
  "sourceLanguage": "en",
  "version": "1.0.0",
  "description": "Project glossary",
  "terms": []
}
```

## Overwriting Existing Config

```bash
# Will fail if config exists
llm-translate init
# Error: .translaterc.json already exists. Use --force to overwrite.

# Force overwrite
llm-translate init --force
```
