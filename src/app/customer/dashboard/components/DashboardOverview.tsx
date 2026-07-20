"use client";

import { useEffect, useState } from "react";

interface DashboardOverviewProps {
  institution: any;
  orders: any[];
  setActiveTab: (tab: "dashboard" | "belanja" | "riwayat" | "tagihan") => void;
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

  // Status Limit penilaian
  const limitUsageRatio = institution.creditLimit > 0 ? institution.currentDebt / institution.creditLimit : 0;
  const limitStatusLabel = limitUsageRatio > 0.8 ? "Kritis" : limitUsageRatio > 0.5 ? "Cukup" : "Sangat Baik";

  // Sisa Kredit & Limit Kredit
  const sisaKredit = institution.creditLimit - institution.currentDebt;
  const progressRatio = institution.creditLimit > 0 ? (sisaKredit / institution.creditLimit) * 100 : 0;

  useEffect(() => {
    // Jalankan animasi progress bar setelah render awal
    const timer = setTimeout(() => {
      setAnimateWidth(progressRatio);
    }, 300);
    return () => clearTimeout(timer);
  }, [progressRatio]);

  // Pengiriman aktif dari database (status SHIPPED / PENDING_SHIPPING)
  const realActiveShipments = orders.filter((o) => o.status === "SHIPPED" || o.status === "PENDING_SHIPPING");

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      <style dangerouslySetInnerHTML={{ __html: `
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
      <div className="hidden md:block space-y-6">
        {/* Compact Welcome Section */}
        <section>
          <div className="rounded-2xl bg-gradient-to-r from-primary via-primary/95 to-primary/80 px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg shadow-primary/10">
            <div className="flex items-center gap-4 text-on-primary">
              <div className="hidden sm:flex w-12 h-12 rounded-full bg-white/20 items-center justify-center shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-white text-lg md:text-xl">{institution.name}</h3>
                <p className="text-xs opacity-90 font-medium">
                  {orders.length} pesanan tercatat • {orders.filter(o => o.status === "PENDING_APPROVAL" && !o.spSignature).length} e-Sign SP tertunda
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="backdrop-blur-md bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/20 text-center min-w-[85px] hover:bg-white/15 transition-all duration-300 cursor-pointer shadow-sm">
                <p className="text-[9px] text-white/70 uppercase font-bold tracking-wider">Loyalty</p>
                <p className="text-white font-bold text-xs font-mono">1.250 pts</p>
              </div>
              <div className="backdrop-blur-md bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/20 text-center min-w-[90px] hover:bg-white/15 transition-all duration-300 cursor-pointer shadow-sm">
                <p className="text-[9px] text-white/70 uppercase font-bold tracking-wider">Status</p>
                <p className="text-white font-bold text-xs">{limitStatusLabel}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Grid 12 cols layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Content Column (Left/Center - 9 Cols) */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Summary Cards Row (Compact) */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Limit Kredit */}
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tight">Sisa Limit Kredit</p>
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                </div>
                <h4 className="font-heading font-bold text-base text-on-surface font-mono">
                  Rp {sisaKredit.toLocaleString("id-ID")}
                </h4>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden my-2 border border-outline-variant/10">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressRatio}%` }}
                  ></div>
                </div>
                <p className="text-[9px] text-on-surface-variant font-mono">TOTAL: Rp {institution.creditLimit.toLocaleString("id-ID")}</p>
              </div>

              {/* Jatuh Tempo */}
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm border-l-4 border-l-error hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tight">Jatuh Tempo</p>
                  <span className="material-symbols-outlined text-error text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
                </div>
                <h4 className="font-heading font-bold text-base text-on-surface font-mono">
                  Rp {totalUnpaidAmount.toLocaleString("id-ID")}
                </h4>
                <p className="text-[10px] text-error font-bold pt-1">
                  {unpaidOrders.length} Invoice kritis (&gt;{institution.topDays} hari)
                </p>
              </div>

              {/* Pesanan Bulan Ini */}
              <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs text-on-surface-variant uppercase font-bold tracking-tight">Pesanan Bulan Ini</p>
                  <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
                </div>
                <h4 className="font-heading font-bold text-base text-on-surface font-mono">
                  {orders.length} Pesanan
                </h4>
                <p className="text-[10px] text-primary font-bold pt-1">+12.4% vs bln lalu</p>
              </div>
            </section>

