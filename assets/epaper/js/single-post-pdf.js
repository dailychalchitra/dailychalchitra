/* ==========================================================
   Daily Chalchitra - Single Post PDF - v9.0 Rebuild
   FIX: টুলবার/এনগেজমেন্ট-বক্স/মডাল বাদ দিয়ে ক্লিন কনটেন্ট থেকে PDF,
   এবং ছবি লোড হওয়া পর্যন্ত অপেক্ষা - ফাঁকা পাতার সমস্যা সমাধানে
   ========================================================== */
window.DCSinglePDF = {
  waitForImages(el){
    const imgs = Array.from(el.querySelectorAll('img'));
    return Promise.all(imgs.map(img => {
      if(img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise(resolve => {
        img.addEventListener('load', resolve, { once:true });
        img.addEventListener('error', resolve, { once:true });
        setTimeout(resolve, 3000);
      });
    }));
  },
  async download(selectorOrElement){
    let element = typeof selectorOrElement === 'string' 
      ? document.querySelector(selectorOrElement) 
      : selectorOrElement;

    if(!element){
      element = document.querySelector(".post-container") || document.querySelector(".post-body") || document.querySelector("article");
    }
    if(!element){
      alert("পোস্ট কনটেন্ট পাওয়া যায়নি।");
      return;
    }

    const btn = document.querySelector("#dc-single-pdf-btn") || document.querySelector("[data-pdf-btn]");
    const originalText = btn ? btn.innerHTML : "";

    if(btn){
      btn.disabled = true;
      btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> তৈরি হচ্ছে...';
    }

    try{
      await this.waitForImages(element);

      // ক্লোন বানিয়ে টুলবার/এনগেজমেন্ট/মডাল বাদ দেওয়া হচ্ছে
      const clone = element.cloneNode(true);
      clone.querySelectorAll(".dc-single-toolbar, .dc-engage-box, .dc-modal-overlay").forEach(el => el.remove());
      clone.style.position = "static";
      clone.style.left = "auto";
      clone.style.top = "auto";

      const title = document.querySelector("h1")?.innerText?.trim() || "Daily-Chalchitra-Post";
      const fileName = title.replace(/[\/\\:*?"<>|]/g,'').replace(/\s+/g,'-').substring(0,60) + ".pdf";

      if(typeof html2pdf !== 'undefined'){
        const opt = {
          margin: [8, 8, 8, 8],
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0, backgroundColor: "#ffffff" },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        await html2pdf().set(opt).from(clone).save();
      } 
      else if(typeof html2canvas !== 'undefined' && window.jspdf){
        const canvas = await html2canvas(clone, {
          scale: 2.5,
          useCORS: true,
          backgroundColor: "#ffffff",
          scrollY: -window.scrollY,
          windowWidth: document.documentElement.clientWidth
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = canvas.height * imgWidth / canvas.width;
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
      } else {
        window.print();
      }

    } catch(error){
      console.error("PDF Error:", error);
      alert("PDF তৈরি করা যায়নি। প্রিন্ট অপশন খুলছে...");
      window.print();
    } finally {
      if(btn){
        btn.disabled = false;
        btn.innerHTML = originalText || '<i class="fa fa-file-pdf"></i> PDF ডাউনলোড';
      }
    }
  }
};
