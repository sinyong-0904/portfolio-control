//
// Portfolio Control v3.2.1
// 251600 allocation update
// PLUS 고배당주채권혼합60 -> 혼합50
// K-DVD:BOND 40:60 -> 50:50
//

(function () {

  function apply251600Update() {

    const m = data.market.find(
      x => x.code === '251600'
    );

    if (m) {
      m.name =
        'PLUS 고배당주채권혼합50';
    }

    if (!data.mapping) {
      data.mapping = {};
    }

    data.mapping['251600'] = {
      'K-DVD': 0.5,
      'BOND': 0.5
    };
  }


  // 현재 local data에 적용
  apply251600Update();


  // Supabase data를 불러온 뒤에도 다시 적용
  const loadCloudV32 = loadCloud;

  loadCloud = async function () {

    await loadCloudV32();

    apply251600Update();

    localStorage.setItem(
      KEY,
      JSON.stringify(data)
    );

    scheduleCloudSave();
  };

})();
