/* ==========================================================
   Daily Chalchitra ePaper
   epaper-bridge.js
   Module Compatibility / Integration Bridge
   ========================================================== */

(function (window, document) {
  "use strict";

  const DCBridge = {};

  const EVENTS = {
    READY: "dc:epaper-ready",
    DATA_READY: "dc:epaper-data-ready",
    VIEWER_READY: "dc:epaper-viewer-ready",
    ISSUE_CHANGED: "dc:epaper-issue-changed",
    PAGE_CHANGED: "dc:epaper-page-changed",
    ASSETS_READY: "dc:epaper-assets-ready",
    MODULES_LOADED: "dc:epaper-modules-loaded"
  };

  let initialized = false;

  /* ----------------------------------------------------------
     Helpers
     ---------------------------------------------------------- */

  function dispatch(name, detail) {
    document.dispatchEvent(
      new CustomEvent(name, {
        detail: detail || {}
      })
    );
  }

  function getGlobal() {
    return window;
  }

  function findObject(names) {
    const root = getGlobal();

    for (let i = 0; i < names.length; i++) {
      const name = names[i];

      if (
        root[name] &&
        typeof root[name] === "object"
      ) {
        return root[name];
      }
    }

    return null;
  }

  function callMethod(
    objectNames,
    methodNames,
    args
  ) {
    const object = findObject(objectNames);

    if (!object) {
      return {
        success: false,
        object: null
      };
    }

    for (
      let i = 0;
      i < methodNames.length;
      i++
    ) {
      const method = methodNames[i];

      if (
        typeof object[method] ===
        "function"
      ) {
        try {
          return {
            success: true,
            object: object,
            value: object[method].apply(
              object,
              args || []
            )
          };
        } catch (error) {
          console.error(
            "Daily Chalchitra ePaper bridge error:",
            error
          );

          return {
            success: false,
            object: object,
            error: error
          };
        }
      }
    }

    return {
      success: false,
      object: object
    };
  }

  /* ----------------------------------------------------------
     Core bridge
     ---------------------------------------------------------- */

  function getCore() {
    return findObject([
      "DCEpaperCore",
      "DCEpaper"
    ]);
  }

  function getData() {
    return findObject([
      "DCEpaperData",
      "DCEpaperDataManager"
    ]);
  }

  function getViewer() {
    return findObject([
      "DCViewer",
      "DCEpaperViewer"
    ]);
  }

  function getAssets() {
    return findObject([
      "DCEpaperAssets"
    ]);
  }

  function getPrint() {
    return findObject([
      "DCPrint"
    ]);
  }

  /* ----------------------------------------------------------
     Issue operations
     ---------------------------------------------------------- */

  function loadIssue(issueId) {
    if (!issueId) {
      return false;
    }

    const result = callMethod(
      [
        "DCEpaperCore",
        "DCEpaper",
        "DCEpaperData"
      ],
      [
        "loadIssue",
        "openIssue",
        "selectIssue",
        "setIssue"
      ],
      [issueId]
    );

    if (result.success) {
      dispatch(
        EVENTS.ISSUE_CHANGED,
        {
          issueId: issueId
        }
      );
    }

    return result.success;
  }

  function getCurrentIssue() {
    const result = callMethod(
      [
        "DCEpaperCore",
        "DCEpaper",
        "DCEpaperData"
      ],
      [
        "getCurrentIssue",
        "currentIssue",
        "getSelectedIssue"
      ]
    );

    return result.success
      ? result.value
      : null;
  }

  /* ----------------------------------------------------------
     Page operations
     ---------------------------------------------------------- */

  function goToPage(page) {
    const pageNumber = Number(page);

    if (
      !Number.isFinite(pageNumber) ||
      pageNumber < 1
    ) {
      return false;
    }

    const result = callMethod(
      [
        "DCViewer",
        "DCEpaperViewer",
        "DCEpaperCore"
      ],
      [
        "goToPage",
        "gotoPage",
        "showPage",
        "setPage"
      ],
      [pageNumber]
    );

    if (result.success) {
      dispatch(
        EVENTS.PAGE_CHANGED,
        {
          page: pageNumber
        }
      );
    }

    return result.success;
  }

  function nextPage() {
    const result = callMethod(
      [
        "DCViewer",
        "DCEpaperViewer"
      ],
      [
        "nextPage",
        "next"
      ]
    );

    return result.success;
  }

  function previousPage() {
    const result = callMethod(
      [
        "DCViewer",
        "DCEpaperViewer"
      ],
      [
        "previousPage",
        "prevPage",
        "previous",
        "prev"
      ]
    );

    return result.success;
  }

  function getCurrentPage() {
    const result = callMethod(
      [
        "DCViewer",
        "DCEpaperViewer"
      ],
      [
        "getCurrentPage",
        "currentPage",
        "getPage"
      ]
    );

    return result.success
      ? result.value
      : null;
  }

  /* ----------------------------------------------------------
     Zoom operations
     ---------------------------------------------------------- */

  function zoomIn() {
    const result = callMethod(
      [
        "DCViewer",
        "DCEpaperViewer"
      ],
      [
        "zoomIn",
        "increaseZoom"
      ]
    );

    return result.success;
  }

  function zoomOut() {
    const result = callMethod(
      [
        "DCViewer",
        "DCEpaperViewer"
      ],
      [
        "zoomOut",
        "decreaseZoom"
      ]
    );

    return result.success;
  }

  function resetZoom() {
    const result = callMethod(
      [
        "DCViewer",
        "DCEpaperViewer"
      ],
      [
        "resetZoom",
        "fitToScreen",
        "reset"
      ]
    );

    return result.success;
  }

  /* ----------------------------------------------------------
     Print operations
     ---------------------------------------------------------- */

  function print() {
    const printer = getPrint();

    if (
      printer &&
      typeof printer.print ===
        "function"
    ) {
      printer.print();
      return true;
    }

    window.print();
    return true;
  }

  function pdf() {
    const printer = getPrint();

    if (
      printer &&
      typeof printer.pdf ===
        "function"
    ) {
      printer.pdf();
      return true;
    }

    return false;
  }

  /* ----------------------------------------------------------
     Asset operations
     ---------------------------------------------------------- */

  function resolveAsset(path) {
    const assets = getAssets();

    if (
      assets &&
      typeof assets.resolve ===
        "function"
    ) {
      return assets.resolve(path);
    }

    return path || "";
  }

  function resolveImage(path) {
    const assets = getAssets();

    if (
      assets &&
      typeof assets.image ===
        "function"
    ) {
      return assets.image(path);
    }

    return path || "";
  }

  /* ----------------------------------------------------------
     Event bridge
     ---------------------------------------------------------- */

  function bindEvents() {
    document.addEventListener(
      EVENTS.DATA_READY,
      function (event) {
        dispatch(
          EVENTS.READY,
          event.detail || {}
        );
      }
    );

    document.addEventListener(
      EVENTS.VIEWER_READY,
      function (event) {
        dispatch(
          EVENTS.READY,
          event.detail || {}
        );
      }
    );

    document.addEventListener(
      EVENTS.ASSETS_READY,
      function () {
        dispatch(
          EVENTS.READY,
          {
            assets: true
          }
        );
      }
    );
  }

  /* ----------------------------------------------------------
     DOM compatibility helpers
     ---------------------------------------------------------- */

  function ensureViewerPage() {
    const page =
      document.querySelector(
        "#dc-epaper-page"
      );

    if (!page) {
      return false;
    }

    page.setAttribute(
      "data-dc-epaper",
      "true"
    );

    return true;
  }

  function ensureControls() {
    const pageInfo =
      document.querySelector(
        "#dc-page-info"
      );

    if (pageInfo) {
      pageInfo.setAttribute(
        "aria-live",
        "polite"
      );
    }

    return true;
  }

  /* ----------------------------------------------------------
     Initialization
     ---------------------------------------------------------- */

  function init() {
    if (initialized) {
      return;
    }

    initialized = true;

    ensureViewerPage();
    ensureControls();
    bindEvents();

    dispatch(
      EVENTS.MODULES_LOADED,
      {
        core: !!getCore(),
        data: !!getData(),
        viewer: !!getViewer(),
        assets: !!getAssets(),
        print: !!getPrint()
      }
    );
  }

  /* ----------------------------------------------------------
     Public API
     ---------------------------------------------------------- */

  DCBridge.init = init;

  DCBridge.loadIssue =
    loadIssue;

  DCBridge.getCurrentIssue =
    getCurrentIssue;

  DCBridge.goToPage =
    goToPage;

  DCBridge.nextPage =
    nextPage;

  DCBridge.previousPage =
    previousPage;

  DCBridge.getCurrentPage =
    getCurrentPage;

  DCBridge.zoomIn =
    zoomIn;

  DCBridge.zoomOut =
    zoomOut;

  DCBridge.resetZoom =
    resetZoom;

  DCBridge.print =
    print;

  DCBridge.pdf =
    pdf;

  DCBridge.resolveAsset =
    resolveAsset;

  DCBridge.resolveImage =
    resolveImage;

  DCBridge.events = EVENTS;

  window.DCEpaperBridge =
    DCBridge;

  /* ----------------------------------------------------------
     Start
     ---------------------------------------------------------- */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

})(window, document);
