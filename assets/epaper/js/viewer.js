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

        // Full Issue PDF - ফন্ট লোড অপেক্ষা + সংযত পেজ-ব্রেক (বড় কার্ডে জোর করে না ভেঙে)
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
                    // বাংলা ফন্ট (Hind Siliguri/Noto Sans Bengali) সম্পূর্ণ লোড না
                    // হওয়া পর্যন্ত অপেক্ষা - নাহলে html2canvas যুক্তাক্ষর ভুল আঁকে
                    if(document.fonts && document.fonts.ready){
                        await document.fonts.ready;
                    }

                    const clone = viewer.cloneNode(true);
                    clone.querySelectorAll(".dc-mini-pdf").forEach(b=>b.remove());
                    clone.querySelectorAll("img").forEach(img=>img.setAttribute("crossorigin","anonymous"));

                    const columnsEl = clone.querySelector("#dc-post-columns");
                    if(columnsEl){
                        columnsEl.style.columnCount = "1";
                        columnsEl.style.columnGap = "0";
                    }

                    // শুধু ছোট এলিমেন্ট (হেডিং, ক্যাটাগরি লাইন, প্রতিটা প্যারাগ্রাফ)
                    // ভাঙা এড়ানো হবে - পুরো কার্ডে না, নাহলে বড় কার্ড জোর করে
                    // পরের পেজে ঠেলে বিশাল ফাঁকা জায়গা তৈরি করে
                    const headEl = clone.querySelector(".dc-paper-head");
                    if(headEl){
                        headEl.style.breakInside = "avoid";
                        headEl.style.pageBreakInside = "avoid";
                    }
                    clone.querySelectorAll(".dc-post-card h2, .dc-post-card .dc-cat-author, .dc-post-card p").forEach(el=>{
                        el.style.breakInside = "avoid";
                        el.style.pageBreakInside = "avoid";
                    });

                    await html2pdf().set({
                        margin: 8,
                        filename: `${issue.id}-epaper.pdf`,
                        image: {type:'jpeg', quality:0.9},
                        html2canvas: {scale:2, useCORS:true, allowTaint:true, backgroundColor:"#fff"},
                        jsPDF: {unit:'mm', format:'a4', orientation:'portrait'},
                        pagebreak: {mode: ['css','legacy']}
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
