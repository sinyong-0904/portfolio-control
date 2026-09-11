//
// Portfolio Control v3.5
// Live Performance adjustments.
// Phase 3B: dynamic CAGR + future-year simulation.
//

(function () {
  let rolloverPreviewV35 =
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

  function persistentPerformanceSourceV35(
    activeYear
  ) {
    const state =
      data &&
      data.performanceV35;

    const carryByYear =
      state &&
      state.carryByYear;

    const prior =
      carryByYear &&
      carryByYear[
        String(activeYear - 1)
      ];

    if (
      !prior ||
      !prior.rows
    ) {
      return null;
    }

    const accountBaseMan = {};

    [
      'DC',
      'P1',
      'P2',
      'ISA',
      'GENERAL',
      'CHILD'
    ].forEach(
      function (id) {
        const account =
          acct(id);

        accountBaseMan[id] =
          Number(
            account &&
            account[
              'base' +
              String(activeYear)
            ]
          ) || 0;
      }
    );

    const bucketSnapshot =
      data &&
      data.pensionBucketSnapshot;

    return {
      fromYear:
        activeYear - 1,

      toYear:
        activeYear,

      carryRows:
        prior.rows,

      accountBaseMan,

      pensionBucketSnapshot:
        bucketSnapshot || null
    };
  }

  function performanceAnnualSourceV35(
    activeYear
  ) {
    const businessYear =
      businessYearV35Safe();

    if (
      rolloverPreviewV35 &&
      Number(
        rolloverPreviewV35.toYear
      ) === businessYear
    ) {
      return rolloverPreviewV35;
    }

    return persistentPerformanceSourceV35(
      activeYear
    );
  }

  function performanceEffectiveYearV35() {
    const businessYear =
      businessYearV35Safe();

    if (
      rolloverPreviewV35 &&
      Number(
        rolloverPreviewV35.toYear
      ) === businessYear
    ) {
      return businessYear;
    }

    return activeAnnualYearV35Safe();
  }

  function isoWeekV35(date) {
    const d =
      new Date(
        Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        )
      );

    const day =
      d.getUTCDay() || 7;

    d.setUTCDate(
      d.getUTCDate() +
      4 -
      day
    );

    const yearStart =
      new Date(
        Date.UTC(
          d.getUTCFullYear(),
          0,
          1
        )
      );

    return Math.ceil(
      (
        (
          d -
          yearStart
        ) /
        86400000 +
        1
      ) /
      7
    );
  }

  function durationYearsV35() {
    const now =
      new Date();

    return (
      now.getFullYear() -
      2025 +
      isoWeekV35(now) / 52
    );
  }

  function cagrFromTwrV35(
    twr,
    durationYears
  ) {
    const r =
      Number(twr) / 100;

    const years =
      Number(
        durationYears
      );

    if (
      !Number.isFinite(r) ||
      !Number.isFinite(years) ||
      years <= 0 ||
      1 + r <= 0
    ) {
      return 0;
    }

    return (
      (
        Math.pow(
          1 + r,
          1 / years
        ) -
        1
      ) *
      100
    );
  }

  function liveYtdFromBaseV35(
    value,
    base,
    flow
  ) {
    const denominator =
      Number(base) +
      Number(flow);

    if (!denominator) {
      return 0;
    }

    return (
      (
        Number(value) -
        denominator
      ) /
      denominator *
      100
    );
  }

  function currentYearPnlManV35(
    scope,
    businessYear
  ) {
    const effectiveYear =
      performanceEffectiveYearV35();

    const activeYear =
      activeAnnualYearV35Safe();

    const annualSource =
      performanceAnnualSourceV35(
        activeYear
      );

    if (
      effectiveYear <= 2026 ||
      !annualSource
    ) {
      return null;
    }

    const accountBase =
      annualSource
        .accountBaseMan || {};

    const accountMap = {
      DC: 'DC',
      '연금(1)': 'P1',
      '연금(2)': 'P2',
      ISA: 'ISA',
      '일반계좌': 'GENERAL',
      '자녀연금': 'CHILD'
    };

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          accountMap,
          scope
        )
    ) {
      const id =
        accountMap[scope];

      const value =
        Number(
          accountSummary(id).value
        ) || 0;

      const base =
        Number(
          accountBase[id]
        ) || 0;

      const flow =
        Number(
          annualFlow(
            acct(id),
            String(
              effectiveYear
            )
          )
        ) || 0;

      return (
        value -
        base -
        flow
      );
    }

    if (
      scope ===
      '연금합산'
    ) {
      const ids = [
        'DC',
        'P1',
        'P2'
      ];

      return ids.reduce(
        (sum, id) =>
          sum +
          (
            Number(
              accountSummary(id)
                .value
            ) || 0
          ) -
          (
            Number(
              accountBase[id]
            ) || 0
          ) -
          (
            Number(
              annualFlow(
                acct(id),
                String(
                  effectiveYear
                )
              )
            ) || 0
          ),
        0
      );
    }

    if (
      scope ===
      'Total'
    ) {
      const ids = [
        'DC',
        'P1',
        'P2',
        'ISA',
        'GENERAL',
        'CHILD'
      ];

      return ids.reduce(
        (sum, id) =>
          sum +
          (
            Number(
              accountSummary(id)
                .value
            ) || 0
          ) -
          (
            Number(
              accountBase[id]
            ) || 0
          ) -
          (
            Number(
              annualFlow(
                acct(id),
                String(
                  effectiveYear
                )
              )
            ) || 0
          ),
        0
      );
    }

    if (
      [
        'EQUITY',
        'INCOME',
        'HEDGE',
        'PARKING'
      ].includes(scope)
    ) {
      const metric =
        typeof window
          .pensionBucketMetricsV33 ===
          'function'
          ? window
              .pensionBucketMetricsV33()
              .buckets[scope]
          : null;

      const base =
        annualSource
          .pensionBucketSnapshot
          ?.buckets
          ?.[scope];

      if (
        !metric ||
        !base
      ) {
        return null;
      }

      return (
        (
          Number(
            metric.value
          ) || 0
        ) / 10000 -
        (
          Number(
            base.snapshotEvalMan
          ) || 0
        )
      );
    }

    return null;
  }

  const performanceRowsBeforeV35 =
    window.performanceRows;

  if (
    typeof performanceRowsBeforeV35 !==
    'function'
  ) {
    console.error(
      '[v35] performanceRows is not available'
    );

    return;
  }

  window.performanceRows =
  function () {
    const rows =
      performanceRowsBeforeV35
        .apply(
          this,
          arguments
        );

    const activeYear =
      activeAnnualYearV35Safe();

    const effectiveYear =
      performanceEffectiveYearV35();

    const duration =
      durationYearsV35();

    const annualSource =
      performanceAnnualSourceV35(
        activeYear
      );

    if (
      effectiveYear <= 2026 ||
      !annualSource
    ) {
      return rows.map(
        row => ({
          ...row,

          cagr:
            cagrFromTwrV35(
              row.twr,
              duration
            )
        })
      );
    }

    const carry =
      annualSource
        .carryRows || {};

    const accountBase =
      annualSource
        .accountBaseMan || {};

    const bucketBase =
      annualSource
        .pensionBucketSnapshot
        ?.buckets || {};

    const bucketMetrics =
      typeof window
        .pensionBucketMetricsV33 ===
        'function'
        ? window
            .pensionBucketMetricsV33()
        : null;

    return rows.map(
      row => {
        const prior =
          carry[row.scope];

        if (!prior) {
          return {
            ...row,

            cagr:
              cagrFromTwrV35(
                row.twr,
                duration
              )
          };
        }

        let currentYtd = 0;

        if (
          [
            'DC',
            '연금(1)',
            '연금(2)',
            'ISA',
            '일반계좌',
            '자녀연금'
          ].includes(
            row.scope
          )
        ) {
          const accountMap = {
            DC: 'DC',
            '연금(1)': 'P1',
            '연금(2)': 'P2',
            ISA: 'ISA',
            '일반계좌':
              'GENERAL',
            '자녀연금':
              'CHILD'
          };

          const id =
            accountMap[
              row.scope
            ];

          const value =
            Number(
              accountSummary(
                id
              ).value
            ) || 0;

          const flow =
            annualFlow(
              acct(id),
              String(
                effectiveYear
              )
            );

          currentYtd =
            liveYtdFromBaseV35(
              value,
              Number(
                accountBase[id]
              ) || 0,
              flow
            );
        }

        if (
          [
            'EQUITY',
            'INCOME',
            'HEDGE',
            'PARKING'
          ].includes(
            row.scope
          ) &&
          bucketMetrics
        ) {
          const metric =
            bucketMetrics
              .buckets[
                row.scope
              ];

          const base =
            bucketBase[
              row.scope
            ];

          if (
            metric &&
            base
          ) {
            const valueMan =
              (
                Number(
                  metric.value
                ) || 0
              ) / 10000;

            currentYtd =
              liveYtdFromBaseV35(
                valueMan,
                Number(
                  base
                    .snapshotEvalMan
                ) || 0,
                0
              );
          }
        }

        if (
          row.scope ===
          '연금합산'
        ) {
          const ids = [
            'DC',
            'P1',
            'P2'
          ];

          const value =
            ids.reduce(
              (sum, id) =>
                sum +
                (
                  Number(
                    accountSummary(
                      id
                    ).value
                  ) || 0
                ),
              0
            );

          const base =
            ids.reduce(
              (sum, id) =>
                sum +
                (
                  Number(
                    accountBase[
                      id
                    ]
                  ) || 0
                ),
              0
            );

          const flow =
            ids.reduce(
              (sum, id) =>
                sum +
                (
                  Number(
                    annualFlow(
                      acct(id),
                      String(
                        effectiveYear
                      )
                    )
                  ) || 0
                ),
              0
            );

          currentYtd =
            liveYtdFromBaseV35(
              value,
              base,
              flow
            );
        }

        if (
          row.scope ===
          'Total'
        ) {
          const ids = [
            'DC',
            'P1',
            'P2',
            'ISA',
            'GENERAL',
            'CHILD'
          ];

          const value =
            ids.reduce(
              (sum, id) =>
                sum +
                (
                  Number(
                    accountSummary(
                      id
                    ).value
                  ) || 0
                ),
              0
            );

          const base =
            ids.reduce(
              (sum, id) =>
                sum +
                (
                  Number(
                    accountBase[
                      id
                    ]
                  ) || 0
                ),
              0
            );

          const flow =
            ids.reduce(
              (sum, id) =>
                sum +
                (
                  Number(
                    annualFlow(
                      acct(id),
                      String(
                        effectiveYear
                      )
                    )
                  ) || 0
                ),
              0
            );

          currentYtd =
            liveYtdFromBaseV35(
              value,
              base,
              flow
            );
        }

        const priorTwr =
          Number(
            prior.twr
          ) || 0;

        const twr =
          (
            (
              1 +
              priorTwr / 100
            ) *
            (
              1 +
              currentYtd / 100
            ) -
            1
          ) *
          100;

        return {
          ...row,

          y25:
            Number(
              prior.ytd
            ) || 0,

          y26:
            currentYtd,

          twr,

          cagr:
            cagrFromTwrV35(
              twr,
              duration
            )
        };
      }
    );
  };

  function formatPerformancePercentV35(
    value
  ) {
    const n =
      Number(value);

    if (!Number.isFinite(n)) {
      return 'n/a';
    }

    return (
      `${n > 0 ? '+' : ''}` +
      `${n.toFixed(2)}%`
    );
  }

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

  function applyPerformancePresentationV35() {
  const activeYear =
    activeAnnualYearV35Safe();

  const effectiveYear =
    performanceEffectiveYearV35();

  const annualSource =
    performanceAnnualSourceV35(
      activeYear
    );

  if (
    effectiveYear <= 2026 ||
    !annualSource
  ) {
    return false;
  }

  const table =
    document.querySelector(
      '.v33-performance-table'
    );

  if (!table) {
    return false;
  }

  const performance =
    performanceRows();

  const performanceByScope =
    new Map(
      performance.map(
        row => [
          row.scope,
          row
        ]
      )
    );

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

  const pnlIdx =
    headers.findIndex(
      text =>
        /^\d{2}['’]?손익$/
          .test(
            text.replace(
              /\s+/g,
              ''
            )
          )
    );

  const ytdIndices =
    headers
      .map(
        (text, index) => ({
          text:
            text.replace(
              /\s+/g,
              ''
            ),
          index
        })
      )
      .filter(
        item =>
          /^\d{2}YTD$/
            .test(
              item.text
            )
      )
      .map(
        item =>
          item.index
      );

  const priorYtdIdx =
    ytdIndices.length >= 2
      ? ytdIndices[0]
      : -1;

  const currentYtdIdx =
    ytdIndices.length >= 2
      ? ytdIndices[1]
      : -1;

  if (
    pnlIdx < 0 ||
    priorYtdIdx < 0 ||
    currentYtdIdx < 0
  ) {
    return false;
  }

  headerCells[
    pnlIdx
  ].textContent =
    `${String(
      effectiveYear
    ).slice(-2)}'손익`;

  headerCells[
    priorYtdIdx
  ].textContent =
    `${String(
      effectiveYear - 1
    ).slice(-2)} YTD`;

  headerCells[
    currentYtdIdx
  ].textContent =
    `${String(
      effectiveYear
    ).slice(-2)} YTD`;

  table.querySelectorAll(
    'tbody tr'
  )
    .forEach(
      row => {
        if (
          row.children.length <=
          1
        ) {
          return;
        }

        const scope =
          row.children[0]
            ?.textContent
            ?.trim();

        if (!scope) {
          return;
        }

        const performanceRow =
          performanceByScope.get(
            scope
          );

        if (!performanceRow) {
          return;
        }

        const pnl =
          currentYearPnlManV35(
            scope,
            effectiveYear
          );

        const pnlCell =
          row.children[
            pnlIdx
          ];

        if (
          pnl != null &&
          pnlCell
        ) {
          pnlCell.textContent =
            formatManV35(
              pnl
            );

          pnlCell.classList.toggle(
            'v33-performance-negative',
            pnl < 0
          );
        }

        const priorYtd =
          Number(
            performanceRow.y25
          );

        const currentYtd =
          Number(
            performanceRow.y26
          );

        const priorCell =
          row.children[
            priorYtdIdx
          ];

        const currentCell =
          row.children[
            currentYtdIdx
          ];

        if (
          priorCell &&
          Number.isFinite(
            priorYtd
          )
        ) {
          priorCell.textContent =
            formatPerformancePercentV35(
              priorYtd
            );

          priorCell.classList.toggle(
            'v33-performance-negative',
            priorYtd < 0
          );
        }

        if (
          currentCell &&
          Number.isFinite(
            currentYtd
          )
        ) {
          currentCell.textContent =
            formatPerformancePercentV35(
              currentYtd
            );

          currentCell.classList.toggle(
            'v33-performance-negative',
            currentYtd < 0
          );
        }
      }
    );

  return true;
}

  window.applyPerformancePresentationV35 =
    applyPerformancePresentationV35;

  window.performanceDurationV35 =
    function () {
      const now =
        new Date();

      return {
        year:
          now.getFullYear(),

        week:
          isoWeekV35(
            now
          ),

        durationYears:
          durationYearsV35()
      };
    };

  window.setPerformanceRolloverPreviewV35 =
    function (preview) {
      if (
        !preview ||
        Number(
          preview.fromYear
        ) !== 2026 ||
        Number(
          preview.toYear
        ) !== 2027
      ) {
        throw new Error(
          '[v35] invalid Performance rollover preview'
        );
      }

      rolloverPreviewV35 =
        JSON.parse(
          JSON.stringify(
            preview
          )
        );

      return true;
    };

  window.clearPerformanceRolloverPreviewV35 =
    function () {
      rolloverPreviewV35 =
        null;

      return true;
    };

  window.getPerformanceRolloverPreviewV35 =
    function () {
      return rolloverPreviewV35;
    };

  function installPerformanceObserverV35() {
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

            applyPerformancePresentationV35();
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
      installPerformanceObserverV35,
      {
        once: true
      }
    );
  } else {
    installPerformanceObserverV35();
  } 
})();