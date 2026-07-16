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
document.getElementById("dc-epaper-page");

this.container =
document.getElementById("dc-post-columns");

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

/*
======================================
Load Posts From Jekyll posts.json
======================================
*/

async loadPosts(){

    this.loading = true;

    try{

        const res =
        await fetch("/posts.json");


        if(!res.ok){

            throw new Error(
                "posts.json not found"
            );

        }


        const allPosts =
        await res.json();



        this.posts =
        allPosts.filter(post=>{


            if(!post.date){

                return false;

            }


            return true;


        });



        console.log(
            "Total Posts:",
            this.posts.length
        );



        this.buildPages();


    }


    catch(error){


        console.error(
            "Post Loading Error:",
            error
        );


        const box =
        document.getElementById(
            "dc-post-columns"
        );


        if(box){

            box.innerHTML =
            "পোস্ট লোড করা সম্ভব হচ্ছে না।";

        }


    }


    this.loading=false;


},
