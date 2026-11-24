# Portfolio Control — Session Handoff & Operating Protocol

> **Updated:** 2026-11-18 (KST)  
> **Repository:** https://github.com/sinyong-0904/portfolio-control  
> **Document role:** 새로운 ChatGPT 세션을 위한 통합 인수인계 및 작업 지침  
> **Scope:** 웹앱 유지보수 / 투자현황 평가 / 전략 유효성 검증  
> **Visibility:** Public repository용. 개인 계좌 잔액과 비공개 금융자료는 포함하지 않음.

---

## 0. 새 세션 시작 지침

### 0.1 목적

이 문서는 Portfolio Control 프로젝트를 새로운 AI 세션에서 이어가기 위한 진입점이다.

크게 두 종류의 작업을 지원한다.

**A. Portfolio Evaluation**

사용자가 새롭게 제공하는 계좌·자산·시장가격 테이블을 분석하여 현재 금융자산의 상태와 기존 투자전략의 유효성을 평가한다.

**B. Portfolio Maintenance**

GitHub의 실제 소스코드를 분석하여 웹앱 기능을 수정하고, 사용자 로컬 환경에서 검증한 후 GitHub에 반영한다.

두 작업은 목적과 수행 절차가 다르다. 사용자의 요청에 따라 구분한다.

### 0.2 Source Priority

**웹앱 구현에 대한 사실 판단**

1. 현재 GitHub `main` HEAD의 실제 소스코드
2. 현재 GitHub의 프로젝트 문서
3. 사용자가 제공한 최신 실행 결과 및 로그
4. 과거 대화와 모델의 기억

**투자현황 및 투자전략에 대한 사실 판단**

1. 사용자가 제공한 최신 날짜의 자산·거래·성과 자료
2. 검증된 계산 정의와 원장
3. 최종 Portfolio Risk Audit 및 후속 검증 자료
4. 최신 시장·상품·규제에 대한 확인 가능한 외부 자료
5. 과거 평가 및 가정

문서와 실제 구현이 다르면 구현의 현재 상태는 소스코드로 판단한다.

반대로 새로운 계좌 스냅샷이 과거 문서보다 최신이라면 현재 평가액과 실제 비중은 최신 스냅샷으로 판단한다.

**과거 대화나 모델 기억만으로 현재 코드, 최신 평가액, 최신 투자전략을 확정하지 않는다.**

### 0.3 최초 실행 순서

새 세션 시작 시 다음을 수행한다.

1. GitHub 저장소의 최신 `main` HEAD 확인
2. 이 `SESSION_HANDOFF.md` 읽기
3. `PROJECT_HANDOFF.md` 읽기
4. 요청에 따라 관련 운영·설계 문서 확인
5. 완료·미완료 작업과 과거 문서의 오래된 지시 구분
6. 현재 요청을 분석 또는 개발 작업으로 분류
7. 사용자가 명시적으로 요청한 작업 수행

투자현황 평가를 요청받은 경우에는 모든 JavaScript를 먼저 읽을 필요는 없다. 지표 정의 또는 계산 오류가 쟁점일 때 관련 소스를 추적한다.

개발을 요청받은 경우에는 실제 수정 대상 소스와 의존성을 반드시 확인한다.

---

## 1. GitHub 문서 체계

| 문서 | 주요 역할 |
|---|---|
| `SESSION_HANDOFF.md` | 새 세션 진입점, 최신 작업 원칙과 인수인계 |
| `PROJECT_HANDOFF.md` | 장기 개발 이력, 시스템 설계, 과거 의사결정 |
| `VERSION_OPERATIONS.md` | Production/Reference 운영, 데이터 저장 및 버전 정책 |
| `ANNUAL_TRANSITION.md` | 연도전환 절차, 데이터 보존, 실행·복구·검증 |
| `PORTFOLIO_RISK_AUDIT_PLAN.md` | 위험분산 감사의 최초 명세 및 방법론 |
| `FINAL_AUDIT_REPORT.md` | 2026-11-04 위험 감사 최종 결과 및 한계 |
| 기타 관련 Markdown | 필요에 따라 확인 |

위 경로는 2026-11-18 확인 기준이다. 후속 세션에서는 파일 존재 여부 및 최신 내용을 다시 확인해야 한다.

### 1.1 문서 간 충돌 처리

- 과거 계획서가 `PROPOSED`로 표시되어 있어도 후속 최종 보고서에서 해당 작업이 완료되었을 수 있다.
- 오래된 `NEXT TODO`는 현재 미완료 작업이라는 증거가 아니다.
- 과거 commit을 최신 HEAD로 취급하지 않는다.
- 계획, 코드 구현, 로컬 검증, Production 검증, 실제 운영 검증은 서로 다른 상태다.
- 서로 다른 문서가 충돌하면 날짜, 기준 commit, 검증 범위를 대조한다.
- 설명되지 않는 충돌은 추측으로 해소하지 않고 명시한다.

### 1.2 GitHub 접근 실패 대응

GitHub Raw/API 접근이 일시적으로 실패하는 문제가 반복적으로 있었다.

접근 실패 시 다음을 순서대로 시도한다.

1. 같은 주소 재시도
2. `raw.githubusercontent.com`의 직접 Raw 주소
3. GitHub `blob/main` 페이지
4. commit SHA를 명시한 고정 주소
5. GitHub REST API 등 사용 가능한 대체 접근 방법

한 번의 접근 실패를 저장소 부재나 접근 불가능의 확정 증거로 해석하지 않는다.

가능한 대체 접근을 합리적으로 시도한 후에도 실패할 때에만 사용자에게 소스 제공 등 구체적 조치를 요청한다.

실제로 읽지 못한 파일을 읽었다고 주장하지 않는다.

---

## 2. 시스템 운영 구조

### 2.1 버전별 역할

**Production: `/v35/`**

https://sinyong-0904.github.io/portfolio-control/v35/

- 실제 자산관리 운영에 사용하는 버전
- Holdings 및 계좌 현금 수정
- Portfolio state의 권위 있는 저장 주체
- Supabase 저장
- Annual Transition 실행
- 신규 기능 개발 및 검증의 기본 대상

**Stable Reference: `/`**

https://sinyong-0904.github.io/portfolio-control/

- Legacy Stable Reference
- 기존 계산 및 화면 동작의 비교 기준
- 일반적인 운영 Save 금지
- 신규 기능의 무조건적인 역이식 금지

**Future Reference: `/reference/`**

- 검증된 버전을 별도로 동결할 때 사용하는 예정 구조
- 실제 생성·운영 여부는 최신 저장소 확인 필요
- Reference는 개발 및 운영 저장용이 아님

