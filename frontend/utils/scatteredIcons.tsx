import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import { Colors } from '../constants/theme';

const ICONS = [
  { Comp: Feather, name: 'heart', top: '8%', left: '10%', size: 20, color: Colors.GLOW_VIOLET, opacity: 0.22, rotate: '-12deg', driftRange: 10, duration: 6000 },
  { Comp: FontAwesome6, name: 'instagram', top: '14%', right: '8%', size: 26, color: Colors.GLOW_MAGENTA, opacity: 0.20, rotate: '8deg', driftRange: 14, duration: 8000 },
  { Comp: Feather, name: 'repeat', top: '26%', left: '8%', size: 22, color: Colors.GLOW_ORANGE, opacity: 0.20, rotate: '5deg', driftRange: 8, duration: 7000 },
  { Comp: Feather, name: 'share', top: '36%', right: '12%', size: 18, color: Colors.TEXT_MED, opacity: 0.25, rotate: '-6deg', driftRange: 10, duration: 5500 },
  { Comp: FontAwesome6, name: 'x-twitter', top: '54%', left: '10%', size: 18, color: Colors.GLOW_VIOLET, opacity: 0.20, rotate: '10deg', driftRange: 12, duration: 6500 },
  { Comp: Feather, name: 'message-circle', top: '60%', right: '10%', size: 24, color: Colors.GLOW_MAGENTA, opacity: 0.18, rotate: '-10deg', driftRange: 14, duration: 7500 },
  { Comp: Feather, name: 'bookmark', top: '74%', left: '8%', size: 20, color: Colors.GLOW_ORANGE, opacity: 0.22, rotate: '4deg', driftRange: 9, duration: 6800 },
  { Comp: Feather, name: 'heart', top: '80%', right: '14%', size: 15, color: Colors.TEXT_MED, opacity: 0.28, rotate: '15deg', driftRange: 8, duration: 5000 },
  { Comp: Feather, name: 'send', top: '5%', right: '30%', size: 14, color: Colors.GLOW_VIOLET, opacity: 0.24, rotate: '-18deg', driftRange: 10, duration: 7200 },
] as const;

type Props = {
  fadeIn: Animated.Value; // passed in from the parent screen's entrance animation
};

export default function ScatteredIcons({ fadeIn }: Props) {
  // One independent Animated.Value per icon, all starting at 0.
  const drifts = useRef(ICONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = drifts.map((drift, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(drift, {
            toValue: 1,
            duration: ICONS[i].duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(drift, {
            toValue: 0,
            duration: ICONS[i].duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((loop) => loop.start());

    // Stop all loops if this component unmounts, so they don't keep
    // running (and leaking) in the background.
    return () => loops.forEach((loop) => loop.stop());
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: fadeIn }]} pointerEvents="none">
      {ICONS.map((icon, i) => {
        const { Comp, name, size, color, opacity, rotate, driftRange, ...position } = icon;
        const translateY = drifts[i].interpolate({
          inputRange: [0, 1],
          outputRange: [-driftRange, driftRange],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.iconWrap,
              position,
              { transform: [{ rotate }, { translateY }] },
            ]}
          >
            <Comp name={name as any} size={size} color={color} style={{ opacity }} />
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    position: 'absolute',
  },
});