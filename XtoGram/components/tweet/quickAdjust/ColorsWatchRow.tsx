import { useState } from 'react';
import { View, Pressable, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '../../../constants/theme';

type Props = {
  swatches: string[];
  selected: string;
  onSelect: (color: string) => void;
  // When both are set, shows an extra "reset to template default" swatch —
  // used by the Card tab, where a color can be cleared back to whatever
  // the current template's own palette specifies.
  resetTo?: string;
  onReset?: () => void;
};

// Curated swatches + a raw hex field, rather than a full color-wheel picker
// — enough for the quick tier. A richer picker is an advanced-editor concern
// if it's ever needed there.
export function ColorSwatchRow({ swatches, selected, onSelect, resetTo, onReset }: Props) {
  const [hexInput, setHexInput] = useState('');

  const submitHex = () => {
    const value = hexInput.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      onSelect(value);
      setHexInput('');
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {resetTo && onReset && (
          <Pressable onPress={onReset} style={styles.resetSwatch} hitSlop={6}>
            <Feather name="rotate-ccw" size={16} color={Colors.TEXT_MED} />
          </Pressable>
        )}
        {swatches.map((color) => (
          <Pressable
            key={color}
            onPress={() => onSelect(color)}
            hitSlop={4}
            style={[
              styles.swatch,
              { backgroundColor: color },
              selected.toLowerCase() === color.toLowerCase() && styles.swatchSelected,
            ]}
          />
        ))}
      </View>
      <View style={styles.hexRow}>
        <TextInput
          value={hexInput}
          onChangeText={setHexInput}
          onSubmitEditing={submitHex}
          placeholder="#RRGGBB"
          placeholderTextColor={Colors.TEXT_LOW}
          autoCapitalize="none"
          style={styles.hexInput}
        />
        <Pressable onPress={submitHex} style={styles.hexButton} hitSlop={6}>
          <Feather name="check" size={16} color={Colors.TEXT_HIGH} />
        </Pressable>
      </View>
    </View>
  );
}

const SWATCH_SIZE = 32;

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  swatchSelected: { borderWidth: 2, borderColor: Colors.PRIMARY },
  resetSwatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.SURFACE,
  },
  hexRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  hexInput: {
    flex: 1,
    backgroundColor: Colors.SURFACE,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    color: Colors.TEXT_HIGH,
    fontSize: FontSize.bodySmall,
  },
  hexButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.SURFACE_RAISED,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
});