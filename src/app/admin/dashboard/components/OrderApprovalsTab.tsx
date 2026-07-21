"use client";

import { printCDOBDocument } from "@/lib/pdf-generator";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, Info, Eye, ChevronRight, X, MessageSquare, ShieldCheck } from "lucide-react";

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
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-outline-variant/20 shadow-sm">
        <div>
          <h3 className="font-heading font-extrabold text-xl md:text-2xl text-foreground">
            Persetujuan Order &amp; Verifikasi CDOB
          </h3>
          <p className="text-xs text-on-surface-variant font-medium mt-1">
            Validasi Surat Pesanan (SP) digital, e-Sign APJ, dan kepatuhan regulasi BPOM sebelum alokasi stok.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3.5 py-1.5 bg-primary/10 text-primary font-bold rounded-xl border border-primary/20 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Standar CDOB BPOM</span>
          </span>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm space-y-1">
          <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Menunggu Verifikasi</p>
          <h4 className="text-2xl font-extrabold text-foreground font-mono">{pendingOrders.length} <span className="text-xs font-bold text-on-surface-variant font-sans">Order</span></h4>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm space-y-1">
          <p className="text-[11px] text-red-700 font-extrabold uppercase tracking-wider">Validasi Gagal</p>
          <h4 className="text-2xl font-extrabold text-red-700 font-mono">{failCount} <span className="text-xs font-bold text-red-600/80 font-sans">Kasus</span></h4>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm space-y-1">
          <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Siap Logistik</p>
          <h4 className="text-2xl font-extrabold text-foreground font-mono">{readyToRelease} <span className="text-xs font-bold text-on-surface-variant font-sans">Order</span></h4>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-outline-variant/20 shadow-sm space-y-1">
          <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">Total Nilai Hari Ini</p>
          <h4 className="text-xl font-extrabold text-primary font-mono">Rp {totalValueToday.toLocaleString("id-ID")}</h4>
        </div>
      </section>

      {pendingOrders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-outline-variant/20 rounded-3xl text-on-surface-variant text-sm font-semibold shadow-sm">
          Tidak ada pesanan SP masuk yang menunggu verifikasi CDOB saat ini.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Panel: Order Queue Table (58%) */}
          <div className="bg-white rounded-3xl border border-outline-variant/20 overflow-hidden flex flex-col shadow-sm w-full lg:w-[58%] shrink-0">
            <div className="px-5 py-4 border-b border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-container-low/30">
              <div>
                <h5 className="font-heading font-extrabold text-sm text-foreground">Antrean Verifikasi Order ({filteredPendingOrders.length})</h5>
                <p className="text-[10px] text-on-surface-variant">Klik baris order untuk meninjau detail SP CDOB</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Cari SP / Nama Apotek..."
                  value={searchQueue}
                  onChange={(e) => setSearchQueue(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-sans text-foreground placeholder:text-outline-variant/60 focus:outline-none focus:border-primary w-full sm:w-48"
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-bold">
                    <th className="px-4 py-3.5 uppercase tracking-wider text-[10px] w-32">No. SP</th>
                    <th className="px-4 py-3.5 uppercase tracking-wider text-[10px] min-w-[200px]">Mitra Apotek</th>
                    <th className="px-4 py-3.5 uppercase tracking-wider text-[10px] w-32">Pembayaran</th>
                    <th className="px-4 py-3.5 uppercase tracking-wider text-[10px] w-32 text-right">Total Tagihan</th>
                    <th className="px-4 py-3.5 uppercase tracking-wider text-[10px] w-32 text-center">Status CDOB</th>
                    <th className="px-2 py-3.5 text-[10px] w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                  {filteredPendingOrders.map((order) => {
                    const { total: orderVal } = calculateOrderTotals(order);
                    const isSelected = activeOrder?.id === order.id;

                    const isSiaExpired = new Date(order.institution.siaExpiry) <= today && new Date(order.institution.siaExpiry).getFullYear() < 2090;
                    const isSipaExpired = order.createdBy.sipaExpiry
                      ? new Date(order.createdBy.sipaExpiry) <= today
                      : true;

                    const isComplianceOk = !isSiaExpired && !isSipaExpired && order.spSignature;

                    // Parse clean short location/city from address string
                    const rawAddr = order.institution.address || "";
                    const cityMatch = rawAddr.match(/(Kab\/Kota|Kota|Kabupaten):\s*([^,]+)/i);
                    const shortCity = cityMatch
                      ? cityMatch[2].trim()
                      : rawAddr.split(",")[0].replace(/^Alamat:\s*/i, "").trim() || "Lokasi Apotek";

                    return (
                      <tr
                        key={order.id}
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsRejectMode(false);
                        }}
                        className={`transition-all duration-200 cursor-pointer ${isSelected
                            ? "bg-primary/5 ring-1 ring-inset ring-primary/30"
                            : "hover:bg-surface-container-low/40"
                          }`}
                      >
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-foreground text-xs font-mono">{order.orderNumber}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{new Date(order.createdAt).toLocaleDateString("id-ID")}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs border border-primary/20">
                              {order.institution.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-xs truncate max-w-[200px]" title={order.institution.name}>
                                {order.institution.name}
                              </p>
                              <p className="text-[10px] text-on-surface-variant truncate max-w-[200px] mt-0.5 flex items-center gap-0.5" title={rawAddr}>
                                <span className="material-symbols-outlined text-[12px] text-outline shrink-0">location_on</span>
                                <span className="truncate">{shortCity}</span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="space-y-1">
                            {order.paymentMethod === "VA" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                                Instant VA
                              </span>
                            ) : order.paymentMethod === "TOP" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                                Limit Kredit / TOP
                              </span>
                            ) : order.paymentMethod === "COD" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                                COD
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-50 text-purple-800 border border-purple-200 uppercase">
                                Invoice Billing
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-foreground font-mono text-right whitespace-nowrap text-xs">
                          Rp {orderVal.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {isComplianceOk ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              ✓ Compliance OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 border border-red-200">
                              {isSiaExpired ? "SIA Expired" : isSipaExpired ? "SIPA Expired" : "Dokumen Belum Lengkap"}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-3.5 text-right">
                          <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "text-primary translate-x-1" : "text-outline/40"}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-outline-variant/10 bg-surface-container-lowest flex justify-between items-center mt-auto text-[10px] text-on-surface-variant">
              <p>1-{pendingOrders.length} dari {pendingOrders.length} pesanan</p>
              <div className="flex gap-1">
                <button className="p-1 border border-outline-variant/30 rounded disabled:opacity-30" disabled>
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button className="p-1 border border-outline-variant/30 rounded" disabled>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Detail Sidebar (40%) */}
          <div className="xl:w-[40%] flex flex-col gap-6 flex-1">
            {activeOrder && (
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col h-full overflow-hidden">
                <div className="px-6 py-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/20">
                  <div>
                    <h6 className="font-heading font-extrabold text-sm text-on-surface">Verifikasi SP &amp; CDOB</h6>
                    <span className="text-[10px] text-on-surface-variant font-mono">SO ID: {activeOrder.orderNumber}</span>
                  </div>
                  <span className="text-[9px] font-bold text-primary px-2.5 py-0.5 bg-primary/10 rounded-full font-mono">
                    PENDING REVIEW
                  </span>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
                  {/* simulated PDF Preview Container */}
                  <div className="relative rounded-xl border border-outline-variant/40 bg-surface-container-low aspect-[3/4.2] max-h-72 overflow-hidden group cursor-pointer mx-auto shadow-inner flex flex-col">
                    <div className="absolute inset-0 bg-slate-950/40 flex flex-col items-center justify-center p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Eye className="w-8 h-8 text-white mb-1" />
                      <p className="text-white text-[10px] font-bold">Zoom Preview SP</p>
                    </div>

                    <div className="w-full h-full p-4 flex flex-col gap-2 bg-white text-[10px] leading-normal text-slate-700">
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <div>
                          <strong className="text-xs text-primary leading-tight font-heading block">SURAT PESANAN OBAT (CDOB)</strong>
                          <p className="text-[9px] text-slate-500 mt-0.5 font-mono">SIA: {activeOrder.institution.siaNumber}</p>
                        </div>
                        <div className="text-right text-[9px]">
                          <p className="text-slate-500">Tanggal: {new Date(activeOrder.createdAt).toLocaleDateString("id-ID")}</p>
                          <p className="font-mono font-bold text-slate-900 mt-0.5">{activeOrder.orderNumber}</p>
                        </div>
                      </div>

                      <div className="mt-1 space-y-0.5 text-[9.5px]">
                        <p>Kepada Yth. <strong className="text-slate-900">PBF GroovyCare (PBF MediFlow)</strong></p>
                        <p className="text-slate-600">Harap dikirimkan sediaan obat pesanan kami berikut:</p>
                      </div>

                      <div className="mt-1.5 border-t border-b border-slate-200 py-2 space-y-1 max-h-[110px] overflow-y-auto font-mono text-[9px]">
                        {activeOrder.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-slate-800">
                            <span className="font-sans font-medium">• {item.product.name} (x{item.quantity} {item.product.unit})</span>
                            <span className="font-bold">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto flex justify-between items-end pt-2">
                        <div className="text-[9px]">
                          <p className="text-slate-500">Apoteker Penanggung Jawab,</p>
                          <p className="font-bold mt-1 text-slate-900">{activeOrder.createdBy.name}</p>
                          <p className="text-[8px] text-slate-400 font-mono">SIPA: {activeOrder.createdBy.sipaNumber || "-"}</p>
                        </div>

                        {activeOrder.spSignature ? (
                          <div className="w-16 h-16 bg-emerald-50/60 rounded-xl flex items-center justify-center border border-dashed border-primary relative shadow-xs">
                            <img src={activeOrder.spSignature} alt="APJ Signature" className="max-h-full max-w-full object-contain" />
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white p-0.5 rounded-full scale-75 shadow-sm">
                              <ShieldCheck className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-10 bg-rose-50 border border-dashed border-error rounded-xl flex items-center justify-center text-error font-bold text-[8px] uppercase">
                            NO SIGN
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Card */}
                  <div className="bg-surface-container-low/40 p-3.5 border border-outline-variant/20 rounded-2xl flex justify-between items-center gap-3">
                    <div className="space-y-1.5 flex-1">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Metode Pembayaran</p>
                      <div className="flex items-center gap-2.5">
                        {activeOrder.paymentMethod === "VA" ? (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-200 shrink-0">
                              VA
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-xs">Bank Transfer (VA)</p>
                              <p className="text-[10px] text-on-surface-variant/70">BCA, Mandiri, BNI (Auto Check)</p>
                            </div>
                          </>
                        ) : activeOrder.paymentMethod === "TOP" ? (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs border border-amber-200 shrink-0">
                              TOP
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-xs">Credit Limit / TOP</p>
                              <p className="text-[10px] text-on-surface-variant/70">Sisa Limit: Rp {(activeOrder.institution.creditLimit ? (activeOrder.institution.creditLimit - (activeOrder.institution.currentDebt ?? 0)) : 0).toLocaleString("id-ID")}</p>
                            </div>
                          </>
                        ) : activeOrder.paymentMethod === "COD" ? (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200 shrink-0">
                              COD
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-xs">Cash on Delivery (COD)</p>
                              <p className="text-[10px] text-on-surface-variant/70">Bayar ke kurir saat barang sampai</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-200 shrink-0">
                              INV
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-xs">Invoice Billing</p>
                              <p className="text-[10px] text-on-surface-variant/70">Tempo TOP 30 Hari (Term)</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Bayar */}
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Status Bayar</p>
                      {activeOrder.paymentStatus === "PAID" ? (
                        <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                          LUNAS (PAID)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[9px] font-extrabold bg-red-100 text-red-800 border border-red-200 uppercase animate-pulse">
                          BELUM LUNAS
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Billing Details Card */}
                  {(() => {
                    const { subtotal, vat, shippingFee, total } = calculateOrderTotals(activeOrder);
                    return (
                      <div className="bg-surface-container-low/40 p-4 border border-outline-variant/20 rounded-2xl space-y-2.5 text-xs font-sans">
                        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1.5">
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Rincian Nominal Tagihan</p>
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                            SO Total
                          </span>
                        </div>
                        <div className="space-y-1.5 text-on-surface-variant font-medium">
                          <div className="flex justify-between">
                            <span>Subtotal Produk:</span>
                            <span className="font-mono text-foreground font-semibold">Rp {subtotal.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>PPN (11%):</span>
                            <span className="font-mono text-foreground font-semibold">Rp {vat.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Biaya Pengiriman (Kurir):</span>
                            <span className="font-mono text-foreground font-semibold">Rp {shippingFee.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="pt-2 border-t border-outline-variant/20 flex justify-between items-end">
                            <span className="font-bold text-foreground">Total Tagihan Pesanan:</span>
                            <strong className="text-primary font-mono text-sm font-extrabold">Rp {total.toLocaleString("id-ID")}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Checklist Section */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Checklist Kepatuhan CDOB</p>

                    {/* SIA status */}
                    {(() => {
                      const isExpired = new Date(activeOrder.institution.siaExpiry) <= today && new Date(activeOrder.institution.siaExpiry).getFullYear() < 2090;
                      return (
                        <div className="flex items-center justify-between py-2 px-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/20">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-4.5 h-4.5 ${isExpired ? "text-error" : "text-primary"}`} />
                            <span className="font-bold text-foreground">SIA Apotek Aktif</span>
                          </div>
                          <span className={`text-[10px] font-bold ${isExpired ? "text-error" : "text-on-surface-variant"}`}>
                            {isExpired
                              ? "EXPIRED"
                              : new Date(activeOrder.institution.siaExpiry).getFullYear() >= 2090
                                ? "Berlaku Selamanya (NIB)"
                                : `Valid s/d ${new Date(activeOrder.institution.siaExpiry).toLocaleDateString("id-ID")}`}
                          </span>
                        </div>
                      );
                    })()}

                    {/* SIPA status */}
                    {(() => {
                      const isExpired = activeOrder.createdBy.sipaExpiry
                        ? new Date(activeOrder.createdBy.sipaExpiry) <= today
                        : true;
                      return (
                        <div className="flex items-center justify-between py-2 px-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/20">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-4.5 h-4.5 ${isExpired ? "text-error" : "text-primary"}`} />
                            <span className="font-bold text-foreground">SIPA Apoteker Valid</span>
                          </div>
                          <span className={`text-[10px] font-bold ${isExpired ? "text-error" : "text-on-surface-variant font-mono"}`}>
                            {isExpired ? "EXPIRED / NULL" : "TERVERIFIKASI"}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Credit Limit status */}
                    {(() => {
                      const { total: orderVal } = calculateOrderTotals(activeOrder);
                      const limit = activeOrder.institution.creditLimit ?? 0;
                      const debt = activeOrder.institution.currentDebt ?? 0;
                      const availableLimit = limit - debt;
                      const isOverLimit = orderVal > availableLimit;
                      return (
                        <div className="flex items-center justify-between py-2 px-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/20">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-4.5 h-4.5 ${isOverLimit && limit > 0 ? "text-error" : "text-primary"}`} />
                            <span className="font-bold text-foreground">Kecukupan Plafon Kredit</span>
                          </div>
                          <span className={`text-[10px] font-bold ${isOverLimit && limit > 0 ? "text-error" : "text-on-surface-variant"}`}>
                            {limit > 0 ? `Sisa Limit: Rp ${availableLimit.toLocaleString("id-ID")}` : "Tempo dinonaktifkan / VA"}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* CDOB Documents Digital Archive */}
                  <div className="bg-surface-container-low/40 p-4 border border-outline-variant/20 rounded-2xl space-y-3 font-sans">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Arsip Dokumen Resmi CDOB</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => printCDOBDocument(activeOrder, "SP")}
                        className="py-1.5 px-1 bg-white hover:bg-slate-100 border border-outline-variant/30 text-primary text-[9px] font-extrabold rounded-xl transition-all cursor-pointer shadow-sm text-center"
                        title="Cetak Surat Pesanan"
                      >
                        Cetak SP
                      </button>
                      <button
                        type="button"
                        onClick={() => printCDOBDocument(activeOrder, "INVOICE")}
                        className="py-1.5 px-1 bg-white hover:bg-slate-100 border border-outline-variant/30 text-primary text-[9px] font-extrabold rounded-xl transition-all cursor-pointer shadow-sm text-center"
                        title="Cetak Invoice Penjualan"
                      >
                        e-Faktur
                      </button>
                      <button
                        type="button"
                        disabled={activeOrder.status === "PENDING_APPROVAL" || activeOrder.status === "REJECTED"}
                        onClick={() => printCDOBDocument(activeOrder, "SURAT_JALAN")}
                        className="py-1.5 px-1 bg-white hover:bg-slate-100 border border-outline-variant/30 text-primary text-[9px] font-extrabold rounded-xl transition-all cursor-pointer shadow-sm text-center disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Cetak Surat Jalan Logistik"
                      >
                        Surat Jalan
                      </button>
                    </div>
                  </div>

                  {/* Special Product Warning Alert */}
                  {(() => {
                    const hasSpecial = activeOrder.items.some(
                      (item) =>
                        item.product.category?.includes("Psikotropika") ||
                        item.product.category?.toLowerCase().includes("chain") ||
                        item.product.name.toLowerCase().includes("diazepam")
                    );
                    if (hasSpecial) {
                      return (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-amber-800 text-[11px]">Sediaan Khusus / Psikotropika</p>
                            <p className="text-[10px] leading-relaxed text-amber-700/90 mt-0.5">
                              Pesanan mengandung Psikotropika/Rantai Dingin. Pastikan berkas Surat Pesanan fisik bertanda tangan basah dan stempel apotek disimpan rapi untuk pelaporan SIPNAP.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Rejection Mode Textarea */}
                  {isRejectMode && (
                    <div className="space-y-2 pt-2 border-t border-outline-variant/30 animate-fadeIn">
                      <label className="block font-bold text-error">Alasan Penolakan Surat Pesanan</label>
                      <textarea
                        required
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Contoh: Dokumen SIA Apotek sudah kadaluwarsa per 12 Desember 2025."
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground text-xs h-16 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsRejectMode(false);
                            setRejectReason("");
                          }}
                          className="px-3 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface-variant font-bold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 bg-error text-white rounded-lg font-bold cursor-pointer hover:bg-error/90"
                        >
                          {isSubmitting ? "Memproses..." : "Tolak SP Sekarang"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                {!isRejectMode && (
                  <div className="p-5 border-t border-outline-variant/10 bg-surface-container-low/10 space-y-2">
                    <button
                      onClick={handleApprove}
                      disabled={
                        isSubmitting ||
                        new Date(activeOrder.institution.siaExpiry) <= today ||
                        !!(activeOrder.createdBy.sipaExpiry && new Date(activeOrder.createdBy.sipaExpiry) <= today)
                      }
                      className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Setujui SP &amp; Alokasi FEFO
                    </button>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <button
                        onClick={() => setIsRejectMode(true)}
                        className="py-2 border border-error/40 text-error rounded-xl font-bold flex items-center justify-center gap-1 hover:bg-red-50 transition-all cursor-pointer truncate"
                      >
                        <X className="w-3.5 h-3.5 shrink-0" />
                        Tolak SP
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Apakah Anda yakin ingin menghapus pesanan ini secara permanen?")) {
                            onDeleteOrder(activeOrder.id);
                          }
                        }}
                        className="py-2 border border-outline-variant text-on-surface-variant hover:bg-surface-variant/20 rounded-xl font-bold flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
                      >
                        <span className="material-symbols-outlined text-[14px] shrink-0">delete</span>
                        Hapus SP
                      </button>
                      <button
                        onClick={() => alert(`Menghubungi Apoteker APJ (${activeOrder.createdBy.name}) via pesan whatsapp...`)}
                        className="py-2 bg-surface-container-high text-on-surface-variant rounded-xl font-bold flex items-center justify-center gap-1 hover:bg-surface-container-highest transition-all cursor-pointer truncate"
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        Tanya APJ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
