/*

Daily Chalchitra - Single Post PDF
Final Auto v2.0 - HD A4 Edition

*/
window.DCSinglePDF = {
  async download(element){
    if(!element){
      alert("পোস্ট পাওয়া যায়নি।");
      return;
    }
    try{
      const title = document.querySelector("h1")?.innerText || "daily-chalchitra-post";
      const fileName = title.replace(/[^a-z0-9\u0980-\u09FF]/gi,'-').substring(0,50) + ".pdf";

      // Show loading
      const btn = document.querySelector("[data-pdf-btn]");
      if(btn) btn.innerText = "⏳ তৈরি হচ্ছে...";

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: element.scrollWidth,
        scrollY: -window.scrollY
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = canvas.height * pageWidth / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while(heightLeft > 0){
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(fileName);

      if(btn) btn.innerText = "📥 ডাউনলোড";

    } catch(error){
      console.error("PDF Error:", error);
      alert("PDF তৈরি করা যায়নি, আবার চেষ্টা করুন।");
      const btn = document.querySelector("[data-pdf-btn]");
      if(btn) btn.innerText = "📥 ডাউনলোড";
    }
  }
};
