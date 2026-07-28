import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { spacing, borderRadius } from '../theme/tokens';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  width?: number | string;
  height?: number;
  borderRadiusVal?: number;
  style?: any;
}

export default function Skeleton({ width = '100%', height = 16, borderRadiusVal = borderRadius.sm, style }: Props) {
  const { material } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius: borderRadiusVal, opacity, backgroundColor: material.surfaceContainerHigh },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: any }) {
  const { material } = useTheme();
  return (
    <View style={[styles.card, { borderColor: material.outlineVariant }, style]}>
      <View style={styles.cardRow}>
        <Skeleton width={40} height={40} borderRadiusVal={borderRadius.lg} />
        <View style={styles.cardText}>
          <Skeleton width="70%" height={14} />
          <Skeleton width="40%" height={12} borderRadiusVal={borderRadius.sm} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonCardRow({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
  card: {
    padding: spacing.unit4,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit4,
  },
  cardText: {
    flex: 1,
    gap: spacing.unit2,
  },
  list: {
    padding: spacing.gutter,
    gap: spacing.unit2,
  },
});
