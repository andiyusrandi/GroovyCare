"use client";

import { printCDOBDocument } from "@/lib/pdf-generator";
import BiteshipTrackingModal from "@/app/components/BiteshipTrackingModal";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, FileText, Printer, Truck, X, ShieldAlert, RefreshCw, AlertTriangle, MoreHorizontal, Download, DollarSign, CheckCircle2, XCircle } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    unit: string;
  };
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
  paymentMethod: string;
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
}

interface OrderHistoryTabProps {
  orders: Order[];
  onRejectOrder: (orderId: string, reason: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onDeleteBulkOrders?: (orderIds: string[]) => Promise<void>;
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

// Helper to extract short location (e.g., Kota/Kabupaten) from address
function formatShortLocation(fullAddress: string) {
  if (!fullAddress) return "";
  const cityMatch = fullAddress.match(/(Kota|Kab\.|Kabupaten)\s+[A-Za-z\s]+/i);
  if (cityMatch) return cityMatch[0];
  const parts = fullAddress.split(",");
  if (parts.length > 1) return parts[parts.length - 1].trim();
  return fullAddress.length > 25 ? `${fullAddress.substring(0, 25)}...` : fullAddress;
}

export default function OrderHistoryTab({
  orders,
  onRejectOrder,
  onDeleteOrder,
  onDeleteBulkOrders,
}: OrderHistoryTabProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);
  const [activeDropdownOrderId, setActiveDropdownOrderId] = useState<string | null>(null);
  const [trackingModalOrderId, setTrackingModalOrderId] = useState<string | null>(null);

  // Multi-select & Bulk delete state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const handleCancel = async (orderId: string) => {
    const reason = prompt("Masukkan alasan pembatalan pesanan (stok dan kredit akan dikembalikan):");
    if (reason !== null) {
      await onRejectOrder(orderId, reason || "Dibatalkan oleh Admin");
    }
  };

