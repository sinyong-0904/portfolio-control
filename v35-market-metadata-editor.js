// Portfolio Control v3.5
// Manual ETF metadata editor:
// dividend yield / fee / net assets.
//
// Load AFTER v33-lifecycle-v2.js.
// v35 only.

(function () {
  'use strict';

  let queued = false;


  function text(v) {
    return String(
      v == null
        ? ''
        : v
    ).trim();
  }


  function normalize(v) {
    return text(v)
      .replace(/\s+/g, '')
      .toUpperCase();
  }


  function masterForCode(code) {
    const c =
      normalize(code);

    return (
      (data.market || [])
        .find(
          m =>
            normalize(
              m.code
            ) === c
        ) ||
      null
    );
  }


  function makeNumberInput(
    attr,
    value,
    step
  ) {
    const input =
      document.createElement(
        'input'
      );

    input.type =
      'number';

    input.className =
      'numInput';

    input.setAttribute(
      attr,
      ''
    );

    input.step =
      step;

    input.min =
      '0';

    input.value =
      value == null
        ? ''
        : String(value);

    input.style.minWidth =
      '78px';

    return input;
  }


  function installColumns() {
    const table =
      document.querySelector(
        '.v33-life-master-table'
      );

    if (
      !table ||
      table.dataset
        .v35MetadataEditor ===
        '1'
    ) {
      return;
    }

    //
    // Mark BEFORE changing the DOM.
    // MutationObserver may call us again.
    //
    table.dataset
      .v35MetadataEditor =
      '1';

    const headRow =
      table.querySelector(
        'thead tr'
      );

    if (!headRow) {
      return;
    }

    const autoHead =
      headRow.lastElementChild;

    [
      '배당률%',
      '총보수%',
      '순자산'
    ].forEach(
      label => {
        const th =
          document.createElement(
            'th'
          );

        th.textContent =
          label;

        headRow.insertBefore(
          th,
          autoHead
        );
      }
    );

    table
      .querySelectorAll(
        '[data-v33-master-row]'
      )
      .forEach(
        row => {
          const code =
            normalize(
              row.dataset
                .oldCode
            );

          const master =
            masterForCode(
              code
            );

          if (!master) {
            return;
          }

          const autoCell =
            row.lastElementChild;

          const dividendCell =
            document.createElement(
              'td'
            );

          dividendCell.appendChild(
            makeNumberInput(
              'data-v35-meta-dividend',
              master.dividendYield,
              '0.01'
            )
          );

          const feeCell =
            document.createElement(
              'td'
            );

          feeCell.appendChild(
            makeNumberInput(
              'data-v35-meta-fee',
              master.fee,
              '0.001'
            )
          );

          const assetsCell =
            document.createElement(
              'td'
            );

          const assetsInput =
            document.createElement(
              'input'
            );

          assetsInput.setAttribute(
            'data-v35-meta-assets',
            ''
          );

          assetsInput.value =
            text(
              master.netAssets
            );

          assetsInput.placeholder =
            '예: 3.8조';

          assetsInput.autocomplete =
            'off';

          assetsInput.style.minWidth =
            '90px';

          assetsCell.appendChild(
            assetsInput
          );

          row.insertBefore(
            dividendCell,
            autoCell
          );

          row.insertBefore(
            feeCell,
            autoCell
          );

          row.insertBefore(
            assetsCell,
            autoCell
          );
        }
      );


    const root =
      table.closest(
        '#v33-lifecycle-root'
      );

    if (!root) {
      return;
    }

    const actions =
      root.querySelector(
        '.v33-life-actions'
      );

    if (
      actions &&
      !actions.querySelector(
        '[data-v35-meta-save]'
      )
    ) {
      const button =
        document.createElement(
          'button'
        );

      button.className =
        'btn';

      button.type =
        'button';

      button.setAttribute(
        'data-v35-meta-save',
        ''
      );

      button.textContent =
        '메타정보 저장';

      actions.appendChild(
        button
      );
    }

    const help =
      table.parentElement
        ?.nextElementSibling;

    if (
      help &&
      help.classList
        .contains(
          'v33-life-help'
        ) &&
      !help.querySelector(
        '[data-v35-meta-help]'
      )
    ) {
      const extra =
        document.createElement(
          'div'
        );

      extra.setAttribute(
        'data-v35-meta-help',
        ''
      );

      extra.textContent =
        '배당률·총보수·순자산은 수동 관리합니다. ' +
        '배당률과 총보수는 % 숫자로 입력하세요.';

      help.appendChild(
        extra
      );
    }
  }


  function parsePercent(
    raw,
    label,
    code
  ) {
    const value =
      text(raw);

    if (!value) {
      return {
        ok: true,
        value: null
      };
    }

    const n =
      Number(value);

    if (
      !Number.isFinite(n) ||
      n < 0 ||
      n > 100
    ) {
      return {
        ok: false,
        message:
          `${code} ${label} 값이 올바르지 않습니다.`
      };
    }

    return {
      ok: true,
      value: n
    };
  }


  function saveMetadata() {
    const table =
      document.querySelector(
        '.v33-life-master-table'
      );

    if (!table) {
      return;
    }

    const plans = [];

    for (
      const row of
        table.querySelectorAll(
          '[data-v33-master-row]'
        )
    ) {
      const oldCode =
        normalize(
          row.dataset
            .oldCode
        );

      const visibleCode =
        normalize(
          row.querySelector(
            '[data-v33-master-code]'
          )?.value
        );

      //
      // Avoid applying metadata to a code
      // that has been edited but not yet
      // saved by the original master editor.
      //
      if (
        visibleCode !==
        oldCode
      ) {
        alert(
          `${oldCode}의 Code가 수정되어 있습니다.\n` +
          '먼저 "기준정보 저장"을 눌러 Code 변경을 확정한 뒤 ' +
          '메타정보를 저장하세요.'
        );

        return;
      }

      const master =
        masterForCode(
          oldCode
        );

      if (!master) {
        continue;
      }

      const dividend =
        parsePercent(
          row.querySelector(
            '[data-v35-meta-dividend]'
          )?.value,
          '배당률',
          oldCode
        );

      if (!dividend.ok) {
        alert(
          dividend.message
        );

        return;
      }

      const fee =
        parsePercent(
          row.querySelector(
            '[data-v35-meta-fee]'
          )?.value,
          '총보수',
          oldCode
        );

      if (!fee.ok) {
        alert(
          fee.message
        );

        return;
      }

      plans.push({
        master,

        dividendYield:
          dividend.value,

        fee:
          fee.value,

        netAssets:
          text(
            row.querySelector(
              '[data-v35-meta-assets]'
            )?.value
          )
      });
    }


    plans.forEach(
      plan => {
        plan.master
          .dividendYield =
          plan.dividendYield;

        plan.master.fee =
          plan.fee;

        plan.master
          .netAssets =
          plan.netAssets;
      }
    );


    if (
      typeof save ===
      'function'
    ) {
      save();
    }
  }


  function queueInstall() {
    if (queued) {
      return;
    }

    queued = true;

    requestAnimationFrame(
      () => {
        queued = false;

        try {
          installColumns();
        } catch (e) {
          console.error(
            '[v3.5 metadata editor]',
            e
          );
        }
      }
    );
  }


  document.addEventListener(
    'click',
    event => {
      if (
        event.target
          .closest(
            '[data-v35-meta-save]'
          )
      ) {
        saveMetadata();
      }
    }
  );


  const target =
    document.getElementById(
      'content'
    );

  if (target) {
    const observer =
      new MutationObserver(
        queueInstall
      );

    observer.observe(
      target,
      {
        childList: true,
        subtree: true
      }
    );
  }


  queueInstall();
})();