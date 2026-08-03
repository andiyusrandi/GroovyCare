"use client";

import { useState, useEffect } from "react";
import { LogOut, Plus } from "lucide-react";

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
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200/80 shadow-xs z-40 hidden md:flex flex-col justify-between py-6">
      {/* Top Brand Logo */}
      <div className="px-6 mb-4">
        <img
          src={logoUrl}
          alt="GroovyRx Logo"
          className="object-contain select-none h-8 w-auto"
        />
      </div>

      {/* Navigation List (Clean Without Left Border Clutter) */}
      <nav className="flex-1 px-3 space-y-5 overflow-y-auto scrollbar-none">
        
        {/* GRUP 1: UTAMA */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold px-3 block mb-1">
            Utama
          </span>
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setIsCheckoutOpen(false);
              setViewingDetailOrder(null);
              setIsCartOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer text-left outline-none text-xs font-bold ${
              activeTab === "dashboard" && !isCheckoutOpen && !viewingDetailOrder
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
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
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer text-left outline-none text-xs font-bold ${
              activeTab === "belanja" && !isCheckoutOpen && !viewingDetailOrder
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: (activeTab === "belanja" && !isCheckoutOpen && !viewingDetailOrder) ? "'FILL' 1" : "'FILL' 0" }}>medication</span>
            <span>Produk</span>
          </button>
        </div>

        {/* GRUP 2: TRANSAKSI */}
        <div className="space-y-1">
          <div className="flex items-center justify-between pr-3 mb-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold px-3 block">
              Transaksi
            </span>
            {(cartItemCount > 0 || pendingPaymentCount > 0 || activeOrdersCount > 0) && (
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
            )}
          </div>
          
          <button
            onClick={() => {
              setActiveTab("keranjang");
              setIsCartOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
              activeTab === "keranjang"
                ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
              <span>Keranjang</span>
            </div>
            {cartItemCount > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-rose-600 text-white rounded-full min-w-[16px] text-center leading-none">
                {cartItemCount}
              </span>
            )}
          </button>

          <button
            onClick={() => alert("Fitur Draft Pesanan akan segera tersedia.")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-emerald-600 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">drafts</span>
              <span>Draft Pesanan</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab("riwayat");
              setIsCheckoutOpen(false);
              setViewingDetailOrder(null);
              setIsCartOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
              activeTab === "riwayat" && !viewingDetailOrder
                ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span>Transaksi</span>
            </div>
            {pendingPaymentCount > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-rose-600 text-white rounded-full min-w-[16px] text-center leading-none">
                {pendingPaymentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("tagihan");
              setIsCheckoutOpen(false);
              setViewingDetailOrder(null);
              setIsCartOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
              activeTab === "tagihan" && !viewingDetailOrder
                ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">payments</span>
              <span>Kredit &amp; Keuangan</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab("status");
              setIsCheckoutOpen(false);
              setViewingDetailOrder(null);
              setIsCartOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
              activeTab === "status" && !viewingDetailOrder
                ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">track_changes</span>
              <span>Status Pesanan</span>
            </div>
            {activeOrdersCount > 0 && (
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-600 text-white rounded-full min-w-[16px] text-center leading-none animate-pulse">
                {activeOrdersCount}
              </span>
            )}
          </button>
        </div>

        {/* GRUP 3: DOKUMEN & LEGALITAS (RINGKAS & TERPADU) */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold px-3 block mb-1">
            Dokumen &amp; Legalitas
          </span>

          <button
            onClick={() => {
              setActiveTab("dokumen");
              setDocSubTab("sp");
              setIsCheckoutOpen(false);
              setViewingDetailOrder(null);
              setIsCartOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
              activeTab === "dokumen" && docSubTab === "sp"
                ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">description</span>
            <span>Surat Pesanan (SP)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("dokumen");
              setDocSubTab("esign");
              setIsCheckoutOpen(false);
              setViewingDetailOrder(null);
              setIsCartOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
              activeTab === "dokumen" && docSubTab === "esign"
                ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px]">edit_document</span>
              <span>e-Sign Pending</span>
            </div>
            {esignPendingCount > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {esignPendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("legalitas");
              setLegalSubTab("sia");
              setIsCheckoutOpen(false);
              setViewingDetailOrder(null);
              setIsCartOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
              activeTab === "legalitas"
                ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">domain</span>
            <span>Izin SIA &amp; SIPA</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("alamat");
              setIsCheckoutOpen(false);
              setViewingDetailOrder(null);
              setIsCartOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
              activeTab === "alamat"
                ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">location_on</span>
            <span>Buku Alamat</span>
          </button>
        </div>

        {/* GRUP 4: DUKUNGAN */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold px-3 block mb-1">
            Dukungan
          </span>
          <button
            onClick={() => alert("Ajukan retur atau komplain: Hubungi cs@groovyrx.com / WA: +62-812-3456-7890")}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-emerald-600 cursor-pointer"
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
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
              activeTab === "pengaturan" && !isCheckoutOpen && !viewingDetailOrder
                ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>Pengaturan</span>
          </button>
        </div>
      </nav>

      {/* Bottom Action Area (Dipisah Rapi dengan Border Top) */}
      <div className="px-4 pt-4 border-t border-slate-100 mt-auto">
        <button
          onClick={() => {
            setActiveTab("belanja");
            setIsCheckoutOpen(false);
            setViewingDetailOrder(null);
            setIsCartOpen(false);
          }}
          className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95 shadow-xs shadow-emerald-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Pesanan Baru
        </button>
      </div>
    </aside>
  );
}
