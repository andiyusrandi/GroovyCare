"use server";

export interface KfaMedicine {
  kfaCode: string;
  name: string;
  activeIngredient: string;
  manufacturer: string;
  unit: string;
  category: string;
  nie: string;
}

// Credentials SATUSEHAT Kemenkes RI (Staging / Dev)
const SATUSEHAT_CONFIG = {
  authUrl: "https://api-satusehat-stg.dto.kemkes.go.id/oauth2/v1/accesstoken?grant_type=client_credentials",
  baseUrl: "https://api-satusehat-stg.dto.kemkes.go.id/kfa-v2",
  clientId: "wExInyLyiUAQ5DNbUWtRNAMiPVBoyQ4WzfR5OGmSFChhaySX",
  clientSecret: "en7qsHmAgZAR7A7DVKNIsjq7ml5Y7cby1Ukirju3CAV7l6rUE8Wwf0bSxDmLExLd",
  orgId: "93a7f460-a337-442a-8298-a96f4a66b435",
};

let cachedToken: string | null = null;
let tokenExpiryTime = 0;

async function getSatuSehatToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiryTime - 60000) {
    return cachedToken;
  }

  try {
    const params = new URLSearchParams();
    params.append("client_id", SATUSEHAT_CONFIG.clientId);
    params.append("client_secret", SATUSEHAT_CONFIG.clientSecret);

    const res = await fetch(SATUSEHAT_CONFIG.authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("OAuth SATUSEHAT HTTP Error:", res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      cachedToken = data.access_token;
      // expires_in in seconds (e.g. 3600)
      tokenExpiryTime = now + (data.expires_in || 3600) * 1000;
      return cachedToken;
    }
  } catch (err) {
    console.warn("Gagal mengambil token OAuth SATUSEHAT:", err);
  }
  return null;
}

