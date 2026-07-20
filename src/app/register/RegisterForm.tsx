"use client";

import { useState } from "react";
import { registerInstitution } from "@/app/actions/auth";
import { CheckCircle, AlertTriangle, UploadCloud, FileText } from "lucide-react";
import Link from "next/link";

const typeConfigs = {
  APOTEK: {
    saranaLabel: "Nama Apotek",
    saranaPlaceholder: "Apotek Sehat Jaya",
    permitLabel: "Nomor SIA (Surat Izin Apotek)",
    permitPlaceholder: "SIA/123/ABC/2024",
    permitExpiryLabel: "Masa Berlaku SIA",
    permitUploadLabel: "Upload File SIA",
    apjNameLabel: "Nama APJ (Apoteker PJ)",
    apjNamePlaceholder: "Apt. Nama Lengkap, S.Farm",
    apjPermitLabel: "Nomor SIPA",
    apjPermitPlaceholder: "SIPA/456/DEF/2024",
    apjPermitExpiryLabel: "Masa Berlaku SIPA",
    apjPermitUploadLabel: "Upload File SIPA",
    confirmText: "Saya menyatakan bahwa seluruh data dan dokumen yang diberikan adalah benar dan sah sesuai regulasi Farmasi di Indonesia."
  },
  KLINIK: {
    saranaLabel: "Nama Klinik",
    saranaPlaceholder: "Klinik Keluarga Sehat",
    permitLabel: "Nomor Izin Operasional Klinik",
    permitPlaceholder: "KLINIK-IZIN/123/2024",
    permitExpiryLabel: "Masa Berlaku Izin Klinik",
    permitUploadLabel: "Upload File Izin Klinik",
    apjNameLabel: "Nama APJ (Apoteker PJ)",
    apjNamePlaceholder: "Apt. Nama Lengkap, S.Farm",
    apjPermitLabel: "Nomor SIPA",
    apjPermitPlaceholder: "SIPA/456/DEF/2024",
    apjPermitExpiryLabel: "Masa Berlaku SIPA",
    apjPermitUploadLabel: "Upload File SIPA",
    confirmText: "Saya menyatakan bahwa seluruh data dan dokumen yang diberikan adalah benar dan sah sesuai regulasi Fasilitas Kesehatan di Indonesia."
  },
  RUMAH_SAKIT: {
    saranaLabel: "Nama Rumah Sakit",
    saranaPlaceholder: "RSUD Harapan Bangsa",
    permitLabel: "Nomor Izin Operasional Rumah Sakit",
    permitPlaceholder: "RS-IZIN/999/2024",
    permitExpiryLabel: "Masa Berlaku Izin RS",
    permitUploadLabel: "Upload File Izin RS",
    apjNameLabel: "Nama APJ (Apoteker PJ)",
    apjNamePlaceholder: "Apt. Nama Lengkap, S.Farm",
    apjPermitLabel: "Nomor SIPA",
    apjPermitPlaceholder: "SIPA/456/DEF/2024",
    apjPermitExpiryLabel: "Masa Berlaku SIPA",
    apjPermitUploadLabel: "Upload File SIPA",
    confirmText: "Saya menyatakan bahwa seluruh data dan dokumen yang diberikan adalah benar dan sah sesuai regulasi Fasilitas Kesehatan & Rumah Sakit di Indonesia."
  },
  PBF: {
    saranaLabel: "Nama PBF / Distributor",
    saranaPlaceholder: "PBF Medika Utama",
    permitLabel: "Nomor Izin PBF / Sertifikat Standar",
    permitPlaceholder: "PBF/789/XYZ/2024",
    permitExpiryLabel: "Masa Berlaku Izin PBF",
    permitUploadLabel: "Upload File Izin PBF",
    apjNameLabel: "Nama APJ (Apoteker PJ)",
    apjNamePlaceholder: "Apt. Nama Lengkap, S.Farm",
    apjPermitLabel: "Nomor SIPA",
    apjPermitPlaceholder: "SIPA/456/DEF/2024",
    apjPermitExpiryLabel: "Masa Berlaku SIPA",
    apjPermitUploadLabel: "Upload File SIPA",
    confirmText: "Saya menyatakan bahwa seluruh data dan dokumen yang diberikan adalah benar dan sah sesuai regulasi Cara Distribusi Obat yang Baik (CDOB) di Indonesia."
  },
  PERUSAHAAN_UMUM: {
    saranaLabel: "Nama Perusahaan / Toko Obat",
    saranaPlaceholder: "PT Obat Sehat Makmur / Toko Obat Indah",
    permitLabel: "Nomor SITO / NIB / Izin Usaha",
    permitPlaceholder: "NIB-1234567890 / SITO-2024",
    permitExpiryLabel: "Masa Berlaku Izin Usaha",
    permitUploadLabel: "Upload File SITO / NIB / Izin Usaha",
    apjNameLabel: "Nama Penanggung Jawab Teknis / APJ",
    apjNamePlaceholder: "Nama Lengkap Penanggung Jawab",
    apjPermitLabel: "Nomor SIPTTK / SIPA",
    apjPermitPlaceholder: "SIPTTK/123/GHI/2024",
    apjPermitExpiryLabel: "Masa Berlaku SIPTTK / SIPA",
    apjPermitUploadLabel: "Upload File SIPTTK / SIPA",
    confirmText: "Saya menyatakan bahwa seluruh data dan dokumen yang diberikan adalah benar dan sah sesuai regulasi perizinan usaha obat di Indonesia."
  }
};

