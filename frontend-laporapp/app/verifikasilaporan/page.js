"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SidebarAdmin from "@/components/sidebaradmin";
import { ambilToken, ambilSemuaLaporan, ambilKategori, fetchUnread, ambilProfil, updateStatusLaporan } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

const BASE_URL = "http://localhost:5000";

function warnaKategori(nama = "") {
  const k = nama.toLowerCase();
  if (k.includes("infrastruktur"))  return "text-amber-600 bg-amber-50 border-amber-200";
  if (k.includes("lingkungan"))     return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (k.includes("keamanan"))       return "text-blue-600 bg-blue-50 border-blue-200";
  if (k.includes("sosial"))         return "text-red-600 bg-red-50 border-red-200";
  return "text-purple-600 bg-purple-50 border-purple-200";
}

function formatTanggal(str) {
  if (!str) return { tgl: "-", jam: "" };
  const d = new Date(str);
  return {
    tgl: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    jam: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

export default function HalamanVerifikasi() {
  const router = useRouter();
  const dropdownRef = useRef(null);

  const [lebarSidebar,    setLebarSidebar]    = useState(220);
  const [user,            setUser]            = useState({ username: "", role: "", foto: null });
  const [unread,          setUnread]          = useState(0);
  const [laporan,         setLaporan]         = useState([]);
  const [kategori,        setKategori]        = useState([]);
  const [memuat,          setMemuat]          = useState(true);
  const [cari,            setCari]            = useState("");
  const [filterKat,       setFilterKat]       = useState("");
  const [filterUrut,      setFilterUrut]      = useState("terbaru");
  const [prosesId,        setProsesId]        = useState(null);
  const [toastSukses,     setToastSukses]     = useState("");
  const [modalTolak,      setModalTolak]      = useState({ terbuka: false, id: null });
  const [alasanTolak,     setAlasanTolak]     = useState("");
  const [dropdownTerbuka, setDropdownTerbuka] = useState(false);

  useEffect(() => {
    const token = ambilToken();
    if (!token) { router.push("/masuk"); return; }
    try {
      const decoded = jwtDecode(token);
      if (decoded.role === "user") { router.push("/beranda"); return; }
    } catch { router.push("/masuk"); return; }

    const init = async () => {
      try {
        const [resProfil, resLaporan, resKat, totalUnread] = await Promise.all([
          ambilProfil(),
          ambilSemuaLaporan(),
          ambilKategori(),
          fetchUnread(),
        ]);
        const profil = resProfil?.data ?? resProfil;
        setUser({ username: profil.username, role: profil.role, foto: profil.foto ?? null });
        const list = resLaporan?.data ?? [];
        setLaporan(list.filter(l => l.status === "Menunggu"));
        setKategori(resKat?.data ?? []);
        setUnread(totalUnread);
      } catch (err) { console.error(err); }
      finally { setMemuat(false); }
    };
    init();

    const handleOut = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownTerbuka(false);
    };
    document.addEventListener("mousedown", handleOut);
    return () => document.removeEventListener("mousedown", handleOut);
  }, [router]);

  const tanganiKeluar = () => { localStorage.removeItem("token"); router.push("/masuk"); };

  const tampilToast = (pesan) => {
    setToastSukses(pesan);
    setTimeout(() => setToastSukses(""), 2500);
  };

  const tanganiSetuju = async (id) => {
    setProsesId(id);
    try {
      await updateStatusLaporan(id, "Dikerjakan");
      setLaporan(prev => prev.filter(l => l.id_laporan !== id));
      tampilToast("Laporan berhasil disetujui!");
    } catch (err) { alert(err.message); }
    finally { setProsesId(null); }
  };

  const tanganiTolak = async () => {
    if (!alasanTolak.trim()) return alert("Alasan penolakan wajib diisi!");
    const id = modalTolak.id;
    setProsesId(id);
    setModalTolak({ terbuka: false, id: null });
    try {
      await updateStatusLaporan(id, "Ditolak");
      setLaporan(prev => prev.filter(l => l.id_laporan !== id));
      setAlasanTolak("");
      tampilToast("Laporan ditolak.");
    } catch (err) { alert(err.message); }
    finally { setProsesId(null); }
  };

  const tampil = laporan
    .filter(l => {
      const cocokCari = l.judul?.toLowerCase().includes(cari.toLowerCase()) ||
        l.lokasi?.toLowerCase().includes(cari.toLowerCase());
      const cocokKat = filterKat ? l.nama_kategori === filterKat : true;
      return cocokCari && cocokKat;
    })
    .sort((a, b) =>
      filterUrut === "terbaru"
        ? new Date(b.created_at) - new Date(a.created_at)
        : new Date(a.created_at) - new Date(b.created_at)
    );

  const inisial = user.username ? user.username.charAt(0).toUpperCase() : "A";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarAdmin onToggle={(t) => setLebarSidebar(t ? 220 : 64)} unread={unread} />

      <main className="flex-1 transition-all duration-300 min-h-screen" style={{ marginLeft: lebarSidebar }}>

        {/* HEADER — sama persis dengan dashboard */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Verifikasi Laporan</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Tinjau dan verifikasi laporan yang masuk
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/notifikasiadmin" className="relative">
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
                  {user.foto ? <img src={`${BASE_URL}/uploads/${user.foto}`} alt="foto" className="w-full h-full object-cover" /> : inisial}
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden md:block">{user.username}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  className={`transition-transform duration-200 ${dropdownTerbuka ? "rotate-180" : ""}`}>
                  <path d="M3 5l4 4 4-4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {dropdownTerbuka && (
                <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-2xl shadow-xl w-52 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden">
                        {user.foto ? <img src={`${BASE_URL}/uploads/${user.foto}`} alt="foto" className="w-full h-full object-cover" /> : inisial}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user.username}</p>
                        <span className="inline-block text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full capitalize">{user.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link href="/profileadmin" onClick={() => setDropdownTerbuka(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm text-gray-700">
                      <Image src="/assets/icons/profile (2).png" alt="Profil" width={16} height={16} /> Profil Saya
                    </Link>
                    <button onClick={tanganiKeluar}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-sm text-red-500">
                      <Image src="/assets/icons/keluar.png" alt="Keluar" width={16} height={16} /> Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-48 focus-within:border-blue-400 transition-colors shadow-sm">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>

              <input value={cari} onChange={e => setCari(e.target.value)}
                placeholder="Cari Laporan"
                className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder:text-gray-400" />
            </div>

            <div className="relative bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm min-w-36">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>

                <select value={filterKat} onChange={e => setFilterKat(e.target.value)}
                  className="flex-1 text-xs outline-none appearance-none bg-transparent text-gray-600 cursor-pointer pr-4">
                  <option value="">Kategori</option>
                  {kategori.map(k => <option key={k.id_kategori} value={k.nama_kategori}>{k.nama_kategori}</option>)}
                </select>

                <svg className="w-3 h-3 text-gray-400 absolute right-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>

            <div className="relative bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm min-w-32">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M7 12h10M11 18h2"/>
                </svg>

                <select value={filterUrut} onChange={e => setFilterUrut(e.target.value)}
                  className="flex-1 text-xs outline-none appearance-none bg-transparent text-gray-600 cursor-pointer pr-4">
                  <option value="terbaru">Terbaru</option>
                  <option value="terlama">Terlama</option>
                </select>

                <svg className="w-3 h-3 text-gray-400 absolute right-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ minWidth: 900 }}>
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-4 py-3 text-xs font-normal text-center w-12">No</th>
                    <th className="px-4 py-3 text-xs font-normal w-20">Foto</th>
                    <th className="px-4 py-3 text-xs font-normal w-48">Judul Laporan</th>
                    <th className="px-4 py-3 text-xs font-normal w-36">Lokasi</th>
                    <th className="px-4 py-3 text-xs font-normal text-center w-44">Kategori</th>
                    <th className="px-4 py-3 text-xs font-normal w-28">Waktu</th>
                    <th className="px-4 py-3 text-xs font-normal text-center w-24">Status</th>
                    <th className="px-4 py-3 text-xs font-normal text-center w-20">Aksi</th>
                    <th className="px-4 py-3 text-xs font-normal text-center w-14">Lihat</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {memuat ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Memuat data...</p>
                      </td>
                    </tr>

                  ) : tampil.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-sm text-gray-400">
                        Tidak ada laporan yang menunggu verifikasi.
                      </td>
                    </tr>

                  ) : (
                    tampil.map((l, i) => {
                      const { tgl, jam } = formatTanggal(l.created_at);
                      const wKat = warnaKategori(l.nama_kategori);
                      const sedangProses = prosesId === l.id_laporan;
                      const lokasiPendek = l.lokasi
                        ? l.lokasi.split(",").slice(0, 2).join(", ")
                        : "-";

                      return (
                        <tr key={l.id_laporan} className={`transition-colors hover:bg-gray-50 ${i % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}>
                          <td className="px-4 py-3 text-center text-xs text-gray-400 font-medium">
                            {tampil.length - i}
                          </td>

                          <td className="px-4 py-3">
                            <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                              {l.gambar ? (
                                <img src={`${BASE_URL}/uploads/${l.gambar}`} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-800 leading-snug line-clamp-2 max-w-11rem">
                              {l.judul}
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            <p className="text-xs text-black leading-snug line-clamp-2 max-w-8rem">
                              {lokasiPendek}
                            </p>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-md border w-full text-center ${wKat}`}>
                              {l.nama_kategori || "—"}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <p className="text-xs text-black font-medium">{tgl}</p>
                            <p className="text-[12px] text-black mt-0.5">{jam}</p>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                              Menunggu
                            </span>
                          </td>

                          <td className="px-4 py-3 min-w-120px">
                            <div className="flex items-center justify-center gap-1 w-full h-full min-h-40px">
                              {sedangProses ? (
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <button onClick={() => tanganiSetuju(l.id_laporan)} title="Setujui"
                                    className="transition-transform hover:scale-110 flex items-center justify-center">
                                    <Image src="/assets/icons/setujulaporan.png" alt="✓" width={40} height={40} />
                                  </button>

                                  <button onClick={() => setModalTolak({ terbuka: true, id: l.id_laporan })} title="Tolak"
                                    className="transition-transform hover:scale-110 flex items-center justify-center">
                                    <Image src="/assets/icons/tolaklaporan.png" alt="✕" width={60} height={60} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <Link href={`/laporan/${l.id_laporan}`}
                              className="w flex items-center justify-center mx-auto transition-colors">
                              <Image src="/assets/icons/detail.png" alt=">" width={14} height={14} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {toastSukses && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          {toastSukses}
        </div>
      )}

      {modalTolak.terbuka && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">Alasan Penolakan</h3>
              <button onClick={() => { setModalTolak({ terbuka: false, id: null }); setAlasanTolak(""); }}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Tuliskan alasan penolakan. Alasan ini akan dikirimkan sebagai notifikasi kepada pelapor.
            </p>
            <textarea value={alasanTolak} onChange={e => setAlasanTolak(e.target.value)}
              placeholder="Contoh: Foto tidak jelas atau lokasi di luar cakupan..."
              rows={3}
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 resize-none mb-4 placeholder:text-gray-300 transition-all" />
            <div className="flex gap-2">
              <button onClick={() => { setModalTolak({ terbuka: false, id: null }); setAlasanTolak(""); }}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                Batal
              </button>
              <button onClick={tanganiTolak}
                className="flex-1 py-2.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm">
                Kirim & Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
