import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '../../../constants/theme';
import { TemplateSection } from '../templatePicker/TemplateSection';
import { TemplatesTab } from './TemplateTab';
import { AdjustTab } from './AdjustTab';
import { DockedCardPreview } from './DockerCardPreview';
import { useRecentTemplates } from '../../../hooks/useRecentTemplate';
import { cardTemplates } from '../templates/definations';
import type { CardTemplate } from '../scene/types';
import type { Tweet } from '../../../types/tweet';
import { TemplatePreviewModal } from './TemplatePreviewModal';

export type EditSheetTab = 'templates' | 'adjust';

export type EditSheetHandle = {
  expand: (tab?: EditSheetTab) => void;
  collapse: () => void;
};

type Props = {
  tweet: Tweet;
  template: CardTemplate;
  selectedTemplateId: string;
  onSelectTemplate: (template: CardTemplate) => void;

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
  cardBackgroundImageUri?: string;
  onCardBackgroundImageChange: (uri: string | undefined) => void;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const PEEK_HEIGHT = 168;
// Capped noticeably below full-screen — the sheet does not get to eat the
// whole screen just because there's a lot of tab content (that content
// scrolls instead). This is what keeps the docked card preview at a
// comfortable, legible size instead of everything getting squeezed thinner
// as more content gets added to a tab.
const EXPANDED_HEIGHT = Math.min(SCREEN_HEIGHT * 0.58, 480);
const DRAG_RANGE = EXPANDED_HEIGHT - PEEK_HEIGHT;

// A controlled ease instead of a spring — a spring's overshoot/bounce on
// open and close read as glitchy rather than polished.
const TIMING = { duration: 260, easing: Easing.out(Easing.cubic) };

export const EditSheet = forwardRef<EditSheetHandle, Props>(function EditSheet(
  {
    tweet,
    template,
    selectedTemplateId,
    onSelectTemplate,
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
    cardBackgroundImageUri,
    onCardBackgroundImageChange,
  },
  ref
) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<EditSheetTab>('templates');
  // Mirrors the shared-value expanded state on the JS thread, purely to
  // decide what to mount (docked preview, tab bar) — the actual open/close
  // motion is driven by the shared value below, not this.
  const [expandedUI, setExpandedUI] = useState(false);
  const [templatePreview, setTemplatePreview] = useState<CardTemplate | null>(null);

  const { recentIds, recordTemplateUsed } = useRecentTemplates();
  const recentTemplates = useMemo(() => {
    const byId = new Map(cardTemplates.map((t) => [t.id, t]));
    const resolved = recentIds.map((id) => byId.get(id)).filter((t): t is CardTemplate => !!t);
    return resolved.length > 0 ? resolved : cardTemplates.slice(0, 5);
  }, [recentIds]);

  // 0 = fully expanded, DRAG_RANGE = peeked (resting state)
  const translateY = useSharedValue(DRAG_RANGE);
  const startY = useSharedValue(DRAG_RANGE);
  const isExpanded = useSharedValue(false);

  const setExpanded = (next: boolean) => {
    'worklet';
    isExpanded.value = next;
    translateY.value = withTiming(next ? 0 : DRAG_RANGE, TIMING);
    runOnJS(setExpandedUI)(next);
  };

  useImperativeHandle(ref, () => ({
    expand: (nextTab) => {
      if (nextTab) setTab(nextTab);
      setExpanded(true);
    },
    collapse: () => setExpanded(false),
  }));

  const pan = Gesture.Pan()
    // Lets ordinary taps on the arrow/Done/tab labels inside this same
    // region pass through to their own onPress instead of being captured
    // by the drag — only a real drag (>10px) activates this gesture.
    .activeOffsetY([-10, 10])
    .onStart(() => {
      // Capture wherever the sheet ACTUALLY is right now, not an assumed
      // 0/DRAG_RANGE. Without this, starting a new drag while the previous
      // open/close animation was still finishing caused a visible jump —
      // the root cause of needing repeated swipes before.
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateY.value = Math.min(DRAG_RANGE, Math.max(0, startY.value + e.translationY));
    })
    .onEnd((e) => {
      const shouldExpand = translateY.value < DRAG_RANGE / 2 || e.velocityY < -500;
      setExpanded(shouldExpand);
    });

  const handleApplyTemplate = (next: CardTemplate) => {
    onSelectTemplate(next);
    recordTemplateUsed(next.id);
    setTemplatePreview(null);
  };

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(translateY.value, [0, DRAG_RANGE], [180, 0])}deg` }],
  }));
  const dockStyle = useAnimatedStyle(() => ({ opacity: interpolate(translateY.value, [0, DRAG_RANGE * 0.55], [1, 0]) }));

  return (
    <Animated.View
      style={[
        styles.sheet,
        { height: EXPANDED_HEIGHT, paddingBottom: Spacing.md + insets.bottom },
        sheetStyle,
      ]}
    >
      {/* Drag surface: the handle, plus (peeked) the "For you" row, or
          (expanded) the docked card + tab bar. Deliberately excludes the
          scrollable tab content below, so dragging there scrolls instead
          of fighting the sheet's own open/close gesture. */}
      <GestureDetector gesture={pan}>
        <View>
          <View style={styles.handleRow}>
            <Pressable onPress={() => setExpanded(!expandedUI)} hitSlop={12}>
              <Animated.View style={arrowStyle}>
                <Feather name="chevron-up" size={20} color={Colors.TEXT_LOW} />
              </Animated.View>
            </Pressable>
            {expandedUI && (
              <Pressable onPress={() => setExpanded(false)} hitSlop={12} style={styles.doneButton}>
                <Text style={styles.doneLabel}>Done</Text>
              </Pressable>
            )}
          </View>

          {!expandedUI && (
            <TemplateSection
              title="For you"
              templates={recentTemplates}
              selectedId={selectedTemplateId}
              onSelect={setTemplatePreview}
            />
          )}

          {expandedUI && (
            <>
              <View style={styles.tabs}>
                <Pressable onPress={() => setTab('templates')} style={styles.tab}>
                  <Text style={[styles.tabLabel, tab === 'templates' && styles.tabLabelActive]}>Templates</Text>
                </Pressable>
                <Pressable onPress={() => setTab('adjust')} style={styles.tab}>
                  <Text style={[styles.tabLabel, tab === 'adjust' && styles.tabLabelActive]}>Adjust</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </GestureDetector>

      {expandedUI && (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
          {/* Keep both tab trees mounted after opening. Switching is now only
              a visibility change, so Skia thumbnails and picker state do not
              restart and flash when moving back and forth. */}
          <View style={tab === 'templates' ? undefined : styles.inactiveTab}>
            <TemplatesTab selectedTemplateId={selectedTemplateId} onSelect={setTemplatePreview} />
          </View>
          <View style={tab === 'adjust' ? undefined : styles.inactiveTab}>
            <AdjustTab
              backgroundColor={backgroundColor}
              onBackgroundColorChange={onBackgroundColorChange}
              cardColor={cardColor}
              onCardColorChange={onCardColorChange}
              defaultCardColor={defaultCardColor}
              cardRadius={cardRadius}
              onCardRadiusChange={onCardRadiusChange}
              cardPadding={cardPadding}
              onCardPaddingChange={onCardPaddingChange}
              backgroundImageUri={backgroundImageUri}
              onBackgroundImageChange={onBackgroundImageChange}
              cardImageUri={cardBackgroundImageUri}
              onCardImageChange={onCardBackgroundImageChange}
            />
          </View>
        </ScrollView>
      )}
      <Animated.View pointerEvents="none" style={[styles.dockedPreview, dockStyle]}>
        <DockedCardPreview tweet={tweet} template={template} cardColorOverride={cardColor} cardRadius={cardRadius} cardPadding={cardPadding} cardBackgroundImageUri={cardBackgroundImageUri} />
      </Animated.View>
      <TemplatePreviewModal template={templatePreview} tweet={tweet} onClose={() => setTemplatePreview(null)} onApply={handleApplyTemplate} />
    </Animated.View>
  );
});

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
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  doneButton: { position: 'absolute', right: 0 },
  doneLabel: { color: Colors.PRIMARY, fontSize: FontSize.bodySmall, fontWeight: '600' },
  tabs: { flexDirection: 'row', gap: Spacing.lg, justifyContent: 'center', marginTop: Spacing.sm },
  tab: { paddingBottom: Spacing.xs },
  tabLabel: { color: Colors.TEXT_LOW, fontSize: FontSize.bodySmall, fontWeight: '600' },
  tabLabelActive: { color: Colors.TEXT_HIGH, borderBottomWidth: 2, borderBottomColor: Colors.PRIMARY },
  content: { marginTop: Spacing.md },
  contentInner: { paddingBottom: Spacing.lg },
  dockedPreview: { position: 'absolute', bottom: EXPANDED_HEIGHT + Spacing.md, left: 0, right: 0 },
  inactiveTab: { display: 'none' },
});
