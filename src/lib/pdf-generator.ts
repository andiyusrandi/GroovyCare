function numberToWords(n: number): string {
  const units = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  if (n < 12) return units[n];
  if (n < 20) return units[n - 10] + " belas";
  if (n < 100) {
    const doubleDigit = Math.floor(n / 10);
    const remainder = n % 10;
    return units[doubleDigit] + " puluh" + (remainder > 0 ? " " + units[remainder] : "");
  }
  if (n < 200) return "seratus " + numberToWords(n - 100);
  if (n < 1000) {
    const tripleDigit = Math.floor(n / 100);
    const remainder = n % 100;
    return units[tripleDigit] + " ratus" + (remainder > 0 ? " " + numberToWords(remainder) : "");
  }
  return n.toString(); // Fallback for very large quantities
}

export function printCDOBDocument(order: any, type: "SP" | "INVOICE" | "SURAT_JALAN") {
  if (typeof window === "undefined") return;

  const w = window.open("", "_blank");
  if (!w) {
    alert("Pop-up diblokir. Harap izinkan pop-up untuk mencetak dokumen CDOB.");
    return;
  }

  // Calculate order totals
  const subtotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const vat = Math.round(subtotal * 0.11);
  
  const addr = order.shippingAddress || "";
  const feeMatch = addr.match(/-\s*Rp\s*([0-9.,]+)/);
  let shippingFee = 0;
  if (feeMatch && feeMatch[1]) {
    shippingFee = parseInt(feeMatch[1].replace(/[.,]/g, ""), 10) || 0;
  } else {
    const isColdChain = order.items.some((item: any) => 
      item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain"
    );
    shippingFee = isColdChain ? 85000 : 50000;
  }
  const total = subtotal + vat + shippingFee;

  const orderDate = new Date(order.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const approvedDate = order.approvedAt ? new Date(order.approvedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }) : orderDate;

  const dueDate = new Date(new Date(order.createdAt).getTime() + (order.institution.topDays || 30) * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let documentHtml = "";

  if (type === "SP") {
    // 1. SURAT PESANAN (SP) TEMPLATE
    documentHtml = `
      <div class="document-container">
        <!-- Letterhead (Customer / Apothecary) -->
        <div class="letterhead flex justify-between items-start border-b-2 border-slate-800 pb-4">
          <div class="max-w-[70%]">
            <h1 class="font-heading font-extrabold text-lg text-slate-900 uppercase">${order.institution.name}</h1>
            <p class="text-[10px] text-slate-600 mt-1 leading-relaxed">${order.institution.address}</p>
            <p class="text-[10px] text-slate-700 font-bold mt-1">SIA: ${order.institution.siaNumber}</p>
          </div>
          <div class="text-right">
            <span class="border border-slate-800 px-3 py-1 text-[9px] font-bold uppercase tracking-wider">Arsip CDOB</span>
            <p class="text-[9px] text-slate-500 font-mono mt-2">${order.orderNumber}</p>
          </div>
        </div>

        <!-- Document Title -->
        <div class="text-center my-6">
          <h2 class="font-heading font-extrabold text-sm uppercase tracking-wider border-b border-slate-300 pb-1 inline-block">
            SURAT PESANAN OBAT KERAS / SEDIAAN FARMASI
          </h2>
          <p class="text-[9px] text-slate-500 mt-1 font-mono">No. Surat: ${order.orderNumber}</p>
        </div>

        <!-- Recipient & Meta -->
        <div class="grid grid-cols-2 gap-4 text-[10px] leading-relaxed my-4 text-slate-700">
          <div>
            <p class="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Kepada Yth:</p>
            <p class="font-extrabold text-slate-900">PT PHARMADIST INDONESIA (PBF)</p>
            <p>Izin PBF: 91201083921820003</p>
            <p>Jl. Terpadu Healthcare No. 42, Jakarta Selatan</p>
          </div>
          <div class="pl-4 border-l border-slate-200">
            <p class="text-slate-400 font-bold uppercase text-[8px] tracking-wider">Detail Pemesanan:</p>
            <p>Tanggal SP: <strong>${orderDate}</strong></p>
            <p>Sifat Pesanan: <strong>Biasa / Rantai Dingin</strong></p>
            <p>Jalur Distribusi: <strong>B2B Online Portal</strong></p>
          </div>
        </div>

        <!-- Body Message -->
        <p class="text-[10px] text-slate-700 leading-relaxed my-4">
          Harap dikirimkan obat-obatan untuk keperluan pelayanan kefarmasian di sarana kami, sesuai dengan daftar berikut:
        </p>

        <!-- Product Table -->
        <table class="w-full text-[10px] border-collapse border border-slate-300 my-4">
          <thead>
            <tr class="bg-slate-50 text-slate-900 border-b border-slate-300">
              <th class="border border-slate-300 px-3 py-2 text-left w-8">No</th>
              <th class="border border-slate-300 px-3 py-2 text-left">Nama Obat / Sediaan</th>
              <th class="border border-slate-300 px-3 py-2 text-left">Bahan Aktif</th>
              <th class="border border-slate-300 px-3 py-2 text-center w-24">Jumlah (Angka)</th>
              <th class="border border-slate-300 px-3 py-2 text-left">Ejaan Jumlah (Kata)</th>
              <th class="border border-slate-300 px-3 py-2 text-center w-16">Satuan</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item: any, idx: number) => `
              <tr class="border-b border-slate-200">
                <td class="border border-slate-300 px-3 py-2 text-center font-mono">${idx + 1}</td>
                <td class="border border-slate-300 px-3 py-2 font-bold text-slate-900">${item.product.name}</td>
                <td class="border border-slate-300 px-3 py-2 text-slate-600 font-medium italic">${item.product.activeIngredient || "-"}</td>
                <td class="border border-slate-300 px-3 py-2 text-center font-bold">${item.quantity}</td>
                <td class="border border-slate-300 px-3 py-2 text-slate-600 capitalize">${numberToWords(item.quantity)}</td>
                <td class="border border-slate-300 px-3 py-2 text-center uppercase font-bold text-[9px]">${item.product.unit}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <!-- CDOB Compliance Disclaimer -->
        <div class="bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-[9px] text-slate-600 leading-relaxed my-4">
          <strong>Pernyataan Kepatuhan CDOB & Regulasi BPOM:</strong><br/>
          Obat keras yang dipesan di atas akan disalurkan dan disimpan sesuai dengan standar Cara Distribusi Obat yang Baik (CDOB) BPOM RI. Apoteker Penanggung Jawab sarana menjamin keabsahan izin operasional sarana serta keaslian identitas pemesanan ini secara hukum.
        </div>

        <!-- Signatures Section -->
        <div class="flex justify-between items-end mt-12 text-[10px] text-slate-800">
          <div>
            <p class="text-slate-400 uppercase text-[8px] tracking-wider">Dibuat Oleh,</p>
            <p class="mt-1 font-bold text-slate-900">${order.institution.name}</p>
            <div class="h-16"></div>
            <p class="border-t border-slate-400 pt-1 font-bold">Staf Administrasi Sarana</p>
          </div>
          <div class="text-right">
            <p class="text-slate-400 uppercase text-[8px] tracking-wider">Apoteker Penanggung Jawab (APJ),</p>
            <p class="mt-1 font-bold text-slate-900">${order.createdBy.name}</p>
            <div class="h-16 flex items-center justify-end py-1">
              ${order.spSignature ? `
                <div class="relative w-24 h-14 border border-dashed border-emerald-400 bg-emerald-50/20 rounded p-1 flex items-center justify-center">
                  <img src="${order.spSignature}" alt="Sign" class="max-h-full max-w-full object-contain" />
                  <span class="absolute bottom-0 right-0 bg-emerald-600 text-white text-[5px] font-bold px-1 rounded uppercase">Digital Signed</span>
                </div>
              ` : `
                <div class="w-24 h-12 border border-dashed border-rose-300 bg-rose-50 text-rose-500 flex items-center justify-center text-[7px] font-extrabold uppercase">Tanda Tangan Kosong</div>
              `}
            </div>
            <p class="border-t border-slate-400 pt-1 font-bold">APJ: ${order.createdBy.name}</p>
            <p class="text-[8px] text-slate-500 font-mono mt-0.5">SIPA: ${order.createdBy.sipaNumber || "-"}</p>
          </div>
        </div>
      </div>
    `;
  } else if (type === "INVOICE") {
    // 2. INVOICE (e-FAKTUR) TEMPLATE
    documentHtml = `
      <div class="document-container">
        <!-- Letterhead (PBF PharmaDist) -->
        <div class="letterhead flex justify-between items-start border-b-2 border-primary pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary text-white flex items-center justify-center font-heading font-extrabold text-xl rounded-xl">P</div>
            <div>
              <h1 class="font-heading font-extrabold text-sm text-slate-900">PT PHARMADIST INDONESIA</h1>
              <p class="text-[9px] text-slate-500 font-medium">Distributor & Pedagang Besar Farmasi (PBF) Resmi</p>
              <p class="text-[8px] text-slate-400 mt-0.5">Izin PBF: 91201083921820003 | Sertifikat CDOB: 420/CDOB/BPOM/2026</p>
            </div>
          </div>
          <div class="text-right">
            <h2 class="font-heading font-extrabold text-base text-primary uppercase">e-FAKTUR PENJUALAN</h2>
            <p class="text-[9px] text-slate-500 font-mono mt-1">No. Faktur: INV-${order.orderNumber}</p>
          </div>
        </div>

        <!-- Meta Grid -->
        <div class="grid grid-cols-2 gap-6 my-5 text-[10px] text-slate-700 leading-relaxed">
          <div class="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p class="text-slate-400 uppercase text-[8px] font-bold tracking-wider">Ditagihkan Kepada:</p>
            <p class="font-bold text-slate-900 mt-1">${order.institution.name}</p>
            <p>${order.institution.address}</p>
            <p class="font-bold mt-1 text-[9px] font-mono">No. SIA: ${order.institution.siaNumber}</p>
          </div>
          <div class="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-2 gap-y-1">
            <div class="text-slate-400">No. Surat Pesanan:</div>
            <div class="font-mono font-bold text-slate-900">${order.orderNumber}</div>
            <div class="text-slate-400">Tanggal Faktur:</div>
            <div class="font-bold">${approvedDate}</div>
            <div class="text-slate-400">Tenor Pembayaran:</div>
            <div class="font-bold">${order.institution.topDays || 30} Hari (TOP)</div>
            <div class="text-slate-400">Jatuh Tempo:</div>
            <div class="font-bold text-primary">${dueDate}</div>
            <div class="text-slate-400">Status Bayar:</div>
            <div class="font-bold ${order.paymentStatus === "PAID" ? "text-emerald-600" : "text-amber-600"} uppercase">${order.paymentStatus}</div>
          </div>
        </div>

        <!-- Product Table -->
        <table class="w-full text-[10px] border-collapse border border-slate-300 my-4">
          <thead>
            <tr class="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
              <th class="border border-slate-300 px-3 py-2 text-left w-8">No</th>
              <th class="border border-slate-300 px-3 py-2 text-left">Nama Obat / Deskripsi</th>
              <th class="border border-slate-300 px-3 py-2 text-center w-16">Satuan</th>
              <th class="border border-slate-300 px-3 py-2 text-center w-16">Jumlah</th>
              <th class="border border-slate-300 px-3 py-2 text-right w-24">Harga Satuan</th>
              <th class="border border-slate-300 px-3 py-2 text-right w-24">Subtotal (Rp)</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item: any, idx: number) => `
              <tr class="border-b border-slate-200">
                <td class="border border-slate-300 px-3 py-2 text-center font-mono">${idx + 1}</td>
                <td class="border border-slate-300 px-3 py-2 font-bold text-slate-900">
                  ${item.product.name}
                  <span class="block text-[8px] text-slate-500 font-normal italic mt-0.5">Bahan Aktif: ${item.product.activeIngredient || "-"}</span>
                </td>
                <td class="border border-slate-300 px-3 py-2 text-center uppercase font-bold text-[9px]">${item.product.unit}</td>
                <td class="border border-slate-300 px-3 py-2 text-center font-bold">${item.quantity}</td>
                <td class="border border-slate-300 px-3 py-2 text-right font-mono">Rp ${item.price.toLocaleString("id-ID")}</td>
                <td class="border border-slate-300 px-3 py-2 text-right font-mono font-bold">Rp ${(item.price * item.quantity).toLocaleString("id-ID")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <!-- Totals & Payment Grid -->
        <div class="flex justify-between items-start my-6">
          <div class="max-w-[50%] text-[9px] text-slate-500 leading-relaxed border border-slate-200 rounded-xl p-3 bg-slate-50">
            <strong>Informasi Pembayaran Bank:</strong><br/>
            Pembayaran jatuh tempo pada tanggal <strong>${dueDate}</strong>.<br/>
            Transfer dapat ditujukan ke Rekening PBF Finance:<br/>
            <strong>Bank Mandiri Cab. Healthcare: 123-000-456-7890</strong><br/>
            a/n PT PHARMADIST INDONESIA
          </div>
          <div class="w-64 text-[10px] text-slate-700 space-y-1.5">
            <div class="flex justify-between">
              <span>Subtotal Penjualan:</span>
              <span class="font-mono">Rp ${subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div class="flex justify-between">
              <span>PPN (11%):</span>
              <span class="font-mono">Rp ${vat.toLocaleString("id-ID")}</span>
            </div>
            <div class="flex justify-between">
              <span>Biaya Kirim (Flat/Cold):</span>
              <span class="font-mono">Rp ${shippingFee.toLocaleString("id-ID")}</span>
            </div>
            <div class="flex justify-between border-t border-slate-300 pt-2 font-bold text-slate-900 text-xs">
              <span>Total Pembayaran:</span>
              <span class="font-mono text-primary">Rp ${total.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        <!-- Stamp & Signatures -->
        <div class="flex justify-between items-end mt-12 text-[10px] text-slate-800">
          <div>
            <p class="text-slate-400 uppercase text-[8px] tracking-wider">Apoteker Penanggung Jawab Sarana,</p>
            <div class="h-16"></div>
            <p class="border-t border-slate-400 pt-1 font-bold text-slate-900">${order.createdBy.name}</p>
            <p class="text-[8px] text-slate-500">SIPA: ${order.createdBy.sipaNumber || "-"}</p>
          </div>
          <div class="text-right">
            <p class="text-slate-400 uppercase text-[8px] tracking-wider">Hormat Kami, PBF Finance,</p>
            <div class="h-16 flex items-center justify-end py-1 relative">
              <!-- Mock PBF Corporate Blue Stamp -->
              <div class="w-16 h-16 rounded-full border-2 border-dashed border-primary/50 text-primary/60 font-extrabold text-[8px] uppercase tracking-wider flex flex-col items-center justify-center rotate-12 absolute -top-2 right-4 select-none opacity-85">
                <span>PBF</span>
                <span class="text-[6px] text-slate-400">PHARMADIST</span>
                <span>LUNAS</span>
              </div>
            </div>
            <p class="border-t border-slate-400 pt-1 font-bold text-slate-900">Finance & Billing Manager</p>
            <p class="text-[8px] text-slate-500">PT PHARMADIST INDONESIA</p>
          </div>
        </div>
      </div>
    `;
  } else if (type === "SURAT_JALAN") {
    // 3. SURAT JALAN PBF TEMPLATE
    const hasAllocations = order.batchAllocations && order.batchAllocations.length > 0;
    const allocationsHtml = hasAllocations ? order.batchAllocations.map((alloc: any, idx: number) => {
      const expStr = new Date(alloc.batch.expiryDate).toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      return `
        <tr class="border-b border-slate-200">
          <td class="border border-slate-300 px-3 py-2 text-center font-mono">${idx + 1}</td>
          <td class="border border-slate-300 px-3 py-2 font-bold text-slate-900">
            ${alloc.orderItem?.product?.name || order.items[idx]?.product?.name || "Obat"}
          </td>
          <td class="border border-slate-300 px-3 py-2 font-mono font-bold text-slate-800 text-center">${alloc.batch.batchNumber}</td>
          <td class="border border-slate-300 px-3 py-2 font-mono text-center">${expStr}</td>
          <td class="border border-slate-300 px-3 py-2 text-center font-bold">${alloc.quantity}</td>
          <td class="border border-slate-300 px-3 py-2 text-center uppercase font-bold text-[9px]">${alloc.orderItem?.product?.unit || order.items[idx]?.product?.unit || "BOX"}</td>
          <td class="border border-slate-300 px-3 py-2 text-center text-emerald-600 font-bold text-[9px]">Lolos Uji CDOB</td>
        </tr>
      `;
    }).join("") : order.items.map((item: any, idx: number) => {
      const mockBatchNo = `BCH-2026-${String(idx + 1).padStart(3, "0")}`;
      const mockExp = new Date("2028-12-31").toLocaleDateString("id-ID", { month: "short", year: "numeric" });
      return `
        <tr class="border-b border-slate-200">
          <td class="border border-slate-300 px-3 py-2 text-center font-mono">${idx + 1}</td>
          <td class="border border-slate-300 px-3 py-2 font-bold text-slate-900">
            ${item.product.name}
          </td>
          <td class="border border-slate-300 px-3 py-2 font-mono font-bold text-slate-800 text-center">${mockBatchNo}</td>
          <td class="border border-slate-300 px-3 py-2 font-mono text-center">${mockExp}</td>
          <td class="border border-slate-300 px-3 py-2 text-center font-bold">${item.quantity}</td>
          <td class="border border-slate-300 px-3 py-2 text-center uppercase font-bold text-[9px]">${item.product.unit}</td>
          <td class="border border-slate-300 px-3 py-2 text-center text-emerald-600 font-bold text-[9px]">Lolos Uji CDOB (Seeded)</td>
        </tr>
      `;
    }).join("");

    documentHtml = `
      <div class="document-container">
        <!-- Letterhead (PBF PharmaDist) -->
        <div class="letterhead flex justify-between items-start border-b-2 border-primary pb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary text-white flex items-center justify-center font-heading font-extrabold text-xl rounded-xl">P</div>
            <div>
              <h1 class="font-heading font-extrabold text-sm text-slate-900">PT PHARMADIST INDONESIA</h1>
              <p class="text-[9px] text-slate-500 font-medium">Distributor & Pedagang Besar Farmasi (PBF) Resmi</p>
              <p class="text-[8px] text-slate-400 mt-0.5">Izin PBF: 91201083921820003 | Sertifikat CDOB: 420/CDOB/BPOM/2026</p>
            </div>
          </div>
          <div class="text-right">
            <h2 class="font-heading font-extrabold text-base text-primary uppercase">SURAT JALAN PENGIRIMAN</h2>
            <p class="text-[9px] text-slate-500 font-mono mt-1">No. Surat Jalan: SJ-${order.orderNumber}</p>
          </div>
        </div>

        <!-- Meta Grid -->
        <div class="grid grid-cols-2 gap-6 my-5 text-[10px] text-slate-700 leading-relaxed">
          <div class="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p class="text-slate-400 uppercase text-[8px] font-bold tracking-wider">Alamat Kirim & Penerima:</p>
            <p class="font-bold text-slate-900 mt-1">${order.institution.name}</p>
            <p>${addr}</p>
            <p class="font-bold mt-1 text-[9px] font-mono">No. SIA: ${order.institution.siaNumber}</p>
          </div>
          <div class="bg-slate-50 rounded-xl p-3 border border-slate-200 grid grid-cols-2 gap-y-1">
            <div class="text-slate-400">Referensi Surat Pesanan:</div>
            <div class="font-mono font-bold text-slate-900">${order.orderNumber}</div>
            <div class="text-slate-400">Tanggal Pengiriman:</div>
            <div class="font-bold">${approvedDate}</div>
            <div class="text-slate-400">Kurir Logistik:</div>
            <div class="font-bold uppercase text-[9px] text-slate-800">Standard PBF Cold-Chain Courier</div>
            <div class="text-slate-400">Nomor Pelacakan:</div>
            <div class="font-mono font-bold text-slate-900">${order.trackingNumber || "TRK-LOG-PBF-REG"}</div>
          </div>
        </div>

        <!-- Body Message -->
        <p class="text-[10px] text-slate-700 leading-relaxed my-3">
          Mohon diterima dengan baik obat-obatan yang kami kirimkan dengan rincian batch dan tanggal kedaluwarsa (ED) berikut:
        </p>

        <!-- Product Table with Batches -->
        <table class="w-full text-[10px] border-collapse border border-slate-300 my-4">
          <thead>
            <tr class="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
              <th class="border border-slate-300 px-3 py-2 text-left w-8">No</th>
              <th class="border border-slate-300 px-3 py-2 text-left">Nama Sediaan Obat</th>
              <th class="border border-slate-300 px-3 py-2 text-center w-28">Nomor Batch</th>
              <th class="border border-slate-300 px-3 py-2 text-center w-24">Jatuh Tempo ED</th>
              <th class="border border-slate-300 px-3 py-2 text-center w-16">Jumlah</th>
              <th class="border border-slate-300 px-3 py-2 text-center w-16">Satuan</th>
              <th class="border border-slate-300 px-3 py-2 text-center w-24">Kondisi Fisik</th>
            </tr>
          </thead>
          <tbody>
            ${allocationsHtml}
          </tbody>
        </table>

        <!-- CDOB Rantai Dingin & Suhu Disclaimer -->
        <div class="bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-[9px] text-slate-600 leading-relaxed my-4">
          <strong>Peringatan Penting Penerimaan CDOB (BPOM RI):</strong><br/>
          Harap lakukan verifikasi nomor batch, tanggal kedaluwarsa, dan kondisi fisik sediaan saat menerima barang. Untuk sediaan rantai dingin (*Cold Chain Product*), segera pindahkan obat ke dalam ruang penyimpanan/kulkas bersuhu 2°C - 8°C dan catat suhu penerimaan pada kartu suhu sarana untuk memenuhi kepatuhan CDOB.
        </div>

        <!-- Three Signatures Section -->
        <div class="grid grid-cols-3 gap-4 text-center mt-12 text-[9px] text-slate-800">
          <div>
            <p class="text-slate-400 uppercase text-[8px] tracking-wider mb-8">1. Yang Menyerahkan (Logistik PBF),</p>
            <div class="h-10"></div>
            <p class="border-t border-slate-400 pt-1 font-bold text-slate-900">PBF Logistics Officer</p>
          </div>
          <div>
            <p class="text-slate-400 uppercase text-[8px] tracking-wider mb-8">2. Yang Mengantar (Kurir),</p>
            <div class="h-10"></div>
            <p class="border-t border-slate-400 pt-1 font-bold text-slate-900">Courier Driver</p>
          </div>
          <div>
            <p class="text-slate-400 uppercase text-[8px] tracking-wider mb-8">3. Yang Menerima (APJ Sarana),</p>
            <div class="h-10"></div>
            <p class="border-t border-slate-400 pt-1 font-bold text-slate-900">${order.createdBy.name}</p>
            <p class="text-[8px] text-slate-500 leading-none mt-0.5">SIPA: ${order.createdBy.sipaNumber || "-"}</p>
            <p class="text-[7px] text-slate-400 italic">( Tanda Tangan & Stempel Apotek )</p>
          </div>
        </div>
      </div>
    `;
  }

  // Write content, load styling, and print!
  w.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8" />
      <title>${type} - ${order.orderNumber}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                primary: "#006c49",
              },
              fontFamily: {
                sans: ["Inter", "sans-serif"],
                heading: ["Outfit", "sans-serif"],
              }
            }
          }
        }
      </script>
      <style>
        body {
          background-color: #f8fafc;
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .document-container {
          background-color: #ffffff;
          max-width: 800px;
          margin: 40px auto;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          position: relative;
        }
        @media print {
          body {
            background-color: #ffffff;
          }
          .document-container {
            border: none;
            box-shadow: none;
            margin: 0;
            padding: 0;
            max-width: 100%;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      </style>
    </head>
    <body class="py-8">
      ${documentHtml}
      <script>
        window.addEventListener("load", () => {
          setTimeout(() => {
            window.print();
          }, 600);
        });
      </script>
    </body>
    </html>
  `);
  w.document.close();
}
