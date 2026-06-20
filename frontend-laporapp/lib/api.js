const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function daftarPengguna({ username, email, password }) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Pendaftaran gagal.");
  return data;
}

export async function masukPengguna({ email, password }) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login gagal.");
  if (data.token) localStorage.setItem("token", data.token);
  return data;
}

export async function verifikasiAkun(id, is_verified) {
  const res = await fetch(`${BASE_URL}/api/users/${id}/verifikasi`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
    body: JSON.stringify({ is_verified }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal verifikasi akun.");
  return data;
}


export function ambilToken() {
  return localStorage.getItem("token");
}

export async function ambilProfil() {
  try {
    const res = await fetch(`${BASE_URL}/api/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ambilToken()}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal mengambil profil.");
    return data;
  } catch (err) {
    console.error("ambilProfil error:", err);
    throw err;
  }
}

export async function perbaruiProfil(formData) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Gagal memperbarui profil");
  }

  return await response.json();
}

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function ambilSemuaPengguna() {
  const res = await fetch(`${BASE_URL}/api/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal memuat data akun.");
  return data;
}

export async function buatAkunManual({ username, email, password, role }) {
  const res = await fetch(`${BASE_URL}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
    body: JSON.stringify({ username, email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal membuat akun baru.");
  return data;
}

export async function hapusPengguna(id) {
  const res = await fetch(`${BASE_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal menghapus akun.");
  return data;
}

export async function perbaruiAkun(id, { username, email, role }) {
  const res = await fetch(`${BASE_URL}/api/users/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
    body: JSON.stringify({ username, email, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal memperbarui akun.");
  return data;
}

// ── LAPORAN ──────────────────────────────────────────────

export async function ambilSemuaLaporan() {
  const res = await fetch(`${BASE_URL}/api/laporan`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal mengambil laporan.");
  return data;
}

export async function getLaporanSaya() {
  const res = await fetch(`${BASE_URL}/api/laporan/saya`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal mengambil laporan.");
  return data;
}

export async function ambilDetailLaporan(id) {
  const res = await fetch(`${BASE_URL}/api/laporan/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal mengambil detail laporan.");
  return data;
}

export async function buatLaporan(formData) {
  const res = await fetch(`${BASE_URL}/api/laporan`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ambilToken()}`,
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal membuat laporan.");
  return data;
}

export async function perbaruiLaporan(id, { judul, deskripsi, lokasi, status }) {
  const res = await fetch(`${BASE_URL}/api/laporan/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
    body: JSON.stringify({ judul, deskripsi, lokasi, status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal memperbarui laporan.");
  return data;
}

export async function hapusLaporan(id) {
  const res = await fetch(`${BASE_URL}/api/laporan/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal menghapus laporan.");
  return data;
}

export async function updateStatusLaporan(id, status, alasan = "") {
  try {
    const res = await fetch(`${BASE_URL}/api/laporan/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ambilToken()}`,
      },
      body: JSON.stringify({ 
        status: status,
        alasan: alasan
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Gagal memperbarui status laporan.");
    }

    return data; // Mengembalikan { message: "...", ok: true }
  } catch (err) {
    console.error("updateStatusLaporan error:", err);
    throw err;
  }
}

// ── KOMENTAR ─────────────────────────────────────────────

export async function ambilKomentar(laporan_id) {
  const res = await fetch(`${BASE_URL}/api/komentar/${laporan_id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal mengambil komentar.");
  return data;
}

export async function buatKomentar({ laporan_id, isi }) {
  const res = await fetch(`${BASE_URL}/api/komentar/${laporan_id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
    body: JSON.stringify({ isi_komentar: isi }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal membuat komentar.");
  return data;
}

export async function editKomentar(id_komentar, isi_komentar) {
  const res = await fetch(`${BASE_URL}/api/komentar/${id_komentar}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
    body: JSON.stringify({ isi_komentar }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal mengedit komentar.");
  return data;
}

export async function hapusKomentar(id_komentar) {
  const res = await fetch(`${BASE_URL}/api/komentar/${id_komentar}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal menghapus komentar.");
  return data;
}

// ── NOTIFIKASI ────────────────────────────────────────────

export async function ambilNotifikasi() {
  const res = await fetch(`${BASE_URL}/api/notifikasi`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal mengambil notifikasi.");
  return data;
}

export async function fetchUnread() {
  try {
    const res = await fetch(`${BASE_URL}/api/notifikasi/unread`, {
      headers: {
        Authorization: `Bearer ${ambilToken()}`,
      },
    });
    const data = await res.json();
    return data?.total_unread ?? 0;
  } catch {
    return 0;
  }
}

export async function markAllRead() {
  await fetch(`${BASE_URL}/api/notifikasi/read-all`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${ambilToken()}` },
  });
}

export async function deleteNotif(id) {
  await fetch(`${BASE_URL}/api/notifikasi/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${ambilToken()}` },
  });
}

export async function deleteAllNotif() {
  await fetch(`${BASE_URL}/api/notifikasi/delete-all`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${ambilToken()}` },
  });
}

// ── KATEGORI ──────────────────────────────────────────────

export async function ambilKategori() {
  const res = await fetch(`${BASE_URL}/api/kategori`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal mengambil kategori.");
  return data;
}

// ── STATISTIK ──────────────────────────────────────────────
export async function ambilStatistik() {
  const res = await fetch(`${BASE_URL}/api/statistik`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal mengambil statistik.");
  return data;
}

export async function ambilStatistikAdmin() {
  const res = await fetch(`${BASE_URL}/api/statistik/admin`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ambilToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal mengambil statistik admin.");
  return data;
}

export async function ambilGrafikHarian(hari = 7) {
  const res = await fetch(`${BASE_URL}/api/statistik/admin/harian?hari=${hari}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ambilToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal mengambil grafik harian.");
  return data;
}

export async function ambilGrafikKategori() {
  const res = await fetch(`${BASE_URL}/api/statistik/admin/kategori`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ambilToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Gagal mengambil grafik kategori.");
  return data;
}