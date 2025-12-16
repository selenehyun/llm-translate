# 変更履歴

::: info 翻訳について
英語以外のすべてのドキュメントは、Claude Sonnet 4を使用して自動翻訳されています。
:::

llm-translateのすべての重要な変更は、このファイルに記録されます。

形式は[Keep a Changelog](https://keepachangelog.com/en/1.0.0/)に基づいており、
このプロジェクトは[Semantic Versioning](https://semver.org/spec/v2.0.0.html)に準拠しています。

## [未リリース]

### 追加

- Claudeモデルのプロンプトキャッシングサポート（40-50%のコスト削減）
- 翻訳結果でのキャッシュトークン使用量追跡
- TranslationAgentの `enableCaching` オプション
- トークン使用量メタデータの `cacheRead` および `cacheWrite` フィールド
- MQM（多次元品質メトリクス）ベースの品質評価システム
- MAPSスタイルの翻訳前分析ステップ
- 翻訳モードサポート（`--mode fast|balanced|quality`）

### 変更

-`ChatMessage.content` がキャッシュ可能なテキスト部分をサポート
-`ChatResponse.usage` にキャッシュトークンメトリクスを含む
- デフォルトモデルを `claude-haiku-4-5-20251001` に更新

### ドキュメント

- Ollamaの品質警告を追加：信頼性の高い翻訳には14B+モデルが必要

## [0.1.0] - 2025-12-12

### 追加

- 初回リリース
- 単一ファイル翻訳（`llm-translate file`）
- ディレクトリ一括翻訳（`llm-translate dir`）
- 設定初期化（`llm-translate init`）
- 用語集管理（`llm-translate glossary`）
- Claude、OpenAI、Ollamaプロバイダーサポート
- Self-Refine品質制御ループ
- Markdown ASTベースのChunking
- 用語集の強制適用
- 品質しきい値設定
- 詳細出力モード

### プロバイダー

- Claude（claude-haiku-4-5、claude-sonnet-4-5、claude-opus-4-5）
- OpenAI（gpt-4o-mini、gpt-4o、gpt-4-turbo）
- Ollama（任意のローカルモデル）

### ドキュメント

- CLIリファレンスドキュメント
- APIリファレンスドキュメント
- 入門ガイド
- 設定ガイド
- 用語集ガイド
- 品質制御ガイド
- コスト最適化ガイド
