"use client";

import { useState, useEffect } from "react";
import {
  getAdminUsers,
  createAdminUser,
  deleteAdminUser,
  getSystemSettings,
  updateSystemSettings,
} from "@/app/actions/superadmin";
import { getCmsPage, updateCmsPage, CmsPageData } from "@/app/actions/cms";
import {
  Users,
  UserPlus,
  Trash2,
  Save,
  Image,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  Lock,
  Mail,
  User,
  Phone,
  Shield,
  ShieldCheck,
  FileText,
  ExternalLink,
  Clock,
  Activity,
  Wallet,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { getSecurityAuditLogs } from "@/app/actions/password-reset";

interface SuperAdminTabProps {
  currentUserEmail: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  sipaNumber: string | null;
  sipaExpiry: Date | null;
}

export default function SuperAdminTab({ currentUserEmail }: SuperAdminTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "settings" | "topup">("users");
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({
    logo_url: "",
    app_name: "",
    favicon_url: "",
  });

  // Top-Up Approval State (Midtrans)
  const [topUpRequestsList, setTopUpRequestsList] = useState<any[]>([]);
  const [loadingTopUpList, setLoadingTopUpList] = useState(false);
  const [processingTopUpId, setProcessingTopUpId] = useState<string | null>(null);

  const fetchTopUpList = async () => {
    setLoadingTopUpList(true);
    try {
      const { getTopUpRequests } = await import("@/app/actions/topup");
      const res = await getTopUpRequests();
      if (res.success && res.requests) {
        setTopUpRequestsList(res.requests);
      }
    } catch (e) {
      console.error("Gagal mengambil daftar topup:", e);
    } finally {
      setLoadingTopUpList(false);
    }
  };

  const handleApproveTopUp = async (id: string, amount: number) => {
    if (!confirm(`Apakah Anda yakin ingin menyetujui Top-Up sebesar Rp. ${amount.toLocaleString("id-ID")} ini? Saldo Deposit API Shipping akan langsung bertambah.`)) return;
    setProcessingTopUpId(id);
    try {
      const { approveTopUpRequest } = await import("@/app/actions/topup");
      const res = await approveTopUpRequest(id);
      if (res.success) {
        showAlert("success", res.message || "Top-Up berhasil disetujui!");
        await fetchTopUpList();
      } else {
        showAlert("error", res.error || "Gagal menyetujui top-up");
      }
    } catch (e: any) {
      showAlert("error", e.message);
    } finally {
      setProcessingTopUpId(null);
    }
  };

  const handleRejectTopUp = async (id: string) => {
    const reason = prompt("Masukkan alasan penolakan top-up:", "Pembayaran tidak valid / Dibatalkan");
    if (reason === null) return;
    setProcessingTopUpId(id);
    try {
      const { rejectTopUpRequest } = await import("@/app/actions/topup");
      const res = await rejectTopUpRequest(id, reason);
      if (res.success) {
        showAlert("success", res.message || "Pengajuan Top-Up berhasil ditolak.");
        await fetchTopUpList();
      } else {
        showAlert("error", res.error || "Gagal menolak top-up");
      }
    } catch (e: any) {
      showAlert("error", e.message);
    } finally {
      setProcessingTopUpId(null);
    }
  };

  // Loading & Alert States
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // CMS Pages States
  const [selectedCmsSlug, setSelectedCmsSlug] = useState<string>("about");
  const [loadingCms, setLoadingCms] = useState(false);
  const [isSavingCms, setIsSavingCms] = useState(false);
  const [cmsForm, setCmsForm] = useState<{ title: string; subtitle: string; body: string }>({
    title: "",
    subtitle: "",
    body: "",
  });

  // Security Audit Logs State
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [loadingSecurityLogs, setLoadingSecurityLogs] = useState(false);

  const loadSecurityAuditLogs = async () => {
    setLoadingSecurityLogs(true);
    try {
      const logs = await getSecurityAuditLogs();
      setSecurityLogs(logs);
    } catch (err: any) {
      console.error("Gagal memuat Security Audit Logs:", err);
    } finally {
      setLoadingSecurityLogs(false);
    }
  };

  const loadCmsPageData = async (slug: string) => {
    setLoadingCms(true);
    try {
      const page = await getCmsPage(slug);
      setCmsForm({
        title: page.title,
        subtitle: page.subtitle,
        body: page.body,
      });
    } catch (err: any) {
      console.error("Gagal memuat CMS page:", err);
    } finally {
      setLoadingCms(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "settings") {
      loadCmsPageData(selectedCmsSlug);
      loadSecurityAuditLogs();
    } else if (activeSubTab === "topup") {
      fetchTopUpList();
    }
  }, [selectedCmsSlug, activeSubTab]);

  const handleSaveCms = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCms(true);
    try {
      const res = await updateCmsPage(selectedCmsSlug, cmsForm);
      if (res.success) {
        showAlert("success", res.message || "Halaman berhasil diperbarui");
      } else {
        showAlert("error", res.error || "Gagal memperbarui halaman");
      }
    } catch (err: any) {
      showAlert("error", err.message || "Terjadi kesalahan saat menyimpan halaman");
    } finally {
      setIsSavingCms(false);
    }
  };

  // User Form States
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "PBF_ADMIN" as "PBF_ADMIN" | "SYSTEM_ADMIN",
    phone: "",
    sipaNumber: "",
    sipaExpiry: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Fetch Admins list
  const fetchAdmins = async () => {
    setLoadingUsers(true);
    try {
      const data = await getAdminUsers();
      setAdminsList(data as any);
    } catch (error: any) {
      showAlert("error", error.message || "Gagal mengambil daftar admin");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch settings
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const data = await getSystemSettings();
      setSettings({
        logo_url: data.logo_url || "https://res.cloudinary.com/rumahhostcom/image/upload/v1785321525/logo_care_fcfgwq.png",
        app_name: data.app_name || "GroovyCare",
        favicon_url: data.favicon_url || "/favicon/favicon.ico",
        biteship_api_key: data.biteship_api_key || "",
      });
    } catch (error: any) {
      showAlert("error", error.message || "Gagal mengambil pengaturan sistem");
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchSettings();
  }, []);

  const showAlert = (type: "success" | "error", text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage(null);
    }, 5000);
  };

  // Handle create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingUser(true);
    try {
      const res = await createAdminUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        phone: newUser.phone,
        sipaNumber: newUser.role === "PBF_ADMIN" ? newUser.sipaNumber : undefined,
        sipaExpiry: newUser.role === "PBF_ADMIN" && newUser.sipaExpiry ? newUser.sipaExpiry : undefined,
      });

      if (res.success) {
        showAlert("success", res.message || "Admin berhasil dibuat");
        setNewUser({
          name: "",
          email: "",
          password: "",
          role: "PBF_ADMIN",
          phone: "",
          sipaNumber: "",
          sipaExpiry: "",
        });
        fetchAdmins();
      } else {
        showAlert("error", res.error || "Gagal membuat admin");
      }
    } catch (error: any) {
      showAlert("error", error.message || "Terjadi kesalahan");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun admin ${name}?`)) return;

    try {
      const res = await deleteAdminUser(id);
      if (res.success) {
        showAlert("success", res.message || "Admin berhasil dihapus");
        fetchAdmins();
      } else {
        showAlert("error", res.error || "Gagal menghapus admin");
      }
    } catch (error: any) {
      showAlert("error", error.message || "Terjadi kesalahan");
    }
  };

  // Handle save settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await updateSystemSettings(settings);
      if (res.success) {
        showAlert("success", res.message || "Pengaturan berhasil disimpan");
        // Force refresh halaman agar logo terupdate di header
        window.location.reload();
      } else {
        showAlert("error", res.error || "Gagal menyimpan pengaturan");
      }
    } catch (error: any) {
      showAlert("error", error.message || "Terjadi kesalahan");
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn font-sans">

      {/* Tab Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-8 shadow-xl border border-white/5">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">admin_panel_settings</span>
              <h2 className="font-heading font-extrabold text-2xl tracking-tight">Super Admin Panel</h2>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Pusat kendali teknis untuk mengelola kredensial admin operasional (PBF_ADMIN) serta menyesuaikan identitas dan parameter sistem.
            </p>
          </div>

          {/* Sub Tabs Toggle */}
          <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex gap-2 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab("users")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === "users"
                  ? "bg-primary text-white shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
            >
              <Users className="w-4 h-4" />
              Manajemen Admin
            </button>
            <button
              onClick={() => setActiveSubTab("settings")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === "settings"
                  ? "bg-primary text-white shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
            >
              <Image className="w-4 h-4" />
              Pengaturan Sistem
            </button>
            {currentUserEmail === "admin@growmexa.com" && (
              <button
                onClick={() => setActiveSubTab("topup")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === "topup"
                    ? "bg-primary text-white shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
              >
                <Wallet className="w-4 h-4" />
                Persetujuan Top-Up (Midtrans)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {alertMessage && (
        <div
          className={`flex items-center gap-3 px-5 py-4 rounded-2xl border text-xs font-medium shadow-sm animate-slideDown ${alertMessage.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
            }`}
        >
          {alertMessage.type === "success" ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* Dynamic Content */}
      <div className="grid grid-cols-1 gap-8">
        {/* TAB 1: MANAJEMEN ADMIN */}
        {activeSubTab === "users" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left/Middle Column: Admins List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-heading font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Daftar Pengguna Admin ({adminsList.length})
                  </h3>
                  <button
                    onClick={fetchAdmins}
                    className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Refresh Data
                  </button>
                </div>

                {loadingUsers ? (
                  <div className="py-12 text-center text-xs text-on-surface-variant flex flex-col items-center justify-center gap-3">
                    <span className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></span>
                    Membaca daftar admin...
                  </div>
                ) : adminsList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-on-surface-variant border-2 border-dashed border-outline-variant/20 rounded-2xl">
                    Tidak ada admin terdaftar.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-outline-variant/20 text-on-surface-variant font-bold">
                          <th className="pb-3 pr-4 font-bold uppercase tracking-wider text-[10px]">Identitas Admin</th>
                          <th className="pb-3 px-4 font-bold uppercase tracking-wider text-[10px]">Kontak</th>
                          <th className="pb-3 px-4 font-bold uppercase tracking-wider text-[10px]">Role / SIPA</th>
                          <th className="pb-3 pl-4 text-right font-bold uppercase tracking-wider text-[10px]">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminsList.map((admin) => (
                          <tr key={admin.id} className="border-b border-outline-variant/10 last:border-none hover:bg-slate-50/50 transition-colors">
                            {/* Identitas */}
                            <td className="py-4 pr-4">
                              <div className="font-bold text-slate-950">{admin.name}</div>
                              <div className="text-[10px] text-on-surface-variant/80 font-mono mt-0.5">{admin.email}</div>
                              {admin.email === currentUserEmail && (
                                <span className="inline-block bg-primary/10 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 font-sans">
                                  Sesi Aktif Anda
                                </span>
                              )}
                            </td>
                            {/* Kontak */}
                            <td className="py-4 px-4 text-slate-700">
                              {admin.phone || "-"}
                            </td>
                            {/* Role / SIPA */}
                            <td className="py-4 px-4">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide ${admin.role === "SYSTEM_ADMIN"
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                    : "bg-teal-50 text-teal-700 border border-teal-200"
                                  }`}
                              >
                                {admin.role}
                              </span>
                              {admin.role === "PBF_ADMIN" && admin.sipaNumber && (
                                <div className="mt-1.5 text-[10px] text-slate-600 font-medium">
                                  No SIPA: <code className="font-mono text-primary">{admin.sipaNumber}</code>
                                </div>
                              )}
                            </td>
                            {/* Aksi */}
                            <td className="py-4 pl-4 text-right">
                              {admin.email === currentUserEmail ? (
                                <span className="text-[10px] text-slate-400 font-bold italic">Tidak Bisa Dihapus</span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteUser(admin.id, admin.name)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all inline-flex items-center cursor-pointer"
                                  title="Hapus Admin"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Create User Form */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm sticky top-24">
                <h3 className="font-heading font-extrabold text-base text-slate-900 mb-6 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  Buat Admin Baru
                </h3>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-on-surface-variant/75" />
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Apt. John Doe, M.Farm"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-on-surface-variant/75" />
                      Email Login
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@groovycare.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-on-surface-variant/75" />
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Minimal 6 karakter"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full pl-3.5 pr-10 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-primary cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role Select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-on-surface-variant/75" />
                      Role Kredensial
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all cursor-pointer font-bold text-slate-800"
                    >
                      <option value="PBF_ADMIN">PBF_ADMIN (Admin Operasional)</option>
                      {currentUserEmail === "admin@growmexa.com" && (
                        <option value="SYSTEM_ADMIN">SYSTEM_ADMIN (Super Admin)</option>
                      )}
                    </select>
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-on-surface-variant/75" />
                      Nomor Telepon
                    </label>
                    <input
                      type="text"
                      placeholder="0812xxxxxxxx"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* PBF_ADMIN specific fields */}
                  {newUser.role === "PBF_ADMIN" && (
                    <div className="space-y-4 pt-3 border-t border-outline-variant/20 animate-fadeIn">
                      <div className="text-[10px] uppercase font-extrabold text-primary tracking-wider">
                        Kepatuhan Apoteker Penanggung Jawab (APJ)
                      </div>

                      {/* SIPA Number */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant">
                          Nomor SIPA Resmi
                        </label>
                        <input
                          type="text"
                          required={newUser.role === "PBF_ADMIN"}
                          placeholder="SIPA-PBF-9988-2024"
                          value={newUser.sipaNumber}
                          onChange={(e) => setNewUser({ ...newUser, sipaNumber: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      {/* SIPA Expiry */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-on-surface-variant/75" />
                          Tanggal Kadaluwarsa SIPA
                        </label>
                        <input
                          type="date"
                          required={newUser.role === "PBF_ADMIN"}
                          value={newUser.sipaExpiry}
                          onChange={(e) => setNewUser({ ...newUser, sipaExpiry: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="w-full mt-4 py-3.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmittingUser ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Menyimpan...
                      </span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Daftarkan Admin
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: PENGATURAN SISTEM */}
        {activeSubTab === "settings" && (
          <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            
            {loadingSettings ? (
              <div className="py-12 text-center text-xs text-on-surface-variant flex flex-col items-center justify-center gap-3">
                <span className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></span>
                Memuat konfigurasi...
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* Header Section dengan Inline Action Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-heading font-extrabold text-base text-slate-900">
                      Identitas Aplikasi &amp; Kustomisasi Logo
                    </h3>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-not-allowed border-none"
                  >
                    {isSavingSettings ? (
                      <>
                        <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>

                {/* Form & Pratinjau Horizontal Grid (Compact Row) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-1">
                  {/* Input Fields (2 Kolom) */}
                  <div className="md:col-span-2 space-y-3">
                    {/* App Name Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-600">
                        Nama Aplikasi
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.app_name}
                        onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition-all"
                        placeholder="Contoh: GroovyCare"
                      />
                    </div>

                    {/* Logo URL Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-600">
                        URL Logo Aplikasi (Cloudinary/Public URL)
                      </label>
                      <input
                        type="url"
                        required
                        value={settings.logo_url}
                        onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition-all"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>

                    {/* Favicon URL Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-600">
                        URL Favicon / Icon Browser (Cloudinary/Public URL)
                      </label>
                      <input
                        type="url"
                        value={settings.favicon_url || ""}
                        onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition-all"
                        placeholder="https://example.com/favicon.ico"
                      />
                    </div>

                    </div>

                  {/* Pratinjau Kompak (1 Kolom) */}
                  <div className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50/80 h-full min-h-[140px] space-y-3">
                    <div className="w-full text-center">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">
                        Pratinjau Logo
                      </span>
                      <div className="h-12 w-full flex items-center justify-center p-1.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
                        {settings.logo_url ? (
                          <img
                            src={settings.logo_url}
                            alt="Pratinjau Logo"
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://res.cloudinary.com/rumahhostcom/image/upload/v1785321525/logo_care_fcfgwq.png";
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">Belum ada logo</span>
                        )}
                      </div>
                    </div>

                    <div className="w-full text-center">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 block">
                        Pratinjau Favicon
                      </span>
                      <div className="h-10 w-full flex items-center justify-center gap-2 p-1.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
                        {settings.favicon_url ? (
                          <>
                            <img
                              src={settings.favicon_url}
                              alt="Pratinjau Favicon"
                              className="w-5 h-5 object-contain rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/favicon/favicon.ico";
                              }}
                            />
                            <span className="text-[10px] text-slate-600 font-mono truncate max-w-[120px]">
                              {settings.favicon_url.split("/").pop() || "favicon.ico"}
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400">Belum ada favicon</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* SECTION 2: CMS Dynamic Pages Editor */}
            <div className="mt-12 pt-8 border-t border-slate-200/80 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    Manajemen Halaman Informasi &amp; Legal PBF (CMS)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Kelola konten 8 halaman resmi footer PBF yang terhubung langsung di frontend.
                  </p>
                </div>

                <a
                  href={`/${selectedCmsSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all border border-emerald-200/80 shrink-0 self-start sm:self-auto text-decoration-none"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Lihat Live Halaman (/{selectedCmsSlug})
                </a>
              </div>

              {/* Selector Tabs for 8 Pages */}
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-2 pt-1 border-b border-slate-100">
                {[
                  { slug: "about", label: "About Us" },
                  { slug: "contact", label: "Contact Support" },
                  { slug: "career", label: "Career" },
                  { slug: "legal", label: "Legal" },
                  { slug: "terms", label: "Terms of Service" },
                  { slug: "privacy", label: "Privacy Policy" },
                  { slug: "certificates", label: "Compliance Certificates" },
                  { slug: "quality-assurance", label: "Quality Assurance" },
                ].map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => setSelectedCmsSlug(item.slug)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border-none ${
                      selectedCmsSlug === item.slug
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* CMS Page Editor Form */}
              {loadingCms ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
                  <span className="animate-spin h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full"></span>
                  Membaca konten halaman {selectedCmsSlug}...
                </div>
              ) : (
                <form onSubmit={handleSaveCms} className="space-y-4 max-w-3xl animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                      Judul Halaman ({selectedCmsSlug})
                    </label>
                    <input
                      type="text"
                      required
                      value={cmsForm.title}
                      onChange={(e) => setCmsForm({ ...cmsForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">
                      Subjudul / Deskripsi Ringkas
                    </label>
                    <input
                      type="text"
                      required
                      value={cmsForm.subtitle}
                      onChange={(e) => setCmsForm({ ...cmsForm, subtitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-600 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 flex items-center justify-between">
                      <span>Isi Konten Halaman (Format Markdown)</span>
                      <span className="text-slate-400 font-normal">Gunakan ### untuk judul section, - untuk list bullet</span>
                    </label>
                    <textarea
                      rows={12}
                      required
                      value={cmsForm.body}
                      onChange={(e) => setCmsForm({ ...cmsForm, body: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-emerald-600 outline-none transition-all leading-relaxed"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingCms}
                      className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 border-none cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSavingCms ? (
                        <>
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                          Menyimpan Halaman...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Simpan Konten Halaman ({selectedCmsSlug})
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* SECTION 3: Security Audit Trail & Log Lupa Kata Sandi */}
            <div className="mt-12 pt-8 border-t border-slate-200/80 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-heading font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Security Audit Trail &amp; Log Pemulihan Kata Sandi PBF
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Catatan audit log otentikasi realtime untuk kepatuhan regulasi CDOB &amp; BPOM.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadSecurityAuditLogs}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border-none cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-700" />
                  Refresh Audit Logs
                </button>
              </div>

              {loadingSecurityLogs ? (
                <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <span className="animate-spin h-5 w-5 border-2 border-emerald-600 border-t-transparent rounded-full"></span>
                  Memuat catatan log keamanan...
                </div>
              ) : securityLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-500 space-y-1">
                  <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Belum Ada Audit Log Keamanan</p>
                  <p className="text-[11px]">Setiap permohonan reset password atau anomali akses akan otomatis tercatat di sini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-600 tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Waktu</th>
                        <th className="px-4 py-3">Tipe Event</th>
                        <th className="px-4 py-3">Email &amp; Mitra</th>
                        <th className="px-4 py-3">IP / Device</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Rincian Log</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {securityLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                            {new Date(log.createdAt).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                                log.eventType === "AUTH_PASSWORD_RESET_SUCCESS"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : log.eventType === "SECURITY_ALERT"
                                  ? "bg-rose-50 text-rose-800 border-rose-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {log.eventType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800">{log.email}</div>
                            <div className="text-[10px] text-slate-500">{log.institution || "-"}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                            <div>{log.ipAddress || "127.0.0.1"}</div>
                            <div className="truncate max-w-[150px] text-slate-400">{log.userAgent}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold ${
                                log.status === "SUCCESS"
                                  ? "text-emerald-700"
                                  : log.status === "BLOCKED"
                                  ? "text-rose-700"
                                  : "text-amber-700"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-600">
                            {log.details || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: PERSETUJUAN TOP-UP SALDO DEPOSIT (MIDTRANS) */}
        {activeSubTab === "topup" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-slate-900 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                    Persetujuan Top-Up Saldo API Shipping (Midtrans Sandbox)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Verifikasi pengajuan top-up dari PBF Admin yang telah dibayar via Midtrans. Klik <strong>"Setujui &amp; Tambahkan Saldo"</strong> untuk menambahkan Saldo Deposit secara resmi.
                  </p>
                </div>

                <button
                  onClick={fetchTopUpList}
                  disabled={loadingTopUpList}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs rounded-xl border border-emerald-200 transition cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  <Clock className={`w-3.5 h-3.5 ${loadingTopUpList ? "animate-spin" : ""}`} />
                  <span>Segarkan Data Top-Up</span>
                </button>
              </div>

              {/* Table Top-Up Requests */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px] text-xs">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-[140px]">No. TopUp</th>
                      <th className="py-3 px-4 w-[130px]">Nominal TopUp</th>
                      <th className="py-3 px-4 w-[170px]">Pengaju</th>
                      <th className="py-3 px-4 w-[180px]">Status Pembayaran</th>
                      <th className="py-3 px-4 w-[130px]">Tanggal Request</th>
                      <th className="py-3 px-4 text-right min-w-[180px]">Aksi Verifikasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800 font-mono text-xs">
                    {loadingTopUpList ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400 font-sans italic">
                          Memuat data pengajuan top-up...
                        </td>
                      </tr>
                    ) : topUpRequestsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400 font-sans italic">
                          Belum ada pengajuan top-up saldo deposit.
                        </td>
                      </tr>
                    ) : (
                      topUpRequestsList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors h-12">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {item.topUpNumber}
                          </td>
                          <td className="py-3 px-4 font-mono font-black text-emerald-700 text-sm">
                            Rp. {item.amount.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-700">
                            <div className="font-bold">{item.requestedBy?.name || "PBF Admin"}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.requestedBy?.email}</div>
                          </td>
                          <td className="py-3 px-4 font-sans">
                            {item.paymentStatus === "APPROVED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disetujui (Saldo Bertambah)
                              </span>
                            )}
                            {item.paymentStatus === "PAID_WAITING_APPROVAL" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                <AlertCircle className="w-3 h-3 text-amber-600" /> Lunas Midtrans (Perlu Approval)
                              </span>
                            )}
                            {item.paymentStatus === "PENDING_PAYMENT" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300">
                                <Clock className="w-3 h-3" /> Menunggu Bayar Midtrans
                              </span>
                            )}
                            {item.paymentStatus === "REJECTED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                <XCircle className="w-3 h-3 text-rose-600" /> {item.rejectionReason || "Ditolak"}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                            {new Date(item.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            {item.paymentStatus === "APPROVED" ? (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                Selesai
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveTopUp(item.id, item.amount)}
                                  disabled={processingTopUpId === item.id}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[11px] rounded-xl transition cursor-pointer shadow-2xs flex items-center gap-1 disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{processingTopUpId === item.id ? "Memproses..." : "Setujui & Tambah Saldo"}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRejectTopUp(item.id)}
                                  disabled={processingTopUpId === item.id}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-[11px] rounded-xl border border-rose-200 transition cursor-pointer disabled:opacity-50"
                                >
                                  Tolak
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
