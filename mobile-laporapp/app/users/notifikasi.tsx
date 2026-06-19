import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, Alert, Image, } from "react-native";
import { Provider, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { ambilNotifikasi, ambilUnreadCount, tandaiSemuaNotifikasiDibaca, hapusNotifikasi, hapusSemuaNotifikasi, } from "../../lib/api";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";

const STATUS_CONFIG: Record<string, { dot: string; label: string }> = {
  Selesai: { dot: "#10b981", label: "Laporan sudah diselesaikan", },
  Dikerjakan: { dot: "#f59e0b", label: "Laporan sedang diproses", },
  Ditolak: { dot: "#ef4444", label: "Laporan ditolak", },
  Menunggu: { dot: "#94a3b8", label: "Laporan baru masuk", },
  Disetujui: { dot: "#3b82f6", label: "Laporan disetujui", },
};

function waktuRelatif(tanggal: string) {
  const diff = Math.floor((Date.now() - new Date(tanggal).getTime()) / 1000);
  if (diff < 60) return `${diff} detik yang lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
  return `${Math.floor(diff / 86400)} hari yang lalu`;
}

export default function NotifikasiScreen() {
  const router = useRouter();
  const [notifikasi, setNotifikasi] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | string | null>(null);
  const [hapusSemua, setHapusSemua] = useState(false);
  const navigation = useNavigation<any>();

  const muatData = useCallback(async () => {
    try {
      setLoading(true);
      const [resNotif, resUnread] = await Promise.all([
        ambilNotifikasi(),
        ambilUnreadCount()
      ]);

      const dataNotif = resNotif?.data ?? resNotif;
      setNotifikasi(Array.isArray(dataNotif) ? dataNotif : []);
      setUnread(resUnread?.total_unread ?? 0);
    } catch (err) {
      console.error(err);
      setNotifikasi([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muatData();
    const tandai = async () => {
      try {
        await tandaiSemuaNotifikasiDibaca();
      } catch (err) {
        console.error("Gagal menandai semua dibaca:", err);
      }
    };
    tandai();
  }, [muatData]);

  const tanganiBukaDetailLaporan = (idLaporan: number | string) => {
    if (idLaporan) {
      router.push(`/users/laporan/${idLaporan}`);
    } else {
      Alert.alert("Informasi", "ID Laporan tidak ditemukan pada notifikasi ini.");
    }
  };

  const tanganiHapusNotif = async (id: number | string) => {
    setRemoving(id);
    setTimeout(async () => {
      try {
        await hapusNotifikasi(id);
        setNotifikasi((prev) => prev.filter((n) => n.id_notifikasi !== id));
      } catch (err) {
        console.error("Gagal hapus notifikasi:", err);
      } finally {
        setRemoving(null);
      }
    }, 250);
  };

  const tanganiHapusSemua = async () => {
    setHapusSemua(true);
    try {
      await hapusSemuaNotifikasi();
      setNotifikasi([]);
      setUnread(0);
    } catch (err) {
      console.error("Gagal hapus semua notifikasi:", err);
    } finally {
      setHapusSemua(false);
    }
  };

  return (
    <Provider>
      <View style={{ flex: 1, backgroundColor: "#f5f7fb" }}>
        <View style={{ paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, flex: 1, marginRight: 12 }}>
              <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 2 }} >
                <Image source={require("../../assets/icons/menubar.png")} style={{ width: 22, height: 22 }} resizeMode="contain" />
              </TouchableOpacity>

              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1e293b", letterSpacing: -0.5 }}> Notifikasi </Text>
                  {unread > 0 && (
                    <View style={{ backgroundColor: "#3b82f6", minWidth: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center", paddingHorizontal: 6 }}>
                      <Text style={{ color: "white", fontSize: 11, fontWeight: "bold" }}>{unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {notifikasi.length > 0 && (
              <TouchableOpacity onPress={tanganiHapusSemua} disabled={hapusSemua} activeOpacity={0.7}
                style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, opacity: hapusSemua ? 0.5 : 1, }} >
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#ef4444" }}> Hapus Semua </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={{ flex: 1, paddingHorizontal: 24 }} contentContainerStyle={{ paddingBottom: 32 }}>
          
          {loading ? (
            <View style={{ flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={{ backgroundColor: "white", borderRadius: 16, padding: 20, flexDirection: "row", alignItems: "flex-start", gap: 16 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#e2e8f0", marginTop: 4 }} />
                  <View style={{ flex: 1, flexDirection: "column", gap: 8 }}>
                    <View style={{ height: 16, backgroundColor: "#e2e8f0", borderRadius: 4, width: "40%" }} />
                    <View style={{ height: 14, backgroundColor: "#f1f5f9", borderRadius: 4, width: "80%" }} />
                    <View style={{ height: 12, backgroundColor: "#f1f5f9", borderRadius: 4, width: "25%" }} />
                  </View>
                </View>
              ))}
            </View>

          ) : notifikasi.length === 0 ? (
            <View style={{ backgroundColor: "white", borderRadius: 20, paddingVertical: 64, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#f1f5f9", marginTop: 12 }}>
              <Text style={{ color: "#334155", fontWeight: "600", fontSize: 16 }}>Tidak ada notifikasi</Text>
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 4, textAlign: "center", paddingHorizontal: 16 }}> Semua notifikasi sudah dibaca atau belum ada laporan baru. </Text>
            </View>

          ) : (
            <View style={{ flexDirection: "column", gap: 12 }}>
              {notifikasi.map((notif) => {
                const cfg = STATUS_CONFIG[notif.status] ?? STATUS_CONFIG.Menunggu;
                const isRemoving = removing === notif.id_notifikasi;

                return (
                  <TouchableOpacity key={notif.id_notifikasi} activeOpacity={0.8} onPress={() => tanganiBukaDetailLaporan(notif.id_laporan)}
                    style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#f1f5f9", paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "flex-start", gap: 16, borderLeftWidth: !notif.is_read ? 4 : 1, borderLeftColor: !notif.is_read ? "#3b82f6" : "#f1f5f9", opacity: isRemoving ? 0 : 1, transform: [{ scale: isRemoving ? 0.95 : 1 }], }} >
                    <View style={{ width: 12, height: 12, borderRadius: 6, marginTop: 4, backgroundColor: cfg.dot }} />

                    <View style={{ flex: 1, flexDirection: "column" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                        <Text style={{ fontWeight: "700", color: "#1e293b", fontSize: 14 }}> {cfg.label} </Text>
                      </View>

                      <Text style={{ color: "#64748b", fontSize: 13, marginTop: 4, lineHeight: 18 }}> {notif.pesan} </Text>

                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 6 }}>
                        <Image source={require("../../assets/icons/jam.png")} style={{ width: 14, height: 14, resizeMode: "contain" }} />
                        <Text style={{ color: "#94a3b8", fontSize: 12 }}> {waktuRelatif(notif.tanggal)} </Text>
                      </View>
                    </View>

                    <TouchableOpacity onPress={() => tanganiHapusNotif(notif.id_notifikasi)} activeOpacity={0.5}
                      style={{ paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start", }} accessibilityLabel="Hapus" >
                      <Text style={{ color: "#94a3b8", fontSize: 15, fontWeight: "bold" }}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </Provider>
  );
}