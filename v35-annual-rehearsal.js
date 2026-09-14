(() => {
  'use strict';

  let annualRehearsalStateV35 =
    null;

  function cloneRehearsalV35(
    value
  ) {
    if (value == null) {
      return value;
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function integerRehearsalYearV35(
    value
  ) {
    const year =
      Number(value);

    return (
      Number.isInteger(year) &&
      year >= 2000 &&
      year <= 2200
    )
      ? year
      : null;
  }

  function clearAnnualPreviewStatesV35() {
    if (
      typeof window
        .clearPerformanceRolloverPreviewV35 ===
        'function'
    ) {
      window
        .clearPerformanceRolloverPreviewV35();
    }

    if (
      typeof window
        .clearAllocationRolloverPreviewV35 ===
        'function'
    ) {
      window
        .clearAllocationRolloverPreviewV35();
    }

    if (
      typeof window
        .clearCashlikeRolloverPreviewV35 ===
        'function'
    ) {
      window
        .clearCashlikeRolloverPreviewV35();
    }

    if (
      typeof window
        .clearDividendRolloverPreviewV35 ===
        'function'
    ) {
      window
        .clearDividendRolloverPreviewV35();
    }

    if (
      typeof window
        .clearIncomeTaxRolloverPreviewV35 ===
        'function'
    ) {
      window
        .clearIncomeTaxRolloverPreviewV35();
    }
  }

  function captureAnnualMarketRehearsalV35() {
    const byCode =
      window.marketLiveState &&
      window.marketLiveState
        .byCode;

    if (
      !byCode ||
      typeof byCode !==
        'object'
    ) {
      return null;
    }

    return cloneRehearsalV35(
      byCode
    );
  }

  function applyAnnualMarketRehearsalV35(
    toYear
  ) {
    const byCode =
      window.marketLiveState &&
      window.marketLiveState
        .byCode;

    if (
      !byCode ||
      typeof byCode !==
        'object'
    ) {
      return {
        ok: false,
        code:
          'MARKET_LIVE_STATE_MISSING'
      };
    }

    let updated = 0;

    Object.keys(byCode)
      .forEach(
        code => {
          const item =
            byCode[code];

          if (
            !item ||
            typeof item !==
              'object'
          ) {
            return;
          }

          const current =
            Number(
              item.current
            );

          if (
            !Number.isFinite(
              current
            ) ||
            current <= 0
          ) {
            return;
          }

          item.yearStart =
            current;

          item.yearStartDate =
            `${toYear}-01-02`;

          updated += 1;
        }
      );

    return {
      ok:
        updated > 0,

      code:
        updated > 0
          ? 'READY'
          : 'NO_MARKET_ROWS_UPDATED',

      updated
    };
  }

  function restoreAnnualMarketRehearsalV35(
    originalByCode
  ) {
    if (
      !window.marketLiveState ||
      !originalByCode
    ) {
      return false;
    }

    window.marketLiveState
      .byCode =
        cloneRehearsalV35(
          originalByCode
        );

    return true;
  }

  async function startAnnualRolloverRehearsalV35(
    options
  ) {
    const config =
      options &&
      typeof options === 'object'
        ? options
        : {};

    if (
      annualRehearsalStateV35
    ) {
      return {
        ok: false,
        code:
          'ANNUAL_REHEARSAL_ALREADY_ACTIVE'
      };
    }

    const years =
      window
        .annualTransitionYearsV35();

    const from =
      integerRehearsalYearV35(
        config.fromYear != null
          ? config.fromYear
          : years.activeYear
      );

    const to =
      integerRehearsalYearV35(
        config.toYear != null
          ? config.toYear
          : from + 1
      );

    if (
      from == null ||
      to == null ||
      to !== from + 1
    ) {
      return {
        ok: false,
        code:
          'INVALID_TRANSITION_YEARS'
      };
    }

    const originalData =
      cloneRehearsalV35(
        data
      );

    const originalMarket =
      captureAnnualMarketRehearsalV35();

    const originalBusinessYear =
      typeof window
        .getTestBusinessYearV35 ===
        'function'
        ? window
            .getTestBusinessYearV35()
        : null;

    try {
      clearAnnualPreviewStatesV35();

      const growth =
        data.growthV32;

      const rows =
        growth &&
        growth.years &&
        growth.years[
          String(from)
        ];

      if (
        !growth ||
        !rows ||
        !rows.DEC
      ) {
        throw new Error(
          'ANNUAL_REHEARSAL_GROWTH_MISSING'
        );
      }

      if (
        !growthReadinessV35(
          from
        ).ok
      ) {
        const sourceMonth =
          rows.SEP ||
          rows.AUG ||
          rows.JUL;

        if (
          !sourceMonth ||
          !Number.isFinite(
            Number(
              sourceMonth.value
            )
          )
        ) {
          throw new Error(
            'ANNUAL_REHEARSAL_GROWTH_SOURCE_MISSING'
          );
        }

        rows.DEC = {
          ...rows.DEC,

          value:
            Number(
              sourceMonth.value
            ),

          legacy:
            Number(
              sourceMonth.legacy
            ) || 0,

          locked:
            false,

          cashChange: 0,
          totalChange: 0,
          contribution: 0,
          investmentReturn: 0,
          growth: 0
        };

        growth.currentMonthIndex =
          11;
      }

      if (
        !growthReadinessV35(
          from
        ).ok
      ) {
        throw new Error(
          'ANNUAL_REHEARSAL_GROWTH_NOT_READY'
        );
      }

      const market =
        applyAnnualMarketRehearsalV35(
          to
        );

      if (!market.ok) {
        throw new Error(
          market.code
        );
      }

      const memory =
        window
          .createMemoryAnnualPersistenceV35({
            initialState:
              originalData
          });

      const transaction =
        await window
          .executeAnnualTransitionTransactionV35({
            fromYear: from,
            toYear: to,
            persistence:
              memory
          });

      if (
        !transaction ||
        transaction.ok !== true
      ) {
        throw new Error(
          transaction
            ? transaction.code
            : 'ANNUAL_REHEARSAL_TRANSACTION_FAILED'
        );
      }

      data =
        cloneRehearsalV35(
          transaction.candidate
        );

      if (
        typeof window
          .setTestBusinessYearV35 ===
          'function'
      ) {
        window
          .setTestBusinessYearV35(
            to
          );
      }

      annualRehearsalStateV35 = {
        fromYear: from,
        toYear: to,
        originalData,
        originalMarket,
        originalBusinessYear,

        transaction: {
          code:
            transaction.code,

          validation:
            cloneRehearsalV35(
              transaction.validation
            )
        }
      };

      render();

      return {
        ok: true,
        code:
          'ANNUAL_REHEARSAL_ACTIVE',
        fromYear: from,
        toYear: to,
        market,
        validation:
          transaction.validation
      };
    } catch (error) {
      data =
        originalData;

      restoreAnnualMarketRehearsalV35(
        originalMarket
      );

      if (
        typeof window
          .clearTestBusinessYearV35 ===
          'function'
      ) {
        window
          .clearTestBusinessYearV35();
      }

      if (
        originalBusinessYear != null &&
        typeof window
          .setTestBusinessYearV35 ===
          'function'
      ) {
        window
          .setTestBusinessYearV35(
            originalBusinessYear
          );
      }

      clearAnnualPreviewStatesV35();

      render();

      return {
        ok: false,
        code:
          'ANNUAL_REHEARSAL_FAILED',

        error:
          String(
            error &&
            error.message
              ? error.message
              : error
          )
      };
    }
  }

  function stopAnnualRolloverRehearsalV35() {
    const state =
      annualRehearsalStateV35;

    if (!state) {
      return {
        ok: false,
        code:
          'ANNUAL_REHEARSAL_NOT_ACTIVE'
      };
    }

    data =
      cloneRehearsalV35(
        state.originalData
      );

    restoreAnnualMarketRehearsalV35(
      state.originalMarket
    );

    clearAnnualPreviewStatesV35();

    if (
      typeof window
        .clearTestBusinessYearV35 ===
        'function'
    ) {
      window
        .clearTestBusinessYearV35();
    }

    if (
      state.originalBusinessYear !=
        null &&
      typeof window
        .setTestBusinessYearV35 ===
        'function'
    ) {
      window
        .setTestBusinessYearV35(
          state.originalBusinessYear
        );
    }

    annualRehearsalStateV35 =
      null;

    render();

    return {
      ok: true,
      code:
        'ANNUAL_REHEARSAL_STOPPED',

      activeYear:
        activeAnnualYearV35()
    };
  }

  function annualRolloverRehearsalStateV35() {
    if (
      !annualRehearsalStateV35
    ) {
      return null;
    }

    return {
      active: true,

      fromYear:
        annualRehearsalStateV35
          .fromYear,

      toYear:
        annualRehearsalStateV35
          .toYear
    };
  }

  window.startAnnualRolloverRehearsalV35 =
    startAnnualRolloverRehearsalV35;

  window.stopAnnualRolloverRehearsalV35 =
    stopAnnualRolloverRehearsalV35;

  window.annualRolloverRehearsalStateV35 =
    annualRolloverRehearsalStateV35;
})();