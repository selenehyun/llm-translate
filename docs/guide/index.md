# What is llm-translate?

llm-translate is a CLI tool for translating documents using Large Language Models. It's designed specifically for technical documentation where consistency, accuracy, and format preservation are critical.

## Key Features

### Glossary Enforcement

Define domain-specific terminology once and ensure it's translated consistently across all your documents.

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

### Self-Refine Quality Control

llm-translate doesn't just translate once and call it done. It uses an iterative refinement process:

1. **Initial Translation** - Generate first translation with glossary
2. **Quality Evaluation** - Score against semantic accuracy, fluency, glossary compliance, and format preservation
3. **Reflection** - Identify specific issues if quality threshold not met
4. **Improvement** - Apply targeted fixes
5. **Repeat** - Continue until quality >= threshold or max iterations reached

### Prompt Caching

For Claude models, llm-translate automatically uses prompt caching to reduce costs:

- System instructions and glossary are cached across chunks
- Subsequent requests use cached tokens at 90% discount
- Especially effective for large documents with many chunks

### Format Preservation

The tool uses AST-based parsing to preserve:

- Markdown formatting (headers, lists, tables, code blocks)
- HTML tags and attributes
- Links and images
- Document structure and hierarchy

## Use Cases

- **Technical Documentation** - Translate README, API docs, user guides
- **Knowledge Bases** - Multilingual support articles
- **Product Content** - Release notes, changelogs, feature descriptions
- **Developer Resources** - Tutorials, guides, code comments

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Parser    │────▶│   Chunker    │────▶│   Agent     │
│ (MD/HTML)   │     │ (Semantic)   │     │(Self-Refine)│
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                    ┌──────────────┐            │
                    │   Provider   │◀───────────┘
                    │(Claude/GPT)  │
                    └──────────────┘
```

## Comparison

| Feature | llm-translate | Generic LLM | Traditional MT |
|---------|--------------|-------------|----------------|
| Glossary enforcement | ✅ | ❌ | ⚠️ Limited |
| Quality control | ✅ Self-refine | ❌ | ❌ |
| Format preservation | ✅ AST-based | ⚠️ Prompt-based | ❌ |
| Cost optimization | ✅ Caching | ❌ | N/A |
| Code block handling | ✅ Protected | ⚠️ | ❌ |
