# Portfolio Control — Version & Reference Operations

## 1. Purpose

이 문서는 Portfolio Control의 장기적인 버전 운영, production 경로, stable reference, regression 기준 및 형상관리 원칙을 정의한다.

이 정책은 특정 연도전환 작업에 한정되지 않는다.

향후 `/v35/` 이후의 기능 개발, 신규 버전 staging, reference 교체 및 regression 검증에서도 동일한 원칙을 적용한다.

---

## 2. Current Version Roles

현재 운영 경로의 역할은 다음과 같이 정의한다.

### `/v35/`

```text
https://sinyong-0904.github.io/portfolio-control/v35/
```

역할:

**Production / Authoritative Writer**

원칙:

* 실제 Portfolio Control 운영에 사용한다.
* Holdings 변경은 `/v35/`에서 수행한다.
* 계좌 현금 변경은 `/v35/`에서 수행한다.
* 계좌/보유종목 관련 state 변경은 `/v35/`에서 수행한다.
* Annual Transition은 `/v35/`에서만 수행한다.
* 신규 기능은 `/v35/`를 기준으로 개발·검증한다.
* 실제 Save/Supabase write의 authoritative source는 `/v35/`이다.

---

### Root `/`

```text
https://sinyong-0904.github.io/portfolio-control/
```

역할:

**Legacy Stable Reference**

원칙:

* 기존 stable v3 코드를 유지한다.
* 신규 기능을 지속적으로 backport하지 않는다.
* Annual Transition 기능을 추가하지 않는다.
* 일반적인 운영 Save에 사용하지 않는다.
* `/v35/` 변경 후 regression reference로 사용한다.
* 가능한 한 코드가 고정된 control group 역할을 유지한다.

즉 root `/`는 production writer가 아니라 **stable comparison reference**이다.

---

## 3. Single-Writer Principle

Portfolio state를 변경하는 앱은 원칙적으로 하나만 둔다.

```text
/v35/
  ↓
Edit
  ↓
Save
  ↓
Supabase
```

root `/`에서는 Save하지 않는다.

따라서 Holdings, cash, account state 등을 변경할 때:

```text
/v35/에서 수정
→ Save
→ root / 새로고침
→ 동일 Supabase state를 읽어 reference 계산 확인
```

방식을 사용한다.

두 URL에서 동일 변경을 각각 입력하는 방식은 사용하지 않는다.

이 원칙의 목적은 다음과 같다.

* 서로 다른 버전에서 state를 덮어쓰는 위험 방지
* 신규 schema를 legacy code가 손상시키는 위험 방지
* 어느 앱이 authoritative writer인지 명확하게 유지
* regression comparison 시 입력 state를 동일하게 유지

---

## 4. Shared Market Data

Market Price 및 Korea Price는 버전별 별도 데이터가 아니다.

Scheduled updater가 공통 DB를 갱신하고 각 앱이 동일한 최신 가격을 읽는 구조를 유지한다.

```text
Scheduled Price Update
        ↓
Supabase Market/Korea Price DB
        ↓
 ┌──────┴──────┐
 ↓             ↓
root /       /v35/
reference    production
```

따라서 가격 업데이트를 `/`와 `/v35/`에서 각각 수행하지 않는다.

양쪽 앱은 동일한 authoritative market data를 읽어야 한다.

---

## 5. What the Stable Reference Is For

root `/`의 목적은 `/v35/`와 모든 숫자가 항상 동일한지 확인하는 것이 아니다.

특히 Annual Transition 이후에는 연도 종속 계산의 정의가 달라질 수 있다.

reference의 핵심 목적은 **연도와 무관한 core portfolio invariant를 비교하는 것**이다.

### Recommended comparison targets

가능하면 다음 항목을 비교한다.

* Holding 종목
* Holding 수량
* 평균단가
* 계좌 현금
* 종목별 현재 시장가격
* 종목별 평가액
* 계좌별 현재 평가액
* Total 현재 평가액
* 현재 자산 구성
* 현재 Allocation 비중
* 기타 동일 state로부터 직접 계산되는 current valuation

예:

```text
                     root v3       /v35/
DC 평가액              2.18억        2.18억
개인연금1              0.79억        0.79억
개인연금2              0.41억        0.41억
ISA                    0.73억        0.73억
일반                   0.21억        0.21억
자녀연금               0.19억        0.19억
Total                  4.51억        4.51억
```

이러한 값이 이유 없이 달라지면 `/v35/`의 regression 가능성을 우선 의심한다.

---

## 6. What Must NOT Be Compared After Annual Transition

Annual Transition 이후에는 다음 항목을 root v3와 `/v35/` 사이의 regression 기준으로 사용하지 않는다.

* 당해연도 손익
* 당해연도 YTD
* prior-year YTD column
* Annual Performance presentation
* 연도전환된 TWR/CAGR presentation
* Allocation 당해연도 손익/YTD
* Cash-like 연도별 기준액/입출금
* 새해 Dividend matrix
* 새해 Income & Tax row
* 기타 v3.5 annual lifecycle에 의해 정의가 변경된 값

예를 들어 2027 Annual Transition 이후:

```text
root /
26 손익
25 YTD
26 YTD

/v35/
27 손익
26 YTD
27 YTD
```

이 둘은 같은 의미의 column이 아니므로 직접 비교하지 않는다.

---

## 7. Reference Version Lifecycle

root v3는 영구적인 reference를 의미하지 않는다.

시간이 지나면서 `/v35/`의 state schema와 기능이 확장되면 root v3가 최신 state를 충분히 해석하지 못할 수 있다.

