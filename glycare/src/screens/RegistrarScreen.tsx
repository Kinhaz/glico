import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Animated, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, TouchableWithoutFeedback, View, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const MOODS = [
  { id: 'muito-mal', emoji: '😞', color: '#FF6B6B' },
  { id: 'mal',       emoji: '😕', color: '#FF9F6B' },
  { id: 'neutro',    emoji: '😐', color: '#FFD66B' },
  { id: 'bem',       emoji: '🙂', color: '#8FE08A' },
  { id: 'muito-bem', emoji: '😄', color: '#4FD1A5' },
];

type GlicemiaStatus = 'baixo' | 'normal' | 'alto';

function getStatus(value: number): GlicemiaStatus {
  if (value < 70)  return 'baixo';
  if (value > 180) return 'alto';
  return 'normal';
}

const STATUS_META: Record<GlicemiaStatus, { label: string; color: string; soft: string }> = {
  baixo:  { label: 'Baixo',  color: '#FF6B6B', soft: 'rgba(255,107,107,0.14)' },
  normal: { label: 'Normal', color: '#34D6B4', soft: 'rgba(52,214,180,0.14)'  },
  alto:   { label: 'Alto',   color: '#FF9F6B', soft: 'rgba(255,159,107,0.14)' },
};

const RING_SIZE = 190;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_MIN = 40;
const RING_MAX = 300;

type StatKey = 'refeicoes' | 'exercicios' | 'agua';

interface StatItem {
  key: StatKey;
  label: string;
  done: number;
  total: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  unit?: string;
}

