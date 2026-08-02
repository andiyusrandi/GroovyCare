"use client";

import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, Package, Camera, Truck, ShieldCheck, AlertCircle } from "lucide-react";

interface ReceiptReportViewProps {
  order: any;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
}

export default function ReceiptReportView({
  order,
  onClose,
  onConfirm,
}: ReceiptReportViewProps) {
  // Checkbox states (pre-checked for fast 1-click confirmation)
  const [cdobCheck, setCdobCheck] = useState(true);

  // Received quantity states (dictionary of itemId -> quantity)
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    order.items.forEach((item: any) => {
      initial[item.id] = item.quantity;
    });
    return initial;
  });

  // Photo evidence simulation
  const [photos, setPhotos] = useState<string[]>([
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAYNoYHFZLke2UgH8QOpyH-eauOsCKqzcQq0t4xq7MjNcaTzxyRyrHgRyhELnZEyvc3B65XH7__OTtkTk_mpnonZE4RdgqCRX0fjdMqPl0_uFJVQ5nNuG76CqgE28qjlCWu40NyCjGbNwFLwUXbFRDKyXGalel0r5elRl16uEHjP_972IH3Yv3nKlKEjqNXbBqX4ISjCihc6RPp6Q1LvsU7sH7M1JUtvEB62V5NuB6aaPMLH033eObHGW5xvNGzW_W75EX5olk1ORg"
  ]);

  const [isToastOpen, setIsToastOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUploadPhoto = () => {
    setPhotos(prev => [
      ...prev,
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAYNoYHFZLke2UgH8QOpyH-eauOsCKqzcQq0t4xq7MjNcaTzxyRyrHgRyhELnZEyvc3B65XH7__OTtkTk_mpnonZE4RdgqCRX0fjdMqPl0_uFJVQ5nNuG76CqgE28qjlCWu40NyCjGbNwFLwUXbFRDKyXGalel0r5elRl16uEHjP_972IH3Yv3nKlKEjqNXbBqX4ISjCihc6RPp6Q1LvsU7sH7M1JUtvEB62V5NuB6aaPMLH033eObHGW5xvNGzW_W75EX5olk1ORg"
    ]);
  };

  const handleSubmitReport = () => {
    setIsSubmitting(true);
    setIsToastOpen(true);

    setTimeout(() => {
      setIsToastOpen(false);
      setIsSubmitting(false);
      onConfirm(order.id);
    }, 1200);
  };

  const isColdChain = order.items.some((item: any) =>
    item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain" ||
    item.product?.name?.toLowerCase().includes("insulin") || item.product?.code?.toLowerCase().includes("amx") ||
    item.product?.name?.toLowerCase().includes("vaccine")
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto flex flex-col font-sans">
      {/* 1. Sleek Top Header Bar */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-14 flex items-center justify-between px-4 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 active:scale-95 transition-all border-none bg-transparent cursor-pointer text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading font-extrabold text-sm text-slate-900 leading-tight">Konfirmasi Penerimaan</h1>
            <p className="text-[10px] text-slate-500 font-mono font-medium">SP: {order.orderNumber}</p>
          </div>
        </div>

        <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>CDOB Verified</span>
        </span>
      </header>

      {/* 2. Main Content Body */}
      <main className="p-4 space-y-4 max-w-lg mx-auto w-full flex-grow pb-10">
        {/* Order Info Summary Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">PT. GROOVYRX PHARMACEUTICAL GROUP (Growmexa)</p>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Distribusi Obat PBF • {order.items.length} SKU Obat</p>
            </div>
          </div>
          {isColdChain && (
            <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[8px] font-extrabold px-2 py-0.5 rounded-md uppercase shrink-0">
              ❄️ 2-8°C
            </span>
          )}
        </div>

        {/* CDOB Quick Assurance Box (Simpel 1 Click) */}
        <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-2xl space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cdobCheck}
              onChange={(e) => setCdobCheck(e.target.checked)}
              className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer accent-emerald-600"
            />
            <div>
              <p className="text-xs font-extrabold text-emerald-950">Kemasan &amp; Segel CDOB Utuh</p>
              <p className="text-[10px] text-emerald-800 leading-relaxed mt-0.5 font-medium">
                Semua boks obat telah diperiksa dalam kondisi tersegel dengan jumlah sediaan &amp; nomor batch sesuai.
              </p>
            </div>
          </label>
        </div>

        {/* Items List (Simple Modern Cards) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-heading font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-primary" />
              <span>Daftar Barang Diterima ({order.items.length})</span>
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold">✓ Semua Sesuai</span>
          </div>

          <div className="space-y-2">
            {order.items.map((item: any) => {
              const isItemColdChain = item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain" || item.product?.name?.toLowerCase().includes("insulin") || item.product?.code?.toLowerCase().includes("amx") || item.product?.name?.toLowerCase().includes("vaccine");
              return (
                <div key={item.id} className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-700">
                      <span className="material-symbols-outlined text-lg">
                        {isItemColdChain ? "vaccines" : "medication"}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 leading-snug">{item.product.name}</p>
                        {isItemColdChain && (
                          <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-1.5 py-0.2 rounded uppercase">Cold Chain</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Dipesan: {item.quantity} {item.product.unit.split(" ")[0]}</p>
                    </div>
                  </div>

                  <span className="bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-extrabold px-2.5 py-1 rounded-xl">
                    {item.quantity} Diterima
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evidence Photos (Optional Quick Picker) */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/70 shadow-xs space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-slate-600" />
              Bukti Foto Fisik (Opsional)
            </span>
            <button
              type="button"
              onClick={handleUploadPhoto}
              className="text-[10px] text-primary font-bold hover:underline cursor-pointer border-none bg-transparent"
            >
              + Tambah Foto
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto py-1">
            {photos.map((img, idx) => (
              <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                <img src={img} alt="Foto Penerimaan" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Submit Action Button Inline */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSubmitReport}
            disabled={isSubmitting || !cdobCheck}
            className={`w-full h-12 text-white font-heading font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all duration-200 border-none cursor-pointer ${
              isSubmitting || !cdobCheck
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 shadow-emerald-600/20"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isSubmitting ? "Memproses..." : "Konfirmasi Penerimaan Barang"}</span>
          </button>
        </div>
      </main>

      {/* Success Toast Overlay */}
      {isToastOpen && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-emerald-700 text-white px-5 py-3 rounded-full shadow-2xl z-[100] flex items-center gap-2 animate-in zoom-in-95 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-extrabold">Laporan Penerimaan Berhasil Dikirim!</span>
        </div>
      )}
    </div>
  );
}
