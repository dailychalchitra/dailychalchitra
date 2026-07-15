/*
==========================================
Daily Chalchitra ePaper
Version : 2.0
==========================================
*/

document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("dc-issues");

    if (!container) return;

    const currentYear = new Date().getFullYear();

    try {

        const response = await fetch(`/assets/epaper/issues/${currentYear}.json`);

        if (!response.ok) {
            throw new Error("Issue file not found");
        }

        const issues = await response.json();

        const publishedIssues = issues.filter(issue => issue.published);

        if (publishedIssues.length === 0) {

            container.innerHTML = `
                <div class="dc-empty">
                    এখনও কোনো ই-পেপার প্রকাশিত হয়নি।
                </div>
            `;

            return;
        }

        publishedIssues.sort((a, b) => b.week - a.week);

        let html = "";

        publishedIssues.forEach(issue => {

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
                        ${issue.pages} পৃষ্ঠা
                    </div>

                    <a
                        class="dc-btn"
                        href="${issue.pdf}"
                        target="_blank">
                        পড়ুন
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

    } catch (err) {

        console.error(err);

        container.innerHTML = `
            <div class="dc-empty">
                ই-পেপার লোড করা যায়নি।
            </div>
        `;

    }

});
