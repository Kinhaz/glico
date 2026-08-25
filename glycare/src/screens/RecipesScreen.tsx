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
// Dependências (mesmas do HomeScreen):
//   npx expo install expo-linear-gradient react-native-svg
// ---------------------------------------------------------------------------

export type NutritionItem = { label: string; value: string };

export type Recipe = {
  id: string;
  title: string;
  tag: string;
  imageUri: string;
  time: string;
  difficulty: string;
  servings: string;
  intro: string;
  diabetesBenefits: string[];
  funFact: string;
  nutrition: NutritionItem[];
  ingredients: string[];
  steps: string[];
  tip: string;
};

type RecipeSection = {
  id: string;
  title: string;
  recipeIds: string[];
};

const { width } = Dimensions.get('window');
const SIDE_PADDING = 24;

const HERO_IMAGE_URI =
  'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=1200&auto=format&fit=crop';

// ---------------------------------------------------------------------------
// Fonte única de dados das receitas. RecipeDetailScreen consome este mesmo
// objeto (RECIPES) via `route.params.recipeId`, então tudo fica sincronizado:
// editar uma receita aqui atualiza tanto o card na lista quanto a tela de
// detalhe.
// ---------------------------------------------------------------------------
export const RECIPES: Record<string, Recipe> = {
  'bolo-de-batata-doce': {
    id: 'bolo-de-batata-doce',
    title: 'Bolo de batata-doce',
    tag: 'Passo a Passo',
    imageUri:
      'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?q=80&w=800&auto=format&fit=crop',
    time: '40min',
    difficulty: 'Simples',
    servings: '8 porções',
    intro:
      'Uma versão mais gentil com a glicemia do bolo tradicional: a batata-doce entra no lugar de parte do açúcar e da farinha refinada, deixando a sobremesa mais nutritiva sem perder o sabor.',
    diabetesBenefits: [
      'A batata-doce tem índice glicêmico mais baixo que a batata comum, liberando energia de forma mais gradual no sangue.',
      'É rica em fibras, o que ajuda a retardar a absorção de açúcar e melhora a saciedade.',
      'Fornece potássio e vitamina A, nutrientes que apoiam a saúde vascular — importante para quem tem diabetes.',
      'Substituir parte da farinha branca por batata-doce reduz o pico glicêmico em comparação a um bolo tradicional.',
    ],
    funFact:
      'A batata-doce é originária da América Central e já era cultivada há mais de 5 mil anos. Apesar do nome, ela não é parente da batata comum — é da mesma família da corda-de-viola.',
    nutrition: [
      { label: 'Calorias', value: '~140 kcal' },
      { label: 'Carboidratos', value: '22g' },
      { label: 'Fibras', value: '2.5g' },
      { label: 'Proteínas', value: '3g' },
    ],
    ingredients: [
      '2 ovos',
      '1 xícara (chá) de açúcar',
      '1 vidro de leite de coco',
      '1 lata de Leite Moça (395g)',
      '1 quilo de batata-doce cozida e amassada',
      '2 xícaras (chá) de farinha de trigo',
      '1 colher (sopa) de fermento em pó',
      '1 pacote de coco fresco ralado',
    ],
    steps: [
      'Em uma batedeira, bata os ovos até dobrar de volume.',
      'Acrescente o açúcar até obter uma mistura clara e fofa.',
      'Junte o leite de coco, o Leite Moça e a batata-doce e bata bem.',
      'Adicione a farinha, o fermento e o coco e misture com movimentos leves.',
      'Leve ao forno a 200°C por 40 minutos.',
    ],
    tip: 'Prefira consumir uma fatia como parte de uma refeição, e não com o estômago vazio — isso ajuda a suavizar ainda mais o impacto na glicemia.',
  },
  'wrap-integral': {
    id: 'wrap-integral',
    title: 'Wrap integral',
    tag: 'Passo a Passo',
    imageUri:
      'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=800&auto=format&fit=crop',
    time: '8min',
    difficulty: 'Simples',
    servings: '1 porção',
    intro:
      'Um café da manhã rápido e equilibrado: a tortilha integral entrega carboidrato de liberação mais lenta, enquanto o recheio traz proteína e gordura boa para segurar a fome até o almoço.',
    diabetesBenefits: [
      'A farinha integral tem mais fibras que a branca, o que suaviza a subida da glicemia após a refeição.',
      'Combinar carboidrato com proteína e gordura (como no recheio) reduz o pico glicêmico do prato como um todo.',
      'É uma opção prática para não pular o café da manhã, o que ajuda a manter a glicemia mais estável ao longo do dia.',
    ],
    funFact:
      'O wrap como o conhecemos hoje ganhou popularidade nos EUA nos anos 1990, mas a ideia de enrolar comida em uma massa fina existe há séculos em diversas culturas, da tortilla mexicana ao lavash do Oriente Médio.',
    nutrition: [
      { label: 'Calorias', value: '~220 kcal' },
      { label: 'Carboidratos', value: '24g' },
      { label: 'Fibras', value: '4g' },
      { label: 'Proteínas', value: '12g' },
    ],
    ingredients: [
      '1 tortilha integral',
      '2 fatias de peito de peru ou frango desfiado',
      '2 colheres (sopa) de queijo cottage ou ricota',
      'Folhas de alface ou rúcula a gosto',
      '3 fatias de tomate',
      '1 fio de azeite',
    ],
    steps: [
      'Aqueça levemente a tortilha em uma frigideira antiparelha, dos dois lados.',
      'Espalhe o queijo cottage por toda a superfície da tortilha.',
      'Distribua o peito de peru, as folhas verdes e o tomate no centro.',
      'Regue com um fio de azeite e tempere com sal e pimenta a gosto.',
      'Enrole firme, corte ao meio e sirva.',
    ],
    tip: 'Troque o queijo cottage por pasta de abacate se quiser mais gordura boa e menos sódio.',
  },
  'ovos-mexidos-com-leite': {
    id: 'ovos-mexidos-com-leite',
    title: 'Ovos mexidos com leite',
    tag: 'Passo a Passo',
    imageUri:
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=800&auto=format&fit=crop',
    time: '8min',
    difficulty: 'Simples',
    servings: '1 porção',
    intro:
      'Uma das opções de café da manhã com menor impacto na glicemia: o ovo é praticamente livre de carboidrato e é uma fonte completa de proteína, ajudando a manter a saciedade sem picos de açúcar no sangue.',
    diabetesBenefits: [
      'Os ovos têm índice glicêmico próximo de zero, o que os torna uma base segura para o café da manhã.',
      'A proteína do ovo ajuda a retardar o esvaziamento gástrico, prolongando a sensação de saciedade.',
      'Um café da manhã rico em proteína, em vez de só carboidrato, está associado a glicemias pós-refeição mais estáveis ao longo do dia.',
    ],
    funFact:
      'A clara do ovo é composta por mais de 90% de água e o restante quase todo proteína — é um dos alimentos com maior "qualidade proteica" que existem, usado até como referência em tabelas nutricionais.',
    nutrition: [
      { label: 'Calorias', value: '~180 kcal' },
      { label: 'Carboidratos', value: '2g' },
      { label: 'Fibras', value: '0g' },
      { label: 'Proteínas', value: '13g' },
    ],
    ingredients: [
      '2 ovos',
      '2 colheres (sopa) de leite',
      '1 colher (chá) de manteiga ou azeite',
      'Sal e pimenta-do-reino a gosto',
      'Cebolinha picada (opcional)',
    ],
    steps: [
      'Bata os ovos com o leite, o sal e a pimenta em uma tigela.',
      'Aqueça a manteiga em fogo baixo em uma frigideira antiaderente.',
      'Despeje os ovos e mexa devagar e continuamente com uma espátula.',
      'Retire do fogo ainda levemente úmidos, pois continuam cozinhando fora da panela.',
      'Finalize com cebolinha picada, se desejar.',
    ],
    tip: 'Cozinhar em fogo baixo e mexer sem parar é o segredo para ovos mexidos cremosos em vez de borrachudos.',
  },
  'omelete-verde': {
    id: 'omelete-verde',
    title: 'Omelete verde',
    tag: 'Passo a Passo',
    imageUri:
      'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=800&auto=format&fit=crop',
    time: '15min',
    difficulty: 'Simples',
    servings: '1 porção',
    intro:
      'Um café da manhã reforçado com folhas verdes: além da proteína do ovo, o omelete ganha fibras, vitaminas e minerais dos vegetais, com carboidrato praticamente zero.',
    diabetesBenefits: [
      'Vegetais folhosos como espinafre têm carboidrato quase nulo e alta densidade de nutrientes, sem impacto relevante na glicemia.',
      'As fibras dos vegetais somadas à proteína do ovo tornam essa refeição especialmente estável para os níveis de açúcar no sangue.',
      'É rico em magnésio, mineral associado à melhora da sensibilidade à insulina.',
    ],
    funFact:
      'A palavra "omelete" vem do francês antigo "alemelle", que significa "lâmina fina" — uma referência ao formato achatado do prato.',
    nutrition: [
      { label: 'Calorias', value: '~210 kcal' },
      { label: 'Carboidratos', value: '4g' },
      { label: 'Fibras', value: '2g' },
      { label: 'Proteínas', value: '15g' },
    ],
    ingredients: [
      '2 ovos',
      '1 xícara (chá) de espinafre picado',
      '2 colheres (sopa) de queijo branco ralado',
      '1 colher (chá) de azeite',
      'Sal e pimenta-do-reino a gosto',
    ],
    steps: [
      'Refogue o espinafre no azeite por 1 a 2 minutos, só até murchar.',
      'Bata os ovos com sal e pimenta em uma tigela à parte.',
      'Despeje os ovos batidos sobre o espinafre já na frigideira.',
      'Deixe firmar nas bordas, polvilhe o queijo e dobre a omelete ao meio.',
      'Cozinhe por mais 1 minuto de cada lado e sirva.',
    ],
    tip: 'Troque o espinafre por couve ou rúcula picada para variar o sabor sem perder os benefícios.',
  },
};

