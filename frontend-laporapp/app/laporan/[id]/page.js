"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/sidebaruser";
import SidebarAdmin from "@/components/sidebaradmin";
import { ambilToken, ambilDetailLaporan, ambilKomentar, buatKomentar, editKomentar, hapusKomentar, fetchUnread, ambilProfil, } from "@/lib/api";
import { jwtDecode } from "jwt-decode";
import Image from "next/image";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const STATUS_STYLE = {
  Menunggu:   { pill: "bg-[#E8F1FD] text-[#024BC8] border border-slate-100",        dot: "bg-blue-600"   },
  Dikerjakan: { pill: "bg-[#FEF6E4] text-[#FDB805] border border-amber-100",        dot: "bg-yellow-600"   },
  Selesai:    { pill: "bg-[#E8F7F0] text-[#34BC88] border border-emerald-100",      dot: "bg-green-600" },
  Ditolak:    { pill: "bg-[#FEDBDC] text-[#E61B25] border border-red-100",          dot: "bg-red-600"     },
};

const CATEGORY_STYLE = {
  "Infrastruktur":             { pill: "bg-[#FEF3C7] text-[#D97706] border-amber-200",   icon: "/assets/icons/infraorange.png"  },
  "Lingkungan Hidup":          { pill: "bg-[#D1FAE5] text-[#059669] border-emerald-200", icon: "/assets/icons/lingkunganhijau.png"     },
  "Keamanan & Ketertiban":     { pill: "bg-[#DBEAFE] text-[#2563EB] border-blue-200",    icon: "/assets/icons/keamananbiru.png"       },
  "Sosial & Kemasyarakatan":   { pill: "bg-[#FFE4E6] text-[#E11D48] border-rose-200",    icon: "/assets/icons/sosialmerah.png"         },
  "Lainnya":                   { pill: "bg-[#EDE9FE] text-[#7C3AED] border-violet-200",  icon: "/assets/icons/lainnyaungu.png"        },
};

const AVATAR_COLORS = [ ["#3B82F6","#1D4ED8"] ];

