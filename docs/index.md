---
layout: home

hero:
  name: llm-translate
  text: LLM-Powered Document Translation
  tagline: Translate documents with glossary enforcement, quality control, and cost optimization
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/selenehyun/llm-translate

features:
  - icon: 📚
    title: Glossary Enforcement
    details: Ensure consistent terminology across your translations with enforced glossary terms that never get mistranslated.
  - icon: 🔄
    title: Self-Refine Quality Control
    details: Iterative translation refinement using AI-powered quality evaluation to meet your quality threshold.
  - icon: 💰
    title: Cost Optimization
    details: Prompt caching reduces API costs by up to 90% for repeated content like glossaries and system prompts.
  - icon: 🔌
    title: Multi-Provider Support
    details: Works with Claude, OpenAI, and Ollama. Switch providers without changing your workflow.
  - icon: 📄
    title: Format Preservation
    details: Maintains markdown formatting, code blocks, links, and document structure during translation.
  - icon: ⚡
    title: Batch Processing
    details: Translate entire directories with parallel processing and progress tracking.
---

## Quick Start

```bash
# Install globally
npm install -g llm-translate

# Set your API key
export ANTHROPIC_API_KEY=your-key-here

# Translate a file
llm-translate file README.md -o README.ko.md --target ko
```

## Why llm-translate?

Traditional translation tools struggle with technical documentation:

- **Inconsistent terminology** - "API endpoint" translated differently each time
- **Broken formatting** - Code blocks and markdown get mangled
- **No quality control** - Accept whatever the LLM outputs

llm-translate solves these problems with:

1. **Glossary enforcement** - Define terms once, apply everywhere
2. **AST-based chunking** - Preserves document structure
3. **Quality-aware refinement** - Iterates until quality threshold is met
4. **Prompt caching** - Reduces costs for large documents
