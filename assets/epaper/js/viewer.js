/*
==================================
Daily Chalchitra ePaper Viewer
Version : 1.1
==================================
*/

document.addEventListener("DOMContentLoaded", async () => {

    const title = document.getElementById("dc-title");
    const meta = document.getElementById("dc-meta");
    const pdf = document.getElementById("dc-pdf");

    const downloadBtn = document.getElementById("dc-download");
    const printBtn = document.getElementById("dc-print");

    const params = new URLSearchParams(window.location.search);
    const issueId = params.get("issue");

    if (!issueId) {

        title.textContent = "ই-পেপার পাওয়া যায়নি";
        meta.innerHTML = "";

        return;

    }

    const year = issueId.substring(0, 4);

    try {

        const res = await fetch(`/assets/epaper/issues/${year}.json`);

        if (!res.ok) {
            throw new Error("Issue file not found");
        }

        const issues = await res.json();

        const issue = issues.find(item => item.id === issueId);

        if (!issue) {

            title.textContent = "ই-পেপার পাওয়া যায়নি";
            meta.innerHTML = "";

            return;

        }

        title.textContent = issue.title;

        meta.innerHTML = `
            <strong>প্রকাশ:</strong> ${issue.date}<br>
            <strong>পৃষ্ঠা:</strong> ${issue.pages}
        `;

        pdf.src = issue.pdf;

        if (downloadBtn) {

            downloadBtn.onclick = () => {
                window.open(issue.pdf, "_blank");
            };

        }

        if (printBtn) {

            printBtn.onclick = () => {
                window.open(issue.pdf, "_blank");
            };

        }

    } catch (error) {

        console.error(error);

        title.textContent = "ই-পেপার লোড করা যায়নি";

        meta.innerHTML = `
            <div class="dc-empty">
                দুঃখিত! ই-পেপারটি লোড করা সম্ভব হচ্ছে না।
            </div>
        `;

    }

});
