//
// Portfolio Control v3.5
// Business-year aware Annual Input.
// DEV entry point only.
//

(function () {
  function businessYearV35Safe() {
    return (
      typeof window.businessYearV35 ===
        'function'
        ? window.businessYearV35()
        : new Date().getFullYear()
    );
  }

  //
  // accountSummary()가 year argument 없이
  // annualFlow(a)를 호출하므로,
  // v3.5에서는 business year의 annual 값을 사용한다.
  //
  window.annualFlow =
    function (a, year) {
      const targetYear =
        year == null
          ? String(
              businessYearV35Safe()
            )
          : String(year);

      return Number(
        (a.annual || {})[
          targetYear
        ]
      ) || 0;
    };

  function findAnnualInputTableV35() {
    const tables =
      Array.from(
        document.querySelectorAll(
          '#content table'
        )
      );

    return (
      tables.find(
        table => {
          const headers =
            Array.from(
              table.querySelectorAll(
                'thead th'
              )
            )
              .map(
                th =>
                  th.textContent
                    .trim()
              );

          return (
            headers[0] === '연도' &&
            headers.includes('DC') &&
            headers.includes('개인1') &&
            headers.includes('개인2') &&
            headers.includes('ISA') &&
            headers.includes('투입액')
          );
        }
      ) || null
    );
  }

  function annualRowV35(year) {
    const y =
      String(year);

    const ids = [
      'DC',
      'P1',
      'P2',
      'ISA'
    ];

    const values =
      ids.map(
        id =>
          Number(
            (acct(id).annual || {})[
              y
            ]
          ) || 0
      );

    const total =
      values.reduce(
        (sum, value) =>
          sum + value,
        0
      );

    return `
      <tr data-v35-annual-year="${y}">
        <td>${y}</td>

        ${ids
          .map(
            (id, index) =>
              `<td>
                <input
                  type="number"
                  step=".1"
                  value="${values[index]}"
                  onchange="acct('${id}').annual['${y}']=+this.value"
                >
              </td>`
          )
          .join('')}

        <td>${won(total)}</td>
      </tr>
    `;
  }

  function updateAnnualNoteV35(
    table,
    year
  ) {
    const wrap =
      table.closest(
        '.v33-merged-body'
      );

    if (!wrap) {
      return;
    }

    const notes =
      Array.from(
        wrap.querySelectorAll(
          '.note'
        )
      );

    const note =
      notes.find(
        el =>
          el.textContent.includes(
            '연간투입 값은'
          )
      );

    if (!note) {
      return;
    }

    const nextText =
      `${year} 연간투입 값은 ` +
      `Overview 계좌별 입출금과 ` +
      `Overview의 ` +
      `${String(year).slice(-2)}'YTD ` +
      `계산에 즉시 반영됩니다.`;

    if (
      note.textContent.trim() !==
      nextText
    ) {
      note.textContent =
        nextText;
    }
  }

  function applyAnnualInputV35() {
    const table =
      findAnnualInputTableV35();

    if (!table) {
      return false;
    }

    const tbody =
      table.querySelector(
        'tbody'
      );

    const totalRow =
      tbody &&
      tbody.querySelector(
        '.totalRow'
      );

    if (
      !tbody ||
      !totalRow
    ) {
      return false;
    }

    const businessYear =
      businessYearV35Safe();

    const lastWantedYear =
      businessYear + 1;

    //
    // 기존 renderer의 2024~2027은 그대로 둔다.
    // 필요한 미래 연도만 추가한다.
    //
    for (
      let year = 2028;
      year <= lastWantedYear;
      year += 1
    ) {
      const exists =
        Array.from(
          tbody.querySelectorAll(
            'tr'
          )
        )
          .some(
            row =>
              row.cells &&
              row.cells[0] &&
              row.cells[0]
                .textContent
                .trim() ===
                String(year)
          );

      if (!exists) {
        totalRow.insertAdjacentHTML(
          'beforebegin',
          annualRowV35(year)
        );
      }
    }

    updateAnnualNoteV35(
      table,
      businessYear
    );

    return true;
  }

  window.applyAnnualInputV35 =
    applyAnnualInputV35;

    //
  // v3.5 presentation은 기존 render lifecycle을
  // 변경하지 않고 #content DOM 변경 후 적용한다.
  //
  function installAnnualObserverV35() {
    const content =
      document.getElementById(
        'content'
      );

    if (!content) {
      return;
    }

    const observer =
      new MutationObserver(
        function () {
          applyAnnualInputV35();
        }
      );

    observer.observe(
      content,
      {
        childList: true,
        subtree: true
      }
    );

    applyAnnualInputV35();
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      installAnnualObserverV35,
      {
        once: true
      }
    );
  } else {
    installAnnualObserverV35();
  }
})();