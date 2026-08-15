import nodemailer from "nodemailer";
import { formatWaybillNumber } from "@/lib/biteship-status";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null; // SMTP belum dikonfigurasi -> fallback ke konsol simulasi
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

export interface OrderEmailData {
  orderNumber: string;
  id: string;
  totalBilling?: number;
  institutionName?: string;
  recipientEmail?: string;
  shippingAddress?: string;
  trackingNumber?: string | null;
  biteshipOrderId?: string | null;
  courierName?: string;
  driverName?: string;
  driverPhone?: string;
  driverPlate?: string;
  cancelReason?: string;
  paymentMethod?: string;
  items?: Array<{ name: string; quantity: number; unit?: string; price?: number }>;
}

export interface PartnerRegistrationEmailData {
  institutionName: string;
  institutionType?: string;
  siaNumber?: string;
  sipaNumber?: string;
  apjName?: string;
  email: string;
  phone?: string;
  address?: string;
  creditLimit?: number;
  topDays?: number;
}

export async function sendEmailNotification(to: string, subject: string, htmlContent: string) {
  const fromEmail = process.env.SMTP_FROM || `"Growmexa Farmasi" <notification@growmexa.com>`;
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`\n==================================================`);
    console.log(`[SIMULASI EMAIL NOTIFIKASI - SMTP BELUM DI-SETUP]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`==================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`[EMAIL SENT SUCCESS]: MessageId ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[EMAIL SEND FAILED]:`, error.message);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// MASTER EMAIL TEMPLATE (Tanpa Logo, Simpel, Elegan, Clean & Modern)
// ============================================================================
export interface MasterEmailOptions {
  badgeText?: string;
  badgeType?: "emerald" | "blue" | "amber" | "rose" | "slate";
  title: string;
  subtitle?: string;
  contentHtml: string;
  ctaButton?: {
    text: string;
    url: string;
    color?: "emerald" | "blue" | "slate";
  };
  footerNotice?: string;
}

