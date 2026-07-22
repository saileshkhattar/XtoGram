import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, FontSize } from '../../constants/theme';

type Props = {
  label: string;
  variant?: 'default' | 'accent';
};

export default function Badge({ label, variant = 'default' }: Props) {
  return (
    <View style={[styles.base, variantStyles[variant].container]}>
      <Text style={[styles.text, variantStyles[variant].text]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.caption,
    fontWeight: '600',
  },
});

const variantStyles = {
  default: StyleSheet.create({
    container: { backgroundColor: Colors.SURFACE_RAISED, borderColor: Colors.BORDER },
    text: { color: Colors.TEXT_LOW },
  }),
  accent: StyleSheet.create({
    container: { backgroundColor: Colors.PRIMARY_DIM, borderColor: Colors.GLOW_VIOLET },
    text: { color: Colors.GLOW_VIOLET },
  }),
};