import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useNavigation, CompositeNavigationProp, useNavigationState } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius, shadow } from '../theme/tokens';
import TopAppBar from '../components/TopAppBar';
import FileCard from '../components/FileCard';
import { getHistory, getTSJHistory } from '../services/historyService';
import { HistoryItem, TSJHistoryItem } from '../types/contract';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, TabStackParamList } from '../navigation/AppNavigator';
import { SkeletonCard } from '../components/Skeleton';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

type TabKey = 'local' | 'tsj';

export default function FilesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { material } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('local');
  const [contractHistory, setContractHistory] = useState<HistoryItem[]>([]);
  const [tsjHistory, setTSJHistory] = useState<TSJHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [contracts, tsj] = await Promise.all([getHistory(), getTSJHistory()]);
    setContractHistory(contracts);
    setTSJHistory(tsj);
    setLoading(false);
  }, []);

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

  const filteredContracts = contractHistory.filter(item =>
    item.contractLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTSJ = tsjHistory.filter(item =>
    item.result.expediente.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.result.decision.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: material.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={material.primary} />
      }
    >
      <TopAppBar title="Files" />

      <View style={styles.body}>
        <View style={[styles.searchContainer, { backgroundColor: material.surfaceContainer, borderColor: material.outlineVariant }]}>
          <Ionicons name="search" size={18} color={material.outline} />
          <TextInput
            style={[styles.searchInput, { color: material.onSurface }]}
            placeholder="Buscar documentos..."
            placeholderTextColor={material.onSurfaceVariant + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={[styles.tabContainer, { backgroundColor: material.surfaceContainerHigh }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('local')}
            style={[styles.tab, activeTab === 'local' && { backgroundColor: material.surfaceContainerLowest }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'local' ? material.primary : material.onSurfaceVariant }, activeTab === 'local' && { fontWeight: fontWeight.bold }]}>
              Contratos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('tsj')}
            style={[styles.tab, activeTab === 'tsj' && { backgroundColor: material.surfaceContainerLowest }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'tsj' ? material.primary : material.onSurfaceVariant }, activeTab === 'tsj' && { fontWeight: fontWeight.bold }]}>
              Sentencias TSJ
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.fileGrid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : activeTab === 'local' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="folder" size={20} color={material.primary} />
              <Text style={[styles.sectionTitle, { color: material.primary }]}>Contratos Analizados</Text>
            </View>

            {filteredContracts.length === 0 ? (
              <View style={[styles.emptyState, { borderColor: material.outlineVariant }]}>
                <View style={[styles.emptyIconContainer, { backgroundColor: material.primaryContainer }]}>
                  <Ionicons name="document-text-outline" size={48} color={material.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: material.onSurface }]}>Sin documentos</Text>
                <Text style={[styles.emptyDesc, { color: material.onSurfaceVariant }]}>
                  Escanear o importar contratos para verlos aquí
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: material.primary }]}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'ScanTab' })}
                >
                  <Ionicons name="scan" size={18} color={material.onPrimary} />
                  <Text style={[styles.emptyButtonText, { color: material.onPrimary }]}>Escanear ahora</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.fileGrid}>
                {filteredContracts.map(item => (
                  <FileCard
                    key={item.id}
                    name={item.contractLabel}
                    type="pdf"
                    date={item.date}
                    onPress={() => navigation.navigate('ContractResult', { result: item.result })}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="folder" size={20} color={material.primary} />
              <Text style={[styles.sectionTitle, { color: material.primary }]}>Sentencias TSJ</Text>
            </View>

            {filteredTSJ.length === 0 ? (
              <View style={[styles.emptyState, { borderColor: material.outlineVariant }]}>
                <View style={[styles.emptyIconContainer, { backgroundColor: material.secondaryContainer }]}>
                  <Ionicons name="scale-outline" size={48} color={material.secondary} />
                </View>
                <Text style={[styles.emptyTitle, { color: material.onSurface }]}>Sin sentencias</Text>
                <Text style={[styles.emptyDesc, { color: material.onSurfaceVariant }]}>
                  Escanear sentencias del TSJ para verlas aquí
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: material.secondary }]}
                  onPress={() => navigation.navigate('TSJScanner')}
                >
                  <Ionicons name="scan" size={18} color={material.onSecondary} />
                  <Text style={[styles.emptyButtonText, { color: material.onSecondary }]}>Escanear sentencia</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.fileGrid}>
                {filteredTSJ.map(item => (
                  <FileCard
                    key={item.id}
                    name={item.result.expediente}
                    type="pdf"
                    date={item.date}
                    onPress={() => navigation.navigate('TSJResult', { result: item.result })}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  body: {
    padding: spacing.gutter,
    gap: spacing.unit6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.unit4,
    paddingVertical: spacing.unit2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.unit2,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.bodyMd,
    paddingVertical: spacing.unit2,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.unit2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  tabText: {
    fontSize: fontSize.labelSm,
    letterSpacing: 0.05,
  },
  section: { gap: spacing.unit4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
  },
  sectionTitle: {
    fontSize: fontSize.headlineMd,
    fontWeight: fontWeight.semibold,
  },
  fileGrid: {
    gap: spacing.unit4,
  },
  emptyState: {
    padding: spacing.unit16,
    alignItems: 'center',
    gap: spacing.unit4,
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semibold,
  },
  emptyDesc: {
    fontSize: fontSize.body,
    textAlign: 'center',
    maxWidth: 300,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    paddingHorizontal: spacing.unit6,
    paddingVertical: spacing.unit2,
    borderRadius: borderRadius.full,
    marginTop: spacing.unit2,
  },
  emptyButtonText: {
    fontSize: fontSize.bodyMd,
    fontWeight: fontWeight.semibold,
  },
});
