"use client";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    unit: string;
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
}

export default function FinanceTab({
  orders,
  handleVerifyPayment,
}: FinanceTabProps) {
  const pendingPayments = orders.filter((o) => o.paymentStatus === "PENDING_VERIFICATION");

  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-xl font-heading font-bold text-foreground">Verifikasi Bukti Pembayaran Invoice</h2>

      {pendingPayments.length === 0 ? (
        <div className="text-center py-16 bg-white border border-outline-variant/30 rounded-3xl text-on-surface-variant text-sm shadow-sm">
          Tidak ada bukti pembayaran masuk yang menunggu verifikasi.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingPayments.map((o) => {
            const orderTotal = o.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

            return (
              <div
                key={o.id}
                className="bg-white border border-outline-variant/30 p-5 rounded-3xl space-y-4 shadow-sm text-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start border-b border-outline-variant/20 pb-2.5">
                    <div>
                      <span className="font-bold text-foreground block">{o.orderNumber}</span>
                      <span className="text-on-surface-variant">Mitra: <strong>{o.institution.name}</strong></span>
                    </div>
                    <span className="font-bold text-primary font-mono text-sm bg-surface-container-low px-2 py-0.5 rounded border border-outline-variant/20 font-mono">
                      Rp {orderTotal.toLocaleString("id-ID")}
                    </span>
                  </div>

                  {/* Bukti bayar preview */}
                  <div className="space-y-1">
                    <span className="text-on-surface-variant/60 block text-[9px] uppercase font-bold">Resi Struk Transfer</span>
                    {o.paymentProofUrl ? (
                      <div className="border border-outline-variant/20 bg-surface-container-low rounded-2xl p-2 text-center overflow-hidden shadow-inner">
                        <img
                          src={o.paymentProofUrl}
                          alt="Payment Receipt"
                          className="max-h-48 mx-auto rounded-xl object-contain cursor-zoom-in"
                        />
                      </div>
                    ) : (
                      <span className="text-error italic font-bold">Bukti transfer gagal dimuat</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => handleVerifyPayment(o.id, false)}
                    className="flex-1 py-2 bg-red-50 border border-red-200 text-error font-bold rounded-xl hover:bg-red-100 cursor-pointer transition-all shadow-sm"
                  >
                    Tolak Bukti
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyPayment(o.id, true)}
                    className="flex-1 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 cursor-pointer shadow-md shadow-primary/10 transition-all"
                  >
                    Setujui Bayar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
