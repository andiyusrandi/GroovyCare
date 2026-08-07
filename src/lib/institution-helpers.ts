export type InstitutionType = "APOTEK" | "KLINIK" | "RUMAH_SAKIT" | "PBF" | "PERUSAHAAN_UMUM";

export interface InstitutionTypeInfo {
  code: InstitutionType;
  label: string;            // e.g. "Apotek Sarana Farmasi"
  shortLabel: string;       // e.g. "Apotek"
  licenseName: string;      // e.g. "Surat Izin Apotek (SIA)"
  licenseShort: string;     // e.g. "SIA" / "Izin Klinik" / "NIB"
  addressLabel: string;     // e.g. "Alamat Operasional Apotek"
  mainAddressLabel: string; // e.g. "Alamat Utama (Operasional Apotek)"
  managerTitle: string;     // e.g. "Apoteker Penanggung Jawab (APJ)"
  profileTitle: string;     // e.g. "Profil & Legalitas Apotek"
  namePlaceholder: string;  // e.g. "Apotek Sehat Farma"
  licensePlaceholder: string; // e.g. "Cth: SIA-2024-99881"
}

export const INSTITUTION_TYPES: Record<InstitutionType, InstitutionTypeInfo> = {
  APOTEK: {
    code: "APOTEK",
    label: "Apotek Sarana Farmasi",
    shortLabel: "Apotek",
    licenseName: "Surat Izin Apotek (SIA)",
    licenseShort: "SIA",
    addressLabel: "Alamat Operasional Apotek",
    mainAddressLabel: "Alamat Utama (Operasional Apotek)",
    managerTitle: "Apoteker Penanggung Jawab (APJ)",
    profileTitle: "Profil & Legalitas Apotek",
    namePlaceholder: "Cth: Apotek Sehat Farma",
    licensePlaceholder: "Cth: SIA-2024-99881",
  },
  KLINIK: {
    code: "KLINIK",
    label: "Klinik Kesehatan",
    shortLabel: "Klinik",
    licenseName: "Izin Operasional Klinik",
    licenseShort: "Izin Klinik",
    addressLabel: "Alamat Operasional Klinik",
    mainAddressLabel: "Alamat Utama (Operasional Klinik)",
    managerTitle: "Penanggung Jawab Klinik",
    profileTitle: "Profil & Legalitas Klinik",
    namePlaceholder: "Cth: Klinik Pratama Sehat",
    licensePlaceholder: "Cth: 440/01/IZIN-KLINIK/2024",
  },
  RUMAH_SAKIT: {
    code: "RUMAH_SAKIT",
    label: "Rumah Sakit (RSUD / Swasta)",
    shortLabel: "Rumah Sakit",
    licenseName: "Izin Operasional Rumah Sakit",
    licenseShort: "Izin RS",
    addressLabel: "Alamat Operasional Rumah Sakit",
    mainAddressLabel: "Alamat Utama (Operasional Rumah Sakit)",
    managerTitle: "Penanggung Jawab Farmasi RS",
    profileTitle: "Profil & Legalitas Rumah Sakit",
    namePlaceholder: "Cth: RS Medika Kasih",
    licensePlaceholder: "Cth: 440/02/IZIN-RS/2024",
  },
  PBF: {
    code: "PBF",
    label: "PBF / Distributor Farmasi",
    shortLabel: "PBF / Distributor",
    licenseName: "Izin PBF / Izin Operasional",
    licenseShort: "Izin PBF",
    addressLabel: "Alamat Operasional PBF / Gudang",
    mainAddressLabel: "Alamat Utama (Operasional PBF)",
    managerTitle: "APJ PBF",
    profileTitle: "Profil & Legalitas PBF",
    namePlaceholder: "Cth: PT PBF Medika Utama",
    licensePlaceholder: "Cth: FK.01.01/PBF/123/2024",
  },
  PERUSAHAAN_UMUM: {
    code: "PERUSAHAAN_UMUM",
    label: "Perusahaan Umum / Toko Obat",
    shortLabel: "Perusahaan / Toko Obat",
    licenseName: "NIB / Izin Toko Obat",
    licenseShort: "NIB / Izin",
    addressLabel: "Alamat Operasional Perusahaan / Toko Obat",
    mainAddressLabel: "Alamat Utama (Operasional Toko Obat)",
    managerTitle: "Penanggung Jawab Sarana",
    profileTitle: "Profil & Legalitas Perusahaan / Toko Obat",
    namePlaceholder: "Cth: Toko Obat Sejahtera",
    licensePlaceholder: "Cth: NIB-9120001234567",
  },
};

export function getInstitutionTypeInfo(type?: string | null): InstitutionTypeInfo {
  if (type && type in INSTITUTION_TYPES) {
    return INSTITUTION_TYPES[type as InstitutionType];
  }
  return INSTITUTION_TYPES.APOTEK;
}
