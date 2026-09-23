import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Alert, Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { DMSans_400Regular, DMSans_500Medium } from "@expo-google-fonts/dm-sans";
import { supabase } from "../lib/supabase";

const C = {
  bg:      "#0B0A24",
  surface: "#13122E",
  border:  "rgba(255,255,255,0.08)",
  accent:  "#7C5CFF",
  red:     "#FF6B6B",
  text:    "#F5F3FF",
  muted:   "#A5A3C7",
  icon:    "rgba(124,92,255,0.18)",
};

// =========================================
// SEÇÕES — fácil de modificar
// =========================================
type SectionItem = {
  id: string;
  label: string;
  sub?: string;
  icon: string;
  type: "link" | "toggle";
  route?: string;
};

type Section = { title: string; items: SectionItem[] };

const SECTIONS: Section[] = [
  {
    title: "Conta",
    items: [
      { id: "info_conta",   label: "Informação da conta",   sub: "Atualize seus dados pessoais",     icon: "person-outline",        type: "link" },
      { id: "senha",        label: "Senha e segurança",      sub: "Altere sua senha e gerencie a segurança", icon: "lock-closed-outline", type: "link" },
    ],
  },
  {
    title: "Preferências do App",
    items: [
      { id: "notificacoes", label: "Lembretes e notificações", sub: "Gerencie seus lembretes e alertas", icon: "notifications-outline", type: "toggle" },
      { id: "idioma",       label: "Idioma",                   sub: "Selecione o idioma do aplicativo",  icon: "language-outline",       type: "link" },
    ],
  },
  {
    title: "Privacidade e dados",
    items: [
      { id: "privacidade",  label: "Privacidade",    sub: "Gerencie suas permissões e dados",   icon: "shield-outline",        type: "link" },
      { id: "exportar",     label: "Exportar meus dados", sub: "Baixe uma cópia dos seus dados", icon: "download-outline",      type: "link" },
    ],
  },
  {
    title: "Suporte",
    items: [
      { id: "ajuda",        label: "Central de ajuda", sub: "Dúvidas frequentes e como usar o app",  icon: "help-circle-outline",   type: "link" },
      { id: "contato",      label: "Fale conosco",      sub: "Envie sugestões ou reporte um problema", icon: "chatbubble-outline",    type: "link" },
    ],
  },
];

export default function ConfiguracoesScreen({ navigation }: { navigation?: any }) {
  const [toggles, setToggles] = useState<Record<string, boolean>>({ notificacoes: true });

  const [fontsLoaded] = useFonts({ Fraunces_700Bold, DMSans_400Regular, DMSans_500Medium });
  if (!fontsLoaded) return null;

  const handleLogout = async () => {
    Alert.alert("Sair da conta", "Tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair", style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          navigation?.reset?.({ index: 0, routes: [{ name: "Inicio" }] });
        },
      },
    ]);
  };

  const handlePress = (item: SectionItem) => {
    if (item.type === "link") Alert.alert(item.label, "Em breve!");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, idx) => (
                <View key={item.id}>
                  <TouchableOpacity
                    style={styles.row}
                    activeOpacity={item.type === "link" ? 0.7 : 1}
                    onPress={() => handlePress(item)}
                  >
                    <View style={styles.iconWrap}>
                      <Ionicons name={item.icon as any} size={18} color={C.accent} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      {item.sub && <Text style={styles.rowSub}>{item.sub}</Text>}
                    </View>
                    {item.type === "toggle" ? (
                      <Switch
                        value={toggles[item.id] ?? false}
                        onValueChange={(v) => setToggles((p) => ({ ...p, [item.id]: v }))}
                        trackColor={{ false: "rgba(255,255,255,0.1)", true: C.accent }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="rgba(255,255,255,0.1)"
                      />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={C.muted} />
                    )}
                  </TouchableOpacity>
                  {idx < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Botão sair */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={C.red} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  scroll:       { paddingHorizontal: 20, paddingTop: 16 },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 12, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10, paddingLeft: 4 },
  card:         { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  row:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  iconWrap:     { width: 34, height: 34, borderRadius: 10, backgroundColor: C.icon, alignItems: "center", justifyContent: "center" },
  rowText:      { flex: 1 },
  rowLabel:     { fontSize: 14, color: C.text },
  rowSub:       { fontSize: 12, color: C.muted, marginTop: 2 },
  divider:      { height: 1, backgroundColor: C.border, marginLeft: 64 },
  logoutBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,107,107,0.1)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,107,107,0.25)", paddingVertical: 14, marginBottom: 12 },
  logoutText:   { fontSize: 14, color: C.red },
});
