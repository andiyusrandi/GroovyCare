"use client";

import { useEffect, useState, useCallback } from "react";
import { getBiteshipLiveTracking } from "@/app/actions/orders";
import { getBiteshipStatusMeta } from "@/lib/biteship-status";

interface BiteshipTrackingModalProps {
  orderId: string | null;
  orderNumber?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BiteshipTrackingModal({
  orderId,
  orderNumber,
  isOpen,
  onClose,
}: BiteshipTrackingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchTracking = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getBiteshipLiveTracking(orderId);
      if (res.success && res.tracking) {
        setTrackingData(res.tracking);
        setLastRefreshed(new Date());
      } else {
        setError(res.error || "Gagal memuat status pelacakan");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat data pelacakan");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Initial fetch and 30-second interval auto-refresh
  useEffect(() => {
    if (isOpen && orderId) {
      fetchTracking();

      const timer = setInterval(() => {
        fetchTracking();
      }, 30000); // 30 detik auto-refresh

      return () => clearInterval(timer);
    }
  }, [isOpen, orderId, fetchTracking]);

  if (!isOpen || !orderId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="bg-white border border-slate-200/80 rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 relative animate-in zoom-in-95 duration-200 text-xs max-h-[92vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-lg text-slate-900 font-mono">
                {trackingData?.orderNumber || orderNumber || "Pelacakan Pesanan"}
              </span>
              <span className="bg-blue-50 text-blue-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-blue-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px] animate-pulse">radar</span> Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Lacak posisi barang & rantai dingin (cold chain) real-time in-app
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-400 cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && !trackingData && (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 font-medium">Menghubungkan ke API Biteship...</p>
          </div>
        )}

        {/* Error State */}
        {error && !trackingData && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="material-symbols-outlined text-[18px]">error</span>
              Gagal Memuat Pelacakan
            </div>
            <p className="text-xs">{error}</p>
            <button
              type="button"
              onClick={fetchTracking}
              className="mt-2 px-3 py-1.5 bg-rose-600 text-white rounded-xl font-bold cursor-pointer hover:bg-rose-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Tracking Main Content */}
        {trackingData && (
          <div className="space-y-5">
            {/* Resi & Driver Info Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200/60 pb-3 font-mono">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Nomor Resi / Waybill</p>
                  <p className="font-extrabold text-slate-900 text-sm">{trackingData.waybillId}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Kurir Expedisi</p>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase text-[10px]">
                    {trackingData.courier?.company}
                  </span>
                </div>
              </div>

              {/* Driver Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px]">
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-bold">Driver / Penjemput</p>
                  <p className="font-bold text-slate-800 truncate">{trackingData.courier?.driverName || "Driver Biteship"}</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100">
                  <p className="text-slate-400 font-bold">No. Kontak Driver</p>
                  <p className="font-bold text-slate-800 font-mono">{trackingData.courier?.driverPhone || "-"}</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-100 col-span-2 md:col-span-1">
                  <p className="text-slate-400 font-bold">Plat Nomor Kendaraan</p>
                  <p className="font-bold text-slate-800 font-mono">{trackingData.courier?.driverPlateNumber || "-"}</p>
                </div>
              </div>
            </div>

            {/* Stepper Timeline Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Riwayat Perjalanan (Tracking History)
                </h4>
                <span className="text-[9px] text-slate-400">
                  Auto-Refresh: <strong className="text-emerald-600">Aktif (30s)</strong>
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 max-h-[48vh] sm:max-h-[320px] overflow-y-auto space-y-4">
                {trackingData.history && trackingData.history.length > 0 ? (
                  trackingData.history.map((step: any, idx: number) => {
                    const isLatest = idx === trackingData.history.length - 1 || idx === 0;
                    const statusMeta = getBiteshipStatusMeta(step.status || step.code || step.label);
                    return (
                      <div key={idx} className="flex gap-3 relative group">
                        {/* Vertical Connecting Line */}
                        {idx !== trackingData.history.length - 1 && (
                          <div className="absolute left-[13px] top-6 bottom-0 w-0.5 bg-slate-200" />
                        )}

                        {/* Status Icon Indicator */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 z-10 ${isLatest
                              ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                            }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">{statusMeta.iconName || step.icon || "schedule"}</span>
                        </div>

                        {/* Status Details */}
                        <div className="flex-1 pb-3">
                          <div className="flex flex-wrap justify-between items-baseline gap-1">
                            <span className={`font-black text-xs ${isLatest ? "text-emerald-700" : "text-slate-800"}`}>
                              {step.label || statusMeta.label}
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-mono">
                              {new Date(step.updatedAt || Date.now()).toLocaleString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })} WIB
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-sans font-medium">
                            {step.note || statusMeta.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-slate-400 italic">
                    Belum ada riwayat pergerakan yang terekam dari Biteship.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <span className="text-[9px] text-slate-400">
                {lastRefreshed ? `Terakhir diperbarui: ${lastRefreshed.toLocaleTimeString("id-ID")}` : ""}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchTracking}
                  disabled={loading}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border-none"
                >
                  <span className={`material-symbols-outlined text-[14px] ${loading ? "animate-spin" : ""}`}>
                    refresh
                  </span>
                  <span>{loading ? "Menyinkronkan..." : "Refresh Tracking"}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-colors cursor-pointer border-none"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
