// screens/Landing.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '../constants/theme';
import { Screen } from '../App';

type Props = {
  navigate: (to: Screen) => void;
};

export default function LandingScreen({ navigate }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.glow} />
          <Text style={styles.appName}>Xtogram</Text>
          <Text style={styles.tagline}>
            Turn tweets into stunning visual cards — ready to share anywhere.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Log in</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary} activeOpacity={0.85}>
            <Text style={styles.btnSecondaryText}>Create account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGhost}
            activeOpacity={0.85}
            onPress={() => navigate('home')}
          >
            <Text style={styles.btnGhostText}>Continue as guest</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.BG_BASE,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.screen,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: Radius.full,
    backgroundColor: Colors.PRIMARY,
    opacity: 0.08,
  },
  appName: {
    fontSize: FontSize.display,
    fontWeight: '700',
    color: Colors.TEXT_HIGH,
    letterSpacing: -0.5,
    marginBottom: Spacing.md,
  },
  tagline: {
    fontSize: FontSize.body,
    color: Colors.TEXT_LOW,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  actions: {
    gap: Spacing.sm,
  },
  btnPrimary: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: FontSize.label,
    fontWeight: '600',
  },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: Colors.PRIMARY,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: Colors.PRIMARY,
    fontSize: FontSize.label,
    fontWeight: '600',
  },
  btnGhost: {
    backgroundColor: Colors.SURFACE_RAISED,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnGhostText: {
    color: Colors.TEXT_LOW,
    fontSize: FontSize.label,
  },
});