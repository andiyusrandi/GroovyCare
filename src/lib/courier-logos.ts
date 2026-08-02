export interface CourierMeta {
  name: string;
  code: string;
  logoUrl: string;
  bgClass: string;
  textClass: string;
}

/**
 * Returns local courier logo image URL, brand colors, and display metadata for Biteship couriers.
 */
export function getCourierMeta(courierCodeRaw?: string, courierNameRaw?: string): CourierMeta {
  const code = (courierCodeRaw || "").toLowerCase().trim();
  const name = (courierNameRaw || "").toLowerCase().trim();

  if (code.includes("groovyrx") || name.includes("groovyrx")) {
    return {
      name: "Logistik Groovyrx",
      code: "groovyrx",
      logoUrl: "/icon-192.png",
      bgClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      textClass: "text-emerald-700",
    };
  }

  if (code.includes("jne") || name.includes("jne")) {
    return {
      name: "JNE Express",
      code: "jne",
      logoUrl: "/images/couriers/sq_jne.png",
      bgClass: "bg-blue-50 text-blue-800 border-blue-200",
      textClass: "text-blue-700",
    };
  }

  if (code.includes("sicepat") || name.includes("sicepat")) {
    return {
      name: "SiCepat Ekspres",
      code: "sicepat",
      logoUrl: "/images/couriers/sq_sicepat.png",
      bgClass: "bg-red-50 text-red-700 border-red-200",
      textClass: "text-red-700",
    };
  }

  if (code.includes("jntcargo") || name.includes("j&t cargo")) {
    return {
      name: "J&T Cargo",
      code: "jntcargo",
      logoUrl: "/images/couriers/sq_jntcargo.png",
      bgClass: "bg-red-50 text-red-700 border-red-200",
      textClass: "text-red-700",
    };
  }

  if (code.includes("jnt") || code.includes("j&t") || name.includes("j&t") || name.includes("jnt")) {
    return {
      name: "J&T Express",
      code: "jnt",
      logoUrl: "/images/couriers/sq_jnt.png",
      bgClass: "bg-rose-50 text-rose-700 border-rose-200",
      textClass: "text-rose-700",
    };
  }

  if (code.includes("tiki") || name.includes("tiki")) {
    return {
      name: "TIKI",
      code: "tiki",
      logoUrl: "/images/couriers/sq_tiki.png",
      bgClass: "bg-sky-50 text-sky-700 border-sky-200",
      textClass: "text-sky-700",
    };
  }

  if (code.includes("anteraja") || name.includes("anteraja")) {
    return {
      name: "Anteraja",
      code: "anteraja",
      logoUrl: "/images/couriers/sq_anteraja.png",
      bgClass: "bg-pink-50 text-pink-700 border-pink-200",
      textClass: "text-pink-700",
    };
  }

  if (code.includes("grab") || name.includes("grab")) {
    return {
      name: "GrabExpress",
      code: "grab",
      logoUrl: "/images/couriers/sq_grab.png",
      bgClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      textClass: "text-emerald-700",
    };
  }

  if (code.includes("gojek") || code.includes("gosend") || name.includes("gojek") || name.includes("gosend")) {
    return {
      name: "GoSend",
      code: "gojek",
      logoUrl: "/images/couriers/sq_gojek.png",
      bgClass: "bg-green-50 text-green-700 border-green-200",
      textClass: "text-green-700",
    };
  }

  if (code.includes("paxel") || name.includes("paxel")) {
    return {
      name: "Paxel",
      code: "paxel",
      logoUrl: "/images/couriers/sq_paxel.png",
      bgClass: "bg-purple-50 text-purple-700 border-purple-200",
      textClass: "text-purple-700",
    };
  }

  if (code.includes("pos") || name.includes("pos indonesia")) {
    return {
      name: "POS Indonesia",
      code: "pos",
      logoUrl: "/images/couriers/sq_pos.png",
      bgClass: "bg-orange-50 text-orange-700 border-orange-200",
      textClass: "text-orange-700",
    };
  }

  if (code.includes("ninja") || name.includes("ninja express")) {
    return {
      name: "Ninja Xpress",
      code: "ninja",
      logoUrl: "/images/couriers/sq_ninja.png",
      bgClass: "bg-red-50 text-red-800 border-red-200",
      textClass: "text-red-800",
    };
  }

  if (code.includes("lion") || name.includes("lion parcel")) {
    return {
      name: "Lion Parcel",
      code: "lion",
      logoUrl: "/images/couriers/sq_lion.png",
      bgClass: "bg-red-50 text-red-700 border-red-200",
      textClass: "text-red-700",
    };
  }

  if (code.includes("wahana") || name.includes("wahana")) {
    return {
      name: "Wahana Express",
      code: "wahana",
      logoUrl: "/images/couriers/sq_wahana.png",
      bgClass: "bg-blue-50 text-blue-700 border-blue-200",
      textClass: "text-blue-700",
    };
  }

  if (code.includes("idexpress") || code.includes("ide") || name.includes("idexpress")) {
    return {
      name: "IDExpress",
      code: "idexpress",
      logoUrl: "/images/couriers/sq_idexpress.png",
      bgClass: "bg-red-50 text-red-700 border-red-200",
      textClass: "text-red-700",
    };
  }

  if (code.includes("deliveree") || name.includes("deliveree")) {
    return {
      name: "Deliveree",
      code: "deliveree",
      logoUrl: "/images/couriers/sq_deliveree.png",
      bgClass: "bg-green-50 text-green-700 border-green-200",
      textClass: "text-green-700",
    };
  }

  if (code.includes("borzo") || name.includes("borzo")) {
    return {
      name: "Borzo",
      code: "borzo",
      logoUrl: "/images/couriers/borzo.png",
      bgClass: "bg-yellow-50 text-yellow-700 border-yellow-200",
      textClass: "text-yellow-700",
    };
  }

  if (code.includes("rpx") || name.includes("rpx")) {
    return {
      name: "RPX",
      code: "rpx",
      logoUrl: "/images/couriers/sq_rpx.png",
      bgClass: "bg-purple-50 text-purple-700 border-purple-200",
      textClass: "text-purple-700",
    };
  }

  if (code.includes("sap") || name.includes("sap express")) {
    return {
      name: "SAP Express",
      code: "sap",
      logoUrl: "/images/couriers/sq_sap.png",
      bgClass: "bg-amber-50 text-amber-700 border-amber-200",
      textClass: "text-amber-700",
    };
  }

  if (code.includes("dash") || name.includes("dash express")) {
    return {
      name: "Dash Express",
      code: "dash",
      logoUrl: "/images/couriers/sq_dash_express.png",
      bgClass: "bg-blue-50 text-blue-700 border-blue-200",
      textClass: "text-blue-700",
    };
  }

  if (code.includes("tlx") || name.includes("tlx")) {
    return {
      name: "TLX",
      code: "tlx",
      logoUrl: "/images/couriers/sq_tlx.jpeg",
      bgClass: "bg-red-50 text-red-700 border-red-200",
      textClass: "text-red-700",
    };
  }

  return {
    name: courierNameRaw || courierCodeRaw?.toUpperCase() || "Kurir Ekspedisi",
    code: code || "courier",
    logoUrl: "/images/couriers/sq_jne.png",
    bgClass: "bg-slate-100 text-slate-700 border-slate-200",
    textClass: "text-slate-700",
  };
}
