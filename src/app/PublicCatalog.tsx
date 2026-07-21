"use client";

import { useState } from "react";
import { Search, ShoppingBag, AlertCircle } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("SEMUA");

  // Ekstrak kategori unik
  const categories = ["SEMUA", ...new Set(products.map((p) => p.category))];

  // Filter produk
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.activeIngredient.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.manufacturer && p.manufacturer.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = category === "SEMUA" || p.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border border-outline-variant/30 rounded-3xl shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama obat, kandungan zat aktif, SKU..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-foreground placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/45 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${category === cat
                  ? "bg-primary text-white shadow-sm shadow-primary/10"
                  : "bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-foreground border border-outline-variant/20"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-outline-variant/30 rounded-3xl space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-low text-on-surface-variant/60">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-on-surface-variant">Tidak ada produk obat yang cocok dengan pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white hover:bg-white/80 border border-outline-variant/30 hover:border-primary/30 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 group shadow-sm hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant/60 tracking-wider">
                    {p.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-container-low text-on-surface-variant">
                    {p.category}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                  {p.name}
                </h3>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Zat Aktif:</span>
                    <span className="font-medium text-foreground">{p.activeIngredient}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Manufaktur:</span>
                    <span className="font-medium text-foreground">{p.manufacturer}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Satuan:</span>
                    <span className="text-foreground">{p.unit}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Stok Tersedia:</span>
                    {p.totalStock > 0 ? (
                      <span className="font-bold text-primary">{p.totalStock} {p.unit}</span>
                    ) : (
                      <span className="font-bold text-error">Habis</span>
                    )}
                  </div>
                </div>

                {p.description && (
                  <p className="text-[11px] text-on-surface-variant/80 italic line-clamp-2 pt-2 border-t border-outline-variant/20">
                    {p.description}
                  </p>
                )}
              </div>

              <div className="pt-5 border-t border-outline-variant/20 mt-4 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-on-surface-variant/60">Harga Satuan</span>
                  <span className="font-extrabold text-base text-foreground font-mono">
                    Rp {p.price.toLocaleString("id-ID")}
                  </span>
                </div>

                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-primary group-hover:bg-primary group-hover:text-white border border-primary/20 group-hover:border-transparent transition-all cursor-pointer shadow-sm"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Pesan
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
