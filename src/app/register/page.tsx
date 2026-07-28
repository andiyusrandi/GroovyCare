import Link from "next/link";
import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import RegisterForm from "@/app/register/RegisterForm";
import { ShieldCheck, Gavel, HelpCircle } from "lucide-react";
import { db } from "@/lib/db";

export default async function RegisterPage() {
  const session = await getSession();

  const prisma = db as any;
  const logoSetting = await prisma.systemSetting.findUnique({
    where: { key: "logo_url" },
  });
  const logoUrl = logoSetting?.value || "https://res.cloudinary.com/rumahhostcom/image/upload/v1785256133/IMG_20260725_184829_670_odzsui.png";

  // Redirect jika sudah login
  if (session) {
    if (session.role === "PBF_ADMIN" || session.role === "SYSTEM_ADMIN") {
      redirect("/admin/dashboard");
    } else {
      redirect("/customer/dashboard");
    }
  }

  return (
    <div className="relative min-h-screen font-sans flex flex-col bg-white overflow-hidden">
      {/* Radial Gradient Background Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-50/40 via-white to-slate-50 pointer-events-none z-0"></div>
      
      {/* Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Top Navigation Bar */}
      <nav className="hidden md:block fixed top-0 md:top-4 left-0 right-0 w-full md:w-[calc(100%-2rem)] max-w-7xl mx-auto z-50 bg-white/40 md:bg-white/30 backdrop-blur-md md:rounded-2xl border-b md:border border-outline-variant/10 md:border-white/20 shadow-sm md:shadow-lg transition-all duration-300">
        <div className="flex justify-between items-center px-6 sm:px-8 py-3.5 w-full">
          <Link href="/" className="flex items-center gap-2">
            <img
              src={logoUrl}
              alt="GroovyRx Logo"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              className="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 text-xs flex items-center gap-1"
              href="#"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Bantuan
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-primary text-white hover:bg-primary/90 active:scale-95 transition-all text-xs font-bold rounded-xl shadow-sm shadow-primary/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Grid Content */}
      <main className="pt-16 md:pt-36 pb-32 md:pb-16 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10 flex-1">
        {/* Left Content: Brand & Trust Signals */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-start space-y-6 lg:space-y-8 lg:sticky lg:top-36">
          <div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-[40px] lg:leading-[48px] text-slate-800 tracking-tight">
              Daftar Menjadi <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Mitra PBF Online</span>
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant/85 leading-relaxed mt-3">
              Lengkapi data sarana dan dokumen legalitas untuk mulai bertransaksi secara aman dan patuh regulasi dalam ekosistem distribusi farmasi modern.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Compliance Badge 1 */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/40 shadow-sm hover:bg-white/60 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-xs text-slate-800">Kepatuhan CDOB</h4>
                <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
                  Sistem distribusi sesuai standar Cara Distribusi Obat yang Baik.
                </p>
              </div>
            </div>

            {/* Compliance Badge 2 */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/40 backdrop-blur-md border border-white/40 shadow-sm hover:bg-white/60 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                <Gavel className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-xs text-slate-800">Lisensi BPOM</h4>
                <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
                  Terintegrasi dengan sistem pelaporan obat nasional yang diawasi BPOM.
                </p>
              </div>
            </div>
          </div>

          {/* Decorative Image */}
          <div className="hidden lg:block relative overflow-hidden rounded-3xl aspect-[16/10] border border-white/20 shadow-lg group">
            <div
              className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAD45QOZkd9GoFIuILTzyLPh96fVCKM7AA8TserLaHGf9PTMXKKM9QOQ1Bxe8f5ZBXg-Ls-vWdkw5VAwks7K0m0SZMjvUf--6ExjJCrfKu1fHD0460_w0BTs7H5ojqQSE2havt_0O4eqsrtZCNz5c6mA1j4Tufx4yaaYApqFIfETt2Z-xOletFXhbOmkXrgeXmaRxkA_52235AlKcT76eg5OT6Kt9zmFUUkQI6w-UhbxrZnssftOsQLpRrIYIQChGEkT5AZsWcMDGY')",
              }}
            />
          </div>
        </div>

        {/* Right Content: Registration Form */}
        <div className="col-span-1 lg:col-span-7">
          <div className="bg-transparent md:bg-white/45 md:backdrop-blur-lg p-0 md:p-6 sm:p-8 rounded-none md:rounded-3xl shadow-none md:shadow-xl border-0 md:border md:border-white/50 hover:shadow-2xl transition-all duration-300">
            <RegisterForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="hidden md:block w-full py-8 bg-surface-container-low border-t border-outline-variant/30">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-heading text-base font-bold text-primary">PBF Online</span>
            <p className="text-[11px] text-on-surface-variant text-center md:text-left">
              &copy; {new Date().getFullYear()} PBF Online. All Rights Reserved. Pharmaceutical Distribution Excellence.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-[10px] text-on-surface-variant font-bold">
            <Link className="hover:text-primary transition-colors underline" href="#">
              Terms of Service
            </Link>
            <Link className="hover:text-primary transition-colors underline" href="#">
              Privacy Policy
            </Link>
            <Link className="hover:text-primary transition-colors underline" href="#">
              Compliance &amp; SIA Requirements
            </Link>
            <Link className="hover:text-primary transition-colors underline" href="#">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
