import type { Tier } from "../config/tiers.js";

export type ConversationKind = "single" | "thread" | "chain";

export interface TweetAuthor {
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
  verifiedType: string | null;
  followers: number;
}

export interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  bookmarks: number;
}

export interface TweetMedia {
  url: string;
  width: number;
  height: number;
}

export interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  lang: string;
  url: string;
  isReply: boolean;
  isQuote: boolean;
  isRetweet: boolean;
  inReplyToId: string | null;
  conversationId: string | null;     // root tweet id of the conversation
  inReplyToHandle: string | null;    // from inReplyToUsername, no "@"
  quotedTweetId: string | null;      // id of the quoted tweet, even when only a stub came back
  metrics: TweetMetrics;
  author: TweetAuthor;
  media: TweetMedia[];
  hashtags: string[];
  mentions: string[];
  quotedTweet: Tweet | null;
  parentTweet: Tweet | null;
}


export interface ConversationResponse {
  kind: ConversationKind;
  focusTweetId: string;
  focusIndex: number;
  nodes: Tweet[];                       // oldest first, capped to the tier
  more: {
    earlier: boolean;
    later: boolean;
    deeperQuote: boolean;               // set in L4c
    truncatedByPageCap: boolean;
    budgetExhausted: boolean
  };
  limits: { tier: Tier; maxNodes: number; quoteDepth: number };
  defaultRange: { start: number; end: number };   // inclusive; the initial selection
  guest?: GuestInfo;
}

export type GuestInfo = { remaining: number; limited: boolean };
