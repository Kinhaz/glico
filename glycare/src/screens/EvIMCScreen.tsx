import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polyline, Circle, Line as SvgLine, Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const A = "Arial";
const C = {
  bg: "#0B0A24", surface: "#13122E", border: "rgba(255,255,255,0.08)",
  accent: "#7C5CFF", green: "#4FD1A5", orange: "#FF9F6B",
  yellow: "#FFD66B", text: "#F5F3FF", muted: "#A5A3C7",
  normal: "#4FD1A5", sobrepeso: "#FF9F6B", obesidade: "#FF6B6B",
};

const CHART_W = 280;
const CHART_H = 120;
const IMC_MIN = 18;
const IMC_MAX = 32;

function imcClassify(imc: number): { label: string; color: string } {
  if (imc < 18.5) return { label: "Abaixo do peso", color: C.yellow };
  if (imc < 25)   return { label: "Normal",         color: C.green };
  if (imc < 30)   return { label: "Sobrepeso",      color: C.orange };
  return              { label: "Obesidade",          color: "#FF6B6B" };
}

function toY(imc: number): number {
  return CHART_H - ((Math.min(Math.max(imc, IMC_MIN), IMC_MAX) - IMC_MIN) / (IMC_MAX - IMC_MIN)) * CHART_H;
}

interface HistoricoItem {
  id: string; peso: number; altura: number; imc: number;
  data: string; classificacao: string;
}

