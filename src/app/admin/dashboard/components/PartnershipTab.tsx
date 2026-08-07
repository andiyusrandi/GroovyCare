"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getPartnerFiles } from "@/app/actions/partnership";
import { X, FileText, Download, Info, CheckCircle, AlertTriangle, User as UserIcon, Building, Shield, TrendingUp, LayoutGrid, List, MapPin, CreditCard, CheckCircle2, ShieldCheck, Clock, Edit3, Plus, Search } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  sipaNumber: string | null;
  sipaExpiry: Date | null;
  sipaFileUrl?: string | null;
}

interface Partner {
  id: string;
  name: string;
  type: string; // "APOTEK" | "KLINIK" | "RUMAH_SAKIT" | "PBF" | "PERUSAHAAN_UMUM"
  siaNumber: string;
  siaExpiry: Date;
  siaFileUrl?: string | null;
  address: string;
  creditLimit: number;
  currentDebt: number;
  topDays: number;
  isActive: boolean;
  users: User[];
}

const typeLabels: Record<string, string> = {
  APOTEK: "Apotek",
  KLINIK: "Klinik",
  RUMAH_SAKIT: "Rumah Sakit",
  PBF: "PBF/Distributor",
  PERUSAHAAN_UMUM: "Perusahaan Umum"
};

