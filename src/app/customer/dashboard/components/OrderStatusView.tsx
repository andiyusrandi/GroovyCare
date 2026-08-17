"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Truck, CheckCircle, AlertTriangle, PenTool, Search } from "lucide-react";
import { printCDOBDocument } from "@/lib/pdf-generator";
import { syncBiteshipOrderStatus } from "@/app/actions/orders";
import BiteshipTrackingModal from "@/app/components/BiteshipTrackingModal";
import { getBiteshipStatusMeta, formatWaybillNumber } from "@/lib/biteship-status";

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

interface OrderStatusViewProps {
  orders: any[];
  setActiveTab: (tab: any) => void;
  setViewingDetailOrder: (order: any) => void;
  setCart: (cart: any) => void;
  setIsCheckoutOpen: (open: boolean) => void;
  setCheckoutError: (err: any) => void;
  handleConfirmDelivery: (orderId: string) => void;
  products: Product[];
  setCancelingOrder?: (order: any) => void;
}

export default function OrderStatusView({
  orders,
  setActiveTab,
  setViewingDetailOrder,
  setCart,
  setIsCheckoutOpen,
  setCheckoutError,
  handleConfirmDelivery,
  products,
  setCancelingOrder,
}: OrderStatusViewProps) {
  const router = useRouter();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [trackingModalOrderId, setTrackingModalOrderId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "active" | "completed" | "cancelled">("all");

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  // Active orders vs Past completed orders
  const activeOrders = orders.filter(o => o.status !== "DELIVERED" && o.status !== "REJECTED" && o.status !== "CANCELLED");
  const completedOrders = orders.filter(o => o.status === "DELIVERED");
  const cancelledOrders = orders.filter(o => o.status === "REJECTED" || o.status === "CANCELLED");
  const pastOrders = orders.filter(o => o.status === "DELIVERED" || o.status === "REJECTED" || o.status === "CANCELLED");

  const filteredMobileOrders = filterTab === "active"
    ? activeOrders
    : filterTab === "completed"
    ? completedOrders
    : filterTab === "cancelled"
    ? cancelledOrders
    : orders;

  return (
    <div className="space-y-4 px-4 pt-2 pb-32 font-sans bg-slate-50/40 min-h-screen md:min-h-0 md:bg-transparent md:p-0 md:space-y-8 animate-fadeIn">
      {/* 1. Header Ringkas Native (Title + Filter Pill Tabs) */}
      <div className="space-y-2.5">
        <div>
          <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight font-heading">
            Status Pelacakan
          </h1>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Pantau rantai dingin &amp; pengiriman CDOB real-time
          </p>
        </div>

        {/* Segmented Tab Filter Khas Android Material 3 */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-1.5 rounded-full font-bold text-xs shrink-0 transition-all border-none cursor-pointer ${
              filterTab === "all" ? "bg-emerald-700 text-white shadow-xs" : "bg-slate-100 text-slate-600 active:bg-slate-200"
            }`}
          >
            Semua ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("active")}
            className={`px-3.5 py-1.5 rounded-full font-bold text-xs shrink-0 transition-all border-none cursor-pointer ${
              filterTab === "active" ? "bg-emerald-700 text-white shadow-xs" : "bg-slate-100 text-slate-600 active:bg-slate-200"
            }`}
          >
            Berjalan ({activeOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("completed")}
            className={`px-3.5 py-1.5 rounded-full font-bold text-xs shrink-0 transition-all border-none cursor-pointer ${
              filterTab === "completed" ? "bg-emerald-700 text-white shadow-xs" : "bg-slate-100 text-slate-600 active:bg-slate-200"
            }`}
          >
            Selesai ({completedOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("cancelled")}
            className={`px-3.5 py-1.5 rounded-full font-bold text-xs shrink-0 transition-all border-none cursor-pointer ${
              filterTab === "cancelled" ? "bg-emerald-700 text-white shadow-xs" : "bg-slate-100 text-slate-600 active:bg-slate-200"
            }`}
          >
            Dibatalkan / Ditolak ({cancelledOrders.length})
          </button>
        </div>
      </div>

      {/* Ongoing Orders Section */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pesanan Berjalan</span>
          <span className="text-[10px] font-bold text-slate-400">{activeOrders.length} Aktif</span>
        </div>

        {/* Empty State Kompak */}
        {activeOrders.length === 0 ? (
          <div className="bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-center gap-3 text-slate-400">
            <span className="material-symbols-outlined text-xl">local_shipping</span>
            <span className="text-xs font-semibold">Tidak ada pengiriman yang sedang berjalan</span>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => {
              const isColdChain = order.items.some((it: any) => it.product.name.includes("Insulin") || it.product.code.includes("AMX"));
              const isExpanded = expandedOrderId === order.id;
              return (
                <div 
                  key={order.id} 
                  className="bg-white border border-outline-variant/30 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden transition-all duration-300"
                >
                  
                  {/* Premium visual edge indicator for Cold Chain */}
                  {isColdChain && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-teal-500" />
                  )}

                  {/* Header Row (Clickable Accordion Trigger) */}
                  <div 
                    onClick={() => toggleExpand(order.id)}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-surface-container-low/20 p-2 -m-2 rounded-2xl transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading font-extrabold text-sm text-foreground font-mono">{order.orderNumber}</span>
                        {isColdChain && (
                          <span className="bg-blue-50 text-blue-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5 border border-blue-200">
                            <span className="material-symbols-outlined text-[9px] animate-pulse">ac_unit</span> Cold Chain
                          </span>
                        )}
                        {/* Lencana Metode Pembayaran */}
                        {order.paymentMethod === "VA" ? (
                          <span className="bg-blue-50 text-blue-700 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-blue-200">
                            VA (Virtual Account)
                          </span>
                        ) : order.paymentMethod === "TOP" ? (
                          <span className="bg-amber-50 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-amber-200">
                            Limit Kredit / TOP
                          </span>
                        ) : order.paymentMethod === "COD" ? (
                          <span className="bg-emerald-50 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-emerald-250">
                            COD (Bayar di Tempat)
                          </span>
                        ) : (
                          <span className="bg-purple-50 text-purple-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-purple-200">
                            Invoice Billing
                          </span>
                        )}
                        {/* Lencana Status Bayar */}
                        {order.paymentStatus === "PAID" ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider border border-emerald-200">
                            Lunas (PAID)
                          </span>
                        ) : (
                          <span className="bg-red-50 text-red-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider border border-red-200 animate-pulse">
                            Belum Bayar
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant/60 mt-0.5">Dibuat: {new Date(order.createdAt).toLocaleString("id-ID")}</p>
                    </div>

                    {/* Status Badge & Chevron */}
                    <div className="flex items-center gap-3 self-stretch md:self-auto justify-between w-full md:w-auto">
                      <div>
                        {order.status === "PENDING_APPROVAL" && !order.spSignature && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 animate-pulse">
                            <Clock className="w-3.5 h-3.5" /> Menunggu e-Sign SP
                          </span>
                        )}
                        {order.status === "PENDING_APPROVAL" && order.spSignature && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" /> Verifikasi CDOB
                          </span>
                        )}
                        {order.status === "PENDING_SHIPPING" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250">
                            <span className="material-symbols-outlined text-sm">inventory_2</span> Packing Gudang
                          </span>
                        )}
                        {order.status === "SHIPPED" && (() => {
                          const meta = getBiteshipStatusMeta((order as any).biteshipStatus, order.status);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${meta.badgeClass}`}>
                              <Truck className="w-3.5 h-3.5" /> {meta.label}
                            </span>
                          );
                        })()}
                        {order.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <span className="material-symbols-outlined text-sm">cancel</span> Dibatalkan / Ditolak
                          </span>
                        )}
                        {order.status === "CANCELLED" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <span className="material-symbols-outlined text-sm">cancel</span> Dibatalkan
                          </span>
                        )}
                      </div>
                      
                      {/* Chevron Arrow */}
                      <span 
                        className="material-symbols-outlined text-on-surface-variant/60 transition-transform duration-200 text-sm font-bold"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Expanded Content Wrapper */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-slate-200/80 space-y-4 animate-fadeIn">
                      
                      {/* --- 2. PROGRESS STEPPER (Responsive Timeline) --- */}
                      <div className="rounded-2xl bg-slate-50 p-3.5 sm:p-4 border border-slate-200/80 space-y-3.5 text-xs">
                        {/* Step 1 */}
                        <div className="flex items-start gap-3 relative">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold z-10 shadow-2xs">
                            ✓
                          </div>
                          <div className={`absolute left-[9px] top-5 bottom-0 w-[2px] h-6 -z-0 ${order.spSignature ? "bg-emerald-500" : "bg-slate-200"}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800">1. Diterima</p>
                            <p className="text-[10px] text-slate-400">Order terdaftar di sistem PBF</p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className={`flex items-start gap-3 relative ${order.spSignature ? "opacity-100" : "opacity-50"}`}>
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold z-10 shadow-2xs ${order.spSignature ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                            {order.spSignature ? "✓" : "2"}
                          </div>
                          <div className={`absolute left-[9px] top-5 bottom-0 w-[2px] h-6 -z-0 ${(order.status === "PENDING_SHIPPING" || order.status === "SHIPPED" || order.status === "DELIVERED") ? "bg-emerald-500" : "bg-slate-200"}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800">2. APJ Sign</p>
                            <p className="text-[10px] text-slate-400">{order.spSignature ? "SP digital tertanda sah" : "Menunggu e-Sign SP"}</p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className={`flex items-start gap-3 relative ${(order.status === "PENDING_SHIPPING" || order.status === "SHIPPED" || order.status === "DELIVERED") ? "opacity-100" : "opacity-50"}`}>
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold z-10 shadow-2xs ${(order.status === "PENDING_SHIPPING" || order.status === "SHIPPED" || order.status === "DELIVERED") ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                            {(order.status === "PENDING_SHIPPING" || order.status === "SHIPPED" || order.status === "DELIVERED") ? "✓" : "3"}
                          </div>
                          <div className={`absolute left-[9px] top-5 bottom-0 w-[2px] h-6 -z-0 ${order.status === "SHIPPED" || order.status === "DELIVERED" ? "bg-emerald-500" : "bg-slate-200"}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800">3. Gudang PBF</p>
                            <p className="text-[10px] text-slate-400">Picking FEFO &amp; Packing Karet/Box</p>
                          </div>
                        </div>

                        {/* Step 4 (Active Step) */}
                        <div className={`flex items-start gap-3 ${order.status === "SHIPPED" || order.status === "DELIVERED" ? "opacity-100" : "opacity-50"}`}>
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold z-10 shadow-2xs ${
                            order.status === "DELIVERED"
                              ? "bg-emerald-600 text-white"
                              : order.status === "SHIPPED"
                                ? "bg-blue-600 text-white ring-4 ring-blue-100"
                                : "bg-slate-200 text-slate-600"
                          }`}>
                            {order.status === "DELIVERED" ? "✓" : "🚚"}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-bold ${order.status === "SHIPPED" ? "text-blue-700" : "text-slate-800"}`}>
                              4. {getBiteshipStatusMeta((order as any).biteshipStatus, order.status).label}
                            </p>
                            <p className="text-[10px] text-slate-500 leading-snug mt-0.5 font-medium">
                              {(order as any).biteshipStatusLabel || getBiteshipStatusMeta((order as any).biteshipStatus, order.status).description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Cold Chain Sensor Simulation Box */}
                      {order.status === "SHIPPED" && isColdChain && (
                        <div className="bg-gradient-to-r from-blue-50 to-teal-50/40 rounded-2xl p-3.5 border border-blue-200/80 flex flex-col md:flex-row justify-between gap-3 text-xs">
                          <div className="flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0">thermostat</span>
                            <div>
                              <p className="font-bold text-blue-950 font-heading">Sensor Suhu Aktif (CDOB Smart Control)</p>
                              <p className="text-[10px] text-blue-800 mt-0.5 font-medium">Obat rantai dingin dijaga otomatis pada suhu standar BPOM.</p>
                            </div>
                          </div>
                          <div className="flex gap-3 self-start md:self-center font-mono shrink-0">
                            <div className="bg-white border border-blue-200 px-3 py-1 rounded-xl text-center">
                              <p className="text-[8px] text-slate-400 font-bold uppercase">Suhu Box</p>
                              <p className="text-xs font-extrabold text-blue-700">4.5 °C</p>
                            </div>
                            <div className="bg-white border border-blue-200 px-3 py-1 rounded-xl text-center">
                              <p className="text-[8px] text-slate-400 font-bold uppercase">Status</p>
                              <p className="text-xs font-extrabold text-emerald-600">STABIL</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- 3. EXPEDISI & BITESHIP ACTIONS (Desktop Only) --- */}
                      {(order.trackingNumber || order.biteshipOrderId) && (
                        <div className="hidden md:block rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3 sm:p-3.5 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span className="text-[11px] font-bold text-slate-700">Resi Expedisi:</span>
                            </div>
                            <span className="font-mono text-xs font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs truncate">
                              {formatWaybillNumber(order.trackingNumber, order.biteshipOrderId, order.id)}
                            </span>
                          </div>

                          {order.biteshipOrderId ? (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await syncBiteshipOrderStatus(order.id);
                                    if (res.success) {
                                      alert(res.message || "Status berhasil disinkronkan dengan Biteship API!");
                                      router.refresh();
                                    } else {
                                      alert("Gagal sinkronisasi: " + res.error);
                                    }
                                  } catch (err: any) {
                                    alert("Error: " + err.message);
                                  }
                                }}
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white py-2 text-[10px] font-extrabold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                                title="Sinkronkan status terbaru dari Biteship API"
                              >
                                <span className="material-symbols-outlined text-[13px] text-emerald-600">sync</span>
                                Sync Biteship
                              </button>

                              <button
                                type="button"
                                onClick={() => setTrackingModalOrderId(order.id)}
                                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 py-2 text-[10px] font-extrabold text-white shadow-2xs active:scale-95 transition-all cursor-pointer border-none"
                              >
                                <span className="material-symbols-outlined text-[13px]">radar</span>
                                Live Tracking
                              </button>
                            </div>
                          ) : (
                            <span className="inline-block text-[9px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                              Kurir Logistik PBF
                            </span>
                          )}
                        </div>
                      )}

                      {/* --- 4. BOTTOM ACTION BUTTONS --- */}
                      <div className="space-y-2.5 pt-1 text-xs">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setViewingDetailOrder(order)}
                            className="text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 cursor-pointer border-none bg-transparent text-xs"
                          >
                            <span>Detail Progress Pesanan</span>
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                          </button>
                        </div>

                        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
                            <button
                              type="button"
                              onClick={() => printCDOBDocument(order, "SURAT_JALAN")}
                              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold rounded-xl text-xs shadow-2xs active:scale-95 transition-all cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">description</span>
                              <span>Cetak BAST CDOB</span>
                            </button>
                          )}

                          {order.status === "PENDING_APPROVAL" && !order.spSignature && (
                            <button
                              type="button"
                              onClick={() => {
                                setCart(order.items.map((it: any) => ({
                                  product: products.find((pr) => pr.id === it.productId) || {
                                    id: it.productId,
                                    name: it.product.name,
                                    code: "",
                                    activeIngredient: "",
                                    price: it.price,
                                    category: "",
                                    description: "",
                                    unit: it.product.unit,
                                    totalStock: 999
                                  },
                                  quantity: it.quantity
                                })));
                                setIsCheckoutOpen(true);
                                setCheckoutError(null);
                              }}
                              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
                            >
                              <PenTool className="w-4 h-4" />
                              <span>Tanda Tangan SP</span>
                            </button>
                          )}

                          {(order.status === "PENDING_APPROVAL" || order.status === "PENDING_SHIPPING") && setCancelingOrder && (
                            <button
                              type="button"
                              onClick={() => setCancelingOrder(order)}
                              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 cursor-pointer active:scale-95 transition-all"
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                              <span>Batalkan Pesanan</span>
                            </button>
                          )}

                          {order.status === "SHIPPED" && (
                            <div className="sm:col-span-2 flex flex-col items-center gap-1.5 w-full">
                              <button
                                type="button"
                                onClick={() => handleConfirmDelivery(order.id)}
                                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl shadow-xs cursor-pointer transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-1.5"
                              >
                                <span>Konfirmasi Terima Barang</span>
                              </button>
                              <span className="text-[10px] text-slate-400 italic">
                                Selesai otomatis via webhook Biteship / SLA 1x24 jam
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Desktop Table View */}
      <section className="hidden md:block space-y-4 pt-4">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-on-surface-variant/75 px-1">
          Pesanan Selesai / Riwayat Baru
        </h3>
        <div className="bg-white rounded-3xl border border-outline-variant/20 overflow-hidden shadow-sm">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-bold">
                <tr>
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">Status Akhir</th>
                  <th className="px-5 py-3.5 text-right">Total Item</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                {pastOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-on-surface-variant/50 italic">
                      Belum ada riwayat pesanan selesai.
                    </td>
                  </tr>
                ) : (
                  pastOrders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-surface-container-low/20 transition-colors">
                      <td className="px-5 py-4 font-bold text-foreground">{order.orderNumber}</td>
                      <td className="px-5 py-4 text-on-surface-variant/70">{new Date(order.createdAt).toLocaleDateString("id-ID")}</td>
                      <td className="px-5 py-4">
                        {order.status === "DELIVERED" ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                            ✓ Diterima
                          </span>
                        ) : order.status === "SHIPPED" ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase animate-pulse">
                            Sedang Dikirim
                          </span>
                        ) : order.status === "PENDING_APPROVAL" ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase animate-pulse">
                            Dalam Verifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase">
                            Ditolak
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-medium">{order.items.length} SKU</td>
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingDetailOrder(order)}
                          className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-variant text-on-surface-variant font-bold rounded-lg transition-colors text-[10px]"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Mobile Card View (Native Android List Cards) */}
      <section className="block md:hidden space-y-3 pt-2">
        <div className="px-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Riwayat Pesanan Terbaru
          </span>
        </div>

        <div className="space-y-3">
          {filteredMobileOrders.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300/80 rounded-2xl p-5 text-center text-slate-400 text-xs font-semibold shadow-2xs">
              Belum ada data pesanan untuk kategori ini.
            </div>
          ) : (
            filteredMobileOrders.map((order) => {
              const isDelivered = order.status === "DELIVERED";
              const isRejected = order.status === "REJECTED" || order.status === "CANCELLED";

              return (
                <div
                  key={order.id}
                  onClick={() => setViewingDetailOrder(order)}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs active:scale-[0.99] active:bg-slate-50 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isDelivered ? "bg-emerald-500" : isRejected ? "bg-rose-500" : "bg-amber-500"}`}></span>
                      <span className="font-mono font-bold text-xs text-slate-900 tracking-tight">{order.orderNumber}</span>
                    </div>
                    {isDelivered ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-black text-[10px] uppercase tracking-wide">
                        ✓ Diterima
                      </span>
                    ) : isRejected ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60 font-black text-[10px] uppercase tracking-wide">
                        Ditolak
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 font-black text-[10px] uppercase tracking-wide animate-pulse">
                        Proses CDOB
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                        {new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-slate-400">package_2</span>
                        {order.items?.length || 1} SKU
                      </span>
                    </div>
                    <div className="flex items-center text-emerald-700 text-xs font-bold gap-0.5">
                      <span>Detail</span>
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Modal Live Tracking Biteship In-App */}
      <BiteshipTrackingModal
        orderId={trackingModalOrderId}
        isOpen={!!trackingModalOrderId}
        onClose={() => setTrackingModalOrderId(null)}
      />

    </div>
  );
}
