import { Group } from "@shopify/react-native-skia";
import { Icon } from "../../../skia/Icon";
import { TweetText } from "../../../skia/TweetText";
import { buildSimpleParagraph } from "../../../skia/paragraphs";
import { formatCount } from "../../../skia/formatTime";
import { FONT_SIZE_METRIC, ENGAGEMENT_ICON_SIZE, ENGAGEMENT_ROW_HEIGHT } from "../../../skia/layout";
import { FONT_WEIGHT_REGULAR } from "../../../skia/fonts";
import { type IconName } from "../../../skia/icons";
import type { ElementRenderProps, ElementVariant } from "../../types";
import type { TweetMetrics } from "../../../../../types/tweet";

// Four metrics evenly spaced across the card width, each as an icon +
// count pair, matching X's own engagement row layout. Ported directly from
// the original EngagementRow.tsx — including reusing `bookmarks` for the
// "share" icon slot, since a real share count isn't available from the
// data source.
const ITEMS: { icon: IconName; key: keyof TweetMetrics }[] = [
  { icon: "reply", key: "replies" },
  { icon: "retweet", key: "retweets" },
  { icon: "like", key: "likes" },
  { icon: "share", key: "bookmarks" },
];

function measure(): number {
  return ENGAGEMENT_ROW_HEIGHT;
}

function Render({ data, x, y, width, palette, fontMgr }: ElementRenderProps) {
  const slotWidth = width / ITEMS.length;

  return (
    <Group>
      {ITEMS.map((item, i) => {
        const slotX = x + i * slotWidth;
        const label = buildSimpleParagraph(fontMgr, formatCount(data.metrics[item.key]), {
          size: FONT_SIZE_METRIC,
          weight: FONT_WEIGHT_REGULAR,
          color: palette.textMuted,
          maxWidth: slotWidth,
        });
        return (
          <Group key={item.icon}>
            <Icon name={item.icon} x={slotX} y={y} size={ENGAGEMENT_ICON_SIZE} color={palette.textMuted} />
            <TweetText
              paragraph={label.paragraph}
              x={slotX + ENGAGEMENT_ICON_SIZE + 14}
              y={y + (ENGAGEMENT_ICON_SIZE - label.height) / 2}
              width={slotWidth - ENGAGEMENT_ICON_SIZE - 14}
            />
          </Group>
        );
      })}
    </Group>
  );
}

export const EngagementRowDefault: ElementVariant = { measure, Render };