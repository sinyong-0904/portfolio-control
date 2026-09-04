// Portfolio Control v3.4
// Growth monthly total-change bar + valuation line chart.
// Standalone module: does not modify v33-tabs-app.js / v33-tabs.css.
// Injects itself below the existing "월별 금융자산 Growth" table via DOM
// patching, the same pattern used by v33-history-sticky-fix.js /
// v33-ops-ux.js. Reuses the exact same data source as the table
// (window.v32MonthlyRows, exported from patch-v32.js) — no independent
// Growth calculation.
//
// X-axis is a fixed 12-month grid (Jan..Dec); months without data yet
// (r.value == null) get a label/slot but no bar/point/line. Left axis =
// monthly total-change (만원, symmetric around zero). Right axis =
// valuation (억원, scaled to the actual data range only).
//
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

.v34-growth-chart-scroll {
  overflow-x: auto;
}

.v34-growth-chart {
  width: 100%;
  min-width: 700px;
  height: auto;
  min-height: 280px;
  display: block;
}

.v34-growth-chart text {
  fill: currentColor;
  font-size: 10px;
}

.v34-month-label {
  opacity: .55;
}

.v34-axis-tick-label {
  opacity: .68;
}

.v34-axis-caption {
  font-size: 9.5px;
  font-weight: 700;
  opacity: .55;
}

.v34-axis-line {
  stroke: rgba(100, 116, 139, .35);
  stroke-width: 1;
}

.v34-axis-tick {
  stroke: rgba(100, 116, 139, .45);
  stroke-width: 1;
}

