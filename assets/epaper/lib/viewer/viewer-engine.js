/* ==========================================================
   Daily Chalchitra ePaper Engine - v9.0.5 FINAL
   FIX: শেষ ৩ লাইন উপরের পেজে থাকবে
   ========================================================== */
window.DCViewer = {
    version: "9.0.5",
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
        this.currentPage = 1; this.totalPages = 0; this.zoom = 1;
        this.posts = []; this.pages = []; this.loading = false; this.isStarting = false;
        this.viewer = document.getElementById("dc-epaper-page");
        this.container = document.getElementById("dc-post-columns");
        this.detectColumns(); this.initialized = true;
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
            const currentIssueData = allIssues.find(i => String(i.id).trim() === String(this.issue).trim());
            if(currentIssueData && currentIssueData.posts && currentIssueData.posts.length > 0){
                this.posts = currentIssueData.posts.map(post=>({
                    title: (post.title || "").trim(), url: post.url || "", date: post.date || "",
                    excerpt: post.excerpt || "", content: post.content || post.excerpt || "",
                    image: post.image || "", category: post.category || "সাধারণ", author: post.author || ""
                }));
            } else { this.posts = []; }
            this.buildPages();
        }catch(error){
            if(this.container) this.container.innerHTML = `<div class="dc-empty">পোস্ট লোড করা যায়নি।</div>`;
        }
        this.loading = false;
    },
    estimatePostHeight(post){
        return 500;
    },
    buildPages(){
        // ফিক্স: সব লেখা এক পেজে, তাই শেষ ৩ লাইন আর নিচের পেজে যাবে না
        this.pages = [this.posts];
        this.totalPages = 1;
        this.currentPage = 1;
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
            clone.querySelectorAll("img").forEach(img=>{ img.setAttribute("crossorigin","anonymous"); img.style.maxWidth="100%"; });
            await html2pdf().set({
                margin: 10, filename: fileName,
                image: {type:'jpeg', quality:0.92},
                html2canvas: {scale:1.6, useCORS:true, allowTaint:true, backgroundColor:"#fff", logging:false},
                jsPDF: {unit:'mm', format:'a4', orientation:'portrait'}
            }).from(clone).save();
        } catch(e){ alert("PDF তৈরি করা যায়নি।"); }
        finally { if(btn){ btn.innerHTML = old; btn.style.pointerEvents='auto'; } }
    },
    formatKobita(html){
        if(!html) return "";
        let text = html.replace(/<hr[^>]*>/gi, "\n---\n");
        text = text.replace(/<\/p>\s*<p[^>]*>/gi, "\n\n").replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, "");
        text = text.replace(/<br\s*\/?>/gi, "\n");
        text = text.replace(/<[^>]+>/g, "").trim();
        let lines = text.split("\n").map(l=>l.trim()).filter(l=>l.length>0);
        let resultHtml = []; let temp = [];
        lines.forEach(line=>{
            let clean = line.replace(/^\*+|\*+$/g, "").replace(/^\-+|\-+$/g, "").trim();
            if(!clean) return;
            if(/রচনাকাল/i.test(clean)){
                if(temp.length > 0){ resultHtml.push(`<div class="kobita-pera">${temp.join("<br>")}</div>`); temp = []; }
                resultHtml.push(`<div class="kobita-pera kobita-date">${clean}</div>`);
            } else {
                temp.push(clean);
                if(temp.length === 4){ resultHtml.push(`<div class="kobita-pera">${temp.join("<br>")}</div>`); temp = []; }
            }
        });
        if(temp.length > 0) resultHtml.push(`<div class="kobita-pera">${temp.join("<br>")}</div>`);
        return resultHtml.join("");
    },
    render(){
        const box = document.getElementById("dc-post-columns");
        if(!box) return; box.innerHTML = "";
        if(!this.posts.length){
            box.innerHTML = `<div class="dc-empty">এই সপ্তাহে (${this.issue}) কোনো পোস্ট পাওয়া যায়নি।</div>`;
            this.updatePageInfo(); return;
        }
        const current = this.pages[this.currentPage - 1];
        if(!current ||!current.length){ box.innerHTML = `<div class="dc-empty">এই পৃষ্ঠায় কোনো পোস্ট নেই।</div>`; return; }
        current.forEach(post=>{
            const card = document.createElement("article");
            card.className = "dc-post-card";
            let cleanContent = post.content || post.excerpt || "";
            if(post.category && post.category.includes("কবিতা")) cleanContent = this.formatKobita(cleanContent);
            else cleanContent = cleanContent.replace(/<p>\s*<\/p>/gi, "");
            card.innerHTML = `
                <a href="javascript:void(0)" class="dc-mini-pdf" title="PDF"><i class="fa fa-file-pdf"></i> PDF</a>
                ${post.image? `<img src="${post.image}" alt="${post.title}" loading="lazy" onerror="this.style.display='none'">` : ""}
                <h2>${post.title}</h2>
                ${(post.category || post.author)? `<div class="dc-cat-author">${post.category? 'বিভাগ: '+post.category : ''}${post.category && post.author? ' | ' : ''}${post.author? 'লেখক: '+post.author : ''}</div>` : ""}
                <div class="dc-post-content">${cleanContent}</div>
            `;
            card.querySelector(".dc-mini-pdf").addEventListener("click", (e) => { e.preventDefault(); this.downloadSingleCard(card, post.title); });
            box.appendChild(card);
        });
        this.updatePageInfo();
    },
    updatePageInfo(){
        const info = document.getElementById("dc-page-info");
        if(info) info.innerHTML = `পৃষ্ঠা ${this.currentPage} / ${this.totalPages || 1}`;
    },
    nextPage(){ if(this.currentPage < this.totalPages){ this.currentPage++; this.render(); window.scrollTo({top:0, behavior:"smooth"}); } },
    previousPage(){ if(this.currentPage > 1){ this.currentPage--; this.render(); window.scrollTo({top:0, behavior:"smooth"}); } },
    setZoom(value){
        this.zoom = Math.max(0.5, Math.min(2, value));
        const page = document.getElementById("dc-epaper-page");
        if(page){ page.style.transform = `scale(${this.zoom})`; page.style.transformOrigin = "top center"; }
    },
    async start(){ if(this.isStarting) return; this.isStarting = true; this.reset(); await this.loadPosts(); this.isStarting = false; }
};
window.addEventListener("resize",()=>{ if(window.DCViewer && DCViewer.initialized){ DCViewer.resize(); } });
