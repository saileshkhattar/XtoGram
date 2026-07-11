import { Skia, TextAlign, type SkTypefaceFontProvider, type SkParagraph } from "@shopify/react-native-skia";
import { formatRelativeTime } from "./formatTime";
import { FONT_FAMILY, FONT_WEIGHT_BOLD, FONT_WEIGHT_REGULAR } from "./fonts";
import { FONT_SIZE_NAME, FONT_SIZE_HANDLE, FONT_SIZE_BODY, LINE_HEIGHT_BODY, NAME_HANDLE_GAP } from "./layout";

// All Skia paragraph building is centralized here as plain functions
// (not hooks/components) so a template can compute a full layout —
// every text block's height — in one pass via useMemo, before
// rendering anything. That's what lets later elements (media,
// engagement row) be positioned correctly without measure-then-render
// round trips.

function buildParagraph(
  fontMgr: SkTypefaceFontProvider,
  text: string,
  opts: { size: number; weight: number; color: string; maxWidth: number; height?: number },
): SkParagraph {
  const builder = Skia.ParagraphBuilder.Make({ textAlign: TextAlign.Left }, fontMgr);
  builder.pushStyle({
    color: Skia.Color(opts.color),
    fontSize: opts.size,
    fontFamilies: [FONT_FAMILY],
    fontStyle: { weight: opts.weight },
    ...(opts.height ? { heightMultiplier: opts.height / opts.size } : {}),
  });
  builder.addText(text);
  const paragraph = builder.build();
  paragraph.layout(opts.maxWidth);
  return paragraph;
}

export interface AuthorRowLayout {
  nameParagraph: SkParagraph;
  subParagraph: SkParagraph;
  nameWidth: number;
  nameHeight: number;
  subHeight: number;
  totalHeight: number;
}

export function buildAuthorRowLayout(
  fontMgr: SkTypefaceFontProvider,
  name: string,
  handle: string,
  createdAt: string,
  maxWidth: number,
): AuthorRowLayout {
  const nameParagraph = buildParagraph(fontMgr, name, {
    size: FONT_SIZE_NAME,
    weight: FONT_WEIGHT_BOLD,
    color: "#F0EEF8",
    maxWidth,
  });

  const subText = `@${handle.replace(/^@/, "")} · ${formatRelativeTime(createdAt)}`;
  const subParagraph = buildParagraph(fontMgr, subText, {
    size: FONT_SIZE_HANDLE,
    weight: FONT_WEIGHT_REGULAR,
    color: "#6B6880",
    maxWidth,
  });

  const nameHeight = nameParagraph.getHeight();
  const subHeight = subParagraph.getHeight();

  return {
    nameParagraph,
    subParagraph,
    nameWidth: nameParagraph.getLongestLine(),
    nameHeight,
    subHeight,
    totalHeight: nameHeight + NAME_HANDLE_GAP + subHeight,
  };
}

export interface BodyTextLayout {
  paragraph: SkParagraph;
  height: number;
}

export function buildBodyTextLayout(
  fontMgr: SkTypefaceFontProvider,
  text: string,
  maxWidth: number,
): BodyTextLayout {
  const paragraph = buildParagraph(fontMgr, text, {
    size: FONT_SIZE_BODY,
    weight: FONT_WEIGHT_REGULAR,
    color: "#F0EEF8",
    maxWidth,
    height: LINE_HEIGHT_BODY,
  });
  return { paragraph, height: paragraph.getHeight() };
}

export function buildSimpleParagraph(
  fontMgr: SkTypefaceFontProvider,
  text: string,
  opts: { size: number; weight: number; color: string; maxWidth: number },
): { paragraph: SkParagraph; height: number; width: number } {
  const paragraph = buildParagraph(fontMgr, text, opts);
  return { paragraph, height: paragraph.getHeight(), width: paragraph.getLongestLine() };
}