버전 정책의 자세한 내용은 `VERSION_OPERATIONS.md`를 따른다.

### 2.2 Single-Writer Principle

Portfolio state를 변경하는 주체는 원칙적으로 `/v35/` 하나다.

- `/v35/`: 편집 및 Save
- root `/`: 읽기 및 비교
- 향후 `/reference/`: 읽기 및 비교

두 버전에서 같은 데이터를 각각 편집·저장하지 않는다.

### 2.3 Shared State 및 Market Data

Portfolio state와 시장가격은 Supabase의 공통 데이터를 참조할 수 있다.

주의사항:

- localhost에서 실행한 앱도 실제 Supabase에 연결될 수 있다.
- localhost라는 이유만으로 테스트 데이터가 격리되었다고 가정하지 않는다.
- 테스트용 가상 입력이 실제 운영 데이터에 저장되지 않도록 한다.
- 시장가격 업데이트와 Portfolio state 저장을 구분한다.
- Production 데이터 구조나 저장 소유권은 별도 승인 없이 변경하지 않는다.

### 2.4 Regression 비교

Reference와 Production의 비교는 다음을 우선한다.

- 보유 종목 및 수량
- 평균단가
- 계좌 현금
- 현재가 및 평가액
- 계좌별 합계
- 전체 평가액
- 현재 자산배분

Annual Transition 또는 계산 버전 차이로 인해 연도별 Performance 수치가 다를 수 있다.

이 경우 같은 의미의 지표인지 먼저 확인한다.

**현재 자산의 불변조건 비교와 연도별 성과지표 비교를 혼동하지 않는다.**

---

## 3. 최근 기능 변경 및 검증 상태

아래 기록은 작업 이력이다. 나열한 commit이 현재 최신 HEAD임을 뜻하지 않는다.

### 3.1 Simulation CAGR 정합성

**Commit:** `6126be64096939405b10259a3b967ee78f87059a`

상태: **COMPLETED**

- 장기자산 Simulation CAGR을 기존 Performance의 연금합산 CAGR 참조 방식으로 정리
- 독립적인 중복 계산식 생성을 방지
- 로컬 및 원격 소스 검증 완료 기록
- Production 회귀 검증 완료 기록

새로운 이상이 발견되지 않는 한 재수정하지 않는다.

### 3.2 OPI2 주식보상 성과 처리

**Commit:** `9f4e61b3614546626f5989f26d20d91b00c2caf1`

상태: **CODE IMPLEMENTATION COMPLETED**

핵심 원칙:

- 주식보상 지급 가치는 외부 유입으로 분류
- 지급 후 가격 변동은 투자손익으로 분류
- GENERAL 보유종목의 실제 수량·평균단가 관리 유지
- Growth의 `stockCompensation`을 기존 데이터 원천으로 활용
- 외부 유입과 투자손익 중복계상 방지
- 새로운 Supabase 저장 필드 없이 기존 구조 활용

분리된 시험에서 계산 및 연도전환 관련 검증이 수행되었다.

그러나 다음 항목은 별개다.

- 실제 OPI2 지급
- 실제 Supabase 저장·재조회
- 실제 연도전환과 결합한 운영 검증

**가상 시험 PASS를 실제 운영 완료로 간주하지 않는다.**

### 3.3 탭 구조 재편

**Commit:** `4b2c5c5444b5129e22649ac0e70c56117063e15e`

상태: **IMPLEMENTED / LOCAL VERIFICATION PASSED**

변경 내용:

- `Growth & 배당` → `Growth`
- `자금관리` → `자금관리&배당`
- 장기자산 Simulation을 Growth 하단으로 이동
- 배당 관련 화면을 자금관리&배당으로 이동

주요 수정 파일:

- `v33-tabs-app.js`
- `v33-nav-fix.js`

기존 Simulation 계산 및 배당 계산 로직은 재사용한다.

탭 이동으로 인한 DOM 참조, 이벤트 핸들러, 그래프 초기화 시점을 주의한다.

### 3.4 예금성 자금 UI 개선

**Commit:** `f507dff61881d4bc675961f0a0f749f1f58bf213`

상태: **IMPLEMENTED / 2026 LOCAL F12 VERIFICATION PASSED**

주요 수정 파일:

- `app3.js`
- `v35-cashlike-rollover.js`

예금성 자금 화면의 카드 구성:

1. 예금성 자금
2. 해당 연도 손익
3. 해당 연도 배당
4. 해당 연도 이자+배당

추가 변경:

- 기존 누적손익·항목 수 카드 제거
- 배당금 현황의 합계와 카드 연결
- 예금성 자금 상세 테이블에 합계 행 추가
- 미래 연도 표시 보정 코드 추가

2026년 localhost에서 카드 순서, 배당 합계, 이자+배당 계산, 상세 합계 및 버튼 존재 여부가 통과했다.

**검증 제한:** 실제 2027년 화면, 실제 저장 동작은 해당 테스트만으로 인증되지 않았다.

### 3.5 Annual Transition

상태:

| 항목 | 상태 |
|---|---|
| 구현 | COMPLETE |
| 2027 통합 Rehearsal | VERIFIED |
| Transaction/rollback 관련 모의검증 | VERIFIED |
| 실제 2027 Production Rollover | NOT YET VERIFIED |

실제 연도전환 이전에는 `ANNUAL_TRANSITION.md`에 정의된 백업, 사전조건, Preview, 사용자 확인, 실행, Supabase read-back, 복구 및 사후 검증 절차를 따라야 한다.

별도 승인 없이 실제 연도전환을 실행하지 않는다.

### 3.6 History Snapshot

History는 사용자가 명시적으로 캡처한 테이블 값을 보존하고 표시하는 기능이다.

과거 시점의 계산 엔진을 별도로 재실행하는 기능으로 해석하지 않는다.

Snapshot의 원래 금액·기간·표시값을 임의 재계산하거나 최신 시장가격으로 덮어쓰지 않는다.

---

## 4. Development Workflow

기본 순서:

**HEAD → READ → VERIFY → PATCH → TEST → DIFF/AUDIT → COMMIT → HANDOFF**

### 4.1 역할 분담

