import React, { useRef, useState, useEffect } from 'react';
import {
  Animated, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, TouchableWithoutFeedback, View, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const A = "Arial";
const C = {
  bg: "#0B0A24", surface: "#13122E", border: "rgba(255,255,255,0.08)",
  accent: "#7C5CFF", text: "#F5F3FF", muted: "#A5A3C7",
  green: "#4FD1A5", orange: "#FF9F6B", red: "#FF6B6B",
};

const MOODS = [
  { id: 'muito-mal', emoji: '😞', color: '#FF6B6B' },
  { id: 'mal',       emoji: '😕', color: '#FF9F6B' },
  { id: 'neutro',    emoji: '😐', color: '#FFD66B' },
  { id: 'bem',       emoji: '🙂', color: '#8FE08A' },
  { id: 'muito-bem', emoji: '😄', color: '#4FD1A5' },
];

type GlicStatus = 'baixo' | 'normal' | 'alto';
function getStatus(v: number): GlicStatus {
  if (v < 70)  return 'baixo';
  if (v > 180) return 'alto';
  return 'normal';
}
const STATUS_MAP: Record<GlicStatus, { label: string; color: string; soft: string }> = {
  baixo:  { label: 'Baixo',  color: '#FF6B6B', soft: 'rgba(255,107,107,0.14)' },
  normal: { label: 'Normal', color: '#34D6B4', soft: 'rgba(52,214,180,0.14)'  },
  alto:   { label: 'Alto',   color: '#FF9F6B', soft: 'rgba(255,159,107,0.14)' },
};

const RING = 180;
const RSTROKE = 14;
const RRADIUS = (RING - RSTROKE) / 2;
const RCIRC   = 2 * Math.PI * RRADIUS;

type StatKey = 'refeicoes' | 'exercicios' | 'agua';
interface Stat { key: StatKey; label: string; unit: string; done: number; icon: any; color: string; tipo: string; }

export default function RegistrarScreen({ navigation }: { navigation?: any }) {
  const [glicemia,     setGlicemia]     = useState(0);
  const [modalVis,     setModalVis]     = useState(false);
  const [inputText,    setInputText]    = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [salvando,     setSalvando]     = useState(false);
  const [stats, setStats] = useState<Stat[]>([
    { key: 'refeicoes',  label: 'Refeições',  unit: 'refeições', done: 0, icon: 'restaurant-outline', color: '#34D6B4', tipo: 'alimentacao' },
    { key: 'exercicios', label: 'Exercícios', unit: 'exercícios', done: 0, icon: 'walk-outline',        color: '#9F8FFF', tipo: 'atividade'   },
    { key: 'agua',       label: 'Água',       unit: 'copos',      done: 0, icon: 'water-outline',       color: '#7EC8E3', tipo: 'agua'        },
  ]);

  // Modal de edição manual de stat
  const [editingStat, setEditingStat] = useState<Stat | null>(null);
  const [editValue,   setEditValue]   = useState('');

  const fadeAnim = useRef(new Animated.Value(glicemia > 0 ? 1 : 0)).current;
  const userId   = useRef<string | null>(null);

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId.current = user.id;

      const hoje = new Date();
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();

      const { data: ultGL } = await supabase.from('leituras_glicemia')
        .select('valor').eq('user_id', user.id)
        .order('medido_em', { ascending: false }).limit(1).single();
      if (ultGL) {
        setGlicemia(ultGL.valor);
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      }

      const { data: registros } = await supabase.from('registros_diarios')
        .select('tipo, dados').eq('user_id', user.id).gte('registrado_em', inicio);
      if (registros) {
        const humor = registros.find(r => r.tipo === 'humor');
        if (humor?.dados?.humor) setSelectedMood(humor.dados.humor);

        // Para cada stat, soma o total do dia usando o valor salvo em dados.quantidade
        setStats(prev => prev.map(s => {
          const total = registros.filter(r => r.tipo === s.tipo)
            .reduce((acc, r) => acc + (r.dados?.quantidade ?? 1), 0);
          return { ...s, done: total };
        }));
      }
    }
    carregar();
  }, []);

  // Salva glicemia
  const handleConfirmarGlicemia = async () => {
    const val = parseInt(inputText, 10);
    if (isNaN(val) || val < 20 || val > 600) {
      Alert.alert('Valor inválido', 'Digite um valor entre 20 e 600 mg/dL.'); return;
    }
    setSalvando(true);
    try {
      if (userId.current) {
        await supabase.from('leituras_glicemia').insert({ user_id: userId.current, valor: val, medido_em: new Date().toISOString() });
      }
      setGlicemia(val);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch { Alert.alert('Erro', 'Não foi possível salvar.'); }
    finally { setSalvando(false); setModalVis(false); setInputText(''); }
  };

  // Abre modal para editar stat manualmente
  const handleOpenEditStat = (s: Stat) => {
    setEditingStat(s);
    setEditValue(s.done.toString());
  };

  // Salva stat editado manualmente
  const handleSalvarStat = async () => {
    if (!editingStat || !userId.current) return;
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0) { Alert.alert('Valor inválido', 'Digite um número válido.'); return; }
    setSalvando(true);
    try {
      // Remove registros anteriores do dia para esse tipo e insere o novo com quantidade
      const hoje = new Date();
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
      await supabase.from('registros_diarios')
        .delete().eq('user_id', userId.current).eq('tipo', editingStat.tipo).gte('registrado_em', inicio);
      if (val > 0) {
        await supabase.from('registros_diarios').insert({
          user_id: userId.current,
          tipo: editingStat.tipo,
          dados: { quantidade: val, data: new Date().toISOString() },
        });
      }
      setStats(prev => prev.map(s => s.key === editingStat.key ? { ...s, done: val } : s));
    } catch { Alert.alert('Erro', 'Não foi possível salvar.'); }
    finally { setSalvando(false); setEditingStat(null); setEditValue(''); }
  };

  // Salva humor
  const handleMoodSelect = async (moodId: string) => {
    setSelectedMood(moodId);
    if (!userId.current) return;
    try {
      await supabase.from('registros_diarios').insert({ user_id: userId.current, tipo: 'humor', dados: { humor: moodId, data: new Date().toISOString() } });
    } catch { console.error('Erro humor'); }
  };

  const status   = getStatus(glicemia);
  const meta     = STATUS_MAP[status];
  const progress = Math.min(Math.max((glicemia - 40) / (300 - 40), 0), 1);
  const offset   = RCIRC * (1 - progress);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header com seta voltar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registrar</Text>
          <View style={{ width: 38 }} />
        </View>

        <Text style={styles.pageSub}>Acompanhe sua saúde durante o dia</Text>

        {/* Card Glicemia — ring centralizado, inserir abaixo */}
        <View style={styles.glicCard}>
          <View style={styles.glicCardHeader}>
            <Text style={styles.glicTitle}>Glicemia</Text>
            <View style={[styles.statusPill, { backgroundColor: meta.soft }]}>
              <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>

          {/* Ring centralizado */}
          <View style={styles.ringCenter}>
            <Svg width={RING} height={RING}>
              <Circle cx={RING/2} cy={RING/2} r={RRADIUS} stroke="rgba(255,255,255,0.07)" strokeWidth={RSTROKE} fill="none" />
              <Circle cx={RING/2} cy={RING/2} r={RRADIUS} stroke={meta.color} strokeWidth={RSTROKE}
                strokeLinecap="round" fill="none"
                strokeDasharray={`${RCIRC} ${RCIRC}`}
                strokeDashoffset={offset} rotation={-90} origin={`${RING/2}, ${RING/2}`} />
            </Svg>
            <Animated.View style={[styles.ringLabel, { opacity: fadeAnim }]}>
              <Text style={[styles.ringValue, { color: glicemia > 0 ? meta.color : C.muted }]}>
                {glicemia > 0 ? glicemia : '—'}
              </Text>
              <Text style={styles.ringUnit}>mg/dL</Text>
            </Animated.View>
          </View>

          {/* Botão inserir abaixo do ring */}
          <TouchableOpacity style={styles.insertBtn} onPress={() => setModalVis(true)} activeOpacity={0.85}>
            <View style={styles.insertIcon}>
              <Ionicons name="create-outline" size={18} color={C.text} />
            </View>
            <View>
              <Text style={styles.insertTitle}>Inserir manualmente</Text>
              <Text style={styles.insertSub}>Digitar valor</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats — toque para editar o número */}
        <View style={styles.statsRow}>
          {stats.map((s) => (
            <TouchableOpacity key={s.key} style={styles.statCard} activeOpacity={0.8} onPress={() => handleOpenEditStat(s)}>
              <Ionicons name={s.icon} size={20} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.done}</Text>
              <Text style={styles.statUnit}>{s.unit}</Text>
              <View style={styles.editHint}>
                <Ionicons name="pencil-outline" size={10} color={C.muted} />
                <Text style={styles.editHintText}>editar</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Humor */}
        <View style={styles.moodCard}>
          <Text style={styles.moodTitle}>Como você está se sentindo hoje?</Text>
          <View style={styles.moodRow}>
            {MOODS.map(m => {
              const sel = selectedMood === m.id;
              return (
                <TouchableOpacity key={m.id} onPress={() => handleMoodSelect(m.id)} activeOpacity={0.8}
                  style={[styles.moodBtn, sel && { backgroundColor: `${m.color}26`, borderColor: m.color }]}>
                  <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal glicemia */}
      <Modal visible={modalVis} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setModalVis(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Inserir glicemia</Text>
                  <Text style={styles.modalSub}>Digite o valor em mg/dL</Text>
                  <TextInput style={styles.modalInput} value={inputText} onChangeText={setInputText}
                    keyboardType="numeric" placeholder="Ex: 120" placeholderTextColor="rgba(255,255,255,0.25)"
                    autoFocus maxLength={3} />
                  <TouchableOpacity style={[styles.modalBtn, salvando && { opacity: 0.6 }]}
                    onPress={handleConfirmarGlicemia} disabled={salvando}>
                    <Text style={styles.modalBtnText}>Confirmar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setModalVis(false)} style={{ alignItems: 'center', marginTop: 12 }}>
                    <Text style={{ fontFamily: A, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal editar stat */}
      <Modal visible={!!editingStat} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setEditingStat(null)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>{editingStat?.label}</Text>
                  <Text style={styles.modalSub}>Quantas {editingStat?.unit} hoje?</Text>
                  <TextInput style={styles.modalInput} value={editValue} onChangeText={setEditValue}
                    keyboardType="numeric" placeholder="0" placeholderTextColor="rgba(255,255,255,0.25)"
                    autoFocus maxLength={3} />
                  <TouchableOpacity style={[styles.modalBtn, salvando && { opacity: 0.6 }]}
                    onPress={handleSalvarStat} disabled={salvando}>
                    <Text style={styles.modalBtnText}>Salvar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingStat(null)} style={{ alignItems: 'center', marginTop: 12 }}>
                    <Text style={{ fontFamily: A, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  scroll:       { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  backBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontFamily: A, fontWeight: '700', fontSize: 17, color: C.text },
  pageSub:      { fontFamily: A, fontSize: 13, color: C.muted, marginBottom: 20 },
  glicCard:     { backgroundColor: C.surface, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 20, marginBottom: 16 },
  glicCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  glicTitle:    { fontFamily: A, fontWeight: '700', fontSize: 16, color: C.text },
  statusPill:   { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 6 },
  statusDot:    { width: 7, height: 7, borderRadius: 3.5 },
  statusText:   { fontFamily: A, fontWeight: '600', fontSize: 12 },
  ringCenter:   { alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  ringLabel:    { position: 'absolute', alignItems: 'center' },
  ringValue:    { fontFamily: A, fontWeight: '800', fontSize: 40 },
  ringUnit:     { fontFamily: A, fontSize: 13, color: C.muted, marginTop: -4 },
  insertBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 14, gap: 14 },
  insertIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  insertTitle:  { fontFamily: A, fontWeight: '600', fontSize: 14, color: C.text, marginBottom: 2 },
  insertSub:    { fontFamily: A, fontSize: 12, color: C.muted },
  statsRow:     { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard:     { flex: 1, backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 14, alignItems: 'center', gap: 4 },
  statValue:    { fontFamily: A, fontWeight: '800', fontSize: 24 },
  statUnit:     { fontFamily: A, fontSize: 11, color: C.muted, textAlign: 'center' },
  editHint:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  editHintText: { fontFamily: A, fontSize: 10, color: C.muted },
  moodCard:     { backgroundColor: C.surface, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 20 },
  moodTitle:    { fontFamily: A, fontWeight: '600', fontSize: 15, color: C.text, marginBottom: 16 },
  moodRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn:      { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.05)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalCard:    { backgroundColor: '#1C1A50', borderRadius: 24, padding: 28, width: 300, borderWidth: 1, borderColor: C.border },
  modalTitle:   { fontFamily: A, fontWeight: '700', fontSize: 18, color: C.text, marginBottom: 6 },
  modalSub:     { fontFamily: A, fontSize: 13, color: C.muted, marginBottom: 20 },
  modalInput:   { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, height: 56, paddingHorizontal: 16, fontFamily: A, fontSize: 24, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 16 },
  modalBtn:     { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalBtnText: { fontFamily: A, fontWeight: '700', fontSize: 15, color: '#FFF' },
});