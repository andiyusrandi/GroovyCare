"use client";

import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Phone, 
  X, 
  Navigation,
  ShieldCheck
} from "lucide-react";
import { triggerHapticImpact } from "@/lib/mobile-haptics";

interface AddressManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: any[];
  selectedAddressId?: string;
  onSelectAddress: (address: any) => void;
  onAddNewAddress: () => void;
  onEditAddress: (address: any) => void;
  onDeleteAddress: (addressId: string) => void;
  onSetMainAddress: (addressId: string) => void;
}

export default function AddressManagerModal({
  isOpen,
  onClose,
  addresses = [],
  selectedAddressId,
  onSelectAddress,
  onAddNewAddress,
  onEditAddress,
  onDeleteAddress,
  onSetMainAddress,
}: AddressManagerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[260] overflow-y-auto flex items-center justify-center p-3 md:p-4 bg-slate-900/40 backdrop-blur-sm font-sans animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden relative animate-slideUp">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MapPin className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-heading font-black text-sm text-slate-900 leading-tight">Alamat Pengiriman</h3>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">Pilih Lokasi &amp; Kontak Penerima Barang</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/60 text-slate-500 transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
          <button
            type="button"
            onClick={() => {
              triggerHapticImpact();
              onAddNewAddress();
            }}
            className="w-full p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-dashed border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Alamat Pengiriman Baru</span>
          </button>

          {addresses.length === 0 ? (
            <div className="text-center py-8 text-slate-400 space-y-1">
              <MapPin className="w-8 h-8 mx-auto stroke-[1.5] text-slate-300" />
              <p className="text-xs font-bold">Belum Ada Alamat Tersimpan</p>
              <p className="text-[10px]">Silakan tambah alamat pengiriman di atas.</p>
            </div>
          ) : (
            addresses.map((addr) => {
              const isSelected = selectedAddressId === addr.id;

              return (
                <div
                  key={addr.id}
                  className={`p-4 rounded-2xl border transition-all relative ${
                    isSelected 
                      ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20" 
                      : "bg-white border-slate-200/90 shadow-2xs hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-black text-xs text-slate-900">{addr.label}</span>
                      {addr.isMain && (
                        <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Alamat Utama
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                        ✓
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-800 leading-snug">{addr.recipientName}</p>
                  <p className="text-[11px] text-slate-600 font-mono mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {addr.recipientPhone}
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {addr.fullAddress}
                  </p>

                  {addr.cdobNote && (
                    <p className="text-[9.5px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {addr.cdobNote}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {!addr.isMain && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHapticImpact();
                            onSetMainAddress(addr.id);
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-emerald-700 transition-colors bg-transparent border-none cursor-pointer"
                        >
                          Set Alamat Utama
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHapticImpact();
                          onEditAddress(addr);
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-blue-700 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      {!addr.isMain && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHapticImpact();
                            onDeleteAddress(addr.id);
                          }}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHapticImpact();
                        onSelectAddress(addr);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs transition-all border-none"
                    >
                      {isSelected ? "Terpilih" : "Gunakan Alamat Ini"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
