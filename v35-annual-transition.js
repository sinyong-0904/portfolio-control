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
    growth.years[
      String(fromYear)
    ];

  const decemberRow =
    yearRows &&
    typeof yearRows === 'object'
      ? yearRows.DEC
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

  function cloneAnnualTransitionV35(
      value
    ) {
      return value == null
        ? value
        : JSON.parse(
            JSON.stringify(value)
          );
    }

    function rollCandidateGrowthV35(
    candidate,
    toYear
  ) {
    if (
      !candidate ||
      !candidate.growthV32
    ) {
      throw new Error(
        'Candidate Growth state missing'
      );
    }

    if (
      typeof window.rollGrowthForwardV32 !==
        'function'
    ) {
      throw new Error(
        'rollGrowthForwardV32 unavailable'
      );
    }

    const originalGrowth =
      data.growthV32;

    const originalSave =
      window.save;

    try {
      data.growthV32 =
        cloneAnnualTransitionV35(
          candidate.growthV32
        );

      window.save =
        function () {};

      const ok =
        window.rollGrowthForwardV32(
          toYear,
          0
        );

      if (ok === false) {
        throw new Error(
          'Growth rollover failed'
        );
      }

      candidate.growthV32 =
        cloneAnnualTransitionV35(
          data.growthV32
        );
    } finally {
      data.growthV32 =
        originalGrowth;

      window.save =
        originalSave;
    }

    return candidate.growthV32;
  }

  function applyCandidateIncomeTaxV35(
    candidate,
    preview
  ) {
    candidate.incomeTaxHistory =
      candidate.incomeTaxHistory &&
      typeof candidate
        .incomeTaxHistory ===
        'object'
        ? candidate
            .incomeTaxHistory
        : {};

    const history =
      candidate
        .incomeTaxHistory;

    history.rows =
      Array.isArray(
        history.rows
      )
        ? history.rows
        : [];

    history.notes =
      history.notes &&
      typeof history.notes ===
        'object'
        ? history.notes
        : {};

    const nextRow =
      cloneAnnualTransitionV35(
        preview.row
      );

    const year =
      Number(
        nextRow &&
        nextRow.year
      );

    if (
      !Number.isInteger(year)
    ) {
      throw new Error(
        'Income & Tax rollover row invalid'
      );
    }

    const existingIndex =
      history.rows.findIndex(
        row =>
          Number(
            row &&
            row.year
          ) === year
      );

    if (
      existingIndex >= 0
    ) {
      history.rows[
        existingIndex
      ] = nextRow;
    } else {
      history.rows.push(
        nextRow
      );
    }

    history.notes[
      String(year)
    ] =
      preview.note == null
        ? ''
        : String(
            preview.note
          );
  }

  function buildAnnualTransitionCandidateV35(
  fromYear,
  toYear
) {
  const from =
    integerYearV35(
      fromYear
    );

  const to =
    integerYearV35(
      toYear
    );

  if (
    from == null ||
    to == null ||
    to !== from + 1
  ) {
    throw new Error(
      'Annual Transition years invalid'
    );
  }

  //
  // Mutation engine 자체의 safety gate.
  //
  // UI prerequisite를 우회해서 이 builder를
  // 직접 호출하더라도 Growth가 전년도 DEC
  // live state가 아니면 candidate를 만들지 않는다.
  //
  const growthReady =
    growthReadinessV35(
      from
    );

  if (
    !growthReady ||
    growthReady.ok !== true
  ) {
    throw new Error(
      'Annual Transition Growth not ready: ' +
      (
        growthReady &&
        growthReady.code
          ? growthReady.code
          : 'UNKNOWN'
      )
    );
  }

  if (
    typeof window
      .buildPerformanceRolloverPreviewV35 !==
      'function' ||
    typeof window
      .buildCashlikeRolloverPreviewV35 !==
      'function' ||
    typeof window
      .buildDividendRolloverPreviewV35 !==
      'function' ||
    typeof window
      .buildIncomeTaxRolloverPreviewV35 !==
      'function'
  ) {
    throw new Error(
      'Annual Transition preview builder unavailable'
    );
  }

  const performance =
    window
      .buildPerformanceRolloverPreviewV35(
        from,
        to
      );

  const cashlike =
    window
      .buildCashlikeRolloverPreviewV35(
        from,
        to
      );

  const dividend =
    window
      .buildDividendRolloverPreviewV35(
        from,
        to
      );

  const incomeTax =
    window
      .buildIncomeTaxRolloverPreviewV35(
        from,
        to
      );

  if (
    !performance ||
    !performance.carryRows ||
    !performance.accountBaseMan ||
    !performance
      .pensionBucketSnapshot ||
    !performance.pensionSnapshot
  ) {
    throw new Error(
      'Performance rollover payload invalid'
    );
  }

  if (
    !cashlike ||
    !Array.isArray(
      cashlike.rows
    )
  ) {
    throw new Error(
      'Cash-like rollover payload invalid'
    );
  }

  if (
    !dividend ||
    !dividend.nextDividends
  ) {
    throw new Error(
      'Dividend rollover payload invalid'
    );
  }

  if (
    !incomeTax ||
    !incomeTax.row
  ) {
    throw new Error(
      'Income & Tax rollover payload invalid'
    );
  }

  const candidate =
    cloneAnnualTransitionV35(
      data
    );

  //
  // Performance carry.
  //
  candidate.performanceV35 =
    candidate.performanceV35 &&
    typeof candidate
      .performanceV35 ===
      'object'
      ? candidate
          .performanceV35
      : {};

  candidate
    .performanceV35
    .carryByYear =
      candidate
        .performanceV35
        .carryByYear &&
      typeof candidate
        .performanceV35
        .carryByYear ===
        'object'
        ? candidate
            .performanceV35
            .carryByYear
        : {};

  candidate
    .performanceV35
    .carryByYear[
      String(from)
    ] = {
      rows:
        cloneAnnualTransitionV35(
          performance
            .carryRows
        )
    };

  //
  // Account next-year baselines.
  //
  const accountBase =
    performance
      .accountBaseMan;

  [
    'DC',
    'P1',
    'P2',
    'ISA',
    'GENERAL',
    'CHILD'
  ].forEach(
    id => {
      const account =
        Array.isArray(
          candidate.accounts
        )
          ? candidate
              .accounts
              .find(
                row =>
                  row &&
                  row.id === id
              )
          : null;

      if (!account) {
        throw new Error(
          'Candidate account missing: ' +
          id
        );
      }

      account[
        'base' +
        String(to)
      ] =
        Number(
          accountBase[id]
        ) || 0;
    }
  );

  candidate
    .pensionBucketSnapshot =
      cloneAnnualTransitionV35(
        performance
          .pensionBucketSnapshot
      );

  candidate
    .pensionSnapshot =
      cloneAnnualTransitionV35(
        performance
          .pensionSnapshot
      );

  //
  // Growth.
  //
  rollCandidateGrowthV35(
    candidate,
    to
  );

  //
  // Cash-like.
  //
  const cashAssets =
    Array.isArray(
      candidate.cashAssets
    )
      ? candidate.cashAssets
      : [];

  cashlike.rows.forEach(
    row => {
      const item =
        cashAssets.find(
          asset =>
            asset &&
            asset.id === row.id
        );

      if (!item) {
        throw new Error(
          'Candidate cash asset missing: ' +
          row.id
        );
      }

      item[
        'base' +
        String(to)
      ] =
        Number(
          row.nextBase
        ) || 0;

      item[
        'flow' +
        String(to)
      ] =
        Number(
          row.nextFlow
        ) || 0;
    }
  );

  //
  // Dividend live matrix becomes
  // the new year's zero matrix.
  //
  candidate.dividends =
    cloneAnnualTransitionV35(
      dividend.nextDividends
    );

  //
  // Income & Tax next-year row.
  //
  applyCandidateIncomeTaxV35(
    candidate,
    incomeTax
  );

  //
  // Transition metadata is written last.
  //
  candidate.meta =
    candidate.meta &&
    typeof candidate.meta ===
      'object'
      ? candidate.meta
      : {};

  candidate
    .meta
    .annualTransitionV35 = {
      activeYear: to,
      fromYear: from,
      toYear: to
    };

  return {
    fromYear: from,
    toYear: to,
    candidate,
    previews: {
      performance,
      cashlike,
      dividend,
      incomeTax
    }
  };
}

  function buildNextAnnualTransitionCandidateV35() {
    const years =
      annualTransitionYearsV35();

    if (
      years.fromYear == null ||
      years.toYear == null
    ) {
      throw new Error(
        'Annual Transition year state invalid'
      );
    }

    return buildAnnualTransitionCandidateV35(
      years.fromYear,
      years.toYear
    );
  }

  function annualCandidateCheckV35(
    checks,
    id,
    ok,
    details
  ) {
    checks.push({
      id,
      ok: ok === true,
      ...(
        details &&
        typeof details === 'object'
          ? details
          : {}
      )
    });
  }

  function candidateDividendsZeroV35(
    dividends
  ) {
    const months = [
      'JAN',
      'FEB',
      'MAR',
      'APR',
      'MAY',
      'JUN',
      'JUL',
      'AUG',
      'SEP',
      'OCT',
      'NOV',
      'DEC'
    ];

    if (
      !dividends ||
      typeof dividends !== 'object'
    ) {
      return false;
    }

    return months.every(
      month => {
        const row =
          dividends[month];

        if (
          !row ||
          typeof row !== 'object'
        ) {
          return false;
        }

        return Object
          .values(row)
          .every(
            value =>
              Math.abs(
                Number(value) || 0
              ) < 1e-9
          );
      }
    );
  }

  function validateAnnualTransitionCandidateV35(
    built
  ) {
    const checks = [];

    const from =
      integerYearV35(
        built &&
        built.fromYear
      );

    const to =
      integerYearV35(
        built &&
        built.toYear
      );

    const candidate =
      built &&
      built.candidate;

    annualCandidateCheckV35(
      checks,
      'years',
      from != null &&
        to != null &&
        to === from + 1,
      {
        fromYear: from,
        toYear: to
      }
    );

    annualCandidateCheckV35(
      checks,
      'candidateObject',
      !!candidate &&
        typeof candidate ===
          'object' &&
        candidate !== data
    );

    if (
      !candidate ||
      typeof candidate !== 'object' ||
      from == null ||
      to == null
    ) {
      return {
        ok: false,
        fromYear: from,
        toYear: to,
        checks
      };
    }

    const marker =
      candidate.meta &&
      candidate.meta
        .annualTransitionV35;

    annualCandidateCheckV35(
      checks,
      'annualMarker',
      !!marker &&
        Number(
          marker.activeYear
        ) === to &&
        Number(
          marker.fromYear
        ) === from &&
        Number(
          marker.toYear
        ) === to
    );

    //
    // Annual Transition must never
    // modify holdings.
    //
    annualCandidateCheckV35(
      checks,
      'holdingsUnchanged',
      JSON.stringify(
        candidate.holdings
      ) ===
      JSON.stringify(
        data.holdings
      ),
      {
        originalCount:
          Array.isArray(
            data.holdings
          )
            ? data.holdings.length
            : null,

        candidateCount:
          Array.isArray(
            candidate.holdings
          )
            ? candidate
                .holdings
                .length
            : null
      }
    );

    const accountIds = [
      'DC',
      'P1',
      'P2',
      'ISA',
      'GENERAL',
      'CHILD'
    ];

    const accountBaseKey =
      'base' + String(to);

    const accountBaseReady =
      accountIds.every(
        id => {
          const account =
            Array.isArray(
              candidate.accounts
            )
              ? candidate
                  .accounts
                  .find(
                    row =>
                      row &&
                      row.id === id
                  )
              : null;

          return (
            !!account &&
            Number.isFinite(
              Number(
                account[
                  accountBaseKey
                ]
              )
            )
          );
        }
      );

    annualCandidateCheckV35(
      checks,
      'accountBaselines',
      accountBaseReady,
      {
        key: accountBaseKey
      }
    );

    const carry =
      candidate
        .performanceV35 &&
      candidate
        .performanceV35
        .carryByYear &&
      candidate
        .performanceV35
        .carryByYear[
          String(from)
        ];

    const carryScopes =
      carry &&
      carry.rows &&
      typeof carry.rows ===
        'object'
        ? Object.keys(
            carry.rows
          )
        : [];

    annualCandidateCheckV35(
      checks,
      'performanceCarry',
      carryScopes.length === 12,
      {
        scopeCount:
          carryScopes.length
      }
    );

    const bucketSnapshot =
      candidate
        .pensionBucketSnapshot;

    const bucketScopes =
      bucketSnapshot &&
      bucketSnapshot.buckets &&
      typeof bucketSnapshot
        .buckets === 'object'
        ? Object.keys(
            bucketSnapshot
              .buckets
          )
        : [];

    annualCandidateCheckV35(
      checks,
      'pensionBucketSnapshot',
      [
        'EQUITY',
        'INCOME',
        'HEDGE',
        'PARKING'
      ].every(
        scope =>
          bucketScopes.includes(
            scope
          )
      ),
      {
        scopes:
          bucketScopes
      }
    );

    annualCandidateCheckV35(
      checks,
      'pensionSnapshot',
      !!(
        candidate
          .pensionSnapshot &&
        candidate
          .pensionSnapshot
          .groups &&
        candidate
          .pensionSnapshot
          .details
      )
    );

    const growth =
      candidate.growthV32;

    const dec =
      growth &&
      growth.years &&
      growth.years[
        String(from)
      ] &&
      growth.years[
        String(from)
      ].DEC;

    const jan =
      growth &&
      growth.years &&
      growth.years[
        String(to)
      ] &&
      growth.years[
        String(to)
      ].JAN;

    const annual =
      growth &&
      growth.annual &&
      growth.annual[
        String(from)
      ];

    annualCandidateCheckV35(
      checks,
      'growthPeriod',
      !!growth &&
        Number(
          growth.currentYear
        ) === to &&
        Number(
          growth.currentMonthIndex
        ) === 0,
      {
        currentYear:
          growth &&
          growth.currentYear,
        currentMonthIndex:
          growth &&
          growth
            .currentMonthIndex
      }
    );

    annualCandidateCheckV35(
      checks,
      'growthDecemberFinalized',
      !!dec &&
        dec.locked === true
    );

    annualCandidateCheckV35(
      checks,
      'growthAnnualBuilt',
      !!annual
    );

    annualCandidateCheckV35(
      checks,
      'growthJanuaryLive',
      !!jan &&
        jan.locked !== true
    );

    const cashBaseKey =
      'base' + String(to);

    const cashFlowKey =
      'flow' + String(to);

    const cashAssets =
      Array.isArray(
        candidate.cashAssets
      )
        ? candidate.cashAssets
        : [];

    annualCandidateCheckV35(
      checks,
      'cashBaselines',
      cashAssets.length > 0 &&
        cashAssets.every(
          item =>
            item &&
            Number.isFinite(
              Number(
                item[
                  cashBaseKey
                ]
              )
            )
        ),
      {
        count:
          cashAssets.length,
        key:
          cashBaseKey
      }
    );

    annualCandidateCheckV35(
      checks,
      'cashFlowsZero',
      cashAssets.length > 0 &&
        cashAssets.every(
          item =>
            Math.abs(
              Number(
                item &&
                item[
                  cashFlowKey
                ]
              ) || 0
            ) < 1e-9
        ),
      {
        key:
          cashFlowKey
      }
    );

    annualCandidateCheckV35(
      checks,
      'dividendsZero',
      candidateDividendsZeroV35(
        candidate.dividends
      )
    );

    const incomeRows =
      candidate
        .incomeTaxHistory &&
      Array.isArray(
        candidate
          .incomeTaxHistory
          .rows
      )
        ? candidate
            .incomeTaxHistory
            .rows
        : [];

    const nextIncomeRows =
      incomeRows.filter(
        row =>
          Number(
            row &&
            row.year
          ) === to
      );

    annualCandidateCheckV35(
      checks,
      'incomeTaxNextYear',
      nextIncomeRows.length === 1,
      {
        count:
          nextIncomeRows.length
      }
    );

    return {
      ok:
        checks.every(
          check =>
            check.ok === true
        ),
      fromYear: from,
      toYear: to,
      checks
    };
  }

  window.validateAnnualTransitionCandidateV35 =
    validateAnnualTransitionCandidateV35;
    
  window.buildAnnualTransitionCandidateV35 =
    buildAnnualTransitionCandidateV35;

  window.buildNextAnnualTransitionCandidateV35 =
    buildNextAnnualTransitionCandidateV35;
  
  window.annualTransitionYearsV35 =
    annualTransitionYearsV35;

  window.growthReadinessV35 =
    growthReadinessV35;

  window.marketReadinessV35 =
    marketReadinessV35;

  window.annualTransitionPrerequisitesV35 =
    annualTransitionPrerequisitesV35;
})();