import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { DrawerContentScrollView, DrawerContentComponentProps } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const A = "Arial";
const C = { bg: "#0B0A24", surface: "#13122E", active: "#A5B4FC", inactive: "#6B68A8", divider: "rgba(255,255,255,0.08)", red: "#FF6B6B", gcOne: "#4FD1A5" };
const LOGO_URL = "https://snipboard.io/uzH3yl.jpg";

const MENU_ITEMS = [
  { label: "Início",          route: "Home",          icon: "home-outline"        },
  { label: "Perfil",          route: "Perfil",         icon: "person-outline"      },
  { label: "Espaço Familiar", route: "EspacoFamiliar", icon: "people-outline"      },
  { label: "Monitorar",       route: "Monitorar",      icon: "pulse-outline"       },
  { label: "Relatórios",      route: "Relatorios",     icon: "bar-chart-outline"   },
  { label: "Evolução do IMC", route: "EvIMC",          icon: "trending-up-outline" },
  { label: "Configurações",   route: "Configuracoes",  icon: "settings-outline"    },
];

export default function CustomDrawer(props: DrawerContentComponentProps) {
  const currentRoute = props.state.routeNames[props.state.index] ?? "";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    props.navigation.reset({ index: 0, routes: [{ name: "Inicio" as any }] });
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.divider} />
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <TouchableOpacity key={item.route} style={[styles.menuItem, isActive && styles.menuItemActive]} activeOpacity={0.75} onPress={() => props.navigation.navigate(item.route)}>
                <Ionicons name={item.icon as any} size={20} color={isActive ? C.active : C.inactive} />
                <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Glico One — item especial */}
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.menuItem, styles.gcOneItem, currentRoute === "GlicoOne" && styles.gcOneActive]}
            activeOpacity={0.75}
            onPress={() => props.navigation.navigate("GlicoOne")}
          >
            <Ionicons name="hardware-chip-outline" size={20} color={C.gcOne} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuLabel, { color: C.gcOne, fontWeight: "700" }]}>Glico One</Text>
              <Text style={styles.gcOneSub}>Conectar dispositivo</Text>
            </View>
            <View style={styles.gcOneBadge}>
              <Text style={styles.gcOneBadgeText}>NOVO</Text>
            </View>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
      <View style={styles.footer}>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuItem} activeOpacity={0.75} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={C.red} />
          <Text style={[styles.menuLabel, { color: C.red }]}>Sair</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  scrollContent:  { flexGrow: 1, paddingTop: 0 },
  header:         { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 20 },
  logo:           { width: 120, height: 48 },
  divider:        { height: 1, backgroundColor: C.divider, marginHorizontal: 20, marginVertical: 8 },
  menuList:       { paddingHorizontal: 12, paddingTop: 8, gap: 4 },
  menuItem:       { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 13, paddingHorizontal: 12, borderRadius: 12 },
  menuItemActive: { backgroundColor: C.surface },
  menuLabel:      { fontFamily: A, fontSize: 15, color: C.inactive, flex: 1 },
  menuLabelActive:{ fontFamily: A, fontWeight: "600", color: C.active },
  gcOneItem:      { borderRadius: 12, backgroundColor: "rgba(79,209,165,0.06)", borderWidth: 1, borderColor: "rgba(79,209,165,0.2)" },
  gcOneActive:    { backgroundColor: "rgba(79,209,165,0.12)" },
  gcOneSub:       { fontFamily: A, fontSize: 11, color: "rgba(79,209,165,0.6)", marginTop: 1 },
  gcOneBadge:     { backgroundColor: "rgba(79,209,165,0.2)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  gcOneBadgeText: { fontFamily: A, fontSize: 9, fontWeight: "700", color: "#4FD1A5" },
  footer:         { paddingHorizontal: 12, paddingBottom: 32 },
});














