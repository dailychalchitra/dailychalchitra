/*
  Daily Chalchitra ePaper Engine
  Clean Fixed Version v3.5

  Features:
  - Stable viewer initialization
  - No duplicate auto-init conflict
  - Dynamic page building
  - Single post PDF download
  - Responsive column control
  - Bengali content friendly
*/

window.DCViewer = {

    version: "3.5",

    issue: null,
    currentPage: 1,
    totalPages: 0,

    zoom: 1,

    initialized: false,
    isStarting: false,
    loading: false,

    posts: [],
    pages: [],

    container: null,
    viewer: null,

    columnCount: 3,


    init(issueId){

        if(this.initialized && this.issue === issueId){
            return;
        }

        this.issue = decodeURIComponent(issueId || "");

        this.currentPage = 1;
        this.totalPages = 0;
        this.zoom = 1;

        this.posts = [];
        this.pages = [];

        this.loading = false;
        this.isStarting = false;


        this.viewer =
            document.getElementById("dc-epaper-page");


        this.container =
            document.getElementById("dc-post-columns");


        this.detectColumns();


        this.initialized = true;


        console.log(
            "Daily Chalchitra ePaper Engine Ready:",
            this.issue
        );
    },


    detectColumns(){

        if(window.innerWidth <= 768){

            this.columnCount = 1;

        }else if(window.innerWidth <= 1100){

            this.columnCount = 2;

        }else{

            this.columnCount = 3;

        }

    },


    resize(){

        this.detectColumns();

        this.buildPages();

    },


    reset(){

        this.posts = [];

        this.pages = [];

        this.currentPage = 1;

        this.totalPages = 0;

    },


    async loadPosts(){

        this.loading = true;


        const box =
            document.getElementById(
                "dc-post-columns"
            );


        if(box){

            box.innerHTML = `
            <div class="dc-empty">
                <i class="fa fa-spinner fa-spin"></i>
                ই-পেপার লোড হচ্ছে...
            </div>`;

        }



        try{


            const res =
                await fetch(
                    "/assets/epaper/issues/issues.json?v="
                    + Date.now()
                );


            if(!res.ok){

                throw new Error(
                    "issues.json পাওয়া যায়নি"
                );

            }



            const allIssues =
                await res.json();



            const currentIssue =
                allIssues.find(
                    item =>
                    String(item.id)
                    ===
                    String(this.issue)
                );



            if(
                currentIssue &&
                Array.isArray(currentIssue.posts) &&
                currentIssue.posts.length
            ){


                this.posts =
                    currentIssue.posts.map(post => ({


                    title:
                        (post.title || "")
                        .trim(),


                    url:
                        post.url || "",


                    date:
                        post.date || "",


                    excerpt:
                        post.excerpt || "",


                    content:
                        post.content ||
                        post.excerpt ||
                        "",


                    image:
                        post.image || "",


                    category:
                        post.category ||
                        "সাধারণ",


                    author:
                        post.author || ""

                    }));


                console.log(
                    "Loaded Posts:",
                    this.posts.length
                );


            }else{


                this.posts = [];


                console.warn(
                    "No posts found:",
                    this.issue
                );


            }



            this.buildPages();



        }catch(error){


            console.error(
                "Post Load Error:",
                error
            );


            if(this.container){

                this.container.innerHTML = `

                <div class="dc-empty">

                পোস্ট লোড করা সম্ভব হচ্ছে না।

                <br>

                <small>
                ${error.message}
                </small>

                <br>

                <button
                onclick="DCViewer.start()"
                style="
                margin-top:10px;
                padding:6px 14px;
                border:1px solid #C00000;
                color:#C00000;
                background:#fff;
                border-radius:6px;
                ">

                আবার চেষ্টা করুন

                </button>

                </div>`;

            }

        }


        this.loading = false;

    },

        if(!current || !current.length){
            box.innerHTML = `
                <div class="dc-empty">
                    এই পৃষ্ঠায় কোনো পোস্ট নেই।
                </div>
            `;
            return;
        }

        current.forEach(post => {

            const card = document.createElement("article");
            card.className = "dc-post-card";

            let cleanContent = (post.content || post.excerpt || "")
                .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "<br>")
                .replace(/<p>\s*<\/p>/gi, "")
                .replace(/<p>\s*(&nbsp;|\s)*\s*<\/p>/gi, "");

            card.innerHTML = `

                <a href="javascript:void(0)"
                   class="dc-mini-pdf"
                   title="এই লেখার PDF ডাউনলোড">
                    <i class="fa fa-file-pdf"></i>
                    PDF
                </a>

                ${
                    post.image
                    ?
                    `
                    <img src="${post.image}"
                         alt="${post.title}"
                         loading="lazy"
                         onerror="this.style.display='none'">
                    `
                    :
                    ""
                }


                <h2>${post.title}</h2>


                ${
                    (post.category || post.author)
                    ?
                    `
                    <div class="dc-cat-author">

                        ${
                            post.category
                            ?
                            "বিভাগ: " + post.category
                            :
                            ""
                        }

                        ${
                            post.category && post.author
                            ?
                            " | "
                            :
                            ""
                        }

                        ${
                            post.author
                            ?
                            "লেখক: " + post.author
                            :
                            ""
                        }

                    </div>
                    `
                    :
                    ""
                }


                <div class="dc-post-content">
                    ${cleanContent}
                </div>

            `;


            const pdfBtn = card.querySelector(".dc-mini-pdf");


            pdfBtn.addEventListener("click", (e)=>{

                e.preventDefault();
                e.stopPropagation();

                this.downloadSingleCard(
                    card,
                    post.title
                );

            });


            box.appendChild(card);

        });


        this.updatePageInfo();

    },


    updatePageInfo(){

        const info = document.getElementById(
            "dc-page-info"
        );


        if(info){

            info.innerHTML =
            `
            পৃষ্ঠা ${this.currentPage}
            /
            ${this.totalPages || 1}
            `;

        }

    },


    nextPage(){

        if(this.currentPage < this.totalPages){

            this.currentPage++;

            this.render();

            window.scrollTo({
                top:0,
                behavior:"smooth"
            });

        }


        this.updatePageInfo();

    },


    previousPage(){

        if(this.currentPage > 1){

            this.currentPage--;

            this.render();


            window.scrollTo({
                top:0,
                behavior:"smooth"
            });

        }


        this.updatePageInfo();

    },

    setZoom(value){

        this.zoom = Math.max(
            0.5,
            Math.min(2, value)
        );


        const page = document.getElementById(
            "dc-epaper-page"
        );


        if(page){

            page.style.transform =
            `scale(${this.zoom})`;


            page.style.transformOrigin =
            "top center";

        }

    },


    async start(){

        if(this.isStarting) return;


        this.isStarting = true;


        this.reset();


        await this.loadPosts();


        this.render();


        this.isStarting = false;

    }

};


// ==========================================================
// NOTE:
// আগে এখানে একটি DOMContentLoaded listener ছিল,
// যেটি নিজে থেকেই DCViewer.init() এবং DCViewer.start()
// চালাতো।
//
// কিন্তু viewer.js ইতিমধ্যেই init/start নিয়ন্ত্রণ করে।
// দুটি জায়গা থেকে চালু হলে race condition তৈরি হয়ে
// কিছু ক্ষেত্রে "ই-পেপার লোড হচ্ছে..." অবস্থায় আটকে যেত।
//
// তাই auto-init সম্পূর্ণ বাদ দেওয়া হয়েছে।
// এখন নিয়ন্ত্রণ থাকবে শুধু viewer.js এর হাতে।
// ==========================================================



window.addEventListener(
    "resize",
    ()=>{

        if(
            window.DCViewer &&
            DCViewer.initialized
        ){

            DCViewer.resize();

        }

    }
);
