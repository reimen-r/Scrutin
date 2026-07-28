import { Platform, TextStyle } from 'react-native';

export const spacing = {
  gutter: 24,
  unit1: 4,
  unit2: 8,
  unit4: 16,
  unit6: 24,
  unit8: 32,
  unit12: 48,
  unit16: 64,
  xxl: 48,
} as const;

export const fontSize = {
  caption: 12,
  labelSm: 12,
  body: 14,
  bodyMd: 16,
  bodyLg: 18,
  title: 20,
  headlineMd: 24,
  displayLgMobile: 32,
} as const;

export const lineHeight = {
  bodyMd: 24,
  displayLgMobile: 40,
} as const;

export const letterSpacing = {
  displayLgMobile: -0.01,
} as const;

export const fontWeight = {
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const borderRadius = {
  DEFAULT: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadow = {
  low: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    android: {
      elevation: 2,
    },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }),
  high: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
  }),
} as const;