export function renderMasterEmailTemplate(options: MasterEmailOptions): string {
  const badgeStyles: Record<string, string> = {
    emerald: "background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;",
    blue: "background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;",
    amber: "background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a;",
    rose: "background-color: #fff1f2; color: #be123c; border: 1px solid #fecdd3;",
    slate: "background-color: #f8fafc; color: #475569; border: 1px solid #cbd5e1;",
  };

  const btnStyles: Record<string, string> = {
    emerald: "background-color: #047857; color: #ffffff; box-shadow: 0 4px 12px rgba(4,120,87,0.2);",
    blue: "background-color: #2563eb; color: #ffffff; box-shadow: 0 4px 12px rgba(37,99,235,0.2);",
    slate: "background-color: #0f172a; color: #ffffff; box-shadow: 0 4px 12px rgba(15,23,42,0.2);",
  };

  const badgeStyle = badgeStyles[options.badgeType || "emerald"];
  const btnStyle = btnStyles[options.ctaButton?.color || "emerald"];

  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 32px 16px; color: #1e293b;">
    <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
      
      <!-- Clean Typographic Header (No Logo) -->
      <div style="padding: 24px 28px 18px 28px; border-bottom: 1px solid #f1f5f9;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: middle;">
              <h1 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">GROWMEXA FARMASI</h1>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">PT GroovyRx Pharmaceutical Group</p>
            </td>
            ${
              options.badgeText
                ? `<td style="vertical-align: middle; text-align: right;">
                    <span style="font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.3px; display: inline-block; ${badgeStyle}">${options.badgeText}</span>
                   </td>`
                : ""
            }
          </tr>
        </table>
      </div>

      <!-- Content Body -->
      <div style="padding: 28px; font-size: 14px; line-height: 1.6; color: #334155;">
        <h2 style="color: #0f172a; font-size: 18px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.3px;">${options.title}</h2>
        ${options.subtitle ? `<p style="color: #64748b; font-size: 13px; margin: 0 0 20px 0;">${options.subtitle}</p>` : `<div style="margin-bottom: 16px;"></div>`}

        ${options.contentHtml}

        ${
          options.ctaButton
            ? `<div style="text-align: center; margin: 28px 0 12px 0;">
                <a href="${options.ctaButton.url}" target="_blank" style="text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 700; display: inline-block; font-size: 14px; ${btnStyle}">${options.ctaButton.text}</a>
               </div>`
            : ""
        }
      </div>

      <!-- Footer Notice -->
      <div style="background: #f8fafc; padding: 16px 28px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        <p style="margin: 0;">${options.footerNotice || "Sistem Notifikasi Resmi PBF PT GroovyRx Pharmaceutical Group"}</p>
        <p style="margin: 4px 0 0 0; font-size: 10px; color: #cbd5e1;">&copy; ${new Date().getFullYear()} Growmexa Farmasi. All rights reserved.</p>
      </div>
    </div>
  </div>
  `;
}

// ============================================================================
// 1. MITRA EMAIL #1: Order Dibuat & Selesaikan Pembayaran
// ============================================================================
export async function sendOrderCreatedMitraEmail(data: OrderEmailData) {
  const recipientEmail = data.recipientEmail || "mitra@growmexa.com";
  const formattedTotal = data.totalBilling ? `Rp ${data.totalBilling.toLocaleString("id-ID")}` : "Sesuai Tagihan SP";
  const subject = `[Growmexa] Pesanan ${data.orderNumber} Dibuat - Selesaikan Pembayaran`;

  const itemsHtml = (data.items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; font-weight: 600;">${item.name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 700; text-align: center;">${item.quantity} ${item.unit || "Box"}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 800; text-align: right;">${item.price ? `Rp ${(item.price * item.quantity).toLocaleString("id-ID")}` : "-"}</td>
        </tr>`
    )
    .join("");

  const contentHtml = `
    <p style="margin: 0 0 12px 0;">Halo <strong>${data.institutionName || "Mitra Apotek"}</strong>,</p>
    <p style="margin: 0 0 20px 0;">Surat Pesanan (SP) farmasi Anda dengan No. SP <strong style="color: #047857;">${data.orderNumber}</strong> telah berhasil dicatat di sistem.</p>

    <!-- Summary Card -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 4px 0;">No. SP (Ref):</td>
          <td style="font-weight: 800; color: #047857; text-align: right; font-family: monospace;">${data.orderNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Metode Pembayaran:</td>
          <td style="font-weight: 700; color: #1e293b; text-align: right;">${data.paymentMethod || "TOP 30 Hari / Virtual Account"}</td>
        </tr>
        <tr style="border-top: 1px dashed #cbd5e1;">
          <td style="color: #0f172a; font-weight: 800; padding: 8px 0 2px 0;">Total Tagihan:</td>
          <td style="font-weight: 800; color: #047857; text-align: right; font-size: 16px; font-family: monospace;">${formattedTotal}</td>
        </tr>
      </table>
    </div>

    ${
      itemsHtml
        ? `<div style="margin: 20px 0;">
            <p style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 8px;">Rincian Sediaan Obat:</p>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f1f5f9; color: #475569; text-transform: uppercase; font-size: 10px;">
                  <th style="padding: 8px 12px; text-align: left;">Nama Sediaan</th>
                  <th style="padding: 8px 12px; text-align: center;">Qty</th>
                  <th style="padding: 8px 12px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
          </div>`
        : ""
    }
  `;

  const html = renderMasterEmailTemplate({
    badgeText: "Order Dibuat",
    badgeType: "blue",
    title: "Surat Pesanan (SP) Berhasil Dibuat",
    subtitle: "Silakan selesaikan pembayaran untuk memproses pengiriman sediaan obat.",
    contentHtml,
    ctaButton: {
      text: "Selesaikan Pembayaran Sekarang",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://growmexa.com"}/customer/dashboard`,
      color: "emerald",
    },
  });

  await sendEmailNotification(recipientEmail, subject, html);
}

