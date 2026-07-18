/*

Daily Chalchitra ePaper Engine
Final Auto v2.2 - 100% Automatic Weekly Filter

*/
window.DCViewer = {
    version: "2.2",
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

    init(issueId){
        this.issue = issueId;
        this.currentPage = 1;
        this.totalPages = 0;
        this.zoom = 1;
        this.posts = [];
        this.pages = [];
        this.loading = false;
        this.viewer = document.getElementById("dc-epaper-page");
        this.container = document.getElementById("dc-post-columns");
        this.detectColumns();
        this.initialized = true;
        console.log("ePaper Engine v2.2 Ready - Issue:", issueId);
    },

    detectColumns(){
        if(window.innerWidth <= 768) this.columnCount = 1;
        else if(window.innerWidth <= 1100) this.columnCount = 2;
        else this.columnCount = 3;
    },

    resize(){ this.detectColumns(); this.buildPages(); },
    reset(){ this.posts = []; this.pages = []; this.currentPage = 1; this.totalPages = 0; },

    async loadPosts(){
        this.loading = true;
        try{
            const res = await fetch("/posts.json");
            if(!res.ok) throw new Error("posts.json missing");
            const allPosts = await res.json();

            // 100% Auto Weekly Filter
            let filtered = allPosts;
            if(this.issue){
                filtered = allPosts.filter(p => p.week_id === this.issue);
            }

            this.posts = filtered.filter(p => p.date && p.content).map(post=>({
                title: post.title || "",
                url: post.url || "",
                date: post.date || "",
                excerpt: post.excerpt || "",
                content: post.content || "",
                image: post.image || "",
                category: post.category || "সাধারণ",
                author: post.author || ""
            }));

            console.log("Filtered Posts for", this.issue, ":", this.posts.length);
            this.buildPages();
        }catch(error){
            console.error("Post Load Error:", error);
            if(this.container) this.container.innerHTML = "পোস্ট লোড করা সম্ভব হচ্ছে না।";
        }
        this.loading = false;
    },

    estimatePostHeight(post){
        let height = 120;
        if(post.image) height += 220;
        if(post.title) height += Math.ceil(post.title.length / 30) * 28;
        const plainText = (post.content || "").replace(/<[^>]+>/g," ").replace(/\s+/g," ");
        height += Math.ceil(plainText.length / 90) * 22;
        return height;
    },

    buildPages(){
        this.pages = [];
        let page = [];
        let usedHeight = 0;
        const pageHeight = 1600;
        this.posts.forEach(post=>{
            const postHeight = this.estimatePostHeight(post);
            if(usedHeight + postHeight > pageHeight && page.length > 0){
                this.pages.push([...page]);
                page = [];
                usedHeight = 0;
            }
            page.push(post);
            usedHeight += postHeight;
        });
        if(page.length) this.pages.push(page);
        this.totalPages = this.pages.length;
        console.log("Total Pages:", this.totalPages);
        this.render();
    },

    measurePageHeight(){ return this.viewer ? this.viewer.scrollHeight : 0; },

    render(){
        const box = document.getElementById("dc-post-columns");
        if(!box) return;
        box.innerHTML = "";
        if(!this.pages.length){
            box.innerHTML = "এই সপ্তাহে কোনো পোস্ট পাওয়া যায়নি।";
            this.updatePageInfo();
            return;
        }
        const current = this.pages[this.currentPage - 1];
        if(!current || !current.length){
            box.innerHTML = "এই পৃষ্ঠায় কোনো পোস্ট নেই।";
            return;
        }
        current.forEach(post=>{
            const card = document.createElement("article");
            card.className = "dc-post-card";
            card.innerHTML = `
                ${post.image ? `<img src="${post.image}" alt="${post.title}" loading="lazy">` : ""}
                <h2>${post.title}</h2>
                <div class="dc-post-content">${post.content || post.excerpt || ""}</div>
                <small>বিভাগ: ${post.category} | লেখক: ${post.author}</small>
            `;
            box.appendChild(card);
        });
        this.updatePageInfo();
        const realHeight = this.measurePageHeight();
        console.log("Current Page Height:", realHeight);
    },

    updatePageInfo(){
        const info = document.getElementById("dc-page-info");
        if(!info) return;
        info.innerHTML = `পৃষ্ঠা ${this.currentPage} / ${this.totalPages}`;
    },

    nextPage(){
        if(this.currentPage < this.totalPages){
            this.currentPage++;
            this.render();
            window.scrollTo({top:0, behavior:"smooth"});
        }
        this.updatePageInfo();
    },

    previousPage(){
        if(this.currentPage > 1){
            this.currentPage--;
            this.render();
            window.scrollTo({top:0, behavior:"smooth"});
        }
        this.updatePageInfo();
    },

    setZoom(value){
        this.zoom = value;
        if(this.zoom < 0.5) this.zoom = 0.5;
        if(this.zoom > 2) this.zoom = 2;
        const page = document.getElementById("dc-epaper-page");
        if(page){
            page.style.transform = `scale(${this.zoom})`;
            page.style.transformOrigin = "top center";
        }
    },

    async start(){
        this.reset();
        await this.loadPosts();
        this.render();
    }
};

document.addEventListener("DOMContentLoaded",()=>{
    if(window.DCViewer && !DCViewer.initialized){
        const params = new URLSearchParams(window.location.search);
        const issue = params.get("issue");
        if(issue){
            DCViewer.init(issue);
            DCViewer.start();
        }
    }
});

window.addEventListener("resize",()=>{
    if(window.DCViewer && DCViewer.initialized){
        DCViewer.resize();
    }
});
