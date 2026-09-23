import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polyline, Circle, Line as SvgLine } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const A = "Arial";
const C = {
  bg: "#0B0A24", surface: "#13122E", border: "rgba(255,255,255,0.08)",
  accent: "#7C5CFF", green: "#4FD1A5", orange: "#FF9F6B",
  red: "#FF6B6B", blue: "#60A5FA", text: "#F5F3FF", muted: "#A5A3C7",
  yellow: "#FFD66B",
};

const CHART_W = 260;
const CHART_H = 80;
const GL_MIN = 80;
const GL_MAX = 220;

function toY(v: number) {
  return CHART_H - ((Math.min(Math.max(v, GL_MIN), GL_MAX) - GL_MIN) / (GL_MAX - GL_MIN)) * CHART_H;
}

function glColor(v: number) {
  if (v < 70)  return C.red;
  if (v > 180) return C.orange;
  return C.green;
}

interface Familiar {
  id: string;
  nome: string;
  glicemia: number | null;
  medicacoes: { total: number; tomadas: number };
  pressao: string | null;
  ultimaAtualizacao: string;
  leituras7d: number[];
  alertas: string[];
  proximaConsulta: { data: string; hora: string; medico: string } | null;
  timeline: { hora: string; descricao: string; status: "ok" | "pendente" | "alerta"; valor?: string }[];
}

function formatHora(iso: string) {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
}

