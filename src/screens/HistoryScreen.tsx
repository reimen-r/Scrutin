import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { HistoryItem, ICON_MAP, CONTRACT_TYPES } from '../types/contract';
import { getHistory, clearHistory, removeHistoryItem, toggleStar } from '../services/historyService';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme/tokens';
import TopAppBar from '../components/TopAppBar';
import Toast from '../components/Toast';
import { SkeletonCardRow } from '../components/Skeleton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ContractHistory'>;
};

export default function HistoryScreen({ navigation }: Props) {
  const { material } = useTheme();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  const loadData = useCallback(async () => {
    const items = await getHistory();
    setHistory(items);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredHistory = history.filter(item => {
    if (showFavoritesOnly && !item.starred) return false;
    if (selectedType !== 'all' && item.contractType !== selectedType) return false;
    return true;
  });

  const handleClear = () => {
    Alert.alert('Limpiar historial', '¿Eliminar todos los análisis guardados?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setHistory([]);
          setToast({ visible: true, message: 'Historial eliminado', type: 'success' });
        },
      },
    ]);
  };

  const handleDeleteItem = (item: HistoryItem) => {
    Alert.alert('Eliminar', `¿Eliminar "${item.contractLabel}" del historial?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await removeHistoryItem(item.id);
          setHistory(prev => prev.filter(h => h.id !== item.id));
          setToast({ visible: true, message: 'Eliminado del historial', type: 'success' });
        },
      },
    ]);
  };

  const handleToggleStar = async (item: HistoryItem) => {
    await toggleStar(item.id);
    setHistory(prev => prev.map(h => h.id === item.id ? { ...h, starred: !h.starred } : h));
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ContractResult', { result: item.result })}
      onLongPress={() => handleDeleteItem(item)}
    >
      <TouchableOpacity onPress={() => handleToggleStar(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name={item.starred ? 'star' : 'star-outline'} size={20} color={item.starred ? '#f59e0b' : material.outline} />
      </TouchableOpacity>
      <View style={styles.cardLeft}>
        <View style={[styles.iconCircle, { backgroundColor: material.surfaceContainerHigh }]}>
          <Ionicons name={ICON_MAP[item.contractType] as any || 'document-outline'} size={20} color={material.primary} />
        </View>
        <View>
          <Text style={[styles.cardTitle, { color: material.onSurface }]}>{item.contractLabel}</Text>
          <Text style={[styles.cardDate, { color: material.onSurfaceVariant }]}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.riskDot, { backgroundColor: item.result.riskLevel === 'bajo' ? '#22c55e' : item.result.riskLevel === 'medio' ? '#f59e0b' : '#ef4444' }]} />
        <Ionicons name="chevron-forward" size={18} color={material.onSurfaceVariant} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: material.background }]}>
      <TopAppBar
        title="Historial"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={history.length > 0 ? { icon: 'trash-outline', onPress: handleClear, label: 'Limpiar' } : undefined}
      />

      {!loading && history.length > 0 && (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, { backgroundColor: showFavoritesOnly ? material.primary : material.surfaceContainerHigh, borderColor: showFavoritesOnly ? material.primary : material.outlineVariant }]}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Ionicons name="star" size={14} color={showFavoritesOnly ? material.onPrimary : material.onSurfaceVariant} />
            <Text style={[styles.filterText, { color: showFavoritesOnly ? material.onPrimary : material.onSurfaceVariant }]}>Favoritos</Text>
          </TouchableOpacity>
          {CONTRACT_TYPES.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[styles.filterChip, { backgroundColor: selectedType === type.id ? material.primary : material.surfaceContainerHigh, borderColor: selectedType === type.id ? material.primary : material.outlineVariant }]}
              onPress={() => setSelectedType(selectedType === type.id ? 'all' : type.id)}
            >
              <Text style={[styles.filterText, { color: selectedType === type.id ? material.onPrimary : material.onSurfaceVariant }]}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <SkeletonCardRow count={5} />
      ) : filteredHistory.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color={material.outline} />
          <Text style={[styles.emptyText, { color: material.onSurfaceVariant }]}>
            {showFavoritesOnly || selectedType !== 'all' ? 'No hay resultados con los filtros actuales' : 'No hay análisis guardados'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          getItemLayout={(_, index) => ({
            length: 72,
            offset: 72 * index,
            index,
          })}
          windowSize={11}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews
        />
      )}

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.gutter, gap: spacing.unit2 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.unit4,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.unit4, flex: 1 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.unit2 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: fontSize.bodyMd, fontWeight: fontWeight.semibold },
  cardDate: { fontSize: fontSize.caption, marginTop: 2 },
  riskDot: { width: 10, height: 10, borderRadius: 5 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.unit4 },
  emptyText: { fontSize: fontSize.body },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.unit2,
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.unit2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: spacing.unit1,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: fontSize.labelSm,
    fontWeight: fontWeight.medium,
  },
});
