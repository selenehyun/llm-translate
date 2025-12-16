# 用語集

::: info 翻訳について
英語以外のドキュメントはすべてClaude Sonnet 4を使用して自動翻訳されています。
:::

用語集機能により、すべての翻訳で一貫した用語を確保できます。用語を一度定義すれば、毎回同じ方法で翻訳されます。

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

コンテキストはLLMが用語の使用方法を理解するのに役立ちます：

```json
{
  "source": "state",
  "targets": { "ko": "상태" },
  "context": "Application state in state management"
}
```

### 翻訳しない

技術用語は英語のまま保持します：

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

### 大文字小文字の区別

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

## CLIコマンド

### 用語集の用語を一覧表示

```bash
llm-translate glossary list --glossary glossary.json
```

### 用語集の検証

```bash
llm-translate glossary validate --glossary glossary.json
```

### 用語の追加

```bash
llm-translate glossary add "container" --target ko="컨테이너" --glossary glossary.json
```

### 用語の削除

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

### 3. 曖昧な用語にはコンテキストを追加する

```json
{
  "source": "run",
  "targets": { "ko": "실행" },
  "context": "Execute a command or script"
}
```

### 4. ブランド名には `doNotTranslate` を使用する

```json
{
  "source": "GitHub",
  "doNotTranslate": true
}
```

### 5. 用語集をバージョン管理する

ドキュメントと併せて用語集の変更を追跡してください。

## 用語の適用方法
