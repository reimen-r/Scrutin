import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { shadow, borderRadius } from '../theme/tokens';

interface Props {
  message: string;
}

export default function LoadingOverlay({ message }: Props) {
  const { material } = useTheme();
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
      <View style={[styles.container, { backgroundColor: material.surfaceContainerLowest }]}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <LinearGradient colors={[material.primary, material.primaryContainer]} style={styles.iconCircle}>
            <Ionicons name="document-text-outline" size={32} color={material.onPrimary} />
          </LinearGradient>
        </Animated.View>
        <Text style={[styles.text, { color: material.onSurface }]}>{message}</Text>
        <View style={styles.dots}>
          <LoadingDot delay={0} color={material.primary} />
          <LoadingDot delay={200} color={material.primary} />
          <LoadingDot delay={400} color={material.primary} />
        </View>
      </View>
    </View>
  );
}

function LoadingDot({ delay, color }: { delay: number; color: string }) {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ]),
    );
    const timer = setTimeout(() => animation.start(), delay);
    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, []);

  return <Animated.View style={[styles.dot, { opacity: opacityAnim, backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  container: {
    borderRadius: borderRadius.xl,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 200,
    ...shadow.medium,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
