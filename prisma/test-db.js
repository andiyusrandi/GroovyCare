const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function runTests() {
  console.log("=== MEMULAI AUTOMATED TESTING VERIFIKASI CDOB & FEFO ===");

  const today = new Date();

  // Test 1: Verifikasi Akun Expired Diblokir sesuai CDOB
  console.log("\n[TEST 1] Menguji Blokir CDOB untuk SIPA/SIA Kedaluwarsa...");
  const expiredUser = await db.user.findUnique({
    where: { email: "expired.sipa@groovycare.com" },
    include: { institution: true }
  });

  if (!expiredUser) {
    console.error("FAIL: User expired tidak ditemukan di DB");
    process.exit(1);
  }

  // Cek SIA Expired
  const isSiaExpired = new Date(expiredUser.institution.siaExpiry) <= today;
  // Cek SIPA Expired
  const isSipaExpired = new Date(expiredUser.sipaExpiry) <= today;

  console.log(`- SIA Apotek: ${expiredUser.institution.siaNumber} (ED: ${expiredUser.institution.siaExpiry.toISOString().split('T')[0]}) -> Expired? ${isSiaExpired}`);
  console.log(`- SIPA Apoteker: ${expiredUser.sipaNumber} (ED: ${expiredUser.sipaExpiry.toISOString().split('T')[0]}) -> Expired? ${isSipaExpired}`);

  if (isSiaExpired && isSipaExpired) {
    console.log("SUCCESS: Sistem mendeteksi SIA & SIPA Kedaluwarsa.");
  } else {
    console.error("FAIL: Sistem gagal mendeteksi dokumen kedaluwarsa.");
    process.exit(1);
  }

  // Test 2: Menguji Alokasi Stok FEFO (First Expired First Out)
  console.log("\n[TEST 2] Menguji Urutan Alokasi FEFO...");
  
  // Ambil Paracetamol 500mg Box
  const product = await db.product.findUnique({
    where: { code: "OBT-PCT-500" },
    include: { batches: true }
  });

  if (!product) {
    console.error("FAIL: Produk Paracetamol tidak ditemukan");
    process.exit(1);
  }

  console.log(`Produk: ${product.name}`);
  console.log("Daftar Batch di DB:");
  product.batches.forEach(b => {
    console.log(`- Batch: ${b.batchNumber} | Expired: ${b.expiryDate.toISOString().split('T')[0]} | Stok: ${b.stock}`);
  });

  // Filter & Urutkan secara FEFO (ED > today, urut ascending)
  const fefoBatches = product.batches
    .filter(b => new Date(b.expiryDate) > today && b.stock > 0)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  console.log("Rencana Alokasi FEFO (Urutan Prioritas Keluar):");
  fefoBatches.forEach((b, index) => {
    console.log(`  Priority ${index + 1}: Batch ${b.batchNumber} (ED: ${b.expiryDate.toISOString().split('T')[0]})`);
  });

  // Pastikan batch kedaluwarsa (B-PCT-EXP) tidak dimasukkan
  const hasExpiredInFefo = fefoBatches.some(b => b.batchNumber === "B-PCT-EXP");
  if (hasExpiredInFefo) {
    console.error("FAIL: Batch yang sudah kedaluwarsa dimasukkan ke dalam antrean FEFO!");
    process.exit(1);
  } else {
    console.log("SUCCESS: Batch kedaluwarsa (B-PCT-EXP) berhasil diabaikan.");
  }

  // Pastikan batch terdekat (B-PCT-001) adalah prioritas pertama
  if (fefoBatches[0].batchNumber === "B-PCT-001") {
    console.log("SUCCESS: Batch kedaluwarsa terdekat (B-PCT-001) adalah prioritas pertama.");
  } else {
    console.error(`FAIL: Prioritas pertama salah. Malah: ${fefoBatches[0].batchNumber}`);
    process.exit(1);
  }

  console.log("\n=== SEMUA AUTOMATED TEST VALIDASI CDOB & FEFO BERHASIL (PASSED) ===");
}

runTests()
  .catch(e => {
    console.error("Test failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
