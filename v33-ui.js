// Portfolio Control v3.3 UI system
// Visual hierarchy + mobile navigation + inline collapsible tables
// Load LAST, after all v33 view/dashboard/fix scripts.

(function () {
  const MOBILE_QUERY = '(max-width: 760px)';

  const MONTH_LABELS = new Set([
    'JAN','FEB','MAR','APR','MAY','JUN',
    'JUL','AUG','SEP','OCT','NOV','DEC',
    'YTD','TR','IV'
  ]);

  let applyQueued = false;

  const expandedTablesV33 = Object.create(null);

  function isMobileV33() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function numberFromTextV33(text) {
    if (text == null) return null;

    const raw = String(text)
      .replace(/,/g, '')
      .replace(/₩/g, '')
      .trim();

    if (
      !raw ||
      /^(n\/a|na|-|—)$/i.test(raw)
    ) {
      return null;
    }

    const match = raw.match(/[+-]?\d+(?:\.\d+)?/);
    if (!match) return null;

    const value = Number(match[0]);
    return Number.isFinite(value) ? value : null;
  }

  function numberFromCellV33(cell) {
    if (!cell) return null;

    const input = cell.querySelector('input, select');
    if (input && 'value' in input) {
      const value = numberFromTextV33(input.value);
      if (value != null) return value;
    }

    return numberFromTextV33(cell.textContent);
  }

  function clearToneV33(el) {
    if (!el) return;
    el.classList.remove(
      'v33-positive',
      'v33-negative',
      'v33-important',
      'v33-warning'
    );
  }

  function toneBySignV33(el, value, options = {}) {
    if (!el || value == null) return;

    const {
      positive = false,
      negative = true
    } = options;

    clearToneV33(el);

    if (value < 0 && negative) {
      el.classList.add('v33-negative');
    } else if (value > 0 && positive) {
      el.classList.add('v33-positive');
    }
  }

  function applyOverviewToneV33(root) {
    const performanceKpis = root.querySelectorAll(
      '.v33-performance-kpi'
    );

    performanceKpis.forEach((card, index) => {
      const strong = card.querySelector('strong');
      if (!strong) return;

      const value = numberFromTextV33(strong.textContent);

      // 연금합산 CAGR / Total CAGR
      if (index === 1 || index === 3) {
        strong.classList.add('v33-important');
      } else if (value != null && value < 0) {
        strong.classList.add('v33-negative');
      }
    });

    root.querySelectorAll(
      '.v33-performance-table tbody tr'
    ).forEach(row => {
      if (row.classList.contains('v33-performance-group')) return;

      const cells = row.querySelectorAll('td');
      if (!cells.length) return;

      cells.forEach((cell, index) => {
        if (index === 0) return;

        const value = numberFromCellV33(cell);

        if (value != null && value < 0) {
          cell.classList.add('v33-negative');
        }
      });

      const scope =
        (cells[0]?.textContent || '').trim();

      if (
        scope === '연금합산' ||
        scope === 'Total'
      ) {
        cells[0]?.classList.add(
          'v33-important-label'
        );

        cells[5]?.classList.add(
          'v33-important'
        );
      }
    });

    root.querySelectorAll(
      '.v33-market-card-change'
    ).forEach(el => {
      if (el.classList.contains('down')) {
        el.classList.add('v33-negative');
      } else if (el.classList.contains('up')) {
        el.classList.add('v33-positive');
      }
    });
  }

  function applyMarketToneV33(root) {
    root.querySelectorAll(
      '.v33-market-table tbody tr'
    ).forEach(row => {
      const cells = row.querySelectorAll('td');

      if (cells.length < 9) return;

      // 종목 | 전일대비 | 전일 | 현재 |
      // CP/HP | CP/LP | YTD | YoY | LP/HP ...
      const daily =
        numberFromCellV33(cells[1]);

      const ytd =
        numberFromCellV33(cells[6]);

      const yoy =
        numberFromCellV33(cells[7]);

      // 전일대비: + 파랑 / - 빨강
      toneBySignV33(
        cells[1],
        daily,
        {
          positive: true,
          negative: true
        }
      );

      // YTD / YoY: 마이너스만 빨강
      toneBySignV33(
        cells[6],
        ytd,
        {
          positive: false,
          negative: true
        }
      );

      toneBySignV33(
        cells[7],
        yoy,
        {
          positive: false,
          negative: true
        }
      );
    });
  }

  function headerIndexesV33(table) {
    return Array.from(
      table.querySelectorAll('thead th')
    ).map(
      th => th.textContent.trim()
    );
  }

  function applyAccountToneV33(root) {
    root.querySelectorAll('table')
      .forEach(table => {
        if (
          table.classList.contains(
            'v33-market-table'
          )
        ) {
          return;
        }

        const headers =
          headerIndexesV33(table);

        if (!headers.length) return;

        const targetIndexes = [];

        headers.forEach(
          (header, index) => {
            const normalized =
              header
                .replace(/\s+/g, '')
                .toUpperCase();

            if (
              normalized.includes('TR') ||
              normalized.includes('총손익') ||
              normalized.includes('누적손익')
            ) {
              targetIndexes.push(index);
            }
          }
        );

        if (!targetIndexes.length) return;

        table
          .querySelectorAll('tbody tr')
          .forEach(row => {
            const cells =
              row.querySelectorAll('td');

            targetIndexes.forEach(
              index => {
                const cell = cells[index];

                if (!cell) return;

                const value =
                  numberFromCellV33(cell);

                if (
                  value != null &&
                  value < 0
                ) {
                  cell.classList.add(
                    'v33-negative'
                  );
                }
              }
            );
          });
      });
  }

  function isGrowthTableV33(table) {
    const headers =
      headerIndexesV33(table)
        .join(' ')
        .replace(/\s+/g, ' ');

    return (
      headers.includes('투자수익') &&
      headers.includes('총증감') &&
      headers.includes('Growth')
    );
  }

  function applyGrowthToneV33(root) {
    root.querySelectorAll('table')
      .forEach(table => {
        if (!isGrowthTableV33(table)) {
          return;
        }

        table.classList.add(
          'v33-growth-table'
        );

        table
          .querySelectorAll('tbody tr')
          .forEach(row => {
            const cells =
              row.querySelectorAll('td');

            if (!cells.length) return;

            const first =
              (
                cells[0].textContent ||
                ''
              )
                .replace(/LIVE/g, '')
                .trim()
                .toUpperCase();

            if (
              !MONTH_LABELS.has(first) &&
              !/^20\d{2}$/.test(first)
            ) {
              return;
            }

            cells.forEach(
              (cell, index) => {
                if (index === 0) return;

                const value =
                  numberFromCellV33(cell);

                if (
                  value != null &&
                  value < 0
                ) {
                  cell.classList.add(
                    'v33-negative'
                  );
                }
              }
            );
          });
      });
  }

  function applyAllocationToneV33(root) {
    root
      .querySelectorAll(
        '.v33-band-pill'
      )
      .forEach(pill => {
        const row =
          pill.closest('tr');

        if (!row) return;

        row.classList.remove(
          'v33-allocation-under-row',
          'v33-allocation-over-row'
        );

        if (
          pill.classList.contains(
            'under'
          )
        ) {
          row.classList.add(
            'v33-allocation-under-row'
          );

        } else if (
          pill.classList.contains(
            'over'
          )
        ) {
          row.classList.add(
            'v33-allocation-over-row'
          );
        }
      });
  }

  function currentTabLabelV33() {
    const candidates =
      document.querySelectorAll(
        '.active, [aria-selected="true"]'
      );

    for (const el of candidates) {
      const text =
        (el.textContent || '').trim();

      if (
        /Overview|Allocation|시장가격|계좌|Growth|배당|예금|자금|History|Strategy/i
          .test(text)
      ) {
        return text.replace(
          /\s+/g,
          ' '
        );
      }
    }

    return 'tab';
  }

  function findTabBarV33() {
    const selectors = [
      '#tabs',
      '.tabs',
      '.tabbar',
      '.tabBar',
      '.nav-tabs',
      'nav'
    ];

    const candidates = [];

    selectors.forEach(selector => {
      document
        .querySelectorAll(selector)
        .forEach(el => {
          if (
            !candidates.includes(el)
          ) {
            candidates.push(el);
          }
        });
    });

    let best = null;
    let bestCount = 0;

    candidates.forEach(el => {
      const buttons =
        Array.from(
          el.querySelectorAll(
            'button, a'
          )
        ).filter(node => {
          const text =
            (
              node.textContent ||
              ''
            ).trim();

          return (
            /Overview|Allocation|시장가격|계좌|Growth|배당|예금|자금|History|Memo|Strategy/i
              .test(text)
          );
        });

      if (
        buttons.length >
        bestCount
      ) {
        best = el;
        bestCount = buttons.length;
      }
    });

    return bestCount >= 5
      ? best
      : null;
  }

  function enhanceTabGridV33() {
    const bar =
      findTabBarV33();

    if (!bar) return;

    bar.classList.add(
      'v33-tab-grid'
    );

    Array.from(bar.children)
      .forEach(child => {
        const text =
          (
            child.textContent ||
            ''
          ).trim();

        if (
          /Overview|Allocation|시장가격|계좌|Growth|배당|예금|자금|History|Memo|Strategy/i
            .test(text)
        ) {
          child.classList.add(
            'v33-tab-grid-item'
          );
        }
      });
  }

  function legacyFullscreenTriggersV33() {
    return Array.from(
      document.querySelectorAll(
        'button, a, [role="button"], [onclick]'
      )
    ).filter(el => {
      const text =
        (el.textContent || '')
          .trim();

      return (
        text ===
          '눌러서 전체화면으로 보기' ||
        text.includes(
          '눌러서 전체화면으로 보기'
        )
      );
    });
  }

  function suppressLegacyModalWhenSafeV33() {
    legacyFullscreenTriggersV33()
      .forEach(trigger => {
        const region =
          trigger.closest(
            'section, .card, .panel, .box, .content, main, #content, #app'
          );

        // 새 inline table이 실제 존재하는 경우에만
        // 기존 modal trigger를 숨긴다.
        if (
          region &&
          region.querySelector(
            '.v33-inline-table-shell'
          )
        ) {
          trigger.classList.add(
            'v33-legacy-table-trigger-hidden'
          );
        }
      });
  }

  function tableKeyV33(
    wrap,
    index
  ) {
    const tab =
      currentTabLabelV33();

    const table =
      wrap.querySelector('table');

    const firstHeader =
      table
        ?.querySelector('thead th')
        ?.textContent
        ?.trim() ||
      'table';

    return (
      `${tab}::${index}::${firstHeader}`
    );
  }

  function tableShouldCollapseV33(
    wrap
  ) {
    const table =
      wrap.querySelector('table');

    if (!table) return false;

    const rows =
      table.querySelectorAll(
        'tbody tr'
      );

    // 1행 summary 표는 기존 세로형 유지
    if (rows.length <= 1) {
      return false;
    }

    // modal 안에 있는 table은 제외
    if (
      wrap.closest(
        '[role="dialog"], .modal, .mobileModal, .tableModal'
      )
    ) {
      return false;
    }

    return true;
  }

  function setTableExpandedV33(
    shell,
    expanded,
    persist = true
  ) {
    shell.classList.toggle(
      'is-expanded',
      expanded
    );

    shell.classList.toggle(
      'is-collapsed',
      !expanded
    );

    const button =
      shell.querySelector(
        '.v33-table-toggle'
      );

    if (button) {
      button.setAttribute(
        'aria-expanded',
        expanded
          ? 'true'
          : 'false'
      );

      button.innerHTML =
        expanded

          ? '<span>접기</span><b aria-hidden="true">▲</b>'

          : '<span>펼치기</span><b aria-hidden="true">▼</b>';
    }

    if (persist) {
      const key =
        shell.dataset.tableKey;

      if (key) {
        expandedTablesV33[key] =
          !!expanded;
      }
    }
  }

  function enhanceMobileTablesV33() {
    document.body.classList.toggle(
      'v33-mobile-ui',
      isMobileV33()
    );

    if (!isMobileV33()) return;

    const wraps =
      Array.from(
        document.querySelectorAll(
          '.tableWrap'
        )
      ).filter(
        tableShouldCollapseV33
      );

    wraps.forEach(
      (wrap, index) => {
        if (
          wrap.closest(
            '.v33-inline-table-shell'
          )
        ) {
          return;
        }

        const key =
          tableKeyV33(
            wrap,
            index
          );

        const shell =
          document.createElement(
            'div'
          );

        shell.className =
          'v33-inline-table-shell';

        shell.dataset.tableKey =
          key;

        const toggle =
          document.createElement(
            'button'
          );

        toggle.type =
          'button';

        toggle.className =
          'v33-table-toggle';

        wrap.parentNode
          .insertBefore(
            shell,
            wrap
          );

        shell.appendChild(
          toggle
        );

        shell.appendChild(
          wrap
        );

        wrap.classList.add(
          'v33-inline-table-wrap'
        );

        wrap.style.removeProperty(
          'display'
        );

        wrap.style.removeProperty(
          'visibility'
        );

        const expanded =
          expandedTablesV33[
            key
          ] === true;

        setTableExpandedV33(
          shell,
          expanded,
          false
        );

        toggle.addEventListener(
          'click',
          () => {
            setTableExpandedV33(
              shell,
              !shell.classList
                .contains(
                  'is-expanded'
                ),
              true
            );
          }
        );
      });

    suppressLegacyModalWhenSafeV33();
  }

  function markStickyFirstColumnsV33(
    root
  ) {
    root.querySelectorAll(
      '.v33-market-table, ' +
      '.v33-performance-table, ' +
      '.v33-core-table, ' +
      '.v33-exposure-table, ' +
      '.v33-exposure-detail-table, ' +
      '.v33-growth-table'
    ).forEach(table => {
      table.classList.add(
        'v33-sticky-first-col'
      );
    });

    // 기타 표도 첫 헤더명으로 자동판별
    root
      .querySelectorAll('table')
      .forEach(table => {
        const firstHeader =
          table.querySelector(
            'thead th'
          );

        if (!firstHeader) return;

        const label =
          (
            firstHeader.textContent ||
            ''
          ).trim();

        if (
          /종목|월|항목|구분|자산|계좌/
            .test(label)
        ) {
          table.classList.add(
            'v33-sticky-first-col'
          );
        }
      });
  }

  function applyUiV33() {
    const root = document;

    enhanceTabGridV33();
    applyOverviewToneV33(root);
    applyMarketToneV33(root);
    applyAccountToneV33(root);
    applyGrowthToneV33(root);
    applyAllocationToneV33(root);
    markStickyFirstColumnsV33(root);
    enhanceMobileTablesV33();
  }

  function queueApplyUiV33() {
    if (applyQueued) return;

    applyQueued = true;

    requestAnimationFrame(
      () => {
        applyQueued = false;
        applyUiV33();
      }
    );
  }

  window.applyUiV33 =
    applyUiV33;

  if (
    typeof render ===
    'function'
  ) {
    const renderBeforeUiV33 =
      render;

    render =
      function () {
        const result =
          renderBeforeUiV33
            .apply(
              this,
              arguments
            );

        queueApplyUiV33();

        return result;
      };
  }

  window.addEventListener(
    'load',
    queueApplyUiV33
  );

  window.addEventListener(
    'resize',
    queueApplyUiV33
  );

  window.addEventListener(
    'portfolio:market-loaded',
    queueApplyUiV33
  );

  window.addEventListener(
    'portfolio:market-refreshed',
    queueApplyUiV33
  );

  window.addEventListener(
    'portfolio:saved',
    queueApplyUiV33
  );

  const observer =
    new MutationObserver(
      () => {
        queueApplyUiV33();
      }
    );

  window.addEventListener(
    'load',
    () => {
      const target =
        document.getElementById(
          'content'
        ) ||
        document.getElementById(
          'app'
        ) ||
        document.body;

      observer.observe(
        target,
        {
          childList: true,
          subtree: true
        }
      );
    }
  );

  console.info(
    '[Portfolio Control] v3.3 UI system loaded'
  );

})();
