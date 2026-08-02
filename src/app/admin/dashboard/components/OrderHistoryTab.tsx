"use client";

import { printCDOBDocument } from "@/lib/pdf-generator";
import BiteshipTrackingModal from "@/app/components/BiteshipTrackingModal";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, FileText, X, CheckCircle2, ShieldAlert, RefreshCw } from "lucide-react";

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

export default function OrderHistoryTab({
  orders,
  onRejectOrder,
  onDeleteOrder,
}: OrderHistoryTabProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
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

    return matchesSearch && matchesStatus;
  });

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
        for (const id of selectedOrderIds) {
          await onDeleteOrder(id);
        }
        setSelectedOrderIds([]);
      } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan saat menghapus pesanan.");
      } finally {
        setIsDeletingBulk(false);
      }
    }
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
            Packing / Logistics
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Sedang Dikirim
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✓ Diterima
          </span>
        );
      case "REJECTED": {
        const isBiteship = (order?.rejectionReason || "").toLowerCase().includes("biteship") || (order?.rejectionReason || "").toLowerCase().includes("ekspedisi");
        return isBiteship ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-800 border border-red-300 shadow-2xs">
            🚨 Dibatalkan Biteship
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Rejected / Ditolak
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
          <span className="text-[10px] font-bold text-emerald-600">Lunas</span>
        );
      case "PENDING_VERIFICATION":
        return (
          <span className="text-[10px] font-bold text-amber-500 animate-pulse">Menunggu Verifikasi</span>
        );
      case "UNPAID":
        return (
          <span className="text-[10px] font-bold text-rose-500">Belum Bayar</span>
        );
      default:
        return (
          <span className="text-[10px] text-slate-500">{status}</span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-foreground">Riwayat Transaksi &amp; Order</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">Monitoring seluruh log surat pesanan apotek mitra beserta status logistik dan pembayaran.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-surface-container-lowest p-4 border border-outline-variant/30 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-outline" />
          <input
            type="text"
            placeholder="Cari nomor pesanan atau nama apotek..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (isSelectionMode) {
                setIsSelectionMode(false);
                setSelectedOrderIds([]);
              } else {
                setIsSelectionMode(true);
              }
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${isSelectionMode
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-slate-100"
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isSelectionMode ? "close" : "checklist"}
            </span>
            <span>{isSelectionMode ? "Selesai Tandai" : "Opsi Tandai"}</span>
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="ALL">Semua Status Order</option>
            <option value="BITESHIP_CANCELLED">🚨 Dibatalkan Biteship</option>
            <option value="PENDING_APPROVAL">Menunggu Approval</option>
            <option value="PENDING_SHIPPING">Proses Logistik (Packing)</option>
            <option value="SHIPPED">Sedang Dikirim</option>
            <option value="DELIVERED">✓ Diterima</option>
            <option value="CANCELLED">Dibatalkan Mitra</option>
            <option value="REJECTED">Ditolak Admin</option>
          </select>

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
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-none"
            title="Refresh Data & Sync Status Biteship"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Refresh Status"}</span>
          </button>
        </div>
      </div>

      {/* Bulk Delete Banner Action (Hanya tampil saat isSelectionMode dan ada yang ditandai) */}
      {isSelectionMode && selectedOrderIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between gap-4 text-xs shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 text-rose-950 font-bold">
            <span className="material-symbols-outlined text-red-600 text-lg">check_box</span>
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
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 text-xs disabled:opacity-50 border-none"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              {isDeletingBulk ? "Menghapus..." : `Hapus ${selectedOrderIds.length} Pesanan`}
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-surface-container-low border-b border-outline-variant/30 text-on-surface-variant font-bold">
              <tr>
                {isSelectionMode && (
                  <th className="px-4 py-3.5 text-center w-12">
                    <input
                      type="checkbox"
                      checked={
                        filteredOrders.length > 0 &&
                        filteredOrders.every((o) => selectedOrderIds.includes(o.id))
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                  </th>
                )}
                <th className="px-5 py-3.5 uppercase tracking-wider text-[10px] whitespace-nowrap w-44">No. Pesanan / Tanggal</th>
                <th className="px-5 py-3.5 uppercase tracking-wider text-[10px] whitespace-nowrap min-w-[200px]">Mitra Apotek</th>
                <th className="px-5 py-3.5 uppercase tracking-wider text-[10px] whitespace-nowrap w-36 text-center">Metode Pembayaran</th>
                <th className="px-5 py-3.5 uppercase tracking-wider text-[10px] whitespace-nowrap text-right w-32">Total IDR</th>
                <th className="px-5 py-3.5 uppercase tracking-wider text-[10px] whitespace-nowrap text-center w-36">Status Pembayaran</th>
                <th className="px-5 py-3.5 uppercase tracking-wider text-[10px] whitespace-nowrap text-center w-36">Status Logistik</th>
                <th className="px-5 py-3.5 text-center text-[10px] whitespace-nowrap w-52">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={isSelectionMode ? 8 : 7} className="px-6 py-12 text-center text-on-surface-variant font-semibold">
                    Tidak ditemukan data riwayat order yang cocok.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const { total } = calculateOrderTotals(order);
                  const isChecked = selectedOrderIds.includes(order.id);

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${isChecked ? "bg-primary/5" : "hover:bg-slate-50/50"
                        }`}
                    >
                      {isSelectionMode && (
                        <td className="px-4 py-4 text-center w-12" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleSelectOne(order.id, e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 font-mono whitespace-nowrap">
                        <span className="font-extrabold text-slate-800 block">{order.orderNumber}</span>
                        <span className="text-[10px] text-on-surface-variant/60">{new Date(order.createdAt).toLocaleDateString("id-ID")}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 truncate max-w-[220px]" title={order.institution.name}>{order.institution.name}</div>
                        <div className="text-[10px] text-on-surface-variant/70 truncate max-w-[220px]" title={order.institution.address}>{order.institution.address}</div>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {order.paymentMethod === "VA" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                            Bank Transfer (VA)
                          </span>
                        ) : order.paymentMethod === "TOP" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Credit Limit / TOP
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Invoice Billing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-right text-slate-800 whitespace-nowrap">
                        Rp {total.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold whitespace-nowrap">
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {getStatusBadge(order.status, order)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveDropdownOrderId(order.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                        >
                          <span>Aksi</span>
                          <span className="material-symbols-outlined text-[14px]">settings</span>
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

      {/* DETAIL MODAL */}
      {selectedDetailOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm font-sans">
          <div className="bg-white border border-outline-variant/30 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 relative flex flex-col max-h-[90vh]">
            <button
              type="button"
              onClick={() => setSelectedDetailOrder(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 transition-colors text-outline cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <h3 className="text-base font-heading font-extrabold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Detail Surat Pesanan &amp; Logistik</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Detail transaksi nomor {selectedDetailOrder.orderNumber}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs overflow-y-auto pr-1 flex-1">
              {/* Left Column: Mitra & APJ Info */}
              <div className="space-y-4">
                <div className="bg-surface-container-low/40 p-4 border border-outline-variant/20 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Informasi Sarana / Mitra</h4>
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-900 text-xs">{selectedDetailOrder.institution.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{selectedDetailOrder.institution.address}</p>
                    <p className="text-[10px] text-on-surface-variant font-mono">No. SIA: {selectedDetailOrder.institution.siaNumber}</p>
                  </div>
                </div>

                <div className="bg-surface-container-low/40 p-4 border border-outline-variant/20 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Apoteker Penanggung Jawab</h4>
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-900 text-xs">{selectedDetailOrder.createdBy.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-mono">No. SIPA: {selectedDetailOrder.createdBy.sipaNumber || "-"}</p>
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
                <div className="bg-surface-container-low/40 p-4 border border-outline-variant/20 rounded-2xl space-y-3 flex-1 flex flex-col">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Detail Item Obat</h4>
                  <div className="divide-y divide-outline-variant/10 overflow-y-auto max-h-48 pr-1 space-y-2 flex-1">
                    {selectedDetailOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between py-1.5 text-[11px]">
                        <div>
                          <p className="font-bold text-slate-900">{item.product.name}</p>
                          <p className="text-[9px] text-on-surface-variant/60">
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
                  <div className="border-t border-outline-variant/20 pt-3 mt-3 text-xs space-y-1.5 font-sans">
                    {(() => {
                      const { subtotal, vat, shippingFee, total } = calculateOrderTotals(selectedDetailOrder);
                      return (
                        <>
                          <div className="flex justify-between text-on-surface-variant/80 text-[10px]">
                            <span>Subtotal Produk:</span>
                            <span className="font-mono">Rp {subtotal.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between text-on-surface-variant/80 text-[10px]">
                            <span>PPN (11%):</span>
                            <span className="font-mono">Rp {vat.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between text-on-surface-variant/80 text-[10px]">
                            <span>Biaya Pengiriman:</span>
                            <span className="font-mono">Rp {shippingFee.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="pt-2 border-t border-outline-variant/20 flex justify-between items-end text-xs">
                            <span className="font-extrabold text-slate-900">Total Tagihan:</span>
                            <span className="font-mono font-extrabold text-sm text-primary">
                              Rp {total.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-surface-container-low/40 p-4 border border-outline-variant/20 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Informasi Pembayaran &amp; Pengiriman</h4>
                  <div className="grid grid-cols-2 gap-4 text-[10px]">
                    <div>
                      <p className="text-on-surface-variant font-bold">Metode Bayar</p>
                      <p className="text-slate-800 font-semibold">{selectedDetailOrder.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant font-bold">Status Bayar</p>
                      <p className="text-slate-800 font-semibold">{selectedDetailOrder.paymentStatus}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant font-bold">Status Logistik</p>
                      <p className="text-slate-800 font-semibold">{selectedDetailOrder.status}</p>
                    </div>
                    <div>
                      <p className="text-on-surface-variant font-bold">Nomor Resi / Pelacakan</p>
                      <p className="text-slate-800 font-semibold font-mono">{selectedDetailOrder.trackingNumber || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SP e-Sign / Signature Preview */}
            {selectedDetailOrder.spSignature && (
              <div className="bg-slate-50 p-4 border border-outline-variant/20 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">Digital e-Signature Valid</p>
                  <p className="text-[9px] text-slate-400">Ditandatangani secara digital oleh APJ Mitra Apotek saat checkout.</p>
                </div>
                <div className="w-16 h-10 bg-white border border-outline-variant/25 rounded flex items-center justify-center p-1">
                  <img src={selectedDetailOrder.spSignature} alt="e-Signature" className="max-h-full object-contain" />
                </div>
              </div>
            )}

            {/* CDOB Documents Digital Archive */}
            <div className="bg-slate-50 p-4 border border-outline-variant/20 rounded-2xl space-y-3 text-xs font-sans">
              <p className="font-bold text-slate-900">Arsip Digital Dokumen CDOB Resmi</p>
              <p className="text-[10px] text-slate-400">Dokumen transaksi resmi dapat diunduh atau dicetak oleh admin untuk arsip fisik PBF.</p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => printCDOBDocument(selectedDetailOrder, "SP")}
                  className="py-2 bg-white hover:bg-slate-100 border border-outline-variant/30 text-primary text-[10px] font-extrabold rounded-xl transition-all cursor-pointer shadow-sm text-center"
                  title="Cetak Surat Pesanan Apotek"
                >
                  Cetak SP
                </button>
                <button
                  type="button"
                  onClick={() => printCDOBDocument(selectedDetailOrder, "INVOICE")}
                  className="py-2 bg-white hover:bg-slate-100 border border-outline-variant/30 text-primary text-[10px] font-extrabold rounded-xl transition-all cursor-pointer shadow-sm text-center"
                  title="Cetak Invoice e-Faktur Penjualan"
                >
                  e-Faktur
                </button>
                <button
                  type="button"
                  disabled={selectedDetailOrder.status === "PENDING_APPROVAL" || selectedDetailOrder.status === "REJECTED"}
                  onClick={() => printCDOBDocument(selectedDetailOrder, "SURAT_JALAN")}
                  className="py-2 bg-white hover:bg-slate-100 border border-outline-variant/30 text-primary text-[10px] font-extrabold rounded-xl transition-all cursor-pointer shadow-sm text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Cetak Surat Jalan Logistik PBF"
                >
                  Surat Jalan
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-2 border-t border-outline-variant/10">
              <div className="flex gap-2">
                {selectedDetailOrder.trackingNumber && (
                  <button
                    type="button"
                    onClick={() => setTrackingModalOrderId(selectedDetailOrder.id)}
                    className="px-3 py-1.5 bg-primary text-white hover:bg-primary/90 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer shadow-sm flex items-center gap-1 border-none"
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
                    className="px-3 py-1.5 border border-error text-error hover:bg-red-50 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1"
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
                  className="px-3 py-1.5 border border-outline-variant text-on-surface-variant hover:bg-slate-100 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  Hapus Pesanan
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetailOrder(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
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
            <div className="bg-white border border-outline-variant/30 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 text-center relative">
              <button
                type="button"
                onClick={() => setActiveDropdownOrderId(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 transition-colors text-outline cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5 pt-2">
                <h3 className="text-sm font-heading font-extrabold text-foreground">
                  Pilihan Tindakan Pesanan
                </h3>
                <p className="text-[11px] text-on-surface-variant/80 font-mono">
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
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Eye className="w-4 h-4 text-white" />
                  <span>Detail Progress SP</span>
                </button>

                {order.status !== "REJECTED" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCancel(order.id);
                      setActiveDropdownOrderId(null);
                    }}
                    className="w-full py-2.5 border border-error text-error hover:bg-red-50/50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4 text-error" />
                    <span>Batalkan Pesanan (Kembalikan Stok)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleDelete(order.id);
                    setActiveDropdownOrderId(null);
                  }}
                  className="w-full py-2.5 border border-outline-variant text-on-surface-variant hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-slate-500">delete</span>
                  <span>Hapus Pesanan Permanen</span>
                </button>
              </div>

              <div className="pt-2 border-t border-outline-variant/10">
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
