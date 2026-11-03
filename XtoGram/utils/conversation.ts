import type { Tweet } from '../types/tweet';
import type { TweetType } from '../components/tweet/scene/types';
import type { ConversationResponse } from '../types/tweet';
import { TweetMedia } from '../types/tweet';

export type Selection = { start: number; end: number; quoteDepth: number };
export type TweetOverride = { text?: string; media?: TweetMedia[] };
export type Overrides = Record<string, TweetOverride>;

// Tapping a row sets a boundary of the range. Outside the range: extend to it.
// Inside the range: drop that tweet and everything beyond it. The pasted tweet never leaves.
export function tapRow(
  sel: Selection, i: number, focusIndex: number, maxNodes: number,
): { sel: Selection } | { blocked: 'pinned' | 'cap' } {
  if (i === focusIndex) return { blocked: 'pinned' };
  if (i >= sel.start && i <= sel.end) {
    return { sel: i < focusIndex ? { ...sel, start: i + 1 } : { ...sel, end: i - 1 } };
  }
  const next = i < sel.start ? { ...sel, start: i } : { ...sel, end: i };
  return next.end - next.start + 1 > maxNodes ? { blocked: 'cap' } : { sel: next };
}

// A row outside the range that can't be added because it would pass the tier cap.
export function isRowLocked(sel: Selection, i: number, maxNodes: number): boolean {
  if (i >= sel.start && i <= sel.end) return false;
  const span = i < sel.start ? sel.end - i + 1 : i - sel.start + 1;
  return span > maxNodes;
}

// The label for the third tab, or null when there is nothing to choose.
export function contentTabLabel(c: ConversationResponse, selectedCount: number): string | null {
  if (c.nodes.length > 1) return `${c.kind === 'chain' ? 'Replies' : 'Thread'} (${selectedCount})`;
  if (c.nodes[0]?.quotedTweet) return 'Quote';
  return 'Edit';
}

export function getShape(nodes: Tweet[]): TweetType {
  if (nodes.length === 0) return 'original';
  if (nodes.length === 1) return nodes[0].quotedTweet ? 'quote' : 'original';
  const first = nodes[0].author.handle.toLowerCase();
  return nodes.every((n) => n.author.handle.toLowerCase() === first) ? 'thread' : 'reply';
}

// Returns a copy of the tweet with its quote chain cut to `depth` levels.
export function trimQuoteDepth(tweet: Tweet, depth: number): Tweet {
  if (!tweet.quotedTweet) return tweet;
  if (depth <= 0) return { ...tweet, quotedTweet: null };
  return { ...tweet, quotedTweet: trimQuoteDepth(tweet.quotedTweet, depth - 1) };
}

export function applyOverrides(tweet: Tweet, overrides: Overrides): Tweet {
  const o = overrides[tweet.id];
  const quoted = tweet.quotedTweet ? applyOverrides(tweet.quotedTweet, overrides) : null;
  if (!o && quoted === tweet.quotedTweet) return tweet;
  return {
    ...tweet,
    ...(o?.text !== undefined && { text: o.text }),
    ...(o?.media && { media: o.media }),
    edited: !!o || tweet.edited,
    quotedTweet: quoted,
  };
}

// True if any tweet shown, or any quote inside it, was edited.
export function hasEdits(tweets: Tweet[]): boolean {
  return tweets.some((t) => !!t.edited || (!!t.quotedTweet && hasEdits([t.quotedTweet])));
}
