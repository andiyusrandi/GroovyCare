"use client";

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans pb-12">
      {/* Hero Welcome Shimmer */}
      <div className="rounded-2xl bg-slate-200/80 h-24 w-full"></div>

      {/* Bento Grid KPI Shimmer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 h-28 space-y-3 shadow-xs">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-6 bg-slate-200 rounded w-2/3"></div>
          <div className="h-2 bg-slate-200 rounded w-full"></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 h-28 space-y-3 shadow-xs">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-6 bg-slate-200 rounded w-2/3"></div>
          <div className="h-2 bg-slate-200 rounded w-1/2"></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 h-28 space-y-3 shadow-xs">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-6 bg-slate-200 rounded w-2/3"></div>
          <div className="h-2 bg-slate-200 rounded w-3/4"></div>
        </div>
      </div>

      {/* Analytics Chart & Activity Shimmer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/60 h-64 space-y-4 shadow-xs">
          <div className="h-5 bg-slate-200 rounded w-1/4"></div>
          <div className="h-44 bg-slate-100/70 rounded-xl"></div>
        </div>
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/60 h-64 space-y-3 shadow-xs">
          <div className="h-5 bg-slate-200 rounded w-1/2"></div>
          <div className="space-y-2 pt-2">
            <div className="h-10 bg-slate-100/70 rounded-xl"></div>
            <div className="h-10 bg-slate-100/70 rounded-xl"></div>
            <div className="h-10 bg-slate-100/70 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductCatalogSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-sans">
      {/* Search & Filter Bar Shimmer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 flex flex-col md:flex-row gap-4 justify-between shadow-xs">
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
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 space-y-3 shadow-xs">
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

      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 flex flex-wrap gap-3 shadow-xs">
        <div className="h-9 bg-slate-200 rounded-xl w-48"></div>
        <div className="h-9 bg-slate-200 rounded-xl w-36"></div>
        <div className="h-9 bg-slate-200 rounded-xl w-36"></div>
        <div className="h-9 bg-slate-200 rounded-xl w-32 ml-auto"></div>
      </div>

      {/* Table Rows Shimmer */}
      <div className="bg-white rounded-3xl border border-slate-200/60 p-4 space-y-4 shadow-xs">
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

      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 space-y-6 shadow-xs">
        <div className="h-16 bg-slate-100/80 rounded-2xl"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-150 rounded-xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
