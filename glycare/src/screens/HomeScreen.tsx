import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Dependências extras usadas neste redesign (rode se ainda não tiver):
//   npx expo install expo-linear-gradient react-native-svg
// ---------------------------------------------------------------------------

type QuickAction = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  tintSoft: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'receitas', label: 'Receitas', icon: 'restaurant-outline', tint: '#FFB86B', tintSoft: 'rgba(255,184,107,0.14)' },
  { id: 'exercicios', label: 'Exercícios', icon: 'walk-outline', tint: '#34D6B4', tintSoft: 'rgba(52,214,180,0.14)' },
  { id: 'saude', label: 'Saúde', icon: 'water-outline', tint: '#FF7597', tintSoft: 'rgba(255,117,151,0.14)' },
  { id: 'analise', label: 'Análise', icon: 'bar-chart-outline', tint: '#9F8FFF', tintSoft: 'rgba(159,143,255,0.16)' },
];

const MOODS = [
  { id: 'muito-mal', emoji: '😞', color: '#FF6B6B' },
  { id: 'mal', emoji: '😕', color: '#FF9F6B' },
  { id: 'neutro', emoji: '😐', color: '#FFD66B' },
  { id: 'bem', emoji: '🙂', color: '#8FE08A' },
  { id: 'muito-bem', emoji: '😄', color: '#4FD1A5' },
];

const RING_SIZE = 132;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const { width } = Dimensions.get('window');
const SIDE_PADDING = 24;
const CARD_GAP = 14;
const CARD_WIDTH = (width - SIDE_PADDING * 2 - CARD_GAP) / 2;

interface HomeScreenProps {
  navigation?: any;
  userName?: string;
  dayStreak?: number;
  monthGoal?: number;
  onQuickAction?: (actionId: string) => void;
  onRegister?: () => void;
  onMoodSelect?: (moodId: string) => void;
}

export default function HomeScreen({
  navigation,
  userName = 'Carla',
  dayStreak = 27,
  monthGoal = 30,
  onQuickAction,
  onRegister,
  onMoodSelect,
}: HomeScreenProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const pressAnim = useRef(new Animated.Value(1)).current;

  const progress = Math.min(dayStreak / monthGoal, 1);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
  const daysLeft = Math.max(monthGoal - dayStreak, 0);

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
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
          <TouchableOpacity hitSlop={10} onPress={() => navigation?.openDrawer?.()}>
            <Ionicons name="menu" size={26} color="#F5F3FF" />
          </TouchableOpacity>
          <Text style={styles.brand}>GlyCare</Text>
          <TouchableOpacity hitSlop={10} style={styles.bellButton}>
            <Ionicons name="notifications-outline" size={20} color="#F5F3FF" />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Saudação */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>Olá, {userName} 👋</Text>
          <Text style={styles.subtitle}>Vamos cuidar da sua saúde hoje</Text>
        </View>

        {/* Card principal — sequência de autocuidado */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#2B2670', '#1C1856']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
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
                  stroke="#FF8A65"
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
                <Text style={styles.ringDay}>{dayStreak}</Text>
                <Text style={styles.ringDayCaption}>dia{dayStreak === 1 ? '' : 's'}</Text>
              </View>
            </View>

            <View style={styles.heroTextBlock}>
              <Text style={styles.heroEyebrow}>SEQUÊNCIA DE AUTOCUIDADO</Text>
              <Text style={styles.heroTitle}>Você está indo bem!</Text>
              <Text style={styles.heroSubtitle}>
                {daysLeft > 0
                  ? `Faltam ${daysLeft} dias para fechar o mês em cheio`
                  : 'Você completou o mês em cheio!'}
              </Text>

              <Animated.View style={{ transform: [{ scale: pressAnim }], alignSelf: 'flex-start' }}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={() => (onRegister ? onRegister() : navigation?.navigate?.('Registrar'))}
                  style={styles.registerButton}
                >
                  <Ionicons name="add-circle" size={18} color="#181545" style={{ marginRight: 6 }} />
                  <Text style={styles.registerButtonText}>Registrar hoje</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>

        {/* Ações rápidas */}
        <Text style={styles.sectionLabel}>AÇÕES RÁPIDAS</Text>
        <View style={styles.grid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              activeOpacity={0.85}
              style={styles.actionCard}
              onPress={() => onQuickAction?.(action.id)}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: action.tintSoft }]}>
                <Ionicons name={action.icon} size={22} color={action.tint} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Check-in de humor */}
        <Text style={styles.sectionLabel}>COMO VOCÊ ESTÁ SE SENTINDO?</Text>
        <View style={styles.moodCard}>
          <Text style={styles.moodQuestion}>Registre seu humor de hoje</Text>
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
                    isSelected && {
                      backgroundColor: `${mood.color}26`,
                      borderColor: mood.color,
                    },
                  ]}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dica do dia */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="bulb-outline" size={18} color="#FFD66B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Dica do dia</Text>
            <Text style={styles.tipText}>
              Beber água antes das refeições ajuda a manter a glicemia mais estável ao longo do dia.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0A24' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SIDE_PADDING, paddingTop: 16, paddingBottom: 40 },
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
    marginBottom: 22,
  },
  brand: { fontSize: 16, fontWeight: '700', color: '#F5F3FF', letterSpacing: 0.5 },
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
  greetingBlock: { marginBottom: 20 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#F5F3FF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#A5A3C7', fontWeight: '500' },
  heroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  ringLabel: { position: 'absolute', alignItems: 'center' },
  ringDay: { fontSize: 32, fontWeight: '800', color: '#F5F3FF', lineHeight: 34 },
  ringDayCaption: { fontSize: 12, color: '#A5A3C7', fontWeight: '600', marginTop: -2 },
  heroTextBlock: { flex: 1 },
  heroEyebrow: { fontSize: 10, fontWeight: '700', color: '#A897FF', letterSpacing: 0.8, marginBottom: 6 },
  heroTitle: { fontSize: 17, fontWeight: '700', color: '#F5F3FF', marginBottom: 4 },
  heroSubtitle: { fontSize: 12.5, color: '#A5A3C7', lineHeight: 17, marginBottom: 12 },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  registerButtonText: { fontSize: 13, fontWeight: '700', color: '#181545' },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7A78A3',
    letterSpacing: 0.9,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  actionCard: {
    width: CARD_WIDTH,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 16,
    marginBottom: CARD_GAP,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: { fontSize: 14, fontWeight: '600', color: '#F5F3FF' },
  moodCard: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
  },
  moodQuestion: { fontSize: 14, fontWeight: '600', color: '#F5F3FF', marginBottom: 14 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  moodEmoji: { fontSize: 22 },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,214,107,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,107,0.18)',
    borderRadius: 18,
    padding: 16,
  },
  tipIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,214,107,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipTitle: { fontSize: 13, fontWeight: '700', color: '#F5F3FF', marginBottom: 3 },
  tipText: { fontSize: 12.5, color: '#C7C5E0', lineHeight: 17 },
});