// ============================================================================
// 2. MITRA EMAIL #2: Pembayaran Diterima & Barang Siap Dikirim
// ============================================================================
export async function sendPaymentReceivedMitraEmail(data: OrderEmailData) {
  const recipientEmail = data.recipientEmail || "mitra@growmexa.com";
  const subject = `[Growmexa] Pembayaran ${data.orderNumber} Diterima - Barang Siap Dikirim`;

  const contentHtml = `
    <p style="margin: 0 0 12px 0;">Halo <strong>${data.institutionName || "Mitra Apotek"}</strong>,</p>
    <p style="margin: 0 0 20px 0;">Pembayaran untuk Surat Pesanan <strong style="color: #047857;">${data.orderNumber}</strong> telah berhasil terverifikasi lunas.</p>

    <div style="background: #ecfdf5; border-radius: 12px; padding: 16px; border: 1px solid #a7f3d0; margin: 20px 0;">
      <p style="margin: 0; font-weight: 700; color: #047857; font-size: 13px;">📦 Barang Siap Dikirim (Pengepakan FEFO Logistik)</p>
      <p style="margin: 6px 0 0 0; font-size: 12px; color: #334155;">Sediaan obat Anda sedang disiapkan oleh tim logistik PBF sesuai standar CDOB.</p>
    </div>
  `;

  const html = renderMasterEmailTemplate({
    badgeText: "Pembayaran Lunas",
    badgeType: "emerald",
    title: "Pembayaran Berhasil Diterima",
    subtitle: "Pesanan Anda masuk ke antrean pengepakan ekspres logistik.",
    contentHtml,
    ctaButton: {
      text: "Pantau Pesanan di Dashboard",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://growmexa.com"}/customer/dashboard`,
      color: "blue",
    },
  });

  await sendEmailNotification(recipientEmail, subject, html);
}

export function getCourierNameFromAddress(addr?: string): string {
  if (!addr) return "Ekspedisi Pilihan Mitra saat Checkout";
  const match = addr.match(/Kurir:\s*([^\n|[\]]+)/i);
  if (match && match[1]) {
    const raw = match[1].trim();
    if (raw && raw !== "-") return raw;
  }
  if (addr.includes("groovyrx") || addr.includes("Logistik")) {
    return "Logistik PBF GroovyCare";
  }
  return "Ekspedisi Pilihan Mitra saat Checkout";
}

// ============================================================================
// 3. MITRA EMAIL #3: Barang Sudah Dikirim & Detail Pengiriman
// ============================================================================
export async function sendOrderShippedMitraEmail(data: OrderEmailData) {
  const recipientEmail = data.recipientEmail || "mitra@growmexa.com";
  const resi = formatWaybillNumber(data.trackingNumber, data.biteshipOrderId, data.id);
  const courierName = data.courierName || getCourierNameFromAddress(data.shippingAddress);
  const subject = `[Growmexa] Pesanan ${data.orderNumber} Dikirim (${courierName} - Resi: ${resi})`;

  const contentHtml = `
    <p style="margin: 0 0 12px 0;">Halo <strong>${data.institutionName || "Mitra Apotek"}</strong>,</p>
    <p style="margin: 0 0 20px 0;">Pesanan obat Anda No. SP <strong style="color: #047857;">${data.orderNumber}</strong> telah diserahkan kepada pihak ekspedisi.</p>

    <!-- Waybill Card -->
    <div style="background: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 4px 0;">No. Resi (Waybill AWB):</td>
          <td style="font-weight: 800; color: #047857; font-family: monospace; text-align: right;">${resi}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Ekspedisi Kurir:</td>
          <td style="font-weight: 700; color: #0f172a; text-align: right;">${courierName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Info Driver Kurir:</td>
          <td style="font-weight: 700; color: #1e293b; text-align: right;">${data.driverName || "Kurir Operasional"} (${data.driverPlate || "-"})</td>
        </tr>
      </table>
    </div>
  `;

  const html = renderMasterEmailTemplate({
    badgeText: "Dalam Pengiriman",
    badgeType: "blue",
    title: "Barang Pesanan Sedang Dikirim",
    subtitle: "Kurir sedang menuju sarana apotek/klinik Anda.",
    contentHtml,
    ctaButton: {
      text: "Lacak Kurir Real-Time",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://growmexa.com"}/customer/dashboard`,
      color: "emerald",
    },
  });

  await sendEmailNotification(recipientEmail, subject, html);
}

