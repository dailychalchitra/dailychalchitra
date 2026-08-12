/* =========================================================
   DAILY CHALCHITRA — E-PAPER UI
   Interface / controls / edition & page rendering
   ========================================================= */

(function (window, document) {
  "use strict";

  const DATA = window.DC_EPaperData;
  const CORE = window.DCEPaperCore || window.DC_EPaperCore;
  const VIEWER = window.DCEPaperViewer || window.DC_EPaperViewer;

  const UI = {

    state: {
      editionId: null,
      currentPage: 1,
      zoom: 100
    },

    elements: {},


    /* =====================================================
       INIT
       ===================================================== */

    init: function () {

      this.cacheElements();

      this.loadState();

      this.bindEvents();

      this.renderEditionList();

      this.renderPageList();

      this.updateUI();

    },


    /* =====================================================
       CACHE ELEMENTS
       ===================================================== */

    cacheElements: function () {

      this.elements.editionSelect =
        document.getElementById("dc-epaper-edition");

      this.elements.pageSelect =
        document.getElementById("dc-epaper-page");

      this.elements.pageList =
        document.getElementById("dc-epaper-pages");

      this.elements.editionList =
        document.getElementById("dc-epaper-editions");

      this.elements.pageNumber =
        document.getElementById("dc-epaper-page-number");

      this.elements.pageTitle =
        document.getElementById("dc-epaper-page-title");

      this.elements.pageImage =
        document.getElementById("dc-epaper-image");

      this.elements.viewer =
        document.getElementById("dc-epaper-viewer");

      this.elements.stage =
        document.getElementById("dc-epaper-stage");

      this.elements.loading =
        document.getElementById("dc-epaper-loading");

      this.elements.error =
        document.getElementById("dc-epaper-error");

      this.elements.zoomValue =
        document.getElementById("dc-epaper-zoom");

      this.elements.editionName =
        document.getElementById("dc-epaper-edition-name");

      this.elements.editionDate =
        document.getElementById("dc-epaper-edition-date");

    },


    /* =====================================================
       STATE
       ===================================================== */

    loadState: function () {

      let editionId = null;
      let page = 1;

      try {

        const params =
          new URLSearchParams(window.location.search);

        editionId =
          params.get("edition");

        const pageParam =
          parseInt(params.get("page"), 10);

        if (!isNaN(pageParam)) {
          page = pageParam;
        }

      } catch (error) {
        console.warn(
          "E-paper URL state could not be loaded.",
          error
        );
      }


      if (!editionId && DATA && DATA.editions.length) {
        editionId = DATA.editions[0].id;
      }


      this.state.editionId = editionId;
      this.state.currentPage = page;


      if (DATA && DATA.viewer) {

        this.state.zoom =
          Number(DATA.viewer.defaultZoom) || 100;

      }

    },


    saveState: function () {

      try {

        const url =
          new URL(window.location.href);

        if (this.state.editionId) {
          url.searchParams.set(
            "edition",
            this.state.editionId
          );
        }

        url.searchParams.set(
          "page",
          this.state.currentPage
        );

        window.history.replaceState(
          {},
          "",
          url.toString()
        );

      } catch (error) {
        console.warn(
          "Unable to update e-paper URL.",
          error
        );
      }

    },


    /* =====================================================
       EVENTS
       ===================================================== */

    bindEvents: function () {

      const self = this;


      if (this.elements.editionSelect) {

        this.elements.editionSelect.addEventListener(
          "change",
          function () {

            self.changeEdition(this.value);

          }
        );

      }


      if (this.elements.pageSelect) {

        this.elements.pageSelect.addEventListener(
          "change",
          function () {

            self.goToPage(
              parseInt(this.value, 10)
            );

          }
        );

      }


      document.addEventListener(
        "click",
        function (event) {

          const pageButton =
            event.target.closest("[data-epaper-page]");

          if (pageButton) {

            const page =
              parseInt(
                pageButton.getAttribute(
                  "data-epaper-page"
                ),
                10
              );

            if (!isNaN(page)) {
              self.goToPage(page);
            }

          }


          const editionButton =
            event.target.closest(
              "[data-epaper-edition]"
            );

          if (editionButton) {

            const editionId =
              editionButton.getAttribute(
                "data-epaper-edition"
              );

            if (editionId) {
              self.changeEdition(editionId);
            }

          }


          const control =
            event.target.closest(
              "[data-epaper-action]"
            );

          if (control) {

            self.handleAction(
              control.getAttribute(
                "data-epaper-action"
              )
            );

          }

        }
      );


      document.addEventListener(
        "keydown",
        function (event) {

          if (
            event.target &&
            (
              event.target.tagName === "INPUT" ||
              event.target.tagName === "TEXTAREA" ||
              event.target.tagName === "SELECT"
            )
          ) {
            return;
          }


          switch (event.key) {

            case "ArrowLeft":
            case "PageUp":
              event.preventDefault();
              self.previousPage();
              break;

            case "ArrowRight":
            case "PageDown":
              event.preventDefault();
              self.nextPage();
              break;

            case "+":
            case "=":
              event.preventDefault();
              self.zoomIn();
              break;

            case "-":
              event.preventDefault();
              self.zoomOut();
              break;

            case "0":
              event.preventDefault();
              self.resetZoom();
              break;

            case "f":
            case "F":
              event.preventDefault();
              self.toggleFullscreen();
              break;

            case "Home":
              event.preventDefault();
              self.goToPage(1);
              break;

            case "End":
              event.preventDefault();

              const last =
                DATA.getLastPage(
                  self.state.editionId
                );

              if (last) {
                self.goToPage(
                  last.pageNumber
                );
              }

              break;

          }

        }
      );

    },


    /* =====================================================
       ACTION HANDLER
       ===================================================== */

    handleAction: function (action) {

      switch (action) {

        case "previous":
          this.previousPage();
          break;

        case "next":
          this.nextPage();
          break;

        case "first":
          this.goToPage(1);
          break;

        case "last":

          const last =
            DATA.getLastPage(
              this.state.editionId
            );

          if (last) {
            this.goToPage(last.pageNumber);
          }

          break;

        case "zoom-in":
          this.zoomIn();
          break;

        case "zoom-out":
          this.zoomOut();
          break;

        case "zoom-reset":
          this.resetZoom();
          break;

        case "fullscreen":
          this.toggleFullscreen();
          break;

        case "print":
          window.print();
          break;

        case "download":
          this.downloadCurrentPage();
          break;

      }

    },


    /* =====================================================
       EDITION
       ===================================================== */

    changeEdition: function (editionId) {

      const edition =
        DATA.getEdition(editionId);

      if (!edition) {
        return;
      }


      this.state.editionId =
        edition.id;

      this.state.currentPage = 1;


      this.renderEditionList();

      this.renderPageList();

      this.renderPage();

      this.saveState();

    },


    renderEditionList: function () {

      const select =
        this.elements.editionSelect;

      if (!select || !DATA) {
        return;
      }


      const editions =
        DATA.getEditionList();


      select.innerHTML = "";


      editions.forEach(function (edition) {

        const option =
          document.createElement("option");

        option.value =
          edition.id;

        option.textContent =
          edition.displayDate
            ? edition.name +
              " — " +
              edition.displayDate
            : edition.name;

        if (
          edition.id ===
          UI.state.editionId
        ) {
          option.selected = true;
        }

        select.appendChild(option);

      });


      if (this.elements.editionList) {

        this.elements.editionList.innerHTML = "";

        editions.forEach(function (edition) {

          const card =
            document.createElement("div");

          card.className =
            "epaper-edition-card";


          const cover =
            document.createElement("div");

          cover.className =
            "epaper-edition-cover";


          if (
            edition.cover &&
            edition.cover.image
          ) {

            const img =
              document.createElement("img");

            img.src =
              edition.cover.image;

            img.alt =
              edition.name || "ই-পেপার";

            img.loading =
              "lazy";

            cover.appendChild(img);

          }


          const body =
            document.createElement("div");

          body.className =
            "epaper-edition-card-body";


          const title =
            document.createElement("h3");

          title.className =
            "epaper-edition-card-title";

          title.textContent =
            edition.name;


          const date =
            document.createElement("p");

          date.className =
            "epaper-edition-card-date";

          date.textContent =
            edition.displayDate ||
            edition.date ||
            "";


          const button =
            document.createElement("button");

          button.type =
            "button";

          button.className =
            "epaper-btn primary";

          button.setAttribute(
            "data-epaper-edition",
            edition.id
          );

          button.textContent =
            "পত্রিকা দেখুন";


          body.appendChild(title);
          body.appendChild(date);
          body.appendChild(button);

          card.appendChild(cover);
          card.appendChild(body);

          UI.elements.editionList.appendChild(card);

        });

      }

    },


    /* =====================================================
       PAGE LIST
       ===================================================== */

    renderPageList: function () {

      const pages =
        DATA.getPages(
          this.state.editionId
        );


      if (this.elements.pageSelect) {

        this.elements.pageSelect.innerHTML = "";


        pages.forEach(function (page) {

          const option =
            document.createElement("option");

          option.value =
            page.pageNumber;

          option.textContent =
            "পৃষ্ঠা " +
            page.pageNumber +
            (
              page.title
                ? " — " + page.title
                : ""
            );


          if (
            Number(page.pageNumber) ===
            Number(UI.state.currentPage)
          ) {
            option.selected = true;
          }


          UI.elements.pageSelect.appendChild(
            option
          );

        });

      }


      if (this.elements.pageList) {

        this.elements.pageList.innerHTML = "";


        pages.forEach(function (page) {

          const button =
            document.createElement("button");

          button.type =
            "button";

          button.className =
            "epaper-thumbnail";

          if (
            Number(page.pageNumber) ===
            Number(UI.state.currentPage)
          ) {
            button.classList.add("active");
          }

          button.setAttribute(
            "data-epaper-page",
            page.pageNumber
          );


          if (page.thumbnail || page.image) {

            const img =
              document.createElement("img");

            img.src =
              page.thumbnail ||
              page.image;

            img.alt =
              "পৃষ্ঠা " +
              page.pageNumber;

            img.loading =
              "lazy";

            button.appendChild(img);

          }


          UI.elements.pageList.appendChild(
            button
          );

        });

      }

    },


    /* =====================================================
       PAGE NAVIGATION
       ===================================================== */

    goToPage: function (pageNumber) {

      const page =
        DATA.getPage(
          this.state.editionId,
          pageNumber
        );

      if (!page) {
        return;
      }


      this.state.currentPage =
        Number(page.pageNumber);


      this.renderPage();

      this.renderPageList();

      this.saveState();


      this.dispatch(
        "dc-epaper-page-change",
        {
          editionId:
            this.state.editionId,
          page:
            this.state.currentPage
        }
      );

    },


    previousPage: function () {

      const current =
        this.state.currentPage;

      if (current > 1) {

        this.goToPage(
          current - 1
        );

      }

    },


    nextPage: function () {

      const last =
        DATA.getLastPage(
          this.state.editionId
        );

      if (!last) {
        return;
      }


      if (
        this.state.currentPage <
        last.pageNumber
      ) {

        this.goToPage(
          this.state.currentPage + 1
        );

      }

    },


    /* =====================================================
       PAGE RENDER
       ===================================================== */

    renderPage: function () {

      const edition =
        DATA.getEdition(
          this.state.editionId
        );

      const page =
        DATA.getPage(
          this.state.editionId,
          this.state.currentPage
        );


      if (!edition || !page) {

        this.showError(
          "এই পৃষ্ঠাটি পাওয়া যায়নি।"
        );

        return;

      }


      if (this.elements.editionName) {

        this.elements.editionName.textContent =
          edition.name || "";

      }


      if (this.elements.editionDate) {

        this.elements.editionDate.textContent =
          edition.displayDate ||
          edition.date ||
          "";

      }


      if (this.elements.pageNumber) {

        const total =
          DATA.getPageCount(
            this.state.editionId
          );

        this.elements.pageNumber.textContent =
          "পৃষ্ঠা " +
          page.pageNumber +
          " / " +
          total;

      }


      if (this.elements.pageTitle) {

        this.elements.pageTitle.textContent =
          page.title ||
          "পৃষ্ঠা " + page.pageNumber;

      }


      if (!DATA.hasImage(page)) {

        this.showError(
          "এই পৃষ্ঠার ইমেজ এখনো যুক্ত করা হয়নি।"
        );

        return;

      }


      this.hideError();

      this.showLoading();


      const self =
        this;


      if (this.elements.pageImage) {

        const img =
          this.elements.pageImage;


        img.onload =
          function () {

            self.hideLoading();

            self.applyZoom();

          };


        img.onerror =
          function () {

            self.hideLoading();

            self.showError(
              "ই-পেপারের পৃষ্ঠা লোড করা যাচ্ছে না।"
            );

          };


        img.src =
          page.image;

        img.alt =
          page.title ||
          "দৈনিক চালচিত্র ই-পেপার — পৃষ্ঠা " +
          page.pageNumber;

      }


      this.applyZoom();

    },


    /* =====================================================
       LOADING / ERROR
       ===================================================== */

    showLoading: function () {

      if (this.elements.loading) {
        this.elements.loading.style.display =
          "flex";
      }

    },


    hideLoading: function () {

      if (this.elements.loading) {
        this.elements.loading.style.display =
          "none";
      }

    },


    showError: function (message) {

      this.hideLoading();


      if (!this.elements.error) {
        return;
      }


      this.elements.error.style.display =
        "block";


      const text =
        this.elements.error.querySelector(
          "[data-epaper-error-message]"
        );


      if (text) {
        text.textContent =
          message;
      } else {
        this.elements.error.textContent =
          message;
      }

    },


    hideError: function () {

      if (this.elements.error) {

        this.elements.error.style.display =
          "none";

      }

    },


    /* =====================================================
       ZOOM
       ===================================================== */

    zoomIn: function () {

      const step =
        Number(
          DATA.viewer.zoomStep
        ) || 25;

      const max =
        Number(
          DATA.viewer.maxZoom
        ) || 250;


      this.state.zoom =
        Math.min(
          max,
          this.state.zoom + step
        );


      this.applyZoom();

    },


    zoomOut: function () {

      const step =
        Number(
          DATA.viewer.zoomStep
        ) || 25;

      const min =
        Number(
          DATA.viewer.minZoom
        ) || 50;


      this.state.zoom =
        Math.max(
          min,
          this.state.zoom - step
        );


      this.applyZoom();

    },


    resetZoom: function () {

      this.state.zoom =
        Number(
          DATA.viewer.defaultZoom
        ) || 100;


      this.applyZoom();

    },


    applyZoom: function () {

      const img =
        this.elements.pageImage;

      if (!img) {
        return;
      }


      img.style.width =
        this.state.zoom + "%";

      img.style.maxWidth =
        "none";


      if (this.elements.zoomValue) {

        this.elements.zoomValue.textContent =
          this.state.zoom + "%";

      }

    },


    /* =====================================================
       FULLSCREEN
       ===================================================== */

    toggleFullscreen: function () {

      const viewer =
        this.elements.viewer;


      if (!viewer) {
        return;
      }


      if (
        document.fullscreenElement
      ) {

        document.exitFullscreen()
          .catch(function () {});

        return;

      }


      if (
        viewer.requestFullscreen
      ) {

        viewer.requestFullscreen()
          .catch(function () {

            viewer.classList.toggle(
              "fullscreen"
            );

            document.body.classList.toggle(
              "epaper-fullscreen"
            );

          });

      } else {

        viewer.classList.toggle(
          "fullscreen"
        );

        document.body.classList.toggle(
          "epaper-fullscreen"
        );

      }

    },


    /* =====================================================
       DOWNLOAD
       ===================================================== */

    downloadCurrentPage: function () {

      const page =
        DATA.getPage(
          this.state.editionId,
          this.state.currentPage
        );


      if (
        !page ||
        !page.image
      ) {

        this.showError(
          "ডাউনলোড করার মতো পৃষ্ঠা পাওয়া যায়নি।"
        );

        return;

      }


      const link =
        document.createElement("a");

      link.href =
        page.image;

      link.target =
        "_blank";

      link.rel =
        "noopener";

      link.download =
        "daily-chalchitra-page-" +
        page.pageNumber +
        ".jpg";


      document.body.appendChild(link);

      link.click();

      link.remove();

    },


    /* =====================================================
       UI UPDATE
       ===================================================== */

    updateUI: function () {

      this.renderPage();

      this.applyZoom();

    },


    /* =====================================================
       CUSTOM EVENT
       ===================================================== */

    dispatch: function (name, detail) {

      document.dispatchEvent(
        new CustomEvent(
          name,
          {
            detail: detail || {}
          }
        )
      );

    }

  };


  /* =======================================================
     GLOBAL API
     ======================================================= */

  window.DCEPaperUI = UI;
  window.DC_EPaperUI = UI;


  /* =======================================================
     AUTO INIT
     ======================================================= */

  function start() {

    if (!window.DC_EPaperData) {
      console.error(
        "DC_EPaperData is not available."
      );
      return;
    }

    UI.init();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start
    );

  } else {

    start();

  }


})(window, document);
