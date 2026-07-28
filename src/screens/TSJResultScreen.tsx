import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Easing } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { saveTSJToHistory } from '../services/historyService';
import { TSJExtractionResult } from '../types/contract';
import { spacing, fontSize, fontWeight, borderRadius, shadow } from '../theme/tokens';
import TopAppBar from '../components/TopAppBar';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TSJResult'>;
  route: RouteProp<RootStackParamList, 'TSJResult'>;
};

interface FieldDef {
  label: string;
  key: keyof TSJExtractionResult;
  icon: keyof typeof Ionicons.glyphMap;
}

const FIELDS: FieldDef[] = [
  { label: 'N° Expediente', key: 'expediente', icon: 'folder-outline' },
  { label: 'Tipo de Recurso', key: 'tipoRecurso', icon: 'document-text-outline' },
  { label: 'Magistrado Ponente', key: 'magistradoPonente', icon: 'person-outline' },
  { label: 'Decisión', key: 'decision', icon: 'checkmark-circle-outline' },
  { label: 'Fecha', key: 'fecha', icon: 'calendar-outline' },
  { label: 'Votación', key: 'votacion', icon: 'people-outline' },
  { label: 'Partes', key: 'partes', icon: 'finger-print-outline' },
];

export default function TSJResultScreen({ navigation, route }: Props) {
  const { material } = useTheme();
  const { result } = route.params;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    saveTSJToHistory(result);
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: material.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TopAppBar showBack onBack={() => navigation.popToTop()} />

      <View style={[styles.heroCard, { backgroundColor: material.primaryContainer }]}>
        <Ionicons name="scale" size={32} color={material.onPrimaryContainer} />
        <Text style={[styles.heroTitle, { color: material.onPrimaryContainer }]}>Datos Extraídos</Text>
        <Text style={[styles.heroSubtitle, { color: material.onPrimaryContainer }]}>
          Información estructurada de la sentencia
        </Text>
      </View>

      <View style={styles.fieldsList}>
        {FIELDS.map((field, index) => (
          <AnimatedField key={field.key} field={field} result={result} material={material} index={index} />
        ))}
      </View>

      {result.rawReport ? (
        <TouchableOpacity
          style={[styles.rawButton, { borderColor: material.outlineVariant, backgroundColor: material.surfaceContainerLowest }]}
          activeOpacity={0.7}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="document-text-outline" size={18} color={material.primary} />
          <Text style={[styles.rawButtonText, { color: material.primary }]}>Ver texto completo</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: material.primary }]}
        onPress={() => navigation.popToTop()}
        activeOpacity={0.7}
      >
        <Ionicons name="scan" size={20} color={material.onPrimary} />
        <Text style={[styles.primaryBtnText, { color: material.onPrimary }]}>Analizar otra sentencia</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: material.surfaceContainerLowest }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: material.onSurface }]}>Texto Completo</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={material.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={[styles.modalText, { color: material.onSurface }]}>{result.rawReport}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function AnimatedField({ field, result, material, index }: { field: FieldDef; result: TSJExtractionResult; material: any; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, index * 80);
    return () => clearTimeout(timer);
  }, []);

  const val = result[field.key];
  const value = typeof val === 'string' ? val || 'No especificado' : 'No especificado';

  return (
    <Animated.View style={[styles.fieldCard, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.fieldIconCircle, { backgroundColor: material.secondaryContainer }]}>
        <Ionicons name={field.icon} size={18} color={material.onSecondaryContainer} />
      </View>
      <View style={styles.fieldInfo}>
        <Text style={[styles.fieldLabel, { color: material.onSurfaceVariant }]}>{field.label}</Text>
        <Text style={[styles.fieldValue, { color: material.onSurface }]}>{value}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.unit4, paddingBottom: spacing.xxl },
  heroCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.unit6,
    alignItems: 'center',
    gap: spacing.unit2,
  },
  heroTitle: { fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold },
  heroSubtitle: { fontSize: fontSize.caption, textAlign: 'center' },
  fieldsList: { gap: spacing.unit4 },
  fieldCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit4,
    padding: spacing.unit4,
  },
  fieldIconCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldInfo: { flex: 1 },
  fieldLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  fieldValue: { fontSize: fontSize.bodyMd, fontWeight: fontWeight.medium, marginTop: 2 },
  rawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.unit4,
  },
  rawButtonText: { fontSize: fontSize.bodyMd, fontWeight: fontWeight.semibold },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit2,
    padding: spacing.unit4,
    borderRadius: borderRadius.lg,
    marginTop: spacing.unit4,
  },
  primaryBtnText: { fontSize: fontSize.bodyMd, fontWeight: fontWeight.semibold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
    padding: spacing.unit6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.unit4,
  },
  modalTitle: { fontSize: fontSize.title, fontWeight: fontWeight.bold },
  modalScroll: { maxHeight: 500 },
  modalText: { fontSize: fontSize.bodyMd, lineHeight: 24 },
});
