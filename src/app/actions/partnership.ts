"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const session = await getSession();
  if (!session || session.role !== "PBF_ADMIN") {
    throw new Error("Akses ditolak: Hanya PBF Admin yang diizinkan");
  }
}

export async function getAllPartners() {
  await verifyAdmin();
  try {
    return await db.institution.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        siaNumber: true,
        siaExpiry: true,
        address: true,
        creditLimit: true,
        currentDebt: true,
        topDays: true,
        isActive: true,
        ownerKtp: true,
        ownerNpwp: true,
        bpomCode: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            sipaNumber: true,
            sipaExpiry: true,
          }
        }
      },
      orderBy: {
        name: "asc",
      },
    });
  } catch (error: any) {
    throw new Error("Gagal mengambil data mitra: " + error.message);
  }
}

export async function activatePartner(id: string, creditLimit: number, topDays: number) {
  await verifyAdmin();
  try {
    const updated = await db.institution.update({
      where: { id },
      data: {
        isActive: true,
        creditLimit: parseFloat(creditLimit.toString()),
        topDays: parseInt(topDays.toString(), 10),
      },
    });
    revalidatePath("/admin/dashboard");
    return { success: true, message: `Apotek ${updated.name} berhasil diaktifkan.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePartnerLimit(id: string, creditLimit: number, topDays: number) {
  await verifyAdmin();
  try {
    const updated = await db.institution.update({
      where: { id },
      data: {
        creditLimit: parseFloat(creditLimit.toString()),
        topDays: parseInt(topDays.toString(), 10),
      },
    });
    revalidatePath("/admin/dashboard");
    return { success: true, message: `Limit kredit Apotek ${updated.name} berhasil diperbarui.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function suspendPartner(id: string) {
  await verifyAdmin();
  try {
    const updated = await db.institution.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
    revalidatePath("/admin/dashboard");
    return { success: true, message: `Mitra ${updated.name} berhasil ditangguhkan.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePartner(id: string) {
  await verifyAdmin();
  try {
    // 1. Hapus alokasi batch order terkait
    await db.orderBatchAllocation.deleteMany({
      where: { order: { institutionId: id } }
    });
    // 2. Hapus item order terkait
    await db.orderItem.deleteMany({
      where: { order: { institutionId: id } }
    });
    // 3. Hapus order terkait
    await db.order.deleteMany({
      where: { institutionId: id }
    });
    // 4. Hapus user terkait
    await db.user.deleteMany({
      where: { institutionId: id },
    });
    // 5. Hapus institusi itu sendiri
    const deleted = await db.institution.delete({
      where: { id },
    });
    revalidatePath("/admin/dashboard");
    return { success: true, message: `Mitra ${deleted.name} berhasil dihapus beserta seluruh datanya.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectPartner(id: string) {
  return await deletePartner(id);
}

export async function getPartnerFiles(partnerId: string) {
  await verifyAdmin();
  try {
    const institution = await db.institution.findUnique({
      where: { id: partnerId },
      select: {
        siaFileUrl: true,
        users: {
          select: {
            sipaFileUrl: true,
          },
          take: 1,
        }
      }
    });

    if (!institution) {
      return { success: false, error: "Mitra tidak ditemukan" };
    }

    return {
      success: true,
      siaFileUrl: institution.siaFileUrl,
      sipaFileUrl: institution.users[0]?.sipaFileUrl || null,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
