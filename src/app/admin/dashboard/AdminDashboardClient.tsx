"use client";

import { useState, useEffect } from "react";
import { logout } from "@/app/actions/auth";
import {
  activatePartner,
  updatePartnerLimit,
  rejectPartner,
  suspendPartner,
  deletePartner,
} from "@/app/actions/partnership";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  addBatch,
  deleteBatch,
} from "@/app/actions/products";
import {
  approveOrderCDOB,
  rejectOrder,
  shipOrder,
  verifyPayment,
  deleteOrder,
} from "@/app/actions/orders";
import { useRouter } from "next/navigation";
import {
  Users,
  Pill,
  CheckSquare,
  Package,
  CreditCard,
  LogOut,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  Eye,
  FileText,
  Upload,
  Info,
  ScanLine,
} from "lucide-react";

import dynamic from "next/dynamic";

import AdminSidebar from "./components/AdminSidebar";
import AdminTopBar from "./components/AdminTopBar";

const OverviewTab = dynamic(() => import("./components/OverviewTab"), { ssr: false });
const PartnershipTab = dynamic(() => import("./components/PartnershipTab"), { ssr: false });
const InventoryTab = dynamic(() => import("./components/InventoryTab"), { ssr: false });
const OrderApprovalsTab = dynamic(() => import("./components/OrderApprovalsTab"), { ssr: false });
const LogisticsTab = dynamic(() => import("./components/LogisticsTab"), { ssr: false });
const FinanceTab = dynamic(() => import("./components/FinanceTab"), { ssr: false });
const OrderHistoryTab = dynamic(() => import("./components/OrderHistoryTab"), { ssr: false });
const ReportTab = dynamic(() => import("./components/ReportTab"), { ssr: false });


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
  imageUrl: string | null;
  batches: Batch[];
  totalStock: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  sipaNumber: string | null;
  sipaExpiry: Date | null;
}

