import { useState, useMemo } from "react";
import { Download, UploadCloud, CheckCircle, AlertTriangle, Clock, Search, Filter, FileSpreadsheet } from "lucide-react";

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
  totalStock: number;
  batches?: Batch[];
}

interface PurchaseHistoryViewProps {
  orders: any[];
  setViewingDetailOrder: (order: any) => void;
  setViewingFaktur: (order: any) => void;
  setSelectedOrderForPayment: (order: any) => void;
  products: Product[];
  handleMidtransPay?: (order: any) => void;
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

export default function PurchaseHistoryView({
  orders,
  setViewingDetailOrder,
  setViewingFaktur,
  setSelectedOrderForPayment,
  products,
  handleMidtransPay,
}: PurchaseHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Generasi opsi bulan unik dari daftar transaksi
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    orders.forEach((o) => {
      if (o.createdAt) {
        const ym = new Date(o.createdAt).toISOString().slice(0, 7);
        monthsSet.add(ym);
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [orders]);

  // Filtering orders berdasar No Inv, Metode, Bulan, dan Rentang Tanggal (Hari)
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const invNumber = `INV/${o.orderNumber.replace("SP-", "")}`.toLowerCase();
      const orderNo = o.orderNumber.toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = invNumber.includes(query) || orderNo.includes(query);

      if (!matchesSearch) return false;

      // Filter Metode / Status
      if (methodFilter !== "ALL") {
        if (methodFilter === "TOP" && o.paymentMethod !== "TOP") return false;
        if (methodFilter === "INVOICE" && o.paymentMethod !== "INVOICE") return false;
        if (methodFilter === "VA" && o.paymentMethod !== "VA") return false;
        if (methodFilter === "PAID" && o.paymentStatus !== "PAID") return false;
        if (methodFilter === "CANCELLED" && (o.status !== "REJECTED" && o.status !== "CANCELLED")) return false;
      }

      // Filter Bulan (YYYY-MM)
      const orderDate = new Date(o.createdAt);
      if (selectedMonth !== "ALL") {
        const yearMonth = orderDate.toISOString().slice(0, 7);
        if (yearMonth !== selectedMonth) return false;
      }

      // Filter Rentang Hari / Tanggal (Dari & S/d)
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) return false;
      }

      return true;
    });
  }, [orders, searchQuery, methodFilter, selectedMonth, startDate, endDate]);

  // Warning Alert for orders near or past due date (<= 3 days)
  const dueAlertOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.paymentStatus === "PAID" || o.status === "REJECTED" || o.status === "CANCELLED") return false;
      const shipDate = o.shippingDate ? new Date(o.shippingDate) : null;
      if (!shipDate) return false;
      const topDays = o.institution?.topDays || 30;
      const dueDate = new Date(shipDate.getTime() + topDays * 24 * 60 * 60 * 1000);
      const diffDays = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diffDays <= 3;
    });
  }, [orders]);

  // CSV Export function (Mengekspor HANYA data yang sesuai dengan Filter Bulan/Tanggal)
  function exportToCSV() {
    if (filteredOrders.length === 0) {
      alert("Tidak ada data transaksi yang sesuai filter untuk diekspor.");
      return;
    }
    const headers = ["Tanggal", "No Invoice", "No Order SP", "Total Rp", "Metode Pembayaran", "Status Pembayaran", "Tanggal Pengiriman"];
    const rows = filteredOrders.map((o) => {
      const { total } = calculateOrderTotals(o);
      const dateStr = new Date(o.createdAt).toLocaleDateString("id-ID");
      const invNo = `INV/${o.orderNumber.replace("SP-", "")}`;
      const shipStr = o.shippingDate ? new Date(o.shippingDate).toLocaleDateString("id-ID") : "Belum Dikirim";
      return [
        `"${dateStr}"`,
        `"${invNo}"`,
        `"${o.orderNumber}"`,
        total,
        `"${o.paymentMethod || "TOP"}"`,
        `"${o.paymentStatus === "PAID" ? "Lunas" : o.status === "CANCELLED" ? "Dibatalkan" : "Belum Lunas"}"`,
        `"${shipStr}"`
      ];
    });

    const filterPeriodStr = selectedMonth !== "ALL" 
      ? `Bulan_${selectedMonth}` 
      : startDate || endDate 
        ? `Periode_${startDate || "Awal"}_sd_${endDate || "Akhir"}`
        : "Semua_Transaksi";

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Transaksi_${filterPeriodStr}_GroovyCare.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function formatMonthLabel(ym: string) {
    const [year, month] = ym.split("-");
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-foreground">Transaksi Pembelian</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">Histori tagihan, limit kredit, invoice, dan status pembayaran tempo apotek.</p>
        </div>

        {/* Action Button: CSV Export */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer border-none"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor CSV ({filteredOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Due Date Warning Alert Banner */}
      {dueAlertOrders.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300/80 rounded-2xl flex items-start gap-3 text-xs text-amber-900 shadow-sm animate-pulse">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-amber-950">Peringatan Tagihan Mendekati / Melewati Jatuh Tempo</h4>
            <p className="text-amber-800 leading-relaxed">
              Terdapat <strong>{dueAlertOrders.length} pesanan</strong> dengan metode TOP/Invoice yang mendekati (H-3) atau telah melewati tanggal jatuh tempo. Mohon lakukan pelunasan untuk menjaga sisa Pagu Kredit Anda.
            </p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 space-y-3 shadow-sm">
        {/* Row 1: Search & Main Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No Invoice / Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-sans text-foreground placeholder:text-outline-variant/60 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter Bulan */}
            <div className="flex items-center gap-1.5 flex-1 md:flex-none">
              <span className="text-[11px] font-bold text-on-surface-variant shrink-0">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  if (e.target.value !== "ALL") {
                    setStartDate("");
                    setEndDate("");
                  }
                }}
                className="w-full md:w-44 px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-foreground cursor-pointer focus:outline-none focus:border-primary"
              >
                <option value="ALL">Semua Bulan</option>
                {availableMonths.map((ym) => (
                  <option key={ym} value={ym}>
                    {formatMonthLabel(ym)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Metode / Status */}
            <div className="flex items-center gap-1.5 flex-1 md:flex-none">
              <Filter className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full md:w-48 px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-foreground cursor-pointer focus:outline-none focus:border-primary"
              >
                <option value="ALL">Semua Status</option>
                <option value="TOP">Limit Kredit / TOP</option>
                <option value="INVOICE">Invoice Billing</option>
                <option value="VA">Instant VA / QRIS</option>
                <option value="PAID">✓ Lunas</option>
                <option value="CANCELLED">✗ Dibatalkan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Rentang Hari / Tanggal (Date Range Filter) */}
        <div className="pt-2 border-t border-outline-variant/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold text-on-surface-variant">Filter Hari/Tanggal:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-outline font-medium">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value) setSelectedMonth("ALL");
                }}
                className="px-2.5 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs font-mono text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-outline font-medium">S/d:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (e.target.value) setSelectedMonth("ALL");
                }}
                className="px-2.5 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs font-mono text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {(startDate || endDate || selectedMonth !== "ALL" || methodFilter !== "ALL" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setMethodFilter("ALL");
                  setSelectedMonth("ALL");
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-[11px] text-red-600 hover:text-red-700 font-bold underline cursor-pointer ml-1"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="text-[11px] text-outline font-medium">
            Menampilkan <strong className="text-foreground">{filteredOrders.length}</strong> dari {orders.length} Transaksi
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW: Ledger Table */}
      <div className="hidden md:block bg-white rounded-3xl border border-outline-variant/20 overflow-hidden shadow-sm">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-bold">
              <tr>
                <th className="px-5 py-4">Tanggal</th>
                <th className="px-5 py-4">Nomor Invoice</th>
                <th className="px-5 py-4 text-right">Total (IDR)</th>
                <th className="px-5 py-4">Status Bayar</th>
                <th className="px-5 py-4 text-center">Konfirmasi Bayar</th>
                <th className="px-5 py-4 text-center">Dokumen</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-on-surface">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-on-surface-variant/50 italic">
                    Belum ada riwayat transaksi pembelian.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const { total: orderTotal } = calculateOrderTotals(order);
                  const isPaid = order.paymentStatus === "PAID";
                  const isRejected = order.status === "REJECTED" || order.status === "CANCELLED";

                  const isTopCredit = order.paymentMethod === "TOP";
                  const isInvoiceBilling = order.paymentMethod === "INVOICE";

                  const topDays = order.institution?.topDays || 30;
                  const shipDate = order.shippingDate ? new Date(order.shippingDate) : null;
                  const isShippedOrDelivered = order.status === "PENDING_SHIPPING" || order.status === "SHIPPED" || order.status === "DELIVERED";

                  let diffDays = topDays;
                  let isOverdue = false;
                  let topTenorText = `Sisa Tenor ${topDays} Hari`;

                  if (shipDate) {
                    const dueDate = new Date(shipDate.getTime() + topDays * 24 * 60 * 60 * 1000);
                    const diffTime = dueDate.getTime() - Date.now();
                    diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays < 0) {
                      isOverdue = true;
                      topTenorText = `Jatuh Tempo! Overdue ${Math.abs(diffDays)} Hari`;
                    } else {
                      topTenorText = `Sisa ${diffDays} Hari Tempo (s/d ${dueDate.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })})`;
                    }
                  }

                  return (
                    <tr key={order.id} className="hover:bg-surface-container-low/20 transition-colors h-14">

                      {/* Tanggal */}
                      <td className="px-5 py-4 font-mono text-on-surface-variant">
                        {new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Nomor Invoice */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-foreground">INV/{order.orderNumber.replace("SP-", "")}</p>
                        <p className="text-[9px] text-outline font-mono mt-0.5">Order ID: {order.orderNumber}</p>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4 text-right font-bold font-mono">
                        Rp {orderTotal.toLocaleString("id-ID")}
                      </td>

                      {/* Status Bayar */}
                      <td className="px-5 py-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                            Lunas
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full uppercase">
                            Dibatalkan
                          </span>
                        ) : isTopCredit ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase">
                            Limit Kredit / TOP
                          </span>
                        ) : isInvoiceBilling ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full uppercase">
                            Invoice Billing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full uppercase animate-pulse">
                            {order.paymentMethod === "COD" ? "COD / Belum Lunas" : "VA / Belum Lunas"}
                          </span>
                        )}
                      </td>

                      {/* Konfirmasi Bayar / Informasi Kredit / Action */}
                      <td className="px-5 py-4 text-center">
                        {isPaid ? (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-0.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Terverifikasi / Lunas
                          </span>
                        ) : isRejected ? (
                          <span className="text-[10px] text-on-surface-variant/40 italic">-</span>
                        ) : isTopCredit ? (
                          /* 1. CREDIT LIMIT / TOP: Memotong limit. Begitu dikirim/jalan, mitra boleh langsung pelunasan via payment gateway agar limit pulih */
                          isShippedOrDelivered ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="text-[9px] text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg font-mono font-semibold">
                                {topTenorText}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleMidtransPay?.(order)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-[10px] font-bold shadow-sm cursor-pointer border-none"
                              >
                                <span className="material-symbols-outlined text-[12px] text-white">payments</span> Lunasi TOP (VA/QRIS)
                              </button>
                            </div>
                          ) : (
                            <div className="text-[9px] text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl font-bold inline-block">
                              Potong Limit (Menunggu Pengiriman)
                            </div>
                          )
                        ) : isInvoiceBilling ? (
                          /* 2. INVOICE BILLING: Masa durasi per tempo. Tombol bayar baru MUNCUL jika sudah waktu jatuh tempo */
                          isOverdue || (shipDate && diffDays <= 0) ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase">
                                Jatuh Tempo ({Math.abs(diffDays)} Hr)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleMidtransPay?.(order)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-[10px] font-bold shadow-md cursor-pointer border-none animate-pulse"
                              >
                                <span className="material-symbols-outlined text-[12px] text-white">payments</span> Bayar Sekarang (VA/QRIS)
                              </button>
                            </div>
                          ) : (
                            <div className="text-[10px] text-purple-950 bg-purple-50 border border-purple-200 p-2 rounded-xl inline-block max-w-[190px] leading-tight text-center">
                              <span className="font-extrabold block text-[9px] uppercase tracking-wider text-purple-900">Masa Tempo Active</span>
                              <span className="text-[9px] text-purple-800 font-mono block mt-0.5 font-semibold">
                                {topTenorText}
                              </span>
                            </div>
                          )
                        ) : order.paymentProofUrl ? (
                          <span className="text-[10px] text-amber-600 font-bold flex items-center justify-center gap-0.5">
                            <Clock className="w-3.5 h-3.5 animate-spin" /> Menunggu Review
                          </span>
                        ) : order.paymentMethod === "VA" ? (
                          <button
                            type="button"
                            onClick={() => handleMidtransPay?.(order)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-[10px] font-bold shadow-sm cursor-pointer border-none"
                          >
                            <span className="material-symbols-outlined text-[12px] text-white">payments</span> Bayar VA/QRIS
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForPayment(order)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold shadow-sm cursor-pointer border-none"
                          >
                            <UploadCloud className="w-3 h-3" /> Upload Bukti
                          </button>
                        )}
                      </td>

                      {/* Dokumen */}
                      <td className="px-5 py-4 text-center">
                        {order.status === "DELIVERED" || order.status === "SHIPPED" ? (
                          <button
                            type="button"
                            onClick={() => setViewingFaktur(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-foreground font-bold rounded-lg text-[10px] shadow-sm cursor-pointer"
                          >
                            <Download className="w-3 h-3 text-primary" /> e-Faktur
                          </button>
                        ) : (
                          <span className="text-[10px] text-on-surface-variant/40 italic">-</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingDetailOrder(order)}
                          className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-lg text-[10px] font-bold cursor-pointer transition-colors border-none"
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

      {/* MOBILE VIEW: Cards */}
      <div className="block md:hidden space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white border border-outline-variant/20 rounded-3xl text-on-surface-variant text-xs shadow-sm">
            Belum ada riwayat transaksi pembelian.
          </div>
        ) : (
          orders.map((order) => {
            const { total: orderTotal } = calculateOrderTotals(order);
            const isPaid = order.paymentStatus === "PAID";
            const isRejected = order.status === "REJECTED" || order.status === "CANCELLED";

            const isTopCredit = order.paymentMethod === "TOP";
            const isInvoiceBilling = order.paymentMethod === "INVOICE";
            const isShippedOrDelivered = order.status === "PENDING_SHIPPING" || order.status === "SHIPPED" || order.status === "DELIVERED";

            const topDays = order.institution?.topDays || 30;
            const shipDate = order.shippingDate ? new Date(order.shippingDate) : null;
            let diffDays = topDays;
            let isOverdue = false;
            let topTenorText = `Tenor ${topDays} Hari (Terhitung saat barang dikirim)`;

            if (shipDate) {
              const dueDate = new Date(shipDate.getTime() + topDays * 24 * 60 * 60 * 1000);
              const diffTime = dueDate.getTime() - Date.now();
              diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays < 0) {
                isOverdue = true;
                topTenorText = `Jatuh Tempo! Overdue ${Math.abs(diffDays)} Hari`;
              } else {
                topTenorText = `Sisa ${diffDays} Hari Tempo (s/d ${dueDate.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })})`;
              }
            }

            return (
              <div key={order.id} className="bg-white border border-outline-variant/30 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-heading font-black text-sm text-foreground">INV/{order.orderNumber.replace("SP-", "")}</h4>
                    <span className="text-[10px] text-outline font-mono block mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    {isPaid ? (
                      <span className="inline-flex items-center text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                        Lunas
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center text-[9px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase">
                        Dibatalkan
                      </span>
                    ) : isTopCredit ? (
                      <span className="inline-flex items-center text-[9px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase">
                        Pagu Kredit / TOP
                      </span>
                    ) : isInvoiceBilling ? (
                      <span className="inline-flex items-center text-[9px] font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full uppercase">
                        Invoice Billing
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[9px] font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full uppercase animate-pulse">
                        {order.paymentMethod === "COD" ? "COD" : "VA"} / Belum Lunas
                      </span>
                    )}
                  </div>
                </div>

                {/* Info: Total Billing */}
                <div className="flex justify-between items-center py-2.5 border-y border-outline-variant/10 text-xs">
                  <span className="text-on-surface-variant font-bold">Total Tagihan:</span>
                  <span className="text-primary font-black font-mono">Rp {orderTotal.toLocaleString("id-ID")}</span>
                </div>

                {/* Actions: Payments & Documents */}
                <div className="flex flex-col gap-2 pt-1">
                  {!isPaid && !isRejected && (
                    <div>
                      {isTopCredit ? (
                        isShippedOrDelivered ? (
                          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-blue-900">
                              <span>Potong Pagu Kredit (TOP)</span>
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[9px]">{topTenorText}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleMidtransPay?.(order)}
                              className="w-full py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border-none"
                            >
                              <span className="material-symbols-outlined text-[16px] text-white">payments</span>
                              <span>Lunasi TOP (VA/QRIS)</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-[10px] text-blue-900 font-bold text-center">
                            Potong Limit Kredit (Menunggu Barang Dikirim)
                          </div>
                        )
                      ) : isInvoiceBilling ? (
                        isOverdue || (shipDate && diffDays <= 0) ? (
                          <div className="p-3 bg-red-50/80 border border-red-200 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-red-900">
                              <span>Invoice Billing (Jatuh Tempo!)</span>
                              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[9px]">Terlambat {Math.abs(diffDays)} Hari</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleMidtransPay?.(order)}
                              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-none animate-pulse"
                            >
                              <span className="material-symbols-outlined text-[16px] text-white">payments</span>
                              <span>Bayar Sekarang (VA/QRIS)</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-purple-50/80 border border-purple-200 rounded-xl text-[10px] text-purple-900 font-bold text-center">
                            Invoice Billing ({topTenorText})
                          </div>
                        )
                      ) : order.paymentProofUrl ? (
                        <div className="flex items-center justify-center gap-1.5 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold w-full">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Menunggu Review Keuangan</span>
                        </div>
                      ) : order.paymentMethod === "VA" ? (
                        <button
                          type="button"
                          onClick={() => handleMidtransPay?.(order)}
                          className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border-none"
                        >
                          <span className="material-symbols-outlined text-[16px] text-white">payments</span>
                          <span>Bayar via VA / QRIS</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForPayment(order)}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border-none"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Upload Bukti Bayar</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {(order.status === "DELIVERED" || order.status === "SHIPPED") && (
                      <button
                        type="button"
                        onClick={() => setViewingFaktur(order)}
                        className="flex-1 py-2.5 bg-white border border-outline-variant/30 text-on-surface-variant hover:text-foreground font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-primary" />
                        <span>e-Faktur</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setViewingDetailOrder(order)}
                      className="flex-1 py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-xl font-bold transition-all text-xs border-none cursor-pointer"
                    >
                      Detail Pesanan
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
