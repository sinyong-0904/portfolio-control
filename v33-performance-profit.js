// Portfolio Control v3.3
// Performance profit semantics
//
// Final columns:
// scope | value | 26' P&L | cumulative P&L |
// 25 YTD | 26 YTD | TR | TWR | CAGR
//
// Load AFTER v33-value-detail.js / v33-ops-ux.js.

(function () {
  'use strict';

  let queued = false;


  const ACCOUNT_MAP = {
    'DC': 'DC',
    '연금(1)': 'P1',
    '연금(2)': 'P2',
    '개인연금1': 'P1',
    '개인연금2': 'P2',
    'ISA': 'ISA',
    '일반계좌': 'GENERAL',
    '자녀연금': 'CHILD',
    '서현서진연금': 'CHILD'
  };


  const PENSION_IDS = [
    'DC',
    'P1',
    'P2'
  ];


  const TOTAL_IDS = [
    'DC',
    'P1',
    'P2',
    'ISA',
    'GENERAL',
    'CHILD'
  ];


  //
  // v3.3 pension bucket reference snapshot.
  //
  // If a live/runtime bucket object is found,
  // that value is used first.
  //
  // This reference is only a fallback.
  //

  const BUCKET_REFERENCE = {

    EQUITY: {
      evaluation: 12398,
      ytdPnl: 848,
      cumulativePnl: 2395
    },

    INCOME: {
      evaluation: 5797,
      ytdPnl: 758,
      cumulativePnl: 1102
    },

    HEDGE: {
      evaluation: 4874,
      ytdPnl: 106,
      cumulativePnl: 852
    },

    PARKING: {
      evaluation: 9681,
      ytdPnl: 229,
      cumulativePnl: 579
    }
  };


  function clean(value) {
    return String(
      value == null
        ? ''
        : value
    )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();
  }


  function normalized(value) {
    return clean(value)
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


  function finite(value) {
    const n =
      Number(value);

    return Number.isFinite(n)
      ? n
      : null;
  }


  //
  // Internal money unit -> 만원
  //

  function toMan(value) {
    const n =
      finite(value);

    if (n == null) {
      return null;
    }

    return Math.abs(n) >=
      10000000

      ? n / 10000

      : n;
  }


  function formatMan(value) {
    const n =
      finite(value);

    if (n == null) {
      return 'n/a';
    }

    return (
      `${Math.round(n)
        .toLocaleString(
          'ko-KR'
        )}만원`
    );
  }


  function parseMan(text) {
    const t =
      clean(text)
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


    const raw =
      t.replace(
        /^[-+]/,
        ''
      );


    const eok =
      raw.match(
        /([0-9.]+)\s*억/
      );


    const man =
      raw.match(
        /([0-9.]+)\s*만원/
      );


    if (eok) {
      return (
        sign *
        (
          Number(eok[1]) *
          10000 +

          (
            man
              ? Number(man[1])
              : 0
          )
        )
      );
    }


    if (man) {
      return (
        sign *
        Number(man[1])
      );
    }


    const n =
      Number(
        raw.replace(
          /[^0-9.]/g,
          ''
        )
      );


    return Number.isFinite(n)
      ? sign * n
      : null;
  }


  function parsePercent(text) {
    const match =
      clean(text)
        .match(
          /[-+]?[0-9.]+/
        );

    if (!match) {
      return null;
    }

    const n =
      Number(match[0]);

    return Number.isFinite(n)
      ? n
      : null;
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
          const text =
            Array
              .from(
                table.querySelectorAll(
                  'thead th'
                )
              )
              .map(
                th =>
                  clean(
                    th.textContent
                  )
              )
              .join('|')
              .replace(
                /\s/g,
                ''
              )
              .toUpperCase();


          return (
            text.includes(
              '25YTD'
            ) &&
            text.includes(
              '26YTD'
            ) &&
            text.includes(
              'TWR'
            ) &&
            text.includes(
              'CAGR'
            )
          );
        }
      ) ||
      null;
  }


  function headers(table) {
    return Array
      .from(
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
  }


  function headerIndex(
    hs,
    patterns
  ) {
    return hs.findIndex(
      header =>
        patterns.some(
          pattern =>
            pattern.test(
              header.replace(
                /\s+/g,
                ''
              )
            )
        )
    );
  }


  function directMetric(
    object,
    keys
  ) {
    if (
      !object ||
      typeof object !==
        'object'
    ) {
      return null;
    }


    for (
      const key of keys
    ) {
      if (
        !Object.prototype
          .hasOwnProperty
          .call(
            object,
            key
          )
      ) {
        continue;
      }


      const n =
        toMan(
          object[key]
        );


      if (n != null) {
        return n;
      }
    }


    return null;
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


  function accountValueMan(id) {
    //
    // Exact account total calculated in
    // v33-value-detail.js has priority.
    //

    try {
      const runtime =
        window
          .accountTotalsRuntimeV33
          ?.[id];


      if (
        runtime &&
        Number.isFinite(
          Number(
            runtime.accountValueWon
          )
        )
      ) {
        return (
          Number(
            runtime.accountValueWon
          ) /
          10000
        );
      }
    } catch (e) {}


    try {
      if (
        typeof accountValue ===
        'function'
      ) {
        const n =
          toMan(
            accountValue(id)
          );

        if (n != null) {
          return n;
        }
      }
    } catch (e) {}


    const summary =
      accountSummarySafe(id);


    return directMetric(
      summary,
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


  //
  // Cumulative P&L
  //
  // Definition:
  //
  // evaluation
  // - all historical deposits
  //
  // Prefer the existing account performance
  // data if it exposes cumulative P&L.
  //

  function accountCumulativePnlMan(
    id,
    fallbackValue,
    fallbackTr
  ) {
    const summary =
      accountSummarySafe(id);


    const direct =
      directMetric(
        summary,
        [
          'cumPnl',
          'cumulativePnl',
          'cumProfit',
          'cumulativeProfit',
          'lifetimePnl',
          'lifetimeProfit'
        ]
      );


    if (direct != null) {
      return direct;
    }


    //
    // Fallback:
    //
    // TR = cumulative P&L / total deposits
    //
    // value = deposits + cumulative P&L
    //
    // cumulative P&L =
    // value * TR / (100 + TR)
    //

    if (
      fallbackValue != null &&
      fallbackTr != null &&
      fallbackTr > -100
    ) {
      return (
        fallbackValue *
        fallbackTr /
        (
          100 +
          fallbackTr
        )
      );
    }


    return null;
  }


  function sumAccountCumulative(
    ids,
    rowInfo
  ) {
    let total = 0;
    let found = false;


    ids.forEach(
      id => {
        const item =
          rowInfo[id];


        if (!item) {
          return;
        }


        const cumulative =
          accountCumulativePnlMan(
            id,
            item.value,
            item.tr
          );


        if (
          cumulative != null
        ) {
          total +=
            cumulative;

          found =
            true;
        }
      }
    );


    return found
      ? total
      : null;
  }


  // ============================================================
  // Bucket metric discovery
  // ============================================================

  const YTD_KEYS = [
    'ytdPnl',
    'pnlYtd',
    'yearPnl',
    'currentYearPnl',
    'pnl26',
    'y26Pnl',
    'profit2026',
    'profit26'
  ];


  const CUM_KEYS = [
    'cumPnl',
    'cumulativePnl',
    'cumProfit',
    'cumulativeProfit',
    'lifetimePnl',
    'lifetimeProfit'
  ];


  const EVAL_KEYS = [
    'evaluation',
    'eval',
    'value',
    'currentValue',
    'marketValue',
    'totalValue'
  ];


  function findBucketObject(
    scope
  ) {
    if (
      typeof data ===
        'undefined' ||
      !data
    ) {
      return null;
    }


    const target =
      normalized(scope);


    const visited =
      new WeakSet();


    let best = null;
    let bestScore = -1;


    function visit(
      value,
      path,
      parentKey,
      depth
    ) {
      if (
        !value ||
        typeof value !==
          'object' ||
        depth > 7
      ) {
        return;
      }


      if (
        visited.has(value)
      ) {
        return;
      }


      visited.add(value);


      const pathText =
        path
          .join('.')
          .toLowerCase();


      //
      // Historical frozen snapshots must not
      // feed the live Performance table.
      //

      if (
        pathText.includes(
          'history'
        )
      ) {
        return;
      }


      if (
        !Array.isArray(value)
      ) {
        const label =
          value.scope ??
          value.label ??
          value.name ??
          value.bucket ??
          value.key ??
          value.id ??
          parentKey;


        if (
          normalized(label) ===
          target
        ) {
          const ytd =
            directMetric(
              value,
              YTD_KEYS
            );


          const cumulative =
            directMetric(
              value,
              CUM_KEYS
            );


          const evaluation =
            directMetric(
              value,
              EVAL_KEYS
            );


          let score = 0;


          if (ytd != null) {
            score += 4;
          }

          if (
            cumulative != null
          ) {
            score += 4;
          }

          if (
            evaluation != null
          ) {
            score += 2;
          }


          if (
            pathText.includes(
              'pension'
            )
          ) {
            score += 2;
          }


          if (
            pathText.includes(
              'performance'
            ) ||
            pathText.includes(
              'snapshot'
            )
          ) {
            score += 2;
          }


          if (
            score >
            bestScore
          ) {
            bestScore =
              score;


            best = {
              object:
                value,

              ytd,

              cumulative,

              evaluation,

              path:
                path.join('.'),

              score
            };
          }
        }
      }


      if (
        Array.isArray(value)
      ) {
        value.forEach(
          (
            item,
            index
          ) =>
            visit(
              item,
              [
                ...path,
                String(index)
              ],
              String(index),
              depth + 1
            )
        );

      } else {
        Object.entries(value)
          .forEach(
            (
              [
                key,
                item
              ]
            ) =>
              visit(
                item,
                [
                  ...path,
                  key
                ],
                key,
                depth + 1
              )
          );
      }
    }


    visit(
      data,
      ['data'],
      'data',
      0
    );


    return best;
  }


  function bucketMetrics(
    scope,
    currentEvaluation
  ) {
    const found =
      findBucketObject(
        scope
      );


    if (
      found &&
      (
        found.ytd != null ||
        found.cumulative !=
          null
      )
    ) {
      //
      // A stored bucket snapshot may be the
      // reference point rather than today's
      // evaluation.
      //
      // With no new bucket cash-flow,
      // price movement changes both
      // year P&L and cumulative P&L
      // by the same amount.
      //

      const delta =
        (
          currentEvaluation !=
            null &&
          found.evaluation !=
            null
        )

          ? (
              currentEvaluation -
              found.evaluation
            )

          : 0;


      return {

        ytd:
          found.ytd != null

            ? (
                found.ytd +
                delta
              )

            : null,


        cumulative:
          found.cumulative !=
            null

            ? (
                found.cumulative +
                delta
              )

            : null,


        source:
          `runtime:${found.path}`
      };
    }


    //
    // Final fallback:
    // user-verified v3.3 reference snapshot.
    //

    const ref =
      BUCKET_REFERENCE[
        normalized(scope)
      ];


    if (!ref) {
      return {
        ytd: null,
        cumulative: null,
        source: 'none'
      };
    }


    const delta =
      currentEvaluation != null

        ? (
            currentEvaluation -
            ref.evaluation
          )

        : 0;


    return {

      ytd:
        ref.ytdPnl +
        delta,


      cumulative:
        ref.cumulativePnl +
        delta,


      source:
        'reference-delta'
    };
  }


  // ============================================================
  // Table
  // ============================================================

  function accountIdForScope(
    scope
  ) {
    const target =
      normalized(scope);


    for (
      const [
        label,
        id
      ] of
      Object.entries(
        ACCOUNT_MAP
      )
    ) {
      if (
        normalized(label) ===
        target
      ) {
        return id;
      }
    }


    return null;
  }


  function importantScope(
    scope
  ) {
    return [
      '연금합산',
      'Total'
    ]
      .some(
        label =>
          normalized(label) ===
          normalized(scope)
      );
  }


  function installStyle() {
    if (
      document.getElementById(
        'v33-performance-profit-style'
      )
    ) {
      return;
    }


    const style =
      document.createElement(
        'style'
      );


    style.id =
      'v33-performance-profit-style';


    style.textContent = `
      .v33-performance-table
      .v33-cum-pnl-cell {
        white-space: nowrap;
        font-variant-numeric:
          tabular-nums;
      }

      .v33-performance-table
      .v33-performance-negative {
        color:
          var(
            --v33-red,
            #dc2626
          ) !important;

        font-weight:
          800 !important;
      }

      .v33-performance-table
      .v33-performance-important {
        color:
          var(
            --v33-blue,
            #2563eb
          ) !important;

        font-weight:
          800 !important;
      }
    `;


    document.head
      .appendChild(style);
  }


  function enhancePerformance() {
    const table =
      performanceTable();


    if (!table) {
      return;
    }


    const hsBefore =
      headers(table);


    const valueIdxBefore =
      headerIndex(
        hsBefore,
        [
          /^평가액$/
        ]
      );


    const pnlIdxBefore =
      headerIndex(
        hsBefore,
        [
          /^평가손익$/,
          /^26['’]?손익$/
        ]
      );


    const trIdxBefore =
      headerIndex(
        hsBefore,
        [
          /^TR$/
        ]
      );


    if (
      valueIdxBefore < 0 ||
      pnlIdxBefore < 0
    ) {
      return;
    }


    //
    // 1. Rename semantic header
    //

    const headerCells =
      table.querySelectorAll(
        'thead th'
      );


    const pnlHeader =
      headerCells[
        pnlIdxBefore
      ];


    if (pnlHeader) {
      pnlHeader.textContent =
        "26'손익";
    }


    //
    // 2. Insert cumulative P&L header once
    //

    let cumIdx =
      headers(table)
        .findIndex(
          h =>
            h.replace(
              /\s+/g,
              ''
            ) ===
            '누적손익'
        );


    if (
      cumIdx < 0
    ) {
      const headRow =
        pnlHeader
          ?.parentElement;


      if (!headRow) {
        return;
      }


      const th =
        document.createElement(
          'th'
        );


      th.textContent =
        '누적손익';


      pnlHeader
        .insertAdjacentElement(
          'afterend',
          th
        );


      cumIdx =
        pnlIdxBefore + 1;
    }


    //
    // Read current account rows before
    // updating aggregate rows.
    //

    const rowInfo = {};


    table.querySelectorAll(
      'tbody tr'
    )
      .forEach(
        row => {
          if (
            row.children.length <= 1
          ) {
            return;
          }


          const scope =
            clean(
              row.children[0]
                ?.textContent
            );


          const id =
            accountIdForScope(
              scope
            );


          if (!id) {
            return;
          }


          const currentHeaders =
            headers(table);


          const valueIdx =
            headerIndex(
              currentHeaders,
              [
                /^평가액$/
              ]
            );


          const trIdx =
            headerIndex(
              currentHeaders,
              [
                /^TR$/
              ]
            );


          rowInfo[id] = {

            row,

            value:
              parseMan(
                row.children[
                  valueIdx
                ]?.textContent
              ),

            tr:
              parsePercent(
                row.children[
                  trIdx
                ]?.textContent
              )
          };
        }
      );


    const audit = [];


    table.querySelectorAll(
      'tbody tr'
    )
      .forEach(
        row => {

          //
          // Group rows:
          // 연금 계좌 / 연금 자산구성 /
          // 기타 / 전체
          //

          if (
            row.children.length ===
              1 &&
            row.children[0]
              .hasAttribute(
                'colspan'
              )
          ) {
            const expected =
              headers(table)
                .length;


            row.children[0]
              .colSpan =
              expected;


            return;
          }


          const first =
            row.children[0];


          if (!first) {
            return;
          }


          const scope =
            clean(
              first.textContent
            );


          if (!scope) {
            return;
          }


          //
          // Ensure cumulative cell exists
          // immediately after 26' P&L.
          //

          const currentHeaders =
            headers(table);


          const valueIdx =
            headerIndex(
              currentHeaders,
              [
                /^평가액$/
              ]
            );


          const ytdPnlIdx =
            headerIndex(
              currentHeaders,
              [
                /^26['’]?손익$/
              ]
            );


          const cumulativeIdx =
            headerIndex(
              currentHeaders,
              [
                /^누적손익$/
              ]
            );


          const trIdx =
            headerIndex(
              currentHeaders,
              [
                /^TR$/
              ]
            );


          if (
            valueIdx < 0 ||
            ytdPnlIdx < 0 ||
            cumulativeIdx < 0
          ) {
            return;
          }


          while (
            row.children.length <
            currentHeaders.length
          ) {
            const td =
              document.createElement(
                'td'
              );


            //
            // Insert at the semantic position,
            // not merely at row end.
            //

            if (
              row.children[
                ytdPnlIdx
              ]
            ) {
              row.children[
                ytdPnlIdx
              ]
                .insertAdjacentElement(
                  'afterend',
                  td
                );

            } else {
              row.appendChild(td);
            }
          }


          const value =
            parseMan(
              row.children[
                valueIdx
              ]?.textContent
            );


          const tr =
            parsePercent(
              row.children[
                trIdx
              ]?.textContent
            );


          let ytdPnl =
            parseMan(
              row.children[
                ytdPnlIdx
              ]?.textContent
            );


          let cumulative =
            null;


          let source =
            'unknown';


          const accountId =
            accountIdForScope(
              scope
            );


          //
          // Individual account
          //

          if (accountId) {
            cumulative =
              accountCumulativePnlMan(
                accountId,
                value,
                tr
              );


            source =
              'account';
          }


          //
          // Pension aggregate
          //

          else if (
            normalized(scope) ===
            normalized(
              '연금합산'
            )
          ) {
            cumulative =
              sumAccountCumulative(
                PENSION_IDS,
                rowInfo
              );


            source =
              'account-sum';
          }


          //
          // Total investment accounts
          //

          else if (
            normalized(scope) ===
            normalized(
              'Total'
            )
          ) {
            cumulative =
              sumAccountCumulative(
                TOTAL_IDS,
                rowInfo
              );


            source =
              'account-sum';
          }


          //
          // Pension asset bucket
          //

          else if (
            [
              'EQUITY',
              'INCOME',
              'HEDGE',
              'PARKING'
            ]
              .includes(
                normalized(
                  scope
                )
              )
          ) {
            const metric =
              bucketMetrics(
                scope,
                value
              );


            if (
              metric.ytd != null
            ) {
              ytdPnl =
                metric.ytd;
            }


            cumulative =
              metric.cumulative;


            source =
              metric.source;
          }


          //
          // Correct 26' P&L for buckets.
          // Account rows retain the already
          // validated current value.
          //

          if (
            [
              'EQUITY',
              'INCOME',
              'HEDGE',
              'PARKING'
            ]
              .includes(
                normalized(
                  scope
                )
              ) &&
            ytdPnl != null
          ) {
            const cell =
              row.children[
                ytdPnlIdx
              ];


            cell.textContent =
              formatMan(
                ytdPnl
              );


            cell.classList.toggle(
              'v33-performance-negative',
              ytdPnl < 0
            );
          }


          const cumCell =
            row.children[
              cumulativeIdx
            ];


          if (cumCell) {
            cumCell.classList.add(
              'v33-cum-pnl-cell'
            );


            cumCell.textContent =
              cumulative != null

                ? formatMan(
                    cumulative
                  )

                : 'n/a';


            cumCell.classList.toggle(
              'v33-performance-negative',

              cumulative != null &&
              cumulative < 0
            );


            cumCell.classList.toggle(
              'v33-performance-important',

              importantScope(
                scope
              )
            );
          }


          //
          // Existing 26' P&L:
          // important aggregate emphasis.
          //

          row.children[
            ytdPnlIdx
          ]?.classList
            .toggle(
              'v33-performance-important',

              importantScope(
                scope
              )
            );


          audit.push({
            scope,
            value,
            ytdPnl,
            cumulative,
            source
          });
        }
      );


    window
      .performanceProfitAuditV33 =
      audit;


    try {
      if (
        typeof applyGlobalStickyV33 ===
        'function'
      ) {
        applyGlobalStickyV33();
      }
    } catch (e) {}
  }


  function apply() {
    installStyle();

    enhancePerformance();
  }


  function queue() {
    if (queued) {
      return;
    }


    queued = true;


    requestAnimationFrame(
      () => {
        queued =
          false;

        apply();
      }
    );
  }


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
      const root =
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
          root,
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
    'v3.3 Performance profit semantics loaded'
  );

})();
