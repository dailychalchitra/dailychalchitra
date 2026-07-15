/*
==================================
Daily Chalchitra ePaper Viewer
Version 1.0
==================================
*/

document.addEventListener("DOMContentLoaded", async () => {

    const title = document.getElementById("dc-title");
    const meta = document.getElementById("dc-meta");
    const pdf = document.getElementById("dc-pdf");

    const params = new URLSearchParams(window.location.search);

    const issueId = params.get("issue");

    if (!issueId) {

        title.textContent = "ই-পেপার পাওয়া যায়নি";

        meta.innerHTML = "";

        return;

    }

    const year = issueId.substring(0,4);

    try{

        const res = await fetch(`/assets/epaper/issues/${year}.json`);

        const issues = await res.json();

        const issue = issues.find(x => x.id === issueId);

        if(!issue){

            title.textContent = "ই-পেপার পাওয়া যায়নি";

            return;

        }

        title.textContent = issue.title;

        meta.innerHTML = `
            <strong>প্রকাশ:</strong> ${issue.date}
            <br>
            <strong>পৃষ্ঠা:</strong> ${issue.pages}
        `;

        pdf.src = issue.pdf;

    }

    catch(e){

        title.textContent = "ই-পেপার লোড করা যায়নি";

        console.error(e);

    }

});
