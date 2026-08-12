/* ==========================================================
   Daily Chalchitra ePaper
   epaper-print.js
   Print / PDF generation controller
   ========================================================== */

(function (window, document) {
  "use strict";

  const DCPrint = {};

  /* ----------------------------------------------------------
     Helpers
     ---------------------------------------------------------- */

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function getPageElement() {
    return qs("#dc-epaper-page");
  }

  function getPosts() {
    const page = getPageElement();
    if (!page) return [];

    return qsa(".dc-post-card", page);
  }

  function getPostHTML(post) {
    if (!post) return "";

    return post.outerHTML;
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms || 0);
    });
  }

  function waitForImages(container) {
    const images = qsa("img", container);

    if (!images.length) {
      return Promise.resolve();
    }

    return Promise.all(
      images.map(function (img) {
        if (img.complete) {
          return Promise.resolve();
        }

        return new Promise(function (resolve) {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      })
    );
  }

  /* ----------------------------------------------------------
     Print preparation
     ---------------------------------------------------------- */

  function resetViewerTransforms() {
    const page = getPageElement();

    if (!page) return;

    page.style.transform = "none";
    page.style.transformOrigin = "top left";
  }

  function prepareForPrint() {
    const page = getPageElement();

    if (!page) {
      return false;
    }

    resetViewerTransforms();

    page.classList.add("dc-print-active");

    document.body.classList.add("dc-print-mode");

    return true;
  }

  function restoreAfterPrint() {
    const page = getPageElement();

    if (page) {
      page.classList.remove("dc-print-active");
    }

    document.body.classList.remove("dc-print-mode");
  }

  /* ----------------------------------------------------------
     Browser print
     ---------------------------------------------------------- */

  async function printCurrentPage() {
    const page = getPageElement();

    if (!page) {
      console.warn("Daily Chalchitra ePaper: #dc-epaper-page পাওয়া যায়নি।");
      return;
    }

    prepareForPrint();

    try {
      await waitForImages(page);
      await wait(150);

      window.print();
    } finally {
      setTimeout(function () {
        restoreAfterPrint();
      }, 500);
    }
  }

  /* ----------------------------------------------------------
     Print button binding
     ---------------------------------------------------------- */

  function bindPrintButtons() {
    const selectors = [
      "#dc-print-btn",
      "#dc-print",
      ".dc-print-btn",
      "[data-dc-print]"
    ];

    selectors.forEach(function (selector) {
      qsa(selector).forEach(function (button) {
        if (button.dataset.dcPrintBound === "1") {
          return;
        }

        button.dataset.dcPrintBound = "1";

        button.addEventListener("click", function (event) {
          event.preventDefault();
          printCurrentPage();
        });
      });
    });
  }

  /* ----------------------------------------------------------
     PDF / Print capture support
     ---------------------------------------------------------- */

  function createCapturePage() {
    const page = getPageElement();

    if (!page) {
      return null;
    }

    const capture = document.createElement("div");

    capture.className = "dc-capture-page";
    capture.setAttribute("aria-hidden", "true");

    /*
     * বর্তমান ePaper-এর header অংশ
     */
    const header = page.querySelector(".dc-paper-head");

    if (header) {
      capture.appendChild(header.cloneNode(true));
    }

    /*
     * বর্তমান পোস্টগুলো সংগ্রহ
     */
    const posts = getPosts();

    if (!posts.length) {
      const empty = document.createElement("div");
      empty.className = "dc-empty";
      empty.textContent = "এই পাতায় কোনো সংবাদ পাওয়া যায়নি।";
      capture.appendChild(empty);

      return capture;
    }

    /*
     * Fixed-width 4-column print layout.
     * epaper.css-এর .dc-print-columns /
     * .dc-print-col-এর সঙ্গে কাজ করবে।
     */
    const columnsWrapper = document.createElement("div");
    columnsWrapper.className = "dc-print-columns";

    const columnCount = 4;
    const columns = [];

    for (let i = 0; i < columnCount; i++) {
      const column = document.createElement("div");
      column.className = "dc-print-col";

      columns.push(column);
      columnsWrapper.appendChild(column);
    }

    /*
     * সংবাদগুলো ধারাবাহিকভাবে কলামে ভাগ করা।
     */
    posts.forEach(function (post, index) {
      const columnIndex = index % columnCount;

      columns[columnIndex].insertAdjacentHTML(
        "beforeend",
        getPostHTML(post)
      );
    });

    capture.appendChild(columnsWrapper);

    return capture;
  }

  async function openPrintPreview() {
    const capture = createCapturePage();

    if (!capture) {
      return;
    }

    /*
     * অফস্ক্রিনে capture রাখা হবে।
     * এটি মূল ePaper UI-কে পরিবর্তন করবে না।
     */
    capture.style.position = "fixed";
    capture.style.left = "-100000px";
    capture.style.top = "0";
    capture.style.zIndex = "-1";
    capture.style.visibility = "visible";

    document.body.appendChild(capture);

    try {
      await waitForImages(capture);
      await wait(100);

      /*
       * নতুন উইন্ডোতে fixed print page দেখানো।
       */
      const printWindow = window.open(
        "",
        "_blank",
        "width=1100,height=900"
      );

      if (!printWindow) {
        console.warn(
          "Daily Chalchitra ePaper: popup blocked হয়েছে।"
        );
        return;
      }

      const styles = qsa('link[rel="stylesheet"], style')
        .map(function (node) {
          return node.outerHTML;
        })
        .join("\n");

      printWindow.document.open();

      printWindow.document.write(
        "<!DOCTYPE html>" +
          '<html lang="bn">' +
          "<head>" +
          '<meta charset="UTF-8">' +
          '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
          "<title>Daily Chalchitra ePaper</title>" +
          styles +
          "<style>" +
          "@page{size:A4 portrait;margin:0.4cm;}" +
          "html,body{margin:0;padding:0;background:#fff;}" +
          "body{font-family:'Noto Serif Bengali',serif;}" +
          ".dc-capture-page{margin:0 auto!important;}" +
          ".dc-print-columns{display:flex!important;align-items:flex-start!important;}" +
          ".dc-print-col{flex:0 0 224px!important;width:224px!important;}" +
          ".dc-post-card{break-inside:avoid!important;page-break-inside:avoid!important;}" +
          "</style>" +
          "</head>" +
          "<body>" +
          capture.outerHTML +
          "</body>" +
          "</html>"
      );

      printWindow.document.close();

      printWindow.focus();

      setTimeout(function () {
        printWindow.print();
      }, 500);
    } finally {
      setTimeout(function () {
        if (capture.parentNode) {
          capture.parentNode.removeChild(capture);
        }
      }, 1000);
    }
  }

  /* ----------------------------------------------------------
     PDF button binding
     ---------------------------------------------------------- */

  function bindPDFButtons() {
    const selectors = [
      "#dc-pdf-btn",
      "#dc-download-pdf",
      ".dc-pdf-btn",
      "[data-dc-pdf]"
    ];

    selectors.forEach(function (selector) {
      qsa(selector).forEach(function (button) {
        if (button.dataset.dcPdfBound === "1") {
          return;
        }

        button.dataset.dcPdfBound = "1";

        button.addEventListener("click", function (event) {
          event.preventDefault();
          openPrintPreview();
        });
      });
    });
  }

  /* ----------------------------------------------------------
     Keyboard shortcut
     ---------------------------------------------------------- */

  function bindKeyboardPrint() {
    document.addEventListener("keydown", function (event) {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      if (String(event.key).toLowerCase() !== "p") {
        return;
      }

      const page = getPageElement();

      if (!page) {
        return;
      }

      event.preventDefault();

      printCurrentPage();
    });
  }

  /* ----------------------------------------------------------
     Browser print lifecycle
     ---------------------------------------------------------- */

  function bindPrintLifecycle() {
    window.addEventListener("beforeprint", function () {
      prepareForPrint();
    });

    window.addEventListener("afterprint", function () {
      restoreAfterPrint();
    });
  }

  /* ----------------------------------------------------------
     Public API
     ---------------------------------------------------------- */

  DCPrint.print = printCurrentPage;
  DCPrint.pdf = openPrintPreview;
  DCPrint.prepare = prepareForPrint;
  DCPrint.restore = restoreAfterPrint;

  /* ----------------------------------------------------------
     Initialize
     ---------------------------------------------------------- */

  function init() {
    bindPrintButtons();
    bindPDFButtons();
    bindKeyboardPrint();
    bindPrintLifecycle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /*
   * অন্য ePaper JavaScript ফাইল থেকেও ব্যবহার করা যাবে:
   *
   * window.DCPrint.print()
   * window.DCPrint.pdf()
   */
  window.DCPrint = DCPrint;

})(window, document);
