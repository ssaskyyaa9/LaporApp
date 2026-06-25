"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebaruser";
import { ambilToken, getLaporanSaya, hapusLaporan, ambilKategori } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const badgeStatus = {
  Menunggu:   { bg: "bg-blue-50 text-blue-700",    label: "Menunggu" },
  Dikerjakan: { bg: "bg-yellow-50 text-yellow-700", label: "Dikerjakan" },
  Selesai:    { bg: "bg-green-50 text-green-700",   label: "Selesai" },
  Ditolak:    { bg: "bg-red-50 text-red-600",       label: "Ditolak" },
};

const warnaKategori = {
  "Infrastruktur":           "bg-[#FFF4DD] text-[#EB9B10]",
  "Lingkungan Hidup":        "bg-[#E2F2E5] text-[#028C60]",
  "Keamanan & Ketertiban":   "bg-[#DBEAFF] text-[#024BC8]",
  "Sosial & Kemasyarakatan": "bg-[#FEDBDC] text-[#E61B25]",
  "Lainnya":                 "bg-[#E8E4FC] text-[#7357E5]",
};

export default function HalamanRiwayatLaporan() {
  const router = useRouter();
  const [lebarSidebar, setLebarSidebar] = useState(220);
  const [user, setUser] = useState({ username: "", role: "", foto: null });
  const [unread, setUnread] = useState(0);
  const [dropdownTerbuka, setDropdownTerbuka] = useState(false);
  const dropdownRef = useRef(null);

  const [laporan, setLaporan] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [memuat, setMemuat] = useState(true);

  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [urutan, setUrutan] = useState("terbaru");

  const [menuTerbuka, setMenuTerbuka] = useState(null);
  const [popupHapus, setPopupHapus] = useState(null);
  const [menghapus, setMenghapus] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const token = ambilToken();
    if (token) {
      try {
        const d = jwtDecode(token);
        setUser({ username: d.username, role: d.role });
      } catch {}
    }

    fetch(`${BASE_URL}/api/notifikasi/unread`, {
      headers: { Authorization: `Bearer ${ambilToken()}` },
    }).then(r => r.json()).then(d => setUnread(d?.total_unread || 0)).catch(() => {});

    fetch(`${BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${ambilToken()}` },
    }).then(r => r.json()).then(d => { if (d?.data) setUser((prev) => ({ ...prev, foto: d.data.foto, username: d.data.username })); }).catch(() => {});
    
    const ambilData = async () => {
      try {
        const [resLaporan, resKategori] = await Promise.all([
          getLaporanSaya(),
          ambilKategori(),
        ]);
        if (resLaporan?.data) setLaporan(resLaporan.data);
        if (resKategori?.data) setKategoriList(resKategori.data);
      } catch (err) {
        console.error(err.message);
      } finally {
        setMemuat(false);
      }
    };
    ambilData();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownTerbuka(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuTerbuka(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tanganiKeluar = () => {
    localStorage.removeItem("token");
    router.push("/masuk");
  };

  const inisial = user.username ? user.username.charAt(0).toUpperCase() : "U";

  const laporanTampil = laporan
    .filter((item) => {
      const cocokSearch = item.judul.toLowerCase().includes(search.toLowerCase()) ||
        item.lokasi.toLowerCase().includes(search.toLowerCase());
      const cocokKategori = filterKategori ? String(item.id_kategori) === filterKategori : true;
      const cocokStatus = filterStatus ? item.status === filterStatus : true;
      return cocokSearch && cocokKategori && cocokStatus;
    })

    .sort((a, b) => {
      const da = new Date(a.created_at);
      const db = new Date(b.created_at);
      return urutan === "terbaru" ? db - da : da - db;
    });

  const tanganiHapus = async () => {
    if (!popupHapus) return;
    setMenghapus(true);
    try {
      await hapusLaporan(popupHapus);
      setLaporan((prev) => prev.filter((l) => l.id_laporan !== popupHapus));
      setPopupHapus(null);
    } catch (err) {
      alert(err.message || "Gagal menghapus laporan.");
    } finally {
      setMenghapus(false);
    }
  };

  const potongAlamat = (lokasi) => {
    const bagian = lokasi.split(",");
    return bagian.slice(0, 2).join(",").trim();
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#EDF3FD" }}>
      <Sidebar onToggle={(terbuka) => setLebarSidebar(terbuka ? 220 : 64)} unread={unread} />

      <main className="flex-1 transition-all duration-300 min-h-screen" style={{ marginLeft: lebarSidebar }}>
        <header className="bg-[#EDF3FD] border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-gray-500"> </div>
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
                  {user.foto ? <img src={user.foto} alt="foto" className="w-full h-full object-cover" /> : inisial}
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden md:block">{user.username}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform duration-200 ${dropdownTerbuka ? "rotate-180" : ""}`}>
                  <path d="M3 5l4 4 4-4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {dropdownTerbuka && (
                <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-2xl shadow-xl w-52 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden">
                        {user.foto ? <img src={user.foto} alt="foto" className="w-full h-full object-cover" /> : inisial}
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

        <div className="p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Riwayat Laporan</h1>
            <p className="text-gray-500 text-sm mt-0.5">Berikut semua laporan yang pernah kamu buat.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-5 w-full">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex-1 max-w-280px shadow-sm focus-within:border-blue-400 transition-all">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari Laporan..."
                className="flex-1 text-sm text-gray-700 outline-none placeholder:text-gray-400 bg-transparent" />
            </div>

            <div className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm max-w-140px hover:border-gray-300 transition-all relative">
              <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}
                className="w-full text-sm text-gray-600 outline-none bg-transparent cursor-pointer pr-5 appearance-none font-medium">
                <option value="">Kategori</option>
                {kategoriList.map((k) => (
                  <option key={k.id_kategori} value={String(k.id_kategori)}>{k.nama_kategori}</option>
                ))}
              </select>
              <div className="absolute right-3 pointer-events-none text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm max-w-130px hover:border-gray-300 transition-all relative">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full text-sm text-gray-600 outline-none bg-transparent cursor-pointer pr-5 appearance-none font-medium">
                <option value="">Status</option>
                <option value="Menunggu">Menunggu</option>
                <option value="Dikerjakan">Dikerjakan</option>
                <option value="Selesai">Selesai</option>
                <option value="Ditolak">Ditolak</option>
              </select>
              <div className="absolute right-3 pointer-events-none text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm max-w-130px hover:border-gray-300 transition-all relative">
              <select value={urutan} onChange={(e) => setUrutan(e.target.value)}
                className="w-full text-sm text-gray-600 outline-none bg-transparent cursor-pointer pr-5 appearance-none font-medium">
                <option value="terbaru">Terbaru</option>
                <option value="terlama">Terlama</option>
              </select>
              <div className="absolute right-3 pointer-events-none text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>
          </div>

          {memuat ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : laporanTampil.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                  <path d="M9 12h6M9 16h6M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M9 4a2 2 0 0 1 4 0H9z" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>

              <p className="text-gray-500 font-semibold mb-1">Tidak ada laporan ditemukan</p>
              <p className="text-gray-400 text-sm">Coba ubah filter atau buat laporan baru.</p>
              <Link href="/buatlaporan" className="inline-block mt-4 bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"> Buat Laporan </Link>
            </div>

          ) : (
            <div className="flex flex-col gap-3" ref={menuRef}>
              {laporanTampil.map((item) => {
                const bisa = item.status === "Menunggu";
                const badge = badgeStatus[item.status] || badgeStatus["Menunggu"];

                return (
                  <div key={item.id_laporan} className="relative w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex items-stretch overflow-hidden">
                    <div className="w-44 shrink-0 m-4 rounded-xl overflow-hidden bg-gray-100" style={{ minHeight: 120 }}>
                      {item.gambar ? (
                        <img src={`${BASE_URL}/uploads/${item.gambar}`} alt={item.judul}
                          className="w-full h-full object-cover" style={{ minHeight: 120 }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50" style={{ minHeight: 120 }}>
                          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="3" stroke="#d1d5db" strokeWidth="1.5"/>
                            <path d="M3 16l5-5 4 4 3-3 6 6" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 py-4 pr-12 pl-2 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${warnaKategori[item.nama_kategori] || "bg-orange-50 text-orange-500"}`}>
                            {item.nama_kategori || "Kategori"}
                          </span>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${badge.bg}`}> {badge.label} </span>
                        </div>

                        <p className="font-bold text-gray-800 text-sm leading-snug mb-1 truncate pr-6">{item.judul}</p>
                        <p className="text-gray-500 text-xs leading-relaxed mb-2" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: "620px", wordBreak: "break-word", }} > {item.deskripsi} </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                            <circle cx="12" cy="9" r="2.5"/>
                          </svg>
                          <p className="text-gray-400 text-xs truncate">{potongAlamat(item.lokasi)}</p>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
                            </svg>
                            <p className="text-gray-400 text-xs">
                              {new Date(item.created_at).toLocaleDateString("id-ID", {
                                weekday: "long", day: "2-digit", month: "long", year: "numeric"
                              })}
                              {" - "}
                              {new Date(item.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>

                          <Link href={`/laporan/${item.id_laporan}`} className="text-blue-600 text-xs font-semibold hover:underline shrink-0 -mr-5"> Lihat detail </Link>
                        </div>
                      </div>
                    </div>

                    {bisa && (
                      <div className="absolute right-3 top-4 shrink-0 z-10">
                        <button onClick={() => setMenuTerbuka(menuTerbuka === item.id_laporan ? null : item.id_laporan)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <Image src="/assets/icons/t3komentar.png" alt="menu" width={15} height={15} />
                        </button>

                        {menuTerbuka === item.id_laporan && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-xl w-36 overflow-hidden z-20">
                            <button onClick={() => { setMenuTerbuka(null); router.push(`/buatlaporan?edit=${item.id_laporan}`); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit
                            </button>

                            <button onClick={() => { setMenuTerbuka(null); setPopupHapus(item.id_laporan); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                              </svg>
                              Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {popupHapus && (
        <div className="fixed inset-0 bg-gray-500/10 backdrop-blur-sm flex items-center justify-center z-50 px-4 transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </div>

            <h3 className="text-base font-bold text-gray-800 text-center mb-1">Hapus Laporan?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">Laporan yang dihapus tidak dapat dikembalikan. Apakah kamu yakin?</p>
            <div className="flex gap-3">
              <button onClick={() => setPopupHapus(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Batal
              </button>

              <button onClick={tanganiHapus} disabled={menghapus}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-70">
                {menghapus ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}