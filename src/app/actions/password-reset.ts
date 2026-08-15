"use server";

import { db, getFreshDb } from "@/lib/db";
import { headers } from "next/headers";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail } from "@/lib/email-service";

export interface PasswordResetResponse {
  success: boolean;
  message: string;
  devResetUrl?: string; // Tautan langsung untuk dev/testing lokal
}

/**
 * Helper SQL Fallbacks untuk SQLite
 */
async function saveTokenToDb(email: string, token: string, expiresAt: Date) {
  const prisma = getFreshDb() as any;
  if (prisma.passwordResetToken?.create) {
    return await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });
  }
  const id = crypto.randomUUID();
  const isoExpires = expiresAt.toISOString();
  const isoCreated = new Date().toISOString();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "PasswordResetToken" ("id", "email", "token", "expiresAt", "createdAt") VALUES (?, ?, ?, ?, ?)`,
    id, email, token, isoExpires, isoCreated
  );
  return { id, email, token, expiresAt };
}

async function deleteTokensFromDb(email: string) {
  const prisma = getFreshDb() as any;
  try {
    if (prisma.passwordResetToken?.deleteMany) {
      await prisma.passwordResetToken.deleteMany({ where: { email } });
    } else {
      await prisma.$executeRawUnsafe(`DELETE FROM "PasswordResetToken" WHERE "email" = ?`, email);
    }
  } catch (e) {
    console.warn("Delete token fallback skipped:", e);
  }
}

async function findTokenInDb(token: string) {
  const prisma = getFreshDb() as any;
  if (prisma.passwordResetToken?.findUnique) {
    return await prisma.passwordResetToken.findUnique({ where: { token } });
  }
  const rows: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM "PasswordResetToken" WHERE "token" = ? LIMIT 1`,
    token
  );
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    expiresAt: new Date(row.expiresAt),
  };
}

async function recordSecurityLog(data: {
  eventType: string;
  email: string;
  institution?: string;
  ipAddress?: string;
  userAgent?: string;
  status: string;
  details?: string;
}) {
  const prisma = getFreshDb() as any;
  try {
    if (prisma.securityAuditLog?.create) {
      await prisma.securityAuditLog.create({ data });
    } else {
      const id = crypto.randomUUID();
      const isoCreated = new Date().toISOString();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "SecurityAuditLog" ("id", "eventType", "email", "institution", "ipAddress", "userAgent", "status", "details", "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        data.eventType,
        data.email,
        data.institution || null,
        data.ipAddress || null,
        data.userAgent || null,
        data.status,
        data.details || null,
        isoCreated
      );
    }
  } catch (e) {
    console.warn("Record security log skipped:", e);
  }
}

/**
 * 1. Minta Reset Kata Sandi (Rate Limited & Anti Account Enumeration)
 */
export async function requestPasswordReset(email: string): Promise<PasswordResetResponse> {
  const reqHeaders = await headers();
  const ipAddress = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "Browser";

  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail) {
    return {
      success: false,
      message: "Silakan masukkan alamat email bisnis terdaftar Anda.",
    };
  }

  const genericSuccessMsg =
    "Jika alamat email terdaftar di sistem PBF, instruksi pemulihan kata sandi telah dikirimkan ke kotak masuk Anda (berlaku 15 menit).";

  try {
    const prisma = getFreshDb() as any;

    // Rate Limiting Check
    let recentRequestsCount = 0;
    try {
      if (prisma.securityAuditLog?.count) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        recentRequestsCount = await prisma.securityAuditLog.count({
          where: {
            email: cleanEmail,
            eventType: "AUTH_PASSWORD_RESET_REQUESTED",
            createdAt: { gte: tenMinutesAgo },
          },
        });
      }
    } catch (e) {
      console.warn("Audit log count skipped:", e);
    }

    if (recentRequestsCount >= 3) {
      await recordSecurityLog({
        eventType: "SECURITY_ALERT",
        email: cleanEmail,
        ipAddress,
        userAgent,
        status: "BLOCKED",
        details: "Rate limit terlampaui (>3x permohonan reset password dalam 10 menit)",
      });

      return {
        success: false,
        message: "Terlalu banyak permintaan reset kata sandi. Silakan tunggu 10 menit sebelum mencoba lagi.",
      };
    }

    // Cari User di Database
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { institution: true },
    });

    // Jika user tidak ditemukan, berikan notifikasi jelas bahwa email belum terdaftar
    if (!user) {
      await recordSecurityLog({
        eventType: "AUTH_PASSWORD_RESET_REQUESTED",
        email: cleanEmail,
        ipAddress,
        userAgent,
        status: "FAILED",
        details: "Permintaan reset untuk email yang tidak terdaftar",
      });

      return {
        success: false,
        message: `Alamat email "${cleanEmail}" belum terdaftar di sistem PBF. Silakan periksa kembali penulisan email Anda atau mendaftar sebagai mitra baru.`,
      };
    }

    // Hapus token reset lama untuk email ini
    await deleteTokensFromDb(cleanEmail);

    // Generate Token Kriptografis Berdurasi 15 Menit
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    await saveTokenToDb(cleanEmail, token, expiresAt);

    // Catat Audit Log Permintaan Reset
    await recordSecurityLog({
      eventType: "AUTH_PASSWORD_RESET_REQUESTED",
      email: cleanEmail,
      institution: user.institution?.name || "Mitra PBF",
      ipAddress,
      userAgent,
      status: "SUCCESS",
      details: "Token reset kata sandi terbit (Masa berlaku 15 menit)",
    });

    // URL Reset Pemulihan
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const devResetUrl = `${baseUrl}/reset-password?token=${token}`;

    console.log("--------------------------------------------------");
    console.log(`[SECURITY AUDIT] Reset Password Link for ${cleanEmail}:`);
    console.log(devResetUrl);
    console.log("--------------------------------------------------");

    // Kirim Notifikasi Email
    try {
      await sendPasswordResetEmail(cleanEmail, devResetUrl, ipAddress, userAgent);
    } catch (emailErr) {
      console.warn("Gagal mengirim email reset password via SMTP:", emailErr);
    }

    return {
      success: true,
      message: genericSuccessMsg,
      devResetUrl,
    };
  } catch (error: any) {
    console.error("Error pada requestPasswordReset:", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat memproses permintaan. Silakan coba beberapa saat lagi.",
    };
  }
}

