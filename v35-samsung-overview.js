
/*
 * Portfolio Control v3.5
 * Samsung Equity Overview presentation patch.
 * Read-only. No authoritative state mutation.
 */
(function () {
  'use strict';

  if (!/(^|\/)v35(\/|$)/.test(location.pathname)) return;
  if (typeof views === 'undefined' ||
      typeof views.Overview !== 'function') return;

  function formatMan(value) {
    const n = Math.round(value);
    const eok = Math.trunc(n / 10000);
    const man = n % 10000;
    return eok
      ? `${eok}억 ${man.toLocaleString('ko-KR')}만원`
      : `${man.toLocaleString('ko-KR')}만원`;
  }

  function commonValueMan() {
    let sum = 0;

    for (const h of data.holdings || []) {
      if (
        h.account !== 'GENERAL' ||
        String(h.code) !== '005930' ||
        (h.status && h.status !== 'Active')
      ) continue;

      const metric = holdingMetric(h);
      const value = Number(metric && metric.value);

      if (!Number.isFinite(value) || value < 0) {
        return null;
      }

      sum += value / 10000;
    }

    return sum;
  }

  function transformFinancialAssets(html) {
    if (typeof html !== 'string') return html;

    try {
      const n = netSummary();
      const total = Number(n.total);
      const inv = Number(n.inv?.value);
      const cash = Number(n.cash?.value);
      const pref = Number(n.legacy?.value);
      const common = commonValueMan();

      if (
        common === null ||
        ![total, inv, cash, pref, common]
          .every(Number.isFinite) ||
        common > inv ||
        Math.abs(total - inv - cash - pref) > 0.1
      ) return html;

      const doc = new DOMParser().parseFromString(
        html, 'text/html'
      );

      const section = [...doc.querySelectorAll(
        '.v33-section'
      )].find(s =>
        s.querySelector('h2')
          ?.textContent.trim() === 'Financial Assets'
      );

      if (!section) return html;

      const cards = [...section.querySelectorAll(
        '.v33-overview-kpi'
      )];
      const segments = [...section.querySelectorAll(
        '.v33-donut-segment'
      )];
      const legends = [...section.querySelectorAll(
        '.v33-donut-legend-row'
      )];

      if (
        cards.length !== 4 ||
        segments.length !== 3 ||
        legends.length !== 3
      ) return html;

      const labels = [
        '전체 금융자산',
        '투자계좌',
        '예금성 자금',
        '삼성전자 주식'
      ];

      const values = [
        total,
        inv - common,
        cash,
        pref + common
      ];

      for (let i = 0; i < 4; i++) {
        const label = cards[i].querySelector(
          '.v33-overview-kpi-label'
        );
        const value = cards[i].querySelector(
          '.v33-overview-kpi-value'
        );
        const sub = cards[i].querySelector(
          '.v33-overview-kpi-sub'
        );

        if (!label || !value || !sub) return html;

        label.textContent = labels[i];
        value.textContent = formatMan(values[i]);
        sub.textContent = i === 0
          ? '현재 금융자산 합계'
          : `전체의 ${(values[i] / total * 100).toFixed(1)}%`;
      }

      const breakdown = doc.createElement('div');
      breakdown.className = 'v35-samsung-breakdown';
      breakdown.style.cssText =
        'margin-top:10px;padding-top:8px;' +
        'border-top:1px solid var(--border,#ddd);' +
        'font-size:12px;line-height:1.8';

      const prefRow = doc.createElement('div');
      const commonRow = doc.createElement('div');

      prefRow.textContent =
        `삼성전자우  ${formatMan(pref)}`;
      commonRow.textContent =
        `삼성전자(자사주)  ${formatMan(common)}`;

      breakdown.append(prefRow, commonRow);
      cards[3].appendChild(breakdown);

      const portions = [
        inv - common,
        cash,
        pref + common
      ];

      const sum = portions.reduce((a, b) => a + b, 0);
      let offset = 0;

      for (let i = 0; i < 3; i++) {
        const pct = sum ? portions[i] / sum * 100 : 0;

        segments[i].setAttribute(
          'stroke-dasharray',
          `${pct} ${100 - pct}`
        );
        segments[i].setAttribute(
          'stroke-dashoffset',
          String(-offset)
        );
        offset += pct;

        const name = legends[i].querySelector(
          '.v33-donut-legend-name'
        );
        const amount = legends[i].querySelector('b');
        const spans = legends[i].querySelectorAll('span');

        if (!name || !amount || !spans.length) return html;

        name.textContent = labels[i + 1];
        amount.textContent = formatMan(portions[i]);
        spans[spans.length - 1].textContent =
          `${pct.toFixed(1)}%`;
      }

      // Replace the exact Financial Assets section only.
      const originalDoc = new DOMParser().parseFromString(
        html, 'text/html'
      );

      const originalSection = [...originalDoc.querySelectorAll(
        '.v33-section'
      )].find(s =>
        s.querySelector('h2')
          ?.textContent.trim() === 'Financial Assets'
      );

      if (!originalSection) return html;

      const start = html.indexOf(originalSection.outerHTML);

      if (start >= 0) {
        return html.slice(0, start) +
          section.outerHTML +
          html.slice(start + originalSection.outerHTML.length);
      }

      // Fallback: return the transformed document body.
      return doc.body.innerHTML;

    } catch (error) {
      console.warn('[v35 Samsung Overview]', error);
      return html;
    }
  }

  window.transformSamsungOverviewV35 =
    transformFinancialAssets;

  window.adjustSamsungFinancialSnapshotV35 = function(snapshot) {
    if (!snapshot || !/(^|\/)v35(\/|$)/.test(location.pathname)) {
      return snapshot;
    }

    const common = commonValueMan();

    if (
      common === null ||
      !Number.isFinite(common) ||
      !Number.isFinite(snapshot.investment) ||
      !Number.isFinite(snapshot.legacy) ||
      common > snapshot.investment
    ) {
      return snapshot;
    }

    return {
      ...snapshot,
      investment: snapshot.investment - common,
      legacy: snapshot.legacy + common
    };
  };
})();
