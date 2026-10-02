// Portfolio Control v3.3
// Pension bucket performance correction.
// Load AFTER v33-core.js.
//
// Current bucket P&L source:
//   existing pension holdings
//     Active: eval P&L + realized + cumulative dividend
//     Closed: realized + cumulative dividend
//   + legacy P&L from already-deleted historical holdings
//   + future archived P&L carried when a Closed holding is deleted.

(function () {
  'use strict';

  const PENSION_IDS = [
    'DC',
    'P1',
    'P2'
  ];

  const BUCKET_KEYS = [
    'EQUITY',
    'INCOME',
    'HEDGE',
    'PARKING'
  ];

  //
  // Historical P&L whose original holding records
  // were already deleted before lifecycle history
  // preservation was introduced.
  //
  // User-verified against the legacy Excel ledger
  // on 2026-10-02.
  //
  // Unit: KRW.
  //
  const LEGACY_ARCHIVED_PNL_KRW = {
    EQUITY: 550000,
    INCOME: 540000,
    HEDGE: 590000,
    PARKING: 550000
  };


  function bucketForDetailKey(key) {
    if (
      [
        'NASDAQ',
        'S&P500',
        'GLOBAL',
        'WORLD'
      ].includes(key)
    ) {
      return 'EQUITY';
    }

    if (
      [
        'US-CVD',
        'K-DVD'
      ].includes(key)
    ) {
      return 'INCOME';
    }

    if (
      [
        'BOND',
        'GOLD'
      ].includes(key)
    ) {
      return 'HEDGE';
    }

    if (key === 'PARKING') {
      return 'PARKING';
    }

    return null;
  }


  function emptyBuckets() {
    return {
      EQUITY: 0,
      INCOME: 0,
      HEDGE: 0,
      PARKING: 0
    };
  }


  function dynamicArchivedPnl() {
    return (
      data.performanceV33
        ?.bucketArchivedPnlKRW ||
      {}
    );
  }


  function currentBucketCumPnlKRW() {
    const out =
      emptyBuckets();

    (data.holdings || [])
      .filter(
        h =>
          PENSION_IDS.includes(
            h.account
          )
      )
      .forEach(
        h => {
          const active =
            !h.status ||
            h.status === 'Active';

          const metric =
            typeof holdingMetric ===
              'function'
              ? holdingMetric(h)
              : null;

          const evalPnl =
            active
              ? (
                  Number(
                    metric?.evalPnl
                  ) || 0
                )
              : 0;

          const realized =
            Number(
              h.realized
            ) || 0;

          const dividend =
            Number(
              h.cumDividend
            ) || 0;

          const totalPnl =
            evalPnl +
            realized +
            dividend;

          const mapping =
            data.mapping?.[
              h.code
            ] || {};

          Object.entries(
            mapping
          ).forEach(
            ([detailKey, weight]) => {
              const bucket =
                bucketForDetailKey(
                  detailKey
                );

              if (!bucket) {
                return;
              }

              out[bucket] +=
                totalPnl *
                (
                  Number(
                    weight
                  ) || 0
                );
            }
          );
        }
      );

    const dynamic =
      dynamicArchivedPnl();

    BUCKET_KEYS.forEach(
      key => {
        out[key] +=
          Number(
            LEGACY_ARCHIVED_PNL_KRW[
              key
            ]
          ) || 0;

        out[key] +=
          Number(
            dynamic[key]
          ) || 0;
      }
    );

    return out;
  }


  const metricsBefore =
    window.pensionBucketMetricsV33;

  if (
    typeof metricsBefore !==
      'function'
  ) {
    console.error(
      '[Portfolio Control] ' +
      'pensionBucketMetricsV33 is unavailable'
    );

    return;
  }


  window.pensionBucketMetricsV33 =
  function () {
    const before =
      metricsBefore.apply(
        this,
        arguments
      );

    const cumulative =
      currentBucketCumPnlKRW();

    const buckets = {};

    BUCKET_KEYS.forEach(
      key => {
        const previous =
          before.buckets[key];

        const snapshot =
          data.pensionBucketSnapshot
            ?.buckets?.[key];

        if (
          !previous ||
          !snapshot
        ) {
          buckets[key] =
            previous;

          return;
        }

        //
        // 2025 closing cumulative P&L:
        // snapshot cumulative P&L
        // - snapshot 2026 YTD P&L.
        //
        const priorCumPnl =
          (
            (
              Number(
                snapshot
                  .snapshotCumPnlMan
              ) || 0
            ) -
            (
              Number(
                snapshot
                  .snapshotYtdPnlMan
              ) || 0
            )
          ) *
          10000;

        const cumPnl =
          Number(
            cumulative[key]
          ) || 0;

        const ytdPnl =
          cumPnl -
          priorCumPnl;

        const snapshotYtdRate =
          Number(
            snapshot
              .snapshotYtdRate
          ) || 0;

        const ytdDenom =
          snapshotYtdRate
            ? Math.abs(
                (
                  Number(
                    snapshot
                      .snapshotYtdPnlMan
                  ) || 0
                ) *
                10000 /
                (
                  snapshotYtdRate /
                  100
                )
              )
            : (
                Number(
                  snapshot
                    .snapshotEvalMan
                ) || 0
              ) *
              10000;

        buckets[key] = {
          ...previous,

          ytdPnl,

          ytd:
            ytdDenom
              ? ytdPnl /
                ytdDenom
              : 0,

          cumPnl,

          tr:
            previous.buy
              ? cumPnl /
                previous.buy
              : 0
        };
      }
    );

    const total = {
      ...before.total,

      buy:
        BUCKET_KEYS.reduce(
          (
            sum,
            key
          ) =>
            sum +
            (
              Number(
                buckets[key]?.buy
              ) || 0
            ),
          0
        ),

      value:
        BUCKET_KEYS.reduce(
          (
            sum,
            key
          ) =>
            sum +
            (
              Number(
                buckets[key]?.value
              ) || 0
            ),
          0
        ),

      ytdPnl:
        BUCKET_KEYS.reduce(
          (
            sum,
            key
          ) =>
            sum +
            (
              Number(
                buckets[key]?.ytdPnl
              ) || 0
            ),
          0
        ),

      cumPnl:
        BUCKET_KEYS.reduce(
          (
            sum,
            key
          ) =>
            sum +
            (
              Number(
                buckets[key]?.cumPnl
              ) || 0
            ),
          0
        )
    };

    total.tr =
      total.buy
        ? total.cumPnl /
          total.buy
        : 0;

    return {
      ...before,
      buckets,
      total
    };
  };


  const rowsBefore =
    window.performanceRowsV33 ||
    window.performanceRows;

  if (
    typeof rowsBefore ===
      'function'
  ) {
    const correctedRows =
      function () {
        const rows =
          rowsBefore.apply(
            this,
            arguments
          );

        const metrics =
          window
            .pensionBucketMetricsV33()
            .buckets;

        return rows.map(
          row => {
            if (
              !BUCKET_KEYS.includes(
                row.scope
              )
            ) {
              return row;
            }

            const metric =
              metrics[
                row.scope
              ];

            if (!metric) {
              return row;
            }

            const y25 =
              Number(
                row.y25
              ) || 0;

            const y26 =
              (
                Number(
                  metric.ytd
                ) || 0
              ) *
              100;

            const tr =
              (
                Number(
                  metric.tr
                ) || 0
              ) *
              100;

            const twr =
              (
                (
                  1 +
                  y25 / 100
                ) *
                (
                  1 +
                  y26 / 100
                ) -
                1
              ) *
              100;

            return {
              ...row,
              y26,
              tr,
              twr
            };
          }
        );
      };

    window.performanceRowsV33 =
      correctedRows;

    window.performanceRows =
      correctedRows;
  }


  window.archiveClosedPensionHoldingPnlV33 =
  function (h) {
    if (
      !h ||
      !PENSION_IDS.includes(
        h.account
      )
    ) {
      return {
        ok: true,
        archived: false,
        amountKRW: 0
      };
    }

    const totalPnl =
      (
        Number(
          h.realized
        ) || 0
      ) +
      (
        Number(
          h.cumDividend
        ) || 0
      );

    if (!totalPnl) {
      return {
        ok: true,
        archived: false,
        amountKRW: 0
      };
    }

    const mapping =
      data.mapping?.[
        h.code
      ] || {};

    const allocations = [];
    let weightSum = 0;

    Object.entries(
      mapping
    ).forEach(
      ([detailKey, weight]) => {
        const bucket =
          bucketForDetailKey(
            detailKey
          );

        const w =
          Number(
            weight
          ) || 0;

        if (
          bucket &&
          w
        ) {
          allocations.push(
            [
              bucket,
              w
            ]
          );

          weightSum += w;
        }
      }
    );

    if (
      Math.abs(
        weightSum - 1
      ) > 1e-9
    ) {
      return {
        ok: false,
        archived: false,
        code:
          'PENSION_BUCKET_MAPPING_INVALID',
        amountKRW:
          totalPnl
      };
    }

    if (
      !data.performanceV33 ||
      typeof data.performanceV33 !==
        'object'
    ) {
      return {
        ok: false,
        archived: false,
        code:
          'PERFORMANCE_V33_NOT_READY',
        amountKRW:
          totalPnl
      };
    }

    if (
      !data.performanceV33
        .bucketArchivedPnlKRW ||
      typeof data.performanceV33
        .bucketArchivedPnlKRW !==
        'object' ||
      Array.isArray(
        data.performanceV33
          .bucketArchivedPnlKRW
      )
    ) {
      data.performanceV33
        .bucketArchivedPnlKRW = {};
    }

    allocations.forEach(
      ([bucket, weight]) => {
        data.performanceV33
          .bucketArchivedPnlKRW[
            bucket
          ] =
          (
            Number(
              data.performanceV33
                .bucketArchivedPnlKRW[
                  bucket
                ]
            ) || 0
          ) +
          totalPnl *
          weight;
      }
    );

    return {
      ok: true,
      archived: true,
      amountKRW:
        totalPnl
    };
  };


  window
    .pensionBucketCurrentCumPnlV33 =
      currentBucketCumPnlKRW;


  console.info(
    '[Portfolio Control] ' +
    'Pension bucket P&L fix loaded'
  );
})();