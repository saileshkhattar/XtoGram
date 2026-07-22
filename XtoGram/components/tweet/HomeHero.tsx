import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import { FontAwesome6, Feather } from '@expo/vector-icons';
import TextField from '../ui/TextField';
import Button from '../ui/Button';
import { Colors, Spacing, Radius, FontSize } from '../../constants/theme';
import { useFadeUpSequence } from '../../hooks/useFadeUp';

type Props = {
  url: string;
  onChangeUrl: (text: string) => void;
  error: string;
  loading: boolean;
  onSubmit: () => void;
  // true once a card has been generated — collapses the badge/headline/tagline
  // so the input + button read as a compact "generate another" bar.
  compact: boolean;
};

export default function HomeHero({ url, onChangeUrl, error, loading, onSubmit, compact }: Props) {
  const glowPulse = useRef(new Animated.Value(0)).current;
  const [badgeAnim, headlineAnim, subAnim, fieldAnim, btnAnim] = useFadeUpSequence(5);

  useEffect(() => {
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

  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });
  const glowScale = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.06] });

  return (
    <View style={styles.container}>
      {!compact && (
        <>
          <Animated.View style={[styles.badge, badgeAnim]}>
            <FontAwesome6 name="x-twitter" size={13} color={Colors.TEXT_HIGH} />
            <Feather name="arrow-right" size={13} color={Colors.TEXT_MED} style={styles.badgeArrow} />
            <Text style={styles.badgeText}>paste a link to begin</Text>
          </Animated.View>

          <Animated.View style={headlineAnim}>
            <Text style={styles.headline}>
              <Text style={styles.headlineDim}>Turn any tweet into{'\n'}something </Text>
              <Text style={styles.headlineBright}>worth sharing</Text>
            </Text>
          </Animated.View>

          <Animated.Text style={[styles.tagline, subAnim]}>
            Drop in a tweet link below and we'll pull everything we need to build your card.
          </Animated.Text>
        </>
      )}

      <Animated.View style={[styles.fieldWrap, fieldAnim]}>
        <TextField
          value={url}
          onChangeText={onChangeUrl}
          placeholder="https://x.com/user/status/..."
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Animated.View>

      <Animated.View style={[styles.btnWrap, btnAnim]}>
        <Animated.View
          style={[
            styles.btnGlow,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
          pointerEvents="none"
        />
        <Button
          label={loading ? 'Fetching…' : compact ? 'Generate another' : 'Generate card'}
          onPress={onSubmit}
          icon={loading ? <ActivityIndicator size="small" color={Colors.BG_BASE} /> : undefined}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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