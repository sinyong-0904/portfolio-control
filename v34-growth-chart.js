// Portfolio Control v3.4
// Growth monthly total-change bar + valuation line chart.
// Standalone module: does not modify v33-tabs-app.js / v33-tabs.css.
// Injects itself below the existing "월별 금융자산 Growth" table via DOM
// patching, the same pattern used by v33-history-sticky-fix.js /
// v33-ops-ux.js. Reuses the exact same data source as the table
// (window.v32MonthlyRows, exported from patch-v32.js) — no independent
// Growth calculation.
// Load LAST, after v33-tabs-app.js.

(function () {

  const CARD_ID = 'v34-growth-chart-card';
  const STYLE_ID = 'v34-growth-chart-style';


  function installStylesV34() {

    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;

    style.textContent = `
.v34-growth-chart-card {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--v33-border, rgba(100, 116, 139, .2));
  border-radius: 12px;
  background: var(--card-bg, var(--panel-bg, #fff));
  overflow: hidden;
}

.v34-growth-chart {
  width: 100%;
  height: auto;
  min-height: 250px;
}

.v34-growth-chart text {
  fill: currentColor;
  font-size: 10px;
  opacity: .58;
}

.v34-growth-zero {
  stroke: rgba(100, 116, 139, .3);
  stroke-width: 1;
}

.v34-growth-bar.pos {
  fill: var(--v33-blue, #2563eb);
}

.v34-growth-bar.neg {
  fill: var(--v33-red, #dc2626);
}

.v34-growth-value-line {
  fill: none;
  stroke: var(--v33-teal, #0d9488);
  stroke-width: 2.5;
  vector-effect: non-scaling-stroke;
}

.v34-growth-value-dot {
  fill: var(--v33-teal, #0d9488);
  stroke: #fff;
  stroke-width: 1.5;
}

.v34-growth-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 9px 16px;
  margin-top: 5px;
  font-size: 11px;
}

.v34-growth-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.v34-growth-legend i {
  width: 18px;
  height: 3px;
  border-radius: 999px;
}

.v34-growth-legend .pos i { background: var(--v33-blue, #2563eb); }
.v34-growth-legend .neg i { background: var(--v33-red, #dc2626); }
.v34-growth-legend .value i { background: var(--v33-teal, #0d9488); }
`;

    document.head.appendChild(style);
  }


  const MONTHS_V34 = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];


  function moneyV34(v) {

    try {

      if (typeof won === 'function') {
        return won(v);
      }

    } catch (e) {
      // fall through to plain formatting
    }

    return Math.round(Number(v) || 0).toLocaleString('ko-KR');
  }


  // Pure data -> SVG markup. Reuses window.v32MonthlyRows() as its only
  // data source; never recomputes contribution/cashChange/totalChange/value.
  function buildGrowthChartMarkupV34(g) {

    const rows = g.rows.filter(r => r.value != null);

    if (!rows.length) {
      return '';
    }

    const W = 760, H = 300, L = 60, R = 60, T = 20, B = 34;
    const plotTop = T;
    const plotBottom = H - B;
    const plotH = plotBottom - plotTop;

    const changes = rows.map(r => Number(r.totalChange) || 0);
    const values = rows.map(r => Number(r.value) || 0);

    const maxAbsChange =
      Math.max(1, ...changes.map(v => Math.abs(v))) * 1.15;

    const valMin = Math.min(...values) * 0.97;
    const valMax = Math.max(...values) * 1.03;
    const valRange = Math.max(1, valMax - valMin);

    const x = i =>
      L + (rows.length <= 1
        ? (W - L - R) / 2
        : i * (W - L - R) / (rows.length - 1));

    const barCenterY = plotTop + plotH / 2;

    const yChange = v =>
      barCenterY - (v / maxAbsChange) * (plotH / 2);

    const yValue = v =>
      plotBottom - (v - valMin) / valRange * plotH;

    const slot = rows.length > 1
      ? (W - L - R) / (rows.length - 1)
      : W - L - R;

    const barWidth = Math.max(8, Math.min(30, slot * 0.42));

    const bars = rows.map((r, i) => {
      const v = changes[i];
      const yTop = Math.min(yChange(v), barCenterY);
      const h = Math.max(Math.abs(yChange(v) - barCenterY), 0.5);
      const cls = v >= 0 ? 'pos' : 'neg';

      return `
        <rect class="v34-growth-bar ${cls}"
          x="${(x(i) - barWidth / 2).toFixed(1)}"
          y="${yTop.toFixed(1)}"
          width="${barWidth.toFixed(1)}"
          height="${h.toFixed(1)}">
          <title>${r.month}: ${moneyV34(v)}</title>
        </rect>
      `;
    }).join('');

    const linePath = values.map((v, i) =>
      `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${yValue(v).toFixed(1)}`
    ).join(' ');

    const dots = rows.map((r, i) => `
      <circle class="v34-growth-value-dot"
        cx="${x(i).toFixed(1)}"
        cy="${yValue(values[i]).toFixed(1)}"
        r="3.5">
        <title>${r.month}: ${moneyV34(values[i])}</title>
      </circle>
    `).join('');

    const xLabels = rows.map((r, i) => `
      <text x="${x(i).toFixed(1)}" y="${H - 12}" text-anchor="middle">
        ${MONTHS_V34.indexOf(r.month) + 1}월
      </text>
    `).join('');

    const zeroLine = `
      <line class="v34-growth-zero"
        x1="${L}" y1="${barCenterY.toFixed(1)}"
        x2="${W - R}" y2="${barCenterY.toFixed(1)}" />
    `;

    return `
      <svg class="v34-growth-chart" viewBox="0 0 ${W} ${H}" role="img"
        aria-label="월별 금융자산 Growth 그래프">
        ${zeroLine}
        ${bars}
        <path class="v34-growth-value-line" d="${linePath}" />
        ${dots}
        <g class="axis-labels">${xLabels}</g>
      </svg>
      <div class="v34-growth-legend">
        <span class="pos"><i></i>총증감(+)</span>
        <span class="neg"><i></i>총증감(-)</span>
        <span class="value"><i></i>평가액</span>
      </div>
    `;
  }


  // Finds the existing Growth table (anchored on its own protected
  // heading text, per PROJECT_HANDOFF.md §12/§26) and inserts/updates
  // the chart card directly below its .tableWrap.
  function applyGrowthChartV34() {

    try {

      if (typeof v32MonthlyRows !== 'function') {
        return false;
      }

      const heading = Array.from(
        document.querySelectorAll('h2')
      ).find(h => /월별\s*금융자산\s*Growth/.test(h.textContent));

      if (!heading) {
        return false;
      }

      const tableWrap = heading.nextElementSibling;

      if (!tableWrap || !tableWrap.classList.contains('tableWrap')) {
        return false;
      }

      const g = v32MonthlyRows();
      const markup = buildGrowthChartMarkupV34(g);

      let card = document.getElementById(CARD_ID);

      if (!markup) {

        if (card) {
          card.remove();
        }

        return true;
      }

      if (!card) {
        card = document.createElement('div');
        card.id = CARD_ID;
        card.className = 'v34-growth-chart-card';
        tableWrap.insertAdjacentElement('afterend', card);
      }

      card.innerHTML = markup;

      return true;

    } catch (e) {

      console.error('[v34] growth chart render failed', e);
      return false;
    }
  }


  let queuedV34 = false;

  function queueApplyV34() {

    if (queuedV34) {
      return;
    }

    queuedV34 = true;

    requestAnimationFrame(() => {
      queuedV34 = false;
      applyGrowthChartV34();
    });
  }


  window.applyGrowthChartV34 = applyGrowthChartV34;
  window.buildGrowthChartMarkupV34 = buildGrowthChartMarkupV34;


  window.addEventListener('load', () => {

    installStylesV34();

    const target =
      document.getElementById('content') ||
      document.getElementById('app') ||
      document.body;

    const observer = new MutationObserver(queueApplyV34);

    observer.observe(target, {
      childList: true,
      subtree: true
    });

    [
      'portfolio:market-loaded',
      'portfolio:market-refreshed',
      'portfolio:saved'
    ].forEach(eventName =>
      window.addEventListener(eventName, queueApplyV34)
    );

    queueApplyV34();
  });


  console.info('[Portfolio Control] v3.4 Growth chart module loaded');

})();