| 단계 | AI | 사용자 |
|---|---|---|
| 기준 commit 확인 | Raw 소스 조회·분석 | 필요 시 기준 SHA 제공 |
| 코드 구조 분석 | 담당 | — |
| 변경 설계 | 담당 | 요구사항 확인 |
| 수정 코드 | 복붙 가능한 코드 제공 | 로컬 적용 |
| PowerShell 검증 | 명령어 설계·결과 분석 | 실행 후 결과 제공 |
| F12 검증 | 명령어 설계·결과 분석 | localhost에서 실행 |
| GitHub 반영 | 대상 파일·commit message 안내 | Web Upload 및 commit |
| 원격 검증 | commit URL 및 Raw 내용 확인 | commit URL 제공 |
| 로컬 동기화 | 안전한 PowerShell 명령 제공 | 실행 후 결과 제공 |

**AI가 사용자의 로컬 파일을 직접 수정하거나 GitHub에 직접 push하는 방식을 기본 절차로 삼지 않는다.**

### 4.2 HEAD — 기준 소스 확정

- 최신 `main` HEAD를 확인한다.
- 필요 시 사용자가 지정한 immutable commit SHA를 분석 기준으로 사용한다.
- 관련 HTML, JS, CSS 및 문서를 읽는다.
- 기준 commit과 최신 HEAD가 다르면 그 차이를 명시한다.
- 파일 경로와 스크립트 로딩 순서를 확인한다.

### 4.3 READ / VERIFY — 구조 및 영향 범위 파악

다음 항목을 추적한다.

- 실제 실행되는 함수 정의
- 중복 정의 및 override
- 함수 호출 관계
- Script load order
- DOM ID, selector 및 초기화 시점
- 이벤트 핸들러
- 계산 데이터의 authoritative source
- 상태 관리 및 Supabase persistence
- 연도별 표시 보정
- 기존 기능에 대한 회귀 영향

**소스 확인 없이 추정한 코드 조각을 제공하지 않는다.**

변경이 최소·가역적이고 위험 범위가 이해되면 테스트 가능한 수정안으로 진행한다. 모든 가상 부작용을 완전히 증명하느라 불필요하게 멈추지 않는다.

### 4.4 PATCH — 복붙용 수정안

AI는 다음을 제공한다.

1. 수정 대상 파일
2. 수정할 함수·블록의 정확한 위치
3. 기존 코드의 식별 기준
4. 교체·삽입·삭제할 코드 전체
5. 변경 이유
6. 기존 계산 및 저장 구조에 미치는 영향
7. 예상 검증 결과

단순 기능 이동에서는 기존 계산 함수를 우선 재사용한다.

불필요한 신규 전역 상태, 중복 계산식, 과도한 패치 레이어를 만들지 않는다.

### 4.5 PowerShell 정적 검증

사용자에게 제공하는 검증 명령어는 다음 원칙을 따른다.

- 하나의 복붙 가능한 PowerShell 블록
- 결과는 `PASS`, `CHECK`, `FAIL` 중심
- 정상 검증에서는 불필요한 디버그 출력 생략
- 파일 존재, 구조, 구문, 변경 범위 및 의존성 검사
- 가능한 경우 Node.js 구문 검사
- 코드 비교는 의미 있는 diff 기준
- 실제 실행 여부를 확인하지 않았다면 PASS라고 주장하지 않음

판정:

- `PASS`: 해당 검증 항목 충족
- `CHECK`: 확인 불충분·예상 외 상태·추가 진단 필요
- `FAIL`: 확인된 불일치 또는 실행 오류

`CHECK`가 발생하면 원인을 분리하는 최소 진단 명령을 제공한다.

### 4.6 F12 Console 동적 검증

정적 검증 통과 후 localhost 브라우저에서 실제 동작을 검사한다.

예시:

- 탭 선택 및 화면 렌더링
- 새 DOM 요소 표시
- 기존 요소 제거
- 표 합계와 실제 데이터 일치
- 그래프와 시뮬레이션 동작
- 배당·성과 데이터 연결
- 이벤트 핸들러
- 탭 재진입 및 새로고침
- 런타임 오류 및 DOM ID 중복
- 연도별 표시와 기존 기능 회귀

검증 명령은 가능하면 읽기 전용으로 구성한다.

저장·삭제·Supabase 쓰기 등 실제 변경을 발생시키는 테스트는 별도 승인과 격리 확인 없이 실행하지 않는다.

### 4.7 GitHub Web Upload

모든 로컬 검증을 마치고 사용자가 반영을 결정한 후:

1. AI가 변경 파일 목록을 확정한다.
2. Commit message를 제안한다.
3. 사용자가 GitHub Web UI에서 해당 파일을 업로드한다.
4. 사용자가 commit URL을 전달한다.
5. AI가 해당 commit의 변경 파일, 실제 diff 및 Raw 코드를 확인한다.

업로드·commit이 완료되었다는 설명만으로 원격 코드 검증을 생략하지 않는다.

### 4.8 Production 검증

GitHub 반영 후 해당 수정과 관련된 Production 검증을 수행한다.

- `/v35/`에서 최신 파일 로드 확인
- 강력 새로고침 후 화면 확인
- 수정 기능의 동작 확인
- 계산·데이터 저장 경로 회귀 확인
- 필요 시 root Reference와 비교

미실시 검증은 미실시 상태로 남긴다.

### 4.9 Local Sync

GitHub Web Upload 이후 로컬 Git 이력과 원격 HEAD가 달라질 수 있다.

동기화 시 확인할 항목:

- 현재 브랜치
- 로컬 HEAD
- `origin/main`
- 목표 commit SHA
- 수정 파일 내용
- 기타 미반영 로컬 변경사항

**다른 작업의 로컬 파일은 임의로 덮어쓰거나 폐기하지 않는다.**

특히 과거에 Markdown 감사 문서가 로컬 변경 상태로 남아 있었으므로, 앞으로도 별도 변경이 존재할 수 있음을 고려한다.

### 4.10 CRLF/LF, BOM 및 공백 문제

Windows 로컬 환경과 GitHub Web Upload 사이에서 반복적으로 줄바꿈 차이가 발생했다.

Git blob 해시가 다르다는 사실만으로 JavaScript 코드가 다르다고 판단하지 않는다.

확인 순서:

1. 실제 Raw 해시 비교
2. CRLF/LF 및 UTF-8 BOM 확인
3. 줄바꿈과 BOM을 정규화한 내용 비교
4. 필요한 경우 `git diff --ignore-space-at-eol`
5. 실제 코드 변경 여부 판정

주의:

- 코드 내부 문자열과 정규식의 공백도 의미가 있을 수 있다.
- 모든 whitespace를 무시한 비교만으로 실행 의미가 같다고 확정하지 않는다.
- 내용이 동일하고 HEAD도 일치하면 불필요한 `reset`을 반복하지 않는다.
- `git reset --hard` 또는 다른 파일을 지우는 작업을 기본 해결책으로 사용하지 않는다.
- `git reset --mixed`, `git restore` 등도 대상과 영향 범위를 확인한 후 제한적으로 사용한다.