type InstitutionType = keyof typeof typeConfigs;

export default function RegisterForm() {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [institutionType, setInstitutionType] = useState<InstitutionType>("APOTEK");
  const [step, setStep] = useState(1);

  const [siaFile, setSiaFile] = useState<{ name: string; size: string; progress: number; status: "uploading" | "done"; dataUrl?: string } | null>(null);
  const [sipaFile, setSipaFile] = useState<{ name: string; size: string; progress: number; status: "uploading" | "done"; dataUrl?: string } | null>(null);

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
    } else {
      window.location.href = "/";
    }
  };

  const config = typeConfigs[institutionType];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "sia" | "sipa") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const newFile = {
      name: file.name,
      size: sizeStr,
      progress: 0,
      status: "uploading" as const
    };

    if (type === "sia") {
      setSiaFile(newFile);
    } else {
      setSipaFile(newFile);
    }

    // Read file as base64 Data URL
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (type === "sia") {
        setSiaFile(prev => prev ? { ...prev, dataUrl } : null);
      } else {
        setSipaFile(prev => prev ? { ...prev, dataUrl } : null);
      }
    };
    reader.readAsDataURL(file);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      if (type === "sia") {
        setSiaFile(prev => prev ? { ...prev, progress: currentProgress } : null);
      } else {
        setSipaFile(prev => prev ? { ...prev, progress: currentProgress } : null);
      }

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          if (type === "sia") {
            setSiaFile(prev => prev ? { ...prev, status: "done" } : null);
          } else {
            setSipaFile(prev => prev ? { ...prev, status: "done" } : null);
          }
        }, 100);
      }
    }, 150);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      institutionName: formData.get("institutionName") as string,
      institutionType: institutionType,
      siaNumber: formData.get("siaNumber") as string,
      siaExpiry: "2099-12-31",
      siaFileUrl: siaFile?.dataUrl || undefined,
      address: formData.get("address") as string,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      phone: formData.get("phone") as string,
      sipaNumber: formData.get("sipaNumber") as string,
      sipaExpiry: formData.get("sipaExpiry") as string,
      sipaFileUrl: sipaFile?.dataUrl || undefined,
    };

    // Validasi sederhana
    if (Object.values(data).some((val) => !val)) {
      setError("Semua bidang formulir wajib diisi");
      setLoading(false);
      return;
    }

    if (!siaFile || siaFile.status !== "done" || !sipaFile || sipaFile.status !== "done") {
      setError("Harap unggah dokumen legalitas sarana dan penanggung jawab yang valid terlebih dahulu");
      setLoading(false);
      return;
    }

    const checkbox = formData.get("confirmValidity");
    if (!checkbox) {
      setError("Anda harus menyetujui pernyataan kebenaran data");
      setLoading(false);
      return;
    }

    const result = await registerInstitution(data);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Gagal melakukan registrasi");
    } else {
      setSuccess(result.message || "Pendaftaran sukses!");
      e.currentTarget.reset();
      setSiaFile(null);
      setSipaFile(null);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8 space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
          <CheckCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-heading font-bold text-foreground">Pendaftaran Berhasil!</h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">{success}</p>
        </div>
        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-md text-xs font-bold text-white bg-primary hover:bg-primary/95 transition-all cursor-pointer"
          >
            Masuk ke Login Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8" id="registrationForm">
      {/* Mobile Top Navigation Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm h-16 flex md:hidden justify-between items-center px-4 border-b border-outline-variant/15">
        <button
          type="button"
          onClick={handleBack}
          className="material-symbols-outlined text-primary p-2 active:scale-95 transition-transform"
        >
          arrow_back
        </button>
        <h1 className="font-heading font-extrabold text-sm text-primary">PBF Registration</h1>
        <button
          type="button"
          onClick={() => alert("Silakan hubungi customer service kami jika memerlukan bantuan.")}
          className="material-symbols-outlined text-on-surface-variant p-2 active:scale-95 transition-transform"
        >
          help
        </button>
      </header>

      {/* Multi-step Progress Indicator (Mobile) */}
      <div className="md:hidden px-4 py-4 bg-white border-b border-outline-variant/10 sticky top-16 z-40 -mx-6 sm:-mx-8">
        <div className="flex items-center justify-between w-full overflow-x-auto no-scrollbar space-x-2">
          {/* Step 1: Akun */}
          <div className="flex flex-col items-center min-w-[65px]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs font-bold transition-all duration-300 ${
              step >= 1 ? "bg-primary text-white shadow-md ring-4 ring-primary/10" : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: step >= 1 ? "'FILL' 1" : "'FILL' 0" }}>person</span>
            </div>
            <span className={`text-[9px] font-bold text-center ${step >= 1 ? "text-primary" : "text-slate-400"}`}>Akun</span>
          </div>
          <div className={`flex-1 h-[2px] min-w-[15px] mb-4 transition-colors duration-300 ${step >= 2 ? "bg-primary" : "bg-slate-200"}`}></div>

          {/* Step 2: Sarana */}
          <div className="flex flex-col items-center min-w-[65px]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs font-bold transition-all duration-300 ${
              step >= 2 ? "bg-primary text-white shadow-md ring-4 ring-primary/10" : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: step >= 2 ? "'FILL' 1" : "'FILL' 0" }}>store</span>
            </div>
            <span className={`text-[9px] font-bold text-center ${step >= 2 ? "text-primary" : "text-slate-400"}`}>Sarana</span>
          </div>
          <div className={`flex-1 h-[2px] min-w-[15px] mb-4 transition-colors duration-300 ${step >= 3 ? "bg-primary" : "bg-slate-200"}`}></div>

          {/* Step 3: Legalitas */}
          <div className="flex flex-col items-center min-w-[65px]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs font-bold transition-all duration-300 ${
              step >= 3 ? "bg-primary text-white shadow-md ring-4 ring-primary/10" : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: step >= 3 ? "'FILL' 1" : "'FILL' 0" }}>description</span>
            </div>
            <span className={`text-[9px] font-bold text-center ${step >= 3 ? "text-primary" : "text-slate-400"}`}>Legalitas</span>
          </div>
          <div className={`flex-1 h-[2px] min-w-[15px] mb-4 transition-colors duration-300 ${step >= 4 ? "bg-primary" : "bg-slate-200"}`}></div>

          {/* Step 4: APJ */}
          <div className="flex flex-col items-center min-w-[65px]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs font-bold transition-all duration-300 ${
              step >= 4 ? "bg-primary text-white shadow-md ring-4 ring-primary/10" : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: step >= 4 ? "'FILL' 1" : "'FILL' 0" }}>medical_services</span>
            </div>
            <span className={`text-[9px] font-bold text-center ${step >= 4 ? "text-primary" : "text-slate-400"}`}>APJ</span>
          </div>
        </div>
      </div>

      {/* Mobile Title Section */}
      <div className="md:hidden space-y-1.5 pt-2">
        <h2 className="font-heading font-extrabold text-xl text-slate-800">
          {step === 1 ? "Lengkapi Akun Pengguna" : step === 2 ? "Identitas Sarana" : step === 3 ? "Dokumen Legalitas" : "Apoteker PJ (APJ)"}
        </h2>
        <p className="text-xs text-on-surface-variant/80">
          {step === 1 ? "Silakan isi detail akun untuk memulai proses pendaftaran mitra." : step === 2 ? "Lengkapi informasi alamat dan nomor izin operasional sarana." : step === 3 ? "Unggah file dokumen SIA dan SIPA yang sah (PDF/JPG)." : "Lengkapi data identitas apoteker penanggung jawab."}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-error flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Akun Pengguna */}
      <div className={`space-y-4 ${step !== 1 ? "hidden md:block" : "block"}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
            1
          </span>
          <h3 className="font-heading font-bold text-base text-on-surface">Akun Pengguna</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-outline">Nama Lengkap</label>
            <input
              name="registranName"
              className="px-4 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder="Contoh: Budi Santoso"
              type="text"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-outline">No. WhatsApp</label>
            <input
              name="phone"
              className="px-4 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder="0812xxxx"
              type="tel"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-outline">Email Bisnis</label>
            <input
              name="email"
              className="px-4 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder="email@apotekanda.com"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-outline">Kata Sandi Akun</label>
            <input
              name="password"
              className="px-4 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder="Minimal 6 karakter"
              type="password"
              required
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>

      <hr className="hidden md:block border-outline-variant/20" />
      {/* Section 2: Identitas Sarana */}
      <div className={`space-y-4 ${step !== 2 ? "hidden md:block" : "block"}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
            2
          </span>
          <h3 className="font-heading font-bold text-base text-on-surface">Identitas Sarana</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-outline">Tipe Mitra / Sarana</label>
            <select
              value={institutionType}
              onChange={(e) => setInstitutionType(e.target.value as InstitutionType)}
              className="px-4 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-medium text-on-surface"
            >
              <option value="APOTEK">Apotek</option>
              <option value="KLINIK">Klinik</option>
              <option value="RUMAH_SAKIT">Rumah Sakit</option>
              <option value="PBF">PBF (Pedagang Besar Farmasi) / Distributor</option>
              <option value="PERUSAHAAN_UMUM">Perusahaan Umum / Penjual Obat</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-outline">{config.saranaLabel}</label>
            <input
              name="institutionName"
              className="px-4 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder={config.saranaPlaceholder}
              type="text"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-outline">Alamat Lengkap</label>
            <textarea
              name="address"
              className="px-4 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none font-sans"
              placeholder="Jl. Farmasi No. 123, Jakarta"
              rows={3}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-outline">{config.permitLabel}</label>
            <input
              name="siaNumber"
              className="px-4 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder={config.permitPlaceholder}
              type="text"
              required
            />
          </div>
        </div>
      </div>

      <hr className="hidden md:block border-outline-variant/20" />

      {/* Section 3: Dokumen Legalitas (Upload) */}
      <div className={`space-y-4 ${step !== 3 ? "hidden md:block" : "block"}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
            3
          </span>
          <h3 className="font-heading font-bold text-base text-on-surface">Dokumen Legalitas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dropzone 1 (SIA) */}
          <div className="relative group">
            <label className="text-[10px] uppercase font-bold text-outline mb-2 block">{config.permitUploadLabel}</label>
            {!siaFile ? (
              <div className="border-2 border-dashed border-outline-variant/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container-high transition-colors group-hover:border-primary relative cursor-pointer">
                <UploadCloud className="w-8 h-8 text-outline group-hover:text-primary transition-colors" />
                <p className="text-[10px] text-on-surface-variant text-center font-bold">
                  Klik atau tarik file PDF/JPG (Maks 5MB)
                </p>
                <input
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, "sia")}
                />
              </div>
            ) : siaFile.status === "uploading" ? (
              <div className="border border-outline-variant/30 rounded-2xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-foreground truncate max-w-[70%]">{siaFile.name}</span>
                  <span className="text-outline">{siaFile.size}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-100" style={{ width: `${siaFile.progress}%` }}></div>
                </div>
                <p className="text-[10px] text-primary font-bold text-right">Mengunggah... {siaFile.progress}%</p>
              </div>
            ) : (
              <div className="border border-outline-variant/30 rounded-2xl p-4 bg-emerald-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-emerald-600" />
                  <div className="text-[10px]">
                    <p className="font-bold text-foreground truncate max-w-[150px]">{siaFile.name}</p>
                    <p className="text-on-surface-variant/80 mt-0.5">{siaFile.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">Selesai</span>
                  <button
                    type="button"
                    onClick={() => setSiaFile(null)}
                    className="text-error hover:text-red-700 font-bold text-[10px] px-2 py-1 bg-white border border-outline-variant/30 rounded-lg shadow-sm cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dropzone 2 (SIPA) */}
          <div className="relative group">
            <label className="text-[10px] uppercase font-bold text-outline mb-2 block">{config.apjPermitUploadLabel}</label>
            {!sipaFile ? (
              <div className="border-2 border-dashed border-outline-variant/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container-high transition-colors group-hover:border-primary relative cursor-pointer">
                <UploadCloud className="w-8 h-8 text-outline group-hover:text-primary transition-colors" />
                <p className="text-[10px] text-on-surface-variant text-center font-bold">
                  Klik atau tarik file PDF/JPG (Maks 5MB)
                </p>
                <input
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, "sipa")}
                />
              </div>
            ) : sipaFile.status === "uploading" ? (
              <div className="border border-outline-variant/30 rounded-2xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-foreground truncate max-w-[70%]">{sipaFile.name}</span>
                  <span className="text-outline">{sipaFile.size}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-100" style={{ width: `${sipaFile.progress}%` }}></div>
                </div>
                <p className="text-[10px] text-primary font-bold text-right">Mengunggah... {sipaFile.progress}%</p>
              </div>
            ) : (
              <div className="border border-outline-variant/30 rounded-2xl p-4 bg-emerald-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-emerald-600" />
                  <div className="text-[10px]">
                    <p className="font-bold text-foreground truncate max-w-[150px]">{sipaFile.name}</p>
                    <p className="text-on-surface-variant/80 mt-0.5">{sipaFile.size}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">Selesai</span>
                  <button
                    type="button"
                    onClick={() => setSipaFile(null)}
                    className="text-error hover:text-red-700 font-bold text-[10px] px-2 py-1 bg-white border border-outline-variant/30 rounded-lg shadow-sm cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <hr className="hidden md:block border-outline-variant/20" />

      {/* Section 4: APJ */}
      <div className={`space-y-4 ${step !== 4 ? "hidden md:block" : "block"}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
            4
          </span>
          <h3 className="font-heading font-bold text-base text-on-surface">
            {institutionType === "PERUSAHAAN_UMUM" ? "Penanggung Jawab Teknis" : "Apoteker Penanggung Jawab"}
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-outline">{config.apjNameLabel}</label>
            <input
              name="name"
              className="px-4 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
              placeholder={config.apjNamePlaceholder}
              type="text"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-outline">{config.apjPermitLabel}</label>
              <input
                name="sipaNumber"
                className="px-4 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                placeholder={config.apjPermitPlaceholder}
                type="text"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-outline">{config.apjPermitExpiryLabel}</label>
              <input
                name="sipaExpiry"
                className="px-4 py-2.5 text-xs rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                type="date"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`pt-4 ${step !== 4 ? "hidden md:block" : "block"}`}>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            name="confirmValidity"
            className="mt-1 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer h-4 w-4"
            type="checkbox"
            required
          />
          <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors leading-relaxed font-medium">
            {config.confirmText}
          </span>
        </label>
      </div>

      {/* Desktop Submit Button */}
      <button
        className="hidden md:block w-full py-3.5 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary/95 transition-all duration-300 shadow-md shadow-primary/10 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
        type="submit"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>{" "}
            Memproses...
          </span>
        ) : (
          "Daftar Akun Sekarang"
        )}
      </button>

      {/* Mobile Bottom Action Area */}
      <footer className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md flex flex-col px-6 py-4 pb-safe space-y-2.5 z-50 shadow-2xl border-t border-primary/5">
        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="w-full h-14 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 active:scale-95 transition-all text-sm cursor-pointer"
          >
            <span>Lanjut ke {step === 1 ? "Identitas Sarana" : step === 2 ? "Dokumen Legalitas" : "APJ Penanggung Jawab"}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 active:scale-95 transition-all text-sm disabled:opacity-55 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Memproses...
              </span>
            ) : (
              <>
                <span>Daftar Akun Sekarang</span>
                <span className="material-symbols-outlined text-[18px]">done_all</span>
              </>
            )}
          </button>
        )}
        <p className="text-center text-[10px] text-on-surface-variant/75 font-semibold">
          Langkah {step} dari 4: {step === 1 ? "Informasi Akun" : step === 2 ? "Identitas Sarana" : step === 3 ? "Dokumen Legalitas" : "APJ Penanggung Jawab"}
        </p>
      </footer>
    </form>
  );
}
