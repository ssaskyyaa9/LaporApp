import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Modal, Pressable, KeyboardAvoidingView, Platform, Alert, Dimensions, StatusBar, Linking, Keyboard, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ambilLaporanById, ambilKomentar, buatKomentar, editKomentar, hapusKomentar, ambilProfil, BASE_URL } from "../../../lib/api";

const { width: SCREEN_W } = Dimensions.get("window");

type Laporan = {
    id_laporan: number;
    judul: string;
    deskripsi: string;
    lokasi?: string;
    status: "Menunggu" | "Dikerjakan" | "Selesai" | "Ditolak";
    nama_kategori: string;
    username: string;
    foto?: string;
    gambar?: string;
    created_at: string;
};

type Komentar = {
    id_komentar: number;
    id_users: number;
    username: string;
    foto?: string;
    isi_komentar: string;
    tanggal: string;
};

type User = {
    id: number;
    username: string;
    foto?: string;
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
    Menunggu: { bg: "#DBEAFE", text: "#2563EB" },
    Dikerjakan: { bg: "#FEF3C7", text: "#D97706" },
    Selesai: { bg: "#D1FAE5", text: "#059669" },
    Ditolak: { bg: "#FEE2E2", text: "#DC2626" },
};

const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
    Infrastruktur: { bg: "#FEF3C7", text: "#D97706" },
    "Lingkungan Hidup": { bg: "#D1FAE5", text: "#059669" },
    "Keamanan & Ketertiban": { bg: "#DBEAFE", text: "#2563EB" },
    "Sosial & Kemasyarakatan": { bg: "#FCE7F3", text: "#DB2777" },
    Lainnya: { bg: "#EDE9FE", text: "#7C3AED" },
};

