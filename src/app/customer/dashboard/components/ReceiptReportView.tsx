"use client";

import React, { useState } from "react";

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
  // Checkbox states
  const [packagingOk, setPackagingOk] = useState(false);
  const [temperatureOk, setTemperatureOk] = useState(false);
  const [sealOk, setSealOk] = useState(false);

  // Received quantity states (dictionary of itemId -> quantity)
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    order.items.forEach((item: any) => {
      initial[item.id] = item.quantity;
    });
    return initial;
  });

  // Photo evidence upload simulation
  const [photos, setPhotos] = useState<string[]>([
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAYNoYHFZLke2UgH8QOpyH-eauOsCKqzcQq0t4xq7MjNcaTzxyRyrHgRyhELnZEyvc3B65XH7__OTtkTk_mpnonZE4RdgqCRX0fjdMqPl0_uFJVQ5nNuG76CqgE28qjlCWu40NyCjGbNwFLwUXbFRDKyXGalel0r5elRl16uEHjP_972IH3Yv3nKlKEjqNXbBqX4ISjCihc6RPp6Q1LvsU7sH7M1JUtvEB62V5NuB6aaPMLH033eObHGW5xvNGzW_W75EX5olk1ORg"
  ]);

  const [isToastOpen, setIsToastOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQtyChange = (itemId: string, val: number) => {
    setReceivedQtys(prev => ({
      ...prev,
      [itemId]: Math.max(0, val)
    }));
  };

  const handleUploadPhoto = () => {
    // Add a mockup pharmaceutical box photo
    setPhotos(prev => [
      ...prev,
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAYNoYHFZLke2UgH8QOpyH-eauOsCKqzcQq0t4xq7MjNcaTzxyRyrHgRyhELnZEyvc3B65XH7__OTtkTk_mpnonZE4RdgqCRX0fjdMqPl0_uFJVQ5nNuG76CqgE28qjlCWu40NyCjGbNwFLwUXbFRDKyXGalel0r5elRl16uEHjP_972IH3Yv3nKlKEjqNXbBqX4ISjCihc6RPp6Q1LvsU7sH7M1JUtvEB62V5NuB6aaPMLH033eObHGW5xvNGzW_W75EX5olk1ORg"
    ]);
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitReport = () => {
    setIsSubmitting(true);
    setIsToastOpen(true);
    
    // Simulate API delay and trigger confirm callback
    setTimeout(() => {
      setIsToastOpen(false);
      setIsSubmitting(false);
      onConfirm(order.id);
    }, 2500);
  };

  const isColdChain = order.items.some((item: any) => 
    item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain" ||
    item.product?.name?.toLowerCase().includes("insulin") || item.product?.code?.toLowerCase().includes("amx") ||
    item.product?.name?.toLowerCase().includes("vaccine")
  );

  return (
    <div className="fixed inset-0 z-70 bg-slate-50 overflow-y-auto flex flex-col font-sans">
      
      {/* Top AppBar */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-95 transition-all border-none bg-transparent cursor-pointer"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h1 className="font-heading font-black text-sm text-on-surface">Laporan Penerimaan</h1>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-32 px-4 space-y-6 max-w-md mx-auto w-full flex-grow">
        
        {/* Order Summary Card */}
        <section className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-primary border border-outline-variant/30">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[9px] font-bold text-on-surface-variant block mb-1">Nomor Pesanan</span>
              <h2 className="font-heading font-black text-sm text-primary">{order.orderNumber}</h2>
            </div>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[9px] font-black uppercase">
              {order.status === "SHIPPED" ? "Dalam Pengiriman" : "Diproses PBF"}
            </span>
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">local_shipping</span>
              </div>
              <div>
                <p className="text-[9px] font-bold text-on-surface-variant">Pemasok / Distributor</p>
                <p className="text-xs text-on-surface font-black">PT. PHARMADIST FARMASI NUSANTARA</p>
              </div>
            </div>
          </div>
        </section>

        {/* CDOB Verification Checklist */}
        <section className="space-y-4">
          <h3 className="font-heading font-black text-xs text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            Verifikasi CDOB
          </h3>
          <div className="space-y-3">
            {/* Condition 1 */}
            <label className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer group ${
              packagingOk ? "bg-primary-container/10 border-primary" : "bg-white border-outline-variant/40"
            }`}>
              <input 
                type="checkbox"
                checked={packagingOk}
                onChange={(e) => setPackagingOk(e.target.checked)}
                className="w-5 h-5 rounded border-outline text-primary focus:ring-primary-container transition-all cursor-pointer"
              />
              <div className="flex-1">
                <p className="text-xs font-black text-on-surface">Kondisi Kemasan Baik</p>
                <p className="text-[9px] text-on-surface-variant font-medium mt-0.5">Pastikan tidak ada penyok atau kebocoran</p>
              </div>
            </label>

            {/* Condition 2 (Cold Chain) */}
            <label className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer group ${
              temperatureOk ? "bg-primary-container/10 border-primary" : "bg-white border-outline-variant/40"
            }`}>
              <input 
                type="checkbox"
                checked={temperatureOk}
                onChange={(e) => setTemperatureOk(e.target.checked)}
                className="w-5 h-5 rounded border-outline text-primary focus:ring-primary-container transition-all cursor-pointer"
              />
              <div className="flex-1">
                <p className="text-xs font-black text-on-surface">Suhu Sesuai {isColdChain && "(Cold Chain)"}</p>
                <p className="text-[9px] text-on-surface-variant font-medium mt-0.5">Verifikasi indikator suhu pada termometer pengiriman</p>
              </div>
            </label>

            {/* Condition 3 */}
            <label className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer group ${
              sealOk ? "bg-primary-container/10 border-primary" : "bg-white border-outline-variant/40"
            }`}>
              <input 
                type="checkbox"
                checked={sealOk}
                onChange={(e) => setSealOk(e.target.checked)}
                className="w-5 h-5 rounded border-outline text-primary focus:ring-primary-container transition-all cursor-pointer"
              />
              <div className="flex-1">
                <p className="text-xs font-black text-on-surface">Segel Utuh</p>
                <p className="text-[9px] text-on-surface-variant font-medium mt-0.5">Cek keberadaan dan integritas segel keamanan</p>
              </div>
            </label>
          </div>
        </section>

        {/* Item Checklist */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-xs text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
              Daftar Item
            </h3>
            <span className="text-[9px] text-on-surface-variant font-bold">{order.items.length} dari {order.items.length} item</span>
          </div>

          <div className="space-y-4">
            {order.items.map((item: any) => {
              const isItemColdChain = item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain" || item.product?.name?.toLowerCase().includes("insulin") || item.product?.code?.toLowerCase().includes("amx") || item.product?.name?.toLowerCase().includes("vaccine");
              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-outline-variant/40">
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center shrink-0 text-primary">
                          <span className="material-symbols-outlined text-[24px]">
                            {isItemColdChain ? "vaccines" : "medication"}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-black text-on-surface leading-tight">{item.product.name}</p>
                          <p className="text-[9px] text-on-surface-variant font-bold mt-0.5">
                            {item.product.unit.split(" ")[0]} ({isItemColdChain ? "Cold Chain" : "Sediaan Jadi"})
                          </p>
                        </div>
                      </div>
                      {isItemColdChain && (
                        <div className="text-right">
                          <span className="bg-[#fff1f2] text-[#f43f5e] text-[8px] font-black px-2 py-0.5 rounded uppercase">Cold Chain</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-outline-variant/10 text-xs">
                      <div>
                        <p className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">Dipesan</p>
                        <p className="font-mono font-black text-sm mt-0.5">{item.quantity} {item.product.unit.split(" ")[0]}</p>
                      </div>
                      <div>
                        <label htmlFor={`received-${item.id}`} className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider block">Diterima</label>
                        <input 
                          id={`received-${item.id}`}
                          type="number"
                          value={receivedQtys[item.id] ?? item.quantity}
                          onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-white border border-outline-variant/40 rounded-lg text-xs font-bold text-primary py-1 px-2.5 mt-0.5 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[9px] font-bold text-on-surface-variant">
                      <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-lg">
                        <span className="material-symbols-outlined text-[14px]">barcode</span>
                        <span>BN: AX-2026-{Math.floor(1000 + Math.random() * 9000)}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-lg">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        <span>Exp: {new Date().getMonth() === 11 ? "Dec" : "Jul"} {new Date().getFullYear() + 2}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => alert(`Laporan ketidaksesuaian untuk ${item.product.name} telah dicatat. CS akan segera menghubungi Anda.`)}
                    className="w-full py-3 bg-error-container/10 hover:bg-error-container/20 text-error flex items-center justify-center gap-1.5 transition-colors border-t border-outline-variant/20 font-bold text-[10px] border-none cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">report</span>
                    Laporkan Ketidaksesuaian / Rusak
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Evidence Upload */}
        <section className="space-y-4">
          <h3 className="font-heading font-black text-xs text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
            Bukti Penerimaan
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Upload Placeholder */}
            <button 
              type="button"
              onClick={handleUploadPhoto}
              className="aspect-square rounded-2xl border-2 border-dashed border-outline-variant/60 flex flex-col items-center justify-center gap-1.5 bg-surface-container-low hover:bg-surface-container hover:border-primary transition-all border-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[28px]">add_a_photo</span>
              <span className="text-[10px] text-on-surface-variant font-bold">Ambil Foto</span>
            </button>

            {/* Photo List */}
            {photos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border border-outline-variant/20">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Bukti Kirim"
                  src={photo}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    type="button"
                    onClick={() => handleDeletePhoto(idx)}
                    className="bg-error text-white p-2 rounded-full border-none cursor-pointer flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-on-surface-variant/70 text-center italic leading-relaxed">
            Unggah foto Surat Jalan yang sudah ditandatangani dan kondisi fisik barang.
          </p>
        </section>
      </main>

      {/* Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t border-outline-variant/20 z-50 rounded-t-2xl h-24 flex items-center">
        <button 
          type="button"
          onClick={handleSubmitReport}
          disabled={isSubmitting || !packagingOk || !sealOk}
          className={`w-full h-12 text-white font-heading font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all duration-200 border-none cursor-pointer ${
            isSubmitting || !packagingOk || !sealOk
              ? "bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed shadow-none"
              : "bg-primary text-white active:scale-95 active:bg-primary/95 shadow-primary/20"
          }`}
        >
          <span className="material-symbols-outlined text-base">task_alt</span>
          {isSubmitting ? "Mengirim Laporan..." : "Konfirmasi Penerimaan"}
        </button>
      </footer>

      {/* Success Toast Overlay */}
      {isToastOpen && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-primary-container text-on-primary-container px-6 py-3.5 rounded-full shadow-2xl z-[100] flex items-center gap-2 border border-primary/20 animate-bounce">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <span className="text-xs font-black">Laporan Penerimaan Berhasil Dikirim!</span>
        </div>
      )}
    </div>
  );
}
