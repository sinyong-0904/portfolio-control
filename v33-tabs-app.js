// Portfolio Control v3.3 - Final information architecture
// 8 tabs + merged Growth/Dividend + Cash/Funding
// + Simulation + History
//
// Load LAST after existing v33 scripts.

(function () {

  const MONTHS_V33 = [
    'JAN','FEB','MAR','APR',
    'MAY','JUN','JUL','AUG',
    'SEP','OCT','NOV','DEC'
  ];


  const FINAL_TAB_ORDER_V33 = [
    'Overview',
    'Allocation',
    '시장가격',
    '계좌·보유',
    'Growth & 배당',
    '자금관리',
    'History',
    'Strategy'
  ];


  //
  // 기존 view 함수는 그대로 보존해서
  // 새 통합 탭에서 재사용한다.
  //

  const originalViewsV33 = {

    Overview:
      views?.Overview,

    Allocation:
      views?.Allocation,

    market:
      views?.['시장가격'],

    accounts:
      views?.['계좌·보유'],

    growth:
      views?.Growth,

    dividend:
      views?.['배당'],

    cash:
      views?.['예금성 자금'],

    funding:
      views?.['자금흐름'] ||
      views?.['연간투입'] ||
      views?.['추가투입'],

    strategy:
      views?.Strategy
  };


  //
  // ============================================================
  // 2025 Frozen History
  // ============================================================
  //
  // 현재 mapping / 현재 가격으로
  // 절대 재계산하지 않는 역사적 snapshot.
  //

  const HISTORY_2025_V33 =
    window.HISTORY_2025_V33;

  //
  // ============================================================
  // Income & Tax
  // ============================================================
  //

  const INCOME_TAX_ROWS_V33 =
    window.INCOME_TAX_ROWS_V33;


  function cloneV33(x) {

    return JSON.parse(
      JSON.stringify(x)
    );
  }


  //
  // ============================================================
  // Data initialization
  // ============================================================
  //

  function ensureTabsDataV33() {

    let changed = false;


    if (
      !data.history ||
      typeof data.history !==
        'object'
    ) {

      data.history = {};

      changed = true;
    }


    if (
      !data.history.years ||
      typeof data.history.years !==
        'object'
    ) {

      data.history.years = {};

      changed = true;
    }


    if (
      !data.history
        .years['2025']
    ) {

      data.history
        .years['2025'] =
        cloneV33(
          HISTORY_2025_V33
        );

      changed = true;
    }


    if (
      !data.history
        .selectedYear
    ) {

      data.history
        .selectedYear = 2025;

      changed = true;
    }


    if (
      !data.incomeTaxHistory ||
      typeof data.incomeTaxHistory !==
        'object'
    ) {

      data.incomeTaxHistory = {};

      changed = true;
    }


    if (
      !Array.isArray(
        data.incomeTaxHistory.rows
      ) ||
      data.incomeTaxHistory
        .rows.length === 0
    ) {

      data.incomeTaxHistory.rows =
        INCOME_TAX_ROWS_V33
          .map(
            r => ({
              year: r[0],
              salary: r[1],
              tax: r[2],
              deduction: r[3],
              net: r[4],
              withheld: r[5],
              change: r[6],
              taxRate: r[7],
              finalTax: r[8]
            })
          );

      changed = true;
    }


    if (
      !data.incomeTaxHistory.notes ||
      typeof data.incomeTaxHistory
        .notes !== 'object' ||
      Array.isArray(
        data.incomeTaxHistory.notes
      )
    ) {

      data.incomeTaxHistory.notes =
        cloneV33(
          window.INCOME_TAX_NOTES_V33 ||
          {}
        );

      changed = true;
    }


    if (
      !data.simulation ||
      typeof data.simulation !==
        'object'
    ) {

      data.simulation = {};

      changed = true;
    }


    if (
      !Number.isFinite(
        Number(
          data.simulation
            .annualContributionMan
        )
      )
    ) {

      data.simulation
        .annualContributionMan =
        5000;

      changed = true;
    }


    if (
      !Number.isFinite(
        Number(
          data.simulation
            .horizonYears
        )
      )
    ) {

      data.simulation
        .horizonYears =
        12;

      changed = true;
    }


    if (
      !Array.isArray(
        data.simulation.rates
      ) ||
      data.simulation
        .rates.length !== 4
    ) {

      data.simulation.rates = [
        0.05,
        0.08,
        0.10,
        0.12
      ];

      changed = true;
    }


    if (
      !Number.isFinite(
        Number(
          data.simulation
            .baseEventRate
        )
      )
    ) {

      data.simulation
        .baseEventRate =
        0.08;

      changed = true;
    }


    if (
      !data.simulation.events ||
      typeof data.simulation
        .events !== 'object'
    ) {

      data.simulation.events = {};

      changed = true;
    }


    if (changed) {

      localStorage.setItem(
        KEY,
        JSON.stringify(data)
      );
    }


    return changed;
  }


  //
  // ============================================================
  // Existing view reuse
  // ============================================================
  //

  function renderOldViewV33(
    fn,
    fallback
  ) {

    try {

      return (
        typeof fn === 'function'

          ? fn()

          : `
            <div class="notice">
              ${esc(fallback)}
              화면을 찾지 못했습니다.
            </div>
          `
      );

    } catch (e) {

      console.error(
        '[v33] old view render failed',
        fallback,
        e
      );


      return `
        <div class="notice">
          ${esc(fallback)}
          화면 렌더링 중 오류가 발생했습니다.
        </div>
      `;
    }
  }


  function sectionWrapV33(
    title,
    subtitle,
    html
  ) {

    return `
      <section
        class="v33-merged-section"
      >

        <div
          class="v33-merged-heading"
        >

          <div>

            <h2>
              ${esc(title)}
            </h2>

            ${
              subtitle
                ? `
                  <p>
                    ${esc(subtitle)}
                  </p>
                `
                : ''
            }

          </div>

        </div>


        <div
          class="v33-merged-body"
        >
          ${html}
        </div>

      </section>
    `;
  }


  //
  // ============================================================
  // Growth & Dividend
  // ============================================================
  //

  function growthDividendViewV33() {

    return `
      <div
        class="v33-merged-page"
      >

        ${sectionWrapV33(
          'Growth',
          '월별 금융자산 증감과 현재 LIVE 상태',
          renderOldViewV33(
            originalViewsV33.growth,
            'Growth'
          )
        )}


        ${sectionWrapV33(
          '배당',
          '월별 배당과 계좌별 배당 흐름',
          renderOldViewV33(
            originalViewsV33.dividend,
            '배당'
          )
        )}

      </div>
    `;
  }


  //
  // ============================================================
  // Simulation
  // ============================================================
  //

  function accountValueKrwSafeV33(
    id
  ) {

    try {

      if (
        typeof accountValue ===
        'function'
      ) {

        const v =
          Number(
            accountValue(id)
          );


        if (
          Number.isFinite(v)
        ) {
          return v;
        }
      }

    } catch (e) {}


    try {

      const s =
        typeof accountSummary ===
          'function'

          ? accountSummary(id)

          : null;


      for (
        const key of [
          'value',
          'totalValue',
          'marketValue',
          'evaluation',
          'eval'
        ]
      ) {

        const v =
          Number(
            s?.[key]
          );


        if (
          Number.isFinite(v)
        ) {
          return v;
        }
      }

    } catch (e) {}


    return 0;
  }


  function simulationStartManV33() {

    return [
      'DC',
      'P1',
      'P2',
      'ISA'
    ]
      .reduce(
        (
          sum,
          id
        ) =>
          sum +
          accountValueKrwSafeV33(
            id
          ),
        0
      ) /
      10000;
  }


  function moneyManV33(v) {

    if (
      typeof window
        .formatEokManV33 ===
        'function'
    ) {

      return window
        .formatEokManV33(v);
    }


    const n =
      Math.round(
        Number(v) || 0
      );


    const eok =
      Math.floor(
        Math.abs(n) /
        10000
      );


    const man =
      Math.abs(n) %
      10000;


    return (
      `${n < 0 ? '-' : ''}` +

      (
        eok

          ? (
              `${eok}억` +
              (
                man
                  ? ` ${man.toLocaleString('ko-KR')}만원`
                  : ''
              )
            )

          : `${man.toLocaleString('ko-KR')}만원`
      )
    );
  }


  function buildSimulationV33() {

    const startYear =
      new Date()
        .getFullYear();


    const horizon =
      Math.max(
        1,
        Math.min(
          30,
          Number(
            data.simulation
              .horizonYears
          ) || 12
        )
      );


    const contribution =
      Math.max(
        0,
        Number(
          data.simulation
            .annualContributionMan
        ) || 0
      );


    const start =
      simulationStartManV33();


    const rates =
      data.simulation
        .rates
        .map(Number);


    const results = [];


    const prev =
      rates.map(
        () => start
      );


    let eventPrev =
      start;


    for (
      let i = 0;
      i < horizon;
      i++
    ) {

      const year =
        startYear + i;


      //
      // 현재 평가액을 투입기준의 시작으로 사용.
      //

      const principal =
        start +
        contribution * i;


      const values =
        rates.map(
          (
            rate,
            j
          ) => {

            const before =
              i === 0

                ? prev[j]

                : (
                    prev[j] +
                    contribution
                  );


            const out =
              before *
              (
                1 +
                rate
              );


            prev[j] =
              out;


            return out;
          }
        );


      const shock =
        Number(
          data.simulation
            .events?.[year] ||
          0
        );


      const eventBefore =
        i === 0

          ? eventPrev

          : (
              eventPrev +
              contribution
            );


      //
      // Event:
      // 기본 8%에 shock을 %p로 가감.
      //
      // -15 -> 8 - 15 = -7%
      //

      const effective =
        Math.max(
          -0.99,

          Number(
            data.simulation
              .baseEventRate ||
            0.08
          ) +
          shock / 100
        );


      eventPrev =
        eventBefore *
        (
          1 +
          effective
        );


      results.push({

        year,

        principal,

        values,

        shock,

        eventValue:
          eventPrev,

        effective
      });
    }


    return {

      startYear,

      horizon,

      contribution,

      start,

      rates,

      results
    };
  }


  function simulationChartV33(
    sim
  ) {

    const W = 760;
    const H = 300;

    const L = 52;
    const R = 18;
    const T = 20;
    const B = 42;


    const series =
      sim.rates.map(
        (
          rate,
          j
        ) => ({

          key:
            `r${j}`,

          label:
            `${Math.round(
              rate * 100
            )}%`,

          values:
            sim.results.map(
              x =>
                x.values[j]
            )
        })
      );


    series.push({

      key:
        'event',

      label:
        'Event',

      values:
        sim.results.map(
          x =>
            x.eventValue
        )
    });


    const all =
      series.flatMap(
        s => s.values
      );


    const min =
      Math.min(
        ...all,
        sim.start
      ) * 0.94;


    const max =
      Math.max(
        ...all,
        sim.start
      ) * 1.04;


    const range =
      Math.max(
        1,
        max - min
      );


    const x =
      i =>
        L +
        (
          sim.results.length <= 1
            ? 0
            : i *
              (
                W - L - R
              ) /
              (
                sim.results.length -
                1
              )
        );


    const y =
      v =>
        T +
        (
          max - v
        ) *
        (
          H - T - B
        ) /
        range;


    const paths =
      series.map(
        s => {

          const d =
            s.values
              .map(
                (
                  v,
                  i
                ) =>
                  `${
                    i ? 'L' : 'M'
                  } ${
                    x(i).toFixed(1)
                  } ${
                    y(v).toFixed(1)
                  }`
              )
              .join(' ');


          return `
            <path
              class="v33-sim-line ${s.key}"
              d="${d}"
            />
          `;
        }
      )
      .join('');


    const eventMarks =
      sim.results.map(
        (
          r,
          i
        ) => {

          if (!r.shock) {
            return '';
          }


          return `
            <circle
              class="v33-sim-event-dot"
              cx="${x(i)}"
              cy="${y(
                r.eventValue
              )}"
              r="4"
            >
              <title>
                ${r.year}:
                Event
                ${
                  r.shock > 0
                    ? '+'
                    : ''
                }${r.shock}%
              </title>
            </circle>
          `;
        }
      )
      .join('');


    const xlabels =
      sim.results.map(
        (
          r,
          i
        ) => {

          if (
            i !== 0 &&
            i !==
              sim.results.length -
              1 &&
            i % 2 !== 0
          ) {
            return '';
          }


          return `
            <text
              x="${x(i)}"
              y="${H - 13}"
              text-anchor="middle"
            >
              ${r.year}
            </text>
          `;
        }
      )
      .join('');


    const grid =
      [
        0,
        0.25,
        0.5,
        0.75,
        1
      ]
        .map(
          p => {

            const val =
              max -
              range * p;


            const yy =
              y(val);


            return `
              <line
                x1="${L}"
                y1="${yy}"
                x2="${W - R}"
                y2="${yy}"
              />

              <text
                x="${L - 7}"
                y="${yy + 4}"
                text-anchor="end"
              >
                ${(val / 10000)
                  .toFixed(1)}억
              </text>
            `;
          }
        )
        .join('');


    return `
      <div
        class="v33-sim-chart-card"
      >

        <svg
          class="v33-sim-chart"
          viewBox="0 0 ${W} ${H}"
          role="img"
          aria-label="Annual Growth 시뮬레이션 그래프"
        >

          <g class="grid">
            ${grid}
          </g>

          ${paths}

          ${eventMarks}

          <g class="axis-labels">
            ${xlabels}
          </g>

        </svg>


        <div
          class="v33-sim-legend"
        >

          ${
            series.map(
              s => `
                <span
                  class="${s.key}"
                >
                  <i></i>
                  ${s.label}
                </span>
              `
            ).join('')
          }

        </div>

      </div>
    `;
  }


  function simulationViewV33() {

    const sim =
      buildSimulationV33();


    const rows =
      sim.results.map(
        r => `
          <tr>

            <td>
              ${r.year}
            </td>


            <td>
              <b>
                ${moneyManV33(
                  r.principal
                )}
              </b>
            </td>


            ${
              r.values.map(
                (
                  v,
                  j
                ) => `
                  <td
                    class="${
                      j === 1
                        ? 'v33-sim-target'
                        : ''
                    }"
                  >
                    ${moneyManV33(v)}
                  </td>
                `
              ).join('')
            }


            <td>

              <input
                class="v33-event-input"
                type="number"
                step="1"
                value="${
                  r.shock || ''
                }"
                placeholder="0"
                onchange="simulationEventChangeV33(${r.year},this.value)"
              >

              %

            </td>


            <td
              class="v33-sim-event-value"
            >

              <b>
                ${moneyManV33(
                  r.eventValue
                )}
              </b>

              <div class="small">
                실효
                ${
                  (
                    r.effective *
                    100
                  ).toFixed(1)
                }%
              </div>

            </td>

          </tr>
        `
      )
      .join('');


    const last =
      sim.results[
        sim.results.length -
        1
      ];


    return `
      <div
        class="v33-simulation"
      >

        <div
          class="v33-sim-controls"
        >

          <div>

            <span>
              시작자산
            </span>

            <strong>
              ${moneyManV33(
                sim.start
              )}
            </strong>

            <small>
              DC + 개인연금1 +
              개인연금2 + ISA
              현재 평가액
            </small>

          </div>


          <label>

            <span>
              연초 추가투입
            </span>

            <input
              type="number"
              step="100"
              value="${sim.contribution}"
              onchange="simulationSettingChangeV33('annualContributionMan',this.value)"
            >

            <small>
              만원/년
            </small>

          </label>


          <label>

            <span>
              예측기간
            </span>

            <input
              type="number"
              min="1"
              max="30"
              value="${sim.horizon}"
              onchange="simulationSettingChangeV33('horizonYears',this.value)"
            >

            <small>
              년
            </small>

          </label>


          <div>

            <span>
              Event 기본
            </span>

            <strong>
              8%
            </strong>

            <small>
              각 연도 Event 값은
              8%에 ±%p로 적용
            </small>

          </div>

        </div>


        <div class="notice">

          예:
          Event에 -15 입력 →

          그 해 Event 시나리오
          수익률은

          8% - 15%p = -7%.

          충격은 해당 연도에만
          적용되고 다음 해에는
          다시 기본 8%로 복귀합니다.

        </div>


        <div class="tableWrap">

          <table
            class="mid v33-simulation-table"
          >

            <thead>

              <tr class="thead">

                <th>
                  연도
                </th>

                <th>
                  누적 투입기준
                </th>

                <th>
                  5%
                </th>

                <th
                  class="v33-sim-target"
                >
                  8%
                </th>

                <th>
                  10%
                </th>

                <th>
                  12%
                </th>

                <th>
                  Event
                </th>

                <th>
                  Event 시나리오
                </th>

              </tr>

            </thead>


            <tbody>
              ${rows}
            </tbody>

          </table>

        </div>


        ${simulationChartV33(
          sim
        )}


        <div
          class="v33-sim-final"
        >

          <span>
            마지막 연도
            ${last.year}
          </span>


          ${
            sim.rates.map(
              (
                rate,
                j
              ) => `
                <div>

                  <small>
                    ${
                      Math.round(
                        rate * 100
                      )
                    }%
                  </small>

                  <b>
                    ${moneyManV33(
                      last.values[j]
                    )}
                  </b>

                </div>
              `
            ).join('')
          }


          <div class="event">

            <small>
              Event
            </small>

            <b>
              ${moneyManV33(
                last.eventValue
              )}
            </b>

          </div>

        </div>

      </div>
    `;
  }


  window.simulationSettingChangeV33 =
    function (
      key,
      value
    ) {

      const n =
        Number(value);


      if (
        !Number.isFinite(n)
      ) {
        return;
      }


      data.simulation[key] =
        key ===
          'horizonYears'

          ? Math.max(
              1,
              Math.min(
                30,
                Math.round(n)
              )
            )

          : Math.max(
              0,
              n
            );


      data.simulation.updatedAt =
        new Date()
          .toISOString();


      save();
    };


  window.simulationEventChangeV33 =
    function (
      year,
      value
    ) {

      const raw =
        String(
          value ?? ''
        )
          .trim();


      if (!raw) {

        delete data
          .simulation
          .events[year];

      } else {

        const n =
          Number(raw);


        if (
          !Number.isFinite(n)
        ) {
          return;
        }


        data.simulation
          .events[year] =
          n;
      }


      data.simulation.updatedAt =
        new Date()
          .toISOString();


      save();
    };


  //
  // ============================================================
  // Cash Management
  // ============================================================
  //

  function cashFundingViewV33() {

    return `
      <div
        class="v33-merged-page"
      >

        ${sectionWrapV33(
          '예금성 자금',
          '현재 현금·예금성 자산의 위치와 변동',
          renderOldViewV33(
            originalViewsV33.cash,
            '예금성 자금'
          )
        )}


        ${sectionWrapV33(
          '추가투입',
          '투자계좌로 이동시키는 신규자금 계획과 실제 투입',
          renderOldViewV33(
            originalViewsV33.funding,
            '추가투입'
          )
        )}


        ${sectionWrapV33(
          '장기 자산 Simulation',
          '현재 연금+ISA 평가액에서 시작해 연간 투입과 시장 충격을 함께 본다.',
          simulationViewV33()
        )}

      </div>
    `;
  }


  //
  // ============================================================
  // History helpers
  // ============================================================
  //

  function historyManV33(v) {

    return (
      v == null

        ? 'n/a'

        : Number(v)
            .toLocaleString(
              'ko-KR'
            )
    );
  }


  function historyPctV33(v) {

    return (
      v == null

        ? 'n/a'

        : `${Number(v)
            .toFixed(2)}%`
    );
  }


  function historyFinancialTableV33(
    h
  ) {

    const rows =
      h.financialAssets
        .map(
          r => `
            <tr
              class="${
                r[0].includes(
                  '전체'
                ) ||
                r[0].includes(
                  '투자계좌 전체'
                ) ||
                r[0] ===
                  '예금성 자금'

                  ? 'v33-history-total'

                  : ''
              }"
            >

              <td>
                ${esc(r[0])}
              </td>

              <td>
                ${esc(
                  r[1] ||
                  ''
                )}
              </td>

              <td>
                ${historyManV33(
                  r[2]
                )}
              </td>

              <td>
                ${historyManV33(
                  r[3]
                )}
              </td>

              <td>
                <b>
                  ${historyManV33(
                    r[4]
                  )}
                </b>
              </td>

              <td>
                ${historyManV33(
                  r[5]
                )}
              </td>

              <td
                class="${
                  Number(
                    r[6]
                  ) < 0
                    ? 'v33-negative'
                    : ''
                }"
              >
                ${historyPctV33(
                  r[6]
                )}
              </td>

              <td>
                ${historyManV33(
                  r[7]
                )}
              </td>

              <td>
                ${historyPctV33(
                  r[8]
                )}
              </td>

            </tr>
          `
        )
        .join('');


    return `
      <div class="tableWrap">

        <table
          class="mid v33-history-financial"
        >

          <thead>

            <tr class="thead">
              <th>계좌/자산</th>
              <th>Note</th>
              <th>기준액</th>
              <th>입출금</th>
              <th>평가액</th>
              <th>투자손익</th>
              <th>YTD</th>
              <th>누적손익</th>
              <th>비중</th>
            </tr>

          </thead>


          <tbody>
            ${rows}
          </tbody>

        </table>

      </div>
    `;
  }


  function simpleHistoryTableV33(
    title,
    headers,
    rows
  ) {

    return `
      <div
        class="v33-history-subsection"
      >

        <h3>
          ${esc(title)}
        </h3>


        <div class="tableWrap">

          <table class="mid">

            <thead>

              <tr class="thead">

                ${
                  headers.map(
                    h =>
                      `<th>${esc(h)}</th>`
                  ).join('')
                }

              </tr>

            </thead>


            <tbody>

              ${
                rows.map(
                  r => `
                    <tr
                      class="${
                        r[0] === 'Sum'
                          ? 'v33-history-total'
                          : ''
                      }"
                    >

                      ${
                        r.map(
                          (
                            v,
                            i
                          ) => `
                            <td
                              class="${
                                typeof v ===
                                  'number' &&
                                v < 0

                                  ? 'v33-negative'

                                  : ''
                              }"
                            >

                              ${
                                i === 0

                                  ? esc(
                                      String(v)
                                    )

                                  : typeof v ===
                                      'number'

                                    ? Number(v)
                                        .toLocaleString(
                                          'ko-KR'
                                        )

                                    : v == null

                                      ? 'n/a'

                                      : esc(
                                          String(v)
                                        )
                              }

                            </td>
                          `
                        ).join('')
                      }

                    </tr>
                  `
                ).join('')
              }

            </tbody>

          </table>

        </div>

      </div>
    `;
  }


  //
  // ============================================================
  // Income & Tax
  // ============================================================
  //

  function incomeTaxInputV33(
    row,
    key
  ) {

    const value =
      row[key];


    return `
      <input
        class="v33-history-input"
        type="number"
        step="0.01"
        value="${
          value ?? ''
        }"
        onchange="historyIncomeChangeV33(${row.year},'${key}',this.value)"
      >
    `;
  }


  function incomeTaxViewV33() {

    const rows =
      data
        .incomeTaxHistory
        .rows ||
      [];


    const current =
      Math.max(
        ...rows.map(
          r =>
            Number(
              r.year
            ) || 0
        )
      );


    const keys = [
      'salary',
      'tax',
      'deduction',
      'net',
      'withheld',
      'change',
      'taxRate',
      'finalTax'
    ];


    const body =
      rows.map(
        r => `
          <tr>

            <td>
              <b>
                ${r.year}
              </b>
            </td>


            ${
              keys.map(
                key => `
                  <td
                    class="${
                      Number(
                        r[key]
                      ) < 0
                        ? 'v33-negative'
                        : ''
                    }"
                  >

                    ${
                      r.year ===
                        current

                        ? incomeTaxInputV33(
                            r,
                            key
                          )

                        : (
                            key ===
                              'change' ||
                            key ===
                              'taxRate'

                              ? historyPctV33(
                                  r[key]
                                )

                              : r[key] ==
                                  null

                                ? ''

                                : Number(
                                    r[key]
                                  ).toLocaleString(
                                    'ko-KR'
                                  )
                          )
                    }

                  </td>
                `
              ).join('')
            }

          </tr>
        `
      )
      .join('');


    const sums = {};


    [
      'salary',
      'tax',
      'deduction',
      'net',
      'withheld',
      'finalTax'
    ]
      .forEach(
        k => {

          sums[k] =
            rows.reduce(
              (
                s,
                r
              ) =>
                s +
                (
                  Number(
                    r[k]
                  ) ||
                  0
                ),
              0
            );
        }
      );


    const totalRate =
      sums.withheld

        ? (
            sums.finalTax /
            sums.withheld *
            100
          )

        : null;


    const sumRow = `
      <tr
        class="v33-history-total"
      >

        <td>
          Sum
        </td>

        <td>
          ${sums.salary
            .toLocaleString(
              'ko-KR'
            )}
        </td>

        <td>
          ${sums.tax
            .toLocaleString(
              'ko-KR'
            )}
        </td>

        <td>
          ${sums.deduction
            .toLocaleString(
              'ko-KR'
            )}
        </td>

        <td>
          ${sums.net
            .toLocaleString(
              'ko-KR'
            )}
        </td>

        <td>
          ${sums.withheld
            .toLocaleString(
              'ko-KR'
            )}
        </td>

        <td>
          n/a
        </td>

        <td>
          ${historyPctV33(
            totalRate
          )}
        </td>

        <td>
          ${sums.finalTax
            .toLocaleString(
              'ko-KR'
            )}
        </td>

      </tr>
    `;


    const notes =
      Object.keys(
        data
          .incomeTaxHistory
          .notes ||
        {}
      )
        .sort(
          (
            a,
            b
          ) =>
            b - a
        )
        .map(
          year => `
            <div
              class="v33-history-note"
            >

              <label>
                ${year} Note
              </label>

              <textarea
                onchange="historyNoteChangeV33('${year}',this.value)"
              >${esc(
                data
                  .incomeTaxHistory
                  .notes[year] ||
                ''
              )}</textarea>

            </div>
          `
        )
        .join('');


    return `
      <div
        class="v33-history-subsection"
      >

        <h3>
          Income & Tax
        </h3>


        <p class="v33-subcopy">
          과거연도는 고정,
          최신연도 숫자는 수정 가능.
          Sum은 자동 계산.
        </p>


        <div class="tableWrap">

          <table
            class="mid v33-income-tax"
          >

            <thead>

              <tr class="thead">
                <th>연도</th>
                <th>급여계</th>
                <th>세액</th>
                <th>일반공제</th>
                <th>실지급액</th>
                <th>원천징수액</th>
                <th>변동률</th>
                <th>세율</th>
                <th>세액</th>
              </tr>

            </thead>


            <tbody>
              ${body}
              ${sumRow}
            </tbody>

          </table>

        </div>


        <div
          class="v33-history-notes"
        >
          ${notes}
        </div>

      </div>
    `;
  }


  window.historyIncomeChangeV33 =
    function (
      year,
      key,
      value
    ) {

      const row =
        data
          .incomeTaxHistory
          .rows
          .find(
            r =>
              Number(
                r.year
              ) ===
              Number(year)
          );


      if (!row) {
        return;
      }


      const raw =
        String(
          value ?? ''
        )
          .trim();


      row[key] =
        raw === ''

          ? null

          : Number(raw);


      save();
    };


  window.historyNoteChangeV33 =
    function (
      year,
      value
    ) {

      data
        .incomeTaxHistory
        .notes[year] =
        value;


      save();
    };


  window.historySelectYearV33 =
    function (
      year
    ) {

      data.history
        .selectedYear =
        Number(year);


      localStorage.setItem(
        KEY,
        JSON.stringify(data)
      );


      render();
    };


  //
  // ============================================================
  // History View
  // ============================================================
  //

  function historyViewV33() {

    const years =
      Object.keys(
        data.history.years ||
        {}
      )
        .map(Number)
        .filter(
          Number.isFinite
        )
        .sort(
          (
            a,
            b
          ) =>
            b - a
        );


    const selected =
      years.includes(
        Number(
          data.history
            .selectedYear
        )
      )

        ? Number(
            data.history
              .selectedYear
          )

        : (
            years[0] ||
            2025
          );


    const h =
      data.history
        .years?.[selected];


    const selector = `
      <div
        class="v33-history-toolbar"
      >

        <label>

          Year

          <select
            onchange="historySelectYearV33(this.value)"
          >

            ${
              years.map(
                y => `
                  <option
                    value="${y}"
                    ${
                      y === selected
                        ? 'selected'
                        : ''
                    }
                  >
                    ${y}
                  </option>
                `
              ).join('')
            }

          </select>

        </label>


        ${
          h?.frozen

            ? `
              <span
                class="v33-frozen-badge"
              >
                Frozen snapshot
              </span>
            `

            : ''
        }

      </div>
    `;


    let yearHtml = `
      <div class="notice">
        저장된 연말 snapshot이 없습니다.
      </div>
    `;


    if (h) {

      yearHtml = `
        <section
          class="v33-history-year"
        >

          <div
            class="v33-section-heading"
          >

            <div>

              <h2>
                ${selected} Year-End
              </h2>

              <p>
                과거 snapshot은
                현재 mapping/가격으로
                재계산하지 않는
                고정 기록입니다.
              </p>

            </div>

          </div>


          ${historyFinancialTableV33(
            h
          )}


          ${simpleHistoryTableV33(
            '연금 구성 (Historical)',

            [
              '구분',
              '매수',
              '평가',
              '손익',
              'TR',
              '1Y',
              '비중'
            ],

            h.pensionBuckets
          )}


          ${simpleHistoryTableV33(
            '연금투자 (Historical)',

            [
              '자산',
              '매수',
              '평가',
              '손익',
              'TR',
              'CP/BA',
              '비중'
            ],

            h.pensionDetail
          )}


          ${simpleHistoryTableV33(
            '개인투자 (Historical)',

            [
              '자산',
              '매수',
              '평가',
              '손익',
              'TR',
              'CP/HP',
              '비중'
            ],

            h.personalInvestment
          )}


          ${simpleHistoryTableV33(
            '자산 Mix',

            [
              '자산',
              '비중'
            ],

            h.assetMix
          )}


          ${simpleHistoryTableV33(
            'Income Summary',

            [
              '항목',
              '금액(만원)',
              '성과/Note'
            ],

            h.incomeSummary
          )}

        </section>
      `;
    }


    return `
      <div
        class="v33-history-page"
      >

        ${selector}

        ${yearHtml}

        ${incomeTaxViewV33()}

      </div>
    `;
  }


  //
  // ============================================================
  // Final 8 views
  // ============================================================
  //

  function installFinalViewsV33() {

    if (
      !views ||
      typeof views !==
        'object'
    ) {
      return;
    }


    const finalViews = {

      'Overview':
        originalViewsV33
          .Overview,

      'Allocation':
        originalViewsV33
          .Allocation,

      '시장가격':
        originalViewsV33
          .market,

      '계좌·보유':
        originalViewsV33
          .accounts,

      'Growth & 배당':
        growthDividendViewV33,

      '자금관리':
        cashFundingViewV33,

      'History':
        historyViewV33,

      'Strategy':
        originalViewsV33
          .strategy
    };


    //
    // 객체를 재할당하지 않고
    // 기존 views 객체 자체를 mutate.
    //
    // 기존 nav/render와의 compatibility 유지.
    //

    Object.keys(
      views
    )
      .forEach(
        k =>
          delete views[k]
      );


    FINAL_TAB_ORDER_V33
      .forEach(
        k => {

          if (
            typeof finalViews[k] ===
              'function'
          ) {

            views[k] =
              finalViews[k];
          }
        }
      );
  }


  window.installFinalViewsV33 =
    installFinalViewsV33;

  window.historyViewV33 =
    historyViewV33;

  window.cashFundingViewV33 =
    cashFundingViewV33;

  window.growthDividendViewV33 =
    growthDividendViewV33;


  //
  // Local data first.
  //

  const changedNow =
    ensureTabsDataV33();


  installFinalViewsV33();


  if (
    changedNow &&
    typeof scheduleCloudSave ===
      'function' &&
    typeof cloudReady !==
      'undefined' &&
    cloudReady
  ) {

    scheduleCloudSave();
  }


  //
  // Cloud portfolio_state를 읽은 뒤에도
  // migration을 다시 수행.
  //

  const loadCloudBeforeTabsV33 =
    loadCloud;


  loadCloud =
    async function () {

      await loadCloudBeforeTabsV33();


      const changed =
        ensureTabsDataV33();


      installFinalViewsV33();


      if (
        changed &&
        typeof scheduleCloudSave ===
          'function' &&
        typeof cloudReady !==
          'undefined' &&
        cloudReady
      ) {

        scheduleCloudSave();
      }
    };


  console.info(
    '[Portfolio Control] v3.3 final 8-tab IA loaded'
  );

})();