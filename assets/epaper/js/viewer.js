/*
  Daily Chalchitra ePaper Viewer
  Final Fixed v8.6 - Full-issue PDF now uses native browser print (Save as PDF)
  instead of html2canvas, because html2canvas cannot reliably render complex
  Bengali conjunct glyphs (they came out broken/dotted no matter how it was tuned).
  The native print path uses the browser's own font renderer, so text is always correct.
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

        // Full Issue PDF - html2canvas বাদ দিয়ে ব্রাউজারের নেটিভ প্রিন্ট ব্যবহার
        // করা হচ্ছে, কারণ html2canvas জটিল বাংলা যুক্তাক্ষর ভেঙে ফেলে। নেটিভ
        // প্রিন্ট ব্রাউজারের আসল ফন্ট রেন্ডারার ব্যবহার করে, তাই টেক্সট কখনো
        // ভাঙবে না। ব্যবহারকারী প্রিন্ট ডায়ালগে "Save as PDF" বেছে নেবেন।
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
