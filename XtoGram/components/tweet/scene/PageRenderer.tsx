import { memo, useEffect } from "react";
import { Canvas, Group, Rect, useCanvasRef } from "@shopify/react-native-skia";
import { useTweetFonts } from "../skia/fonts";
import { elementRegistry } from "./registry";
import { PAGE_HEIGHT, PAGE_WIDTH, type Page } from "./plan";
import type { CardTemplate } from "./types";
import { PADDING } from "../skia/layout";           // extend the existing layout import
import { buildSimpleParagraph } from "../skia/paragraphs";
import { TweetText } from "../skia/TweetText";
import { FONT_WEIGHT_REGULAR } from "../skia/fonts";
import { hasEdits } from "../../../utils/conversation";
import { RoundedRect } from "@shopify/react-native-skia";    // extend the existing Skia import
import { AVATAR_SIZE, COMPACT_AVATAR_SIZE } from "../skia/layout";
import type { StackItem } from "./stack";

type Props = {
  page: Page;
  template: CardTemplate;
  width: number;                                  // display width; height follows 4:5
  canvasRef?: ReturnType<typeof useCanvasRef>;
  pageColor?: string;
  onReady?: () => void;
};

const RAIL_WIDTH = 4;
const RAIL_GAP = 10;   // breathing room between the line and the avatar

// Where an item's avatar sits, or null if its author block has no left-hand avatar.
function avatarOf(item: StackItem) {
  const el = item.layout.positioned.find((p) => p.element.type === "authorBlock");
  if (!el) return null;
  const size = el.element.variant === "compact" ? COMPACT_AVATAR_SIZE : el.element.variant === "default" ? AVATAR_SIZE : null;
  if (!size) return null;
  return { cx: el.x + size / 2, top: item.y + el.y, bottom: item.y + el.y + size };
}

function Rail({ page, offsetY, color }: { page: Page; offsetY: number; color: string }) {
  const avatars = page.items.map(avatarOf);
  const pageTop = -offsetY;
  const pageBottom = PAGE_HEIGHT / page.scale - offsetY;
  const segments: { x: number; y1: number; y2: number }[] = [];

  avatars.forEach((a, i) => {
    if (!a) return;
    const next = avatars[i + 1];
    if (next) segments.push({ x: a.cx, y1: a.bottom + RAIL_GAP, y2: next.top - RAIL_GAP });
    if (i === 0 && page.railTop) segments.push({ x: a.cx, y1: pageTop, y2: a.top - RAIL_GAP });
    if (i === avatars.length - 1 && page.railBottom) segments.push({ x: a.cx, y1: a.bottom + RAIL_GAP, y2: pageBottom });
  });

  return (
    <>
      {segments.map((s, i) =>
        s.y2 > s.y1 ? (
          <RoundedRect key={i} x={s.x - RAIL_WIDTH / 2} y={s.y1} width={RAIL_WIDTH} height={s.y2 - s.y1} r={RAIL_WIDTH / 2} color={color} opacity={0.5} />
        ) : null,
      )}
    </>
  );
}

export const PageRenderer = memo(function PageRenderer({ page, template, width, canvasRef, pageColor, onReady }: Props) {
  const fontMgr = useTweetFonts();
  useEffect(() => {
  if (fontMgr) onReady?.();
}, [fontMgr]);

  if (!fontMgr) return null;

  const mark = hasEdits(page.items.map((i) => i.tweet))
  ? buildSimpleParagraph(fontMgr, "Edited", { size: 22, weight: FONT_WEIGHT_REGULAR, color: template.palette.textMuted, maxWidth: 200 })
  : null;

  const k = width / PAGE_WIDTH;
  const height = PAGE_HEIGHT * k;
  // Content shorter than the page is centered (in layout units).
  const offsetY = Math.max(0, (PAGE_HEIGHT / page.scale - page.contentHeight) / 2);

  return (
    <Canvas ref={canvasRef} style={{ width, height }}>
      <Rect x={0} y={0} width={width} height={height} color={pageColor ?? template.palette.cardSurface} />
      <Group transform={[{ scale: k * page.scale }]}>
        <Group transform={[{ translateY: offsetY }]}>
          {template.rail && <Rail page={page} offsetY={offsetY} color={template.palette.textMuted} />}
          {page.items.map((item) =>
            item.layout.positioned.map(({ element, x, y, width: w, height: h, data }) => {
              const variant = elementRegistry[element.type][element.variant];
              if (!variant) return null;
              return (
                <variant.Render
                  key={`${item.tweet.id}-${element.id}`}
                  data={data}
                  x={x}
                  y={item.y + y}
                  width={w}
                  height={h}
                  palette={template.palette}
                  style={element.style}
                  fontMgr={fontMgr}
                />
              );
            }),
          )}
        </Group>
      </Group>
      {mark && (
        <Group transform={[{ scale: k }]}>
          <TweetText paragraph={mark.paragraph} x={PAGE_WIDTH - PADDING - mark.width} y={PAGE_HEIGHT - 24 - mark.height} width={mark.width} />
        </Group>
      )}
    </Canvas>
  );
});