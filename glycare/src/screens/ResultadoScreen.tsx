import React, { useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { useFonts, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import { DMSans_400Regular, DMSans_500Medium } from "@expo-google-fonts/dm-sans";
import { supabase } from "../lib/supabase";

const COLORS = {
  bg: "#1B1B45", card: "#26265C", cardBorder: "#3A3A78",
  accent: "#4DDFD8", textPrimary: "#FFFFFF", textSec: "#B7B7DA",
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Resultado">;
  route: RouteProp<RootStackParamList, "Resultado">;
};

function buildRecomendacoes(r: Record<string, string>) {
  const recs: { title: string; description: string }[] = [];

  switch (r.tipo_diabetes) {
    case "Tipo 1":               recs.push({ title: "Monitoramento intensivo",    description: "Lembretes de medição e contagem de carboidratos para ajustar a insulina." }); break;
    case "Tipo 2":               recs.push({ title: "Controle de rotina",          description: "Foco em alimentação, exercícios e lembretes de medicação." }); break;
    case "Diabetes gestacional": recs.push({ title: "Acompanhamento da gestação", description: "Metas de glicemia e alimentação para essa fase." }); break;
    default:                     recs.push({ title: "Conteúdo educativo",          description: "Conteúdos educativos e lembretes para exames de acompanhamento." });
  }
  switch (r.desafio_principal) {
    case "Controlar a alimentação":   recs.push({ title: "Diário alimentar",      description: "Registre refeições e receba sugestões saudáveis." }); break;
    case "Manter a glicemia estável": recs.push({ title: "Gráficos de glicemia", description: "Evolução da glicemia com alertas fora da faixa ideal." }); break;
    case "Fazer exercícios":          recs.push({ title: "Treinos adaptados",     description: "Atividades físicas seguras para quem tem diabetes." }); break;
    case "Lembrar dos remédios":      recs.push({ title: "Alarmes de medicação", description: "Notificações no horário certo para cada remédio." }); break;
  }
  if (r.frequencia_medicao === "Raramente ou nunca")
    recs.push({ title: "Lembretes de glicemia", description: "Lembretes para criar o hábito de medir." });
  if (r.alimentacao === "Preciso melhorar bastante" || r.alimentacao === "Não sei avaliar")
    recs.push({ title: "Cardápios para diabetes", description: "Cardápios simples para o controle glicêmico." });
  if (r.atividade_fisica === "Raramente" || r.atividade_fisica === "Nunca")
    recs.push({ title: "Metas de movimento", description: "Metas pequenas de caminhada, aumentando aos poucos." });
  if (r.dificuldade_lembrar === "Sim, frequentemente" || r.dificuldade_lembrar === "Às vezes")
    recs.push({ title: "Checklist de medicação", description: "Lembretes recorrentes e checklist diário." });
  if (r.sono === "Durmo mal às vezes" || r.sono === "Durmo mal com frequência")
    recs.push({ title: "Melhore seu sono", description: "Como o sono afeta a glicemia e hábitos para dormir melhor." });
  if (r.notificacoes && r.notificacoes !== "Prefiro não receber")
    recs.push({ title: "Notificações personalizadas", description: "Você vai receber lembretes no horário mais adequado." });
  switch (r.objetivo) {
    case "Estabilizar minha glicemia":   recs.push({ title: "Painel de glicemia",      description: "Mostra o quão estável está sua glicemia na semana." }); break;
    case "Perder peso":                  recs.push({ title: "Acompanhamento de peso",  description: "Cruza peso, alimentação e atividade para emagrecer com segurança." }); break;
    case "Ter mais controle na rotina":  recs.push({ title: "Rotina organizada",       description: "Agenda com medição, remédios, refeições e exercícios." }); break;
    case "Aprender mais sobre diabetes": recs.push({ title: "Trilha de aprendizado",   description: "Conteúdos curtos e confiáveis sobre a sua condição." }); break;
  }
  return recs;
}

export default function ResultadoScreen({ navigation, route }: Props) {
  const { respostas, dadosCadastro } = route.params;
  const [salvando, setSalvando]      = useState(false);
  const recomendacoes                = buildRecomendacoes(respostas);

  const [fontsLoaded] = useFonts({ Fraunces_700Bold, DMSans_400Regular, DMSans_500Medium });
  if (!fontsLoaded) return null;

  const handleComecar = async () => {
    setSalvando(true);
    try {
      // 1. Cria conta no Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email:   dadosCadastro.email,
        password: dadosCadastro.senha,
        options: { data: { nome_completo: dadosCadastro.nome, data_nascimento: dadosCadastro.dataNasc } },
      });
      if (signUpError) { Alert.alert("Erro ao criar conta", signUpError.message); return; }

      const userId = data.user?.id;
      if (!userId) { Alert.alert("Erro", "Não foi possível obter o ID do usuário."); return; }

      if (!data.session) {
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: dadosCadastro.email, password: dadosCadastro.senha,
        });
        if (loginErr) {
          Alert.alert("Cadastro criado!", "Confirme seu e-mail para ativar a conta.",
            [{ text: "OK", onPress: () => navigation.navigate("Login") }]);
          return;
        }
      }

      // 2. Salva perfil — inclui gênero e tipo sanguíneo do questionário
      await supabase.from("perfis").insert({
        id:              userId,
        nome_completo:   dadosCadastro.nome,
        email:           dadosCadastro.email,
        data_nascimento: dadosCadastro.dataNasc,
        genero:          respostas.genero ?? null,
        tipo_sanguineo:  respostas.tipo_sanguineo ?? null,
      });

      // 3. Salva todas as respostas do questionário (incluindo genero e tipo_sanguineo)
      await supabase.from("questionarios").insert({
        user_id:    userId,
        respostas:  respostas,
        created_at: new Date().toISOString(),
      });

      // 4. Vai para o app
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });

    } catch (err) {
      Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{respostas.tipo_diabetes || "Diabetes"}</Text>
        <Text style={styles.title}>Suas recomendações personalizadas</Text>
        <Text style={styles.subtitle}>Com base nas suas respostas, preparamos estas recomendações para o seu dia a dia.</Text>
        {recomendacoes.map((rec, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardTitle}>{rec.title}</Text>
            <Text style={styles.cardDesc}>{rec.description}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.primaryBtn, salvando && { opacity: 0.7 }]} onPress={handleComecar} disabled={salvando}>
          {salvando ? <ActivityIndicator color={COLORS.bg} /> : <Text style={styles.primaryBtnText}>Começar a usar o app</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("Questionario", { dadosCadastro })} disabled={salvando}>
          <Text style={styles.secondaryBtnText}>Refazer questionário</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.bg },
  content:          { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 },
  eyebrow:          { fontFamily: "DMSans_500Medium", color: COLORS.accent, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  title:            { fontFamily: "Fraunces_700Bold", color: COLORS.textPrimary, fontSize: 26, lineHeight: 33, marginBottom: 10 },
  subtitle:         { fontFamily: "DMSans_400Regular", color: COLORS.textSec, fontSize: 14, lineHeight: 20, marginBottom: 28 },
  card:             { backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 18, marginBottom: 14 },
  cardTitle:        { fontFamily: "DMSans_500Medium", color: COLORS.textPrimary, fontSize: 16, marginBottom: 6 },
  cardDesc:         { fontFamily: "DMSans_400Regular", color: COLORS.textSec, fontSize: 13, lineHeight: 19 },
  footer:           { paddingHorizontal: 24, paddingVertical: 18 },
  primaryBtn:       { backgroundColor: COLORS.accent, borderRadius: 18, paddingVertical: 16, alignItems: "center", marginBottom: 10 },
  primaryBtnText:   { fontFamily: "DMSans_500Medium", color: COLORS.bg, fontSize: 15 },
  secondaryBtn:     { alignItems: "center", paddingVertical: 10 },
  secondaryBtnText: { fontFamily: "DMSans_500Medium", color: COLORS.textSec, fontSize: 13 },
});
