/*
========================================
Daily Chalchitra
Single Post Toolbar Injector
Version : 1.0
========================================
*/


document.addEventListener(
"DOMContentLoaded",
()=>{


const article =
document.querySelector(
"article"
);


if(!article){

    return;

}



/*
=============================
Create Toolbar
=============================
*/


const toolbar =
document.createElement(
"div"
);


toolbar.className =
"dc-single-toolbar";



toolbar.innerHTML = `

<button id="dc-single-download">
📥 ডাউনলোড
</button>


<button id="dc-single-print">
🖨️ প্রিন্ট
</button>


<button id="dc-single-fullscreen">
⛶ ফুলস্ক্রিন
</button>

`;



/*
=============================
Insert After Header Info
=============================
*/


const body =
article.querySelector(
".dc-post-body"
);



if(body){

    body.parentNode.insertBefore(
        toolbar,
        body
    );

}



/*
=============================
Download
=============================
*/


const download =
document.getElementById(
"dc-single-download"
);



if(download){


download.onclick =
()=>{


const content =
article;



if(window.DCSinglePDF){


DCSinglePDF.download(
content
);


}



};



}



/*
=============================
Print
=============================
*/


const print =
document.getElementById(
"dc-single-print"
);



if(print){


print.onclick =
()=>{


window.print();



};


}



/*
=============================
Fullscreen
=============================
*/


const fullscreen =
document.getElementById(
"dc-single-fullscreen"
);



if(fullscreen){


fullscreen.onclick =
async()=>{


try{


if(!document.fullscreenElement){


await article.requestFullscreen();


}

else{


await document.exitFullscreen();


}



}

catch(error){


console.error(error);


}


};


}



});
