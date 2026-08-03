"use client";

import React, { useRef, useState } from "react";
import { Search, ShoppingBag, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";

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
}

export default function PublicCatalog({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("SEMUA");

  // Ekstrak kategori unik
  const categories = ["SEMUA", ...Array.from(new Set(products.map((p) => p.category)))];

  // Helper untuk warna badge kategori
  const getCategoryBadgeClass = (cat: string) => {
    const lower = cat.toLowerCase();
    if (lower.includes("antibiotik")) {
      return "text-amber-700 bg-amber-50 border-amber-200/60";
    }
    if (lower.includes("analgesik") || lower.includes("antipiretik") || lower.includes("nyeri")) {
      return "text-blue-700 bg-blue-50 border-blue-200/60";
    }
    if (lower.includes("vitamin") || lower.includes("suplemen") || lower.includes("gizi")) {
      return "text-emerald-700 bg-emerald-50 border-emerald-200/60";
    }
    return "text-slate-700 bg-slate-100 border-slate-200";
  };

  // Filter produk dari database
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.activeIngredient.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.manufacturer && p.manufacturer.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = category === "SEMUA" || p.category === category;

    return matchesSearch && matchesCategory;
  });

  // Fungsi scroll slider kanan/kiri
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Category Filter Bar + Prev/Next Controls */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Input Cari */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari obat, zat aktif, SKU..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Filter Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                category === cat
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Slider Navigation Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all active:scale-95 cursor-pointer"
            aria-label="Previous Product"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 shadow-xs shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
            aria-label="Next Product"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Slider Track */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200/80 rounded-2xl space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-600">Tidak ada produk obat yang cocok dengan pencarian Anda.</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-none py-2 px-1 -mx-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="snap-start shrink-0 w-[290px] sm:w-[320px] bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-lg hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* SKU & Category Tag */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {p.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                      p.category
                    )}`}
                  >
                    {p.category}
                  </span>
                </div>

                {/* Title & Desc */}
                <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 mb-1.5 font-heading">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                  {p.description || "Sediaan obat resmi berstandar mutu CDOB dari distributor resmi."}
                </p>

                {/* Specs Box Mini */}
                <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 space-y-1 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Zat Aktif:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[130px]">
                      {p.activeIngredient || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Manufaktur:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[130px]">
                      {p.manufacturer || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Kemasan:</span>
                    <span className="font-medium text-slate-700">{p.unit || "-"}</span>
                  </div>
                </div>
              </div>

              {/* Footer: Stok + Harga + CTA */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2 text-[11px]">
                  <span className="text-slate-400">Stok Ready:</span>
                  {p.totalStock > 0 ? (
                    <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      {p.totalStock} {p.unit}
                    </span>
                  ) : (
                    <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      Stok Habis
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Harga / Pack</span>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      Rp {p.price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Pesan
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
