import { Group, Path } from "@shopify/react-native-skia";
import { ICONS, type IconName } from "./icons";

type Props = {
  name: IconName;
  x: number;
  y: number;
  size: number;
  color: string;
  strokeWidth?: number;
};

// Icon paths are authored on a 24x24 viewBox. We place the group's
// origin at (x, y) and scale down to the target size, so every path
// can be reused at any size without redrawing it.
export function Icon({ name, x, y, size, color, strokeWidth = 2 }: Props) {
  const scale = size / 24;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale }]}>
      <Path
        path={ICONS[name]}
        style="stroke"
        strokeWidth={strokeWidth / scale}
        strokeCap="round"
        strokeJoin="round"
        color={color}
      />
    </Group>
  );
}