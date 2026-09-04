// Portfolio Control v3.3
// Delete action for Closed holding records.
// Load after v33-lifecycle.js / v33-lifecycle-v2.js.

(function () {
  'use strict';


  function isActive(h) {
    return (
      !h.status ||
      h.status === 'Active'
    );
  }


  function installButtons() {
    const reopenButtons =
      document.querySelectorAll(
        '.v33-life-reopen'
      );

    reopenButtons.forEach(
      reopen => {

        const cell =
          reopen.closest('td');

        if (!cell) {
          return;
        }


        // Already installed.
        if (
          cell.querySelector(
            '.v33-life-delete-closed'
          )
        ) {
          return;
        }


        const id =
          reopen.dataset.v33Reopen;

        if (!id) {
          return;
        }


        const button =
          document.createElement(
            'button'
          );

        button.type =
          'button';

        button.className =
          'btn danger v33-life-delete-closed';

        button.dataset
          .v33DeleteClosed =
            id;

        button.textContent =
          '삭제';

        button.style.marginLeft =
          '6px';


        cell.appendChild(
          button
        );
      }
    );
  }


  function deleteClosed(id) {
    if (
      typeof data === 'undefined' ||
      !data ||
      !Array.isArray(
        data.holdings
      )
    ) {
      return;
    }


    //
    // IMPORTANT:
    // CHILD may have an Active and
    // Closed record with the same id.
    // Therefore id alone is NOT enough.
    //
    const index =
      data.holdings.findIndex(
        h =>
          String(h.id) ===
            String(id) &&
          !isActive(h)
      );


    if (index < 0) {
      alert(
        '삭제할 종료 기록을 찾지 못했습니다.'
      );

      return;
    }


    const h =
      data.holdings[index];


    const ok =
      confirm(
        '이 종료 기록을 완전히 삭제할까요?\n\n' +
        `${h.code || ''}\n` +
        '삭제 후에는 재활성화할 수 없습니다.'
      );


    if (!ok) {
      return;
    }


    //
    // Remove exactly this Closed object.
    // Active record with the same id
    // remains untouched.
    //
    data.holdings.splice(
      index,
      1
    );


    if (
      typeof save === 'function'
    ) {
      save();
    }


    if (
      typeof render === 'function'
    ) {
      render();
    }
  }


  function onClick(event) {
    const button =
      event.target.closest(
        '[data-v33-delete-closed]'
      );

    if (!button) {
      return;
    }


    event.preventDefault();
    event.stopPropagation();


    deleteClosed(
      button.dataset
        .v33DeleteClosed
    );
  }


  //
  // Lifecycle view is re-rendered,
  // so reinstall buttons whenever
  // its DOM changes.
  //
  let queued = false;


  function scheduleInstall() {
    if (queued) {
      return;
    }

    queued = true;


    requestAnimationFrame(
      function () {
        queued = false;
        installButtons();
      }
    );
  }


  const observer =
    new MutationObserver(
      scheduleInstall
    );


  function start() {
    document.addEventListener(
      'click',
      onClick
    );


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );


    scheduleInstall();
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


  console.info(
    '[Portfolio Control] ' +
    'Closed holding delete loaded'
  );

})();
