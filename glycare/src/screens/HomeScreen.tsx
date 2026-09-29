import React, { useRef, useState, useEffect } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { verificarEAtualizarStreak } from '../lib/dailyReset';

const A = "Arial";
const C = { bg:"#0B0A24", surface:"#13122E", border:"rgba(255,255,255,0.08)", accent:"#7C5CFF", text:"#F5F3FF", muted:"#A5A3C7", pink:"#FF7597", yellow:"#FFD66B", green:"#4FD1A5" };

const QUICK_ACTIONS = [
  { id:'receitas',   label:'Receitas',   icon:'restaurant-outline' as const, tint:'#FFB86B', soft:'rgba(255,184,107,0.14)' },
  { id:'exercicios', label:'Exercícios', icon:'walk-outline'        as const, tint:'#34D6B4', soft:'rgba(52,214,180,0.14)'  },
  { id:'saude',      label:'Saúde',      icon:'water-outline'       as const, tint:'#FF7597', soft:'rgba(255,117,151,0.14)' },
  { id:'analise',    label:'Análise',    icon:'bar-chart-outline'   as const, tint:'#9F8FFF', soft:'rgba(159,143,255,0.16)' },
];
const ROUTES: Record<string,string> = { receitas:'Receitas', exercicios:'Exercicios', saude:'Saude', analise:'Analise' };
const MOODS = [
  { id:'muito-mal', emoji:'😞', color:'#FF6B6B' }, { id:'mal',  emoji:'😕', color:'#FF9F6B' },
  { id:'neutro',    emoji:'😐', color:'#FFD66B' }, { id:'bem',  emoji:'🙂', color:'#8FE08A' },
  { id:'muito-bem', emoji:'😄', color:'#4FD1A5' },
];
const RING=120, RSTROKE=10, RRAD=(RING-RSTROKE)/2, RCIRC=2*Math.PI*RRAD;
const { width } = Dimensions.get('window');
const PAD=20, CARD_W=(width-PAD*2-12)/2;

