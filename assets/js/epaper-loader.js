/* ==========================================================
   Daily Chalchitra ePaper
   epaper-loader.js
   Final module loader
   ========================================================== */

(function (window, document) {
  "use strict";

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const existing = document.querySelector(
        'script[src="' + src + '"]'
      );

      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement("script");

      script.src = src;
      script.async = false;

      script.onload = function () {
        resolve();
      };

      script.onerror = function () {
        reject(
          new Error(
            "ePaper script load failed: " + src
          )
        );
      };

      document.head.appendChild(script);
    });
  }

  async function init() {
    /*
     * Data প্রথমে
     */
    await loadScript(
      "/assets/js/epaper-data.js"
    );

    /*
     * Core
     */
    await loadScript(
      "/assets/js/epaper-core.js"
    );

    /*
     * Viewer
     */
    await loadScript(
      "/assets/js/epaper-viewer.js"
    );

    /*
     * Print
     */
    await loadScript(
      "/assets/js/epaper-print.js"
    );

    /*
     * Init ফাইল আগে থেকেই থাকলে
     * সেটিকে আবার load করা হবে না।
     */
    const initScript =
      document.querySelector(
        'script[src="/assets/js/epaper-init.js"]'
      );

    if (!initScript) {
      await loadScript(
        "/assets/js/epaper-init.js"
      );
    }

    document.dispatchEvent(
      new CustomEvent(
        "dc:epaper-modules-loaded"
      )
    );
  }

  window.DCEpaperLoader = {
    init: init
  };

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

})(window, document);
