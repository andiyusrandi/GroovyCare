"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateApjProfile } from "@/app/actions/mitra";
import { ShieldCheck, Calendar, Building2, User, FileText, CheckCircle, AlertTriangle, Lock, Edit2, Check, RefreshCw, Upload } from "lucide-react";

interface LegalityAndProfileViewProps {
  user: {
    name: string;
    email: string;
    phone: string | null;
    sipaNumber: string | null;
    sipaExpiry: string | Date | null;
  };
  institution: {
    name: string;
    type: string;
    address: string;
    siaNumber: string;
    siaExpiry: string | Date;
  };
  subTab: "instansi" | "sipa" | "sia" | "profile";
  setSubTab: (tab: "instansi" | "sipa" | "sia" | "profile") => void;
}

const typeLabels: Record<string, string> = {
  APOTEK: "Apotek",
  KLINIK: "Klinik",
  RUMAH_SAKIT: "Rumah Sakit",
  PBF: "PBF/Distributor",
  PERUSAHAAN_UMUM: "Perusahaan Umum"
};

const typeLicenseLabels: Record<string, string> = {
  APOTEK: "Surat Izin Apotek (SIA)",
  KLINIK: "Izin Operasional Klinik",
  RUMAH_SAKIT: "Izin Operasional Rumah Sakit",
  PBF: "Izin PBF / Sertifikat Standar",
  PERUSAHAAN_UMUM: "NIB / Izin Usaha Perusahaan"
};

const typeApjPermitLabels: Record<string, string> = {
  APOTEK: "SIPA APJ",
  KLINIK: "SIPA APJ",
  RUMAH_SAKIT: "SIPA APJ",
  PBF: "SIPA APJ",
  PERUSAHAAN_UMUM: "SIPTTK/SIPA PJ"
};

const typeApjRoleLabels: Record<string, string> = {
  APOTEK: "Apoteker Penanggung Jawab (APJ)",
  KLINIK: "Apoteker Penanggung Jawab (APJ)",
  RUMAH_SAKIT: "Apoteker Penanggung Jawab (APJ)",
  PBF: "Apoteker Penanggung Jawab (APJ)",
  PERUSAHAAN_UMUM: "Penanggung Jawab Teknis"
};

