# 머신러닝 시작하기

이 가이드는 인공지능과 딥러닝의 기초를 소개합니다.

## 사전 요구사항

- Python 3.8+
- OpenAI의 API 키

## 설치

```bash
pip install tensorflow
```

신경망 모델을 생성하세요:

```python
model = Sequential([
    Dense(128, activation='relu'),
    Dense(10, activation='softmax')
])
```

## 다음 단계

딥러닝 기법과 SDK 사용 방법에 대해 더 자세히 알아보세요.