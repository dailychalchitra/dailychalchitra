/*
  Daily Chalchitra ePaper Engine
  Final Fixed v3.4 - Removed duplicate auto-init (was racing with viewer.js's own init/start,
  causing the viewer to get stuck on "লোড হচ্ছে..." for some issues depending on network timing)
*/
window.DCViewer = {
    version: "3.4",
    issue: null,
    currentPage: 1,
    totalPages: 0,
    zoom: 1,
    initialized: false,
    isStarting: false,
    posts: [],
    pages: [],
    container: null,
    viewer: null,
    columnCount: 3,
    loading: false,

    init(issueId){
        if(this.initialized && this.issue === issueId) return;
        this.issue = decodeURIComponent(issueId || "");
        this.currentPage = 1;
        this.totalPages = 0;
        this.zoom = 1;
        this.posts = [];
        this.pages = [];
        this.loading = false;
        this.isStarting = false;
        this.viewer = document.getElementById("dc-epaper-page");
        this.container = document.getElementById("dc-post-columns");
        this.detectColumns();
        this.initialized = true;
        console.log("ePaper Engine v3.4 Ready - Issue:", this.issue);
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
        const box = document.getElementById("dc-post-columns");
        if(box) box.innerHTML = `<div class="dc-empty"><i class="fa fa-spinner fa-spin"></i> ই-পেপার লোড হচ্ছে...</div>`;
        try{
            const res = await fetch("/assets/epaper/issues/issues.json?v=" + Date.now());
            if(!res.ok) throw new Error("issues.json not found");
            const allIssues = await res.json();
            const currentIssueData = allIssues.find(i => String(i.id) === String(this.issue));

            if(currentIssueData && currentIssueData.posts && currentIssueData.posts.length > 0){
                this.posts = currentIssueData.posts.map(post=>({
                    title: (post.title || "").trim(),
                    url: post.url || "",
                    date: post.date || "",
                    excerpt: post.excerpt || "",
                    content: post.content || post.excerpt || "",
                    image: post.image || "",
                    category: post.category || "সাধারণ",
                    author: post.author || ""
                }));
                console.log("Loaded from issues.json:", this.posts.length);
            } else {
                this.posts = [];
                console.warn("No posts found for", this.issue, "in issues.json");
            }
            this.buildPages();
        }catch(error){
            console.error("Post Load Error:", error);
            if(this.container) this.container.innerHTML = `<div class="dc-empty">পোস্ট লোড করা সম্ভব হচ্ছে না।<br><small>${error.message}</small><br><button onclick="DCViewer.start()" style="margin-top:10px;padding:6px 14px;border:1px solid #C00000;color:#C00000;background:#fff;border-radius:6px;">আবার চেষ্টা করুন</button></div>`;
        }
        this.loading = false;
    },

    estimatePostHeight(post){
        let height = 120;
        if(post.image) height += 180;
        if(post.title) height += Math.ceil(post.title.length / 28) * 26;
        const plainText = (post.content || "").replace(/<[^>]+>/g," ").replace(/\s+/g," ");
        height += Math.ceil(plainText.length / 85) * 18;
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

    async downloadSingleCard(card, title){
        const btn = card.querySelector(".dc-mini-pdf");
        const old = btn? btn.innerHTML : "";
        if(btn){ btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>'; btn.style.pointerEvents='none'; }
        try{
            const fileName = (title || 'post').replace(/[\/\\:*?"<>|]/g,'').substring(0,40) + ".pdf";
            const clone = card.cloneNode(true);
            clone.querySelectorAll(".dc-mini-pdf").forEach(b=>b.remove());
            clone.querySelectorAll("img").forEach(img=>{
                img.setAttribute("crossorigin","anonymous");
                img.style.maxWidth="100%";
            });

            await html2pdf().set({
                margin: 10,
                filename: fileName,
                image: {type:'jpeg', quality:0.92},
                html2canvas: {scale:1.6, useCORS:true, allowTaint:true, backgroundColor:"#fff", logging:false},
                jsPDF: {unit:'mm', format:'a4', orientation:'portrait'}
            }).from(clone).save();

        } catch(e){
            console.error(e);
            try{
                const clone2 = card.cloneNode(true);
                clone2.querySelectorAll("img,.dc-mini-pdf").forEach(el=>el.remove());
                await html2pdf().from(clone2).save();
            }catch(e2){
                alert("PDF তৈরি করা যায়নি।");
            }
        } finally {
            if(btn){ btn.innerHTML = old; btn.style.pointerEvents='auto'; }
        }
    },

    render(){
        const box = document.getElementById("dc-post-columns");
        if(!box) return;
        box.innerHTML = "";
        if(!this.posts.length){
            box.innerHTML = `<div class="dc-empty">এই সপ্তাহে (${this.issue}) কোনো পোস্ট পাওয়া যায়নি।<br>issues.json এ content আছে কিনা চেক করুন।</div>`;
            this.updatePageInfo();
            return;
        }
        const current = this.pages[this.currentPage - 1];
        if(!current ||!current.length){
            box.innerHTML = `<div class="dc-empty">এই পৃষ্ঠায় কোনো পোস্ট নেই।</div>`;
            return;
        }
        current.forEach(post=>{
            const card = document.createElement("article");
            card.className = "dc-post-card";
            let cleanContent = (post.content || post.excerpt || "")
              .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "<br>")
              .replace(/<p>\s*<\/p>/gi, "")
              .replace(/<p>\s*(&nbsp;|\s)*\s*<\/p>/gi, "");
            card.innerHTML = `
                <a href="javascript:void(0)" class="dc-mini-pdf" title="এই লেখার PDF"><i class="fa fa-file-pdf"></i> PDF</a>
                ${post.image? `<img src="${post.image}" alt="${post.title}" loading="lazy" onerror="this.style.display='none'">` : ""}
                <h2>${post.title}</h2>
                ${(post.category || post.author)? `<div class="dc-cat-author">${post.category? 'বিভাগ: '+post.category : ''}${post.category && post.author? ' | ' : ''}${post.author? 'লেখক: '+post.author : ''}</div>` : ""}
                <div class="dc-post-content">${cleanContent}</div>
            `;
            const pdfBtn = card.querySelector(".dc-mini-pdf");
            pdfBtn.addEventListener("click", (e) => {
                e.preventDefault(); e.stopPropagation();
                this.downloadSingleCard(card, post.title);
            });
            box.appendChild(card);
        });
        this.updatePageInfo();
    },

    updatePageInfo(){
        const info = document.getElementById("dc-page-info");
        if(info) info.innerHTML = `পৃষ্ঠা ${this.currentPage} / ${this.totalPages || 1}`;
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
        if(this.isStarting) return;
        this.isStarting = true;
        this.reset();
        await this.loadPosts();
        this.render();
        this.isStarting = false;
    }
};

// নোট: আগে এখানে একটা DOMContentLoaded লিসেনার ছিল যেটা নিজে থেকেই
// DCViewer.init()/start() কল করত। কিন্তু viewer.js ইতিমধ্যেই এটা করে -
// দুটো একসাথে চললে রেস কন্ডিশন তৈরি হয়ে মাঝে মাঝে ভিউয়ার আটকে যেত (যেটা
// W29-তে দেখেছেন)। তাই এই ব্লকটা সম্পূর্ণ সরিয়ে দেওয়া হলো - init/start এখন
// শুধু viewer.js থেকেই হবে।

window.addEventListener("resize",()=>{
    if(window.DCViewer && DCViewer.initialized){
        DCViewer.resize();
    }
});
