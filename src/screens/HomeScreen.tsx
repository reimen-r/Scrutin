import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { CONTRACT_TYPES, ContractTypeOption, ICON_MAP } from '../types/contract';
import { spacing, fontSize, fontWeight, borderRadius, shadow, letterSpacing, lineHeight } from '../theme/tokens';
import AnimatedPressable from '../components/AnimatedPressable';
import TopAppBar from '../components/TopAppBar';
import { useFocusEffect } from '@react-navigation/native';
import { getHistory } from '../services/historyService';
import { HistoryItem } from '../types/contract';
import { SkeletonCard, SkeletonCardRow } from '../components/Skeleton';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { material } = useTheme();
  const [recentDocs, setRecentDocs] = useState<HistoryItem[]>([]);
  const [showContractPicker, setShowContractPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const items = await getHistory();
    setRecentDocs(items.slice(0, 3));
    setLoading(false);
  }, []);

  const contractTypes = useMemo(() => CONTRACT_TYPES, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleScanDocument = (contract: ContractTypeOption) => {
    setShowContractPicker(false);
    navigation.navigate('Scanner', { contractType: contract.id, contractLabel: contract.label });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: material.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={material.primary} />
      }
    >
      <TopAppBar />

      <View style={styles.body}>
        <View style={styles.welcomeSection}>
          <Text style={[styles.displayTitle, { color: material.primary }]}>Panel Principal</Text>
          <Text style={[styles.subtitle, { color: material.onSurfaceVariant }]}>
            Bienvenido de nuevo. Gestione sus procesos legales con precisión digital.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: material.onSurface }]}>Acceso Rápido</Text>
          <View style={styles.quickAccessGrid}>
            <AnimatedPressable
              onPress={() => setShowContractPicker(true)}
              style={[styles.quickAccessCard, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: material.primaryContainer }]}>
                <Ionicons name="scan" size={28} color={material.onPrimaryContainer} />
              </View>
              <Text style={[styles.quickAccessTitle, { color: material.primary }]}>Escanear Documento</Text>
              <Text style={[styles.quickAccessDesc, { color: material.onSurfaceVariant }]}>OCR de alta precisión</Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => setShowContractPicker(true)}
              style={[styles.quickAccessCard, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}
            >
              <View style={[styles.quickAccessIcon, { backgroundColor: material.secondaryContainer }]}>
                <Ionicons name="images" size={24} color={material.onSecondaryContainer} />
              </View>
              <Text style={[styles.quickAccessTitle, { color: material.primary }]}>Galería</Text>
              <Text style={[styles.quickAccessDesc, { color: material.onSurfaceVariant }]}>Importar del carrete</Text>
            </AnimatedPressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: material.onSurface }]}>Documentos Recientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ContractHistory')}>
              <Text style={[styles.viewAll, { color: material.secondary }]}>VER TODOS</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.recentList, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}>
            {loading ? (
              <SkeletonCardRow count={3} />
            ) : recentDocs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={32} color={material.outline} />
                <Text style={[styles.emptyText, { color: material.onSurfaceVariant }]}>Sin documentos recientes</Text>
              </View>
            ) : (
              recentDocs.map((doc, index) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.recentItem, index < recentDocs.length - 1 && { borderBottomColor: material.outlineVariant, borderBottomWidth: StyleSheet.hairlineWidth }]}
                  onPress={() => navigation.navigate('ContractResult', { result: doc.result })}
                >
                  <View style={styles.recentItemLeft}>
                    <View style={[styles.recentIcon, { backgroundColor: material.surfaceContainerHigh }]}>
                      <Ionicons name={ICON_MAP[doc.contractType] as any || 'document-outline'} size={20} color={material.primary} />
                    </View>
                    <View>
                      <Text style={[styles.recentTitle, { color: material.onSurface }]}>{doc.contractLabel}</Text>
                      <Text style={[styles.recentDate, { color: material.onSurfaceVariant }]}>{doc.date}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={material.onSurfaceVariant} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        <AnimatedPressable
          onPress={() => navigation.navigate('Scanner', { contractType: 'compra-venta', contractLabel: 'Analizar Contrato' })}
          style={[styles.promoCard, { backgroundColor: material.primaryContainer }]}
        >
          <View style={styles.promoOverlay}>
            <Text style={[styles.promoTitle, { color: material.onPrimaryContainer }]}>Optimice su Flujo Legal</Text>
            <Text style={[styles.promoDesc, { color: material.onPrimaryContainer }]}>
              Utilice la IA para resumir documentos complejos en segundos.
            </Text>
          </View>
        </AnimatedPressable>
      </View>

      <Modal visible={showContractPicker} transparent animationType="fade" onRequestClose={() => setShowContractPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowContractPicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: material.surfaceContainerLowest }]}>
            <Text style={[styles.modalTitle, { color: material.onSurface }]}>Seleccionar Tipo de Contrato</Text>
            {contractTypes.map(contract => (
              <TouchableOpacity
                key={contract.id}
                style={[styles.modalItem, { borderBottomColor: material.outlineVariant }]}
                onPress={() => handleScanDocument(contract)}
              >
                <View style={[styles.modalIcon, { backgroundColor: material.secondaryContainer }]}>
                  <Ionicons name={contract.icon as any} size={22} color={material.onSecondaryContainer} />
                </View>
                <Text style={[styles.modalItemText, { color: material.onSurface }]}>{contract.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  body: { padding: spacing.gutter, gap: spacing.unit8 },
  welcomeSection: { gap: spacing.unit2 },
  displayTitle: {
    fontSize: fontSize.displayLgMobile,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.displayLgMobile,
    lineHeight: lineHeight.displayLgMobile,
  },
  subtitle: {
    fontSize: fontSize.bodyMd,
    lineHeight: lineHeight.bodyMd,
    maxWidth: 400,
  },
  section: { gap: spacing.unit4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semibold,
  },
  viewAll: {
    fontSize: fontSize.labelSm,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.05,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.unit4,
  },
  quickAccessCard: {
    flex: 1,
    minWidth: 100,
    padding: spacing.unit6,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.unit4,
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAccessTitle: {
    fontSize: fontSize.bodyMd,
    fontWeight: fontWeight.bold,
  },
  quickAccessDesc: {
    fontSize: fontSize.caption,
    lineHeight: 16,
  },
  recentList: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyState: {
    padding: spacing.unit8,
    alignItems: 'center',
    gap: spacing.unit2,
  },
  emptyText: {
    fontSize: fontSize.body,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.unit4,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit4,
    flex: 1,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentTitle: {
    fontSize: fontSize.bodyMd,
    fontWeight: fontWeight.semibold,
  },
  recentDate: {
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  promoCard: {
    borderRadius: borderRadius.lg,
    height: 192,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  promoOverlay: {
    padding: spacing.unit6,
    gap: spacing.unit2,
  },
  promoTitle: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.bold,
  },
  promoDesc: {
    fontSize: fontSize.caption,
    maxWidth: 300,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.gutter,
    paddingBottom: spacing.unit16,
    gap: spacing.unit2,
  },
  modalTitle: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.unit4,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit4,
    paddingVertical: spacing.unit4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalItemText: {
    fontSize: fontSize.bodyMd,
    fontWeight: fontWeight.medium,
  },
});
