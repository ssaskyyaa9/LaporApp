"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebaruser";
import { ambilProfil, perbaruiProfil, fetchUnread, ambilToken } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HalamanProfile() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [lebarSidebar, setLebarSidebar] = useState(220);
  const [unread,       setUnread]       = useState(0);
  const [profil,       setProfil]       = useState(null);
  const [memuat,       setMemuat]       = useState(true);
  const [menyimpan,    setMenyimpan]    = useState(false);
  const [editMode,     setEditMode]     = useState(false);
  
  // State statistik disesuaikan: total, proses, selesai, ditolak
  const [statistik, setStatistik] = useState({ total: 0, diproses: 0, selesai: 0, ditolak: 0 });
  const [username,     setUsername]    = useState("");
  const [email,        setEmail]       = useState("");
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile,    setFotoFile]    = useState(null);
  const [pesan,        setPesan]       = useState({ tipe: "", teks: "" });

  useEffect(() => {
  const muat = async () => {
    setMemuat(true);
    try {
      const [resProfil, totalUnread, resStatistik] = await Promise.all([
        ambilProfil(),
        fetchUnread(),
        // Ambil data dari endpoint statistik yang sama dengan Beranda
        fetch(`${BASE_URL}/api/statistik`, { 
          headers: { Authorization: `Bearer ${ambilToken()}` } // Pastikan fungsi ambilToken() sudah di-import jika dibutuhkan, atau sesuaikan dengan cara ambil token di profile
        }).then(r => r.json()),
      ]);

      const data = resProfil?.data ?? resProfil;
      setProfil(data);
      setUsername(data?.username ?? "");
      setEmail(data?.email ?? "");
      setUnread(totalUnread);

      // Set statistik langsung dari response Backend
      if (resStatistik?.data) {
        setStatistik(resStatistik.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMemuat(false);
    }
  };
  muat();
}, []);

  const pilihFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const simpan = async () => {
    if (!username.trim() || !email.trim()) {
      setPesan({ tipe: "error", teks: "Username dan email tidak boleh kosong." });
      return;
    }
    
    setMenyimpan(true);
    setPesan({ tipe: "", teks: "" });

    try {
      const formData = new FormData();
      formData.append("username", username.trim());
      formData.append("email", email.trim());
      if (fotoFile) formData.append("foto", fotoFile);

      const hasil = await perbaruiProfil(formData);
      const dataTerupdate = hasil?.data ?? hasil;

      setProfil(dataTerupdate);
      setEditMode(false);
      setFotoFile(null);
      setFotoPreview(null);
      setPesan({ tipe: "sukses", teks: "Profil berhasil diperbarui!" });
      setTimeout(() => setPesan({ tipe: "", teks: "" }), 3500);
    } catch (err) {
      setPesan({ tipe: "error", teks: err.message || "Gagal memperbarui profil." });
    } finally {
      setMenyimpan(false);
    }
  };

  const batal = () => {
    setUsername(profil?.username ?? "");
    setEmail(profil?.email ?? "");
    setFotoPreview(null);
    setFotoFile(null);
    setEditMode(false);
    setPesan({ tipe: "", teks: "" });
  };

  const roleConfig = {
    user:       { label: "Pengguna",      color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500"    },
    admin:      { label: "Admin",         color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-500"   },
    superadmin: { label: "SuperAdmin",    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200",dot: "bg-emerald-500" },
  }[profil?.role] || { label: "Pengguna", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar onToggle={(t) => setLebarSidebar(t ? 220 : 64)} unread={unread} />

      <main className="flex-1 transition-all duration-300 p-6 lg:p-10" style={{ marginLeft: lebarSidebar }}>
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${pesan.teks ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}`}>
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold border ${pesan.tipe === "sukses" ? "bg-white border-emerald-200 text-emerald-700" : "bg-white border-red-200 text-red-600"}`}>
            {pesan.tipe === "sukses" ? (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" /></svg>
            )}
            {pesan.teks}
          </div>
        </div>

        {memuat ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="bg-white rounded-3xl h-450px" />
            <div className="lg:col-span-2 bg-white rounded-3xl h-450px" />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto flex flex-col gap-9 mt-3">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 border-b-4 border-b-blue-600 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-950">Manajemen Profil</h1>
                <p className="text-xs text-slate-400 mt-0.5">Kelola data personal, kredensial keamanan, dan pantau ringkasan aktivitas akun Anda</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                {editMode ? (
                  <>
                    <button onClick={batal} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                      Batal
                    </button>
                    
                    <button onClick={simpan} disabled={menyimpan} className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl transition-colors flex items-center gap-2">
                      {menyimpan && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      Simpan
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditMode(true)} className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl transition-colors flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit Profil
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col items-center p-6 text-center">
                <div className="relative mb-4 mt-2">
                  <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-md overflow-hidden bg-slate-100">
                    {fotoPreview ? (
                      <img src={fotoPreview} alt="preview" className="w-full h-full object-cover" />
                    ) : profil?.foto ? (
                      <img src={`${BASE_URL}/uploads/${profil.foto}`} alt="foto" className="w-full h-full object-cover" />
                    ) : (
                      (profil?.username || "U").charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  {editMode && (
                    <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 rounded-2xl bg-slate-950/60 flex flex-col items-center justify-center gap-1 text-white transition-opacity">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                      <span className="text-[10px] font-medium">Ubah Foto</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={pilihFoto} />
                </div>

                <h2 className="text-base font-bold text-slate-900 truncate max-w-full">{profil?.username}</h2>
                <p className="text-xs text-slate-400 truncate max-w-full mb-3">{profil?.email}</p>

                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleConfig.bg} ${roleConfig.color} ${roleConfig.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dot}`} />
                  {roleConfig.label}
                </div>

                <div className="w-full border-t border-slate-100 my-5" />

                <div className="w-full space-y-2.5 text-left">
                  <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-400">Bergabung Sejak</span>
                    <span className="text-xs font-bold text-slate-700">
                      {profil?.created_at ? new Date(profil.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Informasi Kredensial</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editMode ? (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
                          <div className="flex items-center gap-2.5 bg-white border-2 border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition-all">
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full text-xs font-medium text-slate-800 outline-none" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Email</label>
                          <div className="flex items-center gap-2.5 bg-white border-2 border-slate-200 rounded-xl px-3.5 py-2.5 focus-within:border-blue-500 transition-all">
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-xs font-medium text-slate-800 outline-none" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
                          <div className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-800">{profil?.username || "-"}</div>
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Email</label>
                          <div className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-800">{profil?.email || "-"}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Statistik - Urutan Status: Total Laporan, Diproses, Selesai, Ditolak */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Statistik & Peninjauan Laporan</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-7">
                    <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 text-center">
                      <p className="text-2xl font-black text-blue-600">{statistik.total}</p>
                      <p className="text-[10px] font-bold text-blue-400 uppercase mt-0.5 tracking-wider">Total Laporan</p>
                    </div>
                      <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100 text-center">
                        <p className="text-2xl font-black text-indigo-600">{statistik.diproses}</p>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase mt-0.5 tracking-wider">Diproses</p>
                      </div>
                    <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 text-center">
                      <p className="text-2xl font-black text-emerald-600">{statistik.selesai}</p>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase mt-0.5 tracking-wider">Selesai</p>
                    </div>
                    <div className="bg-red-50/60 rounded-2xl p-4 border border-red-100 text-center">
                      <p className="text-2xl font-black text-red-600">{statistik.ditolak}</p>
                      <p className="text-[10px] font-bold text-red-500 uppercase mt-0.5 tracking-wider">Ditolak</p>
                    </div>
                  </div>

                  {editMode && (
                    <div className="mt-5 bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                      <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-[11px] font-medium text-blue-700 leading-relaxed">
                        Mode pengeditan aktif. Untuk memperbarui avatar, Anda dapat mengeklik foto profil secara langsung di panel bagian kiri.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}