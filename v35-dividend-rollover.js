//
// Portfolio Control v3.5
// Dividend annual rollover simulation.
// Closed-year archive is handled by History Snapshot.
// DEV-only, memory-only.
//

(function () {
  let dividendPreviewV35 =
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

  function dividendEffectiveYearV35() {
    const businessYear =
      businessYearV35Safe();

    if (
      dividendPreviewV35 &&
      Number(
        dividendPreviewV35.toYear
      ) === businessYear
    ) {
      return businessYear;
    }

    return activeAnnualYearV35Safe();
  }

  function dividendMatrixV35() {
    const businessYear =
      businessYearV35Safe();

    if (
      dividendPreviewV35 &&
      Number(
        dividendPreviewV35.toYear
      ) === businessYear
    ) {
      return dividendPreviewV35
        .nextDividends;
    }

    const activeYear =
      activeAnnualYearV35Safe();

    if (activeYear <= 2026) {
      return null;
    }

    return (
      data &&
      data.dividends
        ? data.dividends
        : null
    );
  }

  function cloneV35(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function zeroDividendMatrixV35() {
    const matrix = {};

    data.months.forEach(
      month => {
        matrix[month] = {};

        data.dividendAccounts
          .forEach(
            account => {
              matrix[month][account] =
                0;
            }
          );
      }
    );

    return matrix;
  }

  window.buildDividendRolloverPreviewV35 =
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
          '[v35] dividend rollover years must be consecutive'
        );
      }

      return {
        version: 1,

        fromYear:
          from,

        toYear:
          to,

        priorDividends:
          cloneV35(
            data.dividends
          ),

        nextDividends:
          zeroDividendMatrixV35()
      };
    };

  window.setDividendRolloverPreviewV35 =
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
          '[v35] invalid dividend rollover preview'
        );
      }

      dividendPreviewV35 =
        cloneV35(
          preview
        );

      return true;
    };

  window.clearDividendRolloverPreviewV35 =
    function () {
      dividendPreviewV35 =
        null;

      return true;
    };

  window.getDividendRolloverPreviewV35 =
    function () {
      return dividendPreviewV35;
    };

  window.updateDividendPreviewV35 =
    function (
      month,
      account,
      value
    ) {
      if (!dividendPreviewV35) {
        return false;
      }

      if (
        !data.months.includes(
          month
        ) ||
        !data.dividendAccounts
          .includes(
            account
          )
      ) {
        throw new Error(
          '[v35] invalid dividend cell'
        );
      }

      dividendPreviewV35
        .nextDividends[
          month
        ][account] =
          Number(value) || 0;

      return true;
    };

  window.dividendFutureTotalV35 =
  function () {
    const year =
      dividendEffectiveYearV35();

    const matrix =
      dividendMatrixV35();

    if (
      year <= 2026 ||
      !matrix
    ) {
      return null;
    }

    let total = 0;

    data.months.forEach(
      month => {
        data.dividendAccounts
          .forEach(
            account => {
              total +=
                Number(
                  matrix[
                    month
                  ]?.[
                    account
                  ]
                ) || 0;
            }
          );
      }
    );

    return total;
  };

  function applyDividendPresentationV35() {
  const year =
    dividendEffectiveYearV35();

  const matrix =
    dividendMatrixV35();

  if (
    year <= 2026 ||
    !matrix
  ) {
    return false;
  }

  const content =
    document.getElementById(
      'content'
    );

  if (!content) {
    return false;
  }

  const heading =
    Array.from(
      content.querySelectorAll(
        'h2'
      )
    ).find(
      h2 =>
        /배당금 현황$/.test(
          h2.textContent
            .trim()
        )
    );

  if (heading) {
    heading.textContent =
      `${year} 배당금 현황`;
  }

  const table =
    Array.from(
      content.querySelectorAll(
        'table'
      )
    ).find(
      candidate => {
        const headers =
          Array.from(
            candidate.querySelectorAll(
              'thead th'
            )
          ).map(
            th =>
              th.textContent
                .trim()
          );

        return (
          headers[0] === '월' &&
          headers.includes('DC') &&
          headers.includes('삼전우') &&
          headers.includes('합계')
        );
      }
    );

  if (!table) {
    return false;
  }

  const bodyRows =
    Array.from(
      table.querySelectorAll(
        'tbody tr'
      )
    );

  const monthRows =
    bodyRows.slice(
      0,
      data.months.length
    );

  const accountTotals =
    Object.fromEntries(
      data.dividendAccounts.map(
        account => [
          account,
          0
        ]
      )
    );

  let grandTotal = 0;

  monthRows.forEach(
    (row, monthIndex) => {
      const month =
        data.months[
          monthIndex
        ];

      let monthTotal = 0;

      data.dividendAccounts
        .forEach(
          (
            account,
            accountIndex
          ) => {
            const value =
              Number(
                matrix[
                  month
                ]?.[
                  account
                ]
              ) || 0;

            monthTotal +=
              value;

            accountTotals[
              account
            ] += value;

            const cell =
              row.children[
                accountIndex + 1
              ];

            const input =
              cell?.querySelector(
                'input'
              );

            if (!input) {
              return;
            }

            if (
              document.activeElement !==
              input
            ) {
              input.value =
                value;
            }

            //
            // DEV preview에서는
            // memory-only preview writer.
            //
            if (
              dividendPreviewV35 &&
              Number(
                dividendPreviewV35
                  .toYear
              ) ===
                businessYearV35Safe()
            ) {
              input.onchange =
                function () {
                  window
                    .updateDividendPreviewV35(
                      month,
                      account,
                      this.value
                    );

                  applyDividendPresentationV35();
                };
            } else {
              //
              // Actual persistent year에서는
              // base dividendView와 동일한
              // authoritative data.dividends
              // matrix에 직접 기록.
              //
              input.onchange =
                function () {
                  data.dividends[
                    month
                  ][
                    account
                  ] =
                    Number(
                      this.value
                    ) || 0;

                  applyDividendPresentationV35();
                };
            }
          }
        );

      grandTotal +=
        monthTotal;

      const totalCell =
        row.children[
          data
            .dividendAccounts
            .length + 1
        ];

      if (totalCell) {
        totalCell.textContent =
          won(
            monthTotal
          );
      }
    }
  );

  const totalRow =
    bodyRows[
      data.months.length
    ];

  if (totalRow) {
    data.dividendAccounts
      .forEach(
        (
          account,
          accountIndex
        ) => {
          const cell =
            totalRow.children[
              accountIndex + 1
            ];

          if (cell) {
            cell.textContent =
              won(
                accountTotals[
                  account
                ]
              );
          }
        }
      );

    const grandCell =
      totalRow.children[
        data
          .dividendAccounts
          .length + 1
      ];

    if (grandCell) {
      grandCell.textContent =
        won(
          grandTotal
        );
    }
  }

  const tables =
    Array.from(
      content.querySelectorAll(
        'table'
      )
    );

  const summaryTable =
    tables.find(
      candidate =>
        candidate !== table &&
        candidate
          .textContent
          .includes(
            '총합'
          )
    );

  if (summaryTable) {
    const cells =
      Array.from(
        summaryTable.querySelectorAll(
          'tbody td'
        )
      );

    const values = [
      ...data.dividendAccounts
        .map(
          account =>
            accountTotals[
              account
            ]
        ),
      grandTotal
    ];

    values.forEach(
      (value, index) => {
        const cell =
          cells[index];

        if (cell) {
          cell.textContent =
            won(value);
        }
      }
    );
  }

  return true;
}

  window.applyDividendPresentationV35 =
    applyDividendPresentationV35;

  function installDividendObserverV35() {
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

            applyDividendPresentationV35();
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
      installDividendObserverV35,
      {
        once: true
      }
    );
  } else {
    installDividendObserverV35();
  }
})();