// ============================================================================
// 4. MITRA EMAIL #4: Pesanan SP Dibatalkan / Ditolak
// ============================================================================
export async function sendOrderCancelledMitraEmail(data: OrderEmailData) {
  const recipientEmail = data.recipientEmail || "mitra@growmexa.com";
  const subject = `[Growmexa] Pemberitahuan Pembatalan Pesanan ${data.orderNumber}`;

  const contentHtml = `
    <p style="margin: 0 0 12px 0;">Halo <strong>${data.institutionName || "Mitra Apotek"}</strong>,</p>
    <p style="margin: 0 0 20px 0;">Informasi bahwa pesanan Surat Pesanan No. SP <strong style="color: #be123c;">${data.orderNumber}</strong> telah dibatalkan.</p>

    <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-weight: 700; color: #be123c; font-size: 13px;">Alasan Pembatalan:</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #4c0519; font-style: italic;">"${data.cancelReason || "Permintaan pembatalan dari pengguna / PBF Admin."}"</p>
    </div>
  `;

  const html = renderMasterEmailTemplate({
    badgeText: "Order Dibatalkan",
    badgeType: "rose",
    title: "Pesanan Surat Pesanan Dibatalkan",
    subtitle: "Proses pesanan SP telah dihentikan oleh sistem / PBF.",
    contentHtml,
    ctaButton: {
      text: "Buka Dashboard Mitra",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://growmexa.com"}/customer/dashboard`,
      color: "slate",
    },
  });

  await sendEmailNotification(recipientEmail, subject, html);
}

// ============================================================================
// 5. ADMIN PBF EMAIL #5: Mitra Order Pesanan Baru (Alert Admin PBF)
// ============================================================================
export async function sendNewOrderAdminAlertEmail(data: OrderEmailData) {
  const adminEmail = process.env.SMTP_ADMIN_EMAIL || "admin@growmexa.com";
  const formattedTotal = data.totalBilling ? `Rp ${data.totalBilling.toLocaleString("id-ID")}` : "-";
  const subject = `[ADMIN PBF] Order Pesanan Baru ${data.orderNumber} - ${data.institutionName || "Apotek Mitra"}`;

  const contentHtml = `
    <p style="margin: 0 0 12px 0;">Halo <strong>Tim Admin PBF</strong>,</p>
    <p style="margin: 0 0 20px 0;">Mitra <strong>${data.institutionName || "Apotek Mitra"}</strong> membuat pesanan Surat Pesanan (SP) baru pada portal Growmexa.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 4px 0;">No. SP (Reference):</td>
          <td style="font-weight: 800; color: #047857; text-align: right; font-family: monospace;">${data.orderNumber}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Alamat Pengiriman:</td>
          <td style="font-weight: 600; color: #334155; text-align: right; font-size: 12px;">${data.shippingAddress || "Alamat Terdaftar"}</td>
        </tr>
        <tr style="border-top: 1px dashed #cbd5e1;">
          <td style="color: #0f172a; font-weight: 800; padding: 8px 0 2px 0;">Total Tagihan SP:</td>
          <td style="font-weight: 800; color: #2563eb; text-align: right; font-size: 15px; font-family: monospace;">${formattedTotal}</td>
        </tr>
      </table>
    </div>
  `;

  const html = renderMasterEmailTemplate({
    badgeText: "Alert Operasional",
    badgeType: "blue",
    title: "Pesanan Baru Masuk Membutuhkan Verifikasi",
    subtitle: "Verifikasi CDOB & SIPA Apoteker Penanggung Jawab PBF.",
    contentHtml,
    ctaButton: {
      text: "Buka Dashboard Admin PBF",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://growmexa.com"}/admin/dashboard`,
      color: "blue",
    },
    footerNotice: "Sistem Notifikasi Internal Operasional PBF Growmexa",
  });

  await sendEmailNotification(adminEmail, subject, html);
}