### 4.11 완료 판정

기능 개발 완료의 원칙적 조건:

**로컬 검증 → GitHub commit → 원격 코드 확인 → Production 검증 → 로컬 동기화**

어느 단계가 미완료인지 명시한다.

예를 들어 `localhost PASS`는 Production까지 검증되었다는 의미가 아니다.

---

## 5. 사용자의 '진행' 명령

이 규칙은 모든 Portfolio Control 개발 작업에 적용한다.

### 5.1 '진행'의 의미

사용자가 다음과 같이 말하면:

- 진행
- 계속
- 다음 진행
- keep going
- 또는 같은 의미의 지시

이는 **사용자가 구체적으로 수행해야 할 다음 행동이 나타날 때까지 AI가 독립적으로 작업을 계속하라는 명령**이다.

### 5.2 AI가 멈추면 안 되는 상황

- 추가 소스 파일을 확인해야 함
- 다른 함수의 정의를 추적해야 함
- Script load order를 확인해야 함
- 변경 위치를 찾아야 함
- 기존 코드와 최소 수정 대안을 비교해야 함
- 가능한 정적 검증이 남아 있음
- 중간 분석 결과를 보고한 상태임

이런 경우 분석 보고만 하고 종료하지 않는다.

### 5.3 중단이 허용되는 시점

사용자의 구체적인 행동이 실제로 필요한 경우에 한해 멈춘다.

예:

- 로컬 코드 적용
- PowerShell 명령 실행
- F12 Console 검증
- 실제 파일 제공이 불가피한 경우
- GitHub Web Upload
- 사용자 승인 없이는 결정할 수 없는 운영 구조 변경
- 실제 자산·운영 데이터에 영향을 주는 작업의 명시적 승인

사용자 행동을 요청할 때는 정확한 위치, 명령어, 기대 결과 및 이후 절차를 제공한다.

**중간 보고는 작업 종료 조건이 아니다.**

### 5.4 사용자 작업 최소화

소스 조사와 수정안 작성은 가능한 한 AI가 담당한다.

단순 함수 검색이나 파일 내용 확인을 위해 사용자에게 반복적으로 PowerShell 실행을 요구하지 않는다.

한 번의 의미 있는 종합 검증을 여러 번의 단순 검사보다 우선한다.

---

## 6. Portfolio Risk Audit — 전략 기준선

### 6.1 목적

Portfolio Risk Audit의 핵심 질문은 다음과 같다.

**현재 연금 자산배분이 장기 기대수익 기회를 유지하면서 특정 경제적 위험 요인에 대한 집중을 실제로 줄이는가?**

직접적인 목적이 아닌 것:

- 과거 수익률 최대화
- 변동성·MDD의 무조건적인 최소화
- 리밸런싱 수익 극대화
- 모든 시장 환경에서 자산 간 반대 움직임 확보

운용상의 중요한 조건은 지속적인 감시나 빈번한 판단 없이 장기간 실행할 수 있는 전략이라는 점이다.

### 6.2 최종 감사 상태

최종 감사 보고서 기준:

- 작성일: 2026-11-04
- Phase 0~6: 합의된 coarse 검증 범위에서 완료
- 실제 자료·구조 복원·명시적 가정 기반
- 최적 비중 및 미래 기대수익률 입증 아님
- TDF 대비 초과수익 입증 아님

과거 계획서의 미착수 상태를 최종 감사 전체의 현재 상태로 취급하지 않는다.

### 6.3 핵심 6자산 목표

| 자산 | 목표비중 |
|---|---:|
| NASDAQ | 25% |
| S&P500 | 25% |
| US-CVD | 10% |
| K-DIVIDEND | 17% |
| GOLD | 15% |
| BOND | 8% |
| **합계** | **100%** |

분모는 핵심 6자산 평가액 합계다.

GLOBAL, WORLD, PARKING은 이 분모에서 제외한다.

그러나 연금 전체 위험·수익 및 경제적 노출 분석에서는 모두 포함한다.

### 6.4 혼합형 ETF의 경제적 노출

과거 감사에서 중요한 입력 해석 오류가 발견되었다.

이미 주식과 채권으로 분리된 경제적 버킷을 다시 분해하여 동일 자산을 이중 계산한 것이다.

확정된 원칙:

- NASDAQ 버킷은 직접 투자 및 혼합형 상품의 해당 주식 노출을 포함할 수 있다.
- K-DIVIDEND 버킷은 국내 배당주 직접 투자 및 혼합형 상품의 주식 노출을 포함할 수 있다.
- BOND 버킷은 여러 혼합형 ETF의 채권 부분을 합산한 경제적 노출이다.
- 따라서 버킷 금액을 다시 상품 전체 기준으로 분해하지 않는다.
- 실제 구성과 비율은 상품의 기준일별 공시 및 실제 보유자료로 확인한다.
- US-CVD는 액티브 주식·옵션 전략이며 단순 지수형 커버드콜과 동일하지 않다.

이 오류는 감사자의 입력 해석 오류였으며 웹앱 자체의 오류로 확정되지 않았다.

### 6.5 최종 전략 판단

**핵심 목표비중 유지.**

그 이유는 현행 배분이 최적이라는 증거가 있어서가 아니라, 이를 변경하는 대안의 일관된 우월성이 확인되지 않았기 때문이다.

- GOLD 목표 15% 유지
- US-CVD 목표 10% 유지
- 미국 지수 비중을 사후 성과에 따라 자동 확대하지 않음
- 기존 정기매수 원칙 유지
- 기존 밴드 기준 유지
- 기존 Crash Rule 유지
- PARKING 강제 비중 복원 규칙 추가하지 않음
- TDF 대비 초과성과를 전략 정당화 근거로 사용하지 않음

최종 감사 결과를 과도하게 확장하지 않는다.

### 6.6 PARKING 자연희석

PARKING 비중은 고정 30% 또는 일정 절대금액 유지 대상으로 설정하지 않는다.

정기매수와 신규 납입에 따라 자연스럽게 비중이 변할 수 있다.

그러나 PARKING이 감소하면 같은 핵심 6자산 구성이라도 연금 전체의 주식형 노출이 증가한다.

따라서 다음을 별도로 평가한다.

