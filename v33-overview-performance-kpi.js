// Portfolio Control v3.3
// Overview Performance 2x4 KPI patch.
//
// Load after:
// - v33-performance-profit.js on root
// - v35-performance-live.js on /v35/

(function () {
  'use strict';

  let queued = false;


  function clean(value) {
    return String(
      value == null ? '' : value
    )
      .replace(/\s+/g, ' ')
      .trim();
  }


  function finite(value) {
    const n = Number(value);

    return Number.isFinite(n)
      ? n
      : null;
  }


  function parseMan(text) {
    const t = clean(text)
      .replace(/,/g, '');

    if (
      !t ||
      /^(n\/a|na|-|—)$/i.test(t)
    ) {
      return null;
    }

    const sign =
      t.startsWith('-') ? -1 : 1;

    const raw =
      t.replace(/^[-+]/, '');

    const eok =
      raw.match(
        /([0-9.]+)\s*억/
      );

    const man =
      raw.match(
        /([0-9.]+)\s*만원/
      );

    if (eok) {
      return (
        sign *
        (
          Number(eok[1]) * 10000 +
          (
            man
              ? Number(man[1])
              : 0
          )
        )
      );
    }

    if (man) {
      return (
        sign *
        Number(man[1])
      );
    }

    const n =
      Number(
        raw.replace(
          /[^0-9.]/g,
          ''
        )
      );

    return Number.isFinite(n)
      ? sign * n
      : null;
  }


  function formatMan(value) {
    const n = finite(value);

    if (n == null) {
      return 'n/a';
    }

    const rounded =
      Math.round(n);

    const sign =
      rounded < 0 ? '-' : '';

    const abs =
      Math.abs(rounded);

    if (abs >= 10000) {
      const eok =
        Math.floor(
          abs / 10000
        );

      const man =
        abs % 10000;

      return (
        `${sign}` +
        `${eok.toLocaleString(
          'ko-KR'
        )}억` +
        (
          man
            ? `${man.toLocaleString(
                'ko-KR'
              )}만원`
            : ''
        )
      );
    }

    return (
      `${sign}` +
      `${abs.toLocaleString(
        'ko-KR'
      )}만원`
    );
  }


  function formatPercent(value) {
    const n = finite(value);

    if (n == null) {
      return '-';
    }

    return (
      `${n >= 0 ? '+' : ''}` +
      `${n.toFixed(2)}%`
    );
  }


  function performanceTable() {
    return document.querySelector(
      '.v33-performance-table'
    );
  }


  function tableHeaders(table) {
    return Array.from(
      table.querySelectorAll(
        'thead th'
      )
    ).map(
      th =>
        clean(th.textContent)
    );
  }


  function performanceRow(
    table,
    scope
  ) {
    return Array.from(
      table.querySelectorAll(
        'tbody tr'
      )
    ).find(
      row =>
        clean(
          row.children[0]
            ?.textContent
        ) === scope
    ) || null;
  }


    function currentYearInfo(table) {
    const headers =
      tableHeaders(table);

    const pnlIndex =
      headers.findIndex(
        text =>
          /^\d{2}['’]손익$/
            .test(text)
      );

    if (pnlIndex < 0) {
      return null;
    }

    const yy =
      headers[pnlIndex]
        .match(/^(\d{2})/)?.[1];

    if (!yy) {
      return null;
    }

    const ytdIndex =
      headers.findIndex(
        text =>
          text ===
          `${yy} YTD`
      );

    if (ytdIndex < 0) {
      return null;
    }

    return {
      yy,
      ytdIndex,
      pnlIndex
    };
  }


  function tableMetric(
    table,
    scope,
    info
  ) {
    const row =
      performanceRow(
        table,
        scope
      );

    if (!row) {
      return null;
    }

    return {
      ytd:
        finite(
          clean(
            row.children[
              info.ytdIndex
            ]?.textContent
          )
            .replace('%', '')
        ),

      pnlMan:
        parseMan(
          row.children[
            info.pnlIndex
          ]?.textContent
        )
    };
  }


  function samsungMetric() {
    try {
      const holding =
        data.holdings.find(
          h =>
            h.account ===
              'SAMSUNG_PREF' &&
            h.status ===
              'Active'
        );

      if (!holding) {
        return null;
      }

      const metric =
        holdingMetric(holding);

      const current =
        finite(
          metric?.m?.current
        );

      const yearStart =
        finite(
          metric?.m?.yearStart
        );

      const qty =
        finite(holding.qty);

      if (
        current == null ||
        yearStart == null ||
        qty == null
      ) {
        return null;
      }

      return {
        ytd:
          finite(metric.ytd) *
          100,

        pnlMan:
          (
            (
              current -
              yearStart
            ) *
            qty
          ) / 10000,

        totalPnlMan:
          finite(
            metric.totalPnl
          ) / 10000
      };

    } catch (e) {
      console.warn(
        '[v33-kpi] Samsung metric unavailable',
        e
      );

      return null;
    }
  }


  function householdMetric() {
    try {
      if (
        typeof window
          .v32MonthlyRows !==
        'function'
      ) {
        return null;
      }

      const growth =
        window.v32MonthlyRows();

      const total =
        typeof netSummary ===
          'function'
          ? netSummary()
          : null;

      return {
        year:
          finite(growth?.year),

        ytd:
          finite(
            growth?.ytd?.growth
          ),

        pnlMan:
          finite(
            growth?.ytd
              ?.totalChange
          ),

        totalPnlMan:
          total &&
          finite(total.total) !=
            null &&
          finite(
            data?.meta
              ?.initialValue
          ) != null

            ? (
                finite(
                  total.total
                ) -
                finite(
                  data.meta
                    .initialValue
                )
              )

            : null
      };

    } catch (e) {
      console.warn(
        '[v33-kpi] Household metric unavailable',
        e
      );

      return null;
    }
  }


  function installStyle() {
    if (
      document.getElementById(
        'v33-overview-performance-kpi-style'
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        'style'
      );

    style.id =
      'v33-overview-performance-kpi-style';

    style.textContent = `
      .v33-performance-kpi
      .v33-kpi-change {
        display: inline-block;
        margin-left: 5px;
        font-size: 13px;
        font-weight: 600;
        color: #94a3b8;
      }

      .v33-performance-kpi
      .v33-kpi-purple {
        color: rgb(109, 40, 217);
      }

      .v33-performance-kpi
      .v33-kpi-green {
        color: rgb(21, 128, 61);
      }

      .v33-performance-kpi
      .v33-kpi-value {
        white-space: nowrap;
      }

      .v33-performance-kpi
      .v33-kpi-accent-purple {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        background:
          linear-gradient(
            rgb(245, 243, 255),
            rgba(255, 255, 255, 0)
          );
        border:
          1px solid
          rgba(124, 58, 237, 0.35);
      }

      .v33-performance-kpi
      .v33-kpi-accent-green {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        background:
          linear-gradient(
            rgb(240, 253, 244),
            rgba(255, 255, 255, 0)
          );
        border:
          1px solid
          rgba(22, 163, 74, 0.35);
      }

      .v33-performance-kpi {
        position: relative;
      }

      .v33-performance-kpi
      > span,
      .v33-performance-kpi
      > strong {
        position: relative;
        z-index: 1;
      }
    `;

    document.head
      .appendChild(style);
  }


  function setYtdCard(
    card,
    label,
    rate,
    pnlMan
  ) {
    const span =
      card.querySelector(
        'span'
      );

    const strong =
      card.querySelector(
        'strong'
      );

    if (!span || !strong) {
      return;
    }

    span.textContent =
      label;

    strong.className =
      'v33-kpi-value';

    strong.textContent =
      formatPercent(rate);

    const change =
      document.createElement(
        'small'
      );

    change.className =
      'v33-kpi-change';

    change.textContent =
      `(${formatMan(
        pnlMan
      )})`;

    strong.appendChild(
      change
    );
  }


  function setTrCard(
    card,
    label,
    value,
    accent
  ) {
    const span =
      card.querySelector(
        'span'
      );

    const strong =
      card.querySelector(
        'strong'
      );

    if (!span || !strong) {
      return;
    }

    span.textContent =
      label;

    strong.textContent =
      formatMan(value);

    strong.className =
      `v33-kpi-value ` +
      `v33-kpi-${accent}`;

    const overlay =
      document.createElement(
        'i'
      );

    overlay.className =
      `v33-kpi-accent-${accent}`;

    overlay.setAttribute(
      'aria-hidden',
      'true'
    );

    card.prepend(overlay);
  }


  function apply() {
    installStyle();

    const grid =
      document.querySelector(
        '.v33-performance-kpi-grid'
      );

    const table =
      performanceTable();

    if (!grid || !table) {
      return;
    }

    const info =
      currentYearInfo(table);

    if (!info) {
      return;
    }

    const pension =
      tableMetric(
        table,
        '연금합산',
        info
      );

    const total =
      tableMetric(
        table,
        'Total',
        info
      );

    const samsung =
      samsungMetric();

    const household =
      householdMetric();

    if (
      !pension ||
      !total ||
      !samsung ||
      !household
    ) {
      return;
    }

    const cards =
      Array.from(
        grid.querySelectorAll(
          '.v33-performance-kpi'
        )
      );

    if (cards.length < 4) {
      return;
    }

    while (
      grid.children.length > 4
    ) {
      grid.lastElementChild
        ?.remove();
    }

    const pensionCagr =
      cards[1];

    const totalCagr =
      cards[3];

    setYtdCard(
      cards[0],
      `연금합산 ${info.yy} YTD`,
      pension.ytd,
      pension.pnlMan
    );

    setYtdCard(
      cards[2],
      `Total ${info.yy} YTD`,
      total.ytd,
      total.pnlMan
    );

    const samsungYtdCard =
      cards[0].cloneNode(true);

    const samsungTrCard =
      pensionCagr.cloneNode(true);

    const householdYtdCard =
      cards[2].cloneNode(true);

    const householdTrCard =
      totalCagr.cloneNode(true);

    setYtdCard(
      samsungYtdCard,
      `삼성전자우 ${info.yy} YTD`,
      samsung.ytd,
      samsung.pnlMan
    );

    setTrCard(
      samsungTrCard,
      '삼성전자우 TR',
      samsung.totalPnlMan,
      'purple'
    );

    setYtdCard(
      householdYtdCard,
      `Household Asset ${info.yy} YTD`,
      household.ytd,
      household.pnlMan
    );

    setTrCard(
      householdTrCard,
      'Household Asset TR',
      household.totalPnlMan,
      'green'
    );

    grid.append(
      samsungYtdCard,
      samsungTrCard,
      householdYtdCard,
      householdTrCard
    );
  }


  function queue() {
    if (queued) {
      return;
    }

    queued = true;

    requestAnimationFrame(
      () => {
        queued = false;
        apply();
      }
    );
  }


  [
    'load',
    'portfolio:saved',
    'portfolio:market-loaded',
    'portfolio:market-refreshed'
  ].forEach(
    name =>
      window.addEventListener(
        name,
        queue
      )
  );


  window.addEventListener(
    'load',
    () => {
      const root =
        document.getElementById(
          'content'
        ) ||
        document.body;

      new MutationObserver(
        queue
      ).observe(
        root,
        {
          childList: true,
          subtree: true
        }
      );

      queue();
    }
  );


  console.info(
    '[Portfolio Control] ' +
    'Overview Performance 2x4 KPI patch loaded'
  );
})();