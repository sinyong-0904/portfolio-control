//
// Portfolio Control v3.5
// Growth rollover adapter.
// Reuses the existing v3.2 rollover implementation.
//

(function () {

  window.rollGrowthForward = function () {
    if (typeof window.rollGrowthForwardV32 !== 'function') {
      throw new Error('rollGrowthForwardV32 is not available');
    }
    const g = data && data.growthV32;
    if (!g) throw new Error('Growth state is unavailable');
    const now = new Date();
    const currentSerial = now.getFullYear() * 12 + now.getMonth();
    const storedSerial = g.currentYear * 12 + g.currentMonthIndex;
    if (currentSerial <= storedSerial) return false;
    if (currentSerial !== storedSerial + 1) {
      throw new Error('두 달 이상의 지연 월마감은 자동 처리하지 않습니다.');
    }
    if (g.currentMonthIndex === 11) {
      window.alert('12월 마감은 v35 연도전환 화면에서 진행하세요.');
      return false;
    }
    const months = data.months ||
      ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const row = g.years?.[String(g.currentYear)]?.[months[g.currentMonthIndex]];
    const saved = row?.monthEndCloseV35;
    window.rollGrowthForwardV32(
      now.getFullYear(), now.getMonth(),
      saved ? { explicitMonthCloseV35: saved } : undefined
    );
    return true;
  };

  window.monthCloseConfirmTextV35 = function () {
    const g = data && data.growthV32;
    if (!g) return 'Growth 상태를 확인할 수 없습니다.';
    const monthName = (g.currentMonthIndex + 1) + '월';
    const months = data.months ||
      ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const saved = g.years?.[String(g.currentYear)]
      ?.[months[g.currentMonthIndex]]?.monthEndCloseV35;
    if (saved) {
      return `${g.currentYear}년 ${monthName}을 저장한 월말 기준값 ` +
        `${Number(saved.totalValue).toLocaleString('ko-KR')}만원으로 확정할까요?\n` +
        `저장 기준일: ${saved.priceDate}\n\n` +
        '확정액은 다음 달 시작값으로 그대로 이월됩니다.';
    }
    return `${g.currentYear}년 ${monthName}의 명시적 월말 저장값이 없습니다.\n\n` +
      '현재 평가액으로 예외 확정하면 다음 달 가격이 이전 달 실적에 포함될 수 있습니다.\n' +
      '그 위험을 감수하고 현재 평가액으로 확정하시겠습니까?';
  };


  window.testGrowthYearRolloverV35 =
    function () {
      if (
        typeof window.rollGrowthForwardV32 !==
        'function'
      ) {
        throw new Error(
          'rollGrowthForwardV32 is not available'
        );
      }

      const originalGrowth =
        data.growthV32;

      const originalSave =
        window.save;

      if (!originalGrowth) {
        throw new Error(
          'growthV32 state is not available'
        );
      }

      const testGrowth =
        JSON.parse(
          JSON.stringify(
            originalGrowth
          )
        );

      try {
        data.growthV32 =
          testGrowth;

        window.save =
          function () {
            console.log(
              '[v35 dry-run] save blocked'
            );
          };

        testGrowth.currentYear =
          2026;

        testGrowth.currentMonthIndex =
          11;

        if (!testGrowth.years) {
          testGrowth.years = {};
        }

        if (!testGrowth.years['2026']) {
          throw new Error(
            '2026 Growth rows not available'
          );
        }

        const months = [
          'JAN','FEB','MAR','APR',
          'MAY','JUN','JUL','AUG',
          'SEP','OCT','NOV','DEC'
        ];

        const dec =
          testGrowth.years['2026'].DEC;

        if (!dec) {
          throw new Error(
            '2026 DEC row not available'
          );
        }

        dec.contribution =
          Number(dec.contribution) || 0;

        dec.cashChange =
          Number(dec.cashChange) || 0;

        dec.locked =
          false;

        const n =
          netSummary();

        testGrowth.currentStart = {
          investmentValue:
            n.inv.value,
          legacyValue:
            n.legacy.value,
          totalValue:
            n.total
        };

        window.rollGrowthForwardV32(
          2027,
          0
        );

        const jan =
          testGrowth.years['2027'] &&
          testGrowth.years['2027'].JAN;

        const futureRows =
          testGrowth.years['2027']
            ? months
                .slice(1)
                .map(
                  month =>
                    testGrowth
                      .years['2027'][
                        month
                      ]
                )
            : [];

        const result = {
          currentYear:
            testGrowth.currentYear,

          currentMonthIndex:
            testGrowth.currentMonthIndex,

          annual2026:
            testGrowth.annual &&
            testGrowth.annual['2026'],

          jan2027:
            jan,

          janManualZero:
            !!jan &&
            Number(
              jan.contribution
            ) === 0 &&
            Number(
              jan.cashChange
            ) === 0,

          futureManualZero:
            futureRows.length === 11 &&
            futureRows.every(
              row =>
                row &&
                Number(
                  row.contribution
                ) === 0 &&
                Number(
                  row.cashChange
                ) === 0
            ),

          futureCalculatedBlank:
            futureRows.length === 11 &&
            futureRows.every(
              row =>
                row &&
                row.investmentReturn ==
                  null &&
                row.legacy == null &&
                row.totalChange == null &&
                row.value == null
            ),

          annualYears:
            Object.keys(
              testGrowth.annual || {}
            )
              .map(Number)
              .sort(
                (a, b) =>
                  b - a
              )
        };

        console.table({
          currentYear: {
            value:
              result.currentYear,
            expected: 2027
          },

          currentMonthIndex: {
            value:
              result.currentMonthIndex,
            expected: 0
          },

          annual2026Created: {
            value:
              !!result.annual2026,
            expected: true
          },

          janManualZero: {
            value:
              result.janManualZero,
            expected: true
          },

          futureManualZero: {
            value:
              result.futureManualZero,
            expected: true
          },

          futureCalculatedBlank: {
            value:
              result.futureCalculatedBlank,
            expected: true
          }
        });

        console.log(
          '[v35 dry-run] result',
          result
        );

        return result;
      } finally {
        data.growthV32 =
          originalGrowth;

        window.save =
          originalSave;
      }
    };
})();


