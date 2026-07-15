import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '../../constants/theme';

export type FramePreset = 'post_square' | 'post_portrait' | 'story' | 'custom';

type Props = {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  preset: FramePreset;
  onPresetChange: (preset: FramePreset) => void;
  customWidth: string;
  customHeight: string;
  onCustomWidthChange: (value: string) => void;
  onCustomHeightChange: (value: string) => void;
};

const PRESETS: { key: FramePreset; label: string }[] = [
  { key: 'post_square', label: 'Post 1:1' },
  { key: 'post_portrait', label: 'Post 4:5' },
  { key: 'story', label: 'Story/Reel' },
  { key: 'custom', label: 'Custom' },
];

export function CardOptions({
  enabled,
  onToggle,
  preset,
  onPresetChange,
  customWidth,
  customHeight,
  onCustomWidthChange,
  onCustomHeightChange,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable style={styles.checkboxRow} onPress={() => onToggle(!enabled)} hitSlop={8}>
        <View style={[styles.checkbox, enabled && styles.checkboxChecked]}>
          {enabled && <Feather name="check" size={14} color={Colors.BG_BASE} />}
        </View>
        <Text style={styles.checkboxLabel}>Custom size</Text>
      </Pressable>

      {enabled && (
        <View style={styles.presetsRow}>
          {PRESETS.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => onPresetChange(p.key)}
              style={[styles.presetChip, preset === p.key && styles.presetChipActive]}
            >
              <Text style={[styles.presetText, preset === p.key && styles.presetTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {enabled && preset === 'custom' && (
        <View style={styles.customRow}>
          <TextInput
            value={customWidth}
            onChangeText={onCustomWidthChange}
            keyboardType="number-pad"
            style={styles.customInput}
            placeholder="Width"
            placeholderTextColor={Colors.TEXT_LOW}
          />
          <Text style={styles.customX}>×</Text>
          <TextInput
            value={customHeight}
            onChangeText={onCustomHeightChange}
            keyboardType="number-pad"
            style={styles.customInput}
            placeholder="Height"
            placeholderTextColor={Colors.TEXT_LOW}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm, width: '100%' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  checkboxLabel: { color: Colors.TEXT_MED, fontSize: FontSize.bodySmall, fontWeight: '600' },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  presetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    backgroundColor: Colors.SURFACE_RAISED,
  },
  presetChipActive: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  presetText: { color: Colors.TEXT_MED, fontSize: FontSize.caption, fontWeight: '600' },
  presetTextActive: { color: Colors.BG_BASE },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  customInput: {
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
  customX: { color: Colors.TEXT_LOW },
});