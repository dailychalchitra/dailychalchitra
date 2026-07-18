/*
  Daily Chalchitra ePaper Viewer
  Final Fixed v8.0 - No Double Gap + Single Post PDF
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

    // --- সিঙ্গেল পোস্ট PDF ফাংশন (নতুন) ---
    window.dcDownloadSinglePostPDF = async function(cardElement, postTitle){
        const btn = cardElement.querySelector(".dc-mini-pdf");
        const originalHTML = btn? btn.innerHTML : "";
        if(btn){
            btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>...';
            btn.style.pointerEvents = 'none';
        }
        try{
            const fileName = (postTitle || 'post').replace(/[\/\\:*?"<>|]/g,'').substring(0,50) + ".pdf";
            if(typeof html2pdf!== 'undefined'){
                const opt = {
                    margin: 10,
                    filename: fileName,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, backgroundColor: "#fff" },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                await html2pdf().set(opt).from(cardElement).save();
            } else {
                // Fallback: print only this card
                const win = window.open("", "_blank");
                win.document.write(`<html><head><title>${postTitle}</title><style>body{font-family:'Noto Sans Bengali',sans-serif;padding:20px;line-height:1.6;} img{max-width:100%;}</style></head><body>${cardElement.innerHTML}</body></html>`);
                win.document.close();
                win.onload = () => win.print();
            }
        } catch(e){
            console.error(e);
            alert("PDF তৈরি করা যায়নি।");
        } finally {
            if(btn){
                btn.innerHTML = originalHTML;
                btn.style.pointerEvents = 'auto';
            }
        }
    };

    async function injectCategoryAndStabak(issueId, postsData){
        try{
            const page = document.querySelector("#dc-epaper-page");
            if(!page) return;

            const doInject = () => {
                // 1. নিচের ডাবল small রিমুভ
                page.querySelectorAll(".dc-post-card small").forEach(el => {
                    if(el.textContent.includes("বিভাগ:") || el.textContent.includes("লেখক:")){
                        el.remove();
                    }
                });

                // 2. প্রতিটি কার্ডে ক্যাটাগরি + সিঙ্গেল PDF বাটন ইনজেক্ট
                page.querySelectorAll(".dc-post-card").forEach(card => {
                    const h2 = card.querySelector("h2");
                    if(!h2) return;
                    const cardTitle = h2.textContent.trim();

                    // ক্যাটাগরি খোঁজা
                    const postData = (postsData || []).find(p => p.title.trim() === cardTitle || cardTitle.includes(p.title.trim().substring(0,15)));
                    if(postData &&!card.querySelector(".dc-cat-author")){
                        let catName = postData.categories?.[0] || postData.category || "";
                        let authorName = postData.author || "";
                        if(catName || authorName){
                            const metaDiv = document.createElement("div");
                            metaDiv.className = "dc-cat-author";
                            let cat = catName? `বিভাগ: ${catName}` : "";
                            let auth = authorName? `লেখক: ${authorName}` : "";
                            metaDiv.innerHTML = `${cat}${cat && auth? " | " : ""}${auth}`;
                            h2.insertAdjacentElement('afterend', metaDiv);
                        }
                    }

                    // সিঙ্গেল PDF বাটন - যদি না থাকে
                    if(!card.querySelector(".dc-mini-pdf")){
                        const pdfBtn = document.createElement("a");
                        pdfBtn.href = "javascript:void(0)";
                        pdfBtn.className = "dc-mini-pdf";
                        pdfBtn.innerHTML = '<i class="fa fa-file-pdf"></i> PDF';
                        pdfBtn.onclick = () => window.dcDownloadSinglePostPDF(card, cardTitle);
                        card.style.position = "relative";
                        card.appendChild(pdfBtn);
                    }

                    // 3. ফাইনাল ফিক্স - ডাবল গ্যাপ বন্ধ
                    card.querySelectorAll("p").forEach(p => {
                        p.style.whiteSpace = "normal";
                        p.style.lineHeight = "1.5";
                        p.style.margin = "0";
                        p.style.padding = "0";
                        p.style.wordBreak = "break-word";
                    });
                    card.querySelectorAll("p + p").forEach(p => {
                        p.style.marginTop = "10px";
                    });
                    card.querySelectorAll("br + br").forEach(br => br.style.display = "none");
                });
            };

            setTimeout(doInject, 400);
            setTimeout(doInject, 1200);
            setTimeout(doInject, 2500);
        }catch(e){ console.log("Inject failed", e); }
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
            injectCategoryAndStabak(issueId, issue.posts);
        }

        // Toolbar Events
        prevBtn?.addEventListener("click", () => { DCViewer.previousPage(); updatePageInfo(); setTimeout(()=>injectCategoryAndStabak(issueId, issue.posts), 600); });
        nextBtn?.addEventListener("click", () => { DCViewer.nextPage(); updatePageInfo(); setTimeout(()=>injectCategoryAndStabak(issueId, issue.posts), 600); });
        zoomInBtn?.addEventListener("click", () => DCViewer.setZoom(DCViewer.zoom + 0.1));
        zoomOutBtn?.addEventListener("click", () => DCViewer.setZoom(Math.max(0.5, DCViewer.zoom - 0.1)));

        // Full Issue PDF
        if(downloadBtn){
            downloadBtn.onclick = async () => {
                const viewer = document.querySelector("#dc-epaper-page");
                if(!viewer) return;
                const original = downloadBtn.innerHTML;
                downloadBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> তৈরি হচ্ছে...';
                try{
                    if(typeof html2pdf!== 'undefined'){
                        await html2pdf().set({
                            margin: 5,
                            filename: `${issue.id}-epaper.pdf`,
                            image: {type:'jpeg', quality:0.98},
                            html2canvas: {scale:2, useCORS:true},
                            jsPDF: {unit:'mm', format:'a4', orientation:'portrait'}
                        }).from(viewer).save();
                    } else {
                        const { jsPDF } = window.jspdf;
                        const pdf = new jsPDF("p", "mm", "a4");
                        const canvas = await html2canvas(viewer, { scale:2, useCORS:true, backgroundColor:"#ffffff" });
                        const imgData = canvas.toDataURL("image/jpeg", 0.95);
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const imgHeight = canvas.height * pageWidth / canvas.width;
                        let heightLeft = imgHeight, position = 0;
                        pdf.addImage(imgData, "JPEG", 0, position, pageWidth, imgHeight);
                        heightLeft -= pdf.internal.pageSize.getHeight();
                        while(heightLeft > 0){ position = heightLeft - imgHeight; pdf.addPage(); pdf.addImage(imgData, "JPEG", 0, position, pageWidth, imgHeight); heightLeft -= pdf.internal.pageSize.getHeight(); }
                        pdf.save(`${issue.id}-epaper.pdf`);
                    }
                }catch(e){ alert("PDF তৈরি করা যায়নি।"); }
                finally{ downloadBtn.innerHTML = original; }
            };
        }

        if(printBtn){
            printBtn.onclick = () => window.print();
        }

        if(fullscreenBtn){
            fullscreenBtn.onclick = async () => {
                const viewer = document.querySelector("#dc-epaper-page");
                try{ if(!document.fullscreenElement) await viewer.requestFullscreen(); else await document.exitFullscreen(); }catch(e){}
            };
        }

    } catch (error){
        console.error(error);
        if(title) title.textContent = "ই-পেপার লোড করা যায়নি";
    }
});