  const handleDelete = async (orderId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus pesanan ini secara permanen?")) {
      await onDeleteOrder(orderId);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.institution.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "BITESHIP_CANCELLED"
          ? order.status === "REJECTED" && ((order.rejectionReason || "").toLowerCase().includes("biteship") || (order.rejectionReason || "").toLowerCase().includes("ekspedisi"))
          : order.status === statusFilter;

    const matchesPayment =
      paymentFilter === "ALL"
        ? true
        : order.paymentStatus === paymentFilter;

    let matchesDate = true;
    if (dateRangeFilter !== "ALL") {
      const createdTime = new Date(order.createdAt).getTime();
      const now = new Date().getTime();
      const diffDays = (now - createdTime) / (1000 * 60 * 60 * 24);

      if (dateRangeFilter === "LAST_30" && diffDays > 30) matchesDate = false;
      if (dateRangeFilter === "THIS_MONTH") {
        const orderDate = new Date(order.createdAt);
        const today = new Date();
        if (orderDate.getMonth() !== today.getMonth() || orderDate.getFullYear() !== today.getFullYear()) matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  // Summary statistics for filtered orders
  const totalRealizedRevenue = filteredOrders
    .filter((o) => o.paymentStatus === "PAID" || o.status === "DELIVERED")
    .reduce((sum, o) => sum + calculateOrderTotals(o).total, 0);

  const completedCount = filteredOrders.filter((o) => o.status === "DELIVERED" || o.paymentStatus === "PAID").length;
  const rejectedCount = filteredOrders.filter((o) => o.status === "REJECTED" || o.status === "CANCELLED").length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFilteredIds = filteredOrders.map((o) => o.id);
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    } else {
      const allFilteredIds = new Set(filteredOrders.map((o) => o.id));
      setSelectedOrderIds((prev) => prev.filter((id) => !allFilteredIds.has(id)));
    }
  };

  const handleSelectOne = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds((prev) => [...prev, orderId]);
    } else {
      setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus ${selectedOrderIds.length} pesanan yang ditandai secara permanen?`
      )
    ) {
      setIsDeletingBulk(true);
      try {
        if (onDeleteBulkOrders) {
          await onDeleteBulkOrders(selectedOrderIds);
        } else {
          for (const id of selectedOrderIds) {
            await onDeleteOrder(id);
          }
        }
        setSelectedOrderIds([]);
        setIsSelectionMode(false);
      } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan saat menghapus pesanan.");
      } finally {
        setIsDeletingBulk(false);
      }
    }
  };

  const handleExportData = () => {
    window.print();
  };

  const getStatusBadge = (status: string, order?: any) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Waiting Approval
          </span>
        );
      case "PENDING_SHIPPING":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            Proses Packing
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            Sedang Dikirim
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ Selesai
          </span>
        );
      case "REJECTED": {
        const isBiteship = (order?.rejectionReason || "").toLowerCase().includes("biteship") || (order?.rejectionReason || "").toLowerCase().includes("ekspedisi");
        return isBiteship ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-800 border border-red-300 shadow-2xs">
            🚨 Dibatalkan Biteship
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Ditolak
          </span>
        );
      }
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 border border-red-200">
            Dibatalkan Mitra
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Lunas
          </span>
        );
      case "PENDING_VERIFICATION":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            Verifikasi
          </span>
        );
      case "UNPAID":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
            Belum Bayar
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Page Title & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900">Riwayat &amp; Arsip Pesanan</h2>
          <p className="text-xs text-slate-500 mt-0.5">Penampungan seluruh transaksi terselesaikan, ditolak, atau dibatalkan untuk audit &amp; pelaporan.</p>
        </div>

        <button
          type="button"
          onClick={handleExportData}
          className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-2xl font-extrabold text-xs shadow-xs hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer shrink-0 border border-emerald-800/30"
        >
          <Download className="w-4 h-4" />
          <span>Export Rekap Data (PDF/Print)</span>
        </button>
      </div>

      {/* Summary Revenue & Statistics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Realisasi Lunas</span>
            <span className="text-lg font-heading font-black text-emerald-700 font-mono">
              Rp {totalRealizedRevenue.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Transaksi Selesai</span>
            <span className="text-lg font-heading font-black text-slate-900 font-mono">
              {completedCount} Pesanan
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Ditolak / Dibatalkan</span>
            <span className="text-lg font-heading font-black text-rose-600 font-mono">
              {rejectedCount} Pesanan
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Unified Toolbar & Filters Bar */}
      <div className="bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex flex-1 items-center gap-2.5 min-w-0 flex-wrap">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari No. SP, Nama Apotek, Invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-2xs"
            />
          </div>

          {/* Date Range Filter */}
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200/90 rounded-2xl text-slate-700 font-bold text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer shadow-2xs"
          >
            <option value="ALL">Semua Tanggal Periode</option>
            <option value="THIS_MONTH">Bulan Ini</option>
            <option value="LAST_30">30 Hari Terakhir</option>
          </select>

          {/* Filter Status Order */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200/90 rounded-2xl text-slate-700 font-bold text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer shadow-2xs"
          >
            <option value="ALL">Semua Status Order</option>
            <option value="DELIVERED">✓ Selesai / Diterima</option>
            <option value="BITESHIP_CANCELLED">🚨 Dibatalkan Biteship</option>
            <option value="PENDING_APPROVAL">Menunggu Approval</option>
            <option value="PENDING_SHIPPING">Proses Logistik (Packing)</option>
            <option value="SHIPPED">Sedang Dikirim</option>
            <option value="CANCELLED">Dibatalkan Mitra</option>
            <option value="REJECTED">Ditolak Admin</option>
          </select>

          {/* Filter Status Pembayaran */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200/90 rounded-2xl text-slate-700 font-bold text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer shadow-2xs"
          >
            <option value="ALL">Semua Pembayaran</option>
            <option value="PAID">🟢 Lunas</option>
            <option value="UNPAID">🔴 Belum Bayar</option>
            <option value="PENDING_VERIFICATION">🟡 Menunggu Verifikasi</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Multi Select Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSelectionMode && selectedOrderIds.length > 0) {
                setIsSelectionMode(false);
                setSelectedOrderIds([]);
              } else {
                setIsSelectionMode(true);
                setSelectedOrderIds(filteredOrders.map((o) => o.id));
              }
            }}
            className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 shadow-2xs ${selectedOrderIds.length > 0
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50"
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {selectedOrderIds.length > 0 ? "check_box" : "checklist"}
            </span>
            <span>
              {selectedOrderIds.length > 0
                ? `Tandai (${selectedOrderIds.length})`
                : "Tandai Semua"}
            </span>
          </button>

          {/* Refresh & Sync Button */}
          <button
            type="button"
            onClick={async () => {
              setIsRefreshing(true);
              try {
                const { syncAllBiteshipOrders } = await import("@/app/actions/orders");
                await syncAllBiteshipOrders();
              } catch (e) {
                console.warn("Sync error:", e);
              }
              router.refresh();
              setTimeout(() => setIsRefreshing(false), 800);
            }}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold rounded-2xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer border border-emerald-800/30"
            title="Refresh Data & Sync Status Biteship"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Sync..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Bulk Delete Banner Action */}
      {isSelectionMode && selectedOrderIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between gap-4 text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2 text-rose-950 font-bold">
            <span className="material-symbols-outlined text-rose-600 text-lg">check_box</span>
            <span>{selectedOrderIds.length} pesanan ditandai</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="px-3.5 py-1.5 bg-white border border-rose-200 text-rose-800 font-bold rounded-xl hover:bg-rose-100 transition-colors cursor-pointer text-xs"
            >
              Batal Pilih
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isDeletingBulk}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 text-xs disabled:opacity-50 border-none"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              {isDeletingBulk ? "Menghapus..." : `Hapus ${selectedOrderIds.length} Pesanan`}
            </button>
          </div>
        </div>
      )}

      {/* Main High-Density Table (Full Width Fit) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">
              <tr>
                {isSelectionMode && (
                  <th className="px-3 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredOrders.length > 0 &&
                        filteredOrders.every((o) => selectedOrderIds.includes(o.id))
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                  </th>
                )}
                <th className="px-4 py-3">No. SP &amp; Tanggal</th>
                <th className="px-4 py-3">Mitra Apotek / Lokasi</th>
                <th className="px-3 py-3 text-center">Metode</th>
                <th className="px-4 py-3 text-right">Total IDR</th>
                <th className="px-3 py-3 text-center">Status Pembayaran</th>
                <th className="px-3 py-3 text-center">Status Logistik</th>
                <th className="px-4 py-3 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={isSelectionMode ? 8 : 7} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    Tidak ditemukan data riwayat order yang cocok.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const { total } = calculateOrderTotals(order);
                  const isChecked = selectedOrderIds.includes(order.id);
                  const shortLoc = formatShortLocation(order.institution.address);

                  // Anomaly detection: UNPAID but SHIPPED/PACKING and NOT TOP
                  const isAnomalyRisk =
                    order.paymentStatus === "UNPAID" &&
                    (order.status === "SHIPPED" || order.status === "PENDING_SHIPPING") &&
                    order.paymentMethod !== "TOP";

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors hover:bg-emerald-50/30 ${isChecked ? "bg-emerald-50/30" : ""
                        }`}
                    >
                      {isSelectionMode && (
                        <td className="px-3 py-3 text-center w-10" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleSelectOne(order.id, e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 font-mono whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 block text-xs">{order.orderNumber}</span>
                        <span className="text-[10px] text-slate-400 font-sans">{new Date(order.createdAt).toLocaleDateString("id-ID")}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="font-extrabold text-slate-900 text-xs truncate max-w-[200px]"
                          title={`${order.institution.name} — ${order.institution.address}`}
                        >
                          {order.institution.name}
                        </div>
                        {shortLoc && (
                          <div
                            className="text-[10px] text-slate-500 truncate max-w-[200px]"
                            title={order.institution.address}
                          >
                            {shortLoc}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {order.paymentMethod === "VA" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                            Bank VA
                          </span>
                        ) : order.paymentMethod === "TOP" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Tempo / TOP
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Invoice Billing
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-right text-slate-900 whitespace-nowrap text-xs">
                        Rp {total.toLocaleString("id-ID")}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {getStatusBadge(order.status, order)}
                          {isAnomalyRisk && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-amber-100 text-amber-800 border border-amber-300"
                              title="Risiko CDOB: Barang dikirim sebelum terverifikasi bayar!"
                            >
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600 animate-bounce" />
                              Risk
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* 1. Quick Detail Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailOrder(order)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95"
                            title="Lihat Detail Surat Pesanan & Faktur"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-800" />
                          </button>

                          {/* 2. Quick Print SP Button */}
                          <button
                            type="button"
                            onClick={() => printCDOBDocument(order, "SP")}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95"
                            title="Cetak Surat Pesanan (SP)"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-700" />
                          </button>

                          {/* 3. Quick Tracking or More Action */}
                          {order.trackingNumber ? (
                            <button
                              type="button"
                              onClick={() => setTrackingModalOrderId(order.id)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all cursor-pointer border border-emerald-200/80 shadow-2xs active:scale-95"
                              title="Lacak Resi Live"
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveDropdownOrderId(order.id)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer border border-slate-200/80 shadow-2xs active:scale-95"
                              title="Menu Opsi Lainnya"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5 text-slate-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedDetailOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm font-sans">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 relative flex flex-col max-h-[90vh]">
            <button
              type="button"
              onClick={() => setSelectedDetailOrder(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <h3 className="text-base font-heading font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                <span>Detail Surat Pesanan &amp; Logistik</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Detail transaksi nomor {selectedDetailOrder.orderNumber}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs overflow-y-auto pr-1 flex-1">
              {/* Left Column: Mitra & APJ Info */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-2xl space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Informasi Sarana / Mitra</h4>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-xs">{selectedDetailOrder.institution.name}</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{selectedDetailOrder.institution.address}</p>
                    <p className="text-[10px] text-slate-500 font-mono">No. SIA: {selectedDetailOrder.institution.siaNumber}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-2xl space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Apoteker Penanggung Jawab</h4>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-xs">{selectedDetailOrder.createdBy.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">No. SIPA: {selectedDetailOrder.createdBy.sipaNumber || "-"}</p>
                  </div>
                </div>

                {selectedDetailOrder.status === "REJECTED" && selectedDetailOrder.rejectionReason && (
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-2.5 text-rose-800 text-[10px]">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Alasan Penolakan SP:</span>
                      {selectedDetailOrder.rejectionReason}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Order Items & Payment Info */}
              <div className="space-y-4 flex flex-col h-full">
                <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-2xl space-y-3 flex-1 flex flex-col">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Detail Item Obat</h4>
                  <div className="divide-y divide-slate-200 overflow-y-auto max-h-48 pr-1 space-y-2 flex-1">
                    {selectedDetailOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between py-1.5 text-[11px]">
                        <div>
                          <p className="font-bold text-slate-900">{item.product.name}</p>
                          <p className="text-[9px] text-slate-500">
                            {item.quantity} {item.product.unit} × Rp {item.price.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-800 self-center">
                          Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Totals Summary Breakdown */}
                  <div className="border-t border-slate-200 pt-3 mt-3 text-xs space-y-1 font-sans">
                    {(() => {
                      const { subtotal, vat, shippingFee, total } = calculateOrderTotals(selectedDetailOrder);
                      return (
                        <>
                          <div className="flex justify-between text-slate-500 text-[10px]">
                            <span>Subtotal Produk:</span>
                            <span className="font-mono">Rp {subtotal.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[10px]">
                            <span>PPN (11%):</span>
                            <span className="font-mono">Rp {vat.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[10px]">
                            <span>Biaya Pengiriman:</span>
                            <span className="font-mono">Rp {shippingFee.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-200 flex justify-between items-end text-xs">
                            <span className="font-extrabold text-slate-900">Total Tagihan:</span>
                            <span className="font-mono font-extrabold text-sm text-emerald-700">
                              Rp {total.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-2xl space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Informasi Pembayaran &amp; Pengiriman</h4>
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div>
                      <p className="text-slate-500 font-bold">Metode Bayar</p>
                      <p className="text-slate-800 font-semibold">{selectedDetailOrder.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold">Status Bayar</p>
                      <p className="text-slate-800 font-semibold">{selectedDetailOrder.paymentStatus}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold">Status Logistik</p>
                      <p className="text-slate-800 font-semibold">{selectedDetailOrder.status}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold">Nomor Resi / Pelacakan</p>
                      <p className="text-slate-800 font-semibold font-mono">{selectedDetailOrder.trackingNumber || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SP e-Sign / Signature Preview */}
            {selectedDetailOrder.spSignature && (
              <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">Digital e-Signature Valid</p>
                  <p className="text-[9px] text-slate-400">Ditandatangani secara digital oleh APJ Mitra Apotek saat checkout.</p>
                </div>
                <div className="w-16 h-10 bg-white border border-slate-200/80 rounded flex items-center justify-center p-1">
                  <img src={selectedDetailOrder.spSignature} alt="e-Signature" className="max-h-full object-contain" />
                </div>
              </div>
            )}

            {/* CDOB Documents Digital Archive */}
            <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-2xl space-y-2 text-xs font-sans">
              <p className="font-bold text-slate-900">Arsip Digital Dokumen CDOB Resmi</p>
              <p className="text-[10px] text-slate-400">Dokumen transaksi resmi dapat diunduh atau dicetak oleh admin untuk arsip fisik PBF.</p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => printCDOBDocument(selectedDetailOrder, "SP")}
                  className="py-2 bg-white hover:bg-slate-100 border border-slate-200/90 text-emerald-700 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer shadow-2xs text-center"
                  title="Cetak Surat Pesanan Apotek"
                >
                  Cetak SP
                </button>
                <button
                  type="button"
                  onClick={() => printCDOBDocument(selectedDetailOrder, "INVOICE")}
                  className="py-2 bg-white hover:bg-slate-100 border border-slate-200/90 text-emerald-700 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer shadow-2xs text-center"
                  title="Cetak Invoice e-Faktur Penjualan"
                >
                  e-Faktur
                </button>
                <button
                  type="button"
                  disabled={selectedDetailOrder.status === "PENDING_APPROVAL" || selectedDetailOrder.status === "REJECTED"}
                  onClick={() => printCDOBDocument(selectedDetailOrder, "SURAT_JALAN")}
                  className="py-2 bg-white hover:bg-slate-100 border border-slate-200/90 text-emerald-700 text-[10px] font-extrabold rounded-xl transition-all cursor-pointer shadow-2xs text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cetak Surat Jalan Logistik PBF"
                >
                  Surat Jalan
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <div className="flex gap-2">
                {selectedDetailOrder.trackingNumber && (
                  <button
                    type="button"
                    onClick={() => setTrackingModalOrderId(selectedDetailOrder.id)}
                    className="px-3 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer shadow-xs flex items-center gap-1 border-none"
                  >
                    <span className="material-symbols-outlined text-[15px]">radar</span>
                    Lacak In-App
                  </button>
                )}
                {selectedDetailOrder.status !== "REJECTED" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCancel(selectedDetailOrder.id);
                      setSelectedDetailOrder(null);
                    }}
                    className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Batalkan Pesanan
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleDelete(selectedDetailOrder.id);
                    setSelectedDetailOrder(null);
                  }}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  Hapus Pesanan
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetailOrder(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION CHOICE MODAL (CENTERED POPUP) */}
      {activeDropdownOrderId && (() => {
        const order = orders.find(o => o.id === activeDropdownOrderId);
        if (!order) return null;
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm font-sans animate-fadeIn">
            <div className="bg-white border border-slate-200/80 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-center relative">
              <button
                type="button"
                onClick={() => setActiveDropdownOrderId(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5 pt-2">
                <h3 className="text-sm font-heading font-extrabold text-slate-900">
                  Pilihan Tindakan Pesanan
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {order.orderNumber} • {order.institution.name}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDetailOrder(order);
                    setActiveDropdownOrderId(null);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Eye className="w-4 h-4 text-white" />
                  <span>Detail Progress SP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    printCDOBDocument(order, "SP");
                    setActiveDropdownOrderId(null);
                  }}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-700" />
                  <span>Cetak Surat Pesanan (SP)</span>
                </button>

                {order.status !== "REJECTED" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCancel(order.id);
                      setActiveDropdownOrderId(null);
                    }}
                    className="w-full py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4 text-rose-600" />
                    <span>Batalkan Pesanan (Kembalikan Stok)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleDelete(order.id);
                    setActiveDropdownOrderId(null);
                  }}
                  className="w-full py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-500">delete</span>
                  <span>Hapus Pesanan Permanen</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveDropdownOrderId(null)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Tutup Opsi
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Live Tracking Biteship In-App */}
      <BiteshipTrackingModal
        orderId={trackingModalOrderId}
        isOpen={!!trackingModalOrderId}
        onClose={() => setTrackingModalOrderId(null)}
      />
    </div>
  );
}
