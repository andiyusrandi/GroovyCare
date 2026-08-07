export interface ParsedAddress {
  detail: string;
  village: string;
  district: string;
  regency: string;
  province: string;
  postalCode: string;
}

export function parseFullAddress(rawAddress: string | null | undefined): ParsedAddress {
  if (!rawAddress) {
    return {
      detail: "",
      village: "",
      district: "",
      regency: "",
      province: "",
      postalCode: "",
    };
  }

  let detail = rawAddress;
  let village = "";
  let district = "";
  let regency = "";
  let province = "";
  let postalCode = "";

  if (
    rawAddress.includes("Alamat:") ||
    rawAddress.includes("Kel/Desa:") ||
    rawAddress.includes("Desa/Kel:") ||
    rawAddress.includes("Kel:") ||
    rawAddress.includes("Kec:") ||
    rawAddress.includes("Kab/Kota:") ||
    rawAddress.includes("Kota/Kab:") ||
    rawAddress.includes("Provinsi:") ||
    rawAddress.includes("Prov:") ||
    rawAddress.includes("Kode Pos:")
  ) {
    // 1. Extract street detail
    const detailMatch = rawAddress.match(/Alamat:\s*(.*?)(?:,\s*Kel\/Desa:|\s*\(Desa|,\s*Desa\/Kel:|,\s*Kel:|,\s*Kec:)/i);
    if (detailMatch && detailMatch[1]) {
      detail = detailMatch[1].trim();
    } else {
      detail = rawAddress
        .split(/,\s*(?:Kel\/Desa|Desa\/Kel|Kel|Kec|Kab\/Kota|Kota\/Kab|Provinsi|Prov):/i)[0]
        .replace(/^Alamat:\s*/i, "")
        .trim();
    }

    // 2. Extract Kelurahan/Desa
    const kelMatch = rawAddress.match(/(?:Kel\/Desa|Desa\/Kel|Kelurahan|Desa|Kel|Kel\.):\s*([^\,(\n]+)/i) ||
                     rawAddress.match(/\(Desa\/Kel:\s*([^)]+)\)/i) ||
                     rawAddress.match(/Kel(?:urahan)?\.?\s+([^\,(\n]+)/i);
    if (kelMatch && kelMatch[1]) {
      village = kelMatch[1].replace(/^(Desa\/Kel|Kel\/Desa|Kel|Desa):\s*/i, "").trim();
    }

    // 3. Extract Kecamatan
    const kecMatch = rawAddress.match(/Kec:\s*(.*?)(?:\s*\(Desa|,\s*Kab\/Kota:|\s*Kota\/Kab:|\s*Provinsi:|$)/i) ||
                     rawAddress.match(/Kecamatan\s+([^\,(\n]+)/i);
    if (kecMatch && kecMatch[1]) {
      district = kecMatch[1].replace(/\(Desa\/Kel:.*?\)/i, "").trim();
    }

    // 4. Extract Kabupaten/Kota
    const kabMatch = rawAddress.match(/(?:Kab\/Kota|Kota\/Kab|Kabupaten|Kota):\s*(.*?)(?:,\s*Provinsi:|\s*Prov:|$)/i);
    if (kabMatch && kabMatch[1]) regency = kabMatch[1].trim();

    // 5. Extract Provinsi
    const provMatch = rawAddress.match(/(?:Provinsi|Prov):\s*(.*?)(?:,\s*Kode Pos:|\s*Kode Pos:|$)/i);
    if (provMatch && provMatch[1]) province = provMatch[1].trim();

    // 6. Extract Kode Pos
    const posMatch = rawAddress.match(/Kode Pos:\s*(\d+)/i);
    if (posMatch && posMatch[1]) postalCode = posMatch[1].trim();
  }

  // Clean out any legacy trailing seed strings like ", Tamalanrea, Makassar, Sulawesi Selatan, 90245, Indonesia"
  detail = detail
    .replace(/,\s*Tamalanrea,\s*Makassar.*$/i, "")
    .replace(/^Alamat:\s*/i, "")
    .trim();

  return { detail, village, district, regency, province, postalCode };
}

export function formatDisplayAddress(rawAddress: string | null | undefined): string {
  if (!rawAddress) return "Alamat belum disetel";
  const cleanAddr = rawAddress.replace(/\|\s*Kurir:.*$/i, "").trim();
  const parsed = parseFullAddress(cleanAddr);

  // Fix legacy 90245 postal code if regency is Selayar or non-Makassar
  let cleanPostal = parsed.postalCode;
  if (cleanPostal === "90245" && parsed.regency?.toUpperCase().includes("SELAYAR")) {
    cleanPostal = "92811";
  }

  let streetDetail = (parsed.detail || cleanAddr.split(/,\s*(?:Kel\/Desa|Kel|Kec|Kab\/Kota|Provinsi):/i)[0])
    .replace(/^Alamat:\s*/i, "")
    .trim();

  const parts = [
    streetDetail,
    parsed.village ? `Kel. ${parsed.village}` : "",
    parsed.district ? `Kec. ${parsed.district}` : "",
    parsed.regency,
    parsed.province,
    cleanPostal ? cleanPostal : ""
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return cleanAddr.replace(/^Alamat:\s*/i, "");
}
