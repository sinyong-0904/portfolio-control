// Portfolio Control v3.3
// Manual market indicators:
// VKOSPI / Korea Gold / International Gold

(function () {
  'use strict';

  const KEY = 'v33ManualMarket';

  function getData() {
    try {
      //
      // Canonical source:
      // portfolio_state / data
      //
      if (
        typeof data !== 'undefined' &&
        data &&
        data.manualMarket &&
        typeof data.manualMarket === 'object'
      ) {
        return data.manualMarket;
      }

      //
      // Legacy localStorage migration
      //
      const raw =
        localStorage.getItem(KEY);

      const legacy =
        raw
          ? JSON.parse(raw) || {}
          : {};

      if (
        typeof data !== 'undefined' &&
        data &&
        Object.keys(legacy).length
      ) {
        data.manualMarket = {
          ...legacy
        };

        if (
          typeof save === 'function'
        ) {
          save(false);
        }
      }

      return legacy;

    } catch (e) {
      return {};
    }
  }


  function saveData(value) {
    const clean = {
      vkospi:
        value.vkospi ?? null,

      goldKr:
        value.goldKr ?? null,

      goldIntl:
        value.goldIntl ?? null,

      updatedAt:
        value.updatedAt ||
        new Date().toISOString()
    };


    //
    // Canonical storage:
    // portfolio_state
    //
    if (
      typeof data !== 'undefined' &&
      data
    ) {
      data.manualMarket = clean;

      if (
        typeof save === 'function'
      ) {
        save(false);
      }
    }


    //
    // Legacy fallback.
    // Keep temporarily for rollback safety.
    //
    localStorage.setItem(
      KEY,
      JSON.stringify(clean)
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
  'pending',
  'is-pending'
);

const changeNode =
  card.querySelector(
    '.v33-market-card-change'
  );

if (
  changeNode &&
  String(
    changeNode.textContent || ''
  ).includes(
    '데이터 소스 준비중'
  )
) {
  changeNode.textContent = '';
  changeNode.classList.remove(
    'up',
    'down',
    'flat'
  );
}

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

  function autoRow(symbol) {
    const state =
      window.marketLiveState;

    if (
      !state ||
      !state.bySymbol
    ) {
      return null;
    }

    return (
      state.bySymbol[symbol] ||
      null
    );
  }


  function setExtra(
    label,
    extra
  ) {
    const card =
      findCard(label);

    if (!card) {
      return;
    }

    let extraNode =
      card.querySelector(
        '.v33-manual-market-extra'
      );

    if (!extra) {
      if (extraNode) {
        extraNode.remove();
      }

      return;
    }

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
  }
  
  function paintOverview() {
    const d =
      getData();

    const manualVkospi =
      num(d.vkospi);

    const manualGoldKr =
      num(d.goldKr);

    const manualGoldIntl =
      num(d.goldIntl);


    const autoVkospi =
      autoRow('VKOSPI');

    const autoGoldKr =
      autoRow('GOLD_KR');

    const autoGoldIntl =
      autoRow('GOLD_INTL');


    //
    // VKOSPI:
    // automatic DB value first,
    // manual value only as fallback.
    //
    const vkospi =
      autoVkospi &&
      Number.isFinite(
        Number(
          autoVkospi.current
        )
      )
        ? Number(
            autoVkospi.current
          )
        : manualVkospi;


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


      if (autoVkospi) {
        //
        // Dashboard already painted
        // current/change/date.
        // Add only the VIX ratio.
        //
        setExtra(
          'VKOSPI',
          extra
        );

      } else {
        setCard(
          'VKOSPI',
          fmt(vkospi, 2),
          '',
          extra
        );
      }
    }


    //
    // Gold:
    // automatic DB values first.
    //
    const goldKr =
      autoGoldKr &&
      Number.isFinite(
        Number(
          autoGoldKr.current
        )
      )
        ? Number(
            autoGoldKr.current
          )
        : manualGoldKr;


    const goldIntl =
      autoGoldIntl &&
      Number.isFinite(
        Number(
          autoGoldIntl.current
        )
      )
        ? Number(
            autoGoldIntl.current
          )
        : manualGoldIntl;


    let goldExtra = '';

    if (
      goldKr !== null &&
      goldIntl !== null &&
      goldIntl > 0
    ) {
      const gap =
        (
          goldKr /
          goldIntl -
          1
        ) * 100;

      goldExtra =
        '괴리 ' +
        (
          gap > 0
            ? '+'
            : ''
        ) +
        gap.toFixed(2) +
        '%';
    }


    if (goldKr !== null) {
      if (autoGoldKr) {
        setExtra(
          '국내 금',
          goldExtra
        );

      } else {
        setCard(
          '국내 금',
          fmt(goldKr, 0),
          '원/g',
          goldExtra
        );
      }
    }


    if (goldIntl !== null) {
      if (autoGoldIntl) {
        setExtra(
          '국제 금',
          ''
        );

      } else {
        setCard(
          '국제 금',
          fmt(goldIntl, 0),
          '원/g',
          ''
        );
      }
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
      buttons.find(button => {
        const text =
          String(
            button.textContent || ''
          )
            .replace(/\s+/g, ' ')
            .trim();

        return (
          text.includes(
            '자동가격 새로고침'
          ) ||
          text.includes(
            'DB가격 다시 불러오기'
          )
        );
      });

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
