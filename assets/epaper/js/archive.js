/*
==================================
Daily Chalchitra ePaper Archive
Version : 1.1
==================================
*/

document.addEventListener("DOMContentLoaded", () => {

    const yearList = document.getElementById("dc-year-list");
    const archiveList = document.getElementById("dc-archive-list");

    if (!yearList || !archiveList) {
        console.error("Archive container not found.");
        return;
    }

    const startYear = 2026;
    const currentYear = new Date().getFullYear();

    let years = [];

    for (let year = currentYear; year >= startYear; year--) {
        years.push(year);
    }

    let html = "";

    years.forEach(year => {

        html += `
            <button
                class="dc-year-btn"
                data-year="${year}">
                ${year}
            </button>
        `;

    });

    yearList.innerHTML = html;

    console.log("Archive Years Ready");

});
