/* ==========================================================
   Daily Chalchitra ePaper Viewer - v9.0 Rebuild
   FINAL - Clean + Print PDF logic same
   ========================================================== */
document.addEventListener("DOMContentLoaded", async () => {
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
        if(!window.DCViewer || !pageInfo) return;
        pageInfo.innerHTML = `পৃষ্ঠা ${DCViewer.currentPage} / ${DCViewer.totalPages || 1}`;
    }

    function cleanupTags(){
        const page = document.querySelector("#dc-epaper-page");
        if(!page) return;
        page.querySelectorAll(".dc-post-card small").forEach(el => el.remove());
    }

    function fixHeightForPrint(){
        const viewer = document.querySelector("#dc-epaper-page");
        if(!viewer) return { viewer: null };
        const originalMinHeight = viewer.style.minHeight;
        const originalHeight = viewer.style.height;
        const contentHeight = viewer.scrollHeight;
        viewer.style.minHeight = contentHeight + "px";
        viewer.style.height = contentHeight + "px";
        return { viewer, originalMinHeight, originalHeight };
    }

    function restoreHeightAfterPrint({ viewer, originalMinHeight, originalHeight }){
        if(!viewer) return;
        setTimeout(() => {
            viewer.style.minHeight = originalMinHeight;
            viewer.style.height = originalHeight;
        }, 1000);
    }

    if(!issueId){
        if(title) title.textContent = "ই-পেপার পাওয়া যায়নি";
        return;
    }

    try {
        const res = await fetch("/assets/epaper/issues/issues.json?v=" + Date.now());
        if(!res.ok) throw new Error("Issues missing");
        const issues = await res.json();
        const issue = issues.find(item => String(item.id).trim() === String(issueId).trim());

        if(!issue){
            if(title) title.textContent = "ই-পেপার পাওয়া যায়নি";
            return;
        }

        if(title) title.textContent = issue.title;
        if(meta) meta.innerHTML = `<strong>প্রকাশ:</strong> ${issue.date} <br><strong>মোট লেখা:</strong> ${issue.count} টি | <strong>পৃষ্ঠা:</strong> ${issue.pages}`;

        if(window.DCViewer){
            DCViewer.init(issueId);
            await DCViewer.start();
            updatePageInfo();

            const checkLoad = setInterval(() => {
                const cols = document.getElementById("dc-post-columns");
                if(cols && !cols.innerHTML.includes("লোড হচ্ছে") && cols.querySelector(".dc-post-card")){
                    clearInterval(checkLoad);
                    cleanupTags();
                }
            }, 500);
            setTimeout(()=>clearInterval(checkLoad), 10000);
        }

        prevBtn?.addEventListener("click", () => {
            if(window.DCViewer) DCViewer.previousPage();
            setTimeout(()=>{ cleanupTags(); updatePageInfo(); }, 300);
        });
        nextBtn?.addEventListener("click", () => {
            if(window.DCViewer) DCViewer.nextPage();
            setTimeout(()=>{ cleanupTags(); updatePageInfo(); }, 300);
        });
        zoomInBtn?.addEventListener("click", () => DCViewer.setZoom(DCViewer.zoom + 0.1));
        zoomOutBtn?.addEventListener("click", () => DCViewer.setZoom(Math.max(0.5, DCViewer.zoom - 0.1)));

        if(downloadBtn){
            downloadBtn.onclick = () => {
                const viewer = document.querySelector("#dc-epaper-page");
                if(!viewer || viewer.innerHTML.includes("লোড হচ্ছে")){
                    alert("ই-পেপার এখনো লোড হচ্ছে, ২ সেকেন্ড পর চেষ্টা করুন।");
                    return;
                }
                const saved = fixHeightForPrint();
                alert("প্রিন্ট ডায়ালগ খুলবে - \"Save as PDF\" বেছে নিন।");
                setTimeout(() => {
                    window.print();
                    restoreHeightAfterPrint(saved);
                }, 300);
            };
        }

        if(printBtn){
            printBtn.onclick = () => {
                const saved = fixHeightForPrint();
                setTimeout(() => {
                    window.print();
                    restoreHeightAfterPrint(saved);
                }, 300);
            };
        }

        if(fullscreenBtn){
            fullscreenBtn.onclick = async () => {
                const viewer = document.querySelector("#dc-epaper-page");
                try{
                    if(!document.fullscreenElement) await viewer.requestFullscreen();
                    else await document.exitFullscreen();
                }catch(e){}
            };
        }

    } catch (error){
        console.error(error);
        if(title) title.textContent = "ই-পেপার লোড করা যায়নি";
    }
});
