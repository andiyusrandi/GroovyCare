"use client";

import { useState } from "react";
import { login, quickLogin } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { AlertTriangle, ShieldAlert } from "lucide-react";
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
        <div className="mx-auto w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center border border-slate-200 shadow-xs">
          <span className="material-symbols-outlined text-[28px] font-bold">smartphone</span>
        </div>
        
        <div className="space-y-1.5">
          <h3 className="font-heading font-bold text-base text-slate-900">Gunakan Aplikasi Resmi</h3>
          <p className="text-xs text-slate-500 leading-relaxed px-2">
            Demi menjaga keamanan transaksi Cold Chain serta kepatuhan regulasi CDOB BPOM, akses web mobile dinonaktifkan.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-600 leading-relaxed text-left flex gap-2.5">
          <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Kepatuhan CDOB:</strong> Silakan gunakan PC/Laptop untuk akses portal web, atau unduh aplikasi mobile resmi.
          </span>
        </div>

        <div className="pt-2">
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-950 text-white rounded-xl hover:bg-slate-900 active:scale-[0.98] transition-all shadow-xs text-left cursor-pointer mx-auto border border-slate-800"
          >
            <svg viewBox="0 0 512 512" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            Belum terdaftar?{" "}
            <Link className="text-emerald-700 font-bold hover:underline" href="/register">
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Input Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block" htmlFor="email">
            Email Bisnis
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@perusahaan.co.id"
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-900 transition-colors font-medium text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Input Password */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-700" htmlFor="password">
              Kata Sandi
            </label>
            <Link href="#" className="text-xs text-slate-400 hover:text-slate-900 transition-colors">
              Lupa?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-900 transition-colors font-medium text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-semibold uppercase tracking-wider cursor-pointer"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* CTA Button Minimal */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Memproses..." : "Masuk Sekarang"}
        </button>
      </form>

      {/* Register Link */}
      <div className="text-center pt-1">
        <p className="text-xs text-slate-400">
          Belum memiliki akses?{" "}
          <Link href="/register" className="font-semibold text-slate-900 hover:underline">
            Daftar Mitra
          </Link>
        </p>
      </div>

      {/* Dev Mode Simulator (Horizontal 3-Col Pipih) */}
      <div className="pt-6 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
            Quick Dev Access
          </span>
          <span className="text-[9px] font-mono text-slate-400">DEV MODE</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin("CUSTOMER_USER", "Apotek Sehat")}
            disabled={simulating !== null}
            className="py-2 px-2 text-[10px] font-medium bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-md border border-slate-200/80 transition-colors truncate text-center cursor-pointer"
          >
            Apotek Sehat
          </button>
          
          <button
            type="button"
            onClick={() => handleQuickLogin("EXPIRED_USER", "Apotek Expired")}
            disabled={simulating !== null}
            className="py-2 px-2 text-[10px] font-medium bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-md border border-slate-200/80 transition-colors truncate text-center cursor-pointer"
          >
            Blocked SIA
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("PBF_ADMIN", "PBF Admin")}
            disabled={simulating !== null}
            className="py-2 px-2 text-[10px] font-medium bg-slate-50 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 rounded-md border border-slate-200/80 transition-colors truncate text-center cursor-pointer"
          >
            Admin PBF
          </button>
        </div>

        {simulating && (
          <p className="text-[10px] text-center text-emerald-600 font-mono animate-pulse mt-1">
            Memuat sesi {simulating}...
          </p>
        )}
      </div>
    </div>
  );
}
