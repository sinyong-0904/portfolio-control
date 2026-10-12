
/*
 * Portfolio Control v3.5
 * GENERAL Performance presentation split.
 *
 * Read-only, 2026-only.
 * No state mutation, persistence, or performanceRows override.
 */
(function () {
  'use strict';

  if (!/(^|\/)v35(\/|$)/.test(location.pathname)) return;

  let queued = false;

  function number(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

function formatMan(value, signed = true) {
    if (!Number.isFinite(value)) return '—';
    const rounded = Math.round(value);
    return (signed && rounded > 0 ? '+' : '') +
      rounded.toLocaleString('ko-KR') + '만원';
  }

  function findTable() {
    return Array.from(
      document.querySelectorAll('table')
    ).find(table => {
      const headers = Array.from(
        table.querySelectorAll('thead th')
      ).map(th => th.textContent.replace(/\s/g, ''));

      return headers.includes('평가액') &&
        headers.includes('누적손익') &&
        headers.includes('26YTD') &&
        headers.includes('TWR') &&
        headers.includes('CAGR');
    }) || null;
  }

  function getMetrics() {
    if (
      typeof data === 'undefined' ||
      typeof accountSummary !== 'function' ||
      typeof holdingMetric !== 'function'
    ) return null;

    const general = accountSummary('GENERAL');
    if (!general) return null;

    const holdings = (data.holdings || []).filter(h =>
      h.account === 'GENERAL' &&
      String(h.code) === '005930' &&
      (!h.status || h.status === 'Active')
    );

    if (!holdings.length) return null;

    let commonValue = 0;
    let commonCumPnl = 0;
    let commonYearPnl = 0;

    for (const h of holdings) {
      const metric = holdingMetric(h);
      const value = number(metric && metric.value);
      const cum = number(metric && metric.totalPnl);
      const qty = number(h.qty);

      if (
        value === null ||
        cum === null ||
        qty === null ||
        qty < 0
      ) return null;

      commonValue += value / 10000;
      commonCumPnl += cum / 10000;

      // Existing 30 shares held since 2025.
      // Historical 2026 price-only attribution.
      if (qty !== 30 || number(h.avg) !== 54700) {
        return null;
      }

      commonYearPnl +=
        (value - qty * 119900) / 10000;
    }

    const totalValue = number(general.value);
    const totalCum = number(general.cumPnl);
    const totalYear = number(general.pnl);

    if (
      [totalValue, totalCum, totalYear]
        .some(v => v === null) ||
      commonValue > totalValue
    ) return null;

    return [
      {
        name: '↳ 자사주',
        value: commonValue,
        yearPnl: commonYearPnl,
        cumPnl: commonCumPnl
      },
      {
        name: '↳ 기타종목',
        value: totalValue - commonValue,
        yearPnl: totalYear - commonYearPnl,
        cumPnl: totalCum - commonCumPnl
      }
    ];
  }

  function apply() {
    const table = findTable();
    if (!table) return;

    const headers = Array.from(
      table.querySelectorAll('thead th')
    ).map(th => th.textContent.replace(/\s/g, ''));

    // Do not display historical 2026 attribution in
    // future-year Performance tables.
    if (!headers.includes("26'손익") &&
        !headers.includes('26’손익')) return;

    const generalRow = Array.from(
      table.querySelectorAll('tbody tr')
    ).find(tr =>
      tr.children.length > 1 &&
      tr.children[0].textContent.trim() === '일반계좌'
    );

    if (!generalRow) return;

    const metrics = getMetrics();
    if (!metrics) return;

    const valueIndex = headers.indexOf('평가액');
    const yearIndex = headers.findIndex(h =>
      /^26['’]?손익$/.test(h)
    );
    const cumIndex = headers.indexOf('누적손익');

    if ([valueIndex, yearIndex, cumIndex]
      .some(i => i < 0)) return;

    let previous = generalRow;

    metrics.forEach((metric, index) => {
      const key = String(index);
      let row = Array.from(
        table.querySelectorAll('tbody tr')
      ).find(tr =>
        tr.dataset.v35GeneralSplit === key
      );

      if (!row) {
        row = document.createElement('tr');
        row.dataset.v35GeneralSplit = key;
      }

      const values = Array(headers.length).fill('—');
      values[0] = metric.name;
      values[valueIndex] = formatMan(metric.value, false);
      values[yearIndex] = formatMan(metric.yearPnl);
      values[cumIndex] = formatMan(metric.cumPnl);

      const signature = JSON.stringify(values);

      const currentValues = Array.from(
        row.querySelectorAll('td')
      ).map(td => td.textContent.trim());

      const needsUpdate =
        row.dataset.v35Signature !== signature ||
        JSON.stringify(currentValues) !== signature;

      if (needsUpdate) {
        row.replaceChildren(
          ...values.map((value, i) => {
            const td = document.createElement('td');
            td.textContent = value;

            if (i === 0) {
              td.style.paddingLeft = '20px';
              td.style.opacity = '0.85';
            }

            if (
              (i === yearIndex || i === cumIndex) &&
              Number(metric[
                i === yearIndex ? 'yearPnl' : 'cumPnl'
              ]) < 0
            ) {
              td.classList.add(
                'v33-performance-negative',
                'v33-negative'
              );
            }

            return td;
          })
        );

        row.dataset.v35Signature = signature;
      }

      if (row.previousElementSibling !== previous) {
        previous.insertAdjacentElement('afterend', row);
      }

      previous = row;
    });
  }

  function queue() {
    if (queued) return;
    queued = true;

    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  }

  window.addEventListener('load', function () {
    const root = document.getElementById('content');
    if (!root) return;

    new MutationObserver(queue).observe(root, {
      childList: true,
      subtree: true
    });

    queue();
  });

  [
    'portfolio:saved',
    'portfolio:market-loaded',
    'portfolio:market-refreshed'
  ].forEach(event =>
    window.addEventListener(event, queue)
  );
})();
