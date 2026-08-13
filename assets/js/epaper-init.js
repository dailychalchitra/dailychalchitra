/* ==========================================================
   Daily Chalchitra ePaper
   epaper-init.js
   Version: 2.0

   কাজ:
   - সব ePaper module সমন্বয়
   - Core data load
   - Viewer initialization
   - URL issue নির্বাচন
   - প্রথম page প্রদর্শন
   - Page navigation controls
   - Dropdown
   - Keyboard
   - Responsive handling
   ========================================================== */

(function () {

    'use strict';


    /* ======================================================
       Global Namespace
       ====================================================== */

    window.DailyChalchitraEPaper =
        window.DailyChalchitraEPaper || {};


    var DC =
        window.DailyChalchitraEPaper;


    /* ======================================================
       Configuration
       ====================================================== */

    DC.config =
        DC.config || {};


    DC.config = Object.assign(

        {

            homePage:
                '/_epaper/epaper-home.html',

            dataFile:
                '/assets/epaper/issues/issues.json',

            cssFile:
                '/assets/css/epaper.css',

            debug:
                false

        },

        DC.config

    );


    /* ======================================================
       Debug
       ====================================================== */

    DC.log =
        function () {

            if (
                !DC.config.debug
            ) {

                return;

            }


            if (
                window.console &&
                console.log
            ) {

                console.log.apply(
                    console,
                    arguments
                );

            }

        };


    DC.error =
        function () {

            if (
                window.console &&
                console.error
            ) {

                console.error.apply(
                    console,
                    arguments
                );

            }

        };


    /* ======================================================
       CSS Loader
       ====================================================== */

    DC.loadCSS =
        function () {

            var href =
                DC.config.cssFile;


            if (
                !href
            ) {

                return;

            }


            var existing =
                document.querySelector(
                    'link[data-dc-epaper-css="true"]'
                );


            if (
                existing
            ) {

                return;

            }


            var links =
                document.querySelectorAll(
                    'link[rel="stylesheet"]'
                );


            for (
                var i = 0;
                i < links.length;
                i++
            ) {

                if (
                    links[i].href &&
                    links[i].href.indexOf(
                        'epaper.css'
                    ) !== -1
                ) {

                    return;

                }

            }


            var link =
                document.createElement(
                    'link'
                );


            link.rel =
                'stylesheet';


            link.type =
                'text/css';


            link.href =
                href;


            link.setAttribute(
                'data-dc-epaper-css',
                'true'
            );


            document.head.appendChild(
                link
            );

        };


    /* ======================================================
       Prepare Page
       ====================================================== */

    DC.preparePage =
        function () {

            if (
                !document.body
            ) {

                return;

            }


            document.body.classList.add(
                'dc-epaper-ready'
            );

        };


    /* ======================================================
       Detect ePaper Page
       ====================================================== */

    DC.isEPaperPage =
        function () {

            var path =
                window.location.pathname ||
                '';


            var body =
                document.body;


            if (
                path.indexOf(
                    '/_epaper/'
                ) === 0
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


    /* ======================================================
       Initialize Core
       ====================================================== */

    DC.initCore =
        function () {

            if (
                !window.DailyChalchitraEPaper ||
                typeof
                window.DailyChalchitraEPaper.init !==
                'function'
            ) {

                return Promise.reject(
                    new Error(
                        'E-Paper Core পাওয়া যায়নি।'
                    )
                );

            }


            return window.DailyChalchitraEPaper
                .init(
                    {
                        dataUrl:
                            DC.config.dataFile
                    }
                );

        };


    /* ======================================================
       Initialize Viewer
       ====================================================== */

    DC.initViewer =
        function () {

            if (
                !window.DailyChalchitraEPaperViewer
            ) {

                DC.error(
                    'E-Paper Viewer পাওয়া যায়নি।'
                );

                return false;

            }


            if (
                typeof
                window.DailyChalchitraEPaperViewer.init !==
                'function'
            ) {

                DC.error(
                    'E-Paper Viewer init function পাওয়া যায়নি।'
                );

                return false;

            }


            window.DailyChalchitraEPaperViewer.init();


            return true;

        };


    /* ======================================================
       Initialize Issue Controls
       ====================================================== */

    DC.initIssues =
        function () {

            var core =
                window.DailyChalchitraEPaper;


            if (
                !core
            ) {

                return;

            }


            /*
             * Issue selector
             */

            var selectors =
                document.querySelectorAll(
                    '[data-epaper-issue]'
                );


            selectors.forEach(
                function (
                    element
                ) {

                    if (
                        element.getAttribute(
                            'data-dc-issue-ready'
                        ) === 'true'
                    ) {

                        return;

                    }


                    element.setAttribute(
                        'data-dc-issue-ready',
                        'true'
                    );


                    element.addEventListener(
                        'click',
                        function (
                            event
                        ) {

                            event.preventDefault();


                            var issue =
                                element.getAttribute(
                                    'data-epaper-issue'
                                );


                            if (
                                issue
                            ) {

                                core.selectIssue(
                                    issue
                                );

                            }

                        }
                    );

                }
            );

        };


    /* ======================================================
       Initialize Navigation Buttons
       ====================================================== */

    DC.initNavigation =
        function () {

            var core =
                window.DailyChalchitraEPaper;


            if (
                !core
            ) {

                return;

            }


            /*
             * Next
             */

            document
                .querySelectorAll(
                    '[data-epaper-next]'
                )
                .forEach(
                    function (
                        button
                    ) {

                        if (
                            button.getAttribute(
                                'data-dc-nav-ready'
                            ) === 'true'
                        ) {

                            return;

                        }


                        button.setAttribute(
                            'data-dc-nav-ready',
                            'true'
                        );


                        button.addEventListener(
                            'click',
                            function (
                                event
                            ) {

                                event.preventDefault();

                                core.nextPage();

                            }
                        );

                    }
                );


            /*
             * Previous
             */

            document
                .querySelectorAll(
                    '[data-epaper-prev]'
                )
                .forEach(
                    function (
                        button
                    ) {

                        if (
                            button.getAttribute(
                                'data-dc-nav-ready'
                            ) === 'true'
                        ) {

                            return;

                        }


                        button.setAttribute(
                            'data-dc-nav-ready',
                            'true'
                        );


                        button.addEventListener(
                            'click',
                            function (
                                event
                            ) {

                                event.preventDefault();

                                core.previousPage();

                            }
                        );

                    }
                );


            /*
             * First
             */

            document
                .querySelectorAll(
                    '[data-epaper-first]'
                )
                .forEach(
                    function (
                        button
                    ) {

                        if (
                            button.getAttribute(
                                'data-dc-nav-ready'
                            ) === 'true'
                        ) {

                            return;

                        }


                        button.setAttribute(
                            'data-dc-nav-ready',
                            'true'
                        );


                        button.addEventListener(
                            'click',
                            function (
                                event
                            ) {

                                event.preventDefault();

                                core.firstPage();

                            }
                        );

                    }
                );


            /*
             * Last
             */

            document
                .querySelectorAll(
                    '[data-epaper-last]'
                )
                .forEach(
                    function (
                        button
                    ) {

                        if (
                            button.getAttribute(
                                'data-dc-nav-ready'
                            ) === 'true'
                        ) {

                            return;

                        }


                        button.setAttribute(
                            'data-dc-nav-ready',
                            'true'
                        );


                        button.addEventListener(
                            'click',
                            function (
                                event
                            ) {

                                event.preventDefault();

                                core.lastPage();

                            }
                        );

                    }
                );

        };


    /* ======================================================
       Initialize Zoom Controls
       ====================================================== */

    DC.initZoomControls =
        function () {

            var viewer =
                window.DailyChalchitraEPaperViewer;


            if (
                !viewer
            ) {

                return;

            }


            document
                .querySelectorAll(
                    '[data-epaper-zoom-in]'
                )
                .forEach(
                    function (
                        button
                    ) {

                        if (
                            button.getAttribute(
                                'data-dc-zoom-ready'
                            ) === 'true'
                        ) {

                            return;

                        }


                        button.setAttribute(
                            'data-dc-zoom-ready',
                            'true'
                        );


                        button.addEventListener(
                            'click',
                            function (
                                event
                            ) {

                                event.preventDefault();

                                viewer.zoomIn();

                            }
                        );

                    }
                );


            document
                .querySelectorAll(
                    '[data-epaper-zoom-out]'
                )
                .forEach(
                    function (
                        button
                    ) {

                        if (
                            button.getAttribute(
                                'data-dc-zoom-ready'
                            ) === 'true'
                        ) {

                            return;

                        }


                        button.setAttribute(
                            'data-dc-zoom-ready',
                            'true'
                        );


                        button.addEventListener(
                            'click',
                            function (
                                event
                            ) {

                                event.preventDefault();

                                viewer.zoomOut();

                            }
                        );

                    }
                );


            document
                .querySelectorAll(
                    '[data-epaper-fit]'
                )
                .forEach(
                    function (
                        button
                    ) {

                        if (
                            button.getAttribute(
                                'data-dc-zoom-ready'
                            ) === 'true'
                        ) {

                            return;

                        }


                        button.setAttribute(
                            'data-dc-zoom-ready',
                            'true'
                        );


                        button.addEventListener(
                            'click',
                            function (
                                event
                            ) {

                                event.preventDefault();

                                viewer.fitToScreen();

                            }
                        );

                    }
                );


            document
                .querySelectorAll(
                    '[data-epaper-fullscreen]'
                )
                .forEach(
                    function (
                        button
                    ) {

                        if (
                            button.getAttribute(
                                'data-dc-fullscreen-ready'
                            ) === 'true'
                        ) {

                            return;

                        }


                        button.setAttribute(
                            'data-dc-fullscreen-ready',
                            'true'
                        );


                        button.addEventListener(
                            'click',
                            function (
                                event
                            ) {

                                event.preventDefault();

                                viewer.toggleFullscreen();

                            }
                        );

                    }
                );

        };


    /* ======================================================
       Dropdown
       ====================================================== */

    DC.initDropdowns =
        function () {

            var dropdowns =
                document.querySelectorAll(
                    '.dc-dropdown'
                );


            if (
                !dropdowns.length
            ) {

                return;

            }


            dropdowns.forEach(
                function (
                    dropdown
                ) {

                    var button =
                        dropdown.querySelector(
                            '.dc-dropdown-btn'
                        );


                    if (
                        !button
                    ) {

                        return;

                    }


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
                        function (
                            event
                        ) {

                            event.preventDefault();

                            event.stopPropagation();


                            document
                                .querySelectorAll(
                                    '.dc-dropdown.open'
                                )
                                .forEach(
                                    function (
                                        other
                                    ) {

                                        if (
                                            other !==
                                            dropdown
                                        ) {

                                            other.classList.remove(
                                                'open'
                                            );

                                        }

                                    }
                                );


                            dropdown.classList.toggle(
                                'open'
                            );

                        }
                    );

                }
            );


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
                            .forEach(
                                function (
                                    dropdown
                                ) {

                                    dropdown.classList.remove(
                                        'open'
                                    );

                                }
                            );

                    }
                );

            }

        };


    /* ======================================================
       Dropdown Items
       ====================================================== */

    DC.initDropdownItems =
        function () {

            document
                .querySelectorAll(
                    '.dc-dd-item'
                )
                .forEach(
                    function (
                        item
                    ) {

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


                                if (
                                    parent
                                ) {

                                    parent.classList.remove(
                                        'open'
                                    );

                                }

                            }
                        );

                    }
                );

        };


    /* ======================================================
       Escape Handler
       ====================================================== */

    DC.initEscapeHandler =
        function () {

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
                function (
                    event
                ) {

                    if (
                        event.key === 'Escape' ||
                        event.keyCode === 27
                    ) {

                        document
                            .querySelectorAll(
                                '.dc-dropdown.open'
                            )
                            .forEach(
                                function (
                                    dropdown
                                ) {

                                    dropdown.classList.remove(
                                        'open'
                                    );

                                }
                            );

                    }

                }
            );

        };


    /* ======================================================
       Page Status UI
       ====================================================== */

    DC.initPageStatus =
        function () {

            document.addEventListener(
                'dc:epaper-page-change',
                function (
                    event
                ) {

                    if (
                        !event.detail
                    ) {

                        return;

                    }


                    var current =
                        Number(
                            event.detail.pageNumber
                        ) || 1;


                    var total =
                        Number(
                            event.detail.totalPages
                        ) || 0;


                    document
                        .querySelectorAll(
                            '[data-epaper-page-indicator]'
                        )
                        .forEach(
                            function (
                                element
                            ) {

                                element.textContent =
                                    'পৃষ্ঠা ' +
                                    current +
                                    ' / ' +
                                    total;

                            }
                        );


                }
            );

        };


    /* ======================================================
       Overflow
       ====================================================== */

    DC.fixOverflow =
        function () {

            var page =
                document.getElementById(
                    'dc-epaper-page'
                );


            if (
                !page
            ) {

                return;

            }


            page.style.boxSizing =
                'border-box';

        };


    /* ======================================================
       Resize
       ====================================================== */

    DC.initResizeHandler =
        function () {

            if (
                window.__dcEpaperResizeReady
            ) {

                return;

            }


            window.__dcEpaperResizeReady =
                true;


            var timer =
                null;


            window.addEventListener(
                'resize',
                function () {

                    clearTimeout(
                        timer
                    );


                    timer =
                        setTimeout(
                            function () {

                                var viewer =
                                    window.DailyChalchitraEPaperViewer;


                                if (
                                    viewer &&
                                    typeof viewer.fitToScreen ===
                                    'function'
                                ) {

                                    if (
                                        viewer.state.scale <=
                                        1.01
                                    ) {

                                        viewer.fitToScreen();

                                    }

                                }

                            },
                            150
                        );

                }
            );

        };


    /* ======================================================
       Start Reader
       ====================================================== */

    DC.startReader =
        function () {

            var core =
                window.DailyChalchitraEPaper;


            if (
                !core
            ) {

                return false;

            }


            /*
             * URL:
             *
             * /epaper/viewer/?issue=2026-W32
             *
             */

            if (
                core.selectIssueFromUrl()
            ) {

                return true;

            }


            /*
             * Restore last position.
             */

            return core.restoreLastPosition();

        };


    /* ======================================================
       Main Initialization
       ====================================================== */

    DC.init =
        async function () {

            if (
                DC._initialized
            ) {

                return DC._initPromise;

            }


            DC._initialized =
                true;


            DC._initPromise =
                (async function () {

                    try {

                        DC.loadCSS();

                        DC.preparePage();


                        /*
                         * Core first.
                         */

                        await DC.initCore();


                        /*
                         * Viewer second.
                         *
                         * Important:
                         * Core-এর page event miss না করার
                         * জন্য Viewer data selection-এর
                         * আগে initialize হচ্ছে।
                         */

                        DC.initViewer();


                        /*
                         * UI controls
                         */

                        DC.initIssues();

                        DC.initNavigation();

                        DC.initZoomControls();

                        DC.initDropdowns();

                        DC.initDropdownItems();

                        DC.initEscapeHandler();

                        DC.initPageStatus();

                        DC.initResizeHandler();

                        DC.fixOverflow();


                        /*
                         * Now select issue/page.
                         */

                        DC.startReader();


                        /*
                         * Final ready event.
                         */

                        document.dispatchEvent(
                            new CustomEvent(
                                'dc-epaper-ready',
                                {
                                    detail: {
                                        namespace:
                                            DC,

                                        core:
                                            window.DailyChalchitraEPaper,

                                        viewer:
                                            window.DailyChalchitraEPaperViewer
                                    }
                                }
                            )
                        );


                        DC.log(
                            'Daily Chalchitra ePaper initialized successfully.'
                        );


                        return true;


                    } catch (error) {

                        DC.error(
                            'Daily Chalchitra ePaper initialization failed:',
                            error
                        );


                        document.dispatchEvent(
                            new CustomEvent(
                                'dc:epaper-error',
                                {
                                    detail: {
                                        error:
                                            error
                                    }
                                }
                            )
                        );


                        return false;

                    }

                })();


            return DC._initPromise;

        };


    /* ======================================================
       Public Namespace
       ====================================================== */

    window.DailyChalchitraEPaper =
        DC;


    /* ======================================================
       Start
       ====================================================== */

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
                    once:
                        true
                }
            );

        } else {

            DC.init();

        }

    }


    start();


})();