- 핵심 6자산 내부의 상대비중
- 연금 전체의 주식형·채권·금·현금 노출
- PARKING 자연희석에 따른 위험 증가
- 실제 계좌별 매수 가능 재원
- 납입 규모와 정기매수 규모의 차이

**PARKING의 위험 완화 효과와 투자자산 간의 순수 분산 효과를 구분한다.**

### 6.7 장기 기대수익

장기 연 8%는 사용자의 목표 수준이지 확정된 기대수익률이나 보장 수익률이 아니다.

시나리오 분석에서 계산된 CAGR이나 최종자산은 입력 가정에 종속된다.

미래 수익 확률, 최대 손실 한도 또는 최적 배분의 증거처럼 사용하지 않는다.

### 6.8 전략 재검토 조건

다음과 같은 증거가 나타나면 기존 결론을 재검토한다.

1. 동일 위험·비용·기간을 맞춘 단순 대안의 우위가 반복 확인됨
2. 상품의 기초자산 또는 운용전략에 구조적 변화 발생
3. 경제적 위험 요인의 집중이 예상보다 커짐
4. PARKING 자연희석으로 실제 위험 노출이 크게 변화
5. 신규 납입과 계좌별 유동성으로 기존 매수 규칙을 지속하기 어려워짐
6. 장기 투자 논리를 뒷받침하던 핵심 가정이 훼손됨

하루 또는 한 달의 손익 자체는 충분한 재검토 조건이 아니다.

---

## 7. 새로운 투자정보 테이블의 평가 기준

사용자가 정기적으로 다음 자료를 제공할 수 있다.

- 계좌별 평가액·손익·YTD·TR·TWR·CAGR
- 월별 Growth
- 연금의 EQUITY / INCOME / HEDGE / PARKING
- 핵심 6자산 및 위성자산 구성
- ISA·일반계좌 테마별 손익
- 예금성 자금 및 배당금
- 개별 ETF·주식·지수의 시장가격
- CP/HP, CP/LP, PDD 등 성과·위험 지표

새 테이블을 받으면 별도 승인 없이 분석을 수행한다.

### 7.1 일곱 가지 평가 영역

| 우선순위 | 영역 | 평가 질문 |
|---|---|---|
| 1 | 데이터 정합성 | 합계·손익·수익률·현금흐름이 일관적인가? |
| 2 | 전략 유효성 | 새로운 자료가 기존 전략 유지 또는 변경의 근거가 되는가? |
| 3 | 위험 분산 | 특정 국가·산업·기업·금리·환율 등에 집중되는가? |
| 4 | 장기 기대수익 | 위험 집중을 줄이면서 기대수익 기회를 유지하는가? |
| 5 | 유동성·실행 가능성 | 납입과 정기매수 재원이 지속 가능한가? |
| 6 | 성과와 기회비용 | 단순 대안·TDF 대비 구조적 장단점은 무엇인가? |
| 7 | 운용 부담 | 전략이 과도한 관심·빈번한 판단을 요구하는가? |

이 우선순위는 검토의 논리적 순서이며, 정량 점수나 고정 가중치는 아니다.

### 7.2 반드시 구분할 세 가지

**A. 확인된 사실**

표에서 직접 검산할 수 있는 내용이다.

예: 평가액, 손익, 현재 비중, 입출금, 자산 간 자금 이동.

**B. 해석 및 가설**

자료에서 시사되지만 추가 증거가 필요한 설명이다.

예: 금과 주식의 동반 하락 원인, 국내 배당주의 상대적 방어 효과, 테마주 간 공통 위험.

**C. 전략적 판단**

확인된 사실과 해석이 실제로 기존 전략의 유지·수정을 얼마나 정당화하는지 평가한다.

이 세 수준을 혼합하지 않는다.

### 7.3 단기 가격 변화와 구조적 변화

다음은 서로 다르다.

- 평가액 감소
- 투자손익 악화
- 신규 납입
- PARKING에서 투자자산으로의 이동
- 투자 비중 변화
- 경제적 위험 노출 변화
- ETF 운용전략 변화
- 기존 투자 논리의 훼손

단기 가격 하락만으로 구조적 투자 실패를 선언하지 않는다.

반대로 단기 가격 상승만으로 전략이 검증되었다고 결론 내리지 않는다.

---

## 8. 새 테이블 분석의 실행 순서

### Step 1 — 기준 시점과 데이터 검증

- 각 테이블의 기준일 확인
- 원·만원·억원 단위 확인
- 계좌별·자산군별 합계 검산
- 손익과 입출금 산식 검증
- 반올림 허용 오차 확인
- 동일 시점 자료인지 확인
- 이전 스냅샷과 비교 가능 여부 확인

이전 스냅샷의 비공개 숫자가 새 세션에 제공되지 않았다면 임의로 복원하지 않는다.

직전 자료가 없어 비교할 수 없는 경우, 제공된 현재 자료에 대한 단면 평가부터 수행한다.

### Step 2 — 최근 변화 분석

이전 자료가 있을 때:

- 평가액 변화
- 손익 변화
- YTD/TWR/CAGR 변화
- 신규 매수액
- PARKING 증감
- 가격 변동과 자금 이동의 기여
- 주요 수익·손실 기여 자산

변화의 설명에서 거래내역이 필요하다면 자금 이동을 확정 사실로 주장하지 않는다.

### Step 3 — 연금 전략 평가

- 핵심 6자산 현재 비중 및 목표 편차
- 전체 연금의 경제적 위험 노출
- EQUITY / INCOME / HEDGE / PARKING 성과
- GOLD와 국내 배당의 실제 역할
- 미국 성장주·국내 금융·금·환율의 공통 위험
- PARKING 자연희석 경로
- 계좌별 정기매수 재원
- 최종 Risk Audit 결론에 불리한 새로운 증거

**계획 대비 비중이 근접하다는 사실만으로 전략이 우수하다고 결론 내리지 않는다.**

### Step 4 — ISA·일반계좌 평가

연금과 구분하여 분석한다.

주요 관심 항목:

- 조선
- 방산
- 원자력
- 우주항공
- 금광기업
- 일본 종합상사
- 국내 배당주
- 기타 개별 주식·테마

서로 다른 산업이라도 시장 위험 선호, 정책 기대, 고평가 성장주 요인 등이 중복될 수 있다.

검토할 사항:

- 투자 논리와 현재 가격의 관계
- 개별 자산의 손익 및 비중
- 공통 위험 요인
- 산업 실적과 주가 사이의 괴리
- 손실이 일시적 가격 변동인지 투자 논리 훼손인지
- 대체 투자수단 대비 기회비용

ISA와 개인투자 그룹이 동일한 계좌 구성이라고 가정하지 않는다.

