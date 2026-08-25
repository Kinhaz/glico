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

import { RECIPES, Recipe } from '../screens/RecipesScreen';

// ---------------------------------------------------------------------------
// Dependências (mesmas das outras telas):
//   npx expo install expo-linear-gradient react-native-svg
// ---------------------------------------------------------------------------

const { width } = Dimensions.get('window');
const SIDE_PADDING = 24;

const FALLBACK_RECIPE_ID = 'bolo-de-batata-doce';

interface RecipeDetailScreenProps {
  navigation?: any;
  route?: { params?: { recipeId?: string } };
  onSaveRecipe?: () => void;
}

export default function RecipeDetailScreen({
  navigation,
  route,
  onSaveRecipe,
}: RecipeDetailScreenProps) {
  const recipeId = route?.params?.recipeId ?? FALLBACK_RECIPE_ID;
  const recipe: Recipe = RECIPES[recipeId] ?? RECIPES[FALLBACK_RECIPE_ID];

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

          <TouchableOpacity hitSlop={10} style={styles.saveButton} onPress={onSaveRecipe}>
            <Ionicons name="bookmark-outline" size={18} color="#F5F3FF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.pageTitle}>{recipe.title}</Text>

        {/* Imagem de destaque */}
        <View style={styles.heroCard}>
          <Image source={{ uri: recipe.imageUri }} style={styles.heroImage} />
          <LinearGradient
            colors={['rgba(11,10,36,0)', 'rgba(11,10,36,0.55)']}
            style={styles.heroOverlay}
            pointerEvents="none"
          />
        </View>

        {/* Chips de info rápida */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={14} color="#A897FF" />
            <Text style={styles.metaChipText}>{recipe.time}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="speedometer-outline" size={14} color="#34D6B4" />
            <Text style={styles.metaChipText}>{recipe.difficulty}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="people-outline" size={14} color="#FF8A65" />
            <Text style={styles.metaChipText}>{recipe.servings}</Text>
          </View>
        </View>

        <Text style={styles.introText}>{recipe.intro}</Text>

        {/* Por que é boa para diabetes */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="heart-outline" size={16} color="#FF7597" />
          <Text style={styles.sectionTitle}>Por que é boa para diabetes</Text>
        </View>
        <View style={styles.benefitsCard}>
          {recipe.diabetesBenefits.map((benefit, index) => (
            <View
              key={index}
              style={[
                styles.benefitRow,
                index === recipe.diabetesBenefits.length - 1 && { marginBottom: 0 },
              ]}
            >
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Informação nutricional */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="stats-chart-outline" size={16} color="#9F8FFF" />
          <Text style={styles.sectionTitle}>Informação nutricional</Text>
        </View>
        <View style={styles.nutritionGrid}>
          {recipe.nutrition.map((item) => (
            <View key={item.label} style={styles.nutritionCard}>
              <Text style={styles.nutritionValue}>{item.value}</Text>
              <Text style={styles.nutritionLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.nutritionCaption}>Valores aproximados por porção</Text>

        {/* Curiosidade */}
        <View style={styles.funFactCard}>
          <View style={styles.funFactIconWrap}>
            <Ionicons name="sparkles-outline" size={18} color="#FFD66B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.funFactTitle}>Você sabia?</Text>
            <Text style={styles.funFactText}>{recipe.funFact}</Text>
          </View>
        </View>

        {/* Ingredientes */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="basket-outline" size={16} color="#FFB86B" />
          <Text style={styles.sectionTitle}>Ingredientes</Text>
        </View>
        <View style={styles.listCard}>
          {recipe.ingredients.map((ingredient, index) => (
            <View
              key={index}
              style={[
                styles.ingredientRow,
                index === recipe.ingredients.length - 1 && { marginBottom: 0, borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={12} color="#0B0A24" />
              </View>
              <Text style={styles.ingredientText}>{ingredient}</Text>
            </View>
          ))}
        </View>

        {/* Modo de preparo */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="list-outline" size={16} color="#34D6B4" />
          <Text style={styles.sectionTitle}>Modo de preparo</Text>
        </View>
        <View style={styles.listCard}>
          {recipe.steps.map((step, index) => (
            <View
              key={index}
              style={[
                styles.stepRow,
                index === recipe.steps.length - 1 && { marginBottom: 0 },
              ]}
            >
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Dica GlyCare */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="bulb-outline" size={18} color="#FFD66B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Dica GlyCare</Text>
            <Text style={styles.tipText}>{recipe.tip}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0A24' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SIDE_PADDING, paddingTop: 16, paddingBottom: 48 },
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
  saveButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F5F3FF',
    marginBottom: 16,
  },
  heroCard: {
    height: 190,
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: '#1C1856',
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  metaChipText: { fontSize: 12, fontWeight: '700', color: '#F5F3FF' },
  introText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#C7C5E0',
    marginBottom: 26,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F5F3FF',
  },
  benefitsCard: {
    backgroundColor: 'rgba(255,117,151,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,117,151,0.16)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 26,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF7597',
    marginTop: 6,
    marginRight: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#E6E4F5',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nutritionCard: {
    width: (width - SIDE_PADDING * 2 - 20) / 2,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  nutritionValue: { fontSize: 16, fontWeight: '800', color: '#F5F3FF', marginBottom: 3 },
  nutritionLabel: { fontSize: 11.5, color: '#A5A3C7', fontWeight: '600' },
  nutritionCaption: {
    fontSize: 11,
    color: '#7A78A3',
    marginBottom: 26,
  },
  funFactCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,214,107,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,107,0.18)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 26,
  },
  funFactIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,214,107,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  funFactTitle: { fontSize: 13, fontWeight: '700', color: '#F5F3FF', marginBottom: 3 },
  funFactText: { fontSize: 12.5, color: '#C7C5E0', lineHeight: 17 },
  listCard: {
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 26,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#34D6B4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ingredientText: { flex: 1, fontSize: 13.5, color: '#E6E4F5', fontWeight: '500' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(159,143,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: { fontSize: 12, fontWeight: '800', color: '#A897FF' },
  stepText: { flex: 1, fontSize: 13.5, lineHeight: 20, color: '#E6E4F5' },
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