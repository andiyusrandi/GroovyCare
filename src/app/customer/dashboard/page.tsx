
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getProducts } from "@/app/actions/products";
import { getOrders } from "@/app/actions/orders";
import CustomerDashboardClient from "@/app/customer/dashboard/CustomerDashboardClient";

export default async function CustomerDashboardPage() {
  const session = await getSession();

  // Proteksi rute
  if (!session || session.role !== "CUSTOMER_USER" || !session.institutionId) {
    redirect("/login");
  }

  // Ambil data User lengkap
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { institution: true },
  });

  if (!user || !user.institution) {
    redirect("/api/logout");
  }

  // Fetch produk & pesanan mitra
  const products = await getProducts();
  const orders = await getOrders();

  return (
    <CustomerDashboardClient
      user={user}
      institution={user.institution}
      initialProducts={products}
      initialOrders={orders}
    />
  );
}
