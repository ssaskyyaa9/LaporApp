"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { masukPengguna } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

export default function HalamanMasuk() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [tampilkanSandi, setTampilkanSandi] = useState(false);
  const [pesan, setPesan] = useState("");
  const [pesanSukses, setPesanSukses] = useState("");
  const [memuat, setMemuat] = useState(false);

  useEffect(() => {
    if (searchParams.get("daftar") === "berhasil") {
      setPesanSukses("Pendaftaran berhasil! Akun Anda sedang menunggu verifikasi admin.");
      setTimeout(() => setPesanSukses(""), 5000);
    }
  }, [searchParams]);

  const tanganiMasuk = async (e) => {
    e.preventDefault();
    setMemuat(true);
    setPesan("");
    try {
      const data = await masukPengguna({ email, password: kataSandi });
      const decoded = jwtDecode(data.token);

      if (decoded.role === "user") {
        router.push("/beranda");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setPesan(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setMemuat(false);
    }
  };

  return (
    <Suspense>
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#DDE8F8" }}>

        {/* Notif sukses daftar */}
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm transition-all duration-500 ${pesanSukses ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
          <div className="flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-2xl px-5 py-3.5 mx-4">
            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7l3 3 6-6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            
            <p className="text-sm font-semibold text-green-700">{pesanSukses}</p>
          </div>
        </div>

        <button onClick={() => router.back()}
          className="absolute top-8 left-8 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors"
          aria-label="Kembali">

          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9L11 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="bg-white rounded-3xl shadow-lg px-10 py-10 w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Image src="/assets/gambar/logo LaporApp.png" alt="Logo LaporApp" width={42} height={42} />
            <span className="text-2xl font-bold text-gray-800">Lapor<span className="text-blue-600">App</span></span>
          </div>

          <div className="text-center mb-7">
            <h1 className="text-xl font-bold text-gray-800 mb-1">Selamat Datang!</h1>
            <p className="text-sm text-gray-400">Masuk untuk melanjutkan ke akun Anda</p>
          </div>

          <form onSubmit={tanganiMasuk} className="flex flex-col gap-4">
            <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-blue-400 transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="4" width="14" height="10" rx="2" stroke="#9CA3AF" strokeWidth="1.5" />
                <path d="M2 6.5l7 4.5 7-4.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
              </svg>

              <input type="email" placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent" required />
            </div>

            <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-blue-400 transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="4" y="8" width="10" height="7" rx="2" stroke="#9CA3AF" strokeWidth="1.5" />
                <path d="M6 8V6a3 3 0 016 0v2" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
              </svg>

              <input type={tampilkanSandi ? "text" : "password"} placeholder="Kata Sandi" value={kataSandi}
                onChange={(e) => setKataSandi(e.target.value)}
                className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent" required 
              />

              <button type="button" onClick={() => setTampilkanSandi(!tampilkanSandi)}
                className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 9s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="#9CA3AF" strokeWidth="1.5" />
                  <circle cx="9" cy="9" r="2" stroke="#9CA3AF" strokeWidth="1.5" />
                  {tampilkanSandi && <path d="M3 3l12 12" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />}
                </svg>
              </button>
            </div>

            <button type="submit" disabled={memuat}
              className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-colors mt-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed">
              {memuat ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Memuat...
                </span>
              ) : "Masuk"}
            </button>

            {pesan && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" />
                  <path d="M8 5v3M8 11v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                </svg>

                <p className="text-red-500 text-xs">{pesan}</p>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-5"> Belum punya akun?{" "}
            <Link href="/daftar" className="text-blue-600 font-semibold hover:underline">Daftar sekarang</Link>
          </p>
        </div>
      </main>
    </Suspense>
  );
}

export default function MasukPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}