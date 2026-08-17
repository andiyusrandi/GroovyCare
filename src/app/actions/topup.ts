"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

const MIDTRANS_DEV_SERVER_KEY = (process.env.MIDTRANS_DEV_SERVER_KEY || "").trim();
const IS_SANDBOX = MIDTRANS_DEV_SERVER_KEY.startsWith("SB-");
const MIDTRANS_SNAP_URL = IS_SANDBOX
  ? "https://app.sandbox.midtrans.com/snap/v1/transactions"
  : "https://app.midtrans.com/snap/v1/transactions";

// 1. Buat Transaksi Top-Up Saldo API Shipping & Dapatkan Midtrans Snap Token
export async function createMidtransTopUpToken(amount: number) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN")) {
      return { success: false, error: "Akses ditolak: Anda belum login sebagai Admin PBF" };
    }

    if (!amount || amount < 10000) {
      return { success: false, error: "Nominal top-up minimal adalah Rp. 10.000" };
    }

    const timestamp = Date.now().toString().slice(-6);
    const topUpNumber = `TPU-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${timestamp}`;
    const midtransOrderId = `TOPUP-${topUpNumber}`;

    const authHeader = `Basic ${Buffer.from(`${MIDTRANS_DEV_SERVER_KEY}:`).toString("base64")}`;

    const payload = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: session.name || "Admin PBF",
        email: session.email || "admin@growmexa.com",
      },
      item_details: [
        {
          id: "SHIP_DEPOSIT",
          price: amount,
          quantity: 1,
          name: "Top-Up Saldo Deposit API Shipping",
        },
      ],
    };

    const res = await fetch(MIDTRANS_SNAP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.token) {
      console.error("Midtrans Snap error:", data);
      return { success: false, error: data.error_messages ? data.error_messages.join(", ") : "Gagal menerbitkan Snap Token Midtrans" };
    }

    const snapToken = data.token;

    // Simpan ke DB
    await (db as any).topUpRequest.create({
      data: {
        topUpNumber,
        amount,
        snapToken,
        midtransOrderId,
        paymentStatus: "PENDING_PAYMENT",
        requestedById: session.userId,
      },
    });

    revalidatePath("/admin/dashboard");
    return {
      success: true,
      topUpNumber,
      midtransOrderId,
      snapToken,
      redirectUrl: data.redirect_url,
    };
  } catch (error: any) {
    console.error("createMidtransTopUpToken error:", error);
    return { success: false, error: error.message || "Gagal membuat transaksi top-up" };
  }
}

// 2. Mengambil Seluruh Riwayat Transaksi Top-Up
export async function getTopUpRequests() {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Belum login" };

    const requests = await (db as any).topUpRequest.findMany({
      orderBy: { createdAt: "desc font" as any },
      include: {
        requestedBy: {
          select: { name: true, email: true }
        },
        approvedBy: {
          select: { name: true, email: true }
        }
      }
    }).catch(async () => {
      return await (db as any).topUpRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          requestedBy: {
            select: { name: true, email: true }
          }
        }
      });
    });

    return { success: true, requests };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Khusus Developer (admin@growmexa.com): Setujui Request Top-Up & Tambahkan Saldo Deposit
export async function approveTopUpRequest(requestId: string) {
  try {
    const session = await getSession();
    if (!session || session.email !== "admin@growmexa.com") {
      return { success: false, error: "Akses ditolak. Fitur persetujuan ini khusus untuk akun admin@growmexa.com" };
    }

    const reqItem = await (db as any).topUpRequest.findUnique({
      where: { id: requestId },
    });

    if (!reqItem) {
      return { success: false, error: "Data transaksi top-up tidak ditemukan" };
    }

    if (reqItem.paymentStatus === "APPROVED") {
      return { success: false, error: "Transaksi ini sudah pernah disetujui sebelumnya" };
    }

    // Dynamic Base Balance Update
    let currentBase = 7575;
    const baseSetting = await db.systemSetting.findUnique({ where: { key: "biteship_base_balance" } });
    if (baseSetting && baseSetting.value && !isNaN(Number(baseSetting.value))) {
      currentBase = Number(baseSetting.value);
    }

    const newBase = currentBase + reqItem.amount;

    await db.$transaction([
      db.systemSetting.upsert({
        where: { key: "biteship_base_balance" },
        update: { value: Math.round(newBase).toString() },
        create: { key: "biteship_base_balance", value: Math.round(newBase).toString() },
      }),
      (db as any).topUpRequest.update({
        where: { id: requestId },
        data: {
          paymentStatus: "APPROVED",
          approvedById: session.userId,
          approvedAt: new Date(),
        },
      }),
    ]);

    revalidatePath("/admin/dashboard");
    return {
      success: true,
      message: `Top-Up sebesar Rp. ${reqItem.amount.toLocaleString("id-ID")} berhasil disetujui! Saldo deposit baru dasar: Rp. ${newBase.toLocaleString("id-ID")}`
    };
  } catch (error: any) {
    console.error("approveTopUpRequest error:", error);
    return { success: false, error: error.message || "Gagal menyetujui request top-up" };
  }
}

// 4. Khusus Developer (admin@growmexa.com): Tolak Request Top-Up
export async function rejectTopUpRequest(requestId: string, reason: string) {
  try {
    const session = await getSession();
    if (!session || session.email !== "admin@growmexa.com") {
      return { success: false, error: "Akses ditolak. Fitur ini khusus untuk akun admin@growmexa.com" };
    }

    await (db as any).topUpRequest.update({
      where: { id: requestId },
      data: {
        paymentStatus: "REJECTED",
        rejectionReason: reason || "Ditolak oleh Developer",
        approvedById: session.userId,
        approvedAt: new Date(),
      },
    });

    revalidatePath("/admin/dashboard");
    return { success: true, message: "Pengajuan Top-Up berhasil ditolak." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
