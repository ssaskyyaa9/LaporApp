"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SidebarAdmin from "@/components/sidebaradmin";
import { ambilToken, ambilSemuaPengguna, hapusPengguna, buatAkunManual, fetchUnread, ambilProfil, perbaruiAkun } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HalamanSemuaAkun() {
  const router = useRouter();
  const dropdownRef = useRef(null);

  const [lebarSidebar, setLebarSidebar] = useState(220);
  const [user, setUser] = useState({ username: "", role: "", foto: null });
  const [unread, setUnread] = useState(0);
  const [dataUser, setDataUser] = useState([]);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dropdownTerbuka, setDropdownTerbuka] = useState(false);

  const [cari, setCari] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUrut, setFilterUrut] = useState("terbaru");

  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [formAkun, setFormAkun] = useState({ username: "", email: "", password: "", role: "user" });
  const [prosesSimpan, setProsesSimpan] = useState(false);

  const [modalEdit, setModalEdit] = useState({ terbuka: false, data: null });
  const [formEdit, setFormEdit] = useState({ username: "", email: "", role: "user" });
  const [prosesEdit, setProsesEdit] = useState(false);

  const [modalHapus, setModalHapus] = useState({ terbuka: false, id: null, username: "" });
  const [prosesHapus, setProsesHapus] = useState(false);

  const muatData = async () => {
    try {
      setLoading(true);
      const [resProfil, resUsers, totalUnread] = await Promise.all([
        ambilProfil(),
        ambilSemuaPengguna(),
        fetchUnread(),
      ]);
      const profil = resProfil?.data ?? resProfil;
      setUser({ username: profil.username, role: profil.role, foto: profil.foto ?? null });
      const dataMentah = resUsers?.data || resUsers || [];
      setDataUser(dataMentah.filter((u) => u.is_verified !== "menunggu"));
      setTotalPending(dataMentah.filter((u) => u.is_verified === "menunggu").length);
      setUnread(totalUnread);
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const token = ambilToken();
    if (!token) { router.push("/masuk"); return; }
    try {
      const decoded = jwtDecode(token);
      if (decoded.role === "user") { router.push("/beranda"); return; }
    } catch { router.push("/masuk"); return; }

    muatData();

    const handleOut = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownTerbuka(false);
    };
    document.addEventListener("mousedown", handleOut);
    return () => document.removeEventListener("mousedown", handleOut);
  }, [router]);

  const tanganiKeluar = () => { localStorage.removeItem("token"); router.push("/masuk"); };

  const bukaEdit = (u) => {
    setFormEdit({ username: u.username, email: u.email, role: u.role || "user" });
    setModalEdit({ terbuka: true, data: u });
  };

  const simpanEdit = async (e) => {
    e.preventDefault();
    setProsesEdit(true);
    try {
      await perbaruiAkun(modalEdit.data.id, formEdit);
      setModalEdit({ terbuka: false, data: null });
      muatData();
    } catch (err) { alert(err.message); }
    finally { setProsesEdit(false); }
  };

  const konfirmasiHapus = async () => {
    setProsesHapus(true);
    try {
      await hapusPengguna(modalHapus.id);
      setDataUser((prev) => prev.filter((u) => u.id !== modalHapus.id));
      setModalHapus({ terbuka: false, id: null, username: "" });
    } catch (err) { alert(err.message); }
    finally { setProsesHapus(false); }
  };

  const simpanAkunBaru = async (e) => {
    e.preventDefault();
    setProsesSimpan(true);
    try {
      await buatAkunManual(formAkun);
      setModalTerbuka(false);
      setFormAkun({ username: "", email: "", password: "", role: "user" });
      muatData();
    } catch (err) { alert(err.message); }
    finally { setProsesSimpan(false); }
  };

  const dataTerfilter = dataUser
    .filter((u) => {
      const cocokCari =
        u.username?.toLowerCase().includes(cari.toLowerCase()) ||
        u.email?.toLowerCase().includes(cari.toLowerCase());
      const cocokRole = filterRole ? u.role === filterRole : true;
      const cocokStatus = filterStatus ? u.is_verified === filterStatus : true;
      return cocokCari && cocokRole && cocokStatus;
    })
    .sort((a, b) => (filterUrut === "terbaru" ? b.id - a.id : a.id - b.id));

  const inisial = user.username ? user.username.charAt(0).toUpperCase() : "A";

  return (
    <div className="min-h-screen bg-white flex">
      <SidebarAdmin onToggle={(t) => setLebarSidebar(t ? 220 : 64)} unread={unread} />

      <main className="flex-1 transition-all duration-300 min-h-screen" style={{ marginLeft: lebarSidebar }}>
        <header className="bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-2xl mt-5 font-bold text-gray-900">Kelola Akun</h1>
            <p className="text-xs text-gray-600 mt-1">Kelola semua akun pengguna dan verifikasi akun baru dalam satu tempat.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/notifikasiadmin" className="relative">
              <div className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
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
                  <path d="M3 5l4 4 4-4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

        <div className="px-6 py-5 mt-5">
          <div className="flex gap-8 mb-1">
            <button onClick={() => router.push("/kelolaakun/verifikasiakun")}
              className="pb-3 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-2" > Verifikasi Akun
              
              {totalPending > 0 && (
                <span className="bg-gray-300 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md"> {totalPending} </span>
              )}
            </button>

            <button className="pb-3 text-sm font-semibold text-blue-600 border-b-2 border-blue-600"> Semua Akun </button>
          </div>

          <p className="text-xs text-gray-400 mt-4 mb-7"> Kelola semua akun yang sudah terdaftar dalam sistem. </p>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2  bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 min-w-52 focus-within:border-blue-400 transition-colors shadow-sm">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>

              <input value={cari} onChange={e => setCari(e.target.value)} placeholder="Cari akun..."
                className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
              />
            </div>

            <div className="relative bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm min-w-40">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5.477-3.727M9 20H4v-2a4 4 0 015.477-3.727M15 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                  className="flex-1 text-xs outline-none appearance-none bg-transparent text-gray-600 cursor-pointer pr-4">
                  <option value="">Posisi</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super admin">Super Admin</option>
                </select>

                <svg className="w-3 h-3 text-gray-400 absolute right-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <div className="relative bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm min-w-36">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 3" />
                </svg>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="flex-1 text-xs outline-none appearance-none bg-transparent text-gray-600 cursor-pointer pr-4">
                  <option value="">Status</option>
                  <option value="diterima">Diterima</option>
                  <option value="ditolak">Ditolak</option>
                </select>
                <svg className="w-3 h-3 text-gray-400 absolute right-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <div className="relative bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm min-w-36">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M7 12h10M11 18h2" />
                </svg>
                <select value={filterUrut} onChange={e => setFilterUrut(e.target.value)}
                  className="flex-1 text-xs outline-none appearance-none bg-transparent text-gray-600 cursor-pointer pr-4">
                  <option value="terbaru">Terbaru</option>
                  <option value="terlama">Terlama</option>
                </select>
                <svg className="w-3 h-3 text-gray-400 absolute right-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <button onClick={() => setModalTerbuka(true)}
              className="bg-white border border-blue-500 text-blue-600 text-xs font-semibold px-4 py-2 rounded-md flex items-center gap-1.5 shadow-sm transition-colors" >
              Buat Akun

              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ minWidth: 700 }}>
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="px-4 py-3 text-xs font-normal text-center w-12">No</th>
                    <th className="px-4 py-3 text-xs font-normal">Nama Pengguna</th>
                    <th className="px-4 py-3 text-xs font-normal">Email</th>
                    <th className="px-4 py-3 text-xs font-normal">Posisi</th>
                    <th className="px-4 py-3 text-xs font-normal text-center right-40">Status</th>
                    <th className="px-4 py-3 text-xs font-normal text-center w-38">Tindakan</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Memuat data...</p>
                      </td>
                    </tr>

                  ) : dataTerfilter.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-sm text-gray-400"> Tidak ada akun yang ditemukan. </td>
                    </tr>
                  ) : (
                    dataTerfilter.map((u, i) => (
                      <tr key={u.id} className={`transition-colors hover:bg-gray-50 ${i % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}>
                        <td className="px-4 py-2.5 text-center text-xs text-black font-medium">
                          {dataTerfilter.length - i}
                        </td>

                        <td className="px-4 py-2.5 text-xs text-black">{u.username}</td>
                        <td className="px-4 py-2.5 text-xs text-black">{u.email}</td>
                        <td className="px-4 py-2.5 text-xs text-black capitalize">{u.role || "user"}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-block text-[11px] font-semibold px-3 py-1.5 rounded-lg ${u.is_verified === "diterima"
                              ? "bg-[#E2F2E5] text-[#2EBC86]"
                              : "bg-[#FEDBDC] text-[#E61B25]"
                            }`}>
                            {u.is_verified === "diterima" ? "Diterima" : "Ditolak"}
                          </span>
                        </td>

                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-4">
                            <button onClick={() => bukaEdit(u)} className="transition-transform hover:scale-110 flex items-center justify-center" title="Edit Akun">
                              <img src="/assets/icons/editakun.png" alt="Edit" width={20} height={20} />
                            </button>

                            <button onClick={() => setModalHapus({ terbuka: true, id: u.id, username: u.username })} className="transition-transform hover:scale-110 flex items-center justify-center" title="Hapus Akun">
                              <img src="/assets/icons/hapusakun.png" alt="Hapus" width={20} height={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {modalTerbuka && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">Buat Akun Baru</h3>

              <button onClick={() => setModalTerbuka(false)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors" >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Pengguna</label>
                <input type="text" required value={formAkun.username}
                  onChange={(e) => setFormAkun({ ...formAkun, username: e.target.value })}
                  placeholder="nama pengguna"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" required value={formAkun.email}
                  onChange={(e) => setFormAkun({ ...formAkun, email: e.target.value })}
                  placeholder="pengguna@gmail.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kata Sandi</label>
                <input type="password" required value={formAkun.password}
                  onChange={(e) => setFormAkun({ ...formAkun, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Posisi</label>
                <div className="relative">
                  <select value={formAkun.role} onChange={(e) => setFormAkun({ ...formAkun, role: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all appearance-none cursor-pointer pr-8" >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super admin">Super Admin</option>
                  </select>

                  <svg className="w-3 h-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => { setModalTerbuka(false); setFormAkun({ username: "", email: "", password: "", role: "user" }); }} className="flex-1 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors" > Batal
              </button>
              
              <button onClick={simpanAkunBaru} disabled={prosesSimpan} className="flex-1 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50" >
                {prosesSimpan ? "Menyimpan..." : "Tambah Akun"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEdit.terbuka && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-800">Edit Akun</h3>

              <button onClick={() => setModalEdit({ terbuka: false, data: null })} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={simpanEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Pengguna</label>
                <input type="text" required value={formEdit.username}
                  onChange={(e) => setFormEdit({ ...formEdit, username: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" required value={formEdit.email}
                  onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Posisi</label>
                <div className="relative">
                  <select value={formEdit.role} onChange={(e) => setFormEdit({ ...formEdit, role: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all appearance-none cursor-pointer pr-8">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super admin">Super Admin</option>
                  </select>

                  <svg className="w-3 h-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button type="button" onClick={() => setModalEdit({ terbuka: false, data: null })}
                  className="flex-1 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
                <button type="submit" disabled={prosesEdit}
                  className="flex-1 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50">
                  {prosesEdit ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalHapus.terbuka && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <h3 className="text-sm font-bold text-gray-800 mb-1">Hapus Akun?</h3>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              Akun <span className="font-semibold text-gray-600">{modalHapus.username}</span> akan dihapus secara permanen dan tidak bisa dikembalikan.
            </p>
            
            <div className="flex gap-2">
              <button onClick={() => setModalHapus({ terbuka: false, id: null, username: "" })}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Batal</button>
              <button onClick={konfirmasiHapus} disabled={prosesHapus}
                className="flex-1 py-2.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50">
                {prosesHapus ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}