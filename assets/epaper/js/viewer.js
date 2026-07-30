/* ==========================================================
   Daily Chalchitra ePaper Viewer - v9.1
   FINAL - Clean + Print PDF logic + Blank Page Fix
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
                alert("প্রিন্ট ডায়ালগ খুলবে - \"Save as PDF\" বেছে নিন।");
                window.print();
            };
        }

        if(printBtn) printBtn.onclick = () => window.print();
        
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

/* ==========================================================
   PRINT FIX — প্রথম ও শেষের ফাঁকা পেজ সমস্যা সমাধান
   বাকি সাইট (header/footer/ticker/menu ইত্যাদি) যাই থাকুক না কেন,
   প্রিন্টের সময় শুধু #dc-epaper-page-এর একটা কপি body-র সরাসরি
   সন্তান (direct child) বানিয়ে বাকি সব display:none করে দেওয়া হয়।
   এতে অন্য কোনো এলিমেন্টের অদৃশ্য কিন্তু জায়গা-দখলকারী height
   আর কোনো প্রভাব ফেলতে পারবে না।
   ========================================================== */
window.addEventListener("beforeprint", () => {
    const original = document.getElementById("dc-epaper-page");
    if (!original) return;

    // পুরনো ক্লোন থাকলে সরিয়ে দিন
    const oldClone = document.getElementById("dc-print-clone");
    if (oldClone) oldClone.remove();

    const clone = original.cloneNode(true);
    clone.id = "dc-print-clone";
    document.body.appendChild(clone);

    let style = document.getElementById("dc-print-style");
    if (!style) {
        style = document.createElement("style");
        style.id = "dc-print-style";
        document.head.appendChild(style);
    }
    style.innerHTML = `
        @media print {
            body > *:not(#dc-print-clone) { display: none !important; }

            html, body {
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
            }

            #dc-print-clone {
                display: block !important;
                position: static !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 8px !important;
                box-shadow: none !important;
                border: none !important;
            }

            #dc-print-clone .dc-paper-head {
                display: block !important;
                margin-bottom: 5px !important;
                padding-bottom: 5px !important;
                break-after: avoid !important;
                page-break-after: avoid !important;
            }
            #dc-print-clone .dc-paper-logo {
                max-width: 130px !important;
                margin-bottom: 2px !important;
            }
            #dc-print-clone .dc-mini-pdf { display: none !important; }

            #dc-print-clone #dc-post-columns {
                column-count: 4 !important;
                column-gap: 18px !important;
                column-fill: auto !important;
                text-align: justify !important;
            }
            #dc-print-clone .kobita-pera.kobita-date { break-inside: avoid !important; }
        }
    `;
});

window.addEventListener("afterprint", () => {
    const clone = document.getElementById("dc-print-clone");
    if (clone) clone.remove();
});
