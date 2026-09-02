// Portfolio Control v3.3
// Account / holding lifecycle + advanced master settings.
// Load AFTER v33-performance-profit.js.

(function () {
  'use strict';

  const ACCOUNT_IDS = ['DC', 'P1', 'P2', 'ISA', 'GENERAL', 'CHILD'];

  const ACCOUNT_ALIASES = {
    DC: ['DC'],
    P1: ['연금(1)', '개인연금1', 'P1'],
    P2: ['연금(2)', '개인연금2', 'P2'],
    ISA: ['ISA'],
    GENERAL: ['일반계좌', 'GENERAL'],
    CHILD: ['자녀연금', '자녀연금계좌', 'CHILD']
  };

  const MAPPING_KEYS = [
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

  let queued = false;
  let closeListenerInstalled = false;


  function text(v) {
    return String(
      v == null
        ? ''
        : v
    ).trim();
  }


  function normalize(v) {
    return text(v)
      .replace(/\s+/g, '')
      .toUpperCase();
  }


  function esc(v) {
    return text(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }


  function nowIso() {
    return new Date().toISOString();
  }


  function activeHolding(h) {
    return normalize(
      h && h.status
    ) === 'ACTIVE';
  }


  function accountById(id) {
    return (
      (data.accounts || [])
        .find(
          a => a.id === id
        ) ||
      null
    );
  }


  function accountLabel(id) {
    const a =
      accountById(id);

    if (
      a &&
      a.name
    ) {
      return text(a.name);
    }

    const first =
      (
        ACCOUNT_ALIASES[id] ||
        [id]
      )[0];

    return first || id;
  }


  function investmentAccounts() {
    return ACCOUNT_IDS
      .filter(
        id =>
          (data.accounts || [])
            .some(
              a =>
                a.id === id
            ) ||
          (data.holdings || [])
            .some(
              h =>
                h.account === id
            )
      )
      .map(
        id => ({
          id,
          label:
            accountLabel(id)
        })
      );
  }


  function childOwners() {
    const fromProfiles =
      (data.childProfiles || [])
        .map(
          x =>
            text(x.owner)
        )
        .filter(Boolean);

    const fromHoldings =
      (data.holdings || [])
        .filter(
          h =>
            h.account ===
            'CHILD'
        )
        .map(
          h =>
            text(h.owner)
        )
        .filter(Boolean);

    return Array.from(
      new Set([
        ...fromProfiles,
        ...fromHoldings
      ])
    );
  }


  function liveRows() {
    try {
      if (
        typeof window
          .marketLiveRowsV33 ===
        'function'
      ) {
        return (
          window
            .marketLiveRowsV33() ||
          []
        );
      }
    } catch (e) {}

    return [];
  }


  function liveForCode(code) {
    const c =
      normalize(code);

    return (
      liveRows()
        .find(
          row =>
            normalize(
              row.code
            ) === c ||
            normalize(
              row.symbol
            ) === c
        ) ||
      null
    );
  }


  function masterForCode(code) {
    const c =
      normalize(code);

    return (
      (data.market || [])
        .find(
          m =>
            normalize(
              m.code
            ) === c
        ) ||
      null
    );
  }


  function marketName(code) {
    const master =
      masterForCode(code);

    if (
      master &&
      master.name
    ) {
      return text(
        master.name
      );
    }

    const live =
      liveForCode(code);

    if (
      live &&
      live.name
    ) {
      return text(
        live.name
      );
    }

    return text(code);
  }


  function wonValue(v) {
    const n =
      Number(v);

    if (
      !Number.isFinite(n)
    ) {
      return 'n/a';
    }

    try {
      if (
        typeof won ===
        'function'
      ) {
        return won(n);
      }
    } catch (e) {}

    return (
      `${Math.round(n)
        .toLocaleString(
          'ko-KR'
        )}원`
    );
  }


  function isInvestableCode(
    code
  ) {
    return /^[0-9A-Z]{6}$/
      .test(
        normalize(code)
      );
  }


  function mappingText(code) {
    const map =
      data.mapping &&
      typeof data.mapping ===
        'object'
        ? data.mapping[code]
        : null;

    if (
      !map ||
      typeof map !==
        'object'
    ) {
      return '';
    }

    return Object.entries(map)
      .filter(
        ([, value]) =>
          Number(value) !== 0
      )
      .map(
        ([key, value]) =>
          `${key}:${Number(value)}`
      )
      .join(', ');
  }


  function parseMapping(raw) {
    const value =
      text(raw);

    if (!value) {
      return {
        ok: true,
        value: null
      };
    }

    const out = {};

    const parts =
      value
        .split(',')
        .map(
          x => x.trim()
        )
        .filter(Boolean);

    for (
      const part of parts
    ) {
      const idx =
        part.indexOf(':');

      if (idx < 1) {
        return {
          ok: false,
          message:
            `Mapping 형식 오류: "${part}"\n` +
            `예: NASDAQ:1 또는 K-DVD:0.5, BOND:0.5`
        };
      }

      const key =
        text(
          part.slice(
            0,
            idx
          )
        ).toUpperCase();

      let amountText =
        text(
          part.slice(
            idx + 1
          )
        );

      let amount;

      if (
        !MAPPING_KEYS
          .includes(key)
      ) {
        return {
          ok: false,
          message:
            `지원하지 않는 Mapping "${key}"입니다.\n` +
            `사용 가능: ${MAPPING_KEYS.join(', ')}`
        };
      }

      if (
        amountText
          .endsWith('%')
      ) {
        amount =
          Number(
            amountText.slice(
              0,
              -1
            )
          ) /
          100;

      } else {
        amount =
          Number(
            amountText
          );

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
            `Mapping 비율 오류: "${part}"`
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
          (
            sum,
            n
          ) =>
            sum +
            Number(
              n || 0
            ),
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
          `Mapping 합계가 ${(total * 100).toFixed(2)}%입니다.\n` +
          `합계가 100%가 되도록 입력하세요.`
      };
    }

    return {
      ok: true,
      value: out
    };
  }


  function autoInfo(code) {
    const live =
      liveForCode(code);

    if (!live) {
      return {
        live: false,
        label:
          '자동가격 DB 없음'
      };
    }

    const bits = [];

    if (
      live.priceDate
    ) {
      bits.push(
        live.priceDate
      );
    }

    if (
      live.source
    ) {
      bits.push(
        live.source
      );
    }

    if (
      live.current != null
    ) {
      bits.push(
        wonValue(
          live.current
        )
      );
    }

    return {
      live: true,
      label:
        bits.length
          ? bits.join(' · ')
          : '자동가격 DB 등록'
    };
  }


  function persistAndRender() {
    try {
      if (
        typeof save ===
        'function'
      ) {
        save();
      }
    } catch (e) {
      console.error(
        '[v3.3 lifecycle] save failed',
        e
      );

      alert(
        `저장 중 오류가 발생했습니다.\n${
          e &&
          e.message
            ? e.message
            : e
        }`
      );

      return;
    }

    setTimeout(
      () => {
        try {
          if (
            typeof render ===
            'function'
          ) {
            render();
          }
        } catch (e) {}
      },
      0
    );
  }


  function selectedTabText() {
    const tabs =
      document
        .getElementById(
          'tabs'
        );

    if (!tabs) {
      return '';
    }

    const active =
      tabs.querySelector(
        '.active,' +
        '[aria-selected="true"],' +
        '[data-active="true"]'
      );

    return active
      ? text(
          active.textContent
        )
      : '';
  }


  function isAccountView() {
    const selected =
      normalize(
        selectedTabText()
      );

    if (selected) {
      return (
        selected.includes(
          '계좌'
        ) &&
        selected.includes(
          '보유'
        )
      );
    }

    const content =
      document
        .getElementById(
          'content'
        );

    const t =
      normalize(
        content
          ? content.textContent
          : ''
      );

    return (
      t.includes(
        '보유정보저장'
      ) ||
      (
        t.includes(
          '계좌'
        ) &&
        t.includes(
          '보유수량'
        ) &&
        t.includes(
          '평단'
        )
      )
    );
  }


  function masterRowsHtml() {
    const rows =
      (data.market || [])
        .slice()
        .sort(
          (
            a,
            b
          ) =>
            text(a.code)
              .localeCompare(
                text(b.code),
                'ko'
              )
        );

    if (!rows.length) {
      return (
        '<div class="v33-life-empty">' +
        '등록된 종목 기준정보가 없습니다.' +
        '</div>'
      );
    }

    return `
      <div class="tableWrap v33-life-master-wrap">
        <table class="mid v33-life-master-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>종목명</th>
              <th>Category</th>
              <th>Mapping</th>
              <th>자동가격</th>
            </tr>
          </thead>
          <tbody>
            ${
              rows
                .map(
                  master => {
                    const code =
                      text(
                        master.code
                      );

                    const auto =
                      autoInfo(code);

                    return `
                      <tr
                        data-v33-master-row
                        data-old-code="${esc(code)}"
                      >
                        <td>
                          <input
                            class="v33-life-code"
                            data-v33-master-code
                            value="${esc(code)}"
                            autocomplete="off"
                          >
                        </td>

                        <td>
                          <input
                            data-v33-master-name
                            value="${esc(master.name || '')}"
                            autocomplete="off"
                          >
                        </td>

                        <td>
                          <input
                            data-v33-master-category
                            value="${esc(master.category || '')}"
                            autocomplete="off"
                          >
                        </td>

                        <td>
                          <input
                            data-v33-master-mapping
                            value="${esc(mappingText(code))}"
                            placeholder="NASDAQ:1"
                            autocomplete="off"
                          >
                        </td>

                        <td
                          class="
                            v33-life-auto
                            ${
                              auto.live
                                ? 'is-live'
                                : 'is-missing'
                            }
                          "
                        >
                          ${esc(auto.label)}
                        </td>
                      </tr>
                    `;
                  }
                )
                .join('')
            }
          </tbody>
        </table>
      </div>

      <div class="v33-life-help">
        Mapping 예:
        <b>NASDAQ:1</b> /
        <b>K-DVD:0.5, BOND:0.5</b>.
        현재가·전일가·52주·연초가 등 자동가격 필드는
        여기서 수정하지 않습니다.
      </div>

      <div class="v33-life-actions">
        <button
          class="btn primary"
          type="button"
          data-v33-master-save
        >
          기준정보 저장
        </button>
      </div>
    `;
  }


  function closedRowsHtml() {
    const closed =
      (data.holdings || [])
        .filter(
          h =>
            !activeHolding(h)
        );

    if (
      !closed.length
    ) {
      return (
        '<div class="v33-life-empty">' +
        '종료된 보유 기록이 없습니다.' +
        '</div>'
      );
    }

    return `
      <div class="tableWrap v33-life-closed-wrap">
        <table class="mid">
          <thead>
            <tr>
              <th>계좌</th>
              <th>종목</th>
              <th>Owner</th>
              <th>종료시 수량</th>
              <th>종료일</th>
              <th>재매수</th>
            </tr>
          </thead>

          <tbody>
            ${
              closed
                .map(
                  h => {
                    const id =
                      text(h.id);

                    const owner =
                      text(h.owner);

                    return `
                      <tr>
                        <td>
                          ${esc(accountLabel(h.account))}
                        </td>

                        <td>
                          ${esc(marketName(h.code))}
                          <div class="small">
                            ${esc(h.code)}
                          </div>
                        </td>

                        <td>
                          ${esc(owner || '-')}
                        </td>

                        <td>
                          ${Number(h.qty || 0)
                            .toLocaleString('ko-KR')}
                        </td>

                        <td>
                          ${
                            esc(
                              text(
                                h.closedAt
                              ).slice(
                                0,
                                10
                              ) ||
                              '-'
                            )
                          }
                        </td>

                        <td>
                          <button
                            class="btn v33-life-reopen"
                            type="button"
                            data-v33-reopen="${esc(id)}"
                          >
                            재활성화
                          </button>
                        </td>
                      </tr>
                    `;
                  }
                )
                .join('')
            }
          </tbody>
        </table>
      </div>
    `;
  }


  function buildRoot() {
    const root =
      document
        .createElement(
          'section'
        );

    root.id =
      'v33-lifecycle-root';

    root.className =
      'v33-lifecycle-root';

    root.innerHTML = `
      <div class="v33-life-head">

        <div>
          <div class="v33-life-title">
            보유 Lifecycle
          </div>

          <div class="small">
            신규 종목 등록 · 보유 종료 · 재매수 · 기준정보 관리
          </div>
        </div>

        <button
          class="btn primary"
          type="button"
          data-v33-add-open
        >
          + 종목
        </button>

      </div>

      <details class="v33-life-advanced">

        <summary>
          고급 설정
        </summary>

        <div class="v33-life-advanced-body">

          <div class="v33-life-subtitle">
            종목 기준정보
          </div>

          <div class="notice">
            사용자 관리 대상은
            Code / 종목명 / Category / Mapping입니다.
            자동가격 데이터는 market_prices가 원본이며
            이 화면에서는 수정하지 않습니다.
          </div>

          ${masterRowsHtml()}

          <div
            class="
              v33-life-subtitle
              v33-life-closed-title
            "
          >
            종료된 보유 기록
          </div>

          ${closedRowsHtml()}

        </div>

      </details>
    `;

    root.addEventListener(
      'click',
      onRootClick
    );

    return root;
  }


  function installRoot() {
    if (
      !isAccountView()
    ) {
      return;
    }

    const content =
      document
        .getElementById(
          'content'
        );

    if (!content) {
      return;
    }

    if (
      document
        .getElementById(
          'v33-lifecycle-root'
        )
    ) {
      relabelCloseButtons();
      return;
    }

    content.prepend(
      buildRoot()
    );

    relabelCloseButtons();
  }


  function ensureModal() {
    let back =
      document
        .getElementById(
          'v33-add-holding-back'
        );

    if (back) {
      return back;
    }

    back =
      document
        .createElement(
          'div'
        );

    back.id =
      'v33-add-holding-back';

    back.className =
      'v33-life-modal-back';

    back.hidden =
      true;

    const accounts =
      investmentAccounts();

    const owners =
      childOwners();

    back.innerHTML = `
      <div
        class="v33-life-modal"
        role="dialog"
        aria-modal="true"
      >

        <div class="v33-life-modal-head">

          <div>
            <div class="v33-life-modal-title">
              + 종목
            </div>

            <div class="small">
              계좌에 새 보유 종목을 등록합니다.
            </div>
          </div>

          <button
            class="btn"
            type="button"
            data-v33-add-close
          >
            닫기
          </button>

        </div>

        <div class="v33-life-form">

          <label>
            계좌

            <select data-v33-add-account>
              ${
                accounts
                  .map(
                    a =>
                      `<option value="${esc(a.id)}">` +
                      `${esc(a.label)}` +
                      `</option>`
                  )
                  .join('')
              }
            </select>
          </label>

          <label
            class="v33-life-owner-field"
            data-v33-owner-field
            hidden
          >
            Owner

            <select data-v33-add-owner>
              ${
                owners
                  .map(
                    owner =>
                      `<option value="${esc(owner)}">` +
                      `${esc(owner)}` +
                      `</option>`
                  )
                  .join('')
              }
            </select>
          </label>

          <label>
            Code

            <div class="v33-life-code-search">

              <input
                data-v33-add-code
                inputmode="text"
                maxlength="12"
                placeholder="예: 133690"
                autocomplete="off"
              >

              <button
                class="btn"
                type="button"
                data-v33-code-lookup
              >
                조회
              </button>

            </div>
          </label>

          <div
            class="v33-life-lookup"
            data-v33-lookup-result
          >
            Code를 입력하고 조회하세요.
          </div>

          <label>
            종목명

            <input
              data-v33-add-name
              autocomplete="off"
            >
          </label>

          <label>
            Category

            <input
              data-v33-add-category
              placeholder="예: ETF"
              autocomplete="off"
            >
          </label>

          <label>
            Mapping

            <input
              data-v33-add-mapping
              placeholder="예: NASDAQ:1"
              autocomplete="off"
            >
          </label>

          <div class="v33-life-help">
            Mapping은 연금/Allocation 분류에 사용됩니다.
            분할 종목은 예:
            K-DVD:0.5, BOND:0.5
          </div>

        </div>

        <div class="v33-life-modal-actions">

          <button
            class="btn primary"
            type="button"
            data-v33-add-confirm
          >
            보유 등록
          </button>

        </div>

      </div>
    `;

    document.body
      .appendChild(back);

    back.addEventListener(
      'click',
      event => {

        if (
          event.target ===
            back ||
          event.target
            .closest(
              '[data-v33-add-close]'
            )
        ) {
          closeAddModal();
          return;
        }

        if (
          event.target
            .closest(
              '[data-v33-code-lookup]'
            )
        ) {
          lookupAddCode();
          return;
        }

        if (
          event.target
            .closest(
              '[data-v33-add-confirm]'
            )
        ) {
          addHoldingFromModal();
        }
      }
    );

    back
      .querySelector(
        '[data-v33-add-account]'
      )
      ?.addEventListener(
        'change',
        updateOwnerField
      );

    return back;
  }


  function openAddModal() {
    const back =
      ensureModal();

    back.hidden =
      false;

    const code =
      back.querySelector(
        '[data-v33-add-code]'
      );

    const name =
      back.querySelector(
        '[data-v33-add-name]'
      );

    const category =
      back.querySelector(
        '[data-v33-add-category]'
      );

    const mapping =
      back.querySelector(
        '[data-v33-add-mapping]'
      );

    const lookup =
      back.querySelector(
        '[data-v33-lookup-result]'
      );

    if (code) {
      code.value = '';
    }

    if (name) {
      name.value = '';
    }

    if (category) {
      category.value = '';
    }

    if (mapping) {
      mapping.value = '';
    }

    if (lookup) {
      lookup.textContent =
        'Code를 입력하고 조회하세요.';

      lookup.className =
        'v33-life-lookup';
    }

    updateOwnerField();

    setTimeout(
      () => {
        if (code) {
          code.focus();
        }
      },
      0
    );
  }


  function closeAddModal() {
    const back =
      document
        .getElementById(
          'v33-add-holding-back'
        );

    if (back) {
      back.hidden =
        true;
    }
  }


  function updateOwnerField() {
    const back =
      document
        .getElementById(
          'v33-add-holding-back'
        );

    if (!back) {
      return;
    }

    const account =
      back
        .querySelector(
          '[data-v33-add-account]'
        )
        ?.value ||
      '';

    const field =
      back.querySelector(
        '[data-v33-owner-field]'
      );

    if (field) {
      field.hidden =
        account !==
        'CHILD';
    }
  }


  function lookupAddCode() {
    const back =
      document
        .getElementById(
          'v33-add-holding-back'
        );

    if (!back) {
      return;
    }

    const codeInput =
      back.querySelector(
        '[data-v33-add-code]'
      );

    const nameInput =
      back.querySelector(
        '[data-v33-add-name]'
      );

    const categoryInput =
      back.querySelector(
        '[data-v33-add-category]'
      );

    const mappingInput =
      back.querySelector(
        '[data-v33-add-mapping]'
      );

    const result =
      back.querySelector(
        '[data-v33-lookup-result]'
      );

    const code =
      normalize(
        codeInput
          ? codeInput.value
          : ''
      );

    if (codeInput) {
      codeInput.value =
        code;
    }

    if (
      !isInvestableCode(
        code
      )
    ) {
      if (result) {
        result.textContent =
          '보유 종목 Code는 현재 6자리 영문/숫자 형식만 지원합니다.';

        result.className =
          'v33-life-lookup is-error';
      }

      return;
    }

    const master =
      masterForCode(
        code
      );

    const live =
      liveForCode(
        code
      );

    if (
      !master &&
      !live
    ) {
      if (result) {
        result.textContent =
          '기존 master와 자동가격 DB 모두에서 찾지 못했습니다. ' +
          '먼저 자동가격 수집 대상에 등록해야 합니다.';

        result.className =
          'v33-life-lookup is-error';
      }

      return;
    }

    const sourceName =
      (
        master &&
        master.name
      ) ||
      (
        live &&
        live.name
      ) ||
      code;

    if (nameInput) {
      nameInput.value =
        sourceName ||
        '';
    }

    if (categoryInput) {
      categoryInput.value =
        (
          master &&
          master.category
        ) ||
        (
          live &&
          live.category
        ) ||
        '';
    }

    if (mappingInput) {
      mappingInput.value =
        mappingText(code);
    }

    if (result) {
      if (live) {
        const info =
          autoInfo(code);

        result.textContent =
          `자동가격 DB 확인 · ${info.label}` +
          (
            master
              ? ' · 기존 master'
              : ' · 신규 master 생성 가능'
          );

        result.className =
          'v33-life-lookup is-ok';

      } else {
        result.textContent =
          '기존 master 확인 · 자동가격 DB에는 없습니다. ' +
          '현재 수동 fallback 종목으로만 사용할 수 있습니다.';

        result.className =
          'v33-life-lookup is-warn';
      }
    }
  }


  function createMasterFromLive(
    code,
    name,
    category,
    live
  ) {
    if (
      !Array.isArray(
        data.market
      )
    ) {
      data.market = [];
    }

    const master = {
      code,

      name:
        name ||
        (
          live &&
          live.name
        ) ||
        code,

      category:
        category ||
        (
          live &&
          live.category
        ) ||
        '',

      current: 0
    };

    data.market
      .push(master);

    return master;
  }


  function addHoldingFromModal() {
    const back =
      document
        .getElementById(
          'v33-add-holding-back'
        );

    if (!back) {
      return;
    }

    const account =
      text(
        back
          .querySelector(
            '[data-v33-add-account]'
          )
          ?.value
      );

    const owner =
      account ===
      'CHILD'
        ? text(
            back
              .querySelector(
                '[data-v33-add-owner]'
              )
              ?.value
          )
        : '';

    const code =
      normalize(
        back
          .querySelector(
            '[data-v33-add-code]'
          )
          ?.value
      );

    const name =
      text(
        back
          .querySelector(
            '[data-v33-add-name]'
          )
          ?.value
      );

    const category =
      text(
        back
          .querySelector(
            '[data-v33-add-category]'
          )
          ?.value
      );

    const mappingRaw =
      text(
        back
          .querySelector(
            '[data-v33-add-mapping]'
          )
          ?.value
      );

    if (
      !ACCOUNT_IDS
        .includes(
          account
        )
    ) {
      alert(
        '계좌를 선택하세요.'
      );

      return;
    }

    if (
      account ===
        'CHILD' &&
      !owner
    ) {
      alert(
        '자녀연금 Owner를 선택하세요.'
      );

      return;
    }

    if (
      !isInvestableCode(
        code
      )
    ) {
      alert(
        '보유 종목 Code는 6자리 영문/숫자 형식으로 입력하세요.'
      );

      return;
    }

    let master =
      masterForCode(
        code
      );

    const live =
      liveForCode(
        code
      );

    if (
      !master &&
      !live
    ) {
      alert(
        `${code}는 기존 master와 자동가격 DB 모두에서 찾지 못했습니다.\n\n` +
        'UI에만 종목을 추가하면 다음 자동업데이트부터 가격이 멈출 수 있으므로 등록하지 않았습니다.'
      );

      return;
    }

    const parsed =
      parseMapping(
        mappingRaw
      );

    if (
      !parsed.ok
    ) {
      alert(
        parsed.message
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

    if (
      !data.mapping ||
      typeof data.mapping !==
        'object'
    ) {
      data.mapping = {};
    }

    const existingMapping =
      data.mapping[code];

    if (
      [
        'DC',
        'P1',
        'P2'
      ].includes(
        account
      ) &&
      !parsed.value &&
      (
        !existingMapping ||
        typeof existingMapping !==
          'object'
      )
    ) {
      alert(
        '연금계좌에 신규 종목을 등록하려면 Mapping이 필요합니다.\n' +
        '예: NASDAQ:1 또는 K-DVD:0.5, BOND:0.5'
      );

      return;
    }

    const same =
      data.holdings
        .filter(
          h =>
            h.account ===
              account &&
            normalize(
              h.code
            ) === code &&
            (
              account !==
                'CHILD' ||
              text(
                h.owner
              ) === owner
            )
        );

    const alreadyActive =
      same.find(
        activeHolding
      );

    if (
      alreadyActive
    ) {
      alert(
        `${accountLabel(account)}에 ` +
        `${marketName(code)} (${code})가 이미 Active 상태입니다.`
      );

      return;
    }

    const closed =
      same.find(
        h =>
          !activeHolding(h)
      );

    if (closed) {
      const staleQty =
        Number(
          closed.qty
        ) ||
        0;

      const message =
        `${marketName(code)}의 종료 기록을 재활성화합니다.\n` +
        `기존 실현손익/누적배당 기록은 유지합니다.` +
        (
          staleQty > 0
            ? `\n\n기존 종료 수량 ${staleQty.toLocaleString('ko-KR')}개가 남아 있습니다.` +
              '\n재활성화 후 계좌 표에서 수량/평단을 현재 값으로 수정하세요.'
            : ''
        );

      if (
        !confirm(
          message
        )
      ) {
        return;
      }
    }

    if (!master) {
      master =
        createMasterFromLive(
          code,
          name,
          category,
          live
        );

    } else {
      if (name) {
        master.name =
          name;
      }

      if (category) {
        master.category =
          category;
      }
    }

    if (
      parsed.value
    ) {
      data.mapping[code] =
        parsed.value;
    }

    if (closed) {
      closed.status =
        'Active';

      closed.reopenedAt =
        nowIso();

      closeAddModal();

      persistAndRender();

      return;
    }

    data.holdings.push({
      id:
        `h-${account.toLowerCase()}-` +
        `${code.toLowerCase()}-` +
        Date.now()
          .toString(36),

      account,

      ...(
        owner
          ? {
              owner
            }
          : {}
      ),

      code,
      qty: 0,
      target: 0,
      avg: 0,
      realized: 0,
      cumDividend: 0,
      status: 'Active',
      createdAt: nowIso()
    });

    closeAddModal();

    persistAndRender();
  }


  function saveMasterSettings(
    root
  ) {
    const rows =
      Array.from(
        root
          .querySelectorAll(
            '[data-v33-master-row]'
          )
      );

    const plans = [];

    for (
      const row of rows
    ) {
      const oldCode =
        normalize(
          row.dataset
            .oldCode
        );

      const newCode =
        normalize(
          row
            .querySelector(
              '[data-v33-master-code]'
            )
            ?.value
        );

      const name =
        text(
          row
            .querySelector(
              '[data-v33-master-name]'
            )
            ?.value
        );

      const category =
        text(
          row
            .querySelector(
              '[data-v33-master-category]'
            )
            ?.value
        );

      const mappingRaw =
        text(
          row
            .querySelector(
              '[data-v33-master-mapping]'
            )
            ?.value
        );

      if (
        !newCode ||
        /\s/.test(
          newCode
        )
      ) {
        alert(
          `Code "${newCode}" 형식이 올바르지 않습니다.`
        );

        return;
      }

      const parsed =
        parseMapping(
          mappingRaw
        );

      if (
        !parsed.ok
      ) {
        alert(
          `${oldCode}\n${parsed.message}`
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

    const newCodes =
      plans.map(
        x =>
          x.newCode
      );

    if (
      new Set(
        newCodes
      ).size !==
      newCodes.length
    ) {
      alert(
        'Code가 중복됩니다. 기준정보는 Code별 1개만 등록할 수 있습니다.'
      );

      return;
    }

    const existingCodes =
      new Set(
        (data.market || [])
          .map(
            m =>
              normalize(
                m.code
              )
          )
      );

    for (
      const plan of plans
    ) {
      if (
        plan.oldCode !==
          plan.newCode &&
        existingCodes.has(
          plan.newCode
        )
      ) {
        alert(
          `${plan.oldCode} → ${plan.newCode}\n` +
          '변경하려는 Code가 이미 다른 기준정보에 존재합니다.'
        );

        return;
      }
    }

    const changedWithoutLive =
      plans.filter(
        plan =>
          plan.oldCode !==
            plan.newCode &&
          !liveForCode(
            plan.newCode
          )
      );

    if (
      changedWithoutLive.length
    ) {
      const list =
        changedWithoutLive
          .map(
            x =>
              `${x.oldCode} → ${x.newCode}`
          )
          .join('\n');

      if (
        !confirm(
          `아래 변경 Code는 현재 자동가격 DB에서 찾지 못했습니다.\n\n` +
          `${list}\n\n` +
          'Code 변경은 holdings와 mapping에도 함께 반영됩니다. 계속할까요?'
        )
      ) {
        return;
      }
    }

    if (
      !data.mapping ||
      typeof data.mapping !==
        'object'
    ) {
      data.mapping = {};
    }

    for (
      const plan of plans
    ) {
      const master =
        (data.market || [])
          .find(
            m =>
              normalize(
                m.code
              ) ===
              plan.oldCode
          );

      if (!master) {
        continue;
      }

      if (
        plan.oldCode !==
        plan.newCode
      ) {
        (data.holdings || [])
          .forEach(
            h => {
              if (
                normalize(
                  h.code
                ) ===
                plan.oldCode
              ) {
                h.code =
                  plan.newCode;
              }
            }
          );

        if (
          Object.prototype
            .hasOwnProperty
            .call(
              data.mapping,
              plan.oldCode
            )
        ) {
          data.mapping[
            plan.newCode
          ] =
            data.mapping[
              plan.oldCode
            ];

          delete data.mapping[
            plan.oldCode
          ];
        }

        master.code =
          plan.newCode;
      }

      master.name =
        plan.name ||
        master.name ||
        plan.newCode;

      master.category =
        plan.category;

      if (
        plan.mapping
      ) {
        data.mapping[
          plan.newCode
        ] =
          plan.mapping;

      } else {
        delete data.mapping[
          plan.newCode
        ];
      }
    }

    persistAndRender();
  }


  function reopenHolding(id) {
    const h =
      (data.holdings || [])
        .find(
          item =>
            text(
              item.id
            ) ===
            text(id)
        );

    if (!h) {
      alert(
        '종료 보유 기록을 찾지 못했습니다.'
      );

      return;
    }

    const activeDuplicate =
      (data.holdings || [])
        .find(
          item =>
            item !== h &&
            activeHolding(
              item
            ) &&
            item.account ===
              h.account &&
            normalize(
              item.code
            ) ===
              normalize(
                h.code
              ) &&
            (
              h.account !==
                'CHILD' ||
              text(
                item.owner
              ) ===
                text(
                  h.owner
                )
            )
        );

    if (
      activeDuplicate
    ) {
      alert(
        '같은 계좌에 동일 종목이 이미 Active 상태입니다.'
      );

      return;
    }

    const qty =
      Number(
        h.qty
      ) ||
      0;

    const message =
      `${marketName(h.code)} (${h.code})를 다시 Active로 전환합니다.\n` +
      '기존 실현손익/누적배당 기록은 유지합니다.' +
      (
        qty > 0
          ? `\n\n종료 기록에 수량 ${qty.toLocaleString('ko-KR')}개가 남아 있습니다.` +
            '\n재활성화 후 현재 수량/평단으로 수정하세요.'
          : ''
      );

    if (
      !confirm(
        message
      )
    ) {
      return;
    }

    h.status =
      'Active';

    h.reopenedAt =
      nowIso();

    persistAndRender();
  }


  function onRootClick(
    event
  ) {
    const add =
      event.target
        .closest(
          '[data-v33-add-open]'
        );

    if (add) {
      openAddModal();
      return;
    }

    const saveBtn =
      event.target
        .closest(
          '[data-v33-master-save]'
        );

    if (saveBtn) {
      const root =
        document
          .getElementById(
            'v33-lifecycle-root'
          );

      if (root) {
        saveMasterSettings(
          root
        );
      }

      return;
    }

    const reopen =
      event.target
        .closest(
          '[data-v33-reopen]'
        );

    if (reopen) {
      reopenHolding(
        reopen.dataset
          .v33Reopen
      );
    }
  }


  function candidatesFromRow(
    row
  ) {
    if (!row) {
      return [];
    }

    const rowText =
      normalize(
        row.textContent
      );

    const active =
      (data.holdings || [])
        .filter(
          activeHolding
        );

    let candidates =
      active.filter(
        h =>
          rowText
            .includes(
              normalize(
                h.code
              )
            )
      );

    if (
      !candidates.length
    ) {
      const masters =
        (data.market || [])
          .filter(
            m =>
              m.name &&
              rowText
                .includes(
                  normalize(
                    m.name
                  )
                )
          );

      const codes =
        new Set(
          masters.map(
            m =>
              normalize(
                m.code
              )
          )
        );

      candidates =
        active.filter(
          h =>
            codes.has(
              normalize(
                h.code
              )
            )
        );
    }

    return candidates;
  }


  function narrowByContext(
    candidates,
    row
  ) {
    if (
      candidates.length <= 1
    ) {
      return candidates;
    }

    const content =
      document
        .getElementById(
          'content'
        );

    for (
      let el =
        row &&
        row.parentElement;

      el &&
      el !== content;

      el =
        el.parentElement
    ) {
      const t =
        normalize(
          el.textContent
        );

      const matched =
        candidates
          .filter(
            h => {
              const aliases =
                ACCOUNT_ALIASES[
                  h.account
                ] ||
                [
                  h.account
                ];

              const accountMatch =
                aliases.some(
                  alias =>
                    t.includes(
                      normalize(
                        alias
                      )
                    )
                );

              if (
                !accountMatch
              ) {
                return false;
              }

              if (
                h.account ===
                  'CHILD' &&
                h.owner
              ) {
                return t.includes(
                  normalize(
                    h.owner
                  )
                );
              }

              return true;
            }
          );

      if (
        matched.length === 1
      ) {
        return matched;
      }
    }

    return candidates;
  }


  function resolveHoldingFromCloseButton(
    button
  ) {
    const row =
      button.closest(
        'tr'
      );

    if (!row) {
      return null;
    }

    let candidates =
      candidatesFromRow(
        row
      );

    candidates =
      narrowByContext(
        candidates,
        row
      );

    return (
      candidates.length === 1
        ? candidates[0]
        : null
    );
  }


  function relabelCloseButtons() {
    if (
      !isAccountView()
    ) {
      return;
    }

    const content =
      document
        .getElementById(
          'content'
        );

    if (!content) {
      return;
    }

    content
      .querySelectorAll(
        'button'
      )
      .forEach(
        button => {
          const label =
            normalize(
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

            button.classList
              .add(
                'v33-life-close-btn'
              );
          }
        }
      );
  }


  function installCloseListener() {
    if (
      closeListenerInstalled
    ) {
      return;
    }

    const content =
      document
        .getElementById(
          'content'
        );

    if (!content) {
      return;
    }

    closeListenerInstalled =
      true;

    content.addEventListener(
      'click',
      event => {
        const button =
          event.target
            .closest(
              '.v33-life-close-btn'
            );

        if (!button) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const h =
          resolveHoldingFromCloseButton(
            button
          );

        if (!h) {
          alert(
            '종료할 보유 종목을 안전하게 식별하지 못했습니다.\n' +
            '데이터 보호를 위해 종료하지 않았습니다.'
          );

          return;
        }

        const qty =
          Number(
            h.qty
          ) ||
          0;

        const name =
          marketName(
            h.code
          );

        const message =
          qty > 0
            ? `${name} (${h.code})의 보유수량이 ` +
              `${qty.toLocaleString('ko-KR')}개입니다.\n\n` +
              '보유 종료하면 이 계좌의 Active 보유에서 제외됩니다.\n' +
              '종목 기준정보와 과거 기록은 삭제하지 않습니다.\n\n' +
              '그래도 보유 종료할까요?'

            : `${name} (${h.code})를 보유 종료할까요?\n\n` +
              '종목 기준정보와 과거 기록은 삭제하지 않습니다.';

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
          nowIso();

        persistAndRender();
      },
      true
    );
  }


  function apply() {
    installCloseListener();

    if (
      isAccountView()
    ) {
      installRoot();
      relabelCloseButtons();
    }
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
          ) ||
        document.body;

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

      apply();
    }
  );


  [
    'portfolio:saved',
    'portfolio:market-loaded',
    'portfolio:market-refreshed'
  ]
    .forEach(
      name =>
        window.addEventListener(
          name,
          queue
        )
    );


  window.v33Lifecycle = {
    openAddModal,
    lookupAddCode,
    reopenHolding,
    apply
  };


  console.info(
    '[Portfolio Control] ' +
    'v3.3 holding lifecycle loaded'
  );

})();
