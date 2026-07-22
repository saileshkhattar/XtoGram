import { Group, RoundedRect } from "@shopify/react-native-skia";
import { ImageGrid, computeSlots } from "../../../skia/ImageGrid";
import { IMAGE_RADIUS, IMAGE_BORDER_WIDTH } from "../../../skia/layout";
import type { ElementRenderProps, ElementVariant, ElementVariantProps } from "../../types";

// Same image + aspect logic as Default, plus a colored stroke border drawn
// on top of each slot. Reuses ImageGrid's own computeSlots so the border
// always lines up with the actual grid geometry (1/2/3/4 images) instead
// of duplicating that math and risking drift.
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

function Render({ data, x, y, width, height, palette }: ElementRenderProps) {
  if (data.media.length === 0) return null;
  const resolvedHeight = height ?? computeMediaHeight(data.media.length, data.media[0], width);
  const slots = computeSlots(data.media.length, x, y, width, resolvedHeight);

  return (
    <Group>
      <ImageGrid media={data.media} x={x} y={y} width={width} height={resolvedHeight} />
      {slots.map((slot, i) => (
        <RoundedRect
          key={i}
          x={slot.x + IMAGE_BORDER_WIDTH / 2}
          y={slot.y + IMAGE_BORDER_WIDTH / 2}
          width={slot.width - IMAGE_BORDER_WIDTH}
          height={slot.height - IMAGE_BORDER_WIDTH}
          r={IMAGE_RADIUS}
          style="stroke"
          strokeWidth={IMAGE_BORDER_WIDTH}
          color={palette.accent}
        />
      ))}
    </Group>
  );
}

export const MediaFramed: ElementVariant = { measure, Render };