"use client";

import { useState } from "react";
import { X, Search, CheckCircle, Package, Scan, Snowflake, Truck, AlertTriangle, ShieldCheck } from "lucide-react";
import BiteshipTrackingModal from "@/app/components/BiteshipTrackingModal";
import { formatDisplayAddress } from "@/lib/address-parser";

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
  };
  createdBy: {
    name: string;
    sipaNumber: string | null;
    sipaExpiry: Date | null;
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
}

function getCourierName(addr?: string): string {
  if (!addr) return "Ekspedisi Reguler";
  const match = addr.match(/Kurir:\s*([^\s(|]+(?:\s+[^\s(|]+)?)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  if (addr.includes("groovyrx") || addr.includes("Logistik")) {
    return "Logistik Groovyrx";
  }
  return "Ekspedisi Reguler";
}

function getFullDisplayAddress(shippingAddress?: string, institutionAddress?: string): string {
  const primary = (shippingAddress || "").replace(/\|\s*Kurir:.*$/i, "").trim();
  const fallback = (institutionAddress || "").replace(/\|\s*Kurir:.*$/i, "").trim();

  // Combine primary street detail with fallback institutional address if primary lacks regional info
  const hasRegionalInfo = primary.includes("Kel/Desa:") || primary.includes("Kab/Kota:") || primary.includes("Provinsi:") || primary.includes("Kel.") || primary.includes("Kec.");
  const combined = hasRegionalInfo
    ? primary
    : fallback ? `${primary}, ${fallback.replace(/^Alamat:\s*/i, "")}` : primary;

  return formatDisplayAddress(combined);
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
}: LogisticsTabProps) {
  const pendingShipping = orders.filter((o) => o.status === "PENDING_SHIPPING");
  const shippedCount = orders.filter((o) => o.status === "SHIPPED").length;

  const [searchQuery, setSearchQuery] = useState("");
  const [trackingModalOrderId, setTrackingModalOrderId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkShipping, setIsBulkShipping] = useState(false);

  const filteredOrders = pendingShipping.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.institution.name.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="space-y-4 animate-fadeIn font-sans">
      {/* Slim Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 px-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="font-heading font-extrabold text-lg text-slate-900 leading-tight">
            Logistik &amp; Pengiriman PBF
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Pengepakan obat, scan barcode batch (FEFO), dan pembuatan resi pengiriman kurir.
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
        <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">Siap Packing</span>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 font-mono mt-0.5">{pendingShipping.length} <span className="text-xs font-bold text-slate-400 font-sans">Order</span></h3>
          </div>
        </div>

        <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">Sedang Dikirim</span>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 font-mono mt-0.5">{shippedCount} <span className="text-xs font-bold text-slate-400 font-sans">Order</span></h3>
          </div>
        </div>

        <div className="bg-white p-3.5 px-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 rounded-xl text-cyan-600 border border-cyan-100 shrink-0">
            <Snowflake className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block truncate">Cold Chain Storage</span>
            <h3 className="font-heading font-extrabold text-xl text-slate-900 font-mono mt-0.5">Live <span className="text-xs font-bold text-slate-400 font-sans">2-8°C</span></h3>
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

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-3.5 px-4 border-b border-slate-150 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Cari No. SP, Nama Apotek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-2xs"
              />
            </div>
          </div>

          {selectedOrderIds.length > 0 && (
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
                <th className="px-3 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                </th>
                <th className="px-4 py-3">No. SP</th>
                <th className="px-4 py-3">Mitra Apotek / Kurir</th>
                <th className="px-4 py-3">Alamat Pengiriman</th>
                <th className="px-4 py-3 text-center">Metode Bayar</th>
                <th className="px-5 py-3 text-right">Aksi Pengepakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    Tidak ada pesanan yang siap dikemas saat ini.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  const courier = getCourierName(order.shippingAddress);
                  const fullAddr = getFullDisplayAddress(order.shippingAddress, order.institution.address);

                  return (
                    <tr key={order.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-3 py-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono font-extrabold text-slate-900">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <span className="font-extrabold text-slate-900 text-xs block">{order.institution.name}</span>
                        <span className="text-[10px] text-emerald-800 font-bold font-sans">Kurir: {courier}</span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-slate-500 max-w-[240px] truncate" title={fullAddr}>
                        {fullAddr}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => startPacking(order)}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs active:scale-95 border-none inline-flex items-center gap-1"
                        >
                          <Scan className="w-3.5 h-3.5" />
                          <span>Mulai Packing &amp; Resi</span>
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

      {/* Biteship Live Tracking Modal */}
      <BiteshipTrackingModal
        orderId={trackingModalOrderId}
        isOpen={!!trackingModalOrderId}
        onClose={() => setTrackingModalOrderId(null)}
      />
    </div>
  );
}
