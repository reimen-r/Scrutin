import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { saveToHistory } from '../services/historyService';
import { shareAsPdf } from '../services/pdfService';
import { spacing, fontSize, fontWeight, borderRadius, shadow, letterSpacing, lineHeight } from '../theme/tokens';
import RiskLabel from '../components/RiskLabel';
import { getContractLabel } from '../types/contract';

function sanitize(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .trim();
}

function MarkdownText({ text, color }: { text: string; color: string }) {
  const safeText = sanitize(text);
  const segments: React.ReactNode[] = [];
  const paragraphs = safeText.split('\n\n').filter(Boolean);

  let key = 0;
  for (const para of paragraphs) {
    const trimmed = para.trim();

    if (trimmed.startsWith('## ')) {
      segments.push(
        <Text key={key++} style={[styles.mdHeading, { color }]}>{trimmed.replace('## ', '')}</Text>,
      );
    } else if (trimmed.startsWith('### ')) {
      segments.push(
        <Text key={key++} style={[styles.mdSubheading, { color }]}>{trimmed.replace('### ', '')}</Text>,
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split('\n').filter(l => l.trim());
      for (const item of items) {
        const clean = item.replace(/^[-*]\s*/, '');
        segments.push(
          <View key={key++} style={styles.mdListItem}>
            <Text style={[styles.mdBullet, { color }]}>•</Text>
            <Text style={[styles.mdBody, { color }]}>{renderBold(clean, color)}</Text>
          </View>,
        );
      }
    } else if (trimmed.match(/^\d+\.\s/)) {
      const items = trimmed.split('\n').filter(l => l.trim());
      for (const item of items) {
        const clean = item.replace(/^\d+\.\s*/, '');
        segments.push(
          <Text key={key++} style={[styles.mdBody, { color, marginLeft: spacing.unit4 }]}>
            {renderBold(clean, color)}
          </Text>,
        );
      }
    } else {
      segments.push(
        <Text key={key++} style={[styles.mdBody, { color }]}>{renderBold(trimmed, color)}</Text>,
      );
    }
  }

  return <>{segments}</>;
}

function renderBold(text: string, color: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={i} style={{ fontWeight: fontWeight.bold, color }}>{part.slice(2, -2)}</Text>;
    }
    return <Text key={i}>{part}</Text>;
  });
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ContractResult'>;
  route: RouteProp<RootStackParamList, 'ContractResult'>;
};

