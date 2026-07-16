/*
==================================
Daily Chalchitra ePaper Archive
Version : 1.2
==================================
*/

document.addEventListener("DOMContentLoaded", () => {

    const yearList =
        document.getElementById("dc-year-list");

    const archiveList =
        document.getElementById("dc-archive-list");

    if (!yearList || !archiveList) {

        console.error(
            "Archive container not found."
        );

        return;

    }

    const startYear = 2026;

    const currentYear =
        new Date().getFullYear();

    let years = [];

    for (
        let year = currentYear;
        year >= startYear;
        year--
    ) {

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


    /*
    ==================================
    Load Archive by Year
    ==================================
    */

    async function loadArchive(year){

        archiveList.innerHTML =
        `
        <div class="dc-empty">
            লোড হচ্ছে...
        </div>
        `;

        try{

            const res =
            await fetch(
                `/assets/epaper/issues/${year}.json`
            );

            if(!res.ok){

                throw new Error(
                    "Issue file not found"
                );

            }

            const issues =
                await res.json();

            const published =
                issues.filter(
                    issue => issue.published
                );

            if(published.length === 0){

                archiveList.innerHTML =
                `
                <div class="dc-empty">
                    এই বছরে কোনো ই-পেপার প্রকাশিত হয়নি।
                </div>
                `;

                return;

            }

            published.sort(
                (a,b)=>b.week-a.week
            );

            let issueHTML = "";

            published.forEach(issue => {

                issueHTML += `
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
                            href="/epaper/viewer/?issue=${issue.id}">
                            পড়ুন
                        </a>

                    </div>

                </div>
                `;

            });

            archiveList.innerHTML =
            `
            <div class="dc-issue-grid">
                ${issueHTML}
            </div>
            `;

        }

        catch(error){

            console.error(error);

            archiveList.innerHTML =
            `
            <div class="dc-empty">
                এই বছরের আর্কাইভ পাওয়া যায়নি।
            </div>
            `;

        }

    }


    /*
    ==================================
    Year Button Events
    ==================================
    */

    yearList
    .querySelectorAll(".dc-year-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                loadArchive(
                    button.dataset.year
                );

            }
        );

    });


    /*
    ==================================
    Load Current Year Automatically
    ==================================
    */

    loadArchive(currentYear);

    console.log(
        "Daily Chalchitra Archive Ready"
    );

});
