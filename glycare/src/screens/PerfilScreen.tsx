import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, ActivityIndicator, Alert,
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
  accentBg:"rgba(124,92,255,0.14)",
  green:   "#4FD1A5",
  red:     "#FF6B6B",
  text:    "#F5F3FF",
  muted:   "#A5A3C7",
};

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Perfil {
  nome_completo:   string;
  email:           string;
  data_nascimento: string;
  genero:          string | null;
  tipo_sanguineo:  string | null;
  telefone:        string | null;
}

interface Questionario {
  respostas: Record<string, string>;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function primeiroNome(nome: string) {
  return nome?.split(" ")[0] ?? nome;
}

function calcularIdade(dataNasc: string): string {
  if (!dataNasc) return "—";
  // Suporta DD/MM/AAAA ou AAAA-MM-DD
  let d: Date;
  if (dataNasc.includes("/")) {
    const [dia, mes, ano] = dataNasc.split("/");
    d = new Date(`${ano}-${mes}-${dia}`);
  } else {
    d = new Date(dataNasc);
  }
  const hoje = new Date();
  const idade = hoje.getFullYear() - d.getFullYear();
  return isNaN(idade) ? "—" : `${idade} anos`;
}

function iniciais(nome: string) {
  const partes = nome?.trim().split(" ");
  if (!partes?.length) return "?";
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// ── Componentes internos ───────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <View style={infoStyles.iconWrap}>
        <Ionicons name={icon as any} size={16} color={C.accent} />
      </View>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value || "—"}</Text>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  iconWrap:{ width: 30, height: 30, borderRadius: 8, backgroundColor: C.accentBg, alignItems: "center", justifyContent: "center" },
  label:   { fontFamily: "DMSans_400Regular", fontSize: 13, color: C.muted, flex: 1 },
  value:   { fontFamily: "DMSans_500Medium", fontSize: 13, color: C.text },
});

function QuickLink({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[qlStyles.btn, { borderColor: `${color}30` }]} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[qlStyles.label, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={color} style={{ marginLeft: "auto" }} />
    </TouchableOpacity>
  );
}
const qlStyles = StyleSheet.create({
  btn:   { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginBottom: 8 },
  label: { fontFamily: "DMSans_500Medium", fontSize: 13 },
});

