/*
==================================
Daily Chalchitra ePaper Archive
Version : 1.0
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

    console.log(
        "Daily Chalchitra Archive Ready"
    );

});
