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

  function cashlikeEffectiveYearV35() {
    const businessYear =
      businessYearV35Safe();

    if (
      cashlikePreviewV35 &&
      Number(
        cashlikePreviewV35.toYear
      ) === businessYear
    ) {
      return businessYear;
    }

    return activeAnnualYearV35Safe();
  }

  function cashlikeUsesPreviewV35() {
    const businessYear =
      businessYearV35Safe();

    return !!(
      cashlikePreviewV35 &&
      Number(
        cashlikePreviewV35.toYear
      ) === businessYear
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
    if (
      field !== 'nextBase' &&
      field !== 'nextFlow'
    ) {
      throw new Error(
        '[v35] invalid cash-like field'
      );
    }

    const year =
      cashlikeEffectiveYearV35();

    if (year <= 2026) {
      return false;
    }

    const numeric =
      Number(value) || 0;

    if (
      cashlikeUsesPreviewV35()
    ) {
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
        numeric;

      return true;
    }

    const item =
      Array.isArray(
        data.cashAssets
      )
        ? data.cashAssets.find(
            asset =>
              asset &&
              asset.id === id
          )
        : null;

    if (!item) {
      return false;
    }

    const key =
      field === 'nextBase'
        ? 'base' +
          String(year)
        : 'flow' +
          String(year);

    item[key] =
      numeric;

    return true;
  };

  window.cashlikeFutureMetricsV35 =
  function () {
    const year =
      cashlikeEffectiveYearV35();

    if (year <= 2026) {
      return null;
    }

    if (
      cashlikeUsesPreviewV35()
    ) {
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
    }

    if (
      !Array.isArray(
        data.cashAssets
      )
    ) {
      return null;
    }

    const baseKey =
      'base' +
      String(year);

    const flowKey =
      'flow' +
      String(year);

    return data.cashAssets.map(
      item => {
        const nextBase =
          Number(
            item[baseKey]
          ) || 0;

        const nextFlow =
          Number(
            item[flowKey]
          ) || 0;

        const balance =
          Number(
            item.balance
          ) || 0;

        return {
          id:
            item.id,

          name:
            item.name,

          nextBase,

          nextFlow,

          balance,

          cumProfit:
            Number(
              item.cumProfit
            ) || 0,

          pnl:
            balance -
            nextBase -
            nextFlow
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

  function addCashlikeItemV35() {
  const year =
    cashlikeEffectiveYearV35();

  if (
    year <= 2026 ||
    cashlikeUsesPreviewV35()
  ) {
    return false;
  }

  if (
    !Array.isArray(
      data.cashAssets
    )
  ) {
    return false;
  }

  const item = {
    id:
      'cash' +
      Date.now(),

    name: '',
    category: '',
    balance: 0,
    ytdProfit: 0,
    cumProfit: 0,
    rate: 0,
    maturity: ''
  };

  item[
    'base' +
    String(year)
  ] = 0;

  item[
    'flow' +
    String(year)
  ] = 0;

  data.cashAssets.push(
    item
  );

  render();

  return true;
}

  function applyCashlikePresentationV35() {
  const year =
    cashlikeEffectiveYearV35();

  if (year <= 2026) {
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
          headers.some(
            text =>
              /기준액$/.test(
                text
              )
          ) &&
          headers.includes(
            '입출금'
          ) &&
          headers.includes(
            '평가액'
          ) &&
          headers.some(
            text =>
              /손익$/.test(
                text
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

  //
  // Base cashView()의 신규항목 버튼은
  // base2026/flow2026을 생성하므로
  // actual 2027+에서는 v35 handler로 교체.
  //
  if (
    !cashlikeUsesPreviewV35()
  ) {
    const buttons =
      Array.from(
        document.querySelectorAll(
          '#content button'
        )
      );

    const addButton =
      buttons.find(
        button =>
          button.textContent
            .trim() ===
          '+ 항목'
      );

    if (addButton) {
      addButton.onclick =
        function () {
          addCashlikeItemV35();
        };
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