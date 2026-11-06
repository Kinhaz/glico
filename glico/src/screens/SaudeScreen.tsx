import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, TouchableWithoutFeedback,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const A = "Arial";
const C = {
  bg: "#0B0A24", surface: "#13122E", border: "rgba(255,255,255,0.08)",
  accent: "#7C5CFF", green: "#4FD1A5", orange: "#FF9F6B",
  red: "#FF6B6B", blue: "#60A5FA", text: "#F5F3FF", muted: "#A5A3C7",
  yellow: "#FFD66B", pink: "#FF7597",
};

interface SaudeData {
  glicemia:     { valor: number | null; hora: string | null };
  pressao:      { sistolica: number | null; diastolica: number | null; hora: string | null };
  peso:         { valor: number | null; imc: number | null; imcLabel: string };
  hidratacao:   { litros: number; meta: number };
  sono:         { horas: string | null; qualidade: string | null };
  medicamentos: { proximoLembrete: string | null; nome: string | null };
  consulta:     { data: string | null; hora: string | null; especialidade: string | null };
}

function formatHora(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(); ontem.setDate(hoje.getDate() - 1);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  if (d.toDateString() === hoje.toDateString())  return `Hoje, ${hh}:${mm}`;
  if (d.toDateString() === ontem.toDateString()) return `Ontem, ${hh}:${mm}`;
  return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}`;
}
function imcLabelFn(imc: number | null): string {
  if (!imc) return "—";
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25)   return "Normal";
  if (imc < 30)   return "Sobrepeso";
  return "Obesidade";
}
function imcColorFn(imc: number | null): string {
  if (!imc) return C.muted;
  if (imc < 18.5) return C.yellow;
  if (imc < 25)   return C.green;
  if (imc < 30)   return C.orange;
  return C.red;
}

// ── Modal genérico de registro ─────────────────────────────────────────────
interface RegistroModal {
  titulo: string;
  campos: { key: string; label: string; placeholder: string; keyboard?: any }[];
  onSalvar: (valores: Record<string, string>) => Promise<void>;
}

export default function SaudeScreen({ navigation }: { navigation?: any }) {
  const [dados,      setDados]      = useState<SaudeData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [modal,      setModal]      = useState<RegistroModal | null>(null);
  const [modalVals,  setModalVals]  = useState<Record<string, string>>({});
  const [salvando,   setSalvando]   = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setCarregando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const hoje = new Date();
      const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();

      const [gl, pr, imc, agua, sono, med, consulta] = await Promise.all([
        supabase.from("leituras_glicemia").select("valor, medido_em").eq("user_id", user.id).order("medido_em", { ascending: false }).limit(1).single(),
        supabase.from("leituras_pressao").select("sistolica, diastolica, medido_em").eq("user_id", user.id).order("medido_em", { ascending: false }).limit(1).single(),
        supabase.from("registros_imc").select("peso, altura, registrado_em").eq("user_id", user.id).order("registrado_em", { ascending: false }).limit(1).single(),
        supabase.from("registros_diarios").select("dados").eq("user_id", user.id).eq("tipo", "agua").gte("registrado_em", inicioDia),
        supabase.from("registros_diarios").select("dados").eq("user_id", user.id).eq("tipo", "sono").order("registrado_em", { ascending: false }).limit(1).single(),
        supabase.from("medicamentos").select("nome, proximo_lembrete").eq("user_id", user.id).order("proximo_lembrete", { ascending: true }).limit(1).single(),
        supabase.from("consultas").select("data_hora, especialidade").eq("user_id", user.id).gte("data_hora", new Date().toISOString()).order("data_hora", { ascending: true }).limit(1).single(),
      ]);

      const imcVal = imc.data ? parseFloat((imc.data.peso / ((imc.data.altura / 100) ** 2)).toFixed(1)) : null;
      const litros = ((agua.data ?? []).reduce((acc: number, r: any) => acc + (r.dados?.quantidade ?? 0.25), 0));
      const fmt = (iso: string) => { const d = new Date(iso); return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`; };
      const fmtH = (iso: string) => { const d = new Date(iso); return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`; };

      setDados({
        glicemia:     { valor: gl.data?.valor ?? null, hora: gl.data?.medido_em ?? null },
        pressao:      { sistolica: pr.data?.sistolica ?? null, diastolica: pr.data?.diastolica ?? null, hora: pr.data?.medido_em ?? null },
        peso:         { valor: imc.data?.peso ?? null, imc: imcVal, imcLabel: imcLabelFn(imcVal) },
        hidratacao:   { litros, meta: 2.0 },
        sono:         { horas: sono.data?.dados?.horas ?? null, qualidade: sono.data?.dados?.qualidade ?? null },
        medicamentos: { proximoLembrete: med.data?.proximo_lembrete ?? null, nome: med.data?.nome ?? null },
        consulta:     { data: consulta.data ? fmt(consulta.data.data_hora) : null, hora: consulta.data ? fmtH(consulta.data.data_hora) : null, especialidade: consulta.data?.especialidade ?? null },
      });
    } catch (err) { console.error("Erro Saude:", err); }
    finally { setCarregando(false); }
  }

  function abrirModal(cfg: RegistroModal) {
    const init: Record<string, string> = {};
    cfg.campos.forEach(c => { init[c.key] = ""; });
    setModalVals(init);
    setModal(cfg);
  }

  async function salvarModal() {
    if (!modal) return;
    setSalvando(true);
    try { await modal.onSalvar(modalVals); setModal(null); await carregar(); }
    catch (err) { Alert.alert("Erro", "Não foi possível salvar."); }
    finally { setSalvando(false); }
  }

  // ── Funções de registro no Supabase ───────────────────────────────────────
  async function registrarPressao(v: Record<string, string>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const sis = parseInt(v.sistolica, 10);
    const dia = parseInt(v.diastolica, 10);
    if (isNaN(sis) || isNaN(dia)) throw new Error("Valores inválidos");
    await supabase.from("leituras_pressao").insert({ user_id: user.id, sistolica: sis, diastolica: dia, medido_em: new Date().toISOString() });
  }

  async function registrarPeso(v: Record<string, string>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const peso   = parseFloat(v.peso);
    const altura = parseFloat(v.altura);
    if (isNaN(peso) || isNaN(altura)) throw new Error("Valores inválidos");
    await supabase.from("registros_imc").insert({ user_id: user.id, peso, altura, registrado_em: new Date().toISOString() });
  }

  async function registrarAgua(v: Record<string, string>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const qtd = parseFloat(v.quantidade || "0.25");
    await supabase.from("registros_diarios").insert({ user_id: user.id, tipo: "agua", dados: { quantidade: qtd, data: new Date().toISOString() } });
  }

  async function registrarSono(v: Record<string, string>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (!v.horas) throw new Error("Preencha as horas dormidas");
    await supabase.from("registros_diarios").insert({ user_id: user.id, tipo: "sono", dados: { horas: v.horas, qualidade: v.qualidade || "—", data: new Date().toISOString() } });
  }

  if (carregando) return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={C.accent} />
    </View>
  );

  const d = dados;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Saúde</Text>
          <Text style={styles.pageSub}>Acompanhe sua saúde geral</Text>
        </View>

        <View style={styles.grid}>
          {/* Glicemia */}
          <TouchableOpacity style={styles.metricCard} activeOpacity={0.85} onPress={() => navigation?.navigate?.("Monitorar")}>
            <View style={styles.metricHeader}>
              <View style={[styles.dot, { backgroundColor: C.accent }]} />
              <Text style={styles.metricTitle}>Glicemia</Text>
              <Ionicons name="chevron-forward" size={14} color={C.muted} />
            </View>
            <Text style={styles.metricSub}>última medição</Text>
            <Text style={styles.metricValue}>{d?.glicemia.valor ?? "—"} <Text style={styles.metricUnit}>mg/dL</Text></Text>
            <Text style={styles.metricTime}>{formatHora(d?.glicemia.hora ?? null)}</Text>
            <View style={styles.miniChart}>
              {[140, 120, 155, 130, 142].map((v, i) => (
                <View key={i} style={[styles.miniBar, { height: Math.max(6, (v / 180) * 28), backgroundColor: v > 150 ? C.orange + "80" : C.accent + "80" }]} />
              ))}
            </View>
          </TouchableOpacity>

          {/* Pressão */}
          <TouchableOpacity style={styles.metricCard} activeOpacity={0.85}
            onPress={() => abrirModal({ titulo: "Registrar pressão arterial", campos: [{ key: "sistolica", label: "Sistólica (ex: 120)", placeholder: "120", keyboard: "numeric" }, { key: "diastolica", label: "Diastólica (ex: 80)", placeholder: "80", keyboard: "numeric" }], onSalvar: registrarPressao })}>
            <View style={styles.metricHeader}>
              <View style={[styles.dot, { backgroundColor: C.pink }]} />
              <Text style={styles.metricTitle}>Pressão arterial</Text>
              <Ionicons name="add-circle-outline" size={14} color={C.pink} />
            </View>
            <Text style={styles.metricSub}>última medição</Text>
            <Text style={styles.metricValue}>{d?.pressao.sistolica ?? "—"} / {d?.pressao.diastolica ?? "—"} <Text style={styles.metricUnit}>mmHg</Text></Text>
            <Text style={styles.metricTime}>{formatHora(d?.pressao.hora ?? null)}</Text>
            <View style={styles.miniChart}>
              {[120, 125, 118, 122, 120].map((v, i) => (
                <View key={i} style={[styles.miniBar, { height: Math.max(6, (v / 150) * 28), backgroundColor: C.pink + "80" }]} />
              ))}
            </View>
          </TouchableOpacity>

          {/* Peso e IMC */}
          <TouchableOpacity style={styles.metricCard} activeOpacity={0.85}
            onPress={() => abrirModal({ titulo: "Registrar peso", campos: [{ key: "peso", label: "Peso (kg)", placeholder: "70.5", keyboard: "decimal-pad" }, { key: "altura", label: "Altura (cm)", placeholder: "170", keyboard: "numeric" }], onSalvar: registrarPeso })}>
            <View style={styles.metricHeader}>
              <View style={[styles.dot, { backgroundColor: C.green }]} />
              <Text style={styles.metricTitle}>Peso e IMC</Text>
              <Ionicons name="add-circle-outline" size={14} color={C.green} />
            </View>
            <Text style={styles.metricSub}>Peso atual</Text>
            <Text style={styles.metricValue}>{d?.peso.valor ?? "—"} <Text style={styles.metricUnit}>kg</Text></Text>
            <View style={styles.imcRow}>
              <Text style={[styles.metricUnit, { color: C.green }]}>IMC: {d?.peso.imc ?? "—"}</Text>
              {d?.peso.imc && (
                <View style={[styles.imcBadge, { backgroundColor: `${imcColorFn(d.peso.imc)}20` }]}>
                  <View style={[styles.dot, { backgroundColor: imcColorFn(d.peso.imc), width: 6, height: 6 }]} />
                  <Text style={[styles.imcBadgeText, { color: imcColorFn(d.peso.imc) }]}>{d.peso.imcLabel}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Hidratação */}
          <TouchableOpacity style={styles.metricCard} activeOpacity={0.85}
            onPress={() => abrirModal({ titulo: "Registrar água", campos: [{ key: "quantidade", label: "Quantidade (L)", placeholder: "0.25", keyboard: "decimal-pad" }], onSalvar: registrarAgua })}>
            <View style={styles.metricHeader}>
              <View style={[styles.dot, { backgroundColor: C.blue }]} />
              <Text style={styles.metricTitle}>Hidratação</Text>
              <Ionicons name="add-circle-outline" size={14} color={C.blue} />
            </View>
            <Text style={styles.metricSub}>Água ingerida</Text>
            <Text style={styles.metricValue}>{d?.hidratacao.litros.toFixed(1) ?? "0"} <Text style={styles.metricUnit}>L / {d?.hidratacao.meta}L</Text></Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, ((d?.hidratacao.litros ?? 0) / (d?.hidratacao.meta ?? 2)) * 100)}%` as any, backgroundColor: C.blue }]} />
            </View>
          </TouchableOpacity>

          {/* Sono */}
          <TouchableOpacity style={styles.metricCard} activeOpacity={0.85}
            onPress={() => abrirModal({ titulo: "Registrar sono", campos: [{ key: "horas", label: "Horas dormidas (ex: 7h 30min)", placeholder: "7h 30min" }, { key: "qualidade", label: "Qualidade (Boa / Regular / Ruim)", placeholder: "Boa" }], onSalvar: registrarSono })}>
            <View style={styles.metricHeader}>
              <View style={[styles.dot, { backgroundColor: C.accent }]} />
              <Text style={styles.metricTitle}>Sono</Text>
              <Ionicons name="add-circle-outline" size={14} color={C.accent} />
            </View>
            <Text style={styles.metricSub}>Horas dormidas</Text>
            <Text style={styles.metricValue}>{d?.sono.horas ?? "—"}</Text>
            {d?.sono.qualidade && <Text style={[styles.metricUnit, { color: C.green }]}>Qualidade: {d.sono.qualidade}</Text>}
            <View style={styles.sonoBarRow}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} style={[styles.sonoBar, { backgroundColor: i < 7 ? C.accent + "60" : C.border }]} />
              ))}
            </View>
          </TouchableOpacity>

          {/* Medicamentos */}
          <TouchableOpacity style={styles.metricCard} activeOpacity={0.85}>
            <View style={styles.metricHeader}>
              <View style={[styles.dot, { backgroundColor: C.yellow }]} />
              <Text style={styles.metricTitle}>Medicamentos</Text>
              <Ionicons name="chevron-forward" size={14} color={C.muted} />
            </View>
            <Text style={styles.metricSub}>Próximo lembrete</Text>
            <Text style={styles.metricValue}>{d?.medicamentos.proximoLembrete ? new Date(d.medicamentos.proximoLembrete).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}</Text>
            {d?.medicamentos.nome && <Text style={styles.metricUnit}>{d.medicamentos.nome}</Text>}
          </TouchableOpacity>
        </View>

        {/* Consulta */}
        <View style={styles.consultaCard}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricTitle}>Consultas</Text>
            <Ionicons name="chevron-forward" size={14} color={C.muted} />
          </View>
          <Text style={styles.metricSub}>Próxima consulta</Text>
          {d?.consulta.data
            ? <><Text style={styles.consultaData}>{d.consulta.data} • {d.consulta.hora}</Text><Text style={styles.consultaEsp}>{d.consulta.especialidade}</Text></>
            : <Text style={styles.metricSub}>Nenhuma consulta agendada</Text>}
        </View>

        {/* Dica */}
        <View style={styles.dicaCard}>
          <View style={styles.dicaIcon}><Ionicons name="shield-checkmark-outline" size={20} color={C.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dicaTitle}>Dicas para você</Text>
            <Text style={styles.dicaText}>Manter hábitos saudáveis diariamente ajuda no controle do diabetes e melhora sua qualidade de vida.</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal genérico de registro */}
      <Modal visible={!!modal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setModal(null)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>{modal?.titulo}</Text>
                  {modal?.campos.map(campo => (
                    <View key={campo.key} style={{ marginBottom: 14 }}>
                      <Text style={styles.modalLabel}>{campo.label}</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={modalVals[campo.key] ?? ""}
                        onChangeText={v => setModalVals(prev => ({ ...prev, [campo.key]: v }))}
                        placeholder={campo.placeholder}
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        keyboardType={campo.keyboard ?? "default"}
                      />
                    </View>
                  ))}
                  <TouchableOpacity style={[styles.modalBtn, salvando && { opacity: 0.6 }]} onPress={salvarModal} disabled={salvando}>
                    <Text style={styles.modalBtnText}>{salvando ? "Salvando..." : "Salvar"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setModal(null)} style={{ alignItems: "center", marginTop: 12 }}>
                    <Text style={{ fontFamily: A, color: C.muted, fontSize: 13 }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  scroll:       { paddingHorizontal: 16, paddingTop: 8 },
  pageHeader:   { marginBottom: 16 },
  backBtn:      { marginBottom: 4 },
  pageTitle:    { fontFamily: A, fontWeight: "800", fontSize: 26, color: C.text, marginBottom: 4 },
  pageSub:      { fontFamily: A, fontSize: 13, color: C.muted },
  grid:         { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 14 },
  metricCard:   { width: "47%", backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 14, gap: 4 },
  metricHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  dot:          { width: 8, height: 8, borderRadius: 4 },
  metricTitle:  { fontFamily: A, fontSize: 13, color: C.text, fontWeight: "600", flex: 1 },
  metricSub:    { fontFamily: A, fontSize: 11, color: C.muted },
  metricValue:  { fontFamily: A, fontWeight: "800", fontSize: 22, color: C.text },
  metricUnit:   { fontFamily: A, fontSize: 11, color: C.muted, fontWeight: "400" },
  metricTime:   { fontFamily: A, fontSize: 11, color: C.muted },
  miniChart:    { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 28, marginTop: 8 },
  miniBar:      { flex: 1, borderRadius: 3 },
  imcRow:       { flexDirection: "row", alignItems: "center", gap: 8 },
  imcBadge:     { flexDirection: "row", alignItems: "center", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  imcBadgeText: { fontFamily: A, fontSize: 10, fontWeight: "600" },
  progressTrack:{ height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden", marginTop: 8 },
  progressFill: { height: "100%", borderRadius: 2 },
  sonoBarRow:   { flexDirection: "row", gap: 3, marginTop: 8 },
  sonoBar:      { flex: 1, height: 6, borderRadius: 3 },
  consultaCard: { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14 },
  consultaData: { fontFamily: A, fontWeight: "800", fontSize: 20, color: C.text, marginTop: 4 },
  consultaEsp:  { fontFamily: A, fontSize: 12, color: C.muted },
  dicaCard:     { flexDirection: "row", backgroundColor: "rgba(124,92,255,0.08)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(124,92,255,0.2)", padding: 14, gap: 12 },
  dicaIcon:     { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(124,92,255,0.15)", alignItems: "center", justifyContent: "center" },
  dicaTitle:    { fontFamily: A, fontWeight: "700", fontSize: 13, color: C.text, marginBottom: 3 },
  dicaText:     { fontFamily: A, fontSize: 12, color: C.muted, lineHeight: 18, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard:    { backgroundColor: "#1C1A50", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, borderWidth: 1, borderColor: C.border },
  modalTitle:   { fontFamily: A, fontWeight: "700", fontSize: 18, color: C.text, marginBottom: 16 },
  modalLabel:   { fontFamily: A, fontSize: 12, color: C.muted, marginBottom: 6 },
  modalInput:   { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, height: 46, paddingHorizontal: 14, fontFamily: A, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
  modalBtn:     { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  modalBtnText: { fontFamily: A, fontWeight: "700", fontSize: 15, color: "#FFF" },
});