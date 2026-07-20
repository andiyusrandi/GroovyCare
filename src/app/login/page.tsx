import Link from "next/link";
import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import LoginForm from "@/app/login/LoginForm";
import { ShieldCheck, Gavel } from "lucide-react";

export default async function LoginPage() {
  const session = await getSession();

  // Redirect jika sudah login
  if (session) {
    if (session.role === "PBF_ADMIN") {
      redirect("/admin/dashboard");
    } else {
      redirect("/customer/dashboard");
    }
  }

  return (
    <div className="relative min-h-screen font-sans flex flex-col bg-white overflow-hidden">
      <main className="flex min-h-screen">
        
        {/* Left Side: Visual/Trust (Suppressed Nav for Transactional Flow) */}
        <section className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBRNMDMPuf4kR6smjG3vvK8bNUvJ0MV6c9Afqw8XKzUN_BrQ5ISfQjRh7kKtvW8czonJtJzTgYVPKm8LxAgRxQTsWey9Z05ob9ys5HeiYOJNmkSUxFLhxlDAy7T8E-0mva5wV-U2tFOpbRAvWlREpF-7_jrCyXgx7j6koH_CuyGZAmMYMLs5bQTI0SOLSximsH3B4sMKa_Q0e0QymrDHY1ENr84tRhjUI7tom1g7Jl60fUXu3iOYqaZNa54QStuE9_nwRdcBwByHic')",
            }}
          ></div>
          {/* Dark/Green Gradient Tint */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/95 via-primary/80 to-transparent"></div>
          
          {/* Ambient Glow */}
          <div className="absolute top-1/4 -right-16 w-80 h-80 bg-white/10 rounded-full blur-[80px] pointer-events-none z-0"></div>

          {/* Content Overlay */}
          <div className="relative z-10 px-10 max-w-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-1 bg-white/30 rounded-full"></div>
              <span className="text-[10px] text-white/90 font-bold uppercase tracking-widest">
                Enterprise Pharma Distribution
              </span>
            </div>
            <h1 className="font-heading font-extrabold text-4xl lg:text-[40px] lg:leading-[48px] text-white leading-tight">
              Masuk ke Ekosistem <br />Digital Farmasi Terpercaya
            </h1>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
              Mengelola rantai pasok farmasi dengan presisi klinis, transparansi data, dan kepatuhan penuh terhadap standar industri.
            </p>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 flex items-center gap-3 border border-white/20 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white font-bold">BPOM Compliance</p>
                  <p className="text-[10px] text-white/60 font-mono">Terverifikasi Sistem Elektronik</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 flex items-center gap-3 border border-white/20 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Gavel className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-white font-bold">Sertifikasi CDOB</p>
                  <p className="text-[10px] text-white/60 font-mono">Cara Distribusi Obat Baik</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Subtle Decorative Element */}
          <div className="absolute bottom-8 left-8 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
          </div>
        </section>
 
        {/* Right Side: Authentication Form */}
        <section className="w-full lg:w-1/2 flex items-center justify-center relative p-6 bg-white">
          {/* Mobile Top Navigation Header */}
          <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 h-16 backdrop-blur-xl bg-white/70 border-b border-outline-variant/15 md:hidden">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              <span className="font-heading font-extrabold text-sm text-primary">PBF Online</span>
            </div>
            <Link
              href="/register"
              className="text-xs font-bold text-primary px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10 hover:bg-primary/10 transition-all"
            >
              Daftar
            </Link>
          </header>

          {/* Radial Gradient Background Mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-50/40 via-white to-slate-50 pointer-events-none z-0"></div>
          
          {/* Ambient Glow */}
          <div className="absolute bottom-12 -right-12 w-72 h-72 bg-primary/5 rounded-full blur-[80px] pointer-events-none z-0"></div>

          <div className="w-full max-w-md space-y-6 md:space-y-8 relative z-10 pt-16 md:pt-0">
            {/* Brand Anchor (Desktop) */}
            <div className="hidden md:flex flex-col items-center">
              <Link href="/">
                <img
                  src="https://www.groovyrx.com/store/1/logogroovyrx.png"
                  alt="GroovyRx Logo"
                  className="h-12 w-auto object-contain hover:scale-[1.02] transition-transform duration-200"
                />
              </Link>
            </div>

            {/* Mobile Brand & Header */}
            <div className="flex flex-col items-center text-center mb-6 md:hidden">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/10">
                <span className="material-symbols-outlined text-primary text-3xl">clinical_notes</span>
              </div>
              <h2 className="font-heading font-extrabold text-xl text-slate-800 mb-1">Login Terpadu</h2>
              <p className="text-xs text-on-surface-variant max-w-[280px]">Satu pintu untuk Pelanggan, Admin, dan Logistik</p>
            </div>
 
            {/* LoginForm container card */}
            <div className="bg-white/80 md:bg-white/45 backdrop-blur-lg border border-outline-variant/15 md:border-white/50 rounded-2xl md:rounded-3xl shadow-lg md:shadow-xl hover:shadow-2xl transition-all duration-300 p-6 md:p-10 space-y-6">
              <div className="hidden md:block space-y-1.5">
                <h3 className="font-heading font-extrabold text-2xl text-slate-800">Login Terpadu</h3>
                <p className="text-xs text-on-surface-variant/80 font-medium">
                  Satu pintu untuk Pelanggan, Admin, dan Logistik
                </p>
              </div>
 
              <LoginForm />
            </div>

            {/* Mobile Trust Signals */}
            <section className="w-full space-y-4 md:hidden pt-2">
              <div className="flex items-center gap-2 px-2">
                <div className="h-[1px] flex-1 bg-outline-variant/20"></div>
                <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/50 font-bold">Keamanan Terjamin</span>
                <div className="h-[1px] flex-1 bg-outline-variant/20"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-md rounded-xl border border-outline-variant/20 shadow-sm">
                  <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-full text-primary shrink-0">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-on-surface-variant/60 font-bold leading-tight font-mono">ENCRYPTION</span>
                    <span className="text-[10px] font-bold text-slate-800">AES-256</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-md rounded-xl border border-outline-variant/20 shadow-sm">
                  <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-full text-primary shrink-0">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-on-surface-variant/60 font-bold leading-tight font-mono">CERTIFIED</span>
                    <span className="text-[10px] font-bold text-slate-800">ISO 27001</span>
                  </div>
                </div>
              </div>
            </section>
 
            {/* Global App Footer (Simplified for Login) */}
            <footer className="text-center space-y-2 pb-6 md:pb-0">
              <p className="text-[10px] text-on-surface-variant/40 font-mono">
                &copy; {new Date().getFullYear()} PBF Online. Secure Pharmaceutical Distribution Systems.
              </p>
              <div className="flex justify-center gap-4 text-[10px] text-on-surface-variant/60 font-bold">
                <Link className="hover:text-primary transition-colors underline" href="#">
                  Privacy Policy
                </Link>
                <Link className="hover:text-primary transition-colors underline" href="#">
                  Security Audit
                </Link>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
