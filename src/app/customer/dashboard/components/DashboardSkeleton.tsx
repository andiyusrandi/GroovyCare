"use client";

export default function DashboardSkeleton() {
  return (
    <div className="w-full space-y-5 animate-pulse font-sans">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. KARTU PROFIL & STATUS KREDIT (Top Card Skeleton)            */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-2xl p-5 text-white shadow-md space-y-4 border border-emerald-800/40">
        <div className="flex justify-between items-center gap-4">
          {/* Avatar & Info Apotek */}
          <div className="flex items-center gap-3">
            {/* Block Bundar Avatar */}
            <div className="w-12 h-12 rounded-full bg-white/20 shrink-0"></div>
            <div className="space-y-1.5">
              {/* Line Text Nama Apotek */}
              <div className="h-4 bg-white/30 rounded-md w-36"></div>
              {/* Line Text ID Pelanggan */}
              <div className="h-3 bg-white/20 rounded-md w-28"></div>
            </div>
          </div>
          {/* Badge Status (Kanan Atas) */}
          <div className="h-6 bg-white/20 rounded-lg w-20 shrink-0"></div>
        </div>

        {/* Big Text/Number Skeleton Sisa Kredit & Plafon Limit */}
        <div className="pt-3 border-t border-white/10 flex justify-between items-end">
          <div className="space-y-1.5">
            <div className="h-3 bg-white/20 rounded-md w-32"></div>
            <div className="h-6 bg-white/40 rounded-lg w-40"></div>
          </div>
          <div className="space-y-1.5 text-right">
            <div className="h-2.5 bg-white/20 rounded-md w-20 ml-auto"></div>
            <div className="h-4 bg-white/30 rounded-md w-24 ml-auto"></div>
          </div>
        </div>

        {/* Progress Bar & Status Jatuh Tempo Skeleton */}
        <div className="space-y-2">
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-white/30 w-2/3 rounded-full"></div>
          </div>
          <div className="flex justify-between items-center pt-1">
            <div className="h-3 bg-white/20 rounded-md w-40"></div>
            <div className="h-3 bg-white/20 rounded-md w-24"></div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. PENGIRIMAN AKTIF (Active Shipment Tracker Skeleton)        */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Header Text Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded-md w-36"></div>
          <div className="h-4 bg-slate-100 rounded-md w-16"></div>
        </div>

        {/* Card Kontainer Pengiriman */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-3">
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1.5">
              {/* Skeleton Nomor Pesanan (SP-20260809-0001) */}
              <div className="h-4 bg-slate-300/80 rounded-md w-32"></div>
              <div className="h-3 bg-slate-200 rounded-md w-24"></div>
            </div>
            {/* Skeleton Badge Estimasi & Status Kurir */}
            <div className="h-6 bg-emerald-100 rounded-full w-36"></div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <div className="h-3 bg-slate-200 rounded-md w-28"></div>
            {/* Skeleton Badge Status Dikonfirmasi / 1 Item */}
            <div className="h-5 bg-slate-200/80 rounded-full w-24"></div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. PESANAN TERBARU / RIWAYAT SINGKAT (Recent Orders Skeleton)   */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded-md w-32"></div>
          <div className="h-3 bg-slate-100 rounded-md w-20"></div>
        </div>

        {/* 3 Baris List Item Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50 gap-3">
              <div className="flex items-center gap-3">
                {/* Icon Kotak Kecil Kiri */}
                <div className="w-10 h-10 rounded-xl bg-slate-200/70 shrink-0"></div>
                <div className="space-y-1.5">
                  {/* Line Text Nomor SP */}
                  <div className="h-3.5 bg-slate-300/80 rounded-md w-28"></div>
                  {/* Line Text Tanggal */}
                  <div className="h-2.5 bg-slate-200 rounded-md w-20"></div>
                </div>
              </div>

              <div className="space-y-1.5 text-right shrink-0">
                {/* Line Text Nominal */}
                <div className="h-3.5 bg-slate-300/90 rounded-md w-20 ml-auto"></div>
                {/* Pill Badge Status (Diproses / Batal) */}
                <div className="h-5 bg-slate-200 rounded-full w-16 ml-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
