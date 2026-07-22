import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '../../../constants/theme';

type Props = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  suffix?: string;
};

// A +/- stepper rather than a slider — no slider component exists in the
// project yet, and a stepper is easier to hit precisely on mobile for a
// small number of discrete steps like these.
export function Stepper({ value, min, max, step, onChange, suffix = 'px' }: Props) {
  const decrease = () => onChange(Math.max(min, value - step));
  const increase = () => onChange(Math.min(max, value + step));

  return (
    <View style={styles.row}>
      <Pressable
        onPress={decrease}
        disabled={value <= min}
        style={[styles.button, value <= min && styles.buttonDisabled]}
        hitSlop={6}
      >
        <Feather name="minus" size={16} color={Colors.TEXT_HIGH} />
      </Pressable>
      <Text style={styles.value}>
        {value}
        {suffix}
      </Text>
      <Pressable
        onPress={increase}
        disabled={value >= max}
        style={[styles.button, value >= max && styles.buttonDisabled]}
        hitSlop={6}
      >
        <Feather name="plus" size={16} color={Colors.TEXT_HIGH} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  button: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.SURFACE,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  buttonDisabled: { opacity: 0.4 },
  value: { color: Colors.TEXT_HIGH, fontSize: FontSize.body, fontWeight: '600', minWidth: 56, textAlign: 'center' },
});