import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize } from '../../../constants/theme';
import { ColorSwatchRow } from '../quickAdjust/ColorsWatchRow';
import { ValueSlider } from '../quickAdjust/ValueSlider';
import { ColorPicker } from './ColorPicker';
import { ImagePickerButton } from './ImagePickerButton';

type SubTab = 'background' | 'card';

type Props = {
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  cardColor?: string;
  onCardColorChange: (color: string | undefined) => void;
  defaultCardColor: string;
  cardRadius: number;
  onCardRadiusChange: (value: number) => void;
  cardPadding: number;
  onCardPaddingChange: (value: number) => void;
  backgroundImageUri?: string;
  onBackgroundImageChange: (uri: string | undefined) => void;
  cardImageUri?: string;
  onCardImageChange: (uri: string | undefined) => void;
  backgroundImageBlur: number;
  onBackgroundImageBlurChange: (value: number) => void;
  cardImageBlur: number;
  onCardImageBlurChange: (value: number) => void;
};

const BACKGROUND_SWATCHES = ['#13121E', '#0A0A0F', '#1E1C2A', '#2D1F6E', '#6C5CE7', '#000000', '#F5F4FA', '#FFFFFF'];
const CARD_SWATCHES = ['#0A0A0F', '#13121E', '#1E1C2A', '#2D1F6E', '#F5F4FA', '#FFFFFF'];

const RADIUS_MIN = 0;
const RADIUS_MAX = 64;
const RADIUS_STEP = 8;

const PADDING_MIN = 32;
const PADDING_MAX = 96;
const PADDING_STEP = 8;

export function AdjustTab({
  backgroundColor,
  onBackgroundColorChange,
  cardColor,
  onCardColorChange,
  defaultCardColor,
  cardRadius,
  onCardRadiusChange,
  cardPadding,
  onCardPaddingChange,
  backgroundImageUri,
  onBackgroundImageChange,
  cardImageUri,
  onCardImageChange,
  backgroundImageBlur,
  onBackgroundImageBlurChange,
  cardImageBlur,
  onCardImageBlurChange,
}: Props) {
  const [subTab, setSubTab] = useState<SubTab>('background');

  return (
    <View style={styles.wrap}>
      <View style={styles.subTabs}>
        <Text
          onPress={() => setSubTab('background')}
          style={[styles.subTabLabel, subTab === 'background' && styles.subTabLabelActive]}
        >
          Background
        </Text>
        <Text onPress={() => setSubTab('card')} style={[styles.subTabLabel, subTab === 'card' && styles.subTabLabelActive]}>
          Card
        </Text>
      </View>
      <View style={styles.scrollHint}>
        <Text style={styles.scrollHintText}>Swipe up for more editing options</Text>
        <Text style={styles.scrollHintArrow}>↓</Text>
      </View>

      {subTab === 'background' && (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>Color</Text>
          <ColorSwatchRow swatches={BACKGROUND_SWATCHES} selected={backgroundColor} onSelect={onBackgroundColorChange} />
          <ColorPicker color={backgroundColor} onChange={onBackgroundColorChange} />
          <ImagePickerButton label="background" imageUri={backgroundImageUri} onChange={onBackgroundImageChange} />
          {backgroundImageUri && <><Text style={styles.groupLabel}>Image blur</Text><ValueSlider value={backgroundImageBlur} min={0} max={40} onChange={onBackgroundImageBlurChange} /></>}
        </View>
      )}

      {subTab === 'card' && (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>Color</Text>
          <ColorSwatchRow
            swatches={CARD_SWATCHES}
            selected={cardColor ?? defaultCardColor}
            onSelect={onCardColorChange}
            resetTo={cardColor ? defaultCardColor : undefined}
            onReset={() => onCardColorChange(undefined)}
          />
          <ColorPicker color={cardColor ?? defaultCardColor} onChange={onCardColorChange} />
          <ImagePickerButton label="card" imageUri={cardImageUri} onChange={onCardImageChange} />
          {cardImageUri && <><Text style={styles.groupLabel}>Image blur</Text><ValueSlider value={cardImageBlur} min={0} max={40} onChange={onCardImageBlurChange} /></>}

          <Text style={styles.groupLabel}>Corner rounding</Text>
          <ValueSlider value={cardRadius} min={RADIUS_MIN} max={RADIUS_MAX} step={RADIUS_STEP} onChange={onCardRadiusChange} />

          <Text style={styles.groupLabel}>Padding</Text>
          <ValueSlider value={cardPadding} min={PADDING_MIN} max={PADDING_MAX} step={PADDING_STEP} onChange={onCardPaddingChange} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.lg },
  subTabs: { flexDirection: 'row', gap: Spacing.lg },
  subTabLabel: { color: Colors.TEXT_LOW, fontSize: FontSize.bodySmall, fontWeight: '600', paddingBottom: 4 },
  subTabLabelActive: { color: Colors.TEXT_HIGH, borderBottomWidth: 2, borderBottomColor: Colors.PRIMARY },
  group: { gap: Spacing.sm },
  groupLabel: { color: Colors.TEXT_HIGH, fontSize: FontSize.label, fontWeight: '600' },
  scrollHint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  scrollHintText: { color: Colors.TEXT_LOW, fontSize: FontSize.caption },
  scrollHintArrow: { color: Colors.TEXT_LOW, fontSize: FontSize.bodySmall },
});
