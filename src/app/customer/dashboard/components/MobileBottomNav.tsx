"use client";

import React from "react";

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  cartItemCount: number;
  activeOrdersCount: number;
  setViewingDetailOrder: (order: any) => void;
  setIsCheckoutOpen?: (open: boolean) => void;
}

export default function MobileBottomNav({
  activeTab,
  setActiveTab,
  cartItemCount,
  activeOrdersCount,
  setViewingDetailOrder,
  setIsCheckoutOpen,
}: MobileBottomNavProps) {
  const handleNavClick = (tabName: string) => {
    setViewingDetailOrder(null);
    if (setIsCheckoutOpen) {
      setIsCheckoutOpen(false);
    }
    setActiveTab(tabName);
  };

  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] px-2 py-2 flex items-center justify-between font-sans select-none">
      {/* 1. Beranda */}
      <button
        type="button"
        onClick={() => handleNavClick("dashboard")}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 border-none bg-transparent cursor-pointer ${activeTab === "dashboard" ? "text-primary font-extrabold" : "text-slate-400 hover:text-slate-600"
          }`}
      >
        <div className={`flex items-center justify-center p-1 rounded-2xl transition-all ${activeTab === "dashboard" ? "bg-primary/10 px-3" : ""}`}>
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: activeTab === "dashboard" ? "'FILL' 1" : "'FILL' 0" }}
          >
            home
          </span>
        </div>
        <span className={`text-[10px] tracking-tight mt-0.5 ${activeTab === "dashboard" ? "font-black text-primary" : "font-semibold"}`}>
          Beranda
        </span>
      </button>

      {/* 2. Katalog */}
      <button
        type="button"
        onClick={() => handleNavClick("belanja")}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 border-none bg-transparent cursor-pointer ${activeTab === "belanja" ? "text-primary font-extrabold" : "text-slate-400 hover:text-slate-600"
          }`}
      >
        <div className={`flex items-center justify-center p-1 rounded-2xl transition-all ${activeTab === "belanja" ? "bg-primary/10 px-3" : ""}`}>
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: activeTab === "belanja" ? "'FILL' 1" : "'FILL' 0" }}
          >
            storefront
          </span>
        </div>
        <span className={`text-[10px] tracking-tight mt-0.5 ${activeTab === "belanja" ? "font-black text-primary" : "font-semibold"}`}>
          Katalog
        </span>
      </button>

      {/* 3. Central FAB: Keranjang SP */}
      <div className="relative -top-5 shrink-0 px-1">
        <button
          type="button"
          onClick={() => handleNavClick("keranjang")}
          className={`w-13 h-13 rounded-full bg-gradient-to-tr from-primary to-emerald-600 text-white shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform relative border-4 border-slate-100/90 cursor-pointer ${activeTab === "keranjang" ? "ring-2 ring-primary ring-offset-2" : ""
            }`}
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            shopping_cart
          </span>
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse">
              {cartItemCount > 9 ? "9+" : cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* 4. Status SP / Order */}
      <button
        type="button"
        onClick={() => handleNavClick("status")}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 border-none bg-transparent cursor-pointer ${activeTab === "status" || activeTab === "riwayat" ? "text-primary font-extrabold" : "text-slate-400 hover:text-slate-600"
          }`}
      >
        <div className={`relative flex items-center justify-center p-1 rounded-2xl transition-all ${activeTab === "status" || activeTab === "riwayat" ? "bg-primary/10 px-3" : ""}`}>
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: activeTab === "status" || activeTab === "riwayat" ? "'FILL' 1" : "'FILL' 0" }}
          >
            local_shipping
          </span>
          {activeOrdersCount > 0 && (
            <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white"></span>
          )}
        </div>
        <span className={`text-[10px] tracking-tight mt-0.5 ${activeTab === "status" || activeTab === "riwayat" ? "font-black text-primary" : "font-semibold"}`}>
          Order SP
        </span>
      </button>

      {/* 5. Profil */}
      <button
        type="button"
        onClick={() => handleNavClick("pengaturan")}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-95 border-none bg-transparent cursor-pointer ${activeTab === "pengaturan" || activeTab === "legalitas" ? "text-primary font-extrabold" : "text-slate-400 hover:text-slate-600"
          }`}
      >
        <div className={`flex items-center justify-center p-1 rounded-2xl transition-all ${activeTab === "legalitas" || activeTab === "pengaturan" ? "bg-primary/10 px-3" : ""}`}>
          <span
            className="material-symbols-outlined text-[22px]"
            style={{ fontVariationSettings: activeTab === "legalitas" || activeTab === "pengaturan" ? "'FILL' 1" : "'FILL' 0" }}
          >
            person
          </span>
        </div>
        <span className={`text-[10px] tracking-tight mt-0.5 ${activeTab === "legalitas" || activeTab === "pengaturan" ? "font-black text-primary" : "font-semibold"}`}>
          Profil
        </span>
      </button>
    </nav>
  );
}
