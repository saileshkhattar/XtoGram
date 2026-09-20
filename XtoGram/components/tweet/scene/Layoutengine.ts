import { CARD_WIDTH, PADDING } from "../skia/layout";
import { elementRegistry } from "./registry";
import type { CardElement, CardTemplate, ElementVariantProps } from "./types";
import { type Tweet } from "../../../types/tweet";
import type { SkTypefaceFontProvider } from "@shopify/react-native-skia";

const DEFAULT_GAP = 28;

export type PositionedElement = {
  element: CardElement;
  x: number;
  y: number;
  width: number;
  height: number;
  data: Tweet;
};

export type ComputedLayout = {
  positioned: PositionedElement[];
  cardHeight: number;
};

function resolveData(tweet: Tweet, dataBinding?: string): Tweet {
  if (!dataBinding) return tweet;
  const nested = (tweet as unknown as Record<string, unknown>)[dataBinding];
  return (nested as Tweet) ?? tweet;
}

type ComputeArgs = {
  tweet: Tweet;
  template: CardTemplate;
  fontMgr: SkTypefaceFontProvider;
  cardPadding?: number;
};

export function computeElementLayout({ tweet, template, fontMgr, cardPadding }: ComputeArgs): ComputedLayout {
  const padding = cardPadding ?? PADDING;
  const contentWidth = CARD_WIDTH - padding * 2;

  const visibleElements = template.elements.filter((el) => el.visible !== false);
  const positioned: PositionedElement[] = [];
  let flowY = padding;
  let flowElementCount = 0;

  for (const element of visibleElements) {
    const variant = elementRegistry[element.type][element.variant];
    if (!variant) continue; 

    const data = resolveData(tweet, element.dataBinding);

    if (element.position) {
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

    if (height <= 0) continue;

    const gap = flowElementCount > 0 ? (element.gapBefore ?? DEFAULT_GAP) : 0;
    flowY += gap;
    positioned.push({ element, x: elementX, y: flowY, width: elementWidth, height, data });
    flowY += height;
    flowElementCount += 1;
  }

  const positionedBottom = positioned.reduce((bottom, entry) => Math.max(bottom, entry.y + entry.height), 0);
  const cardHeight = Math.max(flowY + padding, positionedBottom + padding, padding * 2 + 180);
  return { positioned, cardHeight };
}
