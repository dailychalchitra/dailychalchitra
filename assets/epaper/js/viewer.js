/*
==================================
Daily Chalchitra ePaper Viewer
Version : 1.4
HTML Newspaper Edition
==================================
*/

console.log("Viewer JS Loaded");


document.addEventListener(
"DOMContentLoaded",
async ()=>{


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
new URLSearchParams(
window.location.search
);


const issueId =
params.get("issue");



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



if(!issueId){

title.textContent =
"ই-পেপার পাওয়া যায়নি";

return;

}



const year =
issueId.substring(0,4);



try{


const res =
await fetch(
`/assets/epaper/issues/${year}.json`
);



if(!res.ok){

throw new Error(
"Issue file missing"
);

}



const issues =
await res.json();



const issue =
issues.find(
item=>item.id===issueId
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
HTML ePaper Start
===========================
*/


if(window.DCViewer){

DCViewer.init(issue);

DCViewer.start();

}




/*
===========================
Download
===========================
*/


if(downloadBtn){


downloadBtn.onclick =
async ()=>{


const viewer =
document.querySelector(
"#dc-epaper-page"
);



if(!viewer){

alert(
"ই-পেপার পাওয়া যায়নি।"
);

return;

}



try{


const canvas =
await html2canvas(
viewer,
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



const {jsPDF} =
window.jspdf;



const pdf =
new jsPDF(
"p",
"mm",
"a4"
);



const width =
210;


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
"dailychalchitra-epaper.pdf"
);



}

catch(error){

console.error(error);

alert(
"PDF তৈরি করা যায়নি।"
);

}


};


}

/*
===========================
Print
===========================
*/

if(printBtn){


printBtn.onclick =
()=>{


const viewer =
document.querySelector(
"#dc-epaper-page"
);



if(!viewer){

alert(
"ই-পেপার পাওয়া যায়নি।"
);

return;

}



const win =
window.open(
"",
"_blank"
);



win.document.write(
`
<html>

<head>

<title>
দৈনিক চালচিত্র ই-পেপার
</title>


<style>

body{

font-family:Arial,sans-serif;

}


img{

max-width:100%;

}

</style>


</head>


<body>

${viewer.outerHTML}

</body>


</html>
`
);



win.document.close();



win.onload =
()=>{

win.print();

};


};


}




/*
===========================
Fullscreen
===========================
*/


if(fullscreenBtn){


fullscreenBtn.onclick =
async ()=>{


const viewer =
document.querySelector(
"#dc-epaper-page"
);



if(!viewer){

alert(
"ই-পেপার পাওয়া যায়নি।"
);

return;

}



try{


if(!document.fullscreenElement){


await viewer.requestFullscreen();


}

else{


await document.exitFullscreen();


}


}

catch(error){


console.error(error);


alert(
"ফুলস্ক্রিন চালু করা যায়নি।"
);


}


};


}





/*
===========================
Page Control
===========================
*/


if(prevBtn){


prevBtn.onclick =
()=>{


if(window.DCViewer){


DCViewer.previousPage();


updatePageInfo();


}


};


}




if(nextBtn){


nextBtn.onclick =
()=>{


if(window.DCViewer){


DCViewer.nextPage();


updatePageInfo();


}


};


}




/*
===========================
Zoom Control
===========================
*/


if(zoomInBtn){


zoomInBtn.onclick =
()=>{


if(window.DCViewer){


DCViewer.setZoom(
DCViewer.zoom + 0.1
);


}


};


}





if(zoomOutBtn){


zoomOutBtn.onclick =
()=>{


if(window.DCViewer){


let zoom =
DCViewer.zoom - 0.1;



if(zoom < 0.5){


zoom = 0.5;


}



DCViewer.setZoom(
zoom
);


}


};


}





/*
==================================
Swipe Control
==================================
*/


let touchStartX = 0;

let touchEndX = 0;



document.addEventListener(
"touchstart",
(event)=>{


touchStartX =
event.changedTouches[0].screenX;


},
false);



document.addEventListener(
"touchend",
(event)=>{


touchEndX =
event.changedTouches[0].screenX;


handleSwipe();


},
false);





function handleSwipe(){


const distance =
touchEndX - touchStartX;



if(Math.abs(distance)<50){

return;

}



if(!window.DCViewer){

return;

}



if(distance < 0){


DCViewer.nextPage();


}

else{


DCViewer.previousPage();


}



updatePageInfo();


}



console.log(
"Daily Chalchitra Viewer Ready"
);



});
