# Chunking 策略

大型文档被分成分块进行翻译。理解 Chunking 有助于优化质量和成本。

## 为什么使用 Chunking？

LLM 有上下文限制，在专注内容上表现更好：

| 原因 | 描述 |
|--------|-------------|
| **上下文限制** | 模型有最大输入大小 |
| **质量** | 较小的分块能获得更专注的处理 |
| **成本** | 允许提示缓存重复内容 |
| **进度** | 启用进度跟踪和恢复 |

## 默认配置

```json
{
  "chunking": {
    "maxTokens": 1024,
    "overlapTokens": 150
  }
}
```

## 分块大小选项

### maxTokens

每个分块的最大令牌数（不包括提示开销）。

| 大小 | 最适合 | 权衡 |
|------|----------|-----------|
| 512 | 高质量要求 | 更多 API 调用 |
| **1024** | 通用（默认） | 平衡 |
| 2048 | 成本优化 | 可能降低质量 |

### overlapTokens

来自前一个分块的上下文确保边界之间的连续性。

```
Chunk 1: [Content A                    ]
Chunk 2:            [overlap][Content B                    ]
Chunk 3:                              [overlap][Content C  ]
```

::: tip 推荐重叠
使用 `maxTokens` 值的 10-15%。对于 1024 令牌，100-150 个重叠令牌效果很好。
:::

## Markdown 感知 Chunking

llm-translate 使用基于 AST 的 Chunking，尊重文档结构。

### 保留的边界

分块器永远不会分割这些元素：

| 元素 | 行为 |
|---------|----------|
| 标题 | 保留标题边界 |
| 代码块 | 始终保持完整 |
| 列表 | 尽量保持项目分组 |
| 表格 | 始终保持完整 |
| 段落 | 在自然边界处分割 |

### 示例

::: details 点击查看 Chunking 示例

**输入文档：**

```markdown
# Introduction

This is the introduction paragraph that explains
the purpose of the document.

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

npm install @llm-translate/cli
```

**结果：**

```
Chunk 1: # Introduction + paragraph
Chunk 2: ## Getting Started + ### Prerequisites + list
Chunk 3: ### Installation + code block
```

:::

## 配置

::: code-group

```bash [CLI]
llm-translate file doc.md --target ko --chunk-size 2048
```

```json [.translaterc.json]
{
  "chunking": {
    "maxTokens": 2048,
    "overlapTokens": 200,
    "preservePatterns": [
      "```[\\s\\S]*?```",
      "\\|[^\\n]+\\|"
    ]
  }
}
```

```typescript [Programmatic]
import { chunkContent } from '@llm-translate/cli';

const chunks = chunkContent(content, {
  maxTokens: 1024,
  overlapTokens: 150,
});
```

:::

## 优化预设

根据您的优先级选择：

::: code-group

```json [Quality Focus]
{
  "chunking": {
    "maxTokens": 512,
    "overlapTokens": 100
  }
}
```

```json [Cost Focus]
{
  "chunking": {
    "maxTokens": 2048,
    "overlapTokens": 50
  }
}
```

```json [Long Documents]
{
  "chunking": {
    "maxTokens": 1500,
    "overlapTokens": 150
  },
  "translation": {
    "maxIterations": 3
  }
}
```

:::

::: info 何时使用每个预设
- **质量优先**：技术文档、法律内容
- **成本优先**：博客文章、通用内容
- **长文档**：书籍、综合指南
:::

## 内容保护

### 受保护的内容

llm-translate 自动保护某些内容不被翻译：

| 内容类型 | 示例 | 行为 |
|--------------|---------|----------|
| 代码块 |` __INLINE_CODE_16__ `| 永远不翻译 |
| 内联代码 |`` ` variable ` ``| 保留 |
| URL |`https://...`| 保留 |
| 文件路径 |`./path/to/file`| 保留 |

### 链接处理

链接 URL 被保留，但链接文本被翻译：

```markdown
[Getting Started](./getting-started.md)
↓
[시작하기](./getting-started.md)
```

## 调试

### 预览分块

使用 `--dry-run` 查看文档将如何被分块：

```bash
llm-translate file doc.md --target ko --dry-run --verbose
```

输出：
```
Document Analysis:
  Total tokens: ~5,200
  Chunks: 6
  Average chunk size: ~867 tokens

Chunk breakdown:
  [1] Lines 1-45 (Introduction) - 823 tokens
  [2] Lines 46-89 (Getting Started) - 912 tokens
  [3] Lines 90-134 (Configuration) - 878 tokens
  ...
```

### 程序化检查

```typescript
import { chunkContent, getChunkStats } from '@llm-translate/cli';

const chunks = chunkContent(content, { maxTokens: 1024 });
const stats = getChunkStats(chunks);

console.log(`Total chunks: ${stats.count}`);
console.log(`Average size: ${stats.avgTokens} tokens`);
```

## 故障排除

::: warning 分块过小
**现象**：许多小分块，过多的 API 调用

**解决方案**：增加 `maxTokens`
```json
{ "chunking": { "maxTokens": 2048 } }
```
:::

::: warning 分块之间丢失上下文
**现象**：各部分之间的术语不一致

**解决方案**：增加重叠或使用术语表
```json
{ "chunking": { "overlapTokens": 300 } }
```
:::

::: danger 代码块被分割
**现象**：输出中的语法错误

**原因**：这种情况不应该发生。如果发生，请[报告问题](https://github.com/selenehyun/llm-translate/issues)。
:::

::: warning 表格被破坏
**现象**：表格格式损坏

**解决方案**：表格应该自动保持完整。对于非常大的表格（100+ 行），考虑手动分割它们。
:::
