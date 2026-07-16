/*
==================================
Daily Chalchitra ePaper Viewer
Version : 1.3
==================================
*/


document.addEventListener(
"DOMContentLoaded",
async () => {


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
HTML ePaper Load
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

downloadBtn.onclick = async ()=>{

const { jsPDF } = window.jspdf;

const pdf = new jsPDF("p","mm","a4");

const pages =
document.querySelectorAll(".dc-page");

if(!pages.length){

alert("ই-পেপার এখনও লোড হয়নি।");

return;

}

for(let i=0;i<pages.length;i++){

const canvas =
await html2canvas(
pages[i],
{
scale:2,
useCORS:true,
backgroundColor:"#ffffff"
}
);

const img =
canvas.toDataURL("image/jpeg",1.0);

const width = 210;

const height =
canvas.height * width / canvas.width;

if(i>0){

pdf.addPage();

}

pdf.addImage(
img,
"JPEG",
0,
0,
width,
height
);

}

pdf.save(issue.id + ".pdf");

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
font-family:Arial, sans-serif;
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
()=>{


const viewer =
document.querySelector(
".dc-viewer"
);



if(!document.fullscreenElement){


viewer.requestFullscreen();


}

else{


document.exitFullscreen();


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


DCViewer.previousPage();


updatePageInfo();


};


}




if(nextBtn){


nextBtn.onclick =
()=>{


DCViewer.nextPage();


updatePageInfo();


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


DCViewer.setZoom(
DCViewer.zoom + 0.1
);


};


}





if(zoomOutBtn){


zoomOutBtn.onclick =
()=>{


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




/*
==================================
Daily Chalchitra ePaper Swipe
Version : 1.0
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



const pageInfo =
document.getElementById(
"dc-page-info"
);



if(pageInfo){


pageInfo.innerHTML =
`
পৃষ্ঠা ${DCViewer.currentPage}
/
${DCViewer.totalPages}
`;

}


}
