# llm-translate glossary

::: info 번역
모든 비영어 문서는 Claude Sonnet 4를 사용하여 자동으로 번역됩니다.
:::

일관된 용어 사용을 위한 용어집 파일을 관리합니다.

## 개요

```bash
llm-translate glossary <subcommand> [options]
```

## 하위 명령어

### list

용어집의 모든 용어를 나열합니다.

```bash
llm-translate glossary list --glossary glossary.json
```

옵션:
| 옵션 | 설명 |
|--------|-------------|
|`--glossary `,`-g`| 용어집 파일 경로 (필수) |
|`--target `,`-t`| 대상 언어로 필터링 |
|`--format `| 출력 형식:` table `,` json`|

예시:

```bash
# List all terms
llm-translate glossary list -g glossary.json

# Filter by target language
llm-translate glossary list -g glossary.json --target ko

# JSON output
llm-translate glossary list -g glossary.json --format json
```

출력:
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

용어집 파일 구조와 내용을 검증합니다.

```bash
llm-translate glossary validate --glossary glossary.json
```

옵션:
| 옵션 | 설명 |
|--------|-------------|
|`--glossary `,`-g`| 용어집 파일 경로 (필수) |
|`--strict`| 경고 시 실패 |

예시:

```bash
# Basic validation
llm-translate glossary validate -g glossary.json

# Strict mode
llm-translate glossary validate -g glossary.json --strict
```

출력:
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

용어집에 새 용어를 추가합니다.

```bash
llm-translate glossary add <source> [options]
```

옵션:
| 옵션 | 설명 |
|--------|-------------|
|`--glossary `,`-g`| 용어집 파일 경로 (필수) |
|`--target `| 대상 번역 (형식:` lang=value`) |
|`--context`| 용어의 맥락 |
|`--dnt`| "번역하지 않음"으로 표시 |
|`--case-sensitive`| 대소문자 구분으로 표시 |

예시:

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

용어집에서 용어를 제거합니다.

```bash
llm-translate glossary remove <source> --glossary glossary.json
```

예시:

```bash
llm-translate glossary remove "deprecated-term" -g glossary.json
```

### update

기존 용어를 업데이트합니다.

```bash
llm-translate glossary update <source> [options]
```

옵션:
| 옵션 | 설명 |
|--------|-------------|
|`--glossary `,`-g`| 용어집 파일 경로 (필수) |
|`--target`| 대상 번역 업데이트 |
|`--context`| 맥락 업데이트 |
|`--dnt`| 번역하지 않음 설정/해제 |

예시:

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

용어집 통계를 표시합니다.

```bash
llm-translate glossary stats --glossary glossary.json
```

출력:
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

여러 용어집을 병합합니다.

```bash
llm-translate glossary merge \
  --input glossary-a.json \
  --input glossary-b.json \
  --output merged.json
```

옵션:
| 옵션 | 설명 |
|--------|-------------|
|`--input `,`-i`| 입력 용어집 파일들 (다중) |
|`--output `,`-o`| 병합된 용어집 출력 |
|`--strategy `| 충돌 해결:` first `,` last `,` error`|

### export

용어집을 다른 형식으로 내보냅니다.

```bash
llm-translate glossary export --glossary glossary.json --format csv
```

옵션:
| 옵션 | 설명 |
|--------|-------------|
|`--format `| 내보내기 형식:` csv `,` tsv `,` xlsx`|
|`--output `,`-o`| 출력 파일 경로 |

## 모범 사례

### 대규모 용어집 구성

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

### 버전 관리

용어집을 버전 관리에 포함시킵니다:

```bash
git add glossary.json
git commit -m "Add project glossary"
```

### 정기적인 유지보수

```bash
# Validate before commits
llm-translate glossary validate -g glossary.json --strict

# Review stats periodically
llm-translate glossary stats -g glossary.json
```
