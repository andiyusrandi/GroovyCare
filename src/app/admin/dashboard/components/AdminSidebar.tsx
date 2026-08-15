"use client";

interface AdminSidebarProps {
  activeTab: "overview" | "kemitraan" | "obat" | "cdob" | "logistik" | "pembayaran" | "riwayat" | "pelaporan" | "superadmin";
  setActiveTab: (tab: "overview" | "kemitraan" | "obat" | "cdob" | "logistik" | "pembayaran" | "riwayat" | "pelaporan" | "superadmin") => void;
  pendingApprovalsCount: number;
  pendingPaymentsCount: number;
  pendingLogisticsCount: number;
  pendingPartnersCount: number;
  handleLogout: () => void;
  adminRole: string;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  pendingPaymentsCount,
  pendingLogisticsCount,
  pendingPartnersCount,
  handleLogout,
  adminRole,
}: AdminSidebarProps) {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface/80 backdrop-blur-xl border-r border-outline-variant/30 shadow-sm flex flex-col py-6 z-50">
      {/* Brand Header */}
      <div className="px-6 mb-6 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-on-primary-container shadow-xs">
          <span className="material-symbols-outlined font-bold text-xl">medical_services</span>
        </div>
        <div className="min-w-0">
          <h1 className="font-heading font-extrabold text-base text-primary leading-tight truncate">
            {adminRole === "SYSTEM_ADMIN" ? "Super Admin" : "PBF Admin"}
          </h1>
          <p className="text-[10px] text-outline font-bold tracking-wider uppercase truncate">
            {adminRole === "SYSTEM_ADMIN" ? "Sistem & Teknis" : "Distribusi Farmasi"}
          </p>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 space-y-5 overflow-y-auto">
        {/* SECTION: UTAMA */}
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Utama
          </p>
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left font-sans text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === "overview"
                ? "text-primary border-l-4 border-primary bg-primary-container/15 shadow-2xs"
                : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined text-[20px] shrink-0"
              style={{ fontVariationSettings: activeTab === "overview" ? "'FILL' 1" : "'FILL' 0" }}
            >
              dashboard
            </span>
            <span className="truncate">Ikhtisar</span>
          </button>
        </div>

        {/* SECTION: OPERASIONAL PBF */}
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Operasional PBF
          </p>
          
          {/* Tab: Pesanan Aktif (Live Orders) */}
          <button
            onClick={() => setActiveTab("cdob")}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 text-left font-sans text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === "cdob"
                ? "text-primary border-l-4 border-primary bg-primary-container/15 shadow-2xs"
                : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-[20px] shrink-0">fact_check</span>
              <span className="truncate">Pesanan Aktif (Live)</span>
            </div>
            {pendingApprovalsCount > 0 && (
              <span className="bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded-full text-[9px] animate-pulse shrink-0 ml-2">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {/* Tab: Inventori (FEFO) */}
          <button
            onClick={() => setActiveTab("obat")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left font-sans text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === "obat"
                ? "text-primary border-l-4 border-primary bg-primary-container/15 shadow-2xs"
                : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">inventory_2</span>
            <span className="truncate">Inventori (FEFO)</span>
          </button>

          {/* Tab: Logistik */}
          <button
            onClick={() => setActiveTab("logistik")}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 text-left font-sans text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === "logistik"
                ? "text-primary border-l-4 border-primary bg-primary-container/15 shadow-2xs"
                : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-[20px] shrink-0">local_shipping</span>
              <span className="truncate">Logistik & Pengiriman</span>
            </div>
            {pendingLogisticsCount > 0 && (
              <span className="bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-full text-[9px] animate-pulse shrink-0 ml-2">
                {pendingLogisticsCount}
              </span>
            )}
          </button>

          {/* Tab: Kemitraan */}
          <button
            onClick={() => setActiveTab("kemitraan")}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 text-left font-sans text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === "kemitraan"
                ? "text-primary border-l-4 border-primary bg-primary-container/15 shadow-2xs"
                : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-[20px] shrink-0">handshake</span>
              <span className="truncate">Kemitraan</span>
            </div>
            {pendingPartnersCount > 0 && (
              <span className="bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-full text-[9px] animate-pulse shrink-0 ml-2">
                {pendingPartnersCount}
              </span>
            )}
          </button>
        </div>

        {/* SECTION: KEUANGAN & LAPORAN */}
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Keuangan & Laporan
          </p>

          {/* Tab: Keuangan */}
          <button
            onClick={() => setActiveTab("pembayaran")}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 text-left font-sans text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === "pembayaran"
                ? "text-primary border-l-4 border-primary bg-primary-container/15 shadow-2xs"
                : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="material-symbols-outlined text-[20px] shrink-0">payments</span>
              <span className="truncate">Keuangan</span>
            </div>
            {pendingPaymentsCount > 0 && (
              <span className="bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded-full text-[9px] shrink-0 ml-2 animate-pulse shadow-2xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                {pendingPaymentsCount}
              </span>
            )}
          </button>

          {/* Tab: Riwayat & Arsip Pesanan */}
          <button
            onClick={() => setActiveTab("riwayat")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left font-sans text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === "riwayat"
                ? "text-primary border-l-4 border-primary bg-primary-container/15 shadow-2xs"
                : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">history</span>
            <span className="truncate">Riwayat & Arsip Pesanan</span>
          </button>

          {/* Tab: E-Report BPOM */}
          <button
            onClick={() => setActiveTab("pelaporan")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left font-sans text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === "pelaporan"
                ? "text-primary border-l-4 border-primary bg-primary-container/15 shadow-2xs"
                : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">description</span>
            <span className="truncate">E-Report BPOM</span>
          </button>
        </div>

        {/* SECTION: SISTEM */}
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Sistem
          </p>

          {adminRole === "SYSTEM_ADMIN" && (
            <button
              onClick={() => setActiveTab("superadmin")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-left font-sans text-xs font-bold whitespace-nowrap cursor-pointer ${
                activeTab === "superadmin"
                  ? "text-primary border-l-4 border-primary bg-primary-container/15 shadow-2xs"
                  : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px] shrink-0"
                style={{ fontVariationSettings: activeTab === "superadmin" ? "'FILL' 1" : "'FILL' 0" }}
              >
                admin_panel_settings
              </span>
              <span className="truncate">Super Admin</span>
            </button>
          )}

          <button
            onClick={() => {
              if (adminRole === "SYSTEM_ADMIN") {
                setActiveTab("superadmin");
              } else {
                alert("Pengaturan admin saat ini dikelola oleh super-admin.");
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-bold text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary transition-colors whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">settings</span>
            <span className="truncate">Pengaturan</span>
          </button>

          <button
            onClick={() => alert("Hubungi IT support: tech@groovyrx.com")}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-bold text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary transition-colors whitespace-nowrap cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">help</span>
            <span className="truncate">Bantuan</span>
          </button>
        </div>
      </nav>

      {/* Footer / Logout Section */}
      <div className="px-3 pt-3 mt-auto border-t border-outline-variant/20 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
          <span className="truncate">Keluar Admin</span>
        </button>
      </div>
    </aside>
  );
}
