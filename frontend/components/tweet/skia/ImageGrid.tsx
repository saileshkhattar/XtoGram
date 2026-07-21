import { Group, Image, useImage, RoundedRect, Skia } from "@shopify/react-native-skia";
import { type TweetMedia } from "../../../types/tweet";
import { IMAGE_GAP, IMAGE_RADIUS } from "./layout";

type Props = {
  media: TweetMedia[];
  x: number;
  y: number;
  width: number;
  height: number; // total height allotted to the grid
  radius?: number; // corner radius per slot — defaults to IMAGE_RADIUS
};

// Mirrors X's actual image-grid rules:
//   1 image  -> full width, single rounded rect
//   2 images -> side by side, even split
//   3 images -> one tall image left, two stacked right
//   4 images -> even 2x2 grid
// (Only up to 4 — the backend/parser doesn't fetch more than that.)
export function ImageGrid({ media, x, y, width, height, radius = IMAGE_RADIUS }: Props) {
  // Fixed number of hook calls regardless of how many images actually
  // exist — required since hooks can't be called conditionally/in a loop.
  const img0 = useImage(media[0]?.url);
  const img1 = useImage(media[1]?.url);
  const img2 = useImage(media[2]?.url);
  const img3 = useImage(media[3]?.url);
  const images = [img0, img1, img2, img3];

  if (media.length === 0) return null;

  const slots = computeSlots(media.length, x, y, width, height);

  return (
    <Group>
      {slots.map((slot, i) => {
        const image = images[i];
        const clip = Skia.Path.Make();
        clip.addRRect(Skia.RRectXY(Skia.XYWHRect(slot.x, slot.y, slot.width, slot.height), radius, radius));
        return (
          <Group key={i} clip={clip}>
            {image ? (
              <Image image={image} x={slot.x} y={slot.y} width={slot.width} height={slot.height} fit="cover" />
            ) : (
              <RoundedRect x={slot.x} y={slot.y} width={slot.width} height={slot.height} r={radius} color="#1E1C2A" />
            )}
          </Group>
        );
      })}
    </Group>
  );
}

export type Slot = { x: number; y: number; width: number; height: number };

// Exported so variants that need the same 1/2/3/4 grid geometry (e.g.
// Framed, to draw a border per slot) don't have to duplicate this math.
export function computeSlots(count: number, x: number, y: number, width: number, height: number): Slot[] {
  if (count === 1) {
    return [{ x, y, width, height }];
  }

  if (count === 2) {
    const w = (width - IMAGE_GAP) / 2;
    return [
      { x, y, width: w, height },
      { x: x + w + IMAGE_GAP, y, width: w, height },
    ];
  }

  if (count === 3) {
    const leftW = (width - IMAGE_GAP) * 0.6;
    const rightW = width - IMAGE_GAP - leftW;
    const rightH = (height - IMAGE_GAP) / 2;
    return [
      { x, y, width: leftW, height },
      { x: x + leftW + IMAGE_GAP, y, width: rightW, height: rightH },
      { x: x + leftW + IMAGE_GAP, y: y + rightH + IMAGE_GAP, width: rightW, height: rightH },
    ];
  }

  // 4 images: even 2x2
  const w = (width - IMAGE_GAP) / 2;
  const h = (height - IMAGE_GAP) / 2;
  return [
    { x, y, width: w, height: h },
    { x: x + w + IMAGE_GAP, y, width: w, height: h },
    { x, y: y + h + IMAGE_GAP, width: w, height: h },
    { x: x + w + IMAGE_GAP, y: y + h + IMAGE_GAP, width: w, height: h },
  ];
}