function formatTanggal(tanggal: string) {
    return new Date(tanggal).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function formatWaktuRelatif(tanggal: string) {
    const diff = Math.floor((Date.now() - new Date(tanggal).getTime()) / 1000);
    if (diff < 60) return `${diff}d`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j`;
    return `${Math.floor(diff / 86400)}h`;
}

function Avatar({ foto, username, size = 42 }: { foto?: string; username: string; size?: number }) {
    const [error, setError] = useState(false);
    const uri = foto ? `${BASE_URL}/uploads/${foto}` : null;

    if (uri && !error) {
        return (
            <Image 
                source={{ uri }} 
                onError={() => setError(true)}
                style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#E5E7EB" }}
            />
        );
    }

    return (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: size * 0.4 }}>
                {username?.charAt(0)?.toUpperCase()}
            </Text>
        </View>
    );
}

export default function DetailLaporan() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [laporan, setLaporan] = useState<Laporan | null>(null);
    const [listKomentar, setListKomentar] = useState<Komentar[]>([]);
    const [user, setUser] = useState<User>({ id: 0, username: "" });
    const [loading, setLoading] = useState(true);
    const [inputKomentar, setInputKomentar] = useState("");
    const [mengirim, setMengirim] = useState(false);
    const [imgZoom, setImgZoom] = useState(false);
    const [editState, setEditState] = useState<{ id: number; teks: string } | null>(null);
    const [menuKomentar, setMenuKomentar] = useState<number | null>(null);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [resLaporan, resKomentar, resProfil] = await Promise.all([
                ambilLaporanById(Number(id)),
                ambilKomentar(id),
                ambilProfil(),
            ]);

            const dataLaporan = resLaporan?.data ?? resLaporan;
            setLaporan(dataLaporan);

            const profil = resProfil?.data ?? resProfil;
            setUser({
                id: profil?.id_users ?? profil?.id ?? 0,
                username: profil?.username ?? "",
                foto: profil?.foto ?? undefined,
            });

            const komentar = resKomentar?.data ?? resKomentar ?? [];
            setListKomentar(
                [...komentar].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
            );
        } catch (err: any) {
            Alert.alert("Error", err.message || "Gagal memuat data");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Memantau status keyboard aktif/tidaknya
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));
        
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // Handle Back Button bawaan Android
    useEffect(() => {
        const backAction = () => {
            if (isKeyboardVisible) {
                Keyboard.dismiss();
                return true; // Menahan aksi agar tidak keluar halaman, hanya menutup keyboard
            }
            return false; // Mengikuti flow bawaan (kembali ke halaman sebelumnya)
        };

        const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => subscription.remove();
    }, [isKeyboardVisible]);

    const reloadKomentar = async () => {
        const res = await ambilKomentar(id);
        const data = res?.data ?? res ?? [];
        setListKomentar(
            [...data].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
        );
    };

    const handleKirimKomentar = async () => {
        if (!inputKomentar.trim() || mengirim) return;
        try {
            setMengirim(true);
            await buatKomentar({ laporan_id: id, isi: inputKomentar });
            setInputKomentar("");
            Keyboard.dismiss();
            await reloadKomentar();
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setMengirim(false);
        }
    };

    const handleEditKomentar = async () => {
        if (!editState) return;
        try {
            await editKomentar(editState.id, editState.teks);
            setEditState(null);
            await reloadKomentar();
        } catch (err: any) {
            Alert.alert("Error", err.message);
        }
    };

    const handleHapusKomentar = (idKomentar: number) => {
        Alert.alert("Hapus Komentar", "Yakin ingin menghapus komentar?", [
            { text: "Batal", style: "cancel" },
            {
                text: "Hapus",
                style: "destructive",
                onPress: async () => {
                    try {
                        await hapusKomentar(idKomentar);
                        setListKomentar((prev) => prev.filter((item) => item.id_komentar !== idKomentar));
                    } catch (err: any) {
                        Alert.alert("Error", err.message);
                    }
                },
            },
        ]);
    };

    const bukaMaps = () => {
        if (!laporan?.lokasi) return;
        const lokasi = laporan.lokasi.trim();
        const url = Platform.OS === "ios" ? `maps:0,0?q=${encodeURIComponent(lokasi)}` : `geo:0,0?q=${encodeURIComponent(lokasi)}`;
        Linking.openURL(url);
    };

    const statusStyle = STATUS_STYLE[laporan?.status || "Menunggu"];
    const categoryStyle = CATEGORY_STYLE[laporan?.nama_kategori || "Lainnya"];
    const gambarUri = laporan?.gambar ? `${BASE_URL}/uploads/${laporan.gambar}` : null;

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#F9FAFB" }}
            behavior={Platform.OS === "ios" ? "padding" : "height"} enabled={true}
            keyboardVerticalOffset={Platform.OS === "ios" ? -40 : -40}
        >
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={{ backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", paddingTop: insets.top,  }} >
                <TouchableOpacity onPress={() => router.back()} >
                    <Image source={require("../../../assets/icons/back-button.png")} style={{ width: 26, height: 26, resizeMode: "contain", top: 10 }} />
                </TouchableOpacity>
                <Text style={{ top: 10, marginLeft: 14, fontSize: 25, fontWeight: "800", color: "#111827" }} > Detail Laporan </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 30 }} >
                <Pressable onPress={Keyboard.dismiss}>
                    <View style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 18 }} >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }} >
                            <View style={{ backgroundColor: categoryStyle.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }} >
                                <Text style={{ color: categoryStyle.text, fontWeight: "700", fontSize: 12 }} >{laporan?.nama_kategori} </Text>
                            </View>

                            <View style={{ backgroundColor: statusStyle.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }} >
                                <Text style={{ color: statusStyle.text, fontWeight: "700", fontSize: 12 }}>{laporan?.status} </Text>
                            </View>
                        </View>

                        <Text style={{ fontSize: 24, fontWeight: "800", color: "#111827", lineHeight: 32 }}>{laporan?.judul} </Text>
                        <View style={{ height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 }} />

                        <View style={{ flexDirection: "row", alignItems: "center" }} >
                            <Avatar foto={laporan?.foto} username={laporan?.username || ""} />
                            <View style={{ marginLeft: 10, flex: 1 }} >
                                <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827" }} > {laporan?.username} </Text>
                                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }} >
                                    <Image source={require("../../../assets/icons/jam.png")} style={{ width: 14, height: 14, resizeMode: "contain", left: 3 }} />
                                    <Text style={{ marginLeft: 6, fontSize: 12, color: "#6B7280" }} > {formatTanggal(laporan?.created_at || "")} </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {gambarUri && (
                        <TouchableOpacity activeOpacity={0.95} onPress={() => setImgZoom(true)} style={{ marginTop: 16 }} >
                            <Image source={{ uri: gambarUri }} style={{ width: "100%", height: 250, borderRadius: 24, backgroundColor: "#E5E7EB" }} />
                        </TouchableOpacity>
                    )}

                    <View style={{ marginTop: 16, backgroundColor: "#FFFFFF", borderRadius: 24, padding: 18 }} >
                        <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827", marginBottom: 12 }}>Deskripsi </Text>
                        <Text style={{ fontSize: 14, color: "#4B5563", lineHeight: 24 }}>{laporan?.deskripsi} </Text>
                    </View>

                    {laporan?.lokasi && (
                        <View style={{ marginTop: 16, backgroundColor: "#FFFFFF", borderRadius: 24, padding: 18 }} >
                            <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827", marginBottom: 12 }}>Lokasi </Text>
                            <Text style={{ color: "#6B7280", lineHeight: 22 }} > {laporan.lokasi} </Text>
                            <TouchableOpacity onPress={bukaMaps} style={{ marginTop: 14, alignSelf: "flex-start", backgroundColor: "#EFF6FF", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }} >
                                <Text style={{ color: "#2563EB", fontWeight: "700" }}>Buka Maps </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={{ marginTop: 26, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }} >
                        <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>Komentar </Text>
                        <Text style={{ color: "#2563EB", fontWeight: "700" }} >{listKomentar.length} </Text>
                    </View>

                    {/* List Komentar */}
                    {listKomentar.map((item) => {
                        const milikSaya = item.id_users === user.id;
                        const sedangEdit = editState?.id === item.id_komentar;

                        return (
                            <View key={item.id_komentar} style={{ flexDirection: "row", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }} >
                                <Avatar foto={item.foto} username={item.username} size={40} />
                                <View style={{ flex: 1, marginLeft: 12 }} >
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }} >
                                        <View>
                                            <Text style={{ fontWeight: "700", color: "#111827" }} > {item.username} </Text>
                                            <Text style={{ color: "#9CA3AF", fontSize: 12 }} > {formatWaktuRelatif(item.tanggal)} </Text>
                                        </View>

                                        {milikSaya && (
                                            <View style={{ zIndex: 10 }}>
                                                <TouchableOpacity onPress={() => setMenuKomentar(menuKomentar === item.id_komentar ? null : item.id_komentar)} style={{ paddingHorizontal: 8, paddingVertical: 4 }} >
                                                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#6B7280" }} > ⋮ </Text>
                                                </TouchableOpacity>

                                                {menuKomentar === item.id_komentar && (
                                                    <View style={{ position: "absolute", top: 28, right: 0, backgroundColor: "#FFF", borderRadius: 12, paddingVertical: 6, minWidth: 100, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, zIndex: 20 }} >
                                                        <TouchableOpacity onPress={() => { setMenuKomentar(null); setEditState({ id: item.id_komentar, teks: item.isi_komentar }); }} style={{ paddingHorizontal: 14, paddingVertical: 10 }} >
                                                            <Text style={{ color: "#2563EB", fontWeight: "600" }} > Edit </Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => { setMenuKomentar(null); handleHapusKomentar(item.id_komentar); }} style={{ paddingHorizontal: 14, paddingVertical: 10 }} >
                                                            <Text style={{ color: "#EF4444", fontWeight: "600" }} > Hapus </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>

                                    {sedangEdit ? (
                                        <View style={{ zIndex: 1 }}>
                                            <TextInput value={editState.teks} onChangeText={(text) => setEditState({ ...editState, teks: text })} textAlignVertical="top" multiline style={{ backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14, padding: 12, marginTop: 10 }} />
                                            <View style={{ flexDirection: "row", marginTop: 10, gap: 10 }} >
                                                <TouchableOpacity onPress={handleEditKomentar} style={{ backgroundColor: "#2563EB", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }} >
                                                    <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 12 }} > Simpan </Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => setEditState(null)} style={{ backgroundColor: "#E5E7EB", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }} >
                                                    <Text style={{ color: "#4B5563", fontWeight: "700", fontSize: 12 }} > Batal </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : ( 
                                        <Text style={{ marginTop: 8, color: "#374151", lineHeight: 22 }} > {item.isi_komentar} </Text> 
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </Pressable>
            </ScrollView>

            <View style={{ backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 10, flexDirection: "row", alignItems: "center" }} >
                <TextInput value={inputKomentar} onChangeText={setInputKomentar} placeholder="Tulis komentar..." style={{ flex: 1, backgroundColor: "#F9FAFB", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, marginRight: 10, color: "#111827" }} />
                <TouchableOpacity onPress={handleKirimKomentar} disabled={!inputKomentar.trim() || mengirim} >
                    {mengirim ? ( 
                        <ActivityIndicator color="#2563EB" /> 
                    ) : (
                        <Image source={require("../../../assets/icons/kirimkomen.png")} style={{ width: 38, height: 38, resizeMode: "contain" }} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Modal Image Zoom */}
            <Modal visible={imgZoom} transparent animationType="fade" >
                <Pressable onPress={() => setImgZoom(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" }} >
                    <Image source={{ uri: gambarUri || "" }} resizeMode="contain" style={{ width: SCREEN_W, height: SCREEN_W * 1.2 }} />
                </Pressable>
            </Modal>
        </KeyboardAvoidingView>
    );
}