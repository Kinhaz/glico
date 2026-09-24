import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, Modal,
  TextInput, TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

const A = "Arial";
const C = {
  bg:       "#0B0A24",
  surface:  "#13122E",
  border:   "rgba(255,255,255,0.08)",
  accent:   "#7C5CFF",
  accentBg: "rgba(124,92,255,0.14)",
  green:    "#4FD1A5",
  red:      "#FF6B6B",
  text:     "#F5F3FF",
  muted:    "#A5A3C7",
};

interface Perfil {
  nome_completo:   string;
  email:           string;
  data_nascimento: string;
  genero:          string | null;
  tipo_sanguineo:  string | null;
  telefone:        string | null;
}

interface Questionario { respostas: Record<string, string>; }

function iniciais(nome: string) {
  const p = nome?.trim().split(" ");
  if (!p?.length) return "?";
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={ir.row}>
      <View style={ir.iconWrap}><Ionicons name={icon as any} size={16} color={C.accent} /></View>
      <Text style={ir.label}>{label}</Text>
      <Text style={ir.value}>{value || "—"}</Text>
    </View>
  );
}
const ir = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  iconWrap:{ width: 30, height: 30, borderRadius: 8, backgroundColor: C.accentBg, alignItems: "center", justifyContent: "center" },
  label:   { fontFamily: A, fontSize: 13, color: C.muted, flex: 1 },
  value:   { fontFamily: A, fontSize: 13, color: C.text },
});

function QuickLink({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={ql.btn} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon as any} size={16} color={C.accent} />
      <Text style={ql.label}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={C.accent} style={{ marginLeft: "auto" as any }} />
    </TouchableOpacity>
  );
}
const ql = StyleSheet.create({
  btn:   { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginBottom: 8 },
  label: { fontFamily: A, fontSize: 13, color: C.accent, flex: 1 },
});

// ── Modal de edição ────────────────────────────────────────────────────────
interface EditField { key: keyof Perfil; label: string; placeholder: string; keyboard?: any; }
const EDIT_FIELDS: EditField[] = [
  { key: "nome_completo",   label: "Nome completo",      placeholder: "Seu nome completo" },
  { key: "telefone",        label: "Telefone",            placeholder: "(00) 00000-0000", keyboard: "phone-pad" },
  { key: "data_nascimento", label: "Data de nascimento",  placeholder: "DD/MM/AAAA", keyboard: "numeric" },
];

