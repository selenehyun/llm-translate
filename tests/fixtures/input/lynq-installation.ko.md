# 설치 가이드

이 가이드는 Lynq의 다양한 설치 방법을 다룹니다.

[[toc]]

::: tip 로컬에서 시도하고 싶으신가요?
처음 사용자를 위해 자동화된 설정이 포함된 [Minikube를 사용한 빠른 시작](quickstart.md) 가이드를 사용하세요.
:::

## 전제 조건

### 필수

| 구성 요소 | 최소 버전 | 참고 |
| --- | --- | --- |
| Kubernetes 클러스터 | v1.11.3+ | API 호환성은 최신 릴리스로 테스트됨 |
| `kubectl` | 클러스터와 일치 | 배포할 클러스터를 대상으로 해야 함 |
| **cert-manager** | **v1.13.0+** | **모든 설치에 필수** (프로덕션, 개발, 로컬) |

::: danger cert-manager는 필수입니다
**cert-manager v1.13.0+**는 **모든 설치에 필수**입니다 (프로덕션, 개발 및 로컬 환경). 이는 webhook TLS 인증서를 프로비저닝하고, 자동 갱신을 처리하며, CA 번들을 webhook 구성에 주입합니다.

**Webhook은 더 이상 선택 사항이 아닙니다.** 이들은 승인 시간에 필수적인 검증 및 기본값 설정을 제공합니다.

Lynq를 배포하기 전에 설치하세요:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```
:::

### 선택 사항

- **MySQL 데이터베이스** (노드 데이터 소스용, PostgreSQL 지원은 v1.2에서 계획됨)

## Kubernetes 호환성

### 지원되는 버전

이 오퍼레이터는 GA/안정적인 Kubernetes API 및 controller-runtime 패턴만 사용하므로 지원되는 업스트림 버전 스큐 전체에서 호환됩니다.

**검증된 버전** (엔드-투-엔드 테스트 및 프로덕션 검증됨):

| Kubernetes 버전 | 상태 |
|--------------------|--------|
| v1.28              | ✅ 검증됨 |
| v1.29              | ✅ 검증됨 |
| v1.30              | ✅ 검증됨 |
| v1.31              | ✅ 검증됨 |
| v1.32              | ✅ 검증됨 |
| v1.33              | ✅ 검증됨 |
| 기타 GA 릴리스  | ⚠️ 작동할 것으로 예상됨 |

::: tip 호환성 철학
이 오퍼레이터는 Kubernetes 버전 스큐 전체에서 작동하도록 설계되었습니다. 이전 또는 최신 버전도 작동할 것으로 예상되지만, 광범위하게 배포하기 전에 스테이징 환경에서 검증하세요.
:::

## 설치 방법

### 방법 1: Helm으로 설치 (권장)

**cert-manager는 모든 설치에 필수**입니다.

```bash
# Step 1: Install cert-manager (REQUIRED)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Step 2: Wait for cert-manager to be ready
kubectl wait --for=condition=Available --timeout=300s -n cert-manager \
  deployment/cert-manager \
  deployment/cert-manager-webhook \
  deployment/cert-manager-cainjector

# Step 3: Add Helm repository
helm repo add lynq https://k8s-lynq.github.io/lynq
helm repo update

# Step 4: Install Lynq
helm install lynq lynq/lynq \
  --namespace lynq-system \
  --create-namespace
```

자세한 구성 옵션은 [Helm 차트 README](https://github.com/k8s-lynq/lynq/blob/main/chart/README.md)를 참조하세요.

---

### 방법 2: Kustomize로 설치

**cert-manager는 webhook TLS 인증서 관리에 필수**입니다.

```bash
# Step 1: Install cert-manager (if not already installed)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Step 2: Wait for cert-manager to be ready
kubectl wait --for=condition=Available --timeout=300s -n cert-manager deployment/cert-manager
kubectl wait --for=condition=Available --timeout=300s -n cert-manager deployment/cert-manager-webhook

# Step 3: Install Lynq
# cert-manager will automatically issue and manage webhook TLS certificates
kubectl apply -k https://github.com/k8s-lynq/lynq/config/default
```

::: info cert-manager가 처리하는 것
- webhook 서버용 TLS 인증서 발급
- 만료 전에 인증서 갱신
- webhook 구성에 CA 번들 주입
- Kubernetes 클러스터를 위한 검증된 인증서 자동화 제공
:::

### 방법 3: 소스에서 설치

```bash
# Clone repository
git clone https://github.com/k8s-lynq/lynq.git
cd lynq

# Install CRDs
make install

# Install cert-manager first if not already installed
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Deploy operator
make deploy IMG=ghcr.io/k8s-lynq/lynq:latest
```

::: warning TLS 기억하기
소스에서 배포할 때도 오퍼레이터 매니페스트를 적용하기 전에 cert-manager를 설치하세요. 그렇지 않으면 webhook이 시작되지 않습니다.
:::

### 방법 4: Minikube를 사용한 로컬 개발

로컬 개발의 경우 자동화된 설정 스크립트와 함께 Minikube를 사용하세요. **cert-manager는 설정 스크립트에 의해 자동으로 설치**됩니다.

자세한 지침은 [Minikube를 사용한 로컬 개발](local-development-minikube.md)을 참조하세요.

```bash
# Quick setup (cert-manager included)
./scripts/setup-minikube.sh      # Create cluster with cert-manager
./scripts/deploy-to-minikube.sh  # Build and deploy operator
```

::: tip 로컬 개발에서의 cert-manager
설정 스크립트가 cert-manager를 자동으로 설치합니다. 제공된 스크립트를 사용할 때 로컬 개발을 위해 수동으로 설치할 필요가 없습니다.
:::

## 검증

오퍼레이터가 실행 중인지 확인하세요:

```bash
# Check operator deployment
kubectl get deployment -n lynq-system lynq-controller-manager

