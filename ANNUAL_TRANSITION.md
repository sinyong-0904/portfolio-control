# Portfolio Control — Annual Transition Runbook

## 1. Purpose

이 문서는 Portfolio Control에서 연도가 바뀔 때 수행하는 Annual Transition의 설계 원칙, 탭별 동작, 데이터 보존 방식, 실행 순서 및 검증 절차를 정의한다.

이 문서는 매년 재사용하는 운영 Runbook이다.

2026 → 2027 구현 과정에서 검증한 결과를 reference example로 포함한다.

---

# 2. Core Principle

Annual Transition의 기본 원칙은 다음과 같다.

```text
직전연도 결과
→ 보존해야 할 것은 보존

새해 annual state
→ 새 baseline에서 시작

현재 valuation / holdings
→ 불필요하게 변경하지 않음
```

Annual Transition은 현재 portfolio를 재구성하는 작업이 아니다.

Holding, 현재 시장가격, 현재 평가액 등을 임의로 다시 계산하여 새로운 portfolio를 만드는 작업도 아니다.

가능한 한 기존 화면에서 이미 authoritative하게 계산된 결과와 기존 state를 재사용한다.

---

# 3. Production Path

Annual Transition은 production writer인 다음 경로에서만 수행한다.

```text
/v35/
```

root `/`에서는 Annual Transition을 실행하지 않는다.

root `/`는 stable reference 역할만 한다.

---

# 4. Development / Simulation Principle

2026 → 2027 개발 과정에서는 실제 state mutation 전에 memory-only simulation을 먼저 구현하고 검증했다.

Simulation 특징:

* 실제 production state mutation 없음
* Supabase write 없음
* test business year 사용
* preview state는 reload 시 소멸
* 기존 2026 state 보존

이 simulation 결과를 Phase 8 actual rollover 구현의 specification으로 사용한다.

---

# 5. Business Year Test Clock

v3.5에는 실제 시스템 날짜를 변경하지 않고 future business year를 simulation하기 위한 test clock이 있다.

목적:

```text
실제 날짜 = 2026
business year simulation = 2027
```

이를 통해 2027 UI와 계산을 미리 검증한다.

DEV/test 기능이며 production Annual Transition 실행과 동일한 의미로 간주하지 않는다.

---

# 6. Annual Input

## Expected behavior

Business year가 2027이 되면 Annual Input은 다음 연도까지 입력 가능해야 한다.

```text
2026
2027
2028
```

즉 business year + 1까지 입력 범위를 확장한다.

2026 → 2027 전환에서 2028 input이 표시되는 것을 검증했다.

---

# 7. Growth

Growth는 기존 Growth rollover engine을 사용한다.

핵심 원칙:

* 기존 월별 금융자산 Growth history를 보존한다.
* month-close pending 상태에서는 rollover/recalc를 함부로 수행하지 않는다.
* dry-run을 먼저 수행할 수 있어야 한다.
* Annual Transition 과정에서 Growth state를 파괴적으로 재계산하지 않는다.

실제 rollover 전에 Growth month-close 상태를 확인한다.

---

# 8. Performance

Performance는 Annual Transition에서 가장 중요한 carry/rebase 대상 중 하나이다.

## 8.1 Scope

검증된 scope:

### Accounts

* DC
* 연금(1)
* 연금(2)
* ISA
* 일반계좌
* 자녀연금

### Aggregates

* 연금합산
* Total

### Pension Buckets

* EQUITY
* INCOME
* HEDGE
* PARKING

총 12 scopes.

---

## 8.2 YTD transition

2026 종료 시:

```text
26 YTD
```

는 2027 화면에서 prior-year YTD가 된다.

```text
2026:
25 YTD | 26 YTD

2027:
26 YTD | 27 YTD
```

새해 시작 직후:

```text
27 YTD = 0
```

이어야 한다.

---

## 8.3 Current-year P/L

2027 시작 시:

```text
27'손익 = 0
```

에서 시작한다.

Account 기준 기본 개념:

```text
current-year P/L
=
current value
- new-year baseline
- current-year flow
```

---

## 8.4 TWR

누적 TWR은 연도전환 시 reset하지 않는다.

2026까지의 누적 TWR을 carry하고 새해 YTD를 chain한다.

개념:

