"use client";

import { printCDOBDocument } from "@/lib/pdf-generator";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, Info, Eye, ChevronRight, X, MessageSquare, ShieldCheck, Clock, FileText, CheckCircle, Search } from "lucide-react";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    unit: string;
    category?: string;
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
  paymentMethod: string;
  rejectionReason: string | null;
  institution: {
    name: string;
    address: string;
    siaNumber: string;
    siaExpiry: Date;
    creditLimit?: number;
    currentDebt?: number;
  };
  createdBy: {
    name: string;
    sipaNumber: string | null;
    sipaExpiry: Date | null;
  };
  items: OrderItem[];
  batchAllocations: Allocation[];
}

interface OrderApprovalsTabProps {
  orders: Order[];
  today: Date;
  onApproveOrder: (orderId: string) => Promise<void>;
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

export default function OrderApprovalsTab({
  orders,
  today,
  onApproveOrder,
  onRejectOrder,
  onDeleteOrder,
}: OrderApprovalsTabProps) {
  const pendingOrders = orders.filter((o) => o.status === "PENDING_APPROVAL");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    pendingOrders.length > 0 ? pendingOrders[0] : null
  );

  // Search filter for approval queue
  const [searchQueue, setSearchQueue] = useState("");

  // Rejection input states
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter queue by search
  const filteredPendingOrders = pendingOrders.filter((o) => {
    const q = searchQueue.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.institution.name.toLowerCase().includes(q) ||
      (o.createdBy.name && o.createdBy.name.toLowerCase().includes(q))
    );
  });

  // If selectedOrder is no longer in pendingOrders (e.g. approved), reset
  const activeOrder = pendingOrders.find((o) => o.id === selectedOrder?.id) || filteredPendingOrders[0] || pendingOrders[0] || null;

  async function handleApprove() {
    if (!activeOrder) return;
    setIsSubmitting(true);
    try {
      await onApproveOrder(activeOrder.id);
      setIsRejectMode(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReject() {
    if (!activeOrder || !rejectReason.trim()) {
      alert("Alasan penolakan wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onRejectOrder(activeOrder.id, rejectReason);
      setIsRejectMode(false);
      setRejectReason("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Count metrics
  const totalValueToday = orders
    .filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate.toDateString() === today.toDateString();
    })
    .reduce((sum, o) => {
      return sum + calculateOrderTotals(o).total;
    }, 0);

  const failCount = orders.filter((o) => o.status === "REJECTED").length;
  const readyToRelease = orders.filter((o) => o.status === "APPROVED" || o.status === "PENDING_SHIPPING").length;

  return (
    <div className="space-y-4 animate-fadeIn font-sans">
      {/* Slim Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 px-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="font-heading font-extrabold text-lg text-slate-900 leading-tight">
            Pesanan Aktif &amp; Verifikasi CDOB
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Validasi Surat Pesanan (SP) digital, e-Sign APJ, dan kepatuhan regulasi BPOM sebelum alokasi stok.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-xl border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Standar CDOB BPOM</span>
          </span>
        </div>
      </div>

      {/* Compact KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-100 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">Menunggu Verifikasi</span>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 font-mono mt-0.5">{pendingOrders.length} <span className="text-xs font-bold text-slate-400 font-sans">SP</span></h3>
          </div>
        </div>

        <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 border border-rose-100 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">Validasi Gagal</span>
            <h3 className="font-heading font-extrabold text-xl text-rose-600 font-mono mt-0.5">{failCount} <span className="text-xs font-bold text-slate-400 font-sans">Kasus</span></h3>
          </div>
        </div>

        <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">Siap Logistik</span>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 font-mono mt-0.5">{readyToRelease} <span className="text-xs font-bold text-slate-400 font-sans">Order</span></h3>
          </div>
        </div>

        <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">Total Nilai Hari Ini</span>
            <h3 className="font-heading font-extrabold text-lg text-emerald-700 font-mono mt-0.5 truncate">Rp {totalValueToday.toLocaleString("id-ID")}</h3>
          </div>
        </div>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-xs font-semibold shadow-2xs">
          Tidak ada pesanan SP masuk yang menunggu verifikasi CDOB saat ini.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Left Panel: Order Queue Table (58%) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col shadow-2xs w-full lg:w-[58%] shrink-0">
            <div className="p-3.5 px-4 border-b border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
              <div>
                <h5 className="font-heading font-extrabold text-xs text-slate-900">Antrean Verifikasi Order ({filteredPendingOrders.length})</h5>
                <p className="text-[10px] text-slate-500">Klik baris order untuk meninjau detail SP CDOB</p>
              </div>
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Cari SP / Apotek..."
                  value={searchQueue}
                  onChange={(e) => setSearchQueue(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-2xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">
                    <th className="px-4 py-3">No. SP</th>
                    <th className="px-4 py-3">Mitra Apotek</th>
                    <th className="px-3 py-3">Pembayaran</th>
                    <th className="px-4 py-3 text-right">Total Tagihan</th>
                    <th className="px-3 py-3 text-center">Status CDOB</th>
                    <th className="px-2 py-3 w-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700">
                  {filteredPendingOrders.map((order) => {
                    const { total: orderVal } = calculateOrderTotals(order);
                    const isSelected = activeOrder?.id === order.id;

                    const isSiaExpired = new Date(order.institution.siaExpiry) <= today && new Date(order.institution.siaExpiry).getFullYear() < 2090;
                    const isSipaExpired = order.createdBy.sipaExpiry ? new Date(order.createdBy.sipaExpiry) <= today : false;

                    return (
                      <tr
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsRejectMode(false);
                        }}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? "bg-emerald-50/60 font-medium border-l-4 border-emerald-600"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-4 py-3 font-mono">
                          <span className="font-extrabold text-slate-900 block text-xs">{order.orderNumber}</span>
                          <span className="text-[10px] text-slate-400 font-sans">{new Date(order.createdAt).toLocaleDateString("id-ID")}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-extrabold text-slate-900 text-xs block truncate max-w-[160px]">{order.institution.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono truncate block max-w-[160px]">SIA: {order.institution.siaNumber}</span>
                        </td>
                        <td className="px-3 py-3">
                          {order.paymentMethod === "TOP" ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">TOP ({order.institution.siaExpiry ? "Kredit" : "30h"})</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Bank VA</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-right text-slate-900 text-xs">
                          Rp {orderVal.toLocaleString("id-ID")}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {isSiaExpired || isSipaExpired ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-800 border border-rose-200">🔴 Expired</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">🟢 Valid CDOB</span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center text-slate-400">
                          <ChevronRight className="w-4 h-4 inline-block" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Detail Verification & Approval (42%) */}
          {activeOrder && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs w-full lg:w-[42%] space-y-4 sticky top-20">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Preview SP Active</span>
                  <h4 className="font-heading font-extrabold text-sm text-slate-900">{activeOrder.orderNumber}</h4>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-[10px] font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>SLA Verifikasi SP: 24 Jam</span>
                </div>
              </div>

              {/* Institution Legal Check */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <h5 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Verifikasi Legalitas Sarana</h5>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">{activeOrder.institution.name}</p>
                  <p className="text-[10px] text-slate-500">{activeOrder.institution.address}</p>
                  <p className="text-[10px] text-slate-600 font-mono">No. SIA: {activeOrder.institution.siaNumber}</p>
                  <p className="text-[10px] text-slate-600">APJ: <strong>{activeOrder.createdBy.name}</strong> (SIPA: {activeOrder.createdBy.sipaNumber || "-"})</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h5 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">Rincian Obat &amp; Alokasi Batch (FEFO)</h5>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 divide-y divide-slate-200 max-h-40 overflow-y-auto space-y-2 text-xs">
                  {activeOrder.items.map((item) => (
                    <div key={item.id} className="pt-1.5 first:pt-0 flex justify-between items-center text-[11px]">
                      <div>
                        <p className="font-bold text-slate-900">{item.product.name}</p>
                        <p className="text-[9px] text-slate-500">{item.quantity} {item.product.unit} × Rp {item.price.toLocaleString("id-ID")}</p>
                      </div>
                      <span className="font-mono font-bold text-slate-900">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* e-Sign Preview */}
              {activeOrder.spSignature && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800 text-[10px] block">e-Sign APJ Tersedia</span>
                    <span className="text-[9px] text-slate-400">Validasi Surat Pesanan Digital CDOB</span>
                  </div>
                  <div className="w-14 h-8 bg-white border border-slate-200/80 rounded p-0.5 flex items-center justify-center">
                    <img src={activeOrder.spSignature} alt="Signature" className="max-h-full object-contain" />
                  </div>
                </div>
              )}

              {/* Actions: Approve / Reject */}
              {!isRejectMode ? (
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectMode(true)}
                    className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    Tolak SP
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 border-none flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isSubmitting ? "Memproses..." : "Setujui SP & Alokasi FEFO"}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2 bg-rose-50/50 p-3 rounded-xl border border-rose-200">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Tuliskan alasan penolakan SP CDOB..."
                    className="w-full p-2.5 bg-white border border-rose-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-rose-500/20 outline-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRejectMode(false)}
                      className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-2xs border-none"
                    >
                      {isSubmitting ? "Mengirim..." : "Kirim Penolakan"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
