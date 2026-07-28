import { useState, useRef } from 'react';
import { Alert, Animated, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { shouldCompress, estimateSize } from '../utils/imageCompression';

interface ProcessParams {
  base64: string;
  mimeType: string;
}

type ProcessDocument = (params: ProcessParams) => Promise<void>;

function useCameraUnavailable() {
  const [permission] = useState<any>(null);
  return { permission, requestPermission: async () => ({ granted: false } as any), cameraRef: { current: null } };
}

function useCameraAvailable() {
  const { CameraView, useCameraPermissions } = require('expo-camera');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  return { permission, requestPermission, cameraRef, CameraView };
}

export function useDocumentScanner(processDocument: ProcessDocument) {
  const isWeb = Platform.OS === 'web';
  const camera = isWeb ? useCameraUnavailable() : useCameraAvailable();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [flashActive, setFlashActive] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastScale = useRef(new Animated.Value(0.9)).current;

  const { permission, requestPermission, cameraRef } = camera;

  const showSuccessToast = () => {
    setShowToast(true);
    Animated.parallel([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(toastScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(toastScale, { toValue: 0.9, duration: 300, useNativeDriver: true }),
      ]).start(() => setShowToast(false));
    }, 2000);
  };

  const runProcess = async (base64: string, mimeType: string) => {
    if (shouldCompress(base64)) {
      Alert.alert(
        'Imagen grande',
        `El archivo (${estimateSize(base64)}) supera el tamaño recomendado de 10MB. ` +
        'Puede experimentar tiempos de carga más largos. Considere usar una imagen con menor resolución.'
      );
    }
    setLoading(true);
    try {
      await processDocument({ base64, mimeType });
      showSuccessToast();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const takePicture = async () => {
    if (isWeb) return;
    const { CameraView: CV } = require('expo-camera');
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permiso necesario', 'Se necesita acceso a la cámara.');
        return;
      }
    }
    try {
      const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.8 });
      if (photo?.base64) {
        await runProcess(photo.base64, 'image/jpeg');
      }
    } catch {
      Alert.alert('Error', 'No se pudo tomar la foto.');
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso necesario', 'Se necesita acceso a la galería.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset.base64) {
        await runProcess(asset.base64, asset.mimeType || 'image/jpeg');
      } else if (asset.uri) {
        setLoading(true);
        setLoadingMessage('Procesando imagen...');
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
        await runProcess(base64, asset.mimeType || 'image/jpeg');
      }
    } catch {
      Alert.alert('Error', 'Error al seleccionar imagen.');
      setLoading(false);
    }
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const file = result.assets[0];
      setLoading(true);
      setLoadingMessage('Leyendo PDF...');
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
      await runProcess(base64, 'application/pdf');
    } catch {
      Alert.alert('Error', 'Error al seleccionar PDF.');
      setLoading(false);
    }
  };

  return {
    cameraRef,
    loading,
    loadingMessage,
    setLoadingMessage,
    permission,
    requestPermission,
    flashActive,
    setFlashActive,
    showToast,
    toastOpacity,
    toastScale,
    takePicture,
    pickImage,
    pickPdf,
    setLoading,
  };
}
