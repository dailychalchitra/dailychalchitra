/* ==========================================================
   Daily Chalchitra ePaper Engine - v13.0
   FIX: কবিতার height এখন লাইনসংখ্যা দিয়ে হিসাব হয় (অক্ষরসংখ্যা না) -
        আগে ভুল হিসাবে একটা কলাম অতিরিক্ত লম্বা হয়ে যাচ্ছিল
   FIX: ৪-কলাম গ্লোবালি ব্যালেন্স করা হয় যাতে সবগুলো কলাম প্রায়
        সমান উচ্চতার হয় (নাহলে স্লাইসের সময় শুধু একটা কলাম দেখা যেত)
   FIX: প্রতিটা প্রিন্ট-পেজ যেন একটা A4 পেজের মধ্যেই আঁটে সেই
        হিসেবে height limit টাইট করা হয়েছে
   ========================================================== */
window.DCViewer = {
    version: "13.0",
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

    // ===== অন-স্ক্রিন রিডিং এর জন্য height হিসাব (আগের মতোই) =====
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

    // ===== প্রিন্ট/PDF (সংকীর্ণ ৪-কলাম) এর জন্য নির্ভুল height হিসাব =====
    estimatePrintHeight(post){
        let height = 120;
        if(post.image) height += 165;
        if(post.title) height += Math.ceil(post.title.length / 20) * 24;

        const raw = post.content || post.excerpt || "";
        if(this.isKobita(post)){
            // কবিতায় লাইনসংখ্যা গুনে হিসাব - অক্ষরসংখ্যা দিয়ে না (এটাই আগের বাগের কারণ ছিল)
            const brCount = (raw.match(/<br\s*\/?>/gi) || []).length;
            const pCount = (raw.match(/<\/p>\s*<p[^>]*>/gi) || []).length;
            const lineCount = Math.max(brCount + pCount + 1, 3);
            height += lineCount * 23 + 50;
        } else {
            const plainText = raw.replace(/<[^>]+>/g," ").replace(/\s+/g," ");
            // প্রিন্ট কলাম সংকীর্ণ (~230px), তাই প্রতি লাইনে কম অক্ষর ধরা হচ্ছে
            height += Math.ceil(plainText.length / 68) * 17;
        }
        return height;
    },

    /* ===== অন-স্ক্রিন রিডিং পেজিনেশন (আগের মতোই - অপরিবর্তিত) ===== */
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
                img.addEventListener("load", ()=>resolve(), {once:true});
                img.addEventListener("error", ()=>{ img.remove(); resolve(); }, {once:true});
                setTimeout(()=>{ if(!img.complete){ img.remove(); } resolve(); }, 4000);
            });
        }));
    },

    // নির্দিষ্ট সংখ্যক কলামের মধ্যে (order ঠিক রেখে) posts ভাগ করলে
    // সর্বনিম্ন যে "সর্বোচ্চ কলাম-height" দরকার সেটা বাইনারি সার্চ দিয়ে বের করে -
    // এতে সবগুলো কলাম প্রায় সমান উচ্চতার হয় (ব্যালেন্সড)
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

    // পুরো সপ্তাহের সব লেখা সবসময় ৪-কলাম গ্রিডে ভাগ করে - গ্লোবালি ব্যালেন্স করে
    // (যাতে একটা কলাম বেশি লম্বা আর বাকিগুলো ছোট না হয়ে যায়), এবং প্রতিটা পেজ
    // যেন একটা A4 পেজের মধ্যেই আঁটে সেটা নিশ্চিত করে
    buildPrintPages(){
        const heights = this.posts.map(p => this.estimatePrintHeight(p));
        const totalHeight = heights.reduce((a,b)=>a+b, 0);
        const safeColHeight = 1180; // একটা A4 প্রিন্ট-পেজে একটা কলামের নিরাপদ সর্বোচ্চ উচ্চতা (px)

        let pageCount = Math.max(1, Math.ceil(totalHeight / (safeColHeight * 4)));
        let numColumns = pageCount * 4;
        let maxColHeight = this.minimalMaxColumnHeight(heights, numColumns);

        // ব্যালেন্স করার পরও যদি কোনো কলাম নিরাপদ সীমার চেয়ে লম্বা হয়ে যায় -
        // পেজ সংখ্যা বাড়িয়ে আবার ব্যালেন্স করা হচ্ছে
        let guard = 0;
        while(maxColHeight > safeColHeight && guard < 20){
            pageCount++;
            numColumns = pageCount * 4;
            maxColHeight = this.minimalMaxColumnHeight(heights, numColumns);
            guard++;
        }

        const columns = this.splitIntoColumns(this.posts, heights, maxColHeight);
        const printPages = [];
        for(let i = 0; i < columns.length; i += 4){
            printPages.push(columns.slice(i, i + 4));
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
                    // ব্যতিক্রমী ক্ষেত্রে (যেমন একাই খুব লম্বা একটা লেখা) - সেফটি ফলব্যাক
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
