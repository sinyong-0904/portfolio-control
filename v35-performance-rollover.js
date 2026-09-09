//
// Portfolio Control v3.5
// Performance rollover payload preview.
// DEV-only, read-only.
//

(function () {
  const ACCOUNT_IDS_V35 = [
    'DC',
    'P1',
    'P2',
    'ISA',
    'GENERAL',
    'CHILD'
  ];

  const BUCKET_KEYS_V35 = [
    'EQUITY',
    'INCOME',
    'HEDGE',
    'PARKING'
  ];

  function cloneV35(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function assertPensionSnapshotReadyV35() {
    const ps =
      data.pensionSnapshot;

    if (
      !ps ||
      !ps.groups ||
      !ps.details
    ) {
      throw new Error(
        '[v35] pensionSnapshot is not ready'
      );
    }

    const snapshots = [
      ...Object.values(
        ps.groups
      ),
      ...Object.values(
        ps.details
      )
    ];

    const incomplete =
      snapshots.some(
        snapshot =>
          snapshot.snapshotEvalKRW ==
            null ||
          snapshot.snapshotBuyKRW ==
            null ||
          snapshot.ytdDenomKRW ==
            null
      );

    if (incomplete) {
      throw new Error(
        '[v35] pensionSnapshot runtime baseline is not initialized'
      );
    }
  }

  function safetyStateV35() {
    return {
      accounts:
        ACCOUNT_IDS_V35.map(
          id => {
            const a =
              acct(id);

            return {
              id,
              base2026:
                a?.base2026,

              annual:
                cloneV35(
                  a?.annual || {}
                )
            };
          }
        ),

      pensionSnapshot:
        cloneV35(
          data.pensionSnapshot
        ),

      pensionBucketSnapshot:
        cloneV35(
          data.pensionBucketSnapshot
        ),

      performanceV35:
        data.performanceV35 == null
          ? null
          : cloneV35(
              data.performanceV35
            )
    };
  }

  window.buildPerformanceRolloverPreviewV35 =
    function (
      fromYear,
      toYear
    ) {
      const from =
        Number(fromYear);

      const to =
        Number(toYear);

      if (
        !Number.isInteger(from) ||
        !Number.isInteger(to) ||
        to !== from + 1
      ) {
        throw new Error(
          '[v35] rollover years must be consecutive'
        );
      }

      if (
        typeof window
          .getTestBusinessYearV35 ===
          'function' &&
        window
          .getTestBusinessYearV35() !=
          null
      ) {
        throw new Error(
          '[v35] clear test business year before capturing rollover payload'
        );
      }

      if (
        typeof window
          .performanceRows !==
          'function'
      ) {
        throw new Error(
          '[v35] performanceRows is not available'
        );
      }

      if (
        typeof window
          .pensionBucketMetricsV33 !==
          'function'
      ) {
        throw new Error(
          '[v35] pensionBucketMetricsV33 is not available'
        );
      }

      if (
        typeof window
          .pensionMetrics !==
          'function'
      ) {
        throw new Error(
          '[v35] pensionMetrics is not available'
        );
      }

      assertPensionSnapshotReadyV35();

      const capturedAt =
        new Date().toISOString();

      //
      // 2026 Performance 결과를 읽기만 한다.
      //
      const rows =
        window.performanceRows();

      const carryRows = {};

      rows.forEach(
        row => {
          carryRows[
            row.scope
          ] = {
            ytd:
              Number(
                row.y26
              ) || 0,

            twr:
              Number(
                row.twr
              ) || 0
          };
        }
      );

      //
      // 2027 account YTD의 시작 baseline 후보.
      // 현재 평가액을 그대로 carry한다.
      //
      const accountBaseMan = {};

      ACCOUNT_IDS_V35.forEach(
        id => {
          accountBaseMan[id] =
            Number(
              accountSummary(
                id
              ).value
            ) || 0;
        }
      );

      //
      // v33 Performance의 4개 asset bucket
      // 새해 baseline 후보.
      //
      const bucketMetrics =
        window
          .pensionBucketMetricsV33();

      const bucketSnapshot = {};

      BUCKET_KEYS_V35.forEach(
        key => {
          const metric =
            bucketMetrics
              .buckets[key];

          bucketSnapshot[key] = {
            snapshotEvalMan:
              (
                Number(
                  metric.value
                ) || 0
              ) / 10000,

            snapshotYtdPnlMan:
              0,

            snapshotYtdRate:
              0,

            snapshotCumPnlMan:
              (
                Number(
                  metric.cumPnl
                ) || 0
              ) / 10000
          };
        }
      );

      //
      // Allocation의 기존 pensionSnapshot
      // groups/details도 같은 원칙으로
      // 다음 해 baseline 후보를 만든다.
      //
      const pensionNow =
        window.pensionMetrics();

      const pensionSnapshot = {
        groups: {},
        details: {}
      };

      Object.entries(
        pensionNow.groups || {}
      ).forEach(
        ([key, metric]) => {
          pensionSnapshot
            .groups[key] = {
              snapshotEvalKRW:
                Number(
                  metric.value
                ) || 0,

              snapshotBuyKRW:
                Number(
                  metric.buy
                ) || 0,

              ytdDenomKRW:
                Number(
                  metric.value
                ) || 0,

              snapshotYtdPnlMan:
                0,

              snapshotYtdRate:
                0,

              snapshotCumPnlMan:
                (
                  Number(
                    metric.cumPnl
                  ) || 0
                ) / 10000
            };
        }
      );

      Object.entries(
        pensionNow.details || {}
      ).forEach(
        ([key, metric]) => {
          pensionSnapshot
            .details[key] = {
              snapshotEvalKRW:
                Number(
                  metric.value
                ) || 0,

              snapshotBuyKRW:
                Number(
                  metric.buy
                ) || 0,

              ytdDenomKRW:
                Number(
                  metric.value
                ) || 0,

              snapshotYtdPnlMan:
                0,

              snapshotYtdRate:
                0,

              snapshotCumPnlMan:
                (
                  Number(
                    metric.cumPnl
                  ) || 0
                ) / 10000
            };
        }
      );

      return {
        version: 1,

        fromYear:
          from,

        toYear:
          to,

        capturedAt,

        carryRows,

        accountBaseMan,

        pensionBucketSnapshot: {
          snapshotDate:
            capturedAt.slice(
              0,
              10
            ),

          buckets:
            bucketSnapshot
        },

        pensionSnapshot
      };
    };

  window.testPerformanceRolloverPreviewV35 =
    function () {
      const before =
        JSON.stringify(
          safetyStateV35()
        );

      const preview =
        window
          .buildPerformanceRolloverPreviewV35(
            2026,
            2027
          );

      const after =
        JSON.stringify(
          safetyStateV35()
        );

      const bucketRows =
        Object.values(
          preview
            .pensionBucketSnapshot
            .buckets
        );

      const groupRows =
        Object.values(
          preview
            .pensionSnapshot
            .groups
        );

      const detailRows =
        Object.values(
          preview
            .pensionSnapshot
            .details
        );

      const checks = {
        dataUnchanged:
          before === after,

        carryScopeCount:
          Object.keys(
            preview.carryRows
          ).length,

        accountBaseCount:
          Object.keys(
            preview.accountBaseMan
          ).length,

        bucketCount:
          bucketRows.length,

        pensionGroupCount:
          groupRows.length,

        pensionDetailCount:
          detailRows.length,

        bucketYtdReset:
          bucketRows.every(
            row =>
              row
                .snapshotYtdPnlMan ===
                0 &&
              row
                .snapshotYtdRate ===
                0
          ),

        pensionYtdReset:
          [
            ...groupRows,
            ...detailRows
          ].every(
            row =>
              row
                .snapshotYtdPnlMan ===
                0 &&
              row
                .snapshotYtdRate ===
                0
          )
      };

      console.table(
        checks
      );

      console.log(
        '[v35 performance rollover preview]',
        preview
      );

      return {
        checks,
        preview
      };
    };
})();