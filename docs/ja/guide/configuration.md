# 設定

llm-translate は階層化された設定システムを使用しています。設定は以下の順序で適用されます（後の設定が前の設定を上書きします）：

1. 組み込みデフォルト
2. 設定ファイル (`.translaterc.json`)
3. 環境変数
4. CLI 引数

## 設定ファイル

プロジェクト ルートに `.translaterc.json` を作成してください：

```json
{
  "provider": {
    "name": "claude",
    "model": "claude-haiku-4-5-20251001",
    "apiKey": null
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

### プロバイダー設定

| オプション | 型 | デフォルト | 説明 |
|--------|------|---------|-------------|
|`name `| string |`"claude"`| プロバイダー名：` claude `、` openai `、` ollama`|
|`model`| string | 環境による | モデル識別子 |
|`apiKey`| string | null | API キー（環境変数の使用を推奨） |
|`baseUrl`| string | null | カスタム API エンドポイント |

### 翻訳設定

| オプション | 型 | デフォルト | 説明 |
|--------|------|---------|-------------|
|`qualityThreshold `| number |` 85`| 最小品質スコア（0-100） |
|`maxIterations `| number |` 4`| 最大改善反復回数 |
|`preserveFormatting `| boolean |` true`| Markdown/HTML 構造を保持 |

### Chunking 設定

| オプション | 型 | デフォルト | 説明 |
|--------|------|---------|-------------|
|`maxTokens `| number |` 1024`| チャンクあたりの最大トークン数 |
|`overlapTokens `| number |` 150`| チャンク間のコンテキストオーバーラップ |

### パス設定

| オプション | 型 | デフォルト | 説明 |
|--------|------|---------|-------------|
|`glossary`| string | null | 用語集ファイルのパス |
|`cache`| string | null | 翻訳キャッシュへのパス |

## 環境変数

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
OLLAMA_BASE_URL=http://localhost:11434

# Default Settings
LLM_TRANSLATE_PROVIDER=claude
LLM_TRANSLATE_MODEL=claude-haiku-4-5-20251001
LLM_TRANSLATE_QUALITY_THRESHOLD=85
```

## CLI オーバーライド例

```bash
# Override provider
llm-translate file doc.md -o doc.ko.md --target ko --provider openai

# Override model
llm-translate file doc.md -o doc.ko.md --target ko --model claude-sonnet-4-5-20250929

# Override quality threshold
llm-translate file doc.md -o doc.ko.md --target ko --quality 90

# Override max iterations
llm-translate file doc.md -o doc.ko.md --target ko --max-iterations 6
```

## プロジェクト単位の設定

モノレポまたはマルチプロジェクト セットアップの場合、各プロジェクト ディレクトリに `.translaterc.json` を配置してください：

```
my-monorepo/
├── packages/
│   ├── frontend/
│   │   ├── .translaterc.json  # Frontend-specific terms
│   │   └── docs/
│   └── backend/
│       ├── .translaterc.json  # Backend-specific terms
│       └── docs/
└── .translaterc.json          # Shared defaults
```

llm-translate は現在のディレクトリから親ディレクトリへ向かって設定ファイルを検索します。

## モデル選択ガイド

| モデル | 速度 | 品質 | コスト | 最適な用途 |
|-------|-------|---------|------|----------|
|`claude-haiku-4-5-20251001`| 高速 | 良好 | 低 | 一般的なドキュメント、大量処理 |
|`claude-sonnet-4-5-20250929`| 中程度 | 優秀 | 中程度 | 技術ドキュメント、品質重視 |
|`claude-opus-4-5-20251101`| 低速 | 最高 | 高 | 複雑なコンテンツ、ニュアンスのあるテキスト |
|`gpt-4o-mini`| 高速 | 良好 | 低 | Haiku の代替 |
|`gpt-4o`| 中程度 | 優秀 | 中程度 | Sonnet の代替 |

## 品質しきい値ガイドライン

| しきい値 | ユースケース |
|-----------|----------|
| 70-75 | ドラフト翻訳、社内ドキュメント |
| 80-85 | 標準ドキュメント（デフォルト） |
| 90-95 | 公開向け、マーケティング コンテンツ |
| 95+ | 法務、医療、規制対象コンテンツ |

しきい値が高いほど、より多くの反復が必要になり、コストが増加します。