export default function RegistrarScreen({ navigation }: { navigation?: any }) {
  const [glicemia,      setGlicemia]      = useState(98);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [inputText,     setInputText]     = useState('');
  const [selectedMood,  setSelectedMood]  = useState<string | null>(null);
  const [salvando,      setSalvando]      = useState(false);
  const [stats, setStats] = useState<StatItem[]>([
    { key: 'refeicoes',  label: 'Refeições',  done: 0, total: 5, icon: 'restaurant-outline', color: '#34D6B4' },
    { key: 'exercicios', label: 'Exercícios', done: 0, total: 2, icon: 'walk-outline',        color: '#9F8FFF' },
    { key: 'agua',       label: 'Água',       done: 0, total: 8, icon: 'water-outline',       color: '#7EC8E3', unit: 'copos' },
  ]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const userId   = useRef<string | null>(null);

  // ── Busca dados do dia do Supabase ──────────────────────────────────────
  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId.current = user.id;

      const hoje = new Date();
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();

      // Última leitura de glicemia
      const { data: ultLeitura } = await supabase
        .from('leituras_glicemia')
        .select('valor')
        .eq('user_id', user.id)
        .order('medido_em', { ascending: false })
        .limit(1)
        .single();

      if (ultLeitura) {
        setGlicemia(ultLeitura.valor);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      }

      // Registros do dia
      const { data: registros } = await supabase
        .from('registros_diarios')
        .select('tipo, dados')
        .eq('user_id', user.id)
        .gte('registrado_em', inicio);

      if (registros) {
        const refeicoes  = registros.filter(r => r.tipo === 'alimentacao').length;
        const exercicios = registros.filter(r => r.tipo === 'atividade').length;
        const agua       = registros.filter(r => r.tipo === 'agua').length;
        const humor      = registros.find(r => r.tipo === 'humor');

        setStats(prev => prev.map(s => {
          if (s.key === 'refeicoes')  return { ...s, done: refeicoes };
          if (s.key === 'exercicios') return { ...s, done: exercicios };
          if (s.key === 'agua')       return { ...s, done: agua };
          return s;
        }));

        if (humor?.dados?.humor) setSelectedMood(humor.dados.humor);
      }
    }
    carregar();
  }, []);

  // ── Salva glicemia ───────────────────────────────────────────────────────
  const handleConfirmarGlicemia = async () => {
    const val = parseInt(inputText, 10);
    if (isNaN(val) || val < 20 || val > 600) {
      Alert.alert('Valor inválido', 'Digite um valor entre 20 e 600 mg/dL.');
      return;
    }
    setSalvando(true);
    try {
      if (userId.current) {
        await supabase.from('leituras_glicemia').insert({
          user_id:   userId.current,
          valor:     val,
          medido_em: new Date().toISOString(),
        });
      }
      setGlicemia(val);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar a leitura.');
    } finally {
      setSalvando(false);
      setModalVisible(false);
      setInputText('');
    }
  };

  // ── Incrementa stat (refeição / exercício / água) ───────────────────────
  const handleIncrementStat = async (key: StatKey) => {
    if (!userId.current) return;
    const tipoMap: Record<StatKey, string> = {
      refeicoes: 'alimentacao', exercicios: 'atividade', agua: 'agua',
    };
    try {
      await supabase.from('registros_diarios').insert({
        user_id: userId.current,
        tipo:    tipoMap[key],
        dados:   { data: new Date().toISOString() },
      });
      setStats(prev => prev.map(s => {
        if (s.key === key && s.done < s.total) return { ...s, done: s.done + 1 };
        return s;
      }));
    } catch (err) {
      console.error('Erro ao registrar:', err);
    }
  };

  // ── Salva humor ──────────────────────────────────────────────────────────
  const handleMoodSelect = async (moodId: string) => {
    setSelectedMood(moodId);
    if (!userId.current) return;
    try {
      await supabase.from('registros_diarios').insert({
        user_id: userId.current,
        tipo:    'humor',
        dados:   { humor: moodId, data: new Date().toISOString() },
      });
    } catch (err) {
      console.error('Erro ao salvar humor:', err);
    }
  };

  const status   = getStatus(glicemia);
  const meta     = STATUS_META[status];
  const progress = Math.min(Math.max((glicemia - RING_MIN) / (RING_MAX - RING_MIN), 0), 1);
  const offset   = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#181545', '#100E33', '#0B0A24']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity hitSlop={10} onPress={() => navigation?.openDrawer?.()}>
            <Ionicons name="menu" size={26} color="#F5F3FF" />
          </TouchableOpacity>
          <Text style={styles.brand}>GlyCare</Text>
          <View style={{ width: 38 }} />
        </View>

        <Text style={styles.pageTitle}>Registrar</Text>
        <Text style={styles.pageSub}>Acompanhe sua saúde durante o dia</Text>

        {/* Card glicemia */}
        <View style={styles.glicemiaCard}>
          <View style={styles.glicemiaCardHeader}>
            <Text style={styles.glicemiaCardTitle}>Glicemia</Text>
            <View style={[styles.statusPill, { backgroundColor: meta.soft }]}>
              <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>

          <View style={styles.glicemiaBody}>
            {/* Gauge ring */}
            <View style={styles.ringWrap}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_RADIUS} stroke="rgba(255,255,255,0.07)" strokeWidth={RING_STROKE} fill="none" />
                <Circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RING_RADIUS} stroke={meta.color} strokeWidth={RING_STROKE}
                  strokeLinecap="round" fill="none"
                  strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                  strokeDashoffset={offset} rotation={-90} origin={`${RING_SIZE/2}, ${RING_SIZE/2}`} />
              </Svg>
              <Animated.View style={[styles.ringLabel, { opacity: fadeAnim }]}>
                <Text style={[styles.ringValue, { color: meta.color }]}>{glicemia}</Text>
                <Text style={styles.ringUnit}>mg/dL</Text>
              </Animated.View>
            </View>

            {/* Botão inserir */}
            <TouchableOpacity style={styles.insertBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
              <View style={styles.insertIcon}>
                <Ionicons name="create-outline" size={18} color="#F5F3FF" />
              </View>
              <View>
                <Text style={styles.insertTitle}>Inserir manualmente</Text>
                <Text style={styles.insertSub}>Digitar valor</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats do dia */}
        <View style={styles.statsRow}>
          {stats.map((s) => {
            const pct = s.total > 0 ? s.done / s.total : 0;
            return (
              <TouchableOpacity
                key={s.key} style={styles.statCard} activeOpacity={0.8}
                onPress={() => handleIncrementStat(s.key)}
              >
                <Ionicons name={s.icon} size={20} color={s.color} />
                <Text style={[styles.statValue, { color: s.color }]}>
                  {s.done}/{s.total}
                </Text>
                <Text style={styles.statLabel}>{s.unit ?? s.label}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: s.color }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Humor */}
        <View style={styles.moodCard}>
          <Text style={styles.moodTitle}>Como você está se sentindo hoje?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => {
              const sel = selectedMood === m.id;
              return (
                <TouchableOpacity key={m.id} onPress={() => handleMoodSelect(m.id)} activeOpacity={0.8}
                  style={[styles.moodBtn, sel && { backgroundColor: `${m.color}26`, borderColor: m.color }]}>
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal inserir glicemia */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Inserir glicemia</Text>
                  <Text style={styles.modalSub}>Digite o valor em mg/dL</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={inputText}
                    onChangeText={setInputText}
                    keyboardType="numeric"
                    placeholder="Ex: 120"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    autoFocus
                    maxLength={3}
                  />
                  <TouchableOpacity
                    style={[styles.modalBtn, salvando && { opacity: 0.6 }]}
                    onPress={handleConfirmarGlicemia}
                    disabled={salvando}
                  >
                    <Text style={styles.modalBtnText}>Confirmar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={{ alignItems: 'center', marginTop: 12 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#0B0A24' },
  scrollContent:   { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  brand:           { fontSize: 16, fontWeight: '700', color: '#F5F3FF', letterSpacing: 0.5 },
  pageTitle:       { fontSize: 26, fontWeight: '800', color: '#F5F3FF', marginBottom: 4 },
  pageSub:         { fontSize: 14, color: '#A5A3C7', marginBottom: 20 },
  glicemiaCard:    { backgroundColor: '#13122E', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20, marginBottom: 16 },
  glicemiaCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  glicemiaCardTitle:  { fontSize: 16, fontWeight: '700', color: '#F5F3FF' },
  statusPill:      { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 6 },
  statusDot:       { width: 7, height: 7, borderRadius: 3.5 },
  statusText:      { fontSize: 12, fontWeight: '600' },
  glicemiaBody:    { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ringWrap:        { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringLabel:       { position: 'absolute', alignItems: 'center' },
  ringValue:       { fontSize: 38, fontWeight: '800' },
  ringUnit:        { fontSize: 13, color: '#A5A3C7', marginTop: -4 },
  insertBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16, gap: 14 },
  insertIcon:      { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  insertTitle:     { fontSize: 14, fontWeight: '600', color: '#F5F3FF', marginBottom: 2 },
  insertSub:       { fontSize: 12, color: '#A5A3C7' },
  statsRow:        { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard:        { flex: 1, backgroundColor: '#13122E', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 14, gap: 4 },
  statValue:       { fontSize: 20, fontWeight: '800' },
  statLabel:       { fontSize: 11, color: '#A5A3C7' },
  progressTrack:   { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  progressFill:    { height: '100%', borderRadius: 2 },
  moodCard:        { backgroundColor: '#13122E', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20 },
  moodTitle:       { fontSize: 15, fontWeight: '600', color: '#F5F3FF', marginBottom: 16 },
  moodRow:         { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn:         { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.05)' },
  moodEmoji:       { fontSize: 24 },
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalCard:       { backgroundColor: '#1C1A50', borderRadius: 24, padding: 28, width: 300, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle:      { fontSize: 18, fontWeight: '700', color: '#F5F3FF', marginBottom: 6 },
  modalSub:        { fontSize: 13, color: '#A5A3C7', marginBottom: 20 },
  modalInput:      { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, height: 56, paddingHorizontal: 16, fontSize: 24, fontWeight: '700', color: '#F5F3FF', textAlign: 'center', marginBottom: 16 },
  modalBtn:        { backgroundColor: '#7C5CFF', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalBtnText:    { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
