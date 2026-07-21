"use client";

import { useState } from "react";
import { X, Search, CheckCircle, Package, Scan, Snowflake, Truck, AlertTriangle } from "lucide-react";

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
  resiInput: string;
  setResiInput: (val: string) => void;
  handleShipOrder: () => void;
  startPacking: (order: Order) => void;
  onRejectOrder: (orderId: string, reason: string) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
}

export default function LogisticsTab({
  orders,
  activePackingOrder,
  setActivePackingOrder,
  scannedItems,
  simulateScanItem,
  resiInput,
  setResiInput,
  handleShipOrder,
  startPacking,
  onRejectOrder,
  onDeleteOrder,
}: LogisticsTabProps) {
  const pendingShipping = orders.filter((o) => o.status === "PENDING_SHIPPING");
  const shippedCount = orders.filter((o) => o.status === "SHIPPED").length;

  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = pendingShipping.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.institution.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn text-xs">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-on-surface">Distribusi &amp; Scan Packing</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1">Manajemen pengiriman farmasi dan validasi FEFO real-time.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-primary/20">
            <span className="material-symbols-outlined text-[16px] animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>thermostat</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Cold Chain Aman</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Siap Scan</p>
            <span className="material-symbols-outlined text-primary/45 text-lg">pending_actions</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-heading font-extrabold text-on-surface leading-tight font-mono">{pendingShipping.length}</h3>
            <p className="text-[9px] text-primary font-bold">SP Rilis</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Sedang Diproses</p>
            <span className="material-symbols-outlined text-secondary/45 text-lg">conveyor_belt</span>
          </div>
          <h3 className="text-2xl font-heading font-extrabold text-on-surface leading-tight font-mono">
            {activePackingOrder ? "01" : "00"}
          </h3>
          <div className="w-full bg-surface-container h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-secondary h-full rounded-full" style={{ width: activePackingOrder ? "45%" : "0%" }}></div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/10 group hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Siap Kirim</p>
            <span className="material-symbols-outlined text-primary-container/45 text-lg">local_shipping</span>
          </div>
          <h3 className="text-2xl font-heading font-extrabold text-on-surface leading-tight font-mono">{shippedCount}</h3>
          <p className="text-[9px] text-on-surface-variant italic font-semibold">Telah Berresi</p>
        </div>

        <div className="bg-primary p-4 rounded-2xl shadow-md border border-primary-fixed/20 relative overflow-hidden text-white">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Monitor Suhu</p>
              <Snowflake className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-2xl font-heading font-extrabold leading-none font-mono">4.2°C</h3>
            <p className="text-[9px] text-white/90 mt-1 font-bold">Optimal Cold Box: 2°C - 8°C</p>
          </div>
          <div className="absolute -right-2 -bottom-2 opacity-10">
            <span className="material-symbols-outlined text-[50px]">ac_unit</span>
          </div>
        </div>
      </div>

      {/* Main Panel: Split View */}
      <div className="flex flex-col xl:flex-row gap-6 min-h-[500px]">
        {/* Shipment Queue (Left column - 1.6 flex) */}
        <div className="flex-[1.6] bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-white">
            <h3 className="font-heading font-extrabold text-sm text-on-surface">Antrean Pengiriman</h3>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/75 w-3.5 h-3.5" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low border-none rounded-xl text-[10px] focus:ring-1 focus:ring-primary outline-none text-foreground"
                placeholder="Cari No. Order..."
                type="text"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-on-surface-variant font-semibold">
                Tidak ada antrean pengiriman logistik saat ini.
              </div>
            ) : (
              <table className="w-full text-left border-collapse table-auto">
                <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/20">
                  <tr>
                    <th className="px-5 py-3 w-28">No. Pesanan</th>
                    <th className="px-5 py-3">Tujuan Pengiriman</th>
                    <th className="px-5 py-3 text-center w-16">Item</th>
                    <th className="px-5 py-3 w-28">Metode</th>
                    <th className="px-5 py-3 w-36">Status Scan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                  {filteredOrders.map((order) => {
                    const isSelected = activePackingOrder?.id === order.id;
                    const isColdChain = order.items.some(
                      (item) =>
                        item.product.name.toLowerCase().includes("vaksin") ||
                        item.product.name.toLowerCase().includes("bcg") ||
                        item.product.name.toLowerCase().includes("inj")
                    );

                    // Scan percentage calculation
                    const totalNeeded = order.batchAllocations.reduce((sum, a) => sum + a.quantity, 0);
                    const totalScanned = order.batchAllocations.reduce((sum, a) => sum + (scannedItems[a.id] || 0), 0);
                    const progressPercent = totalNeeded > 0 ? Math.round((totalScanned / totalNeeded) * 100) : 0;

                    return (
                      <tr
                        key={order.id}
                        onClick={() => startPacking(order)}
                        className={`transition-colors cursor-pointer ${isSelected
                            ? "border-l-4 border-primary bg-primary-container/10 font-medium"
                            : "hover:bg-surface-container-low/50"
                          }`}
                      >
                        <td className="px-5 py-4 font-bold text-primary font-mono">{order.orderNumber}</td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-foreground">{order.institution.name}</p>
                          <p className="text-[10px] text-on-surface-variant truncate max-w-[180px]">{order.shippingAddress}</p>
                        </td>
                        <td className="px-5 py-4 text-center font-bold font-mono">
                          {order.items.reduce((sum, i) => sum + i.quantity, 0)}
                        </td>
                        <td className="px-5 py-4">
                          {isColdChain ? (
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5 w-fit border border-blue-200">
                              <Snowflake className="w-3 h-3 text-blue-700" />
                              Cold Chain
                            </span>
                          ) : (
                            <span className="bg-slate-50 text-on-surface-variant px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5 w-fit border border-slate-200">
                              <Truck className="w-3 h-3 text-slate-500" />
                              Reguler
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            <span className="font-bold font-mono text-[10px]">{progressPercent}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Packing Detail (Right column - 1.0 flex) */}
        <div className="flex-1 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col overflow-hidden relative">
          {activePackingOrder ? (
            <>
              {/* Cold Chain Alert Overlay */}
              {activePackingOrder.items.some(
                (item) =>
                  item.product.name.toLowerCase().includes("vaksin") ||
                  item.product.name.toLowerCase().includes("bcg") ||
                  item.product.name.toLowerCase().includes("inj")
              ) && (
                  <div className="absolute top-16 left-4 right-4 z-20 bg-rose-50 border border-error/30 p-3 rounded-xl flex items-start gap-3 shadow-lg">
                    <div className="bg-error text-white p-1 rounded-lg shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-error text-xs">Peringatan Rantai Dingin (Cold Chain)!</h4>
                      <p className="text-[9px] text-error/85 mt-0.5 font-medium">Sediaan ini sensitif suhu. Wajib langsung dimasukkan ke Cooler Box logistik.</p>
                    </div>
                  </div>
                )}

              <div className="px-6 py-4 border-b border-outline-variant/10 bg-white flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-heading font-extrabold text-sm text-on-surface">Detail Pengepakan</h3>
                    <span className="text-[9px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {activePackingOrder.orderNumber}
                    </span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {activePackingOrder.institution.name}
                  </p>
                </div>

                {/* Admin Actions: Batalkan / Hapus */}
                <div className="flex gap-1.5 ml-2">
                  <button
                    onClick={() => {
                      const reason = prompt("Masukkan alasan pembatalan pesanan (stok akan dikembalikan):");
                      if (reason !== null) {
                        onRejectOrder(activePackingOrder.id, reason || "Dibatalkan oleh Admin");
                      }
                    }}
                    title="Batalkan Pesanan (Kembalikan Stok)"
                    className="p-1.5 border border-error/30 text-error hover:bg-error/10 rounded-lg cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">block</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Apakah Anda yakin ingin menghapus pesanan ini secara permanen? Data alokasi stok dan tagihan kredit akan dikembalikan.")) {
                        onDeleteOrder(activePackingOrder.id);
                      }
                    }}
                    title="Hapus Pesanan Permanen"
                    className="p-1.5 border border-outline-variant text-on-surface-variant hover:bg-surface-variant/20 rounded-lg cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activePackingOrder.batchAllocations.map((alloc) => {
                  const totalScanned = scannedItems[alloc.id] || 0;
                  const isDone = totalScanned >= alloc.quantity;
                  const matchItem = activePackingOrder.items.find((it) => alloc.batch.productId && it.productId === alloc.batch.productId) || activePackingOrder.items[0];

                  const isCold = matchItem?.product.name.toLowerCase().includes("vaksin") ||
                    matchItem?.product.name.toLowerCase().includes("bcg") ||
                    matchItem?.product.name.toLowerCase().includes("inj");

                  return (
                    <div
                      key={alloc.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isDone
                          ? "border-primary/20 bg-primary/[0.03]"
                          : "border-outline-variant/20 hover:border-primary/50"
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDone ? "bg-emerald-50 text-primary" : "bg-surface-container text-on-surface-variant"
                        }`}>
                        <span className="material-symbols-outlined text-[18px]">
                          {isCold ? "vaccines" : "pill"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold leading-tight text-foreground">{matchItem ? matchItem.product.name : "Sediaan Obat"}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="font-mono text-[9px] text-on-surface-variant bg-surface-variant/40 px-1 py-0.25 rounded font-bold">
                            Batch: {alloc.batch.batchNumber}
                          </span>
                          {isDone ? (
                            <span className="text-[8px] bg-primary text-white px-1.5 py-0.25 rounded-full font-bold uppercase">FEFO VALID</span>
                          ) : isCold ? (
                            <span className="text-[8px] bg-blue-50 text-blue-700 px-1.5 py-0.25 rounded-full font-bold uppercase">COLD CHAIN</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold font-mono ${isDone ? "text-primary" : "text-foreground"}`}>
                          {totalScanned} / {alloc.quantity}
                        </p>
                        {isDone ? (
                          <CheckCircle className="w-4.5 h-4.5 text-primary ml-auto mt-0.5" />
                        ) : (
                          <button
                            onClick={() => simulateScanItem(alloc.id, alloc.quantity)}
                            className="mt-1 bg-primary text-white px-2 py-0.5 rounded text-[9px] font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-sm shadow-primary/10"
                          >
                            Scan Box
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Form Footer */}
              <div className="p-4 bg-surface-container-low border-t border-outline-variant/20">
                {activePackingOrder.batchAllocations.every((alloc) => (scannedItems[alloc.id] || 0) >= alloc.quantity) ? (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 flex items-start gap-2">
                      <CheckCircle className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                      <p className="text-[10px] text-primary font-bold">
                        Pengepakan Selesai! Seluruh batch FEFO telah valid ter-scan. Masukkan resi logistik di bawah untuk kirim obat.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={resiInput}
                        onChange={(e) => setResiInput(e.target.value)}
                        placeholder="Contoh: JNE-COLD-998822"
                        className="flex-1 px-3 py-2 bg-surface-container border border-outline-variant/30 rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary outline-none"
                      />
                      <button
                        onClick={handleShipOrder}
                        className="bg-primary text-white px-4 py-2 rounded-xl font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                      >
                        Kirim Obat
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-[10px] text-on-surface-variant font-bold italic">
                    *Pindai seluruh barcode batch obat di atas untuk menyelesaikan pengemasan.
                  </div>
                )}
                <p className="text-center text-[8px] text-on-surface-variant mt-2 uppercase tracking-wide font-black">Mode Simulasi Scan Aktif</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-on-surface-variant bg-surface-container-low/40">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">barcode_scanner</span>
              <h4 className="font-extrabold text-sm text-foreground">Detail Pengepakan Logistik</h4>
              <p className="max-w-xs text-[10px] text-on-surface-variant/80 mt-1 leading-relaxed">
                Pilih salah satu pesanan apotek di antrean sebelah kiri untuk memulai simulasi pemindaian barcode batch FEFO dan input nomor resi kurir.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
