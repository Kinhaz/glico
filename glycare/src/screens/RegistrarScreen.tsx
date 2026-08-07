import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Dependências: expo-linear-gradient, react-native-svg (mesmas do InicioScreen)
// ---------------------------------------------------------------------------

const MOODS = [
  { id: 'muito-mal', emoji: '😞', color: '#FF6B6B' },
  { id: 'mal', emoji: '😕', color: '#FF9F6B' },
  { id: 'neutro', emoji: '😐', color: '#FFD66B' },
  { id: 'bem', emoji: '🙂', color: '#8FE08A' },
  { id: 'muito-bem', emoji: '😄', color: '#4FD1A5' },
];

type GlicemiaStatus = 'baixo' | 'normal' | 'alto';

function getStatus(value: number): GlicemiaStatus {
  if (value < 70) return 'baixo';
  if (value > 180) return 'alto';
  return 'normal';
}

const STATUS_META: Record<GlicemiaStatus, { label: string; color: string; soft: string }> = {
  baixo: { label: 'Baixo', color: '#FF6B6B', soft: 'rgba(255,107,107,0.14)' },
  normal: { label: 'Normal', color: '#34D6B4', soft: 'rgba(52,214,180,0.14)' },
  alto: { label: 'Alto', color: '#FF9F6B', soft: 'rgba(255,159,107,0.14)' },
};

const RING_SIZE = 190;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
// Faixa de referência usada só para desenhar o gauge (40–300 mg/dL)
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

interface RegistrarScreenProps {
  navigation?: any;
  glicemiaInicial?: number;
  stats?: StatItem[];
  onSalvarGlicemia?: (valor: number) => void;
  onMoodSelect?: (moodId: string) => void;
}

const DEFAULT_STATS: StatItem[] = [
  { key: 'refeicoes', label: 'Refeições', done: 1, total: 5, icon: 'restaurant-outline', color: '#34D6B4' },
  { key: 'exercicios', label: 'Exercícios', done: 0, total: 2, icon: 'walk-outline', color: '#9F8FFF' },
  { key: 'agua', label: 'Água', done: 1, total: 8, icon: 'water-outline', color: '#7EC8E3', unit: 'copos' },
];

