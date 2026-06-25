"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SidebarAdmin from "@/components/sidebaradmin";
import { ambilToken, ambilSemuaLaporan, ambilKategori, fetchUnread, updateStatusLaporan } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

function warnaKategori(nama = "") {
  const k = nama.toLowerCase();
  if (k.includes("infrastruktur")) return "text-amber-600 bg-amber-50 border-amber-200";
  if (k.includes("lingkungan")) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (k.includes("keamanan")) return "text-blue-600 bg-blue-50 border-blue-200";
  if (k.includes("sosial")) return "text-red-600 bg-red-50 border-red-200";
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

export default function HalamanDataLaporan() {
  const router = useRouter();

  const [lebarSidebar, setLebarSidebar] = useState(220);
  const [unread, setUnread] = useState(0);
  const [laporan, setLaporan] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [cari, setCari] = useState("");
  const [filterKat, setFilterKat] = useState("");
  const [filterUrut, setFilterUrut] = useState("terbaru");
  const [filterStatus, setFilterStatus] = useState("");
  const [prosesId, setProsesId] = useState(null);
  const [toastSukses, setToastSukses] = useState("");

  const initData = async () => {
    setMemuat(true);
    try {
      const token = ambilToken();
      if (!token) { router.push("/masuk"); return; }

      const decoded = jwtDecode(token);
      if (decoded.role === "user") { router.push("/beranda"); return; }

      const [resLaporan, resKat, totalUnread] = await Promise.all([
        ambilSemuaLaporan(),
        ambilKategori(),
        fetchUnread(),
      ]);

      const list = resLaporan?.data ?? [];
      setLaporan(list.filter(l => l.status === "Dikerjakan" || l.status === "Selesai"));
      setKategori(resKat?.data ?? []);
      setUnread(totalUnread);
    } catch (err) {
      console.error("Gagal memuat data laporan:", err);
    } finally {
      setMemuat(false);
    }
  };

  useEffect(() => {
    initData();
  }, [router]);

  const tampilToast = (pesan) => {
    setToastSukses(pesan);
    setTimeout(() => setToastSukses(""), 2500);
  };

  const tanganiSelesai = async (id) => {
    if (!confirm("Apakah Anda yakin laporan ini sudah selesai dikerjakan?")) return;
    setProsesId(id);
    try {
      await updateStatusLaporan(id, "Selesai");
      tampilToast("Laporan telah dinyatakan Selesai!");
      setLaporan(prev =>
        prev.map(l => (l.id_laporan === id ? { ...l, status: "Selesai" } : l))
      );
    } catch (err) {
      alert("Gagal memperbarui status: " + err.message);
    } finally {
      setProsesId(null);
    }
  };

  const tanganiExportPDF = () => {
    window.print();
  };

  const tampil = laporan
    .filter(l => {
      const cocokCari = l.judul?.toLowerCase().includes(cari.toLowerCase()) ||
        l.lokasi?.toLowerCase().includes(cari.toLowerCase());
      const cocokKat = filterKat ? l.nama_kategori === filterKat : true;
      const cocokStatus = filterStatus ? l.status === filterStatus : true;
      return cocokCari && cocokKat && cocokStatus;
    })
    .sort((a, b) =>
      filterUrut === "terbaru"
        ? new Date(b.created_at) - new Date(a.created_at)
        : new Date(a.created_at) - new Date(b.created_at)
    );

  return (
    <div className="min-h-screen bg-white flex print:bg-white">
      <div className="print:hidden">
        <SidebarAdmin onToggle={(t) => setLebarSidebar(t ? 220 : 64)} unread={unread} />
      </div>

      <main className="flex-1 transition-all duration-300 min-h-screen print:ml-0" style={{ marginLeft: lebarSidebar }}>
        <header className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Laporan</h1>
            <p className="text-xs text-gray-600 mt-2">Pantau progress tindak lanjut dan penyelesaian laporan masuk</p>
          </div>

          <button onClick={tanganiExportPDF}
            className="bg-[#EF291A] hover:bg-[#c31101] mt-7 text-white font-medium text-xs px-4 py-2 rounded-md transition-colors flex items-center gap-2 shadow-sm">Export PDF
          </button>
        </header>

        <div className="hidden print:block text-center my-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-wide">LAPORAN DATA PROSES & SELESAI</h1>
          <p className="text-xs text-gray-500 mt-1">Sistem Informasi Pengaduan Masyarakat (LaporApp)</p>
          <p className="text-[11px] text-gray-400">Tanggal Cetak: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
          <hr className="border-gray-300 mt-4" />
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap print:hidden">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-3 py-2 flex-1 min-w-48 focus-within:border-blue-400 transition-colors shadow-sm">
              <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input value={cari} onChange={e => setCari(e.target.value)} placeholder="Cari Laporan berdasarkan judul / lokasi..."
                className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
              />
            </div>

            <div className="relative bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm min-w-36">
              <div className="flex items-center gap-2">
                <select value={filterKat} onChange={e => setFilterKat(e.target.value)}
                  className="flex-1 text-xs outline-none appearance-none bg-transparent text-gray-600 cursor-pointer pr-4">
                  <option value="">Semua Kategori</option>
                  {kategori.map(k => <option key={k.id_kategori} value={k.nama_kategori}>{k.nama_kategori}</option>)}
                </select>
                <svg className="w-3 h-3 text-gray-400 absolute right-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <div className="relative bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm min-w-36">
              <div className="flex items-center gap-2">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="flex-1 text-xs outline-none appearance-none bg-transparent text-gray-600 cursor-pointer pr-4">
                  <option value="">Semua Status</option>
                  <option value="Dikerjakan">Dikerjakan</option>
                  <option value="Selesai">Selesai</option>
                </select>
                <svg className="w-3 h-3 text-gray-400 absolute right-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            <div className="relative bg-white border border-gray-200 rounded-md px-3 py-2 shadow-sm min-w-32">
              <div className="flex items-center gap-2">
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

          <div className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden print:border-none print:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ minWidth: 900 }}>
                <thead>
                  <tr className="bg-blue-600 text-white print:bg-gray-100 print:text-black">
                    <th className="px-4 py-3 text-xs font-normal text-center w-12">No</th>
                    <th className="px-4 py-3 text-xs font-normal w-20">Foto</th>
                    <th className="px-4 py-3 text-xs font-normal w-48">Judul Laporan</th>
                    <th className="px-4 py-3 text-xs font-normal w-36">Lokasi</th>
                    <th className="px-4 py-3 text-xs font-normal text-center w-36">Kategori</th>
                    <th className="px-4 py-3 text-xs font-normal w-28">Waktu</th>
                    <th className="px-4 py-3 text-xs font-normal text-center w-24">Status</th>
                    <th className="px-4 py-3 text-xs font-normal text-center w-24 print:hidden">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {memuat ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Memuat data laporan...</p>
                      </td>
                    </tr>
                  ) : tampil.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-xs text-gray-400">Tidak ada riwayat data laporan yang terdaftar.</td>
                    </tr>
                  ) : (
                    tampil.map((l, i) => {
                      const { tgl, jam } = formatTanggal(l.created_at);
                      const wKat = warnaKategori(l.nama_kategori);
                      const sedangProses = prosesId === l.id_laporan;
                      const lokasiPendek = l.lokasi ? l.lokasi.split(",").slice(0, 2).join(", ") : "-";

                      return (
                        <tr
                          key={l.id_laporan}
                          onClick={() => router.push(`/laporan/${l.id_laporan}`)}
                          className={`transition-colors hover:bg-gray-50 cursor-pointer ${i % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}
                        >
                          <td className="px-4 py-3 text-center text-xs text-gray-400 font-medium">{tampil.length - i}</td>

                          <td className="px-4 py-3">
                            <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                              {l.gambar ? (
                                <img src={l.gambar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-gray-400">No Photo</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-2">{l.judul}</p>
                          </td>

                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-600 leading-snug line-clamp-2">{lokasiPendek}</p>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block text-[10px] font-semibold px-2.5 py-1 rounded-md border text-center ${wKat}`}>{l.nama_kategori || "—"}</span>
                          </td>

                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-800 font-medium">{tgl}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{jam}</p>
                          </td>

                          <td className="px-4 py-3 text-center">
                            {l.status === "Selesai" ? (
                              <span className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">Selesai</span>
                            ) : (
                              <span className="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-100">Dikerjakan</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center print:hidden" onClick={e => e.stopPropagation()}>
                            {sedangProses ? (
                              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            ) : l.status === "Dikerjakan" ? (
                              <button onClick={() => tanganiSelesai(l.id_laporan)}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-[10px] px-2.5 py-1.5 rounded-md transition-all shadow-sm active:scale-95"
                                title="Selesaikan Laporan Ini">Selesaikan
                              </button>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Selesai Ditinjau</span>
                            )}
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
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in-down">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toastSukses}
        </div>
      )}
    </div>
  );
}