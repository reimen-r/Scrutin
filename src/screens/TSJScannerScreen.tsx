import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { analyzeTSJDocument } from '../services/geminiService';
import { useDocumentScanner } from '../hooks/useDocumentScanner';
import LoadingOverlay from '../components/LoadingOverlay';
import ScanLine from '../components/ScanLine';
import { spacing, borderRadius } from '../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TSJScanner'>;
};

function WebPicker({ navigation, onPickImage, onPickPdf }: {
  navigation: any;
  onPickImage: () => void;
  onPickPdf: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.webPicker}>
        <View style={styles.webPickerIcon}>
          <Ionicons name="document-text" size={64} color="#e6f4fe" />
        </View>
        <Text style={styles.webPickerTitle}>Seleccionar sentencia</Text>
        <Text style={styles.webPickerDesc}>
          Elige una imagen o PDF de una sentencia del TSJ
        </Text>
        <View style={styles.webPickerButtons}>
          <TouchableOpacity style={styles.webButton} onPress={onPickImage} activeOpacity={0.7}>
            <Ionicons name="images" size={22} color="#fff" />
            <Text style={styles.webButtonText}>Galería</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.webButton} onPress={onPickPdf} activeOpacity={0.7}>
            <Ionicons name="document-text" size={22} color="#fff" />
            <Text style={styles.webButtonText}>PDF</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.webBack}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TSJScannerScreen({ navigation }: Props) {
  const processDocument = async ({ base64, mimeType }: { base64: string; mimeType: string }) => {
    const result = await analyzeTSJDocument(base64, mimeType);
    setTimeout(() => navigation.replace('TSJResult', { result }), 1500);
  };

  const {
    cameraRef, loading, loadingMessage, setLoadingMessage,
    permission, requestPermission, flashActive, setFlashActive,
    showToast, toastOpacity, toastScale, takePicture, pickImage, pickPdf,
  } = useDocumentScanner(processDocument);

  if (Platform.OS === 'web') {
    return (
      <>
        <WebPicker navigation={navigation} onPickImage={pickImage} onPickPdf={pickPdf} />
        {loading && <LoadingOverlay message={loadingMessage} />}
      </>
    );
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Cargando permisos...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: '#131313' }]}>
        <View style={[styles.permissionCard, { backgroundColor: '#1c1b1b' }]}>
          <View style={[styles.permissionIconCircle, { backgroundColor: '#d4af3720' }]}>
            <Ionicons name="camera" size={48} color="#d4af37" />
          </View>
          <Text style={styles.permissionTitle}>Acceso a Cámara</Text>
          <Text style={styles.permissionDesc}>
            Necesitamos acceso a la cámara para escanear sentencias del TSJ
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission} activeOpacity={0.7}>
            <Ionicons name="lock-open" size={18} color="#3c2f00" />
            <Text style={styles.permissionButtonText}>Conceder Permiso</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.permissionBack}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {(() => {
        const { CameraView: CV } = require('expo-camera');
        return <CV ref={cameraRef} style={styles.camera} facing="back" autofocus="on" />;
      })()}

      <View style={StyleSheet.absoluteFill}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SENTENCIA TSJ</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="information-circle-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.helpPill}>
          <Text style={styles.helpText}>Encuadra la sentencia para escanear automáticamente</Text>
        </View>

        <View style={styles.frameArea}>
          <View style={styles.scanFrame}>
            <ScanLine height={350} />
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn} onPress={pickImage}>
            <View style={styles.controlIcon}>
              <Ionicons name="images" size={22} color="white" />
            </View>
            <Text style={styles.controlLabel}>Galería</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={pickPdf}>
            <View style={styles.controlIcon}>
              <Ionicons name="document-text" size={22} color="white" />
            </View>
            <Text style={styles.controlLabel}>PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureBtn} onPress={takePicture} activeOpacity={0.8}>
            <View style={styles.captureOuter}>
              <View style={styles.captureInner} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={() => setFlashActive(!flashActive)}>
            <View style={[styles.controlIcon, flashActive && { backgroundColor: 'rgba(242,202,80,0.4)' }]}>
              <Ionicons name={flashActive ? 'flash' : 'flash-outline'} size={22} color="white" />
            </View>
            <Text style={styles.controlLabel}>Flash</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showToast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity, transform: [{ scale: toastScale }] }]}>
          <Ionicons name="checkmark-circle" size={48} color="#d4af37" />
          <Text style={styles.toastText}>Sentencia Capturada</Text>
        </Animated.View>
      )}

      {loading && <LoadingOverlay message={loadingMessage} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.gutter,
    paddingTop: 56,
    paddingBottom: spacing.unit4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.01,
  },
  helpPill: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.unit6,
    paddingVertical: spacing.unit2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  helpText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.05,
    textTransform: 'uppercase',
  },
  frameArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.unit8,
  },
  scanFrame: {
    height: 350,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.5)',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderColor: 'white' },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderColor: 'white' },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: 'white' },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderColor: 'white' },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 48,
    paddingHorizontal: spacing.unit8,
  },
  controlBtn: { alignItems: 'center', gap: 6 },
  controlIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  controlLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' },
  captureBtn: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  captureOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white' },
  toast: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.unit8,
    paddingVertical: spacing.unit4,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.unit2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  toastText: { fontSize: 18, fontWeight: '700', color: '#031632' },
  message: { color: 'white', fontSize: 16, textAlign: 'center' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.unit6 },
  permissionCard: {
    borderRadius: 20,
    padding: spacing.unit8,
    alignItems: 'center',
    gap: spacing.unit4,
    width: '100%',
    maxWidth: 320,
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: '#e5e2e1' },
  permissionDesc: { fontSize: 14, color: '#d0c5af', textAlign: 'center', lineHeight: 20 },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#d4af37',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: spacing.unit2,
  },
  permissionButtonText: { color: '#3c2f00', fontWeight: '600', fontSize: 15 },
  permissionBack: { color: '#99907c', fontSize: 14, marginTop: spacing.unit1 },
  webPicker: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.unit8,
  },
  webPickerIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.unit6,
  },
  webPickerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: spacing.unit2,
  },
  webPickerDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: spacing.unit8,
  },
  webPickerButtons: {
    flexDirection: 'row',
    gap: spacing.unit4,
    marginBottom: spacing.unit6,
  },
  webButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.unit6,
    paddingVertical: spacing.unit4,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  webButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  webBack: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
});
