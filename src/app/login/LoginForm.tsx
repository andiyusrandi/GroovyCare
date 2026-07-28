"use client";

import { useState } from "react";
import { login, quickLogin } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  LockKeyhole,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useMobileBrowser } from "@/hooks/useMobileBrowser";

export default function LoginForm() {
  const router = useRouter();
  const isMobileBrowser = useMobileBrowser();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (isMobileBrowser) {
    return (
      <div className="space-y-6 text-center py-4 font-sans animate-fadeIn">
        <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-sm">
          <span className="material-symbols-outlined text-[32px] font-bold">smartphone</span>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-heading font-extrabold text-base text-slate-900">Gunakan Aplikasi Resmi</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed px-2">
            Demi menjaga keamanan transaksi rantai dingin (<em>Cold Chain</em>) serta kepatuhan regulasi CDOB BPOM, akses masuk (Login) melalui web browser ponsel dinonaktifkan.
          </p>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 text-[10px] text-on-surface-variant leading-relaxed text-left flex gap-3">
          <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <span>
            <strong>Kepatuhan CDOB:</strong> PBF diwajibkan menjamin keabsahan pengguna dan otentikasi e-Sign APJ. Silakan gunakan komputer/laptop untuk akses web, atau unduh aplikasi mobile resmi kami.
          </span>
        </div>

        <div className="pt-2">
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-950 text-white rounded-2xl hover:bg-slate-900 active:scale-[0.98] transition-all shadow-md text-left cursor-pointer mx-auto border border-slate-800"
          >
            <svg viewBox="0 0 512 512" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32.05 16.5C30.2 18.9 29.1 22.4 29.1 26.9v458.2c0 4.5 1.1 8 2.95 10.4l1.55 1.4L261.25 269v-5.25L33.6 15.1l-1.55 1.4z" fill="#00f0ff"/>
              <path d="M338.45 346.5L261.25 269v-5.25L338.45 166l1.8 1c21.8 12.4 60.55 34.6 81.35 46.5 5.95 3.4 9.9 8.9 9.9 15.2 0 6.3-3.95 11.8-9.9 15.2-20.8 11.9-59.55 34.1-81.35 46.6l-1.8 1z" fill="#ffc200"/>
              <path d="M263.15 266.35l-76.3-76.3L32.05 16.5c3.2-3.4 9.1-5.4 16.4-1.2l290 166.1 1.8 1-77.1 76.95z" fill="#ff3a44"/>
              <path d="M263.15 271.65L340.25 348l-291.8 167c-7.3 4.2-13.2 2.2-16.4-1.2L186.85 348l76.3-76.35z" fill="#00e756"/>
            </svg>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold leading-none">Get it on</p>
              <p className="text-xs font-bold font-heading leading-tight mt-0.5">Google Play</p>
            </div>
          </a>
        </div>

        <div className="pt-4 border-t border-outline-variant/20">
          <p className="text-xs text-on-surface-variant font-medium">
            Belum terdaftar sebagai mitra? <br/>
            <Link className="text-primary font-bold hover:underline mt-1 inline-block" href="/register">
              Daftar Mitra di Browser Mobile
            </Link>
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    setLoading(false);
    if (!result.success) {
      setError(result.error || "Gagal masuk");
    } else {
      if (result.role === "PBF_ADMIN" || result.role === "SYSTEM_ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
      router.refresh();
    }
  }

  async function handleQuickLogin(role: "CUSTOMER_USER" | "PBF_ADMIN" | "EXPIRED_USER", label: string) {
    setError(null);
    setSimulating(label);

    const result = await quickLogin(role);
    setSimulating(null);

    if (!result.success) {
      setError(result.error || "Simulasi login gagal");
    } else {
      if (result.role === "PBF_ADMIN" || result.role === "SYSTEM_ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-error flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-on-surface-variant flex justify-between" htmlFor="email">
            Email Bisnis
            <span className="text-[9px] text-on-surface-variant/50 lowercase">info</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 w-4 h-4" />
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/40"
              id="email"
              name="email"
              placeholder="nama@perusahaan.co.id"
              required
              type="email"
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase font-bold text-on-surface-variant" htmlFor="password">
              Kata Sandi
            </label>
            <Link className="text-[10px] text-primary font-bold hover:underline transition-all" href="#">
              Lupa Kata Sandi?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 w-4 h-4" />
            <input
              className="w-full pl-10 pr-12 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/40"
              id="password"
              name="password"
              placeholder="••••••••"
              required
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary transition-colors cursor-pointer"
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Action */}
        <button
          className="w-full py-3.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>{" "}
              Memproses...
            </span>
          ) : (
            <>
              Masuk Sekarang
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 py-2">
        <div className="flex-1 h-[1px] bg-outline-variant/20"></div>
        <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/50 font-bold">
          Keamanan Terjamin
        </span>
        <div className="flex-1 h-[1px] bg-outline-variant/20"></div>
      </div>

      {/* Footer of Card */}
      <div className="text-center space-y-4">
        <p className="text-xs text-on-surface-variant font-medium">
          Belum punya akun?{" "}
          <Link className="text-primary font-bold hover:underline" href="/register">
            Daftar Jadi Mitra
          </Link>
        </p>

        {/* Mini Security Info */}
        <div className="flex justify-center items-center gap-4 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/10 text-[9px] text-on-surface-variant/75 font-bold font-mono">
          <div className="flex items-center gap-1">
            <LockKeyhole className="w-3.5 h-3.5 text-on-surface-variant/50" />
            <span>AES-256</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-outline-variant/30"></div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-on-surface-variant/50" />
            <span>ISO 27001</span>
          </div>
        </div>
      </div>

      {/* Simulator Akses Cepat */}
      <div className="relative pt-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant/20" />
        </div>
        <div className="relative flex justify-center text-[9px] uppercase">
          <span className="px-3 bg-white text-on-surface-variant/65 font-bold">Simulator Akses Cepat</span>
        </div>
      </div>

      <div className="space-y-3 bg-surface-container-low p-4 border border-outline-variant/20 rounded-2xl">
        <button
          type="button"
          onClick={() => handleQuickLogin("CUSTOMER_USER", "Apotek Sehat")}
          disabled={simulating !== null}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant hover:text-foreground transition-all shadow-sm cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" />
            Apotek Sehat Farma (Mitra Aktif)
          </span>
          <span className="text-on-surface-variant/50 text-[9px]">Customer Portal</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickLogin("EXPIRED_USER", "Apotek Expired")}
          disabled={simulating !== null}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant hover:text-foreground transition-all shadow-sm cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            Apotek Sejahtera (SIA/SIPA Expired)
          </span>
          <span className="text-on-surface-variant/50 text-[9px]">CDOB Block Demo</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickLogin("PBF_ADMIN", "PBF Admin")}
          disabled={simulating !== null}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white hover:bg-surface-container border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant hover:text-foreground transition-all shadow-sm cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            Apoteker Sarah (PBF Admin)
          </span>
          <span className="text-on-surface-variant/50 text-[9px]">Admin Portal</span>
        </button>

        {simulating && (
          <p className="text-[10px] text-center text-primary font-bold animate-pulse mt-2 font-sans">
            Memuat sesi simulasi untuk {simulating}...
          </p>
        )}
      </div>
    </div>
  );
}
