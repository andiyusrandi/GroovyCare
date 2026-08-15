"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

export interface CmsPageData {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  body: string;
  updatedAt?: string;
}

const DEFAULT_CMS_PAGES: Record<string, CmsPageData> = {
  about: {
    slug: "about",
    category: "Company",
    title: "Tentang Kami - GroovyCare PBF System",
    subtitle: "Distributor Resmi Kefarmasian & Sediaan Obat Terakreditasi CDOB Kemenkes RI",
    body: `### Profil Perusahaan

**GroovyCare PBF System** adalah Pedagang Besar Farmasi (PBF) terpercaya yang bergerak dalam bidang distribusi obat-obatan, bahan baku obat, alat kesehatan, dan sediaan biologi/cold chain ke seluruh jaringan Apotek, Rumah Sakit, Klinik, dan Sarana Pelayanan Kefarmasian resmi di Indonesia.

---

### Misi & Komitmen Mutu

1. **Jaminan Mutu CDOB**: Menjamin seluruh alur penerimaan, penyimpanan, dan penyaluran sediaan farmasi mematuhi petunjuk teknis **Cara Distribusi Obat yang Baik (CDOB)** dari Badan POM RI.
2. **Transformasi Digital PBF**: Memudahkan Apoteker Penanggung Jawab (APJ) dalam melakukan pemesanan via e-Katalog, e-Sign Surat Pesanan (SP), dan pelacakan suhu rantai dingin secara real-time.
3. **Kepatuhan Regulasi**: Menjamin ketersediaan obat dengan izin edar resmi BPOM, alokasi FEFO (First Expired First Out), dan transparansi batch/lot sediaan.`,
  },
  contact: {
    slug: "contact",
    category: "Company",
    title: "Hubungi Layanan Pelanggan & Support 24/7",
    subtitle: "Tim Operational Support PBF Siap Membantu Kebutuhan Pasokan Farmasi Anda",
    body: `### Saluran Komunikasi Resmi PBF

Jika Anda membutuhkan bantuan teknis terkait pendaftaran sarana, pengajuan limit kredit TOP, keluhan pengiriman, atau e-Sign Surat Pesanan (SP), silakan hubungi tim kami melalui saluran resmi berikut:

---

- **Hotline Customer Service**: (021) 555-8899 / +62-851-5100-5960
- **WhatsApp Support PBF**: +62-851-5100-5960 (Respon Cepat)
- **Email Pelayanan Farmasi**: support@groovyrx.com / cs@pbf-groovy.co.id
- **Jam Operasional Gudang**: Senin - Sabtu: 08:00 - 17:00 WITA
- **Alamat Gudang Utama PBF**: Jl. Industri Farmasi No. 88, Kawasan Distribusi Obat, Indonesia`,
  },
  career: {
    slug: "career",
    category: "Company",
    title: "Karir & Peluang Bergabung di PBF",
    subtitle: "Membangun Masa Depan Distribusi Farmasi Digital Berstandar CDOB",
    body: `### Bergabunglah Bersama Tim PBF Online

Kami mengundang para profesional di bidang kefarmasian, logistik rantai dingin, dan teknologi informasi untuk berkembang bersama dalam mewujudkan ekosistem rantai pasok obat yang aman dan transparan.

---

### Posisi Terbuka Saat Ini

1. **Apoteker Penanggung Jawab (APJ) Gudang PBF**
   - Kualifikasi: Lulusan Profesi Apoteker, Memiliki STRA & SIPA Aktif, Memahami CDOB & Pelaporan SIMONA/e-Report PBF.
2. **Staff Quality Assurance (QA) & Kepatuhan CDOB**
   - Kualifikasi: S1 Farmasi, Berpengalaman dalam Audit Internal & Penanganan Cold Chain Products.
3. **Koordinator Logistik & Rantai Dingin (Cold Chain Specialist)**
   - Kualifikasi: Pengalaman min. 2 tahun mengelola validator suhu, data logger, dan armada thermo box.`,
  },
  legal: {
    slug: "legal",
    category: "Legal",
    title: "Informasi Legalitas & Izin Operasional PBF",
    subtitle: "Dokumentasi Izin Usaha, NIB, & Kredensial Resmi Kementerian Kesehatan RI",
    body: `### Transparansi Kredensial Legalitas

Sebagai Pedagang Besar Farmasi (PBF) resmi yang terdaftar di Kementerian Kesehatan RI dan Badan Pengawas Obat dan Makanan (BPOM), berikut adalah kredensial hukum perusahaan kami:

---

- **Nomor Izin PBF**: 123/PBF/KEMENKES/2023
- **Nomor Induk Berusaha (NIB)**: 9120304958102
- **Penanggung Jawab Farmasi**: Apt. Budi Santoso, S.Farm (SIPA: 19900812/SIPA-PBF/2024)
- **NPWP Perusahaan**: 01.345.678.9-012.000
- **Status Akreditasi**: Lulus Sertifikasi CDOB Badan POM RI`,
  },
  terms: {
    slug: "terms",
    category: "Legal",
    title: "Syarat & Ketentuan Layanan Pemesanan PBF",
    subtitle: "Pedoman Transaksi, e-Sign SP, Alokasi FEFO, & Ketentuan Pembayaran TOP",
    body: `### Ketentuan Umum Transaksi Kefarmasian

1. **Persyaratan Mitra Pembeli**: Pembelian obat melalui PBF Online hanya dibuka untuk Sarana Kefarmasian Resmi (Apotek, Rumah Sakit, Klinik, Puskesmas) yang memiliki SIA, SIPA APJ, dan Akun Terverifikasi.
2. **Surat Pesanan (SP) Wajib**: Setiap pesanan obat keras, psikotropika, prekursor, dan cold chain wajib dilengkapi Surat Pesanan (SP) sah ber-eSign APJ.
3. **Metode Alokasi FEFO**: Barang yang dikirimkan menggunakan prinsip *First Expired First Out (FEFO)* dengan sisa masa simpan (expired date) minimal 12 bulan.
4. **Ketentuan Pembayaran TOP**: Mitra dengan limit kredit TOP wajib menyelesaikan pembayaran invoice sesuai tanggal jatuh tempo yang disepakati.`,
  },
  privacy: {
    slug: "privacy",
    category: "Legal",
    title: "Kebijakan Privasi Data & Keamanan Informasi",
    subtitle: "Perlindungan Kredensial APJ, Data Sarana, & Transaksi Berdasarkan UU PDP",
    body: `### Perlindungan Data Pribadi Mitra Farmasi

Kami berkomitmen menjaga kerahasiaan dan keamanan seluruh data pribadi, kredensial SIA/SIPA Apoteker, serta riwayat transaksi mitra sesuai dengan Undang-Undang Perlindungan Data Pribadi (UU PDP).

---

1. **Pengumpulan Data**: Data yang dikumpulkan hanya digunakan untuk verifikasi keabsahan sarana farmasi dan pelaporan CDOB ke instansi berwenang.
2. **Keamanan Enkripsi**: Seluruh transmisi data e-Sign SP dan transaksi dilindungi enkripsi SSL 256-bit.
3. **Penolakan Penyalahgunaan**: Kami tidak pernah menjual atau membagikan data mitra kepada pihak ketiga di luar kepentingan distribusi resmi.`,
  },
  certificates: {
    slug: "certificates",
    category: "Legal",
    title: "Sertifikat Kepatuhan & Sertifikasi CDOB",
    subtitle: "Dokumentasi Kelayakan Sarana & Penanganan Sediaan Farmasi Berstandar BPOM",
    body: `### Daftar Sertifikat CDOB Aktif

PBF Online memegang Sertifikat Cara Distribusi Obat yang Baik (CDOB) yang dikeluarkan oleh Badan POM RI untuk kategori sediaan berikut:

---

- **Sertifikat CDOB Obat Keras & Bahan Obat**: No. 456/CDOB/BPOM/2024
- **Sertifikat CDOB Sediaan Biologi & Cold Chain Product (CCP)**: No. 789/CDOB-CCP/BPOM/2024
- **Sertifikat CDOB Psikotropika & Prekursor Farmasi**: No. 101/CDOB-PP/BPOM/2024
- **Sertifikat Kalibrasi Suhu Gudang & Cold Room**: Terkalibrasi Berkala oleh Komite Akreditasi Nasional (KAN)`,
  },
  "quality-assurance": {
    slug: "quality-assurance",
    category: "Legal",
    title: "Jaminan Mutu & Pelacakan Rantai Dingin (Cold Chain)",
    subtitle: "Sistem Pengawasan Suhu Kontinu 2°C - 8°C & Prosedur Penanganan Retur CDOB",
    body: `### Sistem Jaminan Mutu PBF

Untuk menjamin kualitas dan stabilitas obat sampai ke tangan pasien, PBF Online menerapkan standar Quality Assurance ketat:

---

1. **Monitoring Suhu Rantai Dingin (Cold Chain)**: Gudang cold room dan thermo box pengiriman dilengkapi *data logger* kontinu yang menjaga suhu stabil pada interval **2°C hingga 8°C**.
2. **Penerimaan & Verifikasi Fisik**: Setiap obat yang diterima dari manufaktur melalui uji organoleptik, pemeriksaan nomor batch, COA (Certificate of Analysis), dan integritas segel.
3. **Prosedur Retur & Recall CDOB**: Penanganan retur obat rusak/kadaluwarsa dilakukan terpisah di area karantina berpenanda khusus sesuai SOP CDOB.`,
  },
};

