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
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface/70 backdrop-blur-xl border-r border-outline-variant/30 shadow-sm flex flex-col py-6 z-50">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-on-primary-container">
          <span className="material-symbols-outlined font-bold">medical_services</span>
        </div>
        <div>
          <h1 className="font-heading font-extrabold text-lg text-primary leading-tight">
            {adminRole === "SYSTEM_ADMIN" ? "Super Admin" : "PBF Admin"}
          </h1>
          <p className="text-[10px] text-outline font-bold tracking-wider uppercase">
            {adminRole === "SYSTEM_ADMIN" ? "Sistem & Teknis" : "Pharma Distribution"}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {/* Tab: Overview */}
        <button
          onClick={() => setActiveTab("overview")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-sans text-sm font-bold cursor-pointer ${activeTab === "overview"
            ? "text-primary border-l-4 border-primary bg-primary-container/10"
            : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "overview" ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
          <span>Overview</span>
        </button>

        {/* Tab: Partnership */}
        <button
          onClick={() => setActiveTab("kemitraan")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-left font-sans text-sm font-bold cursor-pointer ${activeTab === "kemitraan"
            ? "text-primary border-l-4 border-primary bg-primary-container/10"
            : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">handshake</span>
            <span>Partnership</span>
          </div>
          {pendingPartnersCount > 0 && (
            <span className="bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-full text-[9px] animate-pulse">
              {pendingPartnersCount}
            </span>
          )}
        </button>

        {/* Tab: Inventory (FEFO) */}
        <button
          onClick={() => setActiveTab("obat")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-sans text-sm font-bold cursor-pointer ${activeTab === "obat"
            ? "text-primary border-l-4 border-primary bg-primary-container/10"
            : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
        >
          <span className="material-symbols-outlined">inventory_2</span>
          <span>Inventory (FEFO)</span>
        </button>

        {/* Tab: Order Approvals */}
        <button
          onClick={() => setActiveTab("cdob")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-left font-sans text-sm font-bold cursor-pointer ${activeTab === "cdob"
            ? "text-primary border-l-4 border-primary bg-primary-container/10"
            : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">fact_check</span>
            <span>Order Approvals</span>
          </div>
          {pendingApprovalsCount > 0 && (
            <span className="bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded-full text-[9px] animate-pulse">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        {/* Tab: Logistics */}
        <button
          onClick={() => setActiveTab("logistik")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-left font-sans text-sm font-bold cursor-pointer ${activeTab === "logistik"
            ? "text-primary border-l-4 border-primary bg-primary-container/10"
            : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">local_shipping</span>
            <span>Logistics</span>
          </div>
          {pendingLogisticsCount > 0 && (
            <span className="bg-red-500 text-white font-extrabold px-2 py-0.5 rounded-full text-[9px] animate-pulse">
              {pendingLogisticsCount}
            </span>
          )}
        </button>

        {/* Tab: Finance */}
        <button
          onClick={() => setActiveTab("pembayaran")}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-left font-sans text-sm font-bold cursor-pointer ${activeTab === "pembayaran"
            ? "text-primary border-l-4 border-primary bg-primary-container/10"
            : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">payments</span>
            <span>Finance</span>
          </div>
          {pendingPaymentsCount > 0 && (
            <span className="bg-primary text-white font-extrabold px-2 py-0.5 rounded-full text-[9px]">
              {pendingPaymentsCount}
            </span>
          )}
        </button>

        {/* Tab: History */}
        <button
          onClick={() => setActiveTab("riwayat")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-sans text-sm font-bold cursor-pointer ${activeTab === "riwayat"
            ? "text-primary border-l-4 border-primary bg-primary-container/10"
            : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
        >
          <span className="material-symbols-outlined">history</span>
          <span>Order History</span>
        </button>

        {/* Tab: E-Report BPOM */}
        <button
          onClick={() => setActiveTab("pelaporan")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-sans text-sm font-bold cursor-pointer ${activeTab === "pelaporan"
            ? "text-primary border-l-4 border-primary bg-primary-container/10"
            : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
            }`}
        >
          <span className="material-symbols-outlined">description</span>
          <span>E-Report BPOM</span>
        </button>

        {/* Tab: Super Admin (Only for SYSTEM_ADMIN) */}
        {adminRole === "SYSTEM_ADMIN" && (
          <button
            onClick={() => setActiveTab("superadmin")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-sans text-sm font-bold cursor-pointer ${activeTab === "superadmin"
              ? "text-primary border-l-4 border-primary bg-primary-container/10"
              : "text-on-surface-variant hover:bg-surface-container-high/50 hover:text-primary"
              }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "superadmin" ? "'FILL' 1" : "'FILL' 0" }}>admin_panel_settings</span>
            <span>Super Admin</span>
          </button>
        )}
      </nav>

      <div className="px-3 mt-auto pt-4 border-t border-outline-variant/20">
        <button
          onClick={handleLogout}
          className="w-full bg-primary/90 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md hover:bg-primary mb-6 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span className="text-xs">Keluar Admin</span>
        </button>
        <div className="space-y-1">
          <button
            onClick={() => {
              if (adminRole === "SYSTEM_ADMIN") {
                setActiveTab("superadmin");
              } else {
                alert("Pengaturan admin saat ini dikelola oleh super-admin.");
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-xs font-bold text-on-surface-variant hover:bg-surface-container-high/50 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>Settings</span>
          </button>
          <button
            onClick={() => alert("Hubungi IT support: tech@groovyrx.com")}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-xs font-bold text-on-surface-variant hover:bg-surface-container-high/50 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">help</span>
            <span>Support</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
