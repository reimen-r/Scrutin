import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import AppNavigator from './navigation/AppNavigator';

function BiometricGate({ children }: { children: React.ReactNode }) {
  const { material } = useTheme();
  const [unlocked, setUnlocked] = useState(Platform.OS === 'web');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    try {
      const biometricEnabled = await AsyncStorage.getItem('biometric_lock');
      if (biometricEnabled !== 'true') {
        setUnlocked(true);
        setChecking(false);
        return;
      }
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (compatible && enrolled) {
        setBiometricAvailable(true);
        authenticate();
      } else {
        setUnlocked(true);
      }
    } catch {
      setUnlocked(true);
    } finally {
      setChecking(false);
    }
  };

  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear ContractAnalyzer',
        fallbackLabel: 'Usar contraseña del dispositivo',
        disableDeviceFallback: false,
      });
      setUnlocked(result.success);
    } catch {
      setUnlocked(false);
    }
  };

  if (checking) return null;
  if (unlocked) return <>{children}</>;

  return (
    <View style={[styles.lockScreen, { backgroundColor: material.background }]}>
      <View style={styles.lockContent}>
        <View style={[styles.lockIconCircle, { backgroundColor: material.primaryContainer }]}>
          <Ionicons name="lock-closed" size={48} color={material.onPrimaryContainer} />
        </View>
        <Text style={[styles.lockTitle, { color: material.onSurface }]}>ContractAnalyzer</Text>
        <Text style={[styles.lockSubtitle, { color: material.onSurfaceVariant }]}>
          Toque para desbloquear con biometría
        </Text>
        {biometricAvailable && (
          <TouchableOpacity
            style={[styles.unlockButton, { backgroundColor: material.primary }]}
            onPress={authenticate}
            activeOpacity={0.7}
          >
            <Ionicons name="finger-print" size={24} color={material.onPrimary} />
            <Text style={[styles.unlockButtonText, { color: material.onPrimary }]}>Desbloquear</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function AppContent() {
  const { colors } = useTheme();
  return (
    <>
      <StatusBar style={colors.statusBar} />
      <BiometricGate>
        <AppNavigator />
      </BiometricGate>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  lockScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContent: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  lockIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  lockSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  unlockButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
