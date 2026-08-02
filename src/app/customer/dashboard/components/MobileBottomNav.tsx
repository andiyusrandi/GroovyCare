"use client";

import React from "react";
import { Home, ShoppingBag, ShoppingCart, Truck, User } from "lucide-react";
import { triggerHapticImpact } from "@/lib/mobile-haptics";

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
    triggerHapticImpact();
    setViewingDetailOrder(null);
    if (setIsCheckoutOpen) {
      setIsCheckoutOpen(false);
    }
    setActiveTab(tabName);
  };

  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-[100] bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-[0_10px_32px_rgba(0,0,0,0.10)] px-2 py-2 flex items-center justify-around font-sans select-none">
      {/* 1. Beranda */}
      <button
        type="button"
        onClick={() => handleNavClick("dashboard")}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 border-none bg-transparent cursor-pointer ${activeTab === "dashboard" ? "text-emerald-700" : "text-slate-500 hover:text-slate-800"
          }`}
      >
        <div className={`flex items-center justify-center py-1.5 px-4 rounded-full transition-all duration-200 ${activeTab === "dashboard" ? "bg-emerald-50 text-emerald-700 shadow-2xs" : ""
          }`}>
          <Home className={`w-5 h-5 transition-transform ${activeTab === "dashboard" ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"}`} />
        </div>
        <span className={`text-[10.5px] tracking-tight mt-1 ${activeTab === "dashboard" ? "font-extrabold text-emerald-800" : "font-bold text-slate-600"}`}>
          Beranda
        </span>
      </button>

      {/* 2. Katalog */}
      <button
        type="button"
        onClick={() => handleNavClick("belanja")}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 border-none bg-transparent cursor-pointer ${activeTab === "belanja" ? "text-emerald-700" : "text-slate-500 hover:text-slate-800"
          }`}
      >
        <div className={`flex items-center justify-center py-1.5 px-4 rounded-full transition-all duration-200 ${activeTab === "belanja" ? "bg-emerald-50 text-emerald-700 shadow-2xs" : ""
          }`}>
          <ShoppingBag className={`w-5 h-5 transition-transform ${activeTab === "belanja" ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"}`} />
        </div>
        <span className={`text-[10.5px] tracking-tight mt-1 ${activeTab === "belanja" ? "font-extrabold text-emerald-800" : "font-bold text-slate-600"}`}>
          Produk
        </span>
      </button>

      {/* 3. Central Minimal FAB: Keranjang SP */}
      <div className="relative -top-4 shrink-0 px-1">
        <button
          type="button"
          onClick={() => handleNavClick("keranjang")}
          className={`w-12 h-12 rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/30 flex items-center justify-center active:scale-90 transition-transform relative border-2 border-white cursor-pointer ${activeTab === "keranjang" ? "ring-2 ring-emerald-700 ring-offset-2 scale-105" : ""
            }`}
        >
          <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9.5px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
              {cartItemCount > 9 ? "9+" : cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* 4. Status SP / Order */}
      <button
        type="button"
        onClick={() => handleNavClick("status")}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 border-none bg-transparent cursor-pointer ${activeTab === "status" || activeTab === "riwayat" ? "text-emerald-700" : "text-slate-500 hover:text-slate-800"
          }`}
      >
        <div className={`relative flex items-center justify-center py-1.5 px-4 rounded-full transition-all duration-200 ${activeTab === "status" || activeTab === "riwayat" ? "bg-emerald-50 text-emerald-700 shadow-2xs" : ""
          }`}>
          <Truck className={`w-5 h-5 transition-transform ${activeTab === "status" || activeTab === "riwayat" ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"}`} />
          {activeOrdersCount > 0 && (
            <span className="absolute top-1 right-2.5 w-2 h-2 bg-amber-500 rounded-full border border-white"></span>
          )}
        </div>
        <span className={`text-[10.5px] tracking-tight mt-1 ${activeTab === "status" || activeTab === "riwayat" ? "font-extrabold text-emerald-800" : "font-bold text-slate-600"}`}>
          Riwayat
        </span>
      </button>

      {/* 5. Profil */}
      <button
        type="button"
        onClick={() => handleNavClick("pengaturan")}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 border-none bg-transparent cursor-pointer ${activeTab === "pengaturan" || activeTab === "legalitas" ? "text-emerald-700" : "text-slate-500 hover:text-slate-800"
          }`}
      >
        <div className={`flex items-center justify-center py-1.5 px-4 rounded-full transition-all duration-200 ${activeTab === "legalitas" || activeTab === "pengaturan" ? "bg-emerald-50 text-emerald-700 shadow-2xs" : ""
          }`}>
          <User className={`w-5 h-5 transition-transform ${activeTab === "legalitas" || activeTab === "pengaturan" ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"}`} />
        </div>
        <span className={`text-[10.5px] tracking-tight mt-1 ${activeTab === "legalitas" || activeTab === "pengaturan" ? "font-extrabold text-emerald-800" : "font-bold text-slate-600"}`}>
          Account
        </span>
      </button>
    </nav>
  );
}
