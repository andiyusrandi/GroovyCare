"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { checkoutOrder, confirmDelivery, uploadPaymentProof, cancelOrderByCustomer } from "@/app/actions/orders";
import { getSnapToken, handlePaymentSuccess } from "@/app/actions/payment";
import {
  ShoppingBag,
  History,
  CreditCard,
  LogOut,
  Search,
  ShoppingCart,
  Trash2,
  PenTool,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  FileText,
  Download,
  UploadCloud,
  Info,
  ChevronRight,
  ChevronDown,
  MapPin,
  Menu,
  Bell,
  HelpCircle,
  Settings,
  Plus,
  Home,
  User,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";

import dynamic from "next/dynamic";

import Sidebar from "./components/Sidebar";
import MobileBottomNav from "./components/MobileBottomNav";
import OfflineStatusBanner from "@/components/OfflineStatusBanner";
import { triggerHapticImpact } from "@/lib/mobile-haptics";
import { getBiteshipStatusMeta } from "@/lib/biteship-status";
import { getCourierMeta } from "@/lib/courier-logos";
import CourierLogoBadge from "@/components/CourierLogoBadge";
import CdobDocumentModal from "@/components/CdobDocumentModal";

const DashboardOverview = dynamic(() => import("./components/DashboardOverview"), { ssr: false });
const ProductCatalog = dynamic(() => import("./components/ProductCatalog"), { ssr: false });
const OrderDetailView = dynamic(() => import("./components/OrderDetailView"), { ssr: false });
const ReceiptReportView = dynamic(() => import("./components/ReceiptReportView"), { ssr: false });
const ProfileMobileView = dynamic(() => import("./components/ProfileMobileView"), { ssr: false });
const AddressBookView = dynamic(() => import("./components/AddressBookView"), { ssr: false });
const AddressManagerModal = dynamic(() => import("@/components/AddressManagerModal"), { ssr: false });
const AddressFormModal = dynamic(() => import("@/components/AddressFormModal"), { ssr: false });
const MobileDrawer = dynamic(() => import("./components/MobileDrawer"), { ssr: false });
const CheckoutView = dynamic(() => import("./components/CheckoutView"), { ssr: false });
const SignatureModal = dynamic(() => import("./components/SignatureModal"), { ssr: false });
const OrderStatusView = dynamic(() => import("./components/OrderStatusView"), { ssr: false });
const PurchaseHistoryView = dynamic(() => import("./components/PurchaseHistoryView"), { ssr: false });
const DocumentCenterView = dynamic(() => import("./components/DocumentCenterView"), { ssr: false });
const LegalityAndProfileView = dynamic(() => import("./components/LegalityAndProfileView"), { ssr: false });
const SettingsView = dynamic(() => import("./components/SettingsView"), { ssr: false });
import {
  DashboardOverviewSkeleton,
  ProductCatalogSkeleton,
  PurchaseHistorySkeleton,
  OrderStatusSkeleton,
} from "./components/SkeletonLoader";
import { updateMitraProfile } from "@/app/actions/mitra";
import { useMobileBrowser } from "@/hooks/useMobileBrowser";

interface Batch {
  id: string;
  batchNumber: string;
  expiryDate: string | Date;
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
  totalStock: number;
  imageUrl?: string | null;
  batches?: Batch[];
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
  status: string;
  spSignature: string | null;
  createdAt: Date;
  approvedAt: Date | null;
  shippingAddress: string;
  trackingNumber: string | null;
  shippingDate: Date | null;
  paymentProofUrl: string | null;
  paymentStatus: string;
  paymentMethod?: string;
  items: OrderItem[];
  rejectionReason: string | null;
}

interface Institution {
  id: string;
  name: string;
  type: string;
  siaNumber: string;
  siaExpiry: Date;
  address: string;
  creditLimit: number;
  currentDebt: number;
  topDays: number;
  ownerKtp: string | null;
  ownerNpwp: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  sipaNumber: string | null;
  sipaExpiry: Date | null;
}

function calculateOrderTotals(order: any) {
  const subtotal = order.items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  const vat = Math.round(subtotal * 0.11);

  const addr = order.shippingAddress || "";
  const feeMatch = addr.match(/-\s*Rp\s*([0-9.,]+)/);
  let shippingFee = 0;
  if (feeMatch && feeMatch[1]) {
    shippingFee = parseInt(feeMatch[1].replace(/[.,]/g, ""), 10) || 0;
  } else if (addr.includes("Kurir: Standard Flat Rate")) {
    const isColdChain = order.items.some((item: any) =>
      item.product?.category === "COLD_CHAIN" || item.product?.category?.toLowerCase() === "cold chain" ||
      item.product?.name?.toLowerCase().includes("insulin") || item.product?.code?.toLowerCase().includes("amx")
    );
    shippingFee = isColdChain ? 85000 : 50000;
  } else {
    shippingFee = 50000;
  }

  const total = subtotal + vat + shippingFee;
  return { subtotal, vat, shippingFee, total };
}

export default function CustomerDashboardClient({
  user,
  institution,
  initialProducts,
  initialOrders,
}: {
  user: User;
  institution: Institution;
  initialProducts: Product[];
  initialOrders: any[];
}) {
  const router = useRouter();
  const isMobileBrowser = useMobileBrowser();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<"dashboard" | "belanja" | "status" | "riwayat" | "tagihan" | "dokumen" | "legalitas" | "pengaturan" | "keranjang" | "alamat">("dashboard");
  const [isLoadingTab, setIsLoadingTab] = useState(false);

  const handleSwitchTab = (tab: any) => {
    setActiveTab(tab);
  };
  const [docSubTab, setDocSubTab] = useState<"sp" | "esign" | "do" | "faktur">("sp");
  const [legalSubTab, setLegalSubTab] = useState<"instansi" | "sipa" | "sia" | "profile">("instansi");

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedProductInfo, setAddedProductInfo] = useState<{ product: Product; quantity: number } | null>(null);
  const [biteshipStatusToast, setBiteshipStatusToast] = useState<{
    orderNumber: string;
    status: string;
    statusLabel: string;
    message: string;
    type: "shipped" | "delivered" | "info";
  } | null>(null);

  // Monitor perubahan status pesanan untuk memicu Toast Notifikasi Otomatis
  const prevOrdersRef = useRef<Order[]>(initialOrders);
  useEffect(() => {
    if (prevOrdersRef.current && prevOrdersRef.current.length > 0) {
      for (const newOrd of orders) {
        const oldOrd = prevOrdersRef.current.find((o) => o.id === newOrd.id);
        if (oldOrd) {
          // Status berubah dari bukan SHIPPED/DELIVERED menjadi SHIPPED atau DELIVERED
          if (oldOrd.status !== newOrd.status || (oldOrd as any).biteshipStatus !== (newOrd as any).biteshipStatus) {
            if (newOrd.status === "DELIVERED") {
              setBiteshipStatusToast({
                orderNumber: newOrd.orderNumber,
                status: "DELIVERED",
                statusLabel: "Paket Telah Tiba",
                message: `Pesanan ${newOrd.orderNumber} telah sukses dikirim dan diterima!`,
                type: "delivered",
              });
              break;
            } else if (newOrd.status === "SHIPPED") {
              const label = (newOrd as any).biteshipStatusLabel || "Kurir Sedang Dalam Perjalanan";
              setBiteshipStatusToast({
                orderNumber: newOrd.orderNumber,
                status: "SHIPPED",
                statusLabel: "Pesanan Dalam Pengiriman",
                message: `Pesanan ${newOrd.orderNumber}: ${label}`,
                type: "shipped",
              });
              break;
            }
          }
        }
      }
    }
    prevOrdersRef.current = orders;
  }, [orders]);

  // State Modal Checkout & e-Sign
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [tempShippingAddress, setTempShippingAddress] = useState("");
  // States untuk integrasi pengiriman real-time di keranjang mobile
  const [shippingProvince, setShippingProvince] = useState("Sulawesi Selatan");
  const [shippingRegency, setShippingRegency] = useState("Makassar");
  const [shippingDistrict, setShippingDistrict] = useState("Tamalanrea");
  const [shippingVillage, setShippingVillage] = useState("Tamalanrea");
  const [shippingPostalCode, setShippingPostalCode] = useState("90245");
  const [shippingAddressDetail, setShippingAddressDetail] = useState(institution.address || "");
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedRegencyId, setSelectedRegencyId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");

  const [provincesList, setProvincesList] = useState<{ id: string; name: string }[]>([]);
  const [regenciesList, setRegenciesList] = useState<{ id: string; name: string }[]>([]);
  const [districtsList, setDistrictsList] = useState<{ id: string; name: string }[]>([]);
  const [villagesList, setVillagesList] = useState<{ id: string; name: string }[]>([]);

  const [biteshipRates, setBiteshipRates] = useState<any[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<any | null>(null);
  const [shippingFeeMobile, setShippingFeeMobile] = useState(50000);
  const [isEditingAddressMobile, setIsEditingAddressMobile] = useState(false);
  const [isCourierSelectorOpenMobile, setIsCourierSelectorOpenMobile] = useState(false);
  const [selectedMainAddress, setSelectedMainAddress] = useState<any | null>(null);
  const [savedAddressesList, setSavedAddressesList] = useState<any[]>([]);
  const [isAddressManagerOpenMobile, setIsAddressManagerOpenMobile] = useState(false);
  const [isAddressFormOpenMobile, setIsAddressFormOpenMobile] = useState(false);
  const [addressToEditMobile, setAddressToEditMobile] = useState<any>(null);

  const fetchMainAddress = async () => {
    if (!institution?.id) return;
    try {
      const { getShippingAddresses } = await import("@/app/actions/shipping-addresses");
      const res = await getShippingAddresses(institution.id);
      if (res.success && res.addresses.length > 0) {
        setSavedAddressesList(res.addresses);
        const main = res.addresses.find((a: any) => a.isMain) || res.addresses[0];
        setSelectedMainAddress(main);
        if (main.province) setShippingProvince(main.province);
        if (main.city) setShippingRegency(main.city);
        if (main.district) setShippingDistrict(main.district);
        if (main.postalCode) setShippingPostalCode(main.postalCode);
        if (main.fullAddress) setShippingAddressDetail(main.fullAddress);
      } else {
        setSavedAddressesList([]);
        setSelectedMainAddress(null);
        setShippingProvince("");
        setShippingRegency("");
        setShippingDistrict("");
        setShippingVillage("");
        setShippingPostalCode("");
        setShippingAddressDetail("");
      }
    } catch (err) {
      console.error("Gagal sync alamat utama:", err);
    }
  };

  const [isRefreshingDataMobile, setIsRefreshingDataMobile] = useState(false);

  const refreshAllData = async () => {
    setIsRefreshingDataMobile(true);
    try {
      const { getOrders } = await import("@/app/actions/orders");
      const { getProducts } = await import("@/app/actions/products");
      const [newOrdersRes, newProductsRes] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);
      if (Array.isArray(newOrdersRes)) setOrders(newOrdersRes);
      if (Array.isArray(newProductsRes)) setProducts(newProductsRes);
      await fetchMainAddress();
      router.refresh();
    } catch (e) {
      console.error("Refresh error:", e);
    } finally {
      setTimeout(() => setIsRefreshingDataMobile(false), 500);
    }
  };

  useEffect(() => {
    fetchMainAddress();

    const handleFocus = () => {
      refreshAllData();
    };

    window.addEventListener("focus", handleFocus);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleFocus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [institution?.id]);

  // Parse and resolve consolidated/simple address from database on mount or when address changes
  useEffect(() => {
    const addr = institution.address || "";
    if (addr.includes("Kel/Desa:") || addr.includes("Kel:") || addr.includes("Provinsi:")) {
      try {
        const detailPart = addr.match(/Alamat:\s*(.*?),\s*Kel/)?.[1] || "";
        const kelPart = addr.match(/Kel(?:Desa)?:\s*(.*?),\s*Kec/)?.[1] || addr.match(/Kel\/Desa:\s*(.*?),\s*Kec/)?.[1] || "";
        const kecPart = addr.match(/Kec:\s*(.*?),\s*Kab/)?.[1] || addr.match(/Kec:\s*(.*?),\s*Kota/)?.[1] || "";
        const kabPart = addr.match(/Kab\/Kota:\s*(.*?),\s*Prov/)?.[1] || addr.match(/Kota\/Kab:\s*(.*?),\s*Prov/)?.[1] || "";
        const provPart = addr.match(/Prov(?:insi)?:\s*(.*?)(?:,\s*Kode Pos:|$)/)?.[1] || "";
        const posPart = addr.match(/Kode Pos:\s*(\d+)/)?.[1] || "";

        if (provPart) setShippingProvince(provPart.trim());
        if (kabPart) setShippingRegency(kabPart.trim());
        if (kecPart) setShippingDistrict(kecPart.trim());
        if (kelPart) setShippingVillage(kelPart.trim());
        if (posPart) setShippingPostalCode(posPart.trim());
        if (detailPart) setShippingAddressDetail(detailPart.trim());
      } catch (e) {
        setShippingAddressDetail(addr);
      }
    } else {
      // Fallback for simple address format (like in seeds: "Jakarta Selatan", "Makassar", "Bandung", "Bekasi")
      const lower = addr.toLowerCase();
      if (lower.includes("makassar")) {
        setShippingProvince("SULAWESI SELATAN");
        setShippingRegency("KOTA MAKASSAR");
        setShippingDistrict("TAMALANREA");
        setShippingVillage("TAMALANREA INDAH");
        setShippingPostalCode("90245");
        setShippingAddressDetail(addr);
      } else if (lower.includes("jakarta selatan")) {
        setShippingProvince("DKI JAKARTA");
        setShippingRegency("KOTA JAKARTA SELATAN");
        setShippingDistrict("KEBAYORAN BARU");
        setShippingVillage("SELOONG");
        setShippingPostalCode("12110");
        setShippingAddressDetail(addr);
      } else if (lower.includes("bekasi")) {
        setShippingProvince("JAWA BARAT");
        setShippingRegency("KOTA BEKASI");
        setShippingDistrict("BEKASI BARAT");
        setShippingVillage("BINTARA");
        setShippingPostalCode("17134");
        setShippingAddressDetail(addr);
      } else if (lower.includes("bandung")) {
        setShippingProvince("JAWA BARAT");
        setShippingRegency("KOTA BANDUNG");
        setShippingDistrict("COBLONG");
        setShippingVillage("SILIWANGI");
        setShippingPostalCode("40132");
        setShippingAddressDetail(addr);
      } else {
        setShippingAddressDetail(addr);
      }
    }
  }, [institution.address]);

  // Match Province Name -> Province ID
  useEffect(() => {
    if (shippingProvince && provincesList.length > 0 && !selectedProvinceId) {
      const match = provincesList.find(p => p.name.toUpperCase() === shippingProvince.toUpperCase());
      if (match) {
        setSelectedProvinceId(match.id);
      }
    }
  }, [shippingProvince, provincesList, selectedProvinceId]);

  // Match Regency Name -> Regency ID
  useEffect(() => {
    if (shippingRegency && regenciesList.length > 0 && !selectedRegencyId) {
      const cleanRegName = shippingRegency.replace(/KABUPATEN\s+|KOTA\s+/i, "").toUpperCase();
      const match = regenciesList.find(r => r.name.replace(/KABUPATEN\s+|KOTA\s+/i, "").toUpperCase() === cleanRegName);
      if (match) {
        setSelectedRegencyId(match.id);
      }
    }
  }, [shippingRegency, regenciesList, selectedRegencyId]);

  // Match District Name -> District ID
  useEffect(() => {
    if (shippingDistrict && districtsList.length > 0 && !selectedDistrictId) {
      const match = districtsList.find(d => d.name.toUpperCase() === shippingDistrict.toUpperCase());
      if (match) {
        setSelectedDistrictId(match.id);
      }
    }
  }, [shippingDistrict, districtsList, selectedDistrictId]);

  // Fetch provinces
  useEffect(() => {
    fetch("/api/wilayah?type=provinces")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setProvincesList(data);
      })
      .catch((err) => console.error("Gagal mengambil data provinsi:", err));
  }, []);

  // Fetch regencies
  useEffect(() => {
    if (!selectedProvinceId) {
      setRegenciesList([]);
      return;
    }
    fetch(`/api/wilayah?type=regencies&id=${selectedProvinceId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setRegenciesList(data);
      })
      .catch((err) => console.error("Gagal mengambil data kabupaten:", err));
  }, [selectedProvinceId]);

  // Fetch districts
  useEffect(() => {
    if (!selectedRegencyId) {
      setDistrictsList([]);
      return;
    }
    fetch(`/api/wilayah?type=districts&id=${selectedRegencyId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setDistrictsList(data);
      })
      .catch((err) => console.error("Gagal mengambil data kecamatan:", err));
  }, [selectedRegencyId]);

  // Fetch villages
  useEffect(() => {
    if (!selectedDistrictId) {
      setVillagesList([]);
      return;
    }
    fetch(`/api/wilayah?type=villages&id=${selectedDistrictId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setVillagesList(data);
      })
      .catch((err) => console.error("Gagal mengambil data kelurahan:", err));
  }, [selectedDistrictId]);

  // Fetch postcode automatically
  useEffect(() => {
    if (!shippingVillage || !shippingDistrict) return;
    const cleanRegency = shippingRegency.replace(/KABUPATEN\s+|KOTA\s+/i, "").trim();
    const query = `${shippingVillage} ${shippingDistrict} ${cleanRegency}`;
    fetch(`/api/wilayah?type=postcode&q=${encodeURIComponent(query)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        if (resData && resData.data && resData.data.length > 0) {
          const match = resData.data.find((item: any) =>
            item.village.toLowerCase().includes(shippingVillage.toLowerCase()) ||
            shippingVillage.toLowerCase().includes(item.village.toLowerCase())
          ) || resData.data[0];
          if (match && match.code) {
            setShippingPostalCode(match.code.toString());
          }
        }
      })
      .catch((err) => console.error("Gagal mencocokkan kode pos:", err));
  }, [shippingVillage, shippingDistrict, shippingRegency]);

  // Fetch Biteship rates in Customer Dashboard
  useEffect(() => {
    const isColdChain = cart.some(it =>
      it.product?.name?.toLowerCase().includes("insulin") ||
      it.product?.code?.toLowerCase().includes("amx") ||
      it.product?.category?.toLowerCase().includes("cold chain")
    );

    setIsLoadingRates(true);
    setRatesError(null);
    const totalWeight = Math.max(1000, cart.reduce((acc, item) => acc + item.quantity * 50, 0));

    const destProv = shippingProvince.trim() || selectedMainAddress?.province || "Sulawesi Selatan";
    const destCity = shippingRegency.trim() || selectedMainAddress?.city || "Kota Makassar";
    const destDist = shippingDistrict.trim() || selectedMainAddress?.district || "Tamalanrea";

    fetch("/api/biteship/rates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destination_province: destProv,
        destination_city: destCity,
        destination_district: destDist,
        weight: totalWeight,
      }),
    })
      .then(async (res) => {
        const isJson = res.headers.get("content-type")?.includes("application/json");
        const data = isJson ? await res.json() : null;
        if (!res.ok) throw new Error(data?.error || "Gagal mengambil tarif pengiriman");
        return data;
      })
      .then((data) => {
        if (data && data.success && data.pricing && data.pricing.length > 0) {
          setBiteshipRates(data.pricing);
          const firstRate = data.pricing[0];
          setSelectedRate(firstRate);
          setShippingFeeMobile(firstRate.price);
        } else {
          setBiteshipRates([]);
          setSelectedRate(null);
          setShippingFeeMobile(isColdChain ? 85000 : 50000);
        }
      })
      .catch((err) => {
        console.error("Rates fetch error:", err);
        setRatesError(err.message || "Layanan pengiriman sedang dalam pemeliharaan (Maintenance)");
        setBiteshipRates([]);
        setSelectedRate(null);
        setShippingFeeMobile(isColdChain ? 85000 : 50000);
      })
      .finally(() => {
        setIsLoadingRates(false);
      });
  }, [shippingProvince, shippingRegency, shippingDistrict, selectedMainAddress, cart]);

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"VA" | "TOP" | "COD">("VA");
  const [isVaModalOpen, setIsVaModalOpen] = useState(false);

  // State Pembatalan Pesanan oleh Mitra
  const [cancelingOrder, setCancelingOrder] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  async function handleCancelOrder() {
    if (!cancelingOrder) return;
    setIsSubmittingCancel(true);
    try {
      const res = await cancelOrderByCustomer(cancelingOrder.id, cancelReason);
      if (res.success) {
        alert(res.message);
        setCancelingOrder(null);
        setCancelReason("");
        if (viewingDetailOrder && viewingDetailOrder.id === cancelingOrder.id) {
          setViewingDetailOrder(null);
        }
        router.refresh();
      } else {
        alert(res.error || "Gagal membatalkan pesanan");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + (err.message || err));
    } finally {
      setIsSubmittingCancel(false);
    }
  }

  const handleDownloadFakturBlob = async (fakturOrder: any) => {
    if (!fakturOrder) return;
    try {
      if (typeof window !== "undefined" && !(window as any).html2pdf) {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        document.head.appendChild(script);
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      const modalElem = document.querySelector(".printable-document") as HTMLElement;
      if (!modalElem) {
        window.print();
        return;
      }

      const opt = {
        margin: [8, 8, 8, 8],
        filename: `FAKTUR_INVOICE_${fakturOrder.orderNumber}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await (window as any).html2pdf().set(opt).from(modalElem).save();
    } catch (err) {
      console.warn("Falling back to print:", err);
      window.print();
    }
  };

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined" && user?.id) {
      const seen = localStorage.getItem(`has_seen_onboarding_${user.id}`);
      if (!seen) {
        setShowOnboarding(true);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (addedProductInfo) {
      const timer = setTimeout(() => {
        setAddedProductInfo(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [addedProductInfo]);

  useEffect(() => {
    if (biteshipStatusToast) {
      const timer = setTimeout(() => {
        setBiteshipStatusToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [biteshipStatusToast]);

  const [isCustomerNotifOpen, setIsCustomerNotifOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);

  // Pull to Refresh Mobile Logic
  const touchStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.innerWidth >= 768) return;
    if (window.scrollY === 0 && !isRefreshing) {
      const target = e.target as HTMLElement;
      if (
        target.closest(".overflow-y-auto") ||
        target.closest(".signature-pad") ||
        target.closest("canvas") ||
        target.closest(".modal-container")
      ) {
        return;
      }
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      const distance = Math.min(100, diff * 0.4);
      setPullDistance(distance);
      if (diff > 10 && e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling || isRefreshing) return;
    setIsPulling(false);
    if (pullDistance > 65) {
      setIsRefreshing(true);
      setPullDistance(70);
      router.refresh();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1500);
    } else {
      setPullDistance(0);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("read_notification_ids");
      if (saved) {
        setReadNotifIds(JSON.parse(saved));
      }
    }
  }, []);

  const handleMarkAsRead = (id: string) => {
    const next = [...readNotifIds, id];
    setReadNotifIds(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("read_notification_ids", JSON.stringify(next));
    }
  };

  // State Modal Pembayaran & Bukti
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // State Modal e-Faktur
  const [viewingFaktur, setViewingFaktur] = useState<Order | null>(null);
  const [viewingDetailOrder, setViewingDetailOrder] = useState<Order | null>(null);
  const [viewingReceiptReport, setViewingReceiptReport] = useState<Order | null>(null);

  const today = new Date();
  const siaExpiryDate = new Date(institution.siaExpiry);
  const sipaExpiryDate = user.sipaExpiry ? new Date(user.sipaExpiry) : today;

  const daysSia = Math.ceil((siaExpiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const daysSipa = user.sipaExpiry
    ? Math.ceil((sipaExpiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const isSiaExpired = daysSia <= 0 && siaExpiryDate.getFullYear() < 2090;
  const isSipaExpired = user.sipaExpiry ? daysSipa <= 0 : true;
  const hasCdobWarning = isSiaExpired || isSipaExpired;

  const siaWarning = daysSia > 0 && daysSia <= 60 && siaExpiryDate.getFullYear() < 2090;
  const sipaWarning = user.sipaExpiry ? (daysSipa > 0 && daysSipa <= 60) : false;



  const isProfileComplete =
    !!institution.ownerKtp &&
    !!institution.ownerNpwp &&
    !!institution.siaNumber &&
    !!user.sipaNumber;

  function addToCartWithQty(product: Product, qty: number) {
    if (!isProfileComplete) {
      alert("Pemesanan diblokir. Harap lengkapi profil Mitra (KTP Pemilik, NPWP Pemilik, SIA, dan SIPA) terlebih dahulu di menu Pengaturan > Profil Apotek.");
      setActiveTab("pengaturan");
      return;
    }
    if (product.totalStock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + qty, product.totalStock);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    setAddedProductInfo({ product, quantity: qty });
  }

  // Auto scroll to top when changing tab
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  function addToCart(product: Product) {
    if (!isProfileComplete) {
      alert("Pemesanan diblokir. Harap lengkapi profil Mitra (KTP Pemilik, NPWP Pemilik, SIA, dan SIPA) terlebih dahulu di menu Pengaturan > Profil Apotek.");
      setActiveTab("pengaturan");
      return;
    }
    if (product.totalStock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + 1, product.totalStock);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  function updateQty(productId: string, val: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = Math.max(1, Math.min(val, item.product.totalStock));
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  }

  // e-Sign Canvas Drawing Logic
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isDrawingModalOpen) {
      const activeCanvas = activeCanvasRef.current || canvasRef.current;
      if (activeCanvas) {
        const ctx = activeCanvas.getContext("2d");
        if (ctx) {
          ctx.strokeStyle = "#00422b";
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
        }
      }
    }
  }, [isDrawingModalOpen]);

  function getCanvasCoordinates(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = (e as React.MouseEvent<HTMLCanvasElement>).clientX;
      clientY = (e as React.MouseEvent<HTMLCanvasElement>).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = (e.currentTarget as HTMLCanvasElement) || canvasRef.current;
    if (!canvas) return;

    canvasRef.current = canvas;
    activeCanvasRef.current = canvas;

    setIsDrawing(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#00422b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const { x, y } = getCanvasCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = (e.currentTarget as HTMLCanvasElement) || activeCanvasRef.current || canvasRef.current;
    if (!canvas) return;

    if ("touches" in e && e.cancelable) {
      e.preventDefault();
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearSignature() {
    const canvases = document.querySelectorAll<HTMLCanvasElement>(".signature-canvas");
    canvases.forEach((canvas) => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    setHasSigned(false);
    setSignatureDataUrl("");
  }

  async function handleCheckout(shippingAddress: string) {
    if (!hasSigned || !signatureDataUrl) {
      setCheckoutError("Tanda tangan Surat Pesanan digital wajib dibubuhkan.");
      return;
    }

    setTempShippingAddress(shippingAddress);
    await executeCheckout(shippingAddress);
  }

  // Action direct trigger payment untuk pesanan VA belum lunas
  async function handleMidtransPay(order: any) {
    setIsSubmittingOrder(true);
    try {
      const payRes = await getSnapToken(order.id);
      setIsSubmittingOrder(false);
      if (payRes.success && payRes.token) {
        if ((window as any).snap) {
          (window as any).snap.pay(payRes.token, {
            onSuccess: async function () {
              alert("Pembayaran berhasil!");
              await handlePaymentSuccess(order.id);
              router.refresh();
            },
            onPending: function () {
              alert("Pembayaran tertunda, silakan selesaikan pembayaran Anda.");
              router.refresh();
            },
            onError: function () {
              alert("Pembayaran gagal!");
              router.refresh();
            },
            onClose: function () {
              console.log("Customer closed the payment popup");
            }
          });
        } else {
          alert("Pustaka Snap Midtrans belum termuat. Silakan muat ulang halaman.");
        }
      } else {
        alert("Gagal memproses pembayaran: " + payRes.error);
      }
    } catch (payErr: any) {
      setIsSubmittingOrder(false);
      alert("Error saat memicu pembayaran: " + payErr.message);
    }
  }

  async function executeCheckout(shippingAddress?: string) {
    setCheckoutError(null);
    setIsSubmittingOrder(true);

    try {
      const items = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const finalAddress = shippingAddress || tempShippingAddress || institution.address;

      const res = await checkoutOrder(items, signatureDataUrl, paymentMethod, finalAddress);
      setIsSubmittingOrder(false);

      if (!res.success) {
        setCheckoutError(res.error || "Gagal membuat pesanan");
      } else {
        setCart([]);
        setIsVaModalOpen(false);
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        setActiveTab("riwayat");

        if (paymentMethod === "VA" && res.orderId) {
          setIsSubmittingOrder(true);
          try {
            const payRes = await getSnapToken(res.orderId);
            setIsSubmittingOrder(false);
            if (payRes.success && payRes.token) {
              if ((window as any).snap) {
                (window as any).snap.pay(payRes.token, {
                  onSuccess: async function () {
                    alert("Pembayaran berhasil!");
                    if (res.orderId) {
                      await handlePaymentSuccess(res.orderId);
                    }
                    router.refresh();
                  },
                  onPending: function () {
                    alert("Pembayaran tertunda, silakan selesaikan pembayaran Anda.");
                    router.refresh();
                  },
                  onError: function () {
                    alert("Pembayaran gagal!");
                    router.refresh();
                  },
                  onClose: function () {
                    console.log("Customer closed the payment popup");
                  }
                });
              } else {
                alert("Pustaka Snap Midtrans belum termuat. Silakan coba bayar dari menu Histori Transaksi.");
                router.refresh();
              }
            } else {
              alert("Gagal memproses pembayaran: " + payRes.error);
              router.refresh();
            }
          } catch (payErr: any) {
            setIsSubmittingOrder(false);
            alert("Error saat memicu pembayaran: " + payErr.message);
            router.refresh();
          }
        } else {
          router.refresh();
        }
      }
    } catch (e: any) {
      setIsSubmittingOrder(false);
      setCheckoutError("Terjadi error saat mengirim checkout: " + e.message);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  async function handleConfirmDelivery(orderId: string) {
    if (confirm("Apakah Anda yakin telah menerima obat-obat ini dengan kondisi baik sesuai CDOB?")) {
      const res = await confirmDelivery(orderId);
      if (res.success) {
        alert(res.message);
        window.location.reload();
      } else {
        alert(res.error);
      }
    }
  }

  async function handleUploadPaymentProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedOrderForPayment) return;

    setUploadingPayment(true);
    setPaymentError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      const res = await uploadPaymentProof(selectedOrderForPayment.id, base64Data);
      setUploadingPayment(false);

      if (res.success) {
        alert(res.message);
        setSelectedOrderForPayment(null);
        window.location.reload();
      } else {
        setPaymentError(res.error || "Gagal mengunggah bukti");
      }
    };
    reader.onerror = () => {
      setUploadingPayment(false);
      setPaymentError("Gagal membaca berkas gambar.");
    };
    reader.readAsDataURL(file);
  }

  // Penjumlahan tagihan belum lunas (hanya untuk TOP)
  const unpaidOrders = orders.filter((o) => o.paymentStatus !== "PAID" && o.status !== "REJECTED" && (o.paymentMethod === "TOP"));
  const totalUnpaidAmount = unpaidOrders.reduce((sum, o) => {
    return sum + calculateOrderTotals(o).total;
  }, 0);

  // Status Limit penilaian
  const limitUsageRatio = institution.creditLimit > 0 ? institution.currentDebt / institution.creditLimit : 0;
  const limitStatusLabel = limitUsageRatio > 0.8 ? "Kritis" : limitUsageRatio > 0.5 ? "Cukup" : "Sangat Baik";

  // Generate dynamic customer notifications based on orders and credit limit updates
  const notifications: {
    id: string;
    title: string;
    description: string;
    type: "success" | "shipping" | "error" | "info" | "payment";
    timestamp: number;
    action: () => void;
  }[] = [];

  if (institution.creditLimit > 0) {
    notifications.push({
      id: "credit-limit",
      title: "Limit Kredit Aktif",
      description: `Limit kredit Anda aktif sebesar Rp ${institution.creditLimit.toLocaleString("id-ID")} dengan tenor ${institution.topDays} hari.`,
      type: "info",
      timestamp: new Date(institution.siaExpiry).getTime() - 365 * 24 * 60 * 60 * 1000,
      action: () => setActiveTab("dashboard")
    });
  }

  orders.forEach((o) => {
    const time = new Date(o.approvedAt || o.createdAt).getTime();
    if (o.status === "PENDING_SHIPPING") {
      notifications.push({
        id: `order-approved-${o.id}`,
        title: "Surat Pesanan Disetujui",
        description: `Pesanan ${o.orderNumber} disetujui PBF Admin. Menunggu packing logistik.`,
        type: "success",
        timestamp: time,
        action: () => {
          setViewingDetailOrder(o);
          setActiveTab("status");
        }
      });
    } else if (o.status === "SHIPPED") {
      notifications.push({
        id: `order-shipped-${o.id}`,
        title: "Pesanan Dikirim",
        description: `Pesanan ${o.orderNumber} sedang dikirim. Resi: ${o.trackingNumber || "-"}`,
        type: "shipping",
        timestamp: time,
        action: () => {
          setViewingDetailOrder(o);
          setActiveTab("status");
        }
      });
    } else if (o.status === "REJECTED") {
      notifications.push({
        id: `order-rejected-${o.id}`,
        title: "Pesanan Ditolak",
        description: `Pesanan ${o.orderNumber} ditolak. Alasan: ${o.rejectionReason || "-"}`,
        type: "error",
        timestamp: time,
        action: () => {
          setViewingDetailOrder(o);
          setActiveTab("status");
        }
      });
    }

    if (o.paymentStatus === "PAID") {
      notifications.push({
        id: `payment-verified-${o.id}`,
        title: "Pembayaran Terverifikasi",
        description: `Pembayaran transfer untuk pesanan ${o.orderNumber} telah disetujui oleh Finance PBF.`,
        type: "payment",
        timestamp: time,
        action: () => {
          setViewingDetailOrder(o);
          setActiveTab("status");
        }
      });
    }
  });

  notifications.sort((a, b) => b.timestamp - a.timestamp);
  const unreadCount = notifications.filter((n) => !readNotifIds.includes(n.id)).length;
  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);
  const pendingPaymentCount = useMemo(() => orders.filter(o => o.paymentStatus !== "PAID" && o.status !== "DELIVERED" && o.status !== "REJECTED" && (o.paymentMethod === "TOP")).length, [orders]);
  const activeOrdersCount = useMemo(() => orders.filter(o => o.status !== "DELIVERED" && o.status !== "REJECTED").length, [orders]);

  if (isMobileBrowser) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-2xl max-w-sm w-full text-center space-y-6 animate-fadeIn">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-md">
            <span className="material-symbols-outlined text-[36px] font-bold">smartphone</span>
          </div>

          <div className="space-y-2">
            <h3 className="font-heading font-extrabold text-base text-slate-900">Dashboard Dinonaktifkan</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Mitra yang terhormat, demi menjaga keamanan transaksi obat keras serta kepatuhan regulasi CDOB BPOM, akses dashboard melalui browser handphone dinonaktifkan.
            </p>
          </div>

          <div className="bg-slate-50 border border-outline-variant/20 rounded-2xl p-4 text-[10px] text-on-surface-variant leading-relaxed text-left flex gap-3">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>shield</span>
            <span>
              <strong>Keamanan Rantai Dingin:</strong> Pemantauan suhu IoT dan alokasi batch FEFO harus diakses melalui aplikasi resmi mobile atau browser desktop/laptop.
            </span>
          </div>

          <div className="pt-2">
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-950 text-white rounded-2xl hover:bg-slate-900 active:scale-[0.98] transition-all shadow-md text-left cursor-pointer mx-auto border border-slate-800"
            >
              <svg viewBox="0 0 512 512" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32.05 16.5C30.2 18.9 29.1 22.4 29.1 26.9v458.2c0 4.5 1.1 8 2.95 10.4l1.55 1.4L261.25 269v-5.25L33.6 15.1l-1.55 1.4z" fill="#00f0ff" />
                <path d="M338.45 346.5L261.25 269v-5.25L338.45 166l1.8 1c21.8 12.4 60.55 34.6 81.35 46.5 5.95 3.4 9.9 8.9 9.9 15.2 0 6.3-3.95 11.8-9.9 15.2-20.8 11.9-59.55 34.1-81.35 46.6l-1.8 1z" fill="#ffc200" />
                <path d="M263.15 266.35l-76.3-76.3L32.05 16.5c3.2-3.4 9.1-5.4 16.4-1.2l290 166.1 1.8 1-77.1 76.95z" fill="#ff3a44" />
                <path d="M263.15 271.65L340.25 348l-291.8 167c-7.3 4.2-13.2 2.2-16.4-1.2L186.85 348l76.3-76.35z" fill="#00e756" />
              </svg>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold leading-none">Get it on</p>
                <p className="text-xs font-bold font-heading leading-tight mt-0.5">Google Play</p>
              </div>
            </a>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
            <button
              onClick={() => handleLogout()}
              className="text-xs text-error font-bold hover:underline transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              Keluar Akun (Logout)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col font-sans relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Global Offline Mode Status Banner for Android */}
      <OfflineStatusBanner />
      {/* Pull to Refresh Indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="fixed left-0 right-0 flex justify-center z-50 pointer-events-none transition-all duration-150"
          style={{
            top: `${72 + Math.min(48, pullDistance)}px`,
            opacity: Math.min(1, pullDistance / 30)
          }}
        >
          <div className="bg-white border border-outline-variant/30 rounded-full py-1.5 px-3.5 shadow-lg flex items-center justify-center gap-2">
            <div
              className={`w-4 h-4 border-2 border-primary border-t-transparent rounded-full ${isRefreshing ? "animate-spin" : ""}`}
              style={!isRefreshing ? { transform: `rotate(${pullDistance * 4}deg)` } : undefined}
            />
            <span className="text-[10px] font-bold text-foreground">
              {isRefreshing ? "Menyegarkan..." : "Tarik untuk memuat ulang"}
            </span>
          </div>
        </div>
      )}
      {/* Sidebar Layout (Desktop) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleSwitchTab}
        isCheckoutOpen={isCheckoutOpen}
        setIsCheckoutOpen={setIsCheckoutOpen}
        viewingDetailOrder={viewingDetailOrder}
        setViewingDetailOrder={setViewingDetailOrder}
        institutionName={institution.name}
        handleLogout={handleLogout}
        setIsCartOpen={setIsCartOpen}
        cartItemCount={cartItemCount}
        pendingPaymentCount={pendingPaymentCount}
        activeOrdersCount={activeOrdersCount}
        docSubTab={docSubTab}
        setDocSubTab={setDocSubTab}
        esignPendingCount={orders.filter(o => o.status === "PENDING_APPROVAL" && !o.spSignature).length}
        legalSubTab={legalSubTab}
        setLegalSubTab={setLegalSubTab}
      />

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen flex flex-col pb-20 md:pb-10">
        {/* TopAppBar (Glass) */}
        {/* Modern Tokopedia / Grab / Alodokter Style Header */}
        {/* TopAppBar (Glass) */}
        {/* DESKTOP HEADER (hidden md:flex) */}
        <header className="hidden md:flex sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-outline-variant/30 px-6 h-16 items-center justify-between shadow-xs">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="font-heading font-extrabold text-base md:text-lg text-primary shrink-0">PBF Online</h2>

            {/* Desktop Search Bar */}
            {!viewingDetailOrder && activeTab !== "keranjang" && (
              <div className="flex items-center bg-surface-container-low rounded-full px-4 py-1.5 border border-outline-variant/20 max-w-md w-full focus-within:border-primary/50 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" aria-hidden="true" />
                <input
                  id="search-input-desktop"
                  autoComplete="off"
                  className="bg-transparent border-none text-xs w-full placeholder:text-slate-400 text-slate-800 outline-none font-medium"
                  placeholder="Cari obat, SKU, No. Invoice, zat aktif..."
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (activeTab !== "belanja") setActiveTab("belanja");
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop Right Actions */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={() => {
                triggerHapticImpact();
                setActiveTab("keranjang");
              }}
              className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 active:scale-95 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
              title="Keranjang Belanja"
            >
              <ShoppingBag className="w-5 h-5 text-slate-700" />
              {cart.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[8.5px] font-black leading-none border border-white animate-pulse">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  triggerHapticImpact();
                  setIsCustomerNotifOpen(!isCustomerNotifOpen);
                }}
                className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 active:scale-95 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                title="Notifikasi"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white animate-ping"></span>
                )}
              </button>

              {/* Popover Notifikasi Modern */}
              {isCustomerNotifOpen && (
                <div className="absolute top-auto right-0 mt-2 w-96 bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.16)] py-3 z-[100] animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="px-4 pb-2.5 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 tracking-tight">Notifikasi PBF</span>
                      {unreadCount > 0 && (
                        <span className="bg-emerald-500 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                          {unreadCount} Baru
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCustomerNotifOpen(false)}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors border-none cursor-pointer flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => {
                        const isUnread = !readNotifIds.includes(notif.id);
                        return (
                          <button
                            key={notif.id}
                            onClick={() => {
                              handleMarkAsRead(notif.id);
                              notif.action();
                              setIsCustomerNotifOpen(false);
                            }}
                            className={`w-full px-4 py-3.5 hover:bg-slate-50 transition-all flex gap-3 text-left items-start cursor-pointer border-none bg-transparent relative group ${isUnread ? "bg-emerald-50/30 font-medium" : ""
                              }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {notif.type === "success" && (
                                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                                  <CheckCircle className="w-4 h-4 stroke-[2.2]" />
                                </div>
                              )}
                              {notif.type === "shipping" && (
                                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                                  <Truck className="w-4 h-4 stroke-[2.2]" />
                                </div>
                              )}
                              {notif.type === "error" && (
                                <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                                  <X className="w-4 h-4 stroke-[2.2]" />
                                </div>
                              )}
                              {notif.type === "info" && (
                                <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                                  <Info className="w-4 h-4 stroke-[2.2]" />
                                </div>
                              )}
                              {notif.type === "payment" && (
                                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                                  <CreditCard className="w-4 h-4 stroke-[2.2]" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex justify-between items-center gap-2">
                                <span className={`text-xs ${isUnread ? "font-black text-slate-900" : "font-bold text-slate-700"} truncate`}>
                                  {notif.title}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                  {new Date(notif.timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                                {notif.description}
                              </p>
                            </div>

                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 self-center"></span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-8 text-center text-slate-400 text-xs font-medium space-y-1">
                        <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                        <p className="font-bold text-slate-600">Belum Ada Notifikasi</p>
                        <p className="text-[10.5px] text-slate-400">Semua pemberitahuan pesanan PBF Anda akan muncul di sini.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Pill */}
            <div
              onClick={() => {
                triggerHapticImpact();
                setActiveTab("pengaturan");
              }}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer active:scale-95 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                {institution.name.substring(0, 2).toUpperCase()}
              </div>
              <span className="font-bold text-xs text-slate-800 hidden lg:inline max-w-[120px] truncate">
                {institution.name}
              </span>
            </div>

            {/* Logout Button (Desktop) */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 active:scale-95 transition-all border border-rose-200/60 cursor-pointer font-bold text-xs shrink-0 ml-1"
              title="Keluar dari akun PBF Online"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span className="hidden lg:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* MOBILE ANDROID HEADER (flex md:hidden) */}
        <header className="flex md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] px-3 py-2.5 flex-col gap-2 transition-all">
          {/* Baris 1: Location Badge & Icons (Grab/Tokopedia style) */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {viewingDetailOrder ? (
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticImpact();
                    setViewingDetailOrder(null);
                  }}
                  className="p-1.5 hover:bg-slate-100 active:scale-95 rounded-full transition-all border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0 text-slate-700"
                >
                  <ArrowLeft className="w-5 h-5 text-emerald-700" />
                </button>
              ) : activeTab === "keranjang" ? (
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticImpact();
                    setActiveTab("belanja");
                  }}
                  className="p-1.5 hover:bg-slate-100 active:scale-95 rounded-full transition-all border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0 text-slate-700"
                >
                  <ArrowLeft className="w-5 h-5 text-emerald-700" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticImpact();
                    setIsMobileSidebarOpen(true);
                  }}
                  className="p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl transition-all border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0 text-slate-700"
                >
                  <Menu className="w-5 h-5 text-slate-800" />
                </button>
              )}

              {/* Grab / Tokopedia Delivery Location Pill Badge */}
              <div
                onClick={() => {
                  triggerHapticImpact();
                  setActiveTab("alamat");
                }}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 active:scale-98 border border-slate-200/70 px-2.5 py-1 rounded-full cursor-pointer transition-all min-w-0"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-2.5 h-2.5" />
                </div>
                <div className="flex items-center gap-1 min-w-0 text-left">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight shrink-0 hidden sm:inline">Dikirim ke:</span>
                  <p className="text-[11px] font-extrabold text-slate-800 truncate max-w-[140px] sm:max-w-[180px]">
                    {institution?.name || "Apotek Mitra PBF"}
                  </p>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
              </div>
            </div>

            {/* Action Buttons: Cart, Bell, Profile */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Shopping Cart Button */}
              <button
                type="button"
                onClick={() => {
                  triggerHapticImpact();
                  setActiveTab("keranjang");
                }}
                className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 active:scale-95 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                title="Keranjang Belanja"
              >
                <ShoppingBag className="w-5 h-5 text-slate-700" />
                {cart.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[8.5px] font-black leading-none border border-white animate-pulse">
                    {cart.length}
                  </span>
                )}
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticImpact();
                    setIsCustomerNotifOpen(!isCustomerNotifOpen);
                  }}
                  className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 active:scale-95 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                  title="Notifikasi"
                >
                  <Bell className="w-5 h-5 text-slate-700" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white animate-ping"></span>
                  )}
                </button>

                {/* Popover Notifikasi Modern */}
                {isCustomerNotifOpen && (
                  <div className="fixed top-16 right-3 left-3 bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.16)] py-3 z-[100] animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="px-4 pb-2.5 border-b border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 tracking-tight">Notifikasi PBF</span>
                        {unreadCount > 0 && (
                          <span className="bg-emerald-500 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                            {unreadCount} Baru
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsCustomerNotifOpen(false)}
                        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors border-none cursor-pointer flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => {
                          const isUnread = !readNotifIds.includes(notif.id);
                          return (
                            <button
                              key={notif.id}
                              onClick={() => {
                                handleMarkAsRead(notif.id);
                                notif.action();
                                setIsCustomerNotifOpen(false);
                              }}
                              className={`w-full px-4 py-3.5 hover:bg-slate-50 transition-all flex gap-3 text-left items-start cursor-pointer border-none bg-transparent relative group ${isUnread ? "bg-emerald-50/30 font-medium" : ""
                                }`}
                            >
                              <div className="shrink-0 mt-0.5">
                                {notif.type === "success" && (
                                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                                    <CheckCircle className="w-4 h-4 stroke-[2.2]" />
                                  </div>
                                )}
                                {notif.type === "shipping" && (
                                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                                    <Truck className="w-4 h-4 stroke-[2.2]" />
                                  </div>
                                )}
                                {notif.type === "error" && (
                                  <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                                    <X className="w-4 h-4 stroke-[2.2]" />
                                  </div>
                                )}
                                {notif.type === "info" && (
                                  <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                                    <Info className="w-4 h-4 stroke-[2.2]" />
                                  </div>
                                )}
                                {notif.type === "payment" && (
                                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                                    <CreditCard className="w-4 h-4 stroke-[2.2]" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex justify-between items-center gap-2">
                                  <span className={`text-xs ${isUnread ? "font-black text-slate-900" : "font-bold text-slate-700"} truncate`}>
                                    {notif.title}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                    {new Date(notif.timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                                  {notif.description}
                                </p>
                              </div>

                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 self-center"></span>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-8 text-center text-slate-400 text-xs font-medium space-y-1">
                          <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-600">Belum Ada Notifikasi</p>
                          <p className="text-[10.5px] text-slate-400">Semua pemberitahuan pesanan PBF Anda akan muncul di sini.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Baris 2: Search Bar Mobile */}
          {!viewingDetailOrder && activeTab !== "keranjang" && (
            <div className="w-full relative">
              <div className="flex items-center bg-slate-100/90 hover:bg-slate-100 rounded-xl px-3.5 py-2 border border-slate-200/80 focus-within:border-emerald-500/60 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" aria-hidden="true" />
                <input
                  id="search-input-mobile"
                  autoComplete="off"
                  className="bg-transparent border-none text-xs w-full placeholder:text-slate-400 text-slate-800 outline-none font-medium"
                  placeholder="Cari obat, SKU, kandungan zat aktif (e.g. Paracetamol)..."
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (activeTab !== "belanja") setActiveTab("belanja");
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Dynamic tabs render wrapper */}
        <div className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4 md:space-y-6 flex-1">
          {!isProfileComplete && (
            <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-2xl flex items-start gap-3 text-xs shadow-sm font-sans">
              <span className="material-symbols-outlined text-red-600 shrink-0 mt-0.5 animate-pulse">account_box</span>
              <div>
                <span className="font-bold block mb-1">Ingin memulai memesan? Lengkapi Profil Mitra</span>
                <p>Silakan lengkapi profil Mitra dengan **KTP Pemilik**, **NPWP Pemilik**, **SIA**, dan **SIPA** agar dapat melakukan pemesanan produk.</p>
                <button
                  type="button"
                  onClick={() => { setActiveTab("pengaturan"); }}
                  className="mt-2 font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Lengkapi Profil di Menu Pengaturan &rarr;
                </button>
              </div>
            </div>
          )}

          {hasCdobWarning && (
            <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-2xl flex items-start gap-3 text-xs shadow-sm font-sans">
              <span className="material-symbols-outlined text-red-600 shrink-0 mt-0.5 animate-pulse">dangerous</span>
              <div>
                <span className="font-bold block mb-1">Peringatan Kepatuhan CDOB BPOM (Akun Dibekukan)</span>
                {isSiaExpired && (
                  <p>Dokumen **Surat Izin Apotek (SIA)** Anda telah KEDALUWARSA pada {siaExpiryDate.toLocaleDateString("id-ID")}.</p>
                )}
                {isSipaExpired && (
                  <p className={isSiaExpired ? "mt-1" : ""}>Dokumen **SIPA Apoteker** Anda telah KEDALUWARSA pada {sipaExpiryDate?.toLocaleDateString("id-ID")}.</p>
                )}
                <p className="mt-1.5 opacity-90">Sistem memblokir sementara pembuatan Surat Pesanan (SP) baru untuk obat keras sampai dokumen diperbarui dan diverifikasi oleh Admin PBF.</p>
                <button
                  type="button"
                  onClick={() => { setActiveTab("legalitas"); setLegalSubTab("sia"); }}
                  className="mt-2 font-bold text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Unggah Dokumen Baru &rarr;
                </button>
              </div>
            </div>
          )}

          {!hasCdobWarning && (siaWarning || sipaWarning) && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex items-start gap-3 text-xs shadow-sm font-sans">
              <span className="material-symbols-outlined text-amber-600 shrink-0 mt-0.5 animate-pulse">warning</span>
              <div>
                <span className="font-bold block mb-1">Pemberitahuan Perpanjangan Legalitas (Masa Tenggang)</span>
                {siaWarning && (
                  <p>Masa berlaku **Surat Izin Apotek (SIA)** Anda akan habis dalam waktu **{daysSia} hari** ({siaExpiryDate.toLocaleDateString("id-ID")}).</p>
                )}
                {sipaWarning && (
                  <p className={siaWarning ? "mt-1" : ""}>Masa berlaku **SIPA Apoteker** Anda akan habis dalam waktu **{daysSipa} hari** ({sipaExpiryDate?.toLocaleDateString("id-ID")}).</p>
                )}
                <button
                  type="button"
                  onClick={() => { setActiveTab("legalitas"); setLegalSubTab("sia"); }}
                  className="mt-2 font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Perbarui Dokumen Legalitas Sekarang &rarr;
                </button>
              </div>
            </div>
          )}

          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20 space-y-3 font-sans">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-400 font-bold">Memuat halaman...</span>
            </div>
          }>
            {viewingReceiptReport ? (
              <ReceiptReportView
                order={viewingReceiptReport}
                onClose={() => setViewingReceiptReport(null)}
                onConfirm={(orderId) => {
                  handleConfirmDelivery(orderId);
                  setViewingReceiptReport(null);
                  setViewingDetailOrder(null);
                }}
              />
            ) : viewingDetailOrder ? (
              <OrderDetailView
                order={viewingDetailOrder}
                setViewingDetailOrder={setViewingDetailOrder}
                setViewingFaktur={setViewingFaktur}
                setCancelingOrder={setCancelingOrder}
                handleConfirmDelivery={(orderId) => {
                  setViewingReceiptReport(viewingDetailOrder);
                }}
              />
            ) : isCheckoutOpen ? (
              <CheckoutView
                cart={cart}
                cartTotal={cartTotal}
                user={user}
                institution={institution}
                today={today}
                hasSigned={hasSigned}
                signatureDataUrl={signatureDataUrl}
                setHasSigned={setHasSigned}
                setSignatureDataUrl={setSignatureDataUrl}
                setIsDrawingModalOpen={setIsDrawingModalOpen}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                checkoutError={checkoutError}
                isSubmittingOrder={isSubmittingOrder}
                handleCheckout={handleCheckout}
                setIsCheckoutOpen={setIsCheckoutOpen}
              />
            ) : isLoadingTab ? (
              activeTab === "dashboard" ? (
                <DashboardOverviewSkeleton />
              ) : activeTab === "belanja" ? (
                <ProductCatalogSkeleton />
              ) : activeTab === "riwayat" ? (
                <PurchaseHistorySkeleton />
              ) : activeTab === "status" ? (
                <OrderStatusSkeleton />
              ) : (
                <DashboardOverviewSkeleton />
              )
            ) : (
              <>
                {activeTab === "dashboard" && (
                  <DashboardOverview
                    institution={institution}
                    orders={orders}
                    setActiveTab={handleSwitchTab}
                    setViewingDetailOrder={setViewingDetailOrder}
                    setViewingFaktur={setViewingFaktur}
                    handleConfirmDelivery={handleConfirmDelivery}
                  />
                )}

                {activeTab === "belanja" && (
                  <ProductCatalog
                    products={products}
                    addToCartWithQty={addToCartWithQty}
                    hasCdobWarning={hasCdobWarning}
                    search={search}
                    setSearch={setSearch}
                  />
                )}

                {activeTab === "keranjang" && (
                  <div className="animate-fadeIn font-sans space-y-8 max-w-4xl mx-auto">

                    {/* ------------------------------------------------------------- */}
                    {/* A. DESKTOP VIEW                                               */}
                    {/* ------------------------------------------------------------- */}
                    <div className="hidden md:block bg-white border border-outline-variant/30 rounded-3xl p-8 space-y-8 shadow-sm">
                      <div className="flex items-center justify-between pb-6 border-b border-outline-variant/20">
                        <div>
                          <h2 className="font-heading font-extrabold text-lg text-primary flex items-center gap-2.5">
                            <ShoppingCart className="w-6 h-6" />
                            Keranjang Belanja Obat
                          </h2>
                          <p className="text-on-surface-variant text-[11px] mt-1">
                            Kelola daftar pesanan obat apotek Anda sebelum melakukan pengesahan Surat Pesanan (SP).
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab("belanja")}
                          className="text-xs text-primary hover:underline font-bold flex items-center gap-1.5 cursor-pointer border-none bg-transparent"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Kembali ke Katalog
                        </button>
                      </div>

                      {cart.length === 0 ? (
                        <div className="text-center py-24 space-y-4">
                          <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
                            <ShoppingCart className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-foreground">Keranjang Belanja Kosong</p>
                            <p className="text-xs text-on-surface-variant/70">Anda belum menambahkan obat apa pun ke keranjang belanja.</p>
                          </div>
                          <button
                            onClick={() => setActiveTab("belanja")}
                            className="px-5 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs shadow-md shadow-primary/10 transition-all cursor-pointer inline-block border-none"
                          >
                            Mulai Belanja Obat
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Cart Items List */}
                          <div className="divide-y divide-outline-variant/15 border border-outline-variant/20 rounded-2xl overflow-hidden bg-slate-50/20">
                            {cart.map((item) => (
                              <div
                                key={item.product.id}
                                className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs hover:bg-slate-50/50 transition-all"
                              >
                                <div className="flex gap-4 items-center">
                                  <div className="w-12 h-12 rounded-xl bg-white overflow-hidden border border-outline-variant/15 flex items-center justify-center shrink-0">
                                    <img
                                      className="w-full h-full object-cover"
                                      src={item.product.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwWGNG9klmFlTxE7qRJlM1a7CWQA41HcodSrxAo5yyi2kDDxkKfVY-ZKWSidodMppE_pXoP_mQCrcx9gRPdHjb967dBVWUoFL5AFRR5c_Jl2dQgOsaFvIFY5EDsB4KhW6Yp97g7uZJaWqjHlKz4J8OY4vHoN93-nWI0lZZOj7DhkS8ZaO6mCejJMLHI-yHbtaiqlkdO0f2skoMG2UQD7cf0ywd87rynYVJHts51V9wTivLcGooleoOrenqnrUzra16cONC2_49Y"}
                                      alt={item.product.name}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwWGNG9klmFlTxE7qRJlM1a7CWQA41HcodSrxAo5yyi2kDDxkKfVY-ZKWSidodMppE_pXoP_mQCrcx9gRPdHjb967dBVWUoFL5AFRR5c_Jl2dQgOsaFvIFY5EDsB4KhW6Yp97g7uZJaWqjHlKz4J8OY4vHoN93-nWI0lZZOj7DhkS8ZaO6mCejJMLHI-yHbtaiqlkdO0f2skoMG2UQD7cf0ywd87rynYVJHts51V9wTivLcGooleoOrenqnrUzra16cONC2_49Y";
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-foreground text-sm leading-snug">{item.product.name}</h4>
                                    <p className="text-[10px] text-outline mt-0.5">{item.product.manufacturer} | {item.product.unit}</p>
                                    <span className="text-[10px] text-primary font-mono font-bold block mt-1">
                                      Rp {item.product.price.toLocaleString("id-ID")} / Unit
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                  {/* Quantity Selector */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => updateQty(item.product.id, item.quantity - 1)}
                                      className="w-7 h-7 bg-white border border-outline-variant/30 hover:border-primary text-on-surface-variant hover:text-primary rounded-lg flex items-center justify-center font-bold text-sm transition-colors cursor-pointer border-none"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min={1}
                                      max={item.product.totalStock}
                                      value={item.quantity === undefined ? "" : item.quantity}
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        if (raw === "") {
                                          setCart((prev) =>
                                            prev.map((it) =>
                                              it.product.id === item.product.id ? { ...it, quantity: "" as any } : it
                                            )
                                          );
                                          return;
                                        }
                                        const parsedVal = parseInt(raw);
                                        const nextQty = isNaN(parsedVal) ? 1 : Math.max(1, Math.min(parsedVal, item.product.totalStock));
                                        updateQty(item.product.id, nextQty);
                                      }}
                                      onBlur={() => {
                                        if (!item.quantity || item.quantity < 1) {
                                          updateQty(item.product.id, 1);
                                        }
                                      }}
                                      className="w-10 text-center text-xs font-bold text-foreground font-mono bg-transparent border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text"
                                    />
                                    <button
                                      onClick={() => updateQty(item.product.id, item.quantity + 1)}
                                      className="w-7 h-7 bg-white border border-outline-variant/30 hover:border-primary text-on-surface-variant hover:text-primary rounded-lg flex items-center justify-center font-bold text-sm transition-colors cursor-pointer border-none"
                                    >
                                      +
                                    </button>
                                    <span className="text-[9px] text-outline font-medium ml-1">Maks {item.product.totalStock}</span>
                                  </div>

                                  {/* Total Price & Delete */}
                                  <div className="flex items-center gap-4">
                                    <div className="text-right shrink-0">
                                      <span className="text-[9px] text-outline block font-medium">Subtotal</span>
                                      <span className="font-extrabold text-foreground font-mono text-sm">
                                        Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => removeFromCart(item.product.id)}
                                      className="text-outline hover:text-error transition-colors cursor-pointer p-1.5 hover:bg-red-50 rounded-lg border-none bg-transparent"
                                      title="Hapus dari keranjang"
                                    >
                                      <Trash2 className="w-4.5 h-4.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Summary & Action Panel */}
                          <div className="bg-slate-50 border border-outline-variant/15 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="space-y-1 text-center sm:text-left">
                              <span className="text-xs text-on-surface-variant font-bold">Total Nilai Keranjang:</span>
                              <p className="font-extrabold text-xl text-primary font-mono">
                                Rp {cartTotal.toLocaleString("id-ID")}
                              </p>
                            </div>

                            <div className="flex gap-3 w-full sm:w-auto">
                              <button
                                onClick={() => setActiveTab("belanja")}
                                className="flex-1 sm:flex-initial px-6 py-3 bg-white border border-outline-variant/30 hover:border-primary text-on-surface-variant hover:text-primary font-bold rounded-xl text-xs transition-all cursor-pointer text-center border-none"
                              >
                                Tambah Obat
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isProfileComplete) {
                                    alert("Pemesanan diblokir. Harap lengkapi profil Mitra (KTP Pemilik, NPWP Pemilik, SIA, dan SIPA) terlebih dahulu di menu Pengaturan > Profil Apotek.");
                                    setActiveTab("pengaturan");
                                    return;
                                  }
                                  setIsCheckoutOpen(true);
                                  setCheckoutError(null);
                                }}
                                className="flex-1 sm:flex-initial px-8 py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-md shadow-primary/10 cursor-pointer text-center border-none"
                              >
                                Checkout &amp; e-Sign SP
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ------------------------------------------------------------- */}
                    {/* B. MOBILE VIEW (Redesigned Tokopedia / TikTok Class)          */}
                    {/* ------------------------------------------------------------- */}
                    <div className="block md:hidden space-y-4 px-1 pb-40">
                      {/* Section 1: Ringkasan Kepatuhan CDOB */}
                      <section className="animate-in fade-in slide-in-from-top duration-300">
                        {hasCdobWarning ? (
                          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                            <div className="bg-rose-600 text-white p-2 rounded-xl flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[20px]">warning</span>
                            </div>
                            <div>
                              <h3 className="font-heading font-black text-xs text-rose-950">Perizinan Apotek Bermasalah</h3>
                              <p className="text-[10.5px] text-rose-600 font-bold mt-0.5 leading-snug">SIA atau SIPA Anda telah kedaluwarsa. Mohon perbarui profil.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                            </div>
                            <div>
                              <h3 className="font-heading font-black text-xs text-emerald-950">Ringkasan Kepatuhan CDOB</h3>
                              <p className="text-[10.5px] text-emerald-700 font-bold mt-0.5 leading-snug">Semua item memenuhi syarat registrasi BPOM & Izin PBF Resmi.</p>
                            </div>
                          </div>
                        )}
                      </section>

                      {cart.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-4 shadow-2xs my-4">
                          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <ShoppingCart className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-black text-slate-900">Keranjang Belanja Kosong</p>
                            <p className="text-xs text-slate-500 font-medium">Mulai tambahkan obat resmi dari katalog PBF.</p>
                          </div>
                          <button
                            onClick={() => setActiveTab("belanja")}
                            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer inline-block border-none active:scale-95 transition-all"
                          >
                            Buka Katalog Obat
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Section 2: Alamat Pengiriman Apotek (Tokopedia Class) */}
                          <section className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 font-sans">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                              <h3 className="font-heading font-black text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                                <span className="material-symbols-outlined text-emerald-600 text-base">location_on</span>
                                Alamat Pengiriman Apotek
                              </h3>
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHapticImpact();
                                  setIsAddressManagerOpenMobile(true);
                                }}
                                className="text-emerald-700 text-xs font-black hover:underline border-none bg-transparent cursor-pointer flex items-center gap-0.5"
                              >
                                <span>Pilih Alamat</span>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                              </button>
                            </div>

                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs text-slate-700 leading-relaxed font-semibold">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <p className="font-black text-slate-900 text-xs">
                                  {selectedMainAddress ? selectedMainAddress.label : institution.name}
                                </p>
                                {selectedMainAddress?.isMain && (
                                  <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Alamat Utama
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-800 font-extrabold">
                                {selectedMainAddress ? `${selectedMainAddress.recipientName} (${selectedMainAddress.recipientPhone})` : user.name}
                              </p>
                              <p className="whitespace-pre-wrap text-[11px] text-slate-600 mt-1 leading-normal">
                                {selectedMainAddress ? selectedMainAddress.fullAddress : (tempShippingAddress || institution.address)}
                              </p>

                              <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-extrabold uppercase text-emerald-800">
                                <span>📍 {shippingDistrict || "TAMALANREA"}, {shippingRegency || "KOTA MAKASSAR"}</span>
                                <span>📮 {shippingPostalCode || "90245"}</span>
                              </div>
                            </div>
                          </section>

                          {/* Section 3: Item Pesanan */}
                          <section className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                              <h2 className="font-heading font-black text-xs uppercase tracking-wider text-slate-700">Item Pesanan ({cart.length})</h2>
                              <button
                                onClick={() => setCart([])}
                                className="text-rose-600 text-xs font-bold hover:underline border-none bg-transparent cursor-pointer"
                              >
                                Hapus Semua
                              </button>
                            </div>

                            {cart.map((item) => {
                              const isOutOfStock = item.product.totalStock <= 0;
                              const isPrescriptionRequired = item.product.name.toLowerCase().includes("amoxicillin") || item.product.name.toLowerCase().includes("diazepam") || item.product.category.toLowerCase().includes("keras") || item.product.category.toLowerCase().includes("antibiotik");

                              return (
                                <div
                                  key={item.product.id}
                                  className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs relative flex gap-3.5 items-start"
                                >
                                  {/* Product Image */}
                                  <div className="w-18 h-18 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-200/60 p-1">
                                    <img
                                      className="w-full h-full object-cover mix-blend-multiply opacity-95 rounded-lg"
                                      src={item.product.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwWGNG9klmFlTxE7qRJlM1a7CWQA41HcodSrxAo5yyi2kDDxkKfVY-ZKWSidodMppE_pXoP_mQCrcx9gRPdHjb967dBVWUoFL5AFRR5c_Jl2dQgOsaFvIFY5EDsB4KhW6Yp97g7uZJaWqjHlKz4J8OY4vHoN93-nWI0lZZOj7DhkS8ZaO6mCejJMLHI-yHbtaiqlkdO0f2skoMG2UQD7cf0ywd87rynYVJHts51V9wTivLcGooleoOrenqnrUzra16cONC2_49Y"}
                                      alt={item.product.name}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwWGNG9klmFlTxE7qRJlM1a7CWQA41HcodSrxAo5yyi2kDDxkKfVY-ZKWSidodMppE_pXoP_mQCrcx9gRPdHjb967dBVWUoFL5AFRR5c_Jl2dQgOsaFvIFY5EDsB4KhW6Yp97g7uZJaWqjHlKz4J8OY4vHoN93-nWI0lZZOj7DhkS8ZaO6mCejJMLHI-yHbtaiqlkdO0f2skoMG2UQD7cf0ywd87rynYVJHts51V9wTivLcGooleoOrenqnrUzra16cONC2_49Y";
                                      }}
                                    />
                                  </div>

                                  {/* Details */}
                                  <div className="flex-1 space-y-1.5 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="min-w-0">
                                        <h3 className="font-heading font-black text-xs leading-snug line-clamp-2 text-slate-900">{item.product.name}</h3>
                                        <div className="flex items-center gap-1.5 mt-1">
                                          <span className="text-[9.5px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md">Sediaan: {item.product.unit}</span>
                                          {isPrescriptionRequired && (
                                            <span className="text-[8.5px] text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded font-black uppercase">e-Sign CDOB</span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => removeFromCart(item.product.id)}
                                        className="text-slate-400 hover:text-rose-600 transition-colors border-none bg-transparent cursor-pointer p-1 rounded-full hover:bg-rose-50"
                                        title="Hapus item"
                                      >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                      </button>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                      <span className="font-black text-xs text-emerald-800 font-mono">
                                        Rp {item.product.price.toLocaleString("id-ID")}
                                      </span>

                                      {/* Quantity Counter Tokopedia Class */}
                                      <div className="flex items-center bg-slate-100 rounded-full p-0.5 border border-slate-200/80">
                                        <button
                                          onClick={() => updateQty(item.product.id, item.quantity - 1)}
                                          className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-slate-700 shadow-2xs active:scale-90 transition-all border border-slate-200/60 cursor-pointer font-bold text-xs"
                                        >
                                          -
                                        </button>
                                        <span className="px-2.5 font-black text-xs font-mono text-slate-900">{item.quantity.toString().padStart(2, '0')}</span>
                                        <button
                                          onClick={() => updateQty(item.product.id, item.quantity + 1)}
                                          className="w-7 h-7 flex items-center justify-center rounded-full bg-emerald-700 text-white shadow-2xs active:scale-90 transition-all border-none cursor-pointer font-bold text-xs"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </section>

                          {/* Section 4: Kurir Pengiriman */}
                          <section className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 font-sans mt-3">
                            <h3 className="font-heading font-black text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                              <span className="material-symbols-outlined text-emerald-600 text-base">local_shipping</span>
                              Metode Pengiriman / Kurir
                            </h3>

                            <div>
                              {isLoadingRates ? (
                                <div className="flex flex-col items-center justify-center py-5 space-y-1.5 bg-slate-50 rounded-xl border border-slate-200/60">
                                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-[10px] text-slate-500 font-bold">Mengambil tarif kurir real-time...</span>
                                </div>
                              ) : biteshipRates.length === 0 ? (
                                <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-center text-slate-500 text-[10.5px] font-semibold">
                                  {ratesError || "Silakan pilih alamat/wilayah di atas untuk memanggil kurir real-time."}
                                </div>
                              ) : (
                                <div
                                  onClick={() => setIsCourierSelectorOpenMobile(true)}
                                  className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98"
                                >
                                  <div className="flex items-center gap-3">
                                    <CourierLogoBadge
                                      courierCode={selectedRate?.courier_code || "groovyrx"}
                                      courierName={selectedRate?.courier_name || "Logistik Groovyrx"}
                                    />
                                    <div className="text-left">
                                      <span className="text-xs font-bold text-slate-900 block">
                                        {selectedRate ? `${selectedRate.courier_name.toUpperCase()} - ${selectedRate.courier_service_name}` : "Pilih Kurir Ekspedisi"}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                                        {selectedRate ? `Estimasi tiba: ${selectedRate.duration || `${selectedRate.shipment_duration} hari`}` : "Ketuk untuk melihat ekspedisi tersedia"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-xs font-extrabold text-emerald-800 font-mono">
                                      {selectedRate ? `Rp ${selectedRate.price.toLocaleString("id-ID")}` : "-"}
                                    </span>
                                    <span className="material-symbols-outlined text-emerald-700 text-base font-bold">chevron_right</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </section>

                          {/* Section 5: e-Sign SP */}
                          <section className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 font-sans mt-3">
                            <h3 className="font-heading font-black text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                              <span className="material-symbols-outlined text-emerald-600 text-base">draw</span>
                              e-Sign Surat Pesanan (SP)
                            </h3>

                            <div>
                              {hasSigned && signatureDataUrl ? (
                                <div
                                  onClick={() => setIsDrawingModalOpen(true)}
                                  className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                                    <div className="text-left">
                                      <span className="text-xs font-bold text-emerald-950 block">Surat Pesanan Ditandatangani</span>
                                      <span className="text-[9.5px] text-emerald-700 font-semibold block mt-0.5">Ketuk untuk meninjau / ubah tanda tangan</span>
                                    </div>
                                  </div>
                                  <div className="w-12 h-8 border border-emerald-200 bg-white rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                                    <img src={signatureDataUrl} alt="E-Sign Preview" className="max-h-full max-w-full object-contain" />
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => setIsDrawingModalOpen(true)}
                                  className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50/70 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="material-symbols-outlined text-rose-500 text-lg animate-pulse">draw</span>
                                    <div className="text-left">
                                      <span className="text-xs font-bold text-rose-950 block">Tanda Tangan Surat Pesanan (SP)</span>
                                      <span className="text-[9.5px] text-rose-600 font-semibold block mt-0.5">Dibutuhkan e-Sign basah secara digital</span>
                                    </div>
                                  </div>
                                  <span className="material-symbols-outlined text-rose-500 text-base font-bold">chevron_right</span>
                                </div>
                              )}
                            </div>
                          </section>

                          {/* Section 6: Ringkasan Harga */}
                          <section className="bg-slate-50/90 rounded-2xl p-4 space-y-3 border border-slate-200/80 font-sans mt-3">
                            <h3 className="font-heading font-black text-xs text-slate-900 uppercase tracking-wider">Ringkasan Harga</h3>
                            <div className="space-y-2 text-xs font-bold">
                              <div className="flex justify-between text-slate-600">
                                <span>Subtotal ({cart.length} item)</span>
                                <span className="font-mono text-slate-900 font-black">Rp {cartTotal.toLocaleString("id-ID")}</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>PPN (11%)</span>
                                <span className="font-mono text-slate-900 font-black">Rp {Math.round(cartTotal * 0.11).toLocaleString("id-ID")}</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Biaya Pengiriman</span>
                                <span className="text-emerald-800 font-black font-mono">Rp {shippingFeeMobile.toLocaleString("id-ID")}</span>
                              </div>
                              <hr className="border-slate-200/80 my-2" />
                              <div className="flex justify-between text-slate-900">
                                <span className="font-heading font-black text-xs uppercase tracking-wide">Total Estimasi</span>
                                <span className="font-extrabold text-base text-emerald-800 font-mono">
                                  Rp {(cartTotal + Math.round(cartTotal * 0.11) + shippingFeeMobile).toLocaleString("id-ID")}
                                </span>
                              </div>
                            </div>
                          </section>

                          <div className="flex items-start gap-2.5 p-3.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 font-sans text-slate-600">
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">info</span>
                            <p className="text-[10.5px] font-semibold leading-relaxed">
                              Harga di atas merupakan estimasi awal. Harga final akan menyesuaikan dengan kebijakan diskon batch dan ketersediaan stok fisik di gudang cabang terdekat.
                            </p>
                          </div>

                          {/* Sticky Bottom Action Bar Tokopedia Class */}
                          <div className="fixed bottom-[74px] left-3 right-3 z-40 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-3.5 shadow-xl flex items-center justify-between gap-3 font-sans">
                            <div className="flex flex-col">
                              <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">Total Pembayaran</span>
                              <span className="font-black text-base text-emerald-900 font-mono">
                                Rp {(cartTotal + Math.round(cartTotal * 0.11) + shippingFeeMobile).toLocaleString("id-ID")}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                triggerHapticImpact();
                                if (!isProfileComplete) {
                                  alert("Pemesanan diblokir. Harap lengkapi profil Mitra (KTP Pemilik, NPWP Pemilik, SIA, dan SIPA) terlebih dahulu di menu Pengaturan > Profil Apotek.");
                                  setActiveTab("pengaturan");
                                  return;
                                }
                                if (cart.length === 0) return;

                                if (!shippingProvince) {
                                  alert("Silakan lengkapi regional alamat pengiriman dan pilih kurir pengiriman terlebih dahulu.");
                                  setIsAddressManagerOpenMobile(true);
                                  return;
                                }
                                if (!hasSigned) {
                                  alert("Silakan bubuhkan tanda tangan Surat Pesanan (SP) terlebih dahulu di kolom e-Sign SP di atas.");
                                  setIsDrawingModalOpen(true);
                                  return;
                                }

                                // Save the consolidated address with selected courier info
                                const courierString = selectedRate
                                  ? ` | Kurir: ${selectedRate.courier_name.toUpperCase()} ${selectedRate.courier_service_name} [code: ${selectedRate.courier_code}:${selectedRate.courier_service_code || selectedRate.type || 'reg'}] (${selectedRate.shipment_duration} hari) - Rp ${selectedRate.price.toLocaleString("id-ID")}`
                                  : " | Kurir: Standard Flat Rate";
                                const finalAddress = `Alamat: ${shippingAddressDetail}, Kel/Desa: ${shippingVillage}, Kec: ${shippingDistrict}, Kab/Kota: ${shippingRegency}, Provinsi: ${shippingProvince}, Kode Pos: ${shippingPostalCode}${courierString}`;
                                setTempShippingAddress(finalAddress);

                                // Execute order checkout directly
                                executeCheckout(finalAddress);
                              }}
                              disabled={isSubmittingOrder || cart.length === 0}
                              className={`bg-primary text-white font-heading font-black text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-1.5 border-none cursor-pointer ${cart.length === 0 ? "opacity-50 cursor-not-allowed shadow-none" : ""
                                }`}
                            >
                              <span>{isSubmittingOrder ? "Memproses..." : "Checkout & Kirim SP"}</span>
                              <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                )}

                {activeTab === "status" && (
                  <OrderStatusView
                    orders={orders}
                    setActiveTab={setActiveTab}
                    setViewingDetailOrder={setViewingDetailOrder}
                    setCart={setCart}
                    setIsCheckoutOpen={setIsCheckoutOpen}
                    setCheckoutError={setCheckoutError}
                    handleConfirmDelivery={handleConfirmDelivery}
                    products={products}
                    setCancelingOrder={setCancelingOrder}
                  />
                )}

                {activeTab === "riwayat" && (
                  <PurchaseHistoryView
                    orders={orders}
                    setViewingDetailOrder={setViewingDetailOrder}
                    setViewingFaktur={setViewingFaktur}
                    setSelectedOrderForPayment={setSelectedOrderForPayment}
                    products={products}
                    handleMidtransPay={handleMidtransPay}
                  />
                )}

                {activeTab === "dokumen" && (
                  <DocumentCenterView
                    orders={orders}
                    subTab={docSubTab}
                    setSubTab={setDocSubTab}
                    setViewingDetailOrder={setViewingDetailOrder}
                    setViewingFaktur={setViewingFaktur}
                    setCart={setCart}
                    setIsCheckoutOpen={setIsCheckoutOpen}
                    setCheckoutError={setCheckoutError}
                    products={products}
                  />
                )}

                {activeTab === "legalitas" && (
                  <LegalityAndProfileView
                    user={user}
                    institution={institution}
                    subTab={legalSubTab}
                    setSubTab={setLegalSubTab}
                  />
                )}

                {activeTab === "pengaturan" && (
                  <>
                    <div className="hidden md:block">
                      <SettingsView user={user} institution={institution} onUpdateProfile={updateMitraProfile} />
                    </div>
                    <div className="block md:hidden">
                      <ProfileMobileView
                        user={user}
                        institution={institution}
                        handleLogout={handleLogout}
                        setActiveTab={setActiveTab}
                        setLegalSubTab={setLegalSubTab}
                      />
                    </div>
                  </>
                )}

                {/* TAB: KEUANGAN & LIMIT */}
                {activeTab === "tagihan" && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Credit Limit Card */}
                    <div className="bg-white border border-outline-variant/30 p-6 rounded-3xl space-y-4 shadow-sm">
                      <h3 className="text-base font-heading font-bold text-foreground">Fasilitas Pagu Kredit &amp; Keuangan</h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-surface-container-low p-4 border border-outline-variant/20 rounded-2xl text-xs">
                          <span className="text-[10px] text-on-surface-variant/60 block uppercase font-bold">Total Limit Kredit</span>
                          <span className="font-extrabold text-lg text-foreground font-mono block mt-1">
                            Rp {institution.creditLimit.toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div className="bg-surface-container-low p-4 border border-outline-variant/20 rounded-2xl text-xs">
                          <span className="text-[10px] text-on-surface-variant/60 block uppercase font-bold">Hutang Berjalan</span>
                          <span className="font-extrabold text-lg text-error font-mono block mt-1">
                            Rp {institution.currentDebt.toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div className="bg-surface-container-low p-4 border border-outline-variant/20 rounded-2xl text-xs">
                          <span className="text-[10px] text-on-surface-variant/60 block uppercase font-bold">Sisa Limit Tersedia</span>
                          <span className="font-extrabold text-lg text-primary font-mono block mt-1">
                            Rp {(institution.creditLimit - institution.currentDebt).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs text-on-surface-variant">
                          <span>Persentase Pemakaian Limit</span>
                          <span className="font-bold">
                            {institution.creditLimit > 0
                              ? Math.round((institution.currentDebt / institution.creditLimit) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-low rounded-full h-3.5 border border-outline-variant/20 overflow-hidden shadow-inner">
                          <div
                            className="bg-gradient-to-r from-primary to-error h-full transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                institution.creditLimit > 0
                                  ? (institution.currentDebt / institution.creditLimit) * 100
                                  : 0
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-on-surface-variant bg-surface-container-low/40 p-3 rounded-2xl border border-outline-variant/20">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          Kebijakan Pembayaran PBF: Waktu Jatuh Tempo TOP (*Term Of Payment*) diatur selama{" "}
                          <strong className="text-foreground">{institution.topDays} Hari</strong> terhitung sejak barang dikirim.
                        </span>
                      </div>
                    </div>

                    {/* Tagihan Aktif */}
                    <div className="space-y-4">
                      <h3 className="text-base font-heading font-bold text-foreground">Daftar Tagihan Belum Lunas</h3>
                      {orders.filter((o) => o.paymentStatus !== "PAID" && o.status !== "REJECTED" && (o.paymentMethod === "TOP")).length === 0 ? (
                        <div className="text-center py-8 bg-white border border-outline-variant/30 rounded-3xl text-on-surface-variant text-xs shadow-sm">
                          Tidak ada tagihan jatuh tempo saat ini.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders
                            .filter((o) => o.paymentStatus !== "PAID" && o.status !== "REJECTED" && (o.paymentMethod === "TOP" || o.paymentMethod === "INVOICE"))
                            .map((o) => {
                              const { total: totalAmount } = calculateOrderTotals(o);

                              // TOP countdown
                              const shipDate = o.shippingDate ? new Date(o.shippingDate) : null;
                              let dueText = "Menunggu Pengiriman";
                              let isOverdue = false;
                              if (shipDate) {
                                const dueDate = new Date(shipDate.getTime() + institution.topDays * 24 * 60 * 60 * 1000);
                                const diffTime = dueDate.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                if (diffDays < 0) {
                                  dueText = `Jatuh Tempo! Terlambat ${Math.abs(diffDays)} Hari`;
                                  isOverdue = true;
                                } else {
                                  dueText = `${diffDays} Hari Sisa TOP`;
                                }
                              }

                              return (
                                <div
                                  key={o.id}
                                  className="bg-white border border-outline-variant/30 rounded-3xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs shadow-sm"
                                >
                                  <div className="space-y-1">
                                    <span className="font-bold text-foreground block">{o.orderNumber}</span>
                                    <div className="flex flex-wrap gap-2 text-[10px] pt-0.5">
                                      <span className="bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded border border-outline-variant/20 font-mono">
                                        Rp {totalAmount.toLocaleString("id-ID")}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded font-bold ${isOverdue
                                          ? "bg-red-50 text-white"
                                          : "bg-surface-container-low text-on-surface-variant border border-outline-variant/20"
                                          }`}
                                      >
                                        {dueText}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                    {o.paymentMethod === "TOP" ? (
                                      o.status === "PENDING_SHIPPING" || o.status === "SHIPPED" || o.status === "DELIVERED" ? (
                                        <button
                                          type="button"
                                          onClick={() => handleMidtransPay(o)}
                                          className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer border-none"
                                        >
                                          <span className="material-symbols-outlined text-[16px] text-white">payments</span>
                                          Lunasi TOP (VA/QRIS)
                                        </button>
                                      ) : (
                                        <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 font-bold flex items-center gap-1.5 text-xs">
                                          <span className="material-symbols-outlined text-[16px] text-blue-700">account_balance</span>
                                          <span>Potong Limit (Menunggu Pengiriman)</span>
                                        </div>
                                      )
                                    ) : o.paymentMethod === "INVOICE" ? (
                                      isOverdue ? (
                                        <button
                                          type="button"
                                          onClick={() => handleMidtransPay(o)}
                                          className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer border-none animate-pulse"
                                        >
                                          <span className="material-symbols-outlined text-[16px] text-white">payments</span>
                                          Bayar Sekarang (VA/QRIS)
                                        </button>
                                      ) : (
                                        <div className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 font-bold flex items-center gap-1.5 text-xs">
                                          <span>Invoice Billing (Tempo Berjalan)</span>
                                        </div>
                                      )
                                    ) : o.paymentStatus === "PENDING_VERIFICATION" ? (
                                      <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold flex items-center gap-1.5 animate-pulse">
                                        <Clock className="w-3.5 h-3.5" />
                                        Verifikasi Pembayaran...
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedOrderForPayment(o)}
                                        className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/95 shadow-md shadow-primary/10 cursor-pointer"
                                      >
                                        <UploadCloud className="w-3.5 h-3.5" />
                                        Upload Bukti Transfer
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "alamat" && (
                  <AddressBookView institution={institution} user={user} />
                )}
              </>
            )}
          </Suspense>
        </div>
      </main>


      <Suspense fallback={null}>
        <MobileDrawer
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          user={user}
          institution={institution}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          docSubTab={docSubTab}
          setDocSubTab={setDocSubTab}
          legalSubTab={legalSubTab}
          setLegalSubTab={setLegalSubTab}
          cartItemCount={cartItemCount}
          activeOrdersCount={activeOrdersCount}
          pendingPaymentCount={pendingPaymentCount}
          esignPendingCount={orders.filter(o => o.status === "PENDING_APPROVAL" && !o.spSignature).length}
          handleLogout={handleLogout}
          setViewingDetailOrder={setViewingDetailOrder}
          setViewingReceiptReport={setViewingReceiptReport}
          setIsCheckoutOpen={setIsCheckoutOpen}
        />

        <SignatureModal
          isDrawingModalOpen={isDrawingModalOpen}
          setIsDrawingModalOpen={setIsDrawingModalOpen}
          canvasRef={canvasRef}
          startDrawing={startDrawing}
          draw={draw}
          stopDrawing={stopDrawing}
          clearSignature={clearSignature}
          setSignatureDataUrl={setSignatureDataUrl}
          setHasSigned={setHasSigned}
          hasSigned={hasSigned}
          cart={cart}
          institution={institution}
          user={user}
        />
      </Suspense>

      {/* MODAL: BATALKAN PESANAN MITRA */}
      {cancelingOrder && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm font-sans animate-fadeIn">
          <div className="bg-white border border-outline-variant/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="text-sm font-heading font-extrabold text-foreground flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-[20px]">cancel</span>
                Konfirmasi Pembatalan Pesanan
              </h3>
              <button
                type="button"
                onClick={() => setCancelingOrder(null)}
                className="text-on-surface-variant hover:text-foreground text-xs font-bold border-none bg-transparent cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-3 text-xs text-on-surface-variant">
              <p>
                Anda akan membatalkan pesanan <strong className="font-mono text-foreground">{cancelingOrder.orderNumber}</strong>.
              </p>
              <div className="bg-red-50/70 border border-red-100 rounded-2xl p-3.5 space-y-1">
                <p className="font-bold text-red-900 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  Perhatian Regulasi:
                </p>
                <p className="text-[11px] text-red-800 leading-relaxed">
                  Pembatalan mandiri hanya dapat dilakukan selama pesanan berstatus <strong>PENDING_APPROVAL</strong> (belum diproses gudang PBF).
                </p>
              </div>

              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-bold text-foreground">Alasan Pembatalan (Opsional):</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Contoh: Salah jumlah produk, perubahan kebutuhan apotek, dll."
                  className="w-full p-3 border border-outline-variant/40 rounded-xl text-xs focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelingOrder(null)}
                className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-xl text-xs font-bold cursor-pointer border-none"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingCancel}
                onClick={handleCancelOrder}
                className="px-5 py-2.5 bg-error hover:bg-error/90 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer border-none flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmittingCancel ? "Memproses..." : "Ya, Batalkan Pesanan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD PAYMENT PROOF */}
      {selectedOrderForPayment && (
        <div className="fixed inset-0 z-60 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm font-sans">
          <div className="relative w-full max-w-md bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
              <h3 className="text-sm font-heading font-bold text-foreground flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" />
                Upload Bukti Pembayaran
              </h3>
              <button
                onClick={() => setSelectedOrderForPayment(null)}
                className="text-on-surface-variant hover:text-foreground text-xs cursor-pointer font-bold"
              >
                Batal
              </button>
            </div>

            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-error">
                <span>{paymentError}</span>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-normal">
                Silakan lakukan transfer bank ke rekening PBF (Mandiri 123-00-098877-1 a.n PT PharmaDist Farmasi Nusantara). Setelah itu, unggah struk transfer di bawah.
              </p>

              <div className="bg-surface-container-low p-4 border border-outline-variant/20 rounded-2xl text-xs space-y-1.5 font-sans">
                <span className="text-on-surface-variant/60 block uppercase text-[9px] font-bold font-heading">Rincian Tagihan Transfer</span>
                <div className="flex justify-between">
                  <span>No. Pesanan:</span>
                  <strong className="text-foreground">{selectedOrderForPayment.orderNumber}</strong>
                </div>
                <div className="flex justify-between text-on-surface-variant/85">
                  <span>Subtotal Produk:</span>
                  <span className="font-mono">Rp {calculateOrderTotals(selectedOrderForPayment).subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant/85">
                  <span>PPN (11%):</span>
                  <span className="font-mono">Rp {calculateOrderTotals(selectedOrderForPayment).vat.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant/85">
                  <span>Biaya Pengiriman:</span>
                  <span className="font-mono">Rp {calculateOrderTotals(selectedOrderForPayment).shippingFee.toLocaleString("id-ID")}</span>
                </div>
                <div className="pt-2 border-t border-outline-variant/20 flex justify-between items-end">
                  <span className="font-bold text-foreground">Total Tagihan Transfer:</span>
                  <strong className="text-primary font-mono text-sm">Rp {calculateOrderTotals(selectedOrderForPayment).total.toLocaleString("id-ID")}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Berkas Bukti Transfer:</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-outline-variant bg-surface-container-low hover:border-primary/60 rounded-2xl p-6 text-center cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-8 h-8 text-on-surface-variant/50 mx-auto mb-2" />
                  <span className="text-xs text-foreground block font-bold">
                    {uploadingPayment ? "Membaca file..." : "Klik untuk memilih gambar struk transfer"}
                  </span>
                  <span className="text-[10px] text-on-surface-variant/60 block mt-1">Hanya mendukung format JPG, PNG</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadPaymentProof}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: e-FAKTUR (Menggunakan CdobDocumentModal agar 100% konsisten di mobile) */}
      <CdobDocumentModal
        isOpen={viewingFaktur !== null}
        onClose={() => setViewingFaktur(null)}
        order={viewingFaktur}
        type="INVOICE"
      />

      {/* MODAL SIMULASI PAYMENT GATEWAY VA (DUMMY) */}
      {isVaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/30 animate-scaleUp text-xs text-on-surface space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">account_balance</span>
                <h3 className="font-heading font-extrabold text-sm text-slate-800">Dummy Payment Gateway (VA)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVaModalOpen(false)}
                className="text-on-surface-variant hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-bold text-[9px] uppercase tracking-wider">Bank Transfer</span>
                <span className="font-extrabold text-primary uppercase text-[10px]">BCA Virtual Account</span>
              </div>
              <div className="space-y-1">
                <span className="text-on-surface-variant text-[9px] block">Nomor Virtual Account:</span>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-outline-variant/20">
                  <span className="font-mono font-extrabold text-slate-900 text-sm tracking-widest">80012 0895 4433 2211</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("80012089544332211");
                      alert("Nomor Virtual Account berhasil disalin!");
                    }}
                    className="text-primary hover:underline text-[9px] font-bold"
                  >
                    Salin
                  </button>
                </div>
              </div>
              <div className="space-y-0.5">
                <span className="text-on-surface-variant text-[9px] block">Jumlah Pembayaran:</span>
                <div className="font-mono font-black text-slate-900 text-base">
                  Rp {(cartTotal + (cart.some(it => it.product.name.includes("Insulin") || it.product.code.includes("AMX")) ? 85000 : 50000) + cartTotal * 0.11).toLocaleString("id-ID")}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-extrabold text-slate-700 block text-[10px] uppercase">Petunjuk Pembayaran Simulasi:</span>
              <ol className="list-decimal list-inside space-y-1.5 text-on-surface-variant text-[10px] leading-relaxed">
                <li>Salin nomor Virtual Account di atas.</li>
                <li>Klik tombol <strong>"Bayar Sekarang (Simulasi)"</strong> di bawah untuk menyimulasikan transaksi sukses dari rekening bank Anda.</li>
                <li>Sistem PBF akan memproses pembayaran ini seketika.</li>
              </ol>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 flex gap-2">
              <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0">info</span>
              <p className="text-[9px] leading-normal font-medium">
                Ini adalah gerbang pembayaran tiruan (*sandbox*) untuk demonstrasi pembayaran instan jika kredit limit tidak mencukupi atau terkunci.
              </p>
            </div>

            <div className="flex gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsVaModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeCheckout()}
                disabled={isSubmittingOrder}
                className="flex-1 py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md shadow-primary/10 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingOrder ? "Memproses..." : "Bayar Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ADD TO CART TOAST NOTIFICATION (ECOMMERCE STYLE) */}
      {addedProductInfo && (
        <div className="fixed top-20 right-6 z-[100] max-w-sm w-[360px] bg-white border border-outline-variant/30 rounded-2xl shadow-xl p-4 flex flex-col gap-3 animate-in slide-in-from-right duration-300 font-sans">
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes toastProgress {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}} />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined font-bold text-lg">check_circle</span>
              <span className="text-xs font-bold">Berhasil dimasukkan ke keranjang!</span>
            </div>
            <button
              type="button"
              onClick={() => setAddedProductInfo(null)}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors text-outline cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Product Info Row */}
          <div className="flex items-center gap-3 bg-slate-50 border border-outline-variant/20 rounded-xl p-2.5">
            <div className="w-10 h-10 bg-white border border-outline-variant/10 rounded-lg flex items-center justify-center font-bold text-slate-800 text-base shadow-sm select-none">
              💊
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-slate-900 truncate">
                {addedProductInfo.product.name}
              </p>
              <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
                Jumlah: <span className="font-bold text-slate-800">{addedProductInfo.quantity} item</span>
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => setAddedProductInfo(null)}
              className="text-[11px] text-on-surface-variant hover:text-primary font-bold transition-colors cursor-pointer px-1 py-1"
            >
              Lanjutkan Belanja
            </button>
            <button
              type="button"
              onClick={() => {
                setAddedProductInfo(null);
                setActiveTab("keranjang");
              }}
              className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-white" />
              <span>Lihat Keranjang</span>
            </button>
          </div>

          {/* Countdown Progress Bar Indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 rounded-b-2xl overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{
                animation: "toastProgress 4s linear forwards"
              }}
            ></div>
          </div>
        </div>
      )}

      {/* FLOATING REAL-TIME BITESHIP STATUS NOTIFICATION TOAST */}
      {biteshipStatusToast && (
        <div className="fixed top-20 right-6 z-[105] max-w-sm w-[360px] bg-white border border-slate-200/80 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-right duration-300 font-sans">
          {/* Toast Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-ping ${biteshipStatusToast.type === "delivered" ? "bg-emerald-500" : "bg-blue-500"
                }`} />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">radar</span>
                {biteshipStatusToast.statusLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBiteshipStatusToast(null)}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 cursor-pointer border-none bg-transparent"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toast Message Body */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs space-y-1">
            <div className="flex justify-between items-center font-mono">
              <span className="font-extrabold text-slate-900">{biteshipStatusToast.orderNumber}</span>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${biteshipStatusToast.type === "delivered"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-blue-100 text-blue-700"
                }`}>
                {biteshipStatusToast.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed pt-1">
              {biteshipStatusToast.message}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setBiteshipStatusToast(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-bold transition-colors cursor-pointer border-none bg-transparent"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                const targetOrder = orders.find((o) => o.orderNumber === biteshipStatusToast.orderNumber);
                setBiteshipStatusToast(null);
                if (targetOrder) {
                  setViewingDetailOrder(targetOrder);
                } else {
                  setActiveTab("status");
                }
              }}
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer border-none shadow-xs"
            >
              <span>Lacak Paket</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE FLOATING STICKY CART BAR dihapus sesuai instruksi agar katalog mobile bersih */}

      {/* MOBILE BOTTOM NAVIGATION BAR (DOCK APP 5 TAB) */}
      {!isCheckoutOpen && (
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={handleSwitchTab}
          cartItemCount={cartItemCount}
          activeOrdersCount={orders.filter((o) => o.status === "PENDING_APPROVAL" || o.status === "PENDING_SHIPPING" || o.status === "SHIPPED").length}
          setViewingDetailOrder={setViewingDetailOrder}
          setIsCheckoutOpen={setIsCheckoutOpen}
        />
      )}

      {/* Onboarding Tour Overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col relative animate-in zoom-in-95 duration-300">
            {/* Header / Brand */}
            <div className="bg-gradient-to-r from-primary to-emerald-600 px-6 py-8 text-white relative">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined font-bold text-2xl">medical_services</span>
                <span className="font-heading font-extrabold text-lg">PBF Online</span>
              </div>
              <h3 className="font-heading font-extrabold text-xl mt-3 leading-snug">
                {onboardingStep === 0 && "Selamat Datang di PBF Online!"}
                {onboardingStep === 1 && "1. Katalog Sediaan Lengkap"}
                {onboardingStep === 2 && "2. e-Sign Surat Pesanan Digital"}
                {onboardingStep === 3 && "3. Limit Kredit & Tenor TOP"}
                {onboardingStep === 4 && "4. Lacak Pengiriman Terintegrasi"}
              </h3>
              <div className="absolute right-6 top-8 bg-white/20 backdrop-blur-sm text-[10px] font-extrabold px-3 py-1 rounded-full text-white uppercase tracking-wider">
                Langkah {onboardingStep} / 4
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 min-h-[160px] flex flex-col justify-between">
              <div>
                {onboardingStep === 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-slate-800">Halo Rekan Apoteker Penanggung Jawab,</p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pendaftaran sarana Anda telah disetujui dan diaktifkan oleh PBF Admin. Sekarang Anda dapat menggunakan seluruh fasilitas PBF Online.
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      Mari ikuti tur 4 langkah singkat untuk mengenal fitur-fitur transaksi kami!
                    </p>
                  </div>
                )}

                {onboardingStep === 1 && (
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl font-bold">inventory_2</span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Akses ratusan sediaan obat legal dengan harga khusus distributor langsung dari genggaman Anda.
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Setiap obat dilengkapi info kandungan zat aktif, nomor NIE BPOM resmi, dan tanggal kedaluwarsa transparan (sistem FEFO otomatis).
                      </p>
                    </div>
                  </div>
                )}

                {onboardingStep === 2 && (
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl font-bold">draw</span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Anda dapat membubuhkan tanda tangan digital (e-Sign) secara sah langsung saat melakukan checkout pesanan.
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Sistem kami otomatis merender Surat Pesanan (SP) legal format CDOB dengan tanda tangan Anda untuk diverifikasi oleh APJ PBF kami.
                      </p>
                    </div>
                  </div>
                )}

                {onboardingStep === 3 && (
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl font-bold">payments</span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Gunakan limit kredit belanja yang disetujui admin untuk memesan obat terlebih dahulu dengan sistem Tempo (TOP).
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Pantau tagihan jatuh tempo dan riwayat faktur secara transparan tanpa khawatir cashflow sarana terganggu.
                      </p>
                    </div>
                  </div>
                )}

                {onboardingStep === 4 && (
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl font-bold">local_shipping</span>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Setiap transaksi pengiriman dipantau secara real-time dari saat pengemasan di gudang hingga serah terima barang.
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Lacak kurir logistik dan konfirmasi penerimaan barang secara langsung di halaman detail pesanan Anda.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Dots & Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                {/* Dots indicator */}
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <div
                      key={idx}
                      className={`h-2 rounded-full transition-all duration-300 ${onboardingStep === idx ? "w-6 bg-primary" : "w-2 bg-slate-200"
                        }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  {onboardingStep > 0 && (
                    <button
                      type="button"
                      onClick={() => setOnboardingStep((s) => s - 1)}
                      className="px-4 py-2 border border-outline-variant/30 text-on-surface rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      Kembali
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (onboardingStep < 4) {
                        setOnboardingStep((s) => s + 1);
                      } else {
                        if (user?.id) {
                          localStorage.setItem(`has_seen_onboarding_${user.id}`, "true");
                        }
                        setShowOnboarding(false);
                      }
                    }}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
                  >
                    {onboardingStep === 0 && "Mulai Tur"}
                    {onboardingStep > 0 && onboardingStep < 4 && "Selanjutnya"}
                    {onboardingStep === 4 && "Mulai Belanja!"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Full Screen Courier Selector Overlay */}
      {isCourierSelectorOpenMobile && (
        <div className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end md:hidden font-sans">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] h-[85vh] flex flex-col animate-slideUp overflow-hidden shadow-2xl">

            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl font-bold">local_shipping</span>
                <span className="font-heading font-black text-sm text-slate-900">Pilih Kurir / Ekspedisi</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCourierSelectorOpenMobile(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* List */}
            <div className="p-5 pb-10 overflow-y-auto flex-1 min-h-0 space-y-3 overscroll-contain touch-pan-y">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Kurir Tersedia untuk Wilayah Anda:</p>

              {biteshipRates.map((rate, i) => {
                const isSelected = selectedRate?.courier_code === rate.courier_code && selectedRate?.courier_service_code === rate.courier_service_code;
                const courierMeta = getCourierMeta(rate.courier_code, rate.courier_name);
                return (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedRate(rate);
                      setShippingFeeMobile(rate.price);
                      setIsCourierSelectorOpenMobile(false);
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-100 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CourierLogoBadge courierCode={rate.courier_code} courierName={rate.courier_name} />
                      <div className="text-left min-w-0">
                        <span className="text-xs font-bold block truncate">
                          {rate.courier_name.toUpperCase()} - {rate.courier_service_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                          Estimasi tiba: {rate.duration || `${rate.shipment_duration} hari`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono">
                        Rp {rate.price.toLocaleString("id-ID")}
                      </span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-sm font-bold">check_circle</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Safe Area spacing */}
          </div>
        </div>
      )}

      {/* Floating WhatsApp Support Button on Mobile Android */}
      <a
        href="https://wa.me/6285151005960?text=Halo%20CS%20GroovyCare,%20saya%20butuh%20bantuan%20mengenai%20pesanan%20saya"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => triggerHapticImpact()}
        className="fixed bottom-24 right-4 z-40 w-11 h-11 bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform md:hidden border border-emerald-400/40"
        title="Hubungi CS WhatsApp PBF"
      >
        <span className="material-symbols-outlined text-xl">chat</span>
      </a>

      {/* Address Book Manager Modal (Mobile Cart & Dashboard) */}
      <AddressManagerModal
        isOpen={isAddressManagerOpenMobile}
        onClose={() => setIsAddressManagerOpenMobile(false)}
        addresses={savedAddressesList}
        selectedAddressId={selectedMainAddress?.id}
        onSelectAddress={(addr) => {
          setSelectedMainAddress(addr);
          if (addr.province) setShippingProvince(addr.province);
          if (addr.city) setShippingRegency(addr.city);
          if (addr.district) setShippingDistrict(addr.district);
          if (addr.postalCode) setShippingPostalCode(addr.postalCode);
          if (addr.fullAddress) setShippingAddressDetail(addr.fullAddress);
        }}
        onAddNewAddress={() => {
          setAddressToEditMobile(null);
          setIsAddressFormOpenMobile(true);
        }}
        onEditAddress={(addr) => {
          setAddressToEditMobile(addr);
          setIsAddressFormOpenMobile(true);
        }}
        onDeleteAddress={async (id) => {
          if (!confirm("Hapus alamat ini?")) return;
          const { deleteShippingAddress } = await import("@/app/actions/shipping-addresses");
          await deleteShippingAddress(id);
          await fetchMainAddress();
          router.refresh();
        }}
        onSetMainAddress={async (id) => {
          const { setMainShippingAddress } = await import("@/app/actions/shipping-addresses");
          await setMainShippingAddress(id, institution.id);
          await fetchMainAddress();
          router.refresh();
        }}
      />

      {/* Address Form Modal (Mobile) */}
      <AddressFormModal
        isOpen={isAddressFormOpenMobile}
        onClose={() => setIsAddressFormOpenMobile(false)}
        addressToEdit={addressToEditMobile}
        institutionId={institution?.id}
        onSaveSuccess={async () => {
          await fetchMainAddress();
          router.refresh();
        }}
      />

    </div>
  );
}
