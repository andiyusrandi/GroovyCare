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
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900 antialiased overflow-x-hidden">
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

      {/* ================= SISI KANAN: FORM MINIMALIS ================= */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 min-h-screen">
        {/* Logo Header */}
        <div className="flex justify-between items-center">
          <Link href="/" className="inline-block">
            <img
              src={logoUrl}
              alt="Logo PBF Online"
              className="h-8 max-w-[180px] w-auto object-contain"
            />
          </Link>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline-block font-mono">
            Portal Resmi
          </span>
        </div>

        {/* Form Main Area */}
        <div className="max-w-sm w-full mx-auto my-auto space-y-8 py-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
              Masuk Akun
            </h2>
            <p className="text-xs text-slate-400">
              Gunakan kredensial bisnis terdaftar Anda.
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Footer Minimal */}
        <div className="text-xs text-slate-400 flex justify-between items-center pt-6 border-t border-slate-100">
          <p>© {new Date().getFullYear()} PBF Online</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-slate-600 transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-slate-600 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
