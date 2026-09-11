//
// Portfolio Control v3.5
// Phase 8 - Annual Transition preparation UI.
//
// Patch 8D:
// - Overview preparation / preview panel
// - user confirmations
// - History / Backup shortcuts
// - no Annual Transition execution
// - no portfolio mutation / Save
//

(function () {
  const PANEL_ID =
    'annual-transition-panel-v35';

  const STYLE_ID =
    'annual-transition-style-v35';

  const confirmationState = {
    performanceSnapshot: false,
    growthDividendSnapshot: false,
    cashLikeSnapshot: false,
    backup: false
  };

  function escapeHtmlV35(value) {
    return String(
      value == null ? '' : value
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function installStyleV35() {
    if (
      document.getElementById(
        STYLE_ID
      )
    ) {
      return;
    }

    const style =
      document.createElement('style');

    style.id = STYLE_ID;

    style.textContent = `
      #${PANEL_ID} {
        margin-bottom: 18px;
        border: 1px solid rgba(148, 163, 184, 0.32);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.58);
        overflow: hidden;
      }

      #${PANEL_ID} .atv35-head {
        padding: 16px 18px 13px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.20);
      }

      #${PANEL_ID} .atv35-title {
        margin: 0;
        font-size: 17px;
        font-weight: 800;
        line-height: 1.35;
      }

      #${PANEL_ID} .atv35-desc {
        margin-top: 6px;
        font-size: 12px;
        line-height: 1.55;
        color: #94a3b8;
      }

      #${PANEL_ID} .atv35-body {
        padding: 14px 18px 17px;
      }

      #${PANEL_ID} .atv35-status {
        display: grid;
        gap: 7px;
        margin-bottom: 14px;
      }

      #${PANEL_ID} .atv35-status-row {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 13px;
        line-height: 1.45;
      }

      #${PANEL_ID} .atv35-ok {
        color: #86efac;
      }

      #${PANEL_ID} .atv35-block {
        color: #fca5a5;
      }

      #${PANEL_ID} .atv35-confirmations {
        display: grid;
        gap: 8px;
        margin: 13px 0 15px;
        padding-top: 13px;
        border-top: 1px solid rgba(148, 163, 184, 0.18);
      }

      #${PANEL_ID} .atv35-check {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 13px;
        line-height: 1.45;
        cursor: pointer;
      }

      #${PANEL_ID} .atv35-check input {
        flex: 0 0 auto;
        width: auto;
        min-width: 0;
        margin: 3px 0 0;
        padding: 0;
      }

      #${PANEL_ID} .atv35-check span {
        flex: 1 1 auto;
        min-width: 0;
        color: #e2e8f0;
        text-align: left;
      }

      #${PANEL_ID} .atv35-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      #${PANEL_ID} .atv35-btn {
        border: 1px solid rgba(148, 163, 184, 0.30);
        border-radius: 9px;
        padding: 8px 11px;
        background: rgba(30, 41, 59, 0.88);
        color: #e2e8f0;
        font: inherit;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }

      #${PANEL_ID} .atv35-btn:hover {
        background: rgba(51, 65, 85, 0.95);
      }

      #${PANEL_ID} .atv35-ready {
        margin-top: 14px;
        padding: 10px 12px;
        border-radius: 9px;
        color: #e2e8f0;
        font-size: 12px;
        line-height: 1.5;
        background: rgba(15, 23, 42, 0.72);
      }

      #${PANEL_ID} .v33-backup-meta {
        color: #cbd5e1;
      }

      @media (max-width: 700px) {
        #${PANEL_ID} {
          margin-bottom: 14px;
        }

        #${PANEL_ID} .atv35-head,
        #${PANEL_ID} .atv35-body {
          padding-left: 13px;
          padding-right: 13px;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  function statusLabelV35(check) {
    if (!check) {
      return '상태 확인 불가';
    }

    switch (check.id) {
      case 'nextYear':
        return check.ok
          ? '새 business year 확인'
          : '아직 Annual Transition 대상 연도가 아닙니다.';

      case 'productionClock':
        return check.ok
          ? 'Production clock'
          : 'DEV test clock이 활성화되어 있습니다.';

      case 'growth':
        if (check.ok) {
          return 'Growth 12월 마감 준비 완료';
        }

        if (
          check.code ===
          'GROWTH_DEC_NOT_READY'
        ) {
          const month =
            Number.isInteger(
              check.currentMonthIndex
            )
              ? check.currentMonthIndex + 1
              : '?';

          return (
            'Growth 월마감 필요' +
            ' (' +
            escapeHtmlV35(
              check.currentYear
            ) +
            '-' +
            escapeHtmlV35(month) +
            ')'
          );
        }

        return 'Growth 상태 확인 필요';

      case 'market':
        if (check.ok) {
          return (
            'Market ' +
            escapeHtmlV35(
              check.checked
            ) +
            '개 기준가 준비 완료'
          );
        }

        if (
          check.code ===
          'MARKET_YEAR_START_NOT_READY'
        ) {
          return (
            '새해 Market 기준가 대기 중' +
            ' (' +
            escapeHtmlV35(
              check.notReady
                ? check.notReady.length
                : 0
            ) +
            '개)'
          );
        }

        if (
          check.code ===
          'MARKET_ROWS_MISSING'
        ) {
          return (
            'Market 데이터 누락' +
            ' (' +
            escapeHtmlV35(
              check.missing
                ? check.missing.length
                : 0
            ) +
            '개)'
          );
        }

        return 'Market 기준가 확인 필요';

      default:
        return check.code || check.id;
    }
  }

  function systemChecksV35(
    result
  ) {
    const wanted =
      new Set([
        'nextYear',
        'productionClock',
        'growth',
        'market'
      ]);

    return result.checks.filter(
      function (check) {
        return wanted.has(check.id);
      }
    );
  }

  function renderStatusRowsV35(
    result
  ) {
    return systemChecksV35(result)
      .map(function (check) {
        const mark =
          check.ok ? '✓' : '✕';

        const cls =
          check.ok
            ? 'atv35-ok'
            : 'atv35-block';

        return (
          '<div class="atv35-status-row ' +
          cls +
          '">' +
          '<span>' +
          mark +
          '</span>' +
          '<span>' +
          statusLabelV35(check) +
          '</span>' +
          '</div>'
        );
      })
      .join('');
  }

  function confirmationHtmlV35(
    id,
    label
  ) {
    return (
      '<label class="atv35-check">' +
      '<input type="checkbox" ' +
      'data-atv35-confirm="' +
      id +
      '"' +
      (
        confirmationState[id]
          ? ' checked'
          : ''
      ) +
      '>' +
      '<span>' +
      label +
      '</span>' +
      '</label>'
    );
  }

  function renderPanelV35(
    page,
    status
  ) {
    installStyleV35();

    let panel =
      document.getElementById(
        PANEL_ID
      );

    if (!panel) {
      panel =
        document.createElement(
          'section'
        );

      panel.id = PANEL_ID;
      panel.className =
        'v33-section';

      page.insertBefore(
        panel,
        page.firstElementChild
      );
    }

    const result =
      window.annualTransitionPrerequisitesV35(
        confirmationState
      );

    const fromYear =
      result.fromYear;

    const toYear =
      result.toYear;

    panel.innerHTML =
      '<div class="atv35-head">' +
        '<h2 class="atv35-title">' +
          escapeHtmlV35(toYear) +
          ' Annual Transition' +
        '</h2>' +
        '<div class="atv35-desc">' +
          escapeHtmlV35(fromYear) +
          '년 데이터를 마감하고 ' +
          escapeHtmlV35(toYear) +
          '년 기준으로 전환하기 위한 준비 상태입니다.' +
        '</div>' +
      '</div>' +

      '<div class="atv35-body">' +
        '<div class="atv35-status">' +
          renderStatusRowsV35(
            result
          ) +
        '</div>' +

        '<div class="atv35-confirmations">' +
          confirmationHtmlV35(
            'performanceSnapshot',
            fromYear +
              ' 최종 Performance Snapshot을 저장했습니다.'
          ) +
          confirmationHtmlV35(
            'growthDividendSnapshot',
            fromYear +
              ' 최종 Growth & Dividend Snapshot을 저장했습니다.'
          ) +
          confirmationHtmlV35(
            'cashLikeSnapshot',
            fromYear +
              ' 최종 Cash-like Snapshot을 저장했습니다.'
          ) +
          confirmationHtmlV35(
            'backup',
            '복구용 Backup을 저장했습니다.'
          ) +
        '</div>' +

        '<div class="atv35-actions">' +
          '<button type="button" ' +
            'class="atv35-btn" ' +
            'data-atv35-action="history">' +
            'History 확인' +
          '</button>' +
          '<button type="button" ' +
            'class="atv35-btn" ' +
            'data-atv35-action="backup">' +
            'Backup 다운로드' +
          '</button>' +
        '</div>' +

        '<div class="atv35-ready">' +
          (
            result.ready
              ? '✓ 모든 prerequisite가 충족되었습니다.'
              : 'Annual Transition 실행 조건을 확인 중입니다.'
          ) +
        '</div>' +
      '</div>';

    panel
      .querySelectorAll(
        '[data-atv35-confirm]'
      )
      .forEach(function (input) {
        input.addEventListener(
          'change',
          function () {
            const id =
              input.getAttribute(
                'data-atv35-confirm'
              );

            confirmationState[id] =
              input.checked === true;

            renderPanelV35(
              page,
              status
            );
          }
        );
      });

    const historyButton =
      panel.querySelector(
        '[data-atv35-action="history"]'
      );

    if (historyButton) {
      historyButton.addEventListener(
        'click',
        function () {
          if (
            typeof window.selectFinalTabV33 ===
              'function'
          ) {
            window.selectFinalTabV33(
              'History'
            );
          }
        }
      );
    }

    const backupButton =
      panel.querySelector(
        '[data-atv35-action="backup"]'
      );

    if (backupButton) {
      backupButton.addEventListener(
        'click',
        function () {
          if (
            typeof window.exportData ===
              'function'
          ) {
            window.exportData();
          }
        }
      );
    }
  }

  function removePanelV35() {
    const panel =
      document.getElementById(
        PANEL_ID
      );

    if (panel) {
      panel.remove();
    }
  }

  function refreshAnnualTransitionUiV35() {
    if (
      typeof window.annualTransitionStatusV35 !==
        'function' ||
      typeof window.annualTransitionPrerequisitesV35 !==
        'function'
    ) {
      removePanelV35();
      return;
    }

    const status =
      window.annualTransitionStatusV35();

    if (
      !status ||
      status.transitionRequired !==
        true
    ) {
      removePanelV35();
      return;
    }

    const content =
      document.getElementById(
        'content'
      );

    const page =
      content &&
      content.querySelector(
        '.v33-dashboard-page'
      );

    if (!page) {
      removePanelV35();
      return;
    }

    renderPanelV35(
      page,
      status
    );
  }

  let refreshQueued = false;

  function queueRefreshV35() {
    if (refreshQueued) {
      return;
    }

    refreshQueued = true;

    requestAnimationFrame(
      function () {
        refreshQueued = false;
        refreshAnnualTransitionUiV35();
      }
    );
  }

  function startObserverV35() {
    const content =
      document.getElementById(
        'content'
      );

    if (!content) {
      return;
    }

const observer =
  new MutationObserver(
    queueRefreshV35
  );

observer.observe(
  content,
  {
    childList: true,
    subtree: false
  }
);

    queueRefreshV35();
  }

  if (
    document.readyState ===
      'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      startObserverV35,
      { once: true }
    );
  } else {
    startObserverV35();
  }

  const originalSetTestBusinessYearV35 =
  window.setTestBusinessYearV35;

if (
  typeof originalSetTestBusinessYearV35 ===
    'function'
) {
  window.setTestBusinessYearV35 =
    function () {
      const result =
        originalSetTestBusinessYearV35.apply(
          this,
          arguments
        );

      queueRefreshV35();

      return result;
    };
}

const originalClearTestBusinessYearV35 =
  window.clearTestBusinessYearV35;

if (
  typeof originalClearTestBusinessYearV35 ===
    'function'
) {
  window.clearTestBusinessYearV35 =
    function () {
      const result =
        originalClearTestBusinessYearV35.apply(
          this,
          arguments
        );

      queueRefreshV35();

      return result;
    };
}

  window.refreshAnnualTransitionUiV35 =
    queueRefreshV35;
})();