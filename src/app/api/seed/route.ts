import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const prisma = db as any;
    // 1. Bersihkan database
    await db.orderBatchAllocation.deleteMany();
    await db.orderItem.deleteMany();
    await db.order.deleteMany();
    await db.batch.deleteMany();
    await db.product.deleteMany();
    await db.user.deleteMany();
    await db.institution.deleteMany();
    await prisma.systemSetting.deleteMany();

    // 2. Buat PBF Admin
    const pbfAdmin = await db.user.create({
      data: {
        email: "admin@groovycare.com",
        password: "admin",
        name: "Apoteker Sarah (APJ PBF)",
        role: "PBF_ADMIN",
        phone: "08123456789",
        sipaNumber: "SIPA-PBF-9988-2024",
        sipaExpiry: new Date("2028-12-31"),
      },
    });

    // 2b. Buat SystemSetting default
    await prisma.systemSetting.createMany({
      data: [
        {
          key: "logo_url",
          value: "https://res.cloudinary.com/rumahhostcom/image/upload/v1785256133/IMG_20260725_184829_670_odzsui.png",
        },
        {
          key: "app_name",
          value: "GroovyCare",
        },
      ],
    });

    // 2c. Buat Super Admin (SYSTEM_ADMIN)
    const systemAdmin = await db.user.create({
      data: {
        email: "admin@admin.com",
        password: "admin@admin.com",
        name: "administrator 1",
        role: "SYSTEM_ADMIN",
        phone: "08999999999",
      },
    });

    // 3. Buat Mitra Aktif (Apotek Sehat)
    const healthyApotek = await db.institution.create({
      data: {
        name: "Apotek Sehat Farma",
        siaNumber: "SIA-2023-99881",
        siaExpiry: new Date("2027-08-15"),
        address: "Jl. Kesehatan Raya No. 45, Jakarta Selatan",
        creditLimit: 50000000.0, // 50 Juta Rupiah
        currentDebt: 0.0,        // Mulai dari 0
        topDays: 30,
        isActive: true,
      },
    });

    // Buat User Apoteker untuk Apotek Sehat
    const healthyUser = await db.user.create({
      data: {
        email: "apotek.sehat@groovycare.com",
        password: "sehat",
        name: "Dr. Budi Santoso, S.Farm, Apt",
        role: "CUSTOMER_USER",
        phone: "08987654321",
        sipaNumber: "SIPA-19900821-2024-02",
        sipaExpiry: new Date("2027-04-10"), // Valid
        institutionId: healthyApotek.id,
      },
    });

    // 4. Buat Mitra Non-Aktif (Apotek Baru)
    const newApotek = await db.institution.create({
      data: {
        name: "Apotek Pelopor Baru",
        siaNumber: "SIA-2026-77665",
        siaExpiry: new Date("2029-01-01"),
        address: "Ruko Hijau Indah Blok C-10, Bekasi",
        creditLimit: 0.0, // Belum disetujui limitnya
        currentDebt: 0.0,
        topDays: 14,
        isActive: false, // Menunggu verifikasi admin PBF
      },
    });

    const newUser = await db.user.create({
      data: {
        email: "apotek.pelopor@groovycare.com",
        password: "baru",
        name: "Lia Mariana, S.Farm, Apt",
        role: "CUSTOMER_USER",
        phone: "087711223344",
        sipaNumber: "SIPA-19950505-2025-05",
        sipaExpiry: new Date("2028-05-05"),
        institutionId: newApotek.id,
      },
    });

    // 5. Buat Mitra Expired (Apotek Kadaluwarsa)
    const expiredApotek = await db.institution.create({
      data: {
        name: "Apotek Sejahtera (Izin Expired)",
        siaNumber: "SIA-2018-33333",
        siaExpiry: new Date("2026-05-01"), // SUDAH EXPIRED per tanggal saat ini (Juli 2026)
        address: "Jl. Kolonial Raya No. 12, Bandung",
        creditLimit: 15000000.0,
        currentDebt: 0.0,
        topDays: 14,
        isActive: true,
      },
    });

    const expiredUser = await db.user.create({
      data: {
        email: "expired.sipa@groovycare.com",
        password: "sehat",
        name: "Rian Hidayat, S.Farm",
        role: "CUSTOMER_USER",
        phone: "082211998877",
        sipaNumber: "SIPA-19880112-2021-01",
        sipaExpiry: new Date("2026-04-01"), // SIPA SUDAH EXPIRED
        institutionId: expiredApotek.id,
      },
    });

    // 6. Buat Produk Obat & Batch Stok (FEFO)
    // Paracetamol 500mg Box (Analgesik)
    const p1 = await db.product.create({
      data: {
        name: "Paracetamol 500mg Box",
        code: "OBT-PCT-500",
        activeIngredient: "Paracetamol",
        price: 75000.0,
        category: "Analgesik & Antipiretik",
        unit: "Box (100 Tablet)",
        description: "Obat penurun demam dan pereda nyeri sakit kepala.",
        manufacturer: "Kalbe Farma",
      },
    });

    // Batches untuk Paracetamol
    await db.batch.createMany({
      data: [
        {
          productId: p1.id,
          batchNumber: "B-PCT-001",
          expiryDate: new Date("2026-08-30"), // Expired sangat dekat (FEFO Terdekat)
          stock: 10,
        },
        {
          productId: p1.id,
          batchNumber: "B-PCT-002",
          expiryDate: new Date("2027-12-15"), // Expired jauh
          stock: 80,
        },
        {
          productId: p1.id,
          batchNumber: "B-PCT-EXP",
          expiryDate: new Date("2026-06-01"), // Sudah Expired (Sistem tidak boleh mengalokasikan ini!)
          stock: 25,
        },
      ],
    });

    // Sanmol 500mg Box (Analgesik - Substitusi Paracetamol karena zat aktifnya sama)
    const p2 = await db.product.create({
      data: {
        name: "Sanmol 500mg Box",
        code: "OBT-SAN-500",
        activeIngredient: "Paracetamol",
        price: 90000.0,
        category: "Analgesik & Antipiretik",
        unit: "Box (100 Tablet)",
        description: "Sanmol mengandung Paracetamol 500mg untuk meredakan nyeri dan demam.",
        manufacturer: "Sanbe Farma",
      },
    });

    await db.batch.createMany({
      data: [
        {
          productId: p2.id,
          batchNumber: "B-SAN-001",
          expiryDate: new Date("2027-03-20"),
          stock: 40,
        },
      ],
    });

    // Amoxicillin 500mg Box (Antibiotik)
    const p3 = await db.product.create({
      data: {
        name: "Amoxicillin 500mg Box",
        code: "OBT-AMX-500",
        activeIngredient: "Amoxicillin",
        price: 120000.0,
        category: "Antibiotik",
        unit: "Box (100 Kaplet)",
        description: "Antibiotik golongan penisilin untuk mengobati infeksi bakteri.",
        manufacturer: "Dexa Medica",
      },
    });

    await db.batch.createMany({
      data: [
        {
          productId: p3.id,
          batchNumber: "B-AMX-001",
          expiryDate: new Date("2026-09-15"), // Expired dekat
          stock: 5,
        },
        {
          productId: p3.id,
          batchNumber: "B-AMX-002",
          expiryDate: new Date("2027-06-18"), // Expired jauh
          stock: 45,
        },
      ],
    });

    // Ibuprofen 400mg Box (Analgesik alternatif)
    const p4 = await db.product.create({
      data: {
        name: "Ibuprofen 400mg Box",
        code: "OBT-IBU-400",
        activeIngredient: "Ibuprofen",
        price: 80000.0,
        category: "Analgesik & Anti-inflamasi",
        unit: "Box (100 Tablet)",
        description: "Obat anti-inflamasi nonsteroid untuk meredakan nyeri dan peradangan.",
        manufacturer: "Kalbe Farma",
      },
    });

    await db.batch.createMany({
      data: [
        {
          productId: p4.id,
          batchNumber: "B-IBU-001",
          expiryDate: new Date("2027-10-10"),
          stock: 120,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      users: {
        admin: pbfAdmin.email,
        superAdmin: systemAdmin.email,
        healthyUser: healthyUser.email,
        newUser: newUser.email,
        expiredUser: expiredUser.email,
      },
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
