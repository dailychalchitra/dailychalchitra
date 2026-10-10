/* ==========================================================
   Daily Chalchitra ePaper Engine - v33.0
   CHANGE: প্রিন্ট/PDF পেজের ফন্ট-সাইজ উল্লেখযোগ্যভাবে বড় করা হয়েছে,
           আর ডিজাইন পুরনো ভিনটেজ-ফ্রেম/কোণা-ব্র্যাকেট/লতাপাতা-ওভারলে
           থেকে সরিয়ে আধুনিক ডিজিটাল-নিউজ-কার্ড স্টাইলে (সলিড অ্যাকসেন্ট
           বার, সফট শ্যাডো কার্ড, গোলাকার কোণা) আনা হয়েছে। হেডারের
           display:table লেআউট অপরিবর্তিত (html2canvas-নির্ভরযোগ্যতার
           জন্য) — কোনো height-measurement/pagination লজিক স্পর্শ হয়নি।
   ========================================================== */
window.DCViewer = {
    version: "33.0",
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
    authorImage: post.authorImage || "", authorBio: post.authorBio || "",
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
        return `<div class="dcp-art-start" style="border-top-color:${catColor};">
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

    getPrintStyleTag(){
        return `<style>
            .dcp-page{
              font-family:'Noto Sans Bengali','Hind Siliguri',Arial,sans-serif; box-sizing:border-box;
              position:relative; overflow:hidden;
              background:#ffffff;
            }
            .dcp-page::before{
              content:""; position:absolute; top:0; left:0; right:0; height:9px; z-index:2;
              background:linear-gradient(90deg, #8B0000 0%, #C00000 45%, #e74c3c 100%);
            }

            .dcp-head{
              position:relative; z-index:1; display:table; width:100%; table-layout:fixed;
              margin:12px 0 22px 0; padding:0 4px 16px;
              border-bottom:3px solid #C00000;
            }
            .dcp-head-left, .dcp-head-right{
              display:table-cell; width:165px; font-size:12px; line-height:1.8; color:#555; font-weight:600; vertical-align:middle;
            }
            .dcp-head-right{ text-align:right; }
            .dcp-head-center{ display:table-cell; text-align:center; vertical-align:middle; }
            .dcp-logo{ display:inline-block; max-width:165px; height:auto; }
            .dcp-tagline{
              display:block; text-align:center; font-size:11px; letter-spacing:3px; color:#C00000;
              font-weight:700; margin-top:6px; text-transform:uppercase;
            }

            .dcp-columns{ position:relative; z-index:1; display:flex !important; align-items:flex-start; justify-content:center; box-sizing:border-box; padding:0 4px 10px; }
            .dcp-col{ box-sizing:border-box !important; padding:0 14px; overflow:hidden; }
            .dcp-col:not(:first-child){ border-left:1px solid #ececec; }

            .dcp-cover{ width:100%; height:150px; object-fit:cover; border-radius:8px; display:block; }

            /* সোলো (মোট ১-কলাম নথি) - সরু, কেন্দ্রীভূত, বড় ফন্ট */
            .dcp-col-solo{ font-size:20px !important; line-height:1.9 !important; border-left:none !important; text-align:justify; }
            .dcp-col-solo .dcp-content{ font-size:20px !important; line-height:1.9 !important; text-align:justify; }
            .dcp-col-solo .dcp-art-start h2{ font-size:25px !important; }
            .dcp-col-solo .dcp-kobita{ margin-bottom:10px !important; }
            .dcp-col-solo .dcp-cover{ width:100%; height:300px; object-fit:cover; object-position:center 20%; }

            .dcp-col-duo{ font-size:17px !important; line-height:1.8 !important; text-align:justify; }
            .dcp-col-duo .dcp-content{ font-size:17px !important; line-height:1.8 !important; text-align:justify; }
            .dcp-col-duo .dcp-art-start h2{ font-size:20px !important; }
            .dcp-col-duo .dcp-cover{ width:100%; height:210px; object-fit:cover; object-position:center 20%; }

            .dcp-col-tri{ font-size:16px !important; line-height:1.7 !important; }
            .dcp-col-tri .dcp-content{ font-size:16px !important; line-height:1.7 !important; }
            .dcp-col-tri .dcp-art-start h2{ font-size:18px !important; }
            .dcp-col-tri .dcp-cover{ height:175px !important; object-position:center 20%; }

            .dcp-art-start{
              border:none; border-top:4px solid #C00000; border-radius:4px 4px 10px 10px;
              padding:14px; margin:0 3px 18px 3px;
              background:#ffffff;
              box-shadow:0 2px 10px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05);
            }
            .dcp-col > .dcp-art-start:first-child{ margin-top:0; }
            .dcp-card-header{ margin-bottom:8px; }
            .dcp-art-start h2{
              font-size:17px; margin:0 0 6px 0; line-height:1.35;
              font-family:'Noto Serif Bengali',serif; font-weight:700; color:#111;
            }
            .dcp-cat-author{ margin:2px 0 5px 0; display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
            .dcp-cat-badge{ color:#fff; font-size:12px; font-weight:700; padding:3px 11px; border-radius:20px; display:inline-block; }
            .dcp-author-text{ font-size:13px; color:#555; font-weight:600; }
            .dcp-date{ font-size:12px; color:#999; margin-bottom:5px; }
            .dcp-content{ font-family:'Noto Serif Bengali',serif; font-size:15px; line-height:1.65; color:#222; }
            .dcp-content p{ margin:0 0 8px 0; padding:0; }
            .dcp-kobita{ display:block; margin:0 0 5px 0; line-height:1.55; }
            .dcp-kobita-date{ display:block; margin-top:5px; font-size:13px; font-style:italic; color:#666; }
            .dcp-continued{ font-size:12.5px; font-style:italic; color:#999; margin-bottom:5px; }

            .dcp-footer{
              position:relative; z-index:1; text-align:center; font-size:11px; color:#aaa;
              letter-spacing:1px; border-top:1px solid #eee; padding-top:8px; margin-top:6px;
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

        // ============================================================
    // সিঙ্গেল-পোস্ট উৎসবমুখী ("বৈশাখী কার্ড") প্রিন্ট ডিজাইন —
    // শুধু downloadSinglePostPDF-এর জন্য, গ্রিড/ইস্যু-ডাউনলোড সিস্টেম
    // থেকে সম্পূর্ণ স্বতন্ত্র, সেগুলোর কোনো কোড এখানে পুনর্ব্যবহৃত হয়নি।
    // ============================================================

    // ছোট রঙিন মোটিফ (ফুল/পেইজলি ধাঁচ) - বাম পাশের নকশা-স্ট্রিপে
    soloMotifDataUri(c1, c2, c3){
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='24' viewBox='0 0 40 24'>" +
        "<circle cx='20' cy='12' r='4.5' fill='" + c1 + "'/>" +
        "<path d='M20 3 C25 8 25 16 20 21 C15 16 15 8 20 3 Z' fill='none' stroke='" + c2 + "' stroke-width='1.6'/>" +
        "<circle cx='6' cy='12' r='2' fill='" + c3 + "'/>" +
        "<circle cx='34' cy='12' r='2' fill='" + c3 + "'/>" +
        "</svg>";
    return "data:image/svg+xml;utf8," + svg;
},
        buildSoloLeftStripHTML(){
    const combos = [
        ["%23C0392B","%23F1C40F","%2327AE60"], ["%23D35400","%2327AE60","%238E44AD"],
        ["%238E44AD","%23F1C40F","%23C0392B"], ["%232980B9","%23D35400","%23F1C40F"],
        ["%2327AE60","%23C0392B","%232980B9"], ["%23F1C40F","%238E44AD","%23D35400"]
    ];
    const repeatCount = 60;
    let imgs = "";
    for(let i = 0; i < repeatCount; i++){
        const c = combos[i % combos.length];
        imgs += `<img src="${this.soloMotifDataUri(c[0], c[1], c[2])}">`;
    }
    return `<div class="dcp-solo-left-strip">${imgs}</div>`;
},

    // শিরোনামের প্রতিটা শব্দ পালাক্রমে ভিন্ন রঙে - উৎসবমুখী বহু-রঙা প্রভাব
    colorizeTitle(title){
        const palette = ["#C0392B", "#D35400", "#8E44AD", "#2980B9", "#117864", "#B9770E"];
        const words = (title || "").split(" ").filter(Boolean);
        return words.map((w, i) => `<span style="color:${palette[i % palette.length]};">${w}</span>`).join(" ");
    },

        getSoloPrintStyleTag(){
    return `<style>
        .dcp-solo-page{
            font-family:'Noto Sans Bengali','Hind Siliguri',Arial,sans-serif; box-sizing:border-box;
            position:relative; overflow:hidden; background:#fffaf5;
            border:9px double #8B0000; outline:2px solid #C0392B; outline-offset:-16px;
            padding:34px 46px 30px 78px;
        }

        /* বাইরের স্কেল/রুলার প্যাড — বৈশাখী মোটিফ, চ্যাপটা ইউনিট */
        .dcp-solo-left-strip{
            position:absolute; top:14px; bottom:14px; left:14px; width:36px; z-index:1;
            overflow:hidden; background:linear-gradient(180deg,#fff6ec,#ffe6cc);
            border-radius:6px; box-shadow:inset 0 0 0 1px rgba(0,0,0,0.06), 2px 0 6px rgba(0,0,0,0.08);
        }
        .dcp-solo-left-strip img{ display:block; width:34px; height:20px; margin:1px auto; }

        .dcp-solo-head{
            position:relative; z-index:2; display:table; width:100%; table-layout:fixed;
            margin:0 0 24px; padding-bottom:16px; border-bottom:2px solid #C0392B;
        }
        .dcp-solo-head-corner{ display:table-cell; width:170px; font-size:16px; color:#777; font-weight:600; line-height:1.9; vertical-align:middle; }
        .dcp-solo-head-right{ text-align:right; }
        .dcp-solo-head-logo{ display:table-cell; text-align:center; vertical-align:middle; }
        .dcp-solo-logo{ max-width:170px; height:auto; }

        .dcp-solo-body{ position:relative; z-index:2; padding-right:185px; min-height:900px; }

.dcp-solo-vline{
    position:absolute; top:0; bottom:0; right:155px; width:5px; border-radius:3px; z-index:1;
    background:linear-gradient(180deg,#C0392B,#F1C40F,#27AE60,#2980B9,#C0392B);
}

.dcp-solo-rail{ position:absolute; right:0; width:150px; top:90px; text-align:center; z-index:2; }
.dcp-solo-author-photo{
    width:124px; height:124px; object-fit:cover; display:block; margin:0 auto 12px;
    border-radius:4px; border:none; box-shadow:0 14px 26px rgba(0,0,0,0.38);
}
.dcp-solo-author-bio{ font-size:13.5px; color:#666; line-height:1.55; text-align:center; font-family:'Noto Serif Bengali',serif; padding:0 6px; }

        .dcp-solo-title{
    font-family:'Noto Serif Bengali',serif; font-weight:900; font-size:59px; text-align:center;
    line-height:1.5; margin:-8px 0 14px; letter-spacing:1px;
}
.dcp-solo-title span{ display:inline-block; margin:0 4px; }
.dcp-solo-authorname{
    text-align:center; font-size:25px; color:#8B0000; font-weight:700;
    margin-bottom:24px; font-family:'Noto Serif Bengali',serif;
}

        .dcp-solo-content{ font-family:'Noto Serif Bengali',serif; font-size:32px; line-height:2.05; color:#222; text-align:justify; }
        .dcp-solo-content p{ margin:0 0 18px; }
        .dcp-solo-content .kobita-pera{ display:block; text-align:center; margin:0 0 30px; }
        .dcp-solo-content .kobita-pera.kobita-date{ font-size:18px; font-style:italic; color:#777; margin-top:10px; }

        .dcp-solo-footer{ position:relative; z-index:2; clear:both; text-align:center; margin-top:34px; }
        .dcp-solo-footer-line{ height:2px; background:linear-gradient(90deg, transparent, #C0392B, transparent); margin-bottom:12px; }
        .dcp-solo-footer-url{ font-size:15px; letter-spacing:2px; color:#999; }
    </style>`;
},

        buildSoloBodyHTML(post){
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = post.date || (pad(now.getDate()) + "-" + pad(now.getMonth()+1) + "-" + now.getFullYear());
    const timeStr = pad(now.getHours()) + ":" + pad(now.getMinutes());

    let cleanContent = post.content || post.excerpt || "";
    if(this.isKobita(post)) cleanContent = this.formatKobita(cleanContent);
    else cleanContent = cleanContent.replace(/<p>\s*<\/p>/gi, "");

    const shortBio = (post.authorBio || "").replace(/<[^>]+>/g, "").trim();
    const trimmedBio = shortBio.length > 150 ? shortBio.substring(0, 150) + "…" : shortBio;

    const authorImgHTML = post.authorImage
        ? `<img src="${post.authorImage}" class="dcp-solo-author-photo" crossorigin="anonymous">`
        : '';
    const authorBioHTML = trimmedBio
        ? `<div class="dcp-solo-author-bio">${trimmedBio}</div>`
        : '';
    const hasRail = authorImgHTML || authorBioHTML;

    return `
        ${this.buildSoloLeftStripHTML()}
        <div class="dcp-solo-head">
            <div class="dcp-solo-head-corner dcp-solo-head-left">
                <div>তারিখ: ${dateStr}</div>
                <div>সময়: ${timeStr}</div>
            </div>
            <div class="dcp-solo-head-logo">
                <img src="https://i.postimg.cc/3w757F6N/Daily-Chalchitra.png" class="dcp-solo-logo" crossorigin="anonymous">
            </div>
            <div class="dcp-solo-head-corner dcp-solo-head-right">
                <div>বিস্তারিত: সাহিত্য সংস্করণ</div>
                <div>${post.category || ''}</div>
            </div>
        </div>
        <div class="dcp-solo-body">
            <div class="dcp-solo-vline"></div>
            ${hasRail ? `<div class="dcp-solo-rail">${authorImgHTML}${authorBioHTML}</div>` : ''}
            <h1 class="dcp-solo-title">${this.colorizeTitle(post.title)}</h1>
            ${post.author ? `<div class="dcp-solo-authorname">লেখক: ${post.author}</div>` : ''}
            <div class="dcp-solo-content">${cleanContent}</div>
        </div>
        <div class="dcp-solo-footer">
            <div class="dcp-solo-footer-line"></div>
            <div class="dcp-solo-footer-url">দৈনিক চালচিত্র &nbsp;•&nbsp; www.dailychalchitra.com</div>
        </div>
    `;
},

    async captureSoloPostToPDF(post, fileName){
        if(typeof html2canvas === 'undefined' || !window.jspdf){ alert("PDF লাইব্রেরি লোড হয়নি।"); return false; }

        const captureWidth = 1000;
        const host = document.createElement("div");
        host.style.position = "absolute"; host.style.top = "0"; host.style.left = "0";
        host.style.width = "0"; host.style.height = "0"; host.style.overflow = "hidden";
        document.body.appendChild(host);
        const wrapper = document.createElement("div");
        wrapper.style.width = captureWidth + "px";
        host.appendChild(wrapper);

        let success = true;
        try{
            const pageEl = document.createElement("div");
                        const a4Ratio = 297 / 210;
            const minHeightPx = Math.round(captureWidth * a4Ratio);
            pageEl.className = "dcp-solo-page";
            pageEl.style.cssText = `width:${captureWidth}px; min-height:${minHeightPx}px; box-sizing:border-box;`;
            pageEl.innerHTML = this.getSoloPrintStyleTag() + this.buildSoloBodyHTML(post);

            const canvas = await this.captureElement(pageEl, wrapper, captureWidth);
            if(!canvas || canvas.width === 0 || canvas.height === 0){
                alert("দেখানোর মতো কনটেন্ট পাওয়া যায়নি।");
                success = false;
            } else {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF("p", "mm", "a4");
                const pageWidthMM = pdf.internal.pageSize.getWidth();
                const pageHeightMM = pdf.internal.pageSize.getHeight();
                const imgData = canvas.toDataURL("image/jpeg", 0.95);
                const imgHeightMM = canvas.height * pageWidthMM / canvas.width;

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

    async downloadSinglePostPDF(post){
        if(!post){ return; }
        const fileName = (post.title || 'post').replace(/[\/\\:*?"<>|]/g,'').substring(0,40);
        await this.captureSoloPostToPDF(post, fileName);
    }
};
window.addEventListener("resize",()=>{ if(window.DCViewer && DCViewer.initialized){ DCViewer.resize(); } });
