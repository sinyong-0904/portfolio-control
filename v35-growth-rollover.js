//
// Portfolio Control v3.5
// Growth rollover adapter.
// Reuses the existing v3.2 rollover implementation.
//

(function () {
  window.rollGrowthForward =
    function () {
      if (
        typeof window.rollGrowthForwardV32 !==
        'function'
      ) {
        throw new Error(
          'rollGrowthForwardV32 is not available'
        );
      }

      const now =
        new Date();

      return window.rollGrowthForwardV32(
        now.getFullYear(),
        now.getMonth()
      );
    };

  window.testGrowthYearRolloverV35 =
    function () {
      if (
        typeof window.rollGrowthForwardV32 !==
        'function'
      ) {
        throw new Error(
          'rollGrowthForwardV32 is not available'
        );
      }

      const originalGrowth =
        data.growthV32;

      const originalSave =
        window.save;

      if (!originalGrowth) {
        throw new Error(
          'growthV32 state is not available'
        );
      }

      const testGrowth =
        JSON.parse(
          JSON.stringify(
            originalGrowth
          )
        );

      try {
        data.growthV32 =
          testGrowth;

        window.save =
          function () {
            console.log(
              '[v35 dry-run] save blocked'
            );
          };

        testGrowth.currentYear =
          2026;

        testGrowth.currentMonthIndex =
          11;

        if (!testGrowth.years) {
          testGrowth.years = {};
        }

        if (!testGrowth.years['2026']) {
          throw new Error(
            '2026 Growth rows not available'
          );
        }

        const months = [
          'JAN','FEB','MAR','APR',
          'MAY','JUN','JUL','AUG',
          'SEP','OCT','NOV','DEC'
        ];

        const dec =
          testGrowth.years['2026'].DEC;

        if (!dec) {
          throw new Error(
            '2026 DEC row not available'
          );
        }

        dec.contribution =
          Number(dec.contribution) || 0;

        dec.cashChange =
          Number(dec.cashChange) || 0;

        dec.locked =
          false;

        const n =
          netSummary();

        testGrowth.currentStart = {
          investmentValue:
            n.inv.value,
          legacyValue:
            n.legacy.value,
          totalValue:
            n.total
        };

        window.rollGrowthForwardV32(
          2027,
          0
        );

        const jan =
          testGrowth.years['2027'] &&
          testGrowth.years['2027'].JAN;

        const futureRows =
          testGrowth.years['2027']
            ? months
                .slice(1)
                .map(
                  month =>
                    testGrowth
                      .years['2027'][
                        month
                      ]
                )
            : [];

        const result = {
          currentYear:
            testGrowth.currentYear,

          currentMonthIndex:
            testGrowth.currentMonthIndex,

          annual2026:
            testGrowth.annual &&
            testGrowth.annual['2026'],

          jan2027:
            jan,

          janManualZero:
            !!jan &&
            Number(
              jan.contribution
            ) === 0 &&
            Number(
              jan.cashChange
            ) === 0,

          futureManualZero:
            futureRows.length === 11 &&
            futureRows.every(
              row =>
                row &&
                Number(
                  row.contribution
                ) === 0 &&
                Number(
                  row.cashChange
                ) === 0
            ),

          futureCalculatedBlank:
            futureRows.length === 11 &&
            futureRows.every(
              row =>
                row &&
                row.investmentReturn ==
                  null &&
                row.legacy == null &&
                row.totalChange == null &&
                row.value == null
            ),

          annualYears:
            Object.keys(
              testGrowth.annual || {}
            )
              .map(Number)
              .sort(
                (a, b) =>
                  b - a
              )
        };

        console.table({
          currentYear: {
            value:
              result.currentYear,
            expected: 2027
          },

          currentMonthIndex: {
            value:
              result.currentMonthIndex,
            expected: 0
          },

          annual2026Created: {
            value:
              !!result.annual2026,
            expected: true
          },

          janManualZero: {
            value:
              result.janManualZero,
            expected: true
          },

          futureManualZero: {
            value:
              result.futureManualZero,
            expected: true
          },

          futureCalculatedBlank: {
            value:
              result.futureCalculatedBlank,
            expected: true
          }
        });

        console.log(
          '[v35 dry-run] result',
          result
        );

        return result;
      } finally {
        data.growthV32 =
          originalGrowth;

        window.save =
          originalSave;
      }
    };
})();