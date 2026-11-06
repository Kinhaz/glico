import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const A = "Arial";
const C = { bg:"#0B0A24", surface:"#13122E", border:"rgba(255,255,255,0.08)", accent:"#7C5CFF", text:"#F5F3FF", muted:"#A5A3C7", orange:"#FFB86B" };

export type NutritionItem = { label: string; value: string };
export type Recipe = {
  id: string; title: string; tag: string; imageUri: string;
  time: string; difficulty: string; servings: string; intro: string;
  diabetesBenefits: string[]; funFact: string; nutrition: NutritionItem[];
  ingredients: string[]; steps: string[]; tip: string;
};
type RecipeSection = { id: string; title: string; recipeIds: string[] };

export const RECIPES: Record<string, Recipe> = {
  'bolo-de-batata-doce': {
    id:'bolo-de-batata-doce', title:'Bolo de batata-doce', tag:'Passo a Passo',
    imageUri:'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?q=80&w=800',
    time:'40min', difficulty:'Simples', servings:'8 porções',
    intro:'Uma versão mais gentil com a glicemia do bolo tradicional.',
    diabetesBenefits:['Índice glicêmico mais baixo que a batata comum.','Rica em fibras, retardando absorção de açúcar.','Fornece potássio e vitamina A.','Reduz o pico glicêmico comparado ao bolo tradicional.'],
    funFact:'A batata-doce é originária da América Central e já era cultivada há mais de 5 mil anos.',
    nutrition:[{label:'Calorias',value:'~140 kcal'},{label:'Carboidratos',value:'22g'},{label:'Fibras',value:'2.5g'},{label:'Proteínas',value:'3g'}],
    ingredients:['2 ovos','1 xícara de açúcar','1 vidro de leite de coco','1 lata de Leite Moça (395g)','1 kg de batata-doce cozida e amassada','2 xícaras de farinha de trigo','1 colher (sopa) de fermento em pó','1 pacote de coco fresco ralado'],
    steps:['Bata os ovos até dobrar de volume.','Acrescente o açúcar.','Junte leite de coco, Leite Moça e batata-doce.','Adicione a farinha, fermento e coco.','Leve ao forno a 200°C por 40 min.'],
    tip:'Prefira consumir como parte de uma refeição, não com o estômago vazio.',
  },
  'wrap-integral': {
    id:'wrap-integral', title:'Wrap integral', tag:'Passo a Passo',
    imageUri:'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=800',
    time:'8min', difficulty:'Simples', servings:'1 porção',
    intro:'Um café da manhã rápido e equilibrado com tortilha integral.',
    diabetesBenefits:['Farinha integral tem mais fibras que a branca.','Combinar carb com proteína reduz o pico glicêmico.','Opção prática para não pular o café da manhã.'],
    funFact:'O wrap ganhou popularidade nos EUA nos anos 1990.',
    nutrition:[{label:'Calorias',value:'~220 kcal'},{label:'Carboidratos',value:'24g'},{label:'Fibras',value:'4g'},{label:'Proteínas',value:'12g'}],
    ingredients:['1 tortilha integral','2 fatias de peito de peru','2 colheres de queijo cottage','Folhas de alface ou rúcula','3 fatias de tomate','1 fio de azeite'],
    steps:['Aqueça a tortilha em uma frigideira.','Espalhe o queijo cottage.','Distribua o recheio no centro.','Regue com azeite e tempere.','Enrole firme e sirva.'],
    tip:'Troque o cottage por pasta de abacate para mais gordura boa.',
  },
  'ovos-mexidos-com-leite': {
    id:'ovos-mexidos-com-leite', title:'Ovos mexidos com leite', tag:'Passo a Passo',
    imageUri:'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=800',
    time:'8min', difficulty:'Simples', servings:'1 porção',
    intro:'Opção de café da manhã com menor impacto na glicemia.',
    diabetesBenefits:['Ovos têm índice glicêmico próximo de zero.','A proteína prolonga a saciedade.','Associado a glicemias pós-refeição mais estáveis.'],
    funFact:'A clara do ovo é composta por mais de 90% de água.',
    nutrition:[{label:'Calorias',value:'~180 kcal'},{label:'Carboidratos',value:'2g'},{label:'Fibras',value:'0g'},{label:'Proteínas',value:'13g'}],
    ingredients:['2 ovos','2 colheres de leite','1 colher de manteiga','Sal e pimenta a gosto','Cebolinha picada (opcional)'],
    steps:['Bata os ovos com leite, sal e pimenta.','Aqueça a manteiga em fogo baixo.','Despeje os ovos e mexa continuamente.','Retire ainda levemente úmidos.','Finalize com cebolinha.'],
    tip:'Fogo baixo e mexer sem parar é o segredo para ovos cremosos.',
  },
  'omelete-verde': {
    id:'omelete-verde', title:'Omelete verde', tag:'Passo a Passo',
    imageUri:'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=800',
    time:'15min', difficulty:'Simples', servings:'1 porção',
    intro:'Café da manhã reforçado com folhas verdes e carboidrato praticamente zero.',
    diabetesBenefits:['Vegetais folhosos têm carboidrato quase nulo.','Fibras + proteína tornam essa refeição estável.','Rico em magnésio, associado à sensibilidade à insulina.'],
    funFact:'A palavra "omelete" vem do francês antigo "alemelle", que significa "lâmina fina".',
    nutrition:[{label:'Calorias',value:'~210 kcal'},{label:'Carboidratos',value:'4g'},{label:'Fibras',value:'2g'},{label:'Proteínas',value:'15g'}],
    ingredients:['2 ovos','1 xícara de espinafre picado','2 colheres de queijo branco ralado','1 colher de azeite','Sal e pimenta a gosto'],
    steps:['Refogue o espinafre no azeite por 1 a 2 min.','Bata os ovos com sal e pimenta.','Despeje os ovos sobre o espinafre.','Polvilhe o queijo e dobre ao meio.','Cozinhe 1 min de cada lado.'],
    tip:'Troque o espinafre por couve ou rúcula para variar.',
  },
};

