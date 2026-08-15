"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  FileSignature,
  CreditCard,
  Truck,
  ShieldCheck,
  FileText
} from "lucide-react";
import { triggerHapticImpact } from "@/lib/mobile-haptics";
import { getBiteshipStatusMeta } from "@/lib/biteship-status";

interface DashboardOverviewProps {
  institution: any;
  orders: any[];
  setActiveTab: (tab: any) => void;
  setViewingDetailOrder: (order: any) => void;
  setViewingFaktur: (order: any) => void;
  handleConfirmDelivery: (orderId: string) => void;
}

function calculateOrderTotals(order: any) {
  const subtotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const vat = Math.round(subtotal * 0.11);

  const addr = order.shippingAddress || "";
  const feeMatch = addr.match(/-\s*Rp\s*([0-9.,]+)/);
  let shippingFee = 0;
  if (feeMatch && feeMatch[1]) {
    shippingFee = parseInt(feeMatch[1].replace(/[.,]/g, ""), 10) || 0;
  } else if (addr.includes("Kurir: Standard Flat Rate")) {
    const isColdChain = order.items.some((item: any) =>
      item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain" ||
      item.product?.name?.toLowerCase().includes("insulin") || item.product?.code?.toLowerCase().includes("amx")
    );
    shippingFee = isColdChain ? 85000 : 50000;
  } else {
    shippingFee = 50000;
  }

  const total = subtotal + vat + shippingFee;
  return { subtotal, vat, shippingFee, total };
}

function getCourierName(shipment: any): string {
  if (!shipment) return "KURIR: PBF GROVMEXA EXPRESS";

  const addr = shipment.shippingAddress || "";
  const match = addr.match(/Kurir:\s*([^|[\]\n-]+)/i);
  let courier = match ? match[1].trim() : "";

  if (!courier) {
    if (shipment.trackingNumber) {
      courier = `PBF EXPRESS (${shipment.trackingNumber})`;
    } else if (shipment.biteshipOrderId) {
      courier = "BITESHIP LOGISTICS";
    } else {
      courier = "PBF GROVMEXA EXPRESS";
    }
  }

  return `KURIR: ${courier.toUpperCase()}`;
}

