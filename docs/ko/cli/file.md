# llm-translate file

단일 파일을 번역합니다.

## 개요

```bash
llm-translate file <input> [output] [options]
```

## 인수

| 인수 | 설명 |
|----------|-------------|
|`<input>`| 입력 파일 경로 (필수) |
|`[output]`| 출력 파일 경로 (선택사항, 기본값: stdout) |

## 옵션

### 번역 옵션

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
|`--source `,`-s`| 자동 감지 | 원본 언어 코드 |
|`--target `,`-t`| 필수 | 대상 언어 코드 |
|`--glossary `,`-g`| 없음 | 용어집 파일 경로 |

### 품질 옵션

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
|`--quality `,`-q`| 85 | 품질 임계값 (0-100) |
|`--max-iterations`| 4 | 최대 개선 반복 횟수 |
|`--strict`| false | 임계값 미충족 시 실패 |

### 제공자 옵션

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
|`--provider `,`-p`| claude | 제공자 이름 |
|`--model `,`-m`| 다양함 | 모델 식별자 |

### 출력 옵션

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
|`--output `,`-o`| stdout | 출력 파일 경로 |
|`--overwrite`| false | 기존 출력 덮어쓰기 |
|`--dry-run`| false | 수행할 작업 표시 |

### 고급 옵션

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
|`--no-cache`| false | 프롬프트 캐싱 비활성화 |
|`--chunk-size`| 1024 | 청크당 최대 토큰 |

## 예제

### 기본 사용법

```bash
# Translate to Korean, output to stdout
llm-translate file README.md --target ko

# Translate to file
llm-translate file README.md -o README.ko.md --target ko

# Specify source language
llm-translate file doc.md -o doc.ja.md --source en --target ja
```

### 용어집 포함

```bash
# Use glossary for consistent terminology
llm-translate file api-docs.md -o api-docs.ko.md \
  --target ko \
  --glossary glossary.json
```

### 품질 제어

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

### 제공자 선택

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

### stdin에서 입력

```bash
# Pipe content
cat doc.md | llm-translate file - --target ko > doc.ko.md

# Use with other tools
curl https://example.com/doc.md | llm-translate file - --target ko
```

## 출력 형식

### 일반 모드

```
✓ Translated README.md → README.ko.md
  Quality: 92/85 (threshold met)
  Duration: 3.2s
```

### 상세 모드

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

## 언어 코드

일반적인 언어 코드:

| 코드 | 언어 |
|------|----------|
|`en`| 영어 |
|`ko`| 한국어 |
|`ja`| 일본어 |
|`zh`| 중국어 (간체) |
|`zh-TW`| 중국어 (번체) |
|`es`| 스페인어 |
|`fr`| 프랑스어 |
|`de`| 독일어 |

## 오류 처리

### 파일을 찾을 수 없음

```bash
$ llm-translate file missing.md --target ko
Error: File not found: missing.md
Exit code: 3
```

### 품질 미충족 (엄격 모드)

```bash
$ llm-translate file doc.md -o doc.ko.md --target ko --quality 99 --strict
Error: Quality threshold not met: 94/99
Exit code: 4
```

### API 오류

```bash
$ llm-translate file doc.md --target ko
Error: Provider error: Rate limit exceeded
Exit code: 5
```
