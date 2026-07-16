/*
======================================================
Daily Chalchitra ePaper Viewer Engine
Version : 1.1
======================================================
*/

window.DCViewer = {

    version: "1.1",

    issue: null,

    pdf: null,

    currentPage: 1,

    totalPages: 0,

    zoom: 1,

    pages: [],

    initialized: false,


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


    nextPage: function(){

        if(this.currentPage < this.totalPages){

            this.currentPage++;

        }


        this.renderInfo();

    },


    previousPage: function(){

        if(this.currentPage > 1){

            this.currentPage--;

        }


        this.renderInfo();

    },


    setZoom: function(value){

        this.zoom = value;

        this.renderInfo();

    },


    renderInfo: function(){

        console.log({
            page: this.currentPage,
            total: this.totalPages,
            zoom: this.zoom
        });

    }

};
