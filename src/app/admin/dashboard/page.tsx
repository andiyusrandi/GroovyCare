
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { getAllPartners } from "@/app/actions/partnership";
import { getProducts } from "@/app/actions/products";
import { getOrders } from "@/app/actions/orders";
import AdminDashboardClient from "@/app/admin/dashboard/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await getSession();

  // Proteksi rute PBF Admin dan System Admin
  if (!session || (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN")) {
    redirect("/login");
  }

  // Ambil data dari server actions
  const partners = await getAllPartners();
  const products = await getProducts();
  const orders = await getOrders();

  return (
    <AdminDashboardClient
      adminName={session.name}
      adminRole={session.role}
      currentUserEmail={session.email}
      initialPartners={partners}
      initialProducts={products}
      initialOrders={orders}
    />
  );
}
