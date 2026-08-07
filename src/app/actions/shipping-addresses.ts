"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
const prisma = db as any;

export async function getShippingAddresses(institutionId: string) {
  try {
    if (!institutionId) return { success: false, addresses: [], error: "ID Institusi diperlukan" };
    
    let addresses = await prisma.shippingAddress.findMany({
      where: { institutionId },
      orderBy: [
        { isMain: "desc" },
        { createdAt: "desc" }
      ]
    });

    // Jika belum ada alamat khusus tersimpan, buat alamat default dari data Institusi
    if (addresses.length === 0) {
      const inst = await prisma.institution.findUnique({
        where: { id: institutionId },
        include: { users: true }
      });

      if (inst) {
        const defaultUser = inst.users[0];
        const defaultAddress = await prisma.shippingAddress.create({
          data: {
            institutionId,
            label: "Apotek Utama (Izin SIA)",
            recipientName: defaultUser ? defaultUser.name : inst.name,
            recipientPhone: defaultUser?.phone || "085151005960",
            fullAddress: inst.address,
            isMain: true,
            latitude: -5.1354, // Default Makassar koordinat
            longitude: 119.4238,
            cdobNote: `SIA: ${inst.siaNumber}`,
          }
        });
        addresses = [defaultAddress];
      }
    }

    return { success: true, addresses };
  } catch (error: any) {
    console.error("Error fetching shipping addresses:", error);
    return { success: false, addresses: [], error: error.message };
  }
}

export async function createShippingAddress(data: {
  institutionId: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  fullAddress: string;
  province?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isMain?: boolean;
  cdobNote?: string;
}) {
  try {
    if (!data.institutionId || !data.fullAddress || !data.recipientName || !data.recipientPhone) {
      return { success: false, error: "Alamat lengkap, nama, dan no HP penerima wajib diisi" };
    }

    // Jika ditandai Alamat Utama, matikan isMain alamat lain
    if (data.isMain) {
      await prisma.shippingAddress.updateMany({
        where: { institutionId: data.institutionId },
        data: { isMain: false }
      });
    }

    const newAddress = await prisma.shippingAddress.create({
      data: {
        institutionId: data.institutionId,
        label: data.label || "Alamat Pengiriman",
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        fullAddress: data.fullAddress,
        province: data.province,
        city: data.city,
        district: data.district,
        postalCode: data.postalCode,
        latitude: data.latitude,
        longitude: data.longitude,
        isMain: !!data.isMain,
        cdobNote: data.cdobNote,
      }
    });

    // Sync to Institution address if main
    if (data.isMain && newAddress) {
      let village = "";
      let cleanDistrict = newAddress.district || "";
      if (cleanDistrict.includes("Desa/Kel:")) {
        const parts = cleanDistrict.split("(Desa/Kel:");
        cleanDistrict = parts[0].trim();
        if (parts[1]) village = parts[1].replace(")", "").trim();
      }
      const formatted = `Alamat: ${newAddress.fullAddress}, ${village ? `Kel/Desa: ${village}, ` : ''}Kec: ${cleanDistrict}, Kab/Kota: ${newAddress.city || ''}, Provinsi: ${newAddress.province || ''}, Kode Pos: ${newAddress.postalCode || ''}`;
      await prisma.institution.update({
        where: { id: data.institutionId },
        data: { address: formatted }
      });
    }

    return { success: true, address: newAddress };
  } catch (error: any) {
    console.error("Error creating shipping address:", error);
    return { success: false, error: error.message };
  }
}

