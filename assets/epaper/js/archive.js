/*
  Daily Chalchitra ePaper Archive
  Final Fixed v3.2 - Cover fallback + removed dead PDF-field link
*/
document.addEventListener("DOMContentLoaded", async () => {
    const yearList = document.getElementById("dc-year-list");
    const archiveList = document.getElementById("dc-archive-list");
    if (!yearList ||!archiveList) return;

    let allIssues = [];
    archiveList.innerHTML = `<div class="dc-empty">লোড হচ্ছে...</div>`;

    try {
        const res = await fetch("/assets/epaper/issues/issues.json?v=" + Date.now());
        if (!res.ok) throw new Error("Issues not found");
        allIssues = await res.json();
    } catch (e) {
        archiveList.innerHTML = `<div class="dc-empty">আর্কাইভ লোড করা যায়নি। issues.json চেক করুন।</div>`;
        console.error(e);
        return;
    }

    if (!Array.isArray(allIssues) || allIssues.length === 0) {
        yearList.innerHTML = "";
        archiveList.innerHTML = `<div class="dc-empty">এখনো কোনো ই-পেপার প্রকাশিত হয়নি।</div>`;
        return;
    }

    // Auto Year List from issues - number sort fix
    const years = [...new Set(allIssues.map(i => String(i.year)))].sort((a,b) => Number(b) - Number(a));

    yearList.innerHTML = years.map(year =>
        `<button class="dc-year-btn" data-year="${year}">${year}</button>`
    ).join("");

    function renderYear(year) {
        yearList.querySelectorAll(".dc-year-btn").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.year == year);
        });

        const filtered = allIssues
           .filter(i => String(i.year) == String(year))
           .sort((a,b) => Number(b.week || 0) - Number(a.week || 0));

        if (filtered.length === 0) {
            archiveList.innerHTML = `<div class="dc-empty">এই বছরে কোনো ই-পেপার প্রকাশিত হয়নি।</div>`;
            return;
        }

        archiveList.innerHTML = `
            <div class="dc-issue-grid">
            ${filtered.map(issue => {
                const coverImg = issue.cover
                    ? `<img class="dc-cover" src="${issue.cover}" alt="${issue.title}" loading="lazy" onerror="this.outerHTML='<div class=&quot;dc-cover dc-cover-fallback&quot;><i class=&quot;fa fa-newspaper&quot;></i></div>'">`
                    : `<div class="dc-cover dc-cover-fallback"><i class="fa fa-newspaper"></i></div>`;

                return `
                <div class="dc-issue-card">
                    ${coverImg}
                    <div class="dc-body">
                        <div class="dc-date" style="font-size:12px;color:#888;margin-bottom:6px;">${issue.date || ''}</div>
                        <h3 class="dc-title" style="margin:0 0 6px 0;font-size:17px;">${issue.title || 'ই-পেপার'}</h3>
                        <div class="dc-pages" style="font-size:13px;color:#666;margin-bottom:12px;">${issue.count || 0} টি লেখা ${issue.pages? '| ' + issue.pages + ' পৃষ্ঠা' : ''}</div>
                        <a class="dc-btn" href="${issue.viewer || '#'}" style="background:#C00000;color:#fff;padding:7px 14px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:5px;">
                            <i class="fa fa-book-open"></i> পড়ুন ও PDF ডাউনলোড
                        </a>
                    </div>
                </div>
            `;
            }).join("")}
            </div>
        `;
    }

    yearList.querySelectorAll(".dc-year-btn").forEach(button => {
        button.addEventListener("click", () => renderYear(button.dataset.year));
    });

    // Load latest year automatically
    renderYear(years[0]);
});
