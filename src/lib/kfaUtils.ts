// Utilitas Farmakologi & Deskripsi Medis Obat (Client & Server Utility)

export function getClinicalDescription(
  name: string,
  activeIngredient?: string,
  kfaCode?: string,
  nie?: string
): string {
  const nameLower = (name || "").toLowerCase();
  const ingredientLower = (activeIngredient || "").toLowerCase();
  const codeStr = (kfaCode || "").trim();

  // 1. Pencocokan Presisi Berdasarkan Kode KFA 9-Digit
  if (codeStr === "93009182") {
    return "Cairan infus Dextrose Monohydrate 50 g/500 mL dan Sodium Chloride 0,9 g/500 mL (PT Otsuka Indonesia) berfungsi mengembalikan keseimbangan cairan serta elektrolit tubuh, memberikan asupan kalori/energi, serta mengatasi dehidrasi pada pasien.";
  }
  if (codeStr === "93000747") {
    return "Bisoprolol Fumarate 5 mg Tablet (Konlobet - KONIMEX) adalah obat antihipertensi golongan beta-blocker selektif B1 yang bekerja menurunkan tekanan darah tinggi dan mengontrol laju detak jantung pada penderita hipertensi serta gagal jantung.";
  }

  // 2. Pencocokan Berdasarkan Kandungan & Nama Farmakologis Obat
  if (nameLower.includes("ibuprofen") || ingredientLower.includes("ibuprofen")) {
    return "Ibuprofen adalah golongan antiinflamasi non steroid (OAINS) dimana pada kadar 100 - 400 mg mempunyai efek sebagai analgesik (meringankan rasa nyeri) dan antipiretik (menurunkan demam). Digunakan untuk meredakan sakit kepala, sakit gigi, dan nyeri haid.";
  }
  if (nameLower.includes("paracetamol") || nameLower.includes("sanmol") || nameLower.includes("fasidol") || ingredientLower.includes("paracetamol")) {
    return "Paracetamol 500 mg Tablet bermanfaat untuk meredakan demam, sakit kepala, sakit gigi, serta mengurangi rasa nyeri ringan hingga sedang. Bekerja dengan cara menghambat sintesis prostaglandin di otak.";
  }
  if (nameLower.includes("dexamethasone") || ingredientLower.includes("dexamethasone")) {
    return "Dexamethasone 0,5 Mg Tablet bermanfaat untuk mengatasi peradangan, reaksi alergi, dan penyakit autoimun. Bekerja dengan cara mengurangi peradangan dan menurunkan sistem kekebalan tubuh, sama seperti steroid yang dihasilkan oleh tubuh secara alami.";
  }
  if (nameLower.includes("amoxicillin") || ingredientLower.includes("amoxicillin")) {
    return "Amoxicillin Trihydrate adalah antibiotik sediaan penisilin spektrum luas yang efektif mengobati infeksi bakteri pada saluran pernapasan, telinga, hidung, tenggorokan, saluran kemih, dan kulit.";
  }
  if (nameLower.includes("timolol") || ingredientLower.includes("timolol")) {
    return "Timolol Maleate 0.5% Tetes Mata bermanfaat menurunkan tekanan intraokular pada penderita glaukoma sudut terbuka dan hipertensi okular. Bekerja mengurangi pembentukan cairan humor akuos di dalam mata.";
  }
  if (nameLower.includes("ketoconazole") || ingredientLower.includes("ketoconazole")) {
    return "Ketoconazole Krim bermanfaat untuk mengobati infeksi jamur pada kulit seperti panu, kadas, kurap, dan kandidiasis kulit. Bekerja dengan cara menghentikan pertumbuhan dan merusak membran sel jamur.";
  }
  if (nameLower.includes("dextrose") || nameLower.includes("sodium chloride") || ingredientLower.includes("dextrose")) {
    return "Cairan infus kombinasi Dextrose Monohydrate dan Sodium Chloride berfungsi mengembalikan keseimbangan cairan serta elektrolit tubuh, memberikan asupan kalori karbohidrat, dan mengatasi dehidrasi.";
  }
  if (nameLower.includes("bisoprolol") || ingredientLower.includes("bisoprolol")) {
    return "Bisoprolol Fumarate adalah obat antihipertensi golongan beta-blocker selektif B1 yang bekerja memperlambat detak jantung dan menurunkan tekanan darah tinggi untuk mencegah serangan jantung dan stroke.";
  }
  if (nameLower.includes("metformin") || ingredientLower.includes("metformin")) {
    return "Metformin Hydrochloride adalah obat antidiabetes oral golongan biguanid yang bermanfaat menurunkan kadar gula darah pada penderita Diabetes Melitus Tipe 2.";
  }
  if (nameLower.includes("amlodipine") || ingredientLower.includes("amlodipine")) {
    return "Amlodipine Besilate adalah obat antihipertensi golongan Calcium Channel Blocker (CCB) yang bekerja melebarkan pembuluh darah untuk menurunkan tekanan darah dan mencegah serangan angina pectoris.";
  }
  if (nameLower.includes("cefadroxil") || ingredientLower.includes("cefadroxil")) {
    return "Cefadroxil Monohydrate adalah antibiotik sediaan sefalosporin generasi pertama yang efektif membasmi infeksi bakteri pada tenggorokan, amandel, kulit, dan saluran kemih.";
  }
  if (nameLower.includes("mefenamat") || ingredientLower.includes("mefenamic")) {
    return "Asam Mefenamat adalah obat antiinflamasi nonsteroid (OAINS) yang efektif mengobati rasa nyeri sedang hingga berat seperti nyeri paska operasi, sakit gigi, dan dismenore.";
  }

  const activeName = activeIngredient || name || "Sediaan obat farmasi";
  const nieStr = nie ? ` (NIE BPOM: ${nie})` : "";
  const kfaStr = codeStr ? ` [Kode KFA: ${codeStr}]` : "";
  return `${name} bermanfaat untuk indikasi medis sediaan farmasi terdaftar Kemenkes RI${nieStr}${kfaStr}. Mengandung zat aktif ${activeName} untuk terapi pemulihan pasien sesuai anjuran medis dokter.`;
}
