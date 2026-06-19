import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native"; 
import { Provider, Text, Avatar, Button, Card, } from "react-native-paper";
import { useRouter } from "expo-router";

export default function HalamanKeluarMobile() {
  const router = useRouter();
  const [memuat, setMemuat] = useState(false);

  const tanganiKeluar = async () => {
    setMemuat(true);
    try {
      router.replace("/auth/login");
    } catch (error) {
      console.error("Gagal keluar:", error);
    } finally {
      setMemuat(false);
    }
  };

  const tanganiBatal = () => {
    router.back();
  };

  return (
    <Provider>
      <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        <View style={{ flex: 1, padding: 24, opacity: 0.3 }}>
          <View style={{ height: 32, width: 180, backgroundColor: "#e5e7eb", borderRadius: 12, marginBottom: 24 }} />
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 24 }}>
            {[1, 2].map((i) => (
              <View key={i} style={{ width: "47%", height: 112, backgroundColor: "white", borderRadius: 20, borderWidth: 1, borderColor: "#f3f4f6" }} />
            ))}
          </View>

          <View style={{ height: 200, backgroundColor: "white", borderRadius: 20, borderWidth: 1, borderColor: "#f3f4f6", marginBottom: 24 }} />
          <View style={{ height: 150, backgroundColor: "white", borderRadius: 20, borderWidth: 1, borderColor: "#f3f4f6" }} />
        </View>

        <TouchableOpacity activeOpacity={1} onPress={tanganiBatal}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.2)", zIndex: 40 }}
        />

        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, zIndex: 50 }} pointerEvents="box-none">
          <Card style={{ backgroundColor: "white", borderRadius: 32, paddingVertical: 36, paddingHorizontal: 32, width: "100%", maxWidth: 340, alignItems: "center", elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24 }}>
            <Card.Content style={{ alignItems: "center", width: "100%", paddingHorizontal: 0 }}>
              
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#eff6ff", justifyContent: "center", alignItems: "center", marginBottom: 20 }}>
                <Avatar.Icon size={35} icon="logout" color="#2563eb" style={{ backgroundColor: "transparent" }} />
              </View>

              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#111827", textAlign: "center", lineHeight: 26, marginBottom: 8 }}>
                Apakah kamu yakin untuk{"\n"}keluar dari LaporApp?
              </Text>

              <Text style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 20, marginBottom: 17 }}>
                Daftar/Masuk kembali{"\n"}jika ingin menggunakan LaporApp
              </Text>

              <View style={{ width: 120, flexDirection: "column", gap: 9 }}>
                <Button mode="contained" loading={memuat} disabled={memuat} onPress={tanganiKeluar}
                  style={{ backgroundColor: "#2563eb", borderRadius: 10}}
                  labelStyle={{ fontSize: 14, fontWeight: "600", color: "white" }} > Keluar
                </Button>

                <Button mode="outlined" disabled={memuat} onPress={tanganiBatal}
                  style={{ borderColor: "#e5e7eb", backgroundColor: "white", borderRadius: 10 }}
                  labelStyle={{ fontSize: 14, fontWeight: "600", color: "#ef4444" }} > Batal
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </View>
    </Provider>
  );
}