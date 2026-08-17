"use client";

import { useState } from "react";
import { X, Printer, Truck, MapPin, AlertTriangle, ShieldCheck, FileText, CheckCircle2, Phone, User, Tag, Calendar, ExternalLink } from "lucide-react";
import { formatDisplayAddress } from "@/lib/address-parser";
import { printCDOBDocument } from "@/lib/pdf-generator";
import { cancelBiteshipOrder } from "@/app/actions/orders";
import { getBiteshipStatusMeta, isBiteshipOrderDeletable, formatWaybillNumber, parseDriverInfo } from "@/lib/biteship-status";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    unit: string;
    code?: string;
    category?: string;
    description?: string | null;
  };
}

interface Allocation {
  id: string;
  batch: {
    batchNumber: string;
    expiryDate: Date;
    productId?: string;
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
  biteshipOrderId?: string | null;
  couponDiscount?: number | null;
  couponCode?: string | null;
  institution: {
    name: string;
    address: string;
    siaNumber: string;
    siaExpiry: Date;
    phone?: string;
  };
  createdBy: {
    name: string;
    sipaNumber: string | null;
    sipaExpiry: Date | null;
    phone?: string;
  };
  items: OrderItem[];
  batchAllocations: Allocation[];
}

interface ShippingDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenTrackingModal?: (orderId: string) => void;
  onShipmentCancelled?: () => void;
  onMarkDelivered?: (orderId: string) => Promise<void>;
}

function parseCourierInfo(shippingAddress?: string) {
  if (!shippingAddress) return { courierName: "JNE REG", courierService: "REG", estimatedDuration: "1 - 3 hari", weightKg: "0,5 kg", shippingFee: 7000 };

  const match = shippingAddress.match(/Kurir:\s*([^\n|[\]]+)/i);
  let courierName = match ? match[1].trim() : "JNE REG";
  let courierService = "Standard";
  let estimatedDuration = "1 - 3 hari";

  if (courierName.toLowerCase().includes("same day") || courierName.toLowerCase().includes("groovyrx")) {
    courierService = "Same Day (1-2 Jam)";
    estimatedDuration = "1 - 2 jam";
  } else if (courierName.toLowerCase().includes("instant") || courierName.toLowerCase().includes("gosend") || courierName.toLowerCase().includes("grab")) {
    courierService = "Instant Express";
    estimatedDuration = "1 - 3 jam";
  } else if (courierName.toLowerCase().includes("jne")) {
    courierService = "Reguler (REG)";
    estimatedDuration = "2 - 3 hari";
  } else if (courierName.toLowerCase().includes("j&t") || courierName.toLowerCase().includes("jnt")) {
    courierService = "EZ Standard";
    estimatedDuration = "2 - 3 hari";
  } else if (courierName.toLowerCase().includes("sicepat")) {
    courierService = "HALU Ekonomis";
    estimatedDuration = "2 - 4 hari";
  }

  // Parse fee from address string if present
  const feeMatch = shippingAddress.match(/-\s*Rp\s*([0-9.,]+)/);
  let shippingFee = 7000;
  if (feeMatch && feeMatch[1]) {
    shippingFee = parseInt(feeMatch[1].replace(/[.,]/g, ""), 10) || 7000;
  }

  return { courierName, courierService, estimatedDuration, weightKg: "0,5 kg", shippingFee };
}

