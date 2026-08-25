import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// Dependências (mesmas do HomeScreen/RecipesScreen):
//   npx expo install expo-linear-gradient react-native-svg
// ---------------------------------------------------------------------------

type Exercise = {
  id: string;
  title: string;
  intensity: string;
  duration: string;
  imageUri: string;
};

type ExerciseSection = {
  id: string;
  title: string;
  exercises: Exercise[];
};

const { width } = Dimensions.get('window');
const SIDE_PADDING = 24;

const HERO_IMAGE_URI =
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop';

const DEFAULT_SECTIONS: ExerciseSection[] = [
  {
    id: 'exercicios-matinais',
    title: 'Exercícios Matinais',
    exercises: [
      {
        id: 'caminhadas',
        title: 'Caminhadas',
        intensity: 'Moderada',
        duration: '20min',
        imageUri:
          'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=400&auto=format&fit=crop',
      },
      {
        id: 'alongamentos',
        title: 'Alongamentos',
        intensity: 'Leves',
        duration: '10min',
        imageUri:
          'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=400&auto=format&fit=crop',
      },
      {
        id: 'yoga',
        title: 'Yoga',
        intensity: 'Leves',
        duration: '18min',
        imageUri:
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&auto=format&fit=crop',
      },
      {
        id: 'pedaladas',
        title: 'Pedaladas',
        intensity: 'Moderada',
        duration: '20min',
        imageUri:
          'https://images.unsplash.com/photo-1541625602330-2277a4c46182?q=80&w=400&auto=format&fit=crop',
      },
    ],
  },
];

interface ExerciseScreenProps {
  navigation?: any;
  heroImageUri?: string;
  sections?: ExerciseSection[];
  onExercisePress?: (exerciseId: string) => void;
}

export default function ExerciseScreen({
  navigation,
  heroImageUri = HERO_IMAGE_URI,
  sections = DEFAULT_SECTIONS,
  onExercisePress,
}: ExerciseScreenProps) {
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
          <TouchableOpacity
            hitSlop={10}
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons name="chevron-back" size={22} color="#F5F3FF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.pageTitle}>Exercícios</Text>

        {/* Imagem de destaque */}
        <View style={styles.heroCard}>
          <Image source={{ uri: heroImageUri }} style={styles.heroImage} />
          <LinearGradient
            colors={['rgba(11,10,36,0)', 'rgba(11,10,36,0.55)']}
            style={styles.heroOverlay}
            pointerEvents="none"
          />
        </View>

        {/* Seções de exercícios */}
        {sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.exerciseList}>
              {section.exercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  activeOpacity={0.85}
                  style={styles.exerciseCard}
                  onPress={() => onExercisePress?.(exercise.id)}
                >
                  <Image source={{ uri: exercise.imageUri }} style={styles.exerciseImage} />
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                    <Text style={styles.exerciseMeta}>
                      {exercise.intensity} · {exercise.duration}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#7A78A3" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
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
    marginBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F5F3FF',
    marginBottom: 18,
  },
  heroCard: {
    height: 190,
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: '#1C1856',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F5F3FF',
    marginBottom: 14,
  },
  exerciseList: { gap: 12 },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
  },
  exerciseImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginRight: 14,
    backgroundColor: '#1C1856',
  },
  exerciseInfo: { flex: 1 },
  exerciseTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#F5F3FF',
    marginBottom: 3,
  },
  exerciseMeta: {
    fontSize: 12.5,
    color: '#A5A3C7',
    fontWeight: '500',
  },
});