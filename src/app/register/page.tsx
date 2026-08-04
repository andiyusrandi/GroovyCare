import Link from "next/link";
import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import RegisterForm from "@/app/register/RegisterForm";
import { db } from "@/lib/db";

export default async function RegisterPage() {
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
    <div className="min-h-screen w-full flex bg-slate-50 font-sans text-slate-800 antialiased select-none">
      {/* ================= SISI KIRI: BRAND & LEGAL REQUIREMENT INFO (DESKTOP) ================= */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-100 p-12 xl:p-16 flex-col justify-between border-r border-slate-200/80 shrink-0">
        {/* Pattern Background Dot Tipis */}
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#059669 0.75px, transparent 0.75px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/">
            <img
              src={logoUrl}
              alt="GroovyRx Logo"
              className="h-9 w-auto object-contain"
            />
          </Link>
          <span className="text-[10px] font-bold font-mono tracking-wider text-emerald-800 bg-emerald-100/80 border border-emerald-200/80 px-3 py-1 rounded-full uppercase">
            REGISTRASI PBF B2B
          </span>
        </div>

        {/* Middle Content */}
        <div className="relative z-10 max-w-md space-y-5 my-auto py-8">
          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.25] font-heading">
            Bergabung Sebagai Mitra Resmi <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              Pengadaan Farmasi Digital
            </span>
          </h1>
          <p className="text-slate-600 text-xs xl:text-sm leading-relaxed">
            Dapatkan akses langsung ke sediaan obat resmi CDOB, kemudahan e-Sign Surat Pesanan (SP), dan fasilitas limit kredit transaksi.
          </p>

          {/* Checklist Berkas Yang Perlu Disiapkan */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5 mt-6">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Persyaratan Dokumen Legalitas:
            </span>
            <div className="space-y-2.5 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                  ✓
                </span>
                <span>Surat Izin Apotek (SIA) / Izin Operasional RS</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                  ✓
                </span>
                <span>Surat Izin Praktik Apoteker (SIPA) APJ</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                  ✓
                </span>
                <span>NPWP / Identitas Resmi Sarana</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Minimal */}
        <div className="relative z-10 text-[11px] text-slate-400 font-medium flex items-center justify-between pt-6 border-t border-slate-200/80">
          <p>© {new Date().getFullYear()} PBF Online Systems</p>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            Terverifikasi BPOM &amp; CDOB
          </span>
        </div>
      </div>

      {/* ================= SISI KANAN: FORM MULTI-STEP REGISTER (MOBILE & DESKTOP) ================= */}
      <div className="w-full lg:w-[55%] xl:w-[52%] bg-white flex flex-col min-h-screen min-h-[100dvh] p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12 overflow-y-auto">
        {/* Registration Form Component */}
        <RegisterForm logoUrl={logoUrl} />
      </div>
    </div>
  );
}