export default function DashboardOverview({
  institution,
  orders,
  setActiveTab,
  setViewingDetailOrder,
  setViewingFaktur,
  handleConfirmDelivery,
}: DashboardOverviewProps) {
  const [animateWidth, setAnimateWidth] = useState(0);

  // Penjumlahan tagihan belum lunas
  const unpaidOrders = orders.filter((o) => o.paymentStatus !== "PAID" && o.status !== "REJECTED");
  const totalUnpaidAmount = unpaidOrders.reduce((sum, o) => {
    return sum + calculateOrderTotals(o).total;
  }, 0);

  // Sisa Kredit & Limit Kredit (Integrasi Real Database)
  const creditLimit = Number(institution.creditLimit || 0);
  const currentDebt = Number(institution.currentDebt || 0);
  const sisaKredit = Math.max(0, creditLimit - currentDebt);
  const progressRatio = creditLimit > 0 ? Math.min(100, Math.max(0, (sisaKredit / creditLimit) * 100)) : 0;
  const limitUsageRatio = creditLimit > 0 ? currentDebt / creditLimit : 0;
  const limitStatusLabel = creditLimit > 0
    ? (limitUsageRatio > 0.8 ? "Kritis" : limitUsageRatio > 0.5 ? "Cukup" : "Sangat Baik")
    : "Pengajuan Limit";

  useEffect(() => {
    // Jalankan animasi progress bar setelah render awal
    const timer = setTimeout(() => {
      setAnimateWidth(progressRatio);
    }, 300);
    return () => clearTimeout(timer);
  }, [progressRatio]);

  // Pengiriman aktif dari database real: tampilkan maksimal 3 pesanan aktif mitra
  const activeOnly = orders.filter((o) => o.status !== "CANCELLED" && o.status !== "REJECTED").slice(0, 3);
  const realActiveShipments = activeOnly.length > 0 ? activeOnly : orders.slice(0, 3);

  // Integrasi Dinamis 1: Tren Pengeluaran 3 Bulan Terakhir dari Real Orders Database
  const now = new Date();
  const monthlySpendingData = Array.from({ length: 3 }).map((_, idx) => {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - (2 - idx), 1);
    const monthName = targetDate.toLocaleDateString("id-ID", { month: "short" });
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    const monthTotal = orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return o.status !== "REJECTED" && d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      })
      .reduce((sum, o) => sum + calculateOrderTotals(o).total, 0);

    return {
      month: monthName,
      val: monthTotal,
      label: monthTotal >= 1000000 
        ? `${(monthTotal / 1000000).toFixed(1)}M` 
        : monthTotal >= 1000 
        ? `${Math.round(monthTotal / 1000)}K` 
        : `${monthTotal}`,
    };
  });

  const maxSpending = Math.max(...monthlySpendingData.map((d) => d.val), 1);
  const monthlySpendingBars = monthlySpendingData.map((d) => ({
    ...d,
    height: d.val === 0 ? "15%" : `${Math.max(18, Math.round((d.val / maxSpending) * 100))}%`,
  }));

  // Integrasi Dinamis 2: Proporsi Pembelian Kategori Sediaan Obat dari Real Orders Items
  let totalCategoryItems = 0;
  const categoryCounts = { keras: 0, bebas: 0, coldChain: 0 };

  orders.forEach((o) => {
    if (o.status === "REJECTED") return;
    (o.items || []).forEach((it: any) => {
      const cat = (it.product?.category || "").toLowerCase();
      const name = (it.product?.name || "").toLowerCase();
      const qty = Number(it.quantity || 1);
      totalCategoryItems += qty;

      if (cat.includes("cold") || name.includes("insulin") || cat.includes("psikotropika")) {
        categoryCounts.coldChain += qty;
      } else if (cat.includes("keras") || cat.includes("daftar g") || cat.includes("resep")) {
        categoryCounts.keras += qty;
      } else {
        categoryCounts.bebas += qty;
      }
    });
  });

  const kerasPct = totalCategoryItems > 0 ? Math.round((categoryCounts.keras / totalCategoryItems) * 100) : 60;
  const bebasPct = totalCategoryItems > 0 ? Math.round((categoryCounts.bebas / totalCategoryItems) * 100) : 30;
  const coldPct = totalCategoryItems > 0 ? Math.max(0, 100 - kerasPct - bebasPct) : 10;

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />

      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW: Bento Grid Dashboard                                     */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-6 pb-12 md:pb-16">
        {/* 1. BANNER PROFIL MITRA (Slim & Professional Desktop Banner) */}
        <section>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-5 text-white shadow-md mb-6 border border-white/10">
            {/* Background Decorative Pattern / Glow */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-4">
              {/* Kiri: Avatar & Info Apotek */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 text-xl font-bold tracking-wider text-emerald-200 backdrop-blur-md border border-white/20 shadow-inner shrink-0 font-heading">
                  {institution.name ? institution.name.substring(0, 2).toUpperCase() : "AP"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold tracking-tight text-white font-heading truncate">
                      {institution.name}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-200 border border-emerald-400/30 shrink-0">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                      Mitra Terverifikasi
                    </span>
                  </div>
                  
                  {/* Status Metadata Baris Bawah */}
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-emerald-100/80">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      ID: <strong className="text-white font-mono">PBF-882910</strong>
                    </span>
                    <span className="text-emerald-400/40">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-emerald-300" />
                      {orders.length} Pesanan Tercatat
                    </span>
                    <span className="text-emerald-400/40">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <FileSignature className="h-3.5 w-3.5 text-emerald-300" />
                      {orders.filter(o => o.status === "PENDING_APPROVAL" && !o.spSignature).length} e-Sign SP Tertunda
                    </span>
                  </div>
                </div>
              </div>

              {/* Kanan: Status Akun Pill Card */}
              <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/15 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200/70">
                    Status Akun
                  </p>
                  <p className="text-sm font-bold text-white leading-tight">
                    Aktif
                  </p>
                </div>
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400"></span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Warning Banner: Legalitas SIA / SIPTTK Mendekati Kadaluwarsa */}
        {institution.siaExpiry && (new Date(institution.siaExpiry).getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000 && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-4 text-xs text-amber-950 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <div>
                <h4 className="font-bold text-amber-950">Peringatan Masa Berlaku Legalitas SIA / SIPTTK</h4>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Izin Operasional Apotek ({institution.siaNumber || "SIA"}) berlaku hingga{" "}
                  <strong>{new Date(institution.siaExpiry).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong>. Segera lakukan pembaruan untuk menghindari kendala pemesanan sediaan farmasi.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("tagihan")}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-[11px] shrink-0 transition-colors shadow-sm border-none cursor-pointer"
            >
              Perbarui Berkas
            </button>
          </div>
        )}

        {/* Grid 12 cols layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Content Column (Left/Center - 9 Cols) */}
          <div className="lg:col-span-9 space-y-6">

            {/* 2. METRIC CARDS (Phase 3 Refactored: Standardized Badges & Progress Lines) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Sisa Limit Kredit */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-slate-500 mb-2">
                    <span className="text-xs font-semibold text-slate-600 tracking-wide">Sisa Limit Kredit</span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${creditLimit > 0 ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-amber-700 bg-amber-50 border border-amber-200"}`}>
                      {creditLimit > 0 ? `${progressRatio.toFixed(0)}% Tersedia` : "Belum Ada Limit"}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans my-1">
                    Rp {sisaKredit.toLocaleString("id-ID")}
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-2 border border-slate-200/50">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressRatio}%` }}
                    ></div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Total Limit: <span className="text-slate-700 font-bold font-sans">Rp {creditLimit.toLocaleString("id-ID")}</span>
                  </span>
                </div>
              </div>

              {/* Jatuh Tempo */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-slate-500 mb-2">
                    <span className="text-xs font-semibold text-slate-600 tracking-wide">Jatuh Tempo</span>
                    {unpaidOrders.length > 0 ? (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">Kritis</span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">Aman</span>
                    )}
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans my-1">
                    Rp {totalUnpaidAmount.toLocaleString("id-ID")}
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-2 border border-slate-200/50">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${unpaidOrders.length > 0 ? "bg-rose-600 w-full" : "bg-emerald-500 w-full"}`}
                    ></div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Status: <span className="text-slate-700 font-bold font-sans">{unpaidOrders.length} Invoice kritis</span>
                  </span>
                </div>
              </div>

              {/* Pesanan Bulan Ini */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-slate-500 mb-2">
                    <span className="text-xs font-semibold text-slate-600 tracking-wide">Pesanan Bulan Ini</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">+12.4% vs bln lalu</span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans my-1">
                    {orders.length} Pesanan
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden my-2 border border-slate-200/50">
                    <div className="bg-emerald-600 h-full rounded-full w-3/4 transition-all duration-1000 ease-out"></div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Monitoring transaksi berjalan
                  </span>
                </div>
              </div>
            </section>

            {/* 3. B2B SPENDING ANALYTICS CHARTS (CLEAN & SPACIOUS) */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Chart 1: Tren Pengeluaran Bulanan */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="font-heading font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">analytics</span>
                    Tren Pengeluaran Bulanan (B2B)
                  </h4>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-100">
                    3 Bulan Terakhir
                  </span>
                </div>
                <div className="h-44 w-full flex items-end justify-between px-6 pt-6 relative border-b border-slate-100">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 text-[8px] font-mono text-slate-400 pb-6 pt-2">
                    <div className="border-b border-dashed border-slate-300 w-full"></div>
                    <div className="border-b border-dashed border-slate-300 w-full"></div>
                    <div className="border-b border-dashed border-slate-300 w-full"></div>
                  </div>
                  {monthlySpendingBars.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 z-10 flex-1 group relative">
                      <div className="text-[9px] font-mono font-bold text-white bg-slate-900 px-2.5 py-0.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 pointer-events-none whitespace-nowrap z-20">
                        Rp {item.label}
                      </div>
                      <div
                        className="w-10 bg-gradient-to-t from-emerald-600/80 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 rounded-t-md transition-all duration-300 cursor-pointer shadow-xs hover:scale-x-[1.05] hover:scale-y-[1.03] origin-bottom"
                        style={{ height: item.height }}
                      ></div>
                      <span className="text-[10px] font-bold text-slate-600 mt-1">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: Proporsi Pembelian Obat */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="font-heading font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-teal-600 text-[18px]">pie_chart</span>
                    Proporsi Pembelian Sediaan
                  </h4>
                  <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-bold border border-teal-100">
                    Kategori Obat
                  </span>
                </div>
                <div className="flex items-center justify-around h-44">
                  <div className="relative w-28 h-28 hover:scale-105 transition-transform duration-300">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#059669" strokeWidth="3.2" strokeDasharray={`${kerasPct} ${100 - kerasPct}`} strokeDashoffset="0" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#0d9488" strokeWidth="3.2" strokeDasharray={`${bebasPct} ${100 - bebasPct}`} strokeDashoffset={`-${kerasPct}`} />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#0284c7" strokeWidth="3.2" strokeDasharray={`${coldPct} ${100 - coldPct}`} strokeDashoffset={`-${kerasPct + bebasPct}`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[13px] font-extrabold text-slate-900 font-mono">100%</span>
                      <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Meds</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex items-center gap-2 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 shadow-xs"></span>
                      <span className="text-slate-700 font-bold">Obat Keras ({kerasPct}%)</span>
                    </div>
                    <div className="flex items-center gap-2 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0 shadow-xs"></span>
                      <span className="text-slate-700 font-bold">Obat Bebas ({bebasPct}%)</span>
                    </div>
                    <div className="flex items-center gap-2 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0 shadow-xs"></span>
                      <span className="text-slate-700 font-bold">Cold Chain ({coldPct}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. TABEL PESANAN TERBARU (CLEAN TABLE) */}
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900">Pesanan Terbaru</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Monitoring real-time status logistik sediaan obat</p>
                </div>
                <button
                  onClick={() => setActiveTab("riwayat")}
                  className="text-emerald-700 font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
                >
                  Lihat Semua <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-bold">
                    <tr>
                      <th className="px-6 py-3 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 uppercase tracking-wider text-right">Total IDR</th>
                      <th className="px-6 py-3 uppercase tracking-wider text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                    {orders.slice(0, 4).map((order) => {
                      const { total } = calculateOrderTotals(order);
                      return (
                        <tr
                          key={order.id}
                          onClick={() => setViewingDetailOrder(order)}
                          className="hover:bg-surface-container-low/30 transition-colors h-14 cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <p className="font-bold text-foreground">{order.orderNumber}</p>
                            <p className="text-[10px] text-on-surface-variant mt-0.5 font-mono">
                              {new Date(order.createdAt).toLocaleDateString("id-ID")}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            {order.status === "PENDING_APPROVAL" && !order.spSignature && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-900 border border-red-300 font-bold text-[9px] uppercase">
                                Menunggu e-Sign
                              </span>
                            )}
                            {order.status === "PENDING_APPROVAL" && order.spSignature && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-955 border border-amber-300 font-bold text-[9px] uppercase">
                                Verifikasi CDOB
                              </span>
                            )}
                            {order.status === "PENDING_SHIPPING" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-850 border border-emerald-200 font-bold text-[9px] uppercase">
                                Diproses
                              </span>
                            )}
                            {order.status === "SHIPPED" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[9px] uppercase">
                                Dikirim
                              </span>
                            )}
                            {order.status === "DELIVERED" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-955 border border-emerald-300 font-bold text-[9px] uppercase">
                                Selesai
                              </span>
                            )}
                            {order.status === "REJECTED" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-200 text-red-955 border border-red-300 font-bold text-[9px] uppercase">
                                Ditolak PBF
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-bold font-mono">
                            Rp {total.toLocaleString("id-ID")}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {order.status === "PENDING_APPROVAL" && !order.spSignature ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab("riwayat");
                                  alert("Silakan klik 'Tanda Tangan' pada order di riwayat.");
                                }}
                                className="px-3.5 py-1.5 bg-primary text-white hover:bg-primary/95 font-bold rounded-lg transition-all text-[10px] cursor-pointer shadow-sm border-none active:scale-95 duration-100"
                              >
                                Sign
                              </button>
                            ) : order.status === "SHIPPED" ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingDetailOrder(order);
                                }}
                                className="px-3.5 py-1.5 bg-primary text-white hover:bg-primary/95 font-bold rounded-lg transition-all text-[10px] cursor-pointer shadow-sm border-none active:scale-95 duration-100"
                              >
                                Lacak
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingDetailOrder(order);
                                }}
                                className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-variant text-on-surface-variant rounded-lg font-bold transition-all text-[10px] border-none active:scale-95 duration-100"
                              >
                                Detail
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-surface-container-low/30 text-center border-t border-outline-variant/15 text-xs text-on-surface-variant font-medium">
                Menampilkan {Math.min(4, orders.length)} dari {orders.length} pesanan terakhir
              </div>
            </section>
          </div>

          {/* Secondary Actions Column (Right - 3 Cols) (Phase 4 Refactored: Harmonized Horizontal Cards) */}
          <aside className="lg:col-span-3 space-y-4">
            <h5 className="text-[10px] uppercase font-bold tracking-widest text-slate-400 px-1">Aksi Cepat</h5>

            {/* Card 1: Katalog Produk */}
            <div
              onClick={() => setActiveTab("belanja")}
              className="bg-white border border-slate-200/80 hover:border-emerald-500/50 rounded-2xl p-4 flex items-center gap-3.5 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">Katalog Produk</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">10.000+ sediaan obat</p>
              </div>
            </div>

            {/* Card 2: Bukti Bayar */}
            <div
              onClick={() => setActiveTab("tagihan")}
              className="bg-white border border-slate-200/80 hover:border-emerald-500/50 rounded-2xl p-4 flex items-center gap-3.5 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">Bukti Bayar & TOP</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">Pelunasan & konfirmasi</p>
              </div>
            </div>

            {/* Card 3: e-Sign SP */}
            <div
              onClick={() => setActiveTab("riwayat")}
              className="bg-white border border-slate-200/80 hover:border-emerald-500/50 rounded-2xl p-4 flex items-center gap-3.5 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer relative group shadow-2xs"
            >
              {orders.filter((o) => o.status === "PENDING_APPROVAL" && !o.spSignature).length > 0 && (
                <span className="absolute top-3.5 right-3.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
              )}
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">draw</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">e-Sign Surat Pesanan</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                  {orders.filter((o) => o.status === "PENDING_APPROVAL" && !o.spSignature).length} SP Menunggu TTD
                </p>
              </div>
            </div>

            <div className="pt-2">
              <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20 space-y-1.5 shadow-xs hover:bg-primary/10 transition-colors duration-300">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <p className="text-[10px] font-bold uppercase tracking-wider">Tips Operasional</p>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  Gunakan fitur e-Sign SP untuk mempercepat verifikasi CDOB PBF dan mempercepat pengiriman obat keras Anda hingga 24 jam lebih awal.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW: Visual Status Variant Dashboard                           */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-6 px-1">
        {/* Header Profile Section */}
        <section className="bg-gradient-to-r from-primary to-primary/85 rounded-2xl p-5 text-on-primary shadow-md flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <div>
              <h1 className="font-heading font-black text-base text-white leading-snug">{institution.name}</h1>
              <p className="text-[10px] text-white/80 font-medium mt-0.5">
                ID Pelanggan: {institution.registrationNumber || "PBF-99210-JKT"}
              </p>
            </div>
          </div>
          <div className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/20 text-center shrink-0">
            <p className="text-[8px] text-white/70 uppercase tracking-wider font-bold">Status</p>
            <p className="text-white font-bold text-[10px]">Aktif</p>
          </div>
        </section>

        {/* Credit Limit Summary (Tokopedia / Alodokter Class Hero Card) */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/90 hover:shadow-md transition-all duration-300 relative overflow-hidden">
          {/* Subtle Background Glow Accent */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex justify-between items-start mb-3 relative z-10">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Sisa Kredit TOP 30 Hari
              </span>
              <span className="text-xl font-black text-slate-900 font-mono mt-0.5">
                Rp {sisaKredit.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Plafon Limit</span>
              <span className="text-xs font-black text-slate-700 font-mono">Rp {institution.creditLimit.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/50 relative z-10">
            <div
              className={`h-full transition-all duration-1000 ease-out rounded-full ${limitUsageRatio > 0.8 ? "bg-rose-500" : limitUsageRatio > 0.5 ? "bg-amber-500" : "bg-emerald-600"
                }`}
              style={{ width: `${animateWidth}%` }}
            ></div>
          </div>

          <div className="mt-3.5 flex items-center justify-between relative z-10 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-emerald-600 text-sm">event_repeat</span>
              <span className="text-[10.5px] font-extrabold text-slate-600">Jatuh tempo {institution.topDays || 30} hari lagi</span>
            </div>
            <button
              onClick={() => {
                triggerHapticImpact();
                setActiveTab("tagihan");
              }}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10.5px] rounded-xl shadow-xs active:scale-95 transition-all border-none cursor-pointer flex items-center gap-1"
            >
              <span>Bayar Tagihan</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* Quick Actions Grid (6-Tile Premium Dock) */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-slate-800 tracking-tight">Akses Cepat</h2>
            <span className="text-[10px] font-semibold text-slate-400">PBF Mobile Features</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* 1. Katalog Obat PBF */}
            <button
              onClick={() => {
                triggerHapticImpact();
                setActiveTab("belanja");
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-3.5 bg-white rounded-2xl shadow-2xs active:scale-95 transition-all duration-150 border border-slate-200/80 cursor-pointer hover:border-emerald-500/40 hover:shadow-md group relative"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[10.5px] font-extrabold text-slate-700 text-center leading-tight">Katalog Obat</span>
            </button>

            {/* 2. E-Sign SP (Surat Pesanan CDOB) */}
            <button
              onClick={() => {
                triggerHapticImpact();
                setActiveTab("riwayat");
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-3.5 bg-white rounded-2xl shadow-2xs active:scale-95 transition-all duration-150 border border-slate-200/80 cursor-pointer hover:border-emerald-500/40 hover:shadow-md group relative"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                <FileSignature className="w-5 h-5 stroke-[2]" />
                {orders.filter((o: any) => o.status === "PENDING_APPROVAL" && !o.spSignature).length > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[8.5px] font-black leading-none border border-white animate-pulse">
                    {orders.filter((o: any) => o.status === "PENDING_APPROVAL" && !o.spSignature).length}
                  </span>
                )}
              </div>
              <span className="text-[10.5px] font-extrabold text-slate-700 text-center leading-tight">E-Sign SP</span>
            </button>

            {/* 3. Pelunasan TOP & Tagihan */}
            <button
              onClick={() => {
                triggerHapticImpact();
                setActiveTab("tagihan");
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-3.5 bg-white rounded-2xl shadow-2xs active:scale-95 transition-all duration-150 border border-slate-200/80 cursor-pointer hover:border-emerald-500/40 hover:shadow-md group relative"
            >
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[10.5px] font-extrabold text-slate-700 text-center leading-tight">Bayar TOP</span>
            </button>

            {/* 4. Lacak Pengiriman Kurir */}
            <button
              onClick={() => {
                triggerHapticImpact();
                setActiveTab("status");
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-3.5 bg-white rounded-2xl shadow-2xs active:scale-95 transition-all duration-150 border border-slate-200/80 cursor-pointer hover:border-emerald-500/40 hover:shadow-md group relative"
            >
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform relative">
                <Truck className="w-5 h-5 stroke-[2]" />
                {realActiveShipments.length > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white animate-ping"></span>
                )}
              </div>
              <span className="text-[10.5px] font-extrabold text-slate-700 text-center leading-tight">Lacak Kurir</span>
            </button>

            {/* 5. Legalitas SIA & SIPA */}
            <button
              onClick={() => {
                triggerHapticImpact();
                setActiveTab("legalitas");
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-3.5 bg-white rounded-2xl shadow-2xs active:scale-95 transition-all duration-150 border border-slate-200/80 cursor-pointer hover:border-emerald-500/40 hover:shadow-md group relative"
            >
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[10.5px] font-extrabold text-slate-700 text-center leading-tight">Legalitas SIA</span>
            </button>

            {/* 6. Faktur & Dokumen PDF */}
            <button
              onClick={() => {
                triggerHapticImpact();
                setActiveTab("dokumen");
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-3.5 bg-white rounded-2xl shadow-2xs active:scale-95 transition-all duration-150 border border-slate-200/80 cursor-pointer hover:border-emerald-500/40 hover:shadow-md group relative"
            >
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[10.5px] font-extrabold text-slate-700 text-center leading-tight">Faktur PDF</span>
            </button>
          </div>
        </section>

        {/* Active Shipments */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-sm font-black">Pengiriman Aktif</h2>
            <button
              onClick={() => setActiveTab("riwayat")}
              className="text-primary text-[10px] font-bold border-none bg-transparent cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>

          <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2 -mx-4 px-4">
            {realActiveShipments.length > 0 ? (
              realActiveShipments.map((shipment) => {
                const isDelivered = shipment.status === "DELIVERED";
                const isShipped = shipment.status === "SHIPPED";

                return (
                  <div
                    key={shipment.id}
                    onClick={() => {
                      if (setViewingDetailOrder) setViewingDetailOrder(shipment);
                      else setActiveTab("status");
                    }}
                    className="min-w-[285px] max-w-[285px] bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col gap-3 active:scale-[0.99] transition-all duration-100 cursor-pointer hover:border-emerald-500/50 hover:shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${isDelivered ? "bg-emerald-50 text-emerald-600" : isShipped ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
                          <span className="material-symbols-outlined">{isDelivered ? "check_circle" : isShipped ? "local_shipping" : "inventory"}</span>
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 truncate max-w-[150px]">{shipment.orderNumber}</p>
                          <p className="text-[9px] text-slate-500 font-medium">
                            {isDelivered ? "Estimasi Tiba: Selesai" : isShipped ? "Estimasi Tiba: Hari Ini" : "Estimasi Tiba: Besok"}
                          </p>
                        </div>
                      </div>
                      {isShipped && (
                        <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-base animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                        </div>
                      )}
                      {isDelivered && (
                        <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                        </div>
                      )}
                    </div>

                    {isShipped ? (
                      <div className="relative h-24 w-full rounded-xl overflow-hidden border border-slate-200">
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAALaaR7an7VLifbMOEEWX1en_fjaSdHx4voL57p8ErU3BKiOgtk0DsaEAOFG9aJLwxmzMn082xMJySFOUJoxOsFaIfY0CbRJKl5kLlddNudcPfotCvUY3c8c6eJwDBei1WHlElM4yvfCiYXUpEcIoa6_n2RLhY9XAIwoTEzn1hLj0ZPKW6u-MmCu3siAefyqGAL55sDDt_ADm8g_f81FnOVed-QAyhcBr0VuLBqCuz2G7Oz_xopxaob6umqCfkLhw_UN6Tg72MewQ')" }}
                        ></div>
                        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur px-2 py-0.5 rounded-md text-[8px] font-black text-blue-700 uppercase shadow-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                          {getCourierName(shipment)}
                        </div>
                      </div>
                    ) : isDelivered ? (
                      <div className="h-24 w-full rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-col items-center justify-center gap-1 text-emerald-700">
                        <span className="material-symbols-outlined text-2xl text-emerald-600">verified</span>
                        <span className="text-[10px] font-black uppercase tracking-wider">Pesanan Tiba & Terverifikasi</span>
                        <span className="text-[8.5px] font-extrabold text-emerald-600/90">{getCourierName(shipment)}</span>
                      </div>
                    ) : (
                      <div className="h-24 w-full rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-1 text-slate-400">
                        <span className="material-symbols-outlined text-2xl text-slate-400">hourglass_top</span>
                        <span className="text-[10px] font-bold italic">Menunggu Pick-up Kurir PBF</span>
                        <span className="text-[8.5px] font-bold text-slate-500 uppercase">{getCourierName(shipment)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px]">
                      {(() => {
                        const biteshipMeta = getBiteshipStatusMeta(shipment.biteshipStatus, shipment.status);
                        const isColdChainOrder = (shipment.items || []).some((it: any) =>
                          it.product?.category === "COLD_CHAIN" || it.product?.category?.toLowerCase().includes("cold") ||
                          it.product?.name?.toLowerCase().includes("insulin") || it.product?.name?.toLowerCase().includes("vaccine")
                        );

                        return (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full font-black text-[9px] ${biteshipMeta.badgeClass}`}>
                              {biteshipMeta.label}
                            </span>
                            {isColdChainOrder && (
                              <span className="px-2 py-0.5 rounded-full font-black text-[8.5px] bg-cyan-50 text-cyan-800 border border-cyan-200/80 flex items-center gap-0.5">
                                <span>🧊</span> Suhu 2-8°C
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      <span className="text-slate-600 font-extrabold shrink-0">{shipment.items?.length || 1} Item</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
                <p className="text-xs font-bold text-slate-700">Belum Ada Pengiriman Aktif</p>
                <p className="text-[10px] text-slate-500 font-medium">Semua pesanan Anda telah tiba atau buat Surat Pesanan baru di katalog.</p>
                <button
                  onClick={() => setActiveTab("belanja")}
                  className="mt-2 px-4 py-1.5 bg-emerald-600 text-white font-extrabold text-[10px] rounded-xl border-none cursor-pointer active:scale-95 transition-all"
                >
                  Buka Katalog Obat
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Recent Orders */}
        <section className="pb-8">
          <h2 className="text-sm font-black mb-4">Pesanan Terbaru</h2>
          <div className="space-y-3">
            {orders.slice(0, 3).map((o) => {
              const { total } = calculateOrderTotals(o);
              const isShipped = o.status === "SHIPPED";
              const isDelivered = o.status === "DELIVERED";
              const isPendingSign = o.status === "PENDING_APPROVAL" && !o.spSignature;
              const isPendingShip = o.status === "PENDING_SHIPPING" || (o.status === "PENDING_APPROVAL" && o.spSignature);
              const isRejected = o.status === "REJECTED";

              return (
                <div
                  key={o.id}
                  onClick={() => setViewingDetailOrder(o)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/10 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:scale-[0.99] transition-all duration-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                      {isDelivered ? (
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      ) : isPendingSign ? (
                        <span className="material-symbols-outlined text-lg">description</span>
                      ) : (
                        <span className="material-symbols-outlined text-lg">receipt_long</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{o.orderNumber}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono font-medium">
                        {new Date(o.createdAt).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })} • Rp {total.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  {isShipped && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100">Dikirim</span>
                  )}
                  {isPendingSign && (
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold border border-red-100">Sign SP</span>
                  )}
                  {isDelivered && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100">Selesai</span>
                  )}
                  {isPendingShip && (
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold border border-orange-100">Diproses</span>
                  )}
                  {isRejected && (
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold border border-red-100">Batal</span>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setActiveTab("riwayat")}
            className="w-full mt-4 py-3 border border-primary text-primary font-bold rounded-xl active:bg-primary/5 transition-colors cursor-pointer text-xs bg-transparent"
          >
            Lihat Riwayat Pesanan
          </button>
        </section>
      </div>
    </div>
  );
}
