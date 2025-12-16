# 更新日志

::: info 翻译说明
所有非英文文档均使用 Claude Sonnet 4 自动翻译。
:::

llm-translate 的所有重要更改都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)，
此项目遵循 [语义化版本控制](https://semver.org/spec/v2.0.0.html)。

## [未发布]

### 新增

- Claude 模型的提示缓存支持（成本降低 40-50%）
- 翻译结果中的缓存令牌使用情况跟踪
- TranslationAgent 中的 `enableCaching` 选项
- 令牌使用元数据中的 `cacheRead` 和 `cacheWrite` 字段
- 基于 MQM（多维质量指标）的质量评估系统
- MAPS 风格的预翻译分析步骤
- 翻译模式支持（`--mode fast|balanced|quality`）

### 更改

-`ChatMessage.content` 现在支持可缓存的文本部分
-`ChatResponse.usage` 包含缓存令牌指标
- 默认模型更新为 `claude-haiku-4-5-20251001`

### 文档

- 添加 Ollama 质量警告：需要 14B+ 模型才能进行可靠翻译

## [0.1.0] - 2025-12-12

### 新增

- 初始版本发布
- 单文件翻译（`llm-translate file`）
- 目录批量翻译（`llm-translate dir`）
- 配置初始化（`llm-translate init`）
- 术语表管理（`llm-translate glossary`）
- Claude、OpenAI 和 Ollama 提供商支持
- Self-Refine 质量控制循环
- 基于 Markdown AST 的 Chunking
- 术语表强制执行
- 质量阈值配置
- 详细输出模式

### 提供商

- Claude（claude-haiku-4-5、claude-sonnet-4-5、claude-opus-4-5）
- OpenAI（gpt-4o-mini、gpt-4o、gpt-4-turbo）
- Ollama（任何本地模型）

### 文档

- CLI 参考文档
- API 参考文档
- 入门指南
- 配置指南
- 术语表指南
- 质量控制指南
- 成本优化指南
