/* ==========================================================
   Daily Chalchitra ePaper
   epaper-loader.js
   Version: 2.0

   কাজ:
   - ePaper module loading
   - Core → Viewer → Print → Init ক্রমে load
   - Duplicate script loading প্রতিরোধ
   - সব module load হওয়ার পরে initialization event
   ========================================================== */

(function (window, document) {

    'use strict';


    /* ------------------------------------------------------
       Script Loader
       ------------------------------------------------------ */

    function loadScript(src) {

        return new Promise(function (resolve, reject) {

            var existing =
                document.querySelector(
                    'script[data-dc-epaper-src="' + src + '"]'
                );

            if (existing) {

                if (
                    existing.getAttribute(
                        'data-dc-epaper-loaded'
                    ) === 'true'
                ) {
                    resolve();
                    return;
                }

                existing.addEventListener(
                    'load',
                    function () {
                        resolve();
                    },
                    {
                        once: true
                    }
                );

                existing.addEventListener(
                    'error',
                    function () {
                        reject(
                            new Error(
                                'ePaper script load failed: ' + src
                            )
                        );
                    },
                    {
                        once: true
                    }
                );

                return;
            }


            var script =
                document.createElement('script');

            script.src = src;
            script.async = false;

            script.setAttribute(
                'data-dc-epaper-src',
                src
            );

            script.onload = function () {

                script.setAttribute(
                    'data-dc-epaper-loaded',
                    'true'
                );

                resolve();

            };

            script.onerror = function () {

                reject(
                    new Error(
                        'ePaper script load failed: ' + src
                    )
                );

            };

            document.head.appendChild(script);

        });

    }


    /* ------------------------------------------------------
       Main Loader
       ------------------------------------------------------ */

    async function init() {

        if (
            window.__DC_EPaperLoaderStarted
        ) {
            return;
        }

        window.__DC_EPaperLoaderStarted =
            true;


        try {

            /*
             * Core
             */

            await loadScript(
                '/assets/js/epaper-core.js'
            );


            /*
             * Viewer
             */

            await loadScript(
                '/assets/js/epaper-viewer.js'
            );


            /*
             * Print
             */

            await loadScript(
                '/assets/js/epaper-print.js'
            );


            /*
             * Init
             */

            await loadScript(
                '/assets/js/epaper-init.js'
            );


            /*
             * All modules loaded
             */

            document.dispatchEvent(
                new CustomEvent(
                    'dc:epaper-modules-loaded'
                )
            );


        } catch (error) {

            console.error(
                '[Daily Chalchitra ePaper] Module loading failed:',
                error
            );


            document.dispatchEvent(
                new CustomEvent(
                    'dc:epaper-modules-error',
                    {
                        detail: {
                            error: error
                        }
                    }
                )
            );

        }

    }


    /* ------------------------------------------------------
       Public API
       ------------------------------------------------------ */

    window.DCEpaperLoader = {

        init: init

    };


    /* ------------------------------------------------------
       DOM Ready
       ------------------------------------------------------ */

    if (
        document.readyState === 'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            init,
            {
                once: true
            }
        );

    } else {

        init();

    }


})(window, document);
