import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { DMSans_400Regular, DMSans_500Medium } from "@expo-google-fonts/dm-sans";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { supabase } from "../lib/supabase";

const COLORS = {
  bg:          "#1E1B4B",
  input:       "#2D2A6E",
  inputBorder: "#3D3A7E",
  inputText:   "#FFFFFF",
  placeholder: "#6B68A8",
  label:       "#C4C2E8",
  btnBg:       "#312E81",
  btnText:     "#FFFFFF",
  backArrow:   "#C4C2E8",
  white:       "#FFFFFF",
};

const LOGO_URL = "https://snipboard.io/dGebyq.jpg";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Cadastrar">;
};

// Formata automaticamente a data enquanto o usuário digita: 01021990 → 01/02/1990
function formatarData(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 8);
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 4) return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
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

  const handleCadastrar = async () => {
    // ── Validações ──────────────────────────────────────────────
    if (!nome || !email || !senha || !confirmarSenha || !dataNasc) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não coincidem.");
      return;
    }
    if (senha.length < 6) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (dataNasc.length !== 10) {
      Alert.alert("Atenção", "Data de nascimento inválida. Use DD/MM/AAAA.");
      return;
    }

    setLoading(true);

    try {
      // ── 1. Cria o usuário no Supabase Auth ───────────────────
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: {
          data: {
            nome_completo:   nome,
            data_nascimento: dataNasc,
          },
        },
      });

      if (signUpError) {
        Alert.alert("Erro ao cadastrar", signUpError.message);
        return;
      }

      // ── 2. Pega o ID do usuário recém-criado ─────────────────
      // data.user existe mesmo quando "Confirm email" está ativo.
      // data.session só existe quando a confirmação está desativada.
      const userId = data.user?.id;

      if (!userId) {
        // Isso acontece se o e-mail já estiver cadastrado e não confirmado.
        Alert.alert(
          "Atenção",
          "Não foi possível obter o ID do usuário. Verifique se o e-mail já está cadastrado ou confirme seu e-mail."
        );
        return;
      }

      // ── 3. Insere o perfil na tabela "perfis" ────────────────
      // Se "Confirm email" estiver ATIVO no Supabase, ainda não há sessão
      // neste momento, então auth.uid() = null e a RLS bloquearia o insert.
      // A solução é usar signInWithPassword logo após o signUp para criar
      // a sessão antes de inserir — OU desativar "Confirm email" no painel.
      //
      // Se você desativou "Confirm email": data.session já existe → insert funciona.
      // Se ainda está ativo: faça login imediato abaixo para obter sessão.

      if (!data.session) {
        // "Confirm email" está ativo — tenta logar para obter sessão
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });

        if (loginError) {
          // Usuário criado mas sem sessão — avisa para confirmar e-mail
          Alert.alert(
            "Cadastro criado!",
            "Confirme seu e-mail para ativar a conta e depois faça login.",
            [{ text: "OK", onPress: () => navigation.navigate("Login") }]
          );
          return;
        }
      }

      // Neste ponto temos sessão garantida → RLS permite o insert
      const { error: insertError } = await supabase.from("perfis").insert({
        id:              userId,
        nome_completo:   nome,
        email:           email.trim(),
        data_nascimento: dataNasc,  // salvo como text conforme sua tabela
      });

      if (insertError) {
        console.error("Erro ao salvar perfil:", insertError);
        Alert.alert(
          "Erro ao salvar perfil",
          `${insertError.message}\n\nCódigo: ${insertError.code}`
        );
        return;
      }

      // ── 4. Sucesso ───────────────────────────────────────────
      Alert.alert(
        "Cadastro realizado!",
        "Bem-vindo ao GlyCare.",
        [{ text: "OK", onPress: () => navigation.reset({ index: 0, routes: [{ name: "MainApp" }] }) }]
      );
    } catch (err) {
      console.error("Erro inesperado no cadastro:", err);
      Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.backArrow} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.form}>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Nome completo</Text>
              <TextInput style={styles.input} value={nome} onChangeText={setNome}
                placeholder="" placeholderTextColor={COLORS.placeholder} autoCapitalize="words" />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail}
                placeholder="" placeholderTextColor={COLORS.placeholder}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputRow}>
                <TextInput style={[styles.input, { flex: 1, borderWidth: 0 }]} value={senha}
                  onChangeText={setSenha} placeholder="" placeholderTextColor={COLORS.placeholder}
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
                  onChangeText={setConfirmarSenha} placeholder="" placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!confirmarVisible} autoCapitalize="none" />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setConfirmarVisible(!confirmarVisible)}>
                  <Ionicons name={confirmarVisible ? "eye-outline" : "eye-off-outline"} size={18} color={COLORS.placeholder} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Data de Nascimento</Text>
              <TextInput
                style={styles.input}
                value={dataNasc}
                onChangeText={(v) => setDataNasc(formatarData(v))}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

          </View>

          <TouchableOpacity
            style={[styles.cadastrarBtn, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleCadastrar}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.cadastrarBtnText}>Cadastrar</Text>
            }
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
  scroll:           { flexGrow: 1, justifyContent: "center", paddingBottom: 32, gap: 28 },
  logoWrap:         { alignItems: "center" },
  logo:             { width: 140, height: 60 },
  form:             { gap: 18 },
  fieldWrap:        { gap: 8 },
  label:            { fontFamily: "DMSans_500Medium", fontSize: 13, color: COLORS.label, letterSpacing: 0.2, textAlign: "center" },
  input:            { backgroundColor: COLORS.input, borderRadius: 12, borderWidth: 1, borderColor: COLORS.inputBorder, height: 46, paddingHorizontal: 16, fontFamily: "DMSans_400Regular", fontSize: 14, color: COLORS.inputText },
  inputRow:         { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.input, borderRadius: 12, borderWidth: 1, borderColor: COLORS.inputBorder, height: 46, paddingRight: 12 },
  eyeBtn:           { padding: 4 },
  cadastrarBtn:     { backgroundColor: COLORS.btnBg, borderRadius: 14, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  cadastrarBtnText: { fontFamily: "DMSans_500Medium", fontSize: 16, color: COLORS.btnText, letterSpacing: 0.3 },
  loginLink:        { alignItems: "center", paddingTop: 4 },
  loginLinkText:    { fontFamily: "DMSans_400Regular", fontSize: 13, color: COLORS.label },
  loginLinkBold:    { fontFamily: "DMSans_500Medium", color: "#A5B4FC" },
});
