/*
==========================================================
Daily Chalchitra ePaper Engine
Version : 2.1 Final
HTML Newspaper Edition
==========================================================
*/

window.DCViewer = {

    version: "2.1",

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
    document.getElementById(
        "dc-epaper-page"
    );


    this.container =
    document.getElementById(
        "dc-post-columns"
    );


    this.detectColumns();


    this.initialized = true;


    console.log(
        "Daily Chalchitra ePaper Engine 2.1"
    );

},



/*
======================================
Responsive Column Detector
======================================
*/

detectColumns(){

    if(window.innerWidth <= 768){

        this.columnCount = 1;

    }

    else if(window.innerWidth <= 1100){

        this.columnCount = 2;

    }

    else{

        this.columnCount = 3;

    }

},



/*
======================================
Resize
======================================
*/

resize(){

    this.detectColumns();

    this.buildPages();

},



/*
======================================
Reset
======================================
*/

reset(){

    this.posts = [];

    this.pages = [];

    this.currentPage = 1;

    this.totalPages = 0;

},



/*
======================================
Load Posts
======================================
*/

async loadPosts(){

    this.loading = true;

    try{

        const res =
        await fetch(
            "/posts.json"
        );

        if(!res.ok){

            throw new Error(
                "posts.json missing"
            );

        }

        const allPosts =
        await res.json();

        this.posts =
        allPosts
        .filter(post=>{

            return (
                post.date &&
                post.content
            );

        })
        .map(post=>({

            title:
            post.title || "",

            url:
            post.url || "",

            date:
            post.date || "",

            excerpt:
            post.excerpt || "",

            content:
            post.content || "",

            image:
            post.image || "",

            category:
            post.category || "সাধারণ",

            author:
            post.author || ""

        }));

        console.log(
            "Total Posts:",
            this.posts.length
        );

        this.buildPages();

    }

    catch(error){

        console.error(
            "Post Load Error:",
            error
        );

        if(this.container){

            this.container.innerHTML =
            "পোস্ট লোড করা সম্ভব হচ্ছে না।";

        }

    }

    this.loading = false;

},

/*
======================================
Estimate Post Height
======================================
*/

estimatePostHeight(post){

    let height = 120;

    if(post.image){

        height += 220;

    }

    if(post.title){

        height += Math.ceil(
            post.title.length / 30
        ) * 28;

    }

    const plainText =
    (post.content || "")
    .replace(/<[^>]+>/g," ")
    .replace(/\s+/g," ");

    height +=
    Math.ceil(
        plainText.length / 90
    ) * 22;

    return height;

},


/*
======================================
Build Newspaper Pages
Smart Page Builder Version
======================================
*/

buildPages(){

    this.pages = [];

    let page = [];

    let usedHeight = 0;


    /*
    ==============================
    A4 Page Height Estimate
    ==============================
    */

    const pageHeight = 1600;



    /*
    ==============================
    Post Height Based Pagination
    ==============================
    */

    this.posts.forEach(post=>{


        const postHeight =
        this.estimatePostHeight(post);



        /*
        ==============================
        Start New Page
        ==============================
        */


        if(
            usedHeight + postHeight > pageHeight
            &&
            page.length > 0
        ){


            this.pages.push(page);


            page = [];


            usedHeight = 0;


        }



        /*
        ==============================
        Add Post To Current Page
        ==============================
        */


        page.push(post);


        usedHeight += postHeight;



    });



    /*
    ==============================
    Add Remaining Posts
    ==============================
    */


    if(page.length){


        this.pages.push(page);


    }



    /*
    ==============================
    Total Pages Update
    ==============================
    */


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
            "dc-post-columns missing"
        );

        return;

    }

    box.innerHTML = "";

    if(!this.pages.length){

        box.innerHTML =
        "এই সপ্তাহে কোনো পোস্ট পাওয়া যায়নি।";

        this.updatePageInfo();

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
        document.createElement(
            "article"
        );

        card.className =
        "dc-post-card";

        card.innerHTML = `

            ${
            post.image
            ?
            `
            <img
            src="${post.image}"
            alt="${post.title}"
            loading="lazy">
            `
            :
            ""
            }

            <h2>

                ${post.title}

            </h2>

            <div class="dc-post-content">

                ${post.content || post.excerpt || ""}

            </div>

            <small>

                বিভাগ:
                ${post.category || "সাধারণ"}

                |

                লেখক:
                ${post.author || ""}

            </small>

        `;

        box.appendChild(card);

    });

    this.updatePageInfo();

},




/*
======================================
Update Page Information
======================================
*/

updatePageInfo(){


    const info =
    document.getElementById(
        "dc-page-info"
    );



    if(!info){

        return;

    }



    info.innerHTML =
    `
    পৃষ্ঠা ${this.currentPage}
    /
    ${this.totalPages}
    `;


},
/*
======================================
Next Page
======================================
*/

nextPage(){


    if(this.currentPage < this.totalPages){


        this.currentPage++;


        this.render();


        window.scrollTo(
            {
                top:0,
                behavior:"smooth"
            }
        );


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


        window.scrollTo(
            {
                top:0,
                behavior:"smooth"
            }
        );


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



    console.log(
        "Zoom:",
        this.zoom
    );


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
Viewer Information
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


        const params =
        new URLSearchParams(
            window.location.search
        );



        const issue =
        params.get("issue");



        DCViewer.init(issue);



        DCViewer.start();


    }


});




/*
======================================
Window Resize
======================================
*/


window.addEventListener(
"resize",
()=>{


    if(
        window.DCViewer &&
        DCViewer.initialized
    ){


        DCViewer.resize();


    }


});
