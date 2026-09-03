// Portfolio Control v3.3
// CHILD pension holdings editor

(function () {
  'use strict';

  const OWNERS = [
    '서현',
    '서진'
  ];

  function state() {
    if (
      typeof data ===
        'undefined' ||
      !data
    ) {
      return null;
    }

    if (
      !data.childEditor ||
      typeof data.childEditor !==
        'object'
    ) {
      data.childEditor = {};
    }

    if (
      !data.childEditor.cashByOwner ||
      typeof data.childEditor
        .cashByOwner !== 'object'
    ) {
      data.childEditor.cashByOwner = {
        서현: 0,
        서진: 0
      };
    }

    OWNERS.forEach(owner => {
      const n =
        Number(
          data.childEditor
            .cashByOwner[owner]
        );

      data.childEditor
        .cashByOwner[owner] =
          Number.isFinite(n)
            ? n
            : 0;
    });

    return data.childEditor;
  }


  function number(value) {
    const n =
      Number(
        String(value ?? '')
          .replace(/,/g, '')
          .trim()
      );

    return Number.isFinite(n)
      ? n
      : 0;
  }


  function childHoldings() {
    if (
      typeof data ===
        'undefined' ||
      !Array.isArray(
        data.holdings
      )
    ) {
      return [];
    }

    return data.holdings.filter(
      h =>
        h &&
        h.account === 'CHILD' &&
        h.status === 'Active' &&
        OWNERS.includes(
          h.owner
        )
    );
  }


  function findChildTable() {
    const headings =
      Array.from(
        document.querySelectorAll(
          'h2'
        )
      );

    const heading =
      headings.find(
        h =>
          String(
            h.textContent || ''
          ).trim() ===
          '보유종목'
      );

    if (!heading) {
      return null;
    }

    let node =
      heading.nextElementSibling;

    while (node) {
      if (
        node.tagName === 'TABLE'
      ) {
        return node;
      }

      const table =
        node.querySelector
          ? node.querySelector(
              'table'
            )
          : null;

      if (table) {
        return table;
      }

      node =
        node.nextElementSibling;
    }

    return null;
  }


  function holdingForRow(
    row
  ) {
    const cells =
      row.querySelectorAll('td');

    if (cells.length < 5) {
      return null;
    }

    const owner =
      String(
        cells[0].textContent || ''
      ).trim();

    const code =
      String(
        cells[2].textContent || ''
      ).trim();

    return (
      childHoldings().find(
        h =>
          h.owner === owner &&
          String(
            h.code || ''
          ).trim() === code
      ) || null
    );
  }


  function makeEditable(
    table
  ) {
    table
      .querySelectorAll(
        'tbody tr'
      )
      .forEach(row => {

        if (
          row.dataset
            .v33ChildEdit === '1'
        ) {
          return;
        }

        const h =
          holdingForRow(row);

        if (!h) {
          return;
        }

        const cells =
          row.querySelectorAll(
            'td'
          );

        cells[3].innerHTML = `
          <input
            class="v33-child-qty"
            data-id="${h.id}"
            type="number"
            min="0"
            step="1"
            value="${
              Number(h.qty) || 0
            }"
            style="width:85px"
          >
        `;

        cells[4].innerHTML = `
          <input
            class="v33-child-avg"
            data-id="${h.id}"
            type="number"
            min="0"
            step="1"
            value="${
              Number(h.avg) || 0
            }"
            style="width:105px"
          >
        `;

        row.dataset
          .v33ChildEdit = '1';
      });
  }


  function controlsHtml() {
    const s = state();

    if (!s) {
      return '';
    }

    return `
      <div
        id="v33ChildControls"
        class="actions"
        style="
          margin:8px 0 12px;
          align-items:flex-end;
          flex-wrap:wrap;
        "
      >
        <button
          id="v33ChildSave"
          class="btn"
          type="button"
        >
          보유정보 저장·재계산
        </button>

        <button
          id="v33ChildAdd"
          class="btn"
          type="button"
        >
          + 종목
        </button>

        <label>
          <span class="small">
            서현 계좌 현금(원)
          </span>
          <input
            id="v33ChildCashA"
            type="number"
            step="1"
            value="${
              s.cashByOwner.서현
            }"
            style="width:130px"
          >
        </label>

        <label>
          <span class="small">
            서진 계좌 현금(원)
          </span>
          <input
            id="v33ChildCashB"
            type="number"
            step="1"
            value="${
              s.cashByOwner.서진
            }"
            style="width:130px"
          >
        </label>
      </div>
    `;
  }


  function saveChanges() {
    const s = state();

    if (!s) {
      return;
    }

    document
      .querySelectorAll(
        '.v33-child-qty'
      )
      .forEach(input => {
        const h =
          data.holdings.find(
            x =>
              x.id ===
              input.dataset.id
          );

        if (h) {
          h.qty =
            number(
              input.value
            );
        }
      });


    document
      .querySelectorAll(
        '.v33-child-avg'
      )
      .forEach(input => {
        const h =
          data.holdings.find(
            x =>
              x.id ===
              input.dataset.id
          );

        if (h) {
          h.avg =
            number(
              input.value
            );
        }
      });


    s.cashByOwner.서현 =
      number(
        document.getElementById(
          'v33ChildCashA'
        )?.value
      );

    s.cashByOwner.서진 =
      number(
        document.getElementById(
          'v33ChildCashB'
        )?.value
      );

        const childAccount =
      (data.accounts || [])
        .find(
          a =>
            a.id === 'CHILD'
        );

    if (childAccount) {
      childAccount.cashKRW =
        s.cashByOwner.서현 +
        s.cashByOwner.서진;
    }

    if (
      typeof save ===
        'function'
    ) {
      save();
    }

    if (
      typeof render ===
        'function'
    ) {
      render();
    }
  }


  function addHolding() {
    const owner =
      prompt(
        'Owner: 서현 또는 서진'
      );

    if (
      !OWNERS.includes(
        owner
      )
    ) {
      return;
    }

    const name =
      prompt('종목명');

    if (!name) {
      return;
    }

    const code =
      prompt('종목코드');

    if (!code) {
      return;
    }

    const qty =
      number(
        prompt(
          '보유량',
          '0'
        )
      );

    const avg =
      number(
        prompt(
          '평단',
          '0'
        )
      );

    data.holdings.push({
      id:
        'child_' +
        Date.now()
          .toString(36),

      account:
        'CHILD',

      owner,
      name,
      code,
      qty,
      avg,
      status:
        'Active'
    });

    if (
      typeof save ===
        'function'
    ) {
      save();
    }

    if (
      typeof render ===
        'function'
    ) {
      render();
    }
  }


  function install() {
    const table =
      findChildTable();

    if (!table) {
      return;
    }

    if (
      !document.getElementById(
        'v33ChildControls'
      )
    ) {
      table.insertAdjacentHTML(
        'beforebegin',
        controlsHtml()
      );

      document
        .getElementById(
          'v33ChildSave'
        )
        ?.addEventListener(
          'click',
          saveChanges
        );

      document
        .getElementById(
          'v33ChildAdd'
        )
        ?.addEventListener(
          'click',
          addHolding
        );
    }

    makeEditable(
      table
    );
  }


  let queued = false;

  function schedule() {
    if (queued) {
      return;
    }

    queued = true;

    requestAnimationFrame(
      () => {
        queued = false;
        install();
      }
    );
  }


  const observer =
    new MutationObserver(
      schedule
    );

  function start() {
    state();

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

    schedule();
  }


  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      start,
      {
        once: true
      }
    );
  } else {
    start();
  }

})();
