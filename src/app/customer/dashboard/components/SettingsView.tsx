"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Bell, CreditCard, Lock, Check, CheckCircle2, User, AlertTriangle } from "lucide-react";

interface SettingsViewProps {
  user: {
    name: string;
    email: string;
    phone: string | null;
    sipaNumber: string | null;
  };
  institution: {
    name: string;
    type: string;
    siaNumber: string;
    address: string;
    ownerKtp: string | null;
    ownerNpwp: string | null;
  };
  onUpdateProfile: (data: {
    ownerKtp: string;
    ownerNpwp: string;
    siaNumber: string;
    sipaNumber: string;
    address?: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export default function SettingsView({ user, institution, onUpdateProfile }: SettingsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"security" | "notifications" | "payment" | "profile">("security");
  const router = useRouter();

  // State Profil Apotek
  const [ownerKtp, setOwnerKtp] = useState(institution.ownerKtp || "");
  const [ownerNpwp, setOwnerNpwp] = useState(institution.ownerNpwp || "");
  const [siaNumber, setSiaNumber] = useState(institution.siaNumber || "");
  const [sipaNumber, setSipaNumber] = useState(user.sipaNumber || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // States for address details
  const [province, setProvince] = useState("");
  const [regency, setRegency] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressDetail, setAddressDetail] = useState(institution.address || "");

  const [provincesList, setProvincesList] = useState<{ id: string; name: string }[]>([]);
  const [regenciesList, setRegenciesList] = useState<{ id: string; name: string }[]>([]);
  const [districtsList, setDistrictsList] = useState<{ id: string; name: string }[]>([]);
  const [villagesList, setVillagesList] = useState<{ id: string; name: string }[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedRegencyId, setSelectedRegencyId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");

  // Extract values if address matches consolidated format
  useEffect(() => {
    const addr = institution.address || "";
    if (addr.includes("Kel/Desa:") && addr.includes("Kec:") && addr.includes("Provinsi:")) {
      try {
        const parts = addr.split(" | ");
        const mainAddr = parts[0];
        
        const detailPart = mainAddr.match(/Alamat:\s*(.*?),\s*Kel\/Desa:/)?.[1] || "";
        const kelPart = mainAddr.match(/Kel\/Desa:\s*(.*?),\s*Kec:/)?.[1] || "";
        const kecPart = mainAddr.match(/Kec:\s*(.*?),\s*Kab\/Kota:/)?.[1] || "";
        const kabPart = mainAddr.match(/Kab\/Kota:\s*(.*?),\s*Provinsi:/)?.[1] || "";
        const provPart = mainAddr.match(/Provinsi:\s*(.*?),\s*Kode Pos:/)?.[1] || "";
        const posPart = mainAddr.match(/Kode Pos:\s*(\d+)/)?.[1] || "";

        setAddressDetail(detailPart || addr);
        setProvince(provPart);
        setRegency(kabPart);
        setDistrict(kecPart);
        setVillage(kelPart);
        setPostalCode(posPart);
      } catch (e) {
        setAddressDetail(addr);
      }
    }
  }, [institution.address]);

  // Fetch provinces on mount
  useEffect(() => {
    fetch("/api/wilayah?type=provinces")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setProvincesList(data);
        } else {
          setProvincesList([]);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil data provinsi:", err);
        setProvincesList([]);
      });
  }, []);

  // Fetch regencies when selectedProvinceId changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setRegenciesList([]);
      return;
    }
    fetch(`/api/wilayah?type=regencies&id=${selectedProvinceId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setRegenciesList(data);
        } else {
          setRegenciesList([]);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil data kabupaten:", err);
        setRegenciesList([]);
      });
  }, [selectedProvinceId]);

  // Fetch districts when selectedRegencyId changes
  useEffect(() => {
    if (!selectedRegencyId) {
      setDistrictsList([]);
      return;
    }
    fetch(`/api/wilayah?type=districts&id=${selectedRegencyId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setDistrictsList(data);
        } else {
          setDistrictsList([]);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil data kecamatan:", err);
        setDistrictsList([]);
      });
  }, [selectedRegencyId]);

  // Fetch villages when selectedDistrictId changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setVillagesList([]);
      return;
    }
    fetch(`/api/wilayah?type=villages&id=${selectedDistrictId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setVillagesList(data);
        } else {
          setVillagesList([]);
        }
      })
      .catch((err) => {
        console.error("Gagal mengambil data kelurahan/desa:", err);
        setVillagesList([]);
      });
  }, [selectedDistrictId]);

  const handleSaveProfile = async () => {
    if (!ownerKtp.trim() || !ownerNpwp.trim() || !siaNumber.trim() || !sipaNumber.trim()) {
      alert("Seluruh data wajib diisi!");
      return;
    }

    const isAddressValid =
      province.trim() !== "" &&
      regency.trim() !== "" &&
      district.trim() !== "" &&
      village.trim() !== "" &&
      postalCode.trim() !== "" &&
      addressDetail.trim() !== "";

    if (!isAddressValid) {
      alert("Harap lengkapi seluruh data alamat apotek/mitra!");
      return;
    }

    const consolidatedAddress = `Alamat: ${addressDetail}, Kel/Desa: ${village}, Kec: ${district}, Kab/Kota: ${regency}, Provinsi: ${province}, Kode Pos: ${postalCode}`;

    setIsSavingProfile(true);
    try {
      const res = await onUpdateProfile({
        ownerKtp,
        ownerNpwp,
        siaNumber,
        sipaNumber,
        address: consolidatedAddress,
      });

      if (res.success) {
        alert(res.message);
        router.refresh();
      } else {
        alert(res.error || "Gagal memperbarui profil.");
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // State Keamanan
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // State Notifikasi Toggles
  const [notifyShippingEmail, setNotifyShippingEmail] = useState(true);
  const [notifyShippingWA, setNotifyShippingWA] = useState(true);
  const [notifyBillingEmail, setNotifyBillingEmail] = useState(true);
  const [notifyBillingWA, setNotifyBillingWA] = useState(true);
  const [notifyLegalityEmail, setNotifyLegalityEmail] = useState(true);
  const [notifyLegalityWA, setNotifyLegalityWA] = useState(true);

  // State Rekening Bank Apotek
  const [bankName, setBankName] = useState("Bank Mandiri");
  const [bankAccountNumber, setBankAccountNumber] = useState("123-00-9876543-2");
  const [bankAccountName, setBankAccountName] = useState("Apotek Sehat Jaya Mandiri");
  const [isEditingBank, setIsEditingBank] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-heading font-extrabold text-foreground">Pengaturan Akun</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">Kelola keamanan sandi, saluran notifikasi WhatsApp/Email, dan data rekening apotek Anda.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar whitespace-nowrap flex-nowrap border-b border-outline-variant/20 gap-2 -mx-4 px-4 scroll-smooth">
        <button
          onClick={() => setActiveSubTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === "security"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-foreground"
          }`}
        >
          <Shield className="w-4 h-4" />
          Keamanan &amp; Sandi
        </button>

        <button
          onClick={() => setActiveSubTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4" />
          Profil Apotek
        </button>

        <button
          onClick={() => setActiveSubTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === "notifications"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-foreground"
          }`}
        >
          <Bell className="w-4 h-4" />
          Preferensi Notifikasi
        </button>

        <button
          onClick={() => setActiveSubTab("payment")}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeSubTab === "payment"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-foreground"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Metode Pembayaran
        </button>
      </div>

      {/* Card Content */}
      <div className="bg-white rounded-3xl border border-outline-variant/20 p-6 shadow-sm">
        
        {/* SUBTAB: KEAMANAN & SANDI */}
        {activeSubTab === "security" && (
          <div className="space-y-6 max-w-md">
            <h3 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Ubah Kata Sandi Akun
            </h3>

            <div className="space-y-4 text-xs">
              {/* Hidden username to prevent browser autofill from using the global search input */}
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={user.email}
                readOnly
                className="hidden"
                style={{ display: "none" }}
              />

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-outline">Kata Sandi Lama</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-outline">Kata Sandi Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                  className="px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-outline">Konfirmasi Kata Sandi Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  autoComplete="new-password"
                  className="px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!oldPassword || !newPassword || !confirmPassword) {
                  alert("Semua kolom harus diisi.");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  alert("Konfirmasi kata sandi baru tidak cocok.");
                  return;
                }
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                alert("Kata sandi berhasil diperbarui!");
              }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Simpan Sandi Baru
            </button>
          </div>
        )}

        {/* SUBTAB: PREFERENSI NOTIFIKASI */}
        {activeSubTab === "notifications" && (
          <div className="space-y-6">
            <h3 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notifikasi &amp; Alur Info
            </h3>

            <div className="space-y-4 text-xs">
              
              {/* Row 1: Status Pengiriman */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-outline-variant/15 rounded-2xl gap-4">
                <div>
                  <p className="font-bold text-foreground">Status Pelacakan Pengiriman</p>
                  <p className="text-[10px] text-on-surface-variant/80 mt-0.5">Terima info ketika pesanan obat keluar dari gudang PBF dan saat kurir berjalan.</p>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={notifyShippingEmail}
                      onChange={(e) => setNotifyShippingEmail(e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span>Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={notifyShippingWA}
                      onChange={(e) => setNotifyShippingWA(e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span>WhatsApp</span>
                  </label>
                </div>
              </div>

              {/* Row 2: Tagihan Jatuh Tempo */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-outline-variant/15 rounded-2xl gap-4">
                <div>
                  <p className="font-bold text-foreground">Peringatan Jatuh Tempo Tagihan (TOP)</p>
                  <p className="text-[10px] text-on-surface-variant/80 mt-0.5">Pengingat tagihan belanja H-3 sebelum tanggal jatuh tempo tempo pembayaran.</p>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={notifyBillingEmail}
                      onChange={(e) => setNotifyBillingEmail(e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span>Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={notifyBillingWA}
                      onChange={(e) => setNotifyBillingWA(e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span>WhatsApp</span>
                  </label>
                </div>
              </div>

              {/* Row 3: Kadaluwarsa Legalitas */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-outline-variant/15 rounded-2xl gap-4">
                <div>
                  <p className="font-bold text-foreground">Pengingat Masa Berlaku SIA / SIPA</p>
                  <p className="text-[10px] text-on-surface-variant/80 mt-0.5">Pemberitahuan penting 60 hari sebelum SIPA apoteker atau SIA instansi habis masa aktifnya.</p>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={notifyLegalityEmail}
                      onChange={(e) => setNotifyLegalityEmail(e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span>Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={notifyLegalityWA}
                      onChange={(e) => setNotifyLegalityWA(e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span>WhatsApp</span>
                  </label>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-2 border-t border-outline-variant/15">
              <button
                type="button"
                onClick={() => alert("Preferensi notifikasi berhasil disimpan.")}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Simpan Preferensi
              </button>
            </div>
          </div>
        )}

        {/* SUBTAB: METODE PEMBAYARAN */}
        {activeSubTab === "payment" && (
          <div className="space-y-6">
            <h3 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Rekening Bank Apotek (Untuk Rekonsiliasi Transfer)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* Bank Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-outline">Nama Bank Utama</label>
                {isEditingBank ? (
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none"
                  />
                ) : (
                  <p className="text-sm font-bold text-foreground bg-slate-50 border border-outline-variant/10 px-3 py-2 rounded-xl">
                    {bankName}
                  </p>
                )}
              </div>

              {/* Account Number */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-outline">Nomor Rekening</label>
                {isEditingBank ? (
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none"
                  />
                ) : (
                  <p className="text-sm font-bold text-foreground bg-slate-50 border border-outline-variant/10 px-3 py-2 rounded-xl font-mono">
                    {bankAccountNumber}
                  </p>
                )}
              </div>

              {/* Account Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-outline">Pemilik Rekening (Atas Nama)</label>
                {isEditingBank ? (
                  <input
                    type="text"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="px-3 py-2 border border-outline-variant rounded-xl text-xs bg-white outline-none"
                  />
                ) : (
                  <p className="text-sm font-bold text-foreground bg-slate-50 border border-outline-variant/10 px-3 py-2 rounded-xl">
                    {bankAccountName}
                  </p>
                )}
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/15">
              {isEditingBank ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingBank(false)}
                    className="px-4 py-2 border border-outline-variant/30 text-on-surface rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingBank(false);
                      alert("Rekening bank apotek berhasil diperbarui.");
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" /> Simpan Rekening
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingBank(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  Edit Data Rekening
                </button>
              )}
            </div>

            <div className="bg-surface-container-low/55 p-4 border border-outline-variant/10 rounded-2xl text-[10px] text-on-surface-variant flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>Mendaftarkan nomor rekening apotek mempermudah pencocokan otomatis (*auto-reconciliation*) bukti bayar transfer bank yang Anda unggah untuk pelunasan tagihan tempo.</p>
            </div>
          </div>
        )}

        {/* SUBTAB: PROFIL APOTEK */}
        {activeSubTab === "profile" && (
          <div className="space-y-6 max-w-lg">
            <h3 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Kelola Profil Apotek / Mitra
            </h3>
            
            <p className="text-xs text-on-surface-variant">
              Untuk melakukan pemesanan produk, Anda wajib melengkapi data profil mitra di bawah ini dengan lengkap (KTP Pemilik, NPWP Pemilik, SIA, dan SIPA).
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-outline">Nama Apotek / Sarana</label>
                <input
                  type="text"
                  disabled
                  value={institution.name}
                  className="px-4 py-2.5 rounded-xl border border-outline-variant bg-slate-50 text-on-surface-variant outline-none font-medium cursor-not-allowed text-xs"
                />
              </div>

              {/* Lokasi Alamat Apotek (Cascading Dropdowns) */}
              <div className="bg-slate-50 border border-outline-variant/30 rounded-2xl p-4 space-y-3.5">
                <h4 className="font-bold text-slate-700 text-[10px] uppercase tracking-wider block border-b border-outline-variant/20 pb-1.5">Alamat Operasional Apotek</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-outline">Provinsi *</label>
                    <select
                      required
                      value={selectedProvinceId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedProvinceId(id);
                        const name = provincesList.find((p) => p.id === id)?.name || "";
                        setProvince(name);
                        setSelectedRegencyId("");
                        setRegency("");
                        setSelectedDistrictId("");
                        setDistrict("");
                        setVillage("");
                      }}
                      className="px-4 py-2.5 rounded-xl border border-outline-variant bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs"
                    >
                      <option value="">{province ? province : "Pilih Provinsi"}</option>
                      {provincesList.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-outline">Kabupaten/Kota *</label>
                    <select
                      required
                      disabled={!selectedProvinceId && !regency}
                      value={selectedRegencyId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedRegencyId(id);
                        const name = regenciesList.find((r) => r.id === id)?.name || "";
                        setRegency(name);
                        setSelectedDistrictId("");
                        setDistrict("");
                        setVillage("");
                      }}
                      className="px-4 py-2.5 rounded-xl border border-outline-variant bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs disabled:opacity-50"
                    >
                      <option value="">{regency ? regency : "Pilih Kabupaten/Kota"}</option>
                      {regenciesList.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-outline">Kecamatan *</label>
                    <select
                      required
                      disabled={!selectedRegencyId && !district}
                      value={selectedDistrictId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedDistrictId(id);
                        const name = districtsList.find((d) => d.id === id)?.name || "";
                        setDistrict(name);
                        setVillage("");
                      }}
                      className="px-4 py-2.5 rounded-xl border border-outline-variant bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs disabled:opacity-50"
                    >
                      <option value="">{district ? district : "Pilih Kecamatan"}</option>
                      {districtsList.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-outline">Kelurahan/Desa *</label>
                    <select
                      required
                      disabled={!selectedDistrictId && !village}
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-outline-variant bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs disabled:opacity-50"
                    >
                      <option value="">{village ? village : "Pilih Kelurahan/Desa"}</option>
                      {villagesList.map((v) => (
                        <option key={v.id} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1 md:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-outline">Kode Pos *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 12345"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-outline-variant bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-outline">Alamat Rumah / Jalan Lengkap *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Jl. Raya Kebon Jeruk No. 12"
                      value={addressDetail}
                      onChange={(e) => setAddressDetail(e.target.value)}
                      className="px-4 py-2 rounded-xl border border-outline-variant bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs leading-normal"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-outline">KTP Pemilik *</label>
                  <input
                    type="text"
                    value={ownerKtp}
                    onChange={(e) => setOwnerKtp(e.target.value)}
                    placeholder="Masukkan 16 digit NIK KTP Pemilik"
                    className="px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-outline">NPWP Pemilik *</label>
                  <input
                    type="text"
                    value={ownerNpwp}
                    onChange={(e) => setOwnerNpwp(e.target.value)}
                    placeholder="Masukkan nomor NPWP Pemilik"
                    className="px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-outline">Nomor SIA *</label>
                  <input
                    type="text"
                    value={siaNumber}
                    onChange={(e) => setSiaNumber(e.target.value)}
                    placeholder="SIA/123/ABC/2024"
                    className="px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-outline">Nomor SIPA *</label>
                  <input
                    type="text"
                    value={sipaNumber}
                    onChange={(e) => setSipaNumber(e.target.value)}
                    placeholder="SIPA/456/DEF/2024"
                    className="px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant/15">
                <button
                  type="button"
                  disabled={isSavingProfile}
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>

              {(!ownerKtp || !ownerNpwp || !siaNumber || !sipaNumber) && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800 text-[10px]">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-bold block">Peringatan: Profil Belum Lengkap</span>
                    Anda belum melengkapi seluruh dokumen wajib (KTP Pemilik, NPWP Pemilik, SIA, dan SIPA). Fitur pemesanan produk akan diblokir sampai seluruh data di atas terisi dengan benar.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
