(() => {
  'use strict';

  function cloneAnnualPersistenceV35(
    value
  ) {
    if (value == null) {
      return value;
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function integerAnnualPersistenceYearV35(
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

  function annualPersistedStateComparableV35(
    value
  ) {
    const copy =
      cloneAnnualPersistenceV35(
        value
      );

    if (
      copy &&
      copy.meta &&
      typeof copy.meta ===
        'object'
    ) {
      delete copy.meta
        .lastSavedAt;
    }

    return copy;
  }

  function annualPersistedStatesEqualV35(
    left,
    right
  ) {
    return window
      .annualStatesEqualV35(
        annualPersistedStateComparableV35(
          left
        ),
        annualPersistedStateComparableV35(
          right
        )
      );
  }

  async function readAnnualPortfolioStateCloudV35() {
    if (
      !sb ||
      !currentUser
    ) {
      throw new Error(
        'ANNUAL_CLOUD_NOT_READY'
      );
    }

    const response =
      await sb
        .from(
          'portfolio_state'
        )
        .select(
          'data'
        )
        .eq(
          'user_id',
          currentUser.id
        )
        .maybeSingle();

    if (
      response.error
    ) {
      throw response.error;
    }

    if (
      !response.data ||
      !response.data.data ||
      typeof response.data.data !==
        'object'
    ) {
      throw new Error(
        'ANNUAL_CLOUD_STATE_MISSING'
      );
    }

    return cloneAnnualPersistenceV35(
      response.data.data
    );
  }

  function createProductionAnnualPersistenceV35() {
    return {
      kind:
        'production-cloud',

      statesEqual:
        annualPersistedStatesEqualV35,

      async preflight() {
        try {
          await readAnnualPortfolioStateCloudV35();

          return (
            cloudReady === true &&
            !!currentUser &&
            !!sb &&
            cloudBusy === false
          );
        } catch (error) {
          return false;
        }
      },

      async write(
        value
      ) {
        if (
          cloudReady !== true ||
          !currentUser ||
          !sb ||
          cloudBusy !== false
        ) {
          return false;
        }

        data =
          cloneAnnualPersistenceV35(
            value
          );

        const result =
          await flushCloud();

        return result === true;
      },

      async read() {
        return await
          readAnnualPortfolioStateCloudV35();
      },

      async rollback(
        original
      ) {
        if (
          !currentUser ||
          !sb ||
          cloudBusy !== false
        ) {
          return false;
        }

        data =
          cloneAnnualPersistenceV35(
            original
          );

        const result =
          await flushCloud();

        return result === true;
      }
    };
  }

  async function executeProductionAnnualTransitionV35(
    options
  ) {
    const config =
      options &&
      typeof options === 'object'
        ? options
        : {};

    const from =
      integerAnnualPersistenceYearV35(
        config.fromYear
      );

    const to =
      integerAnnualPersistenceYearV35(
        config.toYear
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

    const years =
      window
        .annualTransitionYearsV35();

    const businessYear =
      integerAnnualPersistenceYearV35(
        years &&
        years.businessYear
      );

    const activeYear =
      integerAnnualPersistenceYearV35(
        years &&
        years.activeYear
      );

    if (
      businessYear !==
        activeYear + 1 ||
      from !== activeYear ||
      to !== businessYear
    ) {
      return {
        ok: false,
        code:
          'PRODUCTION_YEAR_NOT_READY',
        activeYear,
        businessYear,
        fromYear: from,
        toYear: to
      };
    }

    const marker =
      data &&
      data.meta &&
      data.meta
        .annualTransitionV35;

    if (
      activeYear >= to ||
      (
        marker &&
        Number(
          marker.fromYear
        ) === from &&
        Number(
          marker.toYear
        ) === to &&
        Number(
          marker.activeYear
        ) >= to
      )
    ) {
      return {
        ok: false,
        code:
          'ANNUAL_TRANSITION_ALREADY_APPLIED',
        activeYear,
        marker:
          cloneAnnualPersistenceV35(
            marker
          )
      };
    }

    const prerequisites =
      window
        .annualTransitionPrerequisitesV35(
          config.confirmations
        );

    if (
      !prerequisites ||
      prerequisites.ready !== true
    ) {
      return {
        ok: false,
        code:
          'ANNUAL_TRANSITION_NOT_READY',
        prerequisites
      };
    }

    const original =
      cloneAnnualPersistenceV35(
        data
      );

    const persistence =
      createProductionAnnualPersistenceV35();

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          650
        )
    );

    if (
      cloudBusy !== false
    ) {
      return {
        ok: false,
        code:
          'ANNUAL_CLOUD_BUSY'
      };
    }

    let cloudBefore;

    try {
      cloudBefore =
        await persistence.read();
    } catch (error) {
      return {
        ok: false,
        code:
          'ANNUAL_CLOUD_PREFLIGHT_FAILED',
        error:
          String(
            error &&
            error.message
              ? error.message
              : error
          )
      };
    }

    if (
      !annualPersistedStatesEqualV35(
        cloudBefore,
        original
      )
    ) {
      return {
        ok: false,
        code:
          'ANNUAL_CLOUD_BROWSER_MISMATCH'
      };
    }

    const preflight =
      await persistence.preflight();

    if (
      preflight !== true
    ) {
      return {
        ok: false,
        code:
          'ANNUAL_CLOUD_NOT_READY'
      };
    }

    let transaction;

    try {
      transaction =
        await window
          .executeAnnualTransitionTransactionV35({
            fromYear: from,
            toYear: to,
            persistence
          });
    } catch (error) {
      data =
        cloneAnnualPersistenceV35(
          original
        );

      return {
        ok: false,
        code:
          'ANNUAL_TRANSACTION_EXCEPTION',
        error:
          String(
            error &&
            error.message
              ? error.message
              : error
          )
      };
    }

    if (
      !transaction ||
      transaction.ok !== true
    ) {
      if (
        !transaction ||
        transaction.code !==
          'CRITICAL_ROLLBACK_FAILED'
      ) {
        data =
          cloneAnnualPersistenceV35(
            original
          );
      }

      return {
        ok: false,
        code:
          transaction
            ? transaction.code
            : 'ANNUAL_TRANSACTION_FAILED',
        transaction
      };
    }

    data =
      cloneAnnualPersistenceV35(
        transaction.candidate
      );

    render();

    return {
      ok: true,
      code:
        'ANNUAL_TRANSITION_COMMITTED',
      fromYear: from,
      toYear: to,
      validation:
        transaction.validation
    };
  }

  window.readAnnualPortfolioStateCloudV35 =
    readAnnualPortfolioStateCloudV35;

  window.annualPersistedStatesEqualV35 =
    annualPersistedStatesEqualV35;

  window.createProductionAnnualPersistenceV35 =
    createProductionAnnualPersistenceV35;

  window.executeProductionAnnualTransitionV35 =
    executeProductionAnnualTransitionV35;
})();