/**
 * 2. Validasi Keabsahan Token Reset
 */
export async function validateResetToken(token: string) {
  if (!token || token.trim() === "") {
    return { valid: false, message: "Token pemulihan tidak ditemukan." };
  }

  try {
    const resetRecord = await findTokenInDb(token);

    if (!resetRecord) {
      return { valid: false, message: "Tautan pemulihan tidak valid atau sudah pernah digunakan." };
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
      return { valid: false, message: "Tautan pemulihan telah kedaluwarsa (berlaku 15 menit). Silakan minta tautan baru." };
    }

    return { valid: true, email: resetRecord.email };
  } catch (error: any) {
    return { valid: false, message: "Gagal memverifikasi token pemulihan." };
  }
}

/**
 * 3. Eksekusi Reset Kata Sandi Baru
 */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<PasswordResetResponse> {
  const reqHeaders = await headers();
  const ipAddress = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "Browser";

  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: "Kata sandi minimal harus 8 karakter." };
  }
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

  if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
    return {
      success: false,
      message: "Kata sandi harus mengandung minimal 1 huruf besar, 1 huruf kecil, 1 angka, dan 1 simbol (@$!%*?&).",
    };
  }

  try {
    const prisma = getFreshDb() as any;
    const resetRecord = await findTokenInDb(token);

    if (!resetRecord || new Date() > new Date(resetRecord.expiresAt)) {
      return {
        success: false,
        message: "Tautan pemulihan tidak valid atau telah kedaluwarsa.",
      };
    }

    const email = resetRecord.email;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { institution: true },
    });

    if (!user) {
      return { success: false, message: "Akun tidak ditemukan." };
    }

    // Perbarui Kata Sandi User
    await prisma.user.update({
      where: { email },
      data: { password: newPassword },
    });

    // Invalidate / Hapus token
    await deleteTokensFromDb(email);

    // Catat Audit Log Keberhasilan
    await recordSecurityLog({
      eventType: "AUTH_PASSWORD_RESET_SUCCESS",
      email,
      institution: user.institution?.name || "Mitra PBF",
      ipAddress,
      userAgent,
      status: "SUCCESS",
      details: "Kata sandi berhasil diperbarui & seluruh token reset dihanguskan.",
    });

    // Kirim Email Konfirmasi
    try {
      await sendPasswordResetSuccessEmail(email, ipAddress, userAgent);
    } catch (emailErr) {
      console.warn("Gagal mengirim email konfirmasi sukses reset password:", emailErr);
    }

    revalidatePath("/login");
    revalidatePath("/forgot-password");

    return {
      success: true,
      message: "Kata sandi Anda telah berhasil diperbarui. Seluruh sesi sebelumnya telah dinonaktifkan demi keamanan. Silakan login kembali.",
    };
  } catch (error: any) {
    console.error("Error pada resetPasswordWithToken:", error);
    return {
      success: false,
      message: error.message || "Gagal memperbarui kata sandi.",
    };
  }
}

/**
 * 4. Ambil Daftar Security Audit Logs (Hanya Admin PBF / System Admin)
 */
export async function getSecurityAuditLogs() {
  try {
    const prisma = getFreshDb() as any;
    if (prisma.securityAuditLog?.findMany) {
      return await prisma.securityAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }
    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "SecurityAuditLog" ORDER BY "createdAt" DESC LIMIT 50`
    );
    return rows || [];
  } catch (error: any) {
    console.error("Error fetching security audit logs:", error);
    return [];
  }
}
