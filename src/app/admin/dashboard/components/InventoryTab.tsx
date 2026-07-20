"use client";

import { useState } from "react";
import { Plus, Trash2, Calendar, Search, Edit2, AlertCircle, Eye, ShieldAlert } from "lucide-react";

interface Batch {
  id: string;
  batchNumber: string;
  expiryDate: Date;
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
  imageUrl: string | null;
  batches: Batch[];
  totalStock: number;
}

interface InventoryTabProps {
  products: Product[];
  today: Date;
  setIsAddingProduct: (val: boolean) => void;
  setSelectedProductForBatch: (product: Product | null) => void;
  handleDeleteProduct: (productId: string) => void;
  handleDeleteBatch: (batchId: string) => void;
  onEditProduct: (product: Product) => void;
}

export default function InventoryTab({
  products,
  today,
  setIsAddingProduct,
  setSelectedProductForBatch,
  handleDeleteProduct,
  handleDeleteBatch,
  onEditProduct,
}: InventoryTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua Kategori");
  const [expiryFilter, setExpiryFilter] = useState("Range Kadaluwarsa");

  // Flatten products and batches into individual table rows
  const tableRows: {
    product: Product;
    batch: Batch | null;
    isFEFO: boolean; // Mark the batch with the earliest expiry for this product
  }[] = [];

  products.forEach((product) => {
    if (product.batches.length === 0) {
      tableRows.push({ product, batch: null, isFEFO: false });
    } else {
      // Find the earliest expiry date batch for FEFO highlighting
      const sortedBatches = [...product.batches].sort(
        (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );
      const earliestBatchId = sortedBatches[0]?.id;

      product.batches.forEach((batch) => {
        tableRows.push({
          product,
          batch,
          isFEFO: batch.id === earliestBatchId && batch.stock > 0,
        });
      });
    }
  });

  // Calculate KPIs
  const totalSKU = products.length;
  
  let criticalStockCount = 0;
  let soonExpiredCount = 0;
  let expiredCount = 0;

  products.forEach((p) => {
    p.batches.forEach((b) => {
      if (b.stock < 100) criticalStockCount++;
      
      const expiry = new Date(b.expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        expiredCount++;
      } else if (diffDays <= 90) {
        soonExpiredCount++;
      }
    });
  });

  // Apply search and dropdown filters
  const filteredRows = tableRows.filter(({ product, batch }) => {
    // 1. Search Query filter
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.manufacturer && product.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (batch && batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // 2. Kategori filter
    if (categoryFilter !== "Semua Kategori") {
      const catLower = categoryFilter.toLowerCase();
      const prodCatLower = product.category.toLowerCase();
      // Partial match for categories like "Obat Bebas" vs "Bebas"
      if (!prodCatLower.includes(catLower) && !catLower.includes(prodCatLower)) return false;
    }

    // 3. Expiry Range filter
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
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-on-surface">Manajemen Produk &amp; Inventaris (FEFO)</h2>
          <p className="text-xs text-on-surface-variant max-w-2xl mt-1">
            Kelola SKU obat, nomor batch, dan pantau masa kedaluwarsa sesuai standar CDOB (Cara Distribusi Obat yang Baik).
          </p>
        </div>
        <button
          onClick={() => setIsAddingProduct(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all text-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKU */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total SKU Aktif</p>
            <h3 className="text-3xl font-heading font-extrabold text-primary mt-2 font-mono">{totalSKU}</h3>
            <div className="flex items-center gap-1 mt-2 text-primary font-bold text-[10px]">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              <span>Aktif di Katalog</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[100px]">inventory</span>
          </div>
        </div>

        {/* Stok Kritis */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Stok Kritis (Batch)</p>
            <h3 className="text-3xl font-heading font-extrabold text-secondary mt-2 font-mono">{criticalStockCount}</h3>
            <div className="flex items-center gap-1 mt-2 text-secondary font-bold text-[10px]">
              <span className="material-symbols-outlined text-xs">warning</span>
              <span>Stock &lt; 100 Unit</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[100px]">report_problem</span>
          </div>
        </div>

        {/* Mendekati Kadaluwarsa */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Mendekati Kadaluwarsa</p>
            <h3 className="text-3xl font-heading font-extrabold text-amber-500 mt-2 font-mono">{soonExpiredCount}</h3>
            <div className="flex items-center gap-1 mt-2 text-amber-500 font-bold text-[10px]">
              <span className="material-symbols-outlined text-xs">event_busy</span>
              <span>&lt; 3 Bulan sisa</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[100px]">schedule</span>
          </div>
        </div>

        {/* Urgent Kadaluwarsa */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Batch Kadaluwarsa</p>
            <h3 className="text-3xl font-heading font-extrabold text-error mt-2 font-mono">{expiredCount}</h3>
            <div className="flex items-center gap-1 mt-2 text-error font-bold text-[10px]">
              <span className="material-symbols-outlined text-xs">dangerous</span>
              <span>Tindakan segera diperlukan</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[100px]">error</span>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-4 bg-surface-container-low/30">
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/70 w-4 h-4" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-xs focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground"
                placeholder="Cari SKU, Nama Produk, atau Batch..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none bg-surface-container-low border-none rounded-xl px-3 py-2 pr-8 text-xs font-bold text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                >
                  <option value="Semua Kategori">Semua Kategori</option>
                  <option value="Bebas">Obat Bebas</option>
                  <option value="Keras">Obat Keras</option>
                  <option value="Psikotropika">Psikotropika</option>
                </select>
              </div>
              <div className="relative">
                <select
                  value={expiryFilter}
                  onChange={(e) => setExpiryFilter(e.target.value)}
                  className="appearance-none bg-surface-container-low border-none rounded-xl px-3 py-2 pr-8 text-xs font-bold text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                >
                  <option value="Range Kadaluwarsa">Range Kadaluwarsa</option>
                  <option value="Sudah Kadaluwarsa">Sudah Kadaluwarsa</option>
                  <option value="< 3 Bulan">&lt; 3 Bulan</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button 
              onClick={() => alert("Membuka penyaringan lanjutan...")}
              className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-low text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-colors cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              <span>Filter</span>
            </button>
            <div className="w-[1px] h-6 bg-outline-variant/20 mx-1"></div>
            <button 
              onClick={() => alert("Mengunduh laporan stok dalam format Excel...")}
              className="p-2 text-on-surface-variant hover:bg-surface-variant/50 rounded-xl transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low/50 text-on-surface-variant border-b border-outline-variant/20 font-bold">
                <th className="px-6 py-4">Produk &amp; SKU</th>
                <th className="px-6 py-4 text-center">Kategori</th>
                <th className="px-6 py-4">No. Batch</th>
                <th className="px-6 py-4">Exp. Date</th>
                <th className="px-6 py-4">Sisa Stok</th>
                <th className="px-6 py-4">Satuan</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
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

                // Determine category color badge
                let catBadgeClass = "bg-emerald-50 text-primary border border-emerald-200";
                if (product.category.includes("Keras")) {
                  catBadgeClass = "bg-orange-50 text-orange-700 border border-orange-200";
                } else if (product.category.includes("Psikotropika")) {
                  catBadgeClass = "bg-blue-50 text-blue-700 border border-blue-200";
                }

                return (
                  <tr 
                    key={batch ? batch.id : `no-batch-${product.id}`} 
                    className={`hover:bg-primary/5 transition-colors group relative ${isFEFO ? "bg-primary/5 font-medium" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-outline-variant/20 bg-slate-50 ${
                          isExpired ? "bg-red-50 text-error border-red-200" : ""
                        }`}>
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="max-h-full max-w-full object-contain" />
                          ) : (
                            <span className="material-symbols-outlined text-[18px] text-primary">
                              {isExpired ? "report" : "medication"}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-bold text-foreground">{product.name}</span>
                            {isFEFO && (
                              <span className="bg-primary text-white text-[8px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide">FEFO</span>
                            )}
                          </div>
                          <p className="text-[10px] text-on-surface-variant font-mono">
                            SKU: {product.code} | Pabrikan: <span className="font-sans font-semibold text-primary">{product.manufacturer}</span>
                          </p>
                        </div>
                      </div>
                      {isFEFO && <div className="absolute left-0 top-0 h-full w-1 bg-primary"></div>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${catBadgeClass}`}>
                        {product.category.replace("Obat ", "")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {batch ? (
                        <span className="font-mono text-on-surface-variant bg-surface-variant/40 px-2 py-0.5 rounded font-bold">{batch.batchNumber}</span>
                      ) : (
                        <span className="text-outline italic">KOSONG</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {batch ? (
                        <div className="flex flex-col">
                          <span className={`font-bold ${isExpired || isSoonExpired ? "text-error" : "text-on-surface-variant"}`}>
                            {new Date(batch.expiryDate).toLocaleDateString("id-ID")}
                          </span>
                          {isExpired && (
                            <span className="text-[8px] bg-error text-white font-extrabold px-1 rounded w-fit mt-0.5 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px] text-white">warning</span>
                              KADALUWARSA
                            </span>
                          )}
                          {isSoonExpired && (
                            <span className="text-[8px] text-error font-bold italic mt-0.5">Mendekati ({Math.ceil(diffDays / 30)} bln)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-outline">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {batch ? (
                        <div className="flex flex-col gap-1">
                          <span className={`font-bold font-mono text-sm ${isExpired ? "text-error" : "text-foreground"}`}>
                            {batch.stock.toLocaleString("id-ID")}
                          </span>
                          {batch.stock < 100 && batch.stock > 0 && (
                            <div className="w-16 h-1 bg-surface-variant rounded-full overflow-hidden">
                              <div className="h-full bg-secondary" style={{ width: `${(batch.stock / 100) * 100}%` }}></div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-error font-bold font-mono">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant font-bold">{product.unit}</td>
                    <td className="px-6 py-4 font-bold font-mono text-foreground">Rp {product.price.toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If Expired, show Karantina button, else normal actions */}
                        {isExpired ? (
                          <button
                            type="button"
                            onClick={() => batch && handleDeleteBatch(batch.id)}
                            className="bg-error text-white px-3 py-1 rounded-xl text-[10px] font-bold hover:bg-error/95 cursor-pointer shadow-sm shadow-error/15"
                          >
                            Karantina
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductForBatch(product);
                              }}
                              className="p-1 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                              title="Tambah Batch Stok"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditProduct(product)}
                              className="p-1 text-on-surface-variant hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Obat"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1 text-error hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

        {/* Table Footer / Pagination info */}
        <div className="p-4 border-t border-outline-variant/20 flex items-center justify-between text-xs bg-surface-container-low/20">
          <p className="font-medium text-on-surface-variant">
            Menampilkan <span className="text-on-surface font-extrabold">{filteredRows.length}</span> baris sediaan obat
          </p>
          <div className="flex items-center gap-1 font-bold">
            <button className="p-1.5 hover:bg-surface-container-low rounded-lg disabled:opacity-20" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button className="w-7 h-7 flex items-center justify-center bg-primary text-white rounded-lg">1</button>
            <button className="p-1.5 hover:bg-surface-container-low rounded-lg disabled:opacity-20" disabled>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Standar CDOB Disclaimer Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-primary/5 p-5 rounded-2xl border border-primary/15 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">assignment_turned_in</span>
          <div>
            <h4 className="font-extrabold text-primary text-xs mb-1">Standar Kepatuhan CDOB BPOM</h4>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Sistem otomatis menerapkan prinsip FEFO (First-Expired, First-Out). Sediaan obat dengan tanggal kadaluwarsa terdekat diprioritaskan untuk pemenuhan pesanan secara sistematis oleh sistem logistik.
            </p>
          </div>
        </div>
        <div className="bg-surface-container-high/40 p-5 rounded-2xl border border-outline-variant/20 flex items-start gap-3">
          <span className="material-symbols-outlined text-on-surface-variant shrink-0 mt-0.5">update</span>
          <div>
            <h4 className="font-extrabold text-on-surface-variant text-xs mb-1">Audit Log Sinkronisasi</h4>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Inventori gudang obat sinkron 100% dengan database batch pengadaan PBF GroovyCare. Seluruh mutasi stok tercatat dalam audit trail sistem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
