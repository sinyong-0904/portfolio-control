// Portfolio Control v3.3 dashboard
// Overview + Allocation redesign
// Load AFTER v33-views.js.

(function () {
  const CORE_TARGETS_V33 = {
    GOLD: 0.15,
    BOND: 0.10,
    'K-DVD': 0.15,
    NASDAQ: 0.25,
    'S&P500': 0.25,
    'US-CVD': 0.10
  };

const CORE_ORDER_V33 = [
  'NASDAQ',
  'S&P500',
  'US-CVD',
  'K-DVD',
  'BOND',
  'GOLD'
];

  const EXPOSURE_DETAIL_ORDER_V33 = [
    'NASDAQ',
    'S&P500',
    'US-CVD',
    'K-DVD',
    'BOND',
    'GOLD',
    'GLOBAL',
    'WORLD'
  ];

  const BUCKET_LABEL_V33 = {
    EQUITY: 'NASDAQ + S&P500 + GLOBAL + WORLD',
    INCOME: 'K-DVD + US-CVD',
    HEDGE: 'GOLD + BOND',
    PARKING: 'SOL 초단기채 + 연금계좌 현금'
  };

  const MARKET_DASHBOARD_V33 = [
    { key: 'NASDAQ', label: 'NASDAQ', aliases: ['NASDAQ', 'IDX-NASDAQ'] },
    { key: 'SP500', label: 'S&P 500', aliases: ['SP500', 'S&P500', 'IDX-SP500'] },
    { key: 'DOW', label: 'DOW JONES', aliases: ['DOW', 'DOW JONES', 'IDX-DOW'] },
    { key: 'KOSPI', label: 'KOSPI', aliases: ['KOSPI', 'IDX-KOSPI'] },
    { key: 'FEAR_GREED', label: 'Fear & Greed', aliases: ['FEAR_GREED', 'FEAR&GREED', 'FNG'], type: 'fear' },
    { key: 'VIX', label: 'CBOE VIX', aliases: ['VIX', 'IDX-VIX'] },
    { key: 'VKOSPI', label: 'VKOSPI', aliases: ['VKOSPI', 'IDX-VKOSPI'], pending: true },
    { key: 'DXY', label: 'DXY', aliases: ['DXY'] },
    { key: 'USDKRW', label: 'USD/KRW', aliases: ['USDKRW', 'USD/KRW'] },
    { key: 'JPYKRW', label: 'JPY/KRW', aliases: ['JPYKRW', 'JPY/KRW'] },
    { key: 'GOLD_KR', label: '국내 금', aliases: ['GOLD_KR', 'KR_GOLD', 'KRGOLD'], pending: true, suffix: '원/g' },
    { key: 'GOLD_INTL', label: '국제 금', aliases: ['GOLD_INTL', 'INTL_GOLD', 'GOLD_KRW_G'], pending: true, suffix: '원/g' }
  ];

  function numV33(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function pickNumV33(obj, keys, fallback = null) {
    if (!obj || typeof obj !== 'object') return fallback;

    for (const key of keys) {
      const value = obj[key];

      if (
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {
        const n = Number(value);
        if (Number.isFinite(n)) return n;
      }
    }

    return fallback;
  }

  function pctFractionV33(value, digits = 2) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 'n/a';

    const p = n * 100;

    return (
      `${p > 0 ? '+' : ''}` +
      `${p.toFixed(digits)}%`
    );
  }

  function pctNumberV33(value, digits = 2) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 'n/a';

    return (
      `${n > 0 ? '+' : ''}` +
      `${n.toFixed(digits)}%`
    );
  }

  function weightPctV33(value, digits = 2) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 'n/a';

    return `${(n * 100).toFixed(digits)}%`;
  }

  function toManLikelyV33(value) {
    const n = Number(value);

    if (!Number.isFinite(n)) return null;

    // Growth 계열 값은 만원 단위,
    // account summary는 KRW 단위일 수 있으므로 정규화.
    return (
      Math.abs(n) >= 10000000
        ? n / 10000
        : n
    );
  }

  function formatManV33(value) {
    const n = Number(value);

    if (!Number.isFinite(n)) return '-';

    if (Math.abs(n) >= 10000) {
      return `${(n / 10000).toFixed(2)}억`;
    }

    return (
      `${Math.round(n).toLocaleString('ko-KR')}만원`
    );
  }

  function formatKrwV33(value) {
    const n = Number(value);

    if (!Number.isFinite(n)) return '-';

    if (Math.abs(n) >= 100000000) {
      return `${(n / 100000000).toFixed(2)}억`;
    }

    return (
      `${Math.round(n / 10000).toLocaleString('ko-KR')}만원`
    );
  }

  function financialSnapshotV33() {
    let raw = null;

    try {
      if (typeof netSummary === 'function') {
        raw = netSummary();
      }
    } catch (e) {
      console.warn(
        '[v33] netSummary unavailable',
        e
      );
    }

    const total =
      toManLikelyV33(
        pickNumV33(
          raw,
          [
            'totalValue',
            'total',
            'value',
            'financialValue'
          ],
          null
        )
      );

    const investment =
      toManLikelyV33(
        pickNumV33(
          raw,
          [
            'investmentValue',
            'investment',
            'investValue',
            'invest'
          ],
          null
        )
      );

    const legacy =
      toManLikelyV33(
        pickNumV33(
          raw,
          [
            'legacyValue',
            'legacy',
            'samsungValue',
            'samsungPrefValue'
          ],
          null
        )
      );

    const explicitCash =
      toManLikelyV33(
        pickNumV33(
          raw,
          [
            'cashValue',
            'cash',
            'cashAssetValue',
            'depositValue'
          ],
          null
        )
      );

    let resolvedInvestment = investment;
    let resolvedTotal = total;
    let resolvedLegacy = legacy;

    if (resolvedInvestment == null) {
      try {
        const s =
          aggregateSummary(
            INVESTMENT_IDS
          );

        const krw =
          pickNumV33(
            s,
            [
              'value',
              'evaluation',
              'eval'
            ],
            0
          );

        resolvedInvestment =
          krw / 10000;

      } catch (e) {
        resolvedInvestment = 0;
      }
    }

    if (resolvedLegacy == null) {
      resolvedLegacy = 0;
    }

    let cash =
      explicitCash;

    if (
      cash == null &&
      resolvedTotal != null
    ) {
      cash =
        resolvedTotal -
        resolvedInvestment -
        resolvedLegacy;
    }

    if (cash == null) {
      cash = 0;
    }

    if (resolvedTotal == null) {
      resolvedTotal =
        resolvedInvestment +
        cash +
        resolvedLegacy;
    }

    return {
      total: resolvedTotal,
      investment: resolvedInvestment,
      cash,
      legacy: resolvedLegacy
    };
  }

  function donutGeometryV33(snapshot) {
    const parts = [
      {
        key: 'investment',
        label: '투자계좌',
        value:
          Math.max(
            0,
            numV33(
              snapshot.investment
            )
          )
      },

      {
        key: 'cash',
        label: '예금성 자금',
        value:
          Math.max(
            0,
            numV33(
              snapshot.cash
            )
          )
      },

      {
        key: 'legacy',
        label: '삼성전자우',
        value:
          Math.max(
            0,
            numV33(
              snapshot.legacy
            )
          )
      }
    ];

    const sum =
      parts.reduce(
        (s, x) =>
          s + x.value,
        0
      ) || 1;

    let offset = 0;

    return parts.map(
      (part, index) => {
        const ratio =
          part.value / sum;

        const length =
          ratio * 100;

        const row = {
          ...part,
          ratio,
          index,
          dash:
            `${length} ${100 - length}`,
          offset:
            -offset
        };

        offset += length;

        return row;
      }
    );
  }

  function financialOverviewV33() {
    const s =
      financialSnapshotV33();

    const donut =
      donutGeometryV33(s);

    const cards = [
      [
        '전체 금융자산',
        s.total,
        1
      ],

      [
        '투자계좌',
        s.investment,
        s.total
          ? s.investment / s.total
          : 0
      ],

      [
        '예금성 자금',
        s.cash,
        s.total
          ? s.cash / s.total
          : 0
      ],

      [
        '삼성전자우',
        s.legacy,
        s.total
          ? s.legacy / s.total
          : 0
      ]
    ];

    const cardHtml =
      cards.map(
        (
          [
            label,
            value,
            ratio
          ],
          index
        ) => `
          <div
            class="v33-overview-kpi ${
              index === 0
                ? 'total'
                : ''
            }"
          >
            <div
              class="v33-overview-kpi-label"
            >
              ${esc(label)}
            </div>

            <div
              class="v33-overview-kpi-value"
            >
              ${formatManV33(value)}
            </div>

            <div
              class="v33-overview-kpi-sub"
            >
              ${
                index === 0
                  ? '현재 금융자산 합계'
                  : `전체의 ${
                      (
                        ratio * 100
                      ).toFixed(1)
                    }%`
              }
            </div>
          </div>
        `
      )
      .join('');

    const circles =
      donut.map(
        part => `
          <circle
            class="v33-donut-segment seg-${part.index}"
            cx="60"
            cy="60"
            r="48"
            pathLength="100"
            stroke-dasharray="${part.dash}"
            stroke-dashoffset="${part.offset}"
          ></circle>
        `
      )
      .join('');

    const legend =
      donut.map(
        part => `
          <div
            class="v33-donut-legend-row"
          >
            <span
              class="v33-donut-dot seg-${part.index}"
            ></span>

            <span
              class="v33-donut-legend-name"
            >
              ${esc(part.label)}
            </span>

            <b>
              ${formatManV33(
                part.value
              )}
            </b>

            <span>
              ${
                (
                  part.ratio * 100
                ).toFixed(1)
              }%
            </span>
          </div>
        `
      )
      .join('');

    return `
      <section class="v33-section">

        <div
          class="v33-section-heading"
        >
          <div>
            <h2>
              Financial Assets
            </h2>

            <p>
              내 자산은 얼마이고,
              크게 어디에 있나?
            </p>
          </div>
        </div>


        <div
          class="v33-overview-kpi-grid"
        >
          ${cardHtml}
        </div>


        <div
          class="v33-financial-chart-card"
        >

          <div
            class="v33-donut-wrap"
          >

            <svg
              class="v33-donut"
              viewBox="0 0 120 120"
              role="img"
              aria-label="전체 금융자산 구성"
            >

              <circle
                class="v33-donut-track"
                cx="60"
                cy="60"
                r="48"
              ></circle>

              ${circles}

            </svg>


            <div
              class="v33-donut-center"
            >
              <span>
                전체 금융자산
              </span>

              <strong>
                ${formatManV33(
                  s.total
                )}
              </strong>
            </div>

          </div>


          <div
            class="v33-donut-legend"
          >
            ${legend}
          </div>

        </div>

      </section>
    `;
  }

  function performanceOverviewV33() {
    let rows = [];

    try {
      rows =
        performanceRows();

    } catch (e) {
      console.error(
        '[v33] performance rows failed',
        e
      );
    }

    const byScope =
      Object.fromEntries(
        rows.map(
          row => [
            row.scope,
            row
          ]
        )
      );

    const pension =
      byScope['연금합산'] || {};

    const total =
      byScope.Total || {};

    const cards = [
      [
        '연금합산 26 YTD',
        pension.y26
      ],

      [
        '연금합산 SI CAGR',
        pension.cagr
      ],

      [
        'Total 26 YTD',
        total.y26
      ],

      [
        'Total SI CAGR',
        total.cagr
      ]
    ];

    const cardHtml =
      cards.map(
        ([label, value]) => `
          <div
            class="v33-performance-kpi"
          >
            <span>
              ${esc(label)}
            </span>

            <strong>
              ${pctNumberV33(value)}
            </strong>
          </div>
        `
      )
      .join('');

    const groups = [
      {
        key: 'PENSION_ACCOUNT',
        label: '연금 계좌'
      },

      {
        key: 'PENSION_BUCKET',
        label: '연금 자산구성'
      },

      {
        key: 'OTHER',
        label: '기타 / 전체'
      }
    ];

    const body =
      groups.map(
        group => {
          const groupRows =
            rows.filter(
              row =>
                row.group ===
                group.key
            );

          if (!groupRows.length) {
            return '';
          }

          return `
            <tr
              class="v33-performance-group"
            >
              <th colspan="6">
                ${esc(group.label)}
              </th>
            </tr>

            ${
              groupRows.map(
                row => {
                  const strong =
                    row.scope ===
                      '연금합산' ||
                    row.scope ===
                      'Total';

                  return `
                    <tr
                      class="${
                        strong
                          ? 'v33-performance-total'
                          : ''
                      }"
                    >
                      <td>
                        ${esc(row.scope)}
                      </td>

                      <td>
                        ${pctNumberV33(
                          row.y25
                        )}
                      </td>

                      <td>
                        ${pctNumberV33(
                          row.y26
                        )}
                      </td>

                      <td>
                        ${pctNumberV33(
                          row.tr
                        )}
                      </td>

                      <td>
                        ${pctNumberV33(
                          row.twr
                        )}
                      </td>

                      <td>
                        ${pctNumberV33(
                          row.cagr
                        )}
                      </td>
                    </tr>
                  `;
                }
              ).join('')
            }
          `;
        }
      )
      .join('');

    return `
      <section class="v33-section">

        <div
          class="v33-section-heading"
        >
          <div>
            <h2>
              Performance
            </h2>

            <p>
              계좌 성과와 실제 연금자산
              구성 성과를 같은 기준으로 본다.
            </p>
          </div>
        </div>


        <div
          class="v33-performance-kpi-grid"
        >
          ${cardHtml}
        </div>


        <div
          class="tableWrap v33-dashboard-table-wrap"
        >

          <table
            class="mid v33-performance-table"
          >

            <thead>
              <tr class="thead">
                <th>구분</th>
                <th>25 YTD</th>
                <th>26 YTD</th>
                <th>TR</th>
                <th>TWR</th>
                <th>CAGR</th>
              </tr>
            </thead>

            <tbody>
              ${body}
            </tbody>

          </table>

        </div>

      </section>
    `;
  }

  function coreRowsV33() {
    let source = [];

    try {
      source =
        coreAllocation();

    } catch (e) {
      console.error(
        '[v33] coreAllocation failed',
        e
      );
    }

    const byKey =
      Object.fromEntries(
        (source || [])
          .map(
            row => [
              row.key,
              row
            ]
          )
      );

    return CORE_ORDER_V33.map(
      key => {
        const row =
          byKey[key] || {};

        const target =
          CORE_TARGETS_V33[key];

        const weight =
          pickNumV33(
            row,
            [
              'weight',
              'currentWeight',
              'ratio'
            ],
            0
          );

        const low =
          target * 0.90;

        const high =
          target * 1.10;

        const relativeGap =
          target
            ? weight / target - 1
            : 0;

        const status =
          weight < low
            ? 'UNDER'
            : weight > high
              ? 'OVER'
              : 'IN';

        return {
          key,
          target,
          weight,
          low,
          high,
          relativeGap,
          status
        };
      }
    );
  }

  function statusTextV33(status) {
    if (status === 'UNDER') {
      return '매수 우선';
    }

    if (status === 'OVER') {
      return '상단 초과';
    }

    return 'Band 내';
  }

  function findMarketLiveV33(
    aliases
  ) {
    const state =
      window.marketLiveState ||
      {};

    const bySymbol =
      state.bySymbol || {};

    const byCode =
      state.byCode || {};

    for (const alias of aliases) {
      if (bySymbol[alias]) {
        return bySymbol[alias];
      }

      if (byCode[alias]) {
        return byCode[alias];
      }
    }

    const all = [
      ...Object.values(bySymbol),
      ...Object.values(byCode)
    ].filter(Boolean);

    for (const row of all) {
      const symbol =
        String(
          row.symbol || ''
        ).toUpperCase();

      const name =
        String(
          row.name || ''
        ).toUpperCase();

      const sourceSymbol =
        String(
          row.sourceSymbol ||
          row.source_symbol ||
          ''
        ).toUpperCase();

      for (const alias of aliases) {
        const needle =
          String(alias)
            .toUpperCase();

        if (
          symbol === needle ||
          sourceSymbol === needle ||
          name === needle
        ) {
          return row;
        }
      }
    }

    return null;
  }

  function todayRuleV33() {
    const rows =
      coreRowsV33();

    const under =
      rows
        .filter(
          row =>
            row.status ===
            'UNDER'
        )
        .sort(
          (a, b) =>
            a.relativeGap -
            b.relativeGap
        );

    const over =
      rows
        .filter(
          row =>
            row.status ===
            'OVER'
        )
        .sort(
          (a, b) =>
            b.relativeGap -
            a.relativeGap
        );

    const vix =
      findMarketLiveV33(
        [
          'VIX',
          'IDX-VIX'
        ]
      );

    const fear =
      findMarketLiveV33(
        [
          'FEAR_GREED',
          'FEAR&GREED',
          'FNG'
        ]
      );

    const vixValue =
      vix
        ? numV33(
            vix.current,
            NaN
          )
        : NaN;

    const fearValue =
      fear
        ? numV33(
            fear.current,
            NaN
          )
        : NaN;

    const eventNow =
      Number.isFinite(
        vixValue
      ) &&
      Number.isFinite(
        fearValue
      ) &&
      vixValue > 30 &&
      fearValue < 20;

    let primary;

    if (under.length) {
      primary = `
        <div
          class="v33-rule-result attention"
        >
          <span>
            신규자금 우선 후보
          </span>

          <strong>
            ${
              under
                .map(
                  row =>
                    esc(row.key)
                )
                .join(' · ')
            }
          </strong>

          <small>
            개별 Core의 목표 대비
            ±10% relative band 기준
          </small>
        </div>
      `;

    } else {
      primary = `
        <div
          class="v33-rule-result ok"
        >
          <span>
            Core Allocation
          </span>

          <strong>
            강제매수 대상 없음
          </strong>

          <small>
            6개 Core 자산이 모두
            목표 band 안에 있음
          </small>
        </div>
      `;
    }

    const overHtml =
      over.length
        ? `
          <div
            class="v33-rule-mini"
          >
            <span>
              상단 초과
            </span>

            <b>
              ${
                over
                  .map(
                    row =>
                      esc(row.key)
                  )
                  .join(' · ')
              }
            </b>
          </div>
        `
        : `
          <div
            class="v33-rule-mini"
          >
            <span>
              상단 초과
            </span>

            <b>
              없음
            </b>
          </div>
        `;

    const stressHtml = `
      <div
        class="v33-rule-mini ${
          eventNow
            ? 'attention'
            : ''
        }"
      >

        <span>
          Event Buy 당일 조건
        </span>

        <b>
          ${
            eventNow
              ? '충족'
              : '미충족'
          }
        </b>

        <small>
          VIX ${
            Number.isFinite(
              vixValue
            )
              ? vixValue.toFixed(2)
              : 'n/a'
          }
          ·
          F&G ${
            Number.isFinite(
              fearValue
            )
              ? fearValue.toFixed(0)
              : 'n/a'
          }
          /
          실제 실행은 3거래일 지속 조건
        </small>

      </div>
    `;

    return `
      <section class="v33-section">

        <div
          class="v33-section-heading"
        >
          <div>
            <h2>
              Today / Rule Check
            </h2>

            <p>
              시장 예측보다 정해둔
              매수 규칙을 먼저 확인한다.
            </p>
          </div>
        </div>


        <div
          class="v33-rule-grid"
        >
          ${primary}
          ${overHtml}
          ${stressHtml}
        </div>

      </section>
    `;
  }
  
    function marketValueTextV33(
    item,
    row
  ) {
    if (!row) {
      return '준비중';
    }

    const value =
      Number(
        row.current
      );

    if (!Number.isFinite(value)) {
      return 'n/a';
    }

    if (item.type === 'fear') {
      return value.toFixed(0);
    }

    if (item.suffix) {
      return (
        `${Math.round(value).toLocaleString('ko-KR')} ` +
        `${item.suffix}`
      );
    }

    if (
      Math.abs(value) >=
      1000
    ) {
      return value.toLocaleString(
        'ko-KR',
        {
          maximumFractionDigits: 2
        }
      );
    }

    return value.toFixed(2);
  }


  function marketChangeTextV33(
    item,
    row
  ) {
    if (!row) {
      return (
        item.pending
          ? '데이터 소스 준비중'
          : 'n/a'
      );
    }

    if (item.type === 'fear') {
      const previous =
        Number(
          row.previous
        );

      const current =
        Number(
          row.current
        );

      if (
        !Number.isFinite(previous) ||
        !Number.isFinite(current)
      ) {
        return '상태지표';
      }

      const delta =
        current - previous;

      return (
        `${delta > 0 ? '+' : ''}` +
        `${delta.toFixed(0)}pt`
      );
    }

    const change =
      Number(
        row.changePct
      );

    if (!Number.isFinite(change)) {
      return 'n/a';
    }

    return (
      `${change > 0 ? '+' : ''}` +
      `${change.toFixed(2)}%`
    );
  }


  function fearLabelV33(
    value
  ) {
    const n =
      Number(value);

    if (!Number.isFinite(n)) {
      return '';
    }

    if (n <= 24) {
      return 'Extreme Fear';
    }

    if (n <= 44) {
      return 'Fear';
    }

    if (n <= 55) {
      return 'Neutral';
    }

    if (n <= 74) {
      return 'Greed';
    }

    return 'Extreme Greed';
  }


  function marketDashboardV33() {
    const cards =
      MARKET_DASHBOARD_V33
        .map(
          item => {
            const row =
              findMarketLiveV33(
                item.aliases
              );

            const current =
              row
                ? Number(
                    row.current
                  )
                : NaN;

            const change =
              row
                ? Number(
                    row.changePct
                  )
                : NaN;

            const direction =
              Number.isFinite(
                change
              )
                ? (
                    change > 0
                      ? 'up'
                      : change < 0
                        ? 'down'
                        : 'flat'
                  )
                : '';

            const fearLabel =
              item.type === 'fear'
                ? fearLabelV33(
                    current
                  )
                : '';

            return `
              <div
                class="v33-market-card ${
                  row
                    ? ''
                    : 'pending'
                }"
              >

                <div
                  class="v33-market-card-label"
                >
                  ${esc(item.label)}
                </div>


                <div
                  class="v33-market-card-value"
                >
                  ${marketValueTextV33(
                    item,
                    row
                  )}
                </div>


                ${
                  fearLabel
                    ? `
                      <div
                        class="v33-market-card-state"
                      >
                        ${esc(
                          fearLabel
                        )}
                      </div>
                    `
                    : ''
                }


                <div
                  class="v33-market-card-change ${direction}"
                >
                  ${esc(
                    marketChangeTextV33(
                      item,
                      row
                    )
                  )}
                </div>


                ${
                  row
                    ? `
                      <div
                        class="v33-market-card-date"
                      >
                        ${esc(
                          row.priceDate ||
                          ''
                        )}
                      </div>
                    `
                    : ''
                }

              </div>
            `;
          }
        )
        .join('');


    return `
      <section class="v33-section">

        <div
          class="v33-section-heading"
        >
          <div>

            <h2>
              Market Dashboard
            </h2>

            <p>
              시장의 방향·변동성·환율을
              한 화면에서 확인한다.
            </p>

          </div>


          <div
            class="v33-section-action"
          >
            <button
              type="button"
              class="btn"
              onclick="refreshMarketPricesV33()"
            >
              DB 가격 다시 불러오기
            </button>
          </div>

        </div>


        <div
          class="v33-market-dashboard-grid"
        >
          ${cards}
        </div>


        <div
          class="v33-dashboard-note"
        >
          VKOSPI·국내 금·국제 금은
          market_prices에 데이터가 추가되면
          자동으로 표시됩니다.
          국채지표는 현재 범위에서 제외합니다.
        </div>

      </section>
    `;
  }


  function overviewV33() {
    return `
      <div
        class="v33-dashboard-page"
      >

        ${financialOverviewV33()}

        ${performanceOverviewV33()}

        ${todayRuleV33()}

        ${marketDashboardV33()}

      </div>
    `;
  }


  function sleeveAllocationV33() {
    let sleeves = [];

    try {
      sleeves =
        coreSleeveAllocationV33();

    } catch (e) {
      console.error(
        '[v33] sleeve allocation failed',
        e
      );
    }


    return sleeves.map(
      sleeve => {

        const weight =
          numV33(
            sleeve.weight
          );

        const target =
          numV33(
            sleeve.target
          );

        const gap =
          weight - target;


        return `
          <div
            class="v33-sleeve-card"
          >

            <div
              class="v33-sleeve-top"
            >
              <strong>
                ${esc(
                  sleeve.key
                )}
              </strong>

              <span>
                목표
                ${weightPctV33(
                  target
                )}
              </span>
            </div>


            <div
              class="v33-sleeve-composition"
            >
              ${esc(
                sleeve.label
              )}
            </div>


            <div
              class="v33-sleeve-value"
            >
              ${weightPctV33(
                weight
              )}
            </div>


            <div
              class="v33-sleeve-gap ${
                gap > 0
                  ? 'over'
                  : gap < 0
                    ? 'under'
                    : ''
              }"
            >
              목표 대비
              ${
                gap > 0
                  ? '+'
                  : ''
              }${
                (
                  gap * 100
                ).toFixed(2)
              }%p
            </div>

          </div>
        `;
      }
    ).join('');
  }


  function coreAllocationSectionV33() {
    const rows =
      coreRowsV33();


    const body =
      rows.map(
        row => `
          <tr>

            <td>
              <b>
                ${esc(
                  row.key
                )}
              </b>
            </td>

            <td>
              ${weightPctV33(
                row.target
              )}
            </td>

            <td>
              ${weightPctV33(
                row.weight
              )}
            </td>

            <td>
              ${pctNumberV33(
                row.relativeGap *
                100
              )}
            </td>

            <td>
              ${weightPctV33(
                row.low
              )}
            </td>

            <td>
              ${weightPctV33(
                row.high
              )}
            </td>

            <td>
              <span
                class="v33-band-pill ${
                  row.status.toLowerCase()
                }"
              >
                ${esc(
                  statusTextV33(
                    row.status
                  )
                )}
              </span>
            </td>

          </tr>
        `
      )
      .join('');


    return `
      <section class="v33-section">

        <div
          class="v33-section-heading"
        >
          <div>

            <h2>
              Core Allocation
            </h2>

            <p>
              “신규자금을 어디에 넣을까?”
              목표비중과 Band를 이용하는
              신규자금 배분 참고자료.
            </p>

          </div>
        </div>


        <div
          class="v33-allocation-core-grid"
        >

          <div>

            <h3>
              목표 대비
            </h3>


            <div
              class="tableWrap v33-dashboard-table-wrap"
            >

              <table
                class="mid v33-core-table"
              >

                <thead>

                  <tr class="thead">
                    <th>자산</th>
                    <th>목표</th>
                    <th>현재</th>
                    <th>상대괴리</th>
                    <th>하단</th>
                    <th>상단</th>
                    <th>Band</th>
                  </tr>

                </thead>


                <tbody>
                  ${body}
                </tbody>

              </table>

            </div>

          </div>


          <div>

            <h3>
              Sleeve Allocation
            </h3>


            <div
              class="v33-sleeve-grid"
            >
              ${sleeveAllocationV33()}
            </div>


            <div
              class="v33-dashboard-note"
            >
              역할이 같은 Core 자산을
              Sleeve로 묶어
              EQUITY 50% /
              INCOME 25% /
              HEDGE 25%를
              상위 목표로 확인합니다.

              개별 Core의 실제 매수 판단은
              왼쪽 목표 대비 Band를
              우선 사용합니다.
            </div>

          </div>

        </div>

      </section>
    `;
  }


  function exposureDetailV33() {
    let pm;

    try {
      pm =
        pensionMetrics();

    } catch (e) {

      console.error(
        '[v33] pension detail failed',
        e
      );

      return '';
    }


    const details =
      pm.details || {};


    const total =
      details.TOTAL || {};


    const totalValue =
      numV33(
        total.value
      );


    const body =
      EXPOSURE_DETAIL_ORDER_V33
        .map(
          key => {
            const x =
              details[key] ||
              {};

            const weight =
              totalValue
                ? numV33(
                    x.value
                  ) /
                  totalValue
                : 0;


            return `
              <tr>

                <td>
                  <b>
                    ${esc(key)}
                  </b>
                </td>

                <td>
                  ${formatKrwV33(
                    x.buy
                  )}
                </td>

                <td>
                  ${formatKrwV33(
                    x.value
                  )}
                </td>

                <td>
                  ${formatKrwV33(
                    x.ytdPnl
                  )}
                </td>

                <td>
                  ${pctFractionV33(
                    x.ytd
                  )}
                </td>

                <td>
                  ${formatKrwV33(
                    x.cumPnl
                  )}
                </td>

                <td>
                  ${pctFractionV33(
                    x.tr
                  )}
                </td>

                <td>
                  ${weightPctV33(
                    weight
                  )}
                </td>

              </tr>
            `;
          }
        )
        .join('');


    return `
      <div
        class="v33-exposure-detail"
      >

        <h3>
          Exposure Detail
        </h3>

        <p
          class="v33-subcopy"
        >
          “그 노출은 어떤 자산에서 왔나?”
        </p>


        <div
          class="tableWrap v33-dashboard-table-wrap"
        >

          <table
            class="mid v33-exposure-detail-table"
          >

            <thead>

              <tr class="thead">
                <th>자산</th>
                <th>매수액</th>
                <th>평가액</th>
                <th>26 손익</th>
                <th>YTD 26</th>
                <th>누적손익</th>
                <th>TR</th>
                <th>비중</th>
              </tr>

            </thead>


            <tbody>

              ${body}


              <tr
                class="v33-performance-total"
              >

                <td>
                  <b>Sum</b>
                </td>

                <td>
                  ${formatKrwV33(
                    total.buy
                  )}
                </td>

                <td>
                  ${formatKrwV33(
                    total.value
                  )}
                </td>

                <td>
                  ${formatKrwV33(
                    total.ytdPnl
                  )}
                </td>

                <td>
                  ${pctFractionV33(
                    total.ytd
                  )}
                </td>

                <td>
                  ${formatKrwV33(
                    total.cumPnl
                  )}
                </td>

                <td>
                  ${pctFractionV33(
                    total.tr
                  )}
                </td>

                <td>
                  100.00%
                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>
    `;
  }


  function portfolioExposureV33() {
    let pm;

    try {
      pm =
        pensionBucketMetricsV33();

    } catch (e) {

      console.error(
        '[v33] pension exposure failed',
        e
      );

      return '';
    }


    const buckets =
      pm.buckets || {};


    const total =
      pm.total || {};


    const totalValue =
      numV33(
        total.value
      );


    const rows =
      [
        'EQUITY',
        'INCOME',
        'HEDGE',
        'PARKING'
      ];


    const body =
      rows.map(
        key => {
          const x =
            buckets[key] ||
            {};

          const weight =
            totalValue
              ? numV33(
                  x.value
                ) /
                totalValue
              : 0;


          return `
            <tr>

              <td>

                <b>
                  ${esc(key)}
                </b>

                <div class="small">
                  ${esc(
                    BUCKET_LABEL_V33[
                      key
                    ] ||
                    ''
                  )}
                </div>

              </td>

              <td>
                ${formatKrwV33(
                  x.buy
                )}
              </td>

              <td>
                ${formatKrwV33(
                  x.value
                )}
              </td>

              <td>
                ${formatKrwV33(
                  x.ytdPnl
                )}
              </td>

              <td>
                ${pctFractionV33(
                  x.ytd
                )}
              </td>

              <td>
                ${formatKrwV33(
                  x.cumPnl
                )}
              </td>

              <td>
                ${pctFractionV33(
                  x.tr
                )}
              </td>

              <td>
                ${weightPctV33(
                  weight
                )}
              </td>

            </tr>
          `;
        }
      )
      .join('');


    const bars =
      rows.map(
        (
          key,
          index
        ) => {
          const x =
            buckets[key] ||
            {};

          const weight =
            totalValue
              ? numV33(
                  x.value
                ) /
                totalValue
              : 0;


          return `
            <div
              class="v33-exposure-bar-row"
            >

              <span>
                ${esc(key)}
              </span>

              <div
                class="v33-exposure-bar-track"
              >
                <i
                  class="bar-${index}"
                  style="width:${
                    Math.max(
                      0,
                      Math.min(
                        100,
                        weight * 100
                      )
                    )
                  }%"
                ></i>
              </div>

              <b>
                ${weightPctV33(
                  weight
                )}
              </b>

            </div>
          `;
        }
      )
      .join('');


    return `
      <section class="v33-section">

        <div
          class="v33-section-heading"
        >
          <div>

            <h2>
              Portfolio Exposure
            </h2>

            <p>
              “내 돈이 실제 어디에 노출되어 있나?”
              현재 연금자산의 경제적 노출을
              역할별로 묶어 본다.
            </p>

          </div>
        </div>


        <div
          class="v33-exposure-grid"
        >

          <div
            class="tableWrap v33-dashboard-table-wrap"
          >

            <table
              class="mid v33-exposure-table"
            >

              <thead>

                <tr class="thead">
                  <th>구분</th>
                  <th>매수액</th>
                  <th>평가액</th>
                  <th>26 손익</th>
                  <th>YTD 26</th>
                  <th>누적손익</th>
                  <th>TR</th>
                  <th>비중</th>
                </tr>

              </thead>


              <tbody>

                ${body}


                <tr
                  class="v33-performance-total"
                >

                  <td>
                    <b>Sum</b>
                  </td>

                  <td>
                    ${formatKrwV33(
                      total.buy
                    )}
                  </td>

                  <td>
                    ${formatKrwV33(
                      total.value
                    )}
                  </td>

                  <td>
                    ${formatKrwV33(
                      total.ytdPnl
                    )}
                  </td>

                  <td>
                    ${pctFractionV33(
                      total.ytd
                    )}
                  </td>

                  <td>
                    ${formatKrwV33(
                      total.cumPnl
                    )}
                  </td>

                  <td>
                    ${pctFractionV33(
                      total.tr
                    )}
                  </td>

                  <td>
                    100.00%
                  </td>

                </tr>

              </tbody>

            </table>

          </div>


          <div
            class="v33-exposure-bars-card"
          >

            <h3>
              Exposure Mix
            </h3>

            ${bars}


            <div
              class="v33-dashboard-note"
            >
              Core EQUITY Sleeve는
              NASDAQ + S&P500만 포함하지만,
              Portfolio EQUITY Exposure에는
              GLOBAL + WORLD도 포함합니다.
            </div>

          </div>

        </div>


        ${exposureDetailV33()}

      </section>
    `;
  }


  function allocationV33() {
    return `
      <div
        class="v33-dashboard-page"
      >

        ${coreAllocationSectionV33()}

        ${portfolioExposureV33()}

      </div>
    `;
  }


  window.overviewV33 =
    overviewV33;

  window.allocationV33 =
    allocationV33;


  try {

    if (
      typeof views !==
        'undefined' &&
      views &&
      typeof views ===
        'object'
    ) {

      views.Overview =
        overviewV33;

      views.Allocation =
        allocationV33;
    }

  } catch (e) {

    console.warn(
      '[v33] dashboard view registry patch failed',
      e
    );
  }


  console.info(
    '[Portfolio Control] v3.3 Dashboard loaded'
  );

})();
