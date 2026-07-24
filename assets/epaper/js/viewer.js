/*
  Daily Chalchitra ePaper Viewer
  Final Fixed v8.9 - Compatible with v3.6 (Auto 4-line stanza)
  Full-issue PDF uses native browser print (Save as PDF)
  for perfect Bengali glyphs.
*/
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
        if(!window.DCViewer ||!pageInfo) return;
        pageInfo.innerHTML = `পৃষ্ঠা ${DCViewer.currentPage} / ${DCViewer.totalPages || 1}`;
    }

    function cleanupDuplicateSmallTags(){
        const page = document.querySelector("#dc-epaper-page");
        if(!page) return;
        page.querySelectorAll(".dc-post-card small").forEach(el => {
            if(el.textContent.includes("বিভাগ:") || el.textContent.includes("লেখক:")){
                el.remove();
            }
        });
    }

    if(!issueId){
        if(title) title.textContent = "ই-পেপার পাওয়া যায়নি";
        return;
    }

    try {
        const res = await fetch("/assets/epaper/issues/issues.json?v=" + Date.now());
        if(!res.ok) throw new Error("Issues missing");
        const issues = await res.json();
        const issue = issues.find(item => item.id === issueId);

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
                if(cols &&!cols.innerHTML.includes("লোড হচ্ছে") && cols.querySelector(".dc-post-card")){
                    clearInterval(checkLoad);
                    cleanupDuplicateSmallTags();
                }
            }, 500);
            setTimeout(()=>clearInterval(checkLoad), 10000);
        }

        prevBtn?.addEventListener("click", () => {
            if(window.DCViewer) DCViewer.previousPage();
            setTimeout(()=>{ cleanupDuplicateSmallTags(); }, 300);
        });
        nextBtn?.addEventListener("click", () => {
            if(window.DCViewer) DCViewer.nextPage();
            setTimeout(()=>{ cleanupDuplicateSmallTags(); }, 300);
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
                alert("প্রিন্ট ডায়ালগ খুলবে - সেখানে প্রিন্টার হিসেবে \"Save as PDF\" বেছে নিলেই PDF ডাউনলোড হয়ে যাবে।");
                window.print();
            };
        }

        if(printBtn) printBtn.onclick = () => window.print();
        if(fullscreenBtn){
            fullscreenBtn.onclick = async () => {
                const viewer = document.querySelector("#dc-epaper-page");
                try{ if(!document.fullscreenElement) await viewer.requestFullscreen(); else await document.exitFullscreen(); }catch(e){}
            };
        }

    } catch (error){
        console.error(error);
        if(title) title.textContent = "ই-পেপার লোড করা যায়নি";
    }
});
