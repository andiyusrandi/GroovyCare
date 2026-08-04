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

  // Format currency in full standard IDR (e.g. Rp 50.000.000)
  const formatRupiah = (value: number) => {
    const val = Math.max(0, Math.round(value || 0));
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-24 px-1">
      {/* Profile Header Section (Alodokter & Tokopedia Style) */}
      <section className="flex flex-col items-center py-4 bg-gradient-to-b from-emerald-50/60 to-white rounded-3xl p-4 border border-emerald-100/60 shadow-2xs">
        <div className="relative mb-3 group">
          <div className="w-24 h-24 rounded-full border-4 border-emerald-500/30 p-1 bg-white shadow-md overflow-hidden">
            <img 
              className="w-full h-full object-cover rounded-full bg-emerald-50" 
              alt="Apoteker APJ Cartoon Avatar" 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || "Apoteker")}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`}
            />
          </div>
          <div className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1 rounded-full border-2 border-white flex items-center justify-center shadow-sm" title="Apoteker APJ Terverifikasi CDOB">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-heading font-black text-base text-slate-900 flex items-center justify-center gap-1.5">
            <span>{user?.name || "Rian Hidayat, S.Farm"}</span>
            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-emerald-300">APJ</span>
          </h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wide">Apoteker Penanggung Jawab PBF</p>
          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-600/10 text-emerald-800 font-extrabold text-xs rounded-full border border-emerald-200 mt-1">
            <span className="material-symbols-outlined text-[15px] text-emerald-700">medical_services</span>
            <span>{institution?.name || "Apotek Sejahtera"}</span>
          </div>
        </div>
      </section>

      {/* Account Overview (Tonal Layering Tokopedia Style) */}
      <section className="bg-white rounded-2xl p-4 flex justify-between items-center border border-slate-200 shadow-2xs text-xs font-bold">
        <div>
          <p className="text-slate-400 text-[9px] uppercase tracking-wider font-extrabold">ID Pelanggan</p>
          <p className="text-sm font-black text-slate-900 mt-0.5 font-mono">{institution?.code || "PBF-882910"}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-[9px] uppercase tracking-wider font-extrabold">Status Kemitraan</p>
          <div className="flex items-center gap-1 justify-end mt-0.5">
            <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span className="text-xs font-black text-emerald-950">Gold Partner CDOB</span>
          </div>
        </div>
      </section>

      {/* Operational Info Cards (Bento Style Alodokter/Tokopedia) */}
      <section className="grid grid-cols-2 gap-3.5">
        {/* Credit card */}
        <div 
          onClick={() => setActiveTab("tagihan")}
          className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs active:scale-95 transition-all cursor-pointer hover:border-emerald-300"
        >
          <div className="flex items-center gap-1.5 mb-1.5 text-emerald-700">
            <span className="material-symbols-outlined text-base">payments</span>
            <span className="text-[10px] font-black uppercase tracking-wider">Sisa Kredit</span>
          </div>
          <p className="font-heading font-black text-xs text-slate-900 truncate font-mono">{formatRupiah(remainingLimit)}</p>
          <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${limitPercentage}%` }}></div>
          </div>
        </div>

        {/* SIPA & Validasi CDOB Card (Buka Halaman Tab Legalitas & Profil Sarana) */}
        <div 
          onClick={() => {
            setActiveTab("legalitas");
            setLegalSubTab("sipa");
          }}
          className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs active:scale-95 transition-all cursor-pointer hover:border-emerald-300"
        >
          <div className="flex items-center gap-1.5 mb-1.5 text-indigo-700">
            <span className="material-symbols-outlined text-base">badge</span>
            <span className="text-[10px] font-black uppercase tracking-wider">Izin SIPA APJ</span>
          </div>
          <p className="font-heading font-black text-[11px] text-slate-900 truncate font-mono">{user?.sipaNumber || "SIPA Terverifikasi"}</p>
          <p className="text-emerald-700 text-[9px] font-extrabold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Validasi CDOB BPOM
          </p>
        </div>
      </section>

      {/* Regulatory Badge (Soft Glow) */}
      <section className="bg-[#ecfdf5] border border-[#10b981]/25 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
        <div className="w-11 h-11 bg-[#10b981] rounded-xl flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
        </div>
        <div>
          <h3 className="text-xs font-black text-[#00422b]">Kepatuhan Regulasi</h3>
          <p className="text-[#10b981] text-[9px] font-bold mt-0.5">Patuh CDOB &amp; Sertifikasi BPOM Berlaku</p>
        </div>
      </section>

      {/* Main Menu List */}
      <section className="space-y-3.5">
        {/* Group 1: Business */}
        <div className="bg-white rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm">
          {/* Menu 1: Membuka Tab Legalitas & Profil Sarana */}
          <button 
            type="button"
            onClick={() => {
              setActiveTab("legalitas");
              setLegalSubTab("sia");
            }}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer text-slate-800"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-base">description</span>
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-foreground">Informasi Legal &amp; Izin</span>
                <span className="block text-on-surface-variant text-[9px] font-bold mt-0.5">SIA, SIPA, Detail APJ</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Lihat / Edit</span>
              <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
            </div>
          </button>
          
          {/* Menu 2: Data Identitas & KTP Pemilik (Taut ke /customer/profile) */}
          <div className="mx-4 h-px bg-outline-variant/15"></div>
          <Link
            href="/customer/profile"
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer text-slate-800 no-underline"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-base">badge</span>
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-foreground">Data Identitas &amp; KTP Pemilik</span>
                <span className="block text-on-surface-variant text-[9px] font-bold mt-0.5">KTP Pemilik, NPWP, Upload Berkas</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300">Update KTP</span>
              <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
            </div>
          </Link>

          {/* Menu 3: Alamat Pengiriman */}
          <div className="mx-4 h-px bg-outline-variant/15"></div>
          <button 
            type="button"
            onClick={() => setActiveTab("pengaturan")}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-base">location_on</span>
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-foreground">Alamat Pengiriman</span>
                <span className="block text-on-surface-variant text-[9px] font-bold mt-0.5">Kelola lokasi pengiriman</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
          </button>
        </div>

        {/* Group 2: Account */}
        <div className="bg-white rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm">
          <button 
            type="button"
            onClick={() => alert("Pengaturan Metode Pembayaran segera hadir.")}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-base">account_balance_wallet</span>
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-foreground">Metode Pembayaran</span>
                <span className="block text-on-surface-variant text-[9px] font-bold mt-0.5">Bank Transfer &amp; Virtual Account</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
          </button>
          <div className="mx-4 h-px bg-outline-variant/15"></div>
          <button 
            type="button"
            onClick={() => setActiveTab("pengaturan")}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-base">security</span>
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-foreground">Keamanan &amp; Akun</span>
                <span className="block text-on-surface-variant text-[9px] font-bold mt-0.5">Password &amp; Biometric</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
          </button>
        </div>

        {/* Group 3: Help */}
        <div className="bg-white rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm">
          <button 
            type="button"
            onClick={() => alert("Pusat Bantuan &amp; Panduan CDOB: Silakan hubungi CS PBF GroovyCare.")}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-surface-container text-outline flex items-center justify-center">
                <span className="material-symbols-outlined text-base">help</span>
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-foreground">Pusat Bantuan &amp; Kebijakan</span>
                <span className="block text-on-surface-variant text-[9px] font-bold mt-0.5">Terms &amp; Panduan CDOB</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
          </button>
        </div>
      </section>

      {/* Logout Button */}
      <button 
        type="button"
        onClick={handleLogout}
        className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-heading font-black text-xs py-4 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 border border-rose-200/60 cursor-pointer"
      >
        <span className="material-symbols-outlined text-base">logout</span>
        Keluar Akun
      </button>

      <p className="text-center text-slate-400 text-[9px] font-bold pb-8 uppercase tracking-wider">
        Versi Aplikasi 2.4.1 • PBF Online Ecosystem
      </p>
    </div>
  );
}
