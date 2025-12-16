# Ollamaを使用したローカル翻訳

::: info 翻訳について
英語以外のドキュメントはすべてClaude Sonnet 4を使用して自動翻訳されています。
:::

Ollamaを使用してllm-translateを完全にオフラインで実行できます。APIキーは不要で、機密文書の完全なプライバシーを確保できます。

::: warning モデルによって品質が異なります
Ollamaの翻訳品質は**モデル選択に大きく依存します**。信頼性の高い翻訳結果を得るには：

- **最小要件**: 14B以上のパラメータモデル（例：`qwen2.5:14b ` 、`llama3.1:8b`）
- **推奨**: 32B以上のモデル（例：`qwen2.5:32b ` 、`llama3.3:70b`）
- **非推奨**: 7B未満のモデルは一貫性がなく、しばしば使用できない翻訳を生成します

小さなモデル（3B、7B）は簡単なコンテンツでは動作する場合がありますが、技術文書では頻繁に失敗し、不完全な出力を生成したり、フォーマット指示を無視したりします。
:::

## なぜOllamaなのか？

- **プライバシー**: ドキュメントがマシンから外部に送信されません
- **APIコストなし**: 初期設定後は無制限の翻訳が可能
- **オフライン**: インターネット接続なしで動作
- **カスタマイズ可能**: ドメインに合わせてモデルを微調整可能

## システム要件

### 最小要件（14Bモデル）

- **RAM**: 16GB（qwen2.5:14bなどの14Bモデル用）
- **ストレージ**: 20GBの空き容量
- **CPU**: 最新のマルチコアプロセッサ

### 推奨要件

- **RAM**: 32GB以上（qwen2.5:32bなどの大型モデル用）
- **GPU**: 16GB以上のVRAMを持つNVIDIAまたはApple Silicon（M2/M3/M4）
- **ストレージ**: 複数モデル用に100GB以上

### GPUサポート

| プラットフォーム | GPU | サポート |
|----------|-----|---------|
| macOS | Apple Silicon（M1/M2/M3/M4） | 優秀 |
| Linux | NVIDIA（CUDA） | 優秀 |
| Linux | AMD（ROCm） | 良好 |
| Windows | NVIDIA（CUDA） | 良好 |
| Windows | AMD | 限定的 |

## インストール

### macOS

```bash
# Using Homebrew (recommended)
brew install ollama

# Or download from https://ollama.ai
```

### Linux

```bash
# One-line installer
curl -fsSL https://ollama.ai/install.sh | sh

# Or using package managers
# Ubuntu/Debian
curl -fsSL https://ollama.ai/install.sh | sh

# Arch Linux
yay -S ollama
```

### Windows

