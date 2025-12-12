---
layout: home

hero:
  name: llm-translate
  text: LLM駆動ドキュメント翻訳
  tagline: 用語集強制、品質管理、コスト最適化を備えたドキュメント翻訳
  actions:
    - theme: brand
      text: はじめる
      link: ./guide/getting-started
    - theme: alt
      text: GitHubで表示
      link: https://github.com/selenehyun/llm-translate

features:
  - icon: 📚
    title: 用語集の強制
    details: 強制された用語集により、翻訳全体で一貫した用語を確保し、誤訳を防ぎます。
  - icon: 🔄
    title: Self-Refine 品質管理
    details: AI駆動の品質評価を用いた反復的な翻訳改善により、品質しきい値を満たします。
  - icon: 💰
    title: コスト最適化
    details: プロンプトキャッシングにより、用語集やシステムプロンプトなどの繰り返しコンテンツのAPIコストを最大90%削減します。
  - icon: 🔌
    title: マルチプロバイダー対応
    details: Claude、OpenAI、Ollamaに対応。ワークフローを変更せずにプロバイダーを切り替えられます。
  - icon: 📄
    title: フォーマット保持
    details: 翻訳中にMarkdown、コードブロック、リンク、ドキュメント構造を保持します。
  - icon: ⚡
    title: バッチ処理
    details: 並列処理と進捗追跡でディレクトリ全体を翻訳します。
---

## クイックスタート

```bash
# Install globally
npm install -g @llm-translate/cli

# Set your API key
export ANTHROPIC_API_KEY=your-key-here

# Translate a file
llm-translate file README.md -o README.ko.md --target ko
```

## llm-translateを選ぶ理由

従来の翻訳ツールは技術ドキュメント翻訳に課題があります：

- **用語の不一貫性** - 「APIエンドポイント」が毎回異なるように翻訳される
- **フォーマットの破損** - コードブロックとMarkdown形式が崩れる
- **品質管理なし** - LLMの出力をそのまま受け入れるしかない

llm-translateはこれらの問題を以下で解決します：

1. **用語集の強制** - 用語を一度定義し、すべての場所に適用
2. **AST ベースのChunking** - ドキュメント構造を保持
3. **品質ベースの改善** - 品質しきい値に達するまで反復
4. **プロンプトキャッシング** - 大規模ドキュメントのコストを削減
