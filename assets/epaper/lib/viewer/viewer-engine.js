/* ==========================================================
   Daily Chalchitra ePaper Engine - v12.0
   FIX: "পুরো ই-পেপার PDF" এখন সবসময় ৪-কলাম ম্যানুয়াল গ্রিডে রেন্ডার হয়
        (CSS column-count বাদ - html2canvas এ অনির্ভরযোগ্য ছিল)
   FIX: ফাঁকা সাদা পেজ বাগ - ক্যাপচার wrapper পজিশনিং বদলানো হয়েছে
   ========================================================== */
window.DCViewer = {
    version: "12.0",
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
    resize(){ this.detectColumns(); this.render(); },
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
                    image: post.image || "", category: post.category || "সাধারণ", author: post.author || "",
                    tags: post.tags || []
                }));
            } else { this.posts = []; }
            this.buildPages();
        }catch(error){
            if(this.container) this.container.innerHTML = `<div class="dc-empty">পোস্ট লোড করা যায়নি।</div>`;
            console.error(error);
        }
        this.loading = false;
    },

    isKobita(post){
        if(post.category && post.category.includes("কবিতা")) return true;
        if(Array.isArray(post.tags)) return post.tags.some(t => (t||"").includes("কবিতা"));
        return false;
    },
    estimatePostHeight(post){
        let height = 140;
        if(post.image) height += 200;
        if(post.title) height += Math.ceil(post.title.length / 26) * 30;
        const plainText = (post.content || "").replace(/<[^>]+>/g," ").replace(/\s+/g," ");
        if(this.isKobita(post)){
            height += Math.ceil(plainText.length / 45) * 22 + 80;
        } else {
            height += Math.ceil(plainText.length / 85) * 18;
        }
        return height;
    },

    /* ===== অন-স্ক্রিন রিডিং পেজিনেশন (আগের মতোই - এতে হাত দেওয়া হয়নি) ===== */
    buildPages(){
        this.pages = [];
        if(!this.posts.length){ this.totalPages = 0; this.currentPage = 1; this.render(); return; }

        const idealPageHeight = 1950;
        const heights = this.posts.map(p => this.estimatePostHeight(p));
        const totalHeight = heights.reduce((a,b)=>a+b, 0);

        let pageCount = Math.max(1, Math.round(totalHeight / idealPageHeight));
        const targetHeight = totalHeight / pageCount;

        let page = [], used = 0;
        for(let i = 0; i < this.posts.length; i++){
            const post = this.posts[i];
            const h = heights[i];
            const remainingPagesNeeded = pageCount - this.pages.length;

            if(used + h > targetHeight && page.length > 0 && remainingPagesNeeded > 1){
                this.pages.push([...page]);
                page = []; used = 0;
            }
            page.push(post);
            used += h;
        }
        if(page.length) this.pages.push(page);

        this.totalPages = this.pages.length;
        if(this.currentPage > this.totalPages || this.currentPage < 1) this.currentPage = 1;
        this.render();
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

    buildCardHTML(post, withPdfBtn){
        let cleanContent = post.content || post.excerpt || "";
        if(this.isKobita(post)) cleanContent = this.formatKobita(cleanContent);
        else cleanContent = cleanContent.replace(/<p>\s*<\/p>/gi, "");

        const coverImg = post.image
            ? `<img src="${post.image}" alt="${post.title}" class="dc-post-card-cover" crossorigin="anonymous">`
            : '';

        return `
            ${withPdfBtn ? `<a href="javascript:void(0)" class="dc-mini-pdf" title="PDF"><i class="fa fa-file-pdf"></i> PDF</a>` : ''}
            <div class="dc-post-card-header">${coverImg}</div>
            <div class="dc-post-card-meta">
                <h2>${post.title}</h2>
                <div class="dc-cat-author">
                    ${post.category ? post.category : ''}
                    ${post.author ? ' | লেখক: ' + post.author : ''}
                </div>
                ${post.date ? `<div class="dc-post-date">${post.date}</div>` : ''}
            </div>
            <div class="dc-post-content">${cleanContent}</div>
        `;
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

    render(){
        const box = document.getElementById("dc-post-columns");
        if(!box) return; box.innerHTML = "";
        if(!this.posts.length){
            box.innerHTML = `<div class="dc-empty">এই সপ্তাহে কোনো পোস্ট পাওয়া যায়নি।</div>`;
            this.updatePageInfo(); return;
        }
        const current = this.pages[this.currentPage - 1];
        if(!current || !current.length){
            box.innerHTML = `<div class="dc-empty">পোস্ট নেই।</div>`; return;
        }

        const totalLength = current.reduce((sum, p) =>
            sum + (p.content || p.excerpt || "").replace(/<[^>]+>/g,'').length, 0);

        let cols = this.columnCount;
        if(current.length === 1) cols = 1;
        else if(current.length === 2) cols = Math.min(cols, 2);
        if(totalLength < 900) cols = 1;

        box.style.columnCount = cols;
        box.classList.toggle('dc-short-page', totalLength < 900 || current.length === 1);

        current.forEach(post => {
            const card = document.createElement("article");
            card.className = "dc-post-card";
            card.innerHTML = this.buildCardHTML(post, true);
            card.querySelector(".dc-mini-pdf").addEventListener("click", (e) => {
                e.preventDefault();
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
    nextPage(){ if(this.currentPage < this.totalPages){ this.currentPage++; this.render(); window.scrollTo({top:0, behavior:"smooth"}); } },
    previousPage(){ if(this.currentPage > 1){ this.currentPage--; this.render(); window.scrollTo({top:0, behavior:"smooth"}); } },
    setZoom(value){
        this.zoom = Math.max(0.5, Math.min(2, value));
        const page = document.getElementById("dc-epaper-page");
        if(page){ page.style.transform = `scale(${this.zoom})`; page.style.transformOrigin = "top center"; }
    },
    async start(){ if(this.isStarting) return; this.isStarting = true; this.reset(); await this.loadPosts(); this.isStarting = false; },

    waitForImages(el){
        const imgs = el.querySelectorAll("img");
        return Promise.all(Array.from(imgs).map(img=>{
            if(img.complete && img.naturalWidth > 0) return Promise.resolve();
            return new Promise(resolve=>{
                const done = ()=>resolve();
                img.addEventListener("load", done, {once:true});
                img.addEventListener("error", ()=>{ img.remove(); resolve(); }, {once:true});
                setTimeout(()=>{ if(!img.complete){ img.remove(); } resolve(); }, 4000);
            });
        }));
    },

    /* ==========================================================
       পোস্টগুলোকে ক্রম ঠিক রেখে "কলাম" এ ভাগ করে - প্রতিটা কলামের
       উচ্চতা সর্বোচ্চ targetColHeight পর্যন্ত ভরে তারপর পরের কলামে যায়।
       ছোট লেখা হলে তার নিচেই পরের লেখা বসে যাবে (ফাঁকা জায়গা থাকবে না)।
       ========================================================== */
    splitIntoColumns(posts, heights, targetColHeight){
        const columns = [];
        let cur = [], curH = 0;
        for(let i = 0; i < posts.length; i++){
            const h = heights[i];
            if(cur.length && curH + h > targetColHeight){
                columns.push(cur);
                cur = []; curH = 0;
            }
            cur.push(posts[i]);
            curH += h;
        }
        if(cur.length) columns.push(cur);
        return columns;
    },

    // পুরো সপ্তাহের সব লেখা সবসময় ৪-কলাম গ্রিডে ভাগ করে, যতগুলো পেজ প্রয়োজন ততগুলো তৈরি করে
    buildPrintPages(){
        const heights = this.posts.map(p => this.estimatePostHeight(p));
        const targetColHeight = 1550; // একটা কলামের সর্বোচ্চ ধারণক্ষমতা (px)
        const columns = this.splitIntoColumns(this.posts, heights, targetColHeight);

        const printPages = [];
        for(let i = 0; i < columns.length; i += 4){
            printPages.push(columns.slice(i, i + 4)); // প্রতিটা পেজে সর্বোচ্চ ৪টা কলাম
        }
        if(printPages.length === 0 && this.posts.length){
            printPages.push([this.posts]);
        }
        return printPages;
    },

    // পুরো সপ্তাহের সব পাতা ক্যাপচার করে একটাই multi-page PDF বানায় - সবসময় ৪-কলাম লেআউটে
    async generateFullPDF(issueMeta){
        if(!this.posts.length){ alert("লোড হয়নি, একটু পর চেষ্টা করুন।"); return; }
        if(typeof html2canvas === 'undefined' || !window.jspdf){ alert("PDF লাইব্রেরি লোড হয়নি।"); return; }

        const printPages = this.buildPrintPages();
        if(!printPages.length){ alert("দেখানোর মতো কোনো লেখা পাওয়া যায়নি।"); return; }

        const captureWidth = 1000;
        const host = document.createElement("div");
        host.style.position = "absolute";
        host.style.top = "0"; host.style.left = "0";
        host.style.width = "0"; host.style.height = "0";
        host.style.overflow = "hidden";
        document.body.appendChild(host);

        const wrapper = document.createElement("div");
        wrapper.style.width = captureWidth + "px";
        host.appendChild(wrapper);

        try{
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidthMM = pdf.internal.pageSize.getWidth();
            const pageHeightMM = pdf.internal.pageSize.getHeight();

            for(let i = 0; i < printPages.length; i++){
                const pageEl = document.createElement("div");
                pageEl.className = "dc-capture-page";
                pageEl.style.width = captureWidth + "px";

                const headHTML = `
                    <div class="dc-paper-head">
                        <img src="https://i.postimg.cc/3w757F6N/Daily-Chalchitra.png" class="dc-paper-logo" crossorigin="anonymous">
                        <div class="dc-paper-head-info">
                            <span>সংখ্যা: ${issueMeta?.week || ""}</span>
                            <span>${issueMeta?.date || ""}</span>
                            <span>পৃষ্ঠা ${i+1} / ${printPages.length}</span>
                        </div>
                    </div>`;

                const cols = printPages[i];
                const colsHTML = cols.map(colPosts => `
                    <div class="dc-print-col">
                        ${colPosts.map(post => `<article class="dc-post-card">${this.buildCardHTML(post, false)}</article>`).join("")}
                    </div>
                `).join("");

                pageEl.innerHTML = headHTML + `<div class="dc-print-columns">${colsHTML}</div>`;
                wrapper.innerHTML = "";
                wrapper.appendChild(pageEl);

                await this.waitForImages(pageEl);
                await new Promise(r => setTimeout(r, 250));

                const canvas = await html2canvas(pageEl, {
                    scale: 2, useCORS: true, allowTaint: true,
                    backgroundColor: "#ffffff", width: captureWidth,
                    windowWidth: captureWidth
                });

                if(!canvas || canvas.width === 0 || canvas.height === 0){
                    console.warn("পেজ", i+1, "ক্যাপচার ব্যর্থ হয়েছে, বাদ দেওয়া হচ্ছে।");
                    continue;
                }

                const imgData = canvas.toDataURL("image/jpeg", 0.95);
                const imgHeightMM = canvas.height * pageWidthMM / canvas.width;

                if(i > 0) pdf.addPage();

                if(imgHeightMM <= pageHeightMM){
                    pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMM, imgHeightMM);
                } else {
                    let heightLeftMM = imgHeightMM;
                    let positionMM = 0;
                    let first = true;
                    while(heightLeftMM > 0){
                        if(!first) pdf.addPage();
                        pdf.addImage(imgData, "JPEG", 0, positionMM, pageWidthMM, imgHeightMM);
                        heightLeftMM -= pageHeightMM;
                        positionMM -= pageHeightMM;
                        first = false;
                    }
                }
            }

            const fileName = (issueMeta?.title || "Daily-Chalchitra-ePaper").replace(/\s+/g,'-') + ".pdf";
            pdf.save(fileName);

        } catch(e){
            console.error(e);
            alert("PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।");
        } finally {
            host.remove();
        }
    }
};
window.addEventListener("resize",()=>{ if(window.DCViewer && DCViewer.initialized){ DCViewer.resize(); } });