const DEFAULT_SECTIONS: RecipeSection[] = [
  { id:'cafe-da-manha', title:'Café da Manhã', recipeIds:['bolo-de-batata-doce','wrap-integral','ovos-mexidos-com-leite','omelete-verde'] },
];

export default function RecipesScreen({ navigation }: { navigation?: any }) {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack?.()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.pageTitle}>Receitas</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Hero */}
        <View style={s.heroCard}>
          <Image source={{ uri:'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=1200' }} style={s.heroImg} />
          <View style={s.heroOverlay} />
          <View style={s.heroContent}>
            <Text style={s.heroTag}>NUTRIÇÃO PARA DIABETES</Text>
            <Text style={s.heroTitle}>Receitas para manter{"\n"}a glicemia estável</Text>
          </View>
        </View>

        {DEFAULT_SECTIONS.map(section => (
          <View key={section.id} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            {section.recipeIds.map(rid => {
              const recipe = RECIPES[rid];
              if (!recipe) return null;
              return (
                <TouchableOpacity key={rid} style={s.card} activeOpacity={0.85}
                  onPress={() => navigation?.navigate?.('RecipeDetail', { recipeId: rid })}>
                  <Image source={{ uri: recipe.imageUri }} style={s.cardImg} />
                  <View style={s.cardInfo}>
                    <Text style={s.cardTitle}>{recipe.title}</Text>
                    <Text style={s.cardMeta}>{recipe.difficulty} · {recipe.time}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={C.muted} />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        <View style={{ height:32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex:1, backgroundColor:C.bg },
  scroll:      { paddingHorizontal:20, paddingTop:8 },
  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  backBtn:     { width:38, height:38, borderRadius:12, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  pageTitle:   { fontFamily:A, fontWeight:'800', fontSize:20, color:C.text },
  heroCard:    { borderRadius:20, overflow:'hidden', height:160, marginBottom:28, position:'relative' },
  heroImg:     { width:'100%', height:'100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(11,10,36,0.55)' },
  heroContent: { position:'absolute', bottom:16, left:16 },
  heroTag:     { fontFamily:A, fontSize:10, fontWeight:'700', color:C.orange, letterSpacing:0.8, marginBottom:4 },
  heroTitle:   { fontFamily:A, fontWeight:'800', fontSize:18, color:C.text, lineHeight:24 },
  section:     { marginBottom:24 },
  sectionTitle:{ fontFamily:A, fontWeight:'800', fontSize:16, color:C.text, marginBottom:12 },
  card:        { flexDirection:'row', alignItems:'center', backgroundColor:C.surface, borderRadius:16, borderWidth:1, borderColor:C.border, padding:12, marginBottom:10 },
  cardImg:     { width:56, height:56, borderRadius:12, marginRight:14, backgroundColor:C.surface },
  cardInfo:    { flex:1 },
  cardTitle:   { fontFamily:A, fontWeight:'700', fontSize:14, color:C.text, marginBottom:3 },
  cardMeta:    { fontFamily:A, fontSize:12, color:C.muted },
});