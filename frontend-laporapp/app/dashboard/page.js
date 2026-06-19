"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SidebarAdmin from "@/components/sidebaradmin";
import { ambilToken, ambilStatistikAdmin, ambilGrafikHarian, ambilGrafikKategori, fetchUnread, ambilProfil } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

const BASE_URL = "http://localhost:5000";

const KATEGORI_COLORS = {
  "Infrastruktur":          "#F59E0B",
  "Lingkungan Hidup":        "#10B981",
  "Keamanan & Ketertiban":   "#3B82F6",
  "Sosial & Kemasyarakatan": "#EF4444",
  "Lainnya":                 "#8B5CF6",
};

function formatLabel(str, total) {
  const d = new Date(str);
  if (total > 14) return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  return d.toLocaleDateString("id-ID", { weekday: "short" });
}

function BarChart({ data }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-full text-gray-300 text-sm">Tidak ada data</div>
  );

  const W = 600, H = 180, padL = 36, padR = 12, padT = 20, padB = 36;
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const barW = Math.max(8, ((W - padL - padR) / data.length) * 0.55);
  const gap  = (W - padL - padR) / data.length;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(p => ({
    y: padT + (1 - p) * (H - padT - padB),
    val: Math.round(p * maxVal),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
      </defs>

      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={padL} y1={g.y} x2={W - padR} y2={g.y} stroke="#f3f4f6" strokeWidth="1" />
          <text x={padL - 4} y={g.y + 4} textAnchor="end" fontSize="9" fill="#d1d5db">{g.val}</text>
        </g>
      ))}

      {data.map((d, i) => {
        const x = padL + i * gap + gap / 2 - barW / 2;
        const barH = Math.max(2, (d.total / maxVal) * (H - padT - padB));
        const y = padT + (H - padT - padB) - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill="url(#barGrad)" rx="3" ry="3" />
            {d.total > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9" fill="#3B82F6" fontWeight="700">
                {d.total}
              </text>
            )}
            <text x={x + barW / 2} y={H - padB + 14} textAnchor="middle" fontSize="9" fill="#9CA3AF">
              {formatLabel(d.tanggal, data.length)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  if (!total) return (
    <div className="flex items-center justify-center h-full text-gray-300 text-sm">Tidak ada data</div>
  );

  const cx = 90, cy = 90, r = 72, ir = 44;
  let angle = -90;
  const toRad = (a) => (a * Math.PI) / 180;

  const slices = data.filter(d => d.total > 0).map((d) => {
    const pct = d.total / total;
    const deg = pct * 360;
    const start = angle;
    angle += deg;
    const end = angle;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(end));
    const y2 = cy + r * Math.sin(toRad(end));
    const xi1 = cx + ir * Math.cos(toRad(start));
    const yi1 = cy + ir * Math.sin(toRad(start));
    const xi2 = cx + ir * Math.cos(toRad(end));
    const yi2 = cy + ir * Math.sin(toRad(end));
    const large = deg > 180 ? 1 : 0;
    return {
      path: `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${ir},${ir} 0 ${large},0 ${xi1},${yi1} Z`,
      color: KATEGORI_COLORS[d.nama] ?? "#06B6D4",
      pct: Math.round(pct * 100),
      nama: d.nama,
      total: d.total,
    };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 180 180" className="w-44 h-44 shrink-0">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
        <text x="90" y="85" textAnchor="middle" fontSize="22" fontWeight="900" fill="#111827">{total}</text>
        <text x="90" y="103" textAnchor="middle" fontSize="11" fill="#9CA3AF">Total</text>
      </svg>

      <div className="w-full flex flex-col gap-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-gray-600 flex-1 truncate">{s.nama}</span>
            <span className="text-xs font-bold text-gray-800 w-6 text-right">{s.total}</span>
            <span className="text-xs text-gray-400 w-12 text-right">({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HalamanDashboard() {
  const router = useRouter();

  const [lebarSidebar,    setLebarSidebar]    = useState(220);
  const [user,            setUser]            = useState({ username: "", role: "", foto: null });
  const [unread,          setUnread]          = useState(0);
  const [statistik,       setStatistik]       = useState({ total: 0, menunggu: 0, diproses: 0, selesai: 0 });
  const [grafikHarian,    setGrafikHarian]    = useState([]);
  const [grafikKategori,  setGrafikKategori]  = useState([]);
  const [filterHari,      setFilterHari]      = useState(7);
  const [memuatGrafik,    setMemuatGrafik]    = useState(true);
  const [memuat,          setMemuat]          = useState(true);
  const [dropdownTerbuka, setDropdownTerbuka] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = ambilToken();
    if (!token) { router.push("/masuk"); return; }
    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== "admin" && decoded.role !== "super admin") { router.push("/beranda"); return; }
      setUser({ username: decoded.username, role: decoded.role, foto: null });
    } catch { router.push("/masuk"); return; }

    const ambilData = async () => {
      try {
        const [resProfil, resStatistik, totalUnread, resKategori] = await Promise.all([
          ambilProfil(),
          ambilStatistikAdmin(),
          fetchUnread(),
          ambilGrafikKategori(),
        ]);
        const profil = resProfil?.data ?? resProfil;
        setUser({ username: profil.username, role: profil.role, foto: profil.foto ?? null });
        if (resStatistik?.data) setStatistik(resStatistik.data);
        setUnread(totalUnread);
        if (resKategori?.data) setGrafikKategori(resKategori.data);
      } catch (err) { console.error(err); }
      finally { setMemuat(false); }
    };
    ambilData();

    const handleOut = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownTerbuka(false);
    };
    document.addEventListener("mousedown", handleOut);
    return () => document.removeEventListener("mousedown", handleOut);
  }, [router]);

  useEffect(() => {
    setMemuatGrafik(true);
    ambilGrafikHarian(filterHari)
      .then(res => { if (res?.data) setGrafikHarian(res.data); })
      .catch(console.error)
      .finally(() => setMemuatGrafik(false));
  }, [filterHari]);

  const tanganiKeluar = () => { localStorage.removeItem("token"); router.push("/masuk"); };
  const inisial = user.username ? user.username.charAt(0).toUpperCase() : "A";

  const persenSelesai  = statistik.total > 0 ? Math.round((statistik.selesai  / statistik.total) * 100) : 0;
  const persenDiproses = statistik.total > 0 ? Math.round((statistik.diproses / statistik.total) * 100) : 0;
  const persenMenunggu = statistik.total > 0 ? Math.round((statistik.menunggu / statistik.total) * 100) : 0;
  const persenDitolak  = statistik.total > 0 ? Math.round(((statistik.total - statistik.menunggu - statistik.diproses - statistik.selesai) / statistik.total) * 100) : 0;
  const nilaiDitolak   = statistik.total - statistik.menunggu - statistik.diproses - statistik.selesai;

  const kartuStatistik = [
    { label: "Total Laporan",    nilai: statistik.total,   sub: "Semua laporan yang masuk",  warna: "text-blue-600",    bg: "bg-blue-50",    icon: "/assets/icons/laporansta.png", iconSize: 25 },
    { label: "Laporan Menunggu", nilai: statistik.menunggu,sub: "Menunggu verifikasi",         warna: "text-slate-600",   bg: "bg-slate-50",   icon: "/assets/icons/menunggu.png",  iconSize: 25 },
    { label: "Dalam Proses",     nilai: statistik.diproses,sub: "Laporan masih dalam proses", warna: "text-amber-600",   bg: "bg-amber-50",   icon: "/assets/icons/prosessta.png",  iconSize: 25 },
    { label: "Diselesaikan",     nilai: statistik.selesai, sub: "Laporan yang telah selesai", warna: "text-emerald-600", bg: "bg-emerald-50", icon: "/assets/icons/comment.png",    iconSize: 25 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarAdmin onToggle={(t) => setLebarSidebar(t ? 220 : 64)} unread={unread} />
      <main className="flex-1 transition-all duration-300" style={{ marginLeft: lebarSidebar }}>
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Anda masuk sebagai <span className="font-semibold text-blue-600 capitalize">{user.role}</span>
            </p>
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

        <div className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kartuStatistik.map((kartu, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 ${kartu.bg} rounded-full flex items-center justify-center shrink-0`}>
                    <Image src={kartu.icon} alt={kartu.label} width={kartu.iconSize} height={kartu.iconSize} />
                  </div>
                  <span className={`text-2xl font-bold ${kartu.warna}`}>
                    {memuat ? <span className="inline-block w-8 h-6 bg-gray-100 rounded animate-pulse" /> : kartu.nilai}
                  </span>
                </div>
                <p className="font-semibold text-gray-700 text-sm">{kartu.label}</p>
                <p className="text-gray-400 text-xs mt-0.5">{kartu.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 text-sm">Aktifitas Laporan</h3>
                <select value={filterHari} onChange={(e) => setFilterHari(Number(e.target.value))} className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 outline-none focus:border-blue-400 text-gray-600 bg-white cursor-pointer">
                  <option value={7}>7 Hari Terakhir</option>
                  <option value={14}>14 Hari Terakhir</option>
                  <option value={30}>30 Hari Terakhir</option>
                </select>
              </div>
              <div className="h-52">
                {memuatGrafik
                  ? <div className="h-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>
                  : <BarChart data={grafikHarian} />
                }
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 text-sm mb-4">Status Laporan</h3>
              <div className="flex items-start justify-center">
                {memuat
                  ? <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>
                  : <DonutChart data={grafikKategori} />
                }
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5">
            <h3 className="text-sm font-bold text-gray-800 mb-5">Distribusi Status Laporan</h3>
            <div className="flex flex-col gap-4">
              {[
                { label: "Menunggu",   nilai: statistik.menunggu, persen: persenMenunggu, bar: "bg-slate-400",   text: "text-slate-600"   },
                { label: "Dikerjakan", nilai: statistik.diproses, persen: persenDiproses, bar: "bg-amber-400",   text: "text-amber-600"   },
                { label: "Selesai",    nilai: statistik.selesai,  persen: persenSelesai,  bar: "bg-emerald-500", text: "text-emerald-600" },
                { label: "Ditolak",    nilai: nilaiDitolak,       persen: persenDitolak,  bar: "bg-red-500",     text: "text-red-600"     },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <p className="text-xs font-semibold text-gray-600 w-24 shrink-0">{item.label}</p>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${item.bar}`}
                      style={{ width: `${item.persen}%` }} />
                  </div>
                  <div className="flex items-center gap-2 w-24 shrink-0 justify-end">
                    <span className={`text-xs font-bold ${item.text}`}>{item.nilai}</span>
                    <span className="text-[11px] text-gray-400">({item.persen}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}