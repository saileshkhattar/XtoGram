import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useCanvasRef, type SkImage } from '@shopify/react-native-skia';
import { RegularCard } from './templates/RegularCard';
import { CARD_WIDTH } from './skia/layout';
import { Colors, Spacing } from '../../constants/theme';
import IconButton from '../ui/iconButton';
import { InstagramFrame } from './InstagramFrame'
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
};

const PRESET_RATIOS: Record<Exclude<FramePreset, 'custom'>, number> = {
  post_square: 1,
  post_portrait: 4 / 5,
  story: 9 / 16,
};

const EXPORT_LONG_SIDE = 1080;

const CardResult = forwardRef<CardResultHandle, Props>(function CardResult(
  { tweet, previewWidth, onSave, onShare, saving, sharing },
  ref
) {
  const cardCanvasRef = useCanvasRef();
  const [cardHeight, setCardHeight] = useState(0);

  const [customSize, setCustomSize] = useState(false);
  const [preset, setPreset] = useState<FramePreset>('post_square');
  const [customWidth, setCustomWidth] = useState('1080');
  const [customHeight, setCustomHeight] = useState('1080');

  const transformRef = useRef<TransformableViewHandle>(null);

  const previewScale = previewWidth / CARD_WIDTH;
  const scaledCardHeight = cardHeight * previewScale;

  const frameWidth = previewWidth;
  const frameHeight =
    preset === 'custom'
      ? frameWidth * ((Number(customHeight) || 1) / (Number(customWidth) || 1))
      : frameWidth / PRESET_RATIOS[preset as Exclude<FramePreset, 'custom'>];

  useImperativeHandle(
    ref,
    () => ({
      getExportImage: () => {
        const canvas = cardCanvasRef.current;
        if (!canvas) throw new Error('Card is not ready yet');
        const cardImage = canvas.makeImageSnapshot();
        if (!cardImage) throw new Error('Could not snapshot the card');

        if (!customSize) return cardImage;

        // Export at a fixed resolution regardless of screen size —
        // scale everything (frame + transform) up from preview-pixel
        // space into export-pixel space by the same factor.
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
          backgroundColor: Colors.BG_BASE,
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
    [customSize, frameWidth, frameHeight, previewScale]
  );

  const cardBlock = (
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

  return (
    <View style={styles.wrap}>
      <CardOptions
        enabled={customSize}
        onToggle={setCustomSize}
        preset={preset}
        onPresetChange={setPreset}
        customWidth={customWidth}
        customHeight={customHeight}
        onCustomWidthChange={setCustomWidth}
        onCustomHeightChange={setCustomHeight}
      />

      <InstagramFrame author={tweet.author}>
        {customSize ? (
          // Card renders at its natural size and gets dragged/pinched
          // as a sticker inside the fixed frame — the frame itself
          // never reflows the card's own layout.
          <TransformableView
            ref={transformRef}
            frameWidth={frameWidth}
            frameHeight={frameHeight}
            minScale={frameWidth / previewWidth}
          >
            {cardBlock}
          </TransformableView>
        ) : (
          <View style={{ width: frameWidth }}>{cardBlock}</View>
        )}
      </InstagramFrame>

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
});