/*

Daily Chalchitra - Single Post Toolbar Injector
Final Auto v2.1

*/
document.addEventListener("DOMContentLoaded", () => {
    const article = document.querySelector("article");
    if (!article) return;

    // Create Toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "dc-single-toolbar";
    toolbar.innerHTML = `
        <button id="dc-single-download" data-pdf-btn>📥 ডাউনলোড</button>
        <button id="dc-single-print">🖨️ প্রিন্ট</button>
        <button id="dc-single-fullscreen">⛶ ফুলস্ক্রিন</button>
    `;

    // Insert Toolbar before content
    const body = article.querySelector(".dc-post-body") || article.querySelector(".post-content") || article;
    if (body && body.parentNode) {
        body.parentNode.insertBefore(toolbar, body);
    } else {
        article.prepend(toolbar);
    }

    // Download
    document.getElementById("dc-single-download")?.addEventListener("click", () => {
        if (window.DCSinglePDF) {
            DCSinglePDF.download(article);
        } else {
            alert("PDF সিস্টেম লোড হয়নি।");
        }
    });

    // Print - Fixed
    document.getElementById("dc-single-print")?.addEventListener("click", () => {
        const title = document.querySelector("h1")?.innerText || "দৈনিক চালচিত্র";
        const printWindow = window.open("", "_blank");
        if (!printWindow) { alert("পপ-আপ ব্লক করা আছে।"); return; }
        printWindow.document.write(`
            <html><head><title>${title}</title>
            <style>
                body{font-family:'SolaimanLipi','Noto Sans Bengali',Arial,sans-serif; padding:20px; line-height:1.8; max-width:800px; margin:auto; color:#111;}
                img{max-width:100%; height:auto;}
                h1{color:#C00000;}
            </style>
            </head><body>${article.innerHTML}</body></html>
        `);
        printWindow.document.close();
        printWindow.onload = () => { printWindow.print(); };
    });

    // Fullscreen
    document.getElementById("dc-single-fullscreen")?.addEventListener("click", async () => {
        try {
            if (!document.fullscreenElement) await article.requestFullscreen();
            else await document.exitFullscreen();
        } catch (e) { console.error(e); }
    });

    console.log("Single Toolbar Auto Ready");
});
