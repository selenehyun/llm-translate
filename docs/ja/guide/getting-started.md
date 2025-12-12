# はじめに

## インストール

### npm（推奨）

```bash
npm install -g @llm-translate/cli
```

### ソースからのインストール

```bash
git clone https://github.com/selenehyun/llm-translate.git
cd llm-translate
npm install
npm run build
npm link
```

## 前提条件

- Node.js 24 以上
- 以下の LLM プロバイダーのうち、少なくとも 1 つの API キー：
  - Anthropic（Claude）
  - OpenAI
  - Ollama（ローカル、API キー不要）

## 設定

### 1. API キーを設定する

```bash
# For Claude (recommended)
export ANTHROPIC_API_KEY=sk-ant-xxxxx

# For OpenAI
export OPENAI_API_KEY=sk-xxxxx

# For Ollama (no key needed, just ensure server is running)
export OLLAMA_BASE_URL=http://localhost:11434
```

### 2. 設定を初期化する（オプション）

```bash
llm-translate init
```

これにより、デフォルト設定を含む `.translaterc.json` ファイルが作成されます：

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

## 最初の翻訳

### 基本的な使用方法

```bash
# Translate a markdown file to Korean
llm-translate file README.md -o README.ko.md --target ko

# Translate with source language specified
llm-translate file docs/guide.md -o docs/guide.ja.md --source en --target ja
```

### 用語集を使用する

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
llm-translate file README.md -o README.ko.md --target ko --glossary glossary.json
```

### バッチ翻訳

ディレクトリ全体を翻訳します：

```bash
llm-translate dir ./docs ./docs-ko --target ko --glossary glossary.json
```

## 出力結果の理解

翻訳後、以下が表示されます：

```
✓ Translation complete
  Quality: 92/85 (threshold met)
  Iterations: 2
  Tokens: 1,234 input / 1,456 output
  Cache: 890 read / 234 written (78% hit rate)
  Duration: 3.2s
```

- **Quality**：最終スコア対しきい値
- **Iterations**：改善サイクルの回数
- **Tokens**：API トークン使用量
- **Cache**：プロンプトキャッシング統計（Claude のみ）
- **Duration**：合計処理時間

## 次のステップ

- [プロジェクトを設定する](./configuration)（最適な設定）
- [用語集をセットアップする](./glossary)（用語の一貫性）
- [品質管理を理解する](./quality-control)（チューニング）
- [コストを最適化する](./cost-optimization)（大規模プロジェクト）
