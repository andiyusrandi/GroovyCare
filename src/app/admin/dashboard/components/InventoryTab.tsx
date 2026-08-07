"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Edit2, Trash2, LayoutGrid, List, X } from "lucide-react";

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
  
  // Default Operational View set to "table" (List View)
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  
  // ED Warning Engine Banner Collapsible state
  const [isEdBannerDismissed, setIsEdBannerDismissed] = useState(false);

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
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              CDOB &amp; FEFO Synchronized Live
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
            Manajemen Produk &amp; Inventaris <span className="text-emerald-700 font-mono">(FEFO)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl leading-relaxed">
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
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total SKU Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">inventory_2</span>
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-heading font-black text-slate-900 font-mono tracking-tight">{totalSKU}</h3>
            <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-xs">verified</span>
              <span>Aktif di Katalog Mitra</span>
            </p>
          </div>
        </div>

        {/* Stok Kritis */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Stok Kritis (&lt;100 Unit)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">warning</span>
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-heading font-black text-amber-600 font-mono tracking-tight">{criticalStockCount}</h3>
            <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-xs">production_quantity_limits</span>
              <span>Perlu Refill Stok Batch</span>
            </p>
          </div>
        </div>

        {/* Mendekati Kadaluwarsa */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Mendekati Expired</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">hourglass_bottom</span>
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-heading font-black text-purple-700 font-mono tracking-tight">{soonExpiredCount}</h3>
            <p className="text-[10px] font-bold text-purple-700 flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-xs">schedule</span>
              <span>&lt; 3 Bulan (Priority FEFO)</span>
            </p>
          </div>
        </div>

        {/* Urgent Kadaluwarsa */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-rose-500/30 transition-all duration-300 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Batch Kadaluwarsa</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60 flex items-center justify-center">
              <span className="material-symbols-outlined text-base">dangerous</span>
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-heading font-black text-rose-600 font-mono tracking-tight">{expiredCount}</h3>
            <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-xs">block</span>
              <span>Karantina Obat Segera</span>
            </p>
          </div>
        </div>
      </div>

      {/* Auto-Quarantine ED Alert Banner (Compact Horizontal Bar, Collapsible) */}
      {!isEdBannerDismissed && (soonExpiredCount > 0 || expiredCount > 0) && onQuarantineNearExpiry && (
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-3 sm:px-5 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/30">
              <span className="material-symbols-outlined text-lg">shield_locked</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-heading font-extrabold text-white">ED Warning Engine:</span>
              <span className="bg-purple-500/30 text-purple-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-purple-400/30">
                {soonExpiredCount} &lt;90 hari • {expiredCount} Expired
              </span>
              <span className="text-purple-200/80 text-[11px] hidden lg:inline">
                Karantina otomatis untuk kepatuhan BPOM RI.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => onQuarantineNearExpiry(60)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 border-none flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">do_not_disturb_on</span>
              <span>Auto-Karantina (&lt; 60 Hari)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEdBannerDismissed(true)}
              className="p-1 text-purple-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Tutup Peringatan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Table & Bento Section */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        
        {/* Control Bar: Search & Filters */}
        <div className="p-4 border-b border-slate-150 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-1 items-center gap-3 min-w-0 flex-wrap">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/90 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-slate-800 placeholder:text-slate-400 font-medium shadow-2xs"
                placeholder="Cari SKU, Nama Obat, Batch, Zat Aktif, atau Pabrik..."
                type="text"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200/90 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer shadow-2xs"
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
                className="bg-white border border-slate-200/90 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer shadow-2xs"
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
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border-none ${
                  viewMode === "table" 
                    ? "bg-white text-emerald-800 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
                title="Tampilan Tabel Data (Default Operasional)"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
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
            </div>
          </div>
        </div>

        {/* Content View: Default Table or High-Density Bento Grid */}
        {viewMode === "table" ? (
          /* Modern High-Density Data Table View (Default Operational View) */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">
                  <th className="px-5 py-3">Produk &amp; SKU</th>
                  <th className="px-4 py-3 text-center">Kategori</th>
                  <th className="px-4 py-3">No. Batch</th>
                  <th className="px-4 py-3">Exp. Date</th>
                  <th className="px-4 py-3">Sisa Stok</th>
                  <th className="px-4 py-3">Satuan</th>
                  <th className="px-4 py-3">Harga HET</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
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
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-slate-200/80 bg-slate-50 ${
                            isExpired ? "bg-rose-50 text-rose-600 border-rose-200" : ""
                          }`}>
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="max-h-full max-w-full object-contain p-1" />
                            ) : (
                              <span className="material-symbols-outlined text-[18px] text-emerald-700">
                                {isExpired ? "report" : "medication"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-extrabold text-slate-900 text-xs">{product.name}</span>
                              {isFEFO && (
                                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-2xs flex items-center gap-1">
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
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] uppercase ${catBadgeClass}`}>
                          {product.category.replace("Obat ", "")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {batch ? (
                          <span className="font-mono text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg font-bold">{batch.batchNumber}</span>
                        ) : (
                          <span className="text-slate-400 italic font-mono text-[10px]">BELUM ADA BATCH</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {batch ? (
                          <span className={`font-mono text-xs font-bold ${
                            isExpired 
                              ? "text-rose-600 font-black bg-rose-50 px-2 py-0.5 rounded border border-rose-200" 
                              : isSoonExpired 
                              ? "text-amber-700 font-black bg-amber-50 px-2 py-0.5 rounded border border-amber-200" 
                              : "text-slate-800"
                          }`}>
                            {new Date(batch.expiryDate).toLocaleDateString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {batch ? (
                          <span className={`font-mono text-xs font-black ${batch.stock < 100 ? "text-amber-600" : "text-slate-900"}`}>
                            {batch.stock.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="font-mono text-xs font-black text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">{product.unit}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        Rp {product.price.toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isExpired ? (
                            <button
                              type="button"
                              onClick={() => batch && handleDeleteBatch(batch.id)}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">block</span>
                              Karantina
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedProductForBatch(product)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all cursor-pointer border border-emerald-200/80 shadow-2xs active:scale-95"
                                title="Tambah Batch Stok Obat"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditProduct(product)}
                                className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95"
                                title="Edit Data Produk"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer border border-rose-200/80 shadow-2xs active:scale-95"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        ) : (
          /* High-Density 4-Column Bento Cards Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 sm:p-5 bg-slate-50/50">
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
                  className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between p-4 space-y-3 group relative overflow-hidden ${
                    isFEFO 
                      ? "border-emerald-500/60 shadow-xs shadow-emerald-600/5 hover:border-emerald-500" 
                      : "border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300"
                  }`}
                >
                  {/* Floating FEFO Badge */}
                  {isFEFO && (
                    <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs z-10 flex items-center gap-1">
                      <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                      FEFO Priority
                    </span>
                  )}

                  {/* Header: Image, Title, Category */}
                  <div className="flex items-start gap-2.5 pr-14">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 bg-slate-50 shadow-2xs overflow-hidden ${
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
                    <div className="min-w-0 space-y-0.5">
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-black border uppercase tracking-wider ${catBadgeClass}`}>
                        {product.category.replace("Obat ", "")}
                      </span>
                      <h4 className="font-heading font-extrabold text-slate-900 text-xs leading-snug truncate" title={product.name}>
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium truncate">
                        {product.manufacturer}
                      </p>
                    </div>
                  </div>

                  {/* Meta Specs Box */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 space-y-1 text-[10px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">SKU</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.2 rounded border border-slate-200">{product.code}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Batch</span>
                      <span className="font-mono font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        {batch ? batch.batchNumber : "No Batch"}
                      </span>
                    </div>
                  </div>

                  {/* Expiry & Stock Box */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                      <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">Exp Date</span>
                      <span className={`font-bold block text-[11px] ${isExpired ? "text-rose-600 font-black" : isSoonExpired ? "text-amber-600 font-black" : "text-slate-900"}`}>
                        {batch ? new Date(batch.expiryDate).toLocaleDateString("id-ID") : "-"}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                      <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">Stok</span>
                      <span className={`font-mono font-black text-[11px] block ${isExpired ? "text-rose-600" : "text-slate-900"}`}>
                        {batch ? batch.stock.toLocaleString("id-ID") : 0} <span className="text-[8px] text-slate-400 font-sans font-normal">{product.unit}</span>
                      </span>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="pt-2 border-t border-slate-150 flex items-center justify-between gap-1">
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">HET</span>
                      <span className="font-mono font-black text-slate-900 text-xs">
                        Rp {product.price.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isExpired ? (
                        <button
                          type="button"
                          onClick={() => batch && handleDeleteBatch(batch.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[12px]">block</span>
                          Karantina
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedProductForBatch(product)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all cursor-pointer border border-emerald-200/80 shadow-2xs active:scale-95"
                            title="Tambah Batch Stok Obat"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95"
                            title="Edit Data Produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all cursor-pointer border border-rose-200/80 shadow-2xs active:scale-95"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