            {/* B2B Spending Analytics Charts */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chart 1: Tren Pengeluaran Bulanan */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
                  <h4 className="font-heading font-bold text-xs text-foreground flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">analytics</span>
                    Tren Pengeluaran Bulanan (B2B)
                  </h4>
                  <span className="text-[9px] text-primary font-bold">6 Bulan Terakhir</span>
                </div>
                <div className="h-44 w-full flex items-end justify-between px-2 pt-6 relative border-b border-outline-variant/20">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 text-[8px] font-mono text-outline pb-6 pt-2">
                    <div className="border-b border-dashed border-outline-variant w-full"></div>
                    <div className="border-b border-dashed border-outline-variant w-full"></div>
                    <div className="border-b border-dashed border-outline-variant w-full"></div>
                  </div>
                  {[
                    { month: "Jan", val: 120, label: "12M" },
                    { month: "Feb", val: 150, label: "15M" },
                    { month: "Mar", val: 180, label: "18M" },
                    { month: "Apr", val: 140, label: "14M" },
                    { month: "Mei", val: 220, label: "22M" },
                    { month: "Jun", val: 250, label: "25M" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 z-10 flex-1 group relative">
                      <div className="text-[9px] font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 pointer-events-none whitespace-nowrap z-20">
                        Rp {item.label}
                      </div>
                      <div 
                        className="w-7 bg-gradient-to-t from-primary/75 to-primary hover:from-primary hover:to-primary rounded-t-md transition-all duration-300 cursor-pointer shadow-sm hover:scale-x-[1.05] hover:scale-y-[1.03] origin-bottom" 
                        style={{ height: `${(item.val / 280) * 110}px` }}
                      ></div>
                      <span className="text-[10px] font-bold text-on-surface-variant mt-1">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: Proporsi Pembelian Obat */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-outline-variant/15 pb-2">
                  <h4 className="font-heading font-bold text-xs text-foreground flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[16px]">pie_chart</span>
                    Proporsi Pembelian Sediaan
                  </h4>
                  <span className="text-[9px] text-secondary font-bold">Kategori Obat</span>
                </div>
                <div className="flex items-center justify-around h-44">
                  <div className="relative w-28 h-28 hover:scale-105 transition-transform duration-300">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f43f5e" strokeWidth="3.2" strokeDasharray="60 40" strokeDashoffset="0" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.2" strokeDasharray="30 70" strokeDashoffset="-60" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#0ea5e9" strokeWidth="3.2" strokeDasharray="10 90" strokeDashoffset="-90" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[13px] font-extrabold text-foreground font-mono">100%</span>
                      <span className="text-[8px] text-outline uppercase font-bold tracking-wider">Meds</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-[10px]">
                    <div className="flex items-center gap-2 hover:bg-surface-container-low px-2 py-1 rounded-lg transition-colors cursor-pointer">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 shadow-sm shadow-rose-500/30"></span>
                      <span className="text-on-surface-variant font-bold">Obat Keras (60%)</span>
                    </div>
                    <div className="flex items-center gap-2 hover:bg-surface-container-low px-2 py-1 rounded-lg transition-colors cursor-pointer">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-500/30"></span>
                      <span className="text-on-surface-variant font-bold">Obat Bebas (30%)</span>
                    </div>
                    <div className="flex items-center gap-2 hover:bg-surface-container-low px-2 py-1 rounded-lg transition-colors cursor-pointer">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0 shadow-sm shadow-sky-500/30"></span>
                      <span className="text-on-surface-variant font-bold">Cold Chain (10%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Prominent Table Section */}
            <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-white">
                <div>
                  <h4 className="font-heading font-bold text-sm text-foreground">Pesanan Terbaru</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">Monitoring real-time status logistik obat</p>
                </div>
                <button
                  onClick={() => setActiveTab("riwayat")}
                  className="text-primary font-bold text-xs hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
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
                            ) : order.status === "DELIVERED" ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingFaktur(order);
                                }}
                                className="px-3.5 py-1.5 bg-white border border-outline-variant/40 hover:bg-surface-container-low font-bold rounded-lg transition-all text-[10px] cursor-pointer shadow-sm text-on-surface active:scale-95 duration-100"
                              >
                                e-Faktur
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

          {/* Secondary Actions Column (Right - 3 Cols) */}
          <aside className="lg:col-span-3 space-y-4">
            <h5 className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant px-1">Aksi Cepat</h5>
            
            <div
              onClick={() => setActiveTab("belanja")}
              className="bg-surface-container-high rounded-2xl p-5 group cursor-pointer hover:bg-primary border border-outline-variant/10 hover:border-primary/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 text-on-surface shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary mb-3 shadow-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
              </div>
              <h4 className="font-heading font-bold text-sm group-hover:text-white transition-colors">Katalog Produk</h4>
              <p className="text-[11px] text-on-surface-variant group-hover:text-white/80 mt-1 transition-colors">
                10.000+ SKU farmasi tersedia
              </p>
            </div>

            <div
              onClick={() => setActiveTab("tagihan")}
              className="bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/45 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer group shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary-container/20 flex items-center justify-center text-secondary shrink-0 group-hover:scale-110 transition-transform duration-350">
                <span className="material-symbols-outlined">cloud_upload</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">Bukti Bayar</p>
                <p className="text-[10px] text-on-surface-variant truncate">Konfirmasi instan</p>
              </div>
            </div>

            <div
              onClick={() => setActiveTab("riwayat")}
              className="bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/45 rounded-2xl p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 cursor-pointer relative group shadow-sm"
            >
              {orders.filter((o) => o.status === "PENDING_APPROVAL" && !o.spSignature).length > 0 && (
                <span className="absolute top-4 right-4 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform duration-350">
                <span className="material-symbols-outlined">draw</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">e-Sign SP</p>
                <p className="text-[10px] text-on-surface-variant truncate">
                  {orders.filter((o) => o.status === "PENDING_APPROVAL" && !o.spSignature).length} Menunggu
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
            <p className="text-white font-bold text-[10px]">{limitStatusLabel}</p>
          </div>
        </section>

        {/* Credit Limit Summary */}
        <section className="bg-white p-5 rounded-2xl shadow-sm border border-outline-variant/20 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Sisa Kredit</span>
              <span className="text-lg font-black text-primary font-mono">Rp {sisaKredit.toLocaleString("id-ID")}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-on-surface-variant font-medium">Limit: Rp {institution.creditLimit.toLocaleString("id-ID")}</span>
            </div>
          </div>
          <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-1000 ease-out rounded-full" 
              style={{ width: `${animateWidth}%` }}
            ></div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-sm">event_repeat</span>
              <span className="text-[10px] font-bold text-on-surface-variant">Jatuh tempo {institution.topDays} hari lagi</span>
            </div>
            <button 
              onClick={() => setActiveTab("tagihan")}
              className="text-primary font-bold text-[10px] hover:underline active:scale-95 duration-100 transition-all border-none bg-transparent cursor-pointer"
            >
              Bayar Sekarang
            </button>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section>
          <h2 className="text-sm font-black mb-4">Akses Cepat</h2>
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => setActiveTab("belanja")}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl shadow-sm active:scale-95 transition-all duration-150 border border-outline-variant/20 cursor-pointer hover:border-primary/30"
            >
              <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-xl">inventory_2</span>
              </div>
              <span className="text-[10px] font-bold text-on-surface text-center">Katalog</span>
            </button>
            <button 
              onClick={() => setActiveTab("tagihan")}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl shadow-sm active:scale-95 transition-all duration-150 border border-outline-variant/20 cursor-pointer hover:border-primary/30"
            >
              <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-xl">payments</span>
              </div>
              <span className="text-[10px] font-bold text-on-surface text-center">Konfirmasi</span>
            </button>
            <button 
              onClick={() => setActiveTab("riwayat")}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-2xl shadow-sm active:scale-95 transition-all duration-150 border border-outline-variant/20 cursor-pointer hover:border-primary/30"
            >
              <div className="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-xl">draw</span>
              </div>
              <span className="text-[10px] font-bold text-on-surface text-center">E-Sign SP</span>
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
                const isShipped = shipment.status === "SHIPPED";
                return (
                  <div 
                    key={shipment.id} 
                    onClick={() => setViewingDetailOrder(shipment)}
                    className="min-w-[280px] max-w-[280px] bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col gap-3 active:scale-[0.99] transition-all duration-100 cursor-pointer hover:border-primary/20"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="bg-secondary/10 p-2 rounded-lg text-secondary">
                          <span className="material-symbols-outlined">{isShipped ? "local_shipping" : "inventory"}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{shipment.orderNumber}</p>
                          <p className="text-[9px] text-on-surface-variant font-medium">
                            {isShipped ? "Estimasi Tiba: Hari Ini" : "Estimasi Tiba: Besok"}
                          </p>
                        </div>
                      </div>
                      {isShipped && (
                        <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-base animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                        </div>
                      )}
                    </div>

                    {isShipped ? (
                      <div className="relative h-24 w-full rounded-lg overflow-hidden border border-outline-variant/20">
                        <div 
                          className="absolute inset-0 bg-cover bg-center" 
                          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAALaaR7an7VLifbMOEEWX1en_fjaSdHx4voL57p8ErU3BKiOgtk0DsaEAOFG9aJLwxmzMn082xMJySFOUJoxOsFaIfY0CbRJKl5kLlddNudcPfotCvUY3c8c6eJwDBei1WHlElM4yvfCiYXUpEcIoa6_n2RLhY9XAIwoTEzn1hLj0ZPKW6u-MmCu3siAefyqGAL55sDDt_ADm8g_f81FnOVed-QAyhcBr0VuLBqCuz2G7Oz_xopxaob6umqCfkLhw_UN6Tg72MewQ')" }}
                        ></div>
                        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[8px] font-black text-primary uppercase">
                          KURIR: EDI SANTOSO
                        </div>
                      </div>
                    ) : (
                      <div className="h-24 w-full rounded-lg bg-surface-container-low flex items-center justify-center">
                        <span className="text-[10px] text-on-surface-variant font-bold italic">Menunggu Pick-up</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px]">
                      {isShipped ? (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-bold text-[9px]">Sedang Dikirim</span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 font-bold text-[9px]">Diproses PBF</span>
                      )}
                      <span className="text-on-surface-variant font-bold">{shipment.items.length} Item</span>
                    </div>
                  </div>
                );
              })
            ) : (
              /* Fallback Mock Shipments jika tidak ada data aktif dari database */
              <>
                {/* Mock Shipment 1: Shipped */}
                <div 
                  onClick={() => alert("Menampilkan detail mockup order...")}
                  className="min-w-[280px] bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col gap-3 active:scale-[0.99] transition-all duration-100 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="bg-secondary/10 p-2 rounded-lg text-secondary">
                        <span className="material-symbols-outlined">local_shipping</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold">INV/2023/X/912</p>
                        <p className="text-[9px] text-on-surface-variant font-medium">Estimasi Tiba: 14:20 WIB</p>
                      </div>
                    </div>
                    <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-base animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                    </div>
                  </div>
                  <div className="relative h-24 w-full rounded-lg overflow-hidden border border-outline-variant/20">
                    <div 
                      className="absolute inset-0 bg-cover bg-center" 
                      style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAALaaR7an7VLifbMOEEWX1en_fjaSdHx4voL57p8ErU3BKiOgtk0DsaEAOFG9aJLwxmzMn082xMJySFOUJoxOsFaIfY0CbRJKl5kLlddNudcPfotCvUY3c8c6eJwDBei1WHlElM4yvfCiYXUpEcIoa6_n2RLhY9XAIwoTEzn1hLj0ZPKW6u-MmCu3siAefyqGAL55sDDt_ADm8g_f81FnOVed-QAyhcBr0VuLBqCuz2G7Oz_xopxaob6umqCfkLhw_UN6Tg72MewQ')" }}
                    ></div>
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[8px] font-black text-primary uppercase">
                      KURIR: EDI SANTOSO
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-bold text-[9px]">Sedang Dikirim</span>
                    <span className="text-on-surface-variant font-bold">3 Item</span>
                  </div>
                </div>

                {/* Mock Shipment 2: Processing */}
                <div className="min-w-[280px] bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/20 flex flex-col gap-3 opacity-80">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="bg-secondary/10 p-2 rounded-lg text-secondary">
                        <span className="material-symbols-outlined">inventory</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold">INV/2023/X/888</p>
                        <p className="text-[9px] text-on-surface-variant font-medium">Estimasi Tiba: Besok</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">map</span>
                  </div>
                  <div className="h-24 w-full rounded-lg bg-surface-container-low flex items-center justify-center">
                    <span className="text-[10px] text-on-surface-variant font-bold italic">Menunggu Pick-up</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="px-2.5 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 font-bold text-[9px]">Diproses PBF</span>
                    <span className="text-on-surface-variant font-bold">12 Item</span>
                  </div>
                </div>
              </>
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
