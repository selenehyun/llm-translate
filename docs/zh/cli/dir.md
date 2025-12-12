# llm-translate dir

翻译目录中的所有文件。

## 概要

```bash
llm-translate dir <input> <output> [options]
```

## 参数

| 参数 | 描述 |
|----------|-------------|
|`<input>`| 输入目录路径（必需） |
|`<output>`| 输出目录路径（必需） |

## 选项

### 语言选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`-s, --source-lang <lang>`| 自动检测 | 源语言代码 |
|`-t, --target-lang <lang>`| 必需 | 目标语言代码 |

### 翻译选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`-g, --glossary <path>`| 无 | 术语表文件路径 |
|`-p, --provider <name>`|` claude`| LLM 提供商 (claude\|openai\|ollama) |
|`-m, --model <name>`| 提供商默认值 | 模型名称 |
|`--context <text>`| 无 | 翻译的额外上下文 |

### 质量选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`--quality <0-100>`| 85 | 质量阈值 |
|`--max-iterations <n>`| 4 | 最大优化迭代次数 |

### 文件选择

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`--include <patterns>`|`*.md,*.markdown`| 要包含的文件模式（逗号分隔） |
|`--exclude <patterns>`| 无 | 要排除的文件模式（逗号分隔） |

### 处理选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`--parallel <n>`| 3 | 并行文件处理数 |
|`--chunk-size <tokens>`| 1024 | 每个分块的最大令牌数 |
|`--no-cache`| false | 禁用翻译缓存 |

### 输出选项

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
|`-f, --format <fmt>`| auto | 强制输出格式 (md\|html\|txt) |
|`--dry-run`| false | 显示将要翻译的内容 |
|`--json`| false | 将结果输出为 JSON |
|`-v, --verbose`| false | 启用详细日志 |
|`-q, --quiet`| false | 抑制非错误输出 |

## 示例

### 基本用法

```bash
# Translate all markdown files
llm-translate dir ./docs ./docs-ko -t ko

# With glossary
llm-translate dir ./docs ./docs-ko -t ko -g glossary.json
```

### 文件选择

```bash
# Custom include pattern
llm-translate dir ./docs ./docs-ko -t ko --include "**/*.md"

# Multiple patterns
llm-translate dir ./docs ./docs-ko -t ko --include "*.md,*.markdown,*.mdx"

# Exclude certain directories
llm-translate dir ./docs ./docs-ko -t ko \
  --exclude "node_modules/**,dist/**,drafts/**"
```

### 并行处理

```bash
# Process 5 files in parallel
llm-translate dir ./docs ./docs-ko -t ko --parallel 5

# Sequential processing (for rate-limited APIs)
llm-translate dir ./docs ./docs-ko -t ko --parallel 1
```

### 质量设置

```bash
# High quality for important docs
llm-translate dir ./docs ./docs-ko -t ko --quality 95 --max-iterations 6

# Faster processing with lower threshold
llm-translate dir ./docs ./docs-ko -t ko --quality 70 --max-iterations 2
```

### 预览模式

```bash
# Show what would be translated
llm-translate dir ./docs ./docs-ko -t ko --dry-run
```

输出：
```
Dry run mode - no translation will be performed

Files to translate:
  getting-started.md → docs-ko/getting-started.md
  guide/setup.md → docs-ko/guide/setup.md
  api/reference.md → docs-ko/api/reference.md

Total: 3 file(s)
```

## 输出结构

默认情况下保留目录结构：

```
Input:                     Output:
docs/                      docs-ko/
├── getting-started.md     ├── getting-started.md
├── guide/                 ├── guide/
│   ├── setup.md           │   ├── setup.md
│   └── advanced.md        │   └── advanced.md
└── api/                   └── api/
    └── reference.md           └── reference.md
```

## 进度报告

### 普通模式

```
ℹ Found 5 file(s) to translate
ℹ Input: ./docs
ℹ Output: ./docs-ko
ℹ Target language: ko
ℹ Parallel processing: 3 file(s) at a time
[1/5] getting-started.md ✓
[2/5] guide/setup.md ✓
[3/5] guide/advanced.md ✓
[4/5] api/reference.md ✓
[5/5] api/types.md ✓

────────────────────────────────────────────────────────
  Translation Summary
────────────────────────────────────────────────────────
  Files:      5 succeeded, 0 failed
  Duration:   45.2s
  Tokens:     12,450 input / 8,320 output
  Cache:      5,200 read / 2,100 write
────────────────────────────────────────────────────────
```

### JSON 输出

```bash
llm-translate dir ./docs ./docs-ko -t ko --json
```

```json
{
  "success": true,
  "totalFiles": 5,
  "successCount": 5,
  "failCount": 0,
  "totalDuration": 45234,
  "tokensUsed": {
    "input": 12450,
    "output": 8320,
    "cacheRead": 5200,
    "cacheWrite": 2100
  },
  "files": [...]
}
```

## 最佳实践

### 1. 先预览

```bash
llm-translate dir ./docs ./docs-ko -t ko --dry-run
```

### 2. 使用适当的并行度

- 速率限制的 API：`--parallel 1-2`
- 高限制：`--parallel 5-10`
- 本地 (Ollama)：`--parallel 1`（模型受限）

### 3. 处理大型项目

```bash
# Split by subdirectory for better control
llm-translate dir ./docs/guide ./docs-ko/guide -t ko
llm-translate dir ./docs/api ./docs-ko/api -t ko
```

### 4. 利用缓存

缓存允许跳过未更改的内容：

```bash
# First run: translates all
llm-translate dir ./docs ./docs-ko -t ko

# Second run: uses cache for unchanged content
llm-translate dir ./docs ./docs-ko -t ko
```

### 5. 按内容类型的质量

```bash
# High quality for user-facing docs
llm-translate dir ./docs/public ./docs-ko/public -t ko --quality 95

# Standard quality for internal docs
llm-translate dir ./docs/internal ./docs-ko/internal -t ko --quality 80
```