```text
new TWR
=
(1 + prior TWR)
×
(1 + current-year YTD)
- 1
```

새해 시작 직후 current-year YTD가 0이면 TWR은 직전연도 종료값과 동일하다.

---

## 8.5 CAGR

CAGR duration은 고정된 2026 snapshot week를 사용하지 않는다.

현재 주차를 기준으로 dynamic duration을 사용한다.

2026 W37 검증 예:

```text
durationYears
=
1 + 37 / 52
=
1.711538...
```

DC example:

```text
TWR
= 16.3826738762%

CAGR
= 9.2688954078%
```

CAGR은 Annual Transition과 별개로도 dynamic 계산을 유지해야 한다.

---

## 8.6 Verified DC example

2026:

```text
DC 26 YTD
= 5.860172708962747%

DC TWR
= 16.382673876233646%
```

2027 start:

```text
26 YTD
= 5.860172708962747%

27 YTD
= 0%

TWR
= 16.382673876233646%

27'손익
= 0
```

---

## 8.7 Total verified example

2026:

```text
25 YTD = 12.65%
26 YTD = 6.058757684865417%
TWR    = 19.475190532000887%
```

2027 start:

```text
26 YTD = 6.058757684865417%
27 YTD = 0%
TWR    = 19.475190532000887%
```

---

# 9. Allocation

Allocation의 당해연도 손익/YTD도 새해 baseline으로 rebase한다.

## 9.1 Group

현재 화면 기준:

* EQUITY
* INCOME
* HEDGE
* PARKING

2027 start:

```text
27 손익 = 0
YTD 27  = 0
```

---

## 9.2 Detail

검증된 detail:

* NASDAQ
* S&P500
* US-CVD
* K-DVD
* BOND
* GOLD
* GLOBAL
* WORLD

각 detail도:

```text
27 손익 = 0
YTD 27  = 0
```

에서 시작한다.

---

## 9.3 Composite group

EQUITY:

```text
NASDAQ
+ S&P500
+ GLOBAL
+ WORLD
```

INCOME:

```text
K-DVD
+ US-CVD
```

EQUITY/INCOME future metric은 검증된 detail future metric을 합산하여 계산한다.

INDEX라는 내부 group을 임의로 EQUITY라고 해석하지 않는다.

---

## 9.4 Sum

Group/Detail Sum의 YTD는 row YTD의 단순 평균이 아니다.

전체 baseline 대비 전체 손익으로 계산한다.

새해 시작 시:

```text
Group Sum 27 손익 = 0
Group Sum YTD 27  = 0

Detail Sum 27 손익 = 0
Detail Sum YTD 27  = 0
```

이어야 한다.

---

## 9.5 Carry fields

다음은 reset하지 않는다.

* 평가액
* 누적손익
* TR
* 비중

---

# 10. Cash-like Assets

State structure example:

```text
data.cashAssets[]
```

주요 annual fields:

```text
base2026
flow2026
balance
cumProfit
```

2026 손익:

```text
26 손익
=
balance
- base2026
- flow2026
```

---

## 10.1 New-year transition

2027 rollover:

```text
base2027 = 2026 year-end balance
flow2027 = 0
balance  = unchanged
```

따라서:

```text
27 손익
=
balance
- base2027
- flow2027
=
0
```

에서 시작한다.

---

## 10.2 Verified example — 적금

2026:

```text
base2026 = 1100
flow2026 = 2400
balance  = 3500
```

2027:

```text
base2027 = 3500
flow2027 = 0
balance  = 3500

27 손익 = 0
```

---

## 10.3 Verified example — CMA

2026:

```text
base2026 = 3717
balance  = 3022
```

2027:

```text
base2027 = 3022
flow2027 = 0
```

---

## 10.4 Editability

새해의:

* 기준액
* 입출금

은 editable이어야 한다.

사용자가 실제 값이나 계산 오류를 발견하면 수동으로 보정할 수 있어야 한다.

예:

```text
balance = 3500
base2027 = 3400
flow2027 = 0

27 손익 = +100
```

이후:

```text
flow2027 = 100
```

으로 수정하면:

```text
27 손익 = 0
```

이 된다.

---

# 11. Dividend

현재 dividend state는 current-year matrix이다.

```text
data.dividends[month][account]
```

Accounts:

