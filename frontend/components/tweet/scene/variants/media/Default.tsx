import { ImageGrid } from "../../../skia/ImageGrid";
import type { ElementRenderProps, ElementVariant, ElementVariantProps } from "../../types";
import { type Tweet } from "../../../../../types/tweet";

// Clamps the media block's height so a single very tall/wide image doesn't
// blow out the card — mirrors how X caps its own image ratios. Ported
// directly from RegularCard.tsx's computeMediaHeight.
function computeMediaHeight(data: Tweet, width: number): number {
  if (data.media.length === 0) return 0;
  if (data.media.length === 1) {
    const { width: w, height: h } = data.media[0];
    const ratio = w > 0 ? h / w : 0.6;
    const clampedRatio = Math.min(Math.max(ratio, 0.5), 1.25);
    return width * clampedRatio;
  }
  return width * 0.6;
}

function measure({ data, width }: ElementVariantProps): number {
  return computeMediaHeight(data, width);
}

function Render({ data, x, y, width, height }: ElementRenderProps) {
  if (data.media.length === 0) return null;
  // height is always populated by SceneRenderer (measured for flow mode,
  // explicit for an absolute-positioned instance) — the fallback here only
  // matters if this variant is ever rendered outside SceneRenderer.
  const resolvedHeight = height ?? computeMediaHeight(data, width);
  return <ImageGrid media={data.media} x={x} y={y} width={width} height={resolvedHeight} />;
}

export const MediaDefault: ElementVariant = { measure, Render };