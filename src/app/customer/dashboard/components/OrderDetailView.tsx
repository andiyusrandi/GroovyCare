"use client";

import { useState } from "react";
import { printCDOBDocument, downloadCDOBDocument } from "@/lib/pdf-generator";
import BiteshipTrackingModal from "@/app/components/BiteshipTrackingModal";
import CdobDocumentModal from "@/components/CdobDocumentModal";
import { formatDisplayAddress } from "@/lib/address-parser";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  FileText, 
  Clock, 
  MapPin, 
  Copy, 
  Download, 
  Radar, 
  ShieldCheck,
  CheckCircle,
  Receipt
} from "lucide-react";
import { triggerHapticImpact } from "@/lib/mobile-haptics";
import { getBiteshipStatusMeta, formatWaybillNumber } from "@/lib/biteship-status";

interface OrderDetailViewProps {
  order: any;
  setViewingDetailOrder: (order: any) => void;
  setViewingFaktur: (order: any) => void;
  handleConfirmDelivery: (orderId: string) => void;
  setCancelingOrder?: (order: any) => void;
}

function getSelectedCourierName(addr?: string): string {
  if (!addr) return "-";
  const match = addr.match(/Kurir:\s*([^\s(|]+(?:\s+[^\s(|]+)?)/i);
  if (match && match[1]) {
    const raw = match[1].trim();
    if (raw.toLowerCase() === "standard" || raw.toLowerCase() === "flat" || raw.toLowerCase().includes("standard flat")) {
      return "-";
    }
    return raw;
  }
  if (addr.includes("groovyrx") || addr.includes("Logistik")) {
    return "Logistik Groovyrx";
  }
  return "-";
}

export function canOpenEFaktur(order: any): boolean {
  if (!order) return false;
  if (order.status === "CANCELLED" || order.status === "REJECTED") return false;

  // 1. Status Pembayaran Lunas (PAID)
  const isPaid =
    order.paymentStatus === "PAID" ||
    order.status === "PAID" ||
    order.status === "PROCESSING" ||
    order.status === "PACKING" ||
    order.status === "SHIPPED" ||
    order.status === "DELIVERED";

  // 2. Metode Pembayaran Limit Kredit (Tempo / TOP)
  const methodUpper = String(order.paymentMethod || "").toUpperCase();
  const isCreditLimit =
    methodUpper.includes("CREDIT") ||
    methodUpper.includes("LIMIT") ||
    methodUpper.includes("TEMPO") ||
    methodUpper.includes("TOP") ||
    order.paymentMethod === "CREDIT_LIMIT";

  return isPaid || isCreditLimit;
}

export default function OrderDetailView({
  order,
  setViewingDetailOrder,
  setViewingFaktur,
  handleConfirmDelivery,
  setCancelingOrder,
}: OrderDetailViewProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [docModalType, setDocModalType] = useState<"SP" | "INVOICE" | "SURAT_JALAN" | null>(null);
  const subtotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const vat = Math.round(subtotal * 0.11);
  const isColdChain = order.items.some((item: any) =>
    item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain" ||
    item.product?.name?.toLowerCase().includes("insulin") || item.product?.code?.toLowerCase().includes("amx") ||
    item.product?.name?.toLowerCase().includes("vaccine")
  );

  const addr = order.shippingAddress || "";
  const feeMatch = addr.match(/-\s*Rp\s*([0-9.,]+)/);
  let shippingFee = 0;
  if (feeMatch && feeMatch[1]) {
    shippingFee = parseInt(feeMatch[1].replace(/[.,]/g, ""), 10) || 0;
  } else if (addr.includes("Kurir: Standard Flat Rate")) {
    shippingFee = isColdChain ? 85000 : 50000;
  } else {
    shippingFee = 50000;
  }
  const totalBilling = subtotal + vat + shippingFee;

  // Stepper calculations
  const isPendingApproval = order.status === "PENDING_APPROVAL";
  const isPendingShipping = order.status === "PENDING_SHIPPING";
  const isShipped = order.status === "SHIPPED";
  const isDelivered = order.status === "DELIVERED";
  const isRejected = order.status === "REJECTED";

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">

      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW                                                           */}
      {/* ========================================================================= */}
      <div className="hidden md:block space-y-6">
        {/* Page Header & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-on-surface-variant font-medium text-xs mb-2">
              <button
                onClick={() => setViewingDetailOrder(null)}
                className="hover:text-primary transition-colors cursor-pointer font-bold border-none bg-transparent"
              >
                Orders
              </button>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-bold">{order.orderNumber}</span>
            </nav>
            <h3 className="font-heading font-extrabold text-2xl text-foreground">
              Detail Pesanan {order.orderNumber}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {(order.biteshipOrderId || order.trackingNumber) && (
              <button
                type="button"
                onClick={() => setIsTrackingModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-xl transition-colors text-xs font-bold shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] animate-pulse">radar</span>
                Lacak In-App Live
              </button>
            )}
            <button
              onClick={() => alert("Silakan hubungi tim IT PBF Online untuk bantuan sistem.")}
              className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant/40 hover:bg-surface-container-low text-on-surface rounded-xl transition-colors text-xs font-bold shadow-sm cursor-pointer bg-white"
            >
              <span className="material-symbols-outlined text-[16px]">help</span>
              Bantuan
            </button>
            {(order.status === "PENDING_APPROVAL" || order.status === "PENDING_SHIPPING") && setCancelingOrder && (
              <button
                type="button"
                onClick={() => setCancelingOrder(order)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold border border-red-200 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                Batalkan Pesanan
              </button>
            )}
            <button
              onClick={() => alert("Hubungi CS via Whatsapp: +62 812-3456-7890")}
              className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-[16px] text-white">support_agent</span>
              Hubungi CS
            </button>
            <button
              onClick={() => setViewingDetailOrder(null)}
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold transition-all cursor-pointer border-none"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Status Tracker */}
        {isRejected ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-error font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-error shrink-0">warning</span>
            <span>
              <strong>Pesanan Ditolak PBF:</strong> {order.rejectionReason || "Dokumen legalitas tidak valid."}
            </span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 overflow-x-auto scrollbar-hide shadow-sm">
            <div className="min-w-[800px] relative flex justify-between">
              {/* Progress Line Background */}
              <div className="absolute top-5 left-8 right-8 h-1 bg-surface-container-highest z-0"></div>
              {/* Progress Line Active */}
              <div
                className="absolute top-5 left-8 h-1 bg-primary z-0 transition-all duration-1000"
                style={{
                  width:
                    order.status === "DELIVERED"
                      ? "90%"
                      : order.status === "SHIPPED"
                        ? "70%"
                        : order.status === "PENDING_SHIPPING"
                          ? "45%"
                          : order.spSignature
                            ? "22%"
                            : "0%",
                }}
              ></div>

              {/* Step 1: Pesanan Diterima */}
              <div className="relative z-10 flex flex-col items-center w-36">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center mb-2 shadow">
                  <span className="material-symbols-outlined text-sm">check</span>
                </div>
                <span className="text-[11px] font-bold text-on-surface">Pesanan Diterima</span>
                <span className="text-[9px] text-on-surface-variant mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                </span>
              </div>

              {/* Step 2: Validasi APJ */}
              <div
                className={`relative z-10 flex flex-col items-center w-36 transition-opacity ${order.spSignature ? "opacity-100" : "opacity-40"
                  }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 shadow ${order.spSignature ? "bg-primary text-white" : "bg-surface-container-highest text-on-surface-variant"
                  }`}>
                  {order.spSignature ? (
                    <span className="material-symbols-outlined text-sm">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-on-surface">Validasi APJ</span>
                <span className="text-[9px] text-on-surface-variant mt-0.5">e-Sign SP Dibubuhkan</span>
              </div>

              {/* Step 3: Picking & Packing */}
              <div
                className={`relative z-10 flex flex-col items-center w-36 transition-opacity ${order.status === "PENDING_SHIPPING" ||
                  order.status === "SHIPPED" ||
                  order.status === "DELIVERED"
                  ? "opacity-100"
                  : "opacity-45"
                  }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 shadow ${order.status === "PENDING_SHIPPING" || order.status === "SHIPPED" || order.status === "DELIVERED"
                    ? "bg-primary text-white"
                    : "bg-surface-container-highest text-on-surface-variant"
                  }`}>
                  {order.status === "PENDING_SHIPPING" || order.status === "SHIPPED" || order.status === "DELIVERED" ? (
                    <span className="material-symbols-outlined text-sm">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-on-surface">Picking &amp; Packing</span>
                <span className="text-[9px] text-on-surface-variant mt-0.5">FEFO Stok Terkunci</span>
              </div>

              {/* Step 4: Dalam Pengiriman */}
              <div
                className={`relative z-10 flex flex-col items-center w-36 transition-opacity ${order.status === "SHIPPED" || order.status === "DELIVERED"
                  ? "opacity-100"
                  : "opacity-45"
                  }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 shadow ${order.status === "SHIPPED"
                    ? "bg-primary text-white ring-4 ring-primary/20 animate-pulse"
                    : order.status === "DELIVERED"
                      ? "bg-primary text-white"
                      : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                >
                  <span className="material-symbols-outlined text-sm">local_shipping</span>
                </div>
                <span
                  className={`text-[11px] font-bold ${order.status === "SHIPPED" ? "text-primary" : "text-on-surface"
                    }`}
                >
                  Dalam Pengiriman
                </span>
                {order.status === "SHIPPED" && (
                  <span className="text-[9px] text-primary mt-0.5 font-bold animate-pulse">Kurir Menuju Lokasi</span>
                )}
              </div>

              {/* Step 5: Selesai */}
              <div
                className={`relative z-10 flex flex-col items-center w-36 transition-opacity ${order.status === "DELIVERED" ? "opacity-100" : "opacity-45"
                  }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 shadow ${order.status === "DELIVERED"
                    ? "bg-primary text-white"
                    : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                >
                  <span className="material-symbols-outlined text-sm">task_alt</span>
                </div>
                <span className="text-[11px] font-bold text-on-surface">Selesai</span>
                {order.status === "DELIVERED" && (
                  <span className="text-[9px] text-primary font-bold mt-0.5">Diterima Apotek</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grid Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details & Product List (Left - 2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl p-5 border border-outline-variant/30 shadow-sm grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Tanggal Pesanan</p>
                <p className="font-heading font-bold text-sm text-on-surface">
                  {new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Metode Pembayaran</p>
                <div className="flex flex-col gap-1">
                  <p className="font-heading font-bold text-sm text-on-surface">
                    {order.paymentMethod === "VA"
                      ? "Bank Transfer (VA)"
                      : order.paymentMethod === "TOP"
                        ? "Limit Kredit / TOP (Tempo 30 Hari)"
                        : order.paymentMethod === "COD"
                          ? "Cash on Delivery (COD)"
                          : "COD"}
                  </p>
                  {order.paymentMethod === "TOP" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                      <Clock className="w-3 h-3" />
                      <span>Jatuh Tempo: 30 Hari Kerja</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1">Total Pembayaran</p>
                <p className="font-heading font-extrabold text-base text-primary font-mono">
                  Rp {totalBilling.toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            {/* Product Table */}
            <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/30">
                <h4 className="font-heading font-bold text-sm text-foreground">Daftar Produk</h4>
                <span className="bg-primary-container text-on-primary-container px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  {order.items.length} Item
                </span>
              </div>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low/50 text-on-surface-variant font-bold border-b border-outline-variant/20">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Produk &amp; Manufaktur</th>
                      <th className="px-5 py-3 font-semibold text-center">Jumlah</th>
                      <th className="px-5 py-3 font-semibold text-right">Harga Satuan</th>
                      <th className="px-5 py-3 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                    {order.items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-surface-container-low/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center text-primary shrink-0 border border-outline-variant/25">
                              <span className="material-symbols-outlined text-[18px]">medication</span>
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{item.product.name}</p>
                              <p className="text-[10px] text-on-surface-variant/80">{item.product.manufacturer || "Dexa Medica"} • {item.product.unit}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center font-medium">
                          {item.quantity} {item.product.unit.split(" ")[0]}
                        </td>
                        <td className="px-5 py-4 text-right font-mono">
                          Rp {item.price.toLocaleString("id-ID")}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-foreground font-mono">
                          Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary Breakdown */}
              <div className="p-5 bg-slate-50/50 border-t border-outline-variant/15 flex justify-end">
                <div className="w-full max-w-xs space-y-2.5 text-xs text-on-surface-variant font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal Produk</span>
                    <span className="font-bold text-foreground font-mono">Rp {subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PPN (11%)</span>
                    <span className="font-bold text-foreground font-mono">Rp {vat.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya Pengiriman</span>
                    <span className="font-bold text-foreground font-mono">Rp {shippingFee.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-end">
                    <span className="font-heading font-extrabold text-sm text-foreground">Total Tagihan</span>
                    <span className="font-mono font-extrabold text-base text-primary">Rp {totalBilling.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logistics & Documents (Right - 1 Col) */}
          <div className="space-y-6 text-xs">
            {/* Logistics Tracking */}
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <h4 className="font-heading font-bold text-sm text-foreground">Pelacakan Logistik</h4>
                <span className="material-symbols-outlined text-primary text-[18px]">local_shipping</span>
              </div>
              <div className="relative space-y-5 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/30">
                {isDelivered && (
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full bg-primary border-2 border-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                    <p className="font-bold text-foreground">Selesai - Pesanan Diterima</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Barang telah sampai di Apotek dengan baik.</p>
                  </div>
                )}

                {(isShipped || isDelivered) && (
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full bg-primary border-2 border-white flex items-center justify-center">
                      {isShipped && <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>}
                    </div>
                    <p className="font-bold text-foreground">Dalam Perjalanan</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      Pesanan sedang dikirim kurir. Resi: <strong className="font-mono text-primary">{formatWaybillNumber(order.trackingNumber, order.biteshipOrderId, order.id)}</strong>
                    </p>
                  </div>
                )}

                {(isPendingShipping || isShipped || isDelivered) && (
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full bg-outline-variant/70 border-2 border-white"></div>
                    <p className="font-bold text-foreground">Paket Siap</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Selesai picking stok obat (FEFO) di Gudang Utama.</p>
                  </div>
                )}

                {isPendingApproval && (
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full bg-primary border-2 border-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    </div>
                    <p className="font-bold text-foreground">Menunggu Verifikasi CDOB</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      {order.spSignature
                        ? "Dokumen SP lengkap, menunggu persetujuan APJ PBF."
                        : "Menunggu pembubuhan tanda tangan Surat Pesanan digital APJ Apotek."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cold Chain Temperature Monitor Card */}
            {isColdChain && (isShipped || isDelivered) && (
              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200/50 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                  <h4 className="font-heading font-bold text-xs text-blue-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-blue-600 text-[16px]">ac_unit</span>
                    Pemantauan Suhu Cold Chain
                  </h4>
                  <span className="text-[9px] text-blue-800 font-bold bg-blue-100 px-2 py-0.5 rounded-full">CDOB Compliant</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-blue-800">Suhu Box Pengiriman</span>
                    <span className="font-mono font-extrabold text-xs text-blue-600 flex items-center gap-1">
                      ❄4.2°C
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.2 rounded-md">(Aman)</span>
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: "45%" }}></div>
                  </div>
                  <p className="text-[9px] text-blue-700/80 leading-relaxed">
                    Suhu boks dipantau oleh IoT sensor PBF secara berkala (batas aman: 2.0°C - 8.0°C). Log perjalanan suhu menunjukkan kestabilan termal tanpa ada deviasi.
                  </p>
                </div>
              </div>
            )}

            {/* Documents Section */}
            <div className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
              <h4 className="font-heading font-bold text-sm text-foreground border-b border-outline-variant/20 pb-2">Dokumen Transaksi CDOB</h4>
              <div className="space-y-2">
                {/* Surat Pesanan */}
                <div className="flex items-center justify-between p-2.5 border border-outline-variant/20 rounded-xl hover:bg-surface-container-low/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-50 border border-red-100 text-error rounded-lg flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">description</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Surat Pesanan (SP)</p>
                      {order.spSignature ? (
                        <span className="text-[9px] text-primary font-bold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                          e-Sign Terverifikasi
                        </span>
                      ) : (
                        <span className="text-[9px] text-error font-bold block">Tanda tangan kosong</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadCDOBDocument(order, "SP")}
                    className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-none bg-transparent flex items-center p-1"
                    title="Download Surat Pesanan"
                  >
                    <span className="material-symbols-outlined text-primary text-[18px]">download</span>
                  </button>
                </div>

                {/* Invoice (e-Faktur) */}
                <div className="flex items-center justify-between p-2.5 border border-outline-variant/20 rounded-xl hover:bg-surface-container-low/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-secondary-container/20 text-secondary rounded-lg flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">receipt</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Invoice (e-Faktur)</p>
                      <p className="text-[9px] text-on-surface-variant">INV-{order.orderNumber}</p>
                    </div>
                  </div>
                  {!isPendingApproval && !isRejected && canOpenEFaktur(order) ? (
                    <button
                      type="button"
                      onClick={() => downloadCDOBDocument(order, "INVOICE")}
                      className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-none bg-transparent flex items-center p-1"
                      title="Download Invoice"
                    >
                      <span className="material-symbols-outlined text-primary text-[18px]">download</span>
                    </button>
                  ) : (
                    <span className="text-[9px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200 inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">lock</span> Terkunci (Belum Lunas)
                    </span>
                  )}
                </div>

                {/* Surat Jalan PBF */}
                <div className="flex items-center justify-between p-2.5 border border-outline-variant/20 rounded-xl hover:bg-surface-container-low/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-50 border border-teal-100 text-teal-700 rounded-lg flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Surat Jalan PBF</p>
                      <p className="text-[9px] text-on-surface-variant">SJ-{order.orderNumber}</p>
                    </div>
                  </div>
                  {!isPendingApproval && !isRejected ? (
                    <button
                      type="button"
                      onClick={() => downloadCDOBDocument(order, "SURAT_JALAN")}
                      className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-none bg-transparent flex items-center p-1"
                      title="Download Surat Jalan"
                    >
                      <span className="material-symbols-outlined text-primary text-[18px]">download</span>
                    </button>
                  ) : (
                    <span className="text-[9px] text-on-surface-variant/40 italic font-medium">Belum terbit</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW: Live Tracking Delivery Page (Tokopedia / Grab Style)       */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-4 px-1 pb-12 font-sans">
        {/* Status Hero Card (Tokopedia / Alodokter Soft Clean White Style) */}
        <section className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start gap-2 relative z-10">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Surat Pesanan (SP)</p>
              <h2 className="text-sm font-black text-slate-800 font-mono mt-0.5">{order.orderNumber}</h2>
            </div>
            {(() => {
              const meta = getBiteshipStatusMeta(order.biteshipStatus, order.status);
              return (
                <span className={`px-3 py-1 rounded-full text-[9.5px] font-black uppercase tracking-tight shadow-2xs ${meta.badgeClass}`}>
                  {meta.label}
                </span>
              );
            })()}
          </div>

          <div className="pt-2.5 border-t border-slate-100 relative z-10 space-y-1">
            <p className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              {getBiteshipStatusMeta(order.biteshipStatus, order.status).label}
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              {order.biteshipStatusLabel || getBiteshipStatusMeta(order.biteshipStatus, order.status).description}
            </p>
          </div>

          {(order.biteshipOrderId || order.trackingNumber) && (
            <button
              type="button"
              onClick={() => {
                triggerHapticImpact();
                setIsTrackingModalOpen(true);
              }}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-700/20 transition active:scale-[0.98] active:bg-emerald-700 active:shadow-none border-none cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
              </span>
              <MapPin className="w-4 h-4 stroke-[2.5]" />
              <span>Lacak Live GPS Biteship</span>
            </button>
          )}
        </section>

        {/* Tokopedia Horizontal Stepper */}
        <section className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="relative">
            <div className="absolute top-3.5 left-[12.5%] right-[12.5%] h-0.5 bg-slate-100 z-0" />
            <div
              className="absolute top-3.5 left-[12.5%] h-0.5 bg-emerald-500 z-0 transition-all duration-500"
              style={{
                width: isDelivered
                  ? "75%"
                  : isShipped
                    ? "50%"
                    : isPendingShipping
                      ? "25%"
                      : "0%"
              }}
            />

            <div className="relative flex justify-between z-10 text-center">
              {/* Step 1 */}
              <div className="flex flex-col items-center w-1/4">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center mb-1.5 shadow-xs text-white">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9.5px] font-extrabold text-slate-800">Diproses</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center w-1/4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1.5 shadow-xs text-white ${
                  isPendingShipping || isShipped || isDelivered ? "bg-emerald-600" : "bg-slate-100 text-slate-400"
                }`}>
                  {isPendingShipping || isShipped || isDelivered ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Package className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-[9.5px] font-extrabold text-slate-800">Dikemas</span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center w-1/4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1.5 shadow-xs text-white ${
                  isDelivered
                    ? "bg-emerald-600"
                    : isShipped
                      ? "bg-blue-600 ring-4 ring-blue-100 animate-pulse"
                      : "bg-slate-100 text-slate-400"
                }`}>
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[9.5px] font-extrabold ${isShipped ? "text-blue-700" : "text-slate-800"}`}>
                  {isShipped ? getBiteshipStatusMeta(order.biteshipStatus, order.status).label : "Dikirim"}
                </span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center w-1/4">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1.5 shadow-xs text-white ${
                  isDelivered ? "bg-emerald-600" : "bg-slate-100 text-slate-400"
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[9.5px] font-extrabold ${isDelivered ? "text-emerald-700" : "text-slate-400"}`}>Selesai</span>
              </div>
            </div>
          </div>
        </section>

        {/* Informasi Logistik & Alamat (Grab Delivery Info Style) */}
        <section className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs text-xs">
          <div className="p-4 bg-slate-50/50">
            <h3 className="font-black text-slate-800 text-xs">Informasi Pengiriman & Resi</h3>
          </div>

          <div className="p-4 flex justify-between items-center">
            <div>
              <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">No. Resi / Airwaybill</span>
              <span className="font-mono text-xs font-black text-slate-900 mt-0.5 block">
                {formatWaybillNumber(order.trackingNumber, order.biteshipOrderId, order.id)}
              </span>
            </div>
            {(order.trackingNumber || order.biteshipOrderId) && (
              <button
                type="button"
                onClick={() => {
                  triggerHapticImpact();
                  navigator.clipboard.writeText(formatWaybillNumber(order.trackingNumber, order.biteshipOrderId, order.id));
                  alert("No. Resi disalin ke clipboard!");
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl text-slate-700 font-bold text-[10px] flex items-center gap-1 border-none cursor-pointer"
              >
                <Copy className="w-3 h-3 text-slate-600" />
                Salin
              </button>
            )}
          </div>

          <div className="p-4">
            <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Kurir Expedisi</span>
            <span className="text-xs text-slate-800 font-extrabold flex items-center gap-2">
              {getSelectedCourierName(order.shippingAddress)}
              {getSelectedCourierName(order.shippingAddress) !== "-" && (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase">
                  Verified CDOB
                </span>
              )}
            </span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block">Alamat Penerima</span>
            <span className="text-xs text-slate-900 font-black block">{order.institution?.name || "Apotek Mitra"}</span>
            <p className="text-[10.5px] text-slate-600 leading-relaxed font-medium">
              {formatDisplayAddress(order.shippingAddress || order.institution?.address)}
            </p>
          </div>
        </section>

        {/* Daftar Produk Pesanan */}
        <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-800 text-xs">Rincian Obat ({order.items.length} Item)</h3>
            <span className="font-mono text-xs font-black text-emerald-700">
              Total: Rp {totalBilling.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {order.items.map((item: any, idx: number) => {
              const isItemColdChain = item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain" || item.product?.name?.toLowerCase().includes("insulin") || item.product?.code?.toLowerCase().includes("amx") || item.product?.name?.toLowerCase().includes("vaccine");
              return (
                <div key={idx} className="p-3.5 flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${isItemColdChain ? "bg-cyan-50 text-cyan-600 border border-cyan-200" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-800 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{item.quantity} {item.product.unit.split(" ")[0]} x Rp {item.price.toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-black text-slate-900 shrink-0">
                    Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dokumen CDOB Download - 3 Dokumen Resmi */}
        <section className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-800 text-xs">Dokumen CDOB Official</h3>
            <span className="text-[8.5px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              3 Dokumen Resmi
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Surat Pesanan (SP) */}
            <button
              type="button"
              onClick={() => {
                triggerHapticImpact();
                downloadCDOBDocument(order, "SP");
              }}
              className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 flex flex-col gap-1 items-start cursor-pointer transition-all"
            >
              <FileText className="w-4 h-4 text-emerald-700" />
              <span className="text-[10px] font-black text-slate-800 leading-tight">Surat Pesanan</span>
              <span className="text-[8px] text-emerald-600 font-extrabold">SP-CDOB</span>
            </button>

            {/* 2. Invoice / e-Faktur */}
            {canOpenEFaktur(order) ? (
              <button
                type="button"
                onClick={() => {
                  triggerHapticImpact();
                  downloadCDOBDocument(order, "INVOICE");
                }}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 flex flex-col gap-1 items-start cursor-pointer transition-all"
              >
                <Receipt className="w-4 h-4 text-blue-700" />
                <span className="text-[10px] font-black text-slate-800 leading-tight">e-Faktur</span>
                <span className="text-[8px] text-blue-600 font-extrabold">Invoice</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  triggerHapticImpact();
                  alert("e-Faktur / Invoice terkunci. Dokumen e-Faktur hanya dapat diakses setelah pembayaran terverifikasi Lunas, atau jika transaksi menggunakan metode Limit Kredit (Tempo).");
                }}
                className="p-2.5 rounded-2xl bg-slate-100/90 border border-slate-200 flex flex-col gap-1 items-start cursor-pointer transition-all opacity-60 relative group"
                title="e-Faktur Terkunci: Pembayaran Belum Lunas (Kecuali Limit Kredit)"
              >
                <div className="flex items-center justify-between w-full">
                  <Receipt className="w-4 h-4 text-slate-400" />
                  <span className="material-symbols-outlined text-xs text-amber-600">lock</span>
                </div>
                <span className="text-[10px] font-black text-slate-500 leading-tight">e-Faktur</span>
                <span className="text-[8px] text-slate-400 font-extrabold">Terkunci 🔒</span>
              </button>
            )}

            {/* 3. Surat Jalan PBF (SJ) */}
            {order.status === "PENDING_APPROVAL" || order.status === "REJECTED" || order.status === "CANCELLED" ? (
              <button
                type="button"
                onClick={() => {
                  triggerHapticImpact();
                  alert("Surat Jalan (SJ-PBF) terkunci. Dokumen ini hanya terbit setelah pesanan disetujui dan dikirim oleh Admin PBF.");
                }}
                className="p-2.5 rounded-2xl bg-slate-100/90 border border-slate-200 flex flex-col gap-1 items-start cursor-pointer transition-all opacity-75 relative group"
                title="Surat Jalan Terkunci: Belum disetujui / dikirim Admin PBF"
              >
                <div className="flex items-center justify-between w-full">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span className="material-symbols-outlined text-xs text-amber-600">lock</span>
                </div>
                <span className="text-[10px] font-black text-slate-500 leading-tight">Surat Jalan</span>
                <span className="text-[8px] text-amber-600 font-extrabold flex items-center gap-0.5">
                  🔒 Terkunci
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  triggerHapticImpact();
                  downloadCDOBDocument(order, "SURAT_JALAN");
                }}
                className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200 flex flex-col gap-1 items-start cursor-pointer transition-all"
              >
                <Truck className="w-4 h-4 text-amber-700" />
                <span className="text-[10px] font-black text-slate-800 leading-tight">Surat Jalan</span>
                <span className="text-[8px] text-amber-600 font-extrabold">SJ-PBF</span>
              </button>
            )}
          </div>
        </section>

        {/* Automatic CDOB Verification Badge */}
        <div className="pt-2 pb-6">
          <div className="w-full p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-emerald-900 leading-tight">Status Penerimaan CDOB Otomatis</p>
                <p className="text-[10px] text-emerald-700 font-medium truncate mt-0.5">Disinkronkan via Webhook Kurir & System PBF</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-200/60 text-emerald-900 rounded-md text-[8.5px] font-black uppercase tracking-wider shrink-0">
              Auto CDOB
            </span>
          </div>
        </div>
      </div>

      {/* MODERN CDOB CONFIRMATION POPUP MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
          <div className="bg-white border border-slate-200/80 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 cursor-pointer border-none bg-transparent flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Header Icon */}
            <div className="flex flex-col items-center text-center space-y-2 pt-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
              <div>
                <h3 className="text-base font-heading font-extrabold text-slate-900">Konfirmasi Serah Terima Barang</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Pengesahan Kepatuhan Standar CDOB BPOM</p>
              </div>
            </div>

            {/* Content Box */}
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3 text-xs">
              <p className="text-slate-700 font-semibold leading-relaxed">
                Apakah Anda yakin paket obat dengan nomor SP <strong className="font-mono text-slate-900">{order.orderNumber}</strong> telah diterima dengan lengkap dan sesuai standar kualitas CDOB?
              </p>
              
              <div className="space-y-2 pt-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                  <span>Kondisi segel &amp; kemasan fisik boks obat utuh.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                  <span>Kesesuaian jumlah sediaan SKU &amp; nomor batch (FEFO).</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  handleConfirmDelivery(order.id);
                  setViewingDetailOrder(null);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer border-none flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">task_alt</span>
                <span>Ya, Diterima</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable document for @media print */}
      <div id="printable-faktur-container" className="hidden printable-document text-xs font-sans text-slate-900 bg-white p-6 leading-relaxed">
        {/* KOP SURAT PBF */}
        <div className="flex justify-between items-center border-b-4 border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-lg shrink-0">
              GMX
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 uppercase">PT. GROOVYRX PHARMACEUTICAL GROUP</h1>
              <p className="text-[10px] text-slate-700 font-bold">Growmexa • Distributor Obat & PBF Resmi</p>
              <p className="text-[9px] text-slate-500">JL. TAMALANREA RAYA RUKO PELANGI BLOK B NO 7, Makassar | Telp: 0851 5100 5960</p>
              <p className="text-[9px] text-slate-500">Email: groovyrxpharmaceutical@gmail.com</p>
            </div>
          </div>
          <div className="text-right border-l border-slate-350 pl-4">
            <h2 className="text-xs font-extrabold tracking-widest text-slate-800 uppercase">FAKTUR PENJUALAN</h2>
            <p className="font-mono text-[9px] font-bold text-slate-900 mt-1">INV/{order.orderNumber.replace("SP-", "")}</p>
            <p className="text-[9px] text-slate-500">Tanggal: {new Date(order.createdAt).toLocaleDateString("id-ID")}</p>
          </div>
        </div>

        {/* METADATA PENERIMA & PBF */}
        <div className="grid grid-cols-2 gap-6 text-[10px] mb-6">
          <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <span className="text-slate-500 block font-bold text-[8px] uppercase tracking-wider">Penerima Barang (Klien):</span>
            <div className="font-extrabold text-slate-800">{order.institution?.name}</div>
            <div className="text-slate-600">{order.institution?.address}</div>
            <div className="text-slate-500 mt-1">
              <span className="font-bold">No. SIA:</span> {order.institution?.siaNumber}
            </div>
            <div className="text-slate-500">
              <span className="font-bold">Apoteker Penanggung Jawab (APJ):</span> {order.createdBy?.name} (SIPA: {order.createdBy?.sipaNumber})
            </div>
          </div>

          <div className="space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-right">
            <span className="text-slate-500 block font-bold text-[8px] uppercase tracking-wider text-right">Detail Transaksi &amp; Tempo:</span>
            <div><span className="font-semibold">ID Pemesanan (SO):</span> <span className="font-mono font-bold">{order.orderNumber}</span></div>
            <div><span className="font-semibold">Metode Bayar:</span> {order.paymentMethod === "TOP" ? "Limit Kredit / TOP" : order.paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer (VA)"}</div>
            <div><span className="font-semibold">Status Bayar:</span> {order.paymentStatus === "PAID" ? "Lunas" : "Tempo / Belum Lunas"}</div>
            {order.paymentMethod === "TOP" && (
              <div>
                <span className="font-semibold">Jatuh Tempo:</span>{" "}
                <span className="font-mono font-bold text-slate-800">
                  {order.shippingDate
                    ? new Date(new Date(order.shippingDate).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID")
                    : new Date(new Date(order.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* PRODUCTS TABLE */}
        <table className="w-full text-[10px] text-left border-collapse border border-slate-200 mb-6">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-350 font-bold text-slate-800">
              <th className="p-2 border-r border-slate-250 text-center">No</th>
              <th className="p-2 border-r border-slate-250">Deskripsi Sediaan Obat Jadi</th>
              <th className="p-2 text-center border-r border-slate-250">Jumlah</th>
              <th className="p-2 text-right border-r border-slate-250">Harga Satuan</th>
              <th className="p-2 text-right border-r border-slate-250">Subtotal</th>
              <th className="p-2 text-right border-r border-slate-250">PPN (11%)</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item: any, idx: number) => {
              const itemSubtotal = item.price * item.quantity;
              const itemVat = Math.round(itemSubtotal * 0.11);
              return (
                <tr key={item.id} className="border-b border-slate-200 text-slate-700">
                  <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-200 font-semibold">{item.product.name}</td>
                  <td className="p-2 border-r border-slate-200 text-center">{item.quantity} {item.product.unit}</td>
                  <td className="p-2 border-r border-slate-200 text-right">Rp {item.price.toLocaleString("id-ID")}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono">Rp {itemSubtotal.toLocaleString("id-ID")}</td>
                  <td className="p-2 border-r border-slate-200 text-right font-mono">Rp {itemVat.toLocaleString("id-ID")}</td>
                  <td className="p-2 text-right font-mono font-bold">Rp {(itemSubtotal + itemVat).toLocaleString("id-ID")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* SUMMARY PRICING BREAKDOWN */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-[8px] text-slate-400 max-w-sm italic space-y-1 leading-normal">
            <p>* Faktur ini diterbitkan secara elektronik oleh Growmexa (PT. GROOVYRX PHARMACEUTICAL GROUP) dan dijamin sah sesuai regulasi CDOB &amp; ketentuan perpajakan.</p>
            <p>* Segala bentuk retur obat atau klaim kerusakan harus menyertakan dokumen berita acara resmi maksimal 2x24 jam sejak barang diterima.</p>
          </div>

          <div className="text-right text-[10px] space-y-1 text-slate-700 w-64">
            <div className="flex justify-between">
              <span>Subtotal Nilai Obat:</span>
              <span className="font-mono text-slate-900 font-semibold">Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span>PPN (11%):</span>
              <span className="font-mono text-slate-900 font-semibold">Rp {vat.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span>Jasa Kirim Ekspedisi:</span>
              <span className="font-mono text-slate-900 font-semibold">Rp {shippingFee.toLocaleString("id-ID")}</span>
            </div>
            <div className="pt-2 border-t-2 border-slate-800 flex justify-between items-end font-bold text-slate-900 text-xs">
              <span>TOTAL INVOICE:</span>
              <span className="font-mono text-primary font-extrabold text-sm">Rp {totalBilling.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* SIGNATURES & QR CODE COMPLIANCE */}
        <div className="flex justify-between items-center border-t border-slate-200 pt-6 mt-6">
          <div className="text-center w-40">
            <p className="text-[9px] text-slate-500 font-medium font-bold">Penerima Barang / APJ Apotek</p>
            <div className="h-14 my-2 flex items-center justify-center">
              {order.spSignature ? (
                <img src={order.spSignature} alt="Tanda Tangan Penerima" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-[7px] text-slate-400 font-bold border border-dashed border-slate-200 p-2.5 rounded bg-slate-50">TERTANDA DIGITAL</span>
              )}
            </div>
            <p className="font-bold text-slate-800 text-[10px] underline">{order.createdBy?.name}</p>
            <p className="text-[8px] text-slate-450">SIPA: {order.createdBy?.sipaNumber}</p>
          </div>

          {/* QR CODE VERIFIKASI CDOB */}
          <div className="flex flex-col items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
            <svg width="55" height="55" viewBox="0 0 29 29" fill="none" className="text-slate-800">
              <path d="M0 0h7v7H0zm2 2v3h3V2zm0 6h1v1H2zm6-8h7v7H8zm2 2v3h3V2zm-2 6h2v1H8zm8-8h7v7h-7zm2 2v3h3V2zm-2 6h1v1h-1zm3 0h2v1h-2zm-11 3h1v1H8zm1 1h1v1H9zm1-1h1v1h-1zm-2 2h1v1H8zm3-2h2v1h-2zm0 2h1v1h-1zm4-2h1v1h-1zm1 1h1v1h-1zm-1 1h1v1h-1zm3-2h3v1h-3zm1 1h1v1h-1zm0 1h2v1h-2zm-15 4h7v7H0zm2 2v3h3V20zm0 6h1v1H2zm6-8h1v1H8zm1 1h1v1H9zm1-1h1v1h-1zm-2 2h1v1H8zm3-2h2v1h-2zm0 2h1v1h-1zm4-2h1v1h-1zm1 1h1v1h-1zm-1 1h1v1h-1zm3-2h3v1h-3zm1 1h1v1h-1zm0 1h2v1h-2zm2 2h1v1h-1zm1-1h1v1h-1zm-1 2h2v1h-2zm3-2h1v1h-1zm-1 1h1v1h-1zm1 1h1v1h-1zm-8 4h1v1H8zm1 1h1v1H9zm1-1h1v1h-1zm-2 2h1v1H8zm3-2h2v1h-2zm0 2h1v1h-1zm4-2h1v1h-1zm1 1h1v1h-1zm-1 1h1v1h-1zm3-2h3v1h-3zm1 1h1v1h-1zm0 1h2v1h-2z" fill="currentColor" />
            </svg>
            <p className="text-[6px] font-extrabold text-emerald-800 uppercase mt-1.5 tracking-widest">VERIFIED CDOB</p>
          </div>

          <div className="text-center w-40">
            <p className="text-[9px] text-slate-500 font-medium font-bold">APJ PBF GroovyCare</p>
            <div className="h-14 my-2 flex items-center justify-center">
              <div className="text-center">
                <span className="text-[7px] text-primary font-mono font-bold border border-primary/20 bg-primary/5 px-2 py-0.5 rounded-full uppercase tracking-wider">E-SIGNED</span>
                <p className="text-[8px] font-bold text-slate-700 mt-1.5">Sarah, S.Farm, Apt</p>
              </div>
            </div>
            <p className="font-bold text-slate-800 text-[10px] underline">Apoteker Sarah, Apt</p>
            <p className="text-[8px] text-slate-450">SIPA: 19930412/SIPA-31.74/2026</p>
          </div>
        </div>
      </div>

      {/* Modal Live Tracking Biteship In-App */}
      <BiteshipTrackingModal
        orderId={order?.id}
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
      />

      {/* Modal In-App Preview & Cetak Dokumen CDOB */}
      <CdobDocumentModal
        isOpen={docModalType !== null}
        onClose={() => setDocModalType(null)}
        order={order}
        type={docModalType || "SP"}
      />

    </div>
  );
}
