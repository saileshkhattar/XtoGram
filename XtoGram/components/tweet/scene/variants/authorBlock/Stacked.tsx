import { Group, Paragraph } from "@shopify/react-native-skia";
import { Avatar } from "../../../skia/Avatar";
import { buildSimpleParagraph, TextAlign } from "../../../skia/paragraphs";
import { formatRelativeTime } from "../../../skia/formatTime";
import {
  FONT_SIZE_NAME,
  FONT_SIZE_HANDLE,
  STACKED_AVATAR_SIZE,
  STACKED_AVATAR_GAP,
  STACKED_NAME_HANDLE_GAP,
} from "../../../skia/layout";
import { FONT_WEIGHT_BOLD, FONT_WEIGHT_REGULAR } from "../../../skia/fonts";
import type { ElementRenderProps, ElementVariant, ElementVariantProps } from "../../types";

// Avatar centered above, name + handle/timestamp centered below — built for
// text-only/quote-style cards. Centering is handled by Skia's own
// TextAlign.Center against the full element width, so the paragraphs don't
// need manually-computed x offsets — only the avatar (not text) needs one,
// since it's drawn as an image rather than laid out text.
function buildLayout({ data, width, palette, fontMgr }: ElementVariantProps) {
  const name = buildSimpleParagraph(fontMgr, data.author.name, {
    size: FONT_SIZE_NAME,
    weight: FONT_WEIGHT_BOLD,
    color: palette.textPrimary,
    maxWidth: width,
    align: TextAlign.Center,
  });
  const handleText = `@${data.author.handle.replace(/^@/, "")} · ${formatRelativeTime(data.createdAt)}`;
  const handle = buildSimpleParagraph(fontMgr, handleText, {
    size: FONT_SIZE_HANDLE,
    weight: FONT_WEIGHT_REGULAR,
    color: palette.textMuted,
    maxWidth: width,
    align: TextAlign.Center,
  });
  return { name, handle };
}

function measure(props: ElementVariantProps): number {
  const { name, handle } = buildLayout(props);
  return STACKED_AVATAR_SIZE + STACKED_AVATAR_GAP + name.height + STACKED_NAME_HANDLE_GAP + handle.height;
}

function Render({ x, y, width, ...rest }: ElementRenderProps) {
  const { name, handle } = buildLayout({ ...rest, width });
  const avatarX = x + width / 2 - STACKED_AVATAR_SIZE / 2;
  const nameY = y + STACKED_AVATAR_SIZE + STACKED_AVATAR_GAP;
  const handleY = nameY + name.height + STACKED_NAME_HANDLE_GAP;

  return (
    <Group>
      <Avatar uri={rest.data.author.avatar} x={avatarX} y={y} size={STACKED_AVATAR_SIZE} />
      <Paragraph paragraph={name.paragraph} x={x} y={nameY} width={width} />
      <Paragraph paragraph={handle.paragraph} x={x} y={handleY} width={width} />
    </Group>
  );
}

export const AuthorBlockStacked: ElementVariant = { measure, Render };