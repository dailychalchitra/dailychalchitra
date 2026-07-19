/*
  Daily Chalchitra ePaper Viewer
  Final Fixed v8.4 - PDF: fixed broken Bengali heading glyphs + text cut across page breaks
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

        // Full Issue PDF - column-layout ফ্ল্যাটেন + page-break-inside + glyph fix
        if(downloadBtn){
            downloadBtn.onclick = async () => {
                const viewer = document.querySelector("#dc-epaper-page");
                if(!viewer || viewer.innerHTML.includes("লোড হচ্ছে")){
                    alert("ই-পেপার এখনো লোড হচ্ছে, ২ সেকেন্ড পর চেষ্টা করুন।");
                    return;
                }
                const original = downloadBtn.innerHTML;
                downloadBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> তৈরি হচ্ছে...';
                downloadBtn.disabled = true;
                try{
                    const clone = viewer.cloneNode(true);
                    clone.querySelectorAll(".dc-mini-pdf").forEach(b=>b.remove());
                    clone.querySelectorAll("img").forEach(img=>img.setAttribute("crossorigin","anonymous"));

                    const columnsEl = clone.querySelector("#dc-post-columns");
                    if(columnsEl){
                        columnsEl.style.columnCount = "1";
                        columnsEl.style.columnGap = "0";
                    }

                    const headEl = clone.querySelector(".dc-paper-head");
                    if(headEl){
                        headEl.style.breakInside = "avoid";
                        headEl.style.pageBreakInside = "avoid";
                    }
                    clone.querySelectorAll(".dc-post-card").forEach(card=>{
                        card.style.breakInside = "avoid";
                        card.style.pageBreakInside = "avoid";
                    });

                    await html2pdf().set({
                        margin: 8,
                        filename: `${issue.id}-epaper.pdf`,
                        image: {type:'jpeg', quality:0.9},
                        html2canvas: {scale:2, useCORS:true, allowTaint:true, backgroundColor:"#fff", letterRendering:true},
                        jsPDF: {unit:'mm', format:'a4', orientation:'portrait'},
                        pagebreak: {mode: ['avoid-all','css','legacy']}
                    }).from(clone).save();
                }catch(e){
                    console.error(e);
                    alert("PDF তৈরি করা যায়নি, প্রিন্ট ব্যবহার করুন।");
                }
                finally{ downloadBtn.innerHTML = original; downloadBtn.disabled = false; }
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
