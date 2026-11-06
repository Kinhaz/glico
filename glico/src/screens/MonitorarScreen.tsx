import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { DMSans_400Regular, DMSans_500Medium } from "@expo-google-fonts/dm-sans";
import { supabase } from "../lib/supabase";

const C = {
  bg: "#0B0A24", surface: "#13122E", border: "rgba(255,255,255,0.08)",
  accent: "#7C5CFF", green: "#4FD1A5", orange: "#FF9F6B",
  red: "#FF6B6B", blue: "#60A5FA", text: "#F5F3FF", muted: "#A5A3C7",
};

interface Leitura {
  id: string;
  valor: number;
  medido_em: string;
  status: "meta" | "acima" | "abaixo";
}

function statusColor(s: string) {
  if (s === "meta")   return C.green;
  if (s === "acima")  return C.orange;
  return C.red;
}

function formatarHora(iso: string): string {
  try {
    const d = new Date(iso);
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    if (d.toDateString() === hoje.toDateString())  return `Hoje, ${hh}:${mm}`;
    if (d.toDateString() === ontem.toDateString()) return `Ontem, ${hh}:${mm}`;
    return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}, ${hh}:${mm}`;
  } catch { return iso; }
}

function classificar(valor: number): "meta" | "acima" | "abaixo" {
  if (valor < 70)  return "abaixo";
  if (valor > 180) return "acima";
  return "meta";
}

const REGISTRAR_ITEMS = [
  { id: "glicemia",    label: "Glicemia",    icon: "water-outline",      color: C.blue   },
  { id: "insulina",    label: "Insulina",    icon: "medkit-outline",     color: C.green  },
  { id: "medicacao",   label: "Medicação",   icon: "flask-outline",      color: C.orange },
  { id: "alimentacao", label: "Alimentação", icon: "restaurant-outline", color: "#FFB86B"},
  { id: "atividade",   label: "Ativ. física",icon: "walk-outline",       color: C.accent },
];

export default function MonitorarScreen({ navigation }: { navigation?: any }) {
  const [leituras,     setLeituras]     = useState<Leitura[]>([]);
  const [glicemiaAtual, setGlicemiaAtual] = useState<number | null>(null);
  const [media,        setMedia]        = useState<number | null>(null);
  const [minima,       setMinima]       = useState<number | null>(null);
  const [maxima,       setMaxima]       = useState<number | null>(null);
  const [tempoMeta,    setTempoMeta]    = useState<number | null>(null);
  const [carregando,   setCarregando]   = useState(true);

  const [fontsLoaded] = useFonts({ Fraunces_700Bold, DMSans_400Regular, DMSans_500Medium });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const hoje = new Date();
      const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();

      // Últimas 10 leituras
      const { data } = await supabase
        .from("leituras_glicemia")
        .select("id, valor, medido_em")
        .eq("user_id", user.id)
        .order("medido_em", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const leiturasFormatadas: Leitura[] = data.map((l: any) => ({
          id:       l.id,
          valor:    l.valor,
          medido_em: l.medido_em,
          status:   classificar(l.valor),
        }));
        setLeituras(leiturasFormatadas);

        // Glicemia mais recente
        setGlicemiaAtual(leiturasFormatadas[0].valor);

        // Stats do dia
        const leiturasHoje = leiturasFormatadas.filter(
          l => new Date(l.medido_em) >= new Date(inicioDia)
        );
        if (leiturasHoje.length > 0) {
          const valores = leiturasHoje.map(l => l.valor);
          setMedia(Math.round(valores.reduce((a, b) => a + b, 0) / valores.length));
          setMinima(Math.min(...valores));
          setMaxima(Math.max(...valores));
          const dentroMeta = leiturasHoje.filter(l => l.status === "meta").length;
          setTempoMeta(Math.round((dentroMeta / leiturasHoje.length) * 100));
        }
      }
    } catch (err) {
      console.error("Erro ao carregar monitorar:", err);
    } finally {
      setCarregando(false);
    }
  }

  if (!fontsLoaded) return null;

  const statusAtual = glicemiaAtual !== null ? classificar(glicemiaAtual) : "meta";
  const statusLabels: Record<string, string> = {
    meta: "Dentro da meta", acima: "Acima da meta", abaixo: "Abaixo da meta",
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Monitorar</Text>
          <Text style={styles.pageSub}>Acompanhe seus dados em tempo real.</Text>
        </View>

        {/* Visão geral */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visão geral de hoje</Text>
          <View style={styles.card}>
            {carregando ? (
              <ActivityIndicator color={C.accent} style={{ paddingVertical: 20 }} />
            ) : (
              <>
                <View style={styles.glucoseRow}>
                  <Text style={styles.glucoseLabel}>Glicemia atual</Text>
                  <Text style={styles.glucoseValue}>
                    {glicemiaAtual ?? "—"} <Text style={styles.glucoseUnit}>mg/dL</Text>
                  </Text>
                  <View style={[styles.badge, { backgroundColor: `${statusColor(statusAtual)}22` }]}>
                    <Text style={[styles.badgeText, { color: statusColor(statusAtual) }]}>
                      {statusLabels[statusAtual]}
                    </Text>
                  </View>
                </View>
                <View style={styles.statsRow}>
                  {[
                    { label: "Média de hoje", value: media   ?? "—", unit: "mg/dL"  },
                    { label: "Mínima",        value: minima  ?? "—", unit: "mg/dL"  },
                    { label: "Máxima",        value: maxima  ?? "—", unit: "mg/dL"  },
                    { label: "Tempo na meta", value: tempoMeta !== null ? `${tempoMeta}%` : "—", unit: "no dia" },
                  ].map((s) => (
                    <View key={s.label} style={styles.statBox}>
                      <Text style={styles.statLabel}>{s.label}</Text>
                      <Text style={styles.statValue}>{String(s.value)}</Text>
                      <Text style={styles.statUnit}>{s.unit}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>

        {/* Últimas medições */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimas medições</Text>
          <View style={styles.card}>
            {carregando ? (
              <ActivityIndicator color={C.accent} style={{ paddingVertical: 20 }} />
            ) : leituras.length === 0 ? (
              <Text style={[styles.statLabel, { padding: 16, textAlign: "center" }]}>
                Nenhuma medição registrada ainda.
              </Text>
            ) : (
              leituras.slice(0, 4).map((l, i) => (
                <View key={l.id}>
                  <View style={styles.leituraRow}>
                    <Text style={styles.leituraHora}>{formatarHora(l.medido_em)}</Text>
                    <Text style={[styles.leituraValor, { color: statusColor(l.status) }]}>{l.valor}</Text>
                  </View>
                  {i < Math.min(leituras.length, 4) - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Registrar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registre seus dados</Text>
          <View style={styles.registrarGrid}>
            {REGISTRAR_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id} style={styles.registrarCard} activeOpacity={0.8}
                onPress={() => navigation?.navigate?.("Registrar")}
              >
                <View style={[styles.registrarIcon, { backgroundColor: `${item.color}22` }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={styles.registrarLabel}>{item.label}</Text>
                <Text style={styles.registrarSub}>Registrar</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dica */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}><Ionicons name="information-circle-outline" size={22} color={C.blue} /></View>
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
  container:     { flex: 1, backgroundColor: C.bg },
  scroll:        { paddingHorizontal: 20, paddingTop: 16 },
  pageHeader:    { marginBottom: 20 },
  pageTitle:     { fontSize: 28, color: C.text, marginBottom: 4 },
  pageSub:       { fontSize: 14, color: C.muted },
  section:       { marginBottom: 20 },
  sectionTitle:  { fontSize: 12, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10, paddingLeft: 4 },
  card:          { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 },
  glucoseRow:    { marginBottom: 16 },
  glucoseLabel:  { fontSize: 13, color: C.muted, marginBottom: 4 },
  glucoseValue:  { fontSize: 42, color: C.text },
  glucoseUnit:   { fontSize: 18, color: C.muted },
  badge:         { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  badgeText:     { fontSize: 12 },
  statsRow:      { flexDirection: "row", justifyContent: "space-between" },
  statBox:       { alignItems: "center" },
  statLabel:     { fontSize: 10, color: C.muted, textAlign: "center", marginBottom: 2 },
  statValue:     { fontSize: 20, color: C.text },
  statUnit:      { fontSize: 10, color: C.muted },
  leituraRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  leituraHora:   { fontSize: 13, color: C.muted },
  leituraValor:  { fontSize: 20 },
  divider:       { height: 1, backgroundColor: C.border },
  registrarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  registrarCard: { width: "30%", backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: "center", gap: 8 },
  registrarIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  registrarLabel:{ fontSize: 12, color: C.text, textAlign: "center" },
  registrarSub:  { fontSize: 10, color: C.muted },
  tipCard:       { flexDirection: "row", alignItems: "flex-start", backgroundColor: "rgba(96,165,250,0.08)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(96,165,250,0.2)", padding: 16, gap: 12 },
  tipIcon:       { marginTop: 2 },
  tipText:       { fontSize: 13, color: C.muted, flex: 1, lineHeight: 20 },
});
