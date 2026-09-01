// Portfolio Control v3.3
// Unified History note + global sticky-first-column audit.
// Load LAST after v33-nav-fix.js.

(function () {

  function installStylesV33() {
    if (document.getElementById('v33-history-sticky-fix-style')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'v33-history-sticky-fix-style';

    style.textContent = `
.v33-history-notes.v33-history-notes-unified {
  grid-template-columns: 1fr !important;
}

.v33-history-note-unified {
  width: 100%;
}

.v33-history-note-unified textarea {
  width: 100%;
  min-height: 180px;
  box-sizing: border-box;
  line-height: 1.55;
  resize: vertical;
}


/*
 * Global sticky policy
 * Every multi-row table is marked by JS.
 * Not mobile-only: desktop-site mode uses the same rule.
 */

.v33-global-sticky-wrap {
  position: relative;
  overflow-x: auto !important;
  -webkit-overflow-scrolling: touch;
}

.v33-global-sticky-first
  thead th:first-child,
.v33-global-sticky-first
  thead td:first-child {
  position: sticky !important;
  left: 0 !important;
  z-index: 8 !important;

  background:
    var(
      --v33-sticky-head-bg,
      var(
        --card-bg,
        var(--panel-bg, #fff)
      )
    ) !important;

  box-shadow:
    1px 0 0
    var(
      --v33-border,
      rgba(100, 116, 139, .20)
    );

  background-clip: padding-box;
}

.v33-global-sticky-first
  tbody td:first-child,
.v33-global-sticky-first
  tbody th:first-child {
  position: sticky !important;
  left: 0 !important;
  z-index: 4 !important;

  background:
    var(
      --v33-sticky-body-bg,
      var(
        --card-bg,
        var(--panel-bg, #fff)
      )
    ) !important;

  box-shadow:
    1px 0 0
    var(
      --v33-border,
      rgba(100, 116, 139, .20)
    );

  background-clip: padding-box;
}


/* History total / Allocation semantic colors */

.v33-global-sticky-first
  tbody tr.v33-history-total
  > td:first-child,
.v33-global-sticky-first
  tbody tr.v33-history-total
  > th:first-child {
  background:
    var(--v33-blue-soft, #eff6ff) !important;
}

.v33-global-sticky-first
  tbody tr.v33-allocation-under-row
  > td:first-child,
.v33-global-sticky-first
  tbody tr.v33-allocation-under-row
  > th:first-child {
  background:
    var(--v33-blue-soft, #eff6ff) !important;
}

.v33-global-sticky-first
  tbody tr.v33-allocation-over-row
  > td:first-child,
.v33-global-sticky-first
  tbody tr.v33-allocation-over-row
  > th:first-child {
  background:
    var(--v33-amber-soft, #fffbeb) !important;
}


/* Keep sticky cell opaque on hover */

.v33-global-sticky-first
  tbody tr:hover
  > td:first-child,
.v33-global-sticky-first
  tbody tr:hover
  > th:first-child {
  background:
    var(
      --v33-sticky-hover-bg,
      #f8fbff
    ) !important;
}

.v33-global-sticky-first
  tbody tr.v33-history-total:hover
  > td:first-child,
.v33-global-sticky-first
  tbody tr.v33-history-total:hover
  > th:first-child,
.v33-global-sticky-first
  tbody tr.v33-allocation-under-row:hover
  > td:first-child,
.v33-global-sticky-first
  tbody tr.v33-allocation-under-row:hover
  > th:first-child {
  background:
    var(--v33-blue-soft, #eff6ff) !important;
}

.v33-global-sticky-first
  tbody tr.v33-allocation-over-row:hover
  > td:first-child,
.v33-global-sticky-first
  tbody tr.v33-allocation-over-row:hover
  > th:first-child {
  background:
    var(--v33-amber-soft, #fffbeb) !important;
}


/* Override older specific sticky rules */

.v33-global-sticky-first.v33-sticky-first-col
  thead th:first-child {
  z-index: 8 !important;
}

.v33-global-sticky-first.v33-sticky-first-col
  tbody td:first-child {
  z-index: 4 !important;
}
`;

    document.head.appendChild(style);
  }


  installStylesV33();


  let applyQueuedV33 = false;


  function persistDataV33() {

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
        '[v33 audit] local persistence failed',
        e
      );
    }
  }


  function requestCloudSaveV33() {

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
        '[v33 audit] cloud save scheduling failed',
        e
      );
    }
  }


  /*
   * History Note migration
   *
   * legacy:
   * notes["2024"], notes["2025"], notes["2026"]
   *
   * new:
   * note = one unified string
   */

  function ensureUnifiedHistoryNoteV33() {

    if (
      typeof data === 'undefined' ||
      !data ||
      !data.incomeTaxHistory
    ) {

      return false;
    }


    const history =
      data.incomeTaxHistory;


    /*
     * 한번 migration한 뒤 사용자가 Note를
     * 일부러 전부 지우더라도 legacy note가
     * 다시 살아나지 않도록 marker 사용.
     */

    if (
      history.unifiedNoteV1 === true
    ) {

      return false;
    }


    if (
      typeof history.note === 'string' &&
      history.note.trim()
    ) {

      history.unifiedNoteV1 =
        true;

      persistDataV33();
      requestCloudSaveV33();

      return true;
    }


    const legacyNotes =
      history.notes &&
      typeof history.notes === 'object' &&
      !Array.isArray(history.notes)

        ? history.notes

        : {};


    const years =
      Object.keys(
        legacyNotes
      )
        .filter(
          year =>
            String(
              legacyNotes[year] ?? ''
            ).trim()
        )
        .sort(
          (a, b) =>
            Number(a) -
            Number(b)
        );


    history.note =
      years
        .map(
          year =>
            `[${year}]\n${String(
              legacyNotes[year] ?? ''
            ).trim()}`
        )
        .join(
          '\n\n'
        );


    history.unifiedNoteV1 =
      true;


    history.noteUpdatedAt =
      new Date()
        .toISOString();


    persistDataV33();
    requestCloudSaveV33();


    return true;
  }


  window.historyUnifiedNoteChangeV33 =
    function (value) {

      if (
        typeof data === 'undefined' ||
        !data?.incomeTaxHistory
      ) {

        return;
      }


      data.incomeTaxHistory.note =
        String(
          value ?? ''
        );


      data.incomeTaxHistory.noteUpdatedAt =
        new Date()
          .toISOString();


      if (
        typeof save === 'function'
      ) {

        save();

      } else {

        persistDataV33();
        requestCloudSaveV33();
      }
    };


  function applyUnifiedHistoryNoteV33() {

    const notesRoot =
      document.querySelector(
        '.v33-history-notes'
      );


    if (!notesRoot) {

      return false;
    }


    ensureUnifiedHistoryNoteV33();


    const note =
      String(
        data?.incomeTaxHistory?.note ??
        ''
      );


    let box =
      notesRoot.querySelector(
        '.v33-history-note-unified'
      );


    if (!box) {

      /*
       * 기존 2024 / 2025 / 2026
       * textarea를 DOM에서 제거하고
       * 하나의 Note로 교체.
       */

      notesRoot.replaceChildren();


      box =
        document.createElement(
          'div'
        );


      box.className =
        'v33-history-note ' +
        'v33-history-note-unified';


      const label =
        document.createElement(
          'label'
        );


      label.textContent =
        'Income / Career Note';


      const textarea =
        document.createElement(
          'textarea'
        );


      textarea.className =
        'v33-history-note-textarea';


      textarea.setAttribute(
        'aria-label',
        'Income / Career Note'
      );


      textarea.addEventListener(
        'change',
        () =>
          window
            .historyUnifiedNoteChangeV33(
              textarea.value
            )
      );


      box.appendChild(
        label
      );


      box.appendChild(
        textarea
      );


      notesRoot.appendChild(
        box
      );
    }


    const textarea =
      box.querySelector(
        'textarea'
      );


    if (
      textarea &&
      document.activeElement !==
        textarea &&
      textarea.value !== note
    ) {

      textarea.value =
        note;
    }


    notesRoot.classList.add(
      'v33-history-notes-unified'
    );


    return true;
  }


  /*
   * ============================================================
   * Global Sticky Audit
   * ============================================================
   */


  function bodyRowCountV33(
    table
  ) {

    if (!table) {

      return 0;
    }


    if (
      table.tBodies &&
      table.tBodies.length
    ) {

      return Array
        .from(
          table.tBodies
        )
        .reduce(
          (
            sum,
            body
          ) =>
            sum +
            body.rows.length,

          0
        );
    }


    return (
      table.rows?.length ||
      0
    );
  }


  function shouldStickyV33(
    table
  ) {

    if (!table) {

      return false;
    }


    /*
     * 향후 정말 sticky가 필요없는 표는
     * 이 class를 붙이면 명시적으로 제외 가능.
     */

    if (
      table.classList.contains(
        'v33-no-sticky-first'
      )
    ) {

      return false;
    }


    /*
     * 구형 modal 안의 duplicate table은 제외.
     */

    if (
      table.closest(
        '[role="dialog"], ' +
        '.modal, ' +
        '.mobileModal, ' +
        '.tableModal'
      )
    ) {

      return false;
    }


    /*
     * 한 줄 summary는 기존 compact /
     * vertical 모바일 UI 유지.
     */

    return (
      bodyRowCountV33(
        table
      ) > 1
    );
  }


  function markScrollContainerV33(
    table
  ) {

    const wrap =
      table.closest(
        '.tableWrap, ' +
        '.v33-inline-table-wrap'
      );


    if (wrap) {

      wrap.classList.add(
        'v33-global-sticky-wrap'
      );
    }
  }


  function applyGlobalStickyV33() {

    const tables =
      Array.from(
        document.querySelectorAll(
          'table'
        )
      );


    let eligible = 0;
    let applied = 0;

    const labels = [];


    tables.forEach(
      (
        table,
        index
      ) => {

        if (
          !shouldStickyV33(
            table
          )
        ) {

          table.classList.remove(
            'v33-global-sticky-first'
          );

          return;
        }


        eligible += 1;


        table.classList.add(
          'v33-global-sticky-first'
        );


        markScrollContainerV33(
          table
        );


        const firstHeader =
          table.querySelector(
            'thead th:first-child, ' +
            'tr:first-child th:first-child, ' +
            'tr:first-child td:first-child'
          );


        labels.push(
          (
            firstHeader?.textContent ||
            `table-${index + 1}`
          )
            .replace(
              /\s+/g,
              ' '
            )
            .trim()
        );


        applied += 1;
      }
    );


    /*
     * Console에서 stickyAuditV33 입력하면
     * 현재 탭에서 실제 스캔/적용된 표 확인 가능.
     */

    window.stickyAuditV33 = {

      scanned:
        tables.length,

      eligible,

      applied,

      labels
    };


    return (
      window.stickyAuditV33
    );
  }


  function applyHistoryStickyAuditV33() {

    applyUnifiedHistoryNoteV33();

    applyGlobalStickyV33();
  }


  function queueApplyV33() {

    if (
      applyQueuedV33
    ) {

      return;
    }


    applyQueuedV33 =
      true;


    requestAnimationFrame(
      () => {

        applyQueuedV33 =
          false;


        applyHistoryStickyAuditV33();
      }
    );
  }


  window.applyGlobalStickyV33 =
    applyGlobalStickyV33;


  window.applyUnifiedHistoryNoteV33 =
    applyUnifiedHistoryNoteV33;


  window.applyHistoryStickyAuditV33 =
    applyHistoryStickyAuditV33;


  /*
   * 기존 주요 update event에서도
   * 다시 audit.
   */

  [
    'load',
    'resize',
    'portfolio:market-loaded',
    'portfolio:market-refreshed',
    'portfolio:saved'
  ]
    .forEach(
      eventName =>

        window.addEventListener(
          eventName,
          queueApplyV33
        )
    );


  /*
   * nav-fix가 탭 전환 시 content.innerHTML을
   * 새로 만들기 때문에 DOM 변경 자체도 감시.
   */

  window.addEventListener(
    'load',
    () => {

      ensureUnifiedHistoryNoteV33();


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
          queueApplyV33
        );


      observer.observe(
        target,
        {
          childList: true,
          subtree: true
        }
      );


      queueApplyV33();
    }
  );


  console.info(
    '[Portfolio Control] ' +
    'v3.3 History note + sticky audit loaded'
  );

})();
