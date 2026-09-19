import type { SkTypefaceFontProvider } from "@shopify/react-native-skia";
import { type Tweet } from "../../../types/tweet";

export type ElementType = "authorBlock" | "bodyText" | "media" | "engagementRow";

export type Palette = {
  background: string;
  cardSurface: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  icon: string;
  accent: string;
};

export type ElementPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ElementStyleOverrides = {
  color?: string;
  opacity?: number;
};

export type CardElement = {
  id: string;
  type: ElementType;
  variant: string;
  dataBinding?: string;
  gapBefore?: number;
  visible?: boolean;
  edgeToEdge?: boolean;
  position?: ElementPosition;
  style?: ElementStyleOverrides;
};

export type TweetType = "original" | "quote" | "reply" | "thread";

export type CardTemplate = {
  id: string;
  name: string;
  thumbnailUri?: string;
  appliesTo: TweetType[];
  palette: Palette;
  elements: CardElement[];
};

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
  height?: number;
};

export type ElementVariant = {
  measure: (props: ElementVariantProps) => number;
  Render: (props: ElementRenderProps) => React.ReactNode;
};

export type ElementRegistry = Record<ElementType, Record<string, ElementVariant>>;