function avatarColors(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function waktu(tanggal) {
  return new Date(tanggal).toLocaleDateString("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  }) + " · " + new Date(tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function waktuRelatif(tanggal) {
  const diff = Math.floor((Date.now() - new Date(tanggal)) / 1000);
  if (diff < 60)    return `${diff}d lalu`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return `${Math.floor(diff / 86400)}h lalu`;
}

function Avatar({ name = "", foto = null, size = 8, textSize = "text-xs" }) {
  const [c1, c2] = avatarColors(name);
  const inisial = (name || "?").charAt(0).toUpperCase();
  const fotoUrl = foto
    ? (foto.startsWith("http") ? foto : `${BASE_URL}/uploads/${foto}`)
    : null;

  const sizeClass = {
    6:  "w-6 h-6",   7:  "w-7 h-7",   8:  "w-8 h-8",
    9:  "w-9 h-9",   10: "w-10 h-10",
  }[size] ?? `w-${size} h-${size}`;

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden ${textSize}`}
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
    >
      {fotoUrl
        ? <img src={fotoUrl} alt={name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
        : inisial
      }
    </div>
  );
}

export default function HalamanDetailLaporan() {
  const router = useRouter();
  const { id } = useParams();

  const [lebarSidebar,  setLebarSidebar]  = useState(220);
  const [laporan,       setLaporan]       = useState(null);
  const [komentar,      setKomentar]      = useState([]);
  const [inputKomentar, setInputKomentar] = useState("");
  const [mengirim,      setMengirim]      = useState(false);
  const [memuat,        setMemuat]        = useState(true);
  const [user,          setUser]          = useState({ id: null, username: "", role: "", foto: null });
  const [unread,        setUnread]        = useState(0);
  const [menuKomentar,  setMenuKomentar]  = useState(null);
  const [editState,     setEditState]     = useState(null);
  const [inputEdit,     setInputEdit]     = useState("");
  const [imgZoom,       setImgZoom]       = useState(false);

  useEffect(() => {
    const token = ambilToken();
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      setUser({ id: decoded.id, username: decoded.username, role: decoded.role, foto: null });
      ambilProfil()
        .then((res) => {
          const data = res?.data ?? res;
          setUser((prev) => ({ ...prev, foto: data?.foto ?? null }));
        })
        .catch(() => {});
    } catch {}
  }, []);

  const [dropdownTerbuka, setDropdownTerbuka] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleOut = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownTerbuka(false);
    };
    document.addEventListener("mousedown", handleOut);
    return () => document.removeEventListener("mousedown", handleOut);
  }, []);

  const muatData = useCallback(async () => {
    if (!id) return;
    setMemuat(true);
    try {
      const [resLaporan, resKomentar, totalUnread] = await Promise.all([
        ambilDetailLaporan(id),
        ambilKomentar(id),
        fetchUnread(),
      ]);
      setLaporan(resLaporan?.data ?? resLaporan);
      const list = resKomentar?.data ?? resKomentar ?? [];
      setKomentar([...list].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
      setUnread(totalUnread);
    } catch (err) {
      console.error("muatData:", err);
    } finally {
      setMemuat(false);
    }
  }, [id]);

  useEffect(() => { muatData(); }, [muatData]);

  useEffect(() => {
    const handle = (e) => {
      if (!e.target.closest("[data-kmenu]")) setMenuKomentar(null);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const kirimKomentar = async () => {
    if (!inputKomentar.trim() || mengirim) return;
    setMengirim(true);
    try {
      await buatKomentar({ laporan_id: id, isi: inputKomentar.trim() });
      setInputKomentar("");
      const fresh = await ambilKomentar(id);
      const list = fresh?.data ?? fresh ?? [];
      setKomentar([...list].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)));
    } catch (err) { console.error(err); }
    finally { setMengirim(false); }
  };

  const simpanEdit = async () => {
    if (!inputEdit.trim() || !editState) return;
    try {
      await editKomentar(editState.id, inputEdit.trim());
      setKomentar((prev) =>
        prev.map((k) => k.id_komentar === editState.id ? { ...k, isi_komentar: inputEdit.trim() } : k)
      );
      setEditState(null);
      setInputEdit("");
    } catch (err) { console.error(err); }
  };

  const hapus = async (id_komentar) => {
    try {
      await hapusKomentar(id_komentar);
      setKomentar((prev) => prev.filter((k) => k.id_komentar !== id_komentar));
      setMenuKomentar(null);
    } catch (err) { console.error(err); }
  };

  const statusStyle = STATUS_STYLE[laporan?.status] ?? STATUS_STYLE.Menunggu;
  const headerH = 57;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {user.role === "admin" || user.role === "super admin" ? (
        <SidebarAdmin onToggle={(t) => setLebarSidebar(t ? 220 : 64)} unread={unread} />
      ) : (
        <Sidebar onToggle={(t) => setLebarSidebar(t ? 220 : 64)} unread={unread} />
      )}
      <main className="flex-1 transition-all duration-300" style={{ marginLeft: lebarSidebar }}>
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Image src="/assets/icons/back (2).png" alt="Kembali" width={20} height={20} />
            </button>

            <div>
              <h1 className="text-xl font-bold text-gray-900">Detail Laporan</h1>
              {laporan && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{laporan.judul}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/notifikasi" className="relative">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <Image src="/assets/icons/notifhitam.png" alt="Notifikasi" width={20} height={20} />
              </div>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownTerbuka(!dropdownTerbuka)}
                className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                  {user.foto
                    ? <img src={user.foto} alt="foto" className="w-full h-full object-cover" />
                    : user.username?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden md:block">{user.username}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  className={`transition-transform duration-200 ${dropdownTerbuka ? "rotate-180" : ""}`}>
                  <path d="M3 5l4 4 4-4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {dropdownTerbuka && (
                <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-2xl shadow-xl w-52 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden">
                        {user.foto
                          ? <img src={user.foto} alt="foto" className="w-full h-full object-cover" />
                          : user.username?.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user.username}</p>
                        <span className="inline-block text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link href="/profile" onClick={() => setDropdownTerbuka(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm text-gray-700">
                      <Image src="/assets/icons/profile (2).png" alt="Profil" width={16} height={16} /> Profil Saya
                    </Link>
                    <button onClick={() => { localStorage.removeItem("token"); router.push("/masuk"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-sm text-red-500">
                      <Image src="/assets/icons/keluar.png" alt="Keluar" width={16} height={16} /> Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {memuat ? (
          <div className="p-6 flex gap-5">
            <div className="w-72 shrink-0 bg-white rounded-2xl h-600px animate-pulse" />
            <div className="flex-1 flex flex-col gap-4">
              <div className="bg-white rounded-2xl h-48 animate-pulse" />
              <div className="bg-white rounded-2xl h-40 animate-pulse" />
              <div className="bg-white rounded-2xl h-52 animate-pulse" />
            </div>
          </div>
        ) : !laporan ? (
          <div className="p-6 text-center text-gray-400 mt-20">Laporan tidak ditemukan.</div>
        ) : (
          <div className="p-6 flex gap-5 items-start">

            <div className="w-72 shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col"
              style={{ position: "sticky", top: `${headerH + 12}px`, height: `calc(100vh - ${headerH + 24}px)`, }}
            >
              <div className="px-5 pt-5 pb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-800 text-sm">Diskusi</h2>
                  <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"> {komentar.length} </span>
                </div>
              </div>

              <div className="px-4 pb-4 shrink-0">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-3 pr-1.5 py-1.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
                  <Avatar name={user.username} foto={user.foto} size={7} textSize="text-[10px]" />
                  <input value={inputKomentar} onChange={(e) => setInputKomentar(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); kirimKomentar(); } }}
                    placeholder="Tulis komentar..."
                    className="flex-1 text-xs bg-transparent outline-none placeholder:text-gray-400 px-1 py-1"
                  />

                  <button onClick={kirimKomentar} disabled={mengirim || !inputKomentar.trim()}
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center transition-colors shrink-0"
                  >
                    {mengirim
                      ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <svg className="w-4 h-4 text-white translate-x-1px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    }
                  </button>
                </div>
              </div>

              <div className="mx-4 border-t border-gray-100 shrink-0" />

              <div
                className="flex-1 min-h-0 overflow-y-auto py-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {komentar.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 py-10">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-400">Belum ada komentar</p>
                    <p className="text-[11px] text-gray-300">Jadilah yang pertama!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {komentar.map((k) => {
                      const milikSendiri = k.id_users === user.id;
                      const sedangDiedit = editState?.id === k.id_komentar;
                      const fotoKomentar = k.id_users === user.id ? user.foto : (k.foto ?? null);

                      return (
                        <div key={k.id_komentar} className="px-4 py-3 hover:bg-gray-50/80 transition-colors">
                          <div className="flex items-start gap-2.5">
                            <Avatar name={k.username ?? ""} foto={fotoKomentar} size={7} textSize="text-[11px]" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <p className="text-xs font-semibold text-gray-800 leading-tight">{k.username}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">{waktuRelatif(k.tanggal)}</p>
                                </div>
                                {milikSendiri && (
                                  <div className="relative shrink-0" data-kmenu="true">
                                    <button
                                      onClick={() => setMenuKomentar(menuKomentar === k.id_komentar ? null : k.id_komentar)}
                                      className="w-5 h-5 rounded-md hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors"
                                    >
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                        <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                                      </svg>
                                    </button>
                                    {menuKomentar === k.id_komentar && (
                                      <div className="absolute right-0 top-6 bg-white border border-gray-100 rounded-xl shadow-lg w-28 z-20 overflow-hidden py-1" data-kmenu="true">
                                        <button
                                          onClick={() => { setEditState({ id: k.id_komentar }); setInputEdit(k.isi_komentar); setMenuKomentar(null); }}
                                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                          <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                          </svg>
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => hapus(k.id_komentar)}
                                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                          </svg>
                                          Hapus
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {sedangDiedit ? (
                                <div className="mt-2 flex flex-col gap-1.5">
                                  <textarea
                                    value={inputEdit}
                                    onChange={(e) => setInputEdit(e.target.value)}
                                    rows={3}
                                    className="w-full text-xs bg-gray-50 border border-blue-300 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                                  />
                                  <div className="flex gap-1.5">
                                    <button onClick={simpanEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold py-1.5 rounded-lg transition-colors">Simpan</button>
                                    <button onClick={() => { setEditState(null); setInputEdit(""); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-semibold py-1.5 rounded-lg transition-colors">Batal</button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{k.isi_komentar}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-5 min-w-0">

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 md:p-8">
                  
                  <div className="flex items-center justify-between mb-5">
                    {(() => {
                      const cat = CATEGORY_STYLE[laporan.nama_kategori] ?? CATEGORY_STYLE["Lainnya"];
                      return (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold border px-3.5 py-1.5 rounded-full shadow-sm ${cat.pill}`}>
                          <Image src={cat.icon} alt={laporan.nama_kategori} width={14} height={14} />
                          {laporan.nama_kategori || "Kategori"}
                        </span>
                      );
                    })()}
                    <span className={`inline-flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-full border shadow-sm ${statusStyle.pill}`}>
                      <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                      {laporan.status}
                    </span>
                  </div>

                  <h2 className="text-2xl font-extrabold text-gray-900 leading-snug tracking-tight mb-6">
                    {laporan.judul}
                  </h2>

                  <div className="border-t border-gray-200 pt-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={laporan.username ?? ""} foto={laporan.foto ?? null} size={10} textSize="text-xs" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase">Dilaporkan oleh</p>
                        <p className="text-sm font-extrabold text-gray-800">{laporan.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {waktu(laporan.created_at)}
                    </div>
                  </div>

                </div>
              </div>

              {laporan.gambar && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden cursor-zoom-in" onClick={() => setImgZoom(true)}>
                  <div className="relative h-80 group">
                    <img src={laporan.gambar} alt={laporan.judul} className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                        </svg>
                        Perbesar gambar
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-6 py-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7"/>
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">Deskripsi Laporan</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line px-1">{laporan.deskripsi}</p>
              </div>

              {laporan.lokasi && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-800">Lokasi Kejadian</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{laporan.lokasi}</p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(laporan.lokasi)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors shrink-0"
                    >
                      Buka di Maps
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                      </svg>
                    </a>
                  </div>
                  <div className="h-56">
                    <iframe
                      title="Lokasi" width="100%" height="100%"
                      style={{ border: 0 }} loading="lazy" allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(laporan.lokasi)}&output=embed`}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </main>

      {imgZoom && laporan?.gambar && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 cursor-zoom-out" onClick={() => setImgZoom(false)}>
          <img src={laporan.gambar} alt={laporan?.judul} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
          <button onClick={() => setImgZoom(false)} className="absolute top-5 right-5 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center justify-center text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2">
            <p className="text-white text-xs font-medium">{laporan.judul}</p>
          </div>
        </div>
      )}
    </div>
  );
}