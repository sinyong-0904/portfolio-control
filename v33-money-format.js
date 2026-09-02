// Portfolio Control v3.3
// Money display formatter
//
// Large summary values:
// 10.03억 -> 10억 263만원
// 4.36억  -> 4억 3,6xx만원
// 8,527만원 -> 8,527만원
//
// Display only. No portfolio calculation is changed.

(function () {

  function finiteMoneyV33(value) {
    const n = Number(value);

    return Number.isFinite(n)
      ? n
      : null;
  }


  //
  // Input unit: 만원
  //

  function formatEokManV33(
    valueMan
  ) {

    const raw =
      finiteMoneyV33(
        valueMan
      );


    if (raw == null) {
      return '-';
    }


    const rounded =
      Math.round(raw);


    const negative =
      rounded < 0;


    const abs =
      Math.abs(
        rounded
      );


    const eok =
      Math.floor(
        abs / 10000
      );


    const man =
      abs % 10000;


    let text = '';


    if (eok > 0) {

      text +=
        `${eok.toLocaleString(
          'ko-KR'
        )}억`;


      if (man > 0) {

        text +=
          ` ${man.toLocaleString(
            'ko-KR'
          )}만원`;
      }

    } else {

      text =
        `${man.toLocaleString(
          'ko-KR'
        )}만원`;
    }


    return negative
      ? `-${text}`
      : text;
  }


  //
  // Input unit: KRW
  //

  function formatKrwEokManV33(
    valueKrw
  ) {

    const n =
      finiteMoneyV33(
        valueKrw
      );


    if (n == null) {
      return '-';
    }


    return formatEokManV33(
      n / 10000
    );
  }


  window.formatEokManV33 =
    formatEokManV33;

  window.formatKrwEokManV33 =
    formatKrwEokManV33;


  //
  // ------------------------------------------------------------
  // Overview Financial Assets
  // ------------------------------------------------------------
  //
  // v33-financial-fix.js already exposes:
  //
  // window.financialSnapshotRuntimeV33
  //
  // unit = 만원
  //

  function updateFinancialMoneyV33() {

    const s =
      window
        .financialSnapshotRuntimeV33;


    if (!s) {
      return false;
    }


    const values = [
      s.total,
      s.investment,
      s.cash,
      s.legacy
    ];


    const cards =
      document.querySelectorAll(
        '.v33-overview-kpi'
      );


    if (
      cards.length >= 4
    ) {

      values.forEach(
        (
          value,
          index
        ) => {

          const el =
            cards[index]
              .querySelector(
                '.v33-overview-kpi-value'
              );


          if (el) {

            el.textContent =
              formatEokManV33(
                value
              );
          }
        }
      );
    }


    //
    // Donut center
    //

    const center =
      document.querySelector(
        '.v33-donut-center strong'
      );


    if (center) {

      center.textContent =
        formatEokManV33(
          s.total
        );
    }


    //
    // Donut legend
    //

    const legendRows =
      document.querySelectorAll(
        '.v33-donut-legend-row'
      );


    const legendValues = [
      s.investment,
      s.cash,
      s.legacy
    ];


    legendValues.forEach(
      (
        value,
        index
      ) => {

        const strong =
          legendRows[index]
            ?.querySelector('b');


        if (strong) {

          strong.textContent =
            formatEokManV33(
              value
            );
        }
      }
    );


    return true;
  }


  //
  // ------------------------------------------------------------
  // Account / Holdings summary cards
  // ------------------------------------------------------------
  //
  // Do not parse the rounded "2.13억" text.
  // Resolve the actual account value again from the
  // portfolio calculation and only replace display text.
  //

  function accountValueKrwV33(
    id
  ) {

    try {

      if (
        typeof accountValue ===
        'function'
      ) {

        const value =
          finiteMoneyV33(
            accountValue(id)
          );


        if (value != null) {
          return value;
        }
      }

    } catch (e) {
      // fallback below
    }


    try {

      if (
        typeof accountSummary ===
        'function'
      ) {

        const summary =
          accountSummary(id);


        const candidates = [
          'value',
          'totalValue',
          'marketValue',
          'evaluation',
          'eval'
        ];


        for (
          const key of candidates
        ) {

          const value =
            finiteMoneyV33(
              summary?.[key]
            );


          if (value != null) {
            return value;
          }
        }
      }

    } catch (e) {
      // leave original UI unchanged
    }


    return null;
  }


  function accountNameMapV33() {

    const result = [];


    (data.accounts || [])
      .forEach(
        account => {

          if (!account?.id) {
            return;
          }


          const labels =
            new Set();


          [
            account.name,
            account.label,
            account.title
          ]
            .filter(Boolean)
            .forEach(
              label =>
                labels.add(
                  String(label)
                    .trim()
                )
            );


          //
          // Known UI labels
          //

          const known = {
            DC: [
              'DC'
            ],

            P1: [
              '개인연금1',
              '개인연금(1)',
              '연금(1)'
            ],

            P2: [
              '개인연금2',
              '개인연금(2)',
              '연금(2)'
            ],

            ISA: [
              'ISA'
            ],

            GENERAL: [
              '일반계좌'
            ],

            CHILD: [
              '자녀연금',
              '서현서진연금'
            ],

            SAMSUNG_PREF: [
              '삼성전자우',
              '삼전우'
            ]
          };


          (
            known[
              account.id
            ] || []
          )
            .forEach(
              label =>
                labels.add(label)
            );


          result.push({
            id:
              account.id,

            labels:
              Array.from(
                labels
              )
          });
        }
      );


    return result;
  }


  function textMatchesAccountV33(
    text,
    labels
  ) {

    const normalized =
      String(
        text || ''
      )
        .replace(/\s+/g, '')
        .toLowerCase();


    if (!normalized) {
      return false;
    }


    return labels.some(
      label => {

        const target =
          String(label)
            .replace(/\s+/g, '')
            .toLowerCase();


        return (
          target &&
          normalized.includes(
            target
          )
        );
      }
    );
  }


  function findEvaluationValueElementV33(
    container
  ) {

    if (!container) {
      return null;
    }


    //
    // Common card structures:
    // label "평가액" + adjacent value
    //

    const candidates =
      Array.from(
        container.querySelectorAll(
          'div, span, td, th, strong, b'
        )
      );


    for (
      const labelEl of candidates
    ) {

      const text =
        (
          labelEl.textContent ||
          ''
        )
          .trim();


      if (
        text !== '평가액' &&
        text !== '현재 평가액'
      ) {
        continue;
      }


      const parent =
        labelEl.parentElement;


      if (!parent) {
        continue;
      }


      const children =
        Array.from(
          parent.children
        );


      const index =
        children.indexOf(
          labelEl
        );


      if (
        index >= 0 &&
        children[
          index + 1
        ]
      ) {

        return children[
          index + 1
        ];
      }


      const strong =
        parent.querySelector(
          'strong, b'
        );


      if (
        strong &&
        strong !== labelEl
      ) {
        return strong;
      }
    }


    //
    // Fallback:
    // element that currently displays x.xx억
    //

    const amountEls =
      Array.from(
        container.querySelectorAll(
          'strong, b, .value, .kpi, .big'
        )
      );


    return (
      amountEls.find(
        el =>
          /\d+(?:\.\d+)?억/
            .test(
              el.textContent ||
              ''
            )
      ) ||
      null
    );
  }


  function updateAccountMoneyV33() {

    const mappings =
      accountNameMapV33();


    const regions =
      Array.from(
        document.querySelectorAll(
          '.card, .panel, .box, section'
        )
      );


    mappings.forEach(
      mapping => {

        const valueKrw =
          accountValueKrwV33(
            mapping.id
          );


        if (valueKrw == null) {
          return;
        }


        const region =
          regions.find(
            el =>
              textMatchesAccountV33(
                el.textContent,
                mapping.labels
              )
          );


        if (!region) {
          return;
        }


        const valueEl =
          findEvaluationValueElementV33(
            region
          );


        if (!valueEl) {
          return;
        }


        valueEl.textContent =
          formatKrwEokManV33(
            valueKrw
          );
      }
    );
  }


  function applyMoneyFormatV33() {

    //
    // Overview
    //

    updateFinancialMoneyV33();


    //
    // 계좌·보유 탭에서만
    // 계좌별 평가액 상세 표시 적용.
    //
    // 다른 탭에서는 실행하지 않으므로
    // Overview donut / Simulation 숫자를
    // 잘못 덮어쓰는 기존 DOM collision을 방지한다.
    //

    const activeTab =
      document.querySelector(
        '[data-v33-final-tab][aria-selected="true"], ' +
        '[data-v33-final-tab].active, ' +
        '[data-v33-final-tab].selected'
      );


    const tabName =
      String(
        activeTab?.dataset?.v33FinalTab ||
        activeTab?.textContent ||
        ''
      )
        .replace(/\s+/g, '')
        .trim();


    if (
      tabName === '계좌·보유'
    ) {

      updateAccountMoneyV33();
    }
  }


  window.applyMoneyFormatV33 =
    applyMoneyFormatV33;


  //
  // Run after the existing UI/fix layers.
  //

  if (
    typeof render ===
    'function'
  ) {

    const renderBeforeMoneyV33 =
      render;


    render =
      function () {

        const result =
          renderBeforeMoneyV33
            .apply(
              this,
              arguments
            );


        requestAnimationFrame(
          applyMoneyFormatV33
        );


        return result;
      };
  }


  [
    'load',
    'portfolio:market-loaded',
    'portfolio:market-refreshed',
    'portfolio:saved'
  ]
    .forEach(
      eventName => {

        window.addEventListener(
          eventName,
          () =>
            requestAnimationFrame(
              applyMoneyFormatV33
            )
        );
      }
    );


  console.info(
    '[Portfolio Control] v3.3 money formatter loaded'
  );

})();
