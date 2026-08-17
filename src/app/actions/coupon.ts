"use server";

import { db, getFreshDb } from "@/lib/db";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

function getPrisma() {
  return getFreshDb() as any;
}

async function verifyAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error("Akses ditolak: Silakan login terlebih dahulu");
  }
  const role = (session.role || "").toUpperCase();
  if (!["PBF_ADMIN", "SYSTEM_ADMIN", "ADMIN", "SUPERADMIN", "SUPER_ADMIN", "PBF"].includes(role)) {
    throw new Error(`Akses ditolak: Role "${session.role}" tidak memiliki hak akses admin promo`);
  }
  return session;
}

// 1. Ambil Daftar Produk Terpublish untuk Select Dropdown di Form Promo
export async function getPublishedProductsForPromo() {
  try {
    await verifyAdmin();
    const prisma = getPrisma();
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        price: true,
        isPromo: true,
        promoPrice: true,
        unit: true,
        imageUrl: true,
        category: true,
      },
      orderBy: { name: "asc" },
    });
    return { success: true, products };
  } catch (error: any) {
    console.error("[getPublishedProductsForPromo error]:", error.message);
    return { success: false, error: error.message, products: [] };
  }
}

// 2. Ambil Semua Promo & Kupon untuk Admin PBF
export async function getCoupons() {
  try {
    await verifyAdmin();
    const prisma = getPrisma();
    const coupons = await prisma.promoCoupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Ambil detail produk target jika ada
    const targetProductIds = coupons.map((c: any) => c.targetProductId).filter(Boolean) as string[];
    const targetProducts = targetProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: targetProductIds } },
          select: { id: true, name: true, code: true, price: true, imageUrl: true }
        })
      : [];

    const enrichedCoupons = coupons.map((c: any) => ({
      ...c,
      targetProduct: targetProducts.find((p: any) => p.id === c.targetProductId) || null
    }));

    return { success: true, coupons: enrichedCoupons };
  } catch (error: any) {
    console.error("[getCoupons error]:", error.message);
    return { success: false, error: error.message, coupons: [] };
  }
}

