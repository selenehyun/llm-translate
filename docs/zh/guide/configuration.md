# 配置

llm-translate 使用分层配置系统。设置按以下顺序应用（后面的覆盖前面的）：

1. 内置默认值
2. 配置文件 (`.translaterc.json`)
3. 环境变量
4. CLI 参数

## 配置文件

在项目根目录创建 `.translaterc.json`：

```json
{
  "provider": {
    "name": "claude",
    "model": "claude-haiku-4-5-20251001",
    "apiKey": null
  },
  "translation": {
    "qualityThreshold": 85,
    "maxIterations": 4,
    "preserveFormatting": true
  },
  "chunking": {
    "maxTokens": 1024,
    "overlapTokens": 150
  },
  "paths": {
    "glossary": "./glossary.json",
    "cache": "./.translate-cache"
  }
}
```

### 提供商设置

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
|`name `| string |`"claude"`| 提供商名称：` claude `、` openai `、` ollama`|
|`model`| string | 因提供商而异 | 模型标识符 |
|`apiKey`| string | null | API 密钥（建议使用环境变量） |
|`baseUrl`| string | null | 自定义 API 端点 |

### 翻译设置

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
|`qualityThreshold `| number |` 85`| 最低质量分数（0-100） |
|`maxIterations `| number |` 4`| 最大优化迭代次数 |
|`preserveFormatting `| boolean |` true`| 保留 Markdown/HTML 结构 |

### Chunking 设置

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
|`maxTokens `| number |` 1024`| 每个分块的最大令牌数 |
|`overlapTokens `| number |` 150`| 分块之间的上下文重叠 |

### 路径设置

| 选项 | 类型 | 默认值 | 描述 |
|--------|------|---------|-------------|
|`glossary`| string | null | 术语表文件路径 |
|`cache`| string | null | 翻译缓存路径 |

## 环境变量

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
OLLAMA_BASE_URL=http://localhost:11434

# Default Settings
LLM_TRANSLATE_PROVIDER=claude
LLM_TRANSLATE_MODEL=claude-haiku-4-5-20251001
LLM_TRANSLATE_QUALITY_THRESHOLD=85
```

## CLI 覆盖示例

```bash
# Override provider
llm-translate file doc.md -o doc.ko.md --target ko --provider openai

# Override model
llm-translate file doc.md -o doc.ko.md --target ko --model claude-sonnet-4-5-20250929

# Override quality threshold
llm-translate file doc.md -o doc.ko.md --target ko --quality 90

# Override max iterations
llm-translate file doc.md -o doc.ko.md --target ko --max-iterations 6
```

## 按项目配置

对于 monorepos 或多项目设置，在每个项目目录中放置 `.translaterc.json`：

```
my-monorepo/
├── packages/
│   ├── frontend/
│   │   ├── .translaterc.json  # Frontend-specific terms
│   │   └── docs/
│   └── backend/
│       ├── .translaterc.json  # Backend-specific terms
│       └── docs/
└── .translaterc.json          # Shared defaults
```

llm-translate 会从当前目录向上搜索配置文件。

## 模型选择指南

| 模型 | 速度 | 质量 | 成本 | 最适用于 |
|-------|-------|---------|------|----------|
|`claude-haiku-4-5-20251001`| 快 | 良好 | 低 | 通用文档、大量翻译 |
|`claude-sonnet-4-5-20250929`| 中等 | 优秀 | 中等 | 技术文档、质量关键 |
|`claude-opus-4-5-20251101`| 慢 | 最佳 | 高 | 复杂内容、细微差别文本 |
|`gpt-4o-mini`| 快 | 良好 | 低 | Haiku 的替代方案 |
|`gpt-4o`| 中等 | 优秀 | 中等 | Sonnet 的替代方案 |

## 质量阈值指南

| 阈值 | 使用场景 |
|-----------|----------|
| 70-75 | 草稿翻译、内部文档 |
| 80-85 | 标准文档（默认） |
| 90-95 | 面向公众、营销内容 |
| 95+ | 法律、医疗、受监管内容 |

更高的阈值需要更多迭代，成本也更高。
