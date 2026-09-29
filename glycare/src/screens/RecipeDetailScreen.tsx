import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RECIPES, Recipe } from './RecipesScreen';

const A = "Arial";
const C = { bg:"#0B0A24", surface:"#13122E", border:"rgba(255,255,255,0.08)", accent:"#7C5CFF", text:"#F5F3FF", muted:"#A5A3C7", green:"#4FD1A5", orange:"#FFB86B", yellow:"#FFD66B", pink:"#FF7597" };
const { width } = Dimensions.get('window');
const PAD = 20;

export default function RecipeDetailScreen({ navigation, route }: { navigation?: any; route?: any }) {
  const recipeId = route?.params?.recipeId ?? 'bolo-de-batata-doce';
  const recipe: Recipe = RECIPES[recipeId] ?? RECIPES['bolo-de-batata-doce'];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack?.()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.pageTitle} numberOfLines={1}>{recipe.title}</Text>
          <TouchableOpacity style={s.backBtn}>
            <Ionicons name="bookmark-outline" size={20} color={C.text} />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={s.heroCard}>
          <Image source={{ uri: recipe.imageUri }} style={s.heroImg} />
          <View style={s.heroOverlay} />
        </View>

        {/* Meta chips */}
        <View style={s.metaRow}>
          {[
            { icon:'time-outline', label: recipe.time, color:'#A897FF' },
            { icon:'speedometer-outline', label: recipe.difficulty, color:C.green },
            { icon:'people-outline', label: recipe.servings, color:C.orange },
          ].map(m => (
            <View key={m.label} style={s.metaChip}>
              <Ionicons name={m.icon as any} size={14} color={m.color} />
              <Text style={[s.metaText, { color: m.color }]}>{m.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.intro}>{recipe.intro}</Text>

        {/* Benefícios */}
        <View style={s.sectionRow}>
          <Ionicons name="heart-outline" size={16} color={C.pink} />
          <Text style={s.sectionTitle}>Por que é boa para diabetes</Text>
        </View>
        <View style={[s.listCard, { borderColor:`${C.pink}30` }]}>
          {recipe.diabetesBenefits.map((b, i) => (
            <View key={i} style={[s.listRow, i < recipe.diabetesBenefits.length-1 && s.listBorder]}>
              <View style={[s.dot, { backgroundColor: C.pink }]} />
              <Text style={s.listText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Nutrição */}
        <View style={s.sectionRow}>
          <Ionicons name="stats-chart-outline" size={16} color={C.accent} />
          <Text style={s.sectionTitle}>Informação nutricional</Text>
        </View>
        <View style={s.nutritionGrid}>
          {recipe.nutrition.map(n => (
            <View key={n.label} style={s.nutritionCard}>
              <Text style={s.nutritionVal}>{n.value}</Text>
              <Text style={s.nutritionLbl}>{n.label}</Text>
            </View>
          ))}
        </View>
        <Text style={s.nutritionCap}>Valores aproximados por porção</Text>

        {/* Curiosidade */}
        <View style={s.funCard}>
          <View style={s.funIcon}><Ionicons name="sparkles-outline" size={18} color={C.yellow} /></View>
          <View style={{ flex:1 }}>
            <Text style={s.funTitle}>Você sabia?</Text>
            <Text style={s.funText}>{recipe.funFact}</Text>
          </View>
        </View>

        {/* Ingredientes */}
        <View style={s.sectionRow}>
          <Ionicons name="basket-outline" size={16} color={C.orange} />
          <Text style={s.sectionTitle}>Ingredientes</Text>
        </View>
        <View style={s.listCard}>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={[s.listRow, i < recipe.ingredients.length-1 && s.listBorder]}>
              <View style={s.checkCircle}><Ionicons name="checkmark" size={12} color={C.bg} /></View>
              <Text style={s.listText}>{ing}</Text>
            </View>
          ))}
        </View>

        {/* Preparo */}
        <View style={s.sectionRow}>
          <Ionicons name="list-outline" size={16} color={C.green} />
          <Text style={s.sectionTitle}>Modo de preparo</Text>
        </View>
        <View style={s.listCard}>
          {recipe.steps.map((step, i) => (
            <View key={i} style={[s.listRow, i < recipe.steps.length-1 && s.listBorder]}>
              <View style={s.stepNum}><Text style={s.stepNumText}>{i+1}</Text></View>
              <Text style={s.listText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Dica */}
        <View style={s.tipCard}>
          <View style={s.tipIcon}><Ionicons name="bulb-outline" size={18} color={C.yellow} /></View>
          <View style={{ flex:1 }}>
            <Text style={s.tipTitle}>Dica GlyCare</Text>
            <Text style={s.tipText}>{recipe.tip}</Text>
          </View>
        </View>

        <View style={{ height:40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex:1, backgroundColor:C.bg },
  scroll:       { paddingHorizontal:PAD, paddingTop:8 },
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  backBtn:      { width:38, height:38, borderRadius:12, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  pageTitle:    { fontFamily:A, fontWeight:'800', fontSize:18, color:C.text, flex:1, textAlign:'center', marginHorizontal:8 },
  heroCard:     { borderRadius:20, overflow:'hidden', height:180, marginBottom:14, position:'relative' },
  heroImg:      { width:'100%', height:'100%' },
  heroOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(11,10,36,0.3)' },
  metaRow:      { flexDirection:'row', gap:10, marginBottom:16 },
  metaChip:     { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:C.surface, borderRadius:12, paddingHorizontal:12, paddingVertical:7, borderWidth:1, borderColor:C.border },
  metaText:     { fontFamily:A, fontWeight:'700', fontSize:12 },
  intro:        { fontFamily:A, fontSize:13, color:C.muted, lineHeight:20, marginBottom:24 },
  sectionRow:   { flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 },
  sectionTitle: { fontFamily:A, fontWeight:'800', fontSize:15, color:C.text },
  listCard:     { backgroundColor:C.surface, borderRadius:18, borderWidth:1, borderColor:C.border, padding:16, marginBottom:22 },
  listRow:      { flexDirection:'row', alignItems:'flex-start', paddingVertical:8, gap:12 },
  listBorder:   { borderBottomWidth:1, borderBottomColor:C.border },
  dot:          { width:7, height:7, borderRadius:3.5, marginTop:6 },
  listText:     { flex:1, fontFamily:A, fontSize:13, color:'#E6E4F5', lineHeight:19 },
  checkCircle:  { width:20, height:20, borderRadius:10, backgroundColor:C.green, alignItems:'center', justifyContent:'center', marginTop:1 },
  stepNum:      { width:24, height:24, borderRadius:12, backgroundColor:'rgba(159,143,255,0.18)', alignItems:'center', justifyContent:'center' },
  stepNumText:  { fontFamily:A, fontWeight:'800', fontSize:11, color:'#A897FF' },
  nutritionGrid:{ flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', marginBottom:6 },
  nutritionCard:{ width:(width-PAD*2-12)/2, backgroundColor:C.surface, borderRadius:14, borderWidth:1, borderColor:C.border, paddingVertical:12, alignItems:'center', marginBottom:10 },
  nutritionVal: { fontFamily:A, fontWeight:'800', fontSize:16, color:C.text, marginBottom:2 },
  nutritionLbl: { fontFamily:A, fontSize:11, color:C.muted },
  nutritionCap: { fontFamily:A, fontSize:11, color:C.muted, marginBottom:22 },
  funCard:      { flexDirection:'row', backgroundColor:'rgba(255,214,107,0.08)', borderWidth:1, borderColor:'rgba(255,214,107,0.18)', borderRadius:16, padding:14, marginBottom:22 },
  funIcon:      { width:34, height:34, borderRadius:10, backgroundColor:'rgba(255,214,107,0.15)', alignItems:'center', justifyContent:'center', marginRight:10 },
  funTitle:     { fontFamily:A, fontWeight:'700', fontSize:13, color:C.text, marginBottom:2 },
  funText:      { fontFamily:A, fontSize:12, color:C.muted, lineHeight:17 },
  tipCard:      { flexDirection:'row', backgroundColor:'rgba(255,214,107,0.08)', borderWidth:1, borderColor:'rgba(255,214,107,0.18)', borderRadius:16, padding:14 },
  tipIcon:      { width:34, height:34, borderRadius:10, backgroundColor:'rgba(255,214,107,0.15)', alignItems:'center', justifyContent:'center', marginRight:10 },
  tipTitle:     { fontFamily:A, fontWeight:'700', fontSize:13, color:C.text, marginBottom:2 },
  tipText:      { fontFamily:A, fontSize:12, color:C.muted, lineHeight:17 },
});