손실이 크다는 이유만으로 손절·추가매수를 권고하지 않는다.

### Step 5 — 가계 전체 금융자산 평가

연금 분석과 별도로 다음을 확인한다.

- 전체 금융자산 규모 및 증감
- 투자계좌와 예금성 자금 비중
- 개별 기업 집중 위험
- 금융자산 증가의 실제 원천
- 외부 유입과 투자성과의 구분
- 전체 자산의 국가·산업·통화 노출

삼성전자우 등 개별 종목의 높은 비중은 연금 내부 분산 분석과 별도로 평가한다.

연금 외부의 집중 위험을 이유로 연금 6자산 목표를 임의 변경하지 않는다.

### Step 6 — 시장 및 대안 비교

시장가격 테이블이 제공되면:

- 주요 지수와 보유 ETF의 수익률
- 환율·금리·산업별 위험
- 가격수익률과 분배금 포함 수익률
- 시간차 및 거래일 차이
- 시장 전반과 개별 자산의 성과 차이

를 확인한다.

실제 최신 뉴스, ETF 구성 변경, 정책 또는 운용사 공지가 판단에 중요하다면 외부 근거를 확인한다.

과거 자료나 가정을 현재 뉴스로 제시하지 않는다.

### Step 7 — 전략 유효성 판정

최종적으로 다음 중 하나를 선택한다.

| 판정 | 의미 |
|---|---|
| **MAINTAIN** | 현행 유지가 합리적이며 변경을 정당화할 새 증거 부족 |
| **MONITOR** | 중요한 변화가 있으나 추가 관찰 필요 |
| **SELECTIVE REVIEW** | 특정 자산·규칙에 대한 재검토 근거 존재 |
| **INSUFFICIENT EVIDENCE** | 비교·판단에 필요한 데이터 부족 |

가능하면 각 판정을 뒤집을 수 있는 반증 조건도 제시한다.

현행 전략의 자동적인 승리를 전제로 분석하지 않는다.

---

## 9. 성과지표와 데이터 정합성

### 9.1 지표는 반드시 정의를 구분한다

| 지표 | 해석 시 주의점 |
|---|---|
| Growth | 금융자산 총액 증가율이며 외부 유입을 포함할 수 있음 |
| YTD | 앱의 해당 연도 기준액·손익·입출금 정의 확인 필요 |
| TR | 누적 수익률이며 분모·누적손익 정의 확인 필요 |
| TWR | 입출금 영향을 제거하는 시간가중수익률; 실제 구간 연결 방식 확인 |
| CAGR | 누적성과 연환산 지표; 시작일·기간·기준 수익률 확인 |
| CP/HP | 현재가와 기준 고점의 차이; 기준 기간 확인 |
| CP/LP | 현재가와 기준 저점의 차이; 기준 기간 확인 |
| PDD | 앱의 분모와 계산식 확인 전에는 일반적인 MDD로 해석 금지 |
| ETF YTD | 가격 기준인지 분배금 포함 기준인지 확인 필요 |

특히 다음은 서로 다른 값이다.

- 금융자산 총액 증가율
- 순입금 제외 손익률
- 계좌 YTD
- TWR
- SI CAGR
- ETF 가격수익률
- 분배금 포함 총수익률

이들을 동일한 성과로 비교하지 않는다.

### 9.2 손익 검산

기준액·입출금·평가액이 같은 기간과 범위를 사용한다면 기본 관계는 다음과 같다.

`연도 손익 = 현재 평가액 - 연초 기준액 - 연도 순입금`

단, 실제 원장에 과거 조정, 분류 변경 또는 특수한 계산 규칙이 있다면 이를 확인한다.

계산상 차이가 발생하면 다음을 점검한다.

1. 금액 단위
2. 반올림
3. 기준일
4. 집계 범위
5. 실현손익
6. 배당·이자
7. 계좌 간 이체
8. 외부 유입과 내부 이동
9. 웹앱의 실제 함수 정의

**합계가 다르다는 이유만으로 소프트웨어 버그라고 판단하지 않는다.**

### 9.3 기존 점검 이슈

과거 평가에서 다음 항목이 확인 과제로 남았다.

- 하위 자산 누적손익 합계와 그룹 표시값의 차이
- Growth 투자수익과 계좌별 손익 집계의 정의 차이
- 금융자산 성장률과 투자수익률의 혼용 가능성
- PDD의 분모와 의미
- 연도전환 이후 표시·계산 기준
- 실제 원장과 화면의 반올림 차이

이 항목들은 **미해결 검증 과제이지 확정된 버그 목록이 아니다.**

새 자료에서 같은 유형의 차이가 나타나면 기존 원인이 반복되는지 확인한다.

### 9.4 비정상 지표

예를 들어 PDD가 -100%보다 작더라도 즉시 오류로 단정하지 않는다.

자산평가액을 기준으로 한 MDD인지, 과거 최고 이익금을 기준으로 한 손익 감소율인지 확인한다.

일반적인 자산가치 MDD를 다른 정의의 지표와 혼용하지 않는다.

---

## 10. 투자현황 평가의 품질 원칙

### 10.1 반증 중심 접근

기존 전략이 틀렸다는 가설을 적극적으로 검토한다.

다음 행위를 피한다.

- 현재 전략을 무조건 옹호
- 최근 손실에 맞춰 자산배분 목표 변경
- 최근 상승 자산의 비중 확대를 사후 정당화
- 소수 사례를 장기 분산 효과로 일반화
- 유리한 비교 기간만 선택
- 가상 시나리오의 결과를 미래 예측으로 표현
- 단순히 수익률이 높은 대안을 무조건 우수하다고 평가

### 10.2 위험과 기대수익을 함께 평가

단순히 MDD가 작다고 좋은 전략은 아니다.

미국 주식 비중이 더 높아 수익이 증가한 경우도 동일 위험 조건의 개선이 아닐 수 있다.

평가 시 다음을 구분한다.

- 주식 위험 자체의 감소
- 동일 위험 수준에서의 분산 개선
- 현금 비중에 따른 변동성 감소
- 자산 간 실질적 분산 효과
- 운용 복잡성 및 실행 비용

### 10.3 현재 전략의 실패 가능성

최종 Risk Audit에서 전략을 유지했더라도 미래 상황에 따라 변경해야 할 수 있다.

반례를 발견하면 기존 결론과의 충돌을 명시한다.

강한 증거가 없는 경우에는 유지 또는 판단 유보가 가능하지만, 그 이유를 구체적으로 설명한다.

