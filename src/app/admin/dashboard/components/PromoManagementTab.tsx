"use client";

import { useState, useEffect } from "react";
import {
  TicketPercent,
  Plus,
  Copy,
  Trash2,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Calendar,
  Sparkles,
  Search,
  X,
  ChevronDown,
  Globe,
  ShieldAlert,
  Edit,
  Users,
  History,
  TrendingDown,
  Filter,
} from "lucide-react";
import {
  getCoupons,
  getPublishedProductsForPromo,
  createProductPromoCoupon,
  updateProductPromoCoupon,
  toggleCouponStatus,
  deleteCoupon,
  getCouponUsageHistory,
} from "@/app/actions/coupon";

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  isPromo?: boolean;
  promoPrice?: number | null;
  unit: string;
  imageUrl?: string | null;
  category: string;
}

export default function PromoManagementTab() {
  const [publishedProducts, setPublishedProducts] = useState<Product[]>([]);
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [discountType, setDiscountType] = useState<"FIXED_AMOUNT" | "PERCENTAGE">("FIXED_AMOUNT");
  const [promoPriceInput, setPromoPriceInput] = useState<number | "">("");
  const [discountValueInput, setDiscountValueInput] = useState<number | "">("");
  const [maxDiscountInput, setMaxDiscountInput] = useState<number | "">("");
  const [minSpend, setMinSpend] = useState<number | "">(0);
  const [minQuantity, setMinQuantity] = useState<number | "">(0);
  const [usageLimit, setUsageLimit] = useState<number>(50);
  const [perUserLimit, setPerUserLimit] = useState<number>(1);
  const [targetCustomerSegment, setTargetCustomerSegment] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });

  // Combobox Search State
  const [productSearchQuery, setProductSearchQuery] = useState<string>("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState<boolean>(false);

  // Table Filter & Search State
  const [tableSearchQuery, setTableSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SCHEDULED" | "EXPIRED" | "EXHAUSTED">("ALL");

  // Modal State for Usage History & Edit
  const [selectedHistoryCoupon, setSelectedHistoryCoupon] = useState<any | null>(null);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  const showAlert = (type: "success" | "error", text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, cpnRes] = await Promise.all([
        getPublishedProductsForPromo(),
        getCoupons(),
      ]);
      if (prodRes.success && prodRes.products) {
        setPublishedProducts(prodRes.products);
      }
      if (cpnRes.success && cpnRes.coupons) {
        setCouponsList(cpnRes.coupons);
      }
    } catch (err: any) {
      showAlert("error", err.message || "Gagal memuat data promo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSearchProducts = publishedProducts.filter((p) => {
    const q = productSearchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
    );
  });

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    setIsProductDropdownOpen(false);
    setProductSearchQuery("");
    if (prodId) {
      const p = publishedProducts.find((item) => item.id === prodId);
      if (p) {
        setTitle(`Promo Diskon Spesial ${p.name}`);
        const codePrefix = p.name.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "");
        setCode(`PROMO-${codePrefix}-10K`);
        if (p.price > 10000) {
          setPromoPriceInput(p.price - 10000);
          setDiscountValueInput(10000);
        } else {
          setPromoPriceInput(Math.round(p.price * 0.9));
          setDiscountValueInput(10);
        }
      }
    } else {
      setTitle("");
      setCode("");
      setPromoPriceInput("");
      setDiscountValueInput("");
    }
  };

  const handleSubmitPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedProduct = publishedProducts.find((p) => p.id === selectedProductId);
      const scope = selectedProductId ? "PRODUCT" : "GLOBAL";

      const res = await createProductPromoCoupon({
        code,
        title,
        type: discountType,
        scope: scope,
        discountValue: typeof discountValueInput === "number" ? discountValueInput : 0,
        maxDiscount: typeof maxDiscountInput === "number" ? maxDiscountInput : undefined,
        promoPrice: typeof promoPriceInput === "number" ? promoPriceInput : undefined,
        targetProductId: selectedProductId || undefined,
        minSpend: typeof minSpend === "number" ? minSpend : 0,
        minQuantity: typeof minQuantity === "number" ? minQuantity : 0,
        usageLimit: usageLimit,
        perUserLimit: perUserLimit,
        targetCustomerSegment: targetCustomerSegment,
        startDate: startDate,
        expiryDate: expiryDate,
      });

      if (res.success) {
        showAlert("success", res.message || "Promo berhasil diterbitkan!");
        if (res.coupon) {
          const newCouponWithProduct = {
            ...res.coupon,
            targetProduct: selectedProduct || null,
          };
          setCouponsList((prev) => [newCouponWithProduct, ...prev.filter((c) => c.id !== res.coupon.id)]);
        }
        // Reset Form
        setSelectedProductId("");
        setCode("");
        setTitle("");
        setPromoPriceInput("");
        setDiscountValueInput("");
        setMaxDiscountInput("");
        setMinSpend(0);
        setMinQuantity(0);
        await fetchData();
      } else {
        showAlert("error", res.error || "Gagal menerbitkan promo");
      }
    } catch (err: any) {
      showAlert("error", err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await toggleCouponStatus(id, !currentStatus);
      if (res.success) {
        showAlert("success", res.message || "Status promo diperbarui");
        await fetchData();
      } else {
        showAlert("error", res.error || "Gagal mengubah status");
      }
    } catch (e: any) {
      showAlert("error", e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus promo produk ini?")) return;
    try {
      const res = await deleteCoupon(id);
      if (res.success) {
        showAlert("success", res.message || "Promo berhasil dihapus");
        await fetchData();
      } else {
        showAlert("error", res.error || "Gagal menghapus promo");
      }
    } catch (e: any) {
      showAlert("error", e.message);
    }
  };

  const handleOpenHistory = async (coupon: any) => {
    setSelectedHistoryCoupon(coupon);
    setLoadingHistory(true);
    try {
      const res = await getCouponUsageHistory(coupon.code);
      if (res.success) {
        setHistoryOrders(res.orders || []);
      }
    } catch (err: any) {
      showAlert("error", "Gagal memuat riwayat pemakaian");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenEdit = (coupon: any) => {
    setEditingCoupon({
      ...coupon,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    try {
      const res = await updateProductPromoCoupon(editingCoupon.id, {
        title: editingCoupon.title,
        usageLimit: editingCoupon.usageLimit,
        perUserLimit: editingCoupon.perUserLimit,
        minSpend: editingCoupon.minSpend,
        minQuantity: editingCoupon.minQuantity,
        maxDiscount: editingCoupon.maxDiscount,
        startDate: editingCoupon.startDate,
        expiryDate: editingCoupon.expiryDate,
        isActive: editingCoupon.isActive,
      });

      if (res.success) {
        showAlert("success", res.message || "Promo berhasil diperbarui!");
        setEditingCoupon(null);
        await fetchData();
      } else {
        showAlert("error", res.error || "Gagal memperbarui promo");
      }
    } catch (err: any) {
      showAlert("error", err.message || "Terjadi kesalahan saat menyimpan");
    }
  };

  // Calculations for Live Preview & Margin Warning
  const currentSelectedProduct = publishedProducts.find((p) => p.id === selectedProductId);
  const normalPrice = currentSelectedProduct ? currentSelectedProduct.price : 0;
  const computedPromoPrice = typeof promoPriceInput === "number" ? promoPriceInput : normalPrice;
  const estimatedDiscountAmount = normalPrice > 0 ? Math.max(0, normalPrice - computedPromoPrice) : 0;
  const discountPercent = normalPrice > 0 ? Math.round((estimatedDiscountAmount / normalPrice) * 100) : 0;
  const isBelowMarginWarning = normalPrice > 0 && computedPromoPrice < normalPrice * 0.85; // Diskon > 15%

  // Table Filters
  const filteredCouponsList = couponsList.filter((cp) => {
    const today = new Date();
    const isExpired = new Date(cp.expiryDate) < today;
    const isScheduled = new Date(cp.startDate) > today;
    const isExhausted = cp.usedCount >= cp.usageLimit;
    const isActive = cp.isActive && !isExpired && !isScheduled && !isExhausted;

    // Filter by Status Tab
    if (statusFilter === "ACTIVE" && !isActive) return false;
    if (statusFilter === "SCHEDULED" && !isScheduled) return false;
    if (statusFilter === "EXPIRED" && !isExpired) return false;
    if (statusFilter === "EXHAUSTED" && !isExhausted) return false;

    // Search Query Filter
    const q = tableSearchQuery.toLowerCase();
    if (!q) return true;
    const prodName = cp.targetProduct?.name?.toLowerCase() || "";
    const prodCode = cp.targetProduct?.code?.toLowerCase() || "";
    const codeStr = cp.code.toLowerCase();
    const titleStr = cp.title.toLowerCase();
    return prodName.includes(q) || prodCode.includes(q) || codeStr.includes(q) || titleStr.includes(q);
  });

  return (
    <div className="space-y-8 font-sans animate-fadeIn">
      {/* Alert Banner */}
      {alertMessage && (
        <div
          className={`flex items-center gap-3 px-5 py-4 rounded-2xl border text-xs font-bold shadow-xs animate-slideDown ${
            alertMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {alertMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          )}
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-8 shadow-xl border border-white/10">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                <TicketPercent className="w-6 h-6 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-extrabold font-heading tracking-tight">
                Menu Kelola Promo &amp; Kode Voucher B2B / PBF Enterprise
              </h1>
            </div>
            <p className="text-xs text-slate-300 max-w-xl font-medium leading-relaxed">
              Terbitkan diskon promo khusus untuk produk terpublish dengan kendali margin HPP, batasan per mitra, penjadwalan promo, dan cap diskon maksimal.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-xs transition cursor-pointer backdrop-blur-sm shrink-0 self-start md:self-auto"
          >
            Segarkan Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Terbit Promo */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-heading font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Buat Promo Produk Baru
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Atur logika diskon, jadwal campaign, dan syarat kuota mitra secara aman.
            </p>
          </div>

          <form onSubmit={handleSubmitPromo} className="space-y-3.5 text-xs">
            {/* SEARCHABLE AUTOCOMPLETE COMBOBOX */}
            <div className="relative space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] uppercase font-extrabold text-slate-600">
                  Pilih Produk Terpublish Target
                </label>
                {selectedProductId && (
                  <button
                    type="button"
                    onClick={() => handleProductSelect("")}
                    className="text-rose-600 hover:underline text-[9.5px] font-extrabold flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Reset (Voucher Global)
                  </button>
                )}
              </div>

              {selectedProductId && publishedProducts.find((p) => p.id === selectedProductId) ? (
                (() => {
                  const p = publishedProducts.find((item) => item.id === selectedProductId)!;
                  return (
                    <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 p-1 flex items-center justify-center shrink-0">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                          ) : (
                            <Package className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 text-xs truncate">{p.name}</div>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-800">
                            <span className="bg-emerald-200/80 px-1.5 py-0.2 rounded font-bold">{p.code}</span>
                            <span>Rp. {p.price.toLocaleString("id-ID")} / {p.unit}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsProductDropdownOpen(true)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-[10.5px] font-extrabold transition cursor-pointer shrink-0"
                      >
                        Ganti
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cari Produk (Ketik Nama, SKU, atau Kategori)..."
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setIsProductDropdownOpen(true);
                      }}
                      onFocus={() => setIsProductDropdownOpen(true)}
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isProductDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {isProductDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl divide-y divide-slate-100 p-1 font-sans">
                      <button
                        type="button"
                        onClick={() => handleProductSelect("")}
                        className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl flex items-center gap-2.5 transition cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                          <Globe className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs">🌐 Semua Produk (Voucher Global)</div>
                          <div className="text-[10px] text-slate-500">Berlaku untuk potongan total belanja mitra</div>
                        </div>
                      </button>

                      {filteredSearchProducts.length > 0 ? (
                        filteredSearchProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleProductSelect(p.id)}
                            className="w-full text-left p-2.5 hover:bg-emerald-50/80 rounded-xl flex items-center justify-between gap-2.5 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                                ) : (
                                  <Package className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-xs truncate">{p.name}</div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                                  <span className="bg-slate-100 px-1 py-0.2 rounded border border-slate-200 font-extrabold text-slate-700">
                                    {p.code}
                                  </span>
                                  <span>{p.category}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right font-mono shrink-0">
                              <div className="font-black text-emerald-800 text-xs">
                                Rp. {p.price.toLocaleString("id-ID")}
                              </div>
                              <div className="text-[9px] text-slate-400">per {p.unit}</div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-slate-400 italic text-xs">
                          Produk "{productSearchQuery}" tidak ditemukan
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Kode Voucher */}
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                Kode Voucher Promo (Autokapital)
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: PROMO-PARACETAMOL-10K"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
              />
            </div>

            {/* Judul Campaign */}
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                Judul Campaign Promo
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Promo Diskon Paracetamol Box"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Input Harga / Diskon & Cap Maksimal */}
            {selectedProductId ? (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2.5">
                <label className="block text-[10px] uppercase font-extrabold text-emerald-900">
                  Harga Promo Spesial Produk (IDR)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 40000"
                    value={promoPriceInput}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setPromoPriceInput(val);
                      if (currentSelectedProduct) {
                        setDiscountValueInput(Math.max(0, currentSelectedProduct.price - val));
                      }
                    }}
                    className="flex-1 px-3.5 py-2 bg-white border border-emerald-300 rounded-xl font-mono font-extrabold text-emerald-900 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  {currentSelectedProduct && (
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      Normal: Rp. {currentSelectedProduct.price.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                      Tipe Diskon
                    </label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="FIXED_AMOUNT">Nominal Rp</option>
                      <option value="PERCENTAGE">Persentase %</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                      Nilai Diskon
                    </label>
                    <input
                      type="number"
                      required
                      placeholder={discountType === "PERCENTAGE" ? "10" : "50000"}
                      value={discountValueInput}
                      onChange={(e) => setDiscountValueInput(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-800 outline-none"
                    />
                  </div>
                </div>

                {/* MAKSIMAL POTONGAN (MAX DISCOUNT CAP) JIKA % DISKON */}
                {discountType === "PERCENTAGE" && (
                  <div>
                    <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1 flex items-center gap-1">
                      <span>Maksimal Potongan (Cap Rp)</span>
                      <span className="text-[9px] text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 50000 (Kosongkan jika tanpa batas)"
                      value={maxDiscountInput}
                      onChange={(e) => setMaxDiscountInput(parseFloat(e.target.value) || "")}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* LIVE PREVIEW HARGA & WARNING HPP CARD */}
            {selectedProductId && currentSelectedProduct && (
              <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all ${
                isBelowMarginWarning
                  ? "bg-amber-50/90 border-amber-300 text-amber-900"
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1 text-[11px]">
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                    Live Preview Diskon Unit:
                  </span>
                  <span className="font-mono text-emerald-700 font-extrabold">
                    {discountPercent}% OFF (Hemat Rp. {estimatedDiscountAmount.toLocaleString("id-ID")})
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span>Estimasi Harga Net / Unit:</span>
                  <span className="font-black text-slate-900">
                    Rp. {computedPromoPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                {isBelowMarginWarning && (
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] font-bold text-amber-800 border-t border-amber-200">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Warning HPP: Diskon melebihi 15%, pastikan margin keuntungan PBF tetap terjaga!</span>
                  </div>
                )}
              </div>
            )}

            {/* Min Spend & Min Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                  Min. Belanja (Rp)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={minSpend}
                  onChange={(e) => setMinSpend(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                  Min. Qty Pembelian (Unit)
                </label>
                <input
                  type="number"
                  placeholder="0 (Bebas)"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Kuota Total & Limit Per Mitra */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                  Kuota Total Promo
                </label>
                <input
                  type="number"
                  required
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                  Limit per Akun Mitra
                </label>
                <input
                  type="number"
                  required
                  placeholder="1"
                  value={perUserLimit}
                  onChange={(e) => setPerUserLimit(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 outline-none"
                />
              </div>
            </div>

            {/* Target Segmen Mitra */}
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                Target Segmen Mitra
              </label>
              <select
                value={targetCustomerSegment}
                onChange={(e) => setTargetCustomerSegment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none cursor-pointer"
              >
                <option value="ALL">🌐 Semua Segmen Mitra (Apotek, Klinik, RS)</option>
                <option value="APOTEK">💊 Khusus Segmen Apotek</option>
                <option value="KLINIK_RS">🏥 Khusus Klinik &amp; Rumah Sakit</option>
                <option value="NEW_PARTNER">✨ Khusus Mitra Baru</option>
              </select>
            </div>

            {/* Tanggal Mulai & Expired Promo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                  Tanggal Mulai (Start)
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1 flex items-center justify-between">
                  <span>Tanggal Expired</span>
                  <span className="text-rose-600 text-[9px] font-extrabold">*Wajib</span>
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? "Memproses..." : "Terbitkan Promo & Voucher"}</span>
            </button>
          </form>
        </div>

        {/* Tabel Daftar Promo & Controls */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                Daftar Promo Produk B2B ({filteredCouponsList.length})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Monitoring status kampanye, riwayat pemakaian mitra, dan kendali keaktifan voucher.
              </p>
            </div>

            {/* LIVE SEARCH BAR TABEL */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari Voucher / SKU..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* FILTER TABS STATUS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold border-b border-slate-100">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                statusFilter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua ({couponsList.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                statusFilter === "ACTIVE" ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setStatusFilter("SCHEDULED")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                statusFilter === "SCHEDULED" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              Scheduled (Akan Datang)
            </button>
            <button
              onClick={() => setStatusFilter("EXHAUSTED")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                statusFilter === "EXHAUSTED" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              Kuota Habis
            </button>
            <button
              onClick={() => setStatusFilter("EXPIRED")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                statusFilter === "EXPIRED" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              Kedaluwarsa
            </button>
          </div>

          {/* TABEL DATA PROMO */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">Produk Target &amp; Segmen</th>
                  <th className="py-3 px-3">Kode Voucher</th>
                  <th className="py-3 px-3">Harga &amp; Diskon</th>
                  <th className="py-3 px-3">Kuota &amp; Limit</th>
                  <th className="py-3 px-3">Periode Expired</th>
                  <th className="py-3 px-3 text-right">Aksi &amp; Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                      Memuat data promo...
                    </td>
                  </tr>
                ) : filteredCouponsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                      Tidak ada promo yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredCouponsList.map((cp) => {
                    const today = new Date();
                    const isExpired = new Date(cp.expiryDate) < today;
                    const isScheduled = new Date(cp.startDate) > today;
                    const isExhausted = cp.usedCount >= cp.usageLimit;

                    let statusBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    let statusLabel = "Aktif";
                    if (isScheduled) {
                      statusBadgeClass = "bg-blue-50 text-blue-700 border-blue-200";
                      statusLabel = "Scheduled";
                    } else if (isExhausted) {
                      statusBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                      statusLabel = "Kuota Habis";
                    } else if (isExpired) {
                      statusBadgeClass = "bg-rose-50 text-rose-700 border-rose-200";
                      statusLabel = "Expired";
                    } else if (!cp.isActive) {
                      statusBadgeClass = "bg-slate-100 text-slate-500 border-slate-200";
                      statusLabel = "Non-Aktif";
                    }

                    return (
                      <tr key={cp.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Produk Target */}
                        <td className="py-3.5 px-3">
                          {cp.targetProduct ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                                {cp.targetProduct.imageUrl ? (
                                  <img src={cp.targetProduct.imageUrl} alt={cp.targetProduct.name} className="object-contain w-full h-full" />
                                ) : (
                                  <Package className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate max-w-[140px]">{cp.targetProduct.name}</div>
                                <div className="text-[9.5px] text-slate-400 font-mono">{cp.targetProduct.code}</div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-[9.5px]">
                                Global (Semua Produk)
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[140px]">{cp.title}</div>
                            </div>
                          )}
                          <div className="mt-1">
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              Target: {cp.targetCustomerSegment === "APOTEK" ? "💊 Apotek" : cp.targetCustomerSegment === "KLINIK_RS" ? "🏥 Klinik/RS" : cp.targetCustomerSegment === "NEW_PARTNER" ? "✨ Mitra Baru" : "🌐 Semua"}
                            </span>
                          </div>
                        </td>

                        {/* Kode Voucher */}
                        <td className="py-3.5 px-3 font-mono">
                          <div className="flex items-center gap-1">
                            <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-xs">
                              {cp.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cp.code);
                                alert(`Kode "${cp.code}" disalin!`);
                              }}
                              className="text-slate-400 hover:text-emerald-700 cursor-pointer"
                              title="Salin Kode"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Harga Promo */}
                        <td className="py-3.5 px-3 font-mono">
                          {cp.targetProduct ? (
                            <div>
                              <span className="line-through text-slate-400 text-[10px] block leading-none">
                                Rp. {cp.targetProduct.price.toLocaleString("id-ID")}
                              </span>
                              <span className="font-black text-emerald-800 text-xs">
                                Rp. {(cp.targetProduct.price - cp.discountValue).toLocaleString("id-ID")}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold text-emerald-700">
                                {cp.type === "PERCENTAGE" ? `${cp.discountValue}% OFF` : `Diskon Rp. ${cp.discountValue.toLocaleString("id-ID")}`}
                              </span>
                              {cp.maxDiscount && (
                                <div className="text-[9px] text-slate-400">
                                  Cap Maks: Rp. {cp.maxDiscount.toLocaleString("id-ID")}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Kuota & Limit */}
                        <td className="py-3.5 px-3 font-mono text-slate-700">
                          <div>
                            <span className="font-bold text-slate-900">{cp.usedCount}</span> / {cp.usageLimit} Total
                          </div>
                          <div className="text-[9.5px] text-slate-400">
                            Limit: {cp.perUserLimit || 1}x / Mitra
                          </div>
                        </td>

                        {/* Status & Expired */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <button
                              type="button"
                              onClick={() => handleToggle(cp.id, cp.isActive)}
                              disabled={isExpired || isExhausted}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${statusBadgeClass}`}
                            >
                              {statusLabel}
                            </button>
                            <div className="text-[9.5px] text-slate-500 font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(cp.expiryDate).toLocaleDateString("id-ID")}
                            </div>
                          </div>
                        </td>

                        {/* Aksi & Log Pemakaian */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenHistory(cp)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Riwayat Pemakaian Mitra"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cp)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Edit Promo"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(cp.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Promo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: RIWAYAT PEMAKAIAN VOUCHER OLEH MITRA */}
      {selectedHistoryCoupon && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm font-sans animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-extrabold text-slate-900">
                    Log Pemakaian Voucher: <span className="font-mono text-emerald-700">{selectedHistoryCoupon.code}</span>
                  </h3>
                  <p className="text-[10.5px] text-slate-500">{selectedHistoryCoupon.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryCoupon(null)}
                className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer font-bold"
              >
                Tutup
              </button>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">No. Pesanan SP</th>
                    <th className="py-2.5 px-3">Nama Instansi / Mitra</th>
                    <th className="py-2.5 px-3">Tanggal Transaksi</th>
                    <th className="py-2.5 px-3 text-right">Potongan Diskon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        Memuat riwayat pemakaian...
                      </td>
                    </tr>
                  ) : historyOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        Belum ada mitra yang mengklaim voucher ini.
                      </td>
                    </tr>
                  ) : (
                    historyOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{ord.institution?.name}</div>
                          <div className="text-[9.5px] text-slate-400">{ord.institution?.type} - {ord.institution?.address}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {new Date(ord.createdAt).toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-3 font-mono font-extrabold text-emerald-700 text-right">
                          Rp. {ord.couponDiscount.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedHistoryCoupon(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PROMO */}
      {editingCoupon && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm font-sans animate-fadeIn">
          <form
            onSubmit={handleSaveEdit}
            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-heading font-extrabold text-slate-900">
                  Edit Promo: <span className="font-mono text-emerald-700">{editingCoupon.code}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer font-bold"
              >
                Batal
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                  Judul Campaign Promo
                </label>
                <input
                  type="text"
                  required
                  value={editingCoupon.title}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                    Kuota Total Promo
                  </label>
                  <input
                    type="number"
                    required
                    value={editingCoupon.usageLimit}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, usageLimit: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                    Limit per Akun Mitra
                  </label>
                  <input
                    type="number"
                    required
                    value={editingCoupon.perUserLimit || 1}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, perUserLimit: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                    Min. Belanja (Rp)
                  </label>
                  <input
                    type="number"
                    value={editingCoupon.minSpend || 0}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, minSpend: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                    Min. Qty (Unit)
                  </label>
                  <input
                    type="number"
                    value={editingCoupon.minQuantity || 0}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, minQuantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                    Tanggal Mulai (Start)
                  </label>
                  <input
                    type="date"
                    required
                    value={editingCoupon.startDate}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-600 mb-1">
                    Tanggal Expired
                  </label>
                  <input
                    type="date"
                    required
                    value={editingCoupon.expiryDate}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, expiryDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingCoupon.isActive}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="editIsActive" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Aktifkan Status Promo ini
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs transition cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
