/*
  Daily Chalchitra ePaper - Home
  Final Fixed v3.1 - With PDF & Latest Sort
*/
document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("dc-issues");
    if (!container) return;

    container.innerHTML = `<div class="dc-empty">লোড হচ্ছে...</div>`;

    try {
        const res = await fetch("/assets/epaper/issues/issues.json?v=" + Date.now());
        if (!res.ok) throw new Error("Not found");
        let issues = await res.json();

        if (!Array.isArray(issues) || issues.length === 0) {
            container.innerHTML = `<div class="dc-empty">এখনও কোনো ই-পেপার প্রকাশিত হয়নি।</div>`;
            return;
        }

        // Sort by year+week desc for latest
        issues.sort((a,b) => {
            if (String(a.year) !== String(b.year)) return Number(b.year) - Number(a.year);
            return Number(b.week||0) - Number(a.week||0);
        });

        // Latest 8 issues for homepage
        const latest = issues.slice(0, 8);

        container.innerHTML = `
            <div class="dc-issue-grid">
            ${latest.map(issue => `
                <div class="dc-issue-card">
                    ${issue.cover? `<img class="dc-cover" src="${issue.cover}" alt="${issue.title}" loading="lazy">` : ''}
                    <div class="dc-body">
                        <div class="dc-date" style="font-size:12px;color:#888;margin-bottom:6px;">${issue.date || ''}</div>
                        <h3 class="dc-title" style="margin:0 0 6px 0;font-size:17px;line-height:1.4;">${issue.title || 'ই-পেপার'}</h3>
                        <div class="dc-pages" style="font-size:13px;color:#666;margin-bottom:14px;">${issue.count || 0} টি লেখা ${issue.pages? '| ' + issue.pages + ' পৃষ্ঠা' : ''}</div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                            <a class="dc-btn" href="${issue.viewer || '/epaper/archive/'}" style="background:#C00000;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:5px;">
                                <i class="fa fa-book-open"></i> পড়ুন
                            </a>
                            ${issue.pdf? `<a href="${issue.pdf}" download style="background:#fff;color:#C00000;border:1.2px solid #C00000;padding:7px 12px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;display:inline-flex;align-items:center;gap:5px;"><i class="fa fa-file-pdf"></i> PDF</a>` : ''}
                        </div>
                    </div>
                </div>
            `).join("")}
            </div>
            <div style="text-align:center; margin-top:30px;">
                <a href="/epaper/archive/" style="background:#111;color:#fff;padding:10px 22px;border-radius:20px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">সকল আর্কাইভ দেখুন →</a>
            </div>
        `;

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="dc-empty">ই-পেপার লোড করা যায়নি। পরে আবার চেষ্টা করুন।</div>`;
    }
});
