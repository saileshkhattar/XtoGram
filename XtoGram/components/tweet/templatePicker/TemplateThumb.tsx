import { ActivityIndicator, Pressable, View, Text, Image, StyleSheet } from 'react-native';
import { Colors, Radius, FontSize } from '../../../constants/theme';
import { useTemplateThumbnail } from '../thumbnail/useTemplateThumbnail';
import type { CardTemplate } from '../scene/types';

type Props = {
  template: CardTemplate;
  selected: boolean;
  onPress: () => void;
};

// Tall rectangle rather than a square — closer to an actual card's own
// proportions, and gives a real preview image (once generated) more room
// to read clearly than a square crop would.
const THUMB_WIDTH = 108;
const THUMB_HEIGHT = 156;

export function TemplateThumb({ template, selected, onPress }: Props) {
  const thumbnailUri = useTemplateThumbnail(template);

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
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} style={styles.image} resizeMode="contain" />
        ) : (
          // Never show a misleading, cropped placeholder while Skia builds
          // the thumbnail queue. A stable spinner makes loading intentional.
          <ActivityIndicator size="small" color={template.palette.accent} />
        )}
      </View>
      <Text numberOfLines={1} style={[styles.label, selected && styles.labelSelected]}>
        {template.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: THUMB_WIDTH + 8, alignItems: 'center', gap: 6 },
  swatch: {
    width: THUMB_WIDTH,
    height: THUMB_HEIGHT,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  label: { fontSize: FontSize.caption, color: Colors.TEXT_LOW, textAlign: 'center' },
  labelSelected: { color: Colors.TEXT_HIGH, fontWeight: '600' },
});
