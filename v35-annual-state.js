//
// Portfolio Control v3.5
// Persistent annual-state foundation.
//
// Separates:
// - businessYearV35(): calendar / DEV test year
// - activeAnnualYearV35(): last successfully transitioned annual year
//
// This module does not perform an Annual Transition.
//

(function () {
  const DEFAULT_ACTIVE_YEAR = 2026;

  function annualTransitionMetaV35() {
    const meta =
      data &&
      data.meta &&
      data.meta.annualTransitionV35;

    return (
      meta &&
      typeof meta === 'object'
        ? meta
        : null
    );
  }

  function activeAnnualYearV35() {
    const transition =
      annualTransitionMetaV35();

    const year =
      Number(
        transition &&
        transition.activeYear
      );

    if (
      Number.isInteger(year) &&
      year >= DEFAULT_ACTIVE_YEAR &&
      year <= 2100
    ) {
      return year;
    }

    return DEFAULT_ACTIVE_YEAR;
  }

  function annualTransitionStatusV35() {
    const activeYear =
      activeAnnualYearV35();

    const businessYear =
      typeof window.businessYearV35 ===
        'function'
        ? Number(
            window.businessYearV35()
          )
        : new Date().getFullYear();

    return {
      activeYear,
      businessYear,
      transitionRequired:
        Number.isInteger(businessYear) &&
        businessYear > activeYear,
      testBusinessYear:
        typeof window.getTestBusinessYearV35 ===
          'function'
          ? window.getTestBusinessYearV35()
          : null
    };
  }

  window.activeAnnualYearV35 =
    activeAnnualYearV35;

  window.annualTransitionStatusV35 =
    annualTransitionStatusV35;
})();