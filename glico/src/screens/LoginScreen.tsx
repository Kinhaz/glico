import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { supabase } from "../lib/supabase";

const A = "Arial";
const C = { bg:"#0B0A24", surface:"#13122E", border:"rgba(255,255,255,0.08)", accent:"#7C5CFF", text:"#F5F3FF", muted:"#A5A3C7", red:"#FF6B6B" };

type Props = { navigation: NativeStackNavigationProp<RootStackParamList,"Login"> };

export default function LoginScreen({ navigation }: Props) {
  const [email,    setEmail]    = useState("");
  const [senha,    setSenha]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) { Alert.alert("Atenção", "Preencha e-mail e senha."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
      if (error) { Alert.alert("Erro ao entrar", error.message); return; }
      navigation.reset({ index:0, routes:[{ name:"Home" }] });
    } catch { Alert.alert("Erro", "Não foi possível fazer login."); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <Text style={s.title}>Bem-vindo{"\n"}de volta</Text>
          <Text style={s.sub}>Entre na sua conta para continuar</Text>

          <View style={s.fieldWrap}>
            <Text style={s.label}>E-mail</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail}
              placeholder="seu@email.com" placeholderTextColor={C.muted}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>
          <View style={s.fieldWrap}>
            <Text style={s.label}>Senha</Text>
            <View style={s.passWrap}>
              <TextInput style={[s.input, { flex:1, marginBottom:0 }]} value={senha} onChangeText={setSenha}
                placeholder="••••••••" placeholderTextColor={C.muted}
                secureTextEntry={!showPass} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                <Text style={{ color:C.muted, fontSize:13 }}>{showPass?"Ocultar":"Mostrar"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[s.primaryBtn, loading && { opacity:0.6 }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryBtnText}>Entrar</Text>}
          </TouchableOpacity>

          <View style={s.footerRow}>
            <Text style={s.footerText}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Cadastrar")}>
              <Text style={s.footerLink}>Criar conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex:1, backgroundColor:C.bg },
  container:      { paddingHorizontal:24, paddingTop:20, paddingBottom:40 },
  back:           { marginBottom:32 },
  backText:       { fontFamily:A, fontSize:22, color:C.text },
  title:          { fontFamily:A, fontWeight:"800", fontSize:30, color:C.text, lineHeight:38, marginBottom:8 },
  sub:            { fontFamily:A, fontSize:14, color:C.muted, marginBottom:32 },
  fieldWrap:      { marginBottom:16 },
  label:          { fontFamily:A, fontSize:13, color:C.muted, marginBottom:8 },
  input:          { backgroundColor:C.surface, borderRadius:14, height:50, paddingHorizontal:16, fontFamily:A, fontSize:15, color:C.text, borderWidth:1, borderColor:C.border },
  passWrap:       { flexDirection:"row", alignItems:"center", backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, paddingRight:12 },
  eyeBtn:         { padding:8 },
  primaryBtn:     { backgroundColor:C.accent, borderRadius:16, paddingVertical:16, alignItems:"center", marginTop:8, marginBottom:24 },
  primaryBtnText: { fontFamily:A, fontWeight:"700", fontSize:16, color:"#FFF" },
  footerRow:      { flexDirection:"row", justifyContent:"center" },
  footerText:     { fontFamily:A, fontSize:14, color:C.muted },
  footerLink:     { fontFamily:A, fontSize:14, color:C.accent, fontWeight:"600" },
});