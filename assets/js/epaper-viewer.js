/*
 * দৈনিক চালচিত্র
 * E-Paper Viewer Engine
 *
 * Version: 2.0
 *
 * কাজ:
 * - পৃষ্ঠা প্রদর্শন
 * - Zoom In / Zoom Out
 * - Fit to Screen
 * - Previous / Next Page
 * - Fullscreen
 * - Mouse / Touch Drag
 * - Double Click Zoom
 * - Keyboard Navigation
 * - বর্তমান পৃষ্ঠা সংরক্ষণ
 * - Core module-এর সঙ্গে সরাসরি সমন্বয়
 */

(function (window, document) {

    'use strict';


    const Viewer = {


        /* ==================================================
           State
           ================================================== */

        state: {

            scale:
                1,

            minScale:
                0.5,

            maxScale:
                4,

            step:
                0.25,

            offsetX:
                0,

            offsetY:
                0,

            dragging:
                false,

            startX:
                0,

            startY:
                0,

            startOffsetX:
                0,

            startOffsetY:
                0,

            image:
                null,

            viewport:
                null,

            canvas:
                null,

            context:
                null,

            currentPage:
                null,

            currentPageNumber:
                1,

            totalPages:
                0

        },


        /* ==================================================
           Elements
           ================================================== */

        elements:
            {},


        /* ==================================================
           Configuration
           ================================================== */

        config: {

            imageSelector:
                '#dc-epaper-image',

            viewportSelector:
                '#dc-epaper-viewport',

            canvasSelector:
                '#dc-epaper-canvas'

        },


        /* ==================================================
           Initialization
           ================================================== */

        init: function (
            options
        ) {

            options =
                options || {};


            this.config =
                Object.assign(
                    {},
                    this.config,
                    options
                );


            this.cacheElements();

            this.bindEvents();


            /*
             * If image is already loaded
             */

            if (
                this.elements.image &&
                this.elements.image.complete &&
                this.elements.image.naturalWidth
            ) {

                this.fitToScreen();

            }


            return this;

        },


        /* ==================================================
           Cache DOM Elements
           ================================================== */

        cacheElements: function () {

            this.elements.image =
                document.querySelector(
                    this.config.imageSelector
                );


            this.elements.viewport =
                document.querySelector(
                    this.config.viewportSelector
                );


            this.elements.canvas =
                document.querySelector(
                    this.config.canvasSelector
                );


            if (
                this.elements.canvas
            ) {

                this.state.canvas =
                    this.elements.canvas;


                this.state.context =
                    this.elements.canvas.getContext(
                        '2d'
                    );

            }


            this.state.image =
                this.elements.image;


            this.state.viewport =
                this.elements.viewport;

        },


        /* ==================================================
           Event Binding
           ================================================== */

        bindEvents: function () {

            const self =
                this;


            if (
                this.elements.image
            ) {

                this.elements.image.addEventListener(
                    'load',
                    function () {

                        self.resetPosition();

                        self.fitToScreen();

                    }
                );

            }


            if (
                this.elements.viewport
            ) {

                this.elements.viewport.addEventListener(
                    'mousedown',
                    function (
                        event
                    ) {

                        self.startDrag(
                            event
                        );

                    }
                );


                this.elements.viewport.addEventListener(
                    'mousemove',
                    function (
                        event
                    ) {

                        self.drag(
                            event
                        );

                    }
                );


                this.elements.viewport.addEventListener(
                    'mouseup',
                    function () {

                        self.endDrag();

                    }
                );


                this.elements.viewport.addEventListener(
                    'mouseleave',
                    function () {

                        self.endDrag();

                    }
                );


                this.elements.viewport.addEventListener(
                    'wheel',
                    function (
                        event
                    ) {

                        event.preventDefault();


                        if (
                            event.deltaY < 0
                        ) {

                            self.zoomIn();

                        } else {

                            self.zoomOut();

                        }

                    },
                    {
                        passive:
                            false
                    }
                );


                this.elements.viewport.addEventListener(
                    'dblclick',
                    function () {

                        self.toggleDoubleClickZoom();

                    }
                );


                this.elements.viewport.addEventListener(
                    'touchstart',
                    function (
                        event
                    ) {

                        self.touchStart(
                            event
                        );

                    },
                    {
                        passive:
                            false
                    }
                );


                this.elements.viewport.addEventListener(
                    'touchmove',
                    function (
                        event
                    ) {

                        self.touchMove(
                            event
                        );

                    },
                    {
                        passive:
                            false
                    }
                );


                this.elements.viewport.addEventListener(
                    'touchend',
                    function () {

                        self.endDrag();

                    }
                );

            }


            /*
             * Keyboard
             */

            document.addEventListener(
                'keydown',
                function (
                    event
                ) {

                    if (
                        event.target &&
                        (
                            event.target.tagName === 'INPUT' ||
                            event.target.tagName === 'TEXTAREA' ||
                            event.target.tagName === 'SELECT'
                        )
                    ) {

                        return;

                    }


                    switch (
                        event.key
                    ) {

                        case 'ArrowRight':

                        case 'PageDown':

                            event.preventDefault();

                            self.nextPage();

                            break;


                        case 'ArrowLeft':

                        case 'PageUp':

                            event.preventDefault();

                            self.previousPage();

                            break;


                        case '+':

                        case '=':

                            self.zoomIn();

                            break;


                        case '-':

                        case '_':

                            self.zoomOut();

                            break;


                        case '0':

                            self.fitToScreen();

                            break;


                        case 'f':

                        case 'F':

                            self.toggleFullscreen();

                            break;

                    }

                }
            );


            /*
             * Core page-change event
             */

            document.addEventListener(
                'dc:epaper-page-change',
                function (
                    event
                ) {

                    if (
                        event.detail &&
                        event.detail.page
                    ) {

                        self.setPage(
                            event.detail.page,
                            event.detail.pageNumber,
                            event.detail.totalPages
                        );

                    }

                }
            );


            /*
             * Issue selected
             */

            document.addEventListener(
                'dc:epaper-issue-selected',
                function (
                    event
                ) {

                    if (
                        event.detail
                    ) {

                        self.updatePageIndicators(
                            event.detail.currentPage || 1,
                            event.detail.totalPages || 0
                        );

                    }

                }
            );


            /*
             * Window resize
             */

            window.addEventListener(
                'resize',
                function () {

                    if (
                        self.state.scale <= 1.01
                    ) {

                        self.fitToScreen();

                    }

                }
            );


            /*
             * Fullscreen
             */

            document.addEventListener(
                'fullscreenchange',
                function () {

                    self.dispatchViewerEvent(
                        'dc:epaper-fullscreen-change',
                        {
                            fullscreen:
                                !!document.fullscreenElement
                        }
                    );


                    setTimeout(
                        function () {

                            self.fitToScreen();

                        },
                        100
                    );

                }
            );

        },


        /* ==================================================
           Set Page
           ================================================== */

        setPage: function (
            page,
            pageNumber,
            totalPages
        ) {

            if (
                !page
            ) {

                return false;

            }


            this.state.currentPage =
                page;


            this.state.currentPageNumber =
                Number(
                    pageNumber
                ) ||
                Number(
                    page.number
                ) ||
                1;


            this.state.totalPages =
                Number(
                    totalPages
                ) ||
                0;


            const imageUrl =
                page.image ||
                page.imageUrl ||
                page.src ||
                '';


            this.updatePageIndicators(
                this.state.currentPageNumber,
                this.state.totalPages
            );


            if (
                !imageUrl
            ) {

                this.showError(
                    'এই পৃষ্ঠার ছবি পাওয়া যায়নি।'
                );


                this.dispatchViewerEvent(
                    'dc:epaper-image-error',
                    {
                        page:
                            page
                    }
                );


                return false;

            }


            if (
                !this.elements.image
            ) {

                return false;

            }


            this.hideError();


            this.resetPosition();


            this.elements.image.classList.remove(
                'dc-epaper-image-loaded'
            );


            this.elements.image.onload =
                () => {

                    this.elements.image.classList.add(
                        'dc-epaper-image-loaded'
                    );


                    this.fitToScreen();


                    this.dispatchViewerEvent(
                        'dc:epaper-image-ready',
                        {
                            page:
                                page,

                            pageNumber:
                                this.state.currentPageNumber,

                            totalPages:
                                this.state.totalPages
                        }
                    );

                };


            this.elements.image.onerror =
                () => {

                    this.showError(
                        'ই-পেপারের পৃষ্ঠাটি লোড করা সম্ভব হয়নি।'
                    );


                    this.dispatchViewerEvent(
                        'dc:epaper-image-error',
                        {
                            page:
                                page,

                            pageNumber:
                                this.state.currentPageNumber
                        }
                    );

                };


            /*
             * Prevent browser from treating
             * identical URL as new page unnecessarily.
             */

            this.elements.image.src =
                imageUrl;


            return true;

        },


        /* ==================================================
           Zoom
           ================================================== */

        zoomIn: function () {

            const next =
                Math.min(
                    this.state.maxScale,
                    this.state.scale +
                    this.state.step
                );


            this.setZoom(
                next
            );


            return next;

        },


        zoomOut: function () {

            const next =
                Math.max(
                    this.state.minScale,
                    this.state.scale -
                    this.state.step
                );


            this.setZoom(
                next
            );


            return next;

        },


        setZoom: function (
            scale
        ) {

            scale =
                Math.max(
                    this.state.minScale,
                    Math.min(
                        this.state.maxScale,
                        Number(
                            scale
                        ) || 1
                    )
                );


            this.state.scale =
                scale;


            this.render();


            this.dispatchViewerEvent(
                'dc:epaper-zoom-change',
                {
                    scale:
                        scale
                }
            );

        },


        toggleDoubleClickZoom:
            function () {

                if (
                    this.state.scale >
                    1.01
                ) {

                    this.fitToScreen();

                } else {

                    this.setZoom(
                        2
                    );

                }

            },


        /* ==================================================
           Fit
           ================================================== */

        fitToScreen: function () {

            if (
                !this.elements.image ||
                !this.elements.viewport ||
                !this.elements.image.naturalWidth
            ) {

                return;

            }


            const viewportWidth =
                this.elements.viewport.clientWidth;


            const viewportHeight =
                this.elements.viewport.clientHeight;


            const imageWidth =
                this.elements.image.naturalWidth;


            const imageHeight =
                this.elements.image.naturalHeight;


            if (
                !viewportWidth ||
                !viewportHeight ||
                !imageWidth ||
                !imageHeight
            ) {

                return;

            }


            const scaleX =
                viewportWidth /
                imageWidth;


            const scaleY =
                viewportHeight /
                imageHeight;


            const scale =
                Math.min(
                    scaleX,
                    scaleY
                );


            this.state.scale =
                Math.max(
                    this.state.minScale,
                    Math.min(
                        this.state.maxScale,
                        scale
                    )
                );


            this.resetPosition();

            this.render();


            this.dispatchViewerEvent(
                'dc:epaper-fit',
                {
                    scale:
                        this.state.scale
                }
            );

        },


        /* ==================================================
           Reset Position
           ================================================== */

        resetPosition: function () {

            this.state.offsetX =
                0;

            this.state.offsetY =
                0;

        },


        /* ==================================================
           Render
           ================================================== */

        render: function () {

            const image =
                this.elements.image;


            if (
                !image ||
                !image.naturalWidth
            ) {

                return;

            }


            image.style.transform =
                'translate3d(' +
                this.state.offsetX +
                'px, ' +
                this.state.offsetY +
                'px, 0) scale(' +
                this.state.scale +
                ')';


            image.style.transformOrigin =
                'center center';


            image.style.willChange =
                'transform';


            this.updateZoomIndicator();

        },


        /* ==================================================
           Zoom Indicator
           ================================================== */

        updateZoomIndicator:
            function () {

                const indicators =
                    document.querySelectorAll(
                        '[data-epaper-zoom-value]'
                    );


                const percentage =
                    Math.round(
                        this.state.scale *
                        100
                    ) + '%';


                indicators.forEach(
                    function (
                        element
                    ) {

                        element.textContent =
                            percentage;

                    }
                );

            },


        /* ==================================================
           Page Indicators
           ================================================== */

        updatePageIndicators:
            function (
                currentPage,
                totalPages
            ) {

                currentPage =
                    Number(
                        currentPage
                    ) ||
                    1;


                totalPages =
                    Number(
                        totalPages
                    ) ||
                    0;


                this.state.currentPageNumber =
                    currentPage;


                this.state.totalPages =
                    totalPages;


                const currentSelectors = [

                    '[data-epaper-current-page]',

                    '[data-epaper-page-current]',

                    '#dc-epaper-current-page'

                ];


                const totalSelectors = [

                    '[data-epaper-total-pages]',

                    '[data-epaper-page-total]',

                    '#dc-epaper-total-pages'

                ];


                currentSelectors.forEach(
                    function (
                        selector
                    ) {

                        document
                            .querySelectorAll(
                                selector
                            )
                            .forEach(
                                function (
                                    element
                                ) {

                                    element.textContent =
                                        currentPage;

                                }
                            );

                    }
                );


                totalSelectors.forEach(
                    function (
                        selector
                    ) {

                        document
                            .querySelectorAll(
                                selector
                            )
                            .forEach(
                                function (
                                    element
                                ) {

                                    element.textContent =
                                        totalPages;

                                }
                            );

                    }
                );


                /*
                 * Common text indicator:
                 *
                 * পৃষ্ঠা 1 / 10
                 */

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
                                currentPage +
                                ' / ' +
                                totalPages;

                        }
                    );

            },


        /* ==================================================
           Dragging
           ================================================== */

        startDrag: function (
            event
        ) {

            if (
                this.state.scale <= 1 &&
                this.getFitScale() >= 0.99
            ) {

                return;

            }


            this.state.dragging =
                true;


            this.state.startX =
                event.clientX;


            this.state.startY =
                event.clientY;


            this.state.startOffsetX =
                this.state.offsetX;


            this.state.startOffsetY =
                this.state.offsetY;


            if (
                this.elements.viewport
            ) {

                this.elements.viewport.classList.add(
                    'dc-epaper-dragging'
                );

            }

        },


        drag: function (
            event
        ) {

            if (
                !this.state.dragging
            ) {

                return;

            }


            const dx =
                event.clientX -
                this.state.startX;


            const dy =
                event.clientY -
                this.state.startY;


            this.state.offsetX =
                this.state.startOffsetX +
                dx;


            this.state.offsetY =
                this.state.startOffsetY +
                dy;


            this.render();

        },


        endDrag: function () {

            this.state.dragging =
                false;


            if (
                this.elements.viewport
            ) {

                this.elements.viewport.classList.remove(
                    'dc-epaper-dragging'
                );

            }

        },


        /* ==================================================
           Touch
           ================================================== */

        touchStart: function (
            event
        ) {

            if (
                !event.touches ||
                !event.touches.length
            ) {

                return;

            }


            const touch =
                event.touches[0];


            this.state.dragging =
                true;


            this.state.startX =
                touch.clientX;


            this.state.startY =
                touch.clientY;


            this.state.startOffsetX =
                this.state.offsetX;


            this.state.startOffsetY =
                this.state.offsetY;

        },


        touchMove: function (
            event
        ) {

            if (
                !this.state.dragging ||
                !event.touches ||
                !event.touches.length
            ) {

                return;

            }


            event.preventDefault();


            const touch =
                event.touches[0];


            const dx =
                touch.clientX -
                this.state.startX;


            const dy =
                touch.clientY -
                this.state.startY;


            this.state.offsetX =
                this.state.startOffsetX +
                dx;


            this.state.offsetY =
                this.state.startOffsetY +
                dy;


            this.render();

        },


        /* ==================================================
           Page Navigation
           ================================================== */

        nextPage: function () {

            if (
                window.DailyChalchitraEPaper &&
                typeof
                window.DailyChalchitraEPaper.nextPage ===
                'function'
            ) {

                return window.DailyChalchitraEPaper
                    .nextPage();

            }


            return false;

        },


        previousPage: function () {

            if (
                window.DailyChalchitraEPaper &&
                typeof
                window.DailyChalchitraEPaper.previousPage ===
                'function'
            ) {

                return window.DailyChalchitraEPaper
                    .previousPage();

            }


            return false;

        },


        /* ==================================================
           Fullscreen
           ================================================== */

        toggleFullscreen:
            function () {

                const element =
                    this.elements.viewport ||
                    document.documentElement;


                if (
                    !document.fullscreenElement
                ) {

                    if (
                        element.requestFullscreen
                    ) {

                        return element.requestFullscreen();

                    }


                    if (
                        element.webkitRequestFullscreen
                    ) {

                        return element.webkitRequestFullscreen();

                    }

                } else {

                    if (
                        document.exitFullscreen
                    ) {

                        return document.exitFullscreen();

                    }


                    if (
                        document.webkitExitFullscreen
                    ) {

                        return document.webkitExitFullscreen();

                    }

                }

            },


        /* ==================================================
           Fit Scale
           ================================================== */

        getFitScale: function () {

            if (
                !this.elements.image ||
                !this.elements.viewport ||
                !this.elements.image.naturalWidth
            ) {

                return 1;

            }


            const width =
                this.elements.viewport.clientWidth;


            const height =
                this.elements.viewport.clientHeight;


            return Math.min(

                width /
                this.elements.image.naturalWidth,

                height /
                this.elements.image.naturalHeight

            );

        },


        /* ==================================================
           Error
           ================================================== */

        showError: function (
            message
        ) {

            let element =
                document.querySelector(
                    '[data-epaper-viewer-error]'
                );


            if (
                !element
            ) {

                return;

            }


            element.textContent =
                message ||
                'ত্রুটি হয়েছে।';


            element.hidden =
                false;

        },


        hideError: function () {

            const element =
                document.querySelector(
                    '[data-epaper-viewer-error]'
                );


            if (
                element
            ) {

                element.hidden =
                    true;

            }

        },


        /* ==================================================
           Viewer Event
           ================================================== */

        dispatchViewerEvent:
            function (
                eventName,
                detail
            ) {

                document.dispatchEvent(
                    new CustomEvent(
                        eventName,
                        {
                            detail:
                                detail || {}
                        }
                    )
                );

            }

    };


    /* ======================================================
       Global
       ====================================================== */

    window.DailyChalchitraEPaperViewer =
        Viewer;


})(window, document);
