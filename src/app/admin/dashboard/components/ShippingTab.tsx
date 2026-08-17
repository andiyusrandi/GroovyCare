"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  Receipt,
  Activity,
  KeyRound,
  Clock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  RotateCcw,
  Plus,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { updateBiteshipBaseBalance } from "@/app/actions/biteship";

interface ShippingTabProps {
  currentUserEmail?: string;
}

export default function ShippingTab({ currentUserEmail }: ShippingTabProps) {
  const isSuperAdminUser = currentUserEmail === "admin@growmexa.com";
  const [filter, setFilter] = useState<"today" | "7days" | "month" | "custom">("month");
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Top-Up States
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState<boolean>(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCreatingToken, setIsCreatingToken] = useState<boolean>(false);
  const [topUpHistory, setTopUpHistory] = useState<any[]>([]);
  const [loadingTopUpHistory, setLoadingTopUpHistory] = useState<boolean>(false);

  const [data, setData] = useState<{
    isConnected: boolean;
    statusLabel: string;
    apiKeyMasked: string;
    initialBalance: number;
    remainingBalance: number;
    remainingBalanceFormatted: string;
    totalRequests: number;
    totalAmount: number;
    logs: any[];
    lastSynced: string;
  }>({
    isConnected: false,
    statusLabel: "Offline",
    apiKeyMasked: "Tidak terpasang",
    initialBalance: 7575,
    remainingBalance: 7575,
    remainingBalanceFormatted: "Rp. 7,575",
    totalRequests: 0,
    totalAmount: 0,
    logs: [],
    lastSynced: "-",
  });

  const fetchTopUpHistory = async () => {
    setLoadingTopUpHistory(true);
    try {
      const { getTopUpRequests } = await import("@/app/actions/topup");
      const res = await getTopUpRequests();
      if (res.success && res.requests) {
        setTopUpHistory(res.requests);
      }
    } catch (e) {
      console.error("Error fetching topup history:", e);
    } finally {
      setLoadingTopUpHistory(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const url = `/api/biteship/transactions?filter=${filter}&startDate=${startDate}&endDate=${endDate}&t=${Date.now()}`;
      const response = await fetch(url, { cache: "no-store" });
      const res = await response.json();
      if (res.success) {
        setData({
          isConnected: res.isConnected ?? false,
          statusLabel: res.statusLabel || "Offline",
          apiKeyMasked: res.apiKeyMasked || "Tidak terpasang",
          initialBalance: res.initialBalance || 7575,
          remainingBalance: res.remainingBalance ?? 7575,
          remainingBalanceFormatted: res.remainingBalanceFormatted || "Rp. 7,575",
          totalRequests: res.totalRequests || 0,
          totalAmount: res.totalAmount || 0,
          logs: res.logs || [],
          lastSynced: res.lastSynced || "-",
        });
      }
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin mereset log data transaksi API Shipping? Tindakan ini akan mengosongkan riwayat panggilan API hari ini dan mengembalikan counter request serta saldo deposit ke kondisi semula."
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("/api/biteship/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const res = await response.json();
      if (res.success) {
        alert(res.message || "Data transaksi API berhasil direset.");
        await loadData();
      } else {
        alert(res.error || "Gagal mereset data transaksi API.");
      }
    } catch (err) {
      console.error("Error resetting transactions:", err);
      alert("Terjadi kesalahan saat mereset data.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdateSaldo = async () => {
    const inputStr = prompt("Masukkan nominal Saldo Deposit dasar baru (Contoh: 100000 atau 500000):", data.initialBalance.toString());
    if (inputStr === null) return;
    const num = parseInt(inputStr.replace(/[^0-9]/g, ""), 10);
    if (isNaN(num) || num < 0) {
      alert("Nominal Saldo Deposit tidak valid!");
      return;
    }

    setLoading(true);
    try {
      const res = await updateBiteshipBaseBalance(num);
      if (res.success) {
        alert(res.message);
        await loadData();
      } else {
        alert(res.error || "Gagal memperbarui Saldo Deposit");
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchTopUpHistory();

    // Load Midtrans Developer Snap Script (Auto-detect Production vs Sandbox)
    const clientKey = (process.env.NEXT_PUBLIC_MIDTRANS_DEV_CLIENT_KEY || "").trim();
    const isSandboxMode = clientKey.startsWith("SB-");
    const snapScriptUrl = isSandboxMode
      ? "https://app.sandbox.midtrans.com/snap/snap.js"
      : "https://app.midtrans.com/snap/snap.js";

    if (!document.querySelector(`script[src="${snapScriptUrl}"]`)) {
      const script = document.createElement("script");
      script.src = snapScriptUrl;
      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, [filter, startDate, endDate]);

  const handleProceedTopUp = async () => {
    const finalAmount = selectedAmount === 0 ? parseInt(customAmount.replace(/[^0-9]/g, ""), 10) : selectedAmount;
    if (!finalAmount || finalAmount < 10000) {
      alert("Nominal top-up minimal adalah Rp. 10.000");
      return;
    }

    setIsCreatingToken(true);
    try {
      const { createMidtransTopUpToken } = await import("@/app/actions/topup");
      const res = await createMidtransTopUpToken(finalAmount);
      if (res.success && res.snapToken) {
        setIsTopUpModalOpen(false);
        if ((window as any).snap) {
          (window as any).snap.pay(res.snapToken, {
            onSuccess: function (result: any) {
              alert("Pembayaran Midtrans Berhasil! Pengajuan top-up kini berstatus: MENUNGGU PERSETUJUAN DEVELOPER.");
              fetchTopUpHistory();
              loadData();
            },
            onPending: function (result: any) {
              alert("Transaksi Midtrans terbuat. Silakan selesaikan pembayaran Anda.");
              fetchTopUpHistory();
            },
            onError: function (result: any) {
              alert("Pembayaran Midtrans gagal atau dibatalkan.");
              fetchTopUpHistory();
            },
            onClose: function () {
              fetchTopUpHistory();
            }
          });
        } else if (res.redirectUrl) {
          alert("Membuka halaman pembayaran Midtrans...");
          window.open(res.redirectUrl, "_blank");
        }
      } else {
        alert("Gagal membuat transaksi top-up: " + res.error);
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setIsCreatingToken(false);
    }
  };

  // Filter logs by search query
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return data.logs;
    const q = searchQuery.toLowerCase().trim();
    return data.logs.filter(
      (item) =>
        item.date.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q) ||
        item.amountFormatted.toLowerCase().includes(q)
    );
  }, [data.logs, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 bg-white p-5 rounded-2xl border shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Informasi Transaksi API Shipping
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Biteship Live Sync
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau kuota panggilan API logistik, saldo deposit aktif, dan log pemotongan biaya transaksi.
          </p>
        </div>

        {/* Action Header: Refresh & Reset */}
        <div className="flex items-center gap-2">
          {isSuperAdminUser && (
            <button
              type="button"
              onClick={handleResetData}
              disabled={isResetting || loading}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
              title="Reset seluruh log transaksi API (Khusus admin@growmexa.com)"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`} />
              <span>Reset Log</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              loadData();
              fetchTopUpHistory();
            }}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* 2. STAT METRICS GRID (5-CARDS BALANCED) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Saldo Deposit (Primary Accent) */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 p-4 text-white shadow-sm flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200">Saldo Deposit</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsTopUpModalOpen(true)}
                className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Top-Up Saldo Deposit API Shipping via Midtrans"
              >
                <Plus className="w-3 h-3" />
                <span>Top-Up</span>
              </button>
              {isSuperAdminUser && (
                <button
                  type="button"
                  onClick={handleUpdateSaldo}
                  className="text-[10px] bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-1.5 py-0.5 rounded-lg border border-emerald-500/50 font-bold transition cursor-pointer"
                  title="Perbarui Saldo Deposit Dasar (Khusus admin@growmexa.com)"
                >
                  Set
                </button>
              )}
            </div>
          </div>
          <div className="my-2">
            <h3 className="text-2xl font-extrabold tracking-tight font-mono">
              {loading ? "..." : data.remainingBalanceFormatted}
            </h3>
          </div>
          <span className="text-[10px] text-emerald-300">Potong otomatis / req</span>
        </div>

        {/* Card 2: Total Biaya Terpakai */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Biaya</span>
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Receipt className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <div className="my-2">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
              {loading ? "..." : `Rp ${data.totalAmount.toLocaleString("id-ID")}`}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">Akumulasi terpakai</span>
        </div>

        {/* Card 3: Total Request */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Request</span>
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="my-2">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
              {loading ? "..." : data.totalRequests}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">Panggilan API total</span>
        </div>

        {/* Card 4: Status API Key */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status Key</span>
            <div className="p-1.5 bg-teal-50 rounded-lg">
              <KeyRound className="h-4 w-4 text-teal-600" />
            </div>
          </div>
          <div className="my-1">
            <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {loading ? "..." : data.statusLabel}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Terhubung</span>
        </div>

        {/* Card 5: Terakhir Disinkron */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sinkronisasi</span>
            <div className="p-1.5 bg-slate-50 rounded-lg">
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-sm font-bold text-slate-800 font-mono truncate">
              {loading ? "..." : data.lastSynced}
            </p>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Realtime Webhook</span>
        </div>
      </div>

      {/* 3. INFO STRUKTUR TARIF (COMPACT STRIP) */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Struktur Biaya API:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-lg bg-white px-2.5 py-1 border border-slate-200 text-slate-600 shadow-2xs">
            <strong>Rates Check:</strong> Rp 10/req
          </span>
          <span className="rounded-lg bg-white px-2.5 py-1 border border-slate-200 text-slate-600 shadow-2xs">
            <strong>Tracking GPS:</strong> Rp 20/req
          </span>
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 border border-emerald-200 font-semibold text-emerald-800 shadow-2xs">
            <strong>Order API:</strong> Bebas Biaya Request (Potong Ongkir Pesanan)
          </span>
        </div>
      </div>

      {/* 4. FILTER & SEARCH CONTROL BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Date Presets Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setFilter("today")}
              className={`rounded-lg px-3 py-1.5 transition ${filter === "today" ? "bg-white font-bold text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setFilter("7days")}
              className={`rounded-lg px-3 py-1.5 transition ${filter === "7days" ? "bg-white font-bold text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setFilter("month")}
              className={`rounded-lg px-3 py-1.5 transition ${filter === "month" ? "bg-white font-bold text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setFilter("custom")}
              className={`rounded-lg px-3 py-1.5 transition ${filter === "custom" ? "bg-white font-bold text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Kustom
            </button>
          </div>

          {/* Custom Date Pickers */}
          {filter === "custom" && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="outline-none text-slate-700 font-mono"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="outline-none text-slate-700 font-mono"
              />
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari endpoint, order ID, atau tipe request..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* 5. RIWAYAT PENGAJUAN TOP-UP SALDO */}
      {topUpHistory.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">Riwayat Pengajuan Top-Up Saldo API Shipping</h2>
            </div>
            <span className="text-xs text-slate-400">{topUpHistory.length} Transaksi Top-Up</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3 w-[140px]">No. TopUp</th>
                  <th className="px-5 py-3 w-[130px]">Nominal</th>
                  <th className="px-5 py-3 w-[200px]">Status Pembayaran &amp; Approval</th>
                  <th className="px-5 py-3 w-[160px]">Pengaju</th>
                  <th className="px-5 py-3 w-[140px]">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {topUpHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {item.topUpNumber}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-black text-emerald-700">
                      Rp. {item.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.paymentStatus === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-500" /> Disetujui (Saldo Bertambah)
                        </span>
                      )}
                      {item.paymentStatus === "PAID_WAITING_APPROVAL" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                          <AlertCircle className="w-3 h-3 text-amber-600" /> Lunas Midtrans (Menunggu Approval Dev)
                        </span>
                      )}
                      {item.paymentStatus === "PENDING_PAYMENT" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Clock className="w-3 h-3 text-slate-500" /> Menunggu Pembayaran Midtrans
                        </span>
                      )}
                      {item.paymentStatus === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-500" /> {item.rejectionReason || "Ditolak"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {item.requestedBy?.name || item.requestedBy?.email || "PBF Admin"}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500 text-[11px]">
                      {new Date(item.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. DATA LOG TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Log Panggilan API Terbaru</h2>
          <span className="text-xs text-slate-400">
            Menampilkan {filteredLogs.length} dari {data.logs.length} data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3 text-center w-[70px]">#</th>
                <th className="px-5 py-3 w-[130px]">Waktu &amp; Tanggal</th>
                <th className="px-5 py-3 text-center w-[120px]">Total Request</th>
                <th className="px-5 py-3 w-[130px]">Biaya</th>
                <th className="px-5 py-3 min-w-[220px]">Detail Penggunaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Memuat data transaksi API Biteship...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                    Tidak ada log transaksi API untuk periode ini.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((row) => (
                  <tr key={row.index} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 text-center font-bold text-slate-400 w-[70px]">
                      {row.index}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-800 font-bold w-[130px]">
                      {row.date}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono font-extrabold text-blue-700 w-[120px]">
                      {row.totalRequests}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-extrabold text-emerald-700 w-[130px]">
                      {row.amountFormatted}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 min-w-[220px]">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800 text-[11px] font-bold border border-slate-200">
                        <span>{row.details}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TOP-UP SALDO API SHIPPING (MIDTRANS) */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 space-y-0">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-700/60 rounded-xl border border-emerald-500/30">
                  <CreditCard className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Top-Up Saldo API Shipping</h3>
                  <p className="text-[11px] text-emerald-200">Bebas komisi &amp; Pembayaran via Midtrans Snap</p>
                </div>
              </div>
              <button
                onClick={() => setIsTopUpModalOpen(false)}
                className="text-emerald-300 hover:text-white text-xl font-bold p-1 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2">
                  Pilih Nominal Top-Up:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[50000, 100000, 500000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount("");
                      }}
                      className={`p-3 rounded-2xl border text-sm font-extrabold font-mono transition text-center cursor-pointer ${selectedAmount === amt
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                    >
                      Rp {amt.toLocaleString("id-ID")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Atau Nominal Lainnya (Rp):
                </label>
                <input
                  type="text"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(0);
                  }}
                  placeholder="Masukkan nominal custom..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 font-sans space-y-1">
                <div className="font-extrabold flex items-center gap-1 text-amber-900">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Catatan Persetujuan Logistik:</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Saldo deposit akan resmi ditambahkan setelah proses verifikasi dan persetujuan oleh Pihak Logistik (estimasi 1x24 jam).
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTopUpModalOpen(false)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-extrabold text-xs rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProceedTopUp}
                disabled={isCreatingToken}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isCreatingToken ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses Midtrans...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Lanjutkan Pembayaran</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
