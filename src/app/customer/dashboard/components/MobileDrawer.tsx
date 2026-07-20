"use client";

import React, { useEffect, useState } from "react";
import { 
  LogOut, 
  X, 
  Plus, 
  ChevronDown, 
  ShoppingBag, 
  FolderClosed, 
  Shield, 
  HelpCircle, 
  Settings 
} from "lucide-react";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  institution: any;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  docSubTab: "sp" | "esign" | "do" | "faktur";
  setDocSubTab: (tab: "sp" | "esign" | "do" | "faktur") => void;
  legalSubTab: "instansi" | "sipa" | "sia" | "profile";
  setLegalSubTab: (tab: "instansi" | "sipa" | "sia" | "profile") => void;
  cartItemCount: number;
  activeOrdersCount: number;
  pendingPaymentCount: number;
  esignPendingCount: number;
  handleLogout: () => void;
  setViewingDetailOrder: (order: any) => void;
  setViewingReceiptReport: (report: any) => void;
  setIsCheckoutOpen?: (open: boolean) => void;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  user,
  institution,
  activeTab,
  setActiveTab,
  docSubTab,
  setDocSubTab,
  legalSubTab,
  setLegalSubTab,
  cartItemCount,
  activeOrdersCount,
  pendingPaymentCount,
  esignPendingCount,
  handleLogout,
  setViewingDetailOrder,
  setViewingReceiptReport,
  setIsCheckoutOpen,
}: MobileDrawerProps) {
  // Collapsible Accordion States
  const [isTransaksiOpen, setIsTransaksiOpen] = useState(false);
  const [isDokumenOpen, setIsDokumenOpen] = useState(false);
  const [isLegalitasOpen, setIsLegalitasOpen] = useState(false);

  // Auto-expand active groups on mount or activeTab changes
  useEffect(() => {
    if (["keranjang", "riwayat", "tagihan", "status"].includes(activeTab)) {
      setIsTransaksiOpen(true);
    }
    if (activeTab === "dokumen") {
      setIsDokumenOpen(true);
    }
    if (activeTab === "legalitas") {
      setIsLegalitasOpen(true);
    }
  }, [activeTab]);

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleNavClick = (tab: any, docSub?: any, legalSub?: any) => {
    setActiveTab(tab);
    setViewingDetailOrder(null);
    setViewingReceiptReport(null);
    if (setIsCheckoutOpen) {
      setIsCheckoutOpen(false);
    }
    if (docSub) {
      setDocSubTab(docSub);
    }
    if (legalSub) {
      setLegalSubTab(legalSub);
    }
    onClose();
  };

  const remainingLimit = institution.creditLimit - institution.currentDebt;

  return (
    <div 
      className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop overlay */}
      <div 
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div 
        className={`absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Upper container */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {/* Header */}
          <div className="p-5 border-b border-outline-variant/15 flex items-center justify-between">
            <div className="space-y-0.5">
              <img
                src="https://www.groovyrx.com/store/1/logogroovyrx.png"
                alt="GroovyRx Logo"
                className="h-7 w-auto object-contain select-none"
              />
              <p className="text-[10px] text-[#006c49] uppercase tracking-widest font-black">
                Enterprise Client
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 active:scale-90 transition-transform rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center text-on-surface-variant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pharmacist & Pharmacy Info Card */}
          <div className="p-5 bg-slate-50/50 border-b border-outline-variant/10">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-primary-container p-0.5 overflow-hidden bg-white">
                  <img 
                    className="w-full h-full object-cover rounded-full" 
                    alt="Apoteker APJ" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKMLtg-EStyEeW_Tt07pjCSBaoUSkb3JOC4OD68TI_bXGGAxhPGt25AScLEKA-BkiTAW9e8TIcZQ_405QyAW4U_ClfvDML5-Q2Zby3mCwwXM3z2KKedrdxzSNCNSanIzwVoflnDNZnpkrG7XwaiAdl50nq2grA5CAda2w1gJ8MhaqDADOprRIOshIskDrLTQIbJVy_j9TgPAogaIlshohsaYSfR8L0eLjqNaZO_ZGJPZd0rt6_CkcuKAFcG8rdfAlqjIBgSVCK-n4"
                  />
                </div>
                <div className="absolute bottom-0 right-0 bg-[#006c49] text-white p-0.5 rounded-full border border-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-black text-sm text-on-surface truncate">{user.name}</h3>
                <p className="text-on-surface-variant text-[11px] font-bold mt-0.5 uppercase tracking-wide">APJ Apotek</p>
                <div className="flex items-center gap-1 mt-1 text-primary font-bold text-xs truncate">
                  <span className="material-symbols-outlined text-[14px]">medical_services</span>
                  <span className="truncate text-xs">{institution.name}</span>
                </div>
              </div>
            </div>

            {/* Quick Credit Info */}
            <div className="mt-4 bg-white border border-outline-variant/30 rounded-xl p-3 flex justify-between items-center text-xs font-bold shadow-xs">
              <div>
                <span className="text-on-surface-variant text-[10px] uppercase tracking-wider block">ID Pelanggan</span>
                <span className="text-foreground font-black block mt-0.5 text-xs">{institution.code || "PBF-882910"}</span>
              </div>
              <div className="text-right">
                <span className="text-on-surface-variant text-[10px] uppercase tracking-wider block">Sisa Kredit</span>
                <span className="text-primary font-black block mt-0.5 text-xs">Rp {remainingLimit.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-4 font-sans">
            
            {/* Group: Transaksi (Collapsible Card) */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-2 shadow-xs space-y-1">
              <button
                type="button"
                onClick={() => setIsTransaksiOpen(!isTransaksiOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left border-none bg-transparent cursor-pointer rounded-xl hover:bg-slate-100/50 transition-all"
              >
                <div className="flex items-center gap-2.5 text-on-surface">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <span className="text-[11px] uppercase tracking-wider text-outline font-extrabold">Transaksi</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-outline transition-transform duration-200 ${isTransaksiOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isTransaksiOpen && (
                <div className="mt-1 pl-2 border-l-2 border-primary/20 ml-4 space-y-1 animate-fadeIn">
                  <button 
                    onClick={() => handleNavClick("keranjang")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold ${
                      activeTab === "keranjang" 
                        ? "bg-primary/10 text-primary" 
                        : "text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                      <span>Keranjang</span>
                    </div>
                    {cartItemCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black bg-error text-white rounded-full min-w-[16px] text-center leading-none">
                        {cartItemCount}
                      </span>
                    )}
                  </button>

                  <button 
                    onClick={() => alert("Fitur Draft Pesanan akan segera tersedia.")}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-bold text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs cursor-pointer border-none bg-transparent text-left"
                  >
                    <span className="material-symbols-outlined text-[16px]">drafts</span>
                    <span>Draft Pesanan</span>
                  </button>

                  <button 
                    onClick={() => handleNavClick("riwayat")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold ${
                      activeTab === "riwayat" 
                        ? "bg-primary/10 text-primary" 
                        : "text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">history</span>
                      <span>Transaksi</span>
                    </div>
                    {pendingPaymentCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black bg-error text-white rounded-full min-w-[16px] text-center leading-none">
                        {pendingPaymentCount}
                      </span>
                    )}
                  </button>

                  <button 
                    onClick={() => handleNavClick("tagihan")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold ${
                      activeTab === "tagihan" 
                        ? "bg-primary/10 text-primary" 
                        : "text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">payments</span>
                      <span>Kredit &amp; Keuangan</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleNavClick("status")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold ${
                      activeTab === "status" 
                        ? "bg-primary/10 text-primary" 
                        : "text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">track_changes</span>
                      <span>Status Pesanan</span>
                    </div>
                    {activeOrdersCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black bg-blue-500 text-white rounded-full min-w-[16px] text-center leading-none animate-pulse">
                        {activeOrdersCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Group: Dokumen Legal (Collapsible Card) */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-2 shadow-xs space-y-1">
              <button
                type="button"
                onClick={() => setIsDokumenOpen(!isDokumenOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left border-none bg-transparent cursor-pointer rounded-xl hover:bg-slate-100/50 transition-all"
              >
                <div className="flex items-center gap-2.5 text-on-surface">
                  <FolderClosed className="w-4 h-4 text-primary" />
                  <span className="text-[11px] uppercase tracking-wider text-outline font-extrabold">Dokumen Legal</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-outline transition-transform duration-200 ${isDokumenOpen ? "rotate-180" : ""}`} />
              </button>

              {isDokumenOpen && (
                <div className="mt-1 pl-2 border-l-2 border-primary/20 ml-4 space-y-1 animate-fadeIn">
                  <button 
                    onClick={() => handleNavClick("dokumen", "sp")}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold text-left ${
                      activeTab === "dokumen" && docSubTab === "sp" 
                        ? "bg-primary/10 text-primary" 
                        : "text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    <span>Surat Pesanan</span>
                  </button>

                  <button 
                    onClick={() => handleNavClick("dokumen", "esign")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold ${
                      activeTab === "dokumen" && docSubTab === "esign" 
                        ? "bg-primary/10 text-primary" 
                        : "text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">edit_document</span>
                      <span>e-Sign Pending</span>
                    </div>
                    {esignPendingCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-error text-white rounded-full min-w-[16px] text-center leading-none animate-pulse">
                        {esignPendingCount}
                      </span>
                    )}
                  </button>

                  <button 
                    onClick={() => handleNavClick("dokumen", "do")}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold text-left ${
                      activeTab === "dokumen" && docSubTab === "do" 
                        ? "bg-primary/10 text-primary" 
                        : "text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                    <span>Delivery Order</span>
                  </button>

                  <button 
                    onClick={() => handleNavClick("dokumen", "faktur")}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold text-left ${
                      activeTab === "dokumen" && docSubTab === "faktur" 
                        ? "bg-primary/10 text-primary" 
                        : "text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">receipt</span>
                    <span>Faktur &amp; Pajak</span>
                  </button>
                </div>
              )}
            </div>

            {/* Group: Legalitas (Collapsible Card) */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-2 shadow-xs space-y-1">
              <button
                type="button"
                onClick={() => setIsLegalitasOpen(!isLegalitasOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left border-none bg-transparent cursor-pointer rounded-xl hover:bg-slate-100/50 transition-all"
              >
                <div className="flex items-center gap-2.5 text-on-surface">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-[11px] uppercase tracking-wider text-outline font-extrabold">👥 Legalitas</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-outline transition-transform duration-200 ${isLegalitasOpen ? "rotate-180" : ""}`} />
              </button>

              {isLegalitasOpen && (
                <div className="mt-1 pl-2 border-l-2 border-primary/20 ml-4 space-y-1 animate-fadeIn">
                  <button 
                    onClick={() => handleNavClick("legalitas", null, "instansi")}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold text-left ${
                      activeTab === "legalitas" && legalSubTab === "instansi" 
                        ? "bg-primary/10 text-primary" 
                        : "text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">domain</span>
                    <span>Data Instansi</span>
                  </button>

                  <button 
                    onClick={() => handleNavClick("legalitas", null, "sia")}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold text-left ${
                      activeTab === "legalitas" && legalSubTab === "sia" 
                        ? "bg-primary/10 text-primary" 
                        : "text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">badge</span>
                    <span>SIA</span>
                  </button>

                  <button 
                    onClick={() => handleNavClick("legalitas", null, "sipa")}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold text-left ${
                      activeTab === "legalitas" && legalSubTab === "sipa" 
                        ? "bg-primary/10 text-primary" 
                        : "text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">health_and_safety</span>
                    <span>SIPA</span>
                  </button>

                  <button 
                    onClick={() => handleNavClick("legalitas", null, "profile")}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold text-left ${
                      activeTab === "legalitas" && legalSubTab === "profile" 
                        ? "bg-primary/10 text-primary" 
                        : "text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">account_circle</span>
                    <span>Profil APJ</span>
                  </button>
                </div>
              )}
            </div>

            {/* Group: Dukungan & Akun Card */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-2 shadow-xs space-y-1">
              <div className="flex items-center gap-2.5 px-3 py-2 text-on-surface border-none bg-transparent">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span className="text-[11px] uppercase tracking-wider text-outline font-extrabold">Dukungan &amp; Akun</span>
              </div>
              
              <div className="mt-1 space-y-1">
                <button 
                  onClick={() => { alert("Ajukan retur atau komplain: Hubungi cs@groovyrx.com / WA: +62-812-3456-7890"); onClose(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs text-left"
                >
                  <span className="material-symbols-outlined text-[18px]">support_agent</span>
                  <span>Retur &amp; Komplain</span>
                </button>

                <button 
                  onClick={() => handleNavClick("pengaturan")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all border-none bg-transparent cursor-pointer text-xs font-bold text-left ${
                    activeTab === "pengaturan" 
                      ? "bg-primary/10 text-primary" 
                      : "text-on-surface-variant hover:bg-white hover:text-foreground hover:shadow-xs"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  <span>Pengaturan Akun</span>
                </button>
              </div>
            </div>

          </nav>
        </div>

        {/* Footer Container */}
        <div className="p-4 border-t border-outline-variant/15 bg-slate-50 space-y-3.5">
          <button
            onClick={() => {
              handleNavClick("belanja");
            }}
            className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 cursor-pointer shadow-sm border-none"
          >
            <Plus className="w-3.5 h-3.5" />
            Pesanan Baru
          </button>

          <button 
            onClick={handleLogout}
            className="w-full bg-error-container/20 hover:bg-error-container/30 text-error font-heading font-black text-xs py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Keluar Akun
          </button>
          <p className="text-center text-on-surface-variant/50 text-[9px] font-bold uppercase tracking-wider">
            Versi Aplikasi 2.4.1 • PBF Online
          </p>
        </div>
      </div>
    </div>
  );
}
