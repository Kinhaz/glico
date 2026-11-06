import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Polyline, Circle, Line as SvgLine,
  Text as SvgText, G,
} from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const A = "Arial";
const C = {
  bg: "#0B0A24", surface: "#13122E", border: "rgba(255,255,255,0.08)",
  accent: "#7C5CFF", green: "#4FD1A5", orange: "#FF9F6B",
  red: "#FF6B6B", blue: "#60A5FA", text: "#F5F3FF", muted: "#A5A3C7",
  yellow: "#FFD66B",
};

const CHART_W  = 300;
const CHART_H  = 150;
const GL_MIN   = 40;
const GL_MAX   = 260;
const ALTO     = 180;
const BAIXO    = 70;
const IDEAL    = 120;

type Periodo = "7d" | "15d" | "30d" | "60d" | "90d";

interface AnaliseData {
  media:      number | null;
  minima:     number | null;
  maxima:     number | null;
  medicacoes: number;
  pontos:     { valor: number; data: string }[];
  tir:        number | null; // % dentro do intervalo
  padroes:    string[];
}

function toY(v: number): number {
  return CHART_H - ((Math.min(Math.max(v, GL_MIN), GL_MAX) - GL_MIN) / (GL_MAX - GL_MIN)) * CHART_H;
}

function pctColor(pct: number | null): string {
  if (!pct) return C.muted;
  if (pct >= 70) return C.green;
  if (pct >= 50) return C.orange;
  return C.red;
}

