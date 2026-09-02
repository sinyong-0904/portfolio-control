// Portfolio Control v3.3
// Market price freshness UI
// Read-only view layer over window.marketLiveState.

(function () {
  'use strict';

  function state() {
    return window.marketLiveState || null;
  }


  function latestUpdatedAt(categories) {
    const s = state();

    if (!s || !s.bySymbol) {
      return null;
    }

    const wanted =
      new Set(
        categories.map(
          x => String(x).toUpperCase()
        )
      );

    const times =
      Object.values(s.bySymbol)
        .filter(
          row =>
            row &&
            wanted.has(
              String(
                row.category || ''
              ).toUpperCase()
            ) &&
            row.updatedAt
        )
        .map(
          row =>
            new Date(
              row.updatedAt
            ).getTime()
        )
        .filter(Number.isFinite);

    if (!times.length) {
      return null;
    }

    return new Date(
      Math.max(...times)
    ).toISOString();
  }


  function formatKst(iso) {
    if (!iso) {
      return '-';
    }

    const d = new Date(iso);

    if (
      Number.isNaN(
        d.getTime()
      )
    ) {
      return '-';
    }

    return new Intl.DateTimeFormat(
      'ko-KR',
      {
        timeZone: 'Asia/Seoul',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
    ).format(d);
  }


  function freshness() {
    const s = state();

    return {
      marketUpdatedAt:
        latestUpdatedAt([
          'INDEX',
          'MARKET',
          'SENTIMENT'
        ]),

      koreaUpdatedAt:
        latestUpdatedAt([
          'ETF',
          'ETN',
          'STOCK'
        ]),

      loadedAt:
        s && s.loadedAt
          ? s.loadedAt
          : null
    };
  }


  function text() {
    const s = state();

    if (!s || !s.loaded) {
      return (
        '자동 시장가격 미연결' +
        ' · 기존 수동가격 사용'
      );
    }

    const f = freshness();

    return (
      '시장지표 DB ' +
      formatKst(
        f.marketUpdatedAt
      ) +
      ' · 국내가격 DB ' +
      formatKst(
        f.koreaUpdatedAt
      ) +
      ' · 불러옴 ' +
      formatKst(
        f.loadedAt
      )
    );
  }


  function findStatusNode() {
    const buttons =
      Array.from(
        document.querySelectorAll(
          'button'
        )
      );

    const refreshButton =
      buttons.find(
        button => {
          const label =
            String(
              button.textContent || ''
            )
              .replace(
                /\s+/g,
                ' '
              )
              .trim();

          return (
            label ===
              '자동가격 새로고침' ||
            label ===
              'DB가격 다시 불러오기'
          );
        }
      );

    if (!refreshButton) {
      return null;
    }

    const actions =
      refreshButton.closest(
        '.actions'
      );

    if (!actions) {
      return null;
    }

    return (
      actions.querySelector(
        '.small'
      ) || null
    );
  }


  function paint() {
    const node =
      findStatusNode();

    if (!node) {
      return;
    }

    node.textContent =
      text();
  }


  let paintQueued = false;

  function schedulePaint() {
    if (paintQueued) {
      return;
    }

    paintQueued = true;

    requestAnimationFrame(
      function () {
        paintQueued = false;
        paint();
      }
    );
  }


  window.addEventListener(
    'portfolio:market-loaded',
    schedulePaint
  );

  window.addEventListener(
    'portfolio:market-refreshed',
    schedulePaint
  );


  const observer =
    new MutationObserver(
      schedulePaint
    );

  function start() {
    if (
      document.body
    ) {
      observer.observe(
        document.body,
        {
          childList: true,
          subtree: true
        }
      );
    }

    schedulePaint();
  }


  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      start,
      {
        once: true
      }
    );
  } else {
    start();
  }


  window.marketFreshnessV33 = {
    get: freshness,
    text,
    paint
  };
})();
