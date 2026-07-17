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

await DCViewer.start();

}


/*
===========================
Download
===========================
*/

if(downloadBtn){

downloadBtn.onclick = ()=>{

    if(!issue.pdf){

        alert("এই ই-পেপারের PDF পাওয়া যায়নি।");

        return;

    }

    const link = document.createElement("a");

    link.href = issue.pdf;

    link.download = issue.title + ".pdf";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

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

if(!window.DCViewer){

return;

}

DCViewer.previousPage();

updatePageInfo();

};

}



if(nextBtn){

nextBtn.onclick =
()=>{

if(!window.DCViewer){

return;

}

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

if(!window.DCViewer){

return;

}

DCViewer.setZoom(
DCViewer.zoom + 0.1
);

};

}



if(zoomOutBtn){

zoomOutBtn.onclick =
()=>{

if(!window.DCViewer){

return;

}

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
false
);

document.addEventListener(
"touchend",
(event)=>{

touchEndX =
event.changedTouches[0].screenX;

handleSwipe();

},
false
);

function handleSwipe(){

const distance =
touchEndX - touchStartX;

if(Math.abs(distance) < 50){

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

}

catch(error){

console.error(error);

title.textContent =
"ই-পেপার লোড করা যায়নি";

}

});
