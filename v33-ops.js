// Portfolio Control v3.3 - Operations layer
// Table Memo / Strategy Notes / Growth month-close
// Save & DB feedback / Backup metadata
//
// Load LAST after v33-history-sticky-fix.js.

(function () {
  'use strict';

  let applyQueuedV33Ops = false;
  let lastSaveStatusV33 = '';
  let lastDbStatusV33 = '';


  function nowIsoV33() {
    return new Date().toISOString();
  }


  function ensureOpsDataV33() {
    if (
      typeof data === 'undefined' ||
      !data
    ) {
      return false;
    }

    let changed = false;


    if (
      !data.tableMemos ||
      typeof data.tableMemos !== 'object' ||
      Array.isArray(data.tableMemos)
    ) {
      data.tableMemos = {};
      changed = true;
    }


    if (
      !data.meta ||
      typeof data.meta !== 'object' ||
      Array.isArray(data.meta)
    ) {
      data.meta = {};
      changed = true;
    }


    if (
      typeof data.strategyNotes === 'string'
    ) {
      data.strategyNotes = {
        text: data.strategyNotes,
        updatedAt: null
      };

      changed = true;

    } else if (
      !data.strategyNotes ||
      typeof data.strategyNotes !== 'object' ||
      Array.isArray(data.strategyNotes)
    ) {
      data.strategyNotes = {
        text: '',
        updatedAt: null
      };

      changed = true;

    } else if (
      typeof data.strategyNotes.text !== 'string'
    ) {
      const legacy = [
        data.strategyNotes.content,
        data.strategyNotes.note,
        data.strategyNotes.strategy,
        data.strategyNotes.todo
      ]
        .filter(
          value =>
            typeof value === 'string' &&
            value.trim()
        );

      data.strategyNotes.text =
        legacy.join('\n\n');

      data.strategyNotes.updatedAt =
        data.strategyNotes.updatedAt ||
        null;

      changed = true;
    }


    return changed;
  }


  function persistLocalOnlyV33() {
    try {
      if (
        typeof KEY !== 'undefined' &&
        typeof data !== 'undefined'
      ) {
        localStorage.setItem(
          KEY,
          JSON.stringify(data)
        );
      }

    } catch (e) {
      console.warn(
        '[v33 ops] local persistence failed',
        e
      );
    }
  }


  function saveDataV33() {
    ensureOpsDataV33();

    try {
      if (
        typeof save === 'function'
      ) {
        save();
        return;
      }

    } catch (e) {
      console.warn(
        '[v33 ops] save() failed',
        e
      );
    }


    persistLocalOnlyV33();


    try {
      if (
        typeof scheduleCloudSave === 'function' &&
        typeof cloudReady !== 'undefined' &&
        cloudReady
      ) {
        scheduleCloudSave();
      }

    } catch (e) {
      console.warn(
        '[v33 ops] cloud scheduling failed',
        e
      );
    }
  }


  function fmtDateTimeV33(value) {
    if (!value) {
      return '없음';
    }

    const d =
      new Date(value);

    if (
      !Number.isFinite(
        d.getTime()
      )
    ) {
      return String(value);
    }

    return d.toLocaleString(
      'ko-KR',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
    );
  }


  function fmtShortTimeV33(value) {
    if (!value) {
      return '';
    }

    const d =
      new Date(value);

    if (
      !Number.isFinite(
        d.getTime()
      )
    ) {
      return '';
    }

    return d.toLocaleTimeString(
      'ko-KR',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
    );
  }


  function normalizeKeyV33(value) {
    return String(
      value ?? ''
    )
      .replace(
        /\s+/g,
        ' '
      )
      .trim()
      .replace(
        /[^0-9A-Za-z가-힣&+()\-_. ]/g,
        ''
      )
      .slice(
        0,
        80
      );
  }


  function activeTabV33Ops() {
    const active =
      document.querySelector(
        '[data-v33-final-tab][aria-selected="true"], ' +
        '[data-v33-final-tab].active, ' +
        '[data-v33-final-tab].selected'
      );

    return normalizeKeyV33(
      active?.dataset?.v33FinalTab ||
      active?.textContent ||
      'Unknown'
    );
  }

   function sectionLabelV33(table) {
    let node =
      table.closest(
        'section, .card, .panel, .box, ' +
        '.v33-merged-section, ' +
        '.v33-history-subsection'
      );

    if (node) {
      const heading =
        node.querySelector(
          ':scope > h2, :scope > h3, ' +
          ':scope > .v33-merged-heading h2, ' +
          ':scope > .v33-section-heading h2'
        );

      if (heading?.textContent?.trim()) {
        return normalizeKeyV33(
          heading.textContent
        );
      }
    }

    return 'Table';
  }


  function tableHeadersV33(table) {
    return Array.from(
      table.querySelectorAll(
        'thead th'
      )
    )
      .slice(0, 4)
      .map(
        th =>
          normalizeKeyV33(
            th.textContent
          )
      )
      .filter(Boolean)
      .join('|');
  }


  function tableMemoKeyV33(
    table,
    index
  ) {
    if (
      table.dataset.v33MemoKey
    ) {
      return table.dataset.v33MemoKey;
    }

    const tab =
      activeTabV33Ops();

    const section =
      sectionLabelV33(table);

    const headers =
      tableHeadersV33(table) ||
      `table-${index + 1}`;

    const key =
      `${tab}::${section}::${headers}`
        .slice(0, 240);

    table.dataset.v33MemoKey =
      key;

    return key;
  }


  function memoRecordV33(key) {
    ensureOpsDataV33();

    const raw =
      data.tableMemos[key];

    if (
      typeof raw === 'string'
    ) {
      data.tableMemos[key] = {
        text: raw,
        updatedAt: null
      };

      return data.tableMemos[key];
    }

    if (
      !raw ||
      typeof raw !== 'object'
    ) {
      data.tableMemos[key] = {
        text: '',
        updatedAt: null
      };
    }

    return data.tableMemos[key];
  }


  function shouldHaveMemoV33(table) {
    if (
      !table ||
      table.closest(
        '[role="dialog"], ' +
        '.modal, .mobileModal, .tableModal'
      )
    ) {
      return false;
    }

    if (
      table.closest(
        '.v33-master-editor-hidden'
      )
    ) {
      return false;
    }

    if (
      table.classList.contains(
        'v33-no-table-memo'
      )
    ) {
      return false;
    }

    const rows =
      table.querySelectorAll(
        'tbody tr'
      ).length;

    return rows > 0;
  }


  function updateMemoTimestampV33(
    memo,
    value
  ) {
    const el =
      memo?.querySelector(
        '.v33-table-memo-updated'
      );

    if (!el) {
      return;
    }

    el.textContent =
      value
        ? `수정 ${fmtDateTimeV33(value)}`
        : '';
  }


  function addTableMemosV33() {
    if (
      typeof data === 'undefined'
    ) {
      return;
    }

    ensureOpsDataV33();

    const tables =
      Array.from(
        document.querySelectorAll(
          'table'
        )
      )
        .filter(
          shouldHaveMemoV33
        );

    tables.forEach(
      (table, index) => {
        const wrap =
          table.closest(
            '.tableWrap, ' +
            '.v33-inline-table-wrap'
          ) ||
          table.parentElement;

        if (!wrap) {
          return;
        }

        const key =
          tableMemoKeyV33(
            table,
            index
          );

        const record =
          memoRecordV33(key);

        let memo =
          wrap.nextElementSibling;

        if (
          !memo ||
          !memo.classList.contains(
            'v33-table-memo'
          ) ||
          memo.dataset.memoKey !== key
        ) {
          memo =
            document.createElement(
              'div'
            );

          memo.className =
            'v33-table-memo';

          memo.dataset.memoKey =
            key;

          wrap.insertAdjacentElement(
            'afterend',
            memo
          );
        }

        if (
          !memo.dataset.ready
        ) {
          memo.innerHTML = `
            <div class="v33-table-memo-head">
              <span>Table Memo</span>
              <small class="v33-table-memo-updated"></small>
            </div>

            <textarea
              class="v33-table-memo-input"
              placeholder="이 숫자가 왜 이렇게 됐는지 메모"
            ></textarea>
          `;

          const textarea =
            memo.querySelector(
              'textarea'
            );

          textarea.addEventListener(
            'change',
            () => {
              const item =
                memoRecordV33(key);

              item.text =
                textarea.value;

              item.updatedAt =
                nowIsoV33();

              updateMemoTimestampV33(
                memo,
                item.updatedAt
              );

              saveDataV33();
            }
          );

          memo.dataset.ready =
            '1';
        }

        const textarea =
          memo.querySelector(
            'textarea'
          );

        if (
          textarea &&
          document.activeElement !== textarea &&
          textarea.value !==
            String(
              record.text || ''
            )
        ) {
          textarea.value =
            String(
              record.text || ''
            );
        }

        updateMemoTimestampV33(
          memo,
          record.updatedAt
        );
      }
    );
  }


  // ============================================================
  // Strategy
  // ============================================================

  function isStrategyTabV33() {
    return (
      activeTabV33Ops() ===
      'Strategy'
    );
  }


  function findMasterEditorBlockV33() {
    if (!isStrategyTabV33()) {
      return null;
    }

    const nodes =
      Array.from(
        document.querySelectorAll(
          'h1,h2,h3,h4,summary,label,legend,div,span'
        )
      );

    const marker =
      nodes.find(
        el => {
          const text =
            String(
              el.textContent || ''
            )
              .replace(/\s+/g, ' ')
              .trim();

          return text.startsWith(
            '종목 기준정보 편집'
          );
        }
      );

    if (!marker) {
      return null;
    }

    const direct =
      marker.closest(
        'details, fieldset, .card, .panel, ' +
        '.box, .setting, .settings, .section'
      );

    if (
      direct &&
      direct.querySelector(
        'table,input,select,textarea,button'
      )
    ) {
      return direct;
    }

    let cursor =
      marker.parentElement;

    for (
      let i = 0;
      cursor && i < 4;
      i += 1,
      cursor = cursor.parentElement
    ) {
      if (
        cursor.querySelector(
          'table,input,select'
        ) &&
        String(
          cursor.textContent || ''
        ).length < 30000
      ) {
        return cursor;
      }
    }

    return marker;
  }


  function updateStrategyTimestampV33(
    card
  ) {
    const el =
      card?.querySelector(
        '.v33-strategy-notes-updated'
      );

    if (!el) {
      return;
    }

    el.textContent =
      data?.strategyNotes?.updatedAt
        ? (
            `수정 ${
              fmtDateTimeV33(
                data.strategyNotes.updatedAt
              )
            }`
          )
        : '';
  }


  function installStrategyNotesV33() {
    if (
      !isStrategyTabV33() ||
      typeof data === 'undefined'
    ) {
      return;
    }

    ensureOpsDataV33();

    const editor =
      findMasterEditorBlockV33();

    if (editor) {
      editor.classList.add(
        'v33-master-editor-hidden'
      );

      editor.hidden = true;
    }

    const root =
      document.getElementById(
        'content'
      ) ||
      document.querySelector(
        '.view-content'
      ) ||
      document.querySelector(
        'main'
      );

    if (!root) {
      return;
    }

    let card =
      root.querySelector(
        '.v33-strategy-notes-card'
      );

    if (!card) {
      card =
        document.createElement(
          'section'
        );

      card.className =
        'v33-strategy-notes-card';

      card.innerHTML = `
        <div class="v33-strategy-notes-heading">
          <div>
            <h2>Strategy Notes</h2>
            <p>
              투자 원칙, 운용 판단,
              To-do와 전략 변경 이유를 기록합니다.
            </p>
          </div>

          <small
            class="v33-strategy-notes-updated"
          ></small>
        </div>

        <textarea
          class="v33-strategy-notes-input"
          placeholder="투자 원칙 / 전략 변경 이유 / 다음 행동을 기록"
        ></textarea>
      `;

      root.appendChild(card);

      const textarea =
        card.querySelector(
          'textarea'
        );

      textarea.addEventListener(
        'change',
        () => {
          data.strategyNotes.text =
            textarea.value;

          data.strategyNotes.updatedAt =
            nowIsoV33();

          updateStrategyTimestampV33(
            card
          );

          saveDataV33();
        }
      );
    }

    const textarea =
      card.querySelector(
        'textarea'
      );

    if (
      textarea &&
      document.activeElement !== textarea &&
      textarea.value !==
        data.strategyNotes.text
    ) {
      textarea.value =
        data.strategyNotes.text;
    }

    updateStrategyTimestampV33(
      card
    );
  }


  // ============================================================
  // Growth month close
  // ============================================================

  function growthClosePendingV33() {
    try {
      const warnings =
        data?.growthV32
          ?.rolloverWarnings;

      if (
        Array.isArray(warnings)
      ) {
        return warnings.some(
          item =>
            String(
              item?.type ||
              item?.code ||
              item ||
              ''
            ).includes(
              'MONTH_CLOSE_REQUIRED'
            )
        );
      }

      return JSON.stringify(
        data?.growthV32 || {}
      ).includes(
        'MONTH_CLOSE_REQUIRED'
      );

    } catch (e) {
      return false;
    }
  }


  function installGrowthCloseV33() {
    if (
      activeTabV33Ops() !==
      'Growth & 배당'
    ) {
      return;
    }

    const growthSection =
      Array.from(
        document.querySelectorAll(
          '.v33-merged-section'
        )
      )
        .find(
          section => {
            const heading =
              section.querySelector(
                '.v33-merged-heading h2, h2'
              );

            return (
              String(
                heading?.textContent || ''
              ).trim() ===
              'Growth'
            );
          }
        );

    if (!growthSection) {
      return;
    }

    let bar =
      growthSection.querySelector(
        '.v33-growth-close-bar'
      );

    if (!bar) {
      bar =
        document.createElement(
          'div'
        );

      bar.className =
        'v33-growth-close-bar';

      const heading =
        growthSection.querySelector(
          '.v33-merged-heading'
        );

      if (heading) {
        heading.insertAdjacentElement(
          'afterend',
          bar
        );

      } else {
        growthSection.prepend(
          bar
        );
      }
    }

    const pending =
      growthClosePendingV33();

    bar.classList.toggle(
      'pending',
      pending
    );

    bar.innerHTML =
      pending
        ? `
          <div>
            <b>이전 월 마감이 필요합니다.</b>
            <span>
              현재 LIVE 값을 확인한 뒤 확정하세요.
              자동 월마감은 하지 않습니다.
            </span>
          </div>

          <button
            type="button"
            class="btn v33-growth-close-btn"
          >
            월마감 확인
          </button>
        `
        : `
          <div>
            <b>월마감 상태 정상</b>
            <span>
              현재 월은 LIVE 상태입니다.
              다음 월 첫 접속 시
              마감 확인이 표시됩니다.
            </span>
          </div>
        `;

    const button =
      bar.querySelector(
        '.v33-growth-close-btn'
      );

    if (button) {
      button.addEventListener(
        'click',
        confirmGrowthCloseV33,
        {
          once: true
        }
      );
    }
  }


  function clearGrowthCloseWarningV33() {
    try {
      const warnings =
        data?.growthV32
          ?.rolloverWarnings;

      if (
        Array.isArray(warnings)
      ) {
        data.growthV32
          .rolloverWarnings =
          warnings.filter(
            item =>
              !String(
                item?.type ||
                item?.code ||
                item ||
                ''
              ).includes(
                'MONTH_CLOSE_REQUIRED'
              )
          );
      }

    } catch (e) {
      console.warn(
        '[v33 ops] growth warning cleanup failed',
        e
      );
    }
  }


  function confirmGrowthCloseV33() {
    const ok =
      window.confirm(
        '이전 월을 현재 Growth 값으로 확정할까요?\n\n' +
        '확정 후에는 해당 월이 historical close로 고정됩니다. ' +
        '숫자를 다시 확인한 뒤 진행하세요.'
      );

    if (!ok) {
      return;
    }

    try {
      if (
        typeof rollGrowthForward !==
        'function'
      ) {
        window.alert(
          '월마감 함수를 찾지 못했습니다. ' +
          '데이터는 변경하지 않았습니다.'
        );

        return;
      }

      rollGrowthForward();

      clearGrowthCloseWarningV33();

      saveDataV33();

      if (
        typeof render === 'function'
      ) {
        render();
      }

    } catch (e) {
      console.error(
        '[v33 ops] month close failed',
        e
      );

      window.alert(
        '월마감 처리 중 오류가 발생했습니다. ' +
        '데이터를 다시 확인해주세요.'
      );
    }
  }


  // ============================================================
  // Save feedback
  // ============================================================

  function setSaveStatusV33(
    status,
    detail
  ) {
    lastSaveStatusV33 =
      status;

    document
      .querySelectorAll(
        '.v33-save-feedback'
      )
      .forEach(
        el => {
          el.classList.remove(
            'saving',
            'success',
            'fail'
          );

          el.classList.add(
            status
          );

          el.textContent =
            detail || '';
        }
      );
  }


  function addSaveFeedbackV33() {
    ensureOpsDataV33();

    const buttons =
      Array.from(
        document.querySelectorAll(
          'button'
        )
      )
        .filter(
          button => {
            const text =
              String(
                button.textContent || ''
              )
                .replace(/\s+/g, ' ')
                .trim();

            return (
              /^(저장|저장\/재계산|저장 및 재계산|재계산 및 저장)$/
                .test(text)
            );
          }
        );

    buttons.forEach(
      button => {
        let feedback =
          button.parentElement
            ?.querySelector(
              ':scope > .v33-save-feedback'
            );

        if (!feedback) {
          feedback =
            document.createElement(
              'span'
            );

          feedback.className =
            'v33-save-feedback';

          button.insertAdjacentElement(
            'afterend',
            feedback
          );
        }

        if (
          !feedback.textContent
        ) {
          const last =
            data?.meta?.lastSavedAt;

          feedback.textContent =
            last
              ? (
                  `마지막 저장 ${
                    fmtDateTimeV33(last)
                  }`
                )
              : '';
        }
      }
    );
  }


  function wrapFlushCloudV33() {
    try {
      if (
        typeof flushCloud !==
          'function' ||
        flushCloud
          .__v33OpsWrapped
      ) {
        return;
      }

      const original =
        flushCloud;

      const wrapped =
        async function () {
          ensureOpsDataV33();

          const previous =
            data.meta.lastSavedAt ||
            null;

          const candidate =
            nowIsoV33();

          data.meta.lastSavedAt =
            candidate;

          persistLocalOnlyV33();

          setSaveStatusV33(
            'saving',
            '저장 중…'
          );

          try {
            const result =
              await original.apply(
                this,
                arguments
              );

            if (
              result === false
            ) {
              data.meta.lastSavedAt =
                previous;

              persistLocalOnlyV33();

              setSaveStatusV33(
                'fail',
                '⚠ 저장 실패'
              );

              return result;
            }

            setSaveStatusV33(
              'success',
              `✓ 저장 완료 ${
                fmtShortTimeV33(
                  candidate
                )
              }`
            );

            window.dispatchEvent(
              new CustomEvent(
                'portfolio:saved',
                {
                  detail: {
                    at: candidate
                  }
                }
              )
            );

            window.setTimeout(
              () => {
                if (
                  lastSaveStatusV33 ===
                    'success'
                ) {
                  setSaveStatusV33(
                    'success',
                    `마지막 저장 ${
                      fmtDateTimeV33(
                        candidate
                      )
                    }`
                  );
                }
              },
              1800
            );

            return result;

          } catch (e) {
            data.meta.lastSavedAt =
              previous;

            persistLocalOnlyV33();

            setSaveStatusV33(
              'fail',
              '⚠ 저장 실패'
            );

            throw e;
          }
        };

      wrapped.__v33OpsWrapped =
        true;

      flushCloud =
        wrapped;

    } catch (e) {
      console.warn(
        '[v33 ops] flushCloud wrapper unavailable',
        e
      );
    }
  }


  // ============================================================
  // DB market refresh feedback
  // ============================================================

  function marketBasisDateV33() {
    const dates = [];

    function collect(
      obj,
      depth
    ) {
      if (
        !obj ||
        typeof obj !== 'object' ||
        depth > 3
      ) {
        return;
      }

      Object.entries(obj)
        .forEach(
          ([key, value]) => {
            if (
              /date|asof|updated/i
                .test(key) &&
              typeof value === 'string' &&
              /^20\d{2}-\d{2}-\d{2}/
                .test(value)
            ) {
              dates.push(
                value.slice(0, 10)
              );

            } else if (
              value &&
              typeof value === 'object'
            ) {
              collect(
                value,
                depth + 1
              );
            }
          }
        );
    }

    try {
      if (
        typeof marketLiveState !==
          'undefined'
      ) {
        collect(
          marketLiveState,
          0
        );
      }

    } catch (e) {}

    return (
      dates.sort().pop() ||
      ''
    );
  }


  function setDbStatusV33(
    status,
    text
  ) {
    lastDbStatusV33 =
      status;

    document
      .querySelectorAll(
        '.v33-db-feedback'
      )
      .forEach(
        el => {
          el.classList.remove(
            'loading',
            'success',
            'fail'
          );

          el.classList.add(
            status
          );

          el.textContent =
            text || '';
        }
      );
  }


  function enhanceMarketRefreshV33() {
    const buttons =
      Array.from(
        document.querySelectorAll(
          'button'
        )
      )
        .filter(
          button => {
            const text =
              String(
                button.textContent || ''
              )
                .replace(/\s+/g, ' ')
                .trim();

            return (
              text ===
                '자동가격 새로고침' ||
              text ===
                'DB 가격 다시 불러오기'
            );
          }
        );

    buttons.forEach(
      button => {
        button.textContent =
          'DB 가격 다시 불러오기';

        let feedback =
          button.parentElement
            ?.querySelector(
              ':scope > .v33-db-feedback'
            );

        if (!feedback) {
          feedback =
            document.createElement(
              'span'
            );

          feedback.className =
            'v33-db-feedback';

          button.insertAdjacentElement(
            'afterend',
            feedback
          );
        }

        if (
          !button.dataset
            .v33DbFeedbackReady
        ) {
          button.addEventListener(
            'click',
            () =>
              setDbStatusV33(
                'loading',
                'DB 조회 중…'
              ),
            true
          );

          button.dataset
            .v33DbFeedbackReady =
            '1';
        }

        if (
          !feedback.textContent
        ) {
          const basis =
            marketBasisDateV33();

          feedback.textContent =
            basis
              ? `가격 기준 ${basis}`
              : '';
        }
      }
    );
  }


  function wrapMarketLoaderV33() {
    try {
      if (
        typeof loadMarketPrices !==
          'function' ||
        loadMarketPrices
          .__v33OpsWrapped
      ) {
        return;
      }

      const original =
        loadMarketPrices;

      const wrapped =
        async function () {
          const queryAt =
            nowIsoV33();

          setDbStatusV33(
            'loading',
            'DB 조회 중…'
          );

          try {
            const result =
              await original.apply(
                this,
                arguments
              );

            const basis =
              marketBasisDateV33();

            setDbStatusV33(
              'success',
              `✓ DB 조회 완료 ${
                fmtShortTimeV33(
                  queryAt
                )
              }${
                basis
                  ? ` · 가격 기준 ${basis}`
                  : ''
              }`
            );

            window.dispatchEvent(
              new CustomEvent(
                'portfolio:market-refreshed',
                {
                  detail: {
                    at: queryAt,
                    basis
                  }
                }
              )
            );

            return result;

          } catch (e) {
            setDbStatusV33(
              'fail',
              '⚠ DB 가격 조회 실패'
            );

            throw e;
          }
        };

      wrapped.__v33OpsWrapped =
        true;

      loadMarketPrices =
        wrapped;

    } catch (e) {
      console.warn(
        '[v33 ops] market loader wrapper unavailable',
        e
      );
    }
  }


  // ============================================================
  // Backup / Restore
  // ============================================================

  function updateBackupMetaV33() {
    const last =
      data?.meta?.lastBackupAt;

    if (!last) {
      return;
    }

    const buttons =
      Array.from(
        document.querySelectorAll(
          'button, a'
        )
      )
        .filter(
          el => {
            const text =
              String(
                el.textContent || ''
              )
                .replace(/\s+/g, ' ')
                .trim();

            return (
              !/복원|Restore/i
                .test(text) &&
              /백업|Backup/i
                .test(text)
            );
          }
        );

    buttons.forEach(
      button => {
        let meta =
          button.parentElement
            ?.querySelector(
              ':scope > .v33-backup-meta'
            );

        if (!meta) {
          meta =
            document.createElement(
              'span'
            );

          meta.className =
            'v33-backup-meta';

          button.insertAdjacentElement(
            'afterend',
            meta
          );
        }

        const d =
          new Date(last);

        const days =
          Number.isFinite(
            d.getTime()
          )
            ? Math.max(
                0,
                Math.floor(
                  (
                    Date.now() -
                    d.getTime()
                  ) /
                  86400000
                )
              )
            : null;

        meta.textContent =
          `마지막 백업 ${
            fmtDateTimeV33(last)
          }` +
          (
            days != null
              ? ` · ${days}일 전`
              : ''
          );
      }
    );
  }


  function enhanceBackupUiV33() {
    ensureOpsDataV33();

    const buttons =
      Array.from(
        document.querySelectorAll(
          'button, a'
        )
      )
        .filter(
          el => {
            const text =
              String(
                el.textContent || ''
              )
                .replace(/\s+/g, ' ')
                .trim();

            return (
              /백업|Backup|복원|Restore/i
                .test(text)
            );
          }
        );

    buttons.forEach(
      button => {
        const text =
          String(
            button.textContent || ''
          )
            .replace(/\s+/g, ' ')
            .trim();

        const isRestore =
          /복원|Restore/i
            .test(text);

        const isBackup =
          !isRestore &&
          /백업|Backup/i
            .test(text);

        if (
          isBackup &&
          !button.dataset
            .v33BackupReady
        ) {
          button.addEventListener(
            'click',
            () => {
              data.meta.lastBackupAt =
                nowIsoV33();

              persistLocalOnlyV33();

              try {
                if (
                  typeof scheduleCloudSave ===
                    'function' &&
                  typeof cloudReady !==
                    'undefined' &&
                  cloudReady
                ) {
                  scheduleCloudSave();
                }

              } catch (e) {}

              updateBackupMetaV33();
            },
            true
          );

          button.dataset
            .v33BackupReady =
            '1';
        }

        if (
          isRestore &&
          !button.dataset
            .v33RestoreReady
        ) {
          button.addEventListener(
            'click',
            event => {
              const ok =
                window.confirm(
                  '백업 복원을 계속할까요?\n\n' +
                  '복원하면 현재 브라우저 데이터와 ' +
                  'Supabase portfolio_state가 백업 내용으로 ' +
                  '교체될 수 있습니다.\n\n' +
                  '현재 데이터가 필요하면 먼저 JSON 백업을 권장합니다.'
                );

              if (!ok) {
                event.preventDefault();
                event.stopImmediatePropagation();
              }
            },
            true
          );

          button.dataset
            .v33RestoreReady =
            '1';
        }
      }
    );

    updateBackupMetaV33();
  }


  // ============================================================
  // Apply / lifecycle
  // ============================================================

  function applyOpsV33() {
    const changed =
      ensureOpsDataV33();

    if (changed) {
      persistLocalOnlyV33();
    }

    addTableMemosV33();

    installStrategyNotesV33();

    installGrowthCloseV33();

    addSaveFeedbackV33();

    enhanceMarketRefreshV33();

    enhanceBackupUiV33();
  }


  function queueOpsV33() {
    if (
      applyQueuedV33Ops
    ) {
      return;
    }

    applyQueuedV33Ops =
      true;

    requestAnimationFrame(
      () => {
        applyQueuedV33Ops =
          false;

        applyOpsV33();
      }
    );
  }


  window.applyOpsV33 =
    applyOpsV33;


  wrapFlushCloudV33();

  wrapMarketLoaderV33();


  [
    'load',
    'resize',
    'portfolio:saved',
    'portfolio:market-loaded',
    'portfolio:market-refreshed'
  ]
    .forEach(
      eventName =>
        window.addEventListener(
          eventName,
          queueOpsV33
        )
    );


  window.addEventListener(
    'load',
    () => {
      const target =
        document.getElementById(
          'content'
        ) ||
        document.getElementById(
          'app'
        ) ||
        document.body;

      const observer =
        new MutationObserver(
          queueOpsV33
        );

      observer.observe(
        target,
        {
          childList: true,
          subtree: true
        }
      );

      queueOpsV33();
    }
  );


  console.info(
    '[Portfolio Control] v3.3 operations layer loaded'
  );

})();