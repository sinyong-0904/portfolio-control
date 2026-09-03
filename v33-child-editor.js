// Portfolio Control v3.3
// CHILD pension general-style holdings UI

(function () {

  const OWNERS = ['서현', '서진'];


  function profile(owner) {
    if (!Array.isArray(data.childProfiles)) {
      data.childProfiles = [];
    }

    let p =
      data.childProfiles.find(
        x => x.owner === owner
      );

    if (!p) {
      p = {
        owner,
        snapshotValueKRW: 0,
        snapshotCumPnlKRW: 0
      };

      data.childProfiles.push(p);
    }

    return p;
  }


  function ownerHoldings(owner) {
    return data.holdings.filter(
      h =>
        h.account === 'CHILD' &&
        h.owner === owner &&
        h.status === 'Active'
    );
  }


  function ownerSummaryV33(owner) {
    const hs =
      ownerHoldings(owner);

    const p =
      profile(owner);

    const cash =
      Number(p.cashKRW) || 0;

    const invested =
      sum(
        hs,
        h => holdingMetric(h).value
      );

    const gold =
      sum(
        hs.filter(
          h => h.code === '411060'
        ),
        h => holdingMetric(h).value
      );

    return {
      owner,
      hs,
      cash,
      value: invested + cash,
      gold,
      cumPnl:
        Number(
          p.snapshotCumPnlKRW
        ) || 0
    };
  }


  function holdingRow(h, ownerSummary) {
    const x =
      holdingMetric(h);

    const m = x.m;

    const weight =
      ownerSummary.value
        ? x.value /
          ownerSummary.value
        : 0;

    return `
      <tr>
        <td>${esc(h.owner)}</td>

        <td class="sticky1">
          ${esc(m.name)}
          <div class="small">
            ${esc(m.code)}
          </div>
        </td>

        <td>
          <input
            class="numInput"
            type="number"
            min="0"
            value="${Number(h.qty) || 0}"
            onchange="
              window.childSetHoldingV33(
                '${esc(h.id)}',
                'qty',
                this.value
              )
            "
          >
        </td>

        <td>
          ${pct(Number(h.target) || 0)}
        </td>

        <td>
          ${pct(weight * 100)}
        </td>

        <td>
          <input
            class="numInput"
            type="number"
            min="0"
            value="${Number(h.avg) || 0}"
            onchange="
              window.childSetHoldingV33(
                '${esc(h.id)}',
                'avg',
                this.value
              )
            "
          >
        </td>

        <td>${won(m.current)}</td>
        <td>${won(x.purchase)}</td>
        <td>${won(x.value)}</td>
        <td>${won(x.evalPnl)}</td>
        <td>${won(h.realized || 0)}</td>
        <td>${won(h.cumDividend || 0)}</td>
        <td>${won(x.totalPnl)}</td>

        <td>
          ${
            h.code === '469830'
              ? 'n/a'
              : pct(x.tr * 100)
          }
        </td>

        <td>${pct(x.cpBa * 100)}</td>

        <td>
          ${
            h.code === '469830'
              ? 'n/a'
              : pct(x.cpHp * 100)
          }
        </td>

        <td>
          ${
            h.code === '469830'
              ? 'n/a'
              : pct(x.lpHp * 100)
          }
        </td>

        <td>
          ${
            h.code === '469830'
              ? 'n/a'
              : pct(x.yoy * 100)
          }
        </td>

        <td>${pct(x.ytd * 100)}</td>
        <td>${pct(m.dividendYield)}</td>

        <td>
          ${
            m.fee == null
              ? 'n/a'
              : pct(m.fee)
          }
        </td>

        <td>${esc(m.netAssets || '')}</td>

        <td>
          <button
            class="
              btn
              smallbtn
              danger
              v33-life-v2-close
            "
            type="button"
            data-v33-holding-id="${esc(h.id)}"
          >
            보유 종료
          </button>
        </td>
      </tr>
    `;
  }


  function childHoldingsViewV33() {
    const owners =
      OWNERS.map(
        ownerSummaryV33
      );

    const totalValue =
      sum(
        owners,
        x => x.value
      );

    const totalPnl =
      sum(
        owners,
        x => x.cumPnl
      );

    const totalGold =
      sum(
        owners,
        x => x.gold
      );

    const rows =
      owners
        .flatMap(
          owner =>
            owner.hs.map(
              h =>
                holdingRow(
                  h,
                  owner
                )
            )
        )
        .join('');


    return `

      <div class="grid">

        ${owners.map(
          x =>
            metric(
              x.owner + ' 평가액',
              won(x.value) + '원',
              '누적손익 ' +
                won(x.cumPnl) +
                '원'
            )
        ).join('')}

        ${metric(
          '자녀연금 합계',
          (totalValue / 10000)
            .toFixed(1) +
            '만원',
          '누적손익 ' +
            (totalPnl / 10000)
              .toFixed(1) +
            '만원'
        )}

        ${metric(
          '현재 금 비중',
          pct(
            totalValue
              ? totalGold /
                totalValue *
                100
              : 0
          ),
          '현재가 기준'
        )}

      </div>


      <h2>보유종목</h2>


      <div
        class="actions"
        style="
          margin-top:10px;
          flex-wrap:wrap;
        "
      >

        <button
          class="btn primary"
          type="button"
          onclick="
            window.saveChildHoldingsV33()
          "
        >
          보유정보 저장·재계산
        </button>


        <button
          class="btn"
          type="button"
          onclick="
            window.addChildHoldingV33()
          "
        >
          + 종목
        </button>


        ${OWNERS.map(owner => {

          const p =
            profile(owner);

          return `
            <label class="btn">
              ${owner} 계좌 현금(원)

              <input
                class="numInput"
                type="number"
                min="0"
                value="${
                  p.cashKRW == null
                    ? ''
                    : Number(
                        p.cashKRW
                      )
                }"
                onchange="
                  window.childSetCashV33(
                    '${owner}',
                    this.value
                  )
                "
              >
            </label>
          `;

        }).join('')}

      </div>


      <div
        class="tableWrap"
        style="margin-top:10px"
      >

        <table
          class="wide editTable"
        >

          <thead>
            <tr class="thead">
              <th>구분</th>
              <th class="sticky1">종목</th>
              <th>보유량</th>
              <th>목표%</th>
              <th>비중</th>
              <th>평단</th>
              <th>현재가</th>
              <th>매수금액</th>
              <th>평가금액</th>
              <th>평가손익</th>
              <th>실현손익</th>
              <th>누적배당</th>
              <th>총손익</th>
              <th>TR%</th>
              <th>CP/BA</th>
              <th>CP/HP</th>
              <th>LP/HP</th>
              <th>YoY+배당</th>
              <th>YTD</th>
              <th>배당률</th>
              <th>총보수</th>
              <th>순자산</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            ${
              rows ||
              `
                <tr>
                  <td colspan="23">
                    상세 보유종목 미입력
                  </td>
                </tr>
              `
            }
          </tbody>

        </table>

      </div>


      <div class="note">
        보유량·평단과 서현/서진 현금을
        수정한 뒤 저장·재계산하세요.
        현재가는 시장가격 탭의
        종목코드와 자동 연결됩니다.
      </div>
    `;
  }


  window.childSetHoldingV33 =
    function (
      id,
      field,
      value
    ) {

      if (
        !['qty', 'avg']
          .includes(field)
      ) {
        return;
      }

      const n =
        Number(value);

      if (
        !Number.isFinite(n) ||
        n < 0
      ) {
        return;
      }

      const h =
        data.holdings.find(
          x => x.id === id
        );

      if (h) {
        h[field] = n;
      }
    };


  window.childSetCashV33 =
    function (
      owner,
      value
    ) {

      const p =
        profile(owner);

      const text =
        String(
          value ?? ''
        ).trim();

      if (!text) {
        p.cashKRW = null;
        return;
      }

      const n =
        Number(text);

      if (
        Number.isFinite(n) &&
        n >= 0
      ) {
        p.cashKRW = n;
      }
    };


  window.saveChildHoldingsV33 =
    function () {

      const cashRows =
        OWNERS.map(
          owner =>
            profile(owner)
        );

      if (
        cashRows.some(
          p =>
            p.cashKRW == null ||
            !Number.isFinite(
              Number(p.cashKRW)
            )
        )
      ) {
        alert(
          '서현·서진 계좌 현금을 ' +
          '모두 입력해주세요.'
        );

        return;
      }

      const child =
        acct('CHILD');

      if (child) {
        child.cashKRW =
          cashRows.reduce(
            (
              total,
              p
            ) =>
              total +
              Number(
                p.cashKRW
              ),
            0
          );
      }

      if (
        typeof save === 'function'
      ) {
        save();
      }

      if (
        typeof render ===
          'function'
      ) {
        setTimeout(
          render,
          0
        );
      }
    };


  window.addChildHoldingV33 =
    function () {

      const owner =
        String(
          prompt(
            'Owner 입력: 서현 또는 서진',
            '서현'
          ) || ''
        ).trim();

      if (
        !OWNERS.includes(owner)
      ) {
        if (owner) {
          alert(
            '서현 또는 서진을 입력해주세요.'
          );
        }

        return;
      }

      const code =
        String(
          prompt(
            '종목코드 입력'
          ) || ''
        )
          .trim()
          .toUpperCase();

      if (!code) {
        return;
      }

      if (
        !data.market.some(
          m => m.code === code
        )
      ) {
        alert(
          '시장가격 기준정보에 없는 코드입니다.'
        );

        return;
      }

      const duplicate =
        data.holdings.some(
          h =>
            h.account ===
              'CHILD' &&
            h.owner === owner &&
            h.code === code &&
            h.status ===
              'Active'
        );

      if (duplicate) {
        alert(
          '이미 보유 중인 종목입니다.'
        );

        return;
      }

      data.holdings.push({
        id:
          'child-' +
          Date.now(),

        account: 'CHILD',
        owner,
        code,
        qty: 0,
        target: 0,
        avg: 0,
        realized: 0,
        cumDividend: 0,
        status: 'Active'
      });

      if (
        typeof save === 'function'
      ) {
        save();
      }

      if (
        typeof render ===
          'function'
      ) {
        setTimeout(
          render,
          0
        );
      }
    };


  //
  // patch-v31 CHILD special view를
  // 일반계좌 스타일 v3.3 view로 교체.
  //
  window.childOwnerSummary =
    ownerSummaryV33;

  window.childHoldingsView =
    childHoldingsViewV33;

})();