.v34-growth-gridline {
  stroke: rgba(100, 116, 139, .12);
  stroke-width: 1;
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

.v34-bar-value-label {
  font-size: 9.5px;
  font-weight: 700;
}

.v34-bar-value-label.pos {
  fill: var(--v33-blue, #2563eb);
}

.v34-bar-value-label.neg {
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


  // Rounds up to a "nice" number (1/2/5/10 x 10^n) for axis ticks.
  function niceCeil(v) {

    if (v <= 0) {
      return 1;
    }

    const pow10 = Math.pow(10, Math.floor(Math.log10(v)));
    const norm = v / pow10;

    let nice;

    if (norm <= 1) {
      nice = 1;
    } else if (norm <= 2) {
      nice = 2;
    } else if (norm <= 5) {
      nice = 5;
    } else {
      nice = 10;
    }

    return nice * pow10;
  }


  // r.totalChange / r.value from window.v32MonthlyRows() are already
  // stored in 만원 units (verified against the Growth table renderer,
  // which prints them via won() with no /10000 conversion — see commit
  // message for the real-data check). Do NOT divide by 10000 here.
  function fmtManwon(vManwon, signed) {

    const man = Math.round(Number(vManwon) || 0);
    const sign = signed && man > 0 ? '+' : '';

    return sign + man.toLocaleString('ko-KR') + '만';
  }


  // r.value is already in 만원 (see fmtManwon note above); 1억 = 10,000만.
  function fmtEok(vManwon) {

    const eok = (Number(vManwon) || 0) / 10000;
    const rounded = Math.round(eok * 10) / 10;

    return (
      Number.isInteger(rounded)
        ? rounded.toFixed(0)
        : rounded.toFixed(1)
    ) + '억';
  }


  // Pure data -> SVG markup. Reuses g.rows (window.v32MonthlyRows()) as
  // its only data source; never recomputes contribution/cashChange/
  // totalChange/value. rows is always the full 12-month array (Jan..Dec,
  // index 0-11); months without data yet have value == null.
  function buildGrowthChartMarkupV34(g) {

    const rows = g.rows;
    const actualRows = rows.filter(r => r.value != null);

    if (!actualRows.length) {
      return '';
    }

    const N = 12;
    const W = 800, H = 360;
    const L = 66, R = 78, T = 40, B = 46;

    // Inner padding so the Jan/Dec bars clear the axis lines and their
    // tick labels: axis line -> PAD_X gap -> first/last month slot.
    const PAD_X = 26;

    const plotTop = T;
    const plotBottom = H - B;
    const plotH = plotBottom - plotTop;
    const barCenterY = plotTop + plotH / 2;

    const axisLeftX = L;
    const axisRightX = W - R;
    const usableLeft = axisLeftX + PAD_X;
    const usableRight = axisRightX - PAD_X;

    const slot = (usableRight - usableLeft) / (N - 1);
    const x = i => usableLeft + i * slot;
    const barWidth = Math.max(8, Math.min(30, slot * 0.42));

    // Left axis: monthly total-change, 만원, symmetric around zero.
    // r.totalChange is already 만원 — no conversion, see fmtManwon note.
    const changesManwon = rows.map(r =>
      r.totalChange != null ? Number(r.totalChange) : null
    );

    const maxAbsChangeManwon = niceCeil(
      Math.max(
        1,
        ...changesManwon.filter(v => v != null).map(v => Math.abs(v))
      )
    );

    const yChange = vManwon =>
      barCenterY - (vManwon / maxAbsChangeManwon) * (plotH / 2);

    const leftTickHalfCount = 2;
    const leftTicks = [];

    for (let k = -leftTickHalfCount; k <= leftTickHalfCount; k++) {
      leftTicks.push(maxAbsChangeManwon * k / leftTickHalfCount);
    }

    // Right axis: valuation, 억원, scaled to the actual value range only.
    // r.value is already 만원 — no conversion, see fmtEok note.
    const valuesManwon = actualRows.map(r => Number(r.value) || 0);
    const rawMinManwon = Math.min(...valuesManwon);
    const rawMaxManwon = Math.max(...valuesManwon);
    const padManwon = Math.max(
      (rawMaxManwon - rawMinManwon) * 0.12,
      rawMaxManwon * 0.02,
      1
    );

    const rMinManwon = rawMinManwon - padManwon;
    const rMaxManwon = rawMaxManwon + padManwon;
    const rRangeManwon = Math.max(1, rMaxManwon - rMinManwon);

    const yValue = vManwon =>
      plotBottom - (vManwon - rMinManwon) / rRangeManwon * plotH;

    const rightTickCount = 4;
    const rightTicks = [];

    for (let k = 0; k <= rightTickCount; k++) {
      rightTicks.push(rMinManwon + rRangeManwon * k / rightTickCount);
    }

    // Bars + always-visible value labels. Months with no data yet
    // (future months) get their x-slot/label below but no bar.
    const bars = rows.map((r, i) => {

      if (r.value == null || r.totalChange == null) {
        return '';
      }

      const vManwon = changesManwon[i];
      const yTop = Math.min(yChange(vManwon), barCenterY);
      const h = Math.max(Math.abs(yChange(vManwon) - barCenterY), 0.5);
      const cls = vManwon >= 0 ? 'pos' : 'neg';

      const labelY = vManwon >= 0
        ? yTop - 6
        : yTop + h + 12;

      return `
        <rect class="v34-growth-bar ${cls}"
          x="${(x(i) - barWidth / 2).toFixed(1)}"
          y="${yTop.toFixed(1)}"
          width="${barWidth.toFixed(1)}"
          height="${h.toFixed(1)}">
          <title>${r.month}: ${fmtManwon(r.totalChange, true)}</title>
        </rect>
        <text class="v34-bar-value-label ${cls}"
          x="${x(i).toFixed(1)}" y="${labelY.toFixed(1)}"
          text-anchor="middle">${fmtManwon(r.totalChange, true)}</text>
      `;
    }).join('');

    // Valuation line/points — only through the last actual month.
    const linePath = actualRows.map((r, idx) => {
      const i = rows.indexOf(r);
      const v = Number(r.value) || 0;

      return `${idx === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${yValue(v).toFixed(1)}`;
    }).join(' ');

    const dots = actualRows.map(r => {
      const i = rows.indexOf(r);
      const v = Number(r.value) || 0;

      return `
        <circle class="v34-growth-value-dot"
          cx="${x(i).toFixed(1)}"
          cy="${yValue(v).toFixed(1)}"
          r="3.5">
          <title>${r.month}: ${fmtEok(v)}</title>
        </circle>
      `;
    }).join('');

    // X-axis: fixed 12 months, always shown (Jan..Dec).
    const xLabels = rows.map((r, i) => `
      <text class="v34-month-label" x="${x(i).toFixed(1)}" y="${H - 14}"
        text-anchor="middle">${i + 1}월</text>
    `).join('');

    const zeroLine = `
      <line class="v34-growth-zero"
        x1="${L}" y1="${barCenterY.toFixed(1)}"
        x2="${W - R}" y2="${barCenterY.toFixed(1)}" />
    `;

    // Left axis ticks/gridlines (총증감, 만원). Zero already drawn above.
    const leftAxis = leftTicks.map(t => {
      const y = yChange(t).toFixed(1);

      const gridline = t === 0
        ? ''
        : `<line class="v34-growth-gridline"
            x1="${L}" y1="${y}" x2="${W - R}" y2="${y}" />`;

      return `
        ${gridline}
        <line class="v34-axis-tick" x1="${L - 4}" y1="${y}" x2="${L}" y2="${y}" />
        <text class="v34-axis-tick-label" x="${L - 8}" y="${y}"
          text-anchor="end" dominant-baseline="middle">
          ${fmtManwon(t, true)}
        </text>
      `;
    }).join('');

    // Right axis ticks (평가액, 억원).
    const rightAxis = rightTicks.map(t => {
      const y = yValue(t).toFixed(1);

      return `
        <line class="v34-axis-tick" x1="${W - R}" y1="${y}" x2="${W - R + 4}" y2="${y}" />
        <text class="v34-axis-tick-label" x="${W - R + 8}" y="${y}"
          text-anchor="start" dominant-baseline="middle">
          ${fmtEok(t)}
        </text>
      `;
    }).join('');

    const axisLines = `
      <line class="v34-axis-line" x1="${L}" y1="${plotTop}" x2="${L}" y2="${plotBottom}" />
      <line class="v34-axis-line" x1="${W - R}" y1="${plotTop}" x2="${W - R}" y2="${plotBottom}" />
    `;

    const axisCaptions = `
      <text class="v34-axis-caption" x="${L}" y="16" text-anchor="start">총증감(만원)</text>
      <text class="v34-axis-caption" x="${W - R}" y="16" text-anchor="end">평가액(억원)</text>
    `;

    return `
      <div class="v34-growth-chart-scroll">
        <svg class="v34-growth-chart" viewBox="0 0 ${W} ${H}" role="img"
          aria-label="월별 금융자산 Growth 그래프">
          ${leftAxis}
          ${zeroLine}
          ${axisLines}
          ${rightAxis}
          ${bars}
          <path class="v34-growth-value-line" d="${linePath}" />
          ${dots}
          <g class="axis-labels">${xLabels}</g>
          ${axisCaptions}
        </svg>
      </div>
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
