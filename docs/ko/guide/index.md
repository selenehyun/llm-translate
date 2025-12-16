# llm-translate란 무엇입니까?

::: info 번역
모든 비영어 문서는 Claude Sonnet 4를 사용하여 자동으로 번역됩니다.
:::

llm-translate는 대규모 언어 모델을 사용하여 문서를 번역하는 CLI 도구입니다. 일관성, 정확성, 형식 보존이 중요한 기술 문서를 위해 특별히 설계되었습니다.

## 주요 기능

### 용어집 강제 적용

도메인별 전문 용어를 한 번 정의하고 모든 문서에서 일관되게 번역되도록 보장합니다.

```json
{
  "terms": [
    {
      "source": "API endpoint",
      "targets": { "ko": "API 엔드포인트", "ja": "APIエンドポイント" }
    },
    {
      "source": "Kubernetes",
      "doNotTranslate": true
    }
  ]
}
```

### Self-Refine 품질 관리

llm-translate는 단순히 한 번 번역하고 끝내지 않습니다. 반복적인 개선 프로세스를 사용합니다:
