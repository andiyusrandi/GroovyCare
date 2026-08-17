"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";
interface LocalProduct {
  id: string;
  name: string;
  code: string;
  activeIngredient: string;
  price: number;
  category: string;
  description: string | null;
  unit: string;
  createdAt: Date;
}

interface LocalBatch {
  id: string;
  productId: string;
  batchNumber: string;
  expiryDate: Date;
  stock: number;
}

async function verifyAdmin() {
  const session = await getSession();
  if (!session || (session.role !== "PBF_ADMIN" && session.role !== "SYSTEM_ADMIN")) {
    throw new Error("Akses ditolak: Hanya PBF Admin atau System Admin yang diizinkan");
  }
}

// Bisa diakses oleh Pelanggan & Admin
export async function getProducts() {
  try {
    const products = await db.product.findMany({
      include: {
        batches: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Hitung total stok (hanya batch yang belum expired)
    const today = new Date();
    return products.map((product: any) => {
      const activeStock = (product.batches as LocalBatch[])
        .filter((b: LocalBatch) => new Date(b.expiryDate) > today)
        .reduce((sum: number, b: LocalBatch) => sum + b.stock, 0);

      return {
        ...product,
        totalStock: activeStock,
      };
    });
  } catch (error: any) {
    throw new Error("Gagal mengambil produk: " + error.message);
  }
}

export async function createProduct(data: {
  name: string;
  code: string;
  activeIngredient: string;
  price: number;
  category: string;
  description?: string;
  unit: string;
  manufacturer: string;
  imageUrl?: string;
}) {
  await verifyAdmin();
  try {
    const product = await db.product.create({
      data: {
        name: data.name,
        code: data.code,
        activeIngredient: data.activeIngredient,
        price: parseFloat(data.price.toString()),
        category: data.category,
        description: data.description || "",
        unit: data.unit,
        manufacturer: data.manufacturer, // Pabrikan obat yang memproduksi sediaan
        imageUrl: data.imageUrl || null,
      },
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    code: string;
    activeIngredient: string;
    price: number;
    category: string;
    description?: string;
    unit: string;
    manufacturer: string;
    imageUrl?: string;
  }
) {
  await verifyAdmin();
  try {
    const product = await db.product.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        activeIngredient: data.activeIngredient,
        price: parseFloat(data.price.toString()),
        category: data.category,
        description: data.description || "",
        unit: data.unit,
        manufacturer: data.manufacturer,
        imageUrl: data.imageUrl || null,
      },
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id: string) {
  await verifyAdmin();
  try {
    await db.product.delete({
      where: { id },
    });
    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Batch Management
export async function addBatch(data: {
  productId: string;
  batchNumber: string;
  expiryDate: string;
  stock: number;
  referenceNumber?: string;
}) {
  await verifyAdmin();
  try {
    const product = await db.product.findUnique({
      where: { id: data.productId }
    });
    if (!product) {
      return { success: false, error: "Produk tidak ditemukan" };
    }

    const batch = await db.batch.create({
      data: {
        productId: data.productId,
        batchNumber: data.batchNumber,
        expiryDate: new Date(data.expiryDate),
        stock: parseInt(data.stock.toString(), 10),
      },
    });

    // Catat log transaksi stok masuk ke database secara riil
    const isPbf = product.manufacturer.toLowerCase().includes("pbf") || product.manufacturer.toLowerCase().includes("distributor");
    await db.stockTransaction.create({
      data: {
        productId: data.productId,
        batchId: batch.id,
        type: isPbf ? "IN_PBF" : "IN_IF",
        quantity: parseInt(data.stock.toString(), 10),
        referenceNumber: data.referenceNumber || `REC-${data.batchNumber}`,
        sourceTargetName: product.manufacturer,
      }
    });

    revalidatePath("/admin/dashboard");
    return { success: true, batch };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteBatch(batchId: string) {
  await verifyAdmin();
  try {
    await db.batch.delete({
      where: { id: batchId },
    });
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Auto-Karantina Batch Obat ED < 60 Hari (BPOM CDOB Compliance Engine)
export async function quarantineNearExpiryBatches(daysThreshold: number = 60) {
  await verifyAdmin();
  try {
    const thresholdDate = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000);

    // Cari seluruh batch aktif dengan ED <= daysThreshold hari
    const batchesToQuarantine = await db.batch.findMany({
      where: {
        expiryDate: { lte: thresholdDate },
        stock: { gt: 0 },
      },
      include: { product: true },
    });

    if (batchesToQuarantine.length === 0) {
      return { success: true, message: `Tidak ada batch obat ED < ${daysThreshold} hari yang perlu dikarantina. Stok aman!`, count: 0 };
    }

    let quarantinedCount = 0;
    for (const batch of batchesToQuarantine) {
      // Catat log stok adjustment karantina CDOB
      await db.stockTransaction.create({
        data: {
          productId: batch.productId,
          batchId: batch.id,
          type: "ADJUSTMENT",
          quantity: -batch.stock,
          referenceNumber: `QRNT-${batch.batchNumber}`,
          sourceTargetName: "Karantina Obat ED (BPOM CDOB Compliance)",
        },
      });

      // Setel stok batch menjadi 0 agar tidak terbeli/terkirim oleh pelanggan
      await db.batch.update({
        where: { id: batch.id },
        data: { stock: 0 },
      });
      quarantinedCount++;
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    revalidatePath("/");

    return {
      success: true,
      message: `Berhasil mengkarantina ${quarantinedCount} batch obat (ED < ${daysThreshold} hari) dari katalog belanja.`,
      count: quarantinedCount,
    };
  } catch (error: any) {
    console.error("Quarantine error:", error);
    return { success: false, error: error.message || "Gagal mengkarantina obat" };
  }
}
