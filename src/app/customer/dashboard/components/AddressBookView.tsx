"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Phone, 
  Navigation,
  ShieldCheck,
  CheckCircle2,
  Building2
} from "lucide-react";
import { triggerHapticImpact } from "@/lib/mobile-haptics";
import AddressFormModal from "@/components/AddressFormModal";

interface AddressBookViewProps {
  institution: any;
  user: any;
}

export default function AddressBookView({ institution, user }: AddressBookViewProps) {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<any>(null);

  const router = useRouter();

  const fetchAddresses = async () => {
    if (!institution?.id) return;
    setLoading(true);
    try {
      const { getShippingAddresses } = await import("@/app/actions/shipping-addresses");
      const res = await getShippingAddresses(institution.id);
      if (res.success) {
        setAddresses(res.addresses);
      }
    } catch (err) {
      console.error("Gagal membaca buku alamat:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [institution?.id]);

  const handleSetMain = async (id: string) => {
    try {
      const { setMainShippingAddress } = await import("@/app/actions/shipping-addresses");
      const res = await setMainShippingAddress(id, institution.id);
      if (res.success) {
        await fetchAddresses();
        router.refresh();
      }
    } catch (err) {
      console.error("Gagal set main address:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus alamat pengiriman ini?")) return;
    try {
      const { deleteShippingAddress } = await import("@/app/actions/shipping-addresses");
      const res = await deleteShippingAddress(id);
      if (res.success) {
        await fetchAddresses();
        router.refresh();
      }
    } catch (err) {
      console.error("Gagal hapus address:", err);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-fadeIn font-sans max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full text-emerald-300 text-[10px] font-black tracking-wider uppercase border border-emerald-400/30">
            <Building2 className="w-3.5 h-3.5" /> Buku Alamat Mitra CDOB
          </div>
          <h1 className="text-lg md:text-xl font-heading font-black tracking-tight">Manajemen Alamat Pengiriman</h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Kelola lokasi pengiriman obat, gudang transit, dan kontak penerima lapangan untuk pemesanan farmasi yang akurat.
          </p>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="font-heading font-black text-sm text-slate-900">Daftar Alamat Tersimpan</h2>
          <p className="text-[11px] text-slate-500">Alamat Utama otomatis digunakan saat Checkout pesanan.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHapticImpact();
            setAddressToEdit(null);
            setIsFormOpen(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md transition-all border-none flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Tambah Alamat Baru</span>
        </button>
      </div>

      {/* List Addresses */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 space-y-2">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold">Membaca daftar alamat tersimpan...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
          <h3 className="font-heading font-black text-sm text-slate-800">Belum Ada Alamat Tambahan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tambahkan alamat pengiriman baru untuk kemudahan checkout ke gudang atau cabang apotek Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-3 relative ${
                addr.isMain 
                  ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/10" 
                  : "border-slate-200/90 shadow-2xs hover:border-slate-300"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-black text-sm text-slate-900">{addr.label}</span>
                    {addr.isMain && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Utama
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-black text-slate-800">{addr.recipientName}</p>
                <p className="text-xs text-slate-600 font-mono flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {addr.recipientPhone}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100 mt-2">
                  {addr.fullAddress}
                </p>

                {addr.cdobNote && (
                  <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> {addr.cdobNote}
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold">
                {!addr.isMain ? (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticImpact();
                      handleSetMain(addr.id);
                    }}
                    className="text-emerald-700 hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Set Alamat Utama
                  </button>
                ) : (
                  <span className="text-emerald-600 text-[10px] font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Alamat Pengiriman Utama
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHapticImpact();
                      setAddressToEdit(addr);
                      setIsFormOpen(true);
                    }}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1"
                    title="Edit Alamat"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {!addr.isMain && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHapticImpact();
                        handleDelete(addr.id);
                      }}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1"
                      title="Hapus Alamat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      <AddressFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        addressToEdit={addressToEdit}
        institutionId={institution?.id}
        onSaveSuccess={fetchAddresses}
      />
    </div>
  );
}
