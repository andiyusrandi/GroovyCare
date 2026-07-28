"use client";

import { useState, useEffect } from "react";
import {
  getAdminUsers,
  createAdminUser,
  deleteAdminUser,
  getSystemSettings,
  updateSystemSettings,
} from "@/app/actions/superadmin";
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
} from "lucide-react";

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
  const [activeSubTab, setActiveSubTab] = useState<"users" | "settings">("users");
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({
    logo_url: "",
    app_name: "",
  });

  // Loading & Alert States
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
        logo_url: data.logo_url || "https://res.cloudinary.com/rumahhostcom/image/upload/v1785256133/IMG_20260725_184829_670_odzsui.png",
        app_name: data.app_name || "GroovyCare",
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "users"
                  ? "bg-primary text-white shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="w-4 h-4" />
              Manajemen Admin
            </button>
            <button
              onClick={() => setActiveSubTab("settings")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === "settings"
                  ? "bg-primary text-white shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Image className="w-4 h-4" />
              Pengaturan Sistem
            </button>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {alertMessage && (
        <div
          className={`flex items-center gap-3 px-5 py-4 rounded-2xl border text-xs font-medium shadow-sm animate-slideDown ${
            alertMessage.type === "success"
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
        {activeSubTab === "users" ? (
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
                                className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide ${
                                  admin.role === "SYSTEM_ADMIN"
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
                      <option value="SYSTEM_ADMIN">SYSTEM_ADMIN (Super Admin)</option>
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
        ) : (
          /* Settings Tab Section */
          <div className="bg-white border border-outline-variant/30 rounded-3xl p-8 shadow-sm">
            <h3 className="font-heading font-extrabold text-base text-slate-900 mb-6 flex items-center gap-2">
              <Image className="w-4 h-4 text-primary" />
              Identitas Aplikasi & Kustomisasi Logo
            </h3>

            {loadingSettings ? (
              <div className="py-12 text-center text-xs text-on-surface-variant flex flex-col items-center justify-center gap-3">
                <span className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></span>
                Memuat konfigurasi...
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-8 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Form inputs */}
                  <div className="space-y-4">
                    {/* App Name Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant">
                        Nama Aplikasi
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.app_name}
                        onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-bold text-slate-800"
                        placeholder="Contoh: GroovyCare"
                      />
                    </div>

                    {/* Logo URL Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant">
                        URL Logo Aplikasi (Cloudinary/Public URL)
                      </label>
                      <input
                        type="url"
                        required
                        value={settings.logo_url}
                        onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface text-xs focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono text-slate-700"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>

                  {/* Right Column: Logo Preview Card */}
                  <div className="bg-slate-50 border border-outline-variant/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant">
                      Pratinjau Live Logo
                    </span>
                    <div className="w-48 h-20 bg-white rounded-xl border border-outline-variant/10 shadow-sm p-4 flex items-center justify-center overflow-hidden">
                      {settings.logo_url ? (
                        <img
                          src={settings.logo_url}
                          alt="Pratinjau Logo"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://www.groovyrx.com/store/1/logogroovyrx.png";
                          }}
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400">Belum ada logo</span>
                      )}
                    </div>
                    <span className="text-[9px] text-on-surface-variant/60 leading-normal max-w-[200px]">
                      Logo ini akan langsung diaplikasikan pada seluruh halaman login, registrasi, header dasbor apotek, dan admin backoffice setelah Anda menyimpannya.
                    </span>
                  </div>

                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-outline-variant/20">
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-3.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingSettings ? (
                      <>
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Simpan & Muat Ulang Pengaturan
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
