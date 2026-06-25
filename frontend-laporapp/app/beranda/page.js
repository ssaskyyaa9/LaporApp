"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebaruser";
import { ambilToken, ambilSemuaLaporan } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const badgeStatus = {
  Menunggu: "bg-blue-100 text-blue-600",
  Dikerjakan: "bg-yellow-100 text-yellow-600",
  Selesai: "bg-green-100 text-green-600",
  Ditolak: "bg-red-100 text-red-500",
};

export default function HalamanBeranda() {
  const router = useRouter();
  const [lebarSidebar, setLebarSidebar] = useState(220);
  const [statistik, setStatistik] = useState({ total: 0, diproses: 0, selesai: 0, ditolak: 0 });
  const [laporan, setLaporan] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [user, setUser] = useState({ username: "", role: "", foto: null });
  const [unread, setUnread] = useState(0);
  const [dropdownTerbuka, setDropdownTerbuka] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = ambilToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ username: decoded.username, role: decoded.role });
      } catch {}
    }

    const ambilData = async () => {
      try {
        const [resStatistik, resLaporan, resUnread, resProfil ] = await Promise.all([
          fetch(`${BASE_URL}/api/statistik`, { headers: { Authorization: `Bearer ${ambilToken()}` } }).then(r => r.json()),
          ambilSemuaLaporan(),
          fetch(`${BASE_URL}/api/notifikasi/unread`, { headers: { Authorization: `Bearer ${ambilToken()}` } }).then(r => r.json()),
          fetch(`${BASE_URL}/api/profile`, { headers: { Authorization: `Bearer ${ambilToken()}` } }).then(r => r.json()),
        ]);
        if (resStatistik?.data) setStatistik(resStatistik.data);
        if (resLaporan?.data) {
          const filtered = resLaporan.data.filter(
            (l) => l.status === "Dikerjakan" || l.status === "Selesai" || l.status === "Menunggu" || l.status === "Ditolak"
          );
          setLaporan(filtered.slice(0, 3));
        }
        setUnread(resUnread?.total_unread || 0);
        if (resProfil?.data) {
          console.log("foto:", resProfil.data.foto);
          setUser({ username: resProfil.data.username, role: resProfil.data.role, foto: resProfil.data.foto });
        }
      } catch (err) {
        console.error(err.message);
      } finally {
        setMemuat(false);
      }
    };
    ambilData();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownTerbuka(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tanganiKeluar = () => {
    router.push("/keluar");
  };

  const inisial = user.username ? user.username.charAt(0).toUpperCase() : "U";

  const kartuStatistik = [
    { label: "Total Laporan", nilai: statistik.total, sub: "Semua laporan yang diajukan", warna: "text-blue-600", bg: "bg-blue-50", icon: "/assets/icons/laporansta.png", iconSize: 25 },
    { label: "Sedang Diproses", nilai: statistik.diproses, sub: "Laporan masih dalam proses", warna: "text-yellow-500", bg: "bg-yellow-50", icon: "/assets/icons/prosessta.png", iconSize: 25},
    { label: "Selesai", nilai: statistik.selesai, sub: "Laporan diselesaikan", warna: "text-green-500", bg: "bg-green-50", icon: "/assets/icons/comment.png", iconSize: 25 },
    { label: "Ditolak", nilai: statistik.ditolak, sub: "Laporan yang ditolak", warna: "text-red-500", bg: "bg-red-50", icon: "/assets/icons/ditolaksta.png", iconSize: 17 },
  ];

  const tips = [
    { icon: "/assets/gambar/fotoberanda.png", judul: "Gunakan foto jelas", desc: "Ambil foto yang jelas agar petugas dapat memahami kondisi dengan baik.", bg: "bg-blue-50" },
    { icon: "/assets/gambar/lokasiberanda.png", judul: "Pastikan Lokasi Akurat", desc: "Pastikan lokasi sesuai dengan titik kejadian agar pelaporan dapat ditindaklanjuti.", bg: "bg-green-50" },
    { icon: "/assets/gambar/kronologiberanda.png", judul: "Jelaskan Kronologi", desc: "Tulis deskripsi masalah secara singkat, jelas, dan sesuai kondisi sebenarnya.", bg: "bg-orange-50", judulWarna: "text-yellow-500" },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar onToggle={(terbuka) => setLebarSidebar(terbuka ? 220 : 64)} unread={unread} />

      <main className="flex-1 transition-all duration-300 min-h-screen" style={{ marginLeft: lebarSidebar }}>
        <header className="bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="bottom-10">
            <h1 className="text-2xl font-bold text-black">Beranda</h1>
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
                  {user.foto ? <img src={user.foto} alt="foto" className="w-full h-full object-cover" /> : inisial}
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
                        {user.foto ? <img src={user.foto} alt="foto" className="w-full h-full object-cover" /> : inisial}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user.username}</p>
                        <span className="inline-block text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full capitalize"> {user.role} </span> </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link href="/profile" onClick={() => setDropdownTerbuka(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-sm text-gray-700">
                      <Image src="/assets/icons/profile (2).png" alt="Profil" width={16} height={16} /> Profil Saya
                    </Link>

                    <button onClick={tanganiKeluar}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-sm text-red-500">
                      <Image src="/assets/icons/keluar.png" alt="Keluar" width={16} height={16} /> Keluar </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="relative bg-blue-600 rounded-2xl mb-5 overflow-hidden p-8 shadow-lg shadow-blue-600/10 flex items-center">
            <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-blue-500 opacity-40 blur-sm pointer-events-none" />
            <div className="absolute right-20 -bottom-16 w-36 h-36 rounded-full bg-blue-700 opacity-60 pointer-events-none" />
            
            <div className="z-10 max-w-xl">
              <div className="bg-white/15 inline-block px-3 py-1 rounded-lg mb-3">
                <span className="text-white text-[10px] font-bold tracking-wider uppercase">Kolaborasi Warga</span>
              </div>
              
              <h2 className="text-2xl font-extrabold text-white leading-tight mb-2">
                Bersama Ciptakan Layanan<br />
                Masyarakat yang Lebih Baik
              </h2>

              <p className="text-blue-100 text-xs leading-relaxed mb-1"> Laporkan keluhan atau masalah di sekitarmu dengan mudah dan cepat. </p> 
              <p className="text-blue-200 text-xs font-medium"> Terima kasih telah bergabung dan mempercayai LaporApp. </p> 
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {kartuStatistik.map((kartu, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 ${kartu.bg} rounded-full flex items-center justify-center shrink-0`}>
                    <Image src={kartu.icon} alt={kartu.label} width={kartu.iconSize} height={kartu.iconSize} />
                  </div>
                  <span className={`text-2xl font-bold ${kartu.warna}`}> {memuat ? "0" : kartu.nilai} </span>
                </div>

                <p className="font-semibold text-gray-700 text-sm">{kartu.label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{kartu.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">Tips Pelaporan</h3>
              <p className="text-gray-400 text-xs">Ikuti tips berikut agar pelaporan Anda mudah ditindaklanjuti.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {tips.map((tip, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 ${tip.bg} rounded-xl`}>
                  <div className="w-18 h-18 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
                    <Image src={tip.icon} alt={tip.judul} width={42} height={42} />
                  </div>

                  <div>
                    <p className={`text-sm font-semibold mb-1 ${tip.judulWarna || "text-gray-800"}`}>{tip.judul}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-sm">Laporan Terbaru</h3>
                <Link href="/semualaporan" className="text-blue-600 text-xs font-semibold hover:underline"> Lihat semua </Link>
              </div>

              {memuat ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : 
              
              laporan.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Image src="/assets/icons/buatyuk.png" alt="Kosong" width={28} height={28} className="opacity-40" />
                  </div>

                  <p className="text-gray-500 text-sm font-medium">Belum ada laporan</p>
                  <p className="text-gray-400 text-xs mt-1">Laporan yang kamu buat akan muncul di sini.</p>
                  <Link href="/buatlaporan" className="mt-4 bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"> Buat Laporan </Link>
                </div>
              ) : 
              
              (
                <div className="flex flex-col divide-y divide-gray-200">
                  {laporan.map((item) => (
                    <Link key={item.id_laporan} href={`/laporan/${item.id_laporan}`}
                      className="group flex items-center gap-4 py-3 hover:bg-gray-50 transition-colors rounded-xl px-2">

                      <div className="w-25 h-23 rounded-xl overflow-hidden bg-gray-100 shrink-0 mr-1">
                        {item.gambar ? (
                          <img src={item.gambar} alt={item.judul} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Image source="/assets/icons/buatlaporan.png" alt="no img" width={24} height={24} className="opacity-30" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 p-1">
                        <p className="font-semibold text-gray-800 text-sm truncate -mt-1">{item.judul}</p>
                        <p className="text-gray-400 text-xs truncate mt-0.5">
                          {item.lokasi?.split(",").slice(0, 5).join(",")}
                        </p>

                        <p className="text-gray-400 text-xs mt-0.5">
                          {new Date(item.created_at).toLocaleDateString("id-ID", {
                            weekday: "long", day: "2-digit", month: "long", year: "numeric"
                          })}{" – "}{new Date(item.created_at).toLocaleTimeString("id-ID", {
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </p>

                        <span className={`inline-block mt-3 text-xs font-semibold px-4 py-1 rounded-md ${badgeStatus[item.status]}`}> {item.status} </span>
                       </div>

                      <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Image src="/assets/icons/bintangkuning.png" alt="bintang" width={25} height={25} />
                <h3 className="font-bold text-gray-800 text-lg">Sorotan Warga</h3>
              </div>

              <p className="text-gray-400 text-xs mb-2 mt-2 leading-relaxed">Laporan dengan apresiasi terbanyak dari warga minggu ini</p>

              <div className="relative rounded-xl overflow-hidden mb-3 h-45 bg-gray-800">
                <Image src="/assets/icons/sorotan.jpeg" alt="Sorotan Warga" fill className="object-cover opacity-80" />
                <span className="absolute top-3 left-4 p-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Image src="/assets/icons/bintangputih.png" alt="bintang" width={12} height={12}/>Paling Bermanfaat
                </span>
              </div>

              <p className="font-bold text-gray-800 text-sm mb-1">Lampu jalan mati di Jl. Merdeka</p>
              <p className="text-gray-400 text-xs mb-3">Jl. Merdeka No. 47, Bogor</p>
              <p className="text-gray-500 text-xs">Dilaporkan oleh <span className="font-semibold text-gray-700">Rico Pratama</span></p>
              <p className="text-gray-400 text-xs mt-0.5">Diselesaikan 1 minggu yang lalu</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}