[ollama.ai](https://ollama.ai/download/windows)からインストーラーをダウンロードしてください。

### Docker

```bash
# CPU only
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama

# With NVIDIA GPU
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

## クイックスタート

### 1. Ollamaサーバーを開始

```bash
# Start the server (runs in background)
ollama serve
```

::: tip
macOSとWindowsでは、インストール後にOllamaがバックグラウンドサービスとして自動的に開始されます。
:::

### 2. モデルをダウンロード

```bash
# Recommended: Qwen 2.5 14B (best multilingual support for local)
ollama pull qwen2.5:14b

# Alternative: Llama 3.2 (lighter, good for English-centric docs)
ollama pull llama3.2
```

### 3. 翻訳

```bash
# Basic translation with qwen2.5:14b
llm-translate file README.md -o README.ko.md -s en -t ko --provider ollama --model qwen2.5:14b

# With specific model
llm-translate file doc.md -s en -t ja --provider ollama --model qwen2.5:14b
```

::: tip 翻訳用のQwen 2.5
Qwen 2.5は韓国語、日本語、中国語、および主要なヨーロッパ言語を含む29言語をサポートしています。14Bバージョンは16GBのRAMで動作しながら、翻訳タスクに優れた品質を提供します。
:::

## 翻訳に推奨されるモデル

### 最高品質（32B以上）

| モデル | サイズ | VRAM | 言語 | 品質 |
|-------|------|------|-----------|---------|
|`llama3.3`| 70B | 40GB以上 | 100以上 | 優秀 |
|`qwen2.5:32b`| 32B | 20GB以上 | 29 | 優秀 |
|`llama3.1:70b`| 70B | 40GB以上 | 8 | 非常に良好 |

### 最高の言語サポートを持つ軽量版

リソースが限られたシステムでは、**Qwen2.5**が最高の多言語サポート（29言語）を提供します。

| モデル | パラメータ | RAM | 言語 | 品質 | 最適用途 |
|-------|-----------|-----|-----------|---------|----------|
|`qwen2.5:3b`| 3B | 3GB | 29 | 良好 | **バランス型（推奨）** |
|`qwen2.5:7b`| 7B | 6GB | 29 | 非常に良好 | 品質重視 |
|`gemma3:4b`| 4B | 4GB | 多数 | 良好 | 翻訳最適化 |
|`llama3.2`| 3B | 4GB | 8 | 良好 | 英語中心の文書 |

### 超軽量（2GB RAM未満）

| モデル | パラメータ | RAM | 言語 | 品質 |
|-------|-----------|-----|-----------|---------|
|`qwen2.5:1.5b`| 1.5B | 2GB | 29 | 基本 |
|`qwen2.5:0.5b`| 0.5B | 1GB | 29 | 基本 |
|`gemma3:1b`| 1B | 1.5GB | 多数 | 基本 |
|`llama3.2:1b`| 1B | 2GB | 8 | 基本 |

::: tip 多言語対応のQwen
Qwen2.5は韓国語、日本語、中国語、および主要なヨーロッパ言語を含む29言語をサポートしています。英語以外の翻訳作業では、Qwenが軽量な選択肢として最適な場合が多いです。
:::

### モデルのダウンロード

```bash
# List available models
ollama list

# Recommended for translation (14B+)
ollama pull qwen2.5:14b   # Best multilingual (29 languages)
ollama pull qwen2.5:32b   # Higher quality, needs 32GB RAM
ollama pull llama3.1:8b   # Good quality, lighter

# Lightweight options (may have quality issues)
ollama pull qwen2.5:7b    # Better quality than 3B
ollama pull llama3.2      # Good for English-centric docs

# Other options
ollama pull mistral-nemo
```

## 設定

### 環境変数

```bash
# Default server URL (optional, this is the default)
export OLLAMA_BASE_URL=http://localhost:11434

# Custom server location
export OLLAMA_BASE_URL=http://192.168.1.100:11434
```

### 設定ファイル

```json
{
  "provider": {
    "name": "ollama",
    "model": "qwen2.5:14b",
    "baseUrl": "http://localhost:11434"
  },
  "translation": {
    "qualityThreshold": 75,
    "maxIterations": 3
  }
}
```

::: tip
ローカルモデルの場合、過度な改良イテレーションを避けるため、より低い `qualityThreshold`（75）を推奨します。信頼性のある結果を得るには14B以上のモデルを使用してください。
:::

### モデル固有の設定

異なる文書タイプに対して：

```bash
# Best quality - qwen2.5:14b (recommended for most use cases)
llm-translate file api-spec.md -s en -t ko \
  --provider ollama \
  --model qwen2.5:14b \
  --quality 75

# Higher quality with 32B model (requires 32GB RAM)
llm-translate file legal-doc.md -s en -t ko \
  --provider ollama \
  --model qwen2.5:32b \
  --quality 80

# README files - lighter model for simple content
llm-translate file README.md -s en -t ko \
  --provider ollama \
  --model llama3.2 \
  --quality 70

# Large documentation sets - balance speed and quality
llm-translate dir ./docs ./docs-ko -s en -t ko \
  --provider ollama \
  --model qwen2.5:14b \
  --parallel 2
```

## パフォーマンス最適化

### GPU アクセラレーション

#### NVIDIA（Linux/Windows）

```bash
# Check CUDA availability
nvidia-smi

# Ollama automatically uses CUDA if available
ollama serve
```

#### Apple Silicon（macOS）

Metalアクセラレーションは、M1/M2/M3/M4 Macで自動的に有効になります。

```bash
# Check GPU usage
sudo powermetrics --samplers gpu_power
```

### メモリ管理

```bash
# Set GPU memory limit (Linux with NVIDIA)
CUDA_VISIBLE_DEVICES=0 ollama serve

# Limit CPU threads
OLLAMA_NUM_PARALLEL=2 ollama serve
```

### 大きな文書の最適化

```bash
# Reduce chunk size for memory-constrained systems
llm-translate file large-doc.md --target ko \
  --provider ollama \
  --chunk-size 512

# Disable caching to reduce memory usage
llm-translate file doc.md --target ko \
  --provider ollama \
  --no-cache

# Single-threaded processing for stability
llm-translate dir ./docs ./docs-ko --target ko \
  --provider ollama \
  --parallel 1
```

## リモートOllamaサーバー

### サーバーセットアップ

サーバーマシンで：

```bash
# Allow external connections
OLLAMA_HOST=0.0.0.0 ollama serve
```

::: warning セキュリティ
Ollamaは信頼できるネットワークでのみ公開してください。リモートアクセスにはVPNまたはSSHトンネルの使用を検討してください。
:::

### SSHトンネル（推奨）

```bash
# Create secure tunnel to remote server
ssh -L 11434:localhost:11434 user@remote-server

# Then use as normal
llm-translate file doc.md --target ko --provider ollama
```

### 直接接続

```bash
# Set remote server URL
export OLLAMA_BASE_URL=http://remote-server:11434

llm-translate file doc.md --target ko --provider ollama
```

### チームサーバー用Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

volumes:
  ollama_data:
```

## トラブルシューティング

### 接続エラー

```
Error: Cannot connect to Ollama server at http://localhost:11434
```

**解決策：**

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start the server
ollama serve

# Check for port conflicts
lsof -i :11434
```

### モデルが見つからない

```
Error: Model "llama3.2" not found. Pull it with: ollama pull llama3.2
```

**解決策：**

```bash
# Download the model
ollama pull llama3.2

# Verify installation
ollama list
```

### メモリ不足

```
Error: Out of memory. Try a smaller model or reduce chunk size.
```

**解決策：**

```bash
# Use a smaller model
ollama pull llama3.2:1b
llm-translate file doc.md --target ko --provider ollama --model llama3.2:1b

# Reduce chunk size
llm-translate file doc.md --target ko --provider ollama --chunk-size 256

# Close other applications to free RAM
```

### パフォーマンスの低下

**解決策：**
