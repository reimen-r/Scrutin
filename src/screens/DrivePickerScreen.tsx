import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme/tokens';
import TopAppBar from '../components/TopAppBar';
import LoadingOverlay from '../components/LoadingOverlay';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  getAuthRequest,
  getRedirectUri,
  exchangeCode,
  listDriveFiles,
  downloadDriveFile,
  DriveFile,
  getFileTypeLabel,
} from '../services/googleDriveService';
import { analyzeContractImage } from '../services/geminiService';
import { CONTRACT_TYPES, ContractType } from '../types/contract';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FilterKey = 'all' | 'pdf' | 'image';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pdf', label: 'PDF' },
  { key: 'image', label: 'Imágenes' },
];

export default function DrivePickerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { material } = useTheme();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedContractType, setSelectedContractType] = useState<ContractType>('alquiler');
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [pendingFile, setPendingFile] = useState<DriveFile | null>(null);

  const handleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingMessage('Iniciando sesión con Google...');

      const request = getAuthRequest();
      const redirectUri = getRedirectUri();

      const result = await request.promptAsync({ useProxy: true } as any);

      if (result.type === 'success' && result.params.code) {
        const codeVerifier = request.codeVerifier || '';
        const token = await exchangeCode(result.params.code, codeVerifier);
        setAccessToken(token);
        await loadFiles(token);
      } else if (result.type === 'error') {
        Alert.alert('Error', result.error?.message || 'Error al autenticar con Google');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFiles = async (token: string, pageToken?: string) => {
    try {
      if (pageToken) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setLoadingMessage('Cargando archivos de Drive...');
      }
      const result = await listDriveFiles(token, searchQuery || undefined, pageToken);
      if (pageToken) {
        setFiles(prev => [...prev, ...result.files]);
      } else {
        setFiles(result.files);
      }
      setNextPageToken(result.nextPageToken);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = () => {
    if (accessToken) {
      loadFiles(accessToken);
    }
  };

  const handleLoadMore = () => {
    if (accessToken && nextPageToken && !loadingMore) {
      loadFiles(accessToken, nextPageToken);
    }
  };

  const handleFilePress = (file: DriveFile) => {
    setPendingFile(file);
    setShowTypePicker(true);
  };

  const handleAnalyzeWithType = async (contractType: ContractType) => {
    if (!accessToken || !pendingFile) return;
    setShowTypePicker(false);
    setPendingFile(null);

    try {
      setLoading(true);
      setLoadingMessage('Descargando archivo de Drive...');
      const { base64, mimeType } = await downloadDriveFile(accessToken, pendingFile.id);
      setLoadingMessage('Analizando con IA...');
      const result = await analyzeContractImage(contractType, base64, mimeType);
      navigation.replace('ContractResult', { result });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al procesar archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    setAccessToken(null);
    setFiles([]);
  };

  const filteredFiles = files.filter(file => {
    if (activeFilter === 'pdf') return file.mimeType === 'application/pdf';
    if (activeFilter === 'image') return file.mimeType.startsWith('image/');
    return true;
  });

  const renderFile = ({ item }: { item: DriveFile }) => {
    const typeLabel = getFileTypeLabel(item.mimeType);
    const icon = typeLabel === 'pdf' ? 'document-text' : 'image';
    const iconColor = typeLabel === 'pdf' ? '#ef4444' : '#22c55e';
    const size = item.size ? `${(parseInt(item.size) / 1024).toFixed(0)} KB` : '';

    return (
      <TouchableOpacity
        style={[styles.fileRow, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}
        onPress={() => handleFilePress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.fileIcon, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>
        <View style={styles.fileInfo}>
          <Text style={[styles.fileName, { color: material.onSurface }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.fileMeta, { color: material.onSurfaceVariant }]}>
            {size} · {new Date(item.modifiedTime).toLocaleDateString('es-ES')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={material.onSurfaceVariant} />
      </TouchableOpacity>
    );
  };

  if (!accessToken) {
    return (
      <View style={[styles.container, { backgroundColor: material.background }]}>
        <TopAppBar showBack onBack={() => navigation.goBack()} title="Google Drive" />

        <View style={styles.signInContainer}>
          <View style={[styles.signInCard, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}>
            <View style={[styles.signInIcon, { backgroundColor: '#4285F415' }]}>
              <Ionicons name="logo-google" size={48} color="#4285F4" />
            </View>
            <Text style={[styles.signInTitle, { color: material.onSurface }]}>Conectar con Google Drive</Text>
            <Text style={[styles.signInDesc, { color: material.onSurfaceVariant }]}>
              Acceda a sus documentos PDF e imágenes almacenados en Google Drive para análisis con IA
            </Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color="white" />
              <Text style={styles.signInButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && <LoadingOverlay message={loadingMessage} />}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: material.background }]}>
      <TopAppBar
        showBack
        onBack={() => navigation.goBack()}
        title="Google Drive"
        rightAction={{ icon: 'log-out-outline', onPress: handleSignOut, label: 'Cerrar sesión' }}
      />

      <View style={styles.body}>
        <View style={[styles.searchContainer, { backgroundColor: material.surfaceContainer, borderColor: material.outlineVariant }]}>
          <Ionicons name="search" size={18} color={material.outline} />
          <TextInput
            style={[styles.searchInput, { color: material.onSurface }]}
            placeholder="Buscar archivos..."
            placeholderTextColor={material.onSurfaceVariant + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeFilter === filter.key ? material.primary : material.surfaceContainerHigh,
                  borderColor: activeFilter === filter.key ? material.primary : material.outlineVariant,
                },
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: activeFilter === filter.key ? material.onPrimary : material.onSurfaceVariant },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && files.length === 0 ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={material.primary} />
            <Text style={[styles.loadingText, { color: material.onSurfaceVariant }]}>{loadingMessage}</Text>
          </View>
        ) : filteredFiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-outline" size={48} color={material.outline} />
            <Text style={[styles.emptyTitle, { color: material.onSurface }]}>Sin archivos</Text>
            <Text style={[styles.emptyDesc, { color: material.onSurfaceVariant }]}>
              No se encontraron archivos PDF o imágenes en su Drive
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredFiles}
            keyExtractor={item => item.id}
            renderItem={renderFile}
            contentContainerStyle={styles.fileList}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadMore}>
                  <ActivityIndicator size="small" color={material.primary} />
                </View>
              ) : null
            }
          />
        )}
      </View>

      {loading && <LoadingOverlay message={loadingMessage} />}

      <Modal visible={showTypePicker} transparent animationType="fade" onRequestClose={() => setShowTypePicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTypePicker(false)}>
          <View style={[styles.modalContent, { backgroundColor: material.surfaceContainerLowest }]}>
            <Text style={[styles.modalTitle, { color: material.onSurface }]}>Tipo de Contrato</Text>
            {CONTRACT_TYPES.map(contract => (
              <TouchableOpacity
                key={contract.id}
                style={[styles.modalItem, { borderBottomColor: material.outlineVariant }]}
                onPress={() => handleAnalyzeWithType(contract.id)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  signInContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.gutter },
  signInCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.unit8,
    alignItems: 'center',
    gap: spacing.unit4,
    maxWidth: 340,
    width: '100%',
  },
  signInIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInTitle: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  signInDesc: {
    fontSize: fontSize.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: spacing.unit2,
  },
  signInButtonText: { color: 'white', fontWeight: '600', fontSize: 15 },
  body: { flex: 1, padding: spacing.gutter, gap: spacing.unit4 },
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
  filterRow: {
    flexDirection: 'row',
    gap: spacing.unit2,
  },
  filterChip: {
    paddingHorizontal: spacing.unit4,
    paddingVertical: spacing.unit2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: fontSize.labelSm,
    fontWeight: fontWeight.medium,
  },
  fileList: { gap: spacing.unit2 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.unit4,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.unit4,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: { flex: 1, gap: 2 },
  fileName: {
    fontSize: fontSize.bodyMd,
    fontWeight: fontWeight.medium,
  },
  fileMeta: {
    fontSize: fontSize.body,
  },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.unit4 },
  loadingText: { fontSize: fontSize.body },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.unit4 },
  emptyTitle: { fontSize: fontSize.bodyLg, fontWeight: fontWeight.semibold },
  emptyDesc: { fontSize: fontSize.body, textAlign: 'center', maxWidth: 300 },
  loadMore: { paddingVertical: spacing.unit4 },
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
