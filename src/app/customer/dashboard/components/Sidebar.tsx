"use client";

import { useState, useEffect } from "react";

interface SidebarProps {
  activeTab: "dashboard" | "belanja" | "status" | "riwayat" | "tagihan" | "dokumen" | "legalitas" | "pengaturan" | "keranjang" | "alamat";
  setActiveTab: (tab: "dashboard" | "belanja" | "status" | "riwayat" | "tagihan" | "dokumen" | "legalitas" | "pengaturan" | "keranjang" | "alamat") => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  viewingDetailOrder: any;
  setViewingDetailOrder: (order: any) => void;
  institutionName: string;
  handleLogout: () => void;
  setIsCartOpen: (open: boolean) => void;
  cartItemCount: number;
  pendingPaymentCount: number;
  activeOrdersCount: number;
  docSubTab: "sp" | "esign" | "do" | "faktur";
  setDocSubTab: (tab: "sp" | "esign" | "do" | "faktur") => void;
  esignPendingCount: number;
  legalSubTab: "instansi" | "sipa" | "sia" | "profile";
  setLegalSubTab: (tab: "instansi" | "sipa" | "sia" | "profile") => void;
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  isCheckoutOpen,
  setIsCheckoutOpen,
  viewingDetailOrder,
  setViewingDetailOrder,
  institutionName,
  handleLogout,
  setIsCartOpen,
  cartItemCount,
  pendingPaymentCount,
  activeOrdersCount,
  docSubTab,
  setDocSubTab,
  esignPendingCount,
  legalSubTab,
  setLegalSubTab,
  onCloseMobile,
  isMobileDrawer = false,
}: SidebarProps) {
  const [logoUrl, setLogoUrl] = useState("https://res.cloudinary.com/rumahhostcom/image/upload/v1785321525/logo_care_fcfgwq.png");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: any) => {
        if (data && data.success && data.settings?.logo_url) {
          setLogoUrl(data.settings.logo_url);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <aside
      className={`bg-white flex-col justify-between select-none font-sans z-30 ${
        isMobileDrawer
          ? "w-[85vw] max-w-xs flex h-full border-r border-slate-200/80 shadow-2xl"
          : "hidden md:flex w-64 h-screen sticky top-0 shrink-0 border-r border-slate-200/80 shadow-xs"
      }`}
    >
      {/* TOP SECTION: LOGO, PROFILE & NAV */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Header Logo */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <img
              alt="GroovyRx Logo"
              className="h-6 w-auto object-contain"
              src={logoUrl}
            />
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Enterprise
            </span>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-2 rounded-full hover:bg-slate-100 active:scale-90 transition-transform text-slate-500 border-none bg-transparent cursor-pointer flex items-center justify-center md:hidden"
              aria-label="Tutup Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Profile Card Mini */}
        <div className="p-3.5 bg-slate-50/70 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full border-2 border-emerald-500/30 p-0.5 bg-white shadow-xs overflow-hidden">
                <img
                  className="w-full h-full object-cover rounded-full"
                  alt="Avatar APJ"
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Dr.%20Budi%20Santoso%2C%20S.Farm%2C%20Apt&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                ✓
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3
                title="Apoteker Penanggung Jawab"
                className="font-bold text-xs text-slate-900 leading-snug break-words line-clamp-1"
              >
                Apoteker Penanggung Jawab
              </h3>
              <p className="text-[10px] text-slate-500 font-medium truncate pt-0.5">
                APJ • {institutionName || "Apotek Sehat Farma"}
              </p>
            </div>
          </div>

          <div className="mt-3 bg-white border border-slate-200/70 rounded-xl p-3 flex justify-between items-center text-xs shadow-2xs">
            <div>
              <span className="text-slate-400 text-[9px] uppercase font-semibold tracking-wider block">
                ID Pelanggan
              </span>
              <span className="text-slate-800 font-bold block text-[11px]">
                PBF-882910
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[9px] uppercase font-semibold tracking-wider block">
                Sisa Kredit
              </span>
              <span className="text-emerald-700 font-extrabold block text-[11px]">
                Rp 50.000.000
              </span>
            </div>
          </div>
        </div>

        {/* NAVIGATION MENU */}
        <nav className="p-3 space-y-1 text-slate-700 font-sans">
          {/* Group 1: Utama */}
          <div className="py-1">
            <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              Utama
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveTab("dashboard");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer border-none ${
                activeTab === "dashboard" && !isCheckoutOpen && !viewingDetailOrder
                  ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-3 text-xs font-semibold">
                <svg
                  className={`w-4 h-4 ${
                    activeTab === "dashboard" && !isCheckoutOpen && !viewingDetailOrder
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  ></path>
                </svg>
                <span>Dashboard</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("belanja");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer border-none ${
                activeTab === "belanja" && !isCheckoutOpen && !viewingDetailOrder
                  ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-3 text-xs font-semibold">
                <svg
                  className={`w-4 h-4 ${
                    activeTab === "belanja" && !isCheckoutOpen && !viewingDetailOrder
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  ></path>
                </svg>
                <span>Katalog Produk</span>
              </div>
            </button>
          </div>

          {/* Group 2: Transaksi */}
          <div className="py-1">
            <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              Transaksi
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveTab("riwayat");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer border-none ${
                activeTab === "riwayat" && !viewingDetailOrder
                  ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-3 text-xs font-semibold">
                <svg
                  className={`w-4 h-4 ${
                    activeTab === "riwayat" && !viewingDetailOrder ? "text-emerald-600" : "text-slate-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  ></path>
                </svg>
                <span>Riwayat Transaksi</span>
              </div>
              {pendingPaymentCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-rose-600 text-white rounded-full min-w-[16px] text-center leading-none">
                  {pendingPaymentCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("tagihan");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer border-none ${
                activeTab === "tagihan" && !viewingDetailOrder
                  ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-3 text-xs font-semibold">
                <svg
                  className={`w-4 h-4 ${
                    activeTab === "tagihan" && !viewingDetailOrder ? "text-emerald-600" : "text-slate-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>Keuangan &amp; Kredit TOP</span>
              </div>
            </button>
          </div>

          {/* Group 3: Dokumen & Legalitas */}
          <div className="py-1">
            <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              Dokumen &amp; Legalitas
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveTab("dokumen");
                setDocSubTab("sp");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer border-none ${
                activeTab === "dokumen"
                  ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-3 text-xs font-semibold">
                <svg
                  className={`w-4 h-4 ${activeTab === "dokumen" ? "text-emerald-600" : "text-slate-400"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  ></path>
                </svg>
                <span>Dokumen Legal &amp; SP</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("legalitas");
                setLegalSubTab("sia");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer border-none ${
                activeTab === "legalitas"
                  ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-3 text-xs font-semibold">
                <svg
                  className={`w-4 h-4 ${activeTab === "legalitas" ? "text-emerald-600" : "text-slate-400"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  ></path>
                </svg>
                <span>Legalitas SIA / SIPA</span>
              </div>
            </button>
          </div>

          {/* Group 4: Dukungan & Akun */}
          <div className="pt-2 border-t border-slate-100">
            <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              Dukungan &amp; Akun
            </span>
            <button
              type="button"
              onClick={() => {
                alert("Ajukan retur atau komplain: Hubungi cs@groovyrx.com / WA: +62-851-5100-5960");
                onCloseMobile?.();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border-none bg-transparent"
            >
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                ></path>
              </svg>
              <span>Retur &amp; Komplain</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("pengaturan");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer border-none text-xs font-semibold ${
                activeTab === "pengaturan"
                  ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <svg
                className={`w-4 h-4 ${activeTab === "pengaturan" ? "text-emerald-600" : "text-slate-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              <span>Pengaturan Akun</span>
            </button>
          </div>
        </nav>
      </div>

      {/* BOTTOM ACTION BUTTONS */}
      <div className="p-4 border-t border-slate-100 bg-white space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            setActiveTab("belanja");
            setIsCheckoutOpen(false);
            setViewingDetailOrder(null);
            setIsCartOpen(false);
            onCloseMobile?.();
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer shadow-xs border-none"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          <span>Buat Pesanan Baru</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-2.5 rounded-xl active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            ></path>
          </svg>
          <span>Keluar Akun</span>
        </button>
        <p className="text-center text-slate-400 text-[9px] font-medium tracking-wider pt-1">
          v2.4.1 • PBF Online System
        </p>
      </div>
    </aside>
  );
}
