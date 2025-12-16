# llm-translateとは？

::: info 翻訳について
英語以外のドキュメントはすべてClaude Sonnet 4を使用して自動翻訳されています。
:::

llm-translateは、大規模言語モデルを使用してドキュメントを翻訳するCLIツールです。一貫性、正確性、フォーマット保持が重要な技術文書に特化して設計されています。

## 主要機能

### 用語集の強制適用

ドメイン固有の専門用語を一度定義すれば、すべてのドキュメントで一貫して翻訳されることを保証します。

```json
{
  "terms": [
    {
      "source": "API endpoint",
      "targets": { "ko": "API 엔드포인트", "ja": "APIエンドポイント" }
    },
    {
      "source": "Kubernetes",
      "doNotTranslate": true
    }
  ]
}
```

### Self-Refine品質制御

llm-translateは一度翻訳して終わりではありません。反復的な改善プロセスを使用します：