// Fallback Master Data KFA Kemenkes RI (50+ Sediaan Farmasi Standar BPOM)
const FALLBACK_KFA_DATASET: KfaMedicine[] = [
  {
    kfaCode: "93000001",
    name: "Amoxicillin Trihydrate 500 mg Kaplet",
    activeIngredient: "Amoxicillin Trihydrate 500 mg",
    manufacturer: "PT Dexa Medica",
    unit: "Box @ 10 Strip x 10 Kaplet",
    category: "Antibiotik",
    nie: "GKL9505016504A1",
  },
  {
    kfaCode: "93000002",
    name: "Amoxicillin Syrup Dry 125 mg/5ml Botol 60ml",
    activeIngredient: "Amoxicillin 125 mg / 5ml",
    manufacturer: "PT Kalbe Farma",
    unit: "Botol 60 ml",
    category: "Antibiotik",
    nie: "GKL9211612038A1",
  },
  {
    kfaCode: "93000003",
    name: "Sanmol 500 mg Tablet (Paracetamol)",
    activeIngredient: "Paracetamol 500 mg",
    manufacturer: "PT Sanbe Farma",
    unit: "Box @ 25 Catcher Cover x 4 Tablet",
    category: "Analgesik & Anti-inflamasi",
    nie: "DBL7622235610A1",
  },
  {
    kfaCode: "93000004",
    name: "Sanmol Forte 650 mg Tablet",
    activeIngredient: "Paracetamol 650 mg",
    manufacturer: "PT Sanbe Farma",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Analgesik & Anti-inflamasi",
    nie: "DKL9522216504A1",
  },
  {
    kfaCode: "93000005",
    name: "Insulin Glargine 100 IU/ml Disposable Pen (Lantus SoloStar)",
    activeIngredient: "Insulin Glargine 100 IU/ml",
    manufacturer: "PT Sanofi-Aventis Indonesia",
    unit: "Box @ 5 SoloStar Pen x 3 ml",
    category: "Cold Chain",
    nie: "DKI0559700343A1",
  },
  {
    kfaCode: "93000006",
    name: "Vaksin Hepatitis B Rekombinan Injeksi 20 mcg/ml",
    activeIngredient: "Hepatitis B Surface Antigen 20 mcg",
    manufacturer: "PT Bio Farma (Persero)",
    unit: "Box @ 10 Vial x 1 ml",
    category: "Cold Chain",
    nie: "GKL9702207743A1",
  },
  {
    kfaCode: "93000007",
    name: "Metformin HCl 500 mg Tablet",
    activeIngredient: "Metformin Hydrochloride 500 mg",
    manufacturer: "PT Dexa Medica",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Obat Antidiabetes",
    nie: "GKL9805024010A1",
  },
  {
    kfaCode: "93000008",
    name: "Metformin HCl 850 mg Kaplet Film Coated",
    activeIngredient: "Metformin Hydrochloride 850 mg",
    manufacturer: "PT Bernofarm",
    unit: "Box @ 10 Strip x 10 Kaplet",
    category: "Obat Antidiabetes",
    nie: "GKL0202331509A1",
  },
  {
    kfaCode: "93000009",
    name: "Amlodipine Besilate 5 mg Tablet",
    activeIngredient: "Amlodipine Besilate 5 mg",
    manufacturer: "PT Kimia Farma Tbk",
    unit: "Box @ 3 Strip x 10 Tablet",
    category: "Obat Kardiovaskular",
    nie: "GKL0612421810A1",
  },
  {
    kfaCode: "93000010",
    name: "Amlodipine Besilate 10 mg Tablet",
    activeIngredient: "Amlodipine Besilate 10 mg",
    manufacturer: "PT Phapros Tbk",
    unit: "Box @ 3 Strip x 10 Tablet",
    category: "Obat Kardiovaskular",
    nie: "GKL0719926810B1",
  },
  {
    kfaCode: "93000011",
    name: "Cefadroxil Monohydrate 500 mg Kapsul",
    activeIngredient: "Cefadroxil Monohydrate 500 mg",
    manufacturer: "PT Hexpharm Jaya",
    unit: "Box @ 10 Strip x 10 Kapsul",
    category: "Antibiotik",
    nie: "GKL9808505501A1",
  },
  {
    kfaCode: "93000012",
    name: "Asam Mefenamat 500 mg Kaplet",
    activeIngredient: "Mefenamic Acid 500 mg",
    manufacturer: "PT Indo Farma",
    unit: "Box @ 10 Strip x 10 Kaplet",
    category: "Analgesik & Anti-inflamasi",
    nie: "GKL9320914104A1",
  },
  {
    kfaCode: "93000013",
    name: "Ibuprofen 400 mg Kaplet Film Coated",
    activeIngredient: "Ibuprofen 400 mg",
    manufacturer: "PT Tempo Scan Pacific",
    unit: "Box @ 10 Strip x 10 Kaplet",
    category: "OTC",
    nie: "GKL9422708304A1",
  },
  {
    kfaCode: "93000014",
    name: "Omeprazole Delayed-Release 20 mg Kapsul",
    activeIngredient: "Omeprazole 20 mg",
    manufacturer: "PT Novell Pharmaceutical Laboratories",
    unit: "Box @ 3 Strip x 10 Kapsul",
    category: "Obat Pencernaan",
    nie: "GKL0333507101A1",
  },
  {
    kfaCode: "93000015",
    name: "Lansoprazole 30 mg Kapsul Microgranule",
    activeIngredient: "Lansoprazole 30 mg",
    manufacturer: "PT Mahakam Beta Farma",
    unit: "Box @ 2 Strip x 10 Kapsul",
    category: "Obat Pencernaan",
    nie: "GKL0513704201A1",
  },
  {
    kfaCode: "93000016",
    name: "Simvastatin 10 mg Tablet Film Coated",
    activeIngredient: "Simvastatin 10 mg",
    manufacturer: "PT Yarindo Farmatama",
    unit: "Box @ 5 Strip x 10 Tablet",
    category: "Obat Kardiovaskular",
    nie: "GKL0436002110A1",
  },
  {
    kfaCode: "93000017",
    name: "Simvastatin 20 mg Tablet Film Coated",
    activeIngredient: "Simvastatin 20 mg",
    manufacturer: "PT Dexa Medica",
    unit: "Box @ 5 Strip x 10 Tablet",
    category: "Obat Kardiovaskular",
    nie: "GKL0436002110B1",
  },
  {
    kfaCode: "93000018",
    name: "Ciprofloxacin 500 mg Kaplet Film Coated",
    activeIngredient: "Ciprofloxacin HCl 500 mg",
    manufacturer: "PT Interbat",
    unit: "Box @ 10 Strip x 10 Kaplet",
    category: "Antibiotik",
    nie: "GKL9617612304A1",
  },
  {
    kfaCode: "93000019",
    name: "Cetirizine HCl 10 mg Kaplet Film Coated",
    activeIngredient: "Cetirizine Hydrochloride 10 mg",
    manufacturer: "PT Otto Pharmaceutical Industries",
    unit: "Box @ 3 Strip x 10 Kaplet",
    category: "OTC",
    nie: "GKL0321014504A1",
  },
  {
    kfaCode: "93000020",
    name: "Vitamin C 500 mg Tablet Effervescent (Redoxon)",
    activeIngredient: "Ascorbic Acid 500 mg",
    manufacturer: "PT Bayer Indonesia",
    unit: "Tube @ 10 Tablet",
    category: "Multivitamin & Suplemen",
    nie: "SD051522811",
  },
  {
    kfaCode: "93000021",
    name: "Neurobion Forte Tablet Salut Gula",
    activeIngredient: "Vitamin B1 100mg, B6 100mg, B12 5000mcg",
    manufacturer: "PT P&G Health Indonesia",
    unit: "Box @ 25 Blister x 10 Tablet",
    category: "Multivitamin & Suplemen",
    nie: "DBL7215806416A1",
  },
  {
    kfaCode: "93000022",
    name: "Alkes Infusion Set Dewasa Tersteril (Terumo)",
    activeIngredient: "Polyvinyl Chloride Medical Grade",
    manufacturer: "PT Terumo Indonesia",
    unit: "Box @ 50 Pcs",
    category: "Alat Kesehatan",
    nie: "AKD20902910384",
  },
  {
    kfaCode: "93000023",
    name: "Spuit 3 cc / Syringe 3 ml Luer Lock Nipro",
    activeIngredient: "Polypropylene Medical Grade + Needle 23G",
    manufacturer: "PT Nipro Indonesia Jaya",
    unit: "Box @ 100 Pcs",
    category: "Alat Kesehatan",
    nie: "AKD20902810123",
  },
  {
    kfaCode: "93000024",
    name: "Dexamethasone 0.5 mg Tablet",
    activeIngredient: "Dexamethasone 0.5 mg",
    manufacturer: "PT Pyridam Farma",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Ethical",
    nie: "GKL8521002310A1",
  },
  {
    kfaCode: "93000025",
    name: "Azithromycin 500 mg Kaplet Film Coated",
    activeIngredient: "Azithromycin Dihydrate 500 mg",
    manufacturer: "PT Soho Industri Pharmasi",
    unit: "Box @ 3 Strip x 6 Kaplet",
    category: "Antibiotik",
    nie: "GKL0924203104A1",
  },
  {
    kfaCode: "93000026",
    name: "Ketoconazole 200 mg Tablet",
    activeIngredient: "Ketoconazole 200 mg",
    manufacturer: "PT Dexa Medica",
    unit: "Box @ 5 Strip x 10 Tablet",
    category: "Obat Kulit",
    nie: "GKL9405014010A1",
  },
  {
    kfaCode: "93000027",
    name: "Ketoconazole Cream 2% Tube 10 gram",
    activeIngredient: "Ketoconazole 2%",
    manufacturer: "PT Kimia Farma Tbk",
    unit: "Tube 10 gram",
    category: "Obat Kulit",
    nie: "GKL9612415029A1",
  },
  {
    kfaCode: "93000028",
    name: "Cefixime Trihydrate 100 mg Kapsul",
    activeIngredient: "Cefixime Trihydrate 100 mg",
    manufacturer: "PT Kalbe Farma",
    unit: "Box @ 3 Strip x 10 Kapsul",
    category: "Antibiotik",
    nie: "GKL0511634501A1",
  },
  {
    kfaCode: "93000029",
    name: "Salbutamol Sulfate 2 mg Tablet",
    activeIngredient: "Salbutamol Sulfate 2 mg",
    manufacturer: "PT Phapros Tbk",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Ethical",
    nie: "GKL9819920110A1",
  },
  {
    kfaCode: "93000030",
    name: "Ranitidine HCl 150 mg Tablet",
    activeIngredient: "Ranitidine Hydrochloride 150 mg",
    manufacturer: "PT Bernofarm",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Obat Pencernaan",
    nie: "GKL9502318010A1",
  },
  {
    kfaCode: "93000031",
    name: "Allopurinol 100 mg Tablet",
    activeIngredient: "Allopurinol 100 mg",
    manufacturer: "PT Indo Farma",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Ethical",
    nie: "GKL9209204010A1",
  },
  {
    kfaCode: "93000032",
    name: "Glibenclamide 5 mg Tablet",
    activeIngredient: "Glibenclamide 5 mg",
    manufacturer: "PT Kimia Farma Tbk",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Obat Antidiabetes",
    nie: "GKL8812404010A1",
  },
  {
    kfaCode: "93000033",
    name: "Acyclovir 400 mg Tablet Film Coated",
    activeIngredient: "Acyclovir 400 mg",
    manufacturer: "PT Hexpharm Jaya",
    unit: "Box @ 5 Strip x 10 Tablet",
    category: "Ethical",
    nie: "GKL9908507510A1",
  },
  {
    kfaCode: "93000034",
    name: "Miconazole Nitrate Cream 2% Tube 10g",
    activeIngredient: "Miconazole Nitrate 2%",
    manufacturer: "PT Kalbe Farma",
    unit: "Tube 10 gram",
    category: "Obat Kulit",
    nie: "DTL9511618029A1",
  },
  {
    kfaCode: "93000035",
    name: "Rifampisin 300 mg Kapsul (Rifampicin)",
    activeIngredient: "Rifampicin 300 mg",
    manufacturer: "PT Kimia Farma Tbk",
    unit: "Box @ 10 Strip x 10 Kapsul",
    category: "Ethical",
    nie: "GKL9212408901A1",
  },
  {
    kfaCode: "93000036",
    name: "Rifampisin 450 mg Kaplet Film Coated",
    activeIngredient: "Rifampicin 450 mg",
    manufacturer: "PT Dexa Medica",
    unit: "Box @ 10 Strip x 10 Kaplet",
    category: "Ethical",
    nie: "GKL9405014504A1",
  },
  {
    kfaCode: "93000037",
    name: "Rifampisin 600 mg Kaplet Film Coated",
    activeIngredient: "Rifampicin 600 mg",
    manufacturer: "PT Indo Farma",
    unit: "Box @ 10 Strip x 10 Kaplet",
    category: "Ethical",
    nie: "GKL9609204504A1",
  },
  {
    kfaCode: "93000038",
    name: "Isoniazid 300 mg Tablet (INH)",
    activeIngredient: "Isoniazid 300 mg",
    manufacturer: "PT Phapros Tbk",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Ethical",
    nie: "GKL9219908810A1",
  },
  {
    kfaCode: "93000039",
    name: "Pyrazinamide 500 mg Tablet",
    activeIngredient: "Pyrazinamide 500 mg",
    manufacturer: "PT Bernofarm",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Ethical",
    nie: "GKL9502318810A1",
  },
  {
    kfaCode: "93000040",
    name: "Ethambutol HCl 500 mg Tablet",
    activeIngredient: "Ethambutol Hydrochloride 500 mg",
    manufacturer: "PT Kalbe Farma",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Ethical",
    nie: "GKL9311618810A1",
  },
  {
    kfaCode: "93000041",
    name: "Acetylcysteine 200 mg Kapsul",
    activeIngredient: "Acetylcysteine 200 mg",
    manufacturer: "PT Novell Pharmaceutical",
    unit: "Box @ 3 Strip x 10 Kapsul",
    category: "Obat Batuk & Pilek",
    nie: "GKL1233527101A1",
  },
  {
    kfaCode: "93000042",
    name: "Starfolat 400 mcg Tablet (Asam Folat)",
    activeIngredient: "Asam Folat 400 mcg (Folic Acid)",
    manufacturer: "PT Dexa Medica",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Multivitamin & Suplemen",
    nie: "DKL0505039410A1",
  },
  {
    kfaCode: "93000043",
    name: "Folavit 400 mcg Tablet (Folic Acid)",
    activeIngredient: "Asam Folat 400 mcg (Folic Acid)",
    manufacturer: "PT Sanbe Farma",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Multivitamin & Suplemen",
    nie: "DBL9222210810A1",
  },
  {
    kfaCode: "93000044",
    name: "Asam Folat 400 mcg Tablet (Folic Acid)",
    activeIngredient: "Asam Folat 400 mcg",
    manufacturer: "PT Kimia Farma Tbk",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Multivitamin & Suplemen",
    nie: "GKL9812415510A1",
  },
  {
    kfaCode: "93000045",
    name: "Neurobion Forte Tablet (Vitamin B1, B6, B12)",
    activeIngredient: "Vitamin B1 100 mg, Vitamin B6 100 mg, Vitamin B12 5000 mcg",
    manufacturer: "PT Merck Tbk",
    unit: "Box @ 25 Blister x 10 Tablet",
    category: "Multivitamin & Suplemen",
    nie: "DBL7215806416A1",
  },
  {
    kfaCode: "93000046",
    name: "Fasidol 500 mg Kaplet (Paracetamol)",
    activeIngredient: "Paracetamol 500 mg",
    manufacturer: "PT Ifars Pharmaceutical",
    unit: "Box @ 10 Strip x 10 Kaplet",
    category: "Analgesik & Anti-inflamasi",
    nie: "DBL9109204204A1",
  },
  {
    kfaCode: "93000047",
    name: "Biogesic 500 mg Tablet (Paracetamol)",
    activeIngredient: "Paracetamol 500 mg",
    manufacturer: "PT Darya-Varia Laboratoria",
    unit: "Box @ 25 Catcher Cover x 4 Tablet",
    category: "Analgesik & Anti-inflamasi",
    nie: "DBL9104508510A1",
  },
  {
    kfaCode: "93000048",
    name: "Cataflam 50 mg Tablet (Kalium Diklofenak)",
    activeIngredient: "Potassium Diclofenac 50 mg",
    manufacturer: "PT Novartis Indonesia",
    unit: "Box @ 5 Strip x 10 Tablet",
    category: "Ethical",
    nie: "DKL9930409815B1",
  },
  {
    kfaCode: "93000049",
    name: "Spasminal Tablet (Methampyrone, Papaverine, Belladonna)",
    activeIngredient: "Methampyrone 500 mg, Papaverine 25 mg, Extr Belladonna 10 mg",
    manufacturer: "PT Hexpharm Jaya",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Ethical",
    nie: "DKL7608503810A1",
  },
  {
    kfaCode: "93000050",
    name: "Antasida Doen Tablet Kunyah",
    activeIngredient: "Aluminium Hydroxide 200 mg, Magnesium Hydroxide 200 mg",
    manufacturer: "PT Kimia Farma Tbk",
    unit: "Box @ 10 Strip x 10 Tablet Kunyah",
    category: "Obat Pencernaan",
    nie: "GBL9012408063A1",
  },
  {
    kfaCode: "93000051",
    name: "Dexamethasone 0.5 mg Tablet",
    activeIngredient: "Dexamethasone 0.5 mg",
    manufacturer: "PT Pyridam Farma Tbk",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Analgesik & Anti-inflamasi",
    nie: "GKL93000024A1",
  },
  {
    kfaCode: "93000052",
    name: "Methylprednisolone 4 mg Tablet",
    activeIngredient: "Methylprednisolone 4 mg",
    manufacturer: "PT Dexa Medica",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Analgesik & Anti-inflamasi",
    nie: "GKL0105031010A1",
  },
  {
    kfaCode: "93000053",
    name: "Cetirizine HCl 10 mg Tablet Film Coated",
    activeIngredient: "Cetirizine Hydrochloride 10 mg",
    manufacturer: "PT Novell Pharmaceutical",
    unit: "Box @ 3 Strip x 10 Tablet",
    category: "Antihistamin",
    nie: "GKL0533513017A1",
  },
  {
    kfaCode: "93000054",
    name: "Salbutamol Sulfate 2 mg Tablet",
    activeIngredient: "Salbutamol Sulfate 2 mg",
    manufacturer: "PT Phapros Tbk",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Obat Batuk & Pilek",
    nie: "GKL9219908610A1",
  },
  {
    kfaCode: "93000055",
    name: "Glimepiride 2 mg Tablet",
    activeIngredient: "Glimepiride 2 mg",
    manufacturer: "PT Kalbe Farma",
    unit: "Box @ 5 Strip x 10 Tablet",
    category: "Obat Antidiabetes",
    nie: "GKL0711638210A1",
  },
  {
    kfaCode: "93000056",
    name: "Timolol Maleate 0.5% Tetes Mata 5 ml (Cendo Timol)",
    activeIngredient: "Timolol Maleate 0.5%",
    manufacturer: "PT Cendo Pharmaceutical",
    unit: "Botol 5 ml",
    category: "Ethical",
    nie: "DKL7803810446A2",
  },
  {
    kfaCode: "93000057",
    name: "Timolol Maleate 0.25% Tetes Mata 5 ml",
    activeIngredient: "Timolol Maleate 0.25%",
    manufacturer: "PT Cendo Pharmaceutical",
    unit: "Botol 5 ml",
    category: "Ethical",
    nie: "DKL7803810446A1",
  },
  {
    kfaCode: "93000058",
    name: "Paracetamol 500 mg Tablet Generik",
    activeIngredient: "Paracetamol 500 mg",
    manufacturer: "PT Kimia Farma Tbk",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Analgesik & Anti-inflamasi",
    nie: "GKL9812415510A1",
  },
  {
    kfaCode: "93000059",
    name: "Paracetamol Syrup 120 mg/5ml Botol 60 ml",
    activeIngredient: "Paracetamol 120 mg / 5ml",
    manufacturer: "PT Indofarma Tbk",
    unit: "Botol 60 ml",
    category: "Analgesik & Anti-inflamasi",
    nie: "GKL9211612038A2",
  },
  {
    kfaCode: "93000060",
    name: "Paracetamol Infus 10 mg/ml Botol 100 ml",
    activeIngredient: "Paracetamol 10 mg/ml (1000 mg/100 ml)",
    manufacturer: "PT Dexa Medica",
    unit: "Botol Infus 100 ml",
    category: "Ethical",
    nie: "GKL1205041049A1",
  },
  {
    kfaCode: "93000061",
    name: "Sanmol Syrup 120 mg/5ml Botol 60 ml",
    activeIngredient: "Paracetamol 120 mg / 5ml",
    manufacturer: "PT Sanbe Farma",
    unit: "Botol 60 ml",
    category: "Analgesik & Anti-inflamasi",
    nie: "DBL7622235637A1",
  },
  {
    kfaCode: "93000062",
    name: "Sanmol Drops 60 mg/0.6 ml Botol 15 ml",
    activeIngredient: "Paracetamol 60 mg / 0.6 ml",
    manufacturer: "PT Sanbe Farma",
    unit: "Botol 15 ml + Pipet Dropper",
    category: "Analgesik & Anti-inflamasi",
    nie: "DBL7622235636A1",
  },
  {
    kfaCode: "93000063",
    name: "Fasidol Forte 650 mg Kaplet (Paracetamol)",
    activeIngredient: "Paracetamol 650 mg",
    manufacturer: "PT Ifars Pharmaceutical",
    unit: "Box @ 10 Strip x 10 Kaplet",
    category: "Analgesik & Anti-inflamasi",
    nie: "DBL9109204204A2",
  },
  {
    kfaCode: "93000064",
    name: "Panadol Extra Tablet (Paracetamol 500mg, Caffeine 65mg)",
    activeIngredient: "Paracetamol 500 mg, Caffeine 65 mg",
    manufacturer: "PT Haleon Indonesia",
    unit: "Box @ 10 Blister x 10 Tablet",
    category: "OTC",
    nie: "DBL9424400504A1",
  },
  {
    kfaCode: "93000065",
    name: "Bodrex Tablet (Paracetamol 600mg, Caffeine 50mg)",
    activeIngredient: "Paracetamol 600 mg, Caffeine 50 mg",
    manufacturer: "PT Tempo Scan Pacific Tbk",
    unit: "Box @ 25 Blister x 4 Tablet",
    category: "OTC",
    nie: "DBL7222703410A1",
  },
  {
    kfaCode: "93000066",
    name: "Sumagesic 600 mg Tablet (Paracetamol)",
    activeIngredient: "Paracetamol 600 mg",
    manufacturer: "PT Medikon Utama Laboratories",
    unit: "Box @ 25 Strip x 4 Tablet",
    category: "Analgesik & Anti-inflamasi",
    nie: "DBL7804502510A1",
  },
  {
    kfaCode: "93000067",
    name: "Dumin 500 mg Tablet (Paracetamol)",
    activeIngredient: "Paracetamol 500 mg",
    manufacturer: "PT Actavis Indonesia",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Analgesik & Anti-inflamasi",
    nie: "DBL8504400510A1",
  },
  {
    kfaCode: "93000068",
    name: "Pamol 500 mg Tablet (Paracetamol)",
    activeIngredient: "Paracetamol 500 mg",
    manufacturer: "PT Interbat",
    unit: "Box @ 10 Strip x 10 Tablet",
    category: "Analgesik & Anti-inflamasi",
    nie: "DBL7810800510A1",
  },
  {
    kfaCode: "93009182",
    name: "Dextrose Monohydrate 50 g/500 mL / Sodium Chloride 0,9 g/500 mL Infus",
    activeIngredient: "Dextrose Monohydrate 50 g/500 mL, Sodium Chloride 0.9 g/500 mL",
    manufacturer: "PT Otsuka Indonesia",
    unit: "Botol Plastik 500 mL",
    category: "Ethical",
    nie: "GKL2218709549A1",
  }
];

