import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ScrollView, View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Image, Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import { buatLaporan, ambilLaporanById, updateLaporan, ambilProfil, BASE_URL } from "@/lib/api";

const KATEGORI_LIST = [
  { id: 1, label: "Infrastruktur", aktif: "#FFF4DD", teksAktif: "#EB9B10", border: "#ffff" },
  { id: 2, label: "Lingkungan Hidup", aktif: "#E2F2E5", teksAktif: "#028C60", border: "#ffff" },
  { id: 3, label: "Keamanan & Ketertiban", aktif: "#DBEAFF", teksAktif: "#024BC8", border: "#ffff" },
  { id: 4, label: "Sosial & Kemasyarakatan", aktif: "#FEDBDC", teksAktif: "#E61B25", border: "#ffff" },
  { id: 5, label: "Lainnya", aktif: "#E8E4FC", teksAktif: "#7357E5", border: "#ffff" },
];

export default function BuatLaporanScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const editId = params?.edit;
  const isEditMode = Boolean(editId);

  const [judul, setJudul] = useState("");
  const [kategoriId, setKategoriId] = useState<number | null>(null);
  const [deskripsi, setDeskripsi] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [gambarUri, setGambarUri] = useState<string | null>(null);
  const [gambarLama, setGambarLama] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cariLoading, setCariLoading] = useState(false);
  const searchTimeout = useRef<any>(null);

  const [user, setUser] = useState<{ username: string; foto: string | null }>({ username: "", foto: null });
  const inisial = user.username ? user.username.charAt(0).toUpperCase() : "U";

  useEffect(() => {
    ambilProfil()
      .then((res) => {
        if (res?.data) setUser({ username: res.data.username, foto: res.data.foto });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEditMode || !editId) return;
    const fetchDataEdit = async () => {
      try {
        const result = await ambilLaporanById(editId as string);
        const d = result?.data;
        if (d) {
          setJudul(d.judul || "");
          setKategoriId(d.id_kategori || null);
          setDeskripsi(d.deskripsi || "");
          setLokasi(d.lokasi || "");
          setSearchQuery(d.lokasi || "");
          if (d.gambar) {
            setGambarLama(d.gambar);
            setGambarUri(`${BASE_URL}/uploads/${d.gambar}`);
          }
        }
      } catch (err: any) {
        console.error("Gagal mengambil data laporan:", err.message);
      }
    };
    fetchDataEdit();
  }, [isEditMode, editId]);

  const gunakanLokasiSaatIni = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin Ditolak", "Aplikasi membutuhkan izin GPS untuk mengakses lokasi.");
      return;
    }
    try {
      setCariLoading(true);
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=id`,
        { headers: { "User-Agent": "LaporAppMobile/1.0" } }
      );
      const data = await res.json();
      const namaAlamat = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      setLokasi(namaAlamat);
      setSearchQuery(namaAlamat);
    } catch {
      Alert.alert("Gagal Mendeteksi", "Gagal mendapatkan lokasi GPS. Silakan ketik alamat Anda secara manual.");
    } finally {
      setCariLoading(false);
    }
  };

  const cariLokasi = useCallback((query: string) => {
    setSearchQuery(query);
    setLokasi(query);
    if (!query.trim()) { setSearchResults([]); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setCariLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=5&accept-language=id`,
          { headers: { "User-Agent": "LaporAppMobile/1.0" } }
        );
        const data = await res.json();
        setSearchResults(data);
      } catch { setSearchResults([]); }
      finally { setCariLoading(false); }
    }, 600);
  }, []);

  const pilihHasilCari = (item: any) => {
    setSearchResults([]);
    setSearchQuery(item.display_name);
    setLokasi(item.display_name);
  };

  const handleAmbilGambar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Izin Ditolak", "Butuh akses galeri untuk mengunggah foto.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setGambarUri(result.assets[0].uri);
      setGambarLama(null);
    }
  };

  const hapusGambar = () => { setGambarUri(null); setGambarLama(null); };

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
      formData.append("id_kategori", String(kategoriId));
      formData.append("deskripsi", deskripsi);
      formData.append("lokasi", lokasi);
      if (gambarUri && !gambarUri.startsWith("http")) {
        const namaFile = gambarUri.split("/").pop();
        const match = /\.(\w+)$/.exec(namaFile || "");
        const tipeFile = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append("gambar", { uri: gambarUri, name: namaFile || "laporan.jpg", type: tipeFile } as any);
      }
      if (isEditMode && editId) {
        await updateLaporan(editId as string, formData);
        Alert.alert("Sukses", "Laporan berhasil diperbarui.");
      } else {
        await buatLaporan(formData);
        Alert.alert("Sukses", "Laporan berhasil dikirim.");
      }
      router.push("/users/riwayatlaporan");
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan laporan.");
    } finally {
      setMengirim(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F4F6FA" }}
      contentContainerStyle={{ paddingBottom: 50 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{
        backgroundColor: "white",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 52,
        paddingBottom: 12,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
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

          <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827", letterSpacing: -0.3 }}>
            Buat Laporan
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => router.push("/users/notifikasi")}>
            <Image
              source={require("../../assets/icons/notifhitam.png")}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/users/profile")}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 4 }}
          >
            {user.foto ? (
              <Image
                source={{ uri: `${BASE_URL}/uploads/${user.foto}` }}
                style={{ width: 28, height: 28, borderRadius: 16 }}
              />
            ) : (
              <View style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: "#2563EB",
                alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>{inisial}</Text>
              </View>
            )}
            <Image
              source={require("../../assets/icons/tandabawah.png")}
              style={{ width: 12, height: 12 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <View style={{ backgroundColor: "#FFF", borderRadius: 16, padding: 20, marginBottom: 20, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
          <View style={{ alignSelf: "flex-start", backgroundColor: "#EEEFFD", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10 }}>
            <Text style={{ color: "#1457D5", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>
              {isEditMode ? "EDIT MODE" : "FITUR PENGADUAN"}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#1F2937", lineHeight: 26 }}>
            {isEditMode ? "Perbarui Laporan Anda" : "Ada Masalah di Lingkunganmu?"}
          </Text>
          <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 6, lineHeight: 18 }}>
            Sampaikan keluhan secara jelas. Tim kami akan segera meninjau dan merespons laporan Anda.
          </Text>
        </View>

        <View style={{ backgroundColor: "#FFF", borderRadius: 16, padding: 20, gap: 22, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}>
          <View style={{ width: "100%" }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 8 }}>Judul Laporan</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: "#1F2937", backgroundColor: "#F9FAFB" }}
              value={judul}
              onChangeText={setJudul}
              placeholder="Misal: Pipa bocor, jalan berlubang..."
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={{ width: "100%" }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 8 }}>Pilih Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row", paddingVertical: 4 }}>
              {KATEGORI_LIST.map((k) => {
                const dipilih = kategoriId === k.id;
                return (
                  <TouchableOpacity key={k.id} onPress={() => setKategoriId(k.id)}
                    style={[{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 10 },
                      dipilih ? { backgroundColor: k.aktif, borderColor: k.border } : { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" }]}
                  >
                    <Text style={[{ fontSize: 12 }, dipilih ? { color: k.teksAktif, fontWeight: "700" } : { color: "#4B5563" }]}>
                      {k.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={{ width: "100%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151" }}>Deskripsi Detail</Text>
              <Text style={{ fontSize: 11, color: "#9CA3AF" }}>{deskripsi.length}/500</Text>
            </View>
            <TextInput
              style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: "#1F2937", backgroundColor: "#F9FAFB", height: 120, textAlignVertical: "top", lineHeight: 20 }}
              value={deskripsi}
              onChangeText={(text) => text.length <= 500 && setDeskripsi(text)}
              placeholder="Ceritakan kronologi atau detail kendala di lokasi secara lengkap..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={{ width: "100%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151" }}>Lokasi Kejadian</Text>
              <TouchableOpacity
                style={{ backgroundColor: "#E8F0FE", borderWidth: 1, borderColor: "#BFDBFE", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}
                onPress={gunakanLokasiSaatIni}
              >
                <Text style={{ color: "#1457D5", fontSize: 12, fontWeight: "700" }}>Gunakan Lokasi Saya</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 12 }}>
              <TextInput
                style={{ flex: 1, height: 48, fontSize: 14, color: "#1F2937" }}
                value={searchQuery}
                onChangeText={cariLokasi}
                placeholder="Ketik alamat lengkap atau nama tempat..."
                placeholderTextColor="#9CA3AF"
              />
              {cariLoading && <ActivityIndicator size="small" color="#1457D5" style={{ marginRight: 8 }} />}
            </View>

            {searchResults.length > 0 && (
              <View style={{ backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginTop: 6, overflow: "hidden" }}>
                {searchResults.map((item, i) => (
                  <TouchableOpacity key={i} style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }} onPress={() => pilihHasilCari(item)}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#374151" }} numberOfLines={1}>{item.display_name.split(",")[0]}</Text>
                    <Text style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }} numberOfLines={1}>{item.display_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {lokasi.trim() ? (
              <View style={{ marginTop: 12, backgroundColor: "#F0F4FE", borderWidth: 1, borderColor: "#D6E4FF", borderRadius: 12, padding: 14 }}>
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#1457D5", marginBottom: 4 }}>Lokasi yang akan dikirim:</Text>
                <Text style={{ color: "#1E3A8A", fontSize: 13, lineHeight: 18 }}>{lokasi}</Text>
              </View>
            ) : null}
          </View>

          <View style={{ width: "100%" }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 8 }}>Bukti Foto</Text>
            {gambarUri ? (
              <View style={{ position: "relative", width: 100, height: 100, marginTop: 4 }}>
                <Image source={{ uri: gambarUri }} style={{ width: "100%", height: "100%", borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" }} />
                <TouchableOpacity
                  style={{ position: "absolute", top: -6, right: -6, backgroundColor: "#EF4444", width: 22, height: 22, borderRadius: 11, alignItems: "center", elevation: 3, justifyContent: "center" }}
                  onPress={hapusGambar}
                >
                  <Text style={{ color: "#FFF", fontWeight: "bold", fontSize: 12, lineHeight: 15 }}>×</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={{ borderWidth: 2, borderColor: "#D1D5DB", borderStyle: "dashed", borderRadius: 12, paddingVertical: 30, alignItems: "center", justifyContent: "center", backgroundColor: "#F9FAFB" }}
                onPress={handleAmbilGambar}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#4B5563" }}>Ketuk untuk Pilih Foto</Text>
                <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Format JPG, JPEG, atau PNG</Text>
              </TouchableOpacity>
            )}
          </View>

          {error ? (
            <View style={{ backgroundColor: "#FEF2F2", borderColor: "#FEE2E2", borderWidth: 1, borderRadius: 12, padding: 14 }}>
              <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "600" }}>⚠️ {error}</Text>
            </View>
          ) : null}

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10, gap: 12 }}>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#D1D5DB", alignItems: "center", backgroundColor: "#FFF" }}
              onPress={() => router.back()}
            >
              <Text style={{ color: "#4B5563", fontWeight: "700", fontSize: 14 }}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: "#1457D5", alignItems: "center", justifyContent: "center" }}
              onPress={handleSubmit}
              disabled={mengirim}
            >
              {mengirim ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}>
                  {isEditMode ? "Simpan Perubahan" : "Kirim Laporan"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}