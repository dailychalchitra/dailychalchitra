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

/*
======================================
Build Newspaper Pages
======================================
*/

buildPages(){

    this.pages=[];

    let page=[];


    const perPage =
    this.columnCount * 8;



    this.posts.forEach(post=>{


        page.push(post);



        if(page.length >= perPage){


            this.pages.push(page);


            page=[];


        }


    });



    if(page.length){


        this.pages.push(page);


    }



    this.totalPages =
    this.pages.length;



    console.log(
        "Total ePaper Pages:",
        this.totalPages
    );



    this.render();


},

/*
======================================
Render ePaper Page
======================================
*/

render(){

    const box =
    document.getElementById(
        "dc-post-columns"
    );


    if(!box){

        console.error(
            "ePaper container missing"
        );

        return;

    }



    box.innerHTML = "";



    if(!this.pages.length){

        box.innerHTML =
        "এই সপ্তাহে কোনো পোস্ট পাওয়া যায়নি।";

        return;

    }



    const current =
    this.pages[
        this.currentPage - 1
    ];



    if(!current){

        return;

    }



    current.forEach(post=>{

    const card =
    document.createElement("article");

    card.className =
    "dc-post-card";

    card.style.cursor =
    "pointer";

    card.innerHTML = `

        ${
        post.image
        ?
        `<img src="${post.image}" alt="${post.title}">`
        :
        ""
        }

        <h2>
        ${post.title}
        </h2>

        <p>
        ${post.excerpt || ""}
        </p>

        <small>
        বিভাগ: ${post.category || "সাধারণ"}
        |
        লেখক: ${post.author || ""}
        </small>

    `;

    card.addEventListener("click", ()=>{

        if(post.url){

            window.location.href =
            post.url;

        }

    });

    box.appendChild(card);

});


/*
======================================
Next Page
======================================
*/

nextPage(){

    if(this.currentPage < this.totalPages){

        this.currentPage++;

        this.render();

    }

    this.updatePageInfo();

},



/*
======================================
Previous Page
======================================
*/

previousPage(){

    if(this.currentPage > 1){

        this.currentPage--;

        this.render();

    }

    this.updatePageInfo();

},



/*
======================================
Zoom Control
======================================
*/

setZoom(value){

    this.zoom = value;


    if(this.zoom < 0.5){

        this.zoom = 0.5;

    }


    if(this.zoom > 2){

        this.zoom = 2;

    }


    const page =
    document.getElementById(
        "dc-epaper-page"
    );


    if(page){

        page.style.transform =
        `scale(${this.zoom})`;

        page.style.transformOrigin =
        "top center";

    }

},



/*
======================================
Start ePaper Engine
======================================
*/

async start(){

    this.reset();

    await this.loadPosts();

    this.render();

},



/*
======================================
Viewer Info
======================================
*/

renderInfo(){

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

/*
======================================
Auto Start
======================================
*/

document.addEventListener(
"DOMContentLoaded",
()=>{

    if(window.DCViewer){

        DCViewer.start();

    }

});
