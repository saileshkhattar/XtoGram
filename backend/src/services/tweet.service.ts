import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";
import { TweetCache } from "../models/tweetCache.js";
import type {
  Tweet,
  TweetAuthor,
  TweetMetrics,
  TweetMedia,
} from "../types/tweet.js";
import { reserveGuestGeneration, refundGuestGeneration } from "./guest.service.js";
import { assembleConversation, kindOf, isSelfReply } from "./conversation.assemble.js";
import { ABSOLUTE_MAX_NODES, type TierLimits } from "../config/tiers.js";
import type { ConversationResponse } from "../types/tweet.js";
import { TIER_LIMITS, type Tier } from "../config/tiers.js";


const SEARCH_PAGE_SIZE = 20;

const BASE_URL = "https://api.twitterapi.io/twitter";
const CACHE_TTL_MINUTES = 30;
const RETRY_DELAY_MS = 12000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function extractTweetId(url: string): string | null {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
}



async function twitterGet(pathAndQuery: string): Promise<any> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(`${BASE_URL}${pathAndQuery}`, {
      headers: { "x-api-key": env.twitterApiKey },
    });

    if (response.status === 429 && attempt === 0) {
      console.warn("TwitterAPI.io 429, retrying once");
      await delay(RETRY_DELAY_MS);
      continue;
    }

    if (!response.ok) {
      console.error("TwitterAPI.io error status:", response.status);
      console.error("TwitterAPI.io error body:", await response.text());
      if (response.status === 429) {
        throw new AppError("We're busy right now. Please try again in a few seconds.", 429);
      }
      throw new AppError(`Tweet API error: ${response.status}`, 502);
    }
    return response.json();
  }
  throw new AppError("Tweet API error", 502); // unreachable, satisfies the compiler
}

async function cacheRawTweet(raw: any): Promise<void> {
  if (!raw?.id) return;
  await TweetCache.updateOne(
    { tweetId: raw.id },
    { $set: { rawData: raw, expiresAt: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000) } },
    { upsert: true },
  ).catch((err) => console.error("Failed to cache tweet:", err));
}


async function fetchRawTweet(tweetId: string): Promise<any> {
  const cached = await TweetCache.findOne({ tweetId });
  if (cached) return cached.rawData;

  const data = await twitterGet(`/tweets?tweet_ids=${tweetId}`);
  const raw = data?.tweets?.[0] || null;
  if (raw) await cacheRawTweet(raw);
  return raw;
}

export async function searchAuthorConversation(conversationId: string, handle: string): Promise<any[]> {
  const cleanHandle = handle.replace(/^@/, "");
  const query = encodeURIComponent(`conversation_id:${conversationId} from:${cleanHandle} to:${cleanHandle}`);
  const data = await twitterGet(`/tweet/advanced_search?query=${query}&queryType=Latest`);
  return data?.tweets ?? [];
}

export function parseTweet(t: any): Tweet {
  const author: TweetAuthor = {
    name: t.author?.name || "",
    handle: `@${t.author?.userName || ""}`,
    avatar: t.author?.profilePicture || "",
    verified: t.author?.isBlueVerified || false,
    verifiedType: t.author?.verifiedType || null,
    followers: t.author?.followers || 0,
  };

  const metrics: TweetMetrics = {
    likes: t.likeCount || 0,
    retweets: t.retweetCount || 0,
    replies: t.replyCount || 0,
    quotes: t.quoteCount || 0,
    bookmarks: t.bookmarkCount || 0,
  };

  const media: TweetMedia[] = (t.extendedEntities?.media || [])
    .filter((m: any) => m.type === "photo")
    .map((m: any) => ({
      url: m.media_url_https,
      width: m.original_info?.width || 0,
      height: m.original_info?.height || 0,
    }));

  const rawQuote = t.quoted_tweet;
  const quoteIsStub = !!rawQuote && !rawQuote.author?.userName;
  const quotedTweet = rawQuote && !quoteIsStub ? parseTweet(rawQuote) : null;
  const quotedTweetId: string | null = rawQuote?.id ?? null;

  return {
    id: t.id,
    text: t.text,
    createdAt: t.createdAt,
    lang: t.lang || "en",
    url: t.twitterUrl,
    isReply: t.isReply,
    isQuote: t.isQuote,
    isRetweet: t.isRetweet,
    inReplyToId: t.inReplyToId || null,
    conversationId: t.conversationId || null,
    inReplyToHandle: t.inReplyToUsername || null,
    metrics,
    author,
    media,
    hashtags: (t.entities?.hashtags || []).map((h: any) => h.text),
    mentions: (t.entities?.user_mentions || []).map((m: any) => m.screen_name),
    quotedTweet,
    quotedTweetId,
    parentTweet: null,
  };
}

