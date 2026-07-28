import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, fontWeight, borderRadius } from '../theme/tokens';

export type ToastType = 'success' | 'error' | 'info';

interface Props {
  visible: boolean;
  message: string;
  type?: ToastType;
  icon?: keyof typeof Ionicons.glyphMap;
  onHide?: () => void;
  duration?: number;
  style?: ViewStyle;
}

const COLORS: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: '#22c55e', text: '#ffffff', icon: '#ffffff' },
  error: { bg: '#ef4444', text: '#ffffff', icon: '#ffffff' },
  info: { bg: '#3b82f6', text: '#ffffff', icon: '#ffffff' },
};

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export default function Toast({
  visible,
  message,
  type = 'info',
  icon,
  onHide,
  duration = 2500,
  style,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
        ]).start(() => onHide?.());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const colors = COLORS[type];
  const iconName = icon || ICONS[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.bg, opacity, transform: [{ translateY }] },
        style,
      ]}
    >
      <Ionicons name={iconName} size={20} color={colors.icon} />
      <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.gutter,
    right: spacing.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit2,
    paddingHorizontal: spacing.unit4,
    paddingVertical: spacing.unit2,
    borderRadius: borderRadius.lg,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  text: {
    flex: 1,
    fontSize: fontSize.bodyMd,
    fontWeight: fontWeight.medium,
  },
});
