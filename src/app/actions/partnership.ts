"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const session = await getSession();
  if (!session || (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN")) {
    throw new Error("Akses ditolak: Hanya PBF Admin atau System Admin yang diizinkan");
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

export async function getPartnerDetails(partnerId: string) {
  await verifyAdmin();
  try {
    const institution = await db.institution.findUnique({
      where: { id: partnerId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            sipaNumber: true,
            sipaExpiry: true,
            sipaFileUrl: true,
          },
        },
        orders: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            batchAllocations: {
              include: {
                batch: true,
              },
            },
          },
        },
      },
    });

    if (!institution) {
      throw new Error("Mitra tidak ditemukan");
    }

    return institution;
  } catch (error: any) {
    throw new Error("Gagal mengambil rincian mitra: " + error.message);
  }
}

export async function updatePartnerDetails(
  partnerId: string,
  data: {
    name: string;
    type: string;
    siaNumber: string;
    siaExpiry: Date | string;
    address: string;
    creditLimit: number;
    topDays: number;
    ownerKtp: string | null;
    ownerNpwp: string | null;
    bpomCode: string;
    user?: {
      name: string;
      email: string;
      phone: string | null;
      sipaNumber: string | null;
      sipaExpiry: Date | string | null;
    };
  }
) {
  await verifyAdmin();
  try {
    // 1. Update data institusi
    const updatedInst = await db.institution.update({
      where: { id: partnerId },
      data: {
        name: data.name,
        type: data.type,
        siaNumber: data.siaNumber,
        siaExpiry: new Date(data.siaExpiry),
        address: data.address,
        creditLimit: parseFloat(data.creditLimit.toString()),
        topDays: parseInt(data.topDays.toString(), 10),
        ownerKtp: data.ownerKtp,
        ownerNpwp: data.ownerNpwp,
        bpomCode: data.bpomCode,
      },
    });

    // 2. Jika ada data user, update user APJ pertama
    if (data.user) {
      const firstUser = await db.user.findFirst({
        where: { institutionId: partnerId },
        orderBy: { id: "asc" },
      });

      if (firstUser) {
        await db.user.update({
          where: { id: firstUser.id },
          data: {
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            sipaNumber: data.user.sipaNumber,
            sipaExpiry: data.user.sipaExpiry ? new Date(data.user.sipaExpiry) : null,
          },
        });
      }
    }

    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/dashboard/partner/${partnerId}`);
    return { success: true, message: "Data mitra berhasil diperbarui" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
