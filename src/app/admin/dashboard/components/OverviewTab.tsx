"use client";

import { Calendar, MoreHorizontal } from "lucide-react";

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
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-on-surface">Ringkasan Operasional</h2>
          <p className="text-xs text-outline font-medium mt-1">Pantau performa distribusi dan inventori secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/30 text-xs">
          <span className="material-symbols-outlined text-primary text-[18px]">calendar_today</span>
          <span className="font-mono font-bold uppercase tracking-wider text-on-surface-variant">Juli 2026</span>
        </div>
      </div>

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all duration-350 group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              12.4%
            </div>
          </div>
          <p className="text-[10px] text-outline mb-1 uppercase font-bold tracking-wider">Total Omset PBF</p>
          <h3 className="font-heading font-extrabold text-xl text-on-surface font-mono">Rp {totalOmset.toLocaleString("id-ID")}</h3>
          <div className="mt-4 h-12 w-full flex items-end gap-1">
            <div className="flex-1 bg-primary/20 rounded-t h-[40%] transition-all group-hover:bg-primary"></div>
            <div className="flex-1 bg-primary/20 rounded-t h-[60%] transition-all group-hover:bg-primary"></div>
            <div className="flex-1 bg-primary/20 rounded-t h-[45%] transition-all group-hover:bg-primary"></div>
            <div className="flex-1 bg-primary/20 rounded-t h-[70%] transition-all group-hover:bg-primary"></div>
            <div className="flex-1 bg-primary/20 rounded-t h-[90%] transition-all group-hover:bg-primary"></div>
            <div className="flex-1 bg-primary/20 rounded-t h-[85%] transition-all group-hover:bg-primary"></div>
          </div>
        </div>

        {/* Tagihan Tempo */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all duration-355 group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 rounded-xl bg-error-container/10 flex items-center justify-center text-error group-hover:bg-error group-hover:text-on-error transition-colors duration-300">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <div className="bg-error-container text-on-error-container px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>
              Kritis
            </div>
          </div>
          <p className="text-[10px] text-outline mb-1 uppercase font-bold tracking-wider">Piutang Berjalan</p>
          <h3 className="font-heading font-extrabold text-xl text-on-surface font-mono">Rp {totalDebt.toLocaleString("id-ID")}</h3>
          <p className="mt-4 text-[10px] text-outline italic">Jatuh tempo berdasarkan termin TOP.</p>
        </div>

        {/* Pesanan Tertunda */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all duration-360 group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 rounded-xl bg-tertiary-container/10 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors duration-300">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
            <button 
              onClick={() => setActiveTab("cdob")}
              className="text-[9px] text-primary hover:underline font-bold"
            >
              Proses SP
            </button>
          </div>
          <p className="text-[10px] text-outline mb-1 uppercase font-bold tracking-wider">Pesanan Tertunda</p>
          <h3 className="font-heading font-extrabold text-xl text-on-surface font-mono">{pendingOrders.length} SP</h3>
          <div className="mt-4 flex -space-x-2">
            <div className="w-6 h-6 rounded-full border-2 border-surface-container-lowest bg-surface-container flex items-center justify-center text-[7px] font-bold text-outline">APJ</div>
            <div className="w-6 h-6 rounded-full border-2 border-surface-container-lowest bg-surface-container-high flex items-center justify-center text-[7px] font-bold text-outline">SIA</div>
            <div className="w-6 h-6 rounded-full border-2 border-surface-container-lowest bg-surface-container-highest flex items-center justify-center text-[7px] font-bold text-outline">FEFO</div>
          </div>
        </div>

        {/* Registrasi Baru */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all duration-365 group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-11 h-11 rounded-xl bg-secondary-container/20 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors duration-300">
              <span className="material-symbols-outlined text-[20px]">group_add</span>
            </div>
            <button 
              onClick={() => setActiveTab("kemitraan")}
              className="text-[9px] text-secondary hover:underline font-bold"
            >
              Lihat Detail
            </button>
          </div>
          <p className="text-[10px] text-outline mb-1 uppercase font-bold tracking-wider">Pendaftar Kemitraan</p>
          <h3 className="font-heading font-extrabold text-xl text-on-surface font-mono">{pendingPartners.length} Mitra</h3>
          <div className="mt-4 flex items-center text-[10px] text-secondary font-semibold">
            <span className="material-symbols-outlined text-sm mr-1">verified</span>
            Butuh verifikasi dokumen SIA
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tren Penjualan (Line Chart Area) */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-heading font-bold text-sm text-on-surface">Tren Penjualan Bulanan</h4>
              <p className="text-xs text-outline">Visualisasi omset transaksi 6 bulan terakhir</p>
            </div>
            <select className="bg-surface-container-low border-none text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary font-bold text-on-surface-variant outline-none">
              <option>Tahun 2026</option>
              <option>Tahun 2025</option>
            </select>
          </div>
          {/* Custom SVG Bar/Line Chart */}
          <div className="relative h-[240px] w-full flex items-end gap-4 overflow-hidden pt-10 px-2 border-b border-outline-variant/20">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none pb-6">
              <div className="border-t border-on-surface w-full"></div>
              <div className="border-t border-on-surface w-full"></div>
              <div className="border-t border-on-surface w-full"></div>
              <div className="border-t border-on-surface w-full"></div>
            </div>

            {[
              { month: "MEI", height: "40%", val: "Rp 1.8M" },
              { month: "JUN", height: "55%", val: "Rp 2.4M" },
              { month: "JUL", height: "70%", val: "Rp 3.1M" },
              { month: "AGU", height: "60%", val: "Rp 2.7M" },
              { month: "SEP", height: "85%", val: "Rp 3.9M" },
              { month: "OKT", height: "95%", val: `Rp ${(totalOmset / 1000000).toFixed(1)}M`, active: true },
            ].map((item, idx) => (
              <div key={idx} className="relative flex-1 flex flex-col justify-end items-center group cursor-pointer z-10">
                <div className="absolute -top-7 bg-on-surface text-surface text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md font-mono font-bold z-20">
                  {item.val}
                </div>
                <div 
                  className={`w-full max-w-[45px] rounded-t-lg transition-all duration-300 ${
                    item.active 
                      ? "bg-primary shadow-sm shadow-primary/20" 
                      : "bg-primary-container/20 group-hover:bg-primary-container/60"
                  }`} 
                  style={{ height: item.height }}
                ></div>
                <span className={`text-[10px] text-center mt-2 font-bold ${item.active ? "text-primary font-black" : "text-outline"}`}>
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Kategori Obat Terlaris */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-heading font-bold text-sm text-on-surface">Kategori Obat Terlaris</h4>
            <p className="text-xs text-outline mt-0.5">Proporsi berdasarkan volume transaksi</p>
          </div>

          <div className="relative w-36 h-36 mx-auto my-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#e1e3e4" strokeWidth="4"></circle>
              {/* Obat Bebas (60%) */}
              <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#006c49" strokeDasharray="60 40" strokeDashoffset="0" strokeWidth="4"></circle>
              {/* Obat Keras (25%) */}
              <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#005ac2" strokeDasharray="25 75" strokeDashoffset="-60" strokeWidth="4"></circle>
              {/* Psikotropika (15%) */}
              <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#ba1a1a" strokeDasharray="15 85" strokeDashoffset="-85" strokeWidth="4"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-on-surface leading-none font-mono">82%</span>
              <span className="text-[8px] text-outline uppercase font-bold tracking-wider mt-1">Utilized</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"></span>
                <span className="text-on-surface-variant font-medium">Obat Bebas</span>
              </div>
              <span className="font-bold">60%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary shrink-0"></span>
                <span className="text-on-surface-variant font-medium">Obat Keras (G)</span>
              </div>
              <span className="font-bold">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error shrink-0"></span>
                <span className="text-on-surface-variant font-medium">Psikotropika</span>
              </div>
              <span className="font-bold">15%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
          <h4 className="font-heading font-bold text-sm text-on-surface">Pesanan Terbaru</h4>
          <button 
            onClick={() => setActiveTab("cdob")}
            className="text-primary font-bold text-xs hover:underline cursor-pointer"
          >
            Lihat Semua SP
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-container-low/40 text-[10px] text-outline uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 font-bold">ID Pesanan</th>
                <th className="px-6 py-4 font-bold">Mitra / Apotek</th>
                <th className="px-6 py-4 font-bold">Zat Aktif / Item</th>
                <th className="px-6 py-4 font-bold">Total Nilai</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {recentOrders.map((o) => {
                const total = o.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                const desc = o.items.map((it) => `${it.product.name} (x${it.quantity})`).join(", ");

                return (
                  <tr key={o.id} className="hover:bg-surface-container-low/30 transition-colors h-14">
                    <td className="px-6 py-4 font-bold font-mono text-foreground">{o.orderNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-secondary-container/20 flex items-center justify-center text-secondary shrink-0">
                          <span className="material-symbols-outlined text-[16px]">local_pharmacy</span>
                        </div>
                        <span className="font-bold">{o.institution.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant max-w-[200px] truncate">{desc || "-"}</td>
                    <td className="px-6 py-4 font-bold font-mono text-foreground">Rp {total.toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4">
                      {o.status === "PENDING_APPROVAL" && (
                        <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase animate-pulse">Pending Approval</span>
                      )}
                      {o.status === "PENDING_SHIPPING" && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase">Ready to Pack</span>
                      )}
                      {o.status === "SHIPPED" && (
                        <span className="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase">In Shipping</span>
                      )}
                      {o.status === "DELIVERED" && (
                        <span className="bg-emerald-50 text-primary border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase">Delivered</span>
                      )}
                      {o.status === "REJECTED" && (
                        <span className="bg-red-50 text-error border border-red-200 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase">Rejected</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => {
                          setViewingOrder(o);
                          setActiveTab("cdob");
                        }}
                        className="text-on-surface-variant hover:text-primary cursor-pointer inline-flex items-center justify-center w-7 h-7 hover:bg-surface-container-high rounded-full transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
