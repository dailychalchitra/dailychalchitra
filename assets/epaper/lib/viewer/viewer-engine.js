/*
======================================================
Daily Chalchitra ePaper Viewer Engine
Version : 1.2
======================================================
*/

window.DCViewer = {

    version: "1.2",

    issue: null,

    pdf: null,

    currentPage: 1,

    totalPages: 0,

    zoom: 1,

    pages: [],

canvas: null,

context: null,

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


        console.log(
            "Total Pages:",
            this.totalPages
        );


    },


    /*
    ===============================
    PDF Loader Layer
    ===============================
    */


    loadPDF: function(){

        if(!this.issue){

            console.error(
                "No ePaper issue selected"
            );

            return;

        }


        console.log(
            "Loading PDF:"
        );


        console.log(
            this.pdf
        );


        /*
=========================================
PDF Render Container
=========================================
*/


this.canvas = document.getElementById(
    "dc-pdf-canvas"
);


this.context = null;


if(this.canvas){

    this.context = this.canvas.getContext(
        "2d"
    );


    console.log(
        "PDF Canvas Ready"
    );

}

    },



    /*
    ===============================
    Next Page
    ===============================
    */


    nextPage: function(){

        if(this.currentPage < this.totalPages){

            this.currentPage++;

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

        this.renderInfo();

    },



    /*
    ===============================
    Viewer Status
    ===============================
    */


    renderInfo: function(){

        console.log({

            page: this.currentPage,

            total: this.totalPages,

            zoom: this.zoom

        });

    }


};
