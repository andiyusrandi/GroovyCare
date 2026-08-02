export interface BiteshipStatusMeta {
  code: string;
  label: string;
  description: string;
  badgeClass: string;
  bgLightClass: string;
  textClass: string;
  iconName: string;
}

export const BITESHIP_STATUS_MAP: Record<string, BiteshipStatusMeta> = {
  confirmed: {
    code: "confirmed",
    label: "Dikonfirmasi",
    description: "Pesanan telah dikonfirmasi. Sedang mencari pengemudi terdekat untuk menjemput.",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200 font-black",
    bgLightClass: "bg-blue-50/50",
    textClass: "text-blue-700",
    iconName: "check_circle"
  },
  allocated: {
    code: "allocated",
    label: "Dialokasikan",
    description: "Kurir telah ditugaskan. Menunggu untuk mengambil.",
    badgeClass: "bg-indigo-50 text-indigo-700 border border-indigo-200 font-black",
    bgLightClass: "bg-indigo-50/50",
    textClass: "text-indigo-700",
    iconName: "badge"
  },
  picking_up: {
    code: "picking_up",
    label: "Mengambil",
    description: "Kurir sedang dalam perjalanan untuk mengambil barang.",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200 font-black",
    bgLightClass: "bg-amber-50/50",
    textClass: "text-amber-700",
    iconName: "directions_run"
  },
  picked: {
    code: "picked",
    label: "Memilih",
    description: "Barang telah dipilih dan siap dikirim.",
    badgeClass: "bg-cyan-50 text-cyan-700 border border-cyan-200 font-black",
    bgLightClass: "bg-cyan-50/50",
    textClass: "text-cyan-700",
    iconName: "inventory_2"
  },
  in_transit: {
    code: "in_transit",
    label: "Dalam Perjalanan",
    description: "Barang sedang dalam perjalanan ke tujuan.",
    badgeClass: "bg-blue-500 text-white font-black animate-pulse",
    bgLightClass: "bg-blue-50/50",
    textClass: "text-blue-700",
    iconName: "local_shipping"
  },
  dropping_off: {
    code: "dropping_off",
    label: "Menurunkan",
    description: "Barang sedang dalam perjalanan menuju lokasi pelanggan.",
    badgeClass: "bg-sky-500 text-white font-black animate-pulse",
    bgLightClass: "bg-sky-50/50",
    textClass: "text-sky-700",
    iconName: "near_me"
  },
  return_in_transit: {
    code: "return_in_transit",
    label: "Kembali Dalam Perjalanan",
    description: "Pesanan sedang dalam perjalanan kembali ke sumbernya.",
    badgeClass: "bg-orange-50 text-orange-700 border border-orange-200 font-black",
    bgLightClass: "bg-orange-50/50",
    textClass: "text-orange-700",
    iconName: "replay"
  },
  on_hold: {
    code: "on_hold",
    label: "Ditangguhkan",
    description: "Pengiriman Anda saat ini sedang ditangguhkan. Kami akan mengirimkan barang Anda setelah masalah ini teratasi.",
    badgeClass: "bg-amber-100 text-amber-900 border border-amber-300 font-black",
    bgLightClass: "bg-amber-50/50",
    textClass: "text-amber-900",
    iconName: "pause_circle"
  },
  suspended: {
    code: "suspended",
    label: "Ditangguhkan",
    description: "Pengiriman Anda saat ini sedang ditangguhkan. Kami akan mengirimkan barang Anda setelah masalah ini teratasi.",
    badgeClass: "bg-amber-100 text-amber-900 border border-amber-300 font-black",
    bgLightClass: "bg-amber-50/50",
    textClass: "text-amber-900",
    iconName: "pause_circle"
  },
  delivered: {
    code: "delivered",
    label: "Terkirim",
    description: "Barang telah dikirim.",
    badgeClass: "bg-emerald-500 text-white font-black",
    bgLightClass: "bg-emerald-50/50",
    textClass: "text-emerald-700",
    iconName: "task_alt"
  },
  rejected: {
    code: "rejected",
    label: "Ditolak",
    description: "Pengiriman Anda telah ditolak. Silakan hubungi Biteship untuk informasi lebih lanjut.",
    badgeClass: "bg-rose-50 text-rose-700 border border-rose-200 font-black",
    bgLightClass: "bg-rose-50/50",
    textClass: "text-rose-700",
    iconName: "cancel"
  },
  courier_not_found: {
    code: "courier_not_found",
    label: "Kurir Tidak Ditemukan",
    description: "Pengiriman Anda dibatalkan karena saat ini tidak ada kurir yang tersedia.",
    badgeClass: "bg-rose-50 text-rose-700 border border-rose-200 font-black",
    bgLightClass: "bg-rose-50/50",
    textClass: "text-rose-700",
    iconName: "person_off"
  },
  returned: {
    code: "returned",
    label: "Kembali",
    description: "Pesanan berhasil dikembalikan.",
    badgeClass: "bg-slate-100 text-slate-700 border border-slate-300 font-black",
    bgLightClass: "bg-slate-50",
    textClass: "text-slate-700",
    iconName: "undo"
  },
  cancelled: {
    code: "cancelled",
    label: "Dibatalkan",
    description: "Pesanan dibatalkan.",
    badgeClass: "bg-rose-100 text-rose-800 border border-rose-200 font-black",
    bgLightClass: "bg-rose-50",
    textClass: "text-rose-800",
    iconName: "block"
  },
  pending: {
    code: "pending",
    label: "Diproses",
    description: "Pesanan berhasil diproses.",
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

  // Smart fallback map based on Prisma main order status if Biteship API status is empty
  const mainStatusKey = (mainOrderStatus || "").toUpperCase().trim();
  if (mainStatusKey === "DELIVERED") {
    return BITESHIP_STATUS_MAP["delivered"];
  }
  if (mainStatusKey === "SHIPPED") {
    return BITESHIP_STATUS_MAP["in_transit"];
  }
  if (mainStatusKey === "PENDING_SHIPPING") {
    return BITESHIP_STATUS_MAP["picked"];
  }
  if (mainStatusKey === "PENDING_APPROVAL") {
    return BITESHIP_STATUS_MAP["confirmed"];
  }
  if (mainStatusKey === "REJECTED" || mainStatusKey === "CANCELLED") {
    return BITESHIP_STATUS_MAP["cancelled"];
  }

  return {
    code: key || "pending",
    label: "Sedang Diproses",
    description: "Pesanan sedang diproses di Gudang PBF",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200 font-black",
    bgLightClass: "bg-amber-50/50",
    textClass: "text-amber-700",
    iconName: "hourglass_top"
  };
}
