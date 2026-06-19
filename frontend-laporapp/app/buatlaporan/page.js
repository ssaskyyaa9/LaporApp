"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/sidebaruser";
import { ambilToken, buatLaporan } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

const BASE_URL = "http://localhost:5000";

const KATEGORI_LIST = [
  { id: 1, label: "Infrastruktur",           aktif: "bg-[#FFF4DD] text-[#EB9B10] border-transparent",   nonaktif: "bg-white text-gray-500 border-gray-200 hover:border-orange-300" },
  { id: 2, label: "Lingkungan Hidup",        aktif: "bg-[#E2F2E5] text-[#028C60] border-transparent",   nonaktif: "bg-white text-gray-500 border-gray-200 hover:border-green-300" },
  { id: 3, label: "Keamanan & Ketertiban",   aktif: "bg-[#DBEAFF] text-[#024BC8] border-transparent",   nonaktif: "bg-white text-gray-500 border-gray-200 hover:border-blue-300" },
  { id: 4, label: "Sosial & Kemasyarakatan", aktif: "bg-[#FEDBDC] text-[#E61B25] border-transparent",   nonaktif: "bg-white text-gray-500 border-gray-200 hover:border-red-300" },
  { id: 5, label: "Lainnya",                 aktif: "bg-[#E8E4FC] text-[#7357E5] border-transparent",   nonaktif: "bg-white text-gray-500 border-gray-200 hover:border-purple-300" },
];

