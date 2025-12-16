# 什么是 llm-translate？

::: info 翻译说明
所有非英文文档均使用 Claude Sonnet 4 自动翻译。
:::

llm-translate 是一个使用大型语言模型翻译文档的 CLI 工具。它专为技术文档设计，在一致性、准确性和格式保持方面至关重要。

## 主要功能

### 术语表强制执行

定义一次特定领域的术语，确保在所有文档中保持一致的翻译。

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

### Self-Refine质量控制

llm-translate 不只是翻译一次就完事。它使用迭代改进过程：
