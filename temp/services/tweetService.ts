import { Tweet, TweetAuthor, TweetMetrics, TweetMedia, ParsedTweetResponse } from '../types/tweet'

const TWITTER_API_KEY = process.env.TWITTER_API_KEY || ''
console.log('API KEY:', TWITTER_API_KEY)
const BASE_URL = 'https://api.twitterapi.io/twitter'
const MAX_CHAIN_DEPTH = 5
const CHAIN_DELAY_MS = 3000

// Helper — delay between requests
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper — extract tweet ID from URL
export const extractTweetId = (url: string): string | null => {
  const match = url.match(/status\/(\d+)/)
  return match ? match[1] : null
}

// Helper — fetch raw tweet from API
const fetchRawTweet = async (tweetId: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/tweets?tweet_ids=${tweetId}`, {
    headers: {
      'x-api-key': TWITTER_API_KEY,
    },
  })

  console.log(response)

    if (!response.ok) {
    const errorBody = await response.text()
    console.error('API error status:', response.status)
    console.error('API error body:', errorBody)
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  return data?.tweets?.[0] || null
}

// Parser — raw API response into clean Tweet shape
const parseTweet = (t: any): Tweet => {
  const author: TweetAuthor = {
    name: t.author?.name || '',
    handle: `@${t.author?.userName || ''}`,
    avatar: t.author?.profilePicture || '',
    verified: t.author?.isBlueVerified || false,
    verifiedType: t.author?.verifiedType || null,
    followers: t.author?.followers || 0,
  }

  const metrics: TweetMetrics = {
    likes: t.likeCount || 0,
    retweets: t.retweetCount || 0,
    replies: t.replyCount || 0,
    quotes: t.quoteCount || 0,
    bookmarks: t.bookmarkCount || 0,
  }

  const media: TweetMedia[] = (t.extendedEntities?.media || [])
    .filter((m: any) => m.type === 'photo')
    .map((m: any) => ({
      url: m.media_url_https,
      width: m.original_info?.width || 0,
      height: m.original_info?.height || 0,
    }))

  const quotedTweet = t.quoted_tweet ? parseTweet(t.quoted_tweet) : null

  return {
    id: t.id,
    text: t.text,
    createdAt: t.createdAt,
    lang: t.lang || 'en',
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
  }
}

// Recursive — fetch reply chain up to MAX_CHAIN_DEPTH
const fetchChain = async (tweetId: string, depth: number = 0): Promise<Tweet[]> => {
  if (depth >= MAX_CHAIN_DEPTH) return []

  const raw = await fetchRawTweet(tweetId)
  if (!raw) return []

  const tweet = parseTweet(raw)
  const inReplyToId = raw.inReplyToId || raw.in_reply_to_status_id_str

  if (!inReplyToId) return [tweet]

  await delay(CHAIN_DELAY_MS)
  const parentChain = await fetchChain(inReplyToId, depth + 1)

  return [...parentChain, tweet]
}

// Main — entry point called by controller
export const processTweet = async (url: string): Promise<ParsedTweetResponse> => {
  const tweetId = extractTweetId(url)
  if (!tweetId) throw new Error('Invalid tweet URL')

  const raw = await fetchRawTweet(tweetId)
  if (!raw) throw new Error('Tweet not found')

  const tweet = parseTweet(raw)

  if (tweet.isReply && tweet.inReplyToId) {
    await delay(CHAIN_DELAY_MS)
    const parentChain = await fetchChain(tweet.inReplyToId, 0)
    return {
      type: 'reply',
      focusTweetId: tweetId,
      chain: [...parentChain, tweet],
    }
  }

  return { type: 'original', tweet }
}