const typeLicenseLabels: Record<string, string> = {
  APOTEK: "SIA",
  KLINIK: "Izin Klinik",
  RUMAH_SAKIT: "Izin RS",
  PBF: "Izin PBF",
  PERUSAHAAN_UMUM: "NIB/Izin Usaha"
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

interface PartnershipTabProps {
  partners: Partner[];
  onActivatePartner: (partnerId: string, limit: number, top: number) => Promise<void>;
  onUpdatePartner: (partnerId: string, limit: number, top: number) => Promise<void>;
  onRejectPartner: (partnerId: string) => Promise<void>;
  onSuspendPartner: (partnerId: string) => Promise<void>;
  onDeletePartner: (partnerId: string) => Promise<void>;
}

export default function PartnershipTab({
  partners,
  onActivatePartner,
  onUpdatePartner,
  onRejectPartner,
  onSuspendPartner,
  onDeletePartner,
}: PartnershipTabProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "pending" | "active">("all");
  
  // Default View Mode set to "table" (Compact List Table)
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchPartners, setSearchPartners] = useState<string>("");
  const [selectedDetailPartner, setSelectedDetailPartner] = useState<Partner | null>(null);

  // Drawer editable states
  const [creditInput, setCreditInput] = useState<number>(0);
  const [topInput, setTopInput] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick Edit states for credit limits
  const [quickEditPartner, setQuickEditPartner] = useState<Partner | null>(null);
  const [quickLimitInput, setQuickLimitInput] = useState<number>(0);
  const [quickTopInput, setQuickTopInput] = useState<number>(30);
  const [isQuickSubmitting, setIsQuickSubmitting] = useState<boolean>(false);

  const today = new Date();

  // Calculations for stats
  const pendingCount = partners.filter((p) => !p.isActive).length;
  const activeCount = partners.filter((p) => p.isActive).length;
  const totalLimitUsed = partners.reduce((sum, p) => sum + p.currentDebt, 0);

  // SIA expiring soon (within 60 days)
  const expiringSiaCount = partners.filter((p) => {
    const expiry = new Date(p.siaExpiry);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 60;
  }).length;

  const filteredPartners = partners.filter((p) => {
    // Status filter
    if (filter === "pending" && p.isActive) return false;
    if (filter === "active" && !p.isActive) return false;

    // Search query filter
    if (searchPartners.trim()) {
      const q = searchPartners.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSia = p.siaNumber.toLowerCase().includes(q);
      const matchAddr = p.address.toLowerCase().includes(q);
      const matchApj = p.users.some(u => u.name.toLowerCase().includes(q) || (u.sipaNumber && u.sipaNumber.toLowerCase().includes(q)));
      return matchName || matchSia || matchAddr || matchApj;
    }
    return true;
  });

  function handleOpenDetail(partner: Partner) {
    router.push(`/admin/dashboard/partner/${partner.id}`);
  }

  function handleCloseDetail() {
    setSelectedDetailPartner(null);
  }

  async function handleApprove() {
    if (!selectedDetailPartner) return;
    setIsSubmitting(true);
    try {
      if (selectedDetailPartner.isActive) {
        await onUpdatePartner(selectedDetailPartner.id, creditInput, topInput);
      } else {
        await onActivatePartner(selectedDetailPartner.id, creditInput, topInput);
      }
      handleCloseDetail();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (!selectedDetailPartner) return;
    const partnerType = typeLabels[selectedDetailPartner.type] || "Mitra";
    if (confirm(`Apakah Anda yakin ingin menolak pendaftaran ${partnerType} ${selectedDetailPartner.name}? Akun pendaftar akan dihapus.`)) {
      setIsSubmitting(true);
      try {
        await onRejectPartner(selectedDetailPartner.id);
        handleCloseDetail();
      } catch (e) {
        console.error(e);
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  async function handleSuspend() {
    if (!selectedDetailPartner) return;
    const partnerType = typeLabels[selectedDetailPartner.type] || "Mitra";
    if (confirm(`Apakah Anda yakin ingin menangguhkan (non-aktifkan) ${partnerType} ${selectedDetailPartner.name}? Mitra tidak akan dapat melakukan pemesanan obat.`)) {
      setIsSubmitting(true);
      try {
        await onSuspendPartner(selectedDetailPartner.id);
        handleCloseDetail();
      } catch (e) {
        console.error(e);
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  async function handleDelete() {
    if (!selectedDetailPartner) return;
    const partnerType = typeLabels[selectedDetailPartner.type] || "Mitra";
    if (confirm(`Apakah Anda yakin ingin menghapus permanen ${partnerType} ${selectedDetailPartner.name}? Seluruh data user, order, dan alokasi terkait akan dihapus secara permanen.`)) {
      setIsSubmitting(true);
      try {
        await onDeletePartner(selectedDetailPartner.id);
        handleCloseDetail();
      } catch (e) {
        console.error(e);
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);

  const handleFetchAndView = async (partnerId: string, type: "sia" | "sipa", defaultFileName: string) => {
    setLoadingFileId(`${partnerId}-${type}-view`);
    try {
      const res = await getPartnerFiles(partnerId);
      if (res.success) {
        const fileUrl = type === "sia" ? res.siaFileUrl : res.sipaFileUrl;
        handleViewFile(fileUrl, defaultFileName);
      } else {
        alert(res.error || "Gagal mengambil dokumen.");
      }
    } catch (err: any) {
      alert("Kesalahan sistem: " + err.message);
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleFetchAndDownload = async (partnerId: string, type: "sia" | "sipa", defaultFileName: string) => {
    setLoadingFileId(`${partnerId}-${type}-download`);
    try {
      const res = await getPartnerFiles(partnerId);
      if (res.success) {
        const fileUrl = type === "sia" ? res.siaFileUrl : res.sipaFileUrl;
        handleDownloadFile(fileUrl, defaultFileName);
      } else {
        alert(res.error || "Gagal mengunduh dokumen.");
      }
    } catch (err: any) {
      alert("Kesalahan sistem: " + err.message);
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleViewFile = (fileUrl: string | null | undefined, defaultFileName: string) => {
    if (!fileUrl) {
      const mockPdfDataUrl = `data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVGl0bGUgKEl6aW4gTGVnYWxpdGFzKQovQXV0aG9yIChQQkYgT25saW5lKQovQ3JlYXRvciAoR3Jvb3Z5Q2FyZSkKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbNCAwIFJdCi9Db3VudCAxCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL01lZGlhQm94IFswIDAgNTk1IDQyMF0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KL0NvbnRlbnRzIDYgMCBSCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYS1Cb2xkCj4+CmVuZG9iago2IDAgb2JqCjw8IC9MZW5ndGggMTc4ID4+CnN0cmVhbQpCVAovRjEgMTggVGYKMSAwIDAgMSA1MCAzNTAgVGoKKERPS1VNRU4gTEVHQUxJVEFTIFNFTVVOVEEpIFRqCjAgLTMwIFRkCihCZXJrYXMgZGlzZXN1YWlrYW4gZGVuZ2FuIHNpc3RlbS4pIFRqCjAgLTMwIFRkCihOYW1hIEZpbGU6ICkgVGoKNTAgMCA1MCA1MCBUZAooRGVtb25zdHJhc2kgTGVnYWxpdGFzIFBCRiBPbmxpbmUpIFRqCkUKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNwowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTcgMDAwMDAgbiAKMDAwMDAwMDA5OSAwMDAwMCBuIAowMDAwMDAwMTQ2IDAwMDAwIGYgCjAwMDAwMDAyMDMgMDAwMDAgbiAKMDAwMDAwMDMxMCAwMDAwMCBuIAowMDAwMDAwMzc4IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNwovUm9vdCAyIDAgUgo+PgpzdGFydHhyZWYKNTkyCiUlRU9GCg==`;
      const w = window.open();
      if (w) {
        w.document.write(
          `<iframe width='100%' height='100%' style='border:none;' src='${mockPdfDataUrl}'></iframe>`
        );
      } else {
        alert("Pop-up diblokir. Harap izinkan pop-up untuk melihat berkas.");
      }
      return;
    }

    const w = window.open();
    if (w) {
      if (fileUrl.startsWith("data:application/pdf")) {
        w.document.write(
          `<iframe width='100%' height='100%' style='border:none;' src='${fileUrl}'></iframe>`
        );
      } else {
        w.document.write(
          `<div style='display:flex;justify-content:center;align-items:center;height:100vh;background:#f1f5f9;'><img src='${fileUrl}' style='max-width:90%;max-height:90%;box-shadow:0 10px 25px rgba(0,0,0,0.1);border-radius:8px;'/></div>`
        );
      }
    } else {
      alert("Pop-up diblokir. Harap izinkan pop-up untuk melihat berkas.");
    }
  };

  const handleDownloadFile = (fileUrl: string | null | undefined, defaultFileName: string) => {
    const finalUrl = fileUrl || `data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVGl0bGUgKEl6aW4gTGVnYWxpdGFzKQovQXV0aG9yIChQQkYgT25saW5lKQovQ3JlYXRvciAoR3Jvb3Z5Q2FyZSkKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbNCAwIFJdCi9Db3VudCAxCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL01lZGlhQm94IFswIDAgNTk1IDQyMF0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KL0NvbnRlbnRzIDYgMCBSCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYS1Cb2xkCj4+CmVuZG9iago2IDAgb2JqCjw8IC9MZW5ndGggMTc4ID4+CnN0cmVhbQpCVAovRjEgMTggVGYKMSAwIDAgMSA1MCAzNTAgVGoKKERPS1VNRU4gTEVHQUxJVEFTIFNFTVVOVEEpIFRqCjAgLTMwIFRkCihCZXJrYXMgZGlzZXN1YWlrYW4gZGVuZ2FuIHNpc3RlbS4pIFRqCjAgLTMwIFRkCihOYW1hIEZpbGU6ICkgVGoKNTAgMCA1MCA1MCBUZAooRGVtb25zdHJhc2kgTGVnYWxpdGFzIFBCRiBPbmxpbmUpIFRqCkUKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNwowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTcgMDAwMDAgbiAKMDAwMDAwMDA5OSAwMDAwMCBuIAowMDAwMDAwMTQ2IDAwMDAwIGYgCjAwMDAwMDAyMDMgMDAwMDAgbiAKMDAwMDAwMDMxMCAwMDAwMCBuIAowMDAwMDAwMzc4IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNwovUm9vdCAyIDAgUgo+PgpzdGFydHhyZWYKNTkyCiUlRU9GCg==`;
    const link = document.createElement("a");
    link.href = finalUrl;
    link.download = defaultFileName.endsWith(".pdf") ? defaultFileName : `${defaultFileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function handleOpenQuickEditLimit(partner: Partner) {
    setQuickEditPartner(partner);
    setQuickLimitInput(partner.creditLimit);
    setQuickTopInput(partner.topDays);
  }

  async function handleSaveQuickLimit() {
    if (!quickEditPartner) return;
    setIsQuickSubmitting(true);
    try {
      await onUpdatePartner(quickEditPartner.id, quickLimitInput, quickTopInput);
      setQuickEditPartner(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsQuickSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 animate-fadeIn font-sans relative">
      {/* 1. Slim Horizontal Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 px-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="font-heading font-extrabold text-lg text-slate-900 leading-tight">Manajemen Kemitraan</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Verifikasi dokumen legalitas sarana farmasi &amp; pengaturan plafon kredit limit.</p>
        </div>
        <button
          onClick={() => alert("Tambah mitra baru secara manual dapat dilakukan oleh Admin Utama.")}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-2xs active:scale-95 transition-all cursor-pointer border-none shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Mitra Baru</span>
        </button>
      </div>

      {/* 2. Compact Horizontal Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Stat Card 1: Menunggu Verifikasi */}
        <div className="bg-white p-3.5 px-4 rounded-2xl shadow-2xs border border-slate-200/80 hover:shadow-md transition-all flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-100 shrink-0">
            <span className="material-symbols-outlined text-[20px]">pending_actions</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate">Menunggu Verifikasi</span>
              {pendingCount > 0 && (
                <span className="text-[9px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full shrink-0">+{pendingCount} Baru</span>
              )}
            </div>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 font-mono mt-0.5">{pendingCount} <span className="text-xs font-bold text-slate-400 font-sans">Mitra</span></h3>
          </div>
        </div>

        {/* Stat Card 2: Mitra Aktif */}
        <div className="bg-white p-3.5 px-4 rounded-2xl shadow-2xs border border-slate-200/80 hover:shadow-md transition-all flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shrink-0">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">Mitra Aktif</span>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 font-mono mt-0.5">{activeCount} <span className="text-xs font-bold text-slate-400 font-sans">Mitra</span></h3>
          </div>
        </div>

        {/* Stat Card 3: Limit Kredit Terpakai */}
        <div className="bg-white p-3.5 px-4 rounded-2xl shadow-2xs border border-slate-200/80 hover:shadow-md transition-all flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100 shrink-0">
            <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">Limit Kredit Terpakai</span>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 font-mono mt-0.5 truncate">Rp {totalLimitUsed.toLocaleString("id-ID")}</h3>
          </div>
        </div>

        {/* Stat Card 4: SIA Kadaluwarsa */}
        <div className="bg-white p-3.5 px-4 rounded-2xl shadow-2xs border border-slate-200/80 hover:shadow-md transition-all flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 border border-rose-100 shrink-0">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">Izin Expired (&lt;60 Hari)</span>
            <h3 className="font-heading font-extrabold text-xl text-rose-600 font-mono mt-0.5">{expiringSiaCount} <span className="text-xs font-bold text-slate-400 font-sans">Dokumen</span></h3>
          </div>
        </div>
      </div>

      {/* 3. Main Content Area: Single Row Filters & Integrated Controls */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="p-3 px-4 border-b border-slate-150 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          {/* Segmented Filter Pills */}
          <div className="inline-flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
                filter === "all" ? "bg-white text-emerald-800 shadow-2xs" : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              Semua Mitra ({partners.length})
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
                filter === "pending" ? "bg-white text-emerald-800 shadow-2xs" : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              Menunggu ({pendingCount})
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${
                filter === "active" ? "bg-white text-emerald-800 shadow-2xs" : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              Aktif ({activeCount})
            </button>
          </div>

          <div className="flex items-center gap-2.5 min-w-0 flex-1 max-w-md ml-auto">
            {/* Search Input Bar */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Cari Mitra, No. SIA, APJ, SIPA..."
                value={searchPartners}
                onChange={(e) => setSearchPartners(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-2xs"
              />
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-200/60 p-1 rounded-xl border border-slate-200/80 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer border-none ${
                  viewMode === "table" ? "bg-white text-emerald-800 shadow-2xs" : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
                title="Tampilan Tabel Data (Default Operasional)"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer border-none ${
                  viewMode === "grid" ? "bg-white text-emerald-800 shadow-2xs" : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
                title="Tampilan Kartu Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={() => alert("Mengunduh daftar kemitraan format CSV...")}
              className="p-1.5 border border-slate-200/90 rounded-xl text-slate-600 hover:bg-white bg-white transition-all cursor-pointer shrink-0 shadow-2xs flex items-center justify-center"
              title="Ekspor CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4. Default Operational View: Compact Table */}
        {viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">
                  <th className="px-5 py-3">Sarana &amp; Alamat</th>
                  <th className="px-4 py-3 text-center">Tipe</th>
                  <th className="px-4 py-3">No. SIA / Izin &amp; Exp</th>
                  <th className="px-4 py-3">Apoteker (APJ) &amp; SIPA</th>
                  <th className="px-4 py-3">Limit Kredit &amp; TOP</th>
                  <th className="px-4 py-3 text-center">Status CDOB</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {filteredPartners.map((partner) => {
                  const isSiaExpired = new Date(partner.siaExpiry) <= today && new Date(partner.siaExpiry).getFullYear() < 2090 && partner.type !== "PERUSAHAAN_UMUM";
                  const user = partner.users[0];
                  const isSipaExpired = user && user.sipaExpiry ? new Date(user.sipaExpiry) <= today : false;
                  const rawAddr = partner.address || "";
                  const cityMatch = rawAddr.match(/(Kab\/Kota|Kota|Kabupaten):\s*([^,]+)/i);
                  const shortCity = cityMatch
                    ? cityMatch[2].trim()
                    : rawAddr.split(",")[0].replace(/^Alamat:\s*/i, "").trim() || "Lokasi Apotek";

                  return (
                    <tr key={partner.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[18px]">local_pharmacy</span>
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 text-xs block">{partner.name}</span>
                            <span className="text-[10px] text-slate-500 truncate block max-w-[220px]" title={rawAddr}>{shortCity}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {typeLabels[partner.type] || "Mitra"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-slate-900 font-bold text-xs block">{partner.siaNumber}</span>
                        <span className={`text-[10px] font-mono ${isSiaExpired ? "text-rose-600 font-bold" : "text-slate-500"}`}>
                          Exp: {new Date(partner.siaExpiry).toLocaleDateString("id-ID")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 text-xs block">{user?.name || "Belum Ditentukan"}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          SIPA: {user?.sipaNumber || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="font-bold text-slate-900 text-xs block">
                          Rp {partner.currentDebt.toLocaleString("id-ID")} / Rp {partner.creditLimit.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-emerald-800 font-sans font-bold">
                          TOP: {partner.topDays} Hari
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!partner.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                            🟡 Menunggu
                          </span>
                        ) : isSiaExpired || isSipaExpired ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-800 border border-rose-200">
                            🔴 Expired
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            🟢 Aktif CDOB
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(partner)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-2xs border-none ${
                            !partner.isActive
                              ? "bg-primary text-white hover:brightness-110"
                              : "bg-slate-900 text-white hover:bg-slate-800"
                          }`}
                        >
                          {!partner.isActive ? "Verifikasi" : "Detail & Limit"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-slate-50/40">
            {filteredPartners.map((partner) => {
              const isSiaExpired = new Date(partner.siaExpiry) <= today && new Date(partner.siaExpiry).getFullYear() < 2090 && partner.type !== "PERUSAHAAN_UMUM";
              const user = partner.users[0];
              const isSipaExpired = user && user.sipaExpiry ? new Date(user.sipaExpiry) <= today : false;
              const rawAddr = partner.address || "";
              const cityMatch = rawAddr.match(/(Kab\/Kota|Kota|Kabupaten):\s*([^,]+)/i);
              const shortCity = cityMatch
                ? cityMatch[2].trim()
                : rawAddr.split(",")[0].replace(/^Alamat:\s*/i, "").trim() || "Lokasi Apotek";

              const debtPercent = partner.creditLimit > 0 ? Math.min(100, Math.round((partner.currentDebt / partner.creditLimit) * 100)) : 0;

              let iconName = "local_pharmacy";
              let typeBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
              if (partner.type === "RUMAH_SAKIT") {
                iconName = "local_hospital";
                typeBadgeColor = "bg-rose-50 text-rose-700 border-rose-200";
              } else if (partner.type === "KLINIK") {
                iconName = "medical_services";
                typeBadgeColor = "bg-violet-50 text-violet-700 border-violet-200";
              } else if (partner.type === "PBF") {
                iconName = "warehouse";
                typeBadgeColor = "bg-blue-50 text-blue-700 border-blue-200";
              } else if (partner.type === "PERUSAHAAN_UMUM") {
                iconName = "business";
                typeBadgeColor = "bg-slate-100 text-slate-700 border-slate-200";
              }

              return (
                <div key={partner.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col justify-between space-y-3 group">
                  <div className="space-y-3">
                    {/* Header Status & Type */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${typeBadgeColor}`}>
                          <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                        </div>
                        <div>
                          <span className={`px-2 py-0.2 rounded text-[8px] font-black border uppercase tracking-wide ${typeBadgeColor}`}>
                            {typeLabels[partner.type] || "Mitra"}
                          </span>
                          <h4 className="font-heading font-extrabold text-slate-900 text-xs mt-0.5 line-clamp-1" title={partner.name}>{partner.name}</h4>
                        </div>
                      </div>

                      {!partner.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-900 border border-amber-300 shrink-0">
                          🟡 Menunggu
                        </span>
                      ) : isSiaExpired || isSipaExpired ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-50 text-rose-900 border border-rose-300 shrink-0">
                          🔴 Expired
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-900 border border-emerald-300 shrink-0">
                          🟢 Aktif
                        </span>
                      )}
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200/60 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate" title={rawAddr}>{shortCity}</span>
                    </div>

                    {/* Legal Documents Info */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider block">{typeLicenseLabels[partner.type] || "Dokumen Izin"}</span>
                        <span className="font-mono font-black text-slate-900 truncate block mt-0.5">{partner.siaNumber}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                        <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider block">Apoteker (APJ)</span>
                        <span className="font-bold text-slate-900 truncate block mt-0.5">{user?.name || "Belum APJ"}</span>
                      </div>
                    </div>

                    {/* Credit Progress */}
                    {partner.isActive && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-slate-600 font-bold">Limit Kredit &amp; TOP ({partner.topDays} Hari)</span>
                          <span className="font-mono font-black text-slate-900">
                            Rp {partner.currentDebt.toLocaleString("id-ID")} / Rp {partner.creditLimit.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${debtPercent > 85 ? "bg-rose-500" : debtPercent > 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${debtPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-2 border-t border-slate-150 flex items-center justify-between gap-2">
                    <span className="text-[9px] font-bold text-slate-500">
                      TOP: <strong className="text-slate-900 font-extrabold">{partner.topDays} Hari</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(partner)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs ${!partner.isActive
                          ? "bg-primary text-white hover:brightness-110"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                    >
                      {!partner.isActive ? "Verifikasi" : "Detail & Limit"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
