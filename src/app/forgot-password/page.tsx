"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/actions/password-reset";
import { Mail, ArrowLeft, ShieldCheck, AlertCircle, CheckCircle2, Copy, ExternalLink, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; devResetUrl?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await requestPasswordReset(email);
      setResult(res);
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "Terjadi kesalahan saat memproses permintaan.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (result?.devResetUrl) {
      navigator.clipboard.writeText(result.devResetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between select-none">
      {/* Top Header App Bar (Native Android M3) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <Link
              className="p-2 -ml-1.5 rounded-full hover:bg-slate-100 active:scale-95 text-slate-700 transition-all flex items-center justify-center shrink-0 text-decoration-none"
              href="/login"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </Link>

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
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200/70 transition-colors text-decoration-none"
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          
          {/* Header Card */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200/60 flex items-center justify-center mx-auto shadow-2xs">
              <KeyRound className="w-7 h-7 stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
              Lupa Kata Sandi Akun
            </h1>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
              Masukkan email bisnis sarana farmasi terdaftar Anda. Kami akan mengirimkan instruksi aman pemulihan kata sandi.
            </p>
          </div>

          {/* Alert Message */}
          {result && (
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 animate-fadeIn ${
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
                <div className="space-y-1">
                  <p className="font-bold">{result.success ? "Permintaan Berhasil Diterima" : "Gagal Memproses Permintaan"}</p>
                  <p>{result.message}</p>
                </div>
              </div>

              {/* Dev Testing Simulation Box */}
              {result.devResetUrl && (
                <div className="mt-3 pt-3 border-t border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-emerald-800">
                    <span>Simulasi Email Reset (Testing Mode)</span>
                    <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono">15 Menit</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-300 font-mono text-[10px] text-slate-700 break-all select-all flex items-center justify-between gap-2">
                    <span className="truncate">{result.devResetUrl}</span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-1 text-emerald-700 hover:bg-emerald-50 rounded transition-colors shrink-0 cursor-pointer border-none"
                      title="Salin Tautan"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {copied && (
                    <p className="text-[10px] text-emerald-700 font-bold text-right animate-fadeIn">✓ Tautan disalin!</p>
                  )}
                  <a
                    href={result.devResetUrl}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all text-decoration-none shadow-2xs"
                  >
                    <span>Buka Tautan Reset Sekarang</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-600 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                Email Bisnis Terdaftar
              </label>
              <input
                type="email"
                required
                placeholder="mitra@apoteksehat.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Memproses Permintaan...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Kirim Instruksi Pemulihan
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-2.5 text-[11px] text-slate-600 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Kepatuhan Keamanan CDOB:</span> Demi keamanan transaksi sediaan farmasi, seluruh permohonan pemulihan kata sandi dicatat dalam log audit resmi PBF.
            </div>
          </div>

          <div className="pt-2 text-center border-t border-slate-100">
            <Link
              href="/login"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-1 text-decoration-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Login</span>
            </Link>
          </div>

        </div>
      </main>

      {/* Footer Mobile (Clean Tonal Light Surface) */}
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
