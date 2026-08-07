"use client";

import { CheckCircle2, ShieldCheck, FileCheck, AlertCircle, CreditCard, DollarSign } from "lucide-react";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    unit: string;
    category?: string;
    code?: string;
  };
}

function calculateOrderTotals(order: any) {
  const subtotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const vat = Math.round(subtotal * 0.11);

  const addr = order.shippingAddress || "";
  const feeMatch = addr.match(/-\s*Rp\s*([0-9.,]+)/);
  let shippingFee = 0;
  if (feeMatch) {
    shippingFee = parseInt(feeMatch[1].replace(/[.,]/g, ""), 10) || 0;
  } else if (addr.includes("Kurir: Standard Flat Rate")) {
    const isColdChain = order.items.some((item: any) =>
      item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain" ||
      item.product?.name?.toLowerCase().includes("insulin") || item.product?.code?.toLowerCase().includes("amx")
    );
    shippingFee = isColdChain ? 100000 : 50000;
  }

  return { subtotal, vat, shippingFee, total: subtotal + vat + shippingFee };
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
  };
  createdBy: {
    name: string;
    sipaNumber: string | null;
    sipaExpiry: Date | null;
  };
  items: OrderItem[];
  batchAllocations: Allocation[];
}

interface FinanceTabProps {
  orders: Order[];
  handleVerifyPayment: (orderId: string, verifyStatus: boolean) => void;
  handleMarkAsPaidManually: (orderId: string) => void;
}

export default function FinanceTab({
  orders,
  handleVerifyPayment,
  handleMarkAsPaidManually,
}: FinanceTabProps) {
  const pendingPayments = orders.filter((o) => o.paymentStatus === "PENDING_VERIFICATION");
  const unpaidPayments = orders.filter((o) => o.paymentStatus === "UNPAID");

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      
      {/* Slim Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 px-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="font-heading font-extrabold text-lg text-slate-900 leading-tight">Manajemen Keuangan</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Verifikasi bukti transfer dan kelola piutang mitra apotek.</p>
        </div>
        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-xl border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Sistem Keuangan PBF</span>
          </span>
        </div>
      </div>

      {/* SECTION 1: Menunggu Verifikasi */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-200/80 pb-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
          </div>
          <div>
            <h2 className="text-sm font-heading font-extrabold text-slate-900">Verifikasi Pembayaran Transfer</h2>
            <p className="text-[11px] text-slate-500">Tinjau dan setujui bukti pembayaran dari mitra apotek.</p>
          </div>
          {pendingPayments.length > 0 && (
            <span className="ml-auto text-[10px] font-extrabold bg-amber-500 text-white px-2.5 py-0.5 rounded-full animate-pulse shadow-2xs">
              {pendingPayments.length} Menunggu
            </span>
          )}
        </div>

        {pendingPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-xs font-semibold shadow-2xs">
            <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">check_circle</span>
            <p className="text-xs font-medium">Semua bukti pembayaran telah terverifikasi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingPayments.map((o) => {
              const orderTotal = calculateOrderTotals(o).total;

              return (
                <div
                  key={o.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  <div className="p-4 bg-slate-50 border-b border-slate-150">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-lg text-xs shadow-2xs border border-emerald-200">
                        {o.orderNumber}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-lg font-mono">
                        {new Date(o.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-xs mt-2">{o.institution.name}</h3>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{o.institution.address}</p>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-xs mb-3">
                        <span className="text-slate-500 font-medium">Total Pembayaran:</span>
                        <span className="font-mono font-black text-sm text-slate-900">
                          Rp {orderTotal.toLocaleString("id-ID")}
                        </span>
                      </div>

                      {/* Proof Image Box */}
                      {o.paymentProofUrl ? (
                        <div className="relative group/img rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-36 flex items-center justify-center">
                          <img
                            src={o.paymentProofUrl}
                            alt="Bukti Bayar"
                            className="max-h-full max-w-full object-contain p-1"
                          />
                          <a
                            href={o.paymentProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            Lihat Gambar Asli
                          </a>
                        </div>
                      ) : (
                        <div className="h-28 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 text-xs italic">
                          Tidak ada file bukti transfer
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleVerifyPayment(o.id, false)}
                        className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer shadow-2xs"
                      >
                        Tolak
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVerifyPayment(o.id, true)}
                        className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95 border-none"
                      >
                        Verifikasi Lunas
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: Piutang Berjalan / Belum Bayar */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center gap-3 border-b border-slate-200/80 pb-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
          </div>
          <div>
            <h2 className="text-sm font-heading font-extrabold text-slate-900">Tagihan &amp; Piutang Belum Bayar</h2>
            <p className="text-[11px] text-slate-500">Daftar pesanan aktif yang belum melunasi pembayaran.</p>
          </div>
        </div>

        {unpaidPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-white border border-slate-200/80 rounded-2xl text-slate-400 text-xs font-semibold shadow-2xs">
            <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">sentiment_very_satisfied</span>
            <p className="text-xs font-medium">Tidak ada tunggakan piutang berjalan saat ini.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">
                    <th className="px-5 py-3">No. Pesanan</th>
                    <th className="px-5 py-3">Mitra / Apotek</th>
                    <th className="px-4 py-3">Metode Bayar</th>
                    <th className="px-5 py-3 text-right">Total Tagihan</th>
                    <th className="px-4 py-3 text-center">Status Logistik</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700">
                  {unpaidPayments.map((o) => {
                    const orderTotal = calculateOrderTotals(o).total;

                    return (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-mono font-extrabold text-slate-900">{o.orderNumber}</td>
                        <td className="px-5 py-3 font-bold text-slate-900">{o.institution.name}</td>
                        <td className="px-4 py-3">
                          {o.paymentMethod === "TOP" ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Tempo / TOP</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Bank Transfer</span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-right text-slate-900">
                          Rp {orderTotal.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {o.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleMarkAsPaidManually(o.id)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-2xs border-none"
                          >
                            Tandai Lunas
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
