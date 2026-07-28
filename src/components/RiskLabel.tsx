import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fontSize, fontWeight, borderRadius, spacing } from '../theme/tokens';

interface Props {
  level: 'bajo' | 'medio' | 'alto';
  compact?: boolean;
}

const RISK_CONFIG = {
  bajo: { label: 'Riesgo Bajo', bg: '#dcfce7', text: '#166534', border: '#22c55e' },
  medio: { label: 'Riesgo Medio', bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  alto: { label: 'Riesgo Alto', bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
};

export default function RiskLabel({ level, compact }: Props) {
  const { isDark, material } = useTheme();
  const config = RISK_CONFIG[level];

  const darkVariants = {
    bajo: { bg: '#14532d', text: '#86efac', border: '#22c55e' },
    medio: { bg: '#78350f', text: '#fde68a', border: '#f59e0b' },
    alto: { bg: '#7f1d1d', text: '#fca5a5', border: '#ef4444' },
  };

  const colors = isDark ? darkVariants[level] : config;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        compact && styles.compact,
      ]}
    >
      {level === 'alto' && !compact && (
        <View style={[styles.pulse, { backgroundColor: colors.border }]} />
      )}
      <Text
        style={[
          styles.text,
          { color: colors.text },
          compact && styles.compactText,
        ]}
      >
        {compact ? config.label.split(' ')[1] : config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.unit2,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: spacing.unit1,
  },
  compact: {
    paddingHorizontal: spacing.unit1,
    paddingVertical: 2,
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.8,
  },
  text: {
    fontSize: fontSize.labelSm,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.03,
  },
  compactText: {
    fontSize: 10,
  },
});
