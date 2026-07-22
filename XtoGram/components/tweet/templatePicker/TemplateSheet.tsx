import { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../../constants/theme';
import { TemplateSection } from './TemplateSection';
import { useRecentTemplates } from '../../../hooks/useRecentTemplate';
import { cardTemplates } from '../templates/definations';
import type { CardTemplate } from '../scene/types'

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Exported so the screen mounting this sheet can reserve enough bottom
// padding in its own ScrollView content to not have the peeked sheet
// permanently cover the last bit of scrollable content.
export const PEEK_HEIGHT = 168;
const EXPANDED_HEIGHT = Math.min(SCREEN_HEIGHT * 0.68, 560);
const DRAG_RANGE = EXPANDED_HEIGHT - PEEK_HEIGHT;
const SPRING = { damping: 18, stiffness: 180 };

type Props = {
  selectedTemplateId: string;
  onSelect: (template: CardTemplate) => void;
};

export function TemplateSheet({ selectedTemplateId, onSelect }: Props) {
  const { recentIds, recordTemplateUsed } = useRecentTemplates();

  // Resolves persisted ids against known templates. Only system templates
  // exist as a lookup source for now — once user/downloaded templates are
  // real, add them to this map too, nothing else here needs to change.
  // Falls back to the first few system templates so this row isn't empty
  // on a fresh install.
  const recentTemplates = useMemo(() => {
    const byId = new Map(cardTemplates.map((t) => [t.id, t]));
    const resolved = recentIds.map((id) => byId.get(id)).filter((t): t is CardTemplate => !!t);
    return resolved.length > 0 ? resolved : cardTemplates.slice(0, 5);
  }, [recentIds]);

  // Placeholders — no user-created or store-downloaded templates exist yet
  // (needs the advanced editor's "save as template" and the marketplace
  // backend, respectively). The sections stay in the UI now, with an
  // explicit empty state, so this layout doesn't need to change again once
  // those exist — only these two arrays get filled in from real data.
  const userTemplates: CardTemplate[] = [];
  const storeTemplates: CardTemplate[] = [];

  // TODO once quote/reply/thread tweets are supported: filter
  // `cardTemplates` here by `appliesTo` against the current tweet's type,
  // the same way every section here will eventually need to.

  // 0 = fully expanded, DRAG_RANGE = peeked (resting state)
  const translateY = useSharedValue(DRAG_RANGE);
  const isExpanded = useSharedValue(false);

  const setExpanded = (next: boolean) => {
    'worklet';
    isExpanded.value = next;
    translateY.value = withSpring(next ? 0 : DRAG_RANGE, SPRING);
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      const base = isExpanded.value ? 0 : DRAG_RANGE;
      translateY.value = Math.min(DRAG_RANGE, Math.max(0, base + e.translationY));
    })
    .onEnd((e) => {
      const shouldExpand = translateY.value < DRAG_RANGE / 2 || e.velocityY < -600;
      setExpanded(shouldExpand);
    });

  const tap = Gesture.Tap().onEnd(() => {
    setExpanded(!isExpanded.value);
  });

  const handleGesture = Gesture.Race(pan, tap);

  const handleSelect = (template: CardTemplate) => {
    onSelect(template);
    recordTemplateUsed(template.id);
    setExpanded(false);
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(translateY.value, [0, DRAG_RANGE], [180, 0])}deg` }],
  }));

  return (
    <Animated.View style={[styles.sheet, { height: EXPANDED_HEIGHT }, sheetStyle]}>
      <GestureDetector gesture={handleGesture}>
        <View style={styles.handleArea}>
          <Animated.View style={arrowStyle}>
            <Feather name="chevron-up" size={20} color={Colors.TEXT_LOW} />
          </Animated.View>
        </View>
      </GestureDetector>

      <TemplateSection
        title="For you"
        templates={recentTemplates}
        selectedId={selectedTemplateId}
        onSelect={handleSelect}
      />

      <View style={styles.expandedContent}>
        <TemplateSection
          title="System templates"
          templates={cardTemplates}
          selectedId={selectedTemplateId}
          onSelect={handleSelect}
        />
        <TemplateSection
          title="Your templates"
          templates={userTemplates}
          selectedId={selectedTemplateId}
          onSelect={handleSelect}
          emptyLabel="Templates you save will show up here"
        />
        <TemplateSection
          title="Template store"
          templates={storeTemplates}
          selectedId={selectedTemplateId}
          onSelect={handleSelect}
          emptyLabel="Coming soon — templates shared by other users"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.SURFACE_RAISED,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.BORDER,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  expandedContent: {
    gap: Spacing.lg,
  },
});