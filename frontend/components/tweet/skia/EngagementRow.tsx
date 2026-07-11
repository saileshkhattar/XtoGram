import { Group, type SkTypefaceFontProvider } from "@shopify/react-native-skia";
import { Icon } from "./Icon";
import { buildSimpleParagraph } from "./paragraphs";
import { TweetText } from "./TweetText";
import { formatCount } from "./formatTime";
import { FONT_SIZE_METRIC } from "./layout";
import { FONT_FAMILY, FONT_WEIGHT_REGULAR } from "./fonts";
import { type TweetMetrics } from "../../../types/tweet";
import { type IconName } from "./icons";

type Props = {
  fontMgr: SkTypefaceFontProvider;
  metrics: TweetMetrics;
  x: number;
  y: number;
  width: number;
  iconSize: number;
};

const DIM = "#6B6880";

// Four metrics evenly spaced across the card width, each as an
// icon + count pair, matching X's own engagement row layout.
export function EngagementRow({ fontMgr, metrics, x, y, width, iconSize }: Props) {
  const items: { icon: IconName; value: number }[] = [
    { icon: "reply", value: metrics.replies },
    { icon: "retweet", value: metrics.retweets },
    { icon: "like", value: metrics.likes },
    { icon: "share", value: metrics.bookmarks },
  ];

  const slotWidth = width / items.length;

  return (
    <Group>
      {items.map((item, i) => {
        const slotX = x + i * slotWidth;
        const label = buildSimpleParagraph(fontMgr, formatCount(item.value), {
          size: FONT_SIZE_METRIC,
          weight: FONT_WEIGHT_REGULAR,
          color: DIM,
          maxWidth: slotWidth,
        });
        return (
          <Group key={item.icon}>
            <Icon name={item.icon} x={slotX} y={y} size={iconSize} color={DIM} />
            <TweetText
              paragraph={label.paragraph}
              x={slotX + iconSize + 14}
              y={y + (iconSize - label.height) / 2}
              width={slotWidth - iconSize - 14}
            />
          </Group>
        );
      })}
    </Group>
  );
}