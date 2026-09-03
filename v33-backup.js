// Portfolio Control v3.3
// Safe backup / restore layer

(function () {
  'use strict';


  function clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }


  function stamp() {
    const d = new Date();

    const pad =
      n =>
        String(n)
          .padStart(2, '0');

    return (
      d.getFullYear() +
      pad(d.getMonth() + 1) +
      pad(d.getDate()) +
      '-' +
      pad(d.getHours()) +
      pad(d.getMinutes()) +
      pad(d.getSeconds())
    );
  }


  function localDate() {
    const d = new Date();

    return [
      d.getFullYear(),
      String(
        d.getMonth() + 1
      ).padStart(2, '0'),
      String(
        d.getDate()
      ).padStart(2, '0')
    ].join('-');
  }


  function downloadJson(
    payload,
    filename
  ) {
    const blob =
      new Blob(
        [
          JSON.stringify(
            payload,
            null,
            2
          )
        ],
        {
          type:
            'application/json'
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        'a'
      );

    a.href = url;
    a.download = filename;

    document.body
      .appendChild(a);

    a.click();
    a.remove();

    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      0
    );
  }


  function snapshot() {
    const out =
      clone(data);

    if (
      !out.meta ||
      typeof out.meta !==
        'object'
    ) {
      out.meta = {};
    }


    //
    // Backup metadata belongs
    // to the exported snapshot only.
    //
    out.meta.backupCreatedAt =
      new Date()
        .toISOString();


    //
    // Extra compatibility guard:
    // include old manual-market
    // localStorage if it has not yet
    // migrated into data.
    //
    if (!out.manualMarket) {
      try {
        const raw =
          localStorage.getItem(
            'v33ManualMarket'
          );

        if (raw) {
          const legacy =
            JSON.parse(raw);

          if (
            legacy &&
            typeof legacy ===
              'object'
          ) {
            out.manualMarket =
              legacy;
          }
        }
      } catch (e) {}
    }


    return out;
  }


  function validateBackup(
    incoming
  ) {
    if (
      !incoming ||
      typeof incoming !==
        'object' ||
      Array.isArray(incoming)
    ) {
      throw new Error(
        '백업 데이터 형식이 아닙니다.'
      );
    }

    if (
      incoming.version == null
    ) {
      throw new Error(
        '버전 정보가 없습니다.'
      );
    }

    if (
      !incoming.meta ||
      typeof incoming.meta !==
        'object'
    ) {
      throw new Error(
        'meta 정보가 없습니다.'
      );
    }

    if (
      !Array.isArray(
        incoming.accounts
      )
    ) {
      throw new Error(
        'accounts 정보가 없습니다.'
      );
    }

    if (
      !Array.isArray(
        incoming.holdings
      )
    ) {
      throw new Error(
        'holdings 정보가 없습니다.'
      );
    }

    return true;
  }


  window.exportData =
    function () {
      const out =
        snapshot();

      const date =
        out.meta
          .valuationDate ||
        localDate();

      downloadJson(
        out,
        (
          'portfolio-v3-' +
          date +
          '-' +
          stamp() +
          '.json'
        )
      );
    };


  window.importData =
    function (file) {
      if (!file) {
        return;
      }

      const reader =
        new FileReader();


      reader.onload =
        async function () {

          try {
            const incoming =
              JSON.parse(
                reader.result
              );

            validateBackup(
              incoming
            );


            const activeCount =
              incoming.holdings
                .filter(
                  h =>
                    !h.status ||
                    h.status ===
                      'Active'
                )
                .length;


            const ok =
              confirm(
                '백업을 복원합니다.\n\n' +
                'Version: ' +
                incoming.version +
                '\n' +
                '기준일: ' +
                (
                  incoming.meta
                    .valuationDate ||
                  '-'
                ) +
                '\n' +
                '계좌: ' +
                incoming.accounts
                  .length +
                '개\n' +
                'Active 보유: ' +
                activeCount +
                '개\n\n' +
                '현재 상태는 복원 직전에 ' +
                '자동 안전백업됩니다.\n\n' +
                '계속할까요?'
              );


            if (!ok) {
              return;
            }


            //
            // Safety backup BEFORE
            // destructive restore.
            //
            const safety =
              snapshot();

            downloadJson(
              safety,
              (
                'portfolio-v3-' +
                'pre-restore-' +
                stamp() +
                '.json'
              )
            );


            //
            // Replace current state.
            //
            data =
              clone(incoming);


            //
            // Bring older backups up
            // to current v3.3 schema.
            //
            if (
              typeof window
                .migrateV33 ===
              'function'
            ) {
              window
                .migrateV33();
            }


            if (
              typeof ensureSnapshots ===
              'function'
            ) {
              ensureSnapshots();
            }


            if (
              typeof dailyRollover ===
              'function'
            ) {
              dailyRollover();
            }


            //
            // Local + cloud save.
            //
            if (
              typeof save ===
              'function'
            ) {
              save(false);
            }


            //
            // Ensure cloud persistence
            // before reporting success.
            //
            if (
              typeof flushCloud ===
              'function'
            ) {
              try {
                await flushCloud();
              } catch (e) {
                console.error(
                  '[v33 backup] ' +
                  'cloud save failed',
                  e
                );
              }
            }


            if (
              typeof render ===
              'function'
            ) {
              render();
            }


            //
            // Allows selecting the
            // same backup file again.
            //
            const input =
              document.querySelector(
                'input[type="file"]' +
                '[accept="application/json"]'
              );

            if (input) {
              input.value = '';
            }


            alert(
              '복원 완료\n\n' +
              '복원 직전 상태의 ' +
              '안전백업 파일도 ' +
              '다운로드했습니다.'
            );


          } catch (e) {
            alert(
              'JSON 복원 오류: ' +
              (
                e.message ||
                e
              )
            );
          }
        };


      reader.readAsText(
        file
      );
    };


  console.info(
    '[Portfolio Control] ' +
    'v3.3 Safe Backup loaded'
  );

})();
