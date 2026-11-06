import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  buscarConvitePorId,
  atualizarPermissoesConvite,
  excluirConvite,
  type ConviteFamiliar,
  type PermissoesConvite,
} from "../services/convitesService";

const A = "Arial";

const C = {
  bg: "#0B0A24",
  surface: "#13122E",
  border: "rgba(255,255,255,0.08)",
  accent: "#7C5CFF",
  green: "#4FD1A5",
  red: "#FF6B6B",
  text: "#F5F3FF",
  muted: "#A5A3C7",
  yellow: "#FFD66B",
};

const PERMISSOES: Array<{
  key: keyof PermissoesConvite;
  titulo: string;
  descricao: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: "glicemia", titulo: "Glicemia", descricao: "Permite visualizar suas medições de glicemia.", icon: "water-outline" },
  { key: "historico", titulo: "Histórico", descricao: "Permite consultar seu histórico de registros.", icon: "time-outline" },
  { key: "graficos", titulo: "Gráficos", descricao: "Permite visualizar seus gráficos de evolução.", icon: "stats-chart-outline" },
  { key: "alimentacao", titulo: "Alimentação", descricao: "Permite visualizar seus registros alimentares.", icon: "restaurant-outline" },
  { key: "atividade", titulo: "Atividade física", descricao: "Permite visualizar seus registros de atividade.", icon: "walk-outline" },
  { key: "medicamentos", titulo: "Medicamentos", descricao: "Permite visualizar seus registros de medicamentos.", icon: "medkit-outline" },
  { key: "alertas", titulo: "Alertas", descricao: "Permite receber alertas relacionados ao seu acompanhamento.", icon: "notifications-outline" },
  { key: "relatorios", titulo: "Relatórios", descricao: "Permite receber os relatórios autorizados por você.", icon: "document-text-outline" },
];

const PERMISSOES_INICIAIS: PermissoesConvite = {
  glicemia: false,
  historico: false,
  graficos: false,
  alimentacao: false,
  atividade: false,
  medicamentos: false,
  alertas: false,
  relatorios: false,
};

