"use client";

import React, { useState, useEffect } from "react";

interface SignatureModalProps {
  isDrawingModalOpen: boolean;
  setIsDrawingModalOpen: (val: boolean) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  startDrawing: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  draw: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  stopDrawing: () => void;
  clearSignature: () => void;
  setSignatureDataUrl: (val: string) => void;
  setHasSigned: (val: boolean) => void;
  hasSigned: boolean;
  cart: { product: any; quantity: number }[];
  institution: any;
  user: any;
}

export default function SignatureModal({
  isDrawingModalOpen,
  setIsDrawingModalOpen,
  canvasRef,
  startDrawing,
  draw,
  stopDrawing,
  clearSignature,
  setSignatureDataUrl,
  setHasSigned,
  hasSigned,
  cart,
  institution,
  user,
}: SignatureModalProps) {
  const [isDeclared, setIsDeclared] = useState(false);
  const [spNumber, setSpNumber] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    // Generate deterministic SP number and Order ID once on mount / open
    if (isDrawingModalOpen) {
      const year = new Date().getFullYear();
      const monthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][new Date().getMonth()];
      const randomSpNum = Math.floor(100 + Math.random() * 900);
      const randomOrderId = Math.floor(8000 + Math.random() * 1999);
      setSpNumber(`SP/${year}/${monthRoman}/00${randomSpNum}`);
      setOrderId(`#SP-${year}-${randomOrderId}`);
    }
  }, [isDrawingModalOpen]);

  if (!isDrawingModalOpen) return null;

  // Helper untuk mendapatkan canvas yang sedang aktif/terlihat di layar (Desktop/Mobile)
  const getActiveCanvas = (): HTMLCanvasElement | null => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return canvasRef.current;
    }
    const visibleCanvases = document.querySelectorAll<HTMLCanvasElement>(".signature-canvas");
    for (const c of Array.from(visibleCanvases)) {
      const rect = c.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return c;
    }
    return canvasRef.current;
  };

  // Simulate loading saved signature
  const loadSavedSignature = () => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a nice signature path
    ctx.beginPath();
    ctx.strokeStyle = "#00422b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Smooth signature simulation path
    ctx.moveTo(50, 120);
    ctx.bezierCurveTo(80, 90, 120, 20, 180, 80);
    ctx.bezierCurveTo(220, 120, 280, 100, 330, 60);
    ctx.stroke();

    // Draw initials / loops
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(110, 85);
    ctx.lineTo(130, 105);
    ctx.moveTo(140, 85);
    ctx.lineTo(160, 105);
    ctx.stroke();

    setHasSigned(true);
  };

  const handleSaveSignature = () => {
    const canvas = getActiveCanvas();
    if (canvas) {
      const sig = canvas.toDataURL("image/png");
      setSignatureDataUrl(sig);
      setHasSigned(true);
      setIsDrawingModalOpen(false);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 overflow-y-auto font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        .signature-pad-grid {
          background-image: radial-gradient(#e5e7eb 1.5px, transparent 1.5px);
          background-size: 16px 16px;
        }
        .document-shadow {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
      `}} />

      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW: Legacy Modal Panel                                       */}
      {/* ========================================================================= */}
      <div className="hidden md:block relative w-full max-w-lg bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">draw</span>
            Gambar Tanda Tangan Digital APJ
          </h3>
          <button
            type="button"
            onClick={() => setIsDrawingModalOpen(false)}
            className="text-on-surface-variant hover:text-foreground text-xs font-bold cursor-pointer border-none bg-transparent"
          >
            Tutup
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-on-surface-variant">
            Tarik garis menggunakan mouse atau layar sentuh di dalam area kotak di bawah ini untuk membubuhkan tanda tangan Anda selaku APJ Apotek.
          </p>

          <div className="border border-outline-variant/55 bg-slate-50 rounded-2xl overflow-hidden h-44 relative">
            <canvas
              ref={canvasRef}
              width={460}
              height={176}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ touchAction: "none" }}
              className="signature-canvas w-full h-full cursor-crosshair bg-slate-50"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={clearSignature}
              className="flex-1 py-2 bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold cursor-pointer border-none"
            >
              Hapus Garis
            </button>
            <button
              type="button"
              onClick={handleSaveSignature}
              className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md border-none"
            >
              Simpan Tanda Tangan
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW: Regulatory Approval Document Screen                       */}
      {/* ========================================================================= */}
      <div className="block md:hidden w-full min-h-screen bg-slate-50 flex flex-col relative pb-32">
        {/* TopAppBar */}
        <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button 
              type="button"
              onClick={() => setIsDrawingModalOpen(false)}
              className="active:scale-95 transition-transform text-primary p-1 border-none bg-transparent cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <h1 className="font-heading font-black text-sm text-primary">Konfirmasi e-Sign SP</h1>
          </div>
          <div className="text-on-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-lg">help_outline</span>
          </div>
        </header>

        {/* Content Container */}
        <main className="pt-20 px-4 space-y-6 flex-grow">
          {/* Order Summary Card */}
          <section className="bg-white rounded-2xl p-4 border border-outline-variant/30 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Order ID</p>
              <p className="font-heading font-black text-sm text-on-surface">{orderId}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-on-surface-variant font-medium">
                {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-primary font-bold">{totalItems} Item Produk</p>
            </div>
          </section>

          {/* Document Preview Sheet */}
          <section className="document-shadow bg-white rounded-2xl border border-outline-variant/30 p-5 space-y-4">
            {/* Document Header */}
            <div className="flex justify-between items-start border-b border-surface-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
                <span className="font-heading font-black text-sm text-primary uppercase">PBF Online</span>
              </div>
              <div className="text-[8px] text-right text-on-surface-variant leading-tight">
                <p className="font-bold">PT. PHARMADIST FARMASI NUSANTARA</p>
                <p>Izin PBF: 123/PBF/JAK-SEL/2023</p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-1">
              <h2 className="font-heading font-black text-xs uppercase tracking-widest text-on-surface">Surat Pesanan</h2>
              <p className="text-[9px] text-on-surface-variant font-bold">Nomor: {spNumber}</p>
            </div>

            {/* APJ / Apotek Details */}
            <div className="text-[11px] text-on-surface leading-relaxed space-y-2">
              <p>Yang bertanda tangan di bawah ini, Apoteker Penanggung Jawab dari:</p>
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                <p className="font-bold text-foreground text-xs">{institution.name}</p>
                <p className="text-on-surface-variant text-[10px] italic mt-0.5">SIA: {institution.registrationNumber || "442/091/DINKES/2021"}</p>
              </div>
              <p>Memesan obat-obatan di bawah ini sesuai dengan pedoman <strong>Cara Distribusi Obat yang Baik (CDOB)</strong>:</p>
            </div>

            {/* Ordered Items Table */}
            <div className="space-y-1.5 pt-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between border-b border-surface-variant/20 py-1.5 text-[11px] font-bold">
                  <span className="text-on-surface-variant truncate max-w-[200px]">
                    {idx + 1}. {item.product.name}
                  </span>
                  <span className="font-mono text-primary">{item.quantity} {item.product.unit.split(" ")[0]}</span>
                </div>
              ))}
            </div>

            {/* Legal Footnote */}
            <div className="pt-3 text-[9px] text-on-surface-variant/60 italic leading-snug">
              * Dokumen ini dibuat secara elektronik dan sah menurut hukum yang berlaku di Republik Indonesia (UU ITE).
            </div>
          </section>

          {/* Regulatory Notice */}
          <section className="bg-primary-container/10 border-l-4 border-primary p-4 rounded-r-2xl flex gap-3 shadow-sm">
            <span className="material-symbols-outlined text-primary shrink-0 text-lg">gavel</span>
            <div className="space-y-1">
              <p className="font-heading font-black text-xs text-on-primary-container leading-none">Pemberitahuan Regulasi</p>
              <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed">
                Tanda tangan elektronik ini setara dengan tanda tangan basah dan wajib dilakukan oleh APJ sesuai regulasi BPOM CDOB.
              </p>
            </div>
          </section>

          {/* Signature Area */}
          <section className="space-y-3 pb-8">
            <div className="flex justify-between items-end">
              <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide">Tanda Tangan Apoteker</label>
              <button 
                type="button"
                onClick={loadSavedSignature}
                className="text-primary font-bold text-[10px] active:scale-95 transition-all border-none bg-transparent cursor-pointer hover:underline"
              >
                Gunakan Tanda Tangan Tersimpan
              </button>
            </div>
            
            {/* Signature Pad */}
            <div className="relative w-full h-48 bg-white border-2 border-dashed border-outline-variant/60 rounded-2xl signature-pad-grid flex items-center justify-center overflow-hidden">
              <canvas
                ref={canvasRef}
                width={400}
                height={192}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{ touchAction: "none" }}
                className="signature-canvas absolute inset-0 w-full h-full cursor-crosshair z-10 bg-transparent"
              />
              
              {!hasSigned && (
                <span className="text-on-surface-variant/40 text-xs font-bold flex items-center gap-1.5 select-none pointer-events-none z-0">
                  <span className="material-symbols-outlined text-sm">draw</span> Tanda tangan di sini
                </span>
              )}
              
              {hasSigned && (
                <button 
                  type="button"
                  onClick={clearSignature}
                  className="absolute top-3.5 right-3.5 p-1 bg-surface-container-high rounded-full text-on-surface-variant hover:text-error transition-colors z-20 border-none cursor-pointer flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              )}
            </div>
          </section>

          {/* Declaration Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group pb-28">
            <div className="mt-0.5">
              <input 
                type="checkbox"
                checked={isDeclared}
                onChange={(e) => setIsDeclared(e.target.checked)}
                className="w-5 h-5 rounded border-outline text-primary focus:ring-primary-container transition-all cursor-pointer"
              />
            </div>
            <p className="text-[11px] font-bold text-on-surface-variant leading-tight group-active:text-on-surface transition-colors select-none">
              Saya menyatakan bahwa pesanan ini sah dan sesuai dengan kebutuhan klinis {institution.name}.
            </p>
          </label>
        </main>

        {/* Action Bar (Fixed Bottom) */}
        <footer className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-outline-variant/20 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] h-24 px-4 flex items-center justify-center pb-safe z-50">
          <button 
            type="button"
            onClick={handleSaveSignature}
            disabled={!hasSigned || !isDeclared}
            className={`w-full h-12 text-white font-heading font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-200 border-none cursor-pointer ${
              !hasSigned || !isDeclared
                ? "bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed shadow-none"
                : "bg-primary text-white active:scale-95 active:bg-primary/90"
            }`}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            Tanda Tangani &amp; Buat Pesanan
          </button>
        </footer>
      </div>
    </div>
  );
}