export default function RegistrarScreen({
  navigation,
  glicemiaInicial = 98,
  stats = DEFAULT_STATS,
  onSalvarGlicemia,
  onMoodSelect,
}: RegistrarScreenProps) {
  const [glicemia, setGlicemia] = useState(glicemiaInicial);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState(String(glicemiaInicial));
  const pressAnim = useRef(new Animated.Value(1)).current;

  const status = useMemo(() => getStatus(glicemia), [glicemia]);
  const statusMeta = STATUS_META[status];

  const ringProgress = useMemo(() => {
    const clamped = Math.max(RING_MIN, Math.min(RING_MAX, glicemia));
    return (clamped - RING_MIN) / (RING_MAX - RING_MIN);
  }, [glicemia]);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - ringProgress);

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  };

  const handleAbrirModal = () => {
    setInputValue(String(glicemia));
    setModalVisible(true);
  };

  const handleSalvar = () => {
    const parsed = parseInt(inputValue.replace(/[^0-9]/g, ''), 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setGlicemia(parsed);
      onSalvarGlicemia?.(parsed);
    }
    setModalVisible(false);
  };

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
    onMoodSelect?.(moodId);
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#181545', '#100E33', '#0B0A24']} style={StyleSheet.absoluteFill} />
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity hitSlop={10} onPress={() => navigation?.goBack?.()}>
            <Ionicons name="arrow-back" size={24} color="#F5F3FF" />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={10} style={styles.bellButton}>
            <Ionicons name="notifications-outline" size={20} color="#F5F3FF" />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Registrar</Text>
          <Text style={styles.subtitle}>Acompanhe sua saúde durante o dia</Text>
        </View>

        {/* Card Glicemia */}
        <View style={styles.glicemiaCard}>
          <LinearGradient
            colors={['#2B2670', '#1C1856']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glicemiaHeader}>
            <Text style={styles.glicemiaLabel}>Glicemia</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusMeta.soft }]}>
              <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
              <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
            </View>
          </View>

          <View style={styles.glicemiaBody}>
            <View style={styles.ringWrap}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={statusMeta.color}
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                  strokeDashoffset={strokeDashoffset}
                  rotation={-90}
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
              </Svg>
              <View style={styles.ringLabel}>
                <Text style={styles.ringValue}>{glicemia}</Text>
                <Text style={styles.ringUnit}>mg/dL</Text>
              </View>
            </View>

            <Animated.View style={{ transform: [{ scale: pressAnim }], flex: 1 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleAbrirModal}
                style={styles.manualButton}
              >
                <View style={styles.manualIconWrap}>
                  <Ionicons name="create-outline" size={18} color="#181545" />
                </View>
                <View>
                  <Text style={styles.manualButtonTitle}>Inserir manualmente</Text>
                  <Text style={styles.manualButtonSubtitle}>Digitar valor</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Mini cards de progresso */}
        <View style={styles.statsRow}>
          {stats.map((stat) => {
            const pct = stat.total > 0 ? Math.min(stat.done / stat.total, 1) : 0;
            return (
              <View key={stat.key} style={styles.statCard}>
                <Ionicons name={stat.icon} size={16} color={stat.color} style={{ marginBottom: 6 }} />
                <Text style={[styles.statFraction, { color: stat.color }]}>
                  {stat.done}/{stat.total}
                </Text>
                <Text style={styles.statLabel}>{stat.unit ? stat.unit : stat.label}</Text>
                <View style={styles.statBarTrack}>
                  <View style={[styles.statBarFill, { width: `${pct * 100}%`, backgroundColor: stat.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* Check-in de humor */}
        <View style={styles.moodCard}>
          <Text style={styles.moodQuestion}>Como você está se sentindo hoje?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((mood) => {
              const isSelected = selectedMood === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  onPress={() => handleMoodSelect(mood.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.moodButton,
                    isSelected && { backgroundColor: `${mood.color}26`, borderColor: mood.color },
                  ]}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dica / rodapé */}
        <View style={styles.footerHint}>
          <Ionicons name="notifications-outline" size={14} color="#7A78A3" style={{ marginRight: 6 }} />
          <Text style={styles.footerHintText}>
            Acompanhe sua rotina diária apertando no ícone de notificações no canto superior direito
          </Text>
        </View>
      </ScrollView>

      {/* Modal de entrada manual */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalCard}
              >
                <Text style={styles.modalTitle}>Digitar valor</Text>
                <Text style={styles.modalSubtitle}>Informe sua glicemia atual em mg/dL</Text>

                <View style={styles.modalInputWrap}>
                  <TextInput
                    value={inputValue}
                    onChangeText={setInputValue}
                    keyboardType="number-pad"
                    autoFocus
                    maxLength={3}
                    style={styles.modalInput}
                    placeholder="0"
                    placeholderTextColor="#5C5A88"
                  />
                  <Text style={styles.modalInputUnit}>mg/dL</Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.modalCancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.modalSaveButton]}
                    onPress={handleSalvar}
                  >
                    <Text style={styles.modalSaveText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0A24' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(124,92,255,0.18)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(52,214,180,0.10)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF7597',
    borderWidth: 1.5,
    borderColor: '#0B0A24',
  },
  titleBlock: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#F5F3FF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#A5A3C7', fontWeight: '500' },
  glicemiaCard: {
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 20,
  },
  glicemiaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  glicemiaLabel: { fontSize: 15, fontWeight: '700', color: '#F5F3FF' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },
  glicemiaBody: { flexDirection: 'row', alignItems: 'center' },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  ringLabel: { position: 'absolute', alignItems: 'center' },
  ringValue: { fontSize: 34, fontWeight: '800', color: '#F5F3FF' },
  ringUnit: { fontSize: 12, color: '#A5A3C7', fontWeight: '600', marginTop: -2 },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
  },
  manualIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  manualButtonTitle: { fontSize: 13, fontWeight: '700', color: '#F5F3FF' },
  manualButtonSubtitle: { fontSize: 11.5, color: '#A5A3C7', marginTop: 1 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 12,
    marginHorizontal: 4,
  },
  statFraction: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#A5A3C7', fontWeight: '600', marginBottom: 8 },
  statBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  statBarFill: { height: '100%', borderRadius: 2 },
  moodCard: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
  },
  moodQuestion: { fontSize: 14, fontWeight: '700', color: '#F5F3FF', marginBottom: 14 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  moodEmoji: { fontSize: 21 },
  footerHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  footerHintText: { flex: 1, fontSize: 11.5, color: '#7A78A3', lineHeight: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,5,20,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1C1856',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#F5F3FF', marginBottom: 4 },
  modalSubtitle: { fontSize: 12.5, color: '#A5A3C7', marginBottom: 18 },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalInput: {
    fontSize: 40,
    fontWeight: '800',
    color: '#F5F3FF',
    minWidth: 70,
    textAlign: 'center',
    padding: 0,
  },
  modalInputUnit: { fontSize: 14, color: '#A5A3C7', fontWeight: '600', marginLeft: 6 },
  modalActions: { flexDirection: 'row' },
  modalActionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginRight: 8,
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: '#A5A3C7' },
  modalSaveButton: { backgroundColor: '#F5F3FF', marginLeft: 8 },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: '#181545' },
});