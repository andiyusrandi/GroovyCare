"use client";

import { useState } from "react";
import { FileText, Edit3, Truck, Receipt, Download, Clock, CheckCircle, PenTool } from "lucide-react";
import { canOpenEFaktur } from "./OrderDetailView";

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
  batches?: Batch[];
}

interface DocumentCenterViewProps {
  orders: any[];
  subTab: "sp" | "esign" | "do" | "faktur";
  setSubTab: (tab: "sp" | "esign" | "do" | "faktur") => void;
  setViewingDetailOrder: (order: any) => void;
  setViewingFaktur: (order: any) => void;
  setCart: (cart: any) => void;
  setIsCheckoutOpen: (open: boolean) => void;
  setCheckoutError: (err: any) => void;
  products: Product[];
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

export default function DocumentCenterView({
  orders,
  subTab,
  setSubTab,
  setViewingDetailOrder,
  setViewingFaktur,
  setCart,
  setIsCheckoutOpen,
  setCheckoutError,
  products,
}: DocumentCenterViewProps) {
  // Filters
  const spOrders = orders.filter(o => o.status !== "REJECTED");
  const esignPendingOrders = orders.filter(o => o.status === "PENDING_APPROVAL" && !o.spSignature);
  const doOrders = orders.filter(o => o.status === "SHIPPED" || o.status === "DELIVERED");
  const fakturOrders = orders.filter(o => canOpenEFaktur(o));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h2 className="text-xl font-heading font-extrabold text-foreground">Pusat Dokumen Legal &amp; Audit</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">Kelola Surat Pesanan (SP), tanda tangan digital APJ, Surat Jalan (DO), dan e-Faktur Pajak.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar whitespace-nowrap flex-nowrap border-b border-outline-variant/20 gap-1.5 md:gap-2 -mx-4 px-4 scroll-smooth">
        <button
          onClick={() => setSubTab("sp")}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 text-[11px] md:text-xs font-bold transition-all cursor-pointer shrink-0 ${
            subTab === "sp"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-foreground"
          }`}
        >
          <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
          Surat Pesanan (SP)
        </button>

        <button
          onClick={() => setSubTab("esign")}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 text-[11px] md:text-xs font-bold transition-all cursor-pointer relative shrink-0 ${
            subTab === "esign"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-foreground"
          }`}
        >
          <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          e-Sign Pending
          {esignPendingOrders.length > 0 && (
            <span className="absolute -top-1 md:-top-1.5 -right-0.5 md:-right-1 px-1.5 py-0.5 text-[8px] font-extrabold bg-error text-white rounded-full scale-90 md:scale-100">
              {esignPendingOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab("do")}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 text-[11px] md:text-xs font-bold transition-all cursor-pointer shrink-0 ${
            subTab === "do"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-foreground"
          }`}
        >
          <Truck className="w-3.5 h-3.5 md:w-4 md:h-4" />
          Delivery Order (DO)
        </button>

        <button
          onClick={() => setSubTab("faktur")}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 text-[11px] md:text-xs font-bold transition-all cursor-pointer shrink-0 ${
            subTab === "faktur"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-foreground"
          }`}
        >
          <Receipt className="w-3.5 h-3.5 md:w-4 md:h-4" />
          Invoice &amp; Faktur
        </button>
      </div>

      {/* Content based on subTab */}
      <div className="space-y-4">
        
        {/* TAB: SURAT PESANAN */}
        {subTab === "sp" && (
          <>
            {/* MOBILE VIEW: Card List */}
            <div className="block md:hidden space-y-4">
              {spOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-outline-variant/20 p-8 text-center text-on-surface-variant/50 italic text-xs">
                  Belum ada Surat Pesanan diterbitkan.
                </div>
              ) : (
                spOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="bg-white border border-outline-variant/20 rounded-2xl p-4 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-heading font-extrabold text-xs text-foreground font-mono">{order.orderNumber}</h4>
                        <span className="text-[10px] text-on-surface-variant/75 font-mono block mt-0.5">{new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="shrink-0">
                        {order.spSignature ? (
                          <span className="inline-flex items-center text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                            Telah Ditandatangani
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[9px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase animate-pulse">
                            Butuh Tanda Tangan
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-y border-outline-variant/10 text-xs">
                      <span className="text-on-surface-variant font-medium">Apoteker APJ:</span>
                      <span className="text-foreground font-bold">Apoteker APJ GroovyCare</span>
                    </div>

                    {order.spSignature && (
                      <div className="flex items-center justify-between gap-3 bg-surface-container-lowest border border-outline-variant/10 p-2.5 rounded-xl">
                        <span className="text-[10px] text-on-surface-variant/80 font-bold">Tanda Tangan Digital:</span>
                        <img src={order.spSignature} alt="e-Sign" className="h-6 object-contain font-sans" />
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setViewingDetailOrder(order)}
                        className="w-full py-2 bg-surface-container-high hover:bg-surface-variant text-on-surface-variant font-bold rounded-xl transition-all text-xs border-none cursor-pointer active:scale-95 duration-100 flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Lihat SP
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block bg-white rounded-3xl border border-outline-variant/20 overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-bold">
                    <tr>
                      <th className="px-5 py-4">Nomor SP</th>
                      <th className="px-5 py-4">Tanggal SP</th>
                      <th className="px-5 py-4">Apoteker APJ</th>
                      <th className="px-5 py-4">Status SP</th>
                      <th className="px-5 py-4 text-center">Tanda Tangan</th>
                      <th className="px-5 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                    {spOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-on-surface-variant/50 italic">
                          Belum ada Surat Pesanan diterbitkan.
                        </td>
                      </tr>
                    ) : (
                      spOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-surface-container-low/20 transition-colors h-14">
                          <td className="px-5 py-4 font-bold text-foreground">{order.orderNumber}</td>
                          <td className="px-5 py-4 text-on-surface-variant">
                            {new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-4 font-medium">Apoteker APJ GroovyCare</td>
                          <td className="px-5 py-4">
                            {order.spSignature ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-full uppercase">
                                Telah Ditandatangani
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase animate-pulse">
                                Butuh Tanda Tangan
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {order.spSignature ? (
                              <div className="inline-block p-1 bg-slate-50 border border-outline-variant/10 rounded-lg shadow-sm">
                                <img src={order.spSignature} alt="e-Sign" className="h-6 object-contain" />
                              </div>
                            ) : (
                              <span className="text-on-surface-variant/45 italic">Belum dibubuhkan</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setViewingDetailOrder(order)}
                              className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-lg font-bold text-[10px]"
                            >
                              Lihat SP
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB: E-SIGN PENDING */}
        {subTab === "esign" && (
          <>
            {/* MOBILE VIEW: Card List */}
            <div className="block md:hidden space-y-4">
              {esignPendingOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-outline-variant/20 p-8 text-center text-on-surface-variant/50 italic text-xs">
                  Luar biasa! Tidak ada Surat Pesanan (SP) yang menggantung atau butuh tanda tangan saat ini.
                </div>
              ) : (
                esignPendingOrders.map((order) => {
                  const isColdChain = order.items.some((it: any) => it.product?.name?.includes("Insulin") || it.product?.code?.includes("AMX"));
                  return (
                    <div 
                      key={order.id} 
                      className="bg-white border border-outline-variant/20 rounded-2xl p-4 shadow-sm space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <h4 className="font-heading font-extrabold text-xs text-foreground font-mono flex items-center gap-1.5 flex-wrap">
                            {order.orderNumber}
                            {isColdChain && (
                              <span className="bg-blue-50 text-blue-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider shrink-0">
                                Cold Chain
                              </span>
                            )}
                          </h4>
                          <span className="text-[10px] text-on-surface-variant/75 font-mono block">{new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <span className="text-[9px] font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase shrink-0">Obat Keras</span>
                      </div>

                      <div className="flex justify-between items-center py-2 border-y border-outline-variant/10 text-xs">
                        <span className="text-on-surface-variant font-medium">Jumlah Item:</span>
                        <span className="text-foreground font-bold font-mono">{order.items.length} SKU</span>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCart(order.items.map((it: any) => ({
                              product: products.find((pr) => pr.id === it.productId) || {
                                id: it.productId,
                                name: it.product.name,
                                code: "",
                                activeIngredient: "",
                                price: it.price,
                                category: "",
                                description: "",
                                unit: it.product.unit,
                                totalStock: 999
                              },
                              quantity: it.quantity
                            })));
                            setIsCheckoutOpen(true);
                            setCheckoutError(null);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer border-none active:scale-95 duration-100"
                        >
                          <PenTool className="w-3.5 h-3.5" /> Tanda Tangan SP
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block bg-white rounded-3xl border border-outline-variant/20 overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-bold">
                    <tr>
                      <th className="px-5 py-4">Nomor SP</th>
                      <th className="px-5 py-4">Tanggal Order</th>
                      <th className="px-5 py-4">Golongan Obat</th>
                      <th className="px-5 py-4 text-right">Jumlah Item</th>
                      <th className="px-5 py-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                    {esignPendingOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-on-surface-variant/50 italic">
                          Luar biasa! Tidak ada Surat Pesanan (SP) yang menggantung atau butuh tanda tangan saat ini.
                        </td>
                      </tr>
                    ) : (
                      esignPendingOrders.map((order) => {
                        const isColdChain = order.items.some((it: any) => it.product.name.includes("Insulin") || it.product.code.includes("AMX"));
                        return (
                          <tr key={order.id} className="hover:bg-surface-container-low/20 transition-colors h-14">
                            <td className="px-5 py-4 font-bold text-foreground">
                              {order.orderNumber}
                              {isColdChain && (
                                <span className="ml-2 bg-blue-50 text-blue-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                                  Cold Chain
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-on-surface-variant">
                              {new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-5 py-4 font-medium text-red-600">Obat Keras / Prekursor</td>
                            <td className="px-5 py-4 text-right font-mono font-semibold">{order.items.length} SKU</td>
                            <td className="px-5 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setCart(order.items.map((it: any) => ({
                                    product: products.find((pr) => pr.id === it.productId) || {
                                      id: it.productId,
                                      name: it.product.name,
                                      code: "",
                                      activeIngredient: "",
                                      price: it.price,
                                      category: "",
                                      description: "",
                                      unit: it.product.unit,
                                      totalStock: 999
                                    },
                                    quantity: it.quantity
                                  })));
                                  setIsCheckoutOpen(true);
                                  setCheckoutError(null);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-[10px] font-bold shadow-md cursor-pointer transition-all"
                              >
                                <PenTool className="w-3 h-3" /> Tanda Tangan SP
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB: DELIVERY ORDER (DO) */}
        {subTab === "do" && (
          <>
            {/* MOBILE VIEW: Card List */}
            <div className="block md:hidden space-y-4">
              {doOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-outline-variant/20 p-8 text-center text-on-surface-variant/50 italic text-xs">
                  Belum ada Surat Jalan (DO) diterbitkan.
                </div>
              ) : (
                doOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="bg-white border border-outline-variant/20 rounded-2xl p-4 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-heading font-extrabold text-xs text-foreground font-mono">DO-{order.orderNumber.replace("SP-", "")}</h4>
                        <span className="text-[10px] text-on-surface-variant/75 font-mono block mt-0.5">{order.shippingDate ? new Date(order.shippingDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}</span>
                      </div>
                      <div className="shrink-0">
                        {order.status === "DELIVERED" ? (
                          <span className="inline-flex items-center text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                            Telah Diterima
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[9px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase animate-pulse">
                            Sedang Jalan
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 py-2 border-y border-outline-variant/10 text-xs">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant font-medium">No. Order:</span>
                        <span className="text-foreground font-mono font-bold">{order.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant font-medium">Kurir PBF:</span>
                        <span className="text-foreground font-semibold">Budi Santoso (Cold Chain)</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setViewingDetailOrder(order)}
                        className="w-full py-2 bg-surface-container-high hover:bg-surface-variant text-on-surface-variant font-bold rounded-xl transition-all text-xs border-none cursor-pointer active:scale-95 duration-100 flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">local_shipping</span>
                        Detail DO
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block bg-white rounded-3xl border border-outline-variant/20 overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-bold">
                    <tr>
                      <th className="px-5 py-4">Nomor DO (Surat Jalan)</th>
                      <th className="px-5 py-4">No. Order</th>
                      <th className="px-5 py-4">Tanggal Pengiriman</th>
                      <th className="px-5 py-4">Kurir PBF</th>
                      <th className="px-5 py-4">Status Kirim</th>
                      <th className="px-5 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                    {doOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-on-surface-variant/50 italic">
                          Belum ada Surat Jalan (DO) diterbitkan.
                        </td>
                      </tr>
                    ) : (
                      doOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-surface-container-low/20 transition-colors h-14">
                          <td className="px-5 py-4 font-bold text-foreground">DO-{order.orderNumber.replace("SP-", "")}</td>
                          <td className="px-5 py-4 text-on-surface-variant font-mono">{order.orderNumber}</td>
                          <td className="px-5 py-4 text-on-surface-variant">
                            {order.shippingDate ? new Date(order.shippingDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                          </td>
                          <td className="px-5 py-4 font-medium">Budi Santoso (Armada Cold Chain)</td>
                          <td className="px-5 py-4">
                            {order.status === "DELIVERED" ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-full uppercase">
                                Telah Diterima
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase">
                                Sedang Jalan
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setViewingDetailOrder(order)}
                              className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-lg font-bold text-[10px]"
                            >
                              Detail DO
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB: FAKTUR / INVOICE */}
        {subTab === "faktur" && (
          <>
            {/* MOBILE VIEW: Card List */}
            <div className="block md:hidden space-y-4">
              {fakturOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-outline-variant/20 p-8 text-center text-on-surface-variant/50 italic text-xs">
                  Belum ada Faktur Penjualan diterbitkan.
                </div>
              ) : (
                fakturOrders.map((order) => {
                  const { total: orderTotal } = calculateOrderTotals(order);
                  return (
                    <div 
                      key={order.id} 
                      className="bg-white border border-outline-variant/20 rounded-2xl p-4 shadow-sm space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-heading font-extrabold text-xs text-foreground font-mono">INV/{order.orderNumber.replace("SP-", "")}</h4>
                          <span className="text-[10px] text-on-surface-variant/75 font-mono block mt-0.5">{order.shippingDate ? new Date(order.shippingDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}</span>
                        </div>
                        <span className="inline-flex items-center text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-full uppercase shrink-0">
                          PPN 11% Terbit
                        </span>
                      </div>

                      <div className="space-y-1.5 py-2 border-y border-outline-variant/10 text-xs">
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant font-medium">No. Order:</span>
                          <span className="text-foreground font-mono font-bold">{order.orderNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-on-surface-variant font-medium">Tagihan:</span>
                          <span className="text-primary font-extrabold font-mono text-sm">Rp {orderTotal.toLocaleString("id-ID")}</span>
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setViewingFaktur(order)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-foreground font-bold rounded-xl text-xs shadow-sm cursor-pointer active:scale-95 duration-100"
                        >
                          <Download className="w-3.5 h-3.5 text-primary" /> e-Faktur Pajak
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block bg-white rounded-3xl border border-outline-variant/20 overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-bold">
                    <tr>
                      <th className="px-5 py-4">Nomor Faktur/Kwitansi</th>
                      <th className="px-5 py-4">No. Order</th>
                      <th className="px-5 py-4 text-right">Nominal Tagihan</th>
                      <th className="px-5 py-4 font-center">Status Pajak</th>
                      <th className="px-5 py-4 text-center">Unduh Arsip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                    {fakturOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-on-surface-variant/50 italic">
                          Belum ada Faktur Penjualan diterbitkan.
                        </td>
                      </tr>
                    ) : (
                      fakturOrders.map((order) => {
                        const { total: orderTotal } = calculateOrderTotals(order);
                        return (
                          <tr key={order.id} className="hover:bg-surface-container-low/20 transition-colors h-14">
                            <td className="px-5 py-4 font-bold text-foreground">INV/{order.orderNumber.replace("SP-", "")}</td>
                            <td className="px-5 py-4 text-on-surface-variant font-mono">{order.orderNumber}</td>
                            <td className="px-5 py-4 text-right font-bold font-mono">Rp {orderTotal.toLocaleString("id-ID")}</td>
                            <td className="px-5 py-4 text-center">
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-250 px-2 py-0.5 rounded-full uppercase">
                                PPN 11% Terbit
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <button
                                type="button"
                                onClick={() => setViewingFaktur(order)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-foreground font-bold rounded-lg text-[10px] shadow-sm cursor-pointer"
                              >
                                <Download className="w-3 h-3 text-primary" /> e-Faktur Pajak
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
