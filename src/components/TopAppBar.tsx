import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme/tokens';

interface Props {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string };
}

export default function TopAppBar({ title, showBack, onBack, rightAction }: Props) {
  const { material, isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: material.surfaceContainerLowest, borderBottomColor: material.outlineVariant }]}>
      <View style={styles.content}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconButton} accessibilityLabel="Volver">
            <Ionicons name="close" size={22} color={material.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoContainer}>
            <Ionicons name="hammer" size={20} color={material.primary} />
            <Text style={[styles.logoText, { color: material.primary }]}>SCRUTIN</Text>
          </View>
        )}

        {title ? (
          <Text style={[styles.title, { color: material.onSurface }]}>{title}</Text>
        ) : (
          <View />
        )}

        <View style={styles.rightActions}>
          {rightAction && (
            <TouchableOpacity onPress={rightAction.onPress} style={styles.iconButton} accessibilityLabel={rightAction.label}>
              <Ionicons name={rightAction.icon} size={22} color={material.onSurfaceVariant} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={toggleTheme} style={styles.iconButton} accessibilityLabel={isDark ? 'Modo claro' : 'Modo oscuro'}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={material.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.gutter,
    height: 56,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
  },
  logoText: {
    fontSize: fontSize.headlineMd,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.01,
  },
  title: {
    fontSize: fontSize.headlineMd,
    fontWeight: fontWeight.bold,
  },
  iconButton: {
    padding: spacing.unit2,
    borderRadius: borderRadius.full,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
  },
});
