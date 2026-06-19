import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ambilProfil, ambilUnreadCount, BASE_URL } from "@/lib/api";

const kategoriData = [
  {
    id: "infrastruktur",
    title: "Infrastruktur",
    btnBg: "#FFF4DD",
    btnText: "#EB9B10",
    headerBg: "#FFF4DD",
    iconCircleBg: "#F0BB5E",
    titleColor: "#EB9B10",
    subBg: "#FFF4DD",
    iconBtn: require("../../assets/icons/infraorange.png"),
    iconCard: require("../../assets/icons/infraputih.png"),
    desc: "Kategori ini mencakup laporan yang berkaitan dengan pembangunan, pemeliharaan, dan penyediaan fasilitas fisik dasar yang diperlukan untuk menunjang aktivitas masyarakat.",
    subKategori: [
      { nama: "Transportasi", detail: "Jalan rusak, rambu lalu lintas, jembatan" },
      { nama: "Energi & Listrik", detail: "Jaringan listrik, gardu, pemadaman" },
      { nama: "Fasilitas Pembangunan", detail: "Sekolah, Rumah Sakit, Gedung, Fasum" },
      { nama: "Sarana Air", detail: "Pipa bocor, air bersih, irigasi" },
    ],
  },

  {
    id: "lingkungan",
    title: "Lingkungan Hidup",
    btnBg: "#E2F2E5",
    btnText: "#028C60",
    headerBg: "#E2F2E5",
    iconCircleBg: "#34BC88",
    titleColor: "#028C60",
    subBg: "#E2F2E5",
    iconBtn: require("../../assets/icons/lingkunganhijau.png"),
    iconCard: require("../../assets/icons/lingkunganputih.png"),
    desc: "Kategori ini mencakup laporan yang berkaitan dengan kondisi lingkungan di sekitar kita yang dapat berdampak pada kesehatan dan kenyamanan warga.",
    subKategori: [
      { nama: "Sampah Menumpuk", detail: "Sampah liar, TPS ilegal, polusi bau" },
      { nama: "Pencemaran Lingkungan", detail: "Pencemaran air, udara, limbah pabrik" },
      { nama: "Penebangan Pohon", detail: "Penebangan liar, pohon tumbang" },
      { nama: "Drainase Tersumbat", detail: "Got mampet, banjir selokan" },
    ],
  },

  {
    id: "keamanan",
    title: "Keamanan & Ketertiban",
    btnBg: "#DBEAFF",
    btnText: "#024BC8",
    headerBg: "#DBEAFF",
    iconCircleBg: "#1158E4",
    titleColor: "#024BC8",
    subBg: "#DBEAFF",
    iconBtn: require("../../assets/icons/keamananbiru.png"),
    iconCard: require("../../assets/icons/keamananputih.png"),
    desc: "Kategori ini mencakup laporan yang berkaitan dengan upaya memberikan perlindungan kepada masyarakat, penegakan hukum, serta memberikan rasa aman di lingkungan tempat tinggal.",
    subKategori: [
      { nama: "Pengawasan Lingkungan", detail: "Ronda malam, CCTV area umum" },
      { nama: "Perlindungan Masyarakat", detail: "Tindakan kriminal, kekerasan, pelecehan" },
      { nama: "Penanganan Gangguan", detail: "Tawuran, pesta miras, balap liar" },
      { nama: "Ketertiban", detail: "Pelanggaran ijin, pungli" },
    ],
  },

  {
    id: "sosial",
    title: "Sosial & Kemasyarakatan",
    btnBg: "#FEDBDC",
    btnText: "#E61B25",
    headerBg: "#FEDBDC",
    iconCircleBg: "#F44336",
    titleColor: "#E61B25",
    subBg: "#FEDBDC",
    iconBtn: require("../../assets/icons/sosialmerah.png"),
    iconCard: require("../../assets/icons/sosialputih.png"),
    desc: "Kategori ini mencakup seluruh aspek interaksi manusia, termasuk penyelesaian konflik sosial, bantuan konflik, hingga pembangunan kesejahteraan bersama.",
    subKategori: [
      { nama: "Bantuan Sosial", detail: "Salah sasaran, pungutan liar bantuan" },
      { nama: "Konflik Warga", detail: "Perselisihan antar tetangga" },
      { nama: "Kesejahteraan", detail: "Lansia terlantar, anak jalanan" },
      { nama: "Kegiatan", detail: "Izin keramaian, fasilitas sosial" },
    ],
  },

  {
    id: "lainnya",
    title: "Laporan Lainnya",
    btnBg: "#E8E4FC",
    btnText: "#7357E5",
    headerBg: "#E8E4FC",
    iconCircleBg: "#7357E5",
    titleColor: "#7357E5",
    subBg: "#E8E4FC",
    iconBtn: require("../../assets/icons/lainnyaungu.png"),
    iconCard: require("../../assets/icons/kategorisidebar.png"),
    desc: "Pilih opsi ini jika permasalahan Anda tidak termasuk dalam kategori yang tersedia atau Anda ragu menentukan kategori yang tepat.",
    subKategori: [
      { nama: "Informasi Umum", detail: "" },
      { nama: "Aspirasi & Saran", detail: "" },
      { nama: "Administrasi", detail: "" },
      { nama: "Bencana Alam", detail: "" },
      { nama: "Kejadian Unik", detail: "" },
      { nama: "Manajemen", detail: "" },
    ],
  },
];

