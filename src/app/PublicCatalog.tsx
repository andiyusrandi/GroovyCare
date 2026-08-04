"use client";

import React, { useState } from "react";
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
  imageUrl?: string;
  expDate?: string;
}

// 5 Produk Dummy Utama dengan data presisi & fallback gambar kustom
const DUMMY_PRODUCTS: Product[] = [
  {
    id: "dummy-1",
    code: "INF-001",
    name: "Undenatured Collagen Type II (UC II) 40mg",
    activeIngredient: "Collagen 40mg",
    price: 1000,
    category: "Suplemen",
    description: "Formulasi collagen tipe 2 khusus kesehatan sendi & tulang.",
    unit: "Pack",
    manufacturer: "PT INFION",
    totalStock: 100,
    imageUrl: "https://mydents.co.id/wp-content/uploads/2024/09/Obat-Sakit-Gigi.jpg",
    expDate: "Agu 2027",
  },
  {
    id: "dummy-2",
    code: "KFA-93025",
    name: "Vitamin D3 (Cholecalciferol) 4000 IU",
    activeIngredient: "D3 4000 IU",
    price: 120000,
    category: "Vitamin",
    description: "Suplemen vitamin D3 dosis tinggi untuk daya tahan tubuh.",
    unit: "Pack",
    manufacturer: "PT KIMIA FARMA TBK",
    totalStock: 100,
    imageUrl: "https://mydents.co.id/wp-content/uploads/2024/09/Obat-Sakit-Gigi.jpg",
    expDate: "Jul 2027",
  },
  {
    id: "dummy-3",
    code: "AMX-500",
    name: "Amoxicillin 500mg Box (100 Kaplet)",
    activeIngredient: "Amoxicillin 500mg",
    price: 120000,
    category: "Antibiotik",
    description: "Antibiotik spektrum luas standar BPOM & CDOB.",
    unit: "Box",
    manufacturer: "DEXA MEDICA",
    totalStock: 46,
    imageUrl: "https://mydents.co.id/wp-content/uploads/2024/09/Obat-Sakit-Gigi.jpg",
    expDate: "Jun 2027",
  },
  {
    id: "dummy-4",
    code: "SAN-500",
    name: "Sanmol 500mg Box (100 Tablet)",
    activeIngredient: "Paracetamol 500mg",
    price: 90000,
    category: "Analgesik",
    description: "Obat pereda nyeri dan penurun demam terpercaya.",
    unit: "Box",
    manufacturer: "SANBE FARMA",
    totalStock: 40,
    imageUrl: "https://mydents.co.id/wp-content/uploads/2024/09/Obat-Sakit-Gigi.jpg",
    expDate: "Mar 2027",
  },
  {
    id: "dummy-5",
    code: "PCT-500",
    name: "Paracetamol 500mg Box (100 Tablet)",
    activeIngredient: "Paracetamol 500mg",
    price: 75000,
    category: "Analgesik",
    description: "Obat antipiretik generik berstandar mutu CDOB.",
    unit: "Box",
    manufacturer: "KALBE FARMA",
    totalStock: 80,
    imageUrl: "https://mydents.co.id/wp-content/uploads/2024/09/Obat-Sakit-Gigi.jpg",
    expDate: "Des 2027",
  },
];

const FALLBACK_IMAGE_URL = "https://mydents.co.id/wp-content/uploads/2024/09/Obat-Sakit-Gigi.jpg";

export default function PublicCatalog({ products }: { products: Product[] }) {
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  let displayProducts: Product[] = [];
  if (!products || products.length === 0) {
    displayProducts = DUMMY_PRODUCTS;
  } else {
    displayProducts = [...products];
    if (displayProducts.length < 5) {
      const remainingNeeded = 5 - displayProducts.length;
      displayProducts = [...displayProducts, ...DUMMY_PRODUCTS.slice(0, remainingNeeded)];
    } else {
      displayProducts = displayProducts.slice(0, 5);
    }
  }

  const getProductImage = (p: Product) => {
    if (imageErrors[p.id]) {
      return FALLBACK_IMAGE_URL;
    }
    if (p.imageUrl && p.imageUrl.trim() !== "") {
      return p.imageUrl;
    }
    return FALLBACK_IMAGE_URL;
  };

  const getGolonganBadge = (p: Product) => {
    const nameLower = p.name.toLowerCase();
    const catLower = (p.category || "").toLowerCase();
    if (catLower.includes("antibiotik") || nameLower.includes("amoxicillin") || nameLower.includes("keras")) {
      return { text: "KERAS (G)", cls: "text-rose-700 bg-rose-50 border-rose-200/60" };
    }
    return { text: "BEBAS (W)", cls: "text-emerald-700 bg-emerald-50 border-emerald-200/60" };
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
      {displayProducts.map((p, idx) => {
        const golongan = getGolonganBadge(p);
        const imgSrc = getProductImage(p);

        return (
          <div
            key={`${p.id}-${idx}`}
            className="bg-white rounded-2xl border border-slate-200/80 p-2.5 sm:p-3.5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group"
          >
            <div>
              {/* Code & Badge */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded truncate">
                  {p.code || `MED-00${idx + 1}`}
                </span>
                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${golongan.cls}`}>
                  {golongan.text}
                </span>
              </div>

              {/* Product Image Container (h-24 sm:h-28) */}
              <div className="relative w-full h-24 sm:h-28 bg-slate-50 rounded-xl overflow-hidden mb-2 border border-slate-100 flex items-center justify-center p-2">
                <img
                  src={imgSrc}
                  alt={p.name}
                  onError={() => handleImageError(p.id)}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform pointer-events-none"
                />
                {p.name.toLowerCase().includes("amoxicillin") && (
                  <span className="absolute top-1.5 left-1.5 text-[8px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 px-1 py-0.5 rounded">
                    ❄️ Cold
                  </span>
                )}
              </div>

              {/* Brand & Name (min-h-[32px] for line clamping balance) */}
              <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase truncate">
                {p.manufacturer || "FARMASI RESMI"}
              </p>
              <h3 className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mt-0.5 mb-2 leading-snug min-h-[32px] font-heading">
                {p.name}
              </h3>

              {/* Details Box */}
              <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100/80 space-y-1 text-[10px] mb-2.5">
                <div className="flex justify-between items-center gap-1">
                  <span className="text-slate-400 shrink-0">Zat Aktif:</span>
                  <span className="font-semibold text-slate-700 truncate">
                    {p.activeIngredient || "Sediaan Farmasi"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Exp:</span>
                  <span className="font-mono text-slate-600 text-[9px]">
                    {p.expDate || "Agu 2027"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Stok:</span>
                  <span className="font-bold text-emerald-600 font-mono text-[10px]">
                    {p.totalStock > 0 ? `${p.totalStock} ${p.unit || "Units"}` : "100 Units"}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Card Action (min-w-0 & shrink-0) */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
              <div className="min-w-0">
                <span className="text-[8px] text-slate-400 block leading-none">Harga / Pack</span>
                <span className="text-xs font-bold text-slate-900 font-mono truncate block">
                  Rp {p.price.toLocaleString("id-ID")}
                </span>
              </div>
              <Link
                href="/login"
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-semibold transition-all shrink-0 inline-block"
              >
                Pesan
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
