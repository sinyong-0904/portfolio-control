//
// Portfolio Control v3.2.2
// Pension bucket restructure
//
// EQUITY  = NASDAQ + S&P500 + GLOBAL + WORLD
// INCOME  = US-CVD + K-DVD
// HEDGE   = BOND + GOLD
// PARKING = SOL short bond + account cash
//

(function () {

  const BUCKET_SNAPSHOT_V322 = {

    EQUITY: {
      snapshotBuyMan: 10160,
      snapshotEvalMan: 12398,
      snapshotYtdPnlMan: 848,
      snapshotYtdRate: 9.84,
      snapshotCumPnlMan: 2395
    },

    INCOME: {
      snapshotBuyMan: 5010,
      snapshotEvalMan: 5797,
      snapshotYtdPnlMan: 758,
      snapshotYtdRate: 8.80,
      snapshotCumPnlMan: 1102
    },

    HEDGE: {
      snapshotBuyMan: 4212,
      snapshotEvalMan: 4874,
      snapshotYtdPnlMan: 106,
      snapshotYtdRate: 1.12,
      snapshotCumPnlMan: 852
    },

    PARKING: {
      snapshotBuyMan: 9454,
      snapshotEvalMan: 9681,
      snapshotYtdPnlMan: 229,
      snapshotYtdRate: 2.12,
      snapshotCumPnlMan: 579
    }

  };


  function bucketRawV322() {

    const c =
      pensionCategoryValues();

    return {

      EQUITY: {
        buy:
          c.NASDAQ.buy +
          c['S&P500'].buy +
          c.GLOBAL.buy +
          c.WORLD.buy,

        value:
          c.NASDAQ.value +
          c['S&P500'].value +
          c.GLOBAL.value +
          c.WORLD.value
      },


      INCOME: {
        buy:
          c['US-CVD'].buy +
          c['K-DVD'].buy,

        value:
          c['US-CVD'].value +
          c['K-DVD'].value
      },


      HEDGE: {
        buy:
          c.BOND.buy +
          c.GOLD.buy,

        value:
          c.BOND.value +
          c.GOLD.value
      },


      PARKING: {
        buy:
          c.PARKING.buy,

        value:
          c.PARKING.value
      }

    };

  }


  function bucketMetricV322(
    key,
    raw
  ) {

    const s =
      BUCKET_SNAPSHOT_V322[key];

    const snapshotEvalKRW =
      s.snapshotEvalMan * 10000;

    const delta =
      raw.value -
      snapshotEvalKRW;

    const ytdPnl =
      s.snapshotYtdPnlMan *
      10000 +
      delta;

    const cumPnl =
      s.snapshotCumPnlMan *
      10000 +
      delta;


    const ytdDenom =
      s.snapshotYtdRate
        ? Math.abs(
            s.snapshotYtdPnlMan *
            10000 /
            (
              s.snapshotYtdRate /
              100
            )
          )
        : snapshotEvalKRW;


    return {

      buy:
        raw.buy,

      value:
        raw.value,

      ytdPnl,

      ytd:
        ytdDenom
          ? ytdPnl /
            ytdDenom
          : 0,

      cumPnl,

      tr:
        raw.buy
          ? cumPnl /
            raw.buy
          : 0

    };

  }


  function pensionBucketMetricsV322() {

    const raw =
      bucketRawV322();

    const out = {};

    [
      'EQUITY',
      'INCOME',
      'HEDGE',
      'PARKING'
    ].forEach(
      key => {

        out[key] =
          bucketMetricV322(
            key,
            raw[key]
          );

      }
    );

    return out;

  }


  //
  // Patch Allocation view only.
  // Detailed look-through table remains
  // NASDAQ / S&P500 / US-CVD / K-DVD /
  // BOND / GOLD / GLOBAL / WORLD.
  //

  const allocationViewV321 =
    allocationView;


  allocationView =
    function () {

      const core =
        coreAllocation();

      const pm =
        pensionMetrics();

      const buckets =
        pensionBucketMetricsV322();


      const bucketKeys = [
        'EQUITY',
        'INCOME',
        'HEDGE',
        'PARKING'
      ];


      const groupTotal =
        bucketKeys.reduce(
          (
            s,
            k
          ) =>
            s +
            buckets[k].value,
          0
        );


      const detailKeys = [
        'NASDAQ',
        'S&P500',
        'US-CVD',
        'K-DVD',
        'BOND',
        'GOLD',
        'GLOBAL',
        'WORLD'
      ];


      const bucketRows =
        bucketKeys.map(
          k => {

            const x =
              buckets[k];

            return [
              k,

              won(
                x.buy /
                10000
              ),

              won(
                x.value /
                10000
              ),

              won(
                x.ytdPnl /
                10000
              ),

              pct(
                x.ytd *
                100
              ),

              won(
                x.cumPnl /
                10000
              ),

              pct(
                x.tr *
                100
              ),

              pct(
                groupTotal
                  ? x.value /
                    groupTotal *
                    100
                  : 0
              )
            ];

          }
        );


      const sumBuy =
        bucketKeys.reduce(
          (
            s,
            k
          ) =>
            s +
            buckets[k].buy,
          0
        );


      const sumYtd =
        bucketKeys.reduce(
          (
            s,
            k
          ) =>
            s +
            buckets[k].ytdPnl,
          0
        );


      const sumCum =
        bucketKeys.reduce(
          (
            s,
            k
          ) =>
            s +
            buckets[k].cumPnl,
          0
        );


      bucketRows.push([
        'Sum',

        won(
          sumBuy /
          10000
        ),

        won(
          groupTotal /
          10000
        ),

        won(
          sumYtd /
          10000
        ),

        pct(
          aggregateSummary(
            PENSION_IDS
          ).ytd *
          100
        ),

        won(
          sumCum /
          10000
        ),

        pct(
          sumBuy
            ? sumCum /
              sumBuy *
              100
            : 0
        ),

        '100.00%'
      ]);


      return `

        <h2>
          Core Look-through
        </h2>

        ${simpleTable(
          [
            'GOLD',
            'BOND',
            'K-DVD',
            'NASDAQ',
            'S&P500',
            'US-CVD'
          ],

          [[
            ...core.map(
              x =>
                pct(
                  x.weight *
                  100
                )
            )
          ]]
        )}


        <h2>
          목표 대비
        </h2>

        ${simpleTable(
          [
            '자산',
            '목표',
            '현재',
            '상대괴리',
            '하단',
            '상단',
            'Band'
          ],

          core.map(
            x => [
              x.key,

              pct(
                x.target *
                100
              ),

              pct(
                x.weight *
                100
              ),

              pct(
                x.gap *
                100
              ),

              pct(
                x.low *
                100
              ),

              pct(
                x.high *
                100
              ),

              `<span class="pill ${x.status.toLowerCase()}">${x.status}</span>`
            ]
          )
        )}


        <div class="grid2">

          <div>

            <h2>
              연금 구성
            </h2>

            ${simpleTable(
              [
                '구분',
                '매수액',
                '평가액',
                "26'손익",
                'YTD 26',
                '누적손익',
                'TR (%)',
                '비중'
              ],

              bucketRows
            )}

          </div>


          <div>

            <h2>
              비중 시각화
            </h2>

            <div class="card">

              ${bucketKeys.map(
                k => {

                  const x =
                    buckets[k];

                  return `
                    <div class="kpirow">

                      <div>
                        ${k}
                      </div>

                      <div class="bar">
                        <i style="width:${
                          Math.min(
                            100,
                            groupTotal
                              ? x.value /
                                groupTotal *
                                200
                              : 0
                          )
                        }%"></i>
                      </div>

                      <div>
                        ${pct(
                          groupTotal
                            ? x.value /
                              groupTotal *
                              100
                            : 0
                        )}
                      </div>

                    </div>
                  `;

                }
              ).join('')}

            </div>

          </div>

        </div>


        <h2>
          연금투자 Look-through
        </h2>

        ${simpleTable(
          [
            '자산',
            '매수액',
            '평가액',
            "26'손익",
            'YTD 26',
            '누적손익',
            'TR (%)',
            '비중'
          ],

          detailKeys.map(
            k => {

              const x =
                pm.details[k];

              const tot =
                pm.details.TOTAL.value;

              return [
                k,

                won(
                  x.buy /
                  10000
                ),

                won(
                  x.value /
                  10000
                ),

                won(
                  x.ytdPnl /
                  10000
                ),

                pct(
                  x.ytd *
                  100
                ),

                won(
                  x.cumPnl /
                  10000
                ),

                pct(
                  x.tr *
                  100
                ),

                pct(
                  x.value /
                  tot *
                  100
                )
              ];

            }
          ).concat([
            [
              'Sum',

              won(
                pm.details.TOTAL.buy /
                10000
              ),

              won(
                pm.details.TOTAL.value /
                10000
              ),

              won(
                pm.details.TOTAL.ytdPnl /
                10000
              ),

              pct(
                pm.details.TOTAL.ytd *
                100
              ),

              won(
                pm.details.TOTAL.cumPnl /
                10000
              ),

              pct(
                pm.details.TOTAL.tr *
                100
              ),

              '100.00%'
            ]
          ])
        )}


        <div class="note">
          연금 구성은
          EQUITY / INCOME / HEDGE / PARKING
          4개 버킷으로 관리합니다.
          EQUITY는 NASDAQ·S&P500·GLOBAL·WORLD,
          INCOME은 US-CVD·K-DVD,
          HEDGE는 BOND·GOLD,
          PARKING은 초단기채와 계좌 현금입니다.
        </div>

      `;

    };


  views['Allocation'] =
    () =>
      allocationView();

})();
