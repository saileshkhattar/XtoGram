import { Group } from "@shopify/react-native-skia";
import { Icon } from "../../../skia/Icon";
import { ENGAGEMENT_ICON_SIZE } from "../../../skia/layout";
import { type IconName } from "../../../skia/icons";
import type { ElementRenderProps, ElementVariant } from "../../types";

// Icons at current size, no numbers. Each icon is centered within its slot
// (rather than left-anchored like Default, which anchors left to leave
// room for the number that follows) since there's no adjacent text to
// align against anymore.
const ICON_NAMES: IconName[] = ["reply", "retweet", "like", "share"];

function measure(): number {
  return ENGAGEMENT_ICON_SIZE;
}

function Render({ x, y, width, palette }: ElementRenderProps) {
  const slotWidth = width / ICON_NAMES.length;

  return (
    <Group>
      {ICON_NAMES.map((name, i) => {
        const slotX = x + i * slotWidth + slotWidth / 2 - ENGAGEMENT_ICON_SIZE / 2;
        return <Icon key={name} name={name} x={slotX} y={y} size={ENGAGEMENT_ICON_SIZE} color={palette.textMuted} />;
      })}
    </Group>
  );
}

export const EngagementRowIconsOnly: ElementVariant = { measure, Render };