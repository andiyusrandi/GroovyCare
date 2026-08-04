"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface WelcomeTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

const TOUR_STEPS = [
  {
    step: 1,
    title: "Selamat Datang di PBF Online!",
    greeting: "Halo Rekan Apoteker Penanggung Jawab,",
    desc: "Pendaftaran sarana Anda telah disetujui dan diaktifkan oleh PBF Admin. Sekarang Anda dapat menggunakan seluruh fasilitas transaksi PBF Online.",
    subDesc: "Mari ikuti tur 4 langkah singkat untuk mengenal fitur-fitur utama kami!",
  },
  {
    step: 2,
    title: "Katalog & Transaksi Obat",
    greeting: "Pemesanan Obat Berstandar CDOB",
    desc: "Temukan ribuan sediaan obat resmi dari distributor terverifikasi. Transaksi aman dengan alokasi nomor batch & kadaluarsa (FEFO) real-time.",
    subDesc: "Dukungan penuh untuk pesanan produk Cold Chain & Regular.",
  },
  {
    step: 3,
    title: "e-Sign & Surat Pesanan (SP)",
    greeting: "Penandatanganan SP Digital Sah Hukum",
    desc: "Buat dan otorisasi Surat Pesanan (SP) secara digital tanpa perlu cetak kertas. Terhubung dengan verifikasi APJ resmi dan standar kepatuhan BPOM.",
    subDesc: "Proses approval cepat langsung dari perangkat seluler Anda.",
  },
  {
    step: 4,
    title: "Faktur & Limit Kredit Tempo",
    greeting: "Manajemen Keuangan & e-Faktur",
    desc: "Pantau saldo limit kredit tempo, tanggal jatuh tempo faktur, serta verifikasi e-Faktur pajak dengan transparan 24/7.",
    subDesc: "Selamat bertransaksi di PBF Online!",
  },
];

export default function WelcomeTourModal({
  isOpen,
  onClose,
  userName = "Apoteker",
}: WelcomeTourModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const stepData = TOUR_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300 select-none">
      {/* Container Modal / Bottom Sheet */}
      <div className="bg-white rounded-t-[28px] sm:rounded-[28px] max-w-lg w-full shadow-2xl overflow-hidden border-t sm:border border-slate-100 flex flex-col relative animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-300">

        {/* Drag Handle / Notch for Mobile Indicator */}
        <div className="w-full flex justify-center pt-2.5 pb-1 bg-gradient-to-r from-emerald-700 to-emerald-600 sm:hidden">
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 px-5 py-4 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined font-bold text-xl">medical_services</span>
              <span className="font-bold text-sm tracking-wide font-heading">PBF Online</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white uppercase tracking-wider">
                Langkah {stepData.step} dari 4
              </span>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Tutup Tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h3 className="font-bold text-lg mt-2 leading-snug font-heading">
            {stepData.title}
          </h3>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800">
              {stepData.greeting}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {stepData.desc}
            </p>
            <p className="text-xs text-emerald-700 font-semibold leading-relaxed">
              {stepData.subDesc}
            </p>
          </div>

          {/* Footer Action & Dots (Responsive & No-Overflow) */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-2 w-full">
            {/* 1. Indikator Dots (Shrink & Compact) */}
            <div className="flex items-center gap-1 shrink-0">
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === currentStep ? "w-5 bg-emerald-600" : "w-1.5 bg-slate-200"
                    }`}
                />
              ))}
            </div>

            {/* 2. Action Buttons (Responsive & No-Overflow) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                >
                  Back
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full text-xs font-semibold cursor-pointer transition-all shadow-xs"
              >
                {currentStep === TOUR_STEPS.length - 1 ? "Done" : "Next"}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
