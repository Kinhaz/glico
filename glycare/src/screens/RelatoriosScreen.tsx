import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import Svg, { Polyline, Circle, Line as SvgLine } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const C = {
  bg: '#0B0A24', surface: '#13122E', border: 'rgba(255,255,255,0.08)',
  text: '#F5F3FF', muted: '#A5A3C7',
};

const CHART_WIDTH  = 300;
const CHART_HEIGHT = 100;
const MAX_VAL = 220;
const MIN_VAL = 60;
const TIME_LABELS = ['6h', '9h', '12h', '15h', '18h', '21h'];
const IDEAL_DATA  = [110, 115, 120, 118, 112, 108];

function toPoints(data: number[]): string {
  return data.map((val, i) => {
    const x = (i / (data.length - 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - ((val - MIN_VAL) / (MAX_VAL - MIN_VAL)) * CHART_HEIGHT;
    return `${x},${Math.max(0, Math.min(CHART_HEIGHT, y))}`;
  }).join(' ');
}

type StatCardProps = {
  label: string; value: string; sub?: string;
  badge: string; badgeColor: string; accent: string;
};
function StatCard({ label, value, sub, badge, badgeColor, accent }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statLabelRow}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={styles.statValue}>
        {value}{sub ? <Text style={styles.statSub}> {sub}</Text> : null}
      </Text>
      <View style={[styles.badge, { backgroundColor: badgeColor + '22' }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
      </View>
    </View>
  );
}

interface RelStats {
  glicemiaMedia: number | null;
  tir:           number | null;        // % dentro da faixa
  exerciciosDias: number;
  refeicoesPct:  number | null;
  pontos:        number[];             // até 6 pontos para o gráfico
}

export default function RelatoriosScreen() {
  const [stats,      setStats]      = useState<RelStats>({ glicemiaMedia: null, tir: null, exerciciosDias: 0, refeicoesPct: null, pontos: [] });
  const [carregando, setCarregando] = useState(true);
  const [periodo,    setPeriodo]    = useState<'7d' | '30d'>('7d');

  useEffect(() => { carregarRelatorio(); }, [periodo]);

  async function carregarRelatorio() {
    setCarregando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dias = periodo === '7d' ? 7 : 30;
      const inicio = new Date();
      inicio.setDate(inicio.getDate() - dias);
      const inicioISO = inicio.toISOString();

      // Leituras de glicemia no período
      const { data: leituras } = await supabase
        .from('leituras_glicemia')
        .select('valor, medido_em')
        .eq('user_id', user.id)
        .gte('medido_em', inicioISO)
        .order('medido_em', { ascending: true });

      let glicemiaMedia: number | null = null;
      let tir: number | null = null;
      let pontos: number[] = [];

      if (leituras && leituras.length > 0) {
        const valores = leituras.map((l: any) => l.valor);
        glicemiaMedia = Math.round(valores.reduce((a: number, b: number) => a + b, 0) / valores.length);
        const dentroMeta = valores.filter((v: number) => v >= 70 && v <= 180).length;
        tir = Math.round((dentroMeta / valores.length) * 100);

        // Pega até 6 pontos distribuídos para o gráfico
        const step = Math.max(1, Math.floor(valores.length / 6));
        pontos = Array.from({ length: 6 }, (_, i) => valores[Math.min(i * step, valores.length - 1)]);
      }

      // Registros de exercício no período
      const { data: exercicios } = await supabase
        .from('registros_diarios')
        .select('registrado_em')
        .eq('user_id', user.id)
        .eq('tipo', 'atividade')
        .gte('registrado_em', inicioISO);

      // Dias únicos com exercício
      const diasUnicos = new Set((exercicios ?? []).map((r: any) => r.registrado_em.split('T')[0]));
      const exerciciosDias = diasUnicos.size;

      // % refeições registradas vs meta (5 por dia)
      const { data: refeicoes } = await supabase
        .from('registros_diarios')
        .select('registrado_em')
        .eq('user_id', user.id)
        .eq('tipo', 'alimentacao')
        .gte('registrado_em', inicioISO);

      const totalRefeicoesMeta = dias * 5;
      const refeicoesPct = refeicoes
        ? Math.min(100, Math.round((refeicoes.length / totalRefeicoesMeta) * 100))
        : null;

      setStats({ glicemiaMedia, tir, exerciciosDias, refeicoesPct, pontos });
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setCarregando(false);
    }
  }

  function glicemiaLabel(v: number | null): string {
    if (v === null) return '—';
    if (v <= 100) return 'Estável';
    if (v <= 140) return 'Moderada';
    return 'Alta';
  }

  function tirLabel(v: number | null): string {
    if (v === null) return '—';
    if (v >= 70) return 'Excelente';
    if (v >= 50) return 'Adequado';
    return 'Atenção';
  }

  function exercicioLabel(v: number, dias: number): string {
    const pct = v / dias;
    if (pct >= 0.8) return 'Consistente';
    if (pct >= 0.5) return 'Regular';
    return 'Baixo';
  }

  function refeicaoLabel(v: number | null): string {
    if (v === null) return '—';
    if (v >= 80) return 'No plano';
    if (v >= 50) return 'Parcial';
    return 'Abaixo';
  }

  const dias = periodo === '7d' ? 7 : 30;
  const chartData = stats.pontos.length >= 2 ? stats.pontos : IDEAL_DATA;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Relatórios</Text>
      <Text style={styles.subtitle}>Acompanhe e compartilhe seus relatórios</Text>

      {/* Filtros de período */}
      <View style={styles.filterRow}>
        {(['7d', '30d'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.filterBtn, periodo === p && styles.filterBtnActive]}
            onPress={() => setPeriodo(p)}
          >
            <Text style={[styles.filterText, periodo === p && styles.filterTextActive]}>
              {p === '7d' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {carregando ? (
        <ActivityIndicator color="#7C5CFF" style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Cards de estatísticas */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Glicemia média"
              value={stats.glicemiaMedia !== null ? `${stats.glicemiaMedia}` : '—'}
              sub={stats.glicemiaMedia !== null ? 'mg/dL' : undefined}
              badge={glicemiaLabel(stats.glicemiaMedia)}
              badgeColor="#4FD1A5" accent="#4FD1A5"
            />
            <StatCard
              label="TIR"
              value={stats.tir !== null ? `${stats.tir}/100` : '—'}
              badge={tirLabel(stats.tir)}
              badgeColor="#60A5FA" accent="#60A5FA"
            />
            <StatCard
              label="Exercícios"
              value={`${stats.exerciciosDias}/${dias}`}
              sub="dias"
              badge={exercicioLabel(stats.exerciciosDias, dias)}
              badgeColor="#9F8FFF" accent="#9F8FFF"
            />
            <StatCard
              label="Refeições"
              value={stats.refeicoesPct !== null ? `${stats.refeicoesPct}%` : '—'}
              sub={stats.refeicoesPct !== null ? 'concluído' : undefined}
              badge={refeicaoLabel(stats.refeicoesPct)}
              badgeColor="#FF9F6B" accent="#FF9F6B"
            />
          </View>

          {/* Gráfico de evolução */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Evolução da glicemia</Text>
              <TouchableOpacity><Text style={styles.chartLink}>Ver detalhes ›</Text></TouchableOpacity>
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF7597' }]} />
                <Text style={styles.legendText}>Glicemia média</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#60A5FA' }]} />
                <Text style={styles.legendText}>Faixa ideal (70–180)</Text>
              </View>
            </View>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 20} style={{ marginTop: 8 }}>
              {/* Linha ideal */}
              <Polyline
                points={toPoints(IDEAL_DATA)}
                fill="none" stroke="#60A5FA" strokeWidth="2"
                strokeDasharray="4,4" opacity={0.6}
              />
              {/* Linha glicemia real */}
              {chartData.length >= 2 && (
                <>
                  <Polyline points={toPoints(chartData)} fill="none" stroke="#FF7597" strokeWidth="2.5" />
                  {chartData.map((val, i) => {
                    const x = (i / (chartData.length - 1)) * CHART_WIDTH;
                    const y = CHART_HEIGHT - ((val - MIN_VAL) / (MAX_VAL - MIN_VAL)) * CHART_HEIGHT;
                    return <Circle key={i} cx={x} cy={Math.max(0, Math.min(CHART_HEIGHT, y))} r={4} fill="#FF7597" />;
                  })}
                </>
              )}
              {/* Linha do eixo X */}
              <SvgLine x1="0" y1={CHART_HEIGHT} x2={CHART_WIDTH} y2={CHART_HEIGHT} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            </Svg>
            <View style={styles.timeLabels}>
              {TIME_LABELS.map((t) => (
                <Text key={t} style={styles.timeLabel}>{t}</Text>
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: C.bg },
  content:      { padding: 20, paddingBottom: 40 },
  title:        { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 4 },
  subtitle:     { fontSize: 14, color: C.muted, marginBottom: 20 },
  filterRow:    { flexDirection: 'row', gap: 10, marginBottom: 20 },
  filterBtn:    { flex: 1, backgroundColor: C.surface, borderRadius: 14, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: 'rgba(124,92,255,0.2)', borderColor: '#7C5CFF' },
  filterText:   { fontSize: 13, color: C.muted, fontWeight: '500' },
  filterTextActive: { color: '#A5B4FC', fontWeight: '700' },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard:     { width: '47%', backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dot:          { width: 8, height: 8, borderRadius: 4 },
  statLabel:    { fontSize: 12, color: C.muted, flex: 1 },
  statValue:    { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 6 },
  statSub:      { fontSize: 13, color: C.muted, fontWeight: '400' },
  badge:        { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:    { fontSize: 11, fontWeight: '600' },
  chartCard:    { backgroundColor: C.surface, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 18 },
  chartHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chartTitle:   { fontSize: 15, fontWeight: '700', color: C.text },
  chartLink:    { fontSize: 12, color: '#7C5CFF' },
  chartLegend:  { flexDirection: 'row', gap: 16, marginBottom: 4 },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendText:   { fontSize: 11, color: C.muted },
  timeLabels:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  timeLabel:    { fontSize: 10, color: C.muted },
  notifDot:     { position: 'absolute', top: 0, right: 0, width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF7597' },
});
