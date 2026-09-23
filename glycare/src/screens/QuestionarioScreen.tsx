import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";

const A = "Arial"; // fonte padrão

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${Math.round(progress * 100)}%` }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 6, backgroundColor: "#2D2A6E", borderRadius: 3, overflow: "hidden" },
  fill:  { height: "100%", backgroundColor: "#A5B4FC", borderRadius: 3 },
});

function OptionButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[ob.btn, selected && ob.btnSelected]}>
      <Text style={[ob.text, selected && ob.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}
const ob = StyleSheet.create({
  btn:          { borderWidth: 1.5, borderColor: "#3A3A78", borderRadius: 14, padding: 16, marginBottom: 12 },
  btnSelected:  { borderColor: "#A5B4FC", backgroundColor: "rgba(165,180,252,0.12)" },
  text:         { fontFamily: A, fontSize: 15, color: "#B7B7DA" },
  textSelected: { fontFamily: A, fontWeight: "600", color: "#FFFFFF" },
});

// =========================================
// PERGUNTAS
// =========================================
const PERGUNTAS = [
  { key: "tipo_diabetes",       question: "Qual tipo de diabetes você tem?",                           options: ["Tipo 1", "Tipo 2", "Diabetes gestacional", "Pré-diabetes ou não sei"] },
  { key: "desafio_principal",   question: "Qual é o seu principal desafio no controle do diabetes?",  options: ["Controlar a alimentação", "Manter a glicemia estável", "Fazer exercícios", "Lembrar dos remédios"] },
  { key: "frequencia_medicao",  question: "Com que frequência você mede sua glicemia?",                options: ["Várias vezes ao dia", "Uma vez ao dia", "Algumas vezes por semana", "Raramente ou nunca"] },
  { key: "medicacao",           question: "Você toma algum medicamento para o diabetes?",              options: ["Insulina", "Comprimidos", "Insulina e comprimidos", "Nenhum"] },
  { key: "alimentacao",         question: "Como você descreveria sua alimentação atual?",               options: ["Saudável e balanceada", "Preciso melhorar bastante", "Sigo uma dieta específica", "Não sei avaliar"] },
  { key: "atividade_fisica",    question: "Com que frequência você pratica atividades físicas?",        options: ["Diariamente", "Algumas vezes por semana", "Raramente", "Nunca"] },
  { key: "dificuldade_lembrar", question: "Você tem dificuldade para lembrar de tomar remédios?",      options: ["Sim, frequentemente", "Às vezes", "Raramente", "Não uso medicação"] },
  { key: "sono",                question: "Como está a qualidade do seu sono?",                        options: ["Durmo bem", "Durmo mal às vezes", "Durmo mal com frequência", "Não sei avaliar"] },
  { key: "notificacoes",        question: "Você gostaria de receber lembretes do aplicativo?",         options: ["Sim, lembretes de glicemia", "Sim, lembretes de remédios", "Sim, ambos", "Prefiro não receber"] },
  { key: "objetivo",            question: "Qual é o seu maior objetivo com o aplicativo?",             options: ["Estabilizar minha glicemia", "Perder peso", "Ter mais controle na rotina", "Aprender mais sobre diabetes"] },
  // ← "Não binário" removido; adicionado "Prefiro não identificar"
  { key: "genero",              question: "Qual é o seu gênero?",                                      options: ["Masculino", "Feminino", "Prefiro não identificar"] },
  { key: "tipo_sanguineo",      question: "Qual é o seu tipo sanguíneo?",                              options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Não sei"] },
];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Questionario">;
  route: RouteProp<RootStackParamList, "Questionario">;
};

export default function QuestionarioScreen({ navigation, route }: Props) {
  const { dadosCadastro } = route.params;
  const [index, setIndex] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});

  const pergunta = PERGUNTAS[index];
  const total    = PERGUNTAS.length;

  const handleSelect = (opcao: string) => {
    const novas = { ...respostas, [pergunta.key]: opcao };
    setRespostas(novas);
    if (index === total - 1) {
      navigation.navigate("Resultado", { respostas: novas, dadosCadastro });
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (index === 0 ? navigation.goBack() : setIndex(index - 1))}
          style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <Text style={styles.progressLabel}>{`Pergunta ${index + 1} de ${total}`}</Text>
          <ProgressBar progress={(index + 1) / total} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>{pergunta.question}</Text>
        <View style={styles.options}>
          {pergunta.options.map((op) => (
            <OptionButton key={op} label={op} selected={respostas[pergunta.key] === op} onPress={() => handleSelect(op)} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: "#1B1B45" },
  header:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn:       { marginRight: 16, paddingVertical: 4 },
  backArrow:     { color: "#FFFFFF", fontSize: 22, fontFamily: A },
  progressWrap:  { flex: 1 },
  progressLabel: { fontFamily: A, color: "#B7B7DA", fontSize: 12, marginBottom: 8 },
  content:       { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 },
  question:      { fontFamily: A, fontWeight: "700", color: "#FFFFFF", fontSize: 24, lineHeight: 32, marginBottom: 32 },
  options:       { width: "100%" },
});