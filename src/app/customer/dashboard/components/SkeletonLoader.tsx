"use client";

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans pb-12">
      {/* 1. Header Banner Skeleton (Profil & Sisa Limit Kredit) */}
      <div className="rounded-2xl bg-slate-200/80 p-6 h-28 w-full flex items-center justify-between shadow-2xs border border-slate-200/60">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-300/80 shrink-0"></div>
          <div className="space-y-2">
            <div className="h-6 bg-slate-300/90 rounded-md w-48"></div>
            <div className="h-3.5 bg-slate-300/60 rounded-md w-36"></div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="h-10 bg-slate-300/70 rounded-xl w-32"></div>
        </div>
      </div>

      {/* 2. Kartu Statistik Ringkasan (3 KPI Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 h-28 space-y-3 shadow-2xs">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-200 rounded w-24"></div>
            <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
          </div>
          <div className="h-7 bg-slate-300 rounded w-36"></div>
          <div className="h-2 bg-slate-150 rounded-full w-full mt-2"></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 h-28 space-y-3 shadow-2xs">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-200 rounded w-24"></div>
            <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
          </div>
          <div className="h-7 bg-slate-300 rounded w-32"></div>
          <div className="h-2 bg-slate-150 rounded-full w-3/4 mt-2"></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 h-28 space-y-3 shadow-2xs">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-200 rounded w-24"></div>
            <div className="w-8 h-8 bg-slate-100 rounded-lg"></div>
          </div>
          <div className="h-7 bg-slate-300 rounded w-28"></div>
          <div className="h-2 bg-slate-150 rounded-full w-1/2 mt-2"></div>
        </div>
      </div>

      {/* 3. Grafik Analitik & Proporsi Pembelian (Charts Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grafik Batang (Bar Chart Spending) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/60 space-y-4 shadow-2xs">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-slate-200 rounded w-44"></div>
            <div className="h-3 bg-slate-150 rounded w-20"></div>
          </div>
          <div className="h-44 bg-slate-50 rounded-xl p-4 flex items-end justify-between gap-3">
            <div className="w-full bg-slate-200 rounded-t-md h-24"></div>
            <div className="w-full bg-slate-200 rounded-t-md h-36"></div>
            <div className="w-full bg-slate-200 rounded-t-md h-16"></div>
            <div className="w-full bg-slate-300 rounded-t-md h-40"></div>
            <div className="w-full bg-slate-200 rounded-t-md h-28"></div>
            <div className="w-full bg-slate-200 rounded-t-md h-32"></div>
          </div>
        </div>

        {/* Grafik Donut (Proporsi Pembelian Sediaan) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/60 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="h-4 bg-slate-200 rounded w-36"></div>
          <div className="flex justify-center items-center py-2">
            <div className="w-28 h-28 rounded-full border-8 border-slate-200 border-t-emerald-300 animate-spin"></div>
          </div>
          <div className="space-y-2 pt-1">
            <div className="h-3 bg-slate-150 rounded w-full"></div>
            <div className="h-3 bg-slate-150 rounded w-4/5"></div>
          </div>
        </div>
      </div>

      {/* 4. Tabel "Pesanan Terbaru" (Recent Orders Row Shimmers) */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-4 shadow-2xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="h-4 bg-slate-200 rounded w-36"></div>
          <div className="h-3 bg-slate-150 rounded w-20"></div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between h-12 border-b border-slate-100 px-2 last:border-none">
            <div className="space-y-1">
              <div className="h-3.5 bg-slate-200 rounded w-28"></div>
              <div className="h-2.5 bg-slate-150 rounded w-16"></div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-24"></div>
            <div className="h-5 bg-slate-200 rounded-full w-20"></div>
            <div className="h-7 bg-slate-200 rounded-lg w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductCatalogSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      {/* Search & Filter Bar Shimmer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 flex flex-col md:flex-row gap-4 justify-between shadow-2xs">
        <div className="h-10 bg-slate-200 rounded-xl w-full md:w-80"></div>
        <div className="flex gap-2">
          <div className="h-10 bg-slate-200 rounded-xl w-32"></div>
          <div className="h-10 bg-slate-200 rounded-xl w-32"></div>
        </div>
      </div>

      {/* Chips Bar Shimmer */}
      <div className="flex gap-2 overflow-hidden py-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 bg-slate-200 rounded-full w-24 shrink-0"></div>
        ))}
      </div>

      {/* Product Grid / Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 space-y-3 shadow-2xs">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center h-14 border-b border-slate-100 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
              <div className="space-y-1.5">
                <div className="h-4 bg-slate-200 rounded w-36"></div>
                <div className="h-3 bg-slate-150 rounded w-24"></div>
              </div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-20"></div>
            <div className="h-8 bg-slate-200 rounded-xl w-28"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PurchaseHistorySkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      {/* Title & Filter Bar Shimmer */}
      <div className="space-y-2">
        <div className="h-6 bg-slate-200 rounded w-48"></div>
        <div className="h-4 bg-slate-150 rounded w-72"></div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 flex flex-wrap gap-3 shadow-2xs">
        <div className="h-9 bg-slate-200 rounded-xl w-48"></div>
        <div className="h-9 bg-slate-200 rounded-xl w-36"></div>
        <div className="h-9 bg-slate-200 rounded-xl w-36"></div>
        <div className="h-9 bg-slate-200 rounded-xl w-32 ml-auto"></div>
      </div>

      {/* Table Rows Shimmer */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 space-y-4 shadow-2xs">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between items-center h-16 border-b border-slate-100 px-3">
            <div className="space-y-1.5">
              <div className="h-4 bg-slate-200 rounded w-32"></div>
              <div className="h-3 bg-slate-150 rounded w-20"></div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-40"></div>
            <div className="h-6 bg-slate-200 rounded-full w-24"></div>
            <div className="h-5 bg-slate-200 rounded w-28"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderStatusSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      <div className="space-y-2">
        <div className="h-6 bg-slate-200 rounded w-56"></div>
        <div className="h-4 bg-slate-150 rounded w-80"></div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 space-y-6 shadow-2xs">
        <div className="h-16 bg-slate-100/80 rounded-xl"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-150 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