// v35 전용: 사용자가 명시적으로 저장하는 월말 평가액
(function () {
  'use strict';
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  let modal = null;
  let shownForVisit = false;
  let saving = false;

  function koreaTime(date) {
    const fields = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit',
        day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value])
    );
    const year = Number(fields.year), month = Number(fields.month);
    const day = Number(fields.day);
    return {
      year, month, day, minuteOfDay: Number(fields.hour) * 60 + Number(fields.minute),
      iso: `${fields.year}-${fields.month}-${fields.day}`,
      daysLeft: new Date(Date.UTC(year, month, 0)).getUTCDate() - day,
      weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay()
    };
  }

  function monthEndStatus(date = new Date()) {
    const t = koreaTime(date);
    const growth = data && data.growthV32;
    const row = growth && growth.years?.[String(t.year)]?.[MONTHS[t.month - 1]];
    const marketState = window.marketLiveState;
    const codes = [...new Set((data?.holdings || [])
      .filter(h => h && h.status === 'Active' && h.code)
      .map(h => String(h.code)))];
    const unavailable = codes.filter(code => {
      const quote = marketState?.byCode?.[code];
      const updatedAt = new Date(quote?.updatedAt);
      const updated = Number.isFinite(updatedAt.getTime())
        ? koreaTime(updatedAt) : null;
      return !quote || quote.priceDate !== t.iso ||
        !updated || updated.iso !== t.iso ||
        updated.minuteOfDay < 15 * 60 + 30;
    });
    const testClockActive = typeof window.getTestBusinessYearV35 === 'function' &&
      window.getTestBusinessYearV35() != null;
    const eligible = !testClockActive && t.daysLeft >= 0 && t.daysLeft <= 4 &&
      t.weekday !== 0 && t.weekday !== 6 &&
      t.minuteOfDay >= 15 * 60 + 30 &&
      growth?.currentYear === t.year &&
      growth?.currentMonthIndex === t.month - 1 &&
      row?.locked === false;
    return {
      ...t, eligible, marketReady: !!marketState?.loaded && codes.length > 0 &&
        unavailable.length === 0,
      unavailable, row,
      existing: row?.monthEndCloseV35 || null
    };
  }

  function closeModal() {
    if (modal) modal.remove();
    modal = null;
  }

  async function captureMonthEnd() {
    if (saving) return;
    const status = monthEndStatus();
    if (!status.eligible || !status.marketReady) {
      window.alert('월말 저장 조건 또는 오늘자 시장가격이 확인되지 않습니다.');
      return;
    }
    if (cloudReady !== true || !currentUser || !sb || cloudBusy !== false ||
        typeof flushCloud !== 'function' ||
        typeof window.readAnnualPortfolioStateCloudV35 !== 'function') {
      window.alert('클라우드가 저장 가능한 상태인지 확인한 뒤 다시 시도해 주세요.');
      return;
    }
    const g = data.growthV32;
    if (typeof window.v32MonthlyRows === 'function') window.v32MonthlyRows();
    const r = status.row;
    const n = netSummary();
    const start = g.currentStart || {};
    const startTotal = Number(start.totalValue);
    const startLegacy = Number(start.legacyValue);
    if (start.totalValue == null || start.legacyValue == null ||
        !Number.isFinite(startTotal) || !Number.isFinite(startLegacy) ||
        !Number.isFinite(n.total) || !Number.isFinite(n.inv.value) ||
        !Number.isFinite(n.cash.value) || !Number.isFinite(n.legacy.value) ||
        Math.abs(Number(r.value) - n.total) > 0.0001) {
      window.alert('Growth 평가액이 일치하지 않습니다. 저장하지 않았습니다.');
      return;
    }
    const contribution = Number(r.contribution) || 0;
    const cashChange = Number(r.cashChange) || 0;
    const stockCompensation = status.year >= 2027 ? Number(r.stockCompensation) || 0 : 0;
    const legacy = n.legacy.value - startLegacy;
    const totalChange = n.total - startTotal;
    const record = {
      marker: 'USER_MONTH_END_V35',
      year: status.year, monthIndex: status.month - 1,
      priceDate: status.iso, savedAt: new Date().toISOString(),
      totalValue: n.total, investmentValue: n.inv.value,
      cashValue: n.cash.value, legacyValue: n.legacy.value,
      startTotal, startLegacy, contribution, cashChange,
      stockCompensation, totalChange, legacy,
      investmentReturn: totalChange - contribution - cashChange - legacy - stockCompensation
    };
    const previous = r.monthEndCloseV35;
    saving = true;
    r.monthEndCloseV35 = record;
    let written = false;
    try {
      // 기존 portfolio_state 저장 및 Supabase 원본 재조회
      if (cloudTimer) clearTimeout(cloudTimer);
      cloudTimer = null;
      if (await flushCloud() !== true) throw new Error('SUPABASE_SAVE_FAILED');
      written = true;
      const remote = await window.readAnnualPortfolioStateCloudV35();
      const restored = remote?.growthV32?.years?.[String(status.year)]
        ?.[MONTHS[status.month - 1]]?.monthEndCloseV35;
      if (!restored || Object.keys(record).some(key => restored[key] !== record[key])) {
        throw new Error('SUPABASE_READBACK_MISMATCH');
      }
      localStorage.setItem(KEY, JSON.stringify(data));
      closeModal();
      window.alert(`${status.year}년 ${status.month}월 월말 기준값 저장 확인 완료.\n평가액: ${record.totalValue.toLocaleString('ko-KR')}만원`);
    } catch (error) {
      if (!written) {
        if (previous === undefined) delete r.monthEndCloseV35;
        else r.monthEndCloseV35 = previous;
        localStorage.setItem(KEY, JSON.stringify(data));
      }
      console.error('[v35 month-end] save verification failed', error);
      window.alert('월말 기준값의 클라우드 저장을 확인하지 못했습니다. 다시 확인해 주세요.');
    } finally {
      saving = false;
    }
  }

  function showModal(status) {
    if (modal) return;
    modal = document.createElement('div');
    modal.id = 'v35-month-end-modal';
    Object.assign(modal.style, {
      position: 'fixed', inset: '0', zIndex: '25000',
      background: 'rgba(0,0,0,.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px'
    });
    const card = document.createElement('div');
    Object.assign(card.style, {
      background: '#fff', color: '#17202b', borderRadius: '12px',
      padding: '22px', maxWidth: '440px', width: '100%',
      boxShadow: '0 12px 32px rgba(0,0,0,.2)'
    });
    const heading = document.createElement('h3');
    heading.textContent = `${status.year}년 ${status.month}월 월말 기준값 저장`;
    const info = document.createElement('p');
    info.textContent = '이달 마지막 거래일에 저장하는 것이 가장 좋습니다. 현재 평가액을 다음 달 월마감의 기준값으로 보관하시겠습니까?';
    const details = document.createElement('p');
    const n = netSummary();
    details.textContent = `현재 평가액: ${n.total.toLocaleString('ko-KR')}만원\n시장가격 기준일: ${status.iso}`;
    details.style.whiteSpace = 'pre-line';
    const notice = document.createElement('p');
    notice.style.fontSize = '13px';
    notice.textContent = status.preview
      ? '미리보기입니다. 오늘 날짜나 가격을 확인한 것이 아니며 저장은 불가능합니다.'
      : status.marketReady
      ? (status.existing ? '기존 저장값을 오늘 평가액으로 교체합니다.' : '15:30 이후 갱신된 오늘자 보유종목 시세가 확인됐습니다.')
      : `15:30 이후 갱신 가격 미확인 종목 ${status.unavailable.length}개 — 가격 갱신 후 재진입해 주세요.`;
    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.gap = '10px';
    const cancel = document.createElement('button');
    cancel.type = 'button'; cancel.className = 'btn'; cancel.textContent = '취소';
    cancel.onclick = closeModal;
    const saveButton = document.createElement('button');
    saveButton.type = 'button'; saveButton.className = 'btn primary';
    saveButton.textContent = '월말 기준값 저장';
    saveButton.disabled = !!status.preview || !status.marketReady;
    saveButton.onclick = async () => {
      saveButton.disabled = true;
      try { await captureMonthEnd(); }
      finally { if (modal) saveButton.disabled = !monthEndStatus().marketReady; }
    };
    buttons.append(cancel, saveButton);
    card.append(heading, info, details, notice, buttons);
    modal.appendChild(card);
    document.body.appendChild(modal);
  }

  function checkGrowthEntry() {
    const selected = document.querySelector('#tabs .tab.on, #tabs [aria-selected="true"]');
    const activeGrowth = String(selected?.textContent || '').trim() === 'Growth & 배당' ||
      (typeof active !== 'undefined' && active === 'Growth & 배당');
    if (!activeGrowth) {
      shownForVisit = false;
      return;
    }
    const status = monthEndStatus();
    if (!status.eligible || shownForVisit) return;
    // 당일 저장 완료 시 반복 안내하지 않는다. 다음 거래일에는 다시 안내한다.
    if (status.existing && status.existing.priceDate === status.iso) return;
    shownForVisit = true;
    showModal(status);
  }

  window.previewMonthEndModalV35 = function () {
    const sample = monthEndStatus(new Date('2026-11-30T07:00:00Z'));
    showModal({ ...sample, preview: true, marketReady: false });
  };
  window.monthEndStatusV35 = monthEndStatus;
  window.captureMonthEndV35 = captureMonthEnd;
  window.addEventListener('load', () => {
    const tabs = document.getElementById('tabs');
    if (tabs) {
      new MutationObserver(checkGrowthEntry).observe(tabs, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ['class', 'aria-selected']
      });
    }
    checkGrowthEntry();
  });
  window.addEventListener('portfolio:market-loaded', checkGrowthEntry);
  window.addEventListener('portfolio:market-refreshed', checkGrowthEntry);
})();
