/*

Daily Chalchitra ePaper Viewer
Final Auto v2.0 - 100% Automatic

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
        pageInfo.innerHTML = `পৃষ্ঠা ${DCViewer.currentPage} / ${DCViewer.totalPages}`;
    }

    if(!issueId){
        title.textContent = "ই-পেপার পাওয়া যায়নি";
        return;
    }

    try {
        const res = await fetch("/assets/epaper/issues/issues.json");
        if(!res.ok) throw new Error("Issues missing");
        const issues = await res.json();
        const issue = issues.find(item => item.id === issueId);

        if(!issue){
            title.textContent = "ই-পেপার পাওয়া যায়নি";
            return;
        }

        title.textContent = issue.title;
        meta.innerHTML = `<strong>প্রকাশ:</strong> ${issue.date} <br><strong>মোট লেখা:</strong> ${issue.count} টি | <strong>পৃষ্ঠা:</strong> ${issue.pages}`;

        if(window.DCViewer){
            DCViewer.init(issueId);
            await DCViewer.start();
            updatePageInfo();
        }

        // Download PDF
        if(downloadBtn){
            downloadBtn.onclick = async () => {
                const viewer = document.querySelector("#dc-epaper-page");
                if(!viewer) return;
                try{
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF("p", "mm", "a4");
                    const canvas = await html2canvas(viewer, { scale:2, useCORS:true, backgroundColor:"#ffffff" });
                    const imgData = canvas.toDataURL("image/jpeg", 0.95);
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const imgWidth = pageWidth;
                    const imgHeight = canvas.height * imgWidth / canvas.width;
                    let heightLeft = imgHeight, position = 0;
                    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
                    heightLeft -= pdf.internal.pageSize.getHeight();
                    while(heightLeft > 0){ position = heightLeft - imgHeight; pdf.addPage(); pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight); heightLeft -= pdf.internal.pageSize.getHeight(); }
                    pdf.save(`${issue.id}-epaper.pdf`);
                }catch(e){ alert("PDF তৈরি করা যায়নি।"); }
            };
        }

        if(printBtn){
            printBtn.onclick = () => {
                const viewer = document.querySelector("#dc-epaper-page");
                if(!viewer) return;
                const win = window.open("", "_blank");
                win.document.write(`<html><head><title>${issue.title}</title><style>body{font-family:SolaimanLipi,Arial,sans-serif; line-height:1.8;} img{max-width:100%;} #dc-epaper-page{padding:20px;}</style></head><body>${viewer.outerHTML}</body></html>`);
                win.document.close();
                win.onload = () => win.print();
            };
        }

        if(fullscreenBtn){
            fullscreenBtn.onclick = async () => {
                const viewer = document.querySelector("#dc-epaper-page");
                try{ if(!document.fullscreenElement) await viewer.requestFullscreen(); else await document.exitFullscreen(); }catch(e){}
            };
        }

        prevBtn?.addEventListener("click", () => { DCViewer.previousPage(); updatePageInfo(); });
        nextBtn?.addEventListener("click", () => { DCViewer.nextPage(); updatePageInfo(); });
        zoomInBtn?.addEventListener("click", () => DCViewer.setZoom(DCViewer.zoom + 0.1));
        zoomOutBtn?.addEventListener("click", () => DCViewer.setZoom(Math.max(0.5, DCViewer.zoom - 0.1)));

        // Swipe
        let touchStartX = 0;
        document.addEventListener("touchstart", e => touchStartX = e.changedTouches[0].screenX);
        document.addEventListener("touchend", e => {
            const touchEndX = e.changedTouches[0].screenX;
            const distance = touchEndX - touchStartX;
            if(Math.abs(distance) < 60) return;
            if(distance < 0) DCViewer.nextPage(); else DCViewer.previousPage();
            updatePageInfo();
        });

    } catch (error){
        console.error(error);
        title.textContent = "ই-পেপার লোড করা যায়নি";
    }
});
