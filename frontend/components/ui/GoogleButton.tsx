import { TouchableOpacity, Text, Image, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, FontSize } from '../../constants/theme';
import { usePressScale } from '../../hooks/usePressScale';


const GOOGLE_LOGO_URI = 'https://developers.google.com/identity/images/g-logo.png';

const GOOGLE_BLUE = '#4285F4';
const GOOGLE_GREEN = '#34A853';
const GOOGLE_YELLOW = '#FBBC05';
const GOOGLE_RED = '#EA4335';

type Props = {
  onPress: () => void;
};

export default function GoogleButton({ onPress }: Props) {
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <LinearGradient
        colors={[GOOGLE_BLUE, GOOGLE_GREEN, GOOGLE_YELLOW, GOOGLE_RED]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.border}
      >
        <Animated.View style={[styles.inner, { transform: [{ scale }] }]}>
          <Image source={{ uri: GOOGLE_LOGO_URI }} style={styles.logo} />
          <Text style={styles.label}>Continue with Google</Text>
        </Animated.View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  border: {
    borderRadius: Radius.sm,
    padding: 1.5,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.sm - 1.5,
    paddingVertical: 12.5,
  },
  logo: {
    width: 18,
    height: 18,
  },
  label: {
    color: '#1F1F1F', // Google's own button spec uses this near-black, not pure black
    fontSize: FontSize.label,
    fontWeight: '600',
  },
});