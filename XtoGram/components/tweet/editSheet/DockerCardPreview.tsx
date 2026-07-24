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
const CARD_MAX_HEIGHT_IN_PREVIEW = FRAME_WIDTH - FRAME_PADDING * 2;

export function DockedCardPreview({ tweet, template, cardColorOverride, cardRadius, cardPadding, cardBackgroundImageUri, backgroundColor, backgroundImageUri, backgroundImageBlur, cardBackgroundImageBlur }: Props) {
  const canvasRef = useCanvasRef();
  const [cardHeight, setCardHeight] = useState(0);
  // A fixed square matches the default 1:1 frame. Fit the whole card into
  // it rather than letting a tall tweet crop away the user's background.
  const scale = cardHeight
    ? Math.min(CARD_WIDTH_IN_PREVIEW / CARD_WIDTH, CARD_MAX_HEIGHT_IN_PREVIEW / cardHeight)
    : CARD_WIDTH_IN_PREVIEW / CARD_WIDTH;
  const cardPreviewWidth = CARD_WIDTH * scale;
  const cardPreviewHeight = cardHeight * scale;
  const cardLeft = (FRAME_WIDTH - cardPreviewWidth) / 2;
  const cardTop = (FRAME_WIDTH - cardPreviewHeight) / 2;

  return (
    <View
      style={{
        width: FRAME_WIDTH,
        height: FRAME_WIDTH,
        alignSelf: 'center',
        overflow: 'hidden',
        borderRadius: Radius.md,
        backgroundColor,
      }}
    >
      {backgroundImageUri && <Image source={{ uri: backgroundImageUri }} resizeMode="cover" blurRadius={backgroundImageBlur} style={StyleSheet.absoluteFill} />}
      <View style={{ position: 'absolute', left: cardLeft, top: cardTop, width: CARD_WIDTH, minHeight: CARD_MAX_HEIGHT_IN_PREVIEW / scale, transform: [{ scale }], transformOrigin: 'top left' }}>
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
