/* ==========================================================
   Daily Chalchitra ePaper
   epaper-init.js
   Version: 1.0

   কাজ:
   - ePaper সেকশনের সব JavaScript module-এর initialization
   - epaper-data.js / epaper-core.js / epaper-viewer.js
     একসঙ্গে সমন্বয় করা
   - DOM প্রস্তুত হওয়ার পর ePaper চালু করা
   - Dropdown, issue, viewer এবং page navigation-এর
     initialization trigger করা
   - আগের function থাকলে সেটিকে ব্যবহার করা
   - কোনো function না থাকলে error না দিয়ে graceful fallback
   ========================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     Global namespace
     ---------------------------------------------------------- */

  window.DailyChalchitraEPaper =
    window.DailyChalchitraEPaper || {};

  var DC = window.DailyChalchitraEPaper;


  /* ----------------------------------------------------------
     Configuration
     ---------------------------------------------------------- */

  DC.config = DC.config || {

    /* ePaper মূল পেজ */
    homePage: '/_epaper/epaper-home.html',

    /* Data file */
    dataFile: '/assets/js/epaper-data.js',

    /* Core module */
    coreFile: '/assets/js/epaper-core.js',

    /* Viewer module */
    viewerFile: '/assets/js/epaper-viewer.js',

    /* CSS */
    cssFile: '/assets/css/epaper.css',

    /* Debug mode */
    debug: false

  };


  /* ----------------------------------------------------------
     Debug helper
     ---------------------------------------------------------- */

  DC.log = function () {

    if (!DC.config.debug) {
      return;
    }

    if (window.console && console.log) {
      console.log.apply(console, arguments);
    }

  };


  /* ----------------------------------------------------------
     Error helper
     ---------------------------------------------------------- */

  DC.error = function () {

    if (window.console && console.error) {
      console.error.apply(console, arguments);
    }

  };


  /* ----------------------------------------------------------
     CSS loader
     ---------------------------------------------------------- */

  DC.loadCSS = function () {

    var href = DC.config.cssFile;

    if (!href) {
      return;
    }

    var existing = document.querySelector(
      'link[data-dc-epaper-css="true"]'
    );

    if (existing) {
      return;
    }

    var links = document.querySelectorAll(
      'link[rel="stylesheet"]'
    );

    for (var i = 0; i < links.length; i++) {

      if (
        links[i].href &&
        links[i].href.indexOf('epaper.css') !== -1
      ) {
        return;
      }

    }

    var link = document.createElement('link');

    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    link.setAttribute(
      'data-dc-epaper-css',
      'true'
    );

    document.head.appendChild(link);

    DC.log(
      'Daily Chalchitra ePaper CSS loaded:',
      href
    );

  };


  /* ----------------------------------------------------------
     Generic function caller
     ---------------------------------------------------------- */

  DC.callIfExists = function (names, args) {

    if (!Array.isArray(names)) {
      names = [names];
    }

    args = args || [];

    for (var i = 0; i < names.length; i++) {

      var name = names[i];

      try {

        if (
          typeof window[name] === 'function'
        ) {

          DC.log(
            'Calling ePaper function:',
            name
          );

          return window[name].apply(
            window,
            args
          );

        }

      } catch (error) {

        DC.error(
          'ePaper function error:',
          name,
          error
        );

      }

    }

    return null;

  };


  /* ----------------------------------------------------------
     Detect ePaper page
     ---------------------------------------------------------- */

  DC.isEPaperPage = function () {

    var path =
      window.location.pathname || '';

    var body =
      document.body;

    if (
      path.indexOf('/_epaper/') === 0
    ) {
      return true;
    }

    if (
      document.getElementById(
        'dc-epaper-page'
      )
    ) {
      return true;
    }

    if (
      document.getElementById(
        'dc-issues'
      )
    ) {
      return true;
    }

    if (
      document.getElementById(
        'dc-archive-list'
      )
    ) {
      return true;
    }

    if (
      body &&
      body.classList &&
      body.classList.contains(
        'dc-epaper-page'
      )
    ) {
      return true;
    }

    return false;

  };


  /* ----------------------------------------------------------
     Prepare page
     ---------------------------------------------------------- */

  DC.preparePage = function () {

    if (!document.body) {
      return;
    }

    document.body.classList.add(
      'dc-epaper-ready'
    );

    DC.log(
      'Daily Chalchitra ePaper page prepared.'
    );

  };


  /* ----------------------------------------------------------
     Initialize data
     ---------------------------------------------------------- */

  DC.initData = function () {

    /*
      epaper-data.js সাধারণত global data অথবা
      data-related function তৈরি করবে।

      এখানে বিভিন্ন সম্ভাব্য function name
      support করা হয়েছে।
    */

    var result = DC.callIfExists(
      [
        'dcInitEpaperData',
        'initEpaperData',
        'dcLoadEpaperData',
        'loadEpaperData'
      ]
    );

    return result;

  };


  /* ----------------------------------------------------------
     Initialize core
     ---------------------------------------------------------- */

  DC.initCore = function () {

    var result = DC.callIfExists(
      [
        'dcInitEpaper',
        'initEpaper',
        'dcEpaperInit',
        'initializeEpaper'
      ]
    );

    return result;

  };


  /* ----------------------------------------------------------
     Initialize issue/archive section
     ---------------------------------------------------------- */

  DC.initIssues = function () {

    var result = DC.callIfExists(
      [
        'dcRenderIssues',
        'renderEpaperIssues',
        'dcLoadIssues',
        'loadEpaperIssues',
        'dcInitIssues',
        'initEpaperIssues'
      ]
    );

    return result;

  };


  /* ----------------------------------------------------------
     Initialize viewer
     ---------------------------------------------------------- */

  DC.initViewer = function () {

    var result = DC.callIfExists(
      [
        'dcInitViewer',
        'initEpaperViewer',
        'dcEpaperViewerInit',
        'initializeEpaperViewer'
      ]
    );

    return result;

  };


  /* ----------------------------------------------------------
     Initialize dropdowns
     ---------------------------------------------------------- */

  DC.initDropdowns = function () {

    var dropdowns =
      document.querySelectorAll(
        '.dc-dropdown'
      );

    if (!dropdowns.length) {
      return;
    }

    dropdowns.forEach(function (dropdown) {

      var button =
        dropdown.querySelector(
          '.dc-dropdown-btn'
        );

      if (!button) {
        return;
      }

      /*
        Duplicate listener prevent করার জন্য
        data attribute ব্যবহার করা হচ্ছে।
      */

      if (
        button.getAttribute(
          'data-dc-dropdown-ready'
        ) === 'true'
      ) {
        return;
      }

      button.setAttribute(
        'data-dc-dropdown-ready',
        'true'
      );

      button.addEventListener(
        'click',
        function (event) {

          event.preventDefault();
          event.stopPropagation();

          /*
            অন্য dropdown বন্ধ করা
          */

          document
            .querySelectorAll(
              '.dc-dropdown.open'
            )
            .forEach(function (other) {

              if (other !== dropdown) {
                other.classList.remove(
                  'open'
                );
              }

            });

          dropdown.classList.toggle(
            'open'
          );

        }
      );

    });


    /*
      Dropdown-এর বাইরে click করলে
      menu বন্ধ হবে।
    */

    if (
      !document.body.getAttribute(
        'data-dc-dropdown-document-ready'
      )
    ) {

      document.body.setAttribute(
        'data-dc-dropdown-document-ready',
        'true'
      );

      document.addEventListener(
        'click',
        function () {

          document
            .querySelectorAll(
              '.dc-dropdown.open'
            )
            .forEach(function (dropdown) {

              dropdown.classList.remove(
                'open'
              );

            });

        }
      );

    }

  };


  /* ----------------------------------------------------------
     Close dropdown after selection
     ---------------------------------------------------------- */

  DC.initDropdownItems = function () {

    var items =
      document.querySelectorAll(
        '.dc-dd-item'
      );

    if (!items.length) {
      return;
    }

    items.forEach(function (item) {

      if (
        item.getAttribute(
          'data-dc-dd-item-ready'
        ) === 'true'
      ) {
        return;
      }

      item.setAttribute(
        'data-dc-dd-item-ready',
        'true'
      );

      item.addEventListener(
        'click',
        function () {

          var parent =
            item.closest(
              '.dc-dropdown'
            );

          if (parent) {
            parent.classList.remove(
              'open'
            );
          }

        }
      );

    });

  };


  /* ----------------------------------------------------------
     Escape key
     ---------------------------------------------------------- */

  DC.initEscapeHandler = function () {

    if (
      document.body.getAttribute(
        'data-dc-epaper-escape-ready'
      )
    ) {
      return;
    }

    document.body.setAttribute(
      'data-dc-epaper-escape-ready',
      'true'
    );

    document.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key === 'Escape' ||
          event.keyCode === 27
        ) {

          document
            .querySelectorAll(
              '.dc-dropdown.open'
            )
            .forEach(function (dropdown) {

              dropdown.classList.remove(
                'open'
              );

            });

        }

      }
    );

  };


  /* ----------------------------------------------------------
     Prevent accidental horizontal overflow
     ---------------------------------------------------------- */

  DC.fixOverflow = function () {

    var page =
      document.getElementById(
        'dc-epaper-page'
      );

    if (!page) {
      return;
    }

    page.style.boxSizing =
      'border-box';

  };


  /* ----------------------------------------------------------
     Viewer page resize event
     ---------------------------------------------------------- */

  DC.initResizeHandler = function () {

    if (
      window.__dcEpaperResizeReady
    ) {
      return;
    }

    window.__dcEpaperResizeReady =
      true;

    var timer = null;

    window.addEventListener(
      'resize',
      function () {

        clearTimeout(timer);

        timer = setTimeout(
          function () {

            /*
              Viewer-এর নিজস্ব resize function
              থাকলে সেটি চালানো হবে।
            */

            DC.callIfExists(
              [
                'dcViewerResize',
                'resizeEpaperViewer',
                'dcResizeViewer'
              ]
            );

          },
          150
        );

      }
    );

  };


  /* ----------------------------------------------------------
     Main initialization
     ---------------------------------------------------------- */

  DC.init = function () {

    if (
      DC._initialized
    ) {
      DC.log(
        'ePaper already initialized.'
      );

      return;
    }

    DC._initialized = true;

    DC.log(
      'Initializing Daily Chalchitra ePaper...'
    );


    /*
      CSS
    */

    DC.loadCSS();


    /*
      Basic page preparation
    */

    DC.preparePage();


    /*
      Data
    */

    DC.initData();


    /*
      Core
    */

    DC.initCore();


    /*
      Issue/archive
    */

    DC.initIssues();


    /*
      Viewer
    */

    DC.initViewer();


    /*
      Dropdown
    */

    DC.initDropdowns();

    DC.initDropdownItems();


    /*
      Keyboard
    */

    DC.initEscapeHandler();


    /*
      Responsive
    */

    DC.initResizeHandler();


    /*
      Overflow
    */

    DC.fixOverflow();


    /*
      Custom event
    */

    document.dispatchEvent(
      new CustomEvent(
        'dc-epaper-ready',
        {
          detail: {
            namespace: DC
          }
        }
      )
    );


    DC.log(
      'Daily Chalchitra ePaper initialized successfully.'
    );

  };


  /* ----------------------------------------------------------
     DOM Ready
     ---------------------------------------------------------- */

  function start() {

    if (
      document.readyState ===
      'loading'
    ) {

      document.addEventListener(
        'DOMContentLoaded',
        function () {
          DC.init();
        },
        {
          once: true
        }
      );

    } else {

      DC.init();

    }

  }


  /* ----------------------------------------------------------
     Public API
     ---------------------------------------------------------- */

  window.DailyChalchitraEPaper =
    DC;


  /*
    Start
  */

  start();


})();
