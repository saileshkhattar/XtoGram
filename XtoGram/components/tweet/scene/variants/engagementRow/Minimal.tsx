import { Group } from "@shopify/react-native-skia";
import { TweetText } from "../../../skia/TweetText";
import { buildSimpleParagraph } from "../../../skia/paragraphs";
import { formatCount } from "../../../skia/formatTime";
import { FONT_SIZE_METRIC_MINIMAL, MINIMAL_ENGAGEMENT_ROW_HEIGHT } from "../../../skia/layout";
import { FONT_WEIGHT_REGULAR } from "../../../skia/fonts";
import type { TweetMetrics } from "../../../../../types/tweet";
import type { ElementRenderProps, ElementVariant } from "../../types";

// Numbers only, no icons, smaller row — same 4-metric set and left-to-right
// order as Default (share slot reuses bookmarks, same as everywhere else).
const KEYS: (keyof TweetMetrics)[] = ["replies", "retweets", "likes", "bookmarks"];

function measure(): number {
  return MINIMAL_ENGAGEMENT_ROW_HEIGHT;
}

function Render({ data, x, y, width, palette, fontMgr }: ElementRenderProps) {
  const slotWidth = width / KEYS.length;

  return (
    <Group>
      {KEYS.map((key, i) => {
        const slotX = x + i * slotWidth;
        const label = buildSimpleParagraph(fontMgr, formatCount(data.metrics[key]), {
          size: FONT_SIZE_METRIC_MINIMAL,
          weight: FONT_WEIGHT_REGULAR,
          color: palette.textMuted,
          maxWidth: slotWidth,
        });
        return (
          <TweetText
            key={key}
            paragraph={label.paragraph}
            x={slotX}
            y={y + (MINIMAL_ENGAGEMENT_ROW_HEIGHT - label.height) / 2}
            width={slotWidth}
          />
        );
      })}
    </Group>
  );
}

export const EngagementRowMinimal: ElementVariant = { measure, Render };