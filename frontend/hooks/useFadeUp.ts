// hooks/useFadeUpSequence.ts
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// Generalizes the fadeUp-stagger pattern from Landing into a reusable
// hook — give it a count, get back that many pre-wired style objects
// that fade+slide in, staggered, the moment the screen mounts.
export function useFadeUpSequence(count: number) {
  const values = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      100,
      values.map((v) =>
        Animated.timing(v, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      )
    ).start();
  }, []);

  const fadeUp = (v: Animated.Value, distance = 12) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  });

  return values.map((v) => fadeUp(v));
}