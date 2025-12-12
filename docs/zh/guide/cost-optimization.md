# 成本优化

本指南涵盖了在保持翻译质量的同时最小化 API 成本的策略。

## 成本结构

### 令牌定价（截至 2024 年）

| 模型 | 输入 (1K) | 输出 (1K) | 缓存读取 | 缓存写入 |
|-------|-----------|-------------|------------|-------------|
| Claude Haiku 4.5 | $0.001 | $0.005 | $0.0001 | $0.00125 |
| Claude Sonnet 4.5 | $0.003 | $0.015 | $0.0003 | $0.00375 |
| Claude Opus 4.5 | $0.015 | $0.075 | $0.0015 | $0.01875 |
| GPT-4o-mini | $0.00015 | $0.0006 | 自动 | 自动 |
| GPT-4o | $0.0025 | $0.01 | 自动 | 自动 |

### 成本因素

1. **输入令牌**：源文本 + 术语表 + 提示
2. **输出令牌**：翻译文本
3. **迭代次数**：质量优化周期（乘以迭代次数）
4. **缓存效率**：提示缓存节省的成本

## 优化策略

### 1. 选择合适的模型

```bash
# Most cost-effective for standard docs
llm-translate file doc.md --model claude-haiku-4-5-20251001

# Better quality when needed
llm-translate file important.md --model claude-sonnet-4-5-20250929
```

**模型选择指南：**

| 内容类型 | 推荐模型 |
|--------------|-------------------|
| README、指南 | Haiku |
| API 参考 | Haiku |
| 用户文档 | Sonnet |
| 营销内容 | Sonnet/Opus |
| 法律/合规 | Opus |

### 2. 优化质量设置

较低的阈值 = 更少的迭代 = 更低的成本

```bash
# Draft quality (faster, cheaper)
llm-translate file doc.md --quality 70 --max-iterations 2

# Standard quality
llm-translate file doc.md --quality 85 --max-iterations 4

# High quality (slower, more expensive)
llm-translate file doc.md --quality 95 --max-iterations 6
```

**成本影响：**

| 设置 | 平均迭代次数 | 相对成本 |
|---------|---------------|---------------|
| quality=70, iter=2 | 1.5 | 0.5x |
| quality=85, iter=4 | 2.5 | 1.0x |
| quality=95, iter=6 | 4.0 | 1.6x |

### 3. 最大化提示缓存

启用缓存并批量处理文件：

```bash
# Process all files together to share cache
llm-translate dir ./docs ./docs-ko --target ko

# Not: Process one file at a time
```

详见[提示缓存](./prompt-caching)。

### 4. 优化术语表大小

大型术语表会增加成本。仅保留必要的术语：

```bash
# Check glossary token count
llm-translate glossary stats --glossary glossary.json
```

**最佳实践：**
- 定期删除未使用的术语
- 谨慎使用 `doNotTranslate`
- 按领域拆分大型术语表

### 5. 分块大小优化

更大的分块 = 更少的 API 调用 = 更低的开销

```json
{
  "chunking": {
    "maxTokens": 2048,
    "overlapTokens": 200
  }
}
```

**权衡：**

| 分块大小 | API 调用 | 质量 | 成本 |
|------------|-----------|---------|------|
| 512 令牌 | 多 | 更高 | 更高 |
| 1024 令牌 | 中等 | 良好 | 中等 |
| 2048 令牌 | 少 | 可接受 | 更低 |

### 6. 使用翻译缓存

缓存已翻译的分块以避免重新翻译：

```json
{
  "paths": {
    "cache": "./.translate-cache"
  }
}
```

优势：
- 在重新运行时跳过未更改的内容
- 减少增量更新的成本
- 加快后续翻译速度

## 成本估算

### 翻译前

```bash
llm-translate estimate doc.md --target ko --glossary glossary.json
```

输出：
```
Estimated costs for doc.md:
  Chunks: 15
  Input tokens: ~18,000
  Output tokens: ~20,000 (estimated)
  Iterations: 2-3 (estimated)

  Model: claude-haiku-4-5-20251001
  Without caching: $0.12 - $0.18
  With caching: $0.05 - $0.08 (55-60% savings)
```

### 翻译后

```bash
llm-translate file doc.md -o doc.ko.md --target ko --verbose
```

输出：
```
✓ Translation complete
  Tokens: 18,234 input / 21,456 output
  Cache: 12,000 read / 3,000 written
  Cost: $0.067 (estimated)
```

## 批量处理经济学

### 单个文件与批处理

| 方法 | 缓存效率 | 总成本 |
|----------|-----------------|------------|
| 10 个文件顺序处理 | 0% | $1.00 |
| 10 个文件带缓存 | 80% | $0.35 |
| 批量目录 | 85% | $0.30 |

### 最优批量大小

```bash
# Process in batches of 20-50 files for best cache utilization
llm-translate dir ./docs ./docs-ko --target ko --concurrency 5
```

## 成本监控

### 按项目跟踪

创建成本日志：

```bash
llm-translate file doc.md --cost-log ./costs.json
```

### 成本警报

设置预算限制：

```json
{
  "budget": {
    "maxCostPerFile": 0.50,
    "maxCostPerRun": 10.00,
    "warnAt": 0.80
  }
}
```

## 按语言的成本比较

输出因目标语言而异：

| 目标语言 | 相对输出令牌 |
|--------|----------------------|
| 韩语 | 0.9-1.1x 源文本 |
| 日语 | 0.8-1.0x 源文本 |
| 中文 | 0.7-0.9x 源文本 |
| 德语 | 1.1-1.3x 源文本 |
| 西班牙语 | 1.1-1.2x 源文本 |

在成本估算中考虑这一点。

## 总结：快速成本降低检查清单

- [ ] 对标准文档使用 Haiku
- [ ] 适当设置质量阈值（不高于需要的水平）
- [ ] 启用并最大化提示缓存
- [ ] 批量处理文件
- [ ] 保持术语表精简
- [ ] 使用翻译缓存进行增量更新
- [ ] 使用详细输出监控成本
- [ ] 在大型任务前进行成本估算
