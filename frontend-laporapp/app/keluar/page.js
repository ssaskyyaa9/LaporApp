"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebaruser";
import { ambilToken } from "@/lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchUnread() {
  try {
    const res = await fetch(`${BASE_URL}/api/notifikasi/unread`, {
      headers: { Authorization: `Bearer ${ambilToken()}` },
    });
    const data = await res.json();
    return data?.total_unread ?? 0;
  } catch { return 0; }
}

export default function HalamanKeluar() {
  const router = useRouter();
  const [lebarSidebar, setLebarSidebar] = useState(220);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetchUnread().then(setUnread);
  }, []);

  const tanganiKeluar = () => {
    localStorage.removeItem("token");
    router.push("/masuk");
  };

  const tanganiBatal = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar onToggle={(t) => setLebarSidebar(t ? 220 : 64)} unread={unread} />

      <main className="flex-1 transition-all duration-300 min-h-screen filter blur-xs pointer-events-none select-none" style={{ marginLeft: lebarSidebar }} >
        <div className="p-6">
          <div className="h-8 w-48 bg-gray-200 rounded-xl mb-6" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-28 shadow-sm border border-gray-100" />
            ))}
          </div>

          <div className="bg-white rounded-2xl h-64 shadow-sm border border-gray-100 mb-6" />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-white rounded-2xl h-48 shadow-sm border border-gray-100" />
            <div className="bg-white rounded-2xl h-48 shadow-sm border border-gray-100" />
          </div>
        </div>
      </main>

      <div className="fixed inset-0 bg-black/20 z-40" style={{ left: lebarSidebar }} onClick={tanganiBatal} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ left: lebarSidebar }}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm px-8 py-8 flex flex-col items-center text-center">

          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 leading-snug mb-2"> Apakah kamu yakin untuk<br />keluar dari LaporApp? </h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-7"> Daftar/Masuk kembali<br />jika ingin menggunakan LaporApp </p>
          <div className="flex flex-col gap-3 w-full">
            <button onClick={tanganiKeluar}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm" > Keluar
            </button>

            <button onClick={tanganiBatal}
              className="w-full bg-white hover:bg-gray-50 text-red-500 font-semibold py-3.5 rounded-2xl border border-gray-200 transition-colors text-sm" > Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}