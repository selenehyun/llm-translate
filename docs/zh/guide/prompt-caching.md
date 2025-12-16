# 提示缓存

::: info 翻译说明
所有非英文文档均使用 Claude Sonnet 4 自动翻译。
:::

提示缓存是一项成本优化功能，通过重复使用内容可将 API 成本降低高达 90%。

## 工作原理

在翻译文档时，提示的某些部分保持不变：

- **系统指令**：翻译规则和指导原则
- **术语表**：特定领域的术语

这些内容会被缓存并在多个分块中重复使用，从而显著节省成本。

```
Request 1 (First Chunk):
┌─────────────────────────────────┐
│ System Instructions (CACHED)    │ ◀─ Written to cache
├─────────────────────────────────┤
│ Glossary (CACHED)              │ ◀─ Written to cache
├─────────────────────────────────┤
│ Source Text (NOT cached)       │
└─────────────────────────────────┘

Request 2+ (Subsequent Chunks):
┌─────────────────────────────────┐
│ System Instructions (CACHED)    │ ◀─ Read from cache (90% off)
├─────────────────────────────────┤
│ Glossary (CACHED)              │ ◀─ Read from cache (90% off)
├─────────────────────────────────┤
│ Source Text (NOT cached)       │
└─────────────────────────────────┘
```

## 成本影响

### 定价（Claude）

| 令牌类型 | 成本倍数 |
|------------|-----------------|
| 常规输入 | 1.0x |
| 缓存写入 | 1.25x（首次使用） |
| 缓存读取 | 0.1x（后续使用） |
| 输出 | 1.0x |

### 示例计算

对于包含 500 令牌术语表的 10 分块文档：

**不使用缓存：**
```
10 chunks × 500 glossary tokens = 5,000 tokens
```

**使用缓存：**
```
First chunk: 500 × 1.25 = 625 tokens (cache write)
9 chunks: 500 × 0.1 × 9 = 450 tokens (cache read)
Total: 1,075 tokens (78% savings)
```

## 要求

### 最小令牌阈值

提示缓存需要最小内容长度：

| 模型 | 最小令牌数 |
|-------|---------------|
| Claude Haiku 4.5 | 4,096 |
| Claude Haiku 3.5 | 2,048 |
| Claude Sonnet | 1,024 |
| Claude Opus | 1,024 |

低于这些阈值的内容不会被缓存。

### 提供商支持

| 提供商 | 缓存支持 |
|----------|-----------------|
| Claude | ✅ 完全支持 |
| OpenAI | ✅ 自动 |
| Ollama | ❌ 不可用 |

## 配置

Claude 默认启用缓存。要禁用：

```bash
llm-translate file doc.md -o doc.ko.md --target ko --no-cache
```

或在配置中：

```json
{
  "provider": {
    "name": "claude",
    "caching": false
  }
}
```

## 监控缓存性能

### CLI 输出

```
✓ Translation complete
  Cache: 890 read / 234 written (78% hit rate)
```

### 详细模式

```bash
llm-translate file doc.md -o doc.ko.md --target ko --verbose
```

显示每个分块的缓存统计：

```
[Chunk 1/10] Cache: 0 read / 890 written
[Chunk 2/10] Cache: 890 read / 0 written
[Chunk 3/10] Cache: 890 read / 0 written
...
```

### 程序化访问

```typescript
const result = await engine.translateFile({
  input: 'doc.md',
  output: 'doc.ko.md',
  targetLang: 'ko',
});

console.log(result.metadata.tokensUsed);
// {
//   input: 5000,
//   output: 6000,
//   cacheRead: 8000,
//   cacheWrite: 1000
// }
```

## 最大化缓存效率

### 1. 使用一致的术语表

相同的术语表内容 = 相同的缓存键

```bash
# Good: Same glossary for all files
llm-translate dir ./docs ./docs-ko --target ko --glossary glossary.json

# Less efficient: Different glossary per file
llm-translate file a.md --glossary a-glossary.json
llm-translate file b.md --glossary b-glossary.json
```

### 2. 批量处理相关文件

缓存持续约 5 分钟。一起处理文件：

```bash
# Efficient: Sequential processing shares cache
llm-translate dir ./docs ./docs-ko --target ko
```

### 3. 按大小排序文件

从较大的文件开始预热缓存：

```bash
# Cache is populated by first file, reused by rest
llm-translate file large-doc.md ...
llm-translate file small-doc.md ...
```

### 4. 策略性使用较大的术语表

较大的术语表从缓存中获益更多：

| 术语表大小 | 缓存节省 |
|---------------|---------------|
| 100 令牌 | ~70% |
| 500 令牌 | ~78% |
| 1000+ 令牌 | ~80%+ |

## 故障排除

### 缓存不工作

**症状：** 未报告 `cacheRead` 令牌

**原因：**
1. 内容低于最小阈值
2. 请求之间内容发生变化
3. 缓存 TTL 过期（5 分钟）

**解决方案：**
- 确保术语表 + 系统提示 > 最小令牌数
- 快速连续处理文件
- 使用详细模式进行调试

### 高缓存写入成本

**症状：**`cacheWrite` 超出预期

**原因：**
1. 许多唯一的术语表
2. 文件处理间隔太远
3. 运行之间缓存失效

**解决方案：**
- 合并术语表
- 使用批量处理
- 在 5 分钟窗口内处理
