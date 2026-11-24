//
// Portfolio Control v3.5
// Allocation future-year simulation.
// DEV-only, memory-only.
//

(function () {
  let allocationPreviewV35 =
    null;

  function businessYearV35Safe() {
    return (
      typeof window.businessYearV35 ===
        'function'
        ? window.businessYearV35()
        : new Date().getFullYear()
    );
  }

  function activeAnnualYearV35Safe() {
    return (
      typeof window.activeAnnualYearV35 ===
        'function'
        ? Number(
            window.activeAnnualYearV35()
          )
        : 2026
    );
  }

  function allocationEffectiveYearV35() {
    const businessYear =
      businessYearV35Safe();

    if (
      allocationPreviewV35 &&
      Number(
        allocationPreviewV35.toYear
      ) === businessYear
    ) {
      return businessYear;
    }

    return activeAnnualYearV35Safe();
  }

  function allocationSnapshotV35() {
    const businessYear =
      businessYearV35Safe();

    if (
      allocationPreviewV35 &&
      Number(
        allocationPreviewV35.toYear
      ) === businessYear
    ) {
      return allocationPreviewV35
        .pensionSnapshot || null;
    }

    const activeYear =
      activeAnnualYearV35Safe();

    if (activeYear <= 2026) {
      return null;
    }

    return (
      data &&
      data.pensionSnapshot
        ? data.pensionSnapshot
        : null
    );
  }

  function cloneV35(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function ytdFromSnapshotV35(
    value,
    snapshot
  ) {
    const base =
      Number(
        snapshot
          ?.snapshotEvalKRW
      ) || 0;

    if (!base) {
      return 0;
    }

    return (
      (
        Number(value) -
        base
      ) /
      base *
      100
    );
  }

  function pnlFromSnapshotV35(
    value,
    snapshot
  ) {
    return (
      (
        Number(value) || 0
      ) -
      (
        Number(
          snapshot
            ?.snapshotEvalKRW
        ) || 0
      )
    ) / 10000;
  }

  window.setAllocationRolloverPreviewV35 =
    function (preview) {
      if (
        !preview ||
        Number(
          preview.fromYear
        ) !== 2026 ||
        Number(
          preview.toYear
        ) !== 2027 ||
        !preview.pensionSnapshot
      ) {
        throw new Error(
          '[v35] invalid Allocation rollover preview'
        );
      }

      allocationPreviewV35 =
        cloneV35(
          preview
        );

      return true;
    };

  window.clearAllocationRolloverPreviewV35 =
    function () {
      allocationPreviewV35 =
        null;

      return true;
    };

  window.getAllocationRolloverPreviewV35 =
    function () {
      return allocationPreviewV35;
    };

  window.allocationFutureMetricsV35 =
  function () {
    const effectiveYear =
      allocationEffectiveYearV35();

    const snapshot =
      allocationSnapshotV35();

    if (
      effectiveYear <= 2026 ||
      !snapshot
    ) {
      return null;
    }

    if (
      typeof window.pensionMetrics !==
        'function'
    ) {
      throw new Error(
        '[v35] pensionMetrics is not available'
      );
    }

    const current =
      window.pensionMetrics();

    const result = {
      businessYear:
        effectiveYear,
      groups: {},
      details: {}
    };

    Object.entries(
      current.groups || {}
    ).forEach(
      ([key, metric]) => {
        const base =
          snapshot
            .groups?.[key];

        result.groups[key] = {
          value:
            Number(
              metric.value
            ) || 0,

          pnlMan:
            pnlFromSnapshotV35(
              metric.value,
              base
            ),

          ytd:
            ytdFromSnapshotV35(
              metric.value,
              base
            ),

          cumPnl:
            Number(
              metric.cumPnl
            ) || 0
        };
      }
    );

    Object.entries(
      current.details || {}
    ).forEach(
      ([key, metric]) => {
        const base =
          snapshot
            .details?.[key];

        result.details[key] = {
          value:
            Number(
              metric.value
            ) || 0,

          pnlMan:
            pnlFromSnapshotV35(
              metric.value,
              base
            ),

          ytd:
            ytdFromSnapshotV35(
              metric.value,
              base
            ),

          cumPnl:
            Number(
              metric.cumPnl
            ) || 0
        };
      }
    );

    function combinedGroupV35(
      keys
    ) {
      const metrics =
        keys
          .map(
            key =>
              result.details[
                key
              ]
          )
          .filter(
            Boolean
          );

      if (
        metrics.length !==
        keys.length
      ) {
        return null;
      }

      const value =
        metrics.reduce(
          (sum, metric) =>
            sum +
            (
              Number(
                metric.value
              ) || 0
            ),
          0
        );

      const pnlMan =
        metrics.reduce(
          (sum, metric) =>
            sum +
            (
              Number(
                metric.pnlMan
              ) || 0
            ),
          0
        );

      const base =
        value -
        pnlMan * 10000;

      const ytd =
        base
          ? (
              pnlMan *
              10000 /
              base *
              100
            )
          : 0;

      const cumPnl =
        metrics.reduce(
          (sum, metric) =>
            sum +
            (
              Number(
                metric.cumPnl
              ) || 0
            ),
          0
        );

      return {
        value,
        pnlMan,
        ytd,
        cumPnl
      };
    }

    const equity =
      combinedGroupV35(
        [
          'NASDAQ',
          'S&P500',
          'GLOBAL',
          'WORLD'
        ]
      );

    if (equity) {
      result.groups.EQUITY =
        equity;
    }

    const income =
      combinedGroupV35(
        [
          'K-DVD',
          'US-CVD'
        ]
      );

    if (income) {
      result.groups.INCOME =
        income;
    }

    return result;
  };

  function formatManV35(
    value
  ) {
    const n =
      Number(value);

    if (
      !Number.isFinite(n)
    ) {
      return 'n/a';
    }

    return (
      `${Math.round(n)
        .toLocaleString(
          'ko-KR'
        )}만원`
    );
  }

  function formatPctV35(
    value
  ) {
    const n =
      Number(value);

    if (
      !Number.isFinite(n)
    ) {
      return 'n/a';
    }

    return (
      `${n >= 0 ? '+' : ''}` +
      `${n.toFixed(2)}%`
    );
  }

  function applyAllocationPresentationV35() {
  const effectiveYear =
    allocationEffectiveYearV35();

  if (effectiveYear <= 2026) {
    return false;
  }

  const metrics =
    window
      .allocationFutureMetricsV35();

  if (!metrics) {
    return false;
  }

  const tables =
    Array.from(
      document.querySelectorAll(
        '#content table'
      )
    );

  let applied =
    false;

  tables.forEach(
    table => {
      const headerCells =
        Array.from(
          table.querySelectorAll(
            'thead th'
          )
        );

      const headers =
        headerCells.map(
          th =>
            th.textContent
              .trim()
        );

      //
      // Base DOM 또는 이미 future-year로
      // relabel된 DOM 모두 처리한다.
      //
      const pnlIdx =
        headers.findIndex(
          text =>
            /^\d{2}\s*손익$/
              .test(
                text
                  .replace(
                    /\s+/g,
                    ' '
                  )
              )
        );

      const ytdIdx =
        headers.findIndex(
          text =>
            /^YTD\s*\d{2}$/
              .test(
                text
                  .replace(
                    /\s+/g,
                    ' '
                  )
              )
        );

      if (
        pnlIdx < 0 ||
        ytdIdx < 0
      ) {
        return;
      }

      const firstHeader =
        headers[0];

      const source =
        firstHeader === '구분'
          ? metrics.groups
          : firstHeader === '자산'
            ? metrics.details
            : null;

      if (!source) {
        return;
      }

      headerCells[
        pnlIdx
      ].textContent =
        `${String(
          effectiveYear
        ).slice(-2)} 손익`;

      headerCells[
        ytdIdx
      ].textContent =
        `YTD ${String(
          effectiveYear
        ).slice(-2)}`;

      table.querySelectorAll(
        'tbody tr'
      ).forEach(
        row => {
          const firstCellText =
            row.children[0]
              ?.textContent
              ?.trim() || '';

          const key =
            firstHeader === '구분'
              ? Object.keys(
                  source
                ).find(
                  candidate =>
                    firstCellText
                      .startsWith(
                        candidate
                      )
                )
              : firstCellText;

          const metric =
            key
              ? source[key]
              : null;

          if (!metric) {
            return;
          }

          const pnlCell =
            row.children[
              pnlIdx
            ];

          const ytdCell =
            row.children[
              ytdIdx
            ];

          if (pnlCell) {
            pnlCell.textContent =
              formatManV35(
                metric.pnlMan
              );
          }

          if (ytdCell) {
            ytdCell.textContent =
              formatPctV35(
                metric.ytd
              );
          }
        }
      );

      const sumRow =
        Array.from(
          table.querySelectorAll(
            'tbody tr'
          )
        ).find(
          row =>
            row.children[0]
              ?.textContent
              ?.trim() ===
            'Sum'
        );

      if (sumRow) {
        const metricsList =
          Object.values(
            source
          );

        const pnlSum =
          metricsList.reduce(
            (sum, metric) =>
              sum +
              (
                Number(
                  metric.pnlMan
                ) || 0
              ),
            0
          );

        const valueSum =
          metricsList.reduce(
            (sum, metric) =>
              sum +
              (
                Number(
                  metric.value
                ) || 0
              ),
            0
          );

        const baseSum =
          valueSum -
          pnlSum * 10000;

        const ytdSum =
          baseSum
            ? (
                pnlSum *
                10000 /
                baseSum *
                100
              )
            : 0;

        const pnlCell =
          sumRow.children[
            pnlIdx
          ];

        const ytdCell =
          sumRow.children[
            ytdIdx
          ];

        if (pnlCell) {
          pnlCell.textContent =
            formatManV35(
              pnlSum
            );
        }

        if (ytdCell) {
          ytdCell.textContent =
            formatPctV35(
              ytdSum
            );
        }
      }

      applied =
        true;
    }
  );

  return applied;
}

  window.applyAllocationPresentationV35 =
    applyAllocationPresentationV35;

  // v35: Color only P&L and return columns in
// Portfolio Exposure and Exposure Detail.
function applyAllocationSignColorsV35() {
  const tables = document.querySelectorAll(
    '#content .v33-exposure-table, ' +
    '#content .v33-exposure-detail-table'
  );

  tables.forEach(table => {
    const headers = Array.from(
      table.querySelectorAll('thead th')
    ).map(th =>
      th.textContent.replace(/\s+/g, '')
    );

    const targetIndices = headers
      .map((label, index) =>
        /^(?:\d{2}손익|YTD\d{2}|누적손익|TR)$/
          .test(label)
          ? index
          : -1
      )
      .filter(index => index >= 0);

    // Do not modify an unexpected table structure.
    if (targetIndices.length !== 4) return;

    table.querySelectorAll('tbody tr').forEach(row => {
      if (row.children.length !== headers.length) {
        return;
      }

      targetIndices.forEach(index => {
        const cell = row.children[index];

        if (!cell || cell.tagName !== 'TD') return;

        const valueText = cell.textContent
          .trim()
          .replace(/,/g, '')
          .replace(/\u2212/g, '-');

        const parsed = valueText.match(
          /^([+-]?)(\d+(?:\.\d+)?)/
        );

        const negative = Boolean(
          parsed &&
          parsed[1] === '-' &&
          Number(parsed[2]) > 0
        );

        cell.classList.toggle(
          'v33-negative',
          negative
        );
      });
    });
  });
}


  // v35 only: reconstruct 2026 detail P&L from the live holdings ledger.
  const DETAIL_KEYS_2026_V35 = [
    'NASDAQ', 'S&P500', 'US-CVD', 'K-DVD',
    'BOND', 'GOLD', 'GLOBAL', 'WORLD'
  ];

  function buildExposureDetailLedger2026V35() {
    if (
      Number(businessYearV35Safe()) !== 2026 ||
      Number(activeAnnualYearV35Safe()) !== 2026 ||
      allocationEffectiveYearV35() !== 2026 ||
      allocationPreviewV35 !== null ||
      typeof data === 'undefined' ||
      typeof holdingMetric !== 'function' ||
      typeof pensionMetrics !== 'function'
    ) return null;

    const snapshot = data.pensionSnapshot?.details;
    if (!snapshot || !Array.isArray(data.holdings)) return null;

    let metrics;
    try {
      metrics = pensionMetrics()?.details;
    } catch (_) {
      return null;
    }
    if (!metrics) return null;

    const rows = {};
    let priorSum = 0;
    let denominatorSum = 0;
    let buySum = 0;
    let valueSum = 0;

    for (const key of DETAIL_KEYS_2026_V35) {
      const s = snapshot[key];
      const m = metrics[key];
      if (!s || !m) return null;

      const priorMan = Number(s.snapshotCumPnlMan) -
        Number(s.snapshotYtdPnlMan);
      const denominatorKRW = Number(s.ytdDenomKRW);
      const buyKRW = Number(m.buy);
      const valueKRW = Number(m.value);

      if (
        !Number.isFinite(priorMan) ||
        !Number.isFinite(denominatorKRW) ||
        denominatorKRW <= 0 ||
        !Number.isFinite(buyKRW) ||
        !Number.isFinite(valueKRW)
      ) return null;

      rows[key] = {
        key,
        priorKRW: priorMan * 10000,
        denomKRW: denominatorKRW,
        buyKRW,
        valueKRW,
        cumPnlKRW: 0,
        ytdPnlKRW: 0
      };
      priorSum += priorMan * 10000;
      denominatorSum += denominatorKRW;
      buySum += buyKRW;
      valueSum += valueKRW;
    }

    for (const h of data.holdings) {
      if (!['DC', 'P1', 'P2'].includes(h.account)) continue;
      const active = !h.status || h.status === 'Active';
      const m = active ? holdingMetric(h) : null;
      const evalPnl = active ? Number(m?.evalPnl) : 0;
      const realized = Number(h.realized || 0);
      const dividend = Number(h.cumDividend || 0);
      if (![evalPnl, realized, dividend].every(Number.isFinite)) {
        return null;
      }
      const pnl = evalPnl + realized + dividend;
      const mapping = data.mapping?.[h.code];
      if (!mapping || typeof mapping !== 'object') return null;

      let weightSum = 0;
      for (const [key, rawWeight] of Object.entries(mapping)) {
        const weight = Number(rawWeight);
        if (!Number.isFinite(weight) || weight < 0 ||
            (key !== 'PARKING' && !(key in rows))) {
          return null;
        }
        weightSum += weight;
        if (key in rows) rows[key].cumPnlKRW += pnl * weight;
      }
      if (Math.abs(weightSum - 1) > 1e-8) return null;
    }

    const totalSnapshot = snapshot.TOTAL;
    if (!totalSnapshot) return null;
    const priorTotalMan = Number(totalSnapshot.snapshotCumPnlMan) -
      Number(totalSnapshot.snapshotYtdPnlMan);
    if (!Number.isFinite(priorTotalMan)) return null;
    const priorTotalKRW = priorTotalMan * 10000;
    const baselineCarryKRW = priorTotalKRW - priorSum;

    // Deleted Closed holdings are archived by the existing v33 lifecycle.
    // PARKING is excluded because Exposure Detail excludes PARKING.
    const saved = data.performanceV33?.bucketArchivedPnlKRW || {};
    let archivedKRW = 0;
    for (const key of ['EQUITY', 'INCOME', 'HEDGE']) {
      const amount = Number(saved[key] || 0);
      if (!Number.isFinite(amount)) return null;
      archivedKRW += amount;
    }

    let currentDetailKRW = 0;
    let ytdDetailKRW = 0;
    for (const key of DETAIL_KEYS_2026_V35) {
      const row = rows[key];
      row.ytdPnlKRW = row.cumPnlKRW - row.priorKRW;
      currentDetailKRW += row.cumPnlKRW;
      ytdDetailKRW += row.ytdPnlKRW;
    }

    // Reconcile current non-PARKING cumulative P&L
// with the existing Portfolio Exposure calculation.
if (typeof pensionBucketMetricsV33 !== 'function') {
  return null;
}

let bucketMetrics;

try {
  bucketMetrics = pensionBucketMetricsV33();
} catch (error) {
  return null;
}

const bucketKeys = ['EQUITY', 'INCOME', 'HEDGE'];

let nonParkingCumKRW = 0;

for (const key of bucketKeys) {
  const amount = Number(
    bucketMetrics?.buckets?.[key]?.cumPnl
  );

  if (!Number.isFinite(amount)) {
    return null;
  }

  nonParkingCumKRW += amount;
}

// Current unallocated P&L, derived from the
// existing bucket ledger rather than hardcoded.
const carryKRW =
  nonParkingCumKRW - currentDetailKRW;

// The difference between the historical baseline
// and the current unallocated P&L belongs to 2026.
const carryYtdKRW =
  carryKRW - baselineCarryKRW;

const totalCumKRW = nonParkingCumKRW;
const totalYtdKRW =
  totalCumKRW - priorTotalKRW;
    return {
      rows,
      baselineCarryKRW,
      archivedKRW,
      carryKRW,
      carryYtdKRW,
      priorTotalKRW,
      currentDetailKRW,
      ytdDetailKRW,
      total: {
        buyKRW: buySum,
        valueKRW: valueSum,
        denomKRW: denominatorSum,
        cumPnlKRW: totalCumKRW,
        ytdPnlKRW: totalYtdKRW
      }
    };
  }

  // Read-only browser audit: neither persistence nor DOM modification.
  window.previewExposureDetailLedger2026V35 =
    buildExposureDetailLedger2026V35;

  function reconcileExposureDetail2026V35() {
    const model = buildExposureDetailLedger2026V35();
    if (!model) return false;

    const table = document.querySelector(
      '#content .v33-exposure-detail-table'
    );
    if (!table) return false;
    const headers = Array.from(table.querySelectorAll('thead th'))
      .map(th => th.textContent.replace(/\s+/g, ''));
    if (
      headers.length !== 8 ||
      headers[0] !== '\uC790\uC0B0' ||
      headers[3] !== '26\uC190\uC775' ||
      headers[4] !== 'YTD26' ||
      headers[5] !== '\uB204\uC801\uC190\uC775' ||
      headers[6] !== 'TR'
    ) return false;

    const allRows = Array.from(table.querySelectorAll('tbody tr'));
    const assetRows = {};
    for (const key of DETAIL_KEYS_2026_V35) {
      const candidates = allRows.filter(r =>
        r.children.length === 8 &&
        r.children[0]?.textContent.trim() === key
      );
      if (candidates.length !== 1) return false;
      assetRows[key] = candidates[0];
    }
    const sumRow = table.querySelector('tbody tr.v33-performance-total');
    if (!sumRow || sumRow.children.length !== 8) return false;

    const update = (cell, text) => {
      if (cell.textContent.trim() !== text) cell.textContent = text;
    };
    const man = value => formatManV35(value / 10000);
    const pct = value => formatPctV35(value);
    const ytdRate = row =>
      100 * row.ytdPnlKRW / row.denomKRW;
    const trRate = row => row.buyKRW
      ? 100 * row.cumPnlKRW / row.buyKRW : NaN;

    for (const key of DETAIL_KEYS_2026_V35) {
      const row = assetRows[key];
      const value = model.rows[key];
      update(row.children[3], man(value.ytdPnlKRW));
      update(row.children[4], pct(ytdRate(value)));
      update(row.children[5], man(value.cumPnlKRW));
      update(row.children[6], pct(trRate(value)));
    }

    let carryRow = table.querySelector('tbody tr[data-pc-v35-carry="1"]');
    if (!carryRow) {
      carryRow = document.createElement('tr');
      carryRow.dataset.pcV35Carry = '1';
      for (let i = 0; i < 8; i++) {
        carryRow.appendChild(document.createElement('td'));
      }
      sumRow.parentNode.insertBefore(carryRow, sumRow);
    }
    update(carryRow.children[0], '\uACFC\uAC70 \uBBF8\uBC30\uBD84');
    for (const i of [1, 2, 4, 6, 7]) {
      update(carryRow.children[i], '\u2014');
    }
    update(carryRow.children[3], man(model.carryYtdKRW));
    update(carryRow.children[5], man(model.carryKRW));

    update(sumRow.children[3], man(model.total.ytdPnlKRW));
    update(sumRow.children[4], pct(ytdRate(model.total)));
    update(sumRow.children[5], man(model.total.cumPnlKRW));
    update(sumRow.children[6], pct(trRate(model.total)));

    const section = table.closest('.v33-exposure-detail');
    if (section) {
      let note = section.querySelector('[data-pc-v35-ledger-note]');
      if (!note) {
        note = document.createElement('p');
        note.setAttribute('data-pc-v35-ledger-note', '1');
        note.className = 'v33-subcopy';
        table.closest('.tableWrap')?.insertAdjacentElement('afterend', note);
      }
      const text =
        `2026\uB144 \uC6D0\uC7A5 \uAE30\uC900. 2025\uB144 \uAE30\uC900 \uBBF8\uBC30\uBD84: ` +
        `${man(model.baselineCarryKRW)}; ` +
        `\uC774\uD6C4 \uC0AD\uC81C\uC885\uBAA9 \uBCF4\uC874\uC190\uC775: ${man(model.archivedKRW)}. ` +
        `\uACFC\uAC70 \uADC0\uC18D\uACFC \uACC4\uC88C\uD569\uACC4 \uCC28\uC774\uB294 \uBBF8\uAC80\uC99D; ` +
        `Sum\uC740 \uC7A0\uC815\uAC12\uC785\uB2C8\uB2E4.`;
      if (note.textContent !== text) note.textContent = text;
    }
    return true;
  }

  function installAllocationObserverV35() {
    const content =
      document.getElementById(
        'content'
      );

    if (!content) {
      return;
    }

    let queued =
      false;

    const queueApply =
      function () {
        if (queued) {
          return;
        }

        queued =
          true;

        requestAnimationFrame(
          function () {
            queued =
              false;

            applyAllocationPresentationV35();
            reconcileExposureDetail2026V35();
            applyAllocationSignColorsV35();
          }
        );
      };

    const observer =
      new MutationObserver(
        queueApply
      );

    observer.observe(
      content,
      {
        childList: true,
        subtree: true
      }
    );

    queueApply();
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      installAllocationObserverV35,
      {
        once: true
      }
    );
  } else {
    installAllocationObserverV35();
  }
})();