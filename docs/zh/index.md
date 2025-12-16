---
layout: home

hero:
  name: llm-translate
  text: LLM 驱动的文档翻译
  tagline: 通过术语表强制执行、质量控制和成本优化来翻译文档
  actions:
    - theme: brand
      text: 开始使用
      link: ./guide/getting-started
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/selenehyun/llm-translate

features:
  - icon: 📚
    title: 术语表强制执行
    details: 通过强制执行的术语表条目确保翻译中术语的一致性，永远不会出现误译。
  - icon: 🔄
    title: Self-Refine 质量控制
    details: 使用 AI 驱动的质量评估进行迭代翻译优化，以达到您的质量阈值。
  - icon: 💰
    title: 成本优化
    details: 提示缓存通过缓存术语表和系统提示等重复内容，将 API 成本降低高达 90%。
  - icon: 🔌
    title: 多提供商支持
    details: 支持 Claude、OpenAI 和 Ollama。无需更改工作流程即可切换提供商。
  - icon: 📄
    title: 格式保持
    details: 在翻译过程中保持 Markdown 格式、代码块、链接和文档结构。
  - icon: ⚡
    title: 批量处理
    details: 通过并行处理和进度跟踪翻译整个目录。
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

- **术语不一致** - "API endpoint" 每次翻译都不同
- **格式损坏** - 代码块和 Markdown 被破坏
- **无质量控制** - 接受 LLM 输出的任何结果

llm-translate 通过以下方式解决这些问题：
