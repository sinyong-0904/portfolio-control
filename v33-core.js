// Portfolio Control v3.3 core
// Transitional core layer. Load AFTER patch-v322.js.
// Purpose:
// 1) one idempotent v3.3 data migration
// 2) runtime market_prices bridge (automatic prices are NOT persisted into portfolio_state)
// 3) shared Core Sleeve / Portfolio Exposure / Performance calculations
// 4) safe cloud-save timestamp events
// 5) disable local price rollover while automatic market data is available

(function () {
  const V33_SCHEMA = 33;
  const V33_VERSION = 3.3;

  const MARKET_SYMBOL_ALIASES = {
    NASDAQ: 'IDX-NASDAQ',
    SP500: 'IDX-SP500',
    'S&P500': 'IDX-SP500',
    DOW: 'IDX-DOW',
    'DOW JONES': 'IDX-DOW',
    KOSPI: 'IDX-KOSPI'
  };

  const PENSION_BUCKET_KEYS = ['EQUITY', 'INCOME', 'HEDGE', 'PARKING'];

  const EXPOSURE_DETAIL_KEYS = [
    'NASDAQ',
    'S&P500',
    'US-CVD',
    'K-DVD',
    'BOND',
    'GOLD',
    'GLOBAL',
    'WORLD'
  ];

  const DEFAULT_BUCKET_SNAPSHOT = {
    version: 1,
    snapshotDate: '2026-08-28',

    buckets: {
      EQUITY: {
        snapshotBuyMan: 10160,
        snapshotEvalMan: 12398,
        snapshotYtdPnlMan: 848,
        snapshotYtdRate: 9.84,
        snapshotCumPnlMan: 2395
      },

      INCOME: {
        snapshotBuyMan: 5010,
        snapshotEvalMan: 5797,
        snapshotYtdPnlMan: 758,
        snapshotYtdRate: 8.80,
        snapshotCumPnlMan: 1102
      },

      HEDGE: {
        snapshotBuyMan: 4212,
        snapshotEvalMan: 4874,
        snapshotYtdPnlMan: 106,
        snapshotYtdRate: 1.12,
        snapshotCumPnlMan: 852
      },

      PARKING: {
        snapshotBuyMan: 9454,
        snapshotEvalMan: 9681,
        snapshotYtdPnlMan: 229,
        snapshotYtdRate: 2.12,
        snapshotCumPnlMan: 579
      }
    }
  };


  const DEFAULT_PERFORMANCE_V33 = {
    version: 1,

    ytd25: {
      DC: 9.94,
      '연금(1)': 14.03,
      '연금(2)': 17.30,
      '연금합산': 11.22,

      EQUITY: 21.32,
      INCOME: 8.55,
      HEDGE: 18.84,
      PARKING: 3.24,

      ISA: 17.45,
      '일반계좌': 37.21,
      '자녀연금': 1.75,
      Total: 12.65
    },

    reference: {
      DC: {
        y26: 6.86,
        tr: 17.22,
        twr: 17.48,
        cagr: 9.99
      },

      '연금(1)': {
        y26: 4.95,
        tr: 18.62,
        twr: 19.68,
        cagr: 11.20
      },

      '연금(2)': {
        y26: 5.89,
        tr: 18.64,
        twr: 24.21,
        cagr: 13.67
      },

      EQUITY: {
        y26: 9.84,
        tr: 23.57,
        twr: 33.26,
        cagr: 18.49
      },

      INCOME: {
        y26: 8.80,
        tr: 22.00,
        twr: 18.10,
        cagr: 10.33
      },

      HEDGE: {
        y26: 1.12,
        tr: 20.23,
        twr: 20.17,
        cagr: 11.47
      },

      PARKING: {
        y26: 2.12,
        tr: 6.12,
        twr: 5.42,
        cagr: 3.17
      },

      '연금합산': {
        y26: 6.30,
        tr: 17.09,
        twr: 18.23,
        cagr: 10.40
      },

      ISA: {
        y26: 5.25,
        tr: 17.50,
        twr: 23.62,
        cagr: 13.35
      },

      '일반계좌': {
        y26: 21.29,
        tr: 66.42,
        twr: 66.42,
        cagr: 35.12
      },

      '자녀연금': {
        y26: 7.66,
        tr: 8.55,
        twr: 9.54,
        cagr: 11.43
      },

      Total: {
        y26: 6.77,
        tr: 18.80,
        twr: 20.28,
        cagr: 11.53
      }
    }
  };


  const CHILD_DEFAULTS = [
    {
      id: 'child-h1',
      account: 'CHILD',
      owner: '서현',
      code: '0019K0',
      qty: 505,
      target: 70,
      avg: 11577,
      realized: 0,
      cumDividend: 0,
      status: 'Active'
    },

    {
      id: 'child-h2',
      account: 'CHILD',
      owner: '서현',
      code: '411060',
      qty: 96,
      target: 30,
      avg: 27709,
      realized: 0,
      cumDividend: 0,
      status: 'Active'
    },

    {
      id: 'child-h3',
      account: 'CHILD',
      owner: '서진',
      code: '0019K0',
      qty: 505,
      target: 70,
      avg: 11577,
      realized: 0,
      cumDividend: 0,
      status: 'Active'
    },

    {
      id: 'child-h4',
      account: 'CHILD',
      owner: '서진',
      code: '411060',
      qty: 96,
      target: 30,
      avg: 27736,
      realized: 0,
      cumDividend: 0,
      status: 'Active'
    }
  ];


  const CHILD_PROFILES = [
    {
      owner: '서현',
      snapshotValueKRW: 9204073,
      snapshotCumPnlKRW: 697624
    },

    {
      owner: '서진',
      snapshotValueKRW: 9201170,
      snapshotCumPnlKRW: 692129
    }
  ];


  const marketLiveState = {
    loaded: false,
    loadedCount: 0,
    loadedAt: null,

    latestPriceDate: null,
    earliestPriceDate: null,

    error: null,

    bySymbol: Object.create(null),
    byCode: Object.create(null)
  };

  window.marketLiveState = marketLiveState;


  function clone(x) {
    return JSON.parse(
      JSON.stringify(x)
    );
  }


  function numericOrNull(v) {

    if (
      v === null ||
      v === undefined ||
      v === ''
    ) {
      return null;
    }

    const n = Number(v);

    return Number.isFinite(n)
      ? n
      : null;
  }


  function ensureMeta() {

    if (
      !data.meta ||
      typeof data.meta !== 'object'
    ) {
      data.meta = {};
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        data.meta,
        'lastSavedAt'
      )
    ) {
      data.meta.lastSavedAt = null;
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        data.meta,
        'lastBackupAt'
      )
    ) {
      data.meta.lastBackupAt = null;
    }
  }


  function ensureGrowthSchemaV33() {

    if (
      data.growthV32 &&
      data.growthV32.years &&
      data.growthV32.annual
    ) {

      if (
        !Array.isArray(
          data.growthV32.rolloverWarnings
        )
      ) {
        data.growthV32.rolloverWarnings = [];
      }

      return false;
    }


    const months =
      data.months ||
      [
        'JAN','FEB','MAR','APR',
        'MAY','JUN','JUL','AUG',
        'SEP','OCT','NOV','DEC'
      ];


    const old =
      data.monthlyGrowth2026 || {};


    const oldMeta =
      data.monthlyGrowthMeta || {};


    const currentMonth =
      oldMeta.currentMonth ||
      months[
        new Date().getMonth()
      ] ||
      'JAN';


    const currentMonthIndex =
      Math.max(
        0,
        months.indexOf(
          currentMonth
        )
      );


    data.growthV32 = {
      version: 1,

      currentYear: 2026,

      currentMonthIndex,

      years: {
        '2026': {}
      },

      annual: {},

      currentStart: null,

      rolloverWarnings: []
    };


    months.forEach(
      (m, i) => {

        const r =
          old[m] || {};

        data.growthV32
          .years['2026'][m] = {

          contribution:
            Number(
              r.contribution
            ) || 0,

          cashChange:
            Number(
              r.cashChange
            ) || 0,

          investmentReturn:
            r.investmentReturn == null
              ? null
              : Number(
                  r.investmentReturn
                ),

          legacy:
            r.legacy == null
              ? null
              : Number(
                  r.legacy
                ),

          totalChange:
            r.totalChange == null
              ? null
              : Number(
                  r.totalChange
                ),

          value:
            r.value == null
              ? null
              : Number(
                  r.value
                ),

          locked:
            i <
            currentMonthIndex
        };
      }
    );


    if (
      data.growthFixed &&
      data.growthFixed['2025']
    ) {

      data.growthV32
        .annual['2025'] =
        clone(
          data.growthFixed['2025']
        );
    }

    return true;
  }


  function ensureChildV33() {

    let changed = false;


    if (
      !Array.isArray(
        data.childProfiles
      )
    ) {

      data.childProfiles =
        clone(
          CHILD_PROFILES
        );

      changed = true;

    } else {

      CHILD_PROFILES.forEach(
        p => {

          if (
            !data.childProfiles
              .some(
                x =>
                  x.owner ===
                  p.owner
              )
          ) {

            data.childProfiles
              .push(
                clone(p)
              );

            changed = true;
          }
        }
      );
    }


    const child =
      (data.accounts || [])
        .find(
          a =>
            a.id === 'CHILD'
        );


    if (child) {

      if (
        Number(
          child.manualValueKRW
        ) !== 0
      ) {

        child.manualValueKRW = 0;

        changed = true;
      }


      const note =
        '서현·서진 각각 나스닥채권50 + KRX금현물';


      if (
        child.note !== note
      ) {

        child.note = note;

        changed = true;
      }
    }


    if (
      !Array.isArray(
        data.holdings
      )
    ) {

      data.holdings = [];
    }


    CHILD_DEFAULTS.forEach(
      def => {

        const exists =
          data.holdings.some(
            h =>
              h.account === 'CHILD' &&
              h.owner === def.owner &&
              h.code === def.code
          );


        if (!exists) {

          data.holdings.push(
            clone(def)
          );

          changed = true;
        }
      }
    );


    return changed;
  }


  function ensure251600V33() {

    let changed = false;


    if (
      !data.mapping ||
      typeof data.mapping !==
        'object'
    ) {

      data.mapping = {};

      changed = true;
    }


    const wanted = {
      'K-DVD': 0.5,
      BOND: 0.5
    };


    const cur =
      data.mapping['251600'];


    if (
      !cur ||
      Number(
        cur['K-DVD']
      ) !== 0.5 ||
      Number(
        cur.BOND
      ) !== 0.5 ||
      Object.keys(cur).length !== 2
    ) {

      data.mapping['251600'] =
        wanted;

      changed = true;
    }


    const m =
      (data.market || [])
        .find(
          x =>
            x.code === '251600'
        );


    if (
      m &&
      m.name !==
        'PLUS 고배당주채권혼합50'
    ) {

      m.name =
        'PLUS 고배당주채권혼합50';

      changed = true;
    }


    return changed;
  }

   function ensureBucketSnapshotV33() {

    let changed = false;


    if (
      !data.pensionBucketSnapshot ||
      typeof data.pensionBucketSnapshot !==
        'object'
    ) {

      data.pensionBucketSnapshot =
        clone(
          DEFAULT_BUCKET_SNAPSHOT
        );

      return true;
    }


    if (
      !data.pensionBucketSnapshot
        .buckets
    ) {

      data.pensionBucketSnapshot
        .buckets = {};

      changed = true;
    }


    PENSION_BUCKET_KEYS.forEach(
      key => {

        if (
          !data.pensionBucketSnapshot
            .buckets[key]
        ) {

          data.pensionBucketSnapshot
            .buckets[key] =
            clone(
              DEFAULT_BUCKET_SNAPSHOT
                .buckets[key]
            );

          changed = true;
        }
      }
    );


    if (
      !data.pensionBucketSnapshot
        .snapshotDate
    ) {

      data.pensionBucketSnapshot
        .snapshotDate =
        DEFAULT_BUCKET_SNAPSHOT
          .snapshotDate;

      changed = true;
    }


    return changed;
  }


  function ensurePerformanceV33() {

    if (
      !data.performanceV33 ||
      typeof data.performanceV33 !==
        'object'
    ) {

      data.performanceV33 =
        clone(
          DEFAULT_PERFORMANCE_V33
        );

      return true;
    }


    let changed = false;


    if (
      !data.performanceV33.ytd25
    ) {

      data.performanceV33.ytd25 =
        clone(
          DEFAULT_PERFORMANCE_V33
            .ytd25
        );

      changed = true;
    }


    if (
      !data.performanceV33.reference
    ) {

      data.performanceV33.reference =
        clone(
          DEFAULT_PERFORMANCE_V33
            .reference
        );

      changed = true;
    }


    Object.entries(
      DEFAULT_PERFORMANCE_V33.ytd25
    ).forEach(
      ([key, value]) => {

        if (
          data.performanceV33
            .ytd25[key] == null
        ) {

          data.performanceV33
            .ytd25[key] = value;

          changed = true;
        }
      }
    );


    Object.entries(
      DEFAULT_PERFORMANCE_V33.reference
    ).forEach(
      ([key, value]) => {

        if (
          !data.performanceV33
            .reference[key]
        ) {

          data.performanceV33
            .reference[key] =
            clone(value);

          changed = true;
        }
      }
    );


    return changed;
  }


  function ensureV33Containers() {

    let changed = false;


    if (
      !data.tableMemos ||
      typeof data.tableMemos !==
        'object'
    ) {

      data.tableMemos = {};

      changed = true;
    }


    if (
      !data.history ||
      typeof data.history !==
        'object'
    ) {

      data.history = {};

      changed = true;
    }


    if (
      !data.incomeTaxHistory ||
      typeof data.incomeTaxHistory !==
        'object'
    ) {

      data.incomeTaxHistory = {
        rows: [],
        notes: []
      };

      changed = true;
    }


    if (
      !data.strategyNotes ||
      typeof data.strategyNotes !==
        'object'
    ) {

      data.strategyNotes = {
        text: '',
        updatedAt: null
      };

      changed = true;
    }


    if (
      !data.simulation ||
      typeof data.simulation !==
        'object'
    ) {

      data.simulation = {
        annualContributionMan:
          5000,

        horizonYears:
          12,

        rates: [
          0.05,
          0.08,
          0.10,
          0.12
        ],

        baseEventRate:
          0.08,

        events: {},

        updatedAt: null
      };

      changed = true;
    }


    return changed;
  }


  function migrateV33() {

    ensureMeta();

    let changed = false;


    if (
      ensure251600V33()
    ) {
      changed = true;
    }


    if (
      ensureChildV33()
    ) {
      changed = true;
    }


    if (
      ensureGrowthSchemaV33()
    ) {
      changed = true;
    }


    if (
      ensureBucketSnapshotV33()
    ) {
      changed = true;
    }


    if (
      ensurePerformanceV33()
    ) {
      changed = true;
    }


    if (
      ensureV33Containers()
    ) {
      changed = true;
    }


    if (
      Number(
        data.meta.schemaVersion
      ) !== V33_SCHEMA
    ) {

      data.meta.schemaVersion =
        V33_SCHEMA;

      changed = true;
    }


    if (
      Number(
        data.version
      ) < V33_VERSION
    ) {

      data.version =
        V33_VERSION;

      changed = true;
    }


    if (changed) {

      localStorage.setItem(
        KEY,
        JSON.stringify(data)
      );
    }


    return changed;
  }


  window.migrateV33 =
    migrateV33;


  //
  // ============================================================
  // Runtime market_prices layer
  // ============================================================
  //


  function resetMarketLive() {

    marketLiveState.loaded =
      false;

    marketLiveState.loadedCount =
      0;

    marketLiveState.loadedAt =
      null;

    marketLiveState.latestPriceDate =
      null;

    marketLiveState.earliestPriceDate =
      null;

    marketLiveState.error =
      null;

    marketLiveState.bySymbol =
      Object.create(null);

    marketLiveState.byCode =
      Object.create(null);
  }


  function normalizeMarketRow(row) {

    const symbol =
      String(
        row.symbol || ''
      ).trim();


    const mappedCode =
      MARKET_SYMBOL_ALIASES[
        symbol
      ] || symbol;


    return {

      symbol,

      code:
        mappedCode,

      name:
        row.name || '',

      category:
        row.category || '',

      current:
        numericOrNull(
          row.current
        ),

      previous:
        numericOrNull(
          row.previous
        ),

      changePct:
        numericOrNull(
          row.change_pct
        ),

      changeBp:
        numericOrNull(
          row.change_bp
        ),

      high52:
        numericOrNull(
          row.high52
        ),

      low52:
        numericOrNull(
          row.low52
        ),

      yearStart:
        numericOrNull(
          row.year_start
        ),

      yearStartDate:
        row.year_start_date ||
        null,

      yoyBase:
        numericOrNull(
          row.yoy_base
        ),

      yoyBaseDate:
        row.yoy_base_date ||
        null,

      priceDate:
        row.price_date ||
        null,

      previousDate:
        row.previous_date ||
        null,

      source:
        row.source || '',

      sourceSymbol:
        row.source_symbol || '',

      updatedAt:
        row.updated_at ||
        null
    };
  }


  function marketDateBounds(
    rows
  ) {

    const dates =
      rows
        .map(
          x =>
            x.priceDate
        )
        .filter(Boolean)
        .sort();


    return {

      earliest:
        dates.length
          ? dates[0]
          : null,

      latest:
        dates.length
          ? dates[
              dates.length - 1
            ]
          : null
    };
  }


  async function loadMarketPricesV33(
    options = {}
  ) {

    const {
      renderAfter = false,
      silent = false
    } = options;


    if (
      !sb ||
      !currentUser
    ) {

      if (!silent) {

        console.warn(
          '[v33] market_prices load skipped: cloud session not ready.'
        );
      }

      return false;
    }


    try {

      if (!silent) {

        setCloudStatus(
          '시장가격 불러오는 중',
          'busy'
        );
      }


      const {
        data: rows,
        error
      } = await sb
        .from(
          'market_prices'
        )
        .select(
          [
            'symbol',
            'name',
            'category',
            'current',
            'previous',
            'change_pct',
            'change_bp',
            'high52',
            'low52',
            'year_start',
            'year_start_date',
            'yoy_base',
            'yoy_base_date',
            'price_date',
            'previous_date',
            'source',
            'source_symbol',
            'updated_at'
          ].join(',')
        );


      if (error) {
        throw error;
      }


      const normalized =
        (rows || [])
          .map(
            normalizeMarketRow
          );


      resetMarketLive();


      normalized.forEach(
        row => {

          if (row.symbol) {

            marketLiveState
              .bySymbol[
                row.symbol
              ] = row;
          }


          if (row.code) {

            marketLiveState
              .byCode[
                row.code
              ] = row;
          }
        }
      );


      const bounds =
        marketDateBounds(
          normalized
        );


      marketLiveState.loaded =
        true;

      marketLiveState.loadedCount =
        normalized.length;

      marketLiveState.loadedAt =
        new Date()
          .toISOString();

      marketLiveState
        .latestPriceDate =
        bounds.latest;

      marketLiveState
        .earliestPriceDate =
        bounds.earliest;


      if (!silent) {

        setCloudStatus(
          '동기화됨',
          'ok'
        );
      }


      window.dispatchEvent(
        new CustomEvent(
          'portfolio:market-loaded',
          {
            detail: {
              count:
                normalized.length,

              latestPriceDate:
                bounds.latest
            }
          }
        )
      );


      if (
        renderAfter &&
        typeof render ===
          'function'
      ) {

        render();
      }


      return true;

    } catch (e) {

      marketLiveState.error =
        e;


      console.error(
        '[v33] market_prices load failed',
        e
      );


      if (!silent) {

        setCloudStatus(
          '시장가격 불러오기 실패',
          'err'
        );
      }


      return false;
    }
  }


  window.loadMarketPricesV33 =
    loadMarketPricesV33;


  //
  // ============================================================
  // Market master + runtime live merge
  // ============================================================
  //


  const marketBaseV33 =
    market;


  market =
    function (code) {

      const base =
        marketBaseV33(
          code
        );


      const live =
        marketLiveState
          .byCode[
            code
          ];


      if (!live) {

        return base;
      }


      return {

        ...base,


        name:
          base.name ||
          live.name ||
          code,


        current:
          live.current != null
            ? live.current
            : base.current,


        prevClose:
          live.previous != null
            ? live.previous
            : base.prevClose,


        high52:
          live.high52 != null
            ? live.high52
            : base.high52,


        low52:
          live.low52 != null
            ? live.low52
            : base.low52,


        yearStart:
          live.yearStart != null
            ? live.yearStart
            : base.yearStart,


        //
        // IMPORTANT:
        // When automatic data exists but YoY is unavailable
        // (e.g. newly listed ETF), do NOT fall back to an old
        // manually entered YoY base.
        //

        yoyBase:
          live.yoyBase != null
            ? live.yoyBase
            : null,


        livePriceDate:
          live.priceDate,


        livePreviousDate:
          live.previousDate,


        liveYearStartDate:
          live.yearStartDate,


        liveYoyBaseDate:
          live.yoyBaseDate,


        liveChangePct:
          live.changePct,


        liveSource:
          live.source,


        liveUpdatedAt:
          live.updatedAt,


        automaticPrice:
          true
      };
    };


  //
  // ============================================================
  // Core Allocation Sleeve
  //
  // "신규자금을 어디에 넣을까?"
  // ============================================================
  //


  function coreSleeveAllocationV33() {

    const core =
      coreAllocation();


    const byKey =
      Object.fromEntries(
        core.map(
          x => [
            x.key,
            x
          ]
        )
      );


    const defs = [
      {
        key: 'EQUITY',
        label:
          'NASDAQ + S&P500',
        target: 0.50,
        members: [
          'NASDAQ',
          'S&P500'
        ]
      },

      {
        key: 'INCOME',
        label:
          'K-DVD + US-CVD',
        target: 0.25,
        members: [
          'K-DVD',
          'US-CVD'
        ]
      },

      {
        key: 'HEDGE',
        label:
          'GOLD + BOND',
        target: 0.25,
        members: [
          'GOLD',
          'BOND'
        ]
      }
    ];


    return defs.map(
      d => {

        const weight =
          d.members.reduce(
            (
              s,
              key
            ) =>
              s +
              (
                byKey[key]
                  ? byKey[key]
                      .weight
                  : 0
              ),
            0
          );


        return {
          ...d,

          weight,

          gapPp:
            (
              weight -
              d.target
            ) * 100,

          relativeGap:
            d.target
              ? weight /
                  d.target -
                1
              : 0
        };
      }
    );
  }


  window.coreSleeveAllocationV33 =
    coreSleeveAllocationV33;


  //
  // ============================================================
  // Portfolio Exposure
  //
  // "내 돈이 실제 어디에 노출되어 있나?"
  // ============================================================
  //


  function pensionBucketRawV33() {

    const c =
      pensionCategoryValues();


    return {

      EQUITY: {

        buy:
          c.NASDAQ.buy +
          c['S&P500'].buy +
          c.GLOBAL.buy +
          c.WORLD.buy,

        value:
          c.NASDAQ.value +
          c['S&P500'].value +
          c.GLOBAL.value +
          c.WORLD.value
      },


      INCOME: {

        buy:
          c['US-CVD'].buy +
          c['K-DVD'].buy,

        value:
          c['US-CVD'].value +
          c['K-DVD'].value
      },


      HEDGE: {

        buy:
          c.BOND.buy +
          c.GOLD.buy,

        value:
          c.BOND.value +
          c.GOLD.value
      },


      PARKING: {

        buy:
          c.PARKING.buy,

        value:
          c.PARKING.value
      }
    };
  }


  function pensionBucketMetricV33(
    key,
    raw
  ) {

    const s =
      data.pensionBucketSnapshot
        .buckets[key];


    const snapshotEvalKRW =
      Number(
        s.snapshotEvalMan
      ) * 10000;


    const delta =
      raw.value -
      snapshotEvalKRW;


    const ytdPnl =
      Number(
        s.snapshotYtdPnlMan
      ) * 10000 +
      delta;


    const cumPnl =
      Number(
        s.snapshotCumPnlMan
      ) * 10000 +
      delta;


    const ytdRate =
      Number(
        s.snapshotYtdRate
      ) || 0;


    const ytdDenom =
      ytdRate
        ? Math.abs(
            Number(
              s.snapshotYtdPnlMan
            ) *
            10000 /
            (
              ytdRate /
              100
            )
          )
        : snapshotEvalKRW;


    return {

      key,

      buy:
        raw.buy,

      value:
        raw.value,

      ytdPnl,

      ytd:
        ytdDenom
          ? ytdPnl /
            ytdDenom
          : 0,

      cumPnl,

      tr:
        raw.buy
          ? cumPnl /
            raw.buy
          : 0
    };
  }


  function pensionBucketMetricsV33() {

    const raw =
      pensionBucketRawV33();


    const buckets = {};


    PENSION_BUCKET_KEYS.forEach(
      key => {

        buckets[key] =
          pensionBucketMetricV33(
            key,
            raw[key]
          );
      }
    );


    const total = {

      buy:
        PENSION_BUCKET_KEYS
          .reduce(
            (
              s,
              key
            ) =>
              s +
              buckets[key].buy,
            0
          ),

      value:
        PENSION_BUCKET_KEYS
          .reduce(
            (
              s,
              key
            ) =>
              s +
              buckets[key].value,
            0
          ),

      ytdPnl:
        PENSION_BUCKET_KEYS
          .reduce(
            (
              s,
              key
            ) =>
              s +
              buckets[key].ytdPnl,
            0
          ),

      cumPnl:
        PENSION_BUCKET_KEYS
          .reduce(
            (
              s,
              key
            ) =>
              s +
              buckets[key].cumPnl,
            0
          )
    };


    total.tr =
      total.buy
        ? total.cumPnl /
          total.buy
        : 0;


    const pension =
      aggregateSummary(
        PENSION_IDS
      );


    total.ytd =
      pension.ytd;


    return {
      raw,
      buckets,
      total
    };
  }


  window.pensionBucketMetricsV33 =
    pensionBucketMetricsV33;

   //
  // ============================================================
  // Performance v3.3
  // ============================================================
  //

  function performanceDurationV33(scope) {

    if (
      scope === '자녀연금'
    ) {
      return (
        acct('CHILD')
          ?.durationYears ||
        0.8233
      );
    }


    if (
      scope === 'ISA'
    ) {
      return (
        acct('ISA')
          ?.durationYears ||
        1.6731
      );
    }


    if (
      scope === '일반계좌'
    ) {
      return (
        acct('GENERAL')
          ?.durationYears ||
        1.6731
      );
    }


    if (
      scope === 'DC'
    ) {
      return (
        acct('DC')
          ?.durationYears ||
        1.6731
      );
    }


    if (
      scope === '연금(1)'
    ) {
      return (
        acct('P1')
          ?.durationYears ||
        1.6731
      );
    }


    if (
      scope === '연금(2)'
    ) {
      return (
        acct('P2')
          ?.durationYears ||
        1.6731
      );
    }


    return (
      data.fixedPerformance
        ?.Total
        ?.durationYears ||
      1.6731
    );
  }


  function performanceRowsV33() {

    const buckets =
      pensionBucketMetricsV33()
        .buckets;


    const ytd25 =
      data.performanceV33
        .ytd25;


    const defs = [

      {
        scope: 'DC',
        group: 'PENSION_ACCOUNT',
        type: 'account',
        id: 'DC'
      },

      {
        scope: '연금(1)',
        group: 'PENSION_ACCOUNT',
        type: 'account',
        id: 'P1'
      },

      {
        scope: '연금(2)',
        group: 'PENSION_ACCOUNT',
        type: 'account',
        id: 'P2'
      },

      {
        scope: '연금합산',
        group: 'PENSION_ACCOUNT',
        type: 'aggregate',
        ids: PENSION_IDS
      },


      {
        scope: 'EQUITY',
        group: 'PENSION_BUCKET',
        type: 'bucket',
        id: 'EQUITY'
      },

      {
        scope: 'INCOME',
        group: 'PENSION_BUCKET',
        type: 'bucket',
        id: 'INCOME'
      },

      {
        scope: 'HEDGE',
        group: 'PENSION_BUCKET',
        type: 'bucket',
        id: 'HEDGE'
      },

      {
        scope: 'PARKING',
        group: 'PENSION_BUCKET',
        type: 'bucket',
        id: 'PARKING'
      },


      {
        scope: 'ISA',
        group: 'OTHER',
        type: 'account',
        id: 'ISA'
      },

      {
        scope: '일반계좌',
        group: 'OTHER',
        type: 'account',
        id: 'GENERAL'
      },

      {
        scope: '자녀연금',
        group: 'OTHER',
        type: 'account',
        id: 'CHILD'
      },

      {
        scope: 'Total',
        group: 'OTHER',
        type: 'aggregate',
        ids: INVESTMENT_IDS
      }
    ];


    return defs.map(
      def => {

        let y26 = 0;
        let tr = 0;


        if (
          def.type ===
          'account'
        ) {

          const s =
            accountSummary(
              def.id
            );

          y26 =
            s.ytd;

          tr =
            s.tr;

        } else if (
          def.type ===
          'aggregate'
        ) {

          const s =
            aggregateSummary(
              def.ids
            );

          y26 =
            s.ytd;

          tr =
            s.tr;

        } else if (
          def.type ===
          'bucket'
        ) {

          const s =
            buckets[
              def.id
            ];

          y26 =
            s.ytd;

          tr =
            s.tr;
        }


        const y25 =
          Number(
            ytd25[
              def.scope
            ]
          ) || 0;


        const twr =
          (
            1 +
            y25 / 100
          ) *
          (
            1 +
            y26
          ) -
          1;


        const duration =
          performanceDurationV33(
            def.scope
          );


        const cagr =
          duration > 0 &&
          1 + twr > 0

            ? Math.pow(
                1 + twr,
                1 / duration
              ) - 1

            : 0;


        return {

          scope:
            def.scope,

          group:
            def.group,

          y25,

          y26:
            y26 * 100,

          tr:
            tr * 100,

          twr:
            twr * 100,

          cagr:
            cagr * 100
        };
      }
    );
  }


  window.performanceRowsV33 =
    performanceRowsV33;


  //
  // Replace old Performance calculation source.
  //

  performanceRows =
    performanceRowsV33;


  //
  // ============================================================
  // Safe daily rollover
  // ============================================================
  //
  // Old v3 logic copied current -> previous
  // whenever the local calendar date changed.
  //
  // When automatic market_prices is available,
  // previous/current dates are supplied by the
  // market data collector, so the browser must
  // NOT modify price history.
  // ============================================================
  //


  const dailyRolloverLegacyV33 =
    dailyRollover;


  dailyRollover =
    function () {

      if (
        marketLiveState.loaded &&
        marketLiveState.loadedCount > 0
      ) {

        if (
          marketLiveState.latestPriceDate
        ) {

          data.meta.valuationDate =
            marketLiveState
              .latestPriceDate;
        }


        const previousDates =
          Object.values(
            marketLiveState
              .byCode
          )
            .map(
              x =>
                x.previousDate
            )
            .filter(Boolean)
            .sort();


        if (
          previousDates.length
        ) {

          data.meta.previousDate =
            previousDates[
              previousDates.length -
              1
            ];
        }


        return;
      }


      //
      // Automatic market data unavailable:
      // retain legacy manual-price fallback.
      //

      return dailyRolloverLegacyV33();
    };


  //
  // ============================================================
  // Cloud load integration
  // ============================================================
  //


  const loadCloudBeforeV33 =
    loadCloud;


  loadCloud =
    async function () {

      await loadCloudBeforeV33();


      //
      // Existing portfolio_state is now loaded.
      //

      const changed =
        migrateV33();


      //
      // Automatic prices are loaded separately.
      // They are runtime data and are NOT copied
      // into portfolio_state.
      //

      await loadMarketPricesV33({
        renderAfter: false,
        silent: true
      });


      //
      // With market_prices loaded, date rollover
      // updates only display metadata.
      //

      dailyRollover();


      localStorage.setItem(
        KEY,
        JSON.stringify(data)
      );


      //
      // Persist migration only if portfolio data
      // actually changed.
      //

      if (
        changed &&
        cloudReady
      ) {

        scheduleCloudSave();
      }
    };


  //
  // ============================================================
  // Cloud save feedback / timestamp
  // ============================================================
  //


  const flushCloudBeforeV33 =
    flushCloud;


  flushCloud =
    async function () {

      const result =
        await flushCloudBeforeV33();


      if (
        result === true
      ) {

        const now =
          new Date()
            .toISOString();


        data.meta.lastSavedAt =
          now;


        localStorage.setItem(
          KEY,
          JSON.stringify(data)
        );


        window.dispatchEvent(
          new CustomEvent(
            'portfolio:saved',
            {
              detail: {
                ok: true,
                savedAt: now
              }
            }
          )
        );


        return true;
      }


      window.dispatchEvent(
        new CustomEvent(
          'portfolio:saved',
          {
            detail: {
              ok: false,
              savedAt: null
            }
          }
        )
      );


      return result;
    };


  //
  // ============================================================
  // Explicit market refresh
  // ============================================================
  //


  async function refreshMarketPricesV33() {

    const ok =
      await loadMarketPricesV33({
        renderAfter: false,
        silent: false
      });


    if (!ok) {

      alert(
        '자동 시장가격을 불러오지 못했습니다.'
      );

      return;
    }


    dailyRollover();


    if (
      typeof render ===
      'function'
    ) {

      render();
    }


    window.dispatchEvent(
      new CustomEvent(
        'portfolio:market-refreshed',
        {
          detail: {
            count:
              marketLiveState
                .loadedCount,

            latestPriceDate:
              marketLiveState
                .latestPriceDate
          }
        }
      )
    );
  }


  window.refreshMarketPricesV33 =
    refreshMarketPricesV33;


  //
  // ============================================================
  // Market view transitional bridge
  // ============================================================
  //
  // Full sorting / ETF CHECK / held-only filtering
  // comes in v33-views.js.
  //
  // This bridge makes sure automatic prices are
  // visible immediately after the Core layer is
  // installed.
  // ============================================================
  //


  marketView =
    function () {

      const rows =
        data.market
          .map(
            (
              base,
              i
            ) => {

              const m =
                market(
                  base.code
                );


              const x =
                marketMetrics(
                  m
                );


              const live =
                marketLiveState
                  .byCode[
                    base.code
                  ];


              const automatic =
                !!live;


              const currentCell =
                automatic

                  ? `
                    <b>
                      ${won(
                        m.current
                      )}
                    </b>

                    <div class="small">
                      ${
                        esc(
                          live.priceDate ||
                          ''
                        )
                      }
                      ${
                        live.source
                          ? ' · ' +
                            esc(
                              live.source
                            )
                          : ''
                      }
                    </div>
                  `

                  : `
                    <input
                      class="priceInput"
                      type="number"
                      value="${m.current}"
                      onchange="data.market[${i}].current=+this.value"
                    >
                  `;


              const yoyText =
                m.yoyBase
                  ? pct(
                      x.yoy *
                      100
                    )
                  : 'n/a';


              return `
                <tr>

                  <td>
                    ${pct(
                      x.daily *
                      100
                    )}
                  </td>

                  <td>
                    ${esc(
                      m.name
                    )}

                    <div class="small">
                      ${m.code}
                    </div>
                  </td>

                  <td>
                    ${won(
                      m.prevClose
                    )}
                  </td>

                  <td>
                    ${currentCell}
                  </td>

                  <td>
                    ${pct(
                      x.cpHp *
                      100
                    )}
                  </td>

                  <td>
                    ${pct(
                      x.cpLp *
                      100
                    )}
                  </td>

                  <td>
                    ${pct(
                      x.ytd *
                      100
                    )}
                  </td>

                  <td>
                    ${yoyText}
                  </td>

                  <td>
                    ${pct(
                      x.lpHp *
                      100
                    )}
                  </td>

                  <td>
                    ${won(
                      m.high52
                    )}
                  </td>

                  <td>
                    ${won(
                      m.low52
                    )}
                  </td>

                  <td>
                    ${won(
                      m.yearStart
                    )}
                  </td>

                  <td>
                    ${
                      m.yoyBase
                        ? won(
                            m.yoyBase
                          )
                        : 'n/a'
                    }
                  </td>

                </tr>
              `;

            }
          )
          .join('');


      const statusText =
        marketLiveState.loaded

          ? `
            자동 시장가격
            ${marketLiveState.loadedCount}개
            · 최근 기준
            ${
              esc(
                marketLiveState
                  .latestPriceDate ||
                '-'
              )
            }
          `

          : `
            자동 시장가격 미연결
            · 기존 수동가격 사용
          `;


      return `

        <div class="actions">

          <button
            class="btn primary"
            onclick="refreshMarketPricesV33()"
          >
            자동가격 새로고침
          </button>

          <span class="small">
            ${statusText}
          </span>

        </div>


        <div class="notice">

          자동가격이 있는 종목은
          Supabase
          <b>market_prices</b>
          데이터를 사용합니다.

          현재가·전일가·52주 고저가·
          YTD 기준가·YoY 기준가는
          portfolio_state와 분리되어
          저장됩니다.

          자동가격이 없는 종목만
          기존 수동가격을 fallback으로
          사용합니다.

        </div>


        <div class="tableWrap">

          <table class="mid">

            <thead>

              <tr class="thead">

                <th>
                  전일대비
                </th>

                <th>
                  종목
                </th>

                <th>
                  전일
                </th>

                <th>
                  현재가
                </th>

                <th>
                  CP/HP
                </th>

                <th>
                  CP/LP
                </th>

                <th>
                  YTD
                </th>

                <th>
                  YoY
                </th>

                <th>
                  LP/HP
                </th>

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
              ${rows}
            </tbody>

          </table>

        </div>

      `;
    };


  //
  // ============================================================
  // Navigation date label
  // ============================================================
  //


  const navBeforeV33 =
    nav;


  nav =
    function () {

      navBeforeV33();


      const label =
        document.getElementById(
          'dateLabel'
        );


      if (!label) {
        return;
      }


      if (
        marketLiveState.loaded
      ) {

        label.textContent =
          `자동 시장가격 ${
            marketLiveState
              .latestPriceDate ||
            '-'
          } · ${
            marketLiveState
              .loadedCount
          }개`;
      }
    };


  //
  // ============================================================
  // Current migration now
  // ============================================================
  //
  // This runs against localStorage data immediately.
  // After Supabase portfolio_state is loaded,
  // loadCloud() runs migration again.
  // Therefore the migration is intentionally
  // idempotent.
  // ============================================================
  //


  migrateV33();


  console.info(
    '[Portfolio Control] v3.3 core loaded'
  );

})();
