import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize } from '../../../constants/theme';
import { ColorSwatchRow } from '../quickAdjust/ColorsWatchRow';
import { ValueSlider } from '../quickAdjust/ValueSlider';
import { ColorPicker } from './ColorPicker';
import { ImagePickerButton } from './ImagePickerButton';

type Props = {
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  cardRadius: number;
  onCardRadiusChange: (value: number) => void;
  cardPadding: number;
  onCardPaddingChange: (value: number) => void;
  backgroundImageUri?: string;
  onBackgroundImageChange: (uri: string | undefined) => void;
  backgroundImageBlur: number;
  onBackgroundImageBlurChange: (value: number) => void;
};

const BACKGROUND_SWATCHES = ['#13121E', '#0A0A0F', '#1E1C2A', '#2D1F6E', '#6C5CE7', '#000000', '#F5F4FA', '#FFFFFF'];

// Home is intentionally the quick styling surface: outer background first,
// then the two geometry controls people use most. Card surface colour/image
// settings now live exclusively in Advanced Edit.
export function AdjustTab({
  backgroundColor,
  onBackgroundColorChange,
  cardRadius,
  onCardRadiusChange,
  cardPadding,
  onCardPaddingChange,
  backgroundImageUri,
  onBackgroundImageChange,
  backgroundImageBlur,
  onBackgroundImageBlurChange,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.group}>
        <Text style={styles.groupLabel}>Background color</Text>
        <ColorSwatchRow swatches={BACKGROUND_SWATCHES} selected={backgroundColor} onSelect={onBackgroundColorChange} />
        <ColorPicker color={backgroundColor} onChange={onBackgroundColorChange} />
        <ImagePickerButton label="background" imageUri={backgroundImageUri} onChange={onBackgroundImageChange} />
        {backgroundImageUri && (
          <>
            <Text style={styles.groupLabel}>Image blur</Text>
            <ValueSlider value={backgroundImageBlur} min={0} max={40} onChange={onBackgroundImageBlurChange} />
          </>
        )}

        <Text style={styles.groupLabel}>Corner rounding</Text>
        <ValueSlider value={cardRadius} min={0} max={64} step={8} onChange={onCardRadiusChange} />
        <Text style={styles.groupLabel}>Card padding</Text>
        <ValueSlider value={cardPadding} min={32} max={96} step={8} onChange={onCardPaddingChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.lg },
  group: { gap: Spacing.sm },
  groupLabel: { color: Colors.TEXT_HIGH, fontSize: FontSize.label, fontWeight: '600', marginTop: Spacing.xs },
});