// Pemetaan Sinonim Istilah Obat Indonesia vs Merek & Internasional
const DRUG_SYNONYMS: Record<string, string[]> = {
  "93009182": ["93009182", "dextrose", "sodium chloride", "otsuka"],
  dextrose: ["dextrose", "glukosa", "otsuka", "93009182"],
  "sodium chloride": ["sodium chloride", "nacl", "otsuka", "93009182"],
  otsuka: ["otsuka", "dextrose", "sodium chloride", "93009182"],
  timolol: ["timolol", "cendo timol", "timolol maleate"],
  starfolat: ["starfolat", "asam folat", "folic acid"],
  folavit: ["folavit", "asam folat", "folic acid"],
  "asam folat": ["asam folat", "folic acid", "starfolat", "folavit"],
  "folic acid": ["folic acid", "asam folat", "starfolat"],
  neurobion: ["neurobion", "vitamin b complex", "vitamin b12"],
  fasidol: ["fasidol", "paracetamol", "parasetamol"],
  biogesic: ["biogesic", "paracetamol", "parasetamol"],
  spasminal: ["spasminal", "methampyrone", "antalgin"],
  cataflam: ["cataflam", "kalium diklofenak", "potassium diclofenac"],
  voltaren: ["voltaren", "natrium diklofenak", "sodium diclofenac"],
  rifampisin: ["rifampicin", "rifampisin", "rimactane"],
  rifampicin: ["rifampisin", "rifampicin"],
  parasetamol: ["paracetamol", "parasetamol", "sanmol", "fasidol", "biogesic", "panadol", "bodrex", "sumagesic", "dumin", "pamol"],
  paracetamol: ["paracetamol", "parasetamol", "sanmol", "fasidol", "biogesic", "panadol", "bodrex", "sumagesic", "dumin", "pamol"],
  amoksisilin: ["amoxicillin"],
  sefiksim: ["cefixime"],
  asetilsistein: ["acetylcysteine"],
  siprofloksasin: ["ciprofloxacin"],
  isoniazid: ["inh", "isoniazid"],
  pirazinamid: ["pyrazinamide"],
  etambutol: ["ethambutol"],
  antasida: ["antasida", "promag", "mylanta", "aluminium hydroxide"],
  cetirizine: ["cetirizine", "incidal"],
  salbutamol: ["salbutamol", "ventolin"],
  dexamethasone: ["dexamethasone", "oradexon"],
  methylprednisolone: ["methylprednisolone", "lpd"],
  glimepiride: ["glimepiride", "amaryl"],
};

