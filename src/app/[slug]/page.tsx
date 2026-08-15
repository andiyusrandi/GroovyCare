import { getCmsPage, getDefaultCmsPages } from "@/app/actions/cms";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const defaultPages = await getDefaultCmsPages();
  return Object.keys(defaultPages).map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DynamicCmsPage({ params }: PageProps) {
  const { slug } = await params;
  const defaultPages = await getDefaultCmsPages();

  if (!defaultPages[slug]) {
    notFound();
  }

  const pageData = await getCmsPage(slug);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between select-none">
      {/* Top Header App Bar (Native Android M3) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Sisi Kiri: Tombol Back + Logo */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <Link
              className="p-2 -ml-1.5 rounded-full hover:bg-slate-100 active:scale-95 text-slate-700 transition-all flex items-center justify-center shrink-0 text-decoration-none"
              href="/"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </Link>

            <div className="flex items-center gap-2 min-w-0">
              <img
                src="https://res.cloudinary.com/rumahhostcom/image/upload/v1785321525/logo_care_fcfgwq.png"
                alt="GroovyCare Logo"
                className="h-6 sm:h-7 w-auto object-contain shrink-0"
              />
              <span className="hidden sm:inline-flex bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                CDOB System
              </span>
            </div>
          </div>

          {/* Sisi Kanan: Auth Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200/70 transition-colors text-decoration-none"
              href="/login"
            >
              Masuk
            </Link>
            <Link
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white shadow-xs transition-all text-decoration-none flex items-center gap-1"
              href="/register"
            >
              <span>Daftar</span>
              <span className="hidden sm:inline">Sarana</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Hero & Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 md:py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-4">
          <Link href="/" className="hover:text-emerald-700 transition-colors text-decoration-none">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-bold uppercase">{pageData.category}</span>
          <span>/</span>
          <span className="text-slate-800 font-bold">{pageData.slug}</span>
        </div>

        {/* Title Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/90 shadow-sm space-y-3 mb-6">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>Dokumen Resmi PBF Online</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-heading leading-tight">
            {pageData.title}
          </h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            {pageData.subtitle}
          </p>

          {pageData.updatedAt && (
            <p className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100">
              Terakhir diperbarui: {new Date(pageData.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200/90 shadow-sm space-y-6 text-slate-700 text-sm leading-relaxed">
          {pageData.body.split("\n\n").map((paragraph, index) => {
            if (paragraph.startsWith("### ")) {
              return (
                <h3 key={index} className="text-lg font-extrabold text-slate-900 font-heading pt-2 border-b border-slate-100 pb-2">
                  {paragraph.replace("### ", "")}
                </h3>
              );
            }
            if (paragraph.startsWith("---")) {
              return <hr key={index} className="border-slate-100 my-4" />;
            }
            return (
              <div key={index} className="space-y-2">
                {paragraph.split("\n").map((line, lIdx) => {
                  if (line.startsWith("- ")) {
                    return (
                      <li key={lIdx} className="ml-4 list-disc font-medium text-slate-700">
                        {line.replace("- ", "")}
                      </li>
                    );
                  }
                  if (/^\d+\.\s/.test(line)) {
                    return (
                      <div key={lIdx} className="font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {line}
                      </div>
                    );
                  }
                  return <p key={lIdx}>{line}</p>;
                })}
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer Mobile (Clean Tonal Light Surface) */}
      <footer className="block md:hidden bg-slate-50 border-t border-slate-200/80 pt-6 pb-28 px-4 font-sans text-center">
        <div className="max-w-md mx-auto space-y-4">
          {/* Brand & Badge CDOB */}
          <div className="flex items-center justify-center gap-2">
            <span className="font-extrabold text-slate-800 text-sm tracking-tight font-heading">GroovyCare PBF System</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
              CDOB
            </span>
          </div>

          {/* Izin Resmi & Keterangan Singkat */}
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold font-mono text-slate-600">
              Izin Resmi: 123/PBF/KEMENKES/2023
            </p>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
              Distributor Resmi Kefarmasian &amp; Sediaan Obat Terakreditasi BPOM
            </p>
          </div>

          {/* Divider Halus */}
          <div className="w-16 h-0.5 bg-slate-200 mx-auto rounded-full"></div>

          {/* Navigasi Link Ringkas & Touch-Friendly */}
          <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-slate-600">
            <Link className="hover:text-emerald-700 active:text-emerald-800 transition-colors py-1 text-decoration-none" href="/about">
              Tentang Kami
            </Link>
            <span className="text-slate-300">•</span>
            <Link className="hover:text-emerald-700 active:text-emerald-800 transition-colors py-1 text-decoration-none" href="/terms">
              Syarat &amp; Ketentuan
            </Link>
            <span className="text-slate-300">•</span>
            <Link className="hover:text-emerald-700 active:text-emerald-800 transition-colors py-1 text-decoration-none" href="/privacy">
              Privasi
            </Link>
            <span className="text-slate-300">•</span>
            <Link className="hover:text-emerald-700 active:text-emerald-800 transition-colors py-1 text-decoration-none" href="/contact">
              Bantuan APJ
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-[10px] font-medium text-slate-500 pt-1">
            &copy; {new Date().getFullYear()} PT GroovyRx Pharmaceutical Group.
          </p>
        </div>
      </footer>
    </div>
  );
}
