import { useEffect, useMemo } from "react";
import { Canvas, RoundedRect, useCanvasRef } from "@shopify/react-native-skia";
import { Avatar } from "../skia/Avatar";
import { AuthorRow } from "../skia/AuthorRow";
import { TweetText } from "../skia/TweetText";
import { ImageGrid } from "../skia/ImageGrid";
import { EngagementRow } from "../skia/EngagementRow";
import { useTweetFonts } from "../skia/fonts";
import { buildAuthorRowLayout, buildBodyTextLayout } from "../skia/paragraphs";
import {
  CARD_WIDTH,
  PADDING,
  AVATAR_SIZE,
  AVATAR_GAP,
  AUTHOR_TO_TEXT_GAP,
  TEXT_TO_MEDIA_GAP,
  MEDIA_TO_ENGAGEMENT_GAP,
  ENGAGEMENT_ICON_SIZE,
  ENGAGEMENT_ROW_HEIGHT,
} from "../skia/layout";
import { type Tweet } from "../../../types/tweet";

type Props = {
  tweet: Tweet;
  canvasRef: ReturnType<typeof useCanvasRef>;
  onHeightComputed?: (height: number) => void;
};

const CARD_BG = "#0A0A0F";

// Clamps the media block's height so a single very tall/wide image
// doesn't blow out the card — mirrors how X caps its own image ratios.
function computeMediaHeight(tweet: Tweet, contentWidth: number): number {
  if (tweet.media.length === 0) return 0;
  if (tweet.media.length === 1) {
    const { width, height } = tweet.media[0];
    const ratio = width > 0 ? height / width : 0.6;
    const clampedRatio = Math.min(Math.max(ratio, 0.5), 1.25);
    return contentWidth * clampedRatio;
  }
  return contentWidth * 0.6;
}

export function RegularCard({ tweet, canvasRef, onHeightComputed }: Props) {
  const fontMgr = useTweetFonts();

  const contentX = PADDING + AVATAR_SIZE + AVATAR_GAP;
  const contentWidth = CARD_WIDTH - contentX - PADDING;

  const layout = useMemo(() => {
    if (!fontMgr) return null;

    const authorLayout = buildAuthorRowLayout(fontMgr, tweet.author.name, tweet.author.handle, tweet.createdAt, contentWidth);
    const bodyLayout = buildBodyTextLayout(fontMgr, tweet.text, CARD_WIDTH - PADDING * 2);

    const authorY = PADDING;
    const bodyY = authorY + authorLayout.totalHeight + AUTHOR_TO_TEXT_GAP;
    const mediaHeight = computeMediaHeight(tweet, CARD_WIDTH - PADDING * 2);
    const mediaY = bodyY + bodyLayout.height + (mediaHeight > 0 ? TEXT_TO_MEDIA_GAP : 0);
    const engagementY = mediaY + mediaHeight + MEDIA_TO_ENGAGEMENT_GAP;
    const cardHeight = engagementY + ENGAGEMENT_ROW_HEIGHT + PADDING;

    return { authorLayout, bodyLayout, authorY, bodyY, mediaHeight, mediaY, engagementY, cardHeight };
  }, [fontMgr, tweet, contentWidth]);

  useEffect(() => {
    if (layout) onHeightComputed?.(layout.cardHeight);
  }, [layout?.cardHeight]);

  if (!fontMgr || !layout) return null;

  return (
    <Canvas ref={canvasRef} style={{ width: CARD_WIDTH, height: layout.cardHeight }}>
      <RoundedRect x={0} y={0} width={CARD_WIDTH} height={layout.cardHeight} r={0} color={CARD_BG} />

      <Avatar uri={tweet.author.avatar} x={PADDING} y={layout.authorY} size={AVATAR_SIZE} />

      <AuthorRow
        layout={layout.authorLayout}
        verified={tweet.author.verified}
        x={contentX}
        y={layout.authorY}
        maxWidth={contentWidth}
      />

      <TweetText
        paragraph={layout.bodyLayout.paragraph}
        x={PADDING}
        y={layout.bodyY}
        width={CARD_WIDTH - PADDING * 2}
      />

      {tweet.media.length > 0 && (
        <ImageGrid
          media={tweet.media}
          x={PADDING}
          y={layout.mediaY}
          width={CARD_WIDTH - PADDING * 2}
          height={layout.mediaHeight}
        />
      )}

      <EngagementRow
        fontMgr={fontMgr}
        metrics={tweet.metrics}
        x={PADDING}
        y={layout.engagementY}
        width={CARD_WIDTH - PADDING * 2}
        iconSize={ENGAGEMENT_ICON_SIZE}
      />
    </Canvas>
  );
}