export default function FamiliarDetalhesScreen({ navigation, route }: { navigation?: any; route?: any }) {
  const familiarId = route?.params?.familiarId as string | undefined;
  const [familiar, setFamiliar] = useState<ConviteFamiliar | null>(null);
  const [permissoes, setPermissoes] = useState<PermissoesConvite>(PERMISSOES_INICIAIS);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!familiarId) {
      setFamiliar(null);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    try {
      const convite = await buscarConvitePorId(familiarId);
      setFamiliar(convite);
      setPermissoes(convite?.permissoes ?? PERMISSOES_INICIAIS);
    } catch (error) {
      console.error("Erro ao carregar detalhes do familiar:", error);
      setFamiliar(null);
    } finally {
      setCarregando(false);
    }
  }, [familiarId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  function voltar() {
    navigation?.goBack();
  }

  function alterarPermissao(key: keyof PermissoesConvite, value: boolean) {
    setPermissoes((atual) => ({
      ...atual,
      [key]: value,
    }));
  }

  async function salvarPermissoes() {
    if (!familiar) return;

    try {
      setSalvando(true);
      const atualizado = await atualizarPermissoesConvite(familiar.id, permissoes);

      if (!atualizado) {
        Alert.alert("Não foi possível salvar", "O vínculo não foi encontrado.");
        return;
      }

      setFamiliar(atualizado);
      setPermissoes(atualizado.permissoes);
      Alert.alert("Permissões atualizadas", "As permissões deste familiar foram atualizadas.");
    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
      Alert.alert("Erro", "Não foi possível atualizar as permissões.");
    } finally {
      setSalvando(false);
    }
  }

  function removerAcesso() {
    if (!familiar) return;

    Alert.alert(
      "Remover acesso?",
      `Você deseja remover o acesso de ${familiar.nome} ao seu Espaço Familiar?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover acesso",
          style: "destructive",
          onPress: async () => {
            try {
              const removido = await excluirConvite(familiar.id);

              if (!removido) {
                Alert.alert("Não foi possível remover", "O vínculo não foi encontrado.");
                return;
              }

              navigation?.goBack();
            } catch (error) {
              console.error("Erro ao remover acesso:", error);
              Alert.alert("Erro", "Não foi possível remover o acesso.");
            }
          },
        },
      ]
    );
  }

  function formatarData(data?: string) {
    if (!data) return "—";
    const date = new Date(data);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!familiar) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={voltar} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil do familiar</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.notFound}>
          <View style={styles.notFoundIcon}>
            <Ionicons name="person-outline" size={30} color={C.accent} />
          </View>
          <Text style={styles.notFoundTitle}>Familiar não encontrado</Text>
          <Text style={styles.notFoundText}>Este vínculo pode ter sido removido ou ainda não está disponível.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={voltar} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={voltar} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil do familiar</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{familiar.nome.trim().charAt(0).toUpperCase() || "?"}</Text>
          </View>

          <Text style={styles.name}>{familiar.nome}</Text>
          <Text style={styles.relation}>{familiar.relacao}</Text>

          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Acesso ativo</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={18} color={C.muted} />
            <Text style={styles.infoText}>{familiar.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={C.muted} />
            <Text style={styles.infoText}>Convite enviado em {formatarData(familiar.criadoEm)}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Permissões de acesso</Text>
            <Text style={styles.sectionSubtitle}>Você controla exatamente o que este familiar pode acessar.</Text>
          </View>
        </View>

        <View style={styles.permissionsCard}>
          {PERMISSOES.map((permissao, index) => (
            <View key={permissao.key} style={[styles.permissionRow, index < PERMISSOES.length - 1 && styles.permissionRowBorder]}>
              <View style={styles.permissionIcon}>
                <Ionicons name={permissao.icon} size={19} color={C.accent} />
              </View>

              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>{permissao.titulo}</Text>
                <Text style={styles.permissionDescription}>{permissao.descricao}</Text>
              </View>

              <Switch
                value={permissoes[permissao.key]}
                onValueChange={(value) => alterarPermissao(permissao.key, value)}
                trackColor={{ false: "rgba(255,255,255,0.12)", true: "rgba(124,92,255,0.55)" }}
                thumbColor={permissoes[permissao.key] ? C.accent : "#D7D5E8"}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.saveButton, salvando && styles.disabledButton]} onPress={salvarPermissoes} disabled={salvando} activeOpacity={0.8}>
          {salvando ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
          <Text style={styles.saveButtonText}>{salvando ? "Salvando..." : "Salvar permissões"}</Text>
        </TouchableOpacity>

        <View style={styles.reportCard}>
          <View style={styles.reportIcon}>
            <Ionicons name="document-text-outline" size={21} color={C.yellow} />
          </View>
          <View style={styles.reportContent}>
            <Text style={styles.reportTitle}>Relatórios</Text>
            <Text style={styles.reportText}>A configuração de frequência e envio de relatórios será disponibilizada nesta etapa.</Text>
            <Text style={styles.reportStatus}>Em breve</Text>
          </View>
        </View>

        <View style={styles.securityCard}>
          <Ionicons name="shield-checkmark-outline" size={21} color={C.green} />
          <Text style={styles.securityText}>As permissões podem ser alteradas a qualquer momento. Você continua no controle dos seus dados.</Text>
        </View>

        <TouchableOpacity style={styles.removeButton} onPress={removerAcesso} activeOpacity={0.8}>
          <Ionicons name="person-remove-outline" size={20} color={C.red} />
          <Text style={styles.removeButtonText}>Remover acesso</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: { width: 42, height: 42, borderRadius: 13, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", color: C.text, fontFamily: A, fontWeight: "700", fontSize: 17 },
  headerSpacer: { width: 42 },
  profileCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 22, alignItems: "center", marginBottom: 24 },
  avatar: { width: 76, height: 76, borderRadius: 24, backgroundColor: "rgba(124,92,255,0.18)", borderWidth: 1, borderColor: "rgba(124,92,255,0.30)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  avatarText: { color: C.accent, fontFamily: A, fontWeight: "800", fontSize: 30 },
  name: { color: C.text, fontFamily: A, fontWeight: "800", fontSize: 22, textAlign: "center" },
  relation: { color: C.muted, fontFamily: A, fontSize: 14, marginTop: 4, textAlign: "center" },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(79,209,165,0.10)" },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  activeText: { color: C.green, fontFamily: A, fontWeight: "700", fontSize: 12 },
  infoRow: { width: "100%", flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  infoText: { flex: 1, color: C.muted, fontFamily: A, fontSize: 13 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { color: C.text, fontFamily: A, fontWeight: "800", fontSize: 18 },
  sectionSubtitle: { color: C.muted, fontFamily: A, fontSize: 12.5, lineHeight: 18, marginTop: 4 },
  permissionsCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 18, overflow: "hidden" },
  permissionRow: { minHeight: 82, flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12, gap: 11 },
  permissionRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  permissionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(124,92,255,0.10)", alignItems: "center", justifyContent: "center" },
  permissionContent: { flex: 1 },
  permissionTitle: { color: C.text, fontFamily: A, fontWeight: "700", fontSize: 14 },
  permissionDescription: { color: C.muted, fontFamily: A, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  saveButton: { minHeight: 50, borderRadius: 15, backgroundColor: C.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 },
  disabledButton: { opacity: 0.65 },
  saveButtonText: { color: "#FFFFFF", fontFamily: A, fontWeight: "800", fontSize: 14 },
  reportCard: { marginTop: 18, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, flexDirection: "row", gap: 12 },
  reportIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,214,107,0.10)", alignItems: "center", justifyContent: "center" },
  reportContent: { flex: 1 },
  reportTitle: { color: C.text, fontFamily: A, fontWeight: "800", fontSize: 14 },
  reportText: { color: C.muted, fontFamily: A, fontSize: 12, lineHeight: 17, marginTop: 4 },
  reportStatus: { color: C.yellow, fontFamily: A, fontWeight: "700", fontSize: 11, marginTop: 8 },
  securityCard: { marginTop: 14, padding: 15, borderRadius: 16, backgroundColor: "rgba(79,209,165,0.06)", borderWidth: 1, borderColor: "rgba(79,209,165,0.13)", flexDirection: "row", gap: 10, alignItems: "flex-start" },
  securityText: { flex: 1, color: C.muted, fontFamily: A, fontSize: 12, lineHeight: 17 },
  removeButton: { minHeight: 48, borderRadius: 15, backgroundColor: "rgba(255,107,107,0.08)", borderWidth: 1, borderColor: "rgba(255,107,107,0.20)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18 },
  removeButtonText: { color: C.red, fontFamily: A, fontWeight: "800", fontSize: 14 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  notFoundIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(124,92,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  notFoundTitle: { color: C.text, fontFamily: A, fontWeight: "800", fontSize: 18 },
  notFoundText: { color: C.muted, fontFamily: A, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 8, marginBottom: 20 },
  primaryButton: { minHeight: 46, paddingHorizontal: 24, borderRadius: 14, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#FFFFFF", fontFamily: A, fontWeight: "800", fontSize: 14 },
});