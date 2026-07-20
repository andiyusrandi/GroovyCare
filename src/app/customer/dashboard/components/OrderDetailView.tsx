"use client";

import { useState } from "react";
import { printCDOBDocument } from "@/lib/pdf-generator";

interface OrderDetailViewProps {
  order: any;
  setViewingDetailOrder: (order: any) => void;
  setViewingFaktur: (order: any) => void;
  handleConfirmDelivery: (orderId: string) => void;
  setCancelingOrder?: (order: any) => void;
}

export default function OrderDetailView({
  order,
  setViewingDetailOrder,
  setViewingFaktur,
  handleConfirmDelivery,
  setCancelingOrder,
}: OrderDetailViewProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
            <button
              onClick={() => printCDOBDocument(order, "INVOICE")}
              className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant/40 hover:bg-surface-container-low text-on-surface rounded-xl transition-colors text-xs font-bold shadow-sm cursor-pointer bg-white"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Cetak Invoice CDOB (PDF)
            </button>
            <button
              onClick={() => alert("Silakan hubungi tim IT PBF Online untuk bantuan sistem.")}
              className="flex items-center gap-1.5 px-4 py-2 border border-outline-variant/40 hover:bg-surface-container-low text-on-surface rounded-xl transition-colors text-xs font-bold shadow-sm cursor-pointer bg-white"
            >
              <span className="material-symbols-outlined text-[16px]">help</span>
              Bantuan
            </button>
            {order.status === "PENDING_APPROVAL" && setCancelingOrder && (
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
                <p className="font-heading font-bold text-sm text-on-surface">
                  {order.paymentMethod === "VA"
                    ? "Bank Transfer (VA)"
                    : order.paymentMethod === "TOP"
                      ? "Limit Kredit / TOP"
                      : order.paymentMethod === "COD"
                        ? "Cash on Delivery (COD)"
                        : "Invoice Billing"}
                </p>
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
                      Pesanan sedang dikirim kurir internal. Resi: <strong className="font-mono text-primary">{order.trackingNumber || "PBF-LOG-88219"}</strong>
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
                    onClick={() => printCDOBDocument(order, "SP")}
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
                  {!isPendingApproval && !isRejected ? (
                    <button
                      type="button"
                      onClick={() => printCDOBDocument(order, "INVOICE")}
                      className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-none bg-transparent flex items-center p-1"
                      title="Download Invoice"
                    >
                      <span className="material-symbols-outlined text-primary text-[18px]">download</span>
                    </button>
                  ) : (
                    <span className="text-[9px] text-on-surface-variant/40 italic font-medium">Belum terbit</span>
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
                      onClick={() => printCDOBDocument(order, "SURAT_JALAN")}
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
      {/* 2. MOBILE VIEW: Live Tracking Delivery Page                               */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-6 px-1 pb-10">
        {/* Status Overview Card */}
        <section className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Status Pengiriman</span>
            <span className={`px-3 py-1 rounded-full text-[9px] font-bold ${isDelivered
                ? "bg-[#ecfdf5] text-[#10b981]"
                : isShipped
                  ? "bg-[#ecfdf5] text-[#10b981] animate-pulse"
                  : "bg-orange-50 text-orange-600"
              }`}>
              {isDelivered ? "Selesai" : isShipped ? "Sedang Dikirim" : isRejected ? "Ditolak" : "Diproses PBF"}
            </span>
          </div>
          <p className="font-heading font-black text-sm text-primary">
            {isDelivered
              ? "Paket Telah Tiba"
              : isShipped
                ? "Estimasi Tiba: 14:20 WIB"
                : "Sedang Diproses di Gudang"}
          </p>
          <p className="text-[10px] text-on-surface-variant font-medium mt-1">
            {isDelivered
              ? "Pesanan obat telah diterima dan ditandatangani oleh APJ."
              : isShipped
                ? "Driver sedang dalam perjalanan menuju lokasi apotek Anda."
                : "Pesanan Anda sedang diverifikasi standar FEFO oleh petugas gudang."}
          </p>
        </section>

        {/* Visual Stepper */}
        <section className="px-2">
          <div className="relative">
            {/* Progress Line Background */}
            <div className="absolute top-3 left-[12.5%] right-[12.5%] h-0.5 bg-surface-container-highest z-0" />

            {/* Progress Line Active */}
            <div
              className="absolute top-3 left-[12.5%] h-0.5 bg-primary z-0 transition-all duration-500"
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
              {/* Step 1: Diproses */}
              <div className="flex flex-col items-center w-1/4">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center mb-2 shadow-sm text-white">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
                <span className="text-[9px] font-bold text-on-surface-variant">Diproses</span>
              </div>

              {/* Step 2: Dikemas */}
              <div className="flex flex-col items-center w-1/4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-2 shadow-sm text-white ${isPendingShipping || isShipped || isDelivered ? "bg-primary" : "bg-surface-container-highest text-on-surface-variant/40"
                  }`}>
                  {isPendingShipping || isShipped || isDelivered ? (
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  ) : (
                    <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                  )}
                </div>
                <span className="text-[9px] font-bold text-on-surface-variant">Dikemas</span>
              </div>

              {/* Step 3: Dikirim */}
              <div className="flex flex-col items-center w-1/4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-2 shadow-sm text-white ${isDelivered
                    ? "bg-primary"
                    : isShipped
                      ? "border-2 border-primary bg-white relative text-primary"
                      : "bg-surface-container-highest text-on-surface-variant/40"
                  }`}>
                  {isDelivered ? (
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  ) : isShipped ? (
                    <span className="material-symbols-outlined text-[12px] animate-pulse">local_shipping</span>
                  ) : (
                    <span className="material-symbols-outlined text-[12px]">local_shipping</span>
                  )}
                </div>
                <span className={`text-[9px] font-bold ${isShipped ? "text-primary font-black" : "text-on-surface-variant"}`}>Dikirim</span>
              </div>

              {/* Step 4: Selesai */}
              <div className="flex flex-col items-center w-1/4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-2 shadow-sm text-white ${isDelivered ? "bg-primary" : "bg-surface-container-highest text-on-surface-variant/40"
                  }`}>
                  {isDelivered ? (
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                  ) : (
                    <span className="material-symbols-outlined text-[12px]">task_alt</span>
                  )}
                </div>
                <span className={`text-[9px] font-bold ${isDelivered ? "text-primary font-black" : "text-outline"}`}>Selesai</span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Tracking Map (Hanya jika SHIPPED atau DELIVERED) */}
        {(isShipped || isDelivered) && (
          <section className="relative h-64 w-full rounded-2xl overflow-hidden shadow-md group border border-outline-variant/20">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida/AP1WRLtz66vjIfz4RDN8Ug3hIUZbFY_WHUjXsWT2ZbzSrAEm8tFExVqysC_srhLJzpeJDPcN8Kfv73ns5mvjqQ50D7B5oQFiBUcCdnMcMfXu_75qvfEB7BC4tGZh8gRezmV40I9LfcbW2CgF5HToYHtFSYLZMyvEWX8AYpkJeAfKE9kONeGDW1EJpkTuFZQKNho7F_k-bxzX3golEIXrchQqBPx8JDlj5qUkjKXhOx2M2ERFPTTo5eGO5kt4TSE')" }}
            ></div>

            {/* Glass Overlay Info */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl flex items-center gap-3 border border-white/40 shadow-lg">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-base">local_shipping</span>
              </div>
              <div>
                <p className="font-heading font-black text-xs text-primary">Posisi Terkini</p>
                <p className="text-[10px] text-on-surface-variant font-bold">Jl. Gatot Subroto, Jakarta Selatan</p>
              </div>
            </div>

            {/* Floating Marker Animation */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <div className="absolute -inset-1 bg-primary/20 rounded-full animate-ping"></div>
              </div>
            </div>
          </section>
        )}

        {/* Courier Section (Hanya jika SHIPPED atau DELIVERED) */}
        {(isShipped || isDelivered) && (
          <section className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/20">
                <img
                  className="w-full h-full object-cover"
                  alt="Edi Santoso"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtJ3Cyu3h50NHLSCr7nHtnD4m-UDxcpCr-kxXiIB6hcWLhrcgzSrG9_fZf5xqIdJz0f_8uYABM8Vydu1ZAdAbODBknAmRpoU3wD0Si_Gr3iFJanRcOxaTGQB16qw2PNa1-2lbDK6CIZJOfhT9cWXB3POlTpjwhaqzHuPjKpkyae1A5epgrmdGS7-ZAW9-RqsUeoJAYIxcjVQ9XOVyxhr9pwyyzdkEn1oXGXvNqpgtB0cATd-84MtLBAMTYkGI8qCfTntUw5bmL1Ok"
                />
              </div>
              <div>
                <h3 className="font-heading font-black text-xs">Edi Santoso</h3>
                <p className="text-[9px] text-on-surface-variant font-bold">Kurir Internal PBF</p>
              </div>
            </div>
            <button
              onClick={() => alert("Menghubungi Kurir Edi Santoso (+62 812-9988-7766) via Whatsapp...")}
              className="flex items-center gap-1 bg-primary text-white px-3.5 py-1.5 rounded-full font-bold text-[9px] hover:opacity-90 active:scale-95 transition-all border-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">phone</span>
              Hubungi
            </button>
          </section>
        )}

        {/* Shipment Logistics Info */}
        <section className="space-y-3">
          <h2 className="font-heading font-black text-xs text-on-surface px-1">Informasi Logistik</h2>
          <div className="bg-white rounded-2xl border border-outline-variant/30 divide-y divide-outline-variant/15 overflow-hidden shadow-sm text-xs font-bold">
            <div className="p-4 flex flex-col gap-1">
              <span className="text-[9px] text-on-surface-variant uppercase font-bold">No. Resi / Tracking</span>
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm text-foreground">{order.trackingNumber || "PBF-LOG-88219"}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.trackingNumber || "PBF-LOG-88219");
                    alert("No. Resi disalin!");
                  }}
                  className="material-symbols-outlined text-primary text-[18px] border-none bg-transparent cursor-pointer"
                >
                  content_copy
                </button>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-1">
              <span className="text-[9px] text-on-surface-variant uppercase font-bold">Layanan</span>
              <span className="text-xs text-foreground flex items-center gap-2">
                {isColdChain ? "Reguler (Cold-Chain)" : "Reguler (Standard)"}
                <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded text-[8px] font-black uppercase">Verified</span>
              </span>
            </div>

            <div className="p-4 flex flex-col gap-1">
              <span className="text-[9px] text-on-surface-variant uppercase font-bold">Alamat Tujuan</span>
              <span className="text-xs text-foreground">{order.institution?.name || "Apotek Mitra"}</span>
              <span className="text-[10px] text-on-surface-variant font-medium leading-relaxed mt-0.5">
                {order.shippingAddress || "Jl. Sudirman No. 12, Senayan, Jakarta Pusat"}
              </span>
            </div>
          </div>
        </section>

        {/* Items in Shipment */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="font-heading font-black text-xs text-on-surface">Daftar Barang ({order.items.length})</h2>
          </div>
          <div className="space-y-2.5">
            {order.items.map((item: any, idx: number) => {
              const isItemColdChain = item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain" || item.product?.name?.toLowerCase().includes("insulin") || item.product?.code?.toLowerCase().includes("amx") || item.product?.name?.toLowerCase().includes("vaccine");
              return (
                <div key={idx} className="bg-white p-3.5 rounded-2xl border border-outline-variant/30 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isItemColdChain ? "bg-tertiary-container/20 text-tertiary" : "bg-surface-container-high text-on-surface-variant"
                      }`}>
                      <span className="material-symbols-outlined text-base">
                        {isItemColdChain ? "ac_unit" : "pill"}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-foreground leading-snug">{item.product.name}</p>
                        {isItemColdChain && (
                          <span className="bg-[#fff1f2] text-[#f43f5e] px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">Cold Chain</span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{item.quantity} {item.product.unit.split(" ")[0]}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline-variant text-base">chevron_right</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Delivery Timeline */}
        <section className="space-y-3">
          <h2 className="font-heading font-black text-xs text-on-surface px-1">Riwayat Pengiriman</h2>
          <div className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm text-xs font-bold">
            <div className="space-y-6">
              <div className="flex gap-4 relative">
                <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2.5px] bg-outline-variant/20"></div>
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10 text-white shadow-sm shrink-0">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <p className="text-[10px] text-primary font-black">10:15 WIB</p>
                  <p className="text-[11px] text-foreground font-bold mt-0.5">Paket telah keluar dari gudang (Hub Jakarta)</p>
                  <p className="text-[9px] text-on-surface-variant font-medium mt-0.5">Petugas: Bambang S.</p>
                </div>
              </div>

              <div className="flex gap-4 relative">
                <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2.5px] bg-outline-variant/20"></div>
                <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center z-10 text-outline-variant shadow-sm shrink-0">
                  <div className="w-2 h-2 bg-outline-variant rounded-full"></div>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant font-bold">09:00 WIB</p>
                  <p className="text-[11px] text-on-surface-variant font-bold mt-0.5">Paket telah dikemas dan diverifikasi</p>
                </div>
              </div>

              <div className="flex gap-4 relative">
                <div className="w-6 h-6 rounded-full bg-surface-container-highest flex items-center justify-center z-10 text-outline-variant shadow-sm shrink-0">
                  <div className="w-2 h-2 bg-outline-variant rounded-full"></div>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant font-bold">08:30 WIB</p>
                  <p className="text-[11px] text-on-surface-variant font-bold mt-0.5">Pesanan dikonfirmasi oleh sistem PBF</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Button: Konfirmasi Penerimaan */}
        {isShipped && (
          <div className="pt-4 pb-6 px-1">
            <button 
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all border-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">task_alt</span>
              <span>Konfirmasi Terima Barang (CDOB)</span>
            </button>
          </div>
        )}
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
              PhN
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 uppercase">PT PharmaDist Farmasi Nusantara</h1>
              <p className="text-[10px] text-slate-600 mt-0.5">Pedagang Besar Farmasi (PBF) Indonesia</p>
              <p className="text-[9px] text-slate-500 font-medium">Izin PBF: FK.01.01/PBF/1089/2026 | NPWP: 01.234.567.8-092.000</p>
              <p className="text-[9px] text-slate-500">Jl. Industri Farmasi No. 45, Kawasan Industri Jababeka, Bekasi | Telp: (021) 8984-5678</p>
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
            <p>* Faktur ini diterbitkan secara elektronik oleh PBF PharmaDist Nusantara dan dijamin sah sesuai regulasi CDOB &amp; ketentuan perpajakan Dirjen Pajak.</p>
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

    </div>
  );
}
