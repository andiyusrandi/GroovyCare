"use client";

import { useState, useEffect } from "react";
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
  const [logoUrl, setLogoUrl] = useState("https://res.cloudinary.com/rumahhostcom/image/upload/v1785256133/IMG_20260725_184829_670_odzsui.png");

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
    <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-br from-primary via-primary/95 to-primary/90 border-r border-white/10 z-40 hidden md:flex flex-col py-6">
      <div className="px-6 mb-2 space-y-1">
        <img
          src={logoUrl}
          alt="GroovyRx Logo"
          className="object-contain select-none"
          style={{ width: "145px", filter: "drop-shadow(1px 1px 1px black)" }}
        />
        {/* <p className="text-[9px] text-white/50 uppercase tracking-widest font-extrabold pl-1">
          Enterprise Client
        </p> */}
      </div>

      <nav className="flex-1 px-3 space-y-5 overflow-y-auto hide-scrollbar">
        {/* Section: Utama */}
        <div className="space-y-1">
          <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold px-3 block mb-1.5">
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
              ? "bg-white text-primary shadow-sm"
              : "text-white/75 hover:bg-white/10 hover:text-white"
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
              ? "bg-white text-primary shadow-sm"
              : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: (activeTab === "belanja" && !isCheckoutOpen && !viewingDetailOrder) ? "'FILL' 1" : "'FILL' 0" }}>medication</span>
            <span>Produk</span>
          </button>
        </div>

        {/* Section: Transaksi */}
        <div className="space-y-1">
          <div className="flex items-center justify-between pr-3 mb-1.5">
            <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold px-3 block">
              Transaksi
            </span>
            {(cartItemCount > 0 || pendingPaymentCount > 0 || activeOrdersCount > 0) && (
              <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse" />
            )}
          </div>
          <div className="pl-3 border-l border-white/10 ml-3 space-y-1">
            {/* Keranjang */}
            <button
              onClick={() => {
                setActiveTab("keranjang");
                setIsCartOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${activeTab === "keranjang"
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
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
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
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
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px]">history</span>
                <span>Transaksi</span>
              </div>
              {pendingPaymentCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-red-500 text-white rounded-full min-w-[16px] text-center leading-none">
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
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
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
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px]">track_changes</span>
                <span>Status Pesanan</span>
              </div>
              {activeOrdersCount > 0 && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-blue-500 text-white rounded-full min-w-[16px] text-center leading-none animate-pulse">
                  {activeOrdersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Section: Dokumen */}
        <div className="space-y-1">
          <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold px-3 block mb-1.5">
            Dokumen Legal
          </span>
          <div className="pl-3 border-l border-white/10 ml-3 space-y-1">
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
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
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
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
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
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
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
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">receipt</span>
              <span>Faktur &amp; Pajak</span>
            </button>
          </div>
        </div>

        {/* Section: Legalitas */}
        <div className="space-y-1">
          <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold px-3 block mb-1.5">
            👥 Legalitas
          </span>
          <div className="pl-3 border-l border-white/10 ml-3 space-y-1">
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
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
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
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
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
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
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
                ? "bg-white text-primary font-bold shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
            >
              <span className="material-symbols-outlined text-[16px]">account_circle</span>
              <span>Profil APJ</span>
            </button>
          </div>
        </div>

        {/* Section: Dukungan */}
        <div className="space-y-1">
          <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold px-3 block mb-1.5">
            Dukungan
          </span>
          <button
            onClick={() => alert("Ajukan retur atau komplain: Hubungi cs@groovyrx.com / WA: +62-812-3456-7890")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer text-left outline-none text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
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
              ? "bg-white text-primary shadow-sm"
              : "text-white/75 hover:bg-white/10 hover:text-white"
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
          className="w-full bg-white text-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/90 transition-all active:scale-95 cursor-pointer shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          Pesanan Baru
        </button>
      </div>
    </aside>
  );
}
