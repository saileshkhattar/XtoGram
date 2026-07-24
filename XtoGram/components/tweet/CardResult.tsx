import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useCanvasRef, type SkImage } from '@shopify/react-native-skia';
import { SceneRenderer } from './scene/ScreenRenderer';
import { darkClassicTemplate } from './templates/definations';
import type { CardTemplate } from './scene/types';
import { CARD_WIDTH } from './skia/layout';
import { Colors, Spacing } from '../../constants/theme';
import IconButton from '../ui/iconButton';
// import { InstagramFrame } from './InstagramFrame'; // deferred Instagram preview
import { CardOptions, type FramePreset } from './CardOptions';
import { TransformableView, type TransformableViewHandle } from '../shared/TransformableView';
import { renderFramedImage } from './exportFrame';
import type { Tweet } from '../../types/tweet';

export type CardResultHandle = {
  getExportImage: () => Promise<SkImage>;
};

type Props = {
  tweet: Tweet;
  previewWidth: number;
  // Which CardTemplate to render. Defaults to Dark Classic so any existing
  // caller not yet passing this (or a future one that doesn't care) keeps
  // working unchanged.
  template?: CardTemplate;
  onSave: () => void;
  onShare: () => void;
  saving: boolean;
  sharing: boolean;
  onReady?: () => void;

  // Quick-adjust values — now owned by the parent screen (home.tsx), not
  // local state here, so the parent (and the EditSheet it hosts) can
  // coordinate resetting these when the template changes. CardResult just
  // renders whatever it's given and forwards the "open the sheet" tap.
  frameBackgroundColor: string;
  cardColorOverride?: string;
  cardRadius: number;
  cardPadding: number;
  backgroundImageUri?: string;
  cardBackgroundImageUri?: string;
  backgroundImageBlur?: number;
  cardBackgroundImageBlur?: number;
  onOpenAdjust: () => void;
};

const PRESET_RATIOS: Record<Exclude<FramePreset, 'custom'>, number> = {
  post_square: 1,
  story: 9 / 16,
  // post_portrait: 4 / 5, // redundant for now
};

const EXPORT_LONG_SIDE = 1080;

