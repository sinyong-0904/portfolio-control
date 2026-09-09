//
// Portfolio Control v3.5
// Cash-like annual rollover simulation.
// DEV-only, memory-only.
//

(function () {
  let cashlikePreviewV35 =
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

  window.buildCashlikeRolloverPreviewV35 =
    function (
      fromYear,
      toYear
    ) {
      const from =
        Number(fromYear);

      const to =
        Number(toYear);

      if (
        !Number.isInteger(from) ||
        !Number.isInteger(to) ||
        to !== from + 1
      ) {
        throw new Error(
          '[v35] cash-like rollover years must be consecutive'
        );
      }

      if (
        !Array.isArray(
          data.cashAssets
        )
      ) {
        throw new Error(
          '[v35] cashAssets is not available'
        );
      }

      return {
        version: 1,

        fromYear:
          from,

        toYear:
          to,

        rows:
          data.cashAssets.map(
            item => ({
              id:
                item.id,

              name:
                item.name,

              priorBase:
                Number(
                  item[
                    `base${from}`
                  ]
                ) || 0,

              priorFlow:
                Number(
                  item[
                    `flow${from}`
                  ]
                ) || 0,

              nextBase:
                Number(
                  item.balance
                ) || 0,

              nextFlow:
                0,

              balance:
                Number(
                  item.balance
                ) || 0,

              cumProfit:
                Number(
                  item.cumProfit
                ) || 0
            })
          )
      };
    };

  window.setCashlikeRolloverPreviewV35 =
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
          '[v35] invalid cash-like rollover preview'
        );
      }

      cashlikePreviewV35 =
        cloneV35(
          preview
        );

      return true;
    };

  window.clearCashlikeRolloverPreviewV35 =
    function () {
      cashlikePreviewV35 =
        null;

      return true;
    };

  window.getCashlikeRolloverPreviewV35 =
    function () {
      return cashlikePreviewV35;
    };

      window.updateCashlikePreviewV35 =
    function (
      id,
      field,
      value
    ) {
      if (!cashlikePreviewV35) {
        return false;
      }

      if (
        field !== 'nextBase' &&
        field !== 'nextFlow'
      ) {
        throw new Error(
          '[v35] invalid cash-like preview field'
        );
      }

      const row =
        cashlikePreviewV35
          .rows
          .find(
            item =>
              item.id === id
          );

      if (!row) {
        return false;
      }

      row[field] =
        Number(value) || 0;

      return true;
    };

  window.cashlikeFutureMetricsV35 =
    function () {
      const year =
        businessYearV35Safe();

      if (
        year <= 2026 ||
        !cashlikePreviewV35
      ) {
        return null;
      }

      return cashlikePreviewV35
        .rows
        .map(
          row => {
            const pnl =
              Number(
                row.balance
              ) -
              Number(
                row.nextBase
              ) -
              Number(
                row.nextFlow
              );

            return {
              ...row,
              pnl
            };
          }
        );
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

    function applyCashlikePresentationV35() {
    const year =
      businessYearV35Safe();

    if (
      year <= 2026 ||
      !cashlikePreviewV35
    ) {
      return false;
    }

    const metrics =
      window
        .cashlikeFutureMetricsV35();

    if (!metrics) {
      return false;
    }

    const tables =
      Array.from(
        document.querySelectorAll(
          '#content table'
        )
      );

    const table =
      tables.find(
        candidate => {
          const headers =
            Array.from(
              candidate.querySelectorAll(
                'thead th'
              )
            )
              .map(
                th =>
                  th.textContent
                    .trim()
              );

          return (
            (
              headers.includes(
                '26 기준액'
              ) ||
              headers.includes(
                '27 기준액'
              )
            ) &&
            headers.includes(
              '입출금'
            ) &&
            headers.includes(
              '평가액'
            ) &&
            (
              headers.includes(
                '26 손익'
              ) ||
              headers.includes(
                '27 손익'
              )
            )
          );
        }
      );

    if (!table) {
      return false;
    }

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

    const baseIdx =
      headers.findIndex(
        text =>
          /기준액$/.test(
            text
          )
      );

    const flowIdx =
      headers.indexOf(
        '입출금'
      );

    const pnlIdx =
      headers.findIndex(
        text =>
          /손익$/.test(
            text
          )
      );

    if (
      baseIdx < 0 ||
      flowIdx < 0 ||
      pnlIdx < 0
    ) {
      return false;
    }

    headerCells[
      baseIdx
    ].textContent =
      `${String(year)
        .slice(-2)} 기준액`;

    headerCells[
      pnlIdx
    ].textContent =
      `${String(year)
        .slice(-2)} 손익`;

    const byId =
      Object.fromEntries(
        metrics.map(
          row => [
            row.id,
            row
          ]
        )
      );

    table.querySelectorAll(
      'tbody tr'
    )
      .forEach(
        (row, index) => {
          const source =
            data.cashAssets[
              index
            ];

          const metric =
            source
              ? byId[
                  source.id
                ]
              : null;

          if (!metric) {
            return;
          }

          const baseInput =
            row.children[
              baseIdx
            ]
              ?.querySelector(
                'input'
              );

          const flowInput =
            row.children[
              flowIdx
            ]
              ?.querySelector(
                'input'
              );

          const pnlCell =
            row.children[
              pnlIdx
            ];

          if (baseInput) {
            if (
              document.activeElement !==
              baseInput
            ) {
              baseInput.value =
                metric.nextBase;
            }

            baseInput.disabled =
              false;

            baseInput.onchange =
              function () {
                window
                  .updateCashlikePreviewV35(
                    metric.id,
                    'nextBase',
                    this.value
                  );

                applyCashlikePresentationV35();
              };
          }

          if (flowInput) {
            if (
              document.activeElement !==
              flowInput
            ) {
              flowInput.value =
                metric.nextFlow;
            }

            flowInput.disabled =
              false;

            flowInput.onchange =
              function () {
                window
                  .updateCashlikePreviewV35(
                    metric.id,
                    'nextFlow',
                    this.value
                  );

                applyCashlikePresentationV35();
              };
          }

          if (pnlCell) {
            pnlCell.textContent =
              formatManV35(
                metric.pnl
              );
          }
        }
      );

    //
    // 상단 Cash KPI의 당해연도 손익.
    //
    const totalPnl =
      metrics.reduce(
        (sum, row) =>
          sum +
          (
            Number(
              row.pnl
            ) || 0
          ),
        0
      );

    const cards =
      Array.from(
        document.querySelectorAll(
          '#content .grid .card'
        )
      );

    const pnlCard =
      cards.find(
        card => {
          const label =
            card.querySelector(
              '.label'
            );

          return (
            label &&
            /손익$/.test(
              label.textContent
                .trim()
            )
          );
        }
      );

    if (pnlCard) {
      const label =
        pnlCard.querySelector(
          '.label'
        );

      const metric =
        pnlCard.querySelector(
          '.metric'
        );

      if (label) {
        label.textContent =
          `${String(year)
            .slice(-2)}' 손익`;
      }

      if (metric) {
        metric.textContent =
          formatManV35(
            totalPnl
          );
      }
    }

    return true;
  }

  window.applyCashlikePresentationV35 =
    applyCashlikePresentationV35;

  function installCashlikeObserverV35() {
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

            applyCashlikePresentationV35();
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
      installCashlikeObserverV35,
      {
        once: true
      }
    );
  } else {
    installCashlikeObserverV35();
  }
})();