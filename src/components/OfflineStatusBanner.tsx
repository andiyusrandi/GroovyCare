"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { triggerHapticNotification, triggerHapticImpact } from "@/lib/mobile-haptics";

export default function OfflineStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      triggerHapticNotification();

      // Auto-hide restored banner after 3 seconds
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 3500);

      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
      triggerHapticNotification();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleManualRetry = async () => {
    triggerHapticImpact();
    setIsChecking(true);

    try {
      // Ping check to verify actual internet connectivity
      const response = await fetch("/api/settings?ping=1", { method: "HEAD", cache: "no-store" });
      if (response.ok) {
        setIsOffline(false);
        setShowRestored(true);
        setTimeout(() => setShowRestored(false), 3000);
      } else {
        setIsOffline(true);
      }
    } catch {
      setIsOffline(true);
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOffline && !showRestored) return null;

  return (
    <div className="fixed top-2 left-3 right-3 z-[999] pointer-events-none transition-all duration-300 ease-out">
      {/* 1. Offline Warning Banner */}
      {isOffline && (
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-amber-500/40 flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <WifiOff className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-black tracking-tight text-amber-300 uppercase">Mode Offline Android</p>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              </div>
              <p className="text-[11px] text-slate-300 truncate font-medium">
                Koneksi internet terputus. Menampilkan data lokal tersimpan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualRetry}
            disabled={isChecking}
            className="shrink-0 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold text-[11px] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md border-none cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Cek..." : "Coba Lagi"}
          </button>
        </div>
      )}

      {/* 2. Connection Restored Success Banner */}
      {!isOffline && showRestored && (
        <div className="pointer-events-auto bg-emerald-950/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-black tracking-tight text-emerald-300">Koneksi Internet Pulih!</p>
            <p className="text-[10.5px] text-slate-300 font-medium">Sistem terhubung kembali. Data telah disinkronkan.</p>
          </div>
        </div>
      )}
    </div>
  );
}
