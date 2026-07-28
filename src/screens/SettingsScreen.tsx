import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme/tokens';
import TopAppBar from '../components/TopAppBar';
import { clearHistory, clearTSJHistory } from '../services/historyService';

const RETENTION_OPTIONS = [
  { value: 0, label: 'Nunca' },
  { value: 30, label: '30 días' },
  { value: 60, label: '60 días' },
  { value: 90, label: '90 días' },
];

export default function SettingsScreen() {
  const { material, isDark, toggleTheme } = useTheme();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [retentionDays, setRetentionDays] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem('biometric_lock').then(v => setBiometricEnabled(v === 'true'));
    AsyncStorage.getItem('retention_days').then(v => setRetentionDays(v ? parseInt(v) : 0));
  }, []);

  const toggleBiometric = async () => {
    const next = !biometricEnabled;
    setBiometricEnabled(next);
    await AsyncStorage.setItem('biometric_lock', next ? 'true' : 'false');
  };

  const handleRetentionChange = async (days: number) => {
    setRetentionDays(days);
    await AsyncStorage.setItem('retention_days', days.toString());
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Limpiar Historial',
      '¿Estás seguro de que deseas eliminar todo el historial de análisis?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            await clearTSJHistory();
            Alert.alert('Historial eliminado');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: material.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TopAppBar title="Settings" />

      <View style={styles.body}>
        <View style={[styles.section, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}>
          <Text style={[styles.sectionLabel, { color: material.onSurfaceVariant }]}>APARIENCIA</Text>

          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.settingRow, { borderBottomColor: material.outlineVariant }]}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: material.surfaceContainer }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={material.primary} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: material.onSurface }]}>Modo Oscuro</Text>
                <Text style={[styles.settingDesc, { color: material.onSurfaceVariant }]}>
                  {isDark ? 'Activado' : 'Desactivado'}
                </Text>
              </View>
            </View>
            <View style={[styles.toggle, { backgroundColor: isDark ? material.primary : material.surfaceContainerHigh }]}>
              <View style={[styles.toggleDot, { transform: [{ translateX: isDark ? 20 : 0 }], backgroundColor: isDark ? material.onPrimary : material.outline }]} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}>
          <Text style={[styles.sectionLabel, { color: material.onSurfaceVariant }]}>SEGURIDAD</Text>

          <TouchableOpacity
            onPress={toggleBiometric}
            style={[styles.settingRow, { borderBottomColor: material.outlineVariant }]}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: material.surfaceContainer }]}>
                <Ionicons name="finger-print" size={20} color={material.primary} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: material.onSurface }]}>Bloqueo Biométrico</Text>
                <Text style={[styles.settingDesc, { color: material.onSurfaceVariant }]}>
                  {biometricEnabled ? 'Activado' : 'Desactivado'}
                </Text>
              </View>
            </View>
            <View style={[styles.toggle, { backgroundColor: biometricEnabled ? material.primary : material.surfaceContainerHigh }]}>
              <View style={[styles.toggleDot, { transform: [{ translateX: biometricEnabled ? 20 : 0 }], backgroundColor: biometricEnabled ? material.onPrimary : material.outline }]} />
            </View>
          </TouchableOpacity>

          <View style={[styles.settingRow, { borderBottomWidth: 0, flexDirection: 'column', alignItems: 'flex-start', gap: spacing.unit2 }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: material.surfaceContainer }]}>
                <Ionicons name="time-outline" size={20} color={material.primary} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: material.onSurface }]}>Auto-eliminar historial</Text>
                <Text style={[styles.settingDesc, { color: material.onSurfaceVariant }]}>
                  {RETENTION_OPTIONS.find(o => o.value === retentionDays)?.label || 'Nunca'}
                </Text>
              </View>
            </View>
            <View style={styles.retentionRow}>
              {RETENTION_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.retentionChip,
                    {
                      backgroundColor: retentionDays === option.value ? material.primary : material.surfaceContainerHigh,
                      borderColor: retentionDays === option.value ? material.primary : material.outlineVariant,
                    },
                  ]}
                  onPress={() => handleRetentionChange(option.value)}
                >
                  <Text style={[styles.retentionText, { color: retentionDays === option.value ? material.onPrimary : material.onSurfaceVariant }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}>
          <Text style={[styles.sectionLabel, { color: material.onSurfaceVariant }]}>DATOS</Text>

          <TouchableOpacity
            onPress={handleClearHistory}
            style={[styles.settingRow, { borderBottomColor: material.outlineVariant }]}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: material.errorContainer }]}>
                <Ionicons name="trash" size={20} color={material.error} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: material.error }]}>Limpiar Historial</Text>
                <Text style={[styles.settingDesc, { color: material.onSurfaceVariant }]}>
                  Eliminar todos los análisis guardados
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={material.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}>
          <Text style={[styles.sectionLabel, { color: material.onSurfaceVariant }]}>ACERCA DE</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: material.surfaceContainer }]}>
                <Ionicons name="information-circle" size={20} color={material.primary} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: material.onSurface }]}>Versión</Text>
                <Text style={[styles.settingDesc, { color: material.onSurfaceVariant }]}>1.0.0</Text>
              </View>
            </View>
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: material.surfaceContainer }]}>
                <Ionicons name="hammer" size={20} color={material.primary} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: material.onSurface }]}>Scrutin Engine</Text>
                <Text style={[styles.settingDesc, { color: material.onSurfaceVariant }]}>
                  Gemini AI v4.2 con soporte legal venezolano
                </Text>
              </View>
            </View>
          </View>
        </View>
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
  section: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: fontSize.labelSm,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.05,
    paddingHorizontal: spacing.unit4,
    paddingTop: spacing.unit4,
    paddingBottom: spacing.unit2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.unit4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit4,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: fontSize.bodyMd,
    fontWeight: fontWeight.medium,
  },
  settingDesc: {
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  retentionRow: {
    flexDirection: 'row',
    gap: spacing.unit2,
    paddingLeft: 56,
  },
  retentionChip: {
    paddingHorizontal: spacing.unit4,
    paddingVertical: spacing.unit1,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  retentionText: {
    fontSize: fontSize.labelSm,
    fontWeight: fontWeight.medium,
  },
});
