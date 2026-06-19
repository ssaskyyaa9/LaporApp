import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Animated, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useState, useRef } from "react";
import { loginApi } from "../../lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailAnim = useRef(new Animated.Value(0)).current;
  const passwordAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useState(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  });

  const handleFocus = (field: string, anim: Animated.Value) => {
    setFocusedField(field);
    Animated.spring(anim, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }).start();
  };

  const handleBlur = (anim: Animated.Value) => {
    setFocusedField(null);
    Animated.spring(anim, { toValue: 0, tension: 100, friction: 6, useNativeDriver: true }).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Gagal", "Email dan password wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      await loginApi(email, password);
      router.replace("/users/beranda");
    } catch (error: any) {
      Alert.alert("Gagal Login", error.message);
    } finally {
      setLoading(false);
    }
  };

  const emailScale = emailAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const passwordScale = passwordAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const cardOpacity = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ flex: 1, backgroundColor: "#E8F1FD" }}>
      <TouchableOpacity onPress={() => router.back()}
        style={{ marginTop: 70, marginLeft: 20, width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
        <Image source={require("../../assets/icons/tandasidebar.png")} style={{ width: 40, height: 40, resizeMode: "contain" }} />
      </TouchableOpacity>

      <Animated.View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 70, paddingBottom: 40, opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5 }}>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <Image source={require("../../assets/icons/logo LaporApp.png")} style={{ width: 70, height: 70, resizeMode: "contain" }} />
            <Text style={{ marginRight: 30, fontSize: 30, fontWeight: "800", color: "#1A1A2E" }}>
              Lapor<Text style={{ color: "#1E55DF" }}>App</Text>
            </Text>
          </View>

          <Text style={{ fontSize: 22, fontWeight: "700", color: "#1A1A2E", textAlign: "center", marginBottom: 6, marginRight: 10 }}>Selamat Datang Kembali!</Text>
          <Text style={{ fontSize: 13, color: "#A0AEC0", textAlign: "center", marginBottom: 40, marginRight: 10 }}>Masuk untuk melanjutkan ke akun Anda</Text>

          <Animated.View style={{ transform: [{ scale: emailScale }] }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FDFDFD", borderRadius: 12, borderWidth: 1.5, borderColor: focusedField === "email" ? "#7ca3ff" : "#E9E9ED", marginBottom: 18, paddingHorizontal: 15 }}>
              <Image source={require("../../assets/icons/email.png")} style={{ width: 18, height: 18, resizeMode: "contain", tintColor: focusedField === "email" ? "#3B6FE8" : "#A0AEC0", marginRight: 10 }} />
              <TextInput placeholder="Email" placeholderTextColor="#999"
                keyboardType="email-address" autoCapitalize="none"
                value={email} onChangeText={setEmail}
                onFocus={() => handleFocus("email", emailAnim)}
                onBlur={() => handleBlur(emailAnim)}
                style={{ flex: 1, paddingVertical: 12, fontSize: 15 }} />
            </View>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: passwordScale }] }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FDFDFD", borderRadius: 12, borderWidth: 1.5, borderColor: focusedField === "password" ? "#7ca3ff" : "#E9E9ED", marginBottom: 25, paddingHorizontal: 15 }}>
              <Image source={require("../../assets/icons/password.png")} style={{ width: 18, height: 18, resizeMode: "contain", tintColor: focusedField === "password" ? "#3B6FE8" : "#A0AEC0", marginRight: 10 }} />
              <TextInput placeholder="Kata sandi" placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password} onChangeText={setPassword}
                onFocus={() => handleFocus("password", passwordAnim)}
                onBlur={() => handleBlur(passwordAnim)}
                style={{ flex: 1, paddingVertical: 12, fontSize: 15 }} />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Image source={require("../../assets/icons/matapassword.png")}
                  style={{ width: 20, height: 20, resizeMode: "contain", tintColor: "#A0AEC0" }} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <TouchableOpacity onPress={handleLogin} disabled={loading}
            style={{ backgroundColor: "#1E55DF", paddingVertical: 14, borderRadius: 12, shadowColor: "#3B6FE8", shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6, opacity: loading ? 0.7 : 1 }}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: "white", fontSize: 17, fontWeight: "500", textAlign: "center" }}>Masuk</Text>
            }
          </TouchableOpacity>

          <Text style={{ textAlign: "center", marginTop: 18, marginBottom: 25, fontSize: 14, color: "#444" }}>
            Belum punya akun?
            <Text onPress={() => router.push("/")} style={{ color: "#1E55DF", fontWeight: "700" }}> Daftar sekarang</Text>
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}