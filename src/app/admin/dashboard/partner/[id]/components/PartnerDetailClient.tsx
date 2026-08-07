"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { updatePartnerDetails, suspendPartner, activatePartner, deletePartner } from "@/app/actions/partnership";
import AdminSidebar from "@/app/admin/dashboard/components/AdminSidebar";
import AdminTopBar from "@/app/admin/dashboard/components/AdminTopBar";
import {
  ChevronLeft,
  User as UserIcon,
  Building,
  CreditCard,
  History,
  Clock,
  Edit3,
  Save,
  CheckCircle,
  AlertCircle,
  Trash2,
  Shield,
  FileText,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

import { getInstitutionTypeInfo } from "@/lib/institution-helpers";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  sipaNumber: string | null;
  sipaExpiry: Date | string | null;
  sipaFileUrl?: string | null;
}

interface OrderItem {
  id: string;
  productId: string;
  product: {
    name: string;
    code: string;
    activeIngredient: string;
    unit: string;
  };
  quantity: number;
  price: number;
}

interface OrderBatchAllocation {
  id: string;
  batchId: string;
  batch: {
    batchNumber: string;
    expiryDate: Date | string;
  };
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: Date | string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress?: string | null;
  shippingFee?: number | null;
  items: OrderItem[];
  batchAllocations: OrderBatchAllocation[];
}

function calculateOrderTotals(order: any) {
  const subtotal = order.items ? order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0) : 0;
  const vat = Math.round(subtotal * 0.11);

  let shippingFee = order.shippingFee || 0;
  if (!shippingFee && order.shippingAddress) {
    const feeMatch = order.shippingAddress.match(/-\s*Rp\s*([0-9.,]+)/);
    if (feeMatch && feeMatch[1]) {
      shippingFee = parseInt(feeMatch[1].replace(/[.,]/g, ""), 10) || 0;
    } else if (order.shippingAddress.includes("Kurir: Standard Flat Rate")) {
      const isColdChain = (order.items || []).some((item: any) =>
        item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain" ||
        item.product?.name?.toLowerCase().includes("insulin") || item.product?.code?.toLowerCase().includes("amx")
      );
      shippingFee = isColdChain ? 85000 : 50000;
    } else {
      shippingFee = 50000;
    }
  } else if (!shippingFee) {
    shippingFee = 50000;
  }

  const total = subtotal + vat + shippingFee;
  return { subtotal, vat, shippingFee, total };
}

interface Partner {
  id: string;
  name: string;
  type: string;
  siaNumber: string;
  siaExpiry: Date | string;
  siaFileUrl: string | null;
  address: string;
  creditLimit: number;
  currentDebt: number;
  topDays: number;
  isActive: boolean;
  ownerKtp: string | null;
  ownerNpwp: string | null;
  bpomCode: string;
  users: User[];
  orders: Order[];
}

interface PartnerDetailClientProps {
  partner: Partner;
  allPartners: any[];
  allOrders: any[];
  adminName: string;
  adminRole: string;
}

const typeLabels: Record<string, string> = {
  APOTEK: "Apotek",
  KLINIK: "Klinik",
  RUMAH_SAKIT: "Rumah Sakit",
  PBF: "PBF/Distributor",
  PERUSAHAAN_UMUM: "Perusahaan Umum",
};

