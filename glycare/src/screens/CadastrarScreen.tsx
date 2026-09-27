import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { supabase } from "../lib/supabase";

const A = "Arial";
const C = { bg:"#0B0A24", surface:"#13122E", border:"rgba(255,255,255,0.08)", accent:"#7C5CFF", text:"#F5F3FF", muted:"#A5A3C7" };

type Props = { navigation: NativeStackNavigationProp<RootStackParamList,"Cadastrar"> };

export default function CadastrarScreen({ navigation }: Props) {
  const [nome,     setNome]     = useState("");
  const [email,    setEmail]    = useState("");
  const [senha,    setSenha]    = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleProximo = async () => {
    if (!nome || !email || !senha || !dataNasc) { Alert.alert("Atenção","Preencha todos os campos."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { Alert.alert("E-mail inválido","Digite um e-mail válido."); return; }
    if (senha.length < 6) { Alert.alert("Senha curta","A senha deve ter ao menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const { data: existe } = await supabase.from("perfis").select("id").eq("email", email.trim()).maybeSingle();
      if (existe) { Alert.alert("E-mail já cadastrado","Use outro e-mail ou faça login."); return; }
      navigation.navigate("Questionario", { dadosCadastro: { nome: nome.trim(), email: email.trim(), senha, dataNasc } });
    } catch { Alert.alert("Erro","Não foi possível verificar o e-mail."); }
    finally { setLoading(false); }
  };

  const formatData = (v: string) => {
    const d = v.replace(/\D/g,"");
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
    return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4,8)}`;
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <Text style={s.title}>Criar{"\n"}conta</Text>
          <Text style={s.sub}>Preencha seus dados para começar</Text>

          {[
            { label:"Nome completo", value:nome, set:setNome, placeholder:"Seu nome", cap:"words" as const, key:"default" },
            { label:"E-mail", value:email, set:setEmail, placeholder:"seu@email.com", cap:"none" as const, key:"email-address" },
            { label:"Senha", value:senha, set:setSenha, placeholder:"Mínimo 6 caracteres", cap:"none" as const, key:"default", secure:true },
          ].map(f => (
            <View key={f.label} style={s.fieldWrap}>
              <Text style={s.label}>{f.label}</Text>
              <TextInput style={s.input} value={f.value} onChangeText={f.set}
                placeholder={f.placeholder} placeholderTextColor={C.muted}
                keyboardType={f.key as any} autoCapitalize={f.cap}
                secureTextEntry={f.secure} autoCorrect={false} />
            </View>
          ))}

          <View style={s.fieldWrap}>
            <Text style={s.label}>Data de nascimento</Text>
            <TextInput style={s.input} value={dataNasc} onChangeText={v => setDataNasc(formatData(v))}
              placeholder="DD/MM/AAAA" placeholderTextColor={C.muted} keyboardType="numeric" maxLength={10} />
          </View>

          <TouchableOpacity style={[s.primaryBtn, loading && { opacity:0.6 }]} onPress={handleProximo} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.primaryBtnText}>Continuar</Text>}
          </TouchableOpacity>

          <View style={s.footerRow}>
            <Text style={s.footerText}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={s.footerLink}>Entrar</Text>
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
  primaryBtn:     { backgroundColor:C.accent, borderRadius:16, paddingVertical:16, alignItems:"center", marginTop:8, marginBottom:24 },
  primaryBtnText: { fontFamily:A, fontWeight:"700", fontSize:16, color:"#FFF" },
  footerRow:      { flexDirection:"row", justifyContent:"center" },
  footerText:     { fontFamily:A, fontSize:14, color:C.muted },
  footerLink:     { fontFamily:A, fontSize:14, color:C.accent, fontWeight:"600" },
});