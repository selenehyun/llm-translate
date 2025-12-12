# CLI 参考

llm-translate 提供了一个命令行界面用于翻译文档。

## 安装

```bash
npm install -g @llm-translate/cli
```

## 全局选项

这些选项适用于所有命令：

| 选项 | 描述 |
|--------|-------------|
|`--help `,`-h`| 显示帮助 |
|`--version `,`-V`| 显示版本 |
|`--verbose `,`-v`| 启用详细输出 |
|`--quiet `,`-q`| 抑制非必要输出 |
|`--config`| 配置文件路径 |

## 命令

### [file](./file)

翻译单个文件。

```bash
llm-translate file <input> [output] [options]
```

### [dir](./dir)

翻译目录中的所有文件。

```bash
llm-translate dir <input> <output> [options]
```

### [init](./init)

初始化配置文件。

```bash
llm-translate init [options]
```

### [glossary](./glossary)

管理术语表文件。

```bash
llm-translate glossary <subcommand> [options]
```

## 快速示例

```bash
# Translate a file to Korean
llm-translate file README.md -o README.ko.md --target ko

# Translate with glossary
llm-translate file docs/guide.md -o docs/guide.ja.md \
  --target ja --glossary glossary.json

# Batch translate a directory
llm-translate dir ./docs ./docs-ko --target ko

# Initialize config
llm-translate init --provider claude

# Validate glossary
llm-translate glossary validate --glossary glossary.json
```

## 退出代码

| 代码 | 描述 |
|------|-------------|
| 0 | 成功 |
| 1 | 常规错误 |
| 2 | 无效参数 |
| 3 | 文件未找到 |
| 4 | 质量阈值未达到（严格模式） |
| 5 | 提供商/API 错误 |
| 6 | 术语表验证失败 |

## 环境变量

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
OLLAMA_BASE_URL=http://localhost:11434

# Defaults
LLM_TRANSLATE_PROVIDER=claude
LLM_TRANSLATE_MODEL=claude-haiku-4-5-20251001
```

## 配置优先级

设置按以下顺序应用（后面的覆盖前面的）：

1. 内置默认值
2. 配置文件 (`.translaterc.json`)
3. 环境变量
4. CLI 参数

详见[配置](../guide/configuration)。
