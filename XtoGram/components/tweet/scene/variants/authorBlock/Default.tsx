import { Group, Paragraph, Circle } from "@shopify/react-native-skia";
import { Avatar } from "../../../skia/Avatar";
import { Icon } from "../../../skia/Icon";
import { buildAuthorRowLayout } from "../../../skia/paragraphs";
import { AVATAR_SIZE, AVATAR_GAP, NAME_HANDLE_GAP, VERIFIED_BADGE_SIZE } from "../../../skia/layout";
import type { ElementRenderProps, ElementVariant, ElementVariantProps } from "../../types";

const VERIFIED_BADGE_COLOR = "#1D9BF0";

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