export default function EvIMCScreen({ navigation }: { navigation?: any }) {
  const [historico,   setHistorico]   = useState<HistoricoItem[]>([]);
  const [imcAtual,    setImcAtual]    = useState<number | null>(null);
  const [carregando,  setCarregando]  = useState(true);
  const [periodo,     setPeriodo]     = useState<"7d" | "30d" | "3m">("3m");

  useEffect(() => { carregar(); }, [periodo]);

  async function carregar() {
    setCarregando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const diasMap = { "7d": 7, "30d": 30, "3m": 90 };
      const inicio = new Date();
      inicio.setDate(inicio.getDate() - diasMap[periodo]);

      const { data } = await supabase
        .from("registros_imc")
        .select("*")
        .eq("user_id", user.id)
        .gte("registrado_em", inicio.toISOString())
        .order("registrado_em", { ascending: true });

      if (data && data.length > 0) {
        const items: HistoricoItem[] = data.map((r: any) => {
          const imc = parseFloat((r.peso / ((r.altura / 100) ** 2)).toFixed(1));
          return {
            id: r.id, peso: r.peso, altura: r.altura, imc,
            data: r.registrado_em,
            classificacao: imcClassify(imc).label,
          };
        });
        setHistorico(items);
        setImcAtual(items[items.length - 1].imc);
      }
    } catch (err) {
      console.error("Erro ao carregar IMC:", err);
    } finally {
      setCarregando(false);
    }
  }

  const classAtual = imcAtual !== null ? imcClassify(imcAtual) : { label: "—", color: C.muted };
  const variacao   = historico.length >= 2
    ? parseFloat((historico[historico.length - 1].imc - historico[0].imc).toFixed(1))
    : null;
  const maiorIMC   = historico.length ? Math.max(...historico.map(h => h.imc)) : null;
  const menorIMC   = historico.length ? Math.min(...historico.map(h => h.imc)) : null;

  const pontos = historico.map((h, i) => {
    const x = historico.length > 1 ? (i / (historico.length - 1)) * CHART_W : CHART_W / 2;
    return `${x},${toY(h.imc)}`;
  }).join(" ");

  function formatData(iso: string) {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth()+1).toString().padStart(2, "0")}`;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* IMC Atual */}
        <View style={styles.imcAtualCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.imcAtualLabel}>Seu IMC atual</Text>
            <Text style={[styles.imcAtualValor, { color: classAtual.color }]}>
              {imcAtual?.toFixed(1) ?? "—"}
            </Text>
            <Text style={[styles.imcAtualClass, { color: classAtual.color }]}>{classAtual.label}</Text>
            <Text style={styles.imcAtualData}>
              {historico.length > 0 ? `Atualizado em ${formatData(historico[historico.length - 1].data)}` : "Sem registros"}
            </Text>
          </View>
          <View style={styles.imcStatusBox}>
            <View style={[styles.imcStatusDot, { backgroundColor: classAtual.color }]} />
            <Text style={[styles.imcStatusText, { color: classAtual.color }]}>
              {classAtual.label === "Normal" ? "Seu IMC está normal" : `IMC: ${classAtual.label}`}
            </Text>
            <Text style={styles.imcStatusSub}>
              Continue neste caminho{"\n"}para uma vida mais saudável.
            </Text>
          </View>
        </View>

        {/* Evolução do IMC */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Evolução do IMC</Text>
            <View style={styles.periodoRow}>
              {(["7d", "30d", "3m"] as const).map(p => (
                <TouchableOpacity key={p} style={[styles.periodoBtn, periodo === p && styles.periodoBtnActive]} onPress={() => setPeriodo(p)}>
                  <Text style={[styles.periodoText, periodo === p && styles.periodoTextActive]}>
                    {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "3 meses"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {carregando ? <ActivityIndicator color={C.accent} style={{ marginVertical: 20 }} /> :
           historico.length < 2 ? (
            <Text style={[styles.imcAtualData, { textAlign: "center", padding: 20 }]}>Registre mais medições para ver o gráfico.</Text>
          ) : (
            <Svg width={CHART_W} height={CHART_H + 24} style={{ marginTop: 8 }}>
              {/* Zonas de referência */}
              <SvgLine x1="0" y1={toY(25)} x2={CHART_W} y2={toY(25)} stroke={C.orange} strokeWidth="1" strokeDasharray="4,4" opacity={0.5} />
              <SvgLine x1="0" y1={toY(18.5)} x2={CHART_W} y2={toY(18.5)} stroke={C.yellow} strokeWidth="1" strokeDasharray="4,4" opacity={0.5} />
              <SvgText x={CHART_W - 2} y={toY(25) - 3} fill={C.orange} fontSize="9" textAnchor="end">Sobrepeso</SvgText>
              <SvgText x={CHART_W - 2} y={toY(18.5) + 10} fill={C.yellow} fontSize="9" textAnchor="end">Baixo peso</SvgText>
              <SvgText x={CHART_W - 2} y={toY(22) - 3} fill={C.green} fontSize="9" textAnchor="end">Normal</SvgText>
              {/* Linha IMC */}
              <Polyline points={pontos} fill="none" stroke={C.accent} strokeWidth="2.5" />
              {historico.map((h, i) => {
                const x = (i / (historico.length - 1)) * CHART_W;
                return <Circle key={h.id} cx={x} cy={toY(h.imc)} r={4} fill={imcClassify(h.imc).color} />;
              })}
              {/* Labels datas */}
              {[0, Math.floor(historico.length/2), historico.length-1].map(i => {
                if (i < 0 || i >= historico.length) return null;
                const x = (i / (historico.length - 1)) * CHART_W;
                return <SvgText key={i} x={x} y={CHART_H + 18} fill={C.muted} fontSize="9" textAnchor="middle">{formatData(historico[i].data)}</SvgText>;
              })}
            </Svg>
          )}
        </View>

        {/* Resumo */}
        {historico.length >= 2 && (
          <View style={styles.resumoRow}>
            <View style={[styles.resumoCard, { borderColor: variacao !== null && variacao < 0 ? `${C.green}40` : `${C.orange}40` }]}>
              <Text style={styles.resumoLabel}>Variação total</Text>
              <Text style={[styles.resumoValor, { color: variacao !== null && variacao < 0 ? C.green : C.orange }]}>
                {variacao !== null ? `${variacao > 0 ? "+" : ""}${variacao} kg/m²` : "—"}
              </Text>
            </View>
            <View style={[styles.resumoCard, { borderColor: `${C.accent}40` }]}>
              <Text style={styles.resumoLabel}>Maior valor</Text>
              <Text style={[styles.resumoValor, { color: C.accent }]}>{maiorIMC?.toFixed(1) ?? "—"}</Text>
            </View>
            <View style={[styles.resumoCard, { borderColor: `${C.green}40` }]}>
              <Text style={styles.resumoLabel}>Menor valor</Text>
              <Text style={[styles.resumoValor, { color: C.green }]}>{menorIMC?.toFixed(1) ?? "—"}</Text>
            </View>
          </View>
        )}

        {/* Histórico */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Histórico detalhado</Text>
            <TouchableOpacity><Text style={styles.sectionLink}>Ver todos ›</Text></TouchableOpacity>
          </View>
          <View style={styles.card}>
            {carregando ? <ActivityIndicator color={C.accent} style={{ padding: 20 }} /> :
             historico.length === 0 ? (
              <Text style={[styles.imcAtualData, { padding: 16, textAlign: "center" }]}>Nenhum registro encontrado.</Text>
            ) : (
              [...historico].reverse().slice(0, 5).map((h, i, arr) => {
                const cl = imcClassify(h.imc);
                return (
                  <View key={h.id}>
                    <View style={styles.historicoRow}>
                      <View style={[styles.historicoDot, { backgroundColor: cl.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historicoData}>{formatData(h.data)}</Text>
                        <Text style={styles.historicoSub}>{`${h.peso} kg  •  ${(h.altura/100).toFixed(2)} m`}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.historicoImc, { color: cl.color }]}>{h.imc.toFixed(1)}</Text>
                        <Text style={[styles.historicoClass, { color: cl.color }]}>{cl.label}</Text>
                      </View>
                    </View>
                    {i < arr.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Motivação */}
        {variacao !== null && variacao < 0 && (
          <View style={styles.motivacaoCard}>
            <Ionicons name="trophy-outline" size={24} color={C.yellow} style={{ marginBottom: 8 }} />
            <Text style={styles.motivacaoTitle}>Boa evolução!</Text>
            <Text style={styles.motivacaoText}>
              Você reduziu {Math.abs(variacao)} kg/m² de IMC nos últimos {periodo === "3m" ? "3 meses" : periodo}. Pequenas mudanças hoje, grandes resultados amanhã!
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  scroll:          { paddingHorizontal: 16, paddingTop: 8 },
  imcAtualCard:    { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 18, flexDirection: "row", gap: 16, marginBottom: 16 },
  imcAtualLabel:   { fontFamily: A, fontSize: 13, color: C.muted, marginBottom: 4 },
  imcAtualValor:   { fontFamily: A, fontWeight: "800", fontSize: 36, lineHeight: 40 },
  imcAtualClass:   { fontFamily: A, fontWeight: "600", fontSize: 14, marginBottom: 4 },
  imcAtualData:    { fontFamily: A, fontSize: 11, color: C.muted },
  imcStatusBox:    { flex: 1, backgroundColor: "rgba(79,209,165,0.08)", borderRadius: 12, padding: 12, justifyContent: "center" },
  imcStatusDot:    { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  imcStatusText:   { fontFamily: A, fontWeight: "700", fontSize: 12, marginBottom: 4 },
  imcStatusSub:    { fontFamily: A, fontSize: 11, color: C.muted, lineHeight: 16 },
  chartCard:       { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 16 },
  chartHeader:     { marginBottom: 8 },
  chartTitle:      { fontFamily: A, fontWeight: "700", fontSize: 16, color: C.text, marginBottom: 10 },
  periodoRow:      { flexDirection: "row", gap: 8 },
  periodoBtn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: C.border },
  periodoBtnActive:{ backgroundColor: "rgba(124,92,255,0.25)", borderColor: C.accent },
  periodoText:     { fontFamily: A, fontSize: 12, color: C.muted },
  periodoTextActive:{ fontFamily: A, fontSize: 12, color: "#A5B4FC", fontWeight: "600" },
  resumoRow:       { flexDirection: "row", gap: 10, marginBottom: 16 },
  resumoCard:      { flex: 1, backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, padding: 12 },
  resumoLabel:     { fontFamily: A, fontSize: 10, color: C.muted, marginBottom: 4 },
  resumoValor:     { fontFamily: A, fontWeight: "700", fontSize: 14 },
  section:         { marginBottom: 16 },
  sectionHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle:    { fontFamily: A, fontWeight: "700", fontSize: 16, color: C.text },
  sectionLink:     { fontFamily: A, fontSize: 13, color: C.accent },
  card:            { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  historicoRow:    { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  historicoDot:    { width: 8, height: 8, borderRadius: 4 },
  historicoData:   { fontFamily: A, fontSize: 13, color: C.text, fontWeight: "600" },
  historicoSub:    { fontFamily: A, fontSize: 11, color: C.muted },
  historicoImc:    { fontFamily: A, fontWeight: "800", fontSize: 18 },
  historicoClass:  { fontFamily: A, fontSize: 10 },
  divider:         { height: 1, backgroundColor: C.border, marginLeft: 34 },
  motivacaoCard:   { backgroundColor: "rgba(255,214,107,0.08)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,214,107,0.2)", padding: 18, alignItems: "center" },
  motivacaoTitle:  { fontFamily: A, fontWeight: "700", fontSize: 16, color: C.text, marginBottom: 6 },
  motivacaoText:   { fontFamily: A, fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 19 },
});