interface Partner {
  id: string;
  name: string;
  type: string;
  siaNumber: string;
  siaExpiry: Date;
  address: string;
  creditLimit: number;
  currentDebt: number;
  topDays: number;
  isActive: boolean;
  users: User[];
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

interface Allocation {
  id: string;
  batch: {
    batchNumber: string;
    expiryDate: Date;
  };
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  spSignature: string | null;
  createdAt: Date;
  approvedAt: Date | null;
  shippingAddress: string;
  trackingNumber: string | null;
  shippingDate: Date | null;
  paymentProofUrl: string | null;
  paymentStatus: string;
  paymentMethod: string;
  rejectionReason: string | null;
  institution: {
    name: string;
    address: string;
    siaNumber: string;
    siaExpiry: Date;
  };
  createdBy: {
    name: string;
    sipaNumber: string | null;
    sipaExpiry: Date | null;
  };
  items: OrderItem[];
  batchAllocations: Allocation[];
}

const categoryDescriptions: Record<string, string> = {
  "Analgesik & Antipiretik": "Pereda nyeri ringan-sedang & penurun demam (Contoh: Paracetamol).",
  "Antibiotik": "Pembasmi infeksi akibat bakteri. Harus dengan resep dokter & validasi APJ (Contoh: Amoxicillin).",
  "Analgesik & Anti-inflamasi": "Pereda nyeri sekaligus mengatasi peradangan/pembengkakan (Contoh: Ibuprofen).",
  "Antihistamin": "Obat pereda gejala alergi seperti gatal, bersin-bersin, dan pilek alergi (Contoh: Cetirizine).",
  "Obat Batuk & Pilek": "Meredakan gejala batuk kering/berdahak, flu, hidung tersumbat (Contoh: Ambroxol).",
  "Obat Pencernaan": "Mengatasi maag, kembung, diare, mual muntah, atau sembelit (Contoh: Antasida, Loperamide).",
  "Obat Kardiovaskular": "Obat jantung, pengontrol tekanan darah tinggi/hipertensi (Contoh: Amlodipine).",
  "Obat Antidiabetes": "Penurun kadar glukosa/gula darah untuk penderita diabetes (Contoh: Metformin).",
  "Multivitamin & Suplemen": "Vitamin, suplemen makanan, peningkat daya tahan tubuh (Contoh: Vitamin C, Zink).",
  "Obat Kulit": "Salep, krim, atau gel luar untuk infeksi kulit jamur/bakteri (Contoh: Ketoconazole)."
};

export default function AdminDashboardClient({
  adminName,
  initialPartners,
  initialProducts,
  initialOrders,
}: {
  adminName: string;
  initialPartners: any[];
  initialProducts: any[];
  initialOrders: any[];
}) {
  const router = useRouter();
  const [partners] = useState<Partner[]>(initialPartners);
  const [products] = useState<Product[]>(initialProducts);
  const [orders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<"overview" | "kemitraan" | "obat" | "cdob" | "logistik" | "pembayaran" | "riwayat" | "pelaporan">("overview");

  // Restore active tab on mount to prevent hydration mismatch while preserving state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_active_tab");
      if (saved) {
        setActiveTab(saved as any);
      }
    }
  }, []);

  // Save active tab to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_active_tab", activeTab);
    }
  }, [activeTab]);

  // State Form Obat Baru
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: "",
    code: "",
    activeIngredient: "",
    price: 0,
    category: "Analgesik & Antipiretik",
    unit: "Box",
    description: "",
    manufacturer: "Kalbe Farma",
    imageUrl: "",
  });
  const [mfgSearch, setMfgSearch] = useState("");
  const [isMfgDropdownOpen, setIsMfgDropdownOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [editMfgSearch, setEditMfgSearch] = useState("");
  const [isEditMfgDropdownOpen, setIsEditMfgDropdownOpen] = useState(false);
  const [editUnitSearch, setEditUnitSearch] = useState("");
  const [isEditUnitDropdownOpen, setIsEditUnitDropdownOpen] = useState(false);

  // State Form Batch Baru
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<Product | null>(null);
  const [newBatchData, setNewBatchData] = useState({
    batchNumber: "",
    expiryDate: "",
    stock: 100,
  });

  // State Form Edit Obat
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductData, setEditProductData] = useState({
    name: "",
    code: "",
    activeIngredient: "",
    price: 0,
    category: "Analgesik & Antipiretik",
    unit: "Box",
    description: "",
    manufacturer: "Kalbe Farma",
    imageUrl: "",
  });

  useEffect(() => {
    if (editingProduct) {
      setEditProductData({
        name: editingProduct.name,
        code: editingProduct.code,
        activeIngredient: editingProduct.activeIngredient,
        price: editingProduct.price,
        category: editingProduct.category,
        unit: editingProduct.unit,
        description: editingProduct.description || "",
        manufacturer: editingProduct.manufacturer || "Kalbe Farma",
        imageUrl: editingProduct.imageUrl || "",
      });
    }
  }, [editingProduct]);

  // State Barcode Scan Simulasi Logistik
  const [scannedItems, setScannedItems] = useState<Record<string, number>>({});
  const [activePackingOrder, setActivePackingOrder] = useState<Order | null>(null);
  const [resiInput, setResiInput] = useState("");

  const today = new Date();

  const manufacturers = [
    "Kalbe Farma",
    "Dexa Medica",
    "Kimia Farma",
    "Sido Muncul",
    "Tempo Scan Pacific",
    "Phapros",
    "Pyridam Farma",
    "Merck Tbk",
    "Indofarma",
    "Darya-Varia Laboratoria Tbk",
  ];

  const filteredMfg = manufacturers.filter((m) =>
    m.toLowerCase().includes(mfgSearch.toLowerCase())
  );

  const units = [
    "Butir",
    "Tablet",
    "Kaplet",
    "Kapsul",
    "Sachet",
    "Strip",
    "Blister",
    "Box",
    "Dus",
    "Karton",
    "Botol",
    "Tube",
    "Ampul",
    "Vial",
    "Pcs",
    "Roll",
    "Pak",
    "Set",
    "Bungkus",
    "Kaleng",
    "Jar",
    "Bag",
    "Liter",
    "mL",
    "Gram",
    "kg"
  ];

  const filteredUnits = units.filter((u) =>
    u.toLowerCase().includes(unitSearch.toLowerCase())
  );

  const filteredEditMfg = manufacturers.filter((m) =>
    m.toLowerCase().includes(editMfgSearch.toLowerCase())
  );

  const filteredEditUnits = units.filter((u) =>
    u.toLowerCase().includes(editUnitSearch.toLowerCase())
  );

  // Logout Handler
  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  // Kemitraan Action
  async function handleActivatePartner(partnerId: string, limit: number, top: number) {
    const res = await activatePartner(partnerId, limit, top);
    if (res.success) {
      alert(res.message);
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  async function handleUpdatePartner(partnerId: string, limit: number, top: number) {
    const res = await updatePartnerLimit(partnerId, limit, top);
    if (res.success) {
      alert(res.message);
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  async function handleRejectPartner(partnerId: string) {
    const res = await rejectPartner(partnerId);
    if (res.success) {
      alert(res.message);
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  async function handleSuspendPartner(partnerId: string) {
    const res = await suspendPartner(partnerId);
    if (res.success) {
      alert(res.message);
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  async function handleDeletePartner(partnerId: string) {
    const res = await deletePartner(partnerId);
    if (res.success) {
      alert(res.message);
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  // Obat Action
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    const res = await createProduct(newProductData);
    if (res.success) {
      alert("Obat baru berhasil ditambahkan.");
      setIsAddingProduct(false);
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  async function handleEditProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;
    const res = await updateProduct(editingProduct.id, editProductData);
    if (res.success) {
      alert("Produk obat berhasil diperbarui.");
      setEditingProduct(null);
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (confirm("Apakah Anda yakin ingin menghapus produk obat ini beserta seluruh batch stoknya?")) {
      const res = await deleteProduct(id);
      if (res.success) {
        alert("Obat berhasil dihapus.");
        window.location.reload();
      } else {
        alert(res.error);
      }
    }
  }

  // Batch Action
  async function handleAddBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProductForBatch) return;

    const res = await addBatch({
      productId: selectedProductForBatch.id,
      ...newBatchData,
    });

    if (res.success) {
      alert("Batch stok baru berhasil ditambahkan.");
      setSelectedProductForBatch(null);
      setNewBatchData({ batchNumber: "", expiryDate: "", stock: 100 });
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  async function handleDeleteBatch(batchId: string) {
    if (confirm("Hapus batch stok obat ini?")) {
      const res = await deleteBatch(batchId);
      if (res.success) {
        alert("Batch terhapus.");
        window.location.reload();
      } else {
        alert(res.error);
      }
    }
  }

  async function handleApproveOrder(orderId: string) {
    if (confirm("Apakah Anda sudah memeriksa dokumen SP dan memverifikasi lisensi SIPA apoteker pembeli aktif sesuai CDOB?")) {
      const res = await approveOrderCDOB(orderId);
      if (res.success) {
        alert(res.message);
        window.location.reload();
      } else {
        alert(res.error);
      }
    }
  }

  async function handleRejectOrder(orderId: string, reason: string) {
    const res = await rejectOrder(orderId, reason);
    if (res.success) {
      alert(res.message);
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  async function handleDeleteOrder(orderId: string) {
    const res = await deleteOrder(orderId);
    if (res.success) {
      alert(res.message);
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  // Logistik / Warehouse scan simulation
  function startPacking(order: Order) {
    setActivePackingOrder(order);
    setScannedItems({});
    setResiInput("");
  }

  function simulateScanItem(itemId: string, maxQty: number) {
    setScannedItems((prev) => {
      const current = prev[itemId] || 0;
      if (current >= maxQty) return prev;
      return {
        ...prev,
        [itemId]: current + 1,
      };
    });
  }

  async function handleShipOrder() {
    if (!activePackingOrder) return;
    if (!resiInput.trim()) {
      alert("Input nomor resi pengiriman kurir terlebih dahulu.");
      return;
    }

    const res = await shipOrder(activePackingOrder.id, resiInput);
    if (res.success) {
      alert(res.message);
      setActivePackingOrder(null);
      window.location.reload();
    } else {
      alert(res.error);
    }
  }

  // Payment Verification actions
  async function handleVerifyPayment(orderId: string, approve: boolean) {
    const actionText = approve ? "menyetujui" : "menolak";
    if (confirm(`Apakah Anda yakin ingin ${actionText} bukti pembayaran untuk invoice ini?`)) {
      const res = await verifyPayment(orderId, approve);
      if (res.success) {
        alert(res.message);
        window.location.reload();
      } else {
        alert(res.error);
      }
    }
  }

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen overflow-x-hidden relative">
      {/* SideNavBar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={orders.filter((o) => o.status === "PENDING_APPROVAL").length}
        pendingPaymentsCount={orders.filter((o) => o.paymentStatus === "PENDING_VERIFICATION").length}
        pendingLogisticsCount={orders.filter((o) => o.status === "PENDING_SHIPPING").length}
        pendingPartnersCount={partners.filter((p) => !p.isActive).length}
        handleLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="ml-64 min-h-screen flex flex-col">
        {/* TopNavBar */}
        <AdminTopBar
          adminName={adminName}
          pendingPartnersCount={partners.filter((p) => !p.isActive).length}
          setActiveTab={setActiveTab}
        />

        {/* Content Canvas */}
        <div className="pt-24 pb-12 px-6 max-w-[1600px] w-full mx-auto flex-1">
          {activeTab === "overview" && (
            <OverviewTab
              partners={partners}
              products={products}
              orders={orders}
              setActiveTab={setActiveTab}
              setViewingOrder={() => {
                setActiveTab("cdob");
              }}
            />
          )}

          {activeTab === "kemitraan" && (
            <PartnershipTab
              partners={partners}
              onActivatePartner={handleActivatePartner}
              onUpdatePartner={handleUpdatePartner}
              onRejectPartner={handleRejectPartner}
              onSuspendPartner={handleSuspendPartner}
              onDeletePartner={handleDeletePartner}
            />
          )}

          {activeTab === "obat" && (
            <InventoryTab
              products={products}
              today={today}
              setIsAddingProduct={setIsAddingProduct}
              setSelectedProductForBatch={setSelectedProductForBatch}
              handleDeleteProduct={handleDeleteProduct}
              handleDeleteBatch={handleDeleteBatch}
              onEditProduct={setEditingProduct}
            />
          )}

          {activeTab === "cdob" && (
            <OrderApprovalsTab
              orders={orders}
              today={today}
              onApproveOrder={handleApproveOrder}
              onRejectOrder={handleRejectOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          )}

          {activeTab === "logistik" && (
            <LogisticsTab
              orders={orders}
              activePackingOrder={activePackingOrder}
              setActivePackingOrder={setActivePackingOrder}
              scannedItems={scannedItems}
              simulateScanItem={simulateScanItem}
              resiInput={resiInput}
              setResiInput={setResiInput}
              handleShipOrder={handleShipOrder}
              startPacking={startPacking}
              onRejectOrder={handleRejectOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          )}

          {activeTab === "pembayaran" && (
            <FinanceTab
              orders={orders}
              handleVerifyPayment={handleVerifyPayment}
            />
          )}

          {activeTab === "riwayat" && (
            <OrderHistoryTab
              orders={orders}
              onRejectOrder={handleRejectOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          )}

          {activeTab === "pelaporan" && (
            <ReportTab
              products={products}
              orders={orders}
            />
          )}
        </div>
      </main>

      {/* MODAL OBAT: TAMBAH OBAT BARU */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm font-sans">
          <form
            onSubmit={handleAddProduct}
            className="relative w-full max-w-md bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="text-sm font-heading font-bold text-foreground">Tambah Produk Sediaan Obat Baru</h3>
              <button
                type="button"
                onClick={() => setIsAddingProduct(false)}
                className="text-on-surface-variant hover:text-foreground text-xs cursor-pointer font-bold"
              >
                Batal
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Nama Sediaan Obat</label>
                <input
                  type="text"
                  required
                  value={newProductData.name}
                  onChange={(e) => setNewProductData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Paracetamol 500mg Box"
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Kode SKU Obat</label>
                  <input
                    type="text"
                    required
                    value={newProductData.code}
                    onChange={(e) => setNewProductData((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="OBT-PCT-500"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Kandungan Zat Aktif</label>
                  <input
                    type="text"
                    required
                    value={newProductData.activeIngredient}
                    onChange={(e) => setNewProductData((prev) => ({ ...prev, activeIngredient: e.target.value }))}
                    placeholder="Paracetamol"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Harga Jual (IDR)</label>
                  <input
                    type="number"
                    required
                    value={newProductData.price}
                    onChange={(e) => setNewProductData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="75000"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Satuan Kemasan</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari Satuan..."
                      value={unitSearch !== "" ? unitSearch : newProductData.unit}
                      onChange={(e) => {
                        setUnitSearch(e.target.value);
                        setIsUnitDropdownOpen(true);
                        setNewProductData((prev) => ({ ...prev, unit: e.target.value }));
                      }}
                      onFocus={() => {
                        setIsUnitDropdownOpen(true);
                        setUnitSearch("");
                      }}
                      onBlur={() => {
                        setTimeout(() => setIsUnitDropdownOpen(false), 200);
                      }}
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                    />
                    <div className="absolute right-3 top-2.5 pointer-events-none text-[8px] text-outline">
                      ▼
                    </div>
                    {isUnitDropdownOpen && (
                      <ul className="absolute left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto bg-white border border-outline-variant/30 rounded-xl shadow-xl py-1 text-xs">
                        {filteredUnits.length > 0 ? (
                          filteredUnits.map((u) => (
                            <li
                              key={u}
                              onMouseDown={() => {
                                setNewProductData((prev) => ({ ...prev, unit: u }));
                                setUnitSearch(u);
                                setIsUnitDropdownOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-foreground hover:font-bold"
                            >
                              {u}
                            </li>
                          ))
                        ) : (
                          <li className="px-3 py-2 text-outline italic">Satuan tidak ditemukan</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Kategori Obat</label>
                <select
                  value={newProductData.category}
                  onChange={(e) => setNewProductData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                >
                  <option value="Analgesik &amp; Antipiretik">Analgesik &amp; Antipiretik</option>
                  <option value="Antibiotik">Antibiotik</option>
                  <option value="Analgesik &amp; Anti-inflamasi">Analgesik &amp; Anti-inflamasi</option>
                  <option value="Antihistamin">Antihistamin</option>
                  <option value="Obat Batuk &amp; Pilek">Obat Batuk &amp; Pilek</option>
                  <option value="Obat Pencernaan">Obat Pencernaan</option>
                  <option value="Obat Kardiovaskular">Obat Kardiovaskular</option>
                  <option value="Obat Antidiabetes">Obat Antidiabetes</option>
                  <option value="Multivitamin &amp; Suplemen">Multivitamin &amp; Suplemen</option>
                  <option value="Obat Kulit">Obat Kulit</option>
                </select>
                {categoryDescriptions[newProductData.category] && (
                  <p className="mt-1 text-[10px] text-primary italic leading-tight">
                    💡 Petunjuk: {categoryDescriptions[newProductData.category]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Manufaktur (Pabrikan)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari Manufaktur..."
                    value={mfgSearch !== "" ? mfgSearch : newProductData.manufacturer}
                    onChange={(e) => {
                      setMfgSearch(e.target.value);
                      setIsMfgDropdownOpen(true);
                      setNewProductData((prev) => ({ ...prev, manufacturer: e.target.value }));
                    }}
                    onFocus={() => {
                      setIsMfgDropdownOpen(true);
                      setMfgSearch("");
                    }}
                    onBlur={() => {
                      setTimeout(() => setIsMfgDropdownOpen(false), 200);
                    }}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                  />
                  <div className="absolute right-3 top-2.5 pointer-events-none text-[8px] text-outline">
                    ▼
                  </div>
                  {isMfgDropdownOpen && (
                    <ul className="absolute left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto bg-white border border-outline-variant/30 rounded-xl shadow-xl py-1 text-xs">
                      {filteredMfg.length > 0 ? (
                        filteredMfg.map((mfg) => (
                          <li
                            key={mfg}
                            onMouseDown={() => {
                              setNewProductData((prev) => ({ ...prev, manufacturer: mfg }));
                              setMfgSearch(mfg);
                              setIsMfgDropdownOpen(false);
                            }}
                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-foreground hover:font-bold"
                          >
                            {mfg}
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-2 text-outline italic">Manufaktur tidak ditemukan</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Gambar Thumbnail Produk</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setNewProductData((prev) => ({ ...prev, imageUrl: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                  />
                  {newProductData.imageUrl && (
                    <div className="w-10 h-10 rounded-xl border border-outline-variant/30 overflow-hidden shrink-0 flex items-center justify-center bg-slate-50">
                      <img src={newProductData.imageUrl} alt="Thumbnail Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Deskripsi Singkat</label>
                <textarea
                  value={newProductData.description}
                  onChange={(e) => setNewProductData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none h-16"
                  placeholder="Keterangan obat..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setIsAddingProduct(false)}
                className="flex-1 py-2 bg-surface-container-low text-on-surface-variant border border-outline-variant/30 rounded-xl font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-primary/10 transition-all"
              >
                Simpan Obat
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL OBAT: TAMBAH BATCH BARU */}
      {selectedProductForBatch && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm font-sans">
          <form
            onSubmit={handleAddBatch}
            className="relative w-full max-w-sm bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <div>
                <h3 className="text-xs font-heading font-bold text-foreground">Tambah Batch Stok</h3>
                <span className="text-[10px] text-on-surface-variant block">{selectedProductForBatch.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForBatch(null)}
                className="text-on-surface-variant hover:text-foreground text-xs cursor-pointer font-bold"
              >
                Batal
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Nomor Batch Obat</label>
                <input
                  type="text"
                  required
                  value={newBatchData.batchNumber}
                  onChange={(e) => setNewBatchData((prev) => ({ ...prev, batchNumber: e.target.value }))}
                  placeholder="Contoh: B-PCT-003"
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Tanggal Kedaluwarsa (ED)</label>
                <input
                  type="date"
                  required
                  value={newBatchData.expiryDate}
                  onChange={(e) => setNewBatchData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Stok Obat Awal</label>
                <input
                  type="number"
                  required
                  value={newBatchData.stock}
                  onChange={(e) => setNewBatchData((prev) => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setSelectedProductForBatch(null)}
                className="flex-1 py-2 bg-surface-container-low text-on-surface-variant border border-outline-variant/30 rounded-xl font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-primary/10 transition-all"
              >
                Simpan Batch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL OBAT: EDIT PRODUK OBAT */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm font-sans">
          <form
            onSubmit={handleEditProduct}
            className="relative w-full max-w-md bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="text-sm font-heading font-bold text-foreground">Edit Produk Sediaan Obat</h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-on-surface-variant hover:text-foreground text-xs cursor-pointer font-bold"
              >
                Batal
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Nama Sediaan Obat</label>
                <input
                  type="text"
                  required
                  value={editProductData.name}
                  onChange={(e) => setEditProductData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Paracetamol 500mg Box"
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Kode SKU Obat</label>
                  <input
                    type="text"
                    required
                    value={editProductData.code}
                    onChange={(e) => setEditProductData((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="OBT-PCT-500"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Kandungan Zat Aktif</label>
                  <input
                    type="text"
                    required
                    value={editProductData.activeIngredient}
                    onChange={(e) => setEditProductData((prev) => ({ ...prev, activeIngredient: e.target.value }))}
                    placeholder="Paracetamol"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Harga Jual (IDR)</label>
                  <input
                    type="number"
                    required
                    value={editProductData.price}
                    onChange={(e) => setEditProductData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="75000"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Satuan Kemasan</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari Satuan..."
                      value={editUnitSearch !== "" ? editUnitSearch : editProductData.unit}
                      onChange={(e) => {
                        setEditUnitSearch(e.target.value);
                        setIsEditUnitDropdownOpen(true);
                        setEditProductData((prev) => ({ ...prev, unit: e.target.value }));
                      }}
                      onFocus={() => {
                        setIsEditUnitDropdownOpen(true);
                        setEditUnitSearch("");
                      }}
                      onBlur={() => {
                        setTimeout(() => setIsEditUnitDropdownOpen(false), 200);
                      }}
                      className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                    />
                    <div className="absolute right-3 top-2.5 pointer-events-none text-[8px] text-outline">
                      ▼
                    </div>
                    {isEditUnitDropdownOpen && (
                      <ul className="absolute left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto bg-white border border-outline-variant/30 rounded-xl shadow-xl py-1 text-xs">
                        {filteredEditUnits.length > 0 ? (
                          filteredEditUnits.map((u) => (
                            <li
                              key={u}
                              onMouseDown={() => {
                                setEditProductData((prev) => ({ ...prev, unit: u }));
                                setEditUnitSearch(u);
                                setIsEditUnitDropdownOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-foreground hover:font-bold"
                            >
                              {u}
                            </li>
                          ))
                        ) : (
                          <li className="px-3 py-2 text-outline italic">Satuan tidak ditemukan</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Kategori Obat</label>
                <select
                  value={editProductData.category}
                  onChange={(e) => setEditProductData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                >
                  <option value="Analgesik &amp; Antipiretik">Analgesik &amp; Antipiretik</option>
                  <option value="Antibiotik">Antibiotik</option>
                  <option value="Analgesik &amp; Anti-inflamasi">Analgesik &amp; Anti-inflamasi</option>
                  <option value="Antihistamin">Antihistamin</option>
                  <option value="Obat Batuk &amp; Pilek">Obat Batuk &amp; Pilek</option>
                  <option value="Obat Pencernaan">Obat Pencernaan</option>
                  <option value="Obat Kardiovaskular">Obat Kardiovaskular</option>
                  <option value="Obat Antidiabetes">Obat Antidiabetes</option>
                  <option value="Multivitamin &amp; Suplemen">Multivitamin &amp; Suplemen</option>
                  <option value="Obat Kulit">Obat Kulit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Manufaktur (Pabrikan)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari Manufaktur..."
                    value={editMfgSearch !== "" ? editMfgSearch : editProductData.manufacturer}
                    onChange={(e) => {
                      setEditMfgSearch(e.target.value);
                      setIsEditMfgDropdownOpen(true);
                      setEditProductData((prev) => ({ ...prev, manufacturer: e.target.value }));
                    }}
                    onFocus={() => {
                      setIsEditMfgDropdownOpen(true);
                      setEditMfgSearch("");
                    }}
                    onBlur={() => {
                      setTimeout(() => setIsEditMfgDropdownOpen(false), 200);
                    }}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                  />
                  <div className="absolute right-3 top-2.5 pointer-events-none text-[8px] text-outline">
                    ▼
                  </div>
                  {isEditMfgDropdownOpen && (
                    <ul className="absolute left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto bg-white border border-outline-variant/30 rounded-xl shadow-xl py-1 text-xs">
                      {filteredEditMfg.length > 0 ? (
                        filteredEditMfg.map((mfg) => (
                          <li
                            key={mfg}
                            onMouseDown={() => {
                              setEditProductData((prev) => ({ ...prev, manufacturer: mfg }));
                              setEditMfgSearch(mfg);
                              setIsEditMfgDropdownOpen(false);
                            }}
                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-foreground hover:font-bold"
                          >
                            {mfg}
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-2 text-outline italic">Manufaktur tidak ditemukan</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Gambar Thumbnail Produk</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditProductData((prev) => ({ ...prev, imageUrl: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                  />
                  {editProductData.imageUrl && (
                    <div className="w-10 h-10 rounded-xl border border-outline-variant/30 overflow-hidden shrink-0 flex items-center justify-center bg-slate-50">
                      <img src={editProductData.imageUrl} alt="Thumbnail Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-0.5">Deskripsi Singkat</label>
                <textarea
                  value={editProductData.description}
                  onChange={(e) => setEditProductData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-foreground focus:outline-none h-16"
                  placeholder="Keterangan obat..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="flex-1 py-2 bg-surface-container-low text-on-surface-variant border border-outline-variant/30 rounded-xl font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-primary/10 transition-all"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