// ============================================================================
// 6. ADMIN PBF EMAIL #6: Order Dibatalkan (Alert Admin PBF)
// ============================================================================
export async function sendOrderCancelledAdminEmail(data: OrderEmailData) {
  const adminEmail = process.env.SMTP_ADMIN_EMAIL || "admin@growmexa.com";
  const subject = `[ADMIN PBF] Pembatalan Pesanan ${data.orderNumber} - ${data.institutionName || "Apotek Mitra"}`;

  const contentHtml = `
    <p style="margin: 0 0 12px 0;">Halo <strong>Tim Admin PBF</strong>,</p>
    <p style="margin: 0 0 20px 0;">Informasi bahwa pesanan Surat Pesanan No. SP <strong style="color: #be123c;">${data.orderNumber}</strong> dari <strong>${data.institutionName || "Mitra Apotek"}</strong> telah dibatalkan.</p>

    <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; font-weight: 700; color: #be123c; font-size: 13px;">Alasan Pembatalan:</p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #4c0519; font-style: italic;">"${data.cancelReason || "Dibatalkan oleh Mitra / Admin / Biteship API."}"</p>
    </div>
  `;

  const html = renderMasterEmailTemplate({
    badgeText: "Order Cancelled",
    badgeType: "rose",
    title: "Pesanan Surat Pesanan Dibatalkan",
    subtitle: "Pesanan SP dibatalkan oleh mitra/sistem.",
    contentHtml,
    ctaButton: {
      text: "Cek Modul Logistik Admin",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://growmexa.com"}/admin/dashboard`,
      color: "slate",
    },
    footerNotice: "Sistem Notifikasi Internal Operasional PBF Growmexa",
  });

  await sendEmailNotification(adminEmail, subject, html);
}

// ============================================================================
// 7. MITRA REGISTRASI EMAIL #7: Pendaftaran Berhasil & Menunggu Approval Admin PBF
// ============================================================================
export async function sendRegistrationSubmittedMitraEmail(data: PartnerRegistrationEmailData) {
  const recipientEmail = data.email || "mitra@growmexa.com";
  const subject = `[Growmexa] Pendaftaran Akun ${data.institutionName} Berhasil - Menunggu Verifikasi Admin PBF`;

  const contentHtml = `
    <p style="margin: 0 0 12px 0;">Halo <strong>${data.apjName || data.institutionName}</strong>,</p>
    <p style="margin: 0 0 20px 0;">Terima kasih telah mendaftar di <strong>Growmexa Farmasi</strong>. Formulir pendaftaran dan kelengkapan izin sarana farmasi Anda telah tercatat di sistem kami.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Nama Sarana / Apotek:</td>
          <td style="font-weight: 800; color: #0f172a; text-align: right;">${data.institutionName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">No. SIA / Izin Operasional:</td>
          <td style="font-weight: 800; color: #047857; text-align: right; font-family: monospace;">${data.siaNumber || "-"}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Apoteker Penanggung Jawab:</td>
          <td style="font-weight: 700; color: #1e293b; text-align: right;">${data.apjName || "-"} (${data.sipaNumber || "-"})</td>
        </tr>
      </table>
    </div>
  `;

  const html = renderMasterEmailTemplate({
    badgeText: "Menunggu Verifikasi",
    badgeType: "amber",
    title: "Pendaftaran Akun Mitra Berhasil Dikirim",
    subtitle: "Dokumen legalitas izin apotek Anda sedang diverifikasi CDOB oleh Admin PBF (maks 1x24 jam).",
    contentHtml,
    ctaButton: {
      text: "Cek Status di Portal Login",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://growmexa.com"}/login`,
      color: "emerald",
    },
  });

  await sendEmailNotification(recipientEmail, subject, html);
}

