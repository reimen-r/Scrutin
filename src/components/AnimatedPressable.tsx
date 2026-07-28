import React, { useRef } from 'react';
import { Pressable, Animated, StyleSheet, ViewStyle, Easing, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface Props {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
  accessibilityLabel?: string;
}

export default function AnimatedPressable({ onPress, children, style, disabled, accessibilityLabel }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={styles.pressable}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
});
