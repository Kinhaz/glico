import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Polyline, Circle, Line as SvgLine } from 'react-native-svg';

const glucoseData = [130, 145, 160, 150, 138, 128];
const idealData = [110, 115, 120, 118, 112, 108];
const timeLabels = ['6h', '9h', '12h', '15h', '18h', '21h'];

const CHART_WIDTH = 300;
const CHART_HEIGHT = 100;
const MAX_VAL = 180;
const MIN_VAL = 90;

function toPoints(data: number[]) {
  return data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * CHART_WIDTH;
      const y =
        CHART_HEIGHT - ((val - MIN_VAL) / (MAX_VAL - MIN_VAL)) * CHART_HEIGHT;
      return `${x},${y}`;
    })
    .join(' ');
}

type StatCardProps = {
  label: string;
  value: string;
  sub?: string;
  badge: string;
  badgeColor: string;
  accent: string;
};

function StatCard({ label, value, sub, badge, badgeColor, accent }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statLabelRow}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={styles.statValue}>
        {value}
        {sub ? <Text style={styles.statSub}> {sub}</Text> : null}
      </Text>
      <View style={[styles.badge, { backgroundColor: badgeColor + '22' }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
      </View>
    </View>
  );
}

export default function GlyCareReportScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Feather name="menu" size={20} color="#fff" />
        <Text style={styles.headerTitle}>GlyCare</Text>
        <View>
          <Feather name="bell" size={18} color="#fff" />
          <View style={styles.notifDot} />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Relatórios</Text>
      <Text style={styles.subtitle}>
        Acompanhe e compartilhe seus relatórios
      </Text>

      {/* Filtros */}
      <View style={styles.filtersRow}>
        <View style={styles.filterPill} />
        <View style={styles.filterPill} />
      </View>

      {/* Stat cards */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Glicemia média"
          value="102"
          sub="mg/dL"
          badge="Estável"
          badgeColor="#22c55e"
          accent="#22c55e"
        />
        <StatCard
          label="TIR"
          value="84/100"
          badge="Excelente"
          badgeColor="#38bdf8"
          accent="#38bdf8"
        />
        <StatCard
          label="Exercícios"
          value="5/7"
          sub="dias"
          badge="Consistente"
          badgeColor="#a78bfa"
          accent="#a78bfa"
        />
        <StatCard
          label="Refeições"
          value="92%"
          sub="concluído"
          badge="No plano"
          badgeColor="#fb923c"
          accent="#fb923c"
        />
      </View>

      {/* Gráfico */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Evolução da glicemia</Text>
          <Text style={styles.chartLink}>Ver detalhes ›</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#e879f9' }]} />
            <Text style={styles.legendText}>Glicemia média</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#38bdf8' }]} />
            <Text style={styles.legendText}>Faixa ideal (70–180)</Text>
          </View>
        </View>

        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={{ marginTop: 8 }}>
          <Polyline
            points={toPoints(glucoseData)}
            fill="none"
            stroke="#e879f9"
            strokeWidth={2}
          />
          <Polyline
            points={toPoints(idealData)}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={2}
          />
          {glucoseData.map((val, i) => {
            const x = (i / (glucoseData.length - 1)) * CHART_WIDTH;
            const y =
              CHART_HEIGHT - ((val - MIN_VAL) / (MAX_VAL - MIN_VAL)) * CHART_HEIGHT;
            return <Circle key={i} cx={x} cy={y} r={3} fill="#e879f9" />;
          })}
        </Svg>
        <View style={styles.timeLabelsRow}>
          {timeLabels.map((t) => (
            <Text key={t} style={styles.timeLabel}>
              {t}
            </Text>
          ))}
        </View>
      </View>

      {/* Compartilhar */}
      <Text style={styles.shareTitle}>Compartilhar relatório</Text>
      <Text style={styles.shareSubtitle}>
        Envie seu relatório para seu médico ou faça o download
      </Text>

      <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
        <View style={[styles.iconWrap, { backgroundColor: '#ec489920' }]}>
          <Feather name="download" size={20} color="#f472b6" />
        </View>
        <View>
          <Text style={styles.actionTitle}>Baixar PDF</Text>
          <Text style={styles.actionSubtitle}>Gerar relatório completo</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
        <View style={[styles.iconWrap, { backgroundColor: '#0ea5e920' }]}>
          <Feather name="send" size={20} color="#38bdf8" />
        </View>
        <View>
          <Text style={styles.actionTitle}>Enviar ao médico</Text>
          <Text style={styles.actionSubtitle}>Compartilhar relatório</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#150f30',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  filterPill: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2158',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#241b4a',
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statSub: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '400',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#241b4a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chartTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chartLink: {
    color: '#94a3b8',
    fontSize: 11,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  timeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeLabel: {
    color: '#64748b',
    fontSize: 10,
  },
  shareTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  shareSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#241b4a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  iconWrap: {
    padding: 8,
    borderRadius: 12,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
});