// ============================================================================
// 8. ADMIN PBF ALERT #8: Pendaftaran Mitra Apotek Baru Masuk
// ============================================================================
export async function sendNewRegistrationAdminAlertEmail(data: PartnerRegistrationEmailData) {
  const adminEmail = process.env.SMTP_ADMIN_EMAIL || "admin@growmexa.com";
  const subject = `[ADMIN PBF] Pendaftaran Apotek Baru: ${data.institutionName}`;

  const contentHtml = `
    <p style="margin: 0 0 12px 0;">Halo <strong>Tim Admin PBF</strong>,</p>
    <p style="margin: 0 0 20px 0;">Calon mitra sarana farmasi baru mendaftar dan membutuhkan verifikasi dokumen SIA/SIPA:</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Nama Apotek / Sarana:</td>
          <td style="font-weight: 800; color: #0f172a; text-align: right;">${data.institutionName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">No. SIA:</td>
          <td style="font-weight: 800; color: #047857; text-align: right; font-family: monospace;">${data.siaNumber || "-"}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Email / No. HP:</td>
          <td style="font-weight: 700; color: #2563eb; text-align: right;">${data.email} / ${data.phone || "-"}</td>
        </tr>
      </table>
    </div>
  `;

  const html = renderMasterEmailTemplate({
    badgeText: "Mitra Baru",
    badgeType: "blue",
    title: "Calon Mitra Apotek Baru Mendaftar",
    subtitle: "Harap periksa keabsahan SIA/SIPA dan berikan persetujuan akun.",
    contentHtml,
    ctaButton: {
      text: "Buka Dashboard & Approve Akun",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://growmexa.com"}/admin/dashboard`,
      color: "blue",
    },
    footerNotice: "Sistem Notifikasi Internal Operasional PBF Growmexa",
  });

  await sendEmailNotification(adminEmail, subject, html);
}

// ============================================================================
// 9. MITRA APPROVAL EMAIL #9: Akun Apotek Telah Disetujui (Approved)
// ============================================================================
export async function sendAccountApprovedMitraEmail(data: PartnerRegistrationEmailData) {
  const recipientEmail = data.email || "mitra@growmexa.com";
  const formattedLimit = data.creditLimit ? `Rp ${data.creditLimit.toLocaleString("id-ID")}` : "Rp 0";
  const subject = `[Growmexa] Selamat! Akun Apotek ${data.institutionName} Telah Disetujui PBF`;

  const contentHtml = `
    <p style="margin: 0 0 12px 0;">Halo <strong>${data.apjName || data.institutionName}</strong>,</p>
    <p style="margin: 0 0 20px 0;">Akun Mitra Apotek Anda <strong>${data.institutionName}</strong> telah resmi disetujui dan diaktifkan oleh Tim Admin PBF Growmexa.</p>

    <!-- Credit Limit Card -->
    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">Fasilitas Plafon Limit Kredit &amp; Tenor Anda:</p>
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="color: #065f46; padding: 4px 0;">Plafon Limit Kredit:</td>
          <td style="font-weight: 800; color: #047857; text-align: right; font-size: 16px; font-family: monospace;">${formattedLimit}</td>
        </tr>
        <tr>
          <td style="color: #065f46; padding: 4px 0;">Tenor Pembayaran (TOP):</td>
          <td style="font-weight: 700; color: #1e293b; text-align: right;">${data.topDays || 30} Hari</td>
        </tr>
      </table>
    </div>
  `;

  const html = renderMasterEmailTemplate({
    badgeText: "Akun Disetujui",
    badgeType: "emerald",
    title: "Selamat! Akun Apotek Anda Telah Disetujui",
    subtitle: "Dokumen Kepatuhan CDOB & SIA/SIPA Anda tervalidasi aktif. Anda sudah dapat memesan sediaan farmasi.",
    contentHtml,
    ctaButton: {
      text: "Login & Mulai Pesan Obat",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://growmexa.com"}/login`,
      color: "emerald",
    },
  });

  await sendEmailNotification(recipientEmail, subject, html);
}

// ============================================================================
// 10. PASSWORD RESET EMAIL (Simpel, Elegan, Clean & Modern)
// ============================================================================
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  reqIp: string = "127.0.0.1",
  reqAgent: string = "Browser"
) {
  const subject = `[GroovyCare PBF] Permintaan Reset Kata Sandi Akun Anda`;
  const timeFormatted = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const contentHtml = `
    <p style="margin: 0 0 12px 0;">Yth. Mitra Farmasi,</p>
    <p style="margin: 0 0 20px 0;">Kami menerima permintaan untuk mengatur ulang kata sandi akun bisnis GroovyCare yang terhubung dengan email: <strong style="color: #0f172a; font-family: monospace;">${email}</strong>.</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin: 20px 0; text-align: center; font-size: 12px; color: #64748b;">
      ⏱️ Tautan ini berlaku selama <strong>15 menit</strong>. Jangan bagikan tautan ini kepada siapapun.
    </div>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
      <p style="margin: 0 0 4px 0;"><strong>Detail Permintaan Security Log:</strong></p>
      <p style="margin: 0;">Waktu: ${timeFormatted} WITA | IP Address: ${reqIp}</p>
      <p style="margin: 2px 0 0 0;">Perangkat: ${reqAgent}</p>
    </div>
  `;

  const html = renderMasterEmailTemplate({
    badgeText: "Keamanan Akun",
    badgeType: "emerald",
    title: "Permintaan Atur Ulang Kata Sandi",
    subtitle: "Permintaan pemulihan kata sandi akun bisnis mitra farmasi.",
    contentHtml,
    ctaButton: {
      text: "Atur Ulang Kata Sandi",
      url: resetUrl,
      color: "emerald",
    },
  });

  return await sendEmailNotification(email, subject, html);
}

// ============================================================================
// 11. PASSWORD RESET SUCCESS EMAIL
// ============================================================================
export async function sendPasswordResetSuccessEmail(
  email: string,
  reqIp: string = "127.0.0.1",
  reqAgent: string = "Browser"
) {
  const subject = `[Keamanan Akun] Kata Sandi Anda Berhasil Diperbarui - GroovyCare`;
  const timeFormatted = new Date().toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const contentHtml = `
    <p style="margin: 0 0 12px 0;">Halo Mitra Farmasi,</p>
    <p style="margin: 0 0 16px 0;">Kata sandi untuk akun bisnis Anda (<strong style="color: #0f172a; font-family: monospace;">${email}</strong>) telah berhasil diperbarui.</p>
    <p style="margin: 0 0 20px 0; font-size: 12px; color: #64748b;">Demi keamanan data dan kepatuhan regulasi CDOB/BPOM, seluruh sesi login sebelumnya pada perangkat lain telah dinonaktifkan secara otomatis.</p>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0;">Waktu Perubahan: ${timeFormatted} WITA | IP: ${reqIp}</p>
    </div>
  `;

  const html = renderMasterEmailTemplate({
    badgeText: "Kata Sandi Diperbarui",
    badgeType: "emerald",
    title: "Kata Sandi Berhasil Diperbarui",
    subtitle: "Akun bisnis Anda kini telah dilindungi dengan kata sandi baru.",
    contentHtml,
    ctaButton: {
      text: "Login ke Akun Anda",
      url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://growmexa.com"}/login`,
      color: "emerald",
    },
  });

  return await sendEmailNotification(email, subject, html);
}
