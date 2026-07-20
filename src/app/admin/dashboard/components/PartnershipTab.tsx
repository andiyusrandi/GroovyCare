"use client";

import { useState } from "react";
import { getPartnerFiles } from "@/app/actions/partnership";
import { X, FileText, Download, Info, CheckCircle, AlertTriangle, User as UserIcon, Building, Shield, TrendingUp } from "lucide-react";

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
  const [filter, setFilter] = useState<"all" | "pending" | "active">("all");
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
    if (filter === "pending") return !p.isActive;
    if (filter === "active") return p.isActive;
    return true;
  });

  function handleOpenDetail(partner: Partner) {
    setSelectedDetailPartner(partner);
    setCreditInput(partner.creditLimit);
    setTopInput(partner.topDays);
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
    <div className="space-y-8 animate-fadeIn relative">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-on-surface">Manajemen Kemitraan</h1>
          <p className="text-xs text-on-surface-variant font-medium mt-1">Verifikasi dokumen legalitas dan pengaturan plafon kredit mitra.</p>
        </div>
        <button
          onClick={() => alert("Tambah mitra baru secara manual dapat dilakukan oleh Admin Utama.")}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah Mitra Baru
        </button>
      </div>

      {/* Statistics / Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-container/20 rounded-lg text-secondary">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <span className="text-[9px] font-bold text-secondary bg-secondary-container/10 px-1.5 py-0.5 rounded">+{pendingCount} Baru</span>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Menunggu Verifikasi</p>
          <h3 className="font-heading font-extrabold text-xl text-on-surface mt-1">{pendingCount} Mitra</h3>
          <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-secondary" style={{ width: `${partners.length > 0 ? (pendingCount / partners.length) * 100 : 0}%` }}></div>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary-container/20 rounded-lg text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <span className="text-[9px] font-bold text-primary bg-primary-container/10 px-1.5 py-0.5 rounded">Aktif</span>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Mitra Aktif</p>
          <h3 className="font-heading font-extrabold text-xl text-on-surface mt-1">{activeCount} Mitra</h3>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <div className="w-5 h-5 rounded-full border border-white bg-slate-200 flex items-center justify-center text-[7px] font-bold">K24</div>
              <div className="w-5 h-5 rounded-full border border-white bg-slate-350 flex items-center justify-center text-[7px] font-bold">KF</div>
              <div className="w-5 h-5 rounded-full border border-white bg-slate-500 flex items-center justify-center text-[7px] font-bold">RX</div>
            </div>
            <span className="text-[9px] text-on-surface-variant font-bold">Terverifikasi CDOB</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary-container/20 rounded-lg text-tertiary">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Limit Kredit Terpakai</p>
          <h3 className="font-heading font-extrabold text-xl text-on-surface mt-1 font-mono">Rp {totalLimitUsed.toLocaleString("id-ID")}</h3>
          <div className="mt-4 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-tertiary w-[45%]"></div>
          </div>
        </div>

        {/* Stat Card 4 (Warning State) */}
        <div className="bg-error-container/10 p-5 rounded-2xl shadow-sm border border-error/20 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error-container rounded-lg text-error">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <span className="text-[9px] font-bold text-error font-extrabold uppercase">Urgent</span>
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Izin/SIA Akan Kadaluwarsa</p>
          <h3 className="font-heading font-extrabold text-xl text-error mt-1">{expiringSiaCount} Mitra</h3>
          <button
            onClick={() => alert("Sistem otomatis memicu warning banner pada dasbor mitra yang masa izinnya < 60 hari.")}
            className="mt-3.5 w-full py-1 text-center text-[10px] font-bold text-error bg-error/5 rounded-lg hover:bg-error/10 transition-colors cursor-pointer"
          >
            Lihat Semua Peringatan
          </button>
        </div>
      </div>

      {/* Main Content Area: Filterable Table */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/20 overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${filter === "all" ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
            >
              Semua Mitra
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${filter === "pending" ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
            >
              Menunggu ({pendingCount})
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${filter === "active" ? "bg-primary text-white" : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
            >
              Aktif ({activeCount})
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert("Membuka filter lanjutan...")}
              className="p-2 border border-outline-variant/30 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
            <button
              onClick={() => alert("Mengunduh daftar kemitraan format CSV...")}
              className="p-2 border border-outline-variant/30 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100/90 text-slate-500 font-extrabold text-[9px] uppercase tracking-wider">
                <th className="px-6 py-4.5 font-extrabold">Nama Sarana / Mitra</th>
                <th className="px-6 py-4.5 font-extrabold">Dokumen Izin / APJ</th>
                <th className="px-6 py-4.5 text-right font-extrabold">Plafon Kredit</th>
                <th className="px-6 py-4.5 font-extrabold">Tempo (TOP)</th>
                <th className="px-6 py-4.5 font-extrabold">Status</th>
                <th className="px-6 py-4.5 text-center font-extrabold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 text-slate-700">
              {filteredPartners.map((partner) => {
                const isSiaExpired = new Date(partner.siaExpiry) <= today && new Date(partner.siaExpiry).getFullYear() < 2090;
                const user = partner.users[0];
                const isSipaExpired = user && user.sipaExpiry ? new Date(user.sipaExpiry) <= today : false;

                let badgeStatus = "VALID";
                if (!partner.isActive) badgeStatus = "PENDING";
                else if (isSiaExpired || isSipaExpired) badgeStatus = "EXPIRED";

                // Dynamic icon and type styling based on partner type
                let iconName = "local_pharmacy";
                let typeColorStyles = "bg-emerald-50 text-emerald-600 border-emerald-100/60";
                if (partner.type === "RUMAH_SAKIT") {
                  iconName = "local_hospital";
                  typeColorStyles = "bg-rose-50 text-rose-600 border-rose-100/60";
                } else if (partner.type === "KLINIK") {
                  iconName = "medical_services";
                  typeColorStyles = "bg-violet-50 text-violet-600 border-violet-100/60";
                } else if (partner.type === "PBF") {
                  iconName = "warehouse";
                  typeColorStyles = "bg-blue-50 text-blue-600 border-blue-100/60";
                }

                return (
                  <tr key={partner.id} className="hover:bg-slate-50/40 transition-colors group h-16">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100/50 shadow-sm ${
                          isSiaExpired ? "bg-red-50 text-red-500" : typeColorStyles.split(" ")[0] + " " + typeColorStyles.split(" ")[1]
                        }`}>
                          <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-extrabold text-slate-800 text-sm">{partner.name}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold border ${typeColorStyles}`}>
                              {typeLabels[partner.type] || "Mitra"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 max-w-[200px] truncate">{partner.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-150/80">{partner.siaNumber}</span>
                          <span className="text-[8px] font-extrabold bg-blue-50 text-blue-600 px-1 rounded uppercase tracking-wide">SIA</span>
                          {badgeStatus === "EXPIRED" && isSiaExpired && (
                            <span className="text-[8px] font-bold text-red-500 bg-red-50 px-1 rounded border border-red-100">EXPIRED</span>
                          )}
                        </div>
                        {user?.sipaNumber && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-500 bg-slate-50/50 px-1.5 py-0.5 rounded border border-slate-100/80">{user.sipaNumber}</span>
                            <span className="text-[8px] font-extrabold bg-indigo-50 text-indigo-600 px-1 rounded uppercase tracking-wide">SIPA</span>
                            {badgeStatus === "EXPIRED" && isSipaExpired && (
                              <span className="text-[8px] font-bold text-red-500 bg-red-50 px-1 rounded border border-red-100">EXPIRED</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <p className="font-extrabold text-slate-800 font-mono text-xs">
                          {partner.isActive ? `Rp ${partner.creditLimit.toLocaleString("id-ID")}` : "-"}
                        </p>
                        {partner.isActive && (
                          <button
                            onClick={() => handleOpenQuickEditLimit(partner)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors cursor-pointer flex items-center justify-center"
                            title="Edit Limit Kredit & TOP"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                          </button>
                        )}
                      </div>
                      {partner.isActive && (
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                          Terpakai: <span className="font-semibold text-slate-600">Rp {partner.currentDebt.toLocaleString("id-ID")}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-150/60 rounded-lg font-extrabold text-[10px]">
                        {partner.topDays} Hari
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {!partner.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-600 border border-amber-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Menunggu Verifikasi
                        </span>
                      ) : isSiaExpired || isSipaExpired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold bg-rose-50 text-red-600 border border-rose-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Diblokir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-250/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => handleOpenDetail(partner)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          !partner.isActive
                            ? "bg-primary text-white hover:brightness-110 shadow-sm shadow-primary/15"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                        }`}
                      >
                        {!partner.isActive ? "Verifikasi" : "Detail"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Sidebar Detail Overlay (Right Drawer) */}
      <div
        className={`fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-sm transition-opacity flex justify-end ${selectedDetailPartner ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        onClick={handleCloseDetail}
      >
        <div
          className={`w-full max-w-xl bg-white h-full shadow-2xl transition-transform duration-300 flex flex-col ${selectedDetailPartner ? "translate-x-0" : "translate-x-full"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-outline-variant/20 flex items-center justify-between">
            <h3 className="font-heading font-extrabold text-lg text-on-surface">Detail Verifikasi Dokumen</h3>
            <button
              className="p-1.5 hover:bg-surface-container rounded-full transition-colors cursor-pointer text-on-surface-variant"
              onClick={handleCloseDetail}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedDetailPartner && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-slate-50/50">
                {/* 1. SEKSI: AKUN PENGGUNA */}
                <div className="bg-white p-4 border border-outline-variant/30 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/15">
                    <UserIcon className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider">1. Akun Pengguna</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-outline block">Nama Registran</span>
                      <span className="font-bold text-foreground">{selectedDetailPartner.users[0]?.name || "Belum Terdaftar"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-outline block">No. WhatsApp</span>
                      <span className="font-bold text-foreground">{selectedDetailPartner.users[0]?.phone || "-"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-outline block">Email Bisnis</span>
                      <span className="font-bold text-foreground font-mono">{selectedDetailPartner.users[0]?.email || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* 2. SEKSI: IDENTITAS SARANA */}
                <div className="bg-white p-4 border border-outline-variant/30 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/15">
                    <Building className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider">2. Identitas Sarana</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-outline block">Tipe Mitra / Sarana</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 inline-block mt-0.5">
                        {typeLabels[selectedDetailPartner.type] || "Mitra"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-outline block">Nama Sarana</span>
                      <span className="font-bold text-foreground">{selectedDetailPartner.name}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-outline block">Alamat Lengkap</span>
                      <span className="font-bold text-foreground">{selectedDetailPartner.address}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-outline block">Nomor {typeLicenseLabels[selectedDetailPartner.type] || "Izin"}</span>
                      <span className="font-bold text-foreground font-mono">{selectedDetailPartner.siaNumber}</span>
                    </div>
                  </div>
                </div>

                {/* 3. SEKSI: DOKUMEN LEGALITAS */}
                <div className="bg-white p-4 border border-outline-variant/30 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/15">
                    <FileText className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider">3. Dokumen Legalitas</h4>
                  </div>
                  <div className="space-y-2">
                    {/* File Izin Sarana */}
                    <div className="flex items-center justify-between p-2 bg-slate-50 border border-outline-variant/20 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-8 h-8 text-primary shrink-0" />
                        <div className="overflow-hidden">
                          <p className="font-bold text-foreground truncate text-[10px]">{(typeLicenseLabels[selectedDetailPartner.type] || "Izin")}_{selectedDetailPartner.name.replace(/\s+/g, "_")}.pdf</p>
                          <p className="text-[8px] text-outline font-mono mt-0.5 leading-none">{selectedDetailPartner.siaNumber}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={!!loadingFileId}
                          onClick={() => handleFetchAndView(selectedDetailPartner.id, "sia", `${typeLicenseLabels[selectedDetailPartner.type] || "Izin"}_${selectedDetailPartner.name.replace(/\s+/g, "_")}`)}
                          className="p-1.5 bg-white hover:bg-slate-100 border border-outline-variant/30 rounded-lg text-primary shadow-sm hover:scale-105 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[28px]"
                          title="Preview"
                        >
                          {loadingFileId === `${selectedDetailPartner.id}-sia-view` ? (
                            <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Info className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={!!loadingFileId}
                          onClick={() => handleFetchAndDownload(selectedDetailPartner.id, "sia", `${typeLicenseLabels[selectedDetailPartner.type] || "Izin"}_${selectedDetailPartner.name.replace(/\s+/g, "_")}`)}
                          className="p-1.5 bg-white hover:bg-slate-100 border border-outline-variant/30 rounded-lg text-primary shadow-sm hover:scale-105 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[28px]"
                          title="Download"
                        >
                          {loadingFileId === `${selectedDetailPartner.id}-sia-download` ? (
                            <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* File Izin Praktik APJ */}
                    {selectedDetailPartner.users[0]?.sipaNumber && (
                      <div className="flex items-center justify-between p-2 bg-slate-50 border border-outline-variant/20 rounded-xl hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-8 h-8 text-indigo-600 shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-bold text-foreground truncate text-[10px]">{(typeApjPermitLabels[selectedDetailPartner.type] || "SIPA")}_{selectedDetailPartner.users[0]?.name.replace(/\s+/g, "_")}.pdf</p>
                            <p className="text-[8px] text-outline font-mono mt-0.5 leading-none">{selectedDetailPartner.users[0]?.sipaNumber}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={!!loadingFileId}
                            onClick={() => handleFetchAndView(selectedDetailPartner.id, "sipa", `${typeApjPermitLabels[selectedDetailPartner.type] || "SIPA"}_${selectedDetailPartner.users[0]?.name.replace(/\s+/g, "_")}`)}
                            className="p-1.5 bg-white hover:bg-slate-100 border border-outline-variant/30 rounded-lg text-indigo-600 shadow-sm hover:scale-105 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[28px]"
                            title="Preview"
                          >
                            {loadingFileId === `${selectedDetailPartner.id}-sipa-view` ? (
                              <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <Info className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={!!loadingFileId}
                            onClick={() => handleFetchAndDownload(selectedDetailPartner.id, "sipa", `${typeApjPermitLabels[selectedDetailPartner.type] || "SIPA"}_${selectedDetailPartner.users[0]?.name.replace(/\s+/g, "_")}`)}
                            className="p-1.5 bg-white hover:bg-slate-100 border border-outline-variant/30 rounded-lg text-indigo-600 shadow-sm hover:scale-105 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[28px]"
                            title="Download"
                          >
                            {loadingFileId === `${selectedDetailPartner.id}-sipa-download` ? (
                              <span className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. SEKSI: APOTEKER / PENANGGUNG JAWAB TEKNIS */}
                <div className="bg-white p-4 border border-outline-variant/30 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/15">
                    <Shield className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider">{typeApjRoleLabels[selectedDetailPartner.type] || "Penanggung Jawab"}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <span className="text-[10px] text-outline block">Nama Lengkap</span>
                      <span className="font-bold text-foreground">{selectedDetailPartner.users[0]?.name || "Belum Terdaftar"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-outline block">Nomor {typeApjPermitLabels[selectedDetailPartner.type] || "SIPA/SIPTTK"}</span>
                      <span className="font-bold text-foreground font-mono">{selectedDetailPartner.users[0]?.sipaNumber || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-outline block">Masa Berlaku {typeApjPermitLabels[selectedDetailPartner.type] || "SIPA/SIPTTK"}</span>
                      <span className={`font-bold inline-block mt-0.5 ${selectedDetailPartner.users[0]?.sipaExpiry && new Date(selectedDetailPartner.users[0].sipaExpiry) <= today
                          ? "text-error font-bold"
                          : "text-foreground"
                        }`}>
                        {selectedDetailPartner.users[0]?.sipaExpiry
                          ? new Date(selectedDetailPartner.users[0].sipaExpiry).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. SEKSI: LIMIT KREDIT & TOP (UNTUK PERUBAHAN) */}
                <div className="bg-white p-4 border border-outline-variant/30 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/15">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider">Pengaturan Limit Kredit</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Plafon Limit Kredit (IDR)</label>
                      <input
                        className="w-full p-3 bg-surface border border-outline-variant/50 rounded-xl font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                        type="number"
                        value={creditInput}
                        onChange={(e) => setCreditInput(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Term of Payment (TOP Hari)</label>
                      <input
                        className="w-full p-3 bg-surface border border-outline-variant/50 rounded-xl font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                        type="number"
                        value={topInput}
                        onChange={(e) => setTopInput(parseInt(e.target.value) || 30)}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-2xl flex gap-3.5 items-start">
                  <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[11px] text-on-primary-container leading-relaxed">
                    Data legalitas ini telah dicocokkan dengan basis data Kemenkes secara realtime. Hasil: <strong className="text-primary font-bold">Cocok (100% Autentik)</strong>
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-outline-variant/20 flex flex-col gap-3">
                {selectedDetailPartner.isActive ? (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-55 text-xs"
                    >
                      {isSubmitting ? "Memproses..." : "Simpan Perubahan"}
                    </button>
                    <div className="flex gap-4">
                      <button
                        onClick={handleSuspend}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 border border-amber-500 text-amber-600 rounded-xl font-bold hover:bg-amber-50 active:scale-95 transition-all cursor-pointer disabled:opacity-55 text-[11px]"
                      >
                        Tangguhkan Mitra
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 border border-error text-error rounded-xl font-bold hover:bg-red-50 active:scale-95 transition-all cursor-pointer disabled:opacity-55 text-[11px]"
                      >
                        Hapus Mitra
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="flex-1 py-3 border border-error text-error rounded-xl font-bold hover:bg-red-50 active:scale-95 transition-all cursor-pointer disabled:opacity-55 text-xs"
                    >
                      Hapus / Tolak Mitra
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-55 text-xs"
                    >
                      {isSubmitting ? "Memproses..." : "Terima & Aktifkan"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick Edit Limit Modal */}
      {quickEditPartner && (
        <div className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-outline-variant/30 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant/15">
              <div>
                <h4 className="font-heading font-extrabold text-sm text-foreground uppercase tracking-wide">
                  Edit Limit Kredit Mitra
                </h4>
                <p className="text-[10px] text-outline font-medium">{quickEditPartner.name}</p>
              </div>
              <button 
                onClick={() => setQuickEditPartner(null)} 
                className="text-on-surface-variant w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-outline">Plafon Limit Kredit (IDR)</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-mono font-bold text-foreground text-xs"
                  type="number"
                  value={quickLimitInput}
                  onChange={(e) => setQuickLimitInput(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-outline">Term of Payment (TOP Hari)</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold text-foreground text-xs"
                  type="number"
                  value={quickTopInput}
                  onChange={(e) => setQuickTopInput(parseInt(e.target.value) || 30)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-outline-variant/15 justify-end">
              <button
                onClick={() => setQuickEditPartner(null)}
                className="px-4 py-2 border border-outline-variant/30 text-on-surface rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveQuickLimit}
                disabled={isQuickSubmitting}
                className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:brightness-115 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isQuickSubmitting ? "Menyimpan..." : "Simpan Limit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
