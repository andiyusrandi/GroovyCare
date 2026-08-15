"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { validateResetToken, resetPasswordWithToken } from "@/app/actions/password-reset";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
} from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<{ valid: boolean; email?: string; message?: string }>({
    valid: false,
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Password Validation Rules
  const isMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
  const isMatching = newPassword !== "" && newPassword === confirmPassword;
  const isPasswordValid = isMinLength && hasUpper && hasLower && hasNumber && hasSymbol && isMatching;

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setTokenInfo({ valid: false, message: "Tautan reset tidak memiliki token pemulihan." });
        setValidatingToken(false);
        return;
      }
      try {
        const res = await validateResetToken(token);
        setTokenInfo(res);
      } catch (err: any) {
        setTokenInfo({ valid: false, message: "Gagal memverifikasi token pemulihan." });
      } finally {
        setValidatingToken(false);
      }
    }
    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await resetPasswordWithToken(token, newPassword);
      setResult(res);

      if (res.success) {
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 3000);
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "Terjadi kesalahan saat memperbarui kata sandi.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center py-12 space-y-3">
        <span className="animate-spin h-7 w-7 border-3 border-emerald-600 border-t-transparent rounded-full inline-block"></span>
        <p className="text-xs text-slate-500 font-bold">Memverifikasi keabsahan token pemulihan CDOB...</p>
      </div>
    );
  }

  if (!tokenInfo.valid) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4 text-center">
        <div className="w-12 h-12 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Tautan Pemulihan Tidak Valid</h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          {tokenInfo.message || "Tautan reset kata sandi telah kedaluwarsa atau sudah pernah digunakan."}
        </p>
        <div className="pt-2">
          <Link
            href="/forgot-password"
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 text-decoration-none"
          >
            Minta Tautan Pemulihan Baru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
      
      {/* Header Card */}
      <div className="text-center space-y-1.5">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200/60 flex items-center justify-center mx-auto shadow-2xs">
          <Lock className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
          Atur Ulang Kata Sandi
        </h1>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Akun: <span className="font-bold text-slate-800 font-mono">{tokenInfo.email}</span>
        </p>
      </div>

      {/* Alert Result */}
      {result && (
        <div
          className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 animate-fadeIn ${
            result.success
              ? "bg-emerald-50/90 border-emerald-200 text-emerald-900"
              : "bg-rose-50/90 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{result.success ? "Kata Sandi Berhasil Diperbarui!" : "Gagal Memperbarui"}</p>
              <p>{result.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-600">
            Kata Sandi Baru
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition-all pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-600">
            Konfirmasi Kata Sandi Baru
          </label>
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition-all"
          />
        </div>

        {/* Password Strength Checklist */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-[11px]">
          <span className="font-extrabold uppercase text-[9px] tracking-wider text-slate-500 block">
            Persyaratan Keamanan Kata Sandi:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600 font-medium">
            <div className={`flex items-center gap-1.5 ${isMinLength ? "text-emerald-700 font-bold" : ""}`}>
              {isMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
              <span>Minimal 8 Karakter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-700 font-bold" : ""}`}>
              {hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
              <span>Huruf Besar (A-Z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-700 font-bold" : ""}`}>
              {hasLower ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
              <span>Huruf Kecil (a-z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-700 font-bold" : ""}`}>
              {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
              <span>Angka (0-9)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasSymbol ? "text-emerald-700 font-bold" : ""}`}>
              {hasSymbol ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
              <span>Simbol (@$!%*?&)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${isMatching ? "text-emerald-700 font-bold" : ""}`}>
              {isMatching ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
              <span>Konfirmasi Cocok</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isPasswordValid}
          className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Memperbarui Kata Sandi...
            </>
          ) : (
            <>
              <span>Simpan Kata Sandi Baru</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Security Note */}
      <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 flex items-start gap-2 text-[11px] text-emerald-900 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          Setelah kata sandi disimpan, seluruh sesi login aktif pada perangkat lain akan dinonaktifkan secara otomatis.
        </div>
      </div>

    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between select-none">
      {/* Top Header App Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="https://res.cloudinary.com/rumahhostcom/image/upload/v1785321525/logo_care_fcfgwq.png"
              alt="GroovyCare Logo"
              className="h-6 sm:h-7 w-auto object-contain shrink-0"
            />
            <span className="hidden sm:inline-flex bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
              CDOB System
            </span>
          </div>

          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors text-decoration-none"
          >
            Halaman Login
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        <Suspense
          fallback={
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center py-12">
              <span className="animate-spin h-7 w-7 border-3 border-emerald-600 border-t-transparent rounded-full inline-block"></span>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </main>

      {/* Footer Mobile */}
      <footer className="bg-slate-50 border-t border-slate-200/80 pt-6 pb-8 px-4 font-sans text-center">
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="font-extrabold text-slate-800 text-sm tracking-tight font-heading">GroovyCare PBF System</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
              CDOB
            </span>
          </div>
          <p className="text-[10px] font-medium text-slate-500">
            &copy; {new Date().getFullYear()} PT GroovyRx Pharmaceutical Group. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