export default function AnaliseScreen({ navigation }: { navigation?: any }) {
  const [periodo,    setPeriodo]    = useState<Periodo>("30d");
  const [dados,      setDados]      = useState<AnaliseData | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { carregar(); }, [periodo]);

  async function carregar() {
    setCarregando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const diasMap: Record<Periodo, number> = { "7d": 7, "15d": 15, "30d": 30, "60d": 60, "90d": 90 };
      const inicio = new Date();
      inicio.setDate(inicio.getDate() - diasMap[periodo]);

      // Leituras de glicemia no período
      const { data: leituras } = await supabase
        .from("leituras_glicemia")
        .select("valor, medido_em")
        .eq("user_id", user.id)
        .gte("medido_em", inicio.toISOString())
        .order("medido_em", { ascending: true });

      // Registros de medicação no período
      const { data: meds } = await supabase
        .from("registros_diarios")
        .select("id")
        .eq("user_id", user.id)
        .eq("tipo", "medicacao")
        .gte("registrado_em", inicio.toISOString());

      let media: number | null = null;
      let minima: number | null = null;
      let maxima: number | null = null;
      let tir: number | null = null;
      let pontos: { valor: number; data: string }[] = [];
      const padroes: string[] = [];

      if (leituras && leituras.length > 0) {
        const vals = leituras.map((l: any) => l.valor);
        media  = Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length);
        minima = Math.min(...vals);
        maxima = Math.max(...vals);

        const dentroMeta = vals.filter((v: number) => v >= BAIXO && v <= ALTO).length;
        tir = Math.round((dentroMeta / vals.length) * 100);

        // Até 7 pontos distribuídos para o gráfico
        const step = Math.max(1, Math.floor(leituras.length / 7));
        pontos = Array.from({ length: Math.min(7, leituras.length) }, (_, i) => {
          const idx = Math.min(i * step, leituras.length - 1);
          return { valor: leituras[idx].valor, data: leituras[idx].medido_em };
        });

        // Padrões simples
        const altosAposAlmoco = leituras.filter((l: any) => {
          const h = new Date(l.medido_em).getHours();
          return h >= 13 && h <= 15 && l.valor > ALTO;
        }).length;
        if (altosAposAlmoco >= 2)
          padroes.push("Suas glicemias tendem a subir mais após o almoço.");

        const finsDeSemanaDiversos = leituras.filter((l: any) => {
          const d = new Date(l.medido_em).getDay();
          return (d === 0 || d === 6);
        });
        if (finsDeSemanaDiversos.length > 3) {
          const varFds = Math.max(...finsDeSemanaDiversos.map((l: any) => l.valor)) - Math.min(...finsDeSemanaDiversos.map((l: any) => l.valor));
          if (varFds > 60) padroes.push("Há mais variações nos finais de semana.");
        }
      }

      setDados({ media, minima, maxima, medicacoes: (meds ?? []).length, pontos, tir, padroes });
    } catch (err) {
      console.error("Erro Analise:", err);
    } finally {
      setCarregando(false);
    }
  }

  function formatData(iso: string): string {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}`;
  }

  const chartPoints = dados?.pontos && dados.pontos.length >= 2
    ? dados.pontos.map((p, i) => {
        const x = (i / (dados.pontos.length - 1)) * CHART_W;
        return `${x},${toY(p.valor)}`;
      }).join(" ")
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Análise</Text>
          <Text style={styles.pageSub}>Acompanhe sua glicemia</Text>
        </View>

        {/* Filtros de período */}
        <View style={styles.periodoRow}>
          {(["7d", "15d", "30d", "60d", "90d"] as Periodo[]).map(p => (
            <TouchableOpacity key={p}
              style={[styles.periodoBtn, periodo === p && styles.periodoBtnActive]}
              onPress={() => setPeriodo(p)}
            >
              <Text style={[styles.periodoText, periodo === p && styles.periodoTextActive]}>
                {p === "7d" ? "7 dias" : p === "15d" ? "15 dias" : p === "30d" ? "30 dias" : p === "60d" ? "60 dias" : "90 dias"}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.calBtn}>
            <Ionicons name="calendar-outline" size={18} color={C.muted} />
          </TouchableOpacity>
        </View>

        {carregando ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Cards de estatísticas */}
            <View style={styles.statsGrid}>
              {[
                { label: "Média geral", value: dados?.media ? `${dados.media}` : "—", unit: "mg/dL", color: C.blue   },
                { label: "Mínima",      value: dados?.minima ? `${dados.minima}` : "—", unit: "mg/dL", color: C.green  },
                { label: "Máxima",      value: dados?.maxima ? `${dados.maxima}` : "—", unit: "mg/dL", color: C.orange },
                { label: "Medicações",  value: `${dados?.medicacoes ?? 0}`, unit: "registros", color: C.accent },
              ].map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statUnit}>{s.unit}</Text>
                </View>
              ))}
            </View>

            {/* Gráfico de evolução */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Evolução da glicemia</Text>
              <View style={{ marginTop: 8 }}>
                <Svg width={CHART_W} height={CHART_H + 28}>
                  {/* Linhas de referência */}
                  <SvgLine x1="0" y1={toY(ALTO)}  x2={CHART_W} y2={toY(ALTO)}  stroke={C.red}    strokeWidth="1" strokeDasharray="4,4" opacity={0.6} />
                  <SvgLine x1="0" y1={toY(IDEAL)} x2={CHART_W} y2={toY(IDEAL)} stroke={C.green}  strokeWidth="1" strokeDasharray="4,4" opacity={0.4} />
                  <SvgLine x1="0" y1={toY(BAIXO)} x2={CHART_W} y2={toY(BAIXO)} stroke={C.blue}   strokeWidth="1" strokeDasharray="4,4" opacity={0.6} />
                  {/* Labels linhas */}
                  <SvgText x={CHART_W - 2} y={toY(ALTO)  - 3} fill={C.red}   fontSize="9" textAnchor="end">Alto</SvgText>
                  <SvgText x={CHART_W - 2} y={toY(IDEAL) - 3} fill={C.green} fontSize="9" textAnchor="end">Ideal</SvgText>
                  <SvgText x={CHART_W - 2} y={toY(BAIXO) + 10} fill={C.blue} fontSize="9" textAnchor="end">Baixa</SvgText>
                  {/* Linha glicemia */}
                  {chartPoints && (
                    <>
                      <Polyline points={chartPoints} fill="none" stroke={C.accent} strokeWidth="2.5" />
                      {dados?.pontos.map((p, i) => {
                        const x = (i / ((dados.pontos.length || 1) - 1)) * CHART_W;
                        const cor = p.valor > ALTO ? C.red : p.valor < BAIXO ? C.blue : C.green;
                        return <Circle key={i} cx={x} cy={toY(p.valor)} r={5} fill={cor} />;
                      })}
                      {/* Labels datas */}
                      {dados?.pontos.map((p, i) => {
                        const x = (i / ((dados.pontos.length || 1) - 1)) * CHART_W;
                        return (
                          <SvgText key={i} x={x} y={CHART_H + 20} fill={C.muted} fontSize="9" textAnchor="middle">
                            {formatData(p.data)}
                          </SvgText>
                        );
                      })}
                    </>
                  )}
                  {!chartPoints && (
                    <SvgText x={CHART_W / 2} y={CHART_H / 2} fill={C.muted} fontSize="12" textAnchor="middle">
                      Sem dados suficientes
                    </SvgText>
                  )}
                </Svg>
              </View>
            </View>

            {/* Tempo no intervalo */}
            <View style={styles.tirCard}>
              <View style={styles.tirLeft}>
                {/* Donut simples */}
                <View style={styles.donut}>
                  <Svg width={100} height={100}>
                    <Circle cx={50} cy={50} r={38} stroke="rgba(255,255,255,0.08)" strokeWidth={14} fill="none" />
                    <Circle cx={50} cy={50} r={38}
                      stroke={pctColor(dados?.tir ?? null)}
                      strokeWidth={14} fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 38} ${2 * Math.PI * 38}`}
                      strokeDashoffset={(2 * Math.PI * 38) * (1 - (dados?.tir ?? 0) / 100)}
                      rotation={-90} origin="50,50"
                    />
                  </Svg>
                  <View style={styles.donutLabel}>
                    <Text style={[styles.donutPct, { color: pctColor(dados?.tir ?? null) }]}>{dados?.tir ?? 0}%</Text>
                    <Text style={styles.donutSub}>no intervalo{"\n"}ideal</Text>
                  </View>
                </View>
              </View>
              <View style={styles.tirLegenda}>
                <Text style={styles.tirTitulo}>Tempo no intervalo</Text>
                {[
                  { cor: C.green,  label: "No intervalo ideal", sub: "70–180 mg/dL" },
                  { cor: C.orange, label: "Acima do ideal",     sub: "> 180 mg/dL"   },
                  { cor: C.red,    label: "Abaixo do ideal",    sub: "< 70 mg/dL"    },
                ].map(l => (
                  <View key={l.label} style={styles.tirItem}>
                    <View style={[styles.tirDot, { backgroundColor: l.cor }]} />
                    <View>
                      <Text style={styles.tirItemLabel}>{l.label}</Text>
                      <Text style={styles.tirItemSub}>{l.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Padrões */}
            {dados?.padroes && dados.padroes.length > 0 && (
              <View style={styles.padraoCard}>
                <Text style={styles.padraoTitulo}>Padrões identificados</Text>
                {dados.padroes.map((p, i) => (
                  <Text key={i} style={styles.padraoText}>• {p}</Text>
                ))}
              </View>
            )}

            {/* Dica */}
            <View style={styles.dicaCard}>
              <Text style={styles.dicaTitulo}>Dica importante</Text>
              <Text style={styles.dicaText}>
                Manter a glicemia no intervalo ideal reduz riscos e ajuda no seu bem-estar diário.
              </Text>
            </View>
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
  backBtn:         { marginBottom: 4 },
  pageTitle:       { fontFamily: A, fontWeight: "800", fontSize: 26, color: C.text, marginBottom: 4 },
  pageSub:         { fontFamily: A, fontSize: 13, color: C.muted },
  periodoRow:      { flexDirection: "row", gap: 6, marginBottom: 16, alignItems: "center" },
  periodoBtn:      { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  periodoBtnActive:{ backgroundColor: "rgba(124,92,255,0.25)", borderColor: C.accent },
  periodoText:     { fontFamily: A, fontSize: 11, color: C.muted },
  periodoTextActive:{ fontFamily: A, fontSize: 11, color: "#A5B4FC", fontWeight: "700" },
  calBtn:          { marginLeft: "auto" as any, padding: 8, backgroundColor: C.surface, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  statsGrid:       { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard:        { flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: "center" },
  statLabel:       { fontFamily: A, fontSize: 10, color: C.muted, marginBottom: 4, textAlign: "center" },
  statValue:       { fontFamily: A, fontWeight: "800", fontSize: 20 },
  statUnit:        { fontFamily: A, fontSize: 9, color: C.muted },
  chartCard:       { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 16 },
  chartTitle:      { fontFamily: A, fontWeight: "700", fontSize: 15, color: C.text },
  tirCard:         { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 16, flexDirection: "row", gap: 16, alignItems: "center" },
  tirLeft:         { alignItems: "center" },
  donut:           { width: 100, height: 100, position: "relative", alignItems: "center", justifyContent: "center" },
  donutLabel:      { position: "absolute", alignItems: "center" },
  donutPct:        { fontFamily: A, fontWeight: "800", fontSize: 18 },
  donutSub:        { fontFamily: A, fontSize: 9, color: C.muted, textAlign: "center", lineHeight: 12 },
  tirLegenda:      { flex: 1 },
  tirTitulo:       { fontFamily: A, fontWeight: "700", fontSize: 14, color: C.text, marginBottom: 10 },
  tirItem:         { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  tirDot:          { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  tirItemLabel:    { fontFamily: A, fontSize: 13, color: C.text, fontWeight: "600" },
  tirItemSub:      { fontFamily: A, fontSize: 11, color: C.muted },
  padraoCard:      { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14 },
  padraoTitulo:    { fontFamily: A, fontWeight: "700", fontSize: 14, color: C.text, marginBottom: 8 },
  padraoText:      { fontFamily: A, fontSize: 13, color: C.muted, lineHeight: 20 },
  dicaCard:        { backgroundColor: "rgba(124,92,255,0.08)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(124,92,255,0.2)", padding: 16 },
  dicaTitulo:      { fontFamily: A, fontWeight: "700", fontSize: 14, color: C.text, marginBottom: 6 },
  dicaText:        { fontFamily: A, fontSize: 13, color: C.muted, lineHeight: 19 },
});