/* ==========================================================
   Daily Chalchitra ePaper Viewer - v15.0
   FIX: "প্রিন্ট" বাটন এখন window.print() না করে বর্তমান পাতার
        PDF ডাউনলোড করে (একই নির্ভরযোগ্য পদ্ধতিতে)
   ========================================================== */
document.addEventListener("DOMContentLoaded", async ()=>{
    const title = document.getElementById("dc-title");
    const meta = document.getElementById("dc-meta");
    const downloadBtn = document.getElementById("dc-download");
    const printBtn = document.getElementById("dc-print");
    const fullscreenBtn = document.getElementById("dc-fullscreen");
    const prevBtn = document.getElementById("dc-prev");
    const nextBtn = document.getElementById("dc-next");
    const zoomInBtn = document.getElementById("dc-zoom-in");
    const zoomOutBtn = document.getElementById("dc-zoom-out");
    const pageInfo = document.getElementById("dc-page-info");

    const issueDropdown = document.getElementById("dc-issue-dropdown");
    const issueBtn = document.getElementById("dc-issue-btn");
    const issueLabel = document.getElementById("dc-issue-label");
    const issueMenu = document.getElementById("dc-issue-menu");

    const pageDropdown = document.getElementById("dc-page-dropdown");
    const pageBtn = document.getElementById("dc-page-btn");
    const pageMenu = document.getElementById("dc-page-menu");
    const bottomAllPagesBtn = document.getElementById("dc-bottom-allpages");

    const params = new URLSearchParams(window.location.search);
    const issueId = params.get("issue");

    let currentIssueMeta = null;

    function updatePageInfo(){
        if(!window.DCViewer||!pageInfo) return;
        pageInfo.innerHTML=`পৃষ্ঠা ${DCViewer.currentPage} / ${DCViewer.totalPages||1}`;
        buildPageMenu();
    }

    function closeAllDropdowns(){
        issueDropdown?.classList.remove("open");
        pageDropdown?.classList.remove("open");
    }
    issueBtn?.addEventListener("click", (e)=>{
        e.stopPropagation();
        const wasOpen = issueDropdown.classList.contains("open");
        closeAllDropdowns();
        if(!wasOpen) issueDropdown.classList.add("open");
    });
    pageBtn?.addEventListener("click", (e)=>{
        e.stopPropagation();
        const wasOpen = pageDropdown.classList.contains("open");
        closeAllDropdowns();
        if(!wasOpen) pageDropdown.classList.add("open");
    });
    document.addEventListener("click", ()=> closeAllDropdowns());

    bottomAllPagesBtn?.addEventListener("click", (e)=>{
        e.stopPropagation();
        closeAllDropdowns();
        pageDropdown.classList.add("open");
        pageDropdown.scrollIntoView({behavior:"smooth", block:"center"});
    });

    function buildPageMenu(){
        if(!pageMenu || !window.DCViewer || !DCViewer.pages) return;
        if(!DCViewer.pages.length){
            pageMenu.innerHTML = `<div class="dc-dd-loading">কোনো পাতা পাওয়া যায়নি।</div>`;
            return;
        }
        pageMenu.innerHTML = DCViewer.pages.map((p, idx)=>{
            const pageNum = idx + 1;
            const isActive = pageNum === DCViewer.currentPage;
            const firstTitle = (p[0] && p[0].title) ? p[0].title : "";
            return `<button type="button" class="dc-dd-item ${isActive?'active':''}" data-page="${pageNum}">
                পৃষ্ঠা ${pageNum}${firstTitle ? ' — ' + firstTitle : ''}
                <span>${p.length} টি লেখা</span>
            </button>`;
        }).join("");

        pageMenu.querySelectorAll(".dc-dd-item").forEach(item=>{
            item.addEventListener("click", ()=>{
                const num = parseInt(item.dataset.page, 10);
                if(!num || !window.DCViewer) return;
                DCViewer.currentPage = num;
                DCViewer.render();
                updatePageInfo();
                closeAllDropdowns();
                window.scrollTo({top:0, behavior:"smooth"});
            });
        });
    }

    if(!issueId){
        if(title) title.textContent="ই-পেপার পাওয়া যায়নি";
        return;
    }

    try{
        const res = await fetch("/assets/epaper/issues/issues.json?v="+Date.now());
        if(!res.ok) throw new Error("issues.json missing");
        const issues = await res.json();
        const issue = issues.find(i=>String(i.id).trim()===String(issueId).trim());

        if(!issue){
            if(title) title.textContent="ই-পেপার পাওয়া যায়নি";
            return;
        }

        currentIssueMeta = issue;

        if(title) title.textContent = issue.title||"ই-পেপার";
        if(meta) meta.innerHTML=`<strong>প্রকাশ:</strong> ${issue.date} &nbsp;|&nbsp; <strong>মোট লেখা:</strong> ${issue.count} টি`;
        if(issueLabel) issueLabel.textContent = issue.title || "সংখ্যা নির্বাচন";

        const headInfo = document.querySelector(".dc-paper-head-info");
        if(headInfo){
            headInfo.innerHTML=`
                <span>সংখ্যা: ${issue.week||""}</span>
                <span>${issue.date}</span>
                <span>মোট লেখা: ${issue.count}</span>
            `;
        }

        if(issueMenu){
            const sortedIssues = [...issues].sort((a,b)=> String(b.id).localeCompare(String(a.id)));
            issueMenu.innerHTML = sortedIssues.map(iss=>{
                const isActive = String(iss.id) === String(issue.id);
                return `<a href="/epaper/viewer/?issue=${encodeURIComponent(iss.id)}" class="dc-dd-item ${isActive?'active':''}">
                    ${iss.title || iss.id}
                    <span>${iss.date || ''}</span>
                </a>`;
            }).join("");
        }

        if(window.DCViewer){
            DCViewer.init(issueId);
            await DCViewer.start();
            updatePageInfo();
        }

        prevBtn?.addEventListener("click",()=>{
            if(window.DCViewer) DCViewer.previousPage();
            setTimeout(updatePageInfo,300);
        });
        nextBtn?.addEventListener("click",()=>{
            if(window.DCViewer) DCViewer.nextPage();
            setTimeout(updatePageInfo,300);
        });
        zoomInBtn?.addEventListener("click",()=>DCViewer.setZoom((DCViewer.zoom||1)+0.1));
        zoomOutBtn?.addEventListener("click",()=>DCViewer.setZoom(Math.max(0.5,(DCViewer.zoom||1)-0.1)));

        if(downloadBtn){
            downloadBtn.onclick = async ()=>{
                if(!window.DCViewer || !DCViewer.posts.length){
                    alert("ই-পেপার লোড হচ্ছে, একটু পর চেষ্টা করুন।"); return;
                }
                const orig = downloadBtn.innerHTML;
                downloadBtn.disabled = true;
                downloadBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> তৈরি হচ্ছে...';
                await DCViewer.generateFullPDF(currentIssueMeta);
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = orig;
            };
        }

        // আগে window.print() করত - এখন বর্তমান পাতার PDF ডাউনলোড করে (নির্ভরযোগ্য)
        if(printBtn){
            printBtn.onclick = async ()=>{
                if(!window.DCViewer || !DCViewer.pages.length){
                    alert("ই-পেপার লোড হচ্ছে, একটু পর চেষ্টা করুন।"); return;
                }
                const orig = printBtn.innerHTML;
                printBtn.disabled = true;
                printBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> তৈরি হচ্ছে...';
                await DCViewer.downloadCurrentPagePDF(currentIssueMeta);
                printBtn.disabled = false;
                printBtn.innerHTML = orig;
            };
        }

        if(fullscreenBtn){
            fullscreenBtn.onclick=async()=>{
                const viewer = document.querySelector("#dc-epaper-page");
                try{
                    if(!document.fullscreenElement) await viewer.requestFullscreen();
                    else await document.exitFullscreen();
                }catch(e){}
            };
        }

    }catch(err){
        console.error(err);
        if(title) title.textContent="ই-পেপার লোড করা যায়নি";
    }
});
