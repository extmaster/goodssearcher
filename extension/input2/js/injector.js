(function () {
  const HOST_ID = "goods-searcher-extension-root";
  // Height of one text slot line in VH units (Match this with CSS .slot-text height)
  const SLOT_HEIGHT_VH = 6;

  // --- Configuration ---
  const ENGINES = [
    { name: "Google", url: "https://www.google.com/search?q=" },
    { name: "Yandex", url: "https://yandex.ru/search/?text=" },
    { name: "Yahoo", url: "https://search.yahoo.com/search?p=" },
    { name: "Bing", url: "https://www.bing.com/search?q=" },
  ];

  const STORES = [
    {
      id: "ali",
      brand: "ali",
      variants: [
        {
          name: "AliExpress (RU)",
          domain: "aliexpress.ru",
          url: "https://aliexpress.ru/wholesale?SearchText=",
        },
        {
          name: "AliExpress (Global)",
          domain: "aliexpress.com",
          url: "https://www.aliexpress.com/wholesale?SearchText=",
        },
        {
          name: "AliExpress (US)",
          domain: "aliexpress.us",
          url: "https://www.aliexpress.us/w/wholesale-.html?SearchText=",
        },
        {
          name: "AliExpress (BR)",
          domain: "aliexpress.com.br",
          url: "https://pt.aliexpress.com/wholesale?SearchText=",
        },
        {
          name: "AliExpress (FR)",
          domain: "fr.aliexpress.com",
          url: "https://fr.aliexpress.com/wholesale?SearchText=",
        },
        {
          name: "AliExpress (ES)",
          domain: "es.aliexpress.com",
          url: "https://es.aliexpress.com/wholesale?SearchText=",
        },
      ],
    },
    {
      id: "wb",
      brand: "wb",
      variants: [
        {
          name: "Wildberries (RU)",
          domain: "wildberries.ru",
          url: "https://www.wildberries.ru/catalog/0/search.aspx?search=",
        },
        {
          name: "Wildberries (BY)",
          domain: "wildberries.by",
          url: "https://www.wildberries.by/catalog/0/search.aspx?search=",
        },
        {
          name: "Wildberries (KZ)",
          domain: "wildberries.kz",
          url: "https://www.wildberries.kz/catalog/0/search.aspx?search=",
        },
      ],
    },
    {
      id: "ozon",
      brand: "ozon",
      variants: [
        {
          name: "Ozon (RU)",
          domain: "ozon.ru",
          url: "https://www.ozon.ru/search/?text=",
        },
        {
          name: "Ozon (Global)",
          domain: "ozon.com",
          url: "https://www.ozon.com/search/?text=",
        },
      ],
    },
    {
      id: "ebay",
      brand: "ebay",
      variants: [
        {
          name: "eBay (COM)",
          domain: "ebay.com",
          url: "https://www.ebay.com/sch/i.html?_nkw=",
        },
        {
          name: "eBay (DE)",
          domain: "ebay.de",
          url: "https://www.ebay.de/sch/i.html?_nkw=",
        },
        {
          name: "eBay (UK)",
          domain: "ebay.co.uk",
          url: "https://www.ebay.co.uk/sch/i.html?_nkw=",
        },
        {
          name: "eBay (AU)",
          domain: "ebay.com.au",
          url: "https://www.ebay.com.au/sch/i.html?_nkw=",
        },
        {
          name: "eBay (CA)",
          domain: "ebay.ca",
          url: "https://www.ebay.ca/sch/i.html?_nkw=",
        },
        {
          name: "eBay (FR)",
          domain: "ebay.fr",
          url: "https://www.ebay.fr/sch/i.html?_nkw=",
        },
        {
          name: "eBay (IT)",
          domain: "ebay.it",
          url: "https://www.ebay.it/sch/i.html?_nkw=",
        },
        {
          name: "eBay (ES)",
          domain: "ebay.es",
          url: "https://www.ebay.es/sch/i.html?_nkw=",
        },
      ],
    },
    {
      id: "amazon",
      brand: "amazon",
      variants: [
        {
          name: "Amazon (COM)",
          domain: "amazon.com",
          url: "https://www.amazon.com/s?k=",
        },
        {
          name: "Amazon (DE)",
          domain: "amazon.de",
          url: "https://www.amazon.de/s?k=",
        },
        {
          name: "Amazon (UK)",
          domain: "amazon.co.uk",
          url: "https://www.amazon.co.uk/s?k=",
        },
        {
          name: "Amazon (JP)",
          domain: "amazon.co.jp",
          url: "https://www.amazon.co.jp/s?k=",
        },
        {
          name: "Amazon (FR)",
          domain: "amazon.fr",
          url: "https://www.amazon.fr/s?k=",
        },
        {
          name: "Amazon (IT)",
          domain: "amazon.it",
          url: "https://www.amazon.it/s?k=",
        },
        {
          name: "Amazon (ES)",
          domain: "amazon.es",
          url: "https://www.amazon.es/s?k=",
        },
        {
          name: "Amazon (CA)",
          domain: "amazon.ca",
          url: "https://www.amazon.ca/s?k=",
        },
      ],
    },
  ];

  // --- State Management ---
  let state = {
    engineIndex: 0,
    // Map: storeId -> { active: boolean, variantIndex: number }
    stores: {},
  };

  // Initialize default state
  STORES.forEach((s) => {
    state.stores[s.id] = { active: false, variantIndex: 0 };
  });

  let selectedText = "";

  // --- Initialization ---
  function init() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "toggle_search_ui") {
        toggleUI();
      }
    });

    // Load saved state
    chrome.storage.local.get(["appState"], (res) => {
      if (res.appState) {
        // Merge loaded state
        state = { ...state, ...res.appState };
        // Ensure integrity
        STORES.forEach((s) => {
          if (!state.stores[s.id])
            state.stores[s.id] = { active: false, variantIndex: 0 };
        });
      }
    });
  }

  init();

  // --- DOM Construction ---

  function createShadowDOM() {
    let host = document.getElementById(HOST_ID);
    if (host) return host.shadowRoot;

    host = document.createElement("div");
    host.id = HOST_ID;
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });

    // Link CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("css/ui.css");
    shadow.appendChild(link);

    // HTML
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = getHtml();
    shadow.appendChild(overlay);

    bindEvents(shadow);

    return shadow;
  }

  function getHtml() {
    return `
        <div class="container" id="main-window">
             <!-- Top Actions -->
             <div class="action-area">
                <div class="btn-half">
                    <button class="btn-onsite" id="btn-onsite">
                        <svg class="icon-svg" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.41z"/>
                        </svg>
                        <span class="btn-label">On Site</span>
                    </button>
                </div>

                <div class="btn-half">
                    <div class="scene" id="cube-scene">
                        <div class="cube" id="cube">
                            <div class="cube__face cube__face--front">Google</div>
                            <div class="cube__face cube__face--bottom">Yandex</div>
                        </div>
                    </div>
                </div>
             </div>

             <!-- Middle: Stores List -->
             <div class="store-list">
                ${STORES.map(renderStoreRow).join("")}
             </div>

             <!-- Bottom Bar -->
             <div class="bottom-bar">
                <span class="hint-text" id="status-hint">Settings available via icon &rarr;</span>

                <button class="icon-btn" id="btn-settings" title="Settings">
                    <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L5.09 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.04.64.09.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.07.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
                </button>

                <button class="icon-btn" id="btn-help" title="Help / Demo">
                    <svg viewBox="0 0 24 24"><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>
                </button>
             </div>

             <!-- Settings Drawer -->
             <div class="drawer" id="settings-drawer">
                <div class="drawer-header">
                    <span>Region Settings</span>
                    <button class="close-drawer-btn" id="close-drawer">&times;</button>
                </div>
                <div class="drawer-content">
                    ${renderSettingsContent()}
                </div>
             </div>
        </div>
        `;
  }

  function renderStoreRow(store) {
    // Generate strip of all variants for animation
    const variantsHtml = store.variants
      .map((v) => `<div class="slot-text">${v.name}</div>`)
      .join("");

    return `
            <div class="store-item" id="row-${store.id}" data-brand="${store.brand}">
                <label class="switch">
                    <input type="checkbox" id="cb-${store.id}">
                    <span class="slider"></span>
                </label>
                <div class="slot-viewport">
                    <div class="slot-strip" id="strip-${store.id}">
                        ${variantsHtml}
                    </div>
                </div>
            </div>
        `;
  }

  function renderSettingsContent() {
    return STORES.map((store) => {
      if (store.variants.length <= 1) return ""; // No settings needed if no variants

      const optionsHtml = store.variants
        .map(
          (v, idx) => `
                <label class="radio-row">
                    <input type="radio"
                           name="setting-${store.id}"
                           value="${idx}"
                           class="setting-radio"
                           data-store="${store.id}">
                    ${v.name}
                </label>
            `,
        )
        .join("");

      return `
                <div class="settings-section">
                    <div class="settings-title">${store.brand} Region</div>
                    ${optionsHtml}
                </div>
            `;
    }).join("");
  }

  // --- Logic ---

  function toggleUI() {
    selectedText = window.getSelection().toString().trim();
    const shadow = createShadowDOM();
    const overlay = shadow.querySelector(".overlay");

    if (overlay.classList.contains("visible")) {
      overlay.classList.remove("visible");
      // Close drawer if open
      shadow.getElementById("settings-drawer").classList.remove("open");
    } else {
      overlay.classList.add("visible");
      restoreState(shadow);
    }
  }

  function restoreState(shadow) {
    // Engine
    const front = shadow.querySelector(".cube__face--front");
    const eng = ENGINES[state.engineIndex];
    front.textContent = eng.name;
    front.style.background = getEngineColor(eng.name);
    front.style.color = eng.name === "Yandex" ? "#000" : "#fff";

    // Stores
    STORES.forEach((store) => {
      const sVal = state.stores[store.id];

      // 1. toggle switch
      const cb = shadow.getElementById(`cb-${store.id}`);
      const row = shadow.getElementById(`row-${store.id}`);
      if (cb) {
        cb.checked = sVal.active;
        if (sVal.active) row.classList.add("active");
        else row.classList.remove("active");
      }

      // 2. slot position
      updateSlotPosition(shadow, store.id, sVal.variantIndex);

      // 3. settings radio
      const radios = shadow.querySelectorAll(
        `input[name="setting-${store.id}"]`,
      );
      radios.forEach((r) => {
        if (parseInt(r.value) === sVal.variantIndex) r.checked = true;
      });
    });
  }

  function updateSlotPosition(shadow, storeId, variantIdx) {
    const strip = shadow.getElementById(`strip-${storeId}`);
    if (strip) {
      // Apply Transform using VH units matched to CSS
      strip.style.transform = `translateY(-${variantIdx * SLOT_HEIGHT_VH}vh)`;
    }
  }

  function saveState() {
    chrome.storage.local.set({ appState: state });
  }

  // --- Event Binding ---

  function bindEvents(shadow) {
    const overlay = shadow.querySelector(".overlay");

    // Close Overlay
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("visible");
        shadow.getElementById("settings-drawer").classList.remove("open");
      }
    });

    // 1. OnSite Search Button
    shadow.getElementById("btn-onsite").addEventListener("click", () => {
      performOnSiteSearch();
      overlay.classList.remove("visible");
    });

    // 2. Cube Logic
    const scene = shadow.getElementById("cube-scene");
    const cube = shadow.getElementById("cube");
    const front = shadow.querySelector(".cube__face--front");
    const bottom = shadow.querySelector(".cube__face--bottom");

    // Rotate (R-Click or L-Click? User said "2nd button" for search, usually toggle is separate)
    // Let's allow rotation on R-Click, Search on L-Click
    scene.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      rotateEngine(shadow, cube, front, bottom);
    });

    scene.addEventListener("click", () => {
      performEngineSearch();
      overlay.classList.remove("visible");
    });

    // 3. Store Toggles & Settings Logic
    STORES.forEach((store) => {
      const cb = shadow.getElementById(`cb-${store.id}`);
      const row = shadow.getElementById(`row-${store.id}`);

      // Toggle
      cb.addEventListener("change", (e) => {
        state.stores[store.id].active = e.target.checked;
        saveState();
        if (e.target.checked) row.classList.add("active");
        else row.classList.remove("active");
      });

      // Radio logic handles slot updates
      const radios = shadow.querySelectorAll(
        `input[name="setting-${store.id}"]`,
      );
      radios.forEach((radio) => {
        radio.addEventListener("change", (e) => {
          const newIdx = parseInt(e.target.value);
          state.stores[store.id].variantIndex = newIdx;
          saveState();
          // Animate Slot immediately
          updateSlotPosition(shadow, store.id, newIdx);
        });
      });
    });

    // 4. Panel / Drawer
    const drawer = shadow.getElementById("settings-drawer");
    shadow.getElementById("btn-settings").addEventListener("click", () => {
      drawer.classList.add("open");
    });
    shadow.getElementById("close-drawer").addEventListener("click", () => {
      drawer.classList.remove("open");
    });

    // 5. Help / Demo
    shadow.getElementById("btn-help").addEventListener("click", () => {
      // Quick demo: toggle toggles
      const checkboxes = shadow.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((cb, i) => {
        setTimeout(() => cb.click(), i * 200);
        setTimeout(() => cb.click(), 1000 + i * 200);
      });
    });
  }

  function rotateEngine(shadow, cube, front, bottom) {
    let nextIdx = (state.engineIndex + 1) % ENGINES.length;
    let nextEng = ENGINES[nextIdx];

    bottom.textContent = nextEng.name;
    bottom.style.background = getEngineColor(nextEng.name);
    bottom.style.color = nextEng.name === "Yandex" ? "#000" : "#fff";

    cube.classList.add("is-flipped");

    setTimeout(() => {
      state.engineIndex = nextIdx;
      saveState();

      front.textContent = nextEng.name;
      front.style.background = getEngineColor(nextEng.name);
      front.style.color = nextEng.name === "Yandex" ? "#000" : "#fff";

      cube.style.transition = "none";
      cube.classList.remove("is-flipped");
      void cube.offsetWidth; // Force Reflow
      cube.style.transition = ""; // Restore CSS transition rules (from class or inherited)
      cube.style.transition = "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)";
    }, 600);
  }

  // --- Search Execution ---

  function performOnSiteSearch() {
    const query = selectedText || "";
    let hit = false;

    STORES.forEach((store) => {
      const s = state.stores[store.id];
      if (s.active) {
        const variant = store.variants[s.variantIndex];
        window.open(variant.url + encodeURIComponent(query), "_blank");
        hit = true;
      }
    });

    if (!hit && query) {
      // Search current site via Google
      const domain = window.location.hostname;
      const url = `https://www.google.com/search?q=${encodeURIComponent(query + " site:" + domain)}`;
      window.open(url, "_blank");
    }
  }

  function performEngineSearch() {
    const query = selectedText || "";
    const engine = ENGINES[state.engineIndex];
    let hit = false;

    STORES.forEach((store) => {
      const s = state.stores[store.id];
      if (s.active) {
        const variant = store.variants[s.variantIndex];
        // Query: "term site:ebay.de"
        const q = `${query} site:${variant.domain}`;
        window.open(engine.url + encodeURIComponent(q), "_blank");
        hit = true;
      }
    });

    if (!hit) {
      // Raw engine search
      window.open(engine.url + encodeURIComponent(query), "_blank");
    }
  }

  function getEngineColor(name) {
    switch (name) {
      case "Google":
        return "#4285F4";
      case "Yandex":
        return "#FC3";
      case "Yahoo":
        return "#6001D2";
      case "Bing":
        return "#008373";
      default:
        return "#333";
    }
  }
})();
