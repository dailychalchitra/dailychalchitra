/*
========================================
Daily Chalchitra
Single Post PDF Generator
Version : 1.0
========================================
*/


window.DCSinglePDF = {


    async download(element){


        if(!element){

            alert(
            "পোস্ট পাওয়া যায়নি।"
            );

            return;

        }


        try{


            const canvas =
            await html2canvas(
                element,
                {
                    scale:2,
                    useCORS:true,
                    backgroundColor:"#ffffff"
                }
            );


            const img =
            canvas.toDataURL(
                "image/jpeg",
                1.0
            );


            const { jsPDF } =
            window.jspdf;


            const pdf =
            new jsPDF(
                "p",
                "mm",
                "a4"
            );


            const width = 210;


            const height =
            canvas.height *
            width /
            canvas.width;


            pdf.addImage(
                img,
                "JPEG",
                0,
                0,
                width,
                height
            );


            pdf.save(
                "daily-chalchitra-post.pdf"
            );


        }


        catch(error){


            console.error(
                error
            );


            alert(
            "PDF তৈরি করা যায়নি।"
            );


        }


    }

};
