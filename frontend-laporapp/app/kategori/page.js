"use client";

import React from 'react';
import Sidebar from '@/components/sidebaruser';
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ambilToken } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

const BASE_URL = "http://localhost:5000";

export default function KategoriPage() {
  const router = useRouter();
  const [lebarSidebar, setLebarSidebar] = useState(220);
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

    const ambilNotif = async () => {
      try {
        const resUnread = await fetch("http://localhost:5000/api/notifikasi/unread", {
          headers: { Authorization: `Bearer ${ambilToken()}` },
        }).then((r) => r.json());
        setUnread(resUnread?.total_unread || 0);
      } catch (err) {
        console.error(err.message);
      }
    };
    ambilNotif();

    fetch("http://localhost:5000/api/profile", {
      headers: { Authorization: `Bearer ${ambilToken()}` },
    })
    .then(r => r.json())
    .then(d => { if (d?.data) setUser((prev) => ({ ...prev, foto: d.data.foto, username: d.data.username })); })
    .catch(() => {});

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownTerbuka(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tanganiKeluar = () => {
    localStorage.removeItem("token");
    router.push("/masuk");
  };

  const inisial = user.username ? user.username.charAt(0).toUpperCase() : "U";

  const kategoriData = [
    {
      id: "infrastruktur",
      title: "Infrastruktur",
      btnBg: "bg-[#FEEABD]",
      btnText: "text-[#EB9B10]",
      cardHeaderBg: "bg-[#FFF4DD]",
      cardHeaderBorder: "border-amber-100",
      iconCircleBg: "bg-[#F0BB5E]",
      subBg: "bg-[#FFF4DD]",
      subBorder: "border-amber-100",
      iconBtn: "/assets/icons/infraorange.png",
      iconCard: "/assets/icons/infraputih.png",
      cardTitleColor: "text-[#EB9B10]",
      cardDescColor: "text-black",
      subTitleColor: "text-slate-800",
      subDetailColor: "text-slate-500",
      desc: "Kategori ini mencakup laporan yang berkaitan dengan pembangunan, pemeliharaan, dan penyediaan fasilitas fisik dasar yang diperlukan untuk menunjang aktivitas masyarakat.",
      subKategori: [
        { nama: "Transportasi", detail: "Jalan rusak, rambu lalu lintas, jembatan" },
        { nama: "Energi & Listrik", detail: "Jaringan listrik, gardu, pemadaman" },
        { nama: "Fasilitas Pembangunan", detail: "Sekolah, Rumah Sakit, Gedung, Fasum" },
        { nama: "Sarana Air", detail: "Pipa bocor, air bersih, irigasi" },
      ],
    },
    {
      id: "lingkungan",
      title: "Lingkungan Hidup",
      btnBg: "bg-[#E2F2E5]",
      btnText: "text-[#028C60]",
      cardHeaderBg: "bg-[#E2F2E5]",
      cardHeaderBorder: "border-emerald-100",
      iconCircleBg: "bg-[#34BC88]",
      subBg: "bg-[#E2F2E5]",
      subBorder: "border-emerald-100",
      iconBtn: "/assets/icons/lingkunganhijau.png",
      iconCard: "/assets/icons/lingkunganputih.png",
      cardTitleColor: "text-[#028C60]",
      cardDescColor: "text-black",
      subTitleColor: "text-slate-800",
      subDetailColor: "text-slate-500",
      desc: "Kategori ini mencakup laporan yang berkaitan dengan kondisi lingkungan di sekitar kita yang dapat berdampak pada kesehatan dan kenyamanan warga.",
      subKategori: [
        { nama: "Sampah Menumpuk", detail: "Sampah liar, TPS ilegal, polusi bau" },
        { nama: "Pencemaran Lingkungan", detail: "Pencemaran air, udara, limbah pabrik" },
        { nama: "Penebangan Pohon", detail: "Penebangan liar, pohon tumbang" },
        { nama: "Drainase Tersumbat", detail: "Got mampet, banjir selokan" },
      ],
    },
    {
      id: "keamanan",
      title: "Keamanan dan Ketertiban",
      btnBg: "bg-[#DBEAFF]",
      btnText: "text-[#024BC8]",
      cardHeaderBg: "bg-[#DBEAFF]",
      cardHeaderBorder: "border-blue-100",
      iconCircleBg: "bg-[#1158E4]",
      subBg: "bg-[#DBEAFF]",
      subBorder: "border-blue-200",
      iconBtn: "/assets/icons/keamananbiru.png",
      iconCard: "/assets/icons/keamananputih.png",
      cardTitleColor: "text-blue-900",
      cardDescColor: "text-black",
      subTitleColor: "text-slate-800",
      subDetailColor: "text-slate-500",
      desc: "Kategori ini mencakup laporan yang berkaitan dengan upaya memberikan perlindungan kepada masyarakat, penegakan hukum, serta memberikan rasa aman di lingkungan tempat tinggal.",
      subKategori: [
        { nama: "Pengawasan Lingkungan", detail: "Ronda malam, CCTV area umum" },
        { nama: "Perlindungan Masyarakat", detail: "Tindakan kriminal, kekerasan, pelecehan" },
        { nama: "Penanganan Gangguan", detail: "Tawuran, pesta miras, balap liar" },
        { nama: "Ketertiban", detail: "Pelanggaran ijin, pungli" },
      ],
    },
    {
      id: "sosial",
      title: "Sosial dan Kemasyarakatan",
      btnBg: "bg-[#FEDBDC]",
      btnText: "text-[#E61B25]",
      cardHeaderBg: "bg-[#FEDBDC]",
      cardHeaderBorder: "border-red-100",
      iconCircleBg: "bg-[#F44336]",
      subBg: "bg-[#FEDBDC]",
      subBorder: "border-red-200",
      iconBtn: "/assets/icons/sosialmerah.png",
      iconCard: "/assets/icons/sosialputih.png",
      cardTitleColor: "text-[#E61B25]",
      cardDescColor: "text-black",
      subTitleColor: "text-slate-800",
      subDetailColor: "text-slate-500",
      desc: "Kategori ini mencakup seluruh aspek interaksi manusia, termasuk penyelesaian konflik sosial, bantuan konflik, hingga pembangunan kesejahteraan bersama.",
      subKategori: [
        { nama: "Bantuan Sosial", detail: "Salah sasaran, pungutan liar bantuan" },
        { nama: "Konflik Warga", detail: "Perselisihan antar tetangga" },
        { nama: "Kesejahteraan", detail: "Lansia terlantar, anak jalanan" },
        { nama: "Kegiatan", detail: "Izin keramaian, fasilitas sosial" },
      ],
    },
    {
      id: "lainnya",
      title: "Laporan Lainnya",
      btnBg: "bg-[#E8E4FC]",
      btnText: "text-[#7357E5]",
      cardHeaderBg: "bg-[#E8E4FC]",
      cardHeaderBorder: "border-purple-100",
      iconCircleBg: "bg-[#7357E5]",
      subBg: "bg-[#E8E4FC]/60",
      subBorder: "border-purple-200",
      iconBtn: "/assets/icons/lainnyaungu.png",
      iconCard: "/assets/icons/kategorisidebar.png",
      cardTitleColor: "text-[#7357E5]",
      cardDescColor: "text-black",
      subTitleColor: "text-slate-800",
      subDetailColor: "text-slate-500",
      desc: "Pilih opsi ini jika permasalahan Anda tidak termasuk dalam kategori yang tersedia atau Anda ragu menentukan kategori yang tepat.",
      subKategori: [
        { nama: "Informasi Umum", detail: "" },
        { nama: "Aspirasi & Saran", detail: "" },
        { nama: "Administrasi", detail: "" },
        { nama: "Bencana Alam", detail: "" },
        { nama: "Kejadian Unik", detail: "" },
        { nama: "Manajemen", detail: "" },
      ],
    },
  ];

  const scrollToCategory = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="min-h-screen bg-white flex w-full">
      <Sidebar onToggle={(terbuka) => setLebarSidebar(terbuka ? 220 : 64)} unread={unread} />

      <main className="flex-1 transition-all duration-300 min-h-screen w-full" style={{ marginLeft: lebarSidebar }}>
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-bold text-black"></h1>
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

        <div className="p-6 w-full bg-white">
          <section className="mb-8">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kategori Laporan</h1>
            <p className="text-sm text-slate-400 mt-0.5 mb-5">Pilih kategori yang sesuai dengan masalah yang ingin Anda laporkan.</p>

            <div className="grid grid-cols-5 gap-4">
              {kategoriData.map((item) => (
                <button key={item.id} onClick={() => scrollToCategory(item.id)}
                  className={`${item.btnBg} p-5 rounded-xl flex flex-col items-center justify-center text-center gap-3 hover:shadow-md hover:scale-[1.02] transition-all duration-200`}>
                  <div className="w-15 h-15 flex items-center justify-center">
                    <Image src={item.iconBtn} alt={item.title} width={50} height={50} className="object-contain" />
                  </div>
                  <span className={`text-xs font-bold leading-tight ${item.btnText}`}>{item.title}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Kenali Kategori Laporan</h2>
            <p className="text-sm text-gray-500 mt-0.5 mb-6">Informasi lengkap untuk membantu Anda memahami setiap kategori laporan.</p>

            <div className="space-y-6 pb-10">
              {kategoriData.map((kat) => (
                <div key={kat.id} id={kat.id} className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden">
                  <div className={`${kat.cardHeaderBg} border-b ${kat.cardHeaderBorder} p-5 flex gap-4 items-start`}>
                    <div className={`w-12 h-12 rounded-full ${kat.iconCircleBg} shrink-0 flex items-center justify-center shadow-sm`}>
                      <Image src={kat.iconCard} alt={kat.title} width={28} height={28} className="object-contain" />
                    </div>
                    <div className="space-y-1">
                      <h3 className={`font-bold text-base ${kat.cardTitleColor}`}>{kat.title}</h3>
                      <p className={`text-xs leading-relaxed opacity-80 ${kat.cardDescColor}`}>{kat.desc}</p>
                    </div>
                  </div>

                  <div className="p-5 bg-white">
                    <p className="text-1xl font-medium text-black mb-3.5">Contoh laporan yang dapat Anda buat:</p>
                    <div className={`grid gap-3 ${kat.id === "lainnya" ? "grid-cols-6" : "grid-cols-4"}`}>
                      {kat.subKategori.map((sub, sIdx) => (
                        <div key={sIdx} className={`p-3 rounded-lg border ${kat.subBg} ${kat.subBorder} flex flex-col justify-center items-center text-center min-h-68px`}>
                          <h4 className={`text-xs font-bold leading-tight ${kat.subTitleColor}`}>{sub.nama}</h4>
                          {sub.detail && (
                            <p className={`text-[10px] leading-snug font-medium mt-1 ${kat.subDetailColor}`}>{sub.detail}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}