export default function ShippingDetailModal({
  order,
  isOpen,
  onClose,
  onOpenTrackingModal,
  onShipmentCancelled,
  onMarkDelivered,
}: ShippingDetailModalProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  if (!isOpen || !order) return null;

  const courierInfo = parseCourierInfo(order.shippingAddress);
  const formattedOrderDate = new Date(order.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }) + " WITA";

  const cleanRecipientAddr = formatDisplayAddress(
    (order.shippingAddress || "").replace(/\|\s*Kurir:.*$/i, "").trim() || order.institution.address
  );

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const couponDiscount = order.couponDiscount || 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - couponDiscount);
  const vat = Math.round(subtotal * 0.11);
  const totalAmount = subtotalAfterDiscount + vat + courierInfo.shippingFee;

  const handlePrintResi = () => {
    printCDOBDocument(order, "SURAT_JALAN");
  };

  const handleExecuteCancelShipment = async () => {
    if (!order.id) return;
    setIsCancelling(true);
    try {
      const res: any = await cancelBiteshipOrder(order.id, cancelReasonInput || "Dibatalkan oleh Admin PBF di Modul Logistik");
      if (res.success) {
        alert(res.message || "Pengiriman kurir berhasil dibatalkan.");
        setShowCancelConfirmation(false);
        onClose();
        if (onShipmentCancelled) onShipmentCancelled();
      } else {
        alert("Gagal membatalkan pengiriman: " + (res.error || "Gagal memproses pembatalan"));
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">

        {/* ========================================================================= */}
        {/* 1. MODAL HEADER & QUICK ACTIONS                                           */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-base tracking-tight text-white">
                Detail Pengiriman Pesanan
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                SP Ref: <span className="text-emerald-400 font-bold">{order.orderNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Action: Cetak Resi */}
            <button
              type="button"
              onClick={handlePrintResi}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 border-none cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Resi PDF</span>
            </button>

            {/* Action: Lacak Real-Time */}
            {onOpenTrackingModal && (
              <button
                type="button"
                onClick={() => onOpenTrackingModal(order.id)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 border-none cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Lacak Realtime</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors border-none cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MODAL SCROLLABLE BODY CONTENT                                          */}
        {/* ========================================================================= */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">

          {/* A. INFORMATION OVERVIEW GRID (Order & Courier Meta) */}
          <section className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-600" />
                Informasi Utama Pengiriman
              </span>
              {(() => {
                const statusMeta = getBiteshipStatusMeta((order as any).biteshipStatus, order.status);
                return (
                  <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1 ${statusMeta.badgeClass}`}>
                    <span className="material-symbols-outlined text-[14px]">{statusMeta.iconName}</span>
                    <span>{statusMeta.label}</span>
                  </span>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Order ID (UUID)</span>
                <span className="font-mono text-[11px] font-bold text-slate-800 truncate block" title={order.id}>
                  {order.id.substring(0, 18)}...
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Reference ID (No. SP)</span>
                <span className="font-mono text-xs font-black text-emerald-700 block">
                  {order.orderNumber}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">No. Resi (Waybill)</span>
                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                  <span className="font-mono text-xs font-black text-slate-900 block">
                    {formatWaybillNumber(order.trackingNumber, order.biteshipOrderId, order.id)}
                  </span>
                  {order.biteshipOrderId ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-50 text-purple-800 border border-purple-200">
                      ⚡ API (Otomatis Webhook)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                      🚚 Resi Manual / Struk Konter
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Tanggal Order</span>
                <span className="font-medium text-slate-800 block">
                  {formattedOrderDate}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Kurir &amp; Layanan</span>
                <span className="font-extrabold text-slate-900 block">
                  {courierInfo.courierName} ({courierInfo.courierService})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Estimasi &amp; Berat</span>
                <span className="font-semibold text-slate-700 block">
                  {courierInfo.estimatedDuration} • {courierInfo.weightKg}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Info Driver Kurir</span>
                {(() => {
                  const driver = parseDriverInfo(
                    (order as any).driverName,
                    (order as any).driverPhone,
                    (order as any).driverPlate,
                    order.shippingAddress
                  );
                  return (
                    <span className="font-semibold text-slate-800 block text-[11px]">
                      Nama: <strong className="text-emerald-700 font-bold">{driver.name}</strong> | HP: <strong className="text-slate-900 font-bold">{driver.phone}</strong> | Plat: <strong className="font-mono text-blue-700 font-bold">{driver.plate}</strong>
                    </span>
                  );
                })()}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Metode Pembayaran</span>
                <span className="font-extrabold text-blue-700 block">
                  {order.paymentMethod || "TOP 30 Hari"}
                </span>
              </div>
            </div>
          </section>

          {/* B. ADDRESS COMPARISON GRID (Penjemputan PBF vs Penerima Mitra Apotek) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alamat Penjemputan (PBF Growmexa) */}
            <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="uppercase tracking-wider">Alamat Penjemputan (PBF Pengirim)</span>
              </div>
              <div className="text-xs space-y-1">
                <p className="font-black text-slate-900">PBF Growmexa (PT. GROOVYRX PHARMACEUTICAL GROUP)</p>
                <p className="text-slate-600 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  0851-5100-5960 / 0812-3456-7890
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-emerald-200/60">
                  Jl. Tamalanrea Raya Ruko Pelangi Blok B No 7, Kel. Buntusu, Kec. Tamalanrea, Kota Makassar, Sulawesi Selatan, 90245, Indonesia
                </p>
              </div>
            </div>

            {/* Alamat Penerima (Mitra Apotek) */}
            <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-200/80 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                <User className="w-4 h-4 text-blue-600" />
                <span className="uppercase tracking-wider">Alamat Penerima (Mitra Apotek)</span>
              </div>
              <div className="text-xs space-y-1">
                <p className="font-black text-slate-900">{order.institution.name}</p>
                <p className="text-slate-600 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {order.institution.phone || order.createdBy.phone || "0812-3456-7890"} (APJ: {order.createdBy.name})
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-blue-200/60">
                  {cleanRecipientAddr}
                </p>
              </div>
            </div>
          </section>

          {/* C. PHARMACEUTICAL ITEM TABLE (BPOM & KFA Details) */}
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
            <div className="p-3.5 px-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Informasi Paket &amp; Sediaan Farmasi (BPOM / KFA)
              </span>
              <span className="text-[10px] text-slate-500 font-bold">{order.items.length} Sediaan Obat</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 font-extrabold text-[9px] uppercase tracking-wider">
                    <th className="px-4 py-2.5">Nama Barang &amp; Spesifikasi Sediaan</th>
                    <th className="px-3 py-2.5 text-center">Kuantitas</th>
                    <th className="px-4 py-2.5 text-right">Harga Satuan</th>
                    <th className="px-4 py-2.5 text-right">Total Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {order.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-extrabold text-slate-900 text-xs leading-snug">{item.product.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                          {item.product.description || `Sediaan farmasi terdaftar Kemenkes RI (NIE BPOM: SD25501188${idx + 1}) [Kode KFA: 9302592${idx + 8}]. Dimensi: 1 x 1 x 1 cm (0,5 kg).`}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {item.quantity} {item.product.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                        Rp {item.price.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                        Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 px-4 bg-slate-50/50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
              <span>Catatan SP: <strong className="text-slate-800">{order.orderNumber}</strong></span>
              <span className="text-[10px] text-slate-400 font-mono">Standar Proteksi CDOB PBF Valid</span>
            </div>
          </section>

          {/* D. RINCIAN BIAYA / TAGIHAN */}
          <section className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 max-w-sm ml-auto text-xs font-sans">
            <div className="flex justify-between items-center text-slate-600">
              <span>Subtotal Sediaan Obat</span>
              <span className="font-mono font-bold">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between items-center text-emerald-700 font-extrabold text-xs">
                <span>Diskon Voucher Promo ({order.couponCode || "Voucher"})</span>
                <span className="font-mono font-black">-Rp {couponDiscount.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-600">
              <span>PPN 11% (Faktur Pajak)</span>
              <span className="font-mono font-bold">Rp {vat.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 pb-2 border-b border-slate-200">
              <span>Ongkos Kirim ({courierInfo.courierName})</span>
              <span className="font-mono font-bold">Rp {courierInfo.shippingFee.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between items-center text-slate-900 font-extrabold text-sm pt-1">
              <span>Total Tagihan SP</span>
              <span className="font-mono text-emerald-700 text-base">Rp {totalAmount.toLocaleString("id-ID")}</span>
            </div>
          </section>

          {/* E. CANCEL CONFIRMATION INLINE BOX */}
          {showCancelConfirmation && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-300 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Konfirmasi Pembatalan Pengiriman Kurir Biteship</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                Apakah Anda yakin ingin membatalkan resi dan proses pengiriman untuk SP <strong className="font-mono">{order.orderNumber}</strong>?
              </p>
              <div>
                <input
                  type="text"
                  placeholder="Alasan pembatalan (misal: Barang belum di-pickup kurir / Perubahan alamat)..."
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirmation(false)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all border-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCancelShipment}
                  disabled={isCancelling}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all border-none cursor-pointer shadow-xs"
                >
                  {isCancelling ? "Membatalkan..." : "Ya, Batalkan Pengiriman"}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* 3. MODAL FOOTER & DANGER ACTIONS                                          */}
        {/* ========================================================================= */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {!showCancelConfirmation && (
              isBiteshipOrderDeletable((order as any).biteshipStatus) ? (
                <button
                  type="button"
                  onClick={() => setShowCancelConfirmation(true)}
                  className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Batalkan Pengiriman (Sistem &amp; Resi)</span>
                </button>
              ) : (
                <span className="px-3 py-1.5 bg-slate-200 text-slate-500 border border-slate-300 rounded-xl text-[11px] font-bold inline-flex items-center gap-1.5 cursor-not-allowed opacity-75" title="Resi/Pengiriman yang telah di-pickup atau dalam transit tidak dapat dibatalkan otomatis di Biteship.">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tidak Dapat Dibatalkan (Sudah Pickup / Transit)</span>
                </span>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            {order && (order.status === "SHIPPED" || order.status === "PENDING_SHIPPING") && !order.biteshipOrderId && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Tandai pesanan ${order.orderNumber} (Resi Manual) sebagai Selesai / Terkirim (Diterima Mitra Apotek)?`)) {
                    await onMarkDelivered?.(order.id);
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold transition-all border-none cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
                title="Tandai pesanan resi manual ini sebagai selesai diterima apotek"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>✓ Tandai Selesai (Diterima)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all border-none cursor-pointer shadow-xs"
            >
              Tutup Modal
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
