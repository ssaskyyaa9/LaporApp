import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ambilSemuaLaporan, ambilKategori, ambilProfil, BASE_URL } from "../../lib/api";

type Laporan = {
  id_laporan: number;
  judul: string;
  deskripsi: string;
  lokasi: string;
  status: string;
  gambar?: string;
  created_at: string;
  username: string;
  foto?: string;
  nama_kategori: string;
  id_kategori: number;
};

type Kategori = {
  id_kategori: number;
  nama_kategori: string;
};

export default function SemuaLaporan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [urutan, setUrutan] = useState<"terbaru" | "terlama">("terbaru");

  // State untuk mengontrol tampilan Modal Filter
  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showUrutanModal, setShowUrutanModal] = useState(false);

  const [namaUser, setNamaUser] = useState("");
  const [fotoUser, setFotoUser] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [resLaporan, resKategori, resProfil] = await Promise.all([
        ambilSemuaLaporan(),
        ambilKategori(),
        ambilProfil(),
      ]);

      setLaporan(resLaporan?.data || []);
      setKategori(resKategori?.data || []);

      const profil = resProfil?.data || resProfil;
      setNamaUser(profil.username || "");
      setFotoUser(profil.foto || "");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const laporanFiltered = useMemo(() => {
    let data = [...laporan];

    if (search) {
      data = data.filter((item) =>
        item.judul.toLowerCase().includes(search.toLowerCase()) ||
        item.lokasi.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterKategori) {
      data = data.filter((item) => String(item.id_kategori) === filterKategori);
    }

    if (filterStatus) {
      data = data.filter((item) => item.status === filterStatus);
    }

    data.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return urutan === "terbaru" ? db - da : da - db;
    });

    return data;
  }, [laporan, search, filterKategori, filterStatus, urutan]);

  const warnaKategori = (nama: string) => {
    switch (nama) {
      case "Infrastruktur": return { bg: "#FFF7ED", text: "#EA580C" };
      case "Lingkungan Hidup": return { bg: "#ECFDF5", text: "#059669" };
      case "Keamanan & Ketertiban": return { bg: "#EFF6FF", text: "#2563EB" };
      case "Sosial & Kemasyarakatan": return { bg: "#FDF2F8", text: "#DB2777" };
      case "Lainnya": return { bg: "#EDE9FE", text: "#7C3AED" };
      default: return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  const warnaStatus = (status: string) => {
    switch (status) {
      case "Menunggu": return { bg: "#EFF6FF", text: "#2563EB" };
      case "Dikerjakan": return { bg: "#FEF3C7", text: "#D97706" };
      case "Selesai": return { bg: "#DCFCE7", text: "#16A34A" };
      case "Ditolak": return { bg: "#FEE2E2", text: "#DC2626" };
      default: return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  const formatTanggal = (tanggal: string) => {
    return new Date(tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#EDF3FD", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#EDF3FD", paddingTop: insets.top }}>
      {/* HEADER */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "flex-start" }}>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: "#FFFFFF", width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}>
          <Image source={require("../../assets/icons/back-button.png")} style={{ width: 20, height: 20 }} />
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 30, paddingTop: 4 }}>
        <Text style={{ fontSize: 30, fontWeight: "800", color: "#111827" }}>Semua Laporan</Text>
        <Text style={{ color: "#6B7280", marginTop: 4, marginBottom: 18 }}>Laporan terbaru dari pengguna LaporApp</Text>
        
        {/* SEARCH BAR */}
        <TextInput value={search} onChangeText={setSearch} placeholder="Cari laporan..." style={{ backgroundColor: "#FFFFFF", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, marginBottom: 12 }} />

        {/* TOMBOL UTAMA FILTER */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8, paddingBottom: 4 }}>
            {/* Urutan */}
            <TouchableOpacity onPress={() => setShowUrutanModal(true)} style={{ backgroundColor: "#FFFFFF", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 }}>
              <Text style={{ color: "#2563EB", fontWeight: "700" }}>{urutan === "terbaru" ? "Terbaru" : "Terlama"}</Text>
            </TouchableOpacity>

            {/* Kategori */}
            <TouchableOpacity onPress={() => setShowKategoriModal(true)} style={{ backgroundColor: filterKategori ? "#2563EB" : "#FFFFFF", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 }}>
              <Text style={{ color: filterKategori ? "#FFFFFF" : "#374151", fontWeight: "600" }}>
                {filterKategori ? kategori.find((k) => String(k.id_kategori) === filterKategori)?.nama_kategori : "Kategori"}
              </Text>
            </TouchableOpacity>

            {/* Status */}
            <TouchableOpacity onPress={() => setShowStatusModal(true)} style={{ backgroundColor: filterStatus ? "#2563EB" : "#FFFFFF", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 }}>
              <Text style={{ color: filterStatus ? "#FFFFFF" : "#374151", fontWeight: "600" }}>
                {filterStatus || "Status"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={{ height: 16 }} />

        {/* LIST CARD LAPORAN */}
        {laporanFiltered.length === 0 ? (
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 30, alignItems: "center" }}>
            <Image source={require("../../assets/icons/laporan.png")} style={{ width: 70, height: 70, resizeMode: "contain" }} />
            <Text style={{ marginTop: 12, fontSize: 16, fontWeight: "700", color: "#111827" }}>Tidak ada laporan</Text>
            <Text style={{ marginTop: 4, color: "#6B7280", textAlign: "center" }}>Coba ubah pencarian atau filter</Text>
          </View>
        ) : (
          laporanFiltered.map((item) => {
            const warnaKat = warnaKategori(item.nama_kategori);
            const warnaStat = warnaStatus(item.status);

            return (
              <TouchableOpacity key={item.id_laporan} activeOpacity={0.9} onPress={() => router.push(`/users/laporan/${item.id_laporan}`)} style={{ backgroundColor: "#FFFFFF", borderRadius: 24, marginBottom: 16, overflow: "hidden" }}>
                {item.gambar && <Image source={{ uri: `${BASE_URL}/uploads/${item.gambar}` }} style={{ width: "100%", height: 210, backgroundColor: "#E5E7EB" }} />}

                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                    <View style={{ backgroundColor: warnaKat.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
                      <Text style={{ color: warnaKat.text, fontWeight: "700", fontSize: 12 }}>{item.nama_kategori}</Text>
                    </View>
                    <View style={{ backgroundColor: warnaStat.bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
                      <Text style={{ color: warnaStat.text, fontWeight: "700", fontSize: 12 }}>{item.status}</Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }} numberOfLines={2}>{item.judul}</Text>
                  <Text numberOfLines={3} style={{ color: "#6B7280", marginTop: 8, lineHeight: 22 }}>{item.deskripsi}</Text>

                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}>
                    <Image source={require("../../assets/icons/lokasiberanda.png")} style={{ width: 16, height: 16, resizeMode: "contain" }} />
                    <Text numberOfLines={1} style={{ marginLeft: 6, color: "#6B7280", flex: 1 }}>{item.lokasi}</Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                    <Image source={require("../../assets/icons/jam.png")} style={{ width: 15, height: 15, resizeMode: "contain" }} />
                    <Text style={{ marginLeft: 6, color: "#6B7280", fontSize: 12 }}>{formatTanggal(item.created_at)}</Text>
                  </View>

                  <View style={{ marginTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ color: "#374151", fontWeight: "700" }}>{item.username}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={{ color: "#2563EB", fontWeight: "700", marginRight: 6 }}>Lihat Detail</Text>
                      <Image source={require("../../assets/icons/detail.png")} style={{ width: 14, height: 14, resizeMode: "contain" }} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ==================================== MODAL DIALOGS ==================================== */}

      {/* MODAL FILTER KATEGORI */}
      <Modal visible={showKategoriModal} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setShowKategoriModal(false)}>
          <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "50%" }}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 15 }}>Pilih Kategori</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity onPress={() => { setFilterKategori(""); setShowKategoriModal(false); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F3F4F6" }}>
                <Text style={{ color: filterKategori === "" ? "#2563EB" : "#111827", fontWeight: filterKategori === "" ? "700" : "400" }}>Semua Kategori</Text>
              </TouchableOpacity>
              {kategori.map((k) => (
                <TouchableOpacity key={k.id_kategori} onPress={() => { setFilterKategori(String(k.id_kategori)); setShowKategoriModal(false); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F3F4F6" }}>
                  <Text style={{ color: filterKategori === String(k.id_kategori) ? "#2563EB" : "#111827", fontWeight: filterKategori === String(k.id_kategori) ? "700" : "400" }}>{k.nama_kategori}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL FILTER STATUS */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setShowStatusModal(false)}>
          <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 15 }}>Pilih Status</Text>
            <TouchableOpacity onPress={() => { setFilterStatus(""); setShowStatusModal(false); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F3F4F6" }}>
              <Text style={{ color: filterStatus === "" ? "#2563EB" : "#111827", fontWeight: filterStatus === "" ? "700" : "400" }}>Semua Status</Text>
            </TouchableOpacity>
            {["Menunggu", "Dikerjakan", "Selesai", "Ditolak"].map((st) => (
              <TouchableOpacity key={st} onPress={() => { setFilterStatus(st); setShowStatusModal(false); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F3F4F6" }}>
                <Text style={{ color: filterStatus === st ? "#2563EB" : "#111827", fontWeight: filterStatus === st ? "700" : "400" }}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL URUTAN TANGGAL */}
      <Modal visible={showUrutanModal} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setShowUrutanModal(false)}>
          <View style={{ backgroundColor: "#FFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 15 }}>Urutkan Berdasarkan</Text>
            <TouchableOpacity onPress={() => { setUrutan("terbaru"); setShowUrutanModal(false); }} style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: "#F3F4F6" }}>
              <Text style={{ color: urutan === "terbaru" ? "#2563EB" : "#111827", fontWeight: urutan === "terbaru" ? "700" : "400" }}>Terbaru</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setUrutan("terlama"); setShowUrutanModal(false); }} style={{ paddingVertical: 14 }}>
              <Text style={{ color: urutan === "terlama" ? "#2563EB" : "#111827", fontWeight: urutan === "terlama" ? "700" : "400" }}>Terlama</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}