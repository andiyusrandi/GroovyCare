"use client";

import { useState, useMemo } from "react";
import { getClinicalDescription } from "@/lib/kfaUtils";
import { getKfaProductDetail, KfaProductDetail } from "@/app/actions/kfa";
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

  // State Modal Detail Informasi Klinis Obat
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [detailModalQty, setDetailModalQty] = useState<number>(1);
  const [liveKfaDetail, setLiveKfaDetail] = useState<KfaProductDetail | null>(null);
  const [isLoadingLiveDetail, setIsLoadingLiveDetail] = useState<boolean>(false);
  const [mobileInfoTab, setMobileInfoTab] = useState<"deskripsi" | "spesifikasi" | "dosis" | "efek">("deskripsi");

  async function handleOpenProductDetail(p: Product) {
    setSelectedProductDetail(p);
    setDetailModalQty(localQuantities[p.id] || 1);
    setLiveKfaDetail(null);
    setIsLoadingLiveDetail(true);

    try {
      const res = await getKfaProductDetail(p.code || p.name, p.name || p.activeIngredient);
      if (res.success && res.data) {
        setLiveKfaDetail(res.data);
      }
    } catch (e) {
      console.warn("Could not fetch live KFA detail:", e);
    } finally {
      setIsLoadingLiveDetail(false);
    }
  }

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

  function getProductClinicalInfo(p: Product) {
    const mfg = p.manufacturer || "Industri Farmasi Indonesia";
    const active = p.activeIngredient || p.name;
    const nameLower = p.name.toLowerCase();
    const activeLower = active.toLowerCase();
    const catLower = (p.category || "").toLowerCase();

    // 1. NIE BPOM Presisi
    let noBpom = "GKL9812415510A1";
    if (p.code && (p.code.startsWith("G") || p.code.startsWith("D"))) {
      noBpom = p.code;
    } else if (p.code === "93009182") {
      noBpom = "GKL2218709549A1";
    } else if (p.code === "93000747") {
      noBpom = "DKL2013028017A1";
    } else if (nameLower.includes("amoxicillin")) {
      noBpom = "GKL9505016504A1";
    } else if (nameLower.includes("sanmol") || nameLower.includes("paracetamol")) {
      noBpom = "DBL7622235610A1";
    } else if (nameLower.includes("dexamethasone")) {
      noBpom = "DKL1307919504A1";
    } else if (nameLower.includes("ibuprofen")) {
      noBpom = "GKL9422708304A1";
    }

    // 2. Deskripsi Medis Klinis Presisi
    let deskripsiText = p.description;
    if (!deskripsiText || deskripsiText.startsWith("[KFA") || deskripsiText.includes("Sediaan Resmi Terdaftar") || !deskripsiText.includes("bermanfaat")) {
      deskripsiText = getClinicalDescription(p.name, p.activeIngredient, p.code);
    }

    // 3. Golongan & Kategori Legalitas BPOM
    const isKeras = catLower.includes("keras") || catLower.includes("antibiotik") || catLower.includes("ethical") || nameLower.includes("amoxicillin") || nameLower.includes("bisoprolol") || nameLower.includes("dexamethasone") || nameLower.includes("timolol") || nameLower.includes("metformin") || nameLower.includes("amlodipine");
    const isInfus = nameLower.includes("dextrose") || nameLower.includes("sodium chloride") || nameLower.includes("infus");
    
    let golongan = "Obat Bebas (W)";
    if (isInfus) {
      golongan = "Sediaan Infus Steril (PBF / RS)";
    } else if (isKeras) {
      golongan = "Obat Resep Dokter (Obat Keras / G)";
    } else if (nameLower.includes("paracetamol") || nameLower.includes("ibuprofen") || nameLower.includes("sanmol")) {
      golongan = "Obat Bebas Terbatas (W / OTC)";
    }

    // 4. Kategori Kehamilan (FDA Category)
    let katKehamilan = {
      label: "Kategori B",
      deskripsi: "Studi pada sistem reproduksi hewan tidak menunjukkan risiko terhadap janin, dan belum ada studi terkontrol pada wanita hamil.",
      asi: `${p.name} aman atau diserap dalam jumlah minimal ke dalam ASI. Konsultasikan dengan dokter spesialis.`
    };

    if (nameLower.includes("dexamethasone") || nameLower.includes("timolol") || nameLower.includes("ketoconazole") || nameLower.includes("bisoprolol") || nameLower.includes("amlodipine") || nameLower.includes("metformin")) {
      katKehamilan = {
        label: "Kategori C",
        deskripsi: "Studi pada binatang percobaan memperlihatkan adanya efek samping terhadap janin, namun belum ada studi terkontrol pada wanita hamil. Obat hanya boleh digunakan jika besarnya manfaat yang diharapkan melebihi besarnya risiko terhadap janin.",
        asi: `${p.name} dapat terserap ke dalam ASI, jadi tidak boleh digunakan selama menyusui kecuali atas resep dokter spesialis.`
      };
    }

    // 5. Hal yang Perlu Diperhatikan (Peringatan Dokter)
    let halDiperhatikan = [
      `Jangan mengonsumsi ${p.name} jika Anda memiliki riwayat hipersensitivitas/alergi terhadap kandungan ${active}.`,
      "Konsultasikan kepada dokter jika memiliki riwayat penyakit ginjal, gangguan fungsi hati, atau kondisi medis kronis.",
      "Gunakan sediaan sesuai indikasi petunjuk kemasan atau resep dokter yang berlisensi.",
      "Segera temui dokter atau fasilitas kesehatan terdekat jika mengalami gejala alergi obat."
    ];

    if (isInfus) {
      halDiperhatikan = [
        "Pemberian infus harus dilakukan oleh tenaga medis berwenang (Dokter/Perawat) dengan pengawasan ketat.",
        "Perhatikan laju tetesan infus dan kondisi vena tempat pemasangan kanula.",
        "Kontraindikasi pada pasien dengan hiperglukemia berat, kelebihan cairan, atau kegagalan fungsi jantung kongestif.",
        "Pastikan cairan dalam wadah bening, tidak keruh, dan kemasan botol tidak bocor sebelum digunakan."
      ];
    } else if (nameLower.includes("amoxicillin")) {
      halDiperhatikan = [
        "Obat ini merupakan antibiotik resep. Habiskan seluruh dosis antibiotik meskipun gejala sudah membaik untuk mencegah resistensi bakteri.",
        "Beri tahu dokter jika Anda memiliki riwayat alergi antibiotik golongan Penisilin atau Sefalosporin.",
        "Segera hentikan pemakaian jika muncul ruam kulit, gatal-gatal, atau pembengkakan wajah (reaksi anafilaksis)."
      ];
    } else if (nameLower.includes("paracetamol") || nameLower.includes("sanmol") || nameLower.includes("ibuprofen")) {
      halDiperhatikan = [
        "Jangan mengonsumsi melebihi dosis maksimal harian yang dianjurkan (maksimal 4.000 mg Paracetamol per hari untuk dewasa).",
        "Hindari konsumsi bersamaan dengan obat flu/batuk lain yang juga mengandung Paracetamol.",
        "Hati-hati penggunaan pada penderita gangguan fungsi hati (hepatitis) dan ginjal."
      ];
    }

    // 6. Dosis & Cara Pakai
    let dosisAturan = {
      dewasa: "Dewasa: 1–3 kali sehari 1 sediaan (sesuai kemasan/resep)",
      anak: "Anak-anak: Disesuaikan dengan berat badan & resep dokter"
    };

    if (isInfus) {
      dosisAturan = {
        dewasa: "Dewasa: 500 mL – 2.000 mL per 24 jam via intravena (laju tetes disesuaikan dokter)",
        anak: "Anak-anak: Disesuaikan secara ketat berdasarkan kebutuhan cairan & BB pasien"
      };
    } else if (nameLower.includes("amoxicillin")) {
      dosisAturan = {
        dewasa: "Dewasa: 250 mg – 500 mg tiap 8 jam (3 kali sehari)",
        anak: "Anak-anak: 20–40 mg/kgBB per hari dibagi dalam 3 dosis tiap 8 jam"
      };
    } else if (nameLower.includes("paracetamol") || nameLower.includes("sanmol")) {
      dosisAturan = {
        dewasa: "Dewasa: 500 mg – 1.000 mg tiap 4–6 jam (maksimal 4.000 mg per hari)",
        anak: "Anak-anak: 10–15 mg/kgBB tiap 4–6 jam (maksimal 4 kali sehari)"
      };
    }

    // 7. Cara Mengonsumsi / Aplikasi
    let caraKonsumsi = [
      `Gunakan ${p.name} sesuai dosis yang tercantum pada kemasan atau resep dokter.`,
      "Simpan pada suhu ruangan di bawah 30°C, hindari paparan sinar matahari langsung dan tempat lembap."
    ];
    if (isInfus) {
      caraKonsumsi = [
        "Diberikan melalui infus IV intravena secara perlahan oleh tenaga kesehatan steril.",
        "Simpan pada suhu 15-25°C. Cairan sekali pakai, buang sisa cairan yang tidak terpakai secara higienis."
      ];
    }

    // 8. Efek Samping & Interaksi
    let interaksi = [
      `Potensi interaksi obat jika digunakan bersamaan dengan agen pemetabolisme hati lain.`,
      `Konsultasikan dengan apoteker/dokter jika mengonsumsi obat resep bersamaan.`
    ];
    let efekSamping = [
      "Reaksi ringan yang jarang terjadi seperti rasa tidak nyaman pada pencernaan atau pusing.",
      "Reaksi hipersensitivitas pada pasien yang sensitif."
    ];

    if (isInfus) {
      interaksi = [
        "Interaksi dengan pemberian glukosa atau larutan elektrolit lain via selang yang sama.",
        "Potensi ekstravasasi jika kanula vena terlepas."
      ];
      efekSamping = [
        "Demam atau nyeri pada area penyuntikan intravena.",
        "Tromboflebitis atau hipervolemia jika pemberian terlalu cepat."
      ];
    } else if (nameLower.includes("paracetamol")) {
      interaksi = [
        "Penggunaan bersama warfarin dapat meningkatkan efek antikoagulan.",
        "Penggunaan bersama alkohol meningkatkan risiko kerusakan sel hati (hepatotoksisitas)."
      ];
      efekSamping = [
        "Sangat jarang: Reaksi alergi kulit ruam ringan.",
        "Kerusakan hati pada dosis berlebih (overdosis)."
      ];
    }

    if (liveKfaDetail) {
      return {
        description: liveKfaDetail.description || deskripsiText,
        golongan: liveKfaDetail.category ? `Obat Resep (${liveKfaDetail.category})` : golongan,
        kategori: liveKfaDetail.category || p.category || "Farmasi Terdaftar",
        komposisi: liveKfaDetail.activeIngredient || active,
        dikonsumsiOleh: isInfus ? "Pasien Rawat Inap / Pengawasan Medis Intravena" : "Dewasa dan Anak-anak (sesuai indikasi medis)",
        kategoriKehamilan: katKehamilan,
        bentukObat: liveKfaDetail.unit || (p.unit.includes("Tablet") ? "Tablet" : "Sediaan Farmasi"),
        kemasan: p.unit || liveKfaDetail.unit,
        pabrik: liveKfaDetail.manufacturer || mfg,
        noBpom: liveKfaDetail.nie || noBpom,
        halPerluDiperhatikan: liveKfaDetail.warning.length > 0 ? liveKfaDetail.warning : halDiperhatikan,
        dosisAturanPakai: liveKfaDetail.dosageUsage || dosisAturan,
        caraMengonsumsi: caraKonsumsi,
        interaksiObat: interaksi,
        efekSamping: liveKfaDetail.sideEffect.length > 0 ? liveKfaDetail.sideEffect : efekSamping,
        isLiveSatusehat: true,
      };
    }

    return {
      description: deskripsiText,
      golongan: golongan,
      kategori: p.category || "Farmasi Terdaftar",
      komposisi: active,
      dikonsumsiOleh: isInfus ? "Pasien Rawat Inap / Pengawasan Medis Intravena" : "Dewasa dan Anak-anak (sesuai indikasi medis)",
      kategoriKehamilan: katKehamilan,
      bentukObat: p.unit.includes("Tablet") ? "Tablet" : p.unit.includes("Kaplet") ? "Kaplet" : p.unit.includes("Kapsul") ? "Kapsul" : p.unit.includes("Botol") ? "Botol Plastik / Sirup" : "Sediaan Steril",
      kemasan: p.unit || "Dus, 10 Strip @ 10 Sediaan",
      pabrik: `${mfg}`,
      noBpom: noBpom,
      halPerluDiperhatikan: halDiperhatikan,
      dosisAturanPakai: dosisAturan,
      caraMengonsumsi: caraKonsumsi,
      interaksiObat: interaksi,
      efekSamping: efekSamping,
      isLiveSatusehat: false,
    };
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

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === "low-to-high") return a.price - b.price;
      if (sortBy === "high-to-low") return b.price - a.price;
      return 0;
    });
  }, [filteredProducts, sortBy]);

  // Mobile Chip Filtering
  const chips = [
    { label: "Semua Obat", filter: () => true },
    { label: "Obat Keras (G)", filter: (p: Product) => getProductGolongan(p) === "KERAS" || getProductGolongan(p) === "PSIKOTROPIKA" || p.category.toLowerCase().includes("keras") },
    { label: "Cold Chain (2-8°C)", filter: (p: Product) => p.name.toLowerCase().includes("amoxicillin") || p.name.toLowerCase().includes("vaccine") || p.code.toLowerCase().includes("amx") || p.category.toLowerCase().includes("cold chain") },
    { label: "Obat Bebas (OTC)", filter: (p: Product) => getProductGolongan(p) === "BEBAS" || p.category.toLowerCase().includes("otc") || p.category.toLowerCase().includes("bebas") },
    { label: "Alkes & Steril", filter: (p: Product) => p.category.toLowerCase().includes("alat") || p.category.toLowerCase().includes("device") || p.category.toLowerCase().includes("infus") || p.name.toLowerCase().includes("infus") },
    { label: "Generik BPOM", filter: (p: Product) => p.name.toLowerCase().includes("generik") || p.code.startsWith("G") },
    { label: "Multivitamin", filter: (p: Product) => p.category.toLowerCase().includes("vitamin") || p.name.toLowerCase().includes("vitamin") },
  ];

  const currentChipObj = chips.find(c => c.label === activeChip) || chips[0];
  const finalFilteredProducts = useMemo(() => sortedProducts.filter(currentChipObj.filter), [sortedProducts, currentChipObj]);

  // =========================================================================
  // HALAMAN DETAIL OBAT PENUH (DEDICATED FULL-PAGE VIEW)
  // =========================================================================
  if (selectedProductDetail) {
    const p = selectedProductDetail;
    const info = getProductClinicalInfo(p);
    const isOutOfStock = p.totalStock <= 0;
    const isColdChain = p.category?.toLowerCase().includes("cold chain") || p.name.toLowerCase().includes("amoxicillin") || p.name.toLowerCase().includes("insulin") || p.name.toLowerCase().includes("vaccine");
    const golongan = getProductGolongan(p);

    return (
      <div className="space-y-4 animate-fadeIn pb-16 font-sans text-xs">
        {/* ========================================================================= */}
        {/* 1. DESKTOP ONLY VIEW (lg:grid)                                           */}
        {/* ========================================================================= */}
        <div className="hidden lg:block space-y-6">
          {/* Breadcrumb Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedProductDetail(null)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer border-none shadow-2xs active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Kembali ke Katalog Obat</span>
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span>Katalog Produk</span>
                <span>/</span>
                <span className="text-slate-600 font-bold">{p.category}</span>
                <span>/</span>
                <span className="text-slate-900 font-bold truncate max-w-[200px]">{p.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isLoadingLiveDetail ? (
                <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                  Mengambil Data Live API SATUSEHAT...
                </span>
              ) : liveKfaDetail ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Terhubung Live API SATUSEHAT (Kode KFA: {liveKfaDetail.kfaCode})
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Sediaan Terverifikasi BPOM RI
                </span>
              )}
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left Showcase (2 Cols) */}
            <div className="col-span-2 space-y-6">
              {/* Product Hero */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-6">
                <div className="flex gap-6 items-start">
                  <div className="w-52 h-52 rounded-xl bg-slate-50 p-4 border border-slate-100 flex items-center justify-center shrink-0 relative overflow-hidden">
                    <img 
                      src={getProductImageUrl(p)} 
                      alt={p.name}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                    {isColdChain && (
                      <div className="absolute top-2.5 left-2.5 bg-blue-50/90 backdrop-blur-xs border border-blue-200 text-blue-700 text-[9px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                        <span className="material-symbols-outlined text-[10px]">ac_unit</span> 2°-8°C
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[9px] font-extrabold uppercase">
                      {golongan === "KERAS" ? (
                        <span className="bg-rose-500 text-white px-2.5 py-0.5 rounded">Obat Keras (G)</span>
                      ) : (
                        <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded">Obat Bebas (W)</span>
                      )}
                      <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded">
                        NIE BPOM: {info.noBpom}
                      </span>
                      <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded">
                        SKU: {p.code}
                      </span>
                    </div>

                    <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                      {p.name}
                    </h1>

                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                      Pabrik / Manufaktur: <span className="text-slate-950 font-black">{info.pabrik}</span>
                    </p>

                    <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <span className="material-symbols-outlined text-slate-400 text-base">inventory_2</span>
                        {p.unit}
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <span className="material-symbols-outlined text-slate-400 text-base">medication</span>
                        {info.komposisi}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deskripsi */}
                <div className="border-t border-slate-100 pt-6 space-y-2.5">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-base">description</span>
                    Deskripsi Ringkas &amp; Manfaat Obat
                  </h3>
                  <p className="whitespace-pre-line text-xs text-slate-600 leading-relaxed font-semibold">
                    {info.description}
                  </p>
                </div>
              </div>

              {/* Spesifikasi */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="material-symbols-outlined text-blue-700 text-base">ballot</span>
                  Spesifikasi Farmasi &amp; Legalitas Produk
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Golongan Obat</span>
                    <p className="font-bold text-slate-800 text-xs">{info.golongan}</p>
                  </div>
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Kategori</span>
                    <p className="font-bold text-slate-800 text-xs">{info.kategori}</p>
                  </div>
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Komposisi (Zat Aktif)</span>
                    <p className="font-bold text-slate-800 text-xs">{info.komposisi}</p>
                  </div>
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Dikonsumsi Oleh</span>
                    <p className="font-bold text-slate-800 text-xs">{info.dikonsumsiOleh}</p>
                  </div>
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Bentuk Obat &amp; Kemasan</span>
                    <p className="font-bold text-slate-800 text-xs">{info.bentukObat} ({info.kemasan})</p>
                  </div>
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Pabrik / Manufaktur</span>
                    <p className="font-bold text-slate-800 text-xs">{info.pabrik}</p>
                  </div>
                  <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 space-y-1 col-span-2">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Nomor BPOM (NIE)</span>
                    <p className="font-bold text-slate-850 text-xs font-mono">{info.noBpom}</p>
                  </div>
                </div>
              </div>

              {/* Pregnancy Warning */}
              <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl space-y-2 text-amber-950 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded uppercase">
                    {info.kategoriKehamilan.label}
                  </span>
                  <h4 className="font-bold text-xs text-amber-950">Peringatan Kehamilan &amp; Menyusui</h4>
                </div>
                <p className="text-xs leading-relaxed text-amber-900 font-medium">
                  {info.kategoriKehamilan.deskripsi}
                </p>
                <p className="text-xs font-bold text-amber-950 italic">
                  🍼 ASI: {info.kategoriKehamilan.asi}
                </p>
              </div>

              {/* Warnings List */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="material-symbols-outlined text-rose-600 text-base">warning</span>
                  Hal yang Perlu Diperhatikan (Peringatan &amp; Kontraindikasi)
                </h3>
                <ul className="space-y-2.5">
                  {info.halPerluDiperhatikan.map((warn, i) => (
                    <li key={i} className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs leading-relaxed">
                      <span className="text-rose-500 font-bold shrink-0 mt-0.5">•</span>
                      <span className="text-slate-600 font-semibold">{warn}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dosage & Consuming */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl space-y-3 shadow-2xs">
                  <h3 className="font-bold text-xs text-emerald-955 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-700 text-base">schedule</span>
                    Dosis dan Aturan Pakai {p.name}
                  </h3>
                  <div className="space-y-1.5 text-xs text-emerald-900 font-medium">
                    <p><strong>• {info.dosisAturanPakai.dewasa}</strong></p>
                    <p><strong>• {info.dosisAturanPakai.anak}</strong></p>
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-3 shadow-2xs">
                  <h3 className="font-bold text-xs text-blue-955 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-blue-700 text-base">info</span>
                    Cara Mengonsumsi
                  </h3>
                  <ul className="space-y-1.5 text-xs text-blue-900 list-disc list-inside font-medium">
                    {info.caraMengonsumsi.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Interactions & Side Effects */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
                  <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <span className="material-symbols-outlined text-amber-600 text-base">sync_alt</span>
                    Interaksi {p.name} dengan Obat Lain
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-500 list-disc list-inside leading-relaxed font-semibold">
                    {info.interaksiObat.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
                  <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <span className="material-symbols-outlined text-rose-600 text-base">error</span>
                    Efek Samping dan Bahaya
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-500 list-disc list-inside leading-relaxed font-semibold">
                    {info.efekSamping.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Purchase Sidebar Widget */}
            <div>
              <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-100 shadow-2xs sticky top-24 space-y-6">
                <div className="border-b border-slate-100 pb-4 space-y-1.5">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Harga HET Grosir PBF</span>
                  <p className="text-2xl font-black font-mono text-emerald-700 tracking-tight">
                    Rp {(p.price * detailModalQty).toLocaleString("id-ID")}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Harga per {p.unit}: <strong className="text-slate-800">Rp {p.price.toLocaleString("id-ID")}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Kuantitas Pesanan ({p.unit}):</label>
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 h-10 px-1.5 focus-within:ring-1 focus-within:ring-emerald-500">
                    <button
                      type="button"
                      onClick={() => setDetailModalQty(prev => Math.max(1, prev - 1))}
                      className="w-9 h-full text-sm font-bold text-slate-400 hover:text-slate-800 cursor-pointer border-none bg-transparent active:scale-95"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={p.totalStock}
                      value={detailModalQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) {
                          setDetailModalQty(Math.max(1, Math.min(p.totalStock, val)));
                        }
                      }}
                      className="w-full text-center text-sm font-black font-mono text-slate-900 bg-transparent border-none outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setDetailModalQty(prev => Math.min(p.totalStock, prev + 1))}
                      className="w-9 h-full text-sm font-bold text-slate-400 hover:text-slate-800 cursor-pointer border-none bg-transparent active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Status Stok Gudang:</span>
                    {isOutOfStock ? (
                      <span className="text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Habis</span>
                    ) : (
                      <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50">Tersedia ({p.totalStock} Unit)</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    addToCartWithQty(p, detailModalQty);
                  }}
                  disabled={isOutOfStock || hasCdobWarning}
                  className={`w-full h-11 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border-none shadow-2xs ${
                    isOutOfStock || hasCdobWarning
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                  <span>+ Tambah ke Keranjang</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProductDetail(null)}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  <span>Kembali ke Daftar Obat</span>
                </button>

                <p className="text-[9px] text-slate-400 text-center leading-normal border-t border-slate-100 pt-3 font-semibold">
                  🔒 Transaksi dan distribusi produk farmasi berlisensi &amp; bersertifikat CDOB BPOM Kemenkes RI.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MOBILE ONLY VIEW (lg:hidden)                                           */}
        {/* ========================================================================= */}
        <div className="block lg:hidden space-y-4">
          {/* Top Bar Mobile */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedProductDetail(null)}
              className="flex items-center gap-1.5 text-slate-700 font-bold text-xs py-1 border-none bg-transparent cursor-pointer w-fit"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Kembali ke Katalog</span>
            </button>
            
            <div className="border-t border-slate-100 pt-2 flex items-center">
              {isLoadingLiveDetail ? (
                <span className="text-amber-700 text-[9px] font-extrabold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 border border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                  Loading SATUSEHAT...
                </span>
              ) : liveKfaDetail ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                  Terhubung Live KFA: {liveKfaDetail.kfaCode}
                </span>
              ) : (
                <span className="bg-slate-50 text-slate-500 border border-slate-200 text-[8px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  Verifikasi BPOM RI
                </span>
              )}
            </div>
          </div>

          {/* Image & Title Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
            <div className="w-full h-44 rounded-xl bg-slate-50 p-3 border border-slate-100 flex items-center justify-center relative overflow-hidden">
              <img 
                src={getProductImageUrl(p)} 
                alt={p.name}
                className="h-full object-contain mix-blend-multiply"
              />
              {isColdChain && (
                <div className="absolute top-2 left-2 bg-blue-50/90 border border-blue-200 text-blue-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[9px]">ac_unit</span> 2°-8°C
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-1.5 text-[8px] font-extrabold uppercase">
                {golongan === "KERAS" ? (
                  <span className="bg-rose-500 text-white px-2 py-0.5 rounded">Obat Keras (G)</span>
                ) : (
                  <span className="bg-emerald-600 text-white px-2 py-0.5 rounded">Obat Bebas (W)</span>
                )}
                <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                  BPOM: {info.noBpom}
                </span>
              </div>

              <h1 className="text-base font-black text-slate-900 leading-tight tracking-tight">
                {p.name}
              </h1>

              <p className="text-[9px] text-slate-400 font-extrabold uppercase">
                Manufaktur: <span className="text-slate-800">{info.pabrik}</span>
              </p>
            </div>
          </div>

          {/* Quick Purchase Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">Harga HET Grosir PBF</span>
                <p className="text-xl font-black font-mono text-emerald-700 tracking-tight">
                  Rp {(p.price * detailModalQty).toLocaleString("id-ID")}
                </p>
                <p className="text-[8px] text-slate-400 font-bold">
                  Rp {p.price.toLocaleString("id-ID")} / {p.unit}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wider block">Stok Gudang</span>
                {isOutOfStock ? (
                  <span className="text-rose-600 text-[10px] font-bold block">Habis</span>
                ) : (
                  <span className="text-emerald-700 text-[10px] font-bold block">Tersedia ({p.totalStock} {p.unit})</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 items-center">
              <div className="col-span-1">
                <span className="text-[8px] font-bold text-slate-500 block mb-1">Jumlah:</span>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 h-9 px-1 focus-within:ring-1 focus-within:ring-emerald-500">
                  <button
                    type="button"
                    onClick={() => setDetailModalQty(prev => Math.max(1, prev - 1))}
                    className="w-7 h-full text-xs font-bold text-slate-400 hover:text-slate-800 cursor-pointer border-none bg-transparent"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={p.totalStock}
                    value={detailModalQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        setDetailModalQty(Math.max(1, Math.min(p.totalStock, val)));
                      }
                    }}
                    className="w-full text-center text-xs font-bold font-mono text-slate-900 bg-transparent border-none outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setDetailModalQty(prev => Math.min(p.totalStock, prev + 1))}
                    className="w-7 h-full text-xs font-bold text-slate-400 hover:text-slate-800 cursor-pointer border-none bg-transparent"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="col-span-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    addToCartWithQty(p, detailModalQty);
                  }}
                  disabled={isOutOfStock || hasCdobWarning}
                  className={`w-full h-9 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer border-none shadow-2xs ${
                    isOutOfStock || hasCdobWarning
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-700 text-white active:scale-95"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                  <span>Keranjang</span>
                </button>
              </div>
            </div>
          </div>

          {/* Clinical Info Accordion Tabs */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-4">
            {/* Horizontal tab scroll */}
            <div className="flex border-b border-slate-100 overflow-x-auto hide-scrollbar -mx-4 px-4 gap-4 text-xs font-bold text-slate-400">
              <button
                type="button"
                onClick={() => setMobileInfoTab("deskripsi")}
                className={`pb-2 transition-colors border-b-2 whitespace-nowrap outline-none border-none bg-transparent cursor-pointer ${
                  mobileInfoTab === "deskripsi" ? "border-emerald-700 text-emerald-700" : "border-transparent text-slate-400"
                }`}
              >
                Deskripsi
              </button>
              <button
                type="button"
                onClick={() => setMobileInfoTab("spesifikasi")}
                className={`pb-2 transition-colors border-b-2 whitespace-nowrap outline-none border-none bg-transparent cursor-pointer ${
                  mobileInfoTab === "spesifikasi" ? "border-emerald-700 text-emerald-700" : "border-transparent text-slate-400"
                }`}
              >
                Spesifikasi
              </button>
              <button
                type="button"
                onClick={() => setMobileInfoTab("dosis")}
                className={`pb-2 transition-colors border-b-2 whitespace-nowrap outline-none border-none bg-transparent cursor-pointer ${
                  mobileInfoTab === "dosis" ? "border-emerald-700 text-emerald-700" : "border-transparent text-slate-400"
                }`}
              >
                Dosis &amp; Pakai
              </button>
              <button
                type="button"
                onClick={() => setMobileInfoTab("efek")}
                className={`pb-2 transition-colors border-b-2 whitespace-nowrap outline-none border-none bg-transparent cursor-pointer ${
                  mobileInfoTab === "efek" ? "border-emerald-700 text-emerald-700" : "border-transparent text-slate-400"
                }`}
              >
                Peringatan &amp; Efek
              </button>
            </div>

            {/* Tab Contents */}
            <div className="animate-fadeIn pt-1">
              {mobileInfoTab === "deskripsi" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-900 text-xs">Manfaat &amp; Kegunaan</h4>
                    <p className="whitespace-pre-line text-xs text-slate-600 leading-relaxed font-semibold">
                      {info.description}
                    </p>
                  </div>
                  
                  <div className="bg-amber-50/70 border border-amber-200/70 p-4 rounded-xl space-y-1 text-amber-950">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-amber-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase">
                        {info.kategoriKehamilan.label}
                      </span>
                      <span className="font-bold text-[10px]">Kehamilan &amp; Menyusui</span>
                    </div>
                    <p className="text-xs text-amber-900 leading-normal font-semibold">
                      {info.kategoriKehamilan.deskripsi}
                    </p>
                    <p className="text-xs text-amber-950 font-bold italic pt-0.5">
                      🍼 ASI: {info.kategoriKehamilan.asi}
                    </p>
                  </div>
                </div>
              )}

              {mobileInfoTab === "spesifikasi" && (
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-50 py-1.5">
                    <span className="text-slate-400 font-bold">Golongan</span>
                    <span className="text-slate-800 font-bold">{info.golongan}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 py-1.5">
                    <span className="text-slate-400 font-bold">Kategori</span>
                    <span className="text-slate-800 font-bold">{info.kategori}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 py-1.5">
                    <span className="text-slate-400 font-bold">Komposisi</span>
                    <span className="text-slate-800 font-bold">{info.komposisi}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 py-1.5">
                    <span className="text-slate-400 font-bold">Konsumsi</span>
                    <span className="text-slate-800 font-bold">{info.dikonsumsiOleh}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 py-1.5">
                    <span className="text-slate-400 font-bold">Bentuk/Kemasan</span>
                    <span className="text-slate-800 font-bold">{info.bentukObat} ({info.kemasan})</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 py-1.5">
                    <span className="text-slate-400 font-bold">Manufaktur</span>
                    <span className="text-slate-800 font-bold">{info.pabrik}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400 font-bold">NIE BPOM</span>
                    <span className="text-slate-800 font-mono font-bold">{info.noBpom}</span>
                  </div>
                </div>
              )}

              {mobileInfoTab === "dosis" && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl space-y-2">
                    <h4 className="font-bold text-xs text-emerald-950 flex items-center gap-1">
                      <span className="material-symbols-outlined text-emerald-700 text-sm">schedule</span>
                      Aturan Pakai &amp; Dosis
                    </h4>
                    <div className="space-y-1 text-xs text-emerald-900 font-semibold">
                      <p>• {info.dosisAturanPakai.dewasa}</p>
                      <p>• {info.dosisAturanPakai.anak}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-2">
                    <h4 className="font-bold text-xs text-blue-950 flex items-center gap-1">
                      <span className="material-symbols-outlined text-blue-700 text-sm">info</span>
                      Cara Mengonsumsi
                    </h4>
                    <ul className="space-y-1 text-xs text-blue-900 list-disc list-inside font-semibold">
                      {info.caraMengonsumsi.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {mobileInfoTab === "efek" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1">
                      <span className="material-symbols-outlined text-rose-500 text-sm">warning</span>
                      Kontraindikasi &amp; Peringatan
                    </h4>
                    <ul className="space-y-1.5">
                      {info.halPerluDiperhatikan.map((warn, i) => (
                        <li key={i} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs leading-relaxed text-slate-600 font-semibold">
                          • {warn}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-800">Interaksi Obat</h4>
                      <ul className="space-y-1 text-xs text-slate-500 list-disc list-inside font-semibold leading-relaxed">
                        {info.interaksiObat.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-800">Efek Samping</h4>
                      <ul className="space-y-1 text-xs text-slate-500 list-disc list-inside font-semibold leading-relaxed">
                        {info.efekSamping.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-[9px] text-slate-400 text-center leading-normal pt-2 font-semibold">
            🔒 Distribusi obat resmi bersertifikat CDOB BPOM &amp; Kemenkes RI.
          </p>
        </div>
      </div>
    );
  }

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
        {/* Horizontal Filter Bar Card (Compact & Modern) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          {/* Header Filter Ringkas */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">tune</span>
              <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                Filter Pencarian Produk
              </h3>
            </div>
            
            <button
              onClick={resetFilters}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer transition-colors border-none bg-transparent"
            >
              Reset Filter
            </button>
          </div>

          {/* Inputs Grid 4-Kolom Horizontal Pipih */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* 1. Kategori Obat */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Kategori Obat
              </span>
              <select
                value={selectedKategori[0] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedKategori(val ? [val] : []);
                }}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl text-xs py-1.5 px-3 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium cursor-pointer h-8 text-slate-800 transition-colors"
              >
                <option value="">Semua Kategori</option>
                {kategoriList.map((kat) => (
                  <option key={kat} value={kat}>{kat}</option>
                ))}
              </select>
            </div>

            {/* 2. Manufaktur */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Manufaktur
              </span>
              <select
                value={selectedManufaktur[0] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedManufaktur(val ? [val] : []);
                }}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl text-xs py-1.5 px-3 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium cursor-pointer h-8 text-slate-800 transition-colors"
              >
                <option value="">Semua Manufaktur</option>
                {manufacturersList.map((mfg) => (
                  <option key={mfg} value={mfg}>{mfg}</option>
                ))}
              </select>
            </div>

            {/* 3. Kisaran Harga */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Kisaran Harga (IDR)
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={minPrice || ""}
                  onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Min"
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl text-xs py-1.5 px-2.5 focus:bg-white focus:outline-none focus:border-emerald-600 h-8 font-medium text-slate-800 transition-colors"
                />
                <span className="text-slate-300 text-xs">-</span>
                <input
                  type="number"
                  value={maxPrice || ""}
                  onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Max"
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl text-xs py-1.5 px-2.5 focus:bg-white focus:outline-none focus:border-emerald-600 h-8 font-medium text-slate-800 transition-colors"
                />
              </div>
            </div>

            {/* 4. Urutan Harga */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Urutan Harga
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl text-xs py-1.5 px-3 focus:bg-white focus:outline-none focus:border-emerald-600 font-medium cursor-pointer h-8 text-slate-800 transition-colors"
              >
                <option value="terbaru">Paling Relevan</option>
                <option value="low-to-high">Harga: Rendah ke Tinggi</option>
                <option value="high-to-low">Harga: Tinggi ke Rendah</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid Section (Modern Desktop Cards Grid) */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-heading font-bold text-lg text-slate-900">Katalog Produk</h2>
              <p className="text-slate-500 text-xs">Menampilkan {sortedProducts.length} produk ditemukan</p>
            </div>
          </div>

          {sortedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
              <p className="text-sm font-bold text-slate-700">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-400">Coba ubah kata kunci atau kriteria filter pencarian Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sortedProducts.map((p) => {
                const isOutOfStock = p.totalStock <= 0;
                const qty = localQuantities[p.id] || 1;
                const mfg = getProductManufacturer(p);
                const golongan = getProductGolongan(p);
                const expRange = getProductExpiryRange(p);
                const isColdChain =
                  p.category === "COLD_CHAIN" ||
                  p.category?.toLowerCase() === "cold chain" ||
                  p.name.toLowerCase().includes("amoxicillin") ||
                  p.name.toLowerCase().includes("insulin") ||
                  p.name.toLowerCase().includes("vaccine") ||
                  p.code.includes("AMX");

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Product Image & Badges Header (Portrait Aspect) */}
                      <div className="relative w-full h-28 bg-slate-50 rounded-lg overflow-hidden mb-2.5 border border-slate-100 flex items-center justify-center p-1.5">
                        <img
                          className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                          src={getProductImageUrl(p)}
                          alt={p.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwWGNG9klmFlTxE7qRJlM1a7CWQA41HcodSrxAo5yyi2kDDxkKfVY-ZKWSidodMppE_pXoP_mQCrcx9gRPdHjb967dBVWUoFL5AFRR5c_Jl2dQgOsaFvIFY5EDsB4KhW6Yp97g7uZJaWqjHlKz4J8OY4vHoN93-nWI0lZZOj7DhkS8ZaO6mCejJMLHI-yHbtaiqlkdO0f2skoMG2UQD7cf0ywd87rynYVJHts51V9wTivLcGooleoOrenqnrUzra16cONC2_49Y";
                          }}
                        />

                        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10">
                          {golongan === "KERAS" && (
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200/80">
                              KERAS (G)
                            </span>
                          )}
                          {golongan === "BEBAS" && (
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              BEBAS (W)
                            </span>
                          )}
                          {golongan === "PSIKOTROPIKA" && (
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/80">
                              PSIKOTROPIKA
                            </span>
                          )}
                          {isColdChain && (
                            <span className="text-[8px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/80 px-1 py-0.5 rounded flex items-center gap-0.5">
                              ❄️ Cold
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Brand & Title */}
                      <p className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase truncate">
                        {mfg}
                      </p>
                      <h3
                        onClick={() => handleOpenProductDetail(p)}
                        className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mt-0.5 mb-2 leading-snug h-8 cursor-pointer font-heading"
                      >
                        {p.name}
                      </h3>

                      {/* Specs Box Ringkas */}
                      <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-100/80 space-y-1 text-[10px] mb-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Zat Aktif:</span>
                          <span className="font-semibold text-slate-700 truncate max-w-[85px]">
                            {p.activeIngredient || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Exp Date:</span>
                          <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 text-[9px]">{expRange}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Stok:</span>
                          {isOutOfStock ? (
                            <span className="font-bold text-rose-600 font-mono text-[10px]">Habis</span>
                          ) : (
                            <span className="font-bold text-emerald-600 font-mono text-[10px]">
                              {p.totalStock} {p.unit.split(" ")[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price & Quantity Controls (Pojok Bawah) */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div>
                        <span className="text-[9px] text-slate-400 block leading-none">Harga</span>
                        {p.price > 0 ? (
                          <span className="text-xs font-extrabold text-slate-900 font-sans">
                            Rp {p.price.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 block">
                            Hubungi Sales
                          </span>
                        )}
                      </div>

                      {/* Counter & Cart Button */}
                      <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() =>
                            setLocalQuantities((prev) => ({
                              ...prev,
                              [p.id]: Math.max(1, (prev[p.id] || 1) - 1),
                            }))
                          }
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold font-mono px-1 text-slate-800">
                          {qty === undefined ? 1 : qty}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setLocalQuantities((prev) => ({
                              ...prev,
                              [p.id]: Math.min(p.totalStock, (prev[p.id] || 1) + 1),
                            }))
                          }
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          title="Tambah ke Keranjang"
                          onClick={() => addToCartWithQty(p, qty || 1)}
                          disabled={isOutOfStock || hasCdobWarning}
                          className={`w-8 h-8 rounded-lg text-white flex items-center justify-center shadow-xs cursor-pointer active:scale-95 border-none transition-all ${
                            isOutOfStock || hasCdobWarning
                              ? "bg-slate-300 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW: Search, Category Chips & Responsive Product Grid         */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW: Modern E-Commerce Medicine Catalog                        */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-4 px-1 pb-16">
        {/* Sticky Category Chips Filter Bar (Solid White - No Bleed-Through) */}
        <div className="bg-white py-2.5 px-3 rounded-2xl border border-slate-200/80 shadow-md sticky top-[104px] z-20">
          {/* Category Chips Scroll */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 py-0.5">
            {chips.map((c) => {
              const isActive = activeChip === c.label;
              return (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => {
                    triggerHapticImpact();
                    setActiveChip(c.label);
                  }}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full font-sans text-[10px] font-bold transition-all cursor-pointer border-none flex items-center gap-1 shrink-0 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs scale-105"
                      : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 active:scale-95"
                  }`}
                >
                  {c.label === "Cold Chain" ? (
                    <>
                      <span className="material-symbols-outlined text-[13px] text-blue-400">ac_unit</span>
                      <span>Cold Chain</span>
                    </>
                  ) : c.label === "Ethical" ? (
                    <>
                      <span className="material-symbols-outlined text-[13px] text-rose-500">prescriptions</span>
                      <span>Obat Keras</span>
                    </>
                  ) : c.label === "OTC" ? (
                    <>
                      <span className="material-symbols-outlined text-[13px] text-emerald-500">medication</span>
                      <span>Bebas / OTC</span>
                    </>
                  ) : (
                    <span>{c.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid (2 Columns Mobile) */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          {finalFilteredProducts.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white rounded-3xl border border-slate-200/60 p-6 space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
              <p className="text-xs font-bold text-slate-700">Tidak ada produk ditemukan</p>
              <p className="text-[10px] text-slate-400">Coba ubah kata kunci atau kata filter obat Anda.</p>
            </div>
          ) : (
            finalFilteredProducts.map((p) => {
              const isOutOfStock = p.totalStock <= 0;
              const isLowStock = p.totalStock > 0 && p.totalStock <= 5;
              const mfg = getProductManufacturer(p);
              const golongan = getProductGolongan(p);
              const isColdChain =
                p.name.toLowerCase().includes("amoxicillin") ||
                p.name.toLowerCase().includes("vaccine") ||
                p.code.toLowerCase().includes("amx") ||
                p.category.toLowerCase().includes("cold chain");

              return (
                <div 
                  key={p.id} 
                  className="bg-white rounded-2xl p-3 shadow-xs border border-slate-200/70 flex flex-col justify-between group transition-all duration-200 hover:shadow-md active:scale-[0.98] relative overflow-hidden"
                >
                  {/* Visual Image & Badges Container */}
                  <div>
                    <div className="relative aspect-square rounded-xl bg-slate-50 overflow-hidden mb-2.5 flex items-center justify-center border border-slate-100">
                      <img 
                        className="w-full h-full object-contain p-2 mix-blend-multiply transition-transform duration-300 group-hover:scale-105" 
                        alt={p.name}
                        src={getProductImageUrl(p)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwWGNG9klmFlTxE7qRJlM1a7CWQA41HcodSrxAo5yyi2kDDxkKfVY-ZKWSidodMppE_pXoP_mQCrcx9gRPdHjb967dBVWUoFL5AFRR5c_Jl2dQgOsaFvIFY5EDsB4KhW6Yp97g7uZJaWqjHlKz4J8OY4vHoN93-nWI0lZZOj7DhkS8ZaO6mCejJMLHI-yHbtaiqlkdO0f2skoMG2UQD7cf0ywd87rynYVJHts51V9wTivLcGooleoOrenqnrUzra16cONC2_49Y";
                        }}
                      />
                      
                      {/* Cold Chain Badge (top left) */}
                      {isColdChain && (
                        <div className="absolute top-1.5 left-1.5 bg-blue-50/90 backdrop-blur-xs border border-blue-200 text-blue-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
                          <span className="material-symbols-outlined text-[10px]">ac_unit</span>
                          <span>2°-8°C</span>
                        </div>
                      )}
                      
                      {/* Golongan Badge (top right) */}
                      <div className="absolute top-1.5 right-1.5">
                        {golongan === "KERAS" ? (
                          <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                            Obat Keras
                          </span>
                        ) : (
                          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                            Bebas
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Product Metadata Details */}
                    <div 
                      onClick={() => handleOpenProductDetail(p)}
                      className="space-y-1 cursor-pointer group-hover:text-primary"
                    >
                      <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider truncate">
                        {mfg}
                      </p>
                      <h3 className="font-heading font-extrabold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors" title={p.name}>
                        {p.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {p.unit}
                      </p>
                    </div>
                  </div>

                  {/* Pricing & Stock Status Bottom Block */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-slate-900 font-mono">Rp {p.price.toLocaleString("id-ID")}</p>
                        <p className="text-[8px] text-slate-400 line-through font-mono">Rp {(p.price * 1.05).toLocaleString("id-ID")}</p>
                      </div>

                      {/* Stock Dot */}
                      <div className="text-right">
                        {isOutOfStock ? (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">Habis</span>
                        ) : isLowStock ? (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">Sisa {p.totalStock}</span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">Ada Stok</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Add to Cart Action Row */}
                    <div className="flex items-center gap-1">
                      <button 
                        type="button"
                        onClick={() => {
                          triggerHapticImpact();
                          addToCartWithQty(p, 1);
                        }}
                        disabled={isOutOfStock || hasCdobWarning}
                        className={`flex-1 h-8 font-sans font-extrabold text-[10px] rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer border-none shadow-xs ${
                          isOutOfStock || hasCdobWarning
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                            : "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                        <span>+1 Box</span>
                      </button>

                      {!isOutOfStock && !hasCdobWarning && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHapticImpact();
                            addToCartWithQty(p, 10);
                          }}
                          className="px-2.5 h-8 font-mono font-extrabold text-[9.5px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer border-none shadow-xs shrink-0"
                          title="Tambah 10 Box Grosir Langsung"
                        >
                          +10
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Counter Summary Bar */}
        <div className="py-6 flex flex-col items-center text-center opacity-60">
          <span className="material-symbols-outlined text-2xl text-slate-400 mb-1">medication</span>
          <p className="font-sans text-[10px] font-bold text-slate-500">
            Menampilkan {finalFilteredProducts.length} dari {products.length} produk obat
          </p>
        </div>
      </div>
    </div>
  );
}
