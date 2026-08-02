"use client";

import { useState, useEffect } from "react";
import { 
  MapPin, 
  X, 
  Loader2
} from "lucide-react";

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: any;
  institutionId: string;
  onSaveSuccess: () => void;
}

export default function AddressFormModal({
  isOpen,
  onClose,
  addressToEdit,
  institutionId,
  onSaveSuccess,
}: AddressFormModalProps) {
  const [label, setLabel] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isMain, setIsMain] = useState(false);
  const [cdobNote, setCdobNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States Wilayah Cascading & Auto Kode Pos
  const [provincesList, setProvincesList] = useState<{ id: string; name: string }[]>([]);
  const [regenciesList, setRegenciesList] = useState<{ id: string; name: string }[]>([]);
  const [districtsList, setDistrictsList] = useState<{ id: string; name: string }[]>([]);
  const [villagesList, setVillagesList] = useState<{ id: string; name: string }[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedRegencyId, setSelectedRegencyId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedVillageName, setSelectedVillageName] = useState("");
  const [isFetchingPostcode, setIsFetchingPostcode] = useState(false);

  // Fetch Provinces on Open
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/wilayah?type=provinces")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setProvincesList(data);
      })
      .catch((err) => console.error("Gagal load provinsi:", err));
  }, [isOpen]);

  // Match province text to province ID
  useEffect(() => {
    if (province && provincesList.length > 0 && !selectedProvinceId) {
      const match = provincesList.find(
        (p) => p.name.toLowerCase() === province.toLowerCase() ||
               province.toLowerCase().includes(p.name.toLowerCase()) ||
               p.name.toLowerCase().includes(province.toLowerCase())
      );
      if (match) {
        setSelectedProvinceId(match.id);
      }
    }
  }, [province, provincesList, selectedProvinceId]);

  // Fetch Regencies when province selected
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
      .catch((err) => console.error("Gagal load kota:", err));
  }, [selectedProvinceId]);

  // Match regency text to regency ID
  useEffect(() => {
    if (city && regenciesList.length > 0 && !selectedRegencyId) {
      const cleanCity = city.replace(/KABUPATEN\s+|KOTA\s+/i, "").trim().toLowerCase();
      const match = regenciesList.find(
        (r) => {
          const cleanR = r.name.replace(/KABUPATEN\s+|KOTA\s+/i, "").trim().toLowerCase();
          return cleanR === cleanCity || cleanR.includes(cleanCity) || cleanCity.includes(cleanR);
        }
      );
      if (match) {
        setSelectedRegencyId(match.id);
      }
    }
  }, [city, regenciesList, selectedRegencyId]);

  // Fetch Districts when regency selected
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
      .catch((err) => console.error("Gagal load kecamatan:", err));
  }, [selectedRegencyId]);

  // Match district text to district ID
  useEffect(() => {
    if (district && districtsList.length > 0 && !selectedDistrictId) {
      const cleanDist = district.replace(/\(Desa\/Kel:.*?\)/i, "").trim().toLowerCase();
      const match = districtsList.find(
        (d) => d.name.toLowerCase() === cleanDist || cleanDist.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(cleanDist)
      );
      if (match) {
        setSelectedDistrictId(match.id);
      }
    }
  }, [district, districtsList, selectedDistrictId]);

  // Fetch Villages when district selected
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
      .catch((err) => console.error("Gagal load desa:", err));
  }, [selectedDistrictId]);

  // Auto fetch Postcode when village / district selected
  useEffect(() => {
    if (!selectedVillageName || !district || !city) return;
    const cleanReg = city.replace(/KABUPATEN\s+|KOTA\s+/i, "").trim();
    const cleanDist = district.replace(/\(Desa\/Kel:.*?\)/i, "").trim();
    const query = `${selectedVillageName} ${cleanDist} ${cleanReg}`;

    setIsFetchingPostcode(true);
    fetch(`/api/wilayah?type=postcode&q=${encodeURIComponent(query)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData && resData.data && resData.data.length > 0) {
          const match = resData.data.find((item: any) =>
            item.village.toLowerCase().includes(selectedVillageName.toLowerCase()) ||
            selectedVillageName.toLowerCase().includes(item.village.toLowerCase())
          ) || resData.data[0];

          if (match && match.code) {
            setPostalCode(match.code.toString());
          }
        }
      })
      .catch((err) => console.error("Gagal cari kode pos:", err))
      .finally(() => setIsFetchingPostcode(false));
  }, [selectedVillageName, district, city]);

  useEffect(() => {
    if (addressToEdit) {
      setLabel(addressToEdit.label || "");
      setRecipientName(addressToEdit.recipientName || "");
      setRecipientPhone(addressToEdit.recipientPhone || "");
      setFullAddress(addressToEdit.fullAddress || "");
      
      const rawDist = addressToEdit.district || "";
      if (rawDist.includes("Desa/Kel:")) {
        const parts = rawDist.split("(Desa/Kel:");
        setDistrict(parts[0].trim());
        if (parts[1]) {
          setSelectedVillageName(parts[1].replace(")", "").trim());
        }
      } else {
        setDistrict(rawDist);
      }

      setCity(addressToEdit.city || "");
      setProvince(addressToEdit.province || "");
      setPostalCode(addressToEdit.postalCode || "");
      setIsMain(!!addressToEdit.isMain);
      setCdobNote(addressToEdit.cdobNote || "");
    } else {
      setLabel("Alamat Pengiriman");
      setRecipientName("");
      setRecipientPhone("");
      setFullAddress("");
      setDistrict("Tamalanrea");
      setCity("Kota Makassar");
      setProvince("Sulawesi Selatan");
      setPostalCode("90245");
      setSelectedVillageName("");
      setIsMain(false);
      setCdobNote("");
    }
  }, [addressToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientPhone || !fullAddress) {
      alert("Nama Penerima, No HP, dan Alamat Lengkap wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const { createShippingAddress, updateShippingAddress } = await import("@/app/actions/shipping-addresses");

      // Format district to explicitly include Desa/Kelurahan
      const cleanDist = district.replace(/\(Desa\/Kel:.*?\)/i, "").trim();
      const finalDistrict = selectedVillageName 
        ? `${cleanDist} (Desa/Kel: ${selectedVillageName})`
        : cleanDist;

      if (addressToEdit?.id) {
        const res = await updateShippingAddress(addressToEdit.id, {
          label,
          recipientName,
          recipientPhone,
          fullAddress,
          district: finalDistrict,
          city,
          province,
          postalCode,
          isMain,
          cdobNote,
        });

        if (res.success) {
          onSaveSuccess();
          onClose();
        } else {
          alert(res.error || "Gagal memperbarui alamat");
        }
      } else {
        const res = await createShippingAddress({
          institutionId,
          label,
          recipientName,
          recipientPhone,
          fullAddress,
          district: finalDistrict,
          city,
          province,
          postalCode,
          isMain,
          cdobNote,
        });

        if (res.success) {
          onSaveSuccess();
          onClose();
        } else {
          alert(res.error || "Gagal menyimpan alamat baru");
        }
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[270] overflow-y-auto flex items-center justify-center p-3 md:p-4 bg-slate-900/40 backdrop-blur-sm font-sans animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden relative animate-slideUp">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MapPin className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-heading font-black text-sm text-slate-900 leading-tight">
                {addressToEdit ? "Edit Alamat Pengiriman" : "Tambah Alamat Pengiriman Baru"}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">Format Standar Ekspedisi &amp; Kurir Biteship</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* Label Alamat */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Label Alamat:</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Cth: Apotek Utama, Gudang Depo 2, Cabang Pelangi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-900 font-medium"
            />
          </div>

          {/* Nama & Telepon Penerima */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Penerima Lapangan:</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Cth: Apoteker Sarah / Petugas Gudang"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">No. HP / WhatsApp Penerima:</label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="Cth: 081234567890"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-900 font-medium font-mono"
              />
            </div>
          </div>

          {/* Cascading Wilayah: Provinsi & Kota/Kabupaten */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Provinsi:</label>
              <select
                value={selectedProvinceId}
                onChange={(e) => {
                  const pId = e.target.value;
                  setSelectedProvinceId(pId);
                  const pName = provincesList.find((p) => p.id === pId)?.name || "";
                  setProvince(pName);
                  setSelectedRegencyId("");
                  setCity("");
                  setSelectedDistrictId("");
                  setDistrict("");
                  setSelectedVillageName("");
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 font-medium bg-white"
              >
                <option value="">{province ? province : "Pilih Provinsi"}</option>
                {provincesList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kota / Kabupaten:</label>
              <select
                disabled={!selectedProvinceId && regenciesList.length === 0}
                value={selectedRegencyId}
                onChange={(e) => {
                  const rId = e.target.value;
                  setSelectedRegencyId(rId);
                  const rName = regenciesList.find((r) => r.id === rId)?.name || "";
                  setCity(rName);
                  setSelectedDistrictId("");
                  setDistrict("");
                  setSelectedVillageName("");
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 font-medium bg-white disabled:opacity-50"
              >
                <option value="">{city ? city : "Pilih Kota/Kabupaten"}</option>
                {regenciesList.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cascading Wilayah: Kecamatan & Kelurahan/Desa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kecamatan:</label>
              <select
                disabled={!selectedRegencyId && districtsList.length === 0}
                value={selectedDistrictId}
                onChange={(e) => {
                  const dId = e.target.value;
                  setSelectedDistrictId(dId);
                  const dName = districtsList.find((d) => d.id === dId)?.name || "";
                  setDistrict(dName);
                  setSelectedVillageName("");
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 font-medium bg-white disabled:opacity-50"
              >
                <option value="">{district ? district : "Pilih Kecamatan"}</option>
                {districtsList.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kelurahan / Desa:</label>
              <select
                disabled={!selectedDistrictId && villagesList.length === 0}
                value={selectedVillageName}
                onChange={(e) => setSelectedVillageName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 font-medium bg-white disabled:opacity-50"
              >
                <option value="">{selectedVillageName ? selectedVillageName : "Pilih Kelurahan/Desa"}</option>
                {villagesList.map((v) => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kode Pos Auto-filled */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">Kode Pos (Otomatis Terisi):</label>
              {isFetchingPostcode && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Mencari kode pos...
                </span>
              )}
            </div>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Cth: 90245"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 font-mono font-bold bg-slate-50"
            />
          </div>

          {/* Detail Alamat Lengkap & Patokan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Detail Alamat Lengkap &amp; Patokan:</label>
            <textarea
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="Cth: Jl. Tamalanrea Raya Ruko Pelangi Blok B No. 7 (Depan RS Wahidin), Makassar"
              rows={3}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-900 font-medium resize-none leading-relaxed"
            />
          </div>

          {/* Catatan Legitimasi CDOB */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan SIA / Sarana CDOB (Opsional):</label>
            <input
              type="text"
              value={cdobNote}
              onChange={(e) => setCdobNote(e.target.value)}
              placeholder="Cth: Terikat Izin SIA-2023-99881 / Izin Operasional Klinik"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900"
            />
          </div>

          {/* Checkbox Alamat Utama */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isMain}
              onChange={(e) => setIsMain(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
            />
            <span className="font-extrabold text-slate-800 text-xs">Jadikan Alamat Utama Pemesanan</span>
          </label>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl cursor-pointer border-none"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold rounded-2xl cursor-pointer shadow-md border-none flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {addressToEdit ? "Simpan Perubahan" : "Simpan Alamat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
