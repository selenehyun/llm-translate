# Chunking戦略

::: info 翻訳について
英語以外のドキュメントはすべてClaude Sonnet 4を使用して自動翻訳されています。
:::

大きなドキュメントは翻訳のためにチャンクに分割されます。Chunkingを理解することで、品質とコストを最適化できます。

## なぜChunkingが必要なのか？

LLMにはコンテキスト制限があり、集中したコンテンツでより良いパフォーマンスを発揮します：

| 理由 | 説明 |
|--------|-------------|
| **コンテキスト制限** | モデルには最大入力サイズがあります |
| **品質** | 小さなチャンクはより集中した注意を得られます |
| **コスト** | 繰り返しコンテンツのキャッシングが可能になります |
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

チャンクあたりの最大トークン数（プロンプトオーバーヘッドを除く）。

| サイズ | 最適な用途 | トレードオフ |
|------|----------|-----------|
| 512 | 高品質要件 | より多くのAPI呼び出し |
| **1024** | 一般的な使用（デフォルト） | バランス型 |
| 2048 | コスト最適化 | 品質が低下する可能性 |

### overlapTokens

前のチャンクからのコンテキストにより、境界を越えた継続性を確保します。

```
Chunk 1: [Content A                    ]
Chunk 2:            [overlap][Content B                    ]
Chunk 3:                              [overlap][Content C  ]
```

::: tip 推奨オーバーラップ
`maxTokens` 値の10-15%を使用してください。1024トークンの場合、100-150のオーバーラップトークンが適切です。
:::

## Markdown対応Chunking

llm-translateは、ドキュメント構造を尊重するAST基盤のChunkingを使用します。

### 保持される境界

チャンカーは以下の要素を分割しません：

| 要素 | 動作 |
|---------|----------|
| ヘッダー | セクション境界が保持されます |
| コードブロック | 常に完全に保持されます |
| リスト | 可能な場合はアイテムがグループ化されます |
| テーブル | チャンク間で分割されません |
| 段落 | 自然な境界で分割されます |

### 例

::: details Chunkingの例を見るにはクリック

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

優先度に基づいて選択してください：

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

::: info 各プリセットを使用するタイミング
- **品質重視**: 技術文書、法的コンテンツ
- **コスト重視**: ブログ投稿、一般的なコンテンツ
- **長文書**: 書籍、包括的なガイド
:::

## コンテンツ保護

### 保護される内容

llm-translateは特定のコンテンツを翻訳から自動的に保護します：

| コンテンツタイプ | 例 | 動作 |
|--------------|---------|----------|
| コードブロック |` __INLINE_CODE_16__ `| 翻訳されません |
| インラインコード |`` ` variable ` ``| 保持されます |
| URL |`https://...`| 保持されます |
| ファイルパス |`./path/to/file`| 保持されます |

### リンクの処理

リンクURLは保持されますが、リンクテキストは翻訳されます：

```markdown
[Getting Started](./getting-started.md)
↓
[시작하기](./getting-started.md)
```

## デバッグ

### チャンクのプレビュー

`--dry-run` を使用して、ドキュメントがどのようにチャンク化されるかを確認できます：

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
**症状**: 多くの小さなチャンク、過度なAPI呼び出し

**解決策**:`maxTokens` を増やしてください
```json
{ "chunking": { "maxTokens": 2048 } }
```
:::

::: warning チャンク間でコンテキストが失われる
**症状**: セクション間で用語が一貫しない

**解決策**: オーバーラップを増やすか用語集を使用してください
```json
{ "chunking": { "overlapTokens": 300 } }
```
:::

::: danger コードブロックが分割される
**症状**: 出力に構文エラー

**原因**: これは決して起こるべきではありません。もし発生した場合は、[問題を報告](https://github.com/selenehyun/llm-translate/issues)してください。
:::

::: warning テーブルが破損する
**症状**: テーブルフォーマットが壊れる

**解決策**: テーブルは自動的に完全に保持されるはずです。非常に大きなテーブル（100行以上）の場合は、手動で分割することを検討してください。
