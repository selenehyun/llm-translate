---
layout: home

hero:
  name: llm-translate
  text: LLM 기반 문서 번역
  tagline: 용어집 적용, 품질 관리, 비용 최적화를 통한 문서 번역
  actions:
    - theme: brand
      text: 시작하기
      link: ./guide/getting-started
    - theme: alt
      text: GitHub에서 보기
      link: https://github.com/selenehyun/llm-translate

features:
  - icon: 📚
    title: 용어집 적용
    details: 용어집에 정의된 용어를 적용하여 번역 전체에서 일관된 용어를 보장하고 오역을 방지합니다.
  - icon: 🔄
    title: Self-Refine 품질 관리
    details: AI 기반 품질 평가를 사용한 반복적 번역 개선으로 품질 임계값을 충족합니다.
  - icon: 💰
    title: 비용 최적화
    details: 프롬프트 캐싱은 용어집, 시스템 프롬프트 등 반복되는 콘텐츠의 API 비용을 최대 90%까지 절감합니다.
  - icon: 🔌
    title: 다중 제공자 지원
    details: Claude, OpenAI, Ollama를 지원합니다. 워크플로우를 변경하지 않고 제공자를 전환할 수 있습니다.
  - icon: 📄
    title: 형식 보존
    details: 번역 중에 Markdown 형식, 코드 블록, 링크 및 문서 구조를 유지합니다.
  - icon: ⚡
    title: 배치 처리
    details: 병렬 처리와 진행 상황 추적으로 전체 디렉토리를 한 번에 번역합니다.
---

## 빠른 시작

```bash
# Install globally
npm install -g @llm-translate/cli

# Set your API key
export ANTHROPIC_API_KEY=your-key-here

# Translate a file
llm-translate file README.md -o README.ko.md --target ko
```

## llm-translate를 사용하는 이유는?

기존 번역 도구는 기술 문서를 제대로 번역하지 못합니다:

- **일관되지 않은 용어** - "API endpoint"가 매번 다르게 번역됨
- **손상된 형식** - 코드 블록 및 Markdown이 손상됨
- **품질 관리 없음** - LLM이 출력하는 모든 것을 수용

llm-translate는 다음을 통해 이러한 문제를 해결합니다:

1. **용어집 적용** - 용어를 한 번 정의하고 모든 곳에 적용
2. **AST 기반 Chunking** - 문서 구조 보존
3. **품질 기반 개선** - 품질 임계값을 충족할 때까지 반복
4. **프롬프트 캐싱** - 대용량 문서의 비용 절감