const CardResult = forwardRef<CardResultHandle, Props>(function CardResult(
  {
    tweet,
    previewWidth,
    template = darkClassicTemplate,
    onSave,
    onShare,
    saving,
    sharing,
    onReady,
    frameBackgroundColor,
    cardColorOverride,
    cardRadius,
    cardPadding,
    backgroundImageUri,
    cardBackgroundImageUri,
    backgroundImageBlur = 0,
    cardBackgroundImageBlur = 0,
    onOpenAdjust,
  },
  ref
) {
  const cardCanvasRef = useCanvasRef();
  const [cardHeight, setCardHeight] = useState(0);

  // checkbox 1 — background/frame box around the card
  const [showBackground, setShowBackground] = useState(false);
  const [preset, setPreset] = useState<FramePreset>('post_square');
  const [customWidth, setCustomWidth] = useState('1080');
  const [customHeight, setCustomHeight] = useState('1080');
  const [isRendering, setIsRendering] = useState(true);

  const transformRef = useRef<TransformableViewHandle>(null);

  const previewScale = previewWidth / CARD_WIDTH;
  const scaledCardHeight = cardHeight * previewScale;

  // size of the background/frame box (checkbox 1) — feeds export sizing too
  const frameWidth = previewWidth;
  const frameHeight =
    preset === 'custom'
      ? frameWidth * ((Number(customHeight) || 1) / (Number(customWidth) || 1))
      : frameWidth / PRESET_RATIOS[preset as Exclude<FramePreset, 'custom'>];
  // Fit the complete card into a newly selected frame. This avoids exporting
  // the initial 1× card as a cropped, zoomed image; users can still pinch
  // smaller or larger afterwards.
  const initialFrameScale = cardHeight
    ? Math.min(frameWidth / previewWidth, frameHeight / scaledCardHeight)
    : 1;

  useImperativeHandle(
    ref,
    () => ({
      getExportImage: async () => {
        const canvas = cardCanvasRef.current;
        if (!canvas) throw new Error('Card is not ready yet');
        const cardImage = canvas.makeImageSnapshot();
        if (!cardImage) throw new Error('Could not snapshot the card');

        // Export only includes the card, or the card + background box.
        if (!showBackground) return cardImage;

        // cardImage is the Skia canvas's raw backing-store pixels, which is
        // rendered at the device's pixel ratio (e.g. 3x) — NOT at the logical
        // CARD_WIDTH the rest of this math assumes. Correct for that here so
        // the card lands at the right size regardless of device pixel ratio,
        // instead of getting drawn ~pixelRatio× too large and off-center.
        const cardPixelRatio = cardImage.width() / CARD_WIDTH;

        const exportScale = EXPORT_LONG_SIDE / Math.max(frameWidth, frameHeight);
        const t = transformRef.current?.getSnapshot() ?? {
          translateX: 0,
          translateY: 0,
          scale: 1,
          rotation: 0,
        };

        return renderFramedImage({
          frameWidth: frameWidth * exportScale,
          frameHeight: frameHeight * exportScale,
          backgroundColor: frameBackgroundColor,
          backgroundImageUri,
          backgroundImageBlur,
          cardImage,
          transform: {
            translateX: t.translateX * exportScale,
            translateY: t.translateY * exportScale,
            scale: (t.scale * previewScale * exportScale) / cardPixelRatio,
            rotation: t.rotation,
          },
        });
      },
    }),
    [showBackground, frameWidth, frameHeight, previewScale, frameBackgroundColor, backgroundImageUri, backgroundImageBlur]
  );

  // Do not collapse the home hero until Skia has had a frame to paint the new
  // card. Frame size changes (preset/custom width/height) no longer redraw
  // the card itself, so they don't need to re-trigger this overlay anymore.
  useEffect(() => {
    if (!cardHeight) return;
    setIsRendering(true);
    const firstFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsRendering(false);
        onReady?.();
      });
    });
    return () => cancelAnimationFrame(firstFrame);
  }, [tweet.id, cardHeight, onReady]);

  // Selecting a frame image is an explicit request for a visible frame, so
  // do not leave it hidden behind the optional background toggle.
  useEffect(() => {
    if (backgroundImageUri) setShowBackground(true);
  }, [backgroundImageUri]);

  const cardOnly = (
    <View style={{ width: previewWidth, height: scaledCardHeight, overflow: 'hidden', borderRadius: cardRadius }}>
      <View
        style={{
          width: CARD_WIDTH,
          transform: [{ scale: previewScale }],
          transformOrigin: 'top left',
        }}
      >
        <SceneRenderer
          tweet={tweet}
          template={template}
          cardColorOverride={cardColorOverride}
          cardRadius={cardRadius}
          cardPadding={cardPadding}
          cardBackgroundImageUri={cardBackgroundImageUri}
          cardBackgroundImageBlur={cardBackgroundImageBlur}
          canvasRef={cardCanvasRef}
          onHeightComputed={setCardHeight}
        />
      </View>
    </View>
  );

  // gesture logic only exists when there's a box to drag the card within.
  // No `key` here on purpose: remounting would tear down and re-render the
  // Skia card underneath every time the frame size changes. Instead the
  // effect below re-fits the existing transform in place.
  const withBackground = showBackground ? (
    <TransformableView
      ref={transformRef}
      frameWidth={frameWidth}
      frameHeight={frameHeight}
      backgroundColor={frameBackgroundColor}
      backgroundImageUri={backgroundImageUri}
      backgroundImageBlur={backgroundImageBlur}
      minScale={0.05}
      initial={{ scale: initialFrameScale }}
    >
      {cardOnly}
    </TransformableView>
  ) : (
    cardOnly
  );

  // Re-fit the card into the frame whenever the frame's own size changes
  // (preset switch, custom width/height edit). This does NOT reset pan or
  // rotation the user has already applied, and never touches the card
  // itself — only the transform wrapping it.
  useEffect(() => {
    if (!showBackground || !cardHeight) return;
    transformRef.current?.setScale(initialFrameScale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBackground, preset, customWidth, customHeight]);

  /* Instagram-preview feature — deferred.
  const igFrameHeight = previewWidth / PRESET_RATIOS[instagramPreset];
  const displayed = showInstagramPreview ? (
    <InstagramFrame author={tweet.author}>
      <View
        style={{
          width: previewWidth,
          height: igFrameHeight,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {withBackground}
      </View>
    </InstagramFrame>
  ) : (
    withBackground
  );
  */
  const displayed = withBackground;

  /* Instagram-preview feature — deferred CardOptions props:
  showInstagramPreview={showInstagramPreview}
  onToggleInstagramPreview={setShowInstagramPreview}
  instagramPreset={instagramPreset}
  onInstagramPresetChange={setInstagramPreset}
  */

  return (
    <View style={styles.wrap}>
      <CardOptions
        enabled={showBackground}
        onToggle={setShowBackground}
        preset={preset}
        onPresetChange={setPreset}
        customWidth={customWidth}
        customHeight={customHeight}
        onCustomWidthChange={setCustomWidth}
        onCustomHeightChange={setCustomHeight}
      />

      <View
        style={[
          styles.previewWrap,
          {
            minHeight: showBackground
              ? frameHeight
              : cardHeight
                ? scaledCardHeight
                : previewWidth * 1.25, // placeholder aspect until the real card height is known
          },
        ]}
      >
        {displayed}
        {isRendering && (
          <View pointerEvents="none" style={styles.renderingOverlay}>
            <ActivityIndicator size="small" color={Colors.PRIMARY} />
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <IconButton name="sliders" onPress={onOpenAdjust} disabled={saving || sharing} />
        <IconButton name="edit-3" onPress={() => router.push('/edit-advanced')} disabled={saving || sharing} />
        <IconButton name="download" onPress={onSave} loading={saving} disabled={sharing} />
        <IconButton name="share-2" onPress={onShare} loading={sharing} disabled={saving} />
      </View>
    </View>
  );
});

export default CardResult;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  previewWrap: {
    position: 'relative',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  renderingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 10, 15, 0.35)',
  },
});
