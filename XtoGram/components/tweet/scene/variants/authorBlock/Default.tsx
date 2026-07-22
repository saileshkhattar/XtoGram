import { Group, Paragraph, Circle } from "@shopify/react-native-skia";
import { Avatar } from "../../../skia/Avatar";
import { Icon } from "../../../skia/Icon";
import { buildAuthorRowLayout } from "../../../skia/paragraphs";
import { AVATAR_SIZE, AVATAR_GAP, NAME_HANDLE_GAP, VERIFIED_BADGE_SIZE } from "../../../skia/layout";
import type { ElementRenderProps, ElementVariant, ElementVariantProps } from "../../types";

// Twitter's own verified-badge blue — a brand color, not a theme color, so
// it intentionally does not come from the palette and stays fixed across
// light/dark/glass templates.
const VERIFIED_BADGE_COLOR = "#1D9BF0";

// Avatar circle + name/handle/timestamp stack, side by side. Ported
// directly from the original hardcoded RegularCard.tsx layout.
//
// Note: this element's height is driven by the text stack only (not the
// avatar) — a short name/handle combo can end up shorter than the 112px
// avatar, same as before. That's a pre-existing quirk carried over
// unchanged for pixel-parity, not something introduced here — worth
// revisiting once Compact/Stacked variants exist.
function measure({ data, width, fontMgr }: ElementVariantProps): number {
  const textMaxWidth = width - AVATAR_SIZE - AVATAR_GAP;
  const layout = buildAuthorRowLayout(fontMgr, data.author.name, data.author.handle, data.createdAt, textMaxWidth);
  return layout.totalHeight;
}

function Render({ data, x, y, width, palette, fontMgr }: ElementRenderProps) {
  const textX = x + AVATAR_SIZE + AVATAR_GAP;
  const textMaxWidth = width - AVATAR_SIZE - AVATAR_GAP;
  const layout = buildAuthorRowLayout(fontMgr, data.author.name, data.author.handle, data.createdAt, textMaxWidth, {
    name: palette.textPrimary,
    sub: palette.textMuted,
  });
  const badgeX = textX + layout.nameWidth + 10;
  const badgeCy = y + layout.nameHeight / 2;

  return (
    <Group>
      <Avatar uri={data.author.avatar} x={x} y={y} size={AVATAR_SIZE} />

      <Paragraph paragraph={layout.nameParagraph} x={textX} y={y} width={textMaxWidth} />

      {data.author.verified && (
        <Group>
          <Circle
            cx={badgeX + VERIFIED_BADGE_SIZE / 2}
            cy={badgeCy}
            r={VERIFIED_BADGE_SIZE / 2}
            color={VERIFIED_BADGE_COLOR}
          />
          <Icon
            name="check"
            x={badgeX + 5}
            y={badgeCy - VERIFIED_BADGE_SIZE / 2 + 6}
            size={VERIFIED_BADGE_SIZE - 12}
            color="#FFFFFF"
            strokeWidth={3}
          />
        </Group>
      )}

      <Paragraph
        paragraph={layout.subParagraph}
        x={textX}
        y={y + layout.nameHeight + NAME_HANDLE_GAP}
        width={textMaxWidth}
      />
    </Group>
  );
}

export const AuthorBlockDefault: ElementVariant = { measure, Render };