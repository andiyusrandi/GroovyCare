"use client";

import { useState, useMemo, useEffect } from "react";
import { FileText, Download, Calendar, Filter, RefreshCw, BarChart2, Info } from "lucide-react";
import * as XLSX from "xlsx";
import { getStockTransactions } from "@/app/actions/stock";
import { CITY_REGIONS } from "./cityData";

const helpGuidelines = [
  { id: 1, text: "Kode NIE dapat diperoleh di Menu Master data => Obat e-Licensing. Harus sesuai dengan master data di sistem e-Report PBF." },
  { id: 2, text: "Nama Produk dapat diperoleh di Menu Master data => Obat e-Licensing. Harus sesuai dengan master data di sistem e-Report PBF." },
  { id: 3, text: "Kemasan dapat diperoleh di Menu Master data => obat e-Licensing. Harus sesuai dengan master data di sistem e-Report PBF." },
  { id: 4, text: "Stok Awal merupakan stok akhir produk pada periode pelaporan sebelumnya." },
  { id: 5, text: "Masuk IF merupakan total masuk obat dari Industri Farmasi." },
  { id: 6, text: "Kode IF merupakan kode Industri Farmasi yang jumlah pemasukannya di inputkan di Kolom 5. Dapat diperoleh di menu Master Data => Industri Farmasi e-Licensing." },
  { id: 7, text: "Masuk PBF merupakan total masuk obat dari PBF." },
  { id: 8, text: "Kode PBF merupakan kode PBF yang jumlah pemasukannya di inputkan di Kolom 7. Dapat diperoleh di menu Master Data => Pedagang Besar Farmasi." },
  { id: 9, text: "Masuk Retur merupakan total retur yang masuk dari seluruh PBF pusat, PBF Cabang, dan/atau seluruh Sarana Pelayanan." },
  { id: 10, text: "Keluar PBF merupakan total penyaluran obat ke suatu PBF baik pusat atau cabang." },
  { id: 11, text: "Kode PBF merupakan kode PBF yang jumlah penyalurannya di inputkan di Kolom 10. Dapat diperoleh di menu Master Data => Pedagang Besar Farmasi." },
  { id: 12, text: "Keluar RS merupakan total penyaluran ke semua Rumah Sakit." },
  { id: 13, text: "Keluar Apotek merupakan total penyaluran ke semua Apotek." },
  { id: 14, text: "Keluar Sarana Pemerintah merupakan total penyaluran ke semua Instalasi Farmasi Kabupaten Kota dan Provinsi." },
  { id: 15, text: "Keluar Puskesmas merupakan total penyaluran ke semua Puskesmas." },
  { id: 16, text: "Keluar Klinik merupakan total penyaluran ke semua Klinik." },
  { id: 17, text: "Keluar Toko Obat merupakan total penyaluran ke semua Toko Obat." },
  { id: 18, text: "Keluar Kemenkes merupakan total penyaluran ke Kementerian Kesehatan." },
  { id: 19, text: "Keluar Retur merupakan total retur ke PBF Pusat atau Industri Farmasi." },
  { id: 20, text: "Lainnya merupakan total penyaluran di luar dari keluar PBF, RS, Apotek, Sarana Pemerintah, Puskesmas, Klinik, Toko Obat, dan/atau Retur, misal: Pemusnahan, dsb." },
  { id: 21, text: "HJD merupakan Harga Jual Distributor." }
];

interface Batch {
  id: string;
  batchNumber: string;
  expiryDate: Date;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  code: string;
  activeIngredient: string;
  price: number;
  category: string;
  description: string | null;
  unit: string;
  manufacturer: string;
  batches: Batch[];
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    unit: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  institutionId: string;
  institution: {
    name: string;
    type: string;
  };
  status: string;
  createdAt: Date;
  items: OrderItem[];
}

interface ReportTabProps {
  products: any[];
  orders: any[];
}

