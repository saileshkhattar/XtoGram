import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";
import { TweetCache } from "../models/tweetCache.js";
import type {
  Tweet,
  TweetAuthor,
  TweetMetrics,
  TweetMedia,
  ParsedTweetResponse,
} from "../types/tweet.js";

const BASE_URL = "https://api.twitterapi.io/twitter";
const MAX_CHAIN_DEPTH = 5;
const CHAIN_DELAY_MS = 3000;
const CACHE_TTL_MINUTES = 30;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function extractTweetId(url: string): string | null {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
}

// Checks the Mongo cache first; only hits TwitterAPI.io on a miss.
// Returns the raw (unparsed) API shape either way.
async function fetchRawTweet(tweetId: string): Promise<any> {
  const cached = await TweetCache.findOne({ tweetId });
  if (cached) return cached.rawData;

  const response = await fetch(`${BASE_URL}/tweets?tweet_ids=${tweetId}`, {
    headers: { "x-api-key": env.twitterApiKey },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("TwitterAPI.io error status:", response.status);
    console.error("TwitterAPI.io error body:", errorBody);
    throw new AppError(`Tweet API error: ${response.status}`, 502);
  }

  const data = await response.json();
  const raw = data?.tweets?.[0] || null;

  if (raw) {
    await TweetCache.create({
      tweetId,
      rawData: raw,
      expiresAt: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000),
    }).catch((err) => {
      // Cache writes should never break the actual request.
      console.error("Failed to cache tweet:", err);
    });
  }

  return raw;
}

function parseTweet(t: any): Tweet {
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

  const quotedTweet = t.quoted_tweet ? parseTweet(t.quoted_tweet) : null;

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
    metrics,
    author,
    media,
    hashtags: (t.entities?.hashtags || []).map((h: any) => h.text),
    mentions: (t.entities?.user_mentions || []).map((m: any) => m.screen_name),
    quotedTweet,
    parentTweet: null,
  };
}

// Recursively walks up the reply chain. Only delays between calls that
// actually hit the external API — cached parents resolve instantly, so
// re-viewing a thread you've already loaded doesn't pay the 3s tax again.
async function fetchChain(tweetId: string, depth = 0): Promise<Tweet[]> {
  if (depth >= MAX_CHAIN_DEPTH) return [];

  const wasCached = await TweetCache.exists({ tweetId });
  const raw = await fetchRawTweet(tweetId);
  if (!raw) return [];

  const tweet = parseTweet(raw);
  const inReplyToId = raw.inReplyToId || raw.in_reply_to_status_id_str;

  if (!inReplyToId) return [tweet];

  if (!wasCached) await delay(CHAIN_DELAY_MS);
  const parentChain = await fetchChain(inReplyToId, depth + 1);

  return [...parentChain, tweet];
}

export async function processTweet(url: string): Promise<ParsedTweetResponse> {
  const tweetId = extractTweetId(url);
  if (!tweetId) throw new AppError("Invalid tweet URL", 400);

  const wasCached = await TweetCache.exists({ tweetId });
  const raw = await fetchRawTweet(tweetId);
  if (!raw) throw new AppError("Tweet not found", 404);

  const tweet = parseTweet(raw);

  if (tweet.isReply && tweet.inReplyToId) {
    if (!wasCached) await delay(CHAIN_DELAY_MS);
    const parentChain = await fetchChain(tweet.inReplyToId, 0);
    return {
      type: "reply",
      focusTweetId: tweetId,
      chain: [...parentChain, tweet],
    };
  }

  return { type: "original", tweet };
}