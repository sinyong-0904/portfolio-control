(() => {
  'use strict';

  const UI_ID =
    'v35-annual-rehearsal-ui';

  let startBusyV35 =
    false;

  function rehearsalStateV35() {
    if (
      typeof window
        .annualRolloverRehearsalStateV35 !==
        'function'
    ) {
      return null;
    }

    return window
      .annualRolloverRehearsalStateV35();
  }

  function activeAnnualYearUiV35() {
    if (
      typeof window
        .activeAnnualYearV35 ===
        'function'
    ) {
      return Number(
        window.activeAnnualYearV35()
      );
    }

    return new Date()
      .getFullYear();
  }

  function rehearsalTargetYearV35() {
    const activeYear =
      activeAnnualYearUiV35();

    return (
      Number.isInteger(
        activeYear
      )
        ? activeYear + 1
        : new Date()
            .getFullYear() + 1
    );
  }

  function removeRehearsalUiV35() {
    const existing =
      document.getElementById(
        UI_ID
      );

    if (existing) {
      existing.remove();
    }
  }

  function uiHostV35() {
    const content =
      document.getElementById(
        'content'
      );

    if (!content) {
      return null;
    }

    return content.parentElement ||
      document.body;
  }

  function buildIdleUiV35() {
    const toYear =
      rehearsalTargetYearV35();

    const box =
      document.createElement(
        'div'
      );

    box.id =
      UI_ID;

    box.style.cssText = [
      'margin:10px 0 14px',
      'padding:12px 14px',
      'border:1px solid rgba(100,116,139,.35)',
      'border-radius:12px',
      'background:rgba(148,163,184,.08)'
    ].join(';');

    const row =
      document.createElement(
        'div'
      );

    row.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:space-between',
      'gap:12px',
      'flex-wrap:wrap'
    ].join(';');

    const text =
      document.createElement(
        'div'
      );

    const title =
      document.createElement(
        'div'
      );

    title.style.cssText =
      'font-weight:800;margin-bottom:3px';

    title.textContent =
      'Annual Transition Rehearsal';

    const note =
      document.createElement(
        'div'
      );

    note.className =
      'note';

    note.textContent =
      `${toYear} rollover를 실제 저장 없이 미리 검증합니다.`;

    text.appendChild(
      title
    );

    text.appendChild(
      note
    );

    const button =
      document.createElement(
        'button'
      );

    button.type =
      'button';

    button.className =
      'btn';

    button.textContent =
      startBusyV35
        ? 'Rehearsal 준비 중...'
        : `🧪 ${toYear} Rollover Rehearsal`;

    button.disabled =
      startBusyV35;

    button.onclick =
      async function () {
        if (
          startBusyV35
        ) {
          return;
        }

        const confirmed =
          window.confirm(
            [
              `${toYear} Rollover Rehearsal을 시작합니다.`,
              '',
              '• 실제 Supabase 저장은 차단됩니다.',
              '• Market yearStart는 SIMULATED 값입니다.',
              '• 화면은 임시로 ' +
                `${toYear} rollover 직후 상태가 됩니다.`,
              '• Rehearsal 종료 시 현재 production 상태로 복귀합니다.',
              '',
              '계속하시겠습니까?'
            ].join('\n')
          );

        if (!confirmed) {
          return;
        }

        startBusyV35 =
          true;

        ensureAnnualRehearsalUiV35();

        let result;

        try {
          result =
            await window
              .startAnnualRolloverRehearsalV35({
                fromYear:
                  activeAnnualYearUiV35(),

                toYear
              });
        } catch (error) {
          result = {
            ok: false,

            code:
              'ANNUAL_REHEARSAL_UI_EXCEPTION',

            error:
              String(
                error &&
                error.message
                  ? error.message
                  : error
              )
          };
        } finally {
          startBusyV35 =
            false;
        }

        ensureAnnualRehearsalUiV35();

        if (
          !result ||
          result.ok !== true
        ) {
          window.alert(
            [
              'Rollover Rehearsal을 시작하지 못했습니다.',
              '',
              `Code: ${
                result &&
                result.code
                  ? result.code
                  : 'UNKNOWN'
              }`,
              result &&
              result.error
                ? `Error: ${result.error}`
                : ''
            ]
              .filter(Boolean)
              .join('\n')
          );
        }
      };

    row.appendChild(
      text
    );

    row.appendChild(
      button
    );

    box.appendChild(
      row
    );

    return box;
  }

  function buildActiveUiV35(
    state
  ) {
    const box =
      document.createElement(
        'div'
      );

    box.id =
      UI_ID;

    box.style.cssText = [
      'margin:10px 0 14px',
      'padding:13px 14px',
      'border:2px solid #f59e0b',
      'border-radius:12px',
      'background:rgba(245,158,11,.12)',
      'position:relative',
      'z-index:20'
    ].join(';');

    const row =
      document.createElement(
        'div'
      );

    row.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:space-between',
      'gap:12px',
      'flex-wrap:wrap'
    ].join(';');

    const text =
      document.createElement(
        'div'
      );

    const title =
      document.createElement(
        'div'
      );

    title.style.cssText =
      'font-weight:900;font-size:15px;margin-bottom:4px';

    title.textContent =
      `🧪 ${state.toYear} ROLLOVER REHEARSAL`;

    const status =
      document.createElement(
        'div'
      );

    status.className =
      'note';

    status.textContent =
      'SIMULATED Market baseline · Persistence BLOCKED · 실제 데이터는 저장되지 않습니다.';

    text.appendChild(
      title
    );

    text.appendChild(
      status
    );

    const button =
      document.createElement(
        'button'
      );

    button.type =
      'button';

    button.className =
      'btn';

    button.textContent =
      `Rehearsal 종료 → ${state.fromYear} 복귀`;

    button.onclick =
      function () {
        const confirmed =
          window.confirm(
            [
              'Rollover Rehearsal을 종료합니다.',
              '',
              `${state.fromYear} production 상태로 복귀합니다.`,
              '계속하시겠습니까?'
            ].join('\n')
          );

        if (!confirmed) {
          return;
        }

        const result =
          window
            .stopAnnualRolloverRehearsalV35();

        ensureAnnualRehearsalUiV35();

        if (
          !result ||
          result.ok !== true
        ) {
          window.alert(
            [
              'Rehearsal 종료에 실패했습니다.',
              '',
              `Code: ${
                result &&
                result.code
                  ? result.code
                  : 'UNKNOWN'
              }`
            ].join('\n')
          );
        }
      };

    row.appendChild(
      text
    );

    row.appendChild(
      button
    );

    box.appendChild(
      row
    );

    return box;
  }

  function ensureAnnualRehearsalUiV35() {
    removeRehearsalUiV35();

    const host =
      uiHostV35();

    const content =
      document.getElementById(
        'content'
      );

    if (
      !host ||
      !content
    ) {
      return false;
    }

    const state =
      rehearsalStateV35();

    const ui =
      state
        ? buildActiveUiV35(
            state
          )
        : buildIdleUiV35();

    host.insertBefore(
      ui,
      content
    );

    return true;
  }

  function installAnnualRehearsalUiV35() {
    if (
      typeof window.render !==
        'function'
    ) {
      return false;
    }

    if (
      window.render
        .__annualRehearsalUiV35
    ) {
      ensureAnnualRehearsalUiV35();

      return true;
    }

    const before =
      window.render;

    function renderWithAnnualRehearsalUiV35() {
      const result =
        before.apply(
          this,
          arguments
        );

      ensureAnnualRehearsalUiV35();

      return result;
    }

    renderWithAnnualRehearsalUiV35
      .__annualRehearsalUiV35 =
        true;

    renderWithAnnualRehearsalUiV35
      .__beforeAnnualRehearsalUiV35 =
        before;

    window.render =
      renderWithAnnualRehearsalUiV35;

    ensureAnnualRehearsalUiV35();

    return true;
  }

  window.ensureAnnualRehearsalUiV35 =
    ensureAnnualRehearsalUiV35;

  window.installAnnualRehearsalUiV35 =
    installAnnualRehearsalUiV35;

  installAnnualRehearsalUiV35();
})();