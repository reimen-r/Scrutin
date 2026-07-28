import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialColors, lightColors, darkColors } from './colors';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  overlay: string;
  statusBar: 'dark' | 'light';
  success: string;
  warning: string;
  error: string;
  info: string;
  gradientPrimary: readonly [string, string];
  gradientSuccess: readonly [string, string];
  gradientHeader: readonly [string, string];
  cardElevated: string;
}

function mapToLegacy(mc: MaterialColors): ThemeColors {
  return {
    background: mc.background,
    card: mc.surfaceContainerLowest,
    text: mc.onSurface,
    textSecondary: mc.onSurfaceVariant,
    border: mc.outlineVariant,
    primary: mc.primary,
    overlay: mc.shadow + '66',
    statusBar: mc.statusBar,
    success: '#22c55e',
    warning: '#f59e0b',
    error: mc.error,
    info: mc.primary,
    gradientPrimary: [mc.primary, mc.primaryContainer] as const,
    gradientSuccess: ['#15803d', '#22c55e'] as const,
    gradientHeader: [mc.inverseSurface, mc.primary] as const,
    cardElevated: mc.surfaceContainerLow,
  };
}

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  material: MaterialColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: mapToLegacy(lightColors),
  material: lightColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    AsyncStorage.getItem('theme').then((saved: string | null) => {
      if (saved === 'dark' || saved === 'light') {
        setIsDark(saved === 'dark');
      }
    });
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    AsyncStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const mc = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors: mapToLegacy(mc), material: mc, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
