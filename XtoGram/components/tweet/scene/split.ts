import type { SkTypefaceFontProvider } from "@shopify/react-native-skia";
import { computeStack } from "./stack";
import type { CardTemplate } from "./types";
import type { Tweet } from "../../../types/tweet";

export type PagePart = { tweet: Tweet; showEngagement: boolean };

const MAX_PAGES = 12;   // safety: a 25,000-character post can't create endless pages

// Cut at a paragraph, then a line, then a word break, but not too early in the chunk.
function snapToBoundary(text: string, n: number): number {
  if (n >= text.length) return text.length;
  const head = text.slice(0, n);
  const floor = Math.floor(n * 0.6);
  const para = head.lastIndexOf("\n\n");
  if (para >= floor) return para;
  const line = head.lastIndexOf("\n");
  if (line >= floor) return line;
  const space = head.lastIndexOf(" ");
  return space >= floor ? space : n;
}

export function splitTweetForPages(a: {
  tweet: Tweet;
  showEngagement: boolean;
  template: CardTemplate;
  fontMgr: SkTypefaceFontProvider;
  cardPadding?: number;
  pageWidth: number;
  pageHeight: number;
  mediaMaxHeight: number;
}): PagePart[] {
  const { tweet, showEngagement } = a;

  const fits = (t: Tweet, engagement: boolean) =>
    computeStack({
      nodes: [t],
      roles: [{ showAuthor: true, showEngagement: engagement }],
      template: a.template,
      fontMgr: a.fontMgr,
      cardPadding: a.cardPadding,
      cardWidth: a.pageWidth,
      mediaMaxHeight: a.mediaMaxHeight,
    }).height <= a.pageHeight;

  if (fits(tweet, showEngagement)) return [{ tweet, showEngagement }];

  const hasMedia = tweet.media.length > 0;
  const hasQuote = !!tweet.quotedTweet;
  const hasParts = hasMedia || hasQuote;
  const textOnly = (text: string): Tweet => ({ ...tweet, text, media: [], quotedTweet: null });

  const parts: PagePart[] = [];
  let remaining = tweet.text.trim();
  let finalEngagement = showEngagement && !hasParts;

  // Phase 1: cut the text into pages.
  while (parts.length < MAX_PAGES - 1) {
    if (fits(textOnly(remaining), finalEngagement)) break;
    // Only the engagement row tips it over: keep the text, drop the row.
    if (finalEngagement && fits(textOnly(remaining), false)) { finalEngagement = false; break; }

    let lo = 1, hi = remaining.length, best = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (fits(textOnly(remaining.slice(0, mid)), false)) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    if (best === 0) best = Math.min(remaining.length, 200);   // force progress
    let cut = snapToBoundary(remaining, best);
    if (cut <= 0) cut = best;

    parts.push({ tweet: textOnly(remaining.slice(0, cut).trimEnd()), showEngagement: false });
    remaining = remaining.slice(cut).trimStart();
    if (!remaining) break;
  }

  // Phase 2: put the images and then the quote on the last page, or on pages of their own.
  let current = textOnly(remaining);
  let hasContent = remaining.length > 0;
  const pending: Array<"media" | "quote"> = [];
  if (hasMedia) pending.push("media");
  if (hasQuote) pending.push("quote");

  while (pending.length) {
    const next = pending[0];
    const isFinal = pending.length === 1;
    const candidate: Tweet = next === "media" ? { ...current, media: tweet.media } : { ...current, quotedTweet: tweet.quotedTweet };

    if (fits(candidate, showEngagement && isFinal)) {
      current = candidate; hasContent = true; pending.shift(); continue;
    }
    if (hasContent) {                       // start a fresh page and try again there
      parts.push({ tweet: current, showEngagement: false });
      current = textOnly(""); hasContent = false;
      continue;
    }
    current = candidate; hasContent = true; pending.shift();   // too big even alone: accept it, clipped
  }

  parts.push({ tweet: current, showEngagement: hasParts ? showEngagement : finalEngagement });
  return parts;
}