function limitQuoteDepth(t: Tweet, depth: number): void {
  if (!t.quotedTweet) return;
  if (depth <= 0) { t.quotedTweet = null; return; }
  limitQuoteDepth(t.quotedTweet, depth - 1);
}


function hasDeeperQuote(t: Tweet): boolean {
  let q = t.quotedTweet;
  while (q?.quotedTweet) q = q.quotedTweet;
  return !!q?.quotedTweetId;
}

export async function buildConversation(
  tweetId: string,
  limits: TierLimits,
): Promise<Omit<ConversationResponse, "limits" | "guest">> {
  const maxNodes = Math.min(limits.maxNodes, ABSOLUTE_MAX_NODES);

  const focusWasCached = !!(await TweetCache.exists({ tweetId }));
  const rawFocus = await fetchRawTweet(tweetId);
  if (!rawFocus) throw new AppError("Tweet not found", 404);

  let lastWasLive = !focusWasCached;
  const gap = async () => { if (lastWasLive) await delay(env.twitterCallDelayMs); };

  const resolveQuotes = async (nodes: Tweet[], range: { start: number; end: number }) => {
  for (let i = range.start; i <= range.end; i++) {
    let holder = nodes[i];
    for (let level = 1; level < limits.quoteDepth; level++) {
      const q = holder.quotedTweet;
      if (!q) break;
      if (!q.quotedTweet && q.quotedTweetId) {
        const cached = !!(await TweetCache.exists({ tweetId: q.quotedTweetId }));
        if (!cached) await gap();
        const raw = await fetchRawTweet(q.quotedTweetId);
        lastWasLive = !cached;
        if (!raw) break;                 // deleted or protected
        q.quotedTweet = parseTweet(raw);
      }
      holder = q;
    }
  }
  nodes.forEach((n) => limitQuoteDepth(n, limits.quoteDepth));  // also trims what a fetch brought along
  return nodes.some(hasDeeperQuote);
};


  const focus = parseTweet(rawFocus);

  // Nothing to assemble: tier allows one tweet, or a plain tweet with no replies.
  if (maxNodes <= 1 || (!focus.isReply && focus.metrics.replies === 0)) {

    const deeperQuote = await resolveQuotes([focus], { start: 0, end: 0 });

    return {
      kind: "single",
      focusTweetId: tweetId,
      focusIndex: 0,
      defaultRange: { start: 0, end: 0 },
      nodes: [focus],
      more: { earlier: !!focus.inReplyToId, later: false, deeperQuote: deeperQuote, truncatedByPageCap: false },
    };
  }


  const pool: Tweet[] = [];
  let truncatedByPageCap = false;

  // Threads: a self-reply, or a top tweet that has replies. Replies to strangers skip the search.
  if (isSelfReply(focus) || (!focus.isReply && focus.metrics.replies > 0)) {
    await gap();
    const page = (await searchAuthorConversation(focus.conversationId ?? focus.id, focus.author.handle)).map(parseTweet);
    lastWasLive = true;
    pool.push(...page);

    // Newest first, so the last item is the oldest. A full page whose oldest tweet
    // sits after the focus and points at a tweet we don't hold means the thread was cut off.
    const oldest = page[page.length - 1];
    const known = new Set([focus.id, ...page.map((t) => t.id)]);
    truncatedByPageCap =
      page.length >= SEARCH_PAGE_SIZE &&
      !!oldest?.inReplyToId &&
      !known.has(oldest.inReplyToId) &&
      BigInt(oldest.id) > BigInt(focus.id);
  }

  // Walk up by id until the window is full or the top is reached.
  let result = assembleConversation({ focus, pool, maxNodes });
  let parentUnavailable = false;
  for (let i = 0; i < maxNodes && result.missingParentId && result.focusIndex < maxNodes - 1; i++) {
    const parentId = result.missingParentId;
    const cached = !!(await TweetCache.exists({ tweetId: parentId }));
    if (!cached) await gap();
    const rawParent = await fetchRawTweet(parentId);
    lastWasLive = !cached;
    if (!rawParent) { parentUnavailable = true; break; }   // deleted or protected
    pool.push(parseTweet(rawParent));
    result = assembleConversation({ focus, pool, maxNodes });
  }
  if (parentUnavailable) result = { ...result, earlier: false };

  const deeperQuote = await resolveQuotes(result.nodes, result.defaultRange);

  return {
    kind: kindOf(result.nodes),
    focusTweetId: tweetId,
    focusIndex: result.focusIndex,
    nodes: result.nodes,
    defaultRange: { start: 0, end: 0 },
    more: {
      earlier: result.earlier,
      later: result.later || truncatedByPageCap,
      deeperQuote: deeperQuote,           // L4c
      truncatedByPageCap,
    },
  };
}

