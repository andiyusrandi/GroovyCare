"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MobileAppView() {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState(
    "https://res.cloudinary.com/rumahhostcom/image/upload/v1785256133/IMG_20260725_184829_670_odzsui.png"
  );

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

  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  const handleNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
      if (currentSlide < 2) {
        setCurrentSlide((prev) => prev + 1);
      } else {
        handleComplete();
      }
    }, 200);
  };

  const handleComplete = () => {
    localStorage.setItem("groovy_onboarding_completed", "true");
    setShowOnboarding(false);
    router.push("/register");
  };

  if (!mounted) return null;

  // 1. SPLASH SCREEN (Fixed Fullscreen No-Scroll)
  if (showSplash) {
    return (
      <div className="h-screen h-[100dvh] w-full flex flex-col justify-between items-center bg-white overflow-hidden relative font-sans p-6 select-none">
        <div className="flex-1 flex flex-col items-center justify-center gap-5 z-10">
          <div className="relative w-32 h-32 md:w-36 md:h-36">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <img
              className="w-full h-full object-contain relative z-10 drop-shadow-sm"
              alt="Logo PBF Online"
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
        <div className="w-full max-w-xs flex flex-col items-center gap-4 mb-6 z-10 shrink-0">
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

        <div className="w-28 h-1 bg-slate-200 rounded-full shrink-0"></div>
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

  // 2. DATA SLIDES ONBOARDING
  const slides = [
    {
      badge: "Resmi BPOM",
      title: "Pengadaan Farmasi Terpadu",
      description:
        "Akses ribuan produk obat dan alat kesehatan dari distributor resmi dalam satu genggaman.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCQz4ieoyxo2uA99F4YwftzlpZeK5ofh2zadN4yyKSECxptjB8JhDG1HV1mAY5cSV3vGAJuvQciymlzav870VlSHZMxpOTW0bfaPnSTBiEbvWwYRC7jBc9w2BKFhlscXxKvVCPZvJhHQSKlENtpMfnivVQYj5gFnvrlZ5rW5PMdPb46nUBMZWbW4DwQJ2T1FTksNqFCxFcBg_04UZrGlVAWQdKJUCyHBf3vXfaJ8166oIAeB0wPqL-slYU8qhJ6tjS3HjXGfaFvS0Q",
    },
    {
      badge: "CDOB Valid",
      title: "Kepatuhan CDOB & e-Sign",
      description:
        "Proses Surat Pesanan (SP) legal secara digital dengan verifikasi APJ otomatis dan transparan.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAWynkzoJqlDgbybG8jrAVre37RkAFk4BuXsYAu6UhpD3X4GmYOiAKWcTHDZ68kUq2du12FS2lZQBPMOo8EF5-uhos9e-LwZWMRHnjYMyyHoN8M-gwDSPl_lZMbE4EriDoJSb4zkkSarLT1TmHM9wnTw-mWVKxrniJ8LN2CxsF9deyXuR4q39zh7Emp4rElQBqDA9e-08hC0EYy4kaEOaqcbYb4XMQQ3WmWP_TZYUeMGnaLPNo84iY4c1nIhGA5CynudYy_UFpF0nk",
    },
    {
      badge: "Keuangan 24/7",
      title: "Manajemen Keuangan Terpadu",
      description:
        "Pantau tagihan, limit kredit tempo, dan konfirmasi e-Faktur dalam satu dashboard yang aman.",
      image:
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <div className="h-screen h-[100dvh] w-full flex flex-col justify-between bg-white text-slate-900 font-sans antialiased overflow-hidden select-none">
      {/* Main Content Body (Full Height / No Header) */}
      <main className="flex-1 min-h-0 w-full max-w-md mx-auto px-6 pt-8 pb-4 flex flex-col justify-between items-center">
        {/* Hero Image Area */}
        <div className="w-full flex-1 min-h-0 flex items-center justify-center my-auto py-2">
          <div className="relative w-full h-full max-h-[280px] aspect-square rounded-[28px] bg-emerald-50/40 border border-emerald-100/60 shadow-xs flex items-center justify-center p-6 overflow-hidden group">
            {/* Subtle Glow Background */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-200/30 rounded-full blur-2xl pointer-events-none"></div>

            {/* Image */}
            <img
              alt={slides[currentSlide].title}
              className="w-full h-full object-contain pointer-events-none z-10 transition-transform duration-500 group-hover:scale-105"
              src={slides[currentSlide].image}
            />

            {/* Floating Badge */}
            <div className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-md text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {slides[currentSlide].badge}
              </span>
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <div className="w-full shrink-0 flex flex-col items-center gap-3 my-3 text-center px-2">
          <h2 className="font-bold text-xl text-slate-800 tracking-tight leading-snug font-heading">
            {slides[currentSlide].title}
          </h2>
          <p className="text-[13px] text-slate-500 leading-relaxed font-normal max-w-xs">
            {slides[currentSlide].description}
          </p>

          {/* Pagination Dots */}
          <div className="flex justify-center items-center gap-1.5 pt-2" role="tablist">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 ${
                  index === currentSlide
                    ? "w-5 h-1.5 rounded-full bg-emerald-600"
                    : "w-1.5 h-1.5 rounded-full bg-slate-200 hover:bg-slate-300"
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="w-full shrink-0 flex flex-col gap-1.5 pt-2 pb-2">
          <button
            onClick={handleNext}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 rounded-full font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
          >
            {isTransitioning ? (
              <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
            ) : (
              <>
                <span>{currentSlide === 2 ? "Mulai Sekarang" : "Selanjutnya"}</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>

          {currentSlide !== 2 ? (
            <button
              onClick={handleComplete}
              className="w-full h-10 rounded-full font-medium text-xs text-slate-500 hover:text-slate-800 active:bg-slate-100 transition-colors cursor-pointer"
            >
              Lewati
            </button>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="w-full h-10 rounded-full font-medium text-xs text-slate-500 hover:text-slate-800 active:bg-slate-100 transition-colors cursor-pointer"
            >
              Sudah punya akun? Masuk
            </button>
          )}
        </div>
      </main>

      {/* Navigation Gesture Bar */}
      <footer className="w-full shrink-0 flex justify-center pb-2 pointer-events-none">
        <div className="w-28 h-1 bg-slate-200 rounded-full"></div>
      </footer>
    </div>
  );
}