export default function ReportTab({ products, orders }: ReportTabProps) {
  // Selected Report Type State
  const [selectedReport, setSelectedReport] = useState<"realisasi" | "distribusi" | "penerimaan">("realisasi");

  // Filter States
  const [filterMode, setFilterMode] = useState<"triwulan" | "bulanan" | "tahunan" | "custom">("triwulan");
  const [quarter, setQuarter] = useState<"triwulan_1" | "triwulan_2" | "triwulan_3" | "triwulan_4">("triwulan_1");
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(2026);
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTableExpanded, setIsTableExpanded] = useState<boolean>(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    const res = await getStockTransactions();
    if (res.success && res.transactions) {
      setTransactions(res.transactions);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [products, orders]);

  const MONTH_NAMES = useMemo(
    () => [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ],
    []
  );

  // Date range calculations based on selected period and year
  const dateRange = useMemo(() => {
    let startDate = new Date(year, 0, 1, 0, 0, 0, 0);
    let endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    if (filterMode === "triwulan") {
      if (quarter === "triwulan_1") {
        startDate = new Date(year, 0, 1, 0, 0, 0, 0);
        endDate = new Date(year, 2, 31, 23, 59, 59, 999);
      } else if (quarter === "triwulan_2") {
        startDate = new Date(year, 3, 1, 0, 0, 0, 0);
        endDate = new Date(year, 5, 30, 23, 59, 59, 999);
      } else if (quarter === "triwulan_3") {
        startDate = new Date(year, 6, 1, 0, 0, 0, 0);
        endDate = new Date(year, 8, 30, 23, 59, 59, 999);
      } else if (quarter === "triwulan_4") {
        startDate = new Date(year, 9, 1, 0, 0, 0, 0);
        endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      }
    } else if (filterMode === "bulanan") {
      startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else if (filterMode === "tahunan") {
      startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    } else if (filterMode === "custom") {
      if (customStartDate) {
        startDate = new Date(`${customStartDate}T00:00:00.000`);
      }
      if (customEndDate) {
        endDate = new Date(`${customEndDate}T23:59:59.999`);
      }
    }

    return { startDate, endDate };
  }, [filterMode, quarter, month, year, customStartDate, customEndDate]);

  // Period label translation
  const periodLabel = useMemo(() => {
    if (filterMode === "triwulan") {
      switch (quarter) {
        case "triwulan_1":
          return `Triwulan I ${year}`;
        case "triwulan_2":
          return `Triwulan II ${year}`;
        case "triwulan_3":
          return `Triwulan III ${year}`;
        case "triwulan_4":
          return `Triwulan IV ${year}`;
        default:
          return `${year}`;
      }
    } else if (filterMode === "bulanan") {
      return `Bulan ${MONTH_NAMES[month - 1]} ${year}`;
    } else if (filterMode === "tahunan") {
      return `Tahun ${year}`;
    } else if (filterMode === "custom") {
      const formatDateStr = (d: Date) => {
        const day = String(d.getDate()).padStart(2, "0");
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const y = d.getFullYear();
        return `${day}/${m}/${y}`;
      };
      return `Periode ${formatDateStr(dateRange.startDate)} s.d. ${formatDateStr(dateRange.endDate)}`;
    }
    return `${year}`;
  }, [filterMode, quarter, month, year, dateRange, MONTH_NAMES]);

  const titleText = useMemo(() => {
    return `PELAPORAN OBAT PERIODE ${periodLabel.toUpperCase()} - PBF PT GROOVYRX PHARMACEUTICAL GROUP (PUSAT)`;
  }, [periodLabel]);

  // Compute report data dynamically based on selected period and real transactions
  const reportData = useMemo(() => {
    const { startDate, endDate } = dateRange;

    return products.map((product) => {
      // 1. Get current stock of all batches
      const currentStock = product.batches?.reduce((sum: number, b: any) => sum + b.stock, 0) || 0;

      // Filter transactions for this product
      const productTxs = transactions.filter(t => t.productId === product.id);

      // 2. Calculate Stok Awal (before startDate)
      let stokAwal = 0;
      let hasTxBefore = false;

      productTxs.forEach((tx) => {
        const txDate = new Date(tx.createdAt);
        if (txDate < startDate) {
          hasTxBefore = true;
          if (tx.type.startsWith("IN_")) {
            stokAwal += tx.quantity;
          } else if (tx.type.startsWith("OUT_")) {
            stokAwal -= tx.quantity;
          }
        }
      });

      // Fallback: If no transactions logged before the period, calculate backward from current stock
      if (!hasTxBefore) {
        let totalTxAfterOrDuring = 0;
        productTxs.forEach((tx) => {
          const txDate = new Date(tx.createdAt);
          if (txDate >= startDate) {
            if (tx.type.startsWith("IN_")) {
              totalTxAfterOrDuring += tx.quantity;
            } else if (tx.type.startsWith("OUT_")) {
              totalTxAfterOrDuring -= tx.quantity;
            }
          }
        });
        stokAwal = Math.max(0, currentStock - totalTxAfterOrDuring);
      }

      // Initialize counters
      let masukIf = 0;
      let masukPbf = 0;
      let masukRetur = 0;

      let outPbf = 0;
      let outRs = 0;
      let outApotek = 0;
      let outSaranaPemerintah = 0;
      let outPuskesmas = 0;
      let outKlinik = 0;
      let outTokoObat = 0;
      let outKemenkes = 0;
      let outRetur = 0;
      let outLainnya = 0;

      // Filter transactions within the selected period
      const currentPeriodTxs = productTxs.filter(tx => {
        const txDate = new Date(tx.createdAt);
        return txDate >= startDate && txDate <= endDate;
      });

      // Map dynamic helper codes
      let lastIfCode = "-";
      let lastPbfCode = "-";
      let lastPbfOutCode = "-";

      currentPeriodTxs.forEach((tx) => {
        const qty = tx.quantity;
        const nameLower = tx.sourceTargetName.toLowerCase();

        if (tx.type === "IN_IF") {
          masukIf += qty;
          lastIfCode = tx.referenceNumber.replace("REC-", "");
        } else if (tx.type === "IN_PBF") {
          masukPbf += qty;
          lastPbfCode = tx.referenceNumber.replace("REC-", "");
        } else if (tx.type === "IN_RETUR_CUSTOMER") {
          masukRetur += qty;
        } else if (tx.type === "OUT_RETUR_SUPPLIER") {
          outRetur += qty;
        } else if (tx.type === "OUT_DISPOSAL") {
          outLainnya += qty;
        } else if (tx.type === "OUT_SALE") {
          // Look up buyer institution type
          const buyer = orders.find(o => o.institutionId === tx.sourceTargetId);
          const type = buyer ? buyer.institution.type : "OTHER";

          if (nameLower.includes("kemenkes") || nameLower.includes("kementerian kesehatan")) {
            outKemenkes += qty;
          } else if (nameLower.includes("puskesmas") || nameLower.includes("pkm")) {
            outPuskesmas += qty;
          } else if (nameLower.includes("dinas kesehatan") || nameLower.includes("dinkes")) {
            outSaranaPemerintah += qty;
          } else if (type === "RUMAH_SAKIT") {
            outRs += qty;
          } else if (type === "APOTEK") {
            outApotek += qty;
          } else if (type === "KLINIK") {
            outKlinik += qty;
          } else if (type === "PBF") {
            outPbf += qty;
            lastPbfOutCode = tx.referenceNumber;
          } else if (type === "PERUSAHAAN_UMUM") {
            outTokoObat += qty;
          } else {
            outLainnya += qty;
          }
        }
      });

      return {
        id: product.id,
        code: product.nie || product.code,
        name: product.name,
        unit: product.unit,
        stokAwal,
        pemasukan: {
          masukIf,
          kodeIf: masukIf > 0 ? lastIfCode : "-",
          masukPbf,
          kodePbf: masukPbf > 0 ? lastPbfCode : "-",
          retur: masukRetur
        },
        pengeluaran: {
          pbf: outPbf,
          kodePbf: outPbf > 0 ? lastPbfOutCode : "-",
          rs: outRs,
          apotek: outApotek,
          saranaPemerintah: outSaranaPemerintah,
          puskesmas: outPuskesmas,
          klinik: outKlinik,
          tokoObat: outTokoObat,
          kemenkes: outKemenkes,
          retur: outRetur,
          lainnya: outLainnya
        },
        hjd: product.price
      };
    });
  }, [products, orders, transactions, dateRange]);

  // Compute distribution report data for preview table
  const distributionReportData = useMemo(() => {
    const currentPeriodOrders = orders.filter((order) => {
      const orderDate = order.approvedAt ? new Date(order.approvedAt) : new Date(order.createdAt);
      return (
        order.status !== "PENDING_APPROVAL" &&
        order.status !== "REJECTED" &&
        orderDate >= dateRange.startDate &&
        orderDate <= dateRange.endDate
      );
    });

    const rows: any[] = [];
    let no = 1;

    currentPeriodOrders.forEach((order) => {
      const orderAddress = order.shippingAddress || order.institution.address;
      const matchedCity = CITY_REGIONS.find((city) => {
        const cityNameClean = city.name.replace(/^(Kab\.|Kota)\s+/i, "").toLowerCase().trim();
        return orderAddress.toLowerCase().includes(cityNameClean);
      }) || {
        id: "3171",
        name: "Kota Jakarta Selatan",
        provinceId: "3100",
        provinceName: "DKI Jakarta"
      };

      const dateStr = (order.approvedAt ? new Date(order.approvedAt) : new Date(order.createdAt))
        .toISOString()
        .split("T")[0];

      const jenisDistribusi = (order.institution.type || "APOTEK").replace("_", " ");

      if (order.batchAllocations && order.batchAllocations.length > 0) {
        order.batchAllocations.forEach((alloc: any) => {
          const product = alloc.batch.product || products.find((p) => p.id === alloc.batch.productId);
          const expDate = new Date(alloc.batch.expiryDate).toISOString().split("T")[0];

          rows.push({
            no: no++,
            jenisDistribusi,
            dateStr,
            code: product?.nie || product?.code || "-",
            productName: product?.name || "-",
            quantity: alloc.quantity,
            batchNumber: alloc.batch.batchNumber,
            expDate,
            orderNumber: order.orderNumber,
            institutionName: order.institution.name,
            address: orderAddress,
            cityName: matchedCity.name,
            provinceName: matchedCity.provinceName,
          });
        });
      } else {
        order.items.forEach((item: any) => {
          const product = products.find((p) => p.id === item.productId) || item.product;
          rows.push({
            no: no++,
            jenisDistribusi,
            dateStr,
            code: product?.nie || product?.code || "-",
            productName: product?.name || "-",
            quantity: item.quantity,
            batchNumber: "-",
            expDate: "-",
            orderNumber: order.orderNumber,
            institutionName: order.institution.name,
            address: orderAddress,
            cityName: matchedCity.name,
            provinceName: matchedCity.provinceName,
          });
        });
      }
    });

    return rows;
  }, [orders, products, dateRange]);

  // Compute receive report data for preview table
  const receiveReportData = useMemo(() => {
    const currentPeriodTxs = transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return (
        ["IN_IF", "IN_PBF", "IN_RETUR_CUSTOMER"].includes(tx.type) &&
        txDate >= dateRange.startDate &&
        txDate <= dateRange.endDate
      );
    });

    let no = 1;
    return currentPeriodTxs.map((tx) => {
      const product = products.find((p) => p.id === tx.productId);
      const batch = product?.batches?.find((b: any) => b.id === tx.batchId);

      const batchNumber = batch ? batch.batchNumber : "-";
      const expDate = batch ? new Date(batch.expiryDate).toISOString().split("T")[0] : "-";

      let jenisTransaksi = "INDUSTRI FARMASI";
      if (tx.type === "IN_PBF") {
        jenisTransaksi = "PBF";
      } else if (tx.type === "IN_RETUR_CUSTOMER") {
        jenisTransaksi = "RETUR";
      }

      let sourceAddress = tx.sourceTargetName;
      const order = orders.find((o) => o.institutionId === tx.sourceTargetId);
      if (order?.shippingAddress) {
        sourceAddress = order.shippingAddress;
      } else if (order?.institution?.address) {
        sourceAddress = order.institution.address;
      }

      const matchedCity = CITY_REGIONS.find((city) => {
        const cityNameClean = city.name.replace(/^(Kab\.|Kota)\s+/i, "").toLowerCase().trim();
        return sourceAddress.toLowerCase().includes(cityNameClean);
      }) || {
        id: "3171",
        name: "Kota Jakarta Selatan",
        provinceId: "3100",
        provinceName: "DKI Jakarta"
      };

      const dateStr = new Date(tx.createdAt).toISOString().split("T")[0];

      return {
        no: no++,
        jenisTransaksi,
        dateStr,
        code: product?.nie || product?.code || "-",
        productName: product?.name || "-",
        quantity: tx.quantity,
        batchNumber,
        expDate,
        referenceNumber: tx.referenceNumber,
        sourceTargetName: tx.sourceTargetName,
        cityName: matchedCity.name,
        provinceName: matchedCity.provinceName,
      };
    });
  }, [transactions, products, orders, dateRange]);

  // Export to Excel handler
  const handleExportExcel = () => {
    // === SHEET 1: LAPORAN REALISASI ===
    const wsReportData: any[][] = [
      [titleText], // Row 0
      [], // Row 1 (spacer)
      [ // Row 2
        "Kode Obat (NIE)", "Nama Obat", "Kemasan", "Stok Awal",
        "Jumlah Pemasukan", "", "", "", "", // 5 columns for Pemasukan
        "Jumlah Pengeluaran", "", "", "", "", "", "", "", "", "", "", // 11 columns for Pengeluaran
        "HJD"
      ],
      [ // Row 3
        "", "", "", "",
        "Masuk IF", "Kode IF", "Masuk PBF", "Kode PBF", "Retur",
        "PBF", "Kode PBF", "RS", "Apotek", "Sarana Pemerintah", "Puskesmas", "Klinik", "Toko Obat", "Kemenkes", "Retur", "Lainnya",
        ""
      ]
    ];

    // Append table rows
    reportData.forEach((item) => {
      wsReportData.push([
        item.code,
        item.name,
        item.unit,
        item.stokAwal,
        item.pemasukan.masukIf,
        item.pemasukan.kodeIf,
        item.pemasukan.masukPbf,
        item.pemasukan.kodePbf,
        item.pemasukan.retur,
        item.pengeluaran.pbf,
        item.pengeluaran.kodePbf,
        item.pengeluaran.rs,
        item.pengeluaran.apotek,
        item.pengeluaran.saranaPemerintah,
        item.pengeluaran.puskesmas,
        item.pengeluaran.klinik,
        item.pengeluaran.tokoObat,
        item.pengeluaran.kemenkes,
        item.pengeluaran.retur,
        item.pengeluaran.lainnya,
        item.hjd
      ]);
    });

    const wsReport = XLSX.utils.aoa_to_sheet(wsReportData);

    // Set merges for Sheet 1
    wsReport["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 20 } },
      { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
      { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
      { s: { r: 2, c: 2 }, e: { r: 3, c: 2 } },
      { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } },
      { s: { r: 2, c: 4 }, e: { r: 2, c: 8 } },
      { s: { r: 2, c: 9 }, e: { r: 2, c: 19 } },
      { s: { r: 2, c: 20 }, e: { r: 3, c: 20 } }
    ];

    // Set styling and column widths for Sheet 1
    wsReport["!cols"] = [
      { wch: 18 }, // A: Kode Obat
      { wch: 25 }, // B: Nama Obat
      { wch: 10 }, // C: Kemasan
      { wch: 10 }, // D: Stok Awal
      // Pemasukan
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 8 },
      // Pengeluaran
      { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 },
      // HJD
      { wch: 12 }
    ];

    // Format data cells on Sheet 1 for modern presentation
    const range = XLSX.utils.decode_range(wsReport['!ref'] || "A1");
    for (let r = range.s.r; r <= range.e.r; ++r) {
      if (r < 4) continue; // Skip headers
      for (let c = range.s.c; c <= range.e.c; ++c) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = wsReport[cellRef];
        if (!cell) continue;

        if (cell.t === 'n') {
          if (c === 20) { // HJD column (Col U)
            cell.z = '"Rp"#,##0';
          } else { // Quantity columns
            cell.z = '#,##0';
          }
        }
      }
    }

    // === SHEET 2: PETUNJUK PENGISIAN ===
    const wsInstData: any[][] = [
      ["PETUNJUK PENGISIAN KOLOM LAPORAN REALISASI OBAT PBF (e-Report BPOM)"], // Row 0
      [], // Row 1 (Spacer)
      ["No.", "Keterangan Bantuan / Deskripsi Kolom"] // Row 2
    ];

    const instMerges: any[] = [
      // Title merges
      { s: { r: 0, c: 0 }, e: { r: 0, c: 20 } },
      // Header merges
      { s: { r: 2, c: 1 }, e: { r: 2, c: 20 } }
    ];

    // Append guidelines
    helpGuidelines.forEach((g) => {
      const rowIdx = wsInstData.length;
      wsInstData.push([g.id, g.text]);
      instMerges.push({ s: { r: rowIdx, c: 1 }, e: { r: rowIdx, c: 20 } });
    });

    const wsInstructions = XLSX.utils.aoa_to_sheet(wsInstData);
    wsInstructions["!merges"] = instMerges;
    wsInstructions["!cols"] = [
      { wch: 6 }, // A: No
      { wch: 120 } // B: Description (wide)
    ];

    // Lock/Protect Sheet 2
    wsInstructions["!protect"] = {
      password: "groovyrx-pbf",
      selectLockedCells: true,
      selectUnlockedCells: true
    };

    // Create workbook and write sheets
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsReport, "Laporan Realisasi");
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Petunjuk Pengisian");
    XLSX.writeFile(wb, `Pelaporan_Obat_${periodLabel.replace(/\s+/g, "_")}.xlsx`);
  };

  const handleExportDistributionExcel = () => {
    // 1. Filter orders within the selected period (status !== "PENDING_APPROVAL" && status !== "REJECTED")
    const currentPeriodOrders = orders.filter((order) => {
      const orderDate = order.approvedAt ? new Date(order.approvedAt) : new Date(order.createdAt);
      return order.status !== "PENDING_APPROVAL" && order.status !== "REJECTED" && orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
    });

    const titleText = `PELAPORAN DISTRIBUSI OBAT PERIODE ${periodLabel.toUpperCase()} ${year} - PBF PT GROOVYRX PHARMACEUTICAL GROUP (PUSAT)`;

    // Sheet 1: Laporan Distribusi PBF Produk Data Array
    const wsDistData: any[][] = [
      [titleText], // Row 0
      [], // Row 1 (spacer)
      [ // Row 2: Headers
        "NO",
        "JENIS DISTRIBUSI *",
        "TANGGAL DISTRIBUSI *",
        "KODE OBAT JADI *",
        "JUMLAH OBAT JADI *",
        "BATCH OBAT JADI *",
        "TANGGAL EXPIRED *",
        "NOMOR FAKTUR *",
        "TUJUAN *",
        "ALAMAT*",
        "KETERANGAN/PERUNTUKAN",
        "ID KOTA/KAB TUJUAN",
        "NAMA KOTA/KAB TUJUAN",
        "PROVINSI TUJUAN"
      ]
    ];

    const typeLabels: Record<string, string> = {
      APOTEK: "Apotek",
      KLINIK: "Klinik",
      RUMAH_SAKIT: "Rumah Sakit",
      PBF: "PBF",
      PERUSAHAAN_UMUM: "Toko Obat",
    };

    let no = 1;

    currentPeriodOrders.forEach((order) => {
      const orderAddress = order.shippingAddress || order.institution.address;

      // Match city
      const matchedCity = CITY_REGIONS.find((city) => {
        const cityNameClean = city.name.replace(/^(Kab\.|Kota)\s+/i, "").toLowerCase().trim();
        return orderAddress.toLowerCase().includes(cityNameClean);
      }) || {
        id: "3171",
        name: "Kota Jakarta Selatan",
        provinceId: "3100",
        provinceName: "DKI Jakarta"
      };

      const dateStr = (order.approvedAt ? new Date(order.approvedAt) : new Date(order.createdAt))
        .toISOString()
        .split("T")[0];

      const jenisDistribusi = (order.institution.type || "APOTEK").replace("_", " ");

      // If we have batch allocations, log each allocation
      if (order.batchAllocations && order.batchAllocations.length > 0) {
        order.batchAllocations.forEach((alloc: any) => {
          const product = alloc.batch.product || products.find(p => p.id === alloc.batch.productId);
          const expDate = new Date(alloc.batch.expiryDate).toISOString().split("T")[0];

          wsDistData.push([
            no++,
            jenisDistribusi,
            dateStr,
            product?.nie || product?.code || "-",
            alloc.quantity,
            alloc.batch.batchNumber,
            expDate,
            order.orderNumber,
            order.institution.name,
            orderAddress,
            `Penyaluran ke ${typeLabels[order.institution.type] || "Sarana"}`,
            Number(matchedCity.id),
            matchedCity.name,
            matchedCity.provinceName
          ]);
        });
      } else {
        // Fallback to order items if no batch allocations recorded
        order.items.forEach((item: any) => {
          const product = products.find(p => p.id === item.productId) || item.product;
          wsDistData.push([
            no++,
            jenisDistribusi,
            dateStr,
            product?.nie || product?.code || "-",
            item.quantity,
            "-",
            "-",
            order.orderNumber,
            order.institution.name,
            orderAddress,
            `Penyaluran ke ${typeLabels[order.institution.type] || "Sarana"}`,
            Number(matchedCity.id),
            matchedCity.name,
            matchedCity.provinceName
          ]);
        });
      }
    });

    const wsDistribution = XLSX.utils.aoa_to_sheet(wsDistData);

    // Merge title for Sheet 1
    wsDistribution["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }
    ];

    // Column widths for Sheet 1
    wsDistribution["!cols"] = [
      { wch: 6 },   // A: NO
      { wch: 20 },  // B: JENIS DISTRIBUSI *
      { wch: 22 },  // C: TANGGAL DISTRIBUSI *
      { wch: 22 },  // D: KODE OBAT JADI *
      { wch: 18 },  // E: JUMLAH OBAT JADI *
      { wch: 18 },  // F: BATCH OBAT JADI *
      { wch: 18 },  // G: TANGGAL EXPIRED *
      { wch: 22 },  // H: NOMOR FAKTUR *
      { wch: 25 },  // I: TUJUAN *
      { wch: 35 },  // J: ALAMAT*
      { wch: 30 },  // K: KETERANGAN/PERUNTUKAN
      { wch: 18 },  // L: ID KOTA/KAB TUJUAN
      { wch: 25 },  // M: NAMA KOTA/KAB TUJUAN
      { wch: 25 }   // N: PROVINSI TUJUAN
    ];

    // Format data cells on Sheet 1 for modern presentation
    const range = XLSX.utils.decode_range(wsDistribution['!ref'] || "A1");
    for (let r = range.s.r; r <= range.e.r; ++r) {
      if (r < 3) continue; // Skip title and headers
      for (let c = range.s.c; c <= range.e.c; ++c) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = wsDistribution[cellRef];
        if (!cell) continue;

        if (cell.t === 'n') {
          if (c === 4) { // JUMLAH OBAT JADI (Col E)
            cell.z = '#,##0';
          }
        }
      }
    }

    // === SHEET 2: DATA WILAYAH (LOCK) ===
    const wsCityListData: any[][] = [
      ["DATA REFERENSI WILAYAH (KOTA/KABUPATEN & PROVINSI)"], // Row 0
      [], // Row 1
      ["ID KOTA/KAB", "NAMA KOTA/KAB", "ID PROVINSI", "NAMA PROVINSI"] // Row 2
    ];

    CITY_REGIONS.forEach((c) => {
      wsCityListData.push([
        Number(c.id),
        c.name,
        Number(c.provinceId),
        c.provinceName
      ]);
    });

    const wsCityList = XLSX.utils.aoa_to_sheet(wsCityListData);

    // Merge title for Sheet 2
    wsCityList["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
    ];

    // Column widths for Sheet 2
    wsCityList["!cols"] = [
      { wch: 15 }, // A: ID KOTA/KAB
      { wch: 30 }, // B: NAMA KOTA/KAB
      { wch: 15 }, // C: ID PROVINSI
      { wch: 30 }  // D: NAMA PROVINSI
    ];

    // Lock/Protect Sheet 2
    wsCityList["!protect"] = {
      password: "groovyrx-pbf",
      selectLockedCells: true,
      selectUnlockedCells: true
    };

    // Create workbook and write sheets
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsDistribution, "Laporan Distribusi PBF");
    XLSX.utils.book_append_sheet(wb, wsCityList, "Data Wilayah");
    XLSX.writeFile(wb, `Laporan_Distribusi_Obat_${periodLabel.replace(/\s+/g, "_")}.xlsx`);
  };

  const handleExportReceiveExcel = () => {
    // 1. Filter transactions within the selected period of incoming types: IN_IF, IN_PBF, IN_RETUR_CUSTOMER
    const currentPeriodTxs = transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return (
        ["IN_IF", "IN_PBF", "IN_RETUR_CUSTOMER"].includes(tx.type) &&
        txDate >= dateRange.startDate &&
        txDate <= dateRange.endDate
      );
    });

    const titleText = `PELAPORAN PENERIMAAN OBAT PERIODE ${periodLabel.toUpperCase()} ${year} - PBF PT GROOVYRX PHARMACEUTICAL GROUP (PUSAT)`;

    // Sheet 1: Laporan Receive PBF Produk Data Array
    const wsRecData: any[][] = [
      [titleText], // Row 0
      [], // Row 1 (spacer)
      [ // Row 2: Headers
        "NO",
        "JENIS TRANSAKSI *",
        "TANGGAL PEMASUKAN *",
        "KODE OBAT JADI *",
        "JUMLAH *",
        "BATCH *",
        "TANGGAL EXPIRED *",
        "NOMOR FAKTUR",
        "SUMBER",
        "KETERANGAN",
        "ID KOTA/KAB SUMBER",
        "NAMA KOTA/KAB SUMBER",
        "NAMA PROVINSI SUMBER"
      ]
    ];

    let no = 1;

    currentPeriodTxs.forEach((tx) => {
      const product = products.find((p) => p.id === tx.productId);
      const batch = product?.batches?.find((b: any) => b.id === tx.batchId);

      const batchNumber = batch ? batch.batchNumber : "-";
      const expDate = batch ? new Date(batch.expiryDate).toISOString().split("T")[0] : "-";

      let jenisTransaksi = "INDUSTRI FARMASI";
      if (tx.type === "IN_PBF") {
        jenisTransaksi = "PBF";
      } else if (tx.type === "IN_RETUR_CUSTOMER") {
        jenisTransaksi = "RETUR";
      }

      // Lookup source address
      let sourceAddress = tx.sourceTargetName;
      const order = orders.find(o => o.institutionId === tx.sourceTargetId);
      if (order?.shippingAddress) {
        sourceAddress = order.shippingAddress;
      } else if (order?.institution?.address) {
        sourceAddress = order.institution.address;
      }

      // Match city
      const matchedCity = CITY_REGIONS.find((city) => {
        const cityNameClean = city.name.replace(/^(Kab\.|Kota)\s+/i, "").toLowerCase().trim();
        return sourceAddress.toLowerCase().includes(cityNameClean);
      }) || {
        id: "3171",
        name: "Kota Jakarta Selatan",
        provinceId: "3100",
        provinceName: "DKI Jakarta"
      };

      const dateStr = new Date(tx.createdAt).toISOString().split("T")[0];

      wsRecData.push([
        no++,
        jenisTransaksi,
        dateStr,
        product?.nie || product?.code || "-",
        tx.quantity,
        batchNumber,
        expDate,
        tx.referenceNumber,
        tx.sourceTargetName,
        tx.type === "IN_RETUR_CUSTOMER" ? "Retur dari Pelanggan" : "Pemasukan Barang Pabrik/PBF",
        Number(matchedCity.id),
        matchedCity.name,
        matchedCity.provinceName
      ]);
    });

    const wsReceive = XLSX.utils.aoa_to_sheet(wsRecData);

    // Merge title for Sheet 1
    wsReceive["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }
    ];

    // Column widths for Sheet 1
    wsReceive["!cols"] = [
      { wch: 6 },   // A: NO
      { wch: 22 },  // B: JENIS TRANSAKSI *
      { wch: 22 },  // C: TANGGAL PEMASUKAN *
      { wch: 22 },  // D: KODE OBAT JADI *
      { wch: 15 },  // E: JUMLAH *
      { wch: 18 },  // F: BATCH *
      { wch: 18 },  // G: TANGGAL EXPIRED *
      { wch: 22 },  // H: NOMOR FAKTUR
      { wch: 25 },  // I: SUMBER
      { wch: 30 },  // J: KETERANGAN
      { wch: 20 },  // K: ID KOTA/KAB SUMBER
      { wch: 25 },  // L: NAMA KOTA/KAB SUMBER
      { wch: 25 }   // M: NAMA PROVINSI SUMBER
    ];

    // Format data cells on Sheet 1 for modern presentation
    const range = XLSX.utils.decode_range(wsReceive['!ref'] || "A1");
    for (let r = range.s.r; r <= range.e.r; ++r) {
      if (r < 3) continue; // Skip title and headers
      for (let c = range.s.c; c <= range.e.c; ++c) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = wsReceive[cellRef];
        if (!cell) continue;

        if (cell.t === 'n') {
          if (c === 4) { // JUMLAH (Col E)
            cell.z = '#,##0';
          }
        }
      }
    }

    // === SHEET 2: DATA WILAYAH (LOCK) ===
    const wsCityListData: any[][] = [
      ["DATA REFERENSI WILAYAH (KOTA/KABUPATEN & PROVINSI)"], // Row 0
      [], // Row 1
      ["ID KOTA/KAB", "NAMA KOTA/KAB", "ID PROVINSI", "NAMA PROVINSI"] // Row 2
    ];

    CITY_REGIONS.forEach((c) => {
      wsCityListData.push([
        Number(c.id),
        c.name,
        Number(c.provinceId),
        c.provinceName
      ]);
    });

    const wsCityList = XLSX.utils.aoa_to_sheet(wsCityListData);

    // Merge title for Sheet 2
    wsCityList["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
    ];

    // Column widths for Sheet 2
    wsCityList["!cols"] = [
      { wch: 15 }, // A: ID KOTA/KAB
      { wch: 30 }, // B: NAMA KOTA/KAB
      { wch: 15 }, // C: ID PROVINSI
      { wch: 30 }  // D: NAMA PROVINSI
    ];

    // Lock/Protect Sheet 2
    wsCityList["!protect"] = {
      password: "groovyrx-pbf",
      selectLockedCells: true,
      selectUnlockedCells: true
    };

    // Create workbook and write sheets
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsReceive, "Laporan Penerimaan PBF");
    XLSX.utils.book_append_sheet(wb, wsCityList, "Data Wilayah");
    XLSX.writeFile(wb, `Laporan_Penerimaan_Obat_${periodLabel.replace(/\s+/g, "_")}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* STEP 1: Pilih Jenis Laporan (3 Card Selection) */}
      <div className="bg-surface border border-outline-variant/30 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-outline-variant/20">
          <div>
            <h2 className="font-heading font-extrabold text-lg text-foreground flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" /> 1. Pilih Jenis Laporan PBF
            </h2>
            <p className="text-xs text-outline font-medium mt-0.5">
              Pilih salah satu dari 3 format pelaporan resmi PBF yang ingin diambil.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Card 1: Realisasi BPOM */}
          <div
            onClick={() => setSelectedReport("realisasi")}
            className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              selectedReport === "realisasi"
                ? "border-primary bg-emerald-50/40 shadow-sm ring-2 ring-primary/20"
                : "border-slate-200 bg-surface hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              {selectedReport === "realisasi" && (
                <span className="px-2.5 py-0.5 bg-primary text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  Terpilih
                </span>
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Realisasi (BPOM)</h3>
              <p className="text-[11px] text-outline mt-1 leading-relaxed">
                Laporan e-Report BPOM memuat Stok Awal, Pemasukan (IF/PBF), Pengeluaran per sarana, &amp; HJD.
              </p>
            </div>
          </div>

          {/* Card 2: Laporan Distribusi */}
          <div
            onClick={() => setSelectedReport("distribusi")}
            className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              selectedReport === "distribusi"
                ? "border-slate-800 bg-slate-100/60 shadow-sm ring-2 ring-slate-800/20"
                : "border-slate-200 bg-surface hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 bg-slate-800/10 text-slate-800 rounded-xl">
                <Download className="w-6 h-6" />
              </div>
              {selectedReport === "distribusi" && (
                <span className="px-2.5 py-0.5 bg-slate-800 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  Terpilih
                </span>
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Laporan Distribusi</h3>
              <p className="text-[11px] text-outline mt-1 leading-relaxed">
                Rincian faktur penyaluran obat ke Apotek, RS, Klinik, PBF, lengkap dengan batch &amp; kode wilayah.
              </p>
            </div>
          </div>

          {/* Card 3: Laporan Penerimaan */}
          <div
            onClick={() => setSelectedReport("penerimaan")}
            className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              selectedReport === "penerimaan"
                ? "border-teal-700 bg-teal-50/40 shadow-sm ring-2 ring-teal-700/20"
                : "border-slate-200 bg-surface hover:border-slate-300 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 bg-teal-700/10 text-teal-700 rounded-xl">
                <RefreshCw className="w-6 h-6" />
              </div>
              {selectedReport === "penerimaan" && (
                <span className="px-2.5 py-0.5 bg-teal-700 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                  Terpilih
                </span>
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">Laporan Penerimaan</h3>
              <p className="text-[11px] text-outline mt-1 leading-relaxed">
                Rincian penerimaan obat dari Industri Farmasi (IF), PBF lain, maupun retur pelanggan &amp; wilayah.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2: Filter Periode Pelaporan & Tombol Ekspor */}
      <div className="bg-surface border border-outline-variant/30 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-extrabold text-foreground text-sm uppercase tracking-wider">
                2. Filter Periode Pelaporan &amp; Unduh Excel
              </h3>
              <p className="text-[11px] text-outline">
                Berlaku untuk{" "}
                <strong className="text-foreground">
                  {selectedReport === "realisasi"
                    ? "Laporan Realisasi (BPOM)"
                    : selectedReport === "distribusi"
                    ? "Laporan Distribusi"
                    : "Laporan Penerimaan"}
                </strong>
              </p>
            </div>
          </div>

          {/* Quick Filter Preset Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Preset:</span>
            <button
              type="button"
              onClick={() => {
                setFilterMode("bulanan");
                setMonth(new Date().getMonth() + 1);
                setYear(new Date().getFullYear());
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === "bulanan" && month === new Date().getMonth() + 1 && year === new Date().getFullYear()
                  ? "bg-primary text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterMode("triwulan");
                const currentMonth = new Date().getMonth();
                if (currentMonth < 3) setQuarter("triwulan_1");
                else if (currentMonth < 6) setQuarter("triwulan_2");
                else if (currentMonth < 9) setQuarter("triwulan_3");
                else setQuarter("triwulan_4");
                setYear(new Date().getFullYear());
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === "triwulan" && year === new Date().getFullYear()
                  ? "bg-primary text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Triwulan Ini
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterMode("tahunan");
                setYear(new Date().getFullYear());
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === "tahunan" && year === new Date().getFullYear()
                  ? "bg-primary text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Tahun Ini
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("custom")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === "custom"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Rentang Kustom
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans items-end">
          {/* Mode Periode */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-outline">Tipe Periode</label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as any)}
              className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold text-foreground"
            >
              <option value="triwulan">Triwulan (BPOM e-Report)</option>
              <option value="bulanan">Bulanan (Bulan 1 - 12)</option>
              <option value="tahunan">Tahunan (1 Tahun Penuh)</option>
              <option value="custom">Rentang Tanggal Kustom</option>
            </select>
          </div>

          {/* Sub-Filters */}
          {filterMode === "triwulan" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-outline">Pilihan Triwulan</label>
                <select
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value as any)}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold text-foreground"
                >
                  <option value="triwulan_1">Triwulan I (Januari - Maret)</option>
                  <option value="triwulan_2">Triwulan II (April - Juni)</option>
                  <option value="triwulan_3">Triwulan III (Juli - September)</option>
                  <option value="triwulan_4">Triwulan IV (Oktober - Desember)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-outline">Tahun Pelaporan</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold text-foreground"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {filterMode === "bulanan" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-outline">Pilihan Bulan</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold text-foreground"
                >
                  {MONTH_NAMES.map((mName, idx) => (
                    <option key={idx + 1} value={idx + 1}>{mName}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-outline">Tahun Pelaporan</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold text-foreground"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {filterMode === "tahunan" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-outline">Tahun Pelaporan</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold text-foreground"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {filterMode === "custom" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-outline">Tanggal Mulai</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold text-foreground text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-outline">Tanggal Selesai</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-bold text-foreground text-xs"
                />
              </div>
            </>
          )}

          {/* Primary Action Button corresponding to selected report */}
          <div className={`${filterMode === "tahunan" ? "sm:col-span-3 md:col-span-3" : filterMode === "triwulan" || filterMode === "bulanan" || filterMode === "custom" ? "sm:col-span-2 md:col-span-1" : ""} flex flex-col justify-end`}>
            {selectedReport === "realisasi" && (
              <button
                onClick={handleExportExcel}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary/95 transition-all cursor-pointer outline-none group"
              >
                <Download className="w-4 h-4 text-white group-hover:scale-110 transition-transform" /> Ekspor Realisasi (BPOM)
              </button>
            )}
            {selectedReport === "distribusi" && (
              <button
                onClick={handleExportDistributionExcel}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md hover:bg-slate-700 transition-all cursor-pointer outline-none group"
              >
                <Download className="w-4 h-4 text-white group-hover:scale-110 transition-transform" /> Ekspor Laporan Distribusi
              </button>
            )}
            {selectedReport === "penerimaan" && (
              <button
                onClick={handleExportReceiveExcel}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md hover:bg-teal-700 transition-all cursor-pointer outline-none group"
              >
                <Download className="w-4 h-4 text-white group-hover:scale-110 transition-transform" /> Ekspor Laporan Penerimaan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Table Preview Trigger */}
      <div
        onClick={() => setIsTableExpanded(!isTableExpanded)}
        className="bg-surface border border-outline-variant/30 rounded-3xl p-5 shadow-sm flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-all duration-150"
      >
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <div className="space-y-0.5">
            <h4 className="font-heading font-extrabold text-sm text-foreground uppercase tracking-wide">
              Pratinjau Tabel{" "}
              {selectedReport === "realisasi"
                ? "Laporan Realisasi BPOM"
                : selectedReport === "distribusi"
                ? "Laporan Penyaluran / Distribusi"
                : "Laporan Penerimaan"}{" "}
              ({periodLabel})
            </h4>
            <p className="text-[10px] text-outline font-medium">
              {isTableExpanded ? "Klik untuk menyembunyikan pratinjau tabel" : "Klik untuk menampilkan pratinjau tabel"}
            </p>
          </div>
        </div>
        <div className="text-on-surface-variant flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition-colors">
          <span
            className="material-symbols-outlined transition-transform duration-200"
            style={{ transform: isTableExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            expand_more
          </span>
        </div>
      </div>

      {/* Table Preview Card */}
      {isTableExpanded && (
        <div className="bg-surface border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-outline-variant/25 bg-slate-50/50 flex justify-between items-center">
            <div className="text-center w-full">
              <h4 className="font-heading font-extrabold text-sm text-foreground uppercase tracking-wide">
                {selectedReport === "realisasi" && titleText}
                {selectedReport === "distribusi" && `PELAPORAN DISTRIBUSI OBAT PERIODE ${periodLabel.toUpperCase()} - PBF PT GROOVYRX PHARMACEUTICAL GROUP (PUSAT)`}
                {selectedReport === "penerimaan" && `PELAPORAN PENERIMAAN OBAT PERIODE ${periodLabel.toUpperCase()} - PBF PT GROOVYRX PHARMACEUTICAL GROUP (PUSAT)`}
              </h4>
            </div>
          </div>

          <div className="overflow-x-auto text-[10px]">
            {/* Table 1: Realisasi BPOM */}
            {selectedReport === "realisasi" && (
              <table className="w-full text-left border-collapse min-w-[1400px]">
                <thead className="bg-slate-100/80 border-b border-outline-variant/35 text-on-surface-variant font-bold">
                  <tr className="border-b border-outline-variant/20">
                    <th rowSpan={2} className="px-3 py-3 border-r border-outline-variant/20 text-center align-middle">Kode Obat (NIE)</th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-outline-variant/20 text-center align-middle">Nama Obat</th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-outline-variant/20 text-center align-middle">Kemasan</th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-outline-variant/20 text-center align-middle">Stok Awal</th>
                    <th colSpan={5} className="px-3 py-2 border-r border-outline-variant/20 text-center bg-blue-50/50 text-blue-900">Jumlah Pemasukan</th>
                    <th colSpan={11} className="px-3 py-2 border-r border-outline-variant/20 text-center bg-green-50/50 text-green-900">Jumlah Pengeluaran</th>
                    <th rowSpan={2} className="px-3 py-3 text-center align-middle">HJD</th>
                  </tr>
                  <tr className="bg-slate-50 text-[9px] uppercase tracking-wider font-extrabold border-b border-outline-variant/25">
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">Masuk IF</th>
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">Kode IF</th>
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">Masuk PBF</th>
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">Kode PBF</th>
                    <th className="px-2 py-2 border-r border-outline-variant/20 text-center">Retur</th>
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">PBF</th>
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">Kode PBF</th>
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">RS</th>
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">Apotek</th>
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">Sarana Pemerintah</th>
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">Puskesmas</th>
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">Klinik</th>
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">Toko Obat</th>
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">Kemenkes</th>
                    <th className="px-2 py-2 border-r border-outline-variant/15 text-center">Retur</th>
                    <th className="px-2 py-2 border-r border-outline-variant/20 text-center">Lainnya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface font-mono text-center">
                  {reportData.length === 0 ? (
                    <tr>
                      <td colSpan={21} className="px-6 py-12 text-center text-on-surface-variant/50 italic font-sans text-xs">
                        Belum ada data obat tersedia untuk periode ini.
                      </td>
                    </tr>
                  ) : (
                    reportData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors h-10">
                        <td className="px-3 py-2 border-r border-outline-variant/10 text-left font-sans font-bold">{item.code}</td>
                        <td className="px-3 py-2 border-r border-outline-variant/10 text-left font-sans font-extrabold text-slate-800">{item.name}</td>
                        <td className="px-3 py-2 border-r border-outline-variant/10 font-sans">{item.unit}</td>
                        <td className="px-3 py-2 border-r border-outline-variant/10 font-bold">{item.stokAwal}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-blue-50/10">{item.pemasukan.masukIf}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-blue-50/10 font-sans text-[9px] text-outline">{item.pemasukan.kodeIf}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-blue-50/10">{item.pemasukan.masukPbf}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-blue-50/10 font-sans text-[9px] text-outline">{item.pemasukan.kodePbf}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/15 bg-blue-50/10">{item.pemasukan.retur}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-green-50/10">{item.pengeluaran.pbf}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-green-50/10 font-sans text-[9px] text-outline">{item.pengeluaran.kodePbf}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-green-50/10">{item.pengeluaran.rs}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-green-50/10">{item.pengeluaran.apotek}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-green-50/10">{item.pengeluaran.saranaPemerintah}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-green-50/10">{item.pengeluaran.puskesmas}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-green-50/10">{item.pengeluaran.klinik}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-green-50/10">{item.pengeluaran.tokoObat}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-green-50/10">{item.pengeluaran.kemenkes}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/10 bg-green-50/10">{item.pengeluaran.retur}</td>
                        <td className="px-2 py-2 border-r border-outline-variant/15 bg-green-50/10">{item.pengeluaran.lainnya}</td>
                        <td className="px-3 py-2 font-bold text-right font-mono text-primary text-[11px]">Rp {item.hjd.toLocaleString("id-ID")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* Table 2: Laporan Distribusi */}
            {selectedReport === "distribusi" && (
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="bg-slate-100/80 border-b border-outline-variant/35 text-on-surface-variant font-bold">
                  <tr className="bg-slate-50 text-[9px] uppercase tracking-wider font-extrabold border-b border-outline-variant/25">
                    <th className="px-3 py-3 text-center">No</th>
                    <th className="px-3 py-3 text-left">Jenis Distribusi</th>
                    <th className="px-3 py-3 text-center">Tgl Distribusi</th>
                    <th className="px-3 py-3 text-left">Kode Obat</th>
                    <th className="px-3 py-3 text-left">Nama Obat</th>
                    <th className="px-3 py-3 text-center">Jumlah</th>
                    <th className="px-3 py-3 text-center">No Batch</th>
                    <th className="px-3 py-3 text-center">Expired Date</th>
                    <th className="px-3 py-3 text-left">No Faktur</th>
                    <th className="px-3 py-3 text-left">Tujuan (Sarana)</th>
                    <th className="px-3 py-3 text-left">Kota/Kab</th>
                    <th className="px-3 py-3 text-left">Provinsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface font-mono">
                  {distributionReportData.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-6 py-12 text-center text-on-surface-variant/50 italic font-sans text-xs">
                        Belum ada data transaksi penyaluran/distribusi untuk periode ini.
                      </td>
                    </tr>
                  ) : (
                    distributionReportData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors h-10">
                        <td className="px-3 py-2 text-center font-sans">{item.no}</td>
                        <td className="px-3 py-2 text-left font-sans font-bold text-slate-700">{item.jenisDistribusi}</td>
                        <td className="px-3 py-2 text-center font-mono">{item.dateStr}</td>
                        <td className="px-3 py-2 text-left font-sans font-bold">{item.code}</td>
                        <td className="px-3 py-2 text-left font-sans font-extrabold text-slate-900">{item.productName}</td>
                        <td className="px-3 py-2 text-center font-bold text-emerald-700">{item.quantity}</td>
                        <td className="px-3 py-2 text-center font-mono">{item.batchNumber}</td>
                        <td className="px-3 py-2 text-center font-mono">{item.expDate}</td>
                        <td className="px-3 py-2 text-left font-mono font-bold text-slate-800">{item.orderNumber}</td>
                        <td className="px-3 py-2 text-left font-sans font-bold">{item.institutionName}</td>
                        <td className="px-3 py-2 text-left font-sans">{item.cityName}</td>
                        <td className="px-3 py-2 text-left font-sans">{item.provinceName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* Table 3: Laporan Penerimaan */}
            {selectedReport === "penerimaan" && (
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="bg-slate-100/80 border-b border-outline-variant/35 text-on-surface-variant font-bold">
                  <tr className="bg-slate-50 text-[9px] uppercase tracking-wider font-extrabold border-b border-outline-variant/25">
                    <th className="px-3 py-3 text-center">No</th>
                    <th className="px-3 py-3 text-left">Jenis Transaksi</th>
                    <th className="px-3 py-3 text-center">Tgl Pemasukan</th>
                    <th className="px-3 py-3 text-left">Kode Obat</th>
                    <th className="px-3 py-3 text-left">Nama Obat</th>
                    <th className="px-3 py-3 text-center">Jumlah</th>
                    <th className="px-3 py-3 text-center">No Batch</th>
                    <th className="px-3 py-3 text-center">Expired Date</th>
                    <th className="px-3 py-3 text-left">No Faktur / Ref</th>
                    <th className="px-3 py-3 text-left">Sumber</th>
                    <th className="px-3 py-3 text-left">Kota/Kab</th>
                    <th className="px-3 py-3 text-left">Provinsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface font-mono">
                  {receiveReportData.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-6 py-12 text-center text-on-surface-variant/50 italic font-sans text-xs">
                        Belum ada data penerimaan barang untuk periode ini.
                      </td>
                    </tr>
                  ) : (
                    receiveReportData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors h-10">
                        <td className="px-3 py-2 text-center font-sans">{item.no}</td>
                        <td className="px-3 py-2 text-left font-sans font-bold text-teal-800">{item.jenisTransaksi}</td>
                        <td className="px-3 py-2 text-center font-mono">{item.dateStr}</td>
                        <td className="px-3 py-2 text-left font-sans font-bold">{item.code}</td>
                        <td className="px-3 py-2 text-left font-sans font-extrabold text-slate-900">{item.productName}</td>
                        <td className="px-3 py-2 text-center font-bold text-teal-700">{item.quantity}</td>
                        <td className="px-3 py-2 text-center font-mono">{item.batchNumber}</td>
                        <td className="px-3 py-2 text-center font-mono">{item.expDate}</td>
                        <td className="px-3 py-2 text-left font-mono font-bold text-slate-800">{item.referenceNumber}</td>
                        <td className="px-3 py-2 text-left font-sans font-bold">{item.sourceTargetName}</td>
                        <td className="px-3 py-2 text-left font-sans">{item.cityName}</td>
                        <td className="px-3 py-2 text-left font-sans">{item.provinceName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
