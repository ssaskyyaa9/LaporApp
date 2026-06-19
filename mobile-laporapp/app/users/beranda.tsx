import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, RefreshControl, Modal, TouchableWithoutFeedback } from "react-native";
import { useRouter, useFocusEffect } from "expo-router"; // Ditambahkan useFocusEffect untuk auto-refresh data
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import { ambilDataBeranda, BASE_URL } from "../../lib/api";

interface Statistik { total: number; diproses: number; selesai: number; ditolak: number; }
interface Laporan {
  id_laporan: number; judul: string; lokasi: string;
  status: "Menunggu" | "Dikerjakan" | "Selesai" | "Ditolak";
  gambar: string | null; created_at: string;
}
interface User { username: string; role: string; foto: string | null; }

const badgeStyle: Record<string, { bg: string; text: string }> = {
  Menunggu: { bg: "#EFF6FF", text: "#3B82F6" },
  Dikerjakan: { bg: "#FFFBEB", text: "#F59E0B" },
  Selesai: { bg: "#F0FDF4", text: "#22C55E" },
  Ditolak: { bg: "#FEF2F2", text: "#EF4444" },
};

function formatTanggal(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) +
    " – " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function HalamanBeranda() {
  const router = useRouter();
  const navigation = useNavigation();
  const [statistik, setStatistik] = useState<Statistik>({ total: 0, diproses: 0, selesai: 0, ditolak: 0 });
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [user, setUser] = useState<User>({ username: "", role: "", foto: null });
  const [unread, setUnread] = useState(0);
  const [memuat, setMemuat] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const avatarRef = useRef<any>(null);

  const muatData = useCallback(async () => {
    try {
      const { resStatistik, resLaporan, resUnread, resProfil } = await ambilDataBeranda();
      if (resStatistik?.data) setStatistik(resStatistik.data);
      if (resLaporan?.data) {
        const filtered = (resLaporan.data as Laporan[])
          .filter((l) => ["Menunggu", "Dikerjakan", "Selesai", "Ditolak"].includes(l.status))
          .slice(0, 3);
        setLaporan(filtered);
      }
      setUnread(resUnread?.total_unread ?? 0);
      if (resProfil?.data) setUser({ username: resProfil.data.username, role: resProfil.data.role, foto: resProfil.data.foto });
    } catch (err) {
      console.error("Gagal memuat data beranda:", err);
    } finally {
      setMemuat(false);
      setRefreshing(false);
    }
  }, []);

  // MenggunakanuseFocusEffect menggantikan useEffect agar data ter-update otomatis saat kembali ke halaman ini
  useFocusEffect(
    useCallback(() => {
      muatData();
    }, [muatData])
  );

  const onRefresh = () => { setRefreshing(true); muatData(); };
  const inisial = user.username ? user.username.charAt(0).toUpperCase() : "U";

  const kartuStatistik = [
    { label: "Total", nilai: statistik.total, warna: "#3B82F6", bg: "#EFF6FF", icon: require("../../assets/icons/laporan.png"), size: 20 },
    { label: "Proses", nilai: statistik.diproses, warna: "#F59E0B", bg: "#FFFBEB", icon: require("../../assets/icons/proses.png"), size: 20 },
    { label: "Selesai", nilai: statistik.selesai, warna: "#22C55E", bg: "#F0FDF4", icon: require("../../assets/icons/comment.png"), size: 20 },
    { label: "Ditolak", nilai: statistik.ditolak, warna: "#EF4444", bg: "#FEF2F2", icon: require("../../assets/icons/ditolak.png"), size: 14 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>

      <View style={{ backgroundColor: "white", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }} >
            <Image source={require("../../assets/icons/menubar.png")} style={{ width: 22, height: 22 }} resizeMode="contain" />
          </TouchableOpacity>

          <Image source={require("../../assets/icons/logo LaporApp.png")} style={{ width: 50, height: 50, right: 7 }} resizeMode="contain" />
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#2563EB", letterSpacing: -0.3, right: 12 }}>LaporApp </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={() => router.push("/users/notifikasi")}>
            <Image source={require("../../assets/icons/notifhitam.png")} style={{ width: 20, height: 20 }} resizeMode="contain" />
            {unread > 0 && (
              <View style={{ position: "absolute", top: -4, right: -4, backgroundColor: "#EF4444", borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "700" }}>{unread > 9 ? "9+" : unread}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            ref={avatarRef}
            onPress={() => {
              avatarRef.current?.measure((_x: number, _y: number, _w: number, _h: number, px: number, py: number) => {
                setDropdownPos({ top: py + _h + 6, right: 16 });
                setShowDropdown(true);
              });
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 4 }}
          >
            {user.foto ? (
              <Image source={{ uri: `${BASE_URL}/uploads/${user.foto}` }} style={{ width: 28, height: 28, borderRadius: 16 }} />
            ) : (
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>{inisial}</Text>
              </View>
            )}
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", maxWidth: 80 }} numberOfLines={1}></Text>
            <Image source={require("../../assets/icons/tandabawah.png")} style={{ width: 12, height: 12 }} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal transparent visible={showDropdown} animationType="fade" onRequestClose={() => setShowDropdown(false)}>
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={{ flex: 1 }}>
            <View style={{ position: "absolute", top: dropdownPos.top, right: dropdownPos.right, backgroundColor: "#FFFFFF", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, minWidth: 190, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8, borderWidth: 1, borderColor: "#F3F4F6", }}>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                {user.foto ? (
                  <Image source={{ uri: `${BASE_URL}/uploads/${user.foto}` }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>{inisial}</Text>
                  </View>
                )}

                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>{user.username}</Text>
                  <View style={{ marginTop: 3, backgroundColor: "#EFF6FF", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start" }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#2563EB" }}>{user.role}</Text>
                  </View>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: "#F3F4F6", marginBottom: 4 }} />

              <TouchableOpacity onPress={() => { setShowDropdown(false); router.push("/users/profile"); }} style={{ paddingVertical: 10 }}>
                <Text style={{ fontSize: 14, color: "#374151", fontWeight: "500" }}>Profil Saya</Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: "#F3F4F6", marginVertical: 2 }} />

              <TouchableOpacity onPress={() => { setShowDropdown(false); router.push("/users/keluar")}} style={{ paddingVertical: 10 }}>
                <Text style={{ fontSize: 14, color: "#EF4444", fontWeight: "600" }}>Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} />} >
        <View style={{ padding: 16 }}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 25, fontWeight: "700", color: "#111827" }}>Beranda</Text>
          </View>

          <View style={{ backgroundColor: "#2563EB", borderRadius: 20, marginBottom: 20, padding: 20, shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 3, overflow: "hidden", position: "relative" }}>
            <View style={{ position: "absolute", right: -40, top: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: "#3B82F6", opacity: 0.3 }} />
            <View style={{ position: "absolute", right: 20, bottom: -50, width: 100, height: 100, borderRadius: 50, backgroundColor: "#1D4ED8", opacity: 0.5 }} />
            
            <View style={{ flex: 1, paddingRight: 80, zIndex: 1 }}>
              <View style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600", letterSpacing: 0.3 }}>KOLABORASI WARGA</Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: "800", color: "#FFFFFF", lineHeight: 24, marginBottom: 6 }}>
                Bersama Ciptakan Layanan{"\n"}Masyarakat yang Lebih Baik
              </Text>
              <Text style={{ fontSize: 12, color: "#BFDBFE", fontWeight: "500", lineHeight: 16 }}>
                Terima kasih telah bergabung dan membagikan laporan terpercaya Anda di LaporApp.
              </Text>
            </View>
          </View>

          {memuat ? (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={{ flex: 1, height: 90, borderRadius: 12, backgroundColor: "#E5E7EB" }} />
              ))}
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {kartuStatistik.map((k, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#F3F4F6", alignItems: "center", elevation: 1 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: k.bg, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                    <Image source={k.icon} style={{ width: k.size, height: k.size }} resizeMode="contain" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: k.warna }}>{k.nilai}</Text>
                  <Text style={{ fontSize: 10, color: "#6B7280", marginTop: 2, textAlign: "center" }}>{k.label}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#F3F4F6", elevation: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>Tips Pelaporan</Text>
              <Text style={{ fontSize: 11, color: "#9CA3AF", textAlign: "right" }}>Ikuti tips berikut</Text>
            </View>

            {[
              { bg: "#EFF6FF", icon: require("../../assets/icons/kamera.png"), judul: "Gunakan foto jelas", desc: "Ambil foto yang jelas agar petugas dapat memahami kondisi dengan baik.", judulWarna: "#111827" },
              { bg: "#F0FDF4", icon: require("../../assets/icons/lokasiberanda.png"), judul: "Pastikan Lokasi Akurat", desc: "Pastikan lokasi sesuai dengan titik kejadian agar dapat ditindaklanjuti.", judulWarna: "#111827" },
              { bg: "#FFF7ED", icon: require("../../assets/icons/kronologi.png"), judul: "Jelaskan Kronologi", desc: "Tulis deskripsi masalah secara singkat, jelas, dan sesuai kondisi sebenarnya.", judulWarna: "#F59E0B" },
            ].map((tip, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: 12, marginBottom: 8, backgroundColor: tip.bg }}>
                <View style={{ width: 56, height: 56, backgroundColor: "#FFFFFF", borderRadius: 28, alignItems: "center", justifyContent: "center", elevation: 1 }}>
                  <Image source={tip.icon} style={{ width: 38, height: 38 }} resizeMode="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: tip.judulWarna, marginBottom: 4 }}>{tip.judul}</Text>
                  <Text style={{ fontSize: 11, color: "#6B7280", lineHeight: 16 }}>{tip.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#F3F4F6", elevation: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>Laporan Terbaru</Text>
              <TouchableOpacity onPress={() => router.push("/users/semualaporan")}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#2563EB" }}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {memuat ? (
              [1, 2, 3].map((i) => (
                <View key={i} style={{ height: 80, borderRadius: 12, backgroundColor: "#E5E7EB", marginBottom: 10 }} />
              ))
            ) : laporan.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Image source={require("../../assets/icons/buatyuk.png")} style={{ width: 28, height: 28, opacity: 0.4 }} />
                </View>

                <Text style={{ fontSize: 14, fontWeight: "600", color: "#6B7280" }}>Belum ada laporan</Text>
                <Text style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4, textAlign: "center" }}>Laporan yang kamu buat akan muncul di sini.</Text>
                
                <TouchableOpacity onPress={() => router.push("/users/buatlaporan")} style={{ marginTop: 16, backgroundColor: "#2563EB", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }} >
                  <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}>Buat Laporan</Text>
                </TouchableOpacity>
              </View>

            ) : (
              laporan.map((item) => (
                <TouchableOpacity key={item.id_laporan} onPress={() => router.push(`/users/laporan/${item.id_laporan}` as any)}
                  activeOpacity={0.7}
                  style={{ flexDirection: "row", alignItems: "center", paddingVertical: 11, gap: 12 }}
                >
                  <View style={{ width: 72, height: 64, borderRadius: 10, overflow: "hidden", backgroundColor: "#F3F4F6" }}>
                    {item.gambar ? (
                      <Image source={{ uri: `${BASE_URL}/uploads/${item.gambar}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    ) : (
                      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <Image source={require("../../assets/icons/buatlaporan.png")} style={{ width: 24, height: 24, opacity: 0.3 }} />
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 2 }} numberOfLines={1}>{item.judul}</Text>
                    <Text style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }} numberOfLines={1}>{item.lokasi?.split(",").slice(0, 3).join(",")}</Text>
                    <Text style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 6 }}>{formatTanggal(item.created_at)}</Text>
                    <View style={{ alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, backgroundColor: badgeStyle[item.status]?.bg ?? "#F3F4F6" }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: badgeStyle[item.status]?.text ?? "#6B7280" }}>{item.status}</Text>
                    </View>
                  </View>
                  <Image source={require("../../assets/icons/detail.png")} style={{ width: 14, height: 14, tintColor: "#D1D5DB" }} resizeMode="contain" />
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: "#F3F4F6", elevation: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Image source={require("../../assets/icons/bintangkuning.png")} style={{ width: 22, height: 22 }} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }}>Sorotan Warga</Text>
            </View>
            <Text style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 10 }}> Laporan dengan apresiasi terbanyak dari warga minggu ini </Text>

            <View style={{ borderRadius: 12, overflow: "hidden", marginBottom: 12, height: 160, backgroundColor: "#1F2937" }}>
              <Image source={require("../../assets/icons/sorotan.jpeg")} style={{ width: "100%", height: "100%", opacity: 0.8 }} resizeMode="cover" />
              <View style={{ position: "absolute", top: 12, left: 12, backgroundColor: "#2563EB", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
                <Image source={require("../../assets/icons/bintangputih.png")} style={{ width: 12, height: 12 }} />
                <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>Paling Bermanfaat</Text>
              </View>
            </View>

            <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 2 }}>Lampu jalan mati di Jl. Merdeka</Text>
            <Text style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8 }}>Jl. Merdeka No. 47, Bogor</Text>
            <Text style={{ fontSize: 12, color: "#6B7280" }}> Dilaporkan oleh <Text style={{ fontWeight: "600", color: "#374151" }}>Rico Pratama</Text> </Text>
            <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Diselesaikan 1 minggu yang lalu</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}