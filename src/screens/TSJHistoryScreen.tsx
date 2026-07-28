import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { TSJHistoryItem } from '../types/contract';
import { getTSJHistory, clearTSJHistory, removeTSJHistoryItem } from '../services/historyService';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme/tokens';
import TopAppBar from '../components/TopAppBar';
import Toast from '../components/Toast';
import { SkeletonCardRow } from '../components/Skeleton';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TSJHistory'>;
};

export default function TSJHistoryScreen({ navigation }: Props) {
  const { material } = useTheme();
  const [history, setHistory] = useState<TSJHistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const loadData = useCallback(async () => {
    const items = await getTSJHistory();
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

  const handleClear = () => {
    Alert.alert('Limpiar historial', '¿Eliminar todas las sentencias guardadas?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await clearTSJHistory();
          setHistory([]);
          setToast({ visible: true, message: 'Historial eliminado', type: 'success' });
        },
      },
    ]);
  };

  const handleDeleteItem = (item: TSJHistoryItem) => {
    Alert.alert(
      'Eliminar',
      `¿Eliminar "${item.result.expediente}" del historial?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await removeTSJHistoryItem(item.id);
            setHistory(prev => prev.filter(h => h.id !== item.id));
            setToast({ visible: true, message: 'Eliminado del historial', type: 'success' });
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: TSJHistoryItem }) => {
    const preview = [item.result.expediente, item.result.decision].filter(Boolean).join(' · ') || 'Sentencia TSJ';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('TSJResult', { result: item.result })}
        onLongPress={() => handleDeleteItem(item)}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.iconCircle, { backgroundColor: material.surfaceContainerHigh }]}>
            <Ionicons name="scale-outline" size={20} color={material.primary} />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: material.onSurface }]} numberOfLines={1}>{preview}</Text>
            <Text style={[styles.cardDate, { color: material.onSurfaceVariant }]}>{item.date}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={material.onSurfaceVariant} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: material.background }]}>
      <TopAppBar
        title="Sentencias TSJ"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={history.length > 0 ? { icon: 'trash-outline', onPress: handleClear, label: 'Limpiar' } : undefined}
      />

      {loading ? (
        <SkeletonCardRow count={5} />
      ) : history.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color={material.outline} />
          <Text style={[styles.emptyText, { color: material.onSurfaceVariant }]}>No hay sentencias guardadas</Text>
        </View>
      ) : (
        <FlatList
          data={history}
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: fontSize.bodyMd, fontWeight: fontWeight.semibold },
  cardDate: { fontSize: fontSize.caption, marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.unit4 },
  emptyText: { fontSize: fontSize.body },
});
