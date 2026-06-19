import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "https://lapor-app-six.vercel.app";

// ─── Token ────────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem("token");
}

// ─── Helper Fetcher ───────────────────────────────────────

async function fetchDenganAuth(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();

  try {
    console.log("REQUEST:");
    console.log(`${BASE_URL}${endpoint}`);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    console.log("STATUS:", response.status);

    const data = await response.json();

    return data;
  } catch (error) {
    console.log("FETCH ERROR DETAIL:", error);
    throw error;
  }
}

async function fetchDenganAuthFormData(endpoint: string, method: string, formData: FormData) {
  const token = await getToken();
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { 
      Authorization: `Bearer ${token}` 
      // Boundary otomatis terpasang oleh engine fetch, jangan set Content-Type manual di sini
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Terjadi kesalahan");
  return data;
}

// ─── Auth ─────────────────────────────────────────────────

export async function loginApi(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Login gagal");

  await AsyncStorage.setItem("token", data.token);
  return data;
}

export async function logoutApi() {
  await AsyncStorage.removeItem("token");
}

// ─── Beranda ──────────────────────────────────────────────

export async function ambilDataBeranda() {
  const [resStatistik, resLaporan, resUnread, resProfil] = await Promise.all([
    fetchDenganAuth("/api/statistik"),
    fetchDenganAuth("/api/laporan"),
    fetchDenganAuth("/api/notifikasi/unread"),
    fetchDenganAuth("/api/profile"),
  ]);
  return { resStatistik, resLaporan, resUnread, resProfil };
}

// ─── Laporan ──────────────────────────────────────────────

export const ambilSemuaLaporan = (id_kategori?: number | string) => {
  const queryParam = id_kategori ? `?id_kategori=${id_kategori}` : "";
  return fetchDenganAuth(`/api/laporan${queryParam}`);
};

export const ambilLaporanById = (id: number | string) =>
  fetchDenganAuth(`/api/laporan/${id}`);

export const ambilLaporanSaya = () =>
  fetchDenganAuth("/api/laporan/saya");

export const buatLaporan = (formData: FormData) =>
  fetchDenganAuthFormData("/api/laporan", "POST", formData);

export const updateLaporan = (id: number | string, formData: FormData) =>
  fetchDenganAuthFormData(`/api/laporan/${id}`, "PUT", formData);

export const hapusLaporan = (id: number | string) =>
  fetchDenganAuth(`/api/laporan/${id}`, { method: "DELETE" });

export const updateStatusLaporan = (
  id: number | string, 
  payload: { status: "Menunggu" | "Dikerjakan" | "Selesai" | "Ditolak"; alasan?: string }
) =>
  fetchDenganAuth(`/api/laporan/status/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

// ─── Komentar ─────────────────────────────────────────────

export const ambilKomentar = (laporan_id: number | string) =>
  fetchDenganAuth(`/api/komentar/${laporan_id}`);

export const buatKomentar = ({ laporan_id, isi }: { laporan_id: number | string; isi: string }) =>
  fetchDenganAuth(`/api/komentar/${laporan_id}`, {
    method: "POST",
    body: JSON.stringify({ isi_komentar: isi }),
  });

export const editKomentar = (id_komentar: number | string, isi_komentar: string) =>
  fetchDenganAuth(`/api/komentar/${id_komentar}`, {
    method: "PUT",
    body: JSON.stringify({ isi_komentar }),
  });

export const hapusKomentar = (id_komentar: number | string) =>
  fetchDenganAuth(`/api/komentar/${id_komentar}`, { method: "DELETE" });

// ─── Notifikasi (YANG DILENGKAPI & DIPERBAIKI SESUAI BACKEND) ───

export const ambilNotifikasi = () =>
  fetchDenganAuth("/api/notifikasi");

export const ambilUnreadCount = () =>
  fetchDenganAuth("/api/notifikasi/unread");

// BARU: Menandai satu notifikasi dibaca
export const tandaiNotifikasiDibaca = (id_notifikasi: number | string) =>
  fetchDenganAuth(`/api/notifikasi/${id_notifikasi}/read`, { method: "PATCH" });

// BARU: Menandai semua notifikasi dibaca
export const tandaiSemuaNotifikasiDibaca = () =>
  fetchDenganAuth("/api/notifikasi/read-all", { method: "PATCH" });

// BARU: Hapus satu notifikasi permanen
export const hapusNotifikasi = (id_notifikasi: number | string) =>
  fetchDenganAuth(`/api/notifikasi/${id_notifikasi}`, { method: "DELETE" });

// BARU: Hapus semua notifikasi permanen
export const hapusSemuaNotifikasi = () =>
  fetchDenganAuth("/api/notifikasi/delete-all", { method: "DELETE" });

// ─── Profil ───────────────────────────────────────────────


export const ambilProfil = () =>
  fetchDenganAuth("/api/profile");

export const updateProfil = (formData: FormData) =>
  fetchDenganAuthFormData("/api/profile", "PUT", formData);

// ─── Kategori ─────────────────────────────────────────────

export const ambilKategori = () =>
  fetchDenganAuth("/api/kategori");

export const ambilKategoriById = (id: number | string) =>
  fetchDenganAuth(`/api/kategori/${id}`);