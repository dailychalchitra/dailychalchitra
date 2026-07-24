/*
  Daily Chalchitra ePaper Viewer
  Clean Fixed Version

  Features:
  - Issue loading
  - Native browser Print / Save as PDF
  - Page navigation
  - Zoom control
  - Fullscreen mode
  - Duplicate meta cleanup
*/


document.addEventListener("DOMContentLoaded", async () => {


    const title =
        document.getElementById("dc-title");

    const meta =
        document.getElementById("dc-meta");


    const downloadBtn =
        document.getElementById("dc-download");

    const printBtn =
        document.getElementById("dc-print");

    const fullscreenBtn =
        document.getElementById("dc-fullscreen");


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
        new URLSearchParams(window.location.search);


    const issueId =
        params.get("issue");




    function updatePageInfo(){

        if(!window.DCViewer || !pageInfo)
            return;


        pageInfo.innerHTML =
        `পৃষ্ঠা ${DCViewer.currentPage} / ${DCViewer.totalPages || 1}`;

    }





    function cleanupDuplicateSmallTags(){

        const page =
        document.querySelector("#dc-epaper-page");


        if(!page)
            return;


        page
        .querySelectorAll(".dc-post-card small")
        .forEach(tag => {


            const text =
            tag.textContent || "";


            if(
                text.includes("বিভাগ:") ||
                text.includes("লেখক:")
            ){

                tag.remove();

            }

        });

    }







    if(!issueId){

        if(title)
            title.textContent =
            "ই-পেপার পাওয়া যায়নি";


        return;

    }





    try{


        const response =
        await fetch(
            "/assets/epaper/issues/issues.json?v=" + Date.now()
        );



        if(!response.ok)
            throw new Error("Issues file missing");



        const issues =
        await response.json();



        const issue =
        issues.find(
            item => item.id === issueId
        );




        if(!issue){


            if(title)
                title.textContent =
                "ই-পেপার পাওয়া যায়নি";


            return;

        }





        if(title)
            title.textContent =
            issue.title;



        if(meta){

            meta.innerHTML =
            `
            <strong>প্রকাশ:</strong> ${issue.date}
            <br>
            <strong>মোট লেখা:</strong> ${issue.count} টি
            |
            <strong>পৃষ্ঠা:</strong> ${issue.pages}
            `;

        }







        /*
          Start Viewer Engine
        */

        if(window.DCViewer){


            DCViewer.init(issueId);


            await DCViewer.start();


            updatePageInfo();



            const loaderCheck =
            setInterval(()=>{


                const cols =
                document.getElementById(
                    "dc-post-columns"
                );


                if(
                    cols &&
                    !cols.innerHTML.includes("লোড হচ্ছে") &&
                    cols.querySelector(".dc-post-card")
                ){

                    clearInterval(loaderCheck);

                    cleanupDuplicateSmallTags();

                }



            },500);



            setTimeout(
                ()=>clearInterval(loaderCheck),
                10000
            );


        }








        /*
          Previous Page
        */

        prevBtn?.addEventListener(
            "click",
            ()=>{


                if(window.DCViewer)
                    DCViewer.previousPage();



                setTimeout(
                    cleanupDuplicateSmallTags,
                    300
                );


            }
        );







        /*
          Next Page
        */


        nextBtn?.addEventListener(
            "click",
            ()=>{


                if(window.DCViewer)
                    DCViewer.nextPage();



                setTimeout(
                    cleanupDuplicateSmallTags,
                    300
                );


            }
        );







        /*
          Zoom
        */


        zoomInBtn?.addEventListener(
            "click",
            ()=>{


                if(window.DCViewer)

                    DCViewer.setZoom(
                        DCViewer.zoom + 0.1
                    );


            }
        );




        zoomOutBtn?.addEventListener(
            "click",
            ()=>{


                if(window.DCViewer)

                    DCViewer.setZoom(
                        Math.max(
                            0.5,
                            DCViewer.zoom - 0.1
                        )
                    );


            }
        );








        /*
          Full PDF
          Browser Print → Save as PDF
        */


        if(downloadBtn){


            downloadBtn.onclick = ()=>{


                const viewer =
                document.querySelector(
                    "#dc-epaper-page"
                );



                if(
                    !viewer ||
                    viewer.innerHTML.includes("লোড হচ্ছে")
                ){

                    alert(
                    "ই-পেপার এখনো লোড হচ্ছে, কিছুক্ষণ পরে চেষ্টা করুন।"
                    );


                    return;

                }



                alert(
                "প্রিন্ট ডায়ালগ খুলবে। সেখানে Save as PDF নির্বাচন করুন।"
                );


                window.print();


            };

        }








        /*
          Print Button
        */


        if(printBtn){


            printBtn.onclick =
            ()=>window.print();


        }







        /*
          Fullscreen
        */


        if(fullscreenBtn){


            fullscreenBtn.onclick =
            async ()=>{


                const viewer =
                document.querySelector(
                    "#dc-epaper-page"
                );


                if(!viewer)
                    return;



                try{


                    if(!document.fullscreenElement){

                        await viewer.requestFullscreen();

                    }
                    else{

                        await document.exitFullscreen();

                    }


                }
                catch(error){

                    console.log(
                        "Fullscreen error:",
                        error
                    );

                }


            };


        }




    }
    catch(error){


        console.error(
            "Viewer Error:",
            error
        );


        if(title)

            title.textContent =
            "ই-পেপার লোড করা যায়নি";


    }



});