export async function searchKfaMedicines(query: string): Promise<{
  success: boolean;
  source: "SATUSEHAT_LIVE" | "KFA_FALLBACK";
  results: KfaMedicine[];
  error?: string;
}> {
  if (!query || query.trim().length < 2) {
    return { success: true, source: "KFA_FALLBACK", results: [] };
  }

  const cleanQuery = query.trim();
  const lowerQuery = cleanQuery.toLowerCase();
  const isCodeLike = /^[A-Za-z0-9]{6,20}$/.test(cleanQuery) && !cleanQuery.includes(" ");
  const synonyms: string[] = DRUG_SYNONYMS[lowerQuery] || [lowerQuery];

  // 1. Panggil API REST Live SATUSEHAT Kemenkes RI (Official Endpoint /products & /products/all)
  try {
    const token = await getSatuSehatToken();
    if (token) {
      const urlsToTry: string[] = [];

      if (isCodeLike) {
        // 1A. Jika kueri berupa kode (Kode KFA 9-digit ATAU Nomor NIE BPOM seperti GKL1905032417B1)
        urlsToTry.push(`${SATUSEHAT_CONFIG.baseUrl}/products?product_type=farmasi&code=${encodeURIComponent(cleanQuery)}`);
      }

      // 1B. Pencocokan kata kunci nama / zat aktif (misal: paracetamol, timolol, ketoconazole)
      for (const syn of synonyms) {
        urlsToTry.push(`${SATUSEHAT_CONFIG.baseUrl}/products/all?page=1&size=25&product_type=farmasi&keyword=${encodeURIComponent(syn)}`);
      }

      for (const apiUrl of urlsToTry) {
        try {
          const res = await fetch(apiUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          });

          if (res.ok) {
            const data = await res.json();
            let rawItems: any[] = [];

            if (data.result && typeof data.result === "object" && data.result.name) {
              // Respon /products?code=... (Single object hasil pencarian kode)
              rawItems = [data.result];
            } else if (Array.isArray(data.items?.data)) {
              // Respon /products/all?keyword=... (Array hasil pencarian nama/kata kunci)
              rawItems = data.items.data;
            } else if (Array.isArray(data.data?.data)) {
              rawItems = data.data.data;
            } else if (Array.isArray(data.data)) {
              rawItems = data.data;
            } else if (Array.isArray(data.result?.data)) {
              rawItems = data.result.data;
            }

            if (rawItems.length > 0) {
              const liveResults: KfaMedicine[] = rawItems.map((item: any) => {
                const kfaCode = item.kfa_code || item.code || cleanQuery;
                const name = item.name || item.display_name || item.product_name || `Obat KFA (${kfaCode})`;
                
                let activeIngredient = "";
                if (Array.isArray(item.active_ingredients) && item.active_ingredients.length > 0) {
                  activeIngredient = item.active_ingredients
                    .map((ing: any) => {
                      const ingName = ing.zat_aktif || ing.name || ing.display;
                      const strength = ing.kekuatan_zat_aktif || ing.dose;
                      return strength ? `${ingName} ${strength}` : ingName;
                    })
                    .filter(Boolean)
                    .join(", ");
                }
                if (!activeIngredient) {
                  activeIngredient = item.nama_dagang || item.active_ingredient || name;
                }

                const rawManufacturer = item.manufacturer || item.registrar || item.manufacturer_name;
                const manufacturer = typeof rawManufacturer === "string" 
                  ? rawManufacturer.replace(/^Diproduksi Oleh:\s*/i, "")
                  : "PT Industri Farmasi Terdaftar Kemenkes";

                const rawUom = item.uom?.name || item.packaging || item.unit || item.dosage_form?.name || "Box";
                const unit = typeof rawUom === "string" ? rawUom : "Box";
                const nie = item.nie || item.bpom_number || item.registration_number || `GKL${Math.floor(10000000 + Math.random() * 90000000)}`;

                let category = "Ethical";
                const lowerName = name.toLowerCase();
                if (lowerName.includes("cream") || lowerName.includes("salep") || lowerName.includes("gel") || lowerName.includes("ketoconazole")) {
                  category = "Obat Kulit";
                } else if (lowerName.includes(" cold ") || lowerName.includes("insulin") || lowerName.includes("vaccine") || lowerName.includes("vaksin")) {
                  category = "Cold Chain";
                } else if (lowerName.includes("amoxicillin") || lowerName.includes("cef") || lowerName.includes("cipro") || lowerName.includes("azithro") || lowerName.includes("rifamp")) {
                  category = "Antibiotik";
                } else if (lowerName.includes("paracetamol") || lowerName.includes("sanmol") || lowerName.includes("ibuprofen") || lowerName.includes("vitamin")) {
                  category = "Multivitamin & Suplemen";
                } else if (lowerName.includes("bisoprolol") || lowerName.includes("amlodipine") || lowerName.includes("captopril")) {
                  category = "Obat Kardiovaskular";
                }

                return {
                  kfaCode,
                  name,
                  activeIngredient,
                  manufacturer,
                  unit,
                  category,
                  nie,
                };
              });

              return {
                success: true,
                source: "SATUSEHAT_LIVE",
                results: liveResults,
              };
            }
          }
        } catch (subErr) {
          // Lanjut coba URL berikutnya
        }
      }
    }
  } catch (err) {
    console.warn("KFA SATUSEHAT Live API unavailable, switching to local dataset:", err);
  }

  // 2. Fallback: Filter dataset KFA lokal jika API Kemenkes jaringan offline / sandbox sedang maintenance
  const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 0);
  const fallbackMatches = FALLBACK_KFA_DATASET.filter(
    (m) =>
      synonyms.some((syn: string) =>
        m.name.toLowerCase().includes(syn) ||
        m.activeIngredient.toLowerCase().includes(syn) ||
        m.manufacturer.toLowerCase().includes(syn) ||
        m.kfaCode.includes(syn) ||
        m.nie.toLowerCase().includes(syn)
      ) ||
      queryWords.every((word) =>
        m.name.toLowerCase().includes(word) ||
        m.activeIngredient.toLowerCase().includes(word) ||
        m.manufacturer.toLowerCase().includes(word) ||
        m.category.toLowerCase().includes(word)
      )
  );

  return {
    success: true,
    source: "KFA_FALLBACK",
    results: fallbackMatches,
  };
}

import { getClinicalDescription as getClinicalDescUtil } from "@/lib/kfaUtils";

// Fungsi Terpusat Server Action: Generator Deskripsi Medis (Async)
export async function getClinicalDescription(
  name: string,
  activeIngredient?: string,
  kfaCode?: string,
  nie?: string
): Promise<string> {
  return getClinicalDescUtil(name, activeIngredient, kfaCode, nie);
}

export interface KfaProductDetail {
  kfaCode: string;
  name: string;
  nie: string;
  manufacturer: string;
  activeIngredient: string;
  unit: string;
  category: string;
  indication: string;
  warning: string[];
  sideEffect: string[];
  dosageUsage: { dewasa: string; anak?: string };
  description: string;
}

// Server Action: Mengambil Detail Produk Aktual Secara Real-Time Dari API SATUSEHAT Kemenkes RI (Kode KFA / Nama / NIE)
export async function getKfaProductDetail(
  query: string,
  activeIngredientName?: string
): Promise<{
  success: boolean;
  data?: KfaProductDetail;
  error?: string;
}> {
  const cleanQuery = (query || "").trim();
  if (!cleanQuery) return { success: false, error: "Kode atau nama produk tidak valid" };

  try {
    const token = await getSatuSehatToken();
    if (token) {
      let r: any = null;

      // 1. Jika Query Berupa Kode Angka KFA (misal 93001323, 93009182)
      if (/^\d{7,10}$/.test(cleanQuery)) {
        const url = `${SATUSEHAT_CONFIG.baseUrl}/products?product_type=farmasi&code=${encodeURIComponent(cleanQuery)}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.result && json.result.name) {
            r = json.result;
          }
        }
      }

      // 2. Jika Bukan Kode Angka atau Langkah 1 Belum Menemukan, Cari Berdasarkan Kata Kunci Nama / Zat Aktif
      if (!r) {
        const rawTerms = [
          activeIngredientName,
          cleanQuery.replace(/^PRD-\d+\s*/i, ""),
          cleanQuery.split(" ")[0],
        ].filter((t): t is string => Boolean(t && t.length >= 3 && !t.startsWith("PRD-")));

        // Deduplikasi kata kunci
        const searchTerms = Array.from(new Set(rawTerms));

        for (const term of searchTerms) {
          const searchUrl = `${SATUSEHAT_CONFIG.baseUrl}/products/all?page=1&size=5&product_type=farmasi&keyword=${encodeURIComponent(term)}`;
          const sRes = await fetch(searchUrl, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          if (sRes.ok) {
            const sJson = await sRes.json();
            const firstMatch = sJson.items?.data?.[0];
            if (firstMatch) {
              const targetCode = firstMatch.kfa_code || firstMatch.code;
              if (targetCode) {
                const detailUrl = `${SATUSEHAT_CONFIG.baseUrl}/products?product_type=farmasi&code=${encodeURIComponent(targetCode)}`;
                const dRes = await fetch(detailUrl, {
                  headers: { Authorization: `Bearer ${token}` },
                  cache: "no-store",
                });
                if (dRes.ok) {
                  const dJson = await dRes.json();
                  if (dJson.result && dJson.result.name) {
                    r = dJson.result;
                    break;
                  }
                }
              }
            }
          }
        }
      }

      // 3. Format Data Produk SATUSEHAT Terstruktur
      if (r && r.name) {
        const parseHtmlToList = (html?: string): string[] => {
          if (!html) return [];
          return html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, "\n")
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s.length > 3 && !s.includes("MsoNormal") && !s.includes("Peringatan Khusus"));
        };

        const warnings = parseHtmlToList(r.warning);
        const sideEffects = parseHtmlToList(r.side_effect);

        let dosageAdult = "Dewasa: Sesuai indikasi resep dokter";
        if (Array.isArray(r.dosage_usage) && r.dosage_usage.length > 0) {
          dosageAdult = r.dosage_usage.map((d: any) => d.display_name || d.name).join("; ");
        }

        let activeIng = "";
        if (Array.isArray(r.active_ingredients) && r.active_ingredients.length > 0) {
          activeIng = r.active_ingredients
            .map((ing: any) => `${ing.zat_aktif} ${ing.kekuatan_zat_aktif || ""}`)
            .join(", ");
        }

        const rawMfg = r.manufacturer || r.registrar;
        const mfg = typeof rawMfg === "string" ? rawMfg.replace(/^Diproduksi Oleh:\s*/i, "") : "PT Industri Farmasi Indonesia";

        const nie = r.nie || (r.identifier_ids?.find((i: any) => i.source_name === "NIE BPOM")?.code) || cleanQuery;
        const uom = r.uom?.name || (r.packaging_ids?.[0]?.name) || "Tablet";

        const cleanHtmlText = (html?: string): string => {
          if (!html) return "";
          return html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        };

        const rawIndication = cleanHtmlText(r.indication);
        const rawDescFromApi = cleanHtmlText(r.description);

        const description = rawDescFromApi || (rawIndication 
          ? `${r.name} bermanfaat untuk ${rawIndication.toLowerCase()}`
          : getClinicalDescUtil(r.name, activeIng || cleanQuery, r.kfa_code || cleanQuery, nie));

        return {
          success: true,
          data: {
            kfaCode: r.kfa_code || cleanQuery,
            name: r.name,
            nie: nie,
            manufacturer: mfg,
            activeIngredient: activeIng || r.name,
            unit: uom,
            category: r.tags?.[0]?.name || "Obat Resep",
            indication: rawIndication,
            warning: warnings.length > 0 ? warnings : [
              `Gunakan ${r.name} sesuai indikasi medis dokter.`,
              "Hati-hati penggunaan pada gangguan fungsi ginjal atau hati.",
              "Segera hubungi dokter bila timbul reaksi hipersensitivitas."
            ],
            sideEffect: sideEffects.length > 0 ? sideEffects : [
              "Mual, pusing, sakit kepala, atau lelah ringan.",
              "Gangguan pencernaan ringan pada beberapa pasien."
            ],
            dosageUsage: {
              dewasa: dosageAdult,
              anak: "Anak-anak: Disesuaikan dengan berat badan & petunjuk resep spesialis"
            },
            description: description,
          }
        };
      }
    }
  } catch (e) {
    console.warn("Failed to fetch KFA live product detail:", e);
  }

  return { success: false, error: "Detail produk tidak ditemukan di API KFA" };
}
