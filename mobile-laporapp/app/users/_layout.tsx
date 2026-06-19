import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { useRouter, usePathname } from "expo-router";
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from "react-native";

const menus = [
  { title: "Beranda",        icon: require("@/assets/icons/beranda.png"),          route: "/users/beranda" },
  { title: "Buat Laporan",   icon: require("@/assets/icons/buatlaporan.png"),      route: "/users/buatlaporan" },
  { title: "Riwayat Laporan",icon: require("@/assets/icons/riwayatlaporan.png"),   route: "/users/riwayatlaporan" },
  { title: "Kategori"       ,icon: require("@/assets/icons/kategorisidebar.png"),  route: "/users/kategori" },
  { title: "Notifikasi",     icon: require("@/assets/icons/notifikasi.png"),       route: "/users/notifikasi" },
  { title: "Profile",        icon: require("@/assets/icons/profile (2).png"),      route: "/users/profile" },
  { title: "keluar",         icon: require("@/assets/icons/keluar.png"),            route: "/users/keluar" },
];

function CustomDrawer() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <Image source={require("../../assets/icons/logo sidebar.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.logoText}>LaporApp</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuContainer}>
        {menus.map((menu, index) => {
          const isActive = pathname === menu.route;
          return (
            <TouchableOpacity key={index} style={[styles.menuItem, isActive && styles.activeMenu]} onPress={() => router.push(menu.route as any)} >
              <Image source={menu.icon} style={styles.icon} />
              <Text style={styles.menuText}>{menu.title}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function UserLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={() => <CustomDrawer />}
        screenOptions={{ headerShown: false, drawerStyle: { width: 280, backgroundColor: "#1457D5" }, }}
      >
  <Drawer.Screen name="beranda"         options={{ title: "Beranda" }} />
  <Drawer.Screen name="buatlaporan"     options={{ title: "Buat Laporan" }} />
  <Drawer.Screen name="riwayatlaporan"  options={{ title: "Riwayat Laporan" }} />         
  <Drawer.Screen name="kategori"        options={{ title: "Kategori" }} />         
  <Drawer.Screen name="notifikasi"      options={{ title: "Notifikasi" }} />
  <Drawer.Screen name="profile"         options={{ title: "Profile" }} />
  <Drawer.Screen name="laporan"         options={{ title: "Laporan" }} />
</Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1457D5", paddingTop: 50, paddingBottom: 20 },
  logoWrapper: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 24, marginBottom: 24 },
  logo: { width: 36, height: 36 },
  logoText: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  menuContainer: { paddingHorizontal: 12 },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 14, marginBottom: 6,
  },
  activeMenu: { backgroundColor: "rgba(255,255,255,0.15)" },
  logoutItem: { marginHorizontal: 12, marginTop: 8 },
  icon: { width: 22, height: 22, resizeMode: "contain", tintColor: "#FFFFFF" },
  menuText: { color: "#FFFFFF", fontSize: 16, marginLeft: 14, fontWeight: "500" },
});