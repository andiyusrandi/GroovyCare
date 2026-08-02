"use client";

import React, { useState } from "react";
import { getCourierMeta } from "@/lib/courier-logos";

interface CourierLogoBadgeProps {
  courierCode?: string;
  courierName?: string;
  className?: string;
}

export default function CourierLogoBadge({
  courierCode = "",
  courierName = "",
  className = "",
}: CourierLogoBadgeProps) {
  const [imgError, setImgError] = useState(false);
  const meta = getCourierMeta(courierCode, courierName);

  if (!imgError && meta.logoUrl) {
    return (
      <div className={`w-10 h-10 rounded-xl p-1 bg-white flex items-center justify-center border border-slate-200/80 shrink-0 shadow-2xs overflow-hidden ${className}`}>
        <img
          src={meta.logoUrl}
          alt={meta.name}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback vector badge
  const code = (courierCode || "").toLowerCase().trim();
  const name = (courierName || "").toLowerCase().trim();

  // 1. Logistik Groovyrx (Internal PBF)
  if (code.includes("groovyrx") || name.includes("groovyrx")) {
    return (
      <div className={`w-10 h-10 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center font-sans shadow-xs border border-emerald-500 shrink-0 ${className}`}>
        <span className="material-symbols-outlined text-[16px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
        <span className="text-[7px] font-black tracking-tight leading-none mt-0.5 uppercase">GROOVY</span>
      </div>
    );
  }

  // 2. JNE Express
  if (code.includes("jne") || name.includes("jne")) {
    return (
      <div className={`w-10 h-10 rounded-xl bg-[#002d62] text-white flex flex-col items-center justify-center font-sans shadow-xs border border-blue-900 shrink-0 relative overflow-hidden ${className}`}>
        <div className="flex items-center justify-center leading-none">
          <span className="font-heading font-black text-[13px] italic tracking-tighter text-white">JNE</span>
          <span className="w-1.5 h-1.5 bg-[#e30613] rounded-full ml-0.5 animate-pulse"></span>
        </div>
        <span className="text-[6.5px] font-black text-[#e30613] tracking-widest leading-none uppercase mt-0.5 bg-white/90 px-1 rounded-xs">EXPRESS</span>
      </div>
    );
  }

  // 3. SiCepat Ekspres
  if (code.includes("sicepat") || name.includes("sicepat")) {
    return (
      <div className={`w-10 h-10 rounded-xl bg-[#d32f2f] text-white flex flex-col items-center justify-center font-sans shadow-xs border border-red-700 shrink-0 relative overflow-hidden ${className}`}>
        <div className="flex items-center gap-0.5 leading-none">
          <span className="material-symbols-outlined text-[12px] text-yellow-300 font-black" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          <span className="font-heading font-black text-[10px] tracking-tight text-white italic">SiCepat</span>
        </div>
        <span className="text-[6px] font-extrabold text-yellow-300 tracking-wider leading-none uppercase mt-0.5">EKSPRES</span>
      </div>
    );
  }

  // Default Fallback
  return (
    <div className={`w-10 h-10 rounded-xl bg-slate-800 text-white flex flex-col items-center justify-center font-sans shadow-xs border border-slate-700 shrink-0 ${className}`}>
      <span className="material-symbols-outlined text-[16px] leading-none">local_shipping</span>
      <span className="text-[7px] font-black tracking-wider leading-none mt-0.5 uppercase truncate max-w-[34px]">
        {code.substring(0, 5) || "KURIR"}
      </span>
    </div>
  );
}
