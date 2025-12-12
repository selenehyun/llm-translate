# Chunking 戦略

大規模なドキュメントは翻訳のためにチャンクに分割されます。Chunking を理解することで、品質とコストを最適化するのに役立ちます。

## Chunking が必要な理由

LLM にはコンテキスト制限があり、焦点を絞ったコンテンツでより良いパフォーマンスを発揮します。

| 理由 | 説明 |
|--------|-------------|
| **コンテキスト制限** | モデルには最大入力サイズがあります |
| **品質** | より小さいチャンクはより集中した注意を受けます |
| **コスト** | 繰り返されるコンテンツのプロンプトキャッシングが可能です |
| **進捗** | 進捗追跡と再開が可能になります |

## デフォルト設定

```json
{
  "chunking": {
    "maxTokens": 1024,
    "overlapTokens": 150
  }
}
```

## チャンクサイズオプション

### maxTokens

チャンクあたりの最大トークン数（プロンプトのオーバーヘッドを除く）。

| サイズ | 最適な用途 | トレードオフ |
|------|----------|-----------|
| 512 | 高い品質要件 | API 呼び出しが増加 |
| **1024** | 一般的な用途（デフォルト） | バランス型 |
| 2048 | コスト最適化 | 品質が低下する可能性があります |

### overlapTokens

前のチャンクからのコンテキストは、チャンク境界全体の連続性を確保します。

```
Chunk 1: [Content A                    ]
Chunk 2:            [overlap][Content B                    ]
Chunk 3:                              [overlap][Content C  ]
```

::: tip 推奨オーバーラップ
`maxTokens` 値の 10～15% を使用してください。1024 トークンの場合、100～150 のオーバーラップトークンが適切に機能します。
:::

## Markdown 対応 Chunking

llm-translate は、ドキュメント構造を尊重する AST ベースの Chunking を使用します。

### 保持される境界

チャンカーは以下の要素を分割しません。

| 要素 | 動作 |
|---------|----------|
| ヘッダー | セクション境界が保持されます |
| コードブロック | 常に完全に保持されます |
| リスト | 可能な場合、アイテムがグループ化されます |
| テーブル | チャンク全体で分割されません |
| 段落 | 自然な境界で分割されます |

### 例

::: details Chunking の例を表示するにはクリック

**入力ドキュメント:**

```markdown
# Introduction

This is the introduction paragraph that explains
the purpose of the document.

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

npm install @llm-translate/cli
```

**結果:**

```
Chunk 1: # Introduction + paragraph
Chunk 2: ## Getting Started + ### Prerequisites + list
Chunk 3: ### Installation + code block
```

:::

## 設定

::: code-group

```bash [CLI]
llm-translate file doc.md --target ko --chunk-size 2048
```

```json [.translaterc.json]
{
  "chunking": {
    "maxTokens": 2048,
    "overlapTokens": 200,
    "preservePatterns": [
      "```[\\s\\S]*?```",
      "\\|[^\\n]+\\|"
    ]
  }
}
```

```typescript [Programmatic]
import { chunkContent } from '@llm-translate/cli';

const chunks = chunkContent(content, {
  maxTokens: 1024,
  overlapTokens: 150,
});
```

:::

## 最適化プリセット

優先事項に基づいて選択してください。

::: code-group

```json [Quality Focus]
{
  "chunking": {
    "maxTokens": 512,
    "overlapTokens": 100
  }
}
```

```json [Cost Focus]
{
  "chunking": {
    "maxTokens": 2048,
    "overlapTokens": 50
  }
}
```

```json [Long Documents]
{
  "chunking": {
    "maxTokens": 1500,
    "overlapTokens": 150
  },
  "translation": {
    "maxIterations": 3
  }
}
```

:::

::: info 各プリセットを使用する場合
- **品質重視**: 技術ドキュメント、法的コンテンツ
- **コスト重視**: ブログ投稿、一般的なコンテンツ
- **長いドキュメント**: 書籍、包括的なガイド
:::

## コンテンツ保持

### 保持されるもの

llm-translate は特定のコンテンツを翻訳から自動的に保持します。

| コンテンツタイプ | 例 | 動作 |
|--------------|---------|----------|
| コードブロック |` __INLINE_CODE_16__ `| 翻訳されません |
| インラインコード |`` ` variable ` ``| 保持されます |
| URL |`https://...`| 保持されます |
| ファイルパス |`./path/to/file`| 保持されます |

### リンク処理

リンク URL は保持されますが、リンクテキストは翻訳されます。

```markdown
[Getting Started](./getting-started.md)
↓
[시작하기](./getting-started.md)
```

## デバッグ

### チャンクのプレビュー

`--dry-run` を使用して、ドキュメントがどのように分割されるかを確認できます。

```bash
llm-translate file doc.md --target ko --dry-run --verbose
```

出力:
```
Document Analysis:
  Total tokens: ~5,200
  Chunks: 6
  Average chunk size: ~867 tokens

Chunk breakdown:
  [1] Lines 1-45 (Introduction) - 823 tokens
  [2] Lines 46-89 (Getting Started) - 912 tokens
  [3] Lines 90-134 (Configuration) - 878 tokens
  ...
```

### プログラムによる検査

```typescript
import { chunkContent, getChunkStats } from '@llm-translate/cli';

const chunks = chunkContent(content, { maxTokens: 1024 });
const stats = getChunkStats(chunks);

console.log(`Total chunks: ${stats.count}`);
console.log(`Average size: ${stats.avgTokens} tokens`);
```

## トラブルシューティング

::: warning チャンクが小さすぎる
**症状**: 多くの小さいチャンク、過度な API 呼び出し

**解決策**:`maxTokens` を増やしてください
```json
{ "chunking": { "maxTokens": 2048 } }
```
:::

::: warning チャンク間でコンテキストが失われている
**症状**: セクション間で用語が一貫していない

**解決策**: オーバーラップを増やすか、用語集を使用してください
```json
{ "chunking": { "overlapTokens": 300 } }
```
:::

::: danger コードブロックが分割されている
**症状**: 出力にシンタックスエラーがある

**原因**: これは起こらないはずです。発生した場合は、[問題を報告してください](https://github.com/selenehyun/llm-translate/issues)。
:::

::: warning テーブルが破損している
**症状**: テーブルフォーマットが壊れている

**解決策**: テーブルは自動的に完全に保持されるはずです。非常に大きなテーブル（100 行以上）の場合は、手動で分割することを検討してください。
:::
