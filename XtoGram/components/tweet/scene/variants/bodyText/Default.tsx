import { Paragraph } from "@shopify/react-native-skia";
import { buildBodyTextLayout } from "../../../skia/paragraphs";
import type { ElementRenderProps, ElementVariant, ElementVariantProps } from "../../types";

function measure({ data, width, fontMgr }: ElementVariantProps): number {
  return buildBodyTextLayout(fontMgr, data.text, width).height;
}

function Render({ data, x, y, width, palette, fontMgr }: ElementRenderProps) {
  const layout = buildBodyTextLayout(fontMgr, data.text, width, palette.textPrimary);
  return <Paragraph paragraph={layout.paragraph} x={x} y={y} width={width} />;
}

export const BodyTextDefault: ElementVariant = { measure, Render };