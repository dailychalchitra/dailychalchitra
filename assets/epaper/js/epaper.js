/*

Daily Chalchitra ePaper - Home
Final Auto v2.0 - 100% Automatic

*/
document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("dc-issues");
    if (!container) return;

    try {
        const res = await fetch("/assets/epaper/issues/issues.json");
        if (!res.ok) throw new Error("Not found");
        const issues = await res.json();

        if (issues.length === 0) {
            container.innerHTML = `<div class="dc-empty">এখনও কোনো ই-পেপার প্রকাশিত হয়নি।</div>`;
            return;
        }

        // Latest 8 issues for homepage
        const latest = issues.slice(0, 8);

        container.innerHTML = `
            <div class="dc-issue-grid">
            ${latest.map(issue => `
                <div class="dc-issue-card">
                    <div class="dc-body">
                        <div class="dc-date">${issue.date}</div>
                        <div class="dc-title">${issue.title}</div>
                        <div class="dc-pages">${issue.count} টি লেখা | ${issue.pages} পৃষ্ঠা</div>
                        <a class="dc-btn" href="${issue.viewer}">পড়ুন</a>
                    </div>
                </div>
            `).join("")}
            </div>
            <div style="text-align:center; margin-top:30px;">
                <a href="/epaper/archive/" class="dc-btn">সকল আর্কাইভ দেখুন</a>
            </div>
        `;

    } catch (err) {
        container.innerHTML = `<div class="dc-empty">ই-পেপার লোড করা যায়নি।</div>`;
    }
});
