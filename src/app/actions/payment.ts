"use server";

import midtransClient from "midtrans-client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";
import { recalculateInstitutionDebt } from "@/app/actions/orders";

const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
const clientKey = process.env.MIDTRANS_CLIENT_KEY || "";

// Create Snap API instance
let snap: any = null;
try {
  snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: serverKey,
    clientKey: clientKey
  });
} catch (err) {
  console.error("Gagal menginisialisasi Midtrans Snap SDK:", err);
}

export async function getSnapToken(orderId: string) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return { success: false, error: "Akses ditolak: Anda belum masuk" };
    }

    // Ambil detail pesanan
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        institution: true,
        createdBy: true
      }
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    const allowedMethods = ["VA", "TOP", "INVOICE", "CREDIT"];
    if (!allowedMethods.includes(order.paymentMethod)) {
      return { success: false, error: `Metode pembayaran ${order.paymentMethod} tidak mendukung pelunasan via Payment Gateway` };
    }

    // Hitung Subtotal
    const subtotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    // Hitung PPN 11%
    const vat = Math.round(subtotal * 0.11);

    // Parse Ongkos Kirim dari format teks consolidatedAddress
    const addr = order.shippingAddress;
    const feeMatch = addr.match(/-\s*Rp\s*([0-9.,]+)/);
    let shippingFee = 0;
    if (feeMatch && feeMatch[1]) {
      shippingFee = parseInt(feeMatch[1].replace(/[.,]/g, "")) || 0;
    } else if (addr.includes("Kurir: Standard Flat Rate")) {
      const isColdChain = order.items.some((item: any) =>
        item.product.name.includes("Insulin") || item.product.code.includes("AMX")
      );
      shippingFee = isColdChain ? 85000 : 50000;
    } else {
      // Default flat rate fallback jika tidak terdeteksi
      shippingFee = 50000;
    }

    const grossAmount = subtotal + vat + shippingFee;

    // Persiapkan detail barang untuk Midtrans
    const itemDetails = order.items.map((item: any) => ({
      id: item.productId,
      price: Math.round(item.price),
      quantity: item.quantity,
      name: item.product.name.substring(0, 50)
    }));

    // Tambahkan PPN sebagai item baris tersendiri
    itemDetails.push({
      id: "VAT-11",
      price: vat,
      quantity: 1,
      name: "PPN (11%)"
    });

    // Tambahkan Biaya Pengiriman sebagai item baris tersendiri
    itemDetails.push({
      id: "SHIPPING-FEE",
      price: shippingFee,
      quantity: 1,
      name: "Biaya Pengiriman & Asuransi"
    });

    // Persiapkan payload transaksi Midtrans
    const transactionDetails = {
      transaction_details: {
        order_id: `${order.orderNumber}-${Date.now()}`,
        gross_amount: grossAmount
      },
      item_details: itemDetails,
      customer_details: {
        first_name: order.institution.name.substring(0, 50),
        email: order.createdBy.email,
        phone: order.createdBy.phone || "08123456789"
      },
      credit_card: {
        secure: true
      }
    };

    if (!snap) {
      throw new Error("SDK Midtrans tidak terinisialisasi");
    }

    const transaction = await snap.createTransaction(transactionDetails);

    return {
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url
    };
  } catch (error: any) {
    console.error("Gagal mendapatkan Snap Token:", error);
    return { success: false, error: error.message || "Gagal membuat transaksi ke Midtrans" };
  }
}

export async function handlePaymentSuccess(orderId: string) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return { success: false, error: "Akses ditolak: Anda belum masuk" };
    }

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID" }
    });

    if (updatedOrder.institutionId) {
      await recalculateInstitutionDebt(db, updatedOrder.institutionId);
    }

    revalidatePath("/customer/dashboard");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Gagal memperbarui status pembayaran:", error);
    return { success: false, error: error.message };
  }
}