// 3. Buat Kode Promo & Voucher Produk Baru oleh Admin PBF
export async function createProductPromoCoupon(data: {
  code: string;
  title: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  scope: "GLOBAL" | "CATEGORY" | "PRODUCT";
  discountValue: number;
  maxDiscount?: number;
  promoPrice?: number;
  targetProductId?: string;
  targetCategory?: string;
  minSpend?: number;
  minQuantity?: number;
  usageLimit?: number;
  perUserLimit?: number;
  targetCustomerSegment?: string;
  startDate?: string;
  expiryDate: string;
}) {
  try {
    await verifyAdmin();

    const cleanCode = (data.code || "").toUpperCase().trim().replace(/[^A-Z0-9_-]/g, "");
    if (!cleanCode) {
      return { success: false, error: "Kode voucher promo wajib diisi (karakter alfanumerik)" };
    }
    if (!data.title) {
      return { success: false, error: "Judul promo wajib diisi" };
    }
    if (!data.expiryDate) {
      return { success: false, error: "Tanggal kedaluwarsa promo wajib ditentukan" };
    }

    const prisma = getPrisma();
    const existing = await prisma.promoCoupon.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return { success: false, error: `Kode voucher "${cleanCode}" sudah terdaftar` };
    }

    let calculatedDiscountValue = data.discountValue;
    let computedPromoPrice: number | null = null;

    if (data.scope === "PRODUCT" && data.targetProductId) {
      const targetProduct = await prisma.product.findUnique({ where: { id: data.targetProductId } });
      if (!targetProduct) {
        return { success: false, error: "Produk target yang dipilih tidak ditemukan" };
      }

      if (data.promoPrice && data.promoPrice > 0) {
        computedPromoPrice = data.promoPrice;
        calculatedDiscountValue = Math.max(0, targetProduct.price - data.promoPrice);
      } else if (data.type === "PERCENTAGE" && data.discountValue > 0) {
        let discAmount = (targetProduct.price * data.discountValue) / 100;
        if (data.maxDiscount && data.maxDiscount > 0 && discAmount > data.maxDiscount) {
          discAmount = data.maxDiscount;
        }
        computedPromoPrice = Math.max(0, Math.round(targetProduct.price - discAmount));
      } else if (data.type === "FIXED_AMOUNT" && data.discountValue > 0) {
        computedPromoPrice = Math.max(0, targetProduct.price - data.discountValue);
      } else {
        computedPromoPrice = targetProduct.price;
      }
    }

    const coupon = await prisma.promoCoupon.create({
      data: {
        code: cleanCode,
        title: data.title,
        type: data.type || "FIXED_AMOUNT",
        scope: data.scope || "GLOBAL",
        discountValue: parseFloat((calculatedDiscountValue || 0).toString()),
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount.toString()) : null,
        minSpend: data.minSpend ? parseFloat(data.minSpend.toString()) : 0,
        minQuantity: data.minQuantity ? parseInt(data.minQuantity.toString(), 10) : 0,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit.toString(), 10) : 100,
        perUserLimit: data.perUserLimit ? parseInt(data.perUserLimit.toString(), 10) : 1,
        targetProductId: data.targetProductId || null,
        targetCategory: data.targetCategory || null,
        targetCustomerSegment: data.targetCustomerSegment || "ALL",
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        expiryDate: new Date(data.expiryDate),
        isActive: true,
      },
    });

    if (data.scope === "PRODUCT" && data.targetProductId && computedPromoPrice !== null) {
      await prisma.product.update({
        where: { id: data.targetProductId },
        data: {
          isPromo: true,
          promoPrice: computedPromoPrice,
        },
      });
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true, message: `Promo "${cleanCode}" berhasil diterbitkan!`, coupon };
  } catch (error: any) {
    console.error("[createProductPromoCoupon error]:", error.message);
    return { success: false, error: error.message };
  }
}

// 4. Update Promo (Edit)
export async function updateProductPromoCoupon(id: string, data: {
  title: string;
  usageLimit: number;
  perUserLimit: number;
  minSpend?: number;
  minQuantity?: number;
  maxDiscount?: number;
  startDate: string;
  expiryDate: string;
  isActive: boolean;
}) {
  try {
    await verifyAdmin();
    const prisma = getPrisma();

    const coupon = await prisma.promoCoupon.update({
      where: { id },
      data: {
        title: data.title,
        usageLimit: parseInt(data.usageLimit.toString(), 10),
        perUserLimit: parseInt(data.perUserLimit.toString(), 10),
        minSpend: data.minSpend ? parseFloat(data.minSpend.toString()) : 0,
        minQuantity: data.minQuantity ? parseInt(data.minQuantity.toString(), 10) : 0,
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount.toString()) : null,
        startDate: new Date(data.startDate),
        expiryDate: new Date(data.expiryDate),
        isActive: data.isActive,
      },
    });

    if (coupon.targetProductId) {
      await prisma.product.update({
        where: { id: coupon.targetProductId },
        data: { isPromo: data.isActive },
      });
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true, message: `Promo "${coupon.code}" berhasil diperbarui!`, coupon };
  } catch (error: any) {
    console.error("[updateProductPromoCoupon error]:", error.message);
    return { success: false, error: error.message };
  }
}

// 5. Toggle Status Aktif/Nonaktif Promo
export async function toggleCouponStatus(id: string, isActive: boolean) {
  try {
    await verifyAdmin();
    const prisma = getPrisma();
    const coupon = await prisma.promoCoupon.update({
      where: { id },
      data: { isActive },
    });

    if (coupon.targetProductId) {
      await prisma.product.update({
        where: { id: coupon.targetProductId },
        data: {
          isPromo: isActive,
        },
      });
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true, message: `Status promo berhasil diperbarui` };
  } catch (error: any) {
    console.error("[toggleCouponStatus error]:", error.message);
    return { success: false, error: error.message };
  }
}

