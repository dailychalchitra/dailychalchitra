/* ==========================================================
   Daily Chalchitra - Single Toolbar Injector - v9.0 Rebuild
   PDF + Print + Fullscreen
   ========================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const article = document.querySelector("article") || document.querySelector(".post-container") || document.querySelector(".post-body");
    if (!article) return;
    if (document.querySelector(".dc-single-toolbar")) return;

    const toolbar = document.createElement("div");
    toolbar.className = "dc-single-toolbar";
    toolbar.innerHTML = `
        <button id="dc-single-pdf-btn" data-pdf-btn><i class="fa fa-file-pdf"></i> PDF ডাউনলোড</button>
        <button id="dc-single-print"><i class="fa fa-print"></i> প্রিন্ট</button>
        <button id="dc-single-fullscreen"><i class="fa fa-expand"></i> ফুলস্ক্রিন</button>
    `;

    const body = article.querySelector(".dc-post-body") || article.querySelector(".post-content") || article.querySelector(".post-body-content") || article;
    if (body && body.parentNode && body !== article) {
        body.parentNode.insertBefore(toolbar, body);
    } else {
        const h1 = article.querySelector("h1");
        if(h1 && h1.nextSibling){
            h1.parentNode.insertBefore(toolbar, h1.nextSibling);
        } else {
            article.prepend(toolbar);
        }
    }

    // PDF
    document.getElementById("dc-single-pdf-btn")?.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.DCSinglePDF && typeof window.DCSinglePDF.download === 'function') {
            window.DCSinglePDF.download(article);
        } else {
            if(typeof html2pdf !== 'undefined'){
                const title = document.querySelector("h1")?.innerText || "post";
                html2pdf().set({
                  margin: 8,
                  filename: title.substring(0,50) + ".pdf",
                  image: {type:'jpeg', quality:0.98},
                  html2canvas: {scale:2, useCORS:true},
                  jsPDF: {unit:'mm', format:'a4', orientation:'portrait'}
                }).from(article).save();
            } else {
                window.print();
            }
        }
    });

    // Print
    document.getElementById("dc-single-print")?.addEventListener("click", () => {
        window.print();
    });

    // Fullscreen
    document.getElementById("dc-single-fullscreen")?.addEventListener("click", async () => {
        try {
            const target = document.documentElement;
            if (!document.fullscreenElement) {
                await target.requestFullscreen();
                document.getElementById("dc-single-fullscreen").innerHTML = '<i class="fa fa-compress"></i> বের হোন';
            } else {
                await document.exitFullscreen();
                document.getElementById("dc-single-fullscreen").innerHTML = '<i class="fa fa-expand"></i> ফুলস্ক্রিন';
            }
        } catch (e) { 
            console.error(e);
        }
    });

    document.addEventListener("fullscreenchange", () => {
        const btn = document.getElementById("dc-single-fullscreen");
        if(!btn) return;
        if(!document.fullscreenElement){
            btn.innerHTML = '<i class="fa fa-expand"></i> ফুলস্ক্রিন';
        }
    });
});
