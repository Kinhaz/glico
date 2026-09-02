import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, Alert, Image, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { DMSans_400Regular, DMSans_500Medium } from "@expo-google-fonts/dm-sans";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { supabase } from "../lib/supabase";

const COLORS = {
  bg: "#1E1B4B", input: "#2D2A6E", inputBorder: "#3D3A7E",
  inputText: "#FFFFFF", placeholder: "#6B68A8", label: "#C4C2E8",
  btnBg: "#312E81", btnText: "#FFFFFF", backArrow: "#C4C2E8",
  link: "#A5B4FC",
};

const LOGO_URL = "https://snipboard.io/dkoPZi.jpg";

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, "Cadastrar"> };

function formatarData(valor: string): string {
  const n = valor.replace(/\D/g, "").slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function CadastrarScreen({ navigation }: Props) {
  const [nome, setNome]                         = useState("");
  const [email, setEmail]                       = useState("");
  const [senha, setSenha]                       = useState("");
  const [confirmarSenha, setConfirmarSenha]     = useState("");
  const [dataNasc, setDataNasc]                 = useState("");
  const [senhaVisible, setSenhaVisible]         = useState(false);
  const [confirmarVisible, setConfirmarVisible] = useState(false);
  const [loading, setLoading]                   = useState(false);

  const [fontsLoaded] = useFonts({ Fraunces_700Bold, DMSans_400Regular, DMSans_500Medium });
  if (!fontsLoaded) return null;

  // ── Validações e verificação de e-mail duplicado ──────────────────────
  const handleCadastrar = async () => {
    if (!nome || !email || !senha || !confirmarSenha || !dataNasc) {
      Alert.alert("Atenção", "Preencha todos os campos."); return;
    }
    if (!isValidEmail(email)) {
      Alert.alert("Atenção", "Digite um e-mail válido."); return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não coincidem."); return;
    }
    if (senha.length < 6) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres."); return;
    }
    if (dataNasc.length !== 10) {
      Alert.alert("Atenção", "Data de nascimento inválida. Use DD/MM/AAAA."); return;
    }

    setLoading(true);

    try {
      // Verifica se o e-mail já existe na tabela de perfis
      const { data: perfilExistente } = await supabase
        .from("perfis")
        .select("id")
        .eq("email", email.trim())
        .maybeSingle();

      if (perfilExistente) {
        Alert.alert(
          "E-mail já cadastrado",
          "Este e-mail já possui uma conta. Faça login ou use outro e-mail.",
          [{ text: "Fazer login", onPress: () => navigation.navigate("Login") }, { text: "Cancelar" }]
        );
        return;
      }

      // Dados do cadastro passados para o Questionário
      // O usuário SÓ é criado no Supabase após responder o questionário
      navigation.navigate("Questionario", {
        dadosCadastro: { nome, email: email.trim(), senha, dataNasc },
      });

    } catch (err) {
      Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === "ios" ? "padding" : "height"}>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.backArrow} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={styles.logoWrap}>
            <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Nome completo</Text>
              <TextInput style={styles.input} value={nome} onChangeText={setNome}
                placeholderTextColor={COLORS.placeholder} autoCapitalize="words" />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail}
                placeholderTextColor={COLORS.placeholder} keyboardType="email-address"
                autoCapitalize="none" autoCorrect={false} />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputRow}>
                <TextInput style={[styles.input, { flex: 1, borderWidth: 0 }]} value={senha}
                  onChangeText={setSenha} placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!senhaVisible} autoCapitalize="none" />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setSenhaVisible(!senhaVisible)}>
                  <Ionicons name={senhaVisible ? "eye-outline" : "eye-off-outline"} size={18} color={COLORS.placeholder} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Confirmar senha</Text>
              <View style={styles.inputRow}>
                <TextInput style={[styles.input, { flex: 1, borderWidth: 0 }]} value={confirmarSenha}
                  onChangeText={setConfirmarSenha} placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!confirmarVisible} autoCapitalize="none" />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setConfirmarVisible(!confirmarVisible)}>
                  <Ionicons name={confirmarVisible ? "eye-outline" : "eye-off-outline"} size={18} color={COLORS.placeholder} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Data de Nascimento</Text>
              <TextInput style={styles.input} value={dataNasc}
                onChangeText={(v) => setDataNasc(formatarData(v))}
                placeholder="DD/MM/AAAA" placeholderTextColor={COLORS.placeholder}
                keyboardType="numeric" maxLength={10} />
            </View>
          </View>

          {/* Continua para o Questionário */}
          <TouchableOpacity
            style={[styles.cadastrarBtn, loading && { opacity: 0.7 }]}
            activeOpacity={0.85} onPress={handleCadastrar} disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.cadastrarBtnText}>Cadastrar</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLinkText}>
              Já tem conta? <Text style={styles.loginLinkBold}>Entrar</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.bg },
  inner:            { flex: 1, paddingHorizontal: 28 },
  backBtn:          { paddingVertical: 12, alignSelf: "flex-start" },
  scroll:           { flexGrow: 1, justifyContent: "center", paddingBottom: 32, gap: 24 },
  logoWrap:         { alignItems: "center" },
  logo:             { width: 120, height: 60 },
  form:             { gap: 16 },
  fieldWrap:        { gap: 6 },
  label:            { fontFamily: "DMSans_500Medium", fontSize: 13, color: COLORS.label, textAlign: "center" },
  input:            { backgroundColor: COLORS.input, borderRadius: 12, borderWidth: 1, borderColor: COLORS.inputBorder, height: 46, paddingHorizontal: 16, fontFamily: "DMSans_400Regular", fontSize: 14, color: COLORS.inputText },
  inputRow:         { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.input, borderRadius: 12, borderWidth: 1, borderColor: COLORS.inputBorder, height: 46, paddingRight: 12 },
  eyeBtn:           { padding: 4 },
  cadastrarBtn:     { backgroundColor: COLORS.btnBg, borderRadius: 14, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  cadastrarBtnText: { fontFamily: "DMSans_500Medium", fontSize: 16, color: COLORS.btnText, letterSpacing: 0.3 },
  loginLink:        { alignItems: "center" },
  loginLinkText:    { fontFamily: "DMSans_400Regular", fontSize: 13, color: COLORS.label },
  loginLinkBold:    { fontFamily: "DMSans_500Medium", color: COLORS.link },
});
