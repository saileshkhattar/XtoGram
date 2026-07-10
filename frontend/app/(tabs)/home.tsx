// app/(tabs)/home.tsx
import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome6, Feather } from '@expo/vector-icons';
import TopNavBar from '../../components/ui/TopNavBar'
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';
import { Colors, Spacing, Radius, FontSize } from '../../constants/theme';
import { useFadeUpSequence } from '../../hooks/useFadeUp';
import ScatteredIcons from '../../utils/scatteredIcons';
import { fetchTweetByUrl } from '../../utils/tweetApi';

export default function Home() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const scatterFade = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const [badgeAnim, headlineAnim, subAnim, fieldAnim, btnAnim] = useFadeUpSequence(5);

  useEffect(() => {
    Animated.timing(scatterFade, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const fadeUp = (v: Animated.Value, distance = 12) => ({
    opacity: v,
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) },
    ],
  });

  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  const glowScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.06] });

  const handleSubmit = async () => {
    if (!url.trim() || loading) return;
    Keyboard.dismiss();
    setError('');
    setLoading(true);
    try {
      const data = await fetchTweetByUrl(url.trim());
      router.push({ pathname: '/preview', params: { url: url.trim(), data: JSON.stringify(data) } });
    } catch (e: any) {
      setError(e.message || 'Could not fetch that tweet — check the link and try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScatteredIcons fadeIn={scatterFade} />

      <TopNavBar title="Home" showBack={false} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Animated.View style={[styles.badge, fadeUp(badgeAnim)]}>
            <FontAwesome6 name="x-twitter" size={13} color={Colors.TEXT_HIGH} />
            <Feather name="arrow-right" size={13} color={Colors.TEXT_MED} style={styles.badgeArrow} />
            <Text style={styles.badgeText}>paste a link to begin</Text>
          </Animated.View>

          <Animated.View style={fadeUp(headlineAnim)}>
            <Text style={styles.headline}>
              <Text style={styles.headlineDim}>Turn any tweet into{'\n'}something </Text>
              <Text style={styles.headlineBright}>worth sharing</Text>
            </Text>
          </Animated.View>

          <Animated.Text style={[styles.tagline, fadeUp(subAnim)]}>
            Drop in a tweet link below and we'll pull everything we need to build your card.
          </Animated.Text>

          <Animated.View style={[styles.fieldWrap, fadeUp(fieldAnim)]}>
            <TextField
              value={url}
              onChangeText={(text) => {
                setUrl(text);
                if (error) setError('');
              }}
              placeholder="https://x.com/user/status/..."
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </Animated.View>

          <Animated.View style={[styles.btnWrap, fadeUp(btnAnim)]}>
            <Animated.View
              style={[
                styles.btnGlow,
                { opacity: glowOpacity, transform: [{ scale: glowScale }] },
              ]}
              pointerEvents="none"
            />
            <Button
              label={loading ? 'Fetching…' : 'Generate card'}
              onPress={handleSubmit}
              icon={loading ? <ActivityIndicator size="small" color={Colors.BG_BASE} /> : undefined}
            />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.BG_BASE,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.BORDER_SOFT,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    marginBottom: Spacing.sm,
  },
  badgeArrow: {
    marginHorizontal: Spacing.sm,
  },
  badgeText: {
    color: Colors.TEXT_MED,
    fontSize: FontSize.caption,
    fontWeight: '600',
  },
  headline: {
    fontSize: FontSize.display,
    fontWeight: '700',
    lineHeight: 38,
  },
  headlineDim: {
    color: Colors.TEXT_DIM,
  },
  headlineBright: {
    color: Colors.TEXT_HIGH,
    fontWeight: '800',
    textShadowColor: Colors.GLOW_VIOLET,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  tagline: {
    fontSize: FontSize.body,
    color: Colors.TEXT_MED,
    lineHeight: 22,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  fieldWrap: {
    marginBottom: Spacing.xs,
  },
  error: {
    color: Colors.ERROR,
    fontSize: FontSize.bodySmall,
    marginTop: Spacing.sm,
  },
  btnWrap: {
    marginTop: Spacing.xs,
  },
  btnGlow: {
    position: 'absolute',
    top: -14,
    left: '10%',
    right: '10%',
    height: 60,
    borderRadius: Radius.full,
    backgroundColor: Colors.GLOW_VIOLET,
  },
});