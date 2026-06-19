"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

function useCountUp(target, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

export default function HalamanUtama() {
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [terscroll, setTerscroll] = useState(false);
  const [indeksTerbuka, setIndeksTerbuka] = useState(null);
  const [tampilkanToast, setTampilkanToast] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  const pengguna = useCountUp(15000, 1500, statsVisible);
  const laporan  = useCountUp(8400,  1500, statsVisible);
  const persen   = useCountUp(92,    1500, statsVisible);
  const kota     = useCountUp(34,    1500, statsVisible);

  useEffect(() => {
    const tanganiScroll = () => setTerscroll(window.scrollY > 10);
    window.addEventListener("scroll", tanganiScroll);
    return () => window.removeEventListener("scroll", tanganiScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const tanganiKlikNav = (e, id) => {
    e.preventDefault();
    setMenuTerbuka(false);
    if (id === "beranda") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const el = document.getElementById(id);
      if (el) {
        const offset = 72;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  const tanganiKlikDashboard = (e) => { e.preventDefault();
    setTampilkanToast(true);
    setTimeout(() => setTampilkanToast(false), 3000);
  };

  const tautanNav = [
    { label: "Beranda", id: "beranda" },
    { label: "Tentang", id: "tentang" },
    { label: "Cara Kerja", id: "cara-kerja" },
    { label: "Fitur", id: "fitur" },
    { label: "FAQ", id: "faq" },
  ];

  const langkahCaraKerja = [
    { ikon: "/assets/icons/laporanlanding.png", nomor: "1", judul: "Buat laporan", deskripsi: "Sampaikan keluhan Anda dengan mudah dan cepat.", bgIkon: "bg-blue-100", bgNomor: "bg-blue-600" },
    { ikon: "/assets/icons/prosessta.png", nomor: "2", judul: "Diproses", deskripsi: "Laporan Anda akan diverifikasi Dan ditindaklanjuti oleh admin.", bgIkon: "bg-yellow-100", bgNomor: "bg-yellow-500" },
    { ikon: "/assets/icons/comment.png", nomor: "3", judul: "Selesai", deskripsi: "Pantau perkembangan laporan hingga masalah terselesaikan.", bgIkon: "bg-green-100", bgNomor: "bg-green-500" },
  ];

  const daftarFitur = [
    { ikon: "/assets/icons/lokasilanding.png", judul: "Berbasis Lokasi", deskripsi: "Laporkan masalah sesuai lokasi dengan akurat."},
    { ikon: "/assets/icons/filelanding.png", judul: "Unggah Foto", deskripsi: "Tambahkan foto untuk memperjelas laporan Anda."},
    { ikon: "/assets/icons/notiflanding.png", judul: "Pantau Status", deskripsi: "Dapatkan informasi terbaru mengenai laporan Anda."},
    { ikon: "/assets/icons/komentarlanding.png", judul: "Komentar & Diskusi", deskripsi: "Berikan komentar atau informasi tambahan pada laporan."},
  ];

  const daftarFaq = [
    { pertanyaan: "Siapa yang bisa menggunakan LaporApp?", jawaban: "Semua warga masyarakat yang ingin melaporkan masalah di lingkungan sekitarnya. Cukup daftar dengan email dan mulai buat laporan." },
    { pertanyaan: "Apakah laporan saya akan ditindaklanjuti?", jawaban: "Ya, setiap laporan akan diverifikasi oleh tim kami dan diteruskan ke pihak berwenang yang relevan. Anda bisa memantau statusnya secara real-time." },
    { pertanyaan: "Bagaimana cara memantau status laporan?", jawaban: "Setelah membuat laporan, Anda akan mendapatkan nomor tiket unik. Gunakan nomor tersebut atau login ke akun Anda untuk melihat perkembangan laporan." },
    { pertanyaan: "Apakah identitas saya akan dirahasiakan?", jawaban: "Ya, kami menjaga kerahasiaan identitas pelapor. Data pribadi Anda tidak akan disebarluaskan kepada pihak mana pun tanpa izin." },
    { pertanyaan: "Apakah LaporApp gratis?", jawaban: "Ya, LaporApp sepenuhnya gratis untuk semua pengguna. Tidak ada biaya tersembunyi untuk membuat atau memantau laporan." },
  ];

  return (
    <main className="min-h-screen font-sans">
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-white ${terscroll}`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/assets/gambar/logo LaporApp.png" alt="Logo LaporApp" width={84} height={84} />
            <span className="font-bold text-2xl">
              <span className="text-black">Lapor</span>
              <span className="text-blue-600">App</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-11 text-sm font-medium text-black">
            {tautanNav.map((tautan) => (
              <a key={tautan.id} href={`#${tautan.id}`} onClick={(e) => tanganiKlikNav(e, tautan.id)}
                className="hover:text-blue-600 transition-colors cursor-pointer"> {tautan.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-7">
            <Link href="/masuk" className="text-sm font-semibold text-blue-600 border border-blue-600 px-5 py-2 rounded-lg hover:bg-blue-50 transition-colors">Masuk</Link>
            <Link href="/daftar" className="text-sm font-semibold text-white bg-blue-600 px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">Daftar</Link>
          </div>

          <button className="md:hidden flex flex-col justify-center items-center gap-1.5 w-8 h-8"
            onClick={() => setMenuTerbuka(!menuTerbuka)} aria-label="Buka menu">
            <span className={`block w-6 h-0.5 bg-gray-700 transition-all duration-300 ${menuTerbuka ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-6 h-0.5 bg-gray-700 transition-all duration-300 ${menuTerbuka ? "opacity-0" : ""}`} />
            <span className={`block w-6 h-0.5 bg-gray-700 transition-all duration-300 ${menuTerbuka ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        <div className={`md:hidden bg-white border-t border-gray-100 overflow-hidden transition-all duration-300 ${menuTerbuka ? "max-h-96 py-4" : "max-h-0"}`}>
          <div className="flex flex-col px-4 gap-4">
            {tautanNav.map((tautan) => (
              <a key={tautan.id} href={`#${tautan.id}`} onClick={(e) => tanganiKlikNav(e, tautan.id)}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"> {tautan.label}
              </a>
            ))}

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <Link href="/masuk" className="flex-1 text-center text-sm font-semibold text-blue-600 border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">Masuk</Link>
              <Link href="/daftar" className="flex-1 text-center text-sm font-semibold text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Daftar</Link>
            </div>
          </div>
        </div>
      </nav>

      <section id="beranda" className="pt-28 pb-0 mt-10 bg-[#F1F6FD] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-end gap-10">
          <div className="flex-1 pb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-500 bg-yellow-50 border border-yellow-200 px-5 py-3 rounded-full mb-5">
              <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span> Multiplatform Pengaduan Masyarakat
            </span>

            <h1 className="text-4xl md:text-5xl font-bold text-black leading-tight mb-4"> Laporkan Masalah di <br /> Sekitar Anda dengan{" "}
              <span className="text-blue-600">Mudah</span>
            </h1>

            <p className="text-gray-500 text-base mb-8 max-w-md leading-relaxed"> Sampaikan keluhan atau laporan Anda kepada pihak berwenang  Kami memastikan tindak lanjut untuk lingkungan yang lebih baik. </p>
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <Link href="/daftar" className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-md text-sm">Buat Laporan</Link>
              <Link href="/daftar" className="border bg-white border-blue-600 text-gray-700 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm">Lihat Laporan</Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["orang1.jpg", "orang2.jpg", "orang3.jpg", "orang4.jpg", "orang5.jpg"].map((file, n) => (
                  <div key={n} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                    <Image src={`/assets/gambar/${file}`} alt="review" width={32} height={32} className="object-cover w-full h-full" />
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-500"> <span className="font-bold text-gray-700">15.000+</span> pengguna telah bergabung </p>
            </div>
          </div>

          <div className="flex-1 flex justify-center items-end relative">
            <Image src="/assets/gambar/phone.png" alt="Ilustrasi Aplikasi" width={240} height={360} className="object-contain relative z-10 right-30"/>
            <Image src="/assets/gambar/karakterlanding1.png" alt="Karakter Hero" width={300} height={380} className="object-contain absolute right-0 bottom-0 z-20 left-72" />
          </div>
        </div>
      </section>

      <section id="tentang" className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-3">Tentang Kami</span>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Apa itu LaporApp?</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
              LaporApp adalah platform pengaduan masyarakat digital yang memudahkan warga melaporkan masalah lingkungan kepada pihak berwenang secara cepat, mudah, dan transparan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="#2563eb"/>
                </svg>
              </div>

              <h3 className="font-bold text-gray-800 mb-2">Berbasis Lokasi</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Laporan dikaitkan dengan lokasi nyata sehingga mudah ditindaklanjuti oleh pihak yang bertanggung jawab di wilayah tersebut.</p>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="#d97706" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>

              <h3 className="font-bold text-gray-800 mb-2">Komunitas Aktif</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Bergabung bersama 15.000+ warga yang peduli lingkungan dan aktif melaporkan masalah di sekitar mereka setiap harinya.</p>
            </div>

            <div className="bg-green-50 rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" stroke="#16a34a" strokeWidth="2"/>
                </svg>
              </div>

              <h3 className="font-bold text-gray-800 mb-2">Transparan & Terpercaya</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Setiap laporan bisa dipantau statusnya secara real-time. Kami memastikan setiap suara masyarakat didengar dan ditindaklanjuti.</p>
            </div>
          </div>

          <div ref={statsRef} className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { nilai: pengguna, suffix: "+", label: "Pengguna Aktif" },
              { nilai: laporan,  suffix: "+", label: "Laporan Masuk" },
              { nilai: persen,   suffix: "%", label: "Laporan Ditangani" },
              { nilai: kota,     suffix: "",  label: "Kota Terjangkau" },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-5 text-center">
                <p className="text-2xl font-bold text-blue-600 mb-1">{stat.nilai.toLocaleString("id-ID")}{stat.suffix}</p>
                <p className="text-gray-500 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Cara Kerja</h2>
          <div className="w-10 h-1 bg-yellow-400 mx-auto rounded-full mb-12"/>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {langkahCaraKerja.map((langkah, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className={`w-24 h-24 rounded-full ${langkah.bgIkon} flex items-center justify-center mb-5`}>
                  <Image src={langkah.ikon} alt={langkah.judul} width={38} height={38} />
                </div>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full ${langkah.bgNomor} text-white text-xs font-bold flex items-center justify-center`}>{langkah.nomor}</span>
                  <h3 className="font-bold text-gray-800 text-lg">{langkah.judul}</h3>
                </div>

                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{langkah.deskripsi}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-[#F1F6FD]">
        <section id="fitur" className="py-14">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Fitur Unggulan</h2>
            <div className="w-10 h-1 bg-blue-600 mx-auto rounded-full mb-10" />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {daftarFitur.map((fitur, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 flex flex-col items-center text-center shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-default">
                  <div className={`w-20 h-20 ${fitur.bgIkon} rounded-xl flex items-center justify-center mb-4`}>
                    <Image src={fitur.ikon} alt={fitur.judul} width={60} height={60} />
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm mb-2">{fitur.judul}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{fitur.deskripsi}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${tampilkanToast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
            <div className="flex items-center gap-3 bg-white border border-yellow-300 shadow-lg rounded-2xl px-5 py-3">
              <span className="text-yellow-500 text-lg">⚠️</span>

              <div>
                <p className="text-sm font-semibold text-gray-800">Akses Terbatas</p>
                <p className="text-xs text-gray-500"> Silakan 
                  <Link href="/masuk" className="text-blue-600 font-semibold hover:underline"> masuk </Link> atau 
                  <Link href="/daftar" className="text-blue-600 font-semibold hover:underline"> daftar </Link> terlebih dahulu.
                </p>
              </div>

              <button onClick={() => setTampilkanToast(false)} className="ml-2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-800 leading-snug mb-4">Pantau semua laporan <br /> dalam satu dashboard</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">Kelola dan pantau semua laporan masyarakat secara real-time <br/> dengan mudah dan transparan.</p>

              <button onClick={tanganiKlikDashboard}
                className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-md text-sm cursor-pointer">
                Buka dashboard
              </button>
            </div>

            <div className="flex-1">
              <Image src="/assets/gambar/tampilanberanda.png" alt="Pratinjau Dashboard" width={560} height={380}
                className="object-contain rounded-2xl shadow-xl w-full" />
            </div>
          </div>
        </section>

        <section className="pb-14 px-4">
          <div className="max-w-6xl mx-auto bg-blue-600 rounded-2xl py-5 px-8 flex flex-col md:flex-row items-center gap-27 justify-center">
            <div className="hidden md:block self-end translate-y-5">
              <Image src="/assets/gambar/karakterlanding.png" alt="Ilustrasi CTA" width={250} height={250} />
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-2xl font-bold text-white mb-2">Bersama, kita bisa membuat <br/> lingkungan yang lebih baik</h2>
              <p className="text-blue-100 text-sm">Jangan ragu untuk melaporkan masalah di sekitar Anda</p>
            </div>

            <Link href="/daftar" className="bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl hover:bg-yellow-300 transition-colors shadow-md whitespace-nowrap text-sm"> Buat Laporan Sekarang </Link>
          </div>
        </section>

      </div>
      <section id="faq" className="py-14 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mb-3">Pertanyaan Umum</span>
            <h2 className="text-3xl font-bold text-black mb-3">Ada yang ingin ditanyakan?</h2>
            <p className="text-gray-500 text-sm">Kami menjawab pertanyaan yang paling sering ditanyakan oleh pengguna kami.</p>
          </div>

          <div className="flex flex-col gap-3">
            {daftarFaq.map((faq, i) => (
              <div key={i} className={`rounded-2xl border transition-all duration-300 overflow-hidden ${indeksTerbuka === i ? "border-blue-200 bg-white shadow-md" : "border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm"}`}>
                <button className="w-full text-left px-6 py-5 flex justify-between items-center gap-4" onClick={() => setIndeksTerbuka(indeksTerbuka === i ? null : i)}>
                  <span className={`font-semibold text-sm md:text-base transition-colors ${indeksTerbuka === i ? "text-blue-600" : "text-gray-800"}`}>{faq.pertanyaan}</span>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${indeksTerbuka === i ? "bg-blue-600 text-white rotate-45" : "bg-gray-100 text-gray-500"}`}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${indeksTerbuka === i ? "max-h-40" : "max-h-0"}`}>
                  <div className="px-6 pb-5">
                    <div className="w-full h-px bg-gray-100 mb-4" />
                    <p className="text-gray-500 text-sm leading-relaxed">{faq.jawaban}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center p-6 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-gray-600 text-sm mb-3">Masih ada pertanyaan lain?</p>
            <Link href="/bantuan" className="inline-block bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"> Kunjungi Halaman Bantuan </Link>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between gap-6">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
            <Image src="/assets/gambar/logo LaporApp.png" alt="Logo LaporApp" width={84} height={84} />
            <span className="font-bold text-2xl">
              <span className="text-black">Lapor</span>
              <span className="text-blue-600">App</span>
            </span>
          </div>

            <p className="text-gray-500 text-sm leading-relaxed">Platform pengaduan masyarakat untuk lingkungan yang lebih baik.</p>
          </div>

          <div>
            <h4 className="font-bold text-gray-800 mb-3 mr-16">Menu</h4>
            <ul className="space-y-1.5 text-sm text-gray-500">
              <li><Link href="#beranda" className="hover:text-blue-600 transition-colors">Beranda</Link></li>
              <li><Link href="#tentang" className="hover:text-blue-600 transition-colors">Tentang</Link></li>
              <li><Link href="#cara-kerja" className="hover:text-blue-600 transition-colors">Cara Kerja</Link></li>
              <li><Link href="#fitur" className="hover:text-blue-600 transition-colors">Fitur</Link></li>
              <li><Link href="#faq" className="hover:text-blue-600 transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div className="mr-16">
            <h4 className="font-bold text-gray-800 mb-3">Kontak</h4>
            <ul className="space-y-1.5 text-sm text-gray-500">
              <li>info@LaporApp.id</li>
              <li>(021) 1234-5678</li>
              <li>Jl. Mawar No. 110, Jakarta Pusat</li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-400"> © 2025 LaporApp. All rights reserved. </div>
      </footer>
    </main>
  );
}