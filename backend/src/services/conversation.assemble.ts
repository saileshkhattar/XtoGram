import type { Tweet } from "../types/tweet.js";

export interface Assembled {
  nodes: Tweet[];                  // oldest first, at most maxNodes
  focusIndex: number;
  earlier: boolean;                // a tweet exists above nodes[0]
  later: boolean;                  // a tweet exists below the last node
  missingParentId: string | null; 
  defaultRange: { start: number; end: number };   // inclusive indices into nodes // upward walk stopped: this parent isn't in the pool yet
}

const MAX_DOWN = 20;
const handleOf = (t: Tweet) => t.author.handle.toLowerCase();
export const isSelfReply = (t: Tweet) => !!t.inReplyToHandle && `@${t.inReplyToHandle}`.toLowerCase() === handleOf(t);
const earlierFirst = (a: Tweet, b: Tweet) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1); // ids are time-ordered

export function assembleConversation(args: { focus: Tweet; pool: Tweet[]; maxNodes: number }): Assembled {
  const { focus, pool, maxNodes } = args;
  const byId = new Map<string, Tweet>([...pool, focus].map((t) => [t.id, t]));

  // Parents, nearest first.
  const up: Tweet[] = [];
  let missingParentId: string | null = null;
  const seenUp = new Set([focus.id]);
  for (let cur = focus; cur.inReplyToId; ) {
    const parent = byId.get(cur.inReplyToId);
    if (!parent) { missingParentId = cur.inReplyToId; break; }
    if (seenUp.has(parent.id)) break;
    seenUp.add(parent.id);
    up.push(parent);
    cur = parent;
  }

  // Reply to someone else: a chain. Pasted tweet plus parents, nothing below.
  const replyToOther = focus.isReply && !!focus.inReplyToId && !isSelfReply(focus);
  if (replyToOther) {
    const parents = up.slice(0, Math.max(0, maxNodes - 1));
    const nodes = [...parents].reverse().concat(focus);
    return {
      nodes, focusIndex: nodes.length - 1,
      earlier: up.length > parents.length || missingParentId !== null,
      later: false, missingParentId,
      defaultRange: { start: 0, end: nodes.length - 1 }, 
    };
  }

  const children = new Map<string, Tweet[]>();
  for (const t of byId.values()) {
    const parent = t.inReplyToId ? byId.get(t.inReplyToId) : undefined;
    if (!parent || handleOf(parent) !== handleOf(t)) continue;
    children.set(parent.id, [...(children.get(parent.id) ?? []), t]);
  }
  const down: Tweet[] = [focus];
  const seenDown = new Set([focus.id]);
  while (down.length < MAX_DOWN) {
    const next = (children.get(down[down.length - 1].id) ?? [])
      .filter((c) => !seenDown.has(c.id)).sort(earlierFirst)[0];
    if (!next) break;
    seenDown.add(next.id);
    down.push(next);
  }

  // Candidates: up to maxNodes-1 above and below the pasted tweet.
  const upCand = up.slice(0, Math.max(0, maxNodes - 1));
  const downCand = down.slice(0, maxNodes);
  const nodes = [...upCand].reverse().concat(downCand);
  const focusIndex = upCand.length;

  // Default selection: pasted tweet plus downward; if the thread ends soon, fill upward.
  const takenCount = Math.min(down.length, maxNodes);
  const fill = Math.max(0, maxNodes - takenCount);
  const start = focusIndex - Math.min(fill, upCand.length);

  return {
    nodes,
    focusIndex,
    defaultRange: { start, end: focusIndex + takenCount - 1 },
    earlier: up.length > upCand.length || missingParentId !== null,
    later: down.length > downCand.length,
    missingParentId,
  };
}

export function kindOf(nodes: Tweet[]): "single" | "thread" | "chain" {
  if (nodes.length <= 1) return "single";
  const first = handleOf(nodes[0]);
  return nodes.every((n) => handleOf(n) === first) ? "thread" : "chain";
}