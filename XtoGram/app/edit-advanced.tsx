import { useCallback, useState } from 'react';
import { Dimensions, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCanvasRef } from '@shopify/react-native-skia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopNavBar from '../components/ui/TopNavbar';
import IconButton from '../components/ui/iconButton';
import { SceneRenderer } from '../components/tweet/scene/ScreenRenderer';
import { ElementOverlay } from '../components/tweet/editorAdvanced/ElementOverlay';
import type { PositionedElement } from '../components/tweet/scene/Layoutengine';
import { CARD_WIDTH } from '../components/tweet/skia/layout';
import { elementRegistry } from '../components/tweet/scene/registry';
import { ValueSlider } from '../components/tweet/quickAdjust/ValueSlider';
import { ColorSwatchRow } from '../components/tweet/quickAdjust/ColorsWatchRow';
import { ImagePickerButton } from '../components/tweet/editSheet/ImagePickerButton';
import { cardTemplates } from '../components/tweet/templates/definations';
import { Colors, FontSize, Radius, Spacing } from '../constants/theme';
import { useCard } from '../context/CardContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PREVIEW_WIDTH = SCREEN_WIDTH - Spacing.screen * 2 - Spacing.md * 2;
const CARD_SWATCHES = ['#0A0A0F', '#13121E', '#1E1C2A', '#2D1F6E', '#F5F4FA', '#FFFFFF'];

