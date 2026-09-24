import React, { useRef, useState, useEffect } from 'react';
import {
  Dimensions, ScrollView, StyleSheet, Animated,
  Text, TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';

// ── Paleta unificada com ConfiguracoesScreen ──
const C = {
  bg:      "#0B0A24",
  surface: "#13122E",
  border:  "rgba(255,255,255,0.08)",
  accent:  "#7C5CFF",
  text:    "#F5F3FF",
  muted:   "#A5A3C7",
  orange:  "#FF9F6B",
  green:   "#4FD1A5",
  pink:    "#FF7597",
  yellow:  "#FFD66B",
};
const A = "Arial";

const QUICK_ACTIONS = [
  { id: 'receitas',   label: 'Receitas',   icon: 'restaurant-outline' as const, tint: '#FFB86B', tintSoft: 'rgba(255,184,107,0.14)' },
  { id: 'exercicios', label: 'Exercícios', icon: 'walk-outline'       as const, tint: '#34D6B4', tintSoft: 'rgba(52,214,180,0.14)'  },
  { id: 'saude',      label: 'Saúde',      icon: 'water-outline'      as const, tint: '#FF7597', tintSoft: 'rgba(255,117,151,0.14)' },
  { id: 'analise',    label: 'Análise',    icon: 'bar-chart-outline'  as const, tint: '#9F8FFF', tintSoft: 'rgba(159,143,255,0.16)' },
];
const QUICK_ACTION_ROUTES: Record<string, string> = {
  receitas: 'Receitas', exercicios: 'Exercicios', saude: 'Saude', analise: 'Analise',
};
const MOODS = [
  { id: 'muito-mal', emoji: '😞', color: '#FF6B6B' },
  { id: 'mal',       emoji: '😕', color: '#FF9F6B' },
  { id: 'neutro',    emoji: '😐', color: '#FFD66B' },
  { id: 'bem',       emoji: '🙂', color: '#8FE08A' },
  { id: 'muito-bem', emoji: '😄', color: '#4FD1A5' },
];

const RING_SIZE = 120;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const { width } = Dimensions.get('window');
const PAD = 20;
const CARD_W = (width - PAD * 2 - 12) / 2;

export default function HomeScreen({ navigation }: { navigation?: any }) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [primeiroNome, setPrimeiroNome] = useState('');
  const [dayStreak,    setDayStreak]    = useState(0);
  const [carregando,   setCarregando]   = useState(true);
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function carregar() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: perfil } = await supabase.from('perfis').select('nome_completo').eq('id', user.id).single();
        if (perfil?.nome_completo) setPrimeiroNome(perfil.nome_completo.split(' ')[0]);
        const { data: seq } = await supabase.from('sequencia_autocuidado').select('dias_streak').eq('user_id', user.id).single();
        if (seq) setDayStreak(seq.dias_streak ?? 0);
      } catch (err) {
        console.error('Erro home:', err);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const handleMoodSelect = async (moodId: string) => {
    setSelectedMood(moodId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('registros_diarios').insert({ user_id: user.id, tipo: 'humor', dados: { humor: moodId, data: new Date().toISOString() } });
    } catch (err) { console.error('Erro humor:', err); }
  };

  const handleQuickAction = (actionId: string) => {
    const r = QUICK_ACTION_ROUTES[actionId];
    if (r) navigation?.getParent()?.navigate(r);
  };

  const progress = Math.min(dayStreak / 30, 1);
  const strokeOffset = RING_CIRCUMFERENCE * (1 - progress);
  const daysLeft = Math.max(30 - dayStreak, 0);

  const onPressIn  = () => Animated.spring(pressAnim, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, speed: 40 }).start();

  if (carregando) return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={C.accent} />
    </View>
  );

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header próprio da Home */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.openDrawer?.()}>
            <Ionicons name="menu" size={26} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.brand}>GlyCare</Text>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color={C.text} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Saudação */}
        <Text style={styles.greeting}>Olá, {primeiroNome || 'Usuário'} 👋</Text>
        <Text style={styles.greetingSub}>Vamos cuidar da sua saúde hoje</Text>

        {/* Card sequência */}
        <View style={styles.heroCard}>
          <View style={styles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_RADIUS} stroke={C.border} strokeWidth={RING_STROKE} fill="none" />
              <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_RADIUS} stroke="#FF8A65" strokeWidth={RING_STROKE}
                strokeLinecap="round" fill="none"
                strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                strokeDashoffset={strokeOffset} rotation={-90} origin={`${RING_SIZE/2}, ${RING_SIZE/2}`} />
            </Svg>
            <View style={styles.ringLabel}>
              <Text style={styles.ringDay}>{dayStreak}</Text>
              <Text style={styles.ringCaption}>dias</Text>
            </View>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroEye}>SEQUÊNCIA DE AUTOCUIDADO</Text>
            <Text style={styles.heroTitle}>Você está indo bem!</Text>
            <Text style={styles.heroSub}>{daysLeft > 0 ? `Faltam ${daysLeft} dias para fechar o mês em cheio` : 'Você completou o mês!'}</Text>
            <Animated.View style={{ transform: [{ scale: pressAnim }], alignSelf: 'flex-start' }}>
              <TouchableOpacity activeOpacity={0.9} onPressIn={onPressIn} onPressOut={onPressOut}
                onPress={() => navigation?.getParent()?.navigate('Registrar')}
                style={styles.regBtn}
              >
                <Ionicons name="add-circle" size={16} color={C.bg} style={{ marginRight: 6 }} />
                <Text style={styles.regBtnText}>Registrar hoje</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Ações rápidas */}
        <Text style={styles.sectionLabel}>AÇÕES RÁPIDAS</Text>
        <View style={styles.grid}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity key={a.id} style={styles.actionCard} activeOpacity={0.85} onPress={() => handleQuickAction(a.id)}>
              <View style={[styles.actionIcon, { backgroundColor: a.tintSoft }]}>
                <Ionicons name={a.icon} size={22} color={a.tint} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Humor */}
        <Text style={styles.sectionLabel}>COMO VOCÊ ESTÁ SE SENTINDO?</Text>
        <View style={styles.moodCard}>
          <Text style={styles.moodQ}>Registre seu humor de hoje</Text>
          <View style={styles.moodRow}>
            {MOODS.map(m => {
              const sel = selectedMood === m.id;
              return (
                <TouchableOpacity key={m.id} onPress={() => handleMoodSelect(m.id)} activeOpacity={0.8}
                  style={[styles.moodBtn, sel && { backgroundColor: `${m.color}26`, borderColor: m.color }]}>
                  <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dica */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}><Ionicons name="bulb-outline" size={18} color={C.yellow} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Dica do dia</Text>
            <Text style={styles.tipText}>Beber água antes das refeições ajuda a manter a glicemia mais estável ao longo do dia.</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  scroll:      { paddingHorizontal: PAD, paddingTop: 16, paddingBottom: 32 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  brand:       { fontFamily: A, fontWeight: '700', fontSize: 17, color: C.text },
  bellBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  bellDot:     { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.pink, borderWidth: 1.5, borderColor: C.bg },
  greeting:    { fontFamily: A, fontWeight: '800', fontSize: 24, color: C.text, marginBottom: 4 },
  greetingSub: { fontFamily: A, fontSize: 14, color: C.muted, marginBottom: 20 },
  heroCard:    { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 },
  ringWrap:    { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringLabel:   { position: 'absolute', alignItems: 'center' },
  ringDay:     { fontFamily: A, fontWeight: '800', fontSize: 28, color: C.text },
  ringCaption: { fontFamily: A, fontSize: 12, color: C.muted },
  heroText:    { flex: 1 },
  heroEye:     { fontFamily: A, fontWeight: '700', fontSize: 10, color: C.accent, letterSpacing: 0.8, marginBottom: 6 },
  heroTitle:   { fontFamily: A, fontWeight: '700', fontSize: 16, color: C.text, marginBottom: 4 },
  heroSub:     { fontFamily: A, fontSize: 12, color: C.muted, lineHeight: 17, marginBottom: 12 },
  regBtn:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.text, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 14 },
  regBtnText:  { fontFamily: A, fontWeight: '700', fontSize: 13, color: C.bg },
  sectionLabel:{ fontFamily: A, fontWeight: '700', fontSize: 11, color: C.muted, letterSpacing: 0.9, marginBottom: 12 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 28 },
  actionCard:  { width: CARD_W, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, marginBottom: 12 },
  actionIcon:  { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionLabel: { fontFamily: A, fontWeight: '600', fontSize: 14, color: C.text },
  moodCard:    { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 18, marginBottom: 16 },
  moodQ:       { fontFamily: A, fontWeight: '600', fontSize: 14, color: C.text, marginBottom: 14 },
  moodRow:     { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn:     { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.05)' },
  tipCard:     { flexDirection: 'row', backgroundColor: 'rgba(255,214,107,0.08)', borderWidth: 1, borderColor: 'rgba(255,214,107,0.18)', borderRadius: 16, padding: 14 },
  tipIcon:     { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,214,107,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  tipTitle:    { fontFamily: A, fontWeight: '700', fontSize: 13, color: C.text, marginBottom: 3 },
  tipText:     { fontFamily: A, fontSize: 12, color: C.muted, lineHeight: 17 },
});