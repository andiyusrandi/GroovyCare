"use client";

import { useState } from "react";
import { X, Search, CheckCircle, CheckCircle2, Package, Scan, Snowflake, Truck, AlertTriangle, ShieldCheck, Eye, ExternalLink, Printer, Copy, Check } from "lucide-react";
import BiteshipTrackingModal from "@/app/components/BiteshipTrackingModal";
import ShippingDetailModal from "./ShippingDetailModal";
import { formatDisplayAddress } from "@/lib/address-parser";
import { getBiteshipStatusMeta, formatWaybillNumber } from "@/lib/biteship-status";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    unit: string;
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

interface LogisticsTabProps {
  orders: Order[];
  activePackingOrder: Order | null;
  setActivePackingOrder: (order: Order | null) => void;
  scannedItems: Record<string, number>;
  simulateScanItem: (allocId: string, neededQty: number) => void;
  autoScanAllItems?: () => void;
  resiInput: string;
  setResiInput: (val: string) => void;
  handleShipOrder: () => void;
  onBulkShipOrders?: (orderIds: string[]) => Promise<void>;
  startPacking: (order: Order) => void;
  onRejectOrder: (orderId: string, reason: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onMarkDelivered?: (orderId: string) => Promise<void>;
}

function getCourierName(addr?: string): string {
  if (!addr) return "Ekspedisi Reguler";
  const match = addr.match(/Kurir:\s*([^\n|[\]]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  if (addr.includes("groovyrx") || addr.includes("Logistik")) {
    return "Logistik Internal PBF";
  }
  return "Ekspedisi Reguler";
}

function getFullDisplayAddress(shippingAddress?: string, institutionAddress?: string): string {
  const primary = (shippingAddress || "").replace(/\|\s*Kurir:.*$/i, "").trim();
  const fallback = (institutionAddress || "").replace(/\|\s*Kurir:.*$/i, "").trim();

  const hasRegionalInfo = primary.includes("Kel/Desa:") || primary.includes("Kab/Kota:") || primary.includes("Provinsi:") || primary.includes("Kel.") || primary.includes("Kec.");
  const combined = hasRegionalInfo
    ? primary
    : fallback ? `${primary}, ${fallback.replace(/^Alamat:\s*/i, "")}` : primary;

  return formatDisplayAddress(combined);
}

function parseTwoLineAddress(shippingAddress?: string, institutionAddress?: string): { line1: string; line2: string } {
  const full = getFullDisplayAddress(shippingAddress, institutionAddress);
  const parts = full.split(",").map((s) => s.trim()).filter(Boolean);

  if (parts.length <= 2) {
    return { line1: full, line2: "" };
  }

  const splitIdx = Math.max(1, Math.min(2, parts.length - 2));
  const line1 = parts.slice(0, splitIdx).join(", ");
  const line2 = parts.slice(splitIdx).join(", ");

  return { line1: line1 || full, line2 };
}

export default function LogisticsTab({
  orders,
  activePackingOrder,
  setActivePackingOrder,
  scannedItems,
  simulateScanItem,
  autoScanAllItems,
  resiInput,
  setResiInput,
  handleShipOrder,
  onBulkShipOrders,
  startPacking,
  onRejectOrder,
  onDeleteOrder,
  onMarkDelivered,
}: LogisticsTabProps) {
  const [subTab, setSubTab] = useState<"ready" | "in_transit" | "finished">("ready");
  const [searchQuery, setSearchQuery] = useState("");
  const [trackingModalOrderId, setTrackingModalOrderId] = useState<string | null>(null);
  const [viewingDetailOrder, setViewingDetailOrder] = useState<Order | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkShipping, setIsBulkShipping] = useState(false);
  const [isShippingSingle, setIsShippingSingle] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper check for finished order statuses (DELIVERED, CANCELLED, REJECTED, RETURNED, DISPOSED, etc.)
  const isOrderFinished = (o: Order): boolean => {
    const st = (o.status || "").toUpperCase();
    const bs = ((o as any).biteshipStatus || "").toLowerCase();
    return (
      st === "DELIVERED" ||
      st === "CANCELLED" ||
      st === "REJECTED" ||
      bs === "delivered" ||
      bs === "cancelled" ||
      bs === "rejected" ||
      bs === "returned" ||
      bs === "disposed" ||
      bs === "courier_not_found"
    );
  };

  // 1. Ready to Pack orders (PENDING_SHIPPING)
  const readyToPackOrders = orders.filter((o) => o.status === "PENDING_SHIPPING");

  // 2. Active shipping orders in transit (SHIPPED but not finished)
  const inTransitOrders = orders.filter(
    (o) =>
      (o.status === "SHIPPED" ||
        (o as any).biteshipStatus === "in_transit" ||
        (o as any).biteshipStatus === "picking_up" ||
        (o as any).biteshipStatus === "dropping_off" ||
        (o as any).biteshipStatus === "allocated" ||
        (o as any).biteshipStatus === "confirmed") &&
      !isOrderFinished(o)
  );

  // 3. Finished / Cancelled orders (DELIVERED, CANCELLED, REJECTED, etc.)
  const finishedOrders = orders.filter((o) => isOrderFinished(o));

  const currentList =
    subTab === "ready"
      ? readyToPackOrders
      : subTab === "in_transit"
      ? inTransitOrders
      : finishedOrders;

  const filteredOrders = currentList.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.institution.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isAllSelected = filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExecuteBulkShip = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin memproses & buat resi otomatis untuk ${selectedOrderIds.length} pesanan ini sekaligus?`)) return;

    setIsBulkShipping(true);
    try {
      if (onBulkShipOrders) {
        await onBulkShipOrders(selectedOrderIds);
      } else {
        alert("Fitur bulk ship tidak didukung pada versi ini.");
      }
      setSelectedOrderIds([]);
    } catch (e: any) {
      alert("Gagal memproses pengiriman masal: " + e.message);
    } finally {
      setIsBulkShipping(false);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn font-sans pb-12">
      {/* Slim Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 px-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="font-heading font-extrabold text-lg text-slate-900 leading-tight">
            Logistik &amp; Pengiriman PBF
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Pengepakan obat, scan barcode batch (FEFO), dan pemantauan order aktif yang sedang dikirim.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-xl border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Biteship Logistik Integrated</span>
          </span>
        </div>
      </div>

      {/* Compact KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div
          onClick={() => setSubTab("ready")}
          className={`p-3.5 px-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
            subTab === "ready"
              ? "bg-blue-50/70 border-blue-300 shadow-xs ring-2 ring-blue-500/20"
              : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-xs shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">
              Siap Dikemas (Ready to Pack)
            </span>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 font-mono mt-0.5">
              {readyToPackOrders.length} <span className="text-xs font-bold text-slate-400 font-sans">Order</span>
            </h3>
          </div>
        </div>

        <div
          onClick={() => setSubTab("in_transit")}
          className={`p-3.5 px-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
            subTab === "in_transit"
              ? "bg-emerald-50/70 border-emerald-300 shadow-xs ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">
              Sedang Dikirim (In Transit)
            </span>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 font-mono mt-0.5">
              {inTransitOrders.length} <span className="text-xs font-bold text-slate-400 font-sans">Order</span>
            </h3>
          </div>
        </div>

        <div
          onClick={() => setSubTab("finished")}
          className={`p-3.5 px-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
            subTab === "finished"
              ? "bg-indigo-50/70 border-indigo-300 shadow-xs ring-2 ring-indigo-500/20"
              : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">
              Selesai &amp; Dibatalkan
            </span>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 font-mono mt-0.5">
              {finishedOrders.length} <span className="text-xs font-bold text-slate-400 font-sans">Order</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 border border-purple-100 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">Kepatuhan CDOB</span>
            <h3 className="font-heading font-extrabold text-sm text-emerald-700 mt-0.5">100% Valid</h3>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex border-b border-slate-200 gap-2 bg-white px-4 pt-3 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setSubTab("ready")}
          className={`pb-3 px-4 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            subTab === "ready"
              ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Siap Dikemas (Ready to Pack)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-mono">
            {readyToPackOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("in_transit")}
          className={`pb-3 px-4 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            subTab === "in_transit"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Sedang Dikirim (In Transit)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
            {inTransitOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("finished")}
          className={`pb-3 px-4 text-xs font-extrabold transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            subTab === "finished"
              ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Selesai &amp; Dibatalkan (Delivered / Cancelled)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-mono">
            {finishedOrders.length}
          </span>
        </button>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-3.5 px-4 border-b border-slate-150 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Cari No. SP, Nama Apotek, No. Resi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-2xs"
              />
            </div>
          </div>

          {subTab === "ready" && selectedOrderIds.length > 0 && (
            <button
              type="button"
              onClick={handleExecuteBulkShip}
              disabled={isBulkShipping}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer border-none flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>{isBulkShipping ? "Memproses..." : `Proses Resi Massal (${selectedOrderIds.length})`}</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">
                {subTab === "ready" && (
                  <th className="px-3 py-3 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                  </th>
                )}
                <th className="px-4 py-3">No. SP / Order ID</th>
                <th className="px-4 py-3">Mitra Apotek &amp; Kurir</th>
                <th className="px-4 py-3">Alamat Pengiriman</th>
                <th className="px-4 py-3 text-center">Status / Waybill</th>
                <th className="px-5 py-3 text-right">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    {subTab === "ready"
                      ? "Tidak ada pesanan yang siap dikemas saat ini."
                      : subTab === "in_transit"
                      ? "Belum ada pesanan aktif yang sedang dalam proses pengiriman kurir."
                      : "Belum ada pesanan yang selesai atau dibatalkan."}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  const courier = getCourierName(order.shippingAddress);
                  const fullAddr = getFullDisplayAddress(order.shippingAddress, order.institution.address);
                  const waybill = formatWaybillNumber(order.trackingNumber, (order as any).biteshipOrderId, order.id);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {subTab === "ready" && (
                        <td className="px-3 py-3.5 text-center w-10 align-middle">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOrder(order.id)}
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                          />
                        </td>
                      )}

                      {/* 1. No. SP & ID Pesanan */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingDetailOrder(order)}
                            className="font-mono font-bold text-slate-900 hover:text-emerald-700 transition cursor-pointer border-none bg-transparent p-0"
                            title="Lihat Detail Pesanan & Dokumen SP"
                          >
                            {order.orderNumber}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyText(order.orderNumber, `sp-${order.id}`)}
                            className="text-slate-400 hover:text-slate-600 transition border-none bg-transparent cursor-pointer p-0"
                            title="Salin No. SP"
                          >
                            {copiedId === `sp-${order.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          ID: {order.id.substring(0, 8)}...
                        </span>
                      </td>

                      {/* 2. Tujuan & Kurir */}
                      <td className="px-4 py-3.5 align-middle">
                        <div className="font-bold text-slate-900 text-xs">{order.institution.name}</div>
                        <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <span>{courier}</span>
                        </div>
                      </td>

                      {/* 3. Alamat Penerima & Kontak */}
                      <td className="px-4 py-3.5 align-middle max-w-[260px]">
                        {(() => {
                          const { line1, line2 } = parseTwoLineAddress(order.shippingAddress, order.institution.address);
                          const phone = order.institution.phone || (order as any).createdBy?.phone || "";
                          return (
                            <div>
                              <p className="text-[11px] font-medium text-slate-800 truncate" title={line1}>
                                {line1}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5" title={line2}>
                                {line2 || "Alamat Sarana Mitra"} {phone && <>• <span className="font-mono text-slate-500">{phone}</span></>}
                              </p>
                            </div>
                          );
                        })()}
                      </td>

                      {/* 4. Status Pengiriman & Resi */}
                      <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap">
                        {subTab === "ready" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                            Siap Packing
                          </span>
                        ) : (
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                              {getBiteshipStatusMeta((order as any).biteshipStatus, order.status).label}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600">
                              <span className="font-bold">{waybill}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(waybill, `resi-${order.id}`)}
                                className="text-slate-400 hover:text-slate-600 transition border-none bg-transparent cursor-pointer p-0"
                                title="Salin No. Resi"
                              >
                                {copiedId === `resi-${order.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                              {!(order as any).biteshipOrderId ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  Manual
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  API
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 5. Aksi Kompak */}
                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Square Icon-Only Ghost Button: Detail */}
                          <button
                            type="button"
                            onClick={() => setViewingDetailOrder(order)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer bg-white"
                            title="Lihat Detail Pesanan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {subTab === "ready" ? (
                            <button
                              type="button"
                              onClick={() => startPacking(order)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition inline-flex items-center gap-1 cursor-pointer border-none"
                            >
                              <Scan className="w-3.5 h-3.5" />
                              <span>Packing</span>
                            </button>
                          ) : !(order as any).biteshipOrderId ? (
                            /* Resi Manual: Primary Selesaikan */
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Tandai pesanan ${order.orderNumber} (Resi Manual) sebagai Selesai / Terkirim (Diterima Mitra Apotek)?`)) {
                                  await onMarkDelivered?.(order.id);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition inline-flex items-center gap-1 cursor-pointer border-none"
                              title="Tandai pesanan diterima mitra"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Selesaikan</span>
                            </button>
                          ) : (
                            /* Auto Biteship API: Primary Lacak */
                            <button
                              type="button"
                              onClick={() => setTrackingModalOrderId(order.id)}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition inline-flex items-center gap-1 cursor-pointer border-none"
                              title="Lacak Kurir Real-Time"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Lacak</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Shipping Detail Modal */}
      <ShippingDetailModal
        order={viewingDetailOrder}
        isOpen={!!viewingDetailOrder}
        onClose={() => setViewingDetailOrder(null)}
        onOpenTrackingModal={(orderId) => {
          setViewingDetailOrder(null);
          setTrackingModalOrderId(orderId);
        }}
        onMarkDelivered={onMarkDelivered}
        onShipmentCancelled={() => {
          setViewingDetailOrder(null);
        }}
      />

      {/* Biteship Live Tracking Modal */}
      <BiteshipTrackingModal
        orderId={trackingModalOrderId}
        isOpen={!!trackingModalOrderId}
        onClose={() => setTrackingModalOrderId(null)}
      />

      {/* Modal Pengepakan Obat & Pembuatan Resi Per-Order */}
      {activePackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-base text-white leading-tight">
                    Pengepakan Obat &amp; Terbit Resi
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    No. SP: <span className="text-emerald-400 font-mono font-bold">{activePackingOrder.orderNumber}</span> • {activePackingOrder.institution.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePackingOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Info Alamat & Kurir */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                    Tujuan Pengiriman &amp; Ekspedisi
                  </span>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                    {activePackingOrder.institution.name}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                    {getFullDisplayAddress(activePackingOrder.shippingAddress, activePackingOrder.institution.address)}
                  </p>
                </div>
                <div className="shrink-0 bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-2xs text-right">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Layanan Kurir</span>
                  <span className="text-xs font-extrabold text-emerald-700">
                    {getCourierName(activePackingOrder.shippingAddress)}
                  </span>
                </div>
              </div>

              {/* List Batch Obat FEFO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Verifikasi Scan Batch FEFO Sediaan</span>
                  </h4>
                  {autoScanAllItems && (
                    <button
                      type="button"
                      onClick={autoScanAllItems}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[11px] rounded-lg border border-emerald-200 transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>1-Click Auto Scan Semua</span>
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-150">
                  {activePackingOrder.batchAllocations.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Tidak ada data batch FEFO khusus yang dialokasikan.
                    </div>
                  ) : (
                    activePackingOrder.batchAllocations.map((alloc) => {
                      const scannedQty = scannedItems[alloc.id] || 0;
                      const isFullyScanned = scannedQty >= alloc.quantity;

                      return (
                        <div key={alloc.id} className="p-3.5 px-4 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-colors">
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 block">
                              Batch: <span className="font-mono text-emerald-700">{alloc.batch.batchNumber}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block">
                              Kadaluarsa (ED): {new Date(alloc.batch.expiryDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-slate-700">
                              {scannedQty} / {alloc.quantity} Unit
                            </span>
                            {isFullyScanned ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg flex items-center gap-1 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Lengkap</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => simulateScanItem(alloc.id, alloc.quantity)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                              >
                                + Scan Barcode
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Pilihan Metode Pengiriman & Input Resi Fisik Manual */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Metode Pengiriman &amp; Penerbitan Resi</span>
                  </label>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 w-fit">
                    Pilihan Mitra: {getCourierName(activePackingOrder.shippingAddress)}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        🚚 Input Nomor Resi Fisik Struk Konter / Armada PBF
                      </span>
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        Bypass Biteship API
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Serahkan paket fisik ke konter kurir (JNE/SiCepat/J&amp;T/Logistik PBF), catat nomor resi pada struk, lalu ketikkan di bawah ini:
                    </p>
                    <input
                      type="text"
                      placeholder="Contoh: JNE88910237 / JNT7781920 / RESI-PBF-001"
                      value={resiInput}
                      onChange={(e) => setResiInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-extrabold text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                    <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Nomor resi fisik ini akan langsung tampil di Portal Mitra &amp; terlampir di email konfirmasi.</span>
                    </p>
                  </div>

                  <div className="p-2.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 font-medium">
                    ⚡ <strong>Tips Auto-Booking Biteship:</strong> Jika field resi di atas <u>dikosongkan</u>, sistem akan otomatis melakukan booking kurir via API Biteship dan menerbitkan AWB digital secara otomatis.
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActivePackingOrder(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsShippingSingle(true);
                  try {
                    await handleShipOrder();
                  } finally {
                    setIsShippingSingle(false);
                  }
                }}
                disabled={isShippingSingle}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer border-none flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Truck className="w-4 h-4" />
                <span>{isShippingSingle ? "Memproses Resi..." : "Proses & Terbitkan Resi"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
