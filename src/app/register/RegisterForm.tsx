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
    permitUploadLabel: "Upload Berkas SIA (PDF / JPG)",
    apjNameLabel: "Nama Apoteker APJ",
    apjNamePlaceholder: "Apt. Nama Lengkap, S.Farm",
    apjPermitLabel: "Nomor SIPA APJ",
    apjPermitPlaceholder: "SIPA-19900821-2024",
    apjPermitUploadLabel: "Upload Berkas SIPA APJ (PDF / JPG)",
    confirmText: "Saya menyatakan bahwa seluruh data & dokumen legalitas yang diunggah adalah sah dan benar sesuai regulasi CDOB / BPOM RI."
  },
  KLINIK: {
    saranaLabel: "Nama Klinik",
    saranaPlaceholder: "Klinik Keluarga Sehat",
    permitLabel: "Nomor Izin Operasional Klinik",
    permitPlaceholder: "KLINIK-IZIN/123/2024",
    permitUploadLabel: "Upload Berkas Izin Klinik (PDF / JPG)",
    apjNameLabel: "Nama Apoteker APJ",
    apjNamePlaceholder: "Apt. Nama Lengkap, S.Farm",
    apjPermitLabel: "Nomor SIPA APJ",
    apjPermitPlaceholder: "SIPA-19900821-2024",
    apjPermitUploadLabel: "Upload Berkas SIPA APJ (PDF / JPG)",
    confirmText: "Saya menyatakan bahwa seluruh data & dokumen legalitas yang diunggah adalah sah dan benar sesuai regulasi Fasilitas Kesehatan di Indonesia."
  },
  RUMAH_SAKIT: {
    saranaLabel: "Nama Rumah Sakit",
    saranaPlaceholder: "RSUD Harapan Bangsa",
    permitLabel: "Nomor Izin Operasional Rumah Sakit",
    permitPlaceholder: "RS-IZIN/999/2024",
    permitUploadLabel: "Upload Berkas Izin RS (PDF / JPG)",
    apjNameLabel: "Nama Apoteker APJ",
    apjNamePlaceholder: "Apt. Nama Lengkap, S.Farm",
    apjPermitLabel: "Nomor SIPA APJ",
    apjPermitPlaceholder: "SIPA-19900821-2024",
    apjPermitUploadLabel: "Upload Berkas SIPA APJ (PDF / JPG)",
    confirmText: "Saya menyatakan bahwa seluruh data & dokumen legalitas yang diunggah adalah sah dan benar sesuai regulasi Fasilitas Kesehatan & Rumah Sakit."
  },
  PBF: {
    saranaLabel: "Nama PBF / Distributor",
    saranaPlaceholder: "PBF Medika Utama",
    permitLabel: "Nomor Izin PBF / Sertifikat Standar",
    permitPlaceholder: "PBF/789/XYZ/2024",
    permitUploadLabel: "Upload Berkas Izin PBF (PDF / JPG)",
    apjNameLabel: "Nama Apoteker APJ",
    apjNamePlaceholder: "Apt. Nama Lengkap, S.Farm",
    apjPermitLabel: "Nomor SIPA APJ",
    apjPermitPlaceholder: "SIPA-19900821-2024",
    apjPermitUploadLabel: "Upload Berkas SIPA APJ (PDF / JPG)",
    confirmText: "Saya menyatakan bahwa seluruh data & dokumen legalitas yang diunggah adalah sah dan benar sesuai standar CDOB di Indonesia."
  },
  PERUSAHAAN_UMUM: {
    saranaLabel: "Nama Perusahaan / Toko Obat",
    saranaPlaceholder: "PT Obat Sehat Makmur / Toko Obat Indah",
    permitLabel: "Nomor SITO / NIB / Izin Usaha",
    permitPlaceholder: "NIB-1234567890 / SITO-2024",
    permitUploadLabel: "Upload Berkas SITO / NIB / Izin Usaha",
    apjNameLabel: "Nama Penanggung Jawab Teknis / APJ",
    apjNamePlaceholder: "Nama Lengkap Penanggung Jawab",
    apjPermitLabel: "Nomor SIPTTK / SIPA",
    apjPermitPlaceholder: "SIPTTK/123/GHI/2024",
    apjPermitUploadLabel: "Upload Berkas SIPTTK / SIPA",
    confirmText: "Saya menyatakan bahwa seluruh data & dokumen legalitas yang diunggah adalah sah dan benar sesuai perizinan usaha obat di Indonesia."
  }
};

type InstitutionType = keyof typeof typeConfigs;

interface RegisterFormProps {
  logoUrl?: string;
}

