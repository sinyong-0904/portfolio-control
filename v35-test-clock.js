//
// Portfolio Control v3.5
// DEV-only business year test seam.
// Memory only. Does not modify Date or persisted state.
//

(function () {
  let testBusinessYear = null;

  window.businessYearV35 =
    function () {
      return testBusinessYear ??
        new Date().getFullYear();
    };

  window.setTestBusinessYearV35 =
    function (year) {
      const y =
        Number(year);

      if (
        !Number.isInteger(y) ||
        y < 2026 ||
        y > 2100
      ) {
        throw new Error(
          'Invalid v3.5 test business year'
        );
      }

      testBusinessYear = y;

      console.log(
        '[v35 test clock] business year =',
        y
      );

      return y;
    };

  window.clearTestBusinessYearV35 =
    function () {
      testBusinessYear = null;

      const year =
        new Date().getFullYear();

      console.log(
        '[v35 test clock] business year reset =',
        year
      );

      return year;
    };

  window.getTestBusinessYearV35 =
    function () {
      return testBusinessYear;
    };
})();