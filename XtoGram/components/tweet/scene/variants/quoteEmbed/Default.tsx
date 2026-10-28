import { Group, RoundedRect, type SkTypefaceFontProvider } from "@shopify/react-native-skia";
import { Avatar } from "../../../skia/Avatar";
import { ImageGrid } from "../../../skia/ImageGrid";
import { TweetText } from "../../../skia/TweetText";
import { buildEmbedTextLayout, buildSimpleParagraph } from "../../../skia/paragraphs";
import { FONT_WEIGHT_BOLD, FONT_WEIGHT_REGULAR } from "../../../skia/fonts";
import {
  EMBED_PADDING, EMBED_RADIUS, EMBED_BORDER_WIDTH, EMBED_AVATAR_SIZE, EMBED_AVATAR_GAP,
  EMBED_GAP, EMBED_MEDIA_RADIUS, EMBED_FONT_SIZE_NAME, EMBED_FONT_SIZE_HANDLE,
} from "../../../skia/layout";
import type { ElementRenderProps, ElementVariant, ElementVariantProps, Palette } from "../../types";
import type { Tweet } from "../../../../../types/tweet";

const hasText = (t: Tweet) => t.text.trim().length > 0;

function mediaHeight(t: Tweet, width: number): number {
  if (t.media.length === 0) return 0;
  if (t.media.length === 1) {
    const { width: w, height: h } = t.media[0];
    const ratio = w > 0 ? h / w : 0.6;
    return width * Math.min(Math.max(ratio, 0.5), 1);   // capped at square: embeds stay compact
  }
  return width * 0.6;
}

// Height of the whole embed box, including a nested quote when there is one.
function measureEmbed(t: Tweet, width: number, fontMgr: SkTypefaceFontProvider): number {
  const inner = width - EMBED_PADDING * 2;
  let h = EMBED_PADDING + EMBED_AVATAR_SIZE;
  if (hasText(t)) h += EMBED_GAP + buildEmbedTextLayout(fontMgr, t.text, inner).height;
  const m = mediaHeight(t, inner);
  if (m > 0) h += EMBED_GAP + m;
  if (t.quotedTweet) h += EMBED_GAP + measureEmbed(t.quotedTweet, inner, fontMgr);
  return h + EMBED_PADDING;
}

type EmbedProps = { tweet: Tweet; x: number; y: number; width: number; palette: Palette; fontMgr: SkTypefaceFontProvider };

function Embed({ tweet, x, y, width, palette, fontMgr }: EmbedProps) {
  const inner = width - EMBED_PADDING * 2;
  const ix = x + EMBED_PADDING;
  let cy = y + EMBED_PADDING;

  const name = buildSimpleParagraph(fontMgr, tweet.author.name, {
    size: EMBED_FONT_SIZE_NAME, weight: FONT_WEIGHT_BOLD, color: palette.textPrimary, maxWidth: 400,
  });
  const handle = buildSimpleParagraph(fontMgr, `@${tweet.author.handle.replace(/^@/, "")}`, {
    size: EMBED_FONT_SIZE_HANDLE, weight: FONT_WEIGHT_REGULAR, color: palette.textMuted, maxWidth: 300,
  });
  const textX = ix + EMBED_AVATAR_SIZE + EMBED_AVATAR_GAP;
  const authorY = cy;
  cy += EMBED_AVATAR_SIZE;

  let body: ReturnType<typeof buildEmbedTextLayout> | null = null;
  let bodyY = 0;
  if (hasText(tweet)) {
    cy += EMBED_GAP;
    body = buildEmbedTextLayout(fontMgr, tweet.text, inner, palette.textPrimary);
    bodyY = cy;
    cy += body.height;
  }

  const mh = mediaHeight(tweet, inner);
  let mediaY = 0;
  if (mh > 0) { cy += EMBED_GAP; mediaY = cy; cy += mh; }

  let nestedY = 0;
  if (tweet.quotedTweet) { cy += EMBED_GAP; nestedY = cy; }

  const boxHeight = measureEmbed(tweet, width, fontMgr);

  return (
    <Group>
      <RoundedRect
        x={x + EMBED_BORDER_WIDTH / 2} y={y + EMBED_BORDER_WIDTH / 2}
        width={width - EMBED_BORDER_WIDTH} height={boxHeight - EMBED_BORDER_WIDTH}
        r={EMBED_RADIUS} style="stroke" strokeWidth={EMBED_BORDER_WIDTH} color={palette.textMuted}
      />
      <Avatar uri={tweet.author.avatar} x={ix} y={authorY} size={EMBED_AVATAR_SIZE} />
      <TweetText paragraph={name.paragraph} x={textX} y={authorY + (EMBED_AVATAR_SIZE - name.height) / 2} width={name.width} />
      <TweetText paragraph={handle.paragraph} x={textX + name.width + 10} y={authorY + (EMBED_AVATAR_SIZE - handle.height) / 2} width={handle.width} />
      {body && <TweetText paragraph={body.paragraph} x={ix} y={bodyY} width={inner} />}
      {mh > 0 && <ImageGrid media={tweet.media} x={ix} y={mediaY} width={inner} height={mh} radius={EMBED_MEDIA_RADIUS} />}
      {tweet.quotedTweet && (
        <Embed tweet={tweet.quotedTweet} x={ix} y={nestedY} width={inner} palette={palette} fontMgr={fontMgr} />
      )}
    </Group>
  );
}

function measure({ data, width, fontMgr }: ElementVariantProps): number {
  return measureEmbed(data, width, fontMgr);
}

function Render({ data, x, y, width, palette, fontMgr }: ElementRenderProps) {
  return <Embed tweet={data} x={x} y={y} width={width} palette={palette} fontMgr={fontMgr} />;
}

export const QuoteEmbedDefault: ElementVariant = { measure, Render };