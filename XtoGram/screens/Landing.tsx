// screens/Landing.tsx
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6, Feather } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '../constants/theme';
import { Screen } from '../App';

type Props = {
  navigate: (to: Screen) => void;
};


const SCATTERED_ICONS = [
  { Comp: Feather, name: 'heart', top: '8%', left: '8%', size: 22, opacity: 0.07, rotate: '-12deg' },
  { Comp: FontAwesome6, name: 'instagram', top: '14%', right: '-4%', size: 34, opacity: 0.06, rotate: '8deg' },
  { Comp: Feather, name: 'repeat', top: '28%', left: '-5%', size: 26, opacity: 0.07, rotate: '5deg' },
  { Comp: Feather, name: 'share', top: '38%', right: '10%', size: 18, opacity: 0.08, rotate: '-6deg' },
  { Comp: FontAwesome6, name: 'x-twitter', top: '55%', left: '6%', size: 20, opacity: 0.06, rotate: '10deg' },
  { Comp: Feather, name: 'message-circle', top: '62%', right: '-6%', size: 30, opacity: 0.05, rotate: '-10deg' },
  { Comp: Feather, name: 'bookmark', top: '75%', left: '-4%', size: 24, opacity: 0.07, rotate: '4deg' },
  { Comp: Feather, name: 'heart', top: '82%', right: '12%', size: 16, opacity: 0.09, rotate: '15deg' },
  { Comp: Feather, name: 'send', top: '4%', right: '22%', size: 15, opacity: 0.08, rotate: '-18deg' },
] as const;

export default function LandingScreen({ navigate }: Props) {
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.92)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const headlineAnim = useRef(new Animated.Value(0)).current;
  const subAnim = useRef(new Animated.Value(0)).current;
  const btn1 = useRef(new Animated.Value(0)).current;
  const btn2 = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const scatterFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(heroScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scatterFade, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(
        130,
        [badgeAnim, headlineAnim, subAnim, btn1, btn2].map((v) =>
          Animated.timing(v, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        )
      ),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const driftY = drift.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] });

  const fadeUp = (v: Animated.Value, distance = 12) => ({
    opacity: v,
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
    ],
  });

  return (
    <View style={styles.root}>
      {/* Scattered decorative icons — sit behind all foreground content */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: scatterFade }]} pointerEvents="none">
        {SCATTERED_ICONS.map((icon, i) => {
          const { Comp, name, size, opacity, rotate, ...position } = icon;
          return (
            <View
              key={i}
              style={[styles.scatterIcon, position, { transform: [{ rotate }] }]}
            >
              <Comp name={name as any} size={size} color={Colors.TEXT_HIGH} style={{ opacity }} />
            </View>
          );
        })}
      </Animated.View>

      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Hero glow image */}
          <Animated.View
            style={[
              styles.heroWrap,
              {
                opacity: heroOpacity,
                transform: [{ scale: heroScale }, { translateY: driftY }],
              },
            ]}
          >
            <Image
              source={require('../assets/App_Icon.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </Animated.View>

          <View style={styles.textBlock}>
            {/* Badge — X -> arrow -> Instagram */}
            <Animated.View style={[styles.badge, fadeUp(badgeAnim)]}>
              <FontAwesome6 name="x-twitter" size={14} color={Colors.TEXT_HIGH} />
              <Feather name="arrow-right" size={14} color={Colors.TEXT_MED} style={styles.badgeArrow} />
              <FontAwesome6 name="instagram" size={14} color={Colors.TEXT_HIGH} />
            </Animated.View>

            {/* Two-tone headline */}
            <Animated.View style={fadeUp(headlineAnim)}>
              <Text style={styles.headline}>
                <Text style={styles.headlineDim}>Effortless{'\n'}control with{'\n'}</Text>
                <Text style={styles.headlineBright}>Xtogram</Text>
              </Text>
            </Animated.View>

            {/* Subtitle */}
            <Animated.Text style={[styles.tagline, fadeUp(subAnim)]}>
              Turn tweets into stunning visual cards — ready to share anywhere.
            </Animated.Text>
          </View>

          {/* Buttons */}
          <View style={styles.actions}>
            <Animated.View style={fadeUp(btn1)}>
              <TouchableOpacity activeOpacity={0.85}>
                <LinearGradient
                  colors={[Colors.GLOW_MAGENTA, Colors.GLOW_ORANGE]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnPrimaryBorder}
                >
                  <View style={styles.btnPrimaryInner}>
                    <Text style={styles.btnPrimaryText}>Sign Up</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={fadeUp(btn2)}>
              <TouchableOpacity
                style={styles.btnSecondary}
                activeOpacity={0.85}
                onPress={() => navigate('home')}
              >
                <Text style={styles.btnSecondaryText}>Sign in</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.BG_BASE,
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  scatterIcon: {
    position: 'absolute',
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  heroImage: {
    width: 200,
    height: 200,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: -Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.BORDER_SOFT,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    marginBottom: Spacing.lg,
  },
  badgeArrow: {
    marginHorizontal: Spacing.sm,
  },
  headline: {
    fontSize: FontSize.display + 4,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 42,
  },
  headlineDim: {
    color: Colors.TEXT_DIM,
  },
  headlineBright: {
    color: Colors.TEXT_HIGH,
    fontWeight: '800',
  },
  tagline: {
    fontSize: FontSize.body,
    color: Colors.TEXT_MED,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  actions: {
    gap: Spacing.sm,
  },
  btnPrimaryBorder: {
    borderRadius: Radius.full,
    padding: 1.5,
  },
  btnPrimaryInner: {
    backgroundColor: Colors.BG_BASE,
    borderRadius: Radius.full,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: Colors.TEXT_HIGH,
    fontSize: FontSize.label,
    fontWeight: '600',
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: Colors.BORDER,
    borderRadius: Radius.full,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: Colors.TEXT_HIGH,
    fontSize: FontSize.label,
    fontWeight: '600',
  },
});