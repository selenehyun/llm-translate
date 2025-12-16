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
    details: 잘못 번역되지 않는 강제 용어집 용어를 통해 번역 전반에 걸쳐 일관된 용어를 보장합니다.
  - icon: 🔄
    title: Self-Refine 품질 관리
    details: AI 기반 품질 평가를 사용한 반복적 번역 개선으로 품질 임계값을 충족합니다.
  - icon: 💰
    title: 비용 최적화
    details: 프롬프트 캐싱으로 용어집 및 시스템 프롬프트와 같은 반복 콘텐츠에 대한 API 비용을 최대 90%까지 절감합니다.
  - icon: 🔌
    title: 다중 제공자 지원
    details: Claude, OpenAI, Ollama와 함께 작동합니다. 워크플로우를 변경하지 않고도 제공자를 전환할 수 있습니다.
  - icon: 📄
    title: 형식 보존
    details: 번역 중에 Markdown 형식, 코드 블록, 링크 및 문서 구조를 유지합니다.
  - icon: ⚡
    title: 일괄 처리
    details: 병렬 처리 및 진행률 추적으로 전체 디렉토리를 번역합니다.
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

## 왜 llm-translate인가요?

기존 번역 도구는 기술 문서에서 어려움을 겪습니다:

- **일관성 없는 용어** - "API endpoint"가 매번 다르게 번역됨
- **깨진 형식** - 코드 블록과 Markdown이 손상됨
- **품질 관리 없음** - LLM이 출력하는 것을 그대로 수용

llm-translate는 다음과 같이 이러한 문제를 해결합니다:
