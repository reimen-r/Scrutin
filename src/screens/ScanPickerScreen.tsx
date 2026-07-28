import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius, shadow } from '../theme/tokens';
import TopAppBar from '../components/TopAppBar';
import { CONTRACT_TYPES } from '../types/contract';

const SCAN_TYPES = CONTRACT_TYPES;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ScanPickerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { material } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: material.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TopAppBar />

      <View style={styles.body}>
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: material.onSurface }]}>Escanear</Text>
          <Text style={[styles.subtitle, { color: material.onSurfaceVariant }]}>
            Seleccione el tipo de documento para analizar
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: material.primaryContainer }]}
          onPress={() => navigation.navigate('TSJScanner')}
          activeOpacity={0.8}
        >
          <View style={styles.cardIcon}>
            <Ionicons name="scale-outline" size={40} color={material.onPrimaryContainer} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: material.onPrimaryContainer }]}>
              Sentencia TSJ
            </Text>
            <Text style={[styles.cardDesc, { color: material.onPrimaryContainer }]}>
              Extraer datos de sentencias del Tribunal Supremo de Justicia
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={material.onPrimaryContainer} />
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: material.onSurface }]}>Contratos</Text>
          <Text style={[styles.sectionDesc, { color: material.onSurfaceVariant }]}>
            Analice contratos con inteligencia artificial
          </Text>

          {SCAN_TYPES.map((contract) => (
            <TouchableOpacity
              key={contract.id}
              style={[styles.contractRow, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}
              onPress={() => navigation.navigate('Scanner', { contractType: contract.id, contractLabel: contract.label })}
              activeOpacity={0.7}
            >
              <View style={[styles.contractIcon, { backgroundColor: material.secondaryContainer }]}>
                <Ionicons name={contract.icon as any} size={22} color={material.onSecondaryContainer} />
              </View>
              <View style={styles.contractInfo}>
                <Text style={[styles.contractLabel, { color: material.onSurface }]}>{contract.label}</Text>
                <Text style={[styles.contractType, { color: material.onSurfaceVariant }]}>{contract.id}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={material.onSurfaceVariant} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  body: { padding: spacing.gutter, gap: spacing.unit8 },
  headerSection: { gap: spacing.unit2 },
  title: {
    fontSize: fontSize.displayLgMobile,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: fontSize.bodyMd,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.unit6,
    borderRadius: borderRadius.xl,
    gap: spacing.unit4,
    ...shadow.medium,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  cardContent: { flex: 1, gap: spacing.unit1 },
  cardTitle: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semibold,
  },
  cardDesc: {
    fontSize: fontSize.body,
  },
  section: { gap: spacing.unit4 },
  sectionTitle: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semibold,
  },
  sectionDesc: {
    fontSize: fontSize.body,
  },
  contractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.unit4,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.unit4,
  },
  contractIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contractInfo: { flex: 1, gap: 2 },
  contractLabel: {
    fontSize: fontSize.bodyMd,
    fontWeight: fontWeight.medium,
  },
  contractType: {
    fontSize: fontSize.body,
  },
});
