# llm-translate dir

::: info 번역
모든 비영어 문서는 Claude Sonnet 4를 사용하여 자동으로 번역됩니다.
:::

디렉토리의 모든 파일을 번역합니다.

## 개요

```bash
llm-translate dir <input> <output> [options]
```

## 인수

| 인수 | 설명 |
|----------|-------------|
|`<input>`| 입력 디렉토리 경로 (필수) |
|`<output>`| 출력 디렉토리 경로 (필수) |

## 옵션

### 언어 옵션

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
|`-s, --source-lang <lang>`| 설정 기본값 | 소스 언어 코드 |
|`-t, --target-lang <lang>`| 필수 | 대상 언어 코드 |

### 번역 옵션

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
|`-g, --glossary <path>`| 없음 | 용어집 파일 경로 |
|`-p, --provider <name>`|` claude`| LLM 제공자 (claude\|openai\|ollama) |
|`-m, --model <name>`| 제공자 기본값 | 모델 이름 |
|`--context <text>`| 없음 | 번역을 위한 추가 컨텍스트 |

### 품질 옵션

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
|`--quality <0-100>`| 85 | 품질 임계값 |
|`--max-iterations <n>`| 4 | 최대 개선 반복 횟수 |

### 파일 선택

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
|`--include <patterns>`|`*.md,*.markdown`| 포함할 파일 패턴 (쉼표로 구분) |
|`--exclude <patterns>`| 없음 | 제외할 파일 패턴 (쉼표로 구분) |

### 처리 옵션

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
|`--parallel <n>`| 3 | 병렬 파일 처리 |
|`--chunk-size <tokens>`| 1024 | 청크당 최대 토큰 수 |
|`--no-cache`| false | 번역 캐시 비활성화 |

### 출력 옵션

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
|`-f, --format <fmt>`| auto | 출력 형식 강제 지정 (md\|html\|txt) |
|`--dry-run`| false | 번역될 내용 미리보기 |
|`--json`| false | 결과를 JSON으로 출력 |
|`-v, --verbose`| false | 상세 로깅 활성화 |
|`-q, --quiet`| false | 오류가 아닌 출력 억제 |

## 예제

### 기본 사용법

```bash
# Translate all markdown files
llm-translate dir ./docs ./docs-ko -s en -t ko

# With glossary
llm-translate dir ./docs ./docs-ko -s en -t ko -g glossary.json
```

### 파일 선택

```bash
# Custom include pattern
llm-translate dir ./docs ./docs-ko -s en -t ko --include "**/*.md"

# Multiple patterns
llm-translate dir ./docs ./docs-ko -s en -t ko --include "*.md,*.markdown,*.mdx"

# Exclude certain directories
llm-translate dir ./docs ./docs-ko -s en -t ko \
  --exclude "node_modules/**,dist/**,drafts/**"
```

### 병렬 처리

```bash
# Process 5 files in parallel
llm-translate dir ./docs ./docs-ko -s en -t ko --parallel 5

# Sequential processing (for rate-limited APIs)
llm-translate dir ./docs ./docs-ko -s en -t ko --parallel 1
```

### 품질 설정

```bash
# High quality for important docs
llm-translate dir ./docs ./docs-ko -s en -t ko --quality 95 --max-iterations 6

# Faster processing with lower threshold
llm-translate dir ./docs ./docs-ko -s en -t ko --quality 70 --max-iterations 2
```

### 미리보기 모드

```bash
# Show what would be translated
llm-translate dir ./docs ./docs-ko -s en -t ko --dry-run
```

출력:
```
Dry run mode - no translation will be performed

Files to translate:
  getting-started.md → docs-ko/getting-started.md
  guide/setup.md → docs-ko/guide/setup.md
  api/reference.md → docs-ko/api/reference.md

Total: 3 file(s)
```

## 출력 구조

디렉토리 구조는 기본적으로 보존됩니다:

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

## 진행 상황 보고

### 일반 모드

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

### JSON 출력

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

## 모범 사례

### 1. 먼저 미리보기

```bash
llm-translate dir ./docs ./docs-ko -s en -t ko --dry-run
```

### 2. 적절한 병렬 처리 사용

- 속도 제한이 있는 API:`--parallel 1-2`
- 높은 제한:`--parallel 5-10`
- 로컬 (Ollama):`--parallel 1`(모델 제한)

### 3. 대규모 프로젝트 처리

```bash
# Split by subdirectory for better control
llm-translate dir ./docs/guide ./docs-ko/guide -s en -t ko
llm-translate dir ./docs/api ./docs-ko/api -s en -t ko
```

### 4. 캐싱 활용

캐시를 사용하면 변경되지 않은 콘텐츠를 건너뛸 수 있습니다:

```bash
# First run: translates all
llm-translate dir ./docs ./docs-ko -s en -t ko

# Second run: uses cache for unchanged content
llm-translate dir ./docs ./docs-ko -s en -t ko
```

### 5. 콘텐츠 유형별 품질

```bash
# High quality for user-facing docs
llm-translate dir ./docs/public ./docs-ko/public -s en -t ko --quality 95

# Standard quality for internal docs
llm-translate dir ./docs/internal ./docs-ko/internal -s en -t ko --quality 80
```
