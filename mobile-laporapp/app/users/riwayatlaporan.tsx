import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, FlatList, ActivityIndicator, Modal, Alert, ScrollView } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { BASE_URL, ambilProfil, ambilLaporanSaya, ambilKategori, ambilUnreadCount, hapusLaporan } from "@/lib/api";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";

const warnaKategori: any = {
  Infrastruktur: { bg: "#FFF4DD", text: "#EB9B10" },
  "Lingkungan Hidup": { bg: "#E2F2E5", text: "#028C60" },
  "Keamanan & Ketertiban": { bg: "#DBEAFF", text: "#024BC8" },
  "Sosial & Kemasyarakatan": { bg: "#FEDBDC", text: "#E61B25" },
  Lainnya: { bg: "#E8E4FC", text: "#7357E5" },
};

const badgeStatus: any = {
  Menunggu: { bg: "#EAF3FF", text: "#2563EB" },
  Dikerjakan: { bg: "#FFF8E7", text: "#D97706" },
  Selesai: { bg: "#E9F9EE", text: "#16A34A" },
  Ditolak: { bg: "#FDECEC", text: "#DC2626" },
};

export default function RiwayatLaporan() {
  const [loading, setLoading] = useState(true);
  const [laporan, setLaporan] = useState<any[]>([]);
  const [kategori, setKategori] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [unread, setUnread] = useState(0);
  const [search, setSearch] = useState("");
  const navigation = useNavigation<any>();
  
  // State Filter
  const [filterKategori, setFilterKategori] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [urutan, setUrutan] = useState("terbaru");

  // State Modal Visibility
  const [showKategori, setShowKategori] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showUrutan, setShowUrutan] = useState(false);

  const [menuId, setMenuId] = useState<number | null>(null);
  const [popupHapus, setPopupHapus] = useState<number | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const [resProfil, resLaporan, resKategori, resUnread] = await Promise.all([
        ambilProfil(),
        ambilLaporanSaya(),
        ambilKategori(),
        ambilUnreadCount(),
      ]);
      if (resProfil?.data) setProfile(resProfil.data);
      if (resLaporan?.data) setLaporan(resLaporan.data);
      if (resKategori?.data) setKategori(resKategori.data);
      setUnread(resUnread?.total_unread || 0);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleHapus() {
    if (!popupHapus) return;
    try {
      setHapusLoading(true);
      await hapusLaporan(popupHapus);
      setLaporan((prev) => prev.filter((item) => item.id_laporan !== popupHapus));
      setPopupHapus(null);
      Alert.alert("Berhasil", "Laporan berhasil dihapus");
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Gagal menghapus laporan");
    } finally {
      setHapusLoading(false);
    }
  }

  function potongAlamat(alamat: string) {
    if (!alamat) return "-";
    const bagian = alamat.split(",");
    return bagian.slice(0, 2).join(",");
  }

  // Proses Filter & Sorting Data
  const laporanTampil = laporan
    .filter((item) => {
      const cocokSearch = item.judul?.toLowerCase().includes(search.toLowerCase()) || item.lokasi?.toLowerCase().includes(search.toLowerCase());
      const cocokKategori = filterKategori ? String(item.id_kategori) === filterKategori : true;
      const cocokStatus = filterStatus ? item.status === filterStatus : true;
      return cocokSearch && cocokKategori && cocokStatus;
    })
    .sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return urutan === "terbaru" ? db - da : da - db;
    });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#EDF3FD", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#EDF3FD" }}>
      <View style={{ backgroundColor: "#EDF3FD", paddingHorizontal: 18, paddingTop: 55, paddingBottom: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }}
          >
            <Image
              source={require("../../assets/icons/menubar.png")}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#111827" }}>Riwayat Laporan</Text>
            <Text style={{ color: "#6B7280", marginTop: 4 }}>Semua laporan yang pernah kamu buat</Text>
          </View>
        </View>
      </View>

      {/* SEARCH & FILTER */}
      <View style={{ paddingHorizontal: 18 }}>
        <View style={{ backgroundColor: "#FFF", borderRadius: 16, paddingHorizontal: 15, height: 52, justifyContent: "center", marginBottom: 14 }}>
          <TextInput placeholder="Cari laporan..." value={search} onChangeText={setSearch} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 10, paddingBottom: 14 }}>
            <TouchableOpacity onPress={() => setShowKategori(true)} style={{ backgroundColor: filterKategori ? "#2563EB" : "#FFF", paddingHorizontal: 14, height: 42, borderRadius: 12, justifyContent: "center" }}>
              <Text style={{ color: filterKategori ? "#FFF" : "#111827" }}>{filterKategori ? kategori.find((k) => String(k.id_kategori) === filterKategori)?.nama_kategori : "Kategori"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowStatus(true)} style={{ backgroundColor: filterStatus ? "#2563EB" : "#FFF", paddingHorizontal: 14, height: 42, borderRadius: 12, justifyContent: "center" }}>
              <Text style={{ color: filterStatus ? "#FFF" : "#111827" }}>{filterStatus || "Status"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowUrutan(true)} style={{ backgroundColor: "#FFF", paddingHorizontal: 14, height: 42, borderRadius: 12, justifyContent: "center" }}>
              <Text>{urutan === "terbaru" ? "Terbaru" : "Terlama"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* LIST LAPORAN */}
      {laporanTampil.length === 0 ? (
        <View style={{ margin: 18, backgroundColor: "#FFF", borderRadius: 20, padding: 30, alignItems: "center" }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#374151", marginBottom: 6 }}>Tidak ada laporan</Text>
          <Text style={{ textAlign: "center", color: "#6B7280" }}>Coba ubah filter atau buat laporan baru</Text>
          <TouchableOpacity onPress={() => router.push("/users/buatlaporan")} style={{ marginTop: 18, backgroundColor: "#2563EB", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 }}>
            <Text style={{ color: "#FFF", fontWeight: "700" }}>Buat Laporan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={laporanTampil}
          keyExtractor={(item) => item.id_laporan.toString()}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const warna = warnaKategori[item.nama_kategori] || { bg: "#FFF4DD", text: "#EB9B10" };
            const status = badgeStatus[item.status] || badgeStatus.Menunggu;
            const bisaEdit = item.status === "Menunggu";

            return (
              <View style={{ backgroundColor: "#FFF", borderRadius: 20, marginBottom: 14, overflow: "hidden" }}>
                {item.gambar ? (
                  <Image source={{ uri: `${BASE_URL}/uploads/${item.gambar}` }} style={{ width: "100%", height: 190 }} />
                ) : (
                  <View style={{ width: "100%", height: 190, backgroundColor: "#F3F4F6" }} />
                )}

                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: "row", marginBottom: 10, gap: 8 }}>
                    <View style={{ backgroundColor: warna.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                      <Text style={{ color: warna.text, fontWeight: "600", fontSize: 12 }}>{item.nama_kategori}</Text>
                    </View>
                    <View style={{ backgroundColor: status.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                      <Text style={{ color: status.text, fontWeight: "600", fontSize: 12 }}>{item.status}</Text>
                    </View>
                  </View>

                  <Text numberOfLines={2} style={{ fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 }}>{item.judul}</Text>
                  <Text numberOfLines={3} style={{ color: "#6B7280", lineHeight: 22, marginBottom: 14 }}>{item.deskripsi}</Text>
                  <Text numberOfLines={1} style={{ color: "#6B7280", marginBottom: 8 }}>📍 {potongAlamat(item.lokasi)}</Text>
                  <Text style={{ color: "#9CA3AF", fontSize: 12 }}>{new Date(item.created_at).toLocaleDateString("id-ID")}</Text>

                  <View style={{ flexDirection: "row", marginTop: 16, gap: 10 }}>
                    <TouchableOpacity onPress={() => router.push(`/users/laporan/${item.id_laporan}`)} style={{ flex: 1, backgroundColor: "#2563EB", paddingVertical: 12, borderRadius: 12, alignItems: "center" }}>
                      <Text style={{ color: "#FFF", fontWeight: "700" }}>Lihat Detail</Text>
                    </TouchableOpacity>

                    {bisaEdit && (
                      <TouchableOpacity onPress={() => setMenuId(menuId === item.id_laporan ? null : item.id_laporan)} style={{ width: 50, borderRadius: 12, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ fontSize: 20, fontWeight: "700" }}>⋮</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {menuId === item.id_laporan && (
                    <View style={{ marginTop: 10, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, overflow: "hidden" }}>
                      <TouchableOpacity onPress={() => { setMenuId(null); router.push(`/users/buatlaporan?edit=${item.id_laporan}`); }} style={{ padding: 14 }}>
                        <Text>Edit Laporan</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setMenuId(null); setPopupHapus(item.id_laporan); }} style={{ padding: 14, borderTopWidth: 1, borderColor: "#E5E7EB" }}>
                        <Text style={{ color: "#DC2626" }}>Hapus Laporan</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* MODAL FILTER KATEGORI */}
      <Modal visible={showKategori} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setShowKategori(false)}>
          <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "50%" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 15 }}>Pilih Kategori</Text>
            <ScrollView>
              <TouchableOpacity onPress={() => { setFilterKategori(""); setShowKategori(false); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F3F4F6" }}><Text style={{ color: filterKategori === "" ? "#2563EB" : "#111827", fontWeight: filterKategori === "" ? "700" : "400" }}>Semua Kategori</Text></TouchableOpacity>
              {kategori.map((k) => (
                <TouchableOpacity key={k.id_kategori} onPress={() => { setFilterKategori(String(k.id_kategori)); setShowKategori(false); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F3F4F6" }}>
                  <Text style={{ color: filterKategori === String(k.id_kategori) ? "#2563EB" : "#111827", fontWeight: filterKategori === String(k.id_kategori) ? "700" : "400" }}>{k.nama_kategori}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL FILTER STATUS */}
      <Modal visible={showStatus} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setShowStatus(false)}>
          <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 15 }}>Pilih Status</Text>
            <TouchableOpacity onPress={() => { setFilterStatus(""); setShowStatus(false); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F3F4F6" }}><Text style={{ color: filterStatus === "" ? "#2563EB" : "#111827", fontWeight: filterStatus === "" ? "700" : "400" }}>Semua Status</Text></TouchableOpacity>
            {Object.keys(badgeStatus).map((st) => (
              <TouchableOpacity key={st} onPress={() => { setFilterStatus(st); setShowStatus(false); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F3F4F6" }}>
                <Text style={{ color: filterStatus === st ? "#2563EB" : "#111827", fontWeight: filterStatus === st ? "700" : "400" }}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL URUTAN */}
      <Modal visible={showUrutan} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setShowUrutan(false)}>
          <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 15 }}>Urutkan Berdasarkan</Text>
            <TouchableOpacity onPress={() => { setUrutan("terbaru"); setShowUrutan(false); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F3F4F6" }}><Text style={{ color: urutan === "terbaru" ? "#2563EB" : "#111827", fontWeight: urutan === "terbaru" ? "700" : "400" }}>Terbaru</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { setUrutan("terlama"); setShowUrutan(false); }} style={{ paddingVertical: 14 }}><Text style={{ color: urutan === "terlama" ? "#2563EB" : "#111827", fontWeight: urutan === "terlama" ? "700" : "400" }}>Terlama</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL HAPUS */}
      <Modal visible={popupHapus !== null} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#FFF", width: "100%", borderRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>Hapus Laporan?</Text>
            <Text style={{ textAlign: "center", color: "#6B7280", marginBottom: 24 }}>Laporan yang dihapus tidak bisa dikembalikan.</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => setPopupHapus(null)} style={{ flex: 1, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, paddingVertical: 13, alignItems: "center" }}>
                <Text>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={hapusLoading} onPress={handleHapus} style={{ flex: 1, backgroundColor: "#DC2626", borderRadius: 12, paddingVertical: 13, alignItems: "center" }}>
                <Text style={{ color: "#FFF", fontWeight: "700" }}>{hapusLoading ? "Menghapus..." : "Ya, Hapus"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}