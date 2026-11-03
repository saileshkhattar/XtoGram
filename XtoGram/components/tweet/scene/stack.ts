import type { SkTypefaceFontProvider } from "@shopify/react-native-skia";
import { PADDING } from "../skia/layout";
import { computeElementLayout, type ComputedLayout } from "./Layoutengine";
import type { CardTemplate, ElementType } from "./types";
import type { Tweet } from "../../../types/tweet";

const NODE_GAP = 44;   // between stacked tweets (the rail goes here later)

export type NodeRole = { showAuthor: boolean; showEngagement: boolean };
export type StackItem = { tweet: Tweet; layout: ComputedLayout; y: number };
export type Stack = { items: StackItem[]; height: number };

export function getNodeRoles(nodes: Tweet[], layout: "stack" | "series", alwaysShowAuthor = false): NodeRole[] {
  return nodes.map((n, i) => ({
    showAuthor: alwaysShowAuthor || layout === "series" || i === 0 || n.author.handle !== nodes[i - 1].author.handle,
    showEngagement: i === nodes.length - 1,
  }));
}
function skipTypesFor(role: NodeRole): ElementType[] {
  const skip: ElementType[] = [];
  if (!role.showAuthor) skip.push("authorBlock");
  if (!role.showEngagement) skip.push("engagementRow");
  return skip;
}

export function computeStack(args: {
  nodes: Tweet[];
  roles: NodeRole[];
  template: CardTemplate;
  fontMgr: SkTypefaceFontProvider;
  cardPadding?: number;
  cardWidth: number;
  mediaMaxHeight?: number
}): Stack {
  const { nodes, roles, template, fontMgr, cardPadding, cardWidth, mediaMaxHeight } = args;
  const padding = cardPadding ?? PADDING;
  let y = padding;
  const items = nodes.map((tweet, i) => {
    const layout = computeElementLayout({
      tweet, template, fontMgr, cardPadding, cardWidth, bare: true, skipTypes: skipTypesFor(roles[i]),mediaMaxHeight,
    });
    const item: StackItem = { tweet, layout, y };
    y += layout.cardHeight + (i < nodes.length - 1 ? NODE_GAP : 0);
    return item;
  });
  return { items, height: y + padding };
}