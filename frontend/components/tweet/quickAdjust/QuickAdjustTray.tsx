import { useState } from 'react';
import { Modal, Pressable, View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '../../../constants/theme';
import { ColorSwatchRow } from './ColorsWatchRow';
import { Stepper } from './Stepper';

type Tab = 'background' | 'card';

type Props = {
  visible: boolean;
  onClose: () => void;

  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;

  // undefined = using the current template's own cardSurface color
  cardColor?: string;
  onCardColorChange: (color: string | undefined) => void;
  // The active template's own cardSurface — used as the "reset" target and
  // as the effective selected swatch when no override is set.
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

// Uses RN's built-in Modal rather than TemplateSheet's custom drag
// mechanics — this sheet only needs open/closed, not peek/expand, so Modal
// (which renders above everything regardless of where it's mounted) is
// simpler than needing to be a ScrollView sibling like TemplateSheet did.
export function QuickAdjustTray({
  visible,
  onClose,
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
  const [tab, setTab] = useState<Tab>('background');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.tabs}>
            <Pressable
              onPress={() => setTab('background')}
              style={[styles.tab, tab === 'background' && styles.tabActive]}
            >
              <Text style={[styles.tabLabel, tab === 'background' && styles.tabLabelActive]}>Background</Text>
            </Pressable>
            <Pressable onPress={() => setTab('card')} style={[styles.tab, tab === 'card' && styles.tabActive]}>
              <Text style={[styles.tabLabel, tab === 'card' && styles.tabLabelActive]}>Card</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {tab === 'background' && (
              <View style={styles.group}>
                <Text style={styles.groupLabel}>Color</Text>
                <ColorSwatchRow
                  swatches={BACKGROUND_SWATCHES}
                  selected={backgroundColor}
                  onSelect={onBackgroundColorChange}
                />
                {/* Background image (pick + auto-fit) is a bigger feature —
                    permissions, image handling — deliberately not part of
                    this first pass. */}
              </View>
            )}

            {tab === 'card' && (
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
                <Stepper
                  value={cardRadius}
                  min={RADIUS_MIN}
                  max={RADIUS_MAX}
                  step={RADIUS_STEP}
                  onChange={onCardRadiusChange}
                />

                <Text style={styles.groupLabel}>Padding</Text>
                <Stepper
                  value={cardPadding}
                  min={PADDING_MIN}
                  max={PADDING_MAX}
                  step={PADDING_STEP}
                  onChange={onCardPaddingChange}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: Colors.SURFACE_RAISED,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.BORDER,
    marginBottom: Spacing.sm,
  },
  tabs: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: 'center',
    backgroundColor: Colors.SURFACE,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  tabActive: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  tabLabel: { color: Colors.TEXT_MED, fontSize: FontSize.bodySmall, fontWeight: '600' },
  tabLabelActive: { color: Colors.BG_BASE },
  content: { gap: Spacing.lg },
  group: { gap: Spacing.sm },
  groupLabel: { color: Colors.TEXT_HIGH, fontSize: FontSize.label, fontWeight: '600' },
});