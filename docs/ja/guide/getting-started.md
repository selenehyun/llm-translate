# はじめに

::: info 翻訳について
英語以外のドキュメントはすべてClaude Sonnet 4を使用して自動翻訳されています。
:::

## インストール

### npm（推奨）

```bash
npm install -g @llm-translate/cli
```

### ソースから

```bash
git clone https://github.com/selenehyun/llm-translate.git
cd llm-translate
npm install
npm run build
npm link
```

## 前提条件

- Node.js 24以上
- 少なくとも1つのLLMプロバイダーのAPIキー：
  - Anthropic（Claude）
  - OpenAI
  - Ollama（ローカル、APIキー不要）

## 設定

### 1. APIキーの設定

```bash
# For Claude (recommended)
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# For OpenAI
export OPENAI_API_KEY=sk-xxxxx

# For Ollama (no key needed, just ensure server is running)
# See the Ollama guide for setup: ./ollama
export OLLAMA_BASE_URL=http://localhost:11434
```

### 2. 設定の初期化（オプション）

```bash
llm-translate init
```

これによりデフォルト設定の `.translaterc.json` ファイルが作成されます：

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
  "paths": {
    "glossary": "./glossary.json"
  }
}
```

## 初回翻訳

### 基本的な使用方法

```bash
# Translate a markdown file to Korean
llm-translate file README.md -o README.ko.md -s en -t ko

# Using long option names
llm-translate file docs/guide.md -o docs/guide.ja.md --source-lang en --target-lang ja
```

### 用語集の使用

1. `glossary.json` ファイルを作成します：

```json
{
  "sourceLanguage": "en",
  "terms": [
    {
      "source": "component",
      "targets": { "ko": "컴포넌트" },
      "context": "UI component"
    },
    {
      "source": "prop",
      "targets": { "ko": "프롭" },
      "context": "React prop"
    },
    {
      "source": "TypeScript",
      "doNotTranslate": true
    }
  ]
}
```

2. 用語集を使用して翻訳します：

```bash
llm-translate file README.md -o README.ko.md -s en -t ko --glossary glossary.json
```

### バッチ翻訳

ディレクトリ全体を翻訳します：

```bash
llm-translate dir ./docs ./docs-ko -s en -t ko --glossary glossary.json
```

## 出力の理解

翻訳後、以下が表示されます：

```
✓ Translation complete
  Quality: 92/85 (threshold met)
  Iterations: 2
  Tokens: 1,234 input / 1,456 output
  Cache: 890 read / 234 written (78% hit rate)
  Duration: 3.2s
```

- **Quality**: 最終スコア対しきい値
- **Iterations**: 改良サイクル数
- **Tokens**: APIトークン使用量
- **Cache**: プロンプトキャッシング統計（Claudeのみ）
- **Duration**: 総処理時間

## 次のステップ

- 最適な設定のための[プロジェクト設定](./configuration)
- 一貫した用語のための[用語集の設定](./glossary)
- [品質管理](./quality-control)と調整の理解
- 大規模プロジェクトのための[コスト最適化](./cost-optimization)
- プライベートでオフライン翻訳のための[Ollamaでのローカル実行](./ollama)
