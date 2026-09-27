import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { criarConvite } from "../services/convitesService";

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

type PermissaoKey =
  | "glicemia"
  | "historico"
  | "graficos"
  | "alimentacao"
  | "atividade"
  | "medicamentos"
  | "alertas"
  | "relatorios";

interface Permissao {
  key: PermissaoKey;
  titulo: string;
  descricao: string;
  icone: keyof typeof Ionicons.glyphMap;
}

const PERMISSOES: Permissao[] = [
  {
    key: "glicemia",
    titulo: "Ver glicemia",
    descricao: "Permite visualizar suas medições de glicose.",
    icone: "water-outline",
  },
  {
    key: "historico",
    titulo: "Ver histórico",
    descricao: "Permite visualizar o histórico das suas medições.",
    icone: "time-outline",
  },
  {
    key: "graficos",
    titulo: "Ver gráficos",
    descricao: "Permite visualizar gráficos da sua evolução.",
    icone: "stats-chart-outline",
  },
  {
    key: "alimentacao",
    titulo: "Ver alimentação",
    descricao: "Permite visualizar seus registros de alimentação.",
    icone: "restaurant-outline",
  },
  {
    key: "atividade",
    titulo: "Ver atividade física",
    descricao: "Permite visualizar seus registros de atividade.",
    icone: "walk-outline",
  },
  {
    key: "medicamentos",
    titulo: "Ver medicamentos",
    descricao: "Permite visualizar seus medicamentos e registros.",
    icone: "medkit-outline",
  },
  {
    key: "alertas",
    titulo: "Receber alertas",
    descricao: "Permite receber alertas relacionados à sua saúde.",
    icone: "notifications-outline",
  },
  {
    key: "relatorios",
    titulo: "Receber relatórios",
    descricao: "Permite receber seus relatórios periódicos.",
    icone: "document-text-outline",
  },
];

const RELACOES = [
  "Mãe",
  "Pai",
  "Filho(a)",
  "Irmão/Irmã",
  "Cônjuge",
  "Avô/Avó",
  "Tio/Tia",
  "Cuidador(a)",
  "Outro",
];

