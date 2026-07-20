"use client";

import { useState } from "react";
import { Clock, Truck, CheckCircle, AlertTriangle, PenTool, Search } from "lucide-react";
import { printCDOBDocument } from "@/lib/pdf-generator";

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
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  // Only show active/ongoing orders or show all with priority to active
  const activeOrders = orders.filter(o => o.status !== "DELIVERED" && o.status !== "REJECTED");
  const pastOrders = orders.filter(o => o.status === "DELIVERED" || o.status === "REJECTED" || o.status === "PENDING_APPROVAL" || o.status === "SHIPPED");

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-heading font-extrabold text-foreground">Status Pelacakan Pesanan</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">Pantau real-time proses CDOB, gudang, dan logistik rantai dingin (cold chain).</p>
      </div>

      {/* Ongoing Orders Section */}
      <section className="space-y-4">
        <h3 className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider sm:tracking-widest text-primary px-1">Pesanan Berjalan ({activeOrders.length})</h3>
        
        {activeOrders.length === 0 ? (
          <div className="text-center py-12 bg-white border border-outline-variant/20 rounded-3xl text-on-surface-variant text-xs shadow-sm">
            Tidak ada pesanan aktif yang sedang diproses.
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
                        {order.status === "SHIPPED" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 ring-4 ring-blue-50">
                            <Truck className="w-3.5 h-3.5" /> Sedang Dikirim
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
                    <div className="pt-4 border-t border-outline-variant/20 space-y-6 animate-fadeIn">
                      
                      {/* Clean Stepper Tracking */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-outline-variant/10 text-xs">
                        
                        {/* Step 1 */}
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px]">
                            ✓
                          </div>
                          <div>
                            <p className="font-bold text-foreground">1. Diterima</p>
                            <p className="text-[9px] text-on-surface-variant mt-0.5">Order terdaftar</p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className={`flex items-center gap-3 ${order.spSignature ? "opacity-100" : "opacity-40"}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${order.spSignature ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant"}`}>
                            {order.spSignature ? "✓" : "2"}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">2. APJ Sign</p>
                            <p className="text-[9px] text-on-surface-variant mt-0.5">{order.spSignature ? "SP Tertanda" : "Belum Sign"}</p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className={`flex items-center gap-3 ${(order.status === "PENDING_SHIPPING" || order.status === "SHIPPED") ? "opacity-100" : "opacity-40"}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${(order.status === "PENDING_SHIPPING" || order.status === "SHIPPED") ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant"}`}>
                            {(order.status === "PENDING_SHIPPING" || order.status === "SHIPPED") ? "✓" : "3"}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">3. Gudang</p>
                            <p className="text-[9px] text-on-surface-variant mt-0.5">Picking & Packing</p>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className={`flex items-center gap-3 ${order.status === "SHIPPED" ? "opacity-100" : "opacity-40"}`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${order.status === "SHIPPED" ? "bg-primary text-white ring-4 ring-primary/10" : "bg-surface-container-highest text-on-surface-variant"}`}>
                            {order.status === "SHIPPED" ? "🚚" : "4"}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">4. Pengiriman</p>
                            <p className="text-[9px] text-on-surface-variant mt-0.5">{order.status === "SHIPPED" ? "Kurir berjalan" : "Antre pengiriman"}</p>
                          </div>
                        </div>

                      </div>

                      {/* Cold Chain Sensor Simulation Box */}
                      {order.status === "SHIPPED" && isColdChain && (
                        <div className="bg-gradient-to-r from-blue-50 to-teal-50/30 rounded-2xl p-4 border border-blue-100 flex flex-col md:flex-row justify-between gap-4 text-xs">
                          <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-blue-600 text-[20px] mt-0.5">thermostat</span>
                            <div>
                              <p className="font-bold text-blue-900 font-heading">Sensor Suhu Aktif (CDOB Smart Control)</p>
                              <p className="text-[10px] text-blue-800/80 mt-0.5">Obat rantai dingin dijaga otomatis pada suhu standar BPOM.</p>
                            </div>
                          </div>
                          <div className="flex gap-4 self-end md:self-center font-mono shrink-0">
                            <div className="bg-white border border-blue-200 px-3 py-1 rounded-xl text-center">
                              <p className="text-[8px] text-on-surface-variant">Suhu Box</p>
                              <p className="text-xs font-extrabold text-blue-700">4.5 °C</p>
                            </div>
                            <div className="bg-white border border-blue-200 px-3 py-1 rounded-xl text-center">
                              <p className="text-[8px] text-on-surface-variant">Status</p>
                              <p className="text-xs font-extrabold text-emerald-600">STABIL</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Info Resi Kurir & Expedisi */}
                      {order.trackingNumber && (
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-[11px] font-bold text-slate-800">Resi Expedisi: {order.trackingNumber}</span>
                          </div>
                          <span className="text-[9px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                            Kurir Logistik PBF
                          </span>
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex flex-wrap justify-between items-center gap-3 pt-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setViewingDetailOrder(order)}
                          className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer border-none bg-transparent"
                        >
                          Detail Progress <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>

                        <div className="flex flex-wrap items-center gap-2">
                          {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
                            <button
                              type="button"
                              onClick={() => printCDOBDocument(order, "SURAT_JALAN")}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-outline-variant/30 text-on-surface-variant hover:text-foreground font-bold rounded-xl text-[10px] shadow-sm cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">description</span> Cetak BAST CDOB
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
                              className="px-4 py-2 bg-primary text-white hover:bg-primary/95 font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 transition-transform active:scale-[0.98]"
                            >
                              <PenTool className="w-3.5 h-3.5" /> Tanda Tangan SP
                            </button>
                          )}

                          {order.status === "PENDING_APPROVAL" && setCancelingOrder && (
                            <button
                              type="button"
                              onClick={() => setCancelingOrder(order)}
                              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl border border-red-200 cursor-pointer flex items-center gap-1 transition-all active:scale-[0.98]"
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span> Batalkan Pesanan
                            </button>
                          )}

                          {order.status === "SHIPPED" && (
                            <button
                              type="button"
                              onClick={() => handleConfirmDelivery(order.id)}
                              className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-sm cursor-pointer transition-transform active:scale-[0.98]"
                            >
                              Konfirmasi Terima Barang
                            </button>
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

      {/* Delivered Orders History */}
      <section className="space-y-4 pt-4">
        <h3 className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider sm:tracking-widest text-on-surface-variant/75 px-1">Pesanan Selesai / Riwayat Baru</h3>
        <div className="bg-white rounded-3xl border border-outline-variant/20 overflow-hidden shadow-sm">
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto text-xs">
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

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-outline-variant/15 text-xs">
            {pastOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-on-surface-variant/50 italic">
                Belum ada riwayat pesanan selesai.
              </div>
            ) : (
              pastOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="p-4 space-y-3 hover:bg-surface-container-low/10 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground text-xs font-mono">{order.orderNumber}</span>
                    <div>
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
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-on-surface-variant/70 text-[10px]">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] opacity-75">calendar_today</span>
                        {new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-on-surface-variant/90">
                        <span className="material-symbols-outlined text-[12px] opacity-75">package_2</span>
                        {order.items.length} SKU
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingDetailOrder(order)}
                      className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-variant text-on-surface-variant font-bold rounded-lg transition-colors text-[10px] active:scale-95 duration-100 shrink-0"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
