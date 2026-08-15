import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GroovyCare - Koneksi Terputus",
  description: "Aplikasi GroovyCare tidak dapat terhubung ke server.",
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-5 text-center font-sans antialiased text-[#1a1a1a]">
      <div className="max-w-[400px] w-full p-8 flex flex-col items-center box-border">
        
        {/* Header Logo */}
        <div className="text-[14px] uppercase tracking-[2px] text-[#333333] mb-8 font-semibold">
          PT. GROOVYRX PHARMACEUTICAL GROUP
        </div>

        {/* Soft Red Circle Icon */}
        <div className="w-[70px] h-[70px] bg-[#ffeaea] border border-dashed border-[#d14d4d] rounded-full flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 16L12 12M12 12L8 8M12 12L16 8M12 12L8 16" stroke="#d14d4d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Offline Title */}
        <div className="text-[#1a1a1a] text-[18px] font-semibold mb-4">
          Koneksi Terputus
        </div>

        {/* Offline Message */}
        <div className="text-[#4f4f4f] text-[14px] leading-[1.6] mb-8">
          Aplikasi GroovyCare tidak dapat terhubung ke server. Halaman web tidak dapat dimuat karena tidak ada jaringan internet.
        </div>

        {/* Resolution Steps Box */}
        <div className="bg-[#f7f7f7] rounded-xl p-4 text-left w-full mb-8">
          <div className="text-[12px] uppercase text-[#828282] tracking-[1px] mb-2 font-semibold">
            LANGKAH PENYELESAIAN
          </div>
          <ul className="m-0 pl-[1.2rem] text-[#4f4f4f] text-[14px] leading-[1.6] list-disc space-y-1">
            <li>Pastikan Wi-Fi atau Paket Data Seluler di HP Anda dalam kondisi aktif.</li>
            <li>Pastikan Mode Pesawat (Airplane Mode) dimatikan.</li>
            <li>Ketuk tombol di bawah untuk memuat ulang aplikasi.</li>
          </ul>
        </div>

        {/* Refresh Button */}
        <Link
          href="/"
          className="w-full bg-[#d14d4d] hover:bg-[#b83d3d] active:bg-[#b83d3d] text-white border-none py-[14px] px-[28px] rounded-xl text-[16px] font-semibold cursor-pointer transition-all flex items-center justify-center gap-2.5 text-decoration-none"
        >
          <span>Coba Lagi</span>
        </Link>

        {/* Footer Copyright */}
        <div className="mt-8 text-[12px] text-[#bdbdbd]">
          GroovyCare B2B Systems &copy; 2026
        </div>

      </div>
    </div>
  );
}
