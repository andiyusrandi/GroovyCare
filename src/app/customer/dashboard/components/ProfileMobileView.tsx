"use client";

import React from "react";
import Link from "next/link";

interface ProfileMobileViewProps {
  user: any;
  institution: any;
  handleLogout: () => void;
  setActiveTab: (tab: any) => void;
  setLegalSubTab: (subTab: any) => void;
}

export default function ProfileMobileView({
  user,
  institution,
  handleLogout,
  setActiveTab,
  setLegalSubTab,
}: ProfileMobileViewProps) {
  const remainingLimit = (institution?.creditLimit || 0) - (institution?.currentDebt || 0);
  const limitPercentage = Math.round((remainingLimit / (institution?.creditLimit || 1)) * 100);

  const formatRupiah = (value: number) => {
    const val = Math.max(0, Math.round(value || 0));
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  return (
    <div className="bg-slate-50/50 min-h-screen">
      <div className="space-y-4 font-sans pb-28 px-4 pt-2">
        {/* 1. Native Profile Summary Card */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200/70 shadow-xs">
          <div className="flex items-center gap-3.5">
            {/* Avatar with Badge */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 p-0.5 bg-slate-50 overflow-hidden shadow-inner">
                <img
                  className="w-full h-full object-cover rounded-full bg-emerald-100/60"
                  alt="Avatar APJ"
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || "demo")}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
                />
              </div>
              <span className="absolute bottom-0 right-0 bg-emerald-600 text-white p-0.5 rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </span>
            </div>

            {/* Info Profile */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-900 leading-snug truncate">{user?.name || "demo"}</h2>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-tight">
                  APJ
                </span>
              </div>
              <p className="text-slate-500 font-semibold text-[11px] truncate">Apoteker Penanggung Jawab PBF</p>

              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0">medical_services</span>
                <span className="truncate">{institution?.name || "Apotik Demo"}</span>
              </div>
            </div>
          </div>

          {/* Compact ID & Kemitraan Bar */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-left">
            <div className="bg-slate-50 px-3 py-2 rounded-2xl">
              <span className="text-slate-400 text-[9px] uppercase tracking-wider font-extrabold block">ID Pelanggan</span>
              <span className="text-xs font-black text-slate-800 font-mono tracking-tight">{institution?.code || "PBF-882910"}</span>
            </div>
            <div className="bg-amber-50/60 border border-amber-100/60 px-3 py-2 rounded-2xl">
              <span className="text-amber-800/70 text-[9px] uppercase tracking-wider font-extrabold block">Kemitraan</span>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-amber-600 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                  stars
                </span>
                <span className="text-[11px] font-extrabold text-amber-900 truncate">Gold Partner</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Android Dashboard Quick Cards */}
        <section className="grid grid-cols-2 gap-3">
          {/* Sisa Kredit */}
          <div
            onClick={() => setActiveTab("tagihan")}
            className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs active:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-base">payments</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sisa Kredit</span>
            <p className="font-extrabold text-sm text-slate-900 font-mono mt-0.5">{formatRupiah(remainingLimit)}</p>
            <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, limitPercentage))}%` }}></div>
            </div>
          </div>

          {/* Izin SIPA */}
          <div
            onClick={() => {
              setActiveTab("legalitas");
              setLegalSubTab("sipa");
            }}
            className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs active:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-base">badge</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Izin SIPA APJ</span>
            <p className="font-bold text-[11px] text-slate-900 font-mono mt-0.5 truncate">{user?.sipaNumber || "SIPA/DEMO/2026"}</p>
            <p className="text-emerald-600 text-[9px] font-bold mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              CDOB Valid
            </p>
          </div>
        </section>

        {/* 3. Regulasi Banner Tonal */}
        <section className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified_user
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-extrabold text-emerald-950">Kepatuhan Regulasi PBF</h3>
            <p className="text-emerald-700 text-[10px] font-medium mt-0.5 truncate">Sertifikasi CDOB &amp; Izin Farmasi Aktif</p>
          </div>
        </section>

        {/* 4. Grouped Settings & Action Menu (Material 3 Inset Group) */}
        <section className="space-y-3">
          {/* Group 1: Legal & Profile */}
          <div className="bg-white rounded-3xl border border-slate-200/70 shadow-2xs overflow-hidden divide-y divide-slate-100">
            <button
              type="button"
              onClick={() => {
                setActiveTab("legalitas");
                setLegalSubTab("sia");
              }}
              className="w-full flex items-center justify-between p-3.5 active:bg-slate-100/70 transition-colors border-none bg-transparent cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">description</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-slate-900">Informasi Legal &amp; Izin</span>
                  <span className="block text-slate-400 text-[10px] font-medium truncate">SIA, SIPA, &amp; Detail APJ</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Lihat</span>
                <span className="material-symbols-outlined text-slate-400 text-base">chevron_right</span>
              </div>
            </button>

            <Link
              href="/customer/profile"
              className="w-full flex items-center justify-between p-3.5 active:bg-slate-100/70 transition-colors border-none bg-transparent cursor-pointer text-left no-underline"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">badge</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-slate-900">Data Identitas &amp; KTP Pemilik</span>
                  <span className="block text-slate-400 text-[10px] font-medium truncate">KTP Pemilik, NPWP, Berkas</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Update</span>
                <span className="material-symbols-outlined text-slate-400 text-base">chevron_right</span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setActiveTab("pengaturan")}
              className="w-full flex items-center justify-between p-3.5 active:bg-slate-100/70 transition-colors border-none bg-transparent cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">location_on</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-slate-900">Alamat Pengiriman Sarana</span>
                  <span className="block text-slate-400 text-[10px] font-medium truncate">Kelola titik gudang &amp; apotek</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-base shrink-0 ml-2">chevron_right</span>
            </button>
          </div>

          {/* Group 2: Payment & Security */}
          <div className="bg-white rounded-3xl border border-slate-200/70 shadow-2xs overflow-hidden divide-y divide-slate-100">
            <button
              type="button"
              onClick={() => alert("Pengaturan Metode Pembayaran segera hadir.")}
              className="w-full flex items-center justify-between p-3.5 active:bg-slate-100/70 transition-colors border-none bg-transparent cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-slate-900">Metode Pembayaran</span>
                  <span className="block text-slate-400 text-[10px] font-medium truncate">Virtual Account, Bank Transfer &amp; TOP</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-base shrink-0 ml-2">chevron_right</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pengaturan")}
              className="w-full flex items-center justify-between p-3.5 active:bg-slate-100/70 transition-colors border-none bg-transparent cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">security</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-slate-900">Keamanan &amp; Autentikasi</span>
                  <span className="block text-slate-400 text-[10px] font-medium truncate">Kata sandi, PIN, &amp; Biometrik</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-base shrink-0 ml-2">chevron_right</span>
            </button>

            <button
              type="button"
              onClick={() => alert("Pusat Bantuan & Regulasi: Silakan hubungi CS PBF GroovyCare.")}
              className="w-full flex items-center justify-between p-3.5 active:bg-slate-100/70 transition-colors border-none bg-transparent cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">help</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-slate-900">Pusat Bantuan &amp; Regulasi</span>
                  <span className="block text-slate-400 text-[10px] font-medium truncate">FAQ, Panduan CDOB, &amp; Syarat Ketentuan</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-base shrink-0 ml-2">chevron_right</span>
            </button>
          </div>
        </section>

        {/* 5. Native Logout Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-rose-50/80 active:bg-rose-100 text-rose-700 font-bold text-xs py-3.5 rounded-2xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 border border-rose-200/50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Keluar dari Akun</span>
          </button>
          <p className="text-center text-slate-400 text-[10px] font-semibold pt-4 pb-2">
            GroovyRx Enterprise • v2.4.1
          </p>
        </div>
      </div>
    </div>
  );
}

