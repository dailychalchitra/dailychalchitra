/* ==========================================================
   Daily Chalchitra ePaper Engine - v32.0
   FIX: height measurement এখন চূড়ান্ত রেন্ডার-প্রস্থ ও ফন্ট-ক্লাস
        অনুযায়ী iterative ভাবে করা হয়, যাতে কলাম-সংখ্যা ও পেজ-ভরাট
        সঠিক থাকে (আগে narrow-width মাপ দিয়ে wide-column রেন্ডার
        হওয়ায় নিচে ফাঁকা থেকে যাচ্ছিল)
   ========================================================== */
window.DCViewer = {
    version: "32.0",
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
    categoryColorMap: {},
    categoryColorIndex: 0,

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

    // প্রতিটা নতুন ক্যাটাগরিকে প্যালেটের পরবর্তী রঙ দেওয়া হয়, একই
    // ক্যাটাগরি সবসময় একই রঙ পায়
    getCategoryColor(category){
        const palette = [
            "#C0392B", "#2980B9", "#27AE60", "#8E44AD",
            "#D35400", "#16A085", "#E67E22", "#2C3E50",
            "#7D3C98", "#1F618D", "#AF601A", "#117864"
        ];
        const key = category || "সাধারণ";
        if(this.categoryColorMap[key]) return this.categoryColorMap[key];
        const color = palette[this.categoryColorIndex % palette.length];
        this.categoryColorMap[key] = color;
        this.categoryColorIndex++;
        return color;
    },

    buildHeaderChunkHTML(post){
        const coverImg = post.image
            ? `<img src="${post.image}" alt="${post.title}" class="dcp-cover" crossorigin="anonymous">`
            : '';
        const catColor = this.getCategoryColor(post.category);
        const catBadge = post.category
            ? `<span class="dcp-cat-badge" style="background:${catColor};">${post.category}</span>`
            : '';
        const authorText = post.author ? ' লেখক: ' + post.author : '';
        return `<div class="dcp-art-start">
            <div class="dcp-card-header">${coverImg}</div>
            <h2>${post.title}</h2>
            <div class="dcp-cat-author">${catBadge}${authorText ? `<span class="dcp-author-text">${authorText}</span>` : ''}</div>
            ${post.date ? `<div class="dcp-date">${post.date}</div>` : ''}
        </div>`;
    },

    getProseParagraphChunks(html){
        let cleaned = (html || "").replace(/<p>\s*<\/p>/gi, "");
        const parts = cleaned.split(/(?=<p[^>]*>)/i).map(s=>s.trim()).filter(Boolean);
        const list = parts.length ? parts : (cleaned.trim() ? [cleaned] : []);
        return list.map(p => ({ html: `<div class="dcp-content">${p}</div>`, height: 0 }));
    },

    getKobitaChunks(html){
        if(!html) return [];
        let text = html.replace(/<hr[^>]*>/gi, "\n---\n");
        text = text.replace(/<\/p>\s*<p[^>]*>/gi, "\n\n").replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, "");
        text = text.replace(/<br\s*\/?>/gi, "\n");
        text = text.replace(/<[^>]+>/g, "").trim();
        let lines = text.split("\n").map(l=>l.trim()).filter(l=>l.length>0);
        const chunks = []; let temp = [];
        const flush = () => {
            if(temp.length){
                chunks.push({ html: `<div class="dcp-content"><div class="dcp-kobita">${temp.join("<br>")}</div></div>`, height: 0 });
                temp = [];
            }
        };
        lines.forEach(line=>{
            let clean = line.replace(/^\*+|\*+$/g, "").replace(/^\-+|\-+$/g, "").trim();
            if(!clean) return;
            if(/রচনাকাল/i.test(clean)){
                flush();
                chunks.push({ html: `<div class="dcp-content"><div class="dcp-kobita dcp-kobita-date">${clean}</div></div>`, height: 0 });
            } else {
                temp.push(clean);
                if(temp.length === 4) flush();
            }
        });
        flush();
        return chunks;
    },

    splitPostIntoChunks(post){
        const raw = post.content || post.excerpt || "";
        const bodyChunks = this.isKobita(post) ? this.getKobitaChunks(raw) : this.getProseParagraphChunks(raw);
        const headerHTML = this.buildHeaderChunkHTML(post);

        if(bodyChunks.length){
            bodyChunks[0] = { html: headerHTML + bodyChunks[0].html, height: 0 };
        } else {
            bodyChunks.push({ html: headerHTML, height: 0 });
        }

        return bodyChunks.map((c, idx) => ({ ...c, post, isPostFirst: idx === 0 }));
    },

    // প্রতিটা চাংক আসল ব্রাউজারে, চূড়ান্ত রেন্ডারে যে প্রস্থ ও ফন্ট-ক্লাস
    // ব্যবহার হবে ঠিক সেটাতেই রেন্ডার করে height মাপা হয় - অনুমান না,
    // সরাসরি ও যথাযথ মাপ
    async measureChunkHeights(chunks, colWidth, colClass){
        const host = document.createElement("div");
        host.style.position = "absolute"; host.style.left = "-99999px"; host.style.top = "0";
        host.style.width = colWidth + "px"; host.style.visibility = "hidden";
        document.body.appendChild(host);
        host.innerHTML = this.getPrintStyleTag();

        const measureDiv = document.createElement("div");
        measureDiv.className = colClass || 'dcp-col';
        measureDiv.style.cssText = `width:${colWidth}px;box-sizing:border-box;`;
        host.appendChild(measureDiv);

        for(const chunk of chunks){
            measureDiv.innerHTML = chunk.html;
            chunk.height = measureDiv.offsetHeight || 40;
        }
        host.remove();
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

    splitChunksIntoColumns(chunks, heights, maxColHeight, numColumns){
        const columns = [];
        let cur = [], curH = 0;
        for(let i = 0; i < chunks.length; i++){
            const h = heights[i];
            const remainingSlots = numColumns - columns.length - 1;
            const wouldOverflow = cur.length && curH + h > maxColHeight;
            if(wouldOverflow && remainingSlots > 0){
                columns.push(cur);
                cur = []; curH = 0;
            }
            cur.push(chunks[i]);
            curH += h;
        }
        if(cur.length) columns.push(cur);
        return columns;
    },

    getGridColWidth(){
        const captureWidth = 1000, innerWidth = captureWidth - 50, gap = 16;
        return Math.floor((innerWidth - gap * 3) / 4);
    },

    // ধারাবাহিক প্রবাহ: প্রতিটা কলাম নিজের সর্বোচ্চ ধারণক্ষমতা
    // (safeColHeight) পর্যন্ত ভরাট হয়, তারপরই লেখা পরের কলামে যায়
    layoutGridPages(chunks, minColumns = 1){
        if(!chunks.length) return { pages: [], totalColumns: 0 };
        const heights = chunks.map(c => c.height);
        const safeColHeight = 1150;

        let columns;
        if(minColumns > 1){
            let numColumns = minColumns;
            let maxColHeight = this.minimalMaxColumnHeight(heights, numColumns);
            let guard = 0;
            while(maxColHeight > safeColHeight && guard < 40){
                numColumns++;
                maxColHeight = this.minimalMaxColumnHeight(heights, numColumns);
                guard++;
            }
            columns = this.splitChunksIntoColumns(chunks, heights, maxColHeight, numColumns);
        } else {
            columns = this.splitChunksIntoColumns(chunks, heights, safeColHeight, Infinity);
        }

        columns.forEach(col => {
            if(col.length && !col[0].isPostFirst){
                col[0] = {
                    ...col[0],
                    html: `<div class="dcp-continued">— ${col[0].post.title} (চলছে) —</div>` + col[0].html
                };
            }
        });

        const gridPages = [];
        for(let i = 0; i < columns.length; i += 4){
            gridPages.push({ type: 'grid', cols: columns.slice(i, i + 4) });
        }
        return { pages: gridPages, totalColumns: columns.length };
    },

    // যে প্রস্থ ও ফন্ট-ক্লাসে চূড়ান্ত রেন্ডার হবে, iterative ভাবে ঠিক
    // সেটাতেই height মেপে লে-আউট করা হয় (একবার মাপা আর একবার রেন্ডারের
    // প্রস্থ আলাদা হলে page ভরাট/কলাম-সংখ্যা ভুল হয়ে যেত)
    async buildPrintPages(posts, minColumns = 1){
        const source = posts && posts.length ? posts : this.posts;
        if(!source.length) return { pages: [], totalColumns: 0 };
        const chunks = [];
        source.forEach(p => chunks.push(...this.splitPostIntoChunks(p)));
        if(!chunks.length) return { pages: [], totalColumns: 0 };

        const captureWidth = 1000, gap = 16;
        let numColsGuess = 4;
        let result = { pages: [], totalColumns: 0 };

        for(let iter = 0; iter < 5; iter++){
            const { width: colWidth, cls: colClass } = this.getColWidthAndClass(numColsGuess, captureWidth, gap);
            await this.measureChunkHeights(chunks, colWidth, colClass);
            result = this.layoutGridPages(chunks, minColumns);
            const nextNumCols = result.totalColumns > 0 ? Math.min(result.totalColumns, 4) : 1;
            if(nextNumCols === numColsGuess) break;
            numColsGuess = nextNumCols;
        }
        return result;
    },

    // ধূসর ফার্ন-পাতা - CSS ব্যাকগ্রাউন্ডের বদলে সরাসরি <img> হিসেবে
    // বসানো হয় (html2canvas-এ এটা অনেক বেশি নির্ভরযোগ্য)
    fernLeafDataUri(rot){
        const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='95' height='75' viewBox='0 0 95 75'>" +
            "<g transform='rotate(" + rot + " 47 37)' opacity='0.6'>" +
            "<line x1='12' y1='64' x2='74' y2='12' stroke='%239a9a9a' stroke-width='2'/>" +
            "<ellipse cx='26' cy='50' rx='9' ry='4' fill='%23aaaaaa' transform='rotate(-40 26 50)'/>" +
            "<ellipse cx='38' cy='40' rx='9' ry='4' fill='%23b8b8b8' transform='rotate(-40 38 40)'/>" +
            "<ellipse cx='50' cy='30' rx='9' ry='4' fill='%23aaaaaa' transform='rotate(-40 50 30)'/>" +
            "<ellipse cx='61' cy='20' rx='8' ry='3.5' fill='%23b8b8b8' transform='rotate(-40 61 20)'/>" +
            "<circle cx='71' cy='14' r='3' fill='%23e08283' opacity='0.65'/>" +
            "</g></svg>";
        return "data:image/svg+xml;utf8," + svg;
    },

    // হালকা রঙিন ফুল - পাতার মাঝে মাঝে বসিয়ে সৌন্দর্য বাড়ানো হয়
    flowerDataUri(rot){
        const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'>" +
            "<g transform='rotate(" + rot + " 30 30)'>" +
            "<circle cx='30' cy='15' r='8' fill='%23c9b8d6'/>" +
            "<circle cx='45' cy='30' r='8' fill='%23b8cdd6'/>" +
            "<circle cx='30' cy='45' r='8' fill='%23d6c8b8'/>" +
            "<circle cx='15' cy='30' r='8' fill='%23c3d6b8'/>" +
            "<circle cx='30' cy='30' r='7' fill='%23e0a95f'/>" +
            "</g></svg>";
        return "data:image/svg+xml;utf8," + svg;
    },

    // পাতার চারপাশ জুড়ে (চার কোণ + চার ধার বরাবর সারিবদ্ধ) পাতা ও ফুল
    buildLeafOverlayHTML(){
        const leaf = (rot) => this.fernLeafDataUri(rot);
        const flower = (rot) => this.flowerDataUri(rot);
        const imgs = [];

        const corners = [
            { style:"top:-10px; left:-10px;", rot:45 },
            { style:"top:-10px; right:-10px;", rot:135 },
            { style:"bottom:-10px; left:-10px;", rot:-45 },
            { style:"bottom:-10px; right:-10px;", rot:-135 }
        ];
        corners.forEach(c => imgs.push(`<img class="dcp-leaf-corner" src="${leaf(c.rot)}" style="${c.style}">`));

        const topCount = 8;
        for(let i=1;i<topCount-1;i++){
            const pct = (i/(topCount-1))*100;
            const isFlower = i % 2 === 0;
            const topSrc = isFlower ? flower(0) : leaf(90);
            const botSrc = isFlower ? flower(180) : leaf(-90);
            imgs.push(`<img class="dcp-leaf-edge" src="${topSrc}" style="top:-8px; left:${pct}%; transform:translateX(-50%);">`);
            imgs.push(`<img class="dcp-leaf-edge" src="${botSrc}" style="bottom:-8px; left:${pct}%; transform:translateX(-50%);">`);
        }

        const sideCount = 7;
        for(let i=1;i<sideCount-1;i++){
            const pct = (i/(sideCount-1))*100;
            const isFlower = i % 2 === 0;
            const leftSrc = isFlower ? flower(90) : leaf(0);
            const rightSrc = isFlower ? flower(-90) : leaf(180);
            imgs.push(`<img class="dcp-leaf-edge" src="${leftSrc}" style="left:-8px; top:${pct}%; transform:translateY(-50%);">`);
            imgs.push(`<img class="dcp-leaf-edge" src="${rightSrc}" style="right:-8px; top:${pct}%; transform:translateY(-50%);">`);
        }

        return `<div class="dcp-leaf-layer">${imgs.join("")}</div>`;
    },

    getPrintStyleTag(){
        return `<style>
            .dcp-page{
              font-family:'Noto Sans Bengali','Hind Siliguri',Arial,sans-serif; box-sizing:border-box;
              position:relative; overflow:hidden;
              background-color:#ffffff;
              background-image:
                linear-gradient(135deg, rgba(0,0,0,0.012) 0%, transparent 15%, rgba(0,0,0,0.008) 30%, transparent 45%, rgba(0,0,0,0.012) 60%, transparent 75%, rgba(0,0,0,0.008) 90%, transparent 100%);
              border:2px solid #C00000;
              outline:1px solid #C00000;
              outline-offset:-6px;
            }
            .dcp-page::before{
              content:""; position:absolute; inset:10px; z-index:0;
              border:1px solid #d8b98a; pointer-events:none;
            }
            .dcp-corner{
              position:absolute; width:26px; height:26px; z-index:2; pointer-events:none;
              border-color:#C00000;
            }
            .dcp-corner-tl{ top:6px; left:6px; border-top:3px solid; border-left:3px solid; }
            .dcp-corner-tr{ top:6px; right:6px; border-top:3px solid; border-right:3px solid; }
            .dcp-corner-bl{ bottom:6px; left:6px; border-bottom:3px solid; border-left:3px solid; }
            .dcp-corner-br{ bottom:6px; right:6px; border-bottom:3px solid; border-right:3px solid; }

            .dcp-leaf-layer{ position:absolute; inset:0; pointer-events:none; z-index:0; }
            .dcp-leaf-corner{ position:absolute; width:95px; height:75px; opacity:0.45; }
            .dcp-leaf-edge{ position:absolute; width:52px; height:42px; opacity:0.4; }

            .dcp-head{
              position:relative; z-index:1; display:table; width:100%; table-layout:fixed;
              margin:4px 0 12px 0; padding:10px 10px 12px;
              border-bottom:3px double #C00000;
              background:linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.55));
              border-radius:6px 6px 0 0;
            }
            .dcp-head-left, .dcp-head-right{
              display:table-cell; width:150px; font-size:9px; line-height:1.65; color:#444; font-weight:600; vertical-align:middle;
            }
            .dcp-head-right{ text-align:right; }
            .dcp-head-center{ display:table-cell; text-align:center; vertical-align:middle; }
            .dcp-logo{ display:inline-block; max-width:150px; height:auto; filter:drop-shadow(0 1px 1px rgba(0,0,0,0.15)); }
            .dcp-tagline{
              display:block; text-align:center; font-size:9px; letter-spacing:3px; color:#C00000;
              font-weight:700; margin-top:4px;
            }

            .dcp-columns{ position:relative; z-index:1; display:flex !important; align-items:flex-start; justify-content:center; box-sizing:border-box; padding:0 6px 10px; }
            .dcp-col{ box-sizing:border-box !important; padding:0 12px; overflow:hidden; }
            .dcp-col:not(:first-child){ border-left:1px dashed #c9a877; }

            .dcp-cover{ width:100%; height:130px; object-fit:cover; border-radius:5px; display:block; border:1px solid #e3d5b8; }

            /* সোলো (মোট ১-কলাম নথি) - সরু, কেন্দ্রীভূত, বড় ফন্ট */
            .dcp-col-solo{ font-size:16px !important; line-height:1.85 !important; border-left:none !important; text-align:justify; }
            .dcp-col-solo .dcp-content{ font-size:16px !important; line-height:1.85 !important; text-align:justify; }
            .dcp-col-solo .dcp-art-start h2{ font-size:20px !important; }
            .dcp-col-solo .dcp-kobita{ margin-bottom:8px !important; }
            .dcp-col-solo .dcp-cover{ width:100%; height:280px; object-fit:cover; object-position:center 20%; }

            .dcp-col-duo{ font-size:14px !important; line-height:1.7 !important; text-align:justify; }
            .dcp-col-duo .dcp-content{ font-size:14px !important; line-height:1.7 !important; text-align:justify; }
            .dcp-col-duo .dcp-art-start h2{ font-size:16px !important; }
            .dcp-col-duo .dcp-cover{ width:100%; height:200px; object-fit:cover; object-position:center 20%; }

            .dcp-col-tri{ font-size:13px !important; line-height:1.6 !important; }
            .dcp-col-tri .dcp-content{ font-size:13px !important; line-height:1.6 !important; }
            .dcp-col-tri .dcp-art-start h2{ font-size:15px !important; }
            .dcp-col-tri .dcp-cover{ height:170px !important; object-position:center 20%; }

            .dcp-art-start{
              border:1px solid #e3d5b8; border-radius:6px;
              padding:10px; margin:8px 3px 12px 3px;
              background:rgba(255,255,255,0.72);
              box-shadow:0 2px 5px rgba(0,0,0,0.05);
            }
            .dcp-col > .dcp-art-start:first-child{ margin-top:2px; }
            .dcp-card-header{ margin-bottom:6px; }
            .dcp-art-start h2{
              font-size:14px; margin:0 0 4px 0; line-height:1.3;
              font-family:'Noto Serif Bengali',serif; font-weight:700; color:#111;
              border-bottom:1px solid #eee; padding-bottom:4px;
            }
            .dcp-cat-author{ margin:2px 0 4px 0; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
            .dcp-cat-badge{ color:#fff; font-size:10px; font-weight:700; padding:2px 8px; border-radius:3px; display:inline-block; box-shadow:0 1px 2px rgba(0,0,0,0.15); }
            .dcp-author-text{ font-size:11px; color:#555; font-weight:600; }
            .dcp-date{ font-size:10px; color:#888; margin-bottom:4px; }
            .dcp-content{ font-family:'Noto Serif Bengali',serif; font-size:12px; line-height:1.5; color:#222; }
            .dcp-content p{ margin:0 0 6px 0; padding:0; }
            .dcp-kobita{ display:block; margin:0 0 4px 0; line-height:1.4; }
            .dcp-kobita-date{ display:block; margin-top:4px; font-size:11px; font-style:italic; color:#555; }
            .dcp-continued{ font-size:10.5px; font-style:italic; color:#888; margin-bottom:4px; }

            .dcp-footer{
              position:relative; z-index:1; text-align:center; font-size:9px; color:#999;
              border-top:1px solid #e3d5b8; padding-top:6px; margin-top:4px;
            }
        </style>`;
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

    buildHeadHTML(issueMeta, pageNum, totalPages){
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const dateStr = issueMeta?.date || (pad(now.getDate()) + "-" + pad(now.getMonth()+1) + "-" + now.getFullYear());
        const timeStr = pad(now.getHours()) + ":" + pad(now.getMinutes());
        const detailStr = issueMeta?.title || 'ই-পেপার সংস্করণ';
        return `
            <div class="dcp-corner dcp-corner-tl"></div>
            <div class="dcp-corner dcp-corner-tr"></div>
            <div class="dcp-corner dcp-corner-bl"></div>
            <div class="dcp-corner dcp-corner-br"></div>
            ${this.buildLeafOverlayHTML()}
            <div class="dcp-head">
                <div class="dcp-head-left">
                    <div>তারিখ: ${dateStr}</div>
                    <div>সময়: ${timeStr}</div>
                    <div>বিস্তারিত: ${detailStr}</div>
                </div>
                <div class="dcp-head-center">
                    <img src="https://i.postimg.cc/3w757F6N/Daily-Chalchitra.png" class="dcp-logo" crossorigin="anonymous">
                    <span class="dcp-tagline">সত্য প্রকাশে নির্ভীক কণ্ঠস্বর</span>
                </div>
                <div class="dcp-head-right">
                    <div>সংখ্যা: ${issueMeta?.week || ""}</div>
                    <div>পৃষ্ঠা: ${pageNum} / ${totalPages}</div>
                </div>
            </div>`;
    },

    // numColsOnPage অনুযায়ী কলাম-প্রস্থ ও স্টাইল ঠিক করে
    getColWidthAndClass(numColsOnPage, captureWidth, gap){
        const innerWidth = captureWidth - 50;
        if(numColsOnPage <= 1){
            const width = Math.floor(innerWidth * 0.62);
            return { width, cls: 'dcp-col dcp-col-solo' };
        }
        const width = Math.floor((innerWidth - gap * (numColsOnPage - 1)) / numColsOnPage);
        let extraClass = '';
        if(numColsOnPage === 2) extraClass = ' dcp-col-duo';
        else if(numColsOnPage === 3) extraClass = ' dcp-col-tri';
        return { width, cls: 'dcp-col' + extraClass };
    },

    async capturePagesToPDF(printPages, issueMeta, fileName, totalColumns){
        if(!printPages.length) return false;
        if(typeof html2canvas === 'undefined' || !window.jspdf){ alert("PDF লাইব্রেরি লোড হয়নি।"); return false; }

        const captureWidth = 1000;
        const gap = 16;
        const a4Ratio = 297 / 210; // A4 height/width অনুপাত
        const minHeightPx = Math.round(captureWidth * a4Ratio); // ছোট পোস্টেও ফুল A4-height ব্যাকগ্রাউন্ড

        // পুরো ডকুমেন্টের সব পাতায় একই কলাম-প্রস্থ/স্টাইল ব্যবহার করা
        // হয় যাতে শেষ পাতায় বাকি থাকা ১-২টা কলাম অসামঞ্জস্যপূর্ণভাবে
        // পুরো-পাতা-প্রস্থ না হয়ে যায়
        const numColsForWidth = totalColumns > 0 ? Math.min(totalColumns, 4) : 1;
        const { width: colWidth, cls: colClass } = this.getColWidthAndClass(numColsForWidth, captureWidth, gap);

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
                pageEl.style.cssText = `width:${captureWidth}px;min-height:${minHeightPx}px;padding:34px;box-sizing:border-box;`;

                const headHTML = this.buildHeadHTML(issueMeta, i+1, printPages.length);

                const colsHTML = pg.cols.map(colChunks => `
                    <div class="${colClass}" style="flex:0 0 ${colWidth}px;width:${colWidth}px;">
                        ${colChunks.map(c => c.html).join("")}
                    </div>
                `).join("");

                pageEl.innerHTML = this.getPrintStyleTag() + headHTML +
                    `<div class="dcp-columns" style="gap:${gap}px;">${colsHTML}</div>` +
                    `<div class="dcp-footer">দৈনিক চালচিত্র &nbsp;•&nbsp; www.dailychalchitra.com</div>`;

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
        const { pages: printPages, totalColumns } = await this.buildPrintPages(this.posts);
        const fileName = (issueMeta?.title || "Daily-Chalchitra-ePaper").replace(/\s+/g,'-');
        await this.capturePagesToPDF(printPages, issueMeta, fileName, totalColumns);
    },

    async downloadCurrentPagePDF(issueMeta){
        const current = this.pages[this.currentPage - 1];
        if(!current || !current.length){ alert("এই পাতায় দেখানোর মতো কিছু নেই।"); return; }
        const { pages: printPages, totalColumns } = await this.buildPrintPages(current);
        const fileName = ((issueMeta?.title || "Daily-Chalchitra") + "-page-" + this.currentPage).replace(/\s+/g,'-');
        await this.capturePagesToPDF(printPages, issueMeta, fileName, totalColumns);
    },

    async downloadSinglePostPDF(post){
        if(!post){ return; }
        const { pages: printPages, totalColumns } = await this.buildPrintPages([post]);
        const fileName = (post.title || 'post').replace(/[\/\\:*?"<>|]/g,'').substring(0,40);
        await this.capturePagesToPDF(printPages, null, fileName, totalColumns);
    }
};
window.addEventListener("resize",()=>{ if(window.DCViewer && DCViewer.initialized){ DCViewer.resize(); } });
