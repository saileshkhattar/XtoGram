import { useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, View } from 'react-native';
import { useCanvasRef } from '@shopify/react-native-skia';
import { SceneRenderer } from '../scene/ScreenRenderer';
import { CARD_WIDTH } from '../skia/layout';
import { Colors, Radius, Spacing } from '../../../constants/theme';
import type { Tweet } from '../../../types/tweet';
import type { CardTemplate } from '../scene/types';

type Props = {
  tweet: Tweet;
  template: CardTemplate;
  cardColorOverride?: string;
  cardRadius: number;
  cardPadding: number;
  cardBackgroundImageUri?: string;
  backgroundColor: string;
  backgroundImageUri?: string;
  backgroundImageBlur: number;
  cardBackgroundImageBlur: number;
};

// Fixed width, capped height — sized independently of how much space is
// left in the sheet, so it always stays legible. A second, independent
// Skia canvas from the main CardResult one; only mounted while the sheet
// is expanded (see EditSheet), so it costs nothing while peeked.
const FRAME_WIDTH = Math.min(Dimensions.get('window').width - Spacing.screen * 2, 392);
const FRAME_PADDING = Spacing.md;
const CARD_WIDTH_IN_PREVIEW = FRAME_WIDTH - FRAME_PADDING * 2;
const DOCK_MAX_HEIGHT = 360;

export function DockedCardPreview({ tweet, template, cardColorOverride, cardRadius, cardPadding, cardBackgroundImageUri, backgroundColor, backgroundImageUri, backgroundImageBlur, cardBackgroundImageBlur }: Props) {
  const canvasRef = useCanvasRef();
  const [cardHeight, setCardHeight] = useState(0);
  const scale = CARD_WIDTH_IN_PREVIEW / CARD_WIDTH;

  // IMPORTANT: the outer box is sized to the ALREADY-SCALED result
  // (scaledHeight), not the card's raw height. transform:scale shrinks an
  // element toward its own center — if the outer container's size doesn't
  // exactly match the scaled visual size, the result crops off-center
  // (same bug fixed earlier in TransformableView's frame pivot). Giving the
  // outer box the exact scaled dimensions keeps both centers coincident.
  // Only in the rare case of an unusually tall card (scaledHeight exceeding
  // the cap) does this fall back to a symmetric center-crop rather than a
  // top-anchored one — an acceptable tradeoff for a small dock preview.
  const scaledHeight = cardHeight ? Math.min(cardHeight * scale + FRAME_PADDING * 2, DOCK_MAX_HEIGHT) : DOCK_MAX_HEIGHT;

  return (
    <View
      style={{
        width: FRAME_WIDTH,
        height: scaledHeight,
        alignSelf: 'center',
        overflow: 'hidden',
        borderRadius: Radius.md,
        backgroundColor,
      }}
    >
      {backgroundImageUri && <Image source={{ uri: backgroundImageUri }} resizeMode="cover" blurRadius={backgroundImageBlur} style={StyleSheet.absoluteFill} />}
      <View style={{ width: CARD_WIDTH, minHeight: DOCK_MAX_HEIGHT / scale, margin: FRAME_PADDING, transform: [{ scale }], transformOrigin: 'top left' }}>
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
        />
      </View>
      {!cardHeight && <View pointerEvents="none" style={styles.loading}><ActivityIndicator color="#FFFFFF" /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