export default function HalamanBuatLaporan() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);

  const [lebarSidebar, setLebarSidebar] = useState(220);
  const [user, setUser] = useState({ username: "", role: "", foto: null });
  const [unread, setUnread] = useState(0);
  const [dropdownTerbuka, setDropdownTerbuka] = useState(false);
  const dropdownRef = useRef(null);

  const [judul, setJudul] = useState("");
  const [kategoriId, setKategoriId] = useState(null);
  const [deskripsi, setDeskripsi] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [gambarFiles, setGambarFiles] = useState([]);
  const [gambarPreviews, setGambarPreviews] = useState([]);
  const [mengirim, setMengirim] = useState(false);
  const [error, setError] = useState("");
  const [gambarLama, setGambarLama] = useState(null);

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [cariLoading, setCariLoading] = useState(false);
  const searchTimeout = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return;
      if (window._leafletLoaded) { setMapReady(true); return; }
      try {
        await import("leaflet/dist/leaflet.css");
        await import("leaflet");
        window._leafletLoaded = true;
        if (isMounted) setMapReady(true);
      } catch (e) {
        console.error("Gagal load Leaflet:", e);
      }
    };

    loadLeaflet();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!mapReady || mapRef.current || !mapContainer.current) return;
    const L = require("leaflet");

    const m = L.map(mapContainer.current, {
      center: [-6.2088, 106.8456],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(m);

    L.control.zoom({ position: "topright" }).addTo(m);

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    m.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      await pindahkanMarker(m, lat, lng);
    });

    mapRef.current = m;
    return () => {
      m.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mapReady]);

  const pindahkanMarker = async (m, lat, lng) => {
    const map = m || mapRef.current;
    if (!map) return;
    const L = require("leaflet");
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const mk = L.marker([lat, lng], { draggable: true }).addTo(map);
      mk.on("dragend", async () => {
        const pos = mk.getLatLng();
        await reverseGeocode(pos.lat, pos.lng);
      });
      markerRef.current = mk;
    }
    await reverseGeocode(lat, lng);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`
      );
      const data = await res.json();
      const nama = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setLokasi(nama);
      setSearchQuery(nama);
    } catch {
      setLokasi(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const gunakanLokasiSaatIni = () => {
    if (!navigator.geolocation) return alert("Browser tidak mendukung geolocation.");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo([lat, lng], 16);
          await pindahkanMarker(mapRef.current, lat, lng);
        }
      },
      () => alert("Gagal mendapatkan lokasi. Aktifkan izin lokasi di browser.")
    );
  };

  const cariLokasi = useCallback((query) => {
    setSearchQuery(query);
    setSearchResults([]);
    if (!query.trim()) return;
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setCariLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=5&accept-language=id`
        );
        const data = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setCariLoading(false);
      }
    }, 500);
  }, []);

  const pilihHasilCari = async (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setSearchResults([]);
    setSearchQuery(item.display_name);
    setLokasi(item.display_name);
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 16);
      await pindahkanMarker(mapRef.current, lat, lng);
    }
  };

  useEffect(() => {
    const token = ambilToken();
    if (token) {
      try {
        const d = jwtDecode(token);
        setUser({ username: d.username, role: d.role });
      } catch {}
    }

    fetch(`${BASE_URL}/api/notifikasi/unread`, {
      headers: { Authorization: `Bearer ${ambilToken()}` },
    })
      .then((r) => r.json())
      .then((d) => setUnread(d?.total_unread || 0))
      .catch(() => {});

    fetch(`${BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${ambilToken()}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d?.data) setUser((prev) => ({ ...prev, foto: d.data.foto, username: d.data.username })); })
      .catch(() => {});

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownTerbuka(false);
    };
    const handleSearchOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setSearchResults([]);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("mousedown", handleSearchOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("mousedown", handleSearchOutside);
    };
  }, []);

  useEffect(() => {
    if (!isEditMode || !editId) return;

    const fetchDataEdit = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/laporan/${editId}`, {
          headers: { Authorization: `Bearer ${ambilToken()}` },
        });
        const result = await res.json();
        const d = result.data;

        if (d) {
          setJudul(d.judul || "");
          setKategoriId(d.id_kategori || null);
          setDeskripsi(d.deskripsi || "");
          setLokasi(d.lokasi || "");
          setSearchQuery(d.lokasi || "");

          if (d.gambar) {
            setGambarLama(d.gambar);
            setGambarPreviews([`${BASE_URL}/uploads/${d.gambar}`]);
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data laporan:", err.message);
      }
    };

    fetchDataEdit();
  }, [isEditMode, editId]);

  const tanganiKeluar = () => {
    localStorage.removeItem("token");
    router.push("/masuk");
  };

  const inisial = user.username ? user.username.charAt(0).toUpperCase() : "U";

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const sisa = 1 - gambarFiles.length;
    if (sisa <= 0) return;
    const fileBaru = files.slice(0, sisa);
    setGambarFiles((prev) => [...prev, ...fileBaru]);
    fileBaru.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setGambarPreviews((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const hapusGambar = (index) => {
    setGambarFiles((prev) => prev.filter((_, i) => i !== index));
    setGambarPreviews((prev) => prev.filter((_, i) => i !== index));
    if (gambarFiles.length === 0) {
      setGambarLama(null);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!judul.trim()) return setError("Judul laporan wajib diisi.");
    if (!kategoriId) return setError("Pilih kategori laporan.");
    if (!deskripsi.trim()) return setError("Deskripsi laporan wajib diisi.");
    if (!lokasi.trim()) return setError("Lokasi kejadian wajib diisi.");

    setMengirim(true);
    try {
      const formData = new FormData();
      formData.append("judul", judul);
      formData.append("id_kategori", kategoriId);
      formData.append("deskripsi", deskripsi);
      formData.append("lokasi", lokasi);

      if (gambarFiles[0]) {
        formData.append("gambar", gambarFiles[0]);
      }

      if (isEditMode && editId) {
        const res = await fetch(`${BASE_URL}/api/laporan/${editId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${ambilToken()}`,
          },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Gagal memperbarui laporan.");
      } else {
        await buatLaporan(formData);
      }

      router.push("/riwayatlaporan");
    } catch (err) {
      setError(err.message || "Gagal menyimpan laporan.");
    } finally {
      setMengirim(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#EDF3FD" }}>
      <Sidebar onToggle={(terbuka) => setLebarSidebar(terbuka ? 220 : 64)} unread={unread} />

      <main className="flex-1 transition-all duration-300 min-h-screen" style={{ marginLeft: lebarSidebar }}>
        <header className="bg-[#EDF3FD] border-b border-gray-100 px-6 py-3 flex items-center justify-end sticky top-0 z-30">
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
              <button onClick={() => setDropdownTerbuka(!dropdownTerbuka)} className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                  {user.foto ? <img src={`${BASE_URL}/uploads/${user.foto}`} alt="foto" className="w-full h-full object-cover" /> : inisial}
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden md:block">{user.username}</span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`transition-transform duration-200 ${dropdownTerbuka ? "rotate-180" : ""}`}>
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

        <div className="p-6 -mt-4">
          <div className="relative bg-white rounded-2xl mb-6 overflow-hidden flex items-center" style={{ minHeight: 150 }}>
            <div className="px-8 py-6 z-10 max-w-lg">
              <p className="text-blue-500 text-xs font-semibold mb-1 tracking-wide">
                {isEditMode ? "Edit Laporan" : "Buat Laporan Baru"}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
                {isEditMode ? "Perbarui laporanmu" : "Apa yang ingin"}<br />
                {isEditMode ? "di sini." : "kamu laporkan?"}
              </h2>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">
                {isEditMode
                  ? "Ubah detail laporan sesuai kebutuhan, lalu klik Kirim Laporan."
                  : "Laporkan masalah di lingkunganmu dengan cepat\ndan mudah. Setiap laporan akan kami tindak lanjuti."
                }
              </p>
              <Link href="/riwayatlaporan"
                className="inline-flex items-center gap-1.5 text-xs text-gray-800 font-medium border border-blue-500 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <Image src="/assets/icons/buatyuk.png" alt="" width={13} height={13} /> Lihat Laporanku
              </Link>
            </div>
            <div className="absolute right-19 bottom-0 hidden md:block">
              <Image src="/assets/gambar/karakterlaporan.png" alt="Banner" width={320} height={190} className="object-contain object-bottom" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">A. Judul Laporan</label>
                  <input type="text" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Tulis judul singkat, misal: Jalan rusak di depan SDN 2"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">B. Kategori Laporan</label>
                  <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                    {KATEGORI_LIST.map((k) => (
                      <button key={k.id} onClick={() => setKategoriId(k.id)}
                        className={`px-3.5 py-2.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap shrink-0 ${kategoriId === k.id ? k.aktif : k.nonaktif}`}>
                        {k.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-700">C. Deskripsi Laporan</label>
                    <span className={`text-xs font-medium ${deskripsi.length >= 480 ? "text-red-400" : "text-gray-400"}`}>{deskripsi.length}/500</span>
                  </div>
                  <textarea value={deskripsi} onChange={(e) => { if (e.target.value.length <= 500) setDeskripsi(e.target.value); }} rows={4}
                    placeholder="Jelaskan laporan secara jelas dan jujur, bisa disertakan dengan kronologis"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all placeholder:text-gray-300 resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-bold text-gray-700">D. Lokasi Kejadian</label>
                    <button onClick={gunakanLokasiSaatIni}
                      className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-100">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                        <line x1="12" y1="2" x2="12" y2="5" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                        <line x1="2" y1="12" x2="5" y2="12" />
                        <line x1="19" y1="12" x2="22" y2="12" />
                      </svg>
                      Gunakan lokasi saya
                    </button>
                  </div>

                  <div className="relative mb-3" ref={searchRef}>
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 gap-2 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400 transition-all">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                      <input type="text" value={searchQuery} onChange={(e) => cariLokasi(e.target.value)}
                        placeholder="Cari alamat atau nama tempat..."
                        className="flex-1 text-sm text-gray-700 outline-none placeholder:text-gray-400 bg-transparent"
                      />
                      {cariLoading && (
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                    </div>

                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden" style={{ zIndex: 1001 }}>
                        {searchResults.map((item, i) => (
                          <button key={i} onClick={() => pilihHasilCari(item)}
                            className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 flex items-start gap-2">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="shrink-0 mt-0.5">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                              <circle cx="12" cy="9" r="2.5" />
                            </svg>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{item.display_name.split(",")[0]}</p>
                              <p className="text-xs text-gray-400 truncate">{item.display_name}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height: 260 }}>
                    <div ref={mapContainer} style={{ height: "100%", width: "100%", position: "absolute", inset: 0 }} />
                  </div>

                  {lokasi && (
                    <div className="mt-2 flex items-start gap-2 bg-[#EDF3FD] rounded-xl px-4 py-3 border border-blue-100">
                      <svg width="15" height="15" className="shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      <p className="text-xs text-blue-700 font-medium leading-relaxed">{lokasi}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100" />

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">E. Lampiran Media</label>
                  <p className="text-xs text-gray-400 mb-3">Unggah 1 foto sebagai bukti laporan</p>

                  {gambarPreviews.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-3">
                      {gambarPreviews.map((src, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                          <img src={src} alt={`Gambar ${i + 1}`} className="w-full h-full object-cover" />
                          <button onClick={() => hapusGambar(i)}
                            className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xl font-bold">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {gambarPreviews.length === 0 && (
                    <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-200 rounded-xl py-8 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all">
                      <div className="w-12 h-12 flex items-center justify-center mb-3">
                        <Image src="/assets/icons/uploadfoto.png" alt="upload" width={40} height={40} />
                      </div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Klik untuk upload foto</p>
                      <p className="text-xs text-gray-400">PNG, JPG, JPEG • 1 foto</p>
                      <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                    </label>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => router.push("/riwayatlaporan")}
                    className="px-6 py-2 rounded-lg border border-red-400 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
                    Batal
                  </button>

                  <button onClick={handleSubmit} disabled={mengirim}
                    className="px-8 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    {mengirim ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {isEditMode ? "Memperbarui..." : "Mengirim..."}
                      </span>
                    ) : (isEditMode ? "Perbarui Laporan" : "Kirim Laporan")}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-800 text-sm mb-4">Proses Laporan</h3>
                <div className="flex flex-col">
                  {[
                    { no: 1, label: "Buat Laporan",  desc: "Mengisi detail laporan",                  aktif: true  },
                    { no: 2, label: "Verifikasi",     desc: "Laporan akan di verifikasi oleh admin",   aktif: false },
                    { no: 3, label: "Tindak Lanjut",  desc: "Laporan di proses dan ditindaklanjuti",   aktif: false },
                    { no: 4, label: "Selesai",        desc: "Mendapatkan notifikasi hasil laporan",    aktif: false },
                  ].map((step, i, arr) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${step.aktif ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                          {step.no}
                        </div>
                        {i < arr.length - 1 && (
                          <div className="w-0.5 bg-gray-100 my-1" style={{ minHeight: 32 }} />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className={`text-sm font-semibold leading-tight ${step.aktif ? "text-blue-600" : "text-gray-500"}`}>{step.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 rounded-2xl border border-green-100 p-5">
                <h3 className="font-bold text-green-600 text-sm mb-8 flex items-center gap-4">
                  <Image src="/assets/icons/tips.png" alt="tips" width={18} height={18} />
                  Tips laporan yang baik
                </h3>
                <ul className="flex flex-col gap-5">
                  {[
                    "Jelaskan masalah dengan jelas dan detail",
                    "Sertakan lokasi, waktu dan kronologi kejadian",
                    "Lampirkan foto untuk bukti agar memperkuat laporan",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-center gap-4 text-sm text-black">
                      <Image src="/assets/icons/comment.png" alt="✓" width={18} height={18} className="shrink-0" />
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-800 text-sm mb-3">Butuh Bantuan ?</h3>
                <div className="flex items-end justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-black text-xs font-semibold leading-relaxed mb-4">
                      Jika kamu mengalami kendala dalam menggunakan web LaporApp, silahkan hubungi kami melalui halaman bantuan.
                    </p>
                    <Link href="/bantuan"
                      className="inline-flex items-center gap-2 mt-1 border-2 border-blue-700 text-blue-500 bg-white text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors">
                      Hubungi Kami
                    </Link>
                  </div>
                  <div className="shrink-0 self-end">
                    <Image src="/assets/icons/bantuan.png" alt="bantuan" width={53} height={53} className="object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}