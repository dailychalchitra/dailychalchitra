/*

Daily Chalchitra ePaper Archive
Final Auto v2.0 - 100% Automatic

*/
document.addEventListener("DOMContentLoaded", async () => {
    const yearList = document.getElementById("dc-year-list");
    const archiveList = document.getElementById("dc-archive-list");
    if (!yearList ||!archiveList) return;

    let allIssues = [];

    try {
        const res = await fetch("/assets/epaper/issues/issues.json");
        if (!res.ok) throw new Error("Issues not found");
        allIssues = await res.json();
    } catch (e) {
        archiveList.innerHTML = `<div class="dc-empty">আর্কাইভ লোড করা যায়নি।</div>`;
        return;
    }

    if (allIssues.length === 0) {
        yearList.innerHTML = "";
        archiveList.innerHTML = `<div class="dc-empty">এখনো কোনো ই-পেপার প্রকাশিত হয়নি।</div>`;
        return;
    }

    // Auto Year List from issues
    const years = [...new Set(allIssues.map(i => i.year))].sort((a,b) => b-a);

    yearList.innerHTML = years.map(year =>
        `<button class="dc-year-btn" data-year="${year}">${year}</button>`
    ).join("");

    function renderYear(year) {
        yearList.querySelectorAll(".dc-year-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.year == year);
        });

        const filtered = allIssues.filter(i => i.year == year).sort((a,b) => b.week - a.week);

        if (filtered.length === 0) {
            archiveList.innerHTML = `<div class="dc-empty">এই বছরে কোনো ই-পেপার প্রকাশিত হয়নি।</div>`;
            return;
        }

        archiveList.innerHTML = `
            <div class="dc-issue-grid">
            ${filtered.map(issue => `
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
        `;
    }

    yearList.querySelectorAll(".dc-year-btn").forEach(button => {
        button.addEventListener("click", () => renderYear(button.dataset.year));
    });

    // Load latest year automatically
    renderYear(years[0]);
});
