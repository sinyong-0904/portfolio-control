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
})();