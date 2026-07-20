import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getProducts } from "@/app/actions/products";
import { getSession } from "@/lib/auth-session";
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

  // Jika ini adalah platform Android, tampilkan onboarding atau redirect ke dashboard jika sudah login.
  if (platform === "android") {
    if (session) {
      if (session.role === "PBF_ADMIN") {
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

      {/* TopNavBar */}
      <nav className="hidden md:block fixed top-0 md:top-4 left-0 right-0 w-full md:w-[calc(100%-2rem)] max-w-7xl mx-auto z-50 bg-white/40 md:bg-white/30 backdrop-blur-md md:rounded-2xl border-b md:border border-outline-variant/10 md:border-white/20 shadow-sm md:shadow-lg transition-all duration-300">
        <div className="flex justify-between items-center px-6 sm:px-8 py-3 w-full">
          <div className="flex items-center gap-8">
            <Link
              href="#"
              className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg outline-none"
            >
              <img
                src="https://www.groovyrx.com/store/1/logogroovyrx.png"
                alt="GroovyRx Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                className="text-primary font-bold border-b-2 border-primary pb-0.5 text-xs"
                href="#solutions"
              >
                Solutions
              </Link>
              <Link
                className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-xs font-semibold"
                href="#katalog"
              >
                Catalog
              </Link>
              <Link
                className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-xs font-semibold"
                href="#compliance"
              >
                Compliance
              </Link>
              <Link
                className="text-on-surface-variant hover:text-primary transition-colors duration-200 text-xs font-semibold"
                href="#about"
              >
                About Us
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <Link
                href={session.role === "PBF_ADMIN" ? "/admin/dashboard" : "/customer/dashboard"}
                className="px-5 py-2 bg-primary text-white rounded-full hover:bg-primary/90 active:scale-95 transition-all duration-200 text-xs font-bold shadow-sm"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-primary font-bold active:scale-95 transition-transform text-xs"
                >
                  Partner Login
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2 bg-primary text-white rounded-full hover:bg-primary/95 active:scale-95 transition-all duration-200 text-xs font-bold shadow-sm cursor-pointer"
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
          <div className="absolute inset-0 pointer-events-none z-0"></div>

          {/* Ambient Glows */}
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
          <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[125px] pointer-events-none z-0"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

              {/* Left Column: Copy & Actions (7/12) */}
              <div className="lg:col-span-7 space-y-6 lg:space-y-8 text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 text-primary rounded-full border border-primary/10">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-[10px] lg:text-[11px] font-bold tracking-wider uppercase">
                    CDOB Compliant &amp; Verified by BPOM
                  </span>
                </div>

                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-[40px] lg:leading-[48px] text-foreground tracking-tight">
                  Transformasi Digital <br />
                  Distribusi{" "}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Farmasi Terpercaya
                  </span>
                </h1>

                <p className="text-xs sm:text-sm text-on-surface-variant/85 max-w-xl leading-relaxed font-normal">
                  Solusi logistik obat satu pintu untuk apotek, rumah sakit, dan klinik. Pengelolaan transaksi tempo/kredit real-time, integrasi kurir instan, dan kepatuhan regulasi BPOM tertinggi di Indonesia.
                </p>

                <div className="flex flex-wrap gap-3.5 pt-1">
                  <Link
                    href="/register"
                    className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:shadow-md hover:shadow-primary/10 active:scale-95 transition-all cursor-pointer"
                  >
                    Daftar Jadi Mitra
                  </Link>
                  <Link
                    href="#katalog"
                    className="px-6 py-3 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 border border-outline-variant/30 shadow-sm"
                  >
                    Lihat Katalog
                    <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Platform Feature Preview (5/12) */}
              <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end">
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
                href="#katalog"
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

        {/* Value Proposition (Bento Grid Style) */}
        <section id="solutions" className="hidden md:block py-20 px-8 max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="font-heading font-bold text-3xl text-on-surface">Keunggulan Layanan PBF Online</h2>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Standar industri medis dalam genggaman Anda
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-white/40 backdrop-blur-lg p-8 rounded-3xl border border-white/40 hover:bg-white/60 hover:border-primary/20 transition-all duration-300 group shadow-sm hover:shadow-md">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <Gavel className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-3">CDOB Compliance</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Seluruh operasional kami telah tersertifikasi CDOB oleh BPOM untuk menjamin mutu dan integritas produk farmasi selama proses distribusi.
              </p>
            </div>
            {/* Pillar 2 */}
            <div className="bg-white/40 backdrop-blur-lg p-8 rounded-3xl border border-white/40 hover:bg-white/60 hover:border-primary/20 transition-all duration-300 group shadow-sm hover:shadow-md">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <Archive className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-3">Real-time Inventory</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Pantau stok obat secara akurat 24/7. Notifikasi otomatis untuk stok menipis dan update batch number terbaru secara instan.
              </p>
            </div>
            {/* Pillar 3 */}
            <div className="bg-white/40 backdrop-blur-lg p-8 rounded-3xl border border-white/40 hover:bg-white/60 hover:border-primary/20 transition-all duration-300 group shadow-sm hover:shadow-md">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <PenTool className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-3">Integrated e-Sign SP</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Proses Surat Pesanan (SP) digital yang sah secara hukum. Percepat birokrasi pemesanan narkotika dan psikotropika dengan aman.
              </p>
            </div>
          </div>
        </section>

        {/* Trust & Security Badges */}
        <section id="compliance" className="hidden md:block bg-surface-container-low py-12 border-y border-outline-variant/30">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-wrap justify-center items-center gap-12 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <div className="flex flex-col items-center gap-2">
                <img
                  className="h-12 object-contain"
                  alt="Official logo of BPOM Indonesia"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAJnBJh_ttB5YbenPcvXnmAFVx9mUezCZ6r94fxS6ahhNCMNgsTCrP9QOlp5KWuDixwdzQN4-_VeyItUhh-q86lcQHdkaHiBoPE9EgaRV3lagibRZ3NDC2SKrGkoNRqmQDraBL6l3EI-_pI4s3SwAWDPWRCcQo26-HrZiUCbYtbZoaIfQWlg7NZy7r1GjejCLGXmP0SH3AlFfwTUGt39VzezVjcAWSyG7kVeoWA9BXdi4emoRVWSp9Z2BDPAzMDZjSp3Y42u2cpFU"
                />
                <span className="text-[9px] uppercase tracking-widest text-outline font-bold">
                  Sertifikasi BPOM
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <img
                  className="h-12 object-contain"
                  alt="Official logo of Ministry of Health Indonesia (Kemenkes)"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2sQrWFwdZSIFV2x1-ml5CPlJOZQTjxdM_6gaOuNbGL-rYHH8q6ny3NtxXPBbRqB1xpILuY6HFjCyeITFRRxN3dHjLQiyOhSfSwHkMOrWJQM-uhdIR_4A7Il1Rl3y15MUuDjUB6ausbWvE9grT58QMg6fq1pRmdxzF1Ud94V2Oma4phvnTy4c1sJZlva3Ye-9mWaVID9C2GmAfr6JUWCLMunsPNh41IMEzcJHhgN40uEGhWbNXPmPlb9QRuGEeNSh3NJGdA_4zSe4"
                />
                <span className="text-[9px] uppercase tracking-widest text-outline font-bold">
                  Kemenkes RI
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <img
                  className="h-12 object-contain"
                  alt="ISO 9001:2015 Certification badge"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAT-3-2-sJXVON0rQCMQ_ZnRVcTE5R61ad2cuxJqWQeEbJeZpuwEZW4n-A3XU5L2wztkez3J3WGiIuHMsF1R-vbeW0Tl4xC4rzy_9FJ13VFDpEP_1T1xYvGEGq1uumto2uK6V4QlLhl6yDmzsZejnfzEGKOvxjHtun8mDx4bPTohgRtUWrinqaqCNp6sph1ylliosEbZ3n9pRCVrmAdE0pRJFwXbPnUxwhEYMSjULpD3lB3cdeJIeJt-fcXBGh4U_5LWPfpTTekk4g"
                />
                <span className="text-[9px] uppercase tracking-widest text-outline font-bold">
                  ISO 9001:2015
                </span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <img
                  className="h-12 object-contain"
                  alt="Digital Security Shield icon with E-Sign certificate symbol"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQHGlqtSokrkqWhEKVqPoqba3zC_1r8kAFO3gbkYamq1q_MjWrZEK9F4oMKMhc4KQqLaElXU8-R3F9zag3UaO9w0RufrpQP1jaMAAy1cWKpWgMlH5xHZZ6XUrarOT2_e-KeoVSe0lm0YStAQl75sZ3f-cSOr9swJdmF8lkL-TmL33KeNc6BDJh2gVp1Lm3thwedFfOSlm4ICz0xs39zHfd50z_SNIYNTSl4zWpj7xwvM9kGJe9TwtEQdrom0gOxcKQlbxNUv9TYZ8"
                />
                <span className="text-[9px] uppercase tracking-widest text-outline font-bold">
                  E-Sign Certified
                </span>
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
              <Link href="#katalog" className="flex items-center text-primary font-bold text-xs">
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

        {/* Public Catalog Preview (Dynamic!) */}
        <section id="katalog" className="py-12 md:py-20 px-6 md:px-8 max-w-7xl mx-auto space-y-8 md:space-y-12">
          <div className="flex flex-col items-start md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="font-heading font-bold text-3xl text-on-surface">Katalog Produk Unggulan</h2>
              <p className="text-sm text-on-surface-variant font-medium">
                Produk sediaan medis asli berstandar CDOB dari distributor resmi
              </p>
            </div>
            <Link
              href="/login"
              className="text-primary font-bold text-xs flex items-center gap-1.5 hover:underline"
            >
              Lihat Semua Produk
              <ChevronRight className="w-4 h-4 text-primary" />
            </Link>
          </div>

          {/* Render dynamic catalog */}
          <PublicCatalog products={products} />
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
            <span className="text-xl font-heading font-black text-on-surface block">PBF Online</span>
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
