---
layout: home

hero:
  name: llm-translate
  text: LLM 驱动的文档翻译
  tagline: 通过术语表强制、质量控制和成本优化来翻译文档
  actions:
    - theme: brand
      text: 开始使用
      link: ./guide/getting-started
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/selenehyun/llm-translate

features:
  - icon: 📚
    title: 术语强制一致
    details: 通过强制术语表来确保翻译中的术语一致，避免术语误译。
  - icon: 🔄
    title: Self-Refine 质量控制
    details: 使用 AI 驱动的质量评估进行迭代优化，直到满足质量阈值。
  - icon: 💰
    title: 成本优化
    details: 提示缓存可将 API 成本降低高达 90%，适用于术语表和系统提示等重复内容。
  - icon: 🔌
    title: 多提供商支持
    details: 支持 Claude、OpenAI 和 Ollama。无需更改工作流即可在提供商之间切换。
  - icon: 📄
    title: 格式保留
    details: 在翻译过程中保持 Markdown 格式、代码块、链接和文档结构不变。
  - icon: ⚡
    title: 批量处理
    details: 使用并行处理和进度跟踪翻译整个目录。
---

## 快速开始

```bash
# Install globally
npm install -g @llm-translate/cli

# Set your API key
export ANTHROPIC_API_KEY=your-key-here

# Translate a file
llm-translate file README.md -o README.ko.md --target ko
```

## 为什么选择 llm-translate？

传统翻译工具在处理技术文档时存在困难：

- **术语不一致** - "API endpoint" 每次翻译结果都不同
- **格式破损** - 代码块和 Markdown 格式被破坏
- **没有质量控制** - 接受 LLM 的任何输出

llm-translate 通过以下方式解决这些问题：

1. **术语强制一致** - 定义一次术语，全局应用
2. **基于 AST 的 Chunking** - 保持文档结构
3. **质量阈值驱动的迭代优化** - 迭代优化直到达到质量阈值
4. **提示缓存** - 降低大型文档的成本
