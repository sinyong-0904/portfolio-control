//
// Portfolio Control v3.5
// Live Performance adjustments.
// Phase 3B: dynamic CAGR + future-year simulation.
//

(function () {
  let rolloverPreviewV35 =
    null;

  function businessYearV35Safe() {
    return (
      typeof window.businessYearV35 ===
        'function'
        ? window.businessYearV35()
        : new Date().getFullYear()
    );
  }

  function isoWeekV35(date) {
    const d =
      new Date(
        Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        )
      );

    const day =
      d.getUTCDay() || 7;

    d.setUTCDate(
      d.getUTCDate() +
      4 -
      day
    );

    const yearStart =
      new Date(
        Date.UTC(
          d.getUTCFullYear(),
          0,
          1
        )
      );

    return Math.ceil(
      (
        (
          d -
          yearStart
        ) /
        86400000 +
        1
      ) /
      7
    );
  }

  function durationYearsV35() {
    const now =
      new Date();

    return (
      now.getFullYear() -
      2025 +
      isoWeekV35(now) / 52
    );
  }

  function cagrFromTwrV35(
    twr,
    durationYears
  ) {
    const r =
      Number(twr) / 100;

    const years =
      Number(
        durationYears
      );

    if (
      !Number.isFinite(r) ||
      !Number.isFinite(years) ||
      years <= 0 ||
      1 + r <= 0
    ) {
      return 0;
    }

    return (
      (
        Math.pow(
          1 + r,
          1 / years
        ) -
        1
      ) *
      100
    );
  }

  function liveYtdFromBaseV35(
    value,
    base,
    flow
  ) {
    const denominator =
      Number(base) +
      Number(flow);

    if (!denominator) {
      return 0;
    }

    return (
      (
        Number(value) -
        denominator
      ) /
      denominator *
      100
    );
  }

  const performanceRowsBeforeV35 =
    window.performanceRows;

  if (
    typeof performanceRowsBeforeV35 !==
    'function'
  ) {
    console.error(
      '[v35] performanceRows is not available'
    );

    return;
  }

  window.performanceRows =
    function () {
      const rows =
        performanceRowsBeforeV35
          .apply(
            this,
            arguments
          );

      const businessYear =
        businessYearV35Safe();

      const duration =
        durationYearsV35();

      //
      // 실제 2026에서는 CAGR만 dynamic.
      //
      if (
        businessYear <= 2026 ||
        !rolloverPreviewV35
      ) {
        return rows.map(
          row => ({
            ...row,

            cagr:
              cagrFromTwrV35(
                row.twr,
                duration
              )
          })
        );
      }

      const carry =
        rolloverPreviewV35
          .carryRows || {};

      const accountBase =
        rolloverPreviewV35
          .accountBaseMan || {};

      return rows.map(
        row => {
          const prior =
            carry[row.scope];

          if (!prior) {
            return {
              ...row,

              cagr:
                cagrFromTwrV35(
                  row.twr,
                  duration
                )
            };
          }

          let currentYtd = 0;

          if (
            [
              'DC',
              '연금(1)',
              '연금(2)',
              'ISA',
              '일반계좌',
              '자녀연금'
            ].includes(
              row.scope
            )
          ) {
            const accountMap = {
              DC: 'DC',
              '연금(1)': 'P1',
              '연금(2)': 'P2',
              ISA: 'ISA',
              '일반계좌':
                'GENERAL',
              '자녀연금':
                'CHILD'
            };

            const id =
              accountMap[
                row.scope
              ];

            const value =
              Number(
                accountSummary(
                  id
                ).value
              ) || 0;

            const flow =
              annualFlow(
                acct(id),
                String(
                  businessYear
                )
              );

            currentYtd =
              liveYtdFromBaseV35(
                value,
                Number(
                  accountBase[id]
                ) || 0,
                flow
              );
          }

          const priorTwr =
            Number(
              prior.twr
            ) || 0;

          const twr =
            (
              (
                1 +
                priorTwr / 100
              ) *
              (
                1 +
                currentYtd / 100
              ) -
              1
            ) *
            100;

          return {
            ...row,

            y25:
              Number(
                prior.ytd
              ) || 0,

            y26:
              currentYtd,

            twr,

            cagr:
              cagrFromTwrV35(
                twr,
                duration
              )
          };
        }
      );
    };

  window.performanceDurationV35 =
    function () {
      const now =
        new Date();

      return {
        year:
          now.getFullYear(),

        week:
          isoWeekV35(
            now
          ),

        durationYears:
          durationYearsV35()
      };
    };

  window.setPerformanceRolloverPreviewV35 =
    function (preview) {
      if (
        !preview ||
        Number(
          preview.fromYear
        ) !== 2026 ||
        Number(
          preview.toYear
        ) !== 2027
      ) {
        throw new Error(
          '[v35] invalid Performance rollover preview'
        );
      }

      rolloverPreviewV35 =
        JSON.parse(
          JSON.stringify(
            preview
          )
        );

      return true;
    };

  window.clearPerformanceRolloverPreviewV35 =
    function () {
      rolloverPreviewV35 =
        null;

      return true;
    };

  window.getPerformanceRolloverPreviewV35 =
    function () {
      return rolloverPreviewV35;
    };
})();