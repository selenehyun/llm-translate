# CLI 참조

::: info 번역
모든 비영어 문서는 Claude Sonnet 4를 사용하여 자동으로 번역됩니다.
:::

llm-translate는 문서 번역을 위한 명령줄 인터페이스를 제공합니다.

## 설치

```bash
npm install -g @llm-translate/cli
```

## 전역 옵션

이 옵션들은 모든 명령에서 사용할 수 있습니다:

| 옵션 | 설명 |
|--------|-------------|
|`--help `,`-h`| 도움말 표시 |
|`--version `,`-V`| 버전 표시 |
|`--verbose `,`-v`| 상세 출력 활성화 |
|`--quiet `,`-q`| 필수가 아닌 출력 억제 |
|`--config`| 설정 파일 경로 |

## 명령

### [file](./file)

단일 파일을 번역합니다.

```bash
llm-translate file <input> [output] [options]
```

### [dir](./dir)

디렉토리의 모든 파일을 번역합니다.

```bash
llm-translate dir <input> <output> [options]
```

### [init](./init)

설정 파일을 초기화합니다.

```bash
llm-translate init [options]
```

### [glossary](./glossary)

용어집 파일을 관리합니다.

```bash
llm-translate glossary <subcommand> [options]
```

## 빠른 예제

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

## 종료 코드

| 코드 | 설명 |
|------|-------------|
| 0 | 성공 |
| 1 | 일반 오류 |
| 2 | 잘못된 인수 |
| 3 | 파일을 찾을 수 없음 |
| 4 | 품질 임계값 미달 (엄격 모드) |
| 5 | 제공자/API 오류 |
| 6 | 용어집 검증 실패 |

## 환경 변수

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx
OLLAMA_BASE_URL=http://localhost:11434
```

## 설정 우선순위

설정은 다음 순서로 적용됩니다 (나중 설정이 이전 설정을 덮어씁니다):

1. 내장 기본값
2. 설정 파일 (`.translaterc.json`)
3. 환경 변수
4. CLI 인수

자세한 내용은 [설정](../guide/configuration)을 참조하세요.
