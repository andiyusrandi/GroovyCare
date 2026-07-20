"use client";

import { useState } from "react";

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
  imageUrl?: string | null;
  totalStock: number;
  batches?: Batch[];
}

interface ProductCatalogProps {
  products: Product[];
  addToCartWithQty: (product: Product, quantity: number) => void;
  hasCdobWarning: boolean;
  search: string;
  setSearch: (s: string) => void;
}

export default function ProductCatalog({
  products,
  addToCartWithQty,
  hasCdobWarning,
  search,
  setSearch,
}: ProductCatalogProps) {
  // State Local Filters
  const [selectedKategori, setSelectedKategori] = useState<string[]>([]);
  const [selectedManufaktur, setSelectedManufaktur] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"terbaru" | "low-to-high" | "high-to-low">("terbaru");
  const [localQuantities, setLocalQuantities] = useState<{ [key: string]: number }>({});
  const [activeChip, setActiveChip] = useState("All Products");

  const kategoriList = [
    "Analgesik & Antipiretik",
    "Antibiotik",
    "Analgesik & Anti-inflamasi",
    "Antihistamin",
    "Obat Batuk & Pilek",
    "Obat Pencernaan",
    "Obat Kardiovaskular",
    "Obat Antidiabetes",
    "Multivitamin & Suplemen",
    "Obat Kulit"
  ];

  const manufacturersList = [
    "Kalbe Farma",
    "Dexa Medica",
    "Kimia Farma",
    "Sido Muncul",
    "Tempo Scan Pacific",
    "Phapros",
    "Pyridam Farma",
    "Merck Tbk",
    "Indofarma",
    "Darya-Varia Laboratoria Tbk"
  ];

  function getProductManufacturer(p: Product) {
    return p.manufacturer || "Kalbe Farma";
  }

  function getProductGolongan(p: Product) {
    const cat = p.category.toLowerCase();
    if (cat.includes("antibiotik") || p.name.includes("Amoxicillin") || cat.includes("keras")) return "KERAS";
    if (cat.includes("psikotropika") || p.name.includes("Diazepam")) return "PSIKOTROPIKA";
    return "BEBAS";
  }

  function getProductExpiryRange(p: Product) {
    if (!p.batches) return "-";
    const activeBatches = p.batches.filter((b: Batch) => new Date(b.expiryDate) > new Date());
    if (activeBatches.length === 0) return "-";
    const dates = activeBatches.map((b: Batch) => new Date(b.expiryDate));
    const minDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())));
    const format = (d: Date) => d.toLocaleDateString("id-ID", { month: 'short', year: 'numeric' });
    if (format(minDate) === format(maxDate)) return format(minDate);
    return `${format(minDate)} - ${format(maxDate)}`;
  }

  function getProductImageUrl(p: Product) {
    if (p.imageUrl) {
      return p.imageUrl;
    }
    if (p.name.includes("Amoxicillin")) {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuC_kn1IeXJ-CGvx8B_zYcDD-QO8VcOWdPdBp4_PzTEjg9-oQhA0oFowLCHP1X-rsfXuN_tkpFvD5U2TmrFMqsWJhG5_PVO440PJGZwXL_Fmuf72G5I_QLlduwafZk9EnzRWAH5dFe68LPeyS9E_roTw06aMpWEYAoPDhhI4XYJl4gUFZw8YuYtq9kgtlkuCcvL_LYN3p96Nfd_yCCac0OzIo5ZUSJner-JalLCBPI9FQC-hfTPHbgNqjUHJRmTI-S6aU_HAqQQYxYc";
    }
    if (p.name.includes("Paracetamol") || p.name.includes("Sanmol")) {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuB99WpceKH6DI_diHkzqrsDrT-r9ZxFr7JQ7MaDxBVxsr9GIqO0a7z1nVYFLu_046xKvz0Z0mssljcRP3XBl8J9HZ0pr4NVLT9sj5BPg3kV-Byhgdu7AtOZifLLQJENHD_F8NCItklW0yZrATgaNY60H1Ph0K5bUW6EDQ3jy4cULRlrhvIghv0nZxfINSuHcDZGJvo9LHOWlxExMj-zw5KkPh27XzY79ZYwNU37nYIoEU-Hz1NJomq8TpGECFes5GOqtZJkS6HIa0c";
    }
    if (p.name.includes("Diazepam")) {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuDaE-Y7aGjZzEn1H0wDijF9KmlsG5hVCF7Po8TIm63aqK_0t-qUkRol5zknOCK5eH5efkHyfzhgB1qN1-HFtDb0In4yynw286u431vns8oP6Tifxl1Zt1FFFPJmgjW5N95j2Hky0YumQiGxKB-CP_thWrvdsi0AZQIlegiZx01vfbT0cbkj--svrpDbQlxn7Ytd_olnxbXDQ365tOHuDpVHlcjY6n07azz85sJ3iuwIASSSBcUBhicN1hN0tst5QEo_T0QUbXN1RcM";
    }
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwWGNG9klmFlTxE7qRJlM1a7CWQA41HcodSrxAo5yyi2kDDxkKfVY-ZKWSidodMppE_pXoP_mQCrcx9gRPdHjb967dBVWUoFL5AFRR5c_Jl2dQgOsaFvIFY5EDsB4KhW6Yp97g7uZJaWqjHlKz4J8OY4vHoN93-nWI0lZZOj7DhkS8ZaO6mCejJMLHI-yHbtaiqlkdO0f2skoMG2UQD7cf0ywd87rynYVJHts51V9wTivLcGooleoOrenqnrUzra16cONC2_49Y";
  }

  function resetFilters() {
    setSelectedKategori([]);
    setSelectedManufaktur([]);
    setMinPrice("");
    setMaxPrice("");
    setSearch("");
  }

  const filteredProducts = products.filter((p) => {
    const query = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(query) ||
      p.activeIngredient.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query);
    if (!matchesSearch) return false;

    if (selectedKategori.length > 0) {
      if (!selectedKategori.includes(p.category)) return false;
    }

    if (selectedManufaktur.length > 0) {
      const mfg = getProductManufacturer(p);
      if (!selectedManufaktur.includes(mfg)) return false;
    }

    if (minPrice !== "" && p.price < minPrice) return false;
    if (maxPrice !== "" && p.price > maxPrice) return false;

    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "low-to-high") return a.price - b.price;
    if (sortBy === "high-to-low") return b.price - a.price;
    return 0;
  });

  // Mobile Chip Filtering
  const chips = [
    { label: "All Products", filter: () => true },
    { label: "Ethical", filter: (p: Product) => getProductGolongan(p) === "KERAS" || getProductGolongan(p) === "PSIKOTROPIKA" },
    { label: "OTC", filter: (p: Product) => getProductGolongan(p) === "BEBAS" },
    { label: "Medical Devices", filter: (p: Product) => p.category.toLowerCase().includes("alat") || p.category.toLowerCase().includes("device") || p.manufacturer.toLowerCase().includes("healthtech") },
    { label: "Cold Chain", filter: (p: Product) => p.name.toLowerCase().includes("amoxicillin") || p.name.toLowerCase().includes("vaccine") || p.code.toLowerCase().includes("amx") },
    { label: "Vaccines", filter: (p: Product) => p.category.toLowerCase().includes("vaksin") || p.name.toLowerCase().includes("vaccine") },
  ];

  const currentChipObj = chips.find(c => c.label === activeChip) || chips[0];
  const finalFilteredProducts = sortedProducts.filter(currentChipObj.filter);

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW: Filters & Table                                          */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-6">
        {/* Horizontal Filter Bar Card */}
        <div className="bg-white rounded-3xl border border-outline-variant/20 p-5 shadow-sm space-y-4">
          {/* Top line: Header + Reset */}
          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
              Filter Pencarian Produk
            </h3>
            <button
              onClick={resetFilters}
              className="text-xs text-primary hover:underline font-bold cursor-pointer border-none bg-transparent"
            >
              Reset Filter
            </button>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            {/* Kategori Obat */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Kategori Obat</span>
              <select
                value={selectedKategori[0] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedKategori(val ? [val] : []);
                }}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs py-2 px-3 focus:ring-1 focus:ring-primary outline-none cursor-pointer h-9"
              >
                <option value="">Semua Kategori</option>
                {kategoriList.map((kat) => (
                  <option key={kat} value={kat}>{kat}</option>
                ))}
              </select>
            </div>

            {/* Manufaktur */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Manufaktur</span>
              <select
                value={selectedManufaktur[0] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedManufaktur(val ? [val] : []);
                }}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs py-2 px-3 focus:ring-1 focus:ring-primary outline-none cursor-pointer h-9"
              >
                <option value="">Semua Manufaktur</option>
                {manufacturersList.map((mfg) => (
                  <option key={mfg} value={mfg}>{mfg}</option>
                ))}
              </select>
            </div>

            {/* Kisaran Harga */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Kisaran Harga (IDR)</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minPrice || ""}
                  onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Min"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs py-2 px-3 focus:ring-1 focus:ring-primary outline-none h-9"
                />
                <span className="text-outline">-</span>
                <input
                  type="number"
                  value={maxPrice || ""}
                  onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Max"
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs py-2 px-3 focus:ring-1 focus:ring-primary outline-none h-9"
                />
              </div>
            </div>

            {/* Urutkan */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Urutan Harga</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs py-2 px-3 focus:ring-1 focus:ring-primary outline-none cursor-pointer h-9"
              >
                <option value="terbaru">Paling Relevan</option>
                <option value="low-to-high">Harga: Rendah ke Tinggi</option>
                <option value="high-to-low">Harga: Tinggi ke Rendah</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table-Centric Inventory Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-heading font-bold text-base text-foreground">Katalog Produk</h2>
              <p className="text-on-surface-variant text-[10px]">Menampilkan {sortedProducts.length} produk ditemukan</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-outline-variant/20 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-bold">
                    <th className="p-4 w-16 text-center">Img</th>
                    <th className="p-4">Produk</th>
                    <th className="p-4">Zat Aktif</th>
                    <th className="p-4">Stok</th>
                    <th className="p-4">Exp Date Range</th>
                    <th className="p-4">Harga (IDR)</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                  {sortedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-on-surface-variant italic">
                        Tidak ada produk obat yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    sortedProducts.map((p) => {
                      const isOutOfStock = p.totalStock <= 0;
                      const qty = localQuantities[p.id] || 1;
                      const mfg = getProductManufacturer(p);
                      const golongan = getProductGolongan(p);
                      const expRange = getProductExpiryRange(p);
                      const originalPrice = p.price * 1.05;

                      return (
                        <tr key={p.id} className="hover:bg-surface-container-low/20 transition-colors">
                          <td className="p-4">
                            <div className="w-12 h-12 rounded-xl bg-surface-container-low overflow-hidden border border-outline-variant/10 flex items-center justify-center">
                              <img
                                className="w-full h-full object-cover"
                                src={getProductImageUrl(p)}
                                alt={p.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwWGNG9klmFlTxE7qRJlM1a7CWQA41HcodSrxAo5yyi2kDDxkKfVY-ZKWSidodMppE_pXoP_mQCrcx9gRPdHjb967dBVWUoFL5AFRR5c_Jl2dQgOsaFvIFY5EDsB4KhW6Yp97g7uZJaWqjHlKz4J8OY4vHoN93-nWI0lZZOj7DhkS8ZaO6mCejJMLHI-yHbtaiqlkdO0f2skoMG2UQD7cf0ywd87rynYVJHts51V9wTivLcGooleoOrenqnrUzra16cONC2_49Y";
                                }}
                              />
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <h4 className="font-bold text-foreground text-sm">{p.name}</h4>
                              <p className="text-[9px] font-bold text-outline uppercase tracking-wider mt-0.5">{mfg}</p>
                              <div className="flex gap-1.5 mt-1.5">
                                {golongan === "KERAS" && (
                                  <span className="bg-error text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Keras (G)</span>
                                )}
                                {golongan === "BEBAS" && (
                                  <span className="bg-primary-container text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Bebas (W)</span>
                                )}
                                {golongan === "PSIKOTROPIKA" && (
                                  <span className="bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Psikotropika</span>
                                )}
                                {(p.name.includes("Amoxicillin") || p.code.includes("AMX")) && (
                                  <span className="bg-primary-container text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[10px]">ac_unit</span> CC
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-on-surface-variant italic">{p.activeIngredient}</span>
                          </td>
                          <td className="p-4">
                            <div>
                              {isOutOfStock ? (
                                <span className="font-bold text-error flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-error rounded-full animate-pulse"></span>
                                  Habis
                                </span>
                              ) : (
                                <span className="font-bold text-primary flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                                  {p.totalStock} {p.unit.split(" ")[0]}
                                </span>
                              )}
                              <p className="text-[9px] text-outline mt-0.5">{p.unit}</p>
                            </div>
                          </td>
                          <td className="p-4 text-on-surface-variant font-medium">
                            {expRange}
                          </td>
                          <td className="p-4 font-mono">
                            <div>
                              <p className="font-bold text-primary text-sm">Rp {p.price.toLocaleString("id-ID")}</p>
                              <p className="text-[9px] text-outline line-through">Rp {originalPrice.toLocaleString("id-ID")}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <div className="flex items-center border border-outline-variant/40 rounded-xl bg-surface-container-lowest h-8 shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => setLocalQuantities(prev => ({ ...prev, [p.id]: Math.max(1, (prev[p.id] || 1) - 1) }))}
                                  className="px-2.5 h-full text-xs font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={p.totalStock}
                                  value={qty === undefined ? 1 : qty}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === "") {
                                      setLocalQuantities(prev => ({ ...prev, [p.id]: "" as any }));
                                      return;
                                    }
                                    const val = parseInt(raw);
                                    const parsedVal = isNaN(val) ? 1 : Math.max(1, Math.min(p.totalStock, val));
                                    setLocalQuantities(prev => ({ ...prev, [p.id]: parsedVal }));
                                  }}
                                  onBlur={() => {
                                    if (!qty || qty < 1) {
                                      setLocalQuantities(prev => ({ ...prev, [p.id]: 1 }));
                                    }
                                  }}
                                  className="w-10 text-center text-xs font-semibold font-mono bg-transparent border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
                                />
                                <button
                                  type="button"
                                  onClick={() => setLocalQuantities(prev => ({ ...prev, [p.id]: Math.min(p.totalStock, (prev[p.id] || 1) + 1) }))}
                                  className="px-2.5 h-full text-xs font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => addToCartWithQty(p, qty)}
                                disabled={isOutOfStock || hasCdobWarning}
                                className={`p-2 rounded-xl transition-all flex items-center justify-center shadow-sm cursor-pointer border-none ${
                                  isOutOfStock || hasCdobWarning
                                    ? "bg-surface-container-low border border-outline-variant/20 text-on-surface-variant/40 cursor-not-allowed opacity-50 shadow-none"
                                    : "bg-primary text-white hover:bg-primary/95 shadow-md shadow-primary/10"
                                }`}
                              >
                                <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
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
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW: Search, Category Chips & Responsive Product Grid         */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-4 px-2">
        {/* Sticky Search & Chips Container */}
        <div className="space-y-4 bg-surface py-2 sticky top-16 z-25">
          {/* Mobile Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline text-lg">search</span>
            </div>
            <input
              className="w-full h-11 pl-10 pr-4 bg-surface-container-low rounded-xl border border-outline-variant/20 focus:ring-2 focus:ring-primary/20 font-sans text-xs text-on-surface placeholder:text-outline-variant outline-none"
              placeholder="Search medicine, devices..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Chips Scroll */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
            {chips.map((c) => (
              <button
                key={c.label}
                onClick={() => setActiveChip(c.label)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-sans text-[10px] font-bold transition-all cursor-pointer border-none ${
                  activeChip === c.label
                    ? "bg-primary text-white"
                    : "bg-surface-container-highest text-on-surface-variant"
                }`}
              >
                {c.label === "Cold Chain" ? (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">ac_unit</span> Cold Chain
                  </span>
                ) : (
                  c.label
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {finalFilteredProducts.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-on-surface-variant italic text-xs">
              Tidak ada produk obat yang cocok.
            </div>
          ) : (
            finalFilteredProducts.map((p) => {
              const isOutOfStock = p.totalStock <= 0;
              const isLowStock = p.totalStock > 0 && p.totalStock <= 5;
              const mfg = getProductManufacturer(p);
              const isColdChain = p.name.toLowerCase().includes("amoxicillin") || p.name.toLowerCase().includes("vaccine") || p.code.toLowerCase().includes("amx");
              const isNew = p.name.toLowerCase().includes("thermometer") || p.name.toLowerCase().includes("sanmol");
              const isVerified = !isNew;

              return (
                <div 
                  key={p.id} 
                  className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm border border-surface-container-highest flex flex-col group transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                >
                  {/* Visual Image Area */}
                  <div className="relative aspect-square rounded-xl bg-surface-container-low overflow-hidden mb-3 flex items-center justify-center border border-outline-variant/10">
                    <img 
                      className="w-full h-full object-cover mix-blend-multiply opacity-90" 
                      alt={p.name}
                      src={getProductImageUrl(p)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwWGNG9klmFlTxE7qRJlM1a7CWQA41HcodSrxAo5yyi2kDDxkKfVY-ZKWSidodMppE_pXoP_mQCrcx9gRPdHjb967dBVWUoFL5AFRR5c_Jl2dQgOsaFvIFY5EDsB4KhW6Yp97g7uZJaWqjHlKz4J8OY4vHoN93-nWI0lZZOj7DhkS8ZaO6mCejJMLHI-yHbtaiqlkdO0f2skoMG2UQD7cf0ywd87rynYVJHts51V9wTivLcGooleoOrenqnrUzra16cONC2_49Y";
                      }}
                    />
                    
                    {/* Cold Chain Badge (top left) */}
                    {isColdChain && (
                      <div className="absolute top-2 left-2 flex gap-1 z-10">
                        <span className="material-symbols-outlined text-primary text-base bg-white/70 backdrop-blur-sm p-1 rounded-lg">ac_unit</span>
                      </div>
                    )}
                    
                    {/* Status Badge (top right) */}
                    {isVerified ? (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-primary/10 rounded-lg z-10">
                        <p className="text-[8px] font-extrabold text-primary uppercase tracking-tighter">Verified</p>
                      </div>
                    ) : isNew ? (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-secondary-container/30 rounded-lg z-10">
                        <p className="text-[8px] font-extrabold text-secondary uppercase tracking-tighter">New</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Product Details */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-xs text-on-surface line-clamp-1" title={p.name}>
                        {p.name}
                      </h3>
                      <p className="text-[9px] text-outline font-bold uppercase tracking-wider mb-0.5">
                        {mfg}
                      </p>
                      <p className="text-[9px] text-on-surface-variant font-medium mb-2">
                        {p.unit}
                      </p>
                    </div>

                    {/* Stock Status Dot */}
                    <div className="flex items-center gap-1.5 mb-3">
                      {isOutOfStock ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                          <span className="text-[10px] font-bold text-error">Stok Habis</span>
                        </>
                      ) : isLowStock ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
                          <span className="text-[10px] font-bold text-[#f59e0b]">Stok Terbatas</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                          <span className="text-[10px] font-bold text-[#10b981]">Stok Tersedia</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions / Price */}
                  <div className="mt-auto pt-2 border-t border-outline-variant/10">
                    <div className="mb-2">
                      <p className="text-xs font-black text-primary font-mono">Rp {p.price.toLocaleString("id-ID")}</p>
                      <p className="text-[9px] text-outline line-through font-mono">Rp {(p.price * 1.05).toLocaleString("id-ID")}</p>
                    </div>
                    
                    <button 
                      onClick={() => addToCartWithQty(p, 1)}
                      disabled={isOutOfStock || hasCdobWarning}
                      className={`w-full h-9 font-sans font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer border-none ${
                        isOutOfStock || hasCdobWarning
                          ? "bg-surface-container-low text-on-surface-variant/40 cursor-not-allowed opacity-50"
                          : "bg-primary-container text-on-primary-container hover:opacity-95"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      <span>Tambah</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Empty State / Total count indicator */}
        <div className="py-8 flex flex-col items-center text-center opacity-40">
          <span className="material-symbols-outlined text-3xl mb-1.5">medication</span>
          <p className="font-sans text-[10px] font-bold">Viewing {finalFilteredProducts.length} of {products.length} products</p>
        </div>
      </div>
    </div>
  );
}
