/* =========================================================
   DAILY CHALCHITRA — E-PAPER DATA
   Edition / Page configuration
   ========================================================= */

(function (window) {
  "use strict";

  /*
   * =======================================================
   * E-PAPER CONFIGURATION
   * =======================================================
   *
   * নতুন দিনের ই-পেপার যুক্ত করার সময় মূলত এই ডেটা অংশেই
   * প্রয়োজনীয় তথ্য যোগ করা যাবে।
   *
   * image / thumbnail URL আপনার প্রকৃত e-paper image URL
   * দিয়ে পরিবর্তন করবেন।
   */

  const DC_EPaperData = {

    site: {
      name: "দৈনিক চালচিত্র",
      shortName: "দৈনিক চালচিত্র",
      title: "দৈনিক চালচিত্র ই-পেপার",
      homeUrl: "/",
      epaperUrl: "/epaper/"
    },

    viewer: {
      startPage: 1,
      defaultZoom: 100,
      minZoom: 50,
      maxZoom: 250,
      zoomStep: 25
    },

    /*
     * =====================================================
     * EDITIONS
     * =====================================================
     */

    editions: [

      /*
       * ---------------------------------------------------
       * SAMPLE / CURRENT EDITION
       * ---------------------------------------------------
       *
       * এখানে আপনার প্রকৃত ই-পেপারের তথ্য বসবে।
       * structure পরিবর্তন করবেন না।
       */

      {
        id: "current",
        name: "আজকের ই-পেপার",
        shortName: "আজকের সংখ্যা",
        date: "",
        displayDate: "",
        description: "দৈনিক চালচিত্রের আজকের মুদ্রিত সংস্করণের ডিজিটাল ই-পেপার।",

        cover: {
          image: "",
          thumbnail: ""
        },

        pages: [

          {
            id: "page-1",
            pageNumber: 1,
            title: "প্রচ্ছদ",
            image: "",
            thumbnail: "",
            width: 0,
            height: 0
          },

          {
            id: "page-2",
            pageNumber: 2,
            title: "পৃষ্ঠা ২",
            image: "",
            thumbnail: "",
            width: 0,
            height: 0
          },

          {
            id: "page-3",
            pageNumber: 3,
            title: "পৃষ্ঠা ৩",
            image: "",
            thumbnail: "",
            width: 0,
            height: 0
          },

          {
            id: "page-4",
            pageNumber: 4,
            title: "পৃষ্ঠা ৪",
            image: "",
            thumbnail: "",
            width: 0,
            height: 0
          },

          {
            id: "page-5",
            pageNumber: 5,
            title: "পৃষ্ঠা ৫",
            image: "",
            thumbnail: "",
            width: 0,
            height: 0
          },

          {
            id: "page-6",
            pageNumber: 6,
            title: "পৃষ্ঠা ৬",
            image: "",
            thumbnail: "",
            width: 0,
            height: 0
          },

          {
            id: "page-7",
            pageNumber: 7,
            title: "পৃষ্ঠা ৭",
            image: "",
            thumbnail: "",
            width: 0,
            height: 0
          },

          {
            id: "page-8",
            pageNumber: 8,
            title: "পৃষ্ঠা ৮",
            image: "",
            thumbnail: "",
            width: 0,
            height: 0
          },

          {
            id: "page-9",
            pageNumber: 9,
            title: "পৃষ্ঠা ৯",
            image: "",
            thumbnail: "",
            width: 0,
            height: 0
          },

          {
            id: "page-10",
            pageNumber: 10,
            title: "পৃষ্ঠা ১০",
            image: "",
            thumbnail: "",
            width: 0,
            height: 0
          },

          {
            id: "page-11",
            pageNumber: 11,
            title: "পৃষ্ঠা ১১",
            image: "",
            thumbnail: "",
            width: 0,
            height: 0
          },

          {
            id: "page-12",
            pageNumber: 12,
            title: "পৃষ্ঠা ১২",
            image: "",
            thumbnail: "",
            width: 0,
            height: 0
          }

        ]
      }

    ]

  };


  /* =======================================================
     HELPER FUNCTIONS
     ======================================================= */

  DC_EPaperData.getEdition = function (editionId) {

    if (!editionId) {
      return this.editions.length
        ? this.editions[0]
        : null;
    }

    return this.editions.find(function (edition) {
      return edition.id === editionId;
    }) || null;
  };


  DC_EPaperData.getPage = function (editionId, pageNumber) {

    const edition = this.getEdition(editionId);

    if (!edition || !edition.pages) {
      return null;
    }

    return edition.pages.find(function (page) {
      return Number(page.pageNumber) === Number(pageNumber);
    }) || null;
  };


  DC_EPaperData.getPages = function (editionId) {

    const edition = this.getEdition(editionId);

    if (!edition || !Array.isArray(edition.pages)) {
      return [];
    }

    return edition.pages;
  };


  DC_EPaperData.getFirstPage = function (editionId) {

    const pages = this.getPages(editionId);

    return pages.length ? pages[0] : null;
  };


  DC_EPaperData.getLastPage = function (editionId) {

    const pages = this.getPages(editionId);

    return pages.length
      ? pages[pages.length - 1]
      : null;
  };


  DC_EPaperData.getPageCount = function (editionId) {

    const pages = this.getPages(editionId);

    return pages.length;
  };


  DC_EPaperData.hasImage = function (page) {

    return !!(
      page &&
      typeof page.image === "string" &&
      page.image.trim() !== ""
    );
  };


  DC_EPaperData.getEditionList = function () {

    return this.editions.map(function (edition) {

      return {
        id: edition.id,
        name: edition.name,
        shortName: edition.shortName,
        date: edition.date,
        displayDate: edition.displayDate,
        cover: edition.cover
      };

    });

  };


  /* =======================================================
     DATE HELPER
     ======================================================= */

  DC_EPaperData.formatDate = function (dateValue) {

    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  };


  /* =======================================================
     PUBLIC API
     ======================================================= */

  window.DC_EPaperData = DC_EPaperData;


  /*
   * Backward-compatible short name
   */
  window.DCEPaperData = DC_EPaperData;


})(window);
