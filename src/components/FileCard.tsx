import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, fontWeight, borderRadius, shadow } from '../theme/tokens';

interface Props {
  name: string;
  type: 'pdf' | 'jpg' | 'docx' | 'default';
  date: string;
  size?: string;
  isActive?: boolean;
  onPress?: () => void;
}

const TYPE_CONFIG = {
  pdf: { icon: 'document-text' as const, color: '#ef4444', label: 'PDF' },
  jpg: { icon: 'image' as const, color: '#3b82f6', label: 'JPG' },
  docx: { icon: 'document' as const, color: '#8b5cf6', label: 'DOCX' },
  default: { icon: 'document' as const, color: '#6b7280', label: 'FILE' },
};

export default function FileCard({ name, type, date, size, isActive, onPress }: Props) {
  const { material } = useTheme();
  const config = TYPE_CONFIG[type];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: material.surfaceContainerLowest,
          borderColor: material.outlineVariant,
        },
        isActive && { borderTopWidth: 2, borderTopColor: material.secondaryContainer },
      ]}
    >
      <View style={[styles.preview, { backgroundColor: material.surfaceContainerHigh }]}>
        <Ionicons name={config.icon} size={40} color={material.onSurfaceVariant} style={styles.previewIcon} />
        <View style={[styles.typeBadge, { backgroundColor: material.surfaceContainerLowest, borderColor: material.outlineVariant }]}>
          <Text style={[styles.typeText, { color: material.primary }]}>{config.label}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoRow}>
          <Text style={[styles.name, { color: material.primary }]} numberOfLines={1}>{name}</Text>
          {isActive && (
            <View style={[styles.activeBadge, { backgroundColor: material.secondaryContainer }]}>
              <Text style={[styles.activeText, { color: material.onSecondaryContainer }]}>ACTIVO</Text>
            </View>
          )}
        </View>
        <Text style={[styles.meta, { color: material.onSurfaceVariant }]}>{date}{size ? ` \u2022 ${size}` : ''}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadow.low,
  },
  preview: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewIcon: {
    opacity: 0.4,
  },
  typeBadge: {
    position: 'absolute',
    top: spacing.unit2,
    right: spacing.unit2,
    paddingHorizontal: spacing.unit2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  info: {
    padding: spacing.unit4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
  },
  name: {
    fontSize: fontSize.bodyMd,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  activeBadge: {
    paddingHorizontal: spacing.unit2,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  activeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  meta: {
    fontSize: 11,
    marginTop: spacing.unit1,
  },
});
