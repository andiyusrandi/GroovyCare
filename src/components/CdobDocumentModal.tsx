"use client";

import React, { useRef } from "react";
import { FileText as LucideFileText, Download as LucideDownload, Printer as LucidePrinter, X as LucideX, CheckCircle2 as LucideCheckCircle2, ShieldCheck as LucideShieldCheck } from "lucide-react";

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

  // Download genuine PDF file directly without print menu
  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      if (typeof window !== "undefined") {
        if (!(window as any).html2canvas) {
          const script1 = document.createElement("script");
          script1.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
          document.head.appendChild(script1);
          await new Promise((res, rej) => {
            script1.onload = res;
            script1.onerror = rej;
          });
        }
        if (!(window as any).jspdf) {
          const script2 = document.createElement("script");
          script2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          document.head.appendChild(script2);
          await new Promise((res, rej) => {
            script2.onload = res;
            script2.onerror = rej;
          });
        }
      }

      const element = printRef.current;
      const canvas = await (window as any).html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = (window as any).jspdf;
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

      pdf.save(`${type}_${order.orderNumber}.pdf`);
    } catch (err) {
      console.error("Gagal mendownload PDF:", err);
      // Fallback: Download file langsung (Tanpa memicu menu cetak/print)
      const content = printRef.current.innerHTML;
      const fullHtml = `<!DOCTYPE html><html><head><title>${titleText} - ${order.orderNumber}</title><meta charset="utf-8" /><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-white p-8 font-sans max-w-4xl mx-auto">${content}</body></html>`;
      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_${order.orderNumber}.html`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] overflow-y-auto flex items-center justify-center p-3 md:p-4 bg-slate-950/60 backdrop-blur-sm font-sans animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden relative animate-slideUp">
        
        {/* Header Bar */}
        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${type === 'SP' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
              <LucideFileText className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-heading font-black text-sm text-slate-900 leading-tight">{titleText}</h3>
              <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">Ref: {order.orderNumber} • Verified CDOB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
          >
            <LucideX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Document Preview Body */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-100/60">
          <div 
            ref={printRef}
            className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm text-slate-800 space-y-6 text-xs leading-relaxed max-w-2xl mx-auto"
          >
            {/* Kop Surat Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
              <div className="max-w-[65%]">
                <h1 className="font-heading font-black text-base md:text-lg text-slate-900 uppercase tracking-tight">{order.institution?.name}</h1>
                <p className="text-[10px] text-slate-600 mt-1">{order.institution?.address}</p>
                <p className="text-[10px] text-slate-700 font-bold mt-1">SIA: {order.institution?.siaNumber}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="border border-slate-800 px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded-xs bg-slate-50">Arsip CDOB Official</span>
                <p className="text-[10px] text-slate-600 font-mono font-bold mt-2">{order.orderNumber}</p>
                <p className="text-[9px] text-slate-500">{orderDate}</p>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="text-center py-2 bg-slate-50 rounded-xl border border-slate-100">
              <h2 className="font-heading font-black text-xs md:text-sm uppercase tracking-wider text-slate-900">
                {type === "SP" ? "SURAT PESANAN OBAT KERAS / SEDIAAN FARMASI" : type === "INVOICE" ? "FAKTUR PENJUALAN OBAT (INVOICE)" : "SURAT JALAN / PENGIRIMAN PBF"}
              </h2>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Nomor: {order.orderNumber}</p>
            </div>

            {/* Recipient & Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-[10px] bg-slate-50/50 p-4 rounded-xl border border-slate-200/70">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider block">PBF Pemasok:</span>
                <p className="font-extrabold text-slate-900">PT. GROOVYRX PHARMACEUTICAL GROUP</p>
                <p className="text-slate-600">Izin PBF: PBF-91823/CDOB/2026</p>
                <p className="text-slate-500 text-[9.5px]">JL. TAMALANREA RAYA RUKO PELANGI BLOK B NO 7, Makassar</p>
              </div>
              <div className="space-y-1 text-right border-l border-slate-200 pl-4">
                <span className="text-slate-400 font-bold uppercase text-[8px] tracking-wider block">Pemesan (Apotek / Klinik):</span>
                <p className="font-extrabold text-slate-900">{order.institution?.name}</p>
                <p className="text-slate-600">APJ: {order.createdBy?.name}</p>
                <p className="text-slate-500 text-[9.5px]">SIPA: {order.createdBy?.sipaNumber || "-"}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800 text-[9px] uppercase">
                    <th className="p-2 text-center border-r border-slate-200 w-8">No</th>
                    <th className="p-2 border-r border-slate-200">Nama Sediaan Obat</th>
                    <th className="p-2 text-center border-r border-slate-200">Jumlah</th>
                    <th className="p-2 text-right border-r border-slate-200">Harga</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item: any, idx: number) => {
                    const itemSubtotal = item.price * item.quantity;
                    return (
                      <tr key={item.id || idx} className="border-b border-slate-100 text-slate-700">
                        <td className="p-2 text-center border-r border-slate-100 font-mono text-[9px]">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-100 font-bold text-slate-900">{item.product?.name || item.name}</td>
                        <td className="p-2 text-center border-r border-slate-100 font-bold">{item.quantity} {item.product?.unit || "Box"}</td>
                        <td className="p-2 text-right border-r border-slate-100 font-mono">Rp {item.price?.toLocaleString("id-ID")}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">Rp {itemSubtotal.toLocaleString("id-ID")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="flex justify-between items-end border-t border-slate-200 pt-3">
              <div className="text-[8px] text-slate-400 max-w-xs italic leading-tight">
                * Dokumen ini terverifikasi secara elektronik oleh Sistem CDOB PBF GroovyCare &amp; Kemenkes BPOM RI.
              </div>
              <div className="text-right text-[10.5px] space-y-1">
                <div className="flex justify-between gap-6">
                  <span className="text-slate-500">Subtotal Obat:</span>
                  <span className="font-mono font-bold">Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-slate-500">PPN (11%):</span>
                  <span className="font-mono font-bold">Rp {vat.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between gap-6 border-t border-slate-200 pt-1 font-black text-slate-900 text-xs">
                  <span>Total Faktur:</span>
                  <span className="font-mono text-emerald-700">Rp {totalBilling.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* Digital Signatures & CDOB Stamp */}
            <div className="flex justify-between items-center border-t-2 border-slate-200 pt-4 mt-4">
              <div className="text-center w-36">
                <p className="text-[8.5px] font-extrabold text-slate-700 uppercase">Pemesan / APJ Apotek</p>
                <div className="h-12 my-1 flex items-center justify-center">
                  {order.spSignature ? (
                    <img src={order.spSignature} alt="Tanda Tangan Digital" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-[7px] text-slate-400 font-bold border border-dashed border-slate-200 px-2 py-1 rounded bg-slate-50">E-SIGN DIGITAL</span>
                  )}
                </div>
                <p className="font-bold text-slate-800 text-[9.5px] underline truncate">{order.createdBy?.name}</p>
                <p className="text-[7.5px] text-slate-500">SIPA: {order.createdBy?.sipaNumber || "-"}</p>
              </div>

              {/* QR Verification Stamp */}
              <div className="flex flex-col items-center bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-2xs">
                <LucideShieldCheck className="w-8 h-8 text-emerald-600" />
                <span className="text-[6.5px] font-black text-emerald-800 uppercase tracking-widest mt-1">VERIFIED CDOB</span>
              </div>

              <div className="text-center w-36">
                <p className="text-[8.5px] font-extrabold text-slate-700 uppercase">APJ PBF GroovyCare</p>
                <div className="h-12 my-1 flex items-center justify-center">
                  <span className="text-[7px] text-emerald-700 font-mono font-bold border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">E-SIGNED</span>
                </div>
                <p className="font-bold text-slate-800 text-[9.5px] underline">Sarah, S.Farm, Apt</p>
                <p className="text-[7.5px] text-slate-500">SIPA: 19930412/SIPA/2026</p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Action Footer Bar inside App */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="hidden sm:flex flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-emerald-600/30 items-center justify-center gap-2 transition-all cursor-pointer border-none"
          >
            <LucideDownload className="w-4 h-4 text-white" />
            Download PDF
          </button>
          
          <button
            type="button"
            onClick={handleInAppPrint}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
          >
            <LucidePrinter className="w-4 h-4 text-white" />
            Cetak / Save PDF
          </button>
        </div>

      </div>
    </div>
  );
}