export default function HomeScreen({ navigation }: { navigation?: any }) {
  const [mood,       setMood]       = useState<string|null>(null);
  const [nome,       setNome]       = useState('');
  const [streak,     setStreak]     = useState(0);
  const [carregando, setCarregando] = useState(true);
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function carregar() {
      try {
        const novoStreak = await verificarEAtualizarStreak();
        setStreak(novoStreak);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: perfil } = await supabase.from('perfis').select('nome_completo').eq('id', user.id).single();
        if (perfil?.nome_completo) setNome(perfil.nome_completo.split(' ')[0]);
        const hoje = new Date();
        const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
        const { data: humor } = await supabase.from('registros_diarios')
          .select('dados').eq('user_id', user.id).eq('tipo', 'humor')
          .gte('registrado_em', inicioDia).order('registrado_em', { ascending: false }).limit(1).single();
        if (humor?.dados?.humor) setMood(humor.dados.humor);
      } catch (e) { console.error('Home:', e); }
      finally { setCarregando(false); }
    }
    carregar();
  }, []);

  const handleMood = async (id: string) => {
    setMood(id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('registros_diarios').insert({ user_id: user.id, tipo: 'humor', dados: { humor: id, data: new Date().toISOString() } });
    } catch {}
  };

  const progress = Math.min(streak / 30, 1);
  const offset   = RCIRC * (1 - progress);
  const daysLeft = Math.max(30 - streak, 0);
  const onIn  = () => Animated.spring(pressAnim, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const onOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, speed: 40 }).start();

  if (carregando) return (
    <View style={{ flex:1, backgroundColor:C.bg, alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator color={C.accent} />
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header fixo com menu + brand + sino */}
        <View style={s.header}>
          <TouchableOpacity style={s.headerBtn} onPress={() => navigation?.openDrawer?.()}>
            <Ionicons name="menu" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.brand}>GlyCare</Text>
          <TouchableOpacity style={s.headerBtn}>
            <Ionicons name="notifications-outline" size={22} color={C.text} />
            <View style={s.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Saudação */}
        <Text style={s.greeting}>Olá, {nome || 'Usuário'} 👋</Text>
        <Text style={s.greetSub}>Vamos cuidar da sua saúde hoje</Text>

        {/* Card sequência */}
        <View style={s.heroCard}>
          <View style={s.ringWrap}>
            <Svg width={RING} height={RING}>
              <Circle cx={RING/2} cy={RING/2} r={RRAD} stroke={C.border} strokeWidth={RSTROKE} fill="none" />
              <Circle cx={RING/2} cy={RING/2} r={RRAD} stroke="#FF8A65" strokeWidth={RSTROKE}
                strokeLinecap="round" fill="none"
                strokeDasharray={`${RCIRC} ${RCIRC}`} strokeDashoffset={offset}
                rotation={-90} origin={`${RING/2}, ${RING/2}`} />
            </Svg>
            <View style={s.ringLabel}>
              <Text style={s.ringNum}>{streak}</Text>
              <Text style={s.ringCap}>dias</Text>
            </View>
          </View>
          <View style={s.heroText}>
            <Text style={s.heroEye}>SEQUÊNCIA DE AUTOCUIDADO</Text>
            <Text style={s.heroTitle}>Você está indo bem!</Text>
            <Text style={s.heroSub}>{daysLeft > 0 ? `Faltam ${daysLeft} dias para fechar o mês em cheio` : 'Você completou o mês!'}</Text>
            <Animated.View style={{ transform:[{ scale: pressAnim }], alignSelf:'flex-start' }}>
              <TouchableOpacity activeOpacity={0.9} onPressIn={onIn} onPressOut={onOut}
                onPress={() => navigation?.getParent()?.navigate('Registrar')} style={s.regBtn}>
                <Ionicons name="add-circle" size={16} color={C.bg} style={{ marginRight:6 }} />
                <Text style={s.regBtnText}>Registrar hoje</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Ações rápidas */}
        <Text style={s.sectionLbl}>AÇÕES RÁPIDAS</Text>
        <View style={s.grid}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity key={a.id} style={s.actionCard} activeOpacity={0.85}
              onPress={() => { const r = ROUTES[a.id]; if (r) navigation?.getParent()?.navigate(r); }}>
              <View style={[s.actionIcon, { backgroundColor: a.soft }]}>
                <Ionicons name={a.icon} size={22} color={a.tint} />
              </View>
              <Text style={s.actionLbl}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Humor */}
        <Text style={s.sectionLbl}>COMO VOCÊ ESTÁ SE SENTINDO?</Text>
        <View style={s.moodCard}>
          <Text style={s.moodQ}>Registre seu humor de hoje</Text>
          <View style={s.moodRow}>
            {MOODS.map(m => {
              const sel = mood === m.id;
              return (
                <TouchableOpacity key={m.id} onPress={() => handleMood(m.id)} activeOpacity={0.8}
                  style={[s.moodBtn, sel && { backgroundColor:`${m.color}26`, borderColor:m.color }]}>
                  <Text style={{ fontSize:22 }}>{m.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dica */}
        <View style={s.tipCard}>
          <View style={s.tipIcon}><Ionicons name="bulb-outline" size={18} color={C.yellow} /></View>
          <View style={{ flex:1 }}>
            <Text style={s.tipTitle}>Dica do dia</Text>
            <Text style={s.tipText}>Beber água antes das refeições ajuda a manter a glicemia mais estável ao longo do dia.</Text>
          </View>
        </View>
        <View style={{ height:32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex:1, backgroundColor:C.bg },
  scroll:     { paddingHorizontal:PAD, paddingTop:8 },
  header:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20, paddingVertical:4 },
  headerBtn:  { width:38, height:38, borderRadius:12, backgroundColor:C.surface, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:C.border },
  brand:      { fontFamily:A, fontWeight:'700', fontSize:17, color:C.text },
  bellDot:    { position:'absolute', top:6, right:6, width:7, height:7, borderRadius:3.5, backgroundColor:C.pink, borderWidth:1.5, borderColor:C.bg },
  greeting:   { fontFamily:A, fontWeight:'800', fontSize:24, color:C.text, marginBottom:4 },
  greetSub:   { fontFamily:A, fontSize:14, color:C.muted, marginBottom:20 },
  heroCard:   { backgroundColor:C.surface, borderRadius:20, borderWidth:1, borderColor:C.border, padding:20, flexDirection:'row', alignItems:'center', gap:16, marginBottom:28 },
  ringWrap:   { width:RING, height:RING, alignItems:'center', justifyContent:'center' },
  ringLabel:  { position:'absolute', alignItems:'center' },
  ringNum:    { fontFamily:A, fontWeight:'800', fontSize:28, color:C.text },
  ringCap:    { fontFamily:A, fontSize:12, color:C.muted },
  heroText:   { flex:1 },
  heroEye:    { fontFamily:A, fontWeight:'700', fontSize:10, color:C.accent, letterSpacing:0.8, marginBottom:6 },
  heroTitle:  { fontFamily:A, fontWeight:'700', fontSize:16, color:C.text, marginBottom:4 },
  heroSub:    { fontFamily:A, fontSize:12, color:C.muted, lineHeight:17, marginBottom:12 },
  regBtn:     { flexDirection:'row', alignItems:'center', backgroundColor:C.text, borderRadius:12, paddingVertical:9, paddingHorizontal:14 },
  regBtnText: { fontFamily:A, fontWeight:'700', fontSize:13, color:C.bg },
  sectionLbl: { fontFamily:A, fontWeight:'700', fontSize:11, color:C.muted, letterSpacing:0.9, marginBottom:12 },
  grid:       { flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', marginBottom:28 },
  actionCard: { width:CARD_W, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:18, padding:16, marginBottom:12 },
  actionIcon: { width:42, height:42, borderRadius:13, alignItems:'center', justifyContent:'center', marginBottom:12 },
  actionLbl:  { fontFamily:A, fontWeight:'600', fontSize:14, color:C.text },
  moodCard:   { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:20, padding:18, marginBottom:16 },
  moodQ:      { fontFamily:A, fontWeight:'600', fontSize:14, color:C.text, marginBottom:14 },
  moodRow:    { flexDirection:'row', justifyContent:'space-between' },
  moodBtn:    { width:46, height:46, borderRadius:23, alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:'transparent', backgroundColor:'rgba(255,255,255,0.05)' },
  tipCard:    { flexDirection:'row', backgroundColor:'rgba(255,214,107,0.08)', borderWidth:1, borderColor:'rgba(255,214,107,0.18)', borderRadius:16, padding:14 },
  tipIcon:    { width:34, height:34, borderRadius:10, backgroundColor:'rgba(255,214,107,0.15)', alignItems:'center', justifyContent:'center', marginRight:12 },
  tipTitle:   { fontFamily:A, fontWeight:'700', fontSize:13, color:C.text, marginBottom:3 },
  tipText:    { fontFamily:A, fontSize:12, color:C.muted, lineHeight:17 },
});