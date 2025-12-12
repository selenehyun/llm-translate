# llm-translate 术语表

管理术语表文件以确保术语的一致性。

## 概要

```bash
llm-translate glossary <subcommand> [options]
```

## 子命令

### list

列出术语表中的所有术语。

```bash
llm-translate glossary list --glossary glossary.json
```

选项：
| 选项 | 描述 |
|--------|-------------|
|`--glossary `,`-g`| 术语表文件路径（必需） |
|`--target `,`-t`| 按目标语言筛选 |
|`--format `| 输出格式：` table `、` json`|

示例：

```bash
# List all terms
llm-translate glossary list -g glossary.json

# Filter by target language
llm-translate glossary list -g glossary.json --target ko

# JSON output
llm-translate glossary list -g glossary.json --format json
```

输出：
```
Glossary: glossary.json (15 terms)

Source          | Korean (ko)      | Japanese (ja)    | Flags
----------------|------------------|------------------|-------
component       | 컴포넌트         | コンポーネント    |
prop            | 프롭             | プロップ          |
state           | 상태             | ステート          |
TypeScript      | -                | -                | DNT
API             | -                | -                | DNT, CS

DNT = Do Not Translate, CS = Case Sensitive
```

### validate

验证术语表文件的结构和内容。

```bash
llm-translate glossary validate --glossary glossary.json
```

选项：
| 选项 | 描述 |
|--------|-------------|
|`--glossary `,`-g`| 术语表文件路径（必需） |
|`--strict`| 在出现警告时失败 |

示例：

```bash
# Basic validation
llm-translate glossary validate -g glossary.json

# Strict mode
llm-translate glossary validate -g glossary.json --strict
```

输出：
```
Validating glossary.json...

✓ Valid JSON structure
✓ Required fields present
✓ 15 terms found

Warnings:
  - Term "component" has no context
  - Term "hook" missing Japanese translation

✓ Validation passed (2 warnings)
```

### add

向术语表添加新术语。

```bash
llm-translate glossary add <source> [options]
```

选项：
| 选项 | 描述 |
|--------|-------------|
|`--glossary `,`-g`| 术语表文件路径（必需） |
|`--target `| 目标翻译（格式：` lang=value`） |
|`--context`| 术语的上下文 |
|`--dnt`| 标记为"不翻译" |
|`--case-sensitive`| 标记为区分大小写 |

示例：

```bash
# Add with translations
llm-translate glossary add "container" \
  -g glossary.json \
  --target ko="컨테이너" \
  --target ja="コンテナ"

# Add do-not-translate term
llm-translate glossary add "Kubernetes" \
  -g glossary.json \
  --dnt

# Add with context
llm-translate glossary add "instance" \
  -g glossary.json \
  --target ko="인스턴스" \
  --context "Cloud computing instance"
```

### remove

从术语表中删除术语。

```bash
llm-translate glossary remove <source> --glossary glossary.json
```

示例：

```bash
llm-translate glossary remove "deprecated-term" -g glossary.json
```

### update

更新现有术语。

```bash
llm-translate glossary update <source> [options]
```

选项：
| 选项 | 描述 |
|--------|-------------|
|`--glossary `,`-g`| 术语表文件路径（必需） |
|`--target`| 更新目标翻译 |
|`--context`| 更新上下文 |
|`--dnt`| 设置/取消设置不翻译 |

示例：

```bash
# Update translation
llm-translate glossary update "component" \
  -g glossary.json \
  --target ko="컴포넌트 요소"

# Add context
llm-translate glossary update "state" \
  -g glossary.json \
  --context "React component state"
```

### stats

显示术语表统计信息。

```bash
llm-translate glossary stats --glossary glossary.json
```

输出：
```
Glossary Statistics: glossary.json

Terms: 15
  - With translations: 12
  - Do not translate: 3

Languages:
  - Korean (ko): 12 terms
  - Japanese (ja): 10 terms
  - Chinese (zh): 8 terms

Token estimate: ~450 tokens
```

### merge

合并多个术语表。

```bash
llm-translate glossary merge \
  --input glossary-a.json \
  --input glossary-b.json \
  --output merged.json
```

选项：
| 选项 | 描述 |
|--------|-------------|
|`--input `,`-i`| 输入术语表文件（多个） |
|`--output `,`-o`| 输出合并后的术语表 |
|`--strategy `| 冲突解决方案：` first `、` last `、` error`|

### export

将术语表导出为不同格式。

```bash
llm-translate glossary export --glossary glossary.json --format csv
```

选项：
| 选项 | 描述 |
|--------|-------------|
|`--format `| 导出格式：` csv `、` tsv `、` xlsx`|
|`--output `,`-o`| 输出文件路径 |

## 最佳实践

### 组织大型术语表

```bash
# Split by domain
glossaries/
├── common.json      # Shared terms
├── frontend.json    # UI terminology
├── backend.json     # Server terminology
└── devops.json      # Infrastructure terms

# Merge for use
llm-translate glossary merge \
  -i glossaries/common.json \
  -i glossaries/frontend.json \
  -o project-glossary.json
```

### 版本控制

将术语表纳入版本控制：

```bash
git add glossary.json
git commit -m "Add project glossary"
```

### 定期维护

```bash
# Validate before commits
llm-translate glossary validate -g glossary.json --strict

# Review stats periodically
llm-translate glossary stats -g glossary.json
```
