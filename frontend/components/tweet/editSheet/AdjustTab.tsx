import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize } from '../../../constants/theme';
import { ColorSwatchRow } from '../quickAdjust/ColorsWatchRow';
import { Stepper } from '../quickAdjust/Stepper';

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

      {subTab === 'background' && (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>Color</Text>
          <ColorSwatchRow swatches={BACKGROUND_SWATCHES} selected={backgroundColor} onSelect={onBackgroundColorChange} />
          {/* Background image (pick + auto-fit) — deliberately not part of
              this first pass, bigger feature (permissions, image handling). */}
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

          <Text style={styles.groupLabel}>Corner rounding</Text>
          <Stepper value={cardRadius} min={RADIUS_MIN} max={RADIUS_MAX} step={RADIUS_STEP} onChange={onCardRadiusChange} />

          <Text style={styles.groupLabel}>Padding</Text>
          <Stepper value={cardPadding} min={PADDING_MIN} max={PADDING_MAX} step={PADDING_STEP} onChange={onCardPaddingChange} />
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
});