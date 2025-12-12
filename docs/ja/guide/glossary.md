# 用語集

用語集機能により、すべての翻訳で一貫した用語を確保できます。用語を一度定義すれば、毎回同じように翻訳されます。

## 用語集ファイル形式

`glossary.json` ファイルを作成してください：

```json
{
  "sourceLanguage": "en",
  "version": "1.0.0",
  "terms": [
    {
      "source": "component",
      "targets": {
        "ko": "컴포넌트",
        "ja": "コンポーネント",
        "zh": "组件"
      },
      "context": "UI component in React/Vue"
    }
  ]
}
```

## 用語の構造

### 基本的な用語

```json
{
  "source": "endpoint",
  "targets": {
    "ko": "엔드포인트",
    "ja": "エンドポイント"
  }
}
```

### コンテキスト付き

コンテキストにより、LLM は用語の使用方法を正確に理解できます：

```json
{
  "source": "state",
  "targets": { "ko": "상태" },
  "context": "Application state in state management"
}
```

### 翻訳しない

技術用語は英語のままにしてください：

```json
{
  "source": "Kubernetes",
  "doNotTranslate": true
}
```

### 特定の言語では翻訳しない

```json
{
  "source": "React",
  "doNotTranslateFor": ["ko", "ja"],
  "targets": {
    "zh": "React框架"
  }
}
```

### 大文字と小文字の区別

```json
{
  "source": "API",
  "targets": { "ko": "API" },
  "caseSensitive": true
}
```

## 完全な例

```json
{
  "sourceLanguage": "en",
  "version": "1.0.0",
  "description": "Technical documentation glossary",
  "terms": [
    {
      "source": "component",
      "targets": { "ko": "컴포넌트", "ja": "コンポーネント" },
      "context": "UI component"
    },
    {
      "source": "prop",
      "targets": { "ko": "프롭", "ja": "プロップ" },
      "context": "React component property"
    },
    {
      "source": "hook",
      "targets": { "ko": "훅", "ja": "フック" },
      "context": "React hook (useState, useEffect, etc.)"
    },
    {
      "source": "state",
      "targets": { "ko": "상태", "ja": "ステート" },
      "context": "Component or application state"
    },
    {
      "source": "TypeScript",
      "doNotTranslate": true
    },
    {
      "source": "JavaScript",
      "doNotTranslate": true
    },
    {
      "source": "npm",
      "doNotTranslate": true
    },
    {
      "source": "API",
      "doNotTranslate": true,
      "caseSensitive": true
    }
  ]
}
```

## CLI コマンド

### 用語集の用語を一覧表示

```bash
llm-translate glossary list --glossary glossary.json
```

### 用語集を検証

```bash
llm-translate glossary validate --glossary glossary.json
```

### 用語を追加

```bash
llm-translate glossary add "container" --target ko="컨테이너" --glossary glossary.json
```

### 用語を削除

```bash
llm-translate glossary remove "container" --glossary glossary.json
```

## ベストプラクティス

### 1. 一般的な技術用語から始める

```json
{
  "terms": [
    { "source": "API", "doNotTranslate": true },
    { "source": "SDK", "doNotTranslate": true },
    { "source": "CLI", "doNotTranslate": true },
    { "source": "URL", "doNotTranslate": true },
    { "source": "JSON", "doNotTranslate": true }
  ]
}
```

### 2. 製品固有の用語を含める

```json
{
  "source": "Workspace",
  "targets": { "ko": "워크스페이스" },
  "context": "Product-specific workspace feature"
}
```

### 3. あいまいな用語にはコンテキストを追加

```json
{
  "source": "run",
  "targets": { "ko": "실행" },
  "context": "Execute a command or script"
}
```

### 4. ブランド名に `doNotTranslate` を使用

```json
{
  "source": "GitHub",
  "doNotTranslate": true
}
```

### 5. 用語集をバージョン管理

ドキュメントと一緒に用語集の変更を追跡します。

## 用語の適用方法

1. **翻訳前**：用語集をプロンプトに注入します
2. **翻訳中**：LLM は各用語の必須翻訳を確認します
3. **品質評価**：用語集への準拠が採点されます（全体の 20%）
4. **改善**：不足している用語は修正対象としてフラグが立てられます

## トラブルシューティング

### 用語が適用されない

- 大文字と小文字の区別設定を確認してください
- 定義した用語がソーステキストに正確に表示されていることを確認してください
- ターゲット言語が `targets` オブジェクトに含まれていることを確認してください

### 翻訳が一貫していない

- あいまいな用語にはコンテキストを追加してください
- 異なる翻訳を持つ重複した用語がないか確認してください
- 品質しきい値を上げて準拠を強制してください

### 用語集が大きすぎる

大きな用語集はトークン使用量を増加させます。以下の対策を検討してください：

- ドメインまたはプロジェクト単位で分割する
- 選択的な用語集注入を使用する（近日中に公開予定）
- 使用頻度の低い用語は削除する
