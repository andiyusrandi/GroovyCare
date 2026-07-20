"use client";

import { useEffect, useState } from "react";

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
  paymentMethod: "VA" | "TOP" | "INVOICE" | "COD";
  setPaymentMethod: (val: "VA" | "TOP" | "INVOICE" | "COD") => void;
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
    if (isLimitInsufficient && (paymentMethod === "TOP" || paymentMethod === "INVOICE")) {
      setPaymentMethod("VA");
    }
  }, [isLimitInsufficient, paymentMethod, setPaymentMethod]);
  // States for shipping address details
  const [shippingProvince, setShippingProvince] = useState("");
  const [shippingRegency, setShippingRegency] = useState("");
  const [shippingDistrict, setShippingDistrict] = useState("");
  const [shippingVillage, setShippingVillage] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingAddressDetail, setShippingAddressDetail] = useState(institution.address || "");
  const [businessEmail, setBusinessEmail] = useState(user.email || "");
  const [phoneNumber, setPhoneNumber] = useState("");

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
          
          if (match && match.code) {
            setShippingPostalCode(match.code.toString());
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
    const hasAddress =
      shippingProvince.trim() !== "" &&
      shippingRegency.trim() !== "" &&
      shippingDistrict.trim() !== "";

    if (!hasAddress) {
      setBiteshipRates([]);
      setSelectedRate(null);
      setShippingFee(isColdChain ? 85000 : 50000);
      return;
    }

    setIsLoadingRates(true);
    setRatesError(null);

    fetch("/api/biteship/rates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destination_province: shippingProvince,
        destination_city: shippingRegency,
        destination_district: shippingDistrict,
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
          const firstRate = data.pricing[0];
          setSelectedRate(firstRate);
          setShippingFee(firstRate.price);
        } else {
          setBiteshipRates([]);
          setSelectedRate(null);
          setShippingFee(isColdChain ? 85000 : 50000);
        }
      })
      .catch((err) => {
        console.error("Rates fetch error:", err);
        setRatesError(err.message || "Layanan pengiriman sedang dalam pemeliharaan (Maintenance)");
        setBiteshipRates([]);
        setSelectedRate(null);
        setShippingFee(isColdChain ? 85000 : 50000);
      })
      .finally(() => {
        setIsLoadingRates(false);
      });
  }, [shippingProvince, shippingRegency, shippingDistrict, totalWeight, isColdChain]);

  const isShippingFormValid =
    shippingProvince.trim() !== "" &&
    shippingRegency.trim() !== "" &&
    shippingDistrict.trim() !== "" &&
    shippingVillage.trim() !== "" &&
    shippingPostalCode.trim() !== "" &&
    shippingAddressDetail.trim() !== "" &&
    businessEmail.trim() !== "" &&
    phoneNumber.trim() !== "" &&
    (isLoadingRates || biteshipRates.length === 0 || selectedRate !== null);

  const courierString = selectedRate
    ? ` | Kurir: ${selectedRate.courier_name.toUpperCase()} ${selectedRate.courier_service_name} (${selectedRate.shipment_duration} hari) - Rp ${selectedRate.price.toLocaleString("id-ID")}`
    : " | Kurir: Standard Flat Rate";

  const consolidatedAddress = `Alamat: ${shippingAddressDetail}, Kel/Desa: ${shippingVillage}, Kec: ${shippingDistrict}, Kab/Kota: ${shippingRegency}, Provinsi: ${shippingProvince}, Kode Pos: ${shippingPostalCode} | Email: ${businessEmail} | Telp: ${phoneNumber}${courierString}`;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Stepper Workflow Progress */}
      <div className="flex items-center justify-between mb-8 px-4 bg-white p-5 rounded-3xl border border-outline-variant/20 shadow-sm overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
            <span className="material-symbols-outlined text-[16px] text-white">check</span>
          </div>
          <span className="text-xs font-bold text-primary">Ringkasan Pesanan</span>
        </div>
        <div className="flex-1 h-[2px] min-w-[40px] mx-4 bg-primary"></div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs step-pulse">
            2
          </div>
          <span className="text-xs font-bold text-primary font-heading">Digital Purchase Order</span>
        </div>
        <div className="flex-1 h-[2px] min-w-[40px] mx-4 bg-outline-variant/30"></div>
        <div className="flex items-center gap-3 shrink-0 opacity-40">
          <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-bold text-xs">
            3
          </div>
          <span className="text-xs font-bold font-label-md">Metode Pembayaran</span>
        </div>
      </div>

      {checkoutError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-error flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-error shrink-0">warning</span>
          <span>{checkoutError}</span>
        </div>
      )}

      {/* Grid 12 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Ringkasan Pesanan */}
          <section className="bg-white rounded-3xl border border-outline-variant/20 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-outline-variant/20 bg-surface-container-low/40 flex justify-between items-center">
              <h2 className="font-heading font-bold text-sm text-foreground">Ringkasan Pesanan</h2>
              <span className="text-[10px] font-bold text-primary bg-primary-container/20 px-2.5 py-0.5 rounded-full">
                {cart.length} Item
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/20 text-on-surface-variant font-bold border-b border-outline-variant/20">
                    <th className="px-5 py-3">Nama Produk</th>
                    <th className="px-5 py-3 text-center">Jumlah</th>
                    <th className="px-5 py-3 text-right">Harga Satuan</th>
                    <th className="px-5 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                  {cart.map((item) => (
                    <tr key={item.product.id} className="hover:bg-surface-container-low/10 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-surface-container-low rounded-lg flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-[18px]">
                              {item.product.name.includes("Insulin") ? "vaccines" : "pill"}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{item.product.name}</p>
                            <p className="text-[9px] text-outline font-mono mt-0.5">
                              Zat Aktif: {item.product.activeIngredient}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-semibold">
                        {item.quantity} {item.product.unit.split(" ")[0]}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-on-surface-variant">
                        Rp {item.product.price.toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-foreground font-mono">
                        Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Digital Purchase Order */}
          <section className="bg-white rounded-3xl border border-outline-variant/20 p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">contract_edit</span>
                <h2 className="font-heading font-bold text-sm text-foreground">Digital Purchase Order (e-Sign SP)</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-error-container text-error rounded-full text-[10px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">priority_high</span> Mandatory Review
              </span>
            </div>

            <div className="bg-surface-container-low p-4 md:p-6 rounded-2xl border border-outline-variant/30 flex flex-col items-center gap-4 shadow-inner">
              
              {/* Simulated PDF Document View */}
              <div className="bg-white p-4 md:p-10 shadow-md w-full max-w-2xl text-on-surface space-y-4 md:space-y-6 font-serif text-[11px] overflow-y-auto max-h-96 border border-outline-variant/30 rounded-xl relative">
                <div className="absolute top-4 right-4 opacity-10 transform rotate-12 select-none pointer-events-none">
                  <span className="text-4xl font-extrabold border-4 border-primary text-primary px-4 py-2">DRAFT</span>
                </div>
                <div className="text-center border-b pb-4 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide">SURAT PESANAN (SP) OBAT JADI</h3>
                  <p className="font-mono text-[9px] text-on-surface-variant mt-1">Nomor: SP/{new Date().getFullYear()}/{String(new Date().getMonth() + 1).padStart(2, '0')}/KF-42-{(Math.floor(Math.random() * 9000) + 1000)}</p>
                </div>
                
                <div className="space-y-3 leading-relaxed">
                  <p>Yang bertanda tangan di bawah ini:</p>
                  <div className="space-y-1.5 ml-1 md:ml-4 text-[10px] md:text-[11px]">
                    <div className="flex flex-col md:flex-row md:gap-2">
                      <span className="font-bold md:w-32 shrink-0">Nama Apoteker APJ:</span>
                      <span className="text-on-surface-variant">{user.name}</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:gap-2">
                      <span className="font-bold md:w-32 shrink-0">SIPA No.:</span>
                      <span className="text-on-surface-variant font-mono">{user.sipaNumber || "SIPA-PBF-9988-2024"}</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:gap-2">
                      <span className="font-bold md:w-32 shrink-0">Nama Apotek:</span>
                      <span className="text-on-surface-variant">{institution.name}</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:gap-2">
                      <span className="font-bold md:w-32 shrink-0">Alamat Sarana:</span>
                      <span className="text-on-surface-variant leading-relaxed">{institution.address}</span>
                    </div>
                  </div>
                  
                  <p className="mt-4">Memesan obat-obatan kepada PBF PharmaDist Nusantara (PBF Online) sebagai berikut:</p>
                  
                  <table className="w-full border-collapse border border-on-surface text-[10px] mt-2">
                    <thead>
                      <tr className="border-b border-on-surface bg-slate-50 font-bold">
                        <th className="p-1 border-r border-on-surface text-center w-8">No</th>
                        <th className="p-1 border-r border-on-surface text-left">Nama Obat</th>
                        <th className="p-1 border-r border-on-surface text-center w-16">Jumlah</th>
                        <th className="p-1 text-left w-16">Satuan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, idx) => (
                        <tr key={item.product.id} className="border-b border-on-surface">
                          <td className="p-1 border-r border-on-surface text-center">{idx + 1}</td>
                          <td className="p-1 border-r border-on-surface">{item.product.name}</td>
                          <td className="p-1 border-r border-on-surface text-center">{item.quantity}</td>
                          <td className="p-1">{item.product.unit.split(" ")[0]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="text-right mt-6">Jakarta, {new Date(today).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  
                  {/* Signature stamp area */}
                  <div className="flex justify-end items-center h-20 pt-2">
                    <div className="text-center w-48 flex flex-col items-center justify-center">
                      {hasSigned && signatureDataUrl ? (
                        <div className="relative flex flex-col items-center">
                          <img src={signatureDataUrl} alt="APJ Signature" className="h-12 border border-dashed border-primary/40 rounded bg-slate-50 p-0.5 object-contain" />
                          <span className="text-[7px] text-primary font-bold tracking-wider mt-1 block">TERTANDA DIGITAL</span>
                          <button
                            type="button"
                            onClick={() => {
                              setHasSigned(false);
                              setSignatureDataUrl("");
                            }}
                            className="text-[8px] text-error font-bold hover:underline mt-1 cursor-pointer block"
                          >
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant/40 italic block border border-dashed border-outline-variant/40 p-3 rounded-xl bg-slate-50/50">
                          Belum Ditandatangani
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-right font-bold font-heading mt-2">( {user.name} )</p>
                </div>
              </div>

              {/* Action Button Below the Document */}
              {!hasSigned && (
                <button
                  type="button"
                  onClick={() => setIsDrawingModalOpen(true)}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-full font-bold shadow-lg hover:scale-105 transition-transform active:scale-95 group cursor-pointer border-none"
                >
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform text-white text-[20px]">draw</span>
                  <span>Tanda Tangan Digital</span>
                </button>
              )}
            </div>
            <p className="text-xs text-on-surface-variant italic text-center">
              Dengan membubuhi e-Sign, Anda mengonfirmasi pemesanan ini mematuhi standar regulasi CDOB BPOM &amp; Kemenkes RI.
            </p>
          </section>

        </div>

        {/* Right Column (4/12) */}
        <aside className="lg:col-span-4 space-y-6">

          {/* Lokasi Pengiriman & Kontak */}
          <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant/15 bg-surface-container-low/40">
              <h2 className="font-heading font-bold text-sm text-foreground">Lokasi Pengiriman &amp; Kontak</h2>
            </div>
            <div className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Provinsi</label>
                  <select
                    required
                    value={selectedProvinceId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedProvinceId(id);
                      const name = provincesList.find((p) => p.id === id)?.name || "";
                      setShippingProvince(name);
                      setSelectedRegencyId("");
                      setShippingRegency("");
                      setSelectedDistrictId("");
                      setShippingDistrict("");
                      setShippingVillage("");
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                  >
                    <option value="">Pilih Provinsi</option>
                    {provincesList.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Kabupaten/Kota</label>
                  <select
                    required
                    disabled={!selectedProvinceId}
                    value={selectedRegencyId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedRegencyId(id);
                      const name = regenciesList.find((r) => r.id === id)?.name || "";
                      setShippingRegency(name);
                      setSelectedDistrictId("");
                      setShippingDistrict("");
                      setShippingVillage("");
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs disabled:opacity-50"
                  >
                    <option value="">Pilih Kabupaten/Kota</option>
                    {regenciesList.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Kecamatan</label>
                  <select
                    required
                    disabled={!selectedRegencyId}
                    value={selectedDistrictId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedDistrictId(id);
                      const name = districtsList.find((d) => d.id === id)?.name || "";
                      setShippingDistrict(name);
                      setShippingVillage("");
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs disabled:opacity-50"
                  >
                    <option value="">Pilih Kecamatan</option>
                    {districtsList.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Kelurahan/Desa</label>
                  <select
                    required
                    disabled={!selectedDistrictId}
                    value={shippingVillage}
                    onChange={(e) => setShippingVillage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs disabled:opacity-50"
                  >
                    <option value="">Pilih Kelurahan/Desa</option>
                    {villagesList.map((v) => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Kode Pos</label>
                  <input
                    type="text"
                    required
                    placeholder="Kode Pos"
                    value={shippingPostalCode}
                    onChange={(e) => setShippingPostalCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-on-surface-variant mb-1">No. Telepon Penerima</label>
                  <input
                    type="tel"
                    required
                    placeholder="0812xxxxxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Email Bisnis</label>
                <input
                  type="email"
                  required
                  placeholder="email@bisnis.com"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Alamat Rumah / Apotek Lengkap</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Alamat lengkap lokasi pengiriman..."
                  value={shippingAddressDetail}
                  onChange={(e) => setShippingAddressDetail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs leading-normal"
                />
              </div>
            </div>
          </div>

          {/* Metode Pengiriman (BiteShip) */}
          <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant/15 bg-surface-container-low/40">
              <h2 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">local_shipping</span>
                Metode Pengiriman / Ekspedisi
              </h2>
            </div>
            <div className="p-5 space-y-3">
              {isLoadingRates && (
                <div className="flex flex-col items-center justify-center py-8 space-y-2">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-outline font-semibold">Mengambil tarif kurir real-time...</span>
                </div>
              )}

              {!isLoadingRates && biteshipRates.length === 0 && (
                <div className="p-4 bg-surface-container-low rounded-2xl text-center">
                  <span className="text-[10px] text-on-surface-variant font-medium block">
                    {ratesError || "Silakan lengkapi Provinsi, Kota, dan Kecamatan untuk menghitung tarif ongkir."}
                  </span>
                </div>
              )}

              {!isLoadingRates && biteshipRates.length > 0 && (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {biteshipRates.map((rate, i) => {
                    const isSelected = selectedRate?.courier_code === rate.courier_code && selectedRate?.courier_service_code === rate.courier_service_code;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          setSelectedRate(rate);
                          setShippingFee(rate.price);
                        }}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary-container/5"
                            : "border-outline-variant/30 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-surface-container-low flex items-center justify-center font-extrabold text-[10px] text-primary uppercase shrink-0">
                            {rate.courier_code}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-foreground block">
                              {rate.courier_name.toUpperCase()} - {rate.courier_service_name}
                            </span>
                            <span className="text-[10px] text-outline font-medium block mt-0.5">
                              Estimasi: {rate.duration || `${rate.shipment_duration} hari`} ({rate.description})
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-primary font-mono shrink-0">
                          Rp {rate.price.toLocaleString("id-ID")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Metode Pembayaran */}
          <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-outline-variant/15 bg-surface-container-low/40">
              <h2 className="font-heading font-bold text-sm text-foreground">Metode Pembayaran</h2>
            </div>
            <div className="p-5 space-y-3">
              
              {/* Bank Transfer */}
              <label className="block cursor-pointer group">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "VA"}
                  onChange={() => setPaymentMethod("VA")}
                  className="hidden peer"
                />
                <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-outline-variant/30 peer-checked:border-primary peer-checked:bg-primary-container/5 hover:bg-surface-container-low/30 transition-all">
                  <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[24px]">account_balance</span>
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-foreground">Bank Transfer (VA)</p>
                    <p className="text-[10px] text-outline mt-0.5">BCA, Mandiri, BNI (Auto Check)</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-outline-variant/40 peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </label>

              {/* TOP */}
              <label className={`block ${isLimitInsufficient ? "cursor-not-allowed opacity-55" : "cursor-pointer group"}`}>
                <input
                  type="radio"
                  name="payment"
                  disabled={isLimitInsufficient}
                  checked={paymentMethod === "TOP"}
                  onChange={() => !isLimitInsufficient && setPaymentMethod("TOP")}
                  className="hidden peer"
                />
                <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  isLimitInsufficient
                    ? "border-outline-variant/20 bg-slate-50/50 text-on-surface-variant/40"
                    : "border-outline-variant/30 peer-checked:border-primary peer-checked:bg-primary-container/5 hover:bg-surface-container-low/30"
                }`}>
                  <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-secondary text-[24px]">credit_card</span>
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-foreground">Credit Limit / TOP</p>
                    <p className="text-[10px] text-outline mt-0.5">Sisa Limit: Rp {availableLimit.toLocaleString("id-ID")}</p>
                    {isLimitInsufficient && (
                      <span className="text-[9px] text-error font-extrabold block mt-0.5">Sisa limit tidak mencukupi</span>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isLimitInsufficient ? "border-slate-200 bg-slate-100" : "border-outline-variant/40 peer-checked:border-primary peer-checked:bg-primary"
                  }`}>
                    {!isLimitInsufficient && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </div>
              </label>

              {/* Invoice Billing */}
              <label className={`block ${isLimitInsufficient ? "cursor-not-allowed opacity-55" : "cursor-pointer group"}`}>
                <input
                  type="radio"
                  name="payment"
                  disabled={isLimitInsufficient}
                  checked={paymentMethod === "INVOICE"}
                  onChange={() => !isLimitInsufficient && setPaymentMethod("INVOICE")}
                  className="hidden peer"
                />
                <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  isLimitInsufficient
                    ? "border-outline-variant/20 bg-slate-50/50 text-on-surface-variant/40"
                    : "border-outline-variant/30 peer-checked:border-primary peer-checked:bg-primary-container/5 hover:bg-surface-container-low/30"
                }`}>
                  <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-tertiary text-[24px]">receipt_long</span>
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-foreground">Invoice Billing</p>
                    <p className="text-[10px] text-outline mt-0.5">Tempo TOP {institution.topDays} Hari (Term)</p>
                    {isLimitInsufficient && (
                      <span className="text-[9px] text-error font-extrabold block mt-0.5">Sisa limit tidak mencukupi</span>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isLimitInsufficient ? "border-slate-200 bg-slate-100" : "border-outline-variant/40 peer-checked:border-primary peer-checked:bg-primary"
                  }`}>
                    {!isLimitInsufficient && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                </div>
              </label>

              {/* COD */}
              <label className="block cursor-pointer group">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="hidden peer"
                />
                <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-outline-variant/30 peer-checked:border-primary peer-checked:bg-primary-container/5 hover:bg-surface-container-low/30 transition-all">
                  <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-emerald-600 text-[24px]">payments</span>
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-foreground">Cash on Delivery (COD)</p>
                    <p className="text-[10px] text-outline mt-0.5">Bayar tunai ke kurir saat barang sampai (BiteShip COD)</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-outline-variant/40 peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </label>

              {isLimitInsufficient && (paymentMethod === "TOP" || paymentMethod === "INVOICE") && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex items-start gap-2.5 shadow-sm font-sans mt-3">
                  <span className="material-symbols-outlined text-amber-600 shrink-0 text-[18px]">info</span>
                  <div className="text-[10px] leading-relaxed">
                    <span className="font-extrabold block mb-0.5">Sisa Limit Kredit Tidak Mencukupi</span>
                    Total belanja Anda (**Rp {totalBilling.toLocaleString("id-ID")}**) melebihi sisa limit kredit Anda (**Rp {availableLimit.toLocaleString("id-ID")}**). Metode pembayaran tempo otomatis dikunci. Silakan gunakan metode **Bank Transfer (Virtual Account)** atau **COD** untuk menyelesaikan transaksi ini.
                  </div>
                </div>
              )}

              {isLimitInsufficient && (paymentMethod === "VA" || paymentMethod === "COD") && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-start gap-2.5 shadow-sm font-sans mt-3">
                  <span className="material-symbols-outlined text-emerald-600 shrink-0 text-[18px]">verified</span>
                  <div className="text-[10px] leading-relaxed">
                    <span className="font-extrabold block mb-0.5 text-emerald-800">Bypass Limit Kredit Aktif</span>
                    Metode pembayaran **{paymentMethod === "VA" ? "Bank Transfer (Virtual Account)" : "Cash on Delivery (COD)"}** tidak menggunakan limit kredit Anda. Anda dapat melanjutkan pemesanan ini secara normal tanpa terblokir.
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Order Totals Summary */}
          <div className="bg-surface-container-low/60 rounded-3xl p-6 border border-outline-variant/30 space-y-5 shadow-sm text-xs">
            <h3 className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal</span>
                <span className="text-foreground font-bold font-mono">Rp {cartTotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>VAT (PPN 11%)</span>
                <span className="text-foreground font-bold font-mono">Rp {vatAmount.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Biaya Pengiriman (Asuransi)</span>
                <span className="text-foreground font-bold font-mono">
                  Rp {shippingFee.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-end">
                <span className="text-sm font-heading font-bold text-foreground">Total Tagihan</span>
                <span className="text-xl font-extrabold text-primary font-mono">
                  Rp {totalBilling.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={() => handleCheckout(consolidatedAddress)}
                disabled={isSubmittingOrder || !hasSigned || !isShippingFormValid}
                className={`w-full py-4 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-[0.98] cursor-pointer ${
                  !hasSigned || isSubmittingOrder || !isShippingFormValid
                    ? "bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed shadow-none border border-outline-variant/20"
                    : "bg-primary text-white hover:bg-primary/95 shadow-primary/10"
                }`}
              >
                <span>{isSubmittingOrder ? "Memproses Order..." : "Konfirmasi & Bayar"}</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[16px] text-white">arrow_forward_ios</span>
              </button>

              {!isShippingFormValid && (
                <p className="text-[9px] text-error font-extrabold text-center mt-2.5 animate-pulse">
                  ⚠️ SILAKAN LENGKAPI LOKASI PENGIRIMAN &amp; KONTAK
                </p>
              )}

              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="w-full py-2.5 mt-2 bg-transparent hover:bg-surface-container-high/40 text-on-surface-variant hover:text-foreground rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Kembali Ke Belanja
              </button>
              <p className="text-[9px] text-center text-outline mt-4 leading-relaxed">
                Transaksi Terenkripsi Aman. Semua data diproses mematuhi standar keamanan distribusi farmasi CDOB.
              </p>
            </div>
          </div>

          {/* Cold Chain Delivery Note */}
          {isColdChain && (
            <div className="bg-secondary-container/15 rounded-2xl p-4 border border-secondary-fixed-dim/30 flex gap-3.5 text-xs text-on-secondary-container">
              <span className="material-symbols-outlined text-secondary text-[20px]">info</span>
              <div>
                <p className="font-bold text-secondary font-heading">Instruksi Pengiriman Rantai Dingin</p>
                <p className="text-[10px] opacity-90 mt-0.5 leading-normal">
                  Pesanan Anda mengandung produk cold-chain (sensitif suhu). Transportasi berpendingin khusus terinsulasi akan diterapkan secara otomatis demi keamanan obat.
                </p>
              </div>
            </div>
          )}

        </aside>

      </div>
    </div>
  );
}
