import Link from "next/link";
import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import LoginForm from "@/app/login/LoginForm";
import { db } from "@/lib/db";

export default async function LoginPage() {
  const session = await getSession();

  const prisma = db as any;
  const logoSetting = await prisma.systemSetting.findUnique({
    where: { key: "logo_url" },
  });
  const logoUrl =
    logoSetting?.value ||
    "https://res.cloudinary.com/rumahhostcom/image/upload/v1785256133/IMG_20260725_184829_670_odzsui.png";

  // Redirect jika sudah login
  if (session) {
    if (session.role === "PBF_ADMIN" || session.role === "SYSTEM_ADMIN") {
      redirect("/admin/dashboard");
    } else {
      redirect("/customer/dashboard");
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900 antialiased overflow-x-hidden select-none">
      {/* ================= SISI KIRI: BRANDING WITH CUSTOM BACKGROUND (DESKTOP) ================= */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-950 p-16 flex-col justify-between text-white shrink-0">
        {/* Custom Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-1000 hover:scale-105"
          style={{
            backgroundImage:
              "url('https://res.cloudinary.com/rumahhostcom/image/upload/v1784398717/ffsfsf_vsnzzp.jpg')",
          }}
        />
        {/* Soft Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-900/30" />

        {/* Top Minimal Badge */}
        <div className="relative z-10">
          <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
            PBF ONLINE SYSTEMS
          </span>
        </div>

        {/* Big Bold Clean Headline */}
        <div className="relative z-10 max-w-md space-y-4">
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.15] font-heading">
            Rantai Pasok Farmasi Presisi.
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed font-normal">
            Distribusi obat dan sediaan medis terintegrasi dengan standar kepatuhan regulasi BPOM &amp; CDOB.
          </p>
        </div>

        {/* Footer Minimal Text */}
        <div className="relative z-10 flex items-center gap-6 text-xs text-slate-300 font-medium">
          <span>• BPOM Verified</span>
          <span>• CDOB Certified</span>
          <span>• 256-bit Encrypted</span>
        </div>
      </div>

      {/* ================= SISI KANAN: FORM MINIMALIS (MOBILE & DESKTOP) ================= */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-5 sm:p-10 lg:p-16 pb-12 sm:pb-8 min-h-screen min-h-[100dvh]">
        {/* Header Right Tag (Desktop Only) */}
        <div className="hidden sm:flex justify-end items-center">
          <span className="text-xs text-slate-400 font-medium font-mono">
            Portal Resmi PBF
          </span>
        </div>

        {/* Form Login (Mobile Optimized Top Padding & Centered Alignment) */}
        <div className="max-w-sm w-full mx-auto pt-6 pb-4 sm:pt-0 sm:my-auto">
          <LoginForm logoUrl={logoUrl} />
        </div>

        {/* Footer Minimal & Clear Target */}
        <div className="text-xs text-slate-500 flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
          <p>© {new Date().getFullYear()} PBF Online</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-emerald-600 transition-colors">
              Beranda
            </Link>
            <Link href="/login" className="hover:text-emerald-600 transition-colors">
              Bantuan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
