import { useState } from 'react';
import { View } from 'react-native';
import { useCanvasRef } from '@shopify/react-native-skia';
import { SceneRenderer } from '../scene/ScreenRenderer';
import { CARD_WIDTH } from '../skia/layout';
import { Radius } from '../../../constants/theme';
import type { Tweet } from '../../../types/tweet';
import type { CardTemplate } from '../scene/types';

type Props = {
  tweet: Tweet;
  template: CardTemplate;
  cardColorOverride?: string;
  cardRadius: number;
  cardPadding: number;
  cardBackgroundImageUri?: string;
};

// Fixed width, capped height — sized independently of how much space is
// left in the sheet, so it always stays legible. A second, independent
// Skia canvas from the main CardResult one; only mounted while the sheet
// is expanded (see EditSheet), so it costs nothing while peeked.
const DOCK_WIDTH = 220;
const DOCK_MAX_HEIGHT = 260;

export function DockedCardPreview({ tweet, template, cardColorOverride, cardRadius, cardPadding, cardBackgroundImageUri }: Props) {
  const canvasRef = useCanvasRef();
  const [cardHeight, setCardHeight] = useState(0);
  const scale = DOCK_WIDTH / CARD_WIDTH;

  // IMPORTANT: the outer box is sized to the ALREADY-SCALED result
  // (scaledHeight), not the card's raw height. transform:scale shrinks an
  // element toward its own center — if the outer container's size doesn't
  // exactly match the scaled visual size, the result crops off-center
  // (same bug fixed earlier in TransformableView's frame pivot). Giving the
  // outer box the exact scaled dimensions keeps both centers coincident.
  // Only in the rare case of an unusually tall card (scaledHeight exceeding
  // the cap) does this fall back to a symmetric center-crop rather than a
  // top-anchored one — an acceptable tradeoff for a small dock preview.
  const scaledHeight = Math.min(cardHeight * scale, DOCK_MAX_HEIGHT);

  return (
    <View
      style={{
        width: DOCK_WIDTH,
        height: scaledHeight,
        alignSelf: 'center',
        overflow: 'hidden',
        borderRadius: Radius.md,
      }}
    >
      <View style={{ width: CARD_WIDTH, height: cardHeight, transform: [{ scale }] }}>
        <SceneRenderer
          tweet={tweet}
          template={template}
          cardColorOverride={cardColorOverride}
          cardRadius={cardRadius}
          cardPadding={cardPadding}
          cardBackgroundImageUri={cardBackgroundImageUri}
          canvasRef={canvasRef}
          onHeightComputed={setCardHeight}
        />
      </View>
    </View>
  );
}