export default function LegalityAndProfileView({
  user,
  institution,
  subTab,
  setSubTab,
}: LegalityAndProfileViewProps) {
  const today = new Date();
  const router = useRouter();

  // Local States for Inputs
  const [instansiPhone, setInstansiPhone] = useState(user.phone || "");
  const [instansiEmail, setInstansiEmail] = useState(user.email || "");
  const [isEditingInstansi, setIsEditingInstansi] = useState(false);

  const [siaNumber, setSiaNumber] = useState(institution.siaNumber);
  const [siaExpiry, setSiaExpiry] = useState(
    institution.siaExpiry ? new Date(institution.siaExpiry).toISOString().split("T")[0] : "2099-12-31"
  );
  const [isUpdatingSia, setIsUpdatingSia] = useState(false);
  const [isSiaPending, setIsSiaPending] = useState(false);

  const [sipaNumber, setSipaNumber] = useState(user.sipaNumber || "");
  const [sipaExpiry, setSipaExpiry] = useState(
    user.sipaExpiry ? new Date(user.sipaExpiry).toISOString().split("T")[0] : ""
  );
  const [isUpdatingSipa, setIsUpdatingSipa] = useState(false);
  const [isSipaPending, setIsSipaPending] = useState(false);

  const [apjName, setApjName] = useState(user.name);
  const [apjEmail, setApjEmail] = useState(user.email);
  const [apjPhone, setApjPhone] = useState(user.phone || "");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Signature canvas states for Profile APJ tab
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // Initialize canvas listeners if subtab is profile
  useEffect(() => {
    if (subTab === "profile" && isEditingProfile && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
      }
    }
  }, [subTab, isEditingProfile]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = (e as React.MouseEvent<HTMLCanvasElement>).clientX;
      clientY = (e as React.MouseEvent<HTMLCanvasElement>).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = (e.currentTarget as HTMLCanvasElement) || canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#00422b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const { x, y } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = (e.currentTarget as HTMLCanvasElement) || canvasRef.current;
    if (!canvas) return;

    if ("touches" in e && e.cancelable) {
      e.preventDefault();
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setSignatureData(null);
      }
    }
  };

  // Calculate remaining days
  const getRemainingDays = (expiryDate: string | Date | null) => {
    if (!expiryDate) return 0;
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const siaDaysLeft = getRemainingDays(isSiaPending ? siaExpiry : institution.siaExpiry);
  const sipaDaysLeft = getRemainingDays(isSipaPending ? sipaExpiry : user.sipaExpiry);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-heading font-extrabold text-foreground">Legalitas &amp; Profil Sarana</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">Kelola verifikasi izin operasional Rumah Sakit, Apotek, atau Usaha Obat non-perorangan Anda.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar whitespace-nowrap flex-nowrap border-b border-outline-variant/20 gap-2 -mx-4 px-4 scroll-smooth">
        <button
          onClick={() => setSubTab("instansi")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${subTab === "instansi"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-foreground"
            }`}
        >
          <Building2 className="w-4 h-4" />
          Data Instansi
        </button>

        <button
          onClick={() => setSubTab("sia")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${subTab === "sia"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-foreground"
            }`}
        >
          <FileText className="w-4 h-4" />
          {typeLicenseLabels[institution.type] || "Izin Sarana"}
        </button>

        <button
          onClick={() => setSubTab("sipa")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${subTab === "sipa"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-foreground"
            }`}
        >
          <ShieldCheck className="w-4 h-4" />
          {typeApjPermitLabels[institution.type] || "SIPA Apoteker"}
        </button>

        <button
          onClick={() => setSubTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${subTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-foreground"
            }`}
        >
          <User className="w-4 h-4" />
          Profile APJ
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl border border-outline-variant/20 p-6 shadow-sm">

        {/* SUBTAB: DATA INSTANSI */}
        {subTab === "instansi" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/15 pb-4">
              <div>
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Entitas Bisnis Farmasi (Non-Perorangan)
                </span>
                <h3 className="text-base font-heading font-extrabold text-foreground mt-2">{institution.name}</h3>
              </div>
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-700" /> Terverifikasi BPOM
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">

              {/* Kategori Sarana (Locked) */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-outline">
                  <span className="uppercase tracking-wider font-extrabold text-[9px] block">Kategori Sarana</span>
                  <Lock className="w-3.5 h-3.5 text-outline-variant" />
                </div>
                <p className="text-sm font-bold text-foreground bg-slate-50 border border-outline-variant/15 px-3 py-2 rounded-xl">
                  Apotik / Usaha Bidang Obat Swasta
                </p>
              </div>

              {/* Alamat Fisik (Locked) */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-outline">
                  <span className="uppercase tracking-wider font-extrabold text-[9px] block">Alamat Pengiriman Obat (Fisik)</span>
                  <Lock className="w-3.5 h-3.5 text-outline-variant" />
                </div>
                <p className="text-xs text-on-surface-variant bg-slate-50 border border-outline-variant/15 px-3 py-2 rounded-xl leading-relaxed">
                  {institution.address}
                </p>
                <span className="text-[9px] text-outline block italic mt-1 pl-1">Sesuai ketentuan CDOB, perubahan alamat fisik wajib mengajukan berkas SIA baru melalui Admin PBF.</span>
              </div>

              {/* WhatsApp (Editable) */}
              <div className="space-y-1">
                <span className="text-outline uppercase tracking-wider font-extrabold text-[9px] block">No. WhatsApp Instansi</span>
                {isEditingInstansi ? (
                  <input
                    type="tel"
                    value={instansiPhone}
                    onChange={(e) => setInstansiPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <p className="text-xs font-bold text-foreground bg-slate-50 border border-outline-variant/15 px-3 py-2 rounded-xl">
                    {instansiPhone || "-"}
                  </p>
                )}
              </div>

              {/* Email (Editable) */}
              <div className="space-y-1">
                <span className="text-outline uppercase tracking-wider font-extrabold text-[9px] block">Email Bisnis Terdaftar</span>
                {isEditingInstansi ? (
                  <input
                    type="email"
                    value={instansiEmail}
                    onChange={(e) => setInstansiEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <p className="text-xs font-bold text-foreground bg-slate-50 border border-outline-variant/15 px-3 py-2 rounded-xl">
                    {instansiEmail || "-"}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/15">
              {isEditingInstansi ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setInstansiPhone(user.phone || "");
                      setInstansiEmail(user.email || "");
                      setIsEditingInstansi(false);
                    }}
                    className="px-4 py-2 border border-outline-variant/30 text-on-surface rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingInstansi(false);
                      alert("Perubahan kontak instansi berhasil disimpan.");
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" /> Simpan Data
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingInstansi(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Kontak Instansi
                </button>
              )}
            </div>

            <div className="bg-surface-container-low/55 p-4 border border-outline-variant/10 rounded-2xl text-[10px] text-on-surface-variant flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p>Sesuai dengan ketentuan regulasi CDOB BPOM, akun ini merupakan akun entitas institusi farmasi non-perorangan terdaftar. Setiap transaksi obat keras wajib dilaporkan berkala ke Dinkes setempat.</p>
            </div>
          </div>
        )}

        {/* SUBTAB: SIA */}
        {subTab === "sia" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/15 pb-4">
              <div>
                <span className="text-outline uppercase tracking-wider font-extrabold text-[9px] block">{typeLicenseLabels[institution.type] || "Surat Izin Sarana"}</span>
                <h3 className="text-base font-heading font-extrabold text-foreground mt-1">
                  {isSiaPending ? siaNumber : institution.siaNumber}
                </h3>
              </div>

              {isSiaPending ? (
                <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-700 animate-spin" /> Menunggu Verifikasi PBF
                </span>
              ) : siaDaysLeft > 0 ? (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-250 text-[10px] font-bold rounded-xl flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Aktif: sisa {siaDaysLeft} Hari
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold rounded-xl flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-700 animate-pulse" /> Kedaluwarsa
                </span>
              )}
            </div>

            {isUpdatingSia ? (
              <div className="space-y-4 text-xs border border-outline-variant/30 p-4 rounded-2xl bg-slate-50/50">
                <h4 className="font-bold text-foreground">Ajukan Pembaruan Dokumen {typeLicenseLabels[institution.type] || "Izin"}</h4>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-outline">Nomor {typeLicenseLabels[institution.type] || "Izin"} Baru</label>
                    <input
                      type="text"
                      value={siaNumber}
                      onChange={(e) => setSiaNumber(e.target.value)}
                      placeholder="Nomor Izin Baru"
                      className="px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-outline">Unggah Berkas PDF {typeLicenseLabels[institution.type] || "Izin"} Baru</label>
                  <div className="border-2 border-dashed border-outline-variant/40 rounded-xl p-6 text-center bg-white cursor-pointer hover:bg-slate-50/50 transition-colors">
                    <Upload className="w-6 h-6 text-outline mx-auto mb-2" />
                    <span className="text-[10px] font-bold text-primary">Klik untuk Pilih File PDF {typeLicenseLabels[institution.type] || "Izin"}</span>
                    <span className="block text-[8px] text-outline mt-1">Maximum upload size: 5MB</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/15">
                  <button
                    type="button"
                    onClick={() => setIsUpdatingSia(false)}
                    className="px-4 py-2 border border-outline-variant/30 text-on-surface rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSiaExpiry("2099-12-31");
                      setIsUpdatingSia(false);
                      setIsSiaPending(true);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
                  >
                    Kirim Pembaruan {typeLicenseLabels[institution.type] || "Izin"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 text-xs">
                <div className="space-y-1">
                  <span className="text-outline uppercase tracking-wider font-extrabold text-[9px] block">Dokumen Fisik {typeLicenseLabels[institution.type] || "Izin"}</span>
                  <div className="mt-2 inline-flex items-center gap-2 p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl hover:bg-surface-variant/40 transition-colors cursor-pointer">
                    <FileText className="w-6 h-6 text-primary" />
                    <div className="text-[10px]">
                      <p className="font-bold text-foreground leading-none">Dokumen_Izin.pdf</p>
                      <p className="text-on-surface-variant mt-1 leading-none">Size: 1.4 MB</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warning when Pending */}
            {isSiaPending && (
              <div className="bg-amber-50 border border-amber-250 p-4 rounded-2xl text-[10px] text-amber-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="font-bold block">Pembaruan Sedang Ditinjau Admin PBF</span>
                  Akun Anda saat ini masuk dalam antrean verifikasi kepatuhan. Pembelian obat bebas tetap diizinkan, namun otorisasi pemesanan psikotropika/obat keras baru akan aktif kembali setelah verifikasi izin sarana selesai.
                </div>
              </div>
            )}

            {!isUpdatingSia && !isSiaPending && (
              <div className="flex justify-end pt-2 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setIsUpdatingSia(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Perbarui / Perpanjang {typeLicenseLabels[institution.type] || "Izin"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB: SIPA */}
        {subTab === "sipa" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/15 pb-4">
              <div>
                <span className="text-outline uppercase tracking-wider font-extrabold text-[9px] block">Surat Izin Praktik Penanggung Jawab ({typeApjPermitLabels[institution.type] || "SIPA"})</span>
                <h3 className="text-base font-heading font-extrabold text-foreground mt-1">
                  {isSipaPending ? sipaNumber : user.sipaNumber}
                </h3>
              </div>

              {isSipaPending ? (
                <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-700 animate-spin" /> Menunggu Verifikasi PBF
                </span>
              ) : sipaDaysLeft > 0 ? (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-250 text-[10px] font-bold rounded-xl flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Aktif: sisa {sipaDaysLeft} Hari
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold rounded-xl flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-700 animate-pulse" /> Kedaluwarsa
                </span>
              )}
            </div>

            {isUpdatingSipa ? (
              <div className="space-y-4 text-xs border border-outline-variant/30 p-4 rounded-2xl bg-slate-50/50">
                <h4 className="font-bold text-foreground">Ajukan Pembaruan Dokumen {typeApjPermitLabels[institution.type] || "SIPA"}</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-outline">Nomor {typeApjPermitLabels[institution.type] || "SIPA"} Baru</label>
                    <input
                      type="text"
                      value={sipaNumber}
                      onChange={(e) => setSipaNumber(e.target.value)}
                      placeholder="Nomor Izin Baru"
                      className="px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-outline">Masa Berlaku {typeApjPermitLabels[institution.type] || "SIPA"} Baru</label>
                    <input
                      type="date"
                      value={sipaExpiry}
                      onChange={(e) => setSipaExpiry(e.target.value)}
                      className="px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-outline">Unggah Berkas PDF {typeApjPermitLabels[institution.type] || "SIPA"} Baru</label>
                  <div className="border-2 border-dashed border-outline-variant/40 rounded-xl p-6 text-center bg-white cursor-pointer hover:bg-slate-50/50 transition-colors">
                    <Upload className="w-6 h-6 text-outline mx-auto mb-2" />
                    <span className="text-[10px] font-bold text-primary">Klik untuk Pilih File PDF {typeApjPermitLabels[institution.type] || "SIPA"}</span>
                    <span className="block text-[8px] text-outline mt-1">Maximum upload size: 5MB</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/15">
                  <button
                    type="button"
                    onClick={() => setIsUpdatingSipa(false)}
                    className="px-4 py-2 border border-outline-variant/30 text-on-surface rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUpdatingSipa(false);
                      setIsSipaPending(true);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
                  >
                    Kirim Pembaruan {typeApjPermitLabels[institution.type] || "SIPA"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1">
                  <span className="text-outline uppercase tracking-wider font-extrabold text-[9px] block">Masa Berlaku {typeApjPermitLabels[institution.type] || "SIPA"}</span>
                  <p className="text-sm font-bold text-foreground">
                    {sipaExpiry ? new Date(sipaExpiry).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-outline uppercase tracking-wider font-extrabold text-[9px] block">Dokumen Fisik {typeApjPermitLabels[institution.type] || "SIPA"}</span>
                  <div className="mt-2 inline-flex items-center gap-2 p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl hover:bg-surface-variant/40 transition-colors cursor-pointer">
                    <FileText className="w-6 h-6 text-primary" />
                    <div className="text-[10px]">
                      <p className="font-bold text-foreground leading-none">Dokumen_SIPA_SIPTTK.pdf</p>
                      <p className="text-on-surface-variant mt-1 leading-none">Size: 850 KB</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warning when Pending */}
            {isSipaPending && (
              <div className="bg-amber-50 border border-amber-250 p-4 rounded-2xl text-[10px] text-amber-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="font-bold block">Pembaruan Sedang Ditinjau Admin PBF</span>
                  Akun Anda saat ini masuk dalam antrean verifikasi kepatuhan Penanggung Jawab. Validitas {typeApjPermitLabels[institution.type] || "SIPA"} baru sedang di-crosscheck terhadap sistem Kementerian Kesehatan.
                </div>
              </div>
            )}

            {!isUpdatingSipa && !isSipaPending && (
              <div className="flex justify-end pt-2 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setIsUpdatingSipa(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Perbarui / Perpanjang {typeApjPermitLabels[institution.type] || "SIPA"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB: PROFILE APJ */}
        {subTab === "profile" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/15 pb-4">
              <div>
                <span className="text-outline uppercase tracking-wider font-extrabold text-[9px] block">Apoteker Penanggung Jawab (APJ)</span>
                <h3 className="text-base font-heading font-extrabold text-foreground mt-1">{apjName}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Nama APJ (Editable) */}
              <div className="space-y-1">
                <span className="text-outline uppercase tracking-wider font-extrabold text-[9px] block">Nama Lengkap APJ</span>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={apjName}
                    onChange={(e) => setApjName(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <p className="text-xs font-bold text-foreground bg-slate-50 border border-outline-variant/15 px-3 py-2 rounded-xl">
                    {apjName}
                  </p>
                )}
              </div>

              {/* Email APJ (Editable) */}
              <div className="space-y-1">
                <span className="text-outline uppercase tracking-wider font-extrabold text-[9px] block">Email APJ</span>
                {isEditingProfile ? (
                  <input
                    type="email"
                    value={apjEmail}
                    onChange={(e) => setApjEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <p className="text-xs font-bold text-foreground bg-slate-50 border border-outline-variant/15 px-3 py-2 rounded-xl">
                    {apjEmail}
                  </p>
                )}
              </div>

              {/* Phone APJ (Editable) */}
              <div className="space-y-1">
                <span className="text-outline uppercase tracking-wider font-extrabold text-[9px] block">Nomor WhatsApp APJ</span>
                {isEditingProfile ? (
                  <input
                    type="tel"
                    value={apjPhone}
                    onChange={(e) => setApjPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                ) : (
                  <p className="text-xs font-bold text-foreground bg-slate-50 border border-outline-variant/15 px-3 py-2 rounded-xl">
                    {apjPhone || "-"}
                  </p>
                )}
              </div>

              {/* Tanda Tangan APJ (Editable) */}
              <div className="space-y-1">
                <span className="text-outline uppercase tracking-wider font-extrabold text-[9px] block">Tanda Tangan Digital APJ</span>

                {isEditingProfile ? (
                  <div className="space-y-3">
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      Gambar tanda tangan baru di bawah ini. Tanda tangan ini akan dicetak pada Surat Pesanan (SP) legal pembelian obat keras.
                    </p>
                    <div className="border border-outline-variant/60 bg-slate-50 rounded-2xl overflow-hidden h-36 relative">
                      <canvas
                        ref={canvasRef}
                        width={300}
                        height={144}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        style={{ touchAction: "none" }}
                        className="w-full h-full cursor-crosshair"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-on-surface rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Hapus Garis
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 inline-block p-2 bg-slate-50 border border-outline-variant/20 rounded-2xl shadow-sm">
                    {signatureData ? (
                      <img src={signatureData} alt="APJ Signature" className="h-16 object-contain" />
                    ) : (
                      <div className="h-16 w-36 flex items-center justify-center text-outline text-[10px] italic border-2 border-dashed border-outline-variant/30 rounded-xl">
                        Belum ada tanda tangan
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/15">
              {isEditingProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setApjName(user.name);
                      setApjEmail(user.email);
                      setApjPhone(user.phone || "");
                      setIsEditingProfile(false);
                    }}
                    className="px-4 py-2 border border-outline-variant/30 text-on-surface rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (canvasRef.current) {
                        // Save signature drawing
                        const sig = canvasRef.current.toDataURL("image/png");
                        setSignatureData(sig);
                      }
                      try {
                        const res = await updateApjProfile({
                          name: apjName,
                          email: apjEmail,
                          phone: apjPhone,
                        });
                        if (res.success) {
                          alert(res.message);
                          setIsEditingProfile(false);
                          router.refresh();
                        } else {
                          alert(res.error || "Gagal memperbarui profil APJ");
                        }
                      } catch (err: any) {
                        alert("Terjadi kesalahan: " + err.message);
                      }
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" /> Simpan Profil
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profil APJ
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