* DC
* 개인연금1
* 개인연금2
* ISA
* 일반
* 삼전우

12개월 × 6계좌 = 72 cells.

---

## 11.1 Closed-year archive

별도 `dividendHistory` schema를 만들지 않는다.

과거 배당 내역은 기존 History/Table Snapshot 기능을 authoritative archive로 사용한다.

Snapshot은 다음 수준의 원본을 보존한다.

```text
JAN × 6 accounts
FEB × 6 accounts
...
DEC × 6 accounts
계좌별 합계
총합
```

---

## 11.2 Important prerequisite

Annual Transition 전에 **직전연도의 최종 배당금 현황 Snapshot을 저장했는지 반드시 확인한다.**

중간연도 snapshot을 최종 archive로 오인하지 않는다.

예를 들어 9월 snapshot에서는 OCT~DEC가 0일 수 있으므로 연말 최종 snapshot을 별도로 저장해야 한다.

---

## 11.3 New-year reset

2027 rollover 후 current matrix:

```text
JAN  0 0 0 0 0 0
FEB  0 0 0 0 0 0
...
DEC  0 0 0 0 0 0
```

모든 72 cells를 0으로 시작한다.

현재연도 matrix는 editable이다.

입력 시:

* 월 합계
* 계좌별 합계
* 총합

이 즉시 재계산되어야 한다.

---

# 12. History / Snapshot / Memo

Audit 결과 별도 Annual Transition schema를 추가할 필요가 없었다.

## Existing systems

### Legacy annual history

```text
data.history.years
```

기존 frozen annual history를 보존한다.

### v34 Table Snapshot

Supabase에 직접 저장되는 별도 snapshot archive가 존재한다.

Snapshot은 year/type 기준으로 저장된다.

### Unified Memo

Income & Tax unified note는 global note 성격이므로 Annual Transition 시 자동 reset하지 않는다.

---

## Policy

Annual Transition 과정에서 다음을 새로 만들지 않는다.

```text
dividendHistory
별도 annual history engine
불필요한 memo rollover
```

기존 History/Table Snapshot을 재사용한다.

---

# 13. Income & Tax

Income & Tax는 일반 annual field와 lifecycle이 다르다.

현재 구조:

```text
data.incomeTaxHistory.rows
```

2008~2026까지 year row가 존재한다.

각 row:

```text
year
salary
tax
deduction
net
withheld
change
taxRate
finalTax
```

---

## 13.1 New-year row

2027 rollover 시 empty row를 생성한다.

```text
year       = 2027
salary     = null
tax        = null
deduction  = null
net        = null
withheld   = null
change     = null
taxRate    = null
finalTax   = null
```

2026 값을 복사하지 않는다.

---

## 13.2 Lifecycle

Income & Tax는 새해가 되었다는 이유만으로 직전연도를 자동 lock하지 않는다.

실제 원천징수/최종세액이 확정되는 시점은 달력 날짜와 정확히 일치하지 않을 수 있기 때문이다.

따라서 사용자 명시적 확정을 사용한다.

2027 초기:

```text
2008~2025 → fixed
2026      → editable / 미확정
2027      → editable
```

화면:

```text
2026 미확정   [2026 확정]
```

사용자가 실제 세금 자료를 모두 입력한 뒤:

```text
[2026 확정]
```

을 실행한다.

결과:

```text
2008~2026 → fixed
2027      → editable
```

필요하면:

```text
[확정 해제]
```

로 2026을 다시 editable하게 만들 수 있다.

---

## 13.3 Finalization persistence

2026→2027 simulation에서는 finalized state를 memory-only로 검증했다.

Actual production에서는 finalized state를 persistence해야 한다.

권장 최소 구조:

```text
incomeTaxHistory.finalizedYears
```

예:

```json
{
  "2026": true
}
```

정확한 production persistence는 integrated Annual Rollover 구현에서 확정한다.

---

## 13.4 Sum semantics

2027 row는 기존 Income & Tax Sum에 포함되어야 한다.

Sum column semantics:

```text
급여계       → SUM
세액         → SUM
일반공제     → SUM
실지급액     → SUM
원천징수액   → SUM
변동률       → n/a
세율         → finalTax Sum / withheld Sum × 100
finalTax     → SUM
```

2027 급여계에:

```text
100,000,000
```

