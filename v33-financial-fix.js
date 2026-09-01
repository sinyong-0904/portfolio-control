// Portfolio Control v3.3 - Financial Assets composition hotfix
// Load AFTER v33-dashboard.js.

(function () {

  function finiteNumberV33(value) {
    const n = Number(value);
    return Number.isFinite(n)
      ? n
      : null;
  }


  function toManV33(value) {
    const n =
      finiteNumberV33(value);

    if (n == null) {
      return null;
    }

    // KRW 단위면 만원으로 변환.
    // 이미 만원 단위라면 그대로 사용.
    return Math.abs(n) >= 10000000
      ? n / 10000
      : n;
  }


  function formatManFixV33(value) {
    const n =
      finiteNumberV33(value);

    if (n == null) {
      return '-';
    }

    if (Math.abs(n) >= 10000) {
      return `${(n / 10000).toFixed(2)}억`;
    }

    return (
      `${Math.round(n)
        .toLocaleString('ko-KR')}만원`
    );
  }


  function preferredValueV33(obj) {

    if (
      !obj ||
      typeof obj !== 'object'
    ) {
      return null;
    }


    const preferredKeys = [
      'value',
      'currentValue',
      'marketValue',
      'evaluation',
      'eval',

      'valueKRW',
      'currentValueKRW',
      'marketValueKRW',
      'evaluationKRW',
      'evalKRW',

      'totalValue',
      'totalValueKRW'
    ];


    for (
      const key of preferredKeys
    ) {

      if (
        !Object.prototype
          .hasOwnProperty
          .call(
            obj,
            key
          )
      ) {
        continue;
      }


      const n =
        finiteNumberV33(
          obj[key]
        );


      if (n != null) {
        return n;
      }
    }


    return null;
  }


  function accountValueFixV33(id) {

    //
    // 1순위:
    // 기존 앱의 accountValue()
    //

    try {

      if (
        typeof accountValue ===
        'function'
      ) {

        const n =
          finiteNumberV33(
            accountValue(id)
          );


        if (n != null) {
          return n;
        }
      }

    } catch (e) {

      console.warn(
        '[v33] accountValue failed:',
        id,
        e
      );
    }


    //
    // 2순위:
    // 기존 accountSummary()
    //

    try {

      if (
        typeof accountSummary ===
        'function'
      ) {

        const n =
          preferredValueV33(
            accountSummary(id)
          );


        if (n != null) {
          return n;
        }
      }

    } catch (e) {

      console.warn(
        '[v33] accountSummary failed:',
        id,
        e
      );
    }


    return null;
  }


  function investmentValueManFixV33() {

    //
    // 투자계좌
    // = DC + P1 + P2 + ISA
    // + GENERAL + CHILD
    //

    try {

      if (
        typeof INVESTMENT_IDS !==
          'undefined' &&
        Array.isArray(
          INVESTMENT_IDS
        )
      ) {

        const values =
          INVESTMENT_IDS.map(
            accountValueFixV33
          );


        if (
          values.every(
            value =>
              value != null
          )
        ) {

          return toManV33(
            values.reduce(
              (
                sum,
                value
              ) =>
                sum + value,
              0
            )
          );
        }
      }

    } catch (e) {

      console.warn(
        '[v33] investment account sum failed',
        e
      );
    }


    //
    // fallback:
    // 기존 aggregateSummary()
    //

    try {

      if (
        typeof aggregateSummary ===
          'function' &&
        typeof INVESTMENT_IDS !==
          'undefined'
      ) {

        const n =
          preferredValueV33(
            aggregateSummary(
              INVESTMENT_IDS
            )
          );


        if (n != null) {
          return toManV33(n);
        }
      }

    } catch (e) {

      console.warn(
        '[v33] investment aggregate failed',
        e
      );
    }


    return null;
  }


  function samsungPrefValueManFixV33() {

    //
    // 기존 삼성전자우 계좌 계산
    //

    const value =
      accountValueFixV33(
        'SAMSUNG_PREF'
      );


    if (value != null) {
      return toManV33(value);
    }


    //
    // fallback:
    // account object의 manual value
    //

    try {

      const a =
        typeof acct ===
          'function'

          ? acct(
              'SAMSUNG_PREF'
            )

          : null;


      if (
        a &&
        typeof a === 'object'
      ) {

        const n =
          preferredValueV33(a);


        if (n != null) {
          return toManV33(n);
        }


        const manual =
          finiteNumberV33(
            a.manualValueKRW
          );


        if (manual != null) {
          return toManV33(
            manual
          );
        }
      }

    } catch (e) {

      console.warn(
        '[v33] SAMSUNG_PREF fallback failed',
        e
      );
    }


    return null;
  }


  function totalValueManFixV33() {

    //
    // 전체 금융자산은
    // 기존 앱의 netSummary()를 그대로 사용.
    //

    try {

      if (
        typeof netSummary ===
        'function'
      ) {

        const net =
          netSummary();


        if (
          net &&
          typeof net === 'object'
        ) {

          const keys = [
            'totalValue',
            'total',
            'value',
            'financialValue',
            'totalValueKRW'
          ];


          for (
            const key of keys
          ) {

            if (
              !Object.prototype
                .hasOwnProperty
                .call(
                  net,
                  key
                )
            ) {
              continue;
            }


            const n =
              finiteNumberV33(
                net[key]
              );


            if (n != null) {
              return toManV33(n);
            }
          }
        }
      }

    } catch (e) {

      console.warn(
        '[v33] netSummary failed',
        e
      );
    }


    return null;
  }


  function snapshotFixV33() {

    const total =
      totalValueManFixV33();

    const investment =
      investmentValueManFixV33();

    const legacy =
      samsungPrefValueManFixV33();


    if (
      total == null ||
      investment == null ||
      legacy == null
    ) {

      console.warn(
        '[v33] Financial Assets patch could not resolve values',
        {
          total,
          investment,
          legacy
        }
      );

      return null;
    }


    //
    // 예금성자금은 잔여값.
    //
    // 전체
    // = 투자계좌
    // + 예금성자금
    // + 삼성전자우
    //
    // 따라서 Overview의 세 조각 합은
    // 항상 전체와 일치한다.
    //

    let cash =
      total -
      investment -
      legacy;


    if (
      Math.abs(cash) <
      0.0001
    ) {
      cash = 0;
    }


    if (cash < 0) {

      console.warn(
        '[v33] Financial Assets composition mismatch',
        {
          total,
          investment,
          cash,
          legacy
        }
      );
    }


    return {
      total,
      investment,
      cash,
      legacy
    };
  }


  function updateKpiFixV33(
    snapshot
  ) {

    const cards =
      document.querySelectorAll(
        '.v33-overview-kpi'
      );


    if (
      cards.length < 4
    ) {
      return false;
    }


    const items = [

      {
        value:
          snapshot.total,

        ratio: 1,

        total: true
      },


      {
        value:
          snapshot.investment,

        ratio:
          snapshot.total
            ? snapshot.investment /
              snapshot.total
            : 0
      },


      {
        value:
          snapshot.cash,

        ratio:
          snapshot.total
            ? snapshot.cash /
              snapshot.total
            : 0
      },


      {
        value:
          snapshot.legacy,

        ratio:
          snapshot.total
            ? snapshot.legacy /
              snapshot.total
            : 0
      }
    ];


    items.forEach(
      (
        item,
        index
      ) => {

        const valueEl =
          cards[index]
            .querySelector(
              '.v33-overview-kpi-value'
            );


        const subEl =
          cards[index]
            .querySelector(
              '.v33-overview-kpi-sub'
            );


        if (valueEl) {

          valueEl.textContent =
            formatManFixV33(
              item.value
            );
        }


        if (subEl) {

          subEl.textContent =
            item.total

              ? '현재 금융자산 합계'

              : (
                  `전체의 ${(
                    item.ratio *
                    100
                  ).toFixed(1)}%`
                );
        }
      }
    );


    return true;
  }


  function updateDonutFixV33(
    snapshot
  ) {

    const parts = [

      {
        value:
          Math.max(
            0,
            snapshot.investment
          )
      },

      {
        value:
          Math.max(
            0,
            snapshot.cash
          )
      },

      {
        value:
          Math.max(
            0,
            snapshot.legacy
          )
      }
    ];


    const sum =
      parts.reduce(
        (
          total,
          item
        ) =>
          total +
          item.value,
        0
      ) || 1;


    const circles =
      document.querySelectorAll(
        '.v33-donut-segment'
      );


    const legendRows =
      document.querySelectorAll(
        '.v33-donut-legend-row'
      );


    const center =
      document.querySelector(
        '.v33-donut-center strong'
      );


    let offset = 0;


    parts.forEach(
      (
        part,
        index
      ) => {

        const ratio =
          part.value /
          sum;


        const length =
          ratio * 100;


        if (
          circles[index]
        ) {

          circles[index]
            .setAttribute(
              'stroke-dasharray',
              `${length} ${
                100 - length
              }`
            );


          circles[index]
            .setAttribute(
              'stroke-dashoffset',
              `${-offset}`
            );
        }


        if (
          legendRows[index]
        ) {

          const strong =
            legendRows[index]
              .querySelector('b');


          const spans =
            legendRows[index]
              .querySelectorAll(
                'span'
              );


          const ratioEl =
            spans.length
              ? spans[
                  spans.length - 1
                ]
              : null;


          if (strong) {

            strong.textContent =
              formatManFixV33(
                part.value
              );
          }


          if (ratioEl) {

            ratioEl.textContent =
              `${(
                ratio *
                100
              ).toFixed(1)}%`;
          }
        }


        offset += length;
      }
    );


    if (center) {

      center.textContent =
        formatManFixV33(
          snapshot.total
        );
    }
  }


  function applyFinancialFixV33() {

    const snapshot =
      snapshotFixV33();


    if (!snapshot) {
      return false;
    }


    if (
      !updateKpiFixV33(
        snapshot
      )
    ) {
      return false;
    }


    updateDonutFixV33(
      snapshot
    );


    //
    // 추후 검증/통합용 runtime snapshot
    //

    window
      .financialSnapshotRuntimeV33 =
      snapshot;


    return true;
  }


  window.applyFinancialFixV33 =
    applyFinancialFixV33;


  //
  // 기존 render가 끝난 직후
  // 화면 숫자만 교정.
  //

  if (
    typeof render ===
    'function'
  ) {

    const renderBeforeFinancialFixV33 =
      render;


    render =
      function () {

        const result =
          renderBeforeFinancialFixV33
            .apply(
              this,
              arguments
            );


        applyFinancialFixV33();


        return result;
      };
  }


  window.addEventListener(
    'portfolio:market-loaded',
    applyFinancialFixV33
  );


  window.addEventListener(
    'portfolio:market-refreshed',
    applyFinancialFixV33
  );


  window.addEventListener(
    'load',
    () =>
      setTimeout(
        applyFinancialFixV33,
        0
      )
  );


  console.info(
    '[Portfolio Control] v3.3 Financial Assets fix loaded'
  );

})();