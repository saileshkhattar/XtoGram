import { memo, useEffect, useMemo } from "react";
import { Blur, Canvas, Group, Image as SkiaImage, RoundedRect, useCanvasRef, useImage } from "@shopify/react-native-skia";
import { useTweetFonts } from "../skia/fonts";
import { CARD_WIDTH, CARD_RADIUS } from "../skia/layout";
import { elementRegistry } from "./registry";
import { computeElementLayout, type ComputedLayout } from "./Layoutengine";
import type { CardTemplate } from "./types";
import { type Tweet } from "../../../types/tweet";
import { PADDING } from "../skia/layout";           // extend the existing layout import
import { buildSimpleParagraph } from "../skia/paragraphs";
import { TweetText } from "../skia/TweetText";
import { FONT_WEIGHT_REGULAR } from "../skia/fonts";
import { hasEdits } from "../../../utils/conversation";

type Props = {
  tweet: Tweet;
  template: CardTemplate;
  canvasRef: ReturnType<typeof useCanvasRef>;
  onHeightComputed?: (height: number) => void;
  onLayoutComputed?: (layout: ComputedLayout) => void;
  cardColorOverride?: string;
  cardRadius?: number;
  cardPadding?: number;
  cardBackgroundImageUri?: string;
  cardBackgroundImageBlur?: number;
};

export const SceneRenderer = memo(function SceneRenderer({
  tweet,
  template,
  canvasRef,
  onHeightComputed,
  onLayoutComputed,
  cardColorOverride,
  cardRadius,
  cardPadding,
  cardBackgroundImageUri,
  cardBackgroundImageBlur = 0,
}: Props) {
  const fontMgr = useTweetFonts();
  const backgroundImage = useImage(cardBackgroundImageUri);

  const layout = useMemo(() => {
    if (!fontMgr) return null;
    return computeElementLayout({ tweet, template, fontMgr, cardPadding });
  }, [fontMgr, tweet, template, cardPadding]);

  useEffect(() => {
    if (layout) onHeightComputed?.(layout.cardHeight);
  }, [layout?.cardHeight, onHeightComputed]);

  useEffect(() => {
    if (layout) onLayoutComputed?.(layout);
  }, [layout, onLayoutComputed]);

  if (!fontMgr || !layout) return null;

  const mark = hasEdits([tweet])
  ? buildSimpleParagraph(fontMgr, "Edited", { size: 22, weight: FONT_WEIGHT_REGULAR, color: template.palette.textMuted, maxWidth: 200 })
  : null;

  return (
    <Canvas ref={canvasRef} style={{ width: CARD_WIDTH, height: layout.cardHeight }}>
      {backgroundImage ? (
        <Group>
          {cardBackgroundImageBlur > 0 && <Blur blur={cardBackgroundImageBlur} />}
          <SkiaImage image={backgroundImage} x={0} y={0} width={CARD_WIDTH} height={layout.cardHeight} fit="cover" />
        </Group>
      ) : (
        <RoundedRect x={0} y={0} width={CARD_WIDTH} height={layout.cardHeight} r={cardRadius ?? CARD_RADIUS} color={cardColorOverride ?? template.palette.cardSurface} />
      )}

      {layout.positioned.map(({ element, x, y, width, height, data }) => {
        const variant = elementRegistry[element.type][element.variant];
        if (!variant) return null;
        return (
          <variant.Render
            key={element.id}
            data={data}
            x={x}
            y={y}
            width={width}
            height={height}
            palette={template.palette}
            style={element.style}
            fontMgr={fontMgr}
          />
        );
      })}

      {mark && (
      <TweetText paragraph={mark.paragraph} x={CARD_WIDTH - PADDING - mark.width} y={layout.cardHeight - 16 - mark.height} width={mark.width} />
    )}
    </Canvas>
  );
});
