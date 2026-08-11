/* ==========================================================
   Daily Chalchitra ePaper Engine - যুগান্তর স্টাইল
   ========================================================== */
window.DCViewer = {
    version:"9.1.0",
    issue:null, currentPage:1, totalPages:1, zoom:1,
    initialized:false, isStarting:false,
    posts:[], pages:[],
    container:null, viewer:null,
    loading:false,

    init(issueId){
        if(this.initialized && this.issue===issueId) return;
        this.issue = decodeURIComponent(issueId||"");
        this.currentPage=1; this.totalPages=1; this.zoom=1;
        this.posts=[]; this.pages=[]; this.loading=false; this.isStarting=false;
        this.viewer = document.getElementById("dc-epaper-page");
        this.container = document.getElementById("dc-post-columns");
        this.initialized=true;
    },

    reset(){
        this.posts=[]; this.pages=[];
        this.currentPage=1; this.totalPages=1;
    },

    isKobita(post){
        if(post.category&&post.category.includes("কবিতা")) return true;
        if(Array.isArray(post.tags)) return post.tags.some(t=>(t||"").includes("কবিতা"));
        return false;
    },

    formatKobita(html){
        if(!html) return "";
        let text = html.replace(/<hr[^>]*>/gi,"\n---\n");
        text = text.replace(/<\/p>\s*<p[^>]*>/gi,"\n\n")
                   .replace(/<p[^>]*>/gi,"").replace(/<\/p>/gi,"");
        text = text.replace(/<br\s*\/?>/gi,"\n");
        text = text.replace(/<[^>]+>/g,"").trim();
        let lines = text.split("\n").map(l=>l.trim()).filter(l=>l.length>0);
        let result=[]; let temp=[];
        lines.forEach(line=>{
            let clean = line.replace(/^\*+|\*+$/g,"").replace(/^\-+|\-+$/g,"").trim();
            if(!clean) return;
            if(/রচনাকাল|প্রকাশকাল|সংযোজন|প্রথম প্রকাশ|ছাতক|বর্তমানে|দোহা/i.test(clean)){
                if(temp.length>0){ result.push(`<div class="kobita-pera">${temp.join("<br>")}</div>`); temp=[]; }
                result.push(`<div class="kobita-pera kobita-date">${clean}</div>`);
            } else {
                temp.push(clean);
                if(temp.length===4){ result.push(`<div class="kobita-pera">${temp.join("<br>")}</div>`); temp=[]; }
            }
        });
        if(temp.length>0) result.push(`<div class="kobita-pera">${temp.join("<br>")}</div>`);
        return result.join("");
    },

    buildPages(){
        this.pages=[];
        if(this.posts.length>0) this.pages.push([...this.posts]);
        this.totalPages = this.pages.length||1;
        this.render();
    },

    render(){
        const box = document.getElementById("dc-post-columns");
        if(!box) return;
        box.innerHTML="";
        if(!this.posts.length){
            box.innerHTML=`<div class="dc-empty">এই সপ্তাহে কোনো পোস্ট পাওয়া যায়নি।</div>`;
            this.updatePageInfo(); return;
        }
        const current = this.pages[0];
        if(!current||!current.length){
            box.innerHTML=`<div class="dc-empty">পোস্ট নেই।</div>`; return;
        }

        // বিভাজক রেখা যুক্ত করা
        const divider = document.createElement("div");
        divider.className="dc-section-divider";
        box.before(divider);

        current.forEach(post=>{
            const card = document.createElement("article");
            card.className="dc-post-card";

            let cleanContent = post.content||post.excerpt||"";
            if(this.isKobita(post)) cleanContent=this.formatKobita(cleanContent);
            else {
                cleanContent = cleanContent.replace(/<p>\s*<\/p>/gi,"");
                cleanContent = cleanContent.replace(/<img[^>]*>/gi,"");
            }

            const coverHtml = post.image
                ? `<img src="${post.image}" alt="${post.title}" class="dc-card-cover" onerror="this.style.display='none'">`
                : "";

            const authorImg = post.authorImage
                ? `<img src="${post.authorImage}" alt="${post.author}" class="dc-card-author-img" onerror="this.style.display='none'">`
                : "";

            const dateStr = post.date
                ? new Date(post.date).toLocaleDateString('bn-BD',{day:'numeric',month:'long',year:'numeric'})
                : "";

            card.innerHTML=`
                <a href="javascript:void(0)" class="dc-mini-pdf" title="PDF"><i class="fa fa-file-pdf"></i> PDF</a>
                ${post.category ? `<span class="dc-card-category">${post.category}</span>` : ""}
                <h3 class="dc-card-title">${post.title}</h3>
                <div class="dc-card-author-line">
                    ${authorImg}
                    ${post.author ? `<span class="dc-card-author-name">✍ ${post.author}</span>` : ""}
                </div>
                ${coverHtml}
                ${dateStr ? `<div class="dc-card-date">📅 ${dateStr}</div>` : ""}
                <div class="dc-card-content">${cleanContent}</div>
            `;

            card.querySelector(".dc-mini-pdf").addEventListener("click",(e)=>{
                e.preventDefault();
                this.downloadSingleCard(card, post.title);
            });
            box.appendChild(card);
        });
        this.updatePageInfo();
    },

    async downloadSingleCard(card, title){
        const btn = card.querySelector(".dc-mini-pdf");
        const old = btn?btn.innerHTML:"";
        if(btn){ btn.innerHTML='<i class="fa fa-spinner fa-spin"></i>'; btn.style.pointerEvents='none'; }
        try{
            const fileName = (title||'post').replace(/[\/\\:*?"<>|]/g,'').substring(0,40)+".pdf";
            const clone = card.cloneNode(true);
            clone.querySelectorAll(".dc-mini-pdf").forEach(b=>b.remove());
            clone.querySelectorAll("img").forEach(img=>{
                img.setAttribute("crossorigin","anonymous");
                img.style.maxWidth="100%";
            });
            await html2pdf().set({
                margin:8, filename:fileName,
                image:{type:'jpeg',quality:0.92},
                html2canvas:{scale:1.6,useCORS:true,allowTaint:true,backgroundColor:"#fff",logging:false},
                jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}
            }).from(clone).save();
        }catch(e){ alert("PDF তৈরি করা যায়নি।"); }
        finally{ if(btn){ btn.innerHTML=old; btn.style.pointerEvents='auto'; } }
    },

    updatePageInfo(){
        const info = document.getElementById("dc-page-info");
        if(info) info.innerHTML=`পৃষ্ঠা ${this.currentPage} / ${this.totalPages}`;
    },

    nextPage(){ },
    previousPage(){ },

    setZoom(value){
        this.zoom = Math.max(0.5,Math.min(2,value));
        const page = document.getElementById("dc-epaper-page");
        if(page){ page.style.transform=`scale(${this.zoom})`; page.style.transformOrigin="top center"; }
    },

    async loadPosts(){
        this.loading=true;
        const box = document.getElementById("dc-post-columns");
        if(box) box.innerHTML=`<div class="dc-empty"><i class="fa fa-spinner fa-spin"></i> লোড হচ্ছে...</div>`;
        try{
            const res = await fetch("/assets/epaper/issues/issues.json?v="+Date.now());
            if(!res.ok) throw new Error("issues.json not found");
            const allIssues = await res.json();
            const issue = allIssues.find(i=>String(i.id).trim()===String(this.issue).trim());
            if(issue&&issue.posts&&issue.posts.length>0){
                this.posts = issue.posts.map(post=>({
                    title:(post.title||"").trim(),
                    url:post.url||"",
                    date:post.date||"",
                    excerpt:post.excerpt||"",
                    content:post.content||post.excerpt||"",
                    image:post.image||"",
                    authorImage:post.authorImage||"",
                    category:post.category||"",
                    author:post.author||"",
                    tags:post.tags||[]
                }));
            } else { this.posts=[]; }
            this.buildPages();
        }catch(err){
            if(this.container) this.container.innerHTML=`<div class="dc-empty">পোস্ট লোড করা যায়নি।</div>`;
        }
        this.loading=false;
    },

    async start(){
        if(this.isStarting) return;
        this.isStarting=true;
        this.reset();
        await this.loadPosts();
        this.isStarting=false;
    }
};

window.addEventListener("resize",()=>{
    if(window.DCViewer&&DCViewer.initialized) DCViewer.render();
});
