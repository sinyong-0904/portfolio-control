//
// Portfolio Control v3.2 patch
// Growth monthly/yearly rollover automation.
// Manual: contribution, cashChange.
// Automatic: investmentReturn, legacy, totalChange, value, Growth.
//

(function () {
  const MONTHS = data.months || ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  function currentPeriod() {
    const d = new Date();
    return {
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      month: MONTHS[d.getMonth()]
    };
  }

  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }

  function yearRows(year) {
    const y = String(year);

    if (!data.growthV32.years[y]) {
      data.growthV32.years[y] = {};

      MONTHS.forEach(m => {
        data.growthV32.years[y][m] = {
          contribution: 0,
          cashChange: 0,
          investmentReturn: null,
          legacy: null,
          totalChange: null,
          value: null,
          locked: false
        };
      });
    }

    return data.growthV32.years[y];
  }

  function ensureGrowthV32() {
    if (!data.growthV32) {
      data.growthV32 = {
        version: 1,
        currentYear: 2026,
        currentMonthIndex: MONTHS.indexOf(
          (data.monthlyGrowthMeta || {}).currentMonth || 'AUG'
        ),
        years: {},
        annual: {}
      };

      const old = data.monthlyGrowth2026 || {};

      data.growthV32.years['2026'] = {};

      MONTHS.forEach((m, i) => {
        const r = old[m] || {};

        data.growthV32.years['2026'][m] = {
          contribution: Number(r.contribution) || 0,
          cashChange: Number(r.cashChange) || 0,

          investmentReturn:
            r.investmentReturn == null
              ? null
              : Number(r.investmentReturn),

          legacy:
            r.legacy == null
              ? null
              : Number(r.legacy),

          totalChange:
            r.totalChange == null
              ? null
              : Number(r.totalChange),

          value:
            r.value == null
              ? null
              : Number(r.value),

          locked:
            i < data.growthV32.currentMonthIndex
        };
      });

      const g25 =
        data.growthFixed &&
        data.growthFixed['2025'];

      if (g25) {
        data.growthV32.annual['2025'] = clone(g25);
      }

      const meta =
        data.monthlyGrowthMeta || {};

      data.growthV32.currentStart = {
        investmentValue: null,
        legacyValue: null,

        totalValue:
          data.growthV32.currentMonthIndex === 0
            ? Number(meta.priorYearEndValue) || 71740
            : Number(
                data.growthV32.years['2026'][
                  MONTHS[
                    data.growthV32.currentMonthIndex - 1
                  ]
                ].value
              ) || 0
      };

      const n = netSummary();

      const curRow =
        data.growthV32.years['2026'][
          MONTHS[data.growthV32.currentMonthIndex]
        ];

      const prevInvCum =
        Number(meta.prevInvestmentCum) || 0;

      const prevLegacyCum =
        Number(meta.prevLegacyCum) || 0;

      curRow.investmentReturn =
        n.inv.pnl - prevInvCum;

      curRow.legacy =
        n.legacy.pnl - prevLegacyCum;

      curRow.value =
        n.total;

      curRow.totalChange =
        n.total -
        data.growthV32.currentStart.totalValue;
    }

    const p = currentPeriod();

    const storedSerial =
      data.growthV32.currentYear * 12 +
      data.growthV32.currentMonthIndex;

    const nowSerial =
      p.year * 12 +
      p.monthIndex;

    if (nowSerial > storedSerial) {

      const schemaVersion =
        Number(
          (data.meta || {}).schemaVersion
        ) || 0;

      // v3.3부터는 새 달 첫 접속 시
      // 현재 평가액을 직전 월말 평가액으로
      // 자동 확정하지 않는다.
      //
      // 월말 snapshot을 확인한 후
      // 별도의 월마감 기능에서 확정한다.
      if (schemaVersion >= 33) {

        if (
          !Array.isArray(
            data.growthV32.rolloverWarnings
          )
        ) {
          data.growthV32.rolloverWarnings = [];
        }

        const warningId =
          'month-close-' +
          data.growthV32.currentYear + '-' +
          data.growthV32.currentMonthIndex + '-' +
          p.year + '-' +
          p.monthIndex;

        const exists =
          data.growthV32
            .rolloverWarnings
            .some(
              x =>
                x &&
                x.id === warningId
            );

        if (!exists) {

          data.growthV32
            .rolloverWarnings
            .push({
              id: warningId,

              type:
                'MONTH_CLOSE_REQUIRED',

              fromYear:
                data.growthV32.currentYear,

              fromMonthIndex:
                data.growthV32.currentMonthIndex,

              targetYear:
                p.year,

              targetMonthIndex:
                p.monthIndex,

              detectedAt:
                new Date()
                  .toISOString()
            });
        }

        return;
      }

      // v3.2 이하에 대해서만
      // 기존 자동 rollover 유지
      rollGrowthForward(
        p.year,
        p.monthIndex
      );
    }
  }

  function calculateLiveRow(
    year,
    monthIndex
  ) {
    const rows =
      yearRows(year);

    const r =
      rows[MONTHS[monthIndex]];

    const n =
      netSummary();

    const startTotal =
      Number(
        data.growthV32.currentStart &&
        data.growthV32.currentStart.totalValue
      ) || 0;

    r.value =
      n.total;

    r.totalChange =
      n.total - startTotal;

    if (
      data.growthV32.currentStart &&
      data.growthV32.currentStart.legacyValue != null
    ) {
      r.legacy =
        n.legacy.value -
        Number(
          data.growthV32.currentStart.legacyValue
        );
    }

    if (r.legacy != null) {
      r.investmentReturn =
        r.totalChange -
        (Number(r.contribution) || 0) -
        (Number(r.cashChange) || 0) -
        (Number(r.legacy) || 0);
    }

    r.locked = false;

    return r;
  }

  function finalizeCurrentMonth() {
    const g =
      data.growthV32;

    const rows =
      yearRows(g.currentYear);

    const r =
      calculateLiveRow(
        g.currentYear,
        g.currentMonthIndex
      );

    r.locked = true;

    return r;
  }

  function buildAnnual(year) {
    const rows =
      yearRows(year);

    const used =
      MONTHS
        .map(m => rows[m])
        .filter(r => r.value != null);

    if (!used.length)
      return null;

    const contribution =
      used.reduce(
        (s, r) =>
          s +
          (Number(r.contribution) || 0),
        0
      );

    const cashChange =
      used.reduce(
        (s, r) =>
          s +
          (Number(r.cashChange) || 0),
        0
      );

    const investmentReturn =
      used.reduce(
        (s, r) =>
          s +
          (Number(r.investmentReturn) || 0),
        0
      );

    const legacy =
      used.reduce(
        (s, r) =>
          s +
          (Number(r.legacy) || 0),
        0
      );

    const totalChange =
      used.reduce(
        (s, r) =>
          s +
          (Number(r.totalChange) || 0),
        0
      );

    const value =
      Number(
        used[
          used.length - 1
        ].value
      ) || 0;

    let priorEnd = null;

    if (year === 2026) {
      priorEnd =
        Number(
          (data.monthlyGrowthMeta || {})
            .priorYearEndValue
        ) || 71740;
    } else {
      const prev =
        data.growthV32.annual[
          String(year - 1)
        ];

      if (prev) {
        priorEnd =
          Number(prev.value) || 0;
      }
    }

    const growth =
      priorEnd
        ? totalChange /
          priorEnd *
          100
        : 0;

    const out = {
      contribution,
      cashChange,
      investmentReturn,
      legacy,
      totalChange,
      value,
      growth
    };

    data.growthV32.annual[
      String(year)
    ] = out;

    return out;
  }

  function rollGrowthForward(
    targetYear,
    targetMonthIndex
  ) {
    const g =
      data.growthV32;

    let serial =
      g.currentYear * 12 +
      g.currentMonthIndex;

    const target =
      targetYear * 12 +
      targetMonthIndex;

    while (serial < target) {
      finalizeCurrentMonth();

      const oldYear =
        g.currentYear;

      const oldMonth =
        g.currentMonthIndex;

      if (oldMonth === 11) {
        buildAnnual(oldYear);
      }

      const n =
        netSummary();

      let ny =
        oldYear;

      let nm =
        oldMonth + 1;

      if (nm > 11) {
        nm = 0;
        ny++;
      }

      g.currentYear =
        ny;

      g.currentMonthIndex =
        nm;

      const rows =
        yearRows(ny);

      const next =
        rows[MONTHS[nm]];

      next.locked =
        false;

      g.currentStart = {
        investmentValue:
          n.inv.value,

        legacyValue:
          n.legacy.value,

        totalValue:
          n.total
      };

      serial =
        ny * 12 + nm;
    }

    save(false);
  }

  function v32MonthlyRows() {
    ensureGrowthV32();

    const g =
      data.growthV32;

    const rows =
      yearRows(
        g.currentYear
      );

    calculateLiveRow(
      g.currentYear,
      g.currentMonthIndex
    );

    const displayed =
      MONTHS.map(
        (m, i) => {
          const r =
            rows[m];

          let growth =
            null;

          if (r.value != null) {
            let prevValue;

            if (i === 0) {
              if (
                g.currentYear === 2026
              ) {
                prevValue =
                  Number(
                    (
                      data.monthlyGrowthMeta ||
                      {}
                    ).priorYearEndValue
                  ) || 71740;
              } else {
                prevValue =
                  Number(
                    (
                      data.growthV32.annual[
                        String(
                          g.currentYear -
                          1
                        )
                      ] || {}
                    ).value
                  ) || 0;
              }
            } else {
              prevValue =
                Number(
                  rows[
                    MONTHS[i - 1]
                  ].value
                ) || 0;
            }

            growth =
              prevValue
                ? (
                    Number(
                      r.totalChange
                    ) || 0
                  ) /
                  prevValue *
                  100
                : null;
          }

          return {
            ...r,
            month: m,
            growth
          };
        }
      );

    const used =
      displayed.filter(
        (r, i) =>
          i <=
            g.currentMonthIndex &&
          r.value != null
      );

    const ytd = {
      month: 'YTD',

      contribution:
        used.reduce(
          (s, r) =>
            s +
            (Number(
              r.contribution
            ) || 0),
          0
        ),

      cashChange:
        used.reduce(
          (s, r) =>
            s +
            (Number(
              r.cashChange
            ) || 0),
          0
        ),

      investmentReturn:
        used.reduce(
          (s, r) =>
            s +
            (Number(
              r.investmentReturn
            ) || 0),
          0
        ),

      legacy:
        used.reduce(
          (s, r) =>
            s +
            (Number(
              r.legacy
            ) || 0),
          0
        ),

      totalChange:
        used.reduce(
          (s, r) =>
            s +
            (Number(
              r.totalChange
            ) || 0),
          0
        ),

      value:
        used.length
          ? used[
              used.length - 1
            ].value
          : null
    };

    let priorEnd =
      g.currentYear === 2026
        ? Number(
            (
              data.monthlyGrowthMeta ||
              {}
            ).priorYearEndValue
          ) || 71740
        : Number(
            (
              data.growthV32.annual[
                String(
                  g.currentYear - 1
                )
              ] || {}
            ).value
          ) || 0;

    ytd.growth =
      priorEnd
        ? ytd.totalChange /
          priorEnd *
          100
        : null;

    return {
      rows: displayed,
      ytd,
      year:
        g.currentYear,
      currentMonthIndex:
        g.currentMonthIndex
    };
  }

  function growthInput(
    year,
    monthIndex,
    field,
    value
  ) {
    const rows =
      yearRows(year);

    const r =
      rows[
        MONTHS[monthIndex]
      ];

    if (r.locked) {
      alert(
        '확정된 과거 월입니다. 현재월의 추가투입/현금증감만 수정할 수 있습니다.'
      );

      render();
      return;
    }

    r[field] =
      Number(value) || 0;

    calculateLiveRow(
      year,
      monthIndex
    );

    save();
  }

  window.growthV32Input =
    growthInput;

  window.v32MonthlyRows =
    v32MonthlyRows;

  growthDetailView =
    function () {
      const g =
        v32MonthlyRows();

      const cur =
        g.currentMonthIndex;

      const rowHTML =
        g.rows
          .map(
            (r, i) => {
              const isCurrent =
                i === cur;

              const contribution =
                isCurrent
                  ? `<input class="numInput" type="number" step=".1" value="${Number(r.contribution) || 0}" onchange="growthV32Input(${g.year},${i},'contribution',this.value)">`
                  : won(
                      r.contribution ||
                      0
                    );

              const cashChange =
                isCurrent
                  ? `<input class="numInput" type="number" step=".1" value="${Number(r.cashChange) || 0}" onchange="growthV32Input(${g.year},${i},'cashChange',this.value)">`
                  : won(
                      r.cashChange ||
                      0
                    );

              return `
                <tr${
                  isCurrent
                    ? ' class="currentGrowthRow"'
                    : ''
                }>
                  <td>
                    ${r.month}
                    ${
                      isCurrent
                        ? ' <span class="pill in">LIVE</span>'
                        : ''
                    }
                  </td>

                  <td>
                    ${contribution}
                  </td>

                  <td>
                    ${cashChange}
                  </td>

                  <td>
                    ${
                      r.investmentReturn ==
                      null
                        ? ''
                        : won(
                            r.investmentReturn
                          )
                    }
                  </td>

                  <td>
                    ${
                      r.legacy ==
                      null
                        ? ''
                        : won(
                            r.legacy
                          )
                    }
                  </td>

                  <td>
                    ${
                      r.totalChange ==
                      null
                        ? ''
                        : won(
                            r.totalChange
                          )
                    }
                  </td>

                  <td>
                    ${
                      r.value ==
                      null
                        ? ''
                        : won(
                            r.value
                          )
                    }
                  </td>

                  <td>
                    ${
                      r.growth ==
                      null
                        ? ''
                        : pct(
                            r.growth
                          )
                    }
                  </td>
                </tr>
              `;
            }
          )
          .join('');

      const y =
        g.ytd;

      let annualRows =
        '';

      const annualYears =
        Object.keys(
          data.growthV32.annual
        )
          .map(Number)
          .filter(
            year =>
              year < g.year
          )
          .sort(
            (a, b) =>
              b - a
          );

      annualYears.forEach(
        year => {
          const a =
            data.growthV32.annual[
              String(year)
            ];

          annualRows += `
            <tr>
              <td>${year}</td>
              <td>${won(a.contribution)}</td>
              <td>${won(a.cashChange)}</td>
              <td>${won(a.investmentReturn)}</td>
              <td>${won(a.legacy)}</td>
              <td>${won(a.totalChange)}</td>
              <td>${won(a.value)}</td>
              <td>${pct(a.growth)}</td>
            </tr>
          `;
        }
      );

      const n =
        netSummary();

      return `
        <div class="actions">
          <button
            class="btn primary"
            onclick="save()"
          >
            Growth 저장
          </button>
        </div>

        <h2>
          ${g.year}
          월별 금융자산 Growth
        </h2>

        <div class="tableWrap">
          <table
            class="mid editTable"
          >
            <thead>
              <tr class="thead">
                <th>월</th>
                <th>추가투입</th>
                <th>현금증감</th>
                <th>투자수익</th>
                <th>삼전우</th>
                <th>총증감</th>
                <th>평가액</th>
                <th>Growth</th>
              </tr>
            </thead>

            <tbody>
              ${rowHTML}

              <tr class="totalRow">
                <td>YTD</td>
                <td>${won(y.contribution)}</td>
                <td>${won(y.cashChange)}</td>
                <td>${won(y.investmentReturn)}</td>
                <td>${won(y.legacy)}</td>
                <td>${won(y.totalChange)}</td>
                <td>
                  ${
                    y.value == null
                      ? ''
                      : won(
                          y.value
                        )
                  }
                </td>
                <td>
                  ${
                    y.growth == null
                      ? ''
                      : pct(
                          y.growth
                        )
                  }
                </td>
              </tr>

              ${annualRows}

              <tr>
                <td>TR</td>
                <td>10,506</td>

                <td>
                  ${won(
                    n.cash.value -
                    data.meta.initialCash
                  )}
                </td>

                <td>
                  ${won(
                    n.inv.cumPnl
                  )}
                </td>

                <td>
                  ${won(
                    n.legacy.value -
                    data.meta.initialLegacy
                  )}
                </td>

                <td>
                  ${won(
                    n.total -
                    data.meta.initialValue
                  )}
                </td>

                <td>
                  ${won(n.total)}
                </td>

                <td>
                  ${pct(
                    n.tr * 100
                  )}
                </td>
              </tr>

              <tr>
                <td>IV</td>
                <td>0</td>

                <td>
                  ${won(
                    data.meta.initialCash
                  )}
                </td>

                <td>
                  ${won(
                    data.meta.initialInvestment
                  )}
                </td>

                <td>
                  ${won(
                    data.meta.initialLegacy
                  )}
                </td>

                <td>0</td>

                <td>
                  ${won(
                    data.meta.initialValue
                  )}
                </td>

                <td>
                  0.00%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="note">
          <b>추가투입</b>과
          <b>현금증감</b>은
          현재월만 수동 입력합니다.

          투자수익은 전체 투자계좌
          평가액 기준으로 계산되므로
          배당금이 재투자되거나
          계좌 현금/초단기채로 남아 있어도
          별도 배당 가산 없이 자동 반영됩니다.

          월이 바뀌면 직전 월을 확정하고
          새 월을 LIVE로 전환하며,
          연도가 바뀌면 직전 연도의
          연간 결과를 자동 추가합니다.
        </div>
      `;
    };

  views['Growth'] =
    () =>
      growthDetailView();

  const loadCloudV31 =
    loadCloud;

  loadCloud =
    async function () {
      await loadCloudV31();

      ensureGrowthV32();

      localStorage.setItem(
        KEY,
        JSON.stringify(data)
      );
    };

  ensureGrowthV32();
})();