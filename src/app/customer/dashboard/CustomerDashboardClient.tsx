"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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

const DashboardOverview = dynamic(() => import("./components/DashboardOverview"), { ssr: false });
const ProductCatalog = dynamic(() => import("./components/ProductCatalog"), { ssr: false });
const OrderDetailView = dynamic(() => import("./components/OrderDetailView"), { ssr: false });
const ReceiptReportView = dynamic(() => import("./components/ReceiptReportView"), { ssr: false });
const ProfileMobileView = dynamic(() => import("./components/ProfileMobileView"), { ssr: false });
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "belanja" | "status" | "riwayat" | "tagihan" | "dokumen" | "legalitas" | "pengaturan" | "keranjang">("dashboard");
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

  // State Modal Checkout & e-Sign
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [tempShippingAddress, setTempShippingAddress] = useState("");
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"VA" | "TOP" | "INVOICE" | "COD">("VA");
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

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("has_seen_onboarding");
      if (!seen) {
        setShowOnboarding(true);
      }
    }
  }, []);

  useEffect(() => {
    if (addedProductInfo) {
      const timer = setTimeout(() => {
        setAddedProductInfo(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [addedProductInfo]);

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
            onSuccess: async function() {
              alert("Pembayaran berhasil!");
              await handlePaymentSuccess(order.id);
              router.refresh();
            },
            onPending: function() {
              alert("Pembayaran tertunda, silakan selesaikan pembayaran Anda.");
              router.refresh();
            },
            onError: function() {
              alert("Pembayaran gagal!");
              router.refresh();
            },
            onClose: function() {
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
                  onSuccess: async function() {
                    alert("Pembayaran berhasil!");
                    if (res.orderId) {
                      await handlePaymentSuccess(res.orderId);
                    }
                    router.refresh();
                  },
                  onPending: function() {
                    alert("Pembayaran tertunda, silakan selesaikan pembayaran Anda.");
                    router.refresh();
                  },
                  onError: function() {
                    alert("Pembayaran gagal!");
                    router.refresh();
                  },
                  onClose: function() {
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

  // Penjumlahan tagihan belum lunas
  const unpaidOrders = orders.filter((o) => o.paymentStatus !== "PAID" && o.status !== "REJECTED");
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
      timestamp: new Date(institution.siaExpiry).getTime() - 365*24*60*60*1000,
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
  const pendingPaymentCount = useMemo(() => orders.filter(o => o.paymentStatus !== "PAID" && o.status !== "DELIVERED" && o.status !== "REJECTED").length, [orders]);
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
                <path d="M32.05 16.5C30.2 18.9 29.1 22.4 29.1 26.9v458.2c0 4.5 1.1 8 2.95 10.4l1.55 1.4L261.25 269v-5.25L33.6 15.1l-1.55 1.4z" fill="#00f0ff"/>
                <path d="M338.45 346.5L261.25 269v-5.25L338.45 166l1.8 1c21.8 12.4 60.55 34.6 81.35 46.5 5.95 3.4 9.9 8.9 9.9 15.2 0 6.3-3.95 11.8-9.9 15.2-20.8 11.9-59.55 34.1-81.35 46.6l-1.8 1z" fill="#ffc200"/>
                <path d="M263.15 266.35l-76.3-76.3L32.05 16.5c3.2-3.4 9.1-5.4 16.4-1.2l290 166.1 1.8 1-77.1 76.95z" fill="#ff3a44"/>
                <path d="M263.15 271.65L340.25 348l-291.8 167c-7.3 4.2-13.2 2.2-16.4-1.2L186.85 348l76.3-76.35z" fill="#00e756"/>
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
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-outline-variant/30 px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {viewingDetailOrder ? (
              <button
                type="button"
                onClick={() => setViewingDetailOrder(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-primary" />
              </button>
            ) : activeTab === "keranjang" ? (
              <button
                type="button"
                onClick={() => setActiveTab("belanja")}
                className="md:hidden p-1.5 hover:bg-slate-100 rounded-full transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-primary" />
              </button>
            ) : (
              <Menu className="md:hidden w-5 h-5 text-on-surface cursor-pointer" onClick={() => setIsMobileSidebarOpen(true)} />
            )}
            <h2 className="font-heading font-extrabold text-sm sm:text-base md:text-lg text-primary">
              {viewingDetailOrder 
                ? "Detail Pengiriman" 
                : activeTab === "keranjang" 
                  ? "Keranjang Belanja" 
                  : "PBF Online"}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {viewingDetailOrder ? (
              <button
                type="button"
                onClick={() => alert("Opsi menu lainnya")}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-all border-none bg-transparent cursor-pointer flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            ) : activeTab === "keranjang" ? (
              <button
                type="button"
                onClick={() => setActiveTab("riwayat")}
                className="md:hidden p-1.5 hover:bg-slate-100 rounded-full transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
              >
                <History className="w-5 h-5 text-on-surface-variant" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center bg-surface-container-low rounded-full px-4 py-1.5 border border-outline-variant/20">
                <label htmlFor="search-input" className="sr-only">Cari obat, SKU, No. Invoice</label>
                <Search className="w-4 h-4 text-on-surface-variant/50 mr-2" aria-hidden="true" />
                <input
                  id="search-input"
                  autoComplete="off"
                  className="bg-transparent border-none focus:outline-none text-xs w-64 placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 rounded-md outline-none"
                  placeholder="Cari obat, SKU, No. Invoice..."
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (activeTab !== "belanja") setActiveTab("belanja");
                  }}
                />
              </div>
            )}
            
            <div className={`flex items-center gap-4 relative ${activeTab === "keranjang" ? "hidden md:flex" : "flex"}`}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCustomerNotifOpen(!isCustomerNotifOpen)}
                  className="relative p-1.5 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent"
                >
                  <Bell className="w-4.5 h-4.5 text-on-surface-variant hover:text-primary transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  )}
                </button>

                {/* Responsive Notification Popover (Mobile & Desktop) */}
                {isCustomerNotifOpen && (
                  <div 
                    className="fixed top-16 right-4 left-4 md:absolute md:top-auto md:right-0 md:left-auto md:mt-2 w-auto md:w-80 bg-white border border-outline-variant/30 rounded-2xl shadow-xl py-3 z-[100] animate-in fade-in slide-in-from-top-3 duration-200"
                  >
                    <div className="px-4 pb-2 border-b border-outline-variant/20 flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">Notifikasi Aktivitas</span>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <span className="bg-primary/10 text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {unreadCount} Baru
                          </span>
                        )}
                        <button 
                          type="button"
                          onClick={() => setIsCustomerNotifOpen(false)}
                          className="md:hidden text-on-surface-variant hover:text-error transition-colors border-none bg-transparent cursor-pointer p-1 flex items-center justify-center"
                          title="Tutup"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[50vh] md:max-h-60 overflow-y-auto pt-2 divide-y divide-outline-variant/10">
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
                              className={`w-full px-5 py-3.5 hover:bg-slate-50 transition-colors flex gap-3 text-left items-start cursor-pointer border-none bg-transparent relative ${
                                isUnread ? "bg-primary/5 hover:bg-primary/10" : ""
                              }`}
                            >
                              {/* SaaS style colored icon badge */}
                              {notif.type === "success" && (
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </div>
                              )}
                              {notif.type === "shipping" && (
                                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
                                  <Truck className="w-3.5 h-3.5" />
                                </div>
                              )}
                              {notif.type === "error" && (
                                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs">
                                  <X className="w-3.5 h-3.5" />
                                </div>
                              )}
                              {notif.type === "info" && (
                                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0 shadow-xs">
                                  <Info className="w-3.5 h-3.5" />
                                </div>
                              )}
                              {notif.type === "payment" && (
                                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 shadow-xs">
                                  <CreditCard className="w-3.5 h-3.5" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-on-surface flex justify-between items-center gap-2">
                                  <span className="truncate">{notif.title}</span>
                                  <span className="text-[10px] text-on-surface-variant/60 font-normal shrink-0">
                                    {new Date(notif.timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-on-surface-variant/80 mt-1 leading-relaxed">
                                  {notif.description}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-6 text-center text-outline text-xs">
                          Belum ada notifikasi aktivitas dari admin.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <HelpCircle className="w-4.5 h-4.5 text-on-surface-variant cursor-pointer hover:text-primary transition-colors" />
              <button
                type="button"
                onClick={() => alert("Hubungi support: cs@groovyrx.com")}
                className="hidden sm:block text-primary font-bold text-xs hover:underline"
              >
                Support
              </button>

              {/* Profile Block Header Kanan Ujung */}
              <div className="pl-4 border-l border-outline-variant/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-[10px] shrink-0">
                  {institution.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:block overflow-hidden max-w-[150px] text-left">
                  <p className="text-xs font-bold text-on-surface truncate leading-tight">{institution.name}</p>
                  <p className="text-[8px] text-outline uppercase tracking-wider font-extrabold opacity-75">
                    Owner Account
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-on-surface-variant hover:text-error transition-colors cursor-pointer p-1"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
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
              {/* B. MOBILE VIEW                                                */}
              {/* ------------------------------------------------------------- */}
              <div className="block md:hidden space-y-6 px-1 pb-32">
                
                {/* 1. Compliance Summary */}
                <section className="animate-in fade-in slide-in-from-top duration-500">
                  {hasCdobWarning ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
                      <div className="bg-red-500 text-white p-2.5 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">warning</span>
                      </div>
                      <div>
                        <h3 className="font-heading font-black text-sm text-red-700">Perizinan Apotek Bermasalah</h3>
                        <p className="text-xs text-red-600 font-bold mt-0.5 leading-relaxed">SIA atau SIPA Anda telah kedaluwarsa. Mohon perbarui profil.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-primary-container/10 border border-primary-container/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
                      <div className="bg-primary-container text-on-primary-container p-2.5 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                      </div>
                      <div>
                        <h3 className="font-heading font-black text-sm text-[#00422b]">Ringkasan Kepatuhan</h3>
                        <p className="text-xs text-primary font-black mt-0.5 leading-relaxed">Semua item memenuhi syarat CDOB &amp; izin PBF.</p>
                      </div>
                    </div>
                  )}
                </section>

                {/* 2. Cart Items List */}
                {cart.length === 0 ? (
                  <div className="text-center py-20 space-y-5">
                    <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-sm font-black text-foreground">Keranjang Belanja Kosong</p>
                      <p className="text-xs text-on-surface-variant/70">Mulai tambahkan obat resmi dari katalog PBF.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("belanja")}
                      className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer inline-block border-none"
                    >
                      Buka Katalog
                    </button>
                  </div>
                ) : (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-heading font-black text-base text-on-surface">Item Pesanan ({cart.length})</h2>
                      <button 
                        onClick={() => setCart([])}
                        className="text-primary text-xs font-bold hover:underline border-none bg-transparent cursor-pointer"
                      >
                        Hapus Semua
                      </button>
                    </div>

                    {cart.map((item) => {
                      const isOutOfStock = item.product.totalStock <= 0;
                      const showSignAlert = item.product.name.toLowerCase().includes("amoxicillin") || item.product.name.toLowerCase().includes("diazepam") || item.product.category.toLowerCase().includes("keras") || item.product.category.toLowerCase().includes("antibiotik");

                      if (showSignAlert) {
                        return (
                          <div 
                            key={item.product.id}
                            className="glass-card border border-error-container/50 rounded-2xl p-4 shadow-sm relative space-y-3"
                          >
                            <div className="flex gap-4 opacity-70">
                              {/* Image container */}
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-outline-variant/10">
                                <img 
                                  className="w-full h-full object-cover mix-blend-multiply opacity-90 grayscale"
                                  src={item.product.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwWGNG9klmFlTxE7qRJlM1a7CWQA41HcodSrxAo5yyi2kDDxkKfVY-ZKWSidodMppE_pXoP_mQCrcx9gRPdHjb967dBVWUoFL5AFRR5c_Jl2dQgOsaFvIFY5EDsB4KhW6Yp97g7uZJaWqjHlKz4J8OY4vHoN93-nWI0lZZOj7DhkS8ZaO6mCejJMLHI-yHbtaiqlkdO0f2skoMG2UQD7cf0ywd87rynYVJHts51V9wTivLcGooleoOrenqnrUzra16cONC2_49Y"} 
                                  alt={item.product.name}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwWGNG9klmFlTxE7qRJlM1a7CWQA41HcodSrxAo5yyi2kDDxkKfVY-ZKWSidodMppE_pXoP_mQCrcx9gRPdHjb967dBVWUoFL5AFRR5c_Jl2dQgOsaFvIFY5EDsB4KhW6Yp97g7uZJaWqjHlKz4J8OY4vHoN93-nWI0lZZOj7DhkS8ZaO6mCejJMLHI-yHbtaiqlkdO0f2skoMG2UQD7cf0ywd87rynYVJHts51V9wTivLcGooleOrenqnrUzra16cONC2_49Y";
                                  }}
                                />
                              </div>

                              {/* Details */}
                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-heading font-black text-sm leading-snug line-clamp-1 text-foreground">{item.product.name}</h3>
                                  <button 
                                    onClick={() => removeFromCart(item.product.id)}
                                    className="text-on-surface-variant hover:text-error transition-colors border-none bg-transparent cursor-pointer p-0"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                  </button>
                                </div>
                                <p className="text-error text-xs font-bold mt-0.5">Butuh e-Sign Surat Pesanan (SP)</p>
                                
                                <div className="flex items-center gap-1.5 py-0.5">
                                  <span className="material-symbols-outlined text-error text-[16px]">warning</span>
                                  <span className="text-error text-xs font-bold">
                                    Dokumen belum diunggah
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Compliance Action Button */}
                            <div className="mt-3 bg-error-container/10 p-2 rounded-xl border border-error-container text-center">
                              <button 
                                onClick={() => {
                                  if (!isProfileComplete) {
                                    alert("Pemesanan diblokir. Harap lengkapi profil Mitra (KTP Pemilik, NPWP Pemilik, SIA, dan SIPA) terlebih dahulu di menu Pengaturan > Profil Apotek.");
                                    setActiveTab("pengaturan");
                                    return;
                                  }
                                  setIsCheckoutOpen(true);
                                  setCheckoutError(null);
                                }}
                                className="w-full py-2 bg-transparent hover:bg-error-container/10 text-error border-none rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-transform cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                Upload e-Sign SP
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={item.product.id}
                          className="glass-card border border-surface-variant/50 rounded-2xl p-4 shadow-sm space-y-3 transition-shadow"
                        >
                          <div className="flex gap-4">
                            {/* Image container */}
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-outline-variant/10">
                              <img 
                                className="w-full h-full object-cover mix-blend-multiply opacity-90"
                                src={item.product.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwWGNG9klmFlTxE7qRJlM1a7CWQA41HcodSrxAo5yyi2kDDxkKfVY-ZKWSidodMppE_pXoP_mQCrcx9gRPdHjb967dBVWUoFL5AFRR5c_Jl2dQgOsaFvIFY5EDsB4KhW6Yp97g7uZJaWqjHlKz4J8OY4vHoN93-nWI0lZZOj7DhkS8ZaO6mCejJMLHI-yHbtaiqlkdO0f2skoMG2UQD7cf0ywd87rynYVJHts51V9wTivLcGooleoOrenqnrUzra16cONC2_49Y"} 
                                alt={item.product.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwwWGNG9klmFlTxE7qRJlM1a7CWQA41HcodSrxAo5yyi2kDDxkKfVY-ZKWSidodMppE_pXoP_mQCrcx9gRPdHjb967dBVWUoFL5AFRR5c_Jl2dQgOsaFvIFY5EDsB4KhW6Yp97g7uZJaWqjHlKz4J8OY4vHoN93-nWI0lZZOj7DhkS8ZaO6mCejJMLHI-yHbtaiqlkdO0f2skoMG2UQD7cf0ywd87rynYVJHts51V9wTivLcGooleoOrenqnrUzra16cONC2_49Y";
                                }}
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-start">
                                <h3 className="font-heading font-black text-sm leading-snug line-clamp-1 text-foreground">{item.product.name}</h3>
                                <button 
                                  onClick={() => removeFromCart(item.product.id)}
                                  className="text-on-surface-variant hover:text-error transition-colors border-none bg-transparent cursor-pointer p-0"
                                >
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                              </div>
                              <p className="text-on-surface-variant text-xs font-bold">Satuan: {item.product.unit}</p>
                              
                              <div className="flex items-center gap-1.5 py-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? "bg-error" : "bg-primary"}`}></span>
                                <span className={`${isOutOfStock ? "text-error" : "text-primary"} text-xs font-bold`}>
                                  Stok tersedia: {item.product.totalStock} Unit
                                </span>
                              </div>

                              <div className="flex items-center justify-between pt-2">
                                <span className="font-extrabold text-base text-primary font-mono">
                                  Rp {item.product.price.toLocaleString("id-ID")}
                                </span>
                                
                                {/* Quantity Selector */}
                                <div className="flex items-center bg-surface-container-low rounded-full px-1 py-1 border border-outline-variant/30">
                                  <button 
                                    onClick={() => updateQty(item.product.id, item.quantity - 1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-xs active:scale-90 transition-transform border-none cursor-pointer text-xs"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 font-bold text-sm font-mono">{item.quantity.toString().padStart(2, '0')}</span>
                                  <button 
                                    onClick={() => updateQty(item.product.id, item.quantity + 1)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-white shadow-xs active:scale-90 transition-transform border-none cursor-pointer text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* 3. Price Summary */}
                    <section className="bg-surface-container-low rounded-2xl p-5 space-y-4 border border-outline-variant/10">
                      <h3 className="font-heading font-black text-base text-on-surface">Ringkasan Harga</h3>
                      <div className="space-y-2.5 text-sm font-bold">
                        <div className="flex justify-between text-on-surface-variant">
                          <span>Subtotal ({cart.length} item)</span>
                          <span className="font-mono text-foreground font-black">Rp {cartTotal.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-on-surface-variant">
                          <span>PPN (11%)</span>
                          <span className="font-mono text-foreground font-black">Rp {Math.round(cartTotal * 0.11).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-on-surface-variant">
                          <span>Biaya Pengiriman</span>
                          <span className="text-primary font-black">{cartTotal > 500000 ? "Gratis" : "Rp 50.000"}</span>
                        </div>
                        <hr className="border-outline-variant/20 my-2.5"/>
                        <div className="flex justify-between text-on-surface">
                          <span className="font-heading font-black text-sm">Total Estimasi</span>
                          <span className="font-extrabold text-lg text-primary font-mono">
                            Rp {(cartTotal + Math.round(cartTotal * 0.11) + (cartTotal > 500000 ? 0 : 50000)).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </section>

                    {/* 4. Compliance Check Detail */}
                    <div className="flex items-start gap-2.5 p-4 bg-surface-container-highest rounded-2xl border border-outline-variant/10">
                      <span className="material-symbols-outlined text-outline text-[18px]">info</span>
                      <p className="text-xs font-bold text-on-surface-variant leading-relaxed">
                        Harga di atas merupakan estimasi awal. Harga final akan menyesuaikan dengan kebijakan diskon batch dan ketersediaan stok fisik di gudang cabang terdekat.
                      </p>
                    </div>
                  </section>
                )}

                {/* 5. Sticky Bottom Checkout Area */}
                <div className="fixed bottom-16 left-0 right-0 z-45 bg-white/95 backdrop-blur-md border-t border-outline-variant/20 shadow-2xl h-20 px-4 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-on-surface-variant text-xs font-bold">Total Pembayaran</span>
                      <span className="font-black text-lg text-on-surface font-mono">
                        Rp {(cartTotal + Math.round(cartTotal * 0.11) + (cartTotal > 500000 ? 0 : 50000)).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        if (!isProfileComplete) {
                          alert("Pemesanan diblokir. Harap lengkapi profil Mitra (KTP Pemilik, NPWP Pemilik, SIA, dan SIPA) terlebih dahulu di menu Pengaturan > Profil Apotek.");
                          setActiveTab("pengaturan");
                          return;
                        }
                        if (cart.length === 0) return;
                        setIsCheckoutOpen(true);
                        setCheckoutError(null);
                      }}
                      disabled={cart.length === 0}
                      className={`bg-primary text-white font-heading font-black text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-1.5 border-none cursor-pointer ${
                        cart.length === 0 ? "opacity-50 cursor-not-allowed shadow-none" : ""
                      }`}
                    >
                      <span>Checkout</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </button>
                  </div>
                </div>
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
                {orders.filter((o) => o.paymentStatus !== "PAID" && o.status !== "REJECTED").length === 0 ? (
                  <div className="text-center py-8 bg-white border border-outline-variant/30 rounded-3xl text-on-surface-variant text-xs shadow-sm">
                    Tidak ada tagihan jatuh tempo saat ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders
                      .filter((o) => o.paymentStatus !== "PAID" && o.status !== "REJECTED")
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
                                  className={`px-2 py-0.5 rounded font-bold ${
                                    isOverdue
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
        </>
      )}
    </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-outline-variant/30 flex justify-around items-center h-16 z-50 shadow-lg">
        <button
          onClick={() => {
            setActiveTab("dashboard");
            setViewingDetailOrder(null);
            setViewingReceiptReport(null);
          }}
          className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-150 active:scale-95 ${
            activeTab === "dashboard" ? "text-primary" : "text-on-surface-variant/60"
          }`}
        >
          <Home className="w-5 h-5 transition-transform duration-150" />
          <span className={`text-[10px] ${activeTab === "dashboard" ? "font-extrabold" : "font-medium"}`}>Beranda</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("belanja");
            setViewingDetailOrder(null);
            setViewingReceiptReport(null);
          }}
          className={`flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-150 active:scale-95 ${
            activeTab === "belanja" ? "text-primary" : "text-on-surface-variant/60"
          }`}
        >
          <ShoppingBag className="w-5 h-5 transition-transform duration-150" />
          <span className={`text-[10px] ${activeTab === "belanja" ? "font-extrabold" : "font-medium"}`}>Katalog</span>
        </button>
        <div className="relative -top-5">
          <button
            onClick={() => {
              setActiveTab("keranjang");
              setViewingDetailOrder(null);
              setViewingReceiptReport(null);
            }}
            className="bg-primary text-white w-12 h-12 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/95 active:scale-95 transition-transform relative border-none"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[8px] font-black bg-error text-white rounded-full min-w-[16px] text-center leading-none border border-white">
                {cart.length}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={() => {
            setActiveTab("riwayat");
            setViewingDetailOrder(null);
            setViewingReceiptReport(null);
          }}
          className={`flex flex-col items-center gap-0.5 cursor-pointer relative transition-all duration-150 active:scale-95 ${
            activeTab === "riwayat" ? "text-primary" : "text-on-surface-variant/60"
          }`}
        >
          <History className="w-5 h-5 transition-transform duration-150" />
          <span className={`text-[10px] ${activeTab === "riwayat" ? "font-extrabold" : "font-medium"}`}>Order</span>
          {orders.filter((o) => o.status === "PENDING_APPROVAL" && !o.spSignature).length > 0 && (
            <span className="absolute top-0 right-1.5 w-1.5 h-1.5 bg-error rounded-full animate-pulse" />
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("pengaturan");
            setViewingDetailOrder(null);
            setViewingReceiptReport(null);
          }}
          className={`flex flex-col items-center gap-0.5 cursor-pointer relative transition-all duration-150 active:scale-95 ${
            activeTab === "pengaturan" ? "text-primary" : "text-on-surface-variant/60"
          }`}
        >
          <User className="w-5 h-5 transition-transform duration-150" />
          <span className={`text-[10px] ${activeTab === "pengaturan" ? "font-extrabold" : "font-medium"}`}>Profil</span>
          {activeTab === "pengaturan" && (
            <div className="absolute top-0 right-3.5 w-1.5 h-1.5 bg-primary rounded-full scale-75" />
          )}
        </button>
      </nav>
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

      {/* MODAL: e-FAKTUR */}
      {viewingFaktur && (
        <div className="fixed inset-0 z-60 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm font-sans">
          <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl p-8 shadow-2xl space-y-6 printable-document">
            {/* Header (with logo, PBF permit, phone, NPWP) */}
            <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  PhN
                </div>
                <div>
                  <h3 className="text-sm font-heading font-extrabold tracking-tight text-slate-900 uppercase">PT PharmaDist Farmasi Nusantara</h3>
                  <p className="text-[9px] text-slate-500 font-medium">Izin PBF: FK.01.01/PBF/1089/2026 | NPWP: 01.234.567.8-092.000</p>
                  <p className="text-[9px] text-slate-500">Jl. Industri Farmasi No. 45, Bekasi | Telp: (021) 8984-5678</p>
                </div>
              </div>
              
              <div className="flex gap-2.5 items-center no-print">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-xl cursor-pointer shadow-md hover:brightness-105 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">print</span>
                  Cetak Faktur
                </button>
                <button
                  onClick={() => setViewingFaktur(null)}
                  className="text-slate-400 hover:text-slate-650 font-bold text-xs cursor-pointer border border-slate-200 px-3 py-1.5 rounded-xl bg-white"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Title printed ONLY */}
            <div className="hidden print:block border-b border-slate-200 pb-2">
              <h2 className="text-xs font-bold text-center text-slate-800 uppercase tracking-widest">FAKTUR PENJUALAN FARMASI</h2>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-slate-400 block font-bold text-[9px] uppercase">Penerima Barang (Pembeli):</span>
                <div className="font-extrabold text-slate-800">{institution.name}</div>
                <div className="text-slate-650">{institution.address}</div>
                <div className="text-slate-500">No. SIA: {institution.siaNumber}</div>
                <div className="text-slate-500">APJ: {user.name} (SIPA: {user.sipaNumber})</div>
              </div>

              <div className="space-y-1 text-right">
                <span className="text-slate-400 block font-bold text-[9px] uppercase">Rincian Faktur:</span>
                <div>No. Invoice: <strong className="font-mono text-slate-900">INV/{viewingFaktur.orderNumber.replace("SP-", "")}</strong></div>
                <div>No. SP Pelanggan: <strong className="font-mono">{viewingFaktur.orderNumber}</strong></div>
                <div>Tanggal Transaksi: {new Date(viewingFaktur.createdAt).toLocaleDateString("id-ID")}</div>
                <div>Jatuh Tempo TOP: {viewingFaktur.shippingDate ? new Date(new Date(viewingFaktur.shippingDate).getTime() + institution.topDays * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID") : "-"}</div>
              </div>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-2">Deskripsi Produk</th>
                  <th className="py-2 text-center">Jumlah</th>
                  <th className="py-2 text-right">Harga Satuan</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {viewingFaktur.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 text-slate-800">
                    <td className="py-2.5 font-semibold">{item.product.name}</td>
                    <td className="py-2.5 text-center">{item.quantity} {item.product.unit}</td>
                    <td className="py-2.5 text-right">Rp {item.price.toLocaleString("id-ID")}</td>
                    <td className="py-2.5 text-right font-mono font-semibold">Rp {(item.price * item.quantity).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-start pt-4 border-t border-slate-200">
              <div className="text-[10px] text-slate-400 italic">
                *Faktur ini merupakan dokumen sah perpajakan farmasi CDOB.
              </div>

              <div className="text-right text-xs space-y-1.5 text-slate-600 max-w-xs w-full">
                <div className="flex justify-between">
                  <span>Subtotal Nilai Obat:</span>
                  <span className="font-mono text-slate-900">Rp {calculateOrderTotals(viewingFaktur).subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>PPN (11%):</span>
                  <span className="font-mono text-slate-900">Rp {calculateOrderTotals(viewingFaktur).vat.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Pengiriman:</span>
                  <span className="font-mono text-slate-900">Rp {calculateOrderTotals(viewingFaktur).shippingFee.toLocaleString("id-ID")}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-end">
                  <span className="font-bold text-slate-800">Total Tagihan Faktur:</span>
                  <strong className="text-slate-950 font-mono text-base">Rp {calculateOrderTotals(viewingFaktur).total.toLocaleString("id-ID")}</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-150 text-[10px] text-slate-500">
              <div className="text-center w-40">
                <span>Penerima APJ Apotek</span>
                <div className="h-10 mt-2 flex items-center justify-center border border-slate-100 bg-slate-50 rounded-lg">
                  {viewingFaktur.spSignature ? (
                    <img src={viewingFaktur.spSignature} alt="Tanda Tangan" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="font-semibold text-slate-400">TERTANDA DIGITAL</span>
                  )}
                </div>
                <span className="block mt-1 font-semibold text-slate-700">{user.name}</span>
              </div>

              {/* QR CODE VERIFIKASI CDOB */}
              <div className="flex flex-col items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                <svg width="45" height="45" viewBox="0 0 29 29" fill="none" className="text-slate-800">
                  <path d="M0 0h7v7H0zm2 2v3h3V2zm0 6h1v1H2zm6-8h7v7H8zm2 2v3h3V2zm-2 6h2v1H8zm8-8h7v7h-7zm2 2v3h3V2zm-2 6h1v1h-1zm3 0h2v1h-2zm-11 3h1v1H8zm1 1h1v1H9zm1-1h1v1h-1zm-2 2h1v1H8zm3-2h2v1h-2zm0 2h1v1h-1zm4-2h1v1h-1zm1 1h1v1h-1zm-1 1h1v1h-1zm3-2h3v1h-3zm1 1h1v1h-1zm0 1h2v1h-2zm-15 4h7v7H0zm2 2v3h3V20zm0 6h1v1H2zm6-8h1v1H8zm1 1h1v1H9zm1-1h1v1h-1zm-2 2h1v1H8zm3-2h2v1h-2zm0 2h1v1h-1zm4-2h1v1h-1zm1 1h1v1h-1zm-1 1h1v1h-1zm3-2h3v1h-3zm1 1h1v1h-1zm0 1h2v1h-2zm2 2h1v1h-1zm1-1h1v1h-1zm-1 2h2v1h-2zm3-2h1v1h-1zm-1 1h1v1h-1zm1 1h1v1h-1zm-8 4h1v1H8zm1 1h1v1H9zm1-1h1v1h-1zm-2 2h1v1H8zm3-2h2v1h-2zm0 2h1v1h-1zm4-2h1v1h-1zm1 1h1v1h-1zm-1 1h1v1h-1zm3-2h3v1h-3zm1 1h1v1h-1zm0 1h2v1h-2z" fill="currentColor"/>
                </svg>
                <p className="text-[5px] font-extrabold text-emerald-800 uppercase mt-1 tracking-widest">VERIFIED CDOB</p>
              </div>

              <div className="text-center w-40">
                <span>Apoteker Penanggung Jawab PBF</span>
                <div className="h-10 mt-2 flex items-center justify-center border border-slate-100 bg-slate-50 rounded-lg">
                  <span className="font-semibold text-primary">APJ PBF PharmaDist</span>
                </div>
                <span className="block mt-1 font-semibold text-slate-700 font-heading">Apoteker Sarah, S.Farm, Apt</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <style dangerouslySetInnerHTML={{__html: `
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

      {/* MOBILE FLOATING STICKY CART BAR (Tampil saat belanja & keranjang terisi) */}
      {activeTab === "belanja" && cart.length > 0 && !isCheckoutOpen && !viewingDetailOrder && (
        <div className="md:hidden fixed bottom-16 left-3 right-3 z-30 bg-slate-900 text-white rounded-2xl p-3 shadow-xl flex items-center justify-between animate-in slide-in-from-bottom duration-200 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 text-primary rounded-xl flex items-center justify-center font-bold text-sm relative">
              <ShoppingCart className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{cartItemCount} Obat Terpilih</p>
              <p className="font-mono font-extrabold text-sm text-white">Rp {cartTotal.toLocaleString("id-ID")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSwitchTab("keranjang")}
            className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer border-none"
          >
            <span>Lanjut Ke SP</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR (DOCK APP 5 TAB) */}
      {!isCheckoutOpen && !viewingDetailOrder && (
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
                      className={`h-2 rounded-full transition-all duration-300 ${
                        onboardingStep === idx ? "w-6 bg-primary" : "w-2 bg-slate-200"
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
                        localStorage.setItem("has_seen_onboarding", "true");
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
    </div>
  );
}
