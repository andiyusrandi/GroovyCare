"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Bell, History, ArrowRight, UserCheck, BookOpen } from "lucide-react";

interface AdminTopBarProps {
  adminName: string;
  pendingPartnersCount: number;
  setActiveTab: (tab: "overview" | "kemitraan" | "obat" | "cdob" | "promo" | "logistik" | "shipping" | "pembayaran" | "riwayat" | "pelaporan" | "superadmin") => void;
}

export default function AdminTopBar({ adminName, pendingPartnersCount, setActiveTab }: AdminTopBarProps) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-surface/70 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm flex justify-between items-center px-6 z-40">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
          <input
            className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-primary/20 placeholder:text-outline/60 outline-none text-foreground"
            placeholder="Cari SKU, Partner, atau No. Invoice..."
            type="text"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 relative">
        {/* Link Panduan & Dokumentasi Admin */}
        <Link
          href="/admin/docs"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition shadow-2xs"
          title="Buka Halaman Panduan & Dokumentasi Fitur Admin PBF"
        >
          <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="hidden md:inline">Panduan &amp; Dok</span>
        </Link>
        {/* Notification Bell Button */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer animate-none"
          >
            <Bell className="w-4.5 h-4.5" />
            {pendingPartnersCount > 0 && (
              <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-extrabold animate-bounce">
                {pendingPartnersCount}
              </span>
            )}
          </button>

          {/* Premium Notification Popover */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-outline-variant/30 rounded-2xl shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="px-4 pb-2 border-b border-outline-variant/20 flex justify-between items-center">
                <span className="text-xs font-bold text-foreground">Notifikasi Sistem</span>
                {pendingPartnersCount > 0 && (
                  <span className="bg-red-50 text-red-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {pendingPartnersCount} Baru
                  </span>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto pt-2">
                {pendingPartnersCount > 0 ? (
                  <button
                    onClick={() => {
                      setActiveTab("kemitraan");
                      setIsNotifOpen(false);
                    }}
                    className="w-full px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 text-left items-start cursor-pointer border-none bg-transparent"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">Verifikasi Mitra Tertunda</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Ada {pendingPartnersCount} pendaftaran mitra baru yang menunggu persetujuan dan verifikasi legalitas Anda.
                      </p>
                      <span className="text-[10px] text-primary font-bold flex items-center gap-1 mt-1.5 hover:underline">
                        Periksa Kemitraan <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="px-4 py-6 text-center text-outline text-xs">
                    Tidak ada notifikasi sistem baru.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => alert("Menampilkan riwayat aktivitas sistem log.")}
          className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer animate-none"
        >
          <History className="w-4.5 h-4.5" />
        </button>

        <div className="h-8 w-px bg-outline-variant/30 mx-2"></div>

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-extrabold text-foreground leading-none">{adminName}</p>
            <p className="text-[10px] text-outline font-bold mt-1">Operation Head</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-primary-container overflow-hidden bg-emerald-100 flex items-center justify-center text-primary font-bold">
            <img
              className="w-full h-full object-cover"
              alt="Admin Profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwjTqf4c7gXyjD_QQYSyhgSsu6uQ68vw-aujE58ztqqGX43n3CBbP3FVcksqMfMNjco9jRDS0Ox64596ubjRGiBxBGDV-TySoXWc_q4TIfQ299YF1fo99Eu73k8WFkKUp3W74mGeG-NMNLWrW5y1oOCEntObqsOYUHnzOFvPpsth-tWnRr3blfWOvHRb-5xCizaSarqrYeASv3ore0mqiIlTbSQTDSeIj7jBShbALu-nab7bd0ZIykKDr-gZ1rtYu3JCH43DEBrjA"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
