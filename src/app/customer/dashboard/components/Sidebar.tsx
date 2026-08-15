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
  creditLimit?: number;
  currentDebt?: number;
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
  creditLimit = 0,
  currentDebt = 0,
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
      .catch(() => { });
  }, []);

  return (
    <aside
      className={`bg-white flex-col justify-between select-none font-sans z-30 ${isMobileDrawer
          ? "w-[300px] sm:w-[320px] h-full shadow-2xl border-r border-slate-100 flex overflow-y-auto"
          : "hidden md:flex w-64 h-screen sticky top-0 shrink-0 border-r border-slate-200/80 shadow-xs"
        }`}
    >
      {/* TOP SECTION: LOGO, PROFILE & NAV */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {/* Top Bar Drawer: Brand & Close */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <img
              alt="GroovyRx Logo"
              className="h-6 w-auto object-contain"
              src={logoUrl}
            />
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
              Enterprise
            </span>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 active:scale-95 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center md:hidden"
              aria-label="Tutup Menu"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Profil Mini Card (Material 3 Tonal Surface) */}
        <div className="p-3.5 space-y-2.5">
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/60 flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-full bg-emerald-100 p-0.5 overflow-hidden border border-emerald-300">
                <img
                  className="w-full h-full object-cover rounded-full"
                  alt="Avatar APJ"
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=demo&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate">Apoteker Penanggung Jawab</h4>
              <p className="text-[11px] text-slate-500 truncate font-medium">{institutionName || "Apotik Demo"}</p>
            </div>
          </div>

          {/* Compact Stats Bar */}
          <div className="grid grid-cols-2 gap-2 bg-emerald-950/5 p-2.5 rounded-2xl">
            <div>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">ID Pelanggan</span>
              <span className="text-xs font-bold font-mono text-slate-800">PBF-882910</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Sisa Kredit</span>
              <span className={`text-xs font-bold font-mono ${creditLimit > 0 ? "text-emerald-700" : "text-amber-700"}`}>
                Rp {Math.max(0, creditLimit - currentDebt).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* NAVIGATION MENU ITEMS (Material 3 Active Pill Style) */}
        <nav className="p-3 space-y-4 text-slate-700 font-sans">
          {/* Section: Utama */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Utama</p>
            <button
              type="button"
              onClick={() => {
                setActiveTab("dashboard");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full transition-all text-left cursor-pointer border-none text-xs ${activeTab === "dashboard" && !isCheckoutOpen && !viewingDetailOrder
                  ? "bg-emerald-100/70 text-emerald-900 font-bold"
                  : "text-slate-600 hover:bg-slate-100 active:bg-slate-200/70 font-medium"
                }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-lg ${activeTab === "dashboard" && !isCheckoutOpen && !viewingDetailOrder ? "text-emerald-700" : "text-slate-500"
                    }`}
                  style={{ fontVariationSettings: activeTab === "dashboard" && !isCheckoutOpen && !viewingDetailOrder ? "'FILL' 1" : "'FILL' 0" }}
                >
                  dashboard
                </span>
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full transition-all text-left cursor-pointer border-none text-xs ${activeTab === "belanja" && !isCheckoutOpen && !viewingDetailOrder
                  ? "bg-emerald-100/70 text-emerald-900 font-bold"
                  : "text-slate-600 hover:bg-slate-100 active:bg-slate-200/70 font-medium"
                }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-lg ${activeTab === "belanja" && !isCheckoutOpen && !viewingDetailOrder ? "text-emerald-700" : "text-slate-500"
                    }`}
                  style={{ fontVariationSettings: activeTab === "belanja" && !isCheckoutOpen && !viewingDetailOrder ? "'FILL' 1" : "'FILL' 0" }}
                >
                  inventory_2
                </span>
                <span>Katalog Produk</span>
              </div>
            </button>
          </div>

          {/* Section: Transaksi */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Transaksi</p>
            <button
              type="button"
              onClick={() => {
                setActiveTab("riwayat");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full transition-all text-left cursor-pointer border-none text-xs ${activeTab === "riwayat" && !viewingDetailOrder
                  ? "bg-emerald-100/70 text-emerald-900 font-bold"
                  : "text-slate-600 hover:bg-slate-100 active:bg-slate-200/70 font-medium"
                }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-lg ${activeTab === "riwayat" && !viewingDetailOrder ? "text-emerald-700" : "text-slate-500"
                    }`}
                  style={{ fontVariationSettings: activeTab === "riwayat" && !viewingDetailOrder ? "'FILL' 1" : "'FILL' 0" }}
                >
                  receipt_long
                </span>
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full transition-all text-left cursor-pointer border-none text-xs ${activeTab === "tagihan" && !viewingDetailOrder
                  ? "bg-emerald-100/70 text-emerald-900 font-bold"
                  : "text-slate-600 hover:bg-slate-100 active:bg-slate-200/70 font-medium"
                }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-lg ${activeTab === "tagihan" && !viewingDetailOrder ? "text-emerald-700" : "text-slate-500"
                    }`}
                  style={{ fontVariationSettings: activeTab === "tagihan" && !viewingDetailOrder ? "'FILL' 1" : "'FILL' 0" }}
                >
                  account_balance_wallet
                </span>
                <span>Keuangan &amp; Kredit TOP</span>
              </div>
            </button>
          </div>

          {/* Section: Dokumen & Legalitas */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Dokumen &amp; Legalitas</p>
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full transition-all text-left cursor-pointer border-none text-xs ${activeTab === "dokumen"
                  ? "bg-emerald-100/70 text-emerald-900 font-bold"
                  : "text-slate-600 hover:bg-slate-100 active:bg-slate-200/70 font-medium"
                }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-lg ${activeTab === "dokumen" ? "text-emerald-700" : "text-slate-500"}`}
                  style={{ fontVariationSettings: activeTab === "dokumen" ? "'FILL' 1" : "'FILL' 0" }}
                >
                  description
                </span>
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full transition-all text-left cursor-pointer border-none text-xs ${activeTab === "legalitas"
                  ? "bg-emerald-100/70 text-emerald-900 font-bold"
                  : "text-slate-600 hover:bg-slate-100 active:bg-slate-200/70 font-medium"
                }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`material-symbols-outlined text-lg ${activeTab === "legalitas" ? "text-emerald-700" : "text-slate-500"}`}
                  style={{ fontVariationSettings: activeTab === "legalitas" ? "'FILL' 1" : "'FILL' 0" }}
                >
                  verified_user
                </span>
                <span>Legalitas SIA / SIPA</span>
              </div>
            </button>
          </div>

          {/* Section: Dukungan & Akun */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Dukungan &amp; Akun</p>
            <button
              type="button"
              onClick={() => {
                alert("Ajukan retur atau komplain: Hubungi cs@groovyrx.com / WA: +62-851-5100-5960");
                onCloseMobile?.();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full transition-all text-left cursor-pointer text-xs font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200/70 border-none bg-transparent"
            >
              <span className="material-symbols-outlined text-lg text-slate-500">headset_mic</span>
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
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full transition-all text-left cursor-pointer border-none text-xs ${activeTab === "pengaturan"
                  ? "bg-emerald-100/70 text-emerald-900 font-bold"
                  : "text-slate-600 hover:bg-slate-100 active:bg-slate-200/70 font-medium"
                }`}
            >
              <span
                className={`material-symbols-outlined text-lg ${activeTab === "pengaturan" ? "text-emerald-700" : "text-slate-500"}`}
                style={{ fontVariationSettings: activeTab === "pengaturan" ? "'FILL' 1" : "'FILL' 0" }}
              >
                settings
              </span>
              <span>Pengaturan Akun</span>
            </button>
          </div>
        </nav>
      </div>

      {/* BOTTOM ACTION BUTTONS (Extended FAB & Tonal Logout) */}
      <div className="p-4 border-t border-slate-100 space-y-2 bg-white sticky bottom-0 shrink-0">
        <button
          type="button"
          onClick={() => {
            setActiveTab("belanja");
            setIsCheckoutOpen(false);
            setViewingDetailOrder(null);
            setIsCartOpen(false);
            onCloseMobile?.();
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs py-3 rounded-2xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all border-none cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Buat Pesanan Baru</span>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full bg-rose-50 hover:bg-rose-100 active:bg-rose-200/70 text-rose-700 font-bold text-xs py-2.5 rounded-2xl flex items-center justify-center gap-2 transition-all border border-rose-200/50 cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          <span>Keluar Akun</span>
        </button>
        <p className="text-center text-[9px] font-semibold text-slate-400 pt-1">
          v2.4.1 • PBF Online System
        </p>
      </div>
    </aside>
  );
}
