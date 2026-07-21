import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, FontSize } from '../../../constants/theme';
import type { CardTemplate } from '../scene/types';

type Props = {
  template: CardTemplate;
  selected: boolean;
  onPress: () => void;
};

const THUMB_SIZE = 64;

// No real thumbnail rendering yet (CardTemplate.thumbnailUri is unset for
// every template so far) — a swatch built from the template's own palette
// stands in for now. Swap this for an actual rendered preview once
// thumbnail generation exists; nothing about the surrounding layout needs
// to change when that happens.
export function TemplateThumb({ template, selected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.wrap} hitSlop={8}>
      <View
        style={[
          styles.swatch,
          {
            backgroundColor: template.palette.cardSurface,
            borderColor: selected ? Colors.PRIMARY : Colors.BORDER,
            borderWidth: selected ? 2 : 1,
          },
        ]}
      >
        <View style={[styles.accentDot, { backgroundColor: template.palette.accent }]} />
      </View>
      <Text numberOfLines={1} style={[styles.label, selected && styles.labelSelected]}>
        {template.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: THUMB_SIZE + 8, alignItems: 'center', gap: 6 },
  swatch: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentDot: { width: 14, height: 14, borderRadius: Radius.full },
  label: { fontSize: FontSize.caption, color: Colors.TEXT_LOW, textAlign: 'center' },
  labelSelected: { color: Colors.TEXT_HIGH, fontWeight: '600' },
});