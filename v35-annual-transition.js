//
// Portfolio Control v3.5
// Phase 8 - Actual Annual Transition.
//
// Patch 8C:
// - prerequisite evaluation only
// - no portfolio mutation
// - no Save / Supabase write
//

(function () {
  function integerYearV35(value) {
    const year = Number(value);

    return (
      Number.isInteger(year) &&
      year >= 2026 &&
      year <= 2100
        ? year
        : null
    );
  }

  function annualTransitionYearsV35() {
    const activeYear =
      typeof window.activeAnnualYearV35 ===
        'function'
        ? integerYearV35(
            window.activeAnnualYearV35()
          )
        : null;

    const businessYear =
      typeof window.businessYearV35 ===
        'function'
        ? integerYearV35(
            window.businessYearV35()
          )
        : integerYearV35(
            new Date().getFullYear()
          );

    return {
      activeYear,
      businessYear,
      fromYear: activeYear,
      toYear:
        activeYear == null
          ? null
          : activeYear + 1
    };
  }

  function growthReadinessV35(
    fromYear
  ) {
    const growth =
      data &&
      data.growthV32;

    if (
      !growth ||
      typeof growth !== 'object'
    ) {
      return {
        ok: false,
        code: 'GROWTH_STATE_MISSING'
      };
    }

    const currentYear =
      integerYearV35(
        growth.currentYear
      );

    const currentMonthIndex =
      Number(
        growth.currentMonthIndex
      );

    if (
      currentYear !== fromYear ||
      currentMonthIndex !== 11
    ) {
      return {
        ok: false,
        code: 'GROWTH_DEC_NOT_READY',
        currentYear,
        currentMonthIndex
      };
    }

    const yearRows =
      growth.years &&
      growth.years[String(fromYear)];

    const decemberRow =
      Array.isArray(yearRows)
        ? yearRows[11]
        : null;

    if (
      !decemberRow ||
      typeof decemberRow !== 'object'
    ) {
      return {
        ok: false,
        code: 'GROWTH_DEC_ROW_MISSING',
        currentYear,
        currentMonthIndex
      };
    }

    return {
      ok: true,
      code: 'READY',
      currentYear,
      currentMonthIndex,
      decemberLocked:
        decemberRow.locked === true
    };
  }

  function marketReadinessV35(
  toYear
) {
  const state =
    window.marketLiveState;

  if (
    !state ||
    typeof state !== 'object'
  ) {
    return {
      ok: false,
      code: 'MARKET_STATE_MISSING'
    };
  }

  const byCode =
    state.byCode &&
    typeof state.byCode === 'object'
      ? state.byCode
      : {};

  const holdings =
    data &&
    Array.isArray(data.holdings)
      ? data.holdings
      : [];

  const requiredCodes =
    new Set(
      holdings
        .filter(function (holding) {
          return (
            holding &&
            holding.status === 'Active'
          );
        })
        .map(function (holding) {
          return String(
            holding.code || ''
          ).trim();
        })
        .filter(Boolean)
    );

  if (!requiredCodes.size) {
    return {
      ok: false,
      code: 'MARKET_REQUIRED_CODES_MISSING',
      checked: 0
    };
  }

  const missing = [];
  const notReady = [];

  requiredCodes.forEach(function (code) {
    const row =
      byCode[code];

    if (
      !row ||
      typeof row !== 'object'
    ) {
      missing.push(code);
      return;
    }

    const yearStart =
      Number(row.yearStart);

    const yearStartDate =
      String(
        row.yearStartDate || ''
      );

    if (
      !Number.isFinite(yearStart) ||
      yearStart <= 0 ||
      !yearStartDate.startsWith(
        String(toYear) + '-'
      )
    ) {
      notReady.push(code);
    }
  });

  if (missing.length) {
    return {
      ok: false,
      code: 'MARKET_ROWS_MISSING',
      checked: requiredCodes.size,
      missing
    };
  }

  return {
    ok: notReady.length === 0,
    code:
      notReady.length === 0
        ? 'READY'
        : 'MARKET_YEAR_START_NOT_READY',
    checked: requiredCodes.size,
    notReady
  };
}

  function annualTransitionPrerequisitesV35(
    confirmations
  ) {
    const years =
      annualTransitionYearsV35();

    const checks = [];

    const validYears =
      years.activeYear != null &&
      years.businessYear != null;

    checks.push({
      id: 'years',
      ok: validYears,
      code:
        validYears
          ? 'READY'
          : 'INVALID_YEAR_STATE'
    });

    const nextYear =
      validYears &&
      years.businessYear ===
        years.activeYear + 1;

    checks.push({
      id: 'nextYear',
      ok: nextYear,
      code:
        nextYear
          ? 'READY'
          : 'NOT_NEXT_BUSINESS_YEAR'
    });

    const testBusinessYear =
      typeof window.getTestBusinessYearV35 ===
        'function'
        ? window.getTestBusinessYearV35()
        : null;

    checks.push({
      id: 'productionClock',
      ok: testBusinessYear == null,
      code:
        testBusinessYear == null
          ? 'READY'
          : 'TEST_CLOCK_ACTIVE'
    });

    if (years.fromYear != null) {
      const growth =
        growthReadinessV35(
          years.fromYear
        );

      checks.push({
        id: 'growth',
        ...growth
      });
    } else {
      checks.push({
        id: 'growth',
        ok: false,
        code: 'INVALID_FROM_YEAR'
      });
    }

    if (years.toYear != null) {
      const market =
        marketReadinessV35(
          years.toYear
        );

      checks.push({
        id: 'market',
        ...market
      });
    } else {
      checks.push({
        id: 'market',
        ok: false,
        code: 'INVALID_TO_YEAR'
      });
    }

    const c =
      confirmations &&
      typeof confirmations === 'object'
        ? confirmations
        : {};

    [
      'performanceSnapshot',
      'growthDividendSnapshot',
      'cashLikeSnapshot',
      'backup'
    ].forEach(function (id) {
      checks.push({
        id,
        ok: c[id] === true,
        code:
          c[id] === true
            ? 'CONFIRMED'
            : 'USER_CONFIRMATION_REQUIRED'
      });
    });

    return {
      ...years,
      checks,
      ready:
        checks.every(function (check) {
          return check.ok === true;
        })
    };
  }

  window.annualTransitionYearsV35 =
    annualTransitionYearsV35;

  window.growthReadinessV35 =
    growthReadinessV35;

  window.marketReadinessV35 =
    marketReadinessV35;

  window.annualTransitionPrerequisitesV35 =
    annualTransitionPrerequisitesV35;
})();