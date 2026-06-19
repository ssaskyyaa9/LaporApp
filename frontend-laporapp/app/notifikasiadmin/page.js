"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SidebarAdmin from "@/components/sidebaradmin";
import { ambilNotifikasi, fetchUnread, markAllRead, deleteNotif, deleteAllNotif } from "@/lib/api";

const STATUS_CONFIG = {
  Selesai: {
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    label: "Laporan sudah diselesaikan",
  },
  Dikerjakan: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    label: "Laporan sedang diproses",
  },
  Ditolak: {
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-700 border border-red-200",
    label: "Laporan ditolak",
  },
  Menunggu: {
    dot: "bg-slate-400",
    badge: "bg-slate-50 text-slate-600 border border-slate-200",
    label: "Laporan baru masuk",
  },
  Disetujui: {
    dot: "bg-blue-400",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    label: "Laporan disetujui",
  },
};

function waktuRelatif(tanggal) {
  const diff = Math.floor((Date.now() - new Date(tanggal)) / 1000);
  if (diff < 60) return `${diff} detik yang lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
  return `${Math.floor(diff / 86400)} hari yang lalu`;
}

export default function NotifikasiAdmin() {
  const router = useRouter();
  const [notifikasi, setNotifikasi] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lebarSidebar, setLebarSidebar] = useState(220);
  const [removing, setRemoving] = useState(null);
  const [hapusSemua, setHapusSemua] = useState(false);

  const muatData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ambilNotifikasi();
      const data = res?.data ?? res;
      setNotifikasi(Array.isArray(data) ? data : []);
    } catch {
      setNotifikasi([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const muatUnread = useCallback(async () => {
    const total = await fetchUnread();
    setUnread(total);
  }, []);

  useEffect(() => {
    muatData();
    muatUnread();
    const tandai = async () => {
      await markAllRead();
      setUnread(0);
    };
    tandai();
  }, [muatData, muatUnread]);

  const tanganiKlikNotif = (notif) => {
    if (notif.id_laporan) {
      router.push(`/laporan/${notif.id_laporan}`);
    }
  };

  const hapusNotif = async (e, id) => {
    e.stopPropagation();
    setRemoving(id);
    setTimeout(async () => {
      await deleteNotif(id);
      setNotifikasi((prev) => prev.filter((n) => n.id_notifikasi !== id));
      setRemoving(null);
    }, 300);
  };

  const hapusSemuaNotif = async () => {
    setHapusSemua(true);
    await deleteAllNotif();
    setNotifikasi([]);
    setHapusSemua(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex">
      <SidebarAdmin onToggle={(t) => setLebarSidebar(t ? 220 : 64)} unread={unread} />
      <main className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: lebarSidebar }} >
        <div className="px-6 py-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Notifikasi</h1>
              <p className="text-sm text-slate-500 mt-1"> Informasi terbaru terkait laporan yang perlu dikelola </p>
            </div>

            {notifikasi.length > 0 && (
              <button onClick={hapusSemuaNotif} disabled={hapusSemua} className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-xl transition-colors disabled:opacity-50" >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus Semua
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 animate-pulse flex gap-4 items-start shadow-sm">
                  <div className="w-3 h-3 rounded-full bg-slate-200 mt-1 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>

          ) : notifikasi.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-9.33-5M13 17v1a3 3 0 01-6 0v-1m6 0H7" />
                </svg>

              </div>
              <p className="text-slate-600 font-medium">Tidak ada notifikasi</p>
              <p className="text-slate-400 text-sm mt-1">Semua notifikasi sudah dibaca atau belum ada laporan baru.</p>
            </div>

          ) : (
            <div className="flex flex-col gap-3">
              {notifikasi.map((notif) => {
                const cfg = STATUS_CONFIG[notif.status] ?? STATUS_CONFIG.Menunggu;
                const isRemoving = removing === notif.id_notifikasi;

                return (
                  <div key={notif.id_notifikasi} onClick={() => tanganiKlikNotif(notif)}
                    className={`bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4 flex items-start gap-4 transition-all duration-300 w-full cursor-pointer hover:border-blue-200 hover:shadow-md active:scale-[0.99] ${isRemoving ? "opacity-0 scale-95 translate-x-4" : "opacity-100 scale-100"} ${!notif.is_read ? "border-l-4 border-l-blue-400" : ""} `} >
                    <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${cfg.dot}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 text-sm">{cfg.label}</p>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}> {notif.status} </span>
                      </div>

                      <p className="text-slate-500 text-sm mt-1 leading-relaxed line-clamp-2"> {notif.pesan} </p>

                      <div className="flex items-center gap-1 mt-2 text-slate-400 text-xs">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {waktuRelatif(notif.tanggal)}
                      </div>
                    </div>

                    <button onClick={(e) => hapusNotif(e, notif.id_notifikasi)}
                      className="shrink-0 w-7 h-7 rounded-lg bg-slate-100 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-slate-400 transition-colors duration-150" aria-label="Hapus notifikasi" >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}