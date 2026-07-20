"use client";

import React from "react";

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
  const remainingLimit = institution.creditLimit - institution.currentDebt;
  const limitPercentage = Math.round((remainingLimit / institution.creditLimit) * 100);

  // Format currency in compact M (Millions) or normal IDR
  const formatCompactRupiah = (value: number) => {
    if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}M`;
    }
    return `Rp ${value.toLocaleString("id-ID")}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-24 px-1">
      {/* Profile Header Section */}
      <section className="flex flex-col items-center py-4">
        <div className="relative mb-4 group">
          <div className="w-24 h-24 rounded-full border-4 border-primary-container p-1 overflow-hidden">
            <img 
              className="w-full h-full object-cover rounded-full" 
              alt="Apoteker APJ" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKMLtg-EStyEeW_Tt07pjCSBaoUSkb3JOC4OD68TI_bXGGAxhPGt25AScLEKA-BkiTAW9e8TIcZQ_405QyAW4U_ClfvDML5-Q2Zby3mCwwXM3z2KKedrdxzSNCNSanIzwVoflnDNZnpkrG7XwaiAdl50nq2grA5CAda2w1gJ8MhaqDADOprRIOshIskDrLTQIbJVy_j9TgPAogaIlshohsaYSfR8L0eLjqNaZO_ZGJPZd0rt6_CkcuKAFcG8rdfAlqjIBgSVCK-n4"
            />
          </div>
          <div className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        </div>
        <div className="text-center">
          <h2 className="font-heading font-black text-base text-on-surface">{user.name}</h2>
          <p className="text-on-surface-variant font-bold text-[10px] mt-0.5 uppercase tracking-wide">Apoteker Penanggung Jawab</p>
          <div className="flex items-center justify-center gap-1 mt-2 text-primary font-bold text-xs">
            <span className="material-symbols-outlined text-[14px]">medical_services</span>
            <span>{institution.name}</span>
          </div>
        </div>
      </section>

      {/* Account Overview (Tonal Layering) */}
      <section className="bg-surface-container-low rounded-2xl p-4 flex justify-between items-center border border-outline-variant/10 shadow-sm text-xs font-bold">
        <div>
          <p className="text-on-surface-variant text-[9px] uppercase tracking-wider">ID Pelanggan</p>
          <p className="text-sm font-black text-foreground mt-0.5">{institution.code || "PBF-882910"}</p>
        </div>
        <div className="text-right">
          <p className="text-on-surface-variant text-[9px] uppercase tracking-wider">Status Kemitraan</p>
          <div className="flex items-center gap-1 justify-end mt-0.5">
            <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span className="text-xs font-black text-on-surface">Gold Partner</span>
          </div>
        </div>
      </section>

      {/* Operational Info Cards (Bento Style) */}
      <section className="grid grid-cols-2 gap-4">
        {/* Credit card */}
        <div 
          onClick={() => setActiveTab("tagihan")}
          className="bg-white border border-outline-variant/30 rounded-2xl p-4 shadow-sm active:scale-95 transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-2 text-primary">
            <span className="material-symbols-outlined text-base">payments</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Sisa Kredit</span>
          </div>
          <p className="font-heading font-black text-xs text-foreground truncate">{formatCompactRupiah(remainingLimit)}</p>
          <div className="mt-2.5 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${limitPercentage}%` }}></div>
          </div>
        </div>

        {/* Reward points */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-4 shadow-sm active:scale-95 transition-transform">
          <div className="flex items-center gap-2 mb-2 text-tertiary">
            <span className="material-symbols-outlined text-base">redeem</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Poin Reward</span>
          </div>
          <p className="font-heading font-black text-xs text-on-surface">12.450</p>
          <p className="text-tertiary text-[9px] font-bold mt-1">+850 bln ini</p>
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
          <button 
            onClick={() => {
              setActiveTab("legalitas");
              setLegalSubTab("sia");
            }}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
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
            <span className="material-symbols-outlined text-outline text-base">chevron_right</span>
          </button>
          <div className="mx-4 h-px bg-outline-variant/15"></div>
          
          <button 
            onClick={() => alert("Pengelolaan Alamat Pengiriman segera hadir.")}
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
            onClick={() => alert("Pengaturan Keamanan Akun segera hadir.")}
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
            onClick={() => alert("Hubungi cs@groovyrx.com / Telepon: (021) 8984-5678")}
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
        onClick={handleLogout}
        className="w-full bg-error-container/25 hover:bg-error-container/30 text-error font-heading font-black text-xs py-4 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
      >
        <span className="material-symbols-outlined text-base">logout</span>
        Keluar Akun
      </button>

      <p className="text-center text-on-surface-variant text-[9px] font-bold pb-8 uppercase tracking-wider">
        Versi Aplikasi 2.4.1 • PBF Online Ecosystem
      </p>
    </div>
  );
}
