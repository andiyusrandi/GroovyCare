"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";
import { parseFullAddress } from "@/lib/address-parser";

// Helper untuk verifikasi session & role
async function getActiveUser() {
  const session = await getSession();
  if (!session) {
    throw new Error("Akses ditolak: Anda belum login");
  }
  return session;
}

function calculateOrderTotals(order: {
  items: Array<{ price: number; quantity: number; product?: { category?: string } }>;
  shippingAddress: string;
}) {
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vat = Math.round(subtotal * 0.11);
  
  const addr = order.shippingAddress || "";
  const feeMatch = addr.match(/-\s*Rp\s*([0-9.,]+)/);
  let shippingFee = 0;
  if (feeMatch && feeMatch[1]) {
    shippingFee = parseInt(feeMatch[1].replace(/[.,]/g, ""), 10) || 0;
  } else if (addr.includes("Kurir: Standard Flat Rate")) {
    const isColdChain = order.items.some(item => 
      item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain"
    );
    shippingFee = isColdChain ? 85000 : 50000;
  } else {
    shippingFee = 50000;
  }

  const total = subtotal + vat + shippingFee;
  return { subtotal, vat, shippingFee, total };
}

// 1. Checkout Order (Customer Portal)
export async function checkoutOrder(
  items: { productId: string; quantity: number }[],
  spSignature: string,
  paymentMethod: "VA" | "TOP" | "INVOICE" | "COD" = "VA",
  shippingAddress?: string
) {
  try {
    const session = await getActiveUser();
    if (session.role !== "CUSTOMER_USER" || !session.institutionId) {
      return { success: false, error: "Akses ditolak: Hanya Pelanggan yang dapat melakukan checkout" };
    }

    // Ambil data User & Institution lengkap untuk validasi CDOB
    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { institution: true },
    });

    if (!user || !user.institution) {
      return { success: false, error: "Data institusi tidak ditemukan" };
    }

    const checkAddress = shippingAddress || user.institution.address || "";
    if (
      !checkAddress ||
      checkAddress.includes("Alamat belum dilengkapi") ||
      checkAddress.includes("lengkapi di Pengaturan") ||
      checkAddress.trim().length < 5
    ) {
      return {
        success: false,
        error: "Alamat pengiriman belum dilengkapi. Silakan lengkapi alamat di Pengaturan Akun atau pilih alamat pengiriman yang valid.",
      };
    }

    if (paymentMethod === "COD") {
      return { success: false, error: "Metode pembayaran COD saat ini sedang dikunci/dikembangkan. Silakan gunakan Virtual Account (VA) atau Tempo (TOP)." };
    }

    const today = new Date();

    // CDOB VALIDATION 1: Apakah Apotek Aktif?
    if (!user.institution.isActive) {
      return { success: false, error: "Akun Apotek Anda belum aktif atau sedang dinonaktifkan oleh PBF" };
    }

    // CDOB VALIDATION 2: Apakah Izin SIA Masih Berlaku?
    if (new Date(user.institution.siaExpiry) <= today && new Date(user.institution.siaExpiry).getFullYear() < 2090) {
      return {
        success: false,
        error: `Izin SIA Apotek Anda sudah kedaluwarsa sejak tanggal ${new Date(
          user.institution.siaExpiry
        ).toLocaleDateString("id-ID")}. Pemesanan diblokir sesuai aturan CDOB BPOM.`,
      };
    }

    // CDOB VALIDATION 3: Apakah SIPA Apoteker Masih Berlaku?
    if (!user.sipaNumber || !user.sipaExpiry) {
      return {
        success: false,
        error: "Nomor SIPA atau tanggal kedaluwarsa SIPA Apoteker belum diisi. Pemesanan diblokir.",
      };
    }
    if (new Date(user.sipaExpiry) <= today) {
      return {
        success: false,
        error: `Izin SIPA Apoteker (${user.name}) sudah kedaluwarsa sejak tanggal ${new Date(
          user.sipaExpiry
        ).toLocaleDateString("id-ID")}. Pemesanan diblokir sesuai aturan CDOB BPOM.`,
      };
    }

    // Ambil detail produk untuk hitung harga
    const productIds = items.map((i) => i.productId);
    const dbProducts = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    let totalOrderValue = 0;
    const orderItemsData = items.map((item) => {
      const p = dbProducts.find((dbP: any) => dbP.id === item.productId);
      if (!p) throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan`);
      const itemTotal = p.price * item.quantity;
      totalOrderValue += itemTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: p.price,
      };
    });

    // Hitung total tagihan riil (Subtotal + PPN + Shipping) untuk dicarry ke limit kredit
    const finalAddr = shippingAddress || user.institution.address;
    const { total: totalBillingValue } = calculateOrderTotals({
      items: orderItemsData,
      shippingAddress: finalAddr
    });

    // CREDIT LIMIT CHECK: Apakah total tagihan melebihi limit kredit? (Hanya untuk TOP/INVOICE)
    if ((paymentMethod as string) !== "VA" && (paymentMethod as string) !== "COD") {
      const remainingCredit = user.institution.creditLimit - user.institution.currentDebt;
      if (totalBillingValue > remainingCredit) {
        return {
          success: false,
          error: `Pemesanan gagal: Total tagihan Rp ${totalBillingValue.toLocaleString(
            "id-ID"
          )} (termasuk PPN & ongkir) melebihi sisa limit kredit Anda (Tersedia: Rp ${remainingCredit.toLocaleString(
            "id-ID"
          )}).`,
        };
      }
    }

    // Generate Order Number: SP-YYYYMMDD-XXXX
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const count = await db.order.count({
      where: {
        orderNumber: {
          startsWith: `SP-${dateStr}`,
        },
      },
    });
    const orderNumber = `SP-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    // Buat Order di Database (Menunggu CDOB Approval)
    const newOrder = await db.order.create({
      data: {
        orderNumber,
        institutionId: user.institutionId as string,
        createdById: user.id,
        spSignature,
        status: "PENDING_APPROVAL",
        shippingAddress: shippingAddress || user.institution.address,
        paymentStatus: "UNPAID",
        paymentMethod,
        items: {
          create: orderItemsData,
        },
      },
    });

    revalidatePath("/customer/dashboard");
    return { success: true, orderNumber, orderId: newOrder.id };
  } catch (error: any) {
    console.error("Checkout error:", error);
    return { success: false, error: error.message || "Terjadi kesalahan saat checkout" };
  }
}

// Helper internal untuk auto-confirm pesanan yang sudah melewati SLA 1x24 jam (Database Cepat & Non-blocking)
async function autoConfirmShippedOrders() {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Jalankan update database cepat secara kolektif
    await db.order.updateMany({
      where: {
        status: "SHIPPED",
        OR: [
          { shippingDate: { lte: twentyFourHoursAgo } },
          { shippingDate: null, updatedAt: { lte: twentyFourHoursAgo } },
        ],
      },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
        autoConfirmed: true,
      } as any,
    });
  } catch (e) {
    console.error("Auto-confirm SLA background error:", e);
  }
}

