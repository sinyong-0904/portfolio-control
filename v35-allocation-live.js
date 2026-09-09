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
      const businessYear =
        businessYearV35Safe();

      if (
        businessYear <= 2026 ||
        !allocationPreviewV35
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

      const snapshot =
        allocationPreviewV35
          .pensionSnapshot;

      const result = {
        businessYear,
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
    const businessYear =
      businessYearV35Safe();

    if (
      businessYear <= 2026 ||
      !allocationPreviewV35
    ) {
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

        const pnlIdx =
          headers.indexOf(
            '26 손익'
          );

        const ytdIdx =
          headers.indexOf(
            'YTD 26'
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
            businessYear
          ).slice(-2)} 손익`;

        headerCells[
          ytdIdx
        ].textContent =
          `YTD ${String(
            businessYear
          ).slice(-2)}`;

        table.querySelectorAll(
          'tbody tr'
        )
          .forEach(
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