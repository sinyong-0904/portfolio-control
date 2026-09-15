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

  let previewStateV35 =
    null;

  let executionStateV35 =
    null;

  let executionBusyV35 =
    false;

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

      #${PANEL_ID} .atv35-btn:not(:disabled):hover {
        background: rgba(51, 65, 85, 0.95);
      }

      #${PANEL_ID} .atv35-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
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

    function productionSystemReadyV35(
    result
  ) {
    if (
      !result ||
      !Array.isArray(
        result.checks
      )
    ) {
      return false;
    }

    const wanted =
      new Set([
        'years',
        'nextYear',
        'productionClock',
        'growth',
        'market'
      ]);

    return result.checks
      .filter(function (check) {
        return wanted.has(
          check.id
        );
      })
      .every(function (check) {
        return check.ok === true;
      });
  }

    function previewComparableStateV35(
    value
  ) {
    const copy =
      value == null
        ? value
        : JSON.parse(
            JSON.stringify(value)
          );

    if (
      copy &&
      copy.meta &&
      typeof copy.meta ===
        'object'
    ) {
      delete copy.meta
        .lastSavedAt;
    }

    if (
      copy &&
      copy.history &&
      typeof copy.history ===
        'object'
    ) {
      delete copy.history
        .selectedYear;
    }

    return copy;
  }

  function previewMatchesCurrentStateV35() {
    if (
      !previewStateV35 ||
      !previewStateV35
        .sourceState ||
      typeof window
        .annualStatesEqualV35 !==
        'function'
    ) {
      return false;
    }

    return window
      .annualStatesEqualV35(
        previewComparableStateV35(
          previewStateV35
            .sourceState
        ),
        previewComparableStateV35(
          data
        )
      );
  }

  function buildProductionPreviewV35(
    fromYear,
    toYear
  ) {
    try {
      const sourceState =
        JSON.parse(
          JSON.stringify(data)
        );

      const built =
        window
          .buildAnnualTransitionCandidateV35(
            fromYear,
            toYear
          );

      const validation =
        window
          .validateAnnualTransitionCandidateV35(
            built
          );

      return {
        ok:
          !!validation &&
          validation.ok === true,

        code:
          validation &&
          validation.ok === true
            ? 'PREVIEW_READY'
            : 'PREVIEW_VALIDATION_FAILED',

        fromYear,
        toYear,
        sourceState,

        checkCount:
          validation &&
          Array.isArray(
            validation.checks
          )
            ? validation.checks.length
            : 0,

        failed:
          validation &&
          Array.isArray(
            validation.checks
          )
            ? validation.checks
                .filter(function (check) {
                  return check.ok !== true;
                })
                .map(function (check) {
                  return check.id;
                })
            : []
      };
    } catch (error) {
      return {
        ok: false,
        code:
          'PREVIEW_BUILD_FAILED',

        fromYear,
        toYear,

        error:
          String(
            error &&
            error.message
              ? error.message
              : error
          )
      };
    }
  }

  function setExecutionOverlayV35(
    visible,
    text
  ) {
    const id =
      'annual-transition-overlay-v35';

    const existing =
      document.getElementById(
        id
      );

    if (!visible) {
      if (existing) {
        existing.remove();
      }

      return;
    }

    const overlay =
      existing ||
      document.createElement(
        'div'
      );

    overlay.id =
      id;

    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:99999',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:24px',
      'background:rgba(2,6,23,.82)',
      'backdrop-filter:blur(3px)'
    ].join(';');

    overlay.innerHTML =
      '<div style="' +
        'max-width:520px;' +
        'padding:22px 24px;' +
        'border:1px solid rgba(148,163,184,.35);' +
        'border-radius:14px;' +
        'background:#0f172a;' +
        'color:#e2e8f0;' +
        'text-align:center;' +
      '">' +
        '<div style="' +
          'font-size:17px;' +
          'font-weight:900;' +
          'margin-bottom:8px;' +
        '">' +
          'Annual Transition 실행 중' +
        '</div>' +
        '<div style="' +
          'font-size:13px;' +
          'line-height:1.6;' +
          'color:#cbd5e1;' +
        '">' +
          escapeHtmlV35(
            text ||
            'Supabase 저장 및 read-back을 검증하고 있습니다.'
          ) +
        '</div>' +
        '<div style="' +
          'margin-top:10px;' +
          'font-size:12px;' +
          'color:#fbbf24;' +
        '">' +
          '완료될 때까지 페이지를 닫거나 다른 작업을 하지 마세요.' +
        '</div>' +
      '</div>';

    if (!existing) {
      document.body.appendChild(
        overlay
      );
    }
  }

  function executionMessageV35(
    state
  ) {
    if (!state) {
      return '';
    }

    if (state.ok === true) {
      return (
        '✓ Annual Transition commit 및 cloud read-back 검증이 완료되었습니다.'
      );
    }

    if (
      state.code ===
      'CRITICAL_ROLLBACK_FAILED'
    ) {
      return (
        'CRITICAL — 자동 rollback을 검증하지 못했습니다. ' +
        '추가 저장을 하지 말고 Backup 및 cloud 상태를 확인하십시오.'
      );
    }

    return (
      'Annual Transition 실패: ' +
      String(
        state.code ||
        'UNKNOWN'
      )
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

      panel.id =
        PANEL_ID;

      panel.className =
        'v33-section';

      page.insertBefore(
        panel,
        page.firstElementChild
      );
    }

    const result =
      window
        .annualTransitionPrerequisitesV35(
          confirmationState
        );

    const fromYear =
      result.fromYear;

    const toYear =
      result.toYear;

    const systemReady =
      productionSystemReadyV35(
        result
      );

    const previewReady =
      previewStateV35 &&
      previewStateV35.ok === true &&
      Number(
        previewStateV35.fromYear
      ) === Number(fromYear) &&
      Number(
        previewStateV35.toYear
      ) === Number(toYear) &&
      previewMatchesCurrentStateV35();

    const executeReady =
      result.ready === true &&
      previewReady &&
      !executionBusyV35;

    const previewHtml =
      previewStateV35
        ? (
            '<div class="atv35-ready">' +
              (
                previewStateV35.ok
                  ? (
                      '✓ Preview validation PASS · ' +
                      escapeHtmlV35(
                        previewStateV35
                          .checkCount
                      ) +
                      ' checks'
                    )
                  : (
                      '✕ Preview 실패 · ' +
                      escapeHtmlV35(
                        previewStateV35
                          .code
                      ) +
                      (
                        previewStateV35.error
                          ? (
                              ' · ' +
                              escapeHtmlV35(
                                previewStateV35
                                  .error
                              )
                            )
                          : ''
                      )
                    )
              ) +
            '</div>'
          )
        : '';

    const executionHtml =
      executionStateV35
        ? (
            '<div class="atv35-ready ' +
              (
                executionStateV35.code ===
                  'CRITICAL_ROLLBACK_FAILED'
                  ? 'atv35-block'
                  : (
                      executionStateV35.ok
                        ? 'atv35-ok'
                        : ''
                    )
              ) +
            '">' +
              escapeHtmlV35(
                executionMessageV35(
                  executionStateV35
                )
              ) +
            '</div>'
          )
        : '';

    panel.innerHTML =
      '<div class="atv35-head">' +
        '<h2 class="atv35-title">' +
          escapeHtmlV35(
            toYear
          ) +
          ' Annual Transition' +
        '</h2>' +

        '<div class="atv35-desc">' +
          escapeHtmlV35(
            fromYear
          ) +
          '년 데이터를 마감하고 ' +
          escapeHtmlV35(
            toYear
          ) +
          '년 기준으로 전환합니다. ' +
          'Preview → 최종 확인 → Execute 순서로 진행합니다.' +
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
              ' 최종 Performance Snapshot을 확인했습니다.'
          ) +

          confirmationHtmlV35(
            'growthDividendSnapshot',
            fromYear +
              ' 최종 Growth & Dividend Snapshot을 확인했습니다.'
          ) +

          confirmationHtmlV35(
            'cashLikeSnapshot',
            fromYear +
              ' 최종 Cash-like Snapshot을 확인했습니다.'
          ) +

          confirmationHtmlV35(
            'backup',
            '복구용 Backup을 다운로드했습니다.'
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

          '<button type="button" ' +
            'class="atv35-btn" ' +
            'data-atv35-action="preview"' +
            (
              systemReady &&
              !executionBusyV35
                ? ''
                : ' disabled'
            ) +
          '>' +
            'Transition Preview' +
          '</button>' +

          '<button type="button" ' +
            'class="atv35-btn" ' +
            'data-atv35-action="execute"' +
            (
              executeReady
                ? ''
                : ' disabled'
            ) +
          '>' +
            (
              executionBusyV35
                ? '실행 중...'
                : 'Execute Annual Transition'
            ) +
          '</button>' +
        '</div>' +

        '<div class="atv35-ready">' +
          (
            result.ready
              ? (
                  previewReady
                    ? '✓ 모든 prerequisite와 Preview가 완료되었습니다. Execute할 수 있습니다.'
                    : '✓ prerequisite 완료. Transition Preview를 실행하십시오.'
                )
              : (
                  systemReady
                    ? '사용자 확인 4개를 완료하십시오.'
                    : 'System prerequisite가 아직 준비되지 않았습니다.'
                )
          ) +
        '</div>' +

        previewHtml +
        executionHtml +
      '</div>';

    panel
      .querySelectorAll(
        '[data-atv35-confirm]'
      )
      .forEach(
        function (input) {
          input.addEventListener(
            'change',
            function () {
              const id =
                input.getAttribute(
                  'data-atv35-confirm'
                );

              confirmationState[id] =
                input.checked === true;

              executionStateV35 =
                null;

              renderPanelV35(
                page,
                status
              );
            }
          );
        }
      );

    const historyButton =
      panel.querySelector(
        '[data-atv35-action="history"]'
      );

    if (historyButton) {
      historyButton.addEventListener(
        'click',
        function () {
          if (
            typeof window
              .selectFinalTabV33 ===
              'function'
          ) {
            window
              .selectFinalTabV33(
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
            typeof window
              .exportData ===
              'function'
          ) {
            window.exportData();

            confirmationState
              .backup =
                true;

            renderPanelV35(
              page,
              status
            );
          }
        }
      );
    }

    const previewButton =
      panel.querySelector(
        '[data-atv35-action="preview"]'
      );

    if (previewButton) {
      previewButton.addEventListener(
        'click',
        function () {
          previewStateV35 =
            buildProductionPreviewV35(
              fromYear,
              toYear
            );

          executionStateV35 =
            null;

          renderPanelV35(
            page,
            status
          );
        }
      );
    }

    const executeButton =
      panel.querySelector(
        '[data-atv35-action="execute"]'
      );

    if (executeButton) {
      executeButton.addEventListener(
        'click',
        async function () {
          if (
            !executeReady ||
            executionBusyV35
          ) {
            return;
          }

                    if (
            !previewMatchesCurrentStateV35()
          ) {
            previewStateV35 =
              null;

            confirmationState
              .performanceSnapshot =
                false;

            confirmationState
              .growthDividendSnapshot =
                false;

            confirmationState
              .cashLikeSnapshot =
                false;

            confirmationState
              .backup =
                false;

            executionStateV35 = {
              ok: false,
              code:
                'PREVIEW_STALE'
            };

            renderPanelV35(
              page,
              status
            );

            window.alert(
              [
                'Preview 이후 portfolio state가 변경되었습니다.',
                '',
                'Transition Preview와 4개 확인을 다시 수행하십시오.'
              ].join('\n')
            );

            return;
          }

          const confirmed =
            window.confirm(
              [
                `${fromYear} → ${toYear} Annual Transition을 실행합니다.`,
                '',
                '이 작업은 portfolio_state를 실제로 변경하고 Supabase에 저장합니다.',
                '실행 후 cloud read-back까지 검증합니다.',
                '',
                'Backup 파일을 보관하고 있는지 다시 확인하십시오.',
                '',
                '계속하시겠습니까?'
              ].join('\n')
            );

          if (!confirmed) {
            return;
          }

          executionBusyV35 =
            true;

          executionStateV35 =
            null;

          renderPanelV35(
            page,
            status
          );

          setExecutionOverlayV35(
            true,
            'Portfolio state를 전환하고 Supabase 저장 결과를 확인하고 있습니다.'
          );

          let execution;

          try {
            execution =
              await window
                .executeProductionAnnualTransitionV35({
                  fromYear,
                  toYear,

                  confirmations: {
                    performanceSnapshot:
                      confirmationState
                        .performanceSnapshot,

                    growthDividendSnapshot:
                      confirmationState
                        .growthDividendSnapshot,

                    cashLikeSnapshot:
                      confirmationState
                        .cashLikeSnapshot,

                    backup:
                      confirmationState
                        .backup
                  }
                });
          } catch (error) {
            execution = {
              ok: false,

              code:
                'ANNUAL_UI_EXECUTION_EXCEPTION',

              error:
                String(
                  error &&
                  error.message
                    ? error.message
                    : error
                )
            };
          } finally {
            executionBusyV35 =
              false;

            setExecutionOverlayV35(
              false
            );
          }

          executionStateV35 =
            execution;

          if (
            execution &&
            execution.ok === true
          ) {
            window.alert(
              [
                `${toYear} Annual Transition 완료`,
                '',
                'Supabase commit 및 read-back 검증이 완료되었습니다.',
                '',
                '이제 Ctrl+F5 후 Performance / Allocation / Cash / Dividend / History / Growth를 확인하십시오.'
              ].join('\n')
            );

            queueRefreshV35();

            return;
          }

          if (
            execution &&
            execution.code ===
              'CRITICAL_ROLLBACK_FAILED'
          ) {
            window.alert(
              [
                'CRITICAL — Annual Transition 자동 복구를 검증하지 못했습니다.',
                '',
                '추가 Save를 하지 마십시오.',
                '페이지를 닫거나 새로고침하기 전에 Backup 및 cloud 상태를 확인해야 합니다.',
                '',
                'Code: CRITICAL_ROLLBACK_FAILED'
              ].join('\n')
            );
          } else {
            window.alert(
              [
                'Annual Transition이 완료되지 않았습니다.',
                '',
                'Code: ' +
                  String(
                    execution &&
                    execution.code
                      ? execution.code
                      : 'UNKNOWN'
                  ),
                '',
                '검증된 commit이 아니므로 상태를 확인한 뒤 다시 진행하십시오.'
              ].join('\n')
            );
          }

          renderPanelV35(
            page,
            status
          );
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
      typeof window
        .annualRolloverRehearsalStateV35 ===
        'function' &&
      window
        .annualRolloverRehearsalStateV35()
    ) {
      removePanelV35();
      return;
    }

    if (
      typeof window
        .annualTransitionStatusV35 !==
        'function' ||
      typeof window
        .annualTransitionPrerequisitesV35 !==
        'function'
    ) {
      removePanelV35();
      return;
    }

    const status =
      window
        .annualTransitionStatusV35();

    if (
      !status ||
      status.transitionRequired !==
        true
    ) {
      previewStateV35 =
        null;

      executionStateV35 =
        null;

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