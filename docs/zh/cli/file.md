# llm-translate file

::: info 翻译说明
所有非英文文档均使用 Claude Sonnet 4 自动翻译。
:::

翻译单个文件。

## 语法

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
|`--source-lang `,`-s`| 必需 | 源语言代码 |
|`--target-lang `,`-t`| 必需 | 目标语言代码 |
|`--glossary `,`-g`| 无 | 术语表文件路径 |

### 质量选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`--quality`| 85 | 质量阈值（0-100） |
|`--max-iterations`| 4 | 最大优化迭代次数 |
|`--strict-quality`| false | 未达到阈值时失败 |
|`--strict-glossary`| false | 术语表术语未应用时失败 |

### 提供商选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`--provider `,`-p`| claude | 提供商名称 |
|`--model `,`-m`| 不定 | 模型标识符 |

### 输出选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`--output `,`-o`| 自动 | 输出文件路径 |
|`--format `,`-f`| 自动 | 强制输出格式（md\|html\|txt） |
|`--dry-run`| false | 显示将要执行的操作 |
|`--json`| false | 以 JSON 格式输出结果 |
|`--verbose `,`-v`| false | 启用详细日志记录 |
|`--quiet `,`-q`| false | 抑制非错误输出 |

### 高级选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`--no-cache`| false | 禁用翻译缓存 |
|`--chunk-size`| 1024 | 每个分块的最大令牌数 |
|`--context`| 无 | 翻译的附加上下文 |

## 示例

### 基本用法

```bash
# Translate to Korean
llm-translate file README.md -o README.ko.md -s en -t ko

# With explicit output path
llm-translate file README.md --output README.ko.md --source-lang en --target-lang ko

# Specify source and target languages
llm-translate file doc.md -o doc.ja.md --source-lang en --target-lang ja
```

### 使用术语表

```bash
# Use glossary for consistent terminology
llm-translate file api-docs.md -o api-docs.ko.md \
  -s en -t ko \
  --glossary glossary.json
```

### 质量控制

```bash
# Higher quality threshold
llm-translate file important.md -o important.ko.md \
  -s en -t ko \
  --quality 95 \
  --max-iterations 6

# Strict mode (fail if not met)
llm-translate file legal.md -o legal.ko.md \
  --source-lang en \
  --target-lang ko \
  --quality 95 \
  --strict-quality
```

### 提供商选择

```bash
# Use Claude Sonnet
llm-translate file doc.md -o doc.ko.md \
  -s en -t ko \
  --provider claude \
  --model claude-sonnet-4-5-20250929

# Use OpenAI
llm-translate file doc.md -o doc.ko.md \
  -s en -t ko \
  --provider openai \
  --model gpt-4o
```

### 从 stdin 输入

```bash
# Pipe content (uses stdin mode when no TTY)
cat doc.md | llm-translate -s en -t ko > doc.ko.md

# Use with other tools
curl https://example.com/doc.md | llm-translate -s en -t ko
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
$ llm-translate file missing.md -s en -t ko
Error: Could not read file 'missing.md'
Exit code: 3
```

### 质量未达标（严格模式）

```bash
$ llm-translate file doc.md -o doc.ko.md -s en -t ko --quality 99 --strict-quality
Error: Quality threshold not met: 94/99
Exit code: 4
```

### API 错误

```bash
$ llm-translate file doc.md --target ko
Error: Provider error: Rate limit exceeded
Exit code: 5
```
