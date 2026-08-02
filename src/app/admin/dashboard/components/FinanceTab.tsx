"use client";

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
    <div className="space-y-12 animate-fadeIn pb-12">
      
      {/* HEADER PAGE */}
      <div>
        <h1 className="text-3xl font-heading font-extrabold text-foreground tracking-tight">Manajemen Keuangan</h1>
        <p className="text-sm text-on-surface-variant mt-1">Verifikasi bukti transfer dan kelola piutang mitra apotek.</p>
      </div>

      {/* SECTION 1: Menunggu Verifikasi */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">fact_check</span>
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground">Verifikasi Pembayaran</h2>
            <p className="text-xs text-on-surface-variant">Butuh tindakan untuk menyetujui atau menolak bukti transfer.</p>
          </div>
          {pendingPayments.length > 0 && (
            <span className="ml-auto text-xs font-bold bg-error text-white px-3 py-1 rounded-full animate-pulse shadow-sm">
              {pendingPayments.length} Menunggu
            </span>
          )}
        </div>

        {pendingPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-white to-slate-50 border border-dashed border-outline-variant/30 rounded-3xl text-on-surface-variant shadow-sm">
            <span className="material-symbols-outlined text-4xl text-outline-variant/50 mb-3">check_circle</span>
            <p className="text-sm font-medium">Semua bukti pembayaran sudah terverifikasi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingPayments.map((o) => {
              const orderTotal = calculateOrderTotals(o).total;

              return (
                <div
                  key={o.id}
                  className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  <div className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-b border-primary/10">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-primary bg-white px-2.5 py-1 rounded-lg text-xs shadow-sm border border-primary/10">
                        {o.orderNumber}
                      </span>
                      <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-lg">
                        {new Date(o.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground mt-3">{o.institution.name}</h3>
                    <p className="text-[10px] text-on-surface-variant line-clamp-1">{o.institution.address}</p>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-on-surface-variant">Total Transfer</span>
                      <span className="font-bold text-foreground font-mono text-sm bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        Rp {orderTotal.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Resi Bukti Transfer</span>
                      {o.paymentProofUrl ? (
                        <div className="border-2 border-dashed border-outline-variant/30 bg-slate-50 rounded-2xl p-2 flex items-center justify-center relative group-hover:border-primary/40 transition-colors">
                          <img
                            src={o.paymentProofUrl}
                            alt="Payment Receipt"
                            className="max-h-40 rounded-xl object-contain cursor-zoom-in"
                          />
                        </div>
                      ) : (
                        <div className="border border-red-200 bg-red-50 rounded-2xl p-4 text-center">
                          <span className="text-error text-xs font-bold">Bukti gagal dimuat</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-outline-variant/20 flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleVerifyPayment(o.id, false)}
                      className="flex-1 py-2.5 bg-white border border-error/30 text-error font-bold text-xs rounded-xl hover:bg-error hover:text-white cursor-pointer transition-all shadow-sm"
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyPayment(o.id, true)}
                      className="flex-1 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/90 cursor-pointer shadow-md shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                    >
                      Setujui
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: Belum Lunas (Piutang) */}
      <section className="space-y-6 pt-8">
        <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground">Daftar Piutang Mitra (Belum Lunas)</h2>
            <p className="text-xs text-on-surface-variant">Tagihan berjalan yang memotong limit kredit mitra.</p>
          </div>
          <span className="ml-auto text-sm font-bold bg-secondary-container text-on-secondary-container px-4 py-1.5 rounded-full shadow-sm">
            Total: {unpaidPayments.length} Tagihan
          </span>
        </div>

        {unpaidPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-gradient-to-b from-white to-slate-50 border border-dashed border-outline-variant/30 rounded-3xl text-on-surface-variant shadow-sm">
            <span className="material-symbols-outlined text-4xl text-outline-variant/50 mb-3">task_alt</span>
            <p className="text-sm font-medium">Bagus! Tidak ada tagihan piutang mitra yang menunggak.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {unpaidPayments.map((o) => {
              const orderTotal = calculateOrderTotals(o).total;

              return (
                <div
                  key={o.id}
                  className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col"
                >
                  {/* Decorative Background Icon */}
                  <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-[120px] text-slate-50 rotate-[-15deg] select-none pointer-events-none z-0">
                    receipt_long
                  </span>

                  <div className="p-6 relative z-10 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Invoice / SP</span>
                        <span className="font-bold text-foreground text-sm">{o.orderNumber}</span>
                      </div>
                      <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-extrabold px-2 py-1 rounded">
                        UNPAID
                      </span>
                    </div>

                    <div className="space-y-1 mb-6">
                      <p className="font-heading font-bold text-foreground">{o.institution.name}</p>
                      <p className="text-xs text-on-surface-variant font-mono">Tgl: {new Date(o.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>

                    {/* Dashed separator like a real receipt */}
                    <div className="w-full border-t-2 border-dashed border-outline-variant/30 my-4"></div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Total Tagihan</span>
                      <span className="font-bold text-secondary font-mono text-xl">
                        Rp {orderTotal.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 relative z-10 bg-slate-50/80 backdrop-blur-sm border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={() => handleMarkAsPaidManually(o.id)}
                      className="w-full py-3 bg-white border-2 border-secondary text-secondary font-bold text-xs rounded-xl hover:bg-secondary hover:text-white cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                      Tandai Lunas Manual
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
