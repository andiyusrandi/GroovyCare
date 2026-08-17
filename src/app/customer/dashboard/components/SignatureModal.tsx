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

  const loadSavedSignature = () => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.strokeStyle = "#00422b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.moveTo(50, 120);
    ctx.bezierCurveTo(80, 90, 120, 20, 180, 80);
    ctx.bezierCurveTo(220, 120, 280, 100, 330, 60);
    ctx.stroke();

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
    <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 overflow-y-auto font-sans">
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
      {/* 2. MOBILE VIEW: Regulatory Approval Document Screen (Flex Architecture)   */}
      {/* ========================================================================= */}
      <div className="block md:hidden fixed inset-0 z-[9999] bg-slate-50 flex flex-col font-sans overflow-hidden">
        {/* TopAppBar (Non-overlapping Flex Shrink-0 Header) */}
        <header className="h-14 bg-white border-b border-slate-200/80 shadow-2xs px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setIsDrawingModalOpen(false)}
              className="active:scale-95 transition-transform text-slate-800 p-1 border-none bg-transparent cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <h1 className="font-heading font-black text-sm text-slate-900">Konfirmasi e-Sign SP</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsDrawingModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer flex items-center justify-center p-1"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </header>

        {/* Content Container (Independent Scroll, Scroll Affordance UX) */}
        <main className="flex-1 overflow-y-auto p-4 space-y-3.5 select-none pb-36 font-sans scroll-smooth">
          
          {/* 1. Quick Info Bar */}
          <section className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Order ID</span>
              <p className="font-mono font-black text-xs text-slate-900 leading-none">{orderId}</p>
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-400">
                {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-[9.5px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                {totalItems} Item
              </span>
            </div>
          </section>

          {/* 2. Dokumen Surat Pesanan (Clean & Compact Sheet) */}
          <section className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-4 space-y-3 relative">
            {/* Header Dokumen */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-700 text-base">verified_user</span>
                <span className="font-heading font-black text-xs text-slate-900 tracking-tight">SURAT PESANAN (SP)</span>
              </div>
              <span className="font-mono text-[9.5px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                {spNumber}
              </span>
            </div>

            {/* Data APJ & Apotek */}
            <div className="bg-slate-50/90 rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Apoteker / Pemesan</p>
                <p className="font-extrabold text-xs text-slate-900 leading-none">{institution.name}</p>
                <p className="text-[9.5px] text-slate-500 font-mono">SIA: {institution.registrationNumber || "442/091/DINKES/2021"}</p>
              </div>
              <span className="bg-emerald-100/80 text-emerald-800 text-[8px] font-black px-2 py-0.5 rounded-md border border-emerald-200 uppercase">
                CDOB Valid
              </span>
            </div>

            {/* Item Obat */}
            <div className="space-y-1">
              <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wide">Daftar Pesanan:</p>
              {cart.map((item, idx) => (
                <div key={idx} className="bg-slate-50/50 rounded-xl p-2 border border-slate-100 flex items-center justify-between gap-2 text-xs font-semibold">
                  <span className="text-slate-800 text-[11px] leading-snug line-clamp-1">
                    {idx + 1}. {item.product.name}
                  </span>
                  <span className="font-mono font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0 text-[10px]">
                    {item.quantity} {item.product.unit.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[8.5px] text-slate-400 italic text-center pt-0.5">
              Sah secara hukum (UU ITE) dan sesuai standar CDOB BPOM.
            </p>
          </section>

          {/* 3. Scroll Affordance Banner (Mendorong User Melanjutkan ke TTD) */}
          <div className="flex items-center justify-center gap-1.5 py-1 text-emerald-800 animate-bounce">
            <span className="material-symbols-outlined text-xs">arrow_downward</span>
            <span className="text-[10.5px] font-extrabold tracking-wide">Goreskan Tanda Tangan di Bawah</span>
          </div>

          {/* 4. Area Tanda Tangan Digital APJ */}
          <section className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-700 text-sm">draw</span>
                E-Sign APJ
              </label>
              <button
                type="button"
                onClick={loadSavedSignature}
                className="text-emerald-800 font-extrabold text-[10.5px] hover:underline active:scale-95 transition cursor-pointer border-none bg-transparent"
              >
                Gunakan Tersimpan
              </button>
            </div>

            {/* Canvas Pad Box */}
            <div className="relative w-full h-40 bg-slate-50/60 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center overflow-hidden transition-all focus-within:border-emerald-500 shadow-inner signature-pad-grid">
              <canvas
                ref={canvasRef}
                width={400}
                height={160}
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
              
              {/* Placeholder Label */}
              {!hasSigned && (
                <span className="text-slate-400 text-xs font-semibold flex items-center gap-1 select-none pointer-events-none z-0 opacity-80">
                  <span className="material-symbols-outlined text-sm">gesture</span> Tanda tangan digital di sini
                </span>
              )}

              {/* Reset Button */}
              {hasSigned && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="absolute bottom-2 right-2 z-20 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[9.5px] font-bold border border-slate-200 transition active:scale-90 flex items-center gap-1 border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[11px]">refresh</span> Reset
                </button>
              )}
            </div>
          </section>

          {/* 5. Checkbox Persetujuan Legal */}
          <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl cursor-pointer group active:bg-slate-100 transition-colors">
            <div className="pt-0.5 shrink-0">
              <input 
                type="checkbox" 
                checked={isDeclared}
                onChange={(e) => setIsDeclared(e.target.checked)}
                className="w-4.5 h-4.5 rounded-lg border-slate-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
              />
            </div>
            <p className="text-[10.5px] font-semibold text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
              Saya menyatakan pesanan ini sah dan sesuai kebutuhan klinis <strong className="text-slate-900">{institution.name}</strong>.
            </p>
          </label>
        </main>

        {/* 6. Bottom Action Bar (Flex Shrink-0 Footer) */}
        <div className="p-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg shrink-0 z-10">
          <div className="max-w-md mx-auto">
            <button 
              type="button" 
              onClick={handleSaveSignature}
              disabled={!hasSigned || !isDeclared}
              className={`w-full py-3 px-4 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer border-none ${
                !hasSigned || !isDeclared
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                  : "bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] shadow-emerald-700/20"
              }`}
            >
              <span className="material-symbols-outlined text-base">verified</span>
              <span>Konfirmasi &amp; Kirim SP</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
