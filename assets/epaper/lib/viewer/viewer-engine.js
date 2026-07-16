/*
==========================================================
Daily Chalchitra ePaper Engine
Version : 2.0
HTML Newspaper Edition
==========================================================
*/

window.DCViewer = {

    version: "2.0",

    issue: null,

    currentPage: 1,

    totalPages: 0,

    zoom: 1,

    initialized: false,

    posts: [],

    pages: [],

    container: null,

    viewer: null,

    columnCount: 3,

    pageHeight: 1450,

    pageWidth: 980,

    loading: false,

    /*
    ======================================
    Initialize
    ======================================
    */

    init(issue){

        this.issue = issue;

        this.currentPage = 1;

        this.totalPages = 0;

        this.zoom = 1;

        this.posts = [];

        this.pages = [];

        this.loading = false;

        this.viewer =
        document.getElementById("dc-pdf-viewer");

        this.container =
        document.getElementById("dc-pdf-viewer");

        this.detectColumns();

        this.initialized = true;

        console.log("Daily Chalchitra ePaper v2.0");

    },

/*
======================================
Responsive Column Detector
======================================
*/

detectColumns(){

    if(window.innerWidth<=768){

        this.columnCount=1;

    }

    else if(window.innerWidth<=1100){

        this.columnCount=2;

    }

    else{

        this.columnCount=3;

    }

},
/*
======================================
Window Resize
======================================
*/

resize(){

    this.detectColumns();

    this.render();

},
/*
======================================
Reset Viewer
======================================
*/

reset(){

    this.posts=[];

    this.pages=[];

    this.currentPage=1;

    this.totalPages=0;

},
