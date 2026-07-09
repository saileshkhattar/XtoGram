import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, Animated } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '../../constants/theme';
import { usePressScale } from '../../hooks/usePressScale';
import type { ReactNode } from 'react';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode; // e.g. <FontAwesome6 name="google" iconStyle="brand" size={16} color={Colors.TEXT_HIGH} />
  style?: StyleProp<ViewStyle>;
};

export default function Button({ label, onPress, variant = 'primary', icon, style }: Props) {
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[styles.base, variantStyles[variant].container, style]}
    >
      <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
        {icon}
        <Text style={[styles.label, variantStyles[variant].text]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: FontSize.label,
    fontWeight: '600',
  },
});

const variantStyles = {
  primary: StyleSheet.create({
    container: { backgroundColor: Colors.PRIMARY },
    text: { color: Colors.BG_BASE },
  }),
  secondary: StyleSheet.create({
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.PRIMARY },
    text: { color: Colors.PRIMARY },
  }),
  ghost: StyleSheet.create({
    container: { backgroundColor: Colors.SURFACE_RAISED, borderWidth: 1, borderColor: Colors.BORDER },
    text: { color: Colors.TEXT_MED },
  }),
};