"use client";

import { Download, UploadCloud, CheckCircle, AlertTriangle, Clock } from "lucide-react";

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
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-heading font-extrabold text-foreground">Transaksi Pembelian</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">Histori tagihan, limit kredit, invoice, dan status pembayaran tempo apotek.</p>
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
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-on-surface-variant/50 italic">
                    Belum ada riwayat transaksi pembelian.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const { total: orderTotal } = calculateOrderTotals(order);
                  const isPaid = order.paymentStatus === "PAID";
                  
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
                        ) : order.status === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-on-surface-variant bg-surface-container-high border border-outline-variant/30 px-2.5 py-0.5 rounded-full uppercase">
                            Batal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full uppercase animate-pulse">
                            {order.paymentMethod === "COD" 
                              ? "COD / Belum Lunas" 
                              : order.paymentMethod === "VA" 
                                ? "VA / Belum Lunas" 
                                : "Tempo / Belum Lunas"}
                          </span>
                        )}
                      </td>

                      {/* Konfirmasi Bayar */}
                      <td className="px-5 py-4 text-center">
                        {isPaid ? (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-0.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Terverifikasi
                          </span>
                        ) : order.status === "REJECTED" ? (
                          <span className="text-[10px] text-on-surface-variant/40 italic">-</span>
                        ) : order.paymentProofUrl ? (
                          <span className="text-[10px] text-amber-600 font-bold flex items-center justify-center gap-0.5">
                            <Clock className="w-3.5 h-3.5 animate-spin" /> Menunggu Review
                          </span>
                        ) : (
                          order.paymentMethod === "VA" ? (
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
                          )
                        )}
                      </td>

                      {/* Dokumen */}
                      <td className="px-5 py-4 text-center">
                        {order.status === "DELIVERED" || order.status === "SHIPPED" ? (
                          <button
                            type="button"
                            onClick={() => setViewingFaktur(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-foreground font-bold rounded-lg text-[10px] shadow-sm cursor-pointer"
                            title="Unduh e-Faktur Pajak"
                          >
                            <Download className="w-3 h-3 text-primary" /> e-Faktur
                          </button>
                        ) : (
                          <span className="text-[10px] text-on-surface-variant/40 italic">Belum terbit</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingDetailOrder(order)}
                          className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-lg font-bold transition-all text-[10px] cursor-pointer border-none"
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

      {/* MOBILE VIEW: Card List */}
      <div className="block md:hidden space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-outline-variant/20 p-8 text-center text-on-surface-variant/50 italic text-xs">
            Belum ada riwayat transaksi pembelian.
          </div>
        ) : (
          orders.map((order) => {
            const { total: orderTotal } = calculateOrderTotals(order);
            const isPaid = order.paymentStatus === "PAID";
            const isRejected = order.status === "REJECTED";
            
            return (
              <div 
                key={order.id} 
                className="bg-white border border-outline-variant/30 rounded-2xl p-4 shadow-xs space-y-3.5"
              >
                {/* Header: INV Number & Date */}
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
                        Batal
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[9px] font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full uppercase animate-pulse">
                        {order.paymentMethod === "COD" ? "COD" : order.paymentMethod === "VA" ? "VA" : "Tempo"} / Belum Lunas
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
                      {order.paymentProofUrl ? (
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
