import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const C = {
  bg: "#0B0A24",
  surface: "#13122E",
  border: "rgba(255,255,255,0.08)",
  accent: "#7C5CFF",
  green: "#4FD1A5",
  text: "#F5F3FF",
  muted: "#A5A3C7",
};

export default function ConviteEnviadoScreen({ navigation, route }: any) {
  const {
    nome,
    email,
  } = route?.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <View style={styles.iconContainer}>
          <Ionicons
            name="checkmark"
            size={42}
            color={C.green}
          />
        </View>

        <Text style={styles.title}>
          Convite enviado!
        </Text>

        <Text style={styles.description}>
          O convite foi criado com sucesso e está aguardando a resposta do
          familiar.
        </Text>

        <View style={styles.emailCard}>
          <View style={styles.emailIcon}>
            <Ionicons
              name="mail-outline"
              size={22}
              color={C.accent}
            />
          </View>

          <View style={styles.emailContent}>
            <Text style={styles.emailLabel}>
              Convite enviado para
            </Text>

            <Text style={styles.email}>
              {email || "E-mail não informado"}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color={C.muted}
          />

          <Text style={styles.infoText}>
            {nome || "Seu familiar"} vai aceitar ou recusar pelo link no e-mail
            e, ao aceitar, verá no navegador apenas o que você permitiu.
            O status é atualizado no Espaço Familiar.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation?.navigate("Home", { screen: "EspacoFamiliar" })}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            Voltar ao Espaço Familiar
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(79,209,165,0.12)",
    borderWidth: 1,
    borderColor: "rgba(79,209,165,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  title: {
    color: C.text,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },

  description: {
    color: C.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 350,
    marginBottom: 28,
  },

  emailCard: {
    width: "100%",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  emailIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(124,92,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  emailContent: {
    flex: 1,
  },

  emailLabel: {
    color: C.muted,
    fontSize: 12,
    marginBottom: 4,
  },

  email: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
  },

  infoCard: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 15,
    marginBottom: 28,
  },

  infoText: {
    flex: 1,
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  button: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});