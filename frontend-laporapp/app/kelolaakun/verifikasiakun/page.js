"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SidebarAdmin from "@/components/sidebaradmin";
import { ambilToken, ambilSemuaPengguna, verifikasiAkun, fetchUnread, ambilProfil } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

const BASE_URL = "http://localhost:5000";

export default function HalamanVerifikasiAkun() {
  const router = useRouter();
  const dropdownRef = useRef(null);

  const [lebarSidebar, setLebarSidebar] = useState(220);
  const [user, setUser] = useState({ username: "", role: "", foto: null });
  const [unread, setUnread] = useState(0);
  const [dataUser, setDataUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState("");
  const [filterPosisi, setFilterPosisi] = useState("");
  const [filterUrut, setFilterUrut] = useState("terbaru");
  const [dropdownTerbuka, setDropdownTerbuka] = useState(false);
  const [toastSukses, setToastSukses] = useState("");
  const [modal, setModal] = useState({ terbuka: false, id: null, username: "", aksi: null });

  useEffect(() => {
    const token = ambilToken();
    if (!token) { router.push("/masuk"); return; }
    try {
      const decoded = jwtDecode(token);
      if (decoded.role === "user") { router.push("/beranda"); return; }
    } catch { router.push("/masuk"); return; }

    const init = async () => {
      try {
        const [resProfil, resUsers, totalUnread] = await Promise.all([
          ambilProfil(),
          ambilSemuaPengguna(),
          fetchUnread(),
        ]);
        const profil = resProfil?.data ?? resProfil;
        setUser({ username: profil.username, role: profil.role, foto: profil.foto ?? null });
        const dataMentah = resUsers?.data || resUsers || [];
        setDataUser(dataMentah.filter((u) => u.is_verified === "menunggu"));
        setUnread(totalUnread);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
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

  const konfirmasiAksi = (id, username, aksi) => {
    setModal({ terbuka: true, id, username, aksi });
  };

  const tanganiVerifikasi = async () => {
    const { id, aksi } = modal;
    setModal({ terbuka: false, id: null, username: "", aksi: null });
    try {
      await verifikasiAkun(id, aksi);
      setDataUser((prev) => prev.filter((u) => u.id !== id));
      tampilToast(aksi === "diterima" ? "Akun berhasil diterima!" : "Akun ditolak.");
    } catch (err) {
      alert(err.message);
    }
  };

  const dataTerfilter = dataUser
    .filter((u) => {
      const cocokCari =
        u.username?.toLowerCase().includes(cari.toLowerCase()) ||
        u.email?.toLowerCase().includes(cari.toLowerCase());
      const cocokPosisi = filterPosisi ? u.role === filterPosisi : true;
      return cocokCari && cocokPosisi;
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
                      <Image src="/assets/icons/profile (2).png" alt="Profil" width={16} height={16}/> Profil Saya
                    </Link>

                    <button onClick={tanganiKeluar}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-sm text-red-500">
                      <Image src="/assets/icons/keluar.png" alt="Keluar" width={16} height={16}/> Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-6 py-5 bg-white mt-5">
          <div className="flex gap-8 mb-1">
            <button className="pb-3 text-sm font-semibold text-blue-600 border-b-2 border-blue-600 flex items-center gap-2">
              Verifikasi Akun
              {dataUser.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md"> {dataUser.length} </span>
              )}
            </button>

            <button onClick={() => router.push("/kelolaakun/semuakun")} className="pb-3 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors" > Semua Akun </button>
          </div>

          <p className="text-xs text-gray-400 mt-4 mb-7"> Daftar akun baru yang perlu diverifikasi. Verifikasi untuk memberikan akses ke sistem. </p>

          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2  bg-white border border-gray-200 rounded-md px-3 py-2 flex-1 min-w-52 focus-within:border-blue-400 transition-colors shadow-sm">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>

              <input value={cari} onChange={e => setCari(e.target.value)} placeholder="Cari akun..."
                className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
              />
            </div>

            <div className="relative bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm min-w-40">
              <div className="flex items-center gap-2">
                <Image src="/assets/icons/role.png" alt="role" width={15} height={15}/>

                <select value={filterPosisi} onChange={e => setFilterPosisi(e.target.value)}
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
                    <th className="px-4 py-3 text-xs font-normal text-center w-38">Aksi</th>
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
                      <td colSpan={6} className="py-16 text-center text-sm text-gray-400"> Tidak ada akun yang menunggu verifikasi. </td>
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
                          <span className="inline-block text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100"> Menunggu </span>
                        </td>

                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => konfirmasiAksi(u.id, u.username, "diterima")} title="Terima Akun" className="transition-transform hover:scale-110 flex items-center justify-center" >
                              <Image src="/assets/icons/setujulaporan.png" alt="Terima" width={21} height={21} />
                            </button>

                            <button onClick={() => konfirmasiAksi(u.id, u.username, "ditolak")} title="Tolak Akun" className="transition-transform hover:scale-110 flex items-center justify-center" >
                              <Image src="/assets/icons/tolaklaporan.png" alt="Tolak" width={30} height={30} />
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

      {toastSukses && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toastSukses}
        </div>
      )}

      {modal.terbuka && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl p-6">
            <div className="flex flex-col items-center text-center mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${modal.aksi === "diterima" ? "bg-emerald-100" : "bg-red-100"
                }`}>
                {modal.aksi === "diterima" ? (
                  <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              <h3 className="text-sm font-bold text-gray-800 mb-1"> {modal.aksi === "diterima" ? "Terima Akun?" : "Tolak Akun?"} </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {modal.aksi === "diterima"
                  ? <><span className="font-semibold text-gray-600">{modal.username}</span> akan diberikan akses ke sistem.</>
                  : <><span className="font-semibold text-gray-600">{modal.username}</span> akan ditolak dan tidak dapat mengakses sistem.</>
                }
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setModal({ terbuka: false, id: null, username: "", aksi: null })}
                className="flex-1 py-2.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors" > Batal
              </button>

              <button onClick={tanganiVerifikasi} className={`flex-1 py-2.5 text-xs font-semibold text-white rounded-xl transition-colors shadow-sm ${modal.aksi === "diterima" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600" }`} >
                {modal.aksi === "diterima" ? "Ya, Terima" : "Ya, Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}