import { ImageGrid } from "../../../skia/ImageGrid";
import type { ElementRenderProps, ElementVariant, ElementVariantProps } from "../../types";

// Fixed 1:1 square block regardless of the source images' own aspect
// ratios — every image is center-cropped ("cover") into its cell via
// ImageGrid's existing fit="cover" behavior. Same 1/2/3/4 grid pattern as
// Default; the only difference is height is forced to equal width instead
// of being derived from the source image's aspect ratio.
function measure({ data, width }: ElementVariantProps): number {
  return data.media.length === 0 ? 0 : width;
}

function Render({ data, x, y, width }: ElementRenderProps) {
  if (data.media.length === 0) return null;
  return <ImageGrid media={data.media} x={x} y={y} width={width} height={width} />;
}

export const MediaCropped: ElementVariant = { measure, Render };