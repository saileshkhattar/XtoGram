import { Paragraph, Group, Circle } from "@shopify/react-native-skia";
import { Icon } from "./Icon";
import { type AuthorRowLayout } from "./paragraphs";
import { NAME_HANDLE_GAP, VERIFIED_BADGE_SIZE } from "./layout";

type Props = {
  layout: AuthorRowLayout;
  verified: boolean;
  x: number;
  y: number;
  maxWidth: number;
};

export function AuthorRow({ layout, verified, x, y, maxWidth }: Props) {
  const { nameParagraph, subParagraph, nameWidth, nameHeight } = layout;
  const badgeX = x + nameWidth + 10;
  const badgeCy = y + nameHeight / 2;

  return (
    <>
      <Paragraph paragraph={nameParagraph} x={x} y={y} width={maxWidth} />
      {verified && (
        <Group>
          <Circle
            cx={badgeX + VERIFIED_BADGE_SIZE / 2}
            cy={badgeCy}
            r={VERIFIED_BADGE_SIZE / 2}
            color="#1D9BF0"
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
        paragraph={subParagraph}
        x={x}
        y={y + nameHeight + NAME_HANDLE_GAP}
        width={maxWidth}
      />
    </>
  );
}