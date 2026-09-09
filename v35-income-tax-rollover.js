//
// Portfolio Control v3.5
// Income & Tax annual row simulation.
// DEV-only, memory-only.
//

(function () {
  let incomeTaxPreviewV35 =
    null;

  const finalizedYearsV35 =
    {};

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

  function emptyIncomeTaxRowV35(
    year
  ) {
    return {
      year:
        Number(year),

      salary:
        null,

      tax:
        null,

      deduction:
        null,

      net:
        null,

      withheld:
        null,

      change:
        null,

      taxRate:
        null,

      finalTax:
        null
    };
  }

  window.buildIncomeTaxRolloverPreviewV35 =
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
          '[v35] income-tax rollover years must be consecutive'
        );
      }

      const existing =
        data.incomeTaxHistory
          ?.rows
          ?.find(
            row =>
              Number(
                row.year
              ) === to
          );

      return {
        version: 1,

        fromYear:
          from,

        toYear:
          to,

        row:
          existing
            ? cloneV35(
                existing
              )
            : emptyIncomeTaxRowV35(
                to
              ),

        note:
          String(
            data
              .incomeTaxHistory
              ?.notes
              ?.[to] ??
            ''
          )
      };
    };

  window.setIncomeTaxRolloverPreviewV35 =
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
          '[v35] invalid income-tax rollover preview'
        );
      }

      incomeTaxPreviewV35 =
        cloneV35(
          preview
        );

      return true;
    };

  window.clearIncomeTaxRolloverPreviewV35 =
    function () {
      incomeTaxPreviewV35 =
        null;

      return true;
    };

  window.getIncomeTaxRolloverPreviewV35 =
    function () {
      return incomeTaxPreviewV35;
    };

  window.updateIncomeTaxPreviewV35 =
    function (
      key,
      value
    ) {
      if (!incomeTaxPreviewV35) {
        return false;
      }

      const allowed = [
        'salary',
        'tax',
        'deduction',
        'net',
        'withheld',
        'change',
        'taxRate',
        'finalTax'
      ];

      if (
        !allowed.includes(
          key
        )
      ) {
        throw new Error(
          '[v35] invalid income-tax field'
        );
      }

      const raw =
        String(
          value ?? ''
        ).trim();

      incomeTaxPreviewV35
        .row[key] =
          raw === ''
            ? null
            : Number(raw);

      return true;
    };

  window.updateIncomeTaxNotePreviewV35 =
    function (value) {
      if (!incomeTaxPreviewV35) {
        return false;
      }

      incomeTaxPreviewV35.note =
        String(
          value ?? ''
        );

      return true;
    };

  window.incomeTaxFutureRowV35 =
    function () {
      if (
        businessYearV35Safe() <=
          2026 ||
        !incomeTaxPreviewV35
      ) {
        return null;
      }

      return cloneV35(
        incomeTaxPreviewV35
      );
    };

      window.setIncomeTaxFinalizedV35 =
    function (
      year,
      finalized
    ) {
      finalizedYearsV35[
        String(year)
      ] =
        !!finalized;

      return true;
    };

  window.isIncomeTaxFinalizedV35 =
    function (year) {
      return (
        finalizedYearsV35[
          String(year)
        ] === true
      );
    };

      const INCOME_FIELDS_V35 = [
    'salary',
    'tax',
    'deduction',
    'net',
    'withheld',
    'change',
    'taxRate',
    'finalTax'
  ];

  function findIncomeTableV35() {
    return Array.from(
      document.querySelectorAll(
        '#content table'
      )
    ).find(
      table => {
        const headers =
          Array.from(
            table.querySelectorAll(
              'thead th'
            )
          ).map(
            th =>
              th.textContent
                .trim()
          );

        return (
          headers.join('|') ===
          '연도|급여계|세액|일반공제|실지급액|원천징수액|변동률|세율|세액'
        );
      }
    );
  }

  function inputV35(
    value,
    onChange
  ) {
    const input =
      document.createElement(
        'input'
      );

    input.className =
      'v33-history-input';

    input.type =
      'number';

    input.step =
      '0.01';

    input.value =
      value == null
        ? ''
        : value;

    input.onchange =
      onChange;

    return input;
  }

  function applyIncomeTaxPresentationV35() {
    const year =
      businessYearV35Safe();

    if (
      year <= 2026 ||
      !incomeTaxPreviewV35
    ) {
      return false;
    }

    const table =
      findIncomeTableV35();

    if (!table) {
      return false;
    }

    const tbody =
      table.querySelector(
        'tbody'
      );

    if (!tbody) {
      return false;
    }

    //
    // 2026은 기존 renderer가 만든 editable row를
    // 그대로 유지한다.
    //
    const priorYear =
      year - 1;

    const priorRow =
      Array.from(
        tbody.querySelectorAll(
          'tr'
        )
      ).find(
        row =>
          row.children[0]
            ?.textContent
            ?.trim() ===
          String(priorYear)
      );

    const priorSource =
      data.incomeTaxHistory
        .rows
        .find(
          row =>
            Number(
              row.year
            ) ===
            priorYear
        );

    const priorFinalized =
      window
        .isIncomeTaxFinalizedV35(
          priorYear
        );

    if (
      priorRow &&
      priorSource
    ) {
      INCOME_FIELDS_V35
        .forEach(
          (
            key,
            index
          ) => {
            const cell =
              priorRow.children[
                index + 1
              ];

            if (!cell) {
              return;
            }

            if (
              priorFinalized
            ) {
              const value =
                priorSource[
                  key
                ];

              cell.textContent =
                value == null
                  ? ''
                  : (
                      key ===
                        'change' ||
                      key ===
                        'taxRate'
                    )
                    ? `${Number(
                        value
                      ).toFixed(
                        2
                      )}%`
                    : Number(
                        value
                      ).toLocaleString(
                        'ko-KR'
                      );

              return;
            }

            const existingInput =
              cell.querySelector(
                'input'
              );

            if (existingInput) {
              return;
            }

            cell.textContent =
              '';

            cell.appendChild(
              inputV35(
                priorSource[
                  key
                ],
                function () {
                  historyIncomeChangeV33(
                    priorYear,
                    key,
                    this.value
                  );
                }
              )
            );
          }
        );
    }

    //
    // 현재 business year row는 memory-only.
    //
    let currentRow =
      Array.from(
        tbody.querySelectorAll(
          'tr'
        )
      ).find(
        row =>
          row.children[0]
            ?.textContent
            ?.trim() ===
          String(year)
      );

    if (!currentRow) {
      currentRow =
        document.createElement(
          'tr'
        );

      const yearCell =
        document.createElement(
          'td'
        );

      const bold =
        document.createElement(
          'b'
        );

      bold.textContent =
        year;

      yearCell.appendChild(
        bold
      );

      currentRow.appendChild(
        yearCell
      );

      INCOME_FIELDS_V35
        .forEach(
          key => {
            const cell =
              document.createElement(
                'td'
              );

            const value =
              incomeTaxPreviewV35
                .row[key];

            cell.appendChild(
              inputV35(
                value,
                function () {
  window
    .updateIncomeTaxPreviewV35(
      key,
      this.value
    );

  applyIncomeTaxPresentationV35();
}
                
              )
            );

            currentRow.appendChild(
              cell
            );
          }
        );

      const sumRow =
        Array.from(
          tbody.querySelectorAll(
            'tr'
          )
        ).find(
          row =>
            row.children[0]
              ?.textContent
              ?.trim() ===
            'Sum'
        );

      if (sumRow) {
        tbody.insertBefore(
          currentRow,
          sumRow
        );
      } else {
        tbody.appendChild(
          currentRow
        );
      }
    }

        //
    // 기존 2008~2026 실제 rows +
    // 현재 business year memory preview를
    // 동일한 Sum semantics로 집계한다.
    //
    const sumRow =
      Array.from(
        tbody.querySelectorAll(
          'tr'
        )
      ).find(
        row =>
          row.children[0]
            ?.textContent
            ?.trim() ===
          'Sum'
      );

    if (sumRow) {
      const rowsForSum = [
        ...data
          .incomeTaxHistory
          .rows,

        incomeTaxPreviewV35
          .row
      ];

      const sumField =
        function (key) {
          return rowsForSum
            .reduce(
              (sum, row) =>
                sum +
                (
                  Number(
                    row[key]
                  ) || 0
                ),
              0
            );
        };

      const salarySum =
        sumField(
          'salary'
        );

      const taxSum =
        sumField(
          'tax'
        );

      const deductionSum =
        sumField(
          'deduction'
        );

      const netSum =
        sumField(
          'net'
        );

      const withheldSum =
        sumField(
          'withheld'
        );

      const finalTaxSum =
        sumField(
          'finalTax'
        );

      const taxRate =
        withheldSum
          ? (
              finalTaxSum /
              withheldSum *
              100
            )
          : null;

      const values = [
        null,
        salarySum,
        taxSum,
        deductionSum,
        netSum,
        withheldSum,
        'n/a',
        taxRate == null
          ? 'n/a'
          : `${taxRate.toFixed(
              2
            )}%`,
        finalTaxSum
      ];

      values.forEach(
        (value, index) => {
          if (
            index === 0
          ) {
            return;
          }

          const cell =
            sumRow.children[
              index
            ];

          if (!cell) {
            return;
          }

          if (
            index === 6 ||
            index === 7
          ) {
            cell.textContent =
              value;

            return;
          }

          cell.textContent =
            Number(value)
              .toLocaleString(
                'ko-KR'
              );
        }
      );
    }

        let lifecycle =
      document.getElementById(
        'v35-income-tax-lifecycle'
      );

    if (!lifecycle) {
      lifecycle =
        document.createElement(
          'div'
        );

      lifecycle.id =
        'v35-income-tax-lifecycle';

      lifecycle.style.display =
        'flex';

      lifecycle.style.alignItems =
        'center';

      lifecycle.style.gap =
        '10px';

      lifecycle.style.margin =
        '8px 0 12px 0';

      lifecycle.style.paddingLeft =
        '4px';

      lifecycle.style.overflow =
        'visible';

      const status =
        document.createElement(
          'span'
        );

      status.className =
        'v35-income-tax-status';

      status.style.fontSize =
        '14px';

      status.style.lineHeight =
        '1.4';

      status.style.whiteSpace =
        'nowrap';

      lifecycle.appendChild(
        status
      );

      const button =
        document.createElement(
          'button'
        );

      button.className =
        'btn v35-income-tax-finalize';

      button.type =
        'button';

      button.onclick =
        function () {
          const next =
            !window
              .isIncomeTaxFinalizedV35(
                priorYear
              );

          if (next) {
            const ok =
              confirm(
                `${priorYear} Income & Tax를 확정하시겠습니까?\n\n` +
                '확정하면 해당 연도는 일반 화면에서 수정할 수 없습니다.'
              );

            if (!ok) {
              return;
            }
          }

          window
            .setIncomeTaxFinalizedV35(
              priorYear,
              next
            );

          applyIncomeTaxPresentationV35();
        };

      lifecycle.appendChild(
        button
      );

      table.parentNode
        .insertBefore(
          lifecycle,
          table
        );
    }

    const status =
      lifecycle.querySelector(
        '.v35-income-tax-status'
      );

    const button =
      lifecycle.querySelector(
        '.v35-income-tax-finalize'
      );

    if (status) {
      const nextStatus =
        priorFinalized
          ? `${priorYear} 확정됨`
          : `${priorYear} 미확정`;

      if (
        status.textContent !==
        nextStatus
      ) {
        status.textContent =
          nextStatus;
      }
    }

    if (button) {
      const nextLabel =
        priorFinalized
          ? '확정 해제'
          : `${priorYear} 확정`;

      if (
        button.textContent !==
        nextLabel
      ) {
        button.textContent =
          nextLabel;
      }
    }

    return true;
  }

  window.applyIncomeTaxPresentationV35 =
    applyIncomeTaxPresentationV35;

  function installIncomeTaxObserverV35() {
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

            applyIncomeTaxPresentationV35();
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
      installIncomeTaxObserverV35,
      {
        once: true
      }
    );
  } else {
    installIncomeTaxObserverV35();
  }
})();