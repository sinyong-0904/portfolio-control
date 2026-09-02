// Portfolio Control v3.3
// Holding Lifecycle - Core
// Exact account/code/owner binding + close/reopen + advanced shell.

(function () {
  'use strict';

  const ACCOUNT_DEFS = [
    { id: 'DC', labels: ['DC'] },
    { id: 'P1', labels: ['개인연금1', '연금(1)', 'P1'] },
    { id: 'P2', labels: ['개인연금2', '연금(2)', 'P2'] },
    { id: 'ISA', labels: ['ISA'] },
    { id: 'GENERAL', labels: ['일반계좌', 'GENERAL'] }
  ];

  let queued = false;


  function clean(v) {
    return String(
      v == null ? '' : v
    )
      .replace(/\s+/g, ' ')
      .trim();
  }


  function norm(v) {
    return clean(v)
      .replace(/\s+/g, '')
      .toUpperCase();
  }


  function esc(v) {
    return clean(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }


  function finite(v) {
    const n = Number(v);

    return Number.isFinite(n)
      ? n
      : null;
  }


  function active(h) {
    return (
      norm(h?.status) ===
      'ACTIVE'
    );
  }


  function accountLabel(id) {
    const account =
      (data.accounts || [])
        .find(
          a => a.id === id
        );

    if (account?.name) {
      return clean(
        account.name
      );
    }

    return (
      ACCOUNT_DEFS
        .find(
          d => d.id === id
        )
        ?.labels[0] ||
      id
    );
  }


  function master(code) {
    const c = norm(code);

    return (
      (data.market || [])
        .find(
          m =>
            norm(m.code) === c
        ) ||
      null
    );
  }


  function marketName(code) {
    return (
      clean(
        master(code)?.name
      ) ||
      clean(code)
    );
  }


  function childOwners() {
    const profiles =
      (data.childProfiles || [])
        .map(
          x =>
            clean(x?.owner)
        )
        .filter(Boolean);

    const holdings =
      (data.holdings || [])
        .filter(
          h =>
            h.account === 'CHILD'
        )
        .map(
          h =>
            clean(h.owner)
        )
        .filter(Boolean);

    return Array.from(
      new Set([
        ...profiles,
        ...holdings
      ])
    );
  }


  function holdingsFor(
    account,
    owner = ''
  ) {
    return (
      data.holdings || []
    )
      .filter(
        h =>
          active(h) &&
          h.account === account &&
          (
            account !== 'CHILD' ||
            clean(h.owner) ===
              clean(owner)
          )
      );
  }


  function isHoldingTable(table) {
    const text =
      Array.from(
        table.querySelectorAll(
          'thead th'
        )
      )
        .map(
          th =>
            norm(
              th.textContent
            )
        )
        .join('|');

    return (
      text.includes('종목') &&
      (
        text.includes('수량') ||
        text.includes('보유')
      ) &&
      (
        text.includes('평단') ||
        text.includes('평균단가') ||
        text.includes('매수금액')
      )
    );
  }


  function headerIndex(
    table,
    patterns
  ) {
    const hs =
      Array.from(
        table.querySelectorAll(
          'thead th'
        )
      )
        .map(
          th =>
            clean(
              th.textContent
            )
        );

    return hs.findIndex(
      h =>
        patterns.some(
          re =>
            re.test(
              h.replace(
                /\s+/g,
                ''
              )
            )
        )
    );
  }


  function findSection(labels) {
    const content =
      document.getElementById(
        'content'
      );

    if (!content) {
      return null;
    }

    const candidates = [];

    Array.from(
      content.querySelectorAll(
        'table'
      )
    )
      .filter(
        isHoldingTable
      )
      .forEach(
        table => {
          let el =
            table.parentElement;

          for (
            let depth = 0;
            el &&
            el !== content &&
            depth < 7;
            depth += 1,
            el = el.parentElement
          ) {
            const t =
              norm(
                el.textContent
              );

            if (
              labels.some(
                label =>
                  t.includes(
                    norm(
                      `${label} 평가액`
                    )
                  )
              )
            ) {
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
      (a, b) =>
        a.size - b.size
    );

    return (
      candidates[0] ||
      null
    );
  }


  function rowHolding(
    row,
    account,
    owner = ''
  ) {
    const rowText =
      norm(
        row.textContent
      );

    const list =
      holdingsFor(
        account,
        owner
      );

    let matches =
      list.filter(
        h =>
          rowText.includes(
            norm(h.code)
          )
      );

    if (
      matches.length === 1
    ) {
      return matches[0];
    }

    matches =
      list.filter(
        h => {
          const name =
            marketName(
              h.code
            );

          return (
            name &&
            rowText.includes(
              norm(name)
            )
          );
        }
      );

    return (
      matches.length === 1
        ? matches[0]
        : null
    );
  }


  function hideLegacyButtons(
    root
  ) {
    if (!root) {
      return;
    }

    root
      .querySelectorAll(
        'button'
      )
      .forEach(
        button => {
          if (
            button.classList
              .contains(
                'v33-life-final-add'
              ) ||
            button.classList
              .contains(
                'v33-life-final-close'
              )
          ) {
            return;
          }

          const t =
            norm(
              button.textContent
            );

          if (
            t === '+종목' ||
            t === '종목추가' ||
            t === '+종목추가' ||
            t === '종료' ||
            t === '보유종료'
          ) {
            button.classList.add(
              'v33-life-legacy-hidden'
            );
          }
        }
      );
  }


  function addAccountButton(
    table,
    account,
    owner = ''
  ) {
    const anchor =
      table.closest(
        '.tableWrap'
      ) ||
      table;

    const parent =
      anchor.parentElement;

    if (!parent) {
      return;
    }

    const key =
      `${account}::${owner}`;

    const existing =
      Array.from(
        parent.querySelectorAll(
          '.v33-life-final-add'
        )
      )
        .find(
          button =>
            button.dataset
              .v33LifeKey ===
            key
        );

    if (existing) {
      return;
    }

    const bar =
      document.createElement(
        'div'
      );

    bar.className =
      'v33-life-account-tools';

    const button =
      document.createElement(
        'button'
      );

    button.type =
      'button';

    button.className =
      'btn v33-life-final-add';

    button.dataset
      .v33LifeKey =
      key;

    button.dataset
      .v33Account =
      account;

    button.dataset
      .v33Owner =
      owner;

    button.textContent =
      account === 'CHILD'
        ? `+ ${owner} 종목`
        : '+ 종목';

    bar.appendChild(
      button
    );

    parent.insertBefore(
      bar,
      anchor
    );
  }


  function addCloseButton(
    row,
    holding
  ) {
    if (
      row.querySelector(
        `.v33-life-final-close[data-v33-holding-id="${CSS.escape(holding.id)}"]`
      )
    ) {
      return;
    }

    hideLegacyButtons(
      row
    );

    const button =
      document.createElement(
        'button'
      );

    button.type =
      'button';

    button.className =
      'btn v33-life-final-close';

    button.dataset
      .v33HoldingId =
      holding.id;

    button.textContent =
      '보유 종료';

    const legacy =
      Array.from(
        row.querySelectorAll(
          '.v33-life-legacy-hidden'
        )
      )
        .find(
          el =>
            ['종료', '보유종료']
              .includes(
                norm(
                  el.textContent
                )
              )
        );

    if (
      legacy?.parentElement
    ) {
      legacy.insertAdjacentElement(
        'afterend',
        button
      );

    } else {
      (
        row.lastElementChild ||
        row
      )
        .appendChild(
          button
        );
    }
  }


  function enhanceAccounts() {
    ACCOUNT_DEFS
      .forEach(
        def => {
          const found =
            findSection(
              def.labels
            );

          if (!found) {
            return;
          }

          hideLegacyButtons(
            found.el
          );

          addAccountButton(
            found.table,
            def.id
          );

          found.table
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

                const holding =
                  rowHolding(
                    row,
                    def.id
                  );

                if (!holding) {
                  return;
                }

                row.dataset
                  .v33HoldingId =
                  holding.id;

                addCloseButton(
                  row,
                  holding
                );
              }
            );
        }
      );
  }


  function closeHolding(id) {
    const h =
      (data.holdings || [])
        .find(
          item =>
            clean(item.id) ===
            clean(id)
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
      finite(h.qty) || 0;

    const scope =
      h.account === 'CHILD'
        ? `${clean(h.owner)} / ${marketName(h.code)}`
        : `${accountLabel(h.account)} / ${marketName(h.code)}`;

    const message =
      qty > 0
        ? (
            `${scope} (${h.code})\n` +
            `현재 보유수량 ${qty.toLocaleString('ko-KR')}개입니다.\n\n` +
            `보유 종료하면 이 보유만 Active 목록에서 제외됩니다.\n` +
            `종목 기준정보·실현손익·누적배당·과거 기록은 유지됩니다.\n\n` +
            `계속할까요?`
          )
        : (
            `${scope} (${h.code})를 보유 종료할까요?\n\n` +
            `종목 기준정보와 과거 기록은 유지됩니다.`
          );

    if (
      !confirm(message)
    ) {
      return;
    }

    h.status =
      'Closed';

    h.closedAt =
      new Date()
        .toISOString();

    saveRender();
  }


  function reopenHolding(id) {
    const h =
      (data.holdings || [])
        .find(
          item =>
            clean(item.id) ===
            clean(id)
        );

    if (
      !h ||
      active(h)
    ) {
      return;
    }

    const duplicate =
      (data.holdings || [])
        .find(
          item =>
            item !== h &&
            active(item) &&
            item.account ===
              h.account &&
            norm(item.code) ===
              norm(h.code) &&
            (
              h.account !==
                'CHILD' ||
              clean(item.owner) ===
                clean(h.owner)
            )
        );

    if (duplicate) {
      alert(
        '같은 계좌/Owner에 동일 종목이 이미 Active 상태입니다.'
      );

      return;
    }

    if (
      !confirm(
        `${accountLabel(h.account)} / ` +
        `${marketName(h.code)} (${h.code})를 재활성화할까요?\n\n` +
        `기존 실현손익·누적배당 기록은 유지됩니다.`
      )
    ) {
      return;
    }

    h.status =
      'Active';

    h.reopenedAt =
      new Date()
        .toISOString();

    saveRender();
  }


  function saveRender() {
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
      console.error(
        '[life-core]',
        e
      );

      alert(
        `저장 중 오류가 발생했습니다.\n${
          e?.message || e
        }`
      );
    }
  }


  function closedHtml() {
    const rows =
      (data.holdings || [])
        .filter(
          h =>
            !active(h)
        );

    if (!rows.length) {
      return `
        <div class="v33-life-empty">
          종료된 보유 기록이 없습니다.
        </div>
      `;
    }

    return `
      <div class="tableWrap">

        <table class="mid">

          <thead>
            <tr>
              <th>계좌</th>
              <th>종목</th>
              <th>Owner</th>
              <th>종료수량</th>
              <th>종료일</th>
              <th>재매수</th>
            </tr>
          </thead>

          <tbody>

            ${
              rows.map(
                h => `
                  <tr>

                    <td>
                      ${esc(
                        accountLabel(
                          h.account
                        )
                      )}
                    </td>

                    <td>
                      ${esc(
                        marketName(
                          h.code
                        )
                      )}
                      <div class="small">
                        ${esc(h.code)}
                      </div>
                    </td>

                    <td>
                      ${esc(
                        clean(h.owner) ||
                        '-'
                      )}
                    </td>

                    <td>
                      ${
                        (
                          finite(h.qty) ||
                          0
                        )
                          .toLocaleString(
                            'ko-KR'
                          )
                      }
                    </td>

                    <td>
                      ${esc(
                        clean(
                          h.closedAt
                        )
                          .slice(
                            0,
                            10
                          ) ||
                        '-'
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        class="btn v33-life-reopen"
                        data-v33-holding-id="${esc(h.id)}"
                      >
                        재활성화
                      </button>
                    </td>

                  </tr>
                `
              ).join('')
            }

          </tbody>

        </table>

      </div>
    `;
  }


  function ensureAdvanced() {
    const content =
      document.getElementById(
        'content'
      );

    if (
      !content ||
      document.getElementById(
        'v33-life-advanced'
      )
    ) {
      return;
    }

    const root =
      document.createElement(
        'section'
      );

    root.id =
      'v33-life-advanced';

    root.className =
      'v33-life-advanced-root';

    root.innerHTML = `
      <details>

        <summary>
          고급 설정
        </summary>

        <div class="v33-life-advanced-body">

          <div class="v33-life-subtitle">
            종목 기준정보
          </div>

          <div class="notice">
            종목 기준정보 편집은 이 영역에서 관리합니다.
            자동가격 필드는 편집하지 않습니다.
          </div>

          <div
            id="v33-life-master-host"
          ></div>

          <div class="v33-life-subtitle v33-life-closed-title">
            종료된 보유 기록
          </div>

          ${closedHtml()}

        </div>

      </details>
    `;

    content.appendChild(
      root
    );

    window.dispatchEvent(
      new CustomEvent(
        'v33-life:advanced-ready'
      )
    );
  }


  function isAccountView() {
    const content =
      document.getElementById(
        'content'
      );

    if (!content) {
      return false;
    }

    const t =
      norm(
        content.textContent
      );

    return (
      t.includes(
        '보유정보'
      ) ||
      (
        t.includes(
          '평가액'
        ) &&
        t.includes(
          '평단'
        ) &&
        t.includes(
          '계좌'
        )
      )
    );
  }


  function apply() {
    if (
      !isAccountView()
    ) {
      return;
    }

    enhanceAccounts();

    ensureAdvanced();

    window.dispatchEvent(
      new CustomEvent(
        'v33-life:apply'
      )
    );
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


  function onClick(event) {
    const close =
      event.target.closest(
        '.v33-life-final-close'
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


    const reopen =
      event.target.closest(
        '.v33-life-reopen'
      );

    if (reopen) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      reopenHolding(
        reopen.dataset
          .v33HoldingId
      );

      return;
    }
  }


  function start() {
    document.addEventListener(
      'click',
      onClick,
      true
    );

    const content =
      document.getElementById(
        'content'
      );

    if (content) {
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
    }

    queue();
  }


  window.v33LifeCore = {
    clean,
    norm,
    esc,
    finite,
    active,
    accountLabel,
    master,
    marketName,
    childOwners,
    holdingsFor,
    isHoldingTable,
    headerIndex,
    findSection,
    rowHolding,
    addAccountButton,
    addCloseButton,
    hideLegacyButtons,
    saveRender,
    queue
  };


  if (
    document.readyState ===
    'loading'
  ) {
    window.addEventListener(
      'load',
      start,
      {
        once: true
      }
    );

  } else {
    start();
  }


  console.info(
    '[Portfolio Control] lifecycle core loaded'
  );
  // ============================================================
  // Legacy visible button bridge
  // ============================================================
  //
  // 기존 account renderer가 실제 화면에 만드는
  // +종목 / 종료 버튼을 그대로 사용한다.
  //
  // 새 버튼을 추가하지 않고 기존 버튼에
  // account / holding id를 직접 binding한다.
  //

  function legacyAccountContext(
    button
  ) {
    const content =
      document.getElementById(
        'content'
      );

    if (!content) {
      return null;
    }


    for (
      const def of
      ACCOUNT_DEFS
    ) {
      const found =
        findSection(
          def.labels
        );

      if (
        found &&
        found.el.contains(
          button
        )
      ) {
        return {
          account:
            def.id,

          owner: '',

          section:
            found.el,

          table:
            found.table
        };
      }
    }


    return null;
  }


  function legacyHoldingForButton(
    button
  ) {
    const row =
      button.closest(
        'tr'
      );

    if (!row) {
      return null;
    }


    //
    // 이미 정확한 holding id가
    // binding되어 있으면 그것을 우선.
    //

    const boundId =
      row.dataset
        .v33HoldingId;


    if (boundId) {
      const bound =
        (data.holdings || [])
          .find(
            h =>
              clean(
                h.id
              ) ===
              clean(
                boundId
              )
          );

      if (
        bound &&
        active(bound)
      ) {
        return bound;
      }
    }


    const context =
      legacyAccountContext(
        button
      );


    if (!context) {
      return null;
    }


    return rowHolding(
      row,
      context.account,
      context.owner
    );
  }


  function isEmptyNewHolding(
    h
  ) {
    if (!h) {
      return false;
    }


    const qty =
      finite(
        h.qty
      ) || 0;


    const avg =
      finite(
        h.avg
      ) || 0;


    const realized =
      finite(
        h.realized
      ) || 0;


    const dividend =
      finite(
        h.cumDividend
      ) || 0;


    return (
      active(h) &&
      qty === 0 &&
      avg === 0 &&
      realized === 0 &&
      dividend === 0
    );
  }


  function cancelEmptyHolding(
    id
  ) {
    const index =
      (data.holdings || [])
        .findIndex(
          h =>
            clean(
              h.id
            ) ===
            clean(id)
        );


    if (
      index < 0
    ) {
      alert(
        '등록 취소할 보유 기록을 찾지 못했습니다.'
      );

      return;
    }


    const h =
      data.holdings[
        index
      ];


    if (
      !isEmptyNewHolding(
        h
      )
    ) {
      alert(
        '수량/평단/실현손익/누적배당 중 값이 있는 보유는 등록 취소할 수 없습니다.\n' +
        '일반 보유 종료를 사용하세요.'
      );

      return;
    }


    const scope =
      h.account ===
      'CHILD'

        ? `${clean(h.owner)} / ${marketName(h.code)}`

        : `${accountLabel(h.account)} / ${marketName(h.code)}`;


    if (
      !confirm(
        `${scope} (${h.code})의 신규 등록을 취소할까요?\n\n` +
        '보유수량과 성과 기록이 모두 0인 holding만 삭제됩니다.\n' +
        '종목 기준정보(master)는 삭제하지 않습니다.'
      )
    ) {
      return;
    }


    data.holdings.splice(
      index,
      1
    );


    saveRender();
  }


  function bindLegacyVisibleButtons() {
    if (
      !isAccountView()
    ) {
      return;
    }


    const content =
      document.getElementById(
        'content'
      );


    if (!content) {
      return;
    }


    //
    // ----------------------------------------
    // 기존 +종목
    // ----------------------------------------
    //

    content
      .querySelectorAll(
        'button'
      )
      .forEach(
        button => {

          if (
            button.classList
              .contains(
                'v33-life-final-add'
              ) ||
            button.classList
              .contains(
                'v33-life-final-close'
              ) ||
            button.classList
              .contains(
                'v33-life-cancel'
              )
          ) {
            return;
          }


          const label =
            norm(
              button.textContent
            );


          if (
            label ===
              '+종목' ||
            label ===
              '종목추가' ||
            label ===
              '+종목추가'
          ) {
            const context =
              legacyAccountContext(
                button
              );


            if (!context) {
              return;
            }


            button.classList
              .remove(
                'v33-life-legacy-hidden'
              );


            button.classList
              .add(
                'v33-life-legacy-add'
              );


            button.dataset
              .v33Account =
              context.account;


            button.dataset
              .v33Owner =
              context.owner;
          }
        }
      );


    //
    // ----------------------------------------
    // 기존 종료
    // ----------------------------------------
    //

    content
      .querySelectorAll(
        'button'
      )
      .forEach(
        button => {

          if (
            button.classList
              .contains(
                'v33-life-final-close'
              ) ||
            button.classList
              .contains(
                'v33-life-cancel'
              )
          ) {
            return;
          }


          const label =
            norm(
              button.textContent
            );


          if (
            label !==
              '종료' &&
            label !==
              '보유종료'
          ) {
            return;
          }


          const h =
            legacyHoldingForButton(
              button
            );


          if (!h) {
            return;
          }


          button.classList
            .remove(
              'v33-life-legacy-hidden'
            );


          if (
            isEmptyNewHolding(
              h
            )
          ) {
            button.textContent =
              '등록 취소';


            button.classList
              .add(
                'v33-life-cancel'
              );


            button.dataset
              .v33HoldingId =
              h.id;

          } else {
            button.textContent =
              '보유 종료';


            button.classList
              .add(
                'v33-life-legacy-close'
              );


            button.dataset
              .v33HoldingId =
              h.id;
          }
        }
      );


    //
    // 우리가 전에 추가한 별도 버튼은 숨김.
    // 화면에는 기존 renderer 버튼 하나만 남긴다.
    //

    content
      .querySelectorAll(
        '.v33-life-final-add,' +
        '.v33-life-final-close'
      )
      .forEach(
        button => {
          button.style.display =
            'none';
        }
      );
  }


  function legacyBridgeQueue() {
    requestAnimationFrame(
      bindLegacyVisibleButtons
    );
  }


  window.addEventListener(
    'v33-life:apply',
    legacyBridgeQueue
  );


  window.addEventListener(
    'portfolio:saved',
    legacyBridgeQueue
  );


  window.v33LifeCore
    .bindLegacyVisibleButtons =
    bindLegacyVisibleButtons;


  window.v33LifeCore
    .cancelEmptyHolding =
    cancelEmptyHolding;


  window.v33LifeCore
    .legacyHoldingForButton =
    legacyHoldingForButton;


  //
  // 기존 renderer보다 먼저 click을 잡는다.
  //

  document.addEventListener(
    'click',
    function (
      event
    ) {

      const cancel =
        event.target.closest(
          '.v33-life-cancel'
        );


      if (cancel) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();


        cancelEmptyHolding(
          cancel.dataset
            .v33HoldingId
        );


        return;
      }


      const close =
        event.target.closest(
          '.v33-life-legacy-close'
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

    },
    true
  );


  legacyBridgeQueue();
})();
