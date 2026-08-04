"use server";

import { db } from "@/lib/db";
import { setSession, destroySession } from "@/lib/auth-session";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email dan password wajib diisi" };
  }

  try {
    const user = await db.user.findUnique({
      where: { email },
      include: { institution: true },
    });

    if (!user || user.password !== password) {
      return { success: false, error: "Email atau password salah" };
    }

    // Jika Customer User, cek apakah institusi aktif
    if (user.role === "CUSTOMER_USER" && user.institution) {
      if (!user.institution.isActive) {
        return {
          success: false,
          error: "Pendaftaran Apotek Anda belum diaktivasi oleh PBF Admin. Mohon tunggu verifikasi.",
        };
      }
    }

    await setSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institutionId: user.institutionId,
    });

    return { success: true, role: user.role };
  } catch (error: any) {
    console.error("Login error:", error);
    return { success: false, error: "Terjadi kesalahan sistem saat login" };
  }
}

export async function quickLogin(role: "CUSTOMER_USER" | "PBF_ADMIN" | "EXPIRED_USER") {
  try {
    let email = "admin@groovycare.com";
    if (role === "CUSTOMER_USER") {
      email = "apotek.sehat@groovycare.com";
    } else if (role === "EXPIRED_USER") {
      email = "expired.sipa@groovycare.com";
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { institution: true },
    });

    if (!user) {
      return { success: false, error: "User simulasi tidak ditemukan" };
    }

    await setSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role === "CUSTOMER_USER" && email === "expired.sipa@groovycare.com" ? "CUSTOMER_USER" : user.role,
      institutionId: user.institutionId,
    });

    return { success: true, role: user.role };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logout() {
  await destroySession();
  return { success: true };
}

export async function registerInstitution(data: {
  institutionName: string;
  institutionType: string;
  siaNumber: string;
  siaExpiry: string;
  siaFileUrl?: string;
  address: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  sipaNumber: string;
  sipaExpiry: string;
  sipaFileUrl?: string;
}) {
  try {
    // 1. Cek email unik
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return { success: false, error: "Email sudah terdaftar" };
    }

    // 2. Cek SIA/Izin unik
    const existingSia = await db.institution.findUnique({
      where: { siaNumber: data.siaNumber },
    });
    if (existingSia) {
      return { success: false, error: "Nomor SIA/Izin sudah terdaftar" };
    }

    // 3. Simpan data institusi baru (tidak aktif sampai disetujui admin)
    const institution = await db.institution.create({
      data: {
        name: data.institutionName,
        type: data.institutionType, // Tipe mitra/sarana (Apotek, Klinik, RS, PBF, dll)
        siaNumber: data.siaNumber,
        siaExpiry: new Date(data.siaExpiry),
        siaFileUrl: data.siaFileUrl || null,
        address: data.address,
        creditLimit: 0, // Admin PBF akan menyetujui limit kreditnya nanti
        topDays: 30,    // Default 30 hari
        isActive: false, // Menunggu persetujuan
      },
    });

    // 4. Simpan data user apoteker / PJ
    const user = await db.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: "CUSTOMER_USER",
        phone: data.phone,
        sipaNumber: data.sipaNumber,
        sipaExpiry: new Date(data.sipaExpiry),
        sipaFileUrl: data.sipaFileUrl || null,
        institutionId: institution.id,
      },
    });

    // Sesuaikan pesan sukses berdasarkan tipe institusi
    let typeMessage = "Mitra";
    if (data.institutionType === "APOTEK") typeMessage = "Apotek";
    else if (data.institutionType === "KLINIK") typeMessage = "Klinik";
    else if (data.institutionType === "RUMAH_SAKIT") typeMessage = "Rumah Sakit";
    else if (data.institutionType === "PBF") typeMessage = "PBF/Distributor";
    else if (data.institutionType === "PERUSAHAAN_UMUM") typeMessage = "Perusahaan";

    return {
      success: true,
      message: `Registrasi ${typeMessage} berhasil! Silakan hubungi PBF Admin untuk aktivasi akun Anda.`,
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { success: false, error: error.message || "Gagal melakukan registrasi" };
  }
}

export async function getInstitutionProfile() {
  try {
    const { getSession } = await import("@/lib/auth-session");
    const session = await getSession();
    if (!session || !session.userId) {
      return { success: false, error: "Sesi tidak ditemukan" };
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { institution: true },
    });

    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan" };
    }

    return {
      success: true,
      data: {
        userName: user.name,
        userEmail: user.email,
        sipaNumber: user.sipaNumber || "",
        institutionName: user.institution?.name || "Apotek Sehat Farma",
        siaNumber: user.institution?.siaNumber || "",
        ownerKtp: user.institution?.ownerKtp || "",
        ownerNpwp: user.institution?.ownerNpwp || "",
        address: user.institution?.address || "",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memuat profil" };
  }
}

export async function updateInstitutionProfile(data: {
  ownerKtp: string;
  ownerNpwp: string;
  siaNumber: string;
  sipaNumber: string;
  address?: string;
}) {
  try {
    const { getSession } = await import("@/lib/auth-session");
    const session = await getSession();
    if (!session || !session.userId) {
      return { success: false, error: "Sesi tidak ditemukan, silakan login kembali." };
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { institution: true },
    });

    if (!user) {
      return { success: false, error: "Pengguna tidak ditemukan." };
    }

    if (user.institutionId) {
      await db.institution.update({
        where: { id: user.institutionId },
        data: {
          ownerKtp: data.ownerKtp,
          ownerNpwp: data.ownerNpwp,
          siaNumber: data.siaNumber,
          ...(data.address ? { address: data.address } : {}),
        },
      });
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        sipaNumber: data.sipaNumber,
      },
    });

    return { success: true, message: "Profil dan legalitas berhasil diperbarui." };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal memperbarui profil." };
  }
}