export async function updateShippingAddress(
  id: string,
  data: {
    label?: string;
    recipientName?: string;
    recipientPhone?: string;
    fullAddress?: string;
    province?: string;
    city?: string;
    district?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    isMain?: boolean;
    cdobNote?: string;
  }
) {
  try {
    const existing = await prisma.shippingAddress.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Alamat tidak ditemukan" };

    if (data.isMain) {
      await prisma.shippingAddress.updateMany({
        where: { institutionId: existing.institutionId },
        data: { isMain: false }
      });
    }

    const updated = await prisma.shippingAddress.update({
      where: { id },
      data: {
        ...data,
      }
    });

    // Sync to Institution address if main
    if (updated.isMain) {
      let village = "";
      let cleanDistrict = updated.district || "";
      if (cleanDistrict.includes("Desa/Kel:")) {
        const parts = cleanDistrict.split("(Desa/Kel:");
        cleanDistrict = parts[0].trim();
        if (parts[1]) village = parts[1].replace(")", "").trim();
      }
      const formatted = `Alamat: ${updated.fullAddress}, ${village ? `Kel/Desa: ${village}, ` : ''}Kec: ${cleanDistrict}, Kab/Kota: ${updated.city || ''}, Provinsi: ${updated.province || ''}, Kode Pos: ${updated.postalCode || ''}`;
      await prisma.institution.update({
        where: { id: existing.institutionId },
        data: { address: formatted }
      });
    }

    return { success: true, address: updated };
  } catch (error: any) {
    console.error("Error updating shipping address:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteShippingAddress(id: string) {
  try {
    const existing = await prisma.shippingAddress.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Alamat tidak ditemukan" };

    const institutionId = existing.institutionId;
    await prisma.shippingAddress.delete({ where: { id } });

    const remaining = await prisma.shippingAddress.findMany({
      where: { institutionId },
      orderBy: { createdAt: "desc" }
    });

    if (remaining.length > 0) {
      const hasMain = remaining.some((a: any) => a.isMain);
      if (existing.isMain || !hasMain) {
        const newMain = remaining[0];
        await prisma.shippingAddress.updateMany({
          where: { institutionId },
          data: { isMain: false }
        });
        await prisma.shippingAddress.update({
          where: { id: newMain.id },
          data: { isMain: true }
        });
        const formatted = `Alamat: ${newMain.fullAddress}, Kec: ${newMain.district || ''}, Kota/Kab: ${newMain.city || ''}, Prov: ${newMain.province || ''}, Kode Pos: ${newMain.postalCode || ''}`;
        await prisma.institution.update({
          where: { id: institutionId },
          data: { address: formatted }
        });
      }
    } else {
      await prisma.institution.update({
        where: { id: institutionId },
        data: { address: "" }
      });
    }

    revalidatePath("/customer/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting shipping address:", error);
    return { success: false, error: error.message };
  }
}

export async function setMainShippingAddress(id: string, institutionId: string) {
  try {
    await prisma.shippingAddress.updateMany({
      where: { institutionId },
      data: { isMain: false }
    });

    const updated = await prisma.shippingAddress.update({
      where: { id },
      data: { isMain: true }
    });

    if (updated) {
      const formatted = `Alamat: ${updated.fullAddress}, Kec: ${updated.district || ''}, Kota/Kab: ${updated.city || ''}, Prov: ${updated.province || ''}, Kode Pos: ${updated.postalCode || ''}`;
      await prisma.institution.update({
        where: { id: institutionId },
        data: { address: formatted }
      });
    }

    return { success: true, address: updated };
  } catch (error: any) {
    console.error("Error setting main shipping address:", error);
    return { success: false, error: error.message };
  }
}

export async function getOperationalAddress(institutionId: string) {
  try {
    if (!institutionId) return { success: false, address: "" };
    const inst = await prisma.institution.findUnique({
      where: { id: institutionId },
      include: { users: true }
    });
    if (!inst) return { success: false, address: "" };

    return {
      success: true,
      address: inst.address || "",
      institutionName: inst.name,
      siaNumber: inst.siaNumber,
      phone: inst.users?.[0]?.phone || "08123456789"
    };
  } catch (error: any) {
    console.error("Error getting operational address:", error);
    return { success: false, address: "" };
  }
}
