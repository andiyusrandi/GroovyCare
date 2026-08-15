const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  console.log("Starting seeding...");
  
  // 1. Bersihkan database
  await db.orderBatchAllocation.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.batch.deleteMany();
  await db.product.deleteMany();
  await db.user.deleteMany();
  await db.institution.deleteMany();
  await db.systemSetting.deleteMany();
  
  console.log("Database cleared.");

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
  console.log("Admin user created.");

  // 2b. Buat SystemSetting default
  await db.systemSetting.createMany({
    data: [
      {
        key: "logo_url",
        value: "https://res.cloudinary.com/rumahhostcom/image/upload/v1785321525/logo_care_fcfgwq.png",
      },
      {
        key: "app_name",
        value: "GroovyCare",
      },
    ],
  });
  console.log("Default settings created.");

  // 2c. Buat Super Admin (SYSTEM_ADMIN)
  const systemAdmin = await db.user.create({
    data: {
      email: "admin@growmexa.com",
      password: "admin@growmexa.com",
      name: "administrator 1",
      role: "SYSTEM_ADMIN",
      phone: "08999999999",
    },
  });

  console.log("Super Admin user created.");

  // 3. Buat Mitra Aktif (Apotek Sehat)
  const healthyApotek = await db.institution.create({
    data: {
      name: "Apotek Sehat Farma",
      type: "APOTEK",
      siaNumber: "SIA-2023-99881",
      siaExpiry: new Date("2027-08-15"),
      address: "Jl. Kesehatan Raya No. 45, Jakarta Selatan",
      creditLimit: 50000000.0, // 50 Juta Rupiah
      currentDebt: 0.0,        // Mulai dari 0
      topDays: 30,
      isActive: true,
    },
  });

  const healthyUser = await db.user.create({
    data: {
      email: "apotek.sehat@groovycare.com",
      password: "sehat",
      name: "Dr. Budi Santoso, S.Farm, Apt",
      role: "CUSTOMER_USER",
      phone: "08987654321",
      sipaNumber: "SIPA-19900821-2024-02",
      sipaExpiry: new Date("2027-04-10"),
      institutionId: healthyApotek.id,
    },
  });
  console.log("Apotek Sehat and user created.");

  // 4. Buat Mitra Non-Aktif (Apotek Baru)
  const newApotek = await db.institution.create({
    data: {
      name: "Apotek Pelopor Baru",
      type: "APOTEK",
      siaNumber: "SIA-2026-77665",
      siaExpiry: new Date("2029-01-01"),
      address: "Ruko Hijau Indah Blok C-10, Bekasi",
      creditLimit: 0.0,
      currentDebt: 0.0,
      topDays: 14,
      isActive: false,
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
  console.log("Apotek Pelopor and user created.");

  // 5. Buat Mitra Expired (Apotek Kadaluwarsa)
  const expiredApotek = await db.institution.create({
    data: {
      name: "Apotek Sejahtera (Izin Expired)",
      type: "APOTEK",
      siaNumber: "SIA-2018-33333",
      siaExpiry: new Date("2026-05-01"),
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
      sipaExpiry: new Date("2026-04-01"),
      institutionId: expiredApotek.id,
    },
  });
  console.log("Apotek Sejahtera (expired) and user created.");

  // 6. Buat Produk Obat & Batch Stok (FEFO)
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

  await db.batch.createMany({
    data: [
      {
        productId: p1.id,
        batchNumber: "B-PCT-001",
        expiryDate: new Date("2026-08-30"), // Expired dekat
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
        expiryDate: new Date("2026-06-01"), // Expired
        stock: 25,
      },
    ],
  });

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
        expiryDate: new Date("2026-09-15"),
        stock: 5,
      },
      {
        productId: p3.id,
        batchNumber: "B-AMX-002",
        expiryDate: new Date("2027-06-18"),
        stock: 45,
      },
    ],
  });

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

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
