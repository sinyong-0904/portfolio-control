// Portfolio Control v3.3 - final 8-tab navigation fix
// Load LAST after v33-tabs-app.js.

(function () {

  const FINAL_TABS = [
    'Overview',
    'Allocation',
    '시장가격',
    '계좌·보유',
    'Growth & 배당',
    '자금관리',
    'History',
    'Strategy'
  ];


  const STORAGE_KEY =
    'portfolio_v33_final_tab';


  let activeTabV33 =
    localStorage.getItem(
      STORAGE_KEY
    ) || 'Overview';


  let finalRendering =
    false;



  function installViews() {

    try {

      if (
        typeof installFinalViewsV33 ===
        'function'
      ) {

        installFinalViewsV33();
      }

    } catch (e) {

      console.warn(
        '[v33 nav] install views failed',
        e
      );
    }
  }



  function registry() {

    try {

      if (
        typeof views !==
        'undefined'
      ) {

        return views;
      }

    } catch (e) {}


    return (
      window.views ||
      null
    );
  }



  function viewFn(name) {

    installViews();


    const v =
      registry();


    if (
      v &&
      typeof v[name] ===
        'function'
    ) {

      return v[name];
    }


    const fallback = {

      'Growth & 배당':
        window
          .growthDividendViewV33,

      '자금관리':
        window
          .cashFundingViewV33,

      'History':
        window
          .historyViewV33
    };


    return (
      typeof fallback[name] ===
        'function'

        ? fallback[name]

        : null
    );
  }



  function syncOldTab(name) {

    try {

      if (
        typeof tab !==
        'undefined'
      ) {

        tab = name;
      }

    } catch (e) {}


    try {

      if (
        typeof activeTab !==
        'undefined'
      ) {

        activeTab = name;
      }

    } catch (e) {}


    try {

      if (
        typeof currentTab !==
        'undefined'
      ) {

        currentTab = name;
      }

    } catch (e) {}
  }



  function findTabBar() {

    const candidates =
      Array.from(
        document
          .querySelectorAll(
            '#tabs,' +
            '.tabs,' +
            '.tabbar,' +
            '.tabBar,' +
            '.nav-tabs,' +
            '[role="tablist"],' +
            'nav'
          )
      );


    let best = null;

    let bestScore = -1;


    candidates.forEach(
      el => {

        const controls =
          Array.from(
            el.querySelectorAll(
              'button,' +
              'a,' +
              '[role="tab"]'
            )
          );


        if (
          controls.length < 4
        ) {

          return;
        }


        const text =
          controls
            .map(
              x =>
                x.textContent ||
                ''
            )
            .join('|');


        const hints = [
          'Overview',
          'Allocation',
          '시장가격',
          '계좌',
          'Growth',
          '배당',
          'Strategy'
        ];


        const score =
          hints.reduce(
            (
              n,
              x
            ) =>
              n +
              (
                text.includes(x)
                  ? 1
                  : 0
              ),
            0
          );


        if (
          score > bestScore
        ) {

          best = el;

          bestScore =
            score;
        }
      }
    );


    return (
      bestScore >= 2

        ? best

        : null
    );
  }



  function updateActive() {

    const bar =
      findTabBar();


    if (!bar) {
      return;
    }


    bar
      .querySelectorAll(
        '[data-v33-final-tab]'
      )
      .forEach(
        el => {

          const selected =
            el.dataset
              .v33FinalTab ===
            activeTabV33;


          el.classList.toggle(
            'active',
            selected
          );


          el.classList.toggle(
            'selected',
            selected
          );


          el.setAttribute(
            'aria-selected',
            selected
              ? 'true'
              : 'false'
          );
        }
      );
  }



  function makeButton(
    template,
    name
  ) {

    const el =
      template

        ? template
            .cloneNode(false)

        : document
            .createElement(
              'button'
            );


    el.textContent =
      name;


    el.removeAttribute(
      'onclick'
    );


    el.removeAttribute(
      'href'
    );


    el.removeAttribute(
      'id'
    );


    el.classList.remove(
      'active',
      'selected',
      'on'
    );


    el.dataset
      .v33FinalTab =
      name;


    el.setAttribute(
      'role',
      'tab'
    );


    el.setAttribute(
      'aria-selected',
      'false'
    );


    if (
      el.tagName ===
      'BUTTON'
    ) {

      el.type =
        'button';
    }


    el.addEventListener(
      'click',
      e => {

        e.preventDefault();

        selectFinalTabV33(
          name
        );
      }
    );


    return el;
  }



  function mountNav() {

    const bar =
      findTabBar();


    if (!bar) {

      return false;
    }


    const current =
      Array.from(
        bar.querySelectorAll(
          '[data-v33-final-tab]'
        )
      );


    //
    // 이미 정확한 8탭이면
    // DOM을 다시 만들지 않는다.
    //

    if (
      current.length === 8 &&
      current.every(
        (
          x,
          i
        ) =>
          x.dataset
            .v33FinalTab ===
          FINAL_TABS[i]
      )
    ) {

      bar.classList.add(
        'v33-tab-grid'
      );


      updateActive();

      return true;
    }


    const oldControls =
      Array.from(
        bar.querySelectorAll(
          'button,' +
          'a,' +
          '[role="tab"]'
        )
      );


    const template =
      oldControls[0] ||
      null;


    //
    // <li><button>...</button></li>
    // 구조라면 li까지 복제.
    //

    const wrapperTemplate =

      template &&
      template.parentElement &&
      template
        .parentElement
        .parentElement === bar

        ? template
            .parentElement

        : null;


    const fragment =
      document
        .createDocumentFragment();


    FINAL_TABS.forEach(
      name => {

        const control =
          makeButton(
            template,
            name
          );


        if (
          wrapperTemplate
        ) {

          const wrapper =
            wrapperTemplate
              .cloneNode(false);


          wrapper.removeAttribute(
            'id'
          );


          wrapper.classList.remove(
            'active',
            'selected',
            'on'
          );


          wrapper.classList.add(
            'v33-tab-grid-item'
          );


          wrapper.appendChild(
            control
          );


          fragment.appendChild(
            wrapper
          );

        } else {

          control.classList.add(
            'v33-tab-grid-item'
          );


          fragment.appendChild(
            control
          );
        }
      }
    );


    bar.replaceChildren(
      fragment
    );


    bar.classList.add(
      'v33-tab-grid'
    );


    updateActive();


    return true;
  }



  function contentRoot() {

    return (

      document
        .getElementById(
          'content'
        ) ||

      document
        .getElementById(
          'view'
        ) ||

      document
        .querySelector(
          '[data-view-content]'
        ) ||

      document
        .querySelector(
          '.view-content'
        )
    );
  }



  function afterViewRender() {

    requestAnimationFrame(
      () => {

        try {

          if (
            typeof applyUiV33 ===
            'function'
          ) {

            applyUiV33();
          }

        } catch (e) {}


        try {

          if (
            typeof applyMoneyFormatV33 ===
            'function'
          ) {

            applyMoneyFormatV33();
          }

        } catch (e) {}


        mountNav();

        updateActive();
      }
    );
  }



  function renderFinalView(
    name
  ) {

    if (
      finalRendering
    ) {

      return;
    }


    const fn =
      viewFn(name);


    const root =
      contentRoot();


    if (
      typeof fn !==
      'function'
    ) {

      console.error(
        '[v33 nav] missing view:',
        name
      );

      return;
    }


    if (!root) {

      console.error(
        '[v33 nav] content root not found'
      );

      return;
    }


    finalRendering =
      true;


    try {

      root.innerHTML =
        String(
          fn() ??
          ''
        );


      afterViewRender();

    } catch (e) {

      console.error(
        '[v33 nav] view render failed:',
        name,
        e
      );

    } finally {

      finalRendering =
        false;
    }
  }



  function selectFinalTabV33(
    name
  ) {

    if (
      !FINAL_TABS
        .includes(name) ||

      typeof viewFn(name) !==
        'function'
    ) {

      name =
        'Overview';
    }


    activeTabV33 =
      name;


    localStorage.setItem(
      STORAGE_KEY,
      name
    );


    syncOldTab(
      name
    );


    //
    // 기존 render를 먼저 활용.
    // 실패하면 바로 아래 fallback.
    //

    try {

      if (
        typeof render ===
        'function'
      ) {

        render();

        return;
      }

    } catch (e) {

      console.warn(
        '[v33 nav] old render failed, using fallback',
        e
      );
    }


    mountNav();

    renderFinalView(
      name
    );
  }



  window.selectFinalTabV33 =
    selectFinalTabV33;



  //
  // 기존 render()가 save / market refresh /
  // cloud load 등으로 다시 실행되어도
  // 최종 선택 탭을 복원한다.
  //

  try {

    if (
      typeof render ===
      'function'
    ) {

      const renderBeforeV33Nav =
        render;


      render =
        function () {

          syncOldTab(
            activeTabV33
          );


          let result;


          try {

            result =
              renderBeforeV33Nav
                .apply(
                  this,
                  arguments
                );

          } catch (e) {

            console.warn(
              '[v33 nav] legacy render exception',
              e
            );
          }


          requestAnimationFrame(
            () => {

              mountNav();


              renderFinalView(
                activeTabV33
              );
            }
          );


          return result;
        };
    }

  } catch (e) {

    console.error(
      '[v33 nav] render wrapper failed',
      e
    );
  }



  function boot() {

    installViews();


    if (
      !FINAL_TABS
        .includes(
          activeTabV33
        ) ||

      typeof viewFn(
        activeTabV33
      ) !== 'function'
    ) {

      activeTabV33 =
        'Overview';
    }


    syncOldTab(
      activeTabV33
    );


    mountNav();


    renderFinalView(
      activeTabV33
    );


    //
    // 디버깅용.
    // Console에서 finalTabsStatusV33 입력 가능.
    //

    window.finalTabsStatusV33 = {

      requested:
        FINAL_TABS.slice(),

      available:
        FINAL_TABS.filter(
          name =>
            typeof viewFn(name) ===
            'function'
        ),

      active:
        activeTabV33
    };


    console.info(
      '[Portfolio Control] final 8-tab nav loaded',
      window.finalTabsStatusV33
    );
  }



  window.addEventListener(
    'load',
    () =>
      setTimeout(
        boot,
        0
      )
  );

})();