// Recursively walks up the reply chain. Only delays between calls that
// actually hit the external API — cached parents resolve instantly, so
// re-viewing a thread you've already loaded doesn't pay the 3s tax again.
// async function fetchChain(tweetId: string, depth = 0): Promise<Tweet[]> {
//   if (depth >= MAX_CHAIN_DEPTH) return [];

//   const wasCached = await TweetCache.exists({ tweetId });
//   const raw = await fetchRawTweet(tweetId);
//   if (!raw) return [];

//   const tweet = parseTweet(raw);
//   const inReplyToId = raw.inReplyToId || raw.in_reply_to_status_id_str;

//   if (!inReplyToId) return [tweet];

//   if (!wasCached) await delay(env.twitterCallDelayMs);
//   const parentChain = await fetchChain(inReplyToId, depth + 1);

//   return [...parentChain, tweet];
// }

// export async function processTweet(url: string, guestId?: string): Promise<ParsedTweetResponse> {
//   const tweetId = extractTweetId(url);
//   console.log("tweetid", tweetId)
//   if (!tweetId) throw new AppError("Invalid tweet URL", 400);

//   const wasCached = await TweetCache.exists({ tweetId });
//   const raw = await fetchRawTweet(tweetId);
//   if (!raw) throw new AppError("Tweet not found", 404);

//   if (guestId) {
//     const reservation = await reserveGuestGeneration(guestId, tweetId);
//     try {
//       const raw = await fetchRawTweet(tweetId);
//       if (!raw) throw new AppError("Tweet not found", 404);

//       const parsed = parseTweet(raw);
//       const tweet: Tweet = { ...parsed, quotedTweet: null, parentTweet: null };

//       return {
//         type: "original",
//         tweet,
//         guest: {
//           remaining: reservation.remaining,
//           limited: parsed.isReply || parsed.isQuote,
//         },
//       };
//     } catch (err) {
//       if (reservation.charged) await refundGuestGeneration(guestId, tweetId);
//       throw err;
//     }
//   }

//   const tweet = parseTweet(raw);

//   if (tweet.isReply && tweet.inReplyToId) {
//     if (!wasCached) await delay(env.twitterCallDelayMs);
//     const parentChain = await fetchChain(tweet.inReplyToId, 0);
//     return {
//       type: "reply",
//       focusTweetId: tweetId,
//       chain: [...parentChain, tweet],
//     };
//   }

//   return { type: "original", tweet };
// }

export async function processConversation(
  url: string,
  tier: Tier,
  guestId?: string,
): Promise<ConversationResponse> {
  const tweetId = extractTweetId(url);
  if (!tweetId) throw new AppError("Invalid tweet URL", 400);

  const limits = TIER_LIMITS[tier];
  const reservation = guestId ? await reserveGuestGeneration(guestId, tweetId) : null;

  try {
    const conversation = await buildConversation(tweetId, limits);
    const focus = conversation.nodes[conversation.focusIndex];
    return {
      ...conversation,
      limits: { tier, ...limits },
      ...(reservation && {
        guest: { remaining: reservation.remaining, limited: focus.isReply || focus.isQuote },
      }),
    };
  } catch (err) {
    if (reservation?.charged && guestId) await refundGuestGeneration(guestId, tweetId);
    throw err;
  }
}