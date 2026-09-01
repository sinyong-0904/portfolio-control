// Portfolio Control v3.3 views
// Phase 1: Market Monitor
// Load AFTER v33-core.js.

(function () {
  const MARKET_UI_KEY = 'portfolioControlV33MarketUI';
  const ETF_CHECK_BASE = 'https://www.etfcheck.co.kr/mobile/etpitem/';

  const DEFAULT_MARKET_UI = {
    filter: 'all',
    sortKey: null,
    sortDir: 'desc'
  };

  const SORTABLE = {
    daily: '전일대비',
    cpHp: 'CP/HP',
    cpLp: 'CP/LP',
    ytd: 'YTD',
    yoy: 'YoY',
    lpHp: 'LP/HP'
  };

  let marketUi = loadMarketUiV33();

  function loadMarketUiV33() {
    try {
      const raw =
        localStorage.getItem(
          MARKET_UI_KEY
        );

      const parsed =
        raw
          ? JSON.parse(raw)
          : {};

      return {
        ...DEFAULT_MARKET_UI,
        ...parsed,

        filter:
          parsed.filter === 'held'
            ? 'held'
            : 'all',

        sortKey:
          Object.prototype
            .hasOwnProperty
            .call(
              SORTABLE,
              parsed.sortKey
            )
            ? parsed.sortKey
            : null,

        sortDir:
          parsed.sortDir === 'asc'
            ? 'asc'
            : 'desc'
      };

    } catch (e) {

      console.warn(
        '[v33] market UI state reset',
        e
      );

      return {
        ...DEFAULT_MARKET_UI
      };
    }
  }


  function saveMarketUiV33() {
    try {

      localStorage.setItem(
        MARKET_UI_KEY,
        JSON.stringify(
          marketUi
        )
      );

    } catch (e) {

      console.warn(
        '[v33] market UI state save failed',
        e
      );
    }
  }


  function isFiniteNumberV33(
    value
  ) {

    return (
      typeof value === 'number' &&
      Number.isFinite(value)
    );
  }


  function safeRatioV33(
    value
  ) {

    return isFiniteNumberV33(
      value
    )
      ? value
      : null;
  }


  function marketMetricsSafeV33(
    m
  ) {

    try {

      const x =
        marketMetrics(m);


      const hasBase =
        value => {

          const n =
            Number(value);

          return (
            value !== null &&
            value !== undefined &&
            Number.isFinite(n) &&
            n !== 0
          );
        };


      return {

        daily:
          hasBase(
            m.prevClose
          )
            ? safeRatioV33(
                x.daily
              )
            : null,

        cpHp:
          hasBase(
            m.high52
          )
            ? safeRatioV33(
                x.cpHp
              )
            : null,

        cpLp:
          hasBase(
            m.low52
          )
            ? safeRatioV33(
                x.cpLp
              )
            : null,

        ytd:
          hasBase(
            m.yearStart
          )
            ? safeRatioV33(
                x.ytd
              )
            : null,

        yoy:
          hasBase(
            m.yoyBase
          )
            ? safeRatioV33(
                x.yoy
              )
            : null,

        lpHp:
          (
            hasBase(
              m.low52
            ) &&
            hasBase(
              m.high52
            )
          )
            ? safeRatioV33(
                x.lpHp
              )
            : null
      };

    } catch (e) {

      const current =
        Number(
          m.current
        );

      const previous =
        Number(
          m.prevClose
        );

      const high52 =
        Number(
          m.high52
        );

      const low52 =
        Number(
          m.low52
        );

      const yearStart =
        Number(
          m.yearStart
        );

      const yoyBase =
        Number(
          m.yoyBase
        );


      const ratio =
        (
          a,
          b
        ) =>

          Number.isFinite(a) &&
          Number.isFinite(b) &&
          b !== 0

            ? a / b - 1

            : null;


      return {

        daily:
          ratio(
            current,
            previous
          ),

        cpHp:
          ratio(
            current,
            high52
          ),

        cpLp:
          ratio(
            current,
            low52
          ),

        ytd:
          ratio(
            current,
            yearStart
          ),

        yoy:
          m.yoyBase == null
            ? null
            : ratio(
                current,
                yoyBase
              ),

        lpHp:
          ratio(
            low52,
            high52
          )
      };
    }
  }


  function pctRatioV33(
    value
  ) {

    if (
      !isFiniteNumberV33(
        value
      )
    ) {
      return 'n/a';
    }

    const n =
      value * 100;

    return (
      `${n > 0 ? '+' : ''}` +
      `${n.toFixed(2)}%`
    );
  }


  function valueV33(
    value
  ) {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return 'n/a';
    }


    const n =
      Number(value);


    if (
      !Number.isFinite(n)
    ) {
      return 'n/a';
    }


    return won(n);
  }


  function isEtpV33(
    item
  ) {

    const kind =
      String(
        item.kind ||
        item.category ||
        ''
      )
        .trim()
        .toUpperCase();


    return (
      kind === 'ETF' ||
      kind === 'ETN'
    );
  }


  function activeHoldingCodesV33() {

    const codes =
      new Set();


    (data.holdings || [])
      .forEach(
        h => {

          const active =
            String(
              h.status ||
              'Active'
            )
              .toLowerCase()
            !== 'closed';


          const qty =
            Number(
              h.qty || 0
            );


          if (
            active &&
            qty > 0 &&
            h.code
          ) {

            codes.add(
              String(
                h.code
              )
            );
          }
        }
      );


    return codes;
  }


  function dateDiffDaysV33(
    fromDate,
    toDate
  ) {

    if (
      !fromDate ||
      !toDate
    ) {
      return null;
    }


    const a =
      new Date(
        `${fromDate}T00:00:00Z`
      );

    const b =
      new Date(
        `${toDate}T00:00:00Z`
      );


    if (
      !Number.isFinite(
        a.getTime()
      ) ||
      !Number.isFinite(
        b.getTime()
      )
    ) {
      return null;
    }


    return Math.round(
      (
        b.getTime() -
        a.getTime()
      ) /
      86400000
    );
  }


  function liveMetaV33(
    live
  ) {

    if (!live) {

      return `
        <span
          class="v33-market-source manual"
        >
          수동 fallback
        </span>
      `;
    }


    const latest =
      window
        .marketLiveState
        ?.latestPriceDate ||
      null;


    const lagDays =
      dateDiffDaysV33(
        live.priceDate,
        latest
      );


    const stale =
      Number.isFinite(
        lagDays
      ) &&
      lagDays >= 5;


    const dateText =
      esc(
        live.priceDate ||
        '-'
      );


    const sourceText =
      esc(
        live.source ||
        'AUTO'
      );


    const staleText =
      stale
        ? `
          <span
            class="v33-market-stale"
          >
            ⚠ ${lagDays}일 지연
          </span>
        `
        : '';


    return `
      <span
        class="v33-market-source"
      >
        ${dateText}
        ·
        ${sourceText}
        ${staleText}
      </span>
    `;
  }


  function buildMarketRowsV33() {

    const heldCodes =
      activeHoldingCodesV33();


    let rows =
      (data.market || [])
        .map(
          (
            base,
            index
          ) => {

            const m =
              market(
                base.code
              );


            const metrics =
              marketMetricsSafeV33(
                m
              );


            const live =
              window
                .marketLiveState
                ?.byCode
                ?.[base.code] ||
              null;


            return {

              base,
              index,
              m,
              metrics,
              live,

              held:
                heldCodes.has(
                  String(
                    base.code
                  )
                )
            };
          }
        );


    if (
      marketUi.filter ===
      'held'
    ) {

      rows =
        rows.filter(
          row =>
            row.held
        );
    }


    if (
      marketUi.sortKey
    ) {

      const key =
        marketUi.sortKey;

      const dir =
        marketUi.sortDir;


      rows.sort(
        (
          a,
          b
        ) => {

          const av =
            a.metrics[key];

          const bv =
            b.metrics[key];


          const aValid =
            isFiniteNumberV33(
              av
            );

          const bValid =
            isFiniteNumberV33(
              bv
            );


          // n/a는 정렬 방향과 관계없이
          // 항상 아래쪽에 둔다.
          if (
            !aValid &&
            !bValid
          ) {

            return (
              a.index -
              b.index
            );
          }


          if (!aValid) {
            return 1;
          }


          if (!bValid) {
            return -1;
          }


          const diff =
            dir === 'asc'
              ? av - bv
              : bv - av;


          return (
            diff ||
            a.index -
            b.index
          );
        }
      );
    }


    return rows;
  }


  function sortHeaderV33(
    key
  ) {

    const active =
      marketUi.sortKey ===
      key;


    const arrow =
      !active
        ? '↕'
        : marketUi.sortDir ===
          'desc'
          ? '↓'
          : '↑';


    const ariaSort =
      !active
        ? 'none'
        : marketUi.sortDir ===
          'desc'
          ? 'descending'
          : 'ascending';


    return `
      <th
        class="v33-sort-th"
        aria-sort="${ariaSort}"
      >
        <button
          type="button"
          class="v33-sort-btn ${
            active
              ? 'active'
              : ''
          }"
          onclick="marketSetSortV33('${key}')"
          title="${esc(
            SORTABLE[key]
          )} 정렬"
        >
          ${esc(
            SORTABLE[key]
          )}
          <span
            aria-hidden="true"
          >
            ${arrow}
          </span>
        </button>
      </th>
    `;
  }


  function marketNameCellV33(
    row
  ) {

    const {
      base
    } = row;


    const code =
      esc(
        base.code
      );


    const name =
      esc(
        base.name ||
        base.code
      );


    const heldBadge =
      row.held
        ? `
          <span
            class="v33-held-badge"
          >
            보유
          </span>
        `
        : '';


    const nameHtml =
      isEtpV33(base)

        ? `
          <a
            class="v33-etf-link"
            href="${ETF_CHECK_BASE}${encodeURIComponent(
              base.code
            )}/basic"
            target="_blank"
            rel="noopener noreferrer"
            title="ETF CHECK에서 열기"
          >
            ${name}
          </a>
        `

        : `
          <span>
            ${name}
          </span>
        `;


    return `
      <td
        class="v33-market-name-cell"
      >

        <div
          class="v33-market-name-line"
        >
          ${nameHtml}
          ${heldBadge}
        </div>

        <div class="small">
          ${code}
        </div>

      </td>
    `;
  }


  function currentCellV33(
    row
  ) {

    const {
      base,
      m,
      live
    } = row;


    if (
      live &&
      live.current != null
    ) {

      return `
        <td
          class="v33-market-current"
        >

          <b>
            ${valueV33(
              m.current
            )}
          </b>

          <div class="small">
            ${liveMetaV33(
              live
            )}
          </div>

        </td>
      `;
    }


    return `
      <td
        class="v33-market-current"
      >

        <input
          class="priceInput v33-manual-price"
          type="number"
          inputmode="decimal"
          value="${
            m.current ??
            ''
          }"
          onchange="marketManualPriceV33('${esc(
            base.code
          )}', this.value)"
          aria-label="${esc(
            base.name ||
            base.code
          )} 수동 현재가"
        >

        <div class="small">
          ${liveMetaV33(
            null
          )}
        </div>

      </td>
    `;
  }


  function rowHtmlV33(
    row
  ) {

    const x =
      row.metrics;

    const m =
      row.m;


    return `
      <tr
        data-market-code="${esc(
          row.base.code
        )}"
      >

        ${marketNameCellV33(
          row
        )}

        <td>
          ${pctRatioV33(
            x.daily
          )}
        </td>

        <td>
          ${valueV33(
            m.prevClose
          )}
        </td>

        ${currentCellV33(
          row
        )}

        <td>
          ${pctRatioV33(
            x.cpHp
          )}
        </td>

        <td>
          ${pctRatioV33(
            x.cpLp
          )}
        </td>

        <td>
          ${pctRatioV33(
            x.ytd
          )}
        </td>

        <td>
          ${pctRatioV33(
            x.yoy
          )}
        </td>

        <td>
          ${pctRatioV33(
            x.lpHp
          )}
        </td>

        <td>
          ${valueV33(
            m.high52
          )}
        </td>

        <td>
          ${valueV33(
            m.low52
          )}
        </td>

        <td>
          ${valueV33(
            m.yearStart
          )}

          ${
            m.liveYearStartDate
              ? `
                <div class="small">
                  ${esc(
                    m.liveYearStartDate
                  )}
                </div>
              `
              : ''
          }
        </td>

        <td>
          ${
            m.yoyBase == null
              ? 'n/a'
              : valueV33(
                  m.yoyBase
                )
          }

          ${
            m.liveYoyBaseDate
              ? `
                <div class="small">
                  ${esc(
                    m.liveYoyBaseDate
                  )}
                </div>
              `
              : ''
          }
        </td>

      </tr>
    `;
  }


  function marketStatusV33(
    rows
  ) {

    const state =
      window.marketLiveState ||
      {};


    const total =
      (data.market || [])
        .length;


    const visible =
      rows.length;


    const heldCount =
      activeHoldingCodesV33()
        .size;


    if (
      !state.loaded
    ) {

      return (
        `자동 시장가격 미연결` +
        ` · 화면 ${visible}/${total}개` +
        ` · 수동 fallback 사용`
      );
    }


    const sources =
      Array.from(
        new Set(
          Object.values(
            state.byCode ||
            {}
          )
            .map(
              x =>
                x &&
                x.source
            )
            .filter(Boolean)
        )
      )
        .join(', ');


    return (
      `자동 ${state.loadedCount || 0}개` +
      ` · 최근 기준 ${esc(
        state.latestPriceDate ||
        '-'
      )}` +
      ` · 보유 ${heldCount}종목` +
      ` · 화면 ${visible}/${total}개` +
      (
        sources
          ? ` · ${esc(
              sources
            )}`
          : ''
      )
    );
  }


  function marketViewV33() {

    const rows =
      buildMarketRowsV33();


    const rowHtml =
      rows
        .map(
          rowHtmlV33
        )
        .join('');


    const filterAllActive =
      marketUi.filter ===
      'all';


    const filterHeldActive =
      marketUi.filter ===
      'held';


    const sortLabel =
      marketUi.sortKey

        ? (
            `${SORTABLE[
              marketUi.sortKey
            ]} ` +
            (
              marketUi.sortDir ===
              'desc'
                ? '↓'
                : '↑'
            )
          )

        : '기본순서';


    return `

      <div
        class="v33-market-monitor"
      >

        <div
          class="actions v33-market-toolbar"
        >

          <div
            class="v33-market-toolbar-group"
            role="group"
            aria-label="시장가격 표시 범위"
          >

            <button
              type="button"
              class="btn ${
                filterHeldActive
                  ? 'primary'
                  : ''
              }"
              onclick="marketSetFilterV33('held')"
              aria-pressed="${filterHeldActive}"
            >
              보유종목만
            </button>


            <button
              type="button"
              class="btn ${
                filterAllActive
                  ? 'primary'
                  : ''
              }"
              onclick="marketSetFilterV33('all')"
              aria-pressed="${filterAllActive}"
            >
              전체
            </button>

          </div>


          <div
            class="v33-market-toolbar-group"
          >

            <button
              type="button"
              class="btn primary"
              onclick="refreshMarketPricesV33()"
            >
              자동가격 새로고침
            </button>


            <button
              type="button"
              class="btn"
              onclick="marketResetSortV33()"
              ${
                marketUi.sortKey
                  ? ''
                  : 'disabled'
              }
            >
              정렬 초기화
            </button>

          </div>

        </div>


        <div
          class="v33-market-summary"
        >

          <span>
            ${marketStatusV33(
              rows
            )}
          </span>

          <span>
            정렬:
            <b>
              ${esc(
                sortLabel
              )}
            </b>
          </span>

        </div>


        <div
          class="notice v33-market-notice"
        >

          % 열 제목을 누르면
          내림차순/오름차순으로
          전환됩니다.

          YoY가 없는 신규 ETF 등
          <b>n/a는 항상 맨 아래</b>에
          둡니다.

          ETF·ETN 종목명은
          ETF CHECK로 연결되며,
          자동가격이 없는 종목만
          수동 fallback을 사용합니다.

        </div>


        <div
          class="tableWrap v33-market-table-wrap"
        >

          <table
            class="mid v33-market-table"
          >

            <thead>

              <tr class="thead">

                <th
                  class="v33-market-name-cell"
                >
                  종목
                </th>

                ${sortHeaderV33(
                  'daily'
                )}

                <th>
                  전일
                </th>

                <th>
                  현재가
                </th>

                ${sortHeaderV33(
                  'cpHp'
                )}

                ${sortHeaderV33(
                  'cpLp'
                )}

                ${sortHeaderV33(
                  'ytd'
                )}

                ${sortHeaderV33(
                  'yoy'
                )}

                ${sortHeaderV33(
                  'lpHp'
                )}

                <th>
                  52wHP
                </th>

                <th>
                  52wLP
                </th>

                <th>
                  연초가
                </th>

                <th>
                  YoY기준가
                </th>

              </tr>

            </thead>


            <tbody>

              ${
                rowHtml ||
                `
                  <tr>
                    <td
                      colspan="13"
                      class="v33-market-empty"
                    >
                      표시할 종목이 없습니다.
                    </td>
                  </tr>
                `
              }

            </tbody>

          </table>

        </div>

      </div>
    `;
  }


  window.marketSetSortV33 =
    function (
      key
    ) {

      if (
        !Object.prototype
          .hasOwnProperty
          .call(
            SORTABLE,
            key
          )
      ) {
        return;
      }


      if (
        marketUi.sortKey ===
        key
      ) {

        marketUi.sortDir =
          marketUi.sortDir ===
          'desc'
            ? 'asc'
            : 'desc';

      } else {

        marketUi.sortKey =
          key;

        marketUi.sortDir =
          'desc';
      }


      saveMarketUiV33();


      if (
        typeof render ===
        'function'
      ) {
        render();
      }
    };


  window.marketResetSortV33 =
    function () {

      marketUi.sortKey =
        null;

      marketUi.sortDir =
        'desc';


      saveMarketUiV33();


      if (
        typeof render ===
        'function'
      ) {
        render();
      }
    };


  window.marketSetFilterV33 =
    function (
      filter
    ) {

      marketUi.filter =
        filter === 'held'
          ? 'held'
          : 'all';


      saveMarketUiV33();


      if (
        typeof render ===
        'function'
      ) {
        render();
      }
    };


  window.marketManualPriceV33 =
    function (
      code,
      rawValue
    ) {

      const value =
        Number(
          rawValue
        );


      if (
        !Number.isFinite(
          value
        )
      ) {

        alert(
          '유효한 가격을 입력해주세요.'
        );

        return;
      }


      const base =
        (data.market || [])
          .find(
            x =>
              String(
                x.code
              ) ===
              String(
                code
              )
          );


      if (!base) {
        return;
      }


      // 자동가격이 실제 존재하는 행은
      // portfolio_state의 수동가격으로
      // 덮어쓰지 않는다.
      if (
        window
          .marketLiveState
          ?.byCode
          ?.[code]
          ?.current != null
      ) {

        alert(
          '자동가격이 연결된 종목은 수동가격으로 덮어쓰지 않습니다.'
        );


        if (
          typeof render ===
          'function'
        ) {
          render();
        }

        return;
      }


      base.current =
        value;


      save();
    };


  window.marketViewV33 =
    marketViewV33;


  // v33-core의 임시 Market view를 교체한다.
  marketView =
    marketViewV33;


  // base app의 views 객체가
  // marketView의 옛 함수 reference를
  // 직접 보관하고 있는 경우도 교체한다.
  try {

    if (
      typeof views !==
        'undefined' &&
      views &&
      typeof views ===
        'object'
    ) {

      if (
        Object.prototype
          .hasOwnProperty
          .call(
            views,
            '시장가격'
          )
      ) {

        views[
          '시장가격'
        ] =
          marketViewV33;
      }


      if (
        Object.prototype
          .hasOwnProperty
          .call(
            views,
            'Market'
          )
      ) {

        views.Market =
          marketViewV33;
      }
    }

  } catch (e) {

    console.warn(
      '[v33] market view registry patch skipped',
      e
    );
  }


  console.info(
    '[Portfolio Control] v3.3 Market Monitor loaded'
  );

})();