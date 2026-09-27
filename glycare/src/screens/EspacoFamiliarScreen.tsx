import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import {
  buscarConvites,
  aceitarConvite,
  recusarConvite,
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

interface Familiar {
  id: string;
  nome: string;
  relacao: string;
  status: "ativo" | "pendente" | "recusado";
  email?: string | null;
}

export default function EspacoFamiliarScreen({ navigation }: { navigation?: any }) {
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      carregarFamiliares();
    }, [])
  );

  async function carregarFamiliares() {
    setCarregando(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setFamiliares([]);
        return;
      }

      const { data: vinculos, error } = await supabase
        .from("vinculos_familiares")
        .select("familiar_id, perfis(nome_completo)")
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao buscar vínculos familiares:", error);
      }

      const familiaresAtivos: Familiar[] = (vinculos || []).map((v: any) => ({
        id: v.familiar_id,
        nome: v.perfis?.nome_completo ?? "Familiar",
        relacao: "Familiar",
        status: "ativo",
      }));

      // Identificador temporário usado pelo serviço de convites.
      const convites = await buscarConvites("paciente-demo");

      const convitesFamiliares: Familiar[] = convites.map((convite) => ({
        id: convite.id,
        nome: convite.nome,
        relacao: convite.relacao,
        status:
          convite.status === "aceito"
            ? "ativo"
            : convite.status === "recusado"
            ? "recusado"
            : "pendente",
        email: convite.email,
      }));

      setFamiliares([...familiaresAtivos, ...convitesFamiliares]);
    } catch (err) {
      console.error("Erro Espaço Familiar:", err);
      setFamiliares([]);
    } finally {
      setCarregando(false);
    }
  }

  function adicionarFamiliar() {
    navigation?.navigate("AdicionarFamiliar");
  }

  async function responderConvite(
    familiar: Familiar,
    status: "aceito" | "recusado"
  ) {
    try {
      if (status === "aceito") {
        await aceitarConvite(familiar.id);
      } else {
        await recusarConvite(familiar.id);
      }

      await carregarFamiliares();
    } catch (error) {
      console.error("Erro ao responder convite:", error);
    }
  }

  function abrirFamiliar(familiar: Familiar) {
    navigation?.getParent()?.navigate("FamiliarDetalhes", { familiarId: familiar.id });
  }

  function renderAvatar(nome: string, tamanho: "normal" | "grande" = "normal") {
    const inicial = nome?.trim()?.charAt(0)?.toUpperCase() || "?";

    return (
      <View style={[styles.avatar, tamanho === "grande" && styles.avatarGrande]}>
        <Text style={[styles.avatarText, tamanho === "grande" && styles.avatarTextGrande]}>
          {inicial}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Espaço Familiar</Text>
          <Text style={styles.pageSub}>Compartilhe sua jornada com quem você ama.</Text>
        </View>

        {carregando ? (
          <ActivityIndicator color={C.accent} size="small" style={styles.loading} />
        ) : familiares.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={34} color={C.accent} />
            </View>
            <Text style={styles.emptyTitle}>Nenhum familiar vinculado</Text>
            <Text style={styles.emptySub}>
              Adicione um familiar ou cuidador para acompanhar sua evolução.
            </Text>
            <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={adicionarFamiliar}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Adicionar familiar ou cuidador</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="people" size={22} color={C.accent} />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryNumber}>
                  {familiares.filter((f) => f.status === "ativo").length}
                </Text>
                <Text style={styles.summaryText}>
                  {familiares.filter((f) => f.status === "ativo").length === 1
                    ? "pessoa acompanhando sua evolução"
                    : "pessoas acompanhando sua evolução"}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quem te acompanha</Text>

              {familiares.map((familiar) => (
                <TouchableOpacity
                  key={familiar.id}
                  style={styles.personCard}
                  activeOpacity={0.75}
                  onPress={() => {
                    if (familiar.status === "ativo") {
                      abrirFamiliar(familiar);
                    }
                  }}
                >
                  {renderAvatar(familiar.nome, "grande")}

                  <View style={styles.personInfo}>
                    <Text style={styles.personName}>{familiar.nome}</Text>
                    <Text style={styles.personRelation}>{familiar.relacao}</Text>

                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          familiar.status === "ativo"
                            ? styles.statusAtivo
                            : familiar.status === "pendente"
                            ? styles.statusPendente
                            : styles.statusRecusado,
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          familiar.status === "ativo"
                            ? styles.statusTextAtivo
                            : familiar.status === "pendente"
                            ? styles.statusTextPendente
                            : styles.statusTextRecusado,
                        ]}
                      >
                        {familiar.status === "ativo"
                          ? "Ativo"
                          : familiar.status === "pendente"
                          ? "Convite pendente"
                          : "Convite recusado"}
                      </Text>
                    </View>
                  </View>

                  {familiar.status === "ativo" ? (
                    <Ionicons name="chevron-forward" size={20} color={C.muted} />
                  ) : familiar.status === "pendente" ? (
                    <View style={styles.inviteActions}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        activeOpacity={0.8}
                        onPress={() => responderConvite(familiar, "aceito")}
                      >
                        <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                        <Text style={styles.acceptButtonText}>Aceitar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectButton}
                        activeOpacity={0.8}
                        onPress={() => responderConvite(familiar, "recusado")}
                      >
                        <Ionicons name="close" size={17} color={C.red} />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.addAnotherButton} activeOpacity={0.8} onPress={adicionarFamiliar}>
              <View style={styles.addAnotherIcon}>
                <Ionicons name="add" size={22} color={C.accent} />
              </View>
              <View style={styles.addAnotherContent}>
                <Text style={styles.addAnotherTitle}>Adicionar familiar ou cuidador</Text>
                <Text style={styles.addAnotherSub}>
                  Convide outra pessoa para acompanhar sua evolução.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.muted} />
            </TouchableOpacity>

            <View style={styles.privacyCard}>
              <View style={styles.privacyIcon}>
                <Ionicons name="shield-checkmark-outline" size={21} color={C.green} />
              </View>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>Você controla o que pode ser compartilhado.</Text>
                <Text style={styles.privacyText}>
                  As permissões de cada familiar podem ser alteradas a qualquer momento.
                </Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontFamily: A, fontWeight: "800", fontSize: 26, color: C.text, marginBottom: 5 },
  pageSub: { fontFamily: A, fontSize: 13, color: C.muted, lineHeight: 19 },
  loading: { marginTop: 50 },

  emptyCard: {
    backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border,
    padding: 28, alignItems: "center",
  },
  emptyIcon: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(124,92,255,0.12)",
    alignItems: "center", justifyContent: "center", marginBottom: 18,
  },
  emptyTitle: {
    fontFamily: A, fontWeight: "700", fontSize: 17, color: C.text,
    marginBottom: 8, textAlign: "center",
  },
  emptySub: {
    fontFamily: A, fontSize: 13, color: C.muted, lineHeight: 19,
    textAlign: "center", maxWidth: 300,
  },
  addButton: {
    width: "100%", backgroundColor: C.accent, borderRadius: 14, minHeight: 50,
    paddingHorizontal: 18, marginTop: 22, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 7,
  },
  addButtonText: { fontFamily: A, fontWeight: "700", fontSize: 14, color: "#FFFFFF" },

  summaryCard: {
    backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border,
    padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 22,
  },
  summaryIcon: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(124,92,255,0.12)",
    alignItems: "center", justifyContent: "center", marginRight: 13,
  },
  summaryContent: { flex: 1 },
  summaryNumber: { fontFamily: A, fontWeight: "800", fontSize: 21, color: C.text },
  summaryText: { fontFamily: A, fontSize: 12, color: C.muted, marginTop: 2 },

  section: { marginBottom: 18 },
  sectionTitle: { fontFamily: A, fontWeight: "700", fontSize: 14, color: C.text, marginBottom: 9 },
  personCard: {
    backgroundColor: C.surface, borderRadius: 17, borderWidth: 1, borderColor: C.border,
    padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 9,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: C.accent,
    alignItems: "center", justifyContent: "center",
  },
  avatarGrande: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { fontFamily: A, fontWeight: "800", fontSize: 15, color: "#FFFFFF" },
  avatarTextGrande: { fontSize: 19 },
  personInfo: { flex: 1, marginLeft: 13 },
  personName: { fontFamily: A, fontWeight: "700", fontSize: 15, color: C.text },
  personRelation: { fontFamily: A, fontSize: 12, color: C.muted, marginTop: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  statusAtivo: { backgroundColor: C.green },
  statusPendente: { backgroundColor: C.yellow },
  statusRecusado: { backgroundColor: C.red },
  statusText: { fontFamily: A, fontSize: 11, fontWeight: "600" },
  statusTextAtivo: { color: C.green },
  statusTextPendente: { color: C.yellow },
  statusTextRecusado: { color: C.red },

  inviteActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginLeft: 8,
  },

  acceptButton: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: C.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  acceptButtonText: {
    fontFamily: A,
    fontWeight: "700",
    fontSize: 11,
    color: "#FFFFFF",
  },

  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,107,107,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  addAnotherButton: {
    backgroundColor: "rgba(124,92,255,0.08)", borderRadius: 17, borderWidth: 1,
    borderColor: "rgba(124,92,255,0.28)", padding: 14, flexDirection: "row",
    alignItems: "center", marginBottom: 14,
  },
  addAnotherIcon: {
    width: 44, height: 44, borderRadius: 13, backgroundColor: "rgba(124,92,255,0.13)",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  addAnotherContent: { flex: 1 },
  addAnotherTitle: { fontFamily: A, fontWeight: "700", fontSize: 13, color: C.text },
  addAnotherSub: { fontFamily: A, fontSize: 11, color: C.muted, lineHeight: 16, marginTop: 3 },

  privacyCard: {
    backgroundColor: "rgba(79,209,165,0.06)", borderRadius: 16, borderWidth: 1,
    borderColor: "rgba(79,209,165,0.15)", padding: 14, flexDirection: "row",
    alignItems: "flex-start",
  },
  privacyIcon: { marginRight: 10, marginTop: 1 },
  privacyContent: { flex: 1 },
  privacyTitle: { fontFamily: A, fontWeight: "700", fontSize: 12, color: C.text, lineHeight: 17 },
  privacyText: { fontFamily: A, fontSize: 11, color: C.muted, lineHeight: 17, marginTop: 3 },
});