을 입력했을 때 기존 급여계 Sum:

```text
1,875,996,010
```

이:

```text
1,975,996,010
```

으로 변경되는 것을 검증했다.

---

# 14. Actual Integrated Rollover — NOT YET IMPLEMENTED

중요:

2026→2027 개발 과정에서 위 각 기능의 future behavior는 검증되었지만, 현재까지 대부분은 **memory-only simulation**이다.

다음 항목을 하나의 실제 persistent transaction/workflow로 묶는 작업은 Integrated Annual Rollover 단계에서 구현한다.

```text
Growth
Annual Input
Performance carry/rebase
Allocation rebase
Cash-like annual fields
Dividend reset
Income & Tax new row
Income & Tax finalized persistence
```

이 문서에서 simulation PASS와 actual persistent rollover를 혼동하지 않는다.

---

# 15. Integrated Annual Rollover Requirements

Actual rollover 구현은 다음 조건을 만족해야 한다.

## 15.1 Single execution

동일한 연도전환이 두 번 실행되지 않아야 한다.

예:

```text
2026 → 2027
```

이 완료되면 동일 transition의 재실행을 차단해야 한다.

---

## 15.2 Pre-transition backup

실제 mutation 전에 현재 state를 복구 가능한 형태로 보존해야 한다.

기존 backup/restore 기능과의 연계를 우선 검토한다.

---

## 15.3 Snapshot prerequisite

실행 전 사용자에게 직전연도 최종 Snapshot 저장 여부를 명시적으로 확인시킨다.

특히:

* Performance
* Growth & Dividend
* Cash-like

등의 기존 Table Snapshot을 확인한다.

자동으로 snapshot이 “최종”인지 추론하는 복잡한 engine은 만들지 않는다.

사용자 확인 workflow를 우선한다.

---

## 15.4 Growth pending protection

Growth month close가 pending 상태라면 rollover 실행 여부를 검토해야 한다.

미완료 상태에서 파괴적 rollover를 수행하지 않는다.

---

## 15.5 Atomicity

가능하면:

```text
clone current state
→ clone에 모든 rollover mutation
→ validation
→ 성공하면 authoritative state 교체
→ Save 1회
```

방식을 우선 검토한다.

각 단계마다 production state를 저장하는 방식은 피한다.

---

## 15.6 Save

Integrated rollover가 성공한 경우 Supabase Save는 가능한 한 한 번만 수행한다.

중간 state를 cloud에 저장하지 않는다.

---

## 15.7 Failure

validation 실패 시:

```text
production state unchanged
```

이어야 한다.

partial rollover를 남기지 않는다.

---

# 16. Annual Transition UI

권장 UX:

```text
[Annual Transition]

2026 → 2027

Before continuing:

[ ] 2026 최종 Snapshot 저장 확인
[ ] Growth month-close 확인
[ ] Backup 확인

[Preview]
[Cancel]
[Execute Annual Transition]
```

실행 전 무엇이 바뀌는지 보여주는 preview를 유지하는 것이 좋다.

---

# 17. Post-transition Verification

실제 rollover 후 반드시 다음을 확인한다.

## Performance

```text
26 YTD → prior
27 YTD = 0
27 손익 = 0
TWR carry
CAGR 정상
```

## Allocation

```text
27 손익 = 0
YTD 27 = 0
평가액 유지
누적손익 유지
TR 유지
```

## Cash-like

```text
27 기준액 = transition 시 balance
입출금 = 0
27 손익 = 0
```

## Dividend

```text
2027 배당금 현황
72 cells = 0
총합 = 0
```

## Income & Tax

```text
2026 editable until finalized
2027 empty editable row 존재
2027 row는 Sum 위
```

## Annual Input

```text
2028 input 표시
```

---

# 18. Reload Verification

Rollover 성공 후 반드시 browser reload를 수행한다.

확인:

* 2027 state 유지
* rollover marker 유지
* 새 annual fields 유지
* Dividend reset 유지
* Income & Tax 2027 row 유지
* Supabase에서 동일 state reload

memory-only 상태에 의존해서는 안 된다.

---

# 19. `/v35/` and Stable Reference Coexistence

Production writer:

```text
/v35/
```

Stable reference:

```text
/
```

Annual Transition은 `/v35/`에서만 수행한다.

