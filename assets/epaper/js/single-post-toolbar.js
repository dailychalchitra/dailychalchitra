/*
========================================
Daily Chalchitra
Single Post Toolbar Injector
Version : 1.1
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
Toolbar Style
=============================
*/


const style =
document.createElement(
"style"
);


style.innerHTML = `


.dc-single-toolbar{

display:flex;
justify-content:center;
gap:10px;
flex-wrap:wrap;
margin:20px 0;
padding:10px 0;

}


.dc-single-toolbar button{

background:#C00000;
color:white;
border:none;
padding:10px 18px;
border-radius:6px;
cursor:pointer;
font-size:15px;

}


.dc-single-toolbar button:hover{

background:#990000;

}


@media(max-width:600px){

.dc-single-toolbar button{

font-size:13px;
padding:8px 12px;

}

}


`;


document.head.appendChild(style);



/*
=============================
Insert Toolbar
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
Download Button
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

else{


alert(
"PDF সিস্টেম লোড হয়নি।"
);


}



};


}




/*
=============================
Print Button
=============================
*/


const print =
document.getElementById(
"dc-single-print"
);



if(print){


print.onclick =
()=>{


const printWindow =
window.open(
"",
"_blank"
);



printWindow.document.write(

`

<html>

<head>

<title>
দৈনিক চালচিত্র
</title>


<style>

body{

font-family:
'SolaimanLipi',
Arial,
sans-serif;

padding:20px;

}


img{

max-width:100%;

}


</style>


</head>


<body>


${article.innerHTML}


</body>


</html>

`

);



printWindow.document.close();



printWindow.onload =
()=>{

printWindow.print();

};



};


}




/*
=============================
Fullscreen Button
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


console.error(
"Fullscreen Error:",
error
);


}


};


}



console.log(
"Daily Chalchitra Single Post Toolbar Loaded"
);



});
