// Portfolio Control v3.3
// Manual market indicators:
// VKOSPI / Korea Gold / International Gold

(function () {
  'use strict';

  const KEY = 'v33ManualMarket';

  function getData() {
    try {
      const raw =
        localStorage.getItem(KEY);

      if (!raw) {
        return {};
      }

      return JSON.parse(raw) || {};
    } catch (e) {
      return {};
    }
  }


  function saveData(value) {
    localStorage.setItem(
      KEY,
      JSON.stringify(value)
    );
  }


  function num(value) {
    const n =
      Number(
        String(value || '')
          .replace(/,/g, '')
          .trim()
      );

    return Number.isFinite(n)
      ? n
      : null;
  }


  function fmt(value, digits) {
    const n = num(value);

    if (n === null) {
      return '-';
    }

    return n.toLocaleString(
      'ko-KR',
      {
        minimumFractionDigits:
          digits,
        maximumFractionDigits:
          digits
      }
    );
  }


  function findCard(label) {
    const cards =
      Array.from(
        document.querySelectorAll(
          '.v33-market-card'
        )
      );

    return (
      cards.find(card => {
        const labelNode =
          card.querySelector(
            '.v33-market-card-label'
          );

        return (
          labelNode &&
          labelNode.textContent
            .trim() === label
        );
      }) || null
    );
  }


  function setCard(
    label,
    value,
    unit,
    extra
  ) {
    const card =
      findCard(label);

    if (!card) {
      return;
    }

    card.classList.remove(
      'is-pending'
    );

    const valueNode =
      card.querySelector(
        '.v33-market-card-value'
      );

    if (valueNode) {
      valueNode.textContent =
        value;
    }

    const unitNode =
      card.querySelector(
        '.v33-market-card-unit'
      );

    if (unitNode && unit) {
      unitNode.textContent =
        unit;
    }

    let extraNode =
      card.querySelector(
        '.v33-manual-market-extra'
      );

    if (extra) {
      if (!extraNode) {
        extraNode =
          document.createElement(
            'div'
          );

        extraNode.className =
          'v33-manual-market-extra small';

        card.appendChild(
          extraNode
        );
      }

      extraNode.textContent =
        extra;

    } else if (extraNode) {
      extraNode.remove();
    }
  }


  function paintOverview() {
    const d =
      getData();

    const vkospi =
      num(d.vkospi);

    const goldKr =
      num(d.goldKr);

    const goldIntl =
      num(d.goldIntl);


    //
    // VKOSPI
    //
    if (vkospi !== null) {
      let extra = '';

      const vixCard =
        findCard('VIX');

      if (vixCard) {
        const valueNode =
          vixCard.querySelector(
            '.v33-market-card-value'
          );

        const vix =
          valueNode
            ? num(
                valueNode.textContent
              )
            : null;

        if (
          vix !== null &&
          vix > 0
        ) {
          extra =
            (
              vkospi / vix
            ).toFixed(2) +
            '× VIX';
        }
      }

      setCard(
        'VKOSPI',
        fmt(vkospi, 2),
        '',
        extra
      );
    }


    //
    // Gold
    //
    if (goldKr !== null) {
      let extra = '';

      if (
        goldIntl !== null &&
        goldIntl > 0
      ) {
        const gap =
          (
            goldKr /
            goldIntl -
            1
          ) * 100;

        extra =
          '괴리 ' +
          (
            gap > 0
              ? '+'
              : ''
          ) +
          gap.toFixed(2) +
          '%';
      }

      setCard(
        '국내 금',
        fmt(goldKr, 0),
        '원/g',
        extra
      );
    }


    if (goldIntl !== null) {
      setCard(
        '국제 금',
        fmt(goldIntl, 0),
        '원/g',
        ''
      );
    }
  }


  function inputHtml() {
    const d =
      getData();

    return `
      <div
        id="v33ManualMarketBox"
        style="
          margin-top:12px;
          padding:12px;
          border:1px solid
            var(--line,#ddd);
          border-radius:10px;
        "
      >
        <div
          style="
            font-weight:700;
            margin-bottom:8px;
          "
        >
          수동 보조지표
        </div>

        <div
          style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
            align-items:end;
          "
        >
          <label>
            <div class="small">
              VKOSPI
            </div>
            <input
              id="v33ManualVkospi"
              type="number"
              step="0.01"
              value="${
                d.vkospi ?? ''
              }"
              style="width:110px"
            >
          </label>

          <label>
            <div class="small">
              국내금 원/g
            </div>
            <input
              id="v33ManualGoldKr"
              type="number"
              step="1"
              value="${
                d.goldKr ?? ''
              }"
              style="width:130px"
            >
          </label>

          <label>
            <div class="small">
              국제금 원/g
            </div>
            <input
              id="v33ManualGoldIntl"
              type="number"
              step="1"
              value="${
                d.goldIntl ?? ''
              }"
              style="width:130px"
            >
          </label>

          <button
            id="v33ManualMarketSave"
            class="btn"
            type="button"
          >
            저장
          </button>
        </div>
      </div>
    `;
  }


  function installInput() {
    if (
      document.getElementById(
        'v33ManualMarketBox'
      )
    ) {
      return;
    }

    const buttons =
      Array.from(
        document.querySelectorAll(
          'button'
        )
      );

    const refreshButton =
      buttons.find(button =>
        String(
          button.textContent || ''
        ).includes(
          'DB가격 다시 불러오기'
        )
      );

    if (!refreshButton) {
      return;
    }

    const host =
      refreshButton
        .closest('.card') ||
      refreshButton.parentElement;

    if (!host) {
      return;
    }

    host.insertAdjacentHTML(
      'beforeend',
      inputHtml()
    );

    const saveButton =
      document.getElementById(
        'v33ManualMarketSave'
      );

    if (!saveButton) {
      return;
    }

    saveButton.addEventListener(
      'click',
      function () {
        const value = {
          vkospi:
            num(
              document
                .getElementById(
                  'v33ManualVkospi'
                )
                ?.value
            ),

          goldKr:
            num(
              document
                .getElementById(
                  'v33ManualGoldKr'
                )
                ?.value
            ),

          goldIntl:
            num(
              document
                .getElementById(
                  'v33ManualGoldIntl'
                )
                ?.value
            ),

          updatedAt:
            new Date()
              .toISOString()
        };

        saveData(value);

        paintOverview();

        alert(
          '수동 보조지표를 저장했습니다.'
        );
      }
    );
  }


  let queued = false;

  function refresh() {
    if (queued) {
      return;
    }

    queued = true;

    requestAnimationFrame(
      function () {
        queued = false;

        installInput();
        paintOverview();
      }
    );
  }


  const observer =
    new MutationObserver(
      refresh
    );

  function start() {
    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

    refresh();
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


  window.v33ManualMarket = {
    get: getData,
    paint: paintOverview
  };

})();
