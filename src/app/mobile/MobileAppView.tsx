"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MobileAppView() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Simpan status platform ke dalam cookie agar halaman lain tahu ini Android
    document.cookie = "platform=android; path=/; max-age=31536000; SameSite=Lax";

    // Simulasi loading progress bar Splash Screen
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        setTimeout(() => {
          setShowSplash(false);
          // Cek apakah onboarding sudah selesai
          const completed = localStorage.getItem("groovy_onboarding_completed");
          if (completed === "true") {
            setShowOnboarding(false);
          }
        }, 500);
      }
      setProgress(currentProgress);
    }, 150);

    return () => clearInterval(interval);
  }, [showSplash]); // Reset interval jika kembali ke splash

  useEffect(() => {
    // Alihkan ke login setelah splash selesai DAN jika onboarding sudah pernah diselesaikan
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
    }, 600);
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    } else {
      // Kembali ke Splash
      setProgress(0);
      setShowSplash(true);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("groovy_onboarding_completed", "true");
    setShowOnboarding(false);
  };

  const handleHelp = () => {
    alert("Butuh bantuan? Hubungi tim support GroovyCare melalui email: support@groovycare.com");
  };

  if (!mounted) {
    return null;
  }

  // 1. TAMPILAN SPLASH SCREEN
  if (showSplash) {
    return (
      <div className="h-screen h-[100dvh] flex flex-col justify-center items-center bg-white overflow-hidden relative font-sans">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes fade-up {
              0% { opacity: 0; transform: translateY(20px); }
              100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes scale-in {
              0% { opacity: 0; transform: scale(0.9); }
              100% { opacity: 1; transform: scale(1); }
          }
          .animate-fade-up {
              animation: fade-up 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          .animate-scale-in {
              animation: scale-in 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        `}} />
        
        {/* Glow Overlay Effect */}
        <div className="absolute w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(16,185,129,0.05)_0%,rgba(255,255,255,0)_70%)] rounded-full pointer-events-none z-0 animate-pulse"></div>
        
        {/* Center Brand Cluster */}
        <div className="z-10 flex flex-col items-center justify-center gap-6">
          {/* Brand Logo */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 animate-scale-in">
            <div className="absolute inset-0 bg-primary-container/10 rounded-full blur-2xl"></div>
            <img 
              className="w-full h-full object-contain drop-shadow-lg relative z-10" 
              alt="Logo PBF Online" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqp3J7h0LAkNZIsfLr3phSx_orBJvSaucu6KuEJNLO6RzZ-8BP0PJJOC8lwmmy10WwptzrBD0oVLC7e_ggh4a4ffcLVDCqmY6DT8W26r33xWMDkJnsCvieg-o6WPfz20Ild5x7HyAyLF2E2k3Wgvpydt8gTEZC6YfFeL_5zkCfu3J07Zeb4Ovwon6wqbfrnRGRmMZ9OmqJC51GBrhdKkkVP4QuTcI9A0awc7AA32-dxRocokMHu_9a1RMUG9Pp7lk3lOZi5FXhyGo"
            />
          </div>
          {/* Brand Name */}
          <div className="text-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <h1 className="font-heading text-2xl md:text-3xl text-primary tracking-tight font-extrabold">
              PBF Online
            </h1>
          </div>
        </div>

        {/* Bottom Tagline & Progress Bar */}
        <div className="absolute bottom-12 left-0 w-full flex flex-col items-center gap-8 animate-fade-up" style={{ animationDelay: "0.6s" }}>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-80">
            distribusi farmasi terpercaya
          </p>
          {/* Loading Indicator */}
          <div className="w-32 h-1 bg-surface-container-highest rounded-full overflow-hidden relative">
            <div 
              className="absolute h-full bg-primary rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Home Indicator Mock for Android Context */}
        <div className="absolute bottom-2 w-24 h-1 bg-on-surface/10 rounded-full"></div>
      </div>
    );
  }

  // 2. JIKA SEDANG REDIRECT (SETELAH SPLASH SELESAI & ONBOARDING SUDAH PERNAH)
  if (!showOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-on-surface-variant font-medium animate-pulse">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  // 3. DATA SLIDES ONBOARDING
  const slides = [
    {
      badge: "Resmi",
      title: "Pengadaan Farmasi Terpadu",
      description: "Akses ribuan produk obat dan alat kesehatan dari distributor resmi dalam satu genggaman.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQz4ieoyxo2uA99F4YwftzlpZeK5ofh2zadN4yyKSECxptjB8JhDG1HV1mAY5cSV3vGAJuvQciymlzav870VlSHZMxpOTW0bfaPnSTBiEbvWwYRC7jBc9w2BKFhlscXxKvVCPZvJhHQSKlENtpMfnivVQYj5gFnvrlZ5rW5PMdPb46nUBMZWbW4DwQJ2T1FTksNqFCxFcBg_04UZrGlVAWQdKJUCyHBf3vXfaJ8166oIAeB0wPqL-slYU8qhJ6tjS3HjXGfaFvS0Q"
    },
    {
      title: "Kepatuhan CDOB & e-Sign",
      description: "Proses pesanan (SP) legal secara digital dengan verifikasi APJ otomatis dan aman.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWynkzoJqlDgbybG8jrAVre37RkAFk4BuXsYAu6UhpD3X4GmYOiAKWcTHDZ68kUq2du12FS2lZQBPMOo8EF5-uhos9e-LwZWMRHnjYMyyHoN8M-gwDSPl_lZMbE4EriDoJSb4zkkSarLT1TmHM9wnTw-mWVKxrniJ8LN2CxsF9deyXuR4q39zh7Emp4rElQBqDA9e-08hC0EYy4kaEOaqcbYb4XMQQ3WmWP_TZYUeMGnaLPNo84iY4c1nIhGA5CynudYy_UFpF0nk"
    },
    {
      title: "Manajemen Keuangan Terpadu",
      description: "Pantau tagihan, limit kredit, dan konfirmasi pembayaran e-Faktur dalam satu dashboard yang aman dan transparan."
    }
  ];

  const headerTitle = currentSlide === 0 ? "PBF Registration" : "PBF Online";
  const skipText = currentSlide === 1 ? "Lewati pengenalan" : "Lewati";

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface font-sans overflow-y-auto pb-safe">
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        @keyframes pulse-ring {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 108, 73, 0.4); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 108, 73, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 108, 73, 0); }
        }
        .active-dot {
            animation: pulse-ring 2s infinite;
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }
        .animate-float {
            animation: float 4s ease-in-out infinite;
        }
        .pulse-ring-badge {
            box-shadow: 0 0 0 0 rgba(0, 108, 73, 0.4);
            animation: pulse-badge 2s infinite;
        }
        @keyframes pulse-badge {
            70% { box-shadow: 0 0 0 15px rgba(0, 108, 73, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 108, 73, 0); }
        }
        @keyframes scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .scale-in {
            animation: scale-in 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle {
            animation: bounce-subtle 3s ease-in-out infinite;
        }
      `}} />

      {/* Top AppBar */}
      <header className="sticky top-0 w-full z-50 bg-surface/70 backdrop-blur-md shadow-sm flex justify-between items-center px-4 h-16 border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack} 
            className="material-symbols-outlined text-primary active:scale-95 transition-transform"
          >
            arrow_back
          </button>
          <h1 className="font-heading font-bold text-primary text-base">{headerTitle}</h1>
        </div>
        <button 
          onClick={handleHelp} 
          className="material-symbols-outlined text-primary active:scale-95 transition-transform"
        >
          help
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-between p-6 max-w-lg mx-auto w-full relative">
        {/* Background Ambient Shader / Glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container rounded-full blur-[100px]"></div>
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-secondary-container rounded-full blur-[80px]"></div>
        </div>

        {/* Hero Visual Section */}
        <div className="w-full flex-1 flex items-center justify-center py-6">
          {currentSlide === 1 ? (
            /* Layout Visual Onboarding 2 (Kepatuhan CDOB) */
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 bg-primary-fixed-dim/20 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 rounded-3xl overflow-hidden shadow-2xl bg-white border border-outline-variant/30 flex items-center justify-center animate-float">
                <div 
                  className="w-full h-full bg-cover bg-center" 
                  style={{ backgroundImage: `url('${slides[currentSlide].image}')` }}
                ></div>
              </div>
              
              {/* APJ Verified Badge */}
              <div className="absolute -right-4 top-1/4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-primary/10 flex items-center gap-2 transform rotate-3 z-10">
                <div className="w-2 h-2 rounded-full bg-primary pulse-ring-badge"></div>
                <span className="text-[10px] text-primary font-bold">APJ Verified</span>
              </div>
              
              {/* CDOB Compliant Badge */}
              <div className="absolute -left-8 bottom-1/4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-secondary/10 flex items-center gap-2 transform -rotate-2 z-10">
                <span className="material-symbols-outlined text-secondary text-sm">verified_user</span>
                <span className="text-[10px] text-secondary font-bold">CDOB Compliant</span>
              </div>
            </div>
          ) : currentSlide === 2 ? (
            /* Layout Visual Onboarding 3 (Manajemen Keuangan) */
            <div className="w-full max-w-sm mx-auto scale-in relative">
              <div className="relative glass-card rounded-2xl p-4 shadow-xl overflow-hidden min-h-[300px] border border-white/40 z-10">
                {/* Mock Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                    <span className="font-heading font-bold text-sm text-on-surface">Keuangan</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-base">more_vert</span>
                </div>
                
                {/* Bento Grid Style Data Display */}
                <div className="grid grid-cols-2 gap-3">
                  {/* KPI 1: Credit Limit */}
                  <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1">
                    <span className="text-[10px] text-on-surface-variant font-medium">Limit Kredit</span>
                    <span className="text-lg font-black text-primary font-mono">Rp 500jt</span>
                    <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-primary w-[65%]"></div>
                    </div>
                    <span className="text-[9px] text-on-surface-variant mt-1 font-medium">Terpakai 65%</span>
                  </div>
                  
                  {/* KPI 2: Overdue Invoices */}
                  <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1">
                    <span className="text-[10px] text-on-surface-variant font-medium">Jatuh Tempo</span>
                    <span className="text-lg font-black text-error font-mono">4</span>
                    <span className="text-[9px] text-error font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] font-bold">priority_high</span> Segera Bayar
                    </span>
                  </div>
                  
                  {/* Chart Card: Transaction History */}
                  <div className="col-span-2 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 relative overflow-hidden h-32">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] text-on-surface-variant font-medium">Riwayat Transaksi</span>
                      <span className="text-primary font-bold text-[9px] bg-primary-container/20 px-2 py-0.5 rounded-full">Bulanan</span>
                    </div>
                    {/* Simple Bar Chart */}
                    <div className="flex items-end justify-between h-16 px-1 gap-2 mt-2">
                      <div className="w-full bg-surface-container rounded-t-sm h-[40%]"></div>
                      <div className="w-full bg-surface-container rounded-t-sm h-[60%]"></div>
                      <div className="w-full bg-primary/40 rounded-t-sm h-[30%]"></div>
                      <div className="w-full bg-primary/60 rounded-t-sm h-[80%]"></div>
                      <div className="w-full bg-primary rounded-t-sm h-[55%]"></div>
                      <div className="w-full bg-primary-container rounded-t-sm h-[90%]"></div>
                      <div className="w-full bg-primary/20 rounded-t-sm h-[45%]"></div>
                    </div>
                  </div>
                </div>
                
                {/* Floating e-Faktur Alert */}
                <div className="absolute bottom-4 right-4 glass-card bg-primary-container/95 p-3 rounded-xl shadow-lg border border-primary/25 max-w-[160px] animate-bounce-subtle z-25">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-on-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                    <span className="text-[10px] text-on-primary-container font-bold">e-Faktur Ready</span>
                  </div>
                  <p className="text-[9px] leading-tight text-on-primary-container font-medium">Konfirmasi pembayaran untuk 3 faktur baru.</p>
                </div>
              </div>
              {/* Abstract background graphic */}
              <div className="absolute -z-10 -top-4 -right-4 w-full h-full bg-primary-fixed-dim/20 rounded-2xl rotate-3 pointer-events-none"></div>
            </div>
          ) : (
            /* Layout Visual Onboarding 1 */
            <div className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/30 glass-card group">
              <div className="absolute inset-0 flex items-center justify-center p-6 bg-gradient-to-br from-white via-surface-container-lowest to-surface-container-low">
                <img 
                  className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-700 ease-out" 
                  alt={slides[currentSlide].title} 
                  src={slides[currentSlide].image} 
                />
              </div>
              {/* Floating KPI Badge */}
              {slides[currentSlide].badge && (
                <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce z-10">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="text-[10px] font-bold tracking-wide">{slides[currentSlide].badge}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="w-full flex flex-col gap-6 mb-8">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="font-heading font-black text-xl md:text-2xl text-on-surface leading-tight px-2">
              {slides[currentSlide].title}
            </h2>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed px-4">
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center items-center gap-3 py-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`transition-all duration-300 ${
                  index === currentSlide 
                    ? "w-8 h-2 rounded-full bg-primary active-dot" 
                    : "w-2 h-2 rounded-full bg-outline-variant/60"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Section: Standar Keamanan Platform (Hanya untuk Onboarding 2) */}
        {currentSlide === 1 && (
          <section className="w-full max-w-sm px-4 py-6 border-t border-outline-variant/20 mb-8">
            <h2 className="text-[10px] text-outline font-bold uppercase tracking-widest mb-6 text-center">
              Standar Keamanan Platform
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                <span className="font-heading font-bold text-xs text-slate-800">Enkripsi AES-256</span>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  Data SP dilindungi enkripsi tingkat militer.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>history_edu</span>
                <span className="font-heading font-bold text-xs text-slate-800">Audit Trail</span>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  Setiap tanda tangan tercatat secara permanen.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Action Section */}
        <div className="w-full flex flex-col gap-3 mb-6">
          <button 
            onClick={handleNext}
            className="w-full bg-primary text-white h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg shadow-primary/20 cursor-pointer"
          >
            {isTransitioning ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <>
                <span>{currentSlide === 2 ? "Mulai Sekarang" : "Selanjutnya"}</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
          {currentSlide !== 2 && (
            <button 
              onClick={handleComplete}
              className="w-full h-14 rounded-2xl font-bold text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-98"
            >
              {skipText}
            </button>
          )}
        </div>
      </main>

      {/* Android System Navigation Mock (For Context) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-on-surface/10 rounded-full pointer-events-none"></div>
    </div>
  );
}
