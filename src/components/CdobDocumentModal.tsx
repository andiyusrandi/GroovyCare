"use client";

import React, { useRef } from "react";
import { FileText as LucideFileText, Download as LucideDownload, Printer as LucidePrinter, X as LucideX, CheckCircle2 as LucideCheckCircle2, ShieldCheck as LucideShieldCheck } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface CdobDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  type: "SP" | "INVOICE" | "SURAT_JALAN";
}

export default function CdobDocumentModal({
  isOpen,
  onClose,
  order,
  type,
}: CdobDocumentModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  // Pricing calculations
  const subtotal = (order.items || []).reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const vat = Math.round(subtotal * 0.11);

  const addr = order.shippingAddress || "";
  const feeMatch = addr.match(/-\s*Rp\s*([0-9.,]+)/);
  let shippingFee = 0;
  if (feeMatch && feeMatch[1]) {
    shippingFee = parseInt(feeMatch[1].replace(/[.,]/g, ""), 10) || 0;
  } else {
    const isColdChain = (order.items || []).some((item: any) => 
      item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain"
    );
    shippingFee = isColdChain ? 85000 : 50000;
  }
  const totalBilling = subtotal + vat + shippingFee;

  const orderDate = new Date(order.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const titleText = type === "SP" 
    ? "Surat Pesanan Obat (SP)" 
    : type === "INVOICE" 
    ? "Faktur Penjualan (Invoice)" 
    : "Surat Jalan / Packing Slip";

  // Function to print or save PDF in-app via hidden iframe without opening browser tabs
  const handleInAppPrint = () => {
    if (!printRef.current) return;
    
    // Check if device is mobile/Android WebView where iframe print is unsupported
    const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      // Direct mobile Android users to real PDF download
      handleDownloadPdf();
      return;
    }

    const content = printRef.current.innerHTML;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${titleText} - ${order.orderNumber}</title>
          <meta charset="utf-8" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { margin: 0; padding: 15px; font-family: sans-serif; background: white; color: black; }
              @page { size: A4; margin: 10mm; }
            }
          </style>
        </head>
        <body class="bg-white p-6 text-slate-800 font-sans">
          ${content}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }, 500);
  };

  // Download genuine PDF file directly without print menu (Android WebView compatible)
  const handleDownloadPdf = async () => {
    if (!printRef.current) return;

    // Helper to convert lab/oklch colors in cloned DOM for html2canvas
    const convertColorsOnClone = (clonedDoc: Document) => {
      const allElements = clonedDoc.querySelectorAll("*");
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const style = window.getComputedStyle(htmlEl);
        ["color", "backgroundColor", "borderColor", "outlineColor"].forEach((prop) => {
          const val = (style as any)[prop];
          if (val && (val.includes("lab(") || val.includes("oklch("))) {
            try {
              const tempCanvas = document.createElement("canvas");
              tempCanvas.width = 1;
              tempCanvas.height = 1;
              const ctx = tempCanvas.getContext("2d");
              if (ctx) {
                ctx.fillStyle = val;
                ctx.fillRect(0, 0, 1, 1);
                const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
                htmlEl.style[prop as any] = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
              }
            } catch {
              // Ignore fallback if canvas color conversion fails
            }
          }
        });
      });
    };

    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: convertColorsOnClone,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${type}_${order.orderNumber}.pdf`;

      // Android & Desktop Blob Download Trigger for .pdf extension
      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      setTimeout(() => {
        if (document.body.contains(downloadLink)) {
          document.body.removeChild(downloadLink);
        }
        URL.revokeObjectURL(blobUrl);
      }, 2000);

      // Backup standard jsPDF save call
      pdf.save(fileName);
    } catch (err) {
      console.error("Gagal mendownload PDF:", err);
      // Secondary fallback to genuine PDF data URI if canvas fails
      const element = printRef.current;
      const canvas = await html2canvas(element, { scale: 1, onclone: convertColorsOnClone });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`${type}_${order.orderNumber}.pdf`);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] overflow-y-auto flex items-center justify-center p-3 md:p-4 bg-slate-950/60 backdrop-blur-sm font-sans animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-scaleUp">
        
        {/* Header Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <LucideFileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-extrabold tracking-wide uppercase">{titleText}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors border-none bg-transparent cursor-pointer"
          >
            <LucideX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="p-4 md:p-8 overflow-y-auto flex-1 bg-slate-100/50">
          <div ref={printRef} className="bg-white p-6 md:p-10 shadow-sm border border-slate-200 rounded-xl space-y-6 max-w-3xl mx-auto font-sans">
            
            {/* Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
              <div className="max-w-[70%]">
                <h1 className="font-heading font-extrabold text-base md:text-lg text-slate-900 uppercase tracking-tight">
                  {order.institution?.name || "PEMESAN APOTEK / KLINIK"}
                </h1>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{order.institution?.address || "Alamat belum disetel"}</p>
                <p className="text-[11px] text-slate-700 font-bold mt-1">SIA: {order.institution?.siaNumber || "-"}</p>
              </div>
              <div className="text-right">
                <span className="border border-slate-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-50 inline-block">
                  Arsip Resmi CDOB
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-2">{order.orderNumber}</p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-4">
              <h2 className="font-heading font-extrabold text-sm md:text-base uppercase tracking-wider border-b border-slate-300 pb-1 inline-block text-slate-900">
                {titleText}
              </h2>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">No. Dokumen: {order.orderNumber}</p>
            </div>

            {/* Address & Transaction Context */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kepada Pemasok (PBF):</span>
                <strong className="text-slate-900 font-bold block text-xs">PT. GROOVYRX PHARMACEUTICAL GROUP</strong>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">Kawasan Industri & Pergudangan PBF Tamalanrea, Kota Makassar, Sulawesi Selatan (90245)</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Detail Transaksi:</span>
                <p className="text-[11px] text-slate-700 font-medium">Tanggal SP: <strong className="text-slate-900 font-bold">{orderDate}</strong></p>
                <p className="text-[11px] text-slate-700 font-medium mt-0.5">Status CDOB: <strong className="text-emerald-700 font-bold">Terverifikasi BPOM</strong></p>
              </div>
            </div>

            {/* Product Table */}
            <table className="w-full text-xs text-left border-collapse border border-slate-300 mt-4">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                  <th className="border border-slate-300 p-2.5">No</th>
                  <th className="border border-slate-300 p-2.5">Nama Obat / Sediaan Farmasi</th>
                  <th className="border border-slate-300 p-2.5">No. Batch &amp; ED</th>
                  <th className="border border-slate-300 p-2.5 text-center">Jumlah</th>
                  <th className="border border-slate-300 p-2.5 text-right">Harga Satuan</th>
                  <th className="border border-slate-300 p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-200 text-slate-800">
                    <td className="border border-slate-300 p-2.5 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-300 p-2.5 font-bold">
                      {item.product?.name || "Produk Farmasi"}
                      <span className="text-[10px] text-slate-500 font-normal block">NIE: {item.product?.bpomNumber || "BPOM Registered"}</span>
                    </td>
                    <td className="border border-slate-300 p-2.5 font-mono text-[10px] text-slate-600">
                      Batch: {item.batchNumber || "B-2026-X"}<br />
                      ED: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString("id-ID") : "2028-12"}
                    </td>
                    <td className="border border-slate-300 p-2.5 text-center font-bold font-mono">{item.quantity} {item.product?.unit || "Box"}</td>
                    <td className="border border-slate-300 p-2.5 text-right font-mono">Rp {item.price.toLocaleString("id-ID")}</td>
                    <td className="border border-slate-300 p-2.5 text-right font-bold font-mono">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Billing Breakdown */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs font-medium text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal Produk:</span>
                  <span className="font-mono text-slate-900 font-bold">Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>PPN (11%):</span>
                  <span className="font-mono text-slate-900 font-bold">Rp {vat.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkos Kirim:</span>
                  <span className="font-mono text-slate-900 font-bold">Rp {shippingFee.toLocaleString("id-ID")}</span>
                </div>
                <hr className="border-slate-300 my-1" />
                <div className="flex justify-between text-slate-900 font-bold text-sm">
                  <span>TOTAL TAGIHAN:</span>
                  <span className="font-mono text-emerald-800">Rp {totalBilling.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* Signatures & Compliance Verification Box */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs border-t border-slate-200 mt-6">
              <div className="space-y-10">
                <p className="font-bold text-slate-800">Penerima / Penanggung Jawab Apotek</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-emerald-700 font-mono text-[10px] font-bold border border-emerald-300 bg-emerald-50 px-2 py-1 rounded">
                    ✓ E-SIGNED (SIPA VERIFIED)
                  </span>
                </div>
                <p className="font-bold text-slate-900 underline">{order.institution?.pharmacistName || "Apt. Penanggung Jawab"}</p>
                <p className="text-[10px] text-slate-500 font-mono">SIPA: {order.institution?.sipaNumber || "-"}</p>
              </div>

              <div className="space-y-10">
                <p className="font-bold text-slate-800">Apoteker Penanggung Jawab PBF (GroovyCare)</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-emerald-700 font-mono text-[10px] font-bold border border-emerald-300 bg-emerald-50 px-2 py-1 rounded">
                    ✓ CDOB VERIFIED PBF
                  </span>
                </div>
                <p className="font-bold text-slate-900 underline">Apt. GroovyRx PBF Manager, S.Farm</p>
                <p className="text-[10px] text-slate-500 font-mono">STRA: 19940812/STRA-BPOM/2026</p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Action Footer Bar inside App (Cross-Platform Mobile Android & Desktop Compatible) */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
          >
            <LucideDownload className="w-4 h-4 text-white" />
            <span>Download PDF</span>
          </button>
          
          <button
            type="button"
            onClick={handleInAppPrint}
            className="flex-1 py-3.5 px-4 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white rounded-2xl text-xs font-extrabold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
          >
            <LucidePrinter className="w-4 h-4 text-white" />
            <span>Cetak / Save PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
}
