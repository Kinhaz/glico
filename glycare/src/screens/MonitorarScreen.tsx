import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { DMSans_400Regular, DMSans_500Medium } from "@expo-google-fonts/dm-sans";

const C = {
  bg:      "#0B0A24",
  surface: "#13122E",
  border:  "rgba(255,255,255,0.08)",
  accent:  "#7C5CFF",
  green:   "#4FD1A5",
  orange:  "#FF9F6B",
  red:     "#FF6B6B",
  blue:    "#60A5FA",
  text:    "#F5F3FF",
  muted:   "#A5A3C7",
  card:    "rgba(255,255,255,0.045)",
};

// ── Dados de exemplo — substitua por dados reais do Supabase
const LEITURAS_RECENTES = [
  { hora: "Hoje, 11:45",   valor: 128, status: "meta" },
  { hora: "Hoje, 09:30",   valor: 112, status: "meta" },
  { hora: "Ontem, 07:15",  valor: 198, status: "acima" },
  { hora: "Hoje, 18:45",   valor: 156, status: "meta" },
];

const REGISTRAR_ITEMS = [
  { id: "glicemia",   label: "Glicemia",    icon: "water-outline",       color: C.blue },
  { id: "insulina",   label: "Insulina",    icon: "medkit-outline",      color: C.green },
  { id: "medicacao",  label: "Medicação",   icon: "flask-outline",       color: C.orange },
  { id: "alimentacao",label: "Alimentação", icon: "restaurant-outline",  color: "#FFB86B" },
  { id: "atividade",  label: "Ativ. física",icon: "walk-outline",        color: C.accent },
];

function statusColor(s: string) {
  if (s === "meta")  return C.green;
  if (s === "acima") return C.orange;
  return C.red;
}

function statusLabel(s: string) {
  if (s === "meta")  return "Dentro da meta";
  if (s === "acima") return "Acima da meta";
  return "Abaixo da meta";
}

export default function MonitorarScreen({ navigation }: { navigation?: any }) {
  const [fontsLoaded] = useFonts({ Fraunces_700Bold, DMSans_400Regular, DMSans_500Medium });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Título */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Monitorar</Text>
          <Text style={styles.pageSub}>Acompanhe seus dados em tempo real.</Text>
        </View>

        {/* Visão geral de hoje */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visão geral de hoje</Text>
          <View style={styles.card}>
            <View style={styles.glucoseRow}>
              <View>
                <Text style={styles.glucoseLabel}>Glicemia atual</Text>
                <Text style={styles.glucoseValue}>128 <Text style={styles.glucoseUnit}>mg/dL</Text></Text>
                <View style={[styles.badge, { backgroundColor: `${C.green}22` }]}>
                  <Text style={[styles.badgeText, { color: C.green }]}>Dentro da meta</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              {[
                { label: "Média de hoje", value: "123", unit: "mg/dL" },
                { label: "Mínima",        value: "86",  unit: "mg/dL" },
                { label: "Máxima",        value: "198", unit: "mg/dL" },
                { label: "Tempo na meta", value: "78%", unit: "no dia" },
              ].map((s) => (
                <View key={s.label} style={styles.statBox}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statUnit}>{s.unit}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Últimas medições */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimas medições</Text>
          <View style={styles.card}>
            {LEITURAS_RECENTES.map((l, i) => (
              <View key={i}>
                <View style={styles.leituraRow}>
                  <Text style={styles.leituraHora}>{l.hora}</Text>
                  <Text style={[styles.leituraValor, { color: statusColor(l.status) }]}>{l.valor}</Text>
                </View>
                {i < LEITURAS_RECENTES.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Registrar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registre seus dados</Text>
          <View style={styles.registrarGrid}>
            {REGISTRAR_ITEMS.map((item) => (
              <TouchableOpacity key={item.id} style={styles.registrarCard} activeOpacity={0.8}>
                <View style={[styles.registrarIcon, { backgroundColor: `${item.color}22` }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={styles.registrarLabel}>{item.label}</Text>
                <Text style={styles.registrarSub}>Registrar</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dica do dia */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="information-circle-outline" size={22} color={C.blue} />
          </View>
          <Text style={styles.tipText}>
            Manter a glicemia dentro da meta reduz riscos de complicações. Continue assim!
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  scroll:         { paddingHorizontal: 20, paddingTop: 16 },
  pageHeader:     { marginBottom: 20 },
  pageTitle:      { fontFamily: "Fraunces_700Bold", fontSize: 28, color: C.text, marginBottom: 4 },
  pageSub:        { fontFamily: "DMSans_400Regular", fontSize: 14, color: C.muted },
  section:        { marginBottom: 20 },
  sectionTitle:   { fontFamily: "DMSans_500Medium", fontSize: 12, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10, paddingLeft: 4 },
  card:           { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 },
  glucoseRow:     { marginBottom: 16 },
  glucoseLabel:   { fontFamily: "DMSans_400Regular", fontSize: 13, color: C.muted, marginBottom: 4 },
  glucoseValue:   { fontFamily: "Fraunces_700Bold", fontSize: 42, color: C.text },
  glucoseUnit:    { fontSize: 18, color: C.muted },
  badge:          { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  badgeText:      { fontFamily: "DMSans_500Medium", fontSize: 12 },
  statsRow:       { flexDirection: "row", justifyContent: "space-between" },
  statBox:        { alignItems: "center" },
  statLabel:      { fontFamily: "DMSans_400Regular", fontSize: 10, color: C.muted, textAlign: "center", marginBottom: 2 },
  statValue:      { fontFamily: "Fraunces_700Bold", fontSize: 20, color: C.text },
  statUnit:       { fontFamily: "DMSans_400Regular", fontSize: 10, color: C.muted },
  leituraRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  leituraHora:    { fontFamily: "DMSans_400Regular", fontSize: 13, color: C.muted },
  leituraValor:   { fontFamily: "Fraunces_700Bold", fontSize: 20 },
  divider:        { height: 1, backgroundColor: C.border },
  registrarGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  registrarCard:  { width: "30%", backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: "center", gap: 8 },
  registrarIcon:  { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  registrarLabel: { fontFamily: "DMSans_500Medium", fontSize: 12, color: C.text, textAlign: "center" },
  registrarSub:   { fontFamily: "DMSans_400Regular", fontSize: 10, color: C.muted },
  tipCard:        { flexDirection: "row", alignItems: "flex-start", backgroundColor: "rgba(96,165,250,0.08)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(96,165,250,0.2)", padding: 16, gap: 12 },
  tipIcon:        { marginTop: 2 },
  tipText:        { fontFamily: "DMSans_400Regular", fontSize: 13, color: C.muted, flex: 1, lineHeight: 20 },
});