export default function PerfilScreen({ navigation }: { navigation?: any }) {
  const [perfil,       setPerfil]       = useState<Perfil | null>(null);
  const [questionario, setQuestionario] = useState<Questionario | null>(null);
  const [carregando,   setCarregando]   = useState(true);
  const [editModal,    setEditModal]    = useState(false);
  const [editData,     setEditData]     = useState<Partial<Perfil>>({});
  const [salvando,     setSalvando]     = useState(false);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [pRes, qRes] = await Promise.all([
        supabase.from("perfis").select("*").eq("id", user.id).single(),
        supabase.from("questionarios").select("respostas").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
      ]);
      if (pRes.data)  setPerfil(pRes.data as Perfil);
      if (qRes.data)  setQuestionario(qRes.data as Questionario);
    } catch (err) { console.error("Erro perfil:", err); }
    finally { setCarregando(false); }
  }

  function abrirEdicao() {
    setEditData({
      nome_completo:   perfil?.nome_completo   ?? "",
      telefone:        perfil?.telefone        ?? "",
      data_nascimento: perfil?.data_nascimento ?? "",
    });
    setEditModal(true);
  }

  async function salvarEdicao() {
    if (!perfil) return;
    setSalvando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const update: Partial<Perfil> = {
        nome_completo:   editData.nome_completo   ?? perfil.nome_completo,
        telefone:        editData.telefone        ?? perfil.telefone,
        data_nascimento: editData.data_nascimento ?? perfil.data_nascimento,
      };
      const { error } = await supabase.from("perfis").update({ ...update, updated_at: new Date().toISOString() }).eq("id", user.id);
      if (error) { Alert.alert("Erro", error.message); return; }
      setPerfil(prev => prev ? { ...prev, ...update } : prev);
      setEditModal(false);
      Alert.alert("Sucesso", "Perfil atualizado!");
    } catch (err) { Alert.alert("Erro", "Não foi possível salvar."); }
    finally { setSalvando(false); }
  }

  const handleLogout = async () => {
    Alert.alert("Sair da conta", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => {
        await supabase.auth.signOut();
        navigation?.reset?.({ index: 0, routes: [{ name: "Inicio" }] });
      }},
    ]);
  };

  if (carregando) return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={C.accent} />
    </View>
  );

  const nome          = perfil?.nome_completo ?? "Usuário";
  const email         = perfil?.email ?? "—";
  const dataNasc      = perfil?.data_nascimento ?? "—";
  const genero        = perfil?.genero ?? questionario?.respostas?.genero ?? "—";
  const tipoSanguineo = perfil?.tipo_sanguineo ?? questionario?.respostas?.tipo_sanguineo ?? "—";
  const tipoDiabetes  = questionario?.respostas?.tipo_diabetes ?? "—";
  const telefone      = perfil?.telefone ?? "—";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Perfil</Text>
          <Text style={styles.pageSub}>Suas informações e preferências</Text>
        </View>

        {/* Card identidade */}
        <View style={styles.identityCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{iniciais(nome)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{nome}</Text>
              <View style={styles.infoLine}>
                <Ionicons name="mail-outline" size={13} color={C.muted} />
                <Text style={styles.infoLineText}>{email}</Text>
              </View>
              <View style={styles.infoLine}>
                <Ionicons name="call-outline" size={13} color={C.muted} />
                <Text style={styles.infoLineText}>{telefone}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={abrirEdicao}>
              <Ionicons name="pencil-outline" size={14} color={C.accent} />
              <Text style={styles.editBtnText}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informações pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMAÇÕES PESSOAIS</Text>
          <View style={styles.card}>
            <InfoRow icon="calendar-outline" label="Data de nascimento:" value={dataNasc} />
            <View style={styles.divider} />
            <InfoRow icon="person-outline"   label="Gênero:"             value={genero} />
            <View style={styles.divider} />
            <InfoRow icon="water-outline"    label="Tipo sanguíneo:"     value={tipoSanguineo} />
          </View>
        </View>

        {/* Diagnóstico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DIAGNÓSTICO</Text>
          <View style={styles.diagRow}>
            <View style={[styles.diagCard, { borderColor: `${C.red}30` }]}>
              <Text style={styles.diagLabel}>Tipo de diabetes</Text>
              <Text style={[styles.diagValue, { color: C.red }]}>{tipoDiabetes}</Text>
            </View>
            <View style={[styles.diagCard, { borderColor: `${C.green}30` }]}>
              <Text style={styles.diagLabel}>Tipos de diagnósticos</Text>
              <Text style={[styles.diagValue, { color: C.green }]}>{questionario ? "1" : "—"}</Text>
            </View>
          </View>
        </View>

        {/* Configurações da conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONFIGURAÇÕES DA CONTA</Text>
          <QuickLink icon="shield-outline"        label="Segurança e privacidade"   onPress={() => navigation?.navigate?.("Configuracoes")} />
          <QuickLink icon="notifications-outline" label="Notificações"               onPress={() => navigation?.navigate?.("Configuracoes")} />
          <QuickLink icon="time-outline"          label="Lembretes de medicamentos"  onPress={() => navigation?.navigate?.("Configuracoes")} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={16} color={C.red} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal Editar Perfil */}
      <Modal visible={editModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setEditModal(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Editar Perfil</Text>
                  <Text style={styles.modalSub}>O e-mail não pode ser alterado</Text>

                  {EDIT_FIELDS.map(f => (
                    <View key={f.key} style={styles.modalField}>
                      <Text style={styles.modalLabel}>{f.label}</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={String(editData[f.key] ?? "")}
                        onChangeText={v => setEditData(prev => ({ ...prev, [f.key]: v }))}
                        placeholder={f.placeholder}
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        keyboardType={f.keyboard ?? "default"}
                        autoCapitalize={f.key === "nome_completo" ? "words" : "none"}
                      />
                    </View>
                  ))}

                  <TouchableOpacity style={[styles.modalBtn, salvando && { opacity: 0.6 }]} onPress={salvarEdicao} disabled={salvando}>
                    <Text style={styles.modalBtnText}>{salvando ? "Salvando..." : "Salvar alterações"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditModal(false)} style={{ alignItems: "center", marginTop: 12 }}>
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
  scroll:       { paddingHorizontal: 20, paddingTop: 16 },
  pageHeader:   { marginBottom: 20 },
  pageTitle:    { fontFamily: A, fontWeight: "800", fontSize: 26, color: C.text, marginBottom: 4 },
  pageSub:      { fontFamily: A, fontSize: 13, color: C.muted },
  identityCard: { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 20 },
  avatarRow:    { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  avatar:       { width: 56, height: 56, borderRadius: 28, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  avatarText:   { fontFamily: A, fontWeight: "800", fontSize: 20, color: "#FFF" },
  userName:     { fontFamily: A, fontWeight: "700", fontSize: 17, color: C.text, marginBottom: 6 },
  infoLine:     { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  infoLineText: { fontFamily: A, fontSize: 12, color: C.muted },
  editBtn:      { flexDirection: "row", alignItems: "center", backgroundColor: C.accentBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 5 },
  editBtnText:  { fontFamily: A, fontSize: 12, color: C.accent },
  section:      { marginBottom: 20 },
  sectionTitle: { fontFamily: A, fontWeight: "700", fontSize: 11, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 },
  card:         { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16 },
  divider:      { height: 1, backgroundColor: C.border },
  diagRow:      { flexDirection: "row", gap: 12 },
  diagCard:     { flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, padding: 16 },
  diagLabel:    { fontFamily: A, fontSize: 11, color: C.muted, marginBottom: 8 },
  diagValue:    { fontFamily: A, fontWeight: "800", fontSize: 18 },
  logoutBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,107,107,0.1)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,107,107,0.25)", paddingVertical: 14 },
  logoutText:   { fontFamily: A, fontWeight: "600", fontSize: 14, color: C.red },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard:    { backgroundColor: "#1C1A50", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, borderWidth: 1, borderColor: C.border },
  modalTitle:   { fontFamily: A, fontWeight: "700", fontSize: 18, color: C.text, marginBottom: 4 },
  modalSub:     { fontFamily: A, fontSize: 13, color: C.muted, marginBottom: 20 },
  modalField:   { marginBottom: 14 },
  modalLabel:   { fontFamily: A, fontSize: 12, color: C.muted, marginBottom: 6 },
  modalInput:   { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, height: 46, paddingHorizontal: 14, fontFamily: A, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
  modalBtn:     { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  modalBtnText: { fontFamily: A, fontWeight: "700", fontSize: 15, color: "#FFF" },
});