import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import {
  Provider,
  Text,
  Avatar,
  Button,
  TextInput,
  Card,
  Snackbar,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker"; 
import { useRouter } from "expo-router"; 
import {
  ambilProfil,
  updateProfil,
  ambilDataBeranda,
  BASE_URL,
} from "../../lib/api"; // Sesuaikan dengan path file api Anda

export default function ProfileScreen() {
  const router = useRouter(); 

  // State manajemen UI & Loading
  const [memuat, setMemuat] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [unread, setUnread] = useState(0);

  // State Data Profil & Statistik
  const [profil, setProfil] = useState<any>(null);
  const [statistik, setStatistik] = useState({
    total: 0,
    diproses: 0,
    selesai: 0,
    ditolak: 0,
  });

  // State Form Input
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<any>(null);

  // State Notifikasi / Toast (Snackbar)
  const [pesan, setPesan] = useState({ visible: false, tipe: "", teks: "" });

  // Load Data Pertama Kali
  const muatData = async () => {
    setMemuat(true);
    try {
      const [resProfil, resBeranda] = await Promise.all([
        ambilProfil(),
        ambilDataBeranda(),
      ]);

      const dataUser = resProfil?.data ?? resProfil;
      setProfil(dataUser);
      setUsername(dataUser?.username ?? "");
      setEmail(dataUser?.email ?? "");

      const dataUnread = resBeranda?.resUnread?.data ?? resBeranda?.resUnread;
      setUnread(dataUnread?.total ?? 0);

      const dataStatistik = resBeranda?.resStatistik?.data ?? resBeranda?.resStatistik;
      if (dataStatistik) {
        setStatistik({
          total: dataStatistik.total ?? 0,
          diproses: dataStatistik.diproses ?? dataStatistik.menunggu ?? 0,
          selesai: dataStatistik.selesai ?? 0,
          ditolak: dataStatistik.ditolak ?? 0,
        });
      }
    } catch (err: any) {
      console.error(err);
      tampilkanPesan("error", "Gagal memuat data profil.");
    } finally {
      setMemuat(false);
    }
  };

  useEffect(() => {
    muatData();
  }, []);

  const tampilkanPesan = (tipe: "sukses" | "error", teks: string) => {
    setPesan({ visible: true, tipe, teks });
  };

  // Fungsi Pilih Gambar Ganti Avatar
  const pilihFoto = async () => {
    if (!editMode) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      tampilkanPesan("error", "Izin akses galeri diperlukan!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]) {
      const selectedImage = result.assets[0];
      setFotoPreview(selectedImage.uri);

      const uriParts = selectedImage.uri.split(".");
      const fileType = uriParts[uriParts.length - 1];

      setFotoFile({
        uri: selectedImage.uri,
        name: `photo_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      });
    }
  };

  // Fungsi Simpan Form
  const simpan = async () => {
    if (!username.trim() || !email.trim()) {
      tampilkanPesan("error", "Username dan email tidak boleh kosong.");
      return;
    }

    setMenyimpan(true);

    try {
      const formData = new FormData();
      formData.append("username", username.trim());
      formData.append("email", email.trim());

      if (fotoFile) {
        // @ts-ignore
        formData.append("foto", fotoFile);
      }

      const hasil = await updateProfil(formData);
      const dataTerupdate = hasil?.data ?? hasil;

      setProfil(dataTerupdate);
      setEditMode(false);
      setFotoFile(null);
      setFotoPreview(null);
      tampilkanPesan("sukses", "Profil berhasil diperbarui!");
    } catch (err: any) {
      tampilkanPesan("error", err.message || "Gagal memperbarui profil.");
    } finally {
      setMenyimpan(false);
    }
  };

  const batal = () => {
    setUsername(profil?.username ?? "");
    setEmail(profil?.email ?? "");
    setFotoPreview(null);
    setFotoFile(null);
    setEditMode(false);
  };

  const roleConfig = (() => {
    const config: Record<string, { label: string; color: string; bg: string }> = {
      user: { label: "Pengguna", color: "#2563eb", bg: "#eff6ff" },
      admin: { label: "Admin", color: "#d97706", bg: "#fef3c7" },
      superadmin: { label: "SuperAdmin", color: "#059669", bg: "#ecfdf5" },
    };
    return config[profil?.role] || { label: "Pengguna", color: "#2563eb", bg: "#eff6ff" };
  })();

  if (memuat) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10, color: "#94a3b8" }}>Memuat Profil...</Text>
      </View>
    );
  }

  return (
    <Provider>
      {/* HEADER UTAMA + TOMBOL BACK DIARAHKAN KE BERANDA USERS */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
        <TouchableOpacity 
          style={{ width: 40, height: 40, justifyContent: "center", alignItems: "center", borderRadius: 12, backgroundColor: "#f8fafc" }} 
          onPress={() => {
            try {
              router.push("/users/beranda");
            } catch (error) {
              router.back();
            }
          }} 
          activeOpacity={0.7}
        >
          {/* SILAKAN GANTI PATH DI BAWAH INI SESUAI LOKASI FILE IKON BACK KAMU */}
          <Image 
            source={require("@/assets/icons/back-button.png")} 
            style={{ width: 20, height: 20, resizeMode: "contain" }} 
          />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: "bold", color: "#0f172a" }}>Profil Saya</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: "#f8fafc", padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Card Judul Manajemen Profil */}
        <Card style={{ backgroundColor: "white", borderRadius: 24, borderBottomWidth: 4, borderBottomColor: "#2563eb", elevation: 1, marginBottom: 16 }}>
          <Card.Content>
            <View style={{ flexDirection: "column", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "#020617" }}>Manajemen Profil</Text>
                <Text style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, lineHeight: 16 }}>
                  Kelola data personal, kredensial keamanan, dan pantau ringkasan aktivitas akun Anda
                </Text>
              </View>
              
              <View style={{ alignItems: "flex-end", marginTop: 4 }}>
                {editMode ? (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Button mode="text" compact onPress={batal} labelStyle={{ fontSize: 12, fontWeight: "bold", color: "#475569" }}>
                      Batal
                    </Button>
                    <Button
                      mode="contained"
                      compact
                      loading={menyimpan}
                      disabled={menyimpan}
                      onPress={simpan}
                      style={{ backgroundColor: "#2563eb", borderRadius: 12 }}
                      labelStyle={{ fontSize: 11, fontWeight: "bold" }}
                    >
                      Simpan
                    </Button>
                  </View>
                ) : (
                  <Button
                    mode="outlined"
                    compact
                    icon="pencil"
                    onPress={() => setEditMode(true)}
                    style={{ borderColor: "#d9e6ff", backgroundColor: "#eff6ff", borderRadius: 12 }}
                    labelStyle={{ fontSize: 11, color: "#2563eb" }}
                  >
                    Edit Profil
                  </Button>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Card Foto Profil & Status Akun */}
        <Card style={{ backgroundColor: "white", borderRadius: 24, elevation: 1, marginBottom: 16 }}>
          <Card.Content style={{ alignItems: "center", paddingVertical: 12 }}>
            <TouchableOpacity activeOpacity={editMode ? 0.7 : 1} onPress={pilihFoto}>
              <View style={{ position: "relative", width: 110, height: 110, borderRadius: 24, overflow: "hidden", backgroundColor: "#f1f5f9", marginBottom: 12 }}>
                {fotoPreview ? (
                  <Avatar.Image size={110} source={{ uri: fotoPreview }} />
                ) : profil?.foto ? (
                  <Avatar.Image size={110} source={{ uri: `${BASE_URL}/uploads/${profil.foto}` }} />
                ) : (
                  <Avatar.Text size={110} label={(profil?.username || "U").charAt(0).toUpperCase()} style={{ backgroundColor: "#f1f5f9" }} />
                )}
                
                {editMode && (
                  <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(2, 6, 23, 0.6)", justifyContent: "center", alignItems: "center" }}>
                    <Avatar.Icon size={20} icon="camera" color="white" style={{ backgroundColor: "transparent" }} />
                    <Text style={{ color: "white", fontSize: 10, fontWeight: "500" }}>Ubah Foto</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#0f172a" }}>{profil?.username}</Text>
            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>{profil?.email}</Text>

            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, borderWidth: 1, borderColor: "rgba(0,0,0,0.05)", backgroundColor: roleConfig.bg }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, marginRight: 6, backgroundColor: roleConfig.color }} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: roleConfig.color }}>{roleConfig.label}</Text>
            </View>

            <View style={{ width: "100%", height: 1, backgroundColor: "#f1f5f9", marginVertical: 16 }} />

            <View style={{ width: "100%", backgroundColor: "#f8fafc", borderRadius: 12, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 11, fontWeight: "500", color: "#94a3b8" }}>Bergabung Sejak</Text>
              <Text style={{ fontSize: 11, fontWeight: "bold", color: "#334155" }}>
                {profil?.created_at
                  ? new Date(profil.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "-"}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Card Kredensial Form */}
        <Card style={{ backgroundColor: "white", borderRadius: 24, elevation: 1, marginBottom: 16 }}>
          <Card.Content>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              Informasi Kredensial
            </Text>
            
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Username</Text>
              {editMode ? (
                <TextInput
                  mode="outlined"
                  value={username}
                  onChangeText={setUsername}
                  style={{ backgroundColor: "white", fontSize: 12 }}
                  outlineColor="#e2e8f0"
                  activeOutlineColor="#2563eb"
                  dense
                />
              ) : (
                <View style={{ backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#f1f5f9", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#1e293b" }}>{profil?.username || "-"}</Text>
                </View>
              )}
            </View>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>Alamat Email</Text>
              {editMode ? (
                <TextInput
                  mode="outlined"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  style={{ backgroundColor: "white", fontSize: 12 }}
                  outlineColor="#e2e8f0"
                  activeOutlineColor="#2563eb"
                  dense
                />
              ) : (
                <View style={{ backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#f1f5f9", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#1e293b" }}>{profil?.email || "-"}</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Card Grid Statistik Laporan */}
        <Card style={{ backgroundColor: "white", borderRadius: 24, elevation: 1, marginBottom: 16 }}>
          <Card.Content>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              Statistik & Peninjauan Laporan
            </Text>
            
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between", marginTop: 8 }}>
              <View style={{ width: "48%", borderRadius: 16, padding: 16, borderWidth: 1, alignItems: "center", marginBottom: 8, backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#2563eb" }}>{statistik.total}</Text>
                <Text style={{ fontSize: 9, fontWeight: "bold", textTransform: "uppercase", marginTop: 2, letterSpacing: 0.5, color: "#60a5fa" }}>Total Laporan</Text>
              </View>

              <View style={{ width: "48%", borderRadius: 16, padding: 16, borderWidth: 1, alignItems: "center", marginBottom: 8, backgroundColor: "#eef2ff", borderColor: "#e0e7ff" }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#4f46e5" }}>{statistik.diproses}</Text>
                <Text style={{ fontSize: 9, fontWeight: "bold", textTransform: "uppercase", marginTop: 2, letterSpacing: 0.5, color: "#818cf8" }}>Diproses</Text>
              </View>

              <View style={{ width: "48%", borderRadius: 16, padding: 16, borderWidth: 1, alignItems: "center", marginBottom: 8, backgroundColor: "#ecfdf5", borderColor: "#d1fae5" }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#059669" }}>{statistik.selesai}</Text>
                <Text style={{ fontSize: 9, fontWeight: "bold", textTransform: "uppercase", marginTop: 2, letterSpacing: 0.5, color: "#10b981" }}>Selesai</Text>
              </View>

              <View style={{ width: "48%", borderRadius: 16, padding: 16, borderWidth: 1, alignItems: "center", marginBottom: 8, backgroundColor: "#fef2f2", borderColor: "#fee2e2" }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: "#dc2626" }}>{statistik.ditolak}</Text>
                <Text style={{ fontSize: 9, fontWeight: "bold", textTransform: "uppercase", marginTop: 2, letterSpacing: 0.5, color: "#f87171" }}>Ditolak</Text>
              </View>
            </View>

            {editMode && (
              <View style={{ marginTop: 12, backgroundColor: "rgba(239, 246, 255, 0.5)", borderColor: "#bfdbfe", borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: "row", gap: 8 }}>
                <Avatar.Icon size={16} icon="information" color="#2563eb" style={{ backgroundColor: "transparent" }} />
                <Text style={{ flex: 1, fontSize: 10, color: "#1d4ed8", lineHeight: 14, fontWeight: "500" }}>
                  Mode pengeditan aktif. Untuk memperbarui avatar, Anda dapat mengeklik foto profil secara langsung di panel bagian atas.
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Toast Pesan Modul */}
        <Snackbar
          visible={pesan.visible}
          onDismiss={() => setPesan({ ...pesan, visible: false })}
          duration={3500}
          style={{
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: pesan.tipe === "sukses" ? "#a7f3d0" : "#fecaca",
            borderRadius: 16,
          }}
        >
          <Text style={{ color: pesan.tipe === "sukses" ? "#047857" : "#dc2626", fontWeight: "600", fontSize: 13 }}>
            {pesan.teks}
          </Text>
        </Snackbar>

      </ScrollView>
    </Provider>
  );
}