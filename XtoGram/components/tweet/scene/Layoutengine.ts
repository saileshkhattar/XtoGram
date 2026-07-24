// components/tweet/scene/layoutEngine.ts
//
// Pure "where does everything go" calculation, extracted out of
// SceneRenderer so it has exactly one implementation. SceneRenderer uses
// this list to paint with Skia; the Advanced Editor overlay uses the same
// list to place invisible tappable/draggable Views in the identical spots.
// If this ever drifted into two separate copies, the tap zones would
// slowly stop lining up with what's actually drawn — so nothing outside
// this file should reimplement it.
import { CARD_WIDTH, PADDING } from "../skia/layout";
import { elementRegistry } from "./registry";
import type { CardElement, CardTemplate, ElementVariantProps } from "./types";
import { type Tweet } from "../../../types/tweet";
import type { SkTypefaceFontProvider } from "@shopify/react-native-skia";

// Fallback spacing between flow-mode elements when a template doesn't set
// its own gapBefore. Individual templates can still tighten/loosen this
// per element via CardElement.gapBefore.
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

// Resolves a CardElement's dataBinding (e.g. "quotedTweet") against the
// root tweet. No binding = the root tweet itself. This indirection is what
// lets the same element types later render a nested quoted/reply tweet
// without the layout engine itself changing at all.
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
    // comes next.
    if (height <= 0) continue;

    const gap = flowElementCount > 0 ? (element.gapBefore ?? DEFAULT_GAP) : 0;
    flowY += gap;
    positioned.push({ element, x: elementX, y: flowY, width: elementWidth, height, data });
    flowY += height;
    flowElementCount += 1;
  }

  // Absolute elements are removed from normal flow, but they must still
  // contribute to the canvas bounds. Previously the first drag converted an
  // element to absolute positioning, shrank the canvas around the remaining
  // flow items, and clipped the dragged content (often making the whole card
  // look as though it had disappeared).
  const positionedBottom = positioned.reduce((bottom, entry) => Math.max(bottom, entry.y + entry.height), 0);
  const cardHeight = Math.max(flowY + padding, positionedBottom + padding, padding * 2 + 180);
  return { positioned, cardHeight };
}
