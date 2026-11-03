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
  conversationId: string | null;     
  inReplyToHandle: string | null;    
  quotedTweetId: string | null;      
  metrics: TweetMetrics;
  author: TweetAuthor;
  media: TweetMedia[];
  hashtags: string[];
  mentions: string[];
  quotedTweet: Tweet | null;
  parentTweet: Tweet | null;
  edited?: boolean;     // set locally when the user changed text or photos
}
export type GuestInfo = { remaining: number; limited: boolean };

export type Tier = 'guest' | 'free' | 'premium';
export type ConversationKind = 'single' | 'thread' | 'chain';

export interface ConversationResponse {
  kind: ConversationKind;
  focusTweetId: string;
  focusIndex: number;
  defaultRange: { start: number; end: number };   // inclusive; the initial selection
  nodes: Tweet[];                                  // oldest first; the candidate range
  more: { earlier: boolean; later: boolean; deeperQuote: boolean; truncatedByPageCap: boolean, budgetExhausted: boolean };
  limits: { tier: Tier; maxNodes: number; quoteDepth: number };
  guest?: GuestInfo;
}