export default function AdicionarFamiliarScreen({ navigation }: any) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [relacao, setRelacao] = useState("");
  const [mostrarRelacoes, setMostrarRelacoes] = useState(false);

  const [permissoes, setPermissoes] = useState<
    Record<PermissaoKey, boolean>
  >({
    glicemia: true,
    historico: true,
    graficos: true,
    alimentacao: false,
    atividade: false,
    medicamentos: false,
    alertas: false,
    relatorios: false,
  });

  const [enviando, setEnviando] = useState(false);

  function alternarPermissao(key: PermissaoKey) {
    setPermissoes((atual) => ({
      ...atual,
      [key]: !atual[key],
    }));
  }

  async function enviarConvite() {
    if (!nome.trim() || !email.trim() || !relacao) {
      return;
    }

    try {
      setEnviando(true);

      const convite = await criarConvite({
        pacienteId: "paciente-demo",
        nome: nome.trim(),
        email: email.trim(),
        relacao,
        permissoes,
      });

      console.log("Convite criado:", convite);

      navigation?.navigate("ConviteEnviado", {
        nome: convite.nome,
        email: convite.email,
        relacao: convite.relacao,
        permissoes: convite.permissoes,
        conviteId: convite.id,
      });
    } catch (error) {
      console.error("Erro ao criar convite:", error);
    } finally {
      setEnviando(false);
    }
  }

  const formularioValido =
    nome.trim().length > 0 &&
    email.trim().length > 0 &&
    relacao.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={C.text}
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>Adicionar familiar</Text>
            <Text style={styles.subtitle}>
              Escolha quem poderá acompanhar sua jornada.
            </Text>
          </View>
        </View>

        {/* DADOS DO FAMILIAR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do familiar</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Nome</Text>

            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Nome completo"
              placeholderTextColor={C.muted}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Relação</Text>

            <TouchableOpacity
              style={styles.select}
              onPress={() => setMostrarRelacoes(!mostrarRelacoes)}
            >
              <Text
                style={[
                  styles.selectText,
                  !relacao && styles.placeholder,
                ]}
              >
                {relacao || "Selecione a relação"}
              </Text>

              <Ionicons
                name={
                  mostrarRelacoes
                    ? "chevron-up"
                    : "chevron-down"
                }
                size={20}
                color={C.muted}
              />
            </TouchableOpacity>

            {mostrarRelacoes && (
              <View style={styles.options}>
                {RELACOES.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.option}
                    onPress={() => {
                      setRelacao(item);
                      setMostrarRelacoes(false);
                    }}
                  >
                    <Text style={styles.optionText}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemplo.com"
              placeholderTextColor={C.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={styles.helper}>
              O convite será enviado para este endereço.
            </Text>
          </View>
        </View>

        {/* PERMISSÕES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            O que essa pessoa poderá acessar?
          </Text>

          <Text style={styles.sectionDescription}>
            Você controla exatamente quais informações poderão
            ser compartilhadas.
          </Text>

          <View style={styles.permissions}>
            {PERMISSOES.map((permissao) => {
              const ativa = permissoes[permissao.key];

              return (
                <TouchableOpacity
                  key={permissao.key}
                  style={[
                    styles.permissionCard,
                    ativa && styles.permissionCardActive,
                  ]}
                  onPress={() =>
                    alternarPermissao(permissao.key)
                  }
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.permissionIcon,
                      ativa &&
                        styles.permissionIconActive,
                    ]}
                  >
                    <Ionicons
                      name={permissao.icone}
                      size={21}
                      color={ativa ? C.accent : C.muted}
                    />
                  </View>

                  <View style={styles.permissionContent}>
                    <Text style={styles.permissionTitle}>
                      {permissao.titulo}
                    </Text>

                    <Text style={styles.permissionDescription}>
                      {permissao.descricao}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      ativa && styles.checkboxActive,
                    ]}
                  >
                    {ativa && (
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* PRIVACIDADE */}
        <View style={styles.privacyCard}>
          <View style={styles.privacyIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color={C.green}
            />
          </View>

          <View style={styles.privacyContent}>
            <Text style={styles.privacyTitle}>
              Você está no controle
            </Text>

            <Text style={styles.privacyText}>
              As permissões podem ser alteradas ou removidas
              a qualquer momento pelo Espaço Familiar.
            </Text>
          </View>
        </View>

        {/* BOTÃO */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            !formularioValido && styles.sendButtonDisabled,
          ]}
          disabled={!formularioValido || enviando}
          onPress={enviarConvite}
          activeOpacity={0.85}
        >
          <Ionicons
            name="paper-plane-outline"
            size={19}
            color="#FFFFFF"
          />

          <Text style={styles.sendButtonText}>
            {enviando ? "Enviando..." : "Enviar convite"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  headerText: {
    flex: 1,
  },

  title: {
    color: C.text,
    fontSize: 25,
    fontWeight: "800",
  },

  subtitle: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },

  section: {
    marginBottom: 28,
  },

  sectionTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 7,
  },

  sectionDescription: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 15,
  },

  field: {
    marginTop: 17,
  },

  label: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },

  input: {
    height: 52,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    color: C.text,
    fontSize: 15,
  },

  helper: {
    color: C.muted,
    fontSize: 12,
    marginTop: 7,
  },

  select: {
    minHeight: 52,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectText: {
    color: C.text,
    fontSize: 15,
  },

  placeholder: {
    color: C.muted,
  },

  options: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 6,
    overflow: "hidden",
  },

  option: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  optionText: {
    color: C.text,
    fontSize: 14,
  },

  permissions: {
    gap: 10,
  },

  permissionCard: {
    minHeight: 76,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  permissionCardActive: {
    borderColor: "rgba(124,92,255,0.45)",
  },

  permissionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  permissionIconActive: {
    backgroundColor: "rgba(124,92,255,0.15)",
  },

  permissionContent: {
    flex: 1,
    paddingRight: 10,
  },

  permissionTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
  },

  permissionDescription: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },

  privacyCard: {
    flexDirection: "row",
    backgroundColor: "rgba(79,209,165,0.07)",
    borderWidth: 1,
    borderColor: "rgba(79,209,165,0.18)",
    borderRadius: 16,
    padding: 15,
    marginBottom: 22,
  },

  privacyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(79,209,165,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  privacyContent: {
    flex: 1,
  },

  privacyTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },

  privacyText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  sendButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: C.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  sendButtonDisabled: {
    opacity: 0.4,
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});