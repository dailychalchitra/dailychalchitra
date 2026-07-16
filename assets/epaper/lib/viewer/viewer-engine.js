/*
======================================================
Daily Chalchitra ePaper Viewer Engine
Version : 1.0
======================================================
*/

window.DCViewer = {

    version: "1.0",

    issue: null,

    pdf: null,

    currentPage: 1,

    totalPages: 0,

    zoom: 1,

    pages: [],

    initialized: false

};
DCViewer.init = function (issue) {

    this.issue = issue;

    this.currentPage = 1;

    this.zoom = 1;

    this.initialized = true;

    console.log("Daily Chalchitra Viewer Started");

    console.log(issue);

};
