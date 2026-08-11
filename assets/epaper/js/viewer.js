/* ==========================================================
   Daily Chalchitra ePaper Viewer - v9.1.0
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

    const params = new URLSearchParams(window.location.search);
    const issueId = params.get("issue");

    function updatePageInfo(){
        if(!window.DCViewer||!pageInfo) return;
        pageInfo.innerHTML=`পৃষ্ঠা ${DCViewer.currentPage} / ${DCViewer.totalPages||1}`;
    }

    function fixHeightForPrint(){
        const viewer = document.querySelector("#dc-epaper-page");
        if(!viewer) return {viewer:null};
        const orig_minH = viewer.style.minHeight;
        const orig_H = viewer.style.height;
        const orig_mT = viewer.style.marginTop;
        const h = viewer.scrollHeight;
        viewer.style.minHeight = h+"px";
        viewer.style.height = h+"px";
        viewer.style.marginTop = "0px";
        viewer.style.top = "0px";
        return {viewer, orig_minH, orig_H, orig_mT};
    }

    function restoreAfterPrint({viewer, orig_minH, orig_H, orig_mT}){
        if(!viewer) return;
        setTimeout(()=>{
            viewer.style.minHeight = orig_minH;
            viewer.style.height = orig_H;
            viewer.style.marginTop = orig_mT;
        },1000);
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

        if(title) title.textContent = issue.title||"ই-পেপার";
        if(meta) meta.innerHTML=`<strong>প্রকাশ:</strong> ${issue.date} &nbsp;|&nbsp; <strong>মোট লেখা:</strong> ${issue.count} টি`;

        // পেপার হেডে তারিখ/সংখ্যা তথ্য যুক্ত
        const headInfo = document.querySelector(".dc-paper-head-info");
        if(headInfo){
            headInfo.innerHTML=`
                <span>সংখ্যা: ${issue.week||""}</span>
                <span>${issue.date}</span>
                <span>মোট লেখা: ${issue.count}</span>
            `;
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
            downloadBtn.onclick=()=>{
                const viewer = document.querySelector("#dc-epaper-page");
                if(!viewer||viewer.innerHTML.includes("লোড হচ্ছে")){
                    alert("ই-পেপার লোড হচ্ছে, একটু পর চেষ্টা করুন।"); return;
                }
                const saved = fixHeightForPrint();
                alert("প্রিন্ট ডায়ালগ খুলবে — \"Save as PDF\" বেছে নিন।");
                setTimeout(()=>{ window.print(); restoreAfterPrint(saved); },300);
            };
        }

        if(printBtn){
            printBtn.onclick=()=>{
                const saved = fixHeightForPrint();
                setTimeout(()=>{ window.print(); restoreAfterPrint(saved); },300);
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
