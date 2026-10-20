
/*
 * Portfolio Control v3.5
 * Simulation historical actuals presentation
 *
 * Reads finalized actuals only.
 * Does not modify data, save, or cloud state.
 */
(function () {
  'use strict';

  const ROOT = '.v33-simulation';
  const TABLE = '.v33-simulation-table';
  const NS = 'http://www.w3.org/2000/svg';
  const COLORS = [
    '#d97706',
    '#2563eb',
    '#16a34a',
    '#8b5cf6',
    '#dc2626'
  ];

  function actuals() {
    const years =
      data?.simulation?.actualsByYear || {};
    const currentYear = new Date().getFullYear();

    return Object.entries(years)
      .map(([key, value]) => ({
        year: Number(key),
        ...value
      }))
      .filter(r =>
        Number.isInteger(r.year) &&
        r.year >= 2026 &&
        r.year < currentYear &&
        r.finalized === true &&
        Number.isFinite(Number(r.contributionMan)) &&
        Number.isFinite(Number(r.valuationMan))
      )
      .sort((a, b) => a.year - b.year);
  }

  function money(value) {
    const n = Math.round(Number(value) || 0);
    const abs = Math.abs(n);
    const eok = Math.floor(abs / 10000);
    const man = abs % 10000;
    const sign = n < 0 ? '-' : '';

    if (eok) {
      return sign + eok + '억' +
        (man ? ' ' + man.toLocaleString('ko-KR') + '만원' : '');
    }
    return sign + man.toLocaleString('ko-KR') + '만원';
  }

  
  function parseMoney(text) {
    const s = String(text || '')
      .replace(/,/g, '')
      .replace(/\s+/g, '');

    const match = s.match(
      /^(-)?(?:(\d+(?:\.\d+)?)억)?(?:(\d+(?:\.\d+)?)만(?:원)?)?$/
    );

    if (match && (match[2] || match[3])) {
      const eok = Number(match[2] || 0);
      const man = Number(match[3] || 0);
      return (match[1] ? -1 : 1) *
        (eok * 10000 + man);
    }

    const plain = Number(s);
    return s !== '' && Number.isFinite(plain)
      ? plain
      : NaN;
  }


  function svgElement(tag, attrs, text) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) =>
      el.setAttribute(key, String(value))
    );
    if (text !== undefined) el.textContent = String(text);
    return el;
  }

  function historicalRow(record, columns) {
    const tr = document.createElement('tr');
    tr.className = 'v35-sim-actual-row';
    tr.style.background = 'rgba(100,116,139,.08)';

    const year = document.createElement('td');
    year.textContent = String(record.year);

    const status = document.createElement('div');
    status.className = 'small';
    status.textContent = '확정 실적';
    year.appendChild(status);
    tr.appendChild(year);

    const contribution = document.createElement('td');
    const strong = document.createElement('b');
    strong.textContent = money(record.contributionMan);
    contribution.appendChild(strong);
    tr.appendChild(contribution);

    const valuation = document.createElement('td');
    valuation.colSpan = Math.max(1, columns - 2);

    const label = document.createElement('span');
    label.textContent = '연말 실제 평가액  ';

    const amount = document.createElement('b');
    amount.textContent = money(record.valuationMan);

    valuation.append(label, amount);
    tr.appendChild(valuation);

    return tr;
  }

  function updateTable(root, history) {
    const table = root.querySelector(TABLE);
    if (!table) return null;

    const tbody = table.querySelector('tbody');
    const headers = table.querySelectorAll('thead th');
    if (!tbody || headers.length < 8) return null;

    const forecastRows = Array.from(tbody.rows)
      .filter(row =>
        !row.classList.contains('v35-sim-actual-row')
      );

    if (!forecastRows.length) return null;

    history.forEach(record =>
      tbody.insertBefore(
        historicalRow(record, headers.length),
        tbody.firstChild
      )
    );

    return forecastRows;
  }

  function readForecast(rows) {
    return rows.map(row => {
      const cells = Array.from(row.cells);
      if (cells.length < 8) return null;

      const year = Number(cells[0].textContent.trim());
      const values = [
        ...cells.slice(2, 6).map(c =>
          parseMoney(c.textContent)
        ),
        parseMoney(cells[7].querySelector('b')?.textContent)
      ];

      if (
        !Number.isInteger(year) ||
        values.some(v => !Number.isFinite(v))
      ) return null;

      const eventInput = cells[6].querySelector('input');

      return {
        year,
        values,
        event: Number(eventInput?.value) || 0
      };
    });
  }

  function updateChart(root, history, forecastRows) {
    const card = root.querySelector('.v33-sim-chart-card');
    const svg = card?.querySelector('svg.v33-sim-chart');
    if (!svg) return false;

    const forecast = readForecast(forecastRows);
    if (
      !forecast.length ||
      forecast.some(r => !r)
    ) return false;

    const startText = root.querySelector(
      '.v33-sim-controls strong'
    )?.textContent;
    const startValue = parseMoney(startText);

    if (!Number.isFinite(startValue)) return false;

    const W = 760, H = 300;
    const L = 58, R = 18, T = 20, B = 42;
    const count = history.length;

    const years = [
      ...history.map(r => r.year),
      ...forecast.map(r => r.year)
    ];

    const all = [
      ...history.map(r => Number(r.valuationMan)),
      startValue,
      ...forecast.flatMap(r => r.values)
    ];

    const lo = Math.min(...all) * 0.94;
    const hi = Math.max(...all) * 1.04;
    const span = Math.max(1, hi - lo);

    const x = index =>
      L + index * (W - L - R) /
      Math.max(1, years.length - 1);

    const y = value =>
      T + (hi - value) * (H - T - B) / span;

    const path = points =>
      points.map((p, i) =>
        (i ? 'L' : 'M') +
        x(p[0]).toFixed(1) + ' ' +
        y(p[1]).toFixed(1)
      ).join(' ');

    const graph = svgElement('g');

    for (let i = 0; i <= 4; i++) {
      const value = hi - span * i / 4;
      const yy = y(value);

      graph.appendChild(svgElement('line', {
        x1: L, x2: W - R,
        y1: yy, y2: yy,
        stroke: 'currentColor',
        'stroke-opacity': '.13'
      }));

      graph.appendChild(svgElement('text', {
        x: L - 8,
        y: yy + 4,
        'text-anchor': 'end',
        fill: 'currentColor',
        'font-size': 11
      }, (value / 10000).toFixed(1) + '억'));
    }

    const actualPoints = history.map((r, i) =>
      [i, Number(r.valuationMan)]
    );

    // The current valuation is an intermediate anchor
    // between the last actual year and the first forecast.
    const anchorX = count - 0.35;
    actualPoints.push([anchorX, startValue]);

    graph.appendChild(svgElement('path', {
      d: path(actualPoints),
      fill: 'none',
      stroke: '#64748b',
      'stroke-width': 3,
      'stroke-linecap': 'round'
    }));

    history.forEach((r, i) => {
      const dot = svgElement('circle', {
        cx: x(i),
        cy: y(Number(r.valuationMan)),
        r: 4,
        fill: '#64748b'
      });
      dot.appendChild(svgElement(
        'title', {}, r.year + ': ' + money(r.valuationMan)
      ));
      graph.appendChild(dot);
    });

    for (let j = 0; j < 5; j++) {
      const points = [
        [anchorX, startValue],
        ...forecast.map((r, i) =>
          [count + i, r.values[j]]
        )
      ];

      graph.appendChild(svgElement('path', {
        d: path(points),
        class: 'v33-sim-line ' +
          (j === 4 ? 'event' : 'r' + j),
        fill: 'none',
        stroke: COLORS[j],
        'stroke-width': 2.5,
        'stroke-dasharray': '6 4'
      }));
    }

    forecast.forEach((r, i) => {
      if (!r.event) return;

      const dot = svgElement('circle', {
        cx: x(count + i),
        cy: y(r.values[4]),
        r: 4,
        class: 'v33-sim-event-dot',
        fill: COLORS[4]
      });

      dot.appendChild(svgElement(
        'title', {},
        r.year + ': Event ' + r.event + '%p'
      ));
      graph.appendChild(dot);
    });

    years.forEach((year, i) => {
      if (
        i !== 0 &&
        i !== years.length - 1 &&
        i % 2 !== 0
      ) return;

      graph.appendChild(svgElement('text', {
        x: x(i),
        y: H - 13,
        'text-anchor': 'middle',
        fill: 'currentColor',
        'font-size': 11
      }, year));
    });

    svg.replaceChildren(graph);

    const legend = card.querySelector('.v33-sim-legend');
    if (legend) {
      const item = document.createElement('span');
      const swatch = document.createElement('i');
      swatch.style.background = '#64748b';
      item.append(swatch, '확정 실적');
      legend.insertBefore(item, legend.firstChild);
    }

    return true;
  }

  function apply() {
    const root = document.querySelector(ROOT);
    if (!root || root.dataset.v35ActualsApplied === '1') {
      return;
    }

    const history = actuals();
    if (!history.length) return;

    // Work on the existing view without changing state.
    const table = root.querySelector(TABLE);
    const tbody = table?.querySelector('tbody');
    if (!tbody) return;

    const forecastRows = Array.from(tbody.rows);
    if (!forecastRows.length) return;

    // Validate chart inputs before modifying the table.
    if (
      readForecast(forecastRows).some(r => !r) ||
      !Number.isFinite(parseMoney(
        root.querySelector('.v33-sim-controls strong')
          ?.textContent
      ))
    ) return;

    root.dataset.v35ActualsApplied = '1';

    const rows = updateTable(root, history);
    if (rows) updateChart(root, history, rows);
  }

  function initialize() {
    const target = document.getElementById('content');
    if (!target) return;

    const observer = new MutationObserver(() => apply());
    observer.observe(target, {
      childList: true,
      subtree: true
    });

    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded', initialize, {once: true}
    );
  } else {
    initialize();
  }
})();
