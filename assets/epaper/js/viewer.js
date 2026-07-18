/*
Daily Chalchitra ePaper Viewer
Final Auto v5.0 - Fixed for categories[] + author
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

    async function injectCategoryAndStabak(issueId){
        try{
            const res = await fetch("/assets/epaper/issues/issues.json");
            if(!res.ok) return;
            const issues = await res.json();
            const issue = issues.find(i => i.id === issueId);
            if(!issue ||!issue.posts) return;

            const page = document.querySelector("#dc-epaper-page");
            if(!page) return;

            const doInject = () => {
                issue.posts.forEach(post => {
                    // category can be categories array or category string
                    let catName = "";
                    if(post.categories && post.categories.length > 0) catName = post.categories[0];
                    else if(post.category) catName = post.category;

                    let authorName = post.author || "";

                    const titles = page.querySelectorAll("h2, h3,.dc-post-title");
                    titles.forEach(el => {
                        // টাইটেল মিললে
                        if(el.textContent.trim() === post.title.trim() || el.textContent.trim().includes(post.title.trim().substring(0,15))){
                            if(el.nextElementSibling && el.nextElementSibling.classList.contains("dc-cat-author")) {
                                return; // already injected
                            }
                            const metaDiv = document.createElement("div");
                            metaDiv.className = "dc-cat-author";
                            metaDiv.style.cssText = "font-size:14px; color:#555; margin:6px 0 14px 0; border-left:3px solid #C00000; padding-left:8px; font-family:SolaimanLipi, sans-serif;";

                            let cat = catName? `বিভাগ: ${catName}` : "";
                            let auth = authorName? `লেখক: ${authorName}` : "";
                            let sep = (cat && auth)? " | " : "";
                            metaDiv.innerHTML = `${cat}${sep}${auth}`;

                            if(cat || auth){
                                el.insertAdjacentElement('afterend', metaDiv);
                            }
                        }
                    });
                });
            };

            setTimeout(doInject, 800);
            setTimeout(doInject, 2000);
            setTimeout(doInject, 4000);
        }catch(e){ console.log("Inject failed", e); }
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
            injectCategoryAndStabak(issueId);
        }

        prevBtn?.addEventListener("click", () => { DCViewer.previousPage(); updatePageInfo(); setTimeout(()=>injectCategoryAndStabak(issueId), 600); });
        nextBtn?.addEventListener("click", () => { DCViewer.nextPage(); updatePageInfo(); setTimeout(()=>injectCategoryAndStabak(issueId), 600); });
        zoomInBtn?.addEventListener("click", () => DCViewer.setZoom(DCViewer.zoom + 0.1));
        zoomOutBtn?.addEventListener("click", () => DCViewer.setZoom(Math.max(0.5, DCViewer.zoom - 0.1)));

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

    } catch (error){
        console.error(error);
        title.textContent = "ই-পেপার লোড করা যায়নি";
    }
});
