"use client";

import { useEffect, useState } from "react";
import { getCourierMeta } from "@/lib/courier-logos";
import { parseFullAddress } from "@/lib/address-parser";
import CourierLogoBadge from "@/components/CourierLogoBadge";
import AddressManagerModal from "@/components/AddressManagerModal";
import AddressFormModal from "@/components/AddressFormModal";
import { MapPin, Navigation, ShieldCheck, Plus, Edit3 } from "lucide-react";
import { triggerHapticImpact } from "@/lib/mobile-haptics";

interface Batch {
  id: string;
  batchNumber: string;
  expiryDate: string | Date;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  code: string;
  activeIngredient: string;
  price: number;
  category: string;
  description: string | null;
  unit: string;
  manufacturer: string;
  totalStock: number;
  batches?: Batch[];
}

interface CheckoutViewProps {
  cart: { product: Product; quantity: number }[];
  cartTotal: number;
  user: any;
  institution: any;
  today: Date;
  hasSigned: boolean;
  signatureDataUrl: string;
  setHasSigned: (val: boolean) => void;
  setSignatureDataUrl: (val: string) => void;
  setIsDrawingModalOpen: (val: boolean) => void;
  paymentMethod: "VA" | "TOP" | "COD";
  setPaymentMethod: (val: "VA" | "TOP" | "COD") => void;
  checkoutError: string | null;
  isSubmittingOrder: boolean;
  handleCheckout: (shippingAddress: string) => void;
  setIsCheckoutOpen: (val: boolean) => void;
}

