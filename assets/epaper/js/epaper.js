/*
===========================================
Daily Chalchitra ePaper
Version : 1.0
===========================================
*/

document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("dc-issues");

    if (!container) return;

    try{

        const response = await fetch("/assets/epaper/issues/issues.json");

        const issues = await response.json();

        if(!issues.length){

            container.innerHTML = `
                <div class="dc-empty">
                    প্রথম সংখ্যা এখনও প্রকাশিত হয়নি।
                </div>
            `;

            return;

        }

        let html="";

        issues.forEach(issue=>{

            html += `
            <div class="dc-issue-card">

                <img
                    class="dc-cover"
                    src="${issue.cover}"
                    alt="${issue.title}">

                <div class="dc-body">

                    <div class="dc-date">
                        ${issue.date}
                    </div>

                    <div class="dc-title">
                        ${issue.title}
                    </div>

                    <div class="dc-pages">
                        মোট ${issue.pages} পৃষ্ঠা
                    </div>

                    <a
                        class="dc-btn"
                        href="${issue.viewer}">
                        ই-পেপার পড়ুন
                    </a>

                </div>

            </div>
            `;

        });

        container.innerHTML = `
            <div class="dc-issue-grid">
                ${html}
            </div>
        `;

    }catch(e){

        container.innerHTML = `
            <div class="dc-empty">
                ই-পেপার লোড করা যায়নি।
            </div>
        `;

    }

});