그 시점에는 검증된 `/v35/` known-good release를 새로운 reference로 freeze한다.

권장 경로:

```text
/reference/
```

장기 구조 예:

```text
/
    legacy v3

/v35/
    current production

/reference/
    frozen known-good v3.5 reference
```

---

## 8. `/reference/` Policy

`/reference/`는 개발 버전이 아니다.

다음 원칙을 적용한다.

* 검증 완료된 known-good commit을 기준으로 생성한다.
* 생성 시 commit SHA를 기록한다.
* freeze 날짜를 기록한다.
* 기능 개발을 하지 않는다.
* Annual Transition을 실행하지 않는다.
* 일반적인 Save를 하지 않는다.
* regression comparison 용도로만 사용한다.

예:

```text
Portfolio Control Reference

Frozen version:
v3.5

Frozen commit:
<commit SHA>

Frozen date:
2027-xx-xx

Purpose:
Stable regression reference for current valuation and holdings.
```

reference를 최신 production과 계속 동기화해서는 안 된다.

그렇게 하면 independent control group으로서의 가치가 사라진다.

---

## 9. When to Replace the Reference

다음 상황 중 하나가 발생하면 새로운 reference freeze를 검토한다.

1. root v3가 최신 `/v35/` state를 정상적으로 load하지 못한다.
2. core valuation comparison 자체가 불가능해진다.
3. schema 차이가 너무 커져 reference 결과가 의미를 잃는다.
4. `/v35/`가 충분한 기간 동안 production에서 안정적으로 검증되었다.
5. 대규모 신규 개발 전에 새로운 known-good baseline이 필요하다.

단순히 새 버전이 나왔다는 이유만으로 reference를 교체하지 않는다.

---

## 10. Development Version Strategy

향후 대규모 기능 개발 시 production `/v35/`를 직접 크게 수정하기보다 별도 staging 경로를 사용할 수 있다.

예:

```text
/v35/   production
/v36/   next-version staging
```

검증 완료 후:

```text
/v36/ → production candidate
```

로 승격한다.

이 경우 기존 `/v35/` known-good release를 `/reference/`로 freeze할 수 있다.

즉 버전 경로는 단순한 URL이 아니라 **deployment boundary**로 사용한다.

---

## 11. Git Checkpoint Policy

중요한 기능 또는 구조 변경 전후에는 Git checkpoint를 명확하게 남긴다.

특히 다음 시점은 commit/release/tag 후보이다.

* 대규모 기능 개발 시작 전
* Annual Transition 구현 전
* Annual Transition 검증 완료 후
* Production readiness 완료 후
* 새로운 `/reference/` freeze 시점
* 대규모 refactoring 전

Reference를 만들 때는 반드시 source commit SHA를 기록한다.

기억이나 파일 복사 시점만으로 reference version을 정의하지 않는다.

---

## 12. Local / GitHub Synchronization Rule

GitHub Web UI에서 commit한 후 local repository를 계속 사용할 때는 다음 순서를 따른다.

1. `git fetch origin`
2. `origin/main`이 예상 commit을 가리키는지 확인
3. local working copy와 `origin/main`의 실질적인 diff 확인
4. EOL-only diff와 실제 code diff를 구분
5. 동일성이 확인된 뒤 local 작업본 정리
6. `git pull --ff-only`
7. `git status` clean 확인

코드 수정 전에는 가능한 한 최신 HEAD SHA를 확정한다.

기억에 의존해 오래된 파일을 수정하지 않는다.

---

## 13. EOL Difference Handling

Windows local environment와 GitHub 파일 사이에서 CRLF/LF 차이로 인해 다음과 같은 misleading diff가 발생할 수 있다.

```text
911 insertions
911 deletions
```

실질적 코드 비교에는 필요 시:

```powershell
git diff --ignore-space-at-eol origin/main -- <file>
```

를 사용한다.

EOL 차이를 실제 코드 변경으로 오판하지 않는다.

---

## 14. Production Safety Rules

### Authoritative Writer

```text
/v35/
```

만 일반적인 production Save에 사용한다.

### Stable Reference

```text
/
```

에서는 Save하지 않는다.

### Future Reference

```text
/reference/
```

역시 Save하지 않는다.

### Price Data

Market/Korea prices는 공통 authoritative DB를 사용한다.

---

## 15. Regression Philosophy

Reference 앱의 목적은 최신 앱과 같은 코드를 실행하는 것이 아니다.

오히려 **고정된 기존 계산 엔진이 동일한 입력에 대해 어떤 결과를 내는지 확인하는 것**이다.

따라서 reference에 production의 신규 기능을 계속 backport하지 않는다.

Reference와 production이 너무 비슷해지면 동일한 bug를 공유할 가능성이 커지고 independent comparison의 가치가 감소한다.

---

## 16. Current Decision

현재 Portfolio Control 운영 정책은 다음으로 확정한다.

```text
/v35/
= Production
= Authoritative Writer
= Holdings / Cash / Account edits
= Annual Transition
= Save

/
= Legacy Stable Reference
= Read / Compare
= No normal Save

/reference/
= Future known-good frozen reference
= 필요 시 생성
= No normal Save
```

root `/`를 `/v35/`로 redirect하거나 v3.5를 root에 복사하는 Production Promotion은 현재 필수 작업이 아니다.

필요성이 생기기 전까지 기존 root v3를 stable reference로 보존한다.

---

## 17. Related Documentation

Annual Transition의 구체적인 연도별 state 변화와 실행 절차는 다음 문서를 따른다.

```text
ANNUAL_TRANSITION.md
```

Version 운영 정책과 Annual Transition 구현 세부사항을 혼합하지 않는다.