const DEFAULT_SECTIONS: RecipeSection[] = [
  {
    id: 'cafe-da-manha',
    title: 'Café da Manhã',
    recipeIds: [
      'bolo-de-batata-doce',
      'wrap-integral',
      'ovos-mexidos-com-leite',
      'omelete-verde',
    ],
  },
];

interface RecipesScreenProps {
  navigation?: any;
  heroImageUri?: string;
  sections?: RecipeSection[];
  onRecipePress?: (recipeId: string) => void;
}

export default function RecipesScreen({
  navigation,
  heroImageUri = HERO_IMAGE_URI,
  sections = DEFAULT_SECTIONS,
  onRecipePress,
}: RecipesScreenProps) {
  const handleRecipePress = (recipeId: string) => {
    navigation?.navigate?.('RecipeDetail', { recipeId });
    onRecipePress?.(recipeId);
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
          <TouchableOpacity
            hitSlop={10}
            style={styles.backButton}
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons name="chevron-back" size={22} color="#F5F3FF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.pageTitle}>Receitas</Text>

        {/* Imagem de destaque */}
        <View style={styles.heroCard}>
          <Image source={{ uri: heroImageUri }} style={styles.heroImage} />
          <LinearGradient
            colors={['rgba(11,10,36,0)', 'rgba(11,10,36,0.55)']}
            style={styles.heroOverlay}
            pointerEvents="none"
          />
        </View>

        {/* Seções de receitas */}
        {sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.recipeList}>
              {section.recipeIds.map((recipeId) => {
                const recipe = RECIPES[recipeId];
                if (!recipe) return null;

                return (
                  <TouchableOpacity
                    key={recipe.id}
                    activeOpacity={0.85}
                    style={styles.recipeCard}
                    onPress={() => handleRecipePress(recipe.id)}
                  >
                    <Image source={{ uri: recipe.imageUri }} style={styles.recipeImage} />
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeTitle}>{recipe.title}</Text>
                      <Text style={styles.recipeMeta}>
                        {recipe.difficulty} · {recipe.time}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#7A78A3" />
                  </TouchableOpacity>
                );
              })}
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
  recipeList: { gap: 12 },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    padding: 10,
    marginBottom: 12,
  },
  recipeImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginRight: 14,
    backgroundColor: '#1C1856',
  },
  recipeInfo: { flex: 1 },
  recipeTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#F5F3FF',
    marginBottom: 3,
  },
  recipeMeta: {
    fontSize: 12.5,
    color: '#A5A3C7',
    fontWeight: '500',
  },
});