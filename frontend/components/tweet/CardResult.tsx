import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useCanvasRef, type SkImage } from '@shopify/react-native-skia';
import { RegularCard } from './templates/RegularCard';
import { CARD_WIDTH } from './skia/layout';
import { Colors, Spacing } from '../../constants/theme';
import IconButton from '../ui/iconButton';
// import { InstagramFrame } from './InstagramFrame'; // deferred Instagram preview
import { CardOptions, type FramePreset } from './CardOptions';
import { TransformableView, type TransformableViewHandle } from '../shared/TransformableView';
import { renderFramedImage } from './exportFrame';
import type { Tweet } from '../../types/tweet';

export type CardResultHandle = {
  getExportImage: () => SkImage;
};

type Props = {
  tweet: Tweet;
  previewWidth: number;
  onSave: () => void;
  onShare: () => void;
  saving: boolean;
  sharing: boolean;
  onReady?: () => void;
};

const PRESET_RATIOS: Record<Exclude<FramePreset, 'custom'>, number> = {
  post_square: 1,
  story: 9 / 16,
  // post_portrait: 4 / 5, // redundant for now
};

const EXPORT_LONG_SIDE = 1080;

const CardResult = forwardRef<CardResultHandle, Props>(function CardResult(
  { tweet, previewWidth, onSave, onShare, saving, sharing, onReady },
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
      getExportImage: () => {
        const canvas = cardCanvasRef.current;
        if (!canvas) throw new Error('Card is not ready yet');
        const cardImage = canvas.makeImageSnapshot();
        if (!cardImage) throw new Error('Could not snapshot the card');

        // Export only includes the card, or the card + background box.
        if (!showBackground) return cardImage;

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
          backgroundColor: Colors.SURFACE,
          cardImage,
          transform: {
            translateX: t.translateX * exportScale,
            translateY: t.translateY * exportScale,
            scale: t.scale * previewScale * exportScale,
            rotation: t.rotation,
          },
        });
      },
    }),
    [showBackground, frameWidth, frameHeight, previewScale]
  );

  // Do not collapse the home hero until Skia has had a frame to paint the new
  // card. The same brief overlay is used while a frame configuration reflows.
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
  }, [tweet.id, cardHeight, showBackground, preset, customWidth, customHeight, onReady]);

  const cardOnly = (
    <View style={{ width: previewWidth, height: scaledCardHeight }}>
      <View
        style={{
          width: CARD_WIDTH,
          transform: [{ scale: previewScale }],
          transformOrigin: 'top left',
        }}
      >
        <RegularCard tweet={tweet} canvasRef={cardCanvasRef} onHeightComputed={setCardHeight} />
      </View>
    </View>
  );

  // gesture logic only exists when there's a box to drag the card within
  const withBackground = showBackground ? (
    <TransformableView
      key={`${preset}-${frameWidth}-${frameHeight}`}
      ref={transformRef}
      frameWidth={frameWidth}
      frameHeight={frameHeight}
      backgroundColor={Colors.SURFACE}
      minScale={0.05}
      initial={{ scale: initialFrameScale }}
    >
      {cardOnly}
    </TransformableView>
  ) : (
    cardOnly
  );

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

      <View style={styles.previewWrap}>
        {displayed}
        {isRendering && (
          <View pointerEvents="none" style={styles.renderingOverlay}>
            <ActivityIndicator size="small" color={Colors.PRIMARY} />
          </View>
        )}
      </View>

      <View style={styles.actions}>
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