root `/`에서는 Save하지 않는다.

---

## 19.1 Post-transition reference comparison

Annual Transition 후 root v3와 `/v35/`의 annual values는 직접 비교하지 않는다.

대신 다음 core invariant를 비교한다.

* Holdings
* 수량
* 평균단가
* 현금
* Market/Korea price
* 종목 평가액
* 계좌 평가액
* Total 평가액
* 현재 Allocation

---

## 19.2 Shared-state coexistence test

Integrated Annual Rollover 완료 후 반드시 검증한다.

```text
/v35/
→ state Save

/
→ reload
```

root `/`가 최신 shared holdings/current valuation을 정상적으로 읽는지 확인한다.

root `/`에서는 Save하지 않는다.

---

# 20. Future Reference Strategy

root v3가 최신 v35 schema를 충분히 해석하지 못하게 되면 known-good v35 release를 다음 경로에 freeze하는 것을 검토한다.

```text
/reference/
```

관련 장기 정책은:

```text
VERSION_OPERATIONS.md
```

를 따른다.

---

# 21. 2026 → 2027 Execution Checklist

실제 연도전환 시 이 section을 사용한다.

### Before

```text
[ ] /v35/ production 사용 중인지 확인
[ ] Git known-good commit 확인
[ ] Backup 생성
[ ] 2026 최종 Performance Snapshot 저장 확인
[ ] 2026 최종 Growth & Dividend Snapshot 저장 확인
[ ] 2026 최종 Cash-like Snapshot 저장 확인
[ ] Growth month-close pending 없음 확인
[ ] Market/Korea price 정상 확인
[ ] Holdings/current valuation 정상 확인
```

### Preview

```text
[ ] 2027 business year preview
[ ] Performance prior/current YTD 확인
[ ] Allocation 27 손익/YTD = 0
[ ] Cash-like base2027 확인
[ ] Cash-like flow2027 = 0
[ ] Dividend 72 cells = 0
[ ] Income & Tax 2027 empty row
[ ] Annual Input 2028 표시
```

### Execute

```text
[ ] Annual Transition 실행
[ ] 중복 실행 marker 생성
[ ] validation PASS
[ ] Supabase Save 성공
```

### After

```text
[ ] reload
[ ] business year = 2027
[ ] Performance 정상
[ ] Allocation 정상
[ ] Cash-like 정상
[ ] Dividend 정상
[ ] Income & Tax 정상
[ ] Annual Input 정상
[ ] Growth 정상
```

### Reference Regression

```text
[ ] root / reload
[ ] Holdings 동일
[ ] 수량 동일
[ ] 현금 동일
[ ] 계좌 평가액 비교
[ ] Total 평가액 비교
[ ] 현재 Allocation 비교
[ ] root / 에서 Save하지 않음
```

---

# 22. Rules for Future Annual Transitions

2027 → 2028 이후에도 같은 원칙을 적용한다.

단, 특정 field 이름을 매년 코드에 hard-code하는 방식보다 business year 기반 접근을 우선한다.

예:

```text
base{year}
flow{year}
```

다만 미래 확장성을 이유로 현재 요구보다 과도한 schema/state machine을 미리 만들지 않는다.

실제 다음 연도전환에서 필요한 변화가 생기면 그때 기존 Runbook과 실제 state를 다시 audit한다.

---

# 23. Source of Truth

Annual Transition 구현을 수정할 때 우선순위:

1. 실제 production state
2. 현재 authoritative UI/calculation
3. 이 Runbook
4. 과거 기억

문서와 실제 코드가 달라졌다면 문서를 업데이트한다.

기억만으로 rollover logic을 수정하지 않는다.

---

# 24. Current Status

2026 → 2027 기준:

```text
Individual feature simulation:
PASS

History/Snapshot audit:
PASS

Actual integrated persistent Annual Rollover:
NOT YET IMPLEMENTED

Production writer:
planned /v35/

Stable reference:
root /
```

Integrated Annual Rollover가 완료되면 이 section을 반드시 업데이트한다.

---

# 25. Related Documentation

장기 버전 운영 및 stable reference 정책:

```text
VERSION_OPERATIONS.md
```

Annual Transition 구현과 version/reference 운영 정책은 서로 연관되지만 별도의 책임을 가진 문서로 유지한다.
