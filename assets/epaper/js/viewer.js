/* ==========================================================
   Daily Chalchitra ePaper Viewer - v10.0
   FIX: ডাউনলোড বাটন এখন html2canvas+jsPDF দিয়ে সব পাতা ক্যাপচার করে
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

    let currentIssueMeta = null;

    function updatePageInfo(){
        if(!window.DCViewer||!pageInfo) return;
        pageInfo.innerHTML=`পৃষ্ঠা ${DCViewer.currentPage} / ${DCViewer.totalPages||1}`;
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

        // "পুরো ই-পেপার PDF" — এখন সব পাতা html2canvas দিয়ে ক্যাপচার হয়ে একটাই PDF হবে
        if(downloadBtn){
            downloadBtn.onclick = async ()=>{
                if(!window.DCViewer || !DCViewer.pages.length){
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

        // "প্রিন্ট" — শুধু বর্তমান পাতা ব্রাউজার প্রিন্ট ডায়ালগে
        if(printBtn){
            printBtn.onclick = ()=>{ window.print(); };
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
