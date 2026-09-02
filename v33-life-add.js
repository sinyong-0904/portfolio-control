// Portfolio Control v3.3
// Holding Lifecycle - Add / Master

(function () {
  'use strict';

  const MAP_KEYS = [
    'NASDAQ',
    'S&P500',
    'US-CVD',
    'K-DVD',
    'BOND',
    'GOLD',
    'GLOBAL',
    'WORLD',
    'PARKING'
  ];

  const PENSION =
    new Set([
      'DC',
      'P1',
      'P2'
    ]);


  function C() {
    return window.v33LifeCore;
  }


  function liveRows() {
    try {
      if (
        typeof window
          .marketLiveRowsV33 ===
        'function'
      ) {
        const rows =
          window
            .marketLiveRowsV33();

        if (
          Array.isArray(rows)
        ) {
          return rows;
        }
      }
    } catch (e) {}

    return [];
  }


  function live(code) {
    const c =
      C().norm(code);

    return (
      liveRows()
        .find(
          row =>
            C().norm(
              row.code ??
              row.symbol
            ) === c
        ) ||
      null
    );
  }


  function liveName(row) {
    return C().clean(
      row?.name ??
      row?.securityName ??
      ''
    );
  }


  function mappingText(code) {
    const map =
      data.mapping?.[code];

    if (
      !map ||
      typeof map !==
        'object'
    ) {
      return '';
    }

    return Object.entries(map)
      .filter(
        ([, v]) =>
          Number(v) !== 0
      )
      .map(
        ([k, v]) =>
          `${k}:${Number(v)}`
      )
      .join(', ');
  }


  function parseMapping(raw) {
    const value =
      C().clean(raw);

    if (!value) {
      return {
        ok: true,
        value: null
      };
    }

    const out = {};

    for (
      const part of
      value
        .split(',')
        .map(
          x => x.trim()
        )
        .filter(Boolean)
    ) {
      const idx =
        part.indexOf(':');

      if (idx < 1) {
        return {
          ok: false,
          message:
            `Mapping 형식 오류: ${part}`
        };
      }

      const key =
        C()
          .clean(
            part.slice(
              0,
              idx
            )
          )
          .toUpperCase();

      if (
        !MAP_KEYS.includes(
          key
        )
      ) {
        return {
          ok: false,
          message:
            `지원하지 않는 Mapping: ${key}`
        };
      }

      let rawAmount =
        C().clean(
          part.slice(
            idx + 1
          )
        );

      let amount;

      if (
        rawAmount.endsWith(
          '%'
        )
      ) {
        amount =
          Number(
            rawAmount.slice(
              0,
              -1
            )
          ) /
          100;

      } else {
        amount =
          Number(rawAmount);

        if (
          amount > 1 &&
          amount <= 100
        ) {
          amount /=
            100;
        }
      }

      if (
        !Number.isFinite(
          amount
        ) ||
        amount < 0 ||
        amount > 1
      ) {
        return {
          ok: false,
          message:
            `Mapping 비율 오류: ${part}`
        };
      }

      out[key] =
        (
          Number(
            out[key]
          ) ||
          0
        ) +
        amount;
    }

    const total =
      Object.values(out)
        .reduce(
          (sum, v) =>
            sum +
            Number(v),
          0
        );

    if (
      Math.abs(
        total - 1
      ) >
      0.0001
    ) {
      return {
        ok: false,
        message:
          `Mapping 합계가 ${(total * 100).toFixed(2)}%입니다.`
      };
    }

    return {
      ok: true,
      value: out
    };
  }


  function ensureModal() {
    let back =
      document.getElementById(
        'v33-life-add-modal'
      );

    if (back) {
      return back;
    }

    back =
      document.createElement(
        'div'
      );

    back.id =
      'v33-life-add-modal';

    back.className =
      'v33-life-modal-back';

    back.hidden =
      true;

    back.innerHTML = `
      <div class="v33-life-modal">

        <div class="v33-life-modal-head">

          <div>
            <div class="v33-life-modal-title">
              + 종목
            </div>

            <div class="small v33-life-modal-scope"></div>
          </div>

          <button
            type="button"
            class="btn v33-life-modal-close"
          >
            닫기
          </button>

        </div>

        <div class="v33-life-form">

          <label>
            Code

            <div class="v33-life-code-row">

              <input
                class="v33-life-code"
                maxlength="12"
                autocomplete="off"
                placeholder="예: 133690"
              >

              <button
                type="button"
                class="btn v33-life-lookup"
              >
                조회
              </button>

            </div>
          </label>

          <div class="v33-life-lookup-result">
            Code를 입력하고 조회하세요.
          </div>

          <label>
            종목명
            <input
              class="v33-life-name"
              autocomplete="off"
            >
          </label>

          <label>
            Category
            <input
              class="v33-life-category"
              autocomplete="off"
            >
          </label>

          <label>
            Mapping
            <input
              class="v33-life-mapping"
              autocomplete="off"
              placeholder="예: NASDAQ:1"
            >
          </label>

        </div>

        <div class="v33-life-modal-actions">
          <button
            type="button"
            class="btn primary v33-life-add-confirm"
          >
            보유 등록
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(
      back
    );

    return back;
  }


  function openModal(
    account,
    owner
  ) {
    const back =
      ensureModal();

    back.dataset.account =
      account;

    back.dataset.owner =
      owner || '';

    back.hidden =
      false;

    back.querySelector(
      '.v33-life-modal-scope'
    ).textContent =
      account === 'CHILD'
        ? `${owner} 자녀연금`
        : C().accountLabel(
            account
          );

    [
      '.v33-life-code',
      '.v33-life-name',
      '.v33-life-category',
      '.v33-life-mapping'
    ]
      .forEach(
        selector => {
          back.querySelector(
            selector
          ).value = '';
        }
      );

    const result =
      back.querySelector(
        '.v33-life-lookup-result'
      );

    result.textContent =
      'Code를 입력하고 조회하세요.';

    result.className =
      'v33-life-lookup-result';

    setTimeout(
      () =>
        back.querySelector(
          '.v33-life-code'
        ).focus(),
      0
    );
  }


  function closeModal() {
    const back =
      document.getElementById(
        'v33-life-add-modal'
      );

    if (back) {
      back.hidden = true;
    }
  }


  function lookup() {
    const back =
      ensureModal();

    const code =
      C().norm(
        back.querySelector(
          '.v33-life-code'
        ).value
      );

    const result =
      back.querySelector(
        '.v33-life-lookup-result'
      );

    back.querySelector(
      '.v33-life-code'
    ).value =
      code;

    if (
      !/^[0-9A-Z]{6}$/
        .test(code)
    ) {
      result.textContent =
        'Code는 6자리 영문/숫자로 입력하세요.';

      result.className =
        'v33-life-lookup-result is-error';

      return;
    }

    const m =
      C().master(code);

    const l =
      live(code);

    if (
      !m &&
      !l
    ) {
      result.textContent =
        '기존 master와 현재 자동가격 DB에서 찾지 못했습니다.';

      result.className =
        'v33-life-lookup-result is-error';

      return;
    }

    back.querySelector(
      '.v33-life-name'
    ).value =
      C().clean(
        m?.name ||
        liveName(l) ||
        code
      );

    back.querySelector(
      '.v33-life-category'
    ).value =
      C().clean(
        m?.category ||
        l?.category ||
        ''
      );

    back.querySelector(
      '.v33-life-mapping'
    ).value =
      mappingText(code);

    result.textContent =
      m
        ? '기존 종목 기준정보 확인'
        : '자동가격 DB 확인 · 신규 master 생성 가능';

    result.className =
      'v33-life-lookup-result is-ok';
  }


  function add() {
    const back =
      ensureModal();

    const account =
      C().clean(
        back.dataset.account
      );

    const owner =
      C().clean(
        back.dataset.owner
      );

    const code =
      C().norm(
        back.querySelector(
          '.v33-life-code'
        ).value
      );

    const name =
      C().clean(
        back.querySelector(
          '.v33-life-name'
        ).value
      );

    const category =
      C().clean(
        back.querySelector(
          '.v33-life-category'
        ).value
      );

    const parsed =
      parseMapping(
        back.querySelector(
          '.v33-life-mapping'
        ).value
      );

    if (
      !account ||
      (
        account === 'CHILD' &&
        !owner
      )
    ) {
      alert(
        '계좌 지정 오류입니다.'
      );

      return;
    }

    if (
      !/^[0-9A-Z]{6}$/
        .test(code)
    ) {
      alert(
        'Code는 6자리 영문/숫자로 입력하세요.'
      );

      return;
    }

    if (
      !parsed.ok
    ) {
      alert(
        parsed.message
      );

      return;
    }

    let m =
      C().master(code);

    const l =
      live(code);

    if (
      !m &&
      !l
    ) {
      alert(
        '자동가격 DB 또는 기존 master에서 종목을 확인할 수 없습니다.'
      );

      return;
    }

    if (
      !data.mapping ||
      typeof data.mapping !==
        'object'
    ) {
      data.mapping = {};
    }

    if (
      PENSION.has(
        account
      ) &&
      !parsed.value &&
      !data.mapping[code]
    ) {
      alert(
        '연금계좌 신규 종목은 Mapping이 필요합니다.'
      );

      return;
    }

    if (
      !Array.isArray(
        data.holdings
      )
    ) {
      data.holdings = [];
    }

    const same =
      data.holdings
        .filter(
          h =>
            h.account ===
              account &&
            C().norm(
              h.code
            ) ===
              code &&
            (
              account !==
                'CHILD' ||
              C().clean(
                h.owner
              ) ===
                owner
            )
        );

    if (
      same.some(
        C().active
      )
    ) {
      alert(
        '같은 계좌/Owner에 이미 Active인 종목입니다.'
      );

      return;
    }

    if (!m) {
      if (
        !Array.isArray(
          data.market
        )
      ) {
        data.market = [];
      }

      m = {
        code,
        name:
          name ||
          liveName(l) ||
          code,
        category:
          category ||
          l?.category ||
          '',
        current: 0
      };

      data.market.push(
        m
      );

    } else {
      if (name) {
        m.name = name;
      }

      if (category) {
        m.category =
          category;
      }
    }

    if (
      parsed.value
    ) {
      data.mapping[code] =
        parsed.value;
    }

    const closed =
      same.find(
        h =>
          !C().active(h)
      );

    if (closed) {
      if (
        !confirm(
          `${C().marketName(code)}의 종료 기록을 재활성화할까요?\n\n` +
          `기존 실현손익·누적배당 기록은 유지됩니다.`
        )
      ) {
        return;
      }

      closed.status =
        'Active';

      closed.reopenedAt =
        new Date()
          .toISOString();

    } else {
      data.holdings.push({
        id:
          `h-${account.toLowerCase()}-` +
          `${code.toLowerCase()}-` +
          Date.now()
            .toString(36),

        account,

        ...(
          owner
            ? { owner }
            : {}
        ),

        code,
        qty: 0,
        target: 0,
        avg: 0,
        realized: 0,
        cumDividend: 0,
        status: 'Active',
        createdAt:
          new Date()
            .toISOString()
      });
    }

    closeModal();

    C().saveRender();
  }


  function masterHtml() {
    const rows =
      (data.market || [])
        .slice()
        .sort(
          (a, b) =>
            C().clean(a.code)
              .localeCompare(
                C().clean(b.code),
                'ko'
              )
        );

    return `
      <div class="tableWrap">

        <table class="mid v33-life-master-table">

          <thead>
            <tr>
              <th>Code</th>
              <th>종목명</th>
              <th>Category</th>
              <th>Mapping</th>
            </tr>
          </thead>

          <tbody>

            ${
              rows.map(
                m => `
                  <tr
                    data-v33-old-code="${C().esc(m.code)}"
                  >

                    <td>
                      <input
                        class="v33-life-master-code"
                        value="${C().esc(m.code)}"
                      >
                    </td>

                    <td>
                      <input
                        class="v33-life-master-name"
                        value="${C().esc(m.name || '')}"
                      >
                    </td>

                    <td>
                      <input
                        class="v33-life-master-category"
                        value="${C().esc(m.category || '')}"
                      >
                    </td>

                    <td>
                      <input
                        class="v33-life-master-mapping"
                        value="${C().esc(mappingText(m.code))}"
                      >
                    </td>

                  </tr>
                `
              ).join('')
            }

          </tbody>

        </table>

      </div>

      <div class="v33-life-actions">
        <button
          type="button"
          class="btn primary v33-life-master-save"
        >
          기준정보 저장
        </button>
      </div>
    `;
  }


  function installMaster() {
    const host =
      document.getElementById(
        'v33-life-master-host'
      );

    if (
      !host ||
      host.dataset.ready
    ) {
      return;
    }

    host.innerHTML =
      masterHtml();

    host.dataset.ready =
      '1';
  }


  function saveMaster() {
    const host =
      document.getElementById(
        'v33-life-master-host'
      );

    if (!host) {
      return;
    }

    const plans = [];

    for (
      const row of
      host.querySelectorAll(
        'tbody tr'
      )
    ) {
      const oldCode =
        C().norm(
          row.dataset
            .v33OldCode
        );

      const newCode =
        C().norm(
          row.querySelector(
            '.v33-life-master-code'
          ).value
        );

      const name =
        C().clean(
          row.querySelector(
            '.v33-life-master-name'
          ).value
        );

      const category =
        C().clean(
          row.querySelector(
            '.v33-life-master-category'
          ).value
        );

      const parsed =
        parseMapping(
          row.querySelector(
            '.v33-life-master-mapping'
          ).value
        );

      if (
        !newCode ||
        !parsed.ok
      ) {
        alert(
          !newCode
            ? 'Code가 비어 있습니다.'
            : parsed.message
        );

        return;
      }

      plans.push({
        oldCode,
        newCode,
        name,
        category,
        mapping:
          parsed.value
      });
    }

    const codes =
      plans.map(
        p => p.newCode
      );

    if (
      new Set(codes).size !==
      codes.length
    ) {
      alert(
        'Code가 중복됩니다.'
      );

      return;
    }

    if (
      !data.mapping ||
      typeof data.mapping !==
        'object'
    ) {
      data.mapping = {};
    }

    plans.forEach(
      p => {
        const m =
          (data.market || [])
            .find(
              item =>
                C().norm(
                  item.code
                ) ===
                p.oldCode
            );

        if (!m) {
          return;
        }

        if (
          p.oldCode !==
          p.newCode
        ) {
          (data.holdings || [])
            .forEach(
              h => {
                if (
                  C().norm(
                    h.code
                  ) ===
                  p.oldCode
                ) {
                  h.code =
                    p.newCode;
                }
              }
            );

          if (
            Object.prototype
              .hasOwnProperty
              .call(
                data.mapping,
                p.oldCode
              )
          ) {
            data.mapping[
              p.newCode
            ] =
              data.mapping[
                p.oldCode
              ];

            delete data.mapping[
              p.oldCode
            ];
          }

          m.code =
            p.newCode;
        }

        m.name =
          p.name ||
          m.name ||
          p.newCode;

        m.category =
          p.category;

        if (
          p.mapping
        ) {
          data.mapping[
            p.newCode
          ] =
            p.mapping;

        } else {
          delete data.mapping[
            p.newCode
          ];
        }
      }
    );

    C().saveRender();
  }


  function onClick(event) {
    const addButton =
      event.target.closest(
        '.v33-life-final-add'
      );

    if (addButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      openModal(
        addButton.dataset
          .v33Account,
        addButton.dataset
          .v33Owner ||
          ''
      );

      return;
    }

    if (
      event.target.closest(
        '.v33-life-modal-close'
      )
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();

      closeModal();
      return;
    }

    if (
      event.target.closest(
        '.v33-life-lookup'
      )
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();

      lookup();
      return;
    }

    if (
      event.target.closest(
        '.v33-life-add-confirm'
      )
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();

      add();
      return;
    }

    if (
      event.target.closest(
        '.v33-life-master-save'
      )
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();

      saveMaster();
    }
  }


  function start() {
    document.addEventListener(
      'click',
      onClick,
      true
    );

    window.addEventListener(
      'v33-life:advanced-ready',
      installMaster
    );

    window.addEventListener(
      'v33-life:apply',
      installMaster
    );

    installMaster();
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


  console.info(
    '[Portfolio Control] lifecycle add/master loaded'
  );

})();
