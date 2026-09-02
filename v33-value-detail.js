// Portfolio Control v3.3 - precise value detail layer
// Exact account values + account table Total + Performance value/P&L
// Load LAST after v33-ops.js.

(function () {
  'use strict';

  const ACCOUNT_DEFS = [
    { id: 'DC', labels: ['DC'] },
    { id: 'P1', labels: ['개인연금1', '개인연금(1)', '연금(1)'] },
    { id: 'P2', labels: ['개인연금2', '개인연금(2)', '연금(2)'] },
    { id: 'ISA', labels: ['ISA'] },
    { id: 'GENERAL', labels: ['일반계좌'] },
    { id: 'CHILD', labels: ['자녀연금', '서현서진연금'] },
    { id: 'SAMSUNG_PREF', labels: ['삼성전자우', '삼전우'] }
  ];

  let queued = false;
  let applying = false;


  function injectStyle() {
    if (
      document.getElementById(
        'v33-value-detail-style'
      )
    ) {
      return;
    }

    const s =
      document.createElement(
        'style'
      );

    s.id =
      'v33-value-detail-style';

    s.textContent = `
      .v33-account-total-row td,
      .v33-account-total-row th {
        font-weight: 800 !important;

        border-top:
          2px solid
          var(
            --v33-border,
            rgba(100,116,139,.25)
          ) !important;

        background:
          rgba(37,99,235,.045)
          !important;
      }

      .v33-account-total-row
      td:first-child,

      .v33-account-total-row
      th:first-child {
        color:
          var(
            --v33-blue,
            #2563eb
          ) !important;
      }

      .v33-detail-money {
        font-variant-numeric:
          tabular-nums;
      }

      .v33-performance-table
      .v33-perf-money-head,

      .v33-performance-table
      .v33-perf-money-cell {
        white-space: nowrap;

        font-variant-numeric:
          tabular-nums;
      }

      .v33-performance-table
      .v33-perf-pnl-negative {
        color:
          var(
            --v33-red,
            #dc2626
          ) !important;

        font-weight:
          800 !important;
      }

      .v33-performance-table
      .v33-perf-money-important {
        color:
          var(
            --v33-blue,
            #2563eb
          ) !important;

        font-weight:
          800 !important;
      }
    `;

    document.head.appendChild(s);
  }


  function cleanText(v) {
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


  function tabName() {
    const el =
      document.querySelector(
        '[data-v33-final-tab]' +
        '[aria-selected="true"], ' +

        '[data-v33-final-tab]' +
        '.active, ' +

        '[data-v33-final-tab]' +
        '.selected'
      );

    return cleanText(
      el
        ?.dataset
        ?.v33FinalTab ||

      el
        ?.textContent ||

      ''
    );
  }


  function finite(v) {
    const n =
      Number(v);

    return Number.isFinite(n)
      ? n
      : null;
  }


  function toMan(v) {
    const n =
      finite(v);

    if (n == null) {
      return null;
    }

    //
    // 현재 앱의 accountValue는
    // 기본적으로 이미 만원 단위.
    //
    // 명백히 KRW scale일 때만
    // 만원으로 변환.
    //

    return Math.abs(n) >=
      10000000

      ? n / 10000

      : n;
  }


  function formatMan(v) {
    const n0 =
      finite(v);

    if (n0 == null) {
      return 'n/a';
    }

    const n =
      Math.round(n0);

    const sign =
      n < 0
        ? '-'
        : '';

    const a =
      Math.abs(n);

    const eok =
      Math.floor(
        a / 10000
      );

    const man =
      a % 10000;

    if (!eok) {
      return (
        `${sign}` +
        `${man.toLocaleString(
          'ko-KR'
        )}만원`
      );
    }

    return (
      `${sign}` +
      `${eok.toLocaleString(
        'ko-KR'
      )}억` +

      (
        man
          ? (
              ` ${man.toLocaleString(
                'ko-KR'
              )}만원`
            )
          : ''
      )
    );
  }


  function parseMoneyMan(text) {
    const t =
      cleanText(text)
        .replace(
          /,/g,
          ''
        );

    if (
      !t ||
      /^(n\/a|na|-|—)$/i
        .test(t)
    ) {
      return null;
    }

    const sign =
      t.startsWith('-')
        ? -1
        : 1;

    const unsigned =
      t.replace(
        /^[-+]/,
        ''
      );

    const eokMatch =
      unsigned.match(
        /([0-9.]+)\s*억/
      );

    const manMatch =
      unsigned.match(
        /([0-9.]+)\s*만원/
      );

    if (eokMatch) {
      const eok =
        Number(
          eokMatch[1]
        );

      const man =
        manMatch
          ? Number(
              manMatch[1]
            )
          : 0;

      return (
        sign *
        (
          eok * 10000 +
          man
        )
      );
    }

    if (manMatch) {
      return (
        sign *
        Number(
          manMatch[1]
        )
      );
    }

    const n =
      Number(
        unsigned.replace(
          /[^0-9.]/g,
          ''
        )
      );

    return Number.isFinite(n)
      ? sign * n
      : null;
  }


  function accountValueMan(id) {
    try {
      if (
        typeof accountValue ===
        'function'
      ) {
        const v =
          toMan(
            accountValue(id)
          );

        if (v != null) {
          return v;
        }
      }
    } catch (e) {}


    const s =
      accountSummarySafe(id);

    return pickMetric(
      s,
      [
        'value',
        'currentValue',
        'marketValue',
        'evaluation',
        'eval',
        'totalValue'
      ]
    );
  }


  function accountSummarySafe(id) {
    try {
      if (
        typeof accountSummary ===
        'function'
      ) {
        return (
          accountSummary(id) ||
          null
        );
      }
    } catch (e) {}

    return null;
  }


  function pickMetric(
    obj,
    keys
  ) {
    if (
      !obj ||
      typeof obj !==
        'object'
    ) {
      return null;
    }

    for (
      const key of keys
    ) {
      if (
        !Object
          .prototype
          .hasOwnProperty
          .call(
            obj,
            key
          )
      ) {
        continue;
      }

      const v =
        toMan(
          obj[key]
        );

      if (v != null) {
        return v;
      }
    }

    return null;
  }


  function accountMetrics(id) {
    const s =
      accountSummarySafe(id);

    const value =
      accountValueMan(id);

    let buy =
      pickMetric(
        s,
        [
          'buy',
          'buyAmount',
          'purchaseAmount',
          'cost',
          'costBasis',
          'basis',
          'invested',
          'principal',
          'baseAmount'
        ]
      );

    let pnl =
      pickMetric(
        s,
        [
          'pnl',
          'profit',
          'gain',
          'totalPnl',
          'cumPnl',
          'cumulativePnl',
          'totalProfit',
          'evaluationPnl'
        ]
      );

    if (
      pnl == null &&
      value != null &&
      buy != null
    ) {
      pnl =
        value - buy;
    }

    if (
      buy == null &&
      value != null &&
      pnl != null
    ) {
      buy =
        value - pnl;
    }

    return {
      value,
      buy,
      pnl
    };
  }


  function aggregateMetrics(ids) {
    const out = {
      value: 0,
      buy: 0,
      pnl: 0
    };

    let haveValue = false;
    let haveBuy = false;
    let havePnl = false;

    ids.forEach(
      id => {
        const m =
          accountMetrics(id);

        if (
          m.value != null
        ) {
          out.value +=
            m.value;

          haveValue =
            true;
        }

        if (
          m.buy != null
        ) {
          out.buy +=
            m.buy;

          haveBuy =
            true;
        }

        if (
          m.pnl != null
        ) {
          out.pnl +=
            m.pnl;

          havePnl =
            true;
        }
      }
    );

    return {
      value:
        haveValue
          ? out.value
          : null,

      buy:
        haveBuy
          ? out.buy
          : null,

      pnl:
        havePnl
          ? out.pnl
          : null
    };
  }


  function ownText(el) {
    return cleanText(
      Array
        .from(
          el.childNodes ||
          []
        )
        .filter(
          n =>
            n.nodeType ===
            Node.TEXT_NODE
        )
        .map(
          n =>
            n.nodeValue
        )
        .join(' ')
    );
  }


  function findLabelElement(
    labels
  ) {
    const root =
      document
        .getElementById(
          'content'
        ) ||
      document.body;

    const nodes =
      Array.from(
        root.querySelectorAll(
          'h1,h2,h3,h4,h5,h6,' +
          'label,span,p,div'
        )
      );

    const wanted =
      labels.map(
        x =>
          cleanText(x)
      );

    const matches =
      nodes.filter(
        el => {
          const own =
            ownText(el);

          const all =
            cleanText(
              el.textContent
            );

          return wanted.some(
            label =>
              (
                own ===
                `${label} 평가액`
              ) ||

              (
                all ===
                `${label} 평가액`
              ) ||

              (
                all.startsWith(
                  `${label} 평가액`
                ) &&
                all.length < 80
              )
          );
        }
      );

    matches.sort(
      (
        a,
        b
      ) =>
        cleanText(
          a.textContent
        ).length -

        cleanText(
          b.textContent
        ).length
    );

    return (
      matches[0] ||
      null
    );
  }


  function findAccountRegion(
    labelEl
  ) {
    if (!labelEl) {
      return null;
    }

    let el =
      labelEl;

    for (
      let i = 0;
      el && i < 7;
      i++,
      el =
        el.parentElement
    ) {
      if (
        el.querySelector(
          'table'
        )
      ) {
        const text =
          cleanText(
            el.textContent
          );

        const markerCount =
          ACCOUNT_DEFS.reduce(
            (
              n,
              d
            ) =>
              n +
              (
                d.labels.some(
                  label =>
                    text.includes(
                      `${label} 평가액`
                    )
                )
                  ? 1
                  : 0
              ),
            0
          );

        if (
          markerCount <= 1
        ) {
          return el;
        }
      }
    }

    return (
      labelEl.closest(
        '.card,' +
        '.panel,' +
        '.box,' +
        'section,' +
        'article,' +
        'details'
      ) ||

      labelEl.parentElement
    );
  }


  function findAmountElement(
    labelEl,
    region
  ) {
    if (!labelEl) {
      return null;
    }

    const moneyRx =
      /^-?[0-9,.]+(?:\.[0-9]+)?\s*(?:억|만원)$/;

    const localRoots = [
      labelEl.parentElement,
      labelEl
        .parentElement
        ?.parentElement,
      region
    ]
      .filter(Boolean);

    for (
      const root of
      localRoots
    ) {
      const nodes =
        Array.from(
          root.querySelectorAll(
            'strong,b,' +
            '.value,.big,' +
            '.kpi-value,' +
            'span,div'
          )
        );

      const hit =
        nodes.find(
          el =>
            moneyRx.test(
              cleanText(
                el.textContent
              )
            )
        );

      if (hit) {
        return hit;
      }
    }

    return null;
  }


  function headers(table) {
    return Array
      .from(
        table.querySelectorAll(
          'thead th, thead td'
        )
      )
      .map(
        x =>
          cleanText(
            x.textContent
          )
      );
  }


  function indexOfHeader(
    hs,
    patterns
  ) {
    return hs.findIndex(
      h =>
        patterns.some(
          rx =>
            rx.test(
              h.replace(
                /\s+/g,
                ''
              )
            )
        )
    );
  }


  function rowSumMan(
    table,
    idx
  ) {
    if (
      idx < 0
    ) {
      return null;
    }

    let sum = 0;
    let found = false;

    table
      .querySelectorAll(
        'tbody tr:not(' +
        '.v33-account-total-row' +
        ')'
      )
      .forEach(
        tr => {
          const cell =
            tr.children[idx];

          if (!cell) {
            return;
          }

          const v =
            parseMoneyMan(
              cell.textContent
            );

          if (
            v != null
          ) {
            sum += v;
            found = true;
          }
        }
      );

    return found
      ? sum
      : null;
  }


  function rawNumberFromCellV33(cell) {
    if (!cell) {
      return null;
    }

    const input =
      cell.querySelector(
        'input'
      );

    if (
      input &&
      input.value !== ''
    ) {
      const n =
        Number(
          String(input.value)
            .replace(/,/g, '')
        );

      if (
        Number.isFinite(n)
      ) {
        return n;
      }
    }

    const text =
      cleanText(
        cell.textContent
      )
        .replace(/,/g, '')
        .replace(/원/g, '')
        .trim();

    if (
      !text ||
      /^(n\/a|na|-|—)$/i
        .test(text)
    ) {
      return null;
    }

    //
    // 억 / 만원 표시가 있는 경우
    // 원 단위로 복원.
    //

    const sign =
      text.startsWith('-')
        ? -1
        : 1;

    const unsigned =
      text.replace(
        /^[-+]/,
        ''
      );

    const eokMatch =
      unsigned.match(
        /([0-9.]+)\s*억/
      );

    const manMatch =
      unsigned.match(
        /([0-9.]+)\s*만원/
      );

    if (eokMatch) {
      const eok =
        Number(
          eokMatch[1]
        );

      const man =
        manMatch
          ? Number(
              manMatch[1]
            )
          : 0;

      return (
        sign *
        (
          eok *
          100000000 +

          man *
          10000
        )
      );
    }

    if (manMatch) {
      return (
        sign *
        Number(
          manMatch[1]
        ) *
        10000
      );
    }

    const n =
      Number(
        unsigned.replace(
          /[^0-9.]/g,
          ''
        )
      );

    return Number.isFinite(n)
      ? sign * n
      : null;
  }


  function formatWonV33(value) {
    const n =
      Number(value);

    if (
      !Number.isFinite(n)
    ) {
      return '';
    }

    return Math.round(n)
      .toLocaleString(
        'ko-KR'
      );
  }


  function sumColumnWonV33(
    table,
    index
  ) {
    if (
      index < 0
    ) {
      return null;
    }

    let total = 0;
    let found = false;

    table
      .querySelectorAll(
        'tbody tr:not(.v33-account-total-row)'
      )
      .forEach(
        row => {
          const cell =
            row.children[
              index
            ];

          if (!cell) {
            return;
          }

          const value =
            rawNumberFromCellV33(
              cell
            );

          if (
            value != null
          ) {
            total += value;
            found = true;
          }
        }
      );

    return found
      ? total
      : null;
  }


  function accountCashWonV33(
    def,
    accountValueWon,
    holdingValueWon
  ) {
    //
    // 계좌 평가액에는 현금이 포함되지만
    // holdings 평가금액 합에는 현금이
    // 포함되지 않을 수 있다.
    //
    // 따라서:
    //
    // account cash
    // = account total value
    // - holdings market value
    //

    if (
      accountValueWon == null ||
      holdingValueWon == null
    ) {
      return null;
    }

    const cash =
      accountValueWon -
      holdingValueWon;

    //
    // 소수점/반올림 noise 제거.
    //

    return Math.abs(cash) < 1
      ? 0
      : Math.round(cash);
  }

  function accountValueManV33Compat(
    id
  ) {
    try {
      if (
        typeof accountValueMan ===
        'function'
      ) {
        return accountValueMan(
          id
        );
      }
    } catch (e) {}

    try {
      if (
        typeof accountValue ===
        'function'
      ) {
        const n =
          Number(
            accountValue(id)
          );

        if (
          Number.isFinite(n)
        ) {
          return (
            Math.abs(n) >= 10000000
              ? n / 10000
              : n
          );
        }
      }
    } catch (e) {}

    return null;
  }
  
  function installAccountTotal(
    table,
    def
  ) {
    if (!table) {
      return;
    }


    //
    // Memo도 계좌별 독립 key.
    //

    table.dataset.v33MemoKey =
      `계좌·보유::${def.id}::holdings`;


    const hs =
      headers(table);

    if (!hs.length) {
      return;
    }


    const buyIdx =
      indexOfHeader(
        hs,
        [
          /^매수금액/,
          /^매수액/,
          /^매입금액/,
          /^매입액/
        ]
      );


    const evalIdx =
      indexOfHeader(
        hs,
        [
          /^평가금액/,
          /^평가액/,
          /^현재평가/
        ]
      );


    const pnlIdx =
      indexOfHeader(
        hs,
        [
          /^평가손익/,
          /^총손익/,
          /^손익$/
        ]
      );


    const realizedIdx =
      indexOfHeader(
        hs,
        [
          /^실현손익/
        ]
      );


    const dividendIdx =
      indexOfHeader(
        hs,
        [
          /^누적배당/,
          /^배당누적/
        ]
      );


    const trIdx =
      indexOfHeader(
        hs,
        [
          /^TR$/,
          /^수익률$/
        ]
      );


    const weightIdx =
      indexOfHeader(
        hs,
        [
          /^비중$/,
          /^Weight$/i
        ]
      );


    //
    // --------------------------------------------------
    // 각 holdings 행의 실제 원 단위 숫자를 합산.
    // --------------------------------------------------
    //

    const buyWon =
      sumColumnWonV33(
        table,
        buyIdx
      );


    const holdingValueWon =
      sumColumnWonV33(
        table,
        evalIdx
      );


    const pnlWon =
      sumColumnWonV33(
        table,
        pnlIdx
      );


    const realizedWon =
      sumColumnWonV33(
        table,
        realizedIdx
      );


    const dividendWon =
      sumColumnWonV33(
        table,
        dividendIdx
      );


    //
    // accountValue()는 현재 앱에서
    // 만원 단위.
    //
    // Total 평가액에는 계좌현금까지
    // 포함해야 하므로 accountValue를 사용.
    //

    const accountValueMan =
      accountValueManV33Compat(
        def.id
      );


    const accountValueWon =
      accountValueMan != null

        ? Math.round(
            accountValueMan *
            10000
          )

        : holdingValueWon;


    const cashWon =
      accountCashWonV33(
        def,
        accountValueWon,
        holdingValueWon
      );


    //
    // Total TR
    //
    // 평가손익 + 실현손익 + 누적배당
    // --------------------------------
    // 매수금액
    //
    // 기존 계좌 정의가 별도로 존재하면
    // 향후 그 값을 우선하도록 할 수 있다.
    //

    const totalReturnWon =
      (
        pnlWon || 0
      ) +
      (
        realizedWon || 0
      ) +
      (
        dividendWon || 0
      );


    const trValue =
      buyWon != null &&
      buyWon !== 0

        ? (
            totalReturnWon /
            buyWon *
            100
          )

        : null;


    //
    // --------------------------------------------------
    // Total row
    // --------------------------------------------------
    //

    let tr =
      table.querySelector(
        'tbody .v33-account-total-row'
      );


    if (!tr) {
      tr =
        document.createElement(
          'tr'
        );

      tr.className =
        'v33-account-total-row';

      for (
        let i = 0;
        i < hs.length;
        i++
      ) {
        tr.appendChild(
          document.createElement(
            'td'
          )
        );
      }

      table
        .tBodies[0]
        ?.appendChild(tr);
    }


    while (
      tr.children.length <
      hs.length
    ) {
      tr.appendChild(
        document.createElement(
          'td'
        )
      );
    }


    for (
      let i = 0;
      i < hs.length;
      i++
    ) {
      const td =
        tr.children[i];

      let text = '';
      let negative = false;


      if (
        i === 0
      ) {
        text =
          'Total';

      } else if (
        i === buyIdx &&
        buyWon != null
      ) {
        text =
          formatWonV33(
            buyWon
          );

      } else if (
        i === evalIdx &&
        accountValueWon != null
      ) {
        text =
          formatWonV33(
            accountValueWon
          );

      } else if (
        i === pnlIdx &&
        pnlWon != null
      ) {
        text =
          formatWonV33(
            pnlWon
          );

        negative =
          pnlWon < 0;

      } else if (
        i === realizedIdx &&
        realizedWon != null
      ) {
        text =
          formatWonV33(
            realizedWon
          );

        negative =
          realizedWon < 0;

      } else if (
        i === dividendIdx &&
        dividendWon != null
      ) {
        text =
          formatWonV33(
            dividendWon
          );

        negative =
          dividendWon < 0;

      } else if (
        i === trIdx &&
        trValue != null
      ) {
        text =
          `${trValue.toFixed(
            2
          )}%`;

        negative =
          trValue < 0;

      } else if (
        i === weightIdx
      ) {
        text =
          '100.00%';
      }


      td.textContent =
        text;


      td.classList.toggle(
        'v33-negative',
        negative
      );
    }


    //
    // --------------------------------------------------
    // 계좌 현금 diagnostic
    // --------------------------------------------------
    //
    // Total 행의 title에 남겨두면
    // 화면을 복잡하게 만들지 않고
    // PC에서는 hover로 확인 가능.
    //

    if (
      cashWon != null
    ) {
      tr.title =
        `계좌현금: ${
          formatWonV33(
            cashWon
          )
        }원`;
    }


    //
    // Performance에서 동일 source를
    // 사용할 수 있도록 runtime 저장.
    //

    if (
      !window.accountTotalsRuntimeV33
    ) {
      window.accountTotalsRuntimeV33 =
        {};
    }


    window
      .accountTotalsRuntimeV33[
        def.id
      ] = {

        buyWon,

        holdingValueWon,

        accountValueWon,

        cashWon,

        pnlWon,

        realizedWon,

        dividendWon,

        tr:
          trValue
      };
  }

  function enhanceAccounts() {
    if (
      tabName()
        .replace(
          /\s/g,
          ''
        ) !==
      '계좌·보유'
    ) {
      return;
    }


    const audit = [];


    ACCOUNT_DEFS.forEach(
      def => {
        const label =
          findLabelElement(
            def.labels
          );


        if (!label) {
          audit.push({
            id:
              def.id,

            status:
              'label-not-found'
          });

          return;
        }


        const region =
          findAccountRegion(
            label
          );


        const value =
          accountValueMan(
            def.id
          );


        const amountEl =
          findAmountElement(
            label,
            region
          );


        if (
          amountEl &&
          value != null
        ) {
          const detailed =
            formatMan(
              value
            );

          if (
            amountEl
              .textContent !==
            detailed
          ) {
            amountEl.textContent =
              detailed;
          }

          amountEl.classList.add(
            'v33-detail-money'
          );
        }


        const table =
          region
            ?.querySelector(
              'table'
            );


        if (table) {
          installAccountTotal(
            table,
            def
          );
        }


        //
        // 기존 잘못된 공용 memo box가
        // 붙어 있으면 제거.
        //
        // v33-ops가 새 account-specific
        // key로 다시 생성한다.
        //

        const memo =
          table
            ?.closest(
              '.tableWrap,' +
              '.v33-inline-table-wrap'
            )
            ?.nextElementSibling;


        if (
          memo
            ?.classList
            .contains(
              'v33-table-memo'
            ) &&

          memo
            .dataset
            .memoKey !==
            `계좌·보유::${def.id}::holdings`
        ) {
          memo.remove();
        }


        audit.push({
          id:
            def.id,

          value,

          amountUpdated:
            !!amountEl,

          table:
            !!table
        });
      }
    );


    //
    // 필요 시 Console에서
    // accountValueAuditV33 로 확인.
    //

    window
      .accountValueAuditV33 =
      audit;
  }


  function normScope(v) {
    return cleanText(v)
      .replace(
        /\s+/g,
        ''
      )
      .toUpperCase()
      .replace(
        '개인연금1',
        '연금(1)'
      )
      .replace(
        '개인연금2',
        '연금(2)'
      );
  }


  function metricFromNode(
    node
  ) {
    if (
      !node ||
      typeof node !==
        'object'
    ) {
      return {
        value: null,
        pnl: null,
        buy: null
      };
    }


    const value =
      pickMetric(
        node,
        [
          'value',
          'currentValue',
          'marketValue',
          'evaluation',
          'eval',
          'totalValue',
          'amount',
          'currentEval'
        ]
      );


    let pnl =
      pickMetric(
        node,
        [
          'pnl',
          'profit',
          'gain',
          'totalPnl',
          'cumPnl',
          'cumulativePnl',
          'evaluationPnl'
        ]
      );


    const buy =
      pickMetric(
        node,
        [
          'buy',
          'buyAmount',
          'purchaseAmount',
          'cost',
          'costBasis',
          'basis',
          'invested',
          'principal'
        ]
      );


    if (
      pnl == null &&
      value != null &&
      buy != null
    ) {
      pnl =
        value - buy;
    }


    return {
      value,
      pnl,
      buy
    };
  }


  function findScopeNode(
    source,
    scope,
    depth
  ) {
    if (
      !source ||
      depth > 4
    ) {
      return null;
    }


    const target =
      normScope(
        scope
      );


    if (
      Array.isArray(
        source
      )
    ) {
      for (
        const item of source
      ) {
        if (
          item &&
          typeof item ===
            'object'
        ) {
          const label =
            item.label ??
            item.scope ??
            item.name ??
            item.key ??
            item.bucket ??
            item.id;

          if (
            label != null &&
            normScope(
              label
            ) ===
            target
          ) {
            return item;
          }
        }


        if (
          Array.isArray(
            item
          ) &&
          item.length &&
          normScope(
            item[0]
          ) ===
          target
        ) {
          return item;
        }
      }


      for (
        const item of source
      ) {
        const hit =
          findScopeNode(
            item,
            scope,
            depth + 1
          );

        if (hit) {
          return hit;
        }
      }


      return null;
    }


    if (
      typeof source ===
        'object'
    ) {
      for (
        const [
          k,
          v
        ] of
        Object.entries(
          source
        )
      ) {
        if (
          normScope(k) ===
          target
        ) {
          return v;
        }
      }


      const label =
        source.label ??
        source.scope ??
        source.name ??
        source.key ??
        source.bucket ??
        source.id;


      if (
        label != null &&
        normScope(
          label
        ) ===
        target
      ) {
        return source;
      }


      for (
        const v of
        Object.values(
          source
        )
      ) {
        if (
          v &&
          typeof v ===
            'object'
        ) {
          const hit =
            findScopeNode(
              v,
              scope,
              depth + 1
            );

          if (hit) {
            return hit;
          }
        }
      }
    }


    return null;
  }


  function performanceRowsSafe() {
    try {
      if (
        typeof performanceRows ===
        'function'
      ) {
        return performanceRows();
      }
    } catch (e) {}

    return null;
  }


  function candidateBucketSources(
    scope
  ) {
    const sources = [];


    const add =
      fn => {
        try {
          const a =
            fn();

          if (
            a != null
          ) {
            sources.push(a);
          }


          const b =
            fn(scope);

          if (
            b != null &&
            b !== a
          ) {
            sources.push(b);
          }

        } catch (e) {}
      };


    try {
      if (
        typeof pensionBucketMetricsV33 ===
        'function'
      ) {
        add(
          pensionBucketMetricsV33
        );
      }
    } catch (e) {}


    try {
      if (
        typeof pensionBucketRowsV33 ===
        'function'
      ) {
        add(
          pensionBucketRowsV33
        );
      }
    } catch (e) {}


    try {
      if (
        typeof pensionBucketSnapshotV33 ===
        'function'
      ) {
        add(
          pensionBucketSnapshotV33
        );
      }
    } catch (e) {}


    try {
      if (
        typeof portfolioExposureRowsV33 ===
        'function'
      ) {
        add(
          portfolioExposureRowsV33
        );
      }
    } catch (e) {}


    try {
      if (
        typeof portfolioExposureV33 ===
        'function'
      ) {
        add(
          portfolioExposureV33
        );
      }
    } catch (e) {}


    try {
      if (
        typeof exposureRowsV33 ===
        'function'
      ) {
        add(
          exposureRowsV33
        );
      }
    } catch (e) {}


    const pr =
      performanceRowsSafe();

    if (
      pr != null
    ) {
      sources.push(pr);
    }


    return sources;
  }


  function bucketMetrics(
    scope
  ) {
    for (
      const source of
      candidateBucketSources(
        scope
      )
    ) {
      const node =
        findScopeNode(
          source,
          scope,
          0
        );


      if (!node) {
        continue;
      }


      if (
        Array.isArray(
          node
        )
      ) {
        //
        // Bucket helper가
        // [label,buy,eval,pnl,...]
        // 형태인 경우 지원.
        //
        // 단 performance % row를
        // 금액으로 오인하지 않도록
        // 평가액 > 500만원일 때만 인정.
        //

        const buy =
          toMan(
            node[1]
          );

        const value =
          toMan(
            node[2]
          );

        const pnl =
          toMan(
            node[3]
          );


        if (
          value != null &&
          Math.abs(value) >
            500
        ) {
          return {
            value,
            buy,
            pnl
          };
        }


        for (
          const part of node
        ) {
          const m =
            metricFromNode(
              part
            );

          if (
            m.value != null &&
            Math.abs(
              m.value
            ) >
              500
          ) {
            return m;
          }
        }

      } else {
        const m =
          metricFromNode(
            node
          );

        if (
          m.value != null
        ) {
          return m;
        }
      }
    }


    return {
      value: null,
      pnl: null,
      buy: null
    };
  }


  function scopeMetrics(
    scope
  ) {
        const runtime =
      window.accountTotalsRuntimeV33 ||
      {};


    const runtimeMap = {
      'DC': 'DC',
      '연금(1)': 'P1',
      '연금(2)': 'P2',
      'ISA': 'ISA',
      '일반계좌': 'GENERAL',
      '자녀연금': 'CHILD',
      '서현서진연금': 'CHILD'
    };


    const normalizedScope =
      normScope(
        scope
      );


    for (
      const [
        label,
        id
      ] of
      Object.entries(
        runtimeMap
      )
    ) {
      if (
        normalizedScope ===
        normScope(label) &&
        runtime[id]
      ) {
        return {
          value:
            runtime[id]
              .accountValueWon /
            10000,

          buy:
            runtime[id]
              .buyWon /
            10000,

          pnl:
            runtime[id]
              .pnlWon /
            10000
        };
      }
    }
    const s =
      normScope(
        scope
      );


    const direct = [
      [
        'DC',
        'DC'
      ],

      [
        '연금(1)',
        'P1'
      ],

      [
        '연금(2)',
        'P2'
      ],

      [
        'ISA',
        'ISA'
      ],

      [
        '일반계좌',
        'GENERAL'
      ],

      [
        '자녀연금',
        'CHILD'
      ],

      [
        '서현서진연금',
        'CHILD'
      ]
    ];


    for (
      const [
        label,
        id
      ] of
      direct
    ) {
      if (
        s ===
        normScope(
          label
        )
      ) {
        return accountMetrics(
          id
        );
      }
    }


    if (
      s ===
      normScope(
        '연금합산'
      )
    ) {
      return aggregateMetrics(
        [
          'DC',
          'P1',
          'P2'
        ]
      );
    }


    if (
      s ===
      normScope(
        'Total'
      )
    ) {
      return aggregateMetrics(
        [
          'DC',
          'P1',
          'P2',
          'ISA',
          'GENERAL',
          'CHILD'
        ]
      );
    }


    if (
      [
        'EQUITY',
        'INCOME',
        'HEDGE',
        'PARKING'
      ]
        .includes(s)
    ) {
      return bucketMetrics(s);
    }


    return {
      value: null,
      pnl: null,
      buy: null
    };
  }


  function performanceTable() {
    return Array
      .from(
        document.querySelectorAll(
          'table'
        )
      )
      .find(
        table => {
          const h =
            headers(table)
              .join('|')
              .replace(
                /\s/g,
                ''
              )
              .toUpperCase();

          return (
            h.includes(
              '25YTD'
            ) &&
            h.includes(
              '26YTD'
            ) &&
            h.includes(
              'TWR'
            ) &&
            h.includes(
              'CAGR'
            )
          );
        }
      ) ||
      null;
  }


  function enhancePerformance() {
    if (
      tabName() !==
      'Overview'
    ) {
      return;
    }


    const table =
      performanceTable();


    if (
      !table ||
      table
        .dataset
        .v33ValueDetail ===
        '1'
    ) {
      return;
    }


    table.dataset
      .v33ValueDetail =
      '1';


    table.dataset
      .v33MemoKey =
      'Overview::Performance::performance';


    table.classList.add(
      'v33-performance-table'
    );


    const headRow =
      table.querySelector(
        'thead tr:last-child'
      ) ||
      table.querySelector(
        'thead tr'
      );


    const firstHead =
      headRow
        ?.children[0];


    if (
      !headRow ||
      !firstHead
    ) {
      return;
    }


    const originalHeaders =
      headers(table);


    const originalTrIdx =
      indexOfHeader(
        originalHeaders,
        [
          /^TR$/
        ]
      );


    const hValue =
      document.createElement(
        'th'
      );

    hValue.textContent =
      '평가액';

    hValue.className =
      'v33-perf-money-head';


    const hPnl =
      document.createElement(
        'th'
      );

    hPnl.textContent =
      '평가손익';

    hPnl.className =
      'v33-perf-money-head';


    firstHead.insertAdjacentElement(
      'afterend',
      hPnl
    );

    firstHead.insertAdjacentElement(
      'afterend',
      hValue
    );


    const audit = [];


    table
      .querySelectorAll(
        'tbody tr'
      )
      .forEach(
        row => {
          if (
            row.children.length ===
              1 &&
            row.children[0]
              .hasAttribute(
                'colspan'
              )
          ) {
            row.children[0]
              .colSpan =
              Number(
                row.children[0]
                  .colSpan ||
                1
              ) + 2;

            return;
          }


          const first =
            row.children[0];


          if (!first) {
            return;
          }


          const scope =
            cleanText(
              first.textContent
            );


          const metrics =
            scopeMetrics(
              scope
            );


          let pnl =
            metrics.pnl;


          let tr =
            null;


          if (
            originalTrIdx >= 0 &&
            row.children[
              originalTrIdx
            ]
          ) {
            const match =
              cleanText(
                row.children[
                  originalTrIdx
                ].textContent
              )
                .match(
                  /-?[0-9.]+/
                );

            tr =
              match
                ? Number(
                    match[0]
                  )
                : null;
          }


          //
          // 평가손익 source가 없으면
          // 현재 평가액 + 기존 TR로 역산.
          //
          // TR = PnL / Cost
          //

          if (
            pnl == null &&
            metrics.value !=
              null &&
            tr != null &&
            tr > -99.99
          ) {
            const buy =
              metrics.value /
              (
                1 +
                tr / 100
              );

            pnl =
              metrics.value -
              buy;
          }


          const valueCell =
            document.createElement(
              'td'
            );

          valueCell.className =
            'v33-perf-money-cell';

          valueCell.textContent =
            metrics.value != null

              ? formatMan(
                  metrics.value
                )

              : 'n/a';


          const pnlCell =
            document.createElement(
              'td'
            );

          pnlCell.className =
            'v33-perf-money-cell';

          pnlCell.textContent =
            pnl != null

              ? formatMan(pnl)

              : 'n/a';


          if (
            pnl != null &&
            pnl < 0
          ) {
            pnlCell.classList.add(
              'v33-perf-pnl-negative'
            );
          }


          if (
            [
              '연금합산',
              'Total'
            ]
              .includes(
                scope
              )
          ) {
            valueCell.classList.add(
              'v33-perf-money-important'
            );

            pnlCell.classList.add(
              'v33-perf-money-important'
            );
          }


          first.insertAdjacentElement(
            'afterend',
            pnlCell
          );

          first.insertAdjacentElement(
            'afterend',
            valueCell
          );


          audit.push({
            scope,
            value:
              metrics.value,
            pnl
          });
        }
      );


    //
    // 필요 시 Console에서
    // performanceValueAuditV33 확인.
    //

    window
      .performanceValueAuditV33 =
      audit;
  }


  function apply() {
    if (applying) {
      return;
    }

    applying =
      true;

    try {
      injectStyle();

      enhanceAccounts();

      enhancePerformance();


      //
      // 새 Total / 새 columns에도
      // sticky 재적용
      //

      try {
        if (
          typeof applyGlobalStickyV33 ===
          'function'
        ) {
          applyGlobalStickyV33();
        }
      } catch (e) {}


      //
      // 계좌별 memo key 변경 후
      // 올바른 Memo box 재생성
      //

      try {
        if (
          typeof applyOpsV33 ===
          'function'
        ) {
          applyOpsV33();
        }
      } catch (e) {}

    } finally {
      applying =
        false;
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


  window.applyValueDetailV33 =
    apply;


  [
    'load',
    'resize',
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
    'v3.3 precise value detail loaded'
  );

})();
