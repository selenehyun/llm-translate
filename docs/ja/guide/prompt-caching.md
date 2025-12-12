# プロンプトキャッシング

プロンプトキャッシングは、繰り返されるコンテンツに対してAPI コストを最大90%削減するコスト最適化機能です。

## 仕組み

ドキュメントを翻訳する際、プロンプトの特定の部分は一定のままです：

- **システム指示**: 翻訳ルールとガイドライン
- **用語集**: ドメイン固有の用語

これらはキャッシュされ、複数のチャンク全体で再利用され、大幅なコスト削減を実現します。

```
Request 1 (First Chunk):
┌─────────────────────────────────┐
│ System Instructions (CACHED)    │ ◀─ Written to cache
├─────────────────────────────────┤
│ Glossary (CACHED)              │ ◀─ Written to cache
├─────────────────────────────────┤
│ Source Text (NOT cached)       │
└─────────────────────────────────┘

Request 2+ (Subsequent Chunks):
┌─────────────────────────────────┐
│ System Instructions (CACHED)    │ ◀─ Read from cache (90% off)
├─────────────────────────────────┤
│ Glossary (CACHED)              │ ◀─ Read from cache (90% off)
├─────────────────────────────────┤
│ Source Text (NOT cached)       │
└─────────────────────────────────┘
```

## コストへの影響

### 料金（Claude）

| トークンタイプ | コスト倍率 |
|------------|-----------------|
| 通常の入力 | 1.0x |
| キャッシュ書き込み | 1.25x（初回使用） |
| キャッシュ読み込み | 0.1x（以降） |
| 出力 | 1.0x |

### 計算例

500トークンの用語集を含む10チャンクのドキュメントの場合：

**キャッシングなし：**
```
10 chunks × 500 glossary tokens = 5,000 tokens
```

**キャッシング使用時：**
```
First chunk: 500 × 1.25 = 625 tokens (cache write)
9 chunks: 500 × 0.1 × 9 = 450 tokens (cache read)
Total: 1,075 tokens (78% savings)
```

## 要件

### 最小トークン閾値

プロンプトキャッシングには最小コンテンツ長が必要です：

| モデル | 最小トークン数 |
|-------|---------------|
| Claude Haiku 4.5 | 4,096 |
| Claude Haiku 3.5 | 2,048 |
| Claude Sonnet | 1,024 |
| Claude Opus | 1,024 |

これらの閾値以下のコンテンツはキャッシュされません。

### プロバイダーサポート

| プロバイダー | キャッシング対応 |
|----------|-----------------|
| Claude | ✅ 完全対応 |
| OpenAI | ✅ 自動対応 |
| Ollama | ❌ 利用不可 |

## 設定

Claudeではキャッシングがデフォルトで有効です。無効にするには：

```bash
llm-translate file doc.md -o doc.ko.md --target ko --no-cache
```

または設定で：

```json
{
  "provider": {
    "name": "claude",
    "caching": false
  }
}
```

## キャッシュパフォーマンスの監視

### CLI出力

```
✓ Translation complete
  Cache: 890 read / 234 written (78% hit rate)
```

### 詳細モード

```bash
llm-translate file doc.md -o doc.ko.md --target ko --verbose
```

チャンクごとのキャッシュ統計を表示します：

```
[Chunk 1/10] Cache: 0 read / 890 written
[Chunk 2/10] Cache: 890 read / 0 written
[Chunk 3/10] Cache: 890 read / 0 written
...
```

### プログラマティックアクセス

```typescript
const result = await engine.translateFile({
  input: 'doc.md',
  output: 'doc.ko.md',
  targetLang: 'ko',
});

console.log(result.metadata.tokensUsed);
// {
//   input: 5000,
//   output: 6000,
//   cacheRead: 8000,
//   cacheWrite: 1000
// }
```

## キャッシュ効率の最大化

### 1. 一貫した用語集を使用する

同じ用語集コンテンツ = 同じキャッシュキー

```bash
# Good: Same glossary for all files
llm-translate dir ./docs ./docs-ko --target ko --glossary glossary.json

# Less efficient: Different glossary per file
llm-translate file a.md --glossary a-glossary.json
llm-translate file b.md --glossary b-glossary.json
```

### 2. 関連ファイルをバッチ処理する

キャッシュは約5分間保持されます。ファイルをまとめて処理します：

```bash
# Efficient: Sequential processing shares cache
llm-translate dir ./docs ./docs-ko --target ko
```

### 3. ファイルをサイズ順に並べる

大きなファイルから始めてキャッシュをウォームアップします：

```bash
# Cache is populated by first file, reused by rest
llm-translate file large-doc.md ...
llm-translate file small-doc.md ...
```

### 4. 大きな用語集を戦略的に使用する

大きな用語集はキャッシングからより多くの利益を得られます：

| 用語集サイズ | キャッシュ削減 |
|---------------|---------------|
| 100トークン | 約70% |
| 500トークン | 約78% |
| 1000トークン以上 | 約80%以上 |

## トラブルシューティング

### キャッシングが機能しない

**症状：**`cacheRead` トークンが報告されない

**原因：**
1. コンテンツが最小閾値以下
2. リクエスト間でコンテンツが変更された
3. キャッシュTTLの期限切れ（5分）

**解決策：**
- 用語集 + システムプロンプトが最小トークン数を超えていることを確認する
- ファイルを短時間で処理する
- 詳細モードを使用してデバッグする

### キャッシュ書き込みコストが高い

**症状：** 予想より多くの `cacheWrite` が発生している

**原因：**
1. 多くのユニークな用語集
2. ファイルが離れた時間に処理されている
3. 実行間でのキャッシュ無効化

**解決策：**
- 用語集を統合する
- バッチ処理を使用する
- 5分以内のウィンドウで処理する
