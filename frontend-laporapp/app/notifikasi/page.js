"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebaruser";

const BASE_URL = "http://localhost:5000";

function ambilToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${ambilToken()}`,
});

async function fetchNotifikasi() {
  const res = await fetch(`${BASE_URL}/api/notifikasi`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal mengambil notifikasi.");
  return data.data;
}

async function fetchUnread() {
  const res = await fetch(`${BASE_URL}/api/notifikasi/unread`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) return 0;
  return data.total_unread;
}

async function markAllRead() {
  await fetch(`${BASE_URL}/api/notifikasi/read-all`, {
    method: "PATCH",
    headers: authHeader(),
  });
}

async function deleteNotif(id) {
  await fetch(`${BASE_URL}/api/notifikasi/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
}

const STATUS_CONFIG = {
  Selesai: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    label: "Laporan Selesai",
  },
  Dikerjakan: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    label: "Laporan Sedang Diproses",
  },
  Ditolak: {
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-700 border border-red-200",
    label: "Laporan Ditolak",
  },
  Menunggu: {
    dot: "bg-slate-400",
    badge: "bg-slate-50 text-slate-600 border border-slate-200",
    label: "Laporan Menunggu Ditinjau",
  },
};

function waktuRelatif(tanggal) {
  const now = new Date();
  const tgl = new Date(tanggal);
  const diff = Math.floor((now - tgl) / 1000);
  if (diff < 60) return `${diff} detik yang lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
  return `${Math.floor(diff / 86400)} hari yang lalu`;
}

export default function HalamanNotifikasi() {
  const router = useRouter(); // Inisialisasi router Next.js
  const [notifikasi, setNotifikasi] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarTerbuka, setSidebarTerbuka] = useState(true);
  const [removing, setRemoving] = useState(null);

  const muatData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchNotifikasi();
      setNotifikasi(data);
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

    const tandaiSemua = async () => {
      await markAllRead();
      setUnread(0);
    };
    tandaiSemua();
  }, [muatData, muatUnread]);

  const hapusNotif = async (e, id) => {
    e.stopPropagation();
    setRemoving(id);
    setTimeout(async () => {
      try {
        await deleteNotif(id);
        setNotifikasi((prev) => prev.filter((n) => n.id_notifikasi !== id));
      } catch (err) {
        console.error(err);
      } finally {
        setRemoving(null);
      }
    }, 300);
  };

  const tanganiKlikNotif = (notif) => {
    if (notif.id_laporan) {
      router.push(`/laporan/${notif.id_laporan}`); 
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex">
      <Sidebar onToggle={setSidebarTerbuka} unread={unread} />

      <main
        className="flex-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarTerbuka ? "220px" : "64px" }}
      >
        <div className="px-6 py-10">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Notifikasi</h1>
            <p className="text-sm text-slate-500 mt-1">
              Informasi terbaru terkait laporan yang perlu dikelola
            </p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 animate-pulse flex gap-4 items-start shadow-sm"
                >
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
              <p className="text-slate-400 text-sm mt-1">Semua notifikasi sudah dibaca atau belum ada laporan.</p>
            </div>

          ) : (
            <div className="flex flex-col gap-3">
              {notifikasi.map((notif) => {
                const cfg = STATUS_CONFIG[notif.status] ?? STATUS_CONFIG.Menunggu;
                const isRemoving = removing === notif.id_notifikasi;

                return (
                  <div key={notif.id_notifikasi} onClick={() => tanganiKlikNotif(notif)}
                    className={`bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4 flex items-start gap-4 transition-all duration-300 w-full cursor-pointer hover:border-blue-200 hover:shadow-md active:scale-[0.99] ${isRemoving ? "opacity-0 scale-95 translate-x-4" : "opacity-100 scale-100"} ${!notif.is_read ? "border-l-4 border-l-blue-400" : ""} `} >

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 text-sm">{cfg.label}</p>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}> {notif.status} </span>
                      </div>

                      <p className="text-slate-500 text-sm mt-1 leading-relaxed line-clamp-2"> {notif.pesan} </p>
                      <div className="flex items-center gap-1 mt-2 text-slate-400 text-xs">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg>
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