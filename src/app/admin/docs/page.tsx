"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Package,
  Truck,
  CreditCard,
  Users,
  History,
  Activity,
  Layers,
  HelpCircle,
  CheckSquare,
  Sparkles,
  ChevronRight,
  Info,
  Building2,
  Lock,
  RefreshCw,
  Wallet
} from "lucide-react";

interface DocSection {
  id: string;
  title: string;
  category: string;
  icon: any;
  tabQuery?: string;
  summary: string;
  details: string[];
  workflow?: string[];
  tips?: string;
}

const docSections: DocSection[] = [
  {
    id: "overview",
    title: "1. Ikhtisar Operasional PBF (Overview)",
    category: "Operasional PBF",
    icon: Activity,
    tabQuery: "overview",
    summary: "Pusat statistik real-time omset penyaluran, notifikasi stok kritis, dan pemantauan ringkasan performa PBF.",
    details: [
      "Ringkasan Total Omset Penyaluran Obat, Total Pesanan Masuk, & Kredit Terpakai.",
      "Visualisasi Grafik Tren Omset Penyaluran & Distribusi Jenis Obat (Narkotika, Psikotropika, Prekursor, Obat Keras, Bebas).",
      "Peringatan Stok Kritis & Batch Obat Mendekati Expired (Near-Expiry < 6 Bulan)."
    ],
    tips: "Gunakan filter rentang waktu (Hari Ini, 7 Hari, Bulan Ini, Tahun Ini) untuk melihat analisis omset PBF."
  },
  {
    id: "cdob",
    title: "2. Pesanan Aktif & Verifikasi CDOB",
    category: "Operasional PBF",
    icon: CheckSquare,
    tabQuery: "cdob",
    summary: "Modul verifikasi kelayakan CDOB (Cara Distribusi Obat yang Baik) oleh APJ PBF sebelum resi & faktur diterbitkan.",
    details: [
      "Verifikasi Keabsahan Surat Pesanan (SP) Apoteker Penanggung Jawab Apotek/Klinik.",
      "Pemeriksaan Otomatis Masa Berlaku SIPA/SIPTTK Apoteker & Izin Operasional SIA/NIB.",
      "Alokasi Penjualan Berdasarkan Metode FEFO (First Expired, First Out) Secara Otomatis.",
      "Fitur Penolakan Pesanan dengan Alasan Resmi jika Terdapat Ketidaksesuaian Dokumen CDOB."
    ],
    workflow: [
      "1. Periksa file unggahan SP Apoteker dari Pemesan.",
      "2. Verifikasi kesesuaian item obat dan kuota pesanan.",
      "3. Klik 'Setujui & Terbit CDOB' untuk mengunci batch obat FEFO.",
      "4. Pesanan diteruskan ke Bagian Logistik & Pengemasan."
    ],
    tips: "PBF Admin wajib memverifikasi dokumen SP Apoteker asli sebelum menyetujui pesanan guna memenuhi regulasi BPOM."
  },
  {
    id: "obat",
    title: "3. Inventori & Manajemen Obat FEFO",
    category: "Katalog & Stok",
    icon: Package,
    tabQuery: "obat",
    summary: "Pengelolaan katalog produk obat, nomor batch, tanggal kedaluwarsa, dan pencarian Kamus Obat KFA BPOM.",
    details: [
      "Manajemen Katalog Produk Obat lengkap dengan Golongan Obat (Keras, Prekursor, Bebas, Alkes, Cold Chain).",
      "Pencatatan Nomor Batch & Tanggal Expired untuk menjaga integritas standar FEFO.",
      "Karantina Otomatis untuk batch obat yang mendekati masa expired (< 60 hari).",
      "Integrasi Pencarian Kamus Farmasi & Alat Kesehatan (KFA API BPOM) untuk otomatisasi data obat."
    ],
    workflow: [
      "1. Pilih 'Tambah Obat Baru' atau pilih obat yang ingin ditambah stoknya.",
      "2. Masukkan Nomor Batch pabrik produsen dan Tanggal Expired.",
      "3. Masukkan jumlah fisik stok yang diterima dari Industri Farmasi (IF).",
      "4. Simpan data; stok otomatis teralokasi berdasarkan FEFO."
    ],
    tips: "Gunakan fitur integrasi KFA BPOM untuk mengimpor nama obat, kategori, dan deskripsi klinis secara presisi."
  },
  {
    id: "logistik",
    title: "4. Pengiriman & Logistik CDOB",
    category: "Operasional PBF",
    icon: Truck,
    tabQuery: "logistik",
    summary: "Proses pengemasan, penerbitan resi AWB digital, pengiriman via kurir internal/ekspedisi API, dan cetak BAST CDOB.",
    details: [
      "Penerbitan Resi Digital (AWB) secara otomatis via API Logistik (Biteship / Ekspedisi Terintegrasi).",
      "Cetak Berita Acara Serah Terima (BAST CDOB) & Surat Jalan Pengiriman.",
      "Pemantauan Status Pelacakan Kurir Real-Time (Live Tracking GPS).",
      "Dukungan Pengiriman Cold Chain (Rantai Dingin) untuk Vaksin/Insulin."
    ],
    workflow: [
      "1. Buka tab Logistik & Pengiriman.",
      "2. Klik 'Proses & Terbitkan Resi' pada pesanan yang sudah siap dikemas.",
      "3. Cetak BAST CDOB & tempelkan AWB pada kemasan paket.",
      "4. Serahkan paket ke kurir logistik dan pantau resi via Live Tracking."
    ],
    tips: "Kosongkan kolom nomor resi manual jika ingin sistem melakukan auto-booking ekspedisi via API Logistik."
  },
  {
    id: "shipping",
    title: "5. Shipping API & Saldo Deposit",
    category: "Integrasi API",
    icon: Activity,
    tabQuery: "shipping",
    summary: "Monitoring penggunaan API logistik, pemotongan kuota per request, serta Top-Up Saldo Deposit via Midtrans Snap.",
    details: [
      "Monitoring Saldo Deposit API Shipping untuk otomatisasi cek ongkir & booking kurir.",
      "Rincian Struktur Biaya API: Rates Check (Rp 10/req), Tracking GPS (Rp 20/req), Order API (Bebas Biaya).",
      "Fitur Top-Up Saldo Deposit via Midtrans Snap (Support QRIS, Virtual Account, Transfer Bank).",
      "Log Panggilan API Transaksi Real-Time."
    ],
    workflow: [
      "1. Tekan tombol '+ Top-Up' pada Card Saldo Deposit.",
      "2. Pilih nominal paket top-up (Rp 50rb, 100rb, 500rb, 1jt) atau nominal custom.",
      "3. Selesaikan pembayaran via Modal Midtrans Snap.",
      "4. Pengajuan berstatus MENUNGGU APPROVAL LOGISTIK / DEVELOPER hingga disetujui."
    ],
    tips: "Saldo deposit akan terpotong secara otomatis per request API dan mengembalikan biaya ongkir bila pesanan dibatalkan."
  },
  {
    id: "kemitraan",
    title: "6. Kemitraan Apotek & Klinik",
    category: "Mitra PBF",
    icon: Building2,
    tabQuery: "kemitraan",
    summary: "Verifikasi pendaftaran akun mitra pemesan baru (Apotek, Klinik, RS) serta pengaturan Limit Kredit Tenor.",
    details: [
      "Verifikasi Legalitas Izin Operasional (SIA/NIB), SIPA APJ, & Berkas Fisik Bangunan.",
      "Pengaturan Limit Kredit Tenor (Pembayaran Mundur 14, 30, atau 60 Hari).",
      "Fitur Aktivasi, Penangguhan (Suspend), atau Penghapusan Mitra.",
      "Penetapan Status Kemitraan (Aktif, Tertunda, Ditangguhkan)."
    ],
    workflow: [
      "1. Periksa daftar mitra baru pada status 'Menunggu Verifikasi'.",
      "2. Uji keabsahan nomor SIA dan SIPA Apoteker mitra.",
      "3. Tentukan Limit Kredit Tenor yang disetujui PBF.",
      "4. Klik 'Setujui & Aktifkan Mitra'."
    ],
    tips: "Pastikan dokumen SIA & SIPA mitra masih dalam masa berlaku aktif sebelum menyetujui limit kredit."
  },
  {
    id: "pembayaran",
    title: "7. Keuangan & Verifikasi Pembayaran",
    category: "Operasional PBF",
    icon: CreditCard,
    tabQuery: "pembayaran",
    summary: "Monitoring pembayaran pesanan mitra via Virtual Account (Midtrans) maupun Manual Bank Transfer.",
    details: [
      "Verifikasi Bukti Pembayaran Manual Transfer dari Pemesan.",
      "Pengecekan Pembayaran Otomatis via Virtual Account Midtrans.",
      "Fitur Tandai Lunas Manually (Manual Override) untuk transaksi penagihan khusus.",
      "Cetak Faktur Penagihan Pajak & Bukti Kwitansi Pelunasan."
    ],
    tips: "Sistem akan otomatis memperbarui status pembayaran saat webhook Virtual Account Midtrans diterima."
  },
  {
    id: "riwayat",
    title: "8. Riwayat & Arsip Pesanan",
    category: "Operasional PBF",
    icon: History,
    tabQuery: "riwayat",
    summary: "Pusat arsip digital seluruh histori pesanan yang telah Selesai, Dibatalkan, atau Ditolak.",
    details: [
      "Pencarian & Filter Riwayat Pesanan berdasarkan Nomor SP, Nama Apotek, atau Status Pembayaran.",
      "Fitur Ekspor Data Riwayat ke Format Excel / CSV untuk kebutuhan audit laporan keuangan.",
      "Penelusuran Audit Trail Lengkap (Siapa pemesan, APJ penanggung jawab, & waktu rilis resi)."
    ],
    tips: "Gunakan filter status 'Biteship Dibatalkan' untuk merekap pesanan yang mengalami pembatalan ekspedisi."
  },
  {
    id: "pelaporan",
    title: "9. E-Report BPOM",
    category: "Kepatuhan Regulasi",
    icon: FileText,
    tabQuery: "pelaporan",
    summary: "Generasi berkas laporan penyaluran obat bulanan PBF sesuai standar format e-Report Badan POM RI.",
    details: [
      "Format Rekap Laporan Penyaluran Obat Keras, Prekursor, & Psikotropika.",
      "Ekspor File Laporan Siap Unggah ke Portal e-Report BPOM RI.",
      "Pemeriksaan Validasi Kesesuaian Nomor SIPA & Izin SIA Pemesan."
    ],
    tips: "Laporan e-Report BPOM disarankan diunduh setiap akhir bulan untuk pelaporan berkala PBF."
  },
  {
    id: "superadmin",
    title: "10. Super Admin & System Control",
    category: "Sistem",
    icon: Lock,
    tabQuery: "superadmin",
    summary: "Pengaturan kredensial pengguna admin, identitas brand/CMS, dan persetujuan Top-Up Saldo API (Khusus Developer).",
    details: [
      "Manajemen Akun Admin PBF (Buat baru, Hapus, Edit Hak Akses).",
      "Pengaturan Logo, App Name, dan Favicon Sistem.",
      "Persetujuan Top-Up Saldo API Shipping Midtrans (Khusus adm@growmexa.com).",
      "Log Audit Keamanan Sistem (Percobaan login, reset password, alert keamanan)."
    ],
    tips: "Akun utama adm@growmexa.com terlindungi secara khusus dan tidak dapat dihapus oleh admin lain."
  }
];