export default function PartnerDetailClient({
  partner,
  allPartners,
  allOrders,
  adminName,
  adminRole,
}: PartnerDetailClientProps) {
  const router = useRouter();
  const typeInfo = getInstitutionTypeInfo(partner.type);
  const [activeTab, setActiveTab] = useState<"profile" | "finance" | "history" | "outstanding">("profile");
  const [isEditing, setIsEditing] = useState(false);

  // Form States (Institution)
  const [instName, setInstName] = useState(partner.name);
  const [instType, setInstType] = useState(partner.type);
  const [instSiaNumber, setInstSiaNumber] = useState(partner.siaNumber);
  const [instSiaExpiry, setInstSiaExpiry] = useState(
    partner.siaExpiry ? new Date(partner.siaExpiry).toISOString().split("T")[0] : ""
  );
  const [instAddress, setInstAddress] = useState(partner.address);
  const [instCreditLimit, setInstCreditLimit] = useState(partner.creditLimit);
  const [instTopDays, setInstTopDays] = useState(partner.topDays);
  const [instOwnerKtp, setInstOwnerKtp] = useState(partner.ownerKtp || "");
  const [instOwnerNpwp, setInstOwnerNpwp] = useState(partner.ownerNpwp || "");
  const [instBpomCode, setInstBpomCode] = useState(partner.bpomCode || "");

  // Form States (User APJ)
  const apjUser = partner.users[0] || {
    name: "",
    email: "",
    phone: "",
    sipaNumber: "",
    sipaExpiry: "",
  };
  const [userName, setUserName] = useState(apjUser.name);
  const [userEmail, setUserEmail] = useState(apjUser.email);
  const [userPhone, setUserPhone] = useState(apjUser.phone || "");
  const [userSipaNumber, setUserSipaNumber] = useState(apjUser.sipaNumber || "");
  const [userSipaExpiry, setUserSipaExpiry] = useState(
    apjUser.sipaExpiry ? new Date(apjUser.sipaExpiry).toISOString().split("T")[0] : ""
  );

  // Status & Submit States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Selected Order for detail overlay
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Calculations
  const availableCredit = instCreditLimit - partner.currentDebt;
  const creditUsagePercent = instCreditLimit > 0 ? (partner.currentDebt / instCreditLimit) * 100 : 0;

  // Filter Outstanding
  const outstandingOrders = partner.orders.filter(
    (o) => o.paymentStatus === "UNPAID" || o.paymentStatus === "PENDING_VERIFICATION"
  );

  // Sidebar Counts
  const pendingApprovalsCount = allOrders.filter((o: any) => o.status === "PENDING_APPROVAL").length;
  const pendingPaymentsCount = allOrders.filter((o: any) => o.paymentStatus === "PENDING_VERIFICATION").length;
  const pendingLogisticsCount = allOrders.filter((o: any) => o.status === "PENDING_SHIPPING").length;
  const pendingPartnersCount = allPartners.filter((p: any) => !p.isActive).length;

  const handleSetActiveTab = (tab: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_active_tab", tab);
    }
    router.push("/admin/dashboard");
  };

  const handleLogout = async () => {
    window.location.href = "/api/logout";
  };

  const handleViewFile = (fileUrl: string | null | undefined, defaultFileName: string) => {
    if (!fileUrl) {
      alert("Berkas/Dokumen tidak tersedia atau belum diunggah.");
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
    if (!fileUrl) {
      alert("Berkas/Dokumen tidak tersedia atau belum diunggah.");
      return;
    }
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = defaultFileName.endsWith(".pdf") ? defaultFileName : `${defaultFileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const result = await updatePartnerDetails(partner.id, {
      name: instName,
      type: instType,
      siaNumber: instSiaNumber,
      siaExpiry: instSiaExpiry,
      address: instAddress,
      creditLimit: instCreditLimit,
      topDays: instTopDays,
      ownerKtp: instOwnerKtp || null,
      ownerNpwp: instOwnerNpwp || null,
      bpomCode: instBpomCode,
      user: {
        name: userName,
        email: userEmail,
        phone: userPhone || null,
        sipaNumber: userSipaNumber || null,
        sipaExpiry: userSipaExpiry || null,
      },
    });

    setIsSubmitting(false);
    if (result.success) {
      setFeedback({ type: "success", message: "Informasi kemitraan berhasil diperbarui!" });
      setIsEditing(false);
      router.refresh();
    } else {
      setFeedback({ type: "error", message: result.error || "Gagal memperbarui data mitra" });
    }
  };

  const handleToggleStatus = async () => {
    setIsStatusChanging(true);
    setFeedback(null);
    let result;

    if (partner.isActive) {
      if (confirm(`Apakah Anda yakin ingin menangguhkan ${partner.name}? Mitra ini tidak akan bisa melakukan pemesanan baru.`)) {
        result = await suspendPartner(partner.id);
      }
    } else {
      if (confirm(`Apakah Anda yakin ingin mengaktifkan ${partner.name}?`)) {
        result = await activatePartner(partner.id, instCreditLimit, instTopDays);
      }
    }

    setIsStatusChanging(false);
    if (result) {
      if (result.success) {
        setFeedback({ type: "success", message: result.message || "Status kemitraan berhasil diperbarui!" });
        router.refresh();
      } else {
        setFeedback({ type: "error", message: result.error || "Gagal memperbarui status mitra" });
      }
    }
  };

  const handleDelete = async () => {
    if (confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus permanen ${partner.name}? Seluruh riwayat transaksi dan data user terkait akan terhapus selamanya.`)) {
      setIsStatusChanging(true);
      const result = await deletePartner(partner.id);
      setIsStatusChanging(false);
      if (result.success) {
        alert(result.message);
        router.push("/admin/dashboard");
      } else {
        setFeedback({ type: "error", message: result.error || "Gagal menghapus mitra" });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Menunggu SP</span>;
      case "PENDING_SHIPPING":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Siap Dikirim</span>;
      case "SHIPPED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Dikirim</span>;
      case "DELIVERED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Diterima</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Ditolak</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">{status}</span>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "UNPAID":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Belum Bayar</span>;
      case "PENDING_VERIFICATION":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Verifikasi</span>;
      case "PAID":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Lunas</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Left Sidebar */}
      <AdminSidebar
        activeTab="kemitraan"
        setActiveTab={handleSetActiveTab}
        pendingApprovalsCount={pendingApprovalsCount}
        pendingPaymentsCount={pendingPaymentsCount}
        pendingLogisticsCount={pendingLogisticsCount}
        pendingPartnersCount={pendingPartnersCount}
        handleLogout={handleLogout}
        adminRole={adminRole}
      />

      <main className="ml-64 min-h-screen flex flex-col">
        {/* Top Navbar */}
        <AdminTopBar
          adminName={adminName}
          pendingPartnersCount={pendingPartnersCount}
          setActiveTab={handleSetActiveTab}
        />

        {/* Content Canvas */}
        <div className="pt-24 pb-12 px-6 max-w-[1600px] w-full mx-auto flex-1">
          {/* Header Panel */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mb-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <button
                  onClick={() => handleSetActiveTab("kemitraan")}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-all bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border-none cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Kembali ke Kemitraan
                </button>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl md:text-2xl font-heading font-extrabold tracking-tight text-slate-900">
                    {partner.name}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider ${
                      partner.isActive
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-rose-100 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {partner.isActive ? "Aktif" : "Ditangguhkan"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Tipe: {typeLabels[partner.type]} | Alamat: {partner.address}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                <button
                  onClick={handleToggleStatus}
                  disabled={isStatusChanging}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer border border-none ${
                    partner.isActive
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-emerald-800 hover:bg-emerald-900 text-white"
                  }`}
                >
                  {isStatusChanging ? "Memproses..." : partner.isActive ? "Tangguhkan Mitra" : "Aktifkan Mitra"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isStatusChanging}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-rose-600 rounded-xl transition-all cursor-pointer border border-none shadow-sm"
                  title="Hapus Mitra Permanen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`mb-6 p-4 rounded-2xl flex items-start gap-3 border text-xs font-medium animate-fade-up ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <p>{feedback.message}</p>
            </div>
          )}

          {/* Sub-Tab Controls */}
          <div className="flex border-b border-slate-200 mb-6 overflow-x-auto hide-scrollbar gap-1 bg-white p-1 rounded-2xl shadow-sm">
            <button
              onClick={() => {
                setActiveTab("profile");
                setFeedback(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer whitespace-nowrap ${
                activeTab === "profile"
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Building className="w-4 h-4" />
              Profil &amp; Ubah Data
            </button>
            <button
              onClick={() => {
                setActiveTab("finance");
                setFeedback(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer whitespace-nowrap ${
                activeTab === "finance"
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Kredit &amp; Keuangan
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                setFeedback(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer whitespace-nowrap ${
                activeTab === "history"
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <History className="w-4 h-4" />
              Riwayat Transaksi
            </button>
            <button
              onClick={() => {
                setActiveTab("outstanding");
                setFeedback(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer whitespace-nowrap relative ${
                activeTab === "outstanding"
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Clock className="w-4 h-4" />
              Utang Belum Lunas
              {outstandingOrders.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black bg-rose-500 text-white rounded-full">
                  {outstandingOrders.length}
                </span>
              )}
            </button>
          </div>

          {/* Sub-Tab Contents */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in">
            {/* TAB 1: PROFILE & EDIT */}
            {activeTab === "profile" && (
              <form onSubmit={handleSave} className="space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-heading font-extrabold text-slate-900 uppercase tracking-wider">
                      Profil Identitas Kemitraan
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Data legalitas perusahaan dan apoteker penanggung jawab yang berwenang.
                    </p>
                  </div>
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-800 border-none rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Ubah Data
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFeedback(null);
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border-none rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-950 text-white border-none rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Instansi Form */}
                  <div className="space-y-5">
                    <h4 className="font-bold text-slate-800 text-xs border-l-4 border-emerald-700 pl-2">
                      Data Perusahaan / Instansi
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                        Nama Instansi
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={instName}
                        onChange={(e) => setInstName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          Tipe Sarana
                        </label>
                        <select
                          disabled={!isEditing}
                          value={instType}
                          onChange={(e) => setInstType(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75"
                        >
                          <option value="APOTEK">Apotek</option>
                          <option value="KLINIK">Klinik</option>
                          <option value="RUMAH_SAKIT">Rumah Sakit</option>
                          <option value="PBF">PBF / Distributor</option>
                          <option value="PERUSAHAAN_UMUM">Perusahaan Umum</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          Kode BPOM Resmi
                        </label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={instBpomCode}
                          onChange={(e) => setInstBpomCode(e.target.value)}
                          placeholder="Masukkan kode BPOM"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          Nomor {typeInfo.licenseShort} / Izin
                        </label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={instSiaNumber}
                          onChange={(e) => setInstSiaNumber(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          Masa Berlaku Izin
                        </label>
                        <input
                          type="date"
                          disabled={!isEditing}
                          value={instSiaExpiry}
                          onChange={(e) => setInstSiaExpiry(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                        Alamat Instansi
                      </label>
                      <textarea
                        disabled={!isEditing}
                        value={instAddress}
                        onChange={(e) => setInstAddress(e.target.value)}
                        required
                        rows={3}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          KTP/NIK Pemilik Sarana
                        </label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={instOwnerKtp}
                          onChange={(e) => setInstOwnerKtp(e.target.value)}
                          placeholder="NIK KTP Pemilik"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          NPWP Pemilik/Perusahaan
                        </label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={instOwnerNpwp}
                          onChange={(e) => setInstOwnerNpwp(e.target.value)}
                          placeholder="Nomor NPWP"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75"
                        />
                      </div>
                    </div>
                  </div>

                  {/* APJ Form */}
                  <div className="space-y-5">
                    <h4 className="font-bold text-slate-800 text-xs border-l-4 border-emerald-700 pl-2">
                      Data Apoteker Penanggung Jawab (APJ)
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                        Nama Lengkap Apoteker
                      </label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          Email Kontak
                        </label>
                        <input
                          type="email"
                          disabled={!isEditing}
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          Nomor Handphone/WA
                        </label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          Nomor SIPA
                        </label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={userSipaNumber}
                          onChange={(e) => setUserSipaNumber(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          Masa Berlaku SIPA
                        </label>
                        <input
                          type="date"
                          disabled={!isEditing}
                          value={userSipaExpiry}
                          onChange={(e) => setUserSipaExpiry(e.target.value)}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75"
                        />
                      </div>
                    </div>

                    {/* Financial Quick Controls */}
                    <h4 className="font-bold text-slate-800 text-xs border-l-4 border-emerald-700 pl-2 pt-4">
                      Batas Finansial Mitra
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          Kredit Limit (Rp)
                        </label>
                        <input
                          type="number"
                          disabled={!isEditing}
                          value={instCreditLimit}
                          onChange={(e) => setInstCreditLimit(parseFloat(e.target.value) || 0)}
                          required
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
                          TOP (Term of Payment - Hari)
                        </label>
                        <input
                          type="number"
                          disabled={!isEditing}
                          value={instTopDays}
                          onChange={(e) => setInstTopDays(parseInt(e.target.value, 10) || 0)}
                          required
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-primary disabled:opacity-75"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dokumen Legalitas */}
                <div className="mt-8 pt-8 border-t border-slate-100 space-y-4 col-span-2">
                  <h4 className="font-bold text-slate-800 text-xs border-l-4 border-emerald-700 pl-2">
                    Dokumen Legalitas &amp; Perizinan
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* SIA / Izin Card */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                      <FileText className="w-8 h-8 text-emerald-800 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dokumen {typeInfo.licenseShort} / Izin Sarana</span>
                        <p className="text-[11px] font-bold text-slate-900 truncate">
                          SIA_{partner.name.replace(/\s+/g, "_")}.pdf
                        </p>
                        <p className="text-[9px] font-mono text-slate-400 truncate">{partner.siaNumber}</p>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleViewFile(partner.siaFileUrl, `SIA_${partner.name.replace(/\s+/g, "_")}`)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 cursor-pointer"
                          >
                            Lihat
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(partner.siaFileUrl, `SIA_${partner.name.replace(/\s+/g, "_")}`)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 cursor-pointer"
                          >
                            Unduh
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SIPA Card */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                      <FileText className="w-8 h-8 text-emerald-800 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dokumen SIPA / SIPTTK APJ</span>
                        {partner.users[0]?.sipaNumber ? (
                          <>
                            <p className="text-[11px] font-bold text-slate-900 truncate">
                              SIPA_{(partner.users[0]?.name || "APJ").replace(/\s+/g, "_")}.pdf
                            </p>
                            <p className="text-[9px] font-mono text-slate-400 truncate">{partner.users[0]?.sipaNumber}</p>
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleViewFile(partner.users[0]?.sipaFileUrl, `SIPA_${(partner.users[0]?.name || "APJ").replace(/\s+/g, "_")}`)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 cursor-pointer"
                              >
                                Lihat
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(partner.users[0]?.sipaFileUrl, `SIPA_${(partner.users[0]?.name || "APJ").replace(/\s+/g, "_")}`)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-bold text-slate-700 cursor-pointer"
                              >
                                Unduh
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="text-[10px] text-slate-400 font-medium">Belum ada SIPA yang diunggah.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: CREDIT & FINANCE */}
            {activeTab === "finance" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 uppercase tracking-wider">
                    Analisis Keuangan &amp; Batas Kredit
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tinjauan pemanfaatan saldo kredit berjalan dan histori penagihan.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Kredit Limit</span>
                    <span className="text-xl font-heading font-black text-slate-900 mt-2">
                      Rp {instCreditLimit.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-1">Batas maksimum utang disetujui</span>
                  </div>

                  <div className="p-5 bg-rose-50/40 rounded-2xl border border-rose-100/50 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Total Hutang Berjalan</span>
                    <span className="text-xl font-heading font-black text-rose-800 mt-2">
                      Rp {partner.currentDebt.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[9px] text-rose-600/70 mt-1">Utang transaksi belum lunas</span>
                  </div>

                  <div className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Sisa Saldo Kredit</span>
                    <span className="text-xl font-heading font-black text-emerald-800 mt-2">
                      Rp {availableCredit.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[9px] text-emerald-600/70 mt-1">Kredit yang siap digunakan</span>
                  </div>
                </div>

                {/* Progress Utilization */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Rasio Pemanfaatan Kredit</span>
                    <span className="font-mono font-bold text-slate-900">{creditUsagePercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        creditUsagePercent > 85
                          ? "bg-rose-500"
                          : creditUsagePercent > 50
                          ? "bg-amber-500"
                          : "bg-emerald-600"
                      }`}
                      style={{ width: `${Math.min(creditUsagePercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-400">
                    <span>0% (Kosong)</span>
                    <span>100% (Limit Tercapai)</span>
                  </div>
                </div>

                {/* TOP Indicator */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Term of Payment (Jatuh Tempo)</h4>
                    <p className="text-[10px] text-slate-500">Masa toleransi pelunasan setelah faktur dikirimkan.</p>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-extrabold font-mono shadow-sm">
                    {instTopDays} Hari
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TRANSACTION HISTORY */}
            {activeTab === "history" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 uppercase tracking-wider">
                    Riwayat Lengkap Pemesanan
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Daftar transaksi, dokumen pendukung, dan status FEFO batch untuk pesanan mitra.
                  </p>
                </div>

                {partner.orders.length === 0 ? (
                  <div className="py-12 text-center space-y-2 border-2 border-dashed border-slate-200 rounded-3xl">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Belum Ada Transaksi</p>
                    <p className="text-[10px] text-slate-400">Mitra ini belum pernah melakukan pemesanan obat.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">
                          <th className="p-4">No. Order</th>
                          <th className="p-4">Tanggal SP</th>
                          <th className="p-4">Status Pesanan</th>
                          <th className="p-4">Pembayaran</th>
                          <th className="p-4">Total Belanja</th>
                          <th className="p-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                        {partner.orders.map((order) => {
                          const { total: totalAmount } = calculateOrderTotals(order);
                          return (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="p-4 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                              <td className="p-4">
                                {new Date(order.createdAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="p-4">{getStatusBadge(order.status)}</td>
                              <td className="p-4">{getPaymentStatusBadge(order.paymentStatus)}</td>
                              <td className="p-4 font-bold text-slate-900">
                                Rp {totalAmount.toLocaleString("id-ID")}
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white border-none rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                                >
                                  Lihat Rincian
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: OUTSTANDING DEBTS */}
            {activeTab === "outstanding" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-heading font-extrabold text-slate-900 uppercase tracking-wider">
                    Daftar Transaksi Terutang
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Daftar pesanan berjalan dengan status pembayaran belum lunas atau menunggu verifikasi transfer.
                  </p>
                </div>

                {outstandingOrders.length === 0 ? (
                  <div className="py-12 text-center space-y-2 border-2 border-dashed border-slate-200 rounded-3xl bg-emerald-50/20">
                    <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-emerald-800">Pembayaran Bersih!</p>
                    <p className="text-[10px] text-emerald-600/75">Mitra ini tidak memiliki utang berjalan saat ini.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {outstandingOrders.map((order) => {
                      const { total: totalAmount } = calculateOrderTotals(order);
                      return (
                        <div
                          key={order.id}
                          className="p-5 border border-slate-100 rounded-2xl hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-900">{order.orderNumber}</span>
                              {getPaymentStatusBadge(order.paymentStatus)}
                              <span className="text-[10px] text-slate-400 font-medium">
                                ({new Date(order.createdAt).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
                              Membeli: {order.items.map((it) => `${it.product.name} (${it.quantity} ${it.product.unit})`).join(", ")}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-bold">Nilai Tagihan</span>
                              <span className="text-xs font-bold text-rose-600 font-mono">
                                Rp {totalAmount.toLocaleString("id-ID")}
                              </span>
                            </div>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white border-none rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                            >
                              Rincian Barang
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* OVERLAY / MODAL: Order Detail & FEFO Batch Allocation */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-heading font-black text-lg text-slate-900">
                  Rincian Pesanan {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dibuat pada: {new Date(selectedOrder.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Pesanan</span>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Pembayaran</span>
                {getPaymentStatusBadge(selectedOrder.paymentStatus)}
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Daftar Produk</h4>
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-100">
                      <th className="p-3">Nama Obat</th>
                      <th className="p-3 text-center">Jumlah</th>
                      <th className="p-3 text-right">Harga Satuan</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{item.product.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                            SKU: {item.product.code} | Zat: {item.product.activeIngredient}
                          </p>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-900">
                          {item.quantity} {item.product.unit}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-900">
                          Rp {item.price.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          Rp {(item.quantity * item.price).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FEFO Batch Allocation Details */}
            {selectedOrder.batchAllocations && selectedOrder.batchAllocations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Alokasi Batch Obat (FEFO)
                </h4>
                <div className="bg-emerald-50/20 border border-emerald-100/50 p-4 rounded-2xl space-y-2.5 text-xs">
                  {selectedOrder.batchAllocations.map((alloc) => (
                    <div key={alloc.id} className="flex justify-between items-center text-slate-700 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                        <span>No. Batch: <span className="font-mono font-bold text-slate-900">{alloc.batch.batchNumber}</span></span>
                        <span className="text-[10px] text-slate-400">
                          (Exp: {new Date(alloc.batch.expiryDate).toLocaleDateString("id-ID")})
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {alloc.quantity} Unit dialokasikan
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Footer Breakdown */}
            <div className="pt-4 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                <span>Subtotal Produk</span>
                <span className="font-mono font-bold text-slate-700">
                  Rp {calculateOrderTotals(selectedOrder).subtotal.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                <span>PPN (11%)</span>
                <span className="font-mono font-bold text-slate-700">
                  Rp {calculateOrderTotals(selectedOrder).vat.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                <span>Biaya Pengiriman & Kurir</span>
                <span className="font-mono font-bold text-slate-700">
                  Rp {calculateOrderTotals(selectedOrder).shippingFee.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase">Total Akumulasi Transaksi</span>
                <span className="text-lg font-heading font-black text-emerald-800 font-mono">
                  Rp {calculateOrderTotals(selectedOrder).total.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
