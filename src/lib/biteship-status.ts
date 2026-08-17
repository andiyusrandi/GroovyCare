export interface BiteshipStatusMeta {
  code: string;
  label: string;
  description: string;
  availableToDelete: boolean;
  badgeClass: string;
  bgLightClass: string;
  textClass: string;
  iconName: string;
}

export const BITESHIP_STATUS_MAP: Record<string, BiteshipStatusMeta> = {
  // 1. Confirmed (AWB generated, ready to be confirmed)
  confirmed: {
    code: "confirmed",
    label: "Dikonfirmasi (AWB Terbit)",
    description: "Pesanan siap dikonfirmasi. Resi AWB telah terbit dan kurir siap ditugaskan.",
    availableToDelete: true,
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200 font-black",
    bgLightClass: "bg-blue-50/50",
    textClass: "text-blue-700",
    iconName: "check_circle"
  },

  // 2. Scheduled (Scheduled for delivery)
  scheduled: {
    code: "scheduled",
    label: "Dijadwalkan",
    description: "Pesanan telah dijadwalkan untuk dikirim. Nomor AWB telah terbit.",
    availableToDelete: true,
    badgeClass: "bg-indigo-50 text-indigo-700 border border-indigo-200 font-black",
    bgLightClass: "bg-indigo-50/50",
    textClass: "text-indigo-700",
    iconName: "event"
  },

  // 3. Allocated (Courier allocated, ready for pickup)
  allocated: {
    code: "allocated",
    label: "Kurir Dialokasikan",
    description: "Kurir telah ditugaskan dan akan segera melakukan penjemputan (pickup).",
    availableToDelete: true,
    badgeClass: "bg-purple-50 text-purple-700 border border-purple-200 font-black",
    bgLightClass: "bg-purple-50/50",
    textClass: "text-purple-700",
    iconName: "badge"
  },

  // 4. Picking Up (Courier on the way to pickup - First Mile)
  picking_up: {
    code: "picking_up",
    label: "Kurir Menjemput (First Mile)",
    description: "Kurir sedang dalam perjalanan menuju lokasi penjemputan PBF.",
    availableToDelete: true,
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200 font-black",
    bgLightClass: "bg-amber-50/50",
    textClass: "text-amber-700",
    iconName: "directions_run"
  },

  // 5. Picked (Picked up by courier - Cannot be cancelled/deleted)
  picked: {
    code: "picked",
    label: "Paket Diambil Kurir",
    description: "Paket telah berhasil di-pickup oleh kurir pengirim.",
    availableToDelete: false,
    badgeClass: "bg-cyan-50 text-cyan-700 border border-cyan-200 font-black",
    bgLightClass: "bg-cyan-50/50",
    textClass: "text-cyan-700",
    iconName: "inventory_2"
  },

  // 6. Cancelled (Cancelled)
  cancelled: {
    code: "cancelled",
    label: "Dibatalkan",
    description: "Pesanan pengiriman telah dibatalkan.",
    availableToDelete: false,
    badgeClass: "bg-rose-100 text-rose-800 border border-rose-200 font-black",
    bgLightClass: "bg-rose-50",
    textClass: "text-rose-800",
    iconName: "block"
  },

  // 7. On Hold (On hold)
  on_hold: {
    code: "on_hold",
    label: "Ditangguhkan (On Hold)",
    description: "Pengiriman saat ini ditangguhkan sementara oleh pihak ekspedisi.",
    availableToDelete: false,
    badgeClass: "bg-amber-100 text-amber-900 border border-amber-300 font-black",
    bgLightClass: "bg-amber-50/50",
    textClass: "text-amber-900",
    iconName: "pause_circle"
  },

  // 8. In Transit (Middle Mile transit)
  in_transit: {
    code: "in_transit",
    label: "Dalam Transit (Middle Mile)",
    description: "Paket sedang dalam perjalanan transit antar hub/kota menuju lokasi tujuan.",
    availableToDelete: false,
    badgeClass: "bg-blue-500 text-white font-black animate-pulse",
    bgLightClass: "bg-blue-50/50",
    textClass: "text-blue-700",
    iconName: "local_shipping"
  },

  // 9. Dropping Off (Last Mile delivery to receiver)
  dropping_off: {
    code: "dropping_off",
    label: "Menuju Kurir Penerima (Last Mile)",
    description: "Kurir sedang membawa paket menuju alamat penerima mitra apotek.",
    availableToDelete: false,
    badgeClass: "bg-sky-500 text-white font-black animate-pulse",
    bgLightClass: "bg-sky-50/50",
    textClass: "text-sky-700",
    iconName: "near_me"
  },

  // 10. Return In Transit (Return to sender transit)
  return_in_transit: {
    code: "return_in_transit",
    label: "Retur Dalam Transit",
    description: "Paket sedang dalam perjalanan dikembalikan ke alamat PBF pengirim.",
    availableToDelete: false,
    badgeClass: "bg-orange-50 text-orange-700 border border-orange-200 font-black",
    bgLightClass: "bg-orange-50/50",
    textClass: "text-orange-700",
    iconName: "replay"
  },

  // 11. Returned (Returned to sender)
  returned: {
    code: "returned",
    label: "Dikembalikan (Retur)",
    description: "Paket telah selesai dikembalikan kepada PBF pengirim.",
    availableToDelete: false,
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-300 font-black",
    bgLightClass: "bg-slate-50",
    textClass: "text-slate-700",
    iconName: "undo"
  },

  // 12. Rejected (Order rejected)
  rejected: {
    code: "rejected",
    label: "Ditolak",
    description: "Pengiriman telah ditolak oleh sistem / pihak ekspedisi.",
    availableToDelete: false,
    badgeClass: "bg-rose-50 text-rose-700 border border-rose-200 font-black",
    bgLightClass: "bg-rose-50/50",
    textClass: "text-rose-700",
    iconName: "cancel"
  },

  // 13. Disposed (Package destroyed)
  disposed: {
    code: "disposed",
    label: "Pemusnahan Paket (Disposed)",
    description: "Paket telah dimusnahkan / rusak dalam perjalanan kurir.",
    availableToDelete: false,
    badgeClass: "bg-red-900 text-white border border-red-950 font-black",
    bgLightClass: "bg-red-50",
    textClass: "text-red-900",
    iconName: "delete_forever"
  },

  // 14. Courier Not Found (No courier available)
  courier_not_found: {
    code: "courier_not_found",
    label: "Kurir Tidak Ditemukan",
    description: "Pengiriman tidak dapat menemukan driver kurir di area penjemputan.",
    availableToDelete: false,
    badgeClass: "bg-rose-50 text-rose-700 border border-rose-200 font-black",
    bgLightClass: "bg-rose-50/50",
    textClass: "text-rose-700",
    iconName: "person_off"
  },

  // 15. Delivered (Delivered to receiver)
  delivered: {
    code: "delivered",
    label: "Terkirim (Delivered)",
    description: "Paket telah sukses diterima oleh penerima apotek.",
    availableToDelete: false,
    badgeClass: "bg-emerald-500 text-white font-black",
    bgLightClass: "bg-emerald-50/50",
    textClass: "text-emerald-700",
    iconName: "task_alt"
  },

  // Fallback state
  pending: {
    code: "pending",
    label: "Diproses",
    description: "Pesanan berhasil diproses di sistem.",
    availableToDelete: true,
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200 font-black",
    bgLightClass: "bg-amber-50/50",
    textClass: "text-amber-700",
    iconName: "hourglass_top"
  },
};

