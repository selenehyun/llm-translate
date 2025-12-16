# プロバイダー

::: info 翻訳について
英語以外のドキュメントはすべてClaude Sonnet 4を使用して自動翻訳されています。
:::

llm-translateは複数のLLMプロバイダーをサポートしています。それぞれ異なる強みとトレードオフがあります。

## サポートされているプロバイダー

| プロバイダー | キャッシング | 最適な用途 | セットアップの複雑さ |
|----------|---------|----------|------------------|
| Claude | フル | 品質 + コスト | 簡単 |
| OpenAI | 自動 | エコシステム | 簡単 |
| Ollama | なし | プライバシー/オフライン | 中程度 |

## Claude（推奨）

### なぜClaudeなのか？

- **プロンプトキャッシング**: 最大90%のコスト削減
- **高品質**: 優れた翻訳精度
- **長いコンテキスト**: 200Kトークンのコンテキストウィンドウ
- **複数のティア**: Haiku（高速）、Sonnet（バランス）、Opus（最高品質）

### セットアップ

```bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### モデル選択

```bash
# Fast and cheap (default)
llm-translate file doc.md --target ko --model claude-haiku-4-5-20251001

# Balanced quality/cost
llm-translate file doc.md --target ko --model claude-sonnet-4-5-20250929

# Highest quality
llm-translate file doc.md --target ko --model claude-opus-4-5-20251101
```

### 各モデルの使い分け

| モデル | 使用例 |
|-------|----------|
| Haiku | READMEファイル、シンプルなドキュメント、大量処理 |
| Sonnet | 技術文書、APIリファレンス |
| Opus | 法的文書、マーケティング、ニュアンスが重要なコンテンツ |

## OpenAI

### セットアップ

```bash
export OPENAI_API_KEY=sk-xxxxx
```

### 使用方法

```bash
llm-translate file doc.md --target ko --provider openai --model gpt-4o
```

### 利用可能なモデル

| モデル | 速度 | 品質 | コスト |
|-------|-------|---------|------|
| gpt-4o-mini | 高速 | 良好 | 非常に低い |
| gpt-4o | 中程度 | 優秀 | 中程度 |
| gpt-4-turbo | 中程度 | 優秀 | 高い |

### 使用する場面

- 他のサービスでOpenAIを既に使用している場合
- 特定のOpenAI機能が必要な場合
- Azure OpenAIを希望する場合（カスタムbaseUrlを設定）

## Ollama

プライバシーやオフライン使用のためのローカル、セルフホスト型LLMです。APIキーは不要です。

::: warning モデルによって品質が異なります
Ollamaの翻訳品質は**モデル選択に大きく依存します**。信頼できる翻訳結果を得るには：

- **最小要件**: 14B+パラメータモデル（例：`qwen2.5:14b ` 、`llama3.1:14b`）
- **推奨**: 32B+モデル（例：`qwen2.5:32b ` 、`llama3.3:70b`）
- **非推奨**: 7B未満のモデルは一貫性がなく、しばしば使用できない翻訳を生成します

小さなモデル（3B、7B）はシンプルなコンテンツでは動作する可能性がありますが、技術文書では頻繁に失敗し、不完全な出力を生成したり、フォーマット指示を無視したりします。
:::

### クイックセットアップ

```bash
# 1. Install (macOS)
brew install ollama

# 2. Pull qwen2.5:14b (recommended)
ollama pull qwen2.5:14b

# 3. Translate
llm-translate file doc.md -s en -t ko --provider ollama --model qwen2.5:14b
```

### 推奨モデル

| モデル | RAM | 品質 | 最適な用途 |
|-------|-----|---------|----------|
|`qwen2.5:14b`| 16GB | 非常に良好 | **最適なバランス（推奨）** |
|`qwen2.5:32b`| 32GB | 優秀 | より高い品質 |
|`llama3.1:8b`| 8GB | 良好 | 軽量 |
|`llama3.2`| 4GB | 普通 | シンプルなコンテンツのみ |

### 使用する場面

- 機密/プライベートドキュメント
- オフライン環境
- コスト最適化（API料金なし）
- シンプルから中程度の複雑さのコンテンツ

::: tip 完全ガイド
完全なセットアップ手順、GPU最適化、トラブルシューティング、高度な設定については、[Ollamaを使用したローカル翻訳](./ollama)をご覧ください。
:::

## プロバイダー比較

### 品質

```
Opus > Sonnet ≈ GPT-4o > Haiku ≈ GPT-4o-mini > Qwen2.5:32b > Qwen2.5:14b
```

### コスト（100万トークンあたり）

```
Ollama ($0) < GPT-4o-mini ($0.15) < Haiku ($1) < GPT-4o ($2.5) < Sonnet ($3) < Opus ($15)
```

### 速度

```
Haiku ≈ GPT-4o-mini > Sonnet ≈ GPT-4o > Opus > Ollama (varies with hardware)
```

## プロバイダーの切り替え

### CLI

```bash
# Different providers
llm-translate file doc.md -s en -t ko --provider claude
llm-translate file doc.md -s en -t ko --provider openai
llm-translate file doc.md -s en -t ko --provider ollama
```

### 設定ファイル

```json
{
  "provider": {
    "name": "openai",
    "model": "gpt-4o"
  }
}
```

### プログラム的

```typescript
import {
  createClaudeProvider,
  createOpenAIProvider,
  createOllamaProvider,
  TranslationEngine,
} from '@llm-translate/cli';

// Switch providers easily
const providers = {
  claude: createClaudeProvider(),
  openai: createOpenAIProvider(),
  ollama: createOllamaProvider(),
};

const engine = new TranslationEngine({
  provider: providers[selectedProvider],
});
```

## フォールバック設定

信頼性のためにフォールバックプロバイダーを設定します：

```json
{
  "provider": {
    "name": "claude",
    "model": "claude-haiku-4-5-20251001",
    "fallback": [
      { "name": "openai", "model": "gpt-4o-mini" },
      { "name": "ollama", "model": "llama3.1" }
    ]
  }
}
```

## カスタムエンドポイント

### Azure OpenAI

```json
{
  "provider": {
    "name": "openai",
    "baseUrl": "https://your-resource.openai.azure.com",
    "apiKey": "your-azure-key"
  }
}
```

### セルフホスト

```json
{
  "provider": {
    "name": "ollama",
    "baseUrl": "https://your-server.com:11434"
  }
}
```
