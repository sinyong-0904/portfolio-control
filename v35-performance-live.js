//
// Portfolio Control v3.5
// Live Performance adjustments.
// Phase 3B-1: dynamic CAGR.
//

(function () {
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

    const year =
      now.getFullYear();

    const week =
      isoWeekV35(
        now
      );

    return (
      year -
      2025 +
      week / 52
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

      const duration =
        durationYearsV35();

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
})();