export async function getCmsPage(slug: string): Promise<CmsPageData> {
  const defaultPage = DEFAULT_CMS_PAGES[slug] || {
    slug,
    category: "Information",
    title: slug.toUpperCase().replace(/-/g, " "),
    subtitle: "Halaman informasi resmi PBF System",
    body: "Konten sedang dipersiapkan oleh administrator.",
  };

  try {
    const prisma = db as any;
    const setting = await prisma.systemSetting.findUnique({
      where: { key: `cms_${slug}` },
    });

    if (setting && setting.value) {
      const parsed = JSON.parse(setting.value);
      return {
        ...defaultPage,
        ...parsed,
        slug,
      };
    }
  } catch (error) {
    console.error(`Error reading CMS page ${slug}:`, error);
  }

  return defaultPage;
}

export async function getAllCmsPages(): Promise<Record<string, CmsPageData>> {
  const result: Record<string, CmsPageData> = {};
  for (const slug of Object.keys(DEFAULT_CMS_PAGES)) {
    result[slug] = await getCmsPage(slug);
  }
  return result;
}

export async function getDefaultCmsPages(): Promise<Record<string, CmsPageData>> {
  return DEFAULT_CMS_PAGES;
}

export async function updateCmsPage(slug: string, data: { title: string; subtitle: string; body: string }) {
  const session = await getSession();
  if (!session || (session.role !== "SYSTEM_ADMIN" && session.role !== "PBF_ADMIN")) {
    return { success: false, error: "Akses ditolak: Hanya admin PBF yang berhak mengubah halaman CMS." };
  }

  try {
    const prisma = db as any;
    const payload = JSON.stringify({
      title: data.title,
      subtitle: data.subtitle,
      body: data.body,
      updatedAt: new Date().toISOString(),
    });

    await prisma.systemSetting.upsert({
      where: { key: `cms_${slug}` },
      update: { value: payload },
      create: { key: `cms_${slug}`, value: payload },
    });

    revalidatePath("/");
    revalidatePath(`/${slug}`);
    revalidatePath("/admin/dashboard");

    return { success: true, message: `Halaman '${data.title}' berhasil diperbarui!` };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menyimpan konten halaman" };
  }
}
