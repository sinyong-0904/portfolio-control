// Portfolio Control v3.5
// Editable Core Target strategy layer.
// v35-only: no shared v33 source modification.

(function () {
  const ORDER_V35 = [
    'NASDAQ',
    'S&P500',
    'US-CVD',
    'K-DVD',
    'BOND',
    'GOLD'
  ];

  const SLEEVE_DEFS_V35 = [
    {
      key: 'EQUITY',
      label: 'NASDAQ + S&P500',
      members: [
        'NASDAQ',
        'S&P500'
      ]
    },
    {
      key: 'INCOME',
      label: 'K-DVD + US-CVD',
      members: [
        'K-DVD',
        'US-CVD'
      ]
    },
    {
      key: 'HEDGE',
      label: 'GOLD + BOND',
      members: [
        'GOLD',
        'BOND'
      ]
    }
  ];

  let coreTargetDraftV35 = null;

  let baseOverviewViewV35 = null;
  let baseAllocationViewV35 = null;
  let baseStrategyViewV35 = null;

  function targetPercentV35(
    key
  ) {
    const value =
      Number(
        data &&
        data.targets &&
        data.targets[key] &&
        data.targets[key].target
      );

    return Number.isFinite(value)
      ? Math.round(
          value * 100
        )
      : 0;
  }

  function targetBandV35(
    key
  ) {
    const value =
      Number(
        data &&
        data.targets &&
        data.targets[key] &&
        data.targets[key].band
      );

    return Number.isFinite(value)
      ? value
      : 0.10;
  }

  function coreTargetSnapshotV35() {
    const result = {};

    ORDER_V35.forEach(
      key => {
        result[key] =
          targetPercentV35(
            key
          );
      }
    );

    return result;
  }

  function ensureCoreTargetDraftV35() {
    if (!coreTargetDraftV35) {
      coreTargetDraftV35 =
        coreTargetSnapshotV35();
    }

    return coreTargetDraftV35;
  }

  function coreTargetTotalV35() {
    const draft =
      ensureCoreTargetDraftV35();

    return ORDER_V35.reduce(
      (sum, key) =>
        sum +
        (
          Number(
            draft[key]
          ) || 0
        ),
      0
    );
  }

  function formatWeightV35(
    value
  ) {
    const n =
      Number(value);

    return Number.isFinite(n)
      ? `${(
          n * 100
        ).toFixed(2)}%`
      : 'n/a';
  }

  function formatGapV35(
    value
  ) {
    const n =
      Number(value);

    if (!Number.isFinite(n)) {
      return 'n/a';
    }

    const p =
      n * 100;

    return (
      `${p > 0 ? '+' : ''}` +
      `${p.toFixed(2)}%`
    );
  }

  function escapeV35(
    value
  ) {
    return String(
      value == null
        ? ''
        : value
    ).replace(
      /[&<>"']/g,
      char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]
    );
  }

  function dynamicCoreRowsV35() {
    let source = [];

    try {
      source =
        typeof coreAllocation ===
          'function'
          ? coreAllocation()
          : [];
    } catch (error) {
      console.error(
        '[v35] coreAllocation failed',
        error
      );
    }

    const byKey =
      Object.fromEntries(
        (source || []).map(
          row => [
            row.key,
            row
          ]
        )
      );

    return ORDER_V35.map(
      key => {
        const sourceRow =
          byKey[key] || {};

        const target =
          targetPercentV35(
            key
          ) / 100;

        const band =
          targetBandV35(
            key
          );

        const weight =
          Number(
            sourceRow.weight
          ) || 0;

        const low =
          target *
          (1 - band);

        const high =
          target *
          (1 + band);

        const relativeGap =
          target
            ? weight /
                target -
              1
            : 0;

        const status =
          weight < low
            ? 'UNDER'
            : weight > high
              ? 'OVER'
              : 'IN';

        return {
          key,
          target,
          band,
          weight,
          low,
          high,
          relativeGap,
          status
        };
      }
    );
  }

  function dynamicSleevesV35() {
    const rows =
      dynamicCoreRowsV35();

    const byKey =
      Object.fromEntries(
        rows.map(
          row => [
            row.key,
            row
          ]
        )
      );

    return SLEEVE_DEFS_V35.map(
      def => {
        const target =
          def.members.reduce(
            (sum, key) =>
              sum +
              (
                byKey[key]
                  ? byKey[key]
                      .target
                  : 0
              ),
            0
          );

        const weight =
          def.members.reduce(
            (sum, key) =>
              sum +
              (
                byKey[key]
                  ? byKey[key]
                      .weight
                  : 0
              ),
            0
          );

        return {
          ...def,
          target,
          weight,
          gap:
            weight -
            target
        };
      }
    );
  }

  function statusTextV35(
    row
  ) {
    if (
      row.key === 'BOND' &&
      row.status === 'UNDER'
    ) {
      return 'HEDGE 보충';
    }

    if (
      row.status === 'UNDER'
    ) {
      return '매수 우선';
    }

    if (
      row.status === 'OVER'
    ) {
      return '상단 초과';
    }

    return 'Band 내';
  }

  function coreTargetEditorHtmlV35() {
    const draft =
      ensureCoreTargetDraftV35();

    const total =
      coreTargetTotalV35();

    const valid =
      total === 100;

    const rows =
      ORDER_V35.map(
        key => {
          const target =
            Number(
              draft[key]
            ) || 0;

          const band =
            targetBandV35(
              key
            );

          return `
            <tr>
              <td>
                <b>
                  ${escapeV35(key)}
                </b>
              </td>

              <td>
                <div
                  style="
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    gap:8px;
                  "
                >
                  <button
                    type="button"
                    class="btn"
                    onclick="adjustCoreTargetV35('${escapeV35(
                      key
                    )}', -1)"
                  >
                    −
                  </button>

                  <strong
                    style="
                      min-width:64px;
                      text-align:center;
                      font-variant-numeric:
                        tabular-nums;
                    "
                  >
                    ${target.toFixed(0)}%
                  </strong>

                  <button
                    type="button"
                    class="btn"
                    onclick="adjustCoreTargetV35('${escapeV35(
                      key
                    )}', 1)"
                  >
                    +
                  </button>
                </div>
              </td>

              <td>
                ${(
                  band * 100
                ).toFixed(0)}%
              </td>
            </tr>
          `;
        }
      ).join('');

    return `
      <div
        id="core-target-editor-v35"
      >
        <div class="tableWrap">
          <table
            class="editTable mid"
          >
            <thead>
              <tr class="thead">
                <th>자산</th>
                <th>목표</th>
                <th>상대 Band</th>
              </tr>
            </thead>

            <tbody>
              ${rows}

              <tr class="totalRow">
                <td>
                  <b>합계</b>
                </td>

                <td>
                  <b
                    style="${
                      valid
                        ? ''
                        : 'color:#b42318'
                    }"
                  >
                    ${total.toFixed(0)}%
                  </b>
                </td>

                <td>
                  ${
                    valid
                      ? '저장 가능'
                      : '100% 필요'
                  }
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="actions"
          style="margin-top:10px"
        >
          <button
            type="button"
            class="btn primary"
            onclick="saveCoreTargetsV35()"
            ${
              valid
                ? ''
                : 'disabled'
            }
          >
            Core Target 저장
          </button>

          <button
            type="button"
            class="btn"
            onclick="resetCoreTargetDraftV35()"
          >
            변경 취소
          </button>
        </div>

        <div class="note">
          1회 클릭 = 1%p ·
          6개 Core 목표 합계가
          정확히 100%일 때만 저장됩니다.
          상대 Band 값은 기존 설정을
          그대로 유지합니다.
        </div>
      </div>
    `;
  }

  function patchStrategyHtmlV35(
    html
  ) {
    const root =
      document.createElement(
        'div'
      );

    root.innerHTML =
      html;

    const headings =
      Array.from(
        root.querySelectorAll(
          'h2'
        )
      );

    const heading =
      headings.find(
        item =>
          item.textContent
            .trim() ===
          'Core Target'
      );

    if (!heading) {
      console.warn(
        '[v35] Strategy Core Target anchor missing'
      );

      return html;
    }

    let node =
      heading.nextSibling;

    while (node) {
      const next =
        node.nextSibling;

      if (
        node.nodeType ===
          Node.ELEMENT_NODE &&
        node.tagName === 'H2'
      ) {
        break;
      }

      node.remove();
      node = next;
    }

    heading.insertAdjacentHTML(
      'afterend',
      coreTargetEditorHtmlV35()
    );

    return root.innerHTML;
  }

  function patchAllocationHtmlV35(
    html
  ) {
    const root =
      document.createElement(
        'div'
      );

    root.innerHTML =
      html;

    const rows =
      dynamicCoreRowsV35();

    const table =
      root.querySelector(
        '.v33-core-table'
      );

    if (table) {
      const bodyRows =
        Array.from(
          table.querySelectorAll(
            'tbody tr'
          )
        );

      bodyRows.forEach(
        tr => {
          const cells =
            tr.children;

          if (
            cells.length < 7
          ) {
            return;
          }

          const key =
            cells[0]
              .textContent
              .trim();

          const row =
            rows.find(
              item =>
                item.key === key
            );

          if (!row) {
            return;
          }

          cells[1].textContent =
            formatWeightV35(
              row.target
            );

          cells[2].textContent =
            formatWeightV35(
              row.weight
            );

          cells[3].textContent =
            formatGapV35(
              row.relativeGap
            );

          cells[4].textContent =
            formatWeightV35(
              row.low
            );

          cells[5].textContent =
            formatWeightV35(
              row.high
            );

          cells[6].innerHTML =
            `
              <span
                class="v33-band-pill ${
                  row.status
                    .toLowerCase()
                }"
              >
                ${escapeV35(
                  statusTextV35(
                    row
                  )
                )}
              </span>
            `;
        }
      );
    }

    const sleeves =
      dynamicSleevesV35();

    const sleeveCards =
      Array.from(
        root.querySelectorAll(
          '.v33-sleeve-card'
        )
      );

    sleeveCards.forEach(
      card => {
        const key =
          card.querySelector(
            '.v33-sleeve-top strong'
          )
            ?.textContent
            ?.trim();

        const sleeve =
          sleeves.find(
            item =>
              item.key === key
          );

        if (!sleeve) {
          return;
        }

        const target =
          card.querySelector(
            '.v33-sleeve-top span'
          );

        const composition =
          card.querySelector(
            '.v33-sleeve-composition'
          );

        const value =
          card.querySelector(
            '.v33-sleeve-value'
          );

        const gap =
          card.querySelector(
            '.v33-sleeve-gap'
          );

        if (target) {
          target.textContent =
            `목표 ${formatWeightV35(
              sleeve.target
            )}`;
        }

        if (composition) {
          composition.textContent =
            sleeve.label;
        }

        if (value) {
          value.textContent =
            formatWeightV35(
              sleeve.weight
            );
        }

        if (gap) {
          gap.classList.remove(
            'over',
            'under'
          );

          if (
            sleeve.gap > 0
          ) {
            gap.classList.add(
              'over'
            );
          } else if (
            sleeve.gap < 0
          ) {
            gap.classList.add(
              'under'
            );
          }

          gap.textContent =
            (
              '목표 대비 ' +
              (
                sleeve.gap > 0
                  ? '+'
                  : ''
              ) +
              (
                sleeve.gap *
                100
              ).toFixed(2) +
              '%p'
            );
        }
      }
    );

    const coreSection =
      Array.from(
        root.querySelectorAll(
          '.v33-section'
        )
      ).find(
        section =>
          section.querySelector(
            'h2'
          )
            ?.textContent
            ?.trim() ===
          'Core Allocation'
      );

    const note =
      coreSection
        ? coreSection.querySelector(
            '.v33-dashboard-note'
          )
        : null;

    if (note) {
      note.textContent =
        (
          '역할이 같은 Core 자산을 ' +
          'Sleeve로 묶어 ' +
          sleeves.map(
            item =>
              `${item.key} ${(
                item.target *
                100
              ).toFixed(0)}%`
          ).join(' / ') +
          '를 상위 목표로 확인합니다. ' +
          '개별 Core의 실제 매수 판단은 ' +
          '왼쪽 목표 대비 Band를 ' +
          '우선 사용합니다.'
        );
    }

    return root.innerHTML;
  }

  function rulePrimaryHtmlV35(
    under
  ) {
    if (under.length) {
      return `
        <div
          class="v33-rule-result attention"
        >
          <span>
            신규자금 우선 후보
          </span>

          <strong>
            ${
              under.map(
                row =>
                  escapeV35(
                    row.key ===
                      'BOND'
                      ? 'HEDGE'
                      : row.key
                  )
              ).join(' · ')
            }
          </strong>

          <small>
            개별 Core의 목표 대비
            relative band 기준
          </small>
        </div>
      `;
    }

    return `
      <div
        class="v33-rule-result ok"
      >
        <span>
          Core Allocation
        </span>

        <strong>
          강제매수 대상 없음
        </strong>

        <small>
          6개 Core 자산이 모두
          목표 band 안에 있음
        </small>
      </div>
    `;
  }

  function ruleOverHtmlV35(
    over
  ) {
    return `
      <div
        class="v33-rule-mini"
      >
        <span>
          상단 초과
        </span>

        <b>
          ${
            over.length
              ? over.map(
                  row =>
                    escapeV35(
                      row.key
                    )
                ).join(' · ')
              : '없음'
          }
        </b>
      </div>
    `;
  }

  function patchOverviewHtmlV35(
    html
  ) {
    const root =
      document.createElement(
        'div'
      );

    root.innerHTML =
      html;

    const rows =
      dynamicCoreRowsV35();

    const under =
      rows
        .filter(
          row =>
            row.status ===
            'UNDER'
        )
        .sort(
          (a, b) =>
            a.relativeGap -
            b.relativeGap
        );

    const over =
      rows
        .filter(
          row =>
            row.status ===
            'OVER'
        )
        .sort(
          (a, b) =>
            b.relativeGap -
            a.relativeGap
        );

    const ruleSection =
      Array.from(
        root.querySelectorAll(
          '.v33-section'
        )
      ).find(
        section =>
          section.querySelector(
            'h2'
          )
            ?.textContent
            ?.trim() ===
          'Today / Rule Check'
      );

    const grid =
      ruleSection
        ? ruleSection.querySelector(
            '.v33-rule-grid'
          )
        : null;

    if (!grid) {
      console.warn(
        '[v35] Today / Rule Check anchor missing'
      );

      return html;
    }

    const existing =
      Array.from(
        grid.children
      );

    const stress =
      existing.length >= 3
        ? existing[2]
            .outerHTML
        : '';

    grid.innerHTML =
      (
        rulePrimaryHtmlV35(
          under
        ) +
        ruleOverHtmlV35(
          over
        ) +
        stress
      );

    return root.innerHTML;
  }

  function strategyViewV35() {
    return patchStrategyHtmlV35(
      baseStrategyViewV35()
    );
  }

  function allocationViewV35() {
    return patchAllocationHtmlV35(
      baseAllocationViewV35()
    );
  }

  function overviewViewV35() {
    return patchOverviewHtmlV35(
      baseOverviewViewV35()
    );
  }

  function installCoreTargetViewsV35() {
    if (
      typeof views ===
        'undefined' ||
      !views ||
      typeof views !==
        'object'
    ) {
      return false;
    }

    if (
      typeof views.Overview !==
        'function' ||
      typeof views.Allocation !==
        'function' ||
      typeof views.Strategy !==
        'function'
    ) {
      return false;
    }

    if (
      views.Overview ===
        overviewViewV35 &&
      views.Allocation ===
        allocationViewV35 &&
      views.Strategy ===
        strategyViewV35
    ) {
      return true;
    }

    baseOverviewViewV35 =
      views.Overview;

    baseAllocationViewV35 =
      views.Allocation;

    baseStrategyViewV35 =
      views.Strategy;

    views.Overview =
      overviewViewV35;

    views.Allocation =
      allocationViewV35;

    views.Strategy =
      strategyViewV35;

    return true;
  }

  function adjustCoreTargetV35(
    key,
    delta
  ) {
    if (
      !ORDER_V35.includes(
        key
      )
    ) {
      return false;
    }

    const draft =
      ensureCoreTargetDraftV35();

    const current =
      Number(
        draft[key]
      ) || 0;

    const next =
      Math.max(
        0,
        Math.min(
          100,
          current +
          Number(
            delta
          )
        )
      );

    draft[key] =
      Math.round(
        next
      );

    render();

    return true;
  }

  function resetCoreTargetDraftV35() {
    coreTargetDraftV35 =
      null;

    render();

    return true;
  }

  function saveCoreTargetsV35() {
    const draft =
      ensureCoreTargetDraftV35();

    if (
      coreTargetTotalV35() !==
        100
    ) {
      alert(
        'Core Target 합계를 100%로 맞춰주세요.'
      );

      return false;
    }

    const valid =
      ORDER_V35.every(
        key => {
          const value =
            Number(
              draft[key]
            );

          return (
            Number.isInteger(
              value
            ) &&
            value >= 0 &&
            value <= 100
          );
        }
      );

    if (!valid) {
      alert(
        'Core Target 값이 올바르지 않습니다.'
      );

      return false;
    }

    ORDER_V35.forEach(
      key => {
        if (
          !data.targets[key] ||
          typeof data.targets[key] !==
            'object'
        ) {
          data.targets[key] = {
            target: 0,
            band: 0.10
          };
        }

        data.targets[key]
          .target =
            draft[key] /
            100;
      }
    );

    coreTargetDraftV35 =
      null;

    save();

    return true;
  }

  function wrapFinalViewsInstallerV35() {
    if (
        typeof window.installFinalViewsV33 !==
        'function'
    ) {
        return false;
    }

    if (
        window
        .installFinalViewsV33
        .__coreTargetWrappedV35
    ) {
        return true;
    }

    const before =
        window.installFinalViewsV33;

    const wrapped =
        function () {
        const result =
            before.apply(
            this,
            arguments
            );

        installCoreTargetViewsV35();

        return result;
        };

    wrapped
        .__coreTargetWrappedV35 =
        true;

    window.installFinalViewsV33 =
        wrapped;

    return true;
  }

  function installCoreTargetAfterBootV35() {
    installCoreTargetViewsV35();

    requestAnimationFrame(
        function () {
        installCoreTargetViewsV35();

        if (
            typeof render ===
            'function'
        ) {
            render();
        }
        }
    );
  }

  window.adjustCoreTargetV35 =
    adjustCoreTargetV35;

  window.resetCoreTargetDraftV35 =
    resetCoreTargetDraftV35;

  window.saveCoreTargetsV35 =
    saveCoreTargetsV35;

  window.dynamicCoreRowsV35 =
    dynamicCoreRowsV35;

  window.installCoreTargetViewsV35 =
    installCoreTargetViewsV35;

  installCoreTargetViewsV35();
    wrapFinalViewsInstallerV35();

    if (
    document.readyState ===
        'complete'
    ) {
    installCoreTargetAfterBootV35();
    } else {
    window.addEventListener(
        'load',
        installCoreTargetAfterBootV35,
        {
        once: true
        }
    );
    }

    console.info(
    '[Portfolio Control] v3.5 Core Target editor loaded'
    );
})();