// 2. Mengambil Pesanan
export async function getOrders() {
  try {
    const session = await getActiveUser();

    // Jalankan auto-confirm SLA 1x24 jam untuk pesanan yang menggantung
    await autoConfirmShippedOrders();

    if (session.role === "PBF_ADMIN" || session.role === "SYSTEM_ADMIN") {
      return await db.order.findMany({
        include: {
          institution: true,
          createdBy: true,
          items: {
            include: { product: true },
          },
          batchAllocations: {
            include: { batch: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      if (!session.institutionId) {
        return [];
      }
      return await db.order.findMany({
        where: { institutionId: session.institutionId },
        include: {
          institution: true,
          createdBy: true,
          items: {
            include: { product: true },
          },
          batchAllocations: {
            include: { batch: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (error: any) {
    throw new Error("Gagal mengambil data pesanan: " + error.message);
  }
}

// 3. Persetujuan CDOB & Alokasi Stok FEFO (PBF Admin Portal)
export async function approveOrderCDOB(orderId: string) {
  try {
    const session = await getActiveUser();
    if (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN") {
      return { success: false, error: "Akses ditolak: Hanya PBF Admin atau System Admin yang berwenang menyetujui SP" };
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        institution: true,
        createdBy: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    if (order.status !== "PENDING_APPROVAL") {
      return { success: false, error: "Pesanan ini sudah diproses atau dibatalkan sebelumnya" };
    }

    const today = new Date();

    // VALIDASI CDOB GANDA: Cek legalitas saat pesanan disetujui
    if (new Date(order.institution.siaExpiry) <= today && new Date(order.institution.siaExpiry).getFullYear() < 2090) {
      return { success: false, error: "Persetujuan ditolak: Izin SIA apotek ini sudah kedaluwarsa" };
    }
    if (order.createdBy.sipaExpiry && new Date(order.createdBy.sipaExpiry) <= today) {
      return { success: false, error: "Persetujuan ditolak: Izin SIPA apoteker pemesan sudah kedaluwarsa" };
    }

    // ALOKASI FEFO & POTONG STOK
    const allocationsToCreate: { batchId: string; productId: string; quantity: number }[] = [];
    const batchUpdates: { batchId: string; newStock: number }[] = [];

    for (const item of order.items) {
      let remainingNeeded = item.quantity;

      // Ambil batch produk yang belum expired (expiryDate > today) dan stock > 0, urutkan dari yang paling dekat expirednya (FEFO)
      const batches = await db.batch.findMany({
        where: {
          productId: item.productId,
          expiryDate: { gt: today },
          stock: { gt: 0 },
        },
        orderBy: {
          expiryDate: "asc",
        },
      });

      const totalAvailable = batches.reduce((sum: number, b: any) => sum + b.stock, 0);
      if (totalAvailable < remainingNeeded) {
        return {
          success: false,
          error: `Persetujuan ditolak: Stok obat ${item.product.name} tidak mencukupi untuk memenuhi alokasi FEFO. Butuh: ${remainingNeeded}, Tersedia: ${totalAvailable}`,
        };
      }

      for (const batch of batches) {
        if (remainingNeeded <= 0) break;

        const allocatedQty = Math.min(batch.stock, remainingNeeded);
        allocationsToCreate.push({
          batchId: batch.id,
          productId: item.productId,
          quantity: allocatedQty,
        });

        batchUpdates.push({
          batchId: batch.id,
          newStock: batch.stock - allocatedQty,
        });

        remainingNeeded -= allocatedQty;
      }
    }

    // Jalankan transaksi database untuk mengupdate batch stock dan menyimpan alokasi
    await db.$transaction(async (tx: any) => {
      // 1. Kurangi stok batch obat
      for (const update of batchUpdates) {
        await tx.batch.update({
          where: { id: update.batchId },
          data: { stock: update.newStock },
        });
      }

      // 2. Catat data alokasi batch untuk pesanan ini
      for (const alloc of allocationsToCreate) {
        await tx.orderBatchAllocation.create({
          data: {
            orderId: order.id,
            batchId: alloc.batchId,
            quantity: alloc.quantity,
          },
        });
      }

      // 3. Catat log transaksi stok keluar (OUT_SALE)
      for (const alloc of allocationsToCreate) {
        await tx.stockTransaction.create({
          data: {
            productId: alloc.productId,
            batchId: alloc.batchId,
            type: "OUT_SALE",
            quantity: alloc.quantity,
            referenceNumber: order.orderNumber,
            sourceTargetId: order.institutionId,
            sourceTargetName: order.institution.name,
          },
        });
      }

      // 4. Update status order menjadi PENDING_SHIPPING
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PENDING_SHIPPING",
          approvedById: session.userId,
          approvedAt: today,
        },
      });

      // 5. Rekalkulasi hutang apotek berjalan secara otomatis dari database
      await recalculateInstitutionDebt(tx, order.institutionId);
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true, message: "Dokumen SP tervalidasi CDOB, stok FEFO berhasil dialokasikan" };
  } catch (error: any) {
    console.error("Approval error:", error);
    return { success: false, error: error.message || "Gagal memproses persetujuan pesanan" };
  }
}

// Helper internal untuk membatalkan pesanan langsung ke Biteship API
async function cancelBiteshipDirect(biteshipOrderId: string, reason: string) {
  try {
    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey || !biteshipOrderId) return { success: false, error: "No API Key or Biteship Order ID" };

    const res = await fetch(`https://api.biteship.com/v1/orders/${biteshipOrderId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cancellation_reason_code: "others",
        cancellation_reason: reason || "Dibatalkan oleh PBF / Mitra",
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn("Biteship order cancellation error:", errData);
      return { success: false, error: errData.message || "Gagal membatalkan di Biteship API" };
    }

    const data = await res.json();
    console.log(`Biteship order ${biteshipOrderId} cancelled successfully on Biteship API.`);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error cancelling Biteship order:", error);
    return { success: false, error: error.message };
  }
}

// 4. Penolakan / Pembatalan Pesanan (PBF Admin Portal)
export async function rejectOrder(orderId: string, reason: string) {
  try {
    const session = await getActiveUser();
    if (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN") {
      return { success: false, error: "Akses ditolak" };
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        institution: true,
        batchAllocations: {
          include: {
            batch: true,
          },
        },
        items: true,
      },
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    // Jika terhubung dengan Biteship, batalkan pengiriman di Biteship API
    const biteshipId = (order as any).biteshipOrderId;
    if (biteshipId) {
      await cancelBiteshipDirect(biteshipId, reason || "Dibatalkan oleh Admin PBF");
    }

    // Jika pesanan sudah disetujui sebelumnya, kembalikan stok dan debt
    const isApprovedBefore = order.status !== "PENDING_APPROVAL" && order.status !== "REJECTED";

    await db.$transaction(async (tx: any) => {
      if (order.batchAllocations && order.batchAllocations.length > 0) {
        // 1. Kembalikan stok batch obat
        for (const alloc of order.batchAllocations) {
          await tx.batch.update({
            where: { id: alloc.batchId },
            data: {
              stock: { increment: alloc.quantity },
            },
          });
        }

        // Hapus log transaksi StockTransaction untuk order ini
        await tx.stockTransaction.deleteMany({
          where: {
            referenceNumber: order.orderNumber,
          },
        });

        // 2. Hapus alokasi batch karena pesanan dibatalkan/ditolak
        await tx.orderBatchAllocation.deleteMany({
          where: { orderId: order.id },
        });
      }

      // 3. Update status order menjadi REJECTED
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
        },
      });

      // 4. Rekalkulasi hutang apotek berjalan secara otomatis dari database
      await recalculateInstitutionDebt(tx, order.institutionId);
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true, message: "Pesanan berhasil dibatalkan/ditolak dan status diperbarui di Biteship" };
  } catch (error: any) {
    console.error("Reject order error:", error);
    return { success: false, error: error.message || "Gagal membatalkan pesanan" };
  }
}

export async function deleteOrder(orderId: string) {
  try {
    const session = await getActiveUser();
    if (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN") {
      return { success: false, error: "Akses ditolak" };
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        institution: true,
        batchAllocations: {
          include: {
            batch: true,
          },
        },
        items: true,
      },
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    // Jika pesanan terhubung dengan Biteship, batalkan di Biteship API sebelum menghapus dari DB
    const biteshipId = (order as any).biteshipOrderId;
    if (biteshipId) {
      await cancelBiteshipDirect(biteshipId, "Pesanan dihapus dari sistem oleh Admin PBF");
    }

    const isApprovedBefore = order.status !== "PENDING_APPROVAL" && order.status !== "REJECTED";

    await db.$transaction(async (tx: any) => {
      if (order.batchAllocations && order.batchAllocations.length > 0) {
        // 1. Kembalikan stok batch obat
        for (const alloc of order.batchAllocations) {
          await tx.batch.update({
            where: { id: alloc.batchId },
            data: {
              stock: { increment: alloc.quantity },
            },
          });
        }

        // Hapus log transaksi StockTransaction untuk order ini (karena dihapus)
        await tx.stockTransaction.deleteMany({
          where: {
            OR: [
              { referenceNumber: order.orderNumber },
              { referenceNumber: `RET-${order.orderNumber}` }
            ]
          },
        });
      }

      // 2. Hapus order (akan menghapus item & allocations via Cascade)
      await tx.order.delete({
        where: { id: orderId },
      });

      // 3. Rekalkulasi hutang apotek berjalan secara otomatis dari database
      await recalculateInstitutionDebt(tx, order.institutionId);
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true, message: "Pesanan berhasil dihapus secara permanen" };
  } catch (error: any) {
    console.error("Delete order error:", error);
    return { success: false, error: error.message || "Gagal menghapus pesanan" };
  }
}

// 4.b Hapus Massal Pesanan (Bulk Delete Orders)
export async function deleteBulkOrders(orderIds: string[]) {
  try {
    const session = await getActiveUser();
    if (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN") {
      return { success: false, error: "Akses ditolak" };
    }

    if (!orderIds || orderIds.length === 0) {
      return { success: false, error: "Tidak ada pesanan yang dipilih untuk dihapus" };
    }

    const orders = await db.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        batchAllocations: true,
      },
    });

    if (orders.length === 0) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    // Batal pesanan di Biteship jika ada
    for (const order of orders) {
      const biteshipId = (order as any).biteshipOrderId;
      if (biteshipId) {
        await cancelBiteshipDirect(biteshipId, "Pesanan dihapus massal dari sistem oleh Admin PBF").catch(() => {});
      }
    }

    const affectedInstitutionIds = new Set<string>();

    await db.$transaction(async (tx: any) => {
      for (const order of orders) {
        affectedInstitutionIds.add(order.institutionId);

        if (order.batchAllocations && order.batchAllocations.length > 0) {
          for (const alloc of order.batchAllocations) {
            await tx.batch.update({
              where: { id: alloc.batchId },
              data: { stock: { increment: alloc.quantity } },
            });
          }

          await tx.stockTransaction.deleteMany({
            where: {
              OR: [
                { referenceNumber: order.orderNumber },
                { referenceNumber: `RET-${order.orderNumber}` }
              ]
            },
          });
        }
      }

      // Hapus massal seluruh pesanan terpilih
      await tx.order.deleteMany({
        where: { id: { in: orderIds } },
      });

      // Rekalkulasi hutang apotek berjalan secara otomatis untuk setiap apotek
      for (const instId of Array.from(affectedInstitutionIds)) {
        await recalculateInstitutionDebt(tx, instId);
      }
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true, count: orders.length, message: `${orders.length} pesanan berhasil dihapus massal` };
  } catch (error: any) {
    console.error("Delete bulk orders error:", error);
    return { success: false, error: error.message || "Gagal menghapus pesanan massal" };
  }
}

// 5. Kirim Barang & Update Resi (PBF Admin Portal)
export async function shipOrder(orderId: string, trackingNumber: string) {
  try {
    const session = await getActiveUser();
    if (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN") {
      return { success: false, error: "Akses ditolak" };
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        institution: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    // Attempt to book courier via BiteShip
    const apiKey = process.env.BITESHIP_API_KEY;
    const addr = order.shippingAddress || "";
    let biteshipOrderId: string | null = null;

    if (apiKey) {
      try {
        const mainAddrPart = addr.split(" | ")[0] || "";
        const emailPart = addr.match(/Email:\s*([^\s|]+)/)?.[1] || "";
        const phonePart = addr.match(/Telp:\s*([^\s|]+)/)?.[1] || "";

        const combinedAddrText = `${addr} ${order.institution.address || ""}`;
        const parsedAddr = parseFullAddress(combinedAddrText);

        let addressDetail = (parsedAddr.detail || addr)
          .split(" (Penerima:")[0]
          .split(" | ")[0]
          .replace(/^Alamat:\s*/i, "")
          .trim();

        const kelurahan = parsedAddr.village;
        const kecamatan = parsedAddr.district;
        const kota = parsedAddr.regency;
        const provinsi = parsedAddr.province;
        const pos = parsedAddr.postalCode;

        const cleanDestinationAddress = [
          addressDetail,
          kelurahan ? `Kel. ${kelurahan}` : "",
          kecamatan ? `Kec. ${kecamatan}` : "",
          kota,
          provinsi,
          pos
        ].filter(Boolean).join(", ");

        // 1. Check if explicit [code: company:service_type] tag is present
        const codeMatch = addr.match(/\[code:\s*([^:]+):([^\]]+)\]/i);
        let courierCompany = "";
        let courierType = "";

        if (codeMatch) {
          courierCompany = codeMatch[1].toLowerCase().trim();
          courierType = codeMatch[2].toLowerCase().trim();
        } else {
          const courierPart = addr.match(/Kurir:\s*([^\s]+)\s+([^\s(|]+)/i);
          const rawCompany = (courierPart?.[1] || "jne").toLowerCase().trim();
          const rawType = (courierPart?.[2] || "reg").toLowerCase().trim();

          // Normalize company slug
          if (rawCompany.includes("jne")) courierCompany = "jne";
          else if (rawCompany.includes("tiki")) courierCompany = "tiki";
          else if (rawCompany.includes("sicepat")) courierCompany = "sicepat";
          else if (rawCompany.includes("j&t") || rawCompany.includes("jnt")) courierCompany = "jnt";
          else if (rawCompany.includes("anter")) courierCompany = "anteraja";
          else if (rawCompany.includes("pos")) courierCompany = "pos";
          else if (rawCompany.includes("groovyrx") || rawCompany.includes("logistik")) courierCompany = "custom";
          else courierCompany = rawCompany;

          // Normalize service type slug for each company based on Biteship API specification
          if (courierCompany === "jnt") {
            courierType = "ez";
          } else if (courierCompany === "tiki") {
            if (rawType.includes("sds") || rawType.includes("same")) courierType = "sds";
            else if (rawType.includes("ons") || rawType.includes("night") || rawType.includes("one")) courierType = "ons";
            else if (rawType.includes("eco")) courierType = "eco";
            else courierType = "reg";
          } else if (courierCompany === "jne") {
            if (rawType.includes("yes") || rawType.includes("esok")) courierType = "yes";
            else if (rawType.includes("jtr") || rawType.includes("truck")) courierType = "jtr";
            else if (rawType.includes("ss") || rawType.includes("super")) courierType = "ss";
            else courierType = "reg";
          } else if (courierCompany === "sicepat") {
            if (rawType.includes("best")) courierType = "best";
            else if (rawType.includes("gokil") || rawType.includes("kargo")) courierType = "gokil";
            else if (rawType.includes("halu")) courierType = "reg"; // SiCepat Halu di API Biteship adalah tipe 'reg'
            else courierType = "reg";
          } else if (courierCompany === "anteraja") {
            if (rawType.includes("next")) courierType = "nextday";
            else if (rawType.includes("same")) courierType = "sameday";
            else courierType = "reg";
          } else if (courierCompany === "custom") {
            courierType = "same_day";
          } else {
            if (rawType === "reguler" || rawType === "regular" || rawType === "standard") courierType = "reg";
            else courierType = rawType;
          }
        }

        // Biteship valid courier slug check: convert custom/groovyrx to standard JNE REG for Biteship API booking
        const validBiteshipCouriers = ["jne", "tiki", "sicepat", "jnt", "anteraja", "pos", "lion", "ninja", "grab", "gojek"];
        if (!validBiteshipCouriers.includes(courierCompany.toLowerCase())) {
          courierCompany = "jne";
          courierType = "reg";
        }

        let destinationAreaId = "";
        let areaPostalCode = "";

        const cleanCity = (kota || "").replace(/KABUPATEN\s+|KOTA\s+/i, "").trim();
        const cleanDist = (kecamatan || "").replace(/\(Desa\/Kel:.*?\)/i, "").trim();

        const searchQueries = [
          `${cleanDist}, ${cleanCity}`,
          `${cleanDist}, ${cleanCity}, ${provinsi}`,
          `${cleanCity}, ${provinsi}`
        ].filter(Boolean);

        for (const query of searchQueries) {
          try {
            const destRes = await fetch(`https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(query)}`, {
              headers: { Authorization: apiKey }
            });
            if (destRes.ok) {
              const destData = await destRes.json();
              if (destData.areas && destData.areas.length > 0) {
                const isDestMakassar = cleanCity.toLowerCase().includes("makassar");

                const matchedArea = destData.areas.find((a: any) => {
                  const nameLower = (a.name || "").toLowerCase();
                  
                  // Disqualify Makassar area entries if destination is NOT Makassar
                  if (!isDestMakassar && (nameLower.includes("makassar") || a.id.includes("IDNC182") || a.id.includes("IDND2571"))) {
                    return false;
                  }

                  const matchesDist = cleanDist && cleanDist.length > 2 && nameLower.includes(cleanDist.toLowerCase());
                  const matchesCity = cleanCity && cleanCity.length > 2 && nameLower.includes(cleanCity.toLowerCase());

                  return matchesDist || matchesCity;
                });

                if (matchedArea) {
                  destinationAreaId = matchedArea.id;
                  const match = (matchedArea.name || "").match(/\b\d{5}\b/);
                  if (match) {
                    areaPostalCode = match[0];
                  }
                  break;
                }
              }
            }
          } catch (e) {
            console.warn(`Biteship destination area search error for '${query}':`, e);
          }
        }

        let originAreaId = "IDNP28IDNC248IDND2571";
        const originRes = await fetch(`https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent("Tamalanrea, Makassar, 90245")}`, {
          headers: { Authorization: apiKey }
        });
        if (originRes.ok) {
          const originData = await originRes.json();
          if (originData.areas && originData.areas.length > 0) {
            originAreaId = originData.areas[0].id;
          }
        }

        const orderItems = order.items.map((it: any) => ({
          name: it.product.name,
          description: it.product.description || it.product.name || "Obat-obatan PBF",
          quantity: it.quantity,
          value: Math.max(10000, Math.round(it.price || it.product?.price || 10000)),
          weight: 500,
          category: "others",
        }));

        const isCOD = order.paymentMethod === "COD";
        const codAmount = isCOD
          ? Math.round(order.items.reduce((acc: number, it: any) => acc + (it.price || 10000) * it.quantity, 0))
          : 0;

        // Standardize phone number format (must start with 08 or 62 and at least 10 digits for Biteship validation)
        let cleanPhone = (phonePart || order.institution.siaNumber || "08123456789").replace(/\D/g, "");
        if (!cleanPhone.startsWith("08") && !cleanPhone.startsWith("62")) {
          cleanPhone = "08123456789";
        }
        const validDestinationPhone = cleanPhone.length >= 10 ? cleanPhone : "08123456789";

        let rawCode = parseInt((pos || "").replace(/\D/g, "")) || (areaPostalCode ? parseInt(areaPostalCode) : 92811);
        const resolvedPostalCode = !isNaN(rawCode) && rawCode >= 10000 ? rawCode : 92811;

        const biteshipPayload: any = {
          shipper_contact_name: "PBF GroovyCare",
          shipper_contact_phone: "08123456789",
          shipper_contact_email: "admin@groovycare.com",
          shipper_organization: "PBF GroovyCare",
          origin_contact_name: "PBF GroovyCare",
          origin_contact_phone: "08123456789",
          origin_address: "Jl. Tamalanrea Raya Ruko Pelangi Blok B No 7, Kelurahan Buntusu, Kecamatan Tamalanrea, Kota Makassar",
          origin_postal_code: 90245,
          origin_area_id: originAreaId || "IDNP28IDNC248IDND2571",
          destination_contact_name: order.institution.name,
          destination_contact_phone: validDestinationPhone,
          destination_contact_email: emailPart || "apotek.sehat@groovycare.com",
          destination_address: cleanDestinationAddress,
          destination_postal_code: resolvedPostalCode,
          ...(destinationAreaId ? { destination_area_id: destinationAreaId } : {}),
          ...(isCOD ? {
            destination_cash_on_delivery: codAmount,
            destination_cash_on_delivery_type: "7_days"
          } : {}),
          courier_company: courierCompany,
          courier_type: courierType,
          delivery_type: "now",
          reference_id: order.orderNumber,
          items: orderItems,
          order_note: `Pesanan SP: ${order.orderNumber}`
        };

        const validationErrors: string[] = [];
        if (!biteshipPayload.destination_address || biteshipPayload.destination_address.length < 10) {
          validationErrors.push("Alamat tujuan pengiriman kurang lengkap (< 10 karakter)");
        }
        if (!biteshipPayload.destination_contact_phone || biteshipPayload.destination_contact_phone.length < 10) {
          validationErrors.push("Nomor kontak penerima kurang dari 10 digit");
        }
        if (!biteshipPayload.items || biteshipPayload.items.length === 0) {
          validationErrors.push("Item pesanan tidak ditemukan");
        }
        if (isNaN(biteshipPayload.destination_postal_code) || biteshipPayload.destination_postal_code < 10000) {
          validationErrors.push("Kode pos tujuan tidak valid");
        }

        let biteshipOrderRes = await fetch("https://api.biteship.com/v1/orders", {
          method: "POST",
          headers: {
            Authorization: apiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(biteshipPayload)
        });

        // Retry 1: Jika area_id menyebabkan error (e.g. 40002021 atau Failed getting rates), retry 1x tanpa area_id menggunakan pencocokan kode pos murni
        if (!biteshipOrderRes.ok && (biteshipPayload.origin_area_id || biteshipPayload.destination_area_id)) {
          const errPreview = await biteshipOrderRes.clone().json().catch(() => ({}));
          console.warn(`[DEBUG BITESHIP CREATION FAILED WITH AREA ID]:`, errPreview);
          console.warn(`Retrying '${courierCompany}:${courierType}' with pure postal codes (90245 -> ${resolvedPostalCode})...`);
          delete biteshipPayload.origin_area_id;
          delete biteshipPayload.destination_area_id;
          biteshipOrderRes = await fetch("https://api.biteship.com/v1/orders", {
            method: "POST",
            headers: {
              Authorization: apiKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(biteshipPayload)
          });
        }

        if (biteshipOrderRes.ok) {
          const biteshipOrderData = await biteshipOrderRes.json();
          console.log("[DEBUG BITESHIP SUCCESS RESPONSE]:", biteshipOrderData);
          if (biteshipOrderData.id) {
            biteshipOrderId = biteshipOrderData.id;
          }
          const bWaybill = biteshipOrderData.courier?.waybill_id || biteshipOrderData.courier?.tracking_id || biteshipOrderData.id;
          if (bWaybill) {
            trackingNumber = bWaybill;
          }
        } else {
          const errData = await biteshipOrderRes.json().catch(() => ({}));
          const biteshipErrMessage = errData.error || errData.message || "Gagal booking ekspedisi Biteship";
          console.error("[DEBUG BITESHIP ERROR RESPONSE]:", JSON.stringify(errData, null, 2));

          // HENTIKAN PROSES DAN TAMPILKAN PERINGATAN KETAT (TIDAK BISA LANJUT SEBELUM DIPERBAIKI)
          return {
            success: false,
            error: `[PERINGATAN LOGISTIK BITESHIP]: Gagal memproses booking ekspedisi (${courierCompany.toUpperCase()} ${courierType.toUpperCase()}). Alasan Biteship: "${biteshipErrMessage}". Silakan periksa kelengkapan alamat apotek mitra atau sesuaikan pilihan kurir sebelum melanjutkan ke tahap pengiriman.`
          };
        }
      } catch (err: any) {
        console.error("Failed to book BiteShip courier:", err);
        return {
          success: false,
          error: `[PERINGATAN LOGISTIK BITESHIP]: Terjadi kesalahan saat menghubungi API Biteship: ${err.message}. Harap perbaiki koneksi atau data sebelum melanjutkan.`
        };
      }
    }

    const finalTrackingNumber = trackingNumber && trackingNumber.trim() !== "" ? trackingNumber : `BT-MANUAL-${Math.floor(100000 + Math.random() * 900000)}`;

    await db.order.update({
      where: { id: orderId },
      data: {
        status: "SHIPPED",
        trackingNumber: finalTrackingNumber,
        ...(biteshipOrderId ? { biteshipOrderId } : {}),
        shippingDate: new Date(),
      },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true, message: `Pesanan telah dikirim dengan nomor resi: ${finalTrackingNumber}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5b. Kirim Banyak Barang & Auto-Book Biteship Sekaligus (Bulk Shipping)
export async function bulkShipOrders(orderIds: string[]) {
  try {
    const session = await getActiveUser();
    if (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN") {
      return { success: false, error: "Akses ditolak: Hanya Admin yang diizinkan" };
    }

    if (!orderIds || orderIds.length === 0) {
      return { success: false, error: "Pilih minimal 1 pesanan untuk dikirim massal" };
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const id of orderIds) {
      const res = await shipOrder(id, "");
      if (res.success) {
        successCount++;
      } else {
        errors.push(res.error || `Gagal mengirim pesanan ID ${id}`);
      }
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");

    return {
      success: true,
      message: `${successCount} dari ${orderIds.length} pesanan berhasil di-booking ke kurir Biteship & diterbitkan resinya.`,
      successCount,
      errors,
    };
  } catch (error: any) {
    console.error("Bulk shipping error:", error);
    return { success: false, error: error.message || "Gagal memproses pengiriman massal" };
  }
}

// 6. Terima Barang (Customer Portal)
export async function confirmDelivery(orderId: string) {
  try {
    const session = await getActiveUser();
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, error: "Pesanan tidak ditemukan" };

    if (session.role !== "CUSTOMER_USER" || order.institutionId !== session.institutionId) {
      return { success: false, error: "Akses ditolak" };
    }

    await db.order.update({
      where: { id: orderId },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
      } as any,
    });

    revalidatePath("/customer/dashboard");
    return { success: true, message: "Konfirmasi penerimaan barang berhasil" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Unggah Bukti Pembayaran (Customer Portal)
export async function uploadPaymentProof(orderId: string, base64Image: string) {
  try {
    const session = await getActiveUser();
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, error: "Pesanan tidak ditemukan" };

    if (session.role !== "CUSTOMER_USER" || order.institutionId !== session.institutionId) {
      return { success: false, error: "Akses ditolak" };
    }

    await db.order.update({
      where: { id: orderId },
      data: {
        paymentProofUrl: base64Image,
        paymentStatus: "PENDING_VERIFICATION",
      },
    });

    revalidatePath("/customer/dashboard");
    return { success: true, message: "Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 8. Verifikasi Pembayaran (PBF Admin Portal)
export async function verifyPayment(orderId: string, approve: boolean) {
  try {
    const session = await getActiveUser();
    if (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN") {
      return { success: false, error: "Akses ditolak" };
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        institution: true,
      },
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    if (approve) {
      const orderTotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

      await db.$transaction(async (tx: any) => {
        // 1. Set status pembayaran lunas
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
          },
        });

        // 2. Rekalkulasi hutang apotek berjalan secara otomatis dari database
        await recalculateInstitutionDebt(tx, order.institutionId);
      });

      revalidatePath("/admin/dashboard");
      revalidatePath("/customer/dashboard");
      return { success: true, message: "Bukti pembayaran disetujui, tagihan lunas dan limit kredit mitra pulih." };
    } else {
      // Tolak bukti bayar
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "UNPAID",
          paymentProofUrl: null, // Hapus bukti bayar yang tidak valid
        },
      });

      revalidatePath("/admin/dashboard");
      revalidatePath("/customer/dashboard");
      return { success: true, message: "Bukti pembayaran ditolak. Status tagihan kembali belum lunas." };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function recalculateInstitutionDebt(tx: any, institutionId: string) {
  const activeOrders = await tx.order.findMany({
    where: {
      institutionId,
      status: { in: ["PENDING_SHIPPING", "SHIPPED", "DELIVERED"] },
      paymentMethod: { in: ["TOP", "INVOICE"] },
      paymentStatus: { not: "PAID" }
    },
    include: {
      items: {
        include: { product: true }
      }
    }
  });

  let totalDebt = 0;
  for (const order of activeOrders) {
    const { total } = calculateOrderTotals(order);
    totalDebt += total;
  }

  await tx.institution.update({
    where: { id: institutionId },
    data: {
      currentDebt: totalDebt
    }
  });
}

// Pembatalan Pesanan oleh Customer (Mitra) untuk status PENDING_APPROVAL
export async function cancelOrderByCustomer(orderId: string, reason: string) {
  try {
    const session = await getActiveUser();
    if (session.role !== "CUSTOMER_USER" || !session.institutionId) {
      return { success: false, error: "Akses ditolak: Hanya Pelanggan yang dapat membatalkan pesanan" };
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        institution: true,
        batchAllocations: {
          include: {
            batch: true,
          },
        },
        items: true,
      }
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    // Pastikan pesanan milik institusi customer yang login
    if (order.institutionId !== session.institutionId) {
      return { success: false, error: "Akses ditolak: Anda tidak berhak membatalkan pesanan ini" };
    }

    // Pembatalan mandiri hanya boleh dilakukan jika status masih PENDING_APPROVAL atau PENDING_SHIPPING
    if (order.status !== "PENDING_APPROVAL" && order.status !== "PENDING_SHIPPING") {
      return {
        success: false,
        error: "Pesanan yang sudah dikirim / selesai tidak dapat dibatalkan secara mandiri. Silakan hubungi Admin PBF."
      };
    }

    const cancelReasonText = reason.trim() 
      ? `Dibatalkan oleh Mitra: ${reason.trim()}` 
      : "Dibatalkan oleh Mitra (Tanpa Alasan)";

    // Jika pesanan terhubung dengan Biteship, batalkan di Biteship API
    const biteshipId = (order as any).biteshipOrderId;
    if (biteshipId) {
      await cancelBiteshipDirect(biteshipId, cancelReasonText);
    }

    await db.$transaction(async (tx: any) => {
      // 1. Kembalikan stok obat ke batch masing-masing
      if (order.batchAllocations && order.batchAllocations.length > 0) {
        for (const alloc of order.batchAllocations) {
          await tx.batch.update({
            where: { id: alloc.batchId },
            data: {
              stock: { increment: alloc.quantity },
            },
          });
        }

        // Hapus alokasi batch
        await tx.orderBatchAllocation.deleteMany({
          where: { orderId: order.id },
        });

        // Hapus log transaksi stok keluar untuk order ini
        await tx.stockTransaction.deleteMany({
          where: {
            referenceNumber: order.orderNumber,
          },
        });
      } else if (order.items && order.items.length > 0) {
        // Fallback: Jika alokasi batch belum tercatat, cari batch pertama dari tiap produk dan kembalikan stoknya
        for (const item of order.items) {
          const firstBatch = await tx.batch.findFirst({
            where: { productId: item.productId },
            orderBy: { expiryDate: "asc" },
          });

          if (firstBatch) {
            await tx.batch.update({
              where: { id: firstBatch.id },
              data: {
                stock: { increment: item.quantity },
              },
            });
          }
        }
      }

      // 2. Update status order menjadi CANCELLED & Biteship status menjadi cancelled
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          biteshipStatus: "cancelled",
          biteshipStatusLabel: "Dibatalkan oleh Mitra",
          rejectionReason: cancelReasonText
        }
      });

      // 3. Rekalkulasi sisa hutang / limit kredit mitra
      await recalculateInstitutionDebt(tx, order.institutionId);
    });

    revalidatePath("/customer/dashboard");
    revalidatePath("/admin/dashboard");
    revalidatePath("/");

    return { 
      success: true, 
      message: "Pesanan berhasil dibatalkan secara otomatis! Stok obat telah dikembalikan ke inventaris gudang dan status di Biteship telah diperbarui." 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 9. Pelunasan Manual (Admin)
export async function markOrderAsPaidManually(orderId: string) {
  try {
    const session = await getActiveUser();
    if (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN") {
      return { success: false, error: "Akses ditolak" };
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { institution: true },
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    await db.$transaction(async (tx: any) => {
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID" },
      });

      await recalculateInstitutionDebt(tx, order.institutionId);
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true, message: "Tagihan berhasil ditandai Lunas secara manual dan limit kredit dipulihkan." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

import { BITESHIP_STATUS_MAP, getBiteshipStatusMeta } from "@/lib/biteship-status";

// 12. Sinkronisasi & Lacak Live Biteship Order (GET /v1/orders/:id)
export async function syncBiteshipOrderStatus(orderId: string) {
  try {
    const order = await (db.order as any).findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, status: true, biteshipOrderId: true, trackingNumber: true, deliveredAt: true },
    });

    if (!order) return { success: false, error: "Pesanan tidak ditemukan" };

    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) return { success: false, error: "Biteship API Key belum dikonfigurasi" };

    const biteshipId = (order as any).biteshipOrderId;
    if (!biteshipId) return { success: false, error: "Tidak ada Biteship Order ID pada pesanan ini" };

    const res = await fetch(`https://api.biteship.com/v1/orders/${biteshipId}`, {
      method: "GET",
      headers: { Authorization: apiKey },
      cache: "no-store",
    });

    if (!res.ok) {
      return { success: false, error: "Gagal mengambil status dari Biteship API" };
    }

    const json = await res.json();
    const biteshipStatus = (json.status || "").toLowerCase();
    const trackingId = json.courier?.waybill_id || json.courier?.tracking_id;

    const statusMeta = BITESHIP_STATUS_MAP[biteshipStatus] || {
      label: biteshipStatus.toUpperCase(),
      description: "Status diperbarui dari Biteship API",
    };
    const statusFullText = `${statusMeta.label}: ${statusMeta.description}`;

    if (biteshipStatus === "delivered" && order.status !== "DELIVERED") {
      await db.order.update({
        where: { id: orderId },
        data: {
          status: "DELIVERED",
          deliveredAt: (order as any).deliveredAt || new Date(),
          autoConfirmed: true,
          biteshipStatus: biteshipStatus,
          biteshipStatusLabel: statusFullText,
          ...(trackingId ? { trackingNumber: trackingId } : {}),
        } as any,
      });

      revalidatePath("/customer/dashboard");
      revalidatePath("/admin/dashboard");
      return { success: true, status: "DELIVERED", biteshipStatus, message: "Status pesanan berhasil diperbarui ke DELIVERED (Selesai) dari Biteship API", data: json };
    } else {
      // Update biteshipStatus & label for ongoing/shipped/other statuses
      await db.order.update({
        where: { id: orderId },
        data: {
          ...(biteshipStatus === "picked" || biteshipStatus === "in_transit" || biteshipStatus === "dropping_off" || biteshipStatus === "allocated" || biteshipStatus === "picking_up"
            ? { status: "SHIPPED", shippingDate: (order as any).shippingDate || new Date() }
            : {}),
          biteshipStatus: biteshipStatus,
          biteshipStatusLabel: statusFullText,
          ...(trackingId ? { trackingNumber: trackingId } : {}),
        } as any,
      });

      revalidatePath("/customer/dashboard");
      revalidatePath("/admin/dashboard");
      return { success: true, status: order.status, biteshipStatus, biteshipStatusLabel: statusFullText, data: json };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getBiteshipOrderDetails(orderId: string) {
  try {
    const session = await getActiveUser();
    const syncRes = await syncBiteshipOrderStatus(orderId);
    if (!syncRes.success) {
      return syncRes;
    }
    return { success: true, data: syncRes.data, status: syncRes.status };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 12b. Live In-App Tracking Biteship API (GET /v1/trackings/:id or /v1/orders/:id)
export async function getBiteshipLiveTracking(orderId: string) {
  try {
    const session = await getActiveUser();
    const order = await (db.order as any).findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingNumber: true,
        biteshipOrderId: true,
        biteshipStatus: true,
        biteshipStatusLabel: true,
        shippingAddress: true,
        deliveredAt: true,
        shippingDate: true,
        approvedAt: true,
        createdAt: true,
        institution: { select: { name: true, address: true } },
      },
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Biteship API Key belum dikonfigurasi" };
    }

    const biteshipId = (order as any).biteshipOrderId;
    const resi = order.trackingNumber;

    if (!biteshipId && !resi) {
      return { success: false, error: "Pesanan ini belum memiliki resi atau ID Biteship" };
    }

    // Try fetching via /v1/trackings/:id first, fallback to /v1/orders/:id
    let res = resi
      ? await fetch(`https://api.biteship.com/v1/trackings/${resi}`, {
          method: "GET",
          headers: { Authorization: apiKey },
          cache: "no-store",
        })
      : null;

    if (!res || !res.ok) {
      if (biteshipId) {
        res = await fetch(`https://api.biteship.com/v1/orders/${biteshipId}`, {
          method: "GET",
          headers: { Authorization: apiKey },
          cache: "no-store",
        });
      }
    }

    if (!res || !res.ok) {
      return { success: false, error: "Gagal mengambil data pelacakan dari API Biteship" };
    }

    const rawData = await res.json();
    const trackingObj = rawData.object === "tracking" ? rawData : rawData;

    // Standardize courier and history (check all possible Biteship response properties)
    const courier = trackingObj.courier || rawData.courier || {};
    const historyRaw =
      trackingObj.history ||
      rawData.history ||
      rawData.courier?.history ||
      rawData.status_history ||
      rawData.trackings ||
      [];

    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
      confirmed: { label: "Dikonfirmasi", color: "blue", icon: "task_alt" },
      allocated: { label: "Kurir Dialokasikan", color: "blue", icon: "person_check" },
      picking_up: { label: "Kurir Menjemput", color: "amber", icon: "directions_run" },
      picked: { label: "Barang Diambil", color: "indigo", icon: "package_2" },
      in_transit: { label: "Dalam Perjalanan", color: "primary", icon: "local_shipping" },
      dropping_off: { label: "Mengantar ke Tujuan", color: "emerald", icon: "distance" },
      delivered: { label: "Terkirim", color: "emerald", icon: "check_circle" },
      on_hold: { label: "Ditangguhkan", color: "orange", icon: "warning" },
      disposed: { label: "Dimusnahkan", color: "red", icon: "delete_forever" },
      rejected: { label: "Ditolak Kurir", color: "red", icon: "cancel" },
      courier_not_found: { label: "Kurir Tidak Ditemukan", color: "red", icon: "search_off" },
      return_in_transit: { label: "Retur Dalam Perjalanan", color: "purple", icon: "replay" },
      returned: { label: "Dikembalikan", color: "purple", icon: "assignment_return" },
      cancelled: { label: "Dibatalkan", color: "gray", icon: "block" },
      pending: { label: "Sedang Diproses", color: "blue", icon: "hourglass_empty" },
    };

    const currentStatusCode = (
      trackingObj.status ||
      rawData.status ||
      (order as any).biteshipStatus ||
      order.status ||
      ""
    ).toLowerCase();

    const currentMeta = statusMap[currentStatusCode] || {
      label: currentStatusCode.toUpperCase(),
      color: "slate",
      icon: "info",
    };

    let formattedHistory = historyRaw.map((item: any) => {
      const stCode = (item.status || "").toLowerCase();
      const meta = statusMap[stCode] || { label: stCode, color: "slate", icon: "schedule" };
      return {
        status: stCode,
        label: meta.label,
        note: item.note || item.description || item.service_name || "",
        updatedAt: item.updated_at || item.created_at || new Date().toISOString(),
        icon: meta.icon,
        color: meta.color,
      };
    });

    // Fallback: If Biteship Sandbox returns an empty history array, construct steps from order metadata
    if (formattedHistory.length === 0) {
      formattedHistory = [
        {
          status: "confirmed",
          label: "Dikonfirmasi",
          note: "Pesanan dikonfirmasi & terdaftar di sistem Biteship",
          updatedAt: (order as any).approvedAt || order.createdAt,
          icon: "task_alt",
          color: "blue",
        },
      ];

      if (
        courier.driver_name ||
        courier.name ||
        ["allocated", "picking_up", "picked", "in_transit", "dropping_off", "delivered"].includes(currentStatusCode)
      ) {
        formattedHistory.push({
          status: "allocated",
          label: "Kurir Dialokasikan",
          note: `Kurir ${courier.company || courier.name || "Biteship"} (${courier.driver_name || courier.name || "Driver"}) ditugaskan. Plat: ${courier.driver_plate_number || "-"}`,
          updatedAt: (order as any).shippingDate || (order as any).approvedAt || order.createdAt,
          icon: "person_check",
          color: "blue",
        });
      }

      if (currentStatusCode !== "confirmed" && currentStatusCode !== "allocated") {
        formattedHistory.push({
          status: currentStatusCode,
          label: currentMeta.label,
          note: (order as any).biteshipStatusLabel || `Status pengiriman: ${currentMeta.label}`,
          updatedAt: (order as any).deliveredAt || (order as any).shippingDate || new Date().toISOString(),
          icon: currentMeta.icon,
          color: currentMeta.color,
        });
      }
    }

    // Auto sync cancellation if Biteship status indicates cancelled/rejected
    if (
      (currentStatusCode === "cancelled" ||
        currentStatusCode === "rejected" ||
        currentStatusCode === "courier_not_found" ||
        currentStatusCode === "disposed" ||
        currentStatusCode === "returned") &&
      order.status !== "REJECTED"
    ) {
      try {
        await rejectOrder(order.id, `Dibatalkan oleh Ekspedisi Biteship: ${currentMeta.label}`);
        await (db.order as any).update({
          where: { id: order.id },
          data: {
            biteshipStatus: currentStatusCode,
            biteshipStatusLabel: `Dibatalkan: ${currentMeta.label}`,
          },
        });
      } catch (e) {
        console.warn("Auto-reject inside getBiteshipTracking error:", e);
      }
    }

    return {
      success: true,
      tracking: {
        orderNumber: order.orderNumber,
        waybillId: trackingObj.waybill_id || trackingObj.courier_tracking_id || order.trackingNumber || "-",
        biteshipId: biteshipId || trackingObj.id,
        currentStatus: currentStatusCode,
        currentStatusLabel: currentMeta.label,
        currentStatusMeta: currentMeta,
        courier: {
          company: courier.company || courier.name || "Biteship Logistics",
          driverName: courier.driver_name || courier.name || "Kurir Biteship",
          driverPhone: courier.driver_phone || courier.phone || "-",
          driverPlateNumber: courier.driver_plate_number || "-",
        },
        originAddress: "PBF GroovyCare, Makassar",
        destinationAddress: order.institution?.address || order.shippingAddress,
        destinationName: order.institution?.name || "Apotek Pelanggan",
        history: formattedHistory,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 13. Update Biteship Order (POST /v1/orders/:id)
export async function updateBiteshipOrder(orderId: string, payload: any) {
  try {
    const session = await getActiveUser();
    if (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN") {
      return { success: false, error: "Akses ditolak" };
    }

    const order = await (db.order as any).findUnique({
      where: { id: orderId },
      select: { biteshipOrderId: true },
    });

    if (!order || !(order as any).biteshipOrderId) {
      return { success: false, error: "Pesanan ini belum terhubung dengan ID Biteship" };
    }

    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Biteship API key belum dikonfigurasi" };
    }

    const res = await fetch(`https://api.biteship.com/v1/orders/${(order as any).biteshipOrderId}`, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json();
      return { success: false, error: errData.message || "Gagal memperbarui pesanan di Biteship" };
    }

    const data = await res.json();
    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true, data, message: "Pesanan Biteship berhasil diperbarui" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 14. Cancel Biteship Order (POST /v1/orders/:id/cancel)
export async function cancelBiteshipOrder(orderId: string, reason?: string) {
  try {
    const session = await getActiveUser();
    if (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN") {
      return { success: false, error: "Akses ditolak" };
    }

    const order = await (db.order as any).findUnique({
      where: { id: orderId },
      select: { biteshipOrderId: true },
    });

    if (!order || !(order as any).biteshipOrderId) {
      return { success: false, error: "Pesanan ini belum terhubung dengan ID Biteship" };
    }

    const biteshipId = (order as any).biteshipOrderId;
    const cancelRes = await cancelBiteshipDirect(biteshipId, reason || "Dibatalkan oleh Admin PBF");
    if (!cancelRes.success) {
      return cancelRes;
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true, data: cancelRes.data, message: "Pengiriman Biteship berhasil dibatalkan" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 15. Retrieve Biteship Cancellation Reasons (GET /v1/orders/cancellation_reasons)
export async function getBiteshipCancellationReasons(lang: string = "id") {
  try {
    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) return { success: false, error: "Biteship API Key belum dikonfigurasi" };

    const res = await fetch(`https://api.biteship.com/v1/orders/cancellation_reasons?lang=${lang}`, {
      method: "GET",
      headers: { Authorization: apiKey },
      cache: "no-store",
    });

    if (!res.ok) {
      return { success: false, error: "Gagal mengambil daftar alasan pembatalan dari Biteship" };
    }

    const data = await res.json();
    return { success: true, cancellation_reasons: data.cancellation_reasons || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 16. Sync All Active Biteship Orders Status
export async function syncAllBiteshipOrders() {
  try {
    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) return { success: false, error: "No API Key" };

    const activeOrders = await (db.order as any).findMany({
      where: {
        status: { in: ["SHIPPED", "PENDING_SHIPPING"] },
        biteshipOrderId: { not: null },
      },
    });

    let updatedCount = 0;
    for (const order of activeOrders) {
      try {
        const res = await fetch(`https://api.biteship.com/v1/orders/${order.biteshipOrderId}`, {
          headers: { Authorization: apiKey },
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const st = (data.status || "").toLowerCase();
          if (st === "cancelled" || st === "rejected" || st === "courier_not_found" || st === "disposed" || st === "returned") {
            const reasonText = `Dibatalkan oleh Ekspedisi Biteship (${data.note || data.status || st})`;
            await rejectOrder(order.id, reasonText);
            await (db.order as any).update({
              where: { id: order.id },
              data: {
                biteshipStatus: st,
                biteshipStatusLabel: reasonText,
              },
            });
            updatedCount++;
          } else if (st === "delivered" && order.status !== "DELIVERED") {
            await (db.order as any).update({
              where: { id: order.id },
              data: {
                status: "DELIVERED",
                deliveredAt: new Date(),
                biteshipStatus: st,
                biteshipStatusLabel: "Terkirim: Paket diterima",
              },
            });
            updatedCount++;
          }
        }
      } catch (e) {
        console.warn(`Failed to sync Biteship order ${order.orderNumber}:`, e);
      }
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true, updatedCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function pushOrderToBiteship(orderId: string) {
  try {
    const session = await getActiveUser();
    if (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN") {
      return { success: false, error: "Akses ditolak" };
    }

    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) {
      return { success: false, error: "BITESHIP_API_KEY tidak dikonfigurasi" };
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        institution: true,
        items: { include: { product: true } }
      }
    });

    if (!order) {
      return { success: false, error: "Pesanan tidak ditemukan" };
    }

    const addr = order.shippingAddress || order.institution.address || "";
    const emailPart = addr.match(/Email:\s*([^\s|]+)/)?.[1] || "";
    const phonePart = addr.match(/Telp:\s*([^\s|]+)/)?.[1] || "";

    const combinedAddrText = `${addr} ${order.institution.address || ""}`;
    const parsedAddr = parseFullAddress(combinedAddrText);

    let addressDetail = parsedAddr.detail || "";
    if (!addressDetail || addressDetail.includes("| Kurir:")) {
      addressDetail = addr.split(" (Penerima:")[0].split(" | ")[0].replace(/^Alamat:\s*/i, "").trim();
    }

    const kelurahan = parsedAddr.village;
    const kecamatan = parsedAddr.district;
    const kota = parsedAddr.regency;
    const provinsi = parsedAddr.province;
    const pos = parsedAddr.postalCode;

    const cleanDestinationAddress = [
      addressDetail,
      kelurahan ? `Kel. ${kelurahan}` : "",
      kecamatan ? `Kec. ${kecamatan}` : "",
      kota,
      provinsi,
      pos
    ].filter(Boolean).join(", ");

    const codeMatch = addr.match(/\[code:\s*([^:]+):([^\]]+)\]/i);
    let courierCompany = "";
    let courierType = "";

    if (codeMatch) {
      courierCompany = codeMatch[1].toLowerCase().trim();
      courierType = codeMatch[2].toLowerCase().trim();
    } else {
      const courierPart = addr.match(/Kurir:\s*([^\s]+)\s+([^\s(|]+)/i);
      const rawCompany = (courierPart?.[1] || "jne").toLowerCase().trim();
      const rawType = (courierPart?.[2] || "reg").toLowerCase().trim();

      if (rawCompany.includes("jne")) courierCompany = "jne";
      else if (rawCompany.includes("tiki")) courierCompany = "tiki";
      else if (rawCompany.includes("sicepat")) courierCompany = "sicepat";
      else if (rawCompany.includes("j&t") || rawCompany.includes("jnt")) courierCompany = "jnt";
      else if (rawCompany.includes("anter")) courierCompany = "anteraja";
      else if (rawCompany.includes("pos")) courierCompany = "pos";
      else courierCompany = "jne";

      courierType = rawType === "reguler" || rawType === "regular" ? "reg" : rawType;
    }

    const validBiteshipCouriers = ["jne", "tiki", "sicepat", "jnt", "anteraja", "pos", "lion", "ninja", "grab", "gojek"];
    if (!validBiteshipCouriers.includes(courierCompany.toLowerCase())) {
      courierCompany = "jne";
      courierType = "reg";
    }

    let destinationAreaId = "";
    let areaPostalCode = "";

    const cleanCity = (kota || "").replace(/KABUPATEN\s+|KOTA\s+/i, "").trim();
    const cleanDist = (kecamatan || "").replace(/\(Desa\/Kel:.*?\)/i, "").trim();

    const searchQueries = [
      `${cleanDist}, ${cleanCity}, ${provinsi}`,
      `${cleanDist}, ${cleanCity}`,
      `${cleanCity}, ${provinsi}`,
      `${provinsi}`
    ].filter(Boolean);

    for (const query of searchQueries) {
      try {
        const destRes = await fetch(`https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(query)}`, {
          headers: { Authorization: apiKey }
        });
        if (destRes.ok) {
          const destData = await destRes.json();
          if (destData.areas && destData.areas.length > 0) {
            const isDestMakassar = cleanCity.toLowerCase().includes("makassar");

            const matchedArea = destData.areas.find((a: any) => {
              const nameLower = (a.name || "").toLowerCase();

              // Disqualify Makassar area entries if destination is NOT Makassar
              if (!isDestMakassar && (nameLower.includes("makassar") || a.id.includes("IDNC182") || a.id.includes("IDND2571"))) {
                return false;
              }

              const matchesDist = cleanDist && cleanDist.length > 2 && nameLower.includes(cleanDist.toLowerCase());
              const matchesCity = cleanCity && cleanCity.length > 2 && nameLower.includes(cleanCity.toLowerCase());

              return matchesDist || matchesCity;
            });

            if (matchedArea) {
              destinationAreaId = matchedArea.id;
              const match = (matchedArea.name || "").match(/\b\d{5}\b/);
              if (match) areaPostalCode = match[0];
              break;
            }
          }
        }
      } catch (e) {}
    }

    const orderItems = order.items.map((it: any) => ({
      name: it.product.name,
      description: it.product.description || it.product.name || "Obat-obatan PBF",
      quantity: it.quantity,
      value: Math.max(10000, Math.round(it.price || it.product?.price || 10000)),
      weight: 500,
      category: "others",
    }));

    let cleanPhone = (phonePart || order.institution.siaNumber || "08123456789").replace(/\D/g, "");
    if (!cleanPhone.startsWith("08") && !cleanPhone.startsWith("62")) {
      cleanPhone = "08123456789";
    }
    const validDestinationPhone = cleanPhone.length >= 10 ? cleanPhone : "08123456789";

    let rawCode = parseInt((pos || "").replace(/\D/g, "")) || (areaPostalCode ? parseInt(areaPostalCode) : 92811);
    const resolvedPostalCode = !isNaN(rawCode) && rawCode >= 10000 ? rawCode : 92811;

    const biteshipPayload: any = {
      shipper_contact_name: "PBF GroovyCare",
      shipper_contact_phone: "08123456789",
      shipper_contact_email: "admin@groovycare.com",
      shipper_organization: "PBF GroovyCare",
      origin_contact_name: "PBF GroovyCare",
      origin_contact_phone: "08123456789",
      origin_address: "Jl. Tamalanrea Raya Ruko Pelangi Blok B No 7, Kelurahan Buntusu, Kecamatan Tamalanrea, Kota Makassar",
      origin_postal_code: 90245,
      origin_area_id: "IDNP28IDNC248IDND2571",
      destination_contact_name: order.institution.name,
      destination_contact_phone: validDestinationPhone,
      destination_contact_email: emailPart || "apotek.sehat@groovycare.com",
      destination_address: cleanDestinationAddress,
      destination_postal_code: resolvedPostalCode,
      ...(destinationAreaId ? { destination_area_id: destinationAreaId } : {}),
      courier_company: courierCompany,
      courier_type: courierType,
      delivery_type: "now",
      reference_id: order.orderNumber,
      items: orderItems,
      order_note: `Pesanan SP: ${order.orderNumber}`
    };

    const biteshipOrderRes = await fetch("https://api.biteship.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(biteshipPayload)
    });

    if (biteshipOrderRes.ok) {
      const bData = await biteshipOrderRes.json();
      const newWaybill = bData.courier?.waybill_id || bData.courier?.tracking_id || bData.id || `WYB-${Date.now()}`;
      await db.order.update({
        where: { id: orderId },
        data: {
          biteshipOrderId: bData.id || null,
          trackingNumber: newWaybill,
          status: "SHIPPED",
          shippingDate: new Date()
        }
      });
      revalidatePath("/admin/dashboard");
      revalidatePath("/customer/dashboard");
      return { success: true, message: `Berhasil dikirim ke Biteship Dashboard! No Resi: ${newWaybill}`, biteshipOrderId: bData.id, waybillId: newWaybill };
    } else {
      const errData = await biteshipOrderRes.json();
      return { success: false, error: errData.message || errData.error || "Gagal membuat order di Biteship" };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mendorong pesanan ke Biteship" };
  }
}
