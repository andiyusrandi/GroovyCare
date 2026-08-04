"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MobileProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pemilik" | "sarana">("pemilik");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form State
  const [institutionName, setInstitutionName] = useState("Apotek Sehat Farma");
  const [ownerKtp, setOwnerKtp] = useState("");
  const [ownerNpwp, setOwnerNpwp] = useState("");
  const [siaNumber, setSiaNumber] = useState("");
  const [sipaNumber, setSipaNumber] = useState("");
  
  // Wilayah State
  const [province, setProvince] = useState("");
  const [regency, setRegency] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressDetail, setAddressDetail] = useState("");

  const [provincesList, setProvincesList] = useState<{ id: string; name: string }[]>([]);
  const [regenciesList, setRegenciesList] = useState<{ id: string; name: string }[]>([]);
  const [districtsList, setDistrictsList] = useState<{ id: string; name: string }[]>([]);
  const [villagesList, setVillagesList] = useState<{ id: string; name: string }[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedRegencyId, setSelectedRegencyId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");

  const [ktpFile, setKtpFile] = useState<{ name: string; dataUrl?: string } | null>(null);
  const [permitFile, setPermitFile] = useState<{ name: string; dataUrl?: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Data Profil Dinamis Pengguna & Institusi
  useEffect(() => {
    async function loadProfile() {
      try {
        const { getInstitutionProfile } = await import("@/app/actions/auth");
        const res = await getInstitutionProfile();
        if (res.success && res.data) {
          const d = res.data;
          if (d.institutionName) setInstitutionName(d.institutionName);
          if (d.ownerKtp) setOwnerKtp(d.ownerKtp);
          if (d.ownerNpwp) setOwnerNpwp(d.ownerNpwp);
          if (d.siaNumber) setSiaNumber(d.siaNumber);
          if (d.sipaNumber) setSipaNumber(d.sipaNumber);

          const addr = d.address || "";
          if (addr.includes("Kec:") || addr.includes("Alamat:")) {
            const detailPart = addr.match(/Alamat:\s*(.*?)(?:,\s*Kel\/Desa:|\s*\(Desa|\s*Kec:)/)?.[1] || "";
            const kelPart = addr.match(/(?:Kel\/Desa|Desa\/Kel):\s*(.*?)(?:\)|\s*Kec:|\s*Kab\/Kota:|\s*Kota\/Kab:)/)?.[1] || "";
            const kecPart = addr.match(/Kec:\s*(.*?)(?:\s*\(Desa|,\s*Kab\/Kota:|\s*Kota\/Kab:)/)?.[1] || "";
            const kabPart = addr.match(/(?:Kab\/Kota|Kota\/Kab):\s*(.*?)(?:,\s*Provinsi:|\s*Prov:)/)?.[1] || "";
            const provPart = addr.match(/(?:Provinsi|Prov):\s*(.*?)(?:,\s*Kode Pos:|\s*Kode Pos:)/)?.[1] || "";
            const posPart = addr.match(/Kode Pos:\s*(\d+)/)?.[1] || "";

            if (detailPart) setAddressDetail(detailPart);
            if (kelPart) setVillage(kelPart.trim());
            if (kecPart) setDistrict(kecPart.trim());
            if (kabPart) setRegency(kabPart.trim());
            if (provPart) setProvince(provPart.trim());
            if (posPart) setPostalCode(posPart.trim());
          } else if (addr) {
            setAddressDetail(addr);
          }
        }
      } catch (e) {
        console.error("Gagal memuat profil dinamis:", e);
      } finally {
        setFetching(false);
      }
    }
    loadProfile();
  }, []);

  // Load Wilayah Provinsi
  useEffect(() => {
    fetch("/api/wilayah?type=provinces")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setProvincesList(data);
      })
      .catch(() => {});
  }, []);

  // Auto match selectedProvinceId when provincesList & province name are available
  useEffect(() => {
    if (provincesList.length > 0 && province && !selectedProvinceId) {
      const found = provincesList.find((p) => p.name.toUpperCase() === province.trim().toUpperCase());
      if (found) setSelectedProvinceId(found.id);
    }
  }, [provincesList, province, selectedProvinceId]);

  // Fetch Kab/Kota when Province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setRegenciesList([]);
      return;
    }
    fetch(`/api/wilayah?type=regencies&id=${selectedProvinceId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setRegenciesList(data);
      })
      .catch(() => {});
  }, [selectedProvinceId]);

  // Auto match selectedRegencyId when regenciesList & regency name are available
  useEffect(() => {
    if (regenciesList.length > 0 && regency && !selectedRegencyId) {
      const found = regenciesList.find((r) => r.name.toUpperCase() === regency.trim().toUpperCase());
      if (found) setSelectedRegencyId(found.id);
    }
  }, [regenciesList, regency, selectedRegencyId]);

  // Fetch Kecamatan when Regency changes
  useEffect(() => {
    if (!selectedRegencyId) {
      setDistrictsList([]);
      return;
    }
    fetch(`/api/wilayah?type=districts&id=${selectedRegencyId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setDistrictsList(data);
      })
      .catch(() => {});
  }, [selectedRegencyId]);

  // Auto match selectedDistrictId when districtsList & district name are available
  useEffect(() => {
    if (districtsList.length > 0 && district && !selectedDistrictId) {
      const found = districtsList.find((d) => d.name.toUpperCase() === district.trim().toUpperCase());
      if (found) setSelectedDistrictId(found.id);
    }
  }, [districtsList, district, selectedDistrictId]);

  // Fetch Kelurahan when District changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setVillagesList([]);
      return;
    }
    fetch(`/api/wilayah?type=villages&id=${selectedDistrictId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setVillagesList(data);
      })
      .catch(() => {});
  }, [selectedDistrictId]);

  // Auto fetch Kode Pos when District or Village changes
  useEffect(() => {
    if (!district) return;
    const query = village ? `${village} ${district}` : district;
    fetch(`/api/wilayah?type=postcode&q=${encodeURIComponent(query)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData && resData.data && Array.isArray(resData.data) && resData.data.length > 0) {
          const firstMatch = resData.data[0];
          const code = firstMatch.postalcode || firstMatch.postcode || firstMatch.code;
          if (code) {
            setPostalCode(String(code));
          }
        }
      })
      .catch(() => {});
  }, [district, village]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "ktp" | "permit") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (type === "ktp") {
        setKtpFile({ name: file.name, dataUrl });
      } else {
        setPermitFile({ name: file.name, dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const consolidatedAddress = `Alamat: ${addressDetail}, Kel/Desa: ${village}, Kec: ${district}, Kab/Kota: ${regency}, Provinsi: ${province}, Kode Pos: ${postalCode}`;

    try {
      const { updateInstitutionProfile } = await import("@/app/actions/auth");
      const res = await updateInstitutionProfile({
        ownerKtp,
        ownerNpwp,
        siaNumber,
        sipaNumber,
        address: consolidatedAddress,
      });

      setLoading(false);
      if (res.success) {
        setSuccessMsg("Profil & Alamat Operasional Apotek berhasil diperbarui!");
        setTimeout(() => {
          router.push("/customer/dashboard");
        }, 1200);
      } else {
        setErrorMsg(res.error || "Gagal memperbarui profil.");
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg("Terjadi kesalahan: " + (err.message || err));
    }
  };

  const isProfileIncomplete = !ownerKtp || !ownerNpwp || !siaNumber || !sipaNumber;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-800 select-none">
      {/* Header Sticky khusus Mobile */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3.5 shadow-xs">
        <Link href="/customer/dashboard" className="flex items-center gap-1 text-slate-600 hover:text-slate-900">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </Link>
        <h1 className="text-base font-bold text-slate-900 font-heading">Profil Mitra &amp; Legality</h1>
        <div className="w-6"></div> {/* Spacer balance */}
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Dynamic Status Banner */}
        {isProfileIncomplete ? (
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
              <span>Profil Belum Lengkap</span>
            </div>
            <p className="text-amber-700 leading-relaxed">
              Silakan lengkapi KTP Pemilik, NPWP Pemilik, SIA, dan SIPA agar akun dapat diverifikasi untuk pemesanan sediaan farmasi.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50 p-4 text-xs text-emerald-900 shadow-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <span className="material-symbols-outlined text-emerald-600 text-lg">verified</span>
              <span>Profil Mitra Terverifikasi</span>
            </div>
            <p className="text-emerald-700 leading-relaxed">
              Seluruh data identitas dan dokumen perizinan Anda telah tersimpan dengan aman di database PBF Online Systems.
            </p>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-semibold flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Navigation Tab */}
        <div className="flex rounded-xl bg-slate-200/80 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("pemilik")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all border-none cursor-pointer ${
              activeTab === "pemilik"
                ? "bg-white text-emerald-700 shadow-xs"
                : "bg-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Identitas &amp; Alamat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sarana")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all border-none cursor-pointer ${
              activeTab === "sarana"
                ? "bg-white text-emerald-700 shadow-xs"
                : "bg-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            Izin Sarana (SIA/SIPA)
          </button>
        </div>

        {/* Dynamic Form Content */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "pemilik" ? (
            /* Tab 1: Identitas & Alamat Operasional */
            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Data Pemilik &amp; Alamat Sarana
              </h2>

              {/* Nama Apotek / Sarana */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Nama Apotek / Sarana
                </label>
                <input
                  type="text"
                  disabled
                  value={institutionName}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-3.5 py-2.5 text-xs font-medium text-slate-600 cursor-not-allowed select-none"
                />
              </div>

              {/* Alamat Operasional Cascading Wilayah */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block border-b border-slate-200/60 pb-1.5">
                  Alamat Operasional Apotek
                </h3>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Provinsi *</label>
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">{province ? province : "Pilih Provinsi"}</option>
                    {provincesList.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Kabupaten/Kota *</label>
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
                    className={`w-full rounded-xl border px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none transition-colors ${
                      !selectedProvinceId && !regency
                        ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                        : "border-slate-300 bg-white text-slate-800"
                    }`}
                  >
                    <option value="">{regency ? regency : "Pilih Kabupaten/Kota"}</option>
                    {regenciesList.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Kecamatan *</label>
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
                    className={`w-full rounded-xl border px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none transition-colors ${
                      !selectedRegencyId && !district
                        ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                        : "border-slate-300 bg-white text-slate-800"
                    }`}
                  >
                    <option value="">{district ? district : "Pilih Kecamatan"}</option>
                    {districtsList.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Kelurahan/Desa *</label>
                  <select
                    required
                    disabled={!selectedDistrictId && !village}
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs focus:border-emerald-600 focus:outline-none transition-colors ${
                      !selectedDistrictId && !village
                        ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                        : "border-slate-300 bg-white text-slate-800"
                    }`}
                  >
                    <option value="">{village ? village : "Pilih Kelurahan/Desa"}</option>
                    {villagesList.map((v) => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Kode Pos *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 12345"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-none transition-colors ${
                      !postalCode
                        ? "border-slate-200 bg-slate-50 text-slate-700"
                        : "border-slate-300 bg-white text-slate-900 font-bold"
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Alamat Jalan / Detail *</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Jl. Raya Kebon Jeruk No. 12"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs leading-normal text-slate-800 focus:border-emerald-600 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* KTP & NPWP */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  NIK / KTP Pemilik *
                </label>
                <input
                  type="text"
                  required
                  value={ownerKtp}
                  onChange={(e) => setOwnerKtp(e.target.value)}
                  placeholder="Masukkan 16 digit NIK KTP Pemilik"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  NPWP Pemilik / Badan Usaha *
                </label>
                <input
                  type="text"
                  required
                  value={ownerNpwp}
                  onChange={(e) => setOwnerNpwp(e.target.value)}
                  placeholder="Masukkan nomor NPWP Pemilik"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            /* Tab 2: Izin Sarana (SIA & SIPA) */
            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Legalitas &amp; Dokumen CDOB
              </h2>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Nomor SIA (Surat Izin Apotek) *
                </label>
                <input
                  type="text"
                  required
                  value={siaNumber}
                  onChange={(e) => setSiaNumber(e.target.value)}
                  placeholder="SIA/123/ABC/2024"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Nomor SIPA APJ *
                </label>
                <input
                  type="text"
                  required
                  value={sipaNumber}
                  onChange={(e) => setSipaNumber(e.target.value)}
                  placeholder="SIPA/456/DEF/2024"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Unggah Berkas Dokumen (SIA / SIPA)
                </label>
                <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl mb-0.5">cloud_upload</span>
                  <span className="text-xs font-bold text-slate-700">{permitFile ? permitFile.name : "Pilih berkas SIA/SIPA"}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Format JPG / PNG / PDF (Maks 5MB)</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "permit")}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Tombol Simpan */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-700 py-3.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98] border-none cursor-pointer disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Simpan Perubahan ✓"}
          </button>
        </form>
      </div>
    </div>
  );
}
