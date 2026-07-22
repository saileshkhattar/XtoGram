import { Group, Image, useImage, Circle, Skia } from "@shopify/react-native-skia";

type Props = {
  uri: string;
  x: number;
  y: number;
  size: number;
};

export function Avatar({ uri, x, y, size }: Props) {
  const image = useImage(uri);
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;

  // Circular clip: draw the image into a Group whose clip region is a
  // circle. Falls back to a plain placeholder circle while the image
  // is still loading (useImage returns null until then).
  const clipPath = Skia.Path.Make();
  clipPath.addCircle(cx, cy, r);

  if (!image) {
    return <Circle cx={cx} cy={cy} r={r} color="#2A2840" />;
  }

  return (
    <Group clip={clipPath}>
      <Image image={image} x={x} y={y} width={size} height={size} fit="cover" />
    </Group>
  );
}