import { Group } from "@shopify/react-native-skia";
import { Avatar } from "../../../skia/Avatar";
import { TweetText } from "../../../skia/TweetText";
import { buildSimpleParagraph } from "../../../skia/paragraphs";
import { FONT_SIZE_NAME, FONT_SIZE_HANDLE, COMPACT_AVATAR_SIZE, COMPACT_AVATAR_GAP } from "../../../skia/layout";
import { FONT_WEIGHT_BOLD, FONT_WEIGHT_REGULAR } from "../../../skia/fonts";
import type { ElementRenderProps, ElementVariant } from "../../types";

// Smaller avatar, name + handle on a single line, no timestamp — per spec,
// the timestamp is intentionally dropped, not just hidden. Two short
// paragraphs placed inline rather than one multi-run paragraph — simpler,
// and short enough that width/wrap edge cases don't matter here.
const GAP_NAME_HANDLE = 10;

function measure(): number {
  return COMPACT_AVATAR_SIZE;
}

function Render({ data, x, y, palette, fontMgr }: ElementRenderProps) {
  const textX = x + COMPACT_AVATAR_SIZE + COMPACT_AVATAR_GAP;

  const name = buildSimpleParagraph(fontMgr, data.author.name, {
    size: FONT_SIZE_NAME * 0.7,
    weight: FONT_WEIGHT_BOLD,
    color: palette.textPrimary,
    maxWidth: 600,
  });
  const handle = buildSimpleParagraph(fontMgr, `@${data.author.handle.replace(/^@/, "")}`, {
    size: FONT_SIZE_HANDLE * 0.7,
    weight: FONT_WEIGHT_REGULAR,
    color: palette.textMuted,
    maxWidth: 400,
  });

  const nameY = y + (COMPACT_AVATAR_SIZE - name.height) / 2;
  const handleY = y + (COMPACT_AVATAR_SIZE - handle.height) / 2;

  return (
    <Group>
      <Avatar uri={data.author.avatar} x={x} y={y} size={COMPACT_AVATAR_SIZE} />
      <TweetText paragraph={name.paragraph} x={textX} y={nameY} width={name.width} />
      <TweetText
        paragraph={handle.paragraph}
        x={textX + name.width + GAP_NAME_HANDLE}
        y={handleY}
        width={handle.width}
      />
    </Group>
  );
}

export const AuthorBlockCompact: ElementVariant = { measure, Render };