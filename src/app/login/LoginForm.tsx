"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, quickLogin } from "@/app/actions/auth";

interface LoginFormProps {
  logoUrl?: string;
}

export default function LoginForm({ logoUrl }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [isDevAccessOpen, setIsDevAccessOpen] = useState(false);

  const isDev = process.env.NODE_ENV !== "production";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const res = await login(formData);

      if (res.success && res.role) {
        const target = res.role === "PBF_ADMIN" || res.role === "SYSTEM_ADMIN" ? "/admin/dashboard" : "/customer/dashboard";
        window.location.href = target;
      } else {
        setError(res.error || "Login gagal, silakan periksa email & password Anda.");
        setLoading(false);
      }
    } catch (err: any) {
      setError("Terjadi kesalahan: " + (err.message || err));
      setLoading(false);
    }
  };

  const handleQuickLogin = async (roleType: "CUSTOMER_USER" | "PBF_ADMIN" | "EXPIRED_USER", label: string) => {
    setError(null);
    setSimulating(label);
    setLoading(true);

    try {
      const res = await quickLogin(roleType);

      if (res.success && res.role) {
        const target = res.role === "PBF_ADMIN" || res.role === "SYSTEM_ADMIN" ? "/admin/dashboard" : "/customer/dashboard";
        window.location.href = target;
      } else {
        setError(res.error || `Gagal simulasi login sebagai ${label}`);
        setLoading(false);
        setSimulating(null);
      }
    } catch (err: any) {
      setError("Gagal simulasi: " + (err.message || err));
      setLoading(false);
      setSimulating(null);
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* Logo tepat di atas judul Masuk ke Akun (Mobile Enriched w-auto max-w-[210px]) */}
      {logoUrl && (
        <div className="flex justify-center sm:justify-start mb-4">
          <Link href="/" className="inline-block">
            <img
              src={logoUrl}
              alt="Logo PBF Online"
              className="h-10 sm:h-9 max-w-[210px] w-auto object-contain"
            />
          </Link>
        </div>
      )}

      {/* Brand Header / Title Single Hierarchy */}
      <div className="text-center sm:text-left space-y-1">
        <h2 className="font-heading font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
          Masuk ke Akun
        </h2>
        <p className="text-xs text-slate-600 sm:text-slate-500 font-normal leading-relaxed">
          Silakan masukkan kredensial akun Apotek atau Sarana PBF Anda.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-base text-rose-500 shrink-0 mt-0.5">
            error
          </span>
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Email Input */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Email Bisnis <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="apotek@domain.com"
            className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium text-slate-900 transition-all placeholder:text-slate-400 shadow-2xs"
          />
        </div>

        {/* Password Input dengan Toggle Visibility */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor="password-input" className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Kata Sandi <span className="text-rose-500">*</span>
            </label>
          </div>
          <div className="relative flex items-center">
            <input
              id="password-input"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 pl-4 pr-11 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium text-slate-900 transition-all placeholder:text-slate-400 shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
              aria-label="Toggle Password Visibility"
            >
              <span className="material-symbols-outlined text-lg">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
          <div className="flex justify-end pt-1">
            <Link href="#" className="text-xs font-semibold text-emerald-600 hover:underline py-1">
              Lupa Kata Sandi?
            </Link>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-2 bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
          ) : (
            <span>Masuk Sekarang</span>
          )}
        </button>
      </form>

      {/* Register Link */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-500">
          Belum memiliki akses?{" "}
          <Link href="/register" className="font-bold text-slate-900 hover:text-emerald-600 transition-colors ml-1">
            Daftar Mitra
          </Link>
        </p>
      </div>

      {/* Quick Dev Access (Hanya muncul jika bukan production / isDev) */}
      {isDev && (
        <div className="pt-4 border-t border-slate-100 w-full">
          <button
            type="button"
            onClick={() => setIsDevAccessOpen((prev) => !prev)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-slate-600 py-1.5 transition-colors border-none bg-transparent cursor-pointer"
          >
            <span>QUICK DEV ACCESS</span>
            <span className="material-symbols-outlined text-sm">
              {isDevAccessOpen ? "expand_less" : "expand_more"}
            </span>
          </button>

          {isDevAccessOpen && (
            <div className="mt-2 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80 animate-in fade-in duration-200">
              <p className="text-[10px] text-slate-400 font-medium">Pilih peran akun untuk pengujian cepat:</p>
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin("CUSTOMER_USER", "Apotek Sehat Jaya")}
                  className="w-full py-2 px-3 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-left text-xs font-semibold text-slate-800 flex items-center justify-between transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <span>1. Apotek Sehat Jaya (Customer)</span>
                  {simulating === "Apotek Sehat Jaya" ? (
                    <span className="material-symbols-outlined animate-spin text-sm text-emerald-600">progress_activity</span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-600">Login →</span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin("PBF_ADMIN", "Admin PBF")}
                  className="w-full py-2 px-3 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg text-left text-xs font-semibold text-slate-800 flex items-center justify-between transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <span>2. Admin PBF GroovyRx</span>
                  {simulating === "Admin PBF" ? (
                    <span className="material-symbols-outlined animate-spin text-sm text-emerald-600">progress_activity</span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-600">Login →</span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin("EXPIRED_USER", "Apotek Kadaluwarsa")}
                  className="w-full py-2 px-3 bg-white border border-slate-200 hover:border-rose-400 rounded-lg text-left text-xs font-semibold text-slate-800 flex items-center justify-between transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  <span>3. Apotek Kritis SIA (Warning)</span>
                  {simulating === "Apotek Kadaluwarsa" ? (
                    <span className="material-symbols-outlined animate-spin text-sm text-rose-600">progress_activity</span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-600">Login →</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
