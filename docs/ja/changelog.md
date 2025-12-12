# 変更履歴

llm-translate への全ての注目すべき変更は、このファイルに記録されます。

このフォーマットは [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) に基づいており、
このプロジェクトは [Semantic Versioning](https://semver.org/spec/v2.0.0.html) に準拠しています。

## [Unreleased]

### 追加

- Claude モデル向けプロンプトキャッシング対応（コスト削減率 40～50%）
- 翻訳結果内のキャッシュトークン使用量追跡
- TranslationAgent の `enableCaching` オプション
- トークン使用量メタデータの `cacheRead` および `cacheWrite` フィールド

### 変更

-`ChatMessage.content` がキャッシュ可能なテキスト部分に対応しました
-`ChatResponse.usage` にキャッシュトークンメトリクスが含まれるようになりました
- デフォルトモデルを `claude-haiku-4-5-20251001` に更新しました

## [0.1.0] - 2025-12-12

### 追加

- 初回リリース
- 単一ファイル翻訳（`llm-translate file`）
- ディレクトリ一括翻訳（`llm-translate dir`）
- 設定初期化（`llm-translate init`）
- 用語集管理（`llm-translate glossary`）
- Claude、OpenAI、Ollama プロバイダー対応
- Self-Refine 品質管理ループ
- Markdown AST ベースの Chunking
- 用語集の強制適用
- 品質しきい値設定
- 詳細出力モード

### プロバイダー

- Claude（claude-haiku-4-5、claude-sonnet-4-5、claude-opus-4-5）
- OpenAI（gpt-4o-mini、gpt-4o、gpt-4-turbo）
- Ollama（任意のローカルモデル）

### ドキュメント

- CLI リファレンスドキュメント
- API リファレンスドキュメント
- 入門ガイド
- 設定ガイド
- 用語集ガイド
- 品質管理ガイド
- コスト最適化ガイド
