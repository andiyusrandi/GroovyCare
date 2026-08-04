"use client";

import React, { useEffect, useState } from "react";

interface AnimatedSplashScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export default function AnimatedSplashScreen({
  onFinish,
  durationMs = 2000,
}: AnimatedSplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if splash screen was already shown in this session
    const hasShown = sessionStorage.getItem("groovy_splash_shown");
    if (hasShown === "true") {
      setIsVisible(false);
      if (onFinish) onFinish();
      return;
    }

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, Math.max(500, durationMs - 500));

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem("groovy_splash_shown", "true");
      if (onFinish) onFinish();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [durationMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-white px-6 py-12 transition-all duration-500 font-sans select-none ${
        isFadingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Top spacing */}
      <div className="w-full flex justify-center pt-8 opacity-60">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
          Ekosistem Farmasi Digital
        </span>
      </div>

      {/* Center Logo & Branding */}
      <div className="flex flex-col items-center gap-5 text-center my-auto">
        <div className="relative flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-emerald-100/60 rounded-3xl animate-ping duration-1000 scale-110" />
          <img
            src="https://res.cloudinary.com/rumahhostcom/image/upload/v1785321525/logo_care_fcfgwq.png"
            alt="GroovyRx Logo"
            className="h-16 md:h-20 w-auto object-contain relative z-10 drop-shadow-sm transition-transform animate-pulse"
          />
        </div>

        <div className="space-y-1 mt-2">
          <h1 className="text-xl font-black font-heading text-slate-900 tracking-tight">
            GroovyCare
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Layanan PBF & Distribusi Alat Kesehatan
          </p>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-36 h-1 bg-slate-100 rounded-full overflow-hidden mt-6 relative">
          <div className="h-full bg-emerald-600 rounded-full animate-[pulse_1s_infinite] w-full origin-left" style={{
            animation: "splashProgress 1.8s ease-in-out forwards"
          }} />
        </div>
      </div>

      {/* Footer Text */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-[10.5px] font-bold text-slate-400 tracking-wide uppercase">
          Terintegrasi CDOB & PBF Online
        </p>
        <p className="text-[9px] text-slate-300">
          v1.0.0 &bull; Secure Connection
        </p>
      </div>

      <style jsx>{`
        @keyframes splashProgress {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
