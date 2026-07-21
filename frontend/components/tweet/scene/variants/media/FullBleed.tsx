import { ImageGrid } from "../../../skia/ImageGrid";
import type { ElementRenderProps, ElementVariant, ElementVariantProps } from "../../types";

// Edge-to-edge, no padding, square corners (rounded corners against a
// square card would look wrong once the image touches the card's own
// edges). The actual x/width=0/CARD_WIDTH override is handled by
// SceneRenderer via CardElement.edgeToEdge — this variant only needs to
// pass radius=0. Aspect/clamp logic reused from Default via the same
// formula, just against whatever width SceneRenderer hands it (the full
// card width, once edgeToEdge is set on the element).
function computeMediaHeight(mediaLength: number, firstMedia: { width: number; height: number } | undefined, width: number): number {
  if (mediaLength === 0) return 0;
  if (mediaLength === 1 && firstMedia) {
    const ratio = firstMedia.width > 0 ? firstMedia.height / firstMedia.width : 0.6;
    const clampedRatio = Math.min(Math.max(ratio, 0.5), 1.25);
    return width * clampedRatio;
  }
  return width * 0.6;
}

function measure({ data, width }: ElementVariantProps): number {
  return computeMediaHeight(data.media.length, data.media[0], width);
}

function Render({ data, x, y, width, height }: ElementRenderProps) {
  if (data.media.length === 0) return null;
  const resolvedHeight = height ?? computeMediaHeight(data.media.length, data.media[0], width);
  return <ImageGrid media={data.media} x={x} y={y} width={width} height={resolvedHeight} radius={0} />;
}

export const MediaFullBleed: ElementVariant = { measure, Render };