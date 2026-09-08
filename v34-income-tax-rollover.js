// Portfolio Control v3.4
// Income & Tax simple annual rollover / finalization.
//
// Rules:
// - Add the current-year row automatically if missing.
// - Years <= finalizedThrough are fixed.
// - Later years remain editable.
// - User explicitly finalizes an unfinished prior year.
// - Uses the existing portfolio_state / save() path.
// - No separate Supabase table.

(function () {
  'use strict';

  function currentYearV34() {
    return new Date().getFullYear();
  }

  function historyV34() {
    if (
      !data.incomeTaxHistory ||
      typeof data.incomeTaxHistory !== 'object'
    ) {
      data.incomeTaxHistory = {};
    }

    if (
      !Array.isArray(
        data.incomeTaxHistory.rows
      )
    ) {
      data.incomeTaxHistory.rows = [];
    }

    return data.incomeTaxHistory;
  }

  function ensureIncomeTaxRolloverV34() {
    const h = historyV34();
    const rows = h.rows;
    let changed = false;

    const year = currentYearV34();

    //
    // Existing data migration:
    // before this feature, only the latest row was editable.
    //
    // Therefore initialize finalizedThrough to the year
    // immediately before the latest existing row.
    //
    //
    // Existing data migration:
    // before this feature, only the latest row was editable.
    //
    // Therefore initialize finalizedThrough to the year
    // immediately before the latest existing row.
    //
    const finalizedThrough =
      Number(
        h.finalizedThrough
      );

    const existingYears =
      rows
        .map(
          r => Number(r.year)
        )
        .filter(
          Number.isFinite
        );

    const earliestExisting =
      existingYears.length
        ? Math.min(
            ...existingYears
          )
        : year;

    if (
      !Number.isInteger(
        finalizedThrough
      ) ||
      finalizedThrough <
        earliestExisting
    ) {
      const latestExisting =
        existingYears.length
          ? Math.max(
              ...existingYears
            )
          : year;

      h.finalizedThrough =
        Math.min(
          latestExisting - 1,
          year - 1
        );

      changed = true;
    }

    //
    // Add current-year row if missing.
    //
    if (
      !rows.some(
        r =>
          Number(r.year) === year
      )
    ) {
      rows.push({
        year,
        salary: null,
        tax: null,
        deduction: null,
        net: null,
        withheld: null,
        change: null,
        taxRate: null,
        finalTax: null
      });

      rows.sort(
        (a, b) =>
          Number(a.year) -
          Number(b.year)
      );

      changed = true;
    }

    if (changed) {
      save();
    }

    return changed;
  }

  function isEditableIncomeTaxYearV34(
    year
  ) {
    const h = historyV34();

    return (
      Number(year) >
      Number(
        h.finalizedThrough ??
        0
      )
    );
  }

  function nextFinalizableYearV34() {
    const h = historyV34();

    return h.rows
      .map(r => Number(r.year))
      .filter(
        year =>
          Number.isFinite(year) &&
          year >
            Number(
              h.finalizedThrough ??
              0
            ) &&
          year <
            currentYearV34()
      )
      .sort(
        (a, b) => a - b
      )[0] ?? null;
  }

  window.finalizeIncomeTaxYearV34 =
    function (year) {
      const h = historyV34();
      const target = Number(year);
      const next =
        nextFinalizableYearV34();

      if (
        !Number.isInteger(target) ||
        target !== next
      ) {
        alert(
          '확정 가능한 가장 오래된 미확정 연도부터 순서대로 확정해야 합니다.'
        );

        return;
      }

      const ok =
        confirm(
          `${target}년 Income & Tax 값을 확정하시겠습니까?\n\n` +
          '확정 후 이 연도는 일반 화면에서 수정할 수 없습니다.'
        );

      if (!ok) {
        return;
      }

      h.finalizedThrough =
        target;

      save();

      if (
        typeof render === 'function'
      ) {
        render();
      }
    };

  function enhanceIncomeTaxV34() {
    const table =
      document.querySelector(
        '#content table.v33-income-tax'
      );

    if (!table) {
      return;
    }

    const rows =
      historyV34().rows;

    const bodyRows =
      Array.from(
        table.querySelectorAll(
          'tbody tr'
        )
      )
        .filter(
          tr =>
            !tr.classList.contains(
              'v33-history-total'
            )
        );

    bodyRows.forEach(
      (tr, index) => {
        const row =
          rows[index];

        if (!row) {
          return;
        }

        const year =
          Number(row.year);

        const cells =
          Array.from(
            tr.children
          );

        if (!cells.length) {
          return;
        }

        const editable =
          isEditableIncomeTaxYearV34(
            year
          );

        //
        // v33 renderer only makes the latest year editable.
        // For an unfinished prior year, convert its displayed
        // cells into the existing v33 input contract.
        //
        if (editable) {
          const keys = [
            'salary',
            'tax',
            'deduction',
            'net',
            'withheld',
            'change',
            'taxRate',
            'finalTax'
          ];

          keys.forEach(
            (key, keyIndex) => {
              const cell =
                cells[
                  keyIndex + 1
                ];

              if (!cell) {
                return;
              }

              if (
                cell.querySelector(
                  'input.v33-history-input'
                )
              ) {
                return;
              }

              const value =
                row[key];

              cell.innerHTML = `
                <input
                  class="v33-history-input"
                  type="number"
                  step="0.01"
                  value="${
                    value ?? ''
                  }"
                  onchange="historyIncomeChangeV33(${year},'${key}',this.value)"
                >
              `;
            }
          );
        }

        //
        // Only unfinished prior years need an explicit Finalize.
        // Current year remains editable without a button.
        //
        if (
          editable &&
          year <
            currentYearV34() &&
          year ===
            nextFinalizableYearV34()
        ) {
          if (
            !cells[0]
              .querySelector(
                '.v34-income-tax-finalize'
              )
          ) {
            const button =
              document.createElement(
                'button'
              );

            button.type =
              'button';

            button.className =
              'btn v34-income-tax-finalize';

            button.textContent =
              '확정';

            button.style.marginLeft =
              '8px';

            button.onclick =
              () =>
                window
                  .finalizeIncomeTaxYearV34(
                    year
                  );

            cells[0]
              .appendChild(
                button
              );
          }
        }
      }
    );
  }

  let observer = null;

  function installObserverV34() {
    const content =
      document.getElementById(
        'content'
      );

    if (
      !content ||
      observer
    ) {
      return;
    }

    observer =
      new MutationObserver(
        () => {
          window.requestAnimationFrame(
            enhanceIncomeTaxV34
          );
        }
      );

    observer.observe(
      content,
      {
        childList: true,
        subtree: true
      }
    );
  }

  function bootV34() {
    ensureIncomeTaxRolloverV34();
    installObserverV34();

    window.requestAnimationFrame(
      enhanceIncomeTaxV34
    );

    console.info(
      '[Portfolio Control] v3.4 Income & Tax rollover loaded'
    );
  }

  if (
    document.readyState ===
      'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      bootV34,
      {
        once: true
      }
    );
  } else {
    bootV34();
  }
})();
