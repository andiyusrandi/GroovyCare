"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, MapPin, Calendar, Truck, ShieldCheck, Pill, CheckCircle2, ArrowRight } from "lucide-react";
import { triggerHapticImpact } from "@/lib/mobile-haptics";

export default function MobileAppView() {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState(
    "https://res.cloudinary.com/rumahhostcom/image/upload/v1785321525/logo_care_fcfgwq.png"
  );
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: any) => {
        if (data && data.success && data.settings?.logo_url) {
          setLogoUrl(data.settings.logo_url);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMounted(true);
    document.cookie = "platform=android; path=/; max-age=31536000; SameSite=Lax";

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 30;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);

        setTimeout(() => {
          setShowSplash(false);
          const completed = localStorage.getItem("groovy_onboarding_completed");
          if (completed === "true") {
            setShowOnboarding(false);
          }
        }, 300);
      }
      setProgress(currentProgress);
    }, 80);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mounted && !showSplash && !showOnboarding) {
      router.replace("/login");
    }
  }, [mounted, showSplash, showOnboarding, router]);

  const handleStartLogin = () => {
    triggerHapticImpact();
    localStorage.setItem("groovy_onboarding_completed", "true");
    router.push("/login");
  };

  const handleStartRegister = () => {
    triggerHapticImpact();
    localStorage.setItem("groovy_onboarding_completed", "true");
    router.push("/register");
  };

  if (!mounted) return null;

  // 1. SPLASH SCREEN (Fixed Fullscreen No-Scroll Native Android)
  if (showSplash) {
    return (
      <div className="h-screen h-[100dvh] w-full flex flex-col justify-between items-center bg-white overflow-hidden relative font-sans p-6 select-none overscroll-none touch-none">
        <div className="flex-1 flex flex-col items-center justify-center gap-5 z-10">
          <div className="relative w-32 h-32 md:w-36 md:h-36">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <img
              className="w-full h-full object-contain relative z-10 drop-shadow-sm"
              alt="Logo GroovyCare PBF"
              src={logoUrl}
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="font-heading text-2xl text-emerald-800 tracking-tight font-extrabold">
              PBF Online
            </h1>
            <p className="text-xs text-slate-500 font-medium">PT. GROOVYRX PHARMACEUTICAL GROUP</p>
          </div>
        </div>

        {/* Bottom Progress Bar */}
        <div className="w-full max-w-xs flex flex-col items-center gap-4 mb-8 z-10 shrink-0">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Distribusi Farmasi Terpercaya
          </p>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
            <div
              className="absolute h-full bg-emerald-600 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!showOnboarding) {
    return (
      <div className="h-screen h-[100dvh] bg-white flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  // 2. LUMA STYLE NATIVE ANDROID ONBOARDING
  return (
    <div className="h-screen h-[100dvh] w-full bg-gradient-to-b from-[#e8f3ee] via-[#f4f7f6] to-[#ffffff] text-slate-900 font-sans antialiased overflow-hidden select-none overscroll-none touch-none relative flex flex-col justify-between">
      
      {/* ------------------------------------------------------------- */}
      {/* BACKGROUND CONCENTRIC ORBIT RINGS & FLOATING BADGES           */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden -top-16">
        
        {/* Outer Ring */}
        <div className="w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] border border-emerald-200/50 rounded-full relative animate-spin-slow" style={{ animationDuration: "60s" }}>
          
          {/* Badge 1: Location Pin (Top Right) */}
          <div className="absolute -top-3 right-16 bg-white p-2.5 rounded-2xl shadow-lg border border-purple-100 flex items-center gap-1.5 transform hover:scale-110 transition-all pointer-events-auto">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <MapPin className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          {/* Badge 2: Calendar 21 SP (Middle Left) */}
          <div className="absolute top-24 -left-4 bg-white p-2.5 rounded-2xl shadow-lg border border-blue-100 flex items-center gap-1.5 transform hover:scale-110 transition-all pointer-events-auto">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex flex-col items-center justify-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-blue-500">SP</span>
              <span className="text-xs font-black font-mono leading-none">21</span>
            </div>
          </div>

          {/* Badge 3: Express Delivery Truck (Bottom Left) */}
          <div className="absolute bottom-16 -left-2 bg-white p-2.5 rounded-2xl shadow-lg border border-indigo-100 flex items-center gap-1.5 pointer-events-auto">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Truck className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          {/* Badge 4: Apothecary APJ Avatar (Top Left) */}
          <div className="absolute top-8 left-16 bg-white p-1.5 rounded-full shadow-lg border border-emerald-200 flex items-center gap-1.5 pointer-events-auto">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px] flex items-center justify-center border border-emerald-300">
              👩‍⚕️
            </div>
          </div>

          {/* Badge 5: BPOM / CDOB Verified (Bottom Right) */}
          <div className="absolute bottom-12 right-6 bg-white p-2.5 rounded-2xl shadow-lg border border-emerald-200 flex items-center gap-1.5 pointer-events-auto">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Middle Ring */}
        <div className="w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] border border-emerald-300/40 rounded-full absolute">
          {/* Badge 6: Pill Medicine (Right) */}
          <div className="absolute top-12 -right-3 bg-white p-2 rounded-2xl shadow-lg border border-amber-100 flex items-center gap-1.5 pointer-events-auto">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Pill className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>

          {/* Badge 7: Pharmacist Avatar (Bottom Center) */}
          <div className="absolute -bottom-3 left-24 bg-white p-1.5 rounded-full shadow-lg border border-rose-200 flex items-center justify-center pointer-events-auto">
            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[10px] flex items-center justify-center">
              👨‍⚕️
            </div>
          </div>
        </div>

        {/* Inner Ring */}
        <div className="w-[130px] h-[130px] sm:w-[150px] sm:h-[150px] border border-emerald-400/30 rounded-full absolute flex items-center justify-center">
          {/* Center Glowing Spark Logo Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 shadow-xl shadow-emerald-600/30 flex items-center justify-center p-2.5 animate-pulse">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="white" />
            </svg>
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* TOP STATUS / HEADER BRAND (Safe Area Padding)                */}
      {/* ------------------------------------------------------------- */}
      <header className="w-full pt-10 px-6 text-center z-10 flex justify-center">
        <div className="inline-flex items-center gap-2 bg-white/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-200/80 shadow-2xs">
          <img src={logoUrl} alt="Logo" className="w-4 h-4 object-contain" />
          <span className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider">
            PT. GROOVYRX PHARMACEUTICAL GROUP
          </span>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM WELCOME CARD & GET STARTED ACTION (Lower Position)     */}
      {/* ------------------------------------------------------------- */}
      <main className="w-full max-w-md mx-auto px-6 pb-8 sm:pb-12 pt-2 z-10 flex flex-col items-center text-center space-y-6">
        
        {/* Main Heading (Matching Luma Style "Delightful Events Start Here") */}
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight leading-tight">
            Distribusi Farmasi
          </h2>
          <div className="text-2xl sm:text-3xl font-heading font-black tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-amber-500 bg-clip-text text-transparent">
              Mulai Di Sini
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium pt-1 max-w-xs mx-auto">
            Portal B2B Pemesanan Obat &amp; Sediaan Farmasi Resmi Terverifikasi BPOM &amp; CDOB.
          </p>
        </div>

        {/* Black Pill Get Started Button */}
        <button
          type="button"
          onClick={() => {
            triggerHapticImpact();
            setIsAuthSheetOpen(true);
          }}
          className="w-full bg-slate-950 hover:bg-slate-800 active:scale-97 text-white font-heading font-black text-base h-14 rounded-full shadow-xl shadow-slate-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
        >
          <span>Get Started</span>
        </button>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* NATIVE ANDROID BOTTOM SHEET MODAL                             */}
      {/* ------------------------------------------------------------- */}
      {isAuthSheetOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          
          {/* Backdrop Click Area */}
          <div className="flex-1" onClick={() => setIsAuthSheetOpen(false)} />

          {/* Bottom Sheet Card */}
          <div className="w-full max-w-md mx-auto bg-white rounded-t-[36px] p-6 sm:p-8 pb-8 shadow-2xl border-t border-slate-100 animate-in slide-in-from-bottom duration-300 space-y-6 font-sans">
            
            {/* Modal Header Icons */}
            <div className="flex items-center justify-between">
              {/* Spark Badge Icon */}
              <div className="w-12 h-12 rounded-full bg-slate-100/80 border border-slate-200/60 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#0f172a" />
                </svg>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHapticImpact();
                  setIsAuthSheetOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors border-none cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Title & Description */}
            <div className="space-y-2 text-left">
              <h3 className="text-xl sm:text-2xl font-heading font-black text-slate-900 tracking-tight">
                Get Started
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Daftar akun Mitra Apotek &amp; Klinik untuk pemesanan obat resmi, kelola tagihan tempo, dan verifikasi e-Sign SP.
              </p>
            </div>

            {/* Action Buttons Stack */}
            <div className="space-y-3 pt-2">
              
              {/* Button 1: Login Phone / Account (Black Pill) */}
              <button
                type="button"
                onClick={handleStartLogin}
                className="w-full bg-[#18181b] hover:bg-black active:scale-98 text-white font-heading font-black text-sm h-13 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <span>Masuk dengan Akun (Login)</span>
              </button>

              {/* Button 2: Register New Mitra (Light Grey Pill) */}
              <button
                type="button"
                onClick={handleStartRegister}
                className="w-full bg-[#f4f4f5] hover:bg-[#e4e4e7] active:scale-98 text-slate-900 font-heading font-black text-sm h-13 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <span>Daftar Mitra Apotek Baru (Register)</span>
              </button>

              {/* Quick Auth Options Row (WhatsApp / Fast Login) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleStartLogin}
                  className="w-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-slate-800 font-bold text-xs h-12 rounded-2xl transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  <span className="text-base">💬</span>
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartLogin}
                  className="w-full bg-[#f4f4f5] hover:bg-[#e4e4e7] text-slate-800 font-bold text-xs h-12 rounded-2xl transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  <span className="text-base font-black">G</span>
                  <span>Google</span>
                </button>
              </div>

            </div>

            {/* Footer Note */}
            <div className="text-center pt-2">
              <span className="text-[10.5px] text-slate-400 font-medium">
                PBF Online GroovyCare &bull; Terverifikasi CDOB BPOM
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
