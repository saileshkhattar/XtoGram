export interface TweetAuthor {
  name: string
  handle: string
  avatar: string
  verified: boolean
  verifiedType: string | null
  followers: number
}

export interface TweetMetrics {
  likes: number
  retweets: number
  replies: number
  quotes: number
  bookmarks: number
}

export interface TweetMedia {
  url: string
  width: number
  height: number
}

export interface Tweet {
  id: string
  text: string
  createdAt: string
  lang: string
  url: string
  isReply: boolean
  isQuote: boolean
  isRetweet: boolean
  inReplyToId: string | null
  metrics: TweetMetrics
  author: TweetAuthor
  media: TweetMedia[]
  hashtags: string[]
  mentions: string[]
  quotedTweet: Tweet | null
  parentTweet: Tweet | null
}

export type ParsedTweetResponse =
  | { type: 'original'; tweet: Tweet }
  | { type: 'reply'; focusTweetId: string; chain: Tweet[] }