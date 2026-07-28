"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

async function verifySuperAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error("Akses ditolak: Anda belum login");
  }
  if (session.role !== "SYSTEM_ADMIN") {
    throw new Error("Akses ditolak: Hanya Super Admin (SYSTEM_ADMIN) yang diizinkan");
  }
  return session;
}

// 1. Mengambil semua pengguna admin
export async function getAdminUsers() {
  await verifySuperAdmin();
  try {
    return await db.user.findMany({
      where: {
        role: {
          in: ["PBF_ADMIN", "SYSTEM_ADMIN"],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        sipaNumber: true,
        sipaExpiry: true,
      },
      orderBy: {
        role: "asc",
      },
    });
  } catch (error: any) {
    throw new Error("Gagal mengambil data user admin: " + error.message);
  }
}

// 2. Membuat akun admin baru
export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
  role: "PBF_ADMIN" | "SYSTEM_ADMIN";
  phone?: string;
  sipaNumber?: string;
  sipaExpiry?: string;
}) {
  await verifySuperAdmin();

  if (!data.name || !data.email || !data.password || !data.role) {
    return { success: false, error: "Nama, email, password, dan role wajib diisi" };
  }

  try {
    // Periksa apakah email sudah terdaftar
    const existing = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return { success: false, error: "Email sudah terdaftar di sistem" };
    }

    await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone || null,
        sipaNumber: data.sipaNumber || null,
        sipaExpiry: data.sipaExpiry ? new Date(data.sipaExpiry) : null,
      },
    });

    revalidatePath("/admin/dashboard");
    return { success: true, message: `Akun admin ${data.name} berhasil dibuat!` };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal membuat akun admin" };
  }
}

// 3. Menghapus akun admin
export async function deleteAdminUser(targetUserId: string) {
  const session = await verifySuperAdmin();

  if (session.userId === targetUserId) {
    return { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif" };
  }

  try {
    const userToDelete = await db.user.findUnique({
      where: { id: targetUserId },
    });

    if (!userToDelete) {
      return { success: false, error: "User tidak ditemukan" };
    }

    await db.user.delete({
      where: { id: targetUserId },
    });

    revalidatePath("/admin/dashboard");
    return { success: true, message: `Akun admin ${userToDelete.name} berhasil dihapus!` };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menghapus akun admin" };
  }
}

// 4. Mengambil seluruh System Settings
export async function getSystemSettings() {
  // Boleh diakses oleh yang sudah login
  const session = await getSession();
  if (!session) {
    throw new Error("Akses ditolak: Anda belum login");
  }

  try {
    const prisma = db as any;
    const settings = await prisma.systemSetting.findMany();
    return settings.reduce((acc: Record<string, string>, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
  } catch (error: any) {
    throw new Error("Gagal mengambil pengaturan sistem: " + error.message);
  }
}

// 5. Memperbarui pengaturan sistem secara batch
export async function updateSystemSettings(settings: Record<string, string>) {
  await verifySuperAdmin();

  try {
    const prisma = db as any;
    await prisma.$transaction(
      Object.entries(settings).map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );

    revalidatePath("/");
    revalidatePath("/login");
    revalidatePath("/register");
    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    
    return { success: true, message: "Pengaturan sistem berhasil diperbarui!" };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memperbarui pengaturan sistem" };
  }
}
