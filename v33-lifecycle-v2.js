// Portfolio Control v3.3
// Holding Lifecycle v2
//
// - account-specific "+ 종목"
// - exact account + code + owner close binding
// - CHILD owner-specific lifecycle
// - CHILD qty / avg editable
// - advanced settings moved to bottom
//
// Load AFTER v33-lifecycle.js.

(function () {
  'use strict';

  const ACCOUNT_DEFS = [
    {
      id: 'DC',
      labels: ['DC']
    },
    {
      id: 'P1',
      labels: [
        '개인연금1',
        '연금(1)'
      ]
    },
    {
      id: 'P2',
      labels: [
        '개인연금2',
        '연금(2)'
      ]
    },
    {
      id: 'ISA',
      labels: ['ISA']
    },
    {
      id: 'GENERAL',
      labels: [
        '일반계좌'
      ]
    }
  ];

  let queued = false;


  function clean(v) {
    return String(
      v == null
        ? ''
        : v
    )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();
  }


  function norm(v) {
    return clean(v)
      .replace(
        /\s+/g,
        ''
      )
      .toUpperCase();
  }


  function esc(v) {
    return clean(v)
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#39;'
      );
  }


  function active(h) {
    return (
      norm(
        h?.status
      ) ===
      'ACTIVE'
    );
  }


  function accountTitle(id) {
    const account =
      (data.accounts || [])
        .find(
          a =>
            a.id === id
        );

    if (
      account?.name
    ) {
      return clean(
        account.name
      );
    }

    return (
      ACCOUNT_DEFS
        .find(
          x =>
            x.id === id
        )
        ?.labels[0] ||
      id
    );
  }


  function master(code) {
    const c =
      norm(code);

    return (
      (data.market || [])
        .find(
          m =>
            norm(
              m.code
            ) === c
        ) ||
      null
    );
  }


  function marketName(code) {
    return (
      clean(
        master(code)
          ?.name
      ) ||
      clean(code)
    );
  }


  function accountHoldings(
    account,
    owner
  ) {
    return (
      data.holdings || []
    )
      .filter(
        h =>
          active(h) &&
          h.account ===
            account &&
          (
            account !==
              'CHILD' ||
            clean(
              h.owner
            ) ===
              clean(owner)
          )
      );
  }


  function findSectionByLabels(
    labels
  ) {
    const content =
      document
        .getElementById(
          'content'
        );

    if (!content) {
      return null;
    }

    const tables =
      Array.from(
        content.querySelectorAll(
          'table'
        )
      );

    const candidates =
      [];

    tables.forEach(
      table => {
        let el =
          table.parentElement;

        for (
          let depth = 0;
          el &&
          el !== content &&
          depth < 6;
          depth += 1,
          el =
            el.parentElement
        ) {
          const text =
            norm(
              el.textContent
            );

          const match =
            labels.some(
              label =>
                text.includes(
                  norm(
                    `${label} 평가액`
                  )
                )
            );

          if (match) {
            candidates.push({
              el,
              table,
              size:
                clean(
                  el.textContent
                ).length
            });

            break;
          }
        }
      }
    );

    candidates.sort(
      (
        a,
        b
      ) =>
        a.size -
        b.size
    );

    return (
      candidates[0] ||
      null
    );
  }


  function rowCode(
    row,
    holdings
  ) {
    const t =
      norm(
        row.textContent
      );

    const byCode =
      holdings.filter(
        h =>
          t.includes(
            norm(
              h.code
            )
          )
      );

    if (
      byCode.length === 1
    ) {
      return byCode[0];
    }


    const byName =
      holdings.filter(
        h => {
          const name =
            marketName(
              h.code
            );

          return (
            name &&
            t.includes(
              norm(name)
            )
          );
        }
      );

    if (
      byName.length === 1
    ) {
      return byName[0];
    }


    return null;
  }


  function addAccountButton(
    section,
    account,
    owner
  ) {
    if (
      !section ||
      section.querySelector(
        `[
          data-v33-add-account="${account}"
        ][
          data-v33-add-owner="${owner || ''}"
        ]`
          .replace(
            /\s+/g,
            ''
          )
      )
    ) {
      return;
    }


    const button =
      document
        .createElement(
          'button'
        );

    button.type =
      'button';

    button.className =
      'btn v33-account-add-btn';

    button.textContent =
      '+ 종목';

    button.dataset
      .v33AddAccount =
      account;

    button.dataset
      .v33AddOwner =
      owner || '';


    const heading =
      Array.from(
        section.children
      )
        .find(
          el =>
            /^(H1|H2|H3|DIV)$/
              .test(
                el.tagName
              )
        );


    if (heading) {
      heading.appendChild(
        button
      );

    } else {
      section.prepend(
        button
      );
    }
  }


  function bindRows(
    table,
    account,
    owner
  ) {
    if (!table) {
      return;
    }

    const holdings =
      accountHoldings(
        account,
        owner
      );


    table
      .querySelectorAll(
        'tbody tr'
      )
      .forEach(
        row => {
          if (
            row.classList
              .contains(
                'v33-account-total-row'
              )
          ) {
            return;
          }

          const h =
            rowCode(
              row,
              holdings
            );

          if (!h) {
            return;
          }

          row.dataset
            .v33HoldingId =
            h.id;

          row.dataset
            .v33Account =
            account;

          row.dataset
            .v33Code =
            h.code;

          if (owner) {
            row.dataset
              .v33Owner =
              owner;
          }

          row
            .querySelectorAll(
              'button'
            )
            .forEach(
              button => {
                const label =
                  norm(
                    button.textContent
                  );

                if (
                  label ===
                    '종료' ||
                  label ===
                    '보유종료'
                ) {
                  button.textContent =
                    '보유 종료';

                  button.classList.add(
                    'v33-life-v2-close'
                  );

                  button.dataset
                    .v33HoldingId =
                    h.id;
                }
              }
            );
        }
      );
  }


  function enhanceStandardAccounts() {
    ACCOUNT_DEFS
      .forEach(
        def => {
          const found =
            findSectionByLabels(
              def.labels
            );

          if (!found) {
            return;
          }

          found.el.dataset
            .v33AccountSection =
            def.id;

          addAccountButton(
            found.el,
            def.id,
            ''
          );

          bindRows(
            found.table,
            def.id,
            ''
          );
        }
      );
  }


  // ============================================================
  // CHILD
  // ============================================================

  function childOwners() {
    return Array.from(
      new Set(
        (data.holdings || [])
          .filter(
            h =>
              h.account ===
              'CHILD' &&
              clean(
                h.owner
              )
          )
          .map(
            h =>
              clean(
                h.owner
              )
          )
      )
    );
  }


  function childHoldingRows(
    owner
  ) {
    return accountHoldings(
      'CHILD',
      owner
    );
  }


  function childTableHtml(
    owner
  ) {
    const rows =
      childHoldingRows(
        owner
      );

    return `
      <div
        class="v33-child-owner"
        data-v33-child-owner="${esc(owner)}"
      >

        <div
          class="v33-child-owner-head"
        >
          <strong>
            ${esc(owner)}
          </strong>

          <button
            type="button"
            class="btn v33-account-add-btn"
            data-v33-add-account="CHILD"
            data-v33-add-owner="${esc(owner)}"
          >
            + 종목
          </button>
        </div>


        <div
          class="tableWrap"
        >
          <table
            class="mid v33-child-edit-table"
          >

            <thead>
              <tr>
                <th>종목</th>
                <th>Code</th>
                <th>보유수량</th>
                <th>평단</th>
                <th>보유 종료</th>
              </tr>
            </thead>

            <tbody>

              ${
                rows.length
                  ? rows
                      .map(
                        h => `
                          <tr
                            data-v33-holding-id="${esc(h.id)}"
                            data-v33-account="CHILD"
                            data-v33-owner="${esc(owner)}"
                            data-v33-code="${esc(h.code)}"
                          >

                            <td>
                              ${esc(
                                marketName(
                                  h.code
                                )
                              )}
                            </td>

                            <td>
                              ${esc(h.code)}
                            </td>

                            <td>
                              <input
                                type="number"
                                step="any"
                                data-v33-child-qty
                                value="${esc(h.qty || 0)}"
                              >
                            </td>

                            <td>
                              <input
                                type="number"
                                step="any"
                                data-v33-child-avg
                                value="${esc(h.avg || 0)}"
                              >
                            </td>

                            <td>
                              <button
                                type="button"
                                class="btn v33-life-v2-close"
                                data-v33-holding-id="${esc(h.id)}"
                              >
                                보유 종료
                              </button>
                            </td>

                          </tr>
                        `
                      )
                      .join('')

                  : `
                    <tr>
                      <td
                        colspan="5"
                        class="v33-life-empty"
                      >
                        Active 보유 종목 없음
                      </td>
                    </tr>
                  `
              }

            </tbody>

          </table>
        </div>

      </div>
    `;
  }


  function childEditorHtml() {
    const owners =
      childOwners();

    if (
      !owners.length
    ) {
      return '';
    }

    return `
      <section
        class="v33-child-editor"
        id="v33-child-editor"
      >

        <div
          class="v33-child-editor-head"
        >

          <div>
            <div
              class="v33-life-title"
            >
              자녀연금 보유정보
            </div>

            <div class="small">
              Owner별 보유수량 · 평단 수동관리
            </div>
          </div>

          <button
            type="button"
            class="btn primary"
            data-v33-child-save
          >
            저장·재계산
          </button>

        </div>

        ${
          owners
            .map(
              childTableHtml
            )
            .join('')
        }

      </section>
    `;
  }


  function installChildEditor() {
    const content =
      document
        .getElementById(
          'content'
        );

    if (
      !content ||
      document
        .getElementById(
          'v33-child-editor'
        )
    ) {
      return;
    }


    const oldChild =
      findSectionByLabels(
        [
          '자녀연금',
          '자녀연금계좌',
          '서현서진연금'
        ]
      );


    if (!oldChild) {
      return;
    }


    const wrap =
      document
        .createElement(
          'div'
        );

    wrap.innerHTML =
      childEditorHtml();


    const editor =
      wrap.firstElementChild;

    if (!editor) {
      return;
    }


    oldChild.el
      .insertAdjacentElement(
        'afterend',
        editor
      );


    oldChild.el.classList
      .add(
        'v33-child-old-hidden'
      );
  }


  function saveChildEditor() {
    const editor =
      document
        .getElementById(
          'v33-child-editor'
        );

    if (!editor) {
      return;
    }


    const updates = [];


    editor
      .querySelectorAll(
        'tr[data-v33-holding-id]'
      )
      .forEach(
        row => {
          const id =
            row.dataset
              .v33HoldingId;

          const qty =
            Number(
              row
                .querySelector(
                  '[data-v33-child-qty]'
                )
                ?.value
            );

          const avg =
            Number(
              row
                .querySelector(
                  '[data-v33-child-avg]'
                )
                ?.value
            );


          if (
            !Number.isFinite(
              qty
            ) ||
            qty < 0
          ) {
            throw new Error(
              `${row.dataset.v33Owner} / ` +
              `${row.dataset.v33Code}: ` +
              '보유수량이 올바르지 않습니다.'
            );
          }


          if (
            !Number.isFinite(
              avg
            ) ||
            avg < 0
          ) {
            throw new Error(
              `${row.dataset.v33Owner} / ` +
              `${row.dataset.v33Code}: ` +
              '평단이 올바르지 않습니다.'
            );
          }


          updates.push({
            id,
            qty,
            avg
          });
        }
      );


    updates.forEach(
      update => {
        const h =
          (data.holdings || [])
            .find(
              item =>
                item.id ===
                update.id
            );

        if (!h) {
          return;
        }

        h.qty =
          update.qty;

        h.avg =
          update.avg;
      }
    );


    try {
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
        setTimeout(
          render,
          0
        );
      }

    } catch (e) {
      alert(
        `저장 중 오류가 발생했습니다.\n${
          e.message ||
          e
        }`
      );
    }
  }


  // ============================================================
  // Add modal
  // ============================================================

  function openFor(
    account,
    owner
  ) {
    if (
      !window.v33Lifecycle ||
      typeof window
        .v33Lifecycle
        .openAddModal !==
        'function'
    ) {
      alert(
        '종목 추가 기능을 찾지 못했습니다.'
      );

      return;
    }


    window
      .v33Lifecycle
      .openAddModal();


    setTimeout(
      () => {
        const modal =
          document
            .getElementById(
              'v33-add-holding-back'
            );

        if (!modal) {
          return;
        }


        const accountSelect =
          modal.querySelector(
            '[data-v33-add-account]'
          );

        const ownerSelect =
          modal.querySelector(
            '[data-v33-add-owner]'
          );

        const accountField =
          accountSelect
            ?.closest(
              'label'
            );

        const ownerField =
          modal.querySelector(
            '[data-v33-owner-field]'
          );


        if (accountSelect) {
          accountSelect.value =
            account;
        }


        if (
          ownerSelect &&
          owner
        ) {
          ownerSelect.value =
            owner;
        }


        if (accountField) {
          accountField.hidden =
            true;
        }


        if (ownerField) {
          ownerField.hidden =
            true;
        }


        modal.dataset
          .v33FixedAccount =
          account;

        modal.dataset
          .v33FixedOwner =
          owner || '';


        const title =
          modal.querySelector(
            '.v33-life-modal-title'
          );


        if (title) {
          title.textContent =
            `${account === 'CHILD'
              ? owner
              : accountTitle(account)
            } · + 종목`;
        }
      },
      0
    );
  }


  function resetAddModalOnClose() {
    const modal =
      document
        .getElementById(
          'v33-add-holding-back'
        );

    if (!modal) {
      return;
    }

    if (
      !modal.hidden
    ) {
      return;
    }


    const accountField =
      modal
        .querySelector(
          '[data-v33-add-account]'
        )
        ?.closest(
          'label'
        );

    if (accountField) {
      accountField.hidden =
        false;
    }


    delete modal.dataset
      .v33FixedAccount;

    delete modal.dataset
      .v33FixedOwner;
  }


  // ============================================================
  // Exact close
  // ============================================================

  function closeHolding(
    id
  ) {
    const h =
      (data.holdings || [])
        .find(
          item =>
            item.id === id
        );


    if (
      !h ||
      !active(h)
    ) {
      alert(
        'Active 보유 기록을 찾지 못했습니다.'
      );

      return;
    }


    const qty =
      Number(
        h.qty
      ) ||
      0;


    const label =
      h.account ===
        'CHILD'

        ? `${h.owner} / ${marketName(h.code)}`

        : `${accountTitle(h.account)} / ${marketName(h.code)}`;


    const message =
      qty > 0

        ? `${label}\n` +
          `현재 보유수량 ${qty.toLocaleString('ko-KR')}개입니다.\n\n` +
          '보유 종료하면 Active 보유에서 제외됩니다.\n' +
          '기준정보·실현손익·누적배당·과거 기록은 유지됩니다.\n\n' +
          '계속할까요?'

        : `${label}를 보유 종료할까요?\n\n` +
          '기준정보와 과거 기록은 유지됩니다.';


    if (
      !confirm(
        message
      )
    ) {
      return;
    }


    h.status =
      'Closed';

    h.closedAt =
      new Date()
        .toISOString();


    try {
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
        setTimeout(
          render,
          0
        );
      }

    } catch (e) {
      alert(
        `보유 종료 중 오류가 발생했습니다.\n${
          e.message ||
          e
        }`
      );
    }
  }


  // ============================================================
  // Move advanced settings to bottom
  // ============================================================

  function simplifyLifecycleRoot() {
    const root =
      document
        .getElementById(
          'v33-lifecycle-root'
        );


    const content =
      document
        .getElementById(
          'content'
        );


    if (
      !root ||
      !content
    ) {
      return;
    }


    const head =
      root.querySelector(
        '.v33-life-head'
      );


    if (head) {
      head.hidden =
        true;
    }


    root.classList
      .add(
        'v33-life-bottom'
      );


    if (
      root !==
      content.lastElementChild
    ) {
      content.appendChild(
        root
      );
    }


    const summary =
      root.querySelector(
        '.v33-life-advanced > summary'
      );


    if (summary) {
      summary.textContent =
        '고급 설정';
    }
  }


  // ============================================================
  // Events
  // ============================================================

  function onClick(
    event
  ) {
    const add =
      event.target
        .closest(
          '[data-v33-add-account]'
        );


    if (
      add &&
      add.classList
        .contains(
          'v33-account-add-btn'
        )
    ) {
      event.preventDefault();

      event.stopPropagation();

      openFor(
        add.dataset
          .v33AddAccount,
        add.dataset
          .v33AddOwner ||
          ''
      );

      return;
    }


    const close =
      event.target
        .closest(
          '.v33-life-v2-close'
        );


    if (close) {
      event.preventDefault();

      event.stopPropagation();

      event.stopImmediatePropagation();

      closeHolding(
        close.dataset
          .v33HoldingId
      );

      return;
    }


    const childSave =
      event.target
        .closest(
          '[data-v33-child-save]'
        );


    if (childSave) {
      event.preventDefault();

      try {
        saveChildEditor();

      } catch (e) {
        alert(
          e.message ||
          e
        );
      }
    }
  }


  function apply() {
    const content =
      document
        .getElementById(
          'content'
        );


    if (!content) {
      return;
    }


    enhanceStandardAccounts();

    simplifyLifecycleRoot();

    resetAddModalOnClose();
  }


  function queue() {
    if (queued) {
      return;
    }


    queued =
      true;


    requestAnimationFrame(
      () => {
        queued =
          false;

        apply();
      }
    );
  }


  window.addEventListener(
    'load',
    () => {
      const content =
        document
          .getElementById(
            'content'
          );


      if (!content) {
        return;
      }


      content.addEventListener(
        'click',
        onClick,
        true
      );


      new MutationObserver(
        queue
      )
        .observe(
          content,
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
    'v3.3 holding lifecycle v2 loaded'
  );

})();
