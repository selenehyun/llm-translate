---
layout: home

hero:
  name: llm-translate
  text: LLMを活用した文書翻訳
  tagline: 用語集の強制適用、品質管理、コスト最適化による文書翻訳
  actions:
    - theme: brand
      text: はじめる
      link: ./guide/getting-started
    - theme: alt
      text: GitHubで見る
      link: https://github.com/selenehyun/llm-translate

features:
  - icon: 📚
    title: 用語集の強制適用
    details: 誤訳されることのない強制適用される用語集により、翻訳全体で一貫した専門用語を確保します。
  - icon: 🔄
    title: Self-Refine品質管理
    details: AIを活用した品質評価による反復的な翻訳改善で、品質しきい値を満たします。
  - icon: 💰
    title: コスト最適化
    details: プロンプトキャッシングにより、用語集やシステムプロンプトなどの繰り返しコンテンツのAPIコストを最大90%削減します。
  - icon: 🔌
    title: マルチプロバイダー対応
    details: Claude、OpenAI、Ollamaに対応。ワークフローを変更することなくプロバイダーを切り替えできます。
  - icon: 📄
    title: フォーマット保持
    details: 翻訳中にMarkdownフォーマット、コードブロック、リンク、文書構造を維持します。
  - icon: ⚡
    title: バッチ処理
    details: 並列処理と進捗追跡により、ディレクトリ全体を翻訳します。
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

## なぜllm-translateなのか？

従来の翻訳ツールは技術文書で問題を抱えています：

- **一貫性のない専門用語** - 「APIエンドポイント」が毎回異なって翻訳される
- **壊れたフォーマット** - コードブロックやMarkdownが破損する
- **品質管理なし** - LLMの出力をそのまま受け入れる

llm-translateはこれらの問題を以下で解決します：
