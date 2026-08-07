export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getProducts } from "@/app/actions/products";
import { getSession } from "@/lib/auth-session";
import { db } from "@/lib/db";
import PublicCatalog from "@/app/PublicCatalog";
import MobileAppView from "@/app/mobile/MobileAppView";
import {
  ShieldCheck,
  Gavel,
  Archive,
  PenTool,
  ArrowRight,
  Globe,
  Mail,
  FileText,
  UserCheck,
  ShoppingCart,
  ChevronRight,
  Truck,
  CreditCard,
  Receipt,
} from "lucide-react";


interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LandingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const platformCookie = cookieStore.get("platform")?.value;
  const platform = params.platform || platformCookie;

  const session = await getSession();

  const prisma = db as any;
  const logoSetting = await prisma.systemSetting.findUnique({
    where: { key: "logo_url" },
  });
  const logoUrl = logoSetting?.value || "https://res.cloudinary.com/rumahhostcom/image/upload/v1785256133/IMG_20260725_184829_670_odzsui.png";

  const showHeroCardsSetting = await prisma.systemSetting.findUnique({
    where: { key: "show_hero_cards" },
  });
  const showHeroCards = showHeroCardsSetting?.value === "true";


  // Jika ini adalah platform Android, tampilkan onboarding atau redirect ke dashboard jika sudah login.
  if (platform === "android") {
    if (session) {
      if (session.role === "PBF_ADMIN" || session.role === "SYSTEM_ADMIN") {
        redirect("/admin/dashboard");
      } else {
        redirect("/customer/dashboard");
      }
    }
    return <MobileAppView />;
  }

  const products = await getProducts();

  return (
    <div className="bg-background text-on-surface min-h-screen font-sans flex flex-col">
      {/* Skip to Main Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-white px-4 py-2 rounded-xl z-[60] font-bold shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
      >
        Loncati ke Konten Utama
      </a>

      {/* Desktop Floating Glassmorphism Navbar */}
      <nav className="hidden md:block fixed top-4 left-0 right-0 w-[calc(100%-2rem)] max-w-7xl mx-auto z-50 bg-white/75 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-900/5 transition-all duration-300">
        <div className="flex justify-between items-center px-6 py-2.5 w-full">
          
          {/* Left Side: Logo & Main Navigation Links */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg outline-none"
            >
              <img
                src={logoUrl}
                alt="GroovyRx Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>
            
            {/* Links Navigasi Segmented Controls Sleek */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl border border-slate-200/60">
              <Link
                className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 bg-white rounded-lg shadow-2xs transition-all"
                href="#solutions"
              >
                Solutions
              </Link>
              <Link
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                href="#catalog"
              >
                Catalog
              </Link>
              <Link
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                href="#compliance"
              >
                Compliance
              </Link>
              <Link
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                href="#about"
              >
                About Us
              </Link>
            </div>
          </div>

          {/* Right Side: Auth Action Buttons */}
          <div className="flex items-center gap-2">
            {session ? (
              <Link
                href={session.role === "PBF_ADMIN" || session.role === "SYSTEM_ADMIN" ? "/admin/dashboard" : "/customer/dashboard"}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl active:scale-95 transition-all duration-200 text-xs font-bold shadow-xs shadow-emerald-600/20 cursor-pointer"
              >
                Dashboard Mitra
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-emerald-600 hover:bg-slate-100/60 rounded-xl transition-all"
                >
                  Partner Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl active:scale-95 transition-all duration-200 text-xs font-bold shadow-xs shadow-emerald-600/20 cursor-pointer"
                >
                  Register
                </Link>
              </>
            )}
          </div>

        </div>
      </nav>

      {/* Mobile Navigation Header */}
      <header className="sticky top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm h-16 flex md:hidden justify-between items-center px-4 border-b border-outline-variant/15">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary font-bold">medical_services</span>
          <span className="font-heading font-extrabold text-sm text-primary">PBF Online</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-3.5 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg shadow-sm shadow-primary/10">
            Masuk
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        <section
          className="hidden md:block relative overflow-hidden bg-cover bg-center pt-24 pb-20 lg:pt-36 lg:pb-28"
          style={{
            backgroundImage: "url('https://res.cloudinary.com/rumahhostcom/image/upload/v1784398717/ffsfsf_vsnzzp.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Overlay Soft Transparan agar teks & elemen visual tetap terbaca jelas */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/95 via-slate-50/85 to-transparent pointer-events-none z-0"></div>

          {/* Ambient Glows */}
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
          <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[125px] pointer-events-none z-0"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

              {/* Left Column: Copy & Actions (7/12) */}
              <div className="lg:col-span-7 space-y-6 lg:space-y-8 text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-emerald-800 border border-emerald-200/90 text-[11px] font-bold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>PBF Online System • Verifikasi BPOM &amp; CDOB Real-time</span>
                </div>

                {/* HEADLINE UTAMA */}
                <h1 className="font-sans font-extrabold text-3xl sm:text-4xl lg:text-[44px] lg:leading-[1.15] text-slate-900 tracking-tight">
                  Transformasi Digital <br />
                  Distribusi <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">Farmasi Terpercaya</span>
                </h1>

                {/* DESKRIPSI TEKS */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium max-w-xl bg-white/60 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/40 shadow-2xs">
                  Solusi logistik obat satu pintu untuk apotek, rumah sakit, dan klinik. Pengelolaan transaksi tempo/kredit real-time, integrasi kurir instan, dan kepatuhan regulasi BPOM tertinggi di Indonesia.
                </p>

                {/* TOMBOL AKSI */}
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  {/* Primary Button */}
                  <Link
                    href="/register"
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  >
                    Daftar Jadi Mitra
                  </Link>

                  {/* Secondary Button */}
                  <Link
                    href="#catalog"
                    className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200/90 shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Lihat Katalog</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Right Column: Platform Feature Preview (5/12) */}
              <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
                {showHeroCards && (
                  <div className="relative w-full max-w-md space-y-4 lg:space-y-5">

                    {/* Mockup Card 1: Credit Limit & TOP */}
                    <div className="bg-[#f0f8ffba] p-5 rounded-3xl border border-outline-variant/25 shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-4 animate-float-slow">
                      <div className="space-y-1">
                        <p className="text-[10px] text-on-surface-variant/80 font-bold uppercase tracking-wider">Plafon Kredit Mitra</p>
                        <h4 className="text-lg font-extrabold font-mono text-slate-800">Rp 500.000.000</h4>
                        <p className="text-[9px] text-primary font-bold">TOP: 30 Hari Tempo</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center border border-emerald-100">
                        <span className="material-symbols-outlined text-[24px]">account_balance</span>
                      </div>
                    </div>

                    {/* Mockup Card 2: Logistics Tracker */}
                    <div className="bg-[#f0f8ffba] p-5 rounded-3xl border border-outline-variant/25 shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-4 ml-6 lg:ml-8 animate-float-medium">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-on-surface-variant/80 font-bold uppercase tracking-wider">Logistik BiteShip</p>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-extrabold bg-blue-50 text-blue-600 border border-blue-250 uppercase animate-pulse">
                            Dalam Perjalanan
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                          <span>Kurir: Anteraja Regular</span>
                          <span className="font-mono text-slate-900 font-bold">1-2 Hari</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary w-2/3 h-full rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Mockup Card 3: APJ Verification */}
                    <div className="bg-[#f0f8ffba] p-5 rounded-3xl border border-outline-variant/25 shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-between gap-4 animate-float-fast">
                      <div className="space-y-1">
                        <p className="text-[10px] text-on-surface-variant/80 font-bold uppercase tracking-wider">Sertifikasi &amp; Regulasi</p>
                        <h4 className="text-xs font-bold text-slate-800">Kepatuhan CDOB BPOM</h4>
                        <p className="text-[9px] text-emerald-700 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                          e-Sign SP Valid &amp; Aman
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">verified_user</span>
                      </div>
                    </div>

                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* Mobile Hero Section */}
        <section className="block md:hidden relative px-6 pt-12 pb-16 overflow-hidden bg-gradient-to-b from-teal-50/20 via-white to-slate-50 border-b border-outline-variant/10">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-secondary/5 rounded-full blur-3xl"></div>
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Transformasi Digital Farmasi</span>
            </div>
            <h1 className="font-heading font-extrabold text-3xl text-on-surface leading-tight">
              Sistem Operasi untuk <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Pengadaan Farmasi</span>
            </h1>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm">
              Kelola ribuan SKU, ratusan pemasok, dan optimalkan rantai pasok apotek Anda dengan kepatuhan regulasi CDOB BPOM dalam satu platform terpadu.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/register"
                className="w-full bg-primary text-white text-center py-3.5 rounded-xl text-xs font-bold shadow-md shadow-primary/10 active:scale-95 transition-all"
              >
                Mulai Sekarang
              </Link>
              <Link
                href="#catalog"
                className="w-full bg-white/50 backdrop-blur-md text-on-surface-variant text-center py-3.5 rounded-xl text-xs font-bold border border-outline-variant/35 active:scale-95 transition-all shadow-sm"
              >
                Lihat Katalog
              </Link>
            </div>
          </div>

          {/* Mobile Hero Image/Graphic */}
          <div className="mt-10 relative">
            <div className="bg-white/45 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl border border-white/50">
              <img
                className="w-full h-auto object-cover"
                alt="A clean UI dashboard showing pharmacy stock levels and analytics chart"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPYhHQiIGxEFIwT15CcFIhi_FRH1lDMhjfJtGlXKIWt5iVYzTud07CSNciLTbyMFGn2LYjnDzbFdrzPaIboU9-K_E_F4kNisHEMFYi7KpKOHML95_yaTvUwCaQF0p5VNs45hQf7qNrK4C0xjBh-b7cfV6k9a09LqCitxSYKZ0h_ssuKsJGsCg0KWlh2fiQUDm56pZwH8MF_kexuC5KADKn4_5K-L-a9E01NGwdQPzQnLuqkEtECNHhImNc2_JToxw1lMv8xLCNv6w"
              />
            </div>
            {/* Floating Info Tag */}
            <div className="absolute -bottom-4 -right-2 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <span className="material-symbols-outlined text-sm font-bold">verified</span>
                </div>
                <div>
                  <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Kepatuhan</p>
                  <p className="text-xs text-primary font-bold">100% CDOB BPOM</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Stats Section */}
        <section className="block md:hidden px-6 py-8 bg-white border-b border-outline-variant/10">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-outline-variant/20 shadow-sm">
              <p className="text-xl font-extrabold text-primary font-mono">12.500+</p>
              <p className="text-[10px] text-on-surface-variant font-medium">Produk Farmasi</p>
            </div>
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-outline-variant/20 shadow-sm">
              <p className="text-xl font-extrabold text-primary font-mono">420+</p>
              <p className="text-[10px] text-on-surface-variant font-medium">Pemasok Terverifikasi</p>
            </div>
            <div className="col-span-2 bg-slate-50/50 p-5 rounded-2xl border border-outline-variant/20 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-xl font-extrabold text-primary font-mono">6.800+</p>
                <p className="text-[10px] text-on-surface-variant font-medium">Fasilitas Kesehatan</p>
              </div>
              <div className="flex -space-x-3">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">A</div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-container/20 flex items-center justify-center text-[10px] font-bold text-primary shadow-sm">K</div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">+</div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition (Bento Grid Layout ala Apple / Vercel) */}
        <section id="solutions" className="hidden md:block py-12 md:py-16 px-6 max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span>Inovasi Platform Farmasi</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl lg:text-3xl text-slate-900 tracking-tight">
                Keunggulan Layanan PBF Online
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium max-w-md leading-relaxed">
              Otomatisasi pengadaan obat terintegrasi dengan kepatuhan regulasi BPOM &amp; penandatanganan SP digital instan.
            </p>
          </div>

          {/* Wrapper Grid: Gunakan items-start agar tinggi card kiri menyesuaikan kontennya secara alami */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* 1. CARD UTAMA (Sekarang lebih ringkas & proporsional) */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 md:p-7 border border-slate-800 shadow-xl flex flex-col justify-between group hover:border-emerald-500/50 transition-all duration-300">
              {/* Decor Glow */}
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    LIVE 24/7 FEFO
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    System Active
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-1.5 text-white font-heading">
                  Real-time Inventory System
                </h3>
                <p className="text-slate-300 text-xs max-w-xl mb-4 leading-relaxed font-normal">
                  Pantau ketersediaan ribuan obat secara akurat 24/7. Notifikasi otomatis untuk batas kritis stok serta alokasi nomor batch (FEFO) secara transparan.
                </p>
              </div>

              {/* Visual Widget Table Mini (Dibuat Lebih Tipis & Compact) */}
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 backdrop-blur-sm mt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 border-b border-slate-700/50 pb-1.5 font-medium">
                  <span>Item / Sediaan</span>
                  <span>Batch &amp; FEFO</span>
                  <span>Status Stok</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-200 py-1">
                  <span className="truncate max-w-[150px] font-medium">Amoxicillin 500mg</span>
                  <span className="text-slate-400 font-mono text-[11px]">B2401 • Exp 2028</span>
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] font-mono font-bold">46 Box</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-200 py-1">
                  <span className="truncate max-w-[150px] font-medium">Sanmol 500mg</span>
                  <span className="text-slate-400 font-mono text-[11px]">B2402 • Exp 2027</span>
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] font-mono font-bold">40 Box</span>
                </div>
              </div>
            </div>

            {/* 2. KANAN: Card CDOB & e-Sign */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              {/* Card CDOB */}
              <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase border border-emerald-100">
                    SERTIFIKASI BPOM
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1 font-heading">CDOB Compliance</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-3">
                  Tersertifikasi CDOB oleh BPOM untuk menjamin mutu &amp; integritas produk farmasi.
                </p>
                <div className="text-[11px] text-slate-500 flex items-center justify-between border-t pt-2 border-slate-100">
                  <span>Sertifikat BPOM:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi Resmi
                  </span>
                </div>
              </div>

              {/* Card Integrated e-Sign */}
              <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50/30 border border-teal-100 p-5 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded uppercase border border-teal-200">
                    DIGITAL LEGAL 100%
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm font-bold">
                    <PenTool className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1 font-heading">Integrated e-Sign SP</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-3">
                  Proses Surat Pesanan (SP) digital yang sah secara hukum dengan validasi APJ.
                </p>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-700 bg-white/80 px-2.5 py-1 rounded-lg border border-teal-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Stempel &amp; e-Sign Sah Hukum
                </div>
              </div>
            </div>

          </div>


        </section>



        {/* Interactive Trust Wall & Live Compliance Status (Unified Emerald & Tech-Clean) */}
        <section id="compliance" className="hidden md:block py-12 relative overflow-hidden bg-slate-50/70 border-y border-slate-200/70">
          
          {/* Pattern Dot Background Minimalis */}
          <div className="absolute inset-0 opacity-[0.25] pointer-events-none" style={{ backgroundImage: `radial-gradient(#059669 0.75px, transparent 0.75px)`, backgroundSize: '24px 24px' }}></div>

          <div className="max-w-6xl mx-auto px-6 space-y-5 relative z-10">
            
            {/* Header Banner - Glassmorphism Style */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-4 px-6 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 tracking-tight flex items-center gap-2 font-heading">
                    Sertifikasi &amp; Kepatuhan Hukum Terverifikasi
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">Jaminan legalitas distributor medis resmi Indonesia</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-bold shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="tracking-wide">BPOM &amp; CDOB Real-time Verified</span>
              </div>
            </div>

            {/* Grid Sertifikat (4 Cards - Unified Emerald Theme) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Kemenkes RI */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-14 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                    <img src="/images/compliance/kemkes%20logo.png" alt="Kementerian Kesehatan RI" className="h-7 w-auto object-contain group-hover:scale-105 transition-transform" />
                  </div>
                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 uppercase">Izin Resmi</span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">Kementerian Kesehatan RI</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Izin Operasional PBF</p>
                </div>
                <div className="pt-2.5 border-t border-slate-100 text-[10px] text-emerald-600 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Status: Terverifikasi
                </div>
              </div>

              {/* 2. Badan POM */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-14 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                    <img src="/images/compliance/Logo-Badan-POM-Format-SVG-PNG-AI-PDF-EPS-CDR.png" alt="Badan POM Indonesia" className="h-7 w-auto object-contain group-hover:scale-105 transition-transform" />
                  </div>
                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 uppercase">CDOB Valid</span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">Badan POM Indonesia</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Sertifikasi CDOB BPOM</p>
                </div>
                <div className="pt-2.5 border-t border-slate-100 text-[10px] text-emerald-600 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Status: Terverifikasi
                </div>
              </div>

              {/* 3. ISO 9001:2015 */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-14 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                    <img src="/images/compliance/ISO_9001-2015.svg.png" alt="ISO 9001:2015 Certification" className="h-7 w-auto object-contain group-hover:scale-105 transition-transform" />
                  </div>
                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 uppercase">Mutu ISO</span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">ISO 9001:2015</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Manajemen Mutu Distribusi</p>
                </div>
                <div className="pt-2.5 border-t border-slate-100 text-[10px] text-emerald-600 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Status: Quality Assured
                </div>
              </div>

              {/* 4. e-Sign SP Digital */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-14 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                    <img src="/images/compliance/sign%20logo.png" alt="e-Sign SP Digital" className="h-7 w-auto object-contain group-hover:scale-105 transition-transform" />
                  </div>
                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 uppercase">Legal 100%</span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">e-Sign SP Digital</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Keabsahan Tanda Tangan SP</p>
                </div>
                <div className="pt-2.5 border-t border-slate-100 text-[10px] text-emerald-600 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Status: Sah Medis &amp; Valid
                </div>
              </div>

            </div>
          </div>
        </section>



        {/* Mobile Feature Bento Grid */}
        <section className="block md:hidden px-6 py-12 bg-slate-50/40 border-b border-outline-variant/10">
          <div className="mb-8">
            <h2 className="font-heading font-extrabold text-2xl mb-2 text-slate-800">Satu Platform, <br />Semua Solusi.</h2>
            <p className="text-xs text-on-surface-variant">Didesain khusus untuk efisiensi operasional farmasi modern.</p>
          </div>
          <div className="flex flex-col gap-4">
            {/* Feature Card 1 */}
            <div className="bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-outline-variant/25 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1.5">Marketplace Hub</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">Akses langsung ke ribuan SKU dari berbagai PBF resmi dengan harga kompetitif.</p>
              <Link href="#catalog" className="flex items-center text-primary font-bold text-xs">
                <span>Pelajari lebih lanjut</span>
                <span className="material-symbols-outlined text-xs ml-1">arrow_forward</span>
              </Link>
            </div>
            {/* Feature Card 2 */}
            <div className="bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-outline-variant/25 shadow-sm relative overflow-hidden">
              <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[24px]">psychology</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1.5">AI Inventaris</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">Prediksi stok habis dan optimalkan inventaris berdasarkan tren data penjualan.</p>
              {/* Sparkline Mockup */}
              <div className="h-12 w-full mt-2 flex items-end gap-1">
                <div className="flex-1 bg-primary/20 h-6 rounded-t-sm"></div>
                <div className="flex-1 bg-primary/30 h-9 rounded-t-sm"></div>
                <div className="flex-1 bg-primary/40 h-7 rounded-t-sm"></div>
                <div className="flex-1 bg-primary h-12 rounded-t-sm animate-pulse"></div>
                <div className="flex-1 bg-primary/60 h-10 rounded-t-sm"></div>
                <div className="flex-1 bg-primary/40 h-8 rounded-t-sm"></div>
              </div>
            </div>
            {/* Feature Card 3 */}
            <div className="bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-outline-variant/25 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[24px]">settings_accessibility</span>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1.5">Otomatisasi Pembelian</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">Konfigurasi pembelian otomatis saat stok menyentuh titik kritis.</p>
            </div>
          </div>
        </section>

        {/* Mobile Compliance Section */}
        <section className="block md:hidden px-6 py-12 bg-white border-b border-outline-variant/10">
          <div className="bg-slate-900 text-white p-8 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <span className="material-symbols-outlined text-[100px]">shield_lock</span>
            </div>
            <h3 className="text-xl font-bold mb-3 relative z-10">Keamanan &amp; Kepatuhan Tanpa Kompromi</h3>
            <p className="text-xs text-white/80 leading-relaxed mb-6 relative z-10">Kami memastikan setiap transaksi dan penyimpanan data mematuhi regulasi ketat industri farmasi di Indonesia.</p>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="flex flex-col gap-2 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
                <span className="text-[10px] font-bold">CDOB Certified</span>
              </div>
              <div className="flex flex-col gap-2 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">policy</span>
                </div>
                <span className="text-[10px] font-bold">BPOM Compliant</span>
              </div>
            </div>
          </div>
        </section>

        {/* Public Catalog Preview (Mobile Native & High-Usability Style) */}
        <section id="catalog" className="py-6 sm:py-10 bg-slate-50/60 border-y border-slate-200/60 selection:bg-emerald-500/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 font-sans">
            
            {/* Section Header */}
            <div className="flex items-end justify-between border-b border-slate-200/80 pb-3">
              <div>
                <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200/60 inline-block mb-1">
                  Display Utama
                </span>
                <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight font-heading">
                  Katalog Produk Unggulan
                </h2>
              </div>

              <Link 
                href="/login" 
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 group shrink-0"
              >
                <span>Lihat Semua</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>

            {/* Render 5 Produk Display Utama */}
            <PublicCatalog products={products} />
          </div>
        </section>

        {/* How It Works */}
        <section className="hidden md:block py-20 bg-surface-container">
          <div className="max-w-7xl mx-auto px-8 space-y-12">
            <div className="text-center space-y-3">
              <h2 className="font-heading font-bold text-3xl text-on-surface">Cara Bergabung Menjadi Mitra</h2>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Proses cepat dan aman untuk operasional medis Anda
              </p>
            </div>
            <div className="relative">
              {/* Progress Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-outline-variant/30 -translate-y-1/2 z-0"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-md border-4 border-surface-container">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-foreground">1. Registrasi Akun</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">
                    Isi data fasilitas kesehatan dan upload dokumen legalitas (SIA/SIP).
                  </p>
                </div>
                {/* Step 2 */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-md border-4 border-surface-container relative">
                    <UserCheck className="w-6 h-6" />
                    <div className="absolute -inset-2 border-2 border-primary rounded-full animate-ping opacity-20"></div>
                  </div>
                  <h3 className="font-heading font-bold text-base text-foreground">2. Verifikasi Data</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">
                    Tim compliance kami akan melakukan verifikasi dokumen dalam 1x24 jam kerja.
                  </p>
                </div>
                {/* Step 3 */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-md border-4 border-surface-container">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-foreground">3. Mulai Belanja</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs">
                    Akses katalog lengkap, harga khusus mitra, dan kirim Surat Pesanan digital.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center pt-6">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-sm cursor-pointer"
              >
                Mulai Registrasi Sekarang
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="hidden md:block py-20 px-8 max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-primary p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-primary/10">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div
                className="w-full h-full bg-cover"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB6ERdqoE-8Sy1KtNDnkGkjHatl5IS_sJaEcXZ8LdARnDCpvXl00sNAROeSsUegJvjNDwjAB_qhJrjHjCf7KgieBEeAO0HCBzRqSG5LKEA24yiZwATJb18hxy35dxGWgRTjUzbCcJefF6-XAJKpvTmqDg3dWykMpuwbFB33sQgwco6ONgSHONuLIqrl3kIi958xPkuMhBj2EerHZxkF7cX8cE95cKcsSbxT5fmCP5kyeHF4ig7_FMMa8PJyoVdVNiFJBDeEPSurT8o')",
                }}
              ></div>
            </div>
            <div className="relative z-10 max-w-xl text-on-primary space-y-3">
              <h2 className="font-heading font-bold text-3xl leading-tight">
                Siap untuk Efisiensi Distribusi Farmasi?
              </h2>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                Bergabunglah dengan ribuan apotek dan klinik yang telah menggunakan PBF Online untuk mengoptimalkan operasional mereka.
              </p>
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Link
                href="/login"
                className="px-8 py-4 bg-white text-primary rounded-xl text-xs font-bold hover:bg-surface-container-low transition-all text-center"
              >
                Hubungi Sales
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-primary-container text-on-primary-container rounded-xl text-xs font-bold hover:opacity-90 transition-all border border-on-primary-container/20 text-center"
              >
                Demo Platform
              </Link>
            </div>
          </div>
        </section>

        {/* Mobile CTA Section */}
        <section className="block md:hidden px-6 py-16 text-center bg-slate-50/50">
          <h2 className="font-heading font-extrabold text-2xl mb-4 text-slate-800">Siap Mengakselerasi Bisnis Farmasi Anda?</h2>
          <p className="text-xs text-on-surface-variant mb-8 max-w-sm mx-auto leading-relaxed">Gabung dengan ribuan apotek dan klinik yang telah mendigitalisasi pengadaannya secara otomatis.</p>
          <Link
            href="/register"
            className="block w-full bg-primary text-white py-4 rounded-2xl text-xs font-bold shadow-md shadow-primary/10 active:scale-95 transition-all text-center"
          >
            Daftar Sekarang
          </Link>
          <p className="mt-4 text-[10px] text-on-surface-variant font-medium">Tanpa biaya pendaftaran. Mulai dalam 5 menit.</p>
        </section>
      </main>

      {/* Footer */}
      <footer id="about" className="hidden md:block w-full bg-surface-container-low border-t border-outline-variant/30">
        <div className="flex flex-col md:flex-row justify-between items-start px-8 py-16 max-w-7xl mx-auto gap-8">
          <div className="mb-8 md:mb-0 max-w-sm space-y-4">
            <Link href="/" className="inline-block">
              <img
                src={logoUrl}
                alt="Logo PBF Online"
                className="h-10 max-w-[200px] w-auto object-contain drop-shadow-xs"
              />
            </Link>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Platform distribusi farmasi digital terkemuka di Indonesia. Menjamin keaslian obat dan kepatuhan regulasi secara menyeluruh.
            </p>
            <div className="flex gap-4">
              <Link
                className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                href="#"
              >
                <Globe className="w-4 h-4" />
              </Link>
              <Link
                className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                href="#"
              >
                <Mail className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className="font-heading font-bold text-xs uppercase tracking-widest text-primary">Company</h4>
              <ul className="space-y-2.5 text-xs text-on-surface-variant font-medium">
                <li>
                  <Link className="hover:text-primary transition-colors" href="#">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" href="#">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" href="#">
                    Career
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-heading font-bold text-xs uppercase tracking-widest text-primary">Legal</h4>
              <ul className="space-y-2.5 text-xs text-on-surface-variant font-medium">
                <li>
                  <Link className="hover:text-primary transition-colors" href="#">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" href="#">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" href="#">
                    Compliance Certificates
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-primary transition-colors" href="#">
                    Quality Assurance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-6 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-on-surface-variant">
          <span>
            &copy; {new Date().getFullYear()} PBF Online. All pharmaceutical distribution operations are CDOB compliant.
          </span>
          <div className="flex gap-6 font-bold text-primary">
            <span>Izin PBF: 123/PBF/2023</span>
            <span>Sertifikasi CDOB: 456/CDOB/2024</span>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full flex md:hidden justify-around items-center px-4 py-3 pb-safe bg-white/80 backdrop-blur-md border-t border-outline-variant/15 z-50 shadow-lg">
        <Link
          className="flex flex-col items-center justify-center text-primary font-bold bg-primary/10 rounded-full px-5 py-1.5 active:scale-95 transition-all text-xs"
          href="/register"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>how_to_reg</span>
          <span className="text-[10px] mt-0.5 font-bold">Daftar</span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all text-xs p-2"
          href="#katalog"
        >
          <span className="material-symbols-outlined text-[20px]">medical_services</span>
          <span className="text-[10px] mt-0.5">Katalog</span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all text-xs p-2"
          href="/login"
        >
          <span className="material-symbols-outlined text-[20px]">login</span>
          <span className="text-[10px] mt-0.5">Masuk</span>
        </Link>
      </nav>
    </div>
  );
}