export default function EditAdvanced() {
  const insets = useSafeAreaInsets();
  const {
    tweet,
    template,
    setTemplate,
    frameBackgroundColor,
    cardColorOverride,
    setCardColorOverride,
    cardRadius,
    cardPadding,
    backgroundImageUri,
    cardBackgroundImageUri,
    setCardBackgroundImageUri,
    cardBackgroundImageBlur,
    setCardBackgroundImageBlur,
    selectedElementId,
    setSelectedElementId,
    updateElementPosition,
    deleteElement,
    setElementVariant,
  } = useCard();

  const canvasRef = useCanvasRef();
  const [cardHeight, setCardHeight] = useState(0);
  const [positioned, setPositioned] = useState<PositionedElement[]>([]);

  const handleLayoutComputed = useCallback((layout: { positioned: PositionedElement[] }) => {
    setPositioned(layout.positioned);
  }, []);

  const previewScale = PREVIEW_WIDTH / CARD_WIDTH;
  // Keep a stable stage while Skia fonts/layout initialise instead of
  // mounting a zero-height canvas that looks like it disappeared.
  const scaledCardHeight = Math.max(cardHeight * previewScale, 180);
  const selectedElement = template.elements.find((el) => el.id === selectedElementId) ?? null;

  if (!tweet) {
    return (
      <View style={styles.root}>
        <TopNavBar title="Edit" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No card to edit yet — go back and load a tweet first.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <TopNavBar title="Advanced edit" />

      <View style={styles.templateBar}>
        <Text style={styles.sectionLabel}>Templates</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateRow}>
          {cardTemplates.map((item) => {
            const active = item.id === template.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setSelectedElementId(null);
                  setTemplate(item);
                }}
                style={[styles.templateChip, active && styles.templateChipActive]}
              >
                <View style={[styles.templatePreview, { backgroundColor: item.palette.cardSurface }]}>
                  <View style={[styles.templateAccent, { backgroundColor: item.palette.accent }]} />
                </View>
                <Text numberOfLines={1} style={[styles.templateName, active && styles.templateNameActive]}>{item.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.stage, { backgroundColor: frameBackgroundColor }]}>
        {backgroundImageUri && (
          <ImageBackground source={{ uri: backgroundImageUri }} resizeMode="cover" style={StyleSheet.absoluteFill} imageStyle={styles.stageImage} />
        )}
        <View pointerEvents="none" style={styles.stageScrim} />
        <ScrollView
          style={styles.stageScroll}
          contentContainerStyle={styles.stageContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View
            style={[
              styles.cardShell,
              {
                width: PREVIEW_WIDTH,
                height: scaledCardHeight,
                // The renderer works in card-native pixels while this shell
                // is screen-scaled. Match its clipping radius so image-backed
                // cards and solid cards have the same rounded corners.
                borderRadius: cardRadius * previewScale,
              },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedElementId(null)} />
            <View pointerEvents="none" style={{ width: CARD_WIDTH, transform: [{ scale: previewScale }], transformOrigin: 'top left' }}>
              <SceneRenderer
                tweet={tweet}
                template={template}
                cardColorOverride={cardColorOverride}
                cardRadius={cardRadius}
                cardPadding={cardPadding}
                cardBackgroundImageUri={cardBackgroundImageUri}
                cardBackgroundImageBlur={cardBackgroundImageBlur}
                canvasRef={canvasRef}
                onHeightComputed={setCardHeight}
                onLayoutComputed={handleLayoutComputed}
              />
            </View>
            <ElementOverlay
              positioned={positioned}
              scale={previewScale}
              selectedElementId={selectedElementId}
              onSelect={setSelectedElementId}
              onCommitPosition={updateElementPosition}
            />
          </View>
        </ScrollView>
      </View>

      <View style={[styles.propertyPanel, { paddingBottom: Math.max(Spacing.lg, insets.bottom + Spacing.sm) }]}>
        {selectedElement ? (
          <>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelTitle}>{selectedElement.type}</Text>
                <Text style={styles.panelHint}>Drag to move · use the corner handle to resize</Text>
              </View>
              <IconButton name="trash-2" onPress={() => deleteElement(selectedElement.id)} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variantRow}>
              {Object.keys(elementRegistry[selectedElement.type]).map((variantName) => {
                const isActive = variantName === selectedElement.variant;
                return (
                  <Pressable key={variantName} onPress={() => setElementVariant(selectedElement.id, variantName)} style={[styles.variantChip, isActive && styles.variantChipActive]}>
                    <Text style={[styles.variantLabel, isActive && styles.variantLabelActive]}>{variantName}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        ) : (
          <>
            <Text style={styles.panelTitle}>Card surface</Text>
            <ColorSwatchRow
              swatches={CARD_SWATCHES}
              selected={cardColorOverride ?? template.palette.cardSurface}
              onSelect={setCardColorOverride}
              resetTo={cardColorOverride ? template.palette.cardSurface : undefined}
              onReset={() => setCardColorOverride(undefined)}
            />
            <ImagePickerButton label="card" imageUri={cardBackgroundImageUri} onChange={setCardBackgroundImageUri} />
            {cardBackgroundImageUri && (
              <View style={styles.imageBlurControl}>
                <Text style={styles.adjustLabel}>Card image blur</Text>
                <ValueSlider value={cardBackgroundImageBlur} min={0} max={40} onChange={setCardBackgroundImageBlur} />
              </View>
            )}
            <Text style={styles.panelHint}>Use Home → Adjust for card padding and corner rounding. Tap a card element to move it, resize it, or change its layout.</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.BG_BASE },
  templateBar: { backgroundColor: Colors.SURFACE, borderBottomWidth: 1, borderBottomColor: Colors.BORDER, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  sectionLabel: { color: Colors.TEXT_HIGH, fontSize: FontSize.label, fontWeight: '700', paddingHorizontal: Spacing.screen, marginBottom: Spacing.sm },
  templateRow: { paddingHorizontal: Spacing.screen, gap: Spacing.sm },
  templateChip: { width: 92, gap: 5 },
  templateChipActive: { opacity: 1 },
  templatePreview: { height: 46, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.BORDER, padding: Spacing.sm, justifyContent: 'flex-end', overflow: 'hidden' },
  templateAccent: { height: 5, borderRadius: Radius.full, width: '62%' },
  templateName: { color: Colors.TEXT_LOW, fontSize: 11 },
  templateNameActive: { color: Colors.TEXT_HIGH, fontWeight: '700' },
  stage: { flex: 1, minHeight: 220, overflow: 'hidden' },
  stageImage: { opacity: 0.52 },
  stageScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.38)' },
  stageScroll: { flex: 1 },
  stageContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.screen, paddingVertical: Spacing.lg },
  cardShell: { borderRadius: Radius.sm, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  propertyPanel: { backgroundColor: Colors.SURFACE_RAISED, borderTopWidth: 1, borderTopColor: Colors.BORDER, paddingHorizontal: Spacing.screen, paddingTop: Spacing.md, paddingBottom: Spacing.lg, gap: Spacing.sm },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { color: Colors.TEXT_HIGH, fontSize: FontSize.body, fontWeight: '700' },
  panelHint: { color: Colors.TEXT_LOW, fontSize: FontSize.caption, lineHeight: 17 },
  variantRow: { gap: Spacing.sm, paddingVertical: 2 },
  variantChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.BORDER, backgroundColor: Colors.SURFACE },
  variantChipActive: { backgroundColor: Colors.PRIMARY, borderColor: Colors.PRIMARY },
  variantLabel: { color: Colors.TEXT_MED, fontSize: FontSize.bodySmall, fontWeight: '600' },
  variantLabelActive: { color: Colors.BG_BASE },
  imageBlurControl: { gap: Spacing.xs },
  adjustLabel: { color: Colors.TEXT_MED, fontSize: FontSize.caption, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.screen },
  emptyText: { color: Colors.TEXT_LOW, fontSize: FontSize.body, textAlign: 'center' },
});
