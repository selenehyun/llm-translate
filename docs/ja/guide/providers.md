# プロバイダー

llm-translate は複数の LLM プロバイダーに対応しています。それぞれ異なる強みとトレードオフがあります。

## サポートされているプロバイダー

| プロバイダー | キャッシング | 最適な用途 | セットアップの複雑さ |
|----------|---------|----------|------------------|
| Claude | フル | 品質 + コスト | 簡単 |
| OpenAI | 自動 | エコシステム | 簡単 |
| Ollama | なし | プライバシー/オフライン | 中程度 |

## Claude（推奨）

### Claude を選ぶ理由

- **prompt caching**: 最大 90% のコスト削減
- **高品質**: 優れた翻訳精度
- **長いコンテキスト**: 200K トークンのコンテキストウィンドウ
- **複数のティア**: Haiku（高速）、Sonnet（バランス型）、Opus（最高品質）

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

| モデル | ユースケース |
|-------|----------|
| Haiku | README ファイル、シンプルなドキュメント、大量処理 |
| Sonnet | 技術ドキュメント、API リファレンス |
| Opus | 法務、マーケティング、ニュアンスのあるコンテンツ |

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

### 使用時期

- 既に他のサービスで OpenAI を使用している
- 特定の OpenAI 機能が必要
- Azure OpenAI を使用したい（カスタム baseUrl を設定）

## Ollama

プライバシーまたはオフライン使用のためのローカル、自己ホスト型 LLM です。

### セットアップ

1. Ollama をインストールします：

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

2. モデルをプルします：

```bash
ollama pull llama3.1
```

3. サーバーを起動します：

```bash
ollama serve
```

### 使用方法

```bash
export OLLAMA_BASE_URL=http://localhost:11434

llm-translate file doc.md --target ko --provider ollama --model llama3.1
```

### 推奨モデル

| モデル | パラメータ | 品質 | 速度 |
|-------|-----------|---------|-------|
| llama3.1 | 8B | 良好 | 高速 |
| llama3.1:70b | 70B | 優秀 | 低速 |
| mistral | 7B | 良好 | 高速 |
| mixtral | 8x7B | 非常に良好 | 中程度 |

### 制限事項

- prompt caching なし（大規模ドキュメントではコストが高い）
- 品質はモデルに依存
- 良好なパフォーマンスにはローカル GPU が必要
- 一部のモデルでは言語サポートが限定的

### 使用時期

- 機密/プライベートドキュメント
- オフライン環境
- コスト最適化（API 料金なし）
- 実験

## プロバイダー比較

### 品質

```
Opus > Sonnet ≈ GPT-4o > Haiku ≈ GPT-4o-mini > Llama3.1
```

### コスト（100 万トークンあたり）

```
Ollama ($0) < Haiku ($1) < GPT-4o-mini ($0.15) < Sonnet ($3) < GPT-4o ($2.5) < Opus ($15)
```

### 速度

```
Haiku ≈ GPT-4o-mini > Sonnet ≈ GPT-4o > Opus > Ollama (varies)
```

## プロバイダーの切り替え

### CLI

```bash
# Different providers
llm-translate file doc.md --target ko --provider claude
llm-translate file doc.md --target ko --provider openai
llm-translate file doc.md --target ko --provider ollama
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

### プログラマティック

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

### 自己ホスト型

```json
{
  "provider": {
    "name": "ollama",
    "baseUrl": "https://your-server.com:11434"
  }
}
```
