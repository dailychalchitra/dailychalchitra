/*
======================================================
Daily Chalchitra ePaper Viewer Engine
Version : 1.3
======================================================
*/

window.DCViewer = {

    version: "1.3",

    issue: null,

    pdf: null,

    pdfDocument: null,

    canvas: null,

    context: null,

    currentPage: 1,

    totalPages: 0,

    zoom: 1,

    pages: [],

    initialized: false,


    /*
    ===============================
    Viewer Initialize
    ===============================
    */

    init: function(issue){

        this.issue = issue;

        this.pdf = issue.pdf;

        this.currentPage = 1;

        this.totalPages = issue.pages || 0;

        this.zoom = 1;

        this.pages = [];

        this.initialized = true;


        console.log(
            "Daily Chalchitra ePaper Viewer Initialized"
        );


        console.log(
            "PDF:",
            this.pdf
        );

    },


    /*
    ===============================
    PDF Loader Engine
    ===============================
    */

    loadPDF: async function(){


        if(!this.issue){

            console.error(
                "No ePaper issue selected"
            );

            return;

        }



        if(!window.pdfjsLib){

            console.error(
                "PDF.js Library not loaded"
            );

            return;

        }



        this.canvas =
        document.getElementById(
            "dc-pdf-canvas"
        );



        if(this.canvas){

            this.context =
            this.canvas.getContext(
                "2d"
            );


            console.log(
                "PDF Canvas Ready"
            );

        }



        try{


            const loadingTask =
            pdfjsLib.getDocument(
                this.pdf
            );



            this.pdfDocument =
            await loadingTask.promise;



            this.totalPages =
            this.pdfDocument.numPages;



            console.log(
                "PDF Loaded Successfully"
            );


            console.log(
                "Total Pages:",
                this.totalPages
            );


            this.renderPage(
                this.currentPage
            );


        }


        catch(error){


            console.error(
                "PDF Load Error:",
                error
            );


        }


    },



    /*
    ===============================
    Page Render
    ===============================
    */

    renderPage: async function(pageNumber){


        if(!this.pdfDocument){

            return;

        }



        const page =
        await this.pdfDocument.getPage(
            pageNumber
        );



        const viewport =
        page.getViewport({

            scale: this.zoom

        });



        this.canvas.width =
        viewport.width;


        this.canvas.height =
        viewport.height;



        const renderContext = {

            canvasContext:
            this.context,

            viewport:
            viewport

        };



        await page.render(
            renderContext
        ).promise;



        console.log(
            "Page Rendered:",
            pageNumber
        );


    },



    /*
    ===============================
    Next Page
    ===============================
    */

    nextPage: function(){


        if(this.currentPage < this.totalPages){

            this.currentPage++;

            this.renderPage(
                this.currentPage
            );

        }


        this.renderInfo();


    },



    /*
    ===============================
    Previous Page
    ===============================
    */

    previousPage: function(){


        if(this.currentPage > 1){

            this.currentPage--;

            this.renderPage(
                this.currentPage
            );

        }


        this.renderInfo();


    },



    /*
    ===============================
    Zoom Control
    ===============================
    */

    setZoom: function(value){


        this.zoom = value;


        if(this.zoom < 0.5){

            this.zoom = 0.5;

        }


        this.renderPage(
            this.currentPage
        );


        this.renderInfo();


    },



    /*
    ===============================
    Viewer Status
    ===============================
    */

    renderInfo: function(){


        console.log({

            page:
            this.currentPage,

            total:
            this.totalPages,

            zoom:
            this.zoom

        });


    }


};
