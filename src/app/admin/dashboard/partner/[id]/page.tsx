import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { getPartnerDetails, getAllPartners } from "@/app/actions/partnership";
import { getOrders } from "@/app/actions/orders";
import PartnerDetailClient from "./components/PartnerDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PartnerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();

  // Proteksi rute PBF Admin dan System Admin
  if (!session || (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN")) {
    redirect("/login");
  }

  try {
    const [partner, allPartners, allOrders] = await Promise.all([
      getPartnerDetails(id),
      getAllPartners(),
      getOrders(),
    ]);

    return (
      <PartnerDetailClient
        partner={partner as any}
        allPartners={allPartners as any}
        allOrders={allOrders as any}
        adminName={session.name}
        adminRole={session.role}
      />
    );
  } catch (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900">Mitra Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500">
            Data mitra tidak ditemukan di database atau Anda tidak memiliki akses untuk membukanya.
          </p>
          <a
            href="/admin/dashboard"
            className="inline-block px-6 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-md hover:brightness-105 transition-all"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }
}