### 10.4 최종 답변이 반드시 다룰 질문

1. **현재 무슨 일이 일어나고 있는가?**
2. **이 변화가 장기적으로 중요한가?**
3. **기존 전략을 유지할 근거가 여전히 충분한가?**

이 세 질문에 답하지 않은 단순 숫자 나열은 충분한 투자현황 평가가 아니다.

---

## 11. 투자현황 평가 보고서 형식

새로운 테이블을 받았을 때 권장 형식:

### 1. Executive Summary

가장 중요한 변화와 현재 판단 3~5개를 우선 제시한다.

### 2. 데이터 정합성

합산 검증, 손익 정의, 단위·기간·현금흐름 문제를 정리한다.

### 3. 전체 금융자산

총액과 변화, 주요 기여 요인, 집중 위험을 평가한다.

### 4. 연금

핵심 6자산, 경제적 위험 노출, PARKING, 정기매수, 전략 유지 가능성을 평가한다.

### 5. ISA·일반계좌

테마별 성과와 공통 위험, 투자 논리, 기회비용을 검토한다.

### 6. 시장 환경

사용자 제공 가격과 필요한 최신 외부 근거를 연결한다.

### 7. 전략의 유효성

기존 Risk Audit 결론과 새로운 증거를 대조하고 반례를 검토한다.

### 8. 최종 판단

MAINTAIN / MONITOR / SELECTIVE REVIEW / INSUFFICIENT EVIDENCE 중 적합한 판단을 제시한다.

표와 그래프는 실제 비교에 도움이 될 때 사용한다.

단순한 가격 변화를 장황하게 반복하지 않고 **장기적으로 의미 있는 변화에 집중**한다.

---

## 12. 개인정보 및 공개 저장소 안전 원칙

이 저장소는 공개 접근이 가능한 GitHub 저장소로 운영될 수 있다.

따라서 다음 자료는 공개용 인수인계 문서나 개발 산출물에 복제하지 않는다.

- 실제 계좌별 평가액과 손익
- 특정 시점의 전체 개인 금융자산 금액
- 개인 보유주식 수량 및 매수가
- 비공개 거래·입출금 내역
- 개인 자금계획의 상세 수치
- Supabase 인증정보 및 비밀키
- 공개 승인이 없는 재현 데이터·시뮬레이션 결과

위험 감사의 일반 원칙, 방법론, 익명화된 개발 지침은 필요한 범위에서 설명할 수 있다.

**중요:** 과거에 비공개로 취급하도록 명시된 감사 보고서가 공개 저장소에 남아 있을 수 있으므로, 공개 여부와 민감정보 포함 여부를 별도로 점검해야 한다.

민감정보가 포함된 파일을 새 commit에서 삭제하더라도 기존 Git 이력에 남을 수 있다. 필요 시 별도 이력 정리와 접근 범위 점검을 수행한다.

개인 금융자료의 공개 여부나 공개 범위를 AI가 임의로 결정하지 않는다.

---

## 13. 작업 상태 기록 및 인수인계 원칙

새로운 기능을 완료하거나 중요한 전략 판단을 내린 경우 다음 내용을 기록한다.

**개발 작업**

- 요청 내용
- 기준 commit
- 수정 파일
- 변경 내용
- PowerShell 검증
- F12 검증
- Production 검증
- 원격 commit
- 로컬 동기화 결과
- 미검증 항목

**투자현황 평가**

- 자료 기준일
- 제공된 데이터 범위
- 주요 변화
- 계산 검증 결과
- 기존 전략과의 관계
- 판단
- 반증 조건
- 다음 점검 대상

공개 문서에는 개인 금융자료 대신 판단 원칙과 비식별 요약만 기록한다.

### 완료 상태 표현

다음 상태를 엄격하게 구분한다.

- PROPOSED
- IN PROGRESS
- CODE IMPLEMENTED
- LOCAL VERIFIED
- REMOTE VERIFIED
- PRODUCTION VERIFIED
- OPERATIONALLY VERIFIED
- COMPLETED
- NOT YET VERIFIED

과거 작업의 상태는 새로운 증거가 없는 한 임의로 변경하지 않는다.

---

## 14. 새 세션에서의 실행 지시

### Case A — 새로운 투자현황 테이블이 전달된 경우

1. 해당 자료의 날짜와 단위를 확인한다.
2. 이전에 알려진 전략·위험 감사 기준선을 적용한다.
3. 제공된 숫자를 독립적으로 검산한다.
4. 이전 스냅샷이 있으면 정확히 비교한다.
5. 단기 성과와 구조적 변화를 구분한다.
6. 연금, ISA·일반계좌, 전체 금융자산을 구분해 평가한다.
7. 새로운 자료가 기존 전략의 결론을 반증하는지 확인한다.
8. 최종 전략적 판단을 제시한다.

불필요한 추가 승인이나 `진행` 지시를 기다리지 않는다.

### Case B — 웹앱 수정이 요청된 경우

1. 현재 GitHub HEAD와 Raw 소스 확인
2. 관련 함수·저장 구조·스크립트 로딩 분석
3. 최소 수정안 준비
4. 복붙 가능한 코드 제공
5. 사용자 로컬 적용 및 PowerShell PASS/CHECK/FAIL
6. localhost F12 검증
7. 사용자 GitHub Web Upload
8. 원격 commit/diff 감사
9. Production 검증
10. 로컬 동기화

사용자가 `진행`이라고 말하면 다음 사용자 행동이 반드시 필요한 시점까지 독립적으로 작업한다.

### Case C — 투자전략 자체의 변경이 논의되는 경우

1. 기존 Risk Audit 결론 확인
2. 새로운 근거의 질 검토
3. 현행 유지와 대안의 장단점 비교
4. 위험 노출과 기대수익을 동시에 평가
5. 상충 환경과 불리한 반례 검토
6. 변경 필요성 및 근거 부족 영역 명시

**분석은 매매 승인이나 목표비중 변경 승인을 뜻하지 않는다.**

---

## 15. 마지막 원칙

Portfolio Control의 목적은 최신 화면을 만드는 것에 그치지 않는다.

정확한 데이터와 일관된 계산, 장기적으로 실행 가능한 투자전략, 안전한 운영체계를 함께 유지하는 것이다.

개발 작업에서는 **실제 소스와 검증 결과가 우선**이다.

투자현황 평가에서는 **새 데이터와 독립적인 검증 결과가 우선**이다.

과거의 성공적인 구현이나 투자전략이 앞으로도 옳다고 자동으로 가정하지 않는다.

