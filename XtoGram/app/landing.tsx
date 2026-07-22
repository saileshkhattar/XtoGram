// app/landing.tsx
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome6, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '../constants/theme';
import CroppedImage from '../utils/croppedmage';
import ScatteredIcons from '../utils/scatteredIcons';
import Button from '../components/ui/Button';
import GoogleButton from '../components/ui/GoogleButton';
import { useAuth } from '../context/AuthContext';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

export default function LandingScreen() {
  const { loginWithGoogle } = useAuth();
  const { promptAsync } = useGoogleAuth(async (idToken) => {
    await loginWithGoogle(idToken);
    router.replace('/(tabs)/home');
  });

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.92)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const headlineAnim = useRef(new Animated.Value(0)).current;
  const subAnim = useRef(new Animated.Value(0)).current;
  const btn1 = useRef(new Animated.Value(0)).current;
  const btn2 = useRef(new Animated.Value(0)).current;
  const btn3 = useRef(new Animated.Value(0)).current;
  const btn4 = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const scatterFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(heroScale, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scatterFade, { toValue: 1, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.stagger(
        110,
        [badgeAnim, headlineAnim, subAnim, btn1, btn2, btn3, btn4].map((v) =>
          Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })
        )
      ),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 7000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const driftY = drift.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] });

  const fadeUp = (v: Animated.Value, distance = 12) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
  });

  return (
    <View style={styles.root}>
      <ScatteredIcons fadeIn={scatterFade} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Animated.View
            style={[styles.heroWrap, { opacity: heroOpacity, transform: [{ scale: heroScale }, { translateY: driftY }] }]}
          >
            <CroppedImage source={require('../assets/App_Icon.png')} size={160} radius={Radius.full} />
          </Animated.View>

          <View style={styles.textBlock}>
            <Animated.View style={[styles.badge, fadeUp(badgeAnim)]}>
              <FontAwesome6 name="x-twitter" size={14} color={Colors.TEXT_HIGH} />
              <Feather name="arrow-right" size={14} color={Colors.TEXT_MED} style={styles.badgeArrow} />
              <FontAwesome6 name="instagram" size={14} color={Colors.TEXT_HIGH} />
            </Animated.View>

            <Animated.View style={fadeUp(headlineAnim)}>
              <Text style={styles.headline}>
                <Text style={styles.headlineDim}>Effortless{'\n'}control with{'\n'}</Text>
                <Text style={styles.headlineBright}>Xtogram</Text>
              </Text>
            </Animated.View>

            <Animated.Text style={[styles.tagline, fadeUp(subAnim)]}>
              Turn tweets into stunning visual cards — ready to share anywhere.
            </Animated.Text>
          </View>

          <View style={styles.actions}>
            <Animated.View style={fadeUp(btn1)}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/login')}>
                <LinearGradient
                  colors={[Colors.GLOW_MAGENTA, Colors.GLOW_ORANGE]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnPrimaryBorder}
                >
                  <View style={styles.btnPrimaryInner}>
                    <Text style={styles.btnPrimaryText}>Log In</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={fadeUp(btn2)}>
              <Button label="Sign Up" variant="secondary" onPress={() => router.push('/signup')} />
            </Animated.View>

            <Animated.View style={fadeUp(btn3)}>
              <GoogleButton onPress={() => promptAsync()} />
            </Animated.View>

            <Animated.View style={fadeUp(btn4)}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.guestLink}
                onPress={() => router.replace('/(tabs)/home')}
              >
                <Text style={styles.guestLinkText}>Continue as guest</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.BG_BASE },
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: Spacing.screen, justifyContent: 'space-between', paddingBottom: Spacing.xl, paddingTop: Spacing.lg },
  heroWrap: { alignItems: 'center', justifyContent: 'center', height: 180 },
  textBlock: { alignItems: 'center', marginTop: -Spacing.md },
  badge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.BORDER_SOFT,
    borderWidth: 1, borderColor: Colors.BORDER, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 8, marginBottom: Spacing.lg,
  },
  badgeArrow: { marginHorizontal: Spacing.sm },
  headline: { fontSize: FontSize.display + 4, fontWeight: '700', textAlign: 'center', lineHeight: 42 },
  headlineDim: { color: Colors.TEXT_DIM },
  headlineBright: {
    color: Colors.PRIMARY, fontWeight: '800',
    textShadowColor: Colors.GLOW_VIOLET, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  tagline: { fontSize: FontSize.body, color: Colors.TEXT_MED, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.lg, marginTop: Spacing.md },
  actions: { gap: Spacing.sm },
  btnPrimaryBorder: { borderRadius: Radius.sm, padding: 1.5 },
  btnPrimaryInner: { backgroundColor: Colors.BG_BASE, borderRadius: Radius.sm, paddingVertical: 13, alignItems: 'center' },
  btnPrimaryText: { color: Colors.TEXT_HIGH, fontSize: FontSize.label, fontWeight: '600' },
  guestLink: { alignItems: 'center', paddingVertical: 10 },
  guestLinkText: { color: Colors.TEXT_LOW, fontSize: FontSize.bodySmall, fontWeight: '500', textDecorationLine: 'underline' },
});