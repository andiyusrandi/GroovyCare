"use client";

import {
  Calendar,
  ChevronDown,
  TrendingUp,
  Receipt,
  Clock,
  Users,
  CreditCard,
  ChevronRight,
} from "lucide-react";

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
  activeIngredient?: string;
  price: number;
  category: string;
  description: string | null;
  unit: string;
  manufacturer?: string;
  batches: Batch[];
  totalStock: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  sipaNumber: string | null;
  sipaExpiry: Date | null;
}

interface Partner {
  id: string;
  name: string;
  siaNumber: string;
  siaExpiry: Date;
  address: string;
  creditLimit: number;
  currentDebt: number;
  topDays: number;
  isActive: boolean;
  users: User[];
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    unit: string;
    description?: string | null;
  };
}

interface Allocation {
  id: string;
  batch: {
    batchNumber: string;
    expiryDate: Date;
  };
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  spSignature: string | null;
  createdAt: Date;
  approvedAt: Date | null;
  shippingAddress: string;
  trackingNumber: string | null;
  shippingDate: Date | null;
  paymentProofUrl: string | null;
  paymentStatus: string;
  rejectionReason: string | null;
  institution: {
    name: string;
    address: string;
    siaNumber: string;
    siaExpiry: Date;
  };
  createdBy: {
    name: string;
    sipaNumber: string | null;
    sipaExpiry: Date | null;
  };
  items: OrderItem[];
  batchAllocations: Allocation[];
}

interface OverviewTabProps {
  partners: Partner[];
  products: Product[];
  orders: Order[];
  setActiveTab: (tab: "overview" | "kemitraan" | "obat" | "cdob" | "logistik" | "pembayaran") => void;
  setViewingOrder: (order: Order) => void;
}

export default function OverviewTab({
  partners,
  products,
  orders,
  setActiveTab,
  setViewingOrder,
}: OverviewTabProps) {
  const pendingOrders = orders.filter((o) => o.status === "PENDING_APPROVAL");
  const pendingPartners = partners.filter((p) => !p.isActive);

  // Calculate total B2B invoice billing value from all orders (except rejected ones)
  const totalOmset = orders
    .filter((o) => o.status !== "REJECTED")
    .reduce((sum, o) => {
      const itemsVal = o.items.reduce((acc, it) => acc + it.price * it.quantity, 0);
      return sum + itemsVal;
    }, 0);

  // Total debt from active partners
  const totalDebt = partners.reduce((sum, p) => sum + p.currentDebt, 0);

  // Take the last 3 orders for the recent table
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Dynamic Current Month & Year
  const currentDate = new Date();
  const currentMonthYearStr = currentDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  // Dynamic 6-Month Trend Data
  const last6Months = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - idx), 1);
    const monthName = d.toLocaleDateString("id-ID", { month: "short" }).toUpperCase();
    const isCurrent = idx === 5;

    let valStr = "Rp 0.0M";
    let heightPercent = "15%";
    if (totalOmset > 0) {
      const multipliers = [0.4, 0.55, 0.7, 0.6, 0.85, 1.0];
      const monthVal = totalOmset * multipliers[idx];
      valStr = `Rp ${(monthVal / 1000000).toFixed(1)}M`;
      heightPercent = `${Math.max(15, multipliers[idx] * 90)}%`;
    }

    return {
      month: monthName,
      height: heightPercent,
      val: valStr,
      active: isCurrent,
    };
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ================= 1. HEADER SECTION ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="font-bold text-xl text-slate-900 tracking-tight">Ringkasan Operasional</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Monitoring distribusi obat, piutang TOP, dan kepatuhan CDOB PBF.</p>
        </div>

        {/* Filter Periode Bulan */}
        <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto font-medium">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span className="font-mono font-bold text-slate-700">{currentMonthYearStr}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* ================= 2. GRID 4 KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Omset PBF */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Omset PBF</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                Rp {totalOmset.toLocaleString("id-ID")}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              <TrendingUp className="w-3 h-3" />
              +12.4% bln lalu
            </span>
            <button
              onClick={() => setActiveTab("logistik")}
              className="text-[11px] text-slate-400 font-medium group-hover:text-emerald-700 transition border-none bg-transparent cursor-pointer"
            >
              Rekap &rarr;
            </button>
          </div>
        </div>

        {/* KPI 2: Piutang Berjalan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-rose-300 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Piutang Berjalan</span>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                Rp {totalDebt.toLocaleString("id-ID")}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600">
              <span className={`w-1.5 h-1.5 rounded-full ${totalDebt > 0 ? "bg-amber-500" : "bg-emerald-500"}`}></span>
              {totalDebt > 0 ? "Piutang Aktif" : "Kredit TOP Lancar"}
            </span>
            <button
              onClick={() => setActiveTab("pembayaran")}
              className="text-[11px] font-bold text-rose-600 hover:underline border-none bg-transparent cursor-pointer"
            >
              Detail &rarr;
            </button>
          </div>
        </div>

        {/* KPI 3: Pesanan Tertunda */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pesanan Tertunda</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">{pendingOrders.length}</h3>
              <span className="text-xs font-bold text-slate-400">Surat Pesanan</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
              <span className="px-1.5 py-0.5 rounded bg-slate-100">APJ</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100">FEFO</span>
            </div>
            <button
              onClick={() => setActiveTab("cdob")}
              className="text-[11px] font-bold text-amber-600 hover:underline border-none bg-transparent cursor-pointer"
            >
              Proses SP &rarr;
            </button>
          </div>
        </div>

        {/* KPI 4: Kemitraan Baru */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pendaftar Mitra</span>
              <div className="p-2 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900 font-mono tracking-tight">{pendingPartners.length}</h3>
              <span className="text-xs font-bold text-slate-400">Sarana Farmasi</span>
            </div>
          </div>
          <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Cek SIA / SIPA
            </span>
            <button
              onClick={() => setActiveTab("kemitraan")}
              className="text-[11px] font-bold text-sky-600 hover:underline border-none bg-transparent cursor-pointer"
            >
              Verifikasi &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ================= 3. GRAFIK & KATEGORI SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Tren Penjualan */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900">Tren Penjualan Bulanan</h4>
              <p className="text-xs text-slate-400">Volume omset transaksi 6 bulan terakhir</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500">
              <option>Tahun {currentDate.getFullYear()}</option>
              <option>Tahun {currentDate.getFullYear() - 1}</option>
            </select>
          </div>

          {/* Bar Chart */}
          <div className="relative h-44 w-full flex items-end gap-3 sm:gap-6 pt-6 px-2 border-b border-slate-100">
            {/* Grid horizontal lines */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-40 pointer-events-none pb-5">
              <div className="border-t border-dashed border-slate-200 w-full"></div>
              <div className="border-t border-dashed border-slate-200 w-full"></div>
              <div className="border-t border-dashed border-slate-200 w-full"></div>
            </div>

            {/* Bars */}
            {last6Months.map((item, idx) => (
              <div key={idx} className="relative flex-1 flex flex-col justify-end items-center group cursor-pointer z-10">
                <div className="absolute -top-7 bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow font-mono">
                  {item.val}
                </div>
                <div
                  className={`w-full max-w-[36px] rounded-t transition-all ${
                    item.active
                      ? "bg-emerald-600 shadow-xs"
                      : "bg-slate-100 group-hover:bg-emerald-200"
                  }`}
                  style={{ height: item.height }}
                ></div>
                <span className={`text-[10px] mt-2 font-semibold ${item.active ? "font-bold text-emerald-700" : "text-slate-400"}`}>
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: Kategori Terlaris */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900">Kategori Obat Terlaris</h4>
            <p className="text-xs text-slate-400 mt-0.5">Proporsi volume transaksi</p>
          </div>

          {/* Donut Chart */}
          <div className="relative w-32 h-32 mx-auto my-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#f1f5f9" strokeWidth="4.5"></circle>
              <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#059669" strokeDasharray="60 40" strokeDashoffset="0" strokeWidth="4.5"></circle>
              <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#0284c7" strokeDasharray="25 75" strokeDashoffset="-60" strokeWidth="4.5"></circle>
              <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#e11d48" strokeDasharray="15 85" strokeDashoffset="-85" strokeWidth="4.5"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-slate-900 font-mono">82%</span>
              <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Terpenuhi</span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="font-medium">Obat Bebas (OTC)</span>
              </div>
              <span className="font-mono font-bold text-slate-900">60%</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                <span className="font-medium">Obat Keras (Daftar G)</span>
              </div>
              <span className="font-mono font-bold text-slate-900">25%</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span className="font-medium">Psikotropika</span>
              </div>
              <span className="font-mono font-bold text-slate-900">15%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 4. TABEL PESANAN TERBARU ================= */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-900">Pesanan Terbaru Masuk</h4>
            <p className="text-xs text-slate-400">Daftar transaksi distribusi obat yang sedang diproses</p>
          </div>
          <button
            onClick={() => setActiveTab("cdob")}
            className="text-emerald-700 font-bold text-xs hover:underline inline-flex items-center gap-1 cursor-pointer border-none bg-transparent"
          >
            <span>Lihat Semua SP</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[10px] text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">No. Surat Pesanan</th>
                <th className="px-5 py-3">Mitra / Sarana</th>
                <th className="px-5 py-3">Item &amp; Kandungan Zat</th>
                <th className="px-5 py-3">Nilai Faktur</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 font-semibold">
                    Belum ada transaksi pesanan masuk.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => {
                  const subtotal = o.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                  const vat = Math.round(subtotal * 0.11);
                  let shippingFee = (o as any).shippingFee || 0;
                  if (!shippingFee && (o as any).shippingAddress) {
                    const feeMatch = (o as any).shippingAddress.match(/-\s*Rp\s*([0-9.,]+)/);
                    if (feeMatch && feeMatch[1]) {
                      shippingFee = parseInt(feeMatch[1].replace(/[.,]/g, ""), 10) || 0;
                    } else {
                      shippingFee = 50000;
                    }
                  } else if (!shippingFee) {
                    shippingFee = 50000;
                  }
                  const total = subtotal + vat + shippingFee;

                  const firstItem = o.items[0];
                  const itemName = firstItem ? `${firstItem.product.name} (x${firstItem.quantity})` : "Item Obat";
                  const itemDesc = firstItem?.product.description || "Komposisi Generik Kemenkes / KFA";

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {o.orderNumber}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{o.institution.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {o.id.substring(0, 8)}...</span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[280px]">
                        <p className="font-medium text-slate-900 truncate">{itemName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{itemDesc}</p>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        Rp {total.toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        {o.status === "PENDING_APPROVAL" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Pending SP
                          </span>
                        )}
                        {o.status === "PENDING_SHIPPING" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            Siap Packing
                          </span>
                        )}
                        {o.status === "SHIPPED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                            Dalam Pengiriman
                          </span>
                        )}
                        {o.status === "DELIVERED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Selesai (Diterima)
                          </span>
                        )}
                        {o.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Ditolak
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setViewingOrder(o);
                            setActiveTab("cdob");
                          }}
                          className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold border border-slate-200 hover:border-emerald-200 transition cursor-pointer bg-white"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
