/* ==========================================================
   Daily Chalchitra ePaper Engine - v17.0
   FIX: PDF ক্যাপচারের স্টাইল এখন সম্পূর্ণ self-contained (বাইরের
        epaper.css এর উপর নির্ভর করে না) - CSS ক্যাশ/মিসম্যাচ থেকে
        হওয়া width বাগ স্থায়ীভাবে দূর করার জন্য
   ========================================================== */
window.DCViewer = {
    version: "17.0",
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

    estimatePrintHeight(post){
        let height = 120;
        if(post.image) height += 160;
        if(post.title) height += Math.ceil(post.title.length / 18) * 24;

        const raw = post.content || post.excerpt || "";
        if(this.isKobita(post)){
            const brCount = (raw.match(/<br\s*\/?>/gi) || []).length;
            const pCount = (raw.match(/<\/p>\s*<p[^>]*>/gi) || []).length;
            const lineCount = Math.max(brCount + pCount + 1, 3);
            height += lineCount * 24 + 50;
        } else {
            const plainText = raw.replace(/<[^>]+>/g," ").replace(/\s+/g," ");
            height += Math.ceil(plainText.length / 42) * 18;
        }
        return height;
    },

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
            const btn = card.querySelector(".dc-mini-pdf");
            btn.addEventListener("click", async (e) => {
                e.preventDefault();
                const old = btn.innerHTML;
                btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
                btn.style.pointerEvents = 'none';
                try{
                    await this.downloadSinglePostPDF(post);
                } finally {
                    btn.innerHTML = old;
                    btn.style.pointerEvents = 'auto';
                }
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
                img.addEventListener("load", ()=>resolve(), {once:true});
                img.addEventListener("error", ()=>{ img.remove(); resolve(); }, {once:true});
                setTimeout(()=>{ if(!img.complete){ img.remove(); } resolve(); }, 4000);
            });
        }));
    },

    minimalMaxColumnHeight(heights, numColumns){
        let lo = Math.max(...heights, 1);
        let hi = heights.reduce((a,b)=>a+b, 0) || lo;
        const feasible = (limit) => {
            let cols = 1, cur = 0;
            for(const h of heights){
                if(cur > 0 && cur + h > limit){ cols++; cur = 0; }
                cur += h;
            }
            return cols <= numColumns;
        };
        while(lo < hi){
            const mid = Math.floor((lo + hi) / 2);
            if(feasible(mid)) hi = mid; else lo = mid + 1;
        }
        return lo;
    },

    splitIntoColumns(posts, heights, maxColHeight){
        const columns = [];
        let cur = [], curH = 0;
        for(let i = 0; i < posts.length; i++){
            const h = heights[i];
            if(cur.length && curH + h > maxColHeight){
                columns.push(cur);
                cur = []; curH = 0;
            }
            cur.push(posts[i]);
            curH += h;
        }
        if(cur.length) columns.push(cur);
        return columns;
    },

    buildGridPages(posts){
        if(!posts.length) return [];
        const heights = posts.map(p => this.estimatePrintHeight(p));
        const totalHeight = heights.reduce((a,b)=>a+b, 0);
        const safeColHeight = 1100;

        let pageCount = Math.max(1, Math.ceil(totalHeight / (safeColHeight * 4)));
        let numColumns = pageCount * 4;
        let maxColHeight = this.minimalMaxColumnHeight(heights, numColumns);

        let guard = 0;
        while(maxColHeight > safeColHeight && guard < 15){
            pageCount++;
            numColumns = pageCount * 4;
            maxColHeight = this.minimalMaxColumnHeight(heights, numColumns);
            guard++;
        }

        const columns = this.splitIntoColumns(posts, heights, maxColHeight);
        const gridPages = [];
        for(let i = 0; i < columns.length; i += 4){
            gridPages.push({ type: 'grid', cols: columns.slice(i, i + 4) });
        }
        return gridPages;
    },

    buildPrintPages(posts){
        const source = posts && posts.length ? posts : this.posts;
        if(!source.length) return [];

        const megaThreshold = 2200;
        const printPages = [];
        let batch = [];

        const flushBatch = () => {
            if(!batch.length) return;
            this.buildGridPages(batch).forEach(p => printPages.push(p));
            batch = [];
        };

        source.forEach(post => {
            const h = this.estimatePrintHeight(post);
            if(h > megaThreshold){
                flushBatch();
                printPages.push({ type: 'wide', post });
            } else {
                batch.push(post);
            }
        });
        flushBatch();

        if(printPages.length === 0 && source.length){
            printPages.push({ type: 'wide', post: source[0] });
        }
        return printPages;
    },

    /* ==========================================================
       PDF ক্যাপচারের জন্য সম্পূর্ণ self-contained CSS - বাইরের
       epaper.css এর সাথে কোনো সংঘর্ষ বা ক্যাশ-মিসম্যাচ সমস্যা যাতে
       না হয় তার জন্য প্রতিটা ক্যাপচার-পেজে এই স্টাইলই সরাসরি বসে
       ========================================================== */
    getPrintStyleTag(){
        return `<style>
            .dcp-page{ font-family:'Noto Sans Bengali','Hind Siliguri',Arial,sans-serif; background:#fff; box-sizing:border-box; }
            .dcp-head{ text-align:center; margin-bottom:8px; border-bottom:1.5px solid #000; padding-bottom:8px; }
            .dcp-logo{ display:block; max-width:160px; height:auto; margin:0 auto 6px auto; }
            .dcp-head-info{ display:flex; justify-content:center; gap:16px; flex-wrap:wrap; font-size:13px; color:#333; font-weight:600; }
            .dcp-columns{ display:flex !important; align-items:flex-start; box-sizing:border-box; }
            .dcp-col{ box-sizing:border-box !important; padding:0 12px; overflow:hidden; }
            .dcp-col:not(:first-child){ border-left:1px solid #ccc; }
            .dcp-card{ break-inside:avoid; margin-bottom:10px; border-bottom:1px solid #e5e5e5; padding-bottom:8px; text-align:left; box-sizing:border-box; position:relative; background:#fff; }
            .dcp-card-header{ margin-bottom:6px; }
            .dcp-cover{ width:100%; max-width:100%; aspect-ratio:16/10; object-fit:cover; border-radius:5px; display:block; }
            .dcp-card h2{ font-size:14px; margin:0 0 2px 0; line-height:1.3; font-family:'Noto Serif Bengali',serif; font-weight:700; color:#000; }
            .dcp-cat-author{ font-size:11px; color:#C00000; margin:1px 0 4px 0; border-left:3px solid #C00000; padding-left:6px; font-weight:600; }
            .dcp-date{ font-size:10px; color:#888; margin-bottom:4px; }
            .dcp-content{ font-family:'Noto Serif Bengali',serif; font-size:12px; line-height:1.5; color:#222; }
            .dcp-content p{ margin:0 0 6px 0; padding:0; }
            .dcp-kobita{ display:block; margin:0 0 4px 0; line-height:1.4; }
            .dcp-kobita-date{ display:block; margin-top:4px; font-size:11px; font-style:italic; color:#555; }
        </style>`;
    },

    buildCaptureCardHTML(post){
        let cleanContent = post.content || post.excerpt || "";
        if(this.isKobita(post)){
            cleanContent = this.formatKobitaScoped(cleanContent);
        } else {
            cleanContent = cleanContent.replace(/<p>\s*<\/p>/gi, "");
        }
        const coverImg = post.image
            ? `<img src="${post.image}" alt="${post.title}" class="dcp-cover" crossorigin="anonymous">`
            : '';
        return `
            <div class="dcp-card-header">${coverImg}</div>
            <h2>${post.title}</h2>
            <div class="dcp-cat-author">${post.category ? post.category : ''}${post.author ? ' | লেখক: ' + post.author : ''}</div>
            ${post.date ? `<div class="dcp-date">${post.date}</div>` : ''}
            <div class="dcp-content">${cleanContent}</div>
        `;
    },

    formatKobitaScoped(html){
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
                if(temp.length > 0){ resultHtml.push(`<div class="dcp-kobita">${temp.join("<br>")}</div>`); temp = []; }
                resultHtml.push(`<div class="dcp-kobita dcp-kobita-date">${clean}</div>`);
            } else {
                temp.push(clean);
                if(temp.length === 4){ resultHtml.push(`<div class="dcp-kobita">${temp.join("<br>")}</div>`); temp = []; }
            }
        });
        if(temp.length > 0) resultHtml.push(`<div class="dcp-kobita">${temp.join("<br>")}</div>`);
        return resultHtml.join("");
    },

    async captureElement(pageEl, wrapper, captureWidth){
        wrapper.innerHTML = "";
        wrapper.appendChild(pageEl);
        await this.waitForImages(pageEl);
        await new Promise(r => setTimeout(r, 220));
        return html2canvas(pageEl, {
            scale: 2, useCORS: true, allowTaint: true,
            backgroundColor: "#ffffff", width: captureWidth, windowWidth: captureWidth
        });
    },

    buildHeadHTML(issueMeta, pageNum, totalPages, showHeader){
        if(!showHeader){
            return `<div class="dcp-head"><img src="https://i.postimg.cc/3w757F6N/Daily-Chalchitra.png" class="dcp-logo" crossorigin="anonymous"></div>`;
        }
        return `
            <div class="dcp-head">
                <img src="https://i.postimg.cc/3w757F6N/Daily-Chalchitra.png" class="dcp-logo" crossorigin="anonymous">
                <div class="dcp-head-info">
                    <span>সংখ্যা: ${issueMeta?.week || ""}</span>
                    <span>${issueMeta?.date || ""}</span>
                    <span>পৃষ্ঠা ${pageNum} / ${totalPages}</span>
                </div>
            </div>`;
    },

    async capturePagesToPDF(printPages, issueMeta, fileName){
        if(!printPages.length) return false;
        if(typeof html2canvas === 'undefined' || !window.jspdf){ alert("PDF লাইব্রেরি লোড হয়নি।"); return false; }

        const captureWidth = 1000;
        const innerWidth = captureWidth - 50; // 25px padding দুই পাশে
        const gap = 16;
        const gridColWidth = Math.floor((innerWidth - gap*3) / 4);
        const wideColWidth = innerWidth;

        const host = document.createElement("div");
        host.style.position = "absolute"; host.style.top = "0"; host.style.left = "0";
        host.style.width = "0"; host.style.height = "0"; host.style.overflow = "hidden";
        document.body.appendChild(host);
        const wrapper = document.createElement("div");
        wrapper.style.width = captureWidth + "px";
        host.appendChild(wrapper);

        let success = true;
        try{
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidthMM = pdf.internal.pageSize.getWidth();
            const pageHeightMM = pdf.internal.pageSize.getHeight();
            let addedAnyPage = false;

            for(let i = 0; i < printPages.length; i++){
                const pg = printPages[i];
                const pageEl = document.createElement("div");
                pageEl.className = "dcp-page";
                pageEl.style.cssText = `width:${captureWidth}px;padding:25px;box-sizing:border-box;`;

                const headHTML = this.buildHeadHTML(issueMeta, i+1, printPages.length, true);
                let colsHTML;
                if(pg.type === 'wide'){
                    colsHTML = `<div class="dcp-col" style="flex:0 0 ${wideColWidth}px;width:${wideColWidth}px;">
                        <article class="dcp-card">${this.buildCaptureCardHTML(pg.post)}</article>
                    </div>`;
                } else {
                    colsHTML = pg.cols.map(colPosts => `
                        <div class="dcp-col" style="flex:0 0 ${gridColWidth}px;width:${gridColWidth}px;">
                            ${colPosts.map(post => `<article class="dcp-card">${this.buildCaptureCardHTML(post)}</article>`).join("")}
                        </div>
                    `).join("");
                }

                pageEl.innerHTML = this.getPrintStyleTag() + headHTML +
                    `<div class="dcp-columns" style="gap:${gap}px;">${colsHTML}</div>`;

                const canvas = await this.captureElement(pageEl, wrapper, captureWidth);
                if(!canvas || canvas.width === 0 || canvas.height === 0){
                    console.warn("পেজ", i+1, "ক্যাপচার ব্যর্থ, বাদ দেওয়া হচ্ছে।");
                    continue;
                }

                const imgData = canvas.toDataURL("image/jpeg", 0.95);
                const imgHeightMM = canvas.height * pageWidthMM / canvas.width;

                if(addedAnyPage) pdf.addPage();
                addedAnyPage = true;

                if(imgHeightMM <= pageHeightMM){
                    pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMM, imgHeightMM);
                } else {
                    let heightLeftMM = imgHeightMM, positionMM = 0, first = true;
                    while(heightLeftMM > pageHeightMM * 0.08){
                        if(!first) pdf.addPage();
                        pdf.addImage(imgData, "JPEG", 0, positionMM, pageWidthMM, imgHeightMM);
                        heightLeftMM -= pageHeightMM; positionMM -= pageHeightMM; first = false;
                    }
                }
            }

            if(!addedAnyPage){
                alert("দেখানোর মতো কনটেন্ট পাওয়া যায়নি।");
                success = false;
            } else {
                pdf.save(fileName + ".pdf");
            }
        } catch(e){
            console.error(e);
            alert("PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।");
            success = false;
        } finally {
            host.remove();
        }
        return success;
    },

    async generateFullPDF(issueMeta){
        if(!this.posts.length){ alert("লোড হয়নি, একটু পর চেষ্টা করুন।"); return; }
        const printPages = this.buildPrintPages(this.posts);
        const fileName = (issueMeta?.title || "Daily-Chalchitra-ePaper").replace(/\s+/g,'-');
        await this.capturePagesToPDF(printPages, issueMeta, fileName);
    },

    async downloadCurrentPagePDF(issueMeta){
        const current = this.pages[this.currentPage - 1];
        if(!current || !current.length){ alert("এই পাতায় দেখানোর মতো কিছু নেই।"); return; }
        const printPages = this.buildPrintPages(current);
        const fileName = ((issueMeta?.title || "Daily-Chalchitra") + "-page-" + this.currentPage).replace(/\s+/g,'-');
        await this.capturePagesToPDF(printPages, issueMeta, fileName);
    },

    async downloadSinglePostPDF(post){
        if(typeof html2canvas === 'undefined' || !window.jspdf){ alert("PDF লাইব্রেরি লোড হয়নি।"); return; }

        const captureWidth = 800;
        const colWidth = captureWidth - 50;
        const host = document.createElement("div");
        host.style.position = "absolute"; host.style.top = "0"; host.style.left = "0";
        host.style.width = "0"; host.style.height = "0"; host.style.overflow = "hidden";
        document.body.appendChild(host);
        const wrapper = document.createElement("div");
        wrapper.style.width = captureWidth + "px";
        host.appendChild(wrapper);

        try{
            const pageEl = document.createElement("div");
            pageEl.className = "dcp-page";
            pageEl.style.cssText = `width:${captureWidth}px;padding:25px;box-sizing:border-box;`;
            pageEl.innerHTML = this.getPrintStyleTag() +
                this.buildHeadHTML(null, 1, 1, false) +
                `<div class="dcp-columns"><div class="dcp-col" style="flex:0 0 ${colWidth}px;width:${colWidth}px;">
                    <article class="dcp-card">${this.buildCaptureCardHTML(post)}</article>
                </div></div>`;

            const canvas = await this.captureElement(pageEl, wrapper, captureWidth);
            if(!canvas || canvas.width === 0 || canvas.height === 0){
                alert("PDF তৈরি করা যায়নি।"); return;
            }

            const { jsPDF } = window.jspdf;
            const imgData = canvas.toDataURL("image/jpeg", 0.97);
            const pageWidthMM = 210;
            let contentHeightMM = canvas.height * pageWidthMM / canvas.width;
            const maxHeightMM = 297 * 4;

            const fileName = (post.title || 'post').replace(/[\/\\:*?"<>|]/g,'').substring(0,40) + ".pdf";

            if(contentHeightMM <= maxHeightMM){
                const pdf = new jsPDF({ unit: 'mm', format: [pageWidthMM, Math.max(contentHeightMM, 40)], orientation: 'portrait' });
                pdf.addImage(imgData, "JPEG", 0, 0, pageWidthMM, contentHeightMM);
                pdf.save(fileName);
            } else {
                const pdf = new jsPDF("p", "mm", "a4");
                const pageHeightMM = pdf.internal.pageSize.getHeight();
                let heightLeftMM = contentHeightMM, positionMM = 0, first = true;
                while(heightLeftMM > pageHeightMM * 0.08){
                    if(!first) pdf.addPage();
                    pdf.addImage(imgData, "JPEG", 0, positionMM, pageWidthMM, contentHeightMM);
                    heightLeftMM -= pageHeightMM; positionMM -= pageHeightMM; first = false;
                }
                pdf.save(fileName);
            }
        } catch(e){
            console.error(e);
            alert("PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।");
        } finally {
            host.remove();
        }
    }
};
window.addEventListener("resize",()=>{ if(window.DCViewer && DCViewer.initialized){ DCViewer.resize(); } });