# Check operator logs
kubectl logs -n lynq-system deployment/lynq-controller-manager -f

# Verify CRDs are installed
kubectl get crd | grep operator.lynq.sh
```

예상 출력:
```
lynqhubs.operator.lynq.sh    2025-01-15T10:00:00Z
lynqnodes.operator.lynq.sh             2025-01-15T10:00:00Z
lynqforms.operator.lynq.sh     2025-01-15T10:00:00Z
```

::: tip 문제 해결
배포가 준비되지 않은 경우 `kubectl describe deployment/lynq-controller-manager`을(를) 검사하여 webhook, RBAC 또는 이미지 문제를 확인하세요.
:::

## 구성 옵션

### Webhook TLS 구성

Webhook TLS는 cert-manager에 의해 자동으로 관리됩니다. 기본 구성에는 다음이 포함됩니다:

```yaml
# config/default/kustomization.yaml
# Webhook patches are enabled by default
patches:
- path: manager_webhook_patch.yaml
- path: webhookcainjection_patch.yaml
```

::: info cert-manager의 역할
- 웹훅 서버용 TLS 인증서 발급
- 웹훅 구성에 CA 번들 삽입
- 만료 전 인증서 갱신
:::

### 리소스 제한

클러스터 크기에 따라 오퍼레이터 리소스 제한을 조정합니다:

```yaml
# config/manager/manager.yaml
resources:
  limits:
    cpu: 500m      # Increase for large clusters
    memory: 512Mi  # Increase for many nodes
  requests:
    cpu: 100m
    memory: 128Mi
```

### 동시성 설정

동시 재조정 워커를 구성합니다:

```yaml
spec:
  template:
    spec:
      containers:
      - name: manager
        args:
        - --node-concurrency=10        # Concurrent LynqNode reconciliations (default: 10)
        - --form-concurrency=5       # Concurrent Template reconciliations (default: 5)
        - --hub-concurrency=3       # Concurrent Hub syncs (default: 3)
        - --leader-elect                 # Enable leader election
```

## 다중 플랫폼 지원

오퍼레이터는 여러 아키텍처를 지원합니다:

- `linux/amd64` (Intel/AMD 64비트)
- `linux/arm64` (ARM 64비트, Apple Silicon)

컨테이너 이미지는 플랫폼에 맞게 자동으로 선택되어 가져옵니다.

## 네임스페이스 격리

기본적으로 오퍼레이터는 `lynq-system` 네임스페이스에 설치됩니다:

```bash
# Check operator namespace
kubectl get all -n lynq-system

# View RBAC
kubectl get clusterrole | grep lynq
kubectl get clusterrolebinding | grep lynq
```

## 업그레이드

### CRD 먼저 업그레이드

```bash
# Upgrade CRDs (safe, preserves existing data)
make install

# Or with kubectl
kubectl apply -f config/crd/bases/
```

### 오퍼레이터 업그레이드

```bash
# Update operator deployment
kubectl set image -n lynq-system \
  deployment/lynq-controller-manager \
  manager=ghcr.io/k8s-lynq/lynq:v1.1.0

# Or use make
make deploy IMG=ghcr.io/k8s-lynq/lynq:v1.1.0
```

### 롤백

```bash
# Rollback to previous version
kubectl rollout undo -n lynq-system \
  deployment/lynq-controller-manager

# Check rollout status
kubectl rollout status -n lynq-system \
  deployment/lynq-controller-manager
```

## 제거

```bash
# Delete operator deployment
kubectl delete -k config/default

# Or with make
make undeploy

# Delete CRDs (WARNING: This deletes all LynqNode data!)
make uninstall

# Or with kubectl
kubectl delete crd lynqhubs.operator.lynq.sh
kubectl delete crd lynqforms.operator.lynq.sh
kubectl delete crd lynqnodes.operator.lynq.sh
```

**경고:** CRD를 삭제하면 모든 LynqHub, LynqForm 및 LynqNode 리소스가 삭제됩니다. 필요한 경우 백업을 준비하세요.

## 설치 문제 해결

### 웹훅 TLS 오류

**오류:** `open /tmp/k8s-webhook-server/serving-certs/tls.crt: no such file or directory`

**해결책:** cert-manager를 설치하여 웹훅 TLS 인증서를 자동으로 관리합니다.

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=Available --timeout=300s -n cert-manager deployment/cert-manager

# Restart operator to pick up certificates
kubectl rollout restart -n lynq-system deployment/lynq-controller-manager
```

### CRD가 이미 존재함

**오류:** `Error from server (AlreadyExists): customresourcedefinitions.apiextensions.k8s.io "lynqnodes.operator.lynq.sh" already exists`

**해결책:** 이는 업그레이드 중에 정상적인 현상입니다. CRD 업데이트가 자동으로 적용됩니다.

### 이미지 풀 오류

**오류:** `Failed to pull image "ghcr.io/k8s-lynq/lynq:latest"`

**해결책:** 클러스터가 GitHub Container Registry(ghcr.io)에 접근할 수 있는지 확인합니다. 필요한 경우 네트워크 정책 및 이미지 풀 시크릿을 확인하세요.

### 권한 거부 오류

**오류:** `Error from server (Forbidden): User "system:serviceaccount:lynq-system:lynq-controller-manager" cannot create resource`

**해결책:** RBAC 리소스가 설치되었는지 확인합니다:
```bash
kubectl apply -f config/rbac/
```

## 다음 단계

- [첫 번째 LynqHub 생성](quickstart.md#step-4-deploy-lynqhub)
- [템플릿에 대해 알아보기](templates.md)
- [모니터링 구성](monitoring.md)
- [보안 설정](security.md)