export default function CheckoutView({
  cart,
  cartTotal,
  user,
  institution,
  today,
  hasSigned,
  signatureDataUrl,
  setHasSigned,
  setSignatureDataUrl,
  setIsDrawingModalOpen,
  paymentMethod,
  setPaymentMethod,
  checkoutError,
  isSubmittingOrder,
  handleCheckout,
  setIsCheckoutOpen,
}: CheckoutViewProps) {
  const isColdChain = cart.some(it => it.product.name.includes("Insulin") || it.product.code.includes("AMX"));
  const [shippingFee, setShippingFee] = useState(isColdChain ? 85000 : 50000);
  const vatAmount = cartTotal * 0.11;
  const totalBilling = cartTotal + vatAmount + shippingFee;

  const availableLimit = institution.creditLimit - institution.currentDebt;
  const isLimitInsufficient = totalBilling > availableLimit;

  useEffect(() => {
    if (isLimitInsufficient && (paymentMethod === "TOP" || false)) {
      setPaymentMethod("VA");
    }
  }, [isLimitInsufficient, paymentMethod, setPaymentMethod]);
  // States for shipping address details
  const [shippingProvince, setShippingProvince] = useState("Sulawesi Selatan");
  const [shippingRegency, setShippingRegency] = useState("Makassar");
  const [shippingDistrict, setShippingDistrict] = useState("Tamalanrea");
  const [shippingVillage, setShippingVillage] = useState("Tamalanrea");
  const [shippingPostalCode, setShippingPostalCode] = useState("90245");
  const [shippingAddressDetail, setShippingAddressDetail] = useState(institution.address || "");
  const [businessEmail, setBusinessEmail] = useState(user.email || "mitra@groovyrx.com");
  const [phoneNumber, setPhoneNumber] = useState(user.phone || "085151005960");
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);

  // Address Book Integration
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [isAddressManagerOpen, setIsAddressManagerOpen] = useState(false);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<any>(null);

  const handleSelectAddress = (addr: any) => {
    setSelectedAddress(addr);
    setShippingProvince(addr.province || "Sulawesi Selatan");
    setShippingRegency(addr.city || "Makassar");

    let cleanDist = addr.district || "";
    let village = "";
    if (cleanDist.includes("(Desa/Kel:")) {
      const parts = cleanDist.split("(Desa/Kel:");
      cleanDist = parts[0].trim();
      village = parts[1].replace(")", "").trim();
    }
    const parsed = parseFullAddress(addr.fullAddress);

    setShippingDistrict(cleanDist || parsed.district || "Tamalanrea");
    setShippingVillage(village || parsed.village || cleanDist || "");
    setShippingPostalCode(addr.postalCode || parsed.postalCode || "");
    setShippingAddressDetail(addr.fullAddress);
    if (addr.recipientPhone) setPhoneNumber(addr.recipientPhone);
  };

  const fetchAddresses = async () => {
    if (!institution?.id) return;
    try {
      const { getShippingAddresses } = await import("@/app/actions/shipping-addresses");
      const res = await getShippingAddresses(institution.id);
      if (res.success && res.addresses.length > 0) {
        setSavedAddresses(res.addresses);
        const stillExists = selectedAddress ? res.addresses.find((a: any) => a.id === selectedAddress.id) : null;
        const main = res.addresses.find((a: any) => a.isMain) || res.addresses[0];
        if (stillExists) {
          handleSelectAddress(stillExists);
        } else {
          handleSelectAddress(main);
        }
      } else {
        setSavedAddresses([]);
        setSelectedAddress(null);
        setShippingProvince("");
        setShippingRegency("");
        setShippingDistrict("");
        setShippingVillage("");
        setShippingPostalCode("");
        setShippingAddressDetail("");
      }
    } catch (err) {
      console.error("Gagal load alamat checkout:", err);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [institution?.id]);

  const [provincesList, setProvincesList] = useState<{ id: string; name: string }[]>([]);
  const [regenciesList, setRegenciesList] = useState<{ id: string; name: string }[]>([]);
  const [districtsList, setDistrictsList] = useState<{ id: string; name: string }[]>([]);
  const [villagesList, setVillagesList] = useState<{ id: string; name: string }[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedRegencyId, setSelectedRegencyId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");

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

  // Fetch postcode automatically when shippingVillage or selectedDistrictId changes
  useEffect(() => {
    if (!shippingVillage || !shippingDistrict) {
      return;
    }
    const cleanRegency = shippingRegency.replace(/KABUPATEN\s+|KOTA\s+/i, "").trim();
    const query = `${shippingVillage} ${shippingDistrict} ${cleanRegency}`;
    
    fetch(`/api/wilayah?type=postcode&q=${encodeURIComponent(query)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData && resData.data && resData.data.length > 0) {
          const match = resData.data.find((item: any) => 
            item.village.toLowerCase().includes(shippingVillage.toLowerCase()) ||
            shippingVillage.toLowerCase().includes(item.village.toLowerCase())
          ) || resData.data[0];
          
          const code = match ? (match.postalcode || match.postcode || match.code) : null;
          if (code) {
            setShippingPostalCode(code.toString());
          }
        }
      })
      .catch((err) => {
        console.error("Gagal mencocokkan kode pos:", err);
      });
  }, [shippingVillage, shippingDistrict, shippingRegency]);

  const [biteshipRates, setBiteshipRates] = useState<any[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<any | null>(null);

  // Estimate weight: standard Indonesian courier minimum billing is 1kg (1000g)
  // We estimate 50g per medicine item, minimum 1000g.
  const totalWeight = Math.max(1000, cart.reduce((acc, item) => acc + item.quantity * 50, 0));

  useEffect(() => {
    setIsLoadingRates(true);
    setRatesError(null);

    const destProv = shippingProvince.trim() || selectedAddress?.province || "Sulawesi Selatan";
    const destCity = shippingRegency.trim() || selectedAddress?.city || "Kota Makassar";
    let rawDist = shippingDistrict.trim() || selectedAddress?.district || "Tamalanrea";
    if (rawDist.includes("(Desa/Kel:")) {
      rawDist = rawDist.split("(Desa/Kel:")[0].trim();
    }
    const destDist = rawDist;

    fetch("/api/biteship/rates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destination_province: destProv,
        destination_city: destCity,
        destination_district: destDist,
        destination_village: shippingVillage || selectedAddress?.village || "",
        destination_postal_code: shippingPostalCode || selectedAddress?.postalCode || "",
        weight: totalWeight,
      }),
    })
      .then(async (res) => {
        const isJson = res.headers.get("content-type")?.includes("application/json");
        const data = isJson ? await res.json() : null;
        if (!res.ok) {
          const errMsg = data?.error || "Gagal mengambil tarif pengiriman";
          throw new Error(errMsg);
        }
        return data;
      })
      .then((data) => {
        if (data && data.success && data.pricing && data.pricing.length > 0) {
          setBiteshipRates(data.pricing);
          const firstValidRate = data.pricing.find((p: any) => typeof p.price === "number") || data.pricing[0];
          setSelectedRate(firstValidRate);
          setShippingFee(typeof firstValidRate.price === "number" ? firstValidRate.price : 0);
          if (data.warning) {
            setRatesError(data.warning);
          } else {
            setRatesError(null);
          }
        } else {
          setBiteshipRates([]);
          setSelectedRate(null);
          setRatesError(data?.error || "Tidak ada tarif kurir real-time dari Biteship API untuk lokasi ini.");
        }
      })
      .catch((err) => {
        console.error("Rates fetch error:", err);
        setRatesError(err.message || "Layanan pengiriman Biteship API sedang bermasalah.");
        setBiteshipRates([]);
        setSelectedRate(null);
      })
      .finally(() => {
        setIsLoadingRates(false);
      });
  }, [shippingProvince, shippingRegency, shippingDistrict, selectedAddress, totalWeight, isColdChain]);

  const rawAddressText = selectedAddress
    ? selectedAddress.fullAddress
    : (shippingAddressDetail || institution?.address || "");

  const isAddressIncomplete =
    !rawAddressText ||
    rawAddressText.includes("Alamat belum dilengkapi") ||
    rawAddressText.includes("lengkapi di Pengaturan") ||
    rawAddressText.trim().length < 5;

  const isShippingFormValid =
    !isAddressIncomplete &&
    (selectedAddress !== null ||
    shippingAddressDetail.trim() !== "" ||
    (institution && institution.address && institution.address.trim() !== ""));

  const handleConfirmClick = () => {
    if (isAddressIncomplete) {
      triggerHapticImpact();
      alert("Alamat pengiriman belum dilengkapi. Silakan klik 'Ubah Alamat' untuk memilih atau melengkapi Alamat Utama Anda.");
      setIsAddressManagerOpen(true);
      return;
    }
    if (!hasSigned || !signatureDataUrl) {
      alert("Harap bubuhkan e-Sign SP (Tanda tangan digital) terlebih dahulu.");
      return;
    }
    handleCheckout(consolidatedAddress);
  };

  const durationText = selectedRate?.shipment_duration ? ` (${selectedRate.shipment_duration} hari)` : "";
  const courierPriceText = typeof selectedRate?.price === "number"
    ? ` - Rp ${selectedRate.price.toLocaleString("id-ID")}`
    : " - Tarif Realtime Belum Dimuat";

  const courierString = selectedRate
    ? ` | Kurir: ${selectedRate.courier_name.toUpperCase()} ${selectedRate.courier_service_name} [code: ${selectedRate.courier_code}:${selectedRate.courier_service_code || selectedRate.type || 'reg'}]${durationText}${courierPriceText}`
    : " | Kurir: Standard Flat Rate";

  const cleanDetail = parseFullAddress(shippingAddressDetail).detail || shippingAddressDetail.replace(/^Alamat:\s*/i, "").split(/,\s*(?:Kel\/Desa|Kel|Kec|Kab\/Kota|Provinsi):/i)[0].replace(/,\s*Tamalanrea,\s*Makassar.*$/i, "").trim();

  const activeAddressText = selectedAddress
    ? `${selectedAddress.fullAddress} (Penerima: ${selectedAddress.recipientName} - ${selectedAddress.recipientPhone})`
    : `Alamat: ${cleanDetail}, Kel/Desa: ${shippingVillage}, Kec: ${shippingDistrict}, Kab/Kota: ${shippingRegency}, Provinsi: ${shippingProvince}, Kode Pos: ${shippingPostalCode} | Email: ${businessEmail} | Telp: ${phoneNumber}`;

  const consolidatedAddress = `${activeAddressText}${courierString}`;

  useEffect(() => {
    console.log("%c[CHECKOUT DEBUG VERIFICATION]", "background: #064e3b; color: #34d399; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
    console.log("📍 ALAMAT TERPILIH:", {
      recipient: selectedAddress ? selectedAddress.recipientName : institution.name,
      phone: selectedAddress ? selectedAddress.recipientPhone : phoneNumber,
      fullAddress: selectedAddress ? selectedAddress.fullAddress : rawAddressText,
      village: shippingVillage || selectedAddress?.village || "-",
      district: shippingDistrict,
      city: shippingRegency,
      province: shippingProvince,
      postalCode: shippingPostalCode || selectedAddress?.postalCode || "-",
      isAddressIncomplete
    });
    console.log("🚚 KURIR TERPILIH:", {
      courier_name: selectedRate ? selectedRate.courier_name : "Standard Flat Rate",
      courier_code: selectedRate ? selectedRate.courier_code : "default",
      service_name: selectedRate ? selectedRate.courier_service_name : "Logistik PBF",
      duration: selectedRate ? (selectedRate.duration || `${selectedRate.shipment_duration} hari`) : "1 - 2 Hari",
      shippingFee: shippingFee
    });
    console.log("💰 RINCIAN BIAYA:", {
      subtotal: cartTotal,
      vat11: vatAmount,
      shippingFee: shippingFee,
      totalBilling: totalBilling
    });
    console.log("📄 CONSOLIDATED ADDRESS (FORMAT DB):", consolidatedAddress);
  }, [selectedAddress, selectedRate, shippingFee, totalBilling, consolidatedAddress, shippingDistrict, shippingRegency, shippingProvince, shippingVillage, shippingPostalCode, rawAddressText, isAddressIncomplete, cartTotal, vatAmount, institution.name, phoneNumber]);

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-xs">
      
      {/* 1. TOP STEPPER PROGRESS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Step 1 */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              ✓
            </div>
            <span className="text-xs font-bold text-slate-800">Ringkasan</span>
          </div>

          <div className="h-0.5 flex-1 bg-emerald-500 mx-4 rounded-full" />

          {/* Step 2 (Active) */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs ring-4 ring-emerald-100">
              2
            </div>
            <span className="text-xs font-bold text-emerald-700">Digital PO (e-Sign)</span>
          </div>

          <div className="h-0.5 flex-1 bg-slate-200 mx-4 rounded-full" />

          {/* Step 3 */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-bold border border-slate-200">
              3
            </div>
            <span className="text-xs font-medium text-slate-400">Pembayaran</span>
          </div>
        </div>
      </div>



      {checkoutError && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs text-rose-700 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-rose-600 shrink-0">warning</span>
          <span className="font-semibold">{checkoutError}</span>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN LAYOUT (LEFT 7 : RIGHT 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================= KOLOM KIRI (SPAN 7) ================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Item Ringkasan Pesanan */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2 font-heading">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">inventory_2</span>
                Ringkasan Pesanan ({cart.length} Item)
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                Siap Diproses
              </span>
            </div>

            <div className="space-y-2.5">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-emerald-600 font-bold shrink-0 p-0.5">
                      <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                        {item.product.name.includes("Insulin") ? "vaccines" : "pill"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.product.name}</h4>
                      <p className="text-[10px] text-slate-400">
                        Zat Aktif: {item.product.activeIngredient} • {item.quantity} {item.product.unit.split(" ")[0]}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block font-sans">
                      Rp {item.product.price.toLocaleString("id-ID")} / {item.product.unit.split(" ")[0]}
                    </span>
                    <span className="font-extrabold text-slate-900 font-sans">
                      Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SURAT PESANAN (E-SIGN SP) DOCUMENT CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">draw</span>
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider font-heading">
                  Digital Purchase Order (e-Sign SP)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">priority_high</span> Review Mandatory
              </span>
            </div>

            {/* Document Paper Preview (Paper Style) */}
            <div className="bg-slate-50/80 p-5 md:p-6 rounded-xl border border-slate-200/80 space-y-4 text-xs relative">
              <div className="absolute top-4 right-4 opacity-10 transform rotate-12 select-none pointer-events-none">
                <span className="text-4xl font-extrabold border-4 border-emerald-600 text-emerald-600 px-4 py-2">DRAFT</span>
              </div>

              <div className="text-center border-b border-slate-200 pb-3">
                <h4 className="font-extrabold text-slate-900 tracking-tight text-sm uppercase font-heading">
                  SURAT PESANAN (SP) OBAT JADI
                </h4>
                <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                  Nomor: SP/{new Date().getFullYear()}/{String(new Date().getMonth() + 1).padStart(2, '0')}/KF-42-{(Math.floor(Math.random() * 9000) + 1000)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[10px]">Apoteker APJ:</span>
                  <span className="font-bold text-slate-800">{user.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SIPA No:</span>
                  <span className="font-mono text-slate-800">{user.sipaNumber || "SIPA-PBF-9988-2024"}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Apotek Sarana:</span>
                  <span className="font-bold text-slate-800">{institution.name}</span>
                </div>
              </div>

              <table className="w-full border-collapse border border-slate-200 text-[10px] bg-white rounded-md overflow-hidden">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                    <th className="p-1.5 border-r border-slate-200 text-center w-8">No</th>
                    <th className="p-1.5 border-r border-slate-200 text-left">Nama Obat</th>
                    <th className="p-1.5 border-r border-slate-200 text-center w-16">Jumlah</th>
                    <th className="p-1.5 text-left w-16">Satuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {cart.map((item, idx) => (
                    <tr key={item.product.id}>
                      <td className="p-1.5 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                      <td className="p-1.5 border-r border-slate-200 font-medium">{item.product.name}</td>
                      <td className="p-1.5 border-r border-slate-200 text-center font-bold">{item.quantity}</td>
                      <td className="p-1.5 font-medium">{item.product.unit.split(" ")[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Action Area Signature Stamp */}
              <div className="pt-2 flex items-center justify-between bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200/80">
                <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                  <span>Otorisasi Tanda Tangan Digital APJ</span>
                </div>

                {hasSigned && signatureDataUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={signatureDataUrl} alt="APJ Signature" className="h-10 border border-dashed border-emerald-500/40 rounded bg-white p-0.5 object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setHasSigned(false);
                        setSignatureDataUrl("");
                      }}
                      className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer border-none bg-transparent"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsDrawingModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer border-none"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Bubuhkan e-Sign
                  </button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic text-center">
              Dengan membubuhi e-Sign, Anda mengonfirmasi pemesanan ini mematuhi standar regulasi CDOB BPOM &amp; Kemenkes RI.
            </p>
          </div>

        </div>

        {/* ================= KOLOM KANAN (SPAN 5 - STICKY SUMMARY) ================= */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Lokasi Pengiriman */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">location_on</span>
                Alamat Pengiriman
              </span>
              <button
                type="button"
                onClick={() => {
                  triggerHapticImpact();
                  setIsAddressManagerOpen(true);
                }}
                className="text-[11px] font-bold text-emerald-600 hover:underline border-none bg-transparent cursor-pointer"
              >
                Ubah Alamat
              </button>
            </div>

            {isAddressIncomplete ? (
              <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-xl space-y-2 text-xs text-amber-900 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <span className="material-symbols-outlined text-amber-600 text-[18px]">warning</span>
                  <span>Alamat Pengiriman Belum Lengkap</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {rawAddressText || "Alamat instansi Anda belum dilengkapi."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticImpact();
                    setIsAddressManagerOpen(true);
                  }}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all text-center cursor-pointer border-none active:scale-95"
                >
                  Lengkapi / Ubah Alamat Sekarang →
                </button>
              </div>
            ) : selectedAddress ? (
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900">{selectedAddress.recipientName} • <span className="font-mono text-slate-600">{selectedAddress.recipientPhone}</span></p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{selectedAddress.fullAddress}</p>
              </div>
            ) : (
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900">{institution.name}</p>
                <p className="text-xs text-slate-600">{phoneNumber}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {shippingAddressDetail || institution.address}
                </p>
              </div>
            )}
          </div>

          {/* Choice Shipping Options Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2.5 font-heading">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">local_shipping</span>
              Metode Pengiriman
            </span>

            {isLoadingRates && (
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] text-slate-400 font-medium">Mengambil tarif kurir real-time...</span>
              </div>
            )}

            {!isLoadingRates && biteshipRates.length === 0 && (
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-bold text-rose-900">
                  <span className="material-symbols-outlined text-rose-600 text-[18px]">error</span>
                  <span>Gagal Memuat Tarif Real-time Biteship API</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed font-mono">
                  {ratesError || "Respon API Biteship tidak tersedia atau saldo kosong."}
                </p>
                <p className="text-[10px] text-rose-600 italic pt-1 border-t border-rose-200/60">
                  Fallback server telah dinonaktifkan. Silakan periksa kunci API / Top Up saldo akun Biteship Anda.
                </p>
              </div>
            )}

            {!isLoadingRates && biteshipRates.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {biteshipRates.map((rate, i) => {
                  const isSelected = selectedRate?.courier_code === rate.courier_code && selectedRate?.courier_service_code === rate.courier_service_code;
                  return (
                    <label
                      key={i}
                      onClick={() => {
                        console.log("=========================================");
                        console.log("[DEBUG MITRA COURIER SELECTION CHANGED]");
                        console.log("Selected Courier:", {
                          courier_company: rate.courier_code,
                          courier_type: rate.courier_service_code || rate.type || 'reg',
                          courier_name: rate.courier_name,
                          service_name: rate.courier_service_name,
                          price: rate.price,
                          duration: rate.shipment_duration || rate.duration
                        });
                        console.log("=========================================");
                        setSelectedRate(rate);
                        setShippingFee(typeof rate.price === "number" ? rate.price : 0);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/40"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <CourierLogoBadge courierCode={rate.courier_code} courierName={rate.courier_name} />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {rate.courier_name.toUpperCase()} - {rate.courier_service_name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Estimasi {rate.duration || `${rate.shipment_duration} hari`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {typeof rate.price === "number" ? (
                          <span className="text-xs font-extrabold text-emerald-700 font-sans block">
                            Rp {rate.price.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg block">
                            Gagal Memuat Tarif
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Choice Payment Method */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 font-heading">
              Metode Pembayaran
            </h3>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl border-2 border-emerald-600 bg-emerald-50/40 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "VA"}
                    onChange={() => setPaymentMethod("VA")}
                    className="accent-emerald-600"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Bank Transfer (Virtual Account)</p>
                    <p className="text-[10px] text-slate-500">BCA, Mandiri, BNI (Auto Check)</p>
                  </div>
                </div>
              </label>

              <label className={`flex items-center justify-between p-3 rounded-xl border ${
                isLimitInsufficient
                  ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                  : paymentMethod === "TOP"
                  ? "border-emerald-600 bg-emerald-50/40 cursor-pointer"
                  : "border-slate-200 hover:border-slate-300 bg-white cursor-pointer"
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="payment"
                    disabled={isLimitInsufficient}
                    checked={paymentMethod === "TOP"}
                    onChange={() => !isLimitInsufficient && setPaymentMethod("TOP")}
                    className="accent-emerald-600"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Credit Limit / TOP</p>
                    <p className="text-[10px] text-slate-500">Sisa Limit: Rp {availableLimit.toLocaleString("id-ID")}</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Total Ringkasan Pembayaran & CTA */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5 font-heading">
              Rincian Pembayaran
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Produk</span>
                <span className="font-sans font-bold text-slate-700">Rp {cartTotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>PPN 11%</span>
                <span className="font-sans font-bold text-slate-700">Rp {vatAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Biaya Pengiriman</span>
                <span className="font-sans font-bold text-slate-700">Rp {shippingFee.toLocaleString("id-ID")}</span>
              </div>
              
              <div className="pt-3 border-t border-slate-100 flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">TOTAL TAGIHAN</span>
                  <span className="text-xl font-extrabold text-slate-900 font-sans">
                    Rp {totalBilling.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirmClick}
              disabled={isSubmittingOrder || !hasSigned || isAddressIncomplete}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-none ${
                !hasSigned || isSubmittingOrder || isAddressIncomplete
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
              }`}
            >
              <span>{isSubmittingOrder ? "Memproses Order..." : "Konfirmasi & Bayar"}</span>
              <span>→</span>
            </button>

            {isAddressIncomplete ? (
              <p className="text-[11px] text-amber-800 font-bold text-center bg-amber-50 p-2.5 rounded-xl border border-amber-200/80">
                ⚠️ Alamat pengiriman belum dilengkapi. Klik "Ubah Alamat" di atas untuk melengkapi alamat Anda.
              </p>
            ) : !hasSigned ? (
              <p className="text-[10px] text-amber-700 font-bold text-center animate-pulse">
                ⚠️ Harap bubuhkan e-Sign SP terlebih dahulu di kolom kiri
              </p>
            ) : null}
          </div>

        </div>

      </div>

      {/* Address Book Manager Modal */}
      <AddressManagerModal
        isOpen={isAddressManagerOpen}
        onClose={() => setIsAddressManagerOpen(false)}
        addresses={savedAddresses}
        selectedAddressId={selectedAddress?.id}
        onSelectAddress={handleSelectAddress}
        onAddNewAddress={() => {
          setAddressToEdit(null);
          setIsAddressFormOpen(true);
        }}
        onEditAddress={(addr) => {
          setAddressToEdit(addr);
          setIsAddressFormOpen(true);
        }}
        onDeleteAddress={async (id) => {
          if (!confirm("Hapus alamat ini?")) return;
          const { deleteShippingAddress } = await import("@/app/actions/shipping-addresses");
          await deleteShippingAddress(id);
          fetchAddresses();
        }}
        onSetMainAddress={async (id) => {
          const { setMainShippingAddress } = await import("@/app/actions/shipping-addresses");
          await setMainShippingAddress(id, institution.id);
          fetchAddresses();
        }}
      />

      {/* Address Form Modal */}
      <AddressFormModal
        isOpen={isAddressFormOpen}
        onClose={() => setIsAddressFormOpen(false)}
        addressToEdit={addressToEdit}
        institutionId={institution?.id}
        onSaveSuccess={fetchAddresses}
      />
    </div>
  );
}
