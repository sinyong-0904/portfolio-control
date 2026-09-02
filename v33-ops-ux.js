// Portfolio Control v3.3
// Operations UX refinement
// Memo popup / persistent status / restore guard

(function () {
  'use strict';

  let queued = false;


  function formatDateTime(value) {
    const d =
      new Date(value);

    if (
      !Number.isFinite(
        d.getTime()
      )
    ) {
      return '';
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


  function formatTime(value) {
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


  // ============================================================
  // Persistent status bar
  // ============================================================

  function ensureStatusBar() {
    let bar =
      document.getElementById(
        'v33-ops-status-bar'
      );

    if (bar) {
      return bar;
    }

    const host =
      document.querySelector(
        'header'
      ) ||
      document.querySelector(
        '.header'
      ) ||
      document.body;

    bar =
      document.createElement(
        'div'
      );

    bar.id =
      'v33-ops-status-bar';

    bar.innerHTML = `
      <span
        class="v33-status-save"
      ></span>

      <span
        class="v33-status-market"
      ></span>
    `;

    host.appendChild(bar);

    return bar;
  }


  function setStatus(
    selector,
    text,
    state
  ) {
    const bar =
      ensureStatusBar();

    const el =
      bar.querySelector(
        selector
      );

    if (!el) {
      return;
    }

    el.className =
      selector
        .replace('.', '') +
      (
        state
          ? ` ${state}`
          : ''
      );

    el.textContent =
      text || '';
  }


  function setSaveStatus(
    text,
    state
  ) {
    setStatus(
      '.v33-status-save',
      text,
      state
    );
  }


  function setMarketStatus(
    text,
    state
  ) {
    setStatus(
      '.v33-status-market',
      text,
      state
    );
  }


  function marketBasisDate() {
    const dates = [];

    function scan(
      value,
      depth
    ) {
      if (
        !value ||
        typeof value !== 'object' ||
        depth > 3
      ) {
        return;
      }

      Object.entries(value)
        .forEach(
          ([key, item]) => {
            if (
              /date|asof|updated/i
                .test(key) &&
              typeof item === 'string' &&
              /^20\d{2}-\d{2}-\d{2}/
                .test(item)
            ) {
              dates.push(
                item.slice(0, 10)
              );

            } else if (
              item &&
              typeof item === 'object'
            ) {
              scan(
                item,
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
        scan(
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


  function restoreStatus() {
    try {
      const saved =
        data?.meta?.lastSavedAt;

      if (saved) {
        setSaveStatus(
          `✓ 마지막 저장 ${
            formatDateTime(saved)
          }`,
          'success'
        );
      }
    } catch (e) {}


    try {
      const basis =
        marketBasisDate();

      const queried =
        data?.meta?.lastMarketQueryAt;

      if (queried) {
        setMarketStatus(
          `✓ 마지막 DB 조회 ${
            formatDateTime(queried)
          }${
            basis
              ? ` · 가격 기준 ${basis}`
              : ''
          }`,
          'success'
        );

      } else if (basis) {
        setMarketStatus(
          `가격 기준 ${basis}`,
          ''
        );
      }
    } catch (e) {}
  }


  // ============================================================
  // Memo popup
  // ============================================================

  function ensureMemoModal() {
    let modal =
      document.getElementById(
        'v33-memo-modal'
      );

    if (modal) {
      return modal;
    }

    modal =
      document.createElement(
        'div'
      );

    modal.id =
      'v33-memo-modal';

    modal.className =
      'v33-memo-modal';

    modal.hidden =
      true;

    modal.innerHTML = `
      <div
        class="v33-memo-backdrop"
      ></div>

      <div
        class="v33-memo-dialog"
        role="dialog"
        aria-modal="true"
      >

        <div
          class="v33-memo-dialog-head"
        >
          <strong>
            Memo
          </strong>

          <button
            type="button"
            class="v33-memo-close"
            aria-label="닫기"
          >
            ×
          </button>
        </div>


        <textarea
          class="v33-memo-dialog-input"
        ></textarea>


        <div
          class="v33-memo-dialog-bottom"
        >

          <small
            class="v33-memo-dialog-updated"
          ></small>

          <button
            type="button"
            class="btn v33-memo-save"
          >
            저장
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(
      modal
    );

    const close =
      () => {
        modal.hidden =
          true;
      };

    modal
      .querySelector(
        '.v33-memo-close'
      )
      .addEventListener(
        'click',
        close
      );

    modal
      .querySelector(
        '.v33-memo-backdrop'
      )
      .addEventListener(
        'click',
        close
      );

    return modal;
  }


  function openMemo(memo) {
    const modal =
      ensureMemoModal();

    const input =
      modal.querySelector(
        '.v33-memo-dialog-input'
      );

    const updated =
      modal.querySelector(
        '.v33-memo-dialog-updated'
      );

    const saveButton =
      modal.querySelector(
        '.v33-memo-save'
      );

    const source =
      memo.querySelector(
        '.v33-table-memo-input'
      );

    const time =
      memo.querySelector(
        '.v33-table-memo-updated'
      );

    input.value =
      source?.value ||
      '';

    updated.textContent =
      time?.textContent ||
      '';

    saveButton.onclick =
      () => {
        if (source) {
          source.value =
            input.value;

          source.dispatchEvent(
            new Event(
              'change',
              {
                bubbles: true
              }
            )
          );
        }

        modal.hidden =
          true;
      };

    modal.hidden =
      false;

    requestAnimationFrame(
      () =>
        input.focus()
    );
  }


  function convertMemos() {
    document
      .querySelectorAll(
        '.v33-table-memo'
      )
      .forEach(
        memo => {
          const head =
            memo.querySelector(
              '.v33-table-memo-head'
            );

          const textarea =
            memo.querySelector(
              '.v33-table-memo-input'
            );

          if (
            !head ||
            !textarea
          ) {
            return;
          }

          textarea.classList.add(
            'v33-memo-source-hidden'
          );

          const label =
            head.querySelector(
              'span'
            );

          if (label) {
            label.textContent =
              'Memo';
          }

          if (
            memo.dataset
              .v33PopupReady
          ) {
            return;
          }

          head.setAttribute(
            'role',
            'button'
          );

          head.tabIndex =
            0;

          head.addEventListener(
            'click',
            () =>
              openMemo(memo)
          );

          head.addEventListener(
            'keydown',
            e => {
              if (
                e.key === 'Enter' ||
                e.key === ' '
              ) {
                e.preventDefault();

                openMemo(memo);
              }
            }
          );

          memo.dataset
            .v33PopupReady =
            '1';
        }
      );
  }


  // ============================================================
  // Persistent Save
  // ============================================================

  function enhanceSaveButtons() {
    document
      .querySelectorAll(
        'button'
      )
      .forEach(
        button => {
          const text =
            String(
              button.textContent ||
              ''
            )
              .replace(
                /\s+/g,
                ' '
              )
              .trim();

          if (
            !/저장|재계산/
              .test(text)
          ) {
            return;
          }

          if (
            button.closest(
              '#v33-memo-modal'
            )
          ) {
            return;
          }

          if (
            button.dataset
              .v33PersistentSave
          ) {
            return;
          }

          button.addEventListener(
            'click',
            () => {
              setSaveStatus(
                '● 저장 중…',
                'saving'
              );
            },
            true
          );

          button.dataset
            .v33PersistentSave =
            '1';
        }
      );
  }


  window.addEventListener(
    'portfolio:saved',
    event => {
      const at =
        event?.detail?.at ||
        new Date();

      setSaveStatus(
        `✓ 마지막 저장 ${
          formatDateTime(at)
        }`,
        'success'
      );
    }
  );


  // ============================================================
  // Persistent DB refresh
  // ============================================================

  function enhanceDbButtons() {
    document
      .querySelectorAll(
        'button'
      )
      .forEach(
        button => {
          const text =
            String(
              button.textContent ||
              ''
            )
              .replace(
                /\s+/g,
                ' '
              )
              .trim();

          if (
            text !==
              'DB 가격 다시 불러오기'
          ) {
            return;
          }

          if (
            button.dataset
              .v33PersistentDb
          ) {
            return;
          }

          button.addEventListener(
            'click',
            () => {
              setMarketStatus(
                '● DB 조회 중…',
                'loading'
              );
            },
            true
          );

          button.dataset
            .v33PersistentDb =
            '1';
        }
      );
  }


  window.addEventListener(
    'portfolio:market-refreshed',
    event => {
      const at =
        event?.detail?.at ||
        new Date();

      const basis =
        event?.detail?.basis ||
        marketBasisDate();

      try {
        if (
          data?.meta
        ) {
          data.meta.lastMarketQueryAt =
            new Date(at)
              .toISOString();

          if (
            typeof KEY !==
              'undefined'
          ) {
            localStorage.setItem(
              KEY,
              JSON.stringify(data)
            );
          }
        }
      } catch (e) {}

      setMarketStatus(
        `✓ 마지막 DB 조회 ${
          formatDateTime(at)
        }${
          basis
            ? ` · 가격 기준 ${basis}`
            : ''
        }`,
        'success'
      );
    }
  );


  // ============================================================
  // Restore guard
  // ============================================================

  function enhanceRestore() {
    document
      .querySelectorAll(
        'button, a'
      )
      .forEach(
        button => {
          const text =
            String(
              button.textContent ||
              ''
            )
              .replace(
                /\s+/g,
                ' '
              )
              .trim();

          if (
            !/복원|Restore/i
              .test(text)
          ) {
            return;
          }

          if (
            button.dataset
              .v33RestoreGuard2
          ) {
            return;
          }

          button.addEventListener(
            'click',
            event => {
              const ok =
                window.confirm(
                  '백업 복원을 계속할까요?\n\n' +
                  '현재 portfolio_state가 ' +
                  '선택한 백업 내용으로 교체될 수 있습니다.\n\n' +
                  '현재 상태가 필요하면 먼저 JSON 백업을 권장합니다.'
                );

              if (!ok) {
                event.preventDefault();

                event.stopImmediatePropagation();

                event.stopPropagation();
              }
            },
            true
          );

          button.dataset
            .v33RestoreGuard2 =
            '1';
        }
      );
  }


  // ============================================================
  // Apply
  // ============================================================

  function apply() {
    ensureStatusBar();

    restoreStatus();

    convertMemos();

    enhanceSaveButtons();

    enhanceDbButtons();

    enhanceRestore();
  }


  function queue() {
    if (queued) {
      return;
    }

    queued = true;

    requestAnimationFrame(
      () => {
        queued = false;

        apply();
      }
    );
  }


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

      new MutationObserver(
        queue
      )
        .observe(
          target,
          {
            childList: true,
            subtree: true
          }
        );

      queue();
    }
  );


  console.info(
    '[Portfolio Control] ' +
    'v3.3 operations UX refinement loaded'
  );

})();
