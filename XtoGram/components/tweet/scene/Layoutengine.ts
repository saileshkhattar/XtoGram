import { CARD_WIDTH, PADDING } from "../skia/layout";
import { elementRegistry } from "./registry";
import type { CardElement, CardTemplate, ElementVariantProps, ElementType } from "./types";
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

function resolveData(tweet: Tweet, dataBinding?: string): Tweet | null {
  if (!dataBinding) return tweet;
  return ((tweet as unknown as Record<string, unknown>)[dataBinding] as Tweet | null) ?? null;
}

type ComputeArgs = {
  tweet: Tweet;
  template: CardTemplate;
  fontMgr: SkTypefaceFontProvider;
  cardPadding?: number;
  cardWidth?: number;           
  bare?: boolean;               
  skipTypes?: ElementType[];  
  mediaMaxHeight?: number;  
};

export function computeElementLayout({ tweet, template, fontMgr, cardPadding, cardWidth, bare, skipTypes, mediaMaxHeight }: ComputeArgs): ComputedLayout {
  const padding = cardPadding ?? PADDING;
  const width = cardWidth ?? CARD_WIDTH;
  const contentWidth = width - padding * 2;     // replaces the existing contentWidth line

  const visibleElements = template.elements.filter(
  (el) => el.visible !== false && !skipTypes?.includes(el.type),
  );
  const positioned: PositionedElement[] = [];
  let flowY = bare ? 0 : padding;
  let flowElementCount = 0;

  for (const element of visibleElements) {
    const variant = elementRegistry[element.type][element.variant];
    if (!variant) continue; 

    const data = resolveData(tweet, element.dataBinding);

    if (!data) continue;

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

    const inset = element.inset ?? 0;
    const elementX = (element.edgeToEdge ? 0 : padding) + inset;
    const elementWidth = (element.edgeToEdge ? width : contentWidth) - inset;

    const variantProps: ElementVariantProps = {
      data,
      width: elementWidth,
      palette: template.palette,
      style: element.style,
      fontMgr,
    };

    const measured = variant.measure(variantProps);
    const height = element.type === 'media' && mediaMaxHeight ? Math.min(measured, mediaMaxHeight) : measured;

    if (height <= 0) continue;

    const gap = flowElementCount > 0 ? (element.gapBefore ?? DEFAULT_GAP) : 0;
    flowY += gap;
    positioned.push({ element, x: elementX, y: flowY, width: elementWidth, height, data });
    flowY += height;
    flowElementCount += 1;
  }

  const positionedBottom = positioned.reduce((bottom, entry) => Math.max(bottom, entry.y + entry.height), 0);

  if (bare) return { positioned, cardHeight: Math.max(flowY, positionedBottom) };

  
  const cardHeight = Math.max(flowY + padding, positionedBottom + padding, padding * 2 + 180);
  return { positioned, cardHeight };
}
