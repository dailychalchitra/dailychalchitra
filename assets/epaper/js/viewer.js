/*
==================================
Daily Chalchitra ePaper Viewer
Version : 1.2
==================================
*/


document.addEventListener("DOMContentLoaded", async () => {


    const title =
    document.getElementById("dc-title");


    const meta =
    document.getElementById("dc-meta");


    const pdfFrame =
    document.getElementById("dc-pdf");


    const downloadBtn =
    document.getElementById("dc-download");


    const printBtn =
    document.getElementById("dc-print");


    const prevBtn =
    document.getElementById("dc-prev");


    const nextBtn =
    document.getElementById("dc-next");


    const zoomInBtn =
    document.getElementById("dc-zoom-in");


    const zoomOutBtn =
    document.getElementById("dc-zoom-out");


    const pageInfo =
    document.getElementById("dc-page-info");



    const params =
    new URLSearchParams(
        window.location.search
    );


    const issueId =
    params.get("issue");



    if(!issueId){


        title.textContent =
        "ই-পেপার পাওয়া যায়নি";


        meta.innerHTML = "";


        return;


    }



    const year =
    issueId.substring(0,4);



    function updatePageInfo(){


        if(!window.DCViewer || !pageInfo){

            return;

        }


        pageInfo.innerHTML =
        `
        পৃষ্ঠা ${DCViewer.currentPage}
        /
        ${DCViewer.totalPages}
        `;


    }




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



        const issue =
        issues.find(
            item =>
            item.id === issueId
        );



        if(!issue){


            title.textContent =
            "ই-পেপার পাওয়া যায়নি";


            return;


        }




        title.textContent =
        issue.title;



        meta.innerHTML =
        `
        <strong>প্রকাশ:</strong>
        ${issue.date}
        <br>

        <strong>পৃষ্ঠা:</strong>
        ${issue.pages}
        `;




        /*
        ===========================
        PDF Load
        ===========================
        */


        if(pdfFrame){

            pdfFrame.src =
            issue.pdf;

        }



        if(window.DCViewer){


            DCViewer.init(issue);


            DCViewer.loadPDF();


        }




        /*
        ===========================
        Download
        ===========================
        */


        if(downloadBtn){


            downloadBtn.onclick =
            () => {


                window.open(
                    issue.pdf,
                    "_blank"
                );


            };


        }




        /*
        ===========================
        Print
        ===========================
        */


        if(printBtn){


            printBtn.onclick =
            () => {


                const win =
                window.open(
                    issue.pdf,
                    "_blank"
                );


                if(win){


                    win.onload =
                    () => {

                        win.print();

                    };


                }


            };


        }





        /*
        ===========================
        Page Controls
        ===========================
        */


        if(prevBtn){


            prevBtn.onclick =
            () => {


                DCViewer.previousPage();


                updatePageInfo();


            };


        }




        if(nextBtn){


            nextBtn.onclick =
            () => {


                DCViewer.nextPage();


                updatePageInfo();


            };


        }




        /*
        ===========================
        Zoom Controls
        ===========================
        */


        if(zoomInBtn){


            zoomInBtn.onclick =
            () => {


                let zoom =
                DCViewer.zoom + 0.1;


                DCViewer.setZoom(
                    zoom
                );


            };


        }




        if(zoomOutBtn){


            zoomOutBtn.onclick =
            () => {


                let zoom =
                DCViewer.zoom - 0.1;



                if(zoom < 0.5){

                    zoom = 0.5;

                }



                DCViewer.setZoom(
                    zoom
                );


            };


        }




        updatePageInfo();



    }



    catch(error){


        console.error(error);



        title.textContent =
        "ই-পেপার লোড করা যায়নি";



        meta.innerHTML =
        `
        <div class="dc-empty">
            দুঃখিত! ই-পেপারটি লোড করা সম্ভব হচ্ছে না।
        </div>
        `;


    }



});
