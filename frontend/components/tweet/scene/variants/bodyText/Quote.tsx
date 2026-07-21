import { Paragraph } from "@shopify/react-native-skia";
import { buildQuoteTextLayout } from "../../../skia/paragraphs";
import type { ElementRenderProps, ElementVariant, ElementVariantProps } from "../../types";

function measure({ data, width, palette, fontMgr }: ElementVariantProps): number {
  return buildQuoteTextLayout(fontMgr, data.text, width, palette.textPrimary).height;
}

function Render({ data, x, y, width, palette, fontMgr }: ElementRenderProps) {
  const layout = buildQuoteTextLayout(fontMgr, data.text, width, palette.textPrimary);
  return <Paragraph paragraph={layout.paragraph} x={x} y={y} width={width} />;
}

export const BodyTextQuote: ElementVariant = { measure, Render };