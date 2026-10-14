import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';

export default function GuestBanner() {
  const { isGuest, guestRemaining } = useAuth();
  if (!isGuest || guestRemaining === null) return null;

  const out = guestRemaining === 0;
  const label = out
    ? 'No free generations left'
    : `${guestRemaining} free generation${guestRemaining === 1 ? '' : 's'} left`;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.text, out && styles.textOut]}>{label}</Text>
      <TouchableOpacity onPress={() => router.push('/signup')} activeOpacity={0.7}>
        <Text style={styles.headlineBright}>Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.screen,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.SURFACE_RAISED,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    borderRadius: Radius.md,
  },
  text: { color: Colors.TEXT_MED, fontSize: FontSize.bodySmall },
  textOut: { color: Colors.ERROR },
  headlineBright: {
    color: Colors.TEXT_HIGH,
    fontWeight: '800',
    textShadowColor: Colors.GLOW_VIOLET,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
});