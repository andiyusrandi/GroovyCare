"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Edit2, Trash2, LayoutGrid, List } from "lucide-react";

export interface Batch {
  id: string;
  batchNumber: string;
  expiryDate: string | Date;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  activeIngredient: string;
  price: number;
  category: string;
  description?: string | null;
  unit: string;
  manufacturer: string;
  imageUrl?: string | null;
  totalStock: number;
  batches?: Batch[];
}

interface InventoryTabProps {
  products: any[];
  today: Date;
  setIsAddingProduct: (b: boolean) => void;
  setSelectedProductForBatch: (p: any) => void;
  handleDeleteProduct: (id: string) => void;
  handleDeleteBatch: (id: string) => void;
  onEditProduct: (p: any) => void;
  onQuarantineNearExpiry?: (days?: number) => Promise<void>;
}

export default function InventoryTab({
  products,
  today,
  setIsAddingProduct,
  setSelectedProductForBatch,
  handleDeleteProduct,
  handleDeleteBatch,
  onEditProduct,
  onQuarantineNearExpiry,
}: InventoryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua Kategori");
  const [expiryFilter, setExpiryFilter] = useState("Range Kadaluwarsa");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Flatten products and batches into table rows (1 row = 1 product batch or product with no batch)
  const flattenedData = useMemo(() => {
    const tableRows: { product: Product; batch: Batch | null; isFEFO: boolean }[] = [];

    products.forEach((product) => {
      if (!product.batches || product.batches.length === 0) {
        tableRows.push({ product, batch: null, isFEFO: false });
      } else {
        // Find the earliest expiry date batch for FEFO highlighting
        let earliestBatchId: string | null = null;
        let earliestDate: number = Infinity;

        product.batches.forEach((b: any) => {
          if (b.stock > 0) {
            const time = new Date(b.expiryDate).getTime();
            if (time < earliestDate) {
              earliestDate = time;
              earliestBatchId = b.id;
            }
          }
        });

        product.batches.forEach((batch: any) => {
          tableRows.push({
            product,
            batch,
            isFEFO: batch.id === earliestBatchId && batch.stock > 0,
          });
        });
      }
    });

    return tableRows;
  }, [products]);

  // Statistics calculation
  const totalSKU = products.length;
  let criticalStockCount = 0;
  let soonExpiredCount = 0;
  let expiredCount = 0;

  flattenedData.forEach(({ batch }) => {
    if (batch) {
      if (batch.stock < 100 && batch.stock > 0) criticalStockCount++;
      const expiry = new Date(batch.expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) expiredCount++;
      else if (diffDays <= 90) soonExpiredCount++;
    }
  });

  // Filtered rows
  const filteredRows = flattenedData.filter(({ product, batch }) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = product.name.toLowerCase().includes(q);
      const matchCode = product.code.toLowerCase().includes(q);
      const matchBatch = batch ? batch.batchNumber.toLowerCase().includes(q) : false;
      const matchMfg = product.manufacturer.toLowerCase().includes(q);
      const matchActive = product.activeIngredient.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchBatch && !matchMfg && !matchActive) return false;
    }

    // 2. Category Filter
    if (categoryFilter !== "Semua Kategori") {
      const catLower = product.category.toLowerCase();
      const targetLower = categoryFilter.toLowerCase();
      if (!catLower.includes(targetLower)) return false;
    }

    // 3. Expiry Range Filter
    if (expiryFilter !== "Range Kadaluwarsa") {
      if (!batch) return false;
      const expiry = new Date(batch.expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (expiryFilter === "Sudah Kadaluwarsa" && diffDays > 0) return false;
      if (expiryFilter === "< 3 Bulan" && (diffDays <= 0 || diffDays > 90)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      {/* Page Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              CDOB &amp; FEFO Synchronized Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Manajemen Produk &amp; Inventaris <span className="text-emerald-700 font-mono">(FEFO)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">
            Kelola SKU obat, nomor batch, dan pantau masa kedaluwarsa secara otomatis sesuai kepatuhan standar <strong className="text-slate-800 font-semibold">CDOB (Cara Distribusi Obat yang Baik) BPOM RI</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingProduct(true)}
          className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-xs hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer shrink-0 border border-emerald-800/30 relative z-10"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Tambah Produk Baru</span>
        </button>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-50/40 to-transparent pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKU */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total SKU Aktif</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">inventory_2</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-heading font-black text-slate-900 font-mono tracking-tight">{totalSKU}</h3>
            <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-xs">verified</span>
              <span>Aktif di Katalog Mitra</span>
            </p>
          </div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-emerald-50 rounded-full opacity-40 group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
        </div>

        {/* Stok Kritis */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Stok Kritis (&lt;100 Unit)</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">warning</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-heading font-black text-amber-600 font-mono tracking-tight">{criticalStockCount}</h3>
            <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-xs">production_quantity_limits</span>
              <span>Perlu Refill Stok Batch</span>
            </p>
          </div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-amber-50 rounded-full opacity-40 group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
        </div>

        {/* Mendekati Kadaluwarsa */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Mendekati Expired</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">hourglass_bottom</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-heading font-black text-purple-700 font-mono tracking-tight">{soonExpiredCount}</h3>
            <p className="text-[11px] font-bold text-purple-700 flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-xs">schedule</span>
              <span>&lt; 3 Bulan (Priority FEFO)</span>
            </p>
          </div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-purple-50 rounded-full opacity-40 group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
        </div>

        {/* Urgent Kadaluwarsa */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Batch Kadaluwarsa</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">dangerous</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-heading font-black text-rose-600 font-mono tracking-tight">{expiredCount}</h3>
            <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-xs">block</span>
              <span>Karantina Obat Segera</span>
            </p>
          </div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-rose-50 rounded-full opacity-40 group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
        </div>
      </div>

      {/* Auto-Quarantine ED Alert Banner (BPOM CDOB Engine) */}
      {(soonExpiredCount > 0 || expiredCount > 0) && onQuarantineNearExpiry && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-xl">shield_locked</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-sm text-white">ED Warning Engine BPOM CDOB</h3>
                <span className="bg-purple-500/30 text-purple-200 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-purple-400/30">
                  {soonExpiredCount + expiredCount} Batch Berisiko
                </span>
              </div>
              <p className="text-xs text-purple-200/85 font-medium leading-relaxed max-w-2xl">
                Terdapat <strong className="text-white font-bold">{soonExpiredCount} batch mendekati kadaluarsa (&lt; 90 hari)</strong> dan <strong className="text-rose-300 font-bold">{expiredCount} batch kedaluwarsa</strong>. Gunakan fitur Karantina Otomatis untuk menonaktifkan stok dari katalog belanja pelanggan guna mencegah sanksi BPOM.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onQuarantineNearExpiry(60)}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md active:scale-95 border-none flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">do_not_disturb_on</span>
              <span>Auto-Karantina Obat (&lt; 60 Hari)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table & Bento Section */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        
        {/* Control Bar: Search & Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-150 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-1 items-center gap-3 min-w-0 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-slate-800 placeholder:text-slate-400 font-medium shadow-2xs"
                placeholder="Cari SKU, Nama Obat, Batch, Zat Aktif, atau Pabrik..."
                type="text"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200/90 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer shadow-2xs"
              >
                <option value="Semua Kategori">Semua Kategori Obat</option>
                <option value="Bebas">Obat Bebas (W)</option>
                <option value="Keras">Obat Keras (G)</option>
                <option value="Psikotropika">Psikotropika</option>
                <option value="Cold Chain">Cold Chain</option>
              </select>

              <select
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value)}
                className="bg-white border border-slate-200/90 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer shadow-2xs"
              >
                <option value="Range Kadaluwarsa">Semua Expired Date</option>
                <option value="Sudah Kadaluwarsa">🔴 Sudah Kadaluwarsa</option>
                <option value="< 3 Bulan">⏰ &lt; 3 Bulan (Priority)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold text-slate-500 hidden sm:inline-block">
              <strong className="text-slate-900 font-extrabold">{filteredRows.length}</strong> Baris Sediaan
            </span>

            {/* View Switcher Segmented Button */}
            <div className="flex items-center bg-slate-200/60 p-1 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border-none ${
                  viewMode === "grid" 
                    ? "bg-white text-emerald-800 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
                title="Tampilan Kartu Bento"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bento</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border-none ${
                  viewMode === "table" 
                    ? "bg-white text-emerald-800 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
                title="Tampilan Tabel Data"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content View: Bento Grid or Data Table */}
        {viewMode === "grid" ? (
          /* Bento Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-6 bg-slate-50/50">
            {filteredRows.map(({ product, batch, isFEFO }) => {
              let isExpired = false;
              let isSoonExpired = false;
              let diffDays = 999;

              if (batch) {
                const expiry = new Date(batch.expiryDate);
                const diffTime = expiry.getTime() - today.getTime();
                diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                isExpired = diffDays <= 0;
                isSoonExpired = !isExpired && diffDays <= 90;
              }

              let catBadgeClass = "bg-emerald-50 text-emerald-800 border-emerald-200/80";
              if (product.category.includes("Keras")) {
                catBadgeClass = "bg-rose-50 text-rose-800 border-rose-200/80";
              } else if (product.category.includes("Psikotropika")) {
                catBadgeClass = "bg-purple-50 text-purple-800 border-purple-200/80";
              } else if (product.category.includes("Cold Chain")) {
                catBadgeClass = "bg-cyan-50 text-cyan-800 border-cyan-200/80";
              }

              return (
                <div 
                  key={batch ? batch.id : `grid-${product.id}`} 
                  className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden ${
                    isFEFO 
                      ? "border-emerald-500/50 shadow-md shadow-emerald-600/5 hover:border-emerald-500" 
                      : "border-slate-200/80 shadow-2xs hover:shadow-lg hover:border-slate-300"
                  }`}
                >
                  {/* FEFO Priority Badge Banner */}
                  {isFEFO && (
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white text-[9px] font-extrabold uppercase tracking-wider py-1.5 px-4 flex items-center justify-between shadow-2xs">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-emerald-200">bolt</span>
                        FEFO Priority Batch
                      </span>
                      <span className="text-[8px] bg-white/20 px-2 py-0.5 rounded-md font-black tracking-widest text-emerald-50 border border-white/20">
                        ALOKASI UTAMA
                      </span>
                    </div>
                  )}

                  <div className={`p-5 space-y-4 ${isFEFO ? "pt-2" : ""}`}>
                    {/* Header: Name & Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 bg-slate-50/80 shadow-2xs overflow-hidden ${
                          isExpired ? "bg-rose-50 text-rose-600 border-rose-200" : ""
                        }`}>
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="max-h-full max-w-full object-contain p-1" />
                          ) : (
                            <span className="material-symbols-outlined text-[24px] text-emerald-700">
                              {isExpired ? "report" : "medication"}
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-wider ${catBadgeClass}`}>
                            {product.category.replace("Obat ", "")}
                          </span>
                          <h4 className="font-heading font-extrabold text-slate-900 text-sm leading-snug line-clamp-1" title={product.name}>
                            {product.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-medium truncate max-w-[160px]">
                            {product.manufacturer}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Meta Specs Box */}
                    <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70 space-y-1.5 text-[10px]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Nomor SKU / BPOM</span>
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{product.code}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Nomor Batch Stok</span>
                        <span className="font-mono font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {batch ? batch.batchNumber : "Belum Ada Batch"}
                        </span>
                      </div>
                    </div>

                    {/* Expiry & Stock Progress Box */}
                    <div className="grid grid-cols-2 gap-2 text.xs">
                      <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70 space-y-1">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Exp Date</span>
                        <span className={`font-bold block text-xs ${isExpired ? "text-rose-600 font-black" : isSoonExpired ? "text-amber-600 font-black" : "text-slate-900"}`}>
                          {batch ? new Date(batch.expiryDate).toLocaleDateString("id-ID") : "-"}
                        </span>
                      </div>
                      <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70 space-y-1">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Sisa Stok</span>
                        <span className={`font-mono font-black text-sm block ${isExpired ? "text-rose-600" : "text-slate-900"}`}>
                          {batch ? batch.stock.toLocaleString("id-ID") : 0} <span className="text-[9px] text-slate-400 font-sans font-normal">{product.unit}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-4 bg-slate-50/60 border-t border-slate-150 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Harga Het Pbf</span>
                      <span className="font-mono font-black text-slate-900 text-xs">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isExpired ? (
                        <button
                          type="button"
                          onClick={() => batch && handleDeleteBatch(batch.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">block</span>
                          Karantina
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedProductForBatch(product)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all cursor-pointer border border-emerald-200/80 shadow-2xs active:scale-95"
                            title="Tambah Batch Stok Obat"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditProduct(product)}
                            className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95"
                            title="Edit Data Produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer border border-rose-200/80 shadow-2xs active:scale-95"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Modern Data Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">
                  <th className="px-6 py-4">Produk &amp; SKU</th>
                  <th className="px-6 py-4 text-center">Kategori</th>
                  <th className="px-6 py-4">No. Batch</th>
                  <th className="px-6 py-4">Exp. Date</th>
                  <th className="px-6 py-4">Sisa Stok</th>
                  <th className="px-6 py-4">Satuan</th>
                  <th className="px-6 py-4">Harga HET</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {filteredRows.map(({ product, batch, isFEFO }) => {
                  let isExpired = false;
                  let isSoonExpired = false;
                  let diffDays = 999;

                  if (batch) {
                    const expiry = new Date(batch.expiryDate);
                    const diffTime = expiry.getTime() - today.getTime();
                    diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    isExpired = diffDays <= 0;
                    isSoonExpired = !isExpired && diffDays <= 90;
                  }

                  let catBadgeClass = "bg-emerald-50 text-emerald-800 border border-emerald-200/80";
                  if (product.category.includes("Keras")) {
                    catBadgeClass = "bg-rose-50 text-rose-800 border border-rose-200/80";
                  } else if (product.category.includes("Psikotropika")) {
                    catBadgeClass = "bg-purple-50 text-purple-800 border border-purple-200/80";
                  }

                  return (
                    <tr 
                      key={batch ? batch.id : `no-batch-${product.id}`} 
                      className={`hover:bg-emerald-50/30 transition-colors group relative ${isFEFO ? "bg-emerald-50/20 font-medium" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/80 bg-slate-50 ${
                            isExpired ? "bg-rose-50 text-rose-600 border-rose-200" : ""
                          }`}>
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="max-h-full max-w-full object-contain p-1" />
                            ) : (
                              <span className="material-symbols-outlined text-[20px] text-emerald-700">
                                {isExpired ? "report" : "medication"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-extrabold text-slate-900 text-sm">{product.name}</span>
                              {isFEFO && (
                                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-2xs flex items-center gap-1">
                                  <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                  FEFO Priority
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">
                              SKU: <strong className="text-slate-800 font-bold">{product.code}</strong> | Pabrikan: <span className="font-sans font-bold text-emerald-800">{product.manufacturer}</span>
                            </p>
                          </div>
                        </div>
                        {isFEFO && <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500" />}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[9px] uppercase ${catBadgeClass}`}>
                          {product.category.replace("Obat ", "")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {batch ? (
                          <span className="font-mono text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg font-bold">{batch.batchNumber}</span>
                        ) : (
                          <span className="text-slate-400 italic font-mono text-[10px]">BELUM ADA BATCH</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {batch ? (
                          <div className="flex flex-col">
                            <span className={`font-bold ${isExpired || isSoonExpired ? "text-rose-600 font-black" : "text-slate-900"}`}>
                              {new Date(batch.expiryDate).toLocaleDateString("id-ID")}
                            </span>
                            {isExpired && (
                              <span className="text-[8px] bg-rose-600 text-white font-black px-2 py-0.5 rounded-full w-fit mt-0.5 flex items-center gap-0.5 uppercase tracking-wide">
                                🔴 KADALUWARSA
                              </span>
                            )}
                            {isSoonExpired && (
                              <span className="text-[8px] text-amber-600 font-bold italic mt-0.5">Mendekati ({Math.ceil(diffDays / 30)} bln)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {batch ? (
                          <div className="flex flex-col gap-1">
                            <span className={`font-black font-mono text-sm ${isExpired ? "text-rose-600" : "text-slate-900"}`}>
                              {batch.stock.toLocaleString("id-ID")}
                            </span>
                            {batch.stock < 100 && batch.stock > 0 && (
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(batch.stock / 100) * 100}%` }} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-rose-600 font-black font-mono">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-bold">{product.unit}</td>
                      <td className="px-6 py-4 font-black font-mono text-slate-900">Rp {product.price.toLocaleString("id-ID")}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isExpired ? (
                            <button
                              type="button"
                              onClick={() => batch && handleDeleteBatch(batch.id)}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-black cursor-pointer shadow-xs"
                            >
                              Karantina
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedProductForBatch(product)}
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all cursor-pointer border border-emerald-200/80 shadow-2xs active:scale-95"
                                title="Tambah Batch Stok Obat"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditProduct(product)}
                                className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95"
                                title="Edit Obat"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer border border-rose-200/80 shadow-2xs active:scale-95"
                                title="Hapus Obat"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer / Pagination info */}
        <div className="p-4 sm:p-5 border-t border-slate-150 flex items-center justify-between text-xs bg-slate-50/50">
          <p className="font-medium text-slate-500">
            Menampilkan <span className="text-slate-900 font-extrabold">{filteredRows.length}</span> baris sediaan obat terverifikasi
          </p>
          <div className="flex items-center gap-1 font-bold">
            <button className="p-1.5 text-slate-400 hover:bg-slate-200/60 rounded-xl disabled:opacity-20 cursor-not-allowed" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs">1</button>
            <button className="p-1.5 text-slate-400 hover:bg-slate-200/60 rounded-xl disabled:opacity-20 cursor-not-allowed" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Standar CDOB Disclaimer Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-start gap-4 hover:border-emerald-500/30 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">assignment_turned_in</span>
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-900 text-sm">Standar Kepatuhan CDOB BPOM RI</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem otomatis menerapkan prinsip <strong className="text-slate-900">FEFO (First-Expired, First-Out)</strong>. Sediaan obat dengan tanggal kadaluwarsa terdekat diprioritaskan untuk pemenuhan pesanan secara terstruktur oleh sistem logistik.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-start gap-4 hover:border-blue-500/30 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">update</span>
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-900 text-sm">Audit Trail Mutasi Stok Batch</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Inventori gudang obat terhubung 100% dengan database batch pengadaan PBF GroovyCare. Seluruh mutasi stok dan alokasi pesanan tercatat secara sah dalam log audit sistem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
