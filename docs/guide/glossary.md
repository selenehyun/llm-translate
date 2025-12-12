# Glossary

The glossary feature ensures consistent terminology across all your translations. Define terms once, and they'll be translated the same way every time.

## Glossary File Format

Create a `glossary.json` file:

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

## Term Structure

### Basic Term

```json
{
  "source": "endpoint",
  "targets": {
    "ko": "엔드포인트",
    "ja": "エンドポイント"
  }
}
```

### With Context

Context helps the LLM understand how to use the term:

```json
{
  "source": "state",
  "targets": { "ko": "상태" },
  "context": "Application state in state management"
}
```

### Do Not Translate

Keep technical terms in English:

```json
{
  "source": "Kubernetes",
  "doNotTranslate": true
}
```

### Do Not Translate for Specific Languages

```json
{
  "source": "React",
  "doNotTranslateFor": ["ko", "ja"],
  "targets": {
    "zh": "React框架"
  }
}
```

### Case Sensitivity

```json
{
  "source": "API",
  "targets": { "ko": "API" },
  "caseSensitive": true
}
```

## Complete Example

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

## CLI Commands

### List Glossary Terms

```bash
llm-translate glossary list --glossary glossary.json
```

### Validate Glossary

```bash
llm-translate glossary validate --glossary glossary.json
```

### Add a Term

```bash
llm-translate glossary add "container" --target ko="컨테이너" --glossary glossary.json
```

### Remove a Term

```bash
llm-translate glossary remove "container" --glossary glossary.json
```

## Best Practices

### 1. Start with Common Technical Terms

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

### 2. Include Product-Specific Terms

```json
{
  "source": "Workspace",
  "targets": { "ko": "워크스페이스" },
  "context": "Product-specific workspace feature"
}
```

### 3. Add Context for Ambiguous Terms

```json
{
  "source": "run",
  "targets": { "ko": "실행" },
  "context": "Execute a command or script"
}
```

### 4. Use `doNotTranslate` for Brand Names

```json
{
  "source": "GitHub",
  "doNotTranslate": true
}
```

### 5. Version Your Glossary

Track glossary changes alongside your documentation.

## How Terms Are Applied

1. **Before translation**: The glossary is injected into the prompt
2. **During translation**: The LLM sees required translations for each term
3. **Quality evaluation**: Glossary compliance is scored (20% of total)
4. **Refinement**: Missing terms are flagged for correction

## Troubleshooting

### Term Not Being Applied

- Check case sensitivity settings
- Ensure the term appears in source text exactly as defined
- Verify the target language is in the `targets` object

### Inconsistent Translations

- Add more context to disambiguate
- Check for duplicate terms with different translations
- Increase quality threshold to enforce compliance

### Glossary Too Large

Large glossaries increase token usage. Consider:

- Splitting by domain/project
- Using selective glossary injection (coming soon)
- Removing rarely-used terms
