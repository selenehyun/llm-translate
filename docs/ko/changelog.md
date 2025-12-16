# 변경 로그

::: info 번역
모든 비영어 문서는 Claude Sonnet 4를 사용하여 자동으로 번역됩니다.
:::

llm-translate의 모든 주목할 만한 변경 사항이 이 파일에 문서화됩니다.

형식은 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)를 기반으로 하며,
이 프로젝트는 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)을 준수합니다.

## [Unreleased]

### 추가됨

- Claude 모델에 대한 프롬프트 캐싱 지원 (40-50% 비용 절감)
- 번역 결과에서 캐시 토큰 사용량 추적
- TranslationAgent의 `enableCaching` 옵션
- 토큰 사용량 메타데이터의 `cacheRead` 및 `cacheWrite` 필드
- MQM (Multidimensional Quality Metrics) 기반 품질 평가 시스템
- MAPS 스타일 사전 번역 분석 단계
- 번역 모드 지원 (`--mode fast|balanced|quality`)

### 변경됨

-`ChatMessage.content` 가 이제 캐시 가능한 텍스트 부분을 지원합니다
-`ChatResponse.usage` 에 캐시 토큰 메트릭이 포함됩니다
- 기본 모델이 `claude-haiku-4-5-20251001` 로 업데이트되었습니다

### 문서

- Ollama 품질 경고 추가: 신뢰할 수 있는 번역을 위해서는 14B+ 모델이 필요합니다

## [0.1.0] - 2025-12-12

### 추가됨

- 초기 릴리스
- 단일 파일 번역 (`llm-translate file`)
- 디렉토리 일괄 번역 (`llm-translate dir`)
- 구성 초기화 (`llm-translate init`)
- 용어집 관리 (`llm-translate glossary`)
- Claude, OpenAI, Ollama 제공자 지원
- Self-Refine 품질 제어 루프
- Markdown AST 기반 Chunking
- 용어집 적용
- 품질 임계값 구성
- 상세 출력 모드

### 제공자

- Claude (claude-haiku-4-5, claude-sonnet-4-5, claude-opus-4-5)
- OpenAI (gpt-4o-mini, gpt-4o, gpt-4-turbo)
- Ollama (모든 로컬 모델)

### 문서

- CLI 참조 문서
- API 참조 문서
- 시작하기 가이드
- 구성 가이드
- 용어집 가이드
- 품질 제어 가이드
- 비용 최적화 가이드
