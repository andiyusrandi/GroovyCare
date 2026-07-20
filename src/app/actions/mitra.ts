"use server";

import { db } from "@/lib/db";
import { getSession, setSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

export async function updateMitraProfile(data: {
  ownerKtp: string;
  ownerNpwp: string;
  siaNumber: string;
  sipaNumber: string;
  address?: string;
}) {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER_USER" || !session.institutionId) {
    return { success: false, error: "Akses ditolak" };
  }

  try {
    // 1. Update data instansi (NPWP, KTP, SIA, Alamat)
    await db.institution.update({
      where: { id: session.institutionId },
      data: {
        // NIK and NPWP fields added in latest prisma schema
        ownerKtp: data.ownerKtp,
        ownerNpwp: data.ownerNpwp,
        siaNumber: data.siaNumber,
        ...(data.address ? { address: data.address } : {}),
      },
    });

    // 2. Update SIPA penanggung jawab (user)
    await db.user.update({
      where: { id: session.userId },
      data: {
        sipaNumber: data.sipaNumber,
      },
    });

    revalidatePath("/customer/dashboard");
    return { success: true, message: "Profil mitra berhasil diperbarui!" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateApjProfile(data: {
  name: string;
  email: string;
  phone: string;
}) {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER_USER") {
    return { success: false, error: "Akses ditolak" };
  }

  try {
    const existing = await db.user.findUnique({
      where: { email: data.email },
    });
    if (existing && existing.id !== session.userId) {
      return { success: false, error: "Email sudah digunakan oleh pengguna lain" };
    }

    await db.user.update({
      where: { id: session.userId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
      },
    });

    // Sync session details
    session.name = data.name;
    session.email = data.email;
    await setSession(session);

    revalidatePath("/customer/dashboard");
    return { success: true, message: "Profil APJ berhasil diperbarui!" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