**AI의 역할은 기존 코드를 무조건 유지하거나 기존 투자전략을 정당화하는 것이 아니라, 새로운 증거를 바탕으로 오류와 위험을 찾아내고 가장 합리적인 다음 행동을 판단하는 것이다.**

---


## Appendix — 2026-11-24 v3.5 Maintenance & Performance Reconciliation

### A. Release checkpoint

- Date: 2026-11-24 (KST)
- Production: `/v35/`
- Stable Reference: `/` (unchanged)
- Code checkpoint: `a4c787bc2d800921be3733e13fb05d23b984e0b3`
- Release tag: `v3.5-maintenance-20261124`
- Scope: UI bug fixes, Snapshot compatibility, pension performance calculation reconciliation
- Status: Code committed, localhost static/runtime checks passed, local Git synchronized
- Limitations: Actual Supabase Snapshot write/read-back and post-release Production regression not fully verified

### B. Completed fixes

#### B.1 Overview performance sign and account P&L

Commits:
- `e6b18dc667ba1103805363218e7d14a1272faddc`
- `a4c787bc2d800921be3733e13fb05d23b984e0b3`

Changes:
- Corrected stale negative-color CSS classes.
- Corrected 2026 account-level P&L presentation using `accountSummary().pnl`.
- Preserved existing account performance calculations.
- Preserved future-year presentation logic.

Validation:
- JavaScript syntax PASS.
- Account P&L values PASS.
- Negative-color presentation PASS.

#### B.2 Allocation Exposure Detail

Commits:
- `e6b18dc667ba1103805363218e7d14a1272faddc`
- `a4c787bc2d800921be3733e13fb05d23b984e0b3`

Changes:
- Corrected negative P&L/return colors.
- Replaced 2026 detail P&L calculation based on snapshot evaluation-value delta with current holdings ledger P&L.
- Ledger components: unrealized P&L, realized P&L, cumulative dividends.
- Current cumulative P&L minus 2025 year-end baseline gives 2026 P&L.
- Existing buy amount, valuation, allocation weights and snapshot YTD denominators remain unchanged.
- Detail Sum reconciled with the existing non-PARKING Portfolio Exposure calculation.
- Unallocated historical P&L displayed separately.
- 2027 rehearsal and return to 2026 verified.

Validation:
- Eight asset rows: PASS.
- P&L, cumulative P&L, YTD, TR display: PASS.
- Negative sign colors: PASS.
- Non-PARKING bucket total reconciliation: PASS.
- Carry row uniqueness: PASS.
- 2026 → 2027 rehearsal → 2026 restoration: PASS.

Important:
- Calculation-path consistency does not prove historical accounting accuracy.
- Do not hardcode Excel values to force reconciliation.

#### B.3 Growth / Dividend Snapshot

Commit:
- `e6b18dc667ba1103805363218e7d14a1272faddc`

Changes:
- Separated Growth and Dividend table capture after tab restructuring.
- Preserved the existing `growth_dividend` snapshot type.
- Merged partial captures with existing snapshot tables.
- Added Dividend Snapshot action in the relocated Dividend section.
- Preserved `cash_like` and existing History data format.

Validation:
- Growth capture PASS.
- Dividend capture PASS.
- Existing Growth/Dividend merge mock tests PASS.
- History rendering PASS.
- Actual Supabase write and overwrite test NOT PERFORMED.

### C. Remaining known limitations

#### C.1 Account vs bucket cumulative P&L

A small historical reconciliation difference remains between account-level cash-flow-based cumulative P&L and bucket-level holdings-ledger cumulative P&L.

Findings:
- Current holdings valuation plus account cash reconciles with account valuation.
- Holdings mapping weights reconcile.
- Existing fixed archived P&L is included in bucket metrics.
- Some historical closed/deleted holding acquisition and realized P&L records are unavailable.

Decision:
- Preserve the existing historical carry.
- Do not add arbitrary adjustment values.
- Treat the remaining difference as an unresolved historical reconciliation item.
- Reopen only when material new evidence is available or the difference increases.

#### C.2 Asset-level YTD denominator

Current asset-level YTD uses `ytdDenomKRW` from the existing pension snapshot.

The original Excel notes proposed:
- Previous year-end valuation + current-year purchases.

However, the current application uses state-based holdings editing:
- Buy: update quantity and average cost.
- Sell: update quantity and realized P&L.
- Full exit: use the holding close action.

The application does not retain a complete transaction-level execution ledger in the inspected portfolio state.

Decision:
- Retain existing YTD denominators.
- Do not substitute current purchase cost or net purchase-cost change for actual annual purchase amounts.
- Do not label these YTD calculations as TWR.
- Defer transaction-aware denominator improvements until reliable transaction data exists.

#### C.3 TR interpretation

- Account TR uses an account-level cumulative investment basis.
- Bucket/detail TR uses current holdings purchase cost.
- These percentages are not fully comparable across aggregation levels.
- Avoid treating them as identical cash-flow-adjusted return metrics.

#### C.4 Historical allocation attribution

- Historical asset mapping and deleted holdings may prevent exact asset-level reconciliation.
- Do not reconstruct unknown realized P&L from sale prices alone.
- Preserve the known baseline and unallocated adjustment separately.

### D. Operating and verification rules

- `HEAD → READ → VERIFY → PATCH → TEST → DIFF/AUDIT → COMMIT → HANDOFF`.
- User applies local patches and performs GitHub Web Upload.
- AI provides copy-paste-ready source changes and verification commands.
- No unsolicited GitHub push or Production Supabase write.
- Preserve unrelated local Markdown modifications.
- Avoid verbose Git whitespace warnings; report concise PASS/CHECK/FAIL.
- For localhost F12 tests, always state the exact tab, year and execution timing.
- Include the PowerShell server command:

  `python -m http.server 8000 --directory "D:\GIT\portfolio-control"`

- Test URL: `http://localhost:8000/v35/`
- "진행" means continue independently until a specific user action is necessary.
- End each work response with "다음 추론 단계".
- High/Extra High usage is limited; recommend it only immediately before a sufficiently prepared task expected to produce substantive, copy-paste-ready code.

### E. Release status and next maintenance

This release is a maintenance checkpoint, not a certification of all historical financial performance values.

No further calculation change is planned for this release.

Future work, only when needed:
1. Investigate materially growing historical reconciliation differences.
2. Revisit transaction-aware YTD denominator design if reliable trade records become available.
3. Verify actual Snapshot persistence separately with explicit approval.
4. Keep `/` as the unchanged Stable Reference.


**End of SESSION_HANDOFF.md**