export default function RegisterForm({ logoUrl }: RegisterFormProps) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [institutionType, setInstitutionType] = useState<InstitutionType>("APOTEK");
  const [step, setStep] = useState(1);

  // Form State
  const [formDataState, setFormDataState] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    institutionName: "",
    siaNumber: "",
    sipaNumber: "",
    address: "",
    confirmValidity: false,
  });

  const [siaFile, setSiaFile] = useState<{ name: string; size: string; progress: number; status: "uploading" | "done"; dataUrl?: string } | null>(null);
  const [sipaFile, setSipaFile] = useState<{ name: string; size: string; progress: number; status: "uploading" | "done"; dataUrl?: string } | null>(null);

  const config = typeConfigs[institutionType];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setFormDataState((prev) => ({
      ...prev,
      [target.name]: value,
    }));
  };

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
      currentProgress += 20;
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
    }, 80);
  };

  const validateStep1 = () => {
    if (!formDataState.name || !formDataState.email || !formDataState.phone || !formDataState.password) {
      setError("Harap isi seluruh data akun (Nama, Email, WhatsApp, dan Password)");
      return false;
    }
    if (formDataState.password.length < 6) {
      setError("Password minimal 6 karakter");
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!formDataState.institutionName || !formDataState.siaNumber || !formDataState.sipaNumber) {
      setError("Harap isi seluruh data legalitas instansi & nomor izin sarana");
      return false;
    }
    setError(null);
    return true;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!siaFile || siaFile.status !== "done" || !sipaFile || sipaFile.status !== "done") {
      setError("Harap unggah berkas SIA dan SIPA yang valid terlebih dahulu");
      return;
    }

    if (!formDataState.confirmValidity) {
      setError("Anda harus menyetujui pernyataan kebenaran data & dokumen legalitas");
      return;
    }

    setLoading(true);

    const payload = {
      institutionName: formDataState.institutionName,
      institutionType: institutionType,
      siaNumber: formDataState.siaNumber,
      siaExpiry: "2099-12-31",
      siaFileUrl: siaFile?.dataUrl || undefined,
      address: formDataState.address || "Alamat belum dilengkapi (Silakan lengkapi di Pengaturan Akun)",
      name: formDataState.name,
      email: formDataState.email,
      password: formDataState.password,
      phone: formDataState.phone,
      sipaNumber: formDataState.sipaNumber,
      sipaExpiry: "2099-12-31",
      sipaFileUrl: sipaFile?.dataUrl || undefined,
    };

    const result = await registerInstitution(payload);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Gagal melakukan registrasi");
    } else {
      setSuccess(result.message || "Pendaftaran sukses! Akun Anda sedang diverifikasi oleh Tim PBF.");
    }
  }

  if (success) {
    return (
      <div className="max-w-lg w-full mx-auto my-auto text-center py-12 space-y-6">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
            Pendaftaran Mitra Berhasil!
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            {success}
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3 rounded-xl shadow-md text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer border-none shadow-emerald-600/20 active:scale-95"
          >
            Masuk ke Halaman Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col justify-between flex-1">
      
      {/* Header & Content Container */}
      <div className="space-y-6">
        
        {/* Top Bar Logo (Mobile Only) */}
        {logoUrl && (
          <div className="flex items-center justify-between lg:hidden border-b border-slate-100 pb-3">
            <Link href="/">
              <img
                src={logoUrl}
                alt="GroovyRx Logo"
                className="h-7 w-auto object-contain"
              />
            </Link>
            <span className="text-[9px] font-bold font-mono tracking-wider text-emerald-800 bg-emerald-100/80 border border-emerald-200/80 px-2.5 py-0.5 rounded-full uppercase">
              REGISTRASI PBF
            </span>
          </div>
        )}

        {/* Header Form & Step Navigation */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
                Pendaftaran Mitra Baru
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Lengkapi data instansi Anda untuk verifikasi akun PBF.
              </p>
            </div>
            <Link href="/login" className="text-xs font-bold text-emerald-600 hover:underline shrink-0 pt-0.5">
              Sudah ada akun?
            </Link>
          </div>

          {/* Stepper Optimized for Mobile */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 pt-1">
            {/* Step 1 */}
            <div className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${step >= 1 ? "text-emerald-600" : "text-slate-400"}`}>
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-extrabold shrink-0 ${step >= 1 ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-400"}`}>
                1
              </div>
              <span className="truncate">Info Akun</span>
            </div>
            
            <div className={`h-0.5 flex-1 mx-1.5 sm:mx-3 rounded-full transition-colors ${step >= 2 ? "bg-emerald-500" : "bg-slate-100"}`} />

            {/* Step 2 */}
            <div className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${step >= 2 ? "text-emerald-600" : "text-slate-400"}`}>
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-extrabold shrink-0 ${step >= 2 ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-400"}`}>
                2
              </div>
              <span className="hidden sm:inline">Data Legalitas</span>
              <span className="sm:hidden">Legalitas</span>
            </div>

            <div className={`h-0.5 flex-1 mx-1.5 sm:mx-3 rounded-full transition-colors ${step >= 3 ? "bg-emerald-500" : "bg-slate-100"}`} />

            {/* Step 3 */}
            <div className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${step >= 3 ? "text-emerald-600" : "text-slate-400"}`}>
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-extrabold shrink-0 ${step >= 3 ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-400"}`}>
                3
              </div>
              <span className="hidden sm:inline">Upload Berkas</span>
              <span className="sm:hidden">Berkas</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3 text-xs text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ================= STEP 1: INFO AKUN & REGISTRAN ================= */}
          {step === 1 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="space-y-1">
                <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Tipe Sarana / Kategori Mitra
                </label>
                <select
                  name="institutionType"
                  value={institutionType}
                  onChange={(e) => setInstitutionType(e.target.value as InstitutionType)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-semibold text-slate-800 cursor-pointer shadow-2xs"
                >
                  <option value="APOTEK">Apotek Sarana Farmasi</option>
                  <option value="KLINIK">Klinik Kesehatan</option>
                  <option value="RUMAH_SAKIT">Rumah Sakit (RSUD / Swasta)</option>
                  <option value="PBF">PBF / Distributor Farmasi</option>
                  <option value="PERUSAHAAN_UMUM">Perusahaan Umum / Toko Obat</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Nama Lengkap Registran
                </label>
                <input 
                  type="text"
                  name="name"
                  value={formDataState.name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Dr. Budi Santoso, Apt"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    Email Bisnis
                  </label>
                  <input 
                    type="email"
                    name="email"
                    value={formDataState.email}
                    onChange={handleInputChange}
                    placeholder="apotek@email.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    No. WhatsApp / HP
                  </label>
                  <input 
                    type="tel"
                    name="phone"
                    value={formDataState.phone}
                    onChange={handleInputChange}
                    placeholder="081234567890"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800 font-sans shadow-2xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  Kata Sandi Akun
                </label>
                <input 
                  type="password"
                  name="password"
                  value={formDataState.password}
                  onChange={handleInputChange}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800 shadow-2xs"
                />
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer border-none active:scale-[0.98]"
                >
                  Lanjut ke Data Legalitas →
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: DATA LEGALITAS SARANA ================= */}
          {step === 2 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="space-y-1">
                <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  {config.saranaLabel}
                </label>
                <input 
                  type="text"
                  name="institutionName"
                  value={formDataState.institutionName}
                  onChange={handleInputChange}
                  placeholder={config.saranaPlaceholder}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-semibold text-slate-900 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    {config.permitLabel}
                  </label>
                  <input 
                    type="text"
                    name="siaNumber"
                    value={formDataState.siaNumber}
                    onChange={handleInputChange}
                    placeholder={config.permitPlaceholder}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    {config.apjPermitLabel}
                  </label>
                  <input 
                    type="text"
                    name="sipaNumber"
                    value={formDataState.sipaNumber}
                    onChange={handleInputChange}
                    placeholder={config.apjPermitPlaceholder}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-800 shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all border-none cursor-pointer active:scale-[0.98]"
                >
                  ← Kembali
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="flex-[2] py-3 px-4 rounded-xl bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all border-none cursor-pointer active:scale-[0.98]"
                >
                  Lanjut ke Upload Berkas →
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: UPLOAD DOKUMEN & KONFIRMASI ================= */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Upload SIA */}
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  {config.permitUploadLabel}
                </label>

                {!siaFile ? (
                  <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                    <UploadCloud className="w-8 h-8 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Pilih berkas {config.permitLabel}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Format PDF, JPG, atau PNG (Maks 5MB)</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "sia")}
                    />
                  </label>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{siaFile.name}</p>
                        <p className="text-[10px] text-slate-400">{siaFile.size}</p>
                      </div>
                    </div>
                    {siaFile.status === "uploading" ? (
                      <span className="text-[10px] font-bold text-emerald-600">{siaFile.progress}%</span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Terunggah ✓</span>
                    )}
                  </div>
                )}
              </div>

              {/* Upload SIPA */}
              <div className="space-y-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                  {config.apjPermitUploadLabel}
                </label>

                {!sipaFile ? (
                  <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                    <UploadCloud className="w-8 h-8 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Pilih berkas {config.apjPermitLabel}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Format PDF, JPG, atau PNG (Maks 5MB)</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "sipa")}
                    />
                  </label>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{sipaFile.name}</p>
                        <p className="text-[10px] text-slate-400">{sipaFile.size}</p>
                      </div>
                    </div>
                    {sipaFile.status === "uploading" ? (
                      <span className="text-[10px] font-bold text-emerald-600">{sipaFile.progress}%</span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Terunggah ✓</span>
                    )}
                  </div>
                )}
              </div>

              {/* Checkbox Konfirmasi Legalitas */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="confirmValidity"
                    checked={formDataState.confirmValidity}
                    onChange={handleInputChange}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    {config.confirmText}
                  </span>
                </label>
              </div>

              {/* Action Submit */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all border-none cursor-pointer active:scale-[0.98]"
                >
                  ← Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3 px-4 rounded-xl bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 border-none cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? "Memproses Registrasi..." : "Kirim Permohonan Registrasi ✓"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Footer Section */}
      <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-400 text-center sm:text-left">
        <p>© {new Date().getFullYear()} PBF Online Systems</p>
        <div className="flex gap-4">
          <Link href="/" className="hover:text-slate-600 transition-colors">
            Kebijakan Privasi
          </Link>
          <Link href="/" className="hover:text-slate-600 transition-colors">
            Syarat &amp; Ketentuan
          </Link>
        </div>
      </div>

    </div>
  );
}
