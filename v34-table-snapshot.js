// Portfolio Control v3.4
// Simple year-based table snapshots.
//
// Purpose:
// - Snapshot the tables the user is currently looking at.
// - Store structured table data in a separate Supabase table.
// - Do NOT recalculate historical financial values.
//
// Snapshot types:
//   performance
//   growth_dividend
//   cash_like
//
// 2025 History remains owned by the existing v33 History renderer.

(function () {
  'use strict';

  const TABLE_NAME =
    'portfolio_table_snapshots';

  const SCHEMA_VERSION = 1;

  const SNAPSHOT_TYPES = {
    performance: {
      label: 'Performance'
    },

    growth_dividend: {
      label: 'Growth & 배당'
    },

    cash_like: {
      label: '예금성 자금'
    }
  };

  const cache = {
    loaded: false,
    loading: false,
    rows: []
  };

  let legacyHistoryView = null;
  let historyOverrideInstalled = false;
  let observer = null;


  // ============================================================
  // Common helpers
  // ============================================================

  function escV34(value) {
    return String(
      value ?? ''
    )
      .replaceAll(
        '&',
        '&amp;'
      )
      .replaceAll(
        '<',
        '&lt;'
      )
      .replaceAll(
        '>',
        '&gt;'
      )
      .replaceAll(
        '"',
        '&quot;'
      )
      .replaceAll(
        "'",
        '&#039;'
      );
  }


  function normalizeTextV34(value) {
    return String(
      value ?? ''
    )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();
  }


  function currentYearV34() {
    return new Date()
      .getFullYear();
  }


  function valuationDateV34() {
    const raw =
      data?.meta
        ?.valuationDate;

    if (!raw) {
      return null;
    }

    const text =
      String(raw)
        .trim();

    return (
      /^\d{4}-\d{2}-\d{2}$/
        .test(text)
        ? text
        : null
    );
  }


  function formatDateTimeV34(
    value
  ) {
    if (!value) {
      return '-';
    }

    const d =
      new Date(value);

    if (
      Number.isNaN(
        d.getTime()
      )
    ) {
      return String(value);
    }

    return new Intl
      .DateTimeFormat(
        'ko-KR',
        {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }
      )
      .format(d);
  }


  function getSupabaseClientV34() {
    if (
      typeof sb !==
        'undefined' &&
      sb
    ) {
      return sb;
    }

    if (window.sb) {
      return window.sb;
    }

    return null;
  }


  async function currentUserV34() {
    const client =
      getSupabaseClientV34();

    if (!client) {
      throw new Error(
        'Supabase client를 찾을 수 없습니다.'
      );
    }

    const {
      data: authData,
      error
    } =
      await client.auth
        .getUser();

    if (error) {
      throw error;
    }

    const user =
      authData?.user;

    if (!user?.id) {
      throw new Error(
        '로그인 사용자를 확인할 수 없습니다.'
      );
    }

    return user;
  }


  function alertErrorV34(
    prefix,
    error
  ) {
    console.error(
      `[v34 snapshot] ${prefix}`,
      error
    );

    alert(
      `${prefix}\n\n${
        error?.message ||
        String(error)
      }`
    );
  }


  // ============================================================
  // DOM table capture
  // ============================================================

  function cellValueV34(cell) {
    if (!cell) {
      return '';
    }

    const input =
      cell.querySelector(
        'input, select, textarea'
      );

    if (input) {
      if (
        input.tagName ===
          'SELECT'
      ) {
        return normalizeTextV34(
          input.options[
            input.selectedIndex
          ]?.text ??
          input.value
        );
      }

      return normalizeTextV34(
        input.value
      );
    }

    return normalizeTextV34(
      cell.innerText ||
      cell.textContent ||
      ''
    );
  }


  function captureTableV34(
    table
  ) {
    if (
      !table ||
      table.tagName !==
        'TABLE'
    ) {
      throw new Error(
        'Snapshot 대상 table을 찾지 못했습니다.'
      );
    }

    const headers =
      Array.from(
        table.querySelectorAll(
          'thead tr:last-child th'
        )
      )
        .map(
          th =>
            normalizeTextV34(
              th.innerText ||
              th.textContent ||
              ''
            )
        );

    const rows =
      Array.from(
        table.querySelectorAll(
          'tbody tr'
        )
      )
        .map(
          tr =>
            Array.from(
              tr.children
            )
              .filter(
                cell =>
                  cell.tagName ===
                    'TD' ||
                  cell.tagName ===
                    'TH'
              )
              .map(
                cell =>
                  cellValueV34(
                    cell
                  )
              )
        )
        .filter(
          row =>
            row.some(
              value =>
                normalizeTextV34(
                  value
                ) !== ''
            )
        );

    if (
      !headers.length ||
      !rows.length
    ) {
      throw new Error(
        'Snapshot 대상 table이 비어 있습니다.'
      );
    }

    return {
      headers,
      rows
    };
  }


  function tableTitleBeforeV34(
    table
  ) {
    if (!table) {
      return '';
    }

    let node =
      table.parentElement;

    for (
      let depth = 0;
      node &&
      depth < 5;
      depth++,
      node = node.parentElement
    ) {
      const heading =
        node.querySelector(
          ':scope > h2, :scope > h3'
        );

      if (heading) {
        return normalizeTextV34(
          heading.textContent
        );
      }
    }

    return '';
  }


  function allVisibleTablesV34() {
    const content =
      document.getElementById(
        'content'
      );

    if (!content) {
      return [];
    }

    return Array.from(
      content.querySelectorAll(
        'table'
      )
    )
      .filter(
        table =>
          table.offsetParent !==
            null
      );
  }


  // ============================================================
  // Find current source tables
  // ============================================================

  function findPerformanceTableV34() {
    const table =
      document.querySelector(
        '#content .v33-performance-table'
      );

    if (!table) {
      throw new Error(
        '현재 Overview의 Performance 표를 찾지 못했습니다.'
      );
    }

    return table;
  }


  function findGrowthTableV34() {
    const tables =
      allVisibleTablesV34();

    const direct =
      tables.find(
        table => {
          const headers =
            Array.from(
              table.querySelectorAll(
                'thead th'
              )
            )
              .map(
                th =>
                  normalizeTextV34(
                    th.textContent
                  )
              );

          return (
            headers.includes(
              '월'
            ) &&
            headers.includes(
              '총증감'
            ) &&
            headers.includes(
              '평가액'
            ) &&
            headers.includes(
              'Growth'
            )
          );
        }
      );

    if (!direct) {
      throw new Error(
        '현재 Growth 표를 찾지 못했습니다.'
      );
    }

    return direct;
  }


  function findDividendTableV34() {
    const tables =
      allVisibleTablesV34();

    const direct =
      tables.find(
        table => {
          const headers =
            Array.from(
              table.querySelectorAll(
                'thead th'
              )
            )
              .map(
                th =>
                  normalizeTextV34(
                    th.textContent
                  )
              );

          return (
            headers[0] ===
              '월' &&
            headers.includes(
              '합계'
            ) &&
            table.querySelector(
              'input.numInput'
            )
          );
        }
      );

    if (!direct) {
      throw new Error(
        '현재 배당금 현황 표를 찾지 못했습니다.'
      );
    }

    return direct;
  }


  function findCashLikeTableV34() {
    const tables =
      allVisibleTablesV34();

    const direct =
      tables.find(
        table => {
          const headers =
            Array.from(
              table.querySelectorAll(
                'thead th'
              )
            )
              .map(
                th =>
                  normalizeTextV34(
                    th.textContent
                  )
              );

          return (
            headers.includes(
              '항목'
            ) &&
            headers.includes(
              '26 기준액'
            ) &&
            headers.includes(
              '평가액'
            ) &&
            headers.includes(
              '누적손익'
            ) &&
            headers.includes(
              '만기'
            )
          );
        }
      );

    if (!direct) {
      throw new Error(
        '현재 예금성 자금 표를 찾지 못했습니다.'
      );
    }

    return direct;
  }


  // ============================================================
  // Remove redundant dividend account-total table
  // ============================================================

  function hideDividendAccountTotalV34() {
    const content =
      document.getElementById(
        'content'
      );

    if (!content) {
      return;
    }

    const headings =
      Array.from(
        content.querySelectorAll(
          'h2, h3'
        )
      );

    const heading =
      headings.find(
        h =>
          normalizeTextV34(
            h.textContent
          ) ===
          '계좌별 합계'
      );

    if (!heading) {
      return;
    }

    const next =
      heading.nextElementSibling;

    heading.remove();

    if (
      next &&
      (
        next.matches(
          '.tableWrap'
        ) ||
        next.matches(
          'table'
        )
      )
    ) {
      next.remove();
    }
  }


  // ============================================================
  // Capture payloads
  // ============================================================

  function capturePerformanceV34() {
    return {
      title:
        'Performance',

      tables: [
        {
          key:
            'performance',

          title:
            'Performance',

          ...captureTableV34(
            findPerformanceTableV34()
          )
        }
      ]
    };
  }


  function captureGrowthDividendV34() {
    const growth =
      findGrowthTableV34();

    const dividend =
      findDividendTableV34();

    return {
      title:
        'Growth & 배당',

      tables: [
        {
          key:
            'growth',

          title:
            tableTitleBeforeV34(
              growth
            ) ||
            `${currentYearV34()} 월별 금융자산 Growth`,

          ...captureTableV34(
            growth
          )
        },

        {
          key:
            'dividend',

          title:
            tableTitleBeforeV34(
              dividend
            ) ||
            `${currentYearV34()} 배당금 현황`,

          ...captureTableV34(
            dividend
          )
        }
      ]
    };
  }


  function captureCashLikeV34() {
    const cash =
      findCashLikeTableV34();

    return {
      title:
        '예금성 자금',

      tables: [
        {
          key:
            'cash_like',

          title:
            '예금성 자금',

          ...captureTableV34(
            cash
          )
        }
      ]
    };
  }


  function captureByTypeV34(
    type
  ) {
    if (
      type ===
        'performance'
    ) {
      return capturePerformanceV34();
    }

    if (
      type ===
        'growth_dividend'
    ) {
      return captureGrowthDividendV34();
    }

    if (
      type ===
        'cash_like'
    ) {
      return captureCashLikeV34();
    }

    throw new Error(
      `지원하지 않는 Snapshot 종류입니다: ${type}`
    );
  }


  // ============================================================
  // Snapshot year UX
  // ============================================================

  function chooseYearV34() {
    const current =
      currentYearV34();

    const raw =
      prompt(
        'Snapshot 연도를 입력하세요.',
        String(current)
      );

    if (raw == null) {
      return null;
    }

    const year =
      Number(
        String(raw)
          .trim()
      );

    if (
      !Number.isInteger(
        year
      ) ||
      year < 2026 ||
      year > current
    ) {
      alert(
        `Snapshot 연도는 2026~${current} 사이의 연도여야 합니다.`
      );

      return null;
    }

    if (
      year !== current
    ) {
      const ok =
        confirm(
          `현재 연도는 ${current}년입니다.\n\n` +
          `현재 화면의 값을 ${year}년 Snapshot으로 저장하려고 합니다.\n` +
          '계속하시겠습니까?'
        );

      if (!ok) {
        return null;
      }
    }

    return year;
  }


  // ============================================================
  // Supabase cache / persistence
  // ============================================================

  function cacheRowV34(
    row
  ) {
    const index =
      cache.rows.findIndex(
        x =>
          Number(x.year) ===
            Number(row.year) &&
          x.snapshot_type ===
            row.snapshot_type
      );

    if (index >= 0) {
      cache.rows[index] =
        row;
    } else {
      cache.rows.push(
        row
      );
    }
  }


  function cachedSnapshotV34(
    year,
    type
  ) {
    return (
      cache.rows.find(
        row =>
          Number(row.year) ===
            Number(year) &&
          row.snapshot_type ===
            type
      ) ||
      null
    );
  }


  function cachedYearsV34() {
    return Array.from(
      new Set(
        cache.rows
          .map(
            row =>
              Number(
                row.year
              )
          )
          .filter(
            year =>
              Number.isInteger(
                year
              ) &&
              year >= 2026
          )
      )
    )
      .sort(
        (
          a,
          b
        ) =>
          b - a
      );
  }


  async function loadSnapshotsV34(
    force = false
  ) {
    if (
      cache.loading
    ) {
      //
      // 다른 load가 진행 중이면
      // 끝날 때까지 짧게 기다린 뒤
      // force reload를 다시 수행한다.
      //
      if (force) {
        while (
          cache.loading
        ) {
          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                50
              )
          );
        }

        return loadSnapshotsV34(
          true
        );
      }

      return;
    }

    if (
      cache.loaded &&
      !force
    ) {
      return;
    }

    const client =
      getSupabaseClientV34();

    if (!client) {
      return;
    }

    cache.loading = true;

    try {
      const user =
        await currentUserV34();

      const {
        data: rows,
        error
      } =
        await client
          .from(
            TABLE_NAME
          )
          .select(
            'id,user_id,year,snapshot_type,schema_version,captured_at,valuation_date,snapshot_data,updated_at'
          )
          .eq(
            'user_id',
            user.id
          )
          .order(
            'year',
            {
              ascending:
                false
            }
          );

      if (error) {
        throw error;
      }

      cache.rows =
        Array.isArray(rows)
          ? rows
          : [];

      cache.loaded = true;

      console.info(
        '[v34 snapshot] loaded',
        cache.rows.map(
          row => ({
            year:
              row.year,
            type:
              row.snapshot_type
          })
        )
      );

    } catch (error) {
      cache.loaded = false;

      console.warn(
        '[v34 snapshot] load failed',
        error
      );

      throw error;

    } finally {
      cache.loading = false;
    }
  }


  async function saveSnapshotV34(
    type
  ) {
    try {
      const meta =
        SNAPSHOT_TYPES[
          type
        ];

      if (!meta) {
        throw new Error(
          'Snapshot 종류가 올바르지 않습니다.'
        );
      }

      const year =
        chooseYearV34();

      if (year == null) {
        return;
      }

      const payload =
        captureByTypeV34(
          type
        );

      const client =
        getSupabaseClientV34();

      if (!client) {
        throw new Error(
          'Supabase client를 찾을 수 없습니다.'
        );
      }

      const user =
        await currentUserV34();

      let existing =
        cachedSnapshotV34(
          year,
          type
        );

      if (
        !cache.loaded
      ) {
        await loadSnapshotsV34(
          true
        );

        existing =
          cachedSnapshotV34(
            year,
            type
          );
      }

      if (existing) {
        const oldTime =
          formatDateTimeV34(
            existing
              .captured_at
          );

        const ok =
          confirm(
            `${year}년 ${meta.label} Snapshot이 이미 있습니다.\n\n` +
            `기존 저장: ${oldTime}\n\n` +
            '현재 화면의 값으로 교체하시겠습니까?'
          );

        if (!ok) {
          return;
        }
      } else {
        const ok =
          confirm(
            `현재 ${meta.label}을 ${year}년 History에 저장하시겠습니까?`
          );

        if (!ok) {
          return;
        }
      }

      const now =
        new Date()
          .toISOString();

      const record = {
        user_id:
          user.id,

        year,

        snapshot_type:
          type,

        schema_version:
          SCHEMA_VERSION,

        captured_at:
          now,

        valuation_date:
          valuationDateV34(),

        snapshot_data:
          payload,

        updated_at:
          now
      };

      const {
        data: saved,
        error
      } =
        await client
          .from(
            TABLE_NAME
          )
          .upsert(
            record,
            {
              onConflict:
                'user_id,year,snapshot_type'
            }
          )
          .select(
            'id,user_id,year,snapshot_type,schema_version,captured_at,valuation_date,snapshot_data,updated_at'
          )
          .single();

      if (error) {
        throw error;
      }

      cacheRowV34(
        saved
      );

      alert(
        `${year}년 ${meta.label} Snapshot을 저장했습니다.`
      );

      if (
        typeof render ===
          'function'
      ) {
        render();
      }

    } catch (error) {
      alertErrorV34(
        'Snapshot 저장에 실패했습니다.',
        error
      );
    }
  }


  // ============================================================
  // Button injection
  // ============================================================

  function makeSnapshotButtonV34(
    type,
    label = 'Snapshot'
  ) {
    const button =
      document.createElement(
        'button'
      );

    button.type =
      'button';

    button.className =
      'btn v34-snapshot-btn';

    button.dataset
      .snapshotType =
      type;

    button.textContent =
      label;

    button.addEventListener(
      'click',
      () =>
        saveSnapshotV34(
          type
        )
    );

    return button;
  }


  function ensureActionBoxV34(
    heading
  ) {
    let box =
      heading.querySelector(
        '.v34-snapshot-actions'
      );

    if (box) {
      return box;
    }

    box =
      document.createElement(
        'div'
      );

    box.className =
      'v34-snapshot-actions';

    heading.appendChild(
      box
    );

    return box;
  }


  function injectPerformanceButtonV34() {
    const table =
      document.querySelector(
        '#content .v33-performance-table'
      );

    if (!table) {
      return;
    }

    const section =
      table.closest(
        '.v33-section'
      );

    const heading =
      section?.querySelector(
        '.v33-section-heading'
      );

    if (!heading) {
      return;
    }

    const box =
      ensureActionBoxV34(
        heading
      );

    if (
      box.querySelector(
        '[data-snapshot-type="performance"]'
      )
    ) {
      return;
    }

    box.appendChild(
      makeSnapshotButtonV34(
        'performance'
      )
    );
  }


  function injectGrowthDividendButtonV34() {
    let growth;

    try {
      growth =
        findGrowthTableV34();

    } catch (e) {
      return;
    }

    const page =
      growth.closest(
        '.v33-merged-page'
      );

    if (!page) {
      return;
    }

    const sections =
      Array.from(
        page.querySelectorAll(
          ':scope > .v33-merged-section'
        )
      );

    const growthSection =
      sections.find(
        section =>
          normalizeTextV34(
            section
              .querySelector(
                '.v33-merged-heading h2'
              )
              ?.textContent
          ) ===
          'Growth'
      );

    if (!growthSection) {
      return;
    }

    const heading =
      growthSection.querySelector(
        '.v33-merged-heading'
      );

    if (!heading) {
      return;
    }

    const box =
      ensureActionBoxV34(
        heading
      );

    if (
      box.querySelector(
        '[data-snapshot-type="growth_dividend"]'
      )
    ) {
      return;
    }

    box.appendChild(
      makeSnapshotButtonV34(
        'growth_dividend',
        'Growth & 배당 Snapshot'
      )
    );
  }


  function injectCashLikeButtonV34() {
    let cash;

    try {
      cash =
        findCashLikeTableV34();

    } catch (e) {
      return;
    }

    const section =
      cash.closest(
        '.v33-merged-section'
      );

    const heading =
      section?.querySelector(
        '.v33-merged-heading'
      );

    if (!heading) {
      return;
    }

    const box =
      ensureActionBoxV34(
        heading
      );

    if (
      box.querySelector(
        '[data-snapshot-type="cash_like"]'
      )
    ) {
      return;
    }

    box.appendChild(
      makeSnapshotButtonV34(
        'cash_like'
      )
    );
  }


  function enhanceCurrentViewV34() {
    hideDividendAccountTotalV34();

    injectPerformanceButtonV34();
    injectGrowthDividendButtonV34();
    injectCashLikeButtonV34();
  }


  // ============================================================
  // Snapshot rendering
  // ============================================================

  function renderStoredTableV34(
    table
  ) {
    if (
      !table ||
      !Array.isArray(
        table.headers
      ) ||
      !Array.isArray(
        table.rows
      )
    ) {
      return '';
    }

    const headerHtml =
      table.headers
        .map(
          header => `
            <th>
              ${escV34(
                header
              )}
            </th>
          `
        )
        .join('');

    const bodyHtml =
      table.rows
        .map(
          row => `
            <tr>
              ${
                row
                  .map(
                    cell => `
                      <td>
                        ${escV34(
                          cell
                        )}
                      </td>
                    `
                  )
                  .join('')
              }
            </tr>
          `
        )
        .join('');

    return `
      <div
        class="v34-snapshot-card"
      >
        <h3>
          ${escV34(
            table.title ||
            ''
          )}
        </h3>

        <div
          class="tableWrap
                 v34-snapshot-table-wrap"
        >
          <table
            class="mid"
          >
            <thead>
              <tr
                class="thead"
              >
                ${headerHtml}
              </tr>
            </thead>

            <tbody>
              ${bodyHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }


  function snapshotMetaHtmlV34(
    row
  ) {
    if (!row) {
      return '';
    }

    return `
      <div
        class="v34-snapshot-meta"
      >
        <span
          class="v34-snapshot-time"
        >
          Snapshot 저장:
          ${escV34(
            formatDateTimeV34(
              row.captured_at
            )
          )}
        </span>

        ${
          row.valuation_date
            ? `
              <span
                class="v34-snapshot-source-date"
              >
                평가기준일:
                ${escV34(
                  row.valuation_date
                )}
              </span>
            `
            : ''
        }
      </div>
    `;
  }


  function snapshotSectionV34(
    year,
    type
  ) {
    const meta =
      SNAPSHOT_TYPES[
        type
      ];

    const row =
      cachedSnapshotV34(
        year,
        type
      );

    if (!row) {
      return `
        <section
          class="v34-snapshot-card"
        >
          <h2>
            ${escV34(
              meta.label
            )}
          </h2>

          <div
            class="v34-snapshot-empty"
          >
            저장된 Snapshot이 없습니다.
          </div>
        </section>
      `;
    }

    const payload =
      row.snapshot_data ||
      {};

    const tables =
      Array.isArray(
        payload.tables
      )
        ? payload.tables
        : [];

    return `
      <section
        class="v34-snapshot-card"
      >
        <div
          class="v34-snapshot-history-heading"
        >
          <div>
            <h2>
              ${escV34(
                meta.label
              )}
            </h2>

            ${snapshotMetaHtmlV34(
              row
            )}
          </div>
        </div>

        ${
          tables
            .map(
              renderStoredTableV34
            )
            .join('')
        }
      </section>
    `;
  }


  // ============================================================
  // History renderer
  // ============================================================

  function allHistoryYearsV34() {
    const legacy =
      Object.keys(
        data?.history
          ?.years ||
        {}
      )
        .map(Number)
        .filter(
          Number.isFinite
        );

    return Array.from(
      new Set([
        ...legacy,
        ...cachedYearsV34()
      ])
    )
      .sort(
        (
          a,
          b
        ) =>
          b - a
      );
  }


  function selectedHistoryYearV34() {
    const years =
      allHistoryYearsV34();

    const selected =
      Number(
        data?.history
          ?.selectedYear
      );

    if (
      years.includes(
        selected
      )
    ) {
      return selected;
    }

    return (
      years[0] ||
      2025
    );
  }


  function historySelectorV34(
    selected
  ) {
    const years =
      allHistoryYearsV34();

    return `
      <div
        class="v33-history-toolbar"
      >
        <label>
          Year

          <select
            class="v34-snapshot-year-select"
            onchange="historySelectYearV34(this.value)"
          >
            ${
              years
                .map(
                  year => `
                    <option
                      value="${year}"
                      ${
                        year ===
                          selected
                          ? 'selected'
                          : ''
                      }
                    >
                      ${year}
                    </option>
                  `
                )
                .join('')
            }
          </select>
        </label>

        ${
          selected >= 2026
            ? `
              <span
                class="v34-snapshot-status"
              >
                Table Snapshot
              </span>
            `
            : ''
        }
      </div>
    `;
  }


  function incomeTaxOnlyHtmlV34() {
    if (
      typeof legacyHistoryView !==
        'function'
    ) {
      return '';
    }

    const wrapper =
      document.createElement(
        'div'
      );

    wrapper.innerHTML =
      legacyHistoryView();

    const page =
      wrapper.querySelector(
        '.v33-history-page'
      );

    if (!page) {
      return '';
    }

    const children =
      Array.from(
        page.children
      );

    const income =
      children.find(
        child =>
          child.querySelector?.(
            '.v33-history-input'
          ) ||
          child.querySelector?.(
            '.v33-history-notes'
          )
      );

    return (
      income?.outerHTML ||
      ''
    );
  }


  function snapshotHistoryViewV34() {
    const selected =
      selectedHistoryYearV34();

    if (
      selected <= 2025
    ) {
      const legacyHtml =
        typeof legacyHistoryView ===
          'function'
          ? legacyHistoryView()
          : '';

      const wrapper =
        document.createElement(
          'div'
        );

      wrapper.innerHTML =
        legacyHtml;

      //
      // 기존 2025 History의 year selector만 제거하고,
      // 실제 legacy snapshot 내용은 그대로 보존한다.
      //
      const legacyToolbar =
        wrapper.querySelector(
          '.v33-history-toolbar'
        );

      if (legacyToolbar) {
        legacyToolbar.remove();
      }

      const legacyPage =
        wrapper.querySelector(
          '.v33-history-page'
        );

      const content =
        legacyPage
          ? legacyPage.innerHTML
          : legacyHtml;

      return `
        <div
          class="v33-history-page
                 v34-history-page"
        >
          ${historySelectorV34(
            selected
          )}

          ${content}
        </div>
      `;
    }

    return `
      <div
        class="v33-history-page
               v34-history-page"
      >
        ${historySelectorV34(
          selected
        )}

        <section
          class="v33-history-year"
        >
          <div
            class="v33-section-heading"
          >
            <div>
              <h2>
                ${selected} Snapshot
              </h2>

              <p>
                각 탭에서 사용자가 직접 저장한
                테이블 기록입니다.
                현재 값으로 재계산하지 않습니다.
              </p>
            </div>
          </div>

          ${snapshotSectionV34(
            selected,
            'performance'
          )}

          ${snapshotSectionV34(
            selected,
            'growth_dividend'
          )}

          ${snapshotSectionV34(
            selected,
            'cash_like'
          )}
        </section>

        ${incomeTaxOnlyHtmlV34()}
      </div>
    `;
  }


  window.historySelectYearV34 =
    function (
      value
    ) {
      const year =
        Number(value);

      if (
        !Number.isInteger(
          year
        )
      ) {
        return;
      }

      if (
        data?.history
      ) {
        data.history
          .selectedYear =
          year;

        try {
          localStorage.setItem(
            KEY,
            JSON.stringify(
              data
            )
          );
        } catch (e) {}
      }

      if (
        typeof render ===
          'function'
      ) {
        render();
      }
    };


  // ============================================================
  // Install / re-install History wrapper
  // ============================================================

  function installHistoryOverrideV34() {
    if (
      !legacyHistoryView &&
      typeof window
        .historyViewV33 ===
        'function' &&
      window
        .historyViewV33 !==
        snapshotHistoryViewV34
    ) {
      legacyHistoryView =
        window.historyViewV33;
    }

    if (!legacyHistoryView) {
      return;
    }

    //
    // History의 public renderer와
    // 실제 tab dispatch 양쪽을
    // 동일한 v34 renderer로 맞춘다.
    //
    window.historyViewV33 =
      snapshotHistoryViewV34;

    if (
      typeof views ===
        'object' &&
      views
    ) {
      views['History'] =
        snapshotHistoryViewV34;
    }

    historyOverrideInstalled =
      true;
  }

  function wrapFinalViewsInstallerV34() {
    const current =
      window.installFinalViewsV33;

    if (
      typeof current !==
        'function'
    ) {
      console.warn(
        '[v34 snapshot] installFinalViewsV33 not found'
      );

      return false;
    }

    if (
      current
        .__v34TableSnapshotWrapped
    ) {
      return true;
    }

    const original =
      current;

    const wrapped =
      function () {
        //
        // v33-nav-fix는 History view를 얻기 전에
        // 매번 installFinalViewsV33()를 호출한다.
        //
        // 먼저 기존 8-tab registry를 정상 설치한 뒤,
        // History 하나만 다시 v34 renderer로 교체한다.
        //
        const result =
          original.apply(
            this,
            arguments
          );

        installHistoryOverrideV34();

        return result;
      };

    wrapped
      .__v34TableSnapshotWrapped =
      true;

    wrapped
      .__v34Original =
      original;

    window.installFinalViewsV33 =
      wrapped;

    return true;
  }

  // ============================================================
  // DOM observer
  // ============================================================

  function installObserverV34() {
    const content =
      document.getElementById(
        'content'
      );

    if (
      !content ||
      observer
    ) {
      return;
    }

    observer =
      new MutationObserver(
        () => {
          window
            .requestAnimationFrame(
              () => {
                installHistoryOverrideV34();
                enhanceCurrentViewV34();
              }
            );
        }
      );

    observer.observe(
      content,
      {
        childList: true,
        subtree: true
      }
    );
  }


  // ============================================================
  // Public helpers
  // ============================================================

  window.saveTableSnapshotV34 =
    saveSnapshotV34;

  window.reloadTableSnapshotsV34 =
    async function () {
      await loadSnapshotsV34(
        true
      );

      installHistoryOverrideV34();

      if (
        typeof render ===
          'function'
      ) {
        render();
      }
    };


  // ============================================================
  // Boot
  // ============================================================

    async function initialLoadSnapshotsV34() {
    const maxAttempts = 40;
    const retryDelayMs = 250;

    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt++
    ) {
      if (
        getSupabaseClientV34()
      ) {
        try {
          await loadSnapshotsV34(
            true
          );

          return;
        } catch (error) {
          console.warn(
            `[v34 snapshot] initial load attempt ${attempt} failed`,
            error
          );
        }
      }

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            retryDelayMs
          )
      );
    }

    console.warn(
      '[v34 snapshot] Supabase client was not ready; initial snapshot load skipped'
    );
  }

  function bootV34() {
    wrapFinalViewsInstallerV34();
    installHistoryOverrideV34();
    installObserverV34();

    initialLoadSnapshotsV34()
      .then(
        () => {
          installHistoryOverrideV34();

          if (
            typeof render ===
              'function'
          ) {
            render();
          }
        }
      )
      .catch(
        error =>
          console.warn(
            '[v34 snapshot] initial load failed',
            error
          )
      );

    window
      .requestAnimationFrame(
        enhanceCurrentViewV34
      );

    console.info(
      '[Portfolio Control] v3.4 table snapshot module loaded'
    );
  }


  if (
    document.readyState ===
      'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      bootV34,
      {
        once: true
      }
    );

  } else {
    bootV34();
  }

})();