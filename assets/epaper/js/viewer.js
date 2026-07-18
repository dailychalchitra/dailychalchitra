/*
  Daily Chalchitra ePaper Viewer
  Final Fixed v8.1 - Download Failed Fixed + No Empty
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

    // --- সিঙ্গেল পোস্ট PDF - 100% Fixed ---
    window.dcDownloadSinglePostPDF = async function(cardElement, postTitle){
        const btn = cardElement.querySelector(".dc-mini-pdf");
        const originalHTML = btn? btn.innerHTML : "";
        if(btn){
            btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
            btn.style.pointerEvents = 'none';
        }
        try{
            const fileName = (postTitle || 'post').replace(/[\/\\:*?"<>|]/g,'').substring(0,40) + ".pdf";

            // ক্লোন বানিয়ে ছবির crossOrigin ঠিক করা
            const clone = cardElement.cloneNode(true);
            clone.querySelectorAll("img").forEach(img => {
                img.setAttribute("crossorigin","anonymous");
                img.style.maxWidth = "100%";
            });
            // PDF বাটন ক্লোন থেকে বাদ
            const cloneBtn = clone.querySelector(".dc-mini-pdf");
            if(cloneBtn) cloneBtn.remove();

            const opt = {
                margin: 10,
                filename: fileName,
                image: { type: 'jpeg', quality: 0.92 },
                html2canvas: { scale: 1.8, useCORS: true, allowTaint: true, backgroundColor: "#ffffff", logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(clone).save();

        } catch(e){
            console.error("PDF Error:", e);
            // Fallback 2: ছবি ছাড়া PDF - তাহলে কখনো Download Failed হবে না
            try{
                const clone2 = cardElement.cloneNode(true);
                clone2.querySelectorAll("img,.dc-mini-pdf").forEach(el=>el.remove());
                await html2pdf().set({
                    margin: 10,
                    filename: (postTitle || 'post').substring(0,40)+".pdf",
                    html2canvas: { scale:2 },
                    jsPDF: { unit:'mm', format:'a4', orientation:'portrait' }
                }).from(clone2).save();
            } catch(e2){
                alert("PDF তৈরি করা যায়নি, প্রিন্ট ব্যবহার করুন।");
                window.print();
            }
        } finally {
            if(btn){
                btn.innerHTML = originalHTML;
                btn.style.pointerEvents = 'auto';
            }
        }
    };

    async function injectCategoryAndStabak(issueId, postsData){
        const page = document.querySelector("#dc-epaper-page");
        if(!page) return;

        // একবারই ইনজেক্ট হবে
        if(page.dataset.injected === "1") return;
        page.dataset.injected = "1";

        // 1. ডাবল small রিমুভ - একবারই
        page.querySelectorAll(".dc-post-card small").forEach(el => {
            if(el.textContent.includes("বিভাগ:") || el.textContent.includes("লেখক:")){
                el.remove();
            }
        });

        // 2. প্রতিটি কার্ডে ক্যাটাগরি + PDF বাটন
        page.querySelectorAll(".dc-post-card").forEach(card => {
            if(card.dataset.fixed === "1") return;
            card.dataset.fixed = "1";

            const h2 = card.querySelector("h2");
            if(!h2) return;
            const cardTitle = h2.textContent.trim();

            const postData = (postsData || []).find(p => {
                const t = (p.title || "").trim();
                return t === cardTitle || cardTitle.includes(t.substring(0,15));
            });

            if(postData &&!card.querySelector(".dc-cat-author")){
                let catName = postData.categories?.[0] || postData.category || "";
                let authorName = postData.author || "";
                if(catName || authorName){
                    const metaDiv = document.createElement("div");
                    metaDiv.className = "dc-cat-author";
                    metaDiv.innerHTML = `${catName? 'বিভাগ: '+catName : ''}${catName && authorName? ' | ' : ''}${authorName? 'লেখক: '+authorName : ''}`;
                    h2.insertAdjacentElement('afterend', metaDiv);
                }
            }

            if(!card.querySelector(".dc-mini-pdf")){
                const pdfBtn = document.createElement("a");
                pdfBtn.href = "javascript:void(0)";
                pdfBtn.className = "dc-mini-pdf";
                pdfBtn.innerHTML = '<i class="fa fa-file-pdf"></i> PDF';
                pdfBtn.onclick = (e) => { e.preventDefault(); window.dcDownloadSinglePostPDF(card, cardTitle); };
                card.style.position = "relative";
                card.appendChild(pdfBtn);
            }

            // ডাবল গ্যাপ ফিক্স
            card.querySelectorAll("p").forEach(p => {
                p.style.margin = "0 0 10px 0";
                p.style.lineHeight = "1.6";
            });
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

            // পোস্ট লোড হওয়ার পর 1 বার ইনজেক্ট
            const checkLoad = setInterval(() => {
                const cols = document.getElementById("dc-post-columns");
                if(cols &&!cols.innerHTML.includes("লোড হচ্ছে") && cols.querySelector(".dc-post-card")){
                    clearInterval(checkLoad);
                    injectCategoryAndStabak(issueId, issue.posts);
                }
            }, 500);
            setTimeout(()=>clearInterval(checkLoad), 10000);
        }

        prevBtn?.addEventListener("click", () => {
            setTimeout(()=>{ updatePageInfo(); const p=document.querySelector("#dc-epaper-page"); if(p) p.dataset.injected=""; injectCategoryAndStabak(issueId, issue.posts); }, 700);
        });
        nextBtn?.addEventListener("click", () => {
            setTimeout(()=>{ updatePageInfo(); const p=document.querySelector("#dc-epaper-page"); if(p) p.dataset.injected=""; injectCategoryAndStabak(issueId, issue.posts); }, 700);
        });
        zoomInBtn?.addEventListener("click", () => DCViewer.setZoom(DCViewer.zoom + 0.1));
        zoomOutBtn?.addEventListener("click", () => DCViewer.setZoom(Math.max(0.5, DCViewer.zoom - 0.1)));

        // Full Issue PDF - Fixed
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

                    await html2pdf().set({
                        margin: 5,
                        filename: `${issue.id}-epaper.pdf`,
                        image: {type:'jpeg', quality:0.9},
                        html2canvas: {scale:1.5, useCORS:true, allowTaint:true, backgroundColor:"#fff"},
                        jsPDF: {unit:'mm', format:'a4', orientation:'portrait'}
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
