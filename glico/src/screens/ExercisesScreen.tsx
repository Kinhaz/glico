import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const A = "Arial";
const C = { bg:"#0B0A24", surface:"#13122E", border:"rgba(255,255,255,0.08)", accent:"#7C5CFF", text:"#F5F3FF", muted:"#A5A3C7", green:"#4FD1A5" };

const EXERCISES = [
  { id:'caminhadas',   title:'Caminhadas',   intensity:'Moderada', duration:'20min', icon:'walk-outline'        as const, color:'#34D6B4', imageUri:'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=400' },
  { id:'alongamentos', title:'Alongamentos', intensity:'Leves',    duration:'10min', icon:'body-outline'        as const, color:'#9F8FFF', imageUri:'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=400' },
  { id:'yoga',         title:'Yoga',         intensity:'Leves',    duration:'18min', icon:'leaf-outline'        as const, color:'#FFB86B', imageUri:'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400' },
  { id:'pedaladas',    title:'Pedaladas',    intensity:'Moderada', duration:'20min', icon:'bicycle-outline'     as const, color:'#60A5FA', imageUri:'https://images.unsplash.com/photo-1541625602330-2277a4c46182?q=80&w=400' },
];

export default function ExercisesScreen({ navigation }: { navigation?: any }) {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack?.()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.pageTitle}>Exercícios</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Hero */}
        <View style={s.heroCard}>
          <Image source={{ uri:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200' }} style={s.heroImg} />
          <View style={s.heroOverlay} />
          <View style={s.heroContent}>
            <Text style={s.heroTag}>MOVIMENTO E SAÚDE</Text>
            <Text style={s.heroTitle}>Atividades para{"\n"}controlar a glicemia</Text>
          </View>
        </View>

        {/* Benefício rápido */}
        <View style={s.benefitCard}>
          <Ionicons name="heart-outline" size={18} color={C.green} style={{ marginRight:10 }} />
          <Text style={s.benefitText}>Exercícios regulares melhoram a sensibilidade à insulina e ajudam a manter a glicemia estável.</Text>
        </View>

        <Text style={s.sectionTitle}>Exercícios Matinais</Text>
        {EXERCISES.map(ex => (
          <TouchableOpacity key={ex.id} style={s.card} activeOpacity={0.85}>
            <Image source={{ uri: ex.imageUri }} style={s.cardImg} />
            <View style={s.cardInfo}>
              <Text style={s.cardTitle}>{ex.title}</Text>
              <Text style={s.cardMeta}>{ex.intensity} · {ex.duration}</Text>
              <View style={[s.intensityBadge, { backgroundColor:`${ex.color}22` }]}>
                <Text style={[s.intensityText, { color: ex.color }]}>{ex.intensity}</Text>
              </View>
            </View>
            <View style={[s.iconWrap, { backgroundColor:`${ex.color}18` }]}>
              <Ionicons name={ex.icon} size={22} color={ex.color} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Dica */}
        <View style={s.tipCard}>
          <Ionicons name="bulb-outline" size={18} color="#FFD66B" style={{ marginRight:10 }} />
          <Text style={s.tipText}>Meça sua glicemia antes e após o exercício para entender como seu corpo responde.</Text>
        </View>

        <View style={{ height:32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex:1, backgroundColor:C.bg },
  scroll:        { paddingHorizontal:20, paddingTop:8 },
  header:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  backBtn:       { width:38, height:38, borderRadius:12, backgroundColor:C.surface, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  pageTitle:     { fontFamily:A, fontWeight:'800', fontSize:20, color:C.text },
  heroCard:      { borderRadius:20, overflow:'hidden', height:160, marginBottom:20, position:'relative' },
  heroImg:       { width:'100%', height:'100%' },
  heroOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(11,10,36,0.55)' },
  heroContent:   { position:'absolute', bottom:16, left:16 },
  heroTag:       { fontFamily:A, fontSize:10, fontWeight:'700', color:C.green, letterSpacing:0.8, marginBottom:4 },
  heroTitle:     { fontFamily:A, fontWeight:'800', fontSize:18, color:C.text, lineHeight:24 },
  benefitCard:   { flexDirection:'row', alignItems:'flex-start', backgroundColor:'rgba(79,209,165,0.08)', borderRadius:14, borderWidth:1, borderColor:'rgba(79,209,165,0.2)', padding:14, marginBottom:20 },
  benefitText:   { fontFamily:A, fontSize:13, color:C.muted, flex:1, lineHeight:19 },
  sectionTitle:  { fontFamily:A, fontWeight:'800', fontSize:16, color:C.text, marginBottom:12 },
  card:          { flexDirection:'row', alignItems:'center', backgroundColor:C.surface, borderRadius:16, borderWidth:1, borderColor:C.border, padding:14, marginBottom:10 },
  cardImg:       { width:56, height:56, borderRadius:12, marginRight:14, backgroundColor:C.surface },
  cardInfo:      { flex:1 },
  cardTitle:     { fontFamily:A, fontWeight:'700', fontSize:14, color:C.text, marginBottom:3 },
  cardMeta:      { fontFamily:A, fontSize:12, color:C.muted, marginBottom:6 },
  intensityBadge:{ alignSelf:'flex-start', borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  intensityText: { fontFamily:A, fontSize:10, fontWeight:'700' },
  iconWrap:      { width:44, height:44, borderRadius:13, alignItems:'center', justifyContent:'center' },
  tipCard:       { flexDirection:'row', alignItems:'flex-start', backgroundColor:'rgba(255,214,107,0.08)', borderRadius:14, borderWidth:1, borderColor:'rgba(255,214,107,0.18)', padding:14, marginTop:4 },
  tipText:       { fontFamily:A, fontSize:13, color:C.muted, flex:1, lineHeight:19 },
});