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
  navigation: NativeStackNavigationProp<RootStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail]               = useState("");
  const [senha, setSenha]               = useState("");
  const [senhaVisible, setSenhaVisible] = useState(false);
  const [loading, setLoading]           = useState(false);

  const [fontsLoaded] = useFonts({ Fraunces_700Bold, DMSans_400Regular, DMSans_500Medium });
  if (!fontsLoaded) return null;

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Atenção", "Preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        // Mensagens de erro específicas e em português
        if (error.message.includes("Invalid login credentials")) {
          Alert.alert("Erro ao entrar", "E-mail ou senha incorretos.");
        } else if (error.message.includes("Email not confirmed")) {
          Alert.alert(
            "E-mail não confirmado",
            "Verifique sua caixa de entrada e confirme o e-mail antes de entrar."
          );
        } else if (error.message.includes("Too many requests")) {
          Alert.alert("Muitas tentativas", "Aguarde alguns minutos antes de tentar novamente.");
        } else {
          Alert.alert("Erro ao entrar", error.message);
        }
        return;
      }

      if (!data.session) {
        Alert.alert("Atenção", "Não foi possível iniciar sessão. Tente novamente.");
        return;
      }

      // Login ok — reseta a navegação e vai direto para o app
      navigation.reset({
        index: 0,
        routes: [{ name: "MainApp" }],
      });
    } catch (err) {
      console.error("Erro inesperado no login:", err);
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
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder=""
                placeholderTextColor={COLORS.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={senha}
                  onChangeText={setSenha}
                  placeholder=""
                  placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!senhaVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setSenhaVisible(!senhaVisible)}>
                  <Ionicons
                    name={senhaVisible ? "eye-outline" : "eye-off-outline"}
                    size={18}
                    color={COLORS.placeholder}
                  />
                </TouchableOpacity>
              </View>
            </View>

          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Entrar</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cadastroLink} onPress={() => navigation.navigate("Cadastrar")}>
            <Text style={styles.cadastroLinkText}>
              Não tem conta? <Text style={styles.cadastroLinkBold}>Cadastrar</Text>
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
  scroll:           { flexGrow: 1, justifyContent: "center", paddingBottom: 32, gap: 32 },
  logoWrap:         { alignItems: "center" },
  logo:             { width: 140, height: 60 },
  form:             { gap: 20 },
  fieldWrap:        { gap: 8 },
  label:            { fontFamily: "DMSans_500Medium", fontSize: 13, color: COLORS.label, letterSpacing: 0.2, textAlign: "center" },
  input:            { backgroundColor: COLORS.input, borderRadius: 12, borderWidth: 1, borderColor: COLORS.inputBorder, height: 46, paddingHorizontal: 16, fontFamily: "DMSans_400Regular", fontSize: 14, color: COLORS.inputText },
  inputRow:         { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.input, borderRadius: 12, borderWidth: 1, borderColor: COLORS.inputBorder, height: 46, paddingRight: 12 },
  eyeBtn:           { padding: 4 },
  loginBtn:         { backgroundColor: COLORS.btnBg, borderRadius: 14, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  loginBtnText:     { fontFamily: "DMSans_500Medium", fontSize: 16, color: COLORS.btnText, letterSpacing: 0.3 },
  cadastroLink:     { alignItems: "center", paddingTop: 4 },
  cadastroLinkText: { fontFamily: "DMSans_400Regular", fontSize: 13, color: COLORS.label },
  cadastroLinkBold: { fontFamily: "DMSans_500Medium", color: "#A5B4FC" },
});