// ── Screen ─────────────────────────────────────────────────────────────────
export default function PerfilScreen({ navigation }: { navigation?: any }) {
  const [perfil, setPerfil]               = useState<Perfil | null>(null);
  const [questionario, setQuestionario]   = useState<Questionario | null>(null);
  const [carregando, setCarregando]       = useState(true);

  const [fontsLoaded] = useFonts({ Fraunces_700Bold, DMSans_400Regular, DMSans_500Medium });

  useEffect(() => {
    async function carregar() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [perfilRes, qRes] = await Promise.all([
          supabase.from("perfis").select("*").eq("id", user.id).single(),
          supabase.from("questionarios").select("respostas").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
        ]);

        if (perfilRes.data)   setPerfil(perfilRes.data as Perfil);
        if (qRes.data)        setQuestionario(qRes.data as Questionario);
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (!fontsLoaded || carregando) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  const nome          = perfil?.nome_completo ?? "Usuário";
  const email         = perfil?.email ?? "—";
  const dataNasc      = perfil?.data_nascimento ?? "";
  const genero        = perfil?.genero ?? questionario?.respostas?.genero ?? "—";
  const tipoSanguineo = perfil?.tipo_sanguineo ?? questionario?.respostas?.tipo_sanguineo ?? "—";
  const tipoDiabetes  = questionario?.respostas?.tipo_diabetes ?? "—";
  const telefone      = perfil?.telefone ?? "—";

  const handleLogout = async () => {
    Alert.alert("Sair da conta", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => {
        await supabase.auth.signOut();
        navigation?.reset?.({ index: 0, routes: [{ name: "Inicio" }] });
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Título */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Perfil</Text>
          <Text style={styles.pageSub}>Suas informações e preferências</Text>
        </View>

        {/* Card de identidade */}
        <View style={styles.identityCard}>
          <View style={styles.avatarRow}>
            {/* Avatar com iniciais */}
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
            <TouchableOpacity style={styles.editBtn} onPress={() => Alert.alert("Editar perfil", "Em breve!")}>
              <Ionicons name="pencil-outline" size={14} color={C.accent} />
              <Text style={styles.editBtnText}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Informações pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações pessoais</Text>
          <View style={styles.card}>
            <InfoRow icon="calendar-outline"    label="Data de nascimento:" value={dataNasc} />
            <View style={styles.divider} />
            <InfoRow icon="person-outline"      label="Gênero:"             value={genero} />
            <View style={styles.divider} />
            <InfoRow icon="water-outline"       label="Tipo sanguíneo:"     value={tipoSanguineo} />
          </View>
        </View>

        {/* Diagnóstico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnóstico</Text>
          <View style={styles.diagRow}>
            <View style={[styles.diagCard, { borderColor: `${C.red}30` }]}>
              <Text style={styles.diagLabel}>Tipo de diabetes</Text>
              <Text style={[styles.diagValue, { color: C.red }]}>{tipoDiabetes}</Text>
            </View>
            <View style={[styles.diagCard, { borderColor: `${C.green}30` }]}>
              <Text style={styles.diagLabel}>Tipos de diagnósticos</Text>
              <Text style={[styles.diagValue, { color: C.green }]}>
                {questionario ? "1" : "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Configurações da conta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações da conta</Text>
          <QuickLink icon="shield-outline"        label="Segurança e privacidade" color={C.accent}  onPress={() => navigation?.navigate?.("Configuracoes")} />
          <QuickLink icon="notifications-outline" label="Notificações"             color={C.accent}  onPress={() => navigation?.navigate?.("Configuracoes")} />
          <QuickLink icon="time-outline"          label="Lembretes de medicamentos" color={C.accent} onPress={() => navigation?.navigate?.("Configuracoes")} />
        </View>

        {/* Botão sair */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={16} color={C.red} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },
  scroll:      { paddingHorizontal: 20, paddingTop: 16 },
  pageHeader:  { marginBottom: 20 },
  pageTitle:   { fontFamily: "Fraunces_700Bold", fontSize: 28, color: C.text, marginBottom: 4 },
  pageSub:     { fontFamily: "DMSans_400Regular", fontSize: 14, color: C.muted },

  // Identity card
  identityCard:{ backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 20 },
  avatarRow:   { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  avatar:      { width: 56, height: 56, borderRadius: 28, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  avatarText:  { fontFamily: "Fraunces_700Bold", fontSize: 20, color: "#FFF" },
  userName:    { fontFamily: "Fraunces_700Bold", fontSize: 17, color: C.text, marginBottom: 6 },
  infoLine:    { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  infoLineText:{ fontFamily: "DMSans_400Regular", fontSize: 12, color: C.muted },
  editBtn:     { flexDirection: "row", alignItems: "center", backgroundColor: C.accentBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 5 },
  editBtnText: { fontFamily: "DMSans_500Medium", fontSize: 12, color: C.accent },

  // Sections
  section:      { marginBottom: 20 },
  sectionTitle: { fontFamily: "DMSans_500Medium", fontSize: 12, color: C.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10, paddingLeft: 4 },
  card:         { backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16 },
  divider:      { height: 1, backgroundColor: C.border },

  // Diagnóstico
  diagRow:   { flexDirection: "row", gap: 12 },
  diagCard:  { flex: 1, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, padding: 16 },
  diagLabel: { fontFamily: "DMSans_400Regular", fontSize: 11, color: C.muted, marginBottom: 8 },
  diagValue: { fontFamily: "Fraunces_700Bold", fontSize: 18 },

  // Logout
  logoutBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,107,107,0.1)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,107,107,0.25)", paddingVertical: 14 },
  logoutText: { fontFamily: "DMSans_500Medium", fontSize: 14, color: C.red },
});
