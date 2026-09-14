//
// Portfolio Control v3.5
// Income & Tax annual row simulation.
// DEV-only, memory-only.
//

(function () {
  let incomeTaxPreviewV35 =
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

  function incomeTaxEffectiveYearV35() {
    const businessYear =
      businessYearV35Safe();

    if (
      incomeTaxPreviewV35 &&
      Number(
        incomeTaxPreviewV35.toYear
      ) === businessYear
    ) {
      return businessYear;
    }

    return activeAnnualYearV35Safe();
  }

  function ensureIncomeTaxFinalizedYearsV35() {
    if (
      !data.incomeTaxHistory ||
      typeof data.incomeTaxHistory !==
        'object'
    ) {
      data.incomeTaxHistory = {};
    }

    if (
      !data.incomeTaxHistory
        .finalizedYears ||
      typeof data.incomeTaxHistory
        .finalizedYears !==
        'object' ||
      Array.isArray(
        data.incomeTaxHistory
          .finalizedYears
      )
    ) {
      data.incomeTaxHistory
        .finalizedYears = {};
    }

    return data.incomeTaxHistory
      .finalizedYears;
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
    const y =
      Number(year);

    if (
      !Number.isInteger(y)
    ) {
      return false;
    }

    //
    // DEV preview simulation:
    // persistence를 건드리지 않는다.
    //
    if (
      incomeTaxPreviewV35 &&
      Number(
        incomeTaxPreviewV35.toYear
      ) ===
        businessYearV35Safe()
    ) {
      incomeTaxPreviewV35
        .finalizedYears =
          incomeTaxPreviewV35
            .finalizedYears &&
          typeof incomeTaxPreviewV35
            .finalizedYears ===
            'object'
            ? incomeTaxPreviewV35
                .finalizedYears
            : {};

      if (finalized) {
        incomeTaxPreviewV35
          .finalizedYears[
            String(y)
          ] = true;
      } else {
        delete incomeTaxPreviewV35
          .finalizedYears[
            String(y)
          ];
      }

      return true;
    }

    const years =
      ensureIncomeTaxFinalizedYearsV35();

    if (finalized) {
      years[
        String(y)
      ] = true;
    } else {
      delete years[
        String(y)
      ];
    }

    save();

    return true;
  };

  window.isIncomeTaxFinalizedV35 =
  function (year) {
    const key =
      String(
        Number(year)
      );

    if (
      incomeTaxPreviewV35 &&
      Number(
        incomeTaxPreviewV35.toYear
      ) ===
        businessYearV35Safe()
    ) {
      return (
        incomeTaxPreviewV35
          .finalizedYears?.[
            key
          ] === true
      );
    }

    return (
      data &&
      data.incomeTaxHistory &&
      data.incomeTaxHistory
        .finalizedYears?.[
          key
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

function updateIncomeTaxSumV35(
  table
) {
  if (!table) {
    return false;
  }

  const rows =
    Array.from(
      table.querySelectorAll(
        'tbody tr'
      )
    );

  const sumRow =
    rows.find(
      row =>
        row.children[0]
          ?.textContent
          ?.trim() ===
        'Sum'
    );

  if (!sumRow) {
    return false;
  }

  const dataRows =
    rows.filter(
      row =>
        Number.isInteger(
          Number(
            row.children[0]
              ?.textContent
              ?.trim()
          )
        )
    );

  function cellNumberV35(
    row,
    index
  ) {
    const cell =
      row.children[index];

    if (!cell) {
      return 0;
    }

    const input =
      cell.querySelector(
        'input'
      );

    const raw =
      input
        ? input.value
        : cell.textContent;

    if (
      raw == null ||
      String(raw).trim() === '' ||
      String(raw).trim() === 'n/a'
    ) {
      return 0;
    }

    const value =
      Number(
        String(raw)
          .replace(/,/g, '')
          .replace(/%/g, '')
          .trim()
      );

    return Number.isFinite(value)
      ? value
      : 0;
  }

  const sums = {};

  [
    [1, 'salary'],
    [2, 'tax'],
    [3, 'deduction'],
    [4, 'net'],
    [5, 'withheld'],
    [8, 'finalTax']
  ].forEach(
    ([index, key]) => {
      sums[key] =
        dataRows.reduce(
          (sum, row) =>
            sum +
            cellNumberV35(
              row,
              index
            ),
          0
        );

      if (
        sumRow.children[index]
      ) {
        sumRow.children[
          index
        ].textContent =
          Math.round(
            sums[key]
          ).toLocaleString(
            'ko-KR'
          );
      }
    }
  );

  if (sumRow.children[6]) {
    sumRow.children[6]
      .textContent =
        'n/a';
  }

  const totalRate =
    sums.withheld
      ? (
          sums.finalTax /
          sums.withheld *
          100
        )
      : null;

  if (sumRow.children[7]) {
    sumRow.children[7]
      .textContent =
        totalRate == null
          ? 'n/a'
          : `${totalRate.toFixed(2)}%`;
  }

  return true;
}

function promoteIncomeTaxRowV35(
  row,
  year,
  fields
) {
  if (
    !row ||
    !Array.isArray(fields)
  ) {
    return false;
  }

  const existingInputs =
    row.querySelectorAll(
      'input'
    );

  //
  // 이미 promoted/base-editable row면
  // node를 다시 만들지 않는다.
  //
  if (
    existingInputs.length ===
    fields.length
  ) {
    return true;
  }

  const historyRows =
    Array.isArray(
      data.incomeTaxHistory
        ?.rows
    )
      ? data.incomeTaxHistory
          .rows
      : [];

  const source =
    historyRows.find(
      item =>
        Number(
          item &&
          item.year
        ) === Number(year)
    );

  if (!source) {
    return false;
  }

  fields.forEach(
    (
      field,
      index
    ) => {
      const cell =
        row.children[
          index + 1
        ];

      if (!cell) {
        return;
      }

      const existing =
        cell.querySelector(
          'input'
        );

      if (existing) {
        return;
      }

      const input =
        document.createElement(
          'input'
        );

      input.type =
        'number';

      input.value =
        source[field] == null
          ? ''
          : source[field];

      input.onchange =
        function () {
          if (
            typeof window
              .historyIncomeChangeV33 ===
              'function'
          ) {
            window
              .historyIncomeChangeV33(
                Number(year),
                field,
                this.value
              );

            return;
          }

          source[field] =
            this.value === ''
              ? null
              : Number(
                  this.value
                );

          save();
        };

      cell.textContent =
        '';

      cell.appendChild(
        input
      );
    }
  );

  return (
    row.querySelectorAll(
      'input'
    ).length ===
    fields.length
  );
}

function updateIncomeTaxFinalizeControlV35(
  controls,
  fromYear
) {
  if (!controls) {
    return false;
  }

  let button =
    controls.querySelector(
      'button'
    );

  let note =
    controls.querySelector(
      '.note'
    );

  //
  // 최초 한 번만 DOM node를 생성한다.
  // 이후 presentation 호출에서는
  // 동일 node identity를 유지한다.
  //
  if (!button) {
    button =
      document.createElement(
        'button'
      );

    button.type =
      'button';

    controls.appendChild(
      button
    );
  }

  if (!note) {
    note =
      document.createElement(
        'span'
      );

    note.className =
      'note';

    note.style.marginLeft =
      '8px';

    controls.appendChild(
      note
    );
  }

  const finalized =
    window
      .isIncomeTaxFinalizedV35(
        fromYear
      );

  button.className =
    finalized
      ? 'btn'
      : 'btn primary';

  button.textContent =
    finalized
      ? `${fromYear} 확정 해제`
      : `${fromYear} 확정`;

  note.textContent =
    finalized
      ? `${fromYear}은 확정되어 수정할 수 없습니다.`
      : `${fromYear}은 아직 미확정이며 수정할 수 있습니다.`;

  //
  // node는 유지하면서 handler만
  // 현재 state 기준으로 갱신한다.
  //
  button.onclick =
    function () {
      window
        .setIncomeTaxFinalizedV35(
          fromYear,
          !window
            .isIncomeTaxFinalizedV35(
              fromYear
            )
        );

      applyIncomeTaxPresentationV35();
    };

  return true;
}

  function applyIncomeTaxPresentationV35() {
  const effectiveYear =
    incomeTaxEffectiveYearV35();

  if (effectiveYear <= 2026) {
    return false;
  }

  const content =
    document.getElementById(
      'content'
    );

  if (!content) {
    return false;
  }

  const previewMode =
    !!(
      incomeTaxPreviewV35 &&
      Number(
        incomeTaxPreviewV35.toYear
      ) ===
        businessYearV35Safe()
    );

  const fromYear =
    previewMode
      ? Number(
          incomeTaxPreviewV35
            .fromYear
        )
      : effectiveYear - 1;

  const toYear =
    effectiveYear;

  //
  // Income & Tax heading을 authoritative
  // presentation anchor로 사용한다.
  //
  const heading =
    Array.from(
      content.querySelectorAll(
        'h1, h2, h3'
      )
    ).find(
      element =>
        element.textContent
          .trim() ===
        'Income & Tax'
    );

  if (!heading) {
    return false;
  }

  //
  // Heading 뒤에서 가장 먼저 나오는
  // 9-column Income & Tax table을 찾는다.
  //
  let node =
    heading.nextElementSibling;

  let table = null;

  while (node) {
    if (
      node.tagName === 'TABLE'
    ) {
      table = node;
      break;
    }

    table =
      node.querySelector
        ? node.querySelector(
            'table'
          )
        : null;

    if (table) {
      break;
    }

    if (
      /^H[1-3]$/.test(
        node.tagName || ''
      )
    ) {
      break;
    }

    node =
      node.nextElementSibling;
  }

  //
  // 현재 renderer 구조가 바뀌어도
  // Income & Tax heading 이후 table을
  // 못 찾은 경우에만 section-local
  // fallback을 사용한다.
  //
  if (!table) {
    const headings =
      Array.from(
        content.querySelectorAll(
          'h1, h2, h3'
        )
      );

    const headingIndex =
      headings.indexOf(
        heading
      );

    const nextHeading =
      headingIndex >= 0
        ? headings[
            headingIndex + 1
          ]
        : null;

    table =
      Array.from(
        content.querySelectorAll(
          'table'
        )
      ).find(
        candidate => {
          const position =
            heading.compareDocumentPosition(
              candidate
            );

          const afterHeading =
            !!(
              position &
              Node
                .DOCUMENT_POSITION_FOLLOWING
            );

          if (!afterHeading) {
            return false;
          }

          if (nextHeading) {
            const nextPosition =
              candidate
                .compareDocumentPosition(
                  nextHeading
                );

            const beforeNext =
              !!(
                nextPosition &
                Node
                  .DOCUMENT_POSITION_FOLLOWING
              );

            if (!beforeNext) {
              return false;
            }
          }

          const headers =
            Array.from(
              candidate.querySelectorAll(
                'thead th'
              )
            );

          return (
            headers.length === 9 &&
            headers[0]
              ?.textContent
              ?.trim() ===
              '연도'
          );
        }
      );
  }

  if (!table) {
    return false;
  }

  const body =
    table.querySelector(
      'tbody'
    );

  if (!body) {
    return false;
  }

  const fields = [
    'salary',
    'tax',
    'deduction',
    'net',
    'withheld',
    'change',
    'taxRate',
    'finalTax'
  ];

  //
  // DEV preview:
  // data에는 아직 없는 toYear row를
  // DOM에만 추가한다.
  //
  if (previewMode) {
    const existingYears =
      Array.from(
        body.querySelectorAll(
          'tr'
        )
      )
        .map(
          row =>
            Number(
              row.children[0]
                ?.textContent
                ?.trim()
            )
        )
        .filter(
          Number.isFinite
        );

    if (
      !existingYears.includes(
        toYear
      )
    ) {
      const sourceRow =
        incomeTaxPreviewV35
          .row;

      if (sourceRow) {
        const tr =
          document.createElement(
            'tr'
          );

        const yearCell =
          document.createElement(
            'td'
          );

        yearCell.textContent =
          String(toYear);

        tr.appendChild(
          yearCell
        );

        fields.forEach(
          field => {
            const td =
              document.createElement(
                'td'
              );

            const input =
              document.createElement(
                'input'
              );

            input.type =
              'number';

            input.value =
              sourceRow[field] ==
                null
                ? ''
                : sourceRow[
                    field
                  ];

            input.onchange =
              function () {
                incomeTaxPreviewV35
                  .row[field] =
                    this.value ===
                      ''
                      ? null
                      : Number(
                          this.value
                        );

                applyIncomeTaxPresentationV35();
              };

            td.appendChild(
              input
            );

            tr.appendChild(
              td
            );
          }
        );

        const sumRow =
          Array.from(
            body.querySelectorAll(
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
          body.insertBefore(
            tr,
            sumRow
          );
        } else {
          body.appendChild(
            tr
          );
        }
      }
    }
  }

  const rows =
    Array.from(
      body.querySelectorAll(
        'tr'
      )
    );

    //
  // Actual persistent 2027+에서는
  // base renderer가 최신 toYear만
  // input으로 만들기 때문에,
  // 아직 미확정인 fromYear row를
  // persistent editor로 승격한다.
  //
  if (!previewMode) {
    const fromRow =
      rows.find(
        row =>
          Number(
            row.children[0]
              ?.textContent
              ?.trim()
          ) === fromYear
      );

    if (fromRow) {
      promoteIncomeTaxRowV35(
        fromRow,
        fromYear,
        fields
      );
    }
  }
  
  function rowYearV35(
    row
  ) {
    return Number(
      row.children[0]
        ?.textContent
        ?.trim()
    );
  }

  function rowInputsV35(
    row
  ) {
    return Array.from(
      row.querySelectorAll(
        'input'
      )
    );
  }

  //
  // 2008~fromYear-1 = readonly
  // fromYear = 미확정이면 editable
  // toYear = editable
  //
  rows.forEach(
    row => {
      const year =
        rowYearV35(
          row
        );

      if (
        !Number.isInteger(
          year
        )
      ) {
        return;
      }

      const finalized =
        year === fromYear &&
        window
          .isIncomeTaxFinalizedV35(
            fromYear
          );

      const editable =
        year === toYear ||
        (
          year === fromYear &&
          !finalized
        );

      rowInputsV35(
        row
      ).forEach(
        input => {
          input.disabled =
            !editable;

          input.readOnly =
            !editable;
        }
      );

      row.classList.toggle(
        'v35-income-tax-finalized',
        finalized
      );
    }
  );

  //
  // Actual persistent mode:
  // base renderer가 생성한 from/to year
  // inputs를 existing persistent writer에
  // 연결한다.
  //
  if (!previewMode) {
    const actualRows =
      Array.isArray(
        data.incomeTaxHistory
          ?.rows
      )
        ? data
            .incomeTaxHistory
            .rows
        : [];

    rows.forEach(
      row => {
        const year =
          rowYearV35(
            row
          );

        if (
          year !== fromYear &&
          year !== toYear
        ) {
          return;
        }

        const source =
          actualRows.find(
            item =>
              Number(
                item &&
                item.year
              ) === year
          );

        if (!source) {
          return;
        }

        rowInputsV35(
          row
        ).forEach(
          (
            input,
            index
          ) => {
            const field =
              fields[index];

            if (!field) {
              return;
            }

            input.onchange =
              function () {
                if (
                  typeof window
                    .historyIncomeChangeV33 ===
                    'function'
                ) {
                  window
                    .historyIncomeChangeV33(
                      year,
                      field,
                      this.value
                    );

                  return;
                }

                source[field] =
                  this.value === ''
                    ? null
                    : Number(
                        this.value
                      );

                save();
              };
          }
        );
      }
    );
  }

  //
  // Finalize / reopen control.
  //
    let controls =
    content.querySelector(
      '#income-tax-finalize-v35'
    );

  if (!controls) {
    controls =
      document.createElement(
        'div'
      );

    controls.id =
      'income-tax-finalize-v35';

    controls.className =
      'actions';

    controls.style.marginTop =
      '10px';

    table.insertAdjacentElement(
      'afterend',
      controls
    );
  }

  updateIncomeTaxFinalizeControlV35(
    controls,
    fromYear
  );

  //
  // Income & Tax section의 note textarea를
  // heading/table 위치 기준으로 찾는다.
  //
  let noteTextarea = null;

  let noteNode =
    controls.nextElementSibling;

  while (noteNode) {
    if (
      /^H[1-3]$/.test(
        noteNode.tagName || ''
      )
    ) {
      break;
    }

    if (
      noteNode.tagName ===
        'TEXTAREA'
    ) {
      noteTextarea =
        noteNode;
      break;
    }

    noteTextarea =
      noteNode.querySelector
        ? noteNode.querySelector(
            'textarea'
          )
        : null;

    if (noteTextarea) {
      break;
    }

    noteNode =
      noteNode
        .nextElementSibling;
  }

  //
  // Fallback: Income & Tax heading 뒤
  // 첫 textarea.
  //
  if (!noteTextarea) {
    const textareas =
      Array.from(
        content.querySelectorAll(
          'textarea'
        )
      );

    noteTextarea =
      textareas.find(
        textarea => {
          const position =
            heading
              .compareDocumentPosition(
                textarea
              );

          return !!(
            position &
            Node
              .DOCUMENT_POSITION_FOLLOWING
          );
        }
      ) || null;
  }

  if (noteTextarea) {
    if (previewMode) {
      if (
        document.activeElement !==
        noteTextarea
      ) {
        noteTextarea.value =
          incomeTaxPreviewV35
            .note || '';
      }

      noteTextarea.onchange =
        function () {
          incomeTaxPreviewV35
            .note =
              this.value;
        };
    } else {
      const notes =
        data.incomeTaxHistory
          ?.notes || {};

      if (
        document.activeElement !==
        noteTextarea
      ) {
        noteTextarea.value =
          notes[
            String(toYear)
          ] || '';
      }

      noteTextarea.onchange =
        function () {
          if (
            typeof window
              .historyNoteChangeV33 ===
              'function'
          ) {
            window
              .historyNoteChangeV33(
                toYear,
                this.value
              );

            return;
          }

          data.incomeTaxHistory
            .notes =
              data.incomeTaxHistory
                .notes || {};

          data.incomeTaxHistory
            .notes[
              String(toYear)
            ] =
              this.value;

          save();
        };
    }
  }

    updateIncomeTaxSumV35(
    table
  );

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