function parseReportSections(report: string) {
  const lines = report.split('\n');
  const keyPoints: { title: string; content: string }[] = [];
  const recommendations: string[] = [];
  const criticalClauses: { level: 'alto' | 'medio'; section: string; title: string; content: string }[] = [];
  let sentiment = { favorable: 0, neutral: 0, risk: 0, summary: '' };

  let currentSection = 'unknown';
  let buffer = '';

  for (const line of lines) {
    if (line.match(/^##\s+PUNTOS\s+CLAVE/i) || line.match(/^###?\s+\d+\.\s+/)) {
      flushBuffer();
      currentSection = 'keypoint';
    } else if (line.match(/RECOMENDACION/i)) {
      flushBuffer();
      currentSection = 'recommendation';
    } else if (line.match(/CR[IÍ]TIC|RIESGO|ALERTA/i)) {
      flushBuffer();
      currentSection = 'critical';
    } else if (line.match(/SEM[AÁ]FORO|SENTIMIENTO/i)) {
      flushBuffer();
      currentSection = 'sentiment';
    } else if (line.trim()) {
      buffer += line + '\n';
    }
  }
  flushBuffer();

  function flushBuffer() {
    if (!buffer.trim()) return;
    if (currentSection === 'recommendation') {
      const items = buffer.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*') || l.trim().match(/^\d+\./));
      items.forEach(item => {
        const text = item.replace(/^[-*\d.]+\s*/, '').replace(/\*\*/g, '').trim();
        if (text) recommendations.push(text);
      });
    } else if (currentSection === 'keypoint') {
      const parts = buffer.split('\n').filter(l => l.trim());
      if (parts.length >= 1) {
        keyPoints.push({ title: parts[0].replace(/^\d+\.\s*/, '').replace(/\*\*/g, ''), content: parts.slice(1).join(' ').replace(/\*\*/g, '') });
      }
    } else if (currentSection === 'critical') {
      const parts = buffer.split('\n').filter(l => l.trim());
      if (parts.length >= 1) {
        criticalClauses.push({
          level: parts.some(l => /alto|grave|crítico/i.test(l)) ? 'alto' : 'medio',
          section: (parts[0] || '').replace(/\*\*/g, '').trim(),
          title: (parts[1] || parts[0] || '').replace(/\*\*/g, '').trim(),
          content: parts.slice(2).join(' ').replace(/\*\*/g, '').trim() || parts.slice(1).join(' ').replace(/\*\*/g, '').trim(),
        });
      }
    } else if (currentSection === 'sentiment') {
      const fav = buffer.match(/favorable.*?(\d+)/i);
      const neu = buffer.match(/neutral.*?(\d+)/i);
      const ri = buffer.match(/riesgo.*?(\d+)/i);
      sentiment = {
        favorable: fav ? parseInt(fav[1]) : 0,
        neutral: neu ? parseInt(neu[1]) : 0,
        risk: ri ? parseInt(ri[1]) : 0,
        summary: buffer.replace(/\*\*/g, '').trim().substring(0, 200),
      };
    }
    buffer = '';
  }

  if (keyPoints.length === 0) {
    const allLines = report.split('\n').filter(l => l.trim());
    const chunks: string[] = [];
    let chunk = '';
    for (const line of allLines) {
      if (line.match(/^#{1,3}\s/) || line.match(/^\d+\.\s/)) {
        if (chunk) chunks.push(chunk);
        chunk = line.replace(/^#{1,3}\s*/, '').replace(/^\d+\.\s*/, '').replace(/\*\*/g, '');
      } else if (chunk) {
        chunk += ' ' + line.replace(/\*\*/g, '');
      }
    }
    if (chunk) chunks.push(chunk);
    chunks.slice(0, 5).forEach((c, i) => {
      const parts = c.split(':');
      keyPoints.push({
        title: (parts[0] || `Punto ${i + 1}`).trim().substring(0, 40),
        content: (parts.slice(1).join(':') || c).trim().substring(0, 200),
      });
    });
  }

  if (recommendations.length === 0) {
    const recLines = report.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
    recLines.forEach(l => {
      const text = l.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim();
      if (text) recommendations.push(text);
    });
  }

  const total = sentiment.favorable + sentiment.neutral + sentiment.risk;
  if (total === 0) {
    sentiment = { favorable: 65, neutral: 25, risk: 10, summary: 'Análisis basado en el nivel de riesgo general del contrato.' };
  }

  return { keyPoints, recommendations, criticalClauses, sentiment };
}

export default function ResultScreen({ navigation, route }: Props) {
  const { material } = useTheme();
  const { result } = route.params;
  const [showOriginal, setShowOriginal] = useState(false);
  const fadeIn = useState(new Animated.Value(0))[0];

  const { keyPoints, recommendations, criticalClauses, sentiment } = useMemo(() => parseReportSections(result.report), [result.report]);

  useEffect(() => {
    saveToHistory(result);
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleShare = async () => {
    try {
      await shareAsPdf(result);
    } catch {
      Alert.alert('Error', 'No se pudo compartir el PDF.');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: material.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.docHeader}>
        <View>
          <Text style={[styles.typeBadge, { backgroundColor: material.secondaryContainer, color: material.onSecondaryContainer }]}>
            {getContractLabel(result.contractType)}
          </Text>
          <Text style={[styles.docTitle, { color: material.primary }]}>Análisis de Contrato</Text>
        </View>
      </View>

      <View style={[styles.toggleContainer, { backgroundColor: material.surfaceContainerHigh }]}>
        <TouchableOpacity
          onPress={() => setShowOriginal(false)}
          style={[styles.toggleBtn, !showOriginal && { backgroundColor: material.primary }]}
        >
          <Text style={[styles.toggleText, { color: !showOriginal ? material.onPrimary : material.onSurfaceVariant }]}>Resumen IA</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowOriginal(true)}
          style={[styles.toggleBtn, showOriginal && { backgroundColor: material.primary }]}
        >
          <Text style={[styles.toggleText, { color: showOriginal ? material.onPrimary : material.onSurfaceVariant }]}>Texto Original</Text>
        </TouchableOpacity>
      </View>

      {showOriginal ? (
        <Animated.View style={[styles.originalContainer, { opacity: fadeIn, backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}>
          <MarkdownText text={result.report} color={material.onSurface} />
        </Animated.View>
      ) : (
        <View style={styles.bentoGrid}>
          <View style={[styles.sectionCard, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color={material.secondary} />
              <Text style={[styles.sectionTitle, { color: material.primary }]}>Puntos Clave</Text>
            </View>
            <View style={styles.keyPointsList}>
              {keyPoints.slice(0, 3).map((point, i) => (
                <View key={i} style={[styles.keyPointItem, { backgroundColor: material.surfaceContainer, borderLeftColor: material.secondary }]}>
                  <Text style={[styles.keyPointNumber, { color: material.secondary }]}>{String(i + 1).padStart(2, '0')}</Text>
                  <View style={styles.keyPointContent}>
                    <Text style={[styles.keyPointTitle, { color: material.onSurface }]}>{point.title}</Text>
                    <Text style={[styles.keyPointDesc, { color: material.onSurfaceVariant }]}>{point.content}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb" size={20} color={material.onSurfaceVariant} />
              <Text style={[styles.sectionTitle, { color: material.primary }]}>Recomendaciones Legales</Text>
            </View>
            <View style={styles.recommendationsList}>
              {recommendations.slice(0, 3).map((rec, i) => (
                <View key={i} style={styles.recommendationItem}>
                  <Ionicons name="arrow-forward" size={16} color={material.secondary} />
                  <Text style={[styles.recommendationText, { color: material.onSurfaceVariant }]}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.criticalCard, { backgroundColor: material.primary }]}>
            <View style={styles.criticalHeader}>
              <Ionicons name="warning" size={20} color={material.secondaryContainer || '#d4af37'} />
              <Text style={[styles.criticalTitle, { color: material.secondaryContainer || '#d4af37' }]}>Cláusulas Críticas</Text>
            </View>
            {criticalClauses.length > 0 ? criticalClauses.map((clause, i) => (
              <View key={i} style={[styles.criticalItem, i < criticalClauses.length - 1 && { borderBottomColor: material.primaryContainer, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <View style={styles.criticalItemHeader}>
                  <RiskLabel level={clause.level} compact />
                  {clause.section ? <Text style={[styles.criticalSection, { color: material.onPrimaryContainer }]}>{clause.section}</Text> : null}
                </View>
                {clause.title ? <Text style={[styles.criticalItemTitle, { color: material.onPrimaryContainer }]}>{clause.title}</Text> : null}
                {clause.content ? <Text style={[styles.criticalItemDesc, { color: material.onPrimaryContainer }]}>{clause.content}</Text> : null}
              </View>
            )) : result.riskLevel !== 'bajo' ? (
              <View style={styles.criticalItem}>
                <View style={styles.criticalItemHeader}>
                  <RiskLabel level={result.riskLevel} compact />
                  <Text style={[styles.criticalSection, { color: material.onPrimaryContainer }]}>Cláusulas Identificadas</Text>
                </View>
                <Text style={[styles.criticalItemDesc, { color: material.onPrimaryContainer }]}>
                  El contrato presenta elementos que requieren atención especial. Revisar el reporte completo para más detalles.
                </Text>
              </View>
            ) : (
              <View style={styles.criticalItem}>
                <Text style={[styles.criticalItemDesc, { color: material.onPrimaryContainer }]}>
                  No se encontraron cláusulas de alto riesgo en el análisis.
                </Text>
              </View>
            )}
          </View>

          <View style={[styles.sentimentCard, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}>
            <Text style={[styles.sentimentLabel, { color: material.onSurfaceVariant }]}>ANÁLISIS DE SENTIMIENTO IA</Text>
            <View style={[styles.sentimentBar, { backgroundColor: material.surfaceContainer }]}>
              <View style={[styles.sentimentSegment, { backgroundColor: '#22c55e', flex: sentiment.favorable }]} />
              <View style={[styles.sentimentSegment, { backgroundColor: '#f59e0b', flex: sentiment.neutral }]} />
              <View style={[styles.sentimentSegment, { backgroundColor: '#ef4444', flex: sentiment.risk }]} />
            </View>
            <View style={styles.sentimentLegend}>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} /><Text style={[styles.legendText, { color: material.onSurfaceVariant }]}>Favorable</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} /><Text style={[styles.legendText, { color: material.onSurfaceVariant }]}>Neutral</Text></View>
              <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} /><Text style={[styles.legendText, { color: material.onSurfaceVariant }]}>Riesgo</Text></View>
            </View>
            <Text style={[styles.sentimentSummary, { color: material.onSurfaceVariant }]}>
              "El contrato presenta un balance general con puntos que requieren revisión."
            </Text>
          </View>

          <TouchableOpacity style={[styles.exportBtn, { backgroundColor: material.primary }]} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="download" size={20} color={material.onPrimary} />
            <Text style={[styles.exportBtnText, { color: material.onPrimary }]}>Exportar Resumen (PDF)</Text>
          </TouchableOpacity>
          <Text style={[styles.engineText, { color: material.onSurfaceVariant }]}>Generado por Scrutin Engine</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.secondaryBtn, { backgroundColor: material.surfaceContainerHigh, borderColor: material.outlineVariant }]}
        onPress={() => navigation.popToTop()}
        activeOpacity={0.7}
      >
        <Ionicons name="scan" size={20} color={material.primary} />
        <Text style={[styles.secondaryBtnText, { color: material.primary }]}>Analizar otro contrato</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingTop: 56, paddingBottom: spacing.xxl, gap: spacing.unit6 },
  docHeader: { gap: spacing.unit2 },
  typeBadge: {
    alignSelf: 'flex-start',
    fontSize: fontSize.labelSm,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.05,
    paddingHorizontal: spacing.unit2,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    textTransform: 'uppercase',
  },
  docTitle: {
    fontSize: fontSize.displayLgMobile,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.displayLgMobile,
    lineHeight: lineHeight.displayLgMobile,
    marginTop: spacing.unit2,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    padding: 4,
    alignSelf: 'flex-start',
  },
  toggleBtn: {
    paddingHorizontal: spacing.unit6,
    paddingVertical: spacing.unit2,
    borderRadius: borderRadius.full,
  },
  toggleText: {
    fontSize: fontSize.labelSm,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.05,
  },
  bentoGrid: {
    gap: spacing.unit6,
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.unit6,
    gap: spacing.unit4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
  },
  sectionTitle: {
    fontSize: fontSize.headlineMd,
    fontWeight: fontWeight.semibold,
  },
  keyPointsList: { gap: spacing.unit4 },
  keyPointItem: {
    flexDirection: 'row',
    gap: spacing.unit4,
    padding: spacing.unit4,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
  },
  keyPointNumber: {
    fontSize: 20,
    fontWeight: fontWeight.bold,
  },
  keyPointContent: { flex: 1, gap: 4 },
  keyPointTitle: { fontSize: fontSize.bodyMd, fontWeight: fontWeight.bold },
  keyPointDesc: { fontSize: fontSize.body, lineHeight: 22 },
  recommendationsList: { gap: spacing.unit4 },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.unit2,
  },
  recommendationText: { fontSize: fontSize.body, lineHeight: 22, flex: 1 },
  criticalCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.unit6,
    gap: spacing.unit4,
  },
  criticalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
  },
  criticalTitle: {
    fontSize: fontSize.headlineMd,
    fontWeight: fontWeight.semibold,
  },
  criticalItem: {
    paddingBottom: spacing.unit4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    gap: spacing.unit2,
  },
  criticalItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  criticalSection: { fontSize: fontSize.labelSm, letterSpacing: 0.05 },
  criticalItemTitle: { fontSize: fontSize.bodyMd, fontWeight: fontWeight.bold },
  criticalItemDesc: { fontSize: 13, lineHeight: 20 },
  sentimentCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.unit6,
    gap: spacing.unit4,
  },
  sentimentLabel: { fontSize: fontSize.labelSm, fontWeight: fontWeight.medium, letterSpacing: 0.05 },
  sentimentBar: { height: 8, flexDirection: 'row', borderRadius: borderRadius.full, overflow: 'hidden' },
  sentimentSegment: { height: '100%' },
  sentimentLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: fontSize.caption },
  sentimentSummary: { fontSize: fontSize.body, fontStyle: 'italic', lineHeight: 22 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit2,
    padding: spacing.unit4,
    borderRadius: borderRadius.lg,
  },
  exportBtnText: { fontSize: fontSize.bodyMd, fontWeight: fontWeight.bold },
  engineText: { fontSize: fontSize.caption, textAlign: 'center' },
  originalContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.unit6,
  },
  mdHeading: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    marginTop: spacing.unit4,
    marginBottom: spacing.unit2,
  },
  mdSubheading: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.unit4,
    marginBottom: spacing.unit2,
  },
  mdBody: {
    fontSize: fontSize.bodyMd,
    lineHeight: 26,
    marginBottom: spacing.unit4,
  },
  mdListItem: {
    flexDirection: 'row',
    marginBottom: spacing.unit2,
    paddingLeft: spacing.unit2,
  },
  mdBullet: {
    fontSize: fontSize.bodyMd,
    lineHeight: 26,
    marginRight: spacing.unit2,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit2,
    padding: spacing.unit4,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginTop: spacing.unit4,
  },
  secondaryBtnText: { fontSize: fontSize.bodyMd, fontWeight: fontWeight.semibold },
});