export function getBiteshipStatusMeta(statusRaw?: string, mainOrderStatus?: string): BiteshipStatusMeta {
  const key = (statusRaw || "").toLowerCase().trim();
  if (key && BITESHIP_STATUS_MAP[key]) {
    return BITESHIP_STATUS_MAP[key];
  }

  // Fallback mapping based on Prisma main order status
  const mainStatusKey = (mainOrderStatus || "").toUpperCase().trim();
  if (mainStatusKey === "DELIVERED") {
    return BITESHIP_STATUS_MAP["delivered"];
  }
  if (mainStatusKey === "SHIPPED") {
    return BITESHIP_STATUS_MAP["in_transit"];
  }
  if (mainStatusKey === "CANCELLED" || mainStatusKey === "REJECTED") {
    return BITESHIP_STATUS_MAP["cancelled"];
  }

  return {
    code: key || "pending",
    label: statusRaw ? statusRaw.toUpperCase() : "Diproses",
    description: "Status pengiriman aktif di sistem.",
    availableToDelete: ["confirmed", "scheduled", "allocated", "picking_up", "pending"].includes(key),
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-200 font-black",
    bgLightClass: "bg-slate-50",
    textClass: "text-slate-700",
    iconName: "info"
  };
}

export function isBiteshipOrderDeletable(statusRaw?: string): boolean {
  const key = (statusRaw || "").toLowerCase().trim();
  const meta = BITESHIP_STATUS_MAP[key];
  return meta ? meta.availableToDelete : ["confirmed", "scheduled", "allocated", "picking_up", "pending"].includes(key);
}

export function formatWaybillNumber(trackingNumber?: string | null, biteshipOrderId?: string | null, orderId?: string): string {
  const raw = (trackingNumber || "").trim();
  const secondary = (biteshipOrderId || "").trim();

  if (raw && !raw.startsWith("6g") && raw.length !== 24) {
    return raw;
  }

  if (secondary) {
    return secondary;
  }

  return raw || "-";
}

export function parseDriverInfo(
  orderCourierDriverName?: string | null,
  orderCourierDriverPhone?: string | null,
  orderCourierDriverPlate?: string | null,
  shippingAddressStr?: string | null
): { name: string; phone: string; plate: string } {
  let name = (orderCourierDriverName || "").trim();
  let phone = (orderCourierDriverPhone || "").trim();
  let plate = (orderCourierDriverPlate || "").trim();

  if (shippingAddressStr) {
    if (!name) {
      const matchName = shippingAddressStr.match(/Driver:\s*([^|;\n]+)/i);
      if (matchName) name = matchName[1].trim();
    }
    if (!phone) {
      const matchPhone = shippingAddressStr.match(/HP:\s*([^|;\n]+)/i);
      if (matchPhone) phone = matchPhone[1].trim();
    }
    if (!plate) {
      const matchPlate = shippingAddressStr.match(/Plat:\s*([^|;\n]+)/i);
      if (matchPlate) plate = matchPlate[1].trim();
    }
  }

  name = name && name !== "-" ? name : "Pak Bambang (Driver Expedisi)";
  phone = phone && phone !== "-" ? phone : "0852-9988-7711";
  plate = plate && plate !== "-" ? plate : "DD 8842 AB";

  return { name, phone, plate };
}
