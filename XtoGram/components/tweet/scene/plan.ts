import type { SkTypefaceFontProvider } from "@shopify/react-native-skia";
import { computeStack, getNodeRoles, type StackItem } from "./stack";
import type { CardTemplate } from "./types";
import type { Tweet } from "../../../types/tweet";
import { splitTweetForPages } from "./split";
export const MEDIA_MAX_HEIGHT = 700;      // keeps a tall photo from filling a whole page

export const PAGE_WIDTH = 1080;
export const PAGE_HEIGHT = 1350;          // 4:5
export const FIT_AUTO = 0.8;              // at or above: one card automatically
export const FIT_FLOOR = 0.6;             // below: "fit on one page" is not offered
const FIT_STEPS = [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6];

export type Page = { items: StackItem[]; scale: number; contentHeight: number, railTop?: boolean; railBottom?: boolean; };  // contentHeight in layout units
export type PlanMode = "one" | "option" | "series";
export type PagePlan = {
  mode: PlanMode;               // one: single card; option: series by default, one page offered; series: no one-page option
  fitScale: number | null;      // largest scale at which everything fits one page, null if below the floor
  onePage: Page | null;
  series: Page[];               // one page per node
};

type PlanArgs = { nodes: Tweet[]; template: CardTemplate; fontMgr: SkTypefaceFontProvider; cardPadding?: number };

export function planPages(args: PlanArgs): PagePlan {
  // Lay out at a wider virtual width (1080 / scale), then draw shrunk: the page stays edge to edge.
  let fitScale: number | null = null;
  let onePage: Page | null = null;
  const stackRoles = getNodeRoles(args.nodes, "stack", !!args.template.rail)
  for (const s of FIT_STEPS) {
    const stack = computeStack({ ...args, roles: stackRoles, cardWidth: PAGE_WIDTH / s });
    if (stack.height <= PAGE_HEIGHT / s) {
      fitScale = s;
      onePage = { items: stack.items, scale: s, contentHeight: stack.height };
      break;
    }
  }

  const lastIndex = args.nodes.length - 1;
  const series: Page[] = args.nodes.flatMap((tweet, i) =>
    splitTweetForPages({
      tweet,
      showEngagement: i === lastIndex,
      template: args.template,
      fontMgr: args.fontMgr,
      cardPadding: args.cardPadding,
      pageWidth: PAGE_WIDTH,
      pageHeight: PAGE_HEIGHT,
      mediaMaxHeight: MEDIA_MAX_HEIGHT,
    }).map((part): Page => {
      const stack = computeStack({
        nodes: [part.tweet],
        roles: [{ showAuthor: true, showEngagement: part.showEngagement }],
        template: args.template,
        fontMgr: args.fontMgr,
        cardPadding: args.cardPadding,
        cardWidth: PAGE_WIDTH,
        mediaMaxHeight: MEDIA_MAX_HEIGHT,
      });
      return { items: stack.items, scale: 1, contentHeight: stack.height };
    }),
  );

  if (args.template.rail) {
  series.forEach((p, i) => {
    p.railTop = i > 0;                       
    p.railBottom = i < series.length - 1;    
  });
}

  const mode: PlanMode = fitScale === null ? "series" : fitScale >= FIT_AUTO ? "one" : "option";
  return { mode, fitScale, onePage, series };
}