// 6. Hapus Promo Voucher
export async function deleteCoupon(id: string) {
  try {
    await verifyAdmin();
    const prisma = getPrisma();
    const coupon = await prisma.promoCoupon.findUnique({ where: { id } });
    if (coupon && coupon.targetProductId) {
      await prisma.product.update({
        where: { id: coupon.targetProductId },
        data: {
          isPromo: false,
          promoPrice: null,
        },
      });
    }

    await prisma.promoCoupon.delete({ where: { id } });
    revalidatePath("/admin/dashboard");
    revalidatePath("/customer/dashboard");
    return { success: true, message: `Promo berhasil dihapus` };
  } catch (error: any) {
    console.error("[deleteCoupon error]:", error.message);
    return { success: false, error: error.message };
  }
}

// 7. Ambil Log Riwayat Pemakaian Voucher oleh Mitra
export async function getCouponUsageHistory(couponCode: string) {
  try {
    await verifyAdmin();
    const prisma = getPrisma();

    const orders = await prisma.order.findMany({
      where: { couponCode: couponCode },
      select: {
        id: true,
        orderNumber: true,
        couponDiscount: true,
        createdAt: true,
        institution: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, orders };
  } catch (error: any) {
    console.error("[getCouponUsageHistory error]:", error.message);
    return { success: false, error: error.message, orders: [] };
  }
}

// 8. Validasi Kode Voucher saat Mitra Checkout di Keranjang
export async function validateCouponCode(
  rawCode: string,
  cartItems: { productId: string; category?: string; price: number; quantity: number }[],
  cartSubtotal: number,
  institutionId?: string,
  institutionType?: string
) {
  const code = (rawCode || "").toUpperCase().trim();
  if (!code) {
    return { success: false, error: "Masukkan kode voucher" };
  }

  try {
    const prisma = getPrisma();
    const coupon = await prisma.promoCoupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) {
      return { success: false, error: "Kode voucher tidak valid atau sedang tidak aktif" };
    }

    const today = new Date();
    if (new Date(coupon.startDate) > today) {
      return {
        success: false,
        error: `Kode voucher "${code}" baru dapat digunakan mulai tanggal ${new Date(coupon.startDate).toLocaleDateString("id-ID")}`,
      };
    }

    if (new Date(coupon.expiryDate) < today) {
      return { success: false, error: `Kode voucher "${code}" sudah kedaluwarsa` };
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return { success: false, error: `Kuota penggunaan voucher "${code}" telah habis` };
    }

    // Check perUserLimit jika institutionId ada
    if (institutionId && coupon.perUserLimit > 0) {
      const userOrdersCount = await prisma.order.count({
        where: {
          institutionId: institutionId,
          couponCode: code,
        },
      });
      if (userOrdersCount >= coupon.perUserLimit) {
        return {
          success: false,
          error: `Anda telah mencapai batas maksimal pemakaian voucher ini (${coupon.perUserLimit}x per mitra)`,
        };
      }
    }

    // Check Segment Mitra
    if (coupon.targetCustomerSegment && coupon.targetCustomerSegment !== "ALL") {
      if (institutionType) {
        if (coupon.targetCustomerSegment === "APOTEK" && institutionType !== "APOTEK") {
          return { success: false, error: "Voucher ini khusus untuk segmen Apotek" };
        }
        if (coupon.targetCustomerSegment === "KLINIK_RS" && !["KLINIK", "RUMAH_SAKIT"].includes(institutionType)) {
          return { success: false, error: "Voucher ini khusus untuk segmen Klinik / Rumah Sakit" };
        }
      }
    }

    // Min Spend Check
    if (cartSubtotal < coupon.minSpend) {
      return {
        success: false,
        error: `Voucher ini mensyaratkan minimal belanja Rp. ${coupon.minSpend.toLocaleString("id-ID")}`,
      };
    }

    // Min Quantity Check
    const totalCartQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    if (coupon.minQuantity > 0 && totalCartQty < coupon.minQuantity) {
      return {
        success: false,
        error: `Voucher ini mensyaratkan minimal pembelian total ${coupon.minQuantity} unit obat`,
      };
    }

    let discount = 0;
    if (coupon.scope === "GLOBAL") {
      if (coupon.type === "PERCENTAGE") {
        discount = (cartSubtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.discountValue;
      }
    } else if (coupon.scope === "PRODUCT" && coupon.targetProductId) {
      const targetItem = cartItems.find((i) => i.productId === coupon.targetProductId);
      if (!targetItem) {
        return { success: false, error: `Voucher ini khusus untuk produk obat tertentu` };
      }
      const itemSubtotal = targetItem.price * targetItem.quantity;
      if (coupon.type === "PERCENTAGE") {
        discount = (itemSubtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = Math.min(itemSubtotal, coupon.discountValue);
      }
    } else if (coupon.scope === "CATEGORY" && coupon.targetCategory) {
      const categoryItems = cartItems.filter((i) =>
        (i.category || "").toLowerCase().includes((coupon.targetCategory || "").toLowerCase())
      );
      if (categoryItems.length === 0) {
        return { success: false, error: `Voucher ini khusus untuk kategori "${coupon.targetCategory}"` };
      }
      const catSubtotal = categoryItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      if (coupon.type === "PERCENTAGE") {
        discount = (catSubtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = Math.min(catSubtotal, coupon.discountValue);
      }
    }

    discount = Math.min(cartSubtotal, Math.round(discount));

    return {
      success: true,
      message: `Voucher "${coupon.code}" berhasil dipasang! Hemat Rp. ${discount.toLocaleString("id-ID")}`,
      discountAmount: discount,
      coupon: {
        code: coupon.code,
        title: coupon.title,
        type: coupon.type,
        discountValue: coupon.discountValue,
      },
    };
  } catch (error: any) {
    return { success: false, error: "Gagal memverifikasi voucher: " + error.message };
  }
}

// 9. Ambil Daftar Voucher Promo Aktif yang Tersedia untuk Mitra (Customer)
export async function getAvailableCouponsForCustomer(institutionType?: string) {
  try {
    const prisma = getPrisma();
    const today = new Date();

    const coupons = await prisma.promoCoupon.findMany({
      where: {
        isActive: true,
        startDate: { lte: today },
        expiryDate: { gte: today },
      },
      orderBy: { createdAt: "desc" },
    });

    const eligibleCoupons = coupons.filter((c: any) => {
      if (c.usedCount >= c.usageLimit) return false;
      if (c.targetCustomerSegment && c.targetCustomerSegment !== "ALL") {
        if (institutionType) {
          if (c.targetCustomerSegment === "APOTEK" && institutionType !== "APOTEK") return false;
          if (c.targetCustomerSegment === "KLINIK_RS" && !["KLINIK", "RUMAH_SAKIT"].includes(institutionType)) return false;
        }
      }
      return true;
    });

    const targetProductIds = eligibleCoupons.map((c: any) => c.targetProductId).filter(Boolean) as string[];
    const targetProducts = targetProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: targetProductIds } },
          select: { id: true, name: true, code: true, price: true, imageUrl: true }
        })
      : [];

    const enrichedCoupons = eligibleCoupons.map((c: any) => ({
      ...c,
      targetProduct: targetProducts.find((p: any) => p.id === c.targetProductId) || null
    }));

    return { success: true, coupons: enrichedCoupons };
  } catch (error: any) {
    console.error("[getAvailableCouponsForCustomer error]:", error.message);
    return { success: false, error: error.message, coupons: [] };
  }
}
