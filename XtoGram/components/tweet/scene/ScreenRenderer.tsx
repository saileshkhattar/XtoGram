import { memo, useEffect, useMemo } from "react";
import { Blur, Canvas, Group, Image as SkiaImage, RoundedRect, useCanvasRef, useImage } from "@shopify/react-native-skia";
import { useTweetFonts } from "../skia/fonts";
import { CARD_WIDTH, CARD_RADIUS } from "../skia/layout";
import { elementRegistry } from "./registry";
import { computeElementLayout, type ComputedLayout } from "./Layoutengine";
import type { CardTemplate } from "./types";
import { type Tweet } from "../../../types/tweet";

type Props = {
  tweet: Tweet;
  template: CardTemplate;
  canvasRef: ReturnType<typeof useCanvasRef>;
  onHeightComputed?: (height: number) => void;
  // Reports the exact same positioned-elements list this instance painted
  // from, so a consumer (the Advanced Editor's tap/drag overlay) can line
  // up hit zones with what's on screen without running its own separate
  // layout pass that could drift out of sync.
  onLayoutComputed?: (layout: ComputedLayout) => void;
  // Quick-adjust overrides — layered on top of the template rather than
  // part of it, same idea as palette being separate from structure.
  // Undefined = use the template's/layout's own value.
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
    </Canvas>
  );
});