export default function EspacoFamiliarScreen({ navigation }: { navigation?: any }) {
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [selected,   setSelected]   = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setCarregando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca vínculos familiares
      const { data: vinculos } = await supabase
        .from("vinculos_familiares")
        .select("familiar_id, perfis(nome_completo)")
        .eq("user_id", user.id);

      if (!vinculos || vinculos.length === 0) {
        setFamiliares([]);
        return;
      }

      const lista: Familiar[] = await Promise.all(vinculos.map(async (v: any) => {
        const fid = v.familiar_id;
        const nome = v.perfis?.nome_completo ?? "Familiar";

        // Última glicemia
        const { data: ultGL } = await supabase
          .from("leituras_glicemia")
          .select("valor, medido_em")
          .eq("user_id", fid)
          .order("medido_em", { ascending: false })
          .limit(1).single();

        // Leituras últimos 7 dias para o gráfico
        const inicio7d = new Date(); inicio7d.setDate(inicio7d.getDate() - 7);
        const { data: gl7d } = await supabase
          .from("leituras_glicemia")
          .select("valor, medido_em")
          .eq("user_id", fid)
          .gte("medido_em", inicio7d.toISOString())
          .order("medido_em", { ascending: true });

        const leituras7d = (gl7d ?? []).map((l: any) => l.valor);

        // Registros do dia
        const hoje = new Date();
        const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
        const { data: registros } = await supabase
          .from("registros_diarios")
          .select("tipo, dados, registrado_em")
          .eq("user_id", fid)
          .gte("registrado_em", inicioDia)
          .order("registrado_em", { ascending: true });

        const medTotal  = (registros ?? []).filter((r: any) => r.tipo === "medicacao").length;
        const medTomadas = medTotal; // simplificado

        // Timeline do dia
        const timeline = (registros ?? []).map((r: any) => ({
          hora: formatHora(r.registrado_em),
          descricao: r.tipo === "glicemia" ? "Glicemia registrada"
            : r.tipo === "alimentacao" ? "Refeição registrada"
            : r.tipo === "medicacao"   ? "Medicação tomada"
            : r.tipo,
          status: "ok" as const,
          valor: r.dados?.valor ? `${r.dados.valor} mg/dL` : r.dados?.descricao ?? undefined,
        }));

        // Alerta simples
        const alertas: string[] = [];
        if (leituras7d.filter(v => v > 180).length >= 2)
          alertas.push(`${nome.split(" ")[0]} teve glicemias acima da meta nos últimos 7 dias. Fique atento à alimentação, hidratação e medicações.`);

        // Próxima consulta (tabela consultas)
        const { data: consulta } = await supabase
          .from("consultas")
          .select("data_hora, medico, especialidade")
          .eq("user_id", fid)
          .gte("data_hora", new Date().toISOString())
          .order("data_hora", { ascending: true })
          .limit(1).single();

        let proximaConsulta = null;
        if (consulta) {
          const d = new Date(consulta.data_hora);
          proximaConsulta = {
            data: `${d.getDate()} de ${["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"][d.getMonth()]} de ${d.getFullYear()}`,
            hora: `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`,
            medico: `${consulta.medico} – ${consulta.especialidade}`,
          };
        }

        return {
          id: fid, nome,
          glicemia: ultGL?.valor ?? null,
          medicacoes: { total: 3, tomadas: Math.min(medTomadas, 3) },
          pressao: null,
          ultimaAtualizacao: ultGL?.medido_em ?? new Date().toISOString(),
          leituras7d, alertas, proximaConsulta, timeline,
        };
      }));

      setFamiliares(lista);
      if (lista.length > 0) setSelected(lista[0].id);
    } catch (err) {
      console.error("Erro EspacoFamiliar:", err);
    } finally {
      setCarregando(false);
    }
  }

  const familiar = familiares.find(f => f.id === selected) ?? null;
  const primeiroNome = familiar?.nome?.split(" ")[0] ?? "";

  const chartPoints = familiar?.leituras7d && familiar.leituras7d.length >= 2
    ? familiar.leituras7d.map((v, i) => {
        const x = (i / (familiar.leituras7d.length - 1)) * CHART_W;
        return `${x},${toY(v)}`;
      }).join(" ")
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Espaço Familiar</Text>
          <Text style={styles.pageSub}>Acompanhem juntos a saúde de quem você ama</Text>
        </View>

        {carregando ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
        ) : familiares.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={40} color={C.muted} />
            <Text style={styles.emptyTitle}>Nenhum familiar vinculado</Text>
            <Text style={styles.emptySub}>Adicione um familiar para acompanhar sua saúde.</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Adicionar familiar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Seletor de familiar */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {familiares.map(f => (
                <TouchableOpacity key={f.id} onPress={() => setSelected(f.id)}
                  style={[styles.familiarChip, selected === f.id && styles.familiarChipActive]}>
                  <View style={styles.familiarAvatar}>
                    <Text style={styles.familiarAvatarText}>{f.nome[0]}</Text>
                  </View>
                  <Text style={[styles.familiarChipText, selected === f.id && { color: C.text }]}>{f.nome.split(" ")[0]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {familiar && (
              <>
                {/* Card principal do familiar */}
                <View style={styles.card}>
                  <View style={styles.familiarHeader}>
                    <View style={styles.bigAvatar}>
                      <Text style={styles.bigAvatarText}>{familiar.nome[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.familiarNome}>{familiar.nome}</Text>
                      <Text style={styles.familiarUpdate}>
                        Última atualização{"\n"}Hoje, {formatHora(familiar.ultimaAtualizacao)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={carregar}>
                      <Ionicons name="refresh-outline" size={20} color={C.muted} />
                    </TouchableOpacity>
                  </View>

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <View style={[styles.statBox, { borderColor: `${C.red}40` }]}>
                      <Text style={[styles.statVal, { color: familiar.glicemia && familiar.glicemia > 180 ? C.red : C.green }]}>
                        {familiar.glicemia ?? "—"}
                      </Text>
                      <Text style={styles.statUnit}>mg/dL</Text>
                      <Text style={styles.statLabel}>Glicemia</Text>
                    </View>
                    <View style={[styles.statBox, { borderColor: `${C.green}40` }]}>
                      <Text style={[styles.statVal, { color: C.green }]}>
                        {familiar.medicacoes.tomadas} de {familiar.medicacoes.total}
                      </Text>
                      <Text style={styles.statUnit}>Medicações</Text>
                      <Text style={styles.statLabel}>Tomas hoje</Text>
                    </View>
                    <View style={[styles.statBox, { borderColor: `${C.green}40` }]}>
                      <Text style={[styles.statVal, { color: C.green }]}>{familiar.pressao ?? "—"}</Text>
                      <Text style={styles.statUnit}>mmHg</Text>
                      <Text style={styles.statLabel}>Pressão arterial</Text>
                    </View>
                  </View>
                </View>

                {/* Timeline do dia */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Hoje</Text>
                  <View style={styles.card}>
                    {familiar.timeline.length === 0 ? (
                      <Text style={[styles.emptySub, { padding: 16 }]}>Nenhum registro hoje.</Text>
                    ) : (
                      familiar.timeline.map((t, i) => (
                        <View key={i}>
                          <View style={styles.timelineRow}>
                            <Text style={styles.timelineHora}>{t.hora}</Text>
                            <View style={[styles.timelineDot, { backgroundColor: t.status === "ok" ? C.green : C.orange }]} />
                            <Text style={styles.timelineDesc}>{t.descricao}</Text>
                            {t.valor && <Text style={[styles.timelineValor, { color: C.green }]}>{t.valor}</Text>}
                          </View>
                          {i < familiar.timeline.length - 1 && <View style={styles.divider} />}
                        </View>
                      ))
                    )}
                    <TouchableOpacity style={styles.verTudoBtn}>
                      <Text style={styles.verTudoText}>Ver todas as medicações e registros do dia</Text>
                      <Ionicons name="chevron-forward" size={16} color={C.accent} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Gráfico 7 dias */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Últimos 7 dias – Glicemia (mg/dL)</Text>
                    <TouchableOpacity><Text style={styles.sectionLink}>Ver histórico completo ›</Text></TouchableOpacity>
                  </View>
                  <View style={styles.card}>
                    {familiar.leituras7d.length < 2 ? (
                      <Text style={[styles.emptySub, { padding: 16 }]}>Sem dados suficientes.</Text>
                    ) : (
                      <Svg width={CHART_W} height={CHART_H + 20}>
                        <SvgLine x1="0" y1={toY(180)} x2={CHART_W} y2={toY(180)} stroke={C.red} strokeWidth="1" strokeDasharray="3,3" opacity={0.5} />
                        <SvgLine x1="0" y1={toY(100)} x2={CHART_W} y2={toY(100)} stroke={C.green} strokeWidth="1" strokeDasharray="3,3" opacity={0.5} />
                        {chartPoints && <Polyline points={chartPoints} fill="none" stroke={C.orange} strokeWidth="2" />}
                        {familiar.leituras7d.map((v, i) => {
                          const x = (i / (familiar.leituras7d.length - 1)) * CHART_W;
                          return <Circle key={i} cx={x} cy={toY(v)} r={5} fill={glColor(v)} />;
                        })}
                      </Svg>
                    )}
                  </View>
                </View>

                {/* Alertas */}
                {familiar.alertas.length > 0 && (
                  <View style={styles.alertCard}>
                    <Ionicons name="warning-outline" size={18} color={C.yellow} style={{ marginRight: 8 }} />
                    <Text style={styles.alertText}>{familiar.alertas[0]}</Text>
                  </View>
                )}

                {/* Próxima consulta */}
                {familiar.proximaConsulta && (
                  <View style={styles.consultaCard}>
                    <Ionicons name="calendar-outline" size={20} color={C.accent} style={{ marginRight: 12 }} />
                    <View>
                      <Text style={styles.consultaLabel}>Próxima consulta</Text>
                      <Text style={styles.consultaData}>{familiar.proximaConsulta.data} – {familiar.proximaConsulta.hora}</Text>
                      <Text style={styles.consultaMedico}>{familiar.proximaConsulta.medico}</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  scroll:          { paddingHorizontal: 16, paddingTop: 8 },
  pageHeader:      { marginBottom: 16 },
  pageTitle:       { fontFamily: A, fontWeight: "800", fontSize: 26, color: C.text, marginBottom: 4 },
  pageSub:         { fontFamily: A, fontSize: 13, color: C.muted },
  card:            { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: "hidden", marginBottom: 0 },
  section:         { marginBottom: 16 },
  sectionHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle:    { fontFamily: A, fontWeight: "700", fontSize: 14, color: C.text },
  sectionLink:     { fontFamily: A, fontSize: 12, color: C.accent },
  divider:         { height: 1, backgroundColor: C.border },
  emptyCard:       { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 32, alignItems: "center", gap: 10 },
  emptyTitle:      { fontFamily: A, fontWeight: "700", fontSize: 16, color: C.text },
  emptySub:        { fontFamily: A, fontSize: 13, color: C.muted, textAlign: "center" },
  addBtn:          { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 20, marginTop: 8 },
  addBtnText:      { fontFamily: A, fontWeight: "700", fontSize: 14, color: "#FFF" },
  familiarChip:    { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 30, borderWidth: 1, borderColor: C.border, paddingVertical: 8, paddingHorizontal: 14, marginRight: 10, gap: 8 },
  familiarChipActive: { borderColor: C.accent, backgroundColor: "rgba(124,92,255,0.15)" },
  familiarChipText:{ fontFamily: A, fontSize: 13, color: C.muted },
  familiarAvatar:  { width: 28, height: 28, borderRadius: 14, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  familiarAvatarText: { fontFamily: A, fontWeight: "700", fontSize: 13, color: "#FFF" },
  familiarHeader:  { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  bigAvatar:       { width: 48, height: 48, borderRadius: 24, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  bigAvatarText:   { fontFamily: A, fontWeight: "800", fontSize: 20, color: "#FFF" },
  familiarNome:    { fontFamily: A, fontWeight: "700", fontSize: 16, color: C.text, marginBottom: 2 },
  familiarUpdate:  { fontFamily: A, fontSize: 11, color: C.muted, lineHeight: 16 },
  statsRow:        { flexDirection: "row", padding: 12, gap: 8 },
  statBox:         { flex: 1, backgroundColor: "#0B0A24", borderRadius: 12, borderWidth: 1, padding: 10, alignItems: "center" },
  statVal:         { fontFamily: A, fontWeight: "800", fontSize: 18 },
  statUnit:        { fontFamily: A, fontSize: 10, color: C.muted },
  statLabel:       { fontFamily: A, fontSize: 10, color: C.muted, textAlign: "center" },
  timelineRow:     { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  timelineHora:    { fontFamily: A, fontSize: 12, color: C.muted, width: 40 },
  timelineDot:     { width: 8, height: 8, borderRadius: 4 },
  timelineDesc:    { fontFamily: A, fontSize: 13, color: C.text, flex: 1 },
  timelineValor:   { fontFamily: A, fontWeight: "700", fontSize: 13 },
  verTudoBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(124,92,255,0.15)", margin: 12, borderRadius: 12, paddingVertical: 12, gap: 6 },
  verTudoText:     { fontFamily: A, fontSize: 13, color: C.accent, fontWeight: "600" },
  alertCard:       { flexDirection: "row", alignItems: "flex-start", backgroundColor: "rgba(255,214,107,0.08)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,214,107,0.2)", padding: 14, marginBottom: 14 },
  alertText:       { fontFamily: A, fontSize: 13, color: C.muted, flex: 1, lineHeight: 19 },
  consultaCard:    { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 14 },
  consultaLabel:   { fontFamily: A, fontSize: 11, color: C.muted, marginBottom: 2 },
  consultaData:    { fontFamily: A, fontWeight: "700", fontSize: 14, color: C.text },
  consultaMedico:  { fontFamily: A, fontSize: 12, color: C.muted },
});