export default function KategoriScreen() {
  const navigation = useNavigation<any>();
  const router = useRouter();
  const scrollRef = React.useRef<ScrollView>(null);
  const sectionRefs = React.useRef<Record<string, number>>({});

  const [user, setUser] = useState<{ username: string; foto: string | null }>({ username: "", foto: null });
  const [unread, setUnread] = useState(0);
  const inisial = user.username ? user.username.charAt(0).toUpperCase() : "U";

  useEffect(() => {
    ambilProfil()
      .then((res) => { if (res?.data) setUser({ username: res.data.username, foto: res.data.foto }); })
      .catch(() => {});
    ambilUnreadCount()
      .then((res) => setUnread(res?.total_unread ?? 0))
      .catch(() => {});
  }, []);

  const scrollToSection = (id: string) => {
    const y = sectionRefs.current[id];
    if (y !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: y - 16, animated: true });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F7FB" }}>
      <View style={{ backgroundColor: "white", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }} >
            <Image source={require("../../assets/icons/menubar.png")} style={{ width: 22, height: 22 }} resizeMode="contain" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>Kategori</Text>
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

          <TouchableOpacity onPress={() => router.push("/users/profile")}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 4 }} >
            {user.foto ? (
              <Image source={{ uri: `${BASE_URL}/uploads/${user.foto}` }} style={{ width: 28, height: 28, borderRadius: 16 }} />
            ) : (
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>{inisial}</Text>
              </View>
            )}
            <Image source={require("../../assets/icons/tandabawah.png")} style={{ width: 12, height: 12 }} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F172A" }}>Kategori Laporan</Text>
          <Text style={{ fontSize: 13, color: "#94A3B8", marginTop: 2, marginBottom: 16 }}> Pilih kategori yang sesuai dengan masalah yang ingin Anda laporkan. </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {kategoriData.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => scrollToSection(item.id)}
                style={{ backgroundColor: item.btnBg, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center", width: 100, gap: 8, }} >
                <Image source={item.iconBtn} style={{ width: 40, height: 40 }} resizeMode="contain" />
                <Text style={{ fontSize: 11, fontWeight: "700", color: item.btnText, textAlign: "center", lineHeight: 15 }}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={{ fontSize: 16, fontWeight: "700", color: "#0F172A", marginTop: 28, marginBottom: 4 }}> Kenali Kategori Laporan </Text>
          <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}> Informasi lengkap untuk membantu Anda memahami setiap kategori laporan. </Text>

          {kategoriData.map((kat) => (
            <View key={kat.id} onLayout={(e) => { sectionRefs.current[kat.id] = e.nativeEvent.layout.y; }}
              style={{ backgroundColor: "white", borderRadius: 16, marginBottom: 16, overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB", }} >

              <View style={{ backgroundColor: kat.headerBg, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: kat.iconCircleBg, alignItems: "center", justifyContent: "center" }}>
                  <Image source={kat.iconCard} style={{ width: 26, height: 26 }} resizeMode="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: kat.titleColor, marginBottom: 4 }}>{kat.title}</Text>
                  <Text style={{ fontSize: 12, color: "#374151", lineHeight: 18, opacity: 0.85 }}>{kat.desc}</Text>
                </View>
              </View>

              <View style={{ padding: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 10 }}> Contoh laporan yang dapat Anda buat: </Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {kat.subKategori.map((sub, idx) => (
                    <View key={idx}
                      style={{ backgroundColor: kat.subBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, width: kat.id === "lainnya" ? "30%" : "47%", alignItems: "center", justifyContent: "center", }} >
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#1E293B", textAlign: "center" }}>{sub.nama}</Text>
                      {sub.detail ? (
                        <Text style={{ fontSize: 10, color: "#64748B", marginTop: 3, textAlign: "center", lineHeight: 14 }}>{sub.detail}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}