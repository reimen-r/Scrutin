import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalysisResult, HistoryItem, TSJExtractionResult, TSJHistoryItem, getContractLabel } from '../types/contract';

const CONTRACT_KEY = 'contract_history';
const TSJ_KEY = 'tsj_history';

export async function saveToHistory(result: AnalysisResult): Promise<void> {
  const history = await getHistory();
  const item: HistoryItem = {
    id: Date.now().toString(),
    date: new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    contractType: result.contractType,
    contractLabel: getContractLabel(result.contractType),
    result,
  };
  history.unshift(item);
  const keep = history.slice(0, 30);
  await AsyncStorage.setItem(CONTRACT_KEY, JSON.stringify(keep));
}

export async function getHistory(): Promise<HistoryItem[]> {
  const raw = await AsyncStorage.getItem(CONTRACT_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function removeHistoryItem(id: string): Promise<void> {
  const history = await getHistory();
  const filtered = history.filter(item => item.id !== id);
  await AsyncStorage.setItem(CONTRACT_KEY, JSON.stringify(filtered));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(CONTRACT_KEY);
}

export async function saveTSJToHistory(result: TSJExtractionResult): Promise<void> {
  const history = await getTSJHistory();
  const item: TSJHistoryItem = {
    id: Date.now().toString(),
    date: new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    result,
  };
  history.unshift(item);
  const keep = history.slice(0, 30);
  await AsyncStorage.setItem(TSJ_KEY, JSON.stringify(keep));
}

export async function getTSJHistory(): Promise<TSJHistoryItem[]> {
  const raw = await AsyncStorage.getItem(TSJ_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function removeTSJHistoryItem(id: string): Promise<void> {
  const history = await getTSJHistory();
  const filtered = history.filter(item => item.id !== id);
  await AsyncStorage.setItem(TSJ_KEY, JSON.stringify(filtered));
}

export async function clearTSJHistory(): Promise<void> {
  await AsyncStorage.removeItem(TSJ_KEY);
}

export async function toggleStar(id: string): Promise<HistoryItem[]> {
  const history = await getHistory();
  const updated = history.map(item =>
    item.id === id ? { ...item, starred: !item.starred } : item,
  );
  await AsyncStorage.setItem(CONTRACT_KEY, JSON.stringify(updated));
  return updated;
}
