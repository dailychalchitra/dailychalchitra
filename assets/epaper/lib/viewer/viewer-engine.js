/*
  Daily Chalchitra ePaper Engine
  Final Fixed v3.0 - Single PDF + No Double Gap
*/
window.DCViewer = {
    version: "3.0",
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
        console.log("ePaper Engine v3.0 Ready - Issue:", issueId);
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
            const res = await fetch("/posts.json?v=" + Date.now());
            if(!res.ok) throw new Error("posts.json missing");
            const allPosts = await res.json();

            let filtered = allPosts;
            if(this.issue){
                filtered = allPosts.filter(p => p.week_id === this.issue);
            }

            this.posts = filtered.filter(p => p.date && (p.content || p.excerpt)).map(post=>({
                title: (post.title || "").trim(),
                url: post.url || "",
                date: post.date || "",
                excerpt: post.excerpt || "",
                content: post.content || "",
                image: post.image || "",
                category: post.category || post.categories?.[0] || "সাধারণ",
                author: post.author || ""
            }));

            console.log("Filtered Posts for", this.issue, ":", this.posts.length);
            this.buildPages();
        }catch(error){
            console.error("Post Load Error:", error);
            if(this.container) this.container.innerHTML = `<div class="dc-empty">পোস্ট লোড করা সম্ভব হচ্ছে না।</div>`;
        }
        this.loading = false;
    },

    estimatePostHeight(post){
        let height = 100;
        if(post.image) height += 200;
        if(post.title) height += Math.ceil(post.title.length / 28) * 26;
        const plainText = (post.content || "").replace(/<[^>]+>/g," ").replace(/\s+/g," ");
        height += Math.ceil(plainText.length / 85) * 20;
        return height;
    },

    buildPages(){
        this.pages = [];
        let page = [];
        let usedHeight = 0;
        const pageHeight = 1550;
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
        this.render();
    },

    // সিঙ্গেল পোস্ট PDF - ইঞ্জিনের ভিতরেই
    async downloadSingleCard(card, title){
        const btn = card.querySelector(".dc-mini-pdf");
        const old = btn? btn.innerHTML : "";
        if(btn){ btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>'; btn.style.pointerEvents='none'; }
        try{
            const fileName = (title || 'post').replace(/[\/\\:*?"<>|]/g,'').substring(0,50) + ".pdf";
            if(typeof html2pdf!== 'undefined'){
                await html2pdf().set({
                    margin: [10,10,10,10],
                    filename: fileName,
                    image: {type:'jpeg', quality:0.98},
                    html2canvas: {scale:2, useCORS:true, backgroundColor:"#fff"},
                    jsPDF: {unit:'mm', format:'a4', orientation:'portrait'},
                    pagebreak: {mode:['css','legacy']}
                }).from(card).save();
            } else {
                window.print();
            }
        } catch(e){
            console.error(e);
            alert("PDF তৈরি করা যায়নি।");
        } finally {
            if(btn){ btn.innerHTML = old; btn.style.pointerEvents='auto'; }
        }
    },

    render(){
        const box = document.getElementById("dc-post-columns");
        if(!box) return;
        box.innerHTML = "";
        if(!this.pages.length){
            box.innerHTML = `<div class="dc-empty">এই সপ্তাহে কোনো পোস্ট পাওয়া যায়নি।</div>`;
            this.updatePageInfo();
            return;
        }
        const current = this.pages[this.currentPage - 1];
        if(!current ||!current.length){
            box.innerHTML = `<div class="dc-empty">এই পৃষ্ঠায় কোনো পোস্ট নেই।</div>`;
            return;
        }
        current.forEach(post=>{
            const card = document.createElement("article");
            card.className = "dc-post-card";

            // কন্টেন্ট ক্লিন - ডাবল br এবং ফাঁকা p রিমুভ
            let cleanContent = (post.content || post.excerpt || "")
               .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "<br>")
               .replace(/<p>\s*<\/p>/gi, "")
               .replace(/<p>\s*(&nbsp;|\s)*\s*<\/p>/gi, "");

            card.innerHTML = `
                <a href="javascript:void(0)" class="dc-mini-pdf" title="এই লেখার PDF"><i class="fa fa-file-pdf"></i> PDF</a>
                ${post.image? `<img src="${post.image}" alt="${post.title}" loading="lazy">` : ""}
                <h2>${post.title}</h2>
                ${(post.category || post.author)? `<div class="dc-cat-author">${post.category? 'বিভাগ: '+post.category : ''}${post.category && post.author? ' | ' : ''}${post.author? 'লেখক: '+post.author : ''}</div>` : ""}
                <div class="dc-post-content">${cleanContent}</div>
            `;

            // PDF বাটন ক্লিক
            const pdfBtn = card.querySelector(".dc-mini-pdf");
            pdfBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.downloadSingleCard(card, post.title);
            });

            box.appendChild(card);
        });
        this.updatePageInfo();
    },

    updatePageInfo(){
        const info = document.getElementById("dc-page-info");
        if(!info) return;
        info.innerHTML = `পৃষ্ঠা ${this.currentPage} / ${this.totalPages || 1}`;
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
        this.zoom = Math.max(0.5, Math.min(2, value));
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
    if(window.DCViewer &&!DCViewer.initialized){
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