export default function AdminDocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(docSections.map((s) => s.category)));
    return ["ALL", ...cats];
  }, []);

  const filteredSections = useMemo(() => {
    return docSections.filter((section) => {
      const matchesCat = selectedCategory === "ALL" || section.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        section.title.toLowerCase().includes(q) ||
        section.summary.toLowerCase().includes(q) ||
        section.details.some((d) => d.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* 1. TOP HERO BANNER */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 text-white border-b border-emerald-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white text-xs font-extrabold backdrop-blur-xs transition border border-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard Admin</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Standar Kepatuhan CDOB &amp; BPOM RI</span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-emerald-400 shrink-0" />
              <span>Panduan &amp; Dokumentasi Fitur Dashboard Admin PBF</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed font-medium">
              Panduan resmi operasional fitur Dashboard Admin PBF (Pedagang Besar Farmasi). Pelajari alur verifikasi pesanan CDOB, pengelolaan stok FEFO, integrasi API shipping logistik, dan pelaporan e-Report BPOM.
            </p>
          </div>

          {/* Search Bar inside Hero */}
          <div className="pt-2">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari panduan fitur (contoh: CDOB, FEFO, Biteship, Top-Up, KFA BPOM)..."
                className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-semibold rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT CONTAINERS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT SIDEBAR / STICKY TABLE OF CONTENTS */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs sticky top-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Layers className="w-4 h-4 text-emerald-700" />
                <h3 className="font-extrabold text-sm text-slate-900">Daftar Modul Fitur</h3>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1.5 pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${selectedCategory === cat
                      ? "bg-emerald-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    {cat === "ALL" ? "Semua Topik" : cat}
                  </button>
                ))}
              </div>

              {/* Quick Navigation Links */}
              <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                {filteredSections.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
                    >
                      <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{sec.title}</span>
                    </a>
                  );
                })}
              </nav>

              <div className="pt-2 border-t border-slate-100 text-center">
                <Link
                  href="/admin/dashboard"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Buka Dashboard Admin</span>
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: DETAILED GUIDES */}
          <div className="lg:col-span-3 space-y-6">
            {filteredSections.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800">Panduan Tidak Ditemukan</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tidak ada panduan fitur yang cocok dengan kata kunci &quot;{searchQuery}&quot;. Coba gunakan kata kunci lain seperti &quot;CDOB&quot;, &quot;FEFO&quot;, &quot;Resi&quot;, atau &quot;Midtrans&quot;.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("ALL");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Reset Pencarian
                </button>
              </div>
            ) : (
              filteredSections.map((sec) => {
                const Icon = sec.icon;
                return (
                  <section
                    key={sec.id}
                    id={sec.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5 scroll-mt-6"
                  >
                    {/* Section Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-emerald-700 shrink-0">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md border border-emerald-200">
                            {sec.category}
                          </span>
                          <h2 className="text-lg font-black text-slate-900 mt-1">
                            {sec.title}
                          </h2>
                        </div>
                      </div>

                      {sec.tabQuery && (
                        <Link
                          href={`/admin/dashboard?tab=${sec.tabQuery}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-2xs transition shrink-0 self-start sm:self-auto"
                        >
                          <span>Buka Fitur di Dashboard</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                      {sec.summary}
                    </p>

                    {/* Details Bullet Points */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Fungsi &amp; Kemampuan Fitur:</span>
                      </h4>
                      <ul className="grid grid-cols-1 gap-2 pl-1">
                        {sec.details.map((detail, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-slate-700 font-medium bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Workflow / Langkah Operasional */}
                    {sec.workflow && (
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>Langkah Operasional PBF:</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {sec.workflow.map((step, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-xl text-xs font-semibold text-slate-800 font-sans"
                            >
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pro Tip */}
                    {sec.tips && (
                      <div className="p-3.5 bg-emerald-900 text-white rounded-2xl text-xs flex items-start gap-2.5 shadow-2xs">
                        <Info className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-200 font-bold block mb-0.5">Tips Operasional:</strong>
                          <span className="text-emerald-100 font-medium leading-relaxed">{sec.tips}</span>
                        </div>
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
