import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, { Polyline, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const A = "Arial";
const C = { bg:'#0B0A24', surface:'#13122E', border:'rgba(255,255,255,0.08)', text:'#F5F3FF', muted:'#A5A3C7', accent:'#7C5CFF', green:'#4FD1A5', pink:'#FF7597', blue:'#60A5FA', orange:'#FF9F6B' };
const W = 300, H = 100, MAX = 220, MIN = 60;

function toX(i: number, total: number) { return total > 1 ? (i / (total - 1)) * W : W / 2; }
function toY(v: number) { return H - ((Math.min(Math.max(v, MIN), MAX) - MIN) / (MAX - MIN)) * H; }

function fmtData(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
}

function StatCard({ label, value, sub, badge, badgeColor, accent }:
  { label:string; value:string; sub?:string; badge:string; badgeColor:string; accent:string }) {
  return (
    <View style={s.statCard}>
      <View style={s.statLbl}><View style={[s.dot,{backgroundColor:accent}]}/><Text style={s.statLabel} numberOfLines={1}>{label}</Text></View>
      <Text style={s.statValue}>{value}{sub?<Text style={s.statSub}> {sub}</Text>:null}</Text>
      <View style={[s.badge,{backgroundColor:badgeColor+'22'}]}><Text style={[s.badgeText,{color:badgeColor}]}>{badge}</Text></View>
    </View>
  );
}

interface Ponto { valor: number; data: string; }
interface Stats { media:number|null; tir:number|null; exerciciosDias:number; refeicoesPct:number|null; pontos:Ponto[]; }

export default function RelatoriosScreen() {
  const [stats,      setStats]      = useState<Stats>({ media:null, tir:null, exerciciosDias:0, refeicoesPct:null, pontos:[] });
  const [carregando, setCarregando] = useState(true);
  const [periodo,    setPeriodo]    = useState<'7d'|'30d'>('7d');

  useEffect(() => { carregar(); }, [periodo]);

  async function carregar() {
    setCarregando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dias = periodo === '7d' ? 7 : 30;
      const inicio = new Date(); inicio.setDate(inicio.getDate() - dias);
      const inicioISO = inicio.toISOString();

      const { data: leituras } = await supabase.from('leituras_glicemia')
        .select('valor, medido_em').eq('user_id', user.id)
        .gte('medido_em', inicioISO).order('medido_em', { ascending: true });

      let media: number|null=null, tir: number|null=null, pontos: Ponto[]=[];

      if (leituras && leituras.length > 0) {
        const vals = leituras.map((l:any) => l.valor);
        media = Math.round(vals.reduce((a:number,b:number)=>a+b,0)/vals.length);
        tir   = Math.round(vals.filter((v:number)=>v>=70&&v<=180).length/vals.length*100);
        // Pega até 6 pontos com datas reais
        const step = Math.max(1, Math.floor(leituras.length/6));
        pontos = Array.from({length:Math.min(6,leituras.length)},(_,i)=>({
          valor: leituras[Math.min(i*step,leituras.length-1)].valor,
          data:  leituras[Math.min(i*step,leituras.length-1)].medido_em,
        }));
      }

      const { data: exercicios } = await supabase.from('registros_diarios')
        .select('registrado_em').eq('user_id',user.id).eq('tipo','atividade').gte('registrado_em',inicioISO);
      const exerciciosDias = new Set((exercicios??[]).map((r:any)=>r.registrado_em.split('T')[0])).size;

      const { data: refeicoes } = await supabase.from('registros_diarios')
        .select('registrado_em').eq('user_id',user.id).eq('tipo','alimentacao').gte('registrado_em',inicioISO);
      const refeicoesPct = refeicoes ? Math.min(100,Math.round(refeicoes.length/(dias*5)*100)) : null;

      setStats({ media, tir, exerciciosDias, refeicoesPct, pontos });
    } catch (err) { console.error('Relatórios:', err); }
    finally { setCarregando(false); }
  }

  const dias = periodo === '7d' ? 7 : 30;
  function glLbl(v:number|null) { if(!v)return'—'; if(v<=100)return'Estável'; if(v<=140)return'Moderada'; return'Alta'; }
  function tirLbl(v:number|null) { if(!v)return'—'; if(v>=70)return'Excelente'; if(v>=50)return'Adequado'; return'Atenção'; }
  function exLbl(v:number,d:number) { const p=v/d; if(p>=0.8)return'Consistente'; if(p>=0.5)return'Regular'; return'Baixo'; }
  function rfLbl(v:number|null) { if(!v)return'—'; if(v>=80)return'No plano'; if(v>=50)return'Parcial'; return'Abaixo'; }

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <Text style={s.title}>Relatórios</Text>
      <Text style={s.subtitle}>Acompanhe e compartilhe seus relatórios</Text>

      <View style={s.filterRow}>
        {(['7d','30d'] as const).map(p=>(
          <TouchableOpacity key={p} style={[s.filterBtn,periodo===p&&s.filterBtnActive]} onPress={()=>setPeriodo(p)}>
            <Text style={[s.filterText,periodo===p&&s.filterTextActive]}>{p==='7d'?'Últimos 7 dias':'Últimos 30 dias'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {carregando ? <ActivityIndicator color={C.accent} style={{marginTop:40}}/> : (
        <>
          <View style={s.statsGrid}>
            <StatCard label="Glicemia média" value={stats.media?`${stats.media}`:'—'} sub={stats.media?'mg/dL':undefined} badge={glLbl(stats.media)} badgeColor={C.green} accent={C.green} />
            <StatCard label="TIR"            value={stats.tir?`${stats.tir}/100`:'—'} badge={tirLbl(stats.tir)} badgeColor={C.blue} accent={C.blue} />
            <StatCard label="Exercícios"     value={`${stats.exerciciosDias}/${dias}`} sub="dias" badge={exLbl(stats.exerciciosDias,dias)} badgeColor={C.accent} accent={C.accent} />
            <StatCard label="Refeições"      value={stats.refeicoesPct?`${stats.refeicoesPct}%`:'—'} sub={stats.refeicoesPct?'concluído':undefined} badge={rfLbl(stats.refeicoesPct)} badgeColor={C.orange} accent={C.orange} />
          </View>

          <View style={s.chartCard}>
            <View style={s.chartHeader}>
              <Text style={s.chartTitle}>Evolução da glicemia</Text>
              <TouchableOpacity><Text style={s.chartLink}>Ver detalhes ›</Text></TouchableOpacity>
            </View>
            <View style={s.legend}>
              {[{color:C.pink,label:'Glicemia média'},{color:C.blue,label:'Faixa ideal (70–180)'}].map(l=>(
                <View key={l.label} style={s.legendItem}>
                  <View style={[s.legendDot,{backgroundColor:l.color}]}/>
                  <Text style={s.legendText}>{l.label}</Text>
                </View>
              ))}
            </View>
            <Svg width={W} height={H+28} style={{marginTop:8}}>
              {/* Faixa ideal */}
              <SvgLine x1="0" y1={toY(180)} x2={W} y2={toY(180)} stroke={C.blue} strokeWidth="1" strokeDasharray="4,4" opacity={0.5}/>
              <SvgLine x1="0" y1={toY(70)}  x2={W} y2={toY(70)}  stroke={C.blue} strokeWidth="1" strokeDasharray="4,4" opacity={0.5}/>
              {/* Linha de dados reais */}
              {stats.pontos.length>=2 && (
                <>
                  <Polyline
                    points={stats.pontos.map((p,i)=>`${toX(i,stats.pontos.length)},${toY(p.valor)}`).join(' ')}
                    fill="none" stroke={C.pink} strokeWidth="2.5" />
                  {stats.pontos.map((p,i)=>(
                    <Circle key={i} cx={toX(i,stats.pontos.length)} cy={toY(p.valor)} r={4} fill={C.pink}/>
                  ))}
                  {/* Labels de datas reais */}
                  {stats.pontos.map((p,i)=>(
                    <SvgText key={i} x={toX(i,stats.pontos.length)} y={H+20}
                      fill={C.muted} fontSize="9" textAnchor="middle">{fmtData(p.data)}</SvgText>
                  ))}
                </>
              )}
              {stats.pontos.length<2 && (
                <SvgText x={W/2} y={H/2} fill={C.muted} fontSize="12" textAnchor="middle">Sem dados</SvgText>
              )}
              <SvgLine x1="0" y1={H} x2={W} y2={H} stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
            </Svg>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:          { flex:1, backgroundColor:C.bg },
  content:         { padding:20, paddingBottom:40 },
  title:           { fontFamily:A, fontSize:28, fontWeight:'800', color:C.text, marginBottom:4 },
  subtitle:        { fontFamily:A, fontSize:14, color:C.muted, marginBottom:20 },
  filterRow:       { flexDirection:'row', gap:10, marginBottom:20 },
  filterBtn:       { flex:1, backgroundColor:C.surface, borderRadius:14, paddingVertical:10, alignItems:'center', borderWidth:1, borderColor:C.border },
  filterBtnActive: { backgroundColor:'rgba(124,92,255,0.2)', borderColor:C.accent },
  filterText:      { fontFamily:A, fontSize:13, color:C.muted, fontWeight:'500' },
  filterTextActive:{ fontFamily:A, color:'#A5B4FC', fontWeight:'700' },
  statsGrid:       { flexDirection:'row', flexWrap:'wrap', gap:12, marginBottom:20 },
  statCard:        { width:'47%', backgroundColor:C.surface, borderRadius:18, borderWidth:1, borderColor:C.border, padding:16 },
  statLbl:         { flexDirection:'row', alignItems:'center', gap:8, marginBottom:8 },
  dot:             { width:8, height:8, borderRadius:4 },
  statLabel:       { fontFamily:A, fontSize:12, color:C.muted, flex:1 },
  statValue:       { fontFamily:A, fontSize:26, fontWeight:'800', color:C.text, marginBottom:6 },
  statSub:         { fontFamily:A, fontSize:13, color:C.muted, fontWeight:'400' },
  badge:           { alignSelf:'flex-start', borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  badgeText:       { fontFamily:A, fontSize:11, fontWeight:'600' },
  chartCard:       { backgroundColor:C.surface, borderRadius:20, borderWidth:1, borderColor:C.border, padding:18 },
  chartHeader:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  chartTitle:      { fontFamily:A, fontSize:15, fontWeight:'700', color:C.text },
  chartLink:       { fontFamily:A, fontSize:12, color:C.accent },
  legend:          { flexDirection:'row', gap:16, marginBottom:4 },
  legendItem:      { flexDirection:'row', alignItems:'center', gap:6 },
  legendDot:       { width:8, height:8, borderRadius:4 },
  legendText:      { fontFamily:A, fontSize:11, color:C.muted },
});