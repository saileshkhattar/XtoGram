import type { SkTypefaceFontProvider } from "@shopify/react-native-skia";
import { type Tweet } from "../../../types/tweet";

// The semantic role an element plays in a card. Adding a new tweet type
// (quote, thread, reply) later means adding new element types here —
// nothing else in this file, the registry, or SceneRenderer needs to change.
export type ElementType = "authorBlock" | "bodyText" | "media" | "engagementRow";

// Color set a template applies to every element it contains. Structure
// (which variant is used) and color (which palette) are independent axes —
// "Dark Classic" and "Light Classic" can share every variant and differ
// only in palette.
export type Palette = {
  background: string;
  cardSurface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  icon: string;
  accent: string;
};

// Explicit box a user has placed an element at — e.g. by dragging it in the
// advanced editor. When present on a CardElement, this is authoritative:
// the element renders at exactly this box and is removed from flow layout
// (later elements do not shift to account for it), same as CSS
// position: absolute.
export type ElementPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Per-instance style tweaks layered on top of a variant's palette-driven
// defaults. Deliberately minimal for now — extend as the editor needs more
// (fontSize, fontWeight, etc.) rather than guessing ahead of time.
export type ElementStyleOverrides = {
  color?: string;
  opacity?: number;
};

export type CardElement = {
  id: string;
  type: ElementType;
  variant: string;
  // Optional dot-path into the root tweet that this element's data is drawn
  // from. Omitted = the root tweet itself. Setting this to e.g.
  // "quotedTweet" lets the same authorBlock/bodyText/media element types
  // later render a nested quoted tweet's data with zero renderer changes.
  dataBinding?: string;
  // Flow-mode spacing before this element. Ignored if `position` is set.
  gapBefore?: number;
  // Defaults to true when omitted.
  visible?: boolean;
  // Flow-mode only: ignore the card's standard PADDING inset for this one
  // element and give it the full card width instead (x=0, width=CARD_WIDTH).
  // Used by media.fullBleed. Ignored if `position` is set.
  edgeToEdge?: boolean;
  // Absolute override — set once a user drags/resizes this element in the
  // advanced editor. Undefined = participate in flow layout instead.
  position?: ElementPosition;
  style?: ElementStyleOverrides;
};

export type TweetType = "original" | "quote" | "reply" | "thread";

export type CardTemplate = {
  id: string;
  name: string;
  thumbnailUri?: string;
  // Which tweet shapes this template is valid for. A reply-chain template
  // added later simply won't appear for a plain original tweet, and vice
  // versa — no wiring changes needed elsewhere.
  appliesTo: TweetType[];
  palette: Palette;
  elements: CardElement[];
};

// What every variant's measure/render functions receive. `data` is
// whatever `dataBinding` resolved to — usually the Tweet itself, or a
// nested tweet object.
export type ElementVariantProps = {
  data: Tweet;
  width: number;
  palette: Palette;
  style?: ElementStyleOverrides;
  fontMgr: SkTypefaceFontProvider;
};

export type ElementRenderProps = ElementVariantProps & {
  x: number;
  y: number;
  // Present when this element has an absolute `position` (fixed box) or is
  // a flow element (always populated by SceneRenderer either way) —
  // variants that need to fill/clip to a box (e.g. media crops) read this.
  height?: number;
};

// Every variant of every element type implements this same shape. This
// uniformity is what lets SceneRenderer treat all element types and
// variants identically instead of special-casing each one.
export type ElementVariant = {
  // Returns the rendered height in px for the given width/content — used
  // for flow layout. Not called for elements with an explicit `position`.
  measure: (props: ElementVariantProps) => number;
  Render: (props: ElementRenderProps) => React.ReactNode;
};

export type ElementRegistry = Record<ElementType, Record<string, ElementVariant>>;