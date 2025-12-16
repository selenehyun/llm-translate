# CLI 参考

::: info 翻译说明
所有非英文文档均使用 Claude Sonnet 4 自动翻译。
:::

llm-translate 提供了用于翻译文档的命令行界面。

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
llm-translate file README.md -o README.ko.md -s en -t ko

# Translate with glossary
llm-translate file docs/guide.md -o docs/guide.ja.md \
  -s en -t ja --glossary glossary.json

# Batch translate a directory
llm-translate dir ./docs ./docs-ko -s en -t ko

# Initialize config
llm-translate init --provider claude

# Validate glossary
llm-translate glossary validate glossary.json
```

## 退出代码

| 代码 | 描述 |
|------|-------------|
| 0 | 成功 |
| 1 | 一般错误 |
| 2 | 无效参数 |
| 3 | 文件未找到 |
| 4 | 未达到质量阈值（严格模式） |
| 5 | 提供商/API 错误 |
| 6 | 术语表验证失败 |

## 环境变量

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
OLLAMA_BASE_URL=http://localhost:11434
```

## 配置优先级

设置按以下顺序应用（后者覆盖前者）：

1. 内置默认值
2. 配置文件 (`.translaterc.json`)
3. 环境变量
4. CLI 参数

详情请参见[配置](../guide/configuration)。
