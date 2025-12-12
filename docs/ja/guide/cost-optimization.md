# コスト最適化

このガイドでは、翻訳品質を維持しながらAPI コストを最小化するための戦略について説明します。

## コスト構造

### トークン価格（2024年時点）

| モデル | 入力 (1K) | 出力 (1K) | キャッシュ読み取り | キャッシュ書き込み |
|-------|-----------|-------------|------------|-------------|
| Claude Haiku 4.5 | $0.001 | $0.005 | $0.0001 | $0.00125 |
| Claude Sonnet 4.5 | $0.003 | $0.015 | $0.0003 | $0.00375 |
| Claude Opus 4.5 | $0.015 | $0.075 | $0.0015 | $0.01875 |
| GPT-4o-mini | $0.00015 | $0.0006 | 自動 | 自動 |
| GPT-4o | $0.0025 | $0.01 | 自動 | 自動 |

### コスト要因

1. **入力トークン**: ソーステキスト + 用語集 + プロンプト
2. **出力トークン**: 翻訳されたテキスト
3. **反復**: 品質改善サイクル（反復回数で乗算）
4. **キャッシュ効率**: プロンプトキャッシングによる節約

## 最適化戦略

### 1. 適切なモデルを選択する

```bash
# Most cost-effective for standard docs
llm-translate file doc.md --model claude-haiku-4-5-20251001

# Better quality when needed
llm-translate file important.md --model claude-sonnet-4-5-20250929
```

**モデル選択ガイド:**

| コンテンツタイプ | 推奨モデル |
|--------------|-------------------|
| README、ガイド | Haiku |
| API リファレンス | Haiku |
| ユーザー向けドキュメント | Sonnet |
| マーケティングコンテンツ | Sonnet/Opus |
| 法務/コンプライアンス | Opus |

### 2. 品質設定を最適化する

しきい値が低い = 反復が少ない = コストが低い

```bash
# Draft quality (faster, cheaper)
llm-translate file doc.md --quality 70 --max-iterations 2

# Standard quality
llm-translate file doc.md --quality 85 --max-iterations 4

# High quality (slower, more expensive)
llm-translate file doc.md --quality 95 --max-iterations 6
```

**コストへの影響:**

| 設定 | 平均反復回数 | 相対コスト |
|---------|---------------|---------------|
| quality=70, iter=2 | 1.5 | 0.5x |
| quality=85, iter=4 | 2.5 | 1.0x |
| quality=95, iter=6 | 4.0 | 1.6x |

### 3. プロンプトキャッシングを最大化する

キャッシングを有効にしてファイルをバッチで処理します:

```bash
# Process all files together to share cache
llm-translate dir ./docs ./docs-ko --target ko

# Not: Process one file at a time
```

詳細については、[プロンプトキャッシング](./prompt-caching)を参照してください。

### 4. 用語集のサイズを最適化する

大きな用語集はコストを増加させます。必要な用語のみを保持してください:

```bash
# Check glossary token count
llm-translate glossary stats --glossary glossary.json
```

**ベストプラクティス:**
- 未使用の用語を定期的に削除する
-`doNotTranslate` は控えめに使用する
- 大きな用語集をドメイン別に分割する

### 5. チャンクサイズの最適化

チャンクが大きい = API呼び出しが少ない = オーバーヘッドが低い

```json
{
  "chunking": {
    "maxTokens": 2048,
    "overlapTokens": 200
  }
}
```

**トレードオフ:**

| チャンクサイズ | API呼び出し | 品質 | コスト |
|------------|-----------|---------|------|
| 512 トークン | 多い | より高い | より高い |
| 1024 トークン | 中程度 | 良好 | 中程度 |
| 2048 トークン | 少ない | 許容可能 | より低い |

### 6. 翻訳キャッシュを使用する

翻訳済みチャンクをキャッシュして、再翻訳を回避します:

```json
{
  "paths": {
    "cache": "./.translate-cache"
  }
}
```

メリット:
- 再実行時に変更されていないコンテンツをスキップ
- 増分更新のコストを削減
- 後続の翻訳が高速化

## コスト推定

### 翻訳前

```bash
llm-translate estimate doc.md --target ko --glossary glossary.json
```

出力:
```
Estimated costs for doc.md:
  Chunks: 15
  Input tokens: ~18,000
  Output tokens: ~20,000 (estimated)
  Iterations: 2-3 (estimated)

  Model: claude-haiku-4-5-20251001
  Without caching: $0.12 - $0.18
  With caching: $0.05 - $0.08 (55-60% savings)
```

### 翻訳後

```bash
llm-translate file doc.md -o doc.ko.md --target ko --verbose
```

出力:
```
✓ Translation complete
  Tokens: 18,234 input / 21,456 output
  Cache: 12,000 read / 3,000 written
  Cost: $0.067 (estimated)
```

## バッチ処理の経済性

### 単一ファイル対バッチ

| アプローチ | キャッシュ効率 | 総コスト |
|----------|-----------------|------------|
| 10ファイルを順序付けで処理 | 0% | $1.00 |
| キャッシング付き10ファイル | 80% | $0.35 |
| バッチディレクトリ | 85% | $0.30 |

### 最適なバッチサイズ

```bash
# Process in batches of 20-50 files for best cache utilization
llm-translate dir ./docs ./docs-ko --target ko --concurrency 5
```

## コスト監視

### プロジェクト別追跡

コストログを作成します:

```bash
llm-translate file doc.md --cost-log ./costs.json
```

### コストアラート

予算制限を設定します:

```json
{
  "budget": {
    "maxCostPerFile": 0.50,
    "maxCostPerRun": 10.00,
    "warnAt": 0.80
  }
}
```

## 言語別コスト比較

ターゲット言語によって出力が異なります:

| ターゲット | 相対出力トークン |
|--------|----------------------|
| 韓国語 | 0.9-1.1x ソース |
| 日本語 | 0.8-1.0x ソース |
| 中国語 | 0.7-0.9x ソース |
| ドイツ語 | 1.1-1.3x ソース |
| スペイン語 | 1.1-1.2x ソース |

コスト推定にこれを考慮してください。

## まとめ: コスト削減チェックリスト

- [ ] 標準的なドキュメントには Haiku を使用する
- [ ] 品質しきい値を適切に設定する（必要以上に高くしない）
- [ ] プロンプトキャッシングを有効にして最大限に活用する
- [ ] ファイルをバッチで処理する
- [ ] 用語集をシンプルに保つ
- [ ] インクリメンタル更新のために翻訳キャッシュを使用する
- [ ] 詳細出力でコストを監視する
- [ ] 大規模なジョブの前に見積もりを行う
