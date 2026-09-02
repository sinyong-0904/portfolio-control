// Portfolio Control v3.3
// Holding Lifecycle - CHILD editable qty/avg.

(function () {
  'use strict';

  let queued = false;


  function C() {
    return window.v33LifeCore;
  }


  function ownerForRow(
    row,
    table
  ) {
    const owners =
      C().childOwners();

    const rowText =
      C().norm(
        row.textContent
      );

    let matches =
      owners.filter(
        owner =>
          rowText.includes(
            C().norm(owner)
          )
      );

    if (
      matches.length === 1
    ) {
      return matches[0];
    }


    let previous =
      row.previousElementSibling;

    for (
      let i = 0;
      previous &&
      i < 12;
      i += 1,
      previous =
        previous.previousElementSibling
    ) {
      const t =
        C().norm(
          previous.textContent
        );

      matches =
        owners.filter(
          owner =>
            t.includes(
              C().norm(owner)
            )
        );

      if (
        matches.length === 1
      ) {
        return matches[0];
      }
    }


    const anchor =
      table.closest(
        '.tableWrap'
      ) ||
      table;

    let prev =
      anchor.previousElementSibling;

    for (
      let i = 0;
      prev &&
      i < 6;
      i += 1,
      prev =
        prev.previousElementSibling
    ) {
      const t =
        C().norm(
          prev.textContent
        );

      matches =
        owners.filter(
          owner =>
            t.includes(
              C().norm(owner)
            )
        );

      if (
        matches.length === 1
      ) {
        return matches[0];
      }
    }


    return '';
  }


  function childTables() {
    const content =
      document.getElementById(
        'content'
      );

    if (!content) {
      return [];
    }

    const owners =
      C().childOwners();

    return Array.from(
      content.querySelectorAll(
        'table'
      )
    )
      .filter(
        C().isHoldingTable
      )
      .filter(
        table => {
          const t =
            C().norm(
              table.textContent
            );

          if (
            owners.some(
              owner =>
                t.includes(
                  C().norm(owner)
                )
            )
          ) {
            return true;
          }

          let el =
            table.parentElement;

          for (
            let i = 0;
            el &&
            el !== content &&
            i < 5;
            i += 1,
            el =
              el.parentElement
          ) {
            const context =
              C().norm(
                el.textContent
              );

            if (
              context.includes(
                '자녀연금'
              ) ||
              context.includes(
                '서현서진연금'
              )
            ) {
              return true;
            }
          }

          return false;
        }
      );
  }


  function makeInput(
    cell,
    holding,
    field
  ) {
    if (!cell) {
      return false;
    }

    if (
      cell.querySelector(
        `.v33-life-child-input[data-v33-field="${field}"]`
      )
    ) {
      return true;
    }

    const input =
      document.createElement(
        'input'
      );

    input.type =
      'number';

    input.step =
      'any';

    input.min =
      '0';

    input.className =
      'v33-life-child-input';

    input.dataset
      .v33HoldingId =
      holding.id;

    input.dataset
      .v33Field =
      field;

    input.value =
      String(
        C().finite(
          holding[field]
        ) ??
        0
      );

    cell.textContent =
      '';

    cell.appendChild(
      input
    );

    return true;
  }


  function saveBar(table) {
    const anchor =
      table.closest(
        '.tableWrap'
      ) ||
      table;

    const parent =
      anchor.parentElement;

    if (
      !parent ||
      parent.querySelector(
        '.v33-life-child-savebar'
      )
    ) {
      return;
    }

    const bar =
      document.createElement(
        'div'
      );

    bar.className =
      'v33-life-child-savebar';

    bar.innerHTML = `
      <span class="small">
        자녀연금 수량·평단 직접 수정
      </span>

      <button
        type="button"
        class="btn primary v33-life-child-save"
      >
        저장·재계산
      </button>
    `;

    anchor.insertAdjacentElement(
      'afterend',
      bar
    );
  }


  function ownerButtons(table) {
    const owners =
      C().childOwners();

    const anchor =
      table.closest(
        '.tableWrap'
      ) ||
      table;

    const parent =
      anchor.parentElement;

    if (
      !parent ||
      parent.querySelector(
        '.v33-life-child-tools'
      )
    ) {
      return;
    }

    const bar =
      document.createElement(
        'div'
      );

    bar.className =
      'v33-life-child-tools';

    owners.forEach(
      owner => {
        const button =
          document.createElement(
            'button'
          );

        button.type =
          'button';

        button.className =
          'btn v33-life-final-add';

        button.dataset
          .v33Account =
          'CHILD';

        button.dataset
          .v33Owner =
          owner;

        button.textContent =
          `+ ${owner} 종목`;

        bar.appendChild(
          button
        );
      }
    );

    parent.insertBefore(
      bar,
      anchor
    );
  }


  function enhance() {
    childTables()
      .forEach(
        table => {
          const qtyIdx =
            C().headerIndex(
              table,
              [
                /^수량$/i,
                /^보유수량$/i,
                /^보유량$/i,
                /^QTY$/i
              ]
            );

          const avgIdx =
            C().headerIndex(
              table,
              [
                /^평단$/i,
                /^평균단가$/i,
                /^평균매입가$/i,
                /^AVG$/i
              ]
            );

          if (
            qtyIdx < 0 &&
            avgIdx < 0
          ) {
            return;
          }

          ownerButtons(
            table
          );

          let editable = 0;

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

                const owner =
                  ownerForRow(
                    row,
                    table
                  );

                if (!owner) {
                  return;
                }

                const h =
                  C().rowHolding(
                    row,
                    'CHILD',
                    owner
                  );

                if (!h) {
                  return;
                }

                if (
                  qtyIdx >= 0
                ) {
                  makeInput(
                    row.children[
                      qtyIdx
                    ],
                    h,
                    'qty'
                  );

                  editable += 1;
                }

                if (
                  avgIdx >= 0
                ) {
                  makeInput(
                    row.children[
                      avgIdx
                    ],
                    h,
                    'avg'
                  );
                }

                C().addCloseButton(
                  row,
                  h
                );
              }
            );

          if (
            editable > 0
          ) {
            saveBar(
              table
            );
          }
        }
      );
  }


  function sync() {
    const pending = [];

    document
      .querySelectorAll(
        '.v33-life-child-input'
      )
      .forEach(
        input => {
          const id =
            C().clean(
              input.dataset
                .v33HoldingId
            );

          const field =
            C().clean(
              input.dataset
                .v33Field
            );

          const value =
            C().finite(
              input.value
            );

          if (
            value == null ||
            value < 0
          ) {
            throw new Error(
              `${
                field === 'qty'
                  ? '보유수량'
                  : '평단'
              } 값이 올바르지 않습니다.`
            );
          }

          pending.push({
            id,
            field,
            value
          });
        }
      );

    pending.forEach(
      p => {
        const h =
          (data.holdings || [])
            .find(
              item =>
                C().clean(
                  item.id
                ) ===
                p.id
            );

        if (h) {
          h[p.field] =
            p.value;
        }
      }
    );

    return pending.length;
  }


  function onClick(event) {
    const save =
      event.target.closest(
        '.v33-life-child-save'
      );

    if (save) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      try {
        sync();
        C().saveRender();

      } catch (e) {
        alert(
          e?.message || e
        );
      }

      return;
    }


    const normalSave =
      event.target.closest(
        'button'
      );

    if (!normalSave) {
      return;
    }

    const label =
      C().norm(
        normalSave.textContent
      );

    if (
      label.includes(
        '보유정보저장'
      ) ||
      (
        label.includes('저장') &&
        label.includes('재계산')
      )
    ) {
      try {
        sync();

      } catch (e) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        alert(
          e?.message || e
        );
      }
    }
  }


  function queue() {
    if (queued) {
      return;
    }

    queued = true;

    requestAnimationFrame(
      () => {
        queued = false;
        enhance();
      }
    );
  }


  function start() {
    document.addEventListener(
      'click',
      onClick,
      true
    );

    window.addEventListener(
      'v33-life:apply',
      queue
    );

    queue();
  }


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


  window.v33LifeChild = {
    enhance,
    sync
  };


  console.info(
    '[Portfolio Control] lifecycle CHILD loaded'
  );

})();
