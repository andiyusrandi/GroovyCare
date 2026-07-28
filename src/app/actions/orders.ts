"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

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
    if (paymentMethod !== "VA" && paymentMethod !== "COD") {
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

// 2. Mengambil Pesanan
export async function getOrders() {
  try {
    const session = await getActiveUser();

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

// 4. Penolakan Pesanan (PBF Admin Portal)
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
    return { success: true, message: "Pesanan berhasil dibatalkan/ditolak" };
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

    // Attempt to book courier via BiteShip if trackingNumber is empty or not provided
    const apiKey = process.env.BITESHIP_API_KEY;
    const addr = order.shippingAddress || "";

    if (apiKey && (!trackingNumber || trackingNumber.trim() === "") && addr.includes("Kec:")) {
      try {
        const mainAddrPart = addr.split(" | ")[0] || "";
        const emailPart = addr.match(/Email:\s*([^\s|]+)/)?.[1] || "";
        const phonePart = addr.match(/Telp:\s*([^\s|]+)/)?.[1] || "";

        const addressDetail = mainAddrPart.match(/Alamat:\s*(.*?),\s*Kel\/Desa:/)?.[1] || order.institution.address;
        const kelurahan = mainAddrPart.match(/Kel\/Desa:\s*(.*?),\s*Kec:/)?.[1] || "";
        const kecamatan = mainAddrPart.match(/Kec:\s*(.*?),\s*Kab\/Kota:/)?.[1] || "";
        const kota = mainAddrPart.match(/Kab\/Kota:\s*(.*?),\s*Provinsi:/)?.[1] || "";
        const provinsi = mainAddrPart.match(/Provinsi:\s*(.*?),\s*Kode Pos:/)?.[1] || "";
        const pos = mainAddrPart.match(/Kode Pos:\s*(\d+)/)?.[1] || "12440";

        const courierPart = addr.match(/Kurir:\s*([^\s]+)\s+([^\s]+)/);
        const courierCompany = courierPart?.[1]?.toLowerCase() || "jne";
        const courierType = courierPart?.[2]?.toLowerCase() || "reg";

        let destinationAreaId = "";
        const destInput = `${kecamatan}, ${kota}, ${provinsi}`;
        const destRes = await fetch(`https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(destInput)}`, {
          headers: { Authorization: apiKey }
        });
        if (destRes.ok) {
          const destData = await destRes.json();
          if (destData.areas && destData.areas.length > 0) {
            destinationAreaId = destData.areas[0].id;
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

        if (destinationAreaId) {
          const orderItems = order.items.map((it) => ({
            name: it.product.name,
            quantity: it.quantity,
            value: Math.round(it.product.price),
            weight: 50,
            category: "healthcare",
          }));

          const isCOD = order.paymentMethod === "COD";
          const codAmount = isCOD
            ? Math.round(order.items.reduce((acc, it) => acc + it.price * it.quantity, 0))
            : 0;

          const biteshipOrderRes = await fetch("https://api.biteship.com/v1/orders", {
            method: "POST",
            headers: {
              Authorization: apiKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              shipper_contact_name: "PBF GroovyCare",
              shipper_contact_phone: "08123456789",
              shipper_contact_email: "admin@groovycare.com",
              shipper_organization: "PBF GroovyCare",
              origin_contact_name: "PBF GroovyCare",
              origin_contact_phone: "08123456789",
              origin_address: "Jl. Tamalanrea Raya Ruko Pelangi Blok B No 7, Kelurahan Buntusu, Kecamatan Tamalanrea, Kota Makassar",
              origin_postal_code: 90245,
              origin_coordinate: {
                latitude: -5.109722,
                longitude: 119.4975
              },
              destination_contact_name: order.institution.name,
              destination_contact_phone: phonePart || "08123456789",
              destination_contact_email: emailPart || "apotek.sehat@groovycare.com",
              destination_address: `${addressDetail}, Kel/Desa: ${kelurahan}, Kec: ${kecamatan}, Kab/Kota: ${kota}, Provinsi: ${provinsi}, Kode Pos: ${pos}`,
              destination_postal_code: parseInt(pos) || 12440,
              destination_coordinate: {
                latitude: -5.147665,
                longitude: 119.432731
              },
              ...(isCOD ? {
                destination_cash_on_delivery: codAmount,
                destination_cash_on_delivery_type: "7_days"
              } : {}),
              courier_company: courierCompany,
              courier_type: courierType,
              delivery_type: "now",
              items: orderItems,
              order_note: `Pesanan SP: ${order.orderNumber}`
            })
          });

          if (biteshipOrderRes.ok) {
            const biteshipOrderData = await biteshipOrderRes.json();
            if (biteshipOrderData.courier && biteshipOrderData.courier.waybill_id) {
              trackingNumber = biteshipOrderData.courier.waybill_id;
            }
          }
        }
      } catch (err) {
        console.error("Failed to book BiteShip courier:", err);
      }
    }

    const finalTrackingNumber = trackingNumber && trackingNumber.trim() !== "" ? trackingNumber : `BT-MOCK-${Math.floor(100000 + Math.random() * 900000)}`;

    await db.order.update({
      where: { id: orderId },
      data: {
        status: "SHIPPED",
        trackingNumber: finalTrackingNumber,
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
      },
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

    await db.$transaction(async (tx: any) => {
      // 1. Jika pesanan memiliki alokasi stok batch, kembalikan stok obat ke batch masing-masing
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
      }

      // 2. Update status order menjadi CANCELLED
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          rejectionReason: cancelReasonText
        }
      });

      // 3. Rekalkulasi sisa hutang / limit kredit mitra
      await recalculateInstitutionDebt(tx, order.institutionId);
    });

    revalidatePath("/customer/dashboard");
    revalidatePath("/admin/dashboard");
    revalidatePath("/");

    return { success: true, message: "Pesanan berhasil dibatalkan dan stok obat telah dikembalikan ke inventaris." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
