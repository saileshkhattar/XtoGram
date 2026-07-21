import { memo, useEffect, useMemo } from "react";
import { Canvas, RoundedRect, useCanvasRef } from "@shopify/react-native-skia";
import { useTweetFonts } from "../skia/fonts";
import { CARD_WIDTH, PADDING, CARD_RADIUS } from "../skia/layout";
import { elementRegistry } from "./registry";
import type { CardElement, CardTemplate, ElementVariantProps } from "./types";
import { type Tweet } from "../../../types/tweet";

type Props = {
  tweet: Tweet;
  template: CardTemplate;
  canvasRef: ReturnType<typeof useCanvasRef>;
  onHeightComputed?: (height: number) => void;
  // Quick-adjust overrides — layered on top of the template rather than
  // part of it, same idea as palette being separate from structure.
  // Undefined = use the template's/layout's own value.
  cardColorOverride?: string;
  cardRadius?: number;
  cardPadding?: number;
};

// Fallback spacing between flow-mode elements when a template doesn't set
// its own gapBefore. Individual templates can still tighten/loosen this
// per element via CardElement.gapBefore.
const DEFAULT_GAP = 28;

type PositionedElement = {
  element: CardElement;
  x: number;
  y: number;
  width: number;
  height: number;
  data: Tweet;
};

// Resolves a CardElement's dataBinding (e.g. "quotedTweet") against the
// root tweet. No binding = the root tweet itself. This indirection is what
// lets the same element types later render a nested quoted/reply tweet
// without SceneRenderer itself changing at all.
function resolveData(tweet: Tweet, dataBinding?: string): Tweet {
  if (!dataBinding) return tweet;
  const nested = (tweet as unknown as Record<string, unknown>)[dataBinding];
  return (nested as Tweet) ?? tweet;
}

export const SceneRenderer = memo(function SceneRenderer({
  tweet,
  template,
  canvasRef,
  onHeightComputed,
  cardColorOverride,
  cardRadius,
  cardPadding,
}: Props) {
  const fontMgr = useTweetFonts();
  const padding = cardPadding ?? PADDING;
  const contentWidth = CARD_WIDTH - padding * 2;

  const layout = useMemo(() => {
    if (!fontMgr) return null;

    const visibleElements = template.elements.filter((el) => el.visible !== false);
    const positioned: PositionedElement[] = [];
    let flowY = padding;
    let flowElementCount = 0;

    for (const element of visibleElements) {
      const variant = elementRegistry[element.type][element.variant];
      if (!variant) continue; // unregistered variant — skip rather than crash

      const data = resolveData(tweet, element.dataBinding);

      if (element.position) {
        // Absolute override: render exactly where a user placed it in the
        // advanced editor, and don't let it participate in — or be pushed
        // by — the flow elements around it.
        positioned.push({
          element,
          x: element.position.x,
          y: element.position.y,
          width: element.position.width,
          height: element.position.height,
          data,
        });
        continue;
      }

      // edgeToEdge elements (e.g. media.fullBleed) skip the card's usual
      // padding inset and span the full card width instead.
      const elementX = element.edgeToEdge ? 0 : padding;
      const elementWidth = element.edgeToEdge ? CARD_WIDTH : contentWidth;

      const variantProps: ElementVariantProps = {
        data,
        width: elementWidth,
        palette: template.palette,
        style: element.style,
        fontMgr,
      };

      const height = variant.measure(variantProps);

      // An element that measures to zero (e.g. a tweet with no media)
      // contributes nothing to the layout at all — no gap consumed before
      // it, and it doesn't count as "the previous element" for whatever
      // comes next. This is what makes each element's own gapBefore fall
      // back correctly onto whatever the nearest *visible* element before
      // it actually is, matching how the original hand-written layout
      // conditionally skipped the text-to-media gap when there was no
      // media, while still always applying the media-to-engagement gap.
      if (height <= 0) continue;

      const gap = flowElementCount > 0 ? (element.gapBefore ?? DEFAULT_GAP) : 0;
      flowY += gap;
      positioned.push({ element, x: elementX, y: flowY, width: elementWidth, height, data });
      flowY += height;
      flowElementCount += 1;
    }

    const cardHeight = flowY + padding;
    return { positioned, cardHeight };
  }, [fontMgr, tweet, template, contentWidth, padding]);

  useEffect(() => {
    if (layout) onHeightComputed?.(layout.cardHeight);
  }, [layout?.cardHeight, onHeightComputed]);

  if (!fontMgr || !layout) return null;

  return (
    <Canvas ref={canvasRef} style={{ width: CARD_WIDTH, height: layout.cardHeight }}>
      <RoundedRect
        x={0}
        y={0}
        width={CARD_WIDTH}
        height={layout.cardHeight}
        r={cardRadius ?? CARD_RADIUS}
        color={cardColorOverride ?? template.palette.cardSurface}
      />

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