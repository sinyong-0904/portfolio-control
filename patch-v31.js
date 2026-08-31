//
// Portfolio Control v3.1 patch
//

// ---------- CHILD portfolio migration ----------
function ensureChildV31() {
  if (!data.childProfiles) {
    data.childProfiles = [
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
  }

  const child = acct('CHILD');

  if (child) {
    // 기존 수동평가액은 더 이상 사용하지 않음
    child.manualValueKRW = 0;
    child.note = '서현·서진 각각 나스닥채권50 + KRX금현물';
  }

  // 이미 migration했으면 중복 생성하지 않음
  const migrated = data.holdings.some(
    h => h.account === 'CHILD' && h.owner
  );

  if (!migrated) {
    data.holdings.push(
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
    );
  }
}

function childOwnerSummary(owner) {
  const hs = data.holdings.filter(
    h =>
      h.account === 'CHILD' &&
      h.owner === owner &&
      h.status === 'Active'
  );

  const value = sum(hs, h => holdingMetric(h).value);
  const buy = sum(hs, h => holdingMetric(h).purchase);
  const gold = sum(
    hs.filter(h => h.code === '411060'),
    h => holdingMetric(h).value
  );

  const profile =
    (data.childProfiles || []).find(x => x.owner === owner) || {};

  return {
    owner,
    hs,
    value,
    buy,
    gold,
    goldWeight: value ? gold / value : 0,
    snapshotValue: Number(profile.snapshotValueKRW) || 0,
    cumPnl: Number(profile.snapshotCumPnlKRW) || 0
  };
}

function childHoldingsView() {
  const owners = ['서현', '서진'].map(childOwnerSummary);
  const totalValue = owners.reduce((s, x) => s + x.value, 0);
  const totalPnl = owners.reduce((s, x) => s + x.cumPnl, 0);

  const summaryRows = owners.map(x => [
    `<b>${x.owner}</b>`,
    won(x.value),
    won(x.cumPnl),
    pct(x.goldWeight * 100)
  ]);

  summaryRows.push([
    '<b>합계</b>',
    `<b>${won(totalValue)}</b>`,
    `<b>${won(totalPnl)}</b>`,
    ''
  ]);

  const holdingRows = [];

  owners.forEach(x => {
    x.hs.forEach(h => {
      const hm = holdingMetric(h);

      holdingRows.push([
        x.owner,
        `${esc(hm.m.name)}<div class="small">${hm.m.code}</div>`,
        won(h.qty),
        won(h.avg),
        won(hm.m.current),
        won(hm.purchase),
        won(hm.value),
        won(hm.evalPnl),
        pct(x.value ? hm.value / x.value * 100 : 0)
      ]);
    });
  });

  return `
    <div class="grid">
      ${owners.map(x =>
        metric(
          x.owner + ' 평가액',
          won(x.value) + '원',
          '누적손익 ' + won(x.cumPnl) + '원'
        )
      ).join('')}
      ${metric(
        '자녀연금 합계',
        (totalValue / 10000).toFixed(1) + '만원',
        '누적손익 ' + (totalPnl / 10000).toFixed(1) + '만원'
      )}
      ${metric(
        '현재 금 비중',
        pct(
          totalValue
            ? owners.reduce((s, x) => s + x.gold, 0) /
              totalValue * 100
            : 0
        ),
        '현재가 기준'
      )}
    </div>

    <h2>서현 · 서진 현황</h2>
    ${simpleTable(
      ['구분', '평가액', '누적손익', '금 비중'],
      summaryRows
    )}

    <h2>보유종목</h2>
    ${simpleTable(
      [
        '구분',
        '종목',
        '보유량',
        '평단',
        '현재가',
        '매수금액',
        '평가금액',
        '평가손익',
        '비중'
      ],
      holdingRows,
      'mid'
    )}

    <div class="note">
      평가액과 금 비중은 시장가격 탭의 현재가를 사용하여 자동 계산됩니다.
      누적손익은 입력한 기준값(서현 697,624원 / 서진 692,129원)을 표시합니다.
    </div>
  `;
}


// ---------- CHILD account special view ----------
const holdingsViewV30 = holdingsView;

holdingsView = function () {
  if (selectedAccount === 'CHILD') {
    const accountButtons = data.accounts
      .map(
        a =>
          `<button class="accountTab ${
            selectedAccount === a.id ? 'on' : ''
          }" onclick="selectedAccount='${a.id}';render()">${a.name}</button>`
      )
      .join('');

    return `
      <div class="accountTabs">${accountButtons}</div>
      ${childHoldingsView()}
    `;
  }

  return holdingsViewV30();
};


// ---------- Mobile table modal ----------
function verticalTableHTML(table) {
  const headers = [...table.querySelectorAll('thead th')]
    .map(th => th.innerHTML);

  const firstRow = [...table.querySelectorAll('tbody tr')][0];

  if (!firstRow) return table.outerHTML;

  const cells = [...firstRow.children];

  return `
    <table class="verticalSummary">
      <tbody>
        ${headers.map((h, i) => `
          <tr>
            <th>${h}</th>
            <td>${cells[i] ? cells[i].innerHTML : ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

setupMobileTablePopups = function () {
  document
    .querySelectorAll('#content .mobileTableLauncher')
    .forEach(x => x.remove());

  [...document.querySelectorAll('#content .tableWrap')].forEach((w, i) => {
    w.classList.add('mobile-collapsed');

    const table = w.querySelector('table');
    const bodyRows = table
      ? table.querySelectorAll('tbody tr').length
      : 0;

    const b = document.createElement('button');
    b.className = 'mobileTableLauncher';

    const title = tableSectionTitle(w, i);

    b.innerHTML = `
      ${title}
      <span class="small">
        ${bodyRows ? bodyRows + '행 · ' : ''}눌러서 전체화면으로 보기
      </span>
    `;

    b.onclick = () => {
      let html = w.innerHTML;

      // 정확히 1행인 표는 모바일에서 세로형으로 변환
      if (table && bodyRows === 1) {
        html = verticalTableHTML(table);
      }

      openTableModal(title, html);
    };

    w.parentNode.insertBefore(b, w);
  });
};


// ---------- run migration ----------
ensureChildV31();

// cloud에서 불러온 데이터에도 migration 적용
const loadCloudV30 = loadCloud;

loadCloud = async function () {
  await loadCloudV30();
  ensureChildV31();
  localStorage.setItem(KEY, JSON.stringify(data));
  scheduleCloudSave();
};