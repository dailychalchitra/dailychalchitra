/*
========================================
Daily Chalchitra
Single Post PDF Generator
Version : 2.0
Multi Page A4 Edition
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



const imgData =
canvas.toDataURL(
"image/jpeg",
0.95
);



const { jsPDF } =
window.jspdf;



const pdf =
new jsPDF(
"p",
"mm",
"a4"
);



const pageWidth = 210;

const pageHeight = 297;



const imgWidth =
pageWidth;



const imgHeight =
canvas.height *
pageWidth /
canvas.width;



let heightLeft =
imgHeight;



let position = 0;



pdf.addImage(
imgData,
"JPEG",
0,
position,
imgWidth,
imgHeight
);



heightLeft -= pageHeight;



while(heightLeft > 0){


position =
heightLeft -
imgHeight;



pdf.addPage();



pdf.addImage(
imgData,
"JPEG",
0,
position,
imgWidth,
imgHeight
);



heightLeft -= pageHeight;


}



pdf.save(
"daily-chalchitra-post.pdf"
);



}



catch(error){


console.error(
"PDF Error:",
error
);



alert(
"PDF তৈরি করা যায়নি।"
);


}



}


};
