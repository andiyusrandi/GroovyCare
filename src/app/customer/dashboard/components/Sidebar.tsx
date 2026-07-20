"use client";

import { LogOut, Plus } from "lucide-react";

interface SidebarProps {
  activeTab: "dashboard" | "belanja" | "status" | "riwayat" | "tagihan" | "dokumen" | "legalitas" | "pengaturan" | "keranjang";
  setActiveTab: (tab: "dashboard" | "belanja" | "status" | "riwayat" | "tagihan" | "dokumen" | "legalitas" | "pengaturan" | "keranjang") => void;
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
}: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-outline-variant/20 z-40 hidden md:flex flex-col py-6">
      <div className="px-6 mb-8 space-y-1">
        <img
          src="https://www.groovyrx.com/store/1/logogroovyrx.png"
          alt="GroovyRx Logo"
          className="h-8 w-auto object-contain select-none"
        />
        <p className="text-[9px] text-outline-variant uppercase tracking-widest font-extrabold pl-1">
          Enterprise Client
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-5 overflow-y-auto hide-scrollbar">
        {/* Section: Utama */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-widest text-outline font-bold px-3 block mb-1.5 opacity-65">
            Utama
          </span>
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setIsCheckoutOpen(false);
              setViewingDetailOrder(null);
              setIsCartOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer text-left outline-none text-xs font-bold ${activeTab === "dashboard" && !isCheckoutOpen && !viewingDetailOrder
              ? "bg-slate-100 text-foreground"
              : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
              }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: (activeTab === "dashboard" && !isCheckoutOpen && !viewingDetailOrder) ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab("belanja");
              setIsCheckoutOpen(false);
              setViewingDetailOrder(null);
              setIsCartOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer text-left outline-none text-xs font-bold ${activeTab === "belanja" && !isCheckoutOpen && !viewingDetailOrder
              ? "bg-slate-100 text-foreground"
              : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
              }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: (activeTab === "belanja" && !isCheckoutOpen && !viewingDetailOrder) ? "'FILL' 1" : "'FILL' 0" }}>medication</span>
            <span>Produk</span>
          </button>
        </div>

        {/* Section: Transaksi */}
        <div className="space-y-1">
          <div className="flex items-center justify-between pr-3 mb-1.5">
            <span className="text-[9px] uppercase tracking-widest text-outline font-bold px-3 block opacity-65">
              Transaksi
            </span>
            {(cartItemCount > 0 || pendingPaymentCount > 0 || activeOrdersCount > 0) && (
              <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse" />
            )}
          </div>
          <div className="pl-3 border-l border-outline-variant/30 ml-3 space-y-1">
            {/* Keranjang */}
            <button
              onClick={() => {
                setActiveTab("keranjang");
                setIsCartOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all text-xs font-semibold ${
                activeTab === "keranjang"
                  ? "bg-primary-container/10 text-primary font-bold"
                  : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
              } cursor-pointer`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                <span>Keranjang</span>
              </div>
              {cartItemCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-error text-white rounded-full min-w-[16px] text-center leading-none">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Draft Pesanan */}
            <button
              onClick={() => alert("Fitur Draft Pesanan akan segera tersedia.")}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all text-xs font-semibold text-on-surface-variant hover:bg-slate-50 hover:text-foreground cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px]">drafts</span>
                <span>Draft Pesanan</span>
              </div>
            </button>

            {/* Transaksi Pembelian */}
            <button
              onClick={() => {
                setActiveTab("riwayat");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${activeTab === "riwayat" && !viewingDetailOrder
                ? "bg-slate-100 text-foreground font-bold"
                : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px]">history</span>
                <span>Transaksi</span>
              </div>
              {pendingPaymentCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-red-100 text-red-700 border border-red-200 rounded-full min-w-[16px] text-center leading-none">
                  {pendingPaymentCount}
                </span>
              )}
            </button>

            {/* Fasilitas Kredit & Keuangan */}
            <button
              onClick={() => {
                setActiveTab("tagihan");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${activeTab === "tagihan" && !viewingDetailOrder
                ? "bg-slate-100 text-foreground font-bold"
                : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px]">payments</span>
                <span>Kredit &amp; Keuangan</span>
              </div>
            </button>

            {/* Status Pesanan */}
            <button
              onClick={() => {
                setActiveTab("status");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${activeTab === "status" && !viewingDetailOrder
                ? "bg-slate-100 text-foreground font-bold"
                : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px]">track_changes</span>
                <span>Status Pesanan</span>
              </div>
              {activeOrdersCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 rounded-full min-w-[16px] text-center leading-none animate-pulse">
                  {activeOrdersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Section: Dokumen */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-widest text-outline font-bold px-3 block mb-1.5 opacity-65">
            Dokumen Legal
          </span>
          <div className="pl-3 border-l border-outline-variant/30 ml-3 space-y-1">
            {/* Surat Pesanan */}
            <button
              onClick={() => {
                setActiveTab("dokumen");
                setDocSubTab("sp");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${activeTab === "dokumen" && docSubTab === "sp"
                ? "bg-slate-100 text-foreground font-bold"
                : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">description</span>
              <span>Surat Pesanan</span>
            </button>

            {/* e-Sign */}
            <button
              onClick={() => {
                setActiveTab("dokumen");
                setDocSubTab("esign");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${activeTab === "dokumen" && docSubTab === "esign"
                ? "bg-slate-100 text-foreground font-bold"
                : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px]">edit_document</span>
                <span>e-Sign Pending</span>
              </div>
              {esignPendingCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-error text-white rounded-full min-w-[16px] text-center leading-none animate-pulse">
                  {esignPendingCount}
                </span>
              )}
            </button>

            {/* Delivery Order */}
            <button
              onClick={() => {
                setActiveTab("dokumen");
                setDocSubTab("do");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${activeTab === "dokumen" && docSubTab === "do"
                ? "bg-slate-100 text-foreground font-bold"
                : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">local_shipping</span>
              <span>Delivery Order</span>
            </button>

            {/* Faktur */}
            <button
              onClick={() => {
                setActiveTab("dokumen");
                setDocSubTab("faktur");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${activeTab === "dokumen" && docSubTab === "faktur"
                ? "bg-slate-100 text-foreground font-bold"
                : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">receipt</span>
              <span>Faktur &amp; Pajak</span>
            </button>
          </div>
        </div>

        {/* Section: Legalitas */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-widest text-outline font-bold px-3 block mb-1.5 opacity-65">
            👥 Legalitas
          </span>
          <div className="pl-3 border-l border-outline-variant/30 ml-3 space-y-1">
            {/* Data Instansi */}
            <button
              onClick={() => {
                setActiveTab("legalitas");
                setLegalSubTab("instansi");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${activeTab === "legalitas" && legalSubTab === "instansi"
                ? "bg-slate-100 text-foreground font-bold"
                : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">domain</span>
              <span>Data Instansi</span>
            </button>

            {/* SIA */}
            <button
              onClick={() => {
                setActiveTab("legalitas");
                setLegalSubTab("sia");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${activeTab === "legalitas" && legalSubTab === "sia"
                ? "bg-slate-100 text-foreground font-bold"
                : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span>SIA</span>
            </button>

            {/* SIPA */}
            <button
              onClick={() => {
                setActiveTab("legalitas");
                setLegalSubTab("sipa");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${activeTab === "legalitas" && legalSubTab === "sipa"
                ? "bg-slate-100 text-foreground font-bold"
                : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">health_and_safety</span>
              <span>SIPA</span>
            </button>

            {/* Profil APJ */}
            <button
              onClick={() => {
                setActiveTab("legalitas");
                setLegalSubTab("profile");
                setIsCheckoutOpen(false);
                setViewingDetailOrder(null);
                setIsCartOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${activeTab === "legalitas" && legalSubTab === "profile"
                ? "bg-slate-100 text-foreground font-bold"
                : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">account_circle</span>
              <span>Profil APJ</span>
            </button>
          </div>
        </div>

        {/* Section: Dukungan */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase tracking-widest text-outline font-bold px-3 block mb-1.5 opacity-65">
            Dukungan
          </span>
          <button
            onClick={() => alert("Ajukan retur atau komplain: Hubungi cs@groovyrx.com / WA: +62-812-3456-7890")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer text-left outline-none text-xs font-bold text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
          >
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            <span>Retur &amp; Komplain</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("pengaturan");
              setIsCheckoutOpen(false);
              setViewingDetailOrder(null);
              setIsCartOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer text-left outline-none text-xs font-bold ${activeTab === "pengaturan" && !isCheckoutOpen && !viewingDetailOrder
              ? "bg-slate-100 text-foreground"
              : "text-on-surface-variant hover:bg-slate-50 hover:text-foreground"
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>Pengaturan</span>
          </button>
        </div>
      </nav>

      <div className="mt-auto px-4 space-y-4">
        <button
          onClick={() => {
            setActiveTab("belanja");
            setIsCheckoutOpen(false);
            setViewingDetailOrder(null);
            setIsCartOpen(false);
          }}
          className="w-full bg-slate-900 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Pesanan Baru
        </button>
      </div>
    </aside>
  );
}
