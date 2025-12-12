# llm-translate 文件

翻译单个文件。

## 概要

```bash
llm-translate file <input> [output] [options]
```

## 参数

| 参数 | 描述 |
|----------|-------------|
|`<input>`| 输入文件路径（必需） |
|`[output]`| 输出文件路径（可选，默认为 stdout） |

## 选项

### 翻译选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`--source `,`-s`| 自动检测 | 源语言代码 |
|`--target `,`-t`| 必需 | 目标语言代码 |
|`--glossary `,`-g`| 无 | 术语表文件路径 |

### 质量选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`--quality `,`-q`| 85 | 质量阈值（0-100） |
|`--max-iterations`| 4 | 最大优化迭代次数 |
|`--strict`| false | 未达到阈值时失败 |

### 提供商选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`--provider `,`-p`| claude | 提供商名称 |
|`--model `,`-m`| 因提供商而异 | 模型标识符 |

### 输出选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`--output `,`-o`| stdout | 输出文件路径 |
|`--overwrite`| false | 覆盖现有输出 |
|`--dry-run`| false | 显示将要执行的操作 |

### 高级选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`--no-cache`| false | 禁用提示缓存 |
|`--chunk-size`| 1024 | 每个分块的最大令牌数 |

## 示例

### 基本用法

```bash
# Translate to Korean, output to stdout
llm-translate file README.md --target ko

# Translate to file
llm-translate file README.md -o README.ko.md --target ko

# Specify source language
llm-translate file doc.md -o doc.ja.md --source en --target ja
```

### 使用术语表

```bash
# Use glossary for consistent terminology
llm-translate file api-docs.md -o api-docs.ko.md \
  --target ko \
  --glossary glossary.json
```

### 质量控制

```bash
# Higher quality threshold
llm-translate file important.md -o important.ko.md \
  --target ko \
  --quality 95 \
  --max-iterations 6

# Strict mode (fail if not met)
llm-translate file legal.md -o legal.ko.md \
  --target ko \
  --quality 95 \
  --strict
```

### 提供商选择

```bash
# Use Claude Sonnet
llm-translate file doc.md -o doc.ko.md \
  --target ko \
  --provider claude \
  --model claude-sonnet-4-5-20250929

# Use OpenAI
llm-translate file doc.md -o doc.ko.md \
  --target ko \
  --provider openai \
  --model gpt-4o
```

### 从 stdin 读取

```bash
# Pipe content
cat doc.md | llm-translate file - --target ko > doc.ko.md

# Use with other tools
curl https://example.com/doc.md | llm-translate file - --target ko
```

## 输出格式

### 普通模式

```
✓ Translated README.md → README.ko.md
  Quality: 92/85 (threshold met)
  Duration: 3.2s
```

### 详细模式

```bash
llm-translate file doc.md -o doc.ko.md --target ko --verbose
```

```
ℹ Loading configuration...
ℹ Provider: claude (claude-haiku-4-5-20251001)
ℹ Parsing document...
ℹ Chunks: 5
ℹ Starting translation...

[Chunk 1/5] Starting initial translation...
[Chunk 1/5] Quality: 78/85
[Chunk 1/5] Generating improvements...
[Chunk 1/5] Quality: 91/85 ✓

[Chunk 2/5] Starting initial translation...
[Chunk 2/5] Quality: 88/85 ✓
...

✓ Translation complete
  Quality: 89/85 (threshold met)
  Iterations: avg 1.8
  Tokens: 5,234 input / 6,456 output
  Cache: 3,200 read / 800 written
  Duration: 8.4s
```

## 语言代码

常见语言代码：

| 代码 | 语言 |
|------|----------|
|`en`| 英语 |
|`ko`| 韩语 |
|`ja`| 日语 |
|`zh`| 中文（简体） |
|`zh-TW`| 中文（繁体） |
|`es`| 西班牙语 |
|`fr`| 法语 |
|`de`| 德语 |

## 错误处理

### 文件未找到

```bash
$ llm-translate file missing.md --target ko
Error: File not found: missing.md
Exit code: 3
```

### 质量未达标（严格模式）

```bash
$ llm-translate file doc.md -o doc.ko.md --target ko --quality 99 --strict
Error: Quality threshold not met: 94/99
Exit code: 4
```

### API 错误

```bash
$ llm-translate file doc.md --target ko
Error: Provider error: